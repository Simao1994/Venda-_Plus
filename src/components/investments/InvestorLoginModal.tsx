import React, { useState } from 'react';
import { X, ShieldCheck, User, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { api } from '../../lib/api';

interface InvestorLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (session: any) => void;
}

export default function InvestorLoginModal({ isOpen, onClose, onLoginSuccess }: InvestorLoginModalProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = { 
        email: identifier.trim(), 
        password: password.trim() 
      };

      const res = await api.post('/api/public/investor-verify', payload);
      const data = await res.json();
      
      if (res.ok) {
        onLoginSuccess(data);
        onClose();
      } else {
        setError(data.error || 'Credenciais inválidas. Verifique os dados e tente novamente.');
      }
    } catch (err: any) {
      setError('Erro de ligação ao servidor. Tente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-bg-deep/90 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="glass-panel w-full max-w-md p-8 md:p-10 rounded-[40px] border border-white/5 relative overflow-hidden gold-glow animate-in zoom-in-95 duration-500">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold-primary to-transparent" />
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-gold-primary/5 rounded-full blur-3xl" />
        
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-all"
        >
          <X size={20} />
        </button>

        <div className="text-center mb-10">
          <div className="mx-auto mb-6 flex justify-center">
            <img src="/logo_amazing.png" alt="Amazing Corp" className="h-16 w-auto object-contain drop-shadow-2xl" />
          </div>
          <h2 className="text-2xl font-black text-white uppercase italic tracking-tight mb-2">Portal do Investidor</h2>
          <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">Minha Consulta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-gold-primary uppercase tracking-[0.3em] ml-1 italic">E-mail ou Número do BI</label>
            <div className="relative group">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-gold-primary transition-colors" size={18} />
              <input 
                type="text" 
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="DIGITE O SEU E-MAIL OU BI"
                className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/5 rounded-2xl focus:border-gold-primary/40 focus:ring-4 focus:ring-gold-primary/10 text-white font-black text-xs outline-none transition-all placeholder:text-white/10 uppercase tracking-widest"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-gold-primary uppercase tracking-[0.3em] ml-1 italic">Senha de Acesso</label>
            <div className="relative group">
              <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-gold-primary transition-colors" size={18} />
              <input 
                type={showPassword ? "text" : "password"} 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-14 pr-14 py-5 bg-white/5 border border-white/5 rounded-2xl focus:border-gold-primary/40 focus:ring-4 focus:ring-gold-primary/10 text-white font-black text-xs outline-none transition-all placeholder:text-white/10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 hover:text-gold-primary transition-all p-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-[10px] font-black uppercase tracking-wider animate-in slide-in-from-top-2">
              <X size={16} className="shrink-0" />
              {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-6 bg-gold-primary text-bg-deep rounded-3xl font-black text-xs uppercase tracking-[0.4em] hover:bg-white transition-all shadow-[0_0_30px_rgba(212,175,55,0.2)] active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed italic"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <>
                ENTRAR NO PORTAL <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-white/20 text-[8px] font-black uppercase tracking-[0.2em] leading-relaxed">
          Este portal é de uso exclusivo para investidores registados.<br />
          Seus dados estão protegidos por criptografia de ponta.
        </p>
      </div>
    </div>
  );
}
