import { api } from "../api/api"; // Verifique se o caminho da api está certo

export const authService = {
  login: async (username: string, password: string) => {
    
    const response = await api.post('/login', { username, password });
    
    
    return response.data;
  },

  
};