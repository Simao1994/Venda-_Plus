// @ts-nocheck
import React, { useState, Component, ErrorInfo, ReactNode } from 'react';

// Error Boundary para capturar crashes das tabs e não deixar a tela toda branca
class ErrorBoundary extends Component<any, any> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Erro na tab ${this.props.tabName}:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center text-red-500 bg-red-50 rounded-xl m-6 border border-red-200">
          <h2 className="text-xl font-bold mb-2">Erro ao carregar o módulo ({this.props.tabName})</h2>
          <pre className="text-sm overflow-auto text-left font-mono">{this.state.error?.message}</pre>
          <pre className="text-xs overflow-auto text-left mt-2 opacity-70">{this.state.error?.stack}</pre>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded font-bold"
          >Tentar Novamente</button>
        </div>
      );
    }
    return this.props.children;
  }
}
import {
  Users,
  Building2,
  CalendarCheck,
  FileSpreadsheet,
  LayoutDashboard,
  FileText,
  Target,
  IdCard
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

import HRDashboard from './HRDashboard';
import Employees from './Employees';
import Departments from './Departments';
import Attendance from './Attendance';
import Payroll from './Payroll';
import BankAccountsTab from './BankAccountsTab';
import VagasAdminTab from './VagasAdminTab';
import PerformanceTab from './PerformanceTab';
import PassesTab from './PassesTab';

export default function HRModule() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'master'] },
    { id: 'employees', label: 'Funcionários', icon: Users, roles: ['admin', 'manager', 'master'] },
    { id: 'departments', label: 'Departamentos', icon: Building2, roles: ['admin', 'manager', 'master'] },
    { id: 'attendance', label: 'Presenças', icon: CalendarCheck, roles: ['admin', 'manager', 'master'] },
    { id: 'payroll', label: 'Folha Salarial', icon: FileSpreadsheet, roles: ['admin', 'manager', 'master'] },
    { id: 'performance', label: 'Performance', icon: Target, roles: ['admin', 'manager', 'master'] },
    { id: 'passes', label: 'Passes PVC', icon: IdCard, roles: ['admin', 'manager', 'master'] },
    { id: 'bank', label: 'Contas Bancárias', icon: FileText, roles: ['admin', 'manager', 'master'] },
    { id: 'vagas', label: 'Vagas', icon: FileText, roles: ['admin', 'manager', 'master'] },
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
        <ErrorBoundary key={activeTab} tabName={activeTab}>
          {activeTab === 'dashboard' && <HRDashboard />}
          {activeTab === 'employees' && <Employees />}
          {activeTab === 'departments' && <Departments />}
          {activeTab === 'attendance' && <Attendance />}
          {activeTab === 'payroll' && <Payroll />}
          {activeTab === 'performance' && <PerformanceTab />}
          {activeTab === 'passes' && <PassesTab />}
          {activeTab === 'bank' && <BankAccountsTab user={user as any} funcionarioId={null} />}
          {activeTab === 'vagas' && <VagasAdminTab />}
        </ErrorBoundary>
      </div>
    </div>
  );
}
