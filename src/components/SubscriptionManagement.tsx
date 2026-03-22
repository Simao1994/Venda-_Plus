import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, AlertCircle, Upload, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';

export default function SubscriptionManagement() {
    const { token, user } = useAuth();
    const [subscription, setSubscription] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSubscription();
    }, []);

    const fetchSubscription = async () => {
        try {
            const res = await api.get('/api/company/subscription');
            const data = await res.json();
            setSubscription(data);
        } catch (error) {
            console.error('Error fetching subscription:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20">
            <div className="w-12 h-12 border-4 border-gold-primary border-t-transparent rounded-full animate-spin" />
            <span className="mt-4 font-black uppercase tracking-[0.3em] text-gold-primary animate-pulse italic">Validando Credenciais...</span>
        </div>
    );

    return (
        <div className="p-6 lg:p-12 max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase">Gestão de <span className="text-gold-primary">Assinatura</span></h1>
                    <p className="text-white/40 font-black uppercase text-[10px] tracking-[0.2em] mt-1 italic">Controlo estratégico de licenciamento e liquidação de activos</p>
                </div>
                <div className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest border backdrop-blur-md ${subscription?.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                    }`}>
                    Status: <span className="underline decoration-2 underline-offset-4">{subscription?.status === 'active' ? 'Activo (Premium)' : (subscription?.status || 'Pendente')}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Plan Details */}
                <div className="glass-panel p-10 rounded-[40px] shadow-2xl border border-white/10 relative overflow-hidden gold-glow-hover transition-all group">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-gold-primary/5 rounded-full -mr-24 -mt-24 blur-3xl group-hover:bg-gold-primary/10 transition-colors" />
                    <div className="relative z-10">
                        <div className="w-20 h-20 bg-gold-primary/10 text-gold-primary rounded-[32px] flex items-center justify-center mb-8 border border-gold-primary/20 shadow-lg shadow-gold-primary/10 group-hover:scale-110 transition-transform">
                            <ShieldCheck size={40} />
                        </div>
                        <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-3 italic">Módulo de Licenciamento</h3>
                        <h2 className="text-4xl font-black text-white italic tracking-tighter mb-8 leading-[0.8]">{subscription?.saas_plans?.name || '---'}</h2>

                        <div className="space-y-5">
                            {subscription?.saas_plans?.features?.map((feature: string, idx: number) => (
                                <div key={idx} className="flex items-center gap-4 text-white/60 font-black uppercase text-[10px] tracking-widest group/feat">
                                    <CheckCircle2 size={18} className="text-gold-primary group-hover/feat:scale-125 transition-transform" />
                                    <span className="group-hover:text-white transition-colors">{feature.replace('_', ' ')}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Payment Info */}
                <div className="bg-[#0D0D0D] p-10 rounded-[40px] shadow-2xl text-white border border-gold-primary/20 relative overflow-hidden">
                    <div className="absolute bottom-0 right-0 w-64 h-64 bg-gold-primary/5 rounded-full blur-3xl -mr-32 -mb-32" />
                    <h3 className="text-[10px] font-black text-gold-primary/40 uppercase tracking-[0.3em] mb-8 italic">Liquidação de Activos</h3>
                    <div className="space-y-8 relative z-10">
                        <div>
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-3 italic">Coordenadas Bancárias (IBAN)</p>
                            <div className="p-6 bg-white/5 rounded-3xl border border-white/10 flex items-center justify-between group cursor-pointer hover:bg-gold-primary/5 hover:border-gold-primary/30 transition-all backdrop-blur-xl">
                                <span className="font-mono text-sm font-black tracking-[0.1em] text-gold-primary/80 group-hover:text-gold-primary transition-colors">AO06 0051 0000 1234 5678 9012 3</span>
                                <CreditCard size={20} className="text-gold-primary/40 group-hover:text-gold-primary group-hover:scale-110 transition-all" />
                            </div>
                        </div>

                        <div>
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-2 italic">Entidade Beneficiária</p>
                            <p className="font-black text-xl italic text-white uppercase tracking-tight">Venda Plus SaaS <span className="text-gold-primary">- Pagamentos</span></p>
                        </div>

                        <div className="pt-8 border-t border-white/5">
                            <button className="w-full bg-gold-primary text-black py-5 rounded-3xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-gold-secondary transition-all shadow-xl shadow-gold-primary/20 active:scale-95 flex items-center justify-center gap-3">
                                Enviar Comprovativo Digital <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Expiring Alert */}
            {subscription?.status !== 'active' && (
                <div className="glass-panel border-2 border-amber-500/20 p-10 rounded-[48px] flex flex-col md:flex-row gap-8 items-center bg-amber-500/5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl -ml-16 -mt-16" />
                    <div className="w-20 h-20 bg-[#0B0B0B] rounded-[32px] flex items-center justify-center text-amber-500 shadow-2xl border border-amber-500/20 shrink-0 animate-pulse">
                        <AlertCircle size={40} />
                    </div>
                    <div className="text-center md:text-left">
                        <h4 className="text-2xl font-black text-white mb-2 italic uppercase tracking-tight">ALERTA <span className="text-amber-500">DE LICENCIAMENTO</span></h4>
                        <p className="text-white/40 font-black uppercase text-[10px] tracking-[0.2em] leading-relaxed max-w-2xl">
                            O SEU ACESSO AOS RECURSOS PREMIUM ESTÁ LIMITADO. EFETUE A LIQUIDAÇÃO VIA IBAN E ENVIE O COMPROVATIVO PARA RESTAURAR O FLUXO OPERACIONAL TOTAL DA PLATAFORMA.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
