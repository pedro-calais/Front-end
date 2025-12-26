import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Filter, Search } from 'lucide-react';
// Certifique-se de que estes componentes existem em src/components/ui/
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

// ----------------------------------------------------
// 1. Definições de Tipos (Interfaces)
// ----------------------------------------------------

/**
 * Define a estrutura de uma coluna na tabela.
 * @template T O tipo do objeto de dados que a tabela exibirá.
 */
export interface ColumnDef<T> {
  /** * A chave da propriedade no objeto de dados ou um identificador único (ex: 'actions').
   * Usada para mapear o dado à coluna.
   */
  key: keyof T | 'actions'; 

  /** * O texto que será exibido no cabeçalho da tabela. 
   */
  header: string;

  /**
   * Função opcional para renderização customizada da célula.
   * Útil para formatar datas, valores monetários ou adicionar botões de ação.
   * @param item O objeto de dados da linha atual.
   */
  render?: (item: T) => React.ReactNode; 

  /** * Habilita a funcionalidade de ordenação (sort) para esta coluna. 
   */
  sortable?: boolean; 
}

/**
 * Propriedades aceitas pelo componente DataTable.
 * @template T O tipo do objeto de dados.
 */
interface DataTableProps<T> {
  /** Array contendo os dados a serem exibidos. */
  data: T[];
  
  /** Definição das colunas da tabela. */
  columns: ColumnDef<T>[];
  
  /** * Número de itens exibidos por página. 
   * @default 10 
   */
  pageSize?: number;
  
  /** Título exibido no cabeçalho do Card da tabela. */
  title: string;
}

// ----------------------------------------------------
// 2. Componente Principal
// ----------------------------------------------------

/**
 * Componente de Tabela de Dados Genérica.
 * Oferece funcionalidades integradas de:
 * - Filtragem global (Busca em todos os campos).
 * - Ordenação dinâmica (Crescente/Decrescente).
 * - Paginação automática.
 * * @example
 * <DataTable 
 * title="Usuários" 
 * data={users} 
 * columns={userColumns} 
 * />
 */
export const DataTable = <T extends object>({
  data,
  columns,
  pageSize = 10,
  title,
}: DataTableProps<T>) => {
  
  // --- Estado Local ---
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  /**
   * Lógica de Filtragem (Memoized).
   * Filtra os dados originais com base no termo de busca.
   * Verifica se o termo existe em *qualquer* valor das propriedades do objeto.
   */
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    
    return data.filter((item) =>
      Object.values(item).some((value) =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm]);

  /**
   * Lógica de Ordenação (Memoized).
   * Aplica a ordenação sobre os dados já filtrados.
   * Utiliza comparação léxica simples para strings e numérica para números.
   */
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;

    const sorted = [...filteredData].sort((a, b) => {
      const aValue = a[sortKey] ?? '';
      const bValue = b[sortKey] ?? '';

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filteredData, sortKey, sortDirection]);

  // Cálculo do total de páginas baseado nos dados filtrados
  const totalPages = Math.ceil(sortedData.length / pageSize);

  /**
   * Lógica de Paginação (Memoized).
   * Fatia o array ordenado para exibir apenas os itens da página atual.
   */
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  /**
   * Manipulador de Ordenação.
   * Alterna entre ascendente e descendente se a mesma coluna for clicada.
   * Reseta para a página 1 ao ordenar.
   */
  const handleSort = (key: keyof T) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };
  
  // --- Renderização ---
  return (
    <Card title={title} className="p-0 overflow-hidden">
      
      {/* Header: Busca e Ações */}
      <div className="p-4 border-b border-gray-100 dark:border-zinc-700 flex flex-wrap gap-4 items-center justify-between">
        
        {/* Campo de Busca Global */}
        <div className="relative w-full sm:w-64">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar em todos os campos..."
            value={searchTerm}
            onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reseta paginação ao filtrar
            }}
            className="pl-10"
          />
        </div>
        
        {/* Botões de Ação (Placeholder para expansão futura) */}
        <div className="flex space-x-3">
            <Button variant="secondary" icon={<Filter size={16} />}>Filtros Avançados</Button>
            <Button variant="primary">Novo Cadastro</Button>
        </div>
      </div>
      
      {/* Corpo da Tabela */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-700">
          
          {/* Cabeçalho das Colunas */}
          <thead className="bg-gray-50 dark:bg-zinc-700/50">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 ${column.sortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors' : ''}`}
                  onClick={() => column.sortable && handleSort(column.key as keyof T)}
                >
                  <div className="flex items-center">
                    {column.header}
                    {/* Indicador visual de ordenação */}
                    {column.sortable && sortKey === column.key && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          
          {/* Linhas de Dados */}
          <tbody className="bg-white dark:bg-zinc-800 divide-y divide-gray-200 dark:divide-zinc-700">
            {paginatedData.map((item, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-zinc-700/30 transition-colors">
                {columns.map((column) => (
                  <td key={String(column.key)} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {/* Renderiza customizado se existir a função render, senão mostra o valor bruto */}
                    {column.render ? column.render(item) : String(item[column.key as keyof T] || '')}
                  </td>
                ))}
              </tr>
            ))}
            
            {/* Estado Vazio */}
            {paginatedData.length === 0 && (
                <tr>
                    <td colSpan={columns.length} className="text-center py-8 text-gray-500 dark:text-gray-400">
                        Nenhum resultado encontrado.
                    </td>
                </tr>
            )}

          </tbody>
        </table>
      </div>
      
      {/* Rodapé: Controles de Paginação */}
      <div className="p-4 border-t border-gray-100 dark:border-zinc-700 flex justify-between items-center text-sm">
        <span className="text-gray-600 dark:text-gray-400">
            Mostrando {(currentPage - 1) * pageSize + 1} a {Math.min(currentPage * pageSize, sortedData.length)} de {sortedData.length} resultados.
        </span>
        
        <div className="flex space-x-2">
            <Button 
                variant="secondary" 
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
            >
                Anterior
            </Button>
            <Button 
                variant="secondary" 
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
            >
                Próximo
            </Button>
        </div>
      </div>

    </Card>
  );
};