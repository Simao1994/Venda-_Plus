import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  TrendingUp,
  ShoppingBag,
  AlertTriangle,
  Package,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  User
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

export default function Dashboard() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');

  useEffect(() => {
    fetchStats();
    fetchTopProducts();
  }, []);

  const fetchStats = async () => {
    const res = await fetch('/api/dashboard/stats', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setStats(data);
  };

  const fetchTopProducts = async () => {
    const res = await fetch('/api/dashboard/top-products', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setTopProducts(data);
  };

  if (!stats) return (
    <div className="flex flex-col items-center justify-center p-20 space-y-4">
      <div className="w-16 h-16 border-4 border-gold-primary/20 border-t-gold-primary rounded-full animate-spin" />
      <div className="text-gold-primary/60 font-black uppercase tracking-[0.3em] text-xs">Sincronizando Métricas Base...</div>
    </div>
  );

  const cards = [
    {
      title: 'Vendas Hoje',
      value: `${stats.salesToday.toLocaleString()} ${user?.currency}`,
      icon: TrendingUp,
      color: 'from-gold-primary to-gold-secondary',
      trend: '+12.5%',
      trendUp: true
    },
    {
      title: 'Vendas do Mês',
      value: `${stats.salesMonth.toLocaleString()} ${user?.currency}`,
      icon: ShoppingBag,
      color: 'from-gold-primary/80 to-gold-secondary/60',
      trend: '+8.2%',
      trendUp: true
    },
    {
      title: 'Stock Baixo',
      value: stats.lowStock,
      icon: AlertTriangle,
      color: stats.lowStock > 0 ? 'from-red-500 to-red-700' : 'from-gold-primary/40 to-gold-secondary/20',
      trend: stats.lowStock > 0 ? 'Atenção necessária' : 'Tudo em ordem',
      trendUp: false
    },
    {
      title: 'Total Produtos',
      value: stats.totalProducts,
      icon: Package,
      color: 'from-white/10 to-white/5',
      trend: 'Catálogo activo',
      trendUp: true
    },
    {
      title: 'Contas a Receber',
      value: `${stats.totalReceivable.toLocaleString()} ${user?.currency}`,
      icon: ArrowUpRight,
      color: 'from-emerald-500 to-emerald-700',
      trend: 'Vendas a crédito',
      trendUp: true
    },
    {
      title: 'Contas a Pagar',
      value: `${stats.totalPayable.toLocaleString()} ${user?.currency}`,
      icon: ArrowDownRight,
      color: 'from-orange-500 to-orange-700',
      trend: 'Despesas pendentes',
      trendUp: false
    },
  ];

  return (
    <div className="p-8 space-y-10 bg-transparent min-h-full font-sans">
      <header className="flex flex-col gap-2 relative">
        <div className="absolute -left-10 top-1/2 -translate-y-1/2 w-1 h-12 bg-gold-primary rounded-full shadow-[0_0_15px_rgba(212,175,55,0.5)]" />
        <h1 className="text-4xl font-black text-white tracking-tighter italic font-display">
          CENTRO DE <span className="text-gold-gradient">COMANDO</span>
        </h1>
        <p className="text-gold-primary/40 font-black text-[10px] uppercase tracking-[0.4em]">Gestão Operacional Empresarial &bull; Bem-vindo, {user?.name?.toUpperCase()}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {cards.map((card, i) => (
          <div key={i} className="glass-panel p-6 rounded-3xl border border-white/5 hover:border-gold-primary/30 transition-all group relative overflow-hidden gold-glow">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gold-primary/[0.02] rounded-full -mr-8 -mt-8 group-hover:bg-gold-primary/[0.05] transition-all" />

            <div className="flex justify-between items-start mb-6 relative z-10">
              <div className={`bg-gradient-to-br ${card.color} p-3 rounded-2xl text-bg-deep shadow-lg shrink-0`}>
                <card.icon size={22} />
              </div>
              <div className={`flex items-center text-[10px] font-black uppercase tracking-widest ${card.trendUp ? 'text-gold-primary' : 'text-red-400'}`}>
                {card.trend}
              </div>
            </div>

            <div className="relative z-10">
              <h3 className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{card.title}</h3>
              <p className="text-2xl font-black text-white tracking-tighter italic">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-panel p-8 rounded-[32px] border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gold-primary/20 to-transparent" />

          <div className="flex justify-between items-center mb-10 relative z-10">
            <div>
              <h3 className="text-lg font-black text-white tracking-tight uppercase">Análise de Desempenho</h3>
              <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mt-1">Volume Transacional (7 dias)</p>
            </div>
            <div className="flex gap-4">
              <div className="flex bg-white/5 rounded-2xl p-1 border border-white/5">
                <button
                  onClick={() => setChartType('line')}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${chartType === 'line' ? 'bg-gold-primary text-bg-deep' : 'text-white/40 hover:text-white'}`}
                >
                  Linha
                </button>
                <button
                  onClick={() => setChartType('bar')}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${chartType === 'bar' ? 'bg-gold-primary text-bg-deep' : 'text-white/40 hover:text-white'}`}
                >
                  Barras
                </button>
              </div>
            </div>
          </div>

          <div className="h-[350px] relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'line' ? (
                <LineChart data={stats.dailySales}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.2)', fontWeight: 'bold' }}
                    dy={15}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.2)', fontWeight: 'bold' }}
                    tickFormatter={(value) => `${value.toLocaleString()}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0B0B0B',
                      borderRadius: '20px',
                      border: '1px solid rgba(212,175,55,0.2)',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                      padding: '16px'
                    }}
                    itemStyle={{ color: '#D4AF37', fontWeight: '900', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                    labelStyle={{ color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', fontSize: '10px', marginBottom: '8px', textTransform: 'uppercase' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#D4AF37"
                    strokeWidth={4}
                    dot={{ r: 6, fill: '#D4AF37', strokeWidth: 3, stroke: '#0B0B0B' }}
                    activeDot={{ r: 8, strokeWidth: 0, fill: '#fff', shadow: '0 0 20px #D4AF37' }}
                  />
                </LineChart>
              ) : (
                <BarChart data={stats.dailySales}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.2)', fontWeight: 'bold' }}
                    dy={15}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.2)', fontWeight: 'bold' }}
                    tickFormatter={(value) => `${value.toLocaleString()}`}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                    contentStyle={{
                      backgroundColor: '#0B0B0B',
                      borderRadius: '20px',
                      border: '1px solid rgba(212,175,55,0.2)',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                      padding: '16px'
                    }}
                  />
                  <Bar
                    dataKey="total"
                    fill="url(#goldGradient)"
                    radius={[8, 8, 0, 0]}
                    maxBarSize={40}
                  >
                    <defs>
                      <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#D4AF37" />
                        <stop offset="100%" stopColor="#8A6E2F" />
                      </linearGradient>
                    </defs>
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-8 rounded-[32px] border border-white/5 relative overflow-hidden">
          <h3 className="text-lg font-black text-white tracking-tight uppercase mb-8">Performance por Sector</h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}
                  width={100}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  contentStyle={{ backgroundColor: '#0B0B0B', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '12px' }}
                />
                <Bar dataKey="total_sold" fill="#D4AF37" radius={[0, 8, 8, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-8 rounded-[32px] border border-white/5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-white tracking-tight uppercase">Alertas de Stock</h3>
            <AlertTriangle size={20} className="text-gold-primary animate-pulse" />
          </div>

          <div className="space-y-4">
            {stats.lowStock === 0 ? (
              <div className="text-center py-12 text-white/10 font-black uppercase tracking-[0.2em] italic text-xs">
                Todos os sistemas operacionais.
              </div>
            ) : (
              <div className="space-y-3">
                {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'master') ? (
                  stats.lowStockProducts.slice(0, 4).map((product: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-gold-primary/20 transition-all group">
                      <div className="font-bold text-white text-sm tracking-tight">{product.name}</div>
                      <div className="text-[10px] font-black text-gold-primary bg-gold-primary/10 px-3 py-1.5 rounded-xl uppercase tracking-widest border border-gold-primary/10">
                        {product.stock} Unidades restantes
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gold-primary/60 font-black uppercase tracking-widest text-xs">
                    {stats.lowStock} SECTORES REQUEREM ATENÇÃO
                  </div>
                )}
              </div>
            )}

            <button className="w-full py-4 mt-4 bg-white/5 text-gold-primary/60 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border border-white/5 hover:bg-gold-primary/10 hover:text-gold-primary transition-all">
              Ver Inventário
            </button>
          </div>
        </div>

        <div className="glass-panel p-8 rounded-[32px] border border-white/5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-white tracking-tight uppercase">Devedores de Alto Risco</h3>
            <DollarSign size={20} className="text-red-500" />
          </div>

          <div className="space-y-4">
            {stats.criticalDebtors && stats.criticalDebtors.length > 0 ? (
              stats.criticalDebtors.slice(0, 4).map((debtor: any) => (
                <div key={debtor.id} className="flex items-center justify-between p-4 bg-red-500/5 rounded-2xl border border-red-500/10 hover:border-red-500/30 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center border border-red-500/10">
                      <User size={20} />
                    </div>
                    <div>
                      <div className="font-black text-white text-sm tracking-tight">{debtor.name}</div>
                      <div className="text-[8px] text-red-500 font-black uppercase tracking-[0.2em]">Nível de Risco: Alto</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-red-400 tracking-tighter italic">{debtor.balance.toLocaleString()} {user?.currency}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-white/10 font-black uppercase tracking-[0.2em] italic text-xs">
                Nenhum risco de liquidez detectado.
              </div>
            )}

            <button className="w-full py-4 mt-4 bg-white/5 text-red-400/60 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border border-white/5 hover:bg-red-500/10 hover:text-red-400 transition-all">
              Gestão de Cobranças
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
