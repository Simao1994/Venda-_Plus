import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
    Wallet, TrendingUp, TrendingDown, Clock, CheckCircle2,
    AlertCircle, Search, Filter, Calendar, DollarSign,
    ArrowUpRight, ArrowDownRight, FileText
} from 'lucide-react';

export default function PharmacyFinance() {
    const { token, user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [receivables, setReceivables] = useState<any[]>([]);
    const [payables, setPayables] = useState<any[]>([]);
    const [summary, setSummary] = useState({ incoming: 0, outgoing: 0, pending: 0 });
    const [activeTab, setActiveTab] = useState<'receivables' | 'payables' | 'cashflow'>('cashflow');
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        fetchData();
    }, [filterDate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Mocking or fetching from real endpoints if they exist
            // For now, let's fetch sales with status 'credit' or 'pending' for receivables
            const resSales = await fetch(`/api/farmacia/vendas?date=${filterDate}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const sales = await resSales.json();

            const rec = sales.filter((s: any) => s.forma_pagamento === 'credit' || s.status === 'pending');
            setReceivables(rec);

            // Fetch expenses for payables
            const resExp = await fetch(`/api/finances/expenses?module=pharmacy&date=${filterDate}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const exp = await resExp.json();
            setPayables(exp);

            // Summarize
            const incoming = sales.reduce((acc: number, s: any) => acc + (s.total || 0), 0);
            const outgoing = exp.reduce((acc: number, e: any) => acc + (e.amount || 0), 0);
            const pending = rec.reduce((acc: number, r: any) => acc + (r.total || 0), 0);

            setSummary({ incoming, outgoing, pending });
        } catch (err) {
            console.error('Error fetching pharmacy finance data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (type: 'sale' | 'expense', id: number, newStatus: string) => {
        // Logic to update status (e.g., marking as paid)
        alert(`Actualizar ${type} ${id} para ${newStatus}`);
        fetchData();
    };

    return (
        <div className="flex flex-col h-full bg-bg-deep p-8 overflow-y-auto custom-scrollbar">
            {/* Header & Summary Cards */}
            <div className="mb-10">
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic mb-8">
                    Gestão <span className="text-emerald-400">Financeira</span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="glass-panel p-8 rounded-[40px] border border-emerald-500/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-emerald-500/10 transition-all duration-700" />
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                                <TrendingUp size={28} className="text-emerald-400" />
                            </div>
                            <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full uppercase tracking-widest border border-emerald-500/20">Entradas</span>
                        </div>
                        <p className="text-[11px] font-black text-white/40 uppercase tracking-[0.3em] mb-1">Total Recebido</p>
                        <h3 className="text-3xl font-black text-white tabular-nums italic">
                            {summary.incoming.toLocaleString('pt-AO')} <span className="text-sm opacity-50 not-italic ml-1">{user?.currency}</span>
                        </h3>
                    </div>

                    <div className="glass-panel p-8 rounded-[40px] border border-red-500/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-red-500/10 transition-all duration-700" />
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20">
                                <TrendingDown size={28} className="text-red-400" />
                            </div>
                            <span className="text-[10px] font-black text-red-400 bg-red-500/10 px-3 py-1.5 rounded-full uppercase tracking-widest border border-red-500/20">Saídas</span>
                        </div>
                        <p className="text-[11px] font-black text-white/40 uppercase tracking-[0.3em] mb-1">Total em Dívida (Pagar)</p>
                        <h3 className="text-3xl font-black text-white tabular-nums italic">
                            {summary.outgoing.toLocaleString('pt-AO')} <span className="text-sm opacity-50 not-italic ml-1">{user?.currency}</span>
                        </h3>
                    </div>

                    <div className="glass-panel p-8 rounded-[40px] border border-amber-500/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-amber-500/10 transition-all duration-700" />
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20">
                                <Clock size={28} className="text-amber-400" />
                            </div>
                            <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-full uppercase tracking-widest border border-amber-500/20">Pendente</span>
                        </div>
                        <p className="text-[11px] font-black text-white/40 uppercase tracking-[0.3em] mb-1">A Receber (Pacientes)</p>
                        <h3 className="text-3xl font-black text-white tabular-nums italic">
                            {summary.pending.toLocaleString('pt-AO')} <span className="text-sm opacity-50 not-italic ml-1">{user?.currency}</span>
                        </h3>
                    </div>
                </div>
            </div>

            {/* Tabs & Filters */}
            <div className="flex flex-wrap items-center justify-between gap-6 mb-8">
                <div className="flex gap-2 bg-white/5 p-1.5 rounded-[24px] border border-white/5">
                    <button
                        onClick={() => setActiveTab('cashflow')}
                        className={`px-8 py-3.5 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'cashflow' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-white/40 hover:text-white/60 hover:bg-white/5'}`}
                    >
                        Fluxo de Caixa
                    </button>
                    <button
                        onClick={() => setActiveTab('receivables')}
                        className={`px-8 py-3.5 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'receivables' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-white/40 hover:text-white/60 hover:bg-white/5'}`}
                    >
                        Contas a Receber
                    </button>
                    <button
                        onClick={() => setActiveTab('payables')}
                        className={`px-8 py-3.5 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'payables' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-white/40 hover:text-white/60 hover:bg-white/5'}`}
                    >
                        Contas a Pagar
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400" size={16} />
                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="pl-12 pr-6 py-3.5 bg-white/5 border border-white/5 rounded-2xl text-[11px] font-black text-emerald-400 uppercase tracking-widest outline-none focus:border-emerald-500/40 transition-all cursor-pointer"
                        />
                    </div>
                    <button onClick={fetchData} className="p-3.5 bg-white/5 border border-white/5 rounded-2xl text-white/40 hover:text-emerald-400 hover:border-emerald-500/20 transition-all">
                        <Search size={20} />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="glass-panel p-8 rounded-[40px] border border-white/5 min-h-[400px]">
                {loading ? (
                    <div className="flex items-center justify-center h-[400px]">
                        <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : activeTab === 'receivables' ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left border-b border-white/5">
                                    <th className="pb-6 text-[9px] font-black text-white/20 uppercase tracking-[0.4em]">Fatura</th>
                                    <th className="pb-6 text-[9px] font-black text-white/20 uppercase tracking-[0.4em]">Paciente</th>
                                    <th className="pb-6 text-[9px] font-black text-white/20 uppercase tracking-[0.4em]">Data</th>
                                    <th className="pb-6 text-[9px] font-black text-white/20 uppercase tracking-[0.4em]">Valor</th>
                                    <th className="pb-6 text-[9px] font-black text-white/20 uppercase tracking-[0.4em]">Estado</th>
                                    <th className="pb-6 text-[9px] font-black text-white/20 uppercase tracking-[0.4em] text-right">Acção</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {receivables.map(r => (
                                    <tr key={r.id} className="group hover:bg-white/[0.01] transition-colors">
                                        <td className="py-6 pr-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-emerald-500/5 rounded-xl flex items-center justify-center border border-emerald-500/20 opacity-40 group-hover:opacity-100 transition-opacity">
                                                    <FileText size={16} className="text-emerald-400" />
                                                </div>
                                                <span className="text-[11px] font-black text-white uppercase tracking-wider">{r.numero_factura}</span>
                                            </div>
                                        </td>
                                        <td className="py-6">
                                            <p className="text-[11px] font-black text-white uppercase tracking-wider">{r.customer_name || 'CONSUMIDOR FINAL'}</p>
                                            {r.customer_nif && <p className="text-[9px] text-white/20 font-bold mt-1">NIF: {r.customer_nif}</p>}
                                        </td>
                                        <td className="py-6 text-[10px] font-black text-white/40">{new Date(r.created_at).toLocaleDateString('pt-AO')}</td>
                                        <td className="py-6">
                                            <p className="text-[11px] font-black text-emerald-400 tabular-nums">{r.total?.toLocaleString('pt-AO')} {user?.currency}</p>
                                        </td>
                                        <td className="py-6">
                                            <span className="text-[8px] font-black px-3 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full uppercase tracking-widest flex items-center gap-2 w-fit">
                                                <AlertCircle size={10} />
                                                Pendente
                                            </span>
                                        </td>
                                        <td className="py-6 text-right">
                                            <button onClick={() => handleStatusUpdate('sale', r.id, 'paid')} className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all">
                                                Liquidar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {receivables.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="py-20 text-center">
                                            <div className="flex flex-col items-center gap-3 text-white/10">
                                                <DollarSign size={40} />
                                                <p className="text-[10px] font-black uppercase tracking-[0.4em]">Nenhuma conta a receber pendente</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : activeTab === 'payables' ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left border-b border-white/5">
                                    <th className="pb-6 text-[9px] font-black text-white/20 uppercase tracking-[0.4em]">Fornecedor / Descrição</th>
                                    <th className="pb-6 text-[9px] font-black text-white/20 uppercase tracking-[0.4em]">Data Venc.</th>
                                    <th className="pb-6 text-[9px] font-black text-white/20 uppercase tracking-[0.4em]">Valor</th>
                                    <th className="pb-6 text-[9px] font-black text-white/20 uppercase tracking-[0.4em]">Estado</th>
                                    <th className="pb-6 text-[9px] font-black text-white/20 uppercase tracking-[0.4em] text-right">Acção</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {payables.map(p => (
                                    <tr key={p.id} className="group hover:bg-white/[0.01] transition-colors">
                                        <td className="py-6 pr-4">
                                            <p className="text-[11px] font-black text-white uppercase tracking-wider">{p.description || p.supplier_name}</p>
                                            <p className="text-[9px] text-white/20 font-bold mt-1 uppercase tracking-widest">{p.category || 'MERCADORIA'}</p>
                                        </td>
                                        <td className="py-6 text-[10px] font-black text-white/40">{new Date(p.due_date).toLocaleDateString('pt-AO')}</td>
                                        <td className="py-6">
                                            <p className="text-[11px] font-black text-red-400 tabular-nums">{p.amount?.toLocaleString('pt-AO')} {user?.currency}</p>
                                        </td>
                                        <td className="py-6">
                                            <span className="text-[8px] font-black px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full uppercase tracking-widest flex items-center gap-2 w-fit">
                                                <AlertCircle size={10} />
                                                Não Pago
                                            </span>
                                        </td>
                                        <td className="py-6 text-right">
                                            <button onClick={() => handleStatusUpdate('expense', p.id, 'paid')} className="px-4 py-2 bg-white/5 border border-white/10 text-white/60 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white hover:border-red-500 transition-all">
                                                Pagar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {payables.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center">
                                            <div className="flex flex-col items-center gap-3 text-white/10">
                                                <DollarSign size={40} />
                                                <p className="text-[10px] font-black uppercase tracking-[0.4em]">Nenhuma conta a pagar registada</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="space-y-12">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-8">
                                <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] border-l-4 border-emerald-500 pl-4">Entradas Recentes</h4>
                                <div className="space-y-4">
                                    {receivables.slice(0, 5).map(r => (
                                        <div key={r.id} className="glass-panel p-5 rounded-3xl border border-white/5 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400">
                                                    <ArrowUpRight size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-white uppercase tracking-wider">{r.numero_factura}</p>
                                                    <p className="text-[9px] text-white/20 font-bold mt-0.5 uppercase tracking-widest">{r.customer_name || 'Venda POS'}</p>
                                                </div>
                                            </div>
                                            <p className="text-[11px] font-black text-emerald-400 tabular-nums">+{r.total?.toLocaleString('pt-AO')} {user?.currency}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-8">
                                <h4 className="text-[10px] font-black text-red-400 uppercase tracking-[0.4em] border-l-4 border-red-500 pl-4">Saídas Recentes</h4>
                                <div className="space-y-4">
                                    {payables.slice(0, 5).map(p => (
                                        <div key={p.id} className="glass-panel p-5 rounded-3xl border border-white/5 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center text-red-400">
                                                    <ArrowDownRight size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-white uppercase tracking-wider">{p.description || 'Despesa'}</p>
                                                    <p className="text-[9px] text-white/20 font-bold mt-0.5 uppercase tracking-widest">{p.category || 'Geral'}</p>
                                                </div>
                                            </div>
                                            <p className="text-[11px] font-black text-red-400 tabular-nums">-{p.amount?.toLocaleString('pt-AO')} {user?.currency}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="glass-panel p-10 rounded-[40px] border border-blue-500/10 bg-blue-500/[0.02]">
                            <div className="flex justify-between items-center mb-10">
                                <div>
                                    <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] mb-2">Desempenho no Período</h4>
                                    <p className="text-sm font-black text-white uppercase tracking-widest">Resultado Líquido Estimado</p>
                                </div>
                                <div className="text-right">
                                    <h3 className={`text-4xl font-black tabular-nums italic ${(summary.incoming - summary.outgoing) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {(summary.incoming - summary.outgoing).toLocaleString('pt-AO')}
                                    </h3>
                                    <p className="text-sm font-black text-white/20 mt-1 uppercase tracking-widest">{user?.currency}</p>
                                </div>
                            </div>
                            <div className="h-4 bg-white/5 rounded-full overflow-hidden flex shadow-inner">
                                <div
                                    className="h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all duration-1000"
                                    style={{ width: `${(summary.incoming / (summary.incoming + summary.outgoing || 1)) * 100}%` }}
                                />
                                <div
                                    className="h-full bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-all duration-1000"
                                    style={{ width: `${(summary.outgoing / (summary.incoming + summary.outgoing || 1)) * 100}%` }}
                                />
                            </div>
                            <div className="flex justify-between mt-4">
                                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em]">Lucro Bruto (Entradas)</span>
                                <span className="text-[9px] font-black text-red-400 uppercase tracking-[0.2em]">Despesas (Saídas)</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
