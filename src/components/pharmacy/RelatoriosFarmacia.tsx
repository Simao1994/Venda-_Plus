import React, { useState, useEffect, useRef } from 'react';
import { FileText, TrendingUp, Package, Users, Search, Calendar, ChevronDown, ChevronUp, Printer } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useReactToPrint } from 'react-to-print';

export default function RelatoriosFarmacia() {
  const { token, user } = useAuth();
  const [vendas, setVendas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState('today');
  const [expandedSale, setExpandedSale] = useState<number | null>(null);
  const [saleToPrint, setSaleToPrint] = useState<any>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrintReceipt = useReactToPrint({
    contentRef: receiptRef,
    pageStyle: `
      @page { size: 80mm auto; margin: 0mm; }
      @media print { body { margin: 0; padding: 0; } }
    `
  });

  useEffect(() => {
    fetchVendas();
    const interval = setInterval(fetchVendas, 30000);
    return () => clearInterval(interval);
  }, [filterDate]);

  const fetchVendas = async () => {
    try {
      const res = await fetch(`/api/farmacia/vendas?period=${filterDate}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setVendas(data);
    } finally {
      setLoading(false);
    }
  };

  const filteredVendas = vendas.filter(v => 
    v.numero_factura?.toLowerCase().includes(search.toLowerCase())
  );

  const totalVendas = filteredVendas.reduce((sum, v) => sum + v.total, 0);

  return (
    <div className="p-6 space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios Farmacêuticos</h1>
          <p className="text-gray-500">Gestão de vendas e faturas em tempo real.</p>
        </div>
        <div className="flex gap-3">
          <select 
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="rounded-xl border-gray-200 text-sm focus:ring-emerald-500"
          >
            <option value="today">Hoje</option>
            <option value="7days">Últimos 7 dias</option>
            <option value="month">Este Mês</option>
            <option value="all">Todo o Período</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border rounded-xl text-sm font-medium hover:bg-gray-50">
            <Printer size={18} />
            Imprimir Lista
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Vendas</p>
              <h3 className="text-xl font-bold">{totalVendas.toLocaleString()} {user?.currency}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <FileText size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Nº Faturas</p>
              <h3 className="text-xl font-bold">{filteredVendas.length}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b bg-gray-50/50 flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Pesquisar por fatura..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-bold">Fatura</th>
                <th className="px-6 py-4 font-bold">Data</th>
                <th className="px-6 py-4 font-bold">Método</th>
                <th className="px-6 py-4 font-bold">Total</th>
                <th className="px-6 py-4 font-bold">Estado</th>
                <th className="px-6 py-4 font-bold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-500">Carregando dados...</td>
                </tr>
              ) : filteredVendas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-500">Nenhuma venda encontrada.</td>
                </tr>
              ) : (
                filteredVendas.map((venda) => (
                  <React.Fragment key={venda.id}>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900">{venda.numero_factura}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(venda.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-gray-100 rounded-lg text-xs font-bold uppercase text-gray-600">
                          {venda.forma_pagamento}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-emerald-600">
                        {venda.total.toLocaleString()} {user?.currency}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-black uppercase">
                          Pago
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setExpandedSale(expandedSale === venda.id ? null : venda.id)}
                            className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors"
                            title="Ver Detalhes"
                          >
                            {expandedSale === venda.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </button>
                          <button 
                            onClick={() => {
                              setSaleToPrint(venda);
                              setTimeout(handlePrintReceipt, 100);
                            }}
                            className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                            title="Imprimir Fatura"
                          >
                            <Printer size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedSale === venda.id && (
                      <tr className="bg-emerald-50/30">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="bg-white rounded-xl border border-emerald-100 p-4 shadow-sm">
                            <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                              <Package size={16} className="text-emerald-600" />
                              Itens da Fatura
                            </h4>
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-gray-500 border-b">
                                  <th className="py-2 text-left">Medicamento</th>
                                  <th className="py-2 text-center">Qtd</th>
                                  <th className="py-2 text-right">Preço Unit.</th>
                                  <th className="py-2 text-right">Subtotal</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50">
                                {venda.itens?.map((item: any, idx: number) => (
                                  <tr key={idx}>
                                    <td className="py-2">{item.nome_medicamento}</td>
                                    <td className="py-2 text-center">{item.quantidade}</td>
                                    <td className="py-2 text-right">{item.preco_unitario.toLocaleString()}</td>
                                    <td className="py-2 text-right">{(item.quantidade * item.preco_unitario).toLocaleString()}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Template (Hidden) */}
      <div style={{ display: 'none' }}>
        <div ref={receiptRef} className="p-8 font-mono text-sm w-[80mm]">
          <div className="text-center mb-4">
            <h2 className="font-bold text-lg uppercase">{user?.company_name}</h2>
            <p>FARMÁCIA</p>
            <p>NIF: 500123456</p>
            <p>Tel: 923 000 000</p>
            <p>Luanda, Angola</p>
          </div>
          <div className="border-t border-b py-2 mb-4">
            <p>FATURA: {saleToPrint?.numero_factura}</p>
            <p>DATA: {saleToPrint && new Date(saleToPrint.created_at).toLocaleString()}</p>
            <p>OPERADOR: {user?.name}</p>
            <p>MÉTODO: {saleToPrint?.forma_pagamento?.toUpperCase()}</p>
          </div>
          <table className="w-full mb-4">
            <thead>
              <tr className="border-b">
                <th className="text-left">Item</th>
                <th className="text-right">Qtd</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {saleToPrint?.itens?.map((item: any, idx: number) => (
                <tr key={idx}>
                  <td>{item.nome_medicamento}</td>
                  <td className="text-right">{item.quantidade}</td>
                  <td className="text-right">{(item.quantidade * item.preco_unitario).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t pt-2 space-y-1">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{saleToPrint?.subtotal?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>IVA (14%):</span>
              <span>{saleToPrint?.tax?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>TOTAL:</span>
              <span>{saleToPrint?.total?.toLocaleString()} {user?.currency}</span>
            </div>
          </div>
          <div className="text-center mt-8 italic">
            <p>Obrigado pela preferência!</p>
            <p>Volte sempre.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
