import React, { useState } from 'react';
import {
  Users,
  Building2,
  CalendarCheck,
  FileSpreadsheet,
  LayoutDashboard,
  FileText
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

import HRDashboard from './HRDashboard';
import Employees from './Employees';
import Departments from './Departments';
import Attendance from './Attendance';
import Payroll from './Payroll';

export default function HRModule() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'master'] },
    { id: 'employees', label: 'Funcionários', icon: Users, roles: ['admin', 'manager', 'master'] },
    { id: 'departments', label: 'Departamentos', icon: Building2, roles: ['admin', 'manager', 'master'] },
    { id: 'attendance', label: 'Presenças', icon: CalendarCheck, roles: ['admin', 'manager', 'master'] },
    { id: 'payroll', label: 'Folha Salarial', icon: FileSpreadsheet, roles: ['admin', 'manager', 'master'] },
  ];

  if (!user) return <div className="p-8 text-center font-bold text-slate-400">Carregando permissões...</div>;

  const filteredTabs = tabs.filter(tab => tab.roles.includes(user.role));

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* HR Navigation */}
      <div className="bg-white border-b px-6 py-3 flex gap-2 overflow-x-auto shrink-0">
        {filteredTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeTab === tab.id
              ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
              : 'text-gray-500 hover:bg-gray-100'
              }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* HR Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'dashboard' && <HRDashboard />}
        {activeTab === 'employees' && <Employees />}
        {activeTab === 'departments' && <Departments />}
        {activeTab === 'attendance' && <Attendance />}
        {activeTab === 'payroll' && <Payroll />}
      </div>
    </div>
  );
}
