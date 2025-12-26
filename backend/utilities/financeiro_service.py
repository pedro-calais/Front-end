import pandas as pd
import numpy as np
from datetime import datetime
from sqlalchemy import text, create_engine

# --- CONEXÃO ÚNICA (DLAnalytics) ---
# Centralizamos tudo no banco que sabemos que funciona e tem os dados
STR_ANALYTICS = "mssql+pyodbc://Rodrigo:abacaxi%40mcsa@192.168.1.8\\CANDIOTTO/DLAnalytics?driver=ODBC+Driver+17+for+SQL+Server"
engine_fin = create_engine(STR_ANALYTICS)

# --- CONFIGURAÇÕES ---
LISTA_NEGRA_CREDOR = [
    'LOCALIZA', 'COMPANHIA DE LOCACAO DAS AMERICAS', 'DIRECIONAL CEF', 
    'BLIP', 'CURUPIRA S.A', 'Demais Clientes MCSA', 'ITAU UNIBANCO S.A.'
]
LISTA_NEGRA_CAMPANHA = ['000042 - Teste Tecnologia', '000045 - Localiza - Judicial']

# --- FUNÇÃO: LISTAR NEGOCIADORES (Do Próprio Relatório) ---
# Busca os nomes que JÁ EXISTEM na tabela financeira. 
# Isso evita o erro de mostrar um negociador no filtro que não tem nas vendas.
def get_negociadores_ativos():
    sql = """
    SELECT DISTINCT NEGOCIADOR 
    FROM RelatorioBase 
    WHERE NEGOCIADOR IS NOT NULL AND NEGOCIADOR <> ''
    ORDER BY NEGOCIADOR
    """
    try:
        with engine_fin.connect() as conn:
            df = pd.read_sql(text(sql), conn)
        # Formata para o frontend
        return df.apply(lambda x: {'label': x['NEGOCIADOR'], 'value': x['NEGOCIADOR']}, axis=1).tolist()
    except Exception as e:
        print(f"⚠️ Erro ao listar negociadores: {e}")
        return []

def obter_dados_financeiros(filtros):
    # 1. PREPARAÇÃO DE DATAS
    hoje = datetime.now()
    data_ini = filtros.get('data_inicio') or hoje.strftime('%Y-%m-01')
    data_fim = filtros.get('data_fim') or hoje.strftime('%Y-%m-%d')

    # 2. QUERY OTIMIZADA
    # Selecionamos diretamente o NOME do negociador (NEGOCIADOR)
    # Trazemos 'Saldo' para previsão e 'MoValorRecebido' para realizado
    sql = text("""
    SELECT 
        Movimentacoes_ID,
        CREDOR,
        CAMPANHA,
        NEGOCIADOR,         -- Nome já resolvido pelo banco
        MoNumeroDocumento,
        MoParcela,
        MoValorRecebido,
        Saldo,              -- Valor Previsto
        Data_Recebimento,
        Data_de_Acordo,
        Referencia,
        Status,
        MoInadimplentesID
    FROM RelatorioBase
    WHERE (Data_Recebimento >= :inicio AND Data_Recebimento <= :fim)
       OR (Data_de_Acordo >= :inicio AND Data_de_Acordo <= :fim)
    """)
    
    try:
        with engine_fin.connect() as conn:
            df = pd.read_sql(sql, conn, params={"inicio": data_ini, "fim": data_fim})
    except Exception as e:
        print(f"❌ Erro SQL: {e}")
        return _retorno_vazio()

    if df.empty: return _retorno_vazio()

    # --- 3. TRATAMENTO DE DADOS ---
    
    # Conversão de Datas
    df['DATA_PAGAMENTO'] = pd.to_datetime(df['Data_Recebimento'], errors='coerce')
    df['VENCIMENTO'] = pd.to_datetime(df['Data_de_Acordo'], errors='coerce')
    
    # Conversão de Valores
    df['VALOR_PAGO'] = pd.to_numeric(df['MoValorRecebido'], errors='coerce').fillna(0)
    df['SALDO'] = pd.to_numeric(df['Saldo'], errors='coerce').fillna(0)

    # Cliente (ID como nome provisório para evitar erro de join)
    df['CLIENTE'] = df['MoInadimplentesID'].apply(lambda x: f"Cliente {int(x)}" if pd.notnull(x) else "-")

    # Normalização de Texto (Limpeza de espaços e conversão para string)
    # Isso evita erros de filtro se vier nulo ou com espaços
    for col in ['CREDOR', 'CAMPANHA', 'NEGOCIADOR', 'Status']:
        if col in df.columns:
            df[col] = df[col].astype(str).str.strip()

    # --- 4. CÁLCULO DE STATUS UNIFICADO ---
    def normalizar_status(row):
        # Pago
        if pd.notnull(row['DATA_PAGAMENTO']) and row['VALOR_PAGO'] > 0: return 'Pago'
        # Novo (Previsão Parcela 1)
        if row['MoParcela'] == 1: return 'Novo'
        # Inadimplente (Vencido e não pago)
        if pd.isnull(row['DATA_PAGAMENTO']) and pd.notnull(row['VENCIMENTO']) and row['VENCIMENTO'] < hoje: 
            return 'Inadimplido'
        return 'Aberto'

    df['STATUS'] = df.apply(normalizar_status, axis=1)

    # Coluna unificada para exibição na tabela (Pago ou Previsto)
    df['VALOR_FINAL'] = np.where(df['STATUS'] == 'Pago', df['VALOR_PAGO'], df['SALDO'])

    # --- 5. APLICAÇÃO DE FILTROS ---
    
    # Filtros Globais
    df = df[~df['CREDOR'].isin(LISTA_NEGRA_CREDOR)]
    df = df[~df['CAMPANHA'].isin(LISTA_NEGRA_CAMPANHA)]

    # Filtros do Usuário (Dropdowns)
    if filtros.get('credores'): 
        df = df[df['CREDOR'].isin(filtros['credores'])]
    if filtros.get('campanhas'): 
        df = df[df['CAMPANHA'].isin(filtros['campanhas'])]
    if filtros.get('negociadores'): 
        df = df[df['NEGOCIADOR'].isin(filtros['negociadores'])]
    if filtros.get('status'): 
        df = df[df['STATUS'].isin(filtros['status'])]

    # --- 6. SEPARAÇÃO PAGAMENTOS / PREVISÃO ---
    
    ts_inicio = pd.to_datetime(data_ini)
    ts_fim = pd.to_datetime(data_fim)

    # DataFrame PAGAMENTOS (Efetivados no período selecionado)
    df_pag = df[
        (df['STATUS'] == 'Pago') & 
        (df['DATA_PAGAMENTO'] >= ts_inicio) & 
        (df['DATA_PAGAMENTO'] <= ts_fim)
    ].copy()

    # DataFrame PREVISÃO (Abertos/Novos/Inadimplentes com vencimento no período)
    df_prev = df[
        (df['STATUS'] != 'Pago') & 
        (df['VENCIMENTO'] >= ts_inicio) & 
        (df['VENCIMENTO'] <= ts_fim)
    ].copy()

    # --- 7. FORMATAÇÃO PARA JSON (Evitar erro NaT) ---
    def safe_date_str(dt_series):
        return dt_series.dt.strftime('%Y-%m-%d').fillna('')

    # Criamos tabela unificada para o grid
    # Filtro: Data Pagamento OU Vencimento no range
    mask_tabela = (
        ((df['DATA_PAGAMENTO'] >= ts_inicio) & (df['DATA_PAGAMENTO'] <= ts_fim)) |
        ((df['VENCIMENTO'] >= ts_inicio) & (df['VENCIMENTO'] <= ts_fim))
    )
    df_tabela = df[mask_tabela].copy()
    
    df_tabela['DATA_PAGAMENTO'] = safe_date_str(df_tabela['DATA_PAGAMENTO'])
    df_tabela['VENCIMENTO'] = safe_date_str(df_tabela['VENCIMENTO'])
    
    # Coluna de exibição inteligente (Se pagou mostra data pagto, senão vencimento)
    df_tabela['DATA_EXIBICAO'] = np.where(
        df_tabela['DATA_PAGAMENTO'] != '', 
        df_tabela['DATA_PAGAMENTO'], 
        df_tabela['VENCIMENTO']
    )

    # --- 8. RETORNO FINAL ---
    total_pago = df_pag['VALOR_PAGO'].sum()
    total_previsto = df_prev['SALDO'].sum()
    
    sucumbencia_paga = df_pag[df_pag['CREDOR'].str.contains('Candiotto', case=False, na=False)]['VALOR_PAGO'].sum()

    # Gráficos
    graf_pag = []
    if not df_pag.empty:
        graf_pag = df_pag.groupby(df_pag['DATA_PAGAMENTO'].dt.strftime('%Y-%m-%d'))['VALOR_PAGO'].sum().reset_index().rename(columns={'DATA_PAGAMENTO':'data','VALOR_PAGO':'valor'}).to_dict(orient='records')

    graf_prev = []
    if not df_prev.empty:
        graf_prev = df_prev.groupby(df_prev['VENCIMENTO'].dt.strftime('%Y-%m-%d'))['SALDO'].sum().reset_index().rename(columns={'VENCIMENTO':'data','SALDO':'valor'}).to_dict(orient='records')

    return {
        "metricas": {
            "total_pago": float(total_pago),
            "total_previsto": float(total_previsto),
            "sucumbencia_paga": float(sucumbencia_paga),
            "sucumbencia_prevista": 0.0,
            "qtd_pagamentos": len(df_pag),
            "qtd_previsoes": len(df_prev)
        },
        "graficos": {
            "pagamentos_por_data": graf_pag,
            "previsao_por_data": graf_prev
        },
        "tabela_pagamentos": df_tabela.head(1000).fillna('').to_dict(orient='records'),
        "tabela_previsao": []
    }

def _retorno_vazio():
    return { "metricas": { "total_pago": 0, "total_previsto": 0, "sucumbencia_paga": 0, "sucumbencia_prevista": 0, "qtd_pagamentos": 0, "qtd_previsoes": 0 }, "graficos": [], "tabela_pagamentos": [], "tabela_previsao": [] }