import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
    Target, TrendingUp, Calendar, ArrowUpRight, 
    BarChart3, Medal, Users, Trophy
} from "lucide-react";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from "../api/api"; 

const MeusResultadosPage = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [user, setUser] = useState<any>({});

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            const u = JSON.parse(storedUser);
            setUser(u);
            fetchPerformance(u.id);
        }
    }, []);

    const fetchPerformance = async (userId: number) => {
        try {
            const response = await api.post('/telemetry/my-performance', { user_id: userId });
            setData(response.data);
        } catch (error) {
            console.error("Erro ao carregar performance", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !data) return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-zinc-950 flex items-center justify-center text-slate-400">
            <div className="animate-pulse flex flex-col items-center">
                <div className="h-4 w-32 bg-slate-300 rounded mb-4"></div>
                <div className="text-sm">Carregando métricas...</div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-zinc-950 font-sans text-slate-900 dark:text-zinc-100 pb-20">
            
            {/* HEADER */}
            <header className="sticky top-0 z-50 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800 px-8 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-12">
                    <Link to="/" className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white">MCSA</Link>
                    <div className="text-sm font-bold text-slate-900 dark:text-white border-b-2 border-slate-900 dark:border-white pb-1">
                        Minha Performance
                    </div>
                </div>
                <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-md">
                    {user.name?.[0]}
                </div>
            </header>

            <div className="max-w-[1200px] mx-auto p-6 md:p-8 space-y-8">

                {/* --- HERO: DARK PREMIUM CARD --- */}
                {/* Mudança: Gradiente escuro (Slate/Violet Black) */}
                <div className="relative bg-gradient-to-br from-slate-900 via-[#1a103c] to-black rounded-[2rem] p-8 text-white shadow-2xl shadow-slate-900/20 overflow-hidden border border-white/5">
                    {/* Background Detail */}
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Target className="w-80 h-80 -rotate-12" />
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex items-center gap-8 w-full md:w-auto">
                            {/* Score Circle */}
                            <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                                {/* Fundo do Score */}
                                <div className="absolute inset-0 border-4 border-white/5 rounded-full"></div>
                                {/* Progresso */}
                                <svg className="absolute inset-0 w-full h-full -rotate-90">
                                    <circle cx="56" cy="56" r="52" fill="transparent" stroke="#6366f1" strokeWidth="6" 
                                            strokeLinecap="round"
                                            strokeDasharray="326" 
                                            strokeDashoffset={326 - (326 * data.main_kpi.percentage) / 100} 
                                            className="transition-all duration-1000 ease-out shadow-[0_0_20px_#6366f1]" />
                                </svg>
                                <div className="flex flex-col items-center">
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Score</span>
                                    <span className="text-5xl font-black tracking-tighter">{data.main_kpi.score}</span>
                                </div>
                            </div>
                            
                            <div className="flex-1">
                                <h1 className="text-3xl font-bold mb-1 tracking-tight">Olá, {user.name.split(' ')[0]}!</h1>
                                <p className="text-slate-400 text-sm mb-6 max-w-md">
                                    Seu desempenho atual na célula <strong>{data.cell_stats.name}</strong>.
                                </p>
                                
                                {/* Barra de Progresso da Meta */}
                                <div className="w-full md:w-[450px]">
                                    <div className="flex justify-between text-xs font-bold mb-2 text-slate-300">
                                        <span>Volume: <span className="text-white">{data.main_kpi.current}</span></span>
                                        <span>Meta: <span className="text-white">{data.main_kpi.target}</span></span>
                                    </div>
                                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                                        <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.6)] transition-all duration-1000" 
                                             style={{ width: `${data.main_kpi.percentage}%` }}></div>
                                    </div>
                                    <div className="flex justify-between mt-2">
                                         <p className="text-[10px] text-slate-500">
                                            Atualizado agora
                                        </p>
                                        <p className="text-[10px] text-indigo-400 font-bold">
                                            {data.main_kpi.percentage}% Atingido
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Card destaque direita */}
                         <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 flex flex-col items-center min-w-[160px]">
                            <TrendingUp className="w-8 h-8 text-emerald-400 mb-2" />
                            <span className="text-3xl font-black">{data.cell_stats.comparison}%</span>
                            <span className="text-[10px] uppercase tracking-wide font-bold text-slate-400 text-center">da Média da Equipe</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* --- COLUNA ESQUERDA (2/3) --- */}
                    <div className="lg:col-span-2 space-y-8">
                        
                        {/* GRÁFICO */}
                        <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-zinc-800">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-indigo-500" /> Ritmo de Produção (Hoje)
                                </h3>
                            </div>
                            <div className="h-[220px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={data.performance_curve}>
                                        <defs>
                                            <linearGradient id="colorMe" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                                        />
                                        <Area type="monotone" dataKey="target" stroke="#cbd5e1" strokeWidth={2} fill="transparent" strokeDasharray="5 5" />
                                        <Area type="monotone" dataKey="me" stroke="#6366f1" strokeWidth={3} fill="url(#colorMe)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* KPIs COMPARATIVOS */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* KPI 1: Volume Diário */}
                            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-slate-100 dark:border-zinc-800">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-zinc-400 font-bold uppercase">Volume Hoje</p>
                                        <h4 className="text-2xl font-black text-slate-800 dark:text-white mt-1">
                                            {data.actions_today} <span className="text-xs font-medium text-slate-400">ações</span>
                                        </h4>
                                    </div>
                                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-500">
                                        <Target className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="mt-2 text-xs text-slate-400">
                                    Meta diária sugerida: 200
                                </div>
                            </div>

                            {/* KPI 2: Comparativo com Célula (SUBSTITUIU TEMPO PRODUTIVO) */}
                            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-slate-100 dark:border-zinc-800">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-zinc-400 font-bold uppercase">Média da Célula</p>
                                        <h4 className="text-2xl font-black text-slate-800 dark:text-white mt-1">
                                            {data.cell_stats.avg_total} <span className="text-xs font-medium text-slate-400">/mês</span>
                                        </h4>
                                    </div>
                                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-500">
                                        <Users className="w-4 h-4" />
                                    </div>
                                </div>
                                
                                <div className="mt-3">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                                        <span>Você vs Média</span>
                                        <span>{data.cell_stats.comparison}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${data.cell_stats.comparison >= 100 ? 'bg-emerald-500' : 'bg-yellow-500'}`} 
                                             style={{ width: `${Math.min(data.cell_stats.comparison, 100)}%` }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- COLUNA DIREITA (1/3) --- */}
                    <div className="space-y-8">
                        
                        {/* NOVO: TOP NEGOCIADORES */}
                        <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-zinc-800">
                            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-6 text-sm uppercase tracking-wide">
                                <Trophy className="w-4 h-4 text-yellow-500" /> Top {data.cell_stats.name}
                            </h3>
                            
                            <div className="space-y-4">
                                {data.ranking.map((rankUser: any) => (
                                    <div key={rankUser.pos} className={`flex items-center justify-between p-3 rounded-xl border ${rankUser.is_me ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800' : 'bg-white dark:bg-zinc-900 border-slate-100 dark:border-zinc-800'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${rankUser.pos === 1 ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-500'}`}>
                                                {rankUser.pos}º
                                            </div>
                                            <div>
                                                <p className={`text-xs font-bold ${rankUser.is_me ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-zinc-300'}`}>
                                                    {rankUser.name}
                                                </p>
                                                <p className="text-[10px] text-slate-400">
                                                    {rankUser.total} ações
                                                </p>
                                            </div>
                                        </div>
                                        {rankUser.pos === 1 && <Medal className="w-4 h-4 text-yellow-500" />}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* HISTÓRICO */}
                        <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-zinc-800">
                            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-6 text-sm uppercase tracking-wide">
                                <Calendar className="w-4 h-4 text-slate-400" /> Histórico
                            </h3>

                            <div className="space-y-4">
                                {data.history.map((item: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-zinc-950/50 border border-slate-100 dark:border-zinc-800">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center text-[10px] font-bold ${item.status === 'batida' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-yellow-100 text-yellow-700'}`}>
                                                <span>{item.month}</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-700 dark:text-zinc-200">
                                                    {item.status === 'batida' ? 'Meta Atingida' : 'Parcial'}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`text-sm font-black ${item.status === 'batida' ? 'text-emerald-500' : 'text-yellow-500'}`}>
                                            {item.value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* FEEDBACK (DICA) */}
                        <div className="bg-slate-900 dark:bg-black rounded-3xl p-6 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <ArrowUpRight className="w-20 h-20" />
                            </div>
                            <h4 className="font-bold text-lg mb-2 z-10 relative">Análise do Gerente</h4>
                            <p className="text-xs text-slate-300 leading-relaxed z-10 relative">
                                Você está no Top 3 da sua célula! Mantenha a consistência nos horários de pico (10h e 15h) para buscar o 1º lugar.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MeusResultadosPage;