// @ts-nocheck
import React, { useState, Component } from 'react';

// Error Boundary
class ErrorBoundary extends Component<any, any> {
  state = { hasError: false, error: null as any };
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) { console.error(`Erro na tab ${this.props.tabName}:`, error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center m-6">
          <div className="glass-panel rounded-[40px] p-10 border border-red-500/20 inline-block">
            <h2 className="text-lg font-black text-red-400 uppercase tracking-widest italic mb-4">Erro no Módulo ({this.props.tabName})</h2>
            <pre className="text-[10px] text-white/30 font-mono overflow-auto text-left max-w-lg">{this.state.error?.message}</pre>
            <button onClick={() => this.setState({ hasError: false, error: null })} className="mt-6 px-6 py-3 bg-red-500/20 text-red-400 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-red-500/30 hover:bg-red-500/30 transition-all">
              Tentar Novamente
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

import {
  Users, Building2, CalendarCheck, FileSpreadsheet,
  LayoutDashboard, FileText, Target, IdCard, CreditCard, ClipboardList
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
  const [autoPrintEmployee, setAutoPrintEmployee] = useState(null);

  const handleAutoPrint = (emp: any) => {
    setAutoPrintEmployee(emp);
    setActiveTab('passes');
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'master', 'hr', 'director_hr', 'saas_admin'] },
    { id: 'employees', label: 'Funcionários', icon: Users, roles: ['admin', 'manager', 'master', 'hr', 'director_hr', 'saas_admin'] },
    { id: 'departments', label: 'Departamentos', icon: Building2, roles: ['admin', 'manager', 'master', 'hr', 'director_hr', 'saas_admin'] },
    { id: 'attendance', label: 'Presenças', icon: CalendarCheck, roles: ['admin', 'manager', 'master', 'hr', 'director_hr', 'saas_admin'] },
    { id: 'payroll', label: 'Folha Salarial', icon: FileSpreadsheet, roles: ['admin', 'manager', 'master', 'hr', 'director_hr', 'saas_admin'] },
    { id: 'performance', label: 'Performance', icon: Target, roles: ['admin', 'manager', 'master', 'hr', 'director_hr', 'saas_admin'] },
    { id: 'passes', label: 'Passes PVC', icon: IdCard, roles: ['admin', 'manager', 'master', 'hr', 'director_hr', 'saas_admin'] },
    { id: 'bank', label: 'Contas Bancárias', icon: CreditCard, roles: ['admin', 'manager', 'master', 'hr', 'director_hr', 'saas_admin'] },
    { id: 'vagas', label: 'Vagas Admin', icon: ClipboardList, roles: ['admin', 'manager', 'master', 'hr', 'director_hr', 'saas_admin'] },
  ];

  if (!user) return (
    <div className="p-8 text-center">
      <div className="w-10 h-10 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto" />
    </div>
  );

  const filteredTabs = tabs.filter(tab => tab.roles.includes(user.role));

  return (
    <div className="flex flex-col h-full">
      {/* ── Premium HR Navigation ── */}
      <div className="glass-panel border-b border-white/5 px-6 py-4 flex gap-2 overflow-x-auto shrink-0 custom-scrollbar">
        {filteredTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] whitespace-nowrap transition-all ${activeTab === tab.id
              ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.1)]'
              : 'text-white/30 hover:text-white/50 hover:bg-white/5 border border-transparent'
              }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Content Area ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.03),transparent_60%)]" />
        <ErrorBoundary key={activeTab} tabName={activeTab}>
          {activeTab === 'dashboard' && <HRDashboard />}
          {activeTab === 'employees' && <Employees onAutoPrint={handleAutoPrint} />}
          {activeTab === 'departments' && <Departments />}
          {activeTab === 'attendance' && <Attendance />}
          {activeTab === 'payroll' && <Payroll />}
          {activeTab === 'performance' && <PerformanceTab />}
          {activeTab === 'passes' && (
            <PassesTab 
              autoPrintEmployee={autoPrintEmployee} 
              onClearAutoPrint={() => setAutoPrintEmployee(null)} 
            />
          )}
          {activeTab === 'bank' && <BankAccountsTab user={user as any} funcionarioId={null} />}
          {activeTab === 'vagas' && <VagasAdminTab />}
        </ErrorBoundary>
      </div>
    </div>
  );
}
