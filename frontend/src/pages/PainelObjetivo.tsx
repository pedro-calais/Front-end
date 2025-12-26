import React, { useState, useEffect } from "react";
import { 
  LifeBuoy, 
  Filter, 
  Calendar, 
  Download,
  Search,
  ChevronDown,
  Wallet,
  TrendingUp,
  DollarSign,
  PieChart,
  AlertCircle,
  Clock,
  ArrowUpRight,
  Landmark,
  Target,
  Check, 
  X
} from "lucide-react";

// Função para converter chaves de snake_case para camelCase recursivamente
function toCamelDeep(input: any): any {
  if (Array.isArray(input)) {
    return input.map(toCamelDeep);
  }
  if (input !== null && typeof input === "object") {
    const result: any = {};
    Object.keys(input).forEach((key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
      result[camelKey] = toCamelDeep((input as any)[key]);
    });
    return result;
  }
  return input;
}

// --- DADOS INICIAIS (ZERADOS) ---
const INITIAL_DATA = {
  caixa: { escolhido: 0, recebido: 0, previsao: 0, projecao: 0, tempoIncorrido: 0, honorarios: 0, recebidoNovo: 0, recebidoInadimplido: 0, recebidoCorrente: 0, recebidoAntecipado: 0 },
  colchaoCorrente: { total: 0, objetivoPct: 0, realizadoPct: 0, aVencer: 0, vencidoAteData: 0, recebido: 0, naoRealizado: 0 },
  colchaoInadimplido: { total: 0, objetivoPct: 0, realizadoPct: 0, recuperado: 0, naoRecuperado: 0 },
  parcelas: { aVencerProxMes: 0, antecipadas: 0 }
};

// --- COMPONENTES VISUAIS ---

const StatRow = ({ label, value, icon: Icon, colorClass = "bg-slate-100 text-slate-600", isMoney = true, subtext = "" }: any) => {
  const displayValue = typeof value === 'number' ? value : 0;
  return (
    <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-all duration-200 group">
        <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorClass} group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="w-4 h-4" />
        </div>
        <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
            {subtext && <p className="text-[10px] text-slate-400 font-medium">{subtext}</p>}
        </div>
        </div>
        <div className="text-right">
        <p className="text-sm font-bold text-slate-800 tracking-tight">
            {isMoney ? `R$ ${displayValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : `${displayValue.toFixed(2)}%`}
        </p>
        </div>
    </div>
  );
};

const HighlightCard = ({ title, value, icon: Icon, gradient }: any) => {
    const displayValue = typeof value === 'number' ? value : 0;
    return (
        <div className={`relative overflow-hidden p-6 rounded-2xl ${gradient} text-white shadow-lg mb-4`}>
            <div className="absolute top-0 right-0 p-4 opacity-10"><Icon className="w-24 h-24" /></div>
            <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">{title}</p>
            <h2 className="text-3xl font-black tracking-tight">R$ {displayValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
            </div>
        </div>
    );
};

const ModernGauge = ({ title, meta, realizado }: any) => {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const safeRealizado = typeof realizado === 'number' ? realizado : 0; 
  const strokeDashoffset = circumference - (Math.min(safeRealizado, 100) / 100) * circumference;
  
  return (
    <div className="bg-slate-50 rounded-2xl p-5 mb-4 relative overflow-hidden border border-slate-100">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase mb-1">{title}</p>
          <div className="flex items-baseline gap-1">
             <span className="text-2xl font-black text-slate-800">{safeRealizado}%</span>
             <span className="text-xs text-slate-400 font-medium">Realizado</span>
          </div>
          <p className="text-xs text-emerald-600 font-bold mt-1 bg-emerald-50 inline-block px-2 py-0.5 rounded-full">Meta: {meta}%</p>
        </div>
        <div className="relative w-16 h-16">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 70 70">
            <circle cx="35" cy="35" r={radius} stroke="#e2e8f0" strokeWidth="6" fill="transparent" />
            <circle cx="35" cy="35" r={radius} stroke="#3b82f6" strokeWidth="6" fill="transparent" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---

const PainelObjetivo = () => {
  const [data, setData] = useState(INITIAL_DATA);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);

  // Estados dos Filtros
  const [opcoesNegociadores, setOpcoesNegociadores] = useState<any[]>([]);
  const [mapaCredores, setMapaCredores] = useState<Record<string, string[]>>({});
  const [opcoesCampanhas, setOpcoesCampanhas] = useState<string[]>([]);

  const [filters, setFilters] = useState({
    negociador: '',
    data_inicio: '2025-12-01',
    data_fim: '2025-12-31',
    credor: '',
    campanha: '',
    celula: ''
  });

  // 1. BUSCAR OPÇÕES
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await fetch("http://localhost:5000/painel-objetivo/opcoes");
        if (response.ok) {
          const result = await response.json();
          // Normaliza para camelCase caso venha snake_case
          const camelResult = toCamelDeep(result);
          setOpcoesNegociadores(camelResult.negociadores || []);
          setMapaCredores(camelResult.credoresCampanhas || camelResult.estruturaCredores || {});
        }
      } catch (error) {
        console.error("Erro ao carregar filtros:", error);
      } finally {
        setIsLoadingOptions(false);
      }
    };
    fetchOptions();
    fetchDashboardData(); 
  }, []);

  // 2. Lógica de Filtros
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'credor') {
        setFilters(prev => ({ ...prev, credor: value, campanha: '' }));
        if (value && mapaCredores[value]) {
            setOpcoesCampanhas(mapaCredores[value]);
        } else {
            setOpcoesCampanhas([]);
        }
    } else {
        setFilters(prev => ({ ...prev, [name]: value }));
    }
  };

  // 3. BUSCAR DADOS DO DASHBOARD
  const fetchDashboardData = async () => {
    setIsLoadingData(true);
    try {
      const response = await fetch("http://localhost:5000/painel-objetivo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filters)
      });

      if (response.ok) {
        const rawData = await response.json();
        console.log("Dados Brutos do Backend:", rawData);

        // Normaliza as chaves para camelCase
        const camelData = toCamelDeep(rawData);
        console.log("Dados Normalizados:", camelData);

        // Atualiza o estado garantindo a estrutura
        setData(prev => ({
            ...prev,
            ...camelData, // Sobrescreve com os dados novos
            caixa: { ...prev.caixa, ...camelData.caixa },
            colchaoCorrente: { ...prev.colchaoCorrente, ...camelData.colchaoCorrente },
            colchaoInadimplido: { ...prev.colchaoInadimplido, ...camelData.colchaoInadimplido },
            parcelas: { ...prev.parcelas, ...camelData.parcelas }
        }));
      } else {
        console.error("Erro na resposta da API:", response.status);
      }
    } catch (error) {
      console.error("Erro de conexão:", error);
    } finally {
      setIsLoadingData(false);
    }
  };

  // --- RENDERIZAÇÃO ---
  // Usa "data" diretamente, pois ele já foi atualizado e normalizado
  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-900">
      
      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-3xl opacity-50 -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-100/40 rounded-full blur-3xl opacity-50 translate-x-1/2 -translate-y-1/2"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-12">
            <div className="text-2xl font-black tracking-tighter text-slate-900 flex items-center gap-1 cursor-pointer">MCSA</div>
            <nav className="hidden md:flex items-center gap-8">
                <a href="/dashboard" className="text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors">Visão Geral</a>
                <a href="#" className="text-sm font-bold text-slate-900 border-b-2 border-slate-900 pb-1">Painel Objetivo</a>
            </nav>
        </div>
        <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 cursor-pointer group">
                <div className="text-right hidden sm:block"><p className="text-sm font-bold text-slate-900 leading-none">Admin</p><p className="text-[10px] text-slate-400 uppercase tracking-wide group-hover:text-slate-900 transition-colors">Gestor</p></div>
                <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-sm shadow-slate-300">AD</div>
            </div>
        </div>
      </header>

      <main className="relative z-10 p-6 md:p-8 max-w-[1600px] mx-auto pb-20">
        
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Painel de Objetivo</h1>
            <p className="text-slate-500 font-medium">Análise detalhada de performance e projeções.</p>
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all">
              <Download className="w-4 h-4" /> Exportar Excel
          </button>
        </div>

        {/* --- FILTROS --- */}
        <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100 mb-10">
            {isLoadingOptions ? (
                <div className="text-center py-4 text-slate-400 text-sm">Carregando filtros...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    
                    <div className="lg:col-span-2 space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Negociadores</label>
                        <div className="relative group">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                            <select name="negociador" value={filters.negociador} onChange={handleFilterChange} className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-sm rounded-xl pl-10 pr-4 py-3 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer font-medium">
                                <option value="">Todos os negociadores</option>
                                {opcoesNegociadores.map((neg, idx) => (
                                    <option key={idx} value={neg.value}>{neg.label}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Data Início</label>
                        <div className="relative group">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                            <input type="date" name="data_inicio" value={filters.data_inicio} onChange={handleFilterChange} className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-sm rounded-xl pl-10 pr-2 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium" />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Data Fim</label>
                        <div className="relative group">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                            <input type="date" name="data_fim" value={filters.data_fim} onChange={handleFilterChange} className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-sm rounded-xl pl-10 pr-2 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium" />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Credores</label>
                        <div className="relative">
                            <select name="credor" value={filters.credor} onChange={handleFilterChange} className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-sm rounded-xl pl-3 pr-8 py-3 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium">
                                <option value="">Todos</option>
                                {Object.keys(mapaCredores).map((credor) => (
                                    <option key={credor} value={credor}>{credor}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Campanha</label>
                        <div className="relative">
                            <select name="campanha" value={filters.campanha} onChange={handleFilterChange} disabled={!filters.credor} className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-sm rounded-xl pl-3 pr-8 py-3 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                                <option value="">Todas</option>
                                {opcoesCampanhas.map((campanha) => (
                                    <option key={campanha} value={campanha}>{campanha}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                    
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Ação</label>
                        <button onClick={fetchDashboardData} disabled={isLoadingData} className="w-full h-[46px] bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2 disabled:opacity-70">
                            {isLoadingData ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"/> : <Search className="w-4 h-4" />} 
                            {isLoadingData ? 'Filtrando...' : 'Filtrar'}
                        </button>
                    </div>
                </div>
            )}
        </div>

        {/* --- GRID DE RESULTADOS --- */}
        <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8 transition-opacity duration-500 ${isLoadingData ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>

            {/* COLUNA 1 */}
            <div className="flex flex-col gap-6">
                <HighlightCard title="Caixa Escolhido" value={data.caixa.escolhido} icon={Wallet} gradient="bg-gradient-to-br from-blue-600 to-indigo-700" />
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 space-y-1">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide mb-4 pl-1 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blue-600" /> Métricas de Caixa</h3>
                    <StatRow label="Caixa Recebido" value={data.caixa.recebido} icon={DollarSign} colorClass="bg-emerald-50 text-emerald-600" />
                    <StatRow label="Previsão" value={data.caixa.previsao} icon={PieChart} colorClass="bg-violet-50 text-violet-600" />
                    <StatRow label="Projeção" value={data.caixa.projecao} icon={Target} colorClass="bg-blue-50 text-blue-600" />
                    <StatRow label="Honorários Sucumbência" value={data.caixa.honorarios} icon={Landmark} colorClass="bg-amber-50 text-amber-600" />
                    <div className="my-4 border-t border-slate-100"></div>
                    <StatRow label="Tempo Incorrido" value={data.caixa.tempoIncorrido} isMoney={false} icon={Clock} colorClass="bg-slate-100 text-slate-600" />
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 space-y-1">
                     <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide mb-4 pl-1">Detalhamento</h3>
                     <StatRow label="Recebido Novo" value={data.caixa.recebidoNovo} icon={ArrowUpRight} />
                     <StatRow label="Recebido Inadimplido" value={data.caixa.recebidoInadimplido} icon={AlertCircle} colorClass="bg-orange-50 text-orange-500" />
                     <StatRow label="Recebido Corrente" value={data.caixa.recebidoCorrente} icon={Check} colorClass="bg-green-50 text-green-500" />
                     <StatRow label="Parc. Antecipadas" value={data.caixa.recebidoAntecipado} icon={Calendar} />
                </div>
            </div>

            {/* COLUNA 2 */}
            <div className="flex flex-col gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 h-full">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide mb-6 pl-1 flex items-center gap-2"><Target className="w-4 h-4 text-emerald-600" /> Performance Corrente</h3>
                    <ModernGauge title="Colchão Corrente Total" meta={data.colchaoCorrente.objetivoPct} realizado={data.colchaoCorrente.realizadoPct} />
                    <div className="space-y-1 mt-6">
                         <StatRow label="A Vencer" value={data.colchaoCorrente.aVencer} icon={Clock} subtext="0 Clientes" />
                         <StatRow label="Vencido até hoje" value={data.colchaoCorrente.vencidoAteData} icon={AlertCircle} colorClass="bg-red-50 text-red-500" subtext="0 Clientes" />
                         <StatRow label="Recebido" value={data.colchaoCorrente.recebido} icon={Check} colorClass="bg-emerald-50 text-emerald-600" subtext="0 Clientes" />
                         <StatRow label="Não Realizado" value={data.colchaoCorrente.naoRealizado} icon={X} colorClass="bg-slate-100 text-slate-400" subtext="0 Clientes" />
                    </div>
                    <div className="mt-8 pt-6 border-t border-slate-100">
                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-4">Projeção Futura</h4>
                        <StatRow label="Vencer Próx. Mês" value={data.parcelas.aVencerProxMes} icon={Calendar} subtext="0 Clientes" />
                        <StatRow label="Antecipadas" value={data.parcelas.antecipadas} icon={ArrowUpRight} subtext="92 Clientes" />
                    </div>
                </div>
            </div>

            {/* COLUNA 3 */}
            <div className="flex flex-col gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 h-full">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide mb-6 pl-1 flex items-center gap-2"><AlertCircle className="w-4 h-4 text-orange-500" /> Performance Inadimplido</h3>
                    <ModernGauge title="Colchão Inadimplido Total" meta={data.colchaoInadimplido.objetivoPct} realizado={data.colchaoInadimplido.realizadoPct} />
                    <div className="bg-slate-50 rounded-2xl p-5 mt-6 border border-slate-100">
                        <p className="text-xs font-medium text-slate-500 mb-4">Total da carteira em recuperação</p>
                        <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-1">R$ {data.colchaoInadimplido.recuperado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Recuperado</span>
                    </div>
                    <div className="space-y-1 mt-6">
                        <StatRow label="Inadimplido Não Recuperado" value={data.colchaoInadimplido.naoRecuperado} icon={AlertCircle} colorClass="bg-red-50 text-red-500" subtext="Atenção Necessária" />
                    </div>
                </div>
            </div>

        </div>
      </main>
    </div>
  );
};

export default PainelObjetivo;