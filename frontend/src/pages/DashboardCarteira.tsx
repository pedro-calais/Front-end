import  { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Filter, RotateCcw, Search, ChevronDown } from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  ComposedChart, Line, Legend
} from 'recharts';

export default function DashboardCarteira() {
  const [loading, setLoading] = useState(false);
  
  // Estado Inicial
  const [dados, setDados] = useState({ 
    kpis: { total_clientes: 0, valor_total: 0, ticket_medio: 0 },
    aging: [],
    ro: [],
    mensal: [],
    novos_clientes: [],
    tabela: []
  });
  
  // Filtros
  const [listaCampanhas, setListaCampanhas] = useState<string[]>([]);
  const [campanhaSelecionada, setCampanhaSelecionada] = useState("");
  const [dataInicio, setDataInicio] = useState("2024-01-01");
  const [dataFim, setDataFim] = useState("2024-12-31");

  // Formatadores
  const formatMoney = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: "compact" }).format(val);
  
  const formatCurrencyFull = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  useEffect(() => {
    // 1. Carrega Campanhas (do app.py -> variaveis_globais)
    fetch("http://localhost:5000/api/lista-campanhas")
      .then(res => res.json())
      .then(data => Array.isArray(data) && setListaCampanhas(data));
      
    // 2. Carrega Dados Iniciais
    fetchDados();
  }, []);

  const fetchDados = async () => {
    setLoading(true);
    try {
      const campanhasParaEnviar = campanhaSelecionada ? [campanhaSelecionada] : [];
      
      const response = await fetch("http://localhost:5000/api/dashboard-carteira", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            data_inicio: dataInicio, 
            data_fim: dataFim, 
            campanhas: campanhasParaEnviar 
        })
      });
      const result = await response.json();
      
      if (result && result.kpis) {
        setDados(result);
      }
    } catch (error) {
      console.error("Erro:", error);
    } finally {
      setLoading(false);
    }
  };

  // Tooltip Customizado para os Gráficos
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl border border-slate-700 text-xs z-50">
          <p className="font-bold mb-2 text-slate-300 border-b border-slate-700 pb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full" style={{backgroundColor: entry.color}}></div>
                <span className="font-medium">
                    {entry.name}: {entry.name.includes('Valor') || entry.name.includes('Ticket') ? formatCurrencyFull(entry.value) : entry.value}
                </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD]">
      
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-40 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-8">
            <Link to="/" className="text-2xl font-black tracking-tighter text-slate-900">MCSA</Link>
            <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest hidden md:block">Dashboard Carteiras</h2>
        </div>
        <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-md">AD</div>
      </header>

      <main className="p-8 space-y-8 animate-fade-in max-w-[1600px] mx-auto pb-20">
        
        {/* TÍTULO */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Análise de Carteira</h1>
            <p className="text-slate-500 font-medium mt-1">Recuperação, novos clientes e perfil da dívida.</p>
          </div>
        </div>

        {/* FILTROS */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
            
            {/* Filtro Campanha */}
            <div className="md:col-span-4">
              <label className="text-[11px] font-bold text-slate-400 uppercase mb-1.5 block">Selecione a Campanha</label>
              <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <select 
                    value={campanhaSelecionada} 
                    onChange={(e) => setCampanhaSelecionada(e.target.value)} 
                    className="w-full pl-10 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 appearance-none outline-none cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                      <option value="">Todas as Campanhas</option>
                      {listaCampanhas.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Datas */}
            <div className="md:col-span-3">
              <label className="text-[11px] font-bold text-slate-400 uppercase mb-1.5 block">Período</label>
              <div className="flex gap-2 items-center bg-slate-50 border border-slate-200 rounded-lg px-2">
                  <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="bg-transparent py-2 text-sm font-bold text-slate-700 outline-none w-full"/>
                  <span className="text-slate-400">-</span>
                  <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="bg-transparent py-2 text-sm font-bold text-slate-700 outline-none w-full"/>
              </div>
            </div>

            <div className="md:col-span-2">
              <button onClick={fetchDados} disabled={loading} className="w-full py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2">
                  {loading ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Filter className="w-4 h-4" />} Atualizar
              </button>
            </div>
          </div>
        </div>

        {loading ? (
             <div className="flex flex-col items-center justify-center py-20"><RotateCcw className="animate-spin text-slate-300 w-10 h-10 mb-2" /><p className="text-slate-400 text-sm">Carregando dados...</p></div>
        ) : (
        <>
            {/* 1. KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total de Clientes</p>
                    <h3 className="text-3xl font-black text-slate-900">{dados.kpis.total_clientes}</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Valor Carteira Vencida</p>
                    <h3 className="text-3xl font-black text-slate-900">{formatMoney(dados.kpis.valor_total)}</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Ticket Médio</p>
                    <h3 className="text-3xl font-black text-slate-900">{formatCurrencyFull(dados.kpis.ticket_medio)}</h3>
                </div>
            </div>

            {/* 2. GRÁFICO MENSAL (Igual imagem 1) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-slate-900">Valor Total Recuperado por Mês</h3>
                </div>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dados.mensal} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="Mes" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={formatMoney} />
                            <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
                            <Bar dataKey="VALOR_PAGO" name="Valor Recuperado" fill="#007bff" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* 3. NOVOS CLIENTES (Combo: Valor + Linha de Clientes) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-slate-900">Valor Total e Total de Clientes Novos Por Dia</h3>
                </div>
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={dados.novos_clientes} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="Data" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} minTickGap={30} />
                            <YAxis yAxisId="left" axisLine={false} tickLine={false} tickFormatter={formatMoney} />
                            <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Bar yAxisId="left" dataKey="VALOR" name="Valor Total" fill="#cd5c5c" radius={[4, 4, 0, 0]} barSize={40} />
                            <Line yAxisId="right" type="monotone" dataKey="CLIENTES" name="Total de Clientes" stroke="#0000ff" strokeWidth={2} dot={{r: 4, fill: '#0000ff'}} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 4. AGING */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Aging da Carteira</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={dados.aging}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="FAIXA_AGING" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                                <YAxis yAxisId="left" axisLine={false} tickFormatter={formatMoney} />
                                <YAxis yAxisId="right" orientation="right" axisLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar yAxisId="left" dataKey="VALOR" name="Valor Total" fill="#indianred" radius={[4, 4, 0, 0]} />
                                <Line yAxisId="right" type="monotone" dataKey="CLIENTES" name="Clientes" stroke="#0000ff" />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 5. STATUS RO */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Carteira Por Status (RO)</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={dados.ro} margin={{left: 20}}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="RO" type="category" width={120} tick={{fontSize: 10}} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="QUANTIDADE" name="Quantidade" fill="#6366f1" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* 6. TABELA */}
            {dados.tabela.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 font-bold text-slate-900">Detalhamento (Top 100)</div>
                    <div className="overflow-x-auto max-h-[400px]">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs sticky top-0">
                                <tr>
                                    <th className="px-6 py-3">Campanha</th>
                                    <th className="px-6 py-3">Status/RO</th>
                                    <th className="px-6 py-3 text-right">Saldo</th>
                                    <th className="px-6 py-3 text-right">Vencimento</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {dados.tabela.map((row: any, i: number) => (
                                    <tr key={i} className="hover:bg-slate-50">
                                        <td className="px-6 py-3">{row.CAMPANHA}</td>
                                        <td className="px-6 py-3"><span className="px-2 py-1 rounded bg-slate-100 text-xs font-bold">{row.RO}</span></td>
                                        <td className="px-6 py-3 text-right font-bold">{formatCurrencyFull(parseFloat(row.SALDO))}</td>
                                        <td className="px-6 py-3 text-right">{row.VENCIMENTO}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </>
        )}
      </main>
    </div>
  );
}