import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Building2, Save, Globe, Phone, Mail, Hash, Percent,
  DollarSign, Database, Download, CheckCircle2, Server,
  Shield, Store, Package, Users, User, BarChart3,
  Plus, Newspaper, Megaphone, PieChart, Settings as SettingsIcon,
  X, Check, FileText, Activity
} from 'lucide-react';

const MODULE_DEFS = [
  { key: 'sales', label: 'Vendas & PDV', icon: <Store size={14} /> },
  { key: 'products', label: 'Produtos & Stock', icon: <Package size={14} /> },
  { key: 'customers', label: 'Clientes', icon: <Users size={14} /> },
  { key: 'hr', label: 'Recursos Humanos', icon: <User size={14} /> },
  { key: 'accounting', label: 'Contabilidade', icon: <BarChart3 size={14} /> },
  { key: 'pharmacy', label: 'Farmácia', icon: <Plus size={14} /> },
  { key: 'blog', label: 'Blog Corporativo', icon: <Newspaper size={14} /> },
  { key: 'marketing', label: 'Marketing', icon: <Megaphone size={14} /> },
  { key: 'reports', label: 'Relatórios', icon: <PieChart size={14} /> },
  { key: 'users', label: 'Gestão de Utilizadores', icon: <Shield size={14} /> },
  { key: 'settings', label: 'Configurações', icon: <SettingsIcon size={14} /> },
];

export default function Settings() {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [company, setCompany] = useState<any>({
    name: '',
    nif: '',
    address: '',
    phone: '',
    email: '',
    tax_percentage: 14,
    currency: 'Kz',
    logo: '',
    role_permissions: {}
  });
  const [activeTab, setActiveTab] = useState<'profile' | 'billing' | 'system'>('profile');
  const [dbState, setDbState] = useState<any>(null);
  const [billingSeries, setBillingSeries] = useState<any[]>([]);
  const [showSeriesModal, setShowSeriesModal] = useState(false);
  const [newSeries, setNewSeries] = useState({ doc_type: 'FAC', series_name: '2026' });
  const [exporting, setExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCompany();
  }, []);

  const fetchCompany = async () => {
    try {
      const res = await fetch('/api/company/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setCompany(data);
    } catch (error) {
      console.error('Error fetching company:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return alert('Imagem muito grande (máx 2MB)');
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompany({ ...company, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const fetchSystemState = async () => {
    try {
      const res = await fetch('/api/system/state', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setDbState(data);
    } catch (error) {
      console.error('Error fetching system state:', error);
    }
  };

  const fetchBillingSeries = async () => {
    try {
      const res = await fetch('/api/billing-series', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setBillingSeries(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching series:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'system') fetchSystemState();
    if (activeTab === 'billing') fetchBillingSeries();
  }, [activeTab]);

  const handleCreateSeries = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/billing-series', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newSeries)
      });
      if (res.ok) {
        setShowSeriesModal(false);
        fetchBillingSeries();
      }
    } catch (error) {
      console.error('Error creating series:', error);
    }
  };

  const toggleSeriesStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/billing-series/${id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ is_active: !currentStatus })
      });
      if (res.ok) fetchBillingSeries();
    } catch (error) {
      console.error('Error toggling series:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/company/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(company)
      });
      if (res.ok) {
        alert('Configurações guardadas com sucesso!');
      }
    } catch (error) {
      console.error('Error saving company:', error);
    } finally {
      setSaving(false);
    }
  };

  const togglePermission = (role: string, moduleKey: string) => {
    const currentPerms = company.role_permissions || {};
    const rolePerms = currentPerms[role] || {};

    setCompany({
      ...company,
      role_permissions: {
        ...currentPerms,
        [role]: {
          ...rolePerms,
          [moduleKey]: !rolePerms[moduleKey]
        }
      }
    });
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/system/export', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `venda-plus-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Erro ao exportar dados.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <div className="p-8 text-center font-bold text-gray-500 animate-pulse">Sincronizando ambiente...</div>;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
          <Building2 size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Configurações</h1>
          <p className="text-gray-500">Gira os dados da empresa e visualize o estado do sistema</p>
        </div>
      </div>

      <div className="flex gap-2 mb-8 bg-gray-100/50 p-1 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${activeTab === 'profile' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
        >
          Perfil da Empresa
        </button>
        <button
          onClick={() => setActiveTab('billing')}
          className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${activeTab === 'billing' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
        >
          Séries de Faturação
        </button>
        <button
          onClick={() => setActiveTab('system')}
          className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${activeTab === 'system' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
        >
          Estado do Sistema
        </button>
      </div>

      {activeTab === 'profile' ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-[32px] shadow-sm border border-gray-100 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-4">
                <label className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Globe size={14} /> Logotipo da Empresa (Imagem)
                </label>
                <div className="flex gap-6 items-center bg-gray-50 p-6 rounded-[24px]">
                  <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center bg-white overflow-hidden shadow-inner relative group">
                    {company.logo ? (
                      <>
                        <img src={company.logo} alt="Logo" className="w-full h-full object-contain" />
                        <button
                          type="button"
                          onClick={() => setCompany({ ...company, logo: '' })}
                          className="absolute inset-0 bg-red-600/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-black text-[10px] uppercase"
                        >
                          Remover
                        </button>
                      </>
                    ) : (
                      <Globe size={24} className="text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="text-xs font-bold text-gray-500">Selecione uma imagem quadrada (PNG, JPG) com fundo transparente para melhores resultados nos recibos.</p>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-3 bg-white border border-gray-200 rounded-xl text-xs font-black uppercase tracking-widest hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm"
                    >
                      Selecionar Imagem
                    </button>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Globe size={14} /> Nome da Empresa
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  value={company.name}
                  onChange={e => setCompany({ ...company, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Hash size={14} /> NIF
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  value={company.nif}
                  onChange={e => setCompany({ ...company, nif: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Phone size={14} /> Telefone
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  value={company.phone}
                  onChange={e => setCompany({ ...company, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Mail size={14} /> Email
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  value={company.email}
                  onChange={e => setCompany({ ...company, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-black text-gray-400 uppercase tracking-widest">Endereço Completo</label>
              <textarea
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-emerald-500 font-bold"
                rows={3}
                value={company.address}
                onChange={e => setCompany({ ...company, address: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-dashed">
              <div className="space-y-2">
                <label className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Percent size={14} /> Taxa de IVA Padrão (%)
                </label>
                <input
                  type="number"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  value={company.tax_percentage}
                  onChange={e => setCompany({ ...company, tax_percentage: parseFloat(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <DollarSign size={14} /> Moeda
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  value={company.currency}
                  onChange={e => setCompany({ ...company, currency: e.target.value })}
                />
              </div>
            </div>

            <div className="pt-8 border-t border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="text-purple-600" size={24} />
                <h3 className="text-xl font-black text-gray-900">Matriz de Permissões (Modelos)</h3>
              </div>
              <p className="text-xs text-gray-500 mb-6 font-medium bg-purple-50 p-4 rounded-2xl border border-purple-100">
                Ajuste os modelos de permissão para cada papel. Estas definições serão aplicadas automaticamente a cada novo utilizador criado.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="py-4 px-2 font-black uppercase tracking-widest text-[10px] text-gray-400">Módulo / Funcionalidade</th>
                      <th className="py-4 px-2 font-black text-purple-600 text-center text-[10px] uppercase">Admin</th>
                      <th className="py-4 px-2 font-black text-blue-600 text-center text-[10px] uppercase">Gerente</th>
                      <th className="py-4 px-2 font-black text-emerald-600 text-center text-[10px] uppercase">Caixa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {MODULE_DEFS.map((mod) => (
                      <tr key={mod.key} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-4 px-2">
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                              {mod.icon}
                            </span>
                            <span className="font-bold text-gray-700 text-xs">{mod.label}</span>
                          </div>
                        </td>
                        {['admin', 'manager', 'cashier'].map((role) => {
                          const isChecked = company.role_permissions?.[role]?.[mod.key] === true;
                          return (
                            <td key={role} className="py-4 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => togglePermission(role, mod.key)}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto transition-all ${isChecked
                                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200'
                                  : 'bg-gray-100 text-gray-300 hover:bg-gray-200'
                                  }`}
                              >
                                {isChecked ? <Check size={18} strokeWidth={3} /> : <X size={16} />}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50"
            >
              <Save size={20} />
              {saving ? 'Guardando...' : 'Guardar Alterações'}
            </button>
          </div>
        </form>
      ) : activeTab === 'billing' ? (
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-black text-gray-900">Séries de Faturação</h2>
                <p className="text-gray-500 text-sm font-medium">Configure as sequências numéricas para as suas faturas e documentos.</p>
              </div>
              <button
                onClick={() => setShowSeriesModal(true)}
                className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
              >
                <Plus size={16} /> Nova Série
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="py-4 px-2 font-black uppercase tracking-widest text-[10px] text-gray-400">Tipo</th>
                    <th className="py-4 px-2 font-black uppercase tracking-widest text-[10px] text-gray-400">Série</th>
                    <th className="py-4 px-2 font-black uppercase tracking-widest text-[10px] text-gray-400 text-center">Último Nº</th>
                    <th className="py-4 px-2 font-black uppercase tracking-widest text-[10px] text-gray-400 text-center">Estado</th>
                    <th className="py-4 px-2 font-black uppercase tracking-widest text-[10px] text-gray-400 text-right">Acções</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {billingSeries.length > 0 ? billingSeries.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-2">
                        <span className="px-3 py-1 bg-gray-100 rounded-lg font-black text-[10px] uppercase text-gray-600">{s.doc_type}</span>
                      </td>
                      <td className="py-4 px-2 font-bold text-gray-700">{s.series_name}</td>
                      <td className="py-4 px-2 text-center font-mono font-bold text-emerald-600">{String(s.last_number).padStart(3, '0')}</td>
                      <td className="py-4 px-2 text-center">
                        <span className={`px-3 py-1 rounded-lg font-black text-[10px] uppercase ${s.is_active ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                          {s.is_active ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td className="py-4 px-2 text-right">
                        <button
                          onClick={() => toggleSeriesStatus(s.id, s.is_active)}
                          className={`p-2 rounded-xl transition-all ${s.is_active ? 'text-orange-500 hover:bg-orange-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
                          title={s.is_active ? 'Desactivar' : 'Activar'}
                        >
                          {s.is_active ? <X size={18} /> : <CheckCircle2 size={18} />}
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-gray-400 font-bold italic">Nenhuma série configurada. O sistema usará o formato padrão (FAC-Timestamp).</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {showSeriesModal && (
            <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
              <div className="bg-white rounded-[40px] w-full max-w-md overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                  <h3 className="text-xl font-black text-gray-900">Nova Série de Faturação</h3>
                  <button onClick={() => setShowSeriesModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={24} />
                  </button>
                </div>
                <form onSubmit={handleCreateSeries} className="p-8 space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Tipo de Documento</label>
                      <select
                        className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 font-bold"
                        value={newSeries.doc_type}
                        onChange={e => setNewSeries({ ...newSeries, doc_type: e.target.value })}
                      >
                        <option value="FAC">Factura (FAC)</option>
                        <option value="PRO">Factura Pro-forma (PRO)</option>
                        <option value="NC">Nota de Crédito (NC)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Nome da Série (Ex: 2024)</label>
                      <input
                        type="text"
                        required
                        className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 font-bold"
                        value={newSeries.series_name}
                        onChange={e => setNewSeries({ ...newSeries, series_name: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowSeriesModal(false)}
                      className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-gray-200 transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-4 bg-emerald-600 text-white rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-emerald-700 shadow-xl shadow-emerald-100 transition-all"
                    >
                      Criar Série
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black text-gray-900 flex items-center gap-2 uppercase tracking-tight italic">
                  <Database className="text-emerald-600" size={24} />
                  {dbState?.is_master_mode ? 'Diagnóstico Global do Sistema' : 'Diagnóstico da Empresa'}
                </h3>
                <p className="text-gray-500 text-sm font-medium">
                  {dbState?.is_master_mode ? 'Visão completa de todas as instâncias e dados da plataforma' : 'Informações técnicas e estado operacional da sua conta'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${dbState?.db_status === 'Online' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                  <div className={`w-2 h-2 rounded-full ${dbState?.db_status === 'Online' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                  DB {dbState?.db_status || 'OFFLINE'}
                </div>
                <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">
                  <Server size={14} /> {dbState?.system_status || 'OPERACIONAL'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="bg-slate-50 p-6 rounded-3xl border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 italic">
                  {dbState?.is_master_mode ? 'UTILIZADORES TOTAIS (SISTEMA)' : 'UTILIZADORES ACTIVOS'}
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-black text-gray-900 italic">{dbState?.current_users || 0}</p>
                  {!dbState?.is_master_mode && <p className="text-gray-400 font-black text-lg">/ {dbState?.user_limit || '---'}</p>}
                </div>
                <p className="text-[10px] text-gray-500 font-black uppercase mt-2">
                  {dbState?.is_master_mode ? 'Contagem global em todas as empresas' : 'Limite do seu plano'}
                </p>
              </div>

              <div className="bg-slate-50 p-6 rounded-3xl border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 italic">TABELAS GERIDAS</p>
                <p className="text-4xl font-black text-gray-900 italic">{dbState?.total_tables || 0}</p>
                <p className="text-[10px] text-gray-500 font-black uppercase mt-2">Estrutura de dados activa</p>
              </div>

              <div className="bg-slate-50 p-6 rounded-3xl border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 italic">ESTADO DO BANCO</p>
                <p className="text-2xl font-black text-emerald-600 uppercase italic">{dbState?.is_master_mode ? 'INFRAESTRUTURA OK' : 'OPERACIONAL'}</p>
                <p className="text-[10px] text-gray-500 font-black uppercase mt-2">Supabase Cloud + Edge</p>
              </div>
            </div>

            <div className="w-full h-px bg-gray-100 mb-10" />

            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6 italic">RESUMO DE REGISTOS POR TABELA</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {dbState?.table_stats ? Object.entries(dbState.table_stats).map(([table, count]: any) => (
                <div key={table} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm transition-transform hover:scale-[1.02]">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1 italic">{table.replace(/_/g, ' ')}</p>
                  <p className="text-xl font-black text-gray-900 italic">{count}</p>
                </div>
              )) : (
                <div className="col-span-full py-12 text-center text-gray-400 font-black uppercase tracking-widest text-xs animate-pulse italic">
                  SINCRONIZANDO ESTATÍSTICAS...
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[32px] text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20" />
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                  <Download size={24} className="text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xl font-black">Cópia de Segurança (Backup)</h3>
                  <p className="text-slate-400 text-sm">Descarregue todos os dados da sua empresa para segurança local.</p>
                </div>
              </div>

              <div className="bg-white/5 p-6 rounded-2xl mb-8 border border-white/10">
                <ul className="space-y-3">
                  <li className="flex items-center gap-2 text-xs font-bold text-slate-300">
                    <CheckCircle2 size={14} className="text-emerald-500" /> Exportação completa em formato JSON optimizado.
                  </li>
                  <li className="flex items-center gap-2 text-xs font-bold text-slate-300">
                    <CheckCircle2 size={14} className="text-emerald-500" /> Inclui produtos, clientes, vendas e histórico financeiro.
                  </li>
                  <li className="flex items-center gap-2 text-xs font-bold text-slate-300">
                    <CheckCircle2 size={14} className="text-emerald-500" /> Compatível com ferramentas de importação padrão.
                  </li>
                </ul>
              </div>

              <button
                onClick={handleExport}
                disabled={exporting}
                className="w-full md:w-auto px-10 py-5 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {exporting ? (
                  <>A processar...</>
                ) : (
                  <>
                    <Download size={20} />
                    Exportar Base de Dados
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
