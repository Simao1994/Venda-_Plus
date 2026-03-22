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
    <div className="p-8 space-y-10 relative animate-in fade-in duration-700">
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

      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative">
        <div className="relative">
           <div className="absolute -left-10 top-1/2 -translate-y-1/2 w-1 h-12 bg-gold-primary rounded-full shadow-[0_0_20px_rgba(212,175,55,0.4)]" />
           <h1 className="text-4xl font-black text-white tracking-tighter italic uppercase">
            Intelligence <span className="text-gold-gradient">Matrix</span>
          </h1>
          <p className="text-[10px] font-black text-gold-primary/40 uppercase tracking-[0.4em] mt-2 italic">Data visualization & performance analytics</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <button
            onClick={() => handlePrint()}
            className="flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-white/5 border border-white/10 text-white/60 rounded-2xl hover:bg-white/10 font-black uppercase tracking-widest text-[10px] transition-all shadow-xl backdrop-blur-md active:scale-95"
          >
            <Printer size={18} className="text-gold-primary/60" />
            Export Archive (A4)
          </button>
          <button
            onClick={handleExport}
            className="flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-gold-gradient text-bg-deep rounded-2xl hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] font-black uppercase tracking-widest text-[10px] transition-all shadow-2xl active:scale-95 border border-white/10"
          >
            <Download size={18} />
            Data Extraction (CSV)
          </button>
        </div>
      </header>

      {/* Tabs */}
      <nav className="flex bg-white/[0.02] p-1.5 rounded-[24px] border border-white/5 shadow-inner overflow-x-auto no-scrollbar gap-2 max-w-fit">
        {[
          { id: 'sales', label: 'Revenue Streams', icon: TrendingUp },
          { id: 'products', label: 'Asset Velocity', icon: BarChart3 },
          { id: 'profit', label: 'Margin Analysis', icon: DollarSign },
          { id: 'hr', label: 'Human Capital', icon: Users },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-3 px-8 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all whitespace-nowrap border-2 ${activeTab === tab.id 
              ? 'bg-gold-primary/10 border-gold-primary/30 text-gold-primary shadow-[0_0_20px_rgba(212,175,55,0.1)]' 
              : 'border-transparent text-white/30 hover:text-white/60 hover:bg-white/5'}`}
          >
            <tab.icon size={16} className={activeTab === tab.id ? 'text-gold-primary' : ''} />
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-32 space-y-6">
          <div className="w-16 h-16 border-4 border-gold-primary/10 border-t-gold-primary rounded-full animate-spin shadow-[0_0_30px_rgba(212,175,55,0.2)]" />
          <p className="text-[10px] font-black text-gold-primary/40 uppercase tracking-[0.5em] animate-pulse">Sincronizando Banco de Dados...</p>
        </div>
      )}

      {/* ── SALES TAB ── */}
      {!loading && activeTab === 'sales' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-panel p-8 rounded-[32px] border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gold-primary/5 rounded-full -mr-16 -mt-16 group-hover:bg-gold-primary/10 transition-all blur-3xl" />
              <h3 className="text-white/30 text-[10px] font-black uppercase tracking-widest mb-4 italic">Faturamento Total</h3>
              <p className="text-4xl font-black text-white italic tracking-tighter">
                {filteredSales.reduce((acc, s) => acc + s.total, 0).toLocaleString('pt-AO')} <span className="text-gold-gradient">{user?.currency}</span>
              </p>
            </div>
            <div className="glass-panel p-8 rounded-[32px] border border-white/5 relative overflow-hidden group">
              <h3 className="text-white/30 text-[10px] font-black uppercase tracking-widest mb-4 italic">Volume de Faturas</h3>
              <p className="text-4xl font-black text-white italic tracking-tighter">{filteredSales.length.toLocaleString()}</p>
            </div>
            <div className="glass-panel p-8 rounded-[32px] border border-white/5 relative overflow-hidden group">
              <h3 className="text-white/30 text-[10px] font-black uppercase tracking-widest mb-4 italic">Ticket Médio</h3>
              <p className="text-4xl font-black text-gold-primary italic tracking-tighter">
                {filteredSales.length > 0 ? Math.round(filteredSales.reduce((acc, s) => acc + s.total, 0) / filteredSales.length).toLocaleString('pt-AO') : 0} <span className="text-[0.6em] opacity-40 uppercase ml-1 font-black">{user?.currency}</span>
              </p>
            </div>
          </div>

          <div className="glass-panel rounded-[40px] border border-white/5 overflow-hidden shadow-2xl relative">
            <div className="p-10 border-b border-white/5 flex flex-col xl:flex-row justify-between items-center gap-8 bg-white/[0.02]">
              <div className="relative flex-1 w-full max-w-2xl">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gold-primary/40" size={20} />
                <input
                  type="text"
                  placeholder="LOCALIZAR TRANSACÇÃO OU ENTIDADE..."
                  className="w-full pl-16 pr-6 py-5 rounded-2xl bg-white/5 border border-white/10 focus:ring-4 focus:ring-gold-primary/10 focus:border-gold-primary/30 font-black text-[11px] text-white uppercase tracking-widest placeholder:text-white/10 outline-none transition-all"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              
              <div className="flex flex-wrap items-center gap-6 w-full xl:w-auto">
                <div className="flex items-center gap-6 bg-white/5 p-3 rounded-3xl border border-white/10">
                  <div className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 rounded-xl transition-all group">
                    <span className="text-[9px] font-black uppercase tracking-widest text-gold-primary/40 group-hover:text-gold-primary/90">De</span>
                    <input type="date" className="bg-transparent border-none focus:ring-0 font-black text-[11px] text-white outline-none cursor-pointer [color-scheme:dark]" value={startDate} onChange={e => setStartDate(e.target.value)} />
                  </div>
                  <div className="w-[1px] h-6 bg-white/10" />
                  <div className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 rounded-xl transition-all group">
                    <span className="text-[9px] font-black uppercase tracking-widest text-gold-primary/40 group-hover:text-gold-primary/90">Até</span>
                    <input type="date" className="bg-transparent border-none focus:ring-0 font-black text-[11px] text-white outline-none cursor-pointer [color-scheme:dark]" value={endDate} onChange={e => setEndDate(e.target.value)} />
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-white/5 p-3 rounded-3xl border border-white/10 flex-1 xl:flex-none">
                  <Filter size={16} className="text-gold-primary/40 ml-2" />
                  <select className="flex-1 min-w-[180px] bg-transparent border-none focus:ring-0 font-black text-[10px] text-white uppercase tracking-widest outline-none cursor-pointer" value={registerId} onChange={e => setRegisterId(e.target.value)}>
                    <option value="" className="bg-bg-deep">Sessões Globais</option>
                    {registers.map(reg => (
                      <option key={reg.id} value={reg.id} className="bg-bg-deep">{new Date(reg.opened_at).toLocaleDateString()} — {reg.users?.name?.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#0B0B0B] text-[10px] font-black text-white/20 uppercase tracking-[0.2em] border-b border-white/5">
                    <th className="px-10 py-6">ID</th>
                    <th className="px-10 py-6">Voucher/Hash</th>
                    <th className="px-10 py-6">Timestamp</th>
                    <th className="px-10 py-6">Client Identity</th>
                    <th className="px-10 py-6">Protocol</th>
                    <th className="px-10 py-6 text-right">Magnitude ({user?.currency})</th>
                    <th className="px-10 py-6 text-center">Security Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredSales.map((sale, i) => (
                    <tr key={sale.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-10 py-6 text-white/20 text-[10px] font-black italic">{i + 1}</td>
                      <td className="px-10 py-6 font-black text-white italic tracking-tighter uppercase">{sale.invoice_number}</td>
                      <td className="px-10 py-6 text-white/60 text-[11px] font-bold">
                        {new Date(sale.created_at).toLocaleString('pt-AO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-10 py-6 text-white text-[11px] font-black uppercase italic tracking-tight">{sale.customer_name || 'CONSUMIDOR FINAL'}</td>
                      <td className="px-10 py-6 text-gold-primary/60 font-black uppercase text-[9px] tracking-widest italic">{sale.payment_method || '—'}</td>
                      <td className="px-10 py-6 text-right font-black text-white italic tracking-tighter text-base">{sale.total.toLocaleString('pt-AO')}</td>
                      <td className="px-10 py-6 text-center">
                        <span className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-[0.2em] border shadow-sm ${
                          sale.status === 'paid' 
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                            : 'bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                        }`}>
                          {sale.status === 'paid' ? 'Authenticated' : 'Unsigned'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredSales.length === 0 && (
                <div className="py-32 text-center text-white/10 font-black uppercase text-[12px] tracking-[0.4em] italic bg-[#0B0B0B]/40 animate-pulse">
                  No records detected in current vector.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── PRODUCTS TAB ── */}
      {!loading && activeTab === 'products' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in zoom-in duration-500">
          <div className="glass-panel p-10 rounded-[40px] border border-white/5 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-32 -mt-32 opacity-30" />
            <h3 className="text-xl font-black text-white mb-10 flex items-center gap-4 italic tracking-tighter uppercase">
              <TrendingUp className="text-gold-primary" /> Velocity Indices <span className="text-gold-primary/20">(Units)</span>
            </h3>
            <div className="h-[450px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.03)" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 9, fontWeight: 900, fill: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                    contentStyle={{ borderRadius: '20px', border: '1px solid rgba(212,175,55,0.2)', backgroundColor: '#0B0B0B', padding: '16px' }} 
                    itemStyle={{ fontWeight: 900, color: '#D4AF37', fontSize: '11px', textTransform: 'uppercase' }}
                  />
                  <Bar dataKey="total_quantity" fill="#D4AF37" radius={[0, 12, 12, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="glass-panel p-10 rounded-[40px] border border-white/5 shadow-2xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-64 h-64 bg-gold-primary/5 rounded-full blur-3xl -mr-32 -mt-32 opacity-30" />
            <h3 className="text-xl font-black text-white mb-10 flex items-center gap-4 italic tracking-tighter uppercase">
              <PieChart className="text-gold-primary" /> Revenue Spectrum
            </h3>
            <div className="h-[450px]">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie data={topProducts} dataKey="total_revenue" nameKey="name" cx="50%" cy="45%" outerRadius={140} innerRadius={90} paddingAngle={8} stroke="transparent">
                    {topProducts.map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="hover:opacity-80 transition-opacity cursor-pointer shadow-lg" />))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: '#0B0B0B', fontSize: '10px', color: '#fff' }}
                  />
                </RePieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-6 mt-4">
                {topProducts.slice(0, 4).map((p, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-[9px] font-black uppercase text-white/40 tracking-widest">{p.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PROFIT TAB ── */}
      {!loading && activeTab === 'profit' && profitReport && (
        <div className="space-y-10 animate-in fade-in zoom-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="glass-panel p-10 rounded-[40px] border border-white/5 text-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-white/[0.01] group-hover:bg-white/[0.03] transition-all" />
              <h3 className="text-white/20 text-[10px] font-black uppercase tracking-[0.3em] mb-6 italic">Gross Cash Inflow</h3>
              <p className="text-5xl font-black text-white italic tracking-tighter">
                {profitReport.revenue?.toLocaleString('pt-AO')} <span className="text-gold-gradient text-2xl">{user?.currency}</span>
              </p>
            </div>
            <div className="glass-panel p-10 rounded-[40px] border border-white/5 text-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-red-500/[0.01] group-hover:bg-red-500/[0.03] transition-all" />
              <h3 className="text-white/20 text-[10px] font-black uppercase tracking-[0.3em] mb-6 italic">Operational Asset Liability</h3>
              <p className="text-5xl font-black text-red-500/80 italic tracking-tighter">
                {profitReport.cost?.toLocaleString('pt-AO')} <span className="text-red-500/30 text-2xl">{user?.currency}</span>
              </p>
            </div>
            <div className="glass-panel p-10 rounded-[40px] border border-gold-primary/20 text-center relative overflow-hidden group bg-bg-deep/40">
              <div className="absolute top-0 right-0 w-48 h-48 bg-gold-primary/10 rounded-full -mr-24 -mt-24 z-0 blur-[80px]" />
              <div className="relative z-10">
                <h3 className="text-gold-primary/30 text-[10px] font-black uppercase tracking-[0.3em] mb-6 italic">Net Yield Surplus</h3>
                <p className="text-5xl font-black text-gold-gradient italic tracking-tighter">
                  {profitReport.profit?.toLocaleString('pt-AO')} <span className="text-gold-primary/30 text-2xl">{user?.currency}</span>
                </p>
                <div className="mt-6 inline-flex items-center gap-3 px-6 py-2 bg-gold-primary/10 rounded-full border border-gold-primary/20 shadow-xl">
                  <div className="w-2 h-2 rounded-full bg-gold-primary animate-pulse" />
                  <span className="text-[11px] font-black text-gold-primary uppercase tracking-[0.2em]">Efficiency: {profitReport.revenue > 0 ? ((profitReport.profit / profitReport.revenue) * 100).toFixed(1) : 0}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── HR TAB ── */}
      {!loading && activeTab === 'hr' && (
        <div className="glass-panel rounded-[40px] border border-white/5 overflow-hidden shadow-2xl animate-in slide-in-from-right-4 duration-500">
          <div className="p-10 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <div>
               <h3 className="text-2xl font-black text-white italic uppercase tracking-tight">Valkyrie <span className="text-gold-gradient">Payroll</span></h3>
               <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mt-1 italic">Human asset allocation history</p>
            </div>
            <Users className="text-gold-primary/20" size={32} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#0B0B0B] text-[10px] font-black text-white/20 uppercase tracking-[0.2em] border-b border-white/5">
                  <th className="px-10 py-6">Fiscal Cycle</th>
                  <th className="px-10 py-6 text-right">Gross Magnitude</th>
                  <th className="px-10 py-6 text-right">Net Liquidity</th>
                  <th className="px-10 py-6 text-right">State Impost (IRT+INSS)</th>
                  <th className="px-10 py-6 text-center">Batch Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {payrollSummary.map(p => (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition-all group">
                    <td className="px-10 py-6 font-black text-white uppercase italic tracking-tighter text-base">{p.month}/{p.year}</td>
                    <td className="px-10 py-6 text-right font-bold text-white/40 group-hover:text-white/70 transition-colors">{p.total_gross?.toLocaleString('pt-AO')} <span className="text-[9px] opacity-30">{user?.currency}</span></td>
                    <td className="px-10 py-6 text-right font-black text-gold-primary text-xl italic tracking-tighter">{p.total_net?.toLocaleString('pt-AO')} <span className="text-[10px] opacity-40">{user?.currency}</span></td>
                    <td className="px-10 py-6 text-right font-bold text-red-500/60 transition-colors uppercase italic text-[11px]">{((p.total_irt || 0) + (p.total_inss_employee || 0) + (p.total_inss_employer || 0)).toLocaleString('pt-AO')} {user?.currency}</td>
                    <td className="px-10 py-6 text-center">
                      <span className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border ${
                        p.status === 'finalized' 
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                          : 'bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-lg shadow-amber-900/10'
                      }`}>
                        {p.status === 'finalized' ? 'Committed' : 'Draft'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {payrollSummary.length === 0 && (
               <div className="py-32 text-center text-white/10 font-black uppercase text-[12px] tracking-[0.4em] italic bg-[#0B0B0B]/40">
                  No payroll batches deployed.
                </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
