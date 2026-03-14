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

  if (!stats) return <div className="p-8 text-center text-gray-500">Carregando indicadores...</div>;

  const cards = [
    {
      title: 'Vendas Hoje',
      value: `${stats.salesToday.toLocaleString()} ${user?.currency}`,
      icon: TrendingUp,
      color: 'bg-emerald-500',
      trend: '+12.5%',
      trendUp: true
    },
    {
      title: 'Vendas do Mês',
      value: `${stats.salesMonth.toLocaleString()} ${user?.currency}`,
      icon: ShoppingBag,
      color: 'bg-blue-500',
      trend: '+8.2%',
      trendUp: true
    },
    {
      title: 'Stock Baixo',
      value: stats.lowStock,
      icon: AlertTriangle,
      color: 'bg-amber-500',
      trend: stats.lowStock > 0 ? 'Atenção necessária' : 'Tudo em ordem',
      trendUp: false
    },
    {
      title: 'Total Produtos',
      value: stats.totalProducts,
      icon: Package,
      color: 'bg-indigo-500',
      trend: 'Catálogo activo',
      trendUp: true
    },
    {
      title: 'Contas a Receber',
      value: `${stats.totalReceivable.toLocaleString()} ${user?.currency}`,
      icon: ArrowUpRight,
      color: 'bg-emerald-600',
      trend: 'Vendas a crédito',
      trendUp: true
    },
    {
      title: 'Contas a Pagar',
      value: `${stats.totalPayable.toLocaleString()} ${user?.currency}`,
      icon: ArrowDownRight,
      color: 'bg-red-600',
      trend: 'Despesas pendentes',
      trendUp: false
    },
  ];

  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-full">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Bem-vindo, {user?.name}</h1>
        <p className="text-gray-500">Aqui está o resumo do seu supermercado hoje.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {cards.map((card, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className={`${card.color} p-3 rounded-xl text-white shadow-lg relative`}>
                <card.icon size={24} />
                {card.title === 'Stock Baixo' && stats.lowStock > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                    {stats.lowStock}
                  </span>
                )}
              </div>
              <div className={`flex items-center text-xs font-bold ${card.trendUp ? 'text-emerald-600' : 'text-amber-600'}`}>
                {card.trend}
                {card.trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              </div>
            </div>
            <h3 className="text-gray-500 text-sm font-medium">{card.title}</h3>
            <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-900">Desempenho de Vendas (Últimos 7 dias)</h3>
            <div className="flex gap-2">
              <select
                className="text-sm border border-gray-200 bg-white rounded-lg px-3 py-1 focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-gray-700"
                value={chartType}
                onChange={(e) => setChartType(e.target.value as 'line' | 'bar')}
              >
                <option value="line">Gráfico de Linha</option>
                <option value="bar">Gráfico de Barras</option>
              </select>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'line' ? (
                <LineChart data={stats.dailySales}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#9ca3af' }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#9ca3af' }}
                    tickFormatter={(value) => `${value.toLocaleString()}`}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [`${value.toLocaleString()} ${user?.currency}`, 'Total']}
                    labelStyle={{ color: '#6b7280', fontWeight: 'bold', marginBottom: '4px' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              ) : (
                <BarChart data={stats.dailySales}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#9ca3af' }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#9ca3af' }}
                    tickFormatter={(value) => `${value.toLocaleString()}`}
                  />
                  <Tooltip
                    cursor={{ fill: '#f3f4f6' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [`${value.toLocaleString()} ${user?.currency}`, 'Total']}
                    labelStyle={{ color: '#6b7280', fontWeight: 'bold', marginBottom: '4px' }}
                  />
                  <Bar
                    dataKey="total"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={50}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-6">Produtos Mais Vendidos</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#4b5563' }}
                  width={100}
                />
                <Tooltip
                  cursor={{ fill: '#f3f4f6' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`${value} un`, 'Vendas']}
                />
                <Bar dataKey="total_sold" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-6">Produtos com Stock Baixo</h3>
          <div className="space-y-4">
            {stats.lowStock === 0 ? (
              <div className="text-center py-8 text-gray-400 italic">
                Nenhum alerta de stock no momento.
              </div>
            ) : (
              <div className="space-y-3">
                {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'master') ? (
                  stats.lowStockProducts.map((product: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-100">
                      <div className="font-bold text-amber-900 text-sm">{product.name}</div>
                      <div className="text-xs font-black text-amber-600 bg-amber-100 px-2 py-1 rounded-lg">
                        Stock: {product.stock} / {product.min_stock}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-amber-600 font-medium">
                    Existem {stats.lowStock} produtos que precisam de reposição.
                  </div>
                )}
              </div>
            )}

            <button className="w-full py-3 bg-gray-50 text-gray-600 rounded-xl font-medium hover:bg-gray-100 transition-colors">
              Ver Inventário Completo
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-6">Devedores Críticos</h3>
          <div className="space-y-4">
            {stats.criticalDebtors && stats.criticalDebtors.length > 0 ? (
              stats.criticalDebtors.map((debtor: any) => (
                <div key={debtor.id} className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center">
                      <User size={20} />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-sm">{debtor.name}</div>
                      <div className="text-[10px] text-red-600 font-black uppercase tracking-widest">Dívida Elevada</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-red-700">{debtor.balance.toLocaleString()} {user?.currency}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400 italic">
                Nenhum cliente com dívida crítica.
              </div>
            )}

            <button className="w-full py-3 bg-gray-50 text-gray-600 rounded-xl font-medium hover:bg-gray-100 transition-colors">
              Ver Todos os Recebíveis
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
