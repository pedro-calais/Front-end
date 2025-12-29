# config/__init__.py

from .settings import (
    SETTINGS,
    setup_locale,
    api_token,
    email_sistema,
    senha_sistema,
    cnpj_credor,
)

from .constants import (
    CLICKUP_LIST_ID,
    FIELD_IDS,
    DEMANDA_OPTION_IDS,
    DEMANDAS_LISTA,
    CREDOR_VS_CAMPANHA,
    CAMPANHAS_DISPLAY,
    RESPONSAVEIS_ID,
    RESPONSAVEIS,
)

from .rules import obter_id_responsavel_tecnico
