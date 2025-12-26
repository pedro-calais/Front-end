import axios from 'axios';

/**
 * Define a URL base para comunicação com o Backend (Python/Flask).
 * Deve apontar para o endereço onde a API está sendo executada.
 * @constant {string}
 */
const API_URL = 'http://localhost:5000'; 

/**
 * Instância singleton do Axios configurada para a aplicação.
 * Centraliza as configurações de requisição HTTP.
 */
export const api = axios.create({
  baseURL: API_URL,
});

/**
 * Interceptor de Requisição (Request Interceptor).
 * * Executado antes de cada requisição sair do frontend.
 * Verifica a existência de um token de autenticação no LocalStorage e,
 * se presente, injeta o cabeçalho 'Authorization' com o Bearer Token.
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('mcsa_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Interceptor de Resposta (Response Interceptor).
 * * Executado logo após receber uma resposta do backend.
 * Utilizado para tratamento global de erros, especificamente para identificar
 * sessões expiradas ou tokens inválidos (Erro 401).
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Monitora erros de autenticação (401 Unauthorized)
    if (error.response && error.response.status === 401) {
      // Limpa o token armazenado para invalidar a sessão local
      localStorage.removeItem('mcsa_token');
      // window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);