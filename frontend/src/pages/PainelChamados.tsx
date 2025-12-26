import  { useState, useEffect } from "react";
import { api } from "../api/api"; 
import { Link } from "react-router-dom";
import { 
  Loader2, Search, User, 
  AlertCircle, ArrowLeft, Clock, FileText, X,  Calendar
} from "lucide-react";

// --- INTERFACES ---
interface Chamado {
  id: string;
  nome: string;
  descricao?: string;
  status: string;
  color: string;
  criacao: string;
  finalizacao: string;
  responsavel: string;
  solicitante: string;
  raw_created: number;
}

// --- UTILS (Atualizado para Dark Mode) ---
const getStatusColor = (status: string) => {
  const s = status.toLowerCase();
  if (s.includes('novo') || s.includes('new')) 
    return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800";
  if (s.includes('andamento') || s.includes('progress')) 
    return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800";
  if (s.includes('pendente')) 
    return "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800";
  if (s.includes('concluido') || s.includes('closed') || s.includes('finalizado')) 
    return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800";
  
  return "bg-slate-100 text-slate-600 border-slate-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700";
};

// --- SUB-COMPONENTES ---
const DetailItem = ({ label, value, highlight }: { label: string, value: string, highlight?: boolean }) => (
    <div className="flex flex-col">
        <span className="text-[10px] font-bold text-slate-300 dark:text-zinc-600 uppercase tracking-wider mb-0.5">{label}</span>
        <span className={`text-sm font-semibold ${highlight ? 'text-slate-400 dark:text-zinc-400 italic' : 'text-slate-600 dark:text-zinc-300'}`}>
            {value}
        </span>
    </div>
);

const customScrollbar = `
  .custom-scrollbar::-webkit-scrollbar { width: 6px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
`;

// --- COMPONENTE MODAL (Movido para fora para evitar re-render desnecessário) ---
const ChamadoModal = ({ chamado, onClose }: { chamado: Chamado | null, onClose: () => void }) => {
  if (!chamado) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop (Fundo escuro borrado) */}
      <div 
        className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>

      {/* Conteúdo do Modal */}
      <div className="relative bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 dark:border-zinc-800 animate-fade-in-up">
        
        {/* Cabeçalho */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-start gap-4 bg-slate-50/50 dark:bg-zinc-900/50">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border shadow-sm ${getStatusColor(chamado.status)}`}>
                {chamado.status}
              </span>
              <span className="text-xs font-mono text-slate-400 dark:text-zinc-500">#{chamado.id}</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
              {chamado.nome}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-400 dark:text-zinc-500 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Corpo com Scroll */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          
          {/* Descrição */}
          <div className="mb-8">
            <h3 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Descrição
            </h3>
            <div className="bg-slate-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-slate-100 dark:border-zinc-800 text-sm text-slate-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
              {chamado.descricao || <span className="italic text-slate-400">Nenhuma descrição fornecida.</span>}
            </div>
          </div>

          {/* Grid de Detalhes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pessoas */}
            <div className="space-y-4">
               <h3 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <User className="w-4 h-4" /> Envolvidos
              </h3>
              
              <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs">
                  {chamado.solicitante.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500">Solicitante</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200">{chamado.solicitante}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition">
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold text-xs">
                  {chamado.responsavel ? chamado.responsavel.charAt(0).toUpperCase() : '?'}
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500">Responsável</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200">{chamado.responsavel || 'Não atribuído'}</p>
                </div>
              </div>
            </div>

            {/* Datas */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Datas
              </h3>
              
              <div className="bg-slate-50 dark:bg-zinc-800/30 p-3 rounded-lg border border-slate-100 dark:border-zinc-800">
                <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500 mb-1">Data de Abertura</p>
                <p className="text-sm font-mono font-medium text-slate-700 dark:text-zinc-300">{chamado.criacao}</p>
              </div>

              <div className="bg-slate-50 dark:bg-zinc-800/30 p-3 rounded-lg border border-slate-100 dark:border-zinc-800">
                <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500 mb-1">Previsão / Finalização</p>
                <p className={`text-sm font-mono font-medium ${chamado.finalizacao === 'Pendente' ? 'text-amber-500' : 'text-emerald-500'}`}>
                  {chamado.finalizacao}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="p-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800 transition"
          >
            Fechar
          </button>
          
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---
const PainelChamados = () => {
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [filtroNegociador, setFiltroNegociador] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroDataInicio, setFiltroDataInicio] = useState("");
  const [filtroDataFim, setFiltroDataFim] = useState("");

  const [listaNegociadores, setListaNegociadores] = useState<string[]>([]);
  const [listaStatus, setListaStatus] = useState<string[]>([]);

  const [isNegociadorRestrito, setIsNegociadorRestrito] = useState(false);
  const [selectedChamado, setSelectedChamado] = useState<Chamado | null>(null);

  // --- SOLUÇÃO DO SCROLL DUPLO (Trava o body) ---
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    
    const verificarPermissoes = () => {
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                
                const accessLevel = user.access_level?.toLowerCase() || '';
                const userName = (user.name || user.username || '').toLowerCase();

                const temAcessoTotal = 
                    accessLevel === 'admin' || 
                    accessLevel === 'gestor' ||
                    accessLevel === 'tecnologia' || 
                    accessLevel === 'tech' ||
                    userName.includes('lucas'); 

                if (!temAcessoTotal) {
                    setIsNegociadorRestrito(true);
                    setFiltroNegociador(user.name || user.username || "");
                }
            }
        } catch (error) {
            console.error("Erro ao validar permissões:", error);
        }
    };

    verificarPermissoes();
    fetchChamados();

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const fetchChamados = async () => {
    setLoading(true);
    try {
      const response = await api.get('/chamados/listar');
      const data = response.data;
      setChamados(data);

      const negociadores = Array.from(new Set(data.map((c: Chamado) => c.solicitante))).filter(Boolean) as string[];
      const statuses = Array.from(new Set(data.map((c: Chamado) => c.status))).filter(Boolean) as string[];
      
      setListaNegociadores(negociadores.sort());
      setListaStatus(statuses.sort());

    } catch (error) {
      console.error("Erro ao buscar chamados:", error);
    } finally {
      setLoading(false);
    }
  };

  const chamadosFiltrados = chamados.filter(chamado => {
    if (filtroNegociador && chamado.solicitante !== filtroNegociador) return false;
    if (filtroStatus && chamado.status !== filtroStatus) return false;

    if (filtroDataInicio || filtroDataFim) {
      const [dia, mes, ano] = chamado.criacao.split('/').map(Number);
      const dataChamado = new Date(ano, mes - 1, dia);
      
      if (filtroDataInicio) {
        const dataIni = new Date(filtroDataInicio);
        if (dataChamado < dataIni) return false;
      }
      if (filtroDataFim) {
        const dataFim = new Date(filtroDataFim);
        if (dataChamado > dataFim) return false;
      }
    }
    return true;
  });

  const handleLimparFiltros = () => {
      if (!isNegociadorRestrito) {
          setFiltroNegociador("");
      }
      setFiltroStatus("");
      setFiltroDataInicio("");
      setFiltroDataFim("");
  };

  return (
    // CONTAINER: Adicionado dark:bg-zinc-950 dark:text-zinc-100
    <div className="h-screen w-full overflow-y-auto bg-[#F8FAFC] dark:bg-zinc-950 font-sans text-slate-900 dark:text-zinc-100 pb-20 custom-scrollbar transition-colors duration-300">
      <style>{customScrollbar}</style>

      {/* RENDERIZA O MODAL AQUI */}
      {selectedChamado && (
        <ChamadoModal 
          chamado={selectedChamado} 
          onClose={() => setSelectedChamado(null)} 
        />
      )}
      
      {/* HEADER: Adicionado dark:bg-zinc-900 dark:border-zinc-800 */}
      <div className="bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 px-8 py-5 flex items-center justify-between sticky top-0 z-20 shadow-sm transition-colors duration-300">
        <div className="flex items-center gap-4">
            <Link to="/" className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">
                <ArrowLeft className="w-5 h-5 text-slate-500 dark:text-zinc-400" />
            </Link>
            <div>
                {/* Texto branco no dark mode */}
                <h1 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Painel de Chamados</h1>
                <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">Histórico de solicitações e status</p>
            </div>
        </div>
        <button 
            onClick={fetchChamados} 
            className="p-2 text-slate-400 dark:text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            title="Recarregar"
        >
            <Clock className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 md:px-8 py-8">

        {/* FILTROS: Adicionado dark:bg-zinc-900 dark:border-zinc-800 */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm mb-8 flex flex-col md:flex-row gap-4 items-end transition-colors duration-300">
            
            <div className="flex-1 w-full">
                <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5 block ml-1">
                    Negociador {isNegociadorRestrito && "(Você)"}
                </label>
                <div className="relative">
                    <User className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isNegociadorRestrito ? 'text-blue-500' : 'text-slate-400 dark:text-zinc-500'}`} />
                    <select 
                        className={`w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm font-semibold outline-none transition-colors
                        ${isNegociadorRestrito 
                            ? 'bg-blue-50/50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 cursor-not-allowed border-blue-100 dark:border-blue-900' 
                            : 'bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200' 
                        }`}
                        value={filtroNegociador} 
                        onChange={(e) => setFiltroNegociador(e.target.value)}
                        disabled={isNegociadorRestrito}
                    >
                        <option value="">Todos</option>
                        {listaNegociadores.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                </div>
            </div>
            
            <div className="flex-1 w-full">
                <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5 block ml-1">Status</label>
                <div className="relative">
                    <AlertCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
                    {/* Inputs: dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700 */}
                    <select className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-zinc-200 outline-none" value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
                        <option value="">Todos</option>
                        {listaStatus.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>

            <div className="flex-1 w-full grid grid-cols-2 gap-2">
                <div>
                    <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5 block ml-1">De</label>
                    <input type="date" className="w-full px-3 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-200 outline-none" value={filtroDataInicio} onChange={(e) => setFiltroDataInicio(e.target.value)} />
                </div>
                <div>
                    <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5 block ml-1">Até</label>
                    <input type="date" className="w-full px-3 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-200 outline-none" value={filtroDataFim} onChange={(e) => setFiltroDataFim(e.target.value)} />
                </div>
            </div>

            <button 
                onClick={handleLimparFiltros} 
                className="px-6 py-2.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors h-[42px]"
            >
                Limpar
            </button>
        </div>

        {/* LISTA DE CARDS */}
        {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-zinc-500">
                <Loader2 className="w-10 h-10 animate-spin mb-4 text-indigo-500" />
                <p className="text-sm font-medium">Sincronizando...</p>
            </div>
        ) : (
            <div className="space-y-4">
                {chamadosFiltrados.length === 0 ? (
                      // CARD VAZIO: dark:bg-zinc-900 dark:border-zinc-800
                      <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 border-dashed">
                        <Search className="w-10 h-10 text-slate-300 dark:text-zinc-600 mx-auto mb-3" />
                        <p className="text-slate-500 dark:text-zinc-400 font-medium">Nada encontrado.</p>
                    </div>
                ) : (
                    chamadosFiltrados.map((chamado) => (
                        // CARD ITEM: dark:bg-zinc-900 dark:border-zinc-800
                        <div 
                          key={chamado.id} 
                          onClick={() => setSelectedChamado(chamado)} // <--- CLIQUE AQUI
                          className="cursor-pointer bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm hover:shadow-lg hover:border-indigo-100 dark:hover:border-indigo-900/50 transition-all duration-300 group relative overflow-visible"
                        >
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border shadow-sm ${getStatusColor(chamado.status)}`}>{chamado.status}</span>
                                        <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 font-mono">#{chamado.id}</span>
                                    </div>
                                    
                                    <div className="relative group/tooltip w-fit">
                                        <h3 className="text-base md:text-lg font-bold text-slate-800 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors cursor-help tracking-tight">
                                            {chamado.nome}
                                        </h3>
                                        
                                        <div className="absolute left-0 top-full mt-4 w-[400px] z-50 opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-300 transform translate-y-2 group-hover/tooltip:translate-y-0 pointer-events-none group-hover/tooltip:pointer-events-auto">
                                            {/* TOOLTIP: dark:bg-zinc-900 dark:border-zinc-700 */}
                                            <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl p-5 rounded-2xl shadow-2xl border border-slate-100/50 dark:border-zinc-700/50 ring-1 ring-slate-200/50 dark:ring-zinc-800/50 relative">
                                                <div className="absolute -top-2 left-6 w-4 h-4 bg-white dark:bg-zinc-900 border-t border-l border-slate-100 dark:border-zinc-700 transform rotate-45"></div>
                                                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100 dark:border-zinc-800">
                                                    <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg"><FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /></div>
                                                    <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">Resumo da Tarefa</span>
                                                </div>
                                                <div className="max-h-60 overflow-y-auto custom-scrollbar pr-2">
                                                    <p className="text-sm text-slate-600 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                                                        {chamado.descricao || <span className="text-slate-400 dark:text-zinc-500 italic">Sem descrição detalhada.</span>}
                                                    </p>
                                                </div>
                                                {chamado.descricao && (
                                                    <div className="mt-3 pt-2 border-t border-slate-50 dark:border-zinc-800 flex justify-end">
                                                        <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500">Ler completo no ClickUp</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-x-8 gap-y-4 lg:justify-end flex-1 border-t lg:border-t-0 border-slate-50 dark:border-zinc-800 pt-4 lg:pt-0">
                                    <DetailItem label="Criação" value={chamado.criacao} />
                                    <DetailItem label="Finalização" value={chamado.finalizacao} highlight={chamado.finalizacao === 'Pendente'} />
                                    <DetailItem label="Responsável" value={chamado.responsavel || '-'} />
                                    <div className="flex flex-col min-w-[120px]">
                                        <span className="text-[10px] font-bold text-slate-300 dark:text-zinc-600 uppercase tracking-wider mb-0.5">Solicitante</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[10px] font-bold">
                                                {chamado.solicitante.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="font-bold text-slate-700 dark:text-zinc-200 text-sm truncate max-w-[120px]" title={chamado.solicitante}>{chamado.solicitante}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default PainelChamados;