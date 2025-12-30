# routes/__init__.py
"""Blueprint registration for all route modules."""
from .auth_routes import auth_bp
from .users_routes import users_bp
from .clickup_routes import clickup_bp
from .clientes_routes import clientes_bp
from .acionamentos_routes import acionamentos_bp
from .dashboard_routes import dashboard_bp
from .metas_routes import metas_bp

def register_routes(app):
    # Centralized blueprint registration.
    app.register_blueprint(auth_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(clickup_bp)
    app.register_blueprint(clientes_bp)
    app.register_blueprint(acionamentos_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(metas_bp)
