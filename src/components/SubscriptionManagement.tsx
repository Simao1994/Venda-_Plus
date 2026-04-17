import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, AlertCircle, Upload, ArrowRight, ShieldCheck, Clock, RefreshCw, Copy, Check, DollarSign, Calendar, Phone, Mail, MessageSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';

const SUPPORT_CONTACT = {
    name: "Eng.º Simão Puca",
    phone: "+244945035089",
    email: "simaopambo94@gmail.com",
    whatsapp: "https://wa.me/244945035089?text=Olá Eng.º Simão Puca, preciso de suporte técnico no Venda Plus."
};

export default function SubscriptionManagement() {
    const { user } = useAuth();
    const [subscription, setSubscription] = useState<any>(null);
    const [paymentConfig, setPaymentConfig] = useState<any>({
        payment_iban: '---',
        payment_beneficiary: 'Venda Plus SaaS - Pagamentos',
        payment_phone: ''
    });
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [copyStatus, setCopyStatus] = useState<'none' | 'email' | 'phone'>('none');
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        Promise.all([fetchSubscription(), fetchPaymentConfig()]);
    }, []);

    const fetchSubscription = async () => {
        try {
            const res = await api.get('/api/company/subscription');
            const data = await res.json();
            setSubscription(data);
        } catch (err: any) {
            setError(err.message || 'Erro ao carregar subscrição.');
        } finally {
            setLoading(false);
        }
    };

    const fetchPaymentConfig = async () => {
        try {
            const res = await api.get('/api/saas/config/payment');
            const data = await res.json();
            if (data && data.payment_iban) setPaymentConfig(data);
        } catch {
            // silently fail — use defaults
        }
    };

    const copyIban = async () => {
        await navigator.clipboard.writeText(paymentConfig.payment_iban || '');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const copySupportInfo = async (type: 'email' | 'phone') => {
        const text = type === 'email' ? SUPPORT_CONTACT.email : SUPPORT_CONTACT.phone;
        await navigator.clipboard.writeText(text);
        setCopyStatus(type);
        setTimeout(() => setCopyStatus('none'), 2000);
    };

    const handleUploadClick = () => fileInputRef.current?.click();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `payments/${user?.company_id}/${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('company-files')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('company-files')
                .getPublicUrl(fileName);

            const amount = subscription?.saas_plans?.price_monthly || 0;
            const res = await api.post('/api/saas/payments', {
                amount,
                proof_url: publicUrl,
                method: 'BANK_TRANSFER'
            });

            if (!res.ok) throw new Error('Falha ao registar pagamento no servidor.');

            alert('Comprovativo enviado com sucesso! O administrador irá validar o pagamento em breve.');
            fetchSubscription();
        } catch (err: any) {
            alert(`Erro ao enviar comprovativo: ${err.message}`);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-12 h-12 border-4 border-gold-primary border-t-transparent rounded-full animate-spin" />
            <span className="mt-4 font-black uppercase tracking-[0.3em] text-gold-primary animate-pulse italic text-sm">A Carregar Subscrição...</span>
        </div>
    );

    if (error) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
            <div className="w-20 h-20 bg-red-500/10 rounded-[32px] flex items-center justify-center border border-red-500/20">
                <AlertCircle size={40} className="text-red-400" />
            </div>
            <div className="text-center">
                <h3 className="text-xl font-black text-white italic uppercase mb-2">Erro de Ligação</h3>
                <p className="text-white/40 text-sm font-black uppercase tracking-widest">{error}</p>
            </div>
            <button onClick={() => { setLoading(true); setError(null); fetchSubscription(); }}
                className="flex items-center gap-3 px-8 py-4 bg-gold-primary text-black rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:scale-105 transition-all">
                <RefreshCw size={14} /> Tentar Novamente
            </button>
        </div>
    );

    const isActive = subscription?.status === 'active';
    const planFeatures: string[] = subscription?.saas_plans?.features || [];

    return (
        <div className="p-6 lg:p-12 max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,.pdf" />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase">Gestão de <span className="text-gold-primary">Assinatura</span></h1>
                    <p className="text-white/40 font-black uppercase text-[10px] tracking-[0.2em] mt-1 italic">Controlo estratégico de licenciamento e liquidação de activos</p>
                </div>
                <div className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest border backdrop-blur-md ${isActive ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                    Status: <span className="underline decoration-2 underline-offset-4">{isActive ? 'Activo (Premium)' : (subscription?.status || 'Pendente')}</span>
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
                        <h2 className="text-3xl font-black text-white italic tracking-tighter mb-8 leading-tight">
                            {subscription?.saas_plans?.name || <span className="text-white/20">Sem Plano Activo</span>}
                        </h2>

                        {!isActive ? (
                            <div className="flex items-center gap-3 text-amber-500/60 font-black uppercase text-[10px] tracking-widest">
                                <Clock size={16} className="animate-pulse" />
                                <span>Aguarda validação pelo administrador</span>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-white/5">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-gold-primary/60 font-black text-[8px] uppercase tracking-widest">
                                            <DollarSign size={12} /> Valor do Plano
                                        </div>
                                        <div className="text-lg font-black text-white italic">
                                            {(subscription?.valor_pago || 0).toLocaleString()} {user?.currency || 'Kz'}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-gold-primary/60 font-black text-[8px] uppercase tracking-widest">
                                            <Calendar size={12} /> Data de Expiração
                                        </div>
                                        <div className="text-lg font-black text-white italic">
                                            {subscription?.data_expiracao ? new Date(subscription.data_expiracao).toLocaleDateString() : '---'}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-white/20 font-black text-[8px] uppercase tracking-widest">
                                            <Clock size={12} /> Activo Desde
                                        </div>
                                        <div className="text-sm font-black text-white/40 italic">
                                            {subscription?.data_inicio ? new Date(subscription.data_inicio).toLocaleDateString() : (subscription?.created_at ? new Date(subscription.created_at).toLocaleDateString() : '---')}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <p className="text-[9px] font-black text-white/20 uppercase tracking-widest italic mb-2">Recursos Incluídos:</p>
                                    {planFeatures.length > 0 ? planFeatures.map((feat: string, idx: number) => (
                                        <div key={idx} className="flex items-center gap-4 text-white/60 font-black uppercase text-[10px] tracking-widest group/feat">
                                            <CheckCircle2 size={18} className="text-gold-primary shrink-0 group-hover/feat:scale-125 transition-transform" />
                                            <span className="group-hover:text-white transition-colors">{feat.replace(/_/g, ' ')}</span>
                                        </div>
                                    )) : (
                                        <p className="text-white/20 text-[10px] font-black uppercase tracking-widest italic">Nenhum módulo configurado</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Payment Info */}
                <div className="bg-[#0D0D0D] p-10 rounded-[40px] shadow-2xl text-white border border-gold-primary/20 relative overflow-hidden">
                    <div className="absolute bottom-0 right-0 w-64 h-64 bg-gold-primary/5 rounded-full blur-3xl -mr-32 -mb-32" />
                    <h3 className="text-[10px] font-black text-gold-primary/40 uppercase tracking-[0.3em] mb-8 italic">Liquidação de Activos</h3>
                    <div className="space-y-6 relative z-10">
                        <div>
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-3 italic">Coordenadas Bancárias (IBAN)</p>
                            <button
                                onClick={copyIban}
                                className="w-full p-5 bg-white/5 rounded-3xl border border-white/10 flex items-center justify-between group hover:bg-gold-primary/5 hover:border-gold-primary/30 transition-all"
                            >
                                <span className="font-mono text-sm font-black tracking-[0.06em] text-gold-primary/80 group-hover:text-gold-primary transition-colors text-left break-all">
                                    {paymentConfig.payment_iban}
                                </span>
                                <span className="ml-3 shrink-0 text-gold-primary/40 group-hover:text-gold-primary transition-all">
                                    {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
                                </span>
                            </button>
                            {copied && <p className="text-emerald-400 text-[9px] font-black uppercase tracking-widest mt-2 ml-2">IBAN copiado!</p>}
                        </div>

                        <div>
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-2 italic">Entidade Beneficiária</p>
                            <p className="font-black text-lg italic text-white uppercase tracking-tight">{paymentConfig.payment_beneficiary}</p>
                        </div>

                        {paymentConfig.payment_phone && (
                            <div>
                                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-2 italic">Contacto / Referência</p>
                                <p className="font-black text-white/70 tracking-widest">{paymentConfig.payment_phone}</p>
                            </div>
                        )}

                        <div className="pt-4 border-t border-white/5">
                            <button
                                onClick={handleUploadClick}
                                disabled={uploading}
                                className="w-full bg-gold-primary text-black py-5 rounded-3xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-gold-secondary transition-all shadow-xl shadow-gold-primary/20 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {uploading ? (
                                    <>A Processar... <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /></>
                                ) : (
                                    <>Enviar Comprovativo Digital <ArrowRight size={16} /></>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Support Info */}
            <div className="glass-panel p-10 rounded-[48px] border border-white/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gold-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
                    <div className="w-24 h-24 bg-white/5 rounded-[32px] flex items-center justify-center text-gold-primary border border-white/10 shadow-2xl shrink-0 group-hover:scale-110 transition-transform">
                        <MessageSquare size={40} />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h3 className="text-[10px] font-black text-gold-primary/40 uppercase tracking-[0.3em] mb-2 italic">Apoio ao Cliente</h3>
                        <h2 className="text-2xl font-black text-white italic tracking-tighter mb-4 uppercase">Precisa de Ajuda ou <span className="text-gold-primary">Personalização?</span></h2>
                        <p className="text-white/30 font-black uppercase text-[10px] tracking-widest max-w-xl leading-relaxed">
                            A nossa equipa de engenharia está disponível para ajudar na configuração do seu licenciamento ou personalização do sistema.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row flex-wrap justify-center md:justify-end gap-4 w-full md:w-auto">
                        {/* WhatsApp */}
                        <a href={SUPPORT_CONTACT.whatsapp} target="_blank" rel="noopener noreferrer" 
                           className="flex items-center justify-center gap-3 px-4 py-4 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-2xl font-black uppercase text-[9px] tracking-widest hover:bg-emerald-500 hover:text-white transition-all active:scale-95 shadow-lg shadow-emerald-500/5">
                            <MessageSquare size={16} /> WhatsApp
                        </a>

                        {/* Phone with Copy Fallback */}
                        <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl overflow-hidden group/btn shadow-lg">
                            <a href={`tel:${SUPPORT_CONTACT.phone}`}
                               className="flex-1 flex items-center gap-3 px-4 py-4 text-white/60 font-black uppercase text-[9px] tracking-widest hover:bg-gold-primary hover:text-black transition-all active:scale-95">
                                <Phone size={16} className="shrink-0" /> {SUPPORT_CONTACT.phone}
                            </a>
                            <button onClick={() => copySupportInfo('phone')}
                                    title="Copiar Telefone"
                                    className="px-4 py-4 border-l border-white/10 text-white/20 hover:text-gold-primary transition-colors flex items-center justify-center bg-white/[0.02]">
                                {copyStatus === 'phone' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                            </button>
                        </div>

                        {/* Email with Copy Fallback */}
                        <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl overflow-hidden group/btn shadow-lg max-w-full">
                            <a href={`mailto:${SUPPORT_CONTACT.email}`}
                               className="flex items-center gap-3 px-4 py-4 text-white/60 font-black uppercase text-[9px] tracking-widest hover:bg-gold-primary hover:text-black transition-all active:scale-95 truncate">
                                <Mail size={16} className="shrink-0" /> <span className="truncate">{SUPPORT_CONTACT.email}</span>
                            </a>
                            <button onClick={() => copySupportInfo('email')}
                                    title="Copiar E-mail"
                                    className="px-4 py-4 border-l border-white/10 text-white/20 hover:text-gold-primary transition-colors flex items-center justify-center bg-white/[0.02] shrink-0">
                                {copyStatus === 'email' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Alert */}
            {!isActive && (
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
