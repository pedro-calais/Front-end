import { useState } from 'react';
import { Link } from "react-router-dom";
import { 
  User, Moon, Sun, CheckCircle2, Bell, 
  Shield, Mail, Building2, CalendarClock, Fingerprint 
} from 'lucide-react';

import { useTheme } from '../contexts/ThemeContext'; 

const ConfigPage = () => {
  const { theme, toggleTheme } = useTheme(); 
  const [activeTab, setActiveTab] = useState('perfil');

  // --- ESTADO DO USUÁRIO (Leitura do LocalStorage) ---
  const [user] = useState(() => {
    try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            const parsed = JSON.parse(storedUser);
            return {
                name: parsed.name || parsed.username || 'Usuário MCSA',
                email: parsed.email || 'usuario@mcsa.com.br',
                avatar: parsed.avatar || 'https://github.com/shadcn.png',
                role: parsed.access_level || 'Analista',
                cell: parsed.cell || parsed.celula || 'Geral', // Célula
                lastLogin: parsed.last_login ? new Date(parsed.last_login).toLocaleDateString('pt-BR', {
                    day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute:'2-digit'
                }) : 'Primeiro Acesso',
                id: parsed.id || '000'
            };
        }
    } catch (e) {
        console.error("Erro ao ler usuário", e);
    }
    return {
        name: 'Visitante',
        email: 'visitante@mcsa.com.br',
        avatar: 'https://github.com/shadcn.png',
        role: 'Visualizador',
        cell: 'N/A',
        lastLogin: 'Agora',
        id: '---'
    };
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      
      {/* --- HEADER --- */}
      <header className="sticky top-0 z-50 bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-8 py-5 flex items-center justify-between transition-colors duration-300">
        <div className="flex items-center gap-12">
            <Link to="/" className="text-3xl font-black tracking-tighter text-zinc-900 dark:text-white flex items-center gap-1 cursor-pointer">MCSA</Link>
            <nav className="hidden md:flex items-center gap-8">
                <Link to="/" className="text-sm font-bold text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors pb-1">Visão Geral</Link>
                <span className="text-sm font-bold text-zinc-900 dark:text-white border-b-2 border-zinc-900 dark:border-white pb-1 cursor-default">Minha Conta</span>
            </nav>
        </div>
        <div className="flex items-center gap-6">
            <button className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors relative">
              <Bell className="w-5 h-5" />
            </button>
            <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-800"></div>
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-zinc-900 dark:bg-white dark:text-zinc-900 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>
            </div>
        </div>
      </header>

      {/* --- MAIN CONTAINER --- */}
      <main className="max-w-[1200px] mx-auto px-6 md:px-8 py-10 pb-20">
        
        <div className="mb-8">
            <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight uppercase mb-1">Minha Conta</h1>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium text-sm">Visualize suas informações de cadastro e preferências de sistema.</p>
        </div>
        
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 min-h-[500px] flex flex-col md:flex-row overflow-hidden transition-colors duration-300">
          
          {/* SIDEBAR INTERNA */}
          <div className="w-full md:w-64 border-r border-zinc-200 dark:border-zinc-800 p-4 space-y-1 bg-zinc-50/50 dark:bg-zinc-900/50">
            <button onClick={() => setActiveTab('perfil')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'perfil' ? 'bg-white shadow-sm border border-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white' : 'text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/50'}`}>
              <User className="w-4 h-4" /> Dados do Usuário
            </button>
            <button onClick={() => setActiveTab('aparencia')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'aparencia' ? 'bg-white shadow-sm border border-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white' : 'text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/50'}`}>
              {theme === 'light' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />} Preferências
            </button>
          </div>

          {/* CONTEÚDO DAS ABAS */}
          <div className="flex-1 p-8 md:p-12 bg-white dark:bg-zinc-900 transition-colors duration-300">
            
            {/* === ABA: PERFIL (READ ONLY) === */}
            {activeTab === 'perfil' && (
              <div className="animate-fade-in-up">
                <div className="flex items-center gap-6 mb-10">
                  <div>
                    <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">{user.name}</h2>
                    <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide border border-zinc-200 dark:border-zinc-700">
                            {user.role}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Ativo
                        </span>
                    </div>
                  </div>
                </div>

                {/* GRID DE INFORMAÇÕES */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Item: Email */}
                    <div className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                        <div className="flex items-center gap-2 mb-2 text-zinc-400 dark:text-zinc-500 text-xs font-bold uppercase tracking-wider">
                            <Mail className="w-3.5 h-3.5" /> E-mail Corporativo
                        </div>
                        <p className="text-zinc-900 dark:text-zinc-200 font-medium">{user.email}</p>
                    </div>

                    {/* Item: Célula */}
                    <div className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                        <div className="flex items-center gap-2 mb-2 text-zinc-400 dark:text-zinc-500 text-xs font-bold uppercase tracking-wider">
                            <Building2 className="w-3.5 h-3.5" /> Célula Operacional
                        </div>
                        <p className="text-zinc-900 dark:text-zinc-200 font-medium">{user.cell}</p>
                    </div>

                    {/* Item: ID */}
                    <div className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                        <div className="flex items-center gap-2 mb-2 text-zinc-400 dark:text-zinc-500 text-xs font-bold uppercase tracking-wider">
                            <Fingerprint className="w-3.5 h-3.5" /> ID do Usuário
                        </div>
                        <p className="font-mono text-zinc-900 dark:text-zinc-200">#{user.id}</p>
                    </div>

                    {/* Item: Acesso */}
                    <div className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                        <div className="flex items-center gap-2 mb-2 text-zinc-400 dark:text-zinc-500 text-xs font-bold uppercase tracking-wider">
                            <Shield className="w-3.5 h-3.5" /> Nível de Acesso
                        </div>
                        <p className="text-zinc-900 dark:text-zinc-200 font-medium capitalize">{user.role}</p>
                    </div>
                </div>

                <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2 text-xs text-zinc-400">
                    <CalendarClock className="w-3.5 h-3.5" />
                    Último login registrado em: <span className="font-mono text-zinc-600 dark:text-zinc-300">{user.lastLogin}</span>
                </div>
              </div>
            )}

            {/* === ABA: APARÊNCIA === */}
            {activeTab === 'aparencia' && (
              <div className="max-w-xl animate-fade-in-up">
                <h2 className="text-lg font-bold mb-1 text-zinc-900 dark:text-white">Aparência</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">Personalize sua experiência visual no MCSA.</p>

                <div className="grid grid-cols-2 gap-4">
                  {/* Card Light */}
                  <button 
                    onClick={() => toggleTheme('light')}
                    className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                      theme === 'light' 
                        ? 'border-zinc-900 bg-zinc-50 dark:bg-zinc-800' 
                        : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600'
                    }`}
                  >
                    <div className="bg-white border border-zinc-200 rounded-lg p-3 mb-3 shadow-sm">
                      <div className="h-2 w-16 bg-zinc-200 rounded mb-2"></div>
                      <div className="h-2 w-full bg-zinc-100 rounded mb-1"></div>
                      <div className="h-2 w-2/3 bg-zinc-100 rounded"></div>
                    </div>
                    <div className="flex items-center gap-2 font-bold text-sm text-zinc-900 dark:text-white">
                      <Sun className="w-4 h-4" /> Claro
                    </div>
                    {theme === 'light' && <div className="absolute top-4 right-4 text-zinc-900 dark:text-white"><CheckCircle2 className="w-5 h-5"/></div>}
                  </button>

                  {/* Card Dark */}
                  <button 
                    onClick={() => toggleTheme('dark')}
                    className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                      theme === 'dark' 
                        ? 'border-zinc-100 bg-zinc-800 dark:border-white' 
                        : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500'
                    }`}
                  >
                    <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 mb-3 shadow-sm">
                      <div className="h-2 w-16 bg-zinc-700 rounded mb-2"></div>
                      <div className="h-2 w-full bg-zinc-800 rounded mb-1"></div>
                      <div className="h-2 w-2/3 bg-zinc-800 rounded"></div>
                    </div>
                    <div className="flex items-center gap-2 font-bold text-sm text-zinc-900 dark:text-white">
                      <Moon className="w-4 h-4" /> Escuro
                    </div>
                    {theme === 'dark' && <div className="absolute top-4 right-4 text-zinc-900 dark:text-white"><CheckCircle2 className="w-5 h-5"/></div>}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
};

export default ConfigPage;