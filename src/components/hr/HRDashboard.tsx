import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Users, Building2, TrendingUp, DollarSign, PieChart, Calendar, Banknote } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function HRDashboard() {
  const { token, user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/hr/stats', { headers: { Authorization: `Bearer ${token}` } });
      setStats((await res.json()) || {});
    } catch (e) { console.error('HR stats error:', e); }
    finally { setLoading(false); }
  };

  const lp = stats?.lastPayroll;

  const chartData = lp ? [
    { name: 'Salário Líquido', value: lp.total_net, color: '#6366f1' },
    { name: 'IRT', value: lp.total_irt, color: '#ef4444' },
    { name: 'INSS (Trab.)', value: lp.total_inss_employee, color: '#f59e0b' },
    { name: 'INSS (Emp.)', value: lp.total_inss_employer, color: '#10b981' },
  ] : [];

  const kpis = [
    { label: 'Funcionários Ativos', value: stats?.employees || 0, icon: Users, color: 'indigo' },
    { label: 'Departamentos', value: stats?.departments || 0, icon: Building2, color: 'emerald' },
    { label: 'Custo Total Folha', value: lp ? (lp.total_gross + lp.total_inss_employer).toLocaleString('pt-AO') : '0', icon: DollarSign, color: 'amber', suffix: user?.currency },
    { label: 'Impostos (IRT+INSS)', value: lp ? (lp.total_irt + lp.total_inss_employee + lp.total_inss_employer).toLocaleString('pt-AO') : '0', icon: TrendingUp, color: 'red', suffix: user?.currency },
  ];

  const colorMap: Record<string, { bg: string; text: string; border: string; glow: string }> = {
    indigo: { bg: 'bg-gold-primary/10', text: 'text-gold-primary', border: 'border-gold-primary/20', glow: 'shadow-[0_0_30px_rgba(99,102,241,0.1)]' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', glow: 'shadow-[0_0_30px_rgba(16,185,129,0.1)]' },
    amber: { bg: 'bg-gold-primary/10', text: 'text-gold-primary', border: 'border-gold-primary/20', glow: 'shadow-[0_0_30px_rgba(245,158,11,0.1)]' },
    red: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', glow: 'shadow-[0_0_30px_rgba(239,68,68,0.1)]' },
  };

  return (
    <div className="p-8 max-w-7xl mx-auto relative z-10">
      {/* Header */}
      <header className="mb-10">
        <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
          Recursos <span style={{ background: 'linear-gradient(135deg, #818cf8, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Humanos</span>
        </h1>
        <p className="text-white/40 font-black text-[10px] uppercase tracking-[0.3em] mt-2 italic">Gestão de pessoal, folha salarial e impostos</p>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="w-12 h-12 border-4 border-gold-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {kpis.map((kpi, i) => {
              const c = colorMap[kpi.color];
              return (
                <div key={i} className={`glass-panel p-8 rounded-[40px] border border-white/5 flex items-center gap-6 relative overflow-hidden group hover:border-opacity-30 transition-all ${c.glow}`}>
                  <div className={`w-16 h-16 ${c.bg} ${c.text} rounded-[1.5rem] flex items-center justify-center border ${c.border} ${c.glow} shrink-0`}>
                    <kpi.icon size={28} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] mb-1">{kpi.label}</p>
                    <p className="text-3xl font-black text-white tracking-tighter italic">
                      {typeof kpi.value === 'number' ? kpi.value.toLocaleString('pt-AO') : kpi.value}
                    </p>
                    {kpi.suffix && <p className="text-[9px] font-black text-white/10 mt-0.5">{kpi.suffix}</p>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Chart + Payroll Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Bar Chart */}
            <div className="glass-panel p-8 rounded-[40px] border border-white/5">
              <h3 className="font-black text-white text-sm uppercase tracking-[0.2em] italic mb-2 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-gold-primary shadow-[0_0_8px_#6366f1]" />
                Distribuição de Custos
              </h3>
              <p className="text-[9px] text-white/20 uppercase tracking-widest mb-6">Última Folha Salarial</p>
              <div className="h-[280px]">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: 'rgba(255,255,255,0.25)' }} dy={8} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: 'rgba(255,255,255,0.15)' }} tickFormatter={v => v.toLocaleString('pt-AO')} />
                      <Tooltip
                        contentStyle={{ background: '#0a0a0a', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}
                        labelStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' as const }}
                        itemStyle={{ color: '#818cf8', fontSize: '14px', fontWeight: 900 }}
                        formatter={(v: any) => [`${Number(v).toLocaleString('pt-AO')} ${user?.currency}`, 'Valor']}
                      />
                      <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                        {chartData.map((entry, i) => (
                          <Cell key={`cell-${i}`} fill={entry.color} fillOpacity={0.8} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-white/10 gap-4">
                    <PieChart size={32} />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em]">Sem dados disponíveis</p>
                  </div>
                )}
              </div>
            </div>

            {/* Payroll Summary */}
            <div className="glass-panel p-8 rounded-[40px] border border-white/5">
              <h3 className="font-black text-white text-sm uppercase tracking-[0.2em] italic mb-2 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-gold-primary shadow-[0_0_8px_#6366f1]" />
                Resumo da Folha
              </h3>
              <p className="text-[9px] text-white/20 uppercase tracking-widest mb-6">
                {lp ? `${lp.month}/${lp.year}` : 'Sem dados'}
              </p>
              {lp ? (
                <div className="space-y-3">
                  {[
                    { label: 'Salário Bruto Total', value: lp.total_gross, color: 'text-white/60', sign: '' },
                    { label: 'IRT Total', value: lp.total_irt, color: 'text-red-400', sign: '-' },
                    { label: 'INSS Trabalhador (3%)', value: lp.total_inss_employee, color: 'text-gold-primary', sign: '-' },
                    { label: 'INSS Empresa (8%)', value: lp.total_inss_employer, color: 'text-emerald-400', sign: '' },
                  ].map((r, i) => (
                    <div key={i} className="glass-panel flex justify-between items-center p-5 rounded-2xl border border-white/5 hover:border-gold-primary/10 transition-all group">
                      <span className="text-[10px] font-black text-white/30 uppercase tracking-widest group-hover:text-white/40 transition-colors">{r.label}</span>
                      <span className={`font-black tabular-nums ${r.color}`}>
                        {r.sign}{r.value?.toLocaleString('pt-AO')} <span className="text-[9px] opacity-50">{user?.currency}</span>
                      </span>
                    </div>
                  ))}

                  {/* Total Líquido */}
                  <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                    <span className="font-black text-white uppercase tracking-widest text-sm">Salário Líquido Total</span>
                    <span className="font-black text-gold-primary text-2xl tabular-nums italic">
                      {lp.total_net?.toLocaleString('pt-AO')} <span className="text-sm opacity-50">{user?.currency}</span>
                    </span>
                  </div>
                </div>
              ) : (
                <div className="h-[280px] flex flex-col items-center justify-center text-white/10 gap-4">
                  <Calendar size={32} />
                  <p className="text-[10px] font-black uppercase tracking-[0.4em]">Gere a primeira folha salarial</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}


