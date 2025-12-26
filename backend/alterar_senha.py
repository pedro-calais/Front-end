import hashlib # <--- Importante para criptografar
from database import SessionLocal
from models import User

# 1. Conectar ao Banco
session = SessionLocal()

print("--- ALTERAÇÃO DE SENHA ESPECÍFICA (COM CRIPTOGRAFIA) ---")

# 2. Definir quem estamos procurando
ALVO = "pedro.calais" 

# 3. Buscar no banco
user = session.query(User).filter(
    (User.username == ALVO) | (User.email == ALVO)
).first()

if user:
    print(f"✅ Usuário encontrado!")
    print(f"ID: {user.id}")
    print(f"Nome: {user.name}")
    print(f"Senha Atual (Banco): {user.password_hash}")
    
    # 4. Definir a nova senha
    nova_senha_texto = "12345678" 
    
    # --- CRIPTOGRAFIA (O PULO DO GATO) ---
    # Transforma "cebolinha" em um código hash seguro
    nova_senha_hash = hashlib.sha256(nova_senha_texto.encode()).hexdigest()
    
    # Atualiza com o HASH, não com o texto puro
    user.password_hash = nova_senha_hash
    
    try:
        session.commit()
        print(f"\nSUCESSO! A senha foi alterada.")
        print(f"Texto digitado: {nova_senha_texto}")
        print(f"Salvo no banco: {nova_senha_hash}")
        print("\n🚀 Pode tentar logar no site agora!")
    except Exception as e:
        session.rollback()
        print(f"\n❌ Erro ao salvar: {e}")

else:
    print(f"\n❌ ERRO: Não encontrei nenhum usuário com login ou email '{ALVO}'.")

session.close()