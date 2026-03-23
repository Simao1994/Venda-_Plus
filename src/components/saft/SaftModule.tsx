import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { SaftService } from './SaftService';
import { FileDown, Calendar, AlertCircle, CheckCircle, Clock } from 'lucide-react';

export default function SaftModule() {
    const { user } = useAuth();
    const [inicio, setInicio] = useState(() => {
        const data = new Date();
        data.setDate(1);
        return data.toISOString().split('T')[0];
    });
    const [fim, setFim] = useState(() => new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);
    const [erros, setErros] = useState<string[]>([]);
    const [historico, setHistorico] = useState<any[]>([]);
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        if (user?.company_id) {
            fetchHistorico();
        }
    }, [user]);

    const fetchHistorico = async () => {
        try {
            const { data, error } = await supabase
                .from('saft_exports')
                .select('*')
                .eq('empresa_id', user?.company_id)
                .order('data_exportacao', { ascending: false });

            if (!error && data) {
                setHistorico(data);
            }
        } catch (err) {
            console.error("Erro a obter histórico SAF-T", err);
        }
    };

    const handleExport = async () => {
        if (!user?.company_id) return;
        setLoading(true);
        setErros([]);
        setSuccessMsg('');

        try {
            const res = await SaftService.exportar(user.company_id, inicio, fim);

            if (!res.sucesso) {
                setErros(res.erros || ["Erro não identificado"]);
            } else {
                setSuccessMsg('Ficheiro SAF-T gerado com sucesso!');
                fetchHistorico();

                // Simular download seguro
                const blob = new Blob([res.xml || ''], { type: 'application/xml;charset=utf-8' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.setAttribute('download', `SAFT_${user.company_id}_${inicio}_${fim}.xml`);
                document.body.appendChild(a);
                a.click();
                setTimeout(() => {
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                }, 100);
            }
        } catch (err: any) {
            setErros([err.message || 'Erro crítico durante a exportação.']);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 space-y-10 relative h-full overflow-y-auto custom-scrollbar">
            <div className="absolute top-[10%] left-[20%] w-[30%] h-[30%] bg-gold-primary/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tighter italic uppercase">
                        Módulo <span className="text-gold-gradient">SAF-T (AOA) XML</span>

                    </h1>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mt-2">
                        Validação Fiscal & Exportação
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
                <div className="glass-panel p-8 rounded-[32px] border border-white/5 lg:col-span-1 space-y-6">
                    <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-3">
                        <Calendar className="text-gold-primary" size={20} />
                        Período de Exportação
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase text-gold-primary/60 mb-2">Data Inicial</label>
                            <input
                                type="date"
                                value={inicio}
                                onChange={e => setInicio(e.target.value)}
                                className="w-full px-5 py-3 rounded-2xl bg-white/5 border border-white/10 focus:border-gold-primary focus:ring-2 focus:ring-gold-primary/20 transition-all text-white outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase text-gold-primary/60 mb-2">Data Final</label>
                            <input
                                type="date"
                                value={fim}
                                onChange={e => setFim(e.target.value)}
                                className="w-full px-5 py-3 rounded-2xl bg-white/5 border border-white/10 focus:border-gold-primary focus:ring-2 focus:ring-gold-primary/20 transition-all text-white outline-none"
                            />
                        </div>

                        <button
                            onClick={handleExport}
                            disabled={loading}
                            className="w-full mt-4 py-4 rounded-xl bg-gradient-to-r from-gold-primary to-gold-secondary text-bg-deep font-black uppercase tracking-widest hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-bg-deep border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <FileDown size={18} />
                                    Gerar SAF-T (AOA) XML

                                </>
                            )}
                        </button>
                    </div>

                    {successMsg && (
                        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-start gap-3 mt-4">
                            <CheckCircle className="text-green-400 shrink-0" size={18} />
                            <p className="text-[10px] font-black uppercase text-green-400">{successMsg}</p>
                        </div>
                    )}

                    {erros.length > 0 && (
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 mt-4">
                            <AlertCircle className="text-red-400 shrink-0" size={18} />
                            <div className="space-y-2 w-full">
                                <p className="text-[10px] font-black uppercase text-red-400 tracking-wider">Erros de Validação:</p>
                                <ul className="text-[10px] text-red-300/80 font-bold list-disc pl-4 space-y-1">
                                    {erros.map((e, idx) => (
                                        <li key={idx}>{e}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}
                </div>

                <div className="glass-panel p-8 rounded-[32px] border border-white/5 lg:col-span-2 flex flex-col h-full min-h-[400px]">
                    <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-3 mb-6 shrink-0">
                        <Clock className="text-gold-primary" size={20} />
                        Histórico de Exportações
                    </h3>

                    <div className="flex-1 overflow-y-auto custom-scrollbar -mr-4 pr-4 space-y-3">
                        {historico.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-white/20">
                                <FileDown size={48} className="mb-4 opacity-20" />
                                <p className="text-[10px] uppercase font-black tracking-[0.2em]">Nenhuma exportação registada</p>
                            </div>
                        ) : (
                            historico.map((row, idx) => (
                                <div key={idx} className="bg-white/5 p-5 rounded-2xl flex items-center justify-between border border-white/5 hover:border-gold-primary/20 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-gold-primary/10 flex items-center justify-center text-gold-primary border border-gold-primary/20">
                                            <FileDown size={18} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-black text-white uppercase tracking-tight">SAF-T</span>
                                                <span className="text-[8px] px-2 py-0.5 rounded-full bg-white/10 text-white/60 font-black uppercase tracking-widest">{row.status}</span>
                                            </div>
                                            <p className="text-[10px] font-black uppercase text-white/40 tracking-wider">
                                                {row.periodo_inicio} até {row.periodo_fim}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-sm font-black text-gold-primary italic">
                                            {(Number(row.total_valor) || 0).toLocaleString()} <span className="text-[8px] uppercase not-italic opacity-40">AOA</span>
                                        </p>
                                        <p className="text-[9px] font-black uppercase text-white/40 tracking-widest">
                                            {row.total_faturas} faturas
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
