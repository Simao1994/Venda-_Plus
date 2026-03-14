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
    ArrowRight
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
            const token = sessionStorage.getItem('erp_token');
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
            const token = sessionStorage.getItem('erp_token');
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
            const token = sessionStorage.getItem('erp_token');
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
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="p-4 lg:p-8">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Master Admin Control</h1>
                        <p className="text-slate-500 font-medium">Gestão global da plataforma Venda Plus SaaS</p>
                    </div>
                    <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-100">
                        <button
                            onClick={() => setActivePortalTab('licenses')}
                            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activePortalTab === 'licenses' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Gestão de Licenças
                        </button>
                        <button
                            onClick={() => setActivePortalTab('plans')}
                            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activePortalTab === 'plans' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Planos SaaS
                        </button>
                        <button
                            onClick={() => {
                                setActivePortalTab('config');
                                fetchData();
                            }}
                            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activePortalTab === 'config' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Conteúdo Site
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-500" />
                    <div className="relative">
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-4">
                            <Building2 size={24} />
                        </div>
                        <p className="text-slate-500 font-bold text-sm uppercase tracking-wider">Total de Empresas</p>
                        <h3 className="text-4xl font-black text-slate-900 mt-1">{stats?.totalCompanies}</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50/50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-500" />
                    <div className="relative">
                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-4">
                            <CheckCircle2 size={24} />
                        </div>
                        <p className="text-slate-500 font-bold text-sm uppercase tracking-wider">Empresas Ativas</p>
                        <h3 className="text-4xl font-black text-slate-900 mt-1">{Array.isArray(companies) ? companies.filter(c => c.status === 'active').length : 0}</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50/50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-500" />
                    <div className="relative">
                        <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mb-4">
                            <AlertCircle size={24} />
                        </div>
                        <p className="text-slate-500 font-bold text-sm uppercase tracking-wider">Pagamentos Pendentes</p>
                        <h3 className="text-4xl font-black text-slate-900 mt-1">{stats?.pendingPayments}</h3>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto">
                {activePortalTab === 'licenses' ? (
                    <div className="grid grid-cols-1 gap-8">
                        {/* Licenses Table */}
                        <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
                            <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <h2 className="text-xl font-black text-slate-900">Licenças & Subscrições</h2>
                                <div className="flex flex-wrap items-center gap-4">
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Pesquisar..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-12 pr-6 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 w-full md:w-64 font-medium"
                                        />
                                    </div>
                                    <button
                                        onClick={() => setShowCompanyModal(true)}
                                        className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-indigo-700 shadow-lg shadow-indigo-100 flex items-center gap-2"
                                    >
                                        Nova Licença
                                    </button>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-slate-50/50">
                                            <th className="text-left py-4 px-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                                            <th className="text-left py-4 px-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">Empresa</th>
                                            <th className="text-left py-4 px-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">Plano / Valor</th>
                                            <th className="text-left py-4 px-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">Validade</th>
                                            <th className="text-left py-4 px-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                                            <th className="text-right py-4 px-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {filteredCompanies.map(company => {
                                            const sub = company.saas_subscriptions?.[0];
                                            return (
                                                <tr key={company.id} className="hover:bg-slate-50/30 transition-colors group">
                                                    <td className="py-5 px-8 text-xs font-bold text-slate-400">
                                                        {new Date(company.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="py-5 px-8">
                                                        <div>
                                                            <p className="font-black text-slate-900 leading-tight">{company.name}</p>
                                                            <p className="text-xs text-slate-400 font-medium">{company.email}</p>
                                                        </div>
                                                    </td>
                                                    <td className="py-5 px-8">
                                                        <div>
                                                            <p className="text-sm font-black text-slate-700">{sub?.saas_plans?.name || '---'}</p>
                                                            <p className="text-[10px] font-bold text-indigo-500 uppercase">{(sub?.valor_pago || 0).toLocaleString()} Kz</p>
                                                        </div>
                                                    </td>
                                                    <td className="py-5 px-8 text-xs font-bold text-slate-600">
                                                        {sub?.data_expiracao ? new Date(sub.data_expiracao).toLocaleDateString() : '---'}
                                                    </td>
                                                    <td className="py-5 px-8">
                                                        <span className={`px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-wider ${company.status === 'active' ? 'bg-emerald-50 text-emerald-600' :
                                                            company.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                                                            }`}>
                                                            {company.status === 'active' ? 'Ativo' : company.status === 'pending' ? 'Pendente' : 'Suspenso'}
                                                        </span>
                                                    </td>
                                                    <td className="py-5 px-8 text-right">
                                                        <div className="flex justify-end gap-2">
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
                                                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                                                                title="Gerir Subscrição"
                                                            >
                                                                <CreditCard size={18} />
                                                            </button>
                                                            {company.status === 'pending' && (
                                                                <button
                                                                    onClick={() => approveCompany(company.id)}
                                                                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
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
                                                                className="p-2 text-slate-300 hover:text-indigo-600 transition-colors"
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
                    <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                            <h2 className="text-xl font-black text-slate-900">Planos de Subscrição SaaS</h2>
                            <button
                                onClick={() => {
                                    setPlanFormData({ name: '', price_monthly: 0, price_semestrial: 0, price_yearly: 0, features: [], public_features: [], is_featured: false });
                                    setShowPlanModal(true);
                                }}
                                className="bg-indigo-600 text-white px-6 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                            >
                                Novo Plano
                            </button>
                        </div>
                        <div className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {plans.map(plan => (
                                    <div key={plan.id} className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 group hover:border-indigo-200 transition-all">
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="text-xl font-black text-slate-900">{plan.name}</h3>
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
                                                    className="p-2 bg-white text-indigo-600 rounded-lg shadow-sm border border-slate-100"
                                                >
                                                    <Search size={14} />
                                                </button>
                                                <button
                                                    onClick={() => deletePlan(plan.id)}
                                                    className="p-2 bg-white text-red-500 rounded-lg shadow-sm border border-slate-100"
                                                >
                                                    <XCircle size={14} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-2 mb-6">
                                            <p className="text-sm font-bold text-slate-600">Mensal: <span className="text-indigo-600">{plan.price_monthly.toLocaleString()} Kz</span></p>
                                            <p className="text-sm font-bold text-slate-600">Duração: <span className="text-indigo-600">{plan.duration_months} Meses</span></p>
                                            <p className="text-sm font-bold text-slate-600">Limite: <span className="text-indigo-600">{plan.user_limit} Utilizadores</span></p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {Array.isArray(plan.features) && plan.features.map((f: string, idx: number) => (
                                                <span key={idx} className="px-3 py-1 bg-white text-[10px] font-black uppercase text-slate-400 rounded-lg">{f}</span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activePortalTab === 'config' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm">
                            <h2 className="text-xl font-black text-slate-900 mb-8">Administrar Conteúdo Web</h2>
                            <div className="space-y-12">
                                {configs.map((cfg) => (
                                    <div key={cfg.key} className="p-8 bg-slate-50 rounded-[32px] border-2 border-transparent hover:border-indigo-100 transition-all">
                                        <div className="flex justify-between items-start mb-6">
                                            <div>
                                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none mb-2">{cfg.key}</h3>
                                                <p className="text-xs font-bold text-slate-400 italic">{cfg.description}</p>
                                            </div>
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        const token = localStorage.getItem('erp_token');
                                                        const res = await fetch(`/api/saas/master/config/${cfg.key}`, {
                                                            method: 'PUT',
                                                            headers: {
                                                                'Content-Type': 'application/json',
                                                                'Authorization': `Bearer ${token}`
                                                            },
                                                            body: JSON.stringify({ value: cfg.value })
                                                        });
                                                        if (res.ok) alert('Guardado com sucesso!');
                                                    } catch (e) {
                                                        alert('Erro ao guardar.');
                                                    }
                                                }}
                                                className="bg-indigo-600 text-white px-6 py-2 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all text-[10px] font-black uppercase tracking-widest"
                                            >
                                                Guardar Alterações
                                            </button>
                                        </div>
                                        <textarea
                                            className="w-full bg-white border-2 border-slate-100 rounded-2xl p-6 font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                            rows={10}
                                            value={JSON.stringify(cfg.value, null, 2)}
                                            onChange={(e) => {
                                                try {
                                                    const newValue = JSON.parse(e.target.value);
                                                    setConfigs(configs.map(c => c.key === cfg.key ? { ...c, value: newValue } : c));
                                                } catch (err) {
                                                    // Allow editing invalid JSON
                                                }
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
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-[40px] w-full max-w-xl overflow-hidden shadow-2xl">
                        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-xl font-black text-slate-900">{editingPlan ? 'Editar Plano' : 'Novo Plano'}</h3>
                            <button onClick={() => setShowPlanModal(false)} className="text-slate-400 hover:text-slate-600">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <form onSubmit={handlePlanSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Nome do Plano</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-6 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold"
                                        value={planFormData.name}
                                        onChange={e => setPlanFormData({ ...planFormData, name: e.target.value })}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Descrição do Plano</label>
                                    <textarea
                                        className="w-full px-6 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold"
                                        rows={3}
                                        value={planFormData.description}
                                        onChange={e => setPlanFormData({ ...planFormData, description: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Preço Mensal (Kz)</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full px-6 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold"
                                        value={planFormData.price_monthly}
                                        onChange={e => setPlanFormData({ ...planFormData, price_monthly: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Preço Semestral (Kz)</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full px-6 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold"
                                        value={planFormData.price_semestrial}
                                        onChange={e => setPlanFormData({ ...planFormData, price_semestrial: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Preço Anual (Kz)</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full px-6 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold"
                                        value={planFormData.price_yearly}
                                        onChange={e => setPlanFormData({ ...planFormData, price_yearly: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Duração (Meses)</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full px-6 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold"
                                        value={planFormData.duration_months}
                                        onChange={e => setPlanFormData({ ...planFormData, duration_months: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Limite Utilizadores</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full px-6 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold"
                                        value={planFormData.user_limit}
                                        onChange={e => setPlanFormData({ ...planFormData, user_limit: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Plano em Destaque</label>
                                    <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border-2 border-transparent hover:border-indigo-100 transition-all">
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 rounded-lg text-indigo-600 focus:ring-indigo-500 border-slate-300"
                                            checked={planFormData.is_featured}
                                            onChange={(e) => setPlanFormData({ ...planFormData, is_featured: e.target.checked })}
                                        />
                                        <span className="text-xs font-black uppercase tracking-widest text-slate-600">Destacar na Home</span>
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Características Públicas (uma por linha)</label>
                                    <textarea
                                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold"
                                        rows={4}
                                        value={planFormData.public_features.join('\n')}
                                        onChange={e => setPlanFormData({ ...planFormData, public_features: e.target.value.split('\n') })}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Módulos Activos</label>
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                        {['vendas', 'estoque', 'financeiro', 'hr', 'marketing', 'pharmacy'].map((m) => (
                                            <div key={m} className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border-2 border-transparent hover:border-indigo-100 transition-all">
                                                <input
                                                    type="checkbox"
                                                    className="w-5 h-5 rounded-lg text-indigo-600 focus:ring-indigo-500 border-slate-300"
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
                                                <span className="text-xs font-black uppercase tracking-widest text-slate-600">{m}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowPlanModal(false)}
                                    className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-4 bg-indigo-600 text-white rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all"
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
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-[40px] w-full max-w-xl overflow-hidden shadow-2xl">
                        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-xl font-black text-slate-900">Nova Empresa</h3>
                            <button onClick={() => setShowCompanyModal(false)} className="text-slate-400 hover:text-slate-600">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleCompanySubmit} className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Nome da Empresa</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold"
                                        value={companyFormData.name}
                                        onChange={e => setCompanyFormData({ ...companyFormData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Email Administrativo</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold"
                                        value={companyFormData.email}
                                        onChange={e => setCompanyFormData({ ...companyFormData, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Palavra-passe Inicial</label>
                                    <input
                                        type="password"
                                        required
                                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold"
                                        value={companyFormData.password}
                                        onChange={e => setCompanyFormData({ ...companyFormData, password: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCompanyModal(false)}
                                    className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-4 bg-indigo-600 text-white rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all"
                                >
                                    Criar Empresa
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Subscription Management Modal */}
            {showSubscriptionModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-[40px] w-full max-w-xl overflow-hidden shadow-2xl">
                        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-xl font-black text-slate-900">Gerir Subscrição</h3>
                                <p className="text-xs text-slate-400 font-bold uppercase">{selectedCompany?.name}</p>
                            </div>
                            <button onClick={() => setShowSubscriptionModal(false)} className="text-slate-400 hover:text-slate-600">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <form onSubmit={updateSubscription} className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Plano de Acesso</label>
                                    <select
                                        className="w-full px-6 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold"
                                        value={subscriptionFormData.plan_id}
                                        onChange={e => setSubscriptionFormData({ ...subscriptionFormData, plan_id: Number(e.target.value) })}
                                    >
                                        {plans.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Tipo de Plano</label>
                                    <select
                                        className="w-full px-6 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold"
                                        value={subscriptionFormData.tipo_plano}
                                        onChange={e => setSubscriptionFormData({ ...subscriptionFormData, tipo_plano: e.target.value })}
                                    >
                                        <option value="mensal">Mensal</option>
                                        <option value="semestrial">Semestral</option>
                                        <option value="anual">Anual</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Data de Expiração</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full px-6 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-sm"
                                        value={subscriptionFormData.data_expiracao}
                                        onChange={e => setSubscriptionFormData({ ...subscriptionFormData, data_expiracao: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Valor Pago (Kz)</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full px-6 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold"
                                        value={subscriptionFormData.valor_pago}
                                        onChange={e => setSubscriptionFormData({ ...subscriptionFormData, valor_pago: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-50">
                                <p className="w-full text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Ações de Estado</p>
                                <button
                                    type="button"
                                    onClick={() => updateCompanyStatus('active')}
                                    className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${selectedCompany?.status === 'active' ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : 'bg-slate-50 border-transparent text-slate-400 hover:border-emerald-200'}`}
                                >
                                    Ativar Empresa
                                </button>
                                <button
                                    type="button"
                                    onClick={() => updateCompanyStatus('suspended')}
                                    className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${selectedCompany?.status === 'suspended' ? 'bg-amber-50 border-amber-500 text-amber-600' : 'bg-slate-50 border-transparent text-slate-400 hover:border-amber-200'}`}
                                >
                                    Suspender
                                </button>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowSubscriptionModal(false)}
                                    className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all"
                                >
                                    Fechar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 py-4 bg-indigo-600 text-white rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all disabled:opacity-50"
                                >
                                    {isSaving ? 'A guardar...' : 'Guardar Alterações'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>

    );
}
