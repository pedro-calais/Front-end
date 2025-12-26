import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Loader2,
  Calendar,
} from "lucide-react";
import { api } from "../api/api"; // Importando sua instância do axios

// --- TIPAGEM (Alinhada com o novo Backend) ---
interface LinhaTabela {
  credor: string;
  campanha: string;
  negociador: string;
  meta: number;
  realizado: number;
  projecao: number;
}

interface CelulaData {
  id: number;
  nome: string;
  stats: {
    objetivo: number;
    realizado: number;
    projecao: number;
  };
  itens: LinhaTabela[];
}

// --- UTILITÁRIOS ---
const formatMoney = (val: number) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

// Componente de Gauge (Bolinha de %)
const MiniGauge = ({ percent }: { percent: number }) => {
    const safe = Math.min(Math.max(percent, 0), 100);
    const dash = 56.5; 
    const offset = dash - (safe / 100) * dash;
    const color = percent >= 100 ? "#10b981" : (percent >= 30 ? "#3b82f6" : "#64748b");
    
    return (
        <div className="relative w-9 h-9 flex items-center justify-center">
            <svg width="36" height="36" className="transform -rotate-90">
                <circle cx="18" cy="18" r="14" stroke="#e2e8f0" strokeWidth="3" fill="none" />
                <circle cx="18" cy="18" r="14" stroke={color} strokeWidth="3" fill="none" strokeDasharray={dash} strokeDashoffset={offset} strokeLinecap="round" />
            </svg>
            <span className="absolute text-[8px] font-bold text-slate-600">{percent.toFixed(0)}%</span>
        </div>
    );
};

const NegociadorCelula = () => {
  const [celulas, setCelulas] = useState<CelulaData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); 

  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        try {
            const [anoStr, mesStr] = month.split('-');
            const ano = parseInt(anoStr);
            const mes = parseInt(mesStr) - 1;
            const dtInicio = new Date(ano, mes, 1).toISOString().split('T')[0];
            const dtFim = new Date(ano, mes + 1, 0).toISOString().split('T')[0];

            console.log(`Buscando: ${dtInicio} -> ${dtFim}`);
            
            // Chama a API diretamente
            const { data } = await api.get("/negociador_celula/resumo", {
                params: { data_inicio: dtInicio, data_fim: dtFim },
            });
            setCelulas(data);
            setError(null);
        } catch (err) {
            console.error(err);
            setError("Erro ao carregar dados.");
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, [month]);

  return (
    <div className="min-h-screen bg-[#F8F9FC] font-sans text-slate-900 pb-20">
        
        {/* HEADER DO SISTEMA */}
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

        <main className="max-w-[1600px] mx-auto p-6 md:p-10">
            
            {/* CONTROLE DE DATA */}
            <div className="flex justify-between items-end mb-10">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Resumo por Célula</h1>
                    <p className="text-slate-500 text-sm mt-1">Acompanhamento consolidado mensal.</p>
                </div>
                <div className="bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
                    <div className="bg-slate-50 p-2 rounded-lg text-slate-400"><Calendar className="w-4 h-4" /></div>
                    <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="bg-transparent text-sm font-bold text-slate-800 outline-none cursor-pointer" />
                </div>
            </div>

            {loading && <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-slate-300" /></div>}
            {!loading && error && <div className="bg-red-50 text-red-600 p-6 rounded-xl flex items-center justify-center gap-2">{error}</div>}

            {/* LISTA DE CÉLULAS */}
            {!loading && !error && celulas.map((celula, idx) => {
                // Cálculo de totais da célula
                const pctCelula = celula.stats.objetivo > 0 
                    ? (celula.stats.realizado / celula.stats.objetivo) * 100 
                    : 0;

                return (
                    <div key={`celula-${idx}`} className="mb-16 animate-fade-in-up">
                        
                        {/* 1. CABEÇALHO DA CÉLULA (TÍTULO + KPIs) */}
                        {/* Estilo idêntico ao print: Nome Azul em cima, KPIs grandes embaixo */}
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-blue-600 mb-4 uppercase tracking-tight">{celula.nome}</h2>
                            
                            <div className="flex flex-wrap gap-8 md:gap-16 items-start">
                                <div>
                                    <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Objetivo Escolhido</span>
                                    <span className="text-2xl font-medium text-slate-800">{formatMoney(celula.stats.objetivo)}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Caixa Recuperado</span>
                                    <span className="text-2xl font-medium text-slate-800">{formatMoney(celula.stats.realizado)}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Previsão</span>
                                    <span className="text-2xl font-medium text-slate-800">{formatMoney(0)}</span> {/* Placeholder se não tiver previsão na celula */}
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Projeção</span>
                                    <span className="text-2xl font-medium text-slate-800">{formatMoney(celula.stats.projecao)}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Tempo Incorrido</span>
                                    <span className="text-2xl font-medium text-slate-800">30.00%</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Percentual</span>
                                    <span className="text-3xl font-bold text-slate-900">{pctCelula.toFixed(2)}%</span>
                                </div>
                            </div>
                        </div>

                        {/* 2. TABELA ÚNICA DA CÉLULA */}
                        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                                    <tr>
                                        <th className="py-3 px-4">Credor</th>
                                        <th className="py-3 px-4">Negociador</th>
                                        <th className="py-3 px-4 text-right">Objetivo</th>
                                        <th className="py-3 px-4 text-right">Realizado</th>
                                        <th className="py-3 px-4 text-right">Previsão</th>
                                        <th className="py-3 px-4 text-right">Projeção</th>
                                        <th className="py-3 px-4 text-center">Tempo</th>
                                        <th className="py-3 px-4 text-center">% Recup.</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {celula.itens.map((item, itemIdx) => {
                                        const pctItem = item.meta > 0 ? (item.realizado / item.meta) * 100 : 0;
                                        
                                        return (
                                            <tr key={`row-${idx}-${itemIdx}`} className="hover:bg-slate-50 transition-colors">
                                                <td className="py-3 px-4 font-bold text-slate-700">{item.credor}</td>
                                                <td className="py-3 px-4 font-medium text-slate-600">{item.negociador}</td>
                                                <td className="py-3 px-4 text-right text-slate-500">{formatMoney(item.meta)}</td>
                                                <td className="py-3 px-4 text-right font-bold text-emerald-600">{formatMoney(item.realizado)}</td>
                                                <td className="py-3 px-4 text-right text-slate-500">{formatMoney(0)}</td>
                                                <td className="py-3 px-4 text-right text-blue-600 font-medium">{formatMoney(item.projecao)}</td>
                                                <td className="py-3 px-4 flex justify-center"><MiniGauge percent={30} /></td>
                                                <td className="py-3 px-4">
                                                    <div className="flex justify-center"><MiniGauge percent={pctItem} /></div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {celula.itens.length === 0 && (
                                        <tr><td colSpan={8} className="py-8 text-center text-slate-400 italic">Sem registros para esta célula.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                    </div>
                );
            })}
        </main>
    </div>
  );
};

export default NegociadorCelula;