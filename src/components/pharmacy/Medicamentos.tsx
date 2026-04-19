import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Search, Pill, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../../lib/api';

const FORMAS = ['Comprimido', 'Cápsula', 'Xarope', 'Injetável', 'Pomada', 'Gotas', 'Supositório'];

const initialForm = {
  nome_medicamento: '',
  nome_generico: '',
  codigo_barras: '',
  categoria_terapeutica: '',
  forma_farmaceutica: '',
  dosagem: '',
  laboratorio: '',
  necessita_receita: false,
  preco_compra: '',
  preco_venda: '',
  estoque_minimo: '5',
  iva: '14',
  temperatura_armazenamento: '25',
  fornecedor_id: '',
};

export default function Medicamentos() {
  const { user } = useAuth();
  const [medicamentos, setMedicamentos] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [res, suppRes] = await Promise.all([
        api.get('/api/farmacia/medicamentos'),
        api.get('/api/suppliers')
      ]);
      setMedicamentos(await res.json());
      setSuppliers(await suppRes.json() || []);
    } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post('/api/farmacia/medicamentos', formData);
      if (res.ok) {
        setShowModal(false);
        setFormData(initialForm);
        fetchData();
      }
    } finally { setSaving(false); }
  };

  const f = (key: string, val: any) => setFormData(p => ({ ...p, [key]: val }));

  const filtered = medicamentos.filter(m =>
    m.nome_medicamento?.toLowerCase().includes(search.toLowerCase()) ||
    m.categoria_terapeutica?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto relative z-10">
      {/* Header */}
      <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
            Gestão de <span style={{ background: 'linear-gradient(135deg, #34d399, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Medicamentos</span>
          </h1>
          <p className="text-white/40 font-black text-[10px] uppercase tracking-[0.3em] mt-2 italic">Catálogo farmacêutico completo</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all active:scale-95 shadow-2xl"
        >
          <Plus size={18} />
          Novo Medicamento
        </button>
      </header>

      {/* Search */}
      <div className="glass-panel p-3 rounded-[32px] border border-white/5 mb-8 flex items-center gap-4 shadow-2xl">
        <div className="flex-1 relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-400/40 group-focus-within:text-emerald-400 transition-colors" size={16} />
          <input
            type="text"
            placeholder="Pesquisar medicamentos ou categoria..."
            className="w-full pl-14 pr-6 py-4 bg-white/5 border border-white/5 rounded-2xl focus:bg-white/[0.08] focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/5 font-black text-[11px] text-white placeholder:text-white/20 outline-none transition-all uppercase tracking-[0.1em] shadow-inner"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <span className="text-[9px] font-black text-white/20 uppercase tracking-widest px-4">{filtered.length} produtos</span>
      </div>

      {/* Table */}
      <div className="glass-panel rounded-[40px] border border-white/5 shadow-3xl overflow-hidden">
        <div className="p-8 border-b border-white/5 bg-white/[0.02]">
          <h2 className="font-black text-white uppercase tracking-widest text-sm italic flex items-center gap-4">
            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
            Catálogo Farmacêutico
          </h2>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          {loading ? (
            <div className="p-24 text-center">
              <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.5em] animate-pulse italic">Carregando Catálogo...</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/[0.03] text-[9px] font-black text-white/30 uppercase tracking-[0.2em] border-b border-white/5">
                  <th className="px-8 py-6">Medicamento</th>
                  <th className="px-8 py-6">Categoria</th>
                  <th className="px-8 py-6">Forma / Dosagem</th>
                  <th className="px-8 py-6 text-right">Preço Venda</th>
                  <th className="px-8 py-6 text-center">Stock</th>
                  <th className="px-8 py-6 text-center">Receita</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(med => (
                  <tr key={med.id} className="hover:bg-emerald-500/[0.02] transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-500/20 shrink-0">
                          <Pill size={20} />
                        </div>
                        <div>
                          <p className="font-black text-white text-xs uppercase tracking-tight group-hover:text-emerald-400 transition-colors">{med.nome_medicamento}</p>
                          <p className="text-[9px] font-black text-white/20 mt-1">{med.nome_generico || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-[11px] font-black text-white/50">{med.categoria_terapeutica || '—'}</td>
                    <td className="px-8 py-6">
                      <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-white/5 text-white/40 rounded-full border border-white/5">
                        {med.forma_farmaceutica} {med.dosagem && `• ${med.dosagem}`}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right font-black text-white tabular-nums">
                      {(med.preco_venda || 0).toLocaleString('pt-AO')} <span className="text-white/30 text-[10px]">{user?.currency}</span>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={`text-sm font-black tabular-nums ${(med.stock_total ?? 0) <= (med.estoque_minimo ?? 5) ? 'text-red-400' : 'text-emerald-400'}`}>
                        {med.stock_total ?? 0}
                      </span>
                      {(med.stock_total ?? 0) <= (med.estoque_minimo ?? 5) && (
                        <AlertCircle size={12} className="inline ml-1 text-red-400" />
                      )}
                    </td>
                    <td className="px-8 py-6 text-center">
                      {med.necessita_receita ? (
                        <span className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-red-500/20">Obrigatória</span>
                      ) : (
                        <span className="px-3 py-1.5 bg-white/5 text-white/30 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/5">Livre</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="px-8 py-24 text-center">
                      <p className="text-[10px] font-black text-white/10 uppercase tracking-[0.4em]">Nenhum medicamento localizado</p>
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
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

            <div className="p-10 border-b border-white/5 bg-emerald-500/[0.02] flex justify-between items-start sticky top-0 z-10 glass-panel">
              <div>
                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                  Novo <span style={{ background: 'linear-gradient(135deg, #34d399, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Medicamento</span>
                </h3>
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mt-2">Registo no catálogo farmacêutico</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-10 h-10 text-white/30 hover:text-white transition-colors border border-white/5 rounded-xl flex items-center justify-center hover:bg-white/5">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 grid grid-cols-2 gap-6">
              {/* Name - full width */}
              <div className="col-span-2 glass-panel p-4 rounded-2xl border border-white/5 focus-within:border-emerald-500/30 transition-all">
                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-2">Nome do Medicamento *</label>
                <input required type="text" className="w-full bg-transparent border-none outline-none font-black text-white uppercase tracking-tight placeholder:text-white/10" placeholder="EX: PARACETAMOL 500MG" value={formData.nome_medicamento} onChange={e => f('nome_medicamento', e.target.value)} />
              </div>

              <div className="glass-panel p-4 rounded-2xl border border-white/5 focus-within:border-emerald-500/30 transition-all">
                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-2">Princípio Ativo (Genérico)</label>
                <input type="text" className="w-full bg-transparent border-none outline-none font-black text-white uppercase tracking-tight placeholder:text-white/10" placeholder="IBUPROFENO..." value={formData.nome_generico} onChange={e => f('nome_generico', e.target.value)} />
              </div>

              <div className="glass-panel p-4 rounded-2xl border border-white/5 focus-within:border-emerald-500/30 transition-all">
                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-2">Código de Barras</label>
                <input type="text" className="w-full bg-transparent border-none outline-none font-black text-white tabular-nums tracking-widest placeholder:text-white/10" placeholder="0000000000000" value={formData.codigo_barras} onChange={e => f('codigo_barras', e.target.value)} />
              </div>

              <div className="glass-panel p-4 rounded-2xl border border-white/5 focus-within:border-emerald-500/30 transition-all">
                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-2">Categoria Terapêutica</label>
                <input type="text" className="w-full bg-transparent border-none outline-none font-black text-white uppercase tracking-tight placeholder:text-white/10" placeholder="ANALGÉSICO..." value={formData.categoria_terapeutica} onChange={e => f('categoria_terapeutica', e.target.value)} />
              </div>

              <div className="glass-panel p-4 rounded-2xl border border-white/5 focus-within:border-emerald-500/30 transition-all">
                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-2">Fornecedor / Supplier</label>
                <select className="w-full bg-transparent border-none outline-none font-black text-white/80 text-[11px] uppercase tracking-widest appearance-none cursor-pointer" value={formData.fornecedor_id} onChange={e => f('fornecedor_id', e.target.value)}>
                  <option value="" className="bg-bg-deep">Sem Fornecedor</option>
                  {suppliers.map(supp => <option key={supp.id} value={supp.id} className="bg-bg-deep">{supp.name}</option>)}
                </select>
              </div>

              <div className="glass-panel p-4 rounded-2xl border border-white/5 focus-within:border-emerald-500/30 transition-all">
                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-2">Forma Farmacêutica</label>
                <select className="w-full bg-transparent border-none outline-none font-black text-white/80 text-[11px] uppercase tracking-widest appearance-none cursor-pointer" value={formData.forma_farmaceutica} onChange={e => f('forma_farmaceutica', e.target.value)}>
                  <option value="" className="bg-bg-deep">Selecione...</option>
                  {FORMAS.map(f_ => <option key={f_} value={f_} className="bg-bg-deep">{f_}</option>)}
                </select>
              </div>

              <div className="glass-panel p-4 rounded-2xl border border-white/5 focus-within:border-emerald-500/30 transition-all">
                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-2">Dosagem</label>
                <input type="text" className="w-full bg-transparent border-none outline-none font-black text-white uppercase tracking-tight placeholder:text-white/10" placeholder="500MG, 250ML..." value={formData.dosagem} onChange={e => f('dosagem', e.target.value)} />
              </div>

              <div className="glass-panel p-4 rounded-2xl border border-white/5 focus-within:border-emerald-500/30 transition-all">
                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-2">Preço de Venda ({user?.currency}) *</label>
                <input required type="number" step="0.01" className="w-full bg-transparent border-none outline-none font-black text-white tabular-nums text-xl tracking-tighter placeholder:text-white/10" placeholder="0.00" value={formData.preco_venda} onChange={e => f('preco_venda', e.target.value)} />
              </div>

              <div className="glass-panel p-4 rounded-2xl border border-white/5 focus-within:border-emerald-500/30 transition-all">
                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-2">Preço de Compra ({user?.currency})</label>
                <input type="number" step="0.01" className="w-full bg-transparent border-none outline-none font-black text-white tabular-nums text-xl tracking-tighter placeholder:text-white/10" placeholder="0.00" value={formData.preco_compra} onChange={e => f('preco_compra', e.target.value)} />
              </div>

              <div className="glass-panel p-4 rounded-2xl border border-white/5 focus-within:border-emerald-500/30 transition-all">
                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-2">IVA (%)</label>
                <input type="number" className="w-full bg-transparent border-none outline-none font-black text-white tabular-nums tracking-tighter placeholder:text-white/10" value={formData.iva} onChange={e => f('iva', e.target.value)} />
              </div>

              <div className="glass-panel p-4 rounded-2xl border border-white/5 focus-within:border-emerald-500/30 transition-all">
                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-2">Stock Mínimo</label>
                <input type="number" className="w-full bg-transparent border-none outline-none font-black text-white tabular-nums tracking-tighter placeholder:text-white/10" value={formData.estoque_minimo} onChange={e => f('estoque_minimo', e.target.value)} />
              </div>

              <div className="col-span-2 flex items-center gap-4 glass-panel p-4 rounded-2xl border border-white/5">
                <div className={`w-6 h-6 rounded-lg border flex items-center justify-center cursor-pointer transition-all ${formData.necessita_receita ? 'bg-red-500/20 border-red-500/40' : 'border-white/10'}`}
                  onClick={() => f('necessita_receita', !formData.necessita_receita)}>
                  {formData.necessita_receita && <CheckCircle2 size={14} className="text-red-400" />}
                </div>
                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] cursor-pointer select-none" onClick={() => f('necessita_receita', !formData.necessita_receita)}>
                  Exige Receita Médica Obrigatória
                </label>
              </div>

              <div className="col-span-2 flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white/30 border border-white/5 hover:bg-white/5 transition-all">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="flex-1 py-5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all active:scale-95 shadow-2xl disabled:opacity-50">
                  {saving ? 'Guardando...' : 'Guardar Medicamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
