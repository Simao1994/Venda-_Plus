import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  Search,
  RefreshCw,
  ChevronRight,
  BarChart3,
  Store,
  Cross,
  Briefcase,
  Wallet
} from 'lucide-react';
import {
  AreaChart,
  Area,
  ResponsiveContainer
} from 'recharts';
import { api } from '../lib/api';

export default function MobileApp() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [currentModule, setCurrentModule] = useState<'geral' | 'farmacia'>('geral');

  const [stats, setStats] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [currentModule]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (currentModule === 'geral') {
        const [statsRes, prodRes, salesRes] = await Promise.all([
          api.get('/api/dashboard/stats'),
          api.get('/api/products'),
          api.get('/api/sales')
        ]);

        const [statsData, prodData, salesData] = await Promise.all([
          statsRes.json(),
          prodRes.json(),
          salesRes.json()
        ]);

        setStats(statsData);
        setProducts(prodData);
        setRecentSales(salesData.slice(0, 20));
      } else {
        const [statsRes, prodRes, salesRes] = await Promise.all([
          api.get('/api/farmacia/stats'),
          api.get('/api/farmacia/medicamentos'),
          api.get('/api/farmacia/vendas')
        ]);

        const [statsData, prodData, salesData] = await Promise.all([
          statsRes.json(),
          prodRes.json(),
          salesRes.json()
        ]);

        setStats(statsData);
        // Map pharmacy products to standard format for mobile display
        setProducts(prodData.map((p: any) => ({
          id: p.id,
          name: p.nome_medicamento,
          barcode: p.codigo_barras || p.codigo_interno,
          sale_price: p.preco_venda,
          stock: p.stock_total,
          min_stock: p.estoque_minimo,
          unit: p.forma_farmaceutica
        })));

        // Map pharmacy sales to standard format
        setRecentSales(salesData.map((s: any) => ({
          id: s.id,
          invoice_number: s.numero_factura,
          created_at: s.created_at,
          status: s.estado === 'pago' ? 'paid' : 'pending',
          payment_method: s.forma_pagamento,
          total: s.total
        })).slice(0, 20));
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw className="animate-spin text-emerald-600" size={32} />
      </div>
    );
  }

  const filteredProducts = Array.isArray(products) ? products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    (p.barcode && p.barcode.includes(search))
  ) : [];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20">
      {/* Header with Premium Gradient */}
      <header className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white p-6 pt-12 rounded-b-[45px] shadow-xl sticky top-0 z-30 transition-all duration-500">
        <div className="flex justify-between items-center mb-6">
          <div className="animate-in fade-in slide-in-from-left duration-700">
            <h1 className="text-3xl font-black tracking-tighter leading-none italic drop-shadow-sm">
              VENDA <span className="text-emerald-300">PLUS</span>
            </h1>
            <p className="text-emerald-100/80 text-[10px] font-black uppercase tracking-[0.2em] mt-1.5 ml-0.5">{user?.company_name}</p>
          </div>
          <div className="w-13 h-13 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/20 shadow-inner group">
            <Store size={24} className="group-active:scale-90 transition-transform" />
          </div>
        </div>

        {/* Module Selector - Glassmorphism style */}
        <div className="flex bg-black/10 backdrop-blur-md p-1 rounded-2xl border border-white/5">
          <button
            onClick={() => setCurrentModule('geral')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-300 ${currentModule === 'geral' ? 'bg-white text-emerald-800 shadow-lg' : 'text-emerald-50 hover:bg-white/5'
              }`}
          >
            <Briefcase size={16} />
            Geral
          </button>
          <button
            onClick={() => setCurrentModule('farmacia')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-300 ${currentModule === 'farmacia' ? 'bg-white text-emerald-800 shadow-lg' : 'text-emerald-50 hover:bg-white/5'
              }`}
          >
            <Cross size={16} />
            Farmácia
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-4 space-y-6 overflow-x-hidden">
        {activeTab === 'home' && (
          <>
            {/* Quick Stats - Premium Cards */}
            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom duration-500 delay-150">
              <div className="bg-white p-6 rounded-[35px] shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border border-gray-100 hover:scale-[1.02] transition-transform">
                <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                  <TrendingUp size={22} />
                </div>
                <p className="text-gray-400 text-[9px] font-black uppercase tracking-[0.15em]">Vendas Hoje</p>
                <p className="text-2xl font-black text-slate-900 mt-1.5">{stats?.salesToday?.toLocaleString() || '0'} <span className="text-emerald-600 text-sm">{user?.currency}</span></p>
              </div>
              <div className="bg-white p-6 rounded-[35px] shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border border-gray-100 hover:scale-[1.02] transition-transform">
                <div className="w-11 h-11 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                  <AlertTriangle size={22} />
                </div>
                <p className="text-gray-400 text-[9px] font-black uppercase tracking-[0.15em]">Stock Crítico</p>
                <p className="text-2xl font-black text-slate-900 mt-1.5">{stats?.lowStock} <span className="text-amber-600 text-[10px] font-black">{currentModule === 'farmacia' ? 'MED.' : 'ITEMS'}</span></p>
              </div>
            </div>

            {/* Performance Chart */}
            <div className="bg-white p-6 rounded-[40px] shadow-sm border border-gray-100">
              <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 size={18} className="text-emerald-600" />
                Desempenho Semanal
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats?.dailySales}>
                    <defs>
                      <linearGradient id="mobileColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="total" stroke="#10b981" strokeWidth={3} fill="url(#mobileColor)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Critical Alerts */}
            {stats?.lowStock > 0 && (
              <div className="bg-red-50 p-6 rounded-[40px] border border-red-100">
                <h3 className="text-red-800 font-black text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                  <AlertTriangle size={18} />
                  Alertas de Reposição
                </h3>
                <div className="space-y-3">
                  {Array.isArray(products) && products.filter(p => p.stock <= p.min_stock).slice(0, 3).map(p => (
                    <div key={p.id} className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm">
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{p.name}</p>
                        <p className="text-[10px] text-red-500 font-black uppercase">Stock: {p.stock} {p.unit || 'un'}</p>
                      </div>
                      <ChevronRight size={16} className="text-gray-300" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder={currentModule === 'farmacia' ? "Pesquisar medicamentos..." : "Pesquisar produtos..."}
                className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border-none shadow-sm focus:ring-2 focus:ring-emerald-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="space-y-4 animate-in fade-in slide-in-from-bottom duration-700">
              {filteredProducts.map(p => (
                <div key={p.id} className="bg-white p-5 rounded-[30px] shadow-sm border border-gray-50 flex justify-between items-center group active:scale-[0.98] transition-all duration-200">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-active:bg-emerald-50 group-active:text-emerald-500 transition-colors">
                      {currentModule === 'farmacia' ? <Cross size={22} className="text-emerald-500/70" /> : <Package size={22} />}
                    </div>
                    <div>
                      <p className="font-black text-slate-900 leading-tight">{p.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">{p.barcode || 'Sem código'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-emerald-600 text-lg leading-none">{p.sale_price?.toLocaleString() || '0'} <span className="text-[10px]">{user?.currency}</span></p>
                    <div className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full ${p.stock <= p.min_stock ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-500'}`}>
                      <span className="text-[9px] font-black uppercase tracking-tight">Stock: {p.stock}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'sales' && (
          <div className="space-y-4">
            <h3 className="font-black text-gray-900 px-2">Vendas em Tempo Real</h3>
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom duration-700">
              {recentSales.map(sale => (
                <div key={sale.id} className="bg-white p-6 rounded-[35px] shadow-sm border border-gray-50 active:scale-[0.98] transition-all duration-200">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-black text-slate-900 text-lg tracking-tight">{sale.invoice_number}</p>
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-0.5">{new Date(sale.created_at).toLocaleString()}</p>
                    </div>
                    <span className={`px-4 py-1.5 rounded-2xl text-[9px] font-black uppercase tracking-[0.1em] ${sale.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                      {sale.status === 'paid' ? 'Liquidado' : 'Pendente'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-slate-100 rounded-lg flex items-center justify-center">
                        <Wallet size={12} className="text-slate-500" />
                      </div>
                      <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider">{sale.payment_method}</span>
                    </div>
                    <span className="text-xl font-black text-slate-900">{sale.total?.toLocaleString() || '0'} <span className="text-sm font-black text-emerald-600">{user?.currency}</span></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-[40px] shadow-sm border border-gray-100">
              <h3 className="font-black text-gray-900 mb-6 uppercase tracking-widest text-xs text-gray-400">Resumo Financeiro Mensal</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Vendas Brutas</span>
                  <span className="font-black text-gray-900">{stats?.salesMonth?.toLocaleString() || 0} {user?.currency}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">A Receber</span>
                  <span className="font-black text-amber-600">{stats?.totalReceivable?.toLocaleString() || 0} {user?.currency}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">A Pagar</span>
                  <span className="font-black text-red-600">{stats?.totalPayable?.toLocaleString() || 0} {user?.currency}</span>
                </div>
                <div className="pt-4 border-t border-dashed flex justify-between items-center">
                  <span className="text-gray-900 font-black">Saldo Projetado</span>
                  <span className="text-xl font-black text-emerald-600">
                    {((stats?.salesMonth || 0) + (stats?.totalReceivable || 0) - (stats?.totalPayable || 0))?.toLocaleString() || '0'} {user?.currency}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-emerald-600 p-8 rounded-[40px] text-white shadow-xl shadow-emerald-100">
              <h3 className="font-black text-lg mb-2">Desempenho da Loja</h3>
              <p className="text-emerald-100 text-sm mb-6">A sua loja está a crescer 12% em relação ao mês passado.</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 p-4 rounded-3xl backdrop-blur-sm">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Ticket Médio</p>
                  <p className="text-xl font-black mt-1">4.500 {user?.currency}</p>
                </div>
                <div className="bg-white/10 p-4 rounded-3xl backdrop-blur-sm">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Conversão</p>
                  <p className="text-xl font-black mt-1">68%</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Glassmorphism Bottom Navigation */}
      <nav className="fixed bottom-4 left-4 right-4 bg-white/80 backdrop-blur-2xl border border-white/20 rounded-[35px] px-6 py-4 flex justify-between items-center z-50 shadow-[0_20px_50px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom duration-1000">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === 'home' ? 'text-emerald-600 translate-y-[-4px]' : 'text-slate-400 opacity-60'}`}
        >
          <div className={`p-1.5 rounded-xl transition-colors ${activeTab === 'home' ? 'bg-emerald-50' : ''}`}>
            <LayoutDashboard size={24} strokeWidth={activeTab === 'home' ? 3 : 2} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-tighter">Resumo</span>
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === 'products' ? 'text-emerald-600 translate-y-[-4px]' : 'text-slate-400 opacity-60'}`}
        >
          <div className={`p-1.5 rounded-xl transition-colors ${activeTab === 'products' ? 'bg-emerald-50' : ''}`}>
            {currentModule === 'farmacia' ? <Cross size={24} strokeWidth={activeTab === 'products' ? 3 : 2} /> : <Package size={24} strokeWidth={activeTab === 'products' ? 3 : 2} />}
          </div>
          <span className="text-[9px] font-black uppercase tracking-tighter">Stock</span>
        </button>
        <button
          onClick={() => setActiveTab('sales')}
          className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === 'sales' ? 'text-emerald-600 translate-y-[-4px]' : 'text-slate-400 opacity-60'}`}
        >
          <div className={`p-1.5 rounded-xl transition-colors ${activeTab === 'sales' ? 'bg-emerald-50' : ''}`}>
            <ShoppingCart size={24} strokeWidth={activeTab === 'sales' ? 3 : 2} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-tighter">Vendas</span>
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === 'reports' ? 'text-emerald-600 translate-y-[-4px]' : 'text-slate-400 opacity-60'}`}
        >
          <div className={`p-1.5 rounded-xl transition-colors ${activeTab === 'reports' ? 'bg-emerald-50' : ''}`}>
            <BarChart3 size={24} strokeWidth={activeTab === 'reports' ? 3 : 2} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-tighter">Dados</span>
        </button>
      </nav>
    </div>
  );
}
