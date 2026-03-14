import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface Customer {
  id: number;
  name: string;
  balance: number;
}

interface PaymentModalProps {
  customer: Customer;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaymentModal({ customer, onClose, onSuccess }: PaymentModalProps) {
  const { token, user } = useAuth();
  const [pendingSales, setPendingSales] = useState<any[]>([]);
  const [selectedSaleId, setSelectedSaleId] = useState<number | ''>('');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPendingSales();
  }, []);

  const fetchPendingSales = async () => {
    const res = await fetch(`/api/customers/${customer.id}/pending-sales`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setPendingSales(data);
    if (data.length > 0) {
      setSelectedSaleId(data[0].id);
      setAmount(data[0].total - data[0].amount_paid);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSaleId || amount <= 0) return;

    setLoading(true);
    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        sale_id: selectedSaleId,
        amount,
        payment_method: paymentMethod
      })
    });

    if (res.ok) {
      onSuccess();
    } else {
      const data = await res.json();
      alert(data.error || 'Erro ao processar pagamento');
    }
    setLoading(false);
  };

  const selectedSale = pendingSales.find(s => s.id === selectedSaleId);
  const remaining = selectedSale ? selectedSale.total - selectedSale.amount_paid : 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-6 border-b flex justify-between items-center">
          <h3 className="text-xl font-bold">Registar Pagamento</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
            <div className="p-2 bg-gray-50 rounded-lg font-medium">{customer.name}</div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Venda Pendente</label>
            <select
              required
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              value={selectedSaleId}
              onChange={(e) => {
                const id = Number(e.target.value);
                setSelectedSaleId(id);
                const sale = pendingSales.find(s => s.id === id);
                if (sale) setAmount(sale.total - sale.amount_paid);
              }}
            >
              {pendingSales.map(sale => (
                <option key={sale.id} value={sale.id}>
                  {sale.invoice_number} - {sale.total.toLocaleString()} {user?.currency} (Falta: {(sale.total - sale.amount_paid).toLocaleString()})
                </option>
              ))}
              {pendingSales.length === 0 && <option value="">Nenhuma venda pendente</option>}
            </select>
          </div>

          {selectedSale && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor a Pagar</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  max={remaining}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-xl font-bold"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                />
                <p className="text-xs text-gray-500 mt-1">Máximo permitido: {remaining.toLocaleString()} {user?.currency}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Forma de Pagamento</label>
                <select
                  required
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                >
                  <option value="cash">Dinheiro</option>
                  <option value="card">Cartão</option>
                  <option value="transfer">Transferência</option>
                </select>
              </div>
            </>
          )}

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border rounded-xl font-medium hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !selectedSaleId || amount <= 0}
              className="flex-1 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? 'Processando...' : 'Confirmar Pagamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
