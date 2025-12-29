import  { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import TeamModal from "../pages/TeamModal"; 
import NegociadorDashboard from "./NegociadorDashboard"; 
import { api } from "../api/api";
import {
  Target, TrendingUp, AlertTriangle, FileText, BarChart3, Settings,
  CreditCard, PieChart, Search, CalendarCheck, LogOut, PhoneCall,
  ChevronRight, ArrowUpRight, LifeBuoy, Ticket, Activity, HatGlasses
} from "lucide-react";



/* =========================================================
   1. COMPONENTES VISUAIS (Usados pelo Admin)
========================================================= */

const HeroHeader = ({ stats, onOpenTeamModal }: any) => (
  <section className="relative mb-8 overflow-hidden rounded-2xl bg-zinc-950 text-white shadow-xl shadow-zinc-900/10 group">
    <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-soft-light pointer-events-none" />
    <div className="absolute -top-[50px] -right-[50px] w-[300px] h-[300px] bg-zinc-800/50 rounded-full blur-[80px] pointer-events-none" />
    
    <div className="relative z-10 px-8 py-8 flex flex-col md:flex-row gap-6 justify-between items-center">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
           <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-zinc-300 backdrop-blur-md">
            <Activity className="w-3 h-3" /> v2.0
          </span>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Painel Gerencial</h1>
        </div>
        <p className="text-zinc-400 text-sm font-light max-w-xl">Visão estratégica e controle total da operação.</p>
      </div>

      <div className="flex items-center rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm divide-x divide-white/10 h-fit">
        <div className="px-6 py-3 text-center">
          <p className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold mb-0.5">Equipe</p>
          <p className="text-xl font-bold tracking-tighter text-white leading-none">{stats.total}</p>
        </div>
        <div className="px-6 py-3 text-center">
          <p className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold mb-0.5 flex items-center justify-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" /><span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" /></span> Ativos
          </p>
          <p className="text-xl font-bold tracking-tighter text-white leading-none">{stats.ativos}</p>
        </div>
        <button onClick={onOpenTeamModal} className="px-5 hover:bg-white/5 transition-colors group flex items-center justify-center self-stretch">
          <Settings className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
        </button>
      </div>
    </div>
  </section>
);

const ShortcutCard = ({ label, icon: Icon, path, navigate }: any) => (
  <button 
    onClick={() => path && navigate(path)} 
    // MUDANÇAS AQUI: dark:bg-zinc-900, dark:border-zinc-800
    className="group relative flex flex-col justify-between h-32 p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl transition-all duration-300 hover:border-zinc-400 hover:shadow-lg hover:shadow-zinc-200/50 active:scale-[0.98]"
  >
    {/* MUDANÇAS AQUI: dark:bg-zinc-800, dark:text-zinc-100 */}
    <div className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-full bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-100 dark:border-zinc-700 group-hover:bg-black group-hover:text-white group-hover:border-black transition-colors duration-300">
      <Icon className="w-5 h-5" />
    </div>
    {/* MUDANÇAS AQUI: dark:text-zinc-100 */}
    <div className="pr-4"><p className="font-bold text-zinc-800 dark:text-zinc-100 text-base leading-tight group-hover:text-black dark:group-hover:text-white">{label}</p></div>
    <ArrowUpRight className="absolute top-6 right-6 w-4 h-4 text-zinc-300 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:-translate-y-1 group-hover:translate-x-1" />
  </button>
);

const NavCard = ({ label, desc, icon: Icon, path, navigate }: any) => (
  <div 
    onClick={() => path && navigate(path)} 
    className="group flex items-start gap-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 transition-all duration-200 hover:border-zinc-300 hover:shadow-md cursor-pointer"
  >
    <div className="shrink-0 mt-1"><div className="h-8 w-8 rounded-lg bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 border border-zinc-100 dark:border-zinc-700 group-hover:bg-zinc-900 group-hover:text-white group-hover:border-zinc-900 transition-colors duration-300"><Icon className="w-4 h-4" /></div></div>
    <div className="flex-1 min-w-0">
        {/* MUDANÇAS AQUI: dark:text-zinc-100 */}
        <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100 group-hover:text-black dark:group-hover:text-white transition-colors">{label}</p>
        <p className="text-[11px] font-medium text-zinc-400 truncate mt-0.5 group-hover:text-zinc-500">{desc}</p>
    </div>
    <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-200"><ChevronRight className="w-4 h-4 text-zinc-400" /></div>
  </div>
);

/* =========================================================
   2. ADMIN DASHBOARD
========================================================= */
function AdminDashboard({ user, onLogout }: any) {
  const navigate = useNavigate();
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [stats, setStats] = useState({ total: 0, ativos: 0 });

  useEffect(() => {
    const carregarStats = async () => {
      try {
        // ✅ CORREÇÃO: Usando api.get em vez de fetch puro
        // Isso garante que o header 'ngrok-skip-browser-warning' seja enviado
        const response = await api.get("/users");
        
        const data = response.data;
        
        // Blindagem simples caso o backend mande algo diferente de array
        const listaUsuarios = Array.isArray(data) ? data : [];

        const total = listaUsuarios.length;
        
        // Contagem de ativos (garantindo conversão de string/boolean)
        const ativos = listaUsuarios.filter((u: any) => 
            u.ativo === true || String(u.ativo) === "true"
        ).length;

        setStats({ total, ativos });

      } catch (error) {
        console.error("Erro ao carregar estatísticas:", error);
        // Não zeramos o stats aqui para manter o cache visual se falhar momentaneamente
      }
    };

    carregarStats();
  }, [isTeamModalOpen]); // Recarrega sempre que fechar o modal de equipe

  const HIGHLIGHTS = [
    { label: "Painel de Objetivo", icon: Target, path: "/painel-objetivo" },
    { label: "Resumo de Objetivo", icon: TrendingUp, path: "/resumo-objetivo" },
    { label: "Monitoramento de operação", icon: HatGlasses, path: "/monitoramento" },
    { label: "Pendências do Sistema", icon: AlertTriangle, path: "/pendencias" },
  ];
  const STRATEGY_MENU = [
    { label: "Composição da Carteira", desc: "Análise detalhada de saldos.", icon: PieChart, path: "/composicao-carteira" },
    { label: "Acionamentos por Negociador", desc: "Produtividade da equipe.", icon: PhoneCall, path: "/acionamentos" },
    { label: "Negociador por Célula", desc: "Performance individual.", icon: BarChart3, path: "/negociador-celula" },
    { label: "Relatórios Consolidados", desc: "Exportação de dados.", icon: FileText, path: null },
    
  ];
  const OPERATIONAL_MENU = [
    { label: "Painel de Acionamento", desc: "Monitoramento de réguas.", icon: Target, path: "/resumo-acionamentos" },
    { label: "Consultar Cliente", desc: "Busca rápida de contratos.", icon: Search, path: "/consultar-cliente" },
    { label: "Pagamentos e Previsões", desc: "Análise financeira.", icon: CalendarCheck, path: "/pagamentos-previsoes" },
    { label: "Dashboard Carteira", desc: "Receita prevista.", icon: CreditCard, path: "/dashboard-carteira" },
  ];
  const SUPPORT_MENU = [
    { label: "Abrir Chamado Técnico", desc: "Reportar problemas.", icon: LifeBuoy, path: "/abrir-chamado" },
    { label: "Painel de Chamados", desc: "Acompanhar solicitações.", icon: Ticket, path: "/painel-chamados" },
  ];

  return (
    // 1. MUDANÇA NO CONTAINER PRINCIPAL: dark:bg-zinc-950, dark:text-zinc-100
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-24 font-sans text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      
      {/* 2. MUDANÇA NO HEADER: dark:bg-zinc-950/90, dark:border-zinc-800 */}
      <header className="sticky top-0 z-50 bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-8 py-5 transition-colors duration-300">
        <div className="mx-auto max-w-[1600px] flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Link to="/" className="cursor-pointer group">
                    {/* dark:text-white */}
                    <span className="text-3xl font-black tracking-tighter text-zinc-900 dark:text-white group-hover:text-zinc-600 transition-colors">MCSA</span>
                </Link>
                {/* dark:bg-zinc-800, dark:border-zinc-700, dark:text-zinc-300 */}
                <span className="hidden md:inline-flex px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-xs font-medium text-zinc-500 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                    {user?.name || "Usuário"} ({user?.access_level || "Admin"})
                </span>
            </div>
            {/* dark:bg-zinc-900, dark:border-zinc-700, dark:text-zinc-300 */}
            <button onClick={onLogout} className="group flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-5 py-2 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-300 hover:border-zinc-900 dark:hover:border-zinc-100 hover:bg-zinc-900 dark:hover:bg-zinc-100 hover:text-white dark:hover:text-zinc-900 transition-all shadow-sm">
                <LogOut className="w-3.5 h-3.5" />Sair
            </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-6 md:px-8 pt-10">
        <HeroHeader stats={stats} onOpenTeamModal={() => setIsTeamModalOpen(true)} />
        
        <section className="mb-16">
            <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-6 px-1 flex items-center gap-2"><div className="w-1 h-1 bg-zinc-400 rounded-full"></div> Acesso Rápido</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">{HIGHLIGHTS.map((item, i) => (<ShortcutCard key={i} {...item} navigate={navigate} />))}</div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 xl:gap-12">
          {/* Coluna 1 - Títulos com dark:text-zinc-100 e Bordas dark:border-zinc-800 */}
          <div>
              <div className="flex items-center gap-3 mb-5 px-1 pb-2 border-b border-zinc-200 dark:border-zinc-800">
                  <BarChart3 className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
                  <h2 className="text-xs font-black text-zinc-900 dark:text-zinc-100 tracking-tight uppercase">Estratégia</h2>
              </div>
              <div className="grid gap-3">{STRATEGY_MENU.map((item, i) => (<NavCard key={i} {...item} navigate={navigate} />))}</div>
          </div>
          
          {/* Coluna 2 */}
          <div>
              <div className="flex items-center gap-3 mb-5 px-1 pb-2 border-b border-zinc-200 dark:border-zinc-800">
                  <Target className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
                  <h2 className="text-xs font-black text-zinc-900 dark:text-zinc-100 tracking-tight uppercase">Operacional</h2>
              </div>
              <div className="grid gap-3">{OPERATIONAL_MENU.map((item, i) => (<NavCard key={i} {...item} navigate={navigate} />))}</div>
          </div>
          
          {/* Coluna 3 */}
          <div className="lg:pl-4">
            <div className="flex items-center gap-3 mb-5 px-1 pb-2 border-b border-zinc-200 dark:border-zinc-800">
                <LifeBuoy className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
                <h2 className="text-xs font-black text-zinc-900 dark:text-zinc-100 tracking-tight uppercase">Suporte</h2>
            </div>
            
            <div className="grid gap-3">
                {SUPPORT_MENU.map((item, i) => (<NavCard key={i} {...item} navigate={navigate} />))}
                
                {/* 3. CARD DE CONFIGURAÇÕES (Dark Mode) */}
                <div className="mt-6 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-center shadow-sm hover:border-zinc-300 transition-colors">
                    <div className="mx-auto w-10 h-10 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-100 dark:border-zinc-700 mb-3 text-zinc-600 dark:text-zinc-400">
                        <Settings className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Configurações</h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 mb-4 leading-relaxed">
                        Gerencie usuários e preferências.
                    </p>
                    {/* Botão Acessar (Geralmente mantém a cor de destaque, ou adapta) */}
                    <button 
                        onClick={() => navigate('/ConfigPage')} 
                        className="w-full py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-xs font-bold uppercase tracking-wide hover:bg-black dark:hover:bg-white hover:shadow-lg transition-all active:scale-[0.98]"
                    >
                        Acessar
                    </button>
                </div>
            </div>
          </div>
        </section>
      </main>
      
      <TeamModal isOpen={isTeamModalOpen} onClose={() => setIsTeamModalOpen(false)} />
    </div>
  );
}

/* =========================================================
   3. LÓGICA DE ROTEAMENTO (Admin vs Negociador)
========================================================= */
export default function Index() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            const parsed = JSON.parse(storedUser);
            setUser(parsed);
        } else {
            navigate("/login");
        }
    } catch (e) {
        localStorage.clear();
        navigate("/login");
    } finally {
        setChecking(false);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  if (checking) return null;

  const nivel = (user?.access_level || user?.cargo || "").toString().toLowerCase();
  
  // SE FOR NEGOCIADOR -> CHAMA O COMPONENTE NOVO (IMPORTADO)
  if (nivel.includes("negociador") || nivel.includes("cobranca")) {
    return <NegociadorDashboard user={user} onLogout={handleLogout} />;
  }

  // SE FOR ADMIN/TECNOLOGIA -> CHAMA O ADMIN DASHBOARD (INLINE AQUI)
  return <AdminDashboard user={user} onLogout={handleLogout} />;
}