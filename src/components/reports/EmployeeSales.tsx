import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import {
    BarChart,
    Users,
    Calendar as CalendarIcon,
    Printer,
    Download,
    TrendingUp,
    CreditCard,
    DollarSign
} from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

interface EmployeeStat {
    funcionario_id: number;
    nome_funcionario: string;
    numero_vendas: number;
    total_vendido: number;
    iva_gerado: number;
    media_por_venda: number;
}

export default function EmployeeSales() {
    const { user } = useAuth();
    const [stats, setStats] = useState<EmployeeStat[]>([]);
    const [loading, setLoading] = useState(false);

    const [period, setPeriod] = useState('diario');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    const reportRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        contentRef: reportRef,
        pageStyle: `@page { size: A4 portrait; margin: 15mm; }`,
        documentTitle: `Relatorio_Vendas_Funcionarios_${new Date().toISOString().split('T')[0]}`
    });

    const generateDateRange = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endToday = new Date(today);
        endToday.setHours(23, 59, 59, 999);

        if (period === 'diario') {
            return { start: today.toISOString(), end: endToday.toISOString() };
        }
        if (period === 'semanal') {
            const start = new Date(today);
            start.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1)); // Start of week (Monday)
            return { start: start.toISOString(), end: endToday.toISOString() };
        }
        if (period === 'mensal') {
            const start = new Date(today.getFullYear(), today.getMonth(), 1);
            return { start: start.toISOString(), end: endToday.toISOString() };
        }
        if (period === 'personalizado' && customStart && customEnd) {
            const start = new Date(customStart);
            start.setHours(0, 0, 0, 0);
            const end = new Date(customEnd);
            end.setHours(23, 59, 59, 999);
            return { start: start.toISOString(), end: end.toISOString() };
        }

        // Default to everything
        return { start: '', end: '' };
    };

    const fetchStats = async () => {
        setLoading(true);
        try {
            const { start, end } = generateDateRange();
            let url = '/api/reports/sales-by-employee';
            if (start && end) {
                url += `?startDate=${start}&endDate=${end}`;
            }

            const res = await api.get(url);
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Erro ao buscar relatorio de funcionarios:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [period, customStart, customEnd]);

    const handleExportCSV = () => {
        const headers = ['Funcionário', 'Número de Vendas', 'Total Vendido', 'IVA Gerado', 'Média por Venda'];
        const csvContent = [
            headers.join(';'),
            ...stats.map(s => [
                s.nome_funcionario,
                s.numero_vendas,
                s.total_vendido.toFixed(2),
                s.iva_gerado.toFixed(2),
                s.media_por_venda.toFixed(2)
            ].join(';'))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.setAttribute('download', `Vendas_Funcionarios_${period}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const totals = stats.reduce((acc, curr) => ({
        vendas: acc.vendas + curr.numero_vendas,
        total: acc.total + curr.total_vendido,
        iva: acc.iva + curr.iva_gerado
    }), { vendas: 0, total: 0, iva: 0 });

    return (
        <div className="p-8 h-full flex flex-col font-sans relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic">Relatório de <span className="text-gold-gradient">Funcionários</span></h1>
                    <p className="text-white/40 font-black text-[10px] uppercase tracking-widest mt-1">Análise de Performance e Vendas Diárias</p>
                </div>

                <div className="flex bg-white/5 rounded-2xl p-1 border border-white/5">
                    {['diario', 'semanal', 'mensal', 'personalizado'].map(p => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${period === p ? 'bg-gold-primary text-bg-deep shadow-lg' : 'text-white/60 hover:text-white'
                                }`}
                        >
                            {p === 'diario' ? 'Diário' : p === 'semanal' ? 'Semanal' : p === 'mensal' ? 'Mensal' : 'Personalizado'}
                        </button>
                    ))}
                </div>
            </div>

            {period === 'personalizado' && (
                <div className="flex gap-4 mb-6">
                    <input
                        type="date"
                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white font-black text-[10px] uppercase outline-none focus:border-gold-primary/50"
                        value={customStart}
                        onChange={(e) => setCustomStart(e.target.value)}
                    />
                    <input
                        type="date"
                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white font-black text-[10px] uppercase outline-none focus:border-gold-primary/50"
                        value={customEnd}
                        onChange={(e) => setCustomEnd(e.target.value)}
                    />
                </div>
            )}

            {/* Métricas Topo */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="glass-panel p-6 rounded-3xl border border-white/5">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gold-primary/10 border border-gold-primary/20 flex items-center justify-center text-gold-primary">
                            <CreditCard size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none">Total Faturado</p>
                            <h3 className="text-xl font-black text-white italic tracking-tighter mt-1">{totals.total.toLocaleString()} <span className="text-[10px] font-bold text-gold-primary">{user?.currency}</span></h3>
                        </div>
                    </div>
                </div>

                <div className="glass-panel p-6 rounded-3xl border border-white/5">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none">Total Operações</p>
                            <h3 className="text-xl font-black text-white italic tracking-tighter mt-1">{totals.vendas.toLocaleString()} <span className="text-[10px] font-bold text-indigo-400">VENDAS</span></h3>
                        </div>
                    </div>
                </div>

                <div className="glass-panel p-6 rounded-3xl border border-white/5">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
                            <DollarSign size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none">Média Global / Venda</p>
                            <h3 className="text-xl font-black text-white italic tracking-tighter mt-1">
                                {(totals.vendas > 0 ? (totals.total / totals.vendas) : 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                <span className="text-[10px] font-bold text-green-400 ml-1">{user?.currency}</span>
                            </h3>
                        </div>
                    </div>
                </div>

                <div className="glass-panel p-6 rounded-3xl border border-white/5">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                            <BarChart size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none">IVA Consolidado</p>
                            <h3 className="text-xl font-black text-white italic tracking-tighter mt-1">{totals.iva.toLocaleString()} <span className="text-[10px] font-bold text-red-400">{user?.currency}</span></h3>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 glass-panel rounded-3xl border border-white/5 overflow-hidden flex flex-col">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                    <h2 className="text-lg font-black text-white uppercase tracking-widest mb-0 flex items-center gap-3">
                        <Users className="text-gold-primary" size={20} />
                        Desempenho da Equipa
                    </h2>
                    <div className="flex gap-3">
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black text-white uppercase tracking-widest transition-all"
                        >
                            <Download size={14} /> CSV
                        </button>
                        <button
                            onClick={() => handlePrint()}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gold-primary to-gold-secondary text-bg-deep rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg transition-all"
                        >
                            <Printer size={14} /> PDF
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto" ref={reportRef}>
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.03]">
                                <th className="px-6 py-4 text-[10px] font-black text-gold-primary/60 uppercase tracking-widest w-16">#</th>
                                <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest">Funcionário / Operador</th>
                                <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest text-center">Nº Vendas</th>
                                <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest text-right">Total Vendido</th>
                                <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest text-right">IVA Gerado</th>
                                <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest text-right">Ticket Médio</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-white/40 font-black uppercase tracking-widest">A Carregar Dados...</td>
                                </tr>
                            ) : stats.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-white/40 font-black uppercase tracking-widest">Sem vendas no período selecionado</td>
                                </tr>
                            ) : (
                                stats.map((stat, idx) => (
                                    <tr key={stat.funcionario_id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-4 font-black text-[12px] text-white/20">{idx + 1}</td>
                                        <td className="px-6 py-4 font-black text-sm text-white uppercase tracking-tight group-hover:text-gold-primary transition-colors">{stat.nome_funcionario}</td>
                                        <td className="px-6 py-4 font-black text-xs text-center text-indigo-300 bg-indigo-500/5">{stat.numero_vendas}</td>
                                        <td className="px-6 py-4 font-black text-right italic text-lg tracking-tighter text-white">
                                            {stat.total_vendido.toLocaleString()} <span className="text-[9px] text-gold-primary ml-1">{user?.currency}</span>
                                        </td>
                                        <td className="px-6 py-4 font-black text-right text-xs text-red-300">{stat.iva_gerado.toLocaleString()}</td>
                                        <td className="px-6 py-4 font-black text-right text-xs text-green-400">{stat.media_por_venda.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
