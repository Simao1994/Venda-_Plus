import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Search, Users, X, CheckCircle2, AlertCircle, Phone, Mail } from 'lucide-react';

const initialForm = {
  nome: '', data_nascimento: '', telefone: '', email: '',
  numero_utente: '', alergias: '', historico_medicamentos: '',
};

export default function ClientesFarmacia() {
  const { token } = useAuth();
  const [clientes, setClientes] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/farmacia/clientes', { headers: { Authorization: `Bearer ${token}` } });
      setClientes(await res.json());
    } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/farmacia/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowModal(false);
        setFormData(initialForm);
        fetchData();
      }
    } finally { setSaving(false); }
  };

  const f = (key: string, val: any) => setFormData(p => ({ ...p, [key]: val }));

  const filtered = clientes.filter(c =>
    c.nome?.toLowerCase().includes(search.toLowerCase()) ||
    c.numero_utente?.toLowerCase().includes(search.toLowerCase()) ||
    c.telefone?.includes(search)
  );

  return (
    <div className="p-8 max-w-7xl mx-auto relative z-10">
      {/* Header */}
      <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
            Gestão de <span style={{ background: 'linear-gradient(135deg, #60a5fa, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Pacientes</span>
          </h1>
          <p className="text-white/40 font-black text-[10px] uppercase tracking-[0.3em] mt-2 italic">Cadastro e histórico clínico dos pacientes</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-all active:scale-95 shadow-2xl"
        >
          <Plus size={18} />
          Novo Paciente
        </button>
      </header>

      {/* Search */}
      <div className="glass-panel p-3 rounded-[32px] border border-white/5 mb-8 flex items-center gap-4 shadow-2xl">
        <div className="flex-1 relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-400/40 group-focus-within:text-blue-400 transition-colors" size={16} />
          <input
            type="text"
            placeholder="Pesquisar por nome, Nº utente ou telefone..."
            className="w-full pl-14 pr-6 py-4 bg-white/5 border border-white/5 rounded-2xl focus:bg-white/[0.08] focus:border-blue-500/30 focus:ring-4 focus:ring-blue-500/5 font-black text-[11px] text-white placeholder:text-white/20 outline-none transition-all uppercase tracking-[0.1em] shadow-inner"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <span className="text-[9px] font-black text-white/20 uppercase tracking-widest px-4">{filtered.length} pacientes</span>
      </div>

      {/* Table */}
      <div className="glass-panel rounded-[40px] border border-white/5 shadow-3xl overflow-hidden">
        <div className="p-8 border-b border-white/5 bg-white/[0.02]">
          <h2 className="font-black text-white uppercase tracking-widest text-sm italic flex items-center gap-4">
            <div className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_10px_#60a5fa]" />
            Ficha de Pacientes
          </h2>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          {loading ? (
            <div className="p-24 text-center">
              <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/[0.03] text-[9px] font-black text-white/30 uppercase tracking-[0.2em] border-b border-white/5">
                  <th className="px-8 py-6">Paciente</th>
                  <th className="px-8 py-6">Nº Utente</th>
                  <th className="px-8 py-6">Contactos</th>
                  <th className="px-8 py-6">Alergias</th>
                  <th className="px-8 py-6">Histórico</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-blue-500/[0.02] transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center border border-blue-500/20 shrink-0">
                          <Users size={20} />
                        </div>
                        <div>
                          <p className="font-black text-white text-xs uppercase tracking-tight group-hover:text-blue-400 transition-colors">{c.nome}</p>
                          <p className="text-[9px] font-black text-white/20 mt-1">Nasc: {c.data_nascimento || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">{c.numero_utente || '—'}</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        {c.telefone && (
                          <div className="flex items-center gap-2 text-[10px] font-black text-white/40">
                            <Phone size={10} className="text-blue-400/40" /> {c.telefone}
                          </div>
                        )}
                        {c.email && (
                          <div className="flex items-center gap-2 text-[10px] font-black text-white/30">
                            <Mail size={10} className="text-blue-400/40" /> {c.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      {c.alergias ? (
                        <span className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-red-500/20">
                          {c.alergias}
                        </span>
                      ) : (
                        <span className="text-[9px] font-black text-white/10 uppercase tracking-widest">Nenhuma</span>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-[10px] text-white/30 font-bold max-w-[200px] truncate">{c.historico_medicamentos || '—'}</p>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="px-8 py-24 text-center">
                      <p className="text-[10px] font-black text-white/10 uppercase tracking-[0.4em]">Nenhum paciente encontrado</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 bg-bg-deep/80 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
          <div className="glass-panel rounded-[40px] w-full max-w-2xl overflow-hidden shadow-2xl border border-white/10 relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

            <div className="p-10 border-b border-white/5 bg-blue-500/[0.02] flex justify-between items-start sticky top-0 z-10 glass-panel">
              <div>
                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                  Novo <span style={{ background: 'linear-gradient(135deg, #60a5fa, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Paciente</span>
                </h3>
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mt-2">Ficha de cadastro clínico</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-10 h-10 text-white/30 hover:text-white transition-colors border border-white/5 rounded-xl flex items-center justify-center hover:bg-white/5">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 grid grid-cols-2 gap-6">
              {/* Nome - full width */}
              <div className="col-span-2 glass-panel p-4 rounded-2xl border border-white/5 focus-within:border-blue-500/30 transition-all">
                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-2">Nome Completo *</label>
                <input required type="text" className="w-full bg-transparent border-none outline-none font-black text-white uppercase tracking-tight placeholder:text-white/10" placeholder="NOME DO PACIENTE" value={formData.nome} onChange={e => f('nome', e.target.value)} />
              </div>

              <div className="glass-panel p-4 rounded-2xl border border-white/5 focus-within:border-blue-500/30 transition-all">
                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-2">Data de Nascimento</label>
                <input type="date" className="w-full bg-transparent border-none outline-none font-black text-white/80 text-sm" value={formData.data_nascimento} onChange={e => f('data_nascimento', e.target.value)} />
              </div>

              <div className="glass-panel p-4 rounded-2xl border border-white/5 focus-within:border-blue-500/30 transition-all">
                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-2">Nº de Utente</label>
                <input type="text" className="w-full bg-transparent border-none outline-none font-black text-white tabular-nums tracking-widest placeholder:text-white/10" placeholder="000000" value={formData.numero_utente} onChange={e => f('numero_utente', e.target.value)} />
              </div>

              <div className="glass-panel p-4 rounded-2xl border border-white/5 focus-within:border-blue-500/30 transition-all">
                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-2">Telefone</label>
                <input type="text" className="w-full bg-transparent border-none outline-none font-black text-white tabular-nums tracking-widest placeholder:text-white/10" placeholder="923 000 000" value={formData.telefone} onChange={e => f('telefone', e.target.value)} />
              </div>

              <div className="glass-panel p-4 rounded-2xl border border-white/5 focus-within:border-blue-500/30 transition-all">
                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-2">Email</label>
                <input type="email" className="w-full bg-transparent border-none outline-none font-black text-white/80 text-sm placeholder:text-white/10" placeholder="email@exemplo.com" value={formData.email} onChange={e => f('email', e.target.value)} />
              </div>

              <div className="col-span-2 glass-panel p-4 rounded-2xl border border-white/5 focus-within:border-red-500/30 transition-all">
                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-2 flex items-center gap-2">
                  <AlertCircle size={12} className="text-red-400/50" /> Alergias (separadas por vírgula)
                </label>
                <input type="text" className="w-full bg-transparent border-none outline-none font-black text-red-400/80 uppercase tracking-tight placeholder:text-white/10" placeholder="EX: PENICILINA, AMENDOIM" value={formData.alergias} onChange={e => f('alergias', e.target.value)} />
              </div>

              <div className="col-span-2 glass-panel p-4 rounded-2xl border border-white/5 focus-within:border-blue-500/30 transition-all">
                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-2">Histórico de Medicamentos</label>
                <textarea
                  rows={3}
                  className="w-full bg-transparent border-none outline-none font-bold text-white/60 text-sm placeholder:text-white/10 resize-none"
                  placeholder="Lista de medicamentos utilizados pelo paciente..."
                  value={formData.historico_medicamentos}
                  onChange={e => f('historico_medicamentos', e.target.value)}
                />
              </div>

              <div className="col-span-2 flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white/30 border border-white/5 hover:bg-white/5 transition-all">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="flex-1 py-5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-all active:scale-95 shadow-2xl disabled:opacity-50">
                  {saving ? 'Guardando...' : 'Registar Paciente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
