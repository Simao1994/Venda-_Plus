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
            <div className="p-6 space-y-6">
                <header className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Inventário de Lotes Ativo</h1>
                        <p className="text-gray-500 text-sm">Realizando contagem física de medicamentos por lote.</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={saveCounts}
                            disabled={saving}
                            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                            <Save size={18} className="text-emerald-600" />
                            Guardar Rascunho
                        </button>
                        <button
                            onClick={finalizeSession}
                            disabled={saving}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 flex items-center gap-2 shadow-lg shadow-emerald-100"
                        >
                            <CheckCircle2 size={18} />
                            Finalizar & Reconciliar
                        </button>
                    </div>
                </header>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase font-bold tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Medicamento / Lote</th>
                                <th className="px-6 py-4 text-center">Validade</th>
                                <th className="px-6 py-4 text-center">Stock Sistema</th>
                                <th className="px-6 py-4 text-center w-40">Contagem Física</th>
                                <th className="px-6 py-4 text-right">Diferença</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {lotes.map(l => {
                                const counted = counts[l.id] !== undefined ? parseFloat(counts[l.id]) : null;
                                const delta = counted !== null ? counted - l.quantidade_atual : null;
                                return (
                                    <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-emerald-50 rounded flex items-center justify-center text-emerald-600">
                                                    <Boxes size={16} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 text-sm">{l.nome_medicamento}</p>
                                                    <p className="text-[10px] text-gray-500 font-mono">Lote: {l.numero_lote}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center text-xs text-gray-600">
                                            {new Date(l.data_validade).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-center font-medium text-gray-500">{l.quantidade_atual}</td>
                                        <td className="px-6 py-4 text-center">
                                            <input
                                                type="number"
                                                className="w-full border-gray-200 rounded-lg text-center font-bold text-gray-900 focus:ring-emerald-500 focus:border-emerald-500"
                                                value={counts[l.id] || ''}
                                                onChange={e => setCounts(prev => ({ ...prev, [l.id]: e.target.value }))}
                                                placeholder="0"
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {delta !== null && (
                                                <span className={`font-bold text-sm ${delta === 0 ? 'text-gray-300' : delta > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
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
        <div className="p-6 space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 text-emerald-800">Inventário de Farmácia</h1>
                    <p className="text-gray-500 text-sm">Auditoria e reconciliação de stock por lote.</p>
                </div>
                <button
                    onClick={() => setShowNewModal(true)}
                    className="bg-emerald-600 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all"
                >
                    <Play size={18} />
                    Novo Inventário
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Auditorias Concluídas</p>
                        <p className="text-2xl font-black text-gray-900">{sessions.filter(s => s.status === 'completed').length}</p>
                    </div>
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                        <CheckCircle2 size={24} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total de Movimentos</p>
                        <p className="text-2xl font-black text-gray-900">---</p>
                    </div>
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
                        <Activity size={24} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Sessões em Aberto</p>
                        <p className="text-2xl font-black text-gray-900">{sessions.filter(s => s.status === 'draft').length}</p>
                    </div>
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                        <AlertCircle size={24} />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex items-center gap-2">
                    <History size={16} className="text-gray-400" />
                    <h2 className="text-xs font-bold text-gray-600 uppercase tracking-wider">Histórico de Auditorias</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-400 text-[9px] uppercase font-bold tracking-widest border-b">
                            <tr>
                                <th className="px-6 py-4">Data / Hora</th>
                                <th className="px-6 py-4">Operador</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4">Notas</th>
                                <th className="px-6 py-4 text-right">Acção</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {sessions.map(s => (
                                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-xs font-medium text-gray-700">
                                        {new Date(s.created_at).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-500">
                                        {s.user_name || 'Desconhecido'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${s.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {s.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-400 italic">
                                        {s.notes || '--'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {s.status === 'draft' ? (
                                            <button
                                                onClick={() => setActiveSession(s)}
                                                className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                                            >
                                                Continuar
                                            </button>
                                        ) : (
                                            <button className="text-xs font-bold text-gray-400 hover:text-gray-600">
                                                Ver Detalhes
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {sessions.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-gray-300">
                                        Nenhum inventário registado
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showNewModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
                        <div className="p-8 text-center">
                            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <ClipboardList size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Iniciar Inventário</h3>
                            <p className="text-sm text-gray-500 mb-8">
                                Isso criará uma nova sessão de auditoria para todos os lotes ativos na farmácia.
                            </p>
                            <div className="space-y-3">
                                <button
                                    onClick={createSession}
                                    disabled={saving}
                                    className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                                >
                                    {saving ? 'A Processar...' : 'Começar Agora'}
                                </button>
                                <button
                                    onClick={() => setShowNewModal(false)}
                                    className="w-full py-3 text-sm font-medium text-gray-400 hover:text-gray-600"
                                >
                                    cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
