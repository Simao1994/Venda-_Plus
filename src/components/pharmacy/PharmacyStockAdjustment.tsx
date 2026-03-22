import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
    AlertCircle, ArrowDownCircle, ArrowUpCircle,
    Boxes, Save, Search, History, Trash2, Calendar
} from 'lucide-react';

export default function PharmacyStockAdjustment() {
    const { token } = useAuth();
    const [lotes, setLotes] = useState<any[]>([]);
    const [movements, setMovements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        lote_id: '',
        tipo: 'saida',
        quantidade: '',
        motivo: 'Quebra'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [lotesRes, movRes] = await Promise.all([
                fetch('/api/farmacia/lotes', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/farmacia/movimentos', { headers: { Authorization: `Bearer ${token}` } })
            ]);

            if (lotesRes.ok) {
                const data = await lotesRes.json();
                setLotes(Array.isArray(data) ? data : []);
            } else {
                console.error('Failed to fetch lotes');
                setLotes([]);
            }

            if (movRes.ok) {
                const data = await movRes.json();
                setMovements(Array.isArray(data) ? data : []);
            } else {
                console.error('Failed to fetch movements');
                setMovements([]);
            }
        } catch (err) {
            console.error('Error fetching pharmacy data:', err);
            setLotes([]);
            setMovements([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const lote = lotes.find(l => l.id === parseInt(formData.lote_id));
        if (!lote) return;

        const res = await fetch('/api/farmacia/lotes/' + lote.id + '/ajustar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                ...formData,
                medicamento_id: lote.medicamento_id,
                quantidade: parseFloat(formData.quantidade)
            })
        });

        if (res.ok) {
            setFormData({ lote_id: '', tipo: 'saida', quantidade: '', motivo: 'Quebra' });
            fetchData();
            alert('Ajuste realizado com sucesso!');
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto relative z-10 animate-in fade-in duration-500">
            <div className="flex justify-between items-start md:items-center gap-6 mb-10">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
                        Ajustes de <span className="text-gold-gradient">Stock</span>
                    </h1>
                    <p className="text-white/40 font-black text-[10px] uppercase tracking-[0.3em] mt-2 italic">Correções de inventário e controlo de quebras</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Column */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="glass-panel p-8 rounded-[40px] border border-white/5 shadow-2xl">
                        <h2 className="text-sm font-black text-white uppercase tracking-widest mb-8 flex items-center gap-4 italic">
                            <div className="w-2 h-2 rounded-full bg-gold-primary shadow-[0_0_10px_#D4AF37]" />
                            Novo Ajuste
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="glass-panel p-4 rounded-2xl border border-white/5 focus-within:border-gold-primary/30 transition-all">
                                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-2">Lote Alvo</label>
                                <select
                                    required
                                    className="w-full bg-transparent border-none outline-none font-black text-white uppercase tracking-tight appearance-none cursor-pointer"
                                    value={formData.lote_id}
                                    onChange={e => setFormData({ ...formData, lote_id: e.target.value })}
                                >
                                    <option value="" className="bg-bg-deep">Selecione o Lote...</option>
                                    {Array.isArray(lotes) && lotes.map(l => (
                                        <option key={l.id} value={l.id} className="bg-bg-deep">
                                            {l.nome_medicamento} (Lote: {l.numero_lote}) - Val: {l.data_validade ? new Date(l.data_validade).toLocaleDateString() : 'Sem data'}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="glass-panel p-4 rounded-2xl border border-white/5 focus-within:border-gold-primary/30 transition-all">
                                    <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-2">Operação</label>
                                    <select
                                        className="w-full bg-transparent border-none outline-none font-black text-white uppercase tracking-tight appearance-none cursor-pointer"
                                        value={formData.tipo}
                                        onChange={e => setFormData({ ...formData, tipo: e.target.value as any, motivo: e.target.value === 'entrada' ? 'Ajuste Positivo' : 'Quebra' })}
                                    >
                                        <option value="entrada" className="bg-bg-deep">Entrada (+)</option>
                                        <option value="saida" className="bg-bg-deep">Saída (-)</option>
                                    </select>
                                </div>
                                <div className="glass-panel p-4 rounded-2xl border border-white/5 focus-within:border-gold-primary/30 transition-all">
                                    <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-2">Quantidade</label>
                                    <input
                                        required
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        className="w-full bg-transparent border-none outline-none font-black text-white tabular-nums tracking-tighter placeholder:text-white/10"
                                        placeholder="0.00"
                                        value={formData.quantidade}
                                        onChange={e => setFormData({ ...formData, quantidade: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="glass-panel p-4 rounded-2xl border border-white/5 focus-within:border-gold-primary/30 transition-all">
                                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-2">Motivo Justificativo</label>
                                <select
                                    className="w-full bg-transparent border-none outline-none font-black text-white uppercase tracking-tight appearance-none cursor-pointer"
                                    value={formData.motivo}
                                    onChange={e => setFormData({ ...formData, motivo: e.target.value })}
                                >
                                    {formData.tipo === 'entrada' ? (
                                        <>
                                            <option value="Ajuste Positivo" className="bg-bg-deep">Erro de Contagem / Sobra</option>
                                            <option value="Devolução" className="bg-bg-deep">Devolução de Lote</option>
                                            <option value="Outros" className="bg-bg-deep">Outros</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value="Quebra" className="bg-bg-deep">Quebra / Dano Físico</option>
                                            <option value="Vencimento" className="bg-bg-deep">Produto Expirado (Vencido)</option>
                                            <option value="Amostra" className="bg-bg-deep">Amostra Grátis / Uso Interno</option>
                                            <option value="Roubo" className="bg-bg-deep">Roubo ou Extravio</option>
                                            <option value="Erro de Lote" className="bg-bg-deep">Erro de Registo de Lote</option>
                                        </>
                                    )}
                                </select>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-5 bg-gradient-to-r from-gold-primary to-gold-secondary text-bg-deep rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] active:scale-95 transition-all shadow-2xl flex items-center justify-center gap-3 mt-4"
                            >
                                <Save size={18} />
                                Registar Ajuste
                            </button>
                        </form>
                    </div>

                    <div className="glass-panel p-8 rounded-[40px] border border-gold-primary/20 bg-gold-primary/[0.02] shadow-2xl">
                        <div className="flex items-center gap-4 mb-4">
                            <AlertCircle className="text-gold-primary shadow-[0_0_10px_#D4AF37]" />
                            <h3 className="font-black text-white text-xs uppercase tracking-widest italic">Boas Práticas AGT</h3>
                        </div>
                        <p className="text-[10px] font-black text-white/40 leading-relaxed italic uppercase tracking-wider">
                            Todo ajuste de stock manual deve ser devidamente justificado.
                            Em caso de vencimento, o produto deve ser abatido do stock principal imediatamente para evitar vendas ilegais.
                        </p>
                    </div>
                </div>

                {/* History Column */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="glass-panel rounded-[40px] border border-white/5 shadow-3xl overflow-hidden">
                        <div className="px-8 py-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <History size={18} className="text-gold-primary/40" />
                                <h2 className="text-xs font-black text-white uppercase tracking-widest italic flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-gold-primary shadow-[0_0_8px_#D4AF37]" />
                                    Histórico de Ajustes
                                </h2>
                            </div>
                            <div className="relative group">
                                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-gold-primary transition-colors" />
                                <input
                                    type="text"
                                    placeholder="FILTRAR..."
                                    className="pl-10 pr-4 py-2 bg-white/5 border border-white/5 rounded-xl text-[10px] font-black text-white uppercase tracking-widest focus:border-gold-primary/30 outline-none w-48 transition-all"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left">
                                <thead className="bg-white/[0.03] text-[9px] font-black text-white/20 uppercase tracking-[0.2em] border-b border-white/5">
                                    <tr>
                                        <th className="px-8 py-5">Time Vector</th>
                                        <th className="px-8 py-5">Medicamento / Lote</th>
                                        <th className="px-8 py-5 text-center">Protocolo</th>
                                        <th className="px-8 py-5 text-center">Magnitude</th>
                                        <th className="px-8 py-5">Reasoning</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {Array.isArray(movements) && movements.map(m => (
                                        <tr key={m.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-8 py-6 text-[10px] font-black text-white/20 uppercase tracking-widest">
                                                {m.data_movimento ? new Date(m.data_movimento).toLocaleString('pt-AO') : '---'}
                                            </td>
                                            <td className="px-8 py-6">
                                                <p className="text-xs font-black text-white uppercase tracking-tight group-hover:text-gold-primary transition-colors">{m.nome_medicamento || 'Medicamento'}</p>
                                                <p className="text-[9px] text-white/20 font-black uppercase tracking-widest mt-1 italic">#{m.lote_numero || 'S/L'}</p>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                {m.tipo_movimento?.includes('positivo') || m.tipo === 'entrada' ? (
                                                    <span className="px-3 py-1.5 bg-gold-primary/10 text-gold-primary rounded-full text-[9px] font-black uppercase tracking-widest border border-gold-primary/20 shadow-[0_0_15px_rgba(212,175,55,0.1)] inline-flex items-center gap-2">
                                                        <ArrowUpCircle size={12} />
                                                        Entrada
                                                    </span>
                                                ) : (
                                                    <span className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)] inline-flex items-center gap-2">
                                                        <ArrowDownCircle size={12} />
                                                        Saída
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-8 py-6 text-center font-black text-white tabular-nums italic text-sm">
                                                {m.quantidade}
                                            </td>
                                            <td className="px-8 py-6 text-[10px] font-black text-white/40 uppercase tracking-widest italic">
                                                {m.motivo || m.tipo_movimento}
                                            </td>
                                        </tr>
                                    ))}
                                    {movements.length === 0 && !loading && (
                                        <tr>
                                            <td colSpan={5} className="py-32 text-center">
                                                <div className="flex flex-col items-center gap-4 opacity-10">
                                                    <Boxes size={48} />
                                                    <p className="text-[10px] font-black uppercase tracking-[0.4em]">Nenhum registo histórico</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
