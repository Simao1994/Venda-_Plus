import React, { useState } from 'react';
import {
  Activity,
  MonitorPlay,
  Package,
  Tag,
  Users,
  Wallet,
  BarChart3,
  Truck
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

import Dashboard from '../Dashboard';
import POS from '../POS';
import Products from '../Products';
import Categories from '../Categories';
import Customers from '../Customers';
import Financial from '../Financial';
import Reports from '../Reports';
import PurchaseOrders from '../PurchaseOrders';
import InventorySessions from './InventorySessions';

export default function SalesModule() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  const allTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity, roles: ['admin', 'manager', 'cashier', 'master'] },
    { id: 'pos', label: 'Terminal POS', icon: MonitorPlay, roles: ['admin', 'manager', 'cashier', 'master'] },
    { id: 'products', label: 'Produtos', icon: Package, roles: ['admin', 'manager', 'master'] },
    { id: 'purchase-orders', label: 'Compras & Stock', icon: Truck, roles: ['admin', 'manager', 'master'] },
    { id: 'categories', label: 'Categorias', icon: Tag, roles: ['admin', 'manager', 'master'] },
    { id: 'customers', label: 'Clientes', icon: Users, roles: ['admin', 'manager', 'cashier', 'master'] },
    { id: 'financial', label: 'Financeiro', icon: Wallet, roles: ['admin', 'manager', 'master'] },
    { id: 'reports', label: 'Relatórios', icon: BarChart3, roles: ['admin', 'manager', 'master'] },
    { id: 'inventory', label: 'Inventário', icon: Activity, roles: ['admin', 'manager', 'master'] },
  ];

  const tabs = allTabs.filter(tab => user && tab.roles.includes(user.role));

  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* Sales Navigation */}
      <div className="glass-panel border-b border-white/5 px-8 py-4 flex gap-3 overflow-x-auto shrink-0 custom-scrollbar z-10">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all border ${activeTab === tab.id
              ? 'bg-gradient-to-r from-gold-primary/20 to-gold-secondary/10 text-gold-primary border-gold-primary/30 shadow-[0_0_20px_rgba(212,175,55,0.1)]'
              : 'text-white/40 border-transparent hover:bg-white/5 hover:text-gold-primary/60'
              }`}
          >
            <tab.icon size={14} className={activeTab === tab.id ? 'animate-pulse' : ''} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sales Content */}
      <div className="flex-1 overflow-y-auto relative custom-scrollbar">
        {/* Module-specific background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-gold-primary/[0.03] rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 h-full">
          {activeTab === 'dashboard' && <Dashboard onNavigate={setActiveTab} />}
          {activeTab === 'pos' && <POS />}
          {activeTab === 'products' && <Products />}
          {activeTab === 'purchase-orders' && <PurchaseOrders />}
          {activeTab === 'categories' && <Categories />}
          {activeTab === 'customers' && <Customers />}
          {activeTab === 'financial' && <Financial />}
          {activeTab === 'reports' && <Reports />}
          {activeTab === 'inventory' && <InventorySessions />}
        </div>
      </div>
    </div>
  );
}
