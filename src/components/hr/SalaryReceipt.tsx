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
          .from('companies')
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

  const totalBruto = employee.gross_salary || ((employee.salary_base || 0) + (employee.food_allowance || 0) + (employee.transport_allowance || 0));
  const totalDescontos = (employee.inss_employee || 0) + (employee.irt || 0) + (employee.other_deductions || 0);

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      height: '100%',
      padding: '25mm 20mm 25mm 30mm',
      boxSizing: 'border-box',
      fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
      fontSize: '11px',
      color: '#111',
      background: '#fff',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <style>{`
        @page { size: A4; margin: 0; }
        @media print {
          html, body { width: 100%; height: 100%; margin: 0 !important; padding: 0 !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      {/* ====== CABEÇALHO ====== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
        <div style={{ width: '48%' }}>
          <div style={{ fontSize: '14px', fontWeight: 900, marginBottom: '4px', color: '#4f46e5' }}>{companyProfile?.name || 'Empresa'}</div>
          <div><strong>NIF:</strong> {companyProfile?.nif || '—'}</div>
          <div><strong>Endereço:</strong> {companyProfile?.address || '—'}</div>
        </div>
        <div style={{ width: '48%', textAlign: 'right' }}>
          <div style={{ fontSize: '16px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '4px' }}>Recibo de Vencimento</div>
          <div><strong>Recibo Nº:</strong> {payroll.year}/{String(payroll.month || 1).padStart(2, '0')}-{String(employee.id || '').slice(0, 4).toUpperCase()}</div>
          <div><strong>Data:</strong> {formattedDate}</div>
        </div>
      </div>

      {/* ====== DADOS DO FUNCIONÁRIO ====== */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '12px', 
        padding: '16px', 
        background: '#f8f9fa', 
        borderRadius: '8px', 
        border: '1px solid #e5e7eb',
        marginBottom: '30px'
      }}>
        <div><strong>Nome:</strong> {employee.employee_name}</div>
        <div><strong>Função:</strong> {employee.position || '—'}</div>
        <div><strong>Departamento:</strong> {employee.department_name || 'Gestão de Recursos Humanos'}</div>
        <div><strong>Mês:</strong> {months[payroll.month - 1]} / {payroll.year}</div>
      </div>

      {/* ====== TABELA PRINCIPAL (3 COLUNAS) ====== */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
        <thead>
          <tr style={{ background: '#f2f2f2' }}>
            <th style={{ border: '1px solid #111', padding: '10px', textAlign: 'left', fontSize: '10px', textTransform: 'uppercase' }}>Descrição</th>
            <th style={{ border: '1px solid #111', padding: '10px', textAlign: 'right', fontSize: '10px', textTransform: 'uppercase', width: '20%' }}>Proventos</th>
            <th style={{ border: '1px solid #111', padding: '10px', textAlign: 'right', fontSize: '10px', textTransform: 'uppercase', width: '20%' }}>Descontos</th>
          </tr>
        </thead>
        <tbody>
          {/* Salário Base */}
          <tr>
            <td style={{ border: '1px solid #111', padding: '10px' }}>Salário Base</td>
            <td style={{ border: '1px solid #111', padding: '10px', textAlign: 'right' }}>{(employee.salary_base || 0).toLocaleString('pt-AO')} {currency}</td>
            <td style={{ border: '1px solid #111', padding: '10px', textAlign: 'right' }}>-</td>
          </tr>
          {/* Subsídio de Alimentação */}
          {(employee.food_allowance || 0) > 0 && (
            <tr>
              <td style={{ border: '1px solid #111', padding: '10px' }}>Subsídio de Alimentação</td>
              <td style={{ border: '1px solid #111', padding: '10px', textAlign: 'right' }}>{(employee.food_allowance).toLocaleString('pt-AO')} {currency}</td>
              <td style={{ border: '1px solid #111', padding: '10px', textAlign: 'right' }}>-</td>
            </tr>
          )}
          {/* Subsídio de Transporte */}
          {(employee.transport_allowance || 0) > 0 && (
            <tr>
              <td style={{ border: '1px solid #111', padding: '10px' }}>Subsídio de Transporte</td>
              <td style={{ border: '1px solid #111', padding: '10px', textAlign: 'right' }}>{(employee.transport_allowance).toLocaleString('pt-AO')} {currency}</td>
              <td style={{ border: '1px solid #111', padding: '10px', textAlign: 'right' }}>-</td>
            </tr>
          )}
          {/* Segurança Social */}
          {!employee.is_service_provider && (employee.inss_employee || 0) > 0 && (
            <tr>
              <td style={{ border: '1px solid #111', padding: '10px' }}>Segurança Social (3%)</td>
              <td style={{ border: '1px solid #111', padding: '10px', textAlign: 'right' }}>-</td>
              <td style={{ border: '1px solid #111', padding: '10px', textAlign: 'right', color: '#dc2626' }}>{(employee.inss_employee).toLocaleString('pt-AO')} {currency}</td>
            </tr>
          )}
          {/* IRT */}
          {(employee.irt || 0) > 0 && (
            <tr>
              <td style={{ border: '1px solid #111', padding: '10px' }}>IRT</td>
              <td style={{ border: '1px solid #111', padding: '10px', textAlign: 'right' }}>-</td>
              <td style={{ border: '1px solid #111', padding: '10px', textAlign: 'right', color: '#dc2626' }}>{(employee.irt).toLocaleString('pt-AO')} {currency}</td>
            </tr>
          )}
          {/* Outros Descontos */}
          {(employee.other_deductions || 0) > 0 && (
            <tr>
              <td style={{ border: '1px solid #111', padding: '10px' }}>Outros Descontos</td>
              <td style={{ border: '1px solid #111', padding: '10px', textAlign: 'right' }}>-</td>
              <td style={{ border: '1px solid #111', padding: '10px', textAlign: 'right', color: '#dc2626' }}>{(employee.other_deductions).toLocaleString('pt-AO')} {currency}</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* ====== TOTAIS ====== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
        <div style={{ 
          width: '48%', 
          padding: '16px', 
          border: '2px solid #111', 
          borderRadius: '8px',
          background: '#f8f9fa'
        }}>
          <strong>Total Proventos:</strong> {(totalBruto || 0).toLocaleString('pt-AO')} {currency}
        </div>
        <div style={{ 
          width: '48%', 
          padding: '16px', 
          border: '2px solid #111', 
          borderRadius: '8px',
          background: '#4f46e5',
          color: '#fff'
        }}>
          <strong>Total Descontos:</strong> {(totalDescontos || 0).toLocaleString('pt-AO')} {currency}<br />
          <div style={{ marginTop: '8px', fontSize: '18px', fontWeight: 900 }}>
            Líquido a Receber: {(employee.net_salary || 0).toLocaleString('pt-AO')} {currency}
          </div>
        </div>
      </div>

      {/* ====== ASSINATURAS ====== */}
      <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '80px' }}>
        <div style={{ width: '40%', textAlign: 'center' }}>
          <div style={{ width: '100%', borderBottom: '1px solid #111', marginBottom: '8px' }}></div>
          <strong>O Empregador</strong>
        </div>
        <div style={{ width: '40%', textAlign: 'center' }}>
          <div style={{ width: '100%', borderBottom: '1px solid #111', marginBottom: '8px' }}></div>
          <strong>O Funcionário</strong>
          <div style={{ fontSize: '10px', color: '#6b7280' }}>{employee.employee_name}</div>
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
        <p style={{ fontSize: '8px', color: '#9ca3af', margin: 0 }}>
          Este documento serve como prova de liquidação de salários. Processado informaticamente.
        </p>
      </div>
    </div>
  );
}
