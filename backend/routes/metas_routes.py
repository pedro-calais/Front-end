"""Metas (negociador) dashboard endpoints."""
# routes/metas_routes.py
import calendar
from datetime import datetime
from flask import Blueprint, jsonify, request
from sqlalchemy import func, case, extract
from database import SessionLocal
from models import TBAcompanhamento

metas_bp = Blueprint("metas_bp", __name__)

# Calcula composicao, caixa e metas do negociador no mes.
@metas_bp.route("/negociador/dashboard-metas", methods=["POST"])
def dashboard_metas():
    session = SessionLocal()
    try:
        data = request.json or {}

        negociador_filtro = data.get("negociador", "Pedro Calais")
        data_ref_str = data.get("data_referencia", datetime.now().strftime("%Y-%m"))

        try:
            ano_ref, mes_ref = map(int, data_ref_str.split("-"))
        except Exception:
            hoje = datetime.now()
            ano_ref, mes_ref = hoje.year, hoje.month

        # A) CARTEIRA (COMPOSIÇÃO)
        q_carteira = session.query(
            func.sum(case((TBAcompanhamento.Status == "Novo", TBAcompanhamento.VALOR), else_=0)),
            func.sum(case((TBAcompanhamento.Status == "Aberto", TBAcompanhamento.VALOR), else_=0)),
            func.sum(case((TBAcompanhamento.Status == "Corrente", TBAcompanhamento.VALOR), else_=0)),
            func.sum(case((TBAcompanhamento.Status == "Inadimplido", TBAcompanhamento.VALOR), else_=0)),
            func.sum(TBAcompanhamento.VALOR),
        ).filter(
            TBAcompanhamento.NEGOCIADOR == negociador_filtro
        ).first()

        novos, a_vencer, corrente, inadimplido, total_geral = (
            float(x or 0) for x in (q_carteira if q_carteira else [0, 0, 0, 0, 0])
        )

        # B) CAIXA REALIZADO
        q_caixa = session.query(
            func.sum(TBAcompanhamento.Recebimento),
            func.sum(case((TBAcompanhamento.Status == "Corrente", TBAcompanhamento.Recebimento), else_=0)),
            func.sum(case((TBAcompanhamento.Status == "Inadimplido", TBAcompanhamento.Recebimento), else_=0)),
        ).filter(
            TBAcompanhamento.NEGOCIADOR == negociador_filtro,
            TBAcompanhamento.Recebimento > 0,
            extract("year", TBAcompanhamento.DATA_RECEBIMENTO) == ano_ref,
            extract("month", TBAcompanhamento.DATA_RECEBIMENTO) == mes_ref,
        ).first()

        caixa_total, caixa_corrente, caixa_inadimplido = (
            float(x or 0) for x in (q_caixa if q_caixa else [0, 0, 0])
        )

        # C) CÁLCULOS
        META_MENSAL = 3000000.00
        percentual = (caixa_total / META_MENSAL * 100) if META_MENSAL > 0 else 0

        dias_no_mes = calendar.monthrange(ano_ref, mes_ref)[1]
        dia_hoje = datetime.now().day if (datetime.now().month == mes_ref) else 1
        dias_restantes = max(1, dias_no_mes - dia_hoje)

        necessario = max(0, META_MENSAL - caixa_total)
        media_diaria = necessario / dias_restantes if necessario > 0 else 0

        return jsonify({
            "composicao_carteira": {
                "novos_acordos": novos,
                "a_vencer": a_vencer,
                "colchao_corrente": corrente,
                "colchao_inadimplido": inadimplido,
                "total_geral": total_geral,
            },
            "realizado_caixa": {
                "novos_acordos_rec": 0.0,
                "antecipado": 0.0,
                "corrente_recebido": caixa_corrente,
                "inadimplido_rec": caixa_inadimplido,
                "caixa_total": caixa_total,
            },
            "meta_global": {
                "atingido_valor": caixa_total,
                "meta_total_valor": META_MENSAL,
                "percentual": round(percentual, 1),
            },
            "simulador": {"valor_escolhido": 0.0, "ddal_atual": 0.0},
            "performance_projetada": {
                "necessario": necessario,
                "realizado": caixa_total,
                "diferenca": necessario,
                "media_diaria": media_diaria,
            },
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()
