import React, { useState, useEffect } from "react";
import {
  FileText, Plus, Trash2, Send, Loader2, Paperclip,
  CheckCircle, ArrowLeft, User as UserIcon
} from "lucide-react";
import { api } from "../api/api"; 
import { useNavigate } from "react-router-dom";

// --- TIPAGENS ---
interface ParcelaItem { vencimento: string; valor: number; tipo: string; }
interface DevolucaoItem { vencimento: string; valor: number; parcela: string; }
interface AlteracaoVinculoItem { campanha: string; credor: string; cpf: string; nome: string; }
interface QuebraAcordoItem { campanha: string; n_acordo: string; }
interface LigacaoItem { numero: string; hora: string; }

// Interface baseada no retorno do seu Python (login function)
interface User {
  id: number;
  name: string;
  email: string;
  username: string;
  access_level: string;
}

interface OpcoesChamado {
  demandas: string[];
  credor_vs_campanha: Record<string, string[]>;
  campanhas_display: Record<string, string>;
}

// --- SUB-COMPONENTES (TabelaParcelas mantida igual) ---
const TabelaParcelas = ({ items, onUpdate, onRemove, onAdd }: any) => (
  <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-slate-200 dark:border-zinc-800 p-6 mb-6 animate-fade-in-up">
    <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-100 mb-6 flex items-center gap-2">
      <FileText className="w-5 h-5 text-blue-500" /> Detalhes da Inclusão
    </h3>
    <div className="border border-slate-200 dark:border-zinc-700 rounded-lg overflow-hidden mb-3">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 font-semibold">
          <tr><th className="p-3">Vencimento</th><th className="p-3">Valor (R$)</th><th className="p-3">Tipo</th><th className="p-3 w-10"></th></tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
          {items.map((p: ParcelaItem, idx: number) => (
            <tr key={idx} className="bg-white dark:bg-zinc-900">
              <td className="p-2"><input type="date" value={p.vencimento} onChange={e => onUpdate(idx, 'vencimento', e.target.value)} className="w-full p-1 border dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100" /></td>
              <td className="p-2"><input type="number" step="0.01" value={p.valor} onChange={e => onUpdate(idx, 'valor', parseFloat(e.target.value))} className="w-full p-1 border dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100" /></td>
              <td className="p-2"><input type="text" value={p.tipo} onChange={e => onUpdate(idx, 'tipo', e.target.value)} className="w-full p-1 border dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100" /></td>
              <td className="p-2 text-center"><button onClick={() => onRemove(idx)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <button onClick={onAdd} type="button" className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline"><Plus className="w-4 h-4" /> Adicionar Parcela</button>
  </div>
);

// --- COMPONENTE PRINCIPAL ---

const AbrirChamado = () => {
  const navigate = useNavigate();

  // Estados Gerais
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [tipoDemanda, setTipoDemanda] = useState("");
  const [nomeTarefa, setNomeTarefa] = useState("");
  const [descricao, setDescricao] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);

  // ESTADO DO USUÁRIO LOGADO (Substitui listaUsuarios e solicitanteId solto)
  const [usuarioLogado, setUsuarioLogado] = useState<User | null>(null);

  const [opcoes, setOpcoes] = useState<OpcoesChamado>({
      demandas: [],
      credor_vs_campanha: {},
      campanhas_display: {}
  });

  // Listas Dinâmicas
  const [parcelas, setParcelas] = useState<ParcelaItem[]>([{ vencimento: "", valor: 0, tipo: "" }]);
  const [devolucoes, setDevolucoes] = useState<DevolucaoItem[]>([{ vencimento: "", valor: 0, parcela: "" }]);
  const [alteracoes, setAlteracoes] = useState<AlteracaoVinculoItem[]>([{ campanha: "", credor: "", cpf: "", nome: "" }]);
  const [quebras, setQuebras] = useState<QuebraAcordoItem[]>([{ campanha: "", n_acordo: "" }]);
  const [ligacoes, setLigacoes] = useState<LigacaoItem[]>([{ numero: "", hora: "" }]);

  // --- CARREGAR DADOS ---
  useEffect(() => {
    const fetchData = async () => {
        try {
            // 1. Busca opções globais (dropdowns)
            const opcoesRes = await api.get('/chamados/opcoes');
            setOpcoes(opcoesRes.data);

            // 2. RECUPERA USUÁRIO LOGADO DO LOCALSTORAGE
            // O seu Python retorna user_data. Assumimos que no login você fez:
            // localStorage.setItem('user', JSON.stringify(response.data));
            const storedUser = localStorage.getItem('user'); // <--- VERIFIQUE SE O NOME DA CHAVE É 'user' OU 'user_data'
            
            if (storedUser) {
                const userParsed = JSON.parse(storedUser);
                setUsuarioLogado(userParsed);
            } else {
                console.warn("Nenhum usuário logado encontrado no storage.");
                // Opcional: navigate('/login');
            }

        } catch (error) {
            console.error("Erro ao carregar dados:", error);
            alert("Não foi possível carregar as configurações.");
        }
    };
    fetchData();
  }, []);

  const updateItem = <T,>(index: number, field: keyof T, value: any, setter: React.Dispatch<React.SetStateAction<T[]>>) => {
    setter(prev => {
      const novo = [...prev];
      if (field === 'credor' && novo[index]) {
          // @ts-ignore
          novo[index].campanha = ""; 
      }
      novo[index] = { ...novo[index], [field]: value };
      return novo;
    });
  };

  const removeItem = <T,>(index: number, setter: React.Dispatch<React.SetStateAction<T[]>>) => {
    setter(prev => prev.filter((_, i) => i !== index));
  };

  // --- SUBMIT ---
  const handleSubmit = async () => {
    // Validação de Segurança: só envia se tiver usuário carregado
    if (!usuarioLogado || !usuarioLogado.id) {
        alert("Erro de autenticação: Usuário não identificado. Faça login novamente.");
        return;
    }

    if (!tipoDemanda || !nomeTarefa || !descricao) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      
      formData.append('tipo_demanda', tipoDemanda);
      formData.append('titulo', nomeTarefa);
      formData.append('descricao', descricao);

      // AQUI ESTÁ A MÁGICA:
      // Usamos os dados diretos do localStorage/State, sem inputs manipuláveis pelo usuário
      formData.append('solicitante_id', String(usuarioLogado.id));
      formData.append('nome_solicitante', usuarioLogado.name); 

      // Dados do Cliente Base
      formData.append('campanha', alteracoes[0]?.campanha || '');
      formData.append('credor', alteracoes[0]?.credor || '');
      formData.append('cpf_cliente', alteracoes[0]?.cpf || '');
      formData.append('nome_cliente', alteracoes[0]?.nome || '');

      // Serializando Arrays
      if (tipoDemanda === "Inclusão de Parcela") formData.append('dados_parcelas', JSON.stringify(parcelas));
      if (tipoDemanda === "Devolução de clientes/parcelas") formData.append('dados_devolucoes', JSON.stringify(devolucoes));
      if (tipoDemanda === "Alteração de Vínculo") formData.append('dados_vinculos', JSON.stringify(alteracoes));
      if (tipoDemanda === "Quebra de acordo") formData.append('dados_quebras', JSON.stringify(quebras));
      if (tipoDemanda === "Gravações Ligações") formData.append('dados_ligacoes', JSON.stringify(ligacoes));

      if (files) {
        Array.from(files).forEach((file) => {
          formData.append('files', file);
        });
      }

      await api.post("/chamados/criar", formData); 
      setSucesso(true);

    } catch (error) {
      console.error(error);
      alert("Erro ao abrir chamado. Verifique o console.");
    } finally {
      setLoading(false);
    }
  };

  if (sucesso) return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-lg max-w-md w-full text-center animate-fade-in-up">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Chamado Criado!</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">Sua solicitação foi enviada para o ClickUp com sucesso.</p>
        <div className="flex flex-col gap-2">
          <button onClick={() => window.location.reload()} className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition w-full">
            Novo Chamado
          </button>
          <button onClick={() => navigate('/dashboard')} className="text-slate-500 dark:text-slate-400 font-bold py-3 px-6 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition w-full">
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FC] dark:bg-zinc-950 font-sans text-slate-900 dark:text-zinc-100 pb-20 transition-colors duration-300">
      <header className="bg-white/95 dark:bg-zinc-950/90 backdrop-blur-sm border-b border-slate-200 dark:border-zinc-800 px-8 py-4 sticky top-0 z-50 flex justify-between items-center shadow-sm transition-colors duration-300">
        <div className="flex items-center gap-6">
            <button onClick={() => navigate('/dashboard')} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition" title="Voltar ao Dashboard">
                <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-6">
                <span className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white">MCSA</span>
                <div className="h-6 w-px bg-slate-200 dark:bg-zinc-800 hidden md:block"></div>
                <h2 className="text-sm font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest hidden md:block">Central de Serviços</h2>
            </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 md:p-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">Abertura de Chamado</h1>
          <p className="text-slate-500 dark:text-zinc-400">Preencha os dados abaixo para gerar a tarefa automaticamente.</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-slate-200 dark:border-zinc-800 p-6 mb-6 transition-colors duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase mb-2">Tipo de Demanda <span className="text-red-500">*</span></label>
              <select value={tipoDemanda} onChange={(e) => setTipoDemanda(e.target.value)} className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-4 py-3 text-slate-700 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 transition">
                <option value="">Selecione...</option>
                {opcoes.demandas.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase mb-2">Nome da Tarefa <span className="text-red-500">*</span></label>
              <input type="text" value={nomeTarefa} onChange={(e) => setNomeTarefa(e.target.value)} className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-4 py-3 text-slate-700 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 transition" />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase mb-2">Descrição da tarefa <span className="text-red-500">*</span></label>
            <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={4} className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-4 py-3 text-slate-700 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 transition resize-none" />
          </div>

          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase mb-2">Arquivo</label>
            <div className="border-2 border-dashed border-slate-300 dark:border-zinc-700 rounded-lg p-6 flex flex-col items-center justify-center text-slate-400 dark:text-zinc-500 hover:bg-slate-50 dark:hover:bg-zinc-800 transition cursor-pointer relative group">
              <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={(e) => setFiles(e.target.files)} />
              <Paperclip className="w-8 h-8 mb-2 group-hover:text-blue-500 transition-colors" />
              <span className="text-sm">Clique ou arraste para anexar</span>
              {files && files.length > 0 && (
                <div className="mt-4 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full z-0">
                  {files.length} arquivos selecionados
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 bg-slate-50 dark:bg-zinc-800/50 p-4 rounded-lg border border-slate-100 dark:border-zinc-700">
              <div className="flex justify-between items-end mb-2">
                  <div>
                      <p className="text-sm font-semibold text-slate-700 dark:text-zinc-200">Dados do Cliente</p>
                      <p className="text-xs text-slate-400 dark:text-zinc-500">Principal vínculo da tarefa</p>
                  </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500">Credor</label>
                      <select className="w-full p-2 rounded border border-slate-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm text-slate-900 dark:text-zinc-200" value={alteracoes[0].credor} onChange={(e) => updateItem(0, 'credor', e.target.value, setAlteracoes)}>
                          <option value="">Selecione</option>
                          {Object.keys(opcoes.credor_vs_campanha).sort().map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                  </div>
                  <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500">Campanha</label>
                      <select className="w-full p-2 rounded border border-slate-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm text-slate-900 dark:text-zinc-200" value={alteracoes[0].campanha} onChange={(e) => updateItem(0, 'campanha', e.target.value, setAlteracoes)} disabled={!alteracoes[0].credor}>
                          <option value="">{alteracoes[0].credor ? "Selecione a campanha..." : "Selecione um credor primeiro"}</option>
                          {(opcoes.credor_vs_campanha[alteracoes[0].credor] || []).map(camp => {
                              const idCampanha = camp.split(' - ')[0].trim();
                              const nomeDisplay = (opcoes.campanhas_display && opcoes.campanhas_display[idCampanha]) ? opcoes.campanhas_display[idCampanha] : camp;
                              return <option key={camp} value={camp}>{idCampanha} - {nomeDisplay.replace(idCampanha, '').replace(' - ', '').trim()}</option>;
                          })}
                      </select>
                  </div>
                  <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500">CPF</label>
                      <input type="text" className="w-full p-2 rounded border border-slate-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm text-slate-900 dark:text-zinc-200" value={alteracoes[0].cpf} onChange={(e) => updateItem(0, 'cpf', e.target.value, setAlteracoes)} />
                  </div>
                  <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500">Nome</label>
                      <input type="text" className="w-full p-2 rounded border border-slate-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm text-slate-900 dark:text-zinc-200" value={alteracoes[0].nome} onChange={(e) => updateItem(0, 'nome', e.target.value, setAlteracoes)} />
                  </div>
              </div>
          </div>
        </div>

        {tipoDemanda === "Inclusão de Parcela" && (
            <TabelaParcelas items={parcelas} onUpdate={(idx: number, f: any, v: any) => updateItem(idx, f, v, setParcelas)} onRemove={(idx: number) => removeItem(idx, setParcelas)} onAdd={() => setParcelas(prev => [...prev, { vencimento: "", valor: 0, tipo: "" }])} />
        )}

        {/* --- RODAPÉ ATUALIZADO: CAMPO SOLICITANTE TRAVADO --- */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-slate-200 dark:border-zinc-800 p-6 flex justify-between items-center gap-4 transition-colors duration-300">
          <div className="w-1/3">
              <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500 mb-1">Solicitante</label>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-4 w-4 text-slate-400" />
                </div>
                <input 
                    type="text" 
                    disabled
                    value={usuarioLogado?.name || "Carregando..."}
                    className="w-full pl-10 p-2 rounded border border-slate-200 dark:border-zinc-600 bg-slate-100 dark:bg-zinc-800/50 text-sm text-slate-500 dark:text-zinc-400 cursor-not-allowed font-medium"
                />
              </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !usuarioLogado}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-5 h-5" /> Abrir Chamado</>}
          </button>
        </div>

      </main>
    </div>
  );
};

export default AbrirChamado;