import pandas as pd
from sqlalchemy import text
from datetime import datetime
import calendar

# Importa as variáveis para validação (opcional, mas bom para consistência)
try:
    from utilities.variaveis_globais import credor_vs_campanha
except ImportError:
    pass

def calcular_aging(dias):
    """Replica a lógica de aging do Streamlit"""
    if dias <= 30: return "0-30 dias"
    elif dias <= 60: return "31-60 dias"
    elif dias <= 90: return "61-90 dias"
    elif dias <= 180: return "91-180 dias"
    elif dias <= 360: return "181-360 dias"
    elif dias <= 720: return "361-720 dias"
    else: return "720+ dias"

def obter_dados_carteira(filtros, engine):
    hoje = datetime.now()
    
    # Filtros vindos do Front
    # No Streamlit você pegava "inicio_mes" e "fim_mes", aqui o usuário escolhe
    data_ini = filtros.get('data_inicio') or '2024-01-01'
    data_fim = filtros.get('data_fim') or hoje.strftime('%Y-%m-%d')
    campanhas_filtro = filtros.get('campanhas', []) # Lista de strings ex: ["000001 - Vic Extra"]

    print(f"📊 Processando Carteira para: {campanhas_filtro}")

    # --- 1. BUSCAR DADOS DE PAGAMENTO (Para o Gráfico de Barras Mensal) ---
    sql_pagos = text("""
        SELECT 
            ISNULL(MoValorRecebido, 0) as VALOR_PAGO,
            Data_Recebimento,
            CAMPANHA
        FROM RelatorioBase
        WHERE Data_Recebimento >= :inicio AND Data_Recebimento <= :fim
          AND MoValorRecebido > 0
    """)

    # --- 2. BUSCAR DADOS DE ESTOQUE (Para Aging, RO e KPIs) ---
    # Estoque = O que está em aberto ou vencido até a data atual
    sql_estoque = text("""
        SELECT 
            ISNULL(Saldo, 0) as SALDO,
            Data_de_Acordo as VENCIMENTO,
            Status as RO,
            CAMPANHA,
            MoInadimplentesID as CLIENTE_ID,
            Data_de_Acordo as DATA_CADASTRO -- Usado para simular 'Novos Clientes'
        FROM RelatorioBase
        WHERE Saldo > 0 
          AND Data_de_Acordo <= :fim
    """)

    try:
        with engine.connect() as conn:
            df_pagos = pd.read_sql(sql_pagos, conn, params={"inicio": data_ini, "fim": data_fim})
            df_estoque = pd.read_sql(sql_estoque, conn, params={"fim": data_fim})
    except Exception as e:
        print(f"❌ Erro SQL: {e}")
        return {}

    # --- 3. FILTRAGEM POR CAMPANHA ---
    if campanhas_filtro:
        # Limpeza para garantir match (remove espaços extras)
        campanhas_limpas = [str(c).strip() for c in campanhas_filtro]
        
        if not df_pagos.empty:
            df_pagos['CAMPANHA'] = df_pagos['CAMPANHA'].astype(str).str.strip()
            df_pagos = df_pagos[df_pagos['CAMPANHA'].isin(campanhas_limpas)]
            
        if not df_estoque.empty:
            df_estoque['CAMPANHA'] = df_estoque['CAMPANHA'].astype(str).str.strip()
            df_estoque = df_estoque[df_estoque['CAMPANHA'].isin(campanhas_limpas)]

    # --- 4. PROCESSAMENTO DOS DADOS (Igual ao Streamlit) ---

    # A. Recuperação Mensal (Gráfico Azul)
    grafico_mensal = []
    if not df_pagos.empty:
        df_pagos['Mes'] = pd.to_datetime(df_pagos['Data_Recebimento']).dt.strftime('%Y-%m')
        df_mensal_group = df_pagos.groupby('Mes')['VALOR_PAGO'].sum().reset_index()
        grafico_mensal = df_mensal_group.to_dict(orient='records')

    # B. KPIs e Estoque
    kpis = {"total_clientes": 0, "valor_total": 0, "ticket_medio": 0}
    grafico_aging = []
    grafico_ro = []
    grafico_novos = []

    if not df_estoque.empty:
        # KPIs
        total_clientes = df_estoque['CLIENTE_ID'].nunique()
        valor_total = df_estoque['SALDO'].sum()
        ticket_medio = valor_total / total_clientes if total_clientes > 0 else 0
        
        kpis = {
            "total_clientes": int(total_clientes),
            "valor_total": float(valor_total),
            "ticket_medio": float(ticket_medio)
        }

        # C. Aging (Gráfico Vermelho e Azul)
        df_estoque['VENCIMENTO'] = pd.to_datetime(df_estoque['VENCIMENTO'], errors='coerce')
        df_estoque['DIAS_ATRASO'] = (hoje - df_estoque['VENCIMENTO']).dt.days
        df_estoque['FAIXA_AGING'] = df_estoque['DIAS_ATRASO'].apply(calcular_aging)

        ordem = ["0-30 dias", "31-60 dias", "61-90 dias", "91-180 dias", "181-360 dias", "361-720 dias", "720+ dias"]
        
        df_aging_group = df_estoque.groupby('FAIXA_AGING').agg(
            VALOR=('SALDO', 'sum'),
            CLIENTES=('CLIENTE_ID', 'nunique')
        ).reindex(ordem).fillna(0).reset_index()
        
        grafico_aging = df_aging_group.to_dict(orient='records')

        # D. RO (Status)
        df_ro_group = df_estoque.groupby('RO')['SALDO'].count().reset_index()
        df_ro_group = df_ro_group.rename(columns={'SALDO': 'QUANTIDADE'}).sort_values(by='QUANTIDADE', ascending=False).head(10)
        grafico_ro = df_ro_group.to_dict(orient='records')

        # E. Novos Clientes por Dia (Simulado com Data de Acordo/Cadastro)
        # Filtra apenas o range selecionado para não pesar
        df_novos = df_estoque[
            (df_estoque['VENCIMENTO'] >= pd.to_datetime(data_ini)) & 
            (df_estoque['VENCIMENTO'] <= pd.to_datetime(data_fim))
        ].copy()
        
        if not df_novos.empty:
            df_novos['Data'] = df_novos['VENCIMENTO'].dt.strftime('%Y-%m-%d')
            df_novos_group = df_novos.groupby('Data').agg(
                VALOR=('SALDO', 'sum'),
                CLIENTES=('CLIENTE_ID', 'nunique')
            ).reset_index()
            grafico_novos = df_novos_group.to_dict(orient='records')

    return {
        "kpis": kpis,
        "mensal": grafico_mensal,
        "aging": grafico_aging,
        "ro": grafico_ro,
        "novos_clientes": grafico_novos,
        "tabela": df_estoque.head(100).fillna('').astype(str).to_dict(orient='records') if not df_estoque.empty else []
    }

def get_dados_composicao_especifico(filtros, engine):
    """
    Função DEDICADA para a página 'Composição da Carteira'.
    Usa filtros robustos e tratamento de data correto.
    """
    print(f"\n🚀 [SERVICE NOVO] Iniciando busca específica para Composição...")

    # 1. TRATAMENTO DE DATA
    data_ref = filtros.get('data_referencia') 
    
    if not data_ref or len(data_ref) < 7:
        hoje = datetime.now()
        data_ref = hoje.strftime('%Y-%m')

    try:
        ano = int(data_ref.split('-')[0])
        mes = int(data_ref.split('-')[1])
        ultimo_dia = calendar.monthrange(ano, mes)[1]
    except:
        now = datetime.now()
        ano, mes = now.year, now.month
        ultimo_dia = 30

    dt_inicio = f"{ano}-{mes:02d}-01"
    dt_fim = f"{ano}-{mes:02d}-{ultimo_dia}"

    print(f"   📅 Período: {dt_inicio} até {dt_fim}")

    # 2. FILTROS INTELIGENTES
    params = {'inicio': dt_inicio, 'fim': dt_fim}
    filtro_sql = ""

    negociador = filtros.get('negociador')
    if negociador and len(str(negociador)) > 1 and "Todos" not in negociador:
        filtro_sql += " AND NEGOCIADOR = :negociador"
        params['negociador'] = negociador
        print(f"   👤 Filtrando por Negociador: {negociador}")

    campanha = filtros.get('campanha')
    if campanha and len(str(campanha)) > 1 and "Todas" not in campanha:
        filtro_sql += " AND (CREDOR LIKE :campanha OR STATUS_TITULO LIKE :campanha)" 
        params['campanha'] = f"%{campanha}%"
        print(f"   🏷️  Filtrando por Campanha: {campanha}")

    # 3. QUERY SQL
    sql = text(f"""
        SELECT 
            STATUS_TITULO as status,
            SUM(ISNULL([VALOR ORIGINAL], 0)) as total_original,
            SUM(ISNULL(VALOR_PAGO, 0)) as total_pago
        FROM [Candiotto_DBA].[dbo].[tabelatitulos]
        WHERE VENCIMENTO >= :inicio 
          AND VENCIMENTO <= :fim
          {filtro_sql}
        GROUP BY STATUS_TITULO
    """)

    try:
        t_start = datetime.now()
        
        # CORREÇÃO CRÍTICA AQUI:
        with engine.connect() as connection:
            result = connection.execute(sql, params).fetchall()
            
        tempo = (datetime.now() - t_start).total_seconds()
        print(f"   ✅ Query retornou {len(result)} linhas em {tempo:.2f}s")

        # 4. CLASSIFICAÇÃO DOS DADOS (CORRIGIDA)
        composicao = {
            "casosNovos": 0.0, "acordosVencer": 0.0, 
            "colchaoCorrente": 0.0, "colchaoInadimplido": 0.0, "totalCasos": 0.0
        }
        realizado = {
            "novosAcordos": 0.0, "colchaoAntecipado": 0.0, 
            "colchaoCorrente": 0.0, "colchaoInadimplido": 0.0, "caixaTotal": 0.0
        }

        print("🔍 [DEBUG] Processando linhas do SQL:")

        for row in result:
            # Normaliza o status para maiúsculo para facilitar a comparação
            status = str(row.status).upper().strip() if row.status else "SEM STATUS"
            
            # Pega valores garantindo float
            v_orig = float(row.total_original or 0)
            v_pago = float(row.total_pago or 0)

            print(f"   -> Status: {status} | Orig: {v_orig} | Pago: {v_pago}")

            # --- SOMAS DE COMPOSIÇÃO (Valores em Aberto) ---
            composicao["totalCasos"] += v_orig

            if "NOVO" in status:
                composicao["casosNovos"] += v_orig
            elif "PREVIS" in status or "PREVISAO" in status: # Pega 'Previsão' e 'Previsao'
                composicao["acordosVencer"] += v_orig
            elif "CORRENTE" in status:
                composicao["colchaoCorrente"] += v_orig
            elif "INADIMPLIDO" in status:
                composicao["colchaoInadimplido"] += v_orig
            else:
                # Se sobrar algo (ex: 'VERIFICAR'), somamos no corrente por segurança ou logamos
                print(f"⚠️ Status não mapeado na composição: {status}")
                composicao["colchaoCorrente"] += v_orig

            # --- SOMAS DE REALIZADO (Valores Pagos) ---
            realizado["caixaTotal"] += v_pago

            if v_pago > 0:
                # Aqui a lógica pode ser diferente dependendo de como você classifica o pagamento
                if "NOVO" in status:
                    realizado["novosAcordos"] += v_pago
                elif "PREVIS" in status or "ANTECIPADO" in status:
                    realizado["colchaoAntecipado"] += v_pago
                elif "CORRENTE" in status:
                    realizado["colchaoCorrente"] += v_pago
                elif "INADIMPLIDO" in status:
                    realizado["colchaoInadimplido"] += v_pago

        return {
            "composicao": composicao,
            "realizado": realizado
        }

    except Exception as e:
        print(f"   ❌ [SERVICE ERROR] Erro na query nova: {e}")
        return None