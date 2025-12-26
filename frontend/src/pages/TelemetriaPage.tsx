import { useState, useEffect, useMemo } from "react";
import { api } from "../api/api";
import { Link } from "react-router-dom";
import { 
    Users, Activity, Clock, 
    Monitor, ArrowUpRight, Signal, Loader2,
    Info, Filter, ChevronLeft, ChevronRight, BarChart3, Bell 
} from "lucide-react";

import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts';

// --- TIPOS ---
interface TrailItem { route: string; time: string; }

interface UserMetric {
    id: number;
    name: string;
    avatar: string;
    cell: string; 
    is_online: boolean;
    last_login: string | null;
    last_seen: string | null;
    current_route: string;
    actions_today: number;
    trail: TrailItem[];
}

interface TopPage { route: string; visits: number; avg_time: number; }
interface AccessData { time: string; users: number; }

interface DashboardData {
    overview: { total_users: number; online_now: number; };
    users: UserMetric[];
    top_pages: TopPage[];
    access_curve: AccessData[]; 
}

// --- UTILITÁRIOS ---
const formatRelativeTime = (dateString: string | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000); 
    if (diff < 60) return "Agora";
    if (diff < 3600) return `${Math.floor(diff / 60)}m atrás`;
    return date.toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'});
};

const ActivityLevel = ({ count }: { count: number }) => {
    let color = "bg-slate-200 dark:bg-zinc-800";
    let width = "10%";
    
    if (count > 10) { width = "25%"; color = "bg-blue-400"; }
    if (count > 50) { width = "50%"; color = "bg-indigo-500"; }
    if (count > 150) { width = "75%"; color = "bg-violet-500"; }
    if (count > 300) { width = "100%"; color = "bg-emerald-500"; }

    return (
        <div className="w-24">
            <div className="flex justify-between text-[9px] mb-1 font-medium text-slate-400">
                <span>{count} ações </span>
            </div>
            <div className="h-1 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width }} />
            </div>
        </div>
    );
};

const TelemetriaPage = () => {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedCell, setSelectedCell] = useState<string>("Todas"); 
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const fetchData = async () => {
        try {
            const response = await api.get('/telemetry/manager/dashboard');
            setData(response.data);
        } catch (error) {
            console.error("Erro ao buscar telemetria", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => { setCurrentPage(1); }, [selectedCell]);

    const uniqueCells = useMemo(() => {
        if (!data) return [];
        // Proteção aqui: data.users pode ser undefined se a API falhar parcialmente
        const users = data.users || [];
        const cells = users.map(u => u.cell || "Geral");
        return ["Todas", ...Array.from(new Set(cells))].sort();
    }, [data]);

    const filteredUsers = useMemo(() => {
        if (!data || !data.users) return [];
        if (selectedCell === "Todas") return data.users;
        return data.users.filter(u => u.cell === selectedCell);
    }, [data, selectedCell]);

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

    const handleNextPage = () => { if (currentPage < totalPages) setCurrentPage(prev => prev + 1); };
    const handlePrevPage = () => { if (currentPage > 1) setCurrentPage(prev => prev - 1); };

    if (loading && !data) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-[#F8FAFC] dark:bg-zinc-950 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-zinc-950 font-sans text-slate-900 dark:text-zinc-100 pb-10">
            
            {/* HEADER PADRÃO DO PROJETO */}
            <header className="sticky top-0 z-50 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-sm border-b border-slate-200 dark:border-zinc-800 px-8 py-4 flex items-center justify-between shadow-sm transition-colors duration-300">
                <div className="flex items-center gap-12">
                    <Link to="/" className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white flex items-center gap-1 cursor-pointer">
                        MCSA
                    </Link>
                    <nav className="hidden md:flex items-center gap-8">
                        <Link to="/" className="text-sm font-bold text-slate-400 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-zinc-300 transition-colors pb-1">
                            Visão Geral
                        </Link>
                        {/* Link Ativo */}
                        <div className="text-sm font-bold text-slate-900 dark:text-white border-b-2 border-slate-900 dark:border-white pb-1 cursor-default">
                            Monitoramento
                        </div>
                    </nav>
                </div>
                
                <div className="flex items-center gap-6">
                    <button onClick={fetchData} className="text-slate-400 hover:text-indigo-600 transition-colors" title="Atualizar Dados">
                        <Clock className="w-5 h-5" />
                    </button>

                    <div className="hidden md:flex items-center gap-2 bg-slate-100 dark:bg-zinc-900 rounded-full px-3 py-1">
                        {/* CORREÇÃO AQUI: Adicionado ?. e fallback || 0 */}
                        <div className={`w-2 h-2 rounded-full ${(data?.overview?.online_now || 0) > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></div>
                        <span className="text-xs font-bold text-slate-600 dark:text-zinc-400">
                            {data?.overview?.online_now || 0} <span className="text-slate-400 font-normal">online</span>
                        </span>
                    </div>

                    <div className="w-px h-8 bg-slate-100 dark:bg-zinc-800"></div>
                    
                    <button className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors relative">
                        <Bell className="w-5 h-5" />
                    </button>
                    
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-900 dark:bg-white dark:text-zinc-900 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                            AD
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-[1400px] mx-auto p-6 space-y-8">
                
                {/* GRID SUPERIOR - KPI CLEAN */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* KPI 1 - Online */}
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-[0_2px_10px_-4px_rgba(6,81,237,0.1)] border border-slate-50 dark:border-zinc-800/50">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl">
                                <Signal className="w-5 h-5 text-emerald-500" />
                            </div>
                            <span className="text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full text-[10px] font-bold">Status Rede</span>
                        </div>
                        {/* CORREÇÃO AQUI */}
                        <p className="text-3xl font-bold text-slate-800 dark:text-white mb-1">{data?.overview?.online_now || 0}</p>
                        <p className="text-xs text-slate-400">Negociadores conectados</p>
                    </div>

                    {/* KPI 2 - Total */}
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-50 dark:border-zinc-800/50">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/10 rounded-2xl">
                                <Users className="w-5 h-5 text-blue-500" />
                            </div>
                        </div>
                        {/* CORREÇÃO AQUI */}
                        <p className="text-3xl font-bold text-slate-800 dark:text-white mb-1">{data?.overview?.total_users || 0}</p>
                        <p className="text-xs text-slate-400">Total de negociadores cadastrados</p>
                    </div>

                    {/* KPI 3 - Top Page */}
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-50 dark:border-zinc-800/50">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl">
                                <Activity className="w-5 h-5 text-indigo-500" />
                            </div>
                        </div>
                        {/* CORREÇÃO AQUI - Verificação segura do array */}
                        <p className="text-lg font-bold text-slate-800 dark:text-white mb-1 truncate">
                            {data?.top_pages && data.top_pages.length > 0 ? data.top_pages[0].route : "N/A"}
                        </p>
                        <p className="text-xs text-slate-400">Página mais acessada</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 items-start">
                    
                    {/* TABELA PRINCIPAL (CLEAN TABLE) */}
                    <div className="xl:col-span-3 bg-white dark:bg-zinc-900 rounded-[2rem] shadow-sm border border-slate-100 dark:border-zinc-800 overflow-hidden">
                        <div className="px-8 py-6 flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-slate-50 dark:border-zinc-800/50">
                            <h3 className="font-bold text-slate-800 dark:text-white text-lg">
                                Equipe
                            </h3>
                            
                            {/* FILTRO MODERNO */}
                            <div className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-800/50 rounded-full px-4 py-2">
                                <Filter className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wide">Filtrar célula:</span>
                                <select 
                                    value={selectedCell}
                                    onChange={(e) => setSelectedCell(e.target.value)}
                                    className="bg-transparent text-xs font-semibold text-slate-700 dark:text-zinc-200 outline-none cursor-pointer border-none p-0 focus:ring-0"
                                >
                                    {uniqueCells.map(cell => (
                                        <option key={cell} value={cell} className="dark:bg-zinc-800">{cell}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-white dark:bg-zinc-900 text-[10px] uppercase tracking-widest font-bold text-slate-400 dark:text-zinc-600 border-b border-slate-50 dark:border-zinc-800">
                                    <tr>
                                        <th className="px-8 py-4 font-semibold">Usuário</th>
                                        <th className="px-6 py-4 font-semibold">Status</th>
                                        <th className="px-6 py-4 font-semibold">Célula</th>
                                        <th className="px-6 py-4 font-semibold">Atividade</th>
                                        <th className="px-6 py-4 font-semibold">Contexto</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-zinc-800/50">
                                    {currentUsers.map((user) => (
                                        <tr key={user.id} className="group hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                                            <td className="px-8 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${user.is_online ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'} dark:bg-zinc-800`}>
                                                        {user.avatar}
                                                    </div>
                                                    <div>
                                                        <span className="font-semibold text-slate-700 dark:text-zinc-200 text-sm block">
                                                            {user.name}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400">
                                                            {formatRelativeTime(user.last_login)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            
                                            <td className="px-6 py-4">
                                                {user.is_online ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Online
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-slate-300 dark:text-zinc-600">Offline</span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                                                    {user.cell}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4">
                                                <ActivityLevel count={user.actions_today} />
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-zinc-300">
                                                    <Monitor className="w-3.5 h-3.5 text-slate-300" />
                                                    <span className="truncate max-w-[120px]">{user.current_route}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* PAGINAÇÃO MINIMALISTA */}
                        {filteredUsers.length > 0 && (
                            <div className="px-8 py-4 bg-white dark:bg-zinc-900 flex items-center justify-between border-t border-slate-50 dark:border-zinc-800">
                                <span className="text-[10px] text-slate-400">
                                    {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredUsers.length)} de {filteredUsers.length}
                                </span>
                                <div className="flex gap-1">
                                    <button onClick={handlePrevPage} disabled={currentPage === 1} className="p-1.5 rounded-md hover:bg-slate-50 text-slate-400 disabled:opacity-30">
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <button onClick={handleNextPage} disabled={currentPage === totalPages} className="p-1.5 rounded-md hover:bg-slate-50 text-slate-400 disabled:opacity-30">
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* COLUNA LATERAL - MAIS LEVE */}
                    <div className="space-y-6">
                        
                        <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-zinc-800">
                            <h3 className="font-bold text-slate-800 dark:text-white text-sm mb-6 flex items-center gap-2">
                                <ArrowUpRight className="w-4 h-4 text-slate-400" /> Mais Acessados
                            </h3>
                            <div className="space-y-6">
                                {data?.top_pages?.map((page, index) => {
                                    const maxVisits = data.top_pages[0]?.visits || 1;
                                    const percent = (page.visits / maxVisits) * 100;
                                    return (
                                        <div key={page.route} className="group">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-medium text-xs text-slate-600 dark:text-zinc-300 truncate max-w-[140px]">
                                                    {page.route}
                                                </span>
                                                <span className="text-xs font-bold text-slate-900 dark:text-white">{page.visits}</span>
                                            </div>
                                            <div className="w-full bg-slate-50 dark:bg-zinc-800 rounded-full h-1">
                                                <div className={`h-1 rounded-full ${index === 0 ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-zinc-600'}`} style={{ width: `${percent}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* CARD INFORMATIVO */}
                        <div className="bg-gradient-to-br from-slate-800 to-slate-900 dark:from-indigo-900 dark:to-slate-900 rounded-2xl p-6 text-white shadow-xl shadow-slate-400/20 dark:shadow-indigo-900/10 border border-slate-700/50">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                                    <Info className="w-5 h-5 text-indigo-300" />
                                </div>
                                <h4 className="font-bold text-base">Entenda a Métrica</h4>
                            </div>
                            
                            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
                                <p>
                                    A barra de <strong>Intensidade</strong> mede o volume de produção do usuário no dia atual (desde as 00:00).
                                </p>
                                
                                <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                                    <p className="font-bold text-white mb-2 text-[10px] uppercase tracking-wider">O que conta como +1 Ação?</p>
                                    <ul className="space-y-2">
                                        <li className="flex items-start gap-2">
                                            <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></div>
                                            <span><strong>Navegação:</strong> Cada vez que o usuário entra em uma nova tela ou menu.</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></div>
                                            <span><strong>Acessos:</strong> Cliques em detalhes de chamados ou perfis de clientes.</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></div>
                                            <span><strong>Reloads:</strong> Atualizações de página (F5) para buscar novos dados.</span>
                                        </li>
                                    </ul>
                                </div>

                                <p className="opacity-70 italic text-[10px]">
                                    *Ações dentro da mesma página (como abrir um modal) não são contabilizadas nesta versão.
                                </p>
                            </div>
                        </div>


                    </div>
                </div>

                {/* GRÁFICO INTEGRADO AO RODAPÉ */}
                <div className="mt-8">
                    <div className="flex items-center gap-2 mb-4 px-2">
                        <BarChart3 className="w-4 h-4 text-slate-400" />
                        <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Tráfego Horário</h3>
                    </div>
                    <div className="h-[180px] w-full bg-white/50 dark:bg-zinc-900/50 rounded-3xl p-4 border border-slate-100 dark:border-zinc-800/50">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data?.access_curve}>
                                <defs>
                                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                                    cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }}
                                />
                                <Area type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorUsers)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default TelemetriaPage;