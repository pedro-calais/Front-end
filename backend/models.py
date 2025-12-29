from sqlalchemy import Column, Integer, String, Float, Date, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base
from sqlalchemy import Column, Integer, String, Float, Date, DateTime
from datetime import datetime

# --- ESTRUTURA ORGANIZACIONAL (Login e Equipes) ---

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    access_level = Column(String, nullable=False)
    idNegociador = Column(Integer)
    ativo = Column(Boolean, default=True)
    email = Column(String)
    last_login = Column(DateTime, nullable=True) # Data/Hora do login
    last_seen = Column(DateTime, nullable=True)  # "Visto por último" (Heartbeat)

    # Relacionamentos
    user_celulas = relationship("UserCelula", back_populates="user")
    user_campanhas = relationship("UserCampanhaAssociacao", back_populates="user")
    logs = relationship("ActivityLog", back_populates="user")

   # Propriedade calculada (Não cria coluna no banco, é lógica Python)
    @property
    def is_online(self):
        if not self.last_seen:
            return False
        # Calcula a diferença de tempo
        delta = datetime.utcnow() - self.last_seen
        # Se foi visto nos últimos 120 segundos (2 min), está online
        return delta.total_seconds() < 120

class Celula(Base):
    __tablename__ = 'celula'

    id = Column(Integer, primary_key=True, autoincrement=True)
    nome = Column(String, nullable=False)

    user_celulas = relationship("UserCelula", back_populates="celula")

class UserCelula(Base):
    __tablename__ = 'user_celula'

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    celula_id = Column(Integer, ForeignKey('celula.id'), nullable=False)
    referencia = Column(Date)

    user = relationship("User", back_populates="user_celulas")
    celula = relationship("Celula", back_populates="user_celulas")


# --- ESTRUTURA DE CAMPANHAS (Dados Financeiros) ---

class UserCampanha(Base):
    __tablename__ = 'user_campanha'

    id = Column(Integer, primary_key=True, autoincrement=True)
    credor = Column(String)
    campanha = Column(String)
    # Adicionei estes campos caso existam no banco, para evitar erro, mas são opcionais
    id_campanha = Column(String, nullable=True) 
    id_credor = Column(String, nullable=True)
    
    associacoes = relationship("UserCampanhaAssociacao", back_populates="user_campanha")

class UserCampanhaAssociacao(Base):
    __tablename__ = 'user_campanha_associacao'

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    user_campanha_id = Column(Integer, ForeignKey('user_campanha.id'), nullable=False)
    referencia = Column(Date)
    
    user = relationship("User", back_populates="user_campanhas")
    user_campanha = relationship("UserCampanha", back_populates="associacoes")
    campanha_registros = relationship("CampanhaRegistro", back_populates="user_campanha_associacao")

class CampanhaRegistro(Base):
    __tablename__ = 'campanha_registro'

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_campanha_associacao_id = Column(Integer, ForeignKey('user_campanha_associacao.id'), nullable=False)
    referencia = Column(Date) # Essencial para o filtro de Mês
    
    # Métricas Principais (Usadas no Dashboard)
    objetivo_total = Column(Float, default=0.0)      # Meta
    objetivo_realizado = Column(Float, default=0.0)  # Realizado
    faturamento_orcado = Column(Float, default=0.0)  # Usaremos como Projeção/Forecast
    
    # Campos extras do legado (Mantidos para compatibilidade se o banco exigir)
    bonus_base = Column(Float, nullable=True)
    performance_final = Column(Float, nullable=True)
    
    user_campanha_associacao = relationship("UserCampanhaAssociacao", back_populates="campanha_registros")


    # --- TABELA DE CLIENTES 

class Clientes(Base):
    __tablename__ = 'clientes'

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=True) # Deixei nullable caso não tenha dono
    nome = Column(String, nullable=False)
    documento = Column(String, nullable=False)
    campanha = Column(String, nullable=False)



class Titulo(Base):
    __tablename__ = 'titulos' # Verifique se esse é o nome real no banco
    id = Column(Integer, primary_key=True, autoincrement=True)
    cliente_id = Column(Integer, ForeignKey('clientes.id'))
    numero = Column(String)
    parcela = Column(String)
    vencimento = Column(Date)
    valor = Column(Float)
    status = Column(String) # 'ABERTO', 'PAGO'
    
    # Campos para pagos
    data_pagamento = Column(Date, nullable=True)
    valor_pago = Column(Float, nullable=True)
    credor = Column(String, nullable=True)
    data_acordo = Column(Date, nullable=True)
    negociador = Column(String, nullable=True)

class HistoricoRO(Base):
    __tablename__ = 'historico_ro' # Verifique o nome real
    id = Column(Integer, primary_key=True, autoincrement=True)
    cliente_id = Column(Integer, ForeignKey('clientes.id'))
    data = Column(Date)
    negociador = Column(String) # Quem fez
    ro = Column(String) # O que aconteceu (Ex: Régua de cobrança)
    descricao = Column(Text)

class TBAcompanhamento(Base):
    __tablename__ = 'tbacompanhamentoporstatus(inativo)'
    
    # Mapeamento exato com suas colunas SQL
    # 'name=' diz ao Python qual o nome real na tabela se quisermos usar outro nome no código,
    # mas aqui vou usar os nomes iguais para facilitar.
    
    id = Column(Integer, name='Movimentacoes_ID', primary_key=True)
    NEGOCIADOR = Column(String) # O banco tem [NEGOCIADOR]
    Status = Column(String)     # O banco tem [Status] (Mudei de STATUS para Status)
    VALOR = Column(Float)       # O banco tem [VALOR]
    Recebimento = Column(Float) # O banco tem [Recebimento]
    DATA_RECEBIMENTO = Column(Date) # O banco tem [DATA_RECEBIMENTO]


# --- LOGS DE ATIVIDADE ---
class ActivityLog(Base):
    __tablename__ = 'activity_logs'

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    
    route = Column(String(100))      # Qual tela? (ex: /dashboard)
    action = Column(String(50))      # O que fez? (ex: PAGE_VIEW, CLICK)
    duration_seconds = Column(Integer, nullable=True) # Quanto tempo ficou na tela anterior
    details = Column(String(255), nullable=True)      # Detalhes extras
    
    created_at = Column(DateTime, default=datetime.utcnow) # Hora do registro

    # Relacionamento
    user = relationship("User", back_populates="logs")