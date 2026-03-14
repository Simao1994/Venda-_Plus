import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AlertTriangle, Clock, PackageX } from 'lucide-react';

export default function Alertas() {
  const { token } = useAuth();
  const [alertas, setAlertas] = useState({ stockBaixo: [], validadeProxima: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/farmacia/alertas', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setAlertas(data);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">A carregar alertas...</div>;

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Alertas do Sistema</h1>
        <p className="text-gray-500">Monitorização de stock e validades.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Alertas de Stock Baixo */}
        <div className="bg-white rounded-2xl shadow-sm border border-red-100 overflow-hidden">
          <div className="p-4 border-b border-red-100 bg-red-50 flex items-center gap-3">
            <PackageX className="text-red-600" size={24} />
            <h2 className="font-bold text-red-900 text-lg">Stock Baixo / Esgotado</h2>
            <span className="ml-auto bg-red-200 text-red-800 py-1 px-3 rounded-full text-xs font-bold">
              {alertas.stockBaixo.length}
            </span>
          </div>
          <div className="p-4">
            {alertas.stockBaixo.length === 0 ? (
              <p className="text-center text-gray-500 py-4">Nenhum alerta de stock.</p>
            ) : (
              <div className="space-y-3">
                {alertas.stockBaixo.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div>
                      <div className="font-bold text-gray-900">{item.nome_medicamento}</div>
                      <div className="text-xs text-gray-500">Mínimo exigido: {item.estoque_minimo}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Stock Atual</div>
                      <div className="font-black text-red-600 text-lg">{item.stock_total}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Alertas de Validade */}
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden">
          <div className="p-4 border-b border-orange-100 bg-orange-50 flex items-center gap-3">
            <Clock className="text-orange-600" size={24} />
            <h2 className="font-bold text-orange-900 text-lg">Validade Próxima (&lt; 90 dias)</h2>
            <span className="ml-auto bg-orange-200 text-orange-800 py-1 px-3 rounded-full text-xs font-bold">
              {alertas.validadeProxima.length}
            </span>
          </div>
          <div className="p-4">
            {alertas.validadeProxima.length === 0 ? (
              <p className="text-center text-gray-500 py-4">Nenhum alerta de validade.</p>
            ) : (
              <div className="space-y-3">
                {alertas.validadeProxima.map((item: any) => {
                  const diasRestantes = Math.ceil((new Date(item.data_validade).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                  return (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div>
                        <div className="font-bold text-gray-900">{item.nome_medicamento}</div>
                        <div className="text-xs text-gray-500">Lote: {item.numero_lote} • Qtd: {item.quantidade_atual}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Vence em</div>
                        <div className={`font-black text-lg ${diasRestantes <= 30 ? 'text-red-600' : 'text-orange-600'}`}>
                          {diasRestantes} dias
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
