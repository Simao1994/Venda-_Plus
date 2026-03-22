import React, { useState, useEffect } from 'react';
import {
    Users,
    Building2,
    CreditCard,
    BarChart3,
    CheckCircle2,
    XCircle,
    AlertCircle,
    TrendingUp,
    Search,
    ArrowRight,
    Link,
    Database,
    Shield
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';

interface MasterStats {
    totalCompanies: number;
    mrr: number;
    pendingPayments: number;
}

interface Company {
    id: number;
    name: string;
    email: string;
    status: string;
    created_at: string;
    access_token?: string;
    saas_subscriptions: any[];
}

export default function MasterAdmin() {
    const [activePortalTab, setActivePortalTab] = useState<'licenses' | 'plans' | 'config'>('licenses');
    const [configs, setConfigs] = useState<any[]>([]);
    const [stats, setStats] = useState<MasterStats | null>(null);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showPlanModal, setShowPlanModal] = useState(false);
    const [showCompanyModal, setShowCompanyModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState<any>(null);
    const [planFormData, setPlanFormData] = useState({
        name: '',
        price_monthly: 0,
        price_semestrial: 0,
        price_yearly: 0,
        features: [] as string[],
        public_features: [] as string[],
        is_featured: false,
        duration_months: 1,
        user_limit: 5,
        description: ''
    });
    const [companyFormData, setCompanyFormData] = useState({
        name: '',
        email: '',
        password: '',
        status: 'active'
    });

    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState<any>(null);
    const [subscriptionFormData, setSubscriptionFormData] = useState({
        plan_id: 1,
        data_expiracao: '',
        status: 'active',
        valor_pago: 0,
        tipo_plano: 'mensal'
    });

    const [isSaving, setIsSaving] = useState(false);


    useEffect(() => {
        fetchData();
    }, [activePortalTab]);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('erp_token');
            const [statsRes, companiesRes, plansRes] = await Promise.all([
                fetch('/api/saas/master/stats', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('/api/saas/master/companies', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('/api/saas/plans', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            const statsData = await statsRes.json();
            const companiesData = await companiesRes.json();
            const plansData = await plansRes.json();

            setStats(statsData);
            setCompanies(companiesData);
            setPlans(plansData);

            // Fetch configs if in config tab
            if (activePortalTab === 'config') {
                const configRes = await fetch('/api/saas/master/config', { headers: { 'Authorization': `Bearer ${token}` } });
                setConfigs(await configRes.json());
            }
        } catch (error) {
            console.error('Error fetching master data:', error);
        } finally {
            setLoading(false);
        }
    };

    const approveCompany = async (id: number) => {
        try {
            const token = localStorage.getItem('erp_token');
            await fetch('/api/saas/master/approve-subscription', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ company_id: id })
            });
            fetchData();
        } catch (error) {
            console.error('Error approving company:', error);
        }
    };

    const updateSubscription = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCompany) return;
        setIsSaving(true);
        try {
            const token = localStorage.getItem('erp_token');
            const res = await fetch(`/api/saas/master/companies/${selectedCompany.id}/subscription`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(subscriptionFormData)
            });

            if (res.ok) {
                setShowSubscriptionModal(false);
                fetchData();
            } else {
                alert('Erro ao atualizar subscrição');
            }
        } catch (error) {
            console.error('Error updating subscription:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const updateCompanyStatus = async (status: string) => {
        if (!selectedCompany) return;
        if (!confirm(`Tem certeza que deseja alterar o estado para ${status}?`)) return;

        try {
            const token = localStorage.getItem('erp_token');
            const res = await fetch(`/api/saas/master/companies/${selectedCompany.id}/status`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });

            if (res.ok) {
                setShowSubscriptionModal(false);
                fetchData();
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };


    const handlePlanSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('erp_token');
            const url = editingPlan ? `/api/saas/master/plans/${editingPlan.id}` : '/api/saas/master/plans';
            const method = editingPlan ? 'PUT' : 'POST';

            await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(planFormData)
            });

            setShowPlanModal(false);
            setEditingPlan(null);
            setPlanFormData({ name: '', price_monthly: 0, price_semestrial: 0, price_yearly: 0, features: [], public_features: [], is_featured: false, duration_months: 1, user_limit: 5 });
            fetchData();
        } catch (error) {
            console.error('Error saving plan:', error);
        }
    };

    const handleCompanySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('erp_token');
            const res = await fetch('/api/saas/register', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...companyFormData,
                    plan_id: plans[0]?.id || 1, // Default to first plan
                    tipo_plano: 'mensal',
                    status: 'active' // Direct activation by Master Admin
                })
            });

            if (res.ok) {
                alert('Empresa criada e ativada com sucesso!');
                setShowCompanyModal(false);
                setCompanyFormData({ name: '', email: '', password: '', status: 'active' });
                fetchData();
            } else {
                const err = await res.json();
                alert('Erro ao criar empresa: ' + err.error);
            }

        } catch (error) {
            console.error('Error creating company:', error);
        }
    };

    const deletePlan = async (id: number) => {
        if (!confirm('Tem certeza que deseja eliminar este plano?')) return;
        try {
            const token = localStorage.getItem('erp_token');
            await fetch(`/api/saas/master/plans/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchData();
        } catch (error) {
            console.error('Error deleting plan:', error);
        }
    };

    const filteredCompanies = Array.isArray(companies) ? companies.filter(c =>
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase())
    ) : [];

    if (loading) return (
        <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-gold-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="p-4 lg:p-8 min-h-screen bg-[#0B0B0B] text-white">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-[1px] bg-gold-primary/30" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gold-primary/60">SaaS Infrastructure</span>
                        </div>
                        <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-none">
                            Omni <span className="text-gold-gradient">Control</span>
                        </h1>
                        <p className="text-white/20 font-bold uppercase tracking-widest text-[11px] flex items-center gap-2">
                            Global Hyper-Scale Management Interface
                        </p>
                    </div>
                    <div className="flex bg-white/5 p-1.5 rounded-[28px] backdrop-blur-3xl border border-white/5 shadow-2xl">
                        {[
                            { id: 'licenses', label: 'Monitoramento Licenças', icon: <Building2 size={16} /> },
                            { id: 'plans', label: 'Matriz de Planos', icon: <TrendingUp size={16} /> },
                            { id: 'config', label: 'Engine Config', icon: <Database size={16} /> },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActivePortalTab(tab.id as any);
                                    if (tab.id === 'config') fetchData();
                                }}
                                className={`flex items-center gap-3 px-8 py-4 rounded-[20px] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${activePortalTab === tab.id
                                    ? 'bg-gold-gradient text-bg-deep shadow-[0_10px_30px_rgba(212,175,55,0.3)] scale-105'
                                    : 'text-white/30 hover:text-white hover:bg-white/5'}`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="glass-panel p-6 rounded-[32px] gold-glow-hover group">
                    <div className="relative">
                        <div className="w-12 h-12 bg-gold-primary/10 rounded-2xl flex items-center justify-center text-gold-primary mb-4">
                            <Building2 size={24} />
                        </div>
                        <p className="text-white/40 font-black text-[10px] uppercase tracking-[0.2em]">Total de Empresas</p>
                        <h3 className="text-4xl font-black text-white mt-1">{stats?.totalCompanies}</h3>
                    </div>
                </div>

                <div className="glass-panel p-6 rounded-[32px] gold-glow-hover group">
                    <div className="relative">
                        <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 mb-4">
                            <CheckCircle2 size={24} />
                        </div>
                        <p className="text-white/40 font-black text-[10px] uppercase tracking-[0.2em]">Empresas Ativas</p>
                        <h3 className="text-4xl font-black text-white mt-1">{Array.isArray(companies) ? companies.filter(c => c.status === 'active').length : 0}</h3>
                    </div>
                </div>

                <div className="glass-panel p-6 rounded-[32px] gold-glow-hover group">
                    <div className="relative">
                        <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 mb-4">
                            <AlertCircle size={24} />
                        </div>
                        <p className="text-white/40 font-black text-[10px] uppercase tracking-[0.2em]">Pagamentos Pendentes</p>
                        <h3 className="text-4xl font-black text-white mt-1">{stats?.pendingPayments}</h3>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto">
                {activePortalTab === 'licenses' ? (
                    <div className="grid grid-cols-1 gap-8">
                        {/* Licenses Table */}
                        <div className="glass-panel rounded-[40px] overflow-hidden">
                            <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <h2 className="text-xl font-black text-gold-primary uppercase tracking-tight">Licenças & Subscrições</h2>
                                <div className="flex flex-wrap items-center gap-4">
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Pesquisar..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-12 pr-6 py-3 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-gold-primary w-full md:w-64 font-bold text-white placeholder:text-white/20"
                                        />
                                    </div>
                                    <button
                                        onClick={() => setShowCompanyModal(true)}
                                        className="bg-gold-primary text-black px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-gold-secondary shadow-lg shadow-gold-primary/20 flex items-center gap-2 transition-all active:scale-95"
                                    >
                                        Nova Licença
                                    </button>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full dark-table">
                                    <thead>
                                        <tr className="border-b border-white/5">
                                            <th className="text-left py-6 px-8 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Data de Ingresso</th>
                                            <th className="text-left py-6 px-8 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Entidade Corporativa</th>
                                            <th className="text-left py-6 px-8 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Tier / Revenue</th>
                                            <th className="text-left py-6 px-8 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Expiração</th>
                                            <th className="text-left py-6 px-8 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Acesso Directo</th>
                                            <th className="text-left py-6 px-8 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Status</th>
                                            <th className="text-right py-6 px-8 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Config</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredCompanies.map(company => {
                                            const sub = company.saas_subscriptions?.[0];
                                            return (
                                                <tr key={company.id} className="hover:bg-white/[0.03] transition-colors group">
                                                    <td className="py-6 px-8 text-[11px] font-black text-white/40 italic">
                                                        {new Date(company.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="py-6 px-8">
                                                        <div>
                                                            <p className="font-black text-white text-[13px] tracking-tight group-hover:text-gold-primary transition-colors uppercase">{company.name}</p>
                                                            <p className="text-[10px] text-white/20 font-black lowercase tracking-tighter">{company.email}</p>
                                                        </div>
                                                    </td>
                                                    <td className="py-6 px-8">
                                                        <div>
                                                            <p className="text-[11px] font-black text-white/80 uppercase tracking-widest leading-none">{sub?.saas_plans?.name || 'Standard'}</p>
                                                            <p className="text-[10px] font-black text-gold-primary uppercase tracking-[0.1em] mt-1 italic">{(sub?.valor_pago || 0).toLocaleString()} Kz</p>
                                                        </div>
                                                    </td>
                                                    <td className="py-6 px-8 text-[11px] font-black text-white/60">
                                                        {sub?.data_expiracao ? new Date(sub.data_expiracao).toLocaleDateString() : '---'}
                                                    </td>
                                                    <td className="py-6 px-8">
                                                        {company.access_token ? (
                                                            <button
                                                                onClick={() => {
                                                                    const link = `${window.location.origin}/?token=${company.access_token}`;
                                                                    navigator.clipboard.writeText(link);
                                                                    alert('Link de acesso copiado!');
                                                                }}
                                                                className="flex items-center gap-3 px-4 py-2 bg-white/5 text-gold-primary rounded-xl hover:bg-gold-primary hover:text-bg-deep transition-all border border-white/10 group/btn"
                                                                title="Copiar Link de Acesso"
                                                            >
                                                                <Link size={14} className="group-hover/btn:scale-110 transition-transform" />
                                                                <span className="text-[9px] font-black uppercase tracking-[0.15em]">Token Tunnel</span>
                                                            </button>
                                                        ) : (
                                                            <span className="text-[9px] font-black text-white/10 uppercase tracking-widest italic opacity-50">Locked</span>
                                                        )}
                                                    </td>
                                                    <td className="py-6 px-8">
                                                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border ${company.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                            company.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                                                            }`}>
                                                            {company.status === 'active' ? '● Ativo' : company.status === 'pending' ? '○ Pendente' : '■ Suspenso'}
                                                        </span>
                                                    </td>
                                                    <td className="py-6 px-8 text-right">
                                                        <div className="flex justify-end gap-3">
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedCompany(company);
                                                                    const sub = company.saas_subscriptions?.[0];
                                                                    setSubscriptionFormData({
                                                                        plan_id: sub?.plan_id || plans[0]?.id || 1,
                                                                        data_expiracao: sub?.data_expiracao?.split('T')[0] || '',
                                                                        status: sub?.status || 'active',
                                                                        valor_pago: sub?.valor_pago || 0,
                                                                        tipo_plano: sub?.tipo_plano || 'mensal'
                                                                    });
                                                                    setShowSubscriptionModal(true);
                                                                }}
                                                                className="p-3 text-gold-primary hover:bg-gold-primary/10 rounded-2xl transition-all border border-transparent hover:border-gold-primary/30"
                                                                title="Gerir Subscrição"
                                                            >
                                                                <CreditCard size={18} />
                                                            </button>
                                                            {company.status === 'pending' && (
                                                                <button
                                                                    onClick={() => approveCompany(company.id)}
                                                                    className="px-5 py-2.5 bg-gold-primary text-bg-deep rounded-2xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-gold-primary/10"
                                                                >
                                                                    Aprovar
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => {
                                                                    const savedUser = JSON.parse(sessionStorage.getItem('erp_user') || '{}');
                                                                    const impersonatedUser = {
                                                                        ...savedUser,
                                                                        company_id: company.id,
                                                                        company_name: company.name,
                                                                        role: 'admin'
                                                                    };
                                                                    sessionStorage.setItem('erp_user', JSON.stringify(impersonatedUser));
                                                                    window.location.reload();
                                                                }}
                                                                className="p-3 text-white/20 hover:text-gold-primary transition-all rounded-2xl hover:bg-white/5"
                                                            >
                                                                <ArrowRight size={18} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="glass-panel border-white/5 rounded-[40px] overflow-hidden shadow-2xl">
                        <div className="p-10 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                            <div>
                                <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Matriz de <span className="text-gold-gradient">SaaS Plans</span></h2>
                                <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.3em] mt-2 italic">Configuração de tiers e limites operacionais</p>
                            </div>
                            <button
                                onClick={() => {
                                    setPlanFormData({ name: '', price_monthly: 0, price_semestrial: 0, price_yearly: 0, features: [], public_features: [], is_featured: false, duration_months: 1, user_limit: 5, description: '' });
                                    setShowPlanModal(true);
                                }}
                                className="bg-gold-gradient text-bg-deep px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:scale-105 shadow-[0_10px_30px_rgba(212,175,55,0.2)] transition-all active:scale-95"
                            >
                                Injetar Novo Tier
                            </button>
                        </div>
                        <div className="p-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {plans.map(plan => (
                                    <div key={plan.id} className="p-8 bg-white/[0.03] rounded-[32px] border border-white/5 group hover:border-gold-primary/40 transition-all duration-500 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-gold-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-gold-primary/10 transition-all" />

                                        <div className="relative z-10">
                                            <div className="flex justify-between items-start mb-8">
                                                <div>
                                                    <h3 className="text-xl font-black text-white uppercase italic tracking-tight leading-none">{plan.name}</h3>
                                                    {plan.is_featured && (
                                                        <span className="text-[8px] font-black text-gold-primary uppercase tracking-[0.3em] mt-2 inline-block px-2 py-0.5 bg-gold-primary/10 border border-gold-primary/20 rounded-full italic">Recomendado</span>
                                                    )}
                                                </div>
                                                <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
                                                    <button
                                                        onClick={() => {
                                                            const p = { ...plan };
                                                            if (typeof p.features === 'string') {
                                                                try { p.features = JSON.parse(p.features); } catch (e) { p.features = []; }
                                                            }
                                                            setEditingPlan(p);
                                                            setPlanFormData({
                                                                ...p,
                                                                public_features: Array.isArray(p.public_features) ? p.public_features : [],
                                                                description: p.description || ''
                                                            });
                                                            setShowPlanModal(true);
                                                        }}
                                                        className="p-3 bg-white/5 text-gold-primary rounded-2xl border border-white/5 hover:bg-gold-primary hover:text-bg-deep transition-all"
                                                    >
                                                        <Search size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => deletePlan(plan.id)}
                                                        className="p-3 bg-white/5 text-red-500/50 rounded-2xl border border-white/5 hover:bg-red-500 hover:text-white transition-all hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                                                    >
                                                        <XCircle size={16} />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="space-y-4 mb-8">
                                                <div className="flex items-center justify-between py-3 border-b border-white/5">
                                                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Custo Mensal</p>
                                                    <p className="text-sm font-black text-gold-primary italic">{(plan.price_monthly || 0).toLocaleString()} <span className="text-[8px]">Kz</span></p>
                                                </div>
                                                <div className="flex items-center justify-between py-3 border-b border-white/5">
                                                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Ciclo Operacional</p>
                                                    <p className="text-xs font-black text-white/80">{plan.duration_months} Meses</p>
                                                </div>
                                                <div className="flex items-center justify-between py-3 border-b border-white/5">
                                                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Cotas de Acesso</p>
                                                    <p className="text-xs font-black text-white/80">{plan.user_limit} Users</p>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-2 pt-2">
                                                {Array.isArray(plan.features) && plan.features.map((f: string, idx: number) => (
                                                    <span key={idx} className="px-3 py-1.5 bg-white/5 text-[8px] font-black uppercase text-gold-primary/50 border border-white/5 rounded-xl hover:bg-gold-primary/10 transition-all cursor-default">{f}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activePortalTab === 'config' && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                        <div className="glass-panel rounded-[40px] p-12 border-white/5 relative overflow-hidden shadow-3xl">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gold-gradient opacity-20" />
                            <div className="flex items-center gap-5 mb-12">
                                <div className="p-4 bg-gold-primary/10 rounded-3xl border border-gold-primary/20">
                                    <Shield size={32} className="text-gold-primary" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white offshore-text-shadow italic uppercase tracking-tighter">Global <span className="text-gold-gradient">Environment Registry</span></h2>
                                    <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.4em] mt-1">Manipulação direta dos parâmetros de baixa latência</p>
                                </div>
                            </div>

                            <div className="space-y-12">
                                {configs.map((cfg) => (
                                    <div key={cfg.key} className="p-10 bg-white/[0.02] rounded-[32px] border border-white/5 hover:border-gold-primary/20 transition-all duration-700 group hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                                            <div className="space-y-2">
                                                <span className="px-4 py-1.5 bg-gold-primary/10 text-gold-primary text-[9px] font-black uppercase tracking-[0.3em] rounded-full border border-gold-primary/20 shadow-inner">Config Key</span>
                                                <h3 className="text-lg font-black text-white uppercase tracking-widest leading-none pl-1 italic">{cfg.key}</h3>
                                                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] italic pl-1">{cfg.description || "Infrastructural constant for environment orchestration"}</p>
                                            </div>
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        const token = sessionStorage.getItem('erp_token');
                                                        const res = await fetch(`/api/saas/master/config/${cfg.key}`, {
                                                            method: 'PUT',
                                                            headers: {
                                                                'Content-Type': 'application/json',
                                                                'Authorization': `Bearer ${token}`
                                                            },
                                                            body: JSON.stringify({ value: cfg.value })
                                                        });
                                                        if (res.ok) alert('Deployment Success: Global instance updated.');
                                                    } catch (e) {
                                                        alert('Critical Failure: Could not synchronize registry.');
                                                    }
                                                }}
                                                className="bg-gold-gradient text-bg-deep px-10 py-5 rounded-[24px] hover:scale-105 shadow-[0_15px_30px_rgba(212,175,55,0.15)] transition-all text-[10px] font-black uppercase tracking-[0.3em] active:scale-95 border border-white/10"
                                            >
                                                Deploy Changes
                                            </button>
                                        </div>
                                        <textarea
                                            className="w-full bg-bg-deep/60 border border-white/5 rounded-[28px] p-8 font-mono text-[11px] text-gold-primary/70 focus:ring-2 focus:ring-gold-primary focus:border-transparent transition-all outline-none shadow-inner resize-none min-h-[300px]"
                                            spellCheck={false}
                                            value={JSON.stringify(cfg.value, null, 4)}
                                            onChange={(e) => {
                                                try {
                                                    const newValue = JSON.parse(e.target.value);
                                                    setConfigs(configs.map(c => c.key === cfg.key ? { ...c, value: newValue } : c));
                                                } catch (err) { }
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Plan Modal */}
            {showPlanModal && (
                <div className="fixed inset-0 bg-bg-deep/80 backdrop-blur-2xl flex items-center justify-center z-[100] p-4">
                    <div className="glass-panel border-white/20 rounded-[40px] w-full max-w-xl overflow-hidden shadow-3xl">
                        <div className="p-10 border-b border-white/5 flex justify-between items-center bg-white/5">
                            <div>
                                <h3 className="text-2xl font-black text-white italic uppercase">{editingPlan ? 'Editar' : 'Criar'} <span className="text-gold-gradient">Plano SaaS</span></h3>
                                <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em] mt-2">Configuração de tier e limites operacionais</p>
                            </div>
                            <button onClick={() => setShowPlanModal(false)} className="text-white/20 hover:text-gold-primary transition-all">
                                <XCircle size={32} />
                            </button>
                        </div>
                        <form onSubmit={handlePlanSubmit} className="p-10 space-y-8 bg-bg-deep/40">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black uppercase text-white/40 tracking-widest mb-2">Nome do Plano</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-6 py-3 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-gold-primary text-white font-bold placeholder:text-white/10"
                                        value={planFormData.name}
                                        onChange={e => setPlanFormData({ ...planFormData, name: e.target.value })}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black uppercase text-white/40 tracking-widest mb-2">Descrição do Plano</label>
                                    <textarea
                                        className="w-full px-6 py-3 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-gold-primary text-white font-bold"
                                        rows={3}
                                        value={planFormData.description}
                                        onChange={e => setPlanFormData({ ...planFormData, description: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-white/40 tracking-widest mb-2">Preço Mensal (Kz)</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full px-6 py-3 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-gold-primary text-white font-bold"
                                        value={planFormData.price_monthly}
                                        onChange={e => setPlanFormData({ ...planFormData, price_monthly: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-white/40 tracking-widest mb-2">Preço Semestral (Kz)</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full px-6 py-3 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-gold-primary text-white font-bold"
                                        value={planFormData.price_semestrial}
                                        onChange={e => setPlanFormData({ ...planFormData, price_semestrial: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-white/40 tracking-widest mb-2">Preço Anual (Kz)</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full px-6 py-3 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-gold-primary text-white font-bold"
                                        value={planFormData.price_yearly}
                                        onChange={e => setPlanFormData({ ...planFormData, price_yearly: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-white/40 tracking-widest mb-2">Duração (Meses)</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full px-6 py-3 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-gold-primary text-white font-bold"
                                        value={planFormData.duration_months}
                                        onChange={e => setPlanFormData({ ...planFormData, duration_months: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-white/40 tracking-widest mb-2">Limite Utilizadores</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full px-6 py-3 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-gold-primary text-white font-bold"
                                        value={planFormData.user_limit}
                                        onChange={e => setPlanFormData({ ...planFormData, user_limit: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-white/40 tracking-widest mb-2">Plano em Destaque</label>
                                    <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/10 hover:border-gold-primary transition-all">
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 rounded-lg text-gold-primary focus:ring-gold-primary border-white/10 bg-black/20"
                                            checked={planFormData.is_featured}
                                            onChange={(e) => setPlanFormData({ ...planFormData, is_featured: e.target.checked })}
                                        />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Destacar na Home</span>
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black uppercase text-white/40 tracking-widest mb-2">Características Públicas (uma por linha)</label>
                                    <textarea
                                        className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-gold-primary text-white font-bold"
                                        rows={4}
                                        value={planFormData.public_features.join('\n')}
                                        onChange={e => setPlanFormData({ ...planFormData, public_features: e.target.value.split('\n') })}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black uppercase text-white/40 tracking-widest mb-4">Módulos Activos</label>
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                        {['vendas', 'estoque', 'financeiro', 'hr', 'marketing', 'pharmacy'].map((m) => (
                                            <div key={m} className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/10 hover:border-gold-primary transition-all">
                                                <input
                                                    type="checkbox"
                                                    className="w-5 h-5 rounded-lg text-gold-primary focus:ring-gold-primary border-white/10 bg-black/20"
                                                    checked={planFormData.features.includes(m)}
                                                    onChange={(e) => {
                                                        const feats = [...planFormData.features];
                                                        if (e.target.checked) feats.push(m);
                                                        else {
                                                            const idx = feats.indexOf(m);
                                                            if (idx > -1) feats.splice(idx, 1);
                                                        }
                                                        setPlanFormData({ ...planFormData, features: feats });
                                                    }}
                                                />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-white/60">{m}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowPlanModal(false)}
                                    className="flex-1 py-4 bg-white/5 text-white/30 rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-white/10 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-4 bg-gold-primary text-black rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-gold-secondary shadow-xl shadow-gold-primary/20 transition-all active:scale-95"
                                >
                                    {editingPlan ? 'Guardar Alterações' : 'Criar Plano'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Company Modal */}
            {showCompanyModal && (
                <div className="fixed inset-0 bg-bg-deep/90 backdrop-blur-2xl flex items-center justify-center z-[100] p-4">
                    <div className="glass-panel border-white/20 rounded-[40px] w-full max-w-xl overflow-hidden shadow-3xl">
                        <div className="p-10 border-b border-white/5 flex justify-between items-center bg-white/5">
                            <div>
                                <h3 className="text-2xl font-black text-white italic uppercase tracking-tight">Registar <span className="text-gold-gradient">Nova Entidade</span></h3>
                                <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em] mt-2">Provisionamento de infraestrutura corporativa</p>
                            </div>
                            <button onClick={() => setShowCompanyModal(false)} className="text-white/20 hover:text-gold-primary transition-all">
                                <XCircle size={32} />
                            </button>
                        </div>
                        <form onSubmit={handleCompanySubmit} className="p-10 space-y-8 bg-bg-deep/40">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-white/40 tracking-[0.25em] mb-3 ml-2">Legal Entity Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-8 py-5 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-gold-primary text-white font-black uppercase tracking-[0.1em] shadow-inner placeholder:text-white/10"
                                        value={companyFormData.name}
                                        onChange={e => setCompanyFormData({ ...companyFormData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-white/40 tracking-[0.25em] mb-3 ml-2">Administrative Dispatch</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full px-8 py-5 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-gold-primary text-white font-black lowercase shadow-inner placeholder:text-white/10"
                                        value={companyFormData.email}
                                        onChange={e => setCompanyFormData({ ...companyFormData, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-white/40 tracking-[0.25em] mb-3 ml-2">Security Credential</label>
                                    <input
                                        type="password"
                                        required
                                        className="w-full px-8 py-5 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-gold-primary text-white font-black shadow-inner"
                                        value={companyFormData.password}
                                        onChange={e => setCompanyFormData({ ...companyFormData, password: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-6 pt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowCompanyModal(false)}
                                    className="flex-1 py-5 bg-white/5 text-white/30 rounded-[24px] font-black uppercase text-[11px] tracking-[0.3em] hover:bg-white/10 transition-all border border-white/5"
                                >
                                    Abortar
                                </button>
                                <button
                                    submit
                                    className="flex-1 py-5 bg-gold-gradient text-bg-deep rounded-[24px] font-black uppercase text-[11px] tracking-[0.3em] hover:scale-105 shadow-2xl shadow-gold-primary/20 transition-all active:scale-95"
                                >
                                    Criar Entidade
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Subscription Management Modal */}
            {showSubscriptionModal && (
                <div className="fixed inset-0 bg-bg-deep/90 backdrop-blur-2xl flex items-center justify-center z-[100] p-4">
                    <div className="glass-panel border-white/20 rounded-[40px] w-full max-w-xl overflow-hidden shadow-3xl">
                        <div className="p-10 border-b border-white/5 flex justify-between items-center bg-white/5">
                            <div>
                                <h3 className="text-2xl font-black text-white italic uppercase tracking-tight italic">Ciclo de <span className="text-gold-gradient">Subscrição</span></h3>
                                <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.3em] mt-2 italic">{selectedCompany?.name}</p>
                            </div>
                            <button onClick={() => setShowSubscriptionModal(false)} className="text-white/20 hover:text-gold-primary transition-all">
                                <XCircle size={32} />
                            </button>
                        </div>
                        <form onSubmit={updateSubscription} className="p-10 space-y-8 bg-bg-deep/40">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-white/40 tracking-[0.25em] mb-3 ml-2">Tier Privilege</label>
                                    <select
                                        className="w-full px-8 py-5 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-gold-primary text-white font-black tracking-[0.1em] outline-none shadow-inner"
                                        value={subscriptionFormData.plan_id}
                                        onChange={e => setSubscriptionFormData({ ...subscriptionFormData, plan_id: Number(e.target.value) })}
                                    >
                                        {plans.map(p => (
                                            <option key={p.id} value={p.id} className="bg-zinc-900">{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-white/40 tracking-[0.25em] mb-3 ml-2">Billing Cycle</label>
                                    <select
                                        className="w-full px-8 py-5 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-gold-primary text-white font-black uppercase tracking-[0.1em] outline-none shadow-inner"
                                        value={subscriptionFormData.tipo_plano}
                                        onChange={e => setSubscriptionFormData({ ...subscriptionFormData, tipo_plano: e.target.value })}
                                    >
                                        <option value="mensal" className="bg-zinc-900">Mensal</option>
                                        <option value="semestrial" className="bg-zinc-900">Semestral</option>
                                        <option value="anual" className="bg-zinc-900">Anual</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-white/40 tracking-[0.25em] mb-3 ml-2">Expiration Deadline</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full px-8 py-5 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-gold-primary text-white font-black text-sm shadow-inner"
                                        value={subscriptionFormData.data_expiracao}
                                        onChange={e => setSubscriptionFormData({ ...subscriptionFormData, data_expiracao: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-white/40 tracking-[0.25em] mb-3 ml-2">Financial Commitment</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full px-8 py-5 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-gold-primary text-white font-black tracking-[0.1em] shadow-inner"
                                        value={subscriptionFormData.valor_pago}
                                        onChange={e => setSubscriptionFormData({ ...subscriptionFormData, valor_pago: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-4 pt-8 border-t border-white/5">
                                <p className="w-full text-[10px] font-black uppercase text-white/20 tracking-[0.4em] mb-2 ml-2 italic">Entity Operational Status</p>
                                <button
                                    type="button"
                                    onClick={() => updateCompanyStatus('active')}
                                    className={`px-8 py-4 rounded-[20px] text-[10px] font-black uppercase tracking-[0.3em] border transition-all ${selectedCompany?.status === 'active' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'bg-white/5 border-white/10 text-white/20 hover:border-emerald-500/50'}`}
                                >
                                    Activate Entidade
                                </button>
                                <button
                                    type="button"
                                    onClick={() => updateCompanyStatus('suspended')}
                                    className={`px-8 py-4 rounded-[20px] text-[10px] font-black uppercase tracking-[0.3em] border transition-all ${selectedCompany?.status === 'suspended' ? 'bg-gold-primary/20 border-gold-primary text-gold-primary shadow-[0_0_20px_rgba(212,175,55,0.2)]' : 'bg-white/5 border-white/10 text-white/20 hover:border-gold-primary/50'}`}
                                >
                                    Suspend Ops
                                </button>
                            </div>

                            <div className="flex gap-6 pt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowSubscriptionModal(false)}
                                    className="flex-1 py-5 bg-white/5 text-white/30 rounded-[24px] font-black uppercase text-[11px] tracking-[0.3em] hover:bg-white/10 transition-all border border-white/5"
                                >
                                    Fechar
                                </button>
                                <button
                                    submit
                                    disabled={isSaving}
                                    className="flex-1 py-5 bg-gold-gradient text-bg-deep rounded-[24px] font-black uppercase text-[11px] tracking-[0.3em] hover:scale-105 shadow-2xl shadow-gold-primary/20 transition-all disabled:opacity-50 active:scale-95"
                                >
                                    {isSaving ? 'Synchronizing...' : 'Sincronizar Cloud'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>

    );
}
