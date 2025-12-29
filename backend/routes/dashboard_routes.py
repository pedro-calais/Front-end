# routes/dashboard_routes.py
from flask import Blueprint, jsonify, request
from datetime import datetime, timedelta

from database import SessionLocal, engine  # engine usado no composicao
from models import User, UserCampanha

from config import CREDOR_VS_CAMPANHA

try:
    from utilities.financeiro_service import obter_dados_financeiros, get_negociadores_ativos, engine_fin
    from utilities.carteira_service import obter_dados_carteira, get_dados_composicao_especifico
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
    get_dados_composicao_especifico = None
    obter_resumo_objetivos = None
    ler_consulta_sql = None
    executar_query = None
    get_resumo_celulas = None

dashboard_bp = Blueprint("dashboard_bp", __name__)

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

@dashboard_bp.route("/api/lista-credores", methods=["GET"])
def get_lista_credores():
    return jsonify(sorted(list(set(CREDOR_VS_CAMPANHA.keys()))))

@dashboard_bp.route("/api/lista-campanhas", methods=["GET"])
def get_lista_campanhas():
    todas = []
    for lista in CREDOR_VS_CAMPANHA.values():
        todas.extend(lista)
    return jsonify(sorted(list(set(todas))))

@dashboard_bp.route("/api/resumo-objetivos", methods=["GET", "POST"])
def get_resumo_objetivos_api():
    if not obter_resumo_objetivos:
        return jsonify({"error": "objetivo_service indisponível"}), 500
    filtros = request.json if request.method == "POST" else {}
    return jsonify(obter_resumo_objetivos(filtros, engine_fin))

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

@dashboard_bp.route("/api/composicao-carteira", methods=["GET", "POST"])
def composicao_carteira():
    if not get_dados_composicao_especifico:
        return jsonify({"error": "carteira_service indisponível"}), 500

    try:
        filtros = {}

        if request.method == "GET":
            referencia = request.args.get("referencia")
            campanha = request.args.get("campanha_ID")
            negociador = request.args.get("negociador_ID")
        else:
            payload = request.json or {}
            referencia = payload.get("data_referencia") or payload.get("referencia")
            campanha = payload.get("campanha") or payload.get("campanha_ID")
            negociador = payload.get("negociador") or payload.get("negociador_ID")

        if referencia:
            filtros["data_referencia"] = referencia[:7]
        if campanha:
            filtros["campanha"] = campanha
        if negociador:
            filtros["negociador"] = negociador

        resultado = get_dados_composicao_especifico(filtros, engine)
        if not resultado:
            return jsonify({"error": "Erro ao processar dados"}), 500

        return jsonify(resultado), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

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
