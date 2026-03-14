import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Plus, Search, Phone, Mail, MapPin, CreditCard, Package, AlertTriangle } from 'lucide-react';
import PaymentModal from './PaymentModal';

interface Customer {
  id: number;
  name: string;
  nif: string;
  email: string;
  phone: string;
  address: string;
  balance: number;
}

export default function Customers() {
  const { token, user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedCustomerForPayment, setSelectedCustomerForPayment] = useState<Customer | null>(null);
  const [selectedCustomerForHistory, setSelectedCustomerForHistory] = useState<Customer | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');
  const [formData, setFormData] = useState({
    name: '',
    nif: '',
    email: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    const res = await fetch('/api/customers', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setCustomers(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      setShowModal(false);
      setFormData({ name: '', nif: '', email: '', phone: '', address: '' });
      fetchCustomers();
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.nif?.includes(search) ||
    c.phone?.includes(search)
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-500 text-sm">Gerencie os seus clientes e saldos devedores</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-emerald-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100"
        >
          <Plus size={20} />
          Novo Cliente
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Pesquisar por nome, NIF ou telefone..."
          className="w-full pl-10 pr-4 py-3 rounded-xl border-none shadow-sm focus:ring-2 focus:ring-emerald-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map(customer => (
          <div key={customer.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                <User size={24} />
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Saldo Devedor</p>
                <p className={`text-xl font-bold ${customer.balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {customer.balance.toLocaleString()} {user?.currency}
                </p>
              </div>
            </div>
            
            <h3 className="text-lg font-bold text-gray-900 mb-4">{customer.name}</h3>
            
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CreditCard size={16} className="text-gray-400" />
                <span>NIF: {customer.nif || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-gray-400" />
                <span>{customer.phone || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-gray-400" />
                <span>{customer.email || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-gray-400" />
                <span className="line-clamp-1">{customer.address || 'N/A'}</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t flex flex-col gap-2">
              <div className="flex gap-2">
                <button className="flex-1 bg-gray-50 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors">
                  Editar
                </button>
                <button 
                  onClick={() => setSelectedCustomerForHistory(customer)}
                  className="flex-1 bg-emerald-50 text-emerald-700 py-2 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors"
                >
                  Ver Histórico
                </button>
              </div>
              {customer.balance > 0 && (
                <button 
                  onClick={() => setSelectedCustomerForPayment(customer)}
                  className="w-full bg-emerald-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                >
                  <CreditCard size={16} />
                  Registar Pagamento
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedCustomerForPayment && (
        <PaymentModal 
          customer={selectedCustomerForPayment} 
          onClose={() => setSelectedCustomerForPayment(null)}
          onSuccess={() => {
            setSelectedCustomerForPayment(null);
            fetchCustomers();
          }}
        />
      )}

      {selectedCustomerForHistory && (
        <CustomerDetailsModal 
          customer={selectedCustomerForHistory} 
          onClose={() => setSelectedCustomerForHistory(null)}
        />
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold">Novo Cliente</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
                <input
                  required
                  type="text"
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">NIF</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={formData.nif}
                    onChange={(e) => setFormData({ ...formData, nif: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                <textarea
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  rows={3}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 border rounded-xl font-medium hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700"
                >
                  Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function CustomerDetailsModal({ customer, onClose }: { customer: Customer, onClose: () => void }) {
  const { token, user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    const res = await fetch(`/api/customers/${customer.id}/history`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setHistory(data);
    setLoading(false);
  };

  const pendingSales = history.filter(item => item.type === 'sale' && item.status === 'pending');
  const displayHistory = activeTab === 'all' ? history : pendingSales;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-gray-100">
        {/* Header */}
        <div className="p-8 border-b flex justify-between items-start bg-gradient-to-r from-gray-50 to-white">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center">
                <User size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">{customer.name}</h3>
                <p className="text-sm text-gray-500 font-medium">NIF: {customer.nif || 'Não atribuído'}</p>
              </div>
            </div>
            <div className="flex gap-4 mt-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-widest">
                <Phone size={14} />
                {customer.phone || '---'}
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-widest">
                <Mail size={14} />
                {customer.email || '---'}
              </div>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
          >
            <Plus size={24} className="rotate-45" />
          </button>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-2 gap-4 p-8 bg-gray-50/50">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Saldo Total Devedor</p>
            <p className={`text-3xl font-black ${customer.balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {customer.balance.toLocaleString()} <span className="text-sm font-bold opacity-50">{user?.currency}</span>
            </p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Vendas Pendentes</p>
            <p className="text-3xl font-black text-gray-900">
              {pendingSales.length} <span className="text-sm font-bold opacity-30">FATURAS</span>
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-8 border-b flex gap-8 bg-white justify-between items-center">
          <div className="flex gap-8">
            <button 
              onClick={() => setActiveTab('pending')}
              className={`py-4 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'pending' ? 'text-red-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Vendas Pendentes
              {activeTab === 'pending' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-600 rounded-t-full" />}
            </button>
            <button 
              onClick={() => setActiveTab('all')}
              className={`py-4 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'all' ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Histórico Completo
              {activeTab === 'all' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-600 rounded-t-full" />}
            </button>
          </div>
          <input
            type="text"
            placeholder="Pesquisar fatura..."
            className="text-xs border-none bg-gray-50 rounded-lg px-3 py-1 focus:ring-0"
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 space-y-4 bg-white">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Sincronizando dados...</p>
            </div>
          ) : displayHistory.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search size={32} className="text-gray-200" />
              </div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Nenhum registo encontrado</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {displayHistory.filter(item => item.reference.toLowerCase().includes(search.toLowerCase())).map((item, idx) => (
                <div 
                  key={idx} 
                  className={`group p-5 rounded-2xl border transition-all hover:border-gray-300 ${
                    item.type === 'payment' 
                      ? 'bg-emerald-50/30 border-emerald-100/50' 
                      : 'bg-white border-gray-100 shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        item.type === 'payment' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {item.type === 'payment' ? <CreditCard size={18} /> : <Package size={18} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            item.type === 'payment' ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-white'
                          }`}>
                            {item.type === 'payment' ? 'Pagamento' : 'Venda'}
                          </span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="font-bold text-gray-900 tracking-tight">{item.reference}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-black tracking-tight ${item.type === 'payment' ? 'text-emerald-600' : 'text-gray-900'}`}>
                        {item.type === 'payment' ? '-' : ''}{item.amount.toLocaleString()} <span className="text-xs font-bold opacity-40">{user?.currency}</span>
                      </p>
                      {item.type === 'sale' && (
                        <div className="flex flex-col items-end mt-1">
                          {item.status === 'pending' ? (
                            <>
                              <span className="text-[9px] font-black text-red-600 uppercase tracking-widest bg-red-50 px-2 py-0.5 rounded-full mb-1">Pendente</span>
                              <p className="text-[10px] font-bold text-gray-400 uppercase">
                                Em falta: <span className="text-red-600">{(item.amount - item.amount_paid).toLocaleString()}</span>
                              </p>
                            </>
                          ) : (
                            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full">Liquidada</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-8 border-t bg-gray-50 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className={customer.balance > 0 ? 'text-red-500' : 'text-emerald-500'} />
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              {customer.balance > 0 ? 'Existem pagamentos em atraso' : 'Conta corrente regularizada'}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="px-8 py-3 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl active:scale-95"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

