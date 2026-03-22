import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
    ClipboardList, Plus, Search, Play, CheckCircle2,
    AlertCircle, Save, History, Boxes, Activity
} from 'lucide-react';

export default function PharmacyInventory() {
    const { token } = useAuth();
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewModal, setShowNewModal] = useState(false);
    const [activeSession, setActiveSession] = useState<any>(null);
    const [lotes, setLotes] = useState<any[]>([]);
    const [counts, setCounts] = useState<Record<number, string>>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSessions();
        fetchLotes();
    }, []);

    const fetchSessions = async () => {
        try {
            const res = await fetch('/api/farmacia/inventory/sessions', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setSessions(data || []);
        } finally {
            setLoading(false);
        }
    };

    const fetchLotes = async () => {
        const res = await fetch('/api/farmacia/lotes', {
            headers: { Authorization: `Bearer ${token}` }
        });
        setLotes(await res.json());
    };

    const createSession = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/farmacia/inventory/sessions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ notes: 'Inventário Geral de Lotes' })
            });
            if (res.ok) {
                const session = await res.json();
                setActiveSession(session);
                setShowNewModal(false);
                fetchSessions();
            }
        } finally {
            setSaving(false);
        }
    };

    const saveCounts = async () => {
        setSaving(true);
        try {
            await fetch(`/api/farmacia/inventory/sessions/${activeSession.id}/counts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ counts })
            });
            alert('Contagens de lotes salvas!');
        } finally {
            setSaving(false);
        }
    };

    const finalizeSession = async () => {
        if (!window.confirm('Deseja finalizar o inventário da farmácia? O stock dos lotes será atualizado.')) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/farmacia/inventory/sessions/${activeSession.id}/finalize`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setActiveSession(null);
                fetchSessions();
            }
        } finally {
            setSaving(false);
        }
    };

    if (activeSession) {
        return (
            <div className="p-8 max-w-7xl mx-auto relative z-10 animate-in fade-in duration-500">
                <header className="flex justify-between items-start md:items-center gap-6 mb-10">
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
                            Inventário <span className="text-gold-gradient">Ativo</span>
                        </h1>
                        <p className="text-white/40 font-black text-[10px] uppercase tracking-[0.3em] mt-2 italic">Contagem física de medicamentos por lote</p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={saveCounts}
                            disabled={saving}
                            className="px-8 py-4 glass-panel border border-white/10 hover:border-gold-primary/30 text-white/60 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 transition-all"
                        >
                            <Save size={16} className="text-gold-primary" />
                            Guardar Rascunho
                        </button>
                        <button
                            onClick={finalizeSession}
                            disabled={saving}
                            className="px-8 py-4 bg-gradient-to-r from-gold-primary to-gold-secondary text-bg-deep rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] transition-all active:scale-95 shadow-2xl disabled:opacity-50"
                        >
                            <CheckCircle2 size={16} />
                            Finalizar & Reconciliar
                        </button>
                    </div>
                </header>

                <div className="glass-panel rounded-[40px] border border-white/5 overflow-hidden shadow-3xl">
                    <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center gap-4">
                        <div className="w-10 h-10 bg-gold-primary/10 text-gold-primary rounded-xl flex items-center justify-center border border-gold-primary/20">
                            <Boxes size={20} />
                        </div>
                        <h2 className="text-xs font-black text-white uppercase tracking-widest italic">Contagem por Lote</h2>
                    </div>
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="bg-white/[0.03] text-[9px] font-black text-white/20 uppercase tracking-[0.2em] border-b border-white/5">
                                <tr>
                                    <th className="px-8 py-6">Medicamento / Lote</th>
                                    <th className="px-8 py-6 text-center">Validade</th>
                                    <th className="px-8 py-6 text-center">Stock Sistema</th>
                                    <th className="px-8 py-6 text-center w-48">Contagem Física</th>
                                    <th className="px-8 py-6 text-right">Diferença</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {lotes.map(l => {
                                    const counted = counts[l.id] !== undefined ? parseFloat(counts[l.id]) : null;
                                    const delta = counted !== null ? counted - l.quantidade_atual : null;
                                    return (
                                        <tr key={l.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/5 group-hover:border-gold-primary/20 transition-all">
                                                        <Boxes size={16} className="text-white/20 group-hover:text-gold-primary transition-colors" />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-white text-xs uppercase tracking-tight group-hover:text-gold-primary transition-colors">{l.nome_medicamento}</p>
                                                        <p className="text-[9px] font-black text-white/20 mt-0.5 font-mono italic uppercase">Lote: {l.numero_lote}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center text-[10px] font-black text-white/40 tabular-nums tracking-widest">
                                                {new Date(l.data_validade).toLocaleDateString('pt-AO')}
                                            </td>
                                            <td className="px-8 py-6 text-center font-black text-white/60 tabular-nums">{l.quantidade_atual}</td>
                                            <td className="px-8 py-6 text-center">
                                                <input
                                                    type="number"
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl text-center font-black text-white tabular-nums py-2.5 outline-none focus:border-gold-primary/40 transition-all"
                                                    value={counts[l.id] || ''}
                                                    onChange={e => setCounts(prev => ({ ...prev, [l.id]: e.target.value }))}
                                                    placeholder="0"
                                                />
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                {delta !== null && (
                                                    <span className={`font-black text-sm tabular-nums ${delta === 0 ? 'text-white/20' : delta > 0 ? 'text-gold-primary' : 'text-red-400'}`}>
                                                        {delta > 0 ? '+' : ''}{delta}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto relative z-10 animate-in fade-in duration-500">
            <header className="flex justify-between items-start md:items-center gap-6 mb-10">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
                        Inventário <span className="text-gold-gradient">Farmácia</span>
                    </h1>
                    <p className="text-white/40 font-black text-[10px] uppercase tracking-[0.3em] mt-2 italic">Auditoria e reconciliação de stock por lote</p>
                </div>
                <button
                    onClick={() => setShowNewModal(true)}
                    className="bg-gradient-to-r from-gold-primary to-gold-secondary text-bg-deep px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] transition-all active:scale-95 shadow-2xl"
                >
                    <Play size={16} />
                    Novo Inventário
                </button>
            </header>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {[
                    {
                        label: 'Auditorias Concluídas',
                        value: sessions.filter(s => s.status === 'completed').length,
                        icon: CheckCircle2,
                        color: 'text-gold-primary',
                        bg: 'bg-gold-primary/10',
                        border: 'border-gold-primary/20',
                        glow: 'shadow-[0_0_20px_rgba(212,175,55,0.1)]'
                    },
                    {
                        label: 'Total de Movimentos',
                        value: '—',
                        icon: Activity,
                        color: 'text-amber-400',
                        bg: 'bg-amber-500/10',
                        border: 'border-amber-500/20',
                        glow: 'shadow-[0_0_20px_rgba(245,158,11,0.1)]'
                    },
                    {
                        label: 'Sessões em Aberto',
                        value: sessions.filter(s => s.status === 'draft').length,
                        icon: AlertCircle,
                        color: 'text-blue-400',
                        bg: 'bg-blue-500/10',
                        border: 'border-blue-500/20',
                        glow: 'shadow-[0_0_20px_rgba(59,130,246,0.1)]'
                    }
                ].map((card, i) => (
                    <div key={i} className={`glass-panel p-7 rounded-3xl border ${card.border} ${card.glow} flex items-center justify-between`}>
                        <div>
                            <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] mb-3">{card.label}</p>
                            <p className={`text-4xl font-black tabular-nums italic ${card.color}`}>{card.value}</p>
                        </div>
                        <div className={`w-14 h-14 ${card.bg} ${card.color} rounded-2xl flex items-center justify-center border ${card.border}`}>
                            <card.icon size={24} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Sessions Table */}
            <div className="glass-panel rounded-[40px] border border-white/5 shadow-3xl overflow-hidden">
                <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center gap-4">
                    <div className="w-10 h-10 bg-gold-primary/10 text-gold-primary rounded-xl flex items-center justify-center border border-gold-primary/20">
                        <History size={20} />
                    </div>
                    <h2 className="text-xs font-black text-white uppercase tracking-widest italic">Historial de Auditorias</h2>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left">
                        <thead className="bg-white/[0.03] text-[9px] font-black text-white/20 uppercase tracking-[0.2em] border-b border-white/5">
                            <tr>
                                <th className="px-8 py-6">Data / Hora</th>
                                <th className="px-8 py-6">Operador</th>
                                <th className="px-8 py-6">Estado</th>
                                <th className="px-8 py-6">Notas</th>
                                <th className="px-8 py-6 text-right">Acção</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {sessions.map(s => (
                                <tr key={s.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-8 py-6 text-[10px] font-black text-white/60 tabular-nums tracking-tight">
                                        {new Date(s.created_at).toLocaleString('pt-AO')}
                                    </td>
                                    <td className="px-8 py-6 text-[10px] font-black text-white/40 uppercase tracking-widest">
                                        {s.user_name || 'Desconhecido'}
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${s.status === 'completed'
                                            ? 'bg-gold-primary/10 text-gold-primary border-gold-primary/20 shadow-[0_0_10px_rgba(212,175,55,0.1)]'
                                            : 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]'
                                        }`}>
                                            {s.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-[10px] text-white/20 font-black italic">{s.notes || '--'}</td>
                                    <td className="px-8 py-6 text-right">
                                        {s.status === 'draft' ? (
                                            <button onClick={() => setActiveSession(s)} className="text-[9px] font-black text-gold-primary/50 hover:text-gold-primary uppercase tracking-widest transition-colors">
                                                Continuar
                                            </button>
                                        ) : (
                                            <button className="text-[9px] font-black text-white/20 hover:text-white/50 uppercase tracking-widest transition-colors">
                                                Ver Detalhes
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {sessions.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={5} className="py-32 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-10">
                                            <ClipboardList size={48} />
                                            <p className="text-[10px] font-black uppercase tracking-[0.4em]">Nenhum inventário registado</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showNewModal && (
                <div className="fixed inset-0 bg-bg-deep/80 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
                    <div className="glass-panel rounded-[40px] w-full max-w-sm overflow-hidden shadow-2xl border border-white/10 relative">
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-gold-primary/40 to-transparent" />
                        <div className="p-12 text-center">
                            <div className="w-20 h-20 bg-gold-primary/10 text-gold-primary rounded-3xl flex items-center justify-center mx-auto mb-8 border border-gold-primary/20 shadow-[0_0_30px_rgba(212,175,55,0.1)]">
                                <ClipboardList size={36} />
                            </div>
                            <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-3">Iniciar <span className="text-gold-gradient">Inventário</span></h3>
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-10 leading-6">
                                Será criada uma nova sessão de auditoria para todos os lotes ativos na farmácia.
                            </p>
                            <div className="space-y-4">
                                <button
                                    onClick={createSession}
                                    disabled={saving}
                                    className="w-full py-5 bg-gradient-to-r from-gold-primary to-gold-secondary text-bg-deep rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] transition-all active:scale-95 shadow-2xl disabled:opacity-50"
                                >
                                    {saving ? 'A Processar...' : 'Começar Agora'}
                                </button>
                                <button
                                    onClick={() => setShowNewModal(false)}
                                    className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white/40 transition-colors"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
