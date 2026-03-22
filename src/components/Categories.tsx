import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Trash2, Tag, Search, Pencil } from 'lucide-react';

export default function Categories() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
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
    const res = await fetch(editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories', {
      method: editingCategory ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ name: newName })
    });

    if (res.ok) {
      setShowModal(false);
      setNewName('');
      setEditingCategory(null);
      fetchCategories();
    } else {
      const data = await res.json();
      setError(data.error || `Erro ao ${editingCategory ? 'editar' : 'criar'} categoria`);
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

  const openEditModal = (cat: any) => {
    setEditingCategory(cat);
    setNewName(cat.name);
    setShowModal(true);
  };

  const openNewModal = () => {
    setEditingCategory(null);
    setNewName('');
    setShowModal(true);
  };

  return (
    <div className="p-8 space-y-10 relative">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10 text-left">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter italic uppercase">
            Sector <span className="text-gold-gradient">Classification</span>
          </h1>
          <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mt-2">Inventory grouping & structural taxonomy</p>
        </div>
        <button
          onClick={openNewModal}
          className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-gold-primary to-gold-secondary text-bg-deep rounded-2xl text-[10px] font-black uppercase tracking-widest hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] transition-all shadow-2xl"
        >
          <Plus size={18} />
          Initialize Sector
        </button>
      </div>

      <div className="glass-panel rounded-3xl border border-white/5 overflow-hidden shadow-2xl relative z-10">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead className="bg-white/[0.02] text-gold-primary/40 text-[9px] uppercase tracking-[0.3em] border-b border-white/5 font-black">
              <tr>
                <th className="px-8 py-5">Classification Identifier</th>
                <th className="px-8 py-5 text-right">Control Protocol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-left">
              {loading ? (
                <tr>
                  <td colSpan={2} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-10 h-10 border-2 border-gold-primary/20 border-t-gold-primary rounded-full animate-spin"></div>
                      <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Synchronizing Taxonomy...</p>
                    </div>
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-8 py-20 text-center opacity-20">
                    <Tag size={48} className="mx-auto mb-4 text-white" />
                    <p className="text-[10px] font-black text-white uppercase tracking-[0.3em]">No registry sectors detected</p>
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white/20 group-hover:text-gold-primary/40 transition-colors border border-white/5">
                          <Tag size={18} />
                        </div>
                        <span className="font-black text-white uppercase tracking-tight group-hover:text-gold-primary transition-colors text-xs">{cat.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-3 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={() => openEditModal(cat)}
                          className="p-3 text-white/40 hover:text-gold-primary bg-white/5 hover:bg-gold-primary/10 rounded-xl transition-all border border-transparent hover:border-gold-primary/30"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id)}
                          className="p-3 text-white/40 hover:text-red-500 bg-white/5 hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-500/30"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-bg-deep/80 backdrop-blur-xl flex items-center justify-center z-[110] p-4 text-left">
          <div className="glass-panel rounded-[40px] w-full max-w-md overflow-hidden shadow-2xl border border-white/10 relative">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-gold-primary/40 to-transparent" />

            <div className="p-8 border-b border-white/5 bg-gold-primary/[0.02] flex justify-between items-center text-left">
              <div>
                <h3 className="text-xl font-black text-white italic uppercase tracking-widest text-left">
                  {editingCategory ? 'Sector Modification' : 'Sector Initialization'}
                </h3>
                <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] text-left mt-2">Structural grouping vector</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/40">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 space-y-6">
              {error && (
                <div className="p-5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-[10px] font-black uppercase tracking-widest animate-in fade-in">
                  Protocol Error: {error}
                </div>
              )}
              <div className="text-left">
                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-3 text-left">Sector Denomination</label>
                <div className="glass-panel p-4 rounded-2xl border border-white/5 focus-within:border-gold-primary/30 transition-all">
                  <input
                    required
                    autoFocus
                    type="text"
                    className="w-full bg-transparent border-none outline-none font-black text-white uppercase tracking-tight text-left"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="ENTER CLASSIFICATION..."
                  />
                </div>
              </div>

              <div className="pt-6 flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white/30 border border-white/5 hover:bg-white/5 transition-all"
                >
                  Terminate
                </button>
                <button
                  type="submit"
                  className="flex-1 py-5 bg-gradient-to-r from-gold-primary to-gold-secondary text-bg-deep rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] transition-all shadow-xl"
                >
                  {editingCategory ? 'Update Sector' : 'Inject Sector'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
