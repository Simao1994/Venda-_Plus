import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, Edit2, Trash2, Package, Filter, Printer, History, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

export default function Products() {
  const { token, user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'list' | 'history'>('list');
  const [movements, setMovements] = useState<any[]>([]);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [entryData, setEntryData] = useState({ product_id: '', quantity: '', type: 'in', reason: 'Reposição' });
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    category_id: '',
    cost_price: '',
    sale_price: '',
    stock: '',
    min_stock: '5',
    unit: 'un',
    expiry_date: '',
    tipo: 'produto',
    lote: ''
  });

  const printRef = React.useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    pageStyle: `
      @page {
        size: A4;
        margin: 20mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
        }
      }
    `
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [prodRes, catRes, movRes] = await Promise.all([
        fetch('/api/products', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/categories', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/inventory/movements', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const [prodData, catData, movData] = await Promise.all([prodRes.json(), catRes.json(), movRes.json()]);
      setProducts(prodData);
      setCategories(catData);
      setMovements(movData || []);
    } finally {
      setLoading(false);
    }
  };

  const handleManualEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/inventory/movements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        ...entryData,
        product_id: parseInt(entryData.product_id),
        quantity: parseFloat(entryData.quantity)
      })
    });
    if (res.ok) {
      setShowEntryModal(false);
      setEntryData({ product_id: '', quantity: '', type: 'in', reason: 'Reposição' });
      fetchData();
    }
  };

  const handleManualAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/inventory/movements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        ...entryData,
        product_id: parseInt(entryData.product_id),
        quantity: parseFloat(entryData.quantity)
      })
    });
    if (res.ok) {
      setShowEntryModal(false);
      setEntryData({ product_id: '', quantity: '', type: 'out', reason: 'Quebra' });
      fetchData();
    }
  };

  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      setShowModal(false);
      setFormData({ name: '', barcode: '', category_id: '', cost_price: '', sale_price: '', stock: '', min_stock: '5', unit: 'un', expiry_date: '', tipo: 'produto', lote: '' });
      fetchData();
    } else {
      const data = await res.json();
      setError(data.error || 'Erro ao guardar produto. Verifique se todos os campos estão correctos.');
    }
  };



  return (
    <div className="p-8 space-y-10 relative">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter italic uppercase">
            Asset <span className="text-gold-gradient">Inventory</span>
          </h1>
          <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mt-2">Core resource management & valuation</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => handlePrint()}
            className="flex items-center gap-3 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/60 border border-white/5 bg-white/5 hover:bg-white/10 transition-all shadow-xl"
          >
            <Printer size={18} className="text-gold-primary/60" />
            Hardcopy
          </button>
          <button
            onClick={() => setShowEntryModal(true)}
            className="flex items-center gap-3 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/60 border border-white/5 bg-white/5 hover:bg-white/10 transition-all shadow-xl"
          >
            <History size={18} className="text-gold-primary/60" />
            Vector Shift
          </button>
          <button
            onClick={() => {
              fetchData();
              setShowModal(true);
            }}
            className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-gold-primary to-gold-secondary text-bg-deep rounded-2xl text-[10px] font-black uppercase tracking-widest hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] transition-all shadow-2xl"
          >
            <Plus size={18} />
            Initialize Asset
          </button>
        </div>
      </div>

      <div className="flex gap-4 relative z-10">
        {[
          { id: 'list', label: 'Primary Registry' },
          { id: 'history', label: 'Flux Logs' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${activeSubTab === tab.id
              ? 'bg-gold-primary/10 text-gold-primary border-gold-primary/30 shadow-[0_0_20px_rgba(212,175,55,0.1)]'
              : 'text-white/40 border-transparent hover:text-white/60'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeSubTab === 'list' ? (
        <div ref={printRef} className="glass-panel rounded-3xl border border-white/5 overflow-hidden shadow-2xl relative z-10 print:shadow-none print:border-none print:bg-white">
          <div className="p-6 border-b border-white/5 bg-white/[0.02] flex flex-col md:flex-row gap-6 print:hidden">
            <div className="relative flex-1">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gold-primary/40" size={18} />
              <input
                type="text"
                placeholder="SCAN OR FILTER REGISTRY..."
                className="w-full pl-14 pr-6 py-4 bg-white/5 border border-white/5 rounded-2xl focus:ring-4 focus:ring-gold-primary/10 focus:border-gold-primary/30 text-white text-[10px] font-black placeholder:text-white/10 outline-none transition-all uppercase tracking-widest"
              />
            </div>
            <button className="px-6 py-4 glass-panel border border-white/5 rounded-2xl flex items-center gap-3 hover:bg-white/5 text-[10px] font-black text-white/40 uppercase tracking-widest transition-all">
              <Filter size={18} className="text-gold-primary/40" />
              Optimization
            </button>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left">
              <thead className="bg-white/[0.02] text-gold-primary/40 text-[9px] uppercase tracking-[0.3em] border-b border-white/5 font-black">
                <tr>
                  <th className="px-8 py-5">Asset Identification</th>
                  <th className="px-8 py-5">Sector</th>
                  <th className="px-8 py-5 text-right">Valuation</th>
                  <th className="px-8 py-5 text-center">Reserve</th>
                  <th className="px-8 py-5 text-center">Status</th>
                  <th className="px-8 py-5 text-right print:hidden">Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {products.map(product => (
                  <tr key={product.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white/20 group-hover:text-gold-primary/40 transition-colors border border-white/5">
                          <Package size={22} />
                        </div>
                        <div>
                          <div className="font-black text-white uppercase tracking-tight group-hover:text-gold-primary transition-colors text-xs">{product.name}</div>
                          <div className="text-[10px] font-medium text-white/20 uppercase tracking-widest mt-1">{product.barcode}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-[10px] font-black text-white/40 uppercase tracking-widest block">{product.category_name || 'UNCLTIFIED'}</span>
                      {product.tipo === 'medicamento' && <span className="text-[8px] font-black text-blue-400 uppercase tracking-[0.2em] bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20 inline-block mt-2">Medicine</span>}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="font-black text-white italic tracking-tighter text-sm">
                        {product.sale_price.toLocaleString()} <span className="text-[9px] text-gold-primary/40 not-italic ml-1 tracking-widest uppercase">{user?.currency}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className="font-black text-white/60 text-xs tracking-tighter">
                        {product.stock} <span className="text-[9px] font-black text-white/20 uppercase tracking-widest italic ml-1">{product.unit}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      {product.stock <= product.min_stock ? (
                        <span className="px-4 py-2 bg-red-500/10 text-red-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]">Low Reserve</span>
                      ) : (
                        <span className="px-4 py-2 bg-gold-primary/10 text-gold-primary rounded-full text-[9px] font-black uppercase tracking-widest border border-gold-primary/20 shadow-[0_0_15px_rgba(212,175,55,0.1)]">Operational</span>
                      )}
                    </td>
                    <td className="px-8 py-6 text-right print:hidden">
                      <div className="flex justify-end gap-3 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all">
                        <button className="p-3 text-white/40 hover:text-gold-primary bg-white/5 hover:bg-gold-primary/10 rounded-xl transition-all border border-transparent hover:border-gold-primary/30">
                          <Edit2 size={16} />
                        </button>
                        <button className="p-3 text-white/40 hover:text-red-500 bg-white/5 hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-500/30">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="glass-panel rounded-3xl border border-white/5 overflow-hidden shadow-2xl relative z-10">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left">
              <thead className="bg-white/[0.02] text-gold-primary/40 text-[9px] uppercase tracking-[0.3em] border-b border-white/5 font-black">
                <tr>
                  <th className="px-8 py-5">Time Vector</th>
                  <th className="px-8 py-5">Asset Identification</th>
                  <th className="px-8 py-5 text-center">Protocol</th>
                  <th className="px-8 py-5 text-right">Quantity Delta</th>
                  <th className="px-8 py-5">Reasoning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {movements.map((mov, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-8 py-6 text-[10px] font-black text-white/20 uppercase tracking-widest">{new Date(mov.created_at).toLocaleString()}</td>
                    <td className="px-8 py-6">
                      <div className="font-black text-white uppercase tracking-tight group-hover:text-gold-primary transition-colors text-xs">{mov.product_name}</div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm ${mov.type === 'in' ? 'bg-gold-primary/10 text-gold-primary border-gold-primary/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                        {mov.type === 'in' ? <ArrowDownLeft size={12} className="inline mr-2" /> : <ArrowUpRight size={12} className="inline mr-2" />}
                        {mov.type === 'in' ? 'Absorption' : 'Extraction'}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right font-black text-white italic text-sm">{mov.quantity}</td>
                    <td className="px-8 py-6 text-[10px] font-medium text-white/40 uppercase tracking-widest">{mov.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Entry Modal */}
      {showEntryModal && (
        <div className="fixed inset-0 bg-bg-deep/80 backdrop-blur-xl flex items-center justify-center z-[110] p-4">
          <div className="glass-panel rounded-[40px] w-full max-w-md overflow-hidden shadow-2xl border border-white/10 relative">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-gold-primary/40 to-transparent" />

            <div className="p-8 border-b border-white/5 bg-gold-primary/[0.02]">
              <h3 className="text-xl font-black text-white italic uppercase tracking-widest text-center">Protocol <span className="text-gold-gradient">Shift</span></h3>
              <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] text-center mt-2">Initialize resource vector adjustment</p>
            </div>

            <form onSubmit={handleManualEntry} className="p-10 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-2">Target Asset</label>
                <div className="glass-panel p-4 rounded-2xl border border-white/5 focus-within:border-gold-primary/30 transition-all">
                  <select
                    required
                    className="w-full bg-transparent border-none outline-none font-black text-white uppercase tracking-tight appearance-none"
                    value={entryData.product_id}
                    onChange={e => setEntryData({ ...entryData, product_id: e.target.value })}
                  >
                    <option value="" className="bg-bg-deep">Select Target</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id} className="bg-bg-deep">{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-2">Protocol Type</label>
                  <div className="glass-panel p-4 rounded-2xl border border-white/5 focus-within:border-gold-primary/30 transition-all">
                    <select
                      className="w-full bg-transparent border-none outline-none font-black text-white uppercase tracking-tight appearance-none"
                      value={entryData.type}
                      onChange={e => setEntryData({ ...entryData, type: e.target.value as any, reason: e.target.value === 'in' ? 'Reposição' : 'Quebra' })}
                    >
                      <option value="in" className="bg-bg-deep">Absorption (+)</option>
                      <option value="out" className="bg-bg-deep">Extraction (-)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-2">Magnitude</label>
                  <div className="glass-panel p-4 rounded-2xl border border-white/5 focus-within:border-gold-primary/30 transition-all">
                    <input
                      required
                      type="number"
                      step="0.01"
                      className="w-full bg-transparent border-none outline-none font-black text-white italic tracking-tighter"
                      placeholder="0.00"
                      value={entryData.quantity}
                      onChange={e => setEntryData({ ...entryData, quantity: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-2">Reasoning Protocol</label>
                <div className="glass-panel p-4 rounded-2xl border border-white/5 focus-within:border-gold-primary/30 transition-all">
                  <select
                    className="w-full bg-transparent border-none outline-none font-black text-white uppercase tracking-tight appearance-none"
                    value={entryData.reason}
                    onChange={e => setEntryData({ ...entryData, reason: e.target.value })}
                  >
                    {entryData.type === 'in' ? (
                      <>
                        <option value="Reposição" className="bg-bg-deep">Reposição de Stock</option>
                        <option value="Devolução de Cliente" className="bg-bg-deep">Devolução de Cliente</option>
                        <option value="Ajuste Positivo" className="bg-bg-deep">Ajuste Positivo (Inventário)</option>
                      </>
                    ) : (
                      <>
                        <option value="Quebra" className="bg-bg-deep">Quebra / Dano</option>
                        <option value="Vencimento" className="bg-bg-deep">Produto Vencido</option>
                        <option value="Uso Interno" className="bg-bg-deep">Uso Interno / Amostra</option>
                        <option value="Ajuste Negativo" className="bg-bg-deep">Ajuste Negativo (Inventário)</option>
                        <option value="Roubo/Extravio" className="bg-bg-deep">Roubo ou Extravio</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="pt-6 flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowEntryModal(false)}
                  className="flex-1 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white/30 border border-white/5 hover:bg-white/5 transition-all"
                >
                  Terminate
                </button>
                <button
                  type="submit"
                  className="flex-1 py-5 bg-gradient-to-r from-gold-primary to-gold-secondary text-bg-deep rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] transition-all"
                >
                  Apply Flux
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-bg-deep/80 backdrop-blur-xl flex items-center justify-center z-[110] p-4">
          <div className="glass-panel rounded-[40px] w-full max-w-2xl overflow-hidden shadow-2xl border border-white/10 relative">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-gold-primary/40 to-transparent" />

            <div className="p-8 border-b border-white/5 bg-gold-primary/[0.02] flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-white italic uppercase tracking-widest text-left">Asset <span className="text-gold-gradient">Initialization</span></h3>
                <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] text-left mt-2">Create new resource node in primary registry</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/40">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 grid grid-cols-1 md:grid-cols-2 gap-6">
              {error && (
                <div className="col-span-1 md:col-span-2 p-5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-[10px] font-black uppercase tracking-widest">
                  {error}
                </div>
              )}

              <div className="col-span-1 md:col-span-2 mb-2">
                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-3 text-center">Protocol Type</label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, tipo: 'produto', lote: '' })}
                    className={`flex-1 p-4 rounded-2xl border font-black uppercase tracking-widest text-[10px] transition-all flex justify-center items-center gap-2 ${formData.tipo === 'produto'
                        ? 'bg-gold-primary text-bg-deep border-gold-primary shadow-[0_0_20px_rgba(212,175,55,0.3)]'
                        : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10'
                      }`}
                  >
                    Standard Asset
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, tipo: 'medicamento' })}
                    className={`flex-1 p-4 rounded-2xl border font-black uppercase tracking-widest text-[10px] transition-all flex justify-center items-center gap-2 ${formData.tipo === 'medicamento'
                        ? 'bg-blue-500 text-bg-deep border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                        : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10'
                      }`}
                  >
                    Medicine / Pharmacy
                  </button>
                </div>
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-2">Asset Denomination</label>
                <div className="glass-panel p-4 rounded-2xl border border-white/5 focus-within:border-gold-primary/30 transition-all">
                  <input
                    type="text"
                    required
                    className="w-full bg-transparent border-none outline-none font-black text-white uppercase tracking-tight"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="IDENTIFY RESOURCE..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-2">Registry ID (Barcode)</label>
                <div className="flex gap-2">
                  <div className="flex-1 glass-panel p-4 rounded-2xl border border-white/5 focus-within:border-gold-primary/30 transition-all text-left">
                    <input
                      type="text"
                      className="w-full bg-transparent border-none outline-none font-black text-white uppercase tracking-tight"
                      value={formData.barcode}
                      onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                      placeholder="SCANNER INPUT..."
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const randomBarcode = Math.floor(Math.random() * 9000000000000 + 1000000000000).toString();
                      setFormData({ ...formData, barcode: randomBarcode });
                    }}
                    className="px-4 bg-white/5 text-gold-primary rounded-2xl hover:bg-gold-primary/10 transition-all font-black text-[9px] uppercase border border-white/5"
                  >
                    Auto
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-2">Sector Classification</label>
                <div className="glass-panel p-4 rounded-2xl border border-white/5 focus-within:border-gold-primary/30 transition-all text-left">
                  <select
                    className="w-full bg-transparent border-none outline-none font-black text-white uppercase tracking-tight appearance-none"
                    value={formData.category_id}
                    onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                  >
                    <option value="" className="bg-bg-deep">Unclassified</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id} className="bg-bg-deep">{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-2">Acquisition Value</label>
                <div className="glass-panel p-4 rounded-2xl border border-white/5 focus-within:border-gold-primary/30 transition-all text-left">
                  <input
                    type="number"
                    step="0.01"
                    className="w-full bg-transparent border-none outline-none font-black text-white italic tracking-tighter"
                    value={formData.cost_price}
                    onChange={e => setFormData({ ...formData, cost_price: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-2">Market Valuation</label>
                <div className="glass-panel p-4 rounded-2xl border border-white/5 focus-within:border-gold-primary/30 transition-all text-left">
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full bg-transparent border-none outline-none font-black text-white italic tracking-tighter"
                    value={formData.sale_price}
                    onChange={e => setFormData({ ...formData, sale_price: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-2">Initial Reserve</label>
                <div className="glass-panel p-4 rounded-2xl border border-white/5 focus-within:border-gold-primary/30 transition-all text-left">
                  <input
                    type="number"
                    required
                    className="w-full bg-transparent border-none outline-none font-black text-white italic tracking-tighter"
                    value={formData.stock}
                    onChange={e => setFormData({ ...formData, stock: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-2">Warning Threshold</label>
                <div className="glass-panel p-4 rounded-2xl border border-white/5 focus-within:border-gold-primary/30 transition-all text-left">
                  <input
                    type="number"
                    className="w-full bg-transparent border-none outline-none font-black text-white italic tracking-tighter"
                    value={formData.min_stock}
                    onChange={e => setFormData({ ...formData, min_stock: e.target.value })}
                  />
                </div>
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-2">Vector Termination {formData.tipo === 'medicamento' && '(Expiry Date - Required)'}</label>
                <div className="glass-panel p-4 rounded-2xl border border-white/5 focus-within:border-gold-primary/30 transition-all text-left">
                  <input
                    type="date"
                    required={formData.tipo === 'medicamento'}
                    className="w-full bg-transparent border-none outline-none font-black text-white italic"
                    value={formData.expiry_date}
                    onChange={e => setFormData({ ...formData, expiry_date: e.target.value })}
                  />
                </div>
              </div>

              {formData.tipo === 'medicamento' && (
                <div className="col-span-1 md:col-span-2 animate-in fade-in slide-in-from-top-2">
                  <label className="block text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-2">Batch / Lot Identifier</label>
                  <div className="glass-panel p-4 rounded-2xl border border-blue-500/30 focus-within:border-blue-400 transition-all text-left bg-blue-500/5">
                    <input
                      type="text"
                      required
                      className="w-full bg-transparent border-none outline-none font-black text-white uppercase tracking-tight"
                      value={formData.lote}
                      onChange={e => setFormData({ ...formData, lote: e.target.value })}
                      placeholder="ENTER ASSIGNED BATCH LOTE..."
                    />
                  </div>
                </div>
              )}

              <div className="col-span-1 md:col-span-2 flex justify-end gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-8 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white/30 border border-white/5 hover:bg-white/5 transition-all"
                >
                  Terminate
                </button>
                <button
                  type="submit"
                  className="px-10 py-5 bg-gradient-to-r from-gold-primary to-gold-secondary text-bg-deep rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] transition-all"
                >
                  Inject Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
