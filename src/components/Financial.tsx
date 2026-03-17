import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Wallet, ArrowUpCircle, ArrowDownCircle, Plus, Search, Calendar, User, Building2, CheckCircle2, Clock, Printer, BarChart2, TrendingUp, TrendingDown } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

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
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'receivable' | 'payable'>('receivable');
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
    pageStyle: `
      @page {
        size: A4;
        margin: 20mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
        }
      }
    `
  });

  useEffect(() => {
    fetchData();
  }, [activeTab, startDate, endDate, statusFilter, search]);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const res = await fetch('/api/suppliers', { headers: { Authorization: `Bearer ${token}` } });
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

      if (activeTab === 'payable') {
        const res = await fetch(`/api/expenses?${queryParams}`, { headers: { Authorization: `Bearer ${token}` } });
        setExpenses(await res.json());
      } else {
        const res = await fetch(`/api/financial/receivable?${queryParams}`, { headers: { Authorization: `Bearer ${token}` } });
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
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newExpense,
          supplier_id: newExpense.supplier_id ? parseInt(newExpense.supplier_id) : null,
          amount: parseFloat(newExpense.amount)
        })
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
      await fetch(`/api/expenses/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      fetchData();
    } catch (error) {
      console.error('Error updating expense status:', error);
    }
  };

  const handleSettleReceivable = async (r: Receivable) => {
    const amount = r.total - r.amount_paid;
    if (confirm(`Confirmar recebimento de ${amount.toLocaleString()} ${user?.currency} para fatura ${r.invoice_number}?`)) {
      try {
        const res = await fetch('/api/payments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            sale_id: r.id,
            amount: amount,
            payment_method: 'dinheiro'
          })
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
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
            <BarChart2 size={18} className="text-emerald-600" />
            Fluxo de Caixa (Anual)
          </h3>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Entradas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Saídas</span>
            </div>
          </div>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorEntrada" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSaida" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fontWeight: 900, fill: '#64748b' }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
              />
              <Tooltip
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '12px' }}
                itemStyle={{ fontSize: '12px', fontWeight: '900' }}
              />
              <Area
                type="monotone"
                dataKey="entrada"
                stroke="#10b981"
                strokeWidth={4}
                fillOpacity={1}
                fill="url(#colorEntrada)"
              />
              <Area
                type="monotone"
                dataKey="saida"
                stroke="#ef4444"
                strokeWidth={4}
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
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('receivable')}
          className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'receivable'
            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
            : 'bg-white text-gray-400 hover:text-gray-600 border border-gray-100'
            }`}
        >
          Contas a Receber
        </button>
        <button
          onClick={() => setActiveTab('payable')}
          className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'payable'
            ? 'bg-red-600 text-white shadow-lg shadow-red-200'
            : 'bg-white text-gray-400 hover:text-gray-600 border border-gray-100'
            }`}
        >
          Contas a Pagar
        </button>
      </div>

      {/* Content */}
      <div ref={printRef} className="glass-panel rounded-[40px] border border-white/5 shadow-3xl overflow-hidden print:shadow-none print:bg-white print:border-none relative z-10 transition-all">
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02] print:bg-white print:border-b-2 print:border-bg-deep">
          <h2 className="font-black text-white uppercase tracking-widest text-sm flex items-center gap-4 italic italic">
            <div className={`w-2 h-2 rounded-full ${activeTab === 'receivable' ? 'bg-emerald-500 shadow-[0_0_10px_#10B981]' : 'bg-red-500 shadow-[0_0_10px_#EF4444]'}`} />
            {activeTab === 'receivable' ? 'Fluxo de Recebimentos' : 'Fluxo de Obrigações'}
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
              <span>Nº DOC:</span>
              <span style={{ fontWeight: 'bold' }}>{lastPayment?.document_number}</span>
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
            <p style={{ margin: '0', fontWeight: 'bold' }}>{lastPayment?.hash?.substring(0, 4)}-Processado por Programas Validados</p>
            <p style={{ margin: '2px 0 0 0', opacity: 0.7 }}>Obrigado pela preferência!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
