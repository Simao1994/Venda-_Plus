import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Search, ShoppingCart, Trash2, Printer, CreditCard, User, Package, AlertTriangle, Wallet } from 'lucide-react';
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
  const taxRate = companyProfile?.tax_percentage || 14;
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;
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
          amount_paid: paymentMethod === 'credit' ? 0 : amountPaidNum,
          change: paymentMethod === 'credit' ? 0 : change,
          payment_method: paymentMethod
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
      const saleRecord = {
        ...data,
        items: cart,
        subtotal,
        tax,
        total,
        amountPaid: paymentMethod === 'credit' ? 0 : amountPaidNum,
        change: paymentMethod === 'credit' ? 0 : change,
        payment_method: paymentMethod,
        date: new Date().toLocaleString()
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
    <div className="flex flex-col md:flex-row h-full bg-gray-100 overflow-hidden relative">
      {/* Mobile View Toggle */}
      <div className="md:hidden flex bg-white border-b p-2">
        <button
          onClick={() => setView('products')}
          className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${view === 'products' ? 'bg-emerald-600 text-white' : 'text-gray-500'}`}
        >
          Produtos
        </button>
        <button
          onClick={() => setView('cart')}
          className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all relative ${view === 'cart' ? 'bg-emerald-600 text-white' : 'text-gray-500'}`}
        >
          Carrinho
          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center border-2 border-white">
              {cart.length}
            </span>
          )}
        </button>
      </div>

      {/* Products Section */}
      <div className={`${view === 'products' ? 'flex' : 'hidden'} md:flex flex-1 flex-col p-4 overflow-hidden`}>
        {/* Header with Register Status */}
        <div className="flex justify-between items-center mb-4 px-2">
          <h1 className="text-2xl font-black text-emerald-600 tracking-tight">Venda Plus</h1>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${cashRegister ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-sm font-bold text-gray-700">
              Caixa {cashRegister ? 'Aberto' : 'Fechado'}
              {cashRegister && <span className="text-gray-400 font-normal ml-2">desde {new Date(cashRegister.opened_at).toLocaleTimeString()}</span>}
            </span>
          </div>
          {cashRegister && (
            <button
              onClick={handleCloseRegister}
              className="text-xs font-black uppercase tracking-widest text-red-500 hover:bg-red-50 px-3 py-1 rounded-lg transition-colors"
            >
              Fechar Caixa
            </button>
          )}
        </div>

        <div className="flex items-center justify-between mb-6 px-2">
          <h2 className="text-xl font-black text-gray-900 uppercase tracking-widest">Produtos</h2>
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Pesquisar produto (F1)..."
              className="w-full pl-12 pr-4 py-3 rounded-2xl border-none shadow-sm focus:ring-4 focus:ring-emerald-500/20 text-sm font-bold"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 overflow-y-auto pb-4">
          {filteredProducts.map(product => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              disabled={product.stock <= 0}
              className={`bg-white p-4 rounded-2xl shadow-sm hover:shadow-lg transition-all text-left group relative ${product.stock <= 0 ? 'opacity-60 cursor-not-allowed grayscale' : 'hover:border-emerald-500 border border-transparent'}`}
            >
              {product.stock <= 0 && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <span className="bg-red-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg rotate-[-10deg]">Esgotado</span>
                </div>
              )}
              <div className="aspect-square bg-gray-50 rounded-xl mb-3 flex items-center justify-center text-gray-300 group-hover:text-emerald-500 transition-colors">
                <Package size={32} />
              </div>
              <h3 className="font-bold text-gray-900 text-sm line-clamp-2 mb-1">{product.name}</h3>
              <p className="text-emerald-600 font-black text-lg">{product.sale_price.toLocaleString()} {user?.currency}</p>
              <p className={`text-[10px] font-bold uppercase tracking-widest mt-2 ${product.stock <= 0 ? 'text-red-500' : 'text-gray-400'}`}>
                Stock: {product.stock}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Cart Section */}
      <div className={`${view === 'cart' ? 'flex' : 'hidden'} md:flex w-full md:w-96 bg-white border-l flex-col shadow-xl`}>
        <div className="p-4 border-bottom bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="text-emerald-600" />
            <h2 className="font-bold text-lg">Carrinho</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2">
                <User size={16} className="text-gray-400" />
                <select
                  className="text-xs border-none bg-transparent focus:ring-0 font-medium text-gray-600"
                  value={selectedCustomer || ''}
                  onChange={(e) => setSelectedCustomer(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">Consumidor Final</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              {selectedCustomer && customers.find(c => c.id === selectedCustomer)?.balance > 0 && (
                <button
                  onClick={() => setShowDebtPayment(true)}
                  className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded flex items-center gap-1 hover:bg-amber-200 transition-colors font-bold"
                >
                  <Wallet size={10} />
                  Pagar Dívida ({(customers.find(c => c.id === selectedCustomer)?.balance).toLocaleString()} {user?.currency})
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
              <ShoppingCart size={64} className="mb-4" />
              <p>Carrinho vazio</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex gap-3 items-start border-b pb-3">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900">{item.name}</h4>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-6 h-6 flex items-center justify-center rounded border hover:bg-gray-100"
                    >-</button>
                    <span className="text-sm font-mono w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-6 h-6 flex items-center justify-center rounded border hover:bg-gray-100"
                    >+</button>
                    <span className="text-xs text-gray-400 ml-2">x {item.sale_price}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{(item.sale_price * item.quantity).toLocaleString()}</p>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-500 hover:text-red-700 mt-2"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-gray-50 border-t space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span>{subtotal.toLocaleString()} {user?.currency}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>IVA ({taxRate}%)</span>
            <span>{tax.toLocaleString()} {user?.currency}</span>
          </div>
          <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t">
            <span>TOTAL</span>
            <span>{total.toLocaleString()} {user?.currency}</span>
          </div>

          <div className="flex items-center gap-2 mb-2 p-2 bg-white rounded-lg border border-gray-100">
            <input
              type="checkbox"
              id="autoPrint"
              checked={autoPrint}
              onChange={(e) => setAutoPrint(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
            />
            <label htmlFor="autoPrint" className="text-xs font-bold text-gray-600 cursor-pointer flex items-center gap-1">
              <Printer size={12} /> Impressão Automática
            </label>
          </div>

          <button
            disabled={cart.length === 0}
            onClick={() => setShowPayment(true)}
            className="w-full mt-2 bg-emerald-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-200"
          >
            <CreditCard size={20} />
            PAGAR (F12)
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {/* Open Register Modal */}
      {showOpenRegister && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[40px] w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-10 text-center bg-gray-50/50">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Wallet size={40} />
              </div>
              <h3 className="text-3xl font-black text-gray-900 tracking-tight">Abrir Caixa</h3>
              <p className="text-gray-500 font-medium mt-2">Informe o valor inicial em dinheiro para começar as vendas.</p>
            </div>

            <div className="p-10 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Fundo de Maneio (Valor Inicial)</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-gray-400">{user?.currency}</span>
                  <input
                    autoFocus
                    type="number"
                    className="w-full pl-16 pr-6 py-6 bg-gray-50 border-none rounded-3xl focus:ring-4 focus:ring-emerald-500/10 outline-none font-black text-3xl text-gray-900"
                    value={initialCash}
                    onChange={(e) => setInitialCash(e.target.value)}
                  />
                </div>
              </div>

              <button
                onClick={handleOpenRegister}
                className="w-full py-6 bg-emerald-600 text-white rounded-3xl text-sm font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 active:scale-95"
              >
                Confirmar Abertura
              </button>
            </div>
          </div>
        </div>
      )}

      {showPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 bg-emerald-600 text-white">
              <h3 className="text-xl font-bold">Finalizar Venda</h3>
              <p className="opacity-80">Total a pagar: {total.toLocaleString()} {user?.currency}</p>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex p-1 bg-gray-100 rounded-xl">
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${paymentMethod === 'cash' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500'}`}
                >
                  Dinheiro
                </button>
                <button
                  onClick={() => setPaymentMethod('multicaixa')}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${paymentMethod === 'multicaixa' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500'}`}
                >
                  Multicaixa
                </button>
                <button
                  onClick={() => setPaymentMethod('credit')}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${paymentMethod === 'credit' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500'}`}
                >
                  Venda a Crédito
                </button>
              </div>

              {(paymentMethod === 'cash' || paymentMethod === 'multicaixa') ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {paymentMethod === 'cash' ? 'Valor Entregue' : 'Valor Confirmado'}
                    </label>
                    <input
                      type="number"
                      className="w-full text-3xl font-mono p-4 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-0"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      autoFocus
                    />
                  </div>

                  {paymentMethod === 'cash' && (
                    <div className="bg-gray-50 p-4 rounded-xl flex justify-between items-center">
                      <span className="text-gray-600 font-medium">Troco</span>
                      <span className="text-3xl font-bold text-emerald-600">{change.toLocaleString()} {user?.currency}</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                    <div className="flex items-center gap-3 text-amber-800 mb-2">
                      <AlertTriangle size={20} />
                      <span className="font-bold">Atenção</span>
                    </div>
                    <p className="text-sm text-amber-700">
                      Esta venda será registada como dívida para o cliente:
                      <strong className="block mt-1 text-amber-900">
                        {customers.find(c => c.id === selectedCustomer)?.name || 'Nenhum cliente seleccionado'}
                      </strong>
                    </p>
                    {!selectedCustomer && (
                      <p className="text-xs text-red-600 mt-2 font-bold uppercase">
                        * É obrigatório seleccionar um cliente para vendas a crédito.
                      </p>
                    )}
                  </div>

                  {selectedCustomer && customers.find(c => c.id === selectedCustomer)?.balance >= 5000 && (
                    <div className="bg-red-50 p-4 rounded-xl border border-red-100 animate-pulse">
                      <div className="flex items-center gap-3 text-red-800 mb-2">
                        <AlertTriangle size={20} />
                        <span className="font-black uppercase tracking-widest text-xs">Alerta de Dívida Elevada</span>
                      </div>
                      <p className="text-sm text-red-700 font-bold">
                        Este cliente já possui um saldo devedor de:
                        <span className="block text-xl font-black text-red-900 mt-1">
                          {customers.find(c => c.id === selectedCustomer)?.balance.toLocaleString()} {user?.currency}
                        </span>
                      </p>
                      <p className="text-[10px] text-red-600 mt-2 uppercase font-black">
                        Recomenda-se a liquidação parcial antes de nova venda a crédito.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowPayment(false)}
                  className="flex-1 py-3 border rounded-xl font-medium hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCheckout}
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700"
                >
                  Confirmar Venda
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Template (Hidden) */}
      <div style={{ display: 'none' }}>
        <div ref={receiptRef} className="p-8 font-mono text-sm w-[80mm] text-gray-900">
          <div className="text-center mb-6">
            <h2 className="font-black text-xl uppercase tracking-tighter mb-1">{companyProfile?.name || user?.company_name}</h2>
            <p className="text-xs">NIF: {companyProfile?.nif || '---'}</p>
            <p className="text-xs">{companyProfile?.address || '---'}</p>
            <p className="text-xs">Tel: {companyProfile?.phone || '---'}</p>
          </div>

          <div className="border-t border-b border-dashed py-3 mb-4 space-y-1 text-xs">
            <div className="flex justify-between">
              <span>FATURA:</span>
              <span className="font-bold">{lastSale?.invoice_number}</span>
            </div>
            <div className="flex justify-between">
              <span>DATA:</span>
              <span>{lastSale?.date}</span>
            </div>
            <div className="flex justify-between">
              <span>OPERADOR:</span>
              <span className="uppercase text-right">{user?.name}</span>
            </div>
            {lastSale?.customer_name && (
              <div className="flex justify-between border-t border-dashed pt-1 mt-1">
                <span>CLIENTE:</span>
                <span className="font-bold">{lastSale.customer_name}</span>
              </div>
            )}
          </div>

          <table className="w-full mb-6 text-xs">
            <thead>
              <tr className="border-b border-dashed">
                <th className="text-left py-1">DESCRIÇÃO</th>
                <th className="text-right py-1">QTD</th>
                <th className="text-right py-1">TOTAL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dashed">
              {lastSale?.items.map((item: any) => (
                <tr key={item.id}>
                  <td className="py-2">{item.name}</td>
                  <td className="text-right py-2">{item.quantity}</td>
                  <td className="text-right py-2">{(item.quantity * item.sale_price).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-t border-dashed pt-3 space-y-1 text-xs">
            <div className="flex justify-between">
              <span>SUBTOTAL:</span>
              <span>{lastSale?.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>IVA ({taxRate}%):</span>
              <span>{lastSale?.tax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-black text-lg pt-2 border-t border-dashed mt-2">
              <span>TOTAL:</span>
              <span>{lastSale?.total.toLocaleString()} {user?.currency}</span>
            </div>
          </div>

          <div className="mt-6 border-t border-dashed pt-3 text-xs space-y-1">
            <div className="flex justify-between">
              <span>MÉTODO:</span>
              <span className="font-bold uppercase">{lastSale?.payment_method}</span>
            </div>
            <div className="flex justify-between">
              <span>ENTREGUE:</span>
              <span>{lastSale?.amountPaid.toLocaleString()} {user?.currency}</span>
            </div>
            <div className="flex justify-between font-bold text-sm">
              <span>TROCO:</span>
              <span>{lastSale?.change.toLocaleString()} {user?.currency}</span>
            </div>
          </div>

          <div className="text-center mt-10 text-[10px] uppercase tracking-widest leading-relaxed">
            <p className="font-bold">Obrigado pela preferência!</p>
            <p>Este documento não serve de fatura</p>
            <p className="mt-2">Processado por Venda Plus</p>
          </div>
        </div>
      </div>

      {/* Success Notification with Print Option */}
      {lastSale && (
        <div className="fixed bottom-4 right-4 bg-white p-4 rounded-2xl shadow-2xl border border-emerald-100 animate-in slide-in-from-right">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
              <Printer size={24} />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Venda Realizada!</h4>
              <p className="text-sm text-gray-500">Fatura {lastSale.invoice_number}</p>
            </div>
            <div className="flex gap-2 ml-4">
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700"
              >
                Imprimir
              </button>
              <button
                onClick={() => setLastSale(null)}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-bold hover:bg-gray-200"
              >
                Fechar
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
