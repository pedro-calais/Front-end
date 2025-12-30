import pandas as pd
from sqlalchemy import text
from database import engine  # Usamos a engine do Painel que tem o Link Server

# CPFs extraídos das suas imagens
CLIENTES_TESTE = [
    {"nome": "Pedro Alves", "cpf": "71010842498"},        # Imagem 2 (Vazio)
    {"nome": "Roberto de Andrade", "cpf": "03319177699"}, # Imagem 4 (Cheio em um, vazio no outro)
    {"nome": "Bruno Ferreira", "cpf": "88817016268"}      # Imagem 3 (Só pagos)
]

print("="*60)
print("🕵️  RAIO-X: VERIFICANDO A TABELA MÁGICA [tabelatitulos]")
print("="*60)

try:
    with engine.connect() as conn:
        
        for cli in CLIENTES_TESTE:
            cpf_limpo = cli['cpf']
            # Cria versão formatada (XXX.XXX.XXX-XX) caso o banco use assim
            cpf_formatado = f"{cpf_limpo[:3]}.{cpf_limpo[3:6]}.{cpf_limpo[6:9]}-{cpf_limpo[9:]}"
            
            print(f"\n👤 Analisando: {cli['nome']}")
            print(f"   CPFs testados: {cpf_limpo} | {cpf_formatado}")
            
            # Busca na tabela do Candiotto_DBA
            sql = text("""
                SELECT 
                    NUMERO_CONTRATO, 
                    PARCELA, 
                    VENCIMENTO, 
                    [VALOR ORIGINAL] as VALOR, 
                    VALOR_PAGO,
                    STATUS_TITULO
                FROM [Candiotto_DBA].[dbo].[tabelatitulos]
                WHERE CPF_CNPJ_CLIENTE = :cpf1 OR CPF_CNPJ_CLIENTE = :cpf2
                ORDER BY VENCIMENTO DESC
            """)
            
            df = pd.read_sql(sql, conn, params={"cpf1": cpf_limpo, "cpf2": cpf_formatado})
            
            if not df.empty:
                print(f"   ✅ SUCESSO! Encontrados {len(df)} registros nesta tabela.")
                
                # Resumo do que achou
                abertos = df[ (df['VALOR_PAGO'].isnull()) | (df['VALOR_PAGO'] == 0) ]
                pagos = df[ df['VALOR_PAGO'] > 0 ]
                
                print(f"      📂 Abertos: {len(abertos)}")
                print(f"      💰 Pagos:   {len(pagos)}")
                print(f"      📝 Status encontrados: {df['STATUS_TITULO'].unique()}")
                
                # Mostra amostra
                print("\n   📊 Amostra de Dados:")
                print(df.head(3).to_string(index=False))
            else:
                print("   ❌ NADA ENCONTRADO. A tabela 'tabelatitulos' não tem dados para este CPF.")
                print("   👉 Conclusão: Se nem pelo CPF acha, o problema é na VIEW do banco de dados.")

except Exception as e:
    print(f"\n❌ ERRO DE CONEXÃO: {e}")
    print("Verifique se o Link Server [Candiotto_DBA] está acessível.")

print("\n" + "="*60)