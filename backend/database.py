from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# --- CONFIGURAÇÃO DE CONEXÃO ---
# Esta é a string que estava no seu código antigo (Modo Produção)
CONN_STR = (
    "mssql+pyodbc://Rodrigo:abacaxi%40mcsa@192.168.1.8\\CANDIOTTO/Painel"
    "?driver=ODBC+Driver+17+for+SQL+Server"
)

# 1. Cria o Motor de Conexão (Engine)
engine = create_engine(
    CONN_STR, 
    pool_size=20, 
    max_overflow=40
)

# 2. Cria a Fábrica de Sessões
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 3. Cria a Base para os Modelos
Base = declarative_base()

# --- FUNÇÃO AUXILIAR ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()