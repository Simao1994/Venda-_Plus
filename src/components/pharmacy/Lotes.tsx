import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Search, Calendar, Boxes, AlertCircle, Trash2 } from 'lucide-react';

export default function Lotes() {
  const { token } = useAuth();
  const [lotes, setLotes] = useState<any[]>([]);
  const [medicamentos, setMedicamentos] = useState<any[]>([]);
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    medicamento_id: '',
    numero_lote: '',
    data_fabricacao: '',
    data_validade: '',
    quantidade_inicial: '',
    fornecedor_id: '',
    custo_unitario: '',
    localizacao_armazenamento: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [lotesRes, medsRes, fornecRes] = await Promise.all([
        fetch('/api/farmacia/lotes', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/farmacia/medicamentos', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/farmacia/fornecedores', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const [lotesData, medsData, fornecData] = await Promise.all([
        lotesRes.json(),
        medsRes.json(),
        fornecRes.json()
      ]);

      setLotes(lotesData);
      setMedicamentos(medsData);
      setFornecedores(fornecData);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/farmacia/lotes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      setShowModal(false);
      setFormData({
        medicamento_id: '', numero_lote: '', data_fabricacao: '',
        data_validade: '', quantidade_inicial: '', fornecedor_id: '',
        custo_unitario: '', localizacao_armazenamento: ''
      });
      fetchData();
    }
  };

  const isExpired = (date: string) => new Date(date) < new Date();
  const isExpiringSoon = (date: string) => {
    const ninetyDays = 90 * 24 * 60 * 60 * 1000;
    const diff = new Date(date).getTime() - new Date().getTime();
    return diff > 0 && diff < ninetyDays;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto relative z-10 animate-in fade-in duration-500">
      <div className="flex justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
            Lotes & <span className="text-gold-gradient">Validades</span>
          </h1>
          <p className="text-white/40 font-black text-[10px] uppercase tracking-[0.3em] mt-2 italic">Controlo de entrada de medicamentos e monitorização de expiração</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-gold-primary to-gold-secondary text-bg-deep px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] transition-all active:scale-95 shadow-2xl"
        >
          <Plus size={18} />
          Registrar Novo Lote
        </button>
      </div>

      <div className="glass-panel rounded-[40px] border border-white/5 shadow-3xl overflow-hidden">
        <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gold-primary/10 text-gold-primary rounded-xl flex items-center justify-center border border-gold-primary/20">
              <Boxes size={20} />
            </div>
            <h2 className="text-xs font-black text-white uppercase tracking-widest italic">Inventário de Lotes</h2>
          </div>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-gold-primary transition-colors" size={14} />
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
                <th className="px-8 py-6">Medicamento / Lote</th>
                <th className="px-8 py-6 text-center">Validade</th>
                <th className="px-8 py-6 text-center">Quantidade</th>
                <th className="px-8 py-6">Fornecedor</th>
                <th className="px-8 py-6 text-center">Estado</th>
                <th className="px-8 py-6 text-right">Acções</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {lotes.map(lote => (
                <tr key={lote.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 group-hover:border-gold-primary/20 transition-all">
                        <Boxes size={20} className="text-white/20 group-hover:text-gold-primary transition-colors" />
                      </div>
                      <div>
                        <div className="font-black text-white text-xs uppercase tracking-tight group-hover:text-gold-primary transition-colors">{lote.nome_medicamento}</div>
                        <div className="text-[9px] font-black text-white/20 uppercase tracking-widest mt-1 italic font-mono">Lote: {lote.numero_lote}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className={`font-black text-sm tabular-nums ${isExpired(lote.data_validade) ? 'text-red-400' : isExpiringSoon(lote.data_validade) ? 'text-amber-400' : 'text-white/70'}`}>
                      {new Date(lote.data_validade).toLocaleDateString('pt-AO')}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className="font-black text-white text-sm tabular-nums">{lote.quantidade_atual}</div>
                    <div className="text-[9px] text-white/20 font-black uppercase tracking-widest mt-0.5">inicial: {lote.quantidade_inicial}</div>
                  </td>
                  <td className="px-8 py-6 text-[10px] font-black text-white/40 uppercase tracking-widest">
                    {lote.fornecedor_nome || '—'}
                  </td>
                  <td className="px-8 py-6 text-center">
                    {isExpired(lote.data_validade) ? (
                      <span className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]">Expirado</span>
                    ) : isExpiringSoon(lote.data_validade) ? (
                      <span className="px-3 py-1.5 bg-amber-500/10 text-amber-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]">Breve</span>
                    ) : (
                      <span className="px-3 py-1.5 bg-gold-primary/10 text-gold-primary rounded-full text-[9px] font-black uppercase tracking-widest border border-gold-primary/20 shadow-[0_0_10px_rgba(212,175,55,0.1)]">Válido</span>
                    )}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="w-10 h-10 bg-white/5 text-white/30 hover:text-red-400 hover:border-red-400/30 border border-white/5 rounded-xl flex items-center justify-center ml-auto transition-all">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {lotes.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="py-32 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-10">
                      <Boxes size={48} />
                      <p className="text-[10px] font-black uppercase tracking-[0.4em]">Nenhum lote registado</p>
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
            
            <div className="p-10 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                  Entrada de <span className="text-gold-gradient">Lote</span>
                </h3>
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mt-2">Registo de novo lote de medicamentos</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-12 h-12 text-white/30 hover:text-white transition-colors border border-white/5 rounded-2xl flex items-center justify-center hover:bg-white/5">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 grid grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="col-span-2 glass-panel p-5 rounded-3xl border border-white/5 focus-within:border-gold-primary/30 transition-all">
                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-3">Medicamento</label>
                <select required className="w-full bg-transparent border-none outline-none font-black text-white uppercase tracking-tight appearance-none cursor-pointer" value={formData.medicamento_id} onChange={e => setFormData({ ...formData, medicamento_id: e.target.value })}>
                  <option value="" className="bg-bg-deep">Selecione o medicamento...</option>
                  {medicamentos.map(m => (<option key={m.id} value={m.id} className="bg-bg-deep">{m.nome_medicamento}</option>))}
                </select>
              </div>

              <div className="glass-panel p-5 rounded-3xl border border-white/5 focus-within:border-gold-primary/30 transition-all">
                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-3">Número do Lote</label>
                <input type="text" required className="w-full bg-transparent border-none outline-none font-black text-white uppercase tracking-tight placeholder:text-white/10" placeholder="LOT-0001" value={formData.numero_lote} onChange={e => setFormData({ ...formData, numero_lote: e.target.value })} />
              </div>

              <div className="glass-panel p-5 rounded-3xl border border-white/5 focus-within:border-gold-primary/30 transition-all">
                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-3">Fornecedor</label>
                <select className="w-full bg-transparent border-none outline-none font-black text-white uppercase tracking-tight appearance-none cursor-pointer" value={formData.fornecedor_id} onChange={e => setFormData({ ...formData, fornecedor_id: e.target.value })}>
                  <option value="" className="bg-bg-deep">Selecione o fornecedor...</option>
                  {fornecedores.map(f => (<option key={f.id} value={f.id} className="bg-bg-deep">{f.nome_empresa}</option>))}
                </select>
              </div>

              <div className="glass-panel p-5 rounded-3xl border border-white/5 focus-within:border-gold-primary/30 transition-all">
                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-3">Data Fabricação</label>
                <input type="date" className="w-full bg-transparent border-none outline-none font-black text-white/80 text-sm" value={formData.data_fabricacao} onChange={e => setFormData({ ...formData, data_fabricacao: e.target.value })} />
              </div>

              <div className="glass-panel p-5 rounded-3xl border border-white/5 focus-within:border-gold-primary/30 transition-all">
                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-3">Data Validade *</label>
                <input type="date" required className="w-full bg-transparent border-none outline-none font-black text-white/80 text-sm" value={formData.data_validade} onChange={e => setFormData({ ...formData, data_validade: e.target.value })} />
              </div>

              <div className="glass-panel p-5 rounded-3xl border border-white/5 focus-within:border-gold-primary/30 transition-all">
                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-3">Quantidade Inicial *</label>
                <input type="number" required min="1" className="w-full bg-transparent border-none outline-none font-black text-white tabular-nums tracking-widest placeholder:text-white/10" placeholder="0" value={formData.quantidade_inicial} onChange={e => setFormData({ ...formData, quantidade_inicial: e.target.value })} />
              </div>

              <div className="glass-panel p-5 rounded-3xl border border-white/5 focus-within:border-gold-primary/30 transition-all">
                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-3">Custo Unitário</label>
                <input type="number" step="0.01" className="w-full bg-transparent border-none outline-none font-black text-white tabular-nums tracking-widest placeholder:text-white/10" placeholder="0.00" value={formData.custo_unitario} onChange={e => setFormData({ ...formData, custo_unitario: e.target.value })} />
              </div>

              <div className="col-span-2 glass-panel p-5 rounded-3xl border border-white/5 focus-within:border-gold-primary/30 transition-all">
                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-3">Localização no Armazém</label>
                <input type="text" className="w-full bg-transparent border-none outline-none font-black text-white uppercase tracking-tight placeholder:text-white/10 italic" placeholder="EX: CORREDOR A, PRATELEIRA 4" value={formData.localizacao_armazenamento} onChange={e => setFormData({ ...formData, localizacao_armazenamento: e.target.value })} />
              </div>

              <div className="col-span-2 flex justify-end gap-6 mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white/30 border border-white/5 hover:bg-white/5 transition-all">Cancelar</button>
                <button type="submit" className="px-10 py-5 bg-gradient-to-r from-gold-primary to-gold-secondary text-bg-deep rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] transition-all active:scale-95 shadow-2xl">Confirmar Entrada</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

