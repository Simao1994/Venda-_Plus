import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Search, FileSignature, CheckCircle2, Clock, Camera, Trash2, PlusCircle, X } from 'lucide-react';

export default function Receitas() {
  const { token } = useAuth();
  const [receitas, setReceitas] = useState<any[]>([]);
  const [medicamentos, setMedicamentos] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    paciente_nome: '',
    medico_nome: '',
    numero_ordem_medico: '',
    hospital: '',
    data_receita: '',
    imagem_receita: '',
    itens: [] as { medicamento_id: number; quantidade: number; nome?: string }[]
  });

  useEffect(() => {
    fetchData();
    fetchMedicamentos();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/farmacia/receitas', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setReceitas(data);
    } finally {
      setLoading(false);
    }
  };

  const fetchMedicamentos = async () => {
    try {
      const res = await fetch('/api/farmacia/medicamentos', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setMedicamentos(data);
    } catch (error) {
      console.error('Erro ao buscar medicamentos:', error);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, imagem_receita: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      itens: [...formData.itens, { medicamento_id: 0, quantidade: 1 }]
    });
  };

  const removeItem = (index: number) => {
    const newItens = [...formData.itens];
    newItens.splice(index, 1);
    setFormData({ ...formData, itens: newItens });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItens = [...formData.itens];
    newItens[index] = { ...newItens[index], [field]: value };
    setFormData({ ...formData, itens: newItens });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.itens.length === 0) {
      alert('Adicione pelo menos um medicamento à receita.');
      return;
    }
    const res = await fetch('/api/farmacia/receitas', {
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
        paciente_nome: '', 
        medico_nome: '', 
        numero_ordem_medico: '', 
        hospital: '', 
        data_receita: '', 
        imagem_receita: '',
        itens: []
      });
      fetchData();
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto relative z-10 animate-in fade-in duration-500">
      <div className="flex justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
            Receitas <span className="text-gold-gradient">Médicas</span>
          </h1>
          <p className="text-white/40 font-black text-[10px] uppercase tracking-[0.3em] mt-2 italic">Gestão e validação de prescrições farmacêuticas</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-gold-primary to-gold-secondary text-bg-deep px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] transition-all active:scale-95 shadow-2xl"
        >
          <Plus size={18} />
          Registar Receita
        </button>
      </div>

      <div className="glass-panel rounded-[40px] border border-white/5 shadow-3xl overflow-hidden">
        <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gold-primary/10 text-gold-primary rounded-xl flex items-center justify-center border border-gold-primary/20">
              <FileSignature size={20} />
            </div>
            <h2 className="text-xs font-black text-white uppercase tracking-widest italic">Registo de Prescrições</h2>
          </div>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-gold-primary transition-colors" size={14} />
            <input type="text" placeholder="PESQUISAR..." className="pl-12 pr-6 py-2.5 bg-white/5 border border-white/5 rounded-xl text-[10px] font-black text-white uppercase tracking-widest focus:border-gold-primary/30 outline-none w-64 transition-all" />
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead className="bg-white/[0.03] text-[9px] font-black text-white/20 uppercase tracking-[0.2em] border-b border-white/5">
              <tr>
                <th className="px-8 py-6">Paciente</th>
                <th className="px-8 py-6">Médico / Hospital</th>
                <th className="px-8 py-6">Data</th>
                <th className="px-8 py-6 text-center">Estado</th>
                <th className="px-8 py-6 text-right">Acções</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {receitas.map(receita => (
                <tr key={receita.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 group-hover:border-gold-primary/20 transition-all">
                        <FileSignature size={20} className="text-white/20 group-hover:text-gold-primary transition-colors" />
                      </div>
                      <span className="font-black text-white text-xs uppercase tracking-tight group-hover:text-gold-primary transition-colors">{receita.paciente_nome}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="font-black text-white/60 text-[10px] uppercase tracking-widest">Dr(a). {receita.medico_nome}</div>
                    <div className="text-[9px] font-black text-white/20 mt-1 italic">{receita.hospital} • Ordem: {receita.numero_ordem_medico}</div>
                  </td>
                  <td className="px-8 py-6 text-[10px] font-black text-white/40 uppercase tracking-widest">
                    {new Date(receita.data_receita).toLocaleDateString('pt-AO')}
                  </td>
                  <td className="px-8 py-6 text-center">
                    {receita.status === 'pendente' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-amber-500/20">
                        <Clock size={10} /> Pendente
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gold-primary/10 text-gold-primary rounded-full text-[9px] font-black uppercase tracking-widest border border-gold-primary/20">
                        <CheckCircle2 size={10} /> Aviada
                      </span>
                    )}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="text-[9px] font-black text-gold-primary/50 hover:text-gold-primary uppercase tracking-widest transition-colors">
                      Ver Detalhes
                    </button>
                  </td>
                </tr>
              ))}
              {receitas.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="py-32 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-10">
                      <FileSignature size={48} />
                      <p className="text-[10px] font-black uppercase tracking-[0.4em]">Nenhuma receita registada</p>
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
          <div className="glass-panel rounded-[40px] w-full max-w-3xl overflow-hidden shadow-2xl border border-white/10 relative max-h-[90vh] flex flex-col">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-gold-primary/40 to-transparent" />
            
            <div className="p-10 border-b border-white/5 bg-white/[0.02] flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                  Registar <span className="text-gold-gradient">Receita Médica</span>
                </h3>
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mt-2">Prescrição e medicamentos associados</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-12 h-12 text-white/30 hover:text-white transition-colors border border-white/5 rounded-2xl flex items-center justify-center hover:bg-white/5">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 overflow-y-auto custom-scrollbar space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2 glass-panel p-5 rounded-3xl border border-white/5 focus-within:border-gold-primary/30 transition-all">
                  <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-3">Nome do Paciente *</label>
                  <input type="text" required className="w-full bg-transparent border-none outline-none font-black text-white uppercase tracking-tight placeholder:text-white/10" placeholder="NOME COMPLETO" value={formData.paciente_nome} onChange={e => setFormData({ ...formData, paciente_nome: e.target.value })} />
                </div>
                <div className="glass-panel p-5 rounded-3xl border border-white/5 focus-within:border-gold-primary/30 transition-all">
                  <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-3">Nome do Médico *</label>
                  <input type="text" required className="w-full bg-transparent border-none outline-none font-black text-white uppercase tracking-tight placeholder:text-white/10" placeholder="DR(A). NOME" value={formData.medico_nome} onChange={e => setFormData({ ...formData, medico_nome: e.target.value })} />
                </div>
                <div className="glass-panel p-5 rounded-3xl border border-white/5 focus-within:border-gold-primary/30 transition-all">
                  <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-3">Nº Ordem dos Médicos</label>
                  <input type="text" className="w-full bg-transparent border-none outline-none font-black text-white tabular-nums tracking-widest placeholder:text-white/10" placeholder="OM-0000" value={formData.numero_ordem_medico} onChange={e => setFormData({ ...formData, numero_ordem_medico: e.target.value })} />
                </div>
                <div className="glass-panel p-5 rounded-3xl border border-white/5 focus-within:border-gold-primary/30 transition-all">
                  <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-3">Hospital / Clínica</label>
                  <input type="text" className="w-full bg-transparent border-none outline-none font-black text-white uppercase tracking-tight placeholder:text-white/10" placeholder="NOME DA INSTITUIÇÃO" value={formData.hospital} onChange={e => setFormData({ ...formData, hospital: e.target.value })} />
                </div>
                <div className="glass-panel p-5 rounded-3xl border border-white/5 focus-within:border-gold-primary/30 transition-all">
                  <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-3">Data da Receita *</label>
                  <input type="date" required className="w-full bg-transparent border-none outline-none font-black text-white/80 text-sm" value={formData.data_receita} onChange={e => setFormData({ ...formData, data_receita: e.target.value })} />
                </div>
              </div>

              {/* Image Upload */}
              <div className="glass-panel p-5 rounded-3xl border border-white/5 focus-within:border-gold-primary/30 transition-all">
                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-4">Imagem da Receita</label>
                <div className="flex items-center gap-6">
                  <label className="cursor-pointer flex items-center gap-2.5 px-6 py-3 bg-white/5 border border-white/5 text-white/40 rounded-2xl hover:border-gold-primary/30 hover:text-gold-primary transition-all text-[10px] font-black uppercase tracking-widest">
                    <Camera size={16} />
                    <span>Carregar Foto</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </label>
                  {formData.imagem_receita && (
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/10">
                      <img src={formData.imagem_receita} alt="Receita" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setFormData({ ...formData, imagem_receita: '' })} className="absolute top-0 right-0 bg-red-500/80 backdrop-blur-sm text-white p-1 rounded-bl-lg">
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Medications */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-black text-white text-sm uppercase tracking-widest italic flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-gold-primary shadow-[0_0_8px_#D4AF37]" />
                    Medicamentos Prescritos
                  </h4>
                  <button type="button" onClick={addItem} className="flex items-center gap-2 px-5 py-2.5 bg-gold-primary/10 text-gold-primary border border-gold-primary/20 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gold-primary/20 transition-all">
                    <PlusCircle size={14} />
                    Adicionar
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.itens.map((item, index) => (
                    <div key={index} className="glass-panel flex gap-4 items-end p-5 rounded-3xl border border-white/5">
                      <div className="flex-1">
                        <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-2">Medicamento</label>
                        <select required className="w-full bg-transparent border-none outline-none font-black text-white uppercase tracking-tight appearance-none cursor-pointer text-sm" value={item.medicamento_id} onChange={e => updateItem(index, 'medicamento_id', parseInt(e.target.value))}>
                          <option value="" className="bg-bg-deep">Seleccione...</option>
                          {medicamentos.map(m => (<option key={m.id} value={m.id} className="bg-bg-deep">{m.nome} ({m.dosagem})</option>))}
                        </select>
                      </div>
                      <div className="w-24">
                        <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-2">Qtd</label>
                        <input type="number" min="1" required className="w-full bg-transparent border-b border-white/10 outline-none font-black text-white tabular-nums text-sm py-1" value={item.quantidade} onChange={e => updateItem(index, 'quantidade', parseInt(e.target.value))} />
                      </div>
                      <button type="button" onClick={() => removeItem(index)} className="w-10 h-10 bg-red-500/10 text-red-400/50 hover:text-red-400 border border-red-500/10 rounded-xl flex items-center justify-center transition-all">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {formData.itens.length === 0 && (
                    <div className="text-center py-10 border-2 border-dashed border-white/5 rounded-3xl">
                      <p className="text-[10px] font-black text-white/10 uppercase tracking-[0.4em]">Nenhum medicamento adicionado</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-6 pt-4 border-t border-white/5">
                <button type="button" onClick={() => setShowModal(false)} className="px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white/30 border border-white/5 hover:bg-white/5 transition-all">
                  Cancelar
                </button>
                <button type="submit" className="px-10 py-5 bg-gradient-to-r from-gold-primary to-gold-secondary text-bg-deep rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] transition-all active:scale-95 shadow-2xl">
                  Salvar Receita
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

