import React, { useState } from "react";

import { Eye, EyeOff, Loader2, Lock, User } from "lucide-react";

const LoginPage = () => {
 
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      console.log("🚀 Starting Login via FETCH...");

      // 1. Direct Fetch Call (Bypassing Axios)
      const response = await fetch('https://noncomprehendingly-unrescissable-ismael.ngrok-free.dev', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // Sending all possible field names to ensure backend accepts it
          body: JSON.stringify({ 
              usuario: username, 
              username: username, 
              user: username,
              senha: password, 
              password: password 
          }) 
      });

      const data = await response.json();
      console.log("📩 Server Response:", data);

      if (response.ok) {
        // 2. Extract User Data
        const usuarioParaSalvar = data.user || data;

        // 3. Clear and Save to LocalStorage
        localStorage.clear();
        localStorage.setItem('user', JSON.stringify(usuarioParaSalvar));
        
        if (data.token) {
            localStorage.setItem('token', data.token);
        }

        console.log("💾 Saved to Storage. Redirecting...");

        // 4. Hard Redirect to force index reload
        window.location.href = "/"; 
        
      } else {
        setError(data.message || "Invalid credentials.");
      }

    } catch (err: any) {
      console.error("❌ Connection Error:", err);
      setError("Server connection failed. Is the backend running on port 5000?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFDFD] font-sans px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 mb-2">MCSA</h1>
          <p className="text-slate-500 font-medium">Faça login para acesaar o Dashboard.</p>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50">
          <form onSubmit={handleLogin} className="space-y-6">
            
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">User</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
                  placeholder="Username"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-xs font-bold text-center">{error}</div>}

            <button type="submit" disabled={loading} className="w-full py-3.5 bg-slate-900 text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-slate-900/20 active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Authenticating...</> : "Access Dashboard"}
            </button>
          </form>
        </div>
        <div className="text-center mt-8 text-xs font-medium text-slate-400">&copy; 2025 MCSA Gestão de Crédito.</div>
      </div>
    </div>
  );
};

export default LoginPage;