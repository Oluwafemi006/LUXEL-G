import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await api.post('token/', { username, password });
      login(response.data.access, response.data.refresh);
      navigate('/staff');
    } catch (err: any) {
      setError('Identifiants invalides. Veuillez réessayer.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-50 via-slate-50 to-slate-100">
      <div className="w-full max-w-md animate-in fade-in zoom-in duration-1000">
        <div className="bg-white rounded-xl shadow-2xl shadow-emerald-900/10 border border-emerald-100/50 p-12 space-y-10 relative overflow-hidden">
          {/* Logo & Header */}
          <div className="text-center space-y-3 relative z-10">
            <div className="w-20 h-20 bg-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-200 group hover:rotate-12 transition-all duration-700">
              <ShieldCheck className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-black text-slate-900 italic tracking-tighter uppercase">LUXEL<span className="text-emerald-600">-G</span></h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Accès Administrateur</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            {error && (
              <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center animate-shake">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Utilisateur</label>
              <div className="relative group">
                <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-50 border border-emerald-100/30 rounded-2xl pl-16 pr-6 py-5 outline-none focus:border-emerald-500 focus:bg-white font-bold text-sm shadow-inner transition-all duration-500"
                  placeholder="admin"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Mot de passe</label>
              <div className="relative group">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-emerald-100/30 rounded-2xl pl-16 pr-14 py-5 outline-none focus:border-emerald-500 focus:bg-white font-bold text-sm shadow-inner transition-all duration-500"
                  placeholder="••••••••"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-emerald-500 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-6 rounded-xl font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-emerald-200 hover:bg-emerald-700 hover:-translate-y-1 active:scale-95 transition-all duration-500 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                "Se Connecter"
              )}
            </button>
          </form>

          <p className="text-center text-[8px] font-black text-slate-300 uppercase tracking-widest relative z-10">
            &copy; {new Date().getFullYear()} Luxury Elegance Garage - Tous droits réservés
          </p>

          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-100 rounded-full -ml-16 -mb-16 blur-3xl opacity-50"></div>
        </div>
      </div>
    </div>
  );
};

export default Login;
