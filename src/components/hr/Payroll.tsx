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
import { A4ReportTemplate } from '../reports/A4ReportTemplate';
import { api } from '../../lib/api';

export default function Payroll() {
  const { user } = useAuth();
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
      @page { size: A4; margin: 0; }
      @media print { body { -webkit-print-color-adjust: exact; margin: 0; padding: 0; } }
    `
  });

  const printFolhaRef = useRef<HTMLDivElement>(null);
  const handlePrintFolha = useReactToPrint({
    contentRef: printFolhaRef,
    documentTitle: `Folha-Salarial-${new Date().toLocaleDateString('pt-AO')}`
  });

  useEffect(() => {
    fetchPayrolls();
  }, []);

  const fetchPayrolls = async () => {
    try {
      const res = await api.get('/api/hr/payrolls');
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
      const res = await api.get(`/api/hr/payrolls/${id}`);
      const data = await res.json();
      setSelectedPayroll(data);
    } catch (error) {
      console.error('Error fetching payroll details:', error);
    }
  };

  const handleFinalize = async (id: number) => {
    if (!confirm('Tem certeza que deseja finalizar esta folha? Não poderá mais ser editada.')) return;
    try {
      const res = await api.put(`/api/hr/payrolls/${id}/finalize`, {});
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
      const res = await api.delete(`/api/hr/payrolls/${id}`);
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
      const res = await api.post('/api/hr/payrolls/generate', generateData);
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
      <div className="p-8 space-y-8 max-w-7xl mx-auto relative z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedPayroll(null)}
            className="p-2 hover:bg-white/5 rounded-xl transition-colors text-white/40"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">
              Folha Salarial - {months[selectedPayroll.month - 1]} {selectedPayroll.year}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${selectedPayroll.status === 'finalized' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-gold-primary/10 text-gold-primary border border-gold-primary/20'
                }`}>
                {selectedPayroll.status === 'finalized' ? 'Finalizada' : 'Rascunho'}
              </span>
              <p className="text-white/30 text-sm">Detalhes dos pagamentos e impostos</p>
            </div>
          </div>
          <div className="ml-auto flex gap-2">
            <button
              onClick={handlePrintFolha}
              className="glass-panel text-gold-primary px-4 py-2 rounded-xl font-bold text-sm border border-gold-primary/20 hover:bg-gold-primary/10 transition-colors flex items-center gap-2 mr-2"
              title="Imprimir Relatório Geral"
            >
              <Printer size={18} />
              Imprimir Geral
            </button>
            {selectedPayroll.status === 'draft' && (
              <button
                onClick={() => handleFinalize(selectedPayroll.id)}
                className="bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-xl font-bold text-sm border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors"
              >
                Finalizar Folha
              </button>
            )}
            <button
              onClick={() => handleDeletePayroll(selectedPayroll.id)}
              className="bg-rose-500/10 text-rose-400 px-4 py-2 rounded-xl font-bold text-sm border border-rose-500/20 hover:bg-rose-500/20 transition-colors"
            >
              Excluir
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Bruto', value: selectedPayroll.total_gross, color: 'white' },
            { label: 'Total IRT', value: selectedPayroll.total_irt, color: 'text-red-400' },
            { label: 'Total INSS (3%)', value: selectedPayroll.total_inss_employee, color: 'text-gold-primary' },
            { label: 'Total Líquido', value: selectedPayroll.total_net, color: 'text-gold-primary' },
          ].map((c, i) => (
            <div key={i} className="glass-panel p-5 rounded-2xl border border-white/5">
              <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">{c.label}</p>
              <p className={`text-xl font-black ${c.color === 'white' ? 'text-white' : c.color}`}>{c.value.toLocaleString()} {user?.currency}</p>
            </div>
          ))}
        </div>

        <div className="glass-panel rounded-[2rem] border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-white/20 text-[10px] uppercase tracking-widest font-black">
                <tr>
                  <th className="px-6 py-4">Funcionário</th>
                  <th className="px-6 py-4 text-right">Salário Base</th>
                  <th className="px-6 py-4 text-right">Subsídios</th>
                  <th className="px-6 py-4 text-right">INSS (3%)</th>
                  <th className="px-6 py-4 text-right">IRT</th>
                  <th className="px-6 py-4 text-right">Outros Desc.</th>
                  <th className="px-6 py-4 text-right">Líquido</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {selectedPayroll.items.map((item: any) => (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white text-sm">{item.employee_name}</div>
                      <div className="text-xs text-white/30">{item.position}</div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-white/60">
                      {item.salary_base.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-emerald-400">
                      +{(item.food_allowance + item.transport_allowance).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-gold-primary">
                      -{item.inss_employee.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-rose-400">
                      -{item.irt.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-rose-400">
                      -{item.other_deductions.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-black text-gold-primary">
                      {item.net_salary.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setReceiptEmployee(item);
                          setTimeout(() => handlePrintReceipt(), 100);
                        }}
                        className="p-2 text-gold-primary hover:bg-gold-primary/10 rounded-lg transition-colors"
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

        {/* Hidden A4 Report for the Entire Payroll */}
        <div className="hidden">
          <A4ReportTemplate
            ref={printFolhaRef}
            title={`Relatório Mensal - Folha Salarial`}
            subtitle={`Período: ${months[selectedPayroll.month - 1]} ${selectedPayroll.year}`}
            companyData={user}
            orientation="landscape"
          >
            <div className="flex gap-4 mb-6 a4-print-no-break">
              {[
                { label: 'Total Bruto', value: selectedPayroll.total_gross },
                { label: 'Total IRT', value: selectedPayroll.total_irt },
                { label: 'Total INSS', value: selectedPayroll.total_inss_employee },
                { label: 'Total Líquido', value: selectedPayroll.total_net }
              ].map((c, i) => (
                <div key={i} className="border border-gray-300 rounded-md p-4 flex-1">
                  <div className="text-[9px] font-bold text-gray-500 uppercase mb-1">{c.label}</div>
                  <div className="text-[16px] font-black">{c.value.toLocaleString('pt-AO')} <span className="text-xs text-gray-400">{user?.currency}</span></div>
                </div>
              ))}
            </div>

            <table className="a4-table">
              <thead>
                <tr>
                  <th>Funcionário</th>
                  <th className="text-right">Salário Base</th>
                  <th className="text-right">Subsídios</th>
                  <th className="text-right">INSS (3%)</th>
                  <th className="text-right">IRT</th>
                  <th className="text-right">Outros Desc.</th>
                  <th className="text-right">Líquido a Receber</th>
                </tr>
              </thead>
              <tbody>
                {selectedPayroll.items.map((item: any) => (
                  <tr key={item.id}>
                    <td>
                      <div className="font-bold">{item.employee_name}</div>
                      <div className="text-[9px] text-gray-500">{item.position}</div>
                    </td>
                    <td className="text-right font-medium">{item.salary_base.toLocaleString('pt-AO')}</td>
                    <td className="text-right font-medium text-[#10b981]">+{(item.food_allowance + item.transport_allowance).toLocaleString('pt-AO')}</td>
                    <td className="text-right font-medium text-[#f59e0b]">-{item.inss_employee.toLocaleString('pt-AO')}</td>
                    <td className="text-right font-medium text-[#ef4444]">-{item.irt.toLocaleString('pt-AO')}</td>
                    <td className="text-right font-medium text-[#ef4444]">-{item.other_deductions.toLocaleString('pt-AO')}</td>
                    <td className="text-right font-bold text-[#4f46e5]">{item.net_salary.toLocaleString('pt-AO')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </A4ReportTemplate>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto relative z-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Folha Salarial</h2>
          <p className="text-white/30 font-black text-[10px] uppercase tracking-[0.3em] mt-2 italic">Gere e visualize os pagamentos mensais</p>
        </div>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="bg-gold-primary/20 text-gold-primary px-6 py-3 rounded-2xl font-bold flex items-center gap-2 border border-gold-primary/30 hover:bg-gold-primary/30 transition-all shadow-[0_0_20px_rgba(99,102,241,0.1)]"
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
            className="glass-panel p-6 rounded-[2rem] border border-white/5 hover:border-gold-primary/20 transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-gold-primary/10 text-gold-primary rounded-2xl flex items-center justify-center border border-gold-primary/20 group-hover:bg-gold-primary/20 transition-colors">
                <FileSpreadsheet size={24} />
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${p.status === 'finalized' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-gold-primary/10 text-gold-primary border border-gold-primary/20'
                }`}>
                {p.status === 'finalized' ? 'Finalizada' : 'Rascunho'}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mb-1">
              {months[p.month - 1]} {p.year}
            </h3>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-white/30">Líquido Total:</span>
                <span className="font-bold text-gold-primary">{p.total_net.toLocaleString()} {user?.currency}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/30">Impostos Totais:</span>
                <span className="font-bold text-rose-400">{(p.total_irt + p.total_inss_employee).toLocaleString()} {user?.currency}</span>
              </div>
            </div>
            <div className="pt-4 border-t border-white/5 flex justify-between items-center text-gold-primary font-bold text-sm">
              Ver Detalhes
              <ChevronRight size={18} />
            </div>
          </div>
        ))}
      </div>

      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-panel rounded-[2rem] shadow-2xl w-full max-w-md border border-white/10">
            <div className="p-6 border-b border-white/5">
              <h3 className="text-xl font-bold text-white">Gerar Folha Salarial</h3>
            </div>
            <form onSubmit={handleGenerate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Mês</label>
                  <select
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-sm focus:ring-2 focus:ring-gold-primary focus:outline-none"
                    value={generateData.month}
                    onChange={e => setGenerateData({ ...generateData, month: parseInt(e.target.value) })}
                  >
                    {months.map((m, i) => (
                      <option key={i} value={i + 1}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Ano</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-sm focus:ring-2 focus:ring-gold-primary focus:outline-none"
                    value={generateData.year}
                    onChange={e => setGenerateData({ ...generateData, year: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="p-4 bg-gold-primary/10 rounded-2xl flex gap-3 border border-gold-primary/20">
                <AlertCircle className="text-gold-primary shrink-0" size={20} />
                <p className="text-xs text-gold-primary">
                  A folha será gerada automaticamente com base nos salários base e subsídios cadastrados para todos os funcionários ativos.
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="flex-1 px-6 py-3 rounded-xl font-bold border border-white/10 text-white/40 hover:bg-white/5 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 rounded-xl font-bold bg-gold-primary/20 text-gold-primary border border-gold-primary/30 hover:bg-gold-primary/30 transition-all shadow-[0_0_20px_rgba(99,102,241,0.1)]"
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


