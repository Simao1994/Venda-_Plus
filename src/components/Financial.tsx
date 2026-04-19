import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Wallet, ArrowUpCircle, ArrowDownCircle, Plus, Search, Calendar, User, Building2, CheckCircle2, Clock, Printer, BarChart2, TrendingUp, TrendingDown } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { A4ReportTemplate } from './reports/A4ReportTemplate';
import { api } from '../lib/api';

interface Expense {
  id: number;
  supplier_id: number;
  supplier_name: string;
  description: string;
  amount: number;
  due_date: string;
  status: 'pending' | 'paid';
  created_at: string;
}

interface Receivable {
  id: number;
  customer_name: string;
  invoice_number: string;
  total: number;
  amount_paid: number;
  created_at: string;
}

interface Supplier {
  id: number;
  name: string;
}

export default function Financial() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'receivable' | 'payable' | 'cashflow'>('receivable');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid'>('all');
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [lastPayment, setLastPayment] = useState<any>(null);
  const receiptRef = React.useRef<HTMLDivElement>(null);

  const handlePrintReceipt = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: 'Recibo'
  });
  const [newExpense, setNewExpense] = useState({
    supplier_id: '',
    description: '',
    amount: '',
    due_date: new Date().toISOString().split('T')[0],
    status: 'pending'
  });

  const printRef = React.useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Venda Plus — Financeiro — ${new Date().toLocaleDateString('pt-AO')}`
  });

  useEffect(() => {
    fetchData();
  }, [activeTab, startDate, endDate, statusFilter, search]);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const res = await api.get('/api/suppliers');
      setSuppliers(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
        status: statusFilter,
        search
      });

      if (activeTab === 'cashflow') {
        const [expRes, recRes] = await Promise.all([
          api.get(`/api/expenses?${queryParams}`),
          api.get(`/api/financial/receivable?${queryParams}`)
        ]);
        setExpenses(await expRes.json());
        setReceivables(await recRes.json());
      } else if (activeTab === 'payable') {
        const res = await api.get(`/api/expenses?${queryParams}`);
        setExpenses(await res.json());
      } else {
        const res = await api.get(`/api/financial/receivable?${queryParams}`);
        setReceivables(await res.json());
      }
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/api/expenses', {
          ...newExpense,
          supplier_id: newExpense.supplier_id ? parseInt(newExpense.supplier_id) : null,
          amount: parseFloat(newExpense.amount)
      });
      if (res.ok) {
        setShowExpenseModal(false);
        setNewExpense({
          supplier_id: '',
          description: '',
          amount: '',
          due_date: new Date().toISOString().split('T')[0],
          status: 'pending'
        });
        fetchData();
      }
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  const toggleExpenseStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'pending' ? 'paid' : 'pending';
    try {
      await api.patch(`/api/expenses/${id}/status`, { status: newStatus });
      fetchData();
    } catch (error) {
      console.error('Error updating expense status:', error);
    }
  };

  const handleSettleReceivable = async (r: Receivable) => {
    const amount = r.total - r.amount_paid;
    if (confirm(`Confirmar recebimento de ${amount.toLocaleString()} ${user?.currency} para fatura ${r.invoice_number}?`)) {
      try {
        const res = await api.post('/api/payments', {
            sale_id: r.id,
            amount: amount,
            payment_method: 'dinheiro'
        });
        if (res.ok) {
          const paymentData = await res.json();
          setLastPayment({
            ...paymentData,
            customer_name: r.customer_name,
            amount,
            date: new Date().toLocaleDateString()
          });
          fetchData();
          // Small delay to allow state update before printing
          setTimeout(() => handlePrintReceipt(), 500);
        }
      } catch (error) {
        console.error('Error settling receivable:', error);
      }
    }
  };

  const totalReceivable = receivables.reduce((sum, r) => sum + (r.total - r.amount_paid), 0);
  const totalPayable = expenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0);
  const totalReceived = receivables.reduce((sum, r) => sum + r.amount_paid, 0);
  const totalPaid = expenses.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalReceived - totalPaid;

  // Real-time chart data based on loaded items
  const chartData = [
    { name: 'Previsto', entrada: totalReceived + totalReceivable, saida: totalPaid + totalPayable },
    { name: 'Efetivo', entrada: totalReceived, saida: totalPaid },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto relative z-10">
      {/* Hidden Printable A4 Report */}
      <div style={{ display: 'none' }}>
        <A4ReportTemplate
          ref={printRef}
          title={activeTab === 'receivable' ? 'Fluxo de Recebimentos' : activeTab === 'payable' ? 'Fluxo de Obrigações' : 'Mapa de Fluxo de Caixa'}
          subtitle={`Período: ${new Date(startDate).toLocaleDateString('pt-AO')} a ${new Date(endDate).toLocaleDateString('pt-AO')}`}
          companyData={user}
          orientation="landscape"
        >
          {activeTab === 'receivable' ? (
            <table className="a4-table">
              <thead>
                <tr>
                  <th>Cliente & Fatura</th>
                  <th>Data</th>
                  <th className="text-right">Volume Total</th>
                  <th className="text-right">Valor Recolhido</th>
                  <th className="text-right">Saldo Residual</th>
                  <th className="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {receivables.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div className="font-bold">{r.customer_name}</div>
                      <div style={{ fontSize: '9px', color: '#555' }}>{r.invoice_number}</div>
                    </td>
                    <td>{new Date(r.created_at).toLocaleDateString('pt-AO')}</td>
                    <td className="text-right">{r.total.toLocaleString('pt-AO')}</td>
                    <td className="text-right text-[#10b981] font-bold">{r.amount_paid.toLocaleString('pt-AO')}</td>
                    <td className="text-right text-[#ef4444] font-bold">{(r.total - r.amount_paid).toLocaleString('pt-AO')}</td>
                    <td className="text-center font-bold" style={{ color: r.amount_paid >= r.total ? '#10b981' : '#f59e0b' }}>
                      {r.amount_paid >= r.total ? 'Liquidado' : 'Pendente'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2} className="text-right">TOTAIS R$:</td>
                  <td className="text-right font-bold">{receivables.reduce((sum, r) => sum + r.total, 0).toLocaleString('pt-AO')}</td>
                  <td className="text-right font-bold text-[#10b981]">{totalReceived.toLocaleString('pt-AO')}</td>
                  <td className="text-right font-bold text-[#ef4444]">{totalReceivable.toLocaleString('pt-AO')}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          ) : activeTab === 'cashflow' ? (
            <table className="a4-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Descrição / Entidade</th>
                  <th className="text-right">Entradas</th>
                  <th className="text-right">Saídas</th>
                  <th className="text-right">Saldo Acumulado</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ...receivables.map(r => ({ date: r.created_at, desc: r.customer_name, ref: r.invoice_number, entrada: r.amount_paid, saida: 0, status: r.amount_paid >= r.total ? 'Liquidado' : 'Pendente' })),
                  ...expenses.map(e => ({ date: e.due_date, desc: e.description, ref: e.supplier_name, entrada: 0, saida: e.status === 'paid' ? e.amount : 0, status: e.status === 'paid' ? 'Liquidado' : 'Pendente' }))
                ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((m, i, arr) => {
                    const totalAnterior = arr.slice(i + 1).reduce((acc, curr) => acc + (curr.entrada - curr.saida), 0);
                    const saldoAcumulado = totalAnterior + (m.entrada - m.saida);
                    return (
                      <tr key={i}>
                        <td>{new Date(m.date).toLocaleDateString('pt-AO')}</td>
                        <td>
                          <div className="font-bold">{m.desc}</div>
                          <div style={{ fontSize: '9px', color: '#555' }}>{m.ref || 'S/ Ref'}</div>
                        </td>
                        <td className="text-right font-bold text-[#10b981]">{m.entrada > 0 ? m.entrada.toLocaleString('pt-AO') : '-'}</td>
                        <td className="text-right font-bold text-[#ef4444]">{m.saida > 0 ? m.saida.toLocaleString('pt-AO') : '-'}</td>
                        <td className="text-right font-bold text-[#d4af37]">{saldoAcumulado.toLocaleString('pt-AO')}</td>
                      </tr>
                    );
                  })
                }
              </tbody>
            </table>
          ) : (
            <table className="a4-table">
              <thead>
                <tr>
                  <th>Descrição / Vetor</th>
                  <th>Vencimento</th>
                  <th className="text-right">Volume</th>
                  <th className="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <div className="font-bold">{e.description}</div>
                      <div style={{ fontSize: '9px', color: '#555' }}>{e.supplier_name || 'Sem Fornecedor Originário'}</div>
                    </td>
                    <td>{new Date(e.due_date).toLocaleDateString('pt-AO')}</td>
                    <td className="text-right font-bold">{e.amount.toLocaleString('pt-AO')}</td>
                    <td className="text-center font-bold" style={{ color: e.status === 'paid' ? '#10b981' : '#ef4444' }}>
                      {e.status === 'paid' ? 'Liquidado' : 'Pendente'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2} className="text-right">TOTAIS R$:</td>
                  <td className="text-right font-bold">{expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString('pt-AO')}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          )}
        </A4ReportTemplate>
      </div>

      <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
            Gestão <span className="text-gold-gradient">Financeira</span>
          </h1>
          <p className="text-white/40 font-black text-[10px] uppercase tracking-[0.3em] mt-2 italic">Controle total do fluxo de caixa e obrigações</p>
        </div>
        <button
          onClick={() => handlePrint()}
          className="glass-panel text-white/60 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:text-gold-primary transition-all border border-white/5 active:scale-95 shadow-xl"
        >
          <Printer size={16} />
          Imprimir Relatório
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <div className="glass-panel p-10 rounded-[40px] border border-white/5 flex items-center gap-8 relative overflow-hidden group hover:border-gold-primary/20 transition-all shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/[0.02] rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
          <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-[2rem] flex items-center justify-center border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
            <ArrowUpCircle size={36} />
          </div>
          <div>
            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-2 font-display">Total a Receber</p>
            <p className="text-4xl font-black text-white tracking-tighter italic">
              {totalReceivable.toLocaleString()} <span className="text-sm font-bold text-emerald-500/60 ml-2">{user?.currency}</span>
            </p>
          </div>
        </div>
        <div className="glass-panel p-10 rounded-[40px] border border-white/5 flex items-center gap-8 relative overflow-hidden group hover:border-gold-primary/20 transition-all shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/[0.02] rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
          <div className={`w-20 h-20 ${netProfit >= 0 ? 'bg-blue-500/10 text-blue-500 border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.1)]' : 'bg-red-500/10 text-red-500 border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.1)]'} rounded-[2rem] flex items-center justify-center border transition-all`}>
            {netProfit >= 0 ? <TrendingUp size={36} /> : <TrendingDown size={36} />}
          </div>
          <div>
            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-2 font-display">Lucro Líquido Realizado</p>
            <p className={`text-4xl font-black text-white tracking-tighter italic`}>
              <span className={netProfit >= 0 ? 'text-white' : 'text-red-400'}>{netProfit.toLocaleString()}</span>
              <span className="text-sm font-bold opacity-30 ml-2">{user?.currency}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Analytics Chart */}
      <div className="glass-panel p-10 rounded-[40px] border border-white/5 shadow-3xl mb-10 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gold-primary/20 to-transparent opacity-50" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 relative z-10">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] flex items-center gap-4 italic">
              <BarChart2 size={20} className="text-gold-primary animate-pulse" />
              Dynamic Cash Flow <span className="text-gold-gradient tracking-tighter italic font-black">Velocity</span>
            </h3>
            <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] mt-2 ml-9">Real-time analytical vector analysis</p>
          </div>
          <div className="flex gap-8 bg-white/5 p-4 rounded-2xl border border-white/5 shadow-inner">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_10px_#10B981]"></div>
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest text-left">Inflow Stream</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full shadow-[0_0_10px_#EF4444]"></div>
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest text-left">Outflow Vector</span>
            </div>
          </div>
        </div>
        <div className="h-[350px] w-full relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorEntrada" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSaida" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fontWeight: 900, fill: 'rgba(255,255,255,0.2)', letterSpacing: '0.2em' }}
                dy={15}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fontWeight: 900, fill: 'rgba(255,255,255,0.2)' }}
              />
              <Tooltip
                contentStyle={{
                  background: 'rgba(11,11,11,0.9)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '24px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                  padding: '20px'
                }}
                itemStyle={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                labelStyle={{ color: 'rgba(255,255,255,0.2)', marginBottom: '8px', fontSize: '9px', fontWeight: '900', textTransform: 'uppercase' }}
              />
              <Area
                type="monotone"
                dataKey="entrada"
                name="Entradas"
                stroke="#10b981"
                strokeWidth={5}
                fillOpacity={1}
                fill="url(#colorEntrada)"
              />
              <Area
                type="monotone"
                dataKey="saida"
                name="Saídas"
                stroke="#ef4444"
                strokeWidth={5}
                fillOpacity={1}
                fill="url(#colorSaida)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-panel p-3 rounded-[32px] border border-white/5 mb-10 flex flex-wrap items-center gap-4 shadow-2xl relative z-20">
        <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/5">
          <div className="flex items-center gap-3 px-4 py-2 bg-bg-deep rounded-xl border border-white/5 shadow-inner group">
            <Calendar size={12} className="text-gold-primary/40 group-focus-within:text-gold-primary transition-colors" />
            <input
              type="date"
              className="bg-transparent border-none focus:ring-0 font-black text-[11px] text-white/80 outline-none w-28 uppercase tracking-tighter"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>
          <div className="w-4 h-[1px] bg-white/10" />
          <div className="flex items-center gap-3 px-4 py-2 bg-bg-deep rounded-xl border border-white/5 shadow-inner group">
            <Calendar size={12} className="text-gold-primary/40 group-focus-within:text-gold-primary transition-colors" />
            <input
              type="date"
              className="bg-transparent border-none focus:ring-0 font-black text-[11px] text-white/80 outline-none w-28 uppercase tracking-tighter"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 min-w-[200px] relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gold-primary/40 group-focus-within:text-gold-primary transition-colors" size={16} />
          <input
            type="text"
            className="w-full pl-14 pr-6 py-4.5 bg-white/5 border border-white/5 rounded-2xl focus:bg-white/[0.08] focus:border-gold-primary/30 focus:ring-4 focus:ring-gold-primary/5 font-black text-[11px] text-white placeholder:text-white/20 outline-none transition-all uppercase tracking-[0.1em] shadow-inner"
            placeholder="Pesquisar registros..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <select
          className="bg-white/5 border border-white/5 p-4.5 px-8 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-white/60 outline-none focus:ring-2 focus:ring-gold-primary/30 transition-all appearance-none cursor-pointer shadow-inner pr-12 min-w-[180px]"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as any)}
          style={{ backgroundPosition: 'calc(100% - 20px) 50%' }}
        >
          <option value="all" className="bg-bg-deep text-white">Todos os Estados</option>
          <option value="pending" className="bg-bg-deep text-white">Pendentes</option>
          <option value="paid" className="bg-bg-deep text-white">Pagos</option>
        </select>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-4 mb-10 relative z-10">
        <button
          onClick={() => setActiveTab('receivable')}
          className={`flex-1 min-w-[160px] flex flex-col items-center gap-3 p-6 rounded-[32px] border transition-all group ${activeTab === 'receivable'
            ? 'bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_40px_rgba(16,185,129,0.1)]'
            : 'bg-white/5 border-white/5 grayscale opacity-40 hover:opacity-100 hover:grayscale-0'
            }`}
        >
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${activeTab === 'receivable' ? 'bg-emerald-500 text-bg-deep' : 'bg-white/5 text-emerald-500/40'}`}>
            <ArrowUpCircle size={24} />
          </div>
          <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${activeTab === 'receivable' ? 'text-emerald-500' : 'text-white/20'}`}>Accounts Receivable</span>
        </button>

        <button
          onClick={() => setActiveTab('payable')}
          className={`flex-1 min-w-[160px] flex flex-col items-center gap-3 p-6 rounded-[32px] border transition-all group ${activeTab === 'payable'
            ? 'bg-red-500/10 border-red-500/20 shadow-[0_0_40px_rgba(239,68,68,0.1)]'
            : 'bg-white/5 border-white/5 grayscale opacity-40 hover:opacity-100 hover:grayscale-0'
            }`}
        >
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${activeTab === 'payable' ? 'bg-red-500 text-bg-deep' : 'bg-white/5 text-red-500/40'}`}>
            <ArrowDownCircle size={24} />
          </div>
          <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${activeTab === 'payable' ? 'text-red-500' : 'text-white/20'}`}>Accounts Payable</span>
        </button>

        <button
          onClick={() => setActiveTab('cashflow')}
          className={`flex-1 min-w-[160px] flex flex-col items-center gap-3 p-6 rounded-[32px] border transition-all group ${activeTab === 'cashflow'
            ? 'bg-gold-primary/10 border-gold-primary/20 shadow-[0_0_40px_rgba(212,175,55,0.1)]'
            : 'bg-white/5 border-white/5 grayscale opacity-40 hover:opacity-100 hover:grayscale-0'
            }`}
        >
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${activeTab === 'cashflow' ? 'bg-gold-primary text-bg-deep' : 'bg-white/5 text-gold-primary/40'}`}>
            <Wallet size={24} />
          </div>
          <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${activeTab === 'cashflow' ? 'text-gold-primary' : 'text-white/20'}`}>Financial Flow</span>
        </button>
      </div>

      {/* Content */}
      <div className="glass-panel rounded-[40px] border border-white/5 shadow-3xl overflow-hidden print:shadow-none print:bg-white print:border-none relative z-10 transition-all">
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02] print:bg-white print:border-b-2 print:border-bg-deep">
          <h2 className="font-black text-white uppercase tracking-widest text-sm flex items-center gap-4 italic italic">
            <div className={`w-2 h-2 rounded-full ${activeTab === 'receivable' ? 'bg-emerald-500 shadow-[0_0_10px_#10B981]' : activeTab === 'payable' ? 'bg-red-500 shadow-[0_0_10px_#EF4444]' : 'bg-gold-primary shadow-[0_0_10px_#D4AF37]'}`} />
            {activeTab === 'receivable' ? 'Fluxo de Recebimentos' : activeTab === 'payable' ? 'Fluxo de Obrigações' : 'Mapa de Fluxo de Caixa'}
          </h2>

          {activeTab === 'payable' && (
            <button
              onClick={() => setShowExpenseModal(true)}
              className="bg-gold-primary text-bg-deep px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all print:hidden"
            >
              <Plus size={16} />
              Nova Conta
            </button>
          )}
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          {loading ? (
            <div className="p-32 text-center">
              <div className="w-12 h-12 border-4 border-gold-primary border-t-transparent rounded-full animate-spin mx-auto mb-6 shadow-[0_0_20px_rgba(212,175,55,0.1)]"></div>
              <p className="text-[10px] font-black text-gold-primary uppercase tracking-[0.5em] animate-pulse italic">Processando Banco de Dados Financeiro...</p>
            </div>
          ) : activeTab === 'receivable' ? (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/[0.03] text-[9px] font-black text-white/30 uppercase tracking-[0.2em] border-b border-white/5">
                  <th className="px-8 py-6">IDENTIFICAÇÃO / RASTREIO</th>
                  <th className="px-8 py-6">DATA</th>
                  <th className="px-8 py-6 text-right">VOLUME TOTAL</th>
                  <th className="px-8 py-6 text-right">VALOR RECOLHIDO</th>
                  <th className="px-8 py-6 text-right font-black">SALDO RESIDUAL</th>
                  <th className="px-8 py-6 text-center">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {receivables.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-gold-primary/[0.02] transition-colors group"
                  >
                    <td className="px-8 py-6">
                      <p className="font-black text-white text-xs uppercase tracking-tight group-hover:text-gold-primary transition-colors">{r.customer_name}</p>
                      <p className="text-[9px] font-black text-white/20 mt-1 uppercase tracking-widest">{r.invoice_number}</p>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-[11px] font-black text-white/60 tabular-nums">{new Date(r.created_at).toLocaleDateString()}</p>
                    </td>
                    <td className="px-8 py-6 text-right font-black text-white tabular-nums">
                      {r.total.toLocaleString()}
                    </td>
                    <td className="px-8 py-6 text-right font-black text-emerald-400 tabular-nums">
                      {r.amount_paid.toLocaleString()}
                    </td>
                    <td className="px-8 py-6 text-right font-black text-red-400 tabular-nums bg-red-400/[0.02]">
                      {(r.total - r.amount_paid).toLocaleString()}
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className="flex items-center justify-center gap-4">
                        <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border ${r.amount_paid >= r.total ? 'border-emerald-500/20 text-emerald-500 bg-emerald-500/5' : 'border-amber-500/20 text-amber-500 bg-amber-500/5'}`}>
                          {r.amount_paid >= r.total ? 'Liquidado' : 'Pendente'}
                        </span>

                        {r.amount_paid < r.total && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSettleReceivable(r);
                            }}
                            className="w-10 h-10 bg-gold-primary/10 text-gold-primary rounded-xl hover:bg-gold-primary hover:text-bg-deep transition-all border border-gold-primary/20 shadow-lg flex items-center justify-center group/btn print:hidden"
                            title="Recolher Pagamento"
                          >
                            <CheckCircle2 size={18} className="group-hover/btn:scale-110 transition-transform" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {receivables.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-8 py-24 text-center">
                      <p className="text-[10px] font-black text-white/10 uppercase tracking-[0.4em]">Protocolo de busca concluído: Nenhum registro localizado</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : activeTab === 'cashflow' ? (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/[0.03] text-[9px] font-black text-white/30 uppercase tracking-[0.2em] border-b border-white/5">
                  <th className="px-8 py-6">DATA</th>
                  <th className="px-8 py-6">DESCRIÇÃO / ENTIDADE</th>
                  <th className="px-8 py-6 text-right">ENTRADAS</th>
                  <th className="px-8 py-6 text-right">SAÍDAS</th>
                  <th className="px-8 py-6 text-right font-black">SALDO ACUM.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  ...receivables.map(r => ({ date: r.created_at, desc: r.customer_name, ref: r.invoice_number, entrada: r.amount_paid, saida: 0, status: r.amount_paid >= r.total ? 'Liquidado' : 'Pendente' })),
                  ...expenses.map(e => ({ date: e.due_date, desc: e.description, ref: e.supplier_name, entrada: 0, saida: e.status === 'paid' ? e.amount : 0, status: e.status === 'paid' ? 'Liquidado' : 'Pendente' }))
                ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((m, i, arr) => {
                    const totalAnterior = arr.slice(i + 1).reduce((acc, curr) => acc + (curr.entrada - curr.saida), 0);
                    const saldoAcumulado = totalAnterior + (m.entrada - m.saida);
                    return (
                      <tr key={i} className="hover:bg-gold-primary/[0.02] transition-colors group">
                        <td className="px-8 py-6">
                          <p className="text-[11px] font-black text-white/60 tabular-nums">{new Date(m.date).toLocaleDateString()}</p>
                        </td>
                        <td className="px-8 py-6">
                          <p className="font-black text-white text-xs uppercase tracking-tight group-hover:text-gold-primary transition-colors">{m.desc}</p>
                          <p className="text-[9px] font-black text-white/20 mt-1 uppercase tracking-widest">{m.ref || 'S/ Ref'}</p>
                        </td>
                        <td className="px-8 py-6 text-right font-black text-emerald-400 tabular-nums">
                          {m.entrada > 0 ? m.entrada.toLocaleString() : '-'}
                        </td>
                        <td className="px-8 py-6 text-right font-black text-red-400 tabular-nums">
                          {m.saida > 0 ? m.saida.toLocaleString() : '-'}
                        </td>
                        <td className="px-8 py-6 text-right font-black text-gold-primary tabular-nums bg-gold-primary/[0.02]">
                          {saldoAcumulado.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })
                }
                {receivables.length === 0 && expenses.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-8 py-24 text-center">
                      <p className="text-[10px] font-black text-white/10 uppercase tracking-[0.4em]">Protocolo de busca concluído: Nenhum movimento localizado</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/[0.03] text-[9px] font-black text-white/30 uppercase tracking-[0.2em] border-b border-white/5">
                  <th className="px-8 py-6">DESCRIÇÃO / VETOR</th>
                  <th className="px-8 py-6">VENCIMENTO</th>
                  <th className="px-8 py-6 text-right">ALOCAÇÃO</th>
                  <th className="px-8 py-6 text-center">STATUS</th>
                  <th className="px-8 py-6 text-right print:hidden">COMANDOS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-gold-primary/[0.02] transition-colors group">
                    <td className="px-8 py-6">
                      <p className="font-black text-white text-xs uppercase tracking-tight group-hover:text-gold-primary transition-colors">{e.description}</p>
                      <p className="text-[9px] font-black text-white/20 mt-1 uppercase tracking-widest">{e.supplier_name || 'Sem Fornecedor Originário'}</p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <Calendar size={14} className="text-white/20" />
                        <p className="text-[11px] font-black text-white/60 tabular-nums">{new Date(e.due_date).toLocaleDateString()}</p>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right font-black text-white tabular-nums italic">
                      {e.amount.toLocaleString()}
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border ${e.status === 'paid' ? 'border-emerald-500/20 text-emerald-500 bg-emerald-500/5' : 'border-red-500/20 text-red-500 bg-red-500/5'}`}>
                        {e.status === 'paid' ? 'Liquidado' : 'Pendente'}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right print:hidden">
                      <button
                        onClick={() => toggleExpenseStatus(e.id, e.status)}
                        className={`w-10 h-10 rounded-xl transition-all border flex items-center justify-center group/btn shadow-lg ${e.status === 'paid' ? 'text-white/20 border-white/5 hover:text-red-400 hover:border-red-400/20' : 'text-emerald-500 border-emerald-500/10 hover:bg-emerald-500 hover:text-bg-deep'}`}
                        title={e.status === 'paid' ? 'Revogar Liquidação' : 'Confirmar Liquidação'}
                      >
                        {e.status === 'paid' ? <Clock size={18} /> : <CheckCircle2 size={18} />}
                      </button>
                    </td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-8 py-24 text-center">
                      <p className="text-[10px] font-black text-white/10 uppercase tracking-[0.4em]">Protocolo de busca concluído: Nenhum registro localizado</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* New Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-bg-deep/80 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
          <div className="glass-panel rounded-[40px] w-full max-w-md overflow-hidden shadow-2xl border border-white/10 relative">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-gold-primary/40 to-transparent" />

            <div className="p-10 border-b border-white/5 bg-gold-primary/[0.02] text-center">
              <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Nova <span className="text-gold-gradient">Obrigação</span></h3>
              <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mt-3">Alocação de recursos financeiros</p>
            </div>

            <form onSubmit={handleAddExpense} className="p-10 space-y-6">
              <div className="glass-panel p-4 rounded-2xl border border-white/5 focus-within:border-gold-primary/30 transition-all">
                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-2">Descrição da Alocação</label>
                <input
                  required
                  type="text"
                  className="w-full bg-transparent border-none outline-none font-black text-white uppercase tracking-tight placeholder:text-white/5"
                  placeholder="EX: PAGAMENTO DE SOFTWARE, LOGÍSTICA..."
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="glass-panel p-4 rounded-2xl border border-white/5 focus-within:border-gold-primary/30 transition-all">
                  <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-2">Volume ({user?.currency})</label>
                  <input
                    required
                    type="number"
                    className="w-full bg-transparent border-none outline-none font-black text-white tabular-nums tracking-tighter text-xl"
                    placeholder="0.00"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  />
                </div>
                <div className="glass-panel p-4 rounded-2xl border border-white/5 focus-within:border-gold-primary/30 transition-all">
                  <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-2">Limite Temporal</label>
                  <input
                    required
                    type="date"
                    className="w-full bg-transparent border-none outline-none font-black text-white text-xs uppercase tracking-widest"
                    value={newExpense.due_date}
                    onChange={(e) => setNewExpense({ ...newExpense, due_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="glass-panel p-4 rounded-2xl border border-white/5 focus-within:border-gold-primary/30 transition-all">
                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-2">Originário (Fornecedor)</label>
                <select
                  className="w-full bg-transparent border-none outline-none font-black text-white/60 text-[10px] uppercase tracking-widest appearance-none cursor-pointer"
                  value={newExpense.supplier_id}
                  onChange={(e) => setNewExpense({ ...newExpense, supplier_id: e.target.value })}
                >
                  <option value="" className="bg-bg-deep text-white">Selecione o Originário</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id} className="bg-bg-deep text-white">{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-6 flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="flex-1 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white/30 border border-white/5 hover:bg-white/5 transition-all"
                >
                  Abortar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-5 bg-gradient-to-r from-gold-primary to-gold-secondary text-bg-deep rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] transition-all active:scale-95 shadow-2xl"
                >
                  Confirmar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Receipt Template (Hidden) */}
      <div style={{ display: 'none' }}>
        <div ref={receiptRef} className="receipt-container" style={{
          width: '80mm',
          padding: '2mm 4mm',
          backgroundColor: 'white',
          color: 'black',
          fontFamily: "'Times New Roman', Times, serif",
          fontSize: '12px'
        }}>
          <div className="text-center" style={{ textAlign: 'center', marginBottom: '8px' }}>
            <h2 style={{ fontWeight: '900', fontSize: '14px', textTransform: 'uppercase', margin: '0' }}>{user?.company_name}</h2>
            <p style={{ margin: '2px 0', fontSize: '10px' }}>NIF: {user?.nif || '---'}</p>
            <p style={{ margin: '2px 0', fontSize: '10px' }}>RECIBO DE PAGAMENTO (RE)</p>
          </div>
          <div style={{ borderTop: '1px dashed black', borderBottom: '1px dashed black', padding: '4px 0', marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>RE Nº:</span>
              <span style={{ fontWeight: 'bold' }}>{lastPayment?.document_number || lastPayment?.id || '---'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>DATA/HORA:</span>
              <span style={{ fontWeight: 'bold' }}>
                {lastPayment?.created_at ?
                  new Date(lastPayment.created_at).toLocaleString('pt-AO', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  }) : lastPayment?.date}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>CLIENTE:</span>
              <span style={{ fontWeight: 'bold' }}>{lastPayment?.customer_name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>NIF CLIENTE:</span>
              <span style={{ fontWeight: 'bold' }}>{lastPayment?.customer_nif || '999999999'}</span>
            </div>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <p style={{ margin: '0 0 5px 0' }}>Recebemos a quantia de:</p>
            <p style={{ fontWeight: 'bold', fontSize: '14px', margin: '0' }}>{lastPayment?.amount?.toLocaleString()} {user?.currency}</p>
            <p style={{ fontSize: '10px', marginTop: '5px' }}>Referente à liquidação da fatura associada à transação.</p>
          </div>
          <div style={{ borderTop: '1px dashed black', paddingTop: '5px', textAlign: 'center', fontSize: '10px' }}>
            <p style={{ margin: '0', fontWeight: 'bold' }}>Emitido por programa validado n.º 0000/AGT/2026</p>
            <p style={{ margin: '2px 0 0 0', opacity: 0.7 }}>Obrigado pela preferência!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
