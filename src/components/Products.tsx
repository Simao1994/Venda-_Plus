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
    unit: 'un'
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
      setFormData({ name: '', barcode: '', category_id: '', cost_price: '', sale_price: '', stock: '', min_stock: '5', unit: 'un' });
      fetchData();
    } else {
      const data = await res.json();
      setError(data.error || 'Erro ao guardar produto. Verifique se todos os campos estão correctos.');
    }
  };



  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Produtos</h1>
          <p className="text-gray-500">Controle o seu inventário e preços.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => handlePrint()}
            className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-gray-50 shadow-sm"
          >
            <Printer size={20} />
            Imprimir
          </button>
          <button
            onClick={() => setShowEntryModal(true)}
            className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-gray-50 shadow-sm"
          >
            <History size={20} />
            Lançar Entrada
          </button>
          <button
            onClick={() => {
              fetchData();
              setShowModal(true);
            }}
            className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-200"
          >

            <Plus size={20} />
            Novo Produto
          </button>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => setActiveSubTab('list')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeSubTab === 'list' ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
        >
          Lista de Produtos
        </button>
        <button
          onClick={() => setActiveSubTab('history')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeSubTab === 'history' ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
        >
          Movimentações
        </button>
      </div>

      {activeSubTab === 'list' ? (
        <div ref={printRef} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden print:shadow-none print:border-none">
          <div className="p-4 border-b bg-gray-50 flex gap-4 print:hidden">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Pesquisar produtos..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border-gray-200 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <button className="px-4 py-2 border rounded-lg flex items-center gap-2 hover:bg-white text-sm font-bold text-gray-600">
              <Filter size={18} />
              Filtros
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-medium">Produto</th>
                  <th className="px-6 py-4 font-medium">Categoria</th>
                  <th className="px-6 py-4 font-medium text-right">Preço Venda</th>
                  <th className="px-6 py-4 font-medium text-center">Stock</th>
                  <th className="px-6 py-4 font-medium text-center">Status</th>
                  <th className="px-6 py-4 font-medium text-right print:hidden">Acções</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map(product => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                          <Package size={20} />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{product.name}</div>
                          <div className="text-xs text-gray-500">{product.barcode}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{product.category_name || 'Sem categoria'}</td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">
                      {product.sale_price.toLocaleString()} {user?.currency}
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      <div className="font-mono text-gray-600">
                        {product.stock} {product.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {product.stock <= product.min_stock ? (
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-bold uppercase print:border print:border-gray-300">Baixo Stock</span>
                      ) : (
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold uppercase print:border print:border-gray-300">Disponível</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right print:hidden">
                      <div className="flex justify-end gap-2">
                        <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-medium">Data</th>
                  <th className="px-6 py-4 font-medium">Produto</th>
                  <th className="px-6 py-4 font-medium text-center">Tipo</th>
                  <th className="px-6 py-4 font-medium text-right">Qtde</th>
                  <th className="px-6 py-4 font-medium">Motivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {movements.map((mov, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-xs text-gray-500">{new Date(mov.created_at).toLocaleString()}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{mov.product_name}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${mov.type === 'in' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {mov.type === 'in' ? <ArrowDownLeft size={12} className="inline mr-1" /> : <ArrowUpRight size={12} className="inline mr-1" />}
                        {mov.type === 'in' ? 'Entrada' : 'Saída'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900">{mov.quantity}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{mov.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Entry Modal */}
      {showEntryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl font-black text-gray-900">Lançar Movimento de Stock</h3>
              <button onClick={() => setShowEntryModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-2xl">&times;</button>
            </div>
            <form onSubmit={handleManualEntry} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Produto</label>
                <select
                  required
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-gray-900 appearance-none"
                  value={entryData.product_id}
                  onChange={e => setFormData({ ...entryData, product_id: e.target.value })}
                >
                  <option value="">Selecione um produto</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Quantidade</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-gray-900"
                    placeholder="0.00"
                    value={entryData.quantity}
                    onChange={e => setEntryData({ ...entryData, quantity: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Tipo</label>
                  <select
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-gray-900 appearance-none"
                    value={entryData.type}
                    onChange={e => setEntryData({ ...entryData, type: e.target.value as any })}
                  >
                    <option value="in">Entrada (+)</option>
                    <option value="out">Saída (-)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Motivo / Observação</label>
                <input
                  type="text"
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-gray-900"
                  placeholder="Ex: Reposição, Ajuste, Quebra..."
                  value={entryData.reason}
                  onChange={e => setEntryData({ ...entryData, reason: e.target.value })}
                />
              </div>
              <div className="pt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowEntryModal(false)}
                  className="flex-1 py-4 border border-gray-100 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95"
                >
                  Confirmar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Cadastrar Novo Produto</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 grid grid-cols-2 gap-4">
              {error && (
                <div className="col-span-2 p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100">
                  {error}
                </div>
              )}
              <div className="col-span-2">

                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto</label>
                <input
                  type="text"
                  required
                  className="w-full rounded-lg border-gray-200 focus:ring-emerald-500 focus:border-emerald-500"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código de Barras</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 rounded-lg border-gray-200 focus:ring-emerald-500 focus:border-emerald-500"
                    value={formData.barcode}
                    onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const randomBarcode = Math.floor(Math.random() * 9000000000000 + 1000000000000).toString();
                      setFormData({ ...formData, barcode: randomBarcode });
                    }}
                    className="px-3 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-all font-bold text-xs uppercase"
                    title="Gerar automaticamente"
                  >
                    Gerar
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <select
                  className="w-full rounded-lg border-gray-200 focus:ring-emerald-500 focus:border-emerald-500"
                  value={formData.category_id}
                  onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                >
                  <option value="">Seleccionar Categoria</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preço de Compra</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full rounded-lg border-gray-200 focus:ring-emerald-500 focus:border-emerald-500"
                  value={formData.cost_price}
                  onChange={e => setFormData({ ...formData, cost_price: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preço de Venda</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="w-full rounded-lg border-gray-200 focus:ring-emerald-500 focus:border-emerald-500"
                  value={formData.sale_price}
                  onChange={e => setFormData({ ...formData, sale_price: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Inicial</label>
                <input
                  type="number"
                  required
                  className="w-full rounded-lg border-gray-200 focus:ring-emerald-500 focus:border-emerald-500"
                  value={formData.stock}
                  onChange={e => setFormData({ ...formData, stock: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo</label>
                <input
                  type="number"
                  className="w-full rounded-lg border-gray-200 focus:ring-emerald-500 focus:border-emerald-500"
                  value={formData.min_stock}
                  onChange={e => setFormData({ ...formData, min_stock: e.target.value })}
                />
              </div>
              <div className="col-span-2 flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700"
                >
                  Salvar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
