from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import urllib.parse
import os

# --- 1. CONFIGURAÇÃO DAS CREDENCIAIS ---
def create_connection_string(server, database, user, password):
    # Codifica a senha para URL (ex: 'abacaxi@mcsa' vira 'abacaxi%40mcsa')
    password_encoded = urllib.parse.quote_plus(password)
    driver_encoded = urllib.parse.quote_plus("ODBC Driver 17 for SQL Server")
    return f"mssql+pyodbc://{user}:{password_encoded}@{server}/{database}?driver={driver_encoded}"

# Definição dos Bancos de Dados
DB_CONFIGS = {
    # --- SERVIDOR STD2016 (Operacional / Legado) ---
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
    
    # --- SERVIDOR CANDIOTTO (Painel / Analytics) ---
    "Painel": {
        "server": r"192.168.1.8\CANDIOTTO",
        "db": "Painel",
        "user": "Rodrigo",
        "pass": "abacaxi@mcsa"
    },
    "DLAnalytics": {
        "server": r"192.168.1.8\CANDIOTTO",
        "db": "DLAnalytics",
        "user": "Rodrigo",
        "pass": "abacaxi@mcsa"
    },
    "CANDIOTTO_DBA": {
        "server": r"192.168.1.8\CANDIOTTO",
        "db": "CANDIOTTO_DBA",
        "user": "Rodrigo",
        "pass": "abacaxi@mcsa"
    }
}

# --- 2. CRIAÇÃO DOS MOTORES (ENGINES) ---
engines = {}

print("🔌 Inicializando conexões com Banco de Dados...")

for db_name, config in DB_CONFIGS.items():
    try:
        conn_str = create_connection_string(config["server"], config["db"], config["user"], config["pass"])
        engines[db_name] = create_engine(
            conn_str, 
            pool_size=10, 
            max_overflow=20,
            pool_pre_ping=True
        )
        # print(f"   ✅ Engine criada: {db_name}")
    except Exception as e:
        print(f"   ❌ Falha ao criar engine {db_name}: {e}")

# --- 3. EXPORTAÇÕES GLOBAIS ---

# 1. Banco Principal (Login/Usuários)
engine = engines.get("Painel")
if engine:
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
else:
    print("⚠️  AVISO CRÍTICO: Banco 'Painel' não conectado. O login pode falhar.")
    SessionLocal = None

Base = declarative_base()

# 2. Banco Operacional (Para as queries antigas)
engine_std = engines.get("Candiotto_STD")

# 3. Banco Financeiro/Relatórios
engine_fin = engines.get("DLAnalytics") 

# 4. Banco Reports
engine_reports = engines.get("Candiotto_reports")

# Validação visual no terminal
if not engine_std:
    print("⚠️  ATENÇÃO: 'engine_std' (Candiotto_STD) falhou ou não existe. O dashboard ficará zerado.")

# --- FUNÇÕES AUXILIARES ---

# --- RESOLUCAO DE ENGINE POR NOME ---
def get_engine_by_name(name: str):
    if not name:
        raise ValueError('Nome do banco obrigatorio.')

    chave = name.strip()
    if chave in engines:
        return engines[chave]

    chave_lower = chave.lower()
    for key, value in engines.items():
        if key.lower() == chave_lower:
            return value

    raise ValueError(f"Engine nao encontrada para '{name}'.")

def get_db():
    """Retorna sessão do banco principal (Painel) para o FastAPI"""
    if SessionLocal is None:
        raise Exception("Banco de dados principal não está conectado.")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()