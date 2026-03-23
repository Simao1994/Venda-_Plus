import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Building2, Search, MoreVertical, XCircle, Edit2, Trash2 } from 'lucide-react';

export default function Departments() {
  const { token } = useAuth();
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/hr/departments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setDepartments(data);
    } catch (error) {
      console.error('Error fetching departments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingDept ? `/api/hr/departments/${editingDept.id}` : '/api/hr/departments';
      const method = editingDept ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowModal(false);
        setEditingDept(null);
        setFormData({ name: '', description: '' });
        fetchDepartments();
      }
    } catch (error) {
      console.error('Error saving department:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este departamento?')) return;
    try {
      const res = await fetch(`/api/hr/departments/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchDepartments();
    } catch (error) {
      console.error('Error deleting department:', error);
    }
  };

  const handleEdit = (dept: any) => {
    setEditingDept(dept);
    setFormData({ name: dept.name, description: dept.description || '' });
    setShowModal(true);
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto relative z-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Departamentos</h2>
          <p className="text-white/30 font-black text-[10px] uppercase tracking-[0.3em] mt-2 italic">Organize sua empresa por setores</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-indigo-500/20 text-indigo-400 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 border border-indigo-500/30 hover:bg-indigo-500/30 transition-all shadow-[0_0_20px_rgba(99,102,241,0.1)]"
        >
          <Plus size={20} />
          Novo Departamento
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((dept) => (
          <div key={dept.id} className="glass-panel p-6 rounded-[2rem] border border-white/5 hover:border-indigo-500/20 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center border border-indigo-500/20 group-hover:bg-indigo-500/20 transition-colors">
                <Building2 size={24} />
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => handleEdit(dept)}
                  className="p-2 text-white/20 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                  title="Editar"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(dept.id)}
                  className="p-2 text-white/20 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                  title="Excluir"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <h3 className="text-lg font-bold text-white mb-1">{dept.name}</h3>
            <p className="text-sm text-white/30 mb-4 line-clamp-2">{dept.description || 'Sem descrição.'}</p>
            <div className="pt-4 border-t border-white/5 flex justify-between items-center">
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                Ativo
              </span>
              <button className="text-xs font-bold text-white/20 hover:text-indigo-400 transition-colors">Ver Funcionários</button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-panel rounded-[2rem] shadow-2xl w-full max-w-md border border-white/10">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">
                {editingDept ? 'Editar Departamento' : 'Novo Departamento'}
              </h3>
              <button 
                onClick={() => {
                  setShowModal(false);
                  setEditingDept(null);
                  setFormData({ name: '', description: '' });
                }}
                className="text-white/30 hover:text-white/60 transition-colors"
              >
                <XCircle size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Nome do Departamento</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-white/20"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Descrição</label>
                <textarea 
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-white/20"
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 rounded-xl font-bold border border-white/10 text-white/40 hover:bg-white/5 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-6 py-3 rounded-xl font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/30 transition-all shadow-[0_0_20px_rgba(99,102,241,0.1)]"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
