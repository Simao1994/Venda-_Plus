// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  UserPlus, Mail, Shield, User, Trash2, Check, X, Copy, Link2,
  RefreshCw, Key, Eye, EyeOff, CheckCircle2, Lock, Unlock,
  ChevronDown, Settings, Users as UsersIcon, Activity, Filter, Calendar, Search
} from 'lucide-react';
import { api } from '../lib/api';

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
  master: { label: 'Omni Master', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
  admin: { label: 'System Admin', color: 'bg-gold-primary/10 text-gold-primary border-gold-primary/20' },
  manager: { label: 'Operational Manager', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  cashier: { label: 'Frontline Operator', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
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
        api.get('/api/users'),
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
      const res = await api.get('/api/activity-logs');
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
      const res = await api.post('/api/users', { ...formData, permissions: defaultPerms });
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
    await api.delete(`/api/users/${id}`);
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
      <div className="flex flex-col items-center justify-center p-20 glass-panel rounded-[32px] border border-white/10">
        <Lock size={64} className="text-red-500/50 mb-6 animate-pulse" />
        <h2 className="text-2xl font-black text-white italic uppercase tracking-tight">Acesso Restrito</h2>
        <p className="text-white/40 mt-2 font-black uppercase text-[10px] tracking-widest">Apenas administradores de elite podem gerir utilizadores.</p>
      </div>
    );
  }

  // ─── PERMISSIONS MODAL ───────────────────────────────────────────────────
  if (editingPermissions) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center gap-4">
          <button onClick={() => setEditingPermissions(null)} className="p-3 bg-white/5 hover:bg-white/10 text-white/40 rounded-2xl transition-all">
            <X size={20} />
          </button>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight italic">
              Permissões — <span className="text-gold-primary">{editingPermissions.name}</span>
            </h2>
            <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mt-1">Configure o nível de acesso e módulos autorizados</p>
          </div>
        </div>

        {/* Templates de papel */}
        <div className="flex flex-wrap gap-2">
          <span className="text-[10px] font-black text-white/20 uppercase tracking-widest self-center mr-2">Aplicar modelo:</span>
          {Object.entries(ROLE_LABELS).filter(([k]) => k !== 'master').map(([role, cfg]) => (
            <button key={role} onClick={() => applyRoleTemplate(role)}
              className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border border-white/5 hover:border-gold-primary/30 hover:bg-gold-primary/10 text-white/60 hover:text-gold-primary`}>
              {cfg.label}
            </button>
          ))}
        </div>

        {/* Matriz de permissões */}
        <div className="glass-panel rounded-[32px] border border-white/10 shadow-sm overflow-hidden">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5">
            {MODULE_DEFS.map((mod, i) => (
              <button
                key={mod.key}
                onClick={() => setPendingPerms(p => ({ ...p, [mod.key]: !p[mod.key] }))}
                className={`flex flex-col gap-2 p-6 text-left transition-all ${pendingPerms[mod.key] ? 'bg-gold-primary/5' : 'bg-[#0B0B0B]'
                  } hover:bg-white/5`}
              >
                <div className="flex items-start justify-between">
                  <span className="text-2xl group-hover:scale-110 transition-transform">{mod.icon}</span>
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all border ${pendingPerms[mod.key]
                    ? 'bg-gold-primary text-black border-gold-primary shadow-lg shadow-gold-primary/20'
                    : 'bg-white/5 text-white/10 border-white/5'
                    }`}>
                    {pendingPerms[mod.key] ? <Check size={13} strokeWidth={4} /> : <X size={11} />}
                  </div>
                </div>
                <div>
                  <p className={`text-[11px] font-black uppercase tracking-tight leading-tight ${pendingPerms[mod.key] ? 'text-gold-primary' : 'text-white/60'}`}>{mod.label}</p>
                  <p className="text-[9px] text-white/20 font-black uppercase mt-1 leading-tight">{mod.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button onClick={() => setEditingPermissions(null)}
            className="px-8 py-4 bg-white/5 text-white/30 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-white/10 transition-all border border-white/5">
            Cancelar
          </button>
          <button onClick={savePermissions} disabled={saving}
            className="flex-1 py-4 bg-gold-primary text-black rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-gold-secondary transition-all shadow-xl shadow-gold-primary/20 flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95">
            {saving ? <RefreshCw size={16} className="animate-spin text-black" /> : <CheckCircle2 size={16} />}
            {saving ? 'A guardar alterações...' : 'Confirmar Permissões'}
          </button>
        </div>
      </div>
    );
  }

  // ─── MAIN VIEW ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white italic uppercase tracking-tight">Utilizadores <span className="text-gold-primary">&</span> Controlo</h1>
          <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mt-1 italic">Gestão de acessos, privilégios e auditoria de segurança em tempo real</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'users' && (
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-3 px-8 py-4 bg-gold-primary text-black rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gold-secondary transition-all shadow-2xl shadow-gold-primary/20 active:scale-95">
              <UserPlus size={18} /> Novo Utilizador
            </button>
          )}
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 p-1.5 bg-white/5 rounded-2xl w-fit border border-white/5">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-gold-primary text-black shadow-lg shadow-gold-primary/20' : 'text-white/40 hover:text-white'}`}
        >
          Contas de Utilizador
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'logs' ? 'bg-gold-primary text-black shadow-lg shadow-gold-primary/20' : 'text-white/40 hover:text-white'}`}
        >
          Log de Atividades
        </button>
      </div>

      {activeTab === 'users' && (
        <>
          {/* ─── LINK DE ACESSO DA EMPRESA ─── */}
          <div className="glass-panel overflow-hidden rounded-[32px] p-8 relative border border-gold-primary/20 shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gold-primary/10 rounded-full blur-3xl -mr-20 -mt-20 opacity-50" />
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gold-primary/20 flex items-center justify-center">
                    <Link2 size={16} className="text-gold-primary" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gold-primary/60 italic">Link de Acesso Corporativo</span>
                </div>
                <p className="text-sm font-medium text-white/50 mb-6 leading-relaxed">
                  Distribua este token digital para os seus colaboradores. Permite o acesso imediato ao painel de autenticação sem configurações manuais.
                </p>
                {accessLink ? (
                  <div className="flex items-center gap-3 bg-black/40 rounded-2xl p-4 border border-white/5 backdrop-blur-md">
                    <code className="flex-1 text-[11px] text-gold-primary/70 font-mono truncate tracking-tight">{accessLink}</code>
                    <button onClick={copyLink}
                      className={`flex-shrink-0 flex items-center gap-2 px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/40 hover:bg-gold-primary hover:text-black border border-white/5'
                        }`}>
                      {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                      {copied ? 'Copiado' : 'Copiar'}
                    </button>
                  </div>
                ) : (
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5 border-dashed text-center">
                    <p className="text-[10px] text-white/20 font-black uppercase italic tracking-widest">Aguardando geração de token de segurança...</p>
                  </div>
                )}
              </div>
              <button onClick={generateAccessLink} disabled={generatingLink}
                className="flex-shrink-0 flex items-center gap-3 px-10 py-5 bg-gold-primary text-black rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gold-secondary transition-all shadow-2xl shadow-gold-primary/20 active:scale-95 disabled:opacity-50">
                {generatingLink ? <RefreshCw size={18} className="animate-spin" /> : <Key size={18} />}
                {accessLink ? 'Renovar Token' : 'Gerar Token de Acesso'}
              </button>
            </div>
          </div>

          {/* ─── LISTA DE UTILIZADORES ─── */}
          {loading ? (
            <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-yellow-500" size={28} /></div>
          ) : (
            <div className="glass-panel rounded-[32px] border border-white/10 shadow-sm overflow-hidden">
              <div className="px-8 py-5 border-b border-white/5 flex items-center gap-3 bg-white/5">
                <UsersIcon size={18} className="text-gold-primary/60" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white italic">
                  {users.length} utilizador{users.length !== 1 ? 'es' : ''} na rede activa
                </span>
              </div>
              <div className="divide-y divide-white/5">
                {users.map((u) => {
                  const perms = u.permissions || DEFAULT_PERMS[u.role] || {};
                  const activeModules = MODULE_DEFS.filter(m => perms[m.key]);
                  const roleInfo = ROLE_LABELS[u.role] || { label: u.role, color: 'bg-zinc-100 text-zinc-600' };
                  const initials = (u.name || '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

                  return (
                    <div key={u.id} className="p-8 flex flex-col md:flex-row md:items-center gap-6 hover:bg-white/[0.02] transition-all group border-l-2 border-transparent hover:border-gold-primary relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gold-primary/[0.01] rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-gold-primary/5 transition-all" />
                      <div className="flex items-center gap-5 flex-1 min-w-0 relative z-10">
                        <div className="w-14 h-14 rounded-2xl bg-gold-gradient text-bg-deep flex items-center justify-center font-black text-lg shadow-[0_10px_20px_rgba(212,175,55,0.2)] flex-shrink-0 group-hover:scale-110 transition-transform italic">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="font-black text-white text-base tracking-tighter italic uppercase">{u.name}</span>
                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${roleInfo.color}`}>
                              {roleInfo.label}
                            </span>
                            {u.id === currentUser?.id && (
                              <span className="px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest bg-gold-primary text-bg-deep border border-gold-primary/20 animate-pulse">
                                YOU
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-white/20 font-black uppercase tracking-wider mt-1.5">
                            <Mail size={12} className="text-gold-primary/40" /> {u.email}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 flex-1">
                        {activeModules.slice(0, 6).map(m => (
                          <span key={m.key} className="flex items-center gap-1.5 px-3 py-1 bg-white/5 text-white/40 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/5 hover:border-gold-primary/30 transition-colors group/mod">
                            <span className="group-hover/mod:scale-125 transition-transform">{m.icon}</span>{m.label}
                          </span>
                        ))}
                        {activeModules.length > 6 && (
                          <span className="px-3 py-1 bg-white/5 text-white/20 rounded-full text-[9px] font-black uppercase">
                            +{activeModules.length - 6} módulos
                          </span>
                        )}
                        {activeModules.length === 0 && (
                          <span className="text-[10px] text-white/10 font-black uppercase italic tracking-widest">Sem Acesso Autorizado</span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <button
                          onClick={() => openPermissions(u)}
                          className="flex items-center gap-2 px-5 py-3 bg-white/5 hover:bg-gold-primary hover:text-black rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/5 shadow-xl hover:shadow-gold-primary/20"
                          title="Gerir Permissões de Acesso"
                        >
                          <Shield size={14} /> Permissões
                        </button>
                        {u.id !== currentUser?.id && (
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-3 bg-white/5 text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all border border-white/5"
                            title="Eliminar Conta"
                          >
                            <Trash2 size={16} />
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
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="glass-panel rounded-[32px] border border-white/10 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-white/5 flex flex-col md:flex-row gap-6 items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <Activity size={24} className="text-gold-primary" />
                <h3 className="text-xl font-black text-white italic uppercase tracking-tight">Audit <span className="text-gold-primary">Vault</span></h3>
              </div>
              <div className="flex gap-4 w-full md:w-auto">
                <div className="relative flex-1 md:w-80">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-primary/40" size={16} />
                  <input
                    type="text"
                    placeholder="Filtrar rastro digital..."
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white outline-none focus:ring-2 focus:ring-gold-primary/20 transition-all placeholder:text-white/20"
                    value={logFilter.search}
                    onChange={(e) => setLogFilter({ ...logFilter, search: e.target.value })}
                  />
                </div>
                <button onClick={fetchLogs} className="p-3.5 bg-white/5 text-gold-primary rounded-2xl hover:bg-gold-primary hover:text-black transition-all border border-white/5 shadow-xl active:scale-95">
                  <RefreshCw size={18} className={loadingLogs ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left dark-table">
                <thead className="bg-[#0B0B0B] text-[10px] font-black text-white/20 uppercase tracking-widest border-b border-white/5">
                  <tr>
                    <th className="px-8 py-5">Data/Hora</th>
                    <th className="px-8 py-5">Identidade</th>
                    <th className="px-8 py-5">Ação Atómia</th>
                    <th className="px-8 py-5">Recurso</th>
                    <th className="px-8 py-5">Descrição Operacional</th>
                    <th className="px-8 py-5">Origem (IP)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
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
                      <tr key={log.id} className="hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 group">
                        <td className="px-8 py-5 whitespace-nowrap text-[11px] font-black text-white italic">
                          {new Date(log.created_at).toLocaleString('pt-PT')}
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap text-[11px] font-black text-white/60 uppercase italic">
                          {log.user_name}
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap">
                          <span className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border ${log.action === 'CREATE' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                            log.action === 'DELETE' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                              log.action === 'UPDATE' ? 'bg-gold-primary/10 text-gold-primary border-gold-primary/20' :
                                'bg-white/5 text-white/40 border-white/5'
                            }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap text-[10px] font-black text-gold-primary uppercase tracking-[0.1em] italic">
                          {log.resource}
                        </td>
                        <td className="px-8 py-5 text-[11px] font-bold text-white/40 group-hover:text-white/70 transition-colors">
                          {log.description}
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap font-mono text-[9px] text-white/20 tracking-tighter">
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
        <div className="fixed inset-0 bg-[#0B0B0B]/80 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
          <div className="glass-panel rounded-[40px] w-full max-w-md overflow-hidden shadow-2xl border border-white/20">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
              <div>
                <h3 className="text-xl font-black text-gold-primary uppercase italic tracking-tight">Novo Perfil</h3>
                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mt-1">Definição de identidade no sistema</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-white/20 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-white/30 tracking-widest mb-2">Nome Completo</label>
                  <input
                    required type="text" placeholder="Nome do colaborador..."
                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-gold-primary font-bold text-white text-sm outline-none placeholder:text-white/10"
                    value={formData.name}
                    onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-white/30 tracking-widest mb-2">Email Profissional</label>
                  <input
                    required type="email" placeholder="exemplo@venda.plus"
                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-gold-primary font-bold text-white text-sm outline-none placeholder:text-white/10"
                    value={formData.email}
                    onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-white/30 tracking-widest mb-2">Chave de Acesso</label>
                  <div className="relative">
                    <input
                      required type={showPassword ? 'text' : 'password'} placeholder="Mínimo 8 caracteres"
                      className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-gold-primary font-bold text-white text-sm outline-none placeholder:text-white/10 pr-14"
                      value={formData.password}
                      onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 hover:text-gold-primary transition-colors">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-white/30 tracking-widest mb-2">Papel Hierárquico</label>
                  <select
                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-gold-primary font-bold text-white text-sm outline-none appearance-none cursor-pointer"
                    value={formData.role}
                    onChange={e => setFormData(p => ({ ...p, role: e.target.value }))}
                  >
                    <option value="cashier" className="bg-zinc-900">Operador de Caixa</option>
                    <option value="manager" className="bg-zinc-900">Gerente</option>
                    <option value="admin" className="bg-zinc-900">Administrador</option>
                  </select>
                </div>
              </div>
              <div className="pt-8 flex gap-4">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-4 bg-white/5 text-white/20 rounded-3xl font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all border border-white/5">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-4 bg-gold-primary text-black rounded-3xl font-black uppercase text-[10px] tracking-widest hover:bg-gold-secondary transition-all shadow-xl shadow-gold-primary/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3">
                  {saving ? <RefreshCw size={16} className="animate-spin" /> : <UserPlus size={16} />}
                  {saving ? 'Criando...' : 'Ativar Utilizador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
