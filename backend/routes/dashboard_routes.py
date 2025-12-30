"""Dashboard, finance, and carteira endpoints used by web dashboards."""
import calendar
from flask import Blueprint, jsonify, request
from datetime import datetime
from sqlalchemy import text
from database import SessionLocal, engine, engine_std
from models import User, UserCampanha
from config import CREDOR_VS_CAMPANHA

# Importa a função  que conecta no banco Operacional (STD)
from utilities.carteira_service import get_dashboard_carteira_real

try:
    from utilities.financeiro_service import obter_dados_financeiros, get_negociadores_ativos, engine_fin
    from utilities.carteira_service import obter_dados_carteira, get_dashboard_carteira_real
    from utilities.objetivo_service import obter_resumo_objetivos
    from utilities.utilitarios import ler_consulta_sql
    from utilities.conexao import executar_query
    from utilities.negociador_service import get_resumo_celulas
except Exception as e:
    print(f"⚠️ Aviso: serviços não carregaram: {e}")
    obter_dados_financeiros = None
    get_negociadores_ativos = None
    engine_fin = None
    obter_dados_carteira = None
    obter_resumo_objetivos = None
    ler_consulta_sql = None
    executar_query = None
    get_resumo_celulas = None

dashboard_bp = Blueprint("dashboard_bp", __name__)

# Financeiro (dashboard financeiro).
@dashboard_bp.route("/financeiro/dashboard", methods=["POST"])
def get_dados_financeiros_route():
    try:
        if not obter_dados_financeiros:
            return jsonify({"error": "financeiro_service indisponível"}), 500
        filtros = request.json or {}
        dados = obter_dados_financeiros(filtros)
        return jsonify(dados), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@dashboard_bp.route("/api/dashboard-financeiro", methods=["GET"])
def get_dashboard_financeiro_get():
    if not obter_dados_financeiros:
        return jsonify({"error": "financeiro_service indisponível"}), 500
    return jsonify(obter_dados_financeiros({}))

# Dropdowns de credores/campanhas.
@dashboard_bp.route("/api/lista-credores", methods=["GET"])
def get_lista_credores():
    return jsonify(sorted(list(set(CREDOR_VS_CAMPANHA.keys()))))

@dashboard_bp.route("/api/lista-campanhas", methods=["GET"])
def get_lista_campanhas():
    todas = []
    for lista in CREDOR_VS_CAMPANHA.values():
        todas.extend(lista)
    return jsonify(sorted(list(set(todas))))

# Resumo de objetivos (cards/totais do painel).
@dashboard_bp.route("/api/resumo-objetivos", methods=["GET", "POST"])
def get_resumo_objetivos_api():
    if not obter_resumo_objetivos:
        return jsonify({"error": "objetivo_service indisponível"}), 500
    filtros = request.json if request.method == "POST" else {}
    return jsonify(obter_resumo_objetivos(filtros, engine_fin))

# Carteira (dados consolidados do financeiro/relatorios).
@dashboard_bp.route("/api/dashboard-carteira", methods=["POST"])
def get_dashboard_carteira_api():
    if not obter_dados_carteira:
        return jsonify({"error": "carteira_service indisponível"}), 500

    try:
        filtros = request.json or {}
        dados = obter_dados_carteira(filtros, engine_fin)

        if dados:
            for categoria in ["composicao", "realizado"]:
                if categoria in dados:
                    for chave, valor in dados[categoria].items():
                        if valor is None:
                            dados[categoria][chave] = 0.0
        else:
            dados = {
                "composicao": {"casosNovos": 0, "acordosVencer": 0, "colchaoCorrente": 0, "colchaoInadimplido": 0, "totalCasos": 0},
                "realizado": {"novosAcordos": 0, "colchaoAntecipado": 0, "colchaoCorrente": 0, "colchaoInadimplido": 0, "caixaTotal": 0},
            }

        return jsonify(dados), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
# Carteira prevista (consulta SQL externa).
@dashboard_bp.route("/api/composicao-carteira-prevista", methods=["GET"])
def get_composicao_carteira_prevista():
    if not (ler_consulta_sql and executar_query):
        return jsonify({"error": "utilitarios/conexao indisponíveis"}), 500

    try:
        data_ref = request.args.get("data_referencia")
        negociador = request.args.get("negociador")
        campanha = request.args.get("campanha")

        query = ler_consulta_sql("queries/composicao_de_casos_previsto.sql")

        params = {
            "referencia": data_ref,
            "negociador": negociador,
            "campanha": campanha,
        }

        resultado = executar_query(query, "Candiotto_STD", params=params)

        if resultado is None:
            return jsonify([]), 200

        if hasattr(resultado, "to_dict"):
            dados = resultado.to_dict("records")
        else:
            dados = [dict(row._mapping) for row in resultado]

        return jsonify(dados), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Painel objetivo (placeholder/compatibilidade).
@dashboard_bp.route("/painel-objetivo", methods=["POST"])
def get_painel_objetivo():
    session = SessionLocal()
    try:
        _filtros = request.json or {}
        return jsonify({"caixa": {"recebido": 0}, "message": "Dados do painel"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()

@dashboard_bp.route("/painel-objetivo/opcoes", methods=["GET"])
def opcoes_filtros():
    db = SessionLocal()
    try:
        negociadores_db = db.query(User).filter(User.ativo == True).all()
        lista_negociadores = [{"label": u.name, "value": u.name} for u in negociadores_db]

        campanhas_db = db.query(UserCampanha.credor, UserCampanha.campanha).distinct().all()

        mapa_credores = {}
        for credor, campanha in campanhas_db:
            if not credor:
                continue
            if credor not in mapa_credores:
                mapa_credores[credor] = []
            if campanha and campanha not in mapa_credores[credor]:
                mapa_credores[credor].append(campanha)

        for credor in mapa_credores:
            mapa_credores[credor].sort()

        return jsonify({
            "negociadores": lista_negociadores,
            "credores_campanhas": mapa_credores,
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

# Resumo de celulas/negociadores.
@dashboard_bp.route("/negociador_celula/resumo", methods=["GET"])
def rota_resumo_celula():
    if not get_resumo_celulas:
        return jsonify({"error": "negociador_service indisponível"}), 500
    try:
        dt_inicio = request.args.get("data_inicio")
        dt_fim = request.args.get("data_fim")

        if not dt_inicio or not dt_fim:
            hoje = datetime.now()
            dt_inicio = hoje.strftime("%Y-%m-01")
            dt_fim = hoje.strftime("%Y-%m-30")

        dados = get_resumo_celulas(dt_inicio, dt_fim)
        return jsonify(dados), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@dashboard_bp.route("/api/lista-negociadores", methods=["GET"])
def get_lista_negociadores_api():
    if not get_negociadores_ativos:
        return jsonify({"error": "financeiro_service indisponível"}), 500
    try:
        negociadores = get_negociadores_ativos()
        return jsonify(negociadores), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
# Diagnostico de conexao com STD.
@dashboard_bp.route("/api/db-ping", methods=["GET"])
def db_ping():
    if not engine_std:
        return jsonify({"error": "engine_std indisponivel"}), 500

    try:
        with engine_std.connect() as conn:
            inicio = datetime.now()
            conn.execute(text("SELECT 1"))
            tempo_ms = int((datetime.now() - inicio).total_seconds() * 1000)

        return jsonify({
            "status": "ok",
            "db": "Candiotto_STD",
            "elapsed_ms": tempo_ms,
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Composicao de carteira (STD2016).
@dashboard_bp.route("/api/composicao-carteira", methods=["GET", "POST", "OPTIONS"], strict_slashes=False)
def composicao_carteira():
    """
    Rota NOVA que usa a conexão direta com o STD2016 (SQL CTE)
    para preencher os cards coloridos e o gráfico de Carteira.
    """
    try:
        if request.method == "OPTIONS":
            return jsonify({}), 200

        filtros = {}

        # 1. Unifica a entrada (seja GET na URL ou POST no JSON)
        if request.method == "GET":
            referencia = request.args.get("referencia")
            campanha_id = request.args.get("campanha_ID")
            negociador_id = request.args.get("negociador_ID")
            debug_top = request.args.get("debug_top")
        else:
            payload = request.get_json(silent=True) or {}
            referencia = payload.get("data_referencia") or payload.get("referencia")
            campanha_id = payload.get("campanha") or payload.get("campanha_ID")
            negociador_id = payload.get("negociador") or payload.get("negociador_ID")
            debug_top = payload.get("debug_top")

        # 2. Prepara filtros para o Service
        # O service espera YYYY-MM-DD, vamos garantir o dia 01
        if referencia:
            # Se vier só '2025-10', vira '2025-10-01'
            if len(referencia) == 7:
                filtros["data_referencia"] = referencia + "-01"
            else:
                filtros["data_referencia"] = referencia
        else:
             filtros["data_referencia"] = datetime.now().strftime('%Y-%m-01')

        if campanha_id:
            filtros["campanha_id"] = campanha_id
        
        if negociador_id:
            filtros["negociador_id"] = negociador_id
        
        if debug_top:
            filtros["debug_top"] = int(debug_top)

        print(f"📡 Rota /api/composicao-carteira chamada. Filtros: {filtros}")

        # 3. Chama a função nova que criamos no carteira_service.py
        # Ela já sabe usar a engine_std internamente.
        resultado = get_dashboard_carteira_real(filtros)
        
        if not resultado:
            # Retorna estrutura vazia padrão para não quebrar o React
            vazio = {
                "composicao": {"casosNovos": 0, "acordosVencer": 0, "colchaoCorrente": 0, "colchaoInadimplido": 0, "totalCasos": 0},
                "realizado": {"novosAcordos": 0, "colchaoAntecipado": 0, "colchaoCorrente": 0, "colchaoInadimplido": 0, "caixaTotal": 0}
            }
            return jsonify(vazio), 200

        return jsonify(resultado), 200

    except Exception as e:
        print(f"❌ Erro na Rota Composicao Carteira: {e}")
        return jsonify({"error": str(e)}), 500
