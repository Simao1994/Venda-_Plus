import React from 'react';
import { Phone, Mail, MessageSquare, Shield, Clock, Globe } from 'lucide-react';

export default function Support() {
    const contactInfo = {
        name: "Eng.º Simão Puca",
        phone: "945035089",
        email: "simaopambo94@gmail.com",
        whatsapp: "https://wa.me/244945035089?text=Olá Eng.º Simão Puca, preciso de suporte técnico no Venda Plus."
    };

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            <div className="bg-white rounded-[40px] p-12 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-50 rounded-full -ml-32 -mb-32 blur-3xl opacity-50" />

                <div className="relative z-10 flex flex-col md:flex-row gap-12 items-center">
                    <div className="flex-1 space-y-6 text-center md:text-left">
                        <div>
                            <span className="px-4 py-1.5 bg-emerald-100 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                                Centro de Suporte
                            </span>
                            <h1 className="text-4xl font-black text-gray-900 mt-4 tracking-tight">Suporte Técnico <span className="text-emerald-600 italic">Especializado</span></h1>
                            <p className="text-gray-500 mt-4 font-medium text-lg max-w-xl">
                                Estamos aqui para garantir que o seu sistema Venda Plus funcione sem interrupções. Atendimento direto com o nosso arquiteto de sistemas.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-6 bg-gray-50 rounded-3xl border-2 border-transparent hover:border-emerald-500 transition-all group">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 mb-4 shadow-sm group-hover:scale-110 transition-transform">
                                    <Shield size={24} />
                                </div>
                                <h3 className="font-black text-gray-900 text-sm uppercase tracking-widest">Garantia de Estabilidade</h3>
                                <p className="text-xs text-gray-400 mt-1 font-bold">Monitorização 24/7 dos serviços core.</p>
                            </div>
                            <div className="p-6 bg-gray-50 rounded-3xl border-2 border-transparent hover:border-blue-500 transition-all group">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 mb-4 shadow-sm group-hover:scale-110 transition-transform">
                                    <Clock size={24} />
                                </div>
                                <h3 className="font-black text-gray-900 text-sm uppercase tracking-widest">Resposta Rápida</h3>
                                <p className="text-xs text-gray-400 mt-1 font-bold">Tempo médio de resposta inferior a 2h.</p>
                            </div>
                        </div>
                    </div>

                    <div className="w-full md:w-[380px] bg-gray-50 rounded-[40px] p-8 border border-white shadow-xl relative">
                        <div className="flex flex-col items-center text-center space-y-6">
                            <div className="w-24 h-24 bg-white rounded-full p-1 shadow-inner relative">
                                <div className="w-full h-full bg-emerald-600 rounded-full flex items-center justify-center text-white">
                                    <span className="text-3xl font-black">SP</span>
                                </div>
                                <div className="absolute bottom-1 right-1 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full animate-pulse" />
                            </div>

                            <div>
                                <h2 className="text-xl font-black text-gray-900">{contactInfo.name}</h2>
                                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Engenheiro de Sistemas & Suporte</p>
                            </div>

                            <div className="w-full space-y-3">
                                <a
                                    href={`tel:${contactInfo.phone}`}
                                    className="w-full flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 hover:border-emerald-500 transition-all group"
                                >
                                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                        <Phone size={18} />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Telefone</p>
                                        <p className="text-sm font-black text-gray-900">{contactInfo.phone}</p>
                                    </div>
                                </a>

                                <a
                                    href={`mailto:${contactInfo.email}`}
                                    className="w-full flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 hover:border-blue-500 transition-all group"
                                >
                                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                        <Mail size={18} />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Email</p>
                                        <p className="text-sm font-black text-gray-900">{contactInfo.email}</p>
                                    </div>
                                </a>

                                <a
                                    href={contactInfo.whatsapp}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full flex items-center gap-4 bg-emerald-600 p-5 rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 group active:scale-95"
                                >
                                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white">
                                        <MessageSquare size={20} />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[9px] font-black text-white/70 uppercase tracking-widest">Active Agora</p>
                                        <p className="text-sm font-black text-white">Chamar no WhatsApp</p>
                                    </div>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                        <Globe size={20} />
                    </div>
                    <div>
                        <h4 className="font-black text-gray-900 text-xs uppercase tracking-widest">Documentação</h4>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Manuais & Tutoriais</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                        <Shield size={20} />
                    </div>
                    <div>
                        <h4 className="font-black text-gray-900 text-xs uppercase tracking-widest">Segurança</h4>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Proteção de Dados</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                        <MessageSquare size={20} />
                    </div>
                    <div>
                        <h4 className="font-black text-gray-900 text-xs uppercase tracking-widest">Feedback</h4>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Melhoria Contínua</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
