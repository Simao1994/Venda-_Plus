import React, { useState, useEffect } from 'react';
import {
    Building2,
    CreditCard,
    CheckCircle2,
    ArrowRight,
    ShieldCheck,
    Zap,
    Crown,
    Upload,
    ArrowLeft,
    X
} from 'lucide-react';
import { api } from '../lib/api';

interface Plan {
    id: number;
    name: string;
    price_monthly: number;
    price_semestrial: number;
    price_yearly: number;
    features: any;
}

export default function Registration({ onBack, onSuccess }: { onBack: () => void, onSuccess: () => void }) {
    const [step, setStep] = useState(1);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        plan_id: 0,
        tipo_plano: 'mensal'
    });
    const [loading, setLoading] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const [tenantLink, setTenantLink] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        api.get('/api/saas/plans')
            .then(res => {
                if (!res.ok) throw new Error('Falha ao carregar planos');
                return res.json();
            })
            .then(data => {
                setPlans(data);
                if (data.length > 0) setFormData(prev => ({ ...prev, plan_id: data[0].id }));
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/api/saas/register', formData);
            const data = await res.json();
            if (res.ok) {
                const link = `${window.location.origin}/?token=${data.access_token}`;
                setTenantLink(link);
                setStep(3);
            } else {
                setError(data.error || 'Erro ao processar registo. Tente novamente.');
            }
        } catch (error: any) {
            console.error('Registration error:', error);
            setError('Ocorreu um erro inesperado. Verifique sua conexão.');
        } finally {
            setLoading(false);
        }
    };

    const getPlanPrice = (plan: Plan) => {
        if (formData.tipo_plano === 'anual') return plan.price_yearly;
        if (formData.tipo_plano === 'semestrial') return plan.price_semestrial;
        return plan.price_monthly;
    };

    return (
        <div className="min-h-screen bg-bg-deep flex flex-col items-center p-6 md:p-12 relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_rgba(212,175,55,0.05)_0%,transparent_70%)] pointer-events-none" />

            <div className="max-w-5xl w-full relative z-10">
                {/* Progress Bar */}
                <div className="flex items-center justify-between mb-24 relative px-4">
                    <div className="absolute top-1/2 left-0 w-full h-[2px] bg-white/5 -translate-y-1/2 -z-10" />
                    <div className="absolute top-1/2 left-0 h-[2px] bg-gold-primary -translate-y-1/2 -z-10 transition-all duration-1000 ease-out" style={{ width: `${(step / 3) * 100}%` }} />

                    {[1, 2, 3].map((num) => (
                        <div key={num} className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black transition-all duration-500 border-2 ${step >= num ? 'bg-gold-primary border-gold-primary text-bg-deep shadow-[0_0_20px_rgba(212,175,55,0.4)] scale-110' : 'bg-bg-deep border-white/10 text-white/20'}`}>
                            {num === 3 && step === 3 ? <CheckCircle2 size={24} /> : num}
                        </div>
                    ))}
                </div>

                {step === 1 && (
                    <div className="animate-in fade-in slide-in-from-bottom duration-700 max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-3 px-5 py-2 bg-gold-primary/10 border border-gold-primary/20 rounded-full text-gold-primary text-[10px] font-black uppercase tracking-[0.3em] mb-10 italic">
                            <Zap size={14} />
                            INICIAR JORNADA EMPRESARIAL
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight uppercase italic leading-tight">
                            Crie a conta da <span className="text-gold-gradient">sua empresa</span>
                        </h1>
                        <p className="text-white/40 font-black text-xs uppercase tracking-[0.2em] mb-12 italic leading-relaxed">Prepare o seu negócio para a alta performance em menos de 2 minutos.</p>

                        {error && (
                            <div className="bg-red-500/10 text-red-400 p-6 rounded-3xl text-xs mb-10 font-black uppercase tracking-widest border border-red-500/20 flex items-center gap-4 animate-in shake duration-500">
                                <Zap size={20} className="flex-shrink-0" />
                                <span className="flex-1">{error}</span>
                                <button onClick={() => setError(null)} className="hover:rotate-90 transition-transform">
                                    <X size={20} />
                                </button>
                            </div>
                        )}

                        <form onSubmit={(e) => { e.preventDefault(); setError(null); setStep(2); }} className="space-y-8 glass-panel p-10 md:p-16 rounded-[40px] border border-white/5 metallic-border">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gold-primary ml-2 italic">NOME DA EMPRESA</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-8 py-5 bg-white/5 border border-white/5 rounded-2xl focus:border-gold-primary/40 focus:ring-4 focus:ring-gold-primary/10 text-white font-black text-xs uppercase tracking-widest placeholder:text-white/10 outline-none transition-all"
                                        placeholder="EX: MINHA LOJA LDA"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gold-primary ml-2 italic">EMAIL PARA ACESSO</label>
                                    <input
                                        type="email"
                                        autoComplete="off"
                                        required
                                        className="w-full px-8 py-5 bg-white/5 border border-white/5 rounded-2xl focus:border-gold-primary/40 focus:ring-4 focus:ring-gold-primary/10 text-white font-black text-xs uppercase tracking-widest placeholder:text-white/10 outline-none transition-all"
                                        placeholder="ADMIN@EMPRESA.COM"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gold-primary ml-2 italic">PALAVRA-PASSE DE SEGURANÇA</label>
                                <input
                                    type="password"
                                    autoComplete="off"
                                    required
                                    className="w-full px-8 py-5 bg-white/5 border border-white/5 rounded-2xl focus:border-gold-primary/40 focus:ring-4 focus:ring-gold-primary/10 text-white font-black text-xs uppercase tracking-widest placeholder:text-white/10 outline-none transition-all"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>

                            <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-10 border-t border-white/5">
                                <button type="button" onClick={onBack} className="flex items-center gap-3 text-white/40 font-black text-[10px] uppercase tracking-[0.3em] hover:text-gold-primary transition-colors italic group">
                                    <ArrowLeft size={20} className="group-hover:-translate-x-2 transition-transform" /> VOLTAR AO LOGIN
                                </button>
                                <button type="submit" className="w-full md:w-auto bg-gold-primary text-bg-deep px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-4 shadow-2xl hover:bg-white transition-all active:scale-95 italic">
                                    CONTINUAR <ArrowRight size={20} />
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {step === 2 && (
                    <div className="animate-in fade-in slide-in-from-bottom duration-700">
                        <div className="text-center mb-16">
                            <div className="inline-flex items-center gap-3 px-5 py-2 bg-gold-primary/10 border border-gold-primary/20 rounded-full text-gold-primary text-[10px] font-black uppercase tracking-[0.3em] mb-8 italic">
                                <Crown size={14} />
                                CONFIGURAÇÃO DE POTÊNCIA
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight uppercase italic">Escolha o <span className="text-gold-gradient">seu plano</span></h1>
                            <p className="text-white/40 font-black text-xs uppercase tracking-[0.2em] italic mb-12">Selecione a infraestrutura ideal para a escala do seu negócio.</p>

                            <div className="inline-flex bg-white/5 p-1.5 rounded-[24px] border border-white/5 backdrop-blur-xl">
                                <button onClick={() => setFormData({ ...formData, tipo_plano: 'mensal' })} className={`px-10 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-[0.2em] italic transition-all ${formData.tipo_plano === 'mensal' ? 'bg-gold-primary text-bg-deep shadow-xl' : 'text-white/40 hover:text-white'}`}>Mensal</button>
                                <button onClick={() => setFormData({ ...formData, tipo_plano: 'semestrial' })} className={`px-10 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-[0.2em] italic transition-all ${formData.tipo_plano === 'semestrial' ? 'bg-gold-primary text-bg-deep shadow-xl' : 'text-white/40 hover:text-white'}`}>Semestral</button>
                                <button onClick={() => setFormData({ ...formData, tipo_plano: 'anual' })} className={`px-10 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-[0.2em] italic transition-all ${formData.tipo_plano === 'anual' ? 'bg-gold-primary text-bg-deep shadow-xl' : 'text-white/40 hover:text-white'}`}>Anual (-15%)</button>
                            </div>
                        </div>

                        {error && (
                            <div className="max-w-3xl mx-auto bg-red-500/10 text-red-400 p-8 rounded-[32px] mb-12 font-black border border-red-500/20 flex items-center gap-6">
                                <Zap className="flex-shrink-0 text-red-500" size={32} />
                                <div>
                                    <p className="text-xs uppercase tracking-[0.2em] mb-1 italic">INTERFACE ERROR</p>
                                    <p className="text-[10px] opacity-60 uppercase tracking-widest leading-relaxed">{error}</p>
                                </div>
                                <button onClick={() => setError(null)} className="ml-auto hover:rotate-90 transition-transform p-2 bg-white/5 rounded-xl">
                                    <X size={24} />
                                </button>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-16">
                            {!loading && plans.length === 0 && (
                                <div className="col-span-3 text-center py-32 bg-white/[0.01] rounded-[60px] border-2 border-dashed border-white/5">
                                    <Building2 size={48} className="mx-auto text-white/5 mb-6" />
                                    <p className="text-white/20 font-black uppercase tracking-[0.4em] text-xs italic">Nenhum plano activo detectado</p>
                                </div>
                            )}
                            {plans.map(plan => (
                                <div
                                    key={plan.id}
                                    onClick={() => setFormData({ ...formData, plan_id: plan.id })}
                                    className={`p-10 rounded-[50px] border-2 transition-all cursor-pointer relative overflow-hidden group scale-100 hover:scale-[1.02] active:scale-[0.98] ${formData.plan_id === plan.id ? 'border-gold-primary bg-white/[0.03] shadow-[0_0_60px_rgba(212,175,55,0.15)]' : 'border-white/5 hover:border-white/10 bg-white/[0.01]'}`}
                                >
                                    <div className="relative z-10 text-left">
                                        <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center mb-10 transition-transform group-hover:scale-110 shadow-2xl ${plan.name === 'Enterprise' ? 'bg-amber-100 text-amber-600' : 'bg-gold-primary text-bg-deep'}`}>
                                            {plan.name === 'Básico' && <Zap size={32} />}
                                            {plan.name === 'Pro' && <Crown size={32} />}
                                            {plan.name === 'Enterprise' && <ShieldCheck size={32} />}
                                        </div>
                                        <h3 className="text-3xl font-black text-white mb-4 uppercase italic tracking-tight">{plan.name}</h3>
                                        <div className="flex items-baseline gap-2 mb-10">
                                            <span className="text-5xl font-black text-white italic">{getPlanPrice(plan).toLocaleString()}</span>
                                            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] italic">KZ / {formData.tipo_plano.toUpperCase()}</span>
                                        </div>
                                        <div className="w-full h-px bg-white/5 mb-10" />
                                        <ul className="space-y-5 mb-12">
                                            {Array.isArray(plan.features) ? (
                                                plan.features.map((f: string) => (
                                                    <li key={f} className="flex items-center gap-4 text-[11px] font-black text-white/60 uppercase tracking-widest italic">
                                                        <CheckCircle2 size={18} className="text-gold-primary flex-shrink-0" /> {f}
                                                    </li>
                                                ))
                                            ) : typeof plan.features === 'object' && plan.features !== null ? (
                                                Object.entries(plan.features).map(([key, val]: any) => (
                                                    <li key={key} className="flex items-center gap-4 text-[11px] font-black text-white/60 uppercase tracking-widest italic">
                                                        <CheckCircle2 size={18} className="text-gold-primary flex-shrink-0" /> {val} {key.replace(/_/g, ' ')}
                                                    </li>
                                                ))
                                            ) : (
                                                <li className="text-[10px] text-white/20 font-black uppercase tracking-widest italic">Configuração Especial</li>
                                            )}
                                        </ul>
                                    </div>
                                    <div className={`absolute bottom-0 right-0 w-32 h-32 bg-gold-primary/5 rounded-full blur-3xl transition-opacity animate-pulse ${formData.plan_id === plan.id ? 'opacity-100' : 'opacity-0'}`} />
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-10 border-t border-white/5">
                            <button onClick={() => setStep(1)} className="text-white/40 font-black text-[10px] uppercase tracking-[0.3em] hover:text-gold-primary transition-colors italic">ANTERIOR</button>
                            <button
                                onClick={handleRegister}
                                disabled={!formData.plan_id || loading}
                                className={`w-full md:w-auto bg-gold-primary text-bg-deep px-16 py-6 rounded-2xl font-black text-xs uppercase tracking-[0.4em] flex items-center justify-center gap-4 shadow-2xl transition-all italic ${!formData.plan_id || loading ? 'opacity-20 grayscale cursor-not-allowed' : 'hover:bg-white active:scale-95'}`}
                            >
                                {loading ? 'PROCESSANDO...' : 'ACTIVAR SISTEMA'} <CheckCircle2 size={24} />
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="text-center animate-in zoom-in duration-700 py-10">
                        <div className="w-32 h-32 bg-gold-primary/10 text-gold-primary rounded-[40px] border border-gold-primary/20 flex items-center justify-center mx-auto mb-10 shadow-[0_0_80px_rgba(212,175,55,0.2)] animate-pulse">
                            <CheckCircle2 size={64} />
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tight uppercase italic">Activação <span className="text-gold-gradient">Concluída!</span></h1>
                        <p className="text-white/40 font-black text-xs uppercase tracking-[0.2em] mb-12 max-w-xl mx-auto italic leading-relaxed">
                            O ecossistema da sua empresa foi inicializado. Para activar o acesso total, efectue o pagamento via IBAN e anexe o comprovativo abaixo.<br /><br />
                            <span className="text-white text-xl md:text-2xl mt-4 block border-2 border-dashed border-white/10 p-6 rounded-3xl bg-white/[0.02] tracking-tighter">AO06 0051 0000 1234 5678 9012 3</span>
                        </p>

                        {tenantLink && (
                            <div className="max-w-lg mx-auto glass-panel p-10 rounded-[50px] mb-12 border border-white/5 shadow-2xl animate-in fade-in zoom-in duration-1000 delay-300">
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gold-primary mb-6 italic">COORDENADA DE ACESSO EXCLUSIVA</p>
                                <div className="flex flex-col md:flex-row items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/5 transition-all hover:bg-white/[0.08]">
                                    <code className="text-gold-primary font-black text-xs truncate flex-1 uppercase tracking-wider p-2">{tenantLink}</code>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(tenantLink);
                                        }}
                                        className="w-full md:w-auto bg-gold-primary text-bg-deep px-6 py-4 rounded-2xl hover:bg-white transition-all active:scale-90"
                                    >
                                        <ArrowRight size={20} />
                                    </button>
                                </div>
                                <p className="text-[10px] font-black text-white/20 mt-6 italic tracking-widest uppercase">Guarde esta coordenada para aceder ao portal em qualquer lugar.</p>
                            </div>
                        )}

                        <div className="max-w-lg mx-auto p-12 border-2 border-dashed border-white/10 rounded-[60px] mb-12 hover:border-gold-primary/40 hover:bg-white/[0.01] transition-all group cursor-pointer relative overflow-hidden">
                            <Upload size={48} className="text-white/10 mx-auto mb-6 group-hover:text-gold-primary group-hover:scale-110 transition-all duration-500" />
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] group-hover:text-gold-primary transition-colors italic">CARREGAR COMPROVATIVO (PDF / JPG)</p>
                            <div className="absolute inset-0 bg-gold-primary/0 group-hover:bg-gold-primary/[0.02] transition-colors" />
                        </div>

                        <button
                            onClick={onSuccess}
                            className="bg-white text-bg-deep px-16 py-6 rounded-2xl font-black text-xs uppercase tracking-[0.4em] hover:bg-gold-primary transition-all shadow-[0_20px_60px_rgba(255,255,255,0.1)] italic active:scale-95"
                        >
                            ACEDER AO DASHBOARD
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
