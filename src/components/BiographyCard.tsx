import React from 'react';
import { User, GraduationCap, Briefcase, Mail, Phone, Award } from 'lucide-react';

interface BiographyCardProps {
    key?: React.Key;
    company: {
        bio_nome?: string;
        bio_foto?: string;
        bio_formacao?: string;
        bio_profissao?: string;
        bio_competencias?: string[];
        bio_contactos?: string;
        bio_emails?: string;
        bio_resumo?: string;
    };
}

export default function BiographyCard({ company }: BiographyCardProps) {
    // Se não houver nome configurado, não mostramos o cartão para manter a home limpa
    if (!company?.bio_nome) return null;

    const competencias = Array.isArray(company.bio_competencias)
        ? company.bio_competencias
        : (typeof company.bio_competencias === 'string' ? (company.bio_competencias as string).split(',').map(s => s.trim()) : []);

    return (
        <div className="glass-panel p-8 md:p-10 rounded-[40px] shadow-2xl border border-white/10 relative overflow-hidden group">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gold-primary/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-gold-primary/20 transition-all duration-700"></div>

            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-start">
                {/* Photo Section */}
                <div className="shrink-0 relative">
                    <div className="w-40 h-40 md:w-48 md:h-48 rounded-[30px] p-1.5 bg-gradient-to-br from-gold-primary/40 to-white/5 shadow-2xl skew-y-3 group-hover:skew-y-0 transition-transform duration-500">
                        <div className="w-full h-full rounded-[26px] overflow-hidden bg-bg-deep border border-black/50 relative">
                            {company.bio_foto ? (
                                <img
                                    src={company.bio_foto}
                                    alt={company.bio_nome}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-white/5">
                                    <User size={64} className="text-white/20" />
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Decorative Badge */}
                    <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-gold-gradient rounded-xl flex items-center justify-center text-bg-deep shadow-lg -skew-y-6 group-hover:skew-y-0 transition-transform duration-500 border border-gold-primary/50">
                        <Award size={20} className="drop-shadow-sm" />
                    </div>
                </div>

                {/* Content Section */}
                <div className="flex-1 space-y-6 text-center md:text-left">

                    <div className="space-y-2">
                        <h2 className="text-3xl md:text-4xl font-black text-white italic tracking-tight drop-shadow-md">
                            {company.bio_nome}
                        </h2>
                        {company.bio_profissao && (
                            <p className="text-gold-primary font-black uppercase tracking-[0.3em] text-[11px]">
                                {company.bio_profissao}
                            </p>
                        )}
                    </div>

                    {company.bio_resumo && (
                        <p className="text-white/60 font-medium leading-relaxed max-w-2xl text-sm italic border-l-2 border-gold-primary/30 pl-4">
                            "{company.bio_resumo}"
                        </p>
                    )}

                    {/* Education & Contacts */}
                    <div className="flex flex-wrap gap-6 justify-center md:justify-start pt-2">
                        {company.bio_formacao && (
                            <div className="flex items-center gap-2 text-white/50 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
                                <GraduationCap size={16} className="text-gold-primary" />
                                <span className="text-[11px] font-bold uppercase tracking-wider">{company.bio_formacao}</span>
                            </div>
                        )}
                        {company.bio_emails && (
                            <div className="flex items-center gap-2 text-white/50 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
                                <Mail size={16} className="text-gold-primary" />
                                <span className="text-[11px] font-bold tracking-wider">{company.bio_emails}</span>
                            </div>
                        )}
                        {company.bio_contactos && (
                            <div className="flex items-center gap-2 text-white/50 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
                                <Phone size={16} className="text-gold-primary" />
                                <span className="text-[11px] font-bold tracking-wider">{company.bio_contactos}</span>
                            </div>
                        )}
                    </div>

                    {/* Skills */}
                    {competencias.length > 0 && (
                        <div className="pt-4 border-t border-white/10">
                            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                                <span className="flex items-center gap-1 text-[10px] font-black uppercase text-white/30 mr-2 tracking-widest">
                                    <Briefcase size={12} /> Skills:
                                </span>
                                {competencias.map((comp, idx) => comp && (
                                    <span
                                        key={idx}
                                        className="px-3 py-1 bg-white/5 border border-white/10 text-white/80 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gold-primary/20 hover:text-gold-primary transition-colors cursor-default"
                                    >
                                        {comp}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
