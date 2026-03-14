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
    ArrowLeft
} from 'lucide-react';

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

    useEffect(() => {
        setLoading(true);
        fetch('/api/saas/plans')
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
            const res = await fetch('/api/saas/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setStep(3);
            }
        } catch (error) {
            console.error('Registration error:', error);
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
        <div className="min-h-screen bg-white flex flex-col items-center p-6 md:p-12">
            <div className="max-w-4xl w-full">
                {/* Progress Bar */}
                <div className="flex items-center justify-between mb-16 relative">
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 -z-10" />
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black transition-all ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'}`}>1</div>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black transition-all ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'}`}>2</div>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black transition-all ${step >= 3 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'}`}>3</div>
                </div>

                {step === 1 && (
                    <div className="animate-in fade-in slide-in-from-bottom duration-500">
                        <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Crie a conta da sua empresa</h1>
                        <p className="text-slate-500 font-medium mb-10 text-lg">Inicie sua jornada na gestão profissional em menos de 2 minutos.</p>

                        <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome da Empresa</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 font-bold"
                                        placeholder="Ex: Minha Loja Lda"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Administrativo</label>
                                    <input
                                        type="email"
                                        autoComplete="off"
                                        required
                                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 font-bold"
                                        placeholder="admin@empresa.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Palavra-passe</label>
                                <input
                                    type="password"
                                    autoComplete="off"
                                    required
                                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 font-bold"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                            <div className="flex items-center justify-between pt-8">
                                <button type="button" onClick={onBack} className="flex items-center gap-2 text-slate-400 font-bold hover:text-slate-600">
                                    <ArrowLeft size={20} /> Voltar para o Login
                                </button>
                                <button type="submit" className="bg-indigo-600 text-white px-10 py-4 rounded-[24px] font-black flex items-center gap-3 shadow-xl shadow-indigo-200">
                                    Continuar <ArrowRight size={20} />
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {step === 2 && (
                    <div className="animate-in fade-in slide-in-from-bottom duration-500">
                        <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Escolha o plano ideal</h1>
                        <div className="flex bg-slate-100 p-1 rounded-2xl w-fit mb-10">
                            <button onClick={() => setFormData({ ...formData, tipo_plano: 'mensal' })} className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${formData.tipo_plano === 'mensal' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Mensal</button>
                            <button onClick={() => setFormData({ ...formData, tipo_plano: 'semestrial' })} className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${formData.tipo_plano === 'semestrial' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Semestral</button>
                            <button onClick={() => setFormData({ ...formData, tipo_plano: 'anual' })} className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${formData.tipo_plano === 'anual' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Anual (-15%)</button>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 p-6 rounded-3xl mb-8 font-bold border-2 border-red-100 flex items-center gap-4">
                                <Zap className="flex-shrink-0" />
                                <div>
                                    <p>Erro ao carregar planos SaaS.</p>
                                    <p className="text-xs opacity-70">Certifique-se que o servidor está online e as sementes foram criadas.</p>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                            {!loading && plans.length === 0 && (
                                <div className="col-span-3 text-center py-20 bg-slate-50 rounded-[40px] border-4 border-dashed border-slate-200">
                                    <Building2 size={48} className="mx-auto text-slate-300 mb-4" />
                                    <p className="text-slate-500 font-black uppercase tracking-widest">Nenhum plano disponível no momento.</p>
                                </div>
                            )}
                            {plans.map(plan => (
                                <div
                                    key={plan.id}
                                    onClick={() => setFormData({ ...formData, plan_id: plan.id })}
                                    className={`p-8 rounded-[40px] border-4 transition-all cursor-pointer relative overflow-hidden group ${formData.plan_id === plan.id ? 'border-indigo-600 bg-indigo-50/10' : 'border-slate-50 hover:border-slate-200 bg-white'}`}
                                >
                                    <div className="relative z-10">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${plan.name === 'Enterprise' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                            {plan.name === 'Básico' && <Zap size={24} />}
                                            {plan.name === 'Pro' && <Crown size={24} />}
                                            {plan.name === 'Enterprise' && <ShieldCheck size={24} />}
                                        </div>
                                        <h3 className="text-2xl font-black text-slate-900 mb-2">{plan.name}</h3>
                                        <div className="flex items-baseline gap-1 mb-6">
                                            <span className="text-3xl font-black text-slate-900">{getPlanPrice(plan).toLocaleString()}</span>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kz/{formData.tipo_plano}</span>
                                        </div>
                                        <ul className="space-y-4 mb-8">
                                            {Array.isArray(plan.features) ? (
                                                plan.features.map((f: string) => (
                                                    <li key={f} className="flex items-center gap-2 text-sm font-bold text-slate-600">
                                                        <CheckCircle2 size={16} className="text-indigo-500" /> Módulo {f}
                                                    </li>
                                                ))
                                            ) : typeof plan.features === 'object' && plan.features !== null ? (
                                                Object.entries(plan.features).map(([key, val]: any) => (
                                                    <li key={key} className="flex items-center gap-2 text-sm font-bold text-slate-600">
                                                        <CheckCircle2 size={16} className="text-indigo-500" /> {val} {key.replace('_', ' ')}
                                                    </li>
                                                ))
                                            ) : (
                                                <li className="text-xs text-slate-400 font-medium">Configuração personalizada</li>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center justify-between">
                            <button onClick={() => setStep(1)} className="text-slate-400 font-bold hover:text-slate-600">Voltar</button>
                            <button
                                onClick={handleRegister}
                                disabled={!formData.plan_id || loading}
                                className={`bg-indigo-600 text-white px-12 py-5 rounded-[24px] font-black flex items-center gap-3 shadow-xl transition-all ${!formData.plan_id ? 'opacity-50 grayscale' : 'shadow-indigo-200 hover:scale-105 active:scale-95'}`}
                            >
                                {loading ? 'Processando...' : 'Finalizar Registo'} <CheckCircle2 size={20} />
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="text-center animate-in zoom-in duration-500">
                        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8">
                            <CheckCircle2 size={48} />
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Registo efectuado com sucesso!</h1>
                        <p className="text-slate-500 font-medium mb-12 text-lg max-w-md mx-auto">Sua conta foi criada. Para ativar o acesso, por favor anexe o comprovativo de pagamento abaixo via IBAN: <br /><br /><strong>AO06 0051 0000 1234 5678 9012 3</strong></p>

                        <div className="max-w-md mx-auto p-8 border-4 border-dashed border-slate-100 rounded-[40px] mb-12 hover:border-indigo-100 transition-colors group cursor-pointer">
                            <Upload size={32} className="text-slate-300 mx-auto mb-4 group-hover:text-indigo-500 transition-colors" />
                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">Carregar Comprovativo (PDF/JPG)</p>
                        </div>

                        <button
                            onClick={onSuccess}
                            className="bg-slate-900 text-white px-12 py-5 rounded-[24px] font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                        >
                            Ir para o Dashboard
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
