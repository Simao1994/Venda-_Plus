import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Trash2, Tag, Search } from 'lucide-react';

export default function Categories() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const res = await fetch('/api/categories', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      setCategories(await res.json());
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ name: newName })
    });

    if (res.ok) {
      setShowModal(false);
      setNewName('');
      fetchCategories();
    } else {
      const data = await res.json();
      setError(data.error || 'Erro ao criar categoria');
    }
  };


  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return;
    const res = await fetch(`/api/categories/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      fetchCategories();
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Categorias</h1>
          <p className="text-gray-500 font-medium">Organize os seus produtos por grupos para facilitar a gestão.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-gray-900 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-black shadow-lg shadow-gray-100 transition-all active:scale-95"
        >
          <Plus size={18} />
          Nova Categoria
        </button>
      </header>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <th className="px-8 py-4">Nome da Categoria</th>
                <th className="px-8 py-4 text-right">Acções</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                        <Tag size={16} />
                      </div>
                      <span className="font-bold text-gray-900">{cat.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors p-2"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && !loading && (
                <tr>
                  <td colSpan={2} className="px-8 py-20 text-center text-gray-400 font-bold uppercase text-xs tracking-widest">
                    Nenhuma categoria registada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-8 border-b bg-gray-50/50">
              <h3 className="text-xl font-black text-gray-900 tracking-tight">Nova Categoria</h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Defina um nome para o novo grupo</p>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-4">
              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-red-100 italic">
                  Erro: {error}
                </div>
              )}
              <div>

                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Nome da Categoria</label>
                <input
                  required
                  autoFocus
                  type="text"
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-gray-900"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>

              <div className="pt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-4 border border-gray-100 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95"
                >
                  Guardar Categoria
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
