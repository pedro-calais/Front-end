# Dashboard Administrativo (React + Flask)

## Visao Geral
Plataforma de monitoramento operacional para equipes com foco em:

- Indicadores financeiros e composicao de carteira
- Monitoramento de equipes e telemetria de atividade
- Gestao e abertura de chamados (integracao ClickUp)
- Indicadores financeiros e composicao de carteira
- Login e segregacao de acessos (admin x negociador)

## Tech Stack
Frontend
- React 19 + TypeScript
- Vite
- Tailwind CSS
- React Router
- Zustand
- Axios
- Lucide React (icons)
- Recharts
- Framer Motion

Backend
- Python 3.x
- Flask + Flask-CORS
- SQLAlchemy
- SQL Server (pyodbc)
- Pandas (suporte a consultas/analises)
- Requests (integracoes externas)

## Estrutura do Projeto
```
.
├─ backend/                      # API Flask
│  ├─ app.py                     # Entry point e rotas principais
│  ├─ database.py                # Conexao SQL Server e session factory
│  ├─ models.py                  # Modelos SQLAlchemy
│  ├─ routes/
│  │  └─ rotas_telemetria.py      # Blueprint de telemetria
│  ├─ utilities/                 # Servicos de dominio
│  │  ├─ clickup_service.py       # Integracao ClickUp (chamados/roadmap)
│  │  ├─ carteira_service.py      # Indicadores de carteira
│  │  ├─ financeiro_service.py    # Consultas financeiras
│  │  └─ negociador_service.py    # Resumos por negociador/celula
│  └─ venv/                       # Ambiente virtual (local)
├─ frontend/                     # App React
│  ├─ index.html
│  ├─ vite.config.ts
│  ├─ package.json
│  ├─ public/                    # Assets estaticos
│  └─ src/
│     ├─ api/                    # Configuracao axios
│     ├─ assets/                 # Imagens e SVGs
│     ├─ components/             # Componentes reutilizaveis
│     ├─ contexts/               # Contextos (telemetria/tema)
│     ├─ data/                   # Dados estaticos
│     ├─ hooks/                  # Hooks customizados
│     ├─ pages/                  # Telas/rotas
│     ├─ services/               # Camada de servicos API
│     ├─ store/                  # Zustand store
│     ├─ types/                  # Tipagens
│     └─ App.tsx                 # Rotas da aplicacao
└─ README.md
```

## Funcionalidades Principais
- Login e controle de acesso (admin x negociador)
- Telemetria de uso (heartbeat, logs de rotas, usuarios online)
- Abertura de chamados com anexos e integracao ClickUp
- Painel de chamados e Roadmap (ClickUp)
- Composicao de carteira, metas e indicadores financeiros
- Acionamentos por negociador + exportacao CSV
- Consulta de cliente com titulos e historico

## Guia de Instalacao Rapida

### Backend
1) Entre na pasta:
```
cd backend
```
2) (Opcional) Ative seu venv e instale dependencias.
3) Rode o servidor:
```
python app.py
```
Servidor inicia em `http://localhost:5000`.

Observacao: ajuste a string de conexao em `backend/database.py` e os tokens/IDs do ClickUp em `backend/app.py` e `backend/utilities/clickup_service.py`.

### Frontend
1) Entre na pasta:
```
cd frontend
```
2) Instale dependencias:
```
npm install
```
3) Rode o dev server:
```
npm run dev
```
Vite inicia por padrao em `http://localhost:5173`.
