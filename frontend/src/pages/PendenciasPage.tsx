// --- IMPORTS ---
import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LogOut,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Filter,
  Plus,
  Loader2,
  Check,
  ArrowUpDown, 
  ArrowUp,     
  ArrowDown    
} from "lucide-react";

// --- TIPOS ---
type Status = 'pendente' | 'em_progresso' | 'concluido';
type Prioridade = 'alta' | 'media' | 'baixa';

interface Tarefa {
  id: string;
  titulo: string;
  descricao: string;
  setor: string;
  status: Status;
  prioridade: Prioridade;
}

// Configuração da Ordenação
type SortConfig = {
  key: keyof Tarefa;
  direction: 'asc' | 'desc';
} | null;

export default function PendenciasPage() {
  const navigate = useNavigate();
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [loading, setLoading] = useState(true);
  const [atualizandoId, setAtualizandoId] = useState<string | null>(null);

  // --- NOVO: Estado de Ordenação ---
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  // --- INTEGRAÇÃO COM BACKEND ---
  useEffect(() => {
    const carregarTarefas = async () => {
      try {
        const response = await fetch("https://noncomprehendingly-unrescissable-ismael.ngrok-free.dev/api/pendencias");
        if (response.ok) {
          const data = await response.json();
          setTarefas(data);
        } else {
          console.error("Erro ao buscar tarefas");
        }
      } catch (error) {
        console.error("Erro de conexão:", error);
      } finally {
        setLoading(false);
      }
    };
    carregarTarefas();
  }, []);

  // --- LÓGICA DE ORDENAÇÃO (USEMEMO) ---
  const tarefasOrdenadas = useMemo(() => {
    if (!sortConfig) return tarefas;

    return [...tarefas].sort((a, b) => {
      const { key, direction } = sortConfig;

      // 1. Lógica para PRIORIDADE (Customizada: Alta > Media > Baixa)
      if (key === 'prioridade') {
        const pesos = { alta: 3, media: 2, baixa: 1 };
        const valA = pesos[a.prioridade] || 0;
        const valB = pesos[b.prioridade] || 0;
        return direction === 'asc' ? valA - valB : valB - valA;
      }

      // 2. Lógica para STATUS (Customizada: Pendente > Progresso > Concluido)
      if (key === 'status') {
        const pesos = { pendente: 1, em_progresso: 2, concluido: 3 };
        const valA = pesos[a.status] || 0;
        const valB = pesos[b.status] || 0;
        return direction === 'asc' ? valA - valB : valB - valA;
      }

      // 3. Lógica para TEXTO (Titulo, Setor) - Ordem Alfabética
      const valorA = (a[key] || '').toString().toLowerCase();
      const valorB = (b[key] || '').toString().toLowerCase();

      if (valorA < valorB) return direction === 'asc' ? -1 : 1;
      if (valorA > valorB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [tarefas, sortConfig]);

  // Função ao clicar no cabeçalho
  const handleSort = (key: keyof Tarefa) => {
    let direction: 'asc' | 'desc' = 'asc';
    
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Componente Auxiliar para o Cabeçalho da Tabela
  const TableHeader = ({ label, sortKey, align = 'left' }: { label: string, sortKey?: keyof Tarefa, align?: 'left'|'right'|'center' }) => {
    const isActive = sortConfig?.key === sortKey;
    
    return (
      <th 
        className={`px-6 py-4 text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest text-${align} ${sortKey ? 'cursor-pointer hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors select-none' : ''}`}
        onClick={() => sortKey && handleSort(sortKey)}
      >
        <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`}>
          {label}
          {sortKey && (
            <span className="text-slate-400 dark:text-zinc-600">
              {isActive ? (
                sortConfig?.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-500" /> : <ArrowDown className="w-3 h-3 text-blue-500" />
              ) : (
                <ArrowUpDown className="w-3 h-3 opacity-30" />
              )}
            </span>
          )}
        </div>
      </th>
    );
  };

  // --- FUNÇÕES DE AÇÃO ---
  const handleConcluirTarefa = async (id: string) => {
    setAtualizandoId(id); 
    try {
      const response = await fetch(`https://noncomprehendingly-unrescissable-ismael.ngrok-free.dev/api/pendencias/${id}/concluir`, {
        method: "POST",
      });

      if (response.ok) {
        setTarefas((prev) => 
          prev.map((t) => 
            t.id === id ? { ...t, status: 'concluido' } : t
          )
        );
      } else {
        alert("Erro ao concluir tarefa.");
      }
    } catch (error) {
      console.error("Erro ao concluir:", error);
    } finally {
      setAtualizandoId(null);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // --- COMPONENTES VISUAIS ---
  const StatusBadge = ({ status }: { status: Status }) => {
    const styles = {
      // Light Mode: Colors pastel + Dark text | Dark Mode: Transparent bg + Bright text
      pendente: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
      em_progresso: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
      concluido: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
    };
    const labels = { pendente: "A Fazer", em_progresso: "Em Progresso", concluido: "Feito" };
    const icons = { pendente: Circle, em_progresso: Clock, concluido: CheckCircle2 };
    const Icon = icons[status] || Circle;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${styles[status] || styles.pendente}`}>
        <Icon className="w-3 h-3" strokeWidth={2.5} />
        {labels[status] || status}
      </span>
    );
  };

  const PrioridadeIndicator = ({ nivel }: { nivel: Prioridade }) => {
    const colors = { 
        alta: "bg-red-500", 
        media: "bg-amber-500", 
        baixa: "bg-slate-300 dark:bg-zinc-600" 
    };
    return (
      <div className="flex items-center gap-2" title={`Prioridade: ${nivel}`}>
        <div className={`w-1.5 h-1.5 rounded-full ${colors[nivel] || "bg-slate-300"}`} />
        <span className="text-xs text-slate-400 dark:text-zinc-400 capitalize">{nivel}</span>
      </div>
    );
  };

  return (
    // CONTAINER GERAL: Light(bg-[#F8FAFC]) Dark(bg-zinc-950)
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-zinc-950 font-sans text-slate-900 dark:text-zinc-100 transition-colors duration-300">
      
      {/* NAVBAR */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-zinc-950/90 backdrop-blur-sm border-b border-slate-200 dark:border-zinc-800 px-8 py-4 transition-colors duration-300 shadow-sm">
        <div className="mx-auto max-w-[1400px] flex items-center justify-between">
          <div className="flex items-center gap-12">
            <Link to="/" className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white">MCSA</Link>
            <nav className="hidden md:flex items-center gap-8">
              <Link to="/" className="text-sm font-bold text-slate-400 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white transition-colors pb-1">Visão Geral</Link>
              <span className="text-sm font-bold text-slate-900 dark:text-white border-b-2 border-slate-900 dark:border-white pb-1">Roadmap</span>
            </nav>
          </div>
          <button onClick={handleLogout} className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center gap-2">
            Sair <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-8 pt-12 pb-24">
        
        {/* HEADER DA PÁGINA */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-slate-50 dark:bg-zinc-800 rounded-lg border border-slate-200 dark:border-zinc-700">
                <AlertTriangle className="w-5 h-5 text-slate-700 dark:text-zinc-300" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Roadmap do Sistema</h1>
            </div>
            <p className="text-slate-500 dark:text-zinc-400 max-w-2xl text-lg font-light leading-relaxed">
              Funcionalidades planejadas e melhorias em desenvolvimento (Sincronizado com ClickUp).
            </p>
          </div>

          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-zinc-300 hover:border-slate-400 dark:hover:border-zinc-500 transition-all">
              <Filter className="w-4 h-4" /> Filtrar
            </button>
            <a 
              href="https://app.clickup.com/" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-2 px-5 py-2 bg-slate-900 dark:bg-indigo-600 text-white rounded-lg text-xs font-bold uppercase tracking-wide hover:bg-slate-800 dark:hover:bg-indigo-500 transition-all shadow-sm shadow-slate-200 dark:shadow-none"
            >
              <Plus className="w-4 h-4" /> Gerenciar no ClickUp
            </a>
          </div>
        </div>

        {/* CONTAINER DA LISTA (Card) */}
        <div className="border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden min-h-[300px] bg-white dark:bg-zinc-900 shadow-sm transition-colors duration-300">
          
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-zinc-500">
              <Loader2 className="w-8 h-8 animate-spin mb-2 text-indigo-500" />
              <p className="text-sm font-medium">Sincronizando tarefas...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 dark:bg-zinc-950/50 border-b border-slate-200 dark:border-zinc-800">
                    <tr>
                      {/* CÁBEÇALHOS CLICÁVEIS */}
                      <TableHeader label="Funcionalidade" sortKey="titulo" />
                      <TableHeader label="Setor" sortKey="setor" />
                      <TableHeader label="Prioridade" sortKey="prioridade" />
                      <TableHeader label="Status" sortKey="status" />
                      <TableHeader label="Ação" align="right" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                    {tarefasOrdenadas.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 dark:text-zinc-500">
                          Nenhuma tarefa encontrada com a tag <strong className="text-slate-600 dark:text-zinc-300">roadmap-dashboard</strong>.
                        </td>
                      </tr>
                    ) : (
                      tarefasOrdenadas.map((tarefa) => (
                        <tr key={tarefa.id} className="group hover:bg-slate-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                          <td className="px-6 py-5">
                            <p className={`text-sm font-bold mb-0.5 ${tarefa.status === 'concluido' ? 'text-slate-400 dark:text-zinc-500 line-through' : 'text-slate-900 dark:text-zinc-100'}`}>
                              {tarefa.titulo}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium line-clamp-1 max-w-md" title={tarefa.descricao}>
                                {tarefa.descricao}
                            </p>
                          </td>
                          <td className="px-6 py-5">
                            <span className="text-xs font-medium text-slate-600 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 px-2 py-1 rounded-md border border-slate-200 dark:border-zinc-700 whitespace-nowrap">
                              {tarefa.setor}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <PrioridadeIndicator nivel={tarefa.prioridade} />
                          </td>
                          <td className="px-6 py-5">
                            <StatusBadge status={tarefa.status} />
                          </td>
                          <td className="px-6 py-5 text-right">
                            
                            {tarefa.status !== 'concluido' ? (
                                <button 
                                    onClick={() => handleConcluirTarefa(tarefa.id)}
                                    disabled={atualizandoId === tarefa.id}
                                    className="group/btn inline-flex items-center gap-2 text-slate-400 dark:text-zinc-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors disabled:opacity-50"
                                    title="Marcar como Concluído"
                                >
                                    {atualizandoId === tarefa.id ? (
                                        <Loader2 className="w-5 h-5 animate-spin text-emerald-600 dark:text-emerald-500" />
                                    ) : (
                                        <>
                                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover/btn:opacity-100 transition-opacity translate-x-2 group-hover/btn:translate-x-0">Concluir</span>
                                            <CheckCircle2 className="w-5 h-5" />
                                        </>
                                    )}
                                </button>
                            ) : (
                                <span className="inline-flex text-emerald-500 dark:text-emerald-400" title="Tarefa Concluída">
                                    <Check className="w-5 h-5" />
                                </span>
                            )}

                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* PAGINAÇÃO / FOOTER DA TABELA */}
              <div className="px-6 py-4 bg-slate-50 dark:bg-zinc-950/30 border-t border-slate-200 dark:border-zinc-800 flex justify-between items-center">
                <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                  Total de {tarefas.length} itens sincronizados.
                </span>
                <div className="flex gap-2">
                   <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-zinc-600"></div>
                   <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-zinc-700"></div>
                   <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-zinc-700"></div>
                </div>
              </div>
            </>
          )}
        </div>

      </main>
    </div>
  );
}