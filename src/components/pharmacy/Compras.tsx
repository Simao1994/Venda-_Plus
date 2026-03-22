import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Search, ShoppingBag, Eye } from 'lucide-react';

export default function Compras() {
  const { token, user } = useAuth();
  const [compras, setCompras] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form states
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [medicamentos, setMedicamentos] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    fornecedor_id: '',
    numero_compra: '',
    data_compra: new Date().toISOString().split('T')[0],
    subtotal: 0,
    iva: 0,
    total: 0,
    itens: [] as any[]
  });

  useEffect(() => {
    fetchData();
    fetchAuxData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/farmacia/compras', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setCompras(data);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuxData = async () => {
    try {
      const [fornRes, medRes] = await Promise.all([
        fetch('/api/farmacia/fornecedores', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/farmacia/medicamentos', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setFornecedores(await fornRes.json());
      setMedicamentos(await medRes.json());
    } catch (error) {
      console.error("Erro ao carregar dados auxiliares", error);
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      itens: [...formData.itens, { medicamento_id: '', lote_id: '', quantidade: 1, preco_unitario: 0, total: 0 }]
    });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItens = [...formData.itens];
    newItens[index] = { ...newItens[index], [field]: value };
    
    // Recalculate item total
    if (field === 'quantidade' || field === 'preco_unitario') {
      newItens[index].total = newItens[index].quantidade * newItens[index].preco_unitario;
    }
    
    // Recalculate global totals
    const subtotal = newItens.reduce((sum, item) => sum + item.total, 0);
    const iva = subtotal * 0.14; // 14% IVA
    
    setFormData({
      ...formData,
      itens: newItens,
      subtotal,
      iva,
      total: subtotal + iva
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/farmacia/compras', {
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
        fornecedor_id: '', numero_compra: '', data_compra: new Date().toISOString().split('T')[0],
        subtotal: 0, iva: 0, total: 0, itens: []
      });
      fetchData();
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto relative z-10 animate-in fade-in duration-500">
      <div className="flex justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
            Entrada de <span className="text-gold-gradient">Compras</span>
          </h1>
          <p className="text-white/40 font-black text-[10px] uppercase tracking-[0.3em] mt-2 italic">Gestão de aquisições e entrada de stock farmacêutico</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-gold-primary to-gold-secondary text-bg-deep px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] transition-all active:scale-95 shadow-2xl"
        >
          <Plus size={18} />
          Nova Compra
        </button>
      </div>

      <div className="glass-panel rounded-[40px] border border-white/5 shadow-3xl overflow-hidden">
        <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gold-primary/10 text-gold-primary rounded-xl flex items-center justify-center border border-gold-primary/20">
              <ShoppingBag size={20} />
            </div>
            <h2 className="text-xs font-black text-white uppercase tracking-widest italic">Registo de Aquisições</h2>
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
                <th className="px-8 py-6">Nº Compra</th>
                <th className="px-8 py-6">Fornecedor</th>
                <th className="px-8 py-6">Data</th>
                <th className="px-8 py-6 text-right">Total</th>
                <th className="px-8 py-6 text-center">Status</th>
                <th className="px-8 py-6 text-right">Acções</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {compras.map(compra => (
                <tr key={compra.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 group-hover:border-gold-primary/20 transition-all">
                        <ShoppingBag size={20} className="text-white/20 group-hover:text-gold-primary transition-colors" />
                      </div>
                      <span className="font-black text-white text-xs uppercase tracking-tight group-hover:text-gold-primary transition-colors">{compra.numero_compra}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-[10px] font-black text-white/60 uppercase tracking-widest">{compra.fornecedor_nome}</td>
                  <td className="px-8 py-6 text-[10px] font-black text-white/40 uppercase tracking-widest">
                    {new Date(compra.data_compra).toLocaleDateString('pt-AO')}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <span className="font-black text-gold-primary tabular-nums text-sm italic">{compra.total?.toLocaleString()} {user?.currency}</span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="px-3 py-1.5 bg-gold-primary/10 text-gold-primary rounded-full text-[9px] font-black uppercase tracking-widest border border-gold-primary/20 shadow-[0_0_10px_rgba(212,175,55,0.1)]">
                      {compra.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="w-10 h-10 bg-white/5 text-white/30 hover:text-gold-primary hover:border-gold-primary/30 border border-white/5 rounded-xl flex items-center justify-center ml-auto transition-all">
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {compras.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="py-32 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-10">
                      <ShoppingBag size={48} />
                      <p className="text-[10px] font-black uppercase tracking-[0.4em]">Nenhuma compra registada</p>
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
          <div className="glass-panel rounded-[40px] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border border-white/10 relative flex flex-col">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-gold-primary/40 to-transparent" />
            
            <div className="p-10 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                  Registar <span className="text-gold-gradient">Nova Compra</span>
                </h3>
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mt-2">Entrada de stock e lotes farmacêuticos</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-12 h-12 text-white/30 hover:text-white transition-colors border border-white/5 rounded-2xl flex items-center justify-center hover:bg-white/5">
                &times;
              </button>
            </div>
            
            <div className="p-10 overflow-y-auto flex-1 custom-scrollbar">
              <form id="compra-form" onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-3 gap-6">
                  <div className="glass-panel p-5 rounded-3xl border border-white/5 focus-within:border-gold-primary/30 transition-all">
                    <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-3">Fornecedor</label>
                    <select
                      required
                      className="w-full bg-transparent border-none outline-none font-black text-white uppercase tracking-tight appearance-none cursor-pointer"
                      value={formData.fornecedor_id}
                      onChange={e => setFormData({ ...formData, fornecedor_id: e.target.value })}
                    >
                      <option value="" className="bg-bg-deep">Selecione...</option>
                      {fornecedores.map(f => (
                        <option key={f.id} value={f.id} className="bg-bg-deep">{f.nome_empresa}</option>
                      ))}
                    </select>
                  </div>
                  <div className="glass-panel p-5 rounded-3xl border border-white/5 focus-within:border-gold-primary/30 transition-all">
                    <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-3">Nº da Fatura/Compra</label>
                    <input
                      type="text"
                      required
                      className="w-full bg-transparent border-none outline-none font-black text-white uppercase tracking-tight placeholder:text-white/10"
                      placeholder="FAT-0001"
                      value={formData.numero_compra}
                      onChange={e => setFormData({ ...formData, numero_compra: e.target.value })}
                    />
                  </div>
                  <div className="glass-panel p-5 rounded-3xl border border-white/5 focus-within:border-gold-primary/30 transition-all">
                    <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-3">Data da Compra</label>
                    <input
                      type="date"
                      required
                      className="w-full bg-transparent border-none outline-none font-black text-white/80 text-sm"
                      value={formData.data_compra}
                      onChange={e => setFormData({ ...formData, data_compra: e.target.value })}
                    />
                  </div>
                </div>

                <div className="border-t border-white/5 pt-6">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="font-black text-white text-sm uppercase tracking-widest italic flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-gold-primary shadow-[0_0_8px_#D4AF37]" />
                      Itens da Compra
                    </h4>
                    <button
                      type="button"
                      onClick={addItem}
                      className="px-5 py-2.5 bg-gold-primary/10 text-gold-primary border border-gold-primary/20 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gold-primary/20 transition-all"
                    >
                      + Adicionar Item
                    </button>
                  </div>

                  <div className="space-y-4">
                    {formData.itens.map((item, index) => (
                      <div key={index} className="glass-panel flex gap-4 items-end p-6 rounded-3xl border border-white/5">
                        <div className="flex-1">
                          <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-2">Medicamento</label>
                          <select
                            required
                            className="w-full bg-transparent border-none outline-none font-black text-white uppercase tracking-tight appearance-none cursor-pointer text-sm"
                            value={item.medicamento_id}
                            onChange={e => updateItem(index, 'medicamento_id', e.target.value)}
                          >
                            <option value="" className="bg-bg-deep">Selecione...</option>
                            {medicamentos.map(m => (
                              <option key={m.id} value={m.id} className="bg-bg-deep">{m.nome_medicamento}</option>
                            ))}
                          </select>
                        </div>
                        <div className="w-28">
                          <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-2">ID Lote</label>
                          <input type="text" required className="w-full bg-transparent border-b border-white/10 outline-none font-black text-white uppercase tabular-nums text-sm py-1" value={item.lote_id} onChange={e => updateItem(index, 'lote_id', e.target.value)} />
                        </div>
                        <div className="w-24">
                          <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-2">Qtd</label>
                          <input type="number" required min="1" className="w-full bg-transparent border-b border-white/10 outline-none font-black text-white tabular-nums text-sm py-1" value={item.quantidade} onChange={e => updateItem(index, 'quantidade', parseInt(e.target.value))} />
                        </div>
                        <div className="w-32">
                          <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-2">Preço Unit.</label>
                          <input type="number" required step="0.01" className="w-full bg-transparent border-b border-white/10 outline-none font-black text-white tabular-nums text-sm py-1" value={item.preco_unitario} onChange={e => updateItem(index, 'preco_unitario', parseFloat(e.target.value))} />
                        </div>
                        <div className="w-32">
                          <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-2">Total</label>
                          <input type="text" disabled className="w-full bg-transparent border-b border-gold-primary/20 outline-none font-black text-gold-primary tabular-nums italic text-sm py-1" value={item.total.toLocaleString()} />
                        </div>
                      </div>
                    ))}
                    {formData.itens.length === 0 && (
                      <div className="text-center py-12 text-white/10 border-2 border-dashed border-white/5 rounded-3xl">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em]">Nenhum item adicionado à compra</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-white/5 pt-6 flex justify-end">
                  <div className="glass-panel p-6 rounded-3xl border border-white/5 w-72 space-y-3">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/40">
                      <span>Subtotal:</span>
                      <span>{formData.subtotal.toLocaleString()} {user?.currency}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/40">
                      <span>IVA (14%):</span>
                      <span>{formData.iva.toLocaleString()} {user?.currency}</span>
                    </div>
                    <div className="flex justify-between text-sm font-black text-white pt-3 border-t border-white/5">
                      <span>Total:</span>
                      <span className="text-gold-gradient italic text-lg">{formData.total.toLocaleString()} {user?.currency}</span>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-8 border-t border-white/5 bg-white/[0.02] flex justify-end gap-6">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white/30 border border-white/5 hover:bg-white/5 transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="compra-form"
                disabled={formData.itens.length === 0}
                className="px-10 py-5 bg-gradient-to-r from-gold-primary to-gold-secondary text-bg-deep rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] transition-all active:scale-95 shadow-2xl disabled:opacity-30"
              >
                Salvar Compra
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

