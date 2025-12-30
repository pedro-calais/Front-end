"""Acionamentos endpoints for list and export reports."""
# routes/acionamentos_routes.py
from flask import Blueprint, jsonify, request, Response
from sqlalchemy import text
from database import SessionLocal
from datetime import datetime

acionamentos_bp = Blueprint("acionamentos_bp", __name__)

# Monta SQL base com filtros para listagem/exportacao.
def query_acionamentos_base(filtros):
    data_inicio = filtros.get("data_inicio")
    data_fim = filtros.get("data_fim")
    cliente = filtros.get("cliente")
    negociador = filtros.get("negociador")
    campanha = filtros.get("campanha")

    sql = """
        SELECT TOP 1000
            campanhaID,
            CREDOR,
            CAMPANHA,
            CPF_CNPJ_CLIENTE,
            Nome,
            NEGOCIADOR,
            CoUsuariosID,
            RO,
            DATA
        FROM [Candiotto_DBA].[dbo].[tabelaacionamento]
        WHERE 1=1
    """

    params = {}

    if data_inicio and data_fim:
        sql += " AND DATA BETWEEN :dt_inicio AND :dt_fim"
        params["dt_inicio"] = f"{data_inicio} 00:00:00"
        params["dt_fim"] = f"{data_fim} 23:59:59"

    if cliente and cliente not in ("Choose an option", ""):
        sql += " AND CREDOR = :cliente"
        params["cliente"] = cliente

    if negociador and negociador not in ("Choose an option", ""):
        sql += " AND NEGOCIADOR = :negociador"
        params["negociador"] = negociador

    if campanha and campanha not in ("Choose an option", ""):
        sql += " AND CAMPANHA = :campanha"
        params["campanha"] = campanha

    sql += " ORDER BY DATA DESC"
    return sql, params

@acionamentos_bp.route("/api/acionamentos/listar", methods=["POST"])
def listar_acionamentos():
    session = SessionLocal()
    try:
        filtros = request.json or {}
        sql, params = query_acionamentos_base(filtros)
        result = session.execute(text(sql), params).fetchall()

        lista_retorno = []
        for row in result:
            lista_retorno.append({
                "campanhaID": row.campanhaID,
                "CREDOR": row.CREDOR,
                "CAMPANHA": row.CAMPANHA,
                "CPF_CNPJ_CLIENTE": row.CPF_CNPJ_CLIENTE,
                "Nome": row.Nome,
                "NEGOCIADOR": row.NEGOCIADOR,
                "CoUsuariosID": row.CoUsuariosID,
                "RO": row.RO,
                "DATA": row.DATA.strftime("%Y-%m-%d %H:%M") if row.DATA else "-",
            })

        return jsonify(lista_retorno), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()

# Exporta o mesmo filtro em CSV para download.
@acionamentos_bp.route("/api/acionamentos/exportar", methods=["POST"])
def exportar_acionamentos():
    import io
    import csv

    session = SessionLocal()
    try:
        filtros = request.json or {}
        sql, params = query_acionamentos_base(filtros)

        sql = sql.replace("TOP 1000", "")

        result = session.execute(text(sql), params).fetchall()

        output = io.StringIO()
        writer = csv.writer(output, delimiter=";", quoting=csv.QUOTE_MINIMAL)

        writer.writerow([
            "ID Campanha", "Credor", "Campanha", "CPF/CNPJ", "Nome Cliente",
            "Negociador", "ID Usuário", "RO (Resultado)", "Data"
        ])

        for row in result:
            writer.writerow([
                row.campanhaID,
                row.CREDOR,
                row.CAMPANHA,
                row.CPF_CNPJ_CLIENTE,
                row.Nome,
                row.NEGOCIADOR,
                row.CoUsuariosID,
                row.RO,
                row.DATA.strftime("%d/%m/%Y %H:%M") if row.DATA else "-",
            ])

        output.seek(0)
        return Response(
            output.getvalue(),
            mimetype="text/csv",
            headers={"Content-Disposition": "attachment;filename=acionamentos_filtrados.csv"},
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()
