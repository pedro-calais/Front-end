# config/rules.py
from __future__ import annotations

from .constants import RESPONSAVEIS, RESPONSAVEIS_ID

def obter_id_responsavel_tecnico(tipo_demanda: str) -> int | None:
    """
    Recebe: "Alteração de Vínculo"
    Retorna: 82132421 (ID do Lucas) conforme RESPONSAVEIS e RESPONSAVEIS_ID
    """
    nome_responsavel = None
    for nome, tarefas in RESPONSAVEIS.items():
        if tipo_demanda in tarefas:
            nome_responsavel = nome
            break

    if nome_responsavel:
        return RESPONSAVEIS_ID.get(nome_responsavel)

    return None
