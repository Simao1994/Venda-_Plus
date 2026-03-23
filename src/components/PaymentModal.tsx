import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useReactToPrint } from 'react-to-print';
import { Printer } from 'lucide-react';

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
  const [amount, setAmount] = useState<string>('0');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [loading, setLoading] = useState(false);
  const [lastPayment, setLastPayment] = useState<any>(null);
  const receiptRef = React.useRef<HTMLDivElement>(null);

  const handlePrintReceipt = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: 'Recibo_Pagamento'
  });

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
      setAmount((data[0].total - data[0].amount_paid).toString());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount) || 0;
    if (!selectedSaleId || amountNum <= 0) return;

    setLoading(true);
    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        sale_id: selectedSaleId,
        amount: amountNum,
        payment_method: paymentMethod
      })
    });

    if (res.ok) {
      const data = await res.json();
      setLastPayment({
        ...data,
        customer_name: customer.name,
        amount: amountNum,
        date: new Date().toLocaleDateString()
      });
      // Small delay to allow state update then print
      setTimeout(() => {
        handlePrintReceipt();
        onSuccess();
      }, 500);
    } else {
      const data = await res.json();
      alert(data.error || 'Erro ao processar pagamento');
    }
    setLoading(false);
  };

  const selectedSale = pendingSales.find(s => s.id === selectedSaleId);
  const remaining = selectedSale ? selectedSale.total - selectedSale.amount_paid : 0;
  const amountNum = parseFloat(amount) || 0;

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
                if (sale) setAmount((sale.total - sale.amount_paid).toString());
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
                  onChange={(e) => setAmount(e.target.value)}
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
              disabled={loading || !selectedSaleId || amountNum <= 0}
              className="flex-1 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? 'Processando...' : 'Confirmar Pagamento'}
            </button>
          </div>
        </form>
      </div>

      {/* Receipt Template (Hidden) */}
      <div style={{ display: 'none' }}>
        <div ref={receiptRef} className="receipt-container" style={{
          width: '80mm',
          padding: '2mm 4mm',
          backgroundColor: 'white',
          color: 'black',
          fontFamily: "'Times New Roman', Times, serif",
          fontSize: '12px'
        }}>
          <div className="text-center" style={{ textAlign: 'center', marginBottom: '8px' }}>
            <h2 style={{ fontWeight: '900', fontSize: '14px', textTransform: 'uppercase', margin: '0' }}>{user?.company_name}</h2>
            <p style={{ margin: '2px 0', fontSize: '10px' }}>NIF: {user?.nif || '---'}</p>
            <p style={{ margin: '2px 0', fontSize: '10px' }}>RECIBO DE PAGAMENTO (RE)</p>
          </div>
          <div style={{ borderTop: '1px dashed black', borderBottom: '1px dashed black', padding: '4px 0', marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>RE Nº:</span>
              <span style={{ fontWeight: 'bold' }}>{lastPayment?.document_number || lastPayment?.id || '---'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>DATA/HORA:</span>
              <span style={{ fontWeight: 'bold' }}>
                {lastPayment?.created_at ?
                  new Date(lastPayment.created_at).toLocaleString('pt-AO', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  }) : lastPayment?.date}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>CLIENTE:</span>
              <span style={{ fontWeight: 'bold' }}>{lastPayment?.customer_name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>NIF CLIENTE:</span>
              <span style={{ fontWeight: 'bold' }}>{lastPayment?.customer_nif || '999999999'}</span>
            </div>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <p style={{ margin: '0 0 5px 0' }}>Recebemos a quantia de:</p>
            <p style={{ fontWeight: 'bold', fontSize: '14px', margin: '0' }}>{lastPayment?.amount?.toLocaleString()} {user?.currency}</p>
            <p style={{ fontSize: '10px', marginTop: '5px' }}>Referente à liquidação da fatura associada à transação.</p>
          </div>
          <div style={{ borderTop: '1px dashed black', paddingTop: '5px', textAlign: 'center', fontSize: '10px' }}>
            <p style={{ margin: '0', fontWeight: 'bold' }}>Emitido por programa validado n.º 0000/AGT/2026</p>
            <p style={{ margin: '2px 0 0 0', opacity: 0.7 }}>Obrigado pela preferência!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
