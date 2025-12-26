export interface User {
  id?: number; // Opcional pois na criação não tem ID ainda
  name: string;
  username: string;
  email: string;
  access_level: string; // "Tecnologia", "Financeiro", etc.
  ativo: boolean;       // Backend manda true/false
  password?: string;    // Opcional, usado apenas no envio
}