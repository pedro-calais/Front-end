from datetime import datetime
import locale
from dotenv import load_dotenv
import os
import calendar

load_dotenv()
hoje = datetime.today()
inicio_mes = datetime.today().replace(day=1).date()
fim_mes = inicio_mes.replace(day=calendar.monthrange(inicio_mes.year, inicio_mes.month)[1])


dias_de_feriado = (2024, 1, 1),(2024, 2, 12),(2024, 2, 13),(2024, 2, 14),(2024, 4, 21),(2024, 5, 1),(2024, 5, 30),(2024, 9, 7),(2024, 10, 12),(2024, 11, 2),(2024, 11, 12),(2024, 11, 15),(2024, 11, 20)

locale.setlocale(locale.LC_ALL, 'pt_BR.UTF-8')

api_token = os.getenv('api_token')
email_sistema = os.getenv('email_sistema')
senha_sistema = os.getenv('senha_sistema')

# cnpj_credor = {
# 'Teste Tecnologia': os.getenv('CNPJ_TESTE'),
# 'EMCCAMP RESIDENCIAL S.A' : os.getenv('CNPJ_EMCCAMP'),
# 'TENDA' : os.getenv('CNPJ_TENDA'),
# 'DIRECIONAL CEF' : os.getenv('CNPJ_DIRECIONAL'),
# 'DIRECIONAL ENGENHARIA' : os.getenv('CNPJ_DIRECIONAL'),
# 'BVEP' : os.getenv('CNPJ_BVEP'),
# 'CYRELA' : os.getenv('CNPJ_CYRELA'),
# 'VIC ENGENHARIA' : os.getenv('CNPJ_VIC'),
# 'RSF EMPREENDIMENTOS' : os.getenv('CNPJ_RSF'),
# 'BTM/VOLL' : os.getenv('CNPJ_BTM'),
# 'MRV ENGENHARIA E PARTICIPACOES S.A' : os.getenv('CNPJ_MRV'),
# 'Movyx' : os.getenv('CNPJ_MOVYX'),
# 'DVL' : os.getenv('CNPJ_DVL'),
# 'MOVIDA' : os.getenv('CNPJ_MOVIDA'),
# 'DEVA VEICULOS' : os.getenv('CNPJ_DEVA'),
# '4° Tabelionado' : os.getenv('CNPJ_4TABELIONATO'),
# 'VILA BRASIL' : os.getenv('CNPJ_VILA'),
# 'ARBORE ENGENHARIA LTDA' : os.getenv('CNPJ_ARBORE'),
# }

cnpj_credor = {
    '4º Tabelionato': os.getenv('CNPJ_TABELIONATO'),
    'ARBORE ENGENHARIA LTDA': os.getenv('CNPJ_ARBORE_ENGENHARIA_LTDA'),
    'BVEP': os.getenv('CNPJ_BVEP'),
    'CANVAS ENGENHARIA LTDA': os.getenv('CNPJ_CANVAS_ENGENHARIA_LTDA'),
    'COMPANHIA DE LOCACAO DAS AMERICAS': os.getenv('CNPJ_COMPANHIA_DE_LOCACAO_DAS_AMERICAS'),
    'CONSTRUTORA SAO JOSE LTDA': os.getenv('CNPJ_CONSTRUTORA_SAO_JOSE_LTDA'),

    'CYRELA': os.getenv('CNPJ_CYRELA'),
    'Demais Clientes MCSA': os.getenv('CNPJ_DEMAIS_CLIENTES_MCSA'),
    'DEVA VEICULOS': os.getenv('CNPJ_DEVA_VEICULOS'),
    'DIRECIONAL ENGENHARIA': os.getenv('CNPJ_DIRECIONAL_ENGENHARIA'),
    'DIRECIONAL CEF' : os.getenv('CNPJ_DIRECIONAL_ENGENHARIA'),
    'DIVIBANK': os.getenv('CNPJ_DIVIBANK'),
    'DVL': os.getenv('CNPJ_DVL'),
    'EMCCAMP RESIDENCIAL S.A.': os.getenv('CNPJ_EMCCAMP_RESIDENCIAL_SA'),
    'Escritório Candiotto Valle Advogados': os.getenv('CNPJ_ESCRITÓRIO_CANDIOTTO_VALLE_ADVOGADOS'),
    'GESTAO E OPERACAO DE VIAGENS': os.getenv('CNPJ_GESTAO_E_OPERACAO_DE_VIAGENS'),
    'GRUPO SUPER NOSSO': os.getenv('CNPJ_GRUPO_SUPER_NOSSO'),
    'ITAU UNIBANCO S.A.': os.getenv('CNPJ_ITAU_UNIBANCO_SA'),
    'LONGITUDE INCORPORACAO & URBANISMO LTDA': os.getenv('CNPJ_LONGITUDE_INCORPORACAO_E_URBANISMO_LTDA'),
    'MOVIDA': os.getenv('CNPJ_MOVIDA'),
    'Movyx': os.getenv('CNPJ_MOVYX'),
    'MRV ENGENHARIA E PARTICIPACOES SA': os.getenv('CNPJ_MRV_ENGENHARIA_E_PARTICIPACOES_SA'),
    'One DI': os.getenv('CNPJ_ONE_DI'),
    'Precon': os.getenv('CNPJ_PRECON_ENGENHARIA'),
    'Realiza Construtora': os.getenv('CNPJ_REALIZA_CONSTRUTORA_LTDA'),
    'RSF EMPREENDIMENTOS': os.getenv('CNPJ_RSF_EMPREENDIMENTOS'),
    'SEMPRE Editora': os.getenv('CNPJ_SEMPRE_EDITORA'),
    'TENDA': os.getenv('CNPJ_TENDA'),
    'VIC ENGENHARIA': os.getenv('CNPJ_VIC_ENGENHARIA'),
    'VILA BRASIL': os.getenv('CNPJ_VILA_BRASIL'),
    'ZATZ': os.getenv('CNPJ_ZATZ_EMPREENDIMENTOS_E_PARTICIPACOES_LTDA'),
    'CONSTRUTORA SAO JOSE LTDA': os.getenv('CONSTRUTORA_SAO_JOSE_LTDA'),
    'CONSTRUTORA SAO JOSE JUDICIAL': os.getenv('CONSTRUTORA_SAO_JOSE_LTDA'),
}



demandas = [
    "Alteração de Vínculo", "Inclusão de Parcela", "Devolução de clientes/parcelas", 
    "Higienização / Enriquecimento de Dados", "Importação de Novos Clientes", "Quebra de acordo", 
    "Batimento de Carteira", "Divisão de carteira", "Relatório - Banco de dados", "Apresentação", 
    "Disparar Ação Digital", "Criação de Acessos", "Erro do Sistema", "Fluxo contencioso", 
    "Treinamento", "Atualização Ritual Diário", "Faturamento", "Gravações Ligações", 
    "Cadastrar template de Whatsapp", "Ajuste de Dashboard", "Suporte Técnico", "Discador"
]
# demandas.sort()

responsaveis = {
    "Rodrigo": ["Executar réguas", "Criar automação", "Criar Dashboard - Consulta", "Apresentação", 
                "Treinamento", "Contestação", "Faturamento", "Fluxo contencioso", "Configuração Sistemas", "Criação de Acessos", 
                "Disparar Ação Digital","Discador",
                ],
   "Alvaro": ["Cadastrar template de Whatsapp", 
            "Importação de Novos Clientes", "Relatório - Banco de dados",
            "Divisão de carteira", "Configuração Sistemas", "Criação de Acessos", 
            "Erro do Sistema", "Disparar Ação Digital", "Gravações Ligações", "Discador", "Suporte Técnico",  "Quebra de acordo"],

    "Lucas": ["Inclusão de Parcela","Atualização Ritual Diário", 'Ajuste de Dashboard',"Alteração de Vínculo",
               "Higienização / Enriquecimento de Dados", "Devolução de clientes/parcelas" 
               ],
    "Rafael Viegas": [],
    "Thiago Vitorio": ["Batimento de Carteira"]
}


 
responsaveis_id = {
    'Lucas' : 82132421,
    'Alvaro' : 81969334,
    'Rodrigo' : 44320686,
    'Pedro Calais' : 94075967,
    'Fernando Wagner Gomes Salim': 106082578,
    "Rafael Viegas": 106158161,
    "Thiago Vitorio": 105994498
}


tasks_dict = {
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
    "Discador": "4e472839-1600-4fe2-9af9-3be3be04005c",
}




campos_dict = {
    'TELEFONE_FIELD_ID': '0b38a5fb-1a7a-41e3-97e3-7ee1393decaf',
    'DATA_DEVOLUCAO_FIELD_ID': '11f99dde-bbb1-40d0-b93d-be17e31e0d62',
    'EMAIL_FIELD_ID': '12059a4e-2b1f-423b-918f-76ba1f1c5b76',
    'EMAIL_ATIVO_FIELD_ID': '137abfc0-2797-4299-b58f-a058ca21a231',
    'TIPO_TELEFONE_FIELD_ID': '1ddd0205-8f22-4b42-a1d5-ad094635357a',
    'CAMPANHA_FIELD_ID': '219ad44c-6d02-41b2-90f4-39f3e1c2ad24',
    'PESSOA_FIELD_ID': '2bb86662-18f1-4342-ac06-dd4249cf864a',
    'STATUS_FIELD_ID': '320b351b-fe90-4db9-b843-d1abd6600c63',
    'TELEFONE_ATIVO_FIELD_ID': '3ff83fa5-fb29-443e-b732-2a52dfe2c9eb',
    'CNPJ_CREDOR_FIELD_ID': '43043148-a6a7-4060-aae8-20cb81db17ec',
    'AREAS_ENVOLVIDAS_FIELD_ID': '43e20d79-a78d-452c-8256-d31b0fa7cb46',
    'OBSERVACAO_CONTRATO_FIELD_ID': '86120ede-29f3-40bb-8ede-97bc0b4e71da',
    'CREDOR_FIELD_ID': '935aa8e0-c820-42a5-89a6-4426f2155e1e',
    'NOME_FIELD_ID': '9840abcf-07c9-4c84-aa45-494be588eaac',
    'DE_CONCLUSAO_FIELD_ID': '99ec9100-f8cb-4342-84ec-faf361cc0a8b',
    'NUMERO_CONTRATO_FIELD_ID': '9c5f8301-b490-46eb-afb4-bfca8159935f',
    'NOME_CLIENTE_FIELD_ID': '9fde5bf4-51c2-4c64-b5cc-8ca72a3e45e6',
    'TIPO_PARCELA_FIELD_ID': 'a05008b2-413c-4ce3-a826-f66a86a788a1',
    'VENCIMENTO_FIELD_ID': 'a160ac88-b474-4a3b-94ea-94415a80fae2',
    'TIPO_DEMANDA_FIELD_ID': 'b0ef9be1-32ac-44f5-9a58-e9025387765a',
    'ACORDO_PARCELA_FIELD_ID': 'bd5a38bb-5e48-4dfc-8634-aacfde7155db',
    'EMAIL_ALT_FIELD_ID': 'c63f187e-5228-4a64-b43b-d95ec292706c',
    'CPF_CLIENTE_FIELD_ID': 'c768d82e-624d-4575-a976-4a46d5a3c959',
    'VALOR_FIELD_ID': 'cb5ec7e3-d583-42c7-9793-24d5f3042661',
    'TELEFONE_PRINCIPAL_FIELD_ID': 'e53f2ce5-3f98-4933-8c16-ad9d8218b0e6',
    'OBSERVACOES_FIELD_ID': 'e80ac3b2-3ca5-4d9d-924f-92c9541cb30b'
}




campanhas_display_id = {
    3: "Vic Extra ",
    4: "Vic Judicial",
    5: "MRV Extra",
    6: "MRV Judicial", 
    7: "Movida Extra",
    8: "Movida Judicial",
    11: "RSF Extrajudicial", 
    12: "Localiza Extrajudicial",
    15: "Vila Brasil Extrajudicial",
    17: "BTM Extrajudicial",
    18: "BVEP Extrajudicial",
    19: "BVEP Judicial",
    21: "Cyrela Extrajudicial",
    22: "DVL Extrajudicial",
    23: "DVL Judicial",
    24: "Grupo Level Extrajudicial",
    25: "Grupo Level Judicial", 
    26: "Grupo Super Nosso Ativo",
    27: "Grupo Super Nosso Judicial",
    28: "SEMPRE EDITORA Extrajudicial", 
    29: "DEVA VEICULOS Extrajudicial",
    30: "Movyx - Extrajudicial",
    31: "One DI Extrajudicial", 
    32: "Precon Extrajudicial",
    33: "TENDA PÓS AGI",
    34: "RSF Judicial", 
    36: "Cyrela Judicial",
    43: "EMCCAMP",
    45: "Direcional Extrajudicial",
    46: "Direcional Judicial",
    47: "Localiza - Judicial", 
    53: "Direcional - Negociação CEF",
    54: "Vila Brasil Judicial", 
    56: "Colégio Brasileiro de São Cristóvão",
    58: "ARBORE ENGENHARIA",
    59: "BTM - JUDICIAL",
    60: "4º tabelinato Acima de 180 dias",
    61: "DIVIBANK",
    63: "Arbore - Judicial",
    64: "Itaú",
    65: "Demais Clientes",
    66: "Direcional - Jurídico Interno",
    67: "EMCCAMP Judicial",
    68: "Direcional - Pré Contencioso", 
    69: "BLIP", 
    70: "Tenda - Pré Contencioso",
    71: "Zatz Empreendimentos",
    72: "CANVAS ENGENHARIA LTDA",
    73: "DIVIBANK - Judicial",
    74: "TENDA PRÉ AGI",
    75: "Longitude",
    76: "Construtora São Jose",
    77: "JERONIMO DA VEIGA",
    78: 'Foco Aluguel de Carros',
    79: 'DVL Passivo',
    80: '4° Tabelionato - Ativo',
    81: 'TENDA - Colchão Interno',
    82: 'CYRELA - Pre Empreendimentos',
    83: 'Credaluga',
    84: 'Justa Energia',
    87: 'LCM Construção',
    88: 'Direcional Extra pré chave',
    89: 'Movida - Passivo',
    90: 'Foco Aluguel de Carros - Passivo',
    91: 'CredAluga - Desocupado',
    86: 'Sobrosa Mello Construtora',
    92: 'Sonhar Construtora',
    93: 'Construtora Renault Diniz LTDA',
    94: 'Movida - Avarias Não Faturadas',
    95 : 'Arquiplan',
    96 : 'Bate Carteira',

}

campanhas_display = {
    "000001": "Vic Extra ",
    "000002": "Vic Judicial",
    "000003": "MRV Extra",
    "000004": "MRV Judicial", 
    "000005": "Movida Extra",
    "000006": "Movida Judicial",
    "000009": "RSF Extrajudicial", 
    "000010": "Localiza Extrajudicial",
    "000013": "Vila Brasil Extrajudicial",
    "000015": "BTM Extrajudicial",
    "000016": "BVEP Extrajudicial",
    "000017": "BVEP Judicial",
    "000019": "Cyrela Extrajudicial",
    "000020": "DVL Extrajudicial",
    "000021":"DVL Judicial",
    "000022": "Grupo Level Extrajudicial",
    "000023": "Grupo Level Judicial", 
    "000024": "Grupo Super Nosso Ativo",
    "000025": "Grupo Super Nosso Judicial",
    "000026": "SEMPRE EDITORA Extrajudicial", 
    "000027": "DEVA VEICULOS Extrajudicial",
    "000028": "Movyx - Extrajudicial",
    "000029": "One DI Extrajudicial", 
    "000030": "Precon Extrajudicial",
    "000031": "TENDA PÓS AGI",
    "000032": "RSF Judicial", 
    "000034": "Cyrela Judicial",
    "000041": "EMCCAMP",
    "000043": "Direcional Extrajudicial",
    "000044": "Direcional Judicial",
    "000045": "Localiza - Judicial", 
    "000051": "Direcional - Negociação CEF",
    "000052": "Vila Brasil Judicial", 
    "000054": "Colégio Brasileiro de São Cristóvão",
    "000056": "ARBORE ENGENHARIA",
    "000057": "BTM - JUDICIAL",
    "000058": "4º tabelinato Acima de 180 dias",
    "000059": "DIVIBANK",
    "000061":"Arbore - Judicial",
    "000062": "Itaú",
    "000063": "Demais Clientes",
    "000064": "Direcional - Jurídico Interno",
    "000065": "EMCCAMP Judicial",
    "000066": "Direcional - Pré Contencioso", 
    "000067": "BLIP", 
    "000068": "Tenda - Pré Contencioso",
    "000069" : "Zatz Empreendimentos",
    "000070" : "CANVAS ENGENHARIA LTDA",
    '000071' : "DIVIBANK - Judicial",
    "000072" : "TENDA PRÉ AGI",
    '000073' : "Longitude",
    "000074" : "Construtora São Jose",
    "000075" : "JERONIMO DA VEIGA",
    '000076' : 'Foco Aluguel de Carros',
    '000077' : 'DVL Passivo',
    '000078' : '4° Tabelionato - Ativo',
    '000079' : 'TENDA - Colchão Interno',
    '000080' : 'CYRELA - Pre Empreendimentos',
    '000081' : 'Credaluga',
    '000082' : 'Justa Energia',
    '000085' : 'LCM Construção',
    '000086' : 'Direcional Extra pré chave',
    '000087' : 'Movida - Passivo',
    '000088' : 'Foco Aluguel de Carros - Passivo',
    '000089' : 'CredAluga - Desocupado',
    '000084' : 'Sobrosa Mello Construtora',
    '000090' : 'Sonhar Construtora',
    '000091' : 'Construtora Renault Diniz LTDA',
    '000092' : 'Movida - Avarias Não Faturadas',
    '000094' : 'Bate Carteira',
    '000093' : 'Arquiplan'

}


#    'Teste Tecnologia': ['000042 - Teste Tecnologia'],
credor_vs_campanha = {
   'TENDA': ['000031 - TENDA', '000072 - TENDA PRÉ AGI', '000068 - Tenda - Pré Contencioso', '000079 - TENDA - Colchão Interno'],
   'DIRECIONAL ENGENHARIA': ['000043 - Direcional Extrajudicial', '000064 - Direcional - Jurídico Interno', '000044 - Direcional Judicial', '000066 - Direcional - Pré Contencioso','000086 - Direcional Extra pré chave'],
   'DIRECIONAL CEF': ['000051 - Direcional - Negociação CEF'],
#    'DIRECIONAL ENGENHARIA SA' : ['000086 - Direcional Extra pré chave'],
   'VIC ENGENHARIA': ['000001 - Vic Extra ', '000002 - Vic Judicial'],
   'CYRELA': ['000019 - Cyrela Extrajudicial', '000034 - Cyrela Judicial'],
   'CYRELA - PRE EMPREENDIMENTOS': ['000080 - CYRELA - Pre Empreendimentos'],
   'BVEP': ['000016 - BVEP Extrajudicial', '000017 - BVEP Judicial'],
   'ZATZ': ['000069 - Zatz Empreendimentos'],
   'Grupo Level': ['000023 - Grupo Level Judicial'],
   'COLEGIO BRASILEIRO SÃO CRISTOVÃO': ['000054 - Colégio Brasileiro de São Cristóvão'],
   'VILA BRASIL': ['000013 - Vila Brasil Extrajudicial', '000052 - Vila Brasil Judicial'],
   'SEMPRE Editora': ['000026 - SEMPRE EDITORA Extrajudicial', '000048 - SEMPRE EDITORA - Ativos'],
   'RSF EMPREENDIMENTOS': ['000032 - RSF Judicial', '000009 - RSF Extrajudicial'],
   'MRV ENGENHARIA E PARTICIPACOES': ['000004 - MRV Judicial', '000003 - MRV Extra'],
   'MOVIDA': ['000005 - Movida Extra', '000006 - Movida Judicial'],
   'ITAU UNIBANCO S.A.': ['000062 - Itaú'],
   'Grupo Level': ['000023 - Grupo Level Judicial', '000022 - Grupo Level Extrajudicial'],
   'BTM/VOLL': ['000015 - BTM Extrajudicial'],
   'EMCCAMP RESIDENCIAL S.A.': ['000041 - EMCCAMP', '000065 - EMCCAMP Judicial'],
   'DVL': ['000020 - DVL Extrajudicial', '000021 - DVL Judicial', '000077 - DVL Passivo'],
   'DIVIBANK': ['000059 - DIVIBANK', '000071 - DIVIBANK - Judicial'],
   'DEVA VEICULOS': ['000027 - DEVA VEICULOS Extrajudicial'],
   'Demais Clientes MCSA': ['000063 - Demais Clientes'],
   'LOCALIZA': ['000010 - Localiza Extrajudicial', '000045 - Localiza - Judicial', '000010 - Localiza Extrajudicial'],
   'ARBORE ENGENHARIA LTDA': ['000056 - ARBORE ENGENHARIA', "000061 - Arbore - Judicial"],
   '4º Tabelionato': ['000078 - 4° Tabelionato - Ativo','000058 - 4º tabelinato Acima de 180 dias',  '000078 - 4° Tabelionato - Ativo'],
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

credor_vs_campanha = {chave: credor_vs_campanha[chave] for chave in sorted(credor_vs_campanha)}


campanha_vs_credor = {}
for credor, campanhas in credor_vs_campanha.items():
    for campanha in campanhas:
        campanha_vs_credor[campanha] = credor
        
campanhas = {
    "000001": 3, "000002": 4, "000003": 5, "000004": 6, "000005": 7, 
    "000006": 8, "000009": 11, "000010": 12, "000013": 15, "000015": 17,
    "000016": 18, "000017": 19, "000019": 21, "000020": 22, 
    "000021": 23, "000022": 24, "000023": 25, "000024": 26, "000025": 27, 
    "000026": 28, "000027": 29, "000028":30, "000029":31,"000030":32, "000031": 33, "000032": 34, "000034": 36, 
    "000041": 43, "000043": 45, "000044": 46, "000045": 47, "000051": 53, 
    "000052": 54, "000054": 56, "000056": 58,"000057": 59, 
    "000058": 60, "000059": 61, "000061": 63, "000062": 64,"000063": 65, 
    "000064": 66, "000065": 67, "000066": 68, "000067": 69, "000068": 70, 
    "000069": 71, "000070": 72, "000071": 73, "000072":74, "000073":75,
    "000074":76, "000075": 77, '000076': 78, '000077': 79, '000078': 80, '000079': 81,
    '000081': 83, '000080': 82, '000082': 84, '000085': 87, '000086': 88,
    '000087' : 89, '000088' : 90, '000089': 91,  '000084' : 86, '000090' : 92,
    '000091': 93, '000092' : 94

}



campanha_judi = {
    "000002": "Vic Judicial",
    "000004": "MRV Judicial", 
    "000006": "Movida Judicial",
    "000017": "BVEP Judicial",
    "000021":"DVL Judicial",
    "000023": "Grupo Level Judicial", 
    "000034": "Cyrela Judicial",
    "000025": "Grupo Super Nosso Judicial",
    "000044": "Direcional Judicial",
    "000045": "Localiza - Judicial", 
    "000032": "RSF Judicial", 
    "000052": "Vila Brasil Judicial", 
    "000057": "BTM - JUDICIAL",
    "000061":"Arbore - Judicial",
    "000065": "EMCCAMP Judicial",
    "000071" : "DIVIBANK - Judicial"
}

campanha_extra = {
    "000001": "Vic Extra ",
    "000003": "MRV Extra",
    "000005": "Movida Extra",
    "000009": "RSF Extrajudicial", 
    "000010": "Localiza Extrajudicial",
    "000013": "Vila Brasil Extrajudicial",
    "000015": "BTM Extrajudicial",
    "000016": "BVEP Extrajudicial",
    "000019": "Cyrela Extrajudicial",
    "000020": "DVL Extrajudicial",
    "000022": "Grupo Level Extrajudicial",
    "000024": "Grupo Super Nosso Ativo",
    "000026": "SEMPRE EDITORA Extrajudicial", 
    "000027": "DEVA VEICULOS Extrajudicial",
    "000029": "One DI Extrajudicial", 
    "000030": "Precon Extrajudicial",
    "000031": "TENDA PÓS AGI",
    "000041": "EMCCAMP",
    "000043": "Direcional Extrajudicial",
    "000051": "Direcional - Negociação CEF",
    "000054": "Colégio Brasileiro de São Cristóvão",
    "000056": "ARBORE ENGENHARIA",
    "000058": "4º tabelinato Acima de 180 dias",
    "000059": "DIVIBANK",
    "000062": "Itaú",
    "000063": "Demais Clientes",
    "000064": "Direcional - Jurídico Interno",
    "000066": "Direcional - Pré Contencioso", 
    "000067": "BLIP",
    "000068": "Tenda - Pré Contencioso",
    "000069": "Zatz Empreendimentos",
    "000070": "CANVAS ENGENHARIA LTDA",
    "000072": "TENDA PRÉ AGI",
    "000073": "Longitude",
    "000074": "Construtora São Jose",
    "000075" : "JERONIMO DA VEIGA",
    '000076' : 'Foco Aluguel de Carros',
    '000077' : 'DVL Passivo',
    '000078' : '4° Tabelionato - Ativo',
    '000079' : 'TENDA - Colchão Interno',
    '000080' : 'CYRELA - Pre Empreendimentos',
    '000081' : 'Credaluga',
    '000082' : 'Justa Energia',
    '000085' : 'LCM Construção',
    '000086' : 'Direcional Extra pré chave',
    '000087' : 'Movida - Passivo',
    '000088' : 'Foco Aluguel de Carros - Passivo',
    '000089' : 'CredAluga - Desocupado',
    '000084' : 'Sobrosa Mello Construtora',
    '000090' : 'Sonhar Construtora',
    '000091' : 'Construtora Renault Diniz LTDA',
    '000092' : 'Movida - Avarias Não Faturadas'

}

def obter_id_responsavel_tecnico(tipo_demanda):
    """
    Recebe: "Alteração de Vínculo"
    Retorna: 82132421 (ID do Lucas)
    """
    # 1. Procura nas listas quem é o dono da tarefa
    nome_responsavel = None
    for nome, tarefas in responsaveis.items():
        if tipo_demanda in tarefas:
            nome_responsavel = nome
            break # Parar assim que encontrar o primeiro responsável
    
    # 2. Se achou um nome (ex: "Lucas"), busca o ID dele
    if nome_responsavel:
        return responsaveis_id.get(nome_responsavel)
    
    return None