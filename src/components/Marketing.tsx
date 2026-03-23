import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Trash2, Megaphone, Image as ImageIcon, Type, FileText, X, CheckCircle2, Edit } from 'lucide-react';

export default function Marketing() {
  const { token, user } = useAuth();
  const [publications, setPublications] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image: '',
    type: 'news',
    start_date: new Date().toISOString().split('T')[0],
    end_date: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/public/publications');
      const data = await res.json();
      // Filter only current company publications
      setPublications(data.filter((p: any) => p.company_id === user?.company_id));
    } catch (error) {
      console.error('Erro ao buscar publicações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingId ? `/api/publications/${editingId}` : '/api/publications';
    const method = editingId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      alert(editingId ? 'Actualizado com sucesso!' : 'Publicado com sucesso!');
      setShowModal(false);
      setEditingId(null);
      setFormData({
        title: '',
        content: '',
        image: '',
        type: 'news',
        start_date: new Date().toISOString().split('T')[0],
        end_date: ''
      });
      fetchData();
    } else {
      const err = await res.json();
      alert('Erro ao publicar: ' + (err.error || 'Erro desconhecido'));
    }
  };

  const handleEdit = (pub: any) => {
    setEditingId(pub.id);
    setFormData({
      title: pub.title || '',
      content: pub.content || '',
      image: pub.image || '',
      type: pub.type || 'news',
      start_date: pub.start_date ? new Date(pub.start_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      end_date: pub.end_date ? new Date(pub.end_date).toISOString().split('T')[0] : ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      title: '',
      content: '',
      image: '',
      type: 'news',
      start_date: new Date().toISOString().split('T')[0],
      end_date: ''
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja eliminar esta publicação?')) return;
    const res = await fetch(`/api/publications/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      fetchData();
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketing & Publicidade</h1>
          <p className="text-gray-500 font-medium">Faça publicações para o <span className="text-emerald-600 font-bold">Venda Plus Mercado</span> e alcance mais clientes.</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({
              title: '',
              content: '',
              image: '',
              type: 'news',
              start_date: new Date().toISOString().split('T')[0],
              end_date: ''
            });
            setShowModal(true);
          }}
          className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-200"
        >
          <Plus size={20} />
          Nova Publicação
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {publications.map(pub => (
          <div key={pub.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden group">
            {pub.image && (
              <div className="aspect-video relative overflow-hidden">
                <img src={pub.image} alt={pub.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute top-4 right-4">
                  <span className="px-3 py-1 bg-white/90 backdrop-blur rounded-lg text-[10px] font-black uppercase tracking-widest text-gray-900">
                    {pub.type}
                  </span>
                </div>
              </div>
            )}
            <div className="p-6">
              <h3 className="text-lg font-black text-gray-900 mb-2">{pub.title}</h3>
              <p className="text-gray-500 text-sm line-clamp-3 mb-6">{pub.content}</p>

              <div className="flex justify-between items-center pt-6 border-t border-gray-50">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Criado: {new Date(pub.created_at).toLocaleDateString()}
                  </span>
                  {(pub.start_date || pub.end_date) && (
                    <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-tighter">
                      Período: {pub.start_date ? new Date(pub.start_date).toLocaleDateString() : 'Imediato'} - {pub.end_date ? new Date(pub.end_date).toLocaleDateString() : 'Permanente'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(pub)}
                    className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all"
                    title="Editar"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(pub.id)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    title="Eliminar"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {publications.length === 0 && !loading && (
          <div className="col-span-full py-20 text-center bg-white rounded-[40px] border-2 border-dashed border-gray-100">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
              <Megaphone size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Nenhuma publicação ainda</h3>
            <p className="text-gray-500 max-w-xs mx-auto">Comece a publicar ofertas e novidades para atrair mais clientes para o seu negócio.</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white text-gray-900 rounded-[32px] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b flex justify-between items-center shrink-0">
              <h3 className="text-xl font-black text-gray-900">
                {editingId ? 'Editar Publicação' : 'Criar Publicação'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Tipo de Publicação</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'news', label: 'Novidade' },
                      { id: 'promo', label: 'Promoção' },
                      { id: 'product', label: 'Produto' },
                    ].map(type => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, type: type.id })}
                        className={`py-3 rounded-xl font-bold text-sm border-2 transition-all ${formData.type === type.id
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                          : 'border-gray-100 text-gray-500 hover:border-gray-200'
                          }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Título</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Grande Promoção de Fim de Semana"
                    className="w-full px-4 py-3 rounded-xl border-gray-200 focus:ring-2 focus:ring-emerald-500 font-bold"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Conteúdo / Descrição</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Descreva o que você quer anunciar..."
                    className="w-full px-4 py-3 rounded-xl border-gray-200 focus:ring-2 focus:ring-emerald-500 font-bold"
                    value={formData.content}
                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Data de Início</label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 rounded-xl border-gray-200 focus:ring-2 focus:ring-emerald-500 font-bold"
                      value={formData.start_date}
                      onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Data de Fim</label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 rounded-xl border-gray-200 focus:ring-2 focus:ring-emerald-500 font-bold"
                      value={formData.end_date}
                      onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Imagem (Opcional)</label>
                  <div className="flex items-center gap-4">
                    <label className="flex-1 cursor-pointer border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center hover:bg-gray-50 transition-all group">
                      <ImageIcon className="text-gray-300 group-hover:text-emerald-500 mb-2" size={32} />
                      <span className="text-sm font-bold text-gray-400 group-hover:text-emerald-600">Carregar Imagem</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    </label>
                    {formData.image && (
                      <div className="w-32 h-32 rounded-2xl overflow-hidden border relative group">
                        <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, image: '' })}
                          className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-4 border rounded-2xl font-bold text-gray-500 hover:bg-gray-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all"
                >
                  {editingId ? 'Guardar Alterações' : 'Publicar Agora'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
