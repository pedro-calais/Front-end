# app.py
from __future__ import annotations

import os
from flask import Flask
from flask_cors import CORS
from sqlalchemy import inspect

# ✅ Centraliza configs/ambiente (não quebra imports antigos)
from config.settings import setup_locale

# ✅ Seu database/engine continuam iguais
from database import engine

# ✅ Telemetria (você já tem isso)
from routes.rotas_telemetria import telemetry_bp

# ✅ Rotas separadas (mantido exatamente como estava)
try:
    from routes.auth_routes import auth_bp  # /login
except Exception as e:
    auth_bp = None
    print(f"⚠️ auth_routes não carregou: {e}")

try:
    from routes.users_routes import users_bp  # /users
except Exception as e:
    users_bp = None
    print(f"⚠️ users_routes não carregou: {e}")

try:
    from routes.clickup_routes import clickup_bp  # /chamados/* , /api/pendencias/*
except Exception as e:
    clickup_bp = None
    print(f"⚠️ clickup_routes não carregou: {e}")

try:
    from routes.clientes_routes import clientes_bp  # /clientes/*
except Exception as e:
    clientes_bp = None
    print(f"⚠️ clientes_routes não carregou: {e}")

try:
    from routes.acionamentos_routes import acionamentos_bp  # /api/acionamentos/*
except Exception as e:
    acionamentos_bp = None
    print(f"⚠️ acionamentos_routes não carregou: {e}")

try:
    from routes.dashboard_routes import dashboard_bp  # /api/*
except Exception as e:
    dashboard_bp = None
    print(f"⚠️ dashboard_routes não carregou: {e}")


def _debug_print_tables():
    """Debug opcional: lista tabelas do banco (igual você tinha no final do app)."""
    if os.getenv("DEBUG_TABLES", "0") != "1":
        return

    print("\n" + "=" * 40)
    print("🕵️  INVESTIGAÇÃO DE TABELAS SQL")
    print("=" * 40)

    inspector = inspect(engine)
    tabelas_reais = inspector.get_table_names()

    print(f"Total encontrado: {len(tabelas_reais)} tabelas.")
    print("Lista oficial do Banco de Dados:")
    for t in tabelas_reais:
        print(f" -> '{t}'")

    print("=" * 40 + "\n")


def create_app() -> Flask:
    setup_locale()

    app = Flask(__name__)
    CORS(app, resources={r"/*": {"origins": "*"}})

    # =========================
    # REGISTRO DE BLUEPRINTS
    # =========================

    app.register_blueprint(telemetry_bp, url_prefix="/telemetry")

    if auth_bp:
        app.register_blueprint(auth_bp)

    if users_bp:
        app.register_blueprint(users_bp)

    if clickup_bp:
        app.register_blueprint(clickup_bp)

    if clientes_bp:
        app.register_blueprint(clientes_bp)

    if acionamentos_bp:
        app.register_blueprint(acionamentos_bp)

    if dashboard_bp:
        app.register_blueprint(dashboard_bp)

    # ✅ ESSENCIAL (estava comentado)
    _debug_print_tables()
    return app


if __name__ == "__main__":
    app = create_app()
    print("🚀 Servidor Iniciado na porta 5000")
    app.run(debug=True, port=5000)
