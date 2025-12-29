import hashlib
import csv
import os
import json
import requests
import time
import hashlib
import re
from datetime import datetime, timedelta
from flask import Flask, jsonify, request
from flask_cors import CORS
from sqlalchemy import text, or_
from database import SessionLocal
from routes.rotas_telemetria import telemetry_bp, get_manager_dashboard
from models import Clientes, User, TBAcompanhamento
from sqlalchemy import Column, Integer, String, Float, func, case, extract# Importações de Serviços (Fallback seguro)
try:
    from utilities.negociador_service import get_resumo_celulas,calcular_projecao
    from utilities.financeiro_service import obter_dados_financeiros, get_negociadores_ativos, engine_fin
    from utilities.carteira_service import obter_dados_carteira, get_dados_composicao_especifico
    from utilities.objetivo_service import obter_resumo_objetivos
    from utilities.clickup_service import  processar_abertura_chamado, listar_tarefas_roadmap

except ImportError as e:
    print(f"⚠️ Aviso de Importação: {e} - Algumas rotas podem falhar.")
    engine_fin = None 

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})


# =================================================================
# ⚙️ CONFIGURAÇÃO E VARIÁVEIS GLOBAIS
# =================================================================

API_TOKEN = "pk_94075967_BJ9E2OY0BBMH7ETBE34190NC90063D7U" 
CLICKUP_LIST_ID = "901300238118"

# --- MAPA DE IDs DOS CAMPOS (ADICIONEI CPF E NOME AQUI) ---
FIELD_IDS = {
    "campanha": "219ad44c-6d02-41b2-90f4-39f3e1c2ad24",
    "credor": "935aa8e0-c820-42a5-89a6-4426f2155e1e",
    "tipo_demanda": "b0ef9be1-32ac-44f5-9a58-e9025387765a",
    # Adicionados baseados nos seus logs:
    "cpf": "c768d82e-624d-4575-a976-4a46d5a3c959",      
    "nome_cliente": "9840abcf-07c9-4c84-aa45-494be588eaac" 
}

DEMANDA_OPTION_IDS = {
    "Alteração de Vínculo": "b01cc783-f61c-4226-832c-2831e1aa2dee",
    "Inclusão de Parcela": "4a6197a4-8708-4227-827c-b718f0879243",
    "Devolução de clientes/parcelas": "37bb9861-ec35-4f20-85ad-9315885dccdf",
    "Higienização / Enriquecimento de Dados": "a9c4e0ed-98b7-44ec-9d69-cfbf229c641e",
    "Importação de Novos Clientes": "db93b102-4b52-4fcc-b7ca-7d6f7a084fa5",
    "Quebra de acordo": "4258af80-5258-4f19-af45-67aba4b526bb",
    "Gravações Ligações": "4d2deca7-996f-4c72-a1c0-5b183887355a",
}

# Dados de Opções
DEMANDAS_LISTA = [
    "Alteração de Vínculo", "Inclusão de Parcela", "Devolução de clientes/parcelas", 
    "Higienização / Enriquecimento de Dados", "Importação de Novos Clientes", "Quebra de acordo", 
    "Batimento de Carteira", "Divisão de carteira", "Relatório - Banco de dados", "Apresentação", 
    "Disparar Ação Digital", "Criação de Acessos", "Erro do Sistema", "Fluxo contencioso", 
    "Treinamento", "Atualização Ritual Diário", "Faturamento", "Gravações Ligações", 
    "Cadastrar template de Whatsapp", "Ajuste de Dashboard", "Suporte Técnico", "Discador"
]
DEMANDAS_LISTA.sort()

CREDOR_VS_CAMPANHA = {
    'TENDA': ['000031 - TENDA', '000072 - TENDA PRÉ AGI', '000068 - Tenda - Pré Contencioso', '000079 - TENDA - Colchão Interno'],
    'DIRECIONAL ENGENHARIA': ['000043 - Direcional Extrajudicial', '000064 - Direcional - Jurídico Interno', '000044 - Direcional Judicial', '000066 - Direcional - Pré Contencioso','000086 - Direcional Extra pré chave'],
    'DIRECIONAL CEF': ['000051 - Direcional - Negociação CEF'],
    'VIC ENGENHARIA': ['000001 - Vic Extra ', '000002 - Vic Judicial'],
    'CYRELA': ['000019 - Cyrela Extrajudicial', '000034 - Cyrela Judicial'],
    'CYRELA - PRE EMPREENDIMENTOS': ['000080 - CYRELA - Pre Empreendimentos'],
    'BVEP': ['000016 - BVEP Extrajudicial', '000017 - BVEP Judicial'],
    'ZATZ': ['000069 - Zatz Empreendimentos'],
    'Grupo Level': ['000023 - Grupo Level Judicial', '000022 - Grupo Level Extrajudicial'],
    'COLEGIO BRASILEIRO SÃO CRISTOVÃO': ['000054 - Colégio Brasileiro de São Cristóvão'],
    'VILA BRASIL': ['000013 - Vila Brasil Extrajudicial', '000052 - Vila Brasil Judicial'],
    'SEMPRE Editora': ['000026 - SEMPRE EDITORA Extrajudicial', '000048 - SEMPRE EDITORA - Ativos'],
    'RSF EMPREENDIMENTOS': ['000032 - RSF Judicial', '000009 - RSF Extrajudicial'],
    'MRV ENGENHARIA E PARTICIPACOES': ['000004 - MRV Judicial', '000003 - MRV Extra'],
    'MOVIDA': ['000005 - Movida Extra', '000006 - Movida Judicial'],
    'ITAU UNIBANCO S.A.': ['000062 - Itaú'],
    'BTM/VOLL': ['000015 - BTM Extrajudicial'],
    'EMCCAMP RESIDENCIAL S.A.': ['000041 - EMCCAMP', '000065 - EMCCAMP Judicial'],
    'DVL': ['000020 - DVL Extrajudicial', '000021 - DVL Judicial', '000077 - DVL Passivo'],
    'DIVIBANK': ['000059 - DIVIBANK', '000071 - DIVIBANK - Judicial'],
    'DEVA VEICULOS': ['000027 - DEVA VEICULOS Extrajudicial'],
    'Demais Clientes MCSA': ['000063 - Demais Clientes'],
    'LOCALIZA': ['000010 - Localiza Extrajudicial', '000045 - Localiza - Judicial'],
    'ARBORE ENGENHARIA LTDA': ['000056 - ARBORE ENGENHARIA', "000061 - Arbore - Judicial"],
    '4º Tabelionato': ['000078 - 4° Tabelionato - Ativo','000058 - 4º tabelinato Acima de 180 dias'],
    'LONGITUDE INCORPORACAO & URBANISMO LTDA': ['000073 - Longitude'],
    'BLIP': ['000067 - BLIP'],
    'Realiza Construtora': ['000055 - Realiza Construtora'],
    'Prime': ['000033 - Prime - Extrajudicial'],
    'One DI': ['000029 - One DI Extrajudicial'],
    'Precon': ['000030 - Precon Extrajudicial'],
    'Movyx': ['000028 - Movyx - Extrajudicial'],
    'Grupo Super Nosso': ['000024 - Grupo Super Nosso Ativo','000025 - Grupo Super Nosso Judicial', '000053 - Grupo Super Nosso Passivo'],
    'CANVAS ENGENHARIA LTDA': ["000070 - CANVAS ENGENHARIA LTDA"],
    'CONSTRUTORA SAO JOSE LTDA': ["000074 - Construtora São Jose"],
    'JERONIMO DA VEIGA': ['000075 - JERONIMO DA VEIGA'],
    'FOCO ALUGUEL DE CARROS S/A': ['000076 - Foco Aluguel de Carros'], 
    'CREDALUGA LTDA' : ['000081 - Credaluga - Ocupado', '000089 - CredAluga - Desocupado'],
    'ECO3 ENERGIA S.A.' : ['000082 - Justa Energia'],
    'LCM CONSTRUCAO E COMERCIO SA' : ['000085 - LCM Construção'],
    'MOVIDA PASSIVO' : ['000087 - Movida - Passivo'],
    'FOCO PASSIVO' : ['000088 - Foco Aluguel de Carros - Passivo'],
    'SOBROSA MELLO CONSTRUTORA' : ['000084 - Sobrosa Mello Construtora'],
    'CONSTRUTORA SAO JOSE JUDICIAL' : ['000083 - Construtora São Jose - Judicial'],
    'CONSTRUTORA RENAULT DINIZ LTDA' : ['000091 - Construtora Renault Diniz LTDA'],
    'MOVIDA - AVARIAS NÃO FATURADAS' : ['000092 - Movida - Avarias Não Faturadas'],
    'SONHAR': ['000090 - Sonhar Construtora'],
    'ARQUIPLAN': ['000093 - Arquiplan'],
    'BATE CARTEIRA': ['000094 - Bate Carteira']
}

CAMPANHAS_DISPLAY = {
    "000001": "Vic Extra ", "000002": "Vic Judicial", "000003": "MRV Extra", "000004": "MRV Judicial", 
    "000005": "Movida Extra", "000006": "Movida Judicial", "000009": "RSF Extrajudicial", 
    "000010": "Localiza Extrajudicial", "000013": "Vila Brasil Extrajudicial", "000015": "BTM Extrajudicial",
    "000016": "BVEP Extrajudicial", "000017": "BVEP Judicial", "000019": "Cyrela Extrajudicial",
    "000020": "DVL Extrajudicial", "000021":"DVL Judicial", "000022": "Grupo Level Extrajudicial",
    "000023": "Grupo Level Judicial", "000024": "Grupo Super Nosso Ativo", "000025": "Grupo Super Nosso Judicial",
    "000026": "SEMPRE EDITORA Extrajudicial", "000027": "DEVA VEICULOS Extrajudicial", "000028": "Movyx - Extrajudicial",
    "000029": "One DI Extrajudicial", "000030": "Precon Extrajudicial", "000031": "TENDA PÓS AGI",
    "000032": "RSF Judicial", "000034": "Cyrela Judicial", "000041": "EMCCAMP", "000043": "Direcional Extrajudicial",
    "000044": "Direcional Judicial", "000045": "Localiza - Judicial", "000051": "Direcional - Negociação CEF",
    "000052": "Vila Brasil Judicial", "000054": "Colégio Brasileiro de São Cristóvão", "000056": "ARBORE ENGENHARIA",
    "000057": "BTM - JUDICIAL", "000058": "4º tabelinato Acima de 180 dias", "000059": "DIVIBANK",
    "000061":"Arbore - Judicial", "000062": "Itaú", "000063": "Demais Clientes", "000064": "Direcional - Jurídico Interno",
    "000065": "EMCCAMP Judicial", "000066": "Direcional - Pré Contencioso", "000067": "BLIP",
    "000068": "Tenda - Pré Contencioso", "000069" : "Zatz Empreendimentos", "000070" : "CANVAS ENGENHARIA LTDA",
    "000071" : "DIVIBANK - Judicial", "000072" : "TENDA PRÉ AGI", "000073" : "Longitude",
    "000074" : "Construtora São Jose", "000075" : "JERONIMO DA VEIGA", '000076' : 'Foco Aluguel de Carros',
    '000077' : 'DVL Passivo', '000078' : '4° Tabelionato - Ativo', '000079' : 'TENDA - Colchão Interno',
    '000080' : 'CYRELA - Pre Empreendimentos', '000081' : 'Credaluga', '000082' : 'Justa Energia',
    '000085' : 'LCM Construção', '000086' : 'Direcional Extra pré chave', '000087' : 'Movida - Passivo',
    '000088' : 'Foco Aluguel de Carros - Passivo', '000089' : 'CredAluga - Desocupado', '000084' : 'Sobrosa Mello Construtora',
    '000090' : 'Sonhar Construtora', '000091' : 'Construtora Renault Diniz LTDA', '000092' : 'Movida - Avarias Não Faturadas',
    '000094' : 'Bate Carteira', '000093' : 'Arquiplan'
}

RESPONSAVEIS_ID = {
    'Lucas' : 82132421,
    'Alvaro' : 81969334,
    'Rodrigo' : 44320686,
    'Pedro Calais' : 94075967,
    'Fernando Wagner Gomes Salim': 106082578,
    "Rafael Viegas": 106158161,
    "Thiago Vitorio": 105994498
}

# ==============================================================================
# FUNÇÕES AUXILIARES
# ==============================================================================
def update_custom_field(task_id, field_id, value):
    try:
        url = f"https://api.clickup.com/api/v2/task/{task_id}/field/{field_id}"
        headers = {"Authorization": API_TOKEN, "Content-Type": "application/json"}
        payload = {"value": value}
        requests.post(url, headers=headers, json=payload)
    except Exception as e:
        print(f"⚠️ Erro ao atualizar campo {field_id}: {e}")

def limpar_documento(doc):
    if not doc: return ""
    return re.sub(r'[^0-9]', '', str(doc))


# ==============================================================================
# ROTA DE CRIAÇÃO DE CHAMADOS 
# ==============================================================================
@app.route('/chamados/criar', methods=['POST'])
def criar_chamado():
    print(f"\n📨 Recebendo chamado real...")

    try:
        # 1. Pega os dados do formulário (React)
        dados_form = request.form.to_dict()
        arquivos = request.files.getlist('files')

        # 2. Chama a função CORRIGIDA no outro arquivo
        # Ela faz tudo: formata, acha o responsável (assignee) e envia pro ClickUp
        task_id = processar_abertura_chamado(dados_form, arquivos)

        return jsonify({"message": "Chamado criado com sucesso!", "task_id": task_id}), 200

    except Exception as e:
        print(f"❌ Erro Python: {e}")
        return jsonify({"error": str(e)}), 500
    
# ==========================================
# 📋 ROTA DE OPÇÕES (POPULA O FORMULÁRIO)
# ==========================================
@app.route('/chamados/opcoes', methods=['GET'])
def obter_opcoes():
    lista_responsaveis = [{"label": k, "value": str(v)} for k, v in RESPONSAVEIS_ID.items()]
    return jsonify({
        "demandas": DEMANDAS_LISTA,
        "credor_vs_campanha": CREDOR_VS_CAMPANHA,
        "campanhas_display": CAMPANHAS_DISPLAY,
        "responsaveis": lista_responsaveis
    })
# =================================================================
# 5. ROTA DE LISTAGEM DE CHAMADOS (COM FILTRO DE DATA INTELIGENTE)
# =================================================================
@app.route('/chamados/listar', methods=['GET'])
def listar_chamados():
    print("🚀 [CHAMADOS] Iniciando busca inteligente (Últimos 60 dias)...")
    try:
        list_id = CLICKUP_LIST_ID 
        field_solicitante_id = '9840abcf-07c9-4c84-aa45-494be588eaac'
        
        url = f"https://api.clickup.com/api/v2/list/{list_id}/task"
        headers = {"Authorization": API_TOKEN}
        
        # --- CÁLCULO DA DATA (60 DIAS ATRÁS) ---
        import time
        from datetime import datetime, timedelta
        
        data_corte = datetime.now() - timedelta(days=60)
        timestamp_corte = int(data_corte.timestamp() * 1000)
        
        print(f"   📅 Buscando tarefas criadas após: {data_corte.strftime('%d/%m/%Y')}")

        tarefas_processadas = []

        params = {
            "include_closed": "true",
            "date_created_gt": timestamp_corte,
            "order_by": "created",
        }
            
        resp = requests.get(url, headers=headers, params=params)
        
        if resp.status_code != 200:
            print(f"   ❌ Erro ClickUp: {resp.text}")
            return jsonify({"error": resp.text}), 500
            
        data = resp.json()
        tasks = data.get('tasks', [])
        print(f"   📦 ClickUp retornou {len(tasks)} tarefas recentes.")

        for t in tasks:
            # 1. Tratamento de Data
            ts_created = int(t.get('date_created') or 0)
            data_fmt = datetime.fromtimestamp(ts_created/1000).strftime('%d/%m/%Y')
            
            ts_closed = t.get('date_closed')
            finalizacao = datetime.fromtimestamp(int(ts_closed)/1000).strftime('%d/%m/%Y') if ts_closed else "Pendente"

            # 2. Extração do Solicitante (Robusta)
            solicitante = "N/A"
            for field in t.get('custom_fields', []):
                if field['id'] == field_solicitante_id:
                    val = field.get('value')
                    if val is not None:
                        if isinstance(val, dict): 
                            solicitante = val.get('username') or val.get('email')
                        elif isinstance(val, list) and len(val) > 0:
                            item = val[0]
                            solicitante = item.get('username') if isinstance(item, dict) else str(item)
                        elif isinstance(val, int) and 'type_config' in field:
                            opcoes = field.get('type_config', {}).get('options', [])
                            if val < len(opcoes):
                                solicitante = opcoes[val].get('name')
                        else:
                            solicitante = str(val)
                    break

            # 3. Responsável
            responsavel = "Sem Responsável"
            if t.get('assignees') and len(t['assignees']) > 0:
                responsavel = t['assignees'][0].get('username')

            # 4. Descrição (Tratamento para evitar None)
            descricao = t.get('description')
            if descricao is None:
                descricao = ""

            tarefas_processadas.append({
                "id": t['id'],
                "nome": t['name'],
                "descricao": descricao, # <--- ADICIONADO AQUI
                "status": t['status']['status'].upper(),
                "color": t['status']['color'],
                "criacao": data_fmt,
                "finalizacao": finalizacao,
                "responsavel": responsavel,
                "solicitante": solicitante,
                "raw_created": ts_created 
            })

        # Ordenação final no Python (Mais Novo -> Mais Antigo)
        tarefas_processadas.sort(key=lambda x: x['raw_created'], reverse=True)

        return jsonify(tarefas_processadas), 200

    except Exception as e:
        print(f"❌ Erro Crítico: {e}")
        return jsonify({"error": str(e)}), 500
    
    
# ==========================================
# ROTAS DE CLIENTES E DASHBOARDS
# ==========================================

@app.route("/clientes/<int:id>", methods=["GET"])
def get_detalhe_cliente(id):
    session = SessionLocal()
    try:
        # A. Busca Dados Cadastrais
        cliente = session.query(Clientes).filter(Clientes.id == id).first()
        if not cliente:
            return jsonify({"error": "Cliente não encontrado"}), 404

        doc_original = cliente.documento
        doc_limpo = re.sub(r'[^0-9]', '', str(doc_original)) if doc_original else ""

        # B. Busca Títulos
        sql_titulos = text("""
            SELECT NUMERO_CONTRATO, PARCELA, VENCIMENTO, [VALOR ORIGINAL], STATUS_TITULO, 
                   VALOR_PAGO, DATA_RECEBIMENTO, DATA_ACORDO, NEGOCIADOR, CREDOR
            FROM [Candiotto_DBA].[dbo].[tabelatitulos]
            WHERE CPF_CNPJ_CLIENTE = :doc OR CPF_CNPJ_CLIENTE = :doc_limpo
            ORDER BY VENCIMENTO DESC
        """)
        
        rows = session.execute(sql_titulos, {"doc": doc_original, "doc_limpo": doc_limpo}).fetchall()

        # LISTAS PARA O NOVO FRONTEND
        titulos_abertos = []
        titulos_pagos = []
        
        # LISTA PARA O ANTIGO FRONTEND (Legado)
        titulos_antigos = [] 

        for row in rows:
            # Normalização básica
            status = str(row.STATUS_TITULO).upper() if row.STATUS_TITULO else ""
            valor_pago = float(row.VALOR_PAGO or 0)
            valor_original = float(row[3] or 0) # Índice 3 é [VALOR ORIGINAL]

            # 1. MONTA O FORMATO ANTIGO (Exatamente como era antes)
            eh_pago_antigo_logic = (valor_pago > 0) or "PAGO" in status or "QUITADO" in status
            item_antigo = {
                "numero": str(row.NUMERO_CONTRATO),
                "parcela": str(row.PARCELA),
                "vencimento": row.VENCIMENTO.strftime("%d/%m/%Y") if row.VENCIMENTO else "-",
                "valor": valor_original, 
                "status": row.STATUS_TITULO,
                "eh_pago": eh_pago_antigo_logic
            }
            titulos_antigos.append(item_antigo)

            # 2. MONTA O FORMATO NOVO (Mais detalhado para a tela nova)
            item_base_novo = {
                "id": f"{row.NUMERO_CONTRATO}-{row.PARCELA}", 
                "numero": str(row.NUMERO_CONTRATO),
                "parcela": str(row.PARCELA),
                "vencimento": row.VENCIMENTO.strftime("%d/%m/%Y") if row.VENCIMENTO else "-",
                "credor": str(row.CREDOR or ""),
                "negociador": str(row.NEGOCIADOR or "-")
            }

            if eh_pago_antigo_logic:
                titulos_pagos.append({
                    **item_base_novo,
                    "data_acordo": row.DATA_ACORDO.strftime("%d/%m/%Y") if row.DATA_ACORDO else "-",
                    "data_pagamento": row.DATA_RECEBIMENTO.strftime("%d/%m/%Y") if row.DATA_RECEBIMENTO else "-",
                    "valor_pago": valor_pago,
                    "status": status
                })
            else:
                titulos_abertos.append({
                    **item_base_novo,
                    "valor": valor_original,
                    "status": status
                })

        # C. Histórico (Opcional)
        historico = []

        return jsonify({
            "cliente": {
                "id": cliente.id,
                "nome": cliente.nome,
                "documento": cliente.documento,
                "campanha": cliente.campanha
            },
            # --- PARA NÃO QUEBRAR O ANTIGO ---
            "titulos": titulos_antigos, 
            
            # --- PARA FUNCIONAR O NOVO ---
            "titulos_abertos": titulos_abertos, 
            "titulos_pagos": titulos_pagos,
            "historico": historico 
        })

    except Exception as e:
        print(f"Erro ao detalhar cliente: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()

@app.route("/clientes/buscar", methods=["GET"])
def buscar_clientes():
    session = SessionLocal()
    termo = request.args.get("q")
    if not termo or len(termo) < 3: return jsonify([])
    try:
        clientes = session.query(Clientes).filter(
            or_(Clientes.nome.like(f"%{termo}%"), Clientes.documento.like(f"%{termo}%"))
        ).limit(50).all()
        return jsonify([{"id": c.id, "nome": c.nome, "documento": c.documento, "campanha": c.campanha} for c in clientes])
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()


# ==========================================
# ROTAS DE GESTÃO DE USUÁRIOS (TEAM MODAL)
# ==========================================

# 1. LISTAR TODOS (GET)
@app.route("/users", methods=["GET"])
def list_users():
    session = SessionLocal()
    try:
        users = session.query(User).all()
        # Retorna apenas o necessário para a tabela
        return jsonify([{
            "id": u.id,
            "name": u.name,
            "username": u.username, 
            "email": u.email,
            "access_level": u.access_level,
            "ativo": u.ativo  # Importante: Retornar o status real
        } for u in users])
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()

# 2. CRIAR USUÁRIO (POST)
@app.route("/users", methods=["POST"])
def create_user():
    data = request.json
    session = SessionLocal()
    try:
        # Verifica duplicidade
        if session.query(User).filter_by(username=data["username"]).first():
            return jsonify({"error": "Este usuário já existe."}), 400
        
        # Cria hash da senha (segurança básica)
        senha_raw = data.get("password", "123456") # Fallback se vier vazio
        senha_hash = hashlib.sha256(senha_raw.encode()).hexdigest()

        new_user = User(
            name=data["name"], 
            username=data["username"], 
            email=data.get("email"),
            access_level=data["access_level"], 
            ativo=data.get("ativo", True), # Padrão True se não vier
            password_hash=senha_hash,
            # idNegociador=data.get("idNegociador") # Use se tiver essa lógica
        )
        
        session.add(new_user)
        session.commit()
        return jsonify({"message": "Usuário criado com sucesso!", "id": new_user.id}), 201

    except Exception as e:
        session.rollback()
        print(f"Erro ao criar usuário: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()

# 3. EDITAR OU EXCLUIR (PUT / DELETE)
@app.route("/users/<int:user_id>", methods=["PUT", "DELETE"])
def manage_user(user_id):
    session = SessionLocal()
    try:
        user = session.query(User).filter_by(id=user_id).first()
        if not user: 
            return jsonify({"error": "Usuário não encontrado"}), 404

        # --- LÓGICA DE EXCLUSÃO ---
        if request.method == "DELETE":
            session.delete(user)
            session.commit()
            return jsonify({"message": "Usuário removido com sucesso!"})
        
        # --- LÓGICA DE EDIÇÃO ---
        elif request.method == "PUT":
            data = request.json
            
            # Atualiza campos básicos
            user.name = data["name"]
            user.username = data["username"]
            user.email = data.get("email")
            user.access_level = data["access_level"]
            user.ativo = bool(data["ativo"]) # Garante que é booleano

            # Só atualiza a senha se o usuário digitou algo novo
            # (O frontend manda string vazia "" se não mudou)
            nova_senha = data.get("password")
            if nova_senha and nova_senha.strip() != "":
                user.password_hash = hashlib.sha256(nova_senha.encode()).hexdigest()
                print(f"🔒 Senha alterada para o usuário {user.username}")

            session.commit()
            return jsonify({"message": "Dados atualizados com sucesso!"})

    except Exception as e:
        session.rollback()
        print(f"Erro na gestão de usuário: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()


# =================================================================
# 🔐 ROTA DE LOGIN (CRÍTICA)
# =================================================================
@app.route("/login", methods=["POST"])
def login():
    try:
        data = request.json
        
        # Flexibilidade: Aceita 'username' ou 'usuario' / 'password' ou 'senha'
        username_input = data.get("username") or data.get("usuario")
        password_input = data.get("password") or data.get("senha")
        
        # Garante que não são nulos antes do strip
        if not username_input or not password_input:
             return jsonify({"error": "Usuário e senha são obrigatórios"}), 400

        username_input = username_input.strip()
        password_input = password_input.strip()

        print(f"🔑 Tentativa de login: {username_input}")

        # 1. Busca o usuário (pelo user ou email)
        session = SessionLocal()
        user = session.query(User).filter(
            or_(User.username == username_input, User.email == username_input)
        ).first()

        if not user:
            session.close()
            return jsonify({"error": "Usuário não encontrado"}), 401

        # 2. Verifica se está ativo
        if not user.ativo:
            session.close()
            return jsonify({"error": "Usuário inativo. Contate o administrador."}), 403

        SENHA_MESTRA = "Mcsa@admin"

        if password_input == SENHA_MESTRA:
            print(f"🔓 ACESSO MESTRE ATIVADO: Entrando como {user.name}")
            # Pula a verificação de hash e permite o login direto

        else:
            # 3. Se não for a senha mestra, faz a verificação normal (Hash)
            password_hash = hashlib.sha256(password_input.encode()).hexdigest()

            if user.password_hash != password_hash:
                session.close()
                print(f"❌ Senha incorreta para {username_input}")
                return jsonify({"error": "Senha incorreta"}), 401

        print(f"✅ Login SUCESSO: {user.name}")

        try:
            user.last_login = datetime.utcnow() # Atualiza a hora
            session.commit() # Salva no banco
        except Exception as e:
            print(f"Erro ao salvar last_login: {e}")
            session.rollback()

        # 4. Retorna os dados para o Frontend (localStorage)
        user_data = {
            "id": user.id,
            "name": user.name,
            "username": user.username,
            "email": user.email,
            "access_level": user.access_level,
            "token": "fake-jwt-token-123" # Simulação de Token
        }

        print("\n🔐 TENTATIVA DE LOGIN RECEBIDA:")
        print(f"Dados brutos: {data}")
        
        # --- PRINT CORRIGIDO ---
        print("\n📤 RESPOSTA DO BACKEND (O que o site vai receber):")
        print(user_data) # <--- CORREÇÃO AQUI (Estava response_data)
        print("-" * 30)
        
        session.close()
        return jsonify(user_data), 200

    except Exception as e:
        print(f"❌ Erro no Login: {e}")
        # Retorna o erro exato para facilitar o debug
        return jsonify({"error": str(e)}), 500
    
    
# ==========================================
# ROTAS AUXILIARES DO DASHBOARD
# ==========================================
@app.route("/financeiro/dashboard", methods=["POST"])
def get_dados_financeiros_route():
    try:
        filtros = request.json or {}
        dados = obter_dados_financeiros(filtros)
        return jsonify(dados), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/dashboard-financeiro', methods=['GET'])
def get_dashboard_financeiro_get():
    return jsonify(obter_dados_financeiros({}))


@app.route('/api/lista-credores', methods=['GET'])
def get_lista_credores():
    return jsonify(sorted(list(set(CREDOR_VS_CAMPANHA.keys()))))

@app.route('/api/lista-campanhas', methods=['GET'])
def get_lista_campanhas():
    todas = []
    for lista in CREDOR_VS_CAMPANHA.values(): todas.extend(lista)
    return jsonify(sorted(list(set(todas))))

@app.route('/api/resumo-objetivos', methods=['GET', 'POST'])
def get_resumo_objetivos_api():
    filtros = request.json if request.method == 'POST' else {}
    return jsonify(obter_resumo_objetivos(filtros, engine_fin))

@app.route('/api/dashboard-carteira', methods=['POST'])
def get_dashboard_carteira_api():
    try:
        filtros = request.json or {}
        
        # 1. Busca os dados no Banco (Isso pode demorar, como vimos no log)
        dados = obter_dados_carteira(filtros, engine_fin)
        
        # 2. SANITIZAÇÃO: Converte None para 0.0 para não quebrar o Front
        if dados:
            for categoria in ['composicao', 'realizado']:
                if categoria in dados:
                    for chave, valor in dados[categoria].items():
                        if valor is None:
                            dados[categoria][chave] = 0.0
        else:
            # Se vier vazio total, retorna estrutura zerada
            dados = {
                "composicao": {"casosNovos": 0, "acordosVencer": 0, "colchaoCorrente": 0, "colchaoInadimplido": 0, "totalCasos": 0},
                "realizado": {"novosAcordos": 0, "colchaoAntecipado": 0, "colchaoCorrente": 0, "colchaoInadimplido": 0, "caixaTotal": 0}
            }

        return jsonify(dados), 200

    except Exception as e:
        print(f"❌ Erro Dashboard Carteira: {e}")
        return jsonify({"error": str(e)}), 500
    
@app.route('/api/composicao-carteira', methods=['POST'])
def get_composicao_carteira():
    """
    Nova rota específica para a página 'Composição da Carteira'.
    Usa a nova função 'get_dados_composicao_especifico' que corrige os filtros.
    """
    print("🚀 [ROTA NOVA] Chamando /api/composicao-carteira")
    try:
        filtros = request.json or {}
        
        # Chama a função nova dedicada
        dados = get_dados_composicao_especifico(filtros, engine_fin)
        
        # Sanitização (Garante zeros se vier vazio)
        if not dados:
            dados = {
                "composicao": {"casosNovos": 0, "acordosVencer": 0, "colchaoCorrente": 0, "colchaoInadimplido": 0, "totalCasos": 0},
                "realizado": {"novosAcordos": 0, "colchaoAntecipado": 0, "colchaoCorrente": 0, "colchaoInadimplido": 0, "caixaTotal": 0}
            }

        return jsonify(dados), 200

    except Exception as e:
        print(f"❌ Erro Rota Composição: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/painel-objetivo', methods=['POST'])
def get_painel_objetivo():
    session = SessionLocal()
    try:
        filtros = request.json
        # ... (Logica resumida, certifique-se que o serviço faz o trabalho pesado)
        return jsonify({"caixa": {"recebido": 0}, "message": "Dados do painel"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()

@app.route('/painel-objetivo/opcoes', methods=['GET'])
def opcoes_filtros():
    # 1. ABRE A CONEXÃO (A CHAVE DO COFRE)
    db = SessionLocal()
    
    try:
        print("🚀 [ROTA] Buscando opções de filtros (Negociadores/Campanhas)...")

        # 2. Buscar Negociadores (Usa 'db' em vez de 'session')
        # Filtra apenas usuários ativos para não sujar a lista
        negociadores_db = db.query(User).filter(User.ativo == True).all()
        
        lista_negociadores = [
            {"label": u.name, "value": u.name} 
            for u in negociadores_db
        ]

        # 3. Buscar Estrutura Credor -> Campanhas
        # O distinct garante que não venha duplicado
        campanhas_db = db.query(UserCampanha.credor, UserCampanha.campanha).distinct().all()

        mapa_credores = {}

        for credor, campanha in campanhas_db:
            if not credor: continue # Pula vazios
            
            # Se o credor ainda não está no mapa, cria a lista
            if credor not in mapa_credores:
                mapa_credores[credor] = []
            
            # Adiciona a campanha se ela existir e não estiver na lista ainda
            if campanha and campanha not in mapa_credores[credor]:
                mapa_credores[credor].append(campanha)

        # 4. Ordenar as listas para ficar bonito no front
        for credor in mapa_credores:
            mapa_credores[credor].sort()
            
        print(f"✅ [SUCESSO] Encontrados {len(lista_negociadores)} negociadores e {len(mapa_credores)} credores.")

        response_data = {
            "negociadores": lista_negociadores,
            "credores_campanhas": mapa_credores
        }

        return jsonify(response_data), 200

    except Exception as e:
        print(f"❌ [ERRO] Falha ao buscar opções: {e}")
        return jsonify({"error": str(e)}), 500
        
    finally:
        # 5. IMPORTANTE: FECHAR A CONEXÃO SEMPRE
        db.close()
    

@app.route("/negociador_celula/resumo", methods=["GET"])
def rota_resumo_celula():
    try:
        # Pega datas da URL (?data_inicio=...&data_fim=...)
        dt_inicio = request.args.get("data_inicio")
        dt_fim = request.args.get("data_fim")

        # Fallback se não vier data (Pega mês atual)
        if not dt_inicio or not dt_fim:
            hoje = datetime.now()
            dt_inicio = hoje.strftime("%Y-%m-01")
            dt_fim = hoje.strftime("%Y-%m-30")

        dados = get_resumo_celulas(dt_inicio, dt_fim)
        
        return jsonify(dados), 200

    except Exception as e:
        print(f"Erro na rota celula: {e}")
        return jsonify({"error": str(e)}), 500
    

def query_acionamentos_base(filtros):
    """
    Função auxiliar que monta a query SQL dinamicamente com base nos filtros.
    Retorna a string SQL e o dicionário de parâmetros.
    """
    # 1. Captura filtros do JSON
    data_inicio = filtros.get('data_inicio')
    data_fim = filtros.get('data_fim')
    cliente = filtros.get('cliente')       # Corresponde à coluna CREDOR
    negociador = filtros.get('negociador') # Corresponde à coluna NEGOCIADOR
    campanha = filtros.get('campanha')     # Corresponde à coluna CAMPANHA

    # 2. Query Base
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

    # 3. Aplicação Dinâmica de Filtros
    
    # Filtro de Data (Obrigatório ou Fallback para hoje)
    if data_inicio and data_fim:
        sql += " AND DATA BETWEEN :dt_inicio AND :dt_fim"
        # Ajuste para garantir que pegue o dia final inteiro (até 23:59:59)
        params['dt_inicio'] = f"{data_inicio} 00:00:00"
        params['dt_fim'] = f"{data_fim} 23:59:59"
    
    # Filtro de Cliente (Credor)
    if cliente and cliente != "Choose an option" and cliente != "":
        sql += " AND CREDOR = :cliente"
        params['cliente'] = cliente

    # Filtro de Negociador
    if negociador and negociador != "Choose an option" and negociador != "":
        sql += " AND NEGOCIADOR = :negociador"
        params['negociador'] = negociador

    # Filtro de Campanha
    if campanha and campanha != "Choose an option" and campanha != "":
        sql += " AND CAMPANHA = :campanha"
        params['campanha'] = campanha

    # Ordenação padrão
    sql += " ORDER BY DATA DESC"

    return sql, params

@app.route('/api/acionamentos/listar', methods=['POST'])
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
                # Formata a data para string bonita (DD/MM/YYYY HH:MM)
                "DATA": row.DATA.strftime("%Y-%m-%d %H:%M") if row.DATA else "-"
            })
            
        return jsonify(lista_retorno), 200

    except Exception as e:
        print(f"❌ Erro ao listar acionamentos: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()

@app.route('/api/acionamentos/exportar', methods=['POST'])
def exportar_acionamentos():
    """
    Gera um arquivo CSV compatível com Excel base nos mesmos filtros da tela.
    """
    import io
    import csv
    from flask import Response

    session = SessionLocal()
    try:
        filtros = request.json or {}
        sql, params = query_acionamentos_base(filtros)
        
        # Aumenta o limite para exportação (opcional, remove o TOP 1000 se quiser tudo)
        sql = sql.replace("TOP 1000", "") 
        
        result = session.execute(text(sql), params).fetchall()

        # Cria o CSV em memória
        output = io.StringIO()
        # delimiter=';' é importante para o Excel no Brasil reconhecer as colunas automaticamente
        writer = csv.writer(output, delimiter=';', quoting=csv.QUOTE_MINIMAL)

        # Cabeçalhos
        writer.writerow(["ID Campanha", "Credor", "Campanha", "CPF/CNPJ", "Nome Cliente", "Negociador", "ID Usuário", "RO (Resultado)", "Data"])

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
                row.DATA.strftime("%d/%m/%Y %H:%M") if row.DATA else "-"
            ])

        output.seek(0)
        
        return Response(
            output,
            mimetype="text/csv",
            headers={"Content-Disposition": "attachment;filename=acionamentos_filtrados.csv"}
        )

    except Exception as e:
        print(f"❌ Erro ao exportar: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()


# ==========================================
# ROTA NOVA: LISTA DE NEGOCIADORES (ATIVOS)
# ==========================================

@app.route('/api/lista-negociadores', methods=['GET'])
def get_lista_negociadores_api():
    try:
        # Busca a lista direto do banco de dados financeiro
        negociadores = get_negociadores_ativos()
        
        # Retorna o JSON que o React espera
        return jsonify(negociadores), 200
    except Exception as e:
        print(f"Erro ao listar negociadores: {e}")
        return jsonify({"error": str(e)}), 500
    
    
@app.route('/api/pendencias', methods=['GET'])
def get_pendencias():
    try:
        # Busca os dados processados
        dados = listar_tarefas_roadmap()
        return jsonify(dados), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
# --- ROTA PARA CONCLUIR TAREFA (POST) ---
@app.route('/api/pendencias/<task_id>/concluir', methods=['POST'])
def rota_concluir_tarefa(task_id):
    try:
        url = f"https://api.clickup.com/api/v2/task/{task_id}"
        
        payload = {
            "status": "concluído" 
        }
        
        headers = {
            "Authorization": API_TOKEN,  
            "Content-Type": "application/json"
        }

        print(f"🔄 Tentando concluir tarefa {task_id}...")
        response = requests.put(url, json=payload, headers=headers)

        if response.status_code == 200:
            print(f"✅ Tarefa {task_id} concluída com sucesso!")
            return jsonify({"message": "Tarefa concluída"}), 200
        else:
            print(f"❌ Erro ClickUp: {response.text}")
            return jsonify({"error": "Falha ao atualizar no ClickUp"}), response.status_code

    except Exception as e:
        print(f"❌ Erro interno: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/composicao-carteira", methods=["POST"])
def dashboard_composicao():
    session = SessionLocal()
    try:
        data = request.json
        # Aqui você pode usar os filtros 'data.negociador', 'data.campanha' se quiser refinar o SQL
        
        # Datas para cálculos
        hoje = datetime.now()
        inicio_mes = hoje.replace(day=1)
        proximos_30_dias = hoje + timedelta(days=30)

        # ==========================================================
        # 1. NOVOS ACORDOS (Baseado na DATA_CADASTRO deste mês)
        # ==========================================================
        # SQL Server usa MONTH() e YEAR(). Ajuste se for outro banco.
        sql_novos = text("""
            SELECT SUM(VALOR) FROM tbacompanhamentoporstatus(inativo) 
            WHERE MONTH(DATA_CADASTRO) = :mes AND YEAR(DATA_CADASTRO) = :ano
        """)
        novos_acordos_valor = session.execute(sql_novos, {"mes": hoje.month, "ano": hoje.year}).scalar() or 0.0

        # ==========================================================
        # 2. ACORDOS A VENCER (Vencimento nos próximos 30 dias)
        # ==========================================================
        sql_vencer = text("""
            SELECT SUM(VALOR) FROM tbacompanhamentoporstatus(inativo) 
            WHERE VENCIMENTO >= :hoje AND VENCIMENTO <= :futuro AND STATUS_TITULO = 'Aberto'
        """)
        acordos_vencer_valor = session.execute(sql_vencer, {"hoje": hoje.date(), "futuro": proximos_30_dias.date()}).scalar() or 0.0

        # ==========================================================
        # 3. COLCHÕES (Agrupamento por Status)
        # ==========================================================
        sql_status = text("SELECT Status, SUM(VALOR), SUM(VALOR_PAGO) FROM tbacompanhamentoporstatus(inativo) GROUP BY Status")
        resultados = session.execute(sql_status).fetchall()

        colchao_corrente = 0.0
        colchao_inadimplido = 0.0
        
        colchao_corrente_recebido = 0.0
        colchao_inadimplido_recebido = 0.0

        for row in resultados:
            status_txt = str(row[0] or "").lower()
            valor_total = float(row[1] or 0.0)
            valor_pago = float(row[2] or 0.0)

            # Lógica inteligente baseada nos nomes que vimos no Raio-X
            if "futuro" in status_txt or "em dia" in status_txt or "corrente" in status_txt:
                colchao_corrente += valor_total
                colchao_corrente_recebido += valor_pago
            elif "inadimplente" in status_txt or "atrasado" in status_txt or "vencido" in status_txt:
                colchao_inadimplido += valor_total
                colchao_inadimplido_recebido += valor_pago
            else:
                # Se sobrar algo (ex: "Inadimplente A Vencer"), decidimos onde colocar.
                # Como vimos "Inadimplente A Vencer", vamos somar no inadimplido por segurança
                colchao_inadimplido += valor_total

        # ==========================================================
        # 4. TOTAIS GERAIS
        # ==========================================================
        sql_total = text("SELECT SUM(VALOR), SUM(VALOR_PAGO) FROM tbacompanhamentoporstatus(inativo)")
        totais = session.execute(sql_total).fetchone()
        
        total_carteira = float(totais[0] or 0.0)
        caixa_total = float(totais[1] or 0.0)

        # Monta a resposta ESTRUTURADA EXATAMENTE como o Frontend pede
        response_data = {
            "composicao": {
                "casosNovos": novos_acordos_valor,         # Preenche o card "Novos Acordos"
                "acordosVencer": acordos_vencer_valor,     # Preenche o card "A Vencer"
                "colchaoCorrente": colchao_corrente,
                "colchaoInadimplido": colchao_inadimplido, # Preenche o card vermelho
                "totalCasos": total_carteira
            },
            "realizado": {
                "novosAcordos": novos_acordos_valor, # Assumindo que novos acordos contam como realizado ou criar lógica separada para pago
                "colchaoAntecipado": 0.0,            # Pode implementar depois se tiver coluna de antecipação
                "colchaoCorrente": colchao_corrente_recebido,
                "colchaoInadimplido": colchao_inadimplido_recebido,
                "caixaTotal": caixa_total
            }
        }

        return jsonify(response_data), 200

    except Exception as e:
        print(f"Erro detalhado API: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()



@app.route('/negociador/dashboard-metas', methods=['POST'])
def dashboard_metas():
    session = SessionLocal()
    try:
        data = request.json
        
        # Filtros
        negociador_filtro = data.get('negociador', 'Pedro Calais')
        data_ref_str = data.get('data_referencia', datetime.now().strftime('%Y-%m'))
        try:
            ano_ref, mes_ref = map(int, data_ref_str.split('-'))
        except:
            hoje = datetime.now()
            ano_ref, mes_ref = hoje.year, hoje.month

        print(f"📊 Dashboard SQL | User: {negociador_filtro} | Ref: {mes_ref}/{ano_ref}")

        # ---------------------------------------------------------
        # A. QUERY 1: CARTEIRA (COMPOSIÇÃO)
        # ---------------------------------------------------------
        q_carteira = session.query(
            # Novos Acordos (Usando .Status e .VALOR)
            func.sum(case((TBAcompanhamento.Status == 'Novo', TBAcompanhamento.VALOR), else_=0)),
            # A Vencer (Usando Status 'Aberto' como exemplo)
            func.sum(case((TBAcompanhamento.Status == 'Aberto', TBAcompanhamento.VALOR), else_=0)),
            # Colchão Corrente
            func.sum(case((TBAcompanhamento.Status == 'Corrente', TBAcompanhamento.VALOR), else_=0)),
            # Colchão Inadimplido
            func.sum(case((TBAcompanhamento.Status == 'Inadimplido', TBAcompanhamento.VALOR), else_=0)),
            # Total Geral
            func.sum(TBAcompanhamento.VALOR)
        ).filter(
            TBAcompanhamento.NEGOCIADOR == negociador_filtro
        ).first()

        # Trata valores NULL como 0.0
        novos, a_vencer, corrente, inadimplido, total_geral = (
            float(x or 0) for x in (q_carteira if q_carteira else [0,0,0,0,0])
        )

        # ---------------------------------------------------------
        # B. QUERY 2: CAIXA REALIZADO (RECEBIMENTO)
        # ---------------------------------------------------------
        q_caixa = session.query(
            func.sum(TBAcompanhamento.Recebimento),
            func.sum(case((TBAcompanhamento.Status == 'Corrente', TBAcompanhamento.Recebimento), else_=0)),
            func.sum(case((TBAcompanhamento.Status == 'Inadimplido', TBAcompanhamento.Recebimento), else_=0))
        ).filter(
            TBAcompanhamento.NEGOCIADOR == negociador_filtro,
            TBAcompanhamento.Recebimento > 0,
            
            # 👇 CORREÇÃO CRUCIAL: Usando a coluna real [DATA_RECEBIMENTO]
            extract('year', TBAcompanhamento.DATA_RECEBIMENTO) == ano_ref,
            extract('month', TBAcompanhamento.DATA_RECEBIMENTO) == mes_ref
        ).first()

        caixa_total, caixa_corrente, caixa_inadimplido = (
            float(x or 0) for x in (q_caixa if q_caixa else [0,0,0])
        )

        # ---------------------------------------------------------
        # C. CÁLCULOS FINAIS
        # ---------------------------------------------------------
        META_MENSAL = 3000000.00
        percentual = (caixa_total / META_MENSAL * 100) if META_MENSAL > 0 else 0

        # Média Diária Simplificada
        import calendar
        dias_no_mes = calendar.monthrange(ano_ref, mes_ref)[1]
        dia_hoje = datetime.now().day if (datetime.now().month == mes_ref) else 1
        dias_restantes = max(1, dias_no_mes - dia_hoje)
        
        necessario = max(0, META_MENSAL - caixa_total)
        media_diaria = necessario / dias_restantes if necessario > 0 else 0

        # Retorno JSON
        return jsonify({
            "composicao_carteira": {
                "novos_acordos": novos,
                "a_vencer": a_vencer,
                "colchao_corrente": corrente,
                "colchao_inadimplido": inadimplido,
                "total_geral": total_geral
            },
            "realizado_caixa": {
                "novos_acordos_rec": 0.0,
                "antecipado": 0.0,
                "corrente_recebido": caixa_corrente,
                "inadimplido_rec": caixa_inadimplido,
                "caixa_total": caixa_total
            },
            "meta_global": {
                "atingido_valor": caixa_total,
                "meta_total_valor": META_MENSAL,
                "percentual": round(percentual, 1)
            },
            "simulador": {
                "valor_escolhido": 0.0,
                "ddal_atual": 0.0
            },
            "performance_projetada": {
                "necessario": necessario,
                "realizado": caixa_total,
                "diferenca": necessario,
                "media_diaria": media_diaria
            }
        })

    except Exception as e:
        print(f"❌ Erro SQL: {e}")
        # Log detalhado do erro para ajudar no debug
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()

app.register_blueprint(telemetry_bp, url_prefix='/telemetry')

# --- DEBUG: RASTREADOR DE TABELAS ---
from sqlalchemy import inspect
from database import engine

print("\n" + "="*40)
print("🕵️  INVESTIGAÇÃO DE TABELAS SQL")
print("="*40)

inspector = inspect(engine)
tabelas_reais = inspector.get_table_names() # Pega nomes brutos do banco

print(f"Total encontrado: {len(tabelas_reais)} tabelas.")
print("Lista oficial do Banco de Dados:")
for t in tabelas_reais:
    print(f" -> '{t}'")

print("="*40 + "\n")
# ------------------------------------
# ==============================================================================
# 🚀 PONTO DE ENTRADA DO SERVIDOR 
# ==============================================================================
if __name__ == '__main__':
    print("🚀 Servidor Iniciado na porta 5000")
    app.run(debug=True, port=5000)