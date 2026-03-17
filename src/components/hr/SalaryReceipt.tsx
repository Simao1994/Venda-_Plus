import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface SalaryReceiptProps {
  employee: any;
  payroll: {
    month: number;
    year: number;
  };
}

export default function SalaryReceipt({ employee, payroll }: SalaryReceiptProps) {
  const { user } = useAuth();
  const [companyProfile, setCompanyProfile] = React.useState(null);

  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await supabase
          .from('company_profiles')
          .select('logo, name')
          .eq('id', user?.company_id)
          .maybeSingle();
        setCompanyProfile(data);
      } catch (err) {
        console.error('Error fetching company profile:', err);
      }
    };
    fetchProfile();
  }, [user?.company_id]);

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const date = new Date();
  const formattedDate = `${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;

  return (
    <div className="bg-white p-8 max-w-4xl mx-auto text-gray-900 font-sans border border-gray-200">
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-gray-900 pb-6 mb-8">
        <div className="flex items-center gap-4">
          {companyProfile?.logo && (
            <img src={companyProfile.logo} className="h-12 w-auto object-contain" alt="Logo" />
          )}
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight">{companyProfile?.name || user?.company_name}</h1>
            <p className="text-sm text-gray-600 font-bold">Recibo de Salário</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold">Período: {months[payroll.month - 1]} / {payroll.year}</p>
          <p className="text-xs text-gray-500">Data de Emissão: {formattedDate}</p>
        </div>
      </div>

      {/* Employee Info */}
      <div className="grid grid-cols-2 gap-8 mb-8 bg-gray-50 p-6 rounded-2xl">
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase mb-1">Funcionário</p>
          <p className="text-lg font-bold">{employee.employee_name}</p>
          <p className="text-sm text-gray-600">{employee.position}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-gray-500 uppercase mb-1">Tipo de Contrato</p>
          <p className="text-sm font-bold">{employee.is_service_provider ? 'Prestação de Serviços' : 'Contrato de Trabalho'}</p>
        </div>
      </div>

      {/* Earnings and Deductions */}
      <div className="grid grid-cols-2 gap-0 border border-gray-200 rounded-2xl overflow-hidden mb-8">
        <div className="border-r border-gray-200">
          <div className="bg-gray-100 px-4 py-2 font-bold text-sm uppercase border-b border-gray-200">Vencimentos</div>
          <div className="p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span>Salário Base</span>
              <span className="font-bold">{employee.salary_base.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Subsídio de Alimentação</span>
              <span className="font-bold">{employee.food_allowance.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Subsídio de Transporte</span>
              <span className="font-bold">{employee.transport_allowance.toLocaleString()}</span>
            </div>
          </div>
        </div>
        <div>
          <div className="bg-gray-100 px-4 py-2 font-bold text-sm uppercase border-b border-gray-200">Descontos</div>
          <div className="p-4 space-y-3">
            {!employee.is_service_provider && (
              <div className="flex justify-between text-sm">
                <span>INSS (3%)</span>
                <span className="font-bold text-rose-600">-{employee.inss_employee.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span>IRT {employee.is_service_provider ? '(6.5%)' : ''}</span>
              <span className="font-bold text-rose-600">-{employee.irt.toLocaleString()}</span>
            </div>
            {employee.other_deductions > 0 && (
              <div className="flex justify-between text-sm">
                <span>Outros Descontos</span>
                <span className="font-bold text-rose-600">-{employee.other_deductions.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-3 gap-4 mb-12">
        <div className="bg-gray-50 p-4 rounded-2xl text-center">
          <p className="text-xs font-bold text-gray-500 uppercase mb-1">Total Bruto</p>
          <p className="text-lg font-bold">{employee.gross_salary.toLocaleString()} {user?.currency}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-2xl text-center">
          <p className="text-xs font-bold text-gray-500 uppercase mb-1">Total Descontos</p>
          <p className="text-lg font-bold text-rose-600">{(employee.inss_employee + employee.irt + employee.other_deductions).toLocaleString()} {user?.currency}</p>
        </div>
        <div className="bg-indigo-600 p-4 rounded-2xl text-center text-white shadow-lg shadow-indigo-100">
          <p className="text-xs font-bold text-indigo-100 uppercase mb-1">Líquido a Receber</p>
          <p className="text-xl font-black">{employee.net_salary.toLocaleString()} {user?.currency}</p>
        </div>
      </div>

      {/* Footer / Signatures */}
      <div className="grid grid-cols-2 gap-12 mt-24">
        <div className="text-center">
          <div className="border-t border-gray-400 pt-2">
            <p className="text-xs font-bold uppercase">A Empresa</p>
            <p className="text-[10px] text-gray-400 mt-1">{user?.company_name}</p>
          </div>
        </div>
        <div className="text-center">
          <div className="border-t border-gray-400 pt-2">
            <p className="text-xs font-bold uppercase">O Funcionário</p>
            <p className="text-[10px] text-gray-400 mt-1">{employee.employee_name}</p>
          </div>
        </div>
      </div>

      <div className="mt-12 text-center text-[10px] text-gray-400 italic">
        Este documento serve como comprovativo de pagamento de salário para o período indicado.
      </div>
    </div>
  );
}
