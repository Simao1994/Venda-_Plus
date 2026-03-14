import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Search, FileSignature, CheckCircle2, Clock, Camera, Trash2, PlusCircle, X } from 'lucide-react';

export default function Receitas() {
  const { token } = useAuth();
  const [receitas, setReceitas] = useState<any[]>([]);
  const [medicamentos, setMedicamentos] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    paciente_nome: '',
    medico_nome: '',
    numero_ordem_medico: '',
    hospital: '',
    data_receita: '',
    imagem_receita: '',
    itens: [] as { medicamento_id: number; quantidade: number; nome?: string }[]
  });

  useEffect(() => {
    fetchData();
    fetchMedicamentos();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/farmacia/receitas', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setReceitas(data);
    } finally {
      setLoading(false);
    }
  };

  const fetchMedicamentos = async () => {
    try {
      const res = await fetch('/api/farmacia/medicamentos', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setMedicamentos(data);
    } catch (error) {
      console.error('Erro ao buscar medicamentos:', error);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, imagem_receita: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      itens: [...formData.itens, { medicamento_id: 0, quantidade: 1 }]
    });
  };

  const removeItem = (index: number) => {
    const newItens = [...formData.itens];
    newItens.splice(index, 1);
    setFormData({ ...formData, itens: newItens });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItens = [...formData.itens];
    newItens[index] = { ...newItens[index], [field]: value };
    setFormData({ ...formData, itens: newItens });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.itens.length === 0) {
      alert('Adicione pelo menos um medicamento à receita.');
      return;
    }
    const res = await fetch('/api/farmacia/receitas', {
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
        paciente_nome: '', 
        medico_nome: '', 
        numero_ordem_medico: '', 
        hospital: '', 
        data_receita: '', 
        imagem_receita: '',
        itens: []
      });
      fetchData();
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Receitas Médicas</h1>
          <p className="text-gray-500">Gestão e validação de prescrições.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-200"
        >
          <Plus size={20} />
          Registar Receita
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Pesquisar por paciente ou médico..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border-gray-200 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">Paciente</th>
                <th className="px-6 py-4 font-medium">Médico / Hospital</th>
                <th className="px-6 py-4 font-medium">Data Receita</th>
                <th className="px-6 py-4 font-medium text-center">Estado</th>
                <th className="px-6 py-4 font-medium text-right">Acções</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {receitas.map(receita => (
                <tr key={receita.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600">
                        <FileSignature size={20} />
                      </div>
                      <div className="font-bold text-gray-900">{receita.paciente_nome}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">Dr(a). {receita.medico_nome}</div>
                    <div className="text-xs text-gray-500">{receita.hospital} • Ordem: {receita.numero_ordem_medico}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(receita.data_receita).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {receita.status === 'pendente' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-[10px] font-bold uppercase">
                        <Clock size={12} /> Pendente
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold uppercase">
                        <CheckCircle2 size={12} /> Aviada
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-emerald-600 font-medium text-sm hover:text-emerald-700">
                      Ver Detalhes
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
          <div className="bg-white rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b flex justify-between items-center shrink-0">
              <h3 className="text-xl font-bold text-gray-900">Registar Receita Médica</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Paciente</label>
                  <input
                    type="text"
                    required
                    className="w-full rounded-lg border-gray-200 focus:ring-emerald-500 focus:border-emerald-500"
                    value={formData.paciente_nome}
                    onChange={e => setFormData({ ...formData, paciente_nome: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Médico</label>
                  <input
                    type="text"
                    required
                    className="w-full rounded-lg border-gray-200 focus:ring-emerald-500 focus:border-emerald-500"
                    value={formData.medico_nome}
                    onChange={e => setFormData({ ...formData, medico_nome: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nº Ordem dos Médicos</label>
                  <input
                    type="text"
                    className="w-full rounded-lg border-gray-200 focus:ring-emerald-500 focus:border-emerald-500"
                    value={formData.numero_ordem_medico}
                    onChange={e => setFormData({ ...formData, numero_ordem_medico: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hospital / Clínica</label>
                  <input
                    type="text"
                    className="w-full rounded-lg border-gray-200 focus:ring-emerald-500 focus:border-emerald-500"
                    value={formData.hospital}
                    onChange={e => setFormData({ ...formData, hospital: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data da Receita</label>
                  <input
                    type="date"
                    required
                    className="w-full rounded-lg border-gray-200 focus:ring-emerald-500 focus:border-emerald-500"
                    value={formData.data_receita}
                    onChange={e => setFormData({ ...formData, data_receita: e.target.value })}
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Imagem da Receita</label>
                <div className="flex items-center gap-4">
                  <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                    <Camera size={18} />
                    <span>Carregar Foto</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </label>
                  {formData.imagem_receita && (
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden border">
                      <img src={formData.imagem_receita} alt="Receita" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => setFormData({ ...formData, imagem_receita: '' })}
                        className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl-lg"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Medications List */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-gray-900">Medicamentos Prescritos</h4>
                  <button
                    type="button"
                    onClick={addItem}
                    className="text-emerald-600 flex items-center gap-1 text-sm font-bold hover:text-emerald-700"
                  >
                    <PlusCircle size={18} />
                    Adicionar Medicamento
                  </button>
                </div>
                
                <div className="space-y-3">
                  {formData.itens.map((item, index) => (
                    <div key={index} className="flex gap-3 items-end bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <div className="flex-1">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Medicamento</label>
                        <select
                          required
                          className="w-full rounded-lg border-gray-200 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                          value={item.medicamento_id}
                          onChange={e => updateItem(index, 'medicamento_id', parseInt(e.target.value))}
                        >
                          <option value="">Seleccione...</option>
                          {medicamentos.map(m => (
                            <option key={m.id} value={m.id}>{m.nome} ({m.dosagem})</option>
                          ))}
                        </select>
                      </div>
                      <div className="w-24">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Qtd</label>
                        <input
                          type="number"
                          min="1"
                          required
                          className="w-full rounded-lg border-gray-200 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                          value={item.quantidade}
                          onChange={e => updateItem(index, 'quantidade', parseInt(e.target.value))}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  {formData.itens.length === 0 && (
                    <div className="text-center py-6 border-2 border-dashed border-gray-100 rounded-2xl text-gray-400 text-sm">
                      Nenhum medicamento adicionado.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border rounded-lg hover:bg-gray-50 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200"
                >
                  Salvar Receita
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
