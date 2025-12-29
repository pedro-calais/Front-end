import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/api"; 
import {
  Filter, BarChart2, ChevronDown, Briefcase, Clock,
  CheckCircle2, XCircle, Wallet, ArrowRight, Calendar, Users, Tag, Loader2
} from "lucide-react";

// --- TIPAGEM ---
interface DashboardData {
  composicao: {
    casosNovos: number;
    acordosVencer: number; // Mapeado de "Previsão"
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
}

const INITIAL_DATA: DashboardData = {
  composicao: { casosNovos: 0, acordosVencer: 0, colchaoCorrente: 0, colchaoInadimplido: 0, totalCasos: 0 },
  realizado: { novosAcordos: 0, colchaoAntecipado: 0, colchaoCorrente: 0, colchaoInadimplido: 0, caixaTotal: 0 }
};

// --- UTILITÁRIOS ---
const formatCurrency = (value: number) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

const getLast12Months = () => {
  const months = [];
  const date = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(date.getFullYear(), date.getMonth() - i, 1);
    months.push({ 
        value: d.toISOString().slice(0, 7), 
        label: d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) 
    });
  }
  return months;
};

// --- COMPONENTES AUXILIARES ---
const FilterSelect = ({ label, placeholder, icon: Icon, options, value, onChange, disabled = false }: any) => (
  <div className="flex-1 min-w-[200px]">
    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1 flex items-center gap-1.5">
      <Icon className="w-3 h-3" /> {label}
    </label>
    <div className="relative group">
      <select 
        value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}
        className="w-full appearance-none bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl py-3 pl-4 pr-10 hover:border-slate-300 focus:outline-none focus:border-blue-500 transition-all cursor-pointer shadow-sm disabled:bg-slate-50"
      >
        <option value="">{placeholder}</option>
        {options.map((opt: any) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
    </div>
  </div>
);

const StyledCard = ({ label, value, colorClass, icon: Icon }: any) => {
  const baseColor = colorClass.replace('border-', 'text-');
  const bgIconColor = colorClass.replace('border-', 'bg-').replace('500', '50').replace('600', '50').replace('400', '50');
  return (
    <div className={`bg-white rounded-xl border ${colorClass} p-4 mb-3 shadow-sm flex items-center gap-4 transition-all hover:shadow-md hover:-translate-y-0.5`}>
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${bgIconColor}`}>
        <Icon className={`w-6 h-6 ${baseColor}`} />
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{label}</span>
        <span className="text-lg md:text-xl font-black text-slate-900 tracking-tight">{value}</span>
      </div>
    </div>
  );
};

const ProgressBar = ({ label, value, color, valueText }: any) => (
  <div className="mb-6 last:mb-0">
    <div className="flex justify-between items-end mb-2">
      <span className="text-xs font-bold text-slate-600 flex items-center gap-2">
        <span className={`w-2.5 h-2.5 rounded-full ${color}`}></span>{label}
      </span>
      <span className="text-sm font-bold text-slate-900">{valueText}</span>
    </div>
    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color} transition-all duration-1000 ease-out`} style={{ width: `${value}%` }} />
    </div>
  </div>
);

const ComposicaoCarteira = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DashboardData>(INITIAL_DATA);
  const [periodo, setPeriodo] = useState(new Date().toISOString().slice(0, 7));
  const [selectedNegociador, setSelectedNegociador] = useState("");
  const [selectedCampanha, setSelectedCampanha] = useState("");
  const [listaNegociadores, setListaNegociadores] = useState<{value: string, label: string}[]>([]);
  const [listaCampanhas, setListaCampanhas] = useState<{value: string, label: string}[]>([]);
  const [listaMeses] = useState(getLast12Months());

  useEffect(() => {
    const carregarFiltros = async () => {
      try {
        const resUsers = await api.get('/users');
        setListaNegociadores(resUsers.data.map((u: any) => ({ value: u.name, label: u.name })));
        
        const resCamp = await api.get('/api/lista-campanhas');
        setListaCampanhas(resCamp.data.map((c: string) => ({ value: c, label: c })));
        
        buscarDadosDashboard();
      } catch (error) { console.error("Erro filtros", error); }
    };
    carregarFiltros();
  }, []);

  // --- LÓGICA DE PROCESSAMENTO SQL -> DASHBOARD ---
  // Transforma a lista bruta da query SQL nos totais do card da esquerda
  const processarDadosPrevistos = (listaBruta: any[]) => {
    const resumo = { ...INITIAL_DATA.composicao };
    
    if (!Array.isArray(listaBruta)) return resumo;

    listaBruta.forEach(item => {
        // A Query retorna colunas: STATUS e VALOR (ou total_original dependendo do SQL final)
        // Adaptar chaves conforme retorno exato do seu SQL
        const status = item.STATUS || item.status || ""; 
        const valor = Number(item.VALOR || item.total_original || item.valor || 0);

        resumo.totalCasos += valor;

        if (status === 'Novo') resumo.casosNovos += valor;
        else if (status === 'Previsão') resumo.acordosVencer += valor;
        else if (status === 'Corrente') resumo.colchaoCorrente += valor;
        else if (status === 'Inadimplido') resumo.colchaoInadimplido += valor;
    });

    return resumo;
  };

  const buscarDadosDashboard = async () => {
    setLoading(true);
    try {
      const filtros = {
        data_referencia: periodo,
        negociador: selectedNegociador,
        campanha: selectedCampanha
      };

      // Chamada PARALELA: Nova Rota (Previsto) + Rota Antiga (Realizado)
      const [resPrevisto, resRealizado] = await Promise.all([
        api.get('/api/composicao-carteira-prevista', { params: filtros }),
        api.post('/api/composicao-carteira', filtros)
      ]);

      // 1. Processa o lado Esquerdo (Nova Rota)
      const composicaoCalculada = processarDadosPrevistos(resPrevisto.data);

      // 2. Pega o lado Direito (Rota Antiga - assume que ela retorna 'realizado')
      const realizadoBackend = resRealizado.data?.realizado || INITIAL_DATA.realizado;

      setData({
        composicao: composicaoCalculada,
        realizado: realizadoBackend
      });

    } catch (error) {
      console.error("❌ Erro ao buscar dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const safeComposicao = data.composicao;
  const safeRealizado = data.realizado;
  const totalRecebido = safeRealizado.caixaTotal || 1; 

  // Cálculos de Porcentagem
  const pctNovos = (safeRealizado.novosAcordos / totalRecebido) * 100;
  const pctVencer = (safeRealizado.colchaoAntecipado / totalRecebido) * 100;
  const pctCorrente = (safeRealizado.colchaoCorrente / totalRecebido) * 100;
  const pctInadimplido = (safeRealizado.colchaoInadimplido / totalRecebido) * 100;

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans text-slate-900">
      {/* ... (HEADER PERMANECE IGUAL AO SEU CÓDIGO ANTERIOR) ... */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-12">
            <Link to="/" className="text-2xl font-black tracking-tighter text-slate-900 flex items-center gap-1 cursor-pointer">MCSA</Link>
            <nav className="hidden md:flex items-center gap-8">
                <Link to="/" className="text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors pb-1">Visão Geral</Link>
                <Link to="/composicao-carteira" className="text-sm font-bold text-slate-900 border-b-2 border-slate-900 pb-1">Carteira</Link>
            </nav>
        </div>
        <div className="flex items-center gap-6">
            <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-sm">AD</div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 md:px-8 py-10 pb-20">
        <div className="mb-8">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase mb-1">Composição da Carteira</h1>
            <p className="text-slate-500 font-medium text-sm">Visão analítica prevista vs realizada.</p>
        </div>

        {/* FILTROS */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-10">
            <div className="flex flex-col lg:flex-row gap-6 items-end">
                <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FilterSelect label="Período" placeholder="Selecione" icon={Calendar} options={listaMeses} value={periodo} onChange={setPeriodo} />
                    <FilterSelect label="Negociador" placeholder="Todos" icon={Users} options={listaNegociadores} value={selectedNegociador} onChange={setSelectedNegociador} />
                    <FilterSelect label="Campanha" placeholder="Todas" icon={Tag} options={listaCampanhas} value={selectedCampanha} onChange={setSelectedCampanha} />
                </div>
                <button onClick={buscarDadosDashboard} disabled={loading} className="w-full lg:w-auto px-8 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-md flex items-center justify-center gap-2 h-[46px] active:scale-[0.98] disabled:opacity-70">
                    {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Filter className="w-3 h-3" />} Aplicar Filtros
                </button>
            </div>
        </div>

        {/* GRID PRINCIPAL */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* ESQUERDA: COMPOSIÇÃO (DADOS DA NOVA ROTA) */}
            <div>
                <div className="flex items-center gap-2 mb-4 pl-1">
                    <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md"><Briefcase className="w-4 h-4" /></div>
                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide">Previsão (Carteira)</h2>
                </div>
                <div className="space-y-4">
                    <StyledCard label="Novos Casos (Previsto)" value={formatCurrency(safeComposicao.casosNovos)} colorClass="border-blue-500" icon={Briefcase} />
                    <StyledCard label="Acordos a Vencer (Previsão)" value={formatCurrency(safeComposicao.acordosVencer)} colorClass="border-amber-400" icon={Clock} />
                    <StyledCard label="Colchão Corrente (Previsto)" value={formatCurrency(safeComposicao.colchaoCorrente)} colorClass="border-emerald-500" icon={CheckCircle2} />
                    <StyledCard label="Colchão Inadimplido (Previsto)" value={formatCurrency(safeComposicao.colchaoInadimplido)} colorClass="border-red-500" icon={XCircle} />
                    <StyledCard label="Total da Carteira" value={formatCurrency(safeComposicao.totalCasos)} colorClass="border-purple-500" icon={Wallet} />
                </div>
            </div>

            {/* DIREITA: REALIZADO (DADOS DA ROTA ANTIGA) */}
            <div>
                <div className="flex items-center gap-2 mb-4 pl-1">
                    <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md"><CheckCircle2 className="w-4 h-4" /></div>
                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide">Realizado (Caixa)</h2>
                </div>
                <div className="space-y-4">
                    <StyledCard label="Novos Acordos Pagos" value={formatCurrency(safeRealizado.novosAcordos)} colorClass="border-blue-500" icon={Briefcase} />
                    <StyledCard label="Antecipados Recebidos" value={formatCurrency(safeRealizado.colchaoAntecipado)} colorClass="border-amber-400" icon={ArrowRight} />
                    <StyledCard label="Corrente Recebido" value={formatCurrency(safeRealizado.colchaoCorrente)} colorClass="border-emerald-500" icon={CheckCircle2} />
                    <StyledCard label="Inadimplido Recuperado" value={formatCurrency(safeRealizado.colchaoInadimplido)} colorClass="border-red-500" icon={XCircle} />
                    <StyledCard label="Caixa Total" value={formatCurrency(safeRealizado.caixaTotal)} colorClass="border-purple-500" icon={Wallet} />
                </div>
            </div>
        </div>

        {/* GRÁFICO (MANTIDO) */}
        <div className="mt-12 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-8">
                <BarChart2 className="w-5 h-5 text-slate-400" />
                <h3 className="text-base font-black text-slate-800 uppercase tracking-wide">Performance de Recuperação</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                <div className="space-y-2">
                    <ProgressBar label="Novos Acordos" value={pctNovos} valueText={formatCurrency(safeRealizado.novosAcordos)} color="bg-blue-500" />
                    <ProgressBar label="Acordos a Vencer" value={pctVencer} valueText={formatCurrency(safeRealizado.colchaoAntecipado)} color="bg-amber-400" />
                    <ProgressBar label="Colchão Corrente" value={pctCorrente} valueText={formatCurrency(safeRealizado.colchaoCorrente)} color="bg-emerald-500" />
                    <ProgressBar label="Colchão Inadimplido" value={pctInadimplido} valueText={formatCurrency(safeRealizado.colchaoInadimplido)} color="bg-red-500" />
                </div>
                <div className="flex flex-col items-center justify-center">
                    <div className="relative w-64 h-64 rounded-full" style={{ background: `conic-gradient(#3b82f6 0% ${pctNovos}%, #fbbf24 ${pctNovos}% ${pctNovos + pctVencer}%, #10b981 ${pctNovos + pctVencer}% ${pctNovos + pctVencer + pctCorrente}%, #ef4444 ${pctNovos + pctVencer + pctCorrente}% 100%)` }}>
                        <div className="absolute inset-4 bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Realizado</span>
                            <span className="text-3xl font-black text-slate-900 tracking-tight">
                                {new Intl.NumberFormat('pt-BR', { notation: "compact", compactDisplay: "short", style: "currency", currency: "BRL" }).format(safeRealizado.caixaTotal)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
};

export default ComposicaoCarteira;