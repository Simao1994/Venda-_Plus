import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Wrench, AlertTriangle, ShieldCheck, LogOut, ArrowRight, RefreshCw, Settings as SettingsIcon } from 'lucide-react';

interface SystemModeHandlerProps {
  children: React.ReactNode;
}

type SystemMode = 'ativo' | 'manutencao' | 'desenvolvimento';

export default function SystemModeHandler({ children }: SystemModeHandlerProps) {
  const { user, logout } = useAuth();
  const [modo, setModo] = useState<SystemMode>((localStorage.getItem('modo_sistema') as SystemMode) || 'ativo');
  
  // Listen for storage changes (if modified in another tab)
  useEffect(() => {
    const handleStorageChange = () => {
      setModo((localStorage.getItem('modo_sistema') as SystemMode) || 'ativo');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const isAdmin = user?.role === 'admin' || user?.role === 'master';
  const isAuthenticated = !!user;
  const isBypassed = sessionStorage.getItem('maintenance_bypass') === 'true';

  // 🔴 Se estiver em manutenção
  if (modo === 'manutencao' && !isAdmin && !isBypassed) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 sm:p-6 relative font-sans overflow-hidden">
        {/* Abstract Background Particles */}
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-gold-primary/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-gold-primary/5 rounded-full blur-[150px] animate-pulse delay-1000" />
        
        <div className="max-w-md w-full relative z-10 text-center">
          <div className="w-20 h-20 sm:w-28 sm:h-28 bg-gradient-to-br from-gold-primary to-gold-secondary rounded-[24px] sm:rounded-[32px] flex items-center justify-center text-bg-deep mx-auto shadow-[0_0_50px_rgba(212,175,55,0.4)] relative mb-8 sm:mb-12">
            <Wrench size={36} className="sm:hidden animate-bounce" />
            <Wrench size={48} className="hidden sm:block animate-bounce" />
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tighter italic mb-4 sm:mb-6 font-display leading-tight">
            SISTEMA EM <span className="text-gold-gradient">MANUTENÇÃO</span>
          </h1>
          
          <div className="space-y-3 sm:space-y-4 mb-8 sm:mb-10 px-2">
            <p className="text-gold-primary/60 font-black text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em]">Operação de Núcleo em Curso</p>
            <p className="text-white/40 font-medium leading-relaxed text-sm sm:text-base">
              Estamos a realizar atualizações críticas na infraestrutura <span className="text-white font-bold italic">Cloud Matrix</span> do sistema.
              <span className="block mt-1">Agradecemos a sua compreensão.</span>
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:gap-4">
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 sm:py-5 rounded-3xl bg-gold-primary text-bg-deep font-black text-[10px] sm:text-xs uppercase tracking-[0.2em] transition-all hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] active:scale-95 flex items-center justify-center gap-3"
            >
              <RefreshCw size={15} /> Verificar Novamente
            </button>
            
            {isAuthenticated ? (
              <button 
                onClick={logout}
                className="w-full py-4 sm:py-5 rounded-3xl bg-white/5 border border-white/10 text-gold-primary/40 font-black text-[10px] uppercase tracking-[0.2em] hover:text-gold-primary transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <LogOut size={13} /> Sair do Sistema
              </button>
            ) : (
              <button 
                onClick={() => {
                   sessionStorage.setItem('maintenance_bypass', 'true');
                   window.location.reload();
                }}
                className="w-full py-4 sm:py-5 rounded-3xl bg-white/5 border border-white/10 text-white/20 font-black text-[10px] uppercase tracking-[0.2em] hover:text-gold-primary hover:border-gold-primary/30 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <ShieldCheck size={13} /> Acesso Restrito (Admin)
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }




  return (
    <div className="relative">
      {/* 🟡 Aviso de Desenvolvimento */}
      {modo === 'desenvolvimento' && (
        <div className="fixed top-0 left-0 right-0 z-[9999] h-8 sm:h-10 bg-gradient-to-r from-[#D4AF37] via-[#f1c40f] to-[#D4AF37] flex items-center justify-between gap-2 px-3 sm:px-4 shadow-[0_4px_15px_rgba(212,175,55,0.3)] border-b border-black/10">
          <div className="flex items-center gap-2 animate-pulse min-w-0">
            <AlertTriangle size={14} className="text-bg-deep fill-bg-deep/20 shrink-0 sm:hidden" />
            <AlertTriangle size={18} className="text-bg-deep fill-bg-deep/20 shrink-0 hidden sm:block" />
            <span className="text-[9px] sm:text-[10px] md:text-xs font-black text-bg-deep uppercase tracking-[0.05em] sm:tracking-[0.1em] truncate">
              <span className="hidden sm:inline">Ambiente de Desenvolvimento Ativo &mdash; </span>
              <span className="sm:hidden">DEV MODE &mdash; </span>
              <span className="italic">Funcionalidades em teste</span>
            </span>
          </div>
          
          {isAdmin && (
             <div className="flex items-center gap-1.5 border-l border-bg-deep/20 pl-3 ml-2 shrink-0">
                <ShieldCheck size={12} className="text-bg-deep" />
                <span className="text-[8px] sm:text-[9px] font-black text-bg-deep/60 uppercase hidden xs:inline">Admin</span>
             </div>
          )}
        </div>
      )}

      <div className={modo === 'desenvolvimento' ? 'pt-8 sm:pt-10' : ''}>
        {children}
      </div>
    </div>
  );
}
