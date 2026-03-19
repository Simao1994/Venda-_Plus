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
        <div className="p-6 space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Ajustes Rápidos de Stock</h1>
                    <p className="text-gray-500 text-sm">Correções de quebras, vencimentos ou erros de contagem.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Column */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Boxes size={18} className="text-emerald-600" />
                            Novo Ajuste
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Lote Alvo</label>
                                <select
                                    required
                                    className="w-full border-gray-200 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500"
                                    value={formData.lote_id}
                                    onChange={e => setFormData({ ...formData, lote_id: e.target.value })}
                                >
                                    <option value="">Selecione o Lote...</option>
                                    {Array.isArray(lotes) && lotes.map(l => (
                                        <option key={l.id} value={l.id}>
                                            {l.nome_medicamento} (Lote: {l.numero_lote}) - Val: {l.data_validade ? new Date(l.data_validade).toLocaleDateString() : 'Sem data'}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Operação</label>
                                    <select
                                        className="w-full border-gray-200 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500"
                                        value={formData.tipo}
                                        onChange={e => setFormData({ ...formData, tipo: e.target.value as any, motivo: e.target.value === 'entrada' ? 'Ajuste Positivo' : 'Quebra' })}
                                    >
                                        <option value="entrada">Entrada (+)</option>
                                        <option value="saida">Saída (-)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Quantidade</label>
                                    <input
                                        required
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        className="w-full border-gray-200 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500"
                                        placeholder="0.00"
                                        value={formData.quantidade}
                                        onChange={e => setFormData({ ...formData, quantidade: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Motivo Justificativo</label>
                                <select
                                    className="w-full border-gray-200 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500"
                                    value={formData.motivo}
                                    onChange={e => setFormData({ ...formData, motivo: e.target.value })}
                                >
                                    {formData.tipo === 'entrada' ? (
                                        <>
                                            <option value="Ajuste Positivo">Erro de Contagem / Sobra</option>
                                            <option value="Devolução">Devolução de Lote</option>
                                            <option value="Outros">Outros</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value="Quebra">Quebra / Dano Físico</option>
                                            <option value="Vencimento">Produto Expirado (Vencido)</option>
                                            <option value="Amostra">Amostra Grátis / Uso Interno</option>
                                            <option value="Roubo">Roubo ou Extravio</option>
                                            <option value="Erro de Lote">Erro de Registo de Lote</option>
                                        </>
                                    )}
                                </select>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 mt-4"
                            >
                                <Save size={18} />
                                Registar Ajuste
                            </button>
                        </form>
                    </div>

                    <div className="bg-emerald-900 p-6 rounded-2xl text-white shadow-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <AlertCircle className="text-emerald-400" />
                            <h3 className="font-bold text-sm uppercase tracking-wider italic">Boas Práticas AGT</h3>
                        </div>
                        <p className="text-xs text-emerald-100/60 leading-relaxed italic">
                            Todo ajuste de stock manual deve ser devidamente justificado.
                            Em caso de vencimento, o produto deve ser abatido do stock principal imediatamente para evitar vendas ilegais.
                        </p>
                    </div>
                </div>

                {/* History Column */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <History size={18} className="text-gray-400" />
                                <h2 className="text-xs font-bold text-gray-700 uppercase tracking-widest italic">Log de Ajustes Recentes</h2>
                            </div>
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Filtrar movimentos..."
                                    className="pl-9 pr-4 py-1.5 bg-white border-gray-100 rounded-lg text-xs focus:ring-emerald-500 w-48"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/30 text-[9px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50">
                                    <tr>
                                        <th className="px-6 py-4">Data</th>
                                        <th className="px-6 py-4">Medicamento / Lote</th>
                                        <th className="px-6 py-4 text-center">Tipo</th>
                                        <th className="px-6 py-4 text-center">Quant.</th>
                                        <th className="px-6 py-4">Motivo</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 font-medium">
                                    {Array.isArray(movements) && movements.map(m => (
                                        <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 text-[10px] text-gray-400">
                                                {m.data_movimento ? new Date(m.data_movimento).toLocaleString() : '---'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-xs font-bold text-gray-800">{m.nome_medicamento || 'Medicamento Desconhecido'}</p>
                                                <p className="text-[10px] text-gray-400 font-mono">#{m.lote_numero || 'S/L'}</p>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {m.tipo_movimento?.includes('positivo') || m.tipo === 'entrada' ? (
                                                    <span className="p-1 px-2 bg-emerald-50 text-emerald-600 rounded-md text-[9px] font-black uppercase tracking-tighter flex items-center gap-1 justify-center w-fit mx-auto">
                                                        <ArrowUpCircle size={12} />
                                                        IN
                                                    </span>
                                                ) : (
                                                    <span className="p-1 px-2 bg-red-50 text-red-600 rounded-md text-[9px] font-black uppercase tracking-tighter flex items-center gap-1 justify-center w-fit mx-auto">
                                                        <ArrowDownCircle size={12} />
                                                        OUT
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center text-xs font-black text-gray-700">
                                                {m.quantidade}
                                            </td>
                                            <td className="px-6 py-4 text-[10px] text-gray-500 uppercase tracking-tight italic">
                                                {m.motivo || m.tipo_movimento}
                                            </td>
                                        </tr>
                                    ))}
                                    {movements.length === 0 && !loading && (
                                        <tr>
                                            <td colSpan={5} className="py-24 text-center">
                                                <Calendar size={48} className="mx-auto text-gray-100 mb-4" />
                                                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Nenhum registo histórico</p>
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
