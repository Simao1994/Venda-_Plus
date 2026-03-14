import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Building2, Save, Globe, Phone, Mail, Hash, Percent, DollarSign, Database, Download, CheckCircle2, Server, Shield } from 'lucide-react';

export default function Settings() {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [company, setCompany] = useState({
    name: '',
    nif: '',
    address: '',
    phone: '',
    email: '',
    tax_percentage: 14,
    currency: 'Kz'
  });
  const [activeTab, setActiveTab] = useState<'profile' | 'system'>('profile');
  const [dbState, setDbState] = useState<any>(null);
  const [exporting, setExporting] = useState(false);

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

  useEffect(() => {
    if (activeTab === 'system') fetchSystemState();
  }, [activeTab]);

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
      ) : (
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                  <Database className="text-emerald-600" size={24} />
                  Estado da Base de Dados
                </h3>
                <p className="text-gray-500 text-sm">Resumo da ocupação de dados da sua empresa</p>
              </div>
              <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">
                <Server size={14} /> Supabase Cloud + Edge Runtime
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {dbState ? Object.entries(dbState).map(([table, count]: any) => (
                <div key={table} className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{table}</p>
                  <p className="text-2xl font-black text-gray-900">{count}</p>
                  <p className="text-[10px] text-gray-400 font-bold">Registos activos</p>
                </div>
              )) : (
                <div className="col-span-full py-12 text-center text-gray-400 font-bold animate-pulse">
                  Sincronizando estatísticas...
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="text-purple-600" size={24} />
              <h3 className="text-xl font-black text-gray-900">Matriz de Permissões</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="py-4 font-black uppercase tracking-widest text-[10px] text-gray-400">Funcionalidade</th>
                    <th className="py-4 font-black text-emerald-600">Admin</th>
                    <th className="py-4 font-black text-blue-600">Gerente</th>
                    <th className="py-4 font-black text-gray-600">Caixa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  <tr>
                    <td className="py-4 font-bold text-gray-700">Gestão Financeira</td>
                    <td className="py-4 text-emerald-500"><CheckCircle2 size={16} /></td>
                    <td className="py-4 text-emerald-500"><CheckCircle2 size={16} /></td>
                    <td className="py-4 text-gray-300">-</td>
                  </tr>
                  <tr>
                    <td className="py-4 font-bold text-gray-700">Gestão de Utilizadores</td>
                    <td className="py-4 text-emerald-500"><CheckCircle2 size={16} /></td>
                    <td className="py-4 text-gray-300">-</td>
                    <td className="py-4 text-gray-300">-</td>
                  </tr>
                  <tr>
                    <td className="py-4 font-bold text-gray-700">Vendas e Checkout</td>
                    <td className="py-4 text-emerald-500"><CheckCircle2 size={16} /></td>
                    <td className="py-4 text-emerald-500"><CheckCircle2 size={16} /></td>
                    <td className="py-4 text-emerald-500"><CheckCircle2 size={16} /></td>
                  </tr>
                  <tr>
                    <td className="py-4 font-bold text-gray-700">Configurações de Sistema</td>
                    <td className="py-4 text-emerald-500"><CheckCircle2 size={16} /></td>
                    <td className="py-4 text-gray-300">-</td>
                    <td className="py-4 text-gray-300">-</td>
                  </tr>
                </tbody>
              </table>
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
