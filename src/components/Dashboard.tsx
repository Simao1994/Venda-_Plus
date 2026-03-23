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
  User,
  X,
  Phone,
  Mail,
  ChevronDown,
  ChevronUp,
  Layers,
  Search
} from 'lucide-react';
import { api } from '../lib/api';

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

interface DashboardProps {
  onNavigate?: (tab: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { user, token } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [categoryPerformance, setCategoryPerformance] = useState<any[]>([]);
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [performanceView, setPerformanceView] = useState<'products' | 'categories'>('categories');

  // Modals & panels
  const [showCobran, setShowCobran] = useState(false);
  const [debtors, setDebtors] = useState<any[]>([]);
  const [loadingDebtors, setLoadingDebtors] = useState(false);
  const [debtorSearch, setDebtorSearch] = useState('');
  const [showAllLowStock, setShowAllLowStock] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchTopProducts();
    fetchCategoryPerformance();
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

  const fetchCategoryPerformance = async () => {
    try {
      const res = await fetch('/api/dashboard/category-performance', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setCategoryPerformance(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Category performance error:', e);
    }
  };

  const openCobran = async () => {
    setShowCobran(true);
    setLoadingDebtors(true);
    try {
      const res = await fetch('/api/dashboard/debtors', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setDebtors(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Debtors error:', e);
    } finally {
      setLoadingDebtors(false);
    }
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
      trendUp: false,
      onClick: () => setShowAllLowStock(v => !v)
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

  const filteredDebtors = debtors.filter(d =>
    d.name?.toLowerCase().includes(debtorSearch.toLowerCase()) ||
    d.phone?.includes(debtorSearch) ||
    d.email?.toLowerCase().includes(debtorSearch.toLowerCase())
  );

  const performanceData = performanceView === 'categories' ? categoryPerformance : topProducts;
  const performanceKey = performanceView === 'categories' ? 'total_revenue' : 'total_sold';
  const performanceLabel = performanceView === 'categories' ? 'Receita (Kz)' : 'Unidades Vendidas';

  return (
    <div className="p-8 space-y-10 bg-transparent min-h-full font-sans">
      <header className="flex flex-col gap-2 relative">
        <div className="absolute -left-10 top-1/2 -translate-y-1/2 w-1 h-12 bg-gold-primary rounded-full shadow-[0_0_15px_rgba(212,175,55,0.5)]" />
        <h1 className="text-4xl font-black text-white tracking-tighter italic font-display">
          CENTRO DE <span className="text-gold-gradient">COMANDO</span>
        </h1>
        <p className="text-gold-primary/40 font-black text-[10px] uppercase tracking-[0.4em]">Gestão Operacional Empresarial &bull; Bem-vindo, {user?.name?.toUpperCase()}</p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {cards.map((card, i) => (
          <div
            key={i}
            onClick={card.onClick}
            className={`glass-panel p-6 rounded-3xl border border-white/5 hover:border-gold-primary/30 transition-all group relative overflow-hidden gold-glow ${card.onClick ? 'cursor-pointer' : ''}`}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gold-primary/[0.02] rounded-full -mr-8 -mt-8 group-hover:bg-gold-primary/[0.05] transition-all" />
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div className={`bg-gradient-to-br ${card.color} p-3 rounded-2xl text-bg-deep shadow-lg shrink-0`}>
                <card.icon size={22} />
              </div>
              <div className={`flex items-center text-[10px] font-black uppercase tracking-widest ${card.trendUp ? 'text-gold-primary' : stats.lowStock > 0 && card.title === 'Stock Baixo' ? 'text-red-400' : 'text-gold-primary'}`}>
                {card.trend}
              </div>
            </div>
            <div className="relative z-10">
              <h3 className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{card.title}</h3>
              <p className="text-2xl font-black text-white tracking-tighter italic">{card.value}</p>
            </div>
            {card.onClick && (
              <div className="absolute bottom-3 right-3 text-gold-primary/30 group-hover:text-gold-primary transition-colors">
                {showAllLowStock ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Low Stock Expandable Panel */}
      {showAllLowStock && stats.lowStockProducts && stats.lowStockProducts.length > 0 && (
        <div className="glass-panel p-6 rounded-[28px] border border-red-500/20 space-y-3 animate-in fade-in">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle size={18} className="text-red-400" />
            <h3 className="font-black text-white uppercase tracking-wider text-sm">Todos os Produtos com Stock Baixo</h3>
            <span className="ml-auto text-[10px] font-black text-red-400 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
              {stats.lowStockProducts.length} Produtos
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto custom-scrollbar pr-1">
            {stats.lowStockProducts.map((product: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-4 bg-red-500/5 rounded-2xl border border-red-500/10 hover:border-red-500/30 transition-all">
                <div className="font-bold text-white text-sm tracking-tight truncate max-w-[60%]">{product.name}</div>
                <div className="text-[10px] font-black text-red-400 bg-red-500/10 px-3 py-1.5 rounded-xl uppercase tracking-widest border border-red-500/20 shrink-0">
                  {product.stock} un.
                </div>
              </div>
            ))}
          </div>
          {onNavigate && (
            <button
              onClick={() => { setShowAllLowStock(false); onNavigate('inventory'); }}
              className="w-full mt-2 py-3 bg-gold-primary/10 text-gold-primary rounded-2xl font-black text-[10px] uppercase tracking-widest border border-gold-primary/20 hover:bg-gold-primary hover:text-bg-deep transition-all"
            >
              Gerir Inventário Completo
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart */}
        <div className="lg:col-span-2 glass-panel p-8 rounded-[32px] border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gold-primary/20 to-transparent" />
          <div className="flex justify-between items-center mb-10 relative z-10">
            <div>
              <h3 className="text-lg font-black text-white tracking-tight uppercase">Análise de Desempenho</h3>
              <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mt-1">Volume Transacional (7 dias)</p>
            </div>
            <div className="flex gap-4">
              <div className="flex bg-white/5 rounded-2xl p-1 border border-white/5">
                <button onClick={() => setChartType('line')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${chartType === 'line' ? 'bg-gold-primary text-bg-deep' : 'text-white/40 hover:text-white'}`}>Linha</button>
                <button onClick={() => setChartType('bar')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${chartType === 'bar' ? 'bg-gold-primary text-bg-deep' : 'text-white/40 hover:text-white'}`}>Barras</button>
              </div>
            </div>
          </div>
          <div className="h-[350px] relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'line' ? (
                <LineChart data={stats.dailySales}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.2)', fontWeight: 'bold' }} dy={15} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.2)', fontWeight: 'bold' }} tickFormatter={(v) => v.toLocaleString()} />
                  <Tooltip contentStyle={{ backgroundColor: '#0B0B0B', borderRadius: '20px', border: '1px solid rgba(212,175,55,0.2)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', padding: '16px' }} itemStyle={{ color: '#D4AF37', fontWeight: '900', fontSize: '12px', textTransform: 'uppercase' }} labelStyle={{ color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', fontSize: '10px', marginBottom: '8px' }} />
                  <Line type="monotone" dataKey="total" stroke="#D4AF37" strokeWidth={4} dot={{ r: 6, fill: '#D4AF37', strokeWidth: 3, stroke: '#0B0B0B' }} activeDot={{ r: 8, strokeWidth: 0, fill: '#fff' }} />
                </LineChart>
              ) : (
                <BarChart data={stats.dailySales}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.2)', fontWeight: 'bold' }} dy={15} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.2)', fontWeight: 'bold' }} tickFormatter={(v) => v.toLocaleString()} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={{ backgroundColor: '#0B0B0B', borderRadius: '20px', border: '1px solid rgba(212,175,55,0.2)' }} />
                  <Bar dataKey="total" fill="url(#goldGradient)" radius={[8, 8, 0, 0]} maxBarSize={40}>
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

        {/* Performance por Sector */}
        <div className="glass-panel p-8 rounded-[32px] border border-white/5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-white tracking-tight uppercase">Performance por Sector</h3>
            <div className="flex bg-white/5 rounded-xl p-0.5 border border-white/5">
              <button
                onClick={() => setPerformanceView('categories')}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1 ${performanceView === 'categories' ? 'bg-gold-primary text-bg-deep' : 'text-white/40 hover:text-white'}`}
              >
                <Layers size={10} /> Sectores
              </button>
              <button
                onClick={() => setPerformanceView('products')}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1 ${performanceView === 'products' ? 'bg-gold-primary text-bg-deep' : 'text-white/40 hover:text-white'}`}
              >
                <Package size={10} /> Prod.
              </button>
            </div>
          </div>
          <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-4">{performanceLabel}</p>
          <div className="h-[300px]">
            {performanceData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-white/10 font-black text-xs uppercase tracking-widest text-center">
                Sem dados de vendas<br />suficientes ainda
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}
                    width={90}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                    contentStyle={{ backgroundColor: '#0B0B0B', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '12px' }}
                    formatter={(val: any) => [val?.toLocaleString(), performanceLabel]}
                  />
                  <Bar dataKey={performanceKey} fill="#D4AF37" radius={[0, 8, 8, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Stock Baixo Panel */}
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
                      <div className="font-bold text-white text-sm tracking-tight truncate max-w-[65%]">{product.name}</div>
                      <div className="text-[10px] font-black text-gold-primary bg-gold-primary/10 px-3 py-1.5 rounded-xl uppercase tracking-widest border border-gold-primary/10 shrink-0">
                        {product.stock} un.
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

            <button
              onClick={() => {
                setShowAllLowStock(v => !v);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full py-4 mt-4 bg-white/5 text-gold-primary/60 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border border-white/5 hover:bg-gold-primary/10 hover:text-gold-primary transition-all flex items-center justify-center gap-2"
            >
              {showAllLowStock ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {showAllLowStock ? 'Recolher' : 'Ver Inventário Completo'}
            </button>
          </div>
        </div>

        {/* Devedores de Alto Risco */}
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

            <button
              onClick={openCobran}
              className="w-full py-4 mt-4 bg-red-500/5 text-red-400/80 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border border-red-500/10 hover:bg-red-500/10 hover:text-red-400 transition-all"
            >
              Gestão de Cobranças
            </button>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          GESTÃO DE COBRANÇAS MODAL
      ════════════════════════════════════════════════════ */}
      {showCobran && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-bg-deep border border-white/10 rounded-[32px] w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-8 border-b border-white/5 shrink-0">
              <div>
                <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">Gestão de Cobranças</h2>
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mt-1">
                  {debtors.length} cliente{debtors.length !== 1 ? 's' : ''} com saldo pendente &bull; Total: {debtors.reduce((s, d) => s + (d.balance || 0), 0).toLocaleString()} {user?.currency}
                </p>
              </div>
              <button onClick={() => setShowCobran(false)} className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center text-white/40 hover:text-white transition-all border border-white/5">
                <X size={20} />
              </button>
            </div>

            {/* Search */}
            <div className="px-8 pt-6 shrink-0">
              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                <input
                  type="text"
                  placeholder="Pesquisar cliente..."
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white text-sm font-bold placeholder:text-white/20 focus:outline-none focus:border-gold-primary/30 focus:ring-2 focus:ring-gold-primary/10"
                  value={debtorSearch}
                  onChange={e => setDebtorSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 pt-4">
              {loadingDebtors ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-10 h-10 border-4 border-gold-primary/20 border-t-gold-primary rounded-full animate-spin" />
                </div>
              ) : filteredDebtors.length === 0 ? (
                <div className="text-center py-16 text-white/10 font-black uppercase tracking-[0.3em] text-xs italic">
                  {debtors.length === 0 ? 'Nenhum devedor registado.' : 'Nenhum resultado encontrado.'}
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Column headers */}
                  <div className="grid grid-cols-12 gap-4 px-4 py-2">
                    <span className="col-span-4 text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Cliente</span>
                    <span className="col-span-3 text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Contacto</span>
                    <span className="col-span-3 text-[9px] font-black text-white/20 uppercase tracking-[0.2em] text-right">Saldo em Dívida</span>
                    <span className="col-span-2 text-[9px] font-black text-white/20 uppercase tracking-[0.2em] text-center">Ação</span>
                  </div>

                  {filteredDebtors.map((debtor) => {
                    const risk = debtor.balance >= 50000 ? 'alto' : debtor.balance >= 10000 ? 'médio' : 'baixo';
                    const riskColor = risk === 'alto' ? 'text-red-400 border-red-500/20 bg-red-500/10' : risk === 'médio' ? 'text-orange-400 border-orange-500/20 bg-orange-500/10' : 'text-yellow-400 border-yellow-500/20 bg-yellow-500/10';
                    return (
                      <div key={debtor.id} className="grid grid-cols-12 gap-4 items-center p-4 bg-white/[0.02] rounded-2xl border border-white/5 hover:border-gold-primary/20 transition-all group">
                        <div className="col-span-4 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-white/20 shrink-0">
                            <User size={16} />
                          </div>
                          <div>
                            <div className="font-black text-white text-sm tracking-tight truncate">{debtor.name}</div>
                            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${riskColor}`}>
                              Risco {risk}
                            </span>
                          </div>
                        </div>
                        <div className="col-span-3 space-y-1">
                          {debtor.phone && (
                            <div className="flex items-center gap-1.5 text-[10px] text-white/40 font-bold">
                              <Phone size={10} className="text-gold-primary/40" /> {debtor.phone}
                            </div>
                          )}
                          {debtor.email && (
                            <div className="flex items-center gap-1.5 text-[10px] text-white/40 font-bold truncate">
                              <Mail size={10} className="text-gold-primary/40" /> {debtor.email}
                            </div>
                          )}
                        </div>
                        <div className="col-span-3 text-right">
                          <div className="font-black text-red-400 text-base tracking-tighter italic">{debtor.balance.toLocaleString()}</div>
                          <div className="text-[9px] font-black text-white/20 uppercase tracking-widest">{user?.currency}</div>
                        </div>
                        <div className="col-span-2 text-center">
                          {debtor.phone && (
                            <a
                              href={`https://wa.me/${debtor.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${debtor.name}, entrámos em contacto sobre o seu saldo pendente de ${debtor.balance.toLocaleString()} ${user?.currency}. Por favor, entre em contacto connosco para regularizar a sua situação.`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center px-3 py-2 bg-emerald-500/10 text-emerald-400 rounded-xl text-[9px] font-black uppercase tracking-widest border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all"
                            >
                              WhatsApp
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/5 shrink-0 flex items-center justify-between">
              <div className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                Total em dívida: <span className="text-red-400">{debtors.reduce((s, d) => s + (d.balance || 0), 0).toLocaleString()} {user?.currency}</span>
              </div>
              <button
                onClick={() => setShowCobran(false)}
                className="px-6 py-3 bg-white/5 text-white/60 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-white/5 hover:bg-white/10 hover:text-white transition-all"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
