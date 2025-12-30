import pandas as pd
from sqlalchemy import text
from database import engine_std  # Usando a conexão do servidor STD2016

print("="*60)
print("🕵️  RAIO-X: MAPEAMENTO DE CLIENTES E CAMPANHAS (STD)")
print("="*60)

try:
    with engine_std.connect() as conn:
        
        # --- 1. INVESTIGAR TABELA DE PESSOAS (Para achar o ID e Documento) ---
        print("\n1️⃣  Analisando tabela [Pessoas]...")
        try:
            # Pega as 3 primeiras linhas para vermos os nomes das colunas e o formato dos dados
            df_pessoas = pd.read_sql(text("SELECT TOP 3 * FROM Pessoas"), conn)
            
            if not df_pessoas.empty:
                cols = list(df_pessoas.columns)
                print(f"   📋 Colunas encontradas: {cols}")
                
                # Tenta identificar as colunas chave automaticamente para te ajudar
                col_id = [c for c in cols if 'ID' in c.upper() and 'PESSOA' in c.upper()]
                col_doc = [c for c in cols if 'DOC' in c.upper() or 'CPF' in c.upper() or 'CGC' in c.upper()]
                
                print(f"   👉 Possível Coluna de ID: {col_id}")
                print(f"   👉 Possível Coluna de CPF/CNPJ: {col_doc}")
                print(f"   📊 Amostra de dados:\n{df_pessoas.head(1).to_string(index=False)}")
            else:
                print("   ⚠️ Tabela Pessoas existe mas está vazia.")
        except Exception as e:
            print(f"   ❌ Erro ao ler Pessoas: {e}")

        
        # --- 2. INVESTIGAR TABELA DE CAMPANHAS (Para achar o ID numérico) ---
        print("\n2️⃣  Analisando tabela [Campanhas]...")
        try:
            # Busca campanhas para ver se o ID é 47, 45, etc.
            df_camp = pd.read_sql(text("SELECT TOP 10 * FROM Campanhas"), conn)
            
            if not df_camp.empty:
                print(f"   📋 Colunas: {list(df_camp.columns)}")
                print(f"   📊 Amostra (IDs vs Nomes):")
                # Mostra colunas que parecem ID e Nome
                print(df_camp.head(10).to_string(index=False))
            else:
                print("   ⚠️ Tabela Campanhas vazia ou com nome diferente.")
                
        except Exception as e:
            print(f"   ❌ Erro ao ler Campanhas: {e}")


        # --- 3. TENTATIVA DE CRUZAMENTO (SIMULAÇÃO) ---
        print("\n3️⃣  Simulação de Cruzamento (Movimentacoes)")
        try:
            # Vamos pegar uma movimentação qualquer e ver como ela liga Pessoa e Campanha
            sql_cross = text("""
                SELECT TOP 1 
                    MoInadimplentesID, 
                    MoCampanhasID,
                    MoNumeroDocumento
                FROM Movimentacoes
            """)
            df_cross = pd.read_sql(sql_cross, conn)
            print("   Se conseguirmos ler Movimentacoes, a ligação é feita assim:")
            print(df_cross.to_string(index=False))
            
        except Exception as e:
            print(f"   ❌ Erro ao ler Movimentacoes: {e}")

except Exception as e:
    print(f"\n❌ ERRO CRÍTICO DE CONEXÃO: {e}")
    print("Verifique se o engine_std está configurado corretamente no database.py")

print("\n" + "="*60)