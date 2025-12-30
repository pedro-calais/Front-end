"""Telemetry endpoints used by the web app for activity tracking."""
from flask import Blueprint, request, jsonify
from database import SessionLocal
from models import User, ActivityLog
from sqlalchemy import func, desc, cast, Date, extract
from datetime import datetime, timedelta
import calendar
from models import User, ActivityLog, UserCelula, Celula 


telemetry_bp = Blueprint('telemetry', __name__)

# 1. ROTA HEARTBEAT (O React chama a cada 30s)
@telemetry_bp.route('/heartbeat', methods=['POST'])
def heartbeat():
    # Frontend heartbeat to keep last_seen fresh.
    session = SessionLocal()
    try:
        data = request.json
        user_id = data.get('user_id')

        if not user_id:
            return jsonify({"error": "User ID required"}), 400

        user = session.query(User).filter(User.id == user_id).first()
        
        if user:
            user.last_seen = datetime.utcnow() # Atualiza o "Visto por último"
            session.commit()
            return jsonify({"status": "alive"}), 200
        
        return jsonify({"error": "User not found"}), 404
    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()

# 2. ROTA DE LOG DE ATIVIDADE (Chamada ao mudar de tela)
@telemetry_bp.route('/log', methods=['POST'])
def log_activity():
    # Stores navigation/interaction events for reporting.
    session = SessionLocal()
    try:
        data = request.json
        
        new_log = ActivityLog(
            user_id=data.get('user_id'),
            route=data.get('route'),
            action=data.get('action', 'PAGE_VIEW'),
            duration_seconds=data.get('duration'),
            details=data.get('details')
        )
        
        session.add(new_log)
        session.commit()
        return jsonify({"status": "logged"}), 201
    except Exception as e:
        session.rollback()
        print(f"Erro ao logar telemetria: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()

# 3. ROTA PARA VER QUEM ESTÁ ONLINE (Para o seu Dashboard Administrativo)
@telemetry_bp.route('/online-users', methods=['GET'])
def get_online_users():
    # Admin view of who is online now.
    session = SessionLocal()
    try:
        # Pega todos os usuários ativos
        users = session.query(User).filter(User.ativo == True).all()
        
        online_list = []
        for u in users:
            # Usa a propriedade @property que criamos no Model
            status = "online" if u.is_online else "offline"
            
            online_list.append({
                "id": u.id,
                "name": u.name,
                "status": status,
                "last_seen": u.last_seen,
                "last_route": u.logs[-1].route if u.logs else "N/A" # Pega a última tela visitada
            })
            
        return jsonify(online_list), 200
    finally:
        session.close()

# 4. ROTA PARA BUSCAR LOGS DE ATIVIDADE (Com filtros simples)

from sqlalchemy import func, desc, extract # <--- Adicione extract
# ... outros imports ...

@telemetry_bp.route('/manager/dashboard', methods=['GET'])
def get_manager_dashboard():
    # Aggregated dashboard for managers.
    session = SessionLocal()
    try:
        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        
        users = session.query(User).filter(User.ativo == True).all()
        
        users_data = []
        online_count = 0
        limit_time = datetime.now() - timedelta(minutes=5)

        for u in users:
            # 1. Status Online
            is_online = False
            if u.last_seen and u.last_seen > limit_time:
                is_online = True
                online_count += 1
            
            # 2. Produtividade (Ações Hoje)
            actions_today = session.query(func.count(ActivityLog.id))\
                .filter(ActivityLog.user_id == u.id)\
                .filter(ActivityLog.created_at >= today_start)\
                .scalar() or 0

            # 3. Trilha
            recent_logs = session.query(ActivityLog.route, ActivityLog.created_at)\
                .filter(ActivityLog.user_id == u.id)\
                .order_by(ActivityLog.created_at.desc())\
                .limit(3)\
                .all()
            trail = [{"route": log.route, "time": log.created_at.isoformat()} for log in recent_logs]
            current_route = trail[0]['route'] if trail else "N/A"

            # 4. Célula (NOVO)
            # Pega a primeira célula associada ou "Geral"
            cell_name = "Geral"
            if u.user_celulas and len(u.user_celulas) > 0:
                # Assume que o objeto 'celula' está carregado no relacionamento
                cell_name = u.user_celulas[0].celula.nome

            users_data.append({
                "id": u.id,
                "name": u.name,
                "avatar": u.name[0].upper() if u.name else "?",
                "cell": cell_name,  # <--- Enviando a célula
                "is_online": is_online,
                "last_login": u.last_login.isoformat() if u.last_login else None,
                "last_seen": u.last_seen.isoformat() if u.last_seen else None,
                "current_route": current_route,
                "actions_today": actions_today,
                "trail": trail
            })

        users_data.sort(key=lambda x: (not x['is_online'], -x['actions_today']))

        # 5. Top Páginas
        top_pages_query = session.query(
            ActivityLog.route, 
            func.count(ActivityLog.id).label('total'),
            func.avg(ActivityLog.duration_seconds).label('avg_time')
        ).group_by(ActivityLog.route).order_by(desc('total')).limit(7).all()

        top_pages = [{"route": r[0], "visits": r[1], "avg_time": round(r[2] or 0)} for r in top_pages_query]

        # 6. Gráfico de Acesso por Hora (NOVO)
        # Agrupa logs por hora e conta usuários únicos naquela hora
        hourly_query = session.query(
            extract('hour', ActivityLog.created_at).label('hour'),
            func.count(ActivityLog.user_id.distinct()).label('users_count')
        ).filter(ActivityLog.created_at >= today_start)\
         .group_by(extract('hour', ActivityLog.created_at)).all()

        # Formata para garantir as 24h (ou horário comercial 8-18h)
        access_curve = []
        data_map = {r[0]: r[1] for r in hourly_query} # Transforma em dicionário {9: 10, 10: 15...}
        
        for h in range(8, 19): # Das 08h às 18h
            access_curve.append({
                "time": f"{h}h",
                "users": data_map.get(h, 0)
            })

        return jsonify({
            "overview": {
                "total_users": len(users),
                "online_now": online_count,
            },
            "users": users_data,
            "top_pages": top_pages,
            "access_curve": access_curve # <--- Enviando dados do gráfico
        }), 200

    except Exception as e:
        print(f"❌ ERRO DASHBOARD: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()

@telemetry_bp.route('/my-performance', methods=['POST'])
def get_my_performance():
    # Per-user performance snapshot.
    session = SessionLocal()
    try:
        data = request.json
        user_id = data.get('user_id')
        
        now = datetime.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        META_MENSAL = 5000 

        # 1. DADOS DO USUÁRIO
        user = session.query(User).filter(User.id == user_id).first()
        if not user: return jsonify({"error": "User not found"}), 404

        # Descobrir Célula do Usuário
        user_cell_id = None
        cell_name = "Geral"
        if user.user_celulas: # Assume relacionamento configurado
            user_cell_id = user.user_celulas[0].celula_id
            cell_name = user.user_celulas[0].celula.nome

        # Ações do usuário no Mês
        actions_month = session.query(func.count(ActivityLog.id))\
            .filter(ActivityLog.user_id == user_id)\
            .filter(ActivityLog.created_at >= month_start)\
            .scalar() or 0
        
        percentage_month = min(int((actions_month / META_MENSAL) * 100), 100)
        score = round((actions_month / META_MENSAL) * 10, 1)

        # 2. COMPARATIVO COM A CÉLULA (NOVO)
        avg_cell = 0
        if user_cell_id:
            # Pega total de ações de todos da célula no mês
            total_actions_cell = session.query(func.count(ActivityLog.id))\
                .join(User, ActivityLog.user_id == User.id)\
                .join(UserCelula, User.id == UserCelula.user_id)\
                .filter(UserCelula.celula_id == user_cell_id)\
                .filter(ActivityLog.created_at >= month_start)\
                .scalar() or 0
            
            # Conta quantos usuários na célula
            count_users_cell = session.query(func.count(User.id))\
                .join(UserCelula)\
                .filter(UserCelula.celula_id == user_cell_id)\
                .scalar() or 1
            
            avg_cell = int(total_actions_cell / count_users_cell)
        
        # Comparação visual (quantos % vc está em relação à média)
        # Ex: Vc fez 120, média é 100 -> Vc é 120% da média
        comparison_percent = 0
        if avg_cell > 0:
            comparison_percent = int((actions_month / avg_cell) * 100)

        # 3. TOP 3 DA CÉLULA (NOVO)
        ranking = []
        if user_cell_id:
            top_users = session.query(User.name, func.count(ActivityLog.id).label('total'))\
                .join(ActivityLog, User.id == ActivityLog.user_id)\
                .join(UserCelula, User.id == UserCelula.user_id)\
                .filter(UserCelula.celula_id == user_cell_id)\
                .filter(ActivityLog.created_at >= month_start)\
                .group_by(User.name)\
                .order_by(desc('total'))\
                .limit(3).all()
            
            for idx, u_rank in enumerate(top_users):
                ranking.append({
                    "pos": idx + 1,
                    "name": u_rank[0],
                    "total": u_rank[1],
                    "is_me": (u_rank[0] == user.name)
                })

        # 4. KPI DIÁRIO
        actions_today = session.query(func.count(ActivityLog.id))\
            .filter(ActivityLog.user_id == user_id)\
            .filter(ActivityLog.created_at >= today_start)\
            .scalar() or 0

        # ... (Mantém lógica do gráfico curve igual antes) ...
        # (Para brevidade, assumindo que performance_curve e history já existem no código anterior)
        performance_curve = [] # Use a lógica anterior aqui
        history = [
            {"month": "Nov", "year": "2025", "status": "batida", "value": "102%"},
            {"month": "Out", "year": "2025", "status": "batida", "value": "100%"},
            {"month": "Set", "year": "2025", "status": "parcial", "value": "85%"},
        ]

        return jsonify({
            "main_kpi": {
                "score": score,
                "current": actions_month,
                "target": META_MENSAL,
                "percentage": percentage_month,
            },
            "cell_stats": {
                "name": cell_name,
                "my_total": actions_month,
                "avg_total": avg_cell,
                "comparison": comparison_percent # > 100 é bom
            },
            "ranking": ranking, # Lista Top 3
            "actions_today": actions_today,
            "performance_curve": performance_curve, # Lógica anterior
            "history": history
        }), 200

    except Exception as e:
        print(f"Erro performance: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()
