import { useNavigate, Link } from "react-router-dom";
import {
  PhoneCall, Search,  TrendingUp, LogOut, 
  ChevronRight, ArrowUpRight, LifeBuoy, Ticket, 
  Activity, Wallet, Calculator, PieChart, CreditCard, PlusSquare, Settings
} from "lucide-react";

/* =========================================================
   1. COMPONENTES VISUAIS (Com suporte a Dark Mode)
========================================================= */

const HeroHeader = ({ user }: any) => (
  // HeroHeader já é escuro por padrão (zinc-950), então geralmente não precisa de dark mode específico,
  // mas garantimos que ele se destaque.
  <section className="relative mb-8 overflow-hidden rounded-2xl bg-zinc-950 text-white shadow-xl shadow-zinc-900/10 group">
    <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-soft-light pointer-events-none" />
    <div className="absolute -top-[50px] -right-[50px] w-[300px] h-[300px] bg-blue-900/50 rounded-full blur-[80px] pointer-events-none" />
    
    <div className="relative z-10 px-8 py-8 flex flex-col md:flex-row gap-6 justify-between items-center">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
           <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-blue-200 backdrop-blur-md">
            <Activity className="w-3 h-3" /> 
          </span>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Área do Negociador</h1>
        </div>
        <p className="text-zinc-400 text-sm font-light max-w-xl"> Bom trabalho, {user?.name?.split(' ')[0] || 'Parceiro'}!</p>
      </div>

      <div className="flex items-center rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm divide-x divide-white/10 h-fit">
        <div className="px-6 py-3 text-center">
          <p className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold mb-0.5">Meu objetivo</p>
          <p className="text-xl font-bold tracking-tighter text-white leading-none">--%</p>
        </div>
        <div className="px-6 py-3 text-center">
          <p className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold mb-0.5">Comissão</p>
          <p className="text-xl font-bold tracking-tighter text-emerald-400 leading-none">R$ --</p>
        </div>
      </div>
    </div>
  </section>
);

const ShortcutCard = ({ label, icon: Icon, path, navigate }: any) => (
  <button 
    onClick={() => path && navigate(path)} 
    // MUDANÇA: dark:bg-zinc-900, dark:border-zinc-800
    className="group relative flex flex-col justify-between h-32 p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl transition-all duration-300 hover:border-zinc-400 hover:shadow-lg hover:shadow-zinc-200/50 active:scale-[0.98]"
  >
    {/* MUDANÇA: dark:bg-zinc-800, dark:text-zinc-100, dark:border-zinc-700 */}
    <div className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-full bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-100 dark:border-zinc-700 group-hover:bg-black dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-zinc-900 group-hover:border-black transition-colors duration-300">
      <Icon className="w-5 h-5" />
    </div>
    {/* MUDANÇA: dark:text-zinc-100 */}
    <div className="pr-4 text-left"><p className="font-bold text-zinc-800 dark:text-zinc-100 text-base leading-tight group-hover:text-black dark:group-hover:text-white">{label}</p></div>
    <ArrowUpRight className="absolute top-6 right-6 w-4 h-4 text-zinc-300 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:-translate-y-1 group-hover:translate-x-1" />
  </button>
);

const NavCard = ({ label, desc, icon: Icon, path, navigate }: any) => (
  <div 
    onClick={() => path && navigate(path)} 
    // MUDANÇA: dark:bg-zinc-900, dark:border-zinc-800
    className="group flex items-start gap-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 transition-all duration-200 hover:border-zinc-300 hover:shadow-md cursor-pointer"
  >
    {/* MUDANÇA: dark:bg-zinc-800, dark:text-zinc-400, dark:border-zinc-700 */}
    <div className="shrink-0 mt-1"><div className="h-8 w-8 rounded-lg bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 border border-zinc-100 dark:border-zinc-700 group-hover:bg-zinc-900 dark:group-hover:bg-zinc-100 group-hover:text-white dark:group-hover:text-zinc-900 group-hover:border-zinc-900 transition-colors duration-300"><Icon className="w-4 h-4" /></div></div>
    <div className="flex-1 min-w-0">
        {/* MUDANÇA: dark:text-zinc-100 */}
        <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100 group-hover:text-black dark:group-hover:text-white transition-colors">{label}</p>
        <p className="text-[11px] font-medium text-zinc-400 truncate mt-0.5 group-hover:text-zinc-500">{desc}</p>
    </div>
    <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-200"><ChevronRight className="w-4 h-4 text-zinc-400" /></div>
  </div>
);

/* =========================================================
   2. TELA PRINCIPAL
========================================================= */
export default function NegociadorDashboard({ user, onLogout }: any) {
  const navigate = useNavigate();
  const currentUser = user || JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogoutLocal = () => {
    if (onLogout) onLogout();
    else {
        localStorage.clear();
        navigate("/login");
    }
  };

  const HIGHLIGHTS = [
    { label: "Painel de Acionamento", icon: PhoneCall, path: "/resumo-acionamentos" },
    { label: "Consultar Cliente", icon: Search, path: "/consultar-cliente" },
    { label: "Composição Carteira", icon: PieChart, path: "/carteira-negociador" },
    { label: "Calculadora", icon: Calculator, path: "/simulador" }, 
  ];

  const REPORTS_MENU = [
    { label: "Pagamentos & Previsões", desc: "Controle financeiro.", icon: CreditCard, path: "/pagamentos-previsoes" },
    { label: "Meus Resultados", desc: "Desempenho individual.", icon: TrendingUp, path: "/meus-resultados" },
  ];

  const SUPPORT_MENU = [
    { label: "Cadastrar Chamado", desc: "Abrir solicitação técnica.", icon: PlusSquare, path: "/abrir-chamado" },
    { label: "Painel de Chamados", desc: "Acompanhar minhas solicitações.", icon: Ticket, path: "/painel-chamados" },
  ];

  return (
    // MUDANÇA: dark:bg-zinc-950, dark:text-zinc-100
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-24 font-sans text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      
      {/* NAVBAR */}
      {/* MUDANÇA: dark:bg-zinc-950/90, dark:border-zinc-800 */}
      <header className="sticky top-0 z-50 bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-8 py-5 transition-all">
        <div className="mx-auto max-w-[1600px] flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Link to="/" className="cursor-pointer group">
                    {/* MUDANÇA: dark:text-white */}
                    <span className="text-3xl font-black tracking-tighter text-zinc-900 dark:text-white group-hover:text-zinc-600 transition-colors">MCSA</span>
                </Link>
                {/* MUDANÇA: dark:bg-zinc-800, dark:text-zinc-400, dark:border-zinc-700 */}
                <span className="hidden md:inline-flex px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-xs font-medium text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                    {currentUser?.name || "Negociador"}
                </span>
            </div>
            <div className="flex items-center gap-3">
                {/* Ícone de Ajustes */}
                {/* MUDANÇA: dark:bg-zinc-900, dark:border-zinc-700, dark:text-zinc-400, dark:hover:bg-white dark:hover:text-zinc-900 */}
                <button 
                  onClick={() => navigate('/ConfigPage')} 
                  className="group flex items-center justify-center w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:border-zinc-900 dark:hover:border-zinc-100 hover:bg-zinc-900 dark:hover:bg-zinc-100 hover:text-white dark:hover:text-zinc-900 transition-all shadow-sm"
                  title="Configurações"
                >
                  <Settings className="w-4 h-4" />
                </button>

                {/* Botão Sair */}
                <button onClick={handleLogoutLocal} className="group flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-5 py-2 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 hover:border-zinc-900 dark:hover:border-zinc-100 hover:bg-zinc-900 dark:hover:bg-zinc-100 hover:text-white dark:hover:text-zinc-900 transition-all shadow-sm">
                    <LogOut className="w-3.5 h-3.5" /> Sair
                </button>
            </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-6 md:px-8 pt-10">
        
        <HeroHeader user={currentUser} />
        
        {/* BLOCO DE ACESSO RÁPIDO */}
        <section className="mb-16">
            <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-6 px-1 flex items-center gap-2"><div className="w-1 h-1 bg-zinc-400 rounded-full"></div> Rotina Diária</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">{HIGHLIGHTS.map((item, i) => (<ShortcutCard key={i} {...item} navigate={navigate} />))}</div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 xl:gap-12">
          
          {/* COLUNA FINANCEIRO/RELATÓRIOS */}
          <div>
            {/* MUDANÇA: dark:border-zinc-800 */}
            <div className="flex items-center gap-3 mb-5 px-1 pb-2 border-b border-zinc-200 dark:border-zinc-800">
                {/* MUDANÇA: dark:text-zinc-100 */}
                <Wallet className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
                <h2 className="text-xs font-black text-zinc-900 dark:text-zinc-100 tracking-tight uppercase">Relatórios</h2>
            </div>
            <div className="grid gap-3">{REPORTS_MENU.map((item, i) => (<NavCard key={i} {...item} navigate={navigate} />))}</div>
          </div>

          {/* COLUNA SUPORTE (USER) */}
          <div>
            <div className="flex items-center gap-3 mb-5 px-1 pb-2 border-b border-zinc-200 dark:border-zinc-800">
                <LifeBuoy className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
                <h2 className="text-xs font-black text-zinc-900 dark:text-zinc-100 tracking-tight uppercase">Suporte / Usuário</h2>
            </div>
            <div className="grid gap-3">{SUPPORT_MENU.map((item, i) => (<NavCard key={i} {...item} navigate={navigate} />))}</div>
          </div>

        </section>
      </main>
    </div>
  );
}