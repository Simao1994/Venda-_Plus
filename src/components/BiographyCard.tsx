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
    if (!company?.bio_nome) return null;

    const competencias = Array.isArray(company.bio_competencias)
        ? company.bio_competencias
        : (typeof company.bio_competencias === 'string'
            ? (company.bio_competencias as string).split(',').map(s => s.trim())
            : []);

    return (
        <div className="glass-panel rounded-[40px] shadow-2xl border border-white/10 relative group flex flex-col overflow-hidden">

            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gold-primary/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-gold-primary/20 transition-all duration-700" />

            {/* ── Top: Photo + Name ── */}
            <div className="flex flex-col items-center text-center pt-10 px-8 pb-8 border-b border-white/5">

                {/* Photo */}
                <div className="relative mb-6">
                    <div className="w-28 h-28 rounded-[24px] p-1 bg-gradient-to-br from-gold-primary/50 to-white/5 shadow-2xl">
                        <div className="w-full h-full rounded-[20px] overflow-hidden bg-bg-deep border border-black/40">
                            {company.bio_foto ? (
                                <img
                                    src={company.bio_foto}
                                    alt={company.bio_nome}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-white/5">
                                    <User size={44} className="text-white/20" />
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Award badge */}
                    <div className="absolute -bottom-3 -right-3 w-10 h-10 bg-gold-gradient rounded-xl flex items-center justify-center text-bg-deep shadow-lg border border-gold-primary/50">
                        <Award size={16} />
                    </div>
                </div>

                {/* Name */}
                <h2 className="text-2xl font-black text-white italic tracking-tight drop-shadow-md leading-tight mb-1">
                    {company.bio_nome}
                </h2>

                {/* Profession */}
                {company.bio_profissao && (
                    <p className="text-gold-primary font-black uppercase tracking-[0.25em] text-[10px]">
                        {company.bio_profissao}
                    </p>
                )}
            </div>

            {/* ── Body: Resumo + Info ── */}
            <div className="flex flex-col gap-5 px-8 py-6 flex-1">

                {/* Resumo */}
                {company.bio_resumo && (
                    <p className="text-white/55 font-medium leading-relaxed text-sm text-justify border-l-2 border-gold-primary/40 pl-4">
                        {company.bio_resumo}
                    </p>
                )}

                {/* Info tags */}
                {(company.bio_formacao || company.bio_emails || company.bio_contactos) && (
                    <div className="flex flex-col gap-2">
                        {company.bio_formacao && (
                            <div className="flex items-center gap-3 bg-white/[0.04] border border-white/5 rounded-2xl px-4 py-2.5">
                                <GraduationCap size={15} className="text-gold-primary shrink-0" />
                                <span className="text-[11px] font-bold uppercase tracking-wider text-white/60 truncate">
                                    {company.bio_formacao}
                                </span>
                            </div>
                        )}
                        {company.bio_emails && (
                            <div className="flex items-center gap-3 bg-white/[0.04] border border-white/5 rounded-2xl px-4 py-2.5">
                                <Mail size={15} className="text-gold-primary shrink-0" />
                                <span className="text-[11px] font-bold tracking-wider text-white/60 truncate">
                                    {company.bio_emails}
                                </span>
                            </div>
                        )}
                        {company.bio_contactos && (
                            <div className="flex items-center gap-3 bg-white/[0.04] border border-white/5 rounded-2xl px-4 py-2.5">
                                <Phone size={15} className="text-gold-primary shrink-0" />
                                <span className="text-[11px] font-bold tracking-wider text-white/60 truncate">
                                    {company.bio_contactos}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Skills */}
                {competencias.length > 0 && (
                    <div className="pt-3 border-t border-white/5">
                        <span className="flex items-center gap-1.5 text-[9px] font-black uppercase text-white/25 tracking-widest mb-3">
                            <Briefcase size={11} /> Competências
                        </span>
                        <div className="flex flex-wrap gap-2">
                            {competencias.map((comp, idx) => comp && (
                                <span
                                    key={idx}
                                    className="px-3 py-1 bg-white/5 border border-white/10 text-white/70 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gold-primary/20 hover:text-gold-primary transition-colors cursor-default"
                                >
                                    {comp}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
