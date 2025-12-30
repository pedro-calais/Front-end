# routes/dashboard_routes.py
import calendar
from flask import Blueprint, jsonify, request
from datetime import datetime, timedelta
import pandas as pd
from sqlalchemy import text
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

def get_dados_composicao_especifico(filtros, engine):
    """
    CORRIGIDO: 
    1. Filtra ID ou Nome (Resolve o problema de dados zerados).
    2. Calcula regras de negócio (Novo, Inadimplido, Antecipado) via Python.
    """
    print(f"\n🚀 [COMPOSICAO] Iniciando cálculo inteligente...")

    # 1. Definir Período
    data_ref = filtros.get('data_referencia') 
    hoje_real = datetime.now()
    
    # Tratamento de data robusto
    if not data_ref or len(str(data_ref)) < 7:
        data_ref = hoje_real.strftime('%Y-%m')

    try:
        ano, mes = map(int, str(data_ref).split('-')[:2])
        ultimo_dia = calendar.monthrange(ano, mes)[1]
    except:
        ano, mes = hoje_real.year, hoje_real.month
        ultimo_dia = 30

    dt_inicio = f"{ano}-{mes:02d}-01"
    dt_fim = f"{ano}-{mes:02d}-{ultimo_dia}"

    # 2. Construção Dinâmica da Query
    params = {'inicio': dt_inicio, 'fim': dt_fim}
    filtro_sql = ""

    # --- CORREÇÃO CRÍTICA AQUI ---
    # O Frontend manda ID, mas o banco pode ter Nome ou ID.
    # Vamos testar as duas colunas para garantir que traga dados.
    if filtros.get('negociador'):
        valor_negociador = str(filtros['negociador']).strip()
        if valor_negociador:
            # Tenta bater com o Nome OU com o ID do Operador
            filtro_sql += " AND (NEGOCIADOR = :negociador OR CAST(CaOperadorProprietarioID AS VARCHAR) = :negociador)"
            params['negociador'] = valor_negociador
            print(f"   👤 Filtrando Negociador por: {valor_negociador}")
    
    if filtros.get('campanha'):
        valor_campanha = str(filtros['campanha']).strip()
        if valor_campanha:
            # Tenta bater com Nome OU ID da campanha
            filtro_sql += " AND (CAMPANHA = :campanha OR CAST(MoCampanhasID AS VARCHAR) = :campanha)"
            params['campanha'] = valor_campanha

    # 3. Query SQL (Traz dados brutos para processar no Python)
    sql = text(f"""
        SELECT 
            Status,
            ISNULL(Saldo, 0) as VALOR_PREVISTO,
            ISNULL(MoValorRecebido, 0) as VALOR_PAGO,
            Data_de_Acordo as VENCIMENTO,
            Data_Recebimento as DATA_PAGAMENTO,
            MoParcela
        FROM RelatorioBase
        WHERE (Data_de_Acordo BETWEEN :inicio AND :fim)
           OR (Data_Recebimento BETWEEN :inicio AND :fim)
           {filtro_sql}
    """)

    try:
        with engine.connect() as conn:
            df = pd.read_sql(sql, conn, params=params)
        
        print(f"   ✅ Query retornou {len(df)} linhas.")
        
        # Estrutura de Retorno (Zerada por padrão)
        composicao = {
            "casosNovos": 0.0, "acordosVencer": 0.0, 
            "colchaoCorrente": 0.0, "colchaoInadimplido": 0.0, "totalCasos": 0.0
        }
        realizado = {
            "novosAcordos": 0.0, "colchaoAntecipado": 0.0, 
            "colchaoCorrente": 0.0, "colchaoInadimplido": 0.0, "caixaTotal": 0.0
        }

        if df.empty:
            return {"composicao": composicao, "realizado": realizado}

        # 4. Processamento Lógico (Regras de Negócio)
        
        # Converter datas
        df['VENCIMENTO'] = pd.to_datetime(df['VENCIMENTO'], errors='coerce')
        df['DATA_PAGAMENTO'] = pd.to_datetime(df['DATA_PAGAMENTO'], errors='coerce')
        
        # Data de corte (hoje) para saber se é 'A Vencer' ou 'Inadimplido'
        hoje_ts = pd.Timestamp(hoje_real.date()) 
        
        for _, row in df.iterrows():
            v_prev = float(row['VALOR_PREVISTO'])
            v_pago = float(row['VALOR_PAGO'])
            dt_venc = row['VENCIMENTO']
            dt_pag = row['DATA_PAGAMENTO']
            
            # Identifica Parcela 1 (Novos Casos)
            parcela_str = str(row['MoParcela']).strip()
            is_novo = parcela_str == '1' or parcela_str.startswith('1/') or parcela_str == '01'

            # --- A. CARTEIRA (PREVISÃO) ---
            if v_prev > 0:
                composicao["totalCasos"] += v_prev
                
                # Definições baseadas em DATA (mais confiável que Status string)
                is_vencido = pd.notnull(dt_venc) and dt_venc < hoje_ts
                is_futuro = pd.notnull(dt_venc) and dt_venc >= hoje_ts
                
                if is_novo:
                    composicao["casosNovos"] += v_prev
                elif is_vencido:
                    # Venceu antes de hoje e tem saldo = Inadimplido
                    composicao["colchaoInadimplido"] += v_prev
                elif is_futuro:
                    # Vence hoje ou depois = A Vencer
                    composicao["acordosVencer"] += v_prev
                else:
                    composicao["colchaoCorrente"] += v_prev

            # --- B. CAIXA (REALIZADO) ---
            if v_pago > 0:
                realizado["caixaTotal"] += v_pago
                
                # Definições de Pagamento
                is_antecipado = pd.notnull(dt_venc) and pd.notnull(dt_pag) and dt_pag < dt_venc
                is_recuperado = pd.notnull(dt_venc) and pd.notnull(dt_pag) and dt_pag > dt_venc
                
                if is_novo:
                     realizado["novosAcordos"] += v_pago
                elif is_antecipado:
                    realizado["colchaoAntecipado"] += v_pago
                elif is_recuperado:
                    realizado["colchaoInadimplido"] += v_pago
                else:
                    realizado["colchaoCorrente"] += v_pago

        return {
            "composicao": composicao,
            "realizado": realizado
        }

    except Exception as e:
        print(f"❌ Erro Lógica Composição: {e}")
        return None

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
