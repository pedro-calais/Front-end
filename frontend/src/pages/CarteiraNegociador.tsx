import  { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/api";
import {
  Loader2, Wallet, CheckCircle2, AlertCircle, 
  TrendingUp,  Target, Calculator,
  Clock, Briefcase, ArrowUpRight, ChevronDown, Bell
} from "lucide-react";

// --- 1. INTERFACE SINCRONIZADA COM O JSON DO BACKEND ---
// (Exatamente os nomes que mandamos na tarefa do Dev)
interface DashboardMetasData {
  composicao_carteira: {
    novos_acordos: number;
    a_vencer: number;
    colchao_corrente: number;
    colchao_inadimplido: number;
    total_geral: number;
  };
  realizado_caixa: {
    novos_acordos_rec: number;
    antecipado: number;
    corrente_recebido: number;
    inadimplido_rec: number;
    caixa_total: number;
  };
  meta_global: {
    atingido_valor: number;
    meta_total_valor: number;
    percentual: number;
  };
  simulador: {
    valor_escolhido: number;
    ddal_atual: number;
  };
  performance_projetada: {
    necessario: number;
    realizado: number;
    diferenca: number;
    media_diaria: number;
  };
}

const CarteiraNegociador = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DashboardMetasData | null>(null);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      // Tenta pegar o usuário do localStorage (ajuste conforme onde você salva hoje)
      const userStorage = localStorage.getItem('user');
      const user = userStorage ? JSON.parse(userStorage) : null;
      
      // Nome de fallback se não achar
      const nomeNegociador = user?.name || user?.username || "Pedro Calais";

      const response = await api.post('/negociador/dashboard-metas', {
        data_referencia: new Date().toISOString().slice(0, 7),
        negociador: nomeNegociador // <--- MANDA O NOME PRO BACKEND FILTRAR
      });
      
      setData(response.data);
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    } finally {
      setLoading(false);
    }
  };
  const money = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAFA]">
        <div className="p-4 rounded-full bg-white shadow-lg">
            <Loader2 className="w-8 h-8 text-slate-800 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 pb-24 font-sans selection:bg-slate-200">
      
      {/* HEADER GLOBAL */}
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
                <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-sm">AD</div>
            </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-8 pt-10 space-y-8">

        {/* TÍTULO E FILTRO */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-light text-slate-900 tracking-tight">Painel do Negociador</h1>
              <p className="text-sm text-slate-500 font-medium tracking-wide uppercase mt-1">Metas & Performance</p>
            </div>
            <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-full border border-slate-200 shadow-sm cursor-pointer hover:border-slate-300 transition-all group">
               <Clock className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
               <span className="text-sm font-bold text-slate-700">Dezembro 2025</span>
               <ChevronDown className="w-4 h-4 text-slate-400" />
            </div>
        </div>

        {/* 1. SEÇÃO SUPERIOR: COMPOSIÇÃO vs REALIZADO */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* ESQUERDA: Composição da Carteira */}
          <div className="bg-white rounded-[2rem] p-8 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] border border-slate-100/50">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-3 opacity-60">
              <Briefcase className="w-4 h-4" /> Composição da Carteira
            </h3>
            <div className="space-y-6 divide-y divide-slate-50">
              <ElegantRow label="Novos Acordos" value={data?.composicao_carteira.novos_acordos} icon={Wallet} />
              <ElegantRow label="A Vencer" value={data?.composicao_carteira.a_vencer} icon={Clock} />
              <ElegantRow label="Colchão Corrente" value={data?.composicao_carteira.colchao_corrente} icon={CheckCircle2} emphasized />
              <ElegantRow label="Colchão Inadimplido" value={data?.composicao_carteira.colchao_inadimplido} icon={AlertCircle} />
              
              <div className="pt-6 flex justify-between items-baseline">
                 <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Geral</span>
                 <span className="text-3xl font-black text-slate-900 tracking-tighter">
                   {money(data?.composicao_carteira.total_geral || 0)}
                 </span>
              </div>
            </div>
          </div>

          {/* DIREITA: Realizado (Caixa) */}
          <div className="bg-white rounded-[2rem] p-8 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] border border-slate-100/50 flex flex-col justify-between">
             <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-3 opacity-60">
                  <Target className="w-4 h-4" /> Realizado (Caixa)
                </h3>
                <div className="space-y-6 divide-y divide-slate-50">
                  <ElegantRow label="Novos Acordos Rec." value={data?.realizado_caixa.novos_acordos_rec} icon={Wallet} />
                  <ElegantRow label="Antecipado" value={data?.realizado_caixa.antecipado} icon={TrendingUp} />
                  <ElegantRow label="Corrente Recebido" value={data?.realizado_caixa.corrente_recebido} icon={CheckCircle2} emphasized />
                  <ElegantRow label="Inadimplido Rec." value={data?.realizado_caixa.inadimplido_rec} icon={AlertCircle} />
                </div>
             </div>
              <div className="pt-6 border-t border-slate-50 flex justify-between items-baseline mt-auto">
                 <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Caixa Total</span>
                 <span className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-2">
                    {money(data?.realizado_caixa.caixa_total || 0)}
                    <ArrowUpRight className="w-6 h-6 text-slate-400" />
                 </span>
              </div>
          </div>
        </div>

        {/* 2. META GLOBAL (HERO SECTION) */}
        <div className="bg-white rounded-[2rem] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] border border-slate-100/50 p-10">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Meta Global de Recuperação</h3>
              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-black text-slate-900 tracking-tighter">
                  {money(data?.meta_global.atingido_valor || 0)}
                </span>
                <span className="text-lg font-medium text-slate-400">
                  <span className="sr-only">meta de</span> / {money(data?.meta_global.meta_total_valor || 0)}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Atingido</div>
              <span className="text-4xl font-black text-slate-900">
                {(data?.meta_global.percentual || 0).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Barra de Progresso */}
          <div className="h-5 bg-slate-100 rounded-full overflow-hidden p-1">
            <div 
              className="h-full bg-gradient-to-r from-slate-700 to-slate-900 rounded-full transition-all duration-1000 ease-out relative"
              style={{ width: `${Math.min(data?.meta_global.percentual || 0, 100)}%` }}
            >
                <div className="absolute inset-0 bg-white/10 mix-blend-overlay"></div>
            </div>
          </div>
          
          <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400 mt-3 tracking-widest">
             <span>Início</span>
             <span>Objetivo Final</span>
          </div>
        </div>

        {/* 3. INFERIOR: SIMULADOR & PERFORMANCE */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Simulador */}
          <div className="bg-white rounded-[2rem] border border-slate-100/50 p-8 flex flex-col justify-center shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)]">
             <div className="flex items-center gap-3 mb-8 opacity-60">
               <Calculator className="w-5 h-5 text-slate-900" />
               <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Simulador</h3>
             </div>
             <div className="space-y-6">
                <MinimalMetricBox label="Valor Escolhido" value={money(data?.simulador.valor_escolhido || 0)} />
                <div className="w-full h-px bg-slate-100"></div>
                <MinimalMetricBox label="DDAL Atual" value={`${(data?.simulador.ddal_atual || 0).toFixed(2)}%`} highlightValue />
             </div>
          </div>

          {/* Performance Projetada (Horizontal) */}
          <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-100/50 p-8 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)]">
             <div className="flex items-center gap-3 mb-8 opacity-60">
               <Target className="w-5 h-5 text-slate-900" />
               <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Performance Projetada</h3>
             </div>
             
             {/* Layout horizontal conforme imagem */}
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <MinimalMetricBox label="Necessário" value={money(data?.performance_projetada.necessario || 0)} borderTop />
                <MinimalMetricBox label="Realizado" value={money(data?.performance_projetada.realizado || 0)} borderTop highlightValue />
                <MinimalMetricBox label="Diferença" value={money(data?.performance_projetada.diferenca || 0)} borderTop />
                <MinimalMetricBox label="Média Diária" value={money(data?.performance_projetada.media_diaria || 0)} borderTop />
             </div>
          </div>
        </div>

      </main>
    </div>
  );
};

// --- COMPONENTES VISUAIS (Elegantes e Simples) ---

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