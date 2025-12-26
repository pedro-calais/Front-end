import json
import requests
from datetime import datetime, timedelta, date
from utilities.variaveis_globais import campos_dict, obter_id_responsavel_tecnico

# --- CONFIGURAÇÕES ---
api_token = "pk_94075967_BJ9E2OY0BBMH7ETBE34190NC90063D7U"  
LIST_ID = "901300238118"
LIST_ID2= "901322563022"

# MAPA DE IDs PARA O DROPDOWN (ClickUp exige o UUID, não o nome)
DEMANDA_OPTION_IDS = {
    "Alteração de Vínculo": "b01cc783-f61c-4226-832c-2831e1aa2dee",
    "Inclusão de Parcela": "4a6197a4-8708-4227-827c-b718f0879243",
    "Devolução de clientes/parcelas": "37bb9861-ec35-4f20-85ad-9315885dccdf",
    "Higienização / Enriquecimento de Dados": "a9c4e0ed-98b7-44ec-9d69-cfbf229c641e",
    "Importação de Novos Clientes": "db93b102-4b52-4fcc-b7ca-7d6f7a084fa5",
    "Quebra de acordo": "4258af80-5258-4f19-af45-67aba4b526bb",
    "Batimento de Carteira": "99e28e13-ad4f-4973-b230-8422a39876bd",
    "Divisão de carteira": "a0b0b666-8ea4-4f6a-946e-a3e30fac5752",
    "Relatório - Banco de dados": "a44b8f1d-8c9b-4e6d-9bfe-3063307a11db",
    "Apresentação": "a3ba7848-3dfa-4377-a640-4a2932dd2ab6",
    "Disparar Ação Digital": "f12dfa5d-6b3c-4516-82e5-80774832711f",
    "Criação de Acessos": "ba18987b-b9c2-4770-9412-26ef62c08480",
    "Erro do Sistema": "da180e26-4a48-44af-adef-2debb6956c7b",
    "Fluxo contencioso": "09e0eb40-209b-4ddd-b5b1-97a593182e56",
    "Treinamento": "116f6e6d-cc87-4f09-9aef-8157d5ed3abb",
    "Atualização Ritual Diário": "f54d1189-c8f9-4ade-a63c-5213b1ca6c3a",
    "Faturamento": "d4cd0115-e759-49c3-b7ba-9325c3214282",
    "Gravações Ligações": "4d2deca7-996f-4c72-a1c0-5b183887355a",
    "Cadastrar template de Whatsapp": "907c1c30-652a-4c90-99a7-2734617e567a",
    "Ajuste de Dashboard": "035334c7-b6da-4120-88de-fe7f9718da1b",
    "Suporte Técnico": "1c9f97ae-83b3-4ef4-ab60-d568f8d70cd3",
    "Discador": "4e472839-1600-4fe2-9af9-3be3be04005c"
}

def calcular_vencimento_ms():
    hoje = date.today()
    dia_semana = hoje.weekday()  # 0=Seg ... 4=Sex
    if dia_semana == 4:      # Sexta
        delta = 3
    elif dia_semana == 5:    # Sábado
        delta = 2
    else:
        delta = 1
    data_venc = hoje + timedelta(days=delta)
    dt_final = datetime.combine(data_venc, datetime.min.time().replace(hour=18))
    return int(dt_final.timestamp() * 1000)

def formatar_tabelas_na_descricao(descricao_original, dados):
    texto = [descricao_original, "\n---"]
    texto.append("**DADOS DO CLIENTE**")
    texto.append(f"👤 Nome: {dados.get('nome_cliente', 'N/A')}")
    texto.append(f"🆔 CPF: {dados.get('cpf_cliente', 'N/A')}")
    texto.append(f"🙋 Solicitante: {dados.get('nome_solicitante', 'N/A')}")
    texto.append("\n---")

    def carregar_json(campo):
        try:
            val = dados.get(campo)
            if isinstance(val, str):
                return json.loads(val)
            return val if val else []
        except:
            return []

    parcelas = carregar_json("dados_parcelas")
    if parcelas:
        texto.append("**📋 PARCELAS**")
        for p in parcelas:
            if isinstance(p, dict) and p.get("valor"):
                texto.append(f"- Venc: {p.get('vencimento')} | R$ {p.get('valor')} | Tipo: {p.get('tipo')}")
        texto.append("")

    devolucoes = carregar_json("dados_devolucoes")
    if devolucoes:
        texto.append("**💸 DEVOLUÇÕES**")
        for d in devolucoes:
            if isinstance(d, dict):
                texto.append(f"- Venc: {d.get('vencimento')} | R$ {d.get('valor')} | Parc: {d.get('parcela')}")
        texto.append("")

    return "\n".join(texto)

def processar_abertura_chamado(dados, arquivos):
    # 1. Título e Descrição
    titulo = f"{dados.get('tipo_demanda')} : {dados.get('titulo')}"
    descricao = formatar_tabelas_na_descricao(dados.get("descricao", ""), dados)

    # 2. Tratamento do Dropdown de Demanda (CORREÇÃO AQUI)
    tipo_demanda_nome = dados.get("tipo_demanda")
    # Tenta pegar o ID UUID. Se não achar, não manda o campo para não dar erro 400.
    id_opcao_demanda = DEMANDA_OPTION_IDS.get(tipo_demanda_nome)

    # 3. Custom Fields
    custom_fields = [
        {"id": campos_dict["CAMPANHA_FIELD_ID"], "value": dados.get("campanha")},
        {"id": campos_dict["CREDOR_FIELD_ID"], "value": dados.get("credor")},
        {"id": campos_dict.get("CPF_CLIENTE_FIELD_ID"), "value": dados.get("cpf_cliente")},
        {"id": campos_dict.get("NOME_CLIENTE_FIELD_ID"), "value": dados.get("nome_cliente")},
        {"id": campos_dict.get("NOME_FIELD_ID"), "value": dados.get("nome_solicitante")}, 
    ]

    # Só adiciona o campo de demanda se tivermos o ID válido (UUID)
    if id_opcao_demanda:
        custom_fields.append({"id": campos_dict["TIPO_DEMANDA_FIELD_ID"], "value": id_opcao_demanda})
    else:
        print(f"⚠️ AVISO: UUID não encontrado para a demanda '{tipo_demanda_nome}'. O campo ficará vazio.")

    # Remove campos sem valor
    custom_fields = [c for c in custom_fields if c.get("id") and c.get("value")]

    # 4. Responsável (LÓGICA CORRIGIDA)
    id_tecnico = obter_id_responsavel_tecnico(tipo_demanda_nome)
    
    lista_assignees = []
    if id_tecnico:
        lista_assignees.append(int(id_tecnico))
        print(f"✅ Responsável definido: {id_tecnico} para '{tipo_demanda_nome}'")
    else:
        print(f"⚠️ AVISO: Nenhum responsável configurado para: '{tipo_demanda_nome}'")

    # 5. Payload
    payload = {
        "name": titulo,
        "description": descricao,
        "status": "Novo",
        "priority": 2,
        "assignees": lista_assignees, # USANDO A LISTA CERTA
        "notify_all": True,
        "due_date": calcular_vencimento_ms(),
        "custom_fields": custom_fields,
    }

    # 6. Criar tarefa
    url = f"https://api.clickup.com/api/v2/list/{LIST_ID}/task"
    headers = {
        "Authorization": api_token,
        "Content-Type": "application/json",
    }

    print(f"📤 Enviando para ClickUp...")
    response = requests.post(url, json=payload, headers=headers)

    if response.status_code != 200:
        print(f"❌ Erro ClickUp ({response.status_code}): {response.text}")
        raise Exception(f"Erro ClickUp: {response.text}")

    task_id = response.json()["id"]
    print("✅ Task criada com sucesso:", task_id)

    # 7. Upload de anexos
    if arquivos:
        for arquivo in arquivos:
            if arquivo.filename:
                arquivo.seek(0)
                files = {
                    "attachment": (arquivo.filename, arquivo.read(), arquivo.content_type)
                }
                url_att = f"https://api.clickup.com/api/v2/task/{task_id}/attachment"
                requests.post(url_att, headers={"Authorization": api_token}, files=files)

    return task_id

# --- NOVA FUNÇÃO PARA ROADMAP ---

# --- FUNÇÃO CORRIGIDA ---
def listar_tarefas_roadmap(tag_filtro="roadmap-dashboard"):
    # ... (URL e Headers continuam iguais) ...
    url = f"https://api.clickup.com/api/v2/list/{LIST_ID2}/task"
    
    query = {
        "archived": "false",
        "include_closed": "true", # Garante que traz as fechadas
        "order_by": "updated",
        "reverse": "true",
    }

    headers = {
        "Authorization": api_token,
        "Content-Type": "application/json"
    }

    try:
        print(f"📥 Buscando roadmap no ClickUp (Lista: {LIST_ID2})...")
        response = requests.get(url, headers=headers, params=query)
        response.raise_for_status() 
        
        data = response.json()
        tarefas_formatadas = []

        for task in data.get('tasks', []):
            # 1. Filtro de TAG (Mantém igual)
            tags_da_tarefa = [t['name'] for t in task.get('tags', [])]
            if tag_filtro not in tags_da_tarefa:
                continue

            # 2. MAPEAMENTO DE STATUS (AQUI ESTÁ A CORREÇÃO)
            # Pega o status e transforma em minúsculo para comparar
            raw_status = task.get('status', {}).get('status', '').lower()
            
            # Debug: Vai mostrar no seu terminal exatamente o que o ClickUp está mandando
            print(f" > Tarefa: {task['name'][:20]}... | Status Real: '{raw_status}'")

            status_frontend = 'pendente' # Valor padrão (A Fazer)

            # Lista de status que consideram "Em Progresso"
            if raw_status in ['in progress', 'em andamento', 'fazendo', 'a iniciar', 'execução', 'development']:
                status_frontend = 'em_progresso'
            
            # Lista de status que consideram "Concluído"
            # ADICIONE AQUI O NOME EXATO QUE APARECER NO SEU PRINT SE AINDA DER ERRO
            elif raw_status in ['closed', 'complete', 'concluido', 'concluído','feito', 'finalizado', 'done', 'resolvido']:
                status_frontend = 'concluido'

            # ... (Resto do código de prioridade e setor continua igual) ...
            prio_data = task.get('priority')
            prio_id = str(prio_data['id']) if prio_data else '4'
            prioridade_map = {'1': 'alta', '2': 'alta', '3': 'media', '4': 'baixa'}

            setor = "Geral"
            if "tech" in tags_da_tarefa: setor = "Tecnologia"
            elif "ops" in tags_da_tarefa: setor = "Operacional"
            elif "rh" in tags_da_tarefa: setor = "RH"

            tarefas_formatadas.append({
                "id": task['id'],
                "titulo": task['name'],
                "descricao": task['description'] if task['description'] else "Sem descrição.",
                "setor": setor,
                "status": status_frontend,
                "prioridade": prioridade_map.get(prio_id, 'baixa')
            })

        return tarefas_formatadas

    except Exception as e:
        print(f"❌ Erro ao buscar roadmap: {e}")
        return []