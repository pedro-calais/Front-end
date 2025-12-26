import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./components/Layout/AppLayout";



// Importe suas páginas
import Index from "./pages/index";
import ComposicaoCarteira from "./pages/ComposicaoCarteira";
import NegociadorCelula from "./pages/NegociadorCelula";
import LoginPage from "./pages/LoginPage";
import ResumoAcionamentos from "./pages/ResumoAcionamentos"; 
import ConsultarCliente from "./pages/ConsultarCliente";
import AbrirChamado from "./pages/AbrirChamado";
import PagamentosPrevisoes from "./pages/PagamentosPrevisoes"; 
import PainelObjetivo from "./pages/PainelObjetivo";
import ResumoObjetivos from "./pages/ResumoObjetivo";      
import DashboardCarteira from "./pages/DashboardCarteira";
import PainelChamados from "./pages/PainelChamados";
import AcionamentosPage from "./pages/AcionamentosPage";
import PendenciasPage from './pages/PendenciasPage';
import CarteiraNegociador from "./pages/CarteiraNegociador";
import ConfigPage from "./pages/ConfigPage";
import { TelemetryProvider } from "./contexts/TelemetryContext";
import TelemetriaPage from "./pages/TelemetriaPage";
import MeusResultadosPage from "./pages/MeusResultadosPage";

// --- COMPONENTE DE PROTEÇÃO DE ROTA ---
// Atualizado para ler direto do LocalStorage (Compatível com o novo Login)
const LayoutWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Verifica se existe o usuário salvo no navegador
  const user = localStorage.getItem("user");
  
  // Se não tiver usuário, chuta pro Login
  if (!user) {
      return <Navigate to="/login" replace />;
  }

  // Se tiver, libera o layout
  return <AppLayout>{children}</AppLayout>;
};

function App() {
  return (
    <BrowserRouter>
      <TelemetryProvider>
        <Routes>
          {/* 1. Rota Pública: Login */}
          <Route path="/login" element={<LoginPage />} />

          {/* 2. Rota Principal: O Index é o "porteiro" que decide entre Admin vs Negociador */}
          <Route
            path="/"
            element={
              <LayoutWrapper>
                <Index />
              </LayoutWrapper>
            }
          />

          {/* Mantive /dashboard apontando para o Index também, por compatibilidade */}
          <Route
            path="/dashboard"
            element={
              <LayoutWrapper>
                <Index />
              </LayoutWrapper>
            }
          />

          {/* --- DEMAIS ROTAS PROTEGIDAS --- */}

          <Route
            path="/composicao-carteira"
            element={
              <LayoutWrapper>
                <ComposicaoCarteira />
              </LayoutWrapper>
            }
          />

          <Route
            path="/negociador-celula"
            element={
              <LayoutWrapper>
                <NegociadorCelula />
              </LayoutWrapper>
            }
          />
          
          <Route
            path="/resumo-acionamentos"
            element={
              <LayoutWrapper>
                <ResumoAcionamentos />
              </LayoutWrapper>
            }
          />
          
          <Route
            path="/consultar-cliente"
            element={
              <LayoutWrapper>
                <ConsultarCliente />
              </LayoutWrapper>
            }
          />

          <Route
            path="/abrir-chamado"
            element={
              <LayoutWrapper>
                <AbrirChamado />
              </LayoutWrapper>
            }
          />

          <Route
            path="/painel-chamados"
            element={
              <LayoutWrapper>
                <PainelChamados />
              </LayoutWrapper>
            }
          />

          <Route
            path="/pagamentos-previsoes"
            element={
              <LayoutWrapper>
                <PagamentosPrevisoes />
              </LayoutWrapper>
            }
          />

          <Route 
            path="/painel-objetivo" 
            element={
              <LayoutWrapper>
                <PainelObjetivo />
              </LayoutWrapper>
            } 
          />

          <Route
            path="/resumo-objetivo"
            element={
              <LayoutWrapper>
                <ResumoObjetivos />
              </LayoutWrapper>
            }
          />

          <Route
            path="/dashboard-carteira"
            element={
              <LayoutWrapper>
                <DashboardCarteira />
              </LayoutWrapper>
            }
          />    
          
          <Route
            path="/pendencias"
            element={
              <LayoutWrapper>
                <PendenciasPage />
              </LayoutWrapper>
            } 
          />    
              
          <Route
            path="/acionamentos"
            element={
              <LayoutWrapper>
                <AcionamentosPage />
              </LayoutWrapper>
            }
          />
          <Route
            path="/ConfigPage"
            element={
              <LayoutWrapper>
                <ConfigPage />
              </LayoutWrapper>
            }
          />

          <Route
            path="/meus-resultados"
            element={
              <LayoutWrapper>
                <MeusResultadosPage />
              </LayoutWrapper>
            }
          />


        
          
          {/* Rota Coringa: Qualquer endereço desconhecido vai para a Home (Index) */}
          <Route path="*" element={<Navigate to="/" replace />} />
          <Route path="/carteira-negociador" element={<CarteiraNegociador />} />
          <Route path="/monitoramento" element={<TelemetriaPage />} />
          </Routes>
        </TelemetryProvider>
      </BrowserRouter>
    );
  }

  export default App;