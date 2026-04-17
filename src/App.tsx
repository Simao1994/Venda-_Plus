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
  User,
  Clock,
  BarChart,
  FolderOpen,
  Globe,
  TrendingUp
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
import EmployeeSales from './components/reports/EmployeeSales';
import LabelsModule from './components/labels/LabelsModule';
import FilesModule from './components/files/FilesModule';
import AgtModule from './components/agt/AgtModule';
import InvestmentsModule from './components/investments/InvestmentsModule';
import InvestorPortal from './components/investments/InvestorPortal';
import SystemModeHandler from './components/SystemModeHandler';
import Logo from './components/Logo';

function Login({ onBackToPublic, onGoToRegister, onInvestorLogin }: { onBackToPublic: () => void, onGoToRegister: () => void, onInvestorLogin: (session: any) => void }) {
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

      <div className="bg-bg-deep/95 p-10 rounded-[40px] w-full max-w-md relative overflow-hidden ring-1 ring-gold-primary/30 shadow-[0_0_50px_rgba(212,175,55,0.1)]">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold-primary to-transparent opacity-50" />

        <div className="text-center mb-10">
          <Logo className="justify-center" />
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
              className="w-full px-6 py-4 rounded-2xl bg-white/5 border-2 border-white/10 focus:border-gold-primary focus:ring-4 focus:ring-gold-primary/10 font-bold transition-all text-white placeholder-white/20 outline-none"
              placeholder="admin@venda-plus.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gold-primary/60 ml-2">Palavra-passe</label>
              <input
                type="password"
                autoComplete="off"
                className="w-full px-6 py-4 rounded-2xl bg-white/5 border-2 border-white/10 focus:border-gold-primary focus:ring-4 focus:ring-gold-primary/10 font-bold transition-all text-white placeholder-white/20 outline-none"
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
                className="text-[10px] font-black uppercase tracking-[0.2em] text-gold-primary/40 hover:text-gold-primary transition-colors font-bold"
              >
                Recuperar Acesso
              </button>
            </div>
            <button
              type="submit"
              className="w-full py-5 rounded-3xl bg-gradient-to-r from-gold-primary to-gold-secondary text-bg-deep font-black text-sm uppercase tracking-[0.2em] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all mt-4 border border-gold-primary/20 hover:scale-[1.02] active:scale-95"
            >
              Entrar no Portal
            </button>
          </div>
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

function SidebarItem({ icon: Icon, label, active, onClick, collapsed }: any) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={`w-full flex items-center gap-3 px-4 py-3.5 lg:px-5 lg:py-4 rounded-2xl transition-all relative group overflow-hidden ${
        active
          ? 'bg-gradient-to-r from-gold-primary to-gold-secondary text-bg-deep shadow-[0_10px_20px_rgba(212,175,55,0.2)] scale-[1.02]'
          : 'text-white/40 hover:bg-white/5 hover:text-gold-primary'
      }`}
    >
      {active && (
        <div className="absolute top-0 right-0 w-1 h-full bg-white/20" />
      )}
      <Icon size={18} className={active ? 'animate-pulse shrink-0' : 'group-hover:scale-110 transition-transform shrink-0'} />
      {!collapsed && (
        <span className={`font-black uppercase tracking-[0.12em] text-[9px] lg:text-[10px] lg:tracking-[0.15em] truncate ${
          active ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'
        }`}>
          {label}
        </span>
      )}
    </button>
  );
}

export default function App() {
  const { user, isAuthenticated, login, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('sales');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const displayName = user?.name || user?.email?.split('@')[0].split('.')[0].toUpperCase() || 'OPERATOR';
    const isMasterPortal = user?.role === 'master';
    const [licenseStatus, setLicenseStatus] = useState<{ active: boolean, message?: string }>({ active: true });
    const [features, setFeatures] = useState<string[]>([]);
    const [showRenewal, setShowRenewal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [daysUntilExpiry, setDaysUntilExpiry] = useState<number | null>(null);
    const [isExpiringSoon, setIsExpiringSoon] = useState(false);
    
    const [isRegistering, setIsRegistering] = useState(false);
    const [investorSession, setInvestorSession] = useState<any>(null);
    const isBypassActive = sessionStorage.getItem('maintenance_bypass') === 'true';
    const [view, setView] = useState<'public' | 'erp'>(isBypassActive ? 'erp' : 'public');

  const menuItems = [
    { id: 'master', label: "Administração SaaS", icon: LayoutDashboard, roles: ['master'], feature: 'master_all' },
    { id: 'sales', label: "Vendas", icon: Briefcase, roles: ['admin', 'manager', 'cashier', 'master'], feature: 'sales' },
    { id: 'pharmacy', label: "Farmácia", icon: Cross, roles: ['admin', 'manager', 'cashier', 'master'], feature: 'pharmacy' },
    { id: 'hr', label: "Gestão de Recursos Humanos", icon: FileSpreadsheet, roles: ['admin', 'manager', 'master'], feature: 'hr' },
    { id: 'accounting', label: "Contabilidade", icon: Calculator, roles: ['admin', 'manager', 'master'], feature: 'sales' },
    { id: 'investments', label: "Gestão de Aplicações Financeiras", icon: TrendingUp, roles: ['admin', 'manager', 'master'], feature: 'investments' },
    { id: 'saft', label: "SAF-T (AOA) XML", icon: FileText, roles: ['admin', 'manager', 'master'], feature: 'sales' },

    { id: 'agt', label: "Webservice AGT", icon: Globe, roles: ['admin', 'manager', 'master'], feature: 'sales' },
    { id: 'employee_sales', label: "Desempenho Vendas", icon: BarChart, roles: ['admin', 'manager', 'master'], feature: 'sales' },
    { id: 'marketing', label: "Marketing", icon: Smartphone, roles: ['admin', 'manager', 'master'], feature: 'marketing' },
    { id: 'blog', label: "Blog Corporativo", icon: FileText, roles: ['admin', 'manager', 'master'], feature: 'marketing' },
    { id: 'subscription', label: "Gestão de Assinatura", icon: CreditCard, roles: ['admin', 'manager'], feature: 'subscription' },
    { id: 'mobile', label: "APP Mobile", icon: Smartphone, roles: ['admin', 'manager', 'cashier', 'master'], feature: 'marketing' },
    { id: 'labels', label: "Etiquetas", icon: Tag, roles: ['admin', 'manager', 'master'], feature: 'sales' },
    { id: 'files', label: "Arquivos", icon: FolderOpen, roles: ['admin', 'manager', 'master'], feature: 'marketing' },
    { id: 'users', label: user?.role === 'master' ? "Gestão de Utilizadores" : "Equipa & Licenças", icon: Users, roles: ['admin', 'master'], feature: 'settings' },
    { id: 'suppliers', label: "Fornecedores", icon: Truck, roles: ['admin', 'manager', 'master'], feature: 'sales' },
    { id: 'settings', label: "Configurações", icon: SettingsIcon, roles: ['admin', 'master'], feature: 'settings' },
    { id: 'support', label: "Suporte Técnico", icon: MessageSquare, roles: ['admin', 'manager', 'cashier', 'master'], feature: 'support' },
  ];

  const filteredMenu = menuItems.filter(item => {
    if (!user) return false;
    
    const userRole = user.role?.toLowerCase().trim() || '';
    
    // Master role always has all access
    if (userRole === 'master') return true;

    // Prevent Admin lockouts: Admin roles should ALWAYS see core configuration items.
    const alwaysVisibleForAdmin = ['subscription', 'settings', 'users'];
    if (userRole === 'admin' && alwaysVisibleForAdmin.includes(item.id)) {
        return true;
    }

    // Strict Permission Check: If user has granular permissions defined, respect them
    if (user.permissions && typeof user.permissions === 'object') {
      if (user.permissions[item.id] !== undefined) {
        // If the permission is explicitly defined for this user, follow it
        if (user.permissions[item.id] === false) return false;
        if (user.permissions[item.id] === true) {
          // Still need to check if the company feature is enabled OR item is always visible
          const isAlwaysVisible = ['subscription', 'settings', 'users', 'support'].includes(item.id);
          const hasFeature = features.includes(item.feature) || features.includes('master_all');
          return hasFeature || isAlwaysVisible;
        }
      }
    }

    // Fallback to role-based and feature-based check
    const hasRole = item.roles.includes(userRole) || item.roles.includes(user.role);

    // Core admin items are ALWAYS visible regardless of plan features
    const alwaysVisible = ['subscription', 'settings', 'users', 'support'];
    if (alwaysVisible.includes(item.id)) return hasRole;

    const hasFeature = features.includes(item.feature) || features.includes('master_all');
    
    return hasRole && hasFeature;
  });

  useEffect(() => {
    // Recover investor session from localStorage
    const savedInvestorSession = localStorage.getItem('investor_session');
    if (savedInvestorSession) {
      try {
        const parsed = JSON.parse(savedInvestorSession);
        // Validar formato (se tiver investor direto ou dentro de um objeto session)
        if (parsed && (parsed.investor || (parsed.session && parsed.session.investor))) {
          // Normalizar para o novo formato plano se necessário
          const sessionData = parsed.session ? parsed.session : parsed;
          setInvestorSession(sessionData);
        } else {
          console.warn('⚠️ [Sessão Investidor] Formato inválido ou corrompido. A limpar...');
          localStorage.removeItem('investor_session');
        }
      } catch (e) {
        localStorage.removeItem('investor_session');
      }
    }
  }, []);

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
        const initSession = async () => {
            if (isAuthenticated) {
                if (user?.role !== 'master') {
                    await fetchSubscription();
                } else {
                    setFeatures(['master_all']);
                    setIsLoading(false);
                }
            } else {
                setIsLoading(false);
            }
        };
        initSession();
    }, [isAuthenticated, user]);

    // Auto-select first available tab if current one is not permitted
    useEffect(() => {
        if (!isLoading && isAuthenticated && user?.role !== 'master') {
            const isTabPermitted = filteredMenu.some(item => item.id === activeTab);
            if (!isTabPermitted) {
                const firstAvailable = filteredMenu.find(item => item.id !== 'master');
                if (firstAvailable) {
                    console.log(`[Navigation] Tab '${activeTab}' not permitted. Switching to '${firstAvailable.id}'`);
                    setActiveTab(firstAvailable.id);
                }
            }
        }
    }, [isLoading, isAuthenticated, user, filteredMenu, activeTab]);

    const fetchSubscription = async () => {
        try {
            const token = localStorage.getItem('erp_token');
            const res = await fetch('/api/company/subscription', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.status === 401) {
                setIsLoading(false);
                return logout();
            }
            
            const data = await res.json();

            if (res.ok) {
                // Prioritize features directly on the subscription (override)
                const parseF = (f: any) => {
                    if (Array.isArray(f)) return f;
                    if (typeof f === 'string') {
                        try { return JSON.parse(f); } catch (e) { return []; }
                    }
                    return [];
                };

                const planFeatures = parseF(data.saas_plans?.features);
                const subFeatures = data.features; // JSONB from DB
                
                // Strict Precedence: If subFeatures is an array (even if empty), it's the source of truth.
                // Otherwise (if null), fallback to planFeatures.
                let finalFeatures = Array.isArray(subFeatures) ? subFeatures : planFeatures;
                
                if (!finalFeatures || finalFeatures.length === 0) {
                    finalFeatures = ['sales', 'products', 'customers', 'hr', 'accounting', 'investments', 'pharmacy', 'blog', 'marketing', 'reports', 'settings', 'labels', 'files', 'support', 'mobile_app', 'users'];
                }
                
                console.log(`[ERP Init] Módulos carregados para ${user?.company_name || 'Empresa'}:`, finalFeatures);
                setFeatures(finalFeatures);
                if (data.data_expiracao) {
                    const expiryDate = new Date(data.data_expiracao);
                    const now = new Date();
                    const diffTime = expiryDate.getTime() - now.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    setDaysUntilExpiry(diffDays);
                    setIsExpiringSoon(diffDays > 0 && diffDays <= 7);

                    if (diffDays <= 0) {
                        setLicenseStatus({ active: false, message: "A sua subscrição expirou. Por favor, regularize o pagamento." });
                    } else if (data.status === 'suspended' || data.status === 'expired') {
                        setLicenseStatus({ active: false, message: `Status da conta: ${data.status.toUpperCase()}` });
                    } else {
                        setLicenseStatus({ active: true });
                    }
                } else if (data.status === 'suspended' || data.status === 'expired') {
                    setLicenseStatus({ active: false, message: `Status da conta: ${data.status.toUpperCase()}` });
                } else {
                    setLicenseStatus({ active: true });
                }
            } else {
                setLicenseStatus({ active: false, message: "Aguardando ativação do plano." });
            }
        } catch (err) {
            console.error('Error checking subscription:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Emergency initialization safety valve
    useEffect(() => {
        const timer = setTimeout(() => {
            if (isLoading) {
                console.warn('⚠️ [System] Initialization taking too long. Forcing resolution...');
                setIsLoading(false);
            }
        }, 3000); // Max 3 seconds
        return () => clearTimeout(timer);
    }, [isLoading]);

  if (view === 'erp' && isRegistering) {
    return <Registration onBack={() => { setIsRegistering(false); setView('public'); }} onSuccess={() => setIsRegistering(false)} />;
  }

  if (!isAuthenticated && view === 'erp') {
    return (
      <Login 
        onBackToPublic={() => setView('public')} 
        onGoToRegister={() => setIsRegistering(true)} 
        onInvestorLogin={(session) => {
          setInvestorSession(session);
          localStorage.setItem('investor_session', JSON.stringify(session));
        }}
      />
    );
  }

  if (investorSession) {
    return (
      <InvestorPortal 
        session={investorSession} 
        onLogout={() => {
          setInvestorSession(null);
          localStorage.removeItem('investor_session');
        }} 
      />
    );
  }

    // 🔄 Master Loading State
    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0B0B0B] flex flex-col items-center justify-center p-6 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-gold-primary/5 rounded-full blur-[140px] animate-pulse" />
                <Logo className="mb-10 justify-center scale-150" />
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-1 px-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-gold-primary rounded-full animate-[progress_2s_ease-in-out_infinite]" />
                    </div>
                    <span className="text-[10px] font-black text-gold-primary/40 uppercase tracking-[0.4em] animate-pulse italic">
                        Inicializando Matrix
                    </span>
                </div>
                <style dangerouslySetInnerHTML={{ __html: `
                    @keyframes progress {
                        0% { width: 0%; transform: translateX(-100%); }
                        50% { width: 100%; transform: translateX(0%); }
                        100% { width: 0%; transform: translateX(100%); }
                    }
                `}} />
            </div>
        );
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
      onInvestorLogin={(session) => {
        setInvestorSession(session);
        localStorage.setItem('investor_session', JSON.stringify(session));
      }}
    />;
  }


  // Mobile ERP: No redirect — the responsive layout handles all screen sizes natively.

  // Subscription Check (Global)
  if (isAuthenticated && user?.role !== 'master' && !licenseStatus.active && !showRenewal) {
    return (
      <div className="min-h-screen bg-bg-deep flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full glass-panel p-12 rounded-[48px] shadow-2xl relative overflow-hidden border border-white/5">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-500 to-gold-primary" />
          <div className="w-24 h-24 bg-amber-500/10 rounded-[32px] flex items-center justify-center text-amber-500 mx-auto mb-8 border border-amber-500/20 shadow-2xl shadow-amber-500/20">
            <AlertCircle size={48} className="animate-pulse" />
          </div>
          <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-4">Acesso <span className="text-amber-500">Suspenso</span></h2>
          <p className="text-white/40 font-black uppercase text-[10px] tracking-[0.2em] leading-relaxed mb-10 max-w-[280px] mx-auto">
            {licenseStatus.message || "A SUA ASSINATURA EXPIROU OU O PAGAMENTO NÃO FOI CONFIRMADO. POR FAVOR, CONTACTE O ADMINISTRADOR PARA REGULARIZAR O ACESSO."}
          </p>
          <div className="space-y-4">
            {['admin', 'manager'].includes(user?.role || '') && (
              <button 
                onClick={() => setShowRenewal(true)}
                className="w-full bg-gold-primary text-black py-5 rounded-3xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-gold-secondary transition-all shadow-xl shadow-gold-primary/20 active:scale-95 flex items-center justify-center gap-3"
              >
                Regularizar Plano <ArrowRight size={16} />
              </button>
            )}
            <button onClick={logout} className="w-full text-white/20 font-black uppercase text-[9px] tracking-widest hover:text-white transition-colors py-2 flex items-center justify-center gap-2">
              <LogOut size={14} /> Sair da Conta
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Renewal Mode: Show Subscription Management
  if (showRenewal) {
    return (
      <div className="min-h-screen bg-bg-deep flex flex-col">
        <header className="h-20 glass-panel border-b border-white/5 flex items-center justify-between px-8 shrink-0 z-10 relative">
          <div className="flex items-center gap-4">
            <Logo />
            <div className="h-6 w-[1px] bg-white/10 mx-2" />
            <span className="text-[10px] font-black text-gold-primary uppercase tracking-[0.3em]">Portal de Renovação</span>
          </div>
          <button onClick={() => setShowRenewal(false)} className="px-6 py-2 bg-white/5 text-white/60 hover:text-white rounded-xl text-[10px] font-black uppercase transition-all">
            Voltar
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-10">
          <SubscriptionManagement />
        </div>
      </div>
    );
  }



  return (
    <div className="flex h-screen overflow-hidden flex-col md:flex-row bg-bg-deep font-sans">

      {/* Mobile Full-Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      <div className={`md:hidden fixed bottom-16 left-0 right-0 z-50 glass-panel border-t border-white/10 transition-all duration-300 overflow-y-auto ${
        mobileMenuOpen ? 'max-h-[60vh] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
      }`}>
        <div className="p-4 grid grid-cols-3 gap-2">
          {filteredMenu.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all ${
                activeTab === item.id
                  ? 'bg-gold-primary/20 text-gold-primary'
                  : 'text-white/30 hover:bg-white/5 hover:text-white/60'
              }`}
            >
              <item.icon size={20} />
              <span className="text-[8px] font-black uppercase tracking-wider text-center leading-tight">
                {item.label.split(' ').slice(0, 2).join(' ')}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Sidebar - Tablet (md) & Desktop */}
      <aside className={`${
        sidebarOpen ? 'w-64 lg:w-72' : 'w-16 lg:w-20'
      } hidden md:flex glass-panel border-r border-white/5 transition-all duration-500 flex-col z-20 relative overflow-hidden`}>
        {/* Sidebar Background Glow */}
        <div className="absolute top-[-20%] left-[-20%] w-[150%] h-[150%] bg-gold-primary/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="p-4 lg:p-6 flex items-center relative z-10 transition-all">
          <Logo collapsed={!sidebarOpen} />
        </div>

        <nav className="flex-1 px-2 lg:px-4 space-y-1 lg:space-y-3 overflow-y-auto relative z-10 py-2 lg:py-4 custom-scrollbar">
          {filteredMenu.map(item => (
            <SidebarItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={activeTab === item.id}
              onClick={() => setActiveTab(item.id)}
              collapsed={!sidebarOpen}
            />
          ))}
        </nav>




        {/* User Identity Section */}
        {sidebarOpen && (
          <div className="px-4 lg:px-6 py-4 lg:py-5 border-t border-white/5 bg-gold-primary/[0.02] relative overflow-hidden">
            <div className="flex items-center gap-3 lg:gap-4 relative z-10">
              <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl lg:rounded-[14px] bg-white/5 border border-gold-primary/20 flex items-center justify-center text-gold-primary shadow-[0_0_15px_rgba(212,175,55,0.1)] shrink-0">
                <User size={16} className="lg:hidden" />
                <User size={20} className="hidden lg:block" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[9px] lg:text-[10px] font-black text-white uppercase tracking-tight">{displayName}</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-gold-primary animate-pulse" />
                  <span className="text-[7px] font-black text-gold-primary/40 uppercase tracking-[0.2em]">Sessão Validada</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="p-3 lg:p-6 border-t border-white/5 space-y-2 lg:space-y-3 relative z-10 bg-white/[0.02]">
          <button
            onClick={() => setView('public')}
            className="w-full flex items-center gap-3 px-3 lg:px-5 py-3 lg:py-4 rounded-2xl text-white/40 hover:bg-white/5 hover:text-gold-primary transition-all group"
          >
            <Smartphone size={16} className="group-hover:scale-110 transition-transform shrink-0 lg:hidden" />
            <Smartphone size={18} className="group-hover:scale-110 transition-transform shrink-0 hidden lg:block" />
            {sidebarOpen && <span className="font-black text-[9px] lg:text-[10px] uppercase tracking-widest truncate">Home Principal</span>}
          </button>
          <button
            onClick={() => {
              logout();
              localStorage.removeItem('investor_session');
            }}
            className="w-full flex items-center gap-3 px-3 lg:px-5 py-3 lg:py-4 rounded-2xl text-red-500/60 hover:bg-red-500/10 hover:text-red-400 transition-all group"
          >
            <LogOut size={16} className="group-hover:translate-x-1 transition-transform shrink-0 lg:hidden" />
            <LogOut size={18} className="group-hover:translate-x-1 transition-transform shrink-0 hidden lg:block" />
            {sidebarOpen && <span className="font-black text-[9px] lg:text-[10px] uppercase tracking-widest truncate">Sair do Sistema</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden pb-14 md:pb-0 relative">
        {/* Background Glows for Main Area */}
        <div className="absolute top-[10%] right-[10%] w-[40%] h-[40%] bg-gold-primary/5 rounded-full blur-[150px] pointer-events-none" />

        {/* Custom Home Background */}
        {user?.company_home_image && (
          <div
            className="absolute inset-0 z-0 pointer-events-none opacity-[0.07] transition-all duration-1000"
            style={{
              backgroundImage: `url(${user.company_home_image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'grayscale(0.5) contrast(1.2)'
            }}
          />
        )}

        {/* Header */}
        <header className="h-14 md:h-16 lg:h-20 glass-panel border-b border-white/5 flex items-center justify-between px-3 sm:px-5 md:px-8 shrink-0 z-10 relative">
          <div className="flex items-center gap-2 md:gap-4 lg:gap-6 min-w-0">
            {/* Mobile: logo mark + company */}
            <div className="flex md:hidden items-center gap-2 min-w-0">
              <div className="w-8 h-8 bg-gradient-to-br from-gold-primary to-gold-secondary rounded-lg flex items-center justify-center text-bg-deep shrink-0">
                <img src="/favicon.png" className="w-5 h-5 object-contain" alt="VP" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[9px] font-black text-gold-primary/40 uppercase tracking-widest leading-none">Terminal</span>
                <span className="text-xs font-black text-white truncate max-w-[130px]">
                  {isMasterPortal ? 'SAAS GLOBAL' : user?.company_name?.toUpperCase()}
                </span>
              </div>
            </div>
            {/* Desktop: toggle + company info */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden md:flex p-2 lg:p-2.5 hover:bg-gold-primary/10 rounded-xl text-gold-primary/60 hover:text-gold-primary transition-all border border-transparent hover:border-gold-primary/20 shrink-0"
            >
              {sidebarOpen ? <X size={18} className="lg:hidden" /> : <Menu size={18} className="lg:hidden" />}
              {sidebarOpen ? <X size={20} className="hidden lg:block" /> : <Menu size={20} className="hidden lg:block" />}
            </button>
            <div className="hidden md:flex flex-col min-w-0">
              <div className="text-[9px] lg:text-[10px] font-black uppercase tracking-[0.3em] text-gold-primary/40 leading-none mb-1">
                Terminal Actual
              </div>
              <div className="text-xs lg:text-sm font-black text-white tracking-widest flex items-center gap-2 min-w-0">
                <div className="w-2 h-2 rounded-full bg-gold-primary animate-pulse shadow-[0_0_8px_rgba(212,175,55,1)] shrink-0" />
                <span className="truncate max-w-[120px] lg:max-w-none">
                  {isMasterPortal ? 'COMANDO GLOBAL SAAS' : user?.company_name?.toUpperCase()}
                </span>
                <span className="text-gold-primary/60 shrink-0 hidden lg:inline">&mdash; {user?.role?.toUpperCase()}</span>
              </div>
            </div>
          </div>

          {/* Expiry Warning Banner */}
          {isExpiringSoon && !showRenewal && (
            <div className="absolute top-20 left-0 right-0 z-40 px-8 animate-in slide-in-from-top duration-500">
              <div className="bg-gradient-to-r from-amber-500/90 to-orange-600/90 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 flex items-center justify-between shadow-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white animate-pulse">
                    <Clock size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-white/60 tracking-widest leading-none mb-1">Aviso de Expiração</p>
                    <p className="text-xs font-black text-white uppercase italic">
                      A sua licença expira em <span className="text-yellow-200">{daysUntilExpiry} {daysUntilExpiry === 1 ? 'dia' : 'dias'}</span>. Por favor, regularize para evitar interrupções.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowRenewal(true)}
                  className="bg-white text-orange-600 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg"
                >
                  Renovar Agora
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 md:gap-4 lg:gap-6 shrink-0">
            {user?.email === 'simaopambo94@gmail.com' && user?.role !== 'master' && (
              <button
                onClick={() => {
                  const savedUser = JSON.parse(localStorage.getItem('erp_user') || '{}');
                  const masterUser = {
                    ...savedUser,
                    role: 'master',
                    company_id: 1,
                    company_name: 'Venda Plus Global'
                  };
                  localStorage.setItem('erp_user', JSON.stringify(masterUser));
                  window.location.reload();
                }}
                className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white px-3 lg:px-5 py-2 lg:py-2.5 rounded-2xl font-black text-[8px] lg:text-[9px] uppercase tracking-[0.2em] hover:shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all border border-indigo-500/30"
              >
                <ArrowRight size={12} className="rotate-180" />
                <span className="hidden lg:inline">Sobreposição Global</span>
                <span className="lg:hidden">Global</span>
              </button>
            )}

            <div className="flex items-center gap-2 md:gap-3 lg:gap-4 md:pl-4 lg:pl-6 md:border-l border-white/5">
              <div className="hidden md:flex text-right flex-col items-end min-w-0">
                <div className="text-[9px] lg:text-[10px] font-black text-white uppercase tracking-wider leading-none mb-1">{displayName}</div>
                <div className="text-[8px] font-bold text-gold-primary/40 tracking-widest uppercase hidden lg:block truncate max-w-[110px] xl:max-w-[150px]">{user?.email}</div>
              </div>
              <div className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-white/10 to-white/5 rounded-xl lg:rounded-2xl flex items-center justify-center text-gold-primary border border-white/10 shadow-lg relative group transition-all hover:border-gold-primary/40 shrink-0">
                <Users size={16} className="md:hidden" />
                <Users size={20} className="hidden md:block lg:hidden" />
                <Users size={24} className="hidden lg:block" />
                <div className="absolute -top-1 -right-1 w-2 h-2 lg:w-2.5 lg:h-2.5 bg-gold-primary rounded-full border-2 border-bg-deep shadow-[0_0_8px_rgba(212,175,55,1)]" />
              </div>
              <button onClick={logout} className="md:hidden p-1.5 text-red-500/60 hover:text-red-400 transition-colors">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'master' && <MasterAdmin />}
          {activeTab === 'sales' && <SalesModule features={features} />}
          {activeTab === 'pharmacy' && <PharmacyModule features={features} />}
          {activeTab === 'hr' && <HRModule features={features} />}
          {activeTab === 'accounting' && <Accounting user={user as any} />}
          {activeTab === 'investments' && <InvestmentsModule />}
          {activeTab === 'saft' && <SaftModule />}
          {activeTab === 'agt' && <AgtModule />}
          {activeTab === 'marketing' && <Marketing />}
          {activeTab === 'blog' && <BlogPage user={user as any} />}
          {activeTab === 'subscription' && <SubscriptionManagement />}
          {activeTab === 'mobile' && <MobileAppInfo />}
          {activeTab === 'labels' && <LabelsModule />}
          {activeTab === 'files' && <FilesModule />}
          {activeTab === 'users' && (
            <UsersList 
              authorizedModules={features} 
              readOnly={user?.role !== 'master' && user?.role !== 'admin'} 
            />
          )}
          {activeTab === 'suppliers' && <Suppliers />}
          {activeTab === 'settings' && <Settings />}
          {activeTab === 'support' && <Support />}
          {activeTab === 'employee_sales' && <EmployeeSales />}
        </div>
      </main>

      {/* Bottom Navigation - Mobile Only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-panel border-t border-white/10 px-2 py-2 flex justify-around items-center z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        {filteredMenu.slice(0, 4).map(item => (
          <button
            key={item.id}
            onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
            className={`flex flex-col items-center gap-1 p-2 transition-all relative ${
              activeTab === item.id ? 'text-gold-primary scale-110' : 'text-white/30'
            }`}
          >
            {activeTab === item.id && (
              <div className="absolute -top-0.5 w-1 h-1 bg-gold-primary rounded-full shadow-[0_0_8px_rgba(212,175,55,1)]" />
            )}
            <item.icon size={19} />
            <span className="text-[7px] font-black uppercase tracking-wider">{item.label.split(' ')[0]}</span>
          </button>
        ))}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={`flex flex-col items-center gap-1 p-2 transition-all ${
            mobileMenuOpen ? 'text-gold-primary scale-110' : 'text-white/30'
          }`}
        >
          {mobileMenuOpen ? <X size={19} /> : <Menu size={19} />}
          <span className="text-[7px] font-black uppercase tracking-wider">Mais</span>
        </button>
        <button
          onClick={() => setView('public')}
          className="flex flex-col items-center gap-1 p-2 text-white/30"
        >
          <Store size={19} />
          <span className="text-[7px] font-black uppercase tracking-wider">Portal</span>
        </button>
      </nav>
    </div>
  );
}
