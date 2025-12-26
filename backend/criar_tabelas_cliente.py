from database import engine, SessionLocal, Base
from models import Clientes, Titulo, HistoricoRO
from sqlalchemy import text
import datetime

print("--- CRIANDO TABELAS DE DETALHES DO CLIENTE ---")

# 1. Cria as tabelas no Banco (se não existirem)
Base.metadata.create_all(bind=engine)
print("✅ Tabelas 'titulos' e 'historico_ro' verificadas/criadas.")

# 2. Inserir Dados de Teste para o Cliente ID 1 (ou ajuste para um ID que exista)
session = SessionLocal()

try:
    # Verifica se tem algum cliente, se não cria um
    cliente = session.query(Clientes).first()
    if not cliente:
        print("Criando cliente de teste...")
        cliente = Clientes(nome="Pedro Henrique Teste", documento="123.456.789-00", campanha="Direcional")
        session.add(cliente)
        session.commit()
    
    cliente_id = cliente.id
    print(f"Gerando dados para o cliente ID: {cliente_id} - {cliente.nome}")

    # Limpa dados antigos desse cliente para não duplicar
    session.query(Titulo).filter(Titulo.cliente_id == cliente_id).delete()
    session.query(HistoricoRO).filter(HistoricoRO.cliente_id == cliente_id).delete()

    # Cria Títulos em Aberto
    t1 = Titulo(
        cliente_id=cliente_id, numero="FAT-001", parcela="1/3", 
        vencimento=datetime.date(2025, 12, 10), valor=1500.00, status="ABERTO"
    )
    t2 = Titulo(
        cliente_id=cliente_id, numero="FAT-002", parcela="2/3", 
        vencimento=datetime.date(2026, 1, 10), valor=1500.00, status="ABERTO"
    )

    # Cria Títulos Pagos
    t3 = Titulo(
        cliente_id=cliente_id, numero="ANT-999", parcela="Única", 
        vencimento=datetime.date(2024, 5, 10), valor=500.00, status="PAGO",
        data_pagamento=datetime.date(2024, 5, 12), valor_pago=510.00, 
        negociador="Sistema", credor="Direcional"
    )

    # Cria Histórico
    h1 = HistoricoRO(
        cliente_id=cliente_id, data=datetime.date(2025, 12, 1),
        negociador="Ana Silva", ro="Contato Telefônico", 
        descricao="Cliente prometeu pagamento para dia 10."
    )
    h2 = HistoricoRO(
        cliente_id=cliente_id, data=datetime.date(2025, 11, 28),
        negociador="Sistema", ro="Envio de SMS", 
        descricao="SMS de cobrança enviado com sucesso."
    )

    session.add_all([t1, t2, t3, h1, h2])
    session.commit()
    print("✅ Dados financeiros e histórico inseridos com sucesso!")

except Exception as e:
    print(f"❌ Erro: {e}")
finally:
    session.close()