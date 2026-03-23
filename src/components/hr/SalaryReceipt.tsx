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
      padding: '20mm 15mm',
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
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      {/* ====== HEADER ====== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #111', paddingBottom: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {companyProfile?.logo && (
            <img src={companyProfile.logo} style={{ height: '48px', objectFit: 'contain' }} alt="Logo" />
          )}
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 900, textTransform: 'uppercase', margin: 0, letterSpacing: '-0.5px' }}>
              {companyProfile?.name || user?.company_name}
            </h1>
            {companyProfile?.nif && <p style={{ fontSize: '10px', color: '#666', margin: '2px 0 0' }}>NIF: {companyProfile.nif}</p>}
            {companyProfile?.address && <p style={{ fontSize: '10px', color: '#666', margin: '1px 0 0' }}>{companyProfile.address}</p>}
            {(companyProfile?.phone || companyProfile?.email) && (
              <p style={{ fontSize: '10px', color: '#666', margin: '1px 0 0' }}>
                {companyProfile.phone}{companyProfile.phone && companyProfile.email ? ' | ' : ''}{companyProfile.email}
              </p>
            )}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', color: '#4f46e5', margin: 0 }}>Recibo de Vencimento</h2>
          <p style={{ fontSize: '11px', fontWeight: 700, margin: '4px 0 0' }}>Período: {months[payroll.month - 1]} / {payroll.year}</p>
          <p style={{ fontSize: '9px', color: '#888', margin: '2px 0 0' }}>Data de Emissão: {formattedDate}</p>
        </div>
      </div>

      {/* ====== EMPLOYEE INFO ====== */}
      <div style={{ background: '#f8f9fa', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '14px', marginBottom: '20px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ width: '50%', verticalAlign: 'top', paddingRight: '16px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ fontSize: '9px', fontWeight: 900, color: '#888', textTransform: 'uppercase', letterSpacing: '1px', paddingBottom: '2px' }}>Nome Completo</td>
                      <td style={{ fontSize: '13px', fontWeight: 800, textAlign: 'right' }}>{employee.employee_name}</td>
                    </tr>
                    <tr>
                      <td style={{ fontSize: '9px', fontWeight: 900, color: '#888', textTransform: 'uppercase', letterSpacing: '1px', paddingTop: '6px', paddingBottom: '2px' }}>Cargo / Função</td>
                      <td style={{ fontSize: '11px', fontWeight: 600, textAlign: 'right' }}>{employee.position || '—'}</td>
                    </tr>
                    <tr>
                      <td style={{ fontSize: '9px', fontWeight: 900, color: '#888', textTransform: 'uppercase', letterSpacing: '1px', paddingTop: '6px', paddingBottom: '2px' }}>Departamento</td>
                      <td style={{ fontSize: '11px', fontWeight: 600, textAlign: 'right' }}>{employee.department_name || '—'}</td>
                    </tr>
                    <tr>
                      <td style={{ fontSize: '9px', fontWeight: 900, color: '#888', textTransform: 'uppercase', letterSpacing: '1px', paddingTop: '6px', paddingBottom: '2px' }}>Tipo de Contrato</td>
                      <td style={{ fontSize: '11px', fontWeight: 600, textAlign: 'right' }}>{employee.is_service_provider ? 'Prestação de Serviços' : 'Contrato de Trabalho'}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
              <td style={{ width: '50%', verticalAlign: 'top', paddingLeft: '16px', borderLeft: '1px solid #e5e7eb' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ fontSize: '9px', fontWeight: 900, color: '#888', textTransform: 'uppercase', letterSpacing: '1px', paddingBottom: '2px' }}>NIF</td>
                      <td style={{ fontSize: '11px', fontWeight: 700, textAlign: 'right', fontFamily: 'monospace' }}>{employee.nif || '—'}</td>
                    </tr>
                    <tr>
                      <td style={{ fontSize: '9px', fontWeight: 900, color: '#888', textTransform: 'uppercase', letterSpacing: '1px', paddingTop: '6px', paddingBottom: '2px' }}>Bilhete de Identidade</td>
                      <td style={{ fontSize: '11px', fontWeight: 700, textAlign: 'right', fontFamily: 'monospace' }}>{employee.bilhete || '—'}</td>
                    </tr>
                    <tr>
                      <td style={{ fontSize: '9px', fontWeight: 900, color: '#888', textTransform: 'uppercase', letterSpacing: '1px', paddingTop: '6px', paddingBottom: '2px' }}>Nº Segurança Social</td>
                      <td style={{ fontSize: '11px', fontWeight: 700, textAlign: 'right', fontFamily: 'monospace' }}>{employee.numero_ss || '—'}</td>
                    </tr>
                    <tr>
                      <td style={{ fontSize: '9px', fontWeight: 900, color: '#888', textTransform: 'uppercase', letterSpacing: '1px', paddingTop: '6px', paddingBottom: '2px' }}>Data de Admissão</td>
                      <td style={{ fontSize: '11px', fontWeight: 600, textAlign: 'right' }}>{employee.hire_date ? new Date(employee.hire_date).toLocaleDateString('pt-AO') : '—'}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ====== EARNINGS & DEDUCTIONS TABLE ====== */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', border: '1px solid #e5e7eb' }}>
        <thead>
          <tr>
            <th colSpan={2} style={{ background: '#f1f5f9', padding: '8px 12px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>
              Vencimentos
            </th>
            <th colSpan={2} style={{ background: '#f1f5f9', padding: '8px 12px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'left', borderBottom: '2px solid #e5e7eb', borderLeft: '2px solid #e5e7eb' }}>
              Descontos
            </th>
          </tr>
          <tr>
            <th style={{ padding: '6px 12px', fontSize: '9px', fontWeight: 700, color: '#888', textTransform: 'uppercase', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Descrição</th>
            <th style={{ padding: '6px 12px', fontSize: '9px', fontWeight: 700, color: '#888', textTransform: 'uppercase', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Valor ({currency})</th>
            <th style={{ padding: '6px 12px', fontSize: '9px', fontWeight: 700, color: '#888', textTransform: 'uppercase', textAlign: 'left', borderBottom: '1px solid #e5e7eb', borderLeft: '2px solid #e5e7eb' }}>Descrição</th>
            <th style={{ padding: '6px 12px', fontSize: '9px', fontWeight: 700, color: '#888', textTransform: 'uppercase', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Valor ({currency})</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ padding: '8px 12px', fontSize: '11px' }}>Salário Base</td>
            <td style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 700, textAlign: 'right' }}>{employee.salary_base.toLocaleString('pt-AO')}</td>
            <td style={{ padding: '8px 12px', fontSize: '11px', borderLeft: '2px solid #e5e7eb' }}>
              {!employee.is_service_provider ? 'INSS (3%)' : '—'}
            </td>
            <td style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 700, textAlign: 'right', color: '#dc2626' }}>
              {!employee.is_service_provider ? `-${(employee.inss_employee || 0).toLocaleString('pt-AO')}` : '—'}
            </td>
          </tr>
          <tr style={{ background: '#fafafa' }}>
            <td style={{ padding: '8px 12px', fontSize: '11px' }}>Subsídio de Alimentação</td>
            <td style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 700, textAlign: 'right' }}>{(employee.food_allowance || 0).toLocaleString('pt-AO')}</td>
            <td style={{ padding: '8px 12px', fontSize: '11px', borderLeft: '2px solid #e5e7eb' }}>
              IRT {employee.is_service_provider ? '(6.5%)' : ''}
            </td>
            <td style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 700, textAlign: 'right', color: '#dc2626' }}>
              -{(employee.irt || 0).toLocaleString('pt-AO')}
            </td>
          </tr>
          <tr>
            <td style={{ padding: '8px 12px', fontSize: '11px' }}>Subsídio de Transporte</td>
            <td style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 700, textAlign: 'right' }}>{(employee.transport_allowance || 0).toLocaleString('pt-AO')}</td>
            <td style={{ padding: '8px 12px', fontSize: '11px', borderLeft: '2px solid #e5e7eb' }}>
              {employee.other_deductions > 0 ? 'Outros Descontos' : '—'}
            </td>
            <td style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 700, textAlign: 'right', color: '#dc2626' }}>
              {employee.other_deductions > 0 ? `-${(employee.other_deductions || 0).toLocaleString('pt-AO')}` : '—'}
            </td>
          </tr>
          {/* Totals Row */}
          <tr style={{ borderTop: '2px solid #111' }}>
            <td style={{ padding: '10px 12px', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase' }}>Total Vencimentos</td>
            <td style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 900, textAlign: 'right' }}>{totalBruto.toLocaleString('pt-AO')}</td>
            <td style={{ padding: '10px 12px', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', borderLeft: '2px solid #e5e7eb' }}>Total Descontos</td>
            <td style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 900, textAlign: 'right', color: '#dc2626' }}>{totalDescontos.toLocaleString('pt-AO')}</td>
          </tr>
        </tbody>
      </table>

      {/* ====== NET SALARY ====== */}
      <div style={{
        background: '#4f46e5',
        color: '#fff',
        borderRadius: '8px',
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '40px'
      }}>
        <div>
          <p style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.7, margin: 0 }}>Valor Líquido a Receber</p>
          <p style={{ fontSize: '10px', opacity: 0.5, margin: '2px 0 0' }}>Após todos os descontos legais</p>
        </div>
        <p style={{ fontSize: '24px', fontWeight: 900, margin: 0 }}>{employee.net_salary.toLocaleString('pt-AO')} {currency}</p>
      </div>

      {/* ====== SIGNATURES ====== */}
      <div style={{ display: 'flex', gap: '48px', marginTop: '80px' }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ borderTop: '1px solid #999', paddingTop: '8px' }}>
            <p style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', margin: 0 }}>A Empresa</p>
            <p style={{ fontSize: '9px', color: '#888', margin: '2px 0 0' }}>{companyProfile?.name || user?.company_name}</p>
          </div>
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ borderTop: '1px solid #999', paddingTop: '8px' }}>
            <p style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', margin: 0 }}>O Funcionário</p>
            <p style={{ fontSize: '9px', color: '#888', margin: '2px 0 0' }}>{employee.employee_name}</p>
          </div>
        </div>
      </div>

      {/* ====== FOOTER ====== */}
      <div style={{
        position: 'absolute',
        bottom: '15mm',
        left: '15mm',
        right: '15mm',
        textAlign: 'center',
        fontSize: '8px',
        color: '#aaa',
        borderTop: '1px solid #e5e7eb',
        paddingTop: '8px'
      }}>
        Este documento serve como comprovativo de pagamento de salário para o período indicado.
        Processado electronicamente pelo sistema VendaPlus.
      </div>
    </div>
  );
}
