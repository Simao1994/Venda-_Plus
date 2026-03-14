import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Search, ShoppingCart, Trash2, Plus, Minus, FileText, Pill, Printer, CreditCard, Wallet, AlertTriangle } from 'lucide-react';
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
  const [amountPaid, setAmountPaid] = useState(0);
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
    fetchMedicamentos();
  }, []);

  const fetchMedicamentos = async () => {
    try {
      const res = await fetch('/api/farmacia/medicamentos', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setMedicamentos(data);
    } finally {
      setLoading(false);
    }
  };

  const filteredMedicamentos = medicamentos.filter(m => 
    m.nome_medicamento.toLowerCase().includes(search.toLowerCase()) || 
    (m.codigo_barras && m.codigo_barras.includes(search))
  );

  const addToCart = (med: any) => {
    if (med.stock_total <= 0) return;
    
    const existing = cart.find(item => item.id === med.id);
    if (existing) {
      if (existing.quantity >= med.stock_total) return;
      setCart(cart.map(item => 
        item.id === med.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...med, quantity: 1 }]);
    }
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQ = item.quantity + delta;
        if (newQ > 0 && newQ <= item.stock_total) {
          return { ...item, quantity: newQ };
        }
        return item;
      }
      return item;
    }));
  };

  const removeFromCart = (id: number) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.preco_venda * item.quantity), 0);
  const tax = subtotal * 0.14; // 14% IVA
  const total = subtotal + tax;
  const change = Math.max(0, amountPaid - total);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if ((paymentMethod === 'cash' || paymentMethod === 'multicaixa') && amountPaid < total) {
      alert('Valor insuficiente');
      return;
    }
    
    try {
      const payload = {
        itens: cart.map(item => ({
          medicamento_id: item.id,
          quantidade: item.quantity,
          preco_unitario: item.preco_venda
        })),
        forma_pagamento: paymentMethod,
        valor_entregue: amountPaid
      };

      const res = await fetch('/api/farmacia/vendas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erro ao finalizar venda');
      }

      const data = await res.json();
      setLastSale({ 
        ...data, 
        items: cart, 
        subtotal, 
        tax, 
        total, 
        amountPaid, 
        change, 
        date: new Date().toLocaleString() 
      });
      setCart([]);
      setShowPayment(false);
      setAmountPaid(0);
      fetchMedicamentos(); // Refresh stock
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className="flex h-[calc(100vh-130px)] bg-gray-50">
      {/* Products Section */}
      <div className="flex-1 flex flex-col overflow-hidden border-r">
        <div className="p-4 bg-white border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Pesquisar por nome ou código de barras..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredMedicamentos.map(med => (
              <div 
                key={med.id}
                onClick={() => addToCart(med)}
                className={`bg-white p-4 rounded-2xl border transition-all cursor-pointer ${
                  med.stock_total > 0 
                    ? 'hover:border-emerald-500 hover:shadow-md border-gray-200' 
                    : 'opacity-50 border-gray-200 cursor-not-allowed'
                }`}
              >
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 mb-3">
                  <Pill size={24} />
                </div>
                <h3 className="font-bold text-gray-900 line-clamp-2 min-h-[40px]">{med.nome_medicamento}</h3>
                <p className="text-xs text-gray-500 mb-2">{med.dosagem} • {med.forma_farmaceutica}</p>
                
                <div className="flex justify-between items-end mt-4">
                  <div>
                    <div className="text-xs text-gray-500">Preço</div>
                    <div className="font-black text-emerald-600">{med.preco_venda.toLocaleString()} {user?.currency}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Stock</div>
                    <div className={`font-bold ${med.stock_total <= med.estoque_minimo ? 'text-red-600' : 'text-gray-900'}`}>
                      {med.stock_total}
                    </div>
                  </div>
                </div>
                {med.necessita_receita && (
                  <div className="mt-3 text-[10px] font-bold uppercase text-red-600 bg-red-50 px-2 py-1 rounded-md text-center">
                    Receita Obrigatória
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cart Section */}
      <div className="w-96 bg-white flex flex-col shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] z-10">
        <div className="p-4 border-b bg-gray-50 flex items-center gap-3">
          <ShoppingCart className="text-emerald-600" />
          <h2 className="font-bold text-gray-900 text-lg">Carrinho Farmácia</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
              <ShoppingCart size={48} className="opacity-20" />
              <p>O carrinho está vazio</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map(item => (
                <div key={item.id} className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-bold text-gray-900 text-sm">{item.nome_medicamento}</div>
                    <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:bg-red-50 p-1 rounded-lg">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="font-bold text-emerald-600">
                        {item.preco_venda.toLocaleString()} {user?.currency}
                      </span>
                      {item.quantity > 1 && (
                        <span className="text-xs text-gray-500">
                          Total: {(item.preco_venda * item.quantity).toLocaleString()} {user?.currency}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 bg-white border rounded-lg p-1">
                      <button 
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded-md"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="font-bold text-sm w-4 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded-md"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50 space-y-3">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span className="font-medium">{subtotal.toLocaleString()} {user?.currency}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>IVA (14%)</span>
            <span className="font-medium">{tax.toLocaleString()} {user?.currency}</span>
          </div>
          <div className="flex justify-between text-xl font-black text-gray-900 pt-2 border-t">
            <span>Total</span>
            <span className="text-emerald-600">{total.toLocaleString()} {user?.currency}</span>
          </div>

          <button
            onClick={() => setShowPayment(true)}
            disabled={cart.length === 0}
            className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-200 mt-4 flex items-center justify-center gap-2"
          >
            <CreditCard size={20} />
            PAGAR
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 bg-emerald-600 text-white">
              <h3 className="text-xl font-bold">Finalizar Venda Farmácia</h3>
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
                  Crédito
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
                      onChange={(e) => setAmountPaid(Number(e.target.value))}
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
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                  <div className="flex items-center gap-3 text-amber-800 mb-2">
                    <AlertTriangle size={20} />
                    <span className="font-bold">Venda a Crédito</span>
                  </div>
                  <p className="text-sm text-amber-700">
                    Esta venda será registada como dívida. Certifique-se de ter o paciente selecionado (se aplicável).
                  </p>
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
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Template (Hidden) */}
      <div style={{ display: 'none' }}>
        <div ref={receiptRef} className="p-8 font-mono text-sm w-[80mm]">
          <div className="text-center mb-4">
            <h2 className="font-bold text-lg uppercase">{user?.company_name}</h2>
            <p>FARMÁCIA</p>
            <p>NIF: 500123456</p>
            <p>Tel: 923 000 000</p>
            <p>Luanda, Angola</p>
          </div>
          <div className="border-t border-b py-2 mb-4">
            <p>FATURA: {lastSale?.numero_factura}</p>
            <p>DATA: {lastSale?.date}</p>
            <p>OPERADOR: {user?.name}</p>
            <p>MÉTODO: {lastSale?.forma_pagamento?.toUpperCase()}</p>
          </div>
          <table className="w-full mb-4">
            <thead>
              <tr className="border-b">
                <th className="text-left">Item</th>
                <th className="text-right">Qtd</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {lastSale?.items.map((item: any) => (
                <tr key={item.id}>
                  <td>{item.nome_medicamento}</td>
                  <td className="text-right">{item.quantity}</td>
                  <td className="text-right">{(item.quantity * item.preco_venda).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t pt-2 space-y-1">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{lastSale?.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>IVA (14%):</span>
              <span>{lastSale?.tax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>TOTAL:</span>
              <span>{lastSale?.total.toLocaleString()} {user?.currency}</span>
            </div>
          </div>
          <div className="mt-4 border-t pt-2">
            <div className="flex justify-between">
              <span>Entregue:</span>
              <span>{lastSale?.amountPaid.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Troco:</span>
              <span>{lastSale?.change.toLocaleString()}</span>
            </div>
          </div>
          <div className="text-center mt-8 italic">
            <p>Obrigado pela preferência!</p>
            <p>Volte sempre.</p>
          </div>
        </div>
      </div>

      {/* Success Notification with Print Option */}
      {lastSale && (
        <div className="fixed bottom-4 right-4 bg-white p-4 rounded-2xl shadow-2xl border border-emerald-100 animate-in slide-in-from-right z-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
              <Printer size={24} />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Venda Realizada!</h4>
              <p className="text-sm text-gray-500">Fatura {lastSale.numero_factura}</p>
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
    </div>
  );
}
