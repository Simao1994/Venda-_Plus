import React, { useState, useEffect } from 'react';
import {
    Users, BarChart3, TrendingUp, TrendingDown,
    Calendar, Search, Download, Printer,
    Pill, Award, AlertCircle, ChevronRight,
    Filter, ShoppingCart
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

interface EmployeeStats {
    id: number;
    name: string;
    sales_count: number;
    total_amount: number;
    total_tax: number;
    total_items: number;
}

export default function PharmacyEmployeeSales() {
    const { user } = useAuth();
    const [stats, setStats] = useState<EmployeeStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'custom'>('month');
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchStats();
    }, [dateRange, period]);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/api/reports/pharmacy-sales-by-employee?startDate=${dateRange.start}&endDate=${dateRange.end}T23:59:59`);
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            } else {
                console.error('Erro na resposta da API:', res.statusText);
            }
        } catch (err) {
            console.error('Erro ao buscar estatísticas:', err);
        } finally {
            setLoading(false);
        }
    };

    const setPeriodFilter = (p: 'today' | 'week' | 'month') => {
        const now = new Date();
        let start = new Date();
        if (p === 'today') {
            start = new Date(now.setHours(0, 0, 0, 0));
        } else if (p === 'week') {
            const day = now.getDay() || 7;
            start.setHours(0, 0, 0, 0);
            start.setDate(now.getDate() - day + 1);
        } else if (p === 'month') {
            start = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        setPeriod(p);
        setDateRange({
            start: start.toISOString().split('T')[0],
            end: new Date().toISOString().split('T')[0]
        });
    };

    const filteredStats = stats.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totals = stats.reduce((acc, s) => ({
        sales: acc.sales + s.sales_count,
        amount: acc.amount + s.total_amount,
        tax: acc.tax + s.total_tax,
        items: acc.items + s.total_items
    }), { sales: 0, amount: 0, tax: 0, items: 0 });

    const topPerformer = stats.length > 0 ? stats[0] : null;
    const lowPerformer = stats.length > 1 ? stats[stats.length - 1] : null;

    const exportCSV = () => {
        const headers = ['Funcionário', 'Nº Vendas', 'Total Vendido', 'IVA', 'Medicamentos Vendidos', 'Ticket Médio'];
        const rows = filteredStats.map(s => [
            s.name,
            s.sales_count,
            s.total_amount.toFixed(2),
            s.total_tax.toFixed(2),
            s.total_items,
            (s.total_amount / (s.sales_count || 1)).toFixed(2)
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `desempenho_farmacia_${dateRange.start}_a_${dateRange.end}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading && stats.length === 0) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-700">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-white italic tracking-tighter flex items-center gap-3">
                        <BarChart3 className="text-emerald-400" size={32} />
                        DESEMPENHO <span className="text-emerald-400">FARMÁCIA</span>
                    </h2>
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mt-2 ml-1">Relatórios por Funcionário</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                        {[
                            { id: 'today', label: 'Hoje' },
                            { id: 'week', label: 'Semana' },
                            { id: 'month', label: 'Mês' }
                        ].map(p => (
                            <button
                                key={p.id}
                                onClick={() => setPeriodFilter(p.id as any)}
                                className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${period === p.id
                                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                    : 'text-white/40 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 bg-white/5 px-4 py-2.5 rounded-2xl border border-white/5">
                        <Calendar size={14} className="text-emerald-400" />
                        <input
                            type="date"
                            className="bg-transparent border-none text-[10px] font-black text-white outline-none uppercase"
                            value={dateRange.start}
                            onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                        />
                        <span className="text-white/20 px-1">/</span>
                        <input
                            type="date"
                            className="bg-transparent border-none text-[10px] font-black text-white outline-none uppercase"
                            value={dateRange.end}
                            onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                        />
                    </div>

                    <button
                        onClick={exportCSV}
                        className="p-3 bg-white/5 border border-white/10 rounded-2xl text-white/40 hover:text-emerald-400 hover:border-emerald-500/30 transition-all group"
                        title="Exportar Excel"
                    >
                        <Download size={18} className="group-hover:scale-110 transition-transform" />
                    </button>

                    <button
                        onClick={() => window.print()}
                        className="p-3 bg-white/5 border border-white/10 rounded-2xl text-white/40 hover:text-emerald-400 hover:border-emerald-500/30 transition-all group"
                        title="Imprimir Relatório"
                    >
                        <Printer size={18} className="group-hover:scale-110 transition-transform" />
                    </button>
                </div>
            </div>

            {/* Summary Cards with Alerts */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="glass-panel p-6 rounded-[32px] border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <ShoppingCart size={64} />
                    </div>
                    <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-4">Total Vendas</p>
                    <div className="flex items-end gap-3">
                        <h3 className="text-4xl font-black text-white italic leading-none tabular-nums">{totals.sales}</h3>
                        <span className="text-[10px] font-black text-emerald-400/40 uppercase mb-1">Operações</span>
                    </div>
                </div>

                <div className="glass-panel p-6 rounded-[32px] border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <TrendingUp size={64} />
                    </div>
                    <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-4">Valor Faturado</p>
                    <div className="flex items-end gap-2">
                        <h3 className="text-4xl font-black text-emerald-400 italic leading-none tabular-nums">
                            {totals.amount.toLocaleString('pt-AO')}
                        </h3>
                        <span className="text-[10px] font-black text-emerald-400/40 uppercase mb-1">{user?.currency}</span>
                    </div>
                </div>

                {/* Top Performer Alert */}
                <div className="glass-panel p-6 rounded-[32px] border border-emerald-500/20 bg-emerald-500/[0.03] relative overflow-hidden">
                    <div className="absolute -top-2 -right-2 p-4 text-emerald-400/10 rotate-12">
                        <Award size={80} />
                    </div>
                    <p className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                        <Award size={12} /> Destaque de Vendas
                    </p>
                    {topPerformer ? (
                        <div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter truncate max-w-[150px]">
                                {topPerformer.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-[10px] font-black text-emerald-400/60 uppercase">
                                    {topPerformer.total_amount.toLocaleString('pt-AO')} {user?.currency}
                                </span>
                                <div className="w-1 h-1 rounded-full bg-emerald-500/30" />
                                <span className="text-[10px] font-black text-white/20 uppercase">Melhor</span>
                            </div>
                        </div>
                    ) : (
                        <p className="text-white/20 font-black text-[10px] uppercase">Sem dados</p>
                    )}
                </div>

                {/* Low Performer Alert */}
                <div className="glass-panel p-6 rounded-[32px] border border-red-500/20 bg-red-500/[0.03] relative overflow-hidden">
                    <div className="absolute -top-2 -right-2 p-4 text-red-400/10 rotate-12">
                        <AlertCircle size={80} />
                    </div>
                    <p className="text-[9px] font-black text-red-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                        <AlertCircle size={12} /> Menor Desempenho
                    </p>
                    {lowPerformer ? (
                        <div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter truncate max-w-[150px]">
                                {lowPerformer.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-[10px] font-black text-red-400/60 uppercase">
                                    {lowPerformer.total_amount.toLocaleString('pt-AO')} {user?.currency}
                                </span>
                                <div className="w-1 h-1 rounded-full bg-red-500/30" />
                                <span className="text-[10px] font-black text-white/20 uppercase">Atenção</span>
                            </div>
                        </div>
                    ) : (
                        <p className="text-white/20 font-black text-[10px] uppercase">Sem dados</p>
                    )}
                </div>
            </div>

            {/* Main Table */}
            <div className="glass-panel rounded-[40px] border border-white/5 overflow-hidden">
                <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white/40">
                            <Users size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-white uppercase tracking-tight">Ranking de Funcionários</h3>
                            <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.4em]">Valores baseados no período selecionado</p>
                        </div>
                    </div>

                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                        <input
                            type="text"
                            placeholder="Pesquisar funcionário..."
                            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-xs font-black text-white placeholder:text-white/10 focus:border-emerald-500/30 transition-all outline-none"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-white/[0.02]">
                                <th className="px-8 py-6 text-left text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Funcionário</th>
                                <th className="px-8 py-6 text-center text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Nº Vendas</th>
                                <th className="px-8 py-6 text-right text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Medicamentos</th>
                                <th className="px-8 py-6 text-right text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">IVA</th>
                                <th className="px-8 py-6 text-right text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Total Vendido</th>
                                <th className="px-8 py-6 text-right text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Tkt. Médio</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredStats.map((s, index) => (
                                <tr key={s.id} className="group hover:bg-white/[0.02] transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${index === 0 ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white/5 text-white/40'
                                                }`}>
                                                {index + 1}
                                            </div>
                                            <span className="text-xs font-black text-white uppercase tracking-tight">{s.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <span className="text-xs font-black text-white/60 tabular-nums">{s.sales_count}</span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-2 text-xs font-black text-white/60 tabular-nums">
                                            <Pill size={12} className="text-emerald-400/40" />
                                            {s.total_items}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <span className="text-xs font-black text-white/40 tabular-nums">{s.total_tax.toLocaleString('pt-AO')}</span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <span className="text-sm font-black text-emerald-400 tabular-nums">{s.total_amount.toLocaleString('pt-AO')}</span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <span className="text-xs font-black text-white/40 tabular-nums">
                                            {(s.total_amount / (s.sales_count || 1)).toLocaleString('pt-AO')}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {filteredStats.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4 text-white/10">
                                            <Filter size={48} />
                                            <p className="text-[10px] font-black uppercase tracking-[0.4em]">Nenhum dado para este período</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
