import pandas as pd
from sqlalchemy import text
from datetime import datetime

# Importação segura das variáveis globais
try:
    from config.constants import credor_vs_campanha
except ImportError:
    print("⚠️ ERRO CRÍTICO: Não foi possível importar 'credor_vs_campanha' em objetivo_service.py")
    credor_vs_campanha = {}

def obter_resumo_objetivos(filtros, engine):
    # 1. Definição de Datas e Filtros
    hoje = datetime.now()
    data_ini = filtros.get('data_inicio') or hoje.strftime('%Y-%m-01')
    data_fim = filtros.get('data_fim') or hoje.strftime('%Y-%m-%d')
    credores_filtro = filtros.get('credores', [])

    print(f"📊 Processando Resumo (Service): {data_ini} a {data_fim}")

    # 2. Query SQL Otimizada
    # Trazemos os dados brutos. A limpeza de espaços será feita no Pandas.
    sql = text("""
    SELECT 
        CREDOR, 
        CAMPANHA, 
        ISNULL(MoValorRecebido, 0) as VALOR_PAGO,
        ISNULL(Saldo, 0) as SALDO,
        Data_Recebimento, 
        Data_de_Acordo
    FROM RelatorioBase
    WHERE (Data_Recebimento >= :inicio AND Data_Recebimento <= :fim)
       OR (Data_de_Acordo >= :inicio AND Data_de_Acordo <= :fim)
    """)
    
    try:
        with engine.connect() as conn:
            df = pd.read_sql(sql, conn, params={"inicio": data_ini, "fim": data_fim})
    except Exception as e:
        print(f"❌ Erro SQL: {e}")
        return []

    if df.empty:
        print("⚠️ DataFrame vazio no período.")
        return []

    # --- 3. LIMPEZA DOS DADOS (O PULO DO GATO) ---
    # Remove espaços em branco do início e fim das campanhas vindas do BANCO
    # Converte para string e remove espaços extras
    df['CAMPANHA'] = df['CAMPANHA'].astype(str).str.strip()
    
    cards = []

    # 4. Agrupamento e Cruzamento
    for credor, campanhas_alvo in credor_vs_campanha.items():
        
        # Filtro de Credor (Se o usuário selecionou no frontend)
        if credores_filtro and credor not in credores_filtro:
            continue

        # --- LIMPEZA DO DICIONÁRIO ---
        # Cria uma lista limpa das campanhas do arquivo de VARIÁVEIS (remove espaços extras)
        campanhas_limpas = [str(c).strip() for c in campanhas_alvo]

        # Filtra o DF cruzando a campanha LIMPA do banco com a lista LIMPA do dicionário
        df_credor = df[df['CAMPANHA'].isin(campanhas_limpas)]
        
        # Se não tem dados para este credor, pula
        if df_credor.empty:
            continue

        # --- CÁLCULOS ---
        
        # 1. Caixa Recebido (Soma do valor pago)
        caixa_recebido = df_credor['VALOR_PAGO'].sum()
        
        # 2. Previsão 
        # Lógica: Títulos que NÃO foram pagos (Valor Pago = 0) mas o Saldo existe
        mask_aberto = (df_credor['VALOR_PAGO'] == 0)
        previsao = df_credor[mask_aberto]['SALDO'].sum()

        # 3. Objetivo e Projeção
        objetivo_total = caixa_recebido + previsao
        projecao = objetivo_total # Projeção simples (Recebido + A Receber)

        percentual = 0
        if objetivo_total > 0:
            percentual = (caixa_recebido / objetivo_total) * 100

        # Ignora cards onde tudo é zero
        if objetivo_total == 0 and caixa_recebido == 0:
            continue

        cards.append({
            "credor": credor,
            "objetivo": float(objetivo_total),
            "recebido": float(caixa_recebido),
            "previsao": float(previsao),
            "projecao": float(projecao),
            "percentual": float(percentual)
        })

    # Ordena os cards: Maior valor recebido primeiro
    cards.sort(key=lambda x: x['recebido'], reverse=True)
    
    print(f"✅ Retornando {len(cards)} cards processados.")
    return cards