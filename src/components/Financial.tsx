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
  const [receivableStatusFilter, setReceivableStatusFilter] = useState<'all' | 'pending' | 'paid'>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<'all' | 'lastWeek' | 'lastMonth' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [customEndDate, setCustomEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
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
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [expRes, recRes, supRes] = await Promise.all([
        fetch('/api/expenses', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/financial/receivable', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/suppliers', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      setExpenses(await expRes.json());
      setReceivables(await recRes.json());
      setSuppliers(await supRes.json());
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

  const totalReceivable = receivables.reduce((sum, r) => sum + (r.total - r.amount_paid), 0);
  const totalPayable = expenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0);
  const totalReceived = receivables.reduce((sum, r) => sum + r.amount_paid, 0);
  const totalPaid = expenses.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalReceived - totalPaid;

  const chartData = [
    { name: 'Jan', entrada: 4500, saida: 3200 },
    { name: 'Fev', entrada: 5200, saida: 3800 },
    { name: 'Mar', entrada: 4800, saida: 4100 },
    { name: 'Abr', entrada: 6100, saida: 4300 },
    { name: 'Mai', entrada: 5900, saida: 4600 },
    { name: 'Jun', entrada: totalReceived || 7500, saida: totalPaid || 4900 },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Gestão Financeira</h1>
          <p className="text-gray-500 font-medium">Controle as suas contas a pagar e a receber num único local.</p>
        </div>
        <button
          onClick={() => handlePrint()}
          className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm"
        >
          <Printer size={16} />
          Imprimir Relatório
        </button>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
            <ArrowUpCircle size={32} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Total a Receber</p>
            <p className="text-3xl font-black text-emerald-600">
              {totalReceivable.toLocaleString()} <span className="text-sm font-bold opacity-50">{user?.currency}</span>
            </p>
          </div>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-6">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
            {netProfit >= 0 ? <TrendingUp size={32} /> : <TrendingDown size={32} />}
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Lucro Líquido Realizado</p>
            <p className={`text-3xl font-black ${netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {netProfit.toLocaleString()} <span className="text-sm font-bold opacity-50">{user?.currency}</span>
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
                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
              />
              <Tooltip
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '12px' }}
                itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
              />
              <Area
                type="monotone"
                dataKey="entrada"
                stroke="#10b981"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorEntrada)"
              />
              <Area
                type="monotone"
                dataKey="saida"
                stroke="#ef4444"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorSaida)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
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
      <div ref={printRef} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden print:shadow-none print:border-none">
        <div className="p-6 border-b flex justify-between items-center bg-gray-50/50 print:bg-white print:border-b-2 print:border-gray-900">
          <h2 className="font-black text-gray-900 uppercase tracking-widest text-sm">
            {activeTab === 'receivable' ? 'Lista de Recebimentos' : 'Lista de Pagamentos'}
          </h2>

          {activeTab === 'receivable' && (
            <div className="flex gap-2 items-center print:hidden">
              <select
                className="text-xs font-black uppercase tracking-widest bg-white border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                value={dateRangeFilter}
                onChange={(e) => setDateRangeFilter(e.target.value as any)}
              >
                <option value="all">Todo o Período</option>
                <option value="lastWeek">Última Semana</option>
                <option value="lastMonth">Último Mês</option>
                <option value="custom">Período Personalizado</option>
              </select>

              {dateRangeFilter === 'custom' && (
                <>
                  <input
                    type="date"
                    className="text-xs font-black uppercase tracking-widest bg-white border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                  />
                  <input
                    type="date"
                    className="text-xs font-black uppercase tracking-widest bg-white border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                  />
                </>
              )}

              <select
                className="text-xs font-black uppercase tracking-widest bg-white border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                value={receivableStatusFilter}
                onChange={(e) => setReceivableStatusFilter(e.target.value as any)}
              >
                <option value="all">Todos</option>
                <option value="pending">Pendentes</option>
                <option value="paid">Pagos</option>
              </select>
            </div>
          )}

          {activeTab === 'payable' && (
            <button
              onClick={() => setShowExpenseModal(true)}
              className="bg-gray-900 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all print:hidden"
            >
              <Plus size={16} />
              Nova Conta
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-20 text-center">
              <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Carregando dados financeiros...</p>
            </div>
          ) : activeTab === 'receivable' ? (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <th className="px-6 py-4">Cliente / Fatura</th>
                  <th className="px-6 py-4">Data</th>
                  <th className="px-6 py-4 text-right">Valor Total</th>
                  <th className="px-6 py-4 text-right">Valor Pago</th>
                  <th className="px-6 py-4 text-right">Saldo Devedor</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {receivables.filter(r => {
                  const isPaid = r.amount_paid >= r.total;
                  const rDate = new Date(r.created_at);
                  const now = new Date();

                  let dateMatch = true;
                  if (dateRangeFilter === 'lastWeek') {
                    const weekAgo = new Date();
                    weekAgo.setDate(now.getDate() - 7);
                    dateMatch = rDate >= weekAgo;
                  } else if (dateRangeFilter === 'lastMonth') {
                    const monthAgo = new Date();
                    monthAgo.setMonth(now.getMonth() - 1);
                    dateMatch = rDate >= monthAgo;
                  } else if (dateRangeFilter === 'custom') {
                    const start = new Date(customStartDate);
                    const end = new Date(customEndDate);
                    end.setHours(23, 59, 59, 999);
                    dateMatch = rDate >= start && rDate <= end;
                  }

                  let statusMatch = true;
                  if (receivableStatusFilter === 'pending') statusMatch = !isPaid;
                  else if (receivableStatusFilter === 'paid') statusMatch = isPaid;

                  return dateMatch && statusMatch;
                }).map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900">{r.customer_name}</p>
                      <p className="text-[10px] font-mono text-gray-400">{r.invoice_number}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-gray-600">{new Date(r.created_at).toLocaleDateString()}</p>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900">
                      {r.total.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-600">
                      {r.amount_paid.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right font-black text-red-600">
                      {(r.total - r.amount_paid).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full print:border print:border-gray-300 ${r.amount_paid >= r.total ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>
                        {r.amount_paid >= r.total ? 'Pago' : 'Pendente'}
                      </span>
                    </td>
                  </tr>
                ))}
                {receivables.filter(r => {
                  const isPaid = r.amount_paid >= r.total;
                  const rDate = new Date(r.created_at);
                  const now = new Date();

                  let dateMatch = true;
                  if (dateRangeFilter === 'lastWeek') {
                    const weekAgo = new Date();
                    weekAgo.setDate(now.getDate() - 7);
                    dateMatch = rDate >= weekAgo;
                  } else if (dateRangeFilter === 'lastMonth') {
                    const monthAgo = new Date();
                    monthAgo.setMonth(now.getMonth() - 1);
                    dateMatch = rDate >= monthAgo;
                  } else if (dateRangeFilter === 'custom') {
                    const start = new Date(customStartDate);
                    const end = new Date(customEndDate);
                    end.setHours(23, 59, 59, 999);
                    dateMatch = rDate >= start && rDate <= end;
                  }

                  let statusMatch = true;
                  if (receivableStatusFilter === 'pending') statusMatch = !isPaid;
                  else if (receivableStatusFilter === 'paid') statusMatch = isPaid;

                  return dateMatch && statusMatch;
                }).length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center text-gray-400 font-bold uppercase text-xs tracking-widest">
                        Nenhum recebimento encontrado.
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <th className="px-6 py-4">Descrição / Fornecedor</th>
                  <th className="px-6 py-4">Vencimento</th>
                  <th className="px-6 py-4 text-right">Valor</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                  <th className="px-6 py-4 text-right print:hidden">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900">{e.description}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{e.supplier_name || 'Sem Fornecedor'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400" />
                        <p className="text-xs font-bold text-gray-600">{new Date(e.due_date).toLocaleDateString()}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-gray-900">
                      {e.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full print:border print:border-gray-300 ${e.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>
                        {e.status === 'paid' ? 'Pago' : 'Pendente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right print:hidden">
                      <button
                        onClick={() => toggleExpenseStatus(e.id, e.status)}
                        className={`p-2 rounded-xl transition-all ${e.status === 'paid' ? 'text-gray-300 hover:text-red-500' : 'text-emerald-500 hover:bg-emerald-50'
                          }`}
                        title={e.status === 'paid' ? 'Marcar como Pendente' : 'Marcar como Pago'}
                      >
                        {e.status === 'paid' ? <Clock size={20} /> : <CheckCircle2 size={20} />}
                      </button>
                    </td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-gray-400 font-bold uppercase text-xs tracking-widest">
                      Nenhum pagamento registado.
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-8 border-b bg-gray-50/50">
              <h3 className="text-xl font-black text-gray-900 tracking-tight">Nova Conta a Pagar</h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Registe um novo compromisso financeiro</p>
            </div>

            <form onSubmit={handleAddExpense} className="p-8 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Descrição</label>
                <input
                  required
                  type="text"
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-gray-900"
                  placeholder="Ex: Renda da Loja, Energia, etc."
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Valor</label>
                  <input
                    required
                    type="number"
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-gray-900"
                    placeholder="0.00"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Vencimento</label>
                  <input
                    required
                    type="date"
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-gray-900"
                    value={newExpense.due_date}
                    onChange={(e) => setNewExpense({ ...newExpense, due_date: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Fornecedor (Opcional)</label>
                <select
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-gray-900 appearance-none"
                  value={newExpense.supplier_id}
                  onChange={(e) => setNewExpense({ ...newExpense, supplier_id: e.target.value })}
                >
                  <option value="">Selecione um fornecedor</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="flex-1 py-4 border border-gray-100 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95"
                >
                  Guardar Conta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
