import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Plus, Search, Phone, Mail, MapPin, CreditCard, Package, AlertTriangle, Printer } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { A4ReportTemplate } from './reports/A4ReportTemplate';
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

  const printRef = React.useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Relatorio-Clientes-${new Date().toLocaleDateString('pt-AO')}`
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
    <div className="p-8 space-y-10 relative">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter italic uppercase">
            Client <span className="text-gold-gradient">Registry</span>
          </h1>
          <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mt-2">Customer relationship & balance synchronization</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={handlePrint}
            className="flex items-center gap-3 px-8 py-4 bg-white/5 text-white/60 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all shadow-xl"
          >
            <Printer size={18} />
            Imprimir Relatório
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-gold-primary to-gold-secondary text-bg-deep rounded-2xl text-[10px] font-black uppercase tracking-widest hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] transition-all shadow-2xl"
          >
            <Plus size={18} />
            Initialize Entity
          </button>
        </div>
      </div>

      {/* Hidden A4 Report */}
      <div style={{ display: 'none' }}>
        <A4ReportTemplate
          ref={printRef}
          title="Relatório de Clientes"
          companyData={user}
          orientation="landscape"
        >
          <table className="a4-table">
            <thead>
              <tr>
                <th>Nome do Cliente</th>
                <th>NIF</th>
                <th>Telefone</th>
                <th>Email</th>
                <th>Morada</th>
                <th className="text-right">Saldo Aberto</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map(c => (
                <tr key={c.id}>
                  <td className="font-bold">{c.name}</td>
                  <td>{c.nif || '-'}</td>
                  <td>{c.phone || '-'}</td>
                  <td>{c.email || '-'}</td>
                  <td>{c.address || '-'}</td>
                  <td className="text-right font-bold text-[#ef4444]">{c.balance > 0 ? c.balance.toLocaleString('pt-AO') : '0'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </A4ReportTemplate>
      </div>

      <div className="relative z-10">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gold-primary/40" size={20} />
        <input
          type="text"
          placeholder="IDENTIFY ENTITY OR CONTACT VECTOR..."
          className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/5 rounded-2xl focus:ring-4 focus:ring-gold-primary/10 focus:border-gold-primary/30 text-white text-[10px] font-black placeholder:text-white/10 outline-none transition-all uppercase tracking-widest shadow-xl"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
        {filteredCustomers.map(customer => (
          <div key={customer.id} className="glass-panel p-8 rounded-[32px] border border-white/5 hover:border-gold-primary/30 transition-all group relative overflow-hidden text-left">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gold-primary/[0.03] rounded-full blur-3xl pointer-events-none group-hover:bg-gold-primary/[0.06] transition-all" />

            <div className="flex justify-between items-start mb-6">
              <div className="w-14 h-14 bg-white/5 text-white/20 rounded-2xl flex items-center justify-center border border-white/5 group-hover:text-gold-primary/40 group-hover:border-gold-primary/20 transition-all">
                <User size={28} />
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">Unsettled Vector</p>
                <p className={`text-xl font-black italic tracking-tighter ${customer.balance > 0 ? 'text-red-400' : 'text-gold-primary'}`}>
                  {customer.balance.toLocaleString()} <span className="text-[10px] not-italic opacity-40 uppercase tracking-widest ml-1">{user?.currency}</span>
                </p>
              </div>
            </div>

            <h3 className="text-lg font-black text-white uppercase tracking-tight mb-6 group-hover:text-gold-primary transition-colors">{customer.name}</h3>

            <div className="space-y-4 text-[10px] font-black text-white/40 uppercase tracking-widest">
              <div className="flex items-center gap-3">
                <CreditCard size={16} className="text-gold-primary/30" />
                <span>NIF: <span className="text-white/60">{customer.nif || 'NULL'}</span></span>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-gold-primary/30" />
                <span className="text-white/60">{customer.phone || 'NO LINK'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-gold-primary/30" />
                <span className="text-white/60 lowercase tracking-normal">{customer.email || 'unset@vector.io'}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin size={16} className="text-gold-primary/30" />
                <span className="line-clamp-1 text-white/60 italic lowercase tracking-normal">{customer.address || 'location undefined'}</span>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 flex flex-col gap-3">
              <div className="flex gap-3">
                <button className="flex-1 bg-white/5 text-white/40 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-white/60 transition-all border border-white/5">
                  Edit
                </button>
                <button
                  onClick={() => setSelectedCustomerForHistory(customer)}
                  className="flex-1 bg-gold-primary/5 text-gold-primary/60 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-gold-primary/10 hover:text-gold-primary transition-all border border-gold-primary/10"
                >
                  History
                </button>
              </div>
              {customer.balance > 0 && (
                <button
                  onClick={() => setSelectedCustomerForPayment(customer)}
                  className="w-full bg-gradient-to-r from-gold-primary to-gold-secondary text-bg-deep py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all flex items-center justify-center gap-2"
                >
                  <CreditCard size={16} />
                  Settle Balance
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
        <div className="fixed inset-0 bg-bg-deep/80 backdrop-blur-xl flex items-center justify-center z-[110] p-4">
          <div className="glass-panel rounded-[40px] w-full max-w-md overflow-hidden shadow-2xl border border-white/10 relative">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-gold-primary/40 to-transparent" />

            <div className="p-8 border-b border-white/5 bg-gold-primary/[0.02] flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-white italic uppercase tracking-widest text-left">Entity <span className="text-gold-gradient">Initialization</span></h3>
                <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] text-left mt-2">Initialize new relationship vector</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/40">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-2">Subject Denomination</label>
                <div className="glass-panel p-4 rounded-2xl border border-white/5 focus-within:border-gold-primary/30 transition-all">
                  <input
                    required
                    type="text"
                    className="w-full bg-transparent border-none outline-none font-black text-white uppercase tracking-tight"
                    placeholder="FULL IDENTIFIER..."
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-2">Fiscal ID (NIF)</label>
                  <div className="glass-panel p-4 rounded-2xl border border-white/5 focus-within:border-gold-primary/30 transition-all">
                    <input
                      type="text"
                      className="w-full bg-transparent border-none outline-none font-black text-white uppercase tracking-tight"
                      placeholder="999 999 999"
                      value={formData.nif}
                      onChange={(e) => setFormData({ ...formData, nif: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-2">Comms Link</label>
                  <div className="glass-panel p-4 rounded-2xl border border-white/5 focus-within:border-gold-primary/30 transition-all">
                    <input
                      type="text"
                      className="w-full bg-transparent border-none outline-none font-black text-white uppercase tracking-tight"
                      placeholder="+244..."
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-2">Digital Vector (Email)</label>
                <div className="glass-panel p-4 rounded-2xl border border-white/5 focus-within:border-gold-primary/30 transition-all">
                  <input
                    type="email"
                    className="w-full bg-transparent border-none outline-none font-black text-white lowercase tracking-normal"
                    placeholder="entity@network.io"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-2">Physical Location</label>
                <div className="glass-panel p-4 rounded-2xl border border-white/5 focus-within:border-gold-primary/30 transition-all">
                  <textarea
                    className="w-full bg-transparent border-none outline-none font-black text-white uppercase tracking-tight resize-none"
                    rows={2}
                    placeholder="LOCATE SUBJECT..."
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </div>

              <div className="pt-6 flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white/30 border border-white/5 hover:bg-white/5 transition-all"
                >
                  Terminate
                </button>
                <button
                  type="submit"
                  className="flex-1 py-5 bg-gradient-to-r from-gold-primary to-gold-secondary text-bg-deep rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] transition-all"
                >
                  Confirm Asset
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
    <div className="fixed inset-0 bg-bg-deep/90 backdrop-blur-2xl flex items-center justify-center z-[120] p-4 text-left">
      <div className="glass-panel rounded-[40px] w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-white/10 relative">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gold-primary/40 to-transparent" />

        {/* Header */}
        <div className="p-10 border-b border-white/5 flex justify-between items-start bg-gold-primary/[0.02]">
          <div className="text-left">
            <div className="flex items-center gap-5 mb-4 justify-start">
              <div className="w-16 h-16 bg-white/5 text-gold-primary rounded-[20px] flex items-center justify-center border border-gold-primary/20 shadow-[0_0_20px_rgba(212,175,55,0.1)]">
                <User size={32} />
              </div>
              <div className="text-left">
                <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">{customer.name}</h3>
                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mt-1 text-left">NIF: {customer.nif || 'CLASSIFIED'}</p>
              </div>
            </div>
            <div className="flex gap-6 justify-start">
              <div className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest">
                <Phone size={14} className="text-gold-primary/40" />
                {customer.phone || 'NO LINK'}
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest lowercase">
                <Mail size={14} className="text-gold-primary/40" />
                {customer.email || 'unset@vector.io'}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-white/5 rounded-full transition-colors text-white/40"
          >
            <Plus size={28} className="rotate-45" />
          </button>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-2 gap-6 p-10 bg-white/[0.01]">
          <div className="glass-panel p-8 rounded-[28px] border border-white/5 relative overflow-hidden group text-left">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/[0.03] rounded-full blur-2xl" />
            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-3 text-left">Liability Magnitude</p>
            <p className={`text-4xl font-black italic tracking-tighter text-left ${customer.balance > 0 ? 'text-red-400' : 'text-gold-primary'}`}>
              {customer.balance.toLocaleString()} <span className="text-xs not-italic opacity-30 ml-1 uppercase">{user?.currency}</span>
            </p>
          </div>
          <div className="glass-panel p-8 rounded-[28px] border border-white/5 relative overflow-hidden group text-left">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gold-primary/[0.03] rounded-full blur-2xl" />
            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-3 text-left">Unresolved Vectors</p>
            <p className="text-4xl font-black text-white italic tracking-tighter text-left">
              {pendingSales.length} <span className="text-xs not-italic opacity-30 ml-1 uppercase tracking-widest">Nodes</span>
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-10 border-b border-white/5 flex gap-10 bg-transparent justify-between items-center">
          <div className="flex gap-10">
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-6 text-[10px] font-black uppercase tracking-[0.3em] transition-all relative ${activeTab === 'pending' ? 'text-red-400' : 'text-white/20 hover:text-white/40'}`}
            >
              Pending Flux
              {activeTab === 'pending' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.5)]" />}
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`py-6 text-[10px] font-black uppercase tracking-[0.3em] transition-all relative ${activeTab === 'all' ? 'text-gold-primary' : 'text-white/20 hover:text-white/40'}`}
            >
              All Sequences
              {activeTab === 'all' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gold-primary shadow-[0_0_10px_rgba(212,175,55,0.5)]" />}
            </button>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
            <input
              type="text"
              placeholder="SCAN LOGS..."
              className="bg-white/5 border border-white/5 rounded-xl px-10 py-2 text-[9px] font-black uppercase tracking-widest text-white outline-none focus:border-gold-primary/20 transition-all"
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-10 space-y-5 bg-transparent">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-2 border-gold-primary/20 border-t-gold-primary rounded-full animate-spin mb-6"></div>
              <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Synchronizing data stream...</p>
            </div>
          ) : displayHistory.length === 0 ? (
            <div className="text-center py-20 opacity-20">
              <Search size={48} className="mx-auto mb-6 text-white" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em]">No registry entries detected</p>
            </div>
          ) : (
            <div className="space-y-4 text-left">
              {displayHistory.filter(item => item.reference.toLowerCase().includes(search.toLowerCase())).map((item, idx) => (
                <div
                  key={idx}
                  className={`group p-6 rounded-[24px] border transition-all hover:bg-white/[0.02] ${item.type === 'payment'
                    ? 'bg-gold-primary/[0.02] border-gold-primary/10'
                    : 'bg-white/[0.01] border-white/5'
                    }`}
                >
                  <div className="flex justify-between items-center text-left">
                    <div className="flex items-center gap-5">
                      <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center border ${item.type === 'payment' ? 'bg-gold-primary/10 border-gold-primary/20 text-gold-primary' : 'bg-white/5 border-white/10 text-white/40'
                        }`}>
                        {item.type === 'payment' ? <CreditCard size={20} /> : <Package size={20} />}
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-3 mb-1 justify-start">
                          <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${item.type === 'payment' ? 'bg-gold-primary/20 border-gold-primary/30 text-gold-primary' : 'bg-white/10 border-white/20 text-white/60'
                            }`}>
                            {item.type === 'payment' ? 'Settle' : 'Invoice'}
                          </span>
                          <span className="text-[9px] font-black text-white/20 uppercase tracking-tighter">
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="font-black text-white uppercase tracking-tight text-sm text-left">{item.reference}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xl font-black italic tracking-tighter ${item.type === 'payment' ? 'text-gold-primary' : 'text-white'}`}>
                        {item.type === 'payment' ? '-' : ''}{item.amount.toLocaleString()} <span className="text-[10px] not-italic opacity-30 ml-1">{user?.currency}</span>
                      </p>
                      {item.type === 'sale' && (
                        <div className="flex flex-col items-end mt-2">
                          {item.status === 'pending' ? (
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                              <span className="text-[9px] font-black text-red-400 uppercase tracking-widest">Pending</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-gold-primary" />
                              <span className="text-[9px] font-black text-gold-primary uppercase tracking-widest">Liquidated</span>
                            </div>
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
        <div className="p-10 border-t border-white/5 bg-gold-primary/[0.01] flex justify-between items-center overflow-hidden">
          <div className="flex items-center gap-3 justify-start">
            <div className={`w-2 h-2 rounded-full shrink-0 ${customer.balance > 0 ? 'bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.5)]' : 'bg-gold-primary shadow-[0_0_10px_rgba(212,175,55,0.5)]'}`} />
            <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] whitespace-nowrap">
              {customer.balance > 0 ? 'Anomaly detected: Outstanding liability' : 'Registry synchronized: Neutral state'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-10 py-4 bg-white/5 hover:bg-white/10 text-white/60 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
          >
            Terminal Close
          </button>
        </div>
      </div>
    </div>
  );
}

