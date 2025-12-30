import pandas as pd
import time
from sqlalchemy import text
from datetime import datetime
from utilities.variaveis_globais import campanhas # Importa o dicionário de mapeamento
from database import engine_std # Importa a conexão do servidor STD2016

# --- FUNÇÕES AUXILIARES ---

def calcular_aging(dias):
    if dias <= 30: return "0-30 dias"
    elif dias <= 60: return "31-60 dias"
    elif dias <= 90: return "61-90 dias"
    elif dias <= 180: return "91-180 dias"
    elif dias <= 360: return "181-360 dias"
    elif dias <= 720: return "361-720 dias"
    else: return "720+ dias"

def obter_sufixo_campanha(campanha_id_front):
    """
    Recebe o ID (ex: 47) e retorna a chave string (ex: '000045')
    para montar o nome da tabela Fone_List_000045.
    """
    if not campanha_id_front:
        return None
    
    # Converte para string e remove espaços para garantir
    id_str = str(campanha_id_front).strip()

    # Procura no dicionário importado de variaveis_globais
    for chave_str, valor_int in campanhas.items():
        if str(valor_int) == id_str:
            return chave_str
            
    # Fallback: retorna formatado com zeros se não achar no dicionário
    return id_str.zfill(6)

# --- 1. SERVIÇO GERAL (GRÁFICOS MENSAL/AGING) ---
# Este roda no banco de Relatórios (RelatorioBase) pois é mais leve e consolidado

def obter_dados_carteira(filtros, engine):
    hoje = datetime.now()
    
    data_ini = filtros.get('data_inicio') or '2024-01-01'
    data_fim = filtros.get('data_fim') or hoje.strftime('%Y-%m-%d')
    campanhas_filtro = filtros.get('campanhas', [])

    sql_pagos = text("""
        SELECT ISNULL(MoValorRecebido, 0) as VALOR_PAGO, Data_Recebimento, CAMPANHA
        FROM RelatorioBase
        WHERE Data_Recebimento >= :inicio AND Data_Recebimento <= :fim AND MoValorRecebido > 0
    """)

    sql_estoque = text("""
        SELECT ISNULL(Saldo, 0) as SALDO, Data_de_Acordo as VENCIMENTO, Status as RO, CAMPANHA, MoInadimplentesID as CLIENTE_ID
        FROM RelatorioBase
        WHERE Saldo > 0 AND Data_de_Acordo <= :fim
    """)

    try:
        with engine.connect() as conn:
            df_pagos = pd.read_sql(sql_pagos, conn, params={"inicio": data_ini, "fim": data_fim})
            df_estoque = pd.read_sql(sql_estoque, conn, params={"fim": data_fim})
    except Exception as e:
        print(f"❌ Erro SQL Carteira (Geral): {e}")
        return {}

    # Filtragem Python
    if campanhas_filtro:
        campanhas_limpas = [str(c).strip() for c in campanhas_filtro]
        if not df_pagos.empty:
            df_pagos = df_pagos[df_pagos['CAMPANHA'].astype(str).str.strip().isin(campanhas_limpas)]
        if not df_estoque.empty:
            df_estoque = df_estoque[df_estoque['CAMPANHA'].astype(str).str.strip().isin(campanhas_limpas)]

    # Processamento Gráficos
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
        grafico_aging = df_aging_group.rename(columns={'SALDO': 'VALOR', 'FAIXA_AGING': 'faixa'}).to_dict(orient='records')

        # Top 10 ROs
        grafico_ro = df_estoque.groupby('RO')['SALDO'].count().reset_index().rename(columns={'SALDO': 'QUANTIDADE'}).sort_values('QUANTIDADE', ascending=False).head(10).to_dict(orient='records')

    return {
        "kpis": kpis,
        "mensal": grafico_mensal,
        "aging": grafico_aging,
        "ro": grafico_ro,
        "tabela": df_estoque.head(100).fillna('').astype(str).to_dict(orient='records') if not df_estoque.empty else []
    }


# --- 2. HISTÓRICO DE RO (Usando Tabelas Dinâmicas no STD2016) ---

def get_historico_ro_real(id_cliente, campanha_id, engine=None):
    """
    Busca o histórico de RO nas tabelas dinâmicas Fone_List_XXXXXX.
    """
    if engine is None: engine = engine_std # Usa a conexão STD por padrão

    sufixo = obter_sufixo_campanha(campanha_id)
    if not sufixo:
        # Se não tem campanha, retorna vazio para não quebrar
        print("⚠️ Campanha não informada. Impossível buscar histórico.")
        return []

    tabela_fone = f"Fone_List_{sufixo}"
    tabela_contatos = f"ContatosFichas_{sufixo}"

    print(f"🔎 [RO] Buscando histórico na tabela: {tabela_fone} para cliente {id_cliente}")

    sql = text(f"""
        SELECT DISTINCT TOP 50
            dbo.RetornaNomeUsuario(FN_OperadorProprietarioID) AS NEGOCIADOR_RESPONSAVEL,
            dbo.RetornaRONome(CoResumoOperacaoID) AS RO,
            dbo.RetornaNomeUsuario(CoUsuariosID) AS NEGOCIADOR_RO,
            CoDataInicioFicha AS DATA,
            ISNULL(CoHistoricoFicha, 'Sem descrição') AS DESCRICAO
        FROM
            Movimentacoes M WITH (NOLOCK)
            INNER JOIN {tabela_fone} WITH (NOLOCK) ON FN_PessoasID = M.MoInadimplentesID
            INNER JOIN {tabela_contatos} WITH (NOLOCK) ON CoFoneListsID = FN_FoneList_{sufixo}_ID
            LEFT JOIN Motivos WITH (NOLOCK) ON Motivos_ID = CoMotivoRoID
        WHERE
            M.MoInadimplentesID = :id_usuario
        ORDER BY
            CoDataInicioFicha DESC;
    """)

    try:
        with engine.connect() as conn:
            result = conn.execute(sql, {"id_usuario": id_cliente}).mappings().all()
        
        return [{
            "id": i, 
            "negociador_responsavel": row['NEGOCIADOR_RESPONSAVEL'],
            "ro": row['RO'],
            "negociador_ro": row['NEGOCIADOR_RO'],
            "data": row['DATA'].strftime('%d/%m/%Y %H:%M') if row['DATA'] else '-',
            "descricao": row['DESCRICAO']
        } for i, row in enumerate(result)]

    except Exception as e:
        print(f"❌ Erro SQL Histórico RO: {e}")
        return []


# --- 3. DASHBOARD CARTEIRA (Cards Coloridos - SQL CTE no STD2016) ---

def get_dashboard_carteira_real(filtros, engine=None):
    """
    Calcula os KPIs (Novo, Corrente, Inadimplido) usando a query SQL oficial CTE.
    """
    if engine is None: engine = engine_std
    if engine is None:
        print("Erro: engine_std indisponivel para dashboard carteira.")
        return None

    data_ref = filtros.get('data_referencia')
    params = {"referencia": data_ref}
    filtro_extra = ""
    
    if filtros.get('negociador_id'):
        filtro_extra += " AND (MoUsuarioRecebeuID = :neg_id OR FN_OperadorProprietarioID = :neg_id)"
        params['neg_id'] = filtros['negociador_id']

    if filtros.get('campanha_id'):
        filtro_extra += " AND MoCampanhasID = :camp_id"
        params['camp_id'] = filtros['campanha_id']

    print(f"🚀 [DASHBOARD] Calculando métricas no STD2016... Filtros: {params}")

    top_clause = ""
    if filtros.get("debug_top"):
        top_clause = f"TOP {int(filtros['debug_top'])}"

    sql = text(f"""
        WITH vencimentos AS (
            SELECT MovimentacoesAcordos_ID AS Acordo, MoDataVencimento, MoDataAcordo
            FROM Movimentacoes M WITH(NOLOCK)
            INNER JOIN MovimentacoesAcordos A WITH(NOLOCK) ON MovimentacoesAcordos_ID = MoDestinoAcordoID
            INNER JOIN Pessoas P WITH(NOLOCK) ON P.Pessoas_ID = M.MoInadimplentesID
        ),
        cte_acordo_nao_pago AS (
            SELECT Acordo, MIN(MoDataVencimento) AS Menor_Vencimento, DATEDIFF(DAY, MIN(MoDataVencimento), MoDataAcordo) AS Aging
            FROM vencimentos GROUP BY Acordo, MoDataAcordo
        ),
        cte_acordo_pago AS(
            SELECT Acordo, DATEDIFF(DAY, MIN(V.MoDataVencimento), MIN(M.MoDataRecebimento)) AS Aging
            FROM Movimentacoes M WITH(NOLOCK)
            INNER JOIN MovimentacoesAcordos A WITH(NOLOCK) ON A.MovimentacoesAcordos_ID = M.MoMovimentacoesAcordosID
            INNER JOIN vencimentos V on M.MoMovimentacoesAcordosID = V.Acordo
            WHERE MoOrigemMovimentacao = 'A' GROUP BY Acordo
        ),
        tabela_temporaria AS (
            SELECT DISTINCT CAST(pg.Acordo AS VARCHAR(50)) AS Acordo, CASE WHEN pg.Aging IS NOT NULL THEN pg.Aging ELSE np.Aging END AS Aging
            FROM cte_acordo_pago pg INNER JOIN cte_acordo_nao_pago np ON CAST(pg.Acordo AS VARCHAR(50)) = CAST(np.Acordo AS VARCHAR(50))
        )
        SELECT {top_clause}
            ISNULL(MoValorDocumento, 0) AS VALOR_ORIGINAL,
            ISNULL(MoValorRecebido, 0) AS VALOR_PAGO,
            CASE
                WHEN MoParcela = 1 THEN 'Novo'
                WHEN (YEAR(MoDataVencimento) < YEAR(MoDataRecebimento) OR (YEAR(MoDataVencimento) = YEAR(MoDataRecebimento) AND MONTH(MoDataVencimento) < MONTH(MoDataRecebimento))) THEN 'Inadimplido'
                WHEN ((YEAR(MoDataVencimento) = YEAR(MoDataRecebimento) AND MONTH(MoDataVencimento) = MONTH(MoDataRecebimento))) THEN 'Corrente'
                WHEN (YEAR(MoDataVencimento) > YEAR(MoDataRecebimento) OR (YEAR(MoDataVencimento) = YEAR(MoDataRecebimento) AND MONTH(MoDataVencimento) > MONTH(MoDataRecebimento))) THEN 'Novo'
                ELSE 'VERIFICAR'
            END AS STATUS_CALCULADO
        FROM Movimentacoes M WITH(NOLOCK)
        LEFT JOIN MovimentacoesAcordos A WITH(NOLOCK) on MovimentacoesAcordos_ID = MoMovimentacoesAcordosID
        INNER JOIN Pessoas With(NOLOCK) ON Pessoas_ID = M.MoInadimplentesID
        LEFT JOIN tabela_temporaria CA ON CA.Acordo = 
            LTRIM(RTRIM(CASE WHEN CHARINDEX('AC- ', MoNumeroDocumento) > 0 THEN SUBSTRING(MoNumeroDocumento, CHARINDEX('AC- ', MoNumeroDocumento) + LEN('AC- '), LEN(MoNumeroDocumento)) ELSE MoNumeroDocumento END))
        WHERE MoStatusMovimentacao in (2,3,4,5,6,7) 
        AND MoDataRecebimento >= :referencia
        AND dbo.RetornaNomeUsuario(MoUsuarioRecebeuID) <> 'Pedro Ryan'
        {filtro_extra}
    """)

    try:
        with engine.connect() as conn:
            try:
                conn.connection.timeout = 30
            except Exception:
                pass

            inicio = time.time()
            print("Iniciando consulta SQL da carteira...")
            df = pd.read_sql(sql, conn, params=params)
            print(f"Consulta SQL finalizada em {time.time() - inicio:.2f}s")
        
        composicao = {"casosNovos": 0.0, "acordosVencer": 0.0, "colchaoCorrente": 0.0, "colchaoInadimplido": 0.0, "totalCasos": 0.0}
        realizado = {"novosAcordos": 0.0, "colchaoAntecipado": 0.0, "colchaoCorrente": 0.0, "colchaoInadimplido": 0.0, "caixaTotal": 0.0}

        if df.empty: return {"composicao": composicao, "realizado": realizado}

        for _, row in df.iterrows():
            status = str(row['STATUS_CALCULADO']).upper()
            val_pago = float(row['VALOR_PAGO'] or 0)
            val_orig = float(row['VALOR_ORIGINAL'] or 0)

            # Somas para Carteira (Previsão)
            if val_orig > 0:
                composicao['totalCasos'] += val_orig
                if 'NOVO' in status: composicao['casosNovos'] += val_orig
                elif 'INADIMPLIDO' in status: composicao['colchaoInadimplido'] += val_orig
                elif 'CORRENTE' in status: composicao['colchaoCorrente'] += val_orig
                # Nota: 'Acordos a Vencer' pode precisar de lógica de data futura, mas 'Corrente' é o mais próximo aqui
            
            # Somas para Realizado (Caixa)
            if val_pago > 0:
                realizado['caixaTotal'] += val_pago
                if 'NOVO' in status: realizado['novosAcordos'] += val_pago
                elif 'INADIMPLIDO' in status: realizado['colchaoInadimplido'] += val_pago
                elif 'CORRENTE' in status: realizado['colchaoCorrente'] += val_pago

        return {"composicao": composicao, "realizado": realizado}

    except Exception as e:
        print(f"❌ Erro Query Dashboard: {e}")
        return None
