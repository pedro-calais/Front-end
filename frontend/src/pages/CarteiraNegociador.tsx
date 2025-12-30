import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/api";
import {
  Loader2, Wallet, CheckCircle2, AlertCircle, 
  TrendingUp,  Target, Calculator,
  Clock, Briefcase, ArrowUpRight, ChevronDown, Bell
} from "lucide-react";

// --- 1. INTERFACE SINCRONIZADA COM O BACKEND ---
interface DashboardMetasData {
  // O Python retorna exatamente estas chaves agora:
  composicao: {
    casosNovos: number;
    acordosVencer: number;
    colchaoCorrente: number;
    colchaoInadimplido: number;
    totalCasos: number;
  };
  realizado: {
    novosAcordos: number;
    colchaoAntecipado: number;
    colchaoCorrente: number;
    colchaoInadimplido: number;
    caixaTotal: number;
  };
  // Campos opcionais (futuros)
  meta_global?: {
    atingido_valor: number;
    meta_total_valor: number;
    percentual: number;
  };
  simulador?: {
    valor_escolhido: number;
    ddal_atual: number;
  };
  performance_projetada?: {
    necessario: number;
    realizado: number;
    diferenca: number;
    media_diaria: number;
  };
}

const CarteiraNegociador = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardMetasData | null>(null);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      // 1. RECUPERA USUÁRIO DO LOGIN
      const userStorage = localStorage.getItem('user');
      
      if (!userStorage) {
        navigate('/login'); // Se não tiver logado, manda pro login
        return;
      }

      const user = JSON.parse(userStorage);
      const nomeNegociador = user.name || user.nome || user.username;

      if (!nomeNegociador) {
        navigate('/login');
        return;
      }

      setUserName(nomeNegociador);

      // 2. DEFINE DATA (Mês Atual no formato YYYY-MM)
      const hoje = new Date();
      const ano = hoje.getFullYear();
      const mes = String(hoje.getMonth() + 1).padStart(2, '0');
      const referencia = `${ano}-${mes}`;

      // 3. CHAMADA API CORRIGIDA 
      // Mudamos para a rota que testamos e sabemos que funciona!
      const response = await api.post('/api/composicao-carteira', {
        data_referencia: referencia,
        negociador: nomeNegociador 
      });
      
      console.log("✅ Dados recebidos do Backend:", response.data);
      setData(response.data);

    } catch (error) {
      console.error("❌ Erro ao carregar dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  // Formatador de Moeda
  const money = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAFA]">
        <div className="p-4 rounded-full bg-white shadow-lg">
            <Loader2 className="w-8 h-8 text-slate-800 animate-spin" />
        </div>
        <p className="mt-4 text-sm text-slate-400 font-medium animate-pulse">Sincronizando carteira...</p>
      </div>
    );
  }

  // Fallbacks para evitar tela branca se vier vazio
  const composicao = data?.composicao || { casosNovos: 0, acordosVencer: 0, colchaoCorrente: 0, colchaoInadimplido: 0, totalCasos: 0 };
  const realizado = data?.realizado || { novosAcordos: 0, colchaoAntecipado: 0, colchaoCorrente: 0, colchaoInadimplido: 0, caixaTotal: 0 };
  
  // Mocks para dados que ainda não vem do banco (Meta/Simulador)
  const meta = data?.meta_global || { atingido_valor: realizado.caixaTotal, meta_total_valor: 150000, percentual: (realizado.caixaTotal / 150000) * 100 };
  const simulador = data?.simulador || { valor_escolhido: 0, ddal_atual: 0 };
  const performance = data?.performance_projetada || { necessario: 0, realizado: realizado.caixaTotal, diferenca: 0, media_diaria: 0 };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 pb-24 font-sans selection:bg-slate-200">
      
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-12">
            <Link to="/" className="text-2xl font-black tracking-tighter text-slate-900 flex items-center gap-1 cursor-pointer">MCSA</Link>
            <nav className="hidden md:flex items-center gap-8">
                <Link to="/" className="text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors pb-1">Visão Geral</Link>
                <Link to="/minha-carteira" className="text-sm font-bold text-slate-900 border-b-2 border-slate-900 pb-1">Minha Carteira</Link>
            </nav>
        </div>
        <div className="flex items-center gap-6">
            <button className="text-slate-400 hover:text-slate-900 transition-colors relative"><Bell className="w-5 h-5" /></button>
            <div className="w-px h-8 bg-slate-100"></div>
            <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                    <p className="text-xs font-bold text-slate-900">{userName}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Negociador</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                    {userName.slice(0, 2).toUpperCase()}
                </div>
            </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-8 pt-10 space-y-8">

        {/* TÍTULO E FILTRO DE MÊS */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-light text-slate-900 tracking-tight">Painel do Negociador</h1>
              <p className="text-sm text-slate-500 font-medium tracking-wide uppercase mt-1">
                  Performance de {userName.split(' ')[0]}
              </p>
            </div>
            <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-full border border-slate-200 shadow-sm cursor-pointer hover:border-slate-300 transition-all group">
               <Clock className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
               <span className="text-sm font-bold text-slate-700 capitalize">
                 {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
               </span>
               <ChevronDown className="w-4 h-4 text-slate-400" />
            </div>
        </div>

        {/* 1. SEÇÃO SUPERIOR: CARTEIRA vs REALIZADO */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           
           {/* ESQUERDA: Carteira (O que tem pra cobrar) */}
           <div className="bg-white rounded-[2rem] p-8 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] border border-slate-100/50">
             <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-3 opacity-60">
               <Briefcase className="w-4 h-4" /> Composição da Carteira
             </h3>
             <div className="space-y-6 divide-y divide-slate-50">
               {/* Usando os nomes corrigidos (camelCase) */}
               <ElegantRow label="Novos Acordos" value={composicao.casosNovos} icon={Wallet} />
               <ElegantRow label="A Vencer" value={composicao.acordosVencer} icon={Clock} />
               <ElegantRow label="Colchão Corrente" value={composicao.colchaoCorrente} icon={CheckCircle2} emphasized />
               <ElegantRow label="Colchão Inadimplido" value={composicao.colchaoInadimplido} icon={AlertCircle} />
               
               <div className="pt-6 flex justify-between items-baseline">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Geral</span>
                  <span className="text-3xl font-black text-slate-900 tracking-tighter">
                    {money(composicao.totalCasos)}
                  </span>
               </div>
             </div>
           </div>

           {/* DIREITA: Realizado (O que entrou no Caixa) */}
           <div className="bg-white rounded-[2rem] p-8 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] border border-slate-100/50 flex flex-col justify-between">
              <div>
                 <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-3 opacity-60">
                   <Target className="w-4 h-4" /> Realizado (Caixa)
                 </h3>
                 <div className="space-y-6 divide-y divide-slate-50">
                   <ElegantRow label="Novos Acordos Rec." value={realizado.novosAcordos} icon={Wallet} />
                   <ElegantRow label="Antecipado" value={realizado.colchaoAntecipado} icon={TrendingUp} />
                   <ElegantRow label="Corrente Recebido" value={realizado.colchaoCorrente} icon={CheckCircle2} emphasized />
                   <ElegantRow label="Inadimplido Rec." value={realizado.colchaoInadimplido} icon={AlertCircle} />
                 </div>
              </div>
              <div className="pt-6 border-t border-slate-50 flex justify-between items-baseline mt-auto">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Caixa Total</span>
                  <span className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-2">
                     {money(realizado.caixaTotal)}
                     <ArrowUpRight className="w-6 h-6 text-slate-400" />
                  </span>
              </div>
           </div>
        </div>

        {/* 2. META GLOBAL (Dados Simulados por enquanto) */}
        <div className="bg-white rounded-[2rem] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] border border-slate-100/50 p-10">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Meta Global de Recuperação</h3>
              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-black text-slate-900 tracking-tighter">
                  {money(meta.atingido_valor)}
                </span>
                <span className="text-lg font-medium text-slate-400">
                  <span className="sr-only">meta de</span> / {money(meta.meta_total_valor)}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Atingido</div>
              <span className="text-4xl font-black text-slate-900">
                {(meta.percentual).toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="h-5 bg-slate-100 rounded-full overflow-hidden p-1">
            <div 
              className="h-full bg-gradient-to-r from-slate-700 to-slate-900 rounded-full transition-all duration-1000 ease-out relative"
              style={{ width: `${Math.min(meta.percentual, 100)}%` }}
            >
                <div className="absolute inset-0 bg-white/10 mix-blend-overlay"></div>
            </div>
          </div>
        </div>

        {/* 3. SIMULADOR & PERFORMANCE */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white rounded-[2rem] border border-slate-100/50 p-8 flex flex-col justify-center shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)]">
             <div className="flex items-center gap-3 mb-8 opacity-60">
               <Calculator className="w-5 h-5 text-slate-900" />
               <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Simulador</h3>
             </div>
             <div className="space-y-6">
                <MinimalMetricBox label="Valor Escolhido" value={money(simulador.valor_escolhido)} />
                <div className="w-full h-px bg-slate-100"></div>
                <MinimalMetricBox label="DDAL Atual" value={`${(simulador.ddal_atual).toFixed(2)}%`} highlightValue />
             </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-100/50 p-8 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)]">
             <div className="flex items-center gap-3 mb-8 opacity-60">
               <Target className="w-5 h-5 text-slate-900" />
               <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Performance Projetada</h3>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <MinimalMetricBox label="Necessário" value={money(performance.necessario)} borderTop />
                <MinimalMetricBox label="Realizado" value={money(performance.realizado)} borderTop highlightValue />
                <MinimalMetricBox label="Diferença" value={money(performance.diferenca)} borderTop />
                <MinimalMetricBox label="Média Diária" value={money(performance.media_diaria)} borderTop />
             </div>
          </div>
        </div>

      </main>
    </div>
  );
};

// --- COMPONENTES VISUAIS AUXILIARES ---
const ElegantRow = ({ label, value, icon: Icon, emphasized }: any) => {
  const money = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  return (
    <div className={`flex items-center justify-between py-2 ${emphasized ? 'py-3' : ''}`}>
      <div className="flex items-center gap-4">
        <Icon className={`w-5 h-5 ${emphasized ? 'text-slate-700' : 'text-slate-400'}`} strokeWidth={1.5} />
        <span className={`text-[11px] font-bold uppercase tracking-widest ${emphasized ? 'text-slate-900' : 'text-slate-500'}`}>{label}</span>
      </div>
      <span className={`font-black tracking-tight ${emphasized ? 'text-2xl text-slate-900' : 'text-lg text-slate-700'}`}>
        {money(value)}
      </span>
    </div>
  );
};

const MinimalMetricBox = ({ label, value, borderTop, highlightValue }: any) => {
  return (
    <div className={`flex flex-col justify-between h-28 p-4 ${borderTop ? 'border-t-2 border-slate-900 pt-6' : 'bg-slate-50 rounded-2xl'}`}>
       <span className="text-[10px] font-bold text-slate-500 uppercase leading-tight tracking-widest">{label}</span>
       <span className={`text-xl font-black tracking-tight ${highlightValue ? 'text-slate-900' : 'text-slate-700'}`}>{value}</span>
    </div>
  );
};

export default CarteiraNegociador;