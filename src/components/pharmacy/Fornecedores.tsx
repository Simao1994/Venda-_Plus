import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Search, Edit2, Trash2, Truck } from 'lucide-react';

export default function Fornecedores() {
  const { token } = useAuth();
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    nome_empresa: '',
    nif: '',
    telefone: '',
    email: '',
    endereco: '',
    licenca_sanitaria: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/farmacia/fornecedores', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setFornecedores(data);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/farmacia/fornecedores', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      setShowModal(false);
      setFormData({ nome_empresa: '', nif: '', telefone: '', email: '', endereco: '', licenca_sanitaria: '' });
      fetchData();
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto relative z-10 animate-in fade-in duration-500">
      <div className="flex justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
            Rede de <span className="text-gold-gradient">Fornecedores</span>
          </h1>
          <p className="text-white/40 font-black text-[10px] uppercase tracking-[0.3em] mt-2 italic">Gestão estratégica de laboratórios e parceiros</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-gold-primary to-gold-secondary text-bg-deep px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] transition-all active:scale-95 shadow-2xl"
        >
          <Plus size={18} />
          Novo Fornecedor
        </button>
      </div>

      <div className="glass-panel rounded-[40px] border border-white/5 shadow-3xl overflow-hidden">
        <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gold-primary/10 text-gold-primary rounded-xl flex items-center justify-center border border-gold-primary/20 shadow-[0_0_15px_rgba(212,175,55,0.1)]">
              <Truck size={20} />
            </div>
            <h2 className="text-xs font-black text-white uppercase tracking-widest italic">Parceiros Registados</h2>
          </div>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-gold-primary transition-colors" size={16} />
            <input
              type="text"
              placeholder="PESQUISAR..."
              className="pl-12 pr-6 py-2.5 bg-white/5 border border-white/5 rounded-xl text-[10px] font-black text-white uppercase tracking-widest focus:border-gold-primary/30 outline-none w-64 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead className="bg-white/[0.03] text-[9px] font-black text-white/20 uppercase tracking-[0.2em] border-b border-white/5">
              <tr>
                <th className="px-8 py-6">Entidade Corporativa</th>
                <th className="px-8 py-6">Contactos</th>
                <th className="px-8 py-6">Licença Sanitária</th>
                <th className="px-8 py-6 text-center">Status</th>
                <th className="px-8 py-6 text-right">Acções</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {fornecedores.map(forn => (
                <tr key={forn.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 group-hover:border-gold-primary/20 transition-all">
                        <Truck size={20} className="text-white/20 group-hover:text-gold-primary transition-colors" />
                      </div>
                      <div>
                        <div className="font-black text-white text-xs uppercase tracking-tight group-hover:text-gold-primary transition-colors">{forn.nome_empresa}</div>
                        <div className="text-[9px] font-black text-white/20 uppercase tracking-widest mt-1 italic">NIF: {forn.nif}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-[10px] font-black text-white/60 uppercase tracking-widest">{forn.telefone}</div>
                    <div className="text-[9px] font-black text-white/20 lowercase tracking-widest mt-0.5">{forn.email}</div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-tighter italic">
                      {forn.licenca_sanitaria || 'Não Informada'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="px-3 py-1.5 bg-gold-primary/10 text-gold-primary rounded-full text-[9px] font-black uppercase tracking-widest border border-gold-primary/20 shadow-[0_0_15px_rgba(212,175,55,0.1)]">
                      {forn.status || 'Ativo'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-3">
                      <button className="w-10 h-10 bg-white/5 text-white/30 hover:text-gold-primary hover:border-gold-primary/30 border border-white/5 rounded-xl flex items-center justify-center transition-all">
                        <Edit2 size={16} />
                      </button>
                      <button className="w-10 h-10 bg-white/5 text-white/30 hover:text-red-400 hover:border-red-400/30 border border-white/5 rounded-xl flex items-center justify-center transition-all">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {fornecedores.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="py-32 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-10">
                      <Truck size={48} />
                      <p className="text-[10px] font-black uppercase tracking-[0.4em]">Nenhum fornecedor registado</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-bg-deep/80 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
          <div className="glass-panel rounded-[40px] w-full max-w-2xl overflow-hidden shadow-2xl border border-white/10 relative">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-gold-primary/40 to-transparent" />
            
            <div className="p-10 border-b border-white/5 bg-white/[0.02] flex justify-between items-center sticky top-0 z-10 glass-panel">
              <div>
                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                  Registar <span className="text-gold-gradient">Fornecedor</span>
                </h3>
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mt-2">Cadastro de laboratório e logística</p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="w-12 h-12 text-white/30 hover:text-white transition-colors border border-white/5 rounded-2xl flex items-center justify-center hover:bg-white/5"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 grid grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="col-span-2 glass-panel p-5 rounded-3xl border border-white/5 focus-within:border-gold-primary/30 transition-all">
                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-3">Nome da Empresa</label>
                <input
                  type="text"
                  required
                  className="w-full bg-transparent border-none outline-none font-black text-white uppercase tracking-tight placeholder:text-white/10"
                  placeholder="NOME CORPORATIVO"
                  value={formData.nome_empresa}
                  onChange={e => setFormData({ ...formData, nome_empresa: e.target.value })}
                />
              </div>

              <div className="glass-panel p-5 rounded-3xl border border-white/5 focus-within:border-gold-primary/30 transition-all">
                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-3">NIF</label>
                <input
                  type="text"
                  className="w-full bg-transparent border-none outline-none font-black text-white tabular-nums tracking-widest placeholder:text-white/10"
                  placeholder="000000000"
                  value={formData.nif}
                  onChange={e => setFormData({ ...formData, nif: e.target.value })}
                />
              </div>

              <div className="glass-panel p-5 rounded-3xl border border-white/5 focus-within:border-gold-primary/30 transition-all">
                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-3">Licença Sanitária</label>
                <input
                  type="text"
                  className="w-full bg-transparent border-none outline-none font-black text-white uppercase tracking-tighter placeholder:text-white/10"
                  placeholder="Nº ALVARÁ"
                  value={formData.licenca_sanitaria}
                  onChange={e => setFormData({ ...formData, licenca_sanitaria: e.target.value })}
                />
              </div>

              <div className="glass-panel p-5 rounded-3xl border border-white/5 focus-within:border-gold-primary/30 transition-all">
                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-3">Telefone</label>
                <input
                  type="text"
                  className="w-full bg-transparent border-none outline-none font-black text-white tabular-nums tracking-widest placeholder:text-white/10"
                  placeholder="9XX XXX XXX"
                  value={formData.telefone}
                  onChange={e => setFormData({ ...formData, telefone: e.target.value })}
                />
              </div>

              <div className="glass-panel p-5 rounded-3xl border border-white/5 focus-within:border-gold-primary/30 transition-all">
                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-3">Email</label>
                <input
                  type="email"
                  className="w-full bg-transparent border-none outline-none font-black text-white/60 text-sm lowercase tracking-tight placeholder:text-white/10"
                  placeholder="geral@empresa.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="col-span-2 glass-panel p-5 rounded-3xl border border-white/5 focus-within:border-gold-primary/30 transition-all">
                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-3">Endereço Fiscal</label>
                <input
                  type="text"
                  className="w-full bg-transparent border-none outline-none font-black text-white uppercase tracking-tight placeholder:text-white/10 italic"
                  placeholder="LOCALIZAÇÃO DA SEDE"
                  value={formData.endereco}
                  onChange={e => setFormData({ ...formData, endereco: e.target.value })}
                />
              </div>

              <div className="col-span-2 flex justify-end gap-6 mt-10">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white/30 border border-white/5 hover:bg-white/5 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-10 py-5 bg-gradient-to-r from-gold-primary to-gold-secondary text-bg-deep rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] transition-all active:scale-95 shadow-2xl"
                >
                  Salvar Fornecedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
