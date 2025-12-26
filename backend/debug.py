import requests
import json

# --- CONFIGURAÇÕES (Preencha com seus dados reais do app.py) ---
api_token = "pk_94075967_BJ9E2OY0BBMH7ETBE34190NC90063D7U"  
LIST_ID = "901300238118"
LIST_ID2= "901322563022"

def diagnostico_clickup():
    url = f"https://api.clickup.com/api/v2/list/{LIST_ID}/task"
    
    query = {
        "archived": "false",
        "include_closed": "true", # Traz tarefas fechadas também
        "order_by": "updated",
        "reverse": "true",
        "page": 0
    }

    headers = {
        "Authorization": api_token,
        "Content-Type": "application/json"
    }

    print(f"\n🔍 Iniciando Raio-X na lista: {LIST_ID}...\n")

    try:
        response = requests.get(url, headers=headers, params=query)
        
        if response.status_code != 200:
            print(f"❌ Erro de Conexão: {response.status_code}")
            print(response.text)
            return

        data = response.json()
        tarefas = data.get('tasks', [])

        print(f"📦 Total de tarefas recuperadas: {len(tarefas)}")
        print("-" * 50)

        for i, task in enumerate(tarefas[:5]): # Analisa apenas as 5 primeiras para não poluir
            print(f"🔹 TAREFA {i+1}: {task['name']}")
            print(f"   ID: {task['id']}")
            
            # Raio-X do Status
            status_obj = task.get('status', {})
            status_text = status_obj.get('status', 'N/A')
            print(f"   🚩 STATUS (Raw): '{status_text}' (Tipo: {type(status_text)})")
            
            # Raio-X das Tags
            tags = [t['name'] for t in task.get('tags', [])]
            print(f"   🏷️  TAGS: {tags}")
            
            print("-" * 50)

    except Exception as e:
        print(f"❌ Erro fatal no script: {e}")

if __name__ == "__main__":
    diagnostico_clickup()