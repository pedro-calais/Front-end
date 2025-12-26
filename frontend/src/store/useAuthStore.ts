import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// Interface do Usuário (igual ao que vem do seu Backend)
export interface UserProfile {
  id: string | number;
  name: string;
  email: string;
  role?: string;
  avatar?: string;
}

// Interface do Estado Global de Autenticação
interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  token: string | null; // Adicionamos o token aqui para salvar
  
  // A função login agora recebe o Usuário pronto e o Token
  login: (user: UserProfile, token: string) => void;
  
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      token: null,

      // Ação de Login: Apenas salva o que recebeu da API
      login: (user, token) => {
        // Se quiser garantir, pode salvar o token manualmente no localStorage aqui também,
        // mas o "persist" do Zustand já vai cuidar disso automaticamente.
        localStorage.setItem('mcsa_token', token); 

        set({
          isAuthenticated: true,
          user: user,
          token: token,
        });
      },

      // Ação de Logout: Limpa tudo
      logout: () => {
        localStorage.removeItem('mcsa_token');
        set({
          isAuthenticated: false,
          user: null,
          token: null,
        });
      },
    }),
    {
      name: "mcsa-auth-storage", // Nome da chave no navegador
      storage: createJSONStorage(() => localStorage),
    }
  )
);