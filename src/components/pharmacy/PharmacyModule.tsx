import React, { useState } from 'react';
import {
  Activity, Pill, Boxes, ShoppingCart, Truck,
  MonitorPlay, FileSignature, Users, Bell, BarChart3, DollarSign
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

import PharmacyDashboard from './PharmacyDashboard';
import Medicamentos from './Medicamentos';
import Lotes from './Lotes';
import Compras from './Compras';
import Fornecedores from './Fornecedores';
import PharmacyPOS from './PharmacyPOS';
import Receitas from './Receitas';
import ClientesFarmacia from './ClientesFarmacia';
import Alertas from './Alertas';
import RelatoriosFarmacia from './RelatoriosFarmacia';
import PharmacyFinance from './PharmacyFinance';
import PharmacyInventory from './PharmacyInventory';
import PharmacyStockAdjustment from './PharmacyStockAdjustment';
import PharmacyEmployeeSales from './PharmacyEmployeeSales';

export default function PharmacyModule() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  const allTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity, roles: ['admin', 'manager', 'cashier', 'master'] },
    { id: 'pos', label: 'POS Farmácia', icon: MonitorPlay, roles: ['admin', 'manager', 'cashier', 'master'] },
    { id: 'medicamentos', label: 'Medicamentos', icon: Pill, roles: ['admin', 'manager', 'cashier', 'master'] },
    { id: 'lotes', label: 'Lotes', icon: Boxes, roles: ['admin', 'manager', 'master'] },
    { id: 'receitas', label: 'Receitas Médicas', icon: FileSignature, roles: ['admin', 'manager', 'cashier', 'master'] },
    { id: 'compras', label: 'Compras', icon: ShoppingCart, roles: ['admin', 'manager', 'master'] },
    { id: 'fornecedores', label: 'Fornecedores', icon: Truck, roles: ['admin', 'manager', 'master'] },
    { id: 'clientes', label: 'Pacientes', icon: Users, roles: ['admin', 'manager', 'cashier', 'master'] },
    { id: 'alertas', label: 'Alertas', icon: Bell, roles: ['admin', 'manager', 'cashier', 'master'] },
    { id: 'relatorios', label: 'Relatórios', icon: BarChart3, roles: ['admin', 'manager', 'master'] },
    { id: 'relatorios_vendedores', label: 'Desempenho Equipa', icon: Users, roles: ['admin', 'manager', 'master'] },
    { id: 'financeiro', label: 'Financeiro', icon: DollarSign, roles: ['admin', 'manager', 'master'] },
    { id: 'inventario', label: 'Inventário', icon: FileSignature, roles: ['admin', 'manager', 'master'] },
    { id: 'ajustes', label: 'Ajustes de Stock', icon: Activity, roles: ['admin', 'manager', 'master'] },
  ];

  const tabs = allTabs.filter(tab => user && tab.roles.includes(user.role));

  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* ── Navigation ── */}
      <div className="glass-panel border-b border-white/5 px-8 py-4 flex gap-3 overflow-x-auto shrink-0 custom-scrollbar z-10">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all border ${activeTab === tab.id
              ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
              : 'text-white/40 border-transparent hover:bg-white/5 hover:text-emerald-400/60'
              }`}
          >
            <tab.icon size={14} className={activeTab === tab.id ? 'animate-pulse' : ''} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto relative custom-scrollbar">
        {/* Background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-emerald-500/[0.03] rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 h-full">
          {activeTab === 'dashboard' && <PharmacyDashboard />}
          {activeTab === 'pos' && <PharmacyPOS />}
          {activeTab === 'medicamentos' && <Medicamentos />}
          {activeTab === 'lotes' && <Lotes />}
          {activeTab === 'receitas' && <Receitas />}
          {activeTab === 'compras' && <Compras />}
          {activeTab === 'fornecedores' && <Fornecedores />}
          {activeTab === 'clientes' && <ClientesFarmacia />}
          {activeTab === 'alertas' && <Alertas />}
          {activeTab === 'relatorios' && <RelatoriosFarmacia />}
          {activeTab === 'financeiro' && <PharmacyFinance />}
          {activeTab === 'inventario' && <PharmacyInventory />}
          {activeTab === 'ajustes' && <PharmacyStockAdjustment />}
          {activeTab === 'relatorios_vendedores' && <PharmacyEmployeeSales />}
        </div>
      </div>
    </div>
  );
}
