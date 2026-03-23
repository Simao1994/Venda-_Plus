// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
    IdCard, Printer, X, RefreshCw,
    Search, ShieldCheck, QrCode, User as UserIcon
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Logo from '../Logo';

export default function PassesTab() {
    const { user } = useAuth();
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [printingPass, setPrintingPass] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [companyProfile, setCompanyProfile] = useState(null);

    useEffect(() => {
        fetchEmployees();
        fetchCompanyProfile();
    }, []);

    const fetchCompanyProfile = async () => {
        try {
            const { data, error } = await supabase
                .from('company_profiles')
                .select('logo, name')
                .eq('id', user?.company_id)
                .maybeSingle();

            if (error) throw error;
            setCompanyProfile(data);
        } catch (error) {
            console.error('Erro ao buscar perfil da empresa:', error);
        }
    };

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('hr_employees')
                .select('*')
                .eq('company_id', user?.company_id)
                .eq('status', 'active')
                .order('name');

            if (error) throw error;
            setEmployees(data || []);
        } catch (error) {
            console.error('Erro ao buscar funcionários:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredEmployees = employees.filter(e =>
        e.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.position?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div className="flex justify-center items-center py-20">
            <RefreshCw className="animate-spin text-yellow-500" size={28} />
        </div>
    );

    return (
        <div className="p-6 space-y-6">
            {/* Header Info */}
            <div className="bg-zinc-900 p-10 rounded-[3rem] shadow-2xl text-white flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
                <IdCard className="absolute -left-6 -bottom-6 opacity-10 text-yellow-500" size={200} />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 bg-yellow-500 text-zinc-900 text-[9px] font-black uppercase rounded-full">Sistema Ativo</span>
                        <span className="text-zinc-500 text-[9px] font-black uppercase tracking-widest flex items-center gap-1">PVC PrintReady</span>
                    </div>
                    <h3 className="text-3xl font-black uppercase tracking-tighter">Emissão de <span className="text-yellow-500">Passes PVC</span></h3>
                    <p className="text-zinc-400 text-sm font-medium">Cartões de Identificação Corporativa de Alta Fidelidade</p>
                </div>
                <div className="flex w-full md:w-80 relative z-10">
                    <input
                        type="text"
                        placeholder="Pesquisar funcionário..."
                        className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 px-12 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 backdrop-blur-md"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredEmployees.map(emp => (
                    <div key={emp.id} className="glass-panel p-6 rounded-[2.5rem] border border-white/5 flex flex-col items-center text-center hover:border-indigo-500/20 transition-all group">
                        <div className="relative mb-4">
                            <div className="w-24 h-24 rounded-[2rem] bg-white/5 flex items-center justify-center overflow-hidden border-2 border-white/10 group-hover:border-indigo-500/30 transition-all">
                                {emp.photo_url ? (
                                    <img src={emp.photo_url} className="w-full h-full object-cover" />
                                ) : (
                                    <UserIcon className="text-white/20" size={40} />
                                )}
                            </div>
                            <div className="absolute -bottom-1 -right-1 bg-indigo-500 text-white p-1.5 rounded-xl shadow-lg">
                                <ShieldCheck size={14} />
                            </div>
                        </div>
                        <h4 className="font-black text-white uppercase text-sm mb-1">{emp.name}</h4>
                        <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-6">{emp.position}</p>

                        <button
                            onClick={() => setPrintingPass(emp)}
                            className="w-full py-4 bg-indigo-500/20 text-indigo-400 rounded-2xl font-black uppercase text-[10px] border border-indigo-500/30 hover:bg-indigo-500/30 transition-all flex items-center justify-center gap-2"
                        >
                            <Printer size={16} /> Emitir Passe
                        </button>
                    </div>
                ))}

                {filteredEmployees.length === 0 && (
                    <div className="col-span-full py-20 text-center glass-panel rounded-[3rem] border border-dashed border-white/10">
                        <Search className="mx-auto text-white/10 mb-4" size={48} />
                        <p className="text-white/30 font-bold italic">Nenhum funcionário encontrado.</p>
                    </div>
                )}
            </div>

            {/* MODAL PASSE PVC */}
            {printingPass && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center bg-zinc-950/90 backdrop-blur-md p-4 animate-in fade-in py-10 overflow-y-auto">
                    <div className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 my-auto">
                        <div className="p-8 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                            <h2 className="text-xl font-black text-zinc-900 uppercase flex items-center gap-2">
                                <IdCard className="text-yellow-500" size={24} /> Emissão PVC Corporativo
                            </h2>
                            <button onClick={() => setPrintingPass(null)} className="p-2 text-zinc-400 hover:bg-zinc-200 rounded-full transition-all"><X size={24} /></button>
                        </div>

                        <div className="p-10 flex flex-col items-center gap-8">
                            {/* Card Design - Based on original logic */}
                            <div id="pvc-card" className="w-[320px] h-[520px] bg-zinc-900 rounded-[3rem] shadow-[0_25px_60px_rgba(0,0,0,0.4)] overflow-hidden relative flex flex-col items-center p-0 print:shadow-none border border-white/5">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full -translate-y-32 translate-x-32"></div>
                                <div className="absolute top-0 left-0 w-48 h-48 bg-sky-600/10 rounded-full -translate-y-24 -translate-x-24"></div>

                                <div className="z-10 mt-10 mb-8 flex flex-col items-center text-white">
                                    <div className="mb-2">
                                        {companyProfile?.logo ? (
                                            <img src={companyProfile.logo} className="h-12 object-contain" />
                                        ) : (
                                            <div className="scale-75 opacity-90 filter brightness-0 invert">
                                                <Logo />
                                            </div>
                                        )}
                                    </div>
                                    {companyProfile?.name && (
                                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{companyProfile.name}</p>
                                    )}
                                    <div className="w-8 h-1 bg-yellow-500 rounded-full mt-4"></div>
                                </div>

                                <div className="relative mb-8">
                                    {printingPass.photo_url ? (
                                        <img src={printingPass.photo_url} className="w-32 h-32 rounded-[2.5rem] object-cover border-4 border-zinc-800 shadow-2xl relative z-10" />
                                    ) : (
                                        <div className="w-32 h-32 rounded-[2.5rem] bg-zinc-800 flex items-center justify-center relative z-10 text-zinc-600 border-4 border-zinc-800 shadow-2xl">
                                            <UserIcon size={64} />
                                        </div>
                                    )}
                                    <div className="absolute -inset-2 bg-gradient-to-tr from-sky-600/20 to-yellow-500/20 rounded-[2.8rem] blur-xl opacity-50"></div>
                                </div>

                                <div className="flex-1 w-full flex flex-col items-center px-8 text-center text-white">
                                    <h2 className="text-2xl font-black leading-tight uppercase tracking-tighter mb-1">{printingPass.name}</h2>
                                    <p className="text-[11px] font-black text-yellow-500 uppercase tracking-[0.4em] mb-8">{printingPass.position}</p>

                                    <div className="grid grid-cols-2 gap-3 w-full mb-10">
                                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                                            <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">ID Registo</p>
                                            <p className="text-[11px] font-black text-white font-mono tracking-tighter">#{String(printingPass.id || '').substring(0, 8).toUpperCase() || '---'}</p>
                                        </div>
                                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                                            <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Válido Até</p>
                                            <p className="text-[11px] font-black text-white">
                                                {(() => {
                                                    const d = new Date();
                                                    d.setFullYear(d.getFullYear() + 2);
                                                    return d.toLocaleDateString('pt-PT');
                                                })()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-auto mb-10 bg-white p-2.5 rounded-[1.2rem] shadow-2xl">
                                        <QrCode size={40} className="text-zinc-900" />
                                    </div>
                                </div>

                                <div className="absolute bottom-0 left-0 w-full flex h-1.5">
                                    <div className="flex-1 bg-sky-600"></div>
                                    <div className="flex-1 bg-yellow-500"></div>
                                    <div className="flex-1 bg-zinc-900 border-t border-white/10"></div>
                                </div>
                            </div>

                            <div className="flex gap-4 w-full">
                                <button
                                    onClick={() => window.print()}
                                    className="flex-1 py-5 bg-zinc-900 text-white rounded-2xl font-black text-xs uppercase hover:bg-yellow-500 hover:text-zinc-900 transition-all flex items-center justify-center gap-3 shadow-xl"
                                >
                                    <Printer size={20} /> Imprimir PVC
                                </button>
                                <button
                                    onClick={() => setPrintingPass(null)}
                                    className="px-8 py-5 bg-zinc-100 text-zinc-400 rounded-2xl font-black text-xs uppercase hover:bg-zinc-200 transition-all"
                                >
                                    Sair
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
