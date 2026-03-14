import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Plus, 
  FileSpreadsheet, 
  Search, 
  ChevronRight, 
  Printer, 
  Download,
  FileText,
  Calendar,
  DollarSign,
  PieChart,
  ArrowLeft
} from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import SalaryReceipt from './SalaryReceipt';

export default function Payroll() {
  const { token, user } = useAuth();
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [selectedPayroll, setSelectedPayroll] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateData, setGenerateData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  const [receiptEmployee, setReceiptEmployee] = useState<any>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrintReceipt = useReactToPrint({
    contentRef: receiptRef,
    pageStyle: `
      @page { size: A4; margin: 20mm; }
      @media print { body { -webkit-print-color-adjust: exact; } }
    `
  });

  useEffect(() => {
    fetchPayrolls();
  }, []);

  const fetchPayrolls = async () => {
    try {
      const res = await fetch('/api/hr/payrolls', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setPayrolls(data);
    } catch (error) {
      console.error('Error fetching payrolls:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayrollDetails = async (id: number) => {
    try {
      const res = await fetch(`/api/hr/payrolls/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setSelectedPayroll(data);
    } catch (error) {
      console.error('Error fetching payroll details:', error);
    }
  };

  const handleFinalize = async (id: number) => {
    if (!confirm('Tem certeza que deseja finalizar esta folha? Não poderá mais ser editada.')) return;
    try {
      const res = await fetch(`/api/hr/payrolls/${id}/finalize`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchPayrollDetails(id);
        fetchPayrolls();
      }
    } catch (error) {
      console.error('Error finalizing payroll:', error);
    }
  };

  const handleDeletePayroll = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta folha salarial?')) return;
    try {
      const res = await fetch(`/api/hr/payrolls/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setSelectedPayroll(null);
        fetchPayrolls();
      }
    } catch (error) {
      console.error('Error deleting payroll:', error);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/hr/payrolls/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(generateData)
      });
      if (res.ok) {
        setShowGenerateModal(false);
        fetchPayrolls();
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao gerar folha salarial');
      }
    } catch (error) {
      console.error('Error generating payroll:', error);
    }
  };

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  if (selectedPayroll) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSelectedPayroll(null)}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Folha Salarial - {months[selectedPayroll.month - 1]} {selectedPayroll.year}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                selectedPayroll.status === 'finalized' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {selectedPayroll.status === 'finalized' ? 'Finalizada' : 'Rascunho'}
              </span>
              <p className="text-gray-500 text-sm">Detalhes dos pagamentos e impostos</p>
            </div>
          </div>
          <div className="ml-auto flex gap-2">
            {selectedPayroll.status === 'draft' && (
              <button 
                onClick={() => handleFinalize(selectedPayroll.id)}
                className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100"
              >
                Finalizar Folha
              </button>
            )}
            <button 
              onClick={() => handleDeletePayroll(selectedPayroll.id)}
              className="bg-rose-50 text-rose-600 px-4 py-2 rounded-xl font-bold text-sm hover:bg-rose-100 transition-colors"
            >
              Excluir
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border shadow-sm">
            <p className="text-xs font-bold text-gray-500 uppercase mb-1">Total Bruto</p>
            <p className="text-xl font-black text-gray-900">{selectedPayroll.total_gross.toLocaleString()} {user?.currency}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border shadow-sm">
            <p className="text-xs font-bold text-gray-500 uppercase mb-1">Total IRT</p>
            <p className="text-xl font-black text-rose-600">-{selectedPayroll.total_irt.toLocaleString()} {user?.currency}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border shadow-sm">
            <p className="text-xs font-bold text-gray-500 uppercase mb-1">Total INSS (3%)</p>
            <p className="text-xl font-black text-amber-600">-{selectedPayroll.total_inss_employee.toLocaleString()} {user?.currency}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border shadow-sm">
            <p className="text-xs font-bold text-gray-500 uppercase mb-1">Total Líquido</p>
            <p className="text-xl font-black text-indigo-600">{selectedPayroll.total_net.toLocaleString()} {user?.currency}</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-bold">Funcionário</th>
                  <th className="px-6 py-4 font-bold text-right">Salário Base</th>
                  <th className="px-6 py-4 font-bold text-right">Subsídios</th>
                  <th className="px-6 py-4 font-bold text-right">INSS (3%)</th>
                  <th className="px-6 py-4 font-bold text-right">IRT</th>
                  <th className="px-6 py-4 font-bold text-right">Outros Desc.</th>
                  <th className="px-6 py-4 font-bold text-right">Líquido</th>
                  <th className="px-6 py-4 font-bold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {selectedPayroll.items.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900 text-sm">{item.employee_name}</div>
                      <div className="text-xs text-gray-500">{item.position}</div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      {item.salary_base.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-emerald-600">
                      +{(item.food_allowance + item.transport_allowance).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-amber-600">
                      -{item.inss_employee.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-rose-600">
                      -{item.irt.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-rose-600">
                      -{item.other_deductions.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-black text-indigo-600">
                      {item.net_salary.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => {
                          setReceiptEmployee(item);
                          setTimeout(() => handlePrintReceipt(), 100);
                        }}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Recibo de Salário"
                      >
                        <Printer size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Hidden Receipt for Printing */}
        <div className="hidden">
          <div ref={receiptRef}>
            {receiptEmployee && (
              <SalaryReceipt 
                employee={receiptEmployee} 
                payroll={{ month: selectedPayroll.month, year: selectedPayroll.year }} 
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Folha Salarial</h2>
          <p className="text-gray-500">Gere e visualize os pagamentos mensais</p>
        </div>
        <button 
          onClick={() => setShowGenerateModal(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
        >
          <Plus size={20} />
          Gerar Nova Folha
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {payrolls.map((p) => (
          <div 
            key={p.id} 
            onClick={() => fetchPayrollDetails(p.id)}
            className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <FileSpreadsheet size={24} />
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                p.status === 'finalized' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {p.status === 'finalized' ? 'Finalizada' : 'Rascunho'}
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {months[p.month - 1]} {p.year}
            </h3>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Líquido Total:</span>
                <span className="font-bold text-indigo-600">{p.total_net.toLocaleString()} {user?.currency}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Impostos Totais:</span>
                <span className="font-bold text-rose-600">{(p.total_irt + p.total_inss_employee).toLocaleString()} {user?.currency}</span>
              </div>
            </div>
            <div className="pt-4 border-t flex justify-between items-center text-indigo-600 font-bold text-sm">
              Ver Detalhes
              <ChevronRight size={18} />
            </div>
          </div>
        ))}
      </div>

      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold text-gray-900">Gerar Folha Salarial</h3>
            </div>
            <form onSubmit={handleGenerate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Mês</label>
                  <select 
                    className="w-full px-4 py-3 rounded-xl border-gray-200"
                    value={generateData.month}
                    onChange={e => setGenerateData({...generateData, month: parseInt(e.target.value)})}
                  >
                    {months.map((m, i) => (
                      <option key={i} value={i + 1}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Ano</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-3 rounded-xl border-gray-200"
                    value={generateData.year}
                    onChange={e => setGenerateData({...generateData, year: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              <div className="p-4 bg-amber-50 rounded-2xl flex gap-3">
                <AlertCircle className="text-amber-600 shrink-0" size={20} />
                <p className="text-xs text-amber-700">
                  A folha será gerada automaticamente com base nos salários base e subsídios cadastrados para todos os funcionários ativos.
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="flex-1 px-6 py-3 rounded-xl font-bold border border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-6 py-3 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                >
                  Gerar Folha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function AlertCircle({ size, className }: any) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
