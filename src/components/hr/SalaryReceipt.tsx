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
      width: '210mm',
      minHeight: '297mm',
      padding: '20mm',
      boxSizing: 'border-box',
      fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
      fontSize: '11px',
      color: '#111',
      background: '#fff',
      position: 'relative',
      margin: '0 auto'
    }}>
      <style>{`
        @page { size: A4; margin: 0; }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .receipt-container { padding: 20mm !important; }
        }
      `}</style>

      {/* ====== HEADER ====== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #111', paddingBottom: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {companyProfile?.logo && (
            <img src={companyProfile.logo} style={{ height: '56px', width: 'auto', objectFit: 'contain' }} alt="Logo" />
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 900, textTransform: 'uppercase', margin: 0, letterSpacing: '-0.5px', color: '#111' }}>
              {companyProfile?.name || user?.company_name}
            </h1>
            {companyProfile?.nif && <span style={{ fontSize: '11px', color: '#4b5563', fontWeight: 600 }}>NIF: {companyProfile.nif}</span>}
            {companyProfile?.address && <span style={{ fontSize: '11px', color: '#4b5563' }}>{companyProfile.address}</span>}
            {(companyProfile?.phone || companyProfile?.email) && (
              <span style={{ fontSize: '11px', color: '#4b5563' }}>
                {companyProfile.phone}{companyProfile.phone && companyProfile.email ? ' | ' : ''}{companyProfile.email}
              </span>
            )}
          </div>
        </div>
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', color: '#4f46e5', margin: 0 }}>Recibo de Vencimento</h2>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#111' }}>Período: {months[payroll.month - 1]} / {payroll.year}</span>
          <span style={{ fontSize: '10px', color: '#6b7280' }}>Data de Emissão: {formattedDate}</span>
        </div>
      </div>

      {/* ====== EMPLOYEE INFO ====== */}
      <div style={{ background: '#f8f9fa', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px', marginBottom: '24px', display: 'flex', gap: '40px' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #e5e7eb', paddingBottom: '4px' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>Nome Completo</span>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#111' }}>{employee.employee_name}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #e5e7eb', paddingBottom: '4px' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>Cargo / Função</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#111' }}>{employee.position || '—'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #e5e7eb', paddingBottom: '4px' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>Departamento</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#111' }}>{employee.department_name || '—'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>Tipo de Contrato</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#111' }}>{employee.is_service_provider ? 'Prestação de Serviços' : 'Contrato de Trabalho'}</span>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #e5e7eb', paddingBottom: '4px' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>NIF</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#111', fontFamily: 'monospace' }}>{employee.nif || '—'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #e5e7eb', paddingBottom: '4px' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>Bilhete de Identidade</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#111', fontFamily: 'monospace' }}>{employee.bilhete || '—'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #e5e7eb', paddingBottom: '4px' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>Nº Segurança Social</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#111', fontFamily: 'monospace' }}>{employee.numero_ss || '—'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>Data de Admissão</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#111' }}>{employee.hire_date ? new Date(employee.hire_date).toLocaleDateString('pt-AO') : '—'}</span>
          </div>
        </div>
      </div>

      {/* ====== EARNINGS & DEDUCTIONS TABLE ====== */}
      <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', marginBottom: '24px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              <th style={{ padding: '12px', fontSize: '10px', fontWeight: 800, color: '#374151', textTransform: 'uppercase', textAlign: 'left', borderBottom: '2px solid #e5e7eb', width: '35%' }}>Vencimentos (Descrição)</th>
              <th style={{ padding: '12px', fontSize: '10px', fontWeight: 800, color: '#374151', textTransform: 'uppercase', textAlign: 'right', borderBottom: '2px solid #e5e7eb', width: '15%' }}>Valor ({currency})</th>
              <th style={{ padding: '12px', fontSize: '10px', fontWeight: 800, color: '#374151', textTransform: 'uppercase', textAlign: 'left', borderBottom: '2px solid #e5e7eb', borderLeft: '1px solid #e5e7eb', width: '35%' }}>Descontos (Descrição)</th>
              <th style={{ padding: '12px', fontSize: '10px', fontWeight: 800, color: '#374151', textTransform: 'uppercase', textAlign: 'right', borderBottom: '2px solid #e5e7eb', width: '15%' }}>Valor ({currency})</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '12px', fontSize: '12px', borderBottom: '1px solid #f3f4f6' }}>Salário Base</td>
              <td style={{ padding: '12px', fontSize: '12px', fontWeight: 700, textAlign: 'right', borderBottom: '1px solid #f3f4f6' }}>{employee.salary_base.toLocaleString('pt-AO')}</td>
              <td style={{ padding: '12px', fontSize: '12px', borderLeft: '1px solid #e5e7eb', borderBottom: '1px solid #f3f4f6' }}>
                {!employee.is_service_provider ? 'INSS (3%)' : '—'}
              </td>
              <td style={{ padding: '12px', fontSize: '12px', fontWeight: 700, textAlign: 'right', color: '#dc2626', borderBottom: '1px solid #f3f4f6' }}>
                {!employee.is_service_provider ? `-${(employee.inss_employee || 0).toLocaleString('pt-AO')}` : '—'}
              </td>
            </tr>
            <tr style={{ background: '#fafafa' }}>
              <td style={{ padding: '12px', fontSize: '12px', borderBottom: '1px solid #f3f4f6' }}>Subsídio de Alimentação</td>
              <td style={{ padding: '12px', fontSize: '12px', fontWeight: 700, textAlign: 'right', borderBottom: '1px solid #f3f4f6' }}>{(employee.food_allowance || 0).toLocaleString('pt-AO')}</td>
              <td style={{ padding: '12px', fontSize: '12px', borderLeft: '1px solid #e5e7eb', borderBottom: '1px solid #f3f4f6' }}>
                IRT {employee.is_service_provider ? '(6.5%)' : ''}
              </td>
              <td style={{ padding: '12px', fontSize: '12px', fontWeight: 700, textAlign: 'right', color: '#dc2626', borderBottom: '1px solid #f3f4f6' }}>
                -{(employee.irt || 0).toLocaleString('pt-AO')}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '12px', fontSize: '12px' }}>Subsídio de Transporte</td>
              <td style={{ padding: '12px', fontSize: '12px', fontWeight: 700, textAlign: 'right' }}>{(employee.transport_allowance || 0).toLocaleString('pt-AO')}</td>
              <td style={{ padding: '12px', fontSize: '12px', borderLeft: '1px solid #e5e7eb' }}>
                {employee.other_deductions > 0 ? 'Outros Descontos' : '—'}
              </td>
              <td style={{ padding: '12px', fontSize: '12px', fontWeight: 700, textAlign: 'right', color: '#dc2626' }}>
                {employee.other_deductions > 0 ? `-${(employee.other_deductions || 0).toLocaleString('pt-AO')}` : '—'}
              </td>
            </tr>
            {/* Totals Row */}
            <tr style={{ background: '#111', color: '#fff' }}>
              <td style={{ padding: '14px 12px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>Total Vencimentos</td>
              <td style={{ padding: '14px 12px', fontSize: '14px', fontWeight: 900, textAlign: 'right' }}>{totalBruto.toLocaleString('pt-AO')}</td>
              <td style={{ padding: '14px 12px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', borderLeft: '1px solid rgba(255,255,255,0.2)' }}>Total Descontos</td>
              <td style={{ padding: '14px 12px', fontSize: '14px', fontWeight: 900, textAlign: 'right', color: '#f87171' }}>{totalDescontos.toLocaleString('pt-AO')}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ====== NET SALARY ====== */}
      <div style={{
        background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
        color: '#fff',
        borderRadius: '12px',
        padding: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '60px',
        boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.3)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', color: 'rgba(255,255,255,0.8)' }}>
            Valor Líquido a Receber
          </span>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Após todos os impostos e descontos legais</span>
        </div>
        <div style={{ fontSize: '32px', fontWeight: 900, letterSpacing: '-1px' }}>
          {employee.net_salary.toLocaleString('pt-AO')} <span style={{ fontSize: '16px', fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>{currency}</span>
        </div>
      </div>

      {/* ====== SIGNATURES ====== */}
      <div style={{ display: 'flex', gap: '60px', marginTop: 'auto' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '100%', height: '1px', background: '#d1d5db' }}></div>
          <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#111' }}>A Empresa</span>
          <span style={{ fontSize: '10px', color: '#6b7280' }}>{companyProfile?.name || user?.company_name}</span>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '100%', height: '1px', background: '#d1d5db' }}></div>
          <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#111' }}>O Funcionário</span>
          <span style={{ fontSize: '10px', color: '#6b7280' }}>{employee.employee_name}</span>
        </div>
      </div>

      {/* ====== FOOTER ====== */}
      <div style={{
        position: 'absolute',
        bottom: '15mm',
        left: '20mm',
        right: '20mm',
        textAlign: 'center',
        borderTop: '1px solid #e5e7eb',
        paddingTop: '12px'
      }}>
        <p style={{ fontSize: '9px', color: '#9ca3af', margin: 0, lineHeight: '1.5' }}>
          Documento gerado eletronicamente e válido sem assinatura se acompanhado por comprovativo de transferência bancária.<br/>
          Processado pelo <strong>SISTEMA DE GESTÃO PREMIUM V.2026</strong>.
        </p>
      </div>
    </div>
  );
}
