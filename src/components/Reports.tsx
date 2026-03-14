import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FileText, Download, Printer, Filter, Search, ChevronDown, ChevronUp, Package, TrendingUp, BarChart3, Users, DollarSign, PieChart } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart as RePieChart, Pie } from 'recharts';

export default function Reports() {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'sales' | 'products' | 'profit' | 'hr'>('sales');
  const [allSales, setAllSales] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [profitReport, setProfitReport] = useState<any>(null);
  const [payrollSummary, setPayrollSummary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('month');
  const [search, setSearch] = useState('');
  const [expandedSale, setExpandedSale] = useState<number | null>(null);
  const [saleToPrint, setSaleToPrint] = useState<any>(null);
  
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrintReceipt = useReactToPrint({
    contentRef: receiptRef,
    pageStyle: `
      @page { size: 80mm auto; margin: 0mm; }
      @media print { body { margin: 0; padding: 0; } }
    `
  });

  useEffect(() => {
    if (saleToPrint) handlePrintReceipt();
  }, [saleToPrint]);

  useEffect(() => {
    fetchData();
  }, [activeTab, dateFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'sales') {
        const res = await fetch('/api/sales', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        setAllSales(data);
      } else if (activeTab === 'products') {
        const res = await fetch('/api/reports/top-selling', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        setTopProducts(data);
      } else if (activeTab === 'profit') {
        const res = await fetch('/api/reports/profit', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        setProfitReport(data);
      } else if (activeTab === 'hr') {
        const res = await fetch('/api/hr/payrolls', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        setPayrollSummary(data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSales = allSales.filter(s => 
    s.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
    (s.customer_name && s.customer_name.toLowerCase().includes(search.toLowerCase()))
  );

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Centro de Relatórios</h1>
          <p className="text-gray-500">Analise o desempenho do seu negócio em tempo real</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={() => window.print()}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-2xl hover:bg-gray-50 font-black uppercase tracking-widest text-xs transition-all shadow-sm"
          >
            <Printer size={18} />
            Imprimir
          </button>
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-emerald-200">
            <Download size={18} />
            Exportar
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100 mb-8 overflow-x-auto">
        {[
          { id: 'sales', label: 'Vendas', icon: TrendingUp },
          { id: 'products', label: 'Produtos', icon: BarChart3 },
          { id: 'profit', label: 'Lucro', icon: DollarSign },
          { id: 'hr', label: 'RH/Folha', icon: Users },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all whitespace-nowrap ${
              activeTab === tab.id ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'sales' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
              <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">Total de Vendas</h3>
              <p className="text-3xl font-black text-emerald-600">
                {filteredSales.reduce((acc, s) => acc + s.total, 0).toLocaleString()} {user?.currency}
              </p>
            </div>
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
              <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">Volume de Vendas</h3>
              <p className="text-3xl font-black text-gray-900">{filteredSales.length}</p>
            </div>
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
              <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">Ticket Médio</h3>
              <p className="text-3xl font-black text-blue-600">
                {filteredSales.length > 0 ? (filteredSales.reduce((acc, s) => acc + s.total, 0) / filteredSales.length).toLocaleString() : 0} {user?.currency}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Pesquisar fatura ou cliente..."
                  className="w-full pl-12 pr-4 py-3 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <th className="p-6">Fatura</th>
                    <th className="p-6">Data</th>
                    <th className="p-6">Cliente</th>
                    <th className="p-6 text-right">Total</th>
                    <th className="p-6 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredSales.map(sale => (
                    <tr key={sale.id} className="hover:bg-gray-50 transition-all cursor-pointer" onClick={() => setExpandedSale(expandedSale === sale.id ? null : sale.id)}>
                      <td className="p-6 font-black text-gray-900">{sale.invoice_number}</td>
                      <td className="p-6 text-gray-500 text-sm">{new Date(sale.created_at).toLocaleString()}</td>
                      <td className="p-6 text-gray-900 font-bold">{sale.customer_name || 'Consumidor Final'}</td>
                      <td className="p-6 text-right font-black text-emerald-600">{sale.total.toLocaleString()} {user?.currency}</td>
                      <td className="p-6 text-center">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${sale.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {sale.status === 'paid' ? 'Pago' : 'Pendente'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'products' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
            <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
              <TrendingUp className="text-emerald-600" /> Mais Vendidos (Qtd)
            </h3>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12, fontWeight: 700 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    itemStyle={{ fontWeight: 900, color: '#10b981' }}
                  />
                  <Bar dataKey="total_quantity" fill="#10b981" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
            <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
              <PieChart className="text-blue-600" /> Distribuição de Receita
            </h3>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={topProducts}
                    dataKey="total_revenue"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    innerRadius={60}
                    paddingAngle={5}
                  >
                    {topProducts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'profit' && profitReport && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 text-center">
              <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-4">Receita Total</h3>
              <p className="text-4xl font-black text-gray-900">{profitReport.revenue?.toLocaleString()} {user?.currency}</p>
            </div>
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 text-center">
              <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-4">Custo de Mercadoria</h3>
              <p className="text-4xl font-black text-red-500">{profitReport.cost?.toLocaleString()} {user?.currency}</p>
            </div>
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 z-0" />
              <div className="relative z-10">
                <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-4">Lucro Estimado</h3>
                <p className="text-4xl font-black text-emerald-600">{profitReport.profit?.toLocaleString()} {user?.currency}</p>
                <p className="text-sm font-bold text-emerald-500 mt-2">
                  Margem: {profitReport.revenue > 0 ? ((profitReport.profit / profitReport.revenue) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'hr' && (
        <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8 border-b border-gray-100">
            <h3 className="text-xl font-black text-gray-900">Histórico de Folhas Salariais</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <th className="p-6">Período</th>
                  <th className="p-6 text-right">Total Bruto</th>
                  <th className="p-6 text-right">Total Líquido</th>
                  <th className="p-6 text-right">Impostos (IRT+INSS)</th>
                  <th className="p-6 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payrollSummary.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-all">
                    <td className="p-6 font-black text-gray-900 uppercase">{p.month}/{p.year}</td>
                    <td className="p-6 text-right font-bold text-gray-600">{p.total_gross?.toLocaleString()} {user?.currency}</td>
                    <td className="p-6 text-right font-black text-emerald-600">{p.total_net?.toLocaleString()} {user?.currency}</td>
                    <td className="p-6 text-right font-bold text-red-500">
                      {(p.total_irt + p.total_inss_employee + p.total_inss_employer)?.toLocaleString()} {user?.currency}
                    </td>
                    <td className="p-6 text-center">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${p.status === 'finalized' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {p.status === 'finalized' ? 'Finalizada' : 'Rascunho'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
