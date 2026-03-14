import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, AlertCircle, Upload, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function SubscriptionManagement() {
    const { token, user } = useAuth();
    const [subscription, setSubscription] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSubscription();
    }, []);

    const fetchSubscription = async () => {
        try {
            const res = await fetch('/api/company/subscription', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setSubscription(data);
        } catch (error) {
            console.error('Error fetching subscription:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Carregando dados da assinatura...</div>;

    return (
        <div className="p-6 lg:p-12 max-w-5xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Gestão de Assinatura</h1>
                    <p className="text-slate-500 font-medium">Controle o status do seu plano e pagamentos</p>
                </div>
                <div className={`px-6 py-2 rounded-2xl text-xs font-black uppercase tracking-widest ${subscription?.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                    Status: {subscription?.status || 'Pendente'}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Plan Details */}
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full -mr-16 -mt-16" />
                    <div className="relative">
                        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center mb-6">
                            <ShieldCheck size={32} />
                        </div>
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2">Plano Atual</h3>
                        <h2 className="text-4xl font-black text-slate-900 mb-6">{subscription?.saas_plans?.name || 'Carregando...'}</h2>

                        <div className="space-y-4">
                            {subscription?.saas_plans?.features?.map((feature: string, idx: number) => (
                                <div key={idx} className="flex items-center gap-3 text-slate-600 font-bold">
                                    <CheckCircle2 size={18} className="text-indigo-500" />
                                    <span className="capitalize">{feature.replace('_', ' ')}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Payment Info */}
                <div className="bg-slate-900 p-8 rounded-[40px] shadow-xl text-white">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Dados para Renovação</h3>
                    <div className="space-y-6">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase mb-2">IBAN (BAI)</p>
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between group cursor-pointer hover:bg-white/10 transition-all">
                                <span className="font-mono text-sm font-black tracking-wider">AO06 0051 0000 1234 5678 9012 3</span>
                                <CreditCard size={18} className="text-indigo-400" />
                            </div>
                        </div>

                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase mb-2">Titular</p>
                            <p className="font-black text-lg">Venda Plus SaaS - Pagamentos</p>
                        </div>

                        <div className="pt-6 border-t border-white/10">
                            <button className="w-full bg-indigo-600 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20">
                                Enviar Comprovativo
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Expiring Alert */}
            {subscription?.status !== 'active' && (
                <div className="bg-amber-50 border-2 border-amber-100 p-8 rounded-[40px] flex gap-6">
                    <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-amber-500 shadow-sm shrink-0">
                        <AlertCircle size={32} />
                    </div>
                    <div>
                        <h4 className="text-xl font-black text-slate-900 mb-2">Assinatura Expirada ou Pendente</h4>
                        <p className="text-slate-600 font-medium">
                            Seu acesso aos recursos premium está limitado. Realize o pagamento via IBAN e envie o comprovativo para restaurar o acesso total.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
