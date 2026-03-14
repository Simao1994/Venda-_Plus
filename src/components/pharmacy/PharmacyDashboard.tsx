import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Pill, AlertTriangle, Activity, CheckCircle2 } from 'lucide-react';

export default function PharmacyDashboard() {
  const { token, user } = useAuth();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    // Mock data for now
    setStats({
      totalMedicamentos: 120,
      medicamentosBaixoStock: 5,
      receitasPendentes: 12,
      vendasHoje: 45000
    });
  }, []);

  if (!stats) return <div className="p-8 text-center text-gray-500">Carregando dashboard da farmácia...</div>;

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Farmácia</h1>
        <p className="text-gray-500">Visão geral do seu módulo farmacêutico.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-emerald-500 p-3 rounded-xl text-white shadow-lg">
              <Pill size={24} />
            </div>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Total Medicamentos</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalMedicamentos}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-red-500 p-3 rounded-xl text-white shadow-lg">
              <AlertTriangle size={24} />
            </div>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Alertas de Stock</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.medicamentosBaixoStock}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-blue-500 p-3 rounded-xl text-white shadow-lg">
              <Activity size={24} />
            </div>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Receitas Pendentes</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.receitasPendentes}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-emerald-600 p-3 rounded-xl text-white shadow-lg">
              <CheckCircle2 size={24} />
            </div>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Vendas Hoje</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.vendasHoje.toLocaleString()} {user?.currency}</p>
        </div>
      </div>
    </div>
  );
}
