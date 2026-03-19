// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  UserPlus, Search, Edit2, Trash2, X, CheckCircle2, XCircle,
  DollarSign, Briefcase, Phone, Mail, MapPin, Calendar,
  Building2, ShieldCheck, CreditCard, Users, ChevronDown,
  RefreshCw, User, CreditCard as BankIcon
} from 'lucide-react';
import BankAccountsTab from './BankAccountsTab';

const Field = ({ label, children }: any) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{label}</label>
    {children}
  </div>
);

const inputCls = "w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 text-sm font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all placeholder:text-zinc-300";
const selectCls = "w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 text-sm font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all appearance-none";

export default function Employees() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [activeSection, setActiveSection] = useState<'pessoal' | 'profissional' | 'salarial' | 'bancario'>('pessoal');

  const defaultForm = {
    name: '', email: '', phone: '', address: '', nif: '', numero_ss: '',
    position: '', department_id: '', hire_date: new Date().toISOString().split('T')[0],
    salary_base: 0, food_allowance: 0, transport_allowance: 0,
    other_deductions: 0, is_service_provider: false, status: 'active',
    bank_account: '', bilhete: '', data_nascimento: ''
  };

  const [formData, setFormData] = useState<any>(defaultForm);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empRes, depRes] = await Promise.all([
        supabase.from('hr_employees').select('*, hr_departments(name)').eq('company_id', user?.company_id).order('name'),
        supabase.from('hr_departments').select('*').eq('company_id', user?.company_id).order('name'),
      ]);
      setEmployees(empRes.data || []);
      setDepartments(depRes.data || []);
    } catch (err) {
      console.error('Erro ao carregar funcionários:', err);
    } finally {
      setLoading(false);
    }
  };

  const up = (k: string, v: any) => setFormData((p: any) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        company_id: user?.company_id,
        department_id: formData.department_id || null,
        salary_base: Number(formData.salary_base) || 0,
        food_allowance: Number(formData.food_allowance) || 0,
        transport_allowance: Number(formData.transport_allowance) || 0,
        other_deductions: Number(formData.other_deductions) || 0,
      };

      if (editingEmployee) {
        const { error } = await supabase.from('hr_employees').update(payload).eq('id', editingEmployee.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('hr_employees').insert([payload]);
        if (error) throw error;
      }
      closeModal();
      fetchData();
    } catch (err: any) {
      console.error('Erro ao guardar:', err);
      alert(`Erro: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem a certeza que deseja eliminar este funcionário?')) return;
    await supabase.from('hr_employees').delete().eq('id', id);
    fetchData();
  };

  const handleEdit = (emp: any) => {
    setEditingEmployee(emp);
    setFormData({
      name: emp.name || '', email: emp.email || '', phone: emp.phone || '',
      address: emp.address || '', nif: emp.nif || '', numero_ss: emp.numero_ss || '',
      position: emp.position || '', department_id: emp.department_id || '',
      hire_date: emp.hire_date || '', salary_base: emp.salary_base || 0,
      food_allowance: emp.food_allowance || 0, transport_allowance: emp.transport_allowance || 0,
      other_deductions: emp.other_deductions || 0, is_service_provider: emp.is_service_provider || false,
      status: emp.status || 'active', bank_account: emp.bank_account || '',
      bilhete: emp.bilhete || '', data_nascimento: emp.data_nascimento || ''
    });
    setActiveSection('pessoal');
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditingEmployee(null); setFormData(defaultForm); setActiveSection('pessoal'); };

  const filtered = employees.filter(e =>
    e.name?.toLowerCase().includes(search.toLowerCase()) ||
    e.position?.toLowerCase().includes(search.toLowerCase())
  );

  const sections = [
    { id: 'pessoal', label: 'Dados Pessoais', icon: User },
    { id: 'profissional', label: 'Dados Profissionais', icon: Briefcase },
    { id: 'salarial', label: 'Dados Salariais', icon: DollarSign },
    { id: 'bancario', label: 'Dados Bancários', icon: BankIcon },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-zinc-900 uppercase tracking-tight">Funcionários</h2>
          <p className="text-zinc-500 text-sm font-medium mt-1">Gerencie a sua equipa e informações salariais</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-3 bg-zinc-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-yellow-500 hover:text-zinc-900 transition-all shadow-xl shadow-zinc-900/10"
        >
          <UserPlus size={16} /> Novo Funcionário
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
        <input
          type="text"
          placeholder="Pesquisar por nome ou cargo…"
          className="w-full pl-11 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl text-sm font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-yellow-500 placeholder:text-zinc-300"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-yellow-500" size={28} /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Users size={40} className="text-zinc-200 mx-auto mb-3" />
            <p className="font-bold text-zinc-400">Nenhum funcionário encontrado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-zinc-50 text-[10px] uppercase tracking-widest font-black text-zinc-400">
                <tr>
                  <th className="px-6 py-4">Funcionário</th>
                  <th className="px-6 py-4">Cargo / Dept.</th>
                  <th className="px-6 py-4">Salário Base</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Acções</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {filtered.map(emp => {
                  const initials = (emp.name || '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                  return (
                    <tr key={emp.id} className="hover:bg-zinc-50/60 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-600 text-white flex items-center justify-center font-black text-xs shadow">
                            {initials}
                          </div>
                          <div>
                            <div className="font-black text-zinc-900 text-sm">{emp.name}</div>
                            <div className="text-xs text-zinc-400">{emp.email || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-zinc-800 text-sm">{emp.position}</div>
                        <div className="text-xs text-zinc-400">{emp.hr_departments?.name || 'Sem departamento'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-black text-zinc-900 text-sm">{Number(emp.salary_base).toLocaleString('pt-AO')} Kz</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${emp.is_service_provider ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                          {emp.is_service_provider ? 'Prestador' : 'Efectivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`flex items-center gap-1.5 text-xs font-black ${emp.status === 'active' ? 'text-emerald-600' : 'text-zinc-400'}`}>
                          {emp.status === 'active' ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                          {emp.status === 'active' ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(emp)} className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all" title="Editar">
                            <Edit2 size={15} />
                          </button>
                          <button onClick={() => handleDelete(emp.id)} className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all" title="Eliminar">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ============ MODAL ============ */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl max-h-[95vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-zinc-100 flex justify-between items-center sticky top-0 bg-white z-10 rounded-t-[2rem]">
              <div>
                <h3 className="text-lg font-black text-zinc-900 uppercase tracking-tight">
                  {editingEmployee ? 'Editar Funcionário' : 'Novo Funcionário'}
                </h3>
                <p className="text-xs text-zinc-400 font-medium">Preencha todos os campos relevantes</p>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-zinc-100 rounded-xl transition-all">
                <X size={20} className="text-zinc-500" />
              </button>
            </div>

            {/* Section Tabs */}
            <div className="flex border-b border-zinc-100 px-6">
              {sections.map(s => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`flex items-center gap-2 px-4 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all -mb-px ${activeSection === s.id
                    ? 'border-yellow-500 text-zinc-900'
                    : 'border-transparent text-zinc-400 hover:text-zinc-600'
                    }`}
                >
                  <s.icon size={13} /> {s.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Dados Pessoais */}
              {activeSection === 'pessoal' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="Nome Completo *">
                    <input required type="text" className={inputCls} placeholder="Ex: João Manuel da Silva" value={formData.name} onChange={e => up('name', e.target.value)} />
                  </Field>
                  <Field label="Bilhete de Identidade">
                    <input type="text" className={inputCls} placeholder="Ex: 0045678BA023" value={formData.bilhete} onChange={e => up('bilhete', e.target.value)} />
                  </Field>
                  <Field label="NIF">
                    <input type="text" className={inputCls} placeholder="Ex: 5417890123" value={formData.nif} onChange={e => up('nif', e.target.value)} />
                  </Field>
                  <Field label="Nº Segurança Social (INSS)">
                    <input type="text" className={inputCls} placeholder="Ex: 123456789" value={formData.numero_ss} onChange={e => up('numero_ss', e.target.value)} />
                  </Field>
                  <Field label="Data de Nascimento">
                    <input type="date" className={inputCls} value={formData.data_nascimento} onChange={e => up('data_nascimento', e.target.value)} />
                  </Field>
                  <Field label="Email">
                    <input type="email" className={inputCls} placeholder="exemplo@empresa.co.ao" value={formData.email} onChange={e => up('email', e.target.value)} />
                  </Field>
                  <Field label="Telefone">
                    <input type="text" className={inputCls} placeholder="+244 9xx xxx xxx" value={formData.phone} onChange={e => up('phone', e.target.value)} />
                  </Field>
                  <Field label="Morada">
                    <input type="text" className={inputCls} placeholder="Rua, Bairro, Município" value={formData.address} onChange={e => up('address', e.target.value)} />
                  </Field>
                </div>
              )}

              {/* Dados Profissionais */}
              {activeSection === 'profissional' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="Cargo / Função *">
                    <input required type="text" className={inputCls} placeholder="Ex: Gestor de Vendas" value={formData.position} onChange={e => up('position', e.target.value)} />
                  </Field>
                  <Field label="Departamento">
                    <select className={selectCls} value={formData.department_id} onChange={e => up('department_id', e.target.value)}>
                      <option value="">— Seleccionar —</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Data de Admissão *">
                    <input required type="date" className={inputCls} value={formData.hire_date} onChange={e => up('hire_date', e.target.value)} />
                  </Field>
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-[10px] text-amber-700 font-bold uppercase tracking-wider flex items-center gap-2">
                    <BankIcon size={14} /> Use a aba "Dados Bancários" para detalhes completos
                  </div>
                  <Field label="Tipo de Colaborador">
                    <select className={selectCls} value={formData.is_service_provider ? 'true' : 'false'} onChange={e => up('is_service_provider', e.target.value === 'true')}>
                      <option value="false">Efectivo (regime laboral)</option>
                      <option value="true">Prestador de Serviço (6.5%)</option>
                    </select>
                  </Field>
                  {editingEmployee && (
                    <Field label="Status">
                      <select className={selectCls} value={formData.status} onChange={e => up('status', e.target.value)}>
                        <option value="active">Activo</option>
                        <option value="inactive">Inactivo</option>
                      </select>
                    </Field>
                  )}
                </div>
              )}

              {/* Dados Salariais */}
              {activeSection === 'salarial' && (
                <div className="space-y-5">
                  <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-2xl p-5 text-white">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Salário Bruto Estimado</p>
                    <p className="text-3xl font-black">
                      {(
                        (Number(formData.salary_base) || 0) +
                        (Number(formData.food_allowance) || 0) +
                        (Number(formData.transport_allowance) || 0)
                      ).toLocaleString('pt-AO')} Kz
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-1">Salário + Subsídios (antes de descontos)</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Field label="Salário Base (Kz) *">
                      <input required type="number" min="0" className={inputCls} value={formData.salary_base} onChange={e => up('salary_base', e.target.value)} />
                    </Field>
                    <Field label="Subsídio de Alimentação (Kz)">
                      <input type="number" min="0" className={inputCls} value={formData.food_allowance} onChange={e => up('food_allowance', e.target.value)} />
                    </Field>
                    <Field label="Subsídio de Transporte (Kz)">
                      <input type="number" min="0" className={inputCls} value={formData.transport_allowance} onChange={e => up('transport_allowance', e.target.value)} />
                    </Field>
                    <Field label="Outros Descontos (Kz)">
                      <input type="number" min="0" className={inputCls} value={formData.other_deductions} onChange={e => up('other_deductions', e.target.value)} />
                    </Field>
                  </div>
                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm text-blue-700 font-medium">
                    💡 O INSS (3% trabalhador / 8% empresa) e o IRT são calculados automaticamente na Folha de Pagamento.
                  </div>
                </div>
              )}

              {/* Dados Bancários */}
              {activeSection === 'bancario' && (
                <div className="space-y-6">
                  {editingEmployee ? (
                    <BankAccountsTab
                      funcionarioId={editingEmployee.id}
                      user={user as any}
                    />
                  ) : (
                    <div className="bg-zinc-50 border border-zinc-100 rounded-3xl p-10 text-center">
                      <BankIcon size={48} className="text-zinc-300 mx-auto mb-4" />
                      <h4 className="text-sm font-black text-zinc-900 uppercase">Registo de Contas</h4>
                      <p className="text-xs text-zinc-500 mt-2">
                        Poderá registar os dados bancários detalhados (IBAN, Banco, etc.)
                        após criar o registo base do funcionário.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Navigation & Submit */}
              <div className="flex gap-3 pt-2 border-t border-zinc-100">
                {activeSection !== 'pessoal' && (
                  <button type="button" onClick={() => setActiveSection(activeSection === 'salarial' ? 'profissional' : 'pessoal')}
                    className="px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest border border-zinc-200 text-zinc-600 hover:bg-zinc-50 transition-all">
                    ← Anterior
                  </button>
                )}
                {activeSection !== 'salarial' ? (
                  <button type="button" onClick={() => setActiveSection(activeSection === 'pessoal' ? 'profissional' : 'salarial')}
                    className="flex-1 py-3 rounded-2xl font-black text-xs uppercase tracking-widest bg-zinc-100 text-zinc-800 hover:bg-zinc-200 transition-all">
                    Próximo →
                  </button>
                ) : (
                  <>
                    <button type="button" onClick={closeModal}
                      className="px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest border border-zinc-200 text-zinc-600 hover:bg-zinc-50 transition-all">
                      Cancelar
                    </button>
                    <button type="submit" disabled={saving}
                      className="flex-1 py-3 rounded-2xl font-black text-xs uppercase tracking-widest bg-zinc-900 text-white hover:bg-yellow-500 hover:text-zinc-900 transition-all disabled:opacity-60 shadow-xl flex items-center justify-center gap-2">
                      {saving ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                      {saving ? 'A guardar…' : 'Guardar Funcionário'}
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
