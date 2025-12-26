from datetime import datetime
from sqlalchemy import text
from database import SessionLocal

# --- MOCK DE METAS ---
METAS_FIXAS = {
    "Padrao": 50000.0,
}

def calcular_projecao(realizado, data_inicio_str, data_fim_str):
    try:
        dt_ini = datetime.strptime(data_inicio_str, "%Y-%m-%d")
        dt_fim = datetime.strptime(data_fim_str, "%Y-%m-%d")
        hoje = datetime.now()

        if hoje > dt_fim:
            return realizado

        dias_totais = (dt_fim - dt_ini).days + 1
        dias_corridos = (hoje - dt_ini).days
        
        if dias_corridos <= 0: dias_corridos = 1
        if dias_corridos > dias_totais: dias_corridos = dias_totais

        run_rate_diario = realizado / dias_corridos
        projecao = run_rate_diario * dias_totais
        
        return projecao
    except:
        return realizado

def get_resumo_celulas(data_inicio, data_fim):
    session = SessionLocal()
    try:
        # ======================================================================
        # CORREÇÃO: Usando a tabela 'tabelatitulos' que sabemos que existe
        # ======================================================================
        sql = text("""
            SELECT 
                ISNULL(CREDOR, 'OUTROS') as Celula,
                ISNULL(NEGOCIADOR, 'SISTEMA') as Negociador,
                SUM(ISNULL(VALOR_PAGO, 0)) as Realizado
            FROM [Candiotto_DBA].[dbo].[tabelatitulos]
            WHERE DATA_RECEBIMENTO >= :dt_inicio 
              AND DATA_RECEBIMENTO <= :dt_fim
              AND VALOR_PAGO > 0
            GROUP BY CREDOR, NEGOCIADOR
            ORDER BY Celula, Realizado DESC
        """)

        rows = session.execute(sql, {"dt_inicio": data_inicio, "dt_fim": data_fim}).fetchall()

        celulas_map = {}
        id_counter = 1

        for row in rows:
            nome_celula = str(row.Celula).upper().strip()
            negociador = str(row.Negociador).strip()
            valor_realizado = float(row.Realizado or 0)
            
            valor_meta = METAS_FIXAS.get("Padrao", 50000)
            valor_projecao = calcular_projecao(valor_realizado, data_inicio, data_fim)

            if nome_celula not in celulas_map:
                celulas_map[nome_celula] = {
                    "id": id_counter,
                    "nome": nome_celula,
                    "stats": {
                        "objetivo": 0.0,
                        "realizado": 0.0,
                        "projecao": 0.0
                    },
                    "itens": []
                }
                id_counter += 1

            celulas_map[nome_celula]["stats"]["objetivo"] += valor_meta
            celulas_map[nome_celula]["stats"]["realizado"] += valor_realizado
            celulas_map[nome_celula]["stats"]["projecao"] += valor_projecao

            celulas_map[nome_celula]["itens"].append({
                "credor": nome_celula,
                "campanha": nome_celula, 
                "negociador": negociador,
                "meta": valor_meta,
                "realizado": valor_realizado,
                "projecao": valor_projecao
            })

        resultado_final = list(celulas_map.values())
        resultado_final.sort(key=lambda x: x["stats"]["realizado"], reverse=True)

        return resultado_final

    except Exception as e:
        print(f"Erro Negociador Celula: {e}")
        return []
    finally:
        session.close()