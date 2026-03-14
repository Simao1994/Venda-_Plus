import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Search, Edit2, Trash2, Truck } from 'lucide-react';

export default function Fornecedores() {
  const { token } = useAuth();
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    nome_empresa: '',
    nif: '',
    telefone: '',
    email: '',
    endereco: '',
    licenca_sanitaria: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/farmacia/fornecedores', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setFornecedores(data);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/farmacia/fornecedores', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      setShowModal(false);
      setFormData({ nome_empresa: '', nif: '', telefone: '', email: '', endereco: '', licenca_sanitaria: '' });
      fetchData();
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fornecedores Farmacêuticos</h1>
          <p className="text-gray-500">Gestão de laboratórios e distribuidores.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-200"
        >
          <Plus size={20} />
          Novo Fornecedor
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Pesquisar fornecedores..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border-gray-200 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">Fornecedor</th>
                <th className="px-6 py-4 font-medium">Contactos</th>
                <th className="px-6 py-4 font-medium">Licença Sanitária</th>
                <th className="px-6 py-4 font-medium text-center">Status</th>
                <th className="px-6 py-4 font-medium text-right">Acções</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {fornecedores.map(forn => (
                <tr key={forn.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                        <Truck size={20} />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{forn.nome_empresa}</div>
                        <div className="text-xs text-gray-500">NIF: {forn.nif}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{forn.telefone}</div>
                    <div className="text-xs text-gray-500">{forn.email}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{forn.licenca_sanitaria || '-'}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold uppercase">
                      {forn.status}
                    </span>
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
              <h3 className="text-xl font-bold text-gray-900">Novo Fornecedor</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Empresa</label>
                <input
                  type="text"
                  required
                  className="w-full rounded-lg border-gray-200 focus:ring-emerald-500 focus:border-emerald-500"
                  value={formData.nome_empresa}
                  onChange={e => setFormData({ ...formData, nome_empresa: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">NIF</label>
                <input
                  type="text"
                  className="w-full rounded-lg border-gray-200 focus:ring-emerald-500 focus:border-emerald-500"
                  value={formData.nif}
                  onChange={e => setFormData({ ...formData, nif: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Licença Sanitária</label>
                <input
                  type="text"
                  className="w-full rounded-lg border-gray-200 focus:ring-emerald-500 focus:border-emerald-500"
                  value={formData.licenca_sanitaria}
                  onChange={e => setFormData({ ...formData, licenca_sanitaria: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <input
                  type="text"
                  className="w-full rounded-lg border-gray-200 focus:ring-emerald-500 focus:border-emerald-500"
                  value={formData.telefone}
                  onChange={e => setFormData({ ...formData, telefone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full rounded-lg border-gray-200 focus:ring-emerald-500 focus:border-emerald-500"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                <input
                  type="text"
                  className="w-full rounded-lg border-gray-200 focus:ring-emerald-500 focus:border-emerald-500"
                  value={formData.endereco}
                  onChange={e => setFormData({ ...formData, endereco: e.target.value })}
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
                  Salvar Fornecedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
