from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import urllib.parse

# --- 1. CONFIGURAÇÃO DAS CREDENCIAIS ---
# Função para montar a String de Conexão segura (trata o @ da senha)
def create_connection_string(server, database, user, password):
    # Codifica a senha para URL (ex: 'abacaxi@mcsa' vira 'abacaxi%40mcsa')
    password_encoded = urllib.parse.quote_plus(password)
    driver_encoded = urllib.parse.quote_plus("ODBC Driver 17 for SQL Server")
    
    return f"mssql+pyodbc://{user}:{password_encoded}@{server}/{database}?driver={driver_encoded}"

# Definição dos Bancos de Dados (Baseado na sua lista)
DB_CONFIGS = {
    # --- SERVIDOR STD2016 ---
    "Candiotto_STD": {
        "server": r"192.168.1.8\STD2016",
        "db": "Candiotto_STD",
        "user": "Rodrigo",
        "pass": "candiotto@123"
    },
    "Candiotto_reports": {
        "server": r"192.168.1.8\STD2016",
        "db": "Candiotto_reports",
        "user": "Rodrigo",
        "pass": "candiotto@123"
    },
    
    # --- SERVIDOR CANDIOTTO (Painel e Outros) ---
    "Painel": {
        "server": r"192.168.1.8\CANDIOTTO",
        "db": "Painel",
        "user": "Rodrigo",
        "pass": "abacaxi@mcsa"
    },
    "CANDIOTTO_DBA": {
        "server": r"192.168.1.8\CANDIOTTO",
        "db": "CANDIOTTO_DBA",
        "user": "Rodrigo",
        "pass": "abacaxi@mcsa"
    },
    "DLAnalytics": {
        "server": r"192.168.1.8\CANDIOTTO",
        "db": "DLAnalytics",
        "user": "Rodrigo",
        "pass": "abacaxi@mcsa"
    },
    "Chatbot": {
        "server": r"192.168.1.8\CANDIOTTO",
        "db": "Chatbot",
        "user": "Rodrigo",
        "pass": "abacaxi@mcsa"
    }
}

# --- 2. CRIAÇÃO DOS MOTORES (ENGINES) ---
# Criamos um dicionário onde a chave é o nome do banco e o valor é a Engine conectada
engines = {}

for db_name, config in DB_CONFIGS.items():
    conn_str = create_connection_string(config["server"], config["db"], config["user"], config["pass"])
    engines[db_name] = create_engine(
        conn_str, 
        pool_size=10,       # Reduzi um pouco para não estourar conexões somando todas
        max_overflow=20
    )

# --- 3. CONFIGURAÇÃO PADRÃO (ORM) ---
# Mantemos o 'engine' e 'SessionLocal' apontando para o banco principal (Painel)
# para que o sistema de Login/Usuários continue funcionando normalmente.

engine = engines["Painel"] # O banco padrão da aplicação
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# --- FUNÇÕES AUXILIARES ---

def get_db():
    """Retorna sessão do banco principal (Painel) para o FastAPI"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_engine_by_name(db_name: str):
    """
    Retorna a engine específica baseada no nome.
    Ex: get_engine_by_name("Candiotto_STD")
    """
    if db_name in engines:
        return engines[db_name]
    else:
        raise Exception(f"Banco de dados '{db_name}' não configurado no database.py")