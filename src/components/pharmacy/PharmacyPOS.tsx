import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Search, ShoppingCart, Trash2, Plus, Minus,
  Printer, CreditCard, Wallet, X, AlertTriangle, Pill, CheckCircle2, Banknote
} from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

export default function PharmacyPOS() {
  const { token, user } = useAuth();
  const [medicamentos, setMedicamentos] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [lastSale, setLastSale] = useState<any>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'multicaixa' | 'credit'>('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [autoPrint, setAutoPrint] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [discount, setDiscount] = useState('0');
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    pageStyle: `
      @page { size: 80mm auto; margin: 0mm; }
      @media print { body { margin: 0; padding: 0; } }
    `,
  });

  useEffect(() => { fetchMedicamentos(); }, []);

  const fetchMedicamentos = async () => {
    try {
      const res = await fetch('/api/farmacia/medicamentos', { headers: { Authorization: `Bearer ${token}` } });
      setMedicamentos(await res.json());
    } finally { setLoading(false); }
  };

  const filteredMedicamentos = medicamentos.filter(m =>
    m.nome_medicamento?.toLowerCase().includes(search.toLowerCase()) ||
    (m.codigo_barras && m.codigo_barras.includes(search))
  );

  const addToCart = (med: any) => {
    if (med.stock_total <= 0) return;
    const existing = cart.find(i => i.id === med.id);
    if (existing) {
      if (existing.quantity >= med.stock_total) return;
      setCart(cart.map(i => i.id === med.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, { ...med, quantity: 1 }]);
    }
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(cart.map(i => {
      if (i.id !== id) return i;
      const newQ = i.quantity + delta;
      return newQ > 0 && newQ <= i.stock_total ? { ...i, quantity: newQ } : i;
    }));
  };

  const removeFromCart = (id: number) => setCart(cart.filter(i => i.id !== id));

  const subtotal = cart.reduce((s, i) => s + i.preco_venda * i.quantity, 0);
  const discountAmt = Math.min(subtotal, parseFloat(discount) || 0);
  const afterDiscount = subtotal - discountAmt;
  const tax = afterDiscount * 0.14;
  const total = afterDiscount + tax;
  const amountPaidNum = parseFloat(amountPaid) || 0;
  const change = Math.max(0, amountPaidNum - total);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if ((paymentMethod === 'cash' || paymentMethod === 'multicaixa') && amountPaidNum < total) {
      alert('Valor insuficiente para cobrir o total.');
      return;
    }
    setProcessing(true);
    try {
      const payload = {
        itens: cart.map(i => ({ medicamento_id: i.id, quantidade: i.quantity, preco_unitario: i.preco_venda })),
        forma_pagamento: paymentMethod,
        valor_entregue: amountPaidNum,
        desconto: discountAmt,
      };
      const res = await fetch('/api/farmacia/vendas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erro ao finalizar venda' }));
        throw new Error(err.error || 'Erro ao finalizar venda');
      }
      const data = await res.json();
      const saleRecord = { ...data, items: cart, subtotal, discountAmt, tax, total, amountPaid: amountPaidNum, change, date: new Date().toLocaleString('pt-AO') };
      setLastSale(saleRecord);
      setCart([]);
      setShowPayment(false);
      setAmountPaid('');
      setDiscount('0');
      fetchMedicamentos();
      if (autoPrint) setTimeout(() => handlePrint(), 500);
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally { setProcessing(false); }
  };

  const payMethods = [
    { id: 'cash', label: 'Dinheiro', icon: Banknote },
    { id: 'multicaixa', label: 'Multicaixa', icon: CreditCard },
    { id: 'credit', label: 'Crédito', icon: Wallet },
  ];

  return (
    <div className="flex h-[calc(100vh-130px)] overflow-hidden">
      {/* ─── Hidden Receipt ─── */}
      <div style={{ display: 'none' }}>
        <div ref={receiptRef} style={{ fontFamily: 'monospace', fontSize: '12px', padding: '4mm', width: '80mm', background: '#fff', color: '#000' }}>
          <div style={{ textAlign: 'center', marginBottom: '6mm' }}>
            <div style={{ fontWeight: 900, fontSize: '15px', textTransform: 'uppercase' }}>{user?.company_name}</div>
            <div>FARMÁCIA</div>
            <div>NIF: {user?.nif || '—'}</div>
            <div>Tel: {user?.phone || '—'}</div>
          </div>
          <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '3mm 0', marginBottom: '4mm' }}>
            <div>FATURA: {lastSale?.numero_factura}</div>
            <div>DATA: {lastSale?.date}</div>
            <div>OPERADOR: {user?.name}</div>
            <div>MÉTODO: {lastSale?.forma_pagamento?.toUpperCase()}</div>
          </div>
          <table style={{ width: '100%', marginBottom: '4mm', fontSize: '11px' }}>
            <thead><tr style={{ borderBottom: '1px solid #000' }}>
              <th style={{ textAlign: 'left' }}>Item</th>
              <th style={{ textAlign: 'right' }}>Qtd</th>
              <th style={{ textAlign: 'right' }}>Total</th>
            </tr></thead>
            <tbody>
              {lastSale?.items?.map((i: any) => (
                <tr key={i.id}>
                  <td>{i.nome_medicamento}</td>
                  <td style={{ textAlign: 'right' }}>{i.quantity}</td>
                  <td style={{ textAlign: 'right' }}>{(i.quantity * i.preco_venda).toLocaleString('pt-AO')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ borderTop: '1px dashed #000', paddingTop: '3mm', fontSize: '11px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal:</span><span>{lastSale?.subtotal?.toLocaleString('pt-AO')}</span></div>
            {lastSale?.discountAmt > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Desconto:</span><span>-{lastSale?.discountAmt?.toLocaleString('pt-AO')}</span></div>}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>IVA 14%:</span><span>{lastSale?.tax?.toLocaleString('pt-AO')}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '14px', borderTop: '1px dashed #000', marginTop: '3mm', paddingTop: '3mm' }}>
              <span>TOTAL:</span><span>{lastSale?.total?.toLocaleString('pt-AO')} {user?.currency}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2mm' }}><span>Entregue:</span><span>{lastSale?.amountPaid?.toLocaleString('pt-AO')}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}><span>Troco:</span><span>{lastSale?.change?.toLocaleString('pt-AO')}</span></div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '8mm', fontSize: '10px' }}>
            <p>Obrigado pela preferência!</p>
            <p>— Venda Plus —</p>
          </div>
        </div>
      </div>

      {/* ─── Products Panel ─── */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-white/5">
        {/* Search Bar */}
        <div className="p-4 glass-panel border-b border-white/5 shrink-0">
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-400/40 group-focus-within:text-emerald-400 transition-colors" size={16} />
            <input
              type="text"
              placeholder="Pesquisar por nome ou código de barras..."
              className="w-full pl-12 pr-5 py-4 bg-white/5 border border-white/5 rounded-2xl focus:bg-white/[0.08] focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/5 font-black text-[11px] text-white placeholder:text-white/20 outline-none transition-all uppercase tracking-[0.1em] shadow-inner"
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredMedicamentos.map(med => {
                const inCart = cart.find(i => i.id === med.id);
                const outOfStock = med.stock_total <= 0;
                return (
                  <div
                    key={med.id}
                    onClick={() => !outOfStock && addToCart(med)}
                    className={`glass-panel p-5 rounded-[28px] border flex flex-col gap-3 group relative overflow-hidden transition-all ${outOfStock
                        ? 'opacity-40 cursor-not-allowed border-white/5'
                        : inCart
                          ? 'border-emerald-500/40 cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.1)] hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]'
                          : 'border-white/5 cursor-pointer hover:border-emerald-500/20 hover:shadow-[0_0_20px_rgba(16,185,129,0.05)]'
                      }`}
                  >
                    {/* In-cart badge */}
                    {inCart && (
                      <div className="absolute top-3 right-3 w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px] font-black shadow-lg shadow-emerald-500/50">
                        {inCart.quantity}
                      </div>
                    )}

                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 transition-all ${outOfStock ? 'bg-white/5 text-white/20 border-white/5' :
                        'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                      }`}>
                      <Pill size={22} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-black text-white text-[11px] uppercase tracking-tight line-clamp-2 leading-tight group-hover:text-emerald-400 transition-colors">
                        {med.nome_medicamento}
                      </p>
                      <p className="text-[9px] font-black text-white/20 mt-1 uppercase tracking-widest">
                        {[med.dosagem, med.forma_farmaceutica].filter(Boolean).join(' • ')}
                      </p>
                    </div>

                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Preço</p>
                        <p className="font-black text-emerald-400 text-sm tabular-nums">{med.preco_venda?.toLocaleString('pt-AO')}</p>
                        <p className="text-[9px] text-white/20 font-bold">{user?.currency}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-0.5">Stock</p>
                        <p className={`font-black text-sm tabular-nums ${med.stock_total <= (med.estoque_minimo || 5) ? 'text-red-400' : 'text-white/60'}`}>
                          {med.stock_total}
                        </p>
                      </div>
                    </div>

                    {med.necessita_receita && (
                      <div className="text-[8px] font-black uppercase tracking-widest text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-2 py-1 text-center">
                        Receita Obrigatória
                      </div>
                    )}
                  </div>
                );
              })}
              {filteredMedicamentos.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-24 text-white/10 gap-4">
                  <Pill size={40} />
                  <p className="text-[10px] font-black uppercase tracking-[0.4em]">Nenhum medicamento encontrado</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── Cart Panel ─── */}
      <div className="w-[380px] flex flex-col glass-panel border-l border-white/5 shadow-[-8px_0_40px_rgba(0,0,0,0.3)] z-10 shrink-0">
        {/* Cart Header */}
        <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <ShoppingCart size={22} className="text-emerald-400" />
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-emerald-500 text-white rounded-full text-[10px] font-black flex items-center justify-center shadow-lg shadow-emerald-500/50">
                  {cart.length}
                </span>
              )}
            </div>
            <h2 className="font-black text-white text-sm uppercase tracking-widest italic">Carrinho</h2>
          </div>
          {cart.length > 0 && (
            <button onClick={() => setCart([])} className="text-[9px] font-black uppercase tracking-widest text-red-400/60 hover:text-red-400 transition-colors border border-red-500/10 hover:border-red-500/20 px-3 py-1.5 rounded-xl">
              Limpar
            </button>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-white/10 gap-4">
              <ShoppingCart size={48} />
              <p className="text-[10px] font-black uppercase tracking-[0.4em]">Carrinho vazio</p>
              <p className="text-[9px] font-black text-white/5 uppercase tracking-widest text-center">Clique nos medicamentos para os adicionar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map(item => (
                <div key={item.id} className="glass-panel p-4 rounded-2xl border border-white/5 group hover:border-emerald-500/20 transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <p className="font-black text-white text-[11px] uppercase tracking-tight leading-tight flex-1 mr-2 group-hover:text-emerald-400 transition-colors">
                      {item.nome_medicamento}
                    </p>
                    <button onClick={() => removeFromCart(item.id)} className="text-red-400/40 hover:text-red-400 p-1 rounded-lg hover:bg-red-500/5 transition-all shrink-0">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-black text-emerald-400 tabular-nums text-sm">{(item.preco_venda * item.quantity).toLocaleString('pt-AO')} {user?.currency}</p>
                      {item.quantity > 1 && (
                        <p className="text-[9px] text-white/20 font-black">{item.preco_venda.toLocaleString('pt-AO')} × {item.quantity}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 glass-panel px-3 py-2 rounded-xl border border-white/5">
                      <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 flex items-center justify-center text-white/40 hover:text-red-400 transition-colors font-black">
                        <Minus size={12} />
                      </button>
                      <span className="font-black text-white/80 w-4 text-center text-sm tabular-nums">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 flex items-center justify-center text-white/40 hover:text-emerald-400 transition-colors font-black">
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totals & Actions */}
        <div className="p-5 border-t border-white/5 bg-white/[0.02] space-y-4">
          {/* Discount */}
          <div className="glass-panel p-3 rounded-2xl border border-white/5 flex items-center gap-3">
            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest shrink-0">Desconto</span>
            <input
              type="number"
              min="0"
              value={discount}
              onChange={e => setDiscount(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none font-black text-amber-400 text-right tabular-nums text-sm placeholder:text-white/10"
              placeholder="0"
            />
            <span className="text-[9px] font-black text-white/20 shrink-0">{user?.currency}</span>
          </div>

          {/* Totals */}
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-black text-white/30 uppercase tracking-widest">
              <span>Subtotal</span>
              <span className="tabular-nums">{subtotal.toLocaleString('pt-AO')} {user?.currency}</span>
            </div>
            {discountAmt > 0 && (
              <div className="flex justify-between text-[10px] font-black text-amber-400/70 uppercase tracking-widest">
                <span>Desconto</span>
                <span className="tabular-nums">-{discountAmt.toLocaleString('pt-AO')} {user?.currency}</span>
              </div>
            )}
            <div className="flex justify-between text-[10px] font-black text-white/30 uppercase tracking-widest">
              <span>IVA (14%)</span>
              <span className="tabular-nums">{tax.toLocaleString('pt-AO')} {user?.currency}</span>
            </div>
            <div className="flex justify-between pt-3 border-t border-white/5">
              <span className="font-black text-white uppercase tracking-widest text-sm">Total</span>
              <span className="font-black text-emerald-400 text-xl tabular-nums">{total.toLocaleString('pt-AO')} {user?.currency}</span>
            </div>
          </div>

          {/* Checkout Button */}
          <button
            onClick={() => { setAmountPaid(''); setShowPayment(true); }}
            disabled={cart.length === 0}
            className="w-full py-5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-[0_0_40px_rgba(16,185,129,0.3)] active:scale-[0.98] transition-all shadow-2xl"
          >
            <CreditCard size={18} />
            Finalizar Venda
          </button>

          {/* Auto-print toggle */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setAutoPrint(!autoPrint)}
          >
            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${autoPrint ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'border-white/10 text-transparent'}`}>
              {autoPrint && <CheckCircle2 size={12} />}
            </div>
            <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] group-hover:text-white/40 transition-colors flex items-center gap-2">
              <Printer size={12} />
              Impressão Automática
            </span>
          </div>
        </div>
      </div>

      {/* ─── Payment Modal ─── */}
      {showPayment && (
        <div className="fixed inset-0 bg-bg-deep/80 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
          <div className="glass-panel rounded-[40px] w-full max-w-md overflow-hidden shadow-2xl border border-white/10 relative">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

            {/* Modal Header */}
            <div className="p-10 border-b border-white/5 bg-emerald-500/[0.03]">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                    Finalizar <span style={{ background: 'linear-gradient(135deg, #34d399, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Venda</span>
                  </h3>
                  <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mt-2">Farmácia</p>
                </div>
                <button onClick={() => setShowPayment(false)} className="w-10 h-10 text-white/30 hover:text-white border border-white/5 rounded-xl flex items-center justify-center hover:bg-white/5 transition-all">
                  <X size={18} />
                </button>
              </div>

              {/* Total Display */}
              <div className="mt-8 glass-panel p-5 rounded-2xl border border-emerald-500/10 text-center">
                <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] mb-2">Total a Pagar</p>
                <p className="text-4xl font-black text-emerald-400 tabular-nums italic">{total.toLocaleString('pt-AO')}</p>
                <p className="text-sm font-black text-emerald-400/40 mt-1">{user?.currency}</p>
              </div>
            </div>

            <div className="p-10 space-y-6">
              {/* Payment Method Tabs */}
              <div className="glass-panel p-1.5 rounded-2xl border border-white/5 flex gap-1">
                {payMethods.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setPaymentMethod(id as any)}
                    className={`flex-1 py-3 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] flex flex-col items-center gap-1.5 transition-all ${paymentMethod === id
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                        : 'text-white/30 hover:text-white/50'
                      }`}
                  >
                    <Icon size={16} />
                    {label}
                  </button>
                ))}
              </div>

              {/* Amount Input */}
              {(paymentMethod === 'cash' || paymentMethod === 'multicaixa') ? (
                <div className="space-y-4">
                  <div className="glass-panel p-5 rounded-2xl border border-white/5 focus-within:border-emerald-500/30 transition-all">
                    <label className="block text-[9px] font-black text-white/20 uppercase tracking-[0.4em] mb-3">
                      {paymentMethod === 'cash' ? 'Valor Entregue pelo Cliente' : 'Valor Confirmado pelo Terminal'}
                    </label>
                    <input
                      type="number"
                      className="w-full bg-transparent border-none outline-none font-black text-4xl text-white tabular-nums tracking-tighter placeholder:text-white/10"
                      value={amountPaid}
                      onChange={e => setAmountPaid(e.target.value)}
                      placeholder="0"
                      autoFocus
                    />
                  </div>

                  {/* Quick amounts */}
                  <div className="grid grid-cols-4 gap-2">
                    {[Math.ceil(total), Math.ceil(total / 500) * 500 + 500, Math.ceil(total / 1000) * 1000 + 1000, Math.ceil(total / 5000) * 5000].map((v, i) => (
                      <button key={i} onClick={() => setAmountPaid(v.toString())} className="glass-panel py-3 rounded-xl text-[9px] font-black text-white/40 hover:text-emerald-400 hover:border-emerald-500/20 border border-white/5 transition-all tabular-nums">
                        {v.toLocaleString('pt-AO')}
                      </button>
                    ))}
                  </div>

                  {paymentMethod === 'cash' && amountPaidNum > 0 && (
                    <div className="glass-panel p-5 rounded-2xl border border-emerald-900/30 bg-emerald-500/[0.03] flex justify-between items-center">
                      <span className="font-black text-white/40 text-[10px] uppercase tracking-widest">Troco</span>
                      <span className="font-black text-emerald-400 text-2xl tabular-nums">{change.toLocaleString('pt-AO')} <span className="text-sm opacity-50">{user?.currency}</span></span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="glass-panel p-6 rounded-2xl border border-amber-500/10 bg-amber-500/[0.03]">
                  <div className="flex items-center gap-3 mb-3">
                    <AlertTriangle size={18} className="text-amber-400" />
                    <span className="font-black text-amber-400 text-xs uppercase tracking-widest">Venda a Crédito</span>
                  </div>
                  <p className="text-[11px] text-white/30 font-black leading-relaxed">Esta venda será registada como dívida pendente. Certifique-se de que o paciente está identificado.</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button onClick={() => setShowPayment(false)} className="flex-1 py-4 font-black text-[10px] uppercase tracking-[0.3em] text-white/30 border border-white/5 rounded-2xl hover:bg-white/5 transition-all">
                  Cancelar
                </button>
                <button
                  onClick={handleCheckout}
                  disabled={processing}
                  className="flex-1 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] active:scale-[0.98] transition-all disabled:opacity-50 shadow-2xl"
                >
                  {processing ? 'A processar...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Success Toast ─── */}
      {lastSale && (
        <div className="fixed bottom-6 right-6 glass-panel p-6 rounded-[32px] shadow-2xl border border-emerald-500/20 z-50 flex items-center gap-5 max-w-sm shadow-[0_0_40px_rgba(16,185,129,0.1)]">
          <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.2)] shrink-0">
            <CheckCircle2 size={28} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-white text-xs uppercase tracking-widest italic">Venda Realizada!</p>
            <p className="text-[9px] text-emerald-400/60 font-black uppercase tracking-widest mt-1">{lastSale.numero_factura}</p>
          </div>
          <div className="flex flex-col gap-2">
            <button onClick={() => handlePrint()} className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500/30 transition-all">
              <Printer size={14} />
            </button>
            <button onClick={() => setLastSale(null)} className="px-4 py-2 border border-white/5 text-white/30 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/5 transition-all">
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
