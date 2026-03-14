import React, { useState } from 'react';
import {
  Activity,
  Pill,
  Boxes,
  ShoppingCart,
  Truck,
  MonitorPlay,
  FileSignature,
  Users,
  Bell,
  BarChart3
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
  ];

  const tabs = allTabs.filter(tab => user && tab.roles.includes(user.role));

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Pharmacy Navigation */}
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

      {/* Pharmacy Content */}
      <div className="flex-1 overflow-y-auto">
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
      </div>
    </div>
  );
}
