import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import {
    ClipboardList, Plus, Search, Filter, Play, CheckCircle2,
    XCircle, AlertCircle, Save, ArrowRight, History, Package
} from 'lucide-react';

export default function InventorySessions() {
    const { user } = useAuth();
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewModal, setShowNewModal] = useState(false);
    const [activeSession, setActiveSession] = useState<any>(null);
    const [products, setProducts] = useState<any[]>([]);
    const [counts, setCounts] = useState<Record<number, string>>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSessions();
        fetchProducts();
    }, []);

    const fetchSessions = async () => {
        try {
            const res = await api.get('/api/inventory/sessions');
            const data = await res.json();
            setSessions(data || []);
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        const res = await api.get('/api/products');
        setProducts(await res.json());
    };

    const createSession = async () => {
        setSaving(true);
        try {
            const res = await api.post('/api/inventory/sessions', { notes: 'Inventário Geral' });
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
            await api.post(`/api/inventory/sessions/${activeSession.id}/counts`, { counts });
            alert('Contagens salvas com sucesso!');
        } finally {
            setSaving(false);
        }
    };

    const finalizeSession = async () => {
        if (!window.confirm('Deseja finalizar o inventário? O stock do sistema será atualizado com base nas contagens.')) return;
        setSaving(true);
        try {
            const res = await api.post(`/api/inventory/sessions/${activeSession.id}/finalize`, {});
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
            <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <header className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">
                            Session <span className="text-gold-gradient">Active</span>
                        </h1>
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mt-2">Physical reconciliation in progress</p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={saveCounts}
                            disabled={saving}
                            className="flex items-center gap-3 px-6 py-4 glass-panel border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/60 hover:bg-white/5 transition-all"
                        >
                            <Save size={18} className="text-blue-400/60" />
                            Save Progress
                        </button>
                        <button
                            onClick={finalizeSession}
                            disabled={saving}
                            className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all"
                        >
                            <CheckCircle2 size={18} />
                            Finalize & Sync
                        </button>
                    </div>
                </header>

                <div className="glass-panel rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
                    <table className="w-full text-left">
                        <thead className="bg-white/[0.02] text-gold-primary/40 text-[9px] uppercase tracking-[0.3em] border-b border-white/5 font-black">
                            <tr>
                                <th className="px-8 py-5">Asset</th>
                                <th className="px-8 py-5 text-center">System Reserve</th>
                                <th className="px-8 py-5 text-center w-48">Physical Count</th>
                                <th className="px-8 py-5 text-right">Delta</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {products.map(p => {
                                const counted = counts[p.id] !== undefined ? parseFloat(counts[p.id]) : null;
                                const delta = counted !== null ? counted - p.stock : null;
                                return (
                                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white/20 border border-white/5">
                                                    <Package size={18} />
                                                </div>
                                                <span className="font-black text-white uppercase text-xs">{p.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center font-black text-white/40 italic">{p.stock}</td>
                                        <td className="px-8 py-6">
                                            <input
                                                type="number"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center font-black text-white focus:border-gold-primary/50 outline-none transition-all"
                                                value={counts[p.id] || ''}
                                                onChange={e => setCounts(prev => ({ ...prev, [p.id]: e.target.value }))}
                                                placeholder="0"
                                            />
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            {delta !== null && (
                                                <span className={`font-black text-xs ${delta === 0 ? 'text-white/20' : delta > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
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
        );
    }

    return (
        <div className="p-8 space-y-10 animate-in fade-in duration-700">
            <header className="flex justify-between items-center relative z-10">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tighter italic uppercase">
                        Inventory <span className="text-gold-gradient">Control</span>
                    </h1>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mt-2">Formal asset audit & reconciliation</p>
                </div>
                <button
                    onClick={() => setShowNewModal(true)}
                    className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-gold-primary to-gold-secondary text-bg-deep rounded-2xl text-[10px] font-black uppercase tracking-widest hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] transition-all shadow-2xl"
                >
                    <Play size={18} />
                    Launch New Session
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                {[
                    { label: 'Completed Audits', val: sessions.filter(s => s.status === 'completed').length, icon: CheckCircle2, color: 'text-emerald-400' },
                    { label: 'Total Adjustments', val: '---', icon: ClipboardList, color: 'text-gold-primary' },
                    { label: 'Draft Sessions', val: sessions.filter(s => s.status === 'draft').length, icon: AlertCircle, color: 'text-blue-400' }
                ].map((stat, i) => (
                    <div key={i} className="glass-panel p-8 rounded-3xl border border-white/5 flex items-center justify-between group hover:border-gold-primary/20 transition-all">
                        <div>
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">{stat.label}</p>
                            <p className="text-3xl font-black text-white italic tracking-tighter uppercase">{stat.val}</p>
                        </div>
                        <div className={`p-4 bg-white/5 rounded-2xl ${stat.color} group-hover:scale-110 transition-all`}>
                            <stat.icon size={24} />
                        </div>
                    </div>
                ))}
            </div>

            <div className="glass-panel rounded-3xl border border-white/5 overflow-hidden shadow-2xl relative z-10">
                <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center gap-4">
                    <History size={18} className="text-gold-primary/40" />
                    <h2 className="text-[10px] font-black text-white/60 uppercase tracking-widest italic">Audit History Logs</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/[0.02] text-gold-primary/40 text-[9px] uppercase tracking-[0.3em] border-b border-white/5 font-black">
                            <tr>
                                <th className="px-8 py-5">Date & Time</th>
                                <th className="px-8 py-5">Operator</th>
                                <th className="px-8 py-5">Status</th>
                                <th className="px-8 py-5">Notes</th>
                                <th className="px-8 py-5 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {sessions.map(session => (
                                <tr key={session.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-8 py-6 text-[11px] font-black text-white/60 uppercase tracking-tight">
                                        {new Date(session.created_at).toLocaleString()}
                                    </td>
                                    <td className="px-8 py-6 text-[10px] font-black text-white/40 uppercase tracking-widest">
                                        {session.user_name || 'System'}
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border ${session.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                session.status === 'draft' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                    'bg-red-500/10 text-red-500 border-red-500/20'
                                            }`}>
                                            {session.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-[10px] font-medium text-white/20 uppercase tracking-widest">
                                        {session.notes || '---'}
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        {session.status === 'draft' ? (
                                            <button
                                                onClick={() => setActiveSession(session)}
                                                className="px-6 py-3 bg-white/5 hover:bg-gold-primary/10 text-[9px] font-black text-gold-primary uppercase tracking-widest border border-gold-primary/20 rounded-xl transition-all"
                                            >
                                                Resume Audit
                                            </button>
                                        ) : (
                                            <button className="px-6 py-3 bg-white/5 text-[9px] font-black text-white/20 uppercase tracking-widest border border-white/5 rounded-xl hover:text-white/40 transition-all">
                                                View Report
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {sessions.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={5} className="px-8 py-24 text-center">
                                        <ClipboardList size={48} className="mx-auto text-white/5 mb-4" />
                                        <p className="text-[10px] font-black text-white/10 uppercase tracking-[0.4em]">No audit logs found</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* New Session Modal */}
            {showNewModal && (
                <div className="fixed inset-0 bg-bg-deep/80 backdrop-blur-xl flex items-center justify-center z-[110] p-4">
                    <div className="glass-panel rounded-[40px] w-full max-w-md overflow-hidden shadow-2xl border border-white/10 relative">
                        <div className="p-10 text-center">
                            <div className="w-20 h-20 bg-gold-primary/10 text-gold-primary rounded-[32px] flex items-center justify-center mx-auto mb-6 border border-gold-primary/20 shadow-[0_0_30px_rgba(212,175,55,0.1)]">
                                <Play size={32} />
                            </div>
                            <h3 className="text-2xl font-black text-white italic uppercase tracking-widest mb-2">Start New <span className="text-gold-gradient">Cycle</span></h3>
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-10 leading-relaxed">
                                Initializing a new inventory session will allow you to count all assets and reconcile the primary registry.
                            </p>
                            <div className="flex flex-col gap-4">
                                <button
                                    onClick={createSession}
                                    disabled={saving}
                                    className="w-full py-6 bg-gradient-to-r from-gold-primary to-gold-secondary text-bg-deep rounded-2xl text-[11px] font-black uppercase tracking-[0.4em] hover:shadow-[0_0_40px_rgba(212,175,55,0.3)] transition-all active:scale-[0.98] shadow-2xl"
                                >
                                    {saving ? 'INITIATING...' : 'BEGIN PROTOCOL'}
                                </button>
                                <button
                                    onClick={() => setShowNewModal(false)}
                                    className="w-full py-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white/20 hover:text-white/40 border border-white/5 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
