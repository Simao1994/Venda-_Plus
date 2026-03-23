import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, Edit2, Trash2, Package, Filter, Printer, History, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { A4ReportTemplate } from './reports/A4ReportTemplate';

export default function Products() {
  const { token, user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
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
    supplier_id: '',
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
    documentTitle: `Venda Plus — Inventário — ${new Date().toLocaleDateString('pt-AO')}`
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [prodRes, catRes, movRes, suppRes] = await Promise.all([
        fetch('/api/products', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/categories', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/inventory/movements', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/suppliers', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const [prodData, catData, movData, suppData] = await Promise.all([prodRes.json(), catRes.json(), movRes.json(), suppRes.json()]);
      setProducts(prodData);
      setCategories(catData);
      setMovements(movData || []);
      setSuppliers(suppData || []);
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
      setFormData({ name: '', barcode: '', category_id: '', supplier_id: '', cost_price: '', sale_price: '', stock: '', min_stock: '5', unit: 'un', expiry_date: '', tipo: 'produto', lote: '' });
      fetchData();
    } else {
      const data = await res.json();
      setError(data.error || 'Erro ao guardar produto. Verifique se todos os campos estão correctos.');
    }
  };



  return (
    <div className="p-8 space-y-10 relative">
      {/* Hidden Printable A4 Report */}
      <div style={{ display: 'none' }}>
        <A4ReportTemplate
          ref={printRef}
          title="Relatório de Produtos e Inventário"
          companyData={user}
          orientation="landscape"
        >
          <table className="a4-table">
            <thead>
              <tr>
                <th>Produto & Categoria</th>
                <th>Código (EAN)</th>
                <th className="text-right">Preço de Custo</th>
                <th className="text-right">Preço de Venda</th>
                <th className="text-center">Stock Atual</th>
                <th className="text-center">Estado</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td className="font-bold">
                    {p.name} <br />
                    <span style={{ fontSize: '8px', color: '#666', fontWeight: 'normal' }}>{p.category_name || 'SEM CATEGORIA'}</span>
                  </td>
                  <td>{p.barcode}</td>
                  <td className="text-right">{p.cost_price?.toLocaleString('pt-AO')} {user?.currency}</td>
                  <td className="text-right font-bold text-[#1a6b3c]">{p.sale_price?.toLocaleString('pt-AO')} {user?.currency}</td>
                  <td className="text-center">{p.stock} <span style={{ fontSize: '8px' }}>{p.unit}</span></td>
                  <td className="text-center text-[9px] font-bold" style={{ color: p.stock <= p.min_stock ? '#ef4444' : '#1a6b3c' }}>
                    {p.stock <= p.min_stock ? 'Baixo' : 'OK'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </A4ReportTemplate>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter italic uppercase">
            Gestão de <span className="text-gold-gradient">Produtos</span>
          </h1>
          <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mt-2">Gestão central de recursos e stock</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => handlePrint()}
            className="flex items-center gap-3 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/60 border border-white/5 bg-white/5 hover:bg-white/10 transition-all shadow-xl"
          >
            <Printer size={18} className="text-gold-primary/60" />
            Imprimir
          </button>
          <button
            onClick={() => setShowEntryModal(true)}
            className="flex items-center gap-3 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/60 border border-white/5 bg-white/5 hover:bg-white/10 transition-all shadow-xl"
          >
            <History size={18} className="text-gold-primary/60" />
            Mover Stock
          </button>
          <button
            onClick={() => {
              fetchData();
              setShowModal(true);
            }}
            className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-gold-primary to-gold-secondary text-bg-deep rounded-2xl text-[10px] font-black uppercase tracking-widest hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] transition-all shadow-2xl"
          >
            <Plus size={18} />
            Novo Produto
          </button>
        </div>
      </div>

      <div className="flex gap-4 relative z-10">
        {[
          { id: 'list', label: 'Lista de Produtos' },
          { id: 'history', label: 'Histórico de Stock' }
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
        <div className="glass-panel rounded-3xl border border-white/5 overflow-hidden shadow-2xl relative z-10">
          <div className="p-6 border-b border-white/5 bg-white/[0.02] flex flex-col md:flex-row gap-6 print:hidden">
            <div className="relative flex-1">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gold-primary/40" size={18} />
              <input
                type="text"
                placeholder="PESQUISAR PRODUTO NO REGISTO..."
                className="w-full pl-14 pr-6 py-4 bg-white/5 border border-white/5 rounded-2xl focus:ring-4 focus:ring-gold-primary/10 focus:border-gold-primary/30 text-white text-[10px] font-black placeholder:text-white/10 outline-none transition-all uppercase tracking-widest"
              />
            </div>
            <button className="px-6 py-4 glass-panel border border-white/5 rounded-2xl flex items-center gap-3 hover:bg-white/5 text-[10px] font-black text-white/40 uppercase tracking-widest transition-all">
              <Filter size={18} className="text-gold-primary/40" />
              Filtros
            </button>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left">
              <thead className="bg-white/[0.02] text-gold-primary/40 text-[9px] uppercase tracking-[0.3em] border-b border-white/5 font-black">
                <tr>
                  <th className="px-8 py-5">Identificação do Produto</th>
                  <th className="px-8 py-5">Categoria</th>
                  <th className="px-8 py-5 text-right">Preço Venda</th>
                  <th className="px-8 py-5 text-center">Stock Atual</th>
                  <th className="px-8 py-5 text-center">Estado</th>
                  <th className="px-8 py-5 text-right print:hidden">Acções</th>
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
                      <span className="text-[10px] font-black text-white/40 uppercase tracking-widest block">{product.category_name || 'SEM CATEGORIA'}</span>
                      {product.tipo === 'medicamento' && <span className="text-[8px] font-black text-blue-400 uppercase tracking-[0.2em] bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20 inline-block mt-2">Medicamento</span>}
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
                        <span className="px-4 py-2 bg-red-500/10 text-red-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]">Stock Baixo</span>
                      ) : (
                        <span className="px-4 py-2 bg-gold-primary/10 text-gold-primary rounded-full text-[9px] font-black uppercase tracking-widest border border-gold-primary/20 shadow-[0_0_15px_rgba(212,175,55,0.1)]">Disponível</span>
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
                  <th className="px-8 py-5">Data/Hora</th>
                  <th className="px-8 py-5">Produto</th>
                  <th className="px-8 py-5 text-center">Operação</th>
                  <th className="px-8 py-5 text-right">Quantidade</th>
                  <th className="px-8 py-5">Motivo</th>
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
                        {mov.type === 'in' ? 'Entrada' : 'Saída'}
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
              <h3 className="text-xl font-black text-white italic uppercase tracking-widest text-center">Mover <span className="text-gold-gradient">Stock</span></h3>
              <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] text-center mt-2">Registar ajuste ou movimento de inventário</p>
            </div>

            <form onSubmit={handleManualEntry} className="p-10 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-2">Produto Alvo</label>
                <div className="glass-panel p-4 rounded-2xl border border-white/5 focus-within:border-gold-primary/30 transition-all">
                  <select
                    required
                    className="w-full bg-transparent border-none outline-none font-black text-white uppercase tracking-tight appearance-none"
                    value={entryData.product_id}
                    onChange={e => setEntryData({ ...entryData, product_id: e.target.value })}
                  >
                    <option value="" className="bg-bg-deep">Seleccionar Produto</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id} className="bg-bg-deep">{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-2">Tipo de Movimento</label>
                  <div className="glass-panel p-4 rounded-2xl border border-white/5 focus-within:border-gold-primary/30 transition-all">
                    <select
                      className="w-full bg-transparent border-none outline-none font-black text-white uppercase tracking-tight appearance-none"
                      value={entryData.type}
                      onChange={e => setEntryData({ ...entryData, type: e.target.value as any, reason: e.target.value === 'in' ? 'Reposição' : 'Quebra' })}
                    >
                      <option value="in" className="bg-bg-deep">Entrada (+)</option>
                      <option value="out" className="bg-bg-deep">Saída (-)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-2">Quantidade</label>
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
                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-2">Motivo do Ajuste</label>
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
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-5 bg-gradient-to-r from-gold-primary to-gold-secondary text-bg-deep rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] transition-all"
                >
                  Confirmar ajuste
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
                <h3 className="text-xl font-black text-white italic uppercase tracking-widest text-left">Cadastro de <span className="text-gold-gradient">Produto</span></h3>
                <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] text-left mt-2">Adicionar novo item ao registo principal</p>
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
                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-3 text-center">Tipo de Produto</label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, tipo: 'produto', lote: '' })}
                    className={`flex-1 p-4 rounded-2xl border font-black uppercase tracking-widest text-[10px] transition-all flex justify-center items-center gap-2 ${formData.tipo === 'produto'
                      ? 'bg-gold-primary text-bg-deep border-gold-primary shadow-[0_0_20px_rgba(212,175,55,0.3)]'
                      : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10'
                      }`}
                  >
                    Produto Geral
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, tipo: 'medicamento' })}
                    className={`flex-1 p-4 rounded-2xl border font-black uppercase tracking-widest text-[10px] transition-all flex justify-center items-center gap-2 ${formData.tipo === 'medicamento'
                      ? 'bg-blue-500 text-bg-deep border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                      : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10'
                      }`}
                  >
                    Medicamento / Farmácia
                  </button>
                </div>
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-2">Nome do Produto</label>
                <div className="glass-panel p-4 rounded-2xl border border-white/5 focus-within:border-gold-primary/30 transition-all">
                  <input
                    type="text"
                    required
                    className="w-full bg-transparent border-none outline-none font-black text-white uppercase tracking-tight"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="NOME DO ARTIGO..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-2">Código de Barras (EAN)</label>
                <div className="flex gap-2">
                  <div className="flex-1 glass-panel p-4 rounded-2xl border border-white/5 focus-within:border-gold-primary/30 transition-all text-left">
                    <input
                      type="text"
                      className="w-full bg-transparent border-none outline-none font-black text-white uppercase tracking-tight"
                      value={formData.barcode}
                      onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                      placeholder="INTRODUZA OU LEIA O CÓDIGO..."
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
                    Gerar
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-2">Categoria / Sector</label>
                <div className="glass-panel p-4 rounded-2xl border border-white/5 focus-within:border-gold-primary/30 transition-all text-left">
                  <select
                    className="w-full bg-transparent border-none outline-none font-black text-white uppercase tracking-tight appearance-none"
                    value={formData.category_id}
                    onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                  >
                    <option value="" className="bg-bg-deep">Sem Categoria</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id} className="bg-bg-deep">{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-2">Fornecedor</label>
                <div className="glass-panel p-4 rounded-2xl border border-white/5 focus-within:border-gold-primary/30 transition-all text-left">
                  <select
                    className="w-full bg-transparent border-none outline-none font-black text-white uppercase tracking-tight appearance-none"
                    value={formData.supplier_id}
                    onChange={e => setFormData({ ...formData, supplier_id: e.target.value })}
                  >
                    <option value="" className="bg-bg-deep">Nenhum</option>
                    {suppliers.map(supp => (
                      <option key={supp.id} value={supp.id} className="bg-bg-deep">{supp.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-2">Preço de Custo</label>
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
                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-2">Preço de Venda</label>
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
                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-2">Stock Inicial</label>
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
                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-2">Stock Mínimo (Alerta)</label>
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
                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-2">Data de Expiração {formData.tipo === 'medicamento' && '(Obrigatória)'}</label>
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
                  <label className="block text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-2">Lote / Partida (Identificador)</label>
                  <div className="glass-panel p-4 rounded-2xl border border-blue-500/30 focus-within:border-blue-400 transition-all text-left bg-blue-500/5">
                    <input
                      type="text"
                      required
                      className="w-full bg-transparent border-none outline-none font-black text-white uppercase tracking-tight"
                      value={formData.lote}
                      onChange={e => setFormData({ ...formData, lote: e.target.value })}
                      placeholder="IDENTIFICAÇÃO DO LOTE..."
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
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-10 py-5 bg-gradient-to-r from-gold-primary to-gold-secondary text-bg-deep rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] transition-all"
                >
                  Guardar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
