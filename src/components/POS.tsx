import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Search, ShoppingCart, Trash2, Printer, CreditCard, User, Package, AlertTriangle, Wallet, UserPlus, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useReactToPrint } from 'react-to-print';
import PaymentModal from './PaymentModal';

interface Product {
  id: number;
  name: string;
  barcode: string;
  sale_price: number;
  stock: number;
  tax_percentage: number;
}

export default function POS() {
  const { user, token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'multicaixa' | 'credit'>('cash');
  const [cart, setCart] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [amountPaid, setAmountPaid] = useState<string>('0');
  const [showPayment, setShowPayment] = useState(false);
  const [showDebtPayment, setShowDebtPayment] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);
  const [companyProfile, setCompanyProfile] = useState<any>(null);
  const [cashRegister, setCashRegister] = useState<any>(null);
  const [view, setView] = useState<'products' | 'cart'>('products');
  const [showOpenRegister, setShowOpenRegister] = useState(false);
  const [initialCash, setInitialCash] = useState('0');
  const [autoPrint, setAutoPrint] = useState(true);
  const [discountPercentage, setDiscountPercentage] = useState<number>(0);
  const [isProForma, setIsProForma] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', nif: '', phone: '', address: '' });
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    pageStyle: `
      @page {
        size: 80mm auto;
        margin: 0mm;
      }
      @media print {
        body {
          margin: 0;
          padding: 0;
        }
      }
    `
  });

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
    fetchTopProducts();
    checkRegisterStatus();
    fetchCompanyProfile();

    // Barcode scanner listener
    let barcodeBuffer = '';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (barcodeBuffer.length > 3) {
          const product = products.find(p => p.barcode === barcodeBuffer);
          if (product) addToCart(product);
          barcodeBuffer = '';
        }
      } else if (e.key.length === 1) {
        barcodeBuffer += e.key;
        setTimeout(() => barcodeBuffer = '', 100); // Clear buffer if no more keys
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products]);

  const fetchCompanyProfile = async () => {
    const res = await fetch('/api/company/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setCompanyProfile(data);
  };

  const fetchTopProducts = async () => {
    const res = await fetch('/api/dashboard/top-products', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setTopProducts(data);
  };

  const checkRegisterStatus = async () => {
    const res = await fetch('/api/cash-registers/status', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setCashRegister(data);
    if (!data) setShowOpenRegister(true);
  };

  const handleOpenRegister = async () => {
    const res = await fetch('/api/cash-registers/open', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ initial_value: parseFloat(initialCash) })
    });
    if (res.ok) {
      setShowOpenRegister(false);
      checkRegisterStatus();
    }
  };

  const handleCloseRegister = async () => {
    if (!confirm('Deseja realmente fechar o caixa?')) return;

    // Calculate total sold during this session
    const resStats = await fetch('/api/dashboard/stats', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const stats = await resStats.json();
    const totalToday = stats.salesToday || 0;

    const res = await fetch('/api/cash-registers/close', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ total_sold: totalToday })
    });
    if (res.ok) {
      checkRegisterStatus();
    }
  };


  const fetchProducts = async () => {
    const res = await fetch('/api/products', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setProducts(data);
  };

  const fetchCustomers = async () => {
    const res = await fetch('/api/customers', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setCustomers(data);
  };

  const handleSaveNewCustomer = async () => {
    if (!newCustomer.name) return alert('Nome é obrigatório');
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newCustomer)
      });
      if (res.ok) {
        const savedCustomer = await res.json();
        await fetchCustomers();
        setSelectedCustomer(savedCustomer.id);
        setShowAddCustomer(false);
        setNewCustomer({ name: '', nif: '', phone: '', address: '' });
      }
    } catch (error) {
      console.error('Error saving customer:', error);
    }
  };

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (id: number) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const updateQuantity = (id: number, qty: number) => {
    if (qty <= 0) return removeFromCart(id);
    setCart(cart.map(item => item.id === id ? { ...item, quantity: qty } : item));
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.sale_price * item.quantity), 0);
  const discountAmount = subtotal * (discountPercentage / 100);
  const discountedSubtotal = subtotal - discountAmount;
  const taxRate = companyProfile?.tax_percentage || 14;
  const tax = discountedSubtotal * (taxRate / 100);
  const total = discountedSubtotal + tax;
  const amountPaidNum = parseFloat(amountPaid) || 0;
  const change = amountPaidNum > total ? amountPaidNum - total : 0;

  const handleCheckout = async () => {
    if (paymentMethod === 'cash' && amountPaidNum < total) return alert('Valor insuficiente');
    if (paymentMethod === 'credit' && !selectedCustomer) return alert('Seleccione um cliente para venda a crédito');

    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          items: cart,
          customer_id: selectedCustomer,
          subtotal,
          tax,
          total,
          discount: discountPercentage,
          is_pro_forma: isProForma,
          amount_paid: isProForma ? 0 : (paymentMethod === 'credit' ? 0 : amountPaidNum),
          change: isProForma ? 0 : (paymentMethod === 'credit' ? 0 : change),
          payment_method: isProForma ? 'credit' : paymentMethod
        })
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Sale error details:', errorText);
        let errorMessage = 'Erro ao processar venda';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) { }

        if (res.status === 401) {
          alert('A sua sessão expirou. Por favor, faça login novamente.');
          window.location.reload();
          return;
        }

        throw new Error(errorMessage);
      }

      const data = await res.json();
      const currentCustomer = customers.find(c => c.id === selectedCustomer);
      const saleRecord = {
        ...data,
        items: cart,
        subtotal,
        tax,
        total,
        discount: discountPercentage,
        is_pro_forma: isProForma,
        amountPaid: isProForma ? 0 : (paymentMethod === 'credit' ? 0 : amountPaidNum),
        change: isProForma ? 0 : (paymentMethod === 'credit' ? 0 : change),
        payment_method: isProForma ? 'credit' : paymentMethod,
        date: new Date().toLocaleString(),
        customer_name: currentCustomer?.name || 'Consumidor Final',
        customer_nif: currentCustomer?.nif || 'Consumidor Final'
      };

      setLastSale(saleRecord);
      setCart([]);
      setAmountPaid('0');
      setSelectedCustomer(null);
      setPaymentMethod('cash');
      setShowPayment(false);
      fetchProducts(); // Refresh stock in UI

      // Automatic print if enabled
      if (autoPrint) {
        setTimeout(() => {
          handlePrint();
        }, 500);
      }
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.barcode.includes(search)
  );

  return (
    <div className="flex flex-col md:flex-row h-full bg-transparent overflow-hidden relative font-sans">
      {/* Mobile View Toggle */}
      <div className="md:hidden flex glass-panel border-b border-white/5 p-3 z-20">
        <button
          onClick={() => setView('products')}
          className={`flex-1 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border ${view === 'products' ? 'bg-gold-primary text-bg-deep border-gold-primary shadow-[0_0_20px_rgba(212,175,55,0.3)]' : 'text-white/40 border-transparent'}`}
        >
          Sectores
        </button>
        <button
          onClick={() => setView('cart')}
          className={`flex-1 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all relative border ${view === 'cart' ? 'bg-gold-primary text-bg-deep border-gold-primary shadow-[0_0_20px_rgba(212,175,55,0.3)]' : 'text-white/40 border-transparent'}`}
        >
          Carrinho
          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center border-2 border-bg-deep shadow-lg">
              {cart.length}
            </span>
          )}
        </button>
      </div>

      {/* Products Section */}
      <div className={`${view === 'products' ? 'flex' : 'hidden'} md:flex flex-1 flex-col p-8 overflow-hidden relative`}>
        {/* Header with Register Status */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10 px-2 relative z-10">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tighter italic uppercase">
              Terminal de <span className="text-gold-gradient">Vendas</span>
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <div className={`w-2 h-2 rounded-full ${cashRegister ? 'bg-gold-primary shadow-[0_0_10px_#D4AF37]' : 'bg-red-500 shadow-[0_0_10px_#EF4444] animate-pulse'}`} />
              <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">
                Sistema {cashRegister ? 'Online' : 'Restrito'}
                {cashRegister && <span className="text-gold-primary/30 ml-3">Sessão activa desde {new Date(cashRegister.opened_at).toLocaleTimeString()}</span>}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative w-full lg:w-96">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gold-primary/40" size={18} />
              <input
                type="text"
                placeholder="PROCURAR PRODUTO (F1)..."
                className="w-full pl-14 pr-6 py-4 bg-white/5 border border-white/5 rounded-2xl focus:ring-4 focus:ring-gold-primary/10 focus:border-gold-primary/30 text-white text-xs font-black placeholder:text-white/10 outline-none transition-all uppercase tracking-widest"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>

            {cashRegister && (
              <button
                onClick={handleCloseRegister}
                className="text-[10px] font-black uppercase tracking-[0.2em] text-red-400/60 hover:text-red-400 hover:bg-red-500/10 px-6 py-4 rounded-2xl border border-white/5 transition-all whitespace-nowrap"
              >
                Fechar Caixa
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pb-10 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={product.stock <= 0}
                className={`glass-panel p-5 rounded-3xl border border-white/5 hover:border-gold-primary/40 transition-all text-left group relative gold-glow overflow-hidden ${product.stock <= 0 ? 'opacity-40 grayscale pointer-events-none' : ''}`}
              >
                {product.stock <= 0 && (
                  <div className="absolute inset-0 flex items-center justify-center z-20 bg-bg-deep/40 backdrop-blur-[2px]">
                    <span className="bg-red-500 text-bg-deep text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full shadow-2xl rotate-[-12deg]">Esgotado</span>
                  </div>
                )}

                <div className="aspect-square bg-gradient-to-br from-white/[0.03] to-white/[0.01] rounded-2xl mb-4 flex items-center justify-center text-white/5 group-hover:text-gold-primary/20 transition-all border border-white/5 relative overflow-hidden">
                  <Package size={40} className="relative z-10" />
                  <div className="absolute inset-0 bg-gold-primary opacity-0 group-hover:opacity-[0.03] transition-opacity" />
                </div>

                <div className="space-y-1">
                  <h3 className="font-black text-white text-xs line-clamp-2 uppercase tracking-tight group-hover:text-gold-primary transition-colors">{product.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-gold-gradient font-black text-lg tracking-tighter italic">{product.sale_price.toLocaleString()}</span>
                    <span className="text-[10px] font-black text-gold-primary/40 uppercase">{user?.currency}</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                  <div className={`text-[9px] font-black uppercase tracking-widest ${product.stock <= 5 ? 'text-red-400' : 'text-white/20'}`}>
                    Stock: {product.stock}
                  </div>
                  <div className="w-5 h-5 rounded-full bg-gold-primary/10 border border-gold-primary/20 flex items-center justify-center text-gold-primary opacity-0 group-hover:opacity-100 transition-all">
                    <ShoppingCart size={10} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cart Section */}
      <div className={`${view === 'cart' ? 'flex' : 'hidden'} md:flex w-full md:w-[420px] glass-panel border-l border-white/10 flex-col shadow-[0_0_80px_rgba(0,0,0,0.8)] relative z-30`}>
        <div className="p-8 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gold-primary/10 border border-gold-primary/20 flex items-center justify-center text-gold-primary shadow-[0_0_15px_rgba(212,175,55,0.1)]">
              <ShoppingCart size={22} className="animate-pulse" />
            </div>
            <div>
              <h2 className="font-black text-white uppercase tracking-[0.1em] text-lg italic">Carrinho</h2>
              <p className="text-[9px] font-black text-gold-primary/40 uppercase tracking-[0.3em]">Fila de Atendimento Activa</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-gold-primary/[0.03] border-b border-white/5">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 glass-panel p-4 rounded-2xl border border-white/10">
              <User size={18} className="text-gold-primary/40" />
              <div className="flex-1 flex items-center gap-2">
                <select
                  className="w-full text-[10px] font-black uppercase tracking-widest bg-transparent border-none focus:ring-0 text-white/70 appearance-none cursor-pointer"
                  value={selectedCustomer || ''}
                  onChange={(e) => setSelectedCustomer(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="" className="bg-bg-deep text-white">Consumidor Final</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id} className="bg-bg-deep text-white">{c.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => setShowAddCustomer(true)}
                  className="w-8 h-8 rounded-xl bg-gold-primary/10 text-gold-primary flex items-center justify-center hover:bg-gold-primary/20 transition-all border border-gold-primary/20"
                >
                  <UserPlus size={14} />
                </button>
              </div>
            </div>

            {selectedCustomer && customers.find(c => c.id === selectedCustomer)?.balance > 0 && (
              <button
                onClick={() => setShowDebtPayment(true)}
                className="text-[9px] font-black uppercase tracking-[0.2em] bg-red-500/10 text-red-400 p-3 rounded-2xl border border-red-500/20 hover:bg-red-500/20 transition-all flex items-center justify-center gap-3"
              >
                <Wallet size={12} />
                Dívidas Pendentes: {(customers.find(c => c.id === selectedCustomer)?.balance).toLocaleString()} {user?.currency}
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-10">
              <ShoppingCart size={80} className="mb-6 text-gold-primary stroke-[1]" />
              <p className="font-black uppercase tracking-[0.4em] text-xs">Aguardando Itens</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex gap-5 items-center p-5 rounded-[2rem] bg-white/[0.03] border border-white/10 hover:border-gold-primary/30 transition-all group relative overflow-hidden">
                <div className="absolute inset-0 bg-gold-primary opacity-0 group-hover:opacity-[0.02] transition-opacity" />

                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-white/40 group-hover:text-gold-primary transition-all relative z-10 shadow-inner">
                  <Package size={24} />
                </div>

                <div className="flex-1 min-w-0 relative z-10">
                  <h4 className="text-[12px] font-black text-white uppercase tracking-tight line-clamp-1 mb-2 group-hover:text-gold-primary transition-colors">{item.name}</h4>
                  <div className="flex items-center gap-4">
                    <div className="flex bg-white/5 rounded-xl p-1 border border-white/10 shadow-lg">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gold-primary hover:text-bg-deep text-white/40 transition-all font-black text-xs"
                      >-</button>
                      <span className="text-xs font-black text-gold-primary w-10 text-center self-center tabular-nums">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gold-primary hover:text-bg-deep text-white/40 transition-all font-black text-xs"
                      >+</button>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-gold-primary/40 uppercase tracking-widest leading-none mb-1">Preço Unitário</span>
                      <span className="text-[10px] font-black text-white/40 tabular-nums">{item.sale_price.toLocaleString()} {user?.currency}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right relative z-10">
                  <span className="text-[8px] font-black text-gold-primary/40 uppercase tracking-widest block mb-1">Subtotal</span>
                  <p className="text-lg font-black text-white italic tracking-tighter tabular-nums">{(item.sale_price * item.quantity).toLocaleString()}</p>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-white/10 hover:text-red-500 mt-2 p-1.5 hover:bg-red-500/10 rounded-lg transition-all"
                    title="Remover Item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-8 bg-bg-deep/80 backdrop-blur-xl border-t border-white/5 space-y-5">
          <div className="space-y-3 px-2">
            <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-white/30">
              <span>Subtotal Bruto</span>
              <span className="text-white/60">{subtotal.toLocaleString()} {user?.currency}</span>
            </div>
            <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-white/30">
              <span>Impostos ({taxRate}%)</span>
              <span className="text-white/60">{tax.toLocaleString()} {user?.currency}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-gold-primary">
                <span>Desconto Aplicado</span>
                <span className="text-gold-primary">- {discountAmount.toLocaleString()} {user?.currency}</span>
              </div>
            )}
            <div className="flex justify-between pt-4 border-t border-white/5">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gold-primary self-center">Total Líquido</span>
              <div className="text-right">
                <span className="text-4xl font-black text-white tracking-tighter italic leading-none">{total.toLocaleString()}</span>
                <span className="text-[10px] font-black text-gold-primary/40 block mt-1 tracking-widest uppercase">{user?.currency}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="glass-panel p-4 rounded-2xl border border-white/10 focus-within:border-gold-primary/40 transition-all">
              <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] block mb-2">Desconto (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={discountPercentage}
                onChange={(e) => setDiscountPercentage(Number(e.target.value))}
                className="w-full text-lg font-black bg-transparent border-none p-0 focus:ring-0 text-white tracking-tighter"
                placeholder="0"
              />
            </div>
            <div
              onClick={() => setIsProForma(!isProForma)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-center ${isProForma ? 'bg-gold-primary/10 border-gold-primary/40 shadow-[0_0_20px_rgba(212,175,55,0.1)]' : 'glass-panel border-white/10 hover:border-white/20'}`}
            >
              <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] block mb-2">Protocolo</label>
              <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isProForma ? 'text-gold-primary' : 'text-white/40'}`}>
                {isProForma ? 'PRO-FORMA' : 'VENDA DIRECTA'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-2xl border border-white/5">
            <input
              type="checkbox"
              id="autoPrint"
              checked={autoPrint}
              onChange={(e) => setAutoPrint(e.target.checked)}
              className="w-4 h-4 rounded border-white/10 bg-white/5 text-gold-primary focus:ring-gold-primary/50"
            />
            <label htmlFor="autoPrint" className="text-[10px] font-black text-white/40 uppercase tracking-widest cursor-pointer flex items-center gap-3">
              <Printer size={14} className="text-gold-primary/40" /> Impressão Automática
            </label>
          </div>

          <button
            disabled={cart.length === 0}
            onClick={() => setShowPayment(true)}
            className="w-full mt-2 bg-gradient-to-r from-gold-primary to-gold-secondary text-bg-deep py-6 rounded-3xl font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:shadow-[0_0_40px_rgba(212,175,55,0.3)] disabled:opacity-20 disabled:grayscale disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-2xl"
          >
            <CreditCard size={20} />
            PROCESSAR VENDA
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {/* Open Register Modal */}
      {showOpenRegister && (
        <div className="fixed inset-0 bg-bg-deep/80 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
          <div className="glass-panel rounded-[40px] w-full max-w-md overflow-hidden shadow-2xl border border-white/10 relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold-primary to-transparent" />

            <div className="p-10 text-center relative z-10">
              <div className="w-20 h-20 bg-gold-primary/10 text-gold-primary rounded-3xl flex items-center justify-center mx-auto mb-6 border border-gold-primary/20 shadow-[0_0_20px_rgba(212,175,55,0.1)]">
                <Wallet size={40} className="animate-pulse" />
              </div>
              <h3 className="text-3xl font-black text-white tracking-tighter uppercase italic">Abrir <span className="text-gold-gradient">Caixa</span></h3>
              <p className="text-white/40 font-black text-[10px] uppercase tracking-[0.3em] mt-3">Informe o valor inicial do caixa para continuar</p>
            </div>

            <div className="p-10 pt-0 space-y-8 relative z-10">
              <div className="glass-panel p-6 rounded-3xl border border-white/5 focus-within:border-gold-primary/30 transition-all">
                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-4 text-center">Valor de Abertura</label>
                <div className="relative">
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 font-black text-gold-primary/40 uppercase text-xs tracking-widest">{user?.currency}</span>
                  <input
                    autoFocus
                    type="number"
                    className="w-full text-center bg-transparent border-none outline-none font-black text-5xl text-white tracking-tighter italic"
                    value={initialCash}
                    onChange={(e) => setInitialCash(e.target.value)}
                  />
                </div>
              </div>

              <button
                onClick={handleOpenRegister}
                className="w-full py-6 bg-gradient-to-r from-gold-primary to-gold-secondary text-bg-deep rounded-3xl text-[10px] font-black uppercase tracking-[0.4em] hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] transition-all active:scale-95 shadow-2xl"
              >
                Establish Connection
              </button>
            </div>
          </div>
        </div>
      )}

      {showPayment && (
        <div className="fixed inset-0 bg-bg-deep/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="glass-panel rounded-[40px] w-full max-w-md overflow-hidden shadow-2xl border border-white/10 relative">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gold-primary/40 to-transparent" />

            <div className="p-8 bg-gold-primary/5 border-b border-white/5 text-center">
              <h3 className="text-xl font-black text-white italic uppercase tracking-widest">Finalize <span className="text-gold-gradient">Settlement</span></h3>
              <div className="mt-2 flex items-center justify-center gap-2">
                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Required Assets:</span>
                <span className="text-lg font-black text-gold-primary tracking-tighter italic">{total.toLocaleString()} {user?.currency}</span>
              </div>
            </div>

            <div className="p-8 space-y-8">
              <div className="flex p-1.5 bg-white/5 rounded-2xl border border-white/5">
                {[
                  { id: 'cash', label: 'Cash' },
                  { id: 'multicaixa', label: 'Vector' },
                  { id: 'credit', label: 'Credit' }
                ].map(method => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id as any)}
                    className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all border ${paymentMethod === method.id ? 'bg-gold-primary text-bg-deep border-gold-primary shadow-[0_0_15px_rgba(212,175,55,0.2)]' : 'text-white/40 border-transparent hover:text-white/60'}`}
                  >
                    {method.label}
                  </button>
                ))}
              </div>

              {(paymentMethod === 'cash' || paymentMethod === 'multicaixa') ? (
                <div className="space-y-6">
                  <div className="glass-panel p-6 rounded-3xl border border-white/5 focus-within:border-gold-primary/30 transition-all">
                    <label className="block text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-4 text-center">
                      {paymentMethod === 'cash' ? 'Asset Input (Liquid)' : 'Transaction Verification'}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        className="w-full text-center bg-transparent border-none outline-none font-black text-5xl text-white tracking-tighter italic"
                        value={amountPaid}
                        onChange={(e) => setAmountPaid(e.target.value)}
                        autoFocus
                      />
                    </div>
                  </div>

                  {paymentMethod === 'cash' && (
                    <div className="bg-gold-primary/5 p-6 rounded-3xl border border-gold-primary/10 flex justify-between items-center group relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gold-primary/[0.02] rounded-full -mr-8 -mt-8" />
                      <div>
                        <span className="text-[9px] font-black text-gold-primary/40 uppercase tracking-[0.3em] block mb-1">Asset Return</span>
                        <span className="text-3xl font-black text-gold-primary tracking-tighter italic">{change.toLocaleString()} {user?.currency}</span>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-gold-primary/10 border border-gold-primary/20 flex items-center justify-center text-gold-primary">
                        <Wallet size={20} />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-red-500/5 p-6 rounded-3xl border border-red-500/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-12 h-full bg-gradient-to-l from-red-500/[0.03] to-transparent" />
                    <div className="flex items-center gap-4 text-red-400 mb-4">
                      <AlertTriangle size={20} className="animate-pulse" />
                      <span className="font-black uppercase tracking-[0.2em] text-[10px]">Security Protocol: Credit Sale</span>
                    </div>
                    <p className="text-xs text-white/40 font-medium leading-relaxed">
                      This transaction will be logged as an outstanding liability for the following entity:
                      <strong className="block mt-2 text-white font-black text-sm uppercase tracking-tight">
                        {customers.find(c => c.id === selectedCustomer)?.name || 'NO ENTITY SPECIFIED'}
                      </strong>
                    </p>
                    {!selectedCustomer && (
                      <p className="text-[9px] text-red-500 mt-4 font-black uppercase tracking-[0.1em] flex items-center gap-2">
                        <X size={10} /> Critical: Specify Entity to Proceed
                      </p>
                    )}
                  </div>

                  {selectedCustomer && customers.find(c => c.id === selectedCustomer)?.balance >= 5000 && (
                    <div className="bg-orange-500/5 p-6 rounded-3xl border border-orange-500/20">
                      <div className="flex items-center gap-3 text-orange-400 mb-2">
                        <AlertTriangle size={18} />
                        <span className="font-black uppercase tracking-widest text-[9px]">Elevated Credit Risk</span>
                      </div>
                      <p className="text-xs text-white/40 font-medium">
                        Current Outstanding Balance:
                        <span className="block text-xl font-black text-orange-400 mt-2 tracking-tighter italic">
                          {customers.find(c => c.id === selectedCustomer)?.balance.toLocaleString()} {user?.currency}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => setShowPayment(false)}
                  className="flex-1 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white/30 border border-white/5 hover:bg-white/5 hover:text-white/60 transition-all font-medium"
                >
                  Abort
                </button>
                <button
                  onClick={handleCheckout}
                  disabled={paymentMethod === 'credit' && !selectedCustomer}
                  className="flex-1 py-5 bg-gradient-to-r from-gold-primary to-gold-secondary text-bg-deep rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] transition-all disabled:opacity-20 disabled:grayscale"
                >
                  {isProForma ? 'Emit Pro-Forma' : 'Confirm settlement'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddCustomer && (
        <div className="fixed inset-0 bg-bg-deep/80 backdrop-blur-xl flex items-center justify-center z-[110] p-4">
          <div className="glass-panel rounded-[40px] w-full max-w-md overflow-hidden shadow-2xl border border-white/10 relative">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-gold-primary/40 to-transparent" />

            <div className="p-8 border-b border-white/5 bg-gold-primary/[0.02]">
              <h3 className="text-xl font-black text-white italic uppercase tracking-widest text-center">Register <span className="text-gold-gradient">Entity</span></h3>
              <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] text-center mt-2">Initialize new customer profile in core database</p>
            </div>

            <div className="p-10 space-y-6 text-left">
              <div className="grid grid-cols-1 gap-6">
                <div className="glass-panel p-4 rounded-2xl border border-white/5 focus-within:border-gold-primary/30 transition-all">
                  <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-2">Entity Name</label>
                  <input
                    type="text"
                    className="w-full bg-transparent border-none outline-none font-black text-white uppercase tracking-tight"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    placeholder="Enter identification"
                  />
                </div>
                <div className="glass-panel p-4 rounded-2xl border border-white/5 focus-within:border-gold-primary/30 transition-all">
                  <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-2">Contact Link</label>
                  <input
                    type="text"
                    className="w-full bg-transparent border-none outline-none font-black text-white uppercase tracking-tight"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    placeholder="+244 000 000 000"
                  />
                </div>
                <div className="glass-panel p-4 rounded-2xl border border-white/5 focus-within:border-gold-primary/30 transition-all">
                  <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-2">Fiscal Code (NIF)</label>
                  <input
                    type="text"
                    className="w-full bg-transparent border-none outline-none font-black text-white uppercase tracking-tight"
                    value={newCustomer.nif}
                    onChange={(e) => setNewCustomer({ ...newCustomer, nif: e.target.value })}
                    placeholder="Vector identification"
                  />
                </div>
                <div className="glass-panel p-4 rounded-2xl border border-white/5 focus-within:border-gold-primary/30 transition-all">
                  <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-2">Address Vector</label>
                  <input
                    type="text"
                    className="w-full bg-transparent border-none outline-none font-black text-white uppercase tracking-tight"
                    value={newCustomer.address}
                    onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                    placeholder="Location parameters"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setShowAddCustomer(false)}
                  className="flex-1 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white/30 border border-white/5 hover:bg-white/5 transition-all"
                >
                  Terminate
                </button>
                <button
                  onClick={handleSaveNewCustomer}
                  className="flex-1 py-5 bg-gradient-to-r from-gold-primary to-gold-secondary text-bg-deep rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] transition-all"
                >
                  Inject Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'none' }}>
        <div ref={receiptRef} className="receipt-container" style={{
          width: '80mm',
          padding: '2mm 4mm',
          backgroundColor: 'white',
          color: 'black',
          fontFamily: "'Times New Roman', Times, serif",
          fontSize: '12px',
          lineHeight: '1.5'
        }}>
          <div className="text-center" style={{ marginBottom: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {companyProfile?.logo && (
              <img src={companyProfile.logo} alt="Logo" style={{ maxWidth: '40mm', maxHeight: '15mm', marginBottom: '5px', objectFit: 'contain' }} />
            )}
            <h2 style={{
              fontWeight: '900',
              fontSize: '14px',
              textTransform: 'uppercase',
              margin: '0 0 2px 0',
              letterSpacing: '-0.5px'
            }}>{companyProfile?.name || user?.company_name}</h2>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>
              <p style={{ margin: 0 }}>NIF: {companyProfile?.nif || '---'}</p>
              <p style={{ margin: 0 }}>{companyProfile?.address || '---'}</p>
              <p style={{ margin: 0 }}>Tel: {companyProfile?.phone || '---'}</p>
            </div>
          </div>

          <div style={{
            textAlign: 'center',
            borderTop: '1px dashed black',
            borderBottom: '1px dashed black',
            padding: '3px 0',
            marginBottom: '8px',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            {lastSale?.is_pro_forma ? 'FACTURA PRO-FORMA' : 'FACTURA / RECIBO'}
          </div>

          <div style={{ marginBottom: '8px', fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Nº DOC:</span>
              <span style={{ fontWeight: 'bold' }}>{lastSale?.invoice_number}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>DATA:</span>
              <span>{lastSale?.date}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>OPERADOR:</span>
              <span style={{ textTransform: 'uppercase' }}>{user?.name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '0.5px dashed black', paddingTop: '2px', marginTop: '2px' }}>
              <span>CLIENTE:</span>
              <span style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>{lastSale?.customer_name || 'Consumidor Final'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>NIF CLIENTE:</span>
              <span style={{ fontWeight: 'bold' }}>{lastSale?.customer_nif || 'Consumidor Final'}</span>
            </div>
          </div>

          <table style={{ width: '100%', marginBottom: '8px', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px dashed black' }}>
                <th style={{ textAlign: 'left', padding: '1px 0' }}>DESCRIÇÃO</th>
                <th style={{ textAlign: 'right', padding: '1px 0' }}>QTD</th>
                <th style={{ textAlign: 'right', padding: '1px 0' }}>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {lastSale?.items.map((item: any) => (
                <tr key={item.id}>
                  <td style={{ padding: '2px 0', maxWidth: '40mm', wordWrap: 'break-word' }}>{item.name}</td>
                  <td style={{ textAlign: 'right', padding: '2px 0', verticalAlign: 'top' }}>{item.quantity}</td>
                  <td style={{ textAlign: 'right', padding: '2px 0', verticalAlign: 'top' }}>{(item.quantity * item.sale_price).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ borderTop: '1px dashed black', paddingTop: '3px', fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>SUBTOTAL:</span>
              <span>{lastSale?.subtotal.toLocaleString()}</span>
            </div>
            {lastSale?.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>DESC. ({lastSale.discount}%):</span>
                <span>- {(lastSale.subtotal * (lastSale.discount / 100)).toLocaleString()}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>IVA ({taxRate}%):</span>
              <span>{lastSale?.tax.toLocaleString()}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontWeight: '900',
              fontSize: '12px',
              paddingTop: '3px',
              borderTop: '1px dashed black',
              marginTop: '3px'
            }}>
              <span>TOTAL:</span>
              <span>{lastSale?.total.toLocaleString()} {user?.currency}</span>
            </div>
          </div>

          {!lastSale?.is_pro_forma && (
            <div style={{ marginTop: '8px', paddingTop: '3px', fontSize: '12px', borderTop: '0.5px dashed black' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>MÉTODO:</span>
                <span style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>{lastSale?.payment_method}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>ENTREGUE:</span>
                <span>{lastSale?.amountPaid.toLocaleString()} {user?.currency}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                <span>TROCO:</span>
                <span>{lastSale?.change.toLocaleString()} {user?.currency}</span>
              </div>
            </div>
          )}

          <div style={{
            textAlign: 'center',
            marginTop: '10px',
            fontSize: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            lineHeight: '1.2'
          }}>
            <p style={{ margin: 0, fontWeight: 'bold' }}>Obrigado pela preferência!</p>
            <p style={{ margin: 0 }}>{lastSale?.is_pro_forma ? 'ORÇAMENTO VÁLIDO POR 15 DIAS' : 'O VALOR DESTE DOC. NÃO SERVE DE FATURA'}</p>
            <p style={{ margin: '3px 0 0 0', opacity: 0.7 }}>Processado por Venda Plus</p>
          </div>
        </div>
      </div>

      {/* Success Notification with Print Option */}
      {lastSale && (
        <div className="fixed bottom-10 right-10 z-[120]">
          <div className="glass-panel p-6 rounded-[32px] border border-gold-primary/30 shadow-[0_0_50px_rgba(212,175,55,0.1)] flex items-center gap-6 animate-in slide-in-from-right duration-500 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gold-primary opacity-0 group-hover:opacity-[0.02] transition-opacity" />
            <div className="w-16 h-16 bg-gold-primary/10 text-gold-primary rounded-2xl flex items-center justify-center border border-gold-primary/20 shadow-[0_0_15px_rgba(212,175,55,0.1)]">
              <Printer size={32} className="group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <h4 className="text-[10px] font-black text-gold-primary uppercase tracking-[0.4em] mb-1">Transaction Verified</h4>
              <p className="text-white font-black text-sm italic uppercase tracking-tight">Voucher {lastSale.invoice_number}</p>
            </div>
            <div className="flex gap-3 ml-6">
              <button
                onClick={handlePrint}
                className="px-6 py-3 bg-gold-primary text-bg-deep rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all"
              >
                Hardcopy
              </button>
              <button
                onClick={() => setLastSale(null)}
                className="px-6 py-3 bg-white/5 text-white/40 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-white/60 transition-all border border-white/5"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {showDebtPayment && selectedCustomer && (
        <PaymentModal
          customer={customers.find(c => c.id === selectedCustomer)}
          onClose={() => setShowDebtPayment(false)}
          onSuccess={() => {
            setShowDebtPayment(false);
            fetchCustomers();
          }}
        />
      )}
    </div>
  );
}
