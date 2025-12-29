# routes/users_routes.py
import hashlib
from flask import Blueprint, jsonify, request
from database import SessionLocal
from models import User

users_bp = Blueprint("users_bp", __name__)

@users_bp.route("/users", methods=["GET"])
def list_users():
    session = SessionLocal()
    try:
        users = session.query(User).all()
        return jsonify([{
            "id": u.id,
            "name": u.name,
            "username": u.username,
            "email": u.email,
            "access_level": u.access_level,
            "ativo": u.ativo
        } for u in users])
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()

@users_bp.route("/users", methods=["POST"])
def create_user():
    data = request.json or {}
    session = SessionLocal()
    try:
        if session.query(User).filter_by(username=data["username"]).first():
            return jsonify({"error": "Este usuário já existe."}), 400

        senha_raw = data.get("password", "123456")
        senha_hash = hashlib.sha256(senha_raw.encode()).hexdigest()

        new_user = User(
            name=data["name"],
            username=data["username"],
            email=data.get("email"),
            access_level=data["access_level"],
            ativo=data.get("ativo", True),
            password_hash=senha_hash,
        )

        session.add(new_user)
        session.commit()
        return jsonify({"message": "Usuário criado com sucesso!", "id": new_user.id}), 201

    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()

@users_bp.route("/users/<int:user_id>", methods=["PUT", "DELETE"])
def manage_user(user_id):
    session = SessionLocal()
    try:
        user = session.query(User).filter_by(id=user_id).first()
        if not user:
            return jsonify({"error": "Usuário não encontrado"}), 404

        if request.method == "DELETE":
            session.delete(user)
            session.commit()
            return jsonify({"message": "Usuário removido com sucesso!"})

        data = request.json or {}
        user.name = data["name"]
        user.username = data["username"]
        user.email = data.get("email")
        user.access_level = data["access_level"]
        user.ativo = bool(data["ativo"])

        nova_senha = data.get("password")
        if nova_senha and nova_senha.strip():
            user.password_hash = hashlib.sha256(nova_senha.encode()).hexdigest()

        session.commit()
        return jsonify({"message": "Dados atualizados com sucesso!"})

    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()
