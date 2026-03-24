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
  const [companyProfile, setCompanyProfile] = React.useState<any>(null);

  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await supabase
          .from('company_profiles')
          .select('logo, name, nif, address, phone, email')
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
  const currency = user?.currency || 'Kz';

  const totalBruto = employee.gross_salary || (employee.salary_base + employee.food_allowance + employee.transport_allowance);
  const totalDescontos = (employee.inss_employee || 0) + (employee.irt || 0) + (employee.other_deductions || 0);

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      padding: '20mm',
      boxSizing: 'border-box',
      fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
      fontSize: '11px',
      color: '#111',
      background: '#fff',
      position: 'relative'
    }}>
      <style>{`
        @page { size: A4; margin: 0; }
        @media print {
          html, body { width: 100%; height: 100%; margin: 0 !important; padding: 0 !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      {/* ====== HEADER ====== */}
      <div style={{ textAlign: 'center', marginBottom: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 900, textTransform: 'uppercase', color: '#4f46e5', margin: 0, letterSpacing: '-0.5px' }}>
          Recibo de Vencimento
        </h1>
        <h2 style={{ fontSize: '14px', fontWeight: 800, color: '#111', margin: 0 }}>
          Período: {months[payroll.month - 1]} / {payroll.year}
        </h2>
        <span style={{ fontSize: '11px', color: '#6b7280' }}>
          Data de Emissão: {formattedDate}
        </span>
      </div>

      {/* ====== EMPLOYEE INFO ====== */}
      <div style={{ background: '#f8f9fa', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '24px', marginBottom: '24px', display: 'flex' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '15px', fontWeight: 900, color: '#111' }}>{employee.employee_name}</span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}></span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#111', textTransform: 'uppercase' }}>{employee.position || '—'}</span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}></span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
             <span style={{ fontSize: '12px', fontWeight: 800, color: '#111' }}>—</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#111' }}>{employee.is_service_provider ? 'Prestação de Serviços' : 'Contrato de Trabalho'}</span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}></span>
          </div>
        </div>

        <div style={{ width: '1px', background: '#e5e7eb' }}></div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', paddingLeft: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>NIF</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#111' }}>{employee.nif || '—'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Bilhete de Identidade</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#111' }}>{employee.bilhete || '—'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>N.º Segurança Social</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#111' }}>{employee.numero_ss || '—'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Data de Admissão</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#111' }}>{employee.hire_date ? new Date(employee.hire_date).toLocaleDateString('pt-AO') : '—'}</span>
          </div>
        </div>
      </div>

      {/* ====== EARNINGS & DEDUCTIONS TABLE ====== */}
      <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', marginBottom: '24px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8f9fa' }}>
              <th style={{ padding: '12px 24px', fontSize: '11px', fontWeight: 800, color: '#111', textAlign: 'right', borderBottom: '1px solid #e5e7eb', width: '30%' }}></th>
              <th colSpan={2} style={{ padding: '12px 24px', fontSize: '12px', fontWeight: 900, color: '#111', textTransform: 'uppercase', textAlign: 'left', borderBottom: '1px solid #e5e7eb', borderLeft: '1px solid #e5e7eb' }}>
                Descontos
              </th>
            </tr>
            <tr style={{ background: '#fff' }}>
              <th style={{ padding: '12px 24px', fontSize: '10px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Valor [Kz]</th>
              <th style={{ padding: '12px 24px', fontSize: '10px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', textAlign: 'left', borderBottom: '1px solid #e5e7eb', borderLeft: '1px solid #e5e7eb' }}>Descrição</th>
              <th style={{ padding: '12px 24px', fontSize: '10px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Valor [Kz]</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '14px 24px', fontSize: '13px', fontWeight: 800, textAlign: 'right', borderBottom: '1px solid #f3f4f6' }}>{employee.salary_base.toLocaleString('pt-AO')}</td>
              <td style={{ padding: '14px 24px', fontSize: '12px', borderLeft: '1px solid #e5e7eb', borderBottom: '1px solid #f3f4f6', color: '#111' }}>
                {!employee.is_service_provider ? 'INSS (3%)' : '—'}
              </td>
              <td style={{ padding: '14px 24px', fontSize: '13px', fontWeight: 800, textAlign: 'right', color: '#dc2626', borderBottom: '1px solid #f3f4f6' }}>
                {!employee.is_service_provider && (employee.inss_employee || 0) > 0 ? `-${(employee.inss_employee || 0).toLocaleString('pt-AO')}` : '—'}
              </td>
            </tr>
            <tr style={{ background: '#fafafa' }}>
              <td style={{ padding: '14px 24px', fontSize: '13px', fontWeight: 800, textAlign: 'right', borderBottom: '1px solid #f3f4f6' }}>{((employee.food_allowance || 0) + (employee.transport_allowance || 0)) > 0 ? ((employee.food_allowance || 0) + (employee.transport_allowance || 0)).toLocaleString('pt-AO') : '—'}</td>
              <td style={{ padding: '14px 24px', fontSize: '12px', borderLeft: '1px solid #e5e7eb', borderBottom: '1px solid #f3f4f6', color: '#374151' }}>
                IRT
              </td>
              <td style={{ padding: '14px 24px', fontSize: '13px', fontWeight: 800, textAlign: 'right', color: '#dc2626', borderBottom: '1px solid #f3f4f6' }}>
                {(employee.irt || 0) > 0 ? `-${(employee.irt || 0).toLocaleString('pt-AO')}` : '-0'}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '14px 24px', fontSize: '13px', fontWeight: 800, textAlign: 'right' }}>—</td>
              <td style={{ padding: '14px 24px', fontSize: '12px', borderLeft: '1px solid #e5e7eb', color: '#111' }}>
                {employee.other_deductions > 0 ? 'Outros Descontos' : '—'}
              </td>
              <td style={{ padding: '14px 24px', fontSize: '13px', fontWeight: 800, textAlign: 'right', color: '#dc2626' }}>
                {employee.other_deductions > 0 ? `-${(employee.other_deductions || 0).toLocaleString('pt-AO')}` : '—'}
              </td>
            </tr>
            {/* Totals Row */}
            <tr style={{ background: '#fff', borderTop: '2px solid #111' }}>
              <td style={{ padding: '16px 24px', fontSize: '15px', fontWeight: 900, textAlign: 'right' }}>{totalBruto.toLocaleString('pt-AO')}</td>
              <td style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', borderLeft: '1px solid #111', color: '#111' }}>Total Descontos</td>
              <td style={{ padding: '16px 24px', fontSize: '15px', fontWeight: 900, textAlign: 'right', color: '#dc2626' }}>{totalDescontos > 0 ? totalDescontos.toLocaleString('pt-AO') : '—'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ====== NET SALARY ====== */}
      <div style={{
        background: '#4f46e5',
        color: '#fff',
        borderRadius: '8px',
        padding: '24px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: '60px',
      }}>
        <div style={{ fontSize: '32px', fontWeight: 900, letterSpacing: '-0.5px' }}>
          {employee.net_salary.toLocaleString('pt-AO')} <span style={{ fontSize: '32px', fontWeight: 900 }}>{currency}</span>
        </div>
      </div>

      {/* ====== SIGNATURES ====== */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40px' }}>
        <div style={{ width: '40%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '100%', height: '1px', background: '#d1d5db' }}></div>
          <span style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', color: '#111' }}>O Funcionário</span>
          <span style={{ fontSize: '11px', color: '#6b7280' }}>{employee.employee_name}</span>
        </div>
      </div>

      {/* ====== FOOTER ====== */}
      <div style={{
        position: 'absolute',
        bottom: '15mm',
        left: '15mm',
        right: '15mm',
        textAlign: 'center',
        borderTop: '1px solid #e5e7eb',
        paddingTop: '12px'
      }}>
        <p style={{ fontSize: '8px', color: '#9ca3af', margin: 0, lineHeight: '1.5', textAlign: 'left' }}>
          Comprovativo de pagamento de salário para o período indicado. Processo eletronicamente pelo sistema VendaPlus.
        </p>
      </div>
    </div>
  );
}
