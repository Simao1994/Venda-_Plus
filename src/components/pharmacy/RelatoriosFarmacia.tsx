import React, { useState, useEffect, useRef } from 'react';
import { FileText, TrendingUp, Search, Printer, Download, Package, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useReactToPrint } from 'react-to-print';

// ─── A4 Printable Template ────────────────────────────────────────────────────
const PrintableA4 = React.forwardRef<HTMLDivElement, { user: any; vendas: any[]; period: string }>(
  ({ user, vendas, period }, ref) => {
    const today = new Date().toLocaleDateString('pt-AO', { day: '2-digit', month: 'long', year: 'numeric' });
    const total = vendas.reduce((s, v) => s + (v.total || 0), 0);

    const periodLabels: Record<string, string> = {
      today: 'Hoje',
      '7days': 'Últimos 7 dias',
      month: 'Este Mês',
      all: 'Todo o Período',
    };

    return (
      <div ref={ref} style={{ fontFamily: "'Segoe UI', Arial, sans-serif", background: 'white', color: '#111', width: '210mm', minHeight: '297mm', padding: '15mm 18mm', boxSizing: 'border-box' }}>
        <style>{`
          @page { size: A4 portrait; margin: 0; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        `}</style>

        {/* Company Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #065f46', paddingBottom: '10mm', marginBottom: '8mm' }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: '22px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{user?.company_name || 'Farmácia'}</div>
            <div style={{ fontSize: '11px', color: '#555', marginTop: '3px' }}>NIF: {user?.nif || '—'}</div>
            <div style={{ fontSize: '11px', color: '#065f46', fontWeight: 700, marginTop: '2px' }}>FARMÁCIA LICENCIADA</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 900, fontSize: '16px', color: '#065f46', textTransform: 'uppercase' }}>Relatório de Vendas Farmacêuticas</div>
            <div style={{ fontSize: '11px', color: '#555', marginTop: '4px' }}>Período: {periodLabels[period] || period}</div>
            <div style={{ fontSize: '11px', color: '#555' }}>Emitido em: {today}</div>
          </div>
        </div>

        {/* Summary Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6mm', marginBottom: '8mm' }}>
          {[
            { label: 'Total de Vendas', value: `${total.toLocaleString('pt-AO')} ${user?.currency}`, color: '#065f46' },
            { label: 'Número de Faturas', value: vendas.length.toString(), color: '#1e40af' },
          ].map((c, i) => (
            <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: '6px', padding: '4mm' }}>
              <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: '#6b7280', marginBottom: '3px' }}>{c.label}</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: c.color }}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
          <thead>
            <tr style={{ background: '#065f46', color: '#fff' }}>
              {['Nº', 'Fatura', 'Data / Hora', 'Método Pagamento', `Total (${user?.currency})`, 'Estado'].map((h, i) => (
                <th key={i} style={{ padding: '3mm 4mm', textAlign: i >= 4 ? 'right' : 'left', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {vendas.map((v, i) => (
              <tr key={v.id} style={{ background: i % 2 === 0 ? '#f9fafb' : '#fff', pageBreakInside: 'avoid' }}>
                <td style={{ padding: '2.5mm 4mm', color: '#6b7280' }}>{i + 1}</td>
                <td style={{ padding: '2.5mm 4mm', fontWeight: 700 }}>{v.numero_factura}</td>
                <td style={{ padding: '2.5mm 4mm', color: '#374151' }}>{new Date(v.created_at).toLocaleString('pt-AO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                <td style={{ padding: '2.5mm 4mm', textTransform: 'capitalize' }}>{v.forma_pagamento || '—'}</td>
                <td style={{ padding: '2.5mm 4mm', textAlign: 'right', fontWeight: 700, color: '#065f46' }}>{(v.total || 0).toLocaleString('pt-AO')}</td>
                <td style={{ padding: '2.5mm 4mm', textAlign: 'right' }}>
                  <span style={{ background: '#d1fae5', color: '#065f46', borderRadius: '4px', padding: '1mm 2.5mm', fontWeight: 700, fontSize: '9px', textTransform: 'uppercase' }}>Pago</span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: '#065f46', color: '#fff', fontWeight: 900 }}>
              <td colSpan={4} style={{ padding: '3mm 4mm', textAlign: 'right', textTransform: 'uppercase', fontSize: '10px' }}>TOTAL GERAL</td>
              <td style={{ padding: '3mm 4mm', textAlign: 'right', fontSize: '13px' }}>{total.toLocaleString('pt-AO')}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>

        {/* Footer */}
        <div style={{ position: 'fixed', bottom: '10mm', left: '18mm', right: '18mm', borderTop: '1px solid #e5e7eb', paddingTop: '4mm', display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#9ca3af' }}>
          <span>{user?.company_name} — Gerado automaticamente pelo Venda Plus</span>
          <span style={{ fontWeight: 700 }}>Documento de uso interno</span>
        </div>
      </div>
    );
  }
);
PrintableA4.displayName = 'PrintableA4';

// ─── Main Component ───────────────────────────────────────────────────────────
export default function RelatoriosFarmacia() {
  const { token, user } = useAuth();
  const [vendas, setVendas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState('today');
  const [expandedSale, setExpandedSale] = useState<number | null>(null);
  const [saleToPrint, setSaleToPrint] = useState<any>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  const printA4Ref = useRef<HTMLDivElement>(null);

  const handlePrintReceipt = useReactToPrint({
    contentRef: receiptRef,
    pageStyle: `@page { size: 80mm auto; margin: 0mm; } @media print { body { margin: 0; padding: 0; } }`,
  });

  const handlePrintA4 = useReactToPrint({
    contentRef: printA4Ref,
    pageStyle: `@page { size: A4 portrait; margin: 0; } @media print { body { -webkit-print-color-adjust: exact; } }`,
    documentTitle: `Farmácia-Relatório-${new Date().toLocaleDateString('pt-AO')}`,
  });

  useEffect(() => {
    fetchVendas();
    const interval = setInterval(fetchVendas, 30000);
    return () => clearInterval(interval);
  }, [filterDate]);

  const fetchVendas = async () => {
    try {
      const res = await fetch(`/api/farmacia/vendas?period=${filterDate}`, { headers: { Authorization: `Bearer ${token}` } });
      setVendas(await res.json());
    } finally { setLoading(false); }
  };

  const filteredVendas = vendas.filter(v =>
    v.numero_factura?.toLowerCase().includes(search.toLowerCase())
  );

  const totalVendas = filteredVendas.reduce((sum, v) => sum + (v.total || 0), 0);

  return (
    <div className="p-8 max-w-7xl mx-auto relative z-10">
      {/* Hidden A4 Print Area */}
      <div style={{ display: 'none' }}>
        <PrintableA4 ref={printA4Ref} user={user} vendas={filteredVendas} period={filterDate} />
        {/* Receipt (80mm) */}
        <div ref={receiptRef} style={{ fontFamily: 'monospace', fontSize: '12px', padding: '4mm', width: '80mm', background: 'white', color: 'black' }}>
          <div style={{ textAlign: 'center', marginBottom: '6mm' }}>
            <div style={{ fontWeight: 900, fontSize: '14px', textTransform: 'uppercase' }}>{user?.company_name}</div>
            <div style={{ fontSize: '10px' }}>FARMÁCIA | NIF: {user?.nif || '—'}</div>
          </div>
          <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '3mm 0', marginBottom: '4mm' }}>
            <div>FATURA: {saleToPrint?.numero_factura}</div>
            <div>DATA: {saleToPrint && new Date(saleToPrint.created_at).toLocaleString('pt-AO')}</div>
            <div>MÉTODO: {saleToPrint?.forma_pagamento?.toUpperCase()}</div>
          </div>
          <table style={{ width: '100%', fontSize: '11px' }}>
            <tbody>
              {saleToPrint?.itens?.map((item: any, idx: number) => (
                <tr key={idx}>
                  <td>{item.nome_medicamento}</td>
                  <td style={{ textAlign: 'right' }}>{item.quantidade}×{item.preco_unitario.toLocaleString('pt-AO')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ borderTop: '1px dashed #000', marginTop: '3mm', paddingTop: '3mm' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '14px' }}>
              <span>TOTAL:</span>
              <span>{saleToPrint?.total?.toLocaleString('pt-AO')} {user?.currency}</span>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '6mm', fontSize: '10px' }}>Obrigado pela preferência!</div>
        </div>
      </div>

      {/* Header */}
      <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
            Relatórios <span style={{ background: 'linear-gradient(135deg, #34d399, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Farmacêuticos</span>
          </h1>
          <p className="text-white/40 font-black text-[10px] uppercase tracking-[0.3em] mt-2 italic">Gestão de vendas e faturas em tempo real</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => handlePrintA4()}
            className="glass-panel text-white/60 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:text-emerald-400 transition-all border border-white/5 active:scale-95 shadow-xl"
          >
            <Printer size={16} />
            Imprimir A4
          </button>
        </div>
      </header>

      {/* Filters */}
      <div className="glass-panel p-3 rounded-[32px] border border-white/5 mb-8 flex flex-wrap items-center gap-4 shadow-2xl">
        <div className="flex-1 min-w-[200px] relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-400/40 group-focus-within:text-emerald-400 transition-colors" size={16} />
          <input
            type="text"
            placeholder="Pesquisar por fatura..."
            className="w-full pl-14 pr-6 py-4 bg-white/5 border border-white/5 rounded-2xl focus:bg-white/[0.08] focus:border-emerald-500/30 font-black text-[11px] text-white placeholder:text-white/20 outline-none transition-all uppercase tracking-[0.1em] shadow-inner"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
          className="bg-white/5 border border-white/5 p-4 px-8 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-white/60 outline-none appearance-none cursor-pointer min-w-[180px]"
        >
          <option value="today" className="bg-bg-deep text-white">Hoje</option>
          <option value="7days" className="bg-bg-deep text-white">Últimos 7 Dias</option>
          <option value="month" className="bg-bg-deep text-white">Este Mês</option>
          <option value="all" className="bg-bg-deep text-white">Todo o Período</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="glass-panel p-8 rounded-[40px] border border-white/5 flex items-center gap-6 shadow-2xl hover:border-emerald-500/20 transition-all">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-[1.5rem] flex items-center justify-center border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)] shrink-0">
            <TrendingUp size={28} />
          </div>
          <div>
            <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] mb-1">Total de Vendas</p>
            <p className="text-3xl font-black text-white tracking-tighter italic">{totalVendas.toLocaleString('pt-AO')} <span className="text-sm text-emerald-400/60 font-bold">{user?.currency}</span></p>
          </div>
        </div>
        <div className="glass-panel p-8 rounded-[40px] border border-white/5 flex items-center gap-6 shadow-2xl hover:border-blue-500/20 transition-all">
          <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-[1.5rem] flex items-center justify-center border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.1)] shrink-0">
            <FileText size={28} />
          </div>
          <div>
            <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] mb-1">Número de Faturas</p>
            <p className="text-3xl font-black text-white tracking-tighter italic">{filteredVendas.length}</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel rounded-[40px] border border-white/5 overflow-hidden shadow-3xl">
        <div className="p-8 border-b border-white/5 bg-white/[0.02]">
          <h2 className="font-black text-white uppercase tracking-widest text-sm italic flex items-center gap-4">
            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            Histórico de Vendas
          </h2>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/[0.03] text-[9px] font-black text-white/30 uppercase tracking-[0.2em] border-b border-white/5">
                <th className="px-8 py-6">Fatura</th>
                <th className="px-8 py-6">Data</th>
                <th className="px-8 py-6">Método</th>
                <th className="px-8 py-6 text-right">Total</th>
                <th className="px-8 py-6 text-center">Estado</th>
                <th className="px-8 py-6 text-center print:hidden">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={6} className="px-8 py-20 text-center">
                  <div className="w-10 h-10 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : filteredVendas.length === 0 ? (
                <tr><td colSpan={6} className="px-8 py-20 text-center">
                  <p className="text-[10px] font-black text-white/10 uppercase tracking-[0.4em]">Nenhuma venda encontrada</p>
                </td></tr>
              ) : filteredVendas.map(venda => (
                <React.Fragment key={venda.id}>
                  <tr className="hover:bg-emerald-500/[0.02] transition-colors group">
                    <td className="px-8 py-6 font-black text-white text-xs group-hover:text-emerald-400 transition-colors">{venda.numero_factura}</td>
                    <td className="px-8 py-6 text-[11px] font-black text-white/40 tabular-nums">{new Date(venda.created_at).toLocaleString('pt-AO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="px-8 py-6">
                      <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-white/5 text-white/30 rounded-full border border-white/5">{venda.forma_pagamento || '—'}</span>
                    </td>
                    <td className="px-8 py-6 text-right font-black text-emerald-400 tabular-nums">{(venda.total || 0).toLocaleString('pt-AO')} {user?.currency}</td>
                    <td className="px-8 py-6 text-center">
                      <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">Pago</span>
                    </td>
                    <td className="px-8 py-6 text-center print:hidden">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => setExpandedSale(expandedSale === venda.id ? null : venda.id)}
                          className="w-9 h-9 rounded-xl transition-all border border-white/10 text-white/30 hover:text-emerald-400 hover:border-emerald-500/20 flex items-center justify-center"
                        >
                          {expandedSale === venda.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                        <button
                          onClick={() => { setSaleToPrint(venda); setTimeout(handlePrintReceipt, 100); }}
                          className="w-9 h-9 rounded-xl transition-all border border-white/10 text-white/30 hover:text-blue-400 hover:border-blue-500/20 flex items-center justify-center"
                          title="Imprimir Recibo 80mm"
                        >
                          <Printer size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedSale === venda.id && (
                    <tr className="bg-emerald-500/[0.01]">
                      <td colSpan={6} className="px-8 py-4">
                        <div className="glass-panel rounded-2xl border border-emerald-500/10 p-5">
                          <h4 className="font-black text-white/60 text-[10px] uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Package size={14} className="text-emerald-400" />
                            Itens da Fatura
                          </h4>
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-white/20 border-b border-white/5 text-[9px] font-black uppercase tracking-widest">
                                <th className="pb-3 text-left">Medicamento</th>
                                <th className="pb-3 text-center">Qtd</th>
                                <th className="pb-3 text-right">Preço Unit.</th>
                                <th className="pb-3 text-right">Subtotal</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {venda.itens?.map((item: any, idx: number) => (
                                <tr key={idx}>
                                  <td className="py-2.5 font-black text-white/60">{item.nome_medicamento}</td>
                                  <td className="py-2.5 text-center text-white/40">{item.quantidade}</td>
                                  <td className="py-2.5 text-right text-white/40 tabular-nums">{item.preco_unitario.toLocaleString('pt-AO')}</td>
                                  <td className="py-2.5 text-right font-black text-emerald-400 tabular-nums">{(item.quantidade * item.preco_unitario).toLocaleString('pt-AO')}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
