import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Users,
  Building2,
  TrendingUp,
  DollarSign,
  PieChart,
  Calendar
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

export default function HRDashboard() {
  const { token, user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/hr/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setStats(data || {});
    } catch (error) {
      console.error('Error fetching HR stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Carregando...</div>;

  const lastPayroll = stats?.lastPayroll;

  const chartData = lastPayroll ? [
    { name: 'Salário Líquido', value: lastPayroll.total_net, color: '#4f46e5' },
    { name: 'IRT', value: lastPayroll.total_irt, color: '#ef4444' },
    { name: 'INSS (Trab.)', value: lastPayroll.total_inss_employee, color: '#f59e0b' },
    { name: 'INSS (Emp.)', value: lastPayroll.total_inss_employer, color: '#10b981' },
  ] : [];

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Funcionários Ativos</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats?.employees || 0}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
              <Building2 size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Departamentos</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats?.departments || 0}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Custo Total Folha</p>
              <h3 className="text-2xl font-bold text-gray-900">
                {lastPayroll ? (lastPayroll.total_gross + lastPayroll.total_inss_employer).toLocaleString() : 0} {user?.currency}
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Impostos Pagos (IRT+INSS)</p>
              <h3 className="text-2xl font-bold text-gray-900">
                {lastPayroll ? (lastPayroll.total_irt + lastPayroll.total_inss_employee + lastPayroll.total_inss_employer).toLocaleString() : 0} {user?.currency}
              </h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <PieChart size={20} className="text-indigo-600" />
            Distribuição de Custos (Última Folha)
          </h3>
          <div className="h-[300px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => val.toLocaleString()} />
                  <Tooltip
                    formatter={(val: any) => [val.toLocaleString() + ' ' + user?.currency, 'Valor']}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <div className="text-center">
                  <PieChart size={32} className="mx-auto mb-2 opacity-20" />
                  <p className="text-xs font-bold uppercase tracking-widest">Sem dados disponíveis</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Calendar size={20} className="text-indigo-600" />
            Resumo da Última Folha ({lastPayroll?.month}/{lastPayroll?.year})
          </h3>
          {lastPayroll ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                <span className="text-gray-600">Salário Bruto Total</span>
                <span className="font-bold">{lastPayroll.total_gross.toLocaleString()} {user?.currency}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                <span className="text-gray-600">IRT Total</span>
                <span className="font-bold text-rose-600">-{lastPayroll.total_irt.toLocaleString()} {user?.currency}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                <span className="text-gray-600">INSS Trabalhador (3%)</span>
                <span className="font-bold text-amber-600">-{lastPayroll.total_inss_employee.toLocaleString()} {user?.currency}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                <span className="text-gray-600">INSS Empresa (8%)</span>
                <span className="font-bold text-emerald-600">{lastPayroll.total_inss_employer.toLocaleString()} {user?.currency}</span>
              </div>
              <div className="pt-4 border-t flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">Salário Líquido Total</span>
                <span className="text-xl font-black text-indigo-600">{lastPayroll.total_net.toLocaleString()} {user?.currency}</span>
              </div>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-slate-400 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
              <div className="text-center">
                <Calendar size={32} className="mx-auto mb-2 opacity-20" />
                <p className="text-xs font-bold uppercase tracking-widest">Gere a primeira folha</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
