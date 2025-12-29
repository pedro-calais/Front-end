import os
from functools import lru_cache
from typing import Any, Mapping
from urllib.parse import quote_plus

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

load_dotenv()

_DATABASE_PREFIXES = ("DB", "DB2", "DB3", "DB4", "DB5", "DB6")


def _load_databases() -> tuple[dict[str, dict[str, str]], dict[str, str]]:
    configs: dict[str, dict[str, str]] = {}
    aliases: dict[str, str] = {}
    for prefix in _DATABASE_PREFIXES:
        server = os.getenv(f"{prefix}_SERVER")
        database = os.getenv(f"{prefix}_DATABASE")
        user = os.getenv(f"{prefix}_USER")
        password = os.getenv(f"{prefix}_PASSWORD")
        driver = os.getenv(f"{prefix}_DRIVER")
        if all((server, database, user, password, driver)):
            key = prefix.upper()
            configs[key] = {
                "server": server,
                "database": database,
                "user": user,
                "password": password,
                "driver": driver,
            }
            aliases[key] = key
            aliases[database.strip().upper()] = key
    return configs, aliases


_DATABASES, _ALIASES = _load_databases()


def _resolve_db_key(name: str) -> str:
    db_key = name.strip().upper()
    if db_key in _DATABASES:
        return db_key
    if db_key in _ALIASES:
        return _ALIASES[db_key]
    raise ValueError(f"Configuração não encontrada para '{name}'")


def _build_connection_string(cfg: dict[str, str]) -> str:
    odbc_params = (
        f"DRIVER={cfg['driver']};"
        f"SERVER={cfg['server']};"
        f"DATABASE={cfg['database']};"
        f"UID={cfg['user']};"
        f"PWD={cfg['password']}"
    )
    return f"mssql+pyodbc:///?odbc_connect={quote_plus(odbc_params)}"


@lru_cache(maxsize=len(_DATABASES) or None)
def get_engine(database: str) -> Engine:
    cfg = _DATABASES[_resolve_db_key(database)]
    return create_engine(
        _build_connection_string(cfg),
        fast_executemany=True,
        pool_pre_ping=True,
    )


def executar_query(query: str, database: str = "DB", params: Mapping[str, Any] | None = None, fetch: bool = True) -> list[dict[str, Any]] | None:
    engine = get_engine(database)
    with engine.begin() as connection:
        resultado = connection.execute(text(query), params or {})
        if fetch:
            return [dict(row._mapping) for row in resultado]
    return None