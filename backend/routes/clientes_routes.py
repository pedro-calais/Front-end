import re
from flask import Blueprint, jsonify, request
from sqlalchemy import text, or_
from database import SessionLocal, engine_std, engine 
from models import Clientes
from utilities.carteira_service import get_historico_ro_real
from utilities.variaveis_globais import campanhas
from datetime import datetime

clientes_bp = Blueprint("clientes_bp", __name__)

def limpar_documento(doc):
    """Remove pontuação para comparação segura de CPF/CNPJ"""
    if not doc: return ""
    return re.sub(r"[^0-9]", "", str(doc))

# --- ROTA DE BUSCA (Mantém usando o banco Painel) ---
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
            "id": c.id, # Este é o ID do PAINEL
            "nome": c.nome,
            "documento": c.documento,
            "campanha": c.campanha,
        } for c in clientes])

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()

# --- ROTA DE DETALHES  ---
import re
from flask import Blueprint, jsonify, request
from sqlalchemy import text, or_
from database import SessionLocal, engine_std, engine 
from models import Clientes
from utilities.carteira_service import get_historico_ro_real
from utilities.variaveis_globais import campanhas
from datetime import datetime

clientes_bp = Blueprint("clientes_bp", __name__)

def limpar_documento(doc):
    if not doc: return ""
    return re.sub(r"[^0-9]", "", str(doc))

# --- ROTA DE BUSCA (MANTIDA ORIGINAL) ---
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

# --- ROTA DE DETALHES (COM FILTRO DE DEVOLVIDOS) ---
@clientes_bp.route("/clientes/<int:id_painel>", methods=["GET"])
def get_cliente_detalhes(id_painel):
    session = SessionLocal()
    try:
        # 1. PEGAR DADOS DO PAINEL (ID -> CPF)
        cliente_painel = session.query(Clientes).filter(Clientes.id == id_painel).first()
        
        if not cliente_painel:
            return jsonify({"error": "Cliente não encontrado."}), 404

        doc_original = cliente_painel.documento
        doc_limpo = limpar_documento(doc_original)
        nome_painel = cliente_painel.nome
        campanha_painel = cliente_painel.campanha

        # 2. BUSCAR DADOS CADASTRAIS NO STD
        dados_std = {}
        pessoas_id_real = None

        try:
            with engine_std.connect() as conn_std:
                sql_std = text("""
                    SELECT TOP 1 
                        Pessoas_ID, FPesNome, PesEndereco, PesBairro, 
                        PesCidade, PesUF, PesCEP, FPesDataNascimento
                    FROM Pessoas
                    WHERE FPesCPF = :doc_limpo OR JPesCNPJ = :doc_limpo 
                       OR FPesCPF = :doc_orig OR JPesCNPJ = :doc_orig
                """)
                row_std = conn_std.execute(sql_std, {"doc_limpo": doc_limpo, "doc_orig": doc_original}).mappings().first()
                
                if row_std:
                    pessoas_id_real = row_std['Pessoas_ID']
                    dados_std = dict(row_std)
                    if dados_std.get('FPesDataNascimento'):
                         dados_std['FPesDataNascimento'] = dados_std['FPesDataNascimento'].strftime('%d/%m/%Y')
        except Exception:
            pass

        cliente_final = {
            "id": id_painel,
            "pessoas_id": pessoas_id_real,
            "nome": dados_std.get('FPesNome', nome_painel),
            "documento": doc_original,
            "endereco": dados_std.get('PesEndereco', ''),
            "bairro": dados_std.get('PesBairro', ''),
            "cidade": dados_std.get('PesCidade', ''),
            "uf": dados_std.get('PesUF', ''),
            "cep": dados_std.get('PesCEP', ''),
            "nascimento": dados_std.get('FPesDataNascimento', ''),
            "campanha": campanha_painel
        }

        # 3. BUSCAR TÍTULOS (COM FILTRO DE STATUS) 🧹
        titulos_abertos = []
        titulos_pagos = []
        
        try:
            with engine.connect() as conn_titulos: 
                # ADICIONEI OS FILTROS NOT LIKE 'Devolvido%' E 'Cancelado%'
                sql_titulos = text("""
                    SELECT NUMERO_CONTRATO, PARCELA, VENCIMENTO, [VALOR ORIGINAL], STATUS_TITULO,
                           VALOR_PAGO, DATA_RECEBIMENTO, DATA_ACORDO, NEGOCIADOR, CREDOR
                    FROM [Candiotto_DBA].[dbo].[tabelatitulos]
                    WHERE (CPF_CNPJ_CLIENTE = :doc OR CPF_CNPJ_CLIENTE = :doc_limpo)
                      AND STATUS_TITULO NOT LIKE 'Devolvido%'
                      AND STATUS_TITULO NOT LIKE 'Cancelado%'
                      AND STATUS_TITULO NOT LIKE 'Indevido%'
                    ORDER BY VENCIMENTO DESC
                """)
                
                rows = conn_titulos.execute(sql_titulos, {"doc": doc_original, "doc_limpo": doc_limpo}).fetchall()

                for row in rows:
                    status = str(row.STATUS_TITULO).upper() if row.STATUS_TITULO else ""
                    valor_pago = float(row.VALOR_PAGO or 0)
                    valor_original = float(row[3] or 0) 

                    eh_pago = (valor_pago > 0) or ("PAGO" in status) or ("QUITADO" in status) or ("LIQUIDADO" in status)

                    item = {
                        "id": f"{row.NUMERO_CONTRATO}-{row.PARCELA}",
                        "numero": str(row.NUMERO_CONTRATO),
                        "parcela": str(row.PARCELA),
                        "vencimento": row.VENCIMENTO.strftime("%d/%m/%Y") if row.VENCIMENTO else "-",
                        "credor": str(row.CREDOR or ""),
                        "negociador": str(row.NEGOCIADOR or "-"),
                        "status": row.STATUS_TITULO
                    }

                    if eh_pago:
                        item.update({
                            "data_acordo": row.DATA_ACORDO.strftime("%d/%m/%Y") if row.DATA_ACORDO else "-",
                            "data_pagamento": row.DATA_RECEBIMENTO.strftime("%d/%m/%Y") if row.DATA_RECEBIMENTO else "-",
                            "valor_pago": valor_pago
                        })
                        titulos_pagos.append(item)
                    else:
                        item.update({
                            "valor": valor_original
                        })
                        titulos_abertos.append(item)
        except Exception as e:
            print(f"❌ Erro SQL Títulos: {e}")

        # 4. HISTÓRICO
        historico = []
        if pessoas_id_real:
            try:
                with engine_std.connect() as conn_camp:
                    sql_camp_id = text("SELECT TOP 1 MoCampanhasID FROM Movimentacoes WHERE MoInadimplentesID = :pid ORDER BY MoDataCriacaoRegistro DESC")
                    cid = conn_camp.execute(sql_camp_id, {"pid": pessoas_id_real}).scalar()
                    if cid:
                        historico = get_historico_ro_real(pessoas_id_real, cid, engine_std)
            except Exception:
                pass

        return jsonify({
            "cliente": cliente_final,
            "titulos_abertos": titulos_abertos,
            "titulos_pagos": titulos_pagos,
            "historico": historico
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()