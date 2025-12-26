import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, 
  Calendar, 
  Search, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Bell, 
  
} from 'lucide-react';

// --- TIPAGEM ---
interface Acionamento {
  campanhaID: string | number;
  CREDOR: string;
  CAMPANHA: string;
  CPF_CNPJ_CLIENTE: string;
  Nome: string;
  NEGOCIADOR: string;
  CoUsuariosID: string | number;
  RO: string;
  DATA: string;
}

const AcionamentosPage: React.FC = () => {
  // --- ESTADOS ---
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [dados, setDados] = useState<Acionamento[]>([]);
  const [msgSucesso, setMsgSucesso] = useState('');
  const [erro, setErro] = useState('');

  // Filtros
  const [filtros, setFiltros] = useState({
    data_inicio: new Date().toISOString().split('T')[0].slice(0, 8) + '01', 
    data_fim: new Date().toISOString().split('T')[0], 
    cliente: '',
    negociador: '',
    campanha: ''
  });

  // Busca e Autocomplete
  const [termoBusca, setTermoBusca] = useState('');
  const [sugestoesClientes, setSugestoesClientes] = useState<any[]>([]);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);

  // Paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 10; 

  // Listas de Opções
  const [listaCampanhas, setListaCampanhas] = useState<string[]>([]);
  const [listaNegociadores, setListaNegociadores] = useState<{label: string, value: string}[]>([]);

  // --- EFEITOS E CARREGAMENTO ---
  useEffect(() => {
    const carregarOpcoes = async () => {
      try {
        const resCampanhas = await fetch(' https://noncomprehendingly-unrescissable-ismael.ngrok-free.dev/api/lista-campanhas');
        const dataCampanhas = await resCampanhas.json();
        setListaCampanhas(dataCampanhas);

        const resNegociadores = await fetch(' https://noncomprehendingly-unrescissable-ismael.ngrok-free.dev/api/lista-negociadores');
        if (resNegociadores.ok) {
            const dataNegociadores = await resNegociadores.json();
            if (Array.isArray(dataNegociadores)) {
              setListaNegociadores(dataNegociadores);
            }
        }
      } catch (error) {
        console.error("Erro filtros:", error);
      }
    };
    carregarOpcoes();
  }, []);

  // --- HANDLERS (Busca, Exportação, Inputs) ---
  const handleBuscar = async () => {
    setLoading(true);
    setMsgSucesso('');
    setErro('');
    setPaginaAtual(1); 
    
    try {
      const response = await fetch(' https://noncomprehendingly-unrescissable-ismael.ngrok-free.dev/api/acionamentos/listar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filtros)
      });

      if (!response.ok) throw new Error('Erro ao buscar dados.');

      const data = await response.json();
      setDados(data);
      setMsgSucesso(`Relatório carregado com sucesso! ${data.length} registros encontrados.`);
    } catch (err: any) {
      setErro(err.message || 'Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportarExcel = async () => {
    setExporting(true);
    try {
      const response = await fetch(' https://noncomprehendingly-unrescissable-ismael.ngrok-free.dev/api/acionamentos/exportar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filtros)
      });

      if (!response.ok) throw new Error('Erro ao gerar Excel.');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `acionamentos_${filtros.data_inicio}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert("Erro ao baixar o Excel.");
    } finally {
      setExporting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFiltros({ ...filtros, [e.target.name]: e.target.value });
  };

  const handleBuscarCliente = async (texto: string) => {
    setTermoBusca(texto);
    if (texto.length < 3) {
      setSugestoesClientes([]);
      setMostrarSugestoes(false);
      return;
    }
    try {
      const response = await fetch(` https://noncomprehendingly-unrescissable-ismael.ngrok-free.dev/clientes/buscar?q=${texto}`);
      const data = await response.json();
      setSugestoesClientes(data);
      setMostrarSugestoes(true);
    } catch (error) {
      console.error("Erro busca cliente:", error);
    }
  };

  const selecionarCliente = (cliente: any) => {
    setTermoBusca(cliente.nome);
    setFiltros({ ...filtros, cliente: cliente.nome }); 
    setMostrarSugestoes(false);
  };

  // Paginação Lógica
  const indexUltimoItem = paginaAtual * itensPorPagina;
  const indexPrimeiroItem = indexUltimoItem - itensPorPagina;
  const itensAtuais = dados.slice(indexPrimeiroItem, indexUltimoItem);
  const totalPaginas = Math.ceil(dados.length / itensPorPagina);

  const mudarPagina = (novaPagina: number) => {
    if (novaPagina >= 1 && novaPagina <= totalPaginas) setPaginaAtual(novaPagina);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900">
      
      {/* =========================================================================
          HEADER PADRÃO MCSA (LOGO APENAS TEXTO COM DESTAQUE)
      ========================================================================= */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-12">
            
            <Link to="/" className="flex items-center group">
                <span className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 group-hover:text-indigo-900 transition-colors">
                    MCSA
                </span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-8">
                <Link to="/" className="text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors pb-1">Visão Geral</Link>
                {/* Link Ativo */}
                <Link to="/acionamentos" className="text-sm font-bold text-slate-900 border-b-2 border-slate-900 pb-1">Acionamentos</Link>
            </nav>
        </div>
        
        <div className="flex items-center gap-6">
            <button className="text-slate-400 hover:text-slate-900 transition-colors relative">
                <Bell className="w-5 h-5" />
            </button>
            <div className="w-px h-8 bg-slate-100"></div>
            <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                    <p className="text-xs font-bold text-slate-900 leading-none">Admin</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Gestor</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-sm cursor-pointer">AD</div>
            </div>
        </div>
      </header>

      {/* =========================================================================
          CONTEÚDO PRINCIPAL
      ========================================================================= */}
      <main className="max-w-[1600px] mx-auto p-8">
        
        {/* Título da Página */}
        <div className="mb-8 flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                <BarChart3 className="w-6 h-6" />
            </div>
            <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Acionamentos por Negociador</h1>
                <p className="text-slate-500 text-sm">Visualize o histórico de contatos e exporte relatórios detalhados.</p>
            </div>
        </div>

        {/* --- CARD DE FILTROS --- */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
            
            {/* Linha 1: Datas e Botão */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
                <div className="md:col-span-3">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Data Início</label>
                    <div className="relative">
                        <input 
                            type="date" 
                            name="data_inicio"
                            value={filtros.data_inicio}
                            onChange={handleChange}
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none text-sm font-medium transition-all"
                        />
                        <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                </div>

                <div className="md:col-span-3">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Data Fim</label>
                    <div className="relative">
                        <input 
                            type="date" 
                            name="data_fim"
                            value={filtros.data_fim}
                            onChange={handleChange}
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none text-sm font-medium transition-all"
                        />
                        <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                </div>

                <div className="md:col-span-3 flex items-end">
                    <button 
                        onClick={handleBuscar}
                        disabled={loading}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-6 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 text-sm"
                    >
                        {loading ? <span className="animate-spin">⌛</span> : <Search className="w-4 h-4" />}
                        {loading ? "Processando..." : "Gerar Relatório"}
                    </button>
                </div>
            </div>

            {/* Mensagens de Feedback */}
            {msgSucesso && (
                <div className="mb-6 p-3 bg-emerald-50/50 border border-emerald-100 rounded-lg flex items-center gap-3 text-emerald-700 text-sm font-medium">
                    <CheckCircle2 className="w-4 h-4" /> <span>{msgSucesso}</span>
                </div>
            )}
            {erro && (
                <div className="mb-6 p-3 bg-red-50/50 border border-red-100 rounded-lg flex items-center gap-3 text-red-700 text-sm font-medium">
                    <AlertCircle className="w-4 h-4" /> <span>{erro}</span>
                </div>
            )}

            <div className="h-px bg-slate-100 my-6 w-full" />

            {/* Linha 2: Filtros Avançados */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Autocomplete Cliente */}
                <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Cliente (Nome/CPF)</label>
                    <div className="relative">
                        <input 
                            type="text"
                            value={termoBusca}
                            onChange={(e) => handleBuscarCliente(e.target.value)}
                            placeholder="Digite mín. 3 letras..."
                            className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none text-sm transition-all"
                            onFocus={() => termoBusca.length >= 3 && setMostrarSugestoes(true)}
                            onBlur={() => setTimeout(() => setMostrarSugestoes(false), 200)}
                        />
                        <div className="absolute right-3 top-3 text-slate-400">
                            {termoBusca ? (
                                <button onClick={() => { setTermoBusca(''); setFiltros({...filtros, cliente: ''}); }}>x</button>
                            ) : (
                                <Search className="w-4 h-4" />
                            )}
                        </div>
                    </div>
                    {/* Lista Flutuante */}
                    {mostrarSugestoes && sugestoesClientes.length > 0 && (
                        <div className="absolute z-50 mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                            {sugestoesClientes.map((cliente) => (
                                <div 
                                    key={cliente.id}
                                    onClick={() => selecionarCliente(cliente)}
                                    className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0"
                                >
                                    <div className="font-bold text-slate-800 text-sm">{cliente.nome}</div>
                                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{cliente.documento}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Negociador */}
                <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Negociador</label>
                    <select 
                        name="negociador" 
                        value={filtros.negociador} 
                        onChange={handleChange}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none text-sm transition-all"
                    >
                        <option value="">Todos os Negociadores</option>
                        {listaNegociadores.map((n, i) => (
                            <option key={i} value={n.value}>{n.label}</option>
                        ))}
                    </select>
                </div>

                {/* Campanha */}
                <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Campanha</label>
                    <select 
                        name="campanha" 
                        value={filtros.campanha} 
                        onChange={handleChange}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none text-sm transition-all"
                    >
                        <option value="">Todas as Campanhas</option>
                        {listaCampanhas.map((c, i) => (
                            <option key={i} value={c}>{c}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>

        {/* --- TABELA DE DADOS --- */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">ID</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Credor</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Campanha</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">CPF/CNPJ</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nome</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Negociador</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Resultado</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Data</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {dados.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-6 py-16 text-center text-slate-400 text-sm">
                                    Nenhum registro encontrado. Utilize os filtros acima.
                                </td>
                            </tr>
                        ) : (
                            itensAtuais.map((row, index) => (
                                <tr key={index} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="px-6 py-4 text-xs font-mono text-slate-400">{row.campanhaID}</td>
                                    <td className="px-6 py-4 text-sm font-medium text-slate-700">{row.CREDOR}</td>
                                    <td className="px-6 py-4 text-xs text-slate-500 truncate max-w-[150px]" title={row.CAMPANHA}>{row.CAMPANHA}</td>
                                    <td className="px-6 py-4 text-xs font-mono text-slate-500">{row.CPF_CNPJ_CLIENTE}</td>
                                    <td className="px-6 py-4 text-sm font-bold text-slate-800 group-hover:text-slate-900">{row.Nome}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{row.NEGOCIADOR}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${
                                            row.RO.includes('Acordo') 
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                            : 'bg-slate-100 text-slate-600 border-slate-200'
                                        }`}>
                                            {row.RO}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">{row.DATA}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Paginação */}
            {dados.length > 0 && (
                <div className="flex items-center justify-between p-4 bg-slate-50 border-t border-slate-200">
                    <span className="text-xs text-slate-500 font-medium">
                        Mostrando {indexPrimeiroItem + 1}-{Math.min(indexUltimoItem, dados.length)} de {dados.length}
                    </span>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => mudarPagina(paginaAtual - 1)}
                            disabled={paginaAtual === 1}
                            className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 text-slate-600 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 flex items-center">
                            {paginaAtual} / {totalPaginas}
                        </span>
                        <button 
                            onClick={() => mudarPagina(paginaAtual + 1)}
                            disabled={paginaAtual === totalPaginas}
                            className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 text-slate-600 transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>

        {/* Rodapé - Botão Flutuante ou Fixo */}
        <div className="flex justify-end pb-12">
            <button 
                onClick={handleExportarExcel}
                disabled={exporting || dados.length === 0}
                className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all disabled:opacity-50 text-sm"
            >
                {exporting ? <span className="animate-spin">⌛</span> : <FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
                {exporting ? "Gerando..." : "Baixar Excel Completo (.csv)"}
            </button>
        </div>

      </main>
    </div>
  );
};

export default AcionamentosPage;