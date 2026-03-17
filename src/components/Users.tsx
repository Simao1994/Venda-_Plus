// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  UserPlus, Mail, Shield, User, Trash2, Check, X, Copy, Link2,
  RefreshCw, Key, Eye, EyeOff, CheckCircle2, Lock, Unlock,
  ChevronDown, Settings, Users as UsersIcon, Activity, Filter, Calendar, Search
} from 'lucide-react';

// ─── Definição dos módulos e permissões disponíveis ─────────────────────────
const MODULE_DEFS = [
  { key: 'sales', label: 'Vendas & PDV', icon: '🛒', desc: 'POS, vendas, caixas' },
  { key: 'products', label: 'Produtos & Stock', icon: '📦', desc: 'Gestão de inventário' },
  { key: 'customers', label: 'Clientes', icon: '👥', desc: 'Base de clientes, fidelidade' },
  { key: 'hr', label: 'Recursos Humanos', icon: '👤', desc: 'Funcionários, salários, RH' },
  { key: 'accounting', label: 'Contabilidade', icon: '📊', desc: 'Plano de contas, lançamentos' },
  { key: 'pharmacy', label: 'Farmácia', icon: '💊', desc: 'Medicamentos, lotes' },
  { key: 'blog', label: 'Blog Corporativo', icon: '📰', desc: 'Publicações e notícias' },
  { key: 'marketing', label: 'Marketing', icon: '📣', desc: 'Campanhas e promoções' },
  { key: 'reports', label: 'Relatórios', icon: '📈', desc: 'Dashboards e análises' },
  { key: 'users', label: 'Gestão de Utilizadores', icon: '🔑', desc: 'Criar e gerir contas' },
  { key: 'settings', label: 'Configurações', icon: '⚙️', desc: 'Definições da empresa' },
];

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  master: { label: 'Master', color: 'bg-red-100 text-red-700' },
  admin: { label: 'Administrador', color: 'bg-purple-100 text-purple-700' },
  manager: { label: 'Gerente', color: 'bg-blue-100 text-blue-700' },
  cashier: { label: 'Operador de Caixa', color: 'bg-green-100 text-green-700' },
};

const DEFAULT_PERMS: Record<string, Record<string, boolean>> = {
  master: Object.fromEntries(MODULE_DEFS.map(m => [m.key, true])),
  admin: Object.fromEntries(MODULE_DEFS.map(m => [m.key, m.key !== 'users' ? true : true])),
  manager: Object.fromEntries(MODULE_DEFS.map(m => [m.key, !['users', 'settings'].includes(m.key)])),
  cashier: Object.fromEntries(MODULE_DEFS.map(m => [m.key, ['sales', 'products', 'customers'].includes(m.key)])),
};

export default function Users() {
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editingPermissions, setEditingPermissions] = useState<any | null>(null);
  const [pendingPerms, setPendingPerms] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'logs'>('users');
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logFilter, setLogFilter] = useState({ action: '', resource: '', search: '' });

  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'cashier'
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, companyRes] = await Promise.all([
        fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } }),
        supabase.from('companies').select('id, name, access_token, role_permissions').eq('id', currentUser?.company_id).single()
      ]);
      if (usersRes.ok) setUsers(await usersRes.json());
      if (companyRes.data) setCompany(companyRes.data);
    } catch (err) {
      console.error('Erro ao carregar utilizadores:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch('/api/activity-logs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setLogs(await res.json());
      }
    } catch (err) {
      console.error('Erro ao carregar logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'logs') fetchLogs();
  }, [activeTab]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const defaultPerms = company?.role_permissions?.[formData.role] || DEFAULT_PERMS[formData.role] || DEFAULT_PERMS.cashier;
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...formData, permissions: defaultPerms })
      });
      if (res.ok) {
        setShowModal(false);
        setFormData({ name: '', email: '', password: '', role: 'cashier' });
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao criar utilizador.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Eliminar este utilizador? Esta ação não pode ser desfeita.')) return;
    await fetch(`/api/users/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    fetchData();
  };

  const openPermissions = (u: any) => {
    const defaultForRole = company?.role_permissions?.[u.role] || DEFAULT_PERMS[u.role] || DEFAULT_PERMS.cashier;
    const currentPerms = u.permissions || defaultForRole;
    setPendingPerms({ ...DEFAULT_PERMS.cashier, ...currentPerms });
    setEditingPermissions(u);
  };

  const savePermissions = async () => {
    if (!editingPermissions) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('users')
        .update({ permissions: pendingPerms })
        .eq('id', editingPermissions.id);
      if (error) throw error;
      setEditingPermissions(null);
      fetchData();
    } catch (err: any) {
      alert(`Erro ao guardar permissões: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const applyRoleTemplate = (role: string) => {
    const perms = company?.role_permissions?.[role] || DEFAULT_PERMS[role] || DEFAULT_PERMS.cashier;
    setPendingPerms({ ...perms });
  };

  const generateAccessLink = async () => {
    setGeneratingLink(true);
    try {
      const token64 = btoa(Math.random().toString(36) + Date.now().toString(36)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 32);
      const { data, error } = await supabase.from('companies')
        .update({ access_token: token64, access_link_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() })
        .eq('id', currentUser?.company_id)
        .select('access_token')
        .single();
      if (error) throw error;
      setCompany((prev: any) => ({ ...prev, access_token: data.access_token }));
    } catch (err: any) {
      alert(`Erro ao gerar link: ${err.message}`);
    } finally {
      setGeneratingLink(false);
    }
  };

  const accessLink = company?.access_token
    ? `${window.location.origin}?company=${currentUser?.company_id}&token=${company.access_token}`
    : null;

  const copyLink = () => {
    if (!accessLink) return;
    navigator.clipboard.writeText(accessLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (currentUser?.role !== 'admin' && currentUser?.role !== 'master') {
    return (
      <div className="p-8 text-center">
        <Lock size={48} className="mx-auto text-rose-400 mb-4" />
        <h2 className="text-xl font-black text-zinc-900">Acesso Restrito</h2>
        <p className="text-zinc-500 mt-1">Apenas administradores podem gerir utilizadores.</p>
      </div>
    );
  }

  // ─── PERMISSIONS MODAL ───────────────────────────────────────────────────
  if (editingPermissions) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => setEditingPermissions(null)} className="p-2 hover:bg-zinc-100 rounded-xl transition-all">
            <X size={20} />
          </button>
          <div>
            <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight">
              Permissões — {editingPermissions.name}
            </h2>
            <p className="text-xs text-zinc-400 font-medium">Configure os módulos que este utilizador pode aceder</p>
          </div>
        </div>

        {/* Templates de papel */}
        <div className="flex flex-wrap gap-2">
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest self-center mr-2">Aplicar modelo:</span>
          {Object.entries(ROLE_LABELS).filter(([k]) => k !== 'master').map(([role, cfg]) => (
            <button key={role} onClick={() => applyRoleTemplate(role)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${cfg.color} hover:shadow-md`}>
              {cfg.label}
            </button>
          ))}
        </div>

        {/* Matriz de permissões */}
        <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-3 md:grid-cols-4 gap-0 divide-y divide-zinc-50">
            {MODULE_DEFS.map((mod, i) => (
              <button
                key={mod.key}
                onClick={() => setPendingPerms(p => ({ ...p, [mod.key]: !p[mod.key] }))}
                className={`flex flex-col gap-2 p-5 text-left transition-all hover:bg-zinc-50 ${pendingPerms[mod.key] ? 'bg-emerald-50' : 'bg-white'
                  } ${i % 4 !== 3 ? 'border-r border-zinc-50' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <span className="text-2xl">{mod.icon}</span>
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${pendingPerms[mod.key]
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200'
                    : 'bg-zinc-100 text-zinc-300'
                    }`}>
                    {pendingPerms[mod.key] ? <Check size={13} strokeWidth={3} /> : <X size={11} />}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-black text-zinc-900 leading-tight">{mod.label}</p>
                  <p className="text-[10px] text-zinc-400 font-medium mt-0.5">{mod.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={() => setEditingPermissions(null)}
            className="px-6 py-3 border border-zinc-200 rounded-2xl text-xs font-black uppercase tracking-widest text-zinc-600 hover:bg-zinc-50 transition-all">
            Cancelar
          </button>
          <button onClick={savePermissions} disabled={saving}
            className="flex-1 py-3 bg-zinc-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-yellow-500 hover:text-zinc-900 transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-60">
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            {saving ? 'A guardar…' : 'Guardar Permissões'}
          </button>
        </div>
      </div>
    );
  }

  // ─── MAIN VIEW ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 uppercase tracking-tight">Utilizadores & Controlo</h1>
          <p className="text-zinc-500 text-sm font-medium mt-1">Gerencie acessos, permissões e consulte o histórico de auditoria</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'users' && (
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-5 py-3 bg-zinc-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-yellow-500 hover:text-zinc-900 transition-all shadow-xl">
              <UserPlus size={16} /> Novo Utilizador
            </button>
          )}
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 p-1 bg-zinc-100 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
        >
          Contas de Utilizador
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'logs' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
        >
          Log de Atividades
        </button>
      </div>

      {activeTab === 'users' && (
        <>
          {/* ─── LINK DE ACESSO DA EMPRESA ─── */}
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-3xl p-6 text-white">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Link2 size={16} className="text-yellow-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Link de Acesso da Empresa</span>
                </div>
                <p className="text-sm font-medium text-zinc-300 mb-3">
                  Partilhe este link com os seus colaboradores para que acedam ao sistema sem necessidade de configuração.
                </p>
                {accessLink ? (
                  <div className="flex items-center gap-2 bg-zinc-800 rounded-2xl p-3 border border-zinc-700">
                    <code className="flex-1 text-xs text-yellow-400 font-mono truncate">{accessLink}</code>
                    <button onClick={copyLink}
                      className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-zinc-700 text-zinc-300 hover:bg-yellow-500 hover:text-zinc-900'
                        }`}>
                      {copied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                      {copied ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>
                ) : (
                  <div className="bg-zinc-800 rounded-2xl p-3 border border-zinc-700 border-dashed text-center">
                    <p className="text-xs text-zinc-500 font-medium">Ainda não foi gerado nenhum link de acesso</p>
                  </div>
                )}
              </div>
              <button onClick={generateAccessLink} disabled={generatingLink}
                className="flex-shrink-0 flex items-center gap-2 px-4 py-3 bg-yellow-500 text-zinc-900 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-yellow-400 transition-all shadow-xl disabled:opacity-60">
                {generatingLink ? <RefreshCw size={14} className="animate-spin" /> : <Key size={14} />}
                {accessLink ? 'Novo Link' : 'Gerar Link'}
              </button>
            </div>
            <p className="text-[10px] text-zinc-500 font-medium mt-3">
              ⚠️ O link é válido por 30 dias. Qualquer pessoa com este link pode aceder à interface de login da empresa. Guarde-o com segurança.
            </p>
          </div>

          {/* ─── LISTA DE UTILIZADORES ─── */}
          {loading ? (
            <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-yellow-500" size={28} /></div>
          ) : (
            <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-50 flex items-center gap-2">
                <UsersIcon size={16} className="text-zinc-400" />
                <span className="text-xs font-black uppercase tracking-widest text-zinc-400">
                  {users.length} utilizador{users.length !== 1 ? 'es' : ''} registado{users.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="divide-y divide-zinc-50">
                {users.map((u) => {
                  const perms = u.permissions || DEFAULT_PERMS[u.role] || {};
                  const activeModules = MODULE_DEFS.filter(m => perms[m.key]);
                  const roleInfo = ROLE_LABELS[u.role] || { label: u.role, color: 'bg-zinc-100 text-zinc-600' };
                  const initials = (u.name || '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

                  return (
                    <div key={u.id} className="p-6 flex flex-col md:flex-row md:items-center gap-4 hover:bg-zinc-50/50 transition-colors group">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-600 text-white flex items-center justify-center font-black text-sm shadow-lg flex-shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-zinc-900 text-sm">{u.name}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${roleInfo.color}`}>
                              {roleInfo.label}
                            </span>
                            {u.id === currentUser?.id && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-yellow-100 text-yellow-700">
                                Tu
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-zinc-400 font-medium mt-0.5">
                            <Mail size={11} /> {u.email}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 flex-1">
                        {activeModules.slice(0, 6).map(m => (
                          <span key={m.key} className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                            <span>{m.icon}</span>{m.label}
                          </span>
                        ))}
                        {activeModules.length > 6 && (
                          <span className="px-2 py-0.5 bg-zinc-100 text-zinc-500 rounded-full text-[9px] font-black">
                            +{activeModules.length - 6} mais
                          </span>
                        )}
                        {activeModules.length === 0 && (
                          <span className="text-[10px] text-zinc-300 font-medium italic">Sem permissões atribuídas</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => openPermissions(u)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-zinc-100 hover:bg-zinc-900 hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                          title="Gerir Permissões"
                        >
                          <Shield size={12} /> Permissões
                        </button>
                        {u.id !== currentUser?.id && (
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-2 text-zinc-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                            title="Eliminar"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* ─── LOG DE ATIVIDADES ─── */}
      {activeTab === 'logs' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-50 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-yellow-500" />
                <h3 className="text-sm font-black text-zinc-900 uppercase tracking-tight">Histórico de Auditoria</h3>
              </div>
              <div className="flex gap-4 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                  <input
                    type="text"
                    placeholder="Pesquisar logs..."
                    className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-yellow-500 transition-all"
                    value={logFilter.search}
                    onChange={(e) => setLogFilter({ ...logFilter, search: e.target.value })}
                  />
                </div>
                <button onClick={fetchLogs} className="p-2.5 bg-zinc-100 text-zinc-600 rounded-xl hover:bg-zinc-200 transition-all">
                  <RefreshCw size={16} className={loadingLogs ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-zinc-50 text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100">
                  <tr>
                    <th className="px-6 py-4">Data/Hora</th>
                    <th className="px-6 py-4">Utilizador</th>
                    <th className="px-6 py-4">Ação</th>
                    <th className="px-6 py-4">Recurso</th>
                    <th className="px-6 py-4">Descrição</th>
                    <th className="px-6 py-4">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {loadingLogs ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center">
                        <RefreshCw className="animate-spin text-yellow-500 mx-auto mb-2" size={24} />
                        <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">A carregar auditoria...</p>
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center text-zinc-400 py-10">
                        Nenhuma atividade registada.
                      </td>
                    </tr>
                  ) : logs
                    .filter(log =>
                      log.description?.toLowerCase().includes(logFilter.search.toLowerCase()) ||
                      log.user_name?.toLowerCase().includes(logFilter.search.toLowerCase()) ||
                      log.action?.toLowerCase().includes(logFilter.search.toLowerCase()) ||
                      log.resource?.toLowerCase().includes(logFilter.search.toLowerCase())
                    )
                    .map((log) => (
                      <tr key={log.id} className="hover:bg-zinc-50/50 transition-colors border-b border-zinc-50 last:border-0">
                        <td className="px-6 py-4 whitespace-nowrap text-[11px] font-bold text-zinc-900">
                          {new Date(log.created_at).toLocaleString('pt-PT')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-zinc-700">
                          {log.user_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${log.action === 'CREATE' ? 'bg-emerald-100 text-emerald-700' :
                            log.action === 'DELETE' ? 'bg-rose-100 text-rose-700' :
                              log.action === 'UPDATE' ? 'bg-amber-100 text-amber-700' :
                                'bg-zinc-100 text-zinc-700'
                            }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                          {log.resource}
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-zinc-600">
                          {log.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-mono text-[10px] text-zinc-400">
                          {log.ip_address || '---'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL NOVO UTILIZADOR ─── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-zinc-100 bg-zinc-50/50 relative">
              <button onClick={() => setShowModal(false)} className="absolute right-6 top-6 text-zinc-300 hover:text-zinc-600 transition-colors">
                <X size={20} />
              </button>
              <h3 className="text-lg font-black text-zinc-900 uppercase tracking-tight">Novo Utilizador</h3>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">As permissões iniciais são definidas pelo papel escolhido</p>
            </div>
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">Nome Completo</label>
                <input
                  required type="text" placeholder="Ex: Maria João Silva"
                  className="w-full p-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl font-bold text-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 placeholder:text-zinc-300"
                  value={formData.name}
                  onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">Email</label>
                <input
                  required type="email" placeholder="utilizador@empresa.ao"
                  className="w-full p-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl font-bold text-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 placeholder:text-zinc-300"
                  value={formData.email}
                  onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">Palavra-passe</label>
                <div className="relative">
                  <input
                    required type={showPassword ? 'text' : 'password'} placeholder="Mínimo 8 caracteres"
                    className="w-full p-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl font-bold text-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 placeholder:text-zinc-300 pr-12"
                    value={formData.password}
                    onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">Papel / Nível de Acesso</label>
                <select
                  className="w-full p-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl font-bold text-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 appearance-none"
                  value={formData.role}
                  onChange={e => setFormData(p => ({ ...p, role: e.target.value }))}
                >
                  <option value="cashier">Operador de Caixa</option>
                  <option value="manager">Gerente</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-3 border border-zinc-200 rounded-2xl text-xs font-black uppercase tracking-widest text-zinc-600 hover:bg-zinc-50 transition-all">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-3 bg-zinc-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-yellow-500 hover:text-zinc-900 transition-all shadow-xl disabled:opacity-60 flex items-center justify-center gap-2">
                  {saving ? <RefreshCw size={14} className="animate-spin" /> : <UserPlus size={14} />}
                  {saving ? 'A criar…' : 'Criar Conta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
