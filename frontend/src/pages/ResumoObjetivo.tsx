import  { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Filter, RotateCcw, ChevronDown } from "lucide-react";

// --- GRÁFICO RADIAL (VISUAL DO RESUMO) ---
const RadialProgress = ({ percentage }: { percentage: number }) => {
  const radius = 32;
  const stroke = 5;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const progress = Math.min(Math.max(percentage, 0), 100);
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  let color = "text-emerald-500";
  if (percentage < 50) color = "text-red-500";
  else if (percentage < 90) color = "text-amber-500";

  return (
    <div className="relative flex items-center justify-center w-20 h-20">
      <svg height={radius * 2} width={radius * 2} className="rotate-[-90deg]">
        <circle stroke="#f1f5f9" strokeWidth={stroke} fill="transparent" r={normalizedRadius} cx={radius} cy={radius} />
        <circle
          stroke="currentColor"
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset, transition: "stroke-dashoffset 1s ease-out" }}
          strokeLinecap="round"
          fill="transparent"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className={color}
        />
      </svg>
      <div className="absolute flex flex-col items-center text-center">
        <span className={`text-xs font-black ${color}`}>{percentage.toFixed(1)}%</span>
        <span className="text-[6px] text-slate-400 uppercase font-bold tracking-widest mt-0.5">Atingido</span>
      </div>
    </div>
  );
};

export default function ResumoObjetivos() {
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Filtros
  const [listaCredores, setListaCredores] = useState<string[]>([]);
  const [credorSelecionado, setCredorSelecionado] = useState("");
  const [dataInicio, setDataInicio] = useState("2024-12-01"); 
  const [dataFim, setDataFim] = useState("2024-12-31");

  const formatMoney = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  useEffect(() => {
    // Busca lista de credores
    fetch("http:// https://noncomprehendingly-unrescissable-ismael.ngrok-free.dev/api/lista-credores")
      .then(res => res.json())
      .then(data => Array.isArray(data) && setListaCredores(data))
      .catch(err => console.error(err));
      
    fetchDados();
  }, []);

  const fetchDados = async () => {
    setLoading(true);
    setHasSearched(true);
    try {
      const credoresParaEnviar = credorSelecionado ? [credorSelecionado] : [];
      // ATENÇÃO: Rota específica para este painel
      const response = await fetch("http:// https://noncomprehendingly-unrescissable-ismael.ngrok-free.dev/api/resumo-objetivos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data_inicio: dataInicio, data_fim: dataFim, credores: credoresParaEnviar })
      });
      const data = await response.json();
      setCards(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD]">
      
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-50 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-8">
            <Link to="/" className="text-2xl font-black tracking-tighter text-slate-900">MCSA</Link>
            <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest hidden md:block">Visão Operacional</h2>
        </div>
        <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-md">AD</div>
        </div>
      </header>

      <main className="p-8 space-y-8 animate-fade-in max-w-[1600px] mx-auto">
        {/* TÍTULO */}
        <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Resumo de Objetivos</h1>
            <p className="text-slate-500 font-medium mt-1">Acompanhamento consolidado de metas e previsões.</p>
        </div>

        {/* FILTROS */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
            <div className="md:col-span-3">
                <label className="text-[11px] font-bold text-slate-400 uppercase mb-1.5 block tracking-wider">Início</label>
                <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} 
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none"/>
            </div>
            <div className="md:col-span-3">
                <label className="text-[11px] font-bold text-slate-400 uppercase mb-1.5 block tracking-wider">Fim</label>
                <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} 
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none"/>
            </div>
            <div className="md:col-span-4">
                <label className="text-[11px] font-bold text-slate-400 uppercase mb-1.5 block tracking-wider">Carteira</label>
                <div className="relative">
                    <select value={credorSelecionado} onChange={(e) => setCredorSelecionado(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none appearance-none">
                        <option value="">Todas as Carteiras ({listaCredores.length})</option>
                        {listaCredores.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
            </div>
            <div className="md:col-span-2">
                <button onClick={fetchDados} disabled={loading}
                    className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg shadow-sm flex items-center justify-center gap-2">
                    {loading ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Filter className="w-4 h-4" />} Filtrar
                </button>
            </div>
            </div>
        </div>

        {/* GRID DE CARDS */}
        {loading ? (
            <div className="flex justify-center py-20"><RotateCcw className="animate-spin text-slate-400 w-8 h-8" /></div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map((item, idx) => (
                <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                    <div className="border-b border-slate-50 pb-4 mb-4">
                        <h3 className="text-sm font-black text-slate-800 uppercase truncate" title={item.credor}>{item.credor}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 grid grid-cols-2 gap-y-4">
                            <div><p className="text-[10px] text-slate-400 font-bold uppercase">Objetivo</p><p className="text-sm font-bold text-slate-900">{formatMoney(item.objetivo)}</p></div>
                            <div><p className="text-[10px] text-slate-400 font-bold uppercase">Recebido</p><p className="text-sm font-bold text-emerald-600">{formatMoney(item.recebido)}</p></div>
                            <div><p className="text-[10px] text-slate-400 font-bold uppercase">Previsão</p><p className="text-sm font-bold text-slate-500">{formatMoney(item.previsao)}</p></div>
                            <div><p className="text-[10px] text-slate-400 font-bold uppercase">Projeção</p><p className="text-sm font-bold text-slate-900">{formatMoney(item.projecao)}</p></div>
                        </div>
                        <div className="pl-4 border-l border-slate-50"><RadialProgress percentage={item.percentual} /></div>
                    </div>
                </div>
            ))}
            {!loading && cards.length === 0 && hasSearched && <div className="col-span-full text-center py-10 text-slate-400">Nenhum dado encontrado.</div>}
            </div>
        )}
      </main>
    </div>
  );
}