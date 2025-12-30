"""ClickUp integration endpoints for chamados and pendencias."""
# routes/clickup_routes.py
import requests
from datetime import datetime, timedelta
from flask import Blueprint, jsonify, request
from config import api_token as API_TOKEN
from config import RESPONSAVEIS_ID, DEMANDAS_LISTA, CREDOR_VS_CAMPANHA, CAMPANHAS_DISPLAY, CLICKUP_LIST_ID, FIELD_IDS


try:
    from utilities.clickup_service import processar_abertura_chamado, listar_tarefas_roadmap
except Exception as e:
    print(f"⚠️ Aviso: clickup_service indisponível: {e}")
    processar_abertura_chamado = None
    listar_tarefas_roadmap = None

clickup_bp = Blueprint("clickup_bp", __name__)

# Atualiza campo customizado em uma tarefa ClickUp.
def update_custom_field(task_id, field_id, value):
    try:
        url = f"https://api.clickup.com/api/v2/task/{task_id}/field/{field_id}"
        headers = {"Authorization": API_TOKEN, "Content-Type": "application/json"}
        payload = {"value": value}
        requests.post(url, headers=headers, json=payload)
    except Exception as e:
        print(f"⚠️ Erro ao atualizar campo {field_id}: {e}")

# Cria chamado no ClickUp com anexos.
@clickup_bp.route("/chamados/criar", methods=["POST"])
def criar_chamado():
    if not processar_abertura_chamado:
        return jsonify({"error": "clickup_service não carregou"}), 500

    try:
        dados_form = request.form.to_dict()
        arquivos = request.files.getlist("files")
        task_id = processar_abertura_chamado(dados_form, arquivos)
        return jsonify({"message": "Chamado criado com sucesso!", "task_id": task_id}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Retorna opcoes de formulario (responsaveis, demandas, campanhas).
@clickup_bp.route("/chamados/opcoes", methods=["GET"])
def obter_opcoes():
    lista_responsaveis = [{"label": k, "value": str(v)} for k, v in RESPONSAVEIS_ID.items()]
    return jsonify({
        "demandas": DEMANDAS_LISTA,
        "credor_vs_campanha": CREDOR_VS_CAMPANHA,
        "campanhas_display": CAMPANHAS_DISPLAY,
        "responsaveis": lista_responsaveis
    })

# Lista chamados recentes para painels.
@clickup_bp.route("/chamados/listar", methods=["GET"])
def listar_chamados():
    try:
        field_solicitante_id = "9840abcf-07c9-4c84-aa45-494be588eaac"

        url = f"https://api.clickup.com/api/v2/list/{CLICKUP_LIST_ID}/task"
        headers = {"Authorization": API_TOKEN}

        data_corte = datetime.now() - timedelta(days=60)
        timestamp_corte = int(data_corte.timestamp() * 1000)

        params = {
            "include_closed": "true",
            "date_created_gt": timestamp_corte,
            "order_by": "created",
        }

        resp = requests.get(url, headers=headers, params=params)
        if resp.status_code != 200:
            return jsonify({"error": resp.text}), 500

        data = resp.json()
        tasks = data.get("tasks", [])

        tarefas_processadas = []
        for t in tasks:
            ts_created = int(t.get("date_created") or 0)
            data_fmt = datetime.fromtimestamp(ts_created / 1000).strftime("%d/%m/%Y")

            ts_closed = t.get("date_closed")
            finalizacao = (
                datetime.fromtimestamp(int(ts_closed) / 1000).strftime("%d/%m/%Y")
                if ts_closed else "Pendente"
            )

            solicitante = "N/A"
            for field in t.get("custom_fields", []):
                if field.get("id") == field_solicitante_id:
                    val = field.get("value")
                    if val is not None:
                        if isinstance(val, dict):
                            solicitante = val.get("username") or val.get("email") or "N/A"
                        elif isinstance(val, list) and len(val) > 0:
                            item = val[0]
                            solicitante = item.get("username") if isinstance(item, dict) else str(item)
                        else:
                            solicitante = str(val)
                    break

            responsavel = "Sem Responsável"
            if t.get("assignees") and len(t["assignees"]) > 0:
                responsavel = t["assignees"][0].get("username") or responsavel

            descricao = t.get("description") or ""

            tarefas_processadas.append({
                "id": t["id"],
                "nome": t["name"],
                "descricao": descricao,
                "status": (t.get("status") or {}).get("status", "").upper(),
                "color": (t.get("status") or {}).get("color"),
                "criacao": data_fmt,
                "finalizacao": finalizacao,
                "responsavel": responsavel,
                "solicitante": solicitante,
                "raw_created": ts_created,
            })

        tarefas_processadas.sort(key=lambda x: x["raw_created"], reverse=True)
        return jsonify(tarefas_processadas), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Roadmap de pendencias (dashboard interno).
@clickup_bp.route("/api/pendencias", methods=["GET"])
def get_pendencias():
    if not listar_tarefas_roadmap:
        return jsonify({"error": "listar_tarefas_roadmap não carregou"}), 500
    try:
        dados = listar_tarefas_roadmap()
        return jsonify(dados), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Conclui tarefa do roadmap.
@clickup_bp.route("/api/pendencias/<task_id>/concluir", methods=["POST"])
def rota_concluir_tarefa(task_id):
    try:
        url = f"https://api.clickup.com/api/v2/task/{task_id}"
        payload = {"status": "concluído"}
        headers = {"Authorization": API_TOKEN, "Content-Type": "application/json"}

        response = requests.put(url, json=payload, headers=headers)
        if response.status_code == 200:
            return jsonify({"message": "Tarefa concluída"}), 200

        return jsonify({"error": response.text}), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500
