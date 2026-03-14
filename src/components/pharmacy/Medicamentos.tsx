import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Search, Edit2, Trash2, Pill, Filter } from 'lucide-react';

export default function Medicamentos() {
  const { token, user } = useAuth();
  const [medicamentos, setMedicamentos] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    nome_medicamento: '',
    nome_generico: '',
    codigo_barras: '',
    categoria_terapeutica: '',
    forma_farmaceutica: '',
    dosagem: '',
    laboratorio: '',
    necessita_receita: false,
    preco_compra: '',
    preco_venda: '',
    estoque_minimo: '5',
    iva: '14',
    temperatura_armazenamento: '25'
  });


  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/farmacia/medicamentos', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setMedicamentos(data);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/farmacia/medicamentos', {
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
        nome_medicamento: '', nome_generico: '', codigo_barras: '', categoria_terapeutica: '',
        forma_farmaceutica: '', dosagem: '', laboratorio: '', necessita_receita: false,
        preco_venda: '', preco_compra: '', estoque_minimo: '5', iva: '14', temperatura_armazenamento: '25'
      });

      fetchData();
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Medicamentos</h1>
          <p className="text-gray-500">Controle o seu catálogo farmacêutico.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-200"
        >
          <Plus size={20} />
          Novo Medicamento
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Pesquisar medicamentos..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border-gray-200 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">Medicamento</th>
                <th className="px-6 py-4 font-medium">Categoria</th>
                <th className="px-6 py-4 font-medium text-right">Preço Venda</th>
                <th className="px-6 py-4 font-medium text-center">Stock Total</th>
                <th className="px-6 py-4 font-medium text-center">Receita</th>
                <th className="px-6 py-4 font-medium text-right">Acções</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {medicamentos.map(med => (
                <tr key={med.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                        <Pill size={20} />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{med.nome_medicamento}</div>
                        <div className="text-xs text-gray-500">{med.dosagem} • {med.forma_farmaceutica}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{med.categoria_terapeutica}</td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">
                    {med.preco_venda.toLocaleString()} {user?.currency}
                  </td>
                  <td className="px-6 py-4 text-sm text-center">
                    <span className={`font-mono font-bold ${med.stock_total <= med.estoque_minimo ? 'text-red-600' : 'text-emerald-600'}`}>
                      {med.stock_total}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {med.necessita_receita ? (
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-bold uppercase">Obrigatória</span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] font-bold uppercase">Livre</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
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

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Novo Medicamento</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Medicamento</label>
                <input
                  type="text"
                  required
                  className="w-full rounded-lg border-gray-200 focus:ring-emerald-500 focus:border-emerald-500"
                  value={formData.nome_medicamento}
                  onChange={e => setFormData({ ...formData, nome_medicamento: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Princípio Ativo (Genérico)</label>
                <input
                  type="text"
                  className="w-full rounded-lg border-gray-200 focus:ring-emerald-500 focus:border-emerald-500"
                  value={formData.nome_generico}
                  onChange={e => setFormData({ ...formData, nome_generico: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código de Barras</label>
                <input
                  type="text"
                  className="w-full rounded-lg border-gray-200 focus:ring-emerald-500 focus:border-emerald-500"
                  value={formData.codigo_barras}
                  onChange={e => setFormData({ ...formData, codigo_barras: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria Terapêutica</label>
                <input
                  type="text"
                  className="w-full rounded-lg border-gray-200 focus:ring-emerald-500 focus:border-emerald-500"
                  value={formData.categoria_terapeutica}
                  onChange={e => setFormData({ ...formData, categoria_terapeutica: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Forma Farmacêutica</label>
                <select
                  className="w-full rounded-lg border-gray-200 focus:ring-emerald-500 focus:border-emerald-500"
                  value={formData.forma_farmaceutica}
                  onChange={e => setFormData({ ...formData, forma_farmaceutica: e.target.value })}
                >
                  <option value="">Selecione...</option>
                  <option value="Comprimido">Comprimido</option>
                  <option value="Cápsula">Cápsula</option>
                  <option value="Xarope">Xarope</option>
                  <option value="Injetável">Injetável</option>
                  <option value="Pomada">Pomada</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dosagem</label>
                <input
                  type="text"
                  placeholder="Ex: 500mg"
                  className="w-full rounded-lg border-gray-200 focus:ring-emerald-500 focus:border-emerald-500"
                  value={formData.dosagem}
                  onChange={e => setFormData({ ...formData, dosagem: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preço de Venda</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="w-full rounded-lg border-gray-200 focus:ring-emerald-500 focus:border-emerald-500"
                  value={formData.preco_venda}
                  onChange={e => setFormData({ ...formData, preco_venda: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preço de Compra</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full rounded-lg border-gray-200 focus:ring-emerald-500 focus:border-emerald-500"
                  value={formData.preco_compra}
                  onChange={e => setFormData({ ...formData, preco_compra: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IVA (%)</label>
                <input
                  type="number"
                  className="w-full rounded-lg border-gray-200 focus:ring-emerald-500 focus:border-emerald-500"
                  value={formData.iva}
                  onChange={e => setFormData({ ...formData, iva: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Temp. Armazenamento (°C)</label>
                <input
                  type="number"
                  className="w-full rounded-lg border-gray-200 focus:ring-emerald-500 focus:border-emerald-500"
                  value={formData.temperatura_armazenamento}
                  onChange={e => setFormData({ ...formData, temperatura_armazenamento: e.target.value })}
                />
              </div>

              <div className="col-span-2 flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="necessita_receita"
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  checked={formData.necessita_receita}
                  onChange={e => setFormData({ ...formData, necessita_receita: e.target.checked })}
                />
                <label htmlFor="necessita_receita" className="text-sm font-medium text-gray-700">
                  Exige Receita Médica Obrigatória
                </label>
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
                  Salvar Medicamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
