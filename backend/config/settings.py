# config/settings.py
from __future__ import annotations

import os
import calendar
import locale
from dataclasses import dataclass
from datetime import datetime, date
from dotenv import load_dotenv

load_dotenv()

def setup_locale():
    """
    Evita quebrar em Windows/Linux quando pt_BR.UTF-8 não está disponível.
    Chame isso no start do app (ex: create_app ou main).
    """
    try:
        locale.setlocale(locale.LC_ALL, "pt_BR.UTF-8")
    except locale.Error:
        try:
            locale.setlocale(locale.LC_ALL, "Portuguese_Brazil.1252")
        except locale.Error:
            pass

@dataclass(frozen=True)
class Settings:
    api_token: str | None = os.getenv("API_TOKEN") or os.getenv("api_token")
    email_sistema: str | None = os.getenv("email_sistema")
    senha_sistema: str | None = os.getenv("senha_sistema")

SETTINGS = Settings()

def hoje() -> date:
    return datetime.today().date()

def inicio_mes() -> date:
    h = hoje()
    return h.replace(day=1)

def fim_mes() -> date:
    im = inicio_mes()
    last_day = calendar.monthrange(im.year, im.month)[1]
    return im.replace(day=last_day)

DIAS_DE_FERIADO = (
    (2024, 1, 1),(2024, 2, 12),(2024, 2, 13),(2024, 2, 14),
    (2024, 4, 21),(2024, 5, 1),(2024, 5, 30),(2024, 9, 7),
    (2024, 10, 12),(2024, 11, 2),(2024, 11, 12),(2024, 11, 15),
    (2024, 11, 20),
)

CNPJ_CREDOR = {
    "4º Tabelionato": os.getenv("CNPJ_TABELIONATO"),
    "ARBORE ENGENHARIA LTDA": os.getenv("CNPJ_ARBORE_ENGENHARIA_LTDA"),
    "BVEP": os.getenv("CNPJ_BVEP"),
    "CANVAS ENGENHARIA LTDA": os.getenv("CNPJ_CANVAS_ENGENHARIA_LTDA"),
    "COMPANHIA DE LOCACAO DAS AMERICAS": os.getenv("CNPJ_COMPANHIA_DE_LOCACAO_DAS_AMERICAS"),
    "CONSTRUTORA SAO JOSE LTDA": os.getenv("CNPJ_CONSTRUTORA_SAO_JOSE_LTDA"),
    "CYRELA": os.getenv("CNPJ_CYRELA"),
    "Demais Clientes MCSA": os.getenv("CNPJ_DEMAIS_CLIENTES_MCSA"),
    "DEVA VEICULOS": os.getenv("CNPJ_DEVA_VEICULOS"),
    "DIRECIONAL ENGENHARIA": os.getenv("CNPJ_DIRECIONAL_ENGENHARIA"),
    "DIRECIONAL CEF": os.getenv("CNPJ_DIRECIONAL_ENGENHARIA"),
    "DIVIBANK": os.getenv("CNPJ_DIVIBANK"),
    "DVL": os.getenv("CNPJ_DVL"),
    "EMCCAMP RESIDENCIAL S.A.": os.getenv("CNPJ_EMCCAMP_RESIDENCIAL_SA"),
    "Escritório Candiotto Valle Advogados": os.getenv("CNPJ_ESCRITÓRIO_CANDIOTTO_VALLE_ADVOGADOS"),
    "GESTAO E OPERACAO DE VIAGENS": os.getenv("CNPJ_GESTAO_E_OPERACAO_DE_VIAGENS"),
    "GRUPO SUPER NOSSO": os.getenv("CNPJ_GRUPO_SUPER_NOSSO"),
    "ITAU UNIBANCO S.A.": os.getenv("CNPJ_ITAU_UNIBANCO_SA"),
    "LONGITUDE INCORPORACAO & URBANISMO LTDA": os.getenv("CNPJ_LONGITUDE_INCORPORACAO_E_URBANISMO_LTDA"),
    "MOVIDA": os.getenv("CNPJ_MOVIDA"),
    "Movyx": os.getenv("CNPJ_MOVYX"),
    "MRV ENGENHARIA E PARTICIPACOES SA": os.getenv("CNPJ_MRV_ENGENHARIA_E_PARTICIPACOES_SA"),
    "One DI": os.getenv("CNPJ_ONE_DI"),
    "Precon": os.getenv("CNPJ_PRECON_ENGENHARIA"),
    "Realiza Construtora": os.getenv("CNPJ_REALIZA_CONSTRUTORA_LTDA"),
    "RSF EMPREENDIMENTOS": os.getenv("CNPJ_RSF_EMPREENDIMENTOS"),
    "SEMPRE Editora": os.getenv("CNPJ_SEMPRE_EDITORA"),
    "TENDA": os.getenv("CNPJ_TENDA"),
    "VIC ENGENHARIA": os.getenv("CNPJ_VIC_ENGENHARIA"),
    "VILA BRASIL": os.getenv("CNPJ_VILA_BRASIL"),
    "ZATZ": os.getenv("CNPJ_ZATZ_EMPREENDIMENTOS_E_PARTICIPACOES_LTDA"),
    "CONSTRUTORA SAO JOSE JUDICIAL": os.getenv("CNPJ_CONSTRUTORA_SAO_JOSE_LTDA"),
}

# aliases antigos
api_token = SETTINGS.api_token
email_sistema = SETTINGS.email_sistema
senha_sistema = SETTINGS.senha_sistema
cnpj_credor = CNPJ_CREDOR
