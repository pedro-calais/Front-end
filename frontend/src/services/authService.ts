import { api } from "../api/api"; // Verifique se o caminho da api está certo

export const authService = {
  login: async (username: string, password: string) => {
    // CORREÇÃO: A rota no Python é apenas '/login', sem o '/auth' antes
    const response = await api.post('/login', { username, password });
    
    // O Python retorna: { token: "...", id: 1, name: "...", ... }
    return response.data;
  },

  // OBS: Essa rota '/me' ainda não existe no seu Python. 
  // Se quiser usar validação de token depois, precisaremos criá-la lá.
  // Por enquanto, vou deixar comentado para não dar erro 404.
  /*
  validateToken: async () => {
    const response = await api.get('/me');
    return response.data;
  }
  */
};