import React, { forwardRef } from 'react';

export interface A4ReportTemplateProps {
    title: string;
    subtitle?: string;
    companyData: any; // Mapped from the "user" object context
    orientation?: 'portrait' | 'landscape';
    dateRange?: string;
    children: React.ReactNode;
}

export const A4ReportTemplate = forwardRef<HTMLDivElement, A4ReportTemplateProps>(({
    title, subtitle, companyData, orientation = 'portrait', dateRange, children
}, ref) => {
    const isLandscape = orientation === 'landscape';
    const width = isLandscape ? '297mm' : '210mm';
    const minHeight = isLandscape ? '210mm' : '297mm';

    const now = new Date();
    const today = now.toLocaleDateString('pt-AO', { day: '2-digit', month: 'long', year: 'numeric' });
    const time = now.toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' });

    // Fallback mappings if companyData uses old snake_case or new camelCase
    const companyName = companyData?.company_name || companyData?.name || 'Empresa';
    const companyNif = companyData?.nif || 'Consumidor Final';
    const companyAddress = companyData?.address || 'Luanda, Angola';
    const companyEmail = companyData?.email || companyData?.company_email;
    const companyPhone = companyData?.phone || companyData?.company_phone;

    return (
        <div ref={ref} className="bg-white text-black a4-report-container" style={{
            width,
            minHeight,
            padding: '15mm',

            margin: '0 auto',
            boxSizing: 'border-box',
            fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
        }}>

            <style>{`
        @page {
          size: A4 ${orientation};
        }
      `}</style>


            {/* Pagination Element (Fixed in Print) */}
            <div className="hidden print:block a4-page-number-footer" />

            {/* Global A4 Header */}
            <div className="flex flex-col md:flex-row justify-between items-start border-b-[3px] border-black pb-4 mb-6 a4-print-no-break">
                <div>
                    <h1 className="text-2xl font-black uppercase text-black tracking-tight">{companyName}</h1>
                    <p className="text-[11px] text-gray-700 mt-1"><span className="font-bold">NIF:</span> {companyNif}</p>
                    <p className="text-[11px] text-gray-700"><span className="font-bold">Endereço:</span> {companyAddress}</p>
                    {(companyEmail || companyPhone) && (
                        <p className="text-[11px] text-gray-700">
                            {companyEmail && `Email: ${companyEmail}`}
                            {companyEmail && companyPhone ? ' | ' : ''}
                            {companyPhone && `Tel: ${companyPhone}`}
                        </p>
                    )}
                </div>
                <div className="text-right mt-4 md:mt-0">
                    <h2 className="text-lg font-black uppercase text-gray-800 tracking-wide">{title}</h2>
                    {subtitle && <p className="text-[12px] text-gray-600 font-bold uppercase mt-1">{subtitle}</p>}
                    {dateRange && <p className="text-[11px] text-gray-600 mt-1">Período: {dateRange}</p>}
                    <p className="text-[10px] text-gray-500 mt-1">Emitido a {today} às {time}</p>
                </div>
            </div>

            {/* Main Report Content */}
            <main className="w-full">
                {children}
            </main>

            {/* Simple Footer (appended after content) */}
            <div className="pt-4 mt-8 border-t border-gray-300 flex justify-between text-[9px] text-gray-500 uppercase tracking-widest a4-print-no-break">
                <span>Gestão Empresarial — Processado por Computador (Venda Plus)</span>
                <span>{companyName} — Uso Interno</span>
            </div>
        </div>
    );
});

A4ReportTemplate.displayName = 'A4ReportTemplate';
