"""Client lookup and detail endpoints used by /consultar-cliente."""
# routes/clientes_routes.py
import re
from flask import Blueprint, jsonify, request
from sqlalchemy import text, or_
from database import SessionLocal, engine_std
from models import Clientes
from utilities.carteira_service import get_historico_ro_real
from utilities.variaveis_globais import campanhas

clientes_bp = Blueprint("clientes_bp", __name__)

# Normaliza CPF/CNPJ para comparar com dados do legado.
def limpar_documento(doc):
    if not doc:
        return ""
    return re.sub(r"[^0-9]", "", str(doc))

def _resolver_campanha_id(campanha_valor: str):
    if not campanha_valor:
        return None

    valor = str(campanha_valor).strip()
    if valor.isdigit():
        return int(valor)

    codigo_match = re.search(r"\b\d{6}\b", valor)
    if codigo_match:
        codigo = codigo_match.group(0)
        if codigo in campanhas:
            return int(campanhas[codigo])

    if engine_std:
        try:
            with engine_std.connect() as conn:
                row = conn.execute(
                    text(
                        """
                        SELECT TOP 1 Campanhas_ID
                        FROM Campanhas WITH (NOLOCK)
                        WHERE CaNome = :nome OR CaCodigo = :codigo
                        """
                    ),
                    {"nome": valor, "codigo": valor},
                ).fetchone()
            if row:
                return int(row[0])
        except Exception:
            pass

    return None

# Detalhes do cliente + titulos e historico de ROs.
@clientes_bp.route("/clientes/<int:id>", methods=["GET"])
def get_detalhe_cliente(id):
    session = SessionLocal()
    try:
        cliente = session.query(Clientes).filter(Clientes.id == id).first()
        if not cliente:
            return jsonify({"error": "Cliente não encontrado"}), 404

        doc_original = cliente.documento
        doc_limpo = limpar_documento(doc_original) if doc_original else ""

        sql_titulos = text("""
            SELECT NUMERO_CONTRATO, PARCELA, VENCIMENTO, [VALOR ORIGINAL], STATUS_TITULO,
                   VALOR_PAGO, DATA_RECEBIMENTO, DATA_ACORDO, NEGOCIADOR, CREDOR
            FROM [Candiotto_DBA].[dbo].[tabelatitulos]
            WHERE CPF_CNPJ_CLIENTE = :doc OR CPF_CNPJ_CLIENTE = :doc_limpo
            ORDER BY VENCIMENTO DESC
        """)

        rows = session.execute(sql_titulos, {"doc": doc_original, "doc_limpo": doc_limpo}).fetchall()

        titulos_abertos = []
        titulos_pagos = []
        titulos_antigos = []

        for row in rows:
            status = str(row.STATUS_TITULO).upper() if row.STATUS_TITULO else ""
            valor_pago = float(row.VALOR_PAGO or 0)
            valor_original = float(row[3] or 0)  # [VALOR ORIGINAL]

            eh_pago_antigo_logic = (valor_pago > 0) or ("PAGO" in status) or ("QUITADO" in status)

            item_antigo = {
                "numero": str(row.NUMERO_CONTRATO),
                "parcela": str(row.PARCELA),
                "vencimento": row.VENCIMENTO.strftime("%d/%m/%Y") if row.VENCIMENTO else "-",
                "valor": valor_original,
                "status": row.STATUS_TITULO,
                "eh_pago": eh_pago_antigo_logic,
            }
            titulos_antigos.append(item_antigo)

            item_base_novo = {
                "id": f"{row.NUMERO_CONTRATO}-{row.PARCELA}",
                "numero": str(row.NUMERO_CONTRATO),
                "parcela": str(row.PARCELA),
                "vencimento": row.VENCIMENTO.strftime("%d/%m/%Y") if row.VENCIMENTO else "-",
                "credor": str(row.CREDOR or ""),
                "negociador": str(row.NEGOCIADOR or "-"),
            }

            if eh_pago_antigo_logic:
                titulos_pagos.append({
                    **item_base_novo,
                    "data_acordo": row.DATA_ACORDO.strftime("%d/%m/%Y") if row.DATA_ACORDO else "-",
                    "data_pagamento": row.DATA_RECEBIMENTO.strftime("%d/%m/%Y") if row.DATA_RECEBIMENTO else "-",
                    "valor_pago": valor_pago,
                    "status": status,
                })
            else:
                titulos_abertos.append({
                    **item_base_novo,
                    "valor": valor_original,
                    "status": status,
                })

        historico = []
        if engine_std:
            pessoa_id = None
            try:
                with engine_std.connect() as conn:
                    row = conn.execute(
                        text(
                            """
                            SELECT TOP 1 Pessoas_ID
                            FROM Pessoas WITH (NOLOCK)
                            WHERE FPesCPF = :doc OR JPesCNPJ = :doc OR FPesCPF = :doc_limpo OR JPesCNPJ = :doc_limpo
                            """
                        ),
                        {"doc": doc_original, "doc_limpo": doc_limpo},
                    ).fetchone()
                if row:
                    pessoa_id = int(row[0])
            except Exception:
                pessoa_id = None

            campanha_id = _resolver_campanha_id(cliente.campanha)
            if pessoa_id and campanha_id:
                historico = get_historico_ro_real(pessoa_id, campanha_id) or []

        return jsonify({
            "cliente": {
                "id": cliente.id,
                "nome": cliente.nome,
                "documento": cliente.documento,
                "campanha": cliente.campanha,
            },
            "titulos": titulos_antigos,
            "titulos_abertos": titulos_abertos,
            "titulos_pagos": titulos_pagos,
            "historico": historico,
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()

# Busca simples usada pela tela de consulta.
@clientes_bp.route("/clientes/buscar", methods=["GET"])
def buscar_clientes():
    session = SessionLocal()
    termo = request.args.get("q")
    if not termo or len(termo) < 3:
        return jsonify([])
    try:
        clientes = session.query(Clientes).filter(
            or_(
                Clientes.nome.like(f"%{termo}%"),
                Clientes.documento.like(f"%{termo}%")
            )
        ).limit(50).all()

        return jsonify([{
            "id": c.id,
            "nome": c.nome,
            "documento": c.documento,
            "campanha": c.campanha,
        } for c in clientes])

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()
