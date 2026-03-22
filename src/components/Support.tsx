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
    <div className="p-8 max-w-5xl mx-auto space-y-8 text-white min-h-screen bg-bg-deep/50 backdrop-blur-sm rounded-[40px]">
      <div className="glass-panel rounded-[40px] p-12 shadow-2xl relative overflow-hidden border border-white/5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold-primary/10 rounded-full -mr-32 -mt-32 blur-3xl opacity-30" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-zinc-900 rounded-full -ml-32 -mb-32 blur-3xl opacity-30" />

        <div className="relative z-10 flex flex-col md:flex-row gap-12 items-center">
          <div className="flex-1 space-y-8 text-center md:text-left">
            <div>
              <span className="px-5 py-2 bg-white/5 text-gold-primary rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-white/10 shadow-inner">
                Centro de Suporte <span className="text-gold-gradient italic">High-End</span>
              </span>
              <h1 className="text-5xl font-black text-white mt-6 tracking-tighter leading-tight">
                Suporte Técnico <br />
                <span className="text-gold-gradient italic">Especializado</span>
              </h1>
              <p className="text-white/40 mt-6 font-bold text-lg max-w-xl leading-relaxed">
                Estamos aqui para garantir que o seu ecossistema <span className="text-white">Venda Plus</span> funcione sem interrupções. Atendimento direto com engenharia de sistemas.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-8 bg-white/5 rounded-[32px] border border-white/5 hover:border-gold-primary/30 transition-all group shadow-inner">
                <div className="w-14 h-14 bg-gold-primary/10 rounded-2xl flex items-center justify-center text-gold-primary mb-5 shadow-inner group-hover:scale-110 transition-transform">
                  <Shield size={28} />
                </div>
                <h3 className="font-black text-white text-sm uppercase tracking-[0.2em]">Garantia Nuclear</h3>
                <p className="text-[10px] text-white/30 mt-2 font-black uppercase tracking-widest leading-none">Monitorização 24/7 dos serviços core.</p>
              </div>
              <div className="p-8 bg-white/5 rounded-[32px] border border-white/5 hover:border-gold-primary/30 transition-all group shadow-inner">
                <div className="w-14 h-14 bg-gold-primary/10 rounded-2xl flex items-center justify-center text-gold-primary mb-5 shadow-inner group-hover:scale-110 transition-transform">
                  <Clock size={28} />
                </div>
                <h3 className="font-black text-white text-sm uppercase tracking-[0.2em]">SLA Prioritário</h3>
                <p className="text-[10px] text-white/30 mt-2 font-black uppercase tracking-widest leading-none">Resposta em tempo real via canal directo.</p>
              </div>
            </div>
          </div>

          <div className="w-full md:w-[420px] bg-white/5 backdrop-blur-2xl rounded-[40px] p-10 border border-white/10 shadow-3xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gold-primary/30 to-transparent" />
            <div className="flex flex-col items-center text-center space-y-8">
              <div className="w-28 h-28 bg-white/5 rounded-full p-1.5 shadow-2xl relative">
                <div className="w-full h-full bg-gold-gradient rounded-full flex items-center justify-center text-bg-deep border-4 border-bg-deep">
                  <span className="text-4xl font-black italic">SP</span>
                </div>
                <div className="absolute bottom-2 right-2 w-7 h-7 bg-emerald-500 border-4 border-bg-deep rounded-full animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
              </div>

              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">{contactInfo.name}</h2>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gold-primary/60 mt-2 italic">Principal Systems Architect</p>
              </div>

              <div className="w-full space-y-4">
                <a
                  href={`tel:${contactInfo.phone}`}
                  className="w-full flex items-center gap-5 bg-white/5 p-5 rounded-[24px] border border-white/5 hover:border-gold-primary/30 hover:bg-white/[0.08] transition-all group shadow-inner"
                >
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-gold-primary group-hover:scale-110 transition-all shadow-inner">
                    <Phone size={20} />
                  </div>
                  <div className="text-left">
                    <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Voice Terminal</p>
                    <p className="text-sm font-black text-white tracking-widest">{contactInfo.phone}</p>
                  </div>
                </a>

                <a
                  href={`mailto:${contactInfo.email}`}
                  className="w-full flex items-center gap-5 bg-white/5 p-5 rounded-[24px] border border-white/5 hover:border-gold-primary/30 hover:bg-white/[0.08] transition-all group shadow-inner"
                >
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-gold-primary group-hover:scale-110 transition-all shadow-inner">
                    <Mail size={20} />
                  </div>
                  <div className="text-left">
                    <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Digital Dispatch</p>
                    <p className="text-sm font-black text-white lowercase tracking-tight">{contactInfo.email}</p>
                  </div>
                </a>

                <a
                  href={contactInfo.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center gap-5 bg-gold-gradient p-6 rounded-[24px] hover:scale-[1.02] active:scale-95 transition-all shadow-[0_20px_40px_rgba(212,175,55,0.2)] group"
                >
                  <div className="w-12 h-12 bg-bg-deep/20 rounded-2xl flex items-center justify-center text-bg-deep">
                    <MessageSquare size={22} />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-black text-bg-deep/40 uppercase tracking-[0.2em]">Priority Link</p>
                    <p className="text-sm font-black text-bg-deep uppercase tracking-widest">WhatsApp Direct</p>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-10">
        {[
          { icon: <Globe size={22} />, title: "Documentação", sub: "Core Knowledge" },
          { icon: <Shield size={22} />, title: "Segurança", sub: "Data Protection" },
          { icon: <MessageSquare size={22} />, title: "Feedback", sub: "System Evolution" }
        ].map((item, i) => (
          <div key={i} className="glass-panel p-8 rounded-[32px] border border-white/5 flex items-center gap-6 hover:border-gold-primary/30 transition-all group shadow-2xl">
            <div className="w-16 h-16 bg-white/5 rounded-[20px] flex items-center justify-center text-gold-primary group-hover:scale-110 transition-all shadow-inner">
              {item.icon}
            </div>
            <div>
              <h4 className="font-black text-white text-[11px] uppercase tracking-[0.2em]">{item.title}</h4>
              <p className="text-[10px] text-white/20 font-black uppercase tracking-widest mt-1 italic">{item.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
