import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Building2, Search, MoreVertical, XCircle } from 'lucide-react';

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
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Departamentos</h2>
          <p className="text-gray-500">Organize sua empresa por setores</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
        >
          <Plus size={20} />
          Novo Departamento
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((dept) => (
          <div key={dept.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Building2 size={24} />
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => handleEdit(dept)}
                  className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Editar"
                >
                  <Plus size={18} className="rotate-45" /> {/* Using Plus rotated as a simple edit icon or just text */}
                  <span className="sr-only">Editar</span>
                </button>
                <button 
                  onClick={() => handleDelete(dept.id)}
                  className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Excluir"
                >
                  <XCircle size={18} />
                </button>
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">{dept.name}</h3>
            <p className="text-sm text-gray-500 mb-4 line-clamp-2">{dept.description || 'Sem descrição.'}</p>
            <div className="pt-4 border-t flex justify-between items-center">
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                Ativo
              </span>
              <button className="text-xs font-bold text-gray-400 hover:text-indigo-600">Ver Funcionários</button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">
                {editingDept ? 'Editar Departamento' : 'Novo Departamento'}
              </h3>
              <button 
                onClick={() => {
                  setShowModal(false);
                  setEditingDept(null);
                  setFormData({ name: '', description: '' });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-700">Nome do Departamento</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-3 rounded-xl border-gray-200 focus:ring-2 focus:ring-indigo-500"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-700">Descrição</label>
                <textarea 
                  className="w-full px-4 py-3 rounded-xl border-gray-200 focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 rounded-xl font-bold border border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-6 py-3 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200"
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
