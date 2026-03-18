import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FileText, Download, Printer, Filter, Search, Package, TrendingUp, BarChart3, Users, DollarSign, PieChart } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart as RePieChart, Pie } from 'recharts';

// ─── Printable A4 Report Template ────────────────────────────────────────────
const PrintableReport = React.forwardRef<HTMLDivElement, {
  user: any;
  activeTab: string;
  filteredSales: any[];
  topProducts: any[];
  profitReport: any;
  payrollSummary: any[];
  startDate: string;
  endDate: string;
}>(({ user, activeTab, filteredSales, topProducts, profitReport, payrollSummary, startDate, endDate }, ref) => {
  const today = new Date().toLocaleDateString('pt-AO', { day: '2-digit', month: 'long', year: 'numeric' });
  const period = startDate && endDate
    ? `${new Date(startDate).toLocaleDateString('pt-AO')} – ${new Date(endDate).toLocaleDateString('pt-AO')}`
    : 'Período completo';

  const reportTitles: Record<string, string> = {
    sales: 'Relatório de Vendas',
    products: 'Relatório de Produtos Mais Vendidos',
    profit: 'Relatório de Lucros e Margens',
    hr: 'Relatório de Folhas Salariais',
  };

  return (
    <div ref={ref} style={{ fontFamily: "'Segoe UI', Arial, sans-serif", background: 'white', color: '#111', width: '210mm', minHeight: '297mm', padding: '15mm 18mm', boxSizing: 'border-box' }}>
      {/* Page Header */}
      <style>{`
        @page {
          size: A4 portrait;
          margin: 0;
        }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-page { page-break-after: always; }
          .print-no-break { page-break-inside: avoid; }
        }
        .page-number::after {
          content: counter(page) " / " counter(pages);
        }
        @page { counter-increment: page; }
      `}</style>

      {/* ── Company Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #111', paddingBottom: '10mm', marginBottom: '8mm' }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: '22px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{user?.company_name || 'Empresa'}</div>
          <div style={{ fontSize: '11px', color: '#555', marginTop: '3px' }}>NIF: {user?.nif || '—'}</div>
          <div style={{ fontSize: '11px', color: '#555' }}>Endereço: {user?.address || 'Luanda, Angola'}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 900, fontSize: '16px', color: '#1a6b3c', textTransform: 'uppercase' }}>{reportTitles[activeTab]}</div>
          <div style={{ fontSize: '11px', color: '#555', marginTop: '4px' }}>Período: {period}</div>
          <div style={{ fontSize: '11px', color: '#555' }}>Emitido em: {today}</div>
        </div>
      </div>

      {/* ── VENDAS ── */}
      {activeTab === 'sales' && (
        <>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6mm', marginBottom: '8mm' }}>
            {[
              { label: 'Total de Vendas', value: `${filteredSales.reduce((acc, s) => acc + s.total, 0).toLocaleString('pt-AO')} ${user?.currency}`, color: '#1a6b3c' },
              { label: 'Nº de Faturas', value: filteredSales.length.toString(), color: '#1a3c6b' },
              { label: 'Ticket Médio', value: `${filteredSales.length > 0 ? Math.round(filteredSales.reduce((acc, s) => acc + s.total, 0) / filteredSales.length).toLocaleString('pt-AO') : 0} ${user?.currency}`, color: '#6b3c1a' },
            ].map((card, i) => (
              <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: '6px', padding: '4mm', pageBreakInside: 'avoid' }}>
                <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: '#6b7280', letterSpacing: '0.08em', marginBottom: '3px' }}>{card.label}</div>
                <div style={{ fontSize: '18px', fontWeight: 900, color: card.color }}>{card.value}</div>
              </div>
            ))}
          </div>

          {/* Sales Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
            <thead>
              <tr style={{ background: '#111', color: '#fff' }}>
                <th style={{ padding: '3mm 4mm', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nº</th>
                <th style={{ padding: '3mm 4mm', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase' }}>Fatura</th>
                <th style={{ padding: '3mm 4mm', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase' }}>Data / Hora</th>
                <th style={{ padding: '3mm 4mm', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase' }}>Cliente</th>
                <th style={{ padding: '3mm 4mm', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase' }}>Método</th>
                <th style={{ padding: '3mm 4mm', textAlign: 'right', fontWeight: 900, textTransform: 'uppercase' }}>Total ({user?.currency})</th>
                <th style={{ padding: '3mm 4mm', textAlign: 'center', fontWeight: 900, textTransform: 'uppercase' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map((s, i) => (
                <tr key={s.id} style={{ background: i % 2 === 0 ? '#f9fafb' : '#fff', pageBreakInside: 'avoid' }}>
                  <td style={{ padding: '2.5mm 4mm', color: '#6b7280' }}>{i + 1}</td>
                  <td style={{ padding: '2.5mm 4mm', fontWeight: 700 }}>{s.invoice_number}</td>
                  <td style={{ padding: '2.5mm 4mm', color: '#374151' }}>{new Date(s.created_at).toLocaleString('pt-AO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                  <td style={{ padding: '2.5mm 4mm' }}>{s.customer_name || 'Consumidor Final'}</td>
                  <td style={{ padding: '2.5mm 4mm', textTransform: 'capitalize' }}>{s.payment_method || '—'}</td>
                  <td style={{ padding: '2.5mm 4mm', textAlign: 'right', fontWeight: 700, color: '#1a6b3c' }}>{s.total.toLocaleString('pt-AO')}</td>
                  <td style={{ padding: '2.5mm 4mm', textAlign: 'center' }}>
                    <span style={{ background: s.status === 'paid' ? '#d1fae5' : '#fef3c7', color: s.status === 'paid' ? '#065f46' : '#92400e', borderRadius: '4px', padding: '1mm 2.5mm', fontWeight: 700, fontSize: '9px', textTransform: 'uppercase' }}>
                      {s.status === 'paid' ? 'Pago' : 'Pendente'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: '#111', color: '#fff', fontWeight: 900 }}>
                <td colSpan={5} style={{ padding: '3mm 4mm', textAlign: 'right', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.05em' }}>TOTAL GERAL</td>
                <td style={{ padding: '3mm 4mm', textAlign: 'right', fontSize: '13px' }}>{filteredSales.reduce((acc, s) => acc + s.total, 0).toLocaleString('pt-AO')}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </>
      )}

      {/* ── PRODUCTS ── */}
      {activeTab === 'products' && topProducts.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
          <thead>
            <tr style={{ background: '#111', color: '#fff' }}>
              <th style={{ padding: '3mm 4mm', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase' }}>Nº</th>
              <th style={{ padding: '3mm 4mm', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase' }}>Produto</th>
              <th style={{ padding: '3mm 4mm', textAlign: 'right', fontWeight: 900, textTransform: 'uppercase' }}>Qtd. Vendida</th>
              <th style={{ padding: '3mm 4mm', textAlign: 'right', fontWeight: 900, textTransform: 'uppercase' }}>Receita ({user?.currency})</th>
            </tr>
          </thead>
          <tbody>
            {topProducts.map((p, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? '#f9fafb' : '#fff', pageBreakInside: 'avoid' }}>
                <td style={{ padding: '2.5mm 4mm', color: '#6b7280' }}>{i + 1}</td>
                <td style={{ padding: '2.5mm 4mm', fontWeight: 700 }}>{p.name}</td>
                <td style={{ padding: '2.5mm 4mm', textAlign: 'right' }}>{p.total_quantity?.toLocaleString('pt-AO')}</td>
                <td style={{ padding: '2.5mm 4mm', textAlign: 'right', color: '#1a6b3c', fontWeight: 700 }}>{p.total_revenue?.toLocaleString('pt-AO')}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: '#111', color: '#fff', fontWeight: 900 }}>
              <td colSpan={2} style={{ padding: '3mm 4mm', textAlign: 'right', textTransform: 'uppercase', fontSize: '10px' }}>TOTAIS</td>
              <td style={{ padding: '3mm 4mm', textAlign: 'right' }}>{topProducts.reduce((a, p) => a + (p.total_quantity || 0), 0).toLocaleString('pt-AO')}</td>
              <td style={{ padding: '3mm 4mm', textAlign: 'right' }}>{topProducts.reduce((a, p) => a + (p.total_revenue || 0), 0).toLocaleString('pt-AO')}</td>
            </tr>
          </tfoot>
        </table>
      )}

      {/* ── PROFIT ── */}
      {activeTab === 'profit' && profitReport && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6mm', marginBottom: '10mm' }}>
            {[
              { label: 'Receita Total', value: `${profitReport.revenue?.toLocaleString('pt-AO')} ${user?.currency}`, color: '#1a3c6b' },
              { label: 'Custo de Mercadoria', value: `${profitReport.cost?.toLocaleString('pt-AO')} ${user?.currency}`, color: '#b91c1c' },
              { label: 'Lucro Estimado', value: `${profitReport.profit?.toLocaleString('pt-AO')} ${user?.currency}`, color: '#1a6b3c' },
            ].map((card, i) => (
              <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: '6px', padding: '5mm', textAlign: 'center' }}>
                <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: '#6b7280', marginBottom: '3px' }}>{card.label}</div>
                <div style={{ fontSize: '20px', fontWeight: 900, color: card.color }}>{card.value}</div>
              </div>
            ))}
          </div>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '6px', padding: '5mm' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, marginBottom: '4mm', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Indicadores de Rentabilidade</div>
            <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
              <tbody>
                {[
                  { label: 'Margem Bruta', value: profitReport.revenue > 0 ? `${((profitReport.profit / profitReport.revenue) * 100).toFixed(2)}%` : '—' },
                  { label: 'Custo / Receita', value: profitReport.revenue > 0 ? `${((profitReport.cost / profitReport.revenue) * 100).toFixed(2)}%` : '—' },
                  { label: 'Nº de Vendas no Período', value: profitReport.total_sales || '—' },
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '2.5mm', color: '#374151', fontWeight: 600 }}>{row.label}</td>
                    <td style={{ padding: '2.5mm', textAlign: 'right', fontWeight: 900 }}>{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── HR / PAYROLLS ── */}
      {activeTab === 'hr' && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
          <thead>
            <tr style={{ background: '#111', color: '#fff' }}>
              <th style={{ padding: '3mm 4mm', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase' }}>Período</th>
              <th style={{ padding: '3mm 4mm', textAlign: 'right', fontWeight: 900, textTransform: 'uppercase' }}>Salário Bruto</th>
              <th style={{ padding: '3mm 4mm', textAlign: 'right', fontWeight: 900, textTransform: 'uppercase' }}>Salário Líquido</th>
              <th style={{ padding: '3mm 4mm', textAlign: 'right', fontWeight: 900, textTransform: 'uppercase' }}>IRT + INSS</th>
              <th style={{ padding: '3mm 4mm', textAlign: 'center', fontWeight: 900, textTransform: 'uppercase' }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {payrollSummary.map((p, i) => (
              <tr key={p.id} style={{ background: i % 2 === 0 ? '#f9fafb' : '#fff', pageBreakInside: 'avoid' }}>
                <td style={{ padding: '2.5mm 4mm', fontWeight: 700 }}>{p.month}/{p.year}</td>
                <td style={{ padding: '2.5mm 4mm', textAlign: 'right' }}>{p.total_gross?.toLocaleString('pt-AO')} {user?.currency}</td>
                <td style={{ padding: '2.5mm 4mm', textAlign: 'right', color: '#1a6b3c', fontWeight: 700 }}>{p.total_net?.toLocaleString('pt-AO')} {user?.currency}</td>
                <td style={{ padding: '2.5mm 4mm', textAlign: 'right', color: '#b91c1c' }}>{((p.total_irt || 0) + (p.total_inss_employee || 0) + (p.total_inss_employer || 0)).toLocaleString('pt-AO')} {user?.currency}</td>
                <td style={{ padding: '2.5mm 4mm', textAlign: 'center' }}>
                  <span style={{ background: p.status === 'finalized' ? '#d1fae5' : '#fef3c7', color: p.status === 'finalized' ? '#065f46' : '#92400e', borderRadius: '4px', padding: '1mm 2.5mm', fontWeight: 700, fontSize: '9px', textTransform: 'uppercase' }}>
                    {p.status === 'finalized' ? 'Finalizada' : 'Rascunho'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: '#111', color: '#fff', fontWeight: 900 }}>
              <td style={{ padding: '3mm 4mm', textTransform: 'uppercase', fontSize: '10px' }}>TOTAIS</td>
              <td style={{ padding: '3mm 4mm', textAlign: 'right' }}>{payrollSummary.reduce((a, p) => a + (p.total_gross || 0), 0).toLocaleString('pt-AO')} {user?.currency}</td>
              <td style={{ padding: '3mm 4mm', textAlign: 'right' }}>{payrollSummary.reduce((a, p) => a + (p.total_net || 0), 0).toLocaleString('pt-AO')} {user?.currency}</td>
              <td style={{ padding: '3mm 4mm', textAlign: 'right' }}>{payrollSummary.reduce((a, p) => a + (p.total_irt || 0) + (p.total_inss_employee || 0) + (p.total_inss_employer || 0), 0).toLocaleString('pt-AO')} {user?.currency}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      )}

      {/* ── Footer with page number ── */}
      <div style={{ position: 'fixed', bottom: '10mm', left: '18mm', right: '18mm', borderTop: '1px solid #e5e7eb', paddingTop: '4mm', display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#9ca3af' }}>
        <span>{user?.company_name} — Documento gerado automaticamente pelo Venda Plus</span>
        <span className="page-number" style={{ fontWeight: 700 }}>Pág. </span>
      </div>
    </div>
  );
});
PrintableReport.displayName = 'PrintableReport';

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Reports() {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'sales' | 'products' | 'profit' | 'hr'>('sales');
  const [allSales, setAllSales] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [profitReport, setProfitReport] = useState<any>(null);
  const [payrollSummary, setPayrollSummary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [registerId, setRegisterId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [registers, setRegisters] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    pageStyle: `
      @page { size: A4 portrait; margin: 0; }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        html, body { height: 100%; }
      }
    `,
    documentTitle: `Venda Plus — ${activeTab.toUpperCase()} — ${new Date().toLocaleDateString('pt-AO')}`,
  });

  const handleExport = () => {
    const csvRows = [
      ['Data', 'Fatura', 'Cliente', 'Total', 'Metodo', 'Status'],
      ...filteredSales.map(s => [
        new Date(s.created_at).toLocaleDateString(),
        s.invoice_number,
        s.customer_name || 'Consumidor Final',
        s.total,
        s.payment_method,
        s.status
      ])
    ];
    const csvContent = csvRows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `vendas_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => { fetchData(); }, [activeTab, startDate, endDate, registerId]);
  useEffect(() => { fetchRegisters(); }, []);

  const fetchRegisters = async () => {
    try {
      const res = await fetch('/api/cash-registers', { headers: { Authorization: `Bearer ${token}` } });
      setRegisters(await res.json());
    } catch (error) { console.error('Error fetching registers:', error); }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'sales') {
        const queryParams = new URLSearchParams();
        if (startDate) queryParams.append('start_date', startDate);
        if (endDate) queryParams.append('end_date', endDate);
        if (registerId) queryParams.append('register_id', registerId);
        const res = await fetch(`/api/sales?${queryParams.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
        setAllSales(await res.json());
      } else if (activeTab === 'products') {
        const res = await fetch('/api/reports/top-selling', { headers: { Authorization: `Bearer ${token}` } });
        setTopProducts(await res.json());
      } else if (activeTab === 'profit') {
        const res = await fetch('/api/reports/profit', { headers: { Authorization: `Bearer ${token}` } });
        setProfitReport(await res.json());
      } else if (activeTab === 'hr') {
        const res = await fetch('/api/hr/payrolls', { headers: { Authorization: `Bearer ${token}` } });
        setPayrollSummary(await res.json());
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
      {/* Hidden Printable Area */}
      <div style={{ display: 'none' }}>
        <PrintableReport
          ref={printRef}
          user={user}
          activeTab={activeTab}
          filteredSales={filteredSales}
          topProducts={topProducts}
          profitReport={profitReport}
          payrollSummary={payrollSummary}
          startDate={startDate}
          endDate={endDate}
        />
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Centro de Relatórios</h1>
          <p className="text-gray-500">Analise o desempenho do seu negócio em tempo real</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button
            onClick={() => handlePrint()}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-2xl hover:bg-gray-50 font-black uppercase tracking-widest text-xs transition-all shadow-sm"
          >
            <Printer size={18} />
            Imprimir A4
          </button>
          <button
            onClick={handleExport}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-emerald-200"
          >
            <Download size={18} />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100 mb-8 overflow-x-auto">
        {[
          { id: 'sales', label: 'Vendas', icon: TrendingUp },
          { id: 'products', label: 'Produtos', icon: BarChart3 },
          { id: 'profit', label: 'Lucro', icon: DollarSign },
          { id: 'hr', label: 'RH / Folha', icon: Users },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* ── SALES TAB ── */}
      {!loading && activeTab === 'sales' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
              <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">Total de Vendas</h3>
              <p className="text-3xl font-black text-emerald-600">{filteredSales.reduce((acc, s) => acc + s.total, 0).toLocaleString('pt-AO')} {user?.currency}</p>
            </div>
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
              <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">Volume de Faturas</h3>
              <p className="text-3xl font-black text-gray-900">{filteredSales.length}</p>
            </div>
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
              <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">Ticket Médio</h3>
              <p className="text-3xl font-black text-blue-600">
                {filteredSales.length > 0 ? Math.round(filteredSales.reduce((acc, s) => acc + s.total, 0) / filteredSales.length).toLocaleString('pt-AO') : 0} {user?.currency}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex flex-wrap items-center gap-4 w-full">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Pesquisar fatura ou cliente..."
                    className="w-full pl-12 pr-4 py-3 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-emerald-500 font-bold text-gray-900"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-4 bg-white p-2.5 rounded-2xl border-2 border-zinc-100 shadow-sm">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-50 rounded-xl">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-900">De:</span>
                    <input type="date" className="bg-transparent border-none focus:ring-0 font-black text-xs text-zinc-800 outline-none" value={startDate} onChange={e => setStartDate(e.target.value)} />
                  </div>
                  <div className="w-[2px] h-4 bg-zinc-100" />
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-50 rounded-xl">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-900">Até:</span>
                    <input type="date" className="bg-transparent border-none focus:ring-0 font-black text-xs text-zinc-800 outline-none" value={endDate} onChange={e => setEndDate(e.target.value)} />
                  </div>
                </div>
                <div className="flex items-center gap-2 min-w-[200px]">
                  <Filter size={14} className="text-gray-400" />
                  <select className="flex-1 px-4 py-2 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-emerald-500 font-bold text-xs" value={registerId} onChange={e => setRegisterId(e.target.value)}>
                    <option value="">Todos os Turnos</option>
                    {registers.map(reg => (
                      <option key={reg.id} value={reg.id}>{new Date(reg.opened_at).toLocaleDateString()} — {reg.users?.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <th className="p-6">Nº</th>
                    <th className="p-6">Fatura</th>
                    <th className="p-6">Data / Hora</th>
                    <th className="p-6">Cliente</th>
                    <th className="p-6">Método</th>
                    <th className="p-6 text-right">Total ({user?.currency})</th>
                    <th className="p-6 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredSales.map((sale, i) => (
                    <tr key={sale.id} className="hover:bg-emerald-50 transition-all group">
                      <td className="p-6 text-gray-400 text-sm">{i + 1}</td>
                      <td className="p-6 font-black text-gray-900">{sale.invoice_number}</td>
                      <td className="p-6 text-gray-500 text-sm">{new Date(sale.created_at).toLocaleString('pt-AO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="p-6 text-gray-900 font-bold">{sale.customer_name || 'Consumidor Final'}</td>
                      <td className="p-6 text-gray-600 capitalize text-sm">{sale.payment_method || '—'}</td>
                      <td className="p-6 text-right font-black text-emerald-600">{sale.total.toLocaleString('pt-AO')}</td>
                      <td className="p-6 text-center">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${sale.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {sale.status === 'paid' ? 'Pago' : 'Pendente'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredSales.length === 0 && (
                <div className="py-20 text-center text-gray-400 font-black uppercase text-[11px] tracking-widest">Nenhuma venda encontrada para o período</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── PRODUCTS TAB ── */}
      {!loading && activeTab === 'products' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
            <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2"><TrendingUp className="text-emerald-600" /> Mais Vendidos (Qtd)</h3>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12, fontWeight: 700 }} />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} itemStyle={{ fontWeight: 900, color: '#10b981' }} />
                  <Bar dataKey="total_quantity" fill="#10b981" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
            <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2"><PieChart className="text-blue-600" /> Distribuição de Receita</h3>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie data={topProducts} dataKey="total_revenue" nameKey="name" cx="50%" cy="50%" outerRadius={120} innerRadius={60} paddingAngle={5}>
                    {topProducts.map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                  </Pie>
                  <Tooltip />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── PROFIT TAB ── */}
      {!loading && activeTab === 'profit' && profitReport && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 text-center">
              <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-4">Receita Total</h3>
              <p className="text-4xl font-black text-gray-900">{profitReport.revenue?.toLocaleString('pt-AO')} {user?.currency}</p>
            </div>
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 text-center">
              <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-4">Custo de Mercadoria</h3>
              <p className="text-4xl font-black text-red-500">{profitReport.cost?.toLocaleString('pt-AO')} {user?.currency}</p>
            </div>
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 z-0" />
              <div className="relative z-10">
                <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-4">Lucro Estimado</h3>
                <p className="text-4xl font-black text-emerald-600">{profitReport.profit?.toLocaleString('pt-AO')} {user?.currency}</p>
                <p className="text-sm font-bold text-emerald-500 mt-2">
                  Margem: {profitReport.revenue > 0 ? ((profitReport.profit / profitReport.revenue) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── HR TAB ── */}
      {!loading && activeTab === 'hr' && (
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
                    <td className="p-6 text-right font-bold text-gray-600">{p.total_gross?.toLocaleString('pt-AO')} {user?.currency}</td>
                    <td className="p-6 text-right font-black text-emerald-600">{p.total_net?.toLocaleString('pt-AO')} {user?.currency}</td>
                    <td className="p-6 text-right font-bold text-red-500">{((p.total_irt || 0) + (p.total_inss_employee || 0) + (p.total_inss_employer || 0)).toLocaleString('pt-AO')} {user?.currency}</td>
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
