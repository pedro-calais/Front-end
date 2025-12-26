import React, { useState, useEffect } from "react";
import { X, Plus, Edit2, Trash2, Check, User, Mail, Shield, Search, Lock, UserCheck, Loader2 } from "lucide-react";

// Definição da Interface baseada no seu models.py
interface UserData {
  id?: number;
  name: string;
  username: string;
  email: string;
  access_level: string;
  ativo: boolean;
  password?: string; 
}

const TeamModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);

  // --- 1. BUSCAR DADOS (GET) ---
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:5000/users");
      if (!response.ok) throw new Error('Falha ao buscar');
      
      const data = await response.json();
      setUsers(data); 
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      setUsers([]); 
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      setView('list'); // Sempre volta pra lista ao abrir
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // --- 2. DELETAR (DELETE) ---
  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja inativar/remover este usuário?")) {
      try {
        await fetch(`http://localhost:5000/users/${id}`, { method: 'DELETE' });
        // Atualiza lista localmente para ser rápido
        setUsers(users.filter(u => u.id !== id));
      } catch (error) {
        alert("Erro ao processar solicitação.");
      }
    }
  };

  // --- 3. SALVAR (POST / PUT) ---
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    
    // Montando o objeto para enviar ao Python
    const formData = {
        name: (form.elements.namedItem('name') as HTMLInputElement).value,
        username: (form.elements.namedItem('username') as HTMLInputElement).value,
        email: (form.elements.namedItem('email') as HTMLInputElement).value,
        access_level: (form.elements.namedItem('access_level') as HTMLSelectElement).value,
        // Converte string "true"/"false" para boolean real
        ativo: (form.elements.namedItem('ativo') as HTMLSelectElement).value === 'true',
        // Senha só envia se tiver valor
        password: (form.elements.namedItem('password') as HTMLInputElement)?.value || undefined
    };

    try {
        const url = editingUser 
            ? `http://localhost:5000/users/${editingUser.id}` 
            : `http://localhost:5000/users`;
            
        const method = editingUser ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Erro ao salvar');
        }

        await fetchUsers(); // Recarrega a lista do banco
        setView('list');
        setEditingUser(null);
    } catch (error: any) {
        alert(error.message || "Erro ao salvar dados.");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      {/* Container Principal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* CABEÇALHO */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              {view === 'list' ? 'Gestão de Equipe' : (editingUser ? 'Editar Usuário' : 'Novo Usuário')}
            </h2>
            <p className="text-xs text-slate-500 font-medium">Administre os acessos do sistema.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTEÚDO */}
        <div className="p-6 overflow-y-auto flex-1 bg-white">
          {view === 'list' ? (
            <div className="space-y-4">
              {/* Barra de Ações */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" placeholder="Buscar por nome ou username..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-slate-900/10" />
                </div>
                <button onClick={() => { setEditingUser(null); setView('form'); }} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20">
                  <Plus className="w-4 h-4" /> Novo Usuário
                </button>
              </div>

              {/* Tabela de Usuários */}
              <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                {isLoading ? (
                    <div className="p-12 text-center text-slate-500 text-sm flex flex-col items-center">
                        <Loader2 className="w-6 h-6 animate-spin mb-2 text-slate-400"/>
                        Carregando equipe...
                    </div>
                ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                    <tr>
                        <th className="px-4 py-3">Colaborador</th>
                        <th className="px-4 py-3">Nível de Acesso</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((user) => (
                      <tr key={user.id} className="group hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 uppercase border border-slate-200">
                              {user.name?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{user.name}</div>
                              <div className="text-xs text-slate-400">@{user.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                            <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
                                {user.access_level}
                            </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold border ${user.ativo ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-500 border-red-100'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${user.ativo ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                            {user.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => { setEditingUser(user); setView('form'); }} className="p-1.5 hover:bg-white hover:shadow-sm rounded-md text-slate-400 hover:text-blue-600 transition-all border border-transparent hover:border-slate-100">
                                <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => user.id && handleDelete(user.id)} className="p-1.5 hover:bg-white hover:shadow-sm rounded-md text-slate-400 hover:text-red-600 transition-all border border-transparent hover:border-slate-100">
                                <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                        <tr><td colSpan={4} className="p-8 text-center text-slate-400 text-sm">Nenhum usuário encontrado.</td></tr>
                    )}
                  </tbody>
                </table>
                )}
              </div>
            </div>
          ) : (
            // --- FORMULÁRIO (Novo / Editar) ---
            <form onSubmit={handleSave} className="space-y-6 max-w-2xl mx-auto py-4">
              <div className="grid grid-cols-2 gap-5">
                
                {/* Nome */}
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Nome Completo</label>
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 focus-within:ring-2 focus-within:ring-slate-900/10 focus-within:border-slate-300 transition-all">
                        <User className="w-4 h-4 text-slate-400" />
                        <input name="name" type="text" defaultValue={editingUser?.name} className="bg-transparent w-full text-sm outline-none placeholder:text-slate-400" placeholder="Ex: João Silva" required />
                    </div>
                </div>
                
                {/* Username */}
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Username (Login)</label>
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 focus-within:ring-2 focus-within:ring-slate-900/10 focus-within:border-slate-300 transition-all">
                        <UserCheck className="w-4 h-4 text-slate-400" />
                        <input name="username" type="text" defaultValue={editingUser?.username} className="bg-transparent w-full text-sm outline-none placeholder:text-slate-400" placeholder="Ex: joaosilva" required />
                    </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Email</label>
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 focus-within:ring-2 focus-within:ring-slate-900/10 focus-within:border-slate-300 transition-all">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <input name="email" type="email" defaultValue={editingUser?.email} className="bg-transparent w-full text-sm outline-none placeholder:text-slate-400" placeholder="email@empresa.com" />
                    </div>
                </div>

                {/* Nível de Acesso */}
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Nível de Acesso</label>
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 focus-within:ring-2 focus-within:ring-slate-900/10 focus-within:border-slate-300 transition-all">
                        <Shield className="w-4 h-4 text-slate-400" />
                        <select name="access_level" className="bg-transparent w-full text-sm outline-none text-slate-700 cursor-pointer" defaultValue={editingUser?.access_level || 'Operador'}>
                            <option value="Tecnologia">Tecnologia (Admin Total)</option>
                            <option value="Gestor">Gestor</option>
                            <option value="Operador">Operador</option>
                            <option value="Negociador">Negociador</option>
                        </select>
                    </div>
                </div>

                {/* Senha */}
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                        Senha {editingUser && <span className="text-slate-400 font-normal normal-case">(Deixe em branco p/ manter)</span>}
                    </label>
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 focus-within:ring-2 focus-within:ring-slate-900/10 focus-within:border-slate-300 transition-all">
                        <Lock className="w-4 h-4 text-slate-400" />
                        <input name="password" type="password" className="bg-transparent w-full text-sm outline-none placeholder:text-slate-400" placeholder="*****" required={!editingUser} />
                    </div>
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Status</label>
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 focus-within:ring-2 focus-within:ring-slate-900/10 focus-within:border-slate-300 transition-all">
                        <select name="ativo" className="bg-transparent w-full text-sm outline-none text-slate-700 cursor-pointer" defaultValue={editingUser?.ativo ? 'true' : 'true'}>
                            <option value="true">🟢 Ativo (Acesso Permitido)</option>
                            <option value="false">🔴 Inativo (Bloqueado)</option>
                        </select>
                    </div>
                </div>

              </div>

              {/* Botões do Formulário */}
              <div className="pt-6 flex gap-3 justify-end border-t border-slate-100 mt-6">
                <button type="button" onClick={() => setView('list')} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-lg transition-colors">
                    Cancelar
                </button>
                <button type="submit" className="px-6 py-2.5 text-sm font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800 flex items-center gap-2 shadow-lg shadow-slate-900/20 active:scale-95 transition-all">
                    <Check className="w-4 h-4" /> 
                    {editingUser ? 'Salvar Alterações' : 'Criar Usuário'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamModal;