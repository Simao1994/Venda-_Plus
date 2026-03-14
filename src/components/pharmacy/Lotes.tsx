import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Search, Calendar, Boxes, AlertCircle, Trash2 } from 'lucide-react';

export default function Lotes() {
  const { token } = useAuth();
  const [lotes, setLotes] = useState<any[]>([]);
  const [medicamentos, setMedicamentos] = useState<any[]>([]);
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    medicamento_id: '',
    numero_lote: '',
    data_fabricacao: '',
    data_validade: '',
    quantidade_inicial: '',
    fornecedor_id: '',
    custo_unitario: '',
    localizacao_armazenamento: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [lotesRes, medsRes, fornecRes] = await Promise.all([
        fetch('/api/farmacia/lotes', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/farmacia/medicamentos', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/farmacia/fornecedores', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const [lotesData, medsData, fornecData] = await Promise.all([
        lotesRes.json(),
        medsRes.json(),
        fornecRes.json()
      ]);

      setLotes(lotesData);
      setMedicamentos(medsData);
      setFornecedores(fornecData);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/farmacia/lotes', {
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
        medicamento_id: '', numero_lote: '', data_fabricacao: '',
        data_validade: '', quantidade_inicial: '', fornecedor_id: '',
        custo_unitario: '', localizacao_armazenamento: ''
      });
      fetchData();
    }
  };

  const isExpired = (date: string) => new Date(date) < new Date();
  const isExpiringSoon = (date: string) => {
    const ninetyDays = 90 * 24 * 60 * 60 * 1000;
    const diff = new Date(date).getTime() - new Date().getTime();
    return diff > 0 && diff < ninetyDays;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Lotes & Validades</h1>
          <p className="text-gray-500">Controle de entrada de medicamentos e controlo de expiração.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-200"
        >
          <Plus size={20} />
          Registrar Novo Lote
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Pesquisar por lote ou medicamento..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border-gray-200 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">Medicamento / Lote</th>
                <th className="px-6 py-4 font-medium text-center">Data Validade</th>
                <th className="px-6 py-4 font-medium text-center">Quantidade</th>
                <th className="px-6 py-4 font-medium">Fornecedor</th>
                <th className="px-6 py-4 font-medium text-center">Estado</th>
                <th className="px-6 py-4 font-medium text-right">Acções</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lotes.map(lote => (
                <tr key={lote.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                        <Boxes size={20} />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{lote.nome_medicamento}</div>
                        <div className="text-xs text-gray-500 font-mono">Lote: {lote.numero_lote}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className={`text-sm font-bold ${isExpired(lote.data_validade) ? 'text-red-600' : isExpiringSoon(lote.data_validade) ? 'text-amber-600' : 'text-gray-900'}`}>
                      {new Date(lote.data_validade).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="text-sm font-bold text-gray-900">{lote.quantidade_atual}</div>
                    <div className="text-[10px] text-gray-400">inicial: {lote.quantidade_inicial}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {lote.fornecedor_nome || '---'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {isExpired(lote.data_validade) ? (
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-bold uppercase">Expirado</span>
                    ) : isExpiringSoon(lote.data_validade) ? (
                      <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold uppercase">Breve</span>
                    ) : (
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold uppercase">Ok</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={16} />
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
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center text-gray-900">
              <h3 className="text-xl font-bold">Entrada de Lote de Medicamentos</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Medicamento</label>
                <select
                  required
                  className="w-full rounded-lg border-gray-200 focus:ring-emerald-500 focus:border-emerald-500"
                  value={formData.medicamento_id}
                  onChange={e => setFormData({ ...formData, medicamento_id: e.target.value })}
                >
                  <option value="">Selecione o medicamento...</option>
                  {medicamentos.map(m => (
                    <option key={m.id} value={m.id}>{m.nome_medicamento}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número do Lote</label>
                <input
                  type="text"
                  required
                  className="w-full rounded-lg border-gray-200 focus:ring-emerald-500 focus:border-emerald-500"
                  value={formData.numero_lote}
                  onChange={e => setFormData({ ...formData, numero_lote: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fornecedor</label>
                <select
                  className="w-full rounded-lg border-gray-200 focus:ring-emerald-500 focus:border-emerald-500"
                  value={formData.fornecedor_id}
                  onChange={e => setFormData({ ...formData, fornecedor_id: e.target.value })}
                >
                  <option value="">Selecione o fornecedor...</option>
                  {fornecedores.map(f => (
                    <option key={f.id} value={f.id}>{f.nome_empresa}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Fabricação</label>
                <input
                  type="date"
                  className="w-full rounded-lg border-gray-200 focus:ring-emerald-500 focus:border-emerald-500"
                  value={formData.data_fabricacao}
                  onChange={e => setFormData({ ...formData, data_fabricacao: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Validade</label>
                <input
                  type="date"
                  required
                  className="w-full rounded-lg border-gray-200 focus:ring-emerald-500 focus:border-emerald-500"
                  value={formData.data_validade}
                  onChange={e => setFormData({ ...formData, data_validade: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade Inicial</label>
                <input
                  type="number"
                  required
                  min="1"
                  className="w-full rounded-lg border-gray-200 focus:ring-emerald-500 focus:border-emerald-500"
                  value={formData.quantidade_inicial}
                  onChange={e => setFormData({ ...formData, quantidade_inicial: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Custo Unitário</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full rounded-lg border-gray-200 focus:ring-emerald-500 focus:border-emerald-500"
                  value={formData.custo_unitario}
                  onChange={e => setFormData({ ...formData, custo_unitario: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Localização no Armazém</label>
                <input
                  type="text"
                  placeholder="Ex: Corredor A, Prateleira 4"
                  className="w-full rounded-lg border-gray-200 focus:ring-emerald-500 focus:border-emerald-500"
                  value={formData.localizacao_armazenamento}
                  onChange={e => setFormData({ ...formData, localizacao_armazenamento: e.target.value })}
                />
              </div>
              <div className="col-span-2 flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border rounded-lg hover:bg-gray-50 text-gray-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200"
                >
                  Confirmar Entrada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
