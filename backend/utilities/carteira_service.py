import pandas as pd
from sqlalchemy import text
from datetime import datetime
import calendar

# --- FUNÇÃO AUXILIAR DE AGING ---
def calcular_aging(dias):
    if dias <= 30: return "0-30 dias"
    elif dias <= 60: return "31-60 dias"
    elif dias <= 90: return "61-90 dias"
    elif dias <= 180: return "91-180 dias"
    elif dias <= 360: return "181-360 dias"
    elif dias <= 720: return "361-720 dias"
    else: return "720+ dias"

# --- SERVICE PRINCIPAL (GRÁFICOS GERAIS - MENSAL/AGING) ---
def obter_dados_carteira(filtros, engine):
    hoje = datetime.now()
    
    data_ini = filtros.get('data_inicio') or '2024-01-01'
    data_fim = filtros.get('data_fim') or hoje.strftime('%Y-%m-%d')
    campanhas_filtro = filtros.get('campanhas', [])

    # 1. BUSCAR DADOS (Usando colunas validadas no Raio-X)
    sql_pagos = text("""
        SELECT 
            ISNULL(MoValorRecebido, 0) as VALOR_PAGO,
            Data_Recebimento,
            CAMPANHA
        FROM RelatorioBase
        WHERE Data_Recebimento >= :inicio AND Data_Recebimento <= :fim
          AND MoValorRecebido > 0
    """)

    sql_estoque = text("""
        SELECT 
            ISNULL(Saldo, 0) as SALDO,
            Data_de_Acordo as VENCIMENTO,
            Status as RO,
            CAMPANHA,
            MoInadimplentesID as CLIENTE_ID
        FROM RelatorioBase
        WHERE Saldo > 0 
          AND Data_de_Acordo <= :fim
    """)

    try:
        with engine.connect() as conn:
            df_pagos = pd.read_sql(sql_pagos, conn, params={"inicio": data_ini, "fim": data_fim})
            df_estoque = pd.read_sql(sql_estoque, conn, params={"fim": data_fim})
    except Exception as e:
        print(f"❌ Erro SQL Carteira: {e}")
        return {}

    # Filtragem Python (Caso o SQL traga sujeira)
    if campanhas_filtro:
        campanhas_limpas = [str(c).strip() for c in campanhas_filtro]
        if not df_pagos.empty:
            df_pagos = df_pagos[df_pagos['CAMPANHA'].astype(str).str.strip().isin(campanhas_limpas)]
        if not df_estoque.empty:
            df_estoque = df_estoque[df_estoque['CAMPANHA'].astype(str).str.strip().isin(campanhas_limpas)]

    # Processamentos (Mantidos igual ao original)
    grafico_mensal = []
    if not df_pagos.empty:
        df_pagos['Mes'] = pd.to_datetime(df_pagos['Data_Recebimento']).dt.strftime('%Y-%m')
        grafico_mensal = df_pagos.groupby('Mes')['VALOR_PAGO'].sum().reset_index().to_dict(orient='records')

    kpis = {"total_clientes": 0, "valor_total": 0, "ticket_medio": 0}
    grafico_aging = []
    grafico_ro = []

    if not df_estoque.empty:
        total_clientes = df_estoque['CLIENTE_ID'].nunique()
        valor_total = df_estoque['SALDO'].sum()
        kpis = {
            "total_clientes": int(total_clientes),
            "valor_total": float(valor_total),
            "ticket_medio": float(valor_total / total_clientes if total_clientes else 0)
        }

        # Aging
        df_estoque['VENCIMENTO'] = pd.to_datetime(df_estoque['VENCIMENTO'], errors='coerce')
        df_estoque['DIAS_ATRASO'] = (hoje - df_estoque['VENCIMENTO']).dt.days
        df_estoque['FAIXA_AGING'] = df_estoque['DIAS_ATRASO'].apply(calcular_aging)
        
        ordem = ["0-30 dias", "31-60 dias", "61-90 dias", "91-180 dias", "181-360 dias", "361-720 dias", "720+ dias"]
        df_aging_group = df_estoque.groupby('FAIXA_AGING')['SALDO'].sum().reindex(ordem).fillna(0).reset_index()
        # Ajuste de nome para compatibilidade com front
        df_aging_group = df_aging_group.rename(columns={'SALDO': 'VALOR', 'FAIXA_AGING': 'faixa'})
        grafico_aging = df_aging_group.to_dict(orient='records')

        # RO
        grafico_ro = df_estoque.groupby('RO')['SALDO'].count().reset_index().rename(columns={'SALDO': 'QUANTIDADE'}).sort_values('QUANTIDADE', ascending=False).head(10).to_dict(orient='records')

    return {
        "kpis": kpis,
        "mensal": grafico_mensal,
        "aging": grafico_aging,
        "ro": grafico_ro,
        "novos_clientes": [], # Simplificado
        "tabela": df_estoque.head(100).fillna('').astype(str).to_dict(orient='records') if not df_estoque.empty else []
    }

# --- SERVICE ESPECÍFICO (COMPOSIÇÃO / CARDS COLORIDOS) ---
def get_dados_composicao_especifico(filtros, engine):
    """
    CORRIGIDO: Usa RelatorioBase e calcula Inadimplência/Antecipação via Datas no Python
    """
    print(f"\n🚀 [COMPOSICAO] Iniciando cálculo inteligente...")

    # 1. Definir Período
    data_ref = filtros.get('data_referencia') 
    hoje_real = datetime.now()
    
    if not data_ref or len(data_ref) < 7:
        data_ref = hoje_real.strftime('%Y-%m')

    try:
        ano, mes = map(int, data_ref.split('-')[:2])
        ultimo_dia = calendar.monthrange(ano, mes)[1]
    except:
        ano, mes = hoje_real.year, hoje_real.month
        ultimo_dia = 30

    dt_inicio = f"{ano}-{mes:02d}-01"
    dt_fim = f"{ano}-{mes:02d}-{ultimo_dia}"

    # 2. Query na tabela CORRETA (RelatorioBase)
    params = {'inicio': dt_inicio, 'fim': dt_fim}
    filtro_sql = ""

    # Filtros Opcionais
    if filtros.get('negociador'):
        # Adicionei tratamento para garantir que string vazia não quebre
        if filtros['negociador'] and str(filtros['negociador']).strip():
            filtro_sql += " AND NEGOCIADOR = :negociador"
            params['negociador'] = filtros['negociador']
    
    if filtros.get('campanha'):
        if filtros['campanha'] and str(filtros['campanha']).strip():
            filtro_sql += " AND CAMPANHA = :campanha"
            params['campanha'] = filtros['campanha']

    # Pega tudo que vence ou foi pago no mês
    # Trazemos as colunas essenciais para o Python calcular
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
        
        # 3. Inicializa Estrutura Zerada
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

        # 4. Processamento Lógico (Pandas) - AQUI ESTÁ A MÁGICA QUE CONSERTA OS ZEROS
        
        # Converter datas para garantir comparação correta
        df['VENCIMENTO'] = pd.to_datetime(df['VENCIMENTO'], errors='coerce')
        df['DATA_PAGAMENTO'] = pd.to_datetime(df['DATA_PAGAMENTO'], errors='coerce')
        
        # Data de hoje para definir o que é "A Vencer" vs "Inadimplido"
        hoje_ts = pd.Timestamp(hoje_real.date()) 
        
        for _, row in df.iterrows():
            v_prev = float(row['VALOR_PREVISTO'])
            v_pago = float(row['VALOR_PAGO'])
            dt_venc = row['VENCIMENTO']
            dt_pag = row['DATA_PAGAMENTO']
            
            # Identificamos se é Parcela 1 (Novos Casos)
            # Verifica string '1', '01', '1/10' etc.
            parcela_str = str(row['MoParcela']).strip()
            is_novo = parcela_str == '1' or parcela_str.startswith('1/') or parcela_str == '01'

            # --- A. LÓGICA DE CARTEIRA (PREVISÃO) ---
            if v_prev > 0:
                composicao["totalCasos"] += v_prev
                
                # Regras de Negócio do Streamlit replicadas aqui:
                is_vencido = pd.notnull(dt_venc) and dt_venc < hoje_ts
                is_futuro = pd.notnull(dt_venc) and dt_venc >= hoje_ts
                
                if is_novo:
                    composicao["casosNovos"] += v_prev
                elif is_vencido:
                    # Venceu ontem e ainda tem saldo -> Inadimplido
                    composicao["colchaoInadimplido"] += v_prev
                elif is_futuro:
                    # Vence hoje ou depois -> A Vencer
                    composicao["acordosVencer"] += v_prev
                else:
                    # Fallback
                    composicao["colchaoCorrente"] += v_prev

            # --- B. LÓGICA DE CAIXA (REALIZADO) ---
            if v_pago > 0:
                realizado["caixaTotal"] += v_pago
                
                # Regras de Pagamento:
                # Antecipado: Pagou antes da data de vencimento
                is_antecipado = pd.notnull(dt_venc) and pd.notnull(dt_pag) and dt_pag < dt_venc
                
                # Recuperado: Pagou depois do vencimento
                is_recuperado = pd.notnull(dt_venc) and pd.notnull(dt_pag) and dt_pag > dt_venc
                
                if is_novo:
                     realizado["novosAcordos"] += v_pago
                elif is_antecipado:
                    realizado["colchaoAntecipado"] += v_pago
                elif is_recuperado:
                    realizado["colchaoInadimplido"] += v_pago
                else:
                    # Pagou no dia ou sem data definida
                    realizado["colchaoCorrente"] += v_pago

        return {
            "composicao": composicao,
            "realizado": realizado
        }

    except Exception as e:
        print(f"❌ Erro Lógica Composição: {e}")
        # Retorna zerado em caso de erro para não quebrar o front
        return {
            "composicao": {"casosNovos": 0, "acordosVencer": 0, "colchaoCorrente": 0, "colchaoInadimplido": 0, "totalCasos": 0},
            "realizado": {"novosAcordos": 0, "colchaoAntecipado": 0, "colchaoCorrente": 0, "colchaoInadimplido": 0, "caixaTotal": 0}
        }