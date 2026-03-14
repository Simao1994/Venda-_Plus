import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Plus,
  Search,
  UserPlus,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Building2,
  Calendar,
  DollarSign,
  CheckCircle2,
  XCircle
} from 'lucide-react';

export default function Employees() {
  const { token, user } = useAuth();
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [search, setSearch] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    position: '',
    department_id: '',
    hire_date: new Date().toISOString().split('T')[0],
    salary_base: 0,
    food_allowance: 0,
    transport_allowance: 0,
    other_deductions: 0,
    is_service_provider: false,
    status: 'active'
  });


  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empRes, depRes] = await Promise.all([
        fetch('/api/hr/employees', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/hr/departments', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (!empRes.ok || !depRes.ok) {
        throw new Error('Erro ao carregar dados do RH');
      }

      const empData = await empRes.json();
      const depData = await depRes.json();
      setEmployees(Array.isArray(empData) ? empData : []);
      setDepartments(Array.isArray(depData) ? depData : []);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Erro ao carregar dados dos funcionários. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingEmployee ? `/api/hr/employees/${editingEmployee.id}` : '/api/hr/employees';
      const method = editingEmployee ? 'PUT' : 'POST';

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
        setEditingEmployee(null);
        fetchData();
        resetForm();
      }
    } catch (error) {
      console.error('Error saving employee:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este funcionário?')) return;
    try {
      const res = await fetch(`/api/hr/employees/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchData();
    } catch (error) {
      console.error('Error deleting employee:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      position: '',
      department_id: '',
      hire_date: new Date().toISOString().split('T')[0],
      salary_base: 0,
      food_allowance: 0,
      transport_allowance: 0,
      other_deductions: 0,
      is_service_provider: false,
      status: 'active'
    });
  };

  const handleEdit = (emp: any) => {
    setEditingEmployee(emp);
    setFormData({
      name: emp.name,
      email: emp.email || '',
      phone: emp.phone || '',
      address: emp.address || '',
      position: emp.position,
      department_id: emp.department_id || '',
      hire_date: emp.hire_date,
      salary_base: emp.salary_base,
      food_allowance: emp.food_allowance,
      transport_allowance: emp.transport_allowance,
      other_deductions: emp.other_deductions,
      is_service_provider: emp.is_service_provider === 1,
      status: emp.status
    });
    setShowModal(true);
  };

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(search.toLowerCase()) ||
    emp.position.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Funcionários</h2>
          <p className="text-gray-500">Gerencie sua equipe e informações salariais</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
        >
          <UserPlus size={20} />
          Novo Funcionário
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Pesquisar por nome ou cargo..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-bold">Funcionário</th>
                <th className="px-6 py-4 font-bold">Cargo / Depto</th>
                <th className="px-6 py-4 font-bold">Salário Base</th>
                <th className="px-6 py-4 font-bold">Tipo</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                        {emp.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{emp.name}</div>
                        <div className="text-xs text-gray-500">{emp.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{emp.position}</div>
                    <div className="text-xs text-gray-500">{emp.department_name || 'Sem departamento'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-gray-900">
                      {emp.salary_base.toLocaleString()} {user?.currency}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${emp.is_service_provider
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-blue-100 text-blue-700'
                      }`}>
                      {emp.is_service_provider ? 'Prestador' : 'Efetivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`flex items-center gap-1 text-xs font-bold ${emp.status === 'active' ? 'text-emerald-600' : 'text-gray-400'
                      }`}>
                      {emp.status === 'active' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                      {emp.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(emp)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(emp.id)}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        Excluir
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-gray-900">
                {editingEmployee ? 'Editar Funcionário' : 'Novo Funcionário'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingEmployee(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Nome Completo</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 rounded-xl border-gray-200 focus:ring-2 focus:ring-indigo-500"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Email</label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 rounded-xl border-gray-200 focus:ring-2 focus:ring-indigo-500"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Telefone</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-xl border-gray-200 focus:ring-2 focus:ring-indigo-500"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Cargo</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 rounded-xl border-gray-200 focus:ring-2 focus:ring-indigo-500"
                    value={formData.position}
                    onChange={e => setFormData({ ...formData, position: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Departamento</label>
                  <select
                    className="w-full px-4 py-3 rounded-xl border-gray-200 focus:ring-2 focus:ring-indigo-500"
                    value={formData.department_id}
                    onChange={e => setFormData({ ...formData, department_id: e.target.value })}
                  >
                    <option value="">Selecionar Departamento</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Data de Admissão</label>
                  <input
                    type="date"
                    required
                    className="w-full px-4 py-3 rounded-xl border-gray-200 focus:ring-2 focus:ring-indigo-500"
                    value={formData.hire_date}
                    onChange={e => setFormData({ ...formData, hire_date: e.target.value })}
                  />
                </div>
                {editingEmployee && (
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-gray-700">Status</label>
                    <select
                      className="w-full px-4 py-3 rounded-xl border-gray-200 focus:ring-2 focus:ring-indigo-500"
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="active">Ativo</option>
                      <option value="inactive">Inativo</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl space-y-4">
                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                  <DollarSign size={18} className="text-indigo-600" />
                  Informações Salariais
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Salário Base</label>
                    <input
                      type="number"
                      required
                      className="w-full px-4 py-2 rounded-lg border-gray-200"
                      value={formData.salary_base}
                      onChange={e => setFormData({ ...formData, salary_base: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Sub. Alimentação</label>
                    <input
                      type="number"
                      className="w-full px-4 py-2 rounded-lg border-gray-200"
                      value={formData.food_allowance}
                      onChange={e => setFormData({ ...formData, food_allowance: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Sub. Transporte</label>
                    <input
                      type="number"
                      className="w-full px-4 py-2 rounded-lg border-gray-200"
                      value={formData.transport_allowance}
                      onChange={e => setFormData({ ...formData, transport_allowance: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Outros Descontos</label>
                    <input
                      type="number"
                      className="w-full px-4 py-2 rounded-lg border-gray-200"
                      value={formData.other_deductions}
                      onChange={e => setFormData({ ...formData, other_deductions: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_service_provider"
                    className="w-4 h-4 text-indigo-600 rounded"
                    checked={formData.is_service_provider}
                    onChange={e => setFormData({ ...formData, is_service_provider: e.target.checked })}
                  />
                  <label htmlFor="is_service_provider" className="text-sm font-bold text-gray-700">
                    Prestador de Serviço (Imposto Único 6.5%)
                  </label>
                </div>
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
                  Salvar Funcionário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
