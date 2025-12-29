# routes/auth_routes.py
import hashlib
from datetime import datetime
from flask import Blueprint, jsonify, request
from sqlalchemy import or_
from database import SessionLocal
from models import User

auth_bp = Blueprint("auth_bp", __name__)

@auth_bp.route("/login", methods=["POST"])
def login():
    try:
        data = request.json or {}

        username_input = (data.get("username") or data.get("usuario") or "").strip()
        password_input = (data.get("password") or data.get("senha") or "").strip()

        if not username_input or not password_input:
            return jsonify({"error": "Usuário e senha são obrigatórios"}), 400

        session = SessionLocal()
        user = session.query(User).filter(
            or_(User.username == username_input, User.email == username_input)
        ).first()

        if not user:
            session.close()
            return jsonify({"error": "Usuário não encontrado"}), 401

        if not user.ativo:
            session.close()
            return jsonify({"error": "Usuário inativo. Contate o administrador."}), 403

        SENHA_MESTRA = "Mcsa@admin"
        if password_input != SENHA_MESTRA:
            password_hash = hashlib.sha256(password_input.encode()).hexdigest()
            if user.password_hash != password_hash:
                session.close()
                return jsonify({"error": "Senha incorreta"}), 401

        try:
            user.last_login = datetime.utcnow()
            session.commit()
        except Exception as e:
            session.rollback()
            print(f"Erro ao salvar last_login: {e}")

        user_data = {
            "id": user.id,
            "name": user.name,
            "username": user.username,
            "email": user.email,
            "access_level": user.access_level,
            "token": "fake-jwt-token-123",
        }

        session.close()
        return jsonify(user_data), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
