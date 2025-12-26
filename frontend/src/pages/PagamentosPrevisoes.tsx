import { useState, useEffect, useMemo } from 'react';
import { api } from '../api/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2, Filter, Download, TrendingUp, DollarSign } from 'lucide-react';
import { Link } from "react-router-dom";

// Tipos de dados
interface DashboardData {
  metricas: {
    total_pago: number;
    total_previsto: number;
    sucumbencia_paga: number;
    sucumbencia_prevista: number;
    qtd_pagamentos: number;
    qtd_previsoes: number;
  };
  graficos: {
    pagamentos_por_data: { data: string; valor: number }[];
    previsao_por_data: { data: string; valor: number }[];
  };
  tabela_pagamentos: any[];
  tabela_previsao: any[];
}

interface OpcoesFiltro {
  credor_vs_campanha: Record<string, string[]>;
  responsaveis: { label: string; value: string }[];
}

const PagamentosPrevisoes = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [opcoes, setOpcoes] = useState<OpcoesFiltro>({ credor_vs_campanha: {}, responsaveis: [] });

  const [filtros, setFiltros] = useState({
    data_inicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
    data_fim: new Date().toISOString().slice(0, 10),
    credor: "",
    campanha: "",
    negociador: "",
    status: ""
  });

  useEffect(() => {
    api.get('/chamados/opcoes')
      .then(res => setOpcoes(res.data))
      .catch(err => console.error("Erro ao carregar opções:", err));
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const payload = {
        data_inicio: filtros.data_inicio,
        data_fim: filtros.data_fim,
        credores: filtros.credor ? [filtros.credor] : [],
        campanhas: filtros.campanha ? [filtros.campanha] : [],
        negociadores: filtros.negociador ? [filtros.negociador] : [],
        status: filtros.status ? [filtros.status] : []
      };

      const response = await api.post('/financeiro/dashboard', payload);
      setData(response.data);
    } catch (error) {
      console.error("Erro ao carregar financeiro", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const campanhasDisponiveis = filtros.credor 
    ? (opcoes.credor_vs_campanha[filtros.credor] || []) 
    : [];

  // --- CÁLCULOS NO FRONT-END (USEMEMO) ---

  // 1. Ranking de Sucumbência PAGA por Campanha
  const rankingSucumbenciaPaga = useMemo(() => {
    if (!data?.tabela_pagamentos) return [];
    
    const agrupado = data.tabela_pagamentos.reduce((acc: any, row: any) => {
        // Filtra apenas o que foi pago
        if (Number(row.VALOR_PAGO) > 0) {
            const camp = row.CAMPANHA || 'Outros';
            // Se o backend não mandar o campo "SUCUMBENCIA_PAGA", calculamos 10% ou 20% do valor pago.
            // Ajuste aqui conforme sua regra de negócio. (Ex: row.VALOR_PAGO * 0.10)
            const valSucumbencia = row.SUCUMBENCIA ? Number(row.SUCUMBENCIA) : (Number(row.VALOR_PAGO) * 0.10);
            
            acc[camp] = (acc[camp] || 0) + valSucumbencia;
        }
        return acc;
    }, {});

    return Object.entries(agrupado)
        .map(([name, valor]) => ({ name, valor: Number(valor) }))
        .sort((a, b) => b.valor - a.valor);
  }, [data?.tabela_pagamentos]);

  // 2. Ranking de Sucumbência PREVISTA por Campanha
  const rankingSucumbenciaPrevista = useMemo(() => {
    if (!data?.tabela_previsao) return [];
    
    const agrupado = data.tabela_previsao.reduce((acc: any, curr: any) => {
      const campanha = curr.CAMPANHA || 'Outros';
      const valorSucumbencia = Number(curr.SUCUMBENCIA || curr.VALOR * 0.10 || 0); 
      acc[campanha] = (acc[campanha] || 0) + valorSucumbencia;
      return acc;
    }, {});

    return Object.entries(agrupado)
        .map(([name, valor]) => ({ name, valor: Number(valor) }))
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 8);
  }, [data?.tabela_previsao]);


  // --- FUNÇÃO VISUAL PARA GRÁFICOS ---
  const renderCustomBarLabel = (props: any) => {
    const { x, y, width, value } = props;
    if (!value || value === 0) return null;

    let formattedValue = '';
    if (value >= 1000000) {
      formattedValue = (value / 1000000).toFixed(1).replace('.0', '') + 'M';
    } else if (value >= 1000) {
      formattedValue = (value / 1000).toFixed(0) + 'k';
    } else {
      formattedValue = value.toString();
    }

    return (
      <text x={x + width / 2} y={y - 5} fill="#64748b" textAnchor="middle" fontSize={10} fontWeight={600}>
        {formattedValue}
      </text>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8F9FC] font-sans text-slate-900 pb-20">
        
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
    
      <div className="p-6 max-w-[1600px] mx-auto">
        
        {/* --- FILTROS --- */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Pagamentos & Previsões</h1>
            <button onClick={carregarDados} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium shadow-sm">
              {loading ? <Loader2 className="animate-spin h-4 w-4"/> : <Filter className="h-4 w-4"/>}
              Filtrar Resultados
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="lg:col-span-1">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Data Início</label>
              <input type="date" className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={filtros.data_inicio} onChange={e => setFiltros({...filtros, data_inicio: e.target.value})} />
            </div>
            <div className="lg:col-span-1">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Data Fim</label>
              <input type="date" className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={filtros.data_fim} onChange={e => setFiltros({...filtros, data_fim: e.target.value})} />
            </div>
            <div className="lg:col-span-1">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Credor</label>
              <select className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={filtros.credor} onChange={e => setFiltros({...filtros, credor: e.target.value, campanha: ""})}>
                <option value="">Todos</option>
                {Object.keys(opcoes.credor_vs_campanha).sort().map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="lg:col-span-1">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Campanha</label>
              <select className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 disabled:text-gray-400" value={filtros.campanha} onChange={e => setFiltros({...filtros, campanha: e.target.value})} disabled={!filtros.credor}>
                <option value="">{filtros.credor ? "Todas" : "Selecione Credor"}</option>
                {campanhasDisponiveis.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="lg:col-span-1">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Negociador</label>
              <select className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={filtros.negociador} onChange={e => setFiltros({...filtros, negociador: e.target.value})}>
                <option value="">Todos</option>
                {opcoes.responsaveis.map(r => <option key={r.value} value={r.label}>{r.label}</option>)}
              </select>
            </div>
            <div className="lg:col-span-1">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
              <select className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={filtros.status} onChange={e => setFiltros({...filtros, status: e.target.value})}>
                <option value="">Todos</option>
                <option value="Pago">Pago</option>
                <option value="Novo">Novo (Previsão)</option>
                <option value="Inadimplido">Inadimplido</option>
                <option value="Aberto">Aberto</option>
              </select>
            </div>
          </div>
        </div>

        {/* --- KPI GERAIS --- */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Total Pago</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">{data ? data.metricas.total_pago.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'}) : 'R$ 0,00'}</h3>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Total Previsto</p>
            <h3 className="text-2xl font-bold text-orange-500 mt-1">{data ? data.metricas.total_previsto.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'}) : 'R$ 0,00'}</h3>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Qtd. Pagamentos</p>
            <h3 className="text-2xl font-bold text-blue-600 mt-1">{data ? data.metricas.qtd_pagamentos : 0}</h3>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Sucumbência Paga</p>
            <h3 className="text-2xl font-bold text-indigo-600 mt-1">{data ? data.metricas.sucumbencia_paga.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'}) : 'R$ 0,00'}</h3>
          </div>
        </div>

        {/* ========================================================================================= */}
        {/* SEÇÃO 1: PAGAMENTOS REALIZADOS (Com a Tabela que faltava) */}
        {/* ========================================================================================= */}
        <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
                <div className="bg-emerald-100 p-2 rounded-lg"><DollarSign className="w-5 h-5 text-emerald-600" /></div>
                <h2 className="text-lg font-bold text-gray-800">Análise de Pagamentos Realizados</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                
                {/* 1. Gráfico de Evolução (Ocupa 2 colunas) */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-80">
                    <h3 className="font-bold text-gray-700 mb-4 text-sm uppercase">Evolução de Pagamentos</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data?.graficos.pagamentos_por_data || []} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="data" tickFormatter={(val) => new Date(val).toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit', timeZone: 'UTC'})} tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                            <YAxis hide />
                            <Tooltip cursor={{ fill: '#f1f5f9' }} formatter={(value) => Number(value).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Bar dataKey="valor" fill="#10b981" radius={[4, 4, 0, 0]} label={renderCustomBarLabel} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* 2. Tabela de Sucumbência Paga por Campanha (AQUI ESTÁ A TABELA QUE VOCÊ PEDIU) */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-80 flex flex-col">
                    <div className="p-4 border-b border-gray-100 bg-gray-50">
                        <h3 className="font-bold text-gray-700 text-xs uppercase">Sucumbência Paga (Top Campanhas)</h3>
                    </div>
                    <div className="overflow-auto flex-1 p-0">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-white text-gray-500 font-semibold sticky top-0">
                                <tr className="border-b border-gray-100">
                                    <th className="p-3">Campanha</th>
                                    <th className="p-3 text-right">Valor Pago</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {rankingSucumbenciaPaga.length === 0 && (
                                    <tr><td colSpan={2} className="p-4 text-center text-gray-400">Sem dados.</td></tr>
                                )}
                                {rankingSucumbenciaPaga.map((item, i) => (
                                    <tr key={i} className="hover:bg-indigo-50 transition-colors">
                                        <td className="p-3 font-medium text-gray-700 truncate max-w-[150px]" title={item.name}>{item.name}</td>
                                        <td className="p-3 text-right font-bold text-indigo-600">
                                            {item.valor.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            {/* Tabela Detalhada de Pagamentos */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-700 text-sm uppercase">Detalhamento (Pagos)</h3>
                    <button className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition">
                        <Download className="h-3 w-3"/> CSV
                    </button>
                </div>
                <div className="overflow-x-auto max-h-[400px]">
                    <table className="w-full text-xs text-left">
                        <thead className="bg-gray-100 text-gray-500 font-semibold sticky top-0">
                            <tr>
                                <th className="p-3">Data</th>
                                <th className="p-3">Credor</th>
                                <th className="p-3">Cliente</th>
                                <th className="p-3 text-right">Valor</th>
                                <th className="p-3 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {data?.tabela_pagamentos.filter(row => Number(row.VALOR_PAGO) > 0).map((row, i) => (
                                <tr key={i} className="hover:bg-blue-50 transition-colors">
                                    <td className="p-3 text-gray-600">{row.DATA_EXIBICAO ? new Date(row.DATA_EXIBICAO).toLocaleDateString('pt-BR') : '-'}</td>
                                    <td className="p-3 font-medium text-gray-800">{row.CREDOR}</td>
                                    <td className="p-3 text-gray-600 truncate max-w-[120px]">{row.CLIENTE || '-'}</td>
                                    <td className="p-3 text-right font-bold text-gray-700">{Number(row.VALOR_PAGO).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</td>
                                    <td className="p-3 text-center"><span className="px-2 py-0.5 rounded-full font-bold text-[10px] uppercase bg-emerald-100 text-emerald-700">PAGO</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {/* ========================================================================================= */}
        {/* SEÇÃO 2: PREVISÕES FUTURAS */}
        {/* ========================================================================================= */}
        <div className="mb-6 border-t border-gray-200 pt-8">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="bg-orange-100 p-2 rounded-lg"><TrendingUp className="w-5 h-5 text-orange-600" /></div>
                    <h2 className="text-lg font-bold text-gray-800">Previsões & Carteira Futura</h2>
                </div>
                
                <div className="flex gap-4">
                    <div className="bg-orange-50 px-4 py-2 rounded-lg border border-orange-100 text-right">
                        <span className="text-[10px] font-bold text-orange-400 uppercase block">Sucumbência Prevista Total</span>
                        <span className="text-sm font-bold text-orange-600">
                            {data ? data.metricas.sucumbencia_prevista.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'}) : 'R$ 0,00'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                
                {/* Gráfico de Previsão por Data */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-80">
                    <h3 className="font-bold text-gray-700 mb-4 text-sm uppercase">Fluxo de Caixa Previsto (Por Data)</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data?.graficos.previsao_por_data || []} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="data" tickFormatter={(val) => new Date(val).toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit', timeZone: 'UTC'})} tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                            <YAxis hide />
                            <Tooltip cursor={{ fill: '#f1f5f9' }} formatter={(value) => Number(value).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Bar dataKey="valor" fill="#f97316" radius={[4, 4, 0, 0]} label={renderCustomBarLabel} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Tabela de Sucumbência Prevista por Campanha (SOLICITADO) */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-80 flex flex-col">
                    <div className="p-4 border-b border-gray-100 bg-gray-50">
                        <h3 className="font-bold text-gray-700 text-xs uppercase">Sucumbência Prevista (Por Campanha)</h3>
                    </div>
                    <div className="overflow-auto flex-1 p-0">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-white text-gray-500 font-semibold sticky top-0">
                                <tr className="border-b border-gray-100">
                                    <th className="p-3">Campanha</th>
                                    <th className="p-3 text-right">Valor Previsto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {rankingSucumbenciaPrevista.length === 0 && (
                                    <tr><td colSpan={2} className="p-4 text-center text-gray-400">Sem dados.</td></tr>
                                )}
                                {rankingSucumbenciaPrevista.map((item, i) => (
                                    <tr key={i} className="hover:bg-orange-50 transition-colors">
                                        <td className="p-3 font-medium text-gray-700 truncate max-w-[150px]" title={item.name}>{item.name}</td>
                                        <td className="p-3 text-right font-bold text-orange-600">
                                            {item.valor.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Tabela Detalhada de Previsões */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-700 text-sm uppercase">Detalhamento de Previsões</h3>
                    <button className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition">
                        <Download className="h-3 w-3"/> EXPORTAR CSV
                    </button>
                </div>
                <div className="overflow-x-auto max-h-[500px]">
                    <table className="w-full text-xs text-left">
                        <thead className="bg-gray-100 text-gray-500 font-semibold sticky top-0">
                            <tr>
                                <th className="p-3">Vencimento</th>
                                <th className="p-3">Credor</th>
                                <th className="p-3">Campanha</th>
                                <th className="p-3">Cliente</th>
                                <th className="p-3">Negociador</th>
                                <th className="p-3 text-right text-orange-600">Valor Previsto</th>
                                <th className="p-3 text-right text-indigo-600">Sucumbência</th>
                                <th className="p-3 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {data?.tabela_previsao.map((row, i) => (
                                <tr key={i} className="hover:bg-orange-50 transition-colors">
                                    <td className="p-3 text-gray-600">
                                        {row.DATA_VENCIMENTO || row.DATA_EXIBICAO 
                                            ? new Date(row.DATA_VENCIMENTO || row.DATA_EXIBICAO).toLocaleDateString('pt-BR') 
                                            : '-'}
                                    </td>
                                    <td className="p-3 font-medium text-gray-800">{row.CREDOR}</td>
                                    <td className="p-3 text-gray-500">{row.CAMPANHA}</td>
                                    <td className="p-3 text-gray-600 truncate max-w-[150px]" title={row.CLIENTE}>{row.CLIENTE || '-'}</td>
                                    <td className="p-3 text-gray-500">{row.NEGOCIADOR || '-'}</td>
                                    <td className="p-3 text-right font-bold text-orange-600">
                                        {Number(row.VALOR || row.VALOR_ATUALIZADO || 0).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}
                                    </td>
                                    <td className="p-3 text-right font-bold text-indigo-600">
                                        {Number(row.SUCUMBENCIA || (row.VALOR * 0.1) || 0).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}
                                    </td>
                                    <td className="p-3 text-center">
                                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase bg-blue-100 text-blue-700`}>
                                            PREVISTO
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {(!data?.tabela_previsao || data.tabela_previsao.length === 0) && (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-gray-400 text-sm">
                                        Nenhuma previsão encontrada para o período.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default PagamentosPrevisoes;