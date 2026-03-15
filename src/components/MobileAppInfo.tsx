import React, { useState } from 'react';
import { Smartphone, Download, QrCode, Zap, Bell, Shield, TrendingUp, CheckCircle2 } from 'lucide-react';

export default function MobileAppInfo() {
    const [showInstructions, setShowInstructions] = useState<'ios' | 'android' | null>(null);

    return (
        <div className="p-6 lg:p-12 max-w-6xl mx-auto space-y-12">
            {/* Hero Section */}
            <div className="flex flex-col lg:flex-row items-center gap-12">
                <div className="flex-1 space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full font-black text-[10px] uppercase tracking-widest">
                        <Smartphone size={14} /> Mobile First
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 leading-[1.1] tracking-tight">
                        Gestão na palma da <span className="text-indigo-600 italic">sua mão.</span>
                    </h1>
                    <p className="text-xl text-slate-500 font-medium leading-relaxed">
                        Acesse o Venda Plus Mobile e controle suas vendas, stock e funcionários de qualquer lugar do mundo. Disponível para Android e iOS.
                    </p>
                    <div className="flex flex-wrap gap-4 pt-4">
                        <button
                            onClick={() => setShowInstructions('ios')}
                            className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-[24px] font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95 border border-slate-700"
                        >
                            <Smartphone size={20} className="text-indigo-400" />
                            <span>Disponível para <span className="text-white">iPhone</span></span>
                        </button>
                        <button
                            onClick={() => setShowInstructions('android')}
                            className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-[24px] font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95 border border-slate-700"
                        >
                            <Download size={20} className="text-indigo-400" />
                            <span>Baixar para <span className="text-white">Android</span></span>
                        </button>
                    </div>
                </div>
                <div className="flex-1 relative">
                    <div className="absolute inset-0 bg-indigo-600/5 blur-[100px] rounded-full" />
                    <div className="relative bg-white p-12 rounded-[60px] shadow-2xl border border-slate-50 flex flex-col items-center">
                        <div className="w-48 h-48 bg-slate-50 rounded-[40px] flex items-center justify-center mb-8 border-2 border-dashed border-slate-200">
                            <QrCode size={100} className="text-slate-300" />
                        </div>
                        <p className="text-slate-400 font-black text-xs uppercase tracking-widest">Escaneie para baixar</p>
                    </div>
                </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12">
                {[
                    { icon: Zap, title: 'Vendas em Tempo Real', desc: 'Acompanhe cada venda no momento em que ela acontece.' },
                    { icon: Bell, title: 'Notificações Push', desc: 'Alertas de stock baixo e pagamentos pendentes.' },
                    { icon: Shield, title: 'Segurança Biométrica', desc: 'Acesse seus dados com FaceID ou Impressão Digital.' }
                ].map((f, i) => (
                    <div key={i} className="p-8 bg-white rounded-[40px] shadow-sm border border-slate-100 hover:border-indigo-100 transition-all group">
                        <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <f.icon size={24} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-3">{f.title}</h3>
                        <p className="text-slate-500 font-medium leading-relaxed">{f.desc}</p>
                    </div>
                ))}
            </div>

            {/* Instruction Modal */}
            {showInstructions && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[48px] w-full max-w-lg shadow-2xl overflow-hidden">
                        <div className="p-10 text-center relative">
                            <button
                                onClick={() => setShowInstructions(null)}
                                className="absolute top-8 right-8 text-slate-400 hover:text-slate-900 transition-colors"
                            >
                                <CheckCircle2 size={32} />
                            </button>

                            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                {showInstructions === 'ios' ? <Smartphone size={40} /> : <Download size={40} />}
                            </div>

                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                                Instalar no {showInstructions === 'ios' ? 'iPhone' : 'Android'}
                            </h2>
                            <p className="text-slate-500 font-medium mt-2">
                                Tenha o Venda Plus como um App nativo no seu telemóvel.
                            </p>
                        </div>

                        <div className="px-10 pb-10 space-y-8">
                            {showInstructions === 'ios' ? (
                                <div className="space-y-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-black text-xs shrink-0">1</div>
                                        <p className="text-slate-600 font-bold leading-tight">Abra este link no <span className="text-indigo-600">Safari</span> do seu iPhone.</p>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-black text-xs shrink-0">2</div>
                                        <p className="text-slate-600 font-bold leading-tight">Toque no botão de <span className="text-indigo-600">Compartilhar</span> (ícone quadrado com seta para cima).</p>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-black text-xs shrink-0">3</div>
                                        <p className="text-slate-600 font-bold leading-tight">Role para baixo e selecione <span className="text-indigo-600 font-black italic">"Adicionar ao Ecrã Principal"</span>.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-black text-xs shrink-0">1</div>
                                        <p className="text-slate-600 font-bold leading-tight">Abra este link no <span className="text-indigo-600">Chrome</span>.</p>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-black text-xs shrink-0">2</div>
                                        <p className="text-slate-600 font-bold leading-tight">Toque nos <span className="text-indigo-600">três pontos</span> no canto superior direito.</p>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-black text-xs shrink-0">3</div>
                                        <p className="text-slate-600 font-bold leading-tight">Selecione <span className="text-indigo-600 font-black italic">"Instalar Aplicativo"</span> ou "Adicionar à Tela Inicial".</p>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={() => setShowInstructions(null)}
                                className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black uppercase tracking-widest text-sm hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 active:scale-95"
                            >
                                Entendi, vou instalar agora
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
