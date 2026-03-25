// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { 
  Target, PlusCircle, History, Trash2, 
  RefreshCw, TrendingUp, BarChart4, AlertTriangle, X
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
      const token = localStorage.getItem('token');
      const [funcRes, metaRes] = await Promise.all([
        fetch('/api/hr/employees', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch('/api/hr/metas', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
      ]);
      setFuncionarios(Array.isArray(funcRes) ? funcRes : []);
      setMetas(Array.isArray(metaRes) ? metaRes : []);
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
      employee_id: Number(fd.get('func_id')),
      titulo: fd.get('titulo') as string,
      progresso: 0,
      prazo: fd.get('prazo') || null,
      status: 'Em curso',
      company_id: user?.company_id
    };

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/hr/metas', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(nova)
      });
      
      const responseData = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(responseData.error || 'Falha ao criar meta');
      }
      
      fetchData();
      setShowMetaModal(false);
    } catch (err: any) {
      console.error('Erro ao criar meta:', err);
      alert('ERRO DO SERVIDOR: ' + (err.message || 'Erro ao criar meta'));
    }
  };

  const handleDeleteMeta = async (id: string) => {
    if (!confirm('Deseja realmente eliminar esta meta?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/hr/metas/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Falha ao eliminar meta');
      fetchData();
    } catch (err) {
      console.error('Erro ao eliminar meta:', err);
      alert('Erro ao eliminar meta');
    }
  };

  const updateMetaProgresso = async (id: string, novoProgresso: number) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/hr/metas/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          progresso: novoProgresso,
          status: novoProgresso === 100 ? 'Concluída' : 'Em curso'
        })
      });
      if (!res.ok) throw new Error('Falha ao atualizar progresso');
      fetchData();
    } catch (err) {
      console.error('Erro ao atualizar progresso:', err);
    }
  };

  const analyticsData = {
    barData: (Array.isArray(metas) ? metas : []).slice(0, 5).map((m, idx) => ({
      name: (m.titulo || 'Meta').substring(0, 15),
      valor: m.progresso || 0,
      fill: idx % 2 === 0 ? '#818cf8' : '#6366f1'
    }))
  };

  if (loading) return (
    <div className="flex justify-center items-center py-20">
      <RefreshCw className="animate-spin text-indigo-400" size={28} />
    </div>
  );

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto relative z-10">
      {/* Chart Metas */}
      <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 h-[300px]">
        <h3 className="text-sm font-black uppercase tracking-widest text-white/30 mb-4 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_#6366f1]" />
          Aproveitamento de KPIs
        </h3>
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={analyticsData.barData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.03)" />
            <XAxis type="number" hide domain={[0, 100]} />
            <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: 'rgba(255,255,255,0.25)' }} />
            <Tooltip 
              cursor={{ fill: 'transparent' }}
              contentStyle={{ background: '#0a0a0a', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '16px' }}
              labelStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', fontWeight: 900 }}
              itemStyle={{ color: '#818cf8', fontSize: '14px', fontWeight: 900 }}
            />
            <Bar dataKey="valor" radius={[0, 4, 4, 0]} barSize={20}>
              {analyticsData.barData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-between items-center glass-panel p-10 rounded-[2.5rem] border border-white/5 relative overflow-hidden">
        <Target className="absolute -right-8 -bottom-8 opacity-5 text-indigo-400" size={200} />
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-white italic">Desempenho</h2>
          <p className="text-white/30 font-medium">Acompanhamento de KPIs e Metas</p>
        </div>
        <div className="flex gap-4 relative z-10">
          <button 
            onClick={() => setShowMetaModal(true)} 
            className="px-8 py-4 bg-indigo-500/20 text-indigo-400 rounded-2xl font-black uppercase text-[10px] border border-indigo-500/30 hover:bg-indigo-500/30 transition-all flex items-center gap-3"
          >
            <PlusCircle size={20} /> Atribuir Meta
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metas.map(m => {
          const func = funcionarios.find(f => f.id === m.employee_id);
          return (
            <div key={m.id} className="glass-panel p-8 rounded-[2.5rem] border border-white/5 space-y-6 hover:border-indigo-500/20 transition-all group">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center font-black text-indigo-400 uppercase text-xs border border-indigo-500/20">
                    {func?.name?.[0] || '?'}
                  </div>
                  <div>
                    <h4 className="font-black text-white text-sm">{func?.name || '---'}</h4>
                    <p className="text-[10px] text-white/30 font-bold uppercase">{func?.position}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDeleteMeta(m.id)}
                    className="p-1.5 text-white/10 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${m.status === 'Concluída' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                    {m.status}
                  </span>
                </div>
              </div>
              
              <div>
                <h3 className="text-base font-black text-white mb-2">{m.titulo || 'Sem Título'}</h3>
                <p className="text-[10px] text-white/20 font-bold uppercase mb-4">Prazo: {m.prazo ? new Date(m.prazo).toLocaleDateString() : '---'}</p>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-white/20">Progresso</span>
                    <span className="text-[10px] font-black text-white">{m.progresso}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={m.progresso} 
                    onChange={(e) => updateMetaProgresso(m.id, Number(e.target.value))} 
                    className="w-full h-2 bg-white/5 rounded-full appearance-none cursor-pointer accent-indigo-500" 
                  />
                </div>
              </div>
            </div>
          );
        })}

        {metas.length === 0 && (
          <div className="col-span-full py-20 text-center glass-panel rounded-[2.5rem] border border-dashed border-white/10">
            <Target className="mx-auto text-white/5 mb-4" size={48} />
            <p className="text-white/20 font-bold italic">Nenhuma meta atribuída no momento.</p>
          </div>
        )}
      </div>

      {/* Modal Nova Meta */}
      {showMetaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="glass-panel w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden p-8 border border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-white uppercase">Atribuir Meta</h2>
              <button onClick={() => setShowMetaModal(false)} className="text-white/30 hover:text-white/60 transition-colors"><X size={24} /></button>
            </div>
            <form onSubmit={handleAddMeta} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Colaborador</label>
                <select name="func_id" required className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none">
                  <option value="" className="bg-zinc-900 text-white">Selecionar...</option>
                  {(Array.isArray(funcionarios) ? funcionarios : []).map(f => (
                    <option key={f.id} value={f.id} className="bg-zinc-900 text-white font-bold">
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Título da Meta</label>
                <input name="titulo" required placeholder="Ex: Aumentar vendas em 20%" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-white/20" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Prazo</label>
                <input name="prazo" type="date" required className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <button type="submit" className="w-full py-5 bg-indigo-500/20 text-indigo-400 rounded-2xl font-black uppercase text-xs border border-indigo-500/30 hover:bg-indigo-500/30 transition-all shadow-[0_0_20px_rgba(99,102,241,0.1)]">
                Criar Meta
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
