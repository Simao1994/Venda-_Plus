import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Pill, AlertTriangle, Activity, TrendingUp, Package, Users, ShoppingBag, Clock } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export default function PharmacyDashboard() {
  const { token, user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [alertas, setAlertas] = useState<any[]>([]);
  const [vendas, setVendas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [statsRes, alertasRes, vendasRes] = await Promise.all([
        fetch('/api/farmacia/stats', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/farmacia/alertas', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/farmacia/vendas?period=7days', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const [s, a, v] = await Promise.all([statsRes.json(), alertasRes.json(), vendasRes.json()]);
      setStats(s);
      setAlertas(Array.isArray(a) ? a.slice(0, 5) : []);
      setVendas(Array.isArray(v) ? v : []);
    } catch (e) {
      console.error('Pharmacy dashboard error:', e);
    } finally {
      setLoading(false);
    }
  };

  // Build chart data from last 7 days of vendas
  const chartData = (() => {
    const days: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('pt-AO', { day: '2-digit', month: '2-digit' });
      days[key] = 0;
    }
    vendas.forEach((v: any) => {
      const key = new Date(v.created_at).toLocaleDateString('pt-AO', { day: '2-digit', month: '2-digit' });
      if (key in days) days[key] += v.total || 0;
    });
    return Object.entries(days).map(([name, total]) => ({ name, total }));
  })();

  const kpis = [
    { label: 'Total Medicamentos', value: stats?.total_medicamentos ?? '—', icon: Pill, color: 'emerald' },
    { label: 'Alertas de Stock', value: stats?.alertas_stock ?? alertas.length, icon: AlertTriangle, color: 'red' },
    { label: 'Receitas Pendentes', value: stats?.receitas_pendentes ?? '—', icon: Clock, color: 'amber' },
    { label: 'Total Pacientes', value: stats?.total_clientes ?? '—', icon: Users, color: 'blue' },
  ];

  const colorMap: Record<string, { bg: string; text: string; border: string; glow: string }> = {
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', glow: 'shadow-[0_0_30px_rgba(16,185,129,0.1)]' },
    red: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', glow: 'shadow-[0_0_30px_rgba(239,68,68,0.1)]' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', glow: 'shadow-[0_0_30px_rgba(245,158,11,0.1)]' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', glow: 'shadow-[0_0_30px_rgba(59,130,246,0.1)]' },
  };

  return (
    <div className="p-8 max-w-7xl mx-auto relative z-10">
      {/* Header */}
      <header className="mb-10">
        <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
          Farmácia <span style={{ background: 'linear-gradient(135deg, #34d399, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Dashboard</span>
        </h1>
        <p className="text-white/40 font-black text-[10px] uppercase tracking-[0.3em] mt-2 italic">Visão geral do módulo farmacêutico em tempo real</p>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {kpis.map((kpi, i) => {
              const c = colorMap[kpi.color];
              return (
                <div key={i} className={`glass-panel p-8 rounded-[40px] border border-white/5 flex items-center gap-6 relative overflow-hidden group hover:border-opacity-30 transition-all ${c.glow}`}>
                  <div className={`absolute top-0 right-0 w-24 h-24 ${kpi.color === 'emerald' ? 'bg-emerald-500/[0.02]' : kpi.color === 'red' ? 'bg-red-500/[0.02]' : kpi.color === 'amber' ? 'bg-amber-500/[0.02]' : 'bg-blue-500/[0.02]'} rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform`} />
                  <div className={`w-16 h-16 ${c.bg} ${c.text} rounded-[1.5rem] flex items-center justify-center border ${c.border} ${c.glow} shrink-0`}>
                    <kpi.icon size={28} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] mb-1">{kpi.label}</p>
                    <p className="text-3xl font-black text-white tracking-tighter italic">{typeof kpi.value === 'number' ? kpi.value.toLocaleString('pt-AO') : kpi.value}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Chart + Alerts side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
            {/* Chart */}
            <div className="lg:col-span-2 glass-panel p-8 rounded-[40px] border border-white/5">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-black text-white text-sm uppercase tracking-[0.2em] italic">Vendas — Últimos 7 Dias</h3>
                  <p className="text-[9px] text-white/20 uppercase tracking-widest mt-1">Evolução de receita farmacêutica</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">{user?.currency}</span>
                </div>
              </div>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="pharmGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: 'rgba(255,255,255,0.3)' }} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: 'rgba(255,255,255,0.2)' }} />
                    <Tooltip
                      contentStyle={{ background: '#0a0a0a', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}
                      labelStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}
                      itemStyle={{ color: '#34d399', fontSize: '14px', fontWeight: 900 }}
                      formatter={(v: any) => [`${Number(v).toLocaleString('pt-AO')} ${user?.currency}`, 'Vendas']}
                    />
                    <Area type="monotone" dataKey="total" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#pharmGrad)" dot={{ fill: '#10b981', r: 4, strokeWidth: 2, stroke: '#0a0a0a' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Alerts */}
            <div className="glass-panel p-8 rounded-[40px] border border-white/5">
              <h3 className="font-black text-white text-sm uppercase tracking-[0.2em] italic mb-6 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#EF4444] animate-pulse" />
                Alertas de Stock
              </h3>
              {alertas.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-white/10">
                  <Package size={32} />
                  <p className="text-[10px] font-black uppercase tracking-widest mt-4">Sem alertas</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alertas.map((a: any, i) => (
                    <div key={i} className="glass-panel p-4 rounded-2xl border border-red-500/10 hover:border-red-500/20 transition-all group">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-white text-[11px] uppercase tracking-tight truncate group-hover:text-red-400 transition-colors">{a.nome_medicamento || a.name}</p>
                          <p className="text-[9px] text-white/20 uppercase tracking-widest mt-0.5">{a.categoria_terapeutica || a.category || 'Medicamento'}</p>
                        </div>
                        <span className="shrink-0 px-2 py-1 bg-red-500/10 text-red-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-red-500/20">
                          Stock: {a.stock_total ?? a.stock ?? 0}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Sales */}
          <div className="glass-panel rounded-[40px] border border-white/5 overflow-hidden">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <h3 className="font-black text-white text-sm uppercase tracking-widest italic flex items-center gap-4">
                <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                Últimas Vendas
              </h3>
              <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">{vendas.length} registos</span>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white/[0.03] text-[9px] font-black text-white/30 uppercase tracking-[0.2em] border-b border-white/5">
                    <th className="px-8 py-5">Fatura</th>
                    <th className="px-8 py-5">Data</th>
                    <th className="px-8 py-5">Método</th>
                    <th className="px-8 py-5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {vendas.slice(0, 8).map((v: any, i) => (
                    <tr key={i} className="hover:bg-emerald-500/[0.02] transition-colors group">
                      <td className="px-8 py-5 font-black text-white text-xs group-hover:text-emerald-400 transition-colors">{v.numero_factura}</td>
                      <td className="px-8 py-5 text-[11px] font-black text-white/40 tabular-nums">{new Date(v.created_at).toLocaleDateString('pt-AO')}</td>
                      <td className="px-8 py-5">
                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-white/5 text-white/40 rounded-full border border-white/5">
                          {v.forma_pagamento || '—'}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right font-black text-emerald-400 tabular-nums">{(v.total || 0).toLocaleString('pt-AO')} {user?.currency}</td>
                    </tr>
                  ))}
                  {vendas.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center text-[10px] font-black text-white/10 uppercase tracking-[0.4em]">
                        Nenhuma venda registada no período
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
