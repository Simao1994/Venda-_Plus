import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Search, ShoppingBag, Eye } from 'lucide-react';

export default function Compras() {
  const { token, user } = useAuth();
  const [compras, setCompras] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form states
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [medicamentos, setMedicamentos] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    fornecedor_id: '',
    numero_compra: '',
    data_compra: new Date().toISOString().split('T')[0],
    subtotal: 0,
    iva: 0,
    total: 0,
    itens: [] as any[]
  });

  useEffect(() => {
    fetchData();
    fetchAuxData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/farmacia/compras', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setCompras(data);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuxData = async () => {
    try {
      const [fornRes, medRes] = await Promise.all([
        fetch('/api/farmacia/fornecedores', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/farmacia/medicamentos', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setFornecedores(await fornRes.json());
      setMedicamentos(await medRes.json());
    } catch (error) {
      console.error("Erro ao carregar dados auxiliares", error);
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      itens: [...formData.itens, { medicamento_id: '', lote_id: '', quantidade: 1, preco_unitario: 0, total: 0 }]
    });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItens = [...formData.itens];
    newItens[index] = { ...newItens[index], [field]: value };
    
    // Recalculate item total
    if (field === 'quantidade' || field === 'preco_unitario') {
      newItens[index].total = newItens[index].quantidade * newItens[index].preco_unitario;
    }
    
    // Recalculate global totals
    const subtotal = newItens.reduce((sum, item) => sum + item.total, 0);
    const iva = subtotal * 0.14; // 14% IVA
    
    setFormData({
      ...formData,
      itens: newItens,
      subtotal,
      iva,
      total: subtotal + iva
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/farmacia/compras', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      setShowModal(false);
      setFormData({
        fornecedor_id: '', numero_compra: '', data_compra: new Date().toISOString().split('T')[0],
        subtotal: 0, iva: 0, total: 0, itens: []
      });
      fetchData();
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Entrada de Compras</h1>
          <p className="text-gray-500">Gestão de aquisições e entrada de stock.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-200"
        >
          <Plus size={20} />
          Nova Compra
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Pesquisar compras..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border-gray-200 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">Nº Compra</th>
                <th className="px-6 py-4 font-medium">Fornecedor</th>
                <th className="px-6 py-4 font-medium">Data</th>
                <th className="px-6 py-4 font-medium text-right">Total</th>
                <th className="px-6 py-4 font-medium text-center">Status</th>
                <th className="px-6 py-4 font-medium text-right">Acções</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {compras.map(compra => (
                <tr key={compra.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                        <ShoppingBag size={20} />
                      </div>
                      <div className="font-bold text-gray-900">{compra.numero_compra}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{compra.fornecedor_nome}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(compra.data_compra).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">
                    {compra.total.toLocaleString()} {user?.currency}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold uppercase">
                      {compra.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Registar Nova Compra</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="compra-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fornecedor</label>
                    <select
                      required
                      className="w-full rounded-lg border-gray-200 focus:ring-emerald-500 focus:border-emerald-500"
                      value={formData.fornecedor_id}
                      onChange={e => setFormData({ ...formData, fornecedor_id: e.target.value })}
                    >
                      <option value="">Selecione...</option>
                      {fornecedores.map(f => (
                        <option key={f.id} value={f.id}>{f.nome_empresa}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nº da Fatura/Compra</label>
                    <input
                      type="text"
                      required
                      className="w-full rounded-lg border-gray-200 focus:ring-emerald-500 focus:border-emerald-500"
                      value={formData.numero_compra}
                      onChange={e => setFormData({ ...formData, numero_compra: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data da Compra</label>
                    <input
                      type="date"
                      required
                      className="w-full rounded-lg border-gray-200 focus:ring-emerald-500 focus:border-emerald-500"
                      value={formData.data_compra}
                      onChange={e => setFormData({ ...formData, data_compra: e.target.value })}
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-gray-900">Itens da Compra</h4>
                    <button
                      type="button"
                      onClick={addItem}
                      className="text-sm bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg font-medium hover:bg-emerald-100"
                    >
                      + Adicionar Item
                    </button>
                  </div>

                  <div className="space-y-3">
                    {formData.itens.map((item, index) => (
                      <div key={index} className="flex gap-3 items-end bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Medicamento</label>
                          <select
                            required
                            className="w-full rounded-lg border-gray-200 text-sm"
                            value={item.medicamento_id}
                            onChange={e => updateItem(index, 'medicamento_id', e.target.value)}
                          >
                            <option value="">Selecione...</option>
                            {medicamentos.map(m => (
                              <option key={m.id} value={m.id}>{m.nome_medicamento}</option>
                            ))}
                          </select>
                        </div>
                        <div className="w-24">
                          <label className="block text-xs font-medium text-gray-500 mb-1">ID Lote</label>
                          <input
                            type="text"
                            required
                            className="w-full rounded-lg border-gray-200 text-sm"
                            value={item.lote_id}
                            onChange={e => updateItem(index, 'lote_id', e.target.value)}
                          />
                        </div>
                        <div className="w-24">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Qtd</label>
                          <input
                            type="number"
                            required
                            min="1"
                            className="w-full rounded-lg border-gray-200 text-sm"
                            value={item.quantidade}
                            onChange={e => updateItem(index, 'quantidade', parseInt(e.target.value))}
                          />
                        </div>
                        <div className="w-32">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Preço Unit.</label>
                          <input
                            type="number"
                            required
                            step="0.01"
                            className="w-full rounded-lg border-gray-200 text-sm"
                            value={item.preco_unitario}
                            onChange={e => updateItem(index, 'preco_unitario', parseFloat(e.target.value))}
                          />
                        </div>
                        <div className="w-32">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Total</label>
                          <input
                            type="text"
                            disabled
                            className="w-full rounded-lg border-gray-200 bg-gray-100 text-sm font-bold text-gray-700"
                            value={item.total.toLocaleString()}
                          />
                        </div>
                      </div>
                    ))}
                    {formData.itens.length === 0 && (
                      <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed rounded-xl">
                        Nenhum item adicionado à compra.
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t pt-4 flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Subtotal:</span>
                      <span>{formData.subtotal.toLocaleString()} {user?.currency}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>IVA (14%):</span>
                      <span>{formData.iva.toLocaleString()} {user?.currency}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
                      <span>Total:</span>
                      <span className="text-emerald-600">{formData.total.toLocaleString()} {user?.currency}</span>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-6 py-2 border rounded-lg hover:bg-white bg-transparent"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="compra-form"
                disabled={formData.itens.length === 0}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 disabled:opacity-50"
              >
                Salvar Compra
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
