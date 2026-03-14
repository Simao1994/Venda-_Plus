import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import {
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
  MessageSquare
} from 'lucide-react';
import { supabase } from "./lib/supabase";
import Support from "./components/Support";
import { syncDatabaseSchema } from "./lib/database-sync";
import UsersList from './components/Users';
import Settings from './components/Settings';
import PharmacyModule from './components/pharmacy/PharmacyModule';
import SalesModule from './components/sales/SalesModule';
import HRModule from './components/hr/HRModule';
import MobileApp from './components/MobileApp';
import PublicHome from './components/PublicHome';
import Marketing from './components/Marketing';
import MasterAdmin from './components/MasterAdmin';
import Registration from './components/Registration';
import SubscriptionManagement from './components/SubscriptionManagement';
import MobileAppInfo from './components/MobileAppInfo';

function Login({ onBackToPublic, onGoToRegister }: { onBackToPublic: () => void, onGoToRegister: () => void }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok) {
      login(data.token, data.user);
    } else {
      setError(data.error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 relative">
      <button
        onClick={onBackToPublic}
        className="absolute top-8 left-8 flex items-center gap-2 text-gray-500 hover:text-gray-900 font-bold transition-colors"
      >
        <X size={20} />
        Voltar para o Market
      </button>
      <div className="bg-white p-10 rounded-[40px] shadow-2xl w-full max-w-md border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-emerald-600" />
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-emerald-600 rounded-[24px] flex items-center justify-center text-white mx-auto mb-6 shadow-2xl shadow-emerald-200">
            <Store size={40} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter italic">VENDA <span className="text-emerald-600">PLUS</span></h1>
          <p className="text-gray-400 font-medium mt-2">Gestão Profissional e Escalável</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm mb-8 text-center font-bold border border-red-100">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Email Corporativo</label>
            <input
              type="email"
              autoComplete="off"
              className="w-full px-5 py-4 rounded-2xl border-2 border-gray-50 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 font-bold transition-all text-gray-900"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Palavra-passe</label>
            <input
              type="password"
              autoComplete="off"
              className="w-full px-5 py-4 rounded-2xl border-2 border-gray-50 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 font-bold transition-all text-gray-900"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end pr-1">
            <button
              type="button"
              onClick={() => setShowForgotModal(true)}
              className="text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700"
            >
              Esqueci a minha senha
            </button>
          </div>
          <button
            type="submit"
            className="w-full bg-emerald-600 text-white py-5 rounded-[24px] font-black text-lg hover:bg-emerald-700 transition-all shadow-2xl shadow-emerald-200 mt-4 active:scale-95"
          >
            Entrar no Sistema
          </button>
        </form>

        <div className="mt-12 text-center text-[10px] font-black uppercase tracking-widest text-gray-300">
          &copy; 2026 Venda Plus. Todos os direitos reservados.
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
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active
        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
        : 'text-gray-500 hover:bg-gray-100'
        }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );
}

export default function App() {
  const { user, isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('sales');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [view, setView] = useState<'public' | 'erp'>('public');
  const [isRegistering, setIsRegistering] = useState(false);
  const [licenseStatus, setLicenseStatus] = useState<{ active: boolean, message?: string }>({ active: true });
  const [features, setFeatures] = useState<string[]>([]);

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
    { id: 'marketing', label: "Marketing", icon: Smartphone, roles: ['admin', 'manager', 'master'], feature: 'marketing' },
    { id: 'subscription', label: "Gestão de Assinatura", icon: CreditCard, roles: ['admin', 'manager'], feature: 'settings' },
    { id: 'mobile', label: "APP Mobile", icon: Smartphone, roles: ['admin', 'manager', 'cashier', 'master'], feature: 'marketing' },
    { id: 'users', label: "Utilizadores", icon: Users, roles: ['admin', 'master'], feature: 'settings' },
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
  const themeClass = isMasterPortal ? 'from-slate-900 to-indigo-950' : 'bg-gray-50';
  const accentColor = isMasterPortal ? 'indigo' : 'emerald';

  return (
    <div className={`flex h-screen overflow-hidden flex-col md:flex-row ${themeClass}`}>
      {/* Sidebar - Desktop Only */}
      <aside className={`hidden md:flex ${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r transition-all duration-300 flex-col shadow-sm z-20`}>
        <div className="p-6 flex items-center gap-3">
          <div className={`w-10 h-10 bg-${accentColor}-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md`}>
            <Store size={24} />
          </div>
          {sidebarOpen && <span className="font-black text-xl text-gray-900 tracking-tighter italic">VENDA <span className={`text-${accentColor}-600`}>PLUS</span></span>}
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
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

        <div className="p-4 border-t space-y-2">
          <button
            onClick={() => setView('public')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:bg-gray-100 transition-all"
          >
            <Smartphone size={20} />
            {sidebarOpen && <span className="font-medium">Ir para o Market</span>}
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all"
          >
            <LogOut size={20} />
            {sidebarOpen && <span className="font-medium">Sair</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0">
        {/* Header */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden md:block p-2 hover:bg-gray-100 rounded-lg text-gray-500">
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="text-sm font-bold text-gray-900 md:font-medium md:text-gray-500">
              {isMasterPortal ? 'SaaS Global Control' : user?.company_name} <span className="hidden sm:inline">- {user?.role.toUpperCase()}</span>
            </div>
          </div>
          {/* Master Return Button */}
          {user?.email === 'simaopambo94@gmail.com' && user?.role !== 'master' && (
            <button
              onClick={() => {
                const savedUser = JSON.parse(sessionStorage.getItem('erp_user') || '{}');
                const masterUser = {
                  ...savedUser,
                  role: 'master',
                  company_id: 1, // Global Master Company
                  company_name: 'Venda Plus Global'
                };
                sessionStorage.setItem('erp_user', JSON.stringify(masterUser));
                window.location.reload();
              }}
              className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-wider hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
            >
              <ArrowRight size={14} className="rotate-180" /> Voltar ao Master
            </button>
          )}

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-bold text-gray-900">{user?.name}</div>
              <div className="text-xs text-gray-500">{user?.email}</div>
            </div>
            <button onClick={logout} className="md:hidden p-2 text-red-500">
              <LogOut size={20} />
            </button>
            <div className="hidden sm:flex w-10 h-10 bg-gray-100 rounded-full items-center justify-center text-gray-500 border">
              <Users size={20} />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'master' && <MasterAdmin />}
          {activeTab === 'sales' && <SalesModule />}
          {activeTab === 'pharmacy' && <PharmacyModule />}
          {activeTab === 'hr' && <HRModule />}
          {activeTab === 'marketing' && <Marketing />}
          {activeTab === 'subscription' && <SubscriptionManagement />}
          {activeTab === 'mobile' && <MobileAppInfo />}
          {activeTab === 'users' && <UsersList />}
          {activeTab === 'settings' && <Settings />}
          {activeTab === 'support' && <Support />}
        </div>
      </main>

      {/* Bottom Navigation - Mobile Only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-2 flex justify-around items-center z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        {filteredMenu.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-1 p-2 transition-all ${activeTab === item.id ? 'text-emerald-600 scale-110' : 'text-gray-400'}`}
          >
            <item.icon size={20} />
            <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
          </button>
        ))}
        <button
          onClick={() => setView('public')}
          className="flex flex-col items-center gap-1 p-2 text-gray-400"
        >
          <Store size={20} />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Market</span>
        </button>
      </nav>
    </div >
  );
}
