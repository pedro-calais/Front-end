# config/constants.py

# =========================
# CLICKUP / CAMPANHAS / LISTAS
# (Somente constantes "estáticas")
# =========================

CLICKUP_LIST_ID = "901300238118"

FIELD_IDS = {
    "campanha": "219ad44c-6d02-41b2-90f4-39f3e1c2ad24",
    "credor": "935aa8e0-c820-42a5-89a6-4426f2155e1e",
    "tipo_demanda": "b0ef9be1-32ac-44f5-9a58-e9025387765a",
    "cpf": "c768d82e-624d-4575-a976-4a46d5a3c959",
    "nome_cliente": "9840abcf-07c9-4c84-aa45-494be588eaac",
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

DEMANDAS_LISTA = [
    "Alteração de Vínculo", "Inclusão de Parcela", "Devolução de clientes/parcelas",
    "Higienização / Enriquecimento de Dados", "Importação de Novos Clientes", "Quebra de acordo",
    "Batimento de Carteira", "Divisão de carteira", "Relatório - Banco de dados", "Apresentação",
    "Disparar Ação Digital", "Criação de Acessos", "Erro do Sistema", "Fluxo contencioso",
    "Treinamento", "Atualização Ritual Diário", "Faturamento", "Gravações Ligações",
    "Cadastrar template de Whatsapp", "Ajuste de Dashboard", "Suporte Técnico", "Discador"
]
DEMANDAS_LISTA.sort()

# --- MAPA CREDOR -> CAMPANHAS (o seu grandão) ---
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
    "000020": "DVL Extrajudicial", "000021": "DVL Judicial", "000022": "Grupo Level Extrajudicial",
    "000023": "Grupo Level Judicial", "000024": "Grupo Super Nosso Ativo", "000025": "Grupo Super Nosso Judicial",
    "000026": "SEMPRE EDITORA Extrajudicial", "000027": "DEVA VEICULOS Extrajudicial", "000028": "Movyx - Extrajudicial",
    "000029": "One DI Extrajudicial", "000030": "Precon Extrajudicial", "000031": "TENDA PÓS AGI",
    "000032": "RSF Judicial", "000034": "Cyrela Judicial", "000041": "EMCCAMP", "000043": "Direcional Extrajudicial",
    "000044": "Direcional Judicial", "000045": "Localiza - Judicial", "000051": "Direcional - Negociação CEF",
    "000052": "Vila Brasil Judicial", "000054": "Colégio Brasileiro de São Cristóvão", "000056": "ARBORE ENGENHARIA",
    "000057": "BTM - JUDICIAL", "000058": "4º tabelinato Acima de 180 dias", "000059": "DIVIBANK",
    "000061": "Arbore - Judicial", "000062": "Itaú", "000063": "Demais Clientes", "000064": "Direcional - Jurídico Interno",
    "000065": "EMCCAMP Judicial", "000066": "Direcional - Pré Contencioso", "000067": "BLIP",
    "000068": "Tenda - Pré Contencioso", "000069": "Zatz Empreendimentos", "000070": "CANVAS ENGENHARIA LTDA",
    "000071": "DIVIBANK - Judicial", "000072": "TENDA PRÉ AGI", "000073": "Longitude",
    "000074": "Construtora São Jose", "000075": "JERONIMO DA VEIGA", "000076": "Foco Aluguel de Carros",
    "000077": "DVL Passivo", "000078": "4° Tabelionato - Ativo", "000079": "TENDA - Colchão Interno",
    "000080": "CYRELA - Pre Empreendimentos", "000081": "Credaluga", "000082": "Justa Energia",
    "000085": "LCM Construção", "000086": "Direcional Extra pré chave", "000087": "Movida - Passivo",
    "000088": "Foco Aluguel de Carros - Passivo", "000089": "CredAluga - Desocupado", "000084": "Sobrosa Mello Construtora",
    "000090": "Sonhar Construtora", "000091": "Construtora Renault Diniz LTDA", "000092": "Movida - Avarias Não Faturadas",
    "000094": "Bate Carteira", "000093": "Arquiplan"
}

RESPONSAVEIS_ID = {
    "Lucas": 82132421,
    "Alvaro": 81969334,
    "Rodrigo": 44320686,
    "Pedro Calais": 94075967,
    "Fernando Wagner Gomes Salim": 106082578,
    "Rafael Viegas": 106158161,
    "Thiago Vitorio": 105994498,
}

RESPONSAVEIS = {
    "Rodrigo": [
        "Executar réguas", "Criar automação", "Criar Dashboard - Consulta", "Apresentação",
        "Treinamento", "Contestação", "Faturamento", "Fluxo contencioso",
        "Configuração Sistemas", "Criação de Acessos", "Disparar Ação Digital", "Discador",
    ],
    "Alvaro": [
        "Cadastrar template de Whatsapp", "Importação de Novos Clientes", "Relatório - Banco de dados",
        "Divisão de carteira", "Configuração Sistemas", "Criação de Acessos", "Erro do Sistema",
        "Disparar Ação Digital", "Gravações Ligações", "Discador", "Suporte Técnico", "Quebra de acordo",
    ],
    "Lucas": [
        "Inclusão de Parcela", "Atualização Ritual Diário", "Ajuste de Dashboard", "Alteração de Vínculo",
        "Higienização / Enriquecimento de Dados", "Devolução de clientes/parcelas",
    ],
    "Rafael Viegas": [],
    "Thiago Vitorio": ["Batimento de Carteira"],
}

# =========================
# ALIASES (para não quebrar imports antigos)
# =========================
API_TOKEN = None  # token agora vem do settings.py via .env
credor_vs_campanha = CREDOR_VS_CAMPANHA
campanhas_display = CAMPANHAS_DISPLAY
demandas = DEMANDAS_LISTA
responsaveis_id = RESPONSAVEIS_ID
responsaveis = RESPONSAVEIS
