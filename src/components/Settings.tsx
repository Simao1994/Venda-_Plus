import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Building2, Save, Globe, Phone, Mail, Hash, Percent,
  DollarSign, Database, Download, CheckCircle2, Server,
  Shield, Store, Package, Users, User, BarChart3,
  Plus, Newspaper, Megaphone, PieChart, Settings as SettingsIcon,
  X, Check, FileText, Activity, HelpCircle, RefreshCw
} from 'lucide-react';
import SystemDocumentation from './documentation/SystemDocumentation';
import { api } from '../lib/api';

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
    imagem_home: '',
    role_permissions: {},
    bio_nome: '',
    bio_foto: '',
    bio_formacao: '',
    bio_profissao: '',
    bio_competencias: [],
    bio_contactos: '',
    bio_emails: '',
    bio_resumo: '',
    bio_publicado: false
  });
  const [activeTab, setActiveTab] = useState<'profile' | 'billing' | 'system' | 'docs' | 'personalization' | 'biografia'>('profile');
  const [dbState, setDbState] = useState<any>(null);
  const [billingSeries, setBillingSeries] = useState<any[]>([]);
  const [showSeriesModal, setShowSeriesModal] = useState(false);
  const [newSeries, setNewSeries] = useState({ doc_type: 'FAC', series_name: '2026' });
  const [exporting, setExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const homeFileInputRef = useRef<HTMLInputElement>(null);
  const bioFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCompany();
  }, []);

  const fetchCompany = async () => {
    try {
      const res = await api.get('/api/company/profile');
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

  const handleHomeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) return alert('Imagem muito grande (máx 5MB)');
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompany({ ...company, imagem_home: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return alert('Imagem muito grande (máx 2MB)');
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompany({ ...company, bio_foto: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const fetchSystemState = async () => {
    try {
      const res = await api.get('/api/system/state');
      const data = await res.json();
      setDbState(data);
    } catch (error) {
      console.error('Error fetching system state:', error);
    }
  };

  const fetchBillingSeries = async () => {
    try {
      const res = await api.get('/api/billing-series');
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
      const res = await api.post('/api/billing-series', newSeries);
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
      const res = await api.patch(`/api/billing-series/${id}/toggle`, { is_active: !currentStatus });
      if (res.ok) fetchBillingSeries();
    } catch (error) {
      console.error('Error toggling series:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/api/company/profile', company);
      if (res.ok) {
        alert('Configurações guardadas com sucesso! A sua Biografia Profissional já está disponível na Página Inicial (Portal de Vendas).');
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(`Erro ao guardar: ${errorData.error || 'Verifique se todos os campos estão corretos.'}`);
        console.error('API Error:', errorData);
      }
    } catch (error) {
      console.error('Error saving company:', error);
      alert('Ocorreu um erro de rede ao guardar as configurações.');
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
      const res = await api.get('/api/system/export');
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

  if (loading) return (
    <div className="min-h-screen bg-bg-deep flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <div className="w-16 h-16 border-4 border-gold-primary/20 border-t-gold-primary rounded-full animate-spin shadow-[0_0_30px_rgba(212,175,55,0.2)]"></div>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gold-primary/60 animate-pulse italic">Synchronizing Core Engine...</p>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto min-h-screen">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-gold-primary/10 text-gold-primary rounded-2xl flex items-center justify-center border border-gold-primary/20">
          <Building2 size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight uppercase italic">Configurações <span className="text-gold-primary">Globais</span></h1>
          <p className="text-white/40 font-bold text-sm">Gira os dados da empresa e visualize o estado do sistema com precisão.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-8 bg-white/5 p-1 rounded-2xl w-fit border border-white/5">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'profile' ? 'bg-gold-primary text-black shadow-lg shadow-gold-primary/20' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
        >
          Perfil da Empresa
        </button>
        <button
          onClick={() => setActiveTab('billing')}
          className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'billing' ? 'bg-gold-primary text-black shadow-lg shadow-gold-primary/20' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
        >
          Séries de Faturação
        </button>
        <button
          onClick={() => setActiveTab('system')}
          className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'system' ? 'bg-gold-primary text-black shadow-lg shadow-gold-primary/20' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
        >
          Estado do Sistema
        </button>
        <button
          onClick={() => setActiveTab('docs')}
          className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'docs' ? 'bg-gold-primary text-black shadow-lg shadow-gold-primary/20' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
        >
          Documentação
        </button>
        <button
          onClick={() => setActiveTab('personalization')}
          className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'personalization' ? 'bg-gold-primary text-black shadow-lg shadow-gold-primary/20' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
        >
          Personalização
        </button>
        <button
          onClick={() => setActiveTab('biografia')}
          className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'biografia' ? 'bg-gold-primary text-black shadow-lg shadow-gold-primary/20' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
        >
          Biografia Profissional
        </button>
      </div>

      {(activeTab === 'profile' || activeTab === 'personalization' || activeTab === 'biografia') ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          {activeTab === 'profile' ? (
            <div className="glass-panel p-6 md:p-8 rounded-[32px] shadow-sm border border-white/10 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-4">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2 italic">
                    <Globe size={14} /> Logotipo da Empresa
                  </label>
                  <div className="flex gap-6 items-center bg-white/5 p-6 rounded-[24px] border border-white/5">
                    <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center bg-black/20 overflow-hidden shadow-inner relative group">
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
                        <Globe size={24} className="text-white/10" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="text-[9px] font-black text-white/30 uppercase tracking-tight">Selecione uma imagem quadrada (PNG, JPG) com fundo transparente para melhores resultados nos recibos profissionais.</p>
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
                        className="px-6 py-3 bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-gold-primary hover:bg-gold-primary hover:text-black transition-all shadow-sm"
                      >
                        Selecionar Imagem
                      </button>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Globe size={14} /> Nome da Empresa
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-gold-primary font-bold transition-all"
                    value={company.name}
                    onChange={e => setCompany({ ...company, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Hash size={14} /> NIF
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-gold-primary font-bold transition-all"
                    value={company.nif}
                    onChange={e => setCompany({ ...company, nif: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Phone size={14} /> Telefone
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-gold-primary font-bold transition-all"
                    value={company.phone}
                    onChange={e => setCompany({ ...company, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Mail size={14} /> Email Corporativo
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-gold-primary font-bold transition-all"
                    value={company.email}
                    onChange={e => setCompany({ ...company, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Endereço Completo</label>
                <textarea
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-gold-primary font-bold transition-all"
                  rows={3}
                  value={company.address}
                  onChange={e => setCompany({ ...company, address: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-white/5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Percent size={14} /> Taxa de IVA Padrão (%)
                  </label>
                  <input
                    type="number"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-gold-primary font-bold"
                    value={company.tax_percentage}
                    onChange={e => setCompany({ ...company, tax_percentage: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
                    <DollarSign size={14} /> Moeda do Sistema
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-gold-primary font-bold"
                    value={company.currency}
                    onChange={e => setCompany({ ...company, currency: e.target.value })}
                  />
                </div>
              </div>

              <div className="pt-8 border-t border-white/5">
                <div className="flex items-center gap-3 mb-6">
                  <Shield className="text-gold-primary" size={24} />
                  <h3 className="text-xl font-black text-white uppercase italic">Matriz de Permissões</h3>
                </div>
                <p className="text-[10px] text-gold-primary/70 mb-6 font-black uppercase tracking-tighter bg-gold-primary/5 p-4 rounded-2xl border border-gold-primary/10">
                  Ajuste os modelos de permissão para cada papel. Estas definições serão aplicadas automaticamente a cada novo utilizador criado no Venda Plus.
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse dark-table">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="py-4 px-2 font-black uppercase tracking-widest text-[10px] text-white/20">Módulo / Funcionalidade</th>
                        <th className="py-4 px-2 font-black text-gold-primary text-center text-[10px] uppercase tracking-[0.2em]">Admin</th>
                        <th className="py-4 px-2 font-black text-blue-400 text-center text-[10px] uppercase tracking-[0.2em]">Gerente</th>
                        <th className="py-4 px-2 font-black text-emerald-400 text-center text-[10px] uppercase tracking-[0.2em]">Caixa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {MODULE_DEFS.map((mod) => (
                        <tr key={mod.key} className="hover:bg-white/5 transition-colors">
                          <td className="py-4 px-2">
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/20 border border-white/5">
                                {mod.icon}
                              </span>
                              <span className="font-black text-white/60 text-[10px] uppercase tracking-widest">{mod.label}</span>
                            </div>
                          </td>
                          {['admin', 'manager', 'cashier'].map((role) => {
                            const isChecked = company.role_permissions?.[role]?.[mod.key] === true;
                            return (
                              <td key={role} className="py-4 px-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => togglePermission(role, mod.key)}
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto transition-all ${isChecked
                                    ? 'bg-gold-primary text-black shadow-lg shadow-gold-primary/20 scale-110'
                                    : 'bg-white/5 text-white/10 hover:bg-white/10 border border-white/5'
                                    }`}
                                >
                                  {isChecked ? <Check size={14} strokeWidth={4} /> : <X size={12} />}
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
          ) : activeTab === 'personalization' ? (
            <div className="glass-panel p-6 md:p-8 rounded-[32px] shadow-sm border border-white/10 space-y-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2 italic text-gold-primary">Imagem de Fundo da Home</h3>
                  <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-6">Esta imagem será exibida como fundo na página inicial do seu sistema ERP.</p>

                  <div className="space-y-6">
                    <div
                      className="w-full h-80 rounded-[32px] border-2 border-dashed border-white/10 flex items-center justify-center bg-black/40 overflow-hidden shadow-2xl relative group cursor-pointer transition-all hover:border-gold-primary/30"
                      onClick={() => homeFileInputRef.current?.click()}
                    >
                      {company.imagem_home ? (
                        <>
                          <img src={company.imagem_home} alt="Home Background" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-4 backdrop-blur-sm">
                            <span className="bg-gold-primary text-black px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-gold-primary/20">Alterar Imagem</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCompany({ ...company, imagem_home: '' });
                              }}
                              className="bg-red-500/20 text-red-500 border border-red-500/30 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-red-500 hover:text-white transition-all"
                            >
                              Remover
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="text-center space-y-4">
                          <div className="w-20 h-20 bg-white/5 rounded-[24px] flex items-center justify-center mx-auto border border-white/5 shadow-inner">
                            <Package size={32} className="text-white/20" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-gold-primary uppercase tracking-[0.3em]">Clique para carregar</p>
                            <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Painel de Fundo Premium</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      ref={homeFileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleHomeFileChange}
                    />
                    <div className="bg-white/5 p-6 rounded-3xl border border-white/5 flex items-start gap-4">
                      <div className="w-10 h-10 bg-gold-primary/10 rounded-xl flex items-center justify-center text-gold-primary shrink-0 border border-gold-primary/20">
                        <Activity size={18} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-white uppercase tracking-widest">Especificações Recomendadas</p>
                        <p className="text-[9px] text-white/40 font-bold leading-relaxed">Resolução 1920x1080px (16:9) para cobertura total. Suporta PNG, JPG e WebP. Tamanho máximo do ficheiro: 5 megabytes.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-6 md:p-8 rounded-[32px] shadow-sm border border-white/10 space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <User className="text-gold-primary" size={24} />
                <h3 className="text-xl font-black text-white uppercase italic">Biografia Profissional</h3>
              </div>
              <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mb-8">
                Personalize os dados de apresentação do administrador. Este cartão biográfico será exibido na página inicial.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-4">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2 italic">
                    <User size={14} /> Fotografia de Perfil
                  </label>
                  <div className="flex gap-6 items-center bg-white/5 p-6 rounded-[24px] border border-white/5">
                    <div className="w-24 h-24 rounded-full border-4 border-gold-primary/30 flex items-center justify-center bg-bg-deep overflow-hidden shadow-inner relative group cursor-pointer focus-within:ring-2 focus-within:ring-gold-primary" onClick={() => bioFileInputRef.current?.click()}>
                      {company.bio_foto ? (
                        <>
                          <img src={company.bio_foto} alt="Foto Bio" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="font-black text-[10px] uppercase text-white">Alterar</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-center text-white/20">
                          <User size={32} className="mx-auto" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-3">
                      <p className="text-[9px] font-black text-white/30 uppercase tracking-tight">Foto profissional (Recomendado: quadrada, fundo neutro).</p>
                      <input
                        type="file"
                        ref={bioFileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleBioFileChange}
                      />
                      <div className="flex gap-3">
                        <button type="button" onClick={() => bioFileInputRef.current?.click()} className="px-6 py-3 bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-gold-primary hover:bg-gold-primary hover:text-black transition-all">
                          Upload Foto
                        </button>
                        {company.bio_foto && (
                          <button type="button" onClick={() => setCompany({ ...company, bio_foto: '' })} className="px-6 py-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-[10px] font-black uppercase hover:bg-red-500 hover:text-white transition-all">
                            Remover
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Nome Completo</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-gold-primary transition-all"
                    value={company.bio_nome || ''}
                    placeholder="Ex: Eng.º João Silva"
                    onChange={e => setCompany({ ...company, bio_nome: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Área de Formação</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-gold-primary transition-all"
                    value={company.bio_formacao || ''}
                    placeholder="Ex: Engenharia Informática"
                    onChange={e => setCompany({ ...company, bio_formacao: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Profissão / Cargo</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-gold-primary transition-all"
                    value={company.bio_profissao || ''}
                    placeholder="Ex: Arquiteto de Software"
                    onChange={e => setCompany({ ...company, bio_profissao: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Competências (Separadas por vírgula)</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-gold-primary transition-all"
                    value={Array.isArray(company.bio_competencias) ? company.bio_competencias.join(', ') : (company.bio_competencias || '')}
                    placeholder="Ex: React, Node.js, Liderança"
                    onChange={e => {
                      const vals = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                      setCompany({ ...company, bio_competencias: vals });
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Contactos Telefónicos</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-gold-primary transition-all"
                    value={company.bio_contactos || ''}
                    placeholder="Ex: +244 900 000 000"
                    onChange={e => setCompany({ ...company, bio_contactos: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Email Profissional</label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-gold-primary transition-all"
                    value={company.bio_emails || ''}
                    placeholder="Ex: email@dominio.com"
                    onChange={e => setCompany({ ...company, bio_emails: e.target.value })}
                  />
                </div>

                 <div className="md:col-span-2 space-y-4">
                  <div className="flex items-center justify-between p-6 bg-gold-primary/5 rounded-2xl border border-gold-primary/20 gold-glow">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${company.bio_publicado ? 'bg-gold-primary text-bg-deep' : 'bg-white/5 text-white/20'}`}>
                        <Globe size={24} className={company.bio_publicado ? 'animate-pulse' : ''} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white uppercase tracking-tight italic">Publicar Biografia</h4>
                        <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest leading-none mt-1">
                          {company.bio_publicado ? 'Visível na Home e Dashboard' : 'Modo Rascunho'}
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={company.bio_publicado || false}
                        onChange={(e) => setCompany({ ...company, bio_publicado: e.target.checked })}
                      />
                      <div className="w-14 h-7 bg-white/5 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white/20 after:border-transparent after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gold-primary/40 peer-checked:after:bg-gold-primary shadow-inner"></div>
                    </label>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Resumo Biográfico / Sobre Mim</label>
                    <textarea
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-gold-primary transition-all min-h-[120px]"
                      value={company.bio_resumo || ''}
                      placeholder="Escreva um breve resumo sobre a sua trajetória profissional..."
                      onChange={e => setCompany({ ...company, bio_resumo: e.target.value })}
                    />
                  </div>
                </div>

              </div>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="px-10 py-5 bg-gold-primary text-black rounded-[24px] font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-4 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_20px_50px_rgba(212,175,55,0.3)] disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                  <span>Sincronizando...</span>
                </>
              ) : (
                <>
                  <Save size={18} />
                  <span>Guardar Alterações {activeTab === 'personalization' ? 'de Design' : ''}</span>
                </>
              )}
            </button>
          </div>
        </form>
      ) : activeTab === 'billing' ? (
        <div className="space-y-6">
          <div className="glass-panel p-8 rounded-[32px] shadow-sm border border-white/10">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-black text-white uppercase italic">Séries de Faturação</h2>
                <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mt-1">Configure as sequências numéricas para as suas faturas e documentos profissionais.</p>
              </div>
              <button
                onClick={() => setShowSeriesModal(true)}
                className="flex items-center gap-2 bg-gold-primary text-black px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gold-secondary transition-all shadow-lg shadow-gold-primary/20 active:scale-95"
              >
                <Plus size={16} /> Nova Série
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left dark-table">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="py-4 px-2 font-black uppercase tracking-widest text-[10px] text-white/20">Tipo</th>
                    <th className="py-4 px-2 font-black uppercase tracking-widest text-[10px] text-white/20">Série</th>
                    <th className="py-4 px-2 font-black uppercase tracking-widest text-[10px] text-white/20 text-center">Último Nº</th>
                    <th className="py-4 px-2 font-black uppercase tracking-widest text-[10px] text-white/20 text-center">Estado</th>
                    <th className="py-4 px-2 font-black uppercase tracking-widest text-[10px] text-white/20 text-right">Acções</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {billingSeries.length > 0 ? billingSeries.map((s) => (
                    <tr key={s.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-4 px-2">
                        <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg font-black text-[10px] uppercase text-white/40">{s.doc_type}</span>
                      </td>
                      <td className="py-4 px-2 font-black text-white/60 text-[10px] uppercase tracking-widest">{s.series_name}</td>
                      <td className="py-4 px-2 text-center font-mono font-black text-gold-primary">{String(s.last_number).padStart(3, '0')}</td>
                      <td className="py-4 px-2 text-center">
                        <span className={`px-3 py-1 rounded-lg font-black text-[10px] uppercase ${s.is_active ? 'bg-gold-primary/10 text-gold-primary border border-gold-primary/20' : 'bg-white/5 text-white/10'}`}>
                          {s.is_active ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td className="py-4 px-2 text-right">
                        <button
                          onClick={() => toggleSeriesStatus(s.id, s.is_active)}
                          className={`p-2 rounded-xl transition-all ${s.is_active ? 'text-amber-500 hover:bg-amber-500/10' : 'text-gold-primary hover:bg-gold-primary/10'}`}
                          title={s.is_active ? 'Desactivar' : 'Activar'}
                        >
                          {s.is_active ? <X size={18} /> : <CheckCircle2 size={18} />}
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="py-20 text-center text-white/10 font-black uppercase tracking-[0.3em] text-[10px] italic bg-white/[0.01]">
                        Neutral Void: Nenhuma série configurada. Usando fallback FAC-Timestamp.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {showSeriesModal && (
            <div className="fixed inset-0 bg-[#0B0B0B]/80 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
              <div className="glass-panel rounded-[40px] w-full max-w-md overflow-hidden shadow-2xl border border-white/20">
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
                  <h3 className="text-xl font-black text-gold-primary uppercase italic">Nova Série</h3>
                  <button onClick={() => setShowSeriesModal(false)} className="text-white/20 hover:text-white transition-colors">
                    <X size={24} />
                  </button>
                </div>
                <form onSubmit={handleCreateSeries} className="p-8 space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-white/30 tracking-widest mb-2">Tipo de Documento</label>
                      <select
                        className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-gold-primary font-bold text-white outline-none"
                        value={newSeries.doc_type}
                        onChange={e => setNewSeries({ ...newSeries, doc_type: e.target.value })}
                      >
                        <option value="FAC" className="bg-zinc-900 text-white">Factura (FAC)</option>
                        <option value="PRO" className="bg-zinc-900 text-white">Factura Pro-forma (PRO)</option>
                        <option value="NC" className="bg-zinc-900 text-white">Nota de Crédito (NC)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-white/30 tracking-widest mb-2">Nome da Série (Ex: 2026)</label>
                      <input
                        type="text"
                        required
                        className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-gold-primary font-bold text-white"
                        value={newSeries.series_name}
                        onChange={e => setNewSeries({ ...newSeries, series_name: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowSeriesModal(false)}
                      className="flex-1 py-4 bg-white/5 text-white/20 rounded-3xl font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all border border-white/5"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-4 bg-gold-primary text-black rounded-3xl font-black uppercase text-[10px] tracking-widest hover:bg-gold-secondary shadow-xl shadow-gold-primary/10 transition-all active:scale-95"
                    >
                      Criar Série
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      ) : activeTab === 'docs' ? (
        <SystemDocumentation isAdmin={user?.role === 'admin' || user?.role === 'master'} />
      ) : (
        <div className="space-y-6">
          <div className="glass-panel p-8 rounded-[32px] shadow-sm border border-white/10">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2 uppercase tracking-tight italic">
                  <Database className="text-gold-primary" size={24} />
                  {dbState?.is_master_mode ? 'Diagnóstico Global do Sistema' : 'Diagnóstico da Empresa'}
                </h3>
                <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mt-1">
                  {dbState?.is_master_mode ? 'Visão completa de todas as instâncias e dados da plataforma' : 'Informações técnicas e estado operacional da sua conta'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border ${dbState?.db_status === 'Online' ? 'bg-gold-primary/10 text-gold-primary border-gold-primary/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                  <div className={`w-2 h-2 rounded-full ${dbState?.db_status === 'Online' ? 'bg-gold-primary animate-pulse' : 'bg-red-500'}`} />
                  DB {dbState?.db_status || 'OFFLINE'}
                </div>
                <div className="flex items-center gap-2 text-gold-primary bg-white/5 border border-white/10 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">
                  <Server size={14} /> {dbState?.system_status || 'OPERACIONAL'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="bg-white/5 p-6 rounded-3xl border border-white/10 gold-glow-hover transition-all">
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-3 italic">
                  {dbState?.is_master_mode ? 'UTILIZADORES TOTAIS' : 'UTILIZADORES ACTIVOS'}
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-black text-white italic">{dbState?.current_users || 0}</p>
                  {!dbState?.is_master_mode && <p className="text-white/20 font-black text-lg">/ {dbState?.user_limit || '---'}</p>}
                </div>
                <p className="text-[9px] text-gold-primary/50 font-black uppercase mt-2">
                  {dbState?.is_master_mode ? 'Contagem global da plataforma' : 'Limite do seu plano premium'}
                </p>
              </div>

              <div className="bg-white/5 p-6 rounded-3xl border border-white/10 gold-glow-hover transition-all">
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-3 italic">TABELAS GERIDAS</p>
                <p className="text-4xl font-black text-white italic">{dbState?.total_tables || 0}</p>
                <p className="text-[9px] text-gold-primary/50 font-black uppercase mt-2">Estrutura de dados activa</p>
              </div>

              <div className="bg-white/5 p-6 rounded-3xl border border-white/10 gold-glow-hover transition-all">
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-3 italic">ESTADO DO BANCO</p>
                <p className="text-2xl font-black text-gold-primary uppercase italic">{dbState?.is_master_mode ? 'INFRAESTRUTURA OK' : 'OPERACIONAL'}</p>
                <p className="text-[9px] text-gold-primary/50 font-black uppercase mt-2">Supabase Cloud + Edge Runtime</p>
              </div>
            </div>

            <div className="w-full h-px bg-white/5 mb-10" />

            <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-6 italic">RESUMO DE REGISTOS POR TABELA</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {dbState?.table_stats ? Object.entries(dbState.table_stats).map(([table, count]: any) => (
                <div key={table} className="bg-white/5 p-5 rounded-2xl border border-white/10 shadow-sm transition-all hover:border-gold-primary/30 group">
                  <p className="text-[9px] font-black text-gold-primary/40 uppercase tracking-widest mb-1 italic group-hover:text-gold-primary transition-colors">{table.replace(/_/g, ' ')}</p>
                  <p className="text-xl font-black text-white italic">{count}</p>
                </div>
              )) : (
                <div className="col-span-full py-12 text-center text-white/10 font-black uppercase tracking-widest text-[10px] animate-pulse italic">
                  SINCRONIZANDO ESTATÍSTICAS DO NÚCLEO...
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel border-gold-primary/20 p-12 rounded-[40px] text-white overflow-hidden relative shadow-3xl bg-bg-deep/40 mt-12">
            <div className="absolute top-0 right-0 w-80 h-80 bg-gold-primary/5 rounded-full blur-[120px] -mr-32 -mt-32 opacity-80 pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center gap-6 mb-10">
                <div className="p-5 bg-gold-primary/10 rounded-3xl border border-gold-primary/20">
                  <Download className="text-gold-primary" size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Exportar <span className="text-gold-gradient">Cloud Matrix</span></h3>
                  <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.4em] mt-1">Backup completo da instância relacional da plataforma</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                <div className="space-y-4">
                  <p className="text-sm font-bold text-white/40 leading-relaxed">
                    Isto irá gerar um ficheiro <span className="text-white/60 font-black italic">JSON de alta fidelidade</span> contendo todos os dados, configurações e histórico.
                  </p>
                  <ul className="space-y-3">
                    {['Schemas Relacionais', 'Metadados de Vendas', 'Registos Contabilísticos'].map(item => (
                      <li key={item} className="flex items-center gap-3 text-[10px] font-black uppercase text-gold-primary/60 tracking-widest">
                        <div className="w-1.5 h-1.5 rounded-full bg-gold-primary" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white/[0.02] border border-white/5 rounded-[32px] p-8 flex items-center justify-center">
                  <div className="text-center">
                    <Database size={40} className="text-white/10 mx-auto mb-4" />
                    <p className="text-[10px] font-black uppercase text-white/20 tracking-widest italic">Instância: Global SaaS</p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleExport}
                disabled={exporting}
                className="group relative flex items-center gap-4 bg-gold-gradient text-bg-deep px-12 py-5 rounded-[24px] font-black uppercase tracking-[0.3em] text-[11px] hover:scale-105 transition-all shadow-2xl shadow-gold-primary/20 active:scale-95 border border-white/10 overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                <span className="relative z-10 flex items-center gap-3">
                  {exporting ? <RefreshCw size={20} className="animate-spin text-bg-deep" /> : <Download size={20} />}
                  {exporting ? 'A SINCRONIZAR EXPORTAÇÃO...' : 'EXTRAIR MATRIZ DE DADOS'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
