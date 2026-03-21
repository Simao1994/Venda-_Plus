import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import {
  Calculator,
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  FileText,
  LogOut,
  Menu,
  X,
  Store,
  Wallet,
  Tag,
  Smartphone,
  Cross,
  Briefcase,
  FileSpreadsheet,
  Settings as SettingsIcon,
  AlertCircle,
  ArrowRight,
  CreditCard,
  MessageSquare,
  Truck,
  User
} from 'lucide-react';
import { supabase } from "./lib/supabase";
import Support from "./components/Support";
import { syncDatabaseSchema } from "./lib/database-sync";
import UsersList from './components/Users';
import Settings from './components/Settings';
import PharmacyModule from './components/pharmacy/PharmacyModule';
import SalesModule from './components/sales/SalesModule';
import HRModule from './components/hr/HRModule';
import Accounting from './components/accounting/Accounting';
import MobileApp from './components/MobileApp';
import PublicHome from './components/PublicHome';
import Marketing from './components/Marketing';
import MasterAdmin from './components/MasterAdmin';
import Registration from './components/Registration';
import SubscriptionManagement from './components/SubscriptionManagement';
import MobileAppInfo from './components/MobileAppInfo';
import Suppliers from './components/Suppliers';
import BlogPage from './components/Blog';
import { api } from './lib/api';
import SaftModule from './components/saft/SaftModule';

function Login({ onBackToPublic, onGoToRegister }: { onBackToPublic: () => void, onGoToRegister: () => void }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/api/auth/login', { email, password });
      const data = await res.json();
      if (res.ok) {
        login(data.token, data.user);
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message || 'Erro de ligação');
    }
  };

  return (
    <div className="min-h-screen bg-bg-deep flex items-center justify-center p-4 relative font-sans overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-gold-primary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-gold-primary/5 rounded-full blur-[120px]" />

      <button
        onClick={onBackToPublic}
        className="absolute top-8 left-8 flex items-center object-contain gap-2 text-gold-primary/60 hover:text-gold-primary font-black text-xs uppercase tracking-widest transition-all z-20 group"
      >
        <X size={18} className="group-hover:rotate-90 transition-transform" />
        Voltar para o Market
      </button>

      <div className="glass-panel p-10 rounded-[40px] w-full max-w-md relative overflow-hidden gold-glow animate-in fade-in zoom-in duration-700">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gold-primary/50 to-transparent" />

        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-br from-gold-primary to-gold-secondary rounded-3xl flex items-center justify-center text-bg-deep mx-auto mb-6 shadow-[0_0_30px_rgba(212,175,55,0.3)]">
            <Store size={40} />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter italic font-display">
            VENDA <span className="text-gold-gradient">PLUS</span>
          </h1>
          <p className="text-gold-primary/40 font-black text-[10px] uppercase tracking-[0.3em] mt-3">High Tech Enterprise ERP</p>
        </div>

        {error && (
          <div className="bg-red-500/10 text-red-400 p-4 rounded-2xl text-xs mb-8 text-center font-black uppercase tracking-widest border border-red-500/20 blur-none">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gold-primary/60 ml-2">Email Corporativo</label>
            <input
              type="email"
              autoComplete="off"
              className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-gold-primary focus:ring-4 focus:ring-gold-primary/10 font-bold transition-all text-white placeholder-white/20"
              placeholder="admin@venda-plus.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gold-primary/60 ml-2">Palavra-passe</label>
            <input
              type="password"
              autoComplete="off"
              className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-gold-primary focus:ring-4 focus:ring-gold-primary/10 font-bold transition-all text-white placeholder-white/20"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end pr-1">
            <button
              type="button"
              onClick={() => setShowForgotModal(true)}
              className="text-[10px] font-black uppercase tracking-[0.2em] text-gold-primary/40 hover:text-gold-primary transition-colors"
            >
              Recuperar Acesso
            </button>
          </div>
          <button
            type="submit"
            className="w-full py-5 rounded-3xl bg-gradient-to-r from-gold-primary to-gold-secondary text-bg-deep font-black text-sm uppercase tracking-[0.2em] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all mt-4 active:scale-95"
          >
            Entrar no Portal
          </button>
        </form>

        <div className="mt-12 text-center text-[9px] font-black uppercase tracking-[0.3em] text-white/10">
          &copy; 2026 VENDA PLUS SYSTEMS &bull; ALL RIGHTS RESERVED
        </div>
      </div>

      {showForgotModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[40px] w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-8 border-b bg-gray-50/50">
              <h3 className="text-xl font-black text-gray-900 tracking-tight">Recuperar Acesso</h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Introduza o seu email corporativo</p>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Email</label>
                <input
                  type="email"
                  className="w-full px-5 py-4 rounded-2xl border-2 border-gray-50 focus:border-emerald-500 font-bold transition-all text-gray-900"
                  placeholder="exemplo@empresa.com"
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowForgotModal(false)}
                  className="flex-1 py-4 border border-gray-100 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-all font-bold"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    alert('As instruções de recuperação foram enviadas para o seu email.');
                    setShowForgotModal(false);
                  }}
                  className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl font-bold"
                >
                  Enviar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SidebarItem({ icon: Icon, label, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all relative group overflow-hidden ${active
        ? 'bg-gradient-to-r from-gold-primary to-gold-secondary text-bg-deep shadow-[0_10px_20px_rgba(212,175,55,0.2)] scale-[1.02]'
        : 'text-white/40 hover:bg-white/5 hover:text-gold-primary'
        }`}
    >
      {active && (
        <div className="absolute top-0 right-0 w-1 h-full bg-white/20" />
      )}
      <Icon size={20} className={active ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'} />
      <span className={`font-black uppercase tracking-[0.15em] text-[10px] ${active ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}>
        {label}
      </span>
    </button>
  );
}

export default function App() {
  const { user, isAuthenticated, login, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('sales');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [view, setView] = useState<'public' | 'erp'>('public');
  const [isRegistering, setIsRegistering] = useState(false);
  const displayName = user?.name || user?.email?.split('@')[0].split('.')[0].toUpperCase() || 'OPERATOR';
  const [licenseStatus, setLicenseStatus] = useState<{ active: boolean, message?: string }>({ active: true });
  const [features, setFeatures] = useState<string[]>([]);

  useEffect(() => {
    // 1. Check for access token in URL for automatic login
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
      console.log('🔗 [Token Login] Detectado link de acesso exclusivo...');
      fetch('/api/auth/token-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })
        .then(res => res.json())
        .then(data => {
          if (data.token && data.user) {
            console.log('✅ [Token Login] Sucesso! Redirecionando para o portal...');
            login(data.token, data.user);
            setView('erp');
            // Clear URL parameter without reloading
            window.history.replaceState({}, document.title, "/");
          } else {
            console.error('❌ [Token Login] Falha:', data.error);
          }
        })
        .catch(err => console.error('❌ [Token Login] Erro:', err));
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      if (user?.role !== 'master') {
        fetchSubscription();
      } else {
        setFeatures(['master_all']); // Master has all features
      }
    }
  }, [isAuthenticated, user]);

  const fetchSubscription = async () => {
    try {
      const token = sessionStorage.getItem('erp_token');
      const res = await fetch('/api/company/subscription', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) return logout();
      const data = await res.json();

      if (res.ok) {
        setFeatures(data.saas_plans?.features || []);
        if (data.status === 'suspended' || data.status === 'expired') {
          setLicenseStatus({ active: false, message: `Status da conta: ${data.status.toUpperCase()}` });
        } else {
          setLicenseStatus({ active: true });
        }
      } else {
        // Fallback for missing subscription/new companies
        setLicenseStatus({ active: false, message: "Aguardando ativação do plano." });
      }
    } catch (err) {
      console.error('Error checking subscription:', err);
    }
  };

  if (view === 'erp' && isRegistering) {
    return <Registration onBack={() => { setIsRegistering(false); setView('public'); }} onSuccess={() => setIsRegistering(false)} />;
  }

  if (!isAuthenticated && view === 'erp') {
    return <Login onBackToPublic={() => setView('public')} onGoToRegister={() => setIsRegistering(true)} />;
  }

  if (view === 'public') {
    return <PublicHome
      onLoginClick={() => {
        if (isAuthenticated && user?.role === 'master') {
          setActiveTab('master');
        } else {
          setActiveTab('sales');
        }
        setView('erp');
      }}
      onStartClick={() => {
        setIsRegistering(true);
        setView('erp');
      }}
    />;
  }


  // Mobile ERP View
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
  if (isMobile && view === 'erp' && isAuthenticated) {
    return <MobileApp />;
  }

  // Subscription Check (Global)
  if (isAuthenticated && user?.role !== 'master' && !licenseStatus.active) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white p-10 rounded-[40px] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-amber-500" />
          <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center text-amber-500 mx-auto mb-6">
            <AlertCircle size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-4">Acesso Suspenso</h2>
          <p className="text-slate-500 font-medium mb-8">
            {licenseStatus.message || "Sua assinatura expirou ou o pagamento não foi confirmado. Por favor, contacte o administrador."}
          </p>
          <div className="space-y-4">
            <button className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
              Renovar Agora
            </button>
            <button onClick={logout} className="w-full text-slate-400 font-bold hover:text-slate-600 py-2">
              Sair da Conta
            </button>
          </div>
        </div>
      </div>
    );
  }

  const menuItems = [
    { id: 'master', label: "Administração SaaS", icon: LayoutDashboard, roles: ['master'], feature: 'master_all' },
    { id: 'sales', label: "Vendas", icon: Briefcase, roles: ['admin', 'manager', 'cashier', 'master'], feature: 'sales' },
    { id: 'pharmacy', label: "Farmácia", icon: Cross, roles: ['admin', 'manager', 'cashier', 'master'], feature: 'pharmacy' },
    { id: 'hr', label: "RH", icon: FileSpreadsheet, roles: ['admin', 'manager', 'master'], feature: 'hr' },
    { id: 'accounting', label: "Contabilidade", icon: Calculator, roles: ['admin', 'manager', 'master'], feature: 'sales' },
    { id: 'saft', label: "SAF-T (AGT)", icon: FileText, roles: ['admin', 'manager', 'master'], feature: 'sales' },
    { id: 'marketing', label: "Marketing", icon: Smartphone, roles: ['admin', 'manager', 'master'], feature: 'marketing' },
    { id: 'blog', label: "Blog Corporativo", icon: FileText, roles: ['admin', 'manager', 'master'], feature: 'marketing' },
    { id: 'subscription', label: "Gestão de Assinatura", icon: CreditCard, roles: ['admin', 'manager'], feature: 'settings' },
    { id: 'mobile', label: "APP Mobile", icon: Smartphone, roles: ['admin', 'manager', 'cashier', 'master'], feature: 'marketing' },
    { id: 'users', label: "Utilizadores", icon: Users, roles: ['admin', 'master'], feature: 'settings' },
    { id: 'suppliers', label: "Fornecedores", icon: Truck, roles: ['admin', 'manager', 'master'], feature: 'settings' },
    { id: 'settings', label: "Configurações", icon: SettingsIcon, roles: ['admin', 'master'], feature: 'settings' },
    { id: 'support', label: "Suporte Técnico", icon: MessageSquare, roles: ['admin', 'manager', 'cashier', 'master'], feature: 'sales' },
  ];

  const filteredMenu = menuItems.filter(item => {
    if (!user) return false;
    const hasRole = item.roles.includes(user.role);
    const hasFeature = user.role === 'master' || features.includes(item.feature) || features.includes('master_all');
    return hasRole && hasFeature;
  });

  const isMasterPortal = user?.role === 'master';

  return (
    <div className="flex h-screen overflow-hidden flex-col md:flex-row bg-bg-deep font-sans">
      {/* Sidebar - Desktop Only */}
      <aside className={`${sidebarOpen ? 'w-72' : 'w-24'} hidden md:flex glass-panel border-r border-white/5 transition-all duration-500 flex-col z-20 relative overflow-hidden`}>
        {/* Sidebar Background Glow */}
        <div className="absolute top-[-20%] left-[-20%] w-[150%] h-[150%] bg-gold-primary/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="p-8 flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 bg-gradient-to-br from-gold-primary to-gold-secondary rounded-2xl flex items-center justify-center text-bg-deep shadow-[0_0_20px_rgba(212,175,55,0.2)] shrink-0">
            <Store size={28} />
          </div>
          {sidebarOpen && (
            <div className="flex flex-col animate-in fade-in slide-in-from-left-4 duration-500">
              <span className="font-black text-2xl text-white tracking-tighter italic font-display leading-none">
                VENDA <span className="text-gold-gradient">PLUS</span>
              </span>
              <span className="text-[8px] font-black uppercase tracking-[0.4em] text-gold-primary/40 mt-1">Núcleo Empresarial</span>
            </div>
          )}
        </div>

        <nav className="flex-1 px-4 space-y-3 overflow-y-auto relative z-10 py-4 custom-scrollbar">
          {filteredMenu.map(item => (
            <SidebarItem
              key={item.id}
              icon={item.icon}
              label={sidebarOpen ? item.label : ""}
              active={activeTab === item.id}
              onClick={() => setActiveTab(item.id)}
            />
          ))}
        </nav>

        {/* User Identity Section */}
        {sidebarOpen && (
          <div className="px-6 py-5 border-t border-white/5 bg-gold-primary/[0.02] relative overflow-hidden">
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-10 h-10 rounded-[14px] bg-white/5 border border-gold-primary/20 flex items-center justify-center text-gold-primary shadow-[0_0_15px_rgba(212,175,55,0.1)] shrink-0">
                <User size={20} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-black text-white uppercase tracking-tight truncate">{displayName}</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-gold-primary animate-pulse" />
                  <span className="text-[7px] font-black text-gold-primary/40 uppercase tracking-[0.2em]">Sessão Validada</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="p-6 border-t border-white/5 space-y-3 relative z-10 bg-white/[0.02]">
          <button
            onClick={() => setView('public')}
            className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-white/40 hover:bg-white/5 hover:text-gold-primary transition-all group"
          >
            <Smartphone size={18} className="group-hover:scale-110 transition-transform" />
            {sidebarOpen && <span className="font-black text-[10px] uppercase tracking-widest">Portal de Vendas</span>}
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-red-500/60 hover:bg-red-500/10 hover:text-red-400 transition-all group"
          >
            <LogOut size={18} className="group-hover:translate-x-1 transition-transform" />
            {sidebarOpen && <span className="font-black text-[10px] uppercase tracking-widest">Sair do Sistema</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0 relative">
        {/* Background Glows for Main Area */}
        <div className="absolute top-[10%] right-[10%] w-[40%] h-[40%] bg-gold-primary/5 rounded-full blur-[150px] pointer-events-none" />

        {/* Header */}
        <header className="h-20 glass-panel border-b border-white/5 flex items-center justify-between px-8 shrink-0 z-10 relative">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden md:flex p-2.5 hover:bg-gold-primary/10 rounded-xl text-gold-primary/60 hover:text-gold-primary transition-all border border-transparent hover:border-gold-primary/20"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="flex flex-col">
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-gold-primary/40 leading-none mb-1.5">
                Terminal Actual
              </div>
              <div className="text-sm font-black text-white tracking-widest group cursor-pointer flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gold-primary animate-pulse shadow-[0_0_8px_rgba(212,175,55,1)]" />
                {isMasterPortal ? 'COMANDO GLOBAL SAAS' : user?.company_name?.toUpperCase()}
                <span className="text-gold-primary/60">&mdash; {user?.role?.toUpperCase()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {user?.email === 'simaopambo94@gmail.com' && user?.role !== 'master' && (
              <button
                onClick={() => {
                  const savedUser = JSON.parse(sessionStorage.getItem('erp_user') || '{}');
                  const masterUser = {
                    ...savedUser,
                    role: 'master',
                    company_id: 1,
                    company_name: 'Venda Plus Global'
                  };
                  sessionStorage.setItem('erp_user', JSON.stringify(masterUser));
                  window.location.reload();
                }}
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white px-5 py-2.5 rounded-2xl font-black text-[9px] uppercase tracking-[0.2em] hover:shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all border border-indigo-500/30"
              >
                <ArrowRight size={14} className="rotate-180" /> Sobreposição Global
              </button>
            )}

            <div className="flex items-center gap-4 pl-6 border-l border-white/5">
              <div className="text-right flex flex-col items-end min-w-0">
                <div className="text-[10px] font-black text-white uppercase tracking-wider leading-none mb-1 truncate max-w-[120px]">{displayName}</div>
                <div className="text-[8px] font-bold text-gold-primary/40 tracking-widest uppercase hidden sm:block truncate max-w-[150px]">{user?.email}</div>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl flex items-center justify-center text-gold-primary border border-white/10 shadow-lg relative group transition-all hover:border-gold-primary/40 shrink-0">
                <Users size={20} className="sm:size-[24px]" />
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-gold-primary rounded-full border-2 border-bg-deep shadow-[0_0_8px_rgba(212,175,55,1)]" />
              </div>
              <button onClick={logout} className="md:hidden p-2 text-red-500/60 hover:text-red-400 transition-colors">
                <LogOut size={22} />
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'master' && <MasterAdmin />}
          {activeTab === 'sales' && <SalesModule />}
          {activeTab === 'pharmacy' && <PharmacyModule />}
          {activeTab === 'hr' && <HRModule />}
          {activeTab === 'accounting' && <Accounting user={user as any} />}
          {activeTab === 'saft' && <SaftModule />}
          {activeTab === 'marketing' && <Marketing />}
          {activeTab === 'blog' && <BlogPage user={user as any} />}
          {activeTab === 'subscription' && <SubscriptionManagement />}
          {activeTab === 'mobile' && <MobileAppInfo />}
          {activeTab === 'users' && <UsersList />}
          {activeTab === 'suppliers' && <Suppliers />}
          {activeTab === 'settings' && <Settings />}
          {activeTab === 'support' && <Support />}
        </div>
      </main>

      {/* Bottom Navigation - Mobile Only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-panel border-t border-white/10 px-4 py-3 flex justify-around items-center z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        {filteredMenu.slice(0, 5).map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-1.5 p-2 transition-all relative ${activeTab === item.id ? 'text-gold-primary scale-110' : 'text-white/30'}`}
          >
            {activeTab === item.id && (
              <div className="absolute -top-1 w-1 h-1 bg-gold-primary rounded-full shadow-[0_0_8px_rgba(212,175,55,1)]" />
            )}
            <item.icon size={20} />
            <span className="text-[8px] font-black uppercase tracking-widest">{item.label.split(' ')[0]}</span>
          </button>
        ))}
        <button
          onClick={() => setView('public')}
          className="flex flex-col items-center gap-1.5 p-2 text-white/30"
        >
          <Store size={20} />
          <span className="text-[8px] font-black uppercase tracking-widest">Portal</span>
        </button>
      </nav>
    </div>
  );
}
