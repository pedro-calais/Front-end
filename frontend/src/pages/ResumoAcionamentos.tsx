import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  Filter,
  ChevronDown,
  Users,
  Phone,
  MessageSquare,
  CheckCircle2,
  TrendingUp,
  Download,
  Search,
  User
} from "lucide-react";

// --- MOCK DATA ---
const KPI_DATA = {
  base: {
    totalClientes: "15.165",
    clientesAcionados: "2.974",
    giroBase: "19,61%",
    metaGiro: "20,00%"
  },
  efetividade: {
    totalAcoes: "3.620",
    cpc: "1.089",
    convCpc: "30,08%"
  },
  conversao: {
    acordos: "240",
    recuperados: "180",
    convAcordo: "22,04%",
    perfCaixa: "75,00%"
  }
};

const TABLE_DATA = [
  {
    negociador: "Andrei Alves",
    campanha: "Direcional Extrajudicial",
    totalClientes: 425,
    acionados: 155,
    giro: "36%",
    desvio: "+16%",
    cpc: 33,
    convCpc: "21%",
    acordos: 8,
    recuperados: 6
  },
  {
    negociador: "Andrei Alves",
    campanha: "Direcional Judicial",
    totalClientes: 82,
    acionados: 8,
    giro: "10%",
    desvio: "-10%",
    cpc: 7,
    convCpc: "88%",
    acordos: 1,
    recuperados: 1
  },
  {
    negociador: "Carolina Monteiro",
    campanha: "Direcional Extrajudicial",
    totalClientes: 388,
    acionados: 129,
    giro: "33%",
    desvio: "+13%",
    cpc: 47,
    convCpc: "36%",
    acordos: 13,
    recuperados: 10
  },
  {
    negociador: "Júlia Basílio",
    campanha: "Direcional Extrajudicial",
    totalClientes: 272,
    acionados: 69,
    giro: "25%",
    desvio: "+5%",
    cpc: 30,
    convCpc: "43%",
    acordos: 6,
    recuperados: 7
  }
];

// --- COMPONENTES VISUAIS REFINADOS ---

// 1. Filtro Select (Clean)
const FilterSelect = ({ label, placeholder, icon: Icon }: { label: string, placeholder: string, icon: React.ElementType }) => (
  <div className="flex-1 min-w-[200px]">
    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5 ml-1">
      <Icon className="w-3 h-3" /> {label}
    </label>
    <div className="relative group">
      <select className="w-full appearance-none bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl py-3 pl-4 pr-10 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-100 transition-all cursor-pointer shadow-sm">
        <option value="" disabled selected>{placeholder}</option>
        <option value="1">Opção 1</option>
      </select>
      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
    </div>
  </div>
);

// 2. Card de KPI Group (Elegante)
const KpiCard = ({ title, icon: Icon, colorClass, metrics }: any) => {
    const bgIcon = colorClass.replace('text-', 'bg-').replace('600', '50');
    
    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex-1 hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-6">
                <div className={`p-2.5 rounded-xl ${bgIcon}`}>
                    <Icon className={`w-5 h-5 ${colorClass}`} />
                </div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">{title}</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                {metrics.map((m: any, i: number) => (
                    <div key={i} className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{m.label}</span>
                        <span className="text-xl font-black text-slate-900 tracking-tight">{m.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

const ResumoAcionamentos = () => {
  const [activeTab, setActiveTab] = useState<'ativo' | 'passivo'>('ativo');

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans text-slate-900">
      
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-12">
            <Link to="/" className="text-2xl font-black tracking-tighter text-slate-900 flex items-center gap-1 cursor-pointer">
                MCSA
            </Link>
            <nav className="hidden md:flex items-center gap-8">
                <Link to="/" className="text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors pb-1">Visão Geral</Link>
                <Link to="/composicao-carteira" className="text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors pb-1">Carteira</Link>
                <span className="text-sm font-bold text-slate-900 border-b-2 border-slate-900 pb-1">Acionamentos</span>
            </nav>
        </div>
        <div className="flex items-center gap-6">
            <button className="text-slate-400 hover:text-slate-900 transition-colors relative">
                <Bell className="w-5 h-5" />
            </button>
            <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-sm">AD</div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 md:px-8 py-10 pb-20">
        
        {/* TÍTULO & CONTROLES */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase mb-2">
                    Resumo de Acionamentos
                </h1>
                <p className="text-slate-500 font-medium text-sm">
                    Performance operacional e conversão de contatos.
                </p>
            </div>
            
            {/* Toggle Moderno (Pill) */}
            <div className="bg-slate-100 p-1.5 rounded-xl flex items-center shadow-inner">
                <button 
                    onClick={() => setActiveTab('ativo')}
                    className={`px-8 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all duration-200 ${activeTab === 'ativo' ? 'bg-white text-slate-900 shadow-sm scale-100' : 'text-slate-400 hover:text-slate-600 scale-95'}`}
                >
                    Ativo
                </button>
                <button 
                    onClick={() => setActiveTab('passivo')}
                    className={`px-8 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all duration-200 ${activeTab === 'passivo' ? 'bg-white text-slate-900 shadow-sm scale-100' : 'text-slate-400 hover:text-slate-600 scale-95'}`}
                >
                    Passivo
                </button>
            </div>
        </div>

        {/* 1. ÁREA DE FILTROS */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-10">
            <div className="flex flex-col lg:flex-row gap-6 items-end">
                <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FilterSelect label="Célula / Equipe" placeholder="Todas as Células" icon={Users} />
                    <FilterSelect label="Campanha / Produto" placeholder="Todas as Campanhas" icon={Search} />
                </div>
                
                <button className="w-full lg:w-auto px-10 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-md flex items-center justify-center gap-2 h-[48px] active:scale-95">
                    <Filter className="w-3 h-3" /> Atualizar Dados
                </button>
            </div>
        </div>

        {/* 2. KPIs (Grid Visual) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <KpiCard 
                title="Base & Giro" 
                icon={Users} 
                colorClass="text-blue-600"
                metrics={[
                    { label: "Total Clientes", value: KPI_DATA.base.totalClientes },
                    { label: "Acionados", value: KPI_DATA.base.clientesAcionados },
                    { label: "Giro da Base", value: KPI_DATA.base.giroBase },
                    { label: "Meta de Giro", value: KPI_DATA.base.metaGiro },
                ]}
            />
            <KpiCard 
                title="Efetividade (Alo)" 
                icon={Phone} 
                colorClass="text-purple-600"
                metrics={[
                    { label: "Total Ações", value: KPI_DATA.efetividade.totalAcoes },
                    { label: "CPC Realizado", value: KPI_DATA.efetividade.cpc },
                    { label: "Conversão CPC", value: KPI_DATA.efetividade.convCpc },
                    { label: "Média Diária", value: "120" }, // Exemplo extra
                ]}
            />
            <KpiCard 
                title="Conversão Final" 
                icon={CheckCircle2} 
                colorClass="text-emerald-600"
                metrics={[
                    { label: "Acordos", value: KPI_DATA.conversao.acordos },
                    { label: "Recuperados", value: KPI_DATA.conversao.recuperados },
                    { label: "Conv. Acordo", value: KPI_DATA.conversao.convAcordo },
                    { label: "Perf. Caixa", value: KPI_DATA.conversao.perfCaixa },
                ]}
            />
        </div>

        {/* 3. TABELA (Elegante & Clean) */}
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-slate-400" /> Detalhamento por Negociador
                </h2>
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:border-slate-400 hover:text-slate-900 transition-all shadow-sm">
                    <Download className="w-4 h-4" /> Exportar
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            {/* Super Cabeçalho */}
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="py-3 px-6 text-left border-r border-slate-200 w-[30%]">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Identificação</span>
                                </th>
                                <th className="py-3 px-4 border-r border-slate-200 text-center" colSpan={4}>
                                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full">Operacional</span>
                                </th>
                                <th className="py-3 px-4 text-center" colSpan={4}>
                                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full">Financeiro</span>
                                </th>
                            </tr>
                            
                            {/* Colunas */}
                            <tr className="border-b border-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                <th className="py-4 px-6 border-r border-slate-100">Negociador</th>
                                
                                <th className="py-4 px-2 text-center">Base</th>
                                <th className="py-4 px-2 text-center">Giro %</th>
                                <th className="py-4 px-2 text-center">Desvio</th>
                                <th className="py-4 px-2 text-center border-r border-slate-100">CPC</th>
                                
                                <th className="py-4 px-2 text-center">Conv. %</th>
                                <th className="py-4 px-2 text-center">Acordos</th>
                                <th className="py-4 px-2 text-center">Recup.</th>
                                <th className="py-4 px-2 text-center">Status</th>
                            </tr>
                        </thead>
                        
                        <tbody className="divide-y divide-slate-50">
                            {TABLE_DATA.map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="py-4 px-6 border-r border-slate-50">
                                        <div className="flex items-center gap-3">
                                            {/* Avatar Placeholder */}
                                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-xs group-hover:bg-slate-900 group-hover:text-white transition-colors">
                                                {row.negociador.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">{row.negociador}</p>
                                                <p className="text-[10px] font-medium text-slate-400 uppercase mt-0.5 max-w-[180px] truncate">
                                                    {row.campanha}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    
                                    <td className="py-4 px-2 text-center font-medium text-slate-600">{row.totalClientes}</td>
                                    <td className="py-4 px-2 text-center">
                                        <span className="px-2 py-1 bg-slate-100 rounded text-xs font-bold text-slate-700">{row.giro}</span>
                                    </td>
                                    <td className="py-4 px-2 text-center">
                                        <span className={`text-xs font-bold ${row.desvio.includes('-') ? 'text-red-500' : 'text-emerald-500'}`}>
                                            {row.desvio}
                                        </span>
                                    </td>
                                    <td className="py-4 px-2 text-center border-r border-slate-50 font-bold text-slate-700">{row.cpc}</td>

                                    <td className="py-4 px-2 text-center font-medium text-slate-600">{row.convCpc}</td>
                                    <td className="py-4 px-2 text-center">
                                        <span className="text-sm font-black text-slate-900">{row.acordos}</span>
                                    </td>
                                    <td className="py-4 px-2 text-center font-bold text-slate-600">{row.recuperados}</td>
                                    <td className="py-4 px-2 text-center">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 mx-auto"></div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

      </main>
    </div>
  );
};

export default ResumoAcionamentos;