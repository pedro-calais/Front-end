import pandas as pd
from sqlalchemy import create_engine, text

# Conexão do Banco Financeiro (192.168.1.8)
STR_ANALYTICS = "mssql+pyodbc://Rodrigo:abacaxi%40mcsa@192.168.1.8\\CANDIOTTO/DLAnalytics?driver=ODBC+Driver+17+for+SQL+Server"

print("="*50)
print("🕵️  SONDA DE COLUNAS: RelatorioBase")
print("="*50)

try:
    engine = create_engine(STR_ANALYTICS)
    with engine.connect() as conn:
        # Pega apenas 1 linha para ler os nomes das colunas
        df = pd.read_sql(text("SELECT TOP 1 * FROM RelatorioBase"), conn)
        
        print(f"\n✅ Tabela encontrada. Colunas disponíveis ({len(df.columns)}):")
        colunas_ordenadas = sorted(list(df.columns))
        
        for col in colunas_ordenadas:
            print(f"   -> {col}")

except Exception as e:
    print(f"❌ Erro ao conectar: {e}")

print("\n" + "="*50)