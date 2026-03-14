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
  ];

  const tabs = allTabs.filter(tab => user && tab.roles.includes(user.role));

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Sales Navigation */}
      <div className="bg-white border-b px-6 py-3 flex gap-2 overflow-x-auto shrink-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeTab === tab.id
              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
              : 'text-gray-500 hover:bg-gray-100'
              }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sales Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'pos' && <POS />}
        {activeTab === 'products' && <Products />}
        {activeTab === 'purchase-orders' && <PurchaseOrders />}
        {activeTab === 'categories' && <Categories />}
        {activeTab === 'customers' && <Customers />}
        {activeTab === 'financial' && <Financial />}
        {activeTab === 'reports' && <Reports />}
      </div>
    </div>
  );
}
