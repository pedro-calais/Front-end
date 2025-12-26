# 📊 MCSA Dashboard - Sistema de Gestão Corporativa

> **Versão:** 1.0.0  
> **Status:** Em Produção  
> **Stack:** React (Vite) + Python (Flask) + SQL Server

## 📝 Visão Geral

O **MCSA Dashboard** é uma plataforma Full-Stack desenvolvida para otimizar a gestão de recuperação de crédito, monitoramento financeiro e controle de produtividade da equipe. O sistema centraliza dados do banco SQL Server (`DLAnalytics`), integra-se com a API do ClickUp para gestão de chamados e oferece relatórios gerenciais exportáveis.

---

## 🚀 Funcionalidades Principais

### 1. **Gestão Financeira e Carteira**
- **Dashboard de Previsões:** Comparativo em tempo real entre valores previstos (acordos) e realizados (pagamentos).
- **Composição da Carteira:** Análise de saldos, inadimplência e projeções futuras.
- **Gráficos Interativos:** Visualização temporal de receitas via *Recharts*.

### 2. **Monitoramento Operacional**
- **Acionamentos por Negociador:** Relatório detalhado de chamadas, contatos e produtividade individual.
- **Filtros Avançados:** Busca por Data, Cliente (Autocomplete), Negociador e Campanha.
- **Exportação de Dados:** Geração de relatórios em CSV/Excel para análise externa.

### 3. **Gestão de Equipe e Suporte**
- **Controle de Usuários:** CRUD completo de usuários com níveis de acesso.
- **Integração ClickUp:** Abertura automática de tickets de suporte técnico com anexo de arquivos.

---

## 🛠️ Stack Tecnológico

### **Frontend**
- **Core:** React 18, TypeScript, Vite.
- **Estilização:** Tailwind CSS.
- **Navegação:** React Router DOM.
- **Requisições:** Fetch API Nativa.
- **Componentes:** Lucide React (Ícones), Headless UI.

### **Backend**
- **Core:** Python 3.12+, Flask.
- **Banco de Dados:** SQLAlchemy, PyODBC (Driver SQL Server).
- **Análise de Dados:** Pandas (Dataframes para relatórios complexos).
- **Segurança:** Hashlib (Autenticação).

---

## 📂 Estrutura do Projeto

```text
/
├── backend/
│   ├── app.py                  # Entry Point da API
│   ├── database.py             # Conexão SQLAlchemy
│   ├── models.py               # Modelos ORM
│   └── utilities/              # Camada de Serviços (Regra de Negócio)
│       ├── financeiro_service.py
│       ├── negociador_service.py
│       └── clickup_service.py
│
└── frontend/
    ├── src/
    │   ├── pages/              # Interfaces (Acionamentos, Dashboard, etc.)
    │   ├── components/         # Cards, Modais, Layouts
    │   └── services/           # Lógica de integração com API
    ├── tailwind.config.js      # Configuração de Estilos
    └── vite.config.ts          # Configuração de Build

    
⚡ Guia de Instalação e Execução 
Pré-requisitos
Node.js (v18 ou superior)

Python (v3.12 ou superior)

Acesso à rede local do servidor SQL (192.168.1.8)

1. Configurando o Backend (API)
Bash

cd backend

# 1. Criação do Ambiente Virtual
python -m venv venv

# 2. Ativação (Windows PowerShell)
.\venv\Scripts\activate

# 3. Instalação das Dependências
pip install flask flask-cors sqlalchemy pandas pyodbc requests

# 4. Execução em Modo de Desenvolvimento
python app.py
# O servidor iniciará em http://localhost:5000
2. Configurando o Frontend (Interface)
Bash

cd frontend

# 1. Instalação das Dependências
npm install

# 2. Execução em Modo de Desenvolvimento
npm run dev
# O frontend iniciará em http://localhost:5173
📦 Build para Produção
Para ambientes de produção ("Tempos de Execução"), não utilize os servidores de desenvolvimento. Siga os passos abaixo:

Frontend (Build Estático)
Gera arquivos HTML/CSS/JS otimizados na pasta dist.

Bash

cd frontend
npm run build
O conteúdo da pasta dist deve ser servido por um servidor web (Nginx, Apache ou IIS).

Backend (WSGI Production Server)
Não utilize python app.py em produção. Utilize um servidor WSGI como Waitress (recomendado para Windows) ou Gunicorn (Linux).

Bash

# Exemplo com Waitress (Windows)
pip install waitress
waitress-serve --port=5000 app:app
⚠️ Variáveis de Ambiente e Segurança
Para segurança, recomenda-se mover as Strings de Conexão e Tokens para um arquivo .env na raiz do backend (não versionado):

Exemplo .env:

Snippet de código

DB_CONNECTION_STRING="mssql+pyodbc://Usuario:Senha@192.168.1.8\INSTANCE/DLAnalytics?driver=ODBC+Driver+17+for+SQL+Server"
CLICKUP_API_TOKEN="pk_..."
🤝 Contribuição
Realize um Fork do projeto.

Crie uma Branch para sua Feature (git checkout -b feature/NovaFeature).

Realize o Commit (git commit -m 'Add some NovaFeature').

Realize o Push (git push origin feature/NovaFeature).

Abra um Pull Request.

Desenvolvido pela Equipe de Tecnologia MCSA.


### 💡 Dicas Adicionais para "Tempos de Execução" (Produção)

1.  **Conexão Segura:** Certifique-se de que o computador onde o código vai rodar tem os **Drivers ODBC** do SQL Server instalados, senão o Python não conseguirá conectar no banco.
2.  **IP do Servidor:** No arquivo `AcionamentosPage.tsx` e outros, as requisições estão bat