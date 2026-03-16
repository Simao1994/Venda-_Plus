// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { 
  Target, PlusCircle, History, Trash2, 
  RefreshCw, TrendingUp, BarChart4, AlertTriangle 
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, Cell 
} from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { safeQuery } from '../../lib/supabaseUtils';
import { formatAOA } from '../../constants';

export default function PerformanceTab() {
  const { user } = useAuth();
  const [funcionarios, setFuncionarios] = useState([]);
  const [metas, setMetas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMetaModal, setShowMetaModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [funcRes, metaRes] = await Promise.all([
        supabase.from('hr_employees').select('*').eq('company_id', user?.company_id).eq('status', 'active'),
        supabase.from('hr_metas').select('*').eq('company_id', user?.company_id)
      ]);
      setFuncionarios(funcRes.data || []);
      setMetas(metaRes.data || []);
    } catch (error) {
      console.error('Erro ao buscar dados de performance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMeta = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const nova = {
      employee_id: fd.get('func_id'),
      titulo: fd.get('titulo'),
      progresso: 0,
      prazo: fd.get('prazo'),
      status: 'Em curso',
      company_id: user?.company_id
    };

    try {
      const { error } = await safeQuery(() => supabase.from('hr_metas').insert([nova]));
      if (error) throw error;
      fetchData();
      setShowMetaModal(false);
    } catch (err) {
      console.error('Erro ao criar meta:', err);
      alert('Erro ao criar meta');
    }
  };

  const handleDeleteMeta = async (id: string) => {
    if (!confirm('Deseja realmente eliminar esta meta?')) return;
    try {
      const { error } = await safeQuery(() => supabase.from('hr_metas').delete().eq('id', id));
      if (error) throw error;
      fetchData();
    } catch (err) {
      console.error('Erro ao eliminar meta:', err);
      alert('Erro ao eliminar meta');
    }
  };

  const updateMetaProgresso = async (id: string, novoProgresso: number) => {
    try {
      const { error } = await safeQuery(() => supabase.from('hr_metas').update({
        progresso: novoProgresso,
        status: novoProgresso === 100 ? 'Concluída' : 'Em curso'
      }).eq('id', id));
      if (error) throw error;
      fetchData();
    } catch (err) {
      console.error('Erro ao atualizar progresso:', err);
    }
  };

  const analyticsData = {
    barData: metas.slice(0, 5).map((m, idx) => ({
      name: m.titulo.substring(0, 15),
      valor: m.progresso,
      fill: idx % 2 === 0 ? '#eab308' : '#3b82f6'
    }))
  };

  if (loading) return (
    <div className="flex justify-center items-center py-20">
      <RefreshCw className="animate-spin text-yellow-500" size={28} />
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Chart Metas */}
      <div className="bg-white p-8 rounded-[3rem] border border-zinc-100 shadow-sm h-[300px]">
        <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-4">Aproveitamento de KPIs</h3>
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={analyticsData.barData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
            <XAxis type="number" hide domain={[0, 100]} />
            <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
            <Tooltip cursor={{ fill: 'transparent' }} />
            <Bar dataKey="valor" radius={[0, 4, 4, 0]} barSize={20}>
              {analyticsData.barData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-between items-center bg-zinc-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
        <Target className="absolute -right-8 -bottom-8 opacity-10" size={200} />
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter">Desempenho</h2>
          <p className="text-zinc-400 font-medium">Acompanhamento de KPIs e Metas</p>
        </div>
        <div className="flex gap-4 relative z-10">
          <button 
            onClick={() => setShowMetaModal(true)} 
            className="px-8 py-4 bg-yellow-500 text-zinc-900 rounded-2xl font-black uppercase text-[10px] hover:bg-white transition-all flex items-center gap-3"
          >
            <PlusCircle size={20} /> Atribuir Meta
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metas.map(m => {
          const func = funcionarios.find(f => f.id === m.employee_id);
          return (
            <div key={m.id} className="bg-white p-8 rounded-[3rem] border border-zinc-100 shadow-sm space-y-6 hover:shadow-xl transition-all group">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center font-black text-zinc-400 uppercase text-xs">
                    {func?.name?.[0] || '?'}
                  </div>
                  <div>
                    <h4 className="font-black text-zinc-900 text-sm">{func?.name || '---'}</h4>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase">{func?.position}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDeleteMeta(m.id)}
                    className="p-1.5 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${m.status === 'Concluída' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {m.status}
                  </span>
                </div>
              </div>
              
              <div>
                <h3 className="text-base font-black text-zinc-900 mb-2">{m.titulo}</h3>
                <p className="text-[10px] text-zinc-400 font-bold uppercase mb-4">Prazo: {m.prazo || '---'}</p>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-zinc-400">Progresso</span>
                    <span className="text-[10px] font-black text-zinc-900">{m.progresso}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={m.progresso} 
                    onChange={(e) => updateMetaProgresso(m.id, Number(e.target.value))} 
                    className="w-full h-2 bg-zinc-100 rounded-full appearance-none cursor-pointer accent-yellow-500" 
                  />
                </div>
              </div>
            </div>
          );
        })}

        {metas.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border border-dashed border-zinc-200">
            <Target className="mx-auto text-zinc-100 mb-4" size={48} />
            <p className="text-zinc-400 font-bold italic">Nenhuma meta atribuída no momento.</p>
          </div>
        )}
      </div>

      {/* Modal Nova Meta */}
      {showMetaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-zinc-900 uppercase">Atribuir Meta</h2>
              <button onClick={() => setShowMetaModal(false)} className="text-zinc-400 hover:text-zinc-900"><PlusCircle size={24} className="rotate-45" /></button>
            </div>
            <form onSubmit={handleAddMeta} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Colaborador</label>
                <select name="func_id" required className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-yellow-500">
                  <option value="">Selecionar...</option>
                  {funcionarios.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Título da Meta</label>
                <input name="titulo" required placeholder="Ex: Aumentar vendas em 20%" className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-yellow-500" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Prazo</label>
                <input name="prazo" type="date" required className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-yellow-500" />
              </div>
              <button type="submit" className="w-full py-5 bg-zinc-900 text-white rounded-2xl font-black uppercase text-xs hover:bg-yellow-500 hover:text-zinc-900 transition-all shadow-xl">
                Criar Meta
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
