/**
 * SAF-T (AOA) XML — Gerador Principal XML

 * Módulo independente que gera o ficheiro SAF-T completo de acordo com
 * a especificação da AGT (Autoridade Geral Tributária) de Angola.
 *
 * Estrutura gerada:
 *   <AuditFile>
 *     <Header>              — Dados da empresa e do período
 *     <MasterFiles>
 *       <GeneralLedgerAccounts>  (simplificado)
 *       <Customer>           — Lista de clientes
 *       <Product>            — Lista de produtos/serviços
 *       <TaxTable>           — Tabela de taxas (IVA Angola)
 *     <SourceDocuments>
 *       <SalesInvoices>      — Facturas, Facturas-Recibo, Notas de Crédito, Pro-Formas
 *       <Payments>           — Recibos de pagamento
 */

import { supabase } from '../src/lib/supabase';
import type { SaftGenerationParams, SaftGenerationResult } from './types';
import {
    escapeXml, formatDate, formatDateTime, formatAmount,
    mapPaymentMechanism, mapInvoiceType, getPeriod,
    buildHashControl, normalizeTaxId, tag, tagBlock
} from './helpers';

// ─── CONFIGURAÇÃO ──────────────────────────────────────────────────────────────

const SAFT_VERSION = '1.0';
const COUNTRY_CODE = 'AO';
const CURRENCY_CODE = 'AOA';
const TAX_ACCOUNTING_BASIS = 'F'; // F = Faturação
const GENERATED_BY = 'Venda Plus ERP';
const PRODUCT_COMPANY_NIF = '000000000'; // NIF do produtor do software


// ─── ENTRY POINT ───────────────────────────────────────────────────────────────

/**
 * Gera o ficheiro SAF-T (AOA) XML completo para uma empresa e período.

 * @param params - Parâmetros de geração (company_id, fiscal_year, datas)
 * @returns XML string + metadados
 */
export async function generateSaftXml(params: SaftGenerationParams): Promise<SaftGenerationResult> {
    const { company_id, fiscal_year, start_date, end_date } = params;

    console.log(`[SAF-T AOA XML] Iniciando geração para empresa ${company_id}, período ${start_date} → ${end_date}`);


    // ── 1. Carregar dados da empresa ──────────────────────────────────────────
    const { data: company, error: compError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', company_id)
        .single();

    if (compError || !company) {
        throw new Error(`[SAF-T AOA XML] Empresa não encontrada: ${compError?.message}`);

    }

    // ── 2. Carregar clientes ──────────────────────────────────────────────────
    const { data: customers } = await supabase
        .from('customers')
        .select('*')
        .eq('company_id', company_id)
        .order('id');

    // ── 3. Carregar produtos ──────────────────────────────────────────────────
    const { data: products } = await supabase
        .from('products')
        .select('*, categories(name)')
        .eq('company_id', company_id)
        .order('id');

    // ── 4. Carregar facturas do período ────────────────────────────────────────
    const { data: sales } = await supabase
        .from('sales')
        .select(`
      *,
      customers(name, nif, address, phone, email),
      users(name),
      items:sale_items(*, products(name, barcode, unit, tax_percentage))
    `)
        .eq('company_id', company_id)
        .gte('created_at', `${start_date}T00:00:00`)
        .lte('created_at', `${end_date}T23:59:59`)
        .order('created_at');

    // ── 5. Carregar pagamentos do período ─────────────────────────────────────
    const { data: payments } = await supabase
        .from('payments')
        .select(`
      *,
      sales(invoice_number, customers(name, nif))
    `)
        .eq('company_id', company_id)
        .gte('created_at', `${start_date}T00:00:00`)
        .lte('created_at', `${end_date}T23:59:59`)
        .order('created_at');

    // ── 5.1 Carregar configuração AGT (Cert Number) ───────────────────────────
    const { data: agtConfig } = await supabase
        .from('agt_configs')
        .select('cert_number')
        .eq('company_id', company_id)
        .maybeSingle();

    const certNumber = agtConfig?.cert_number || '0000/AGT/2026';


    // ── 6. Montar estatísticas ─────────────────────────────────────────────────
    const totalNetValue = (sales || []).reduce((s: number, v: any) => s + Number(v.subtotal || 0), 0);
    const totalTaxValue = (sales || []).reduce((s: number, v: any) => s + Number(v.tax || 0), 0);
    const totalGrossValue = (sales || []).reduce((s: number, v: any) => s + Number(v.total || 0), 0);

    console.log(`[SAF-T AO] Encontrado: ${(sales || []).length} facturas, ${(payments || []).length} pagamentos, ${(customers || []).length} clientes, ${(products || []).length} produtos`);

    // ── 7. Gerar XML ───────────────────────────────────────────────────────────
    const xml = buildAuditFileXml({
        company,
        customers: customers || [],
        products: products || [],
        sales: sales || [],
        payments: payments || [],
        params,
        certNumber
    });


    const filename = `SAFT_AO_${company.nif || company_id}_${fiscal_year}_${start_date.replace(/-/g, '')}_${end_date.replace(/-/g, '')}.xml`;

    const result: SaftGenerationResult = {
        xml,
        filename,
        stats: {
            totalInvoices: (sales || []).length,
            totalPayments: (payments || []).length,
            totalCustomers: (customers || []).length,
            totalProducts: (products || []).length,
            totalNetValue,
            totalTaxValue,
            totalGrossValue,
            generatedAt: new Date().toISOString(),
        },
    };

    console.log(`[SAF-T AO] Geração completa. Ficheiro: ${filename}`);
    return result;
}

// ─── BUILDERS ─────────────────────────────────────────────────────────────────

function buildAuditFileXml(ctx: {
    company: any;
    customers: any[];
    products: any[];
    sales: any[];
    payments: any[];
    params: SaftGenerationParams;
    certNumber: string;
}): string {
    const { company, customers, products, sales, payments, params, certNumber } = ctx;
    const now = new Date();

    const headerXml = buildHeader(company, params, now, certNumber);

    const masterFilesXml = buildMasterFiles(customers, products, company);
    const sourceDocumentsXml = buildSourceDocuments(sales, payments, company);

    return `<?xml version="1.0" encoding="UTF-8"?>
<AuditFile xmlns="urn:OECD:Standard:SAF-T:1.00:AO"
           xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
           xsi:schemaLocation="urn:OECD:Standard:SAF-T:1.00:AO saft-ao-1.0.xsd">
${headerXml}${masterFilesXml}${sourceDocumentsXml}</AuditFile>`;
}

// ─── HEADER ────────────────────────────────────────────────────────────────────

function buildHeader(company: any, params: SaftGenerationParams, now: Date, certNumber: string): string {
    const today = now.toISOString().split('T')[0];
    const companyNif = company.nif || '000000000';

    let content = '';
    content += tag('AuditFileVersion', SAFT_VERSION, 2);
    content += tag('CompanyID', companyNif, 2);
    content += tag('TaxRegistrationNumber', companyNif, 2);
    content += tag('TaxAccountingBasis', TAX_ACCOUNTING_BASIS, 2);
    content += tag('CompanyName', company.name, 2);

    // CompanyAddress
    let addrContent = '';
    addrContent += tag('AddressDetail', company.address || 'Angola', 3);
    addrContent += tag('City', 'Luanda', 3);
    addrContent += tag('PostalCode', '0000-000', 3);
    addrContent += tag('Country', COUNTRY_CODE, 3);
    content += tagBlock('CompanyAddress', addrContent, 2);

    content += tag('FiscalYear', params.fiscal_year, 2);
    content += tag('StartDate', formatDate(params.start_date), 2);
    content += tag('EndDate', formatDate(params.end_date), 2);
    content += tag('CurrencyCode', CURRENCY_CODE, 2);
    content += tag('DateCreated', today, 2);
    content += tag('TaxEntity', 'Global', 2);
    content += tag('ProductCompanyTaxID', PRODUCT_COMPANY_NIF, 2);
    content += tag('SoftwareCertificateNumber', certNumber, 2);

    content += tag('ProductID', 'Venda Plus ERP/Venda Plus', 2);
    content += tag('ProductVersion', '2.0', 2);
    content += tag('HeaderComment', `SAF-T gerado em ${now.toISOString()} por ${GENERATED_BY}`, 2);

    return tagBlock('Header', content, 1);
}

// ─── MASTER FILES ───────────────────────────────────────────────────────────────

function buildMasterFiles(customers: any[], products: any[], company: any): string {
    let content = '';
    content += buildCustomers(customers);
    content += buildProducts(products);
    content += buildTaxTable(company);
    return tagBlock('MasterFiles', content, 1);
}

function buildCustomers(customers: any[]): string {
    // Adicionar cliente genérico "Consumidor Final"
    const genericCustomer = `  <Customer>
    <CustomerID>CF</CustomerID>
    <AccountID>21</AccountID>
    <CustomerTaxID>Consumidor Final</CustomerTaxID>
    <CompanyName>Consumidor Final</CompanyName>
    <BillingAddress>
      <AddressDetail>Angola</AddressDetail>
      <City>Luanda</City>
      <PostalCode>0000-000</PostalCode>
      <Country>AO</Country>
    </BillingAddress>
    <SelfBillingIndicator>0</SelfBillingIndicator>
  </Customer>\n`;

    const customersXml = customers.map(c => {
        let content = '';
        content += tag('CustomerID', String(c.id), 3);
        content += tag('AccountID', '21', 3);
        content += tag('CustomerTaxID', normalizeTaxId(c.nif), 3);
        content += tag('CompanyName', c.name, 3);

        let addr = '';
        addr += tag('AddressDetail', c.address || 'Angola', 4);
        addr += tag('City', 'Luanda', 4);
        addr += tag('PostalCode', '0000-000', 4);
        addr += tag('Country', COUNTRY_CODE, 4);
        content += tagBlock('BillingAddress', addr, 3);

        if (c.phone) content += tag('Telephone', c.phone, 3);
        if (c.email) content += tag('Email', c.email, 3);
        content += tag('SelfBillingIndicator', '0', 3);

        return tagBlock('Customer', content, 2);
    }).join('');

    return genericCustomer + customersXml;
}

function buildProducts(products: any[]): string {
    return products.map(p => {
        let content = '';
        content += tag('ProductType', 'P', 3); // P = Produto (S para Serviço)
        content += tag('ProductCode', String(p.id), 3);
        content += tag('ProductGroup', p.categories?.name || 'Geral', 3);
        content += tag('ProductDescription', p.name, 3);
        content += tag('ProductNumberCode', p.barcode || String(p.id), 3);
        return tagBlock('Product', content, 2);
    }).join('');
}

function buildTaxTable(company: any): string {
    const taxRate = company.tax_percentage ?? 14;

    let content = '';

    // Taxa Normal IVA
    let normalEntry = '';
    normalEntry += tag('TaxType', 'IVA', 3);
    normalEntry += tag('TaxCountryRegion', COUNTRY_CODE, 3);
    normalEntry += tag('TaxCode', 'NOR', 3);
    normalEntry += tag('Description', `IVA - Taxa Normal ${taxRate}%`, 3);
    normalEntry += tag('TaxPercentage', taxRate, 3);
    content += tagBlock('TaxTableEntry', normalEntry, 2);

    // Isento de IVA
    let isentoEntry = '';
    isentoEntry += tag('TaxType', 'IVA', 3);
    isentoEntry += tag('TaxCountryRegion', COUNTRY_CODE, 3);
    isentoEntry += tag('TaxCode', 'ISE', 3);
    isentoEntry += tag('Description', 'Isento de IVA', 3);
    isentoEntry += tag('TaxPercentage', '0', 3);
    content += tagBlock('TaxTableEntry', isentoEntry, 2);

    // Não Sujeito
    let naoSujeitoEntry = '';
    naoSujeitoEntry += tag('TaxType', 'NS', 3);
    naoSujeitoEntry += tag('TaxCountryRegion', COUNTRY_CODE, 3);
    naoSujeitoEntry += tag('TaxCode', 'NS', 3);
    naoSujeitoEntry += tag('Description', 'Não Sujeito a IVA', 3);
    naoSujeitoEntry += tag('TaxPercentage', '0', 3);
    content += tagBlock('TaxTableEntry', naoSujeitoEntry, 2);

    return tagBlock('TaxTable', content, 2);
}

// ─── SOURCE DOCUMENTS ──────────────────────────────────────────────────────────

function buildSourceDocuments(sales: any[], payments: any[], company: any): string {
    let content = '';
    content += buildSalesInvoices(sales, company);
    if (payments.length > 0) {
        content += buildPayments(payments, company);
    }
    return tagBlock('SourceDocuments', content, 1);
}

// ── SALES INVOICES ─────────────────────────────────────────────────────────────

function buildSalesInvoices(sales: any[], company: any): string {
    if (sales.length === 0) {
        return `  <SalesInvoices>\n    <NumberOfEntries>0</NumberOfEntries>\n    <TotalDebit>0.00</TotalDebit>\n    <TotalCredit>0.00</TotalCredit>\n  </SalesInvoices>\n`;
    }

    const totalCredit = sales.reduce((s, v) => s + Number(v.total || 0), 0);
    const totalDebit = 0; // Só relevante para documentos rectificativos

    let invoicesContent = '';
    invoicesContent += tag('NumberOfEntries', sales.length, 2);
    invoicesContent += tag('TotalDebit', formatAmount(totalDebit), 2);
    invoicesContent += tag('TotalCredit', formatAmount(totalCredit), 2);

    for (const sale of sales) {
        invoicesContent += buildSingleInvoice(sale, company);
    }

    return tagBlock('SalesInvoices', invoicesContent, 1);
}

function buildSingleInvoice(sale: any, company: any): string {
    const isCancelled = sale.status === 'cancelled';
    const isProForma = !!sale.is_pro_forma;
    const isExempt = !!sale.is_exempt;

    const invoiceType = mapInvoiceType(sale.invoice_number, isProForma, isCancelled);
    const period = getPeriod(sale.created_at);
    const invoiceDate = formatDate(sale.created_at);
    const systemEntryDate = formatDateTime(sale.created_at);
    const customerId = sale.customer_id ? String(sale.customer_id) : 'CF';
    const prevHash = sale.prev_hash || '';
    const hash = sale.hash || '0000000000000000000000000000000000000000000=';
    const hashControl = buildHashControl(prevHash);

    let content = '';
    content += tag('InvoiceNo', sale.invoice_number, 3);

    // DocumentStatus
    let statusContent = '';
    statusContent += tag('InvoiceStatus', isCancelled ? 'A' : 'N', 4);
    statusContent += tag('InvoiceStatusDate', systemEntryDate, 4);
    statusContent += tag('SourceID', sale.users?.name || 'Sistema', 4);
    statusContent += tag('SourceBilling', 'P', 4); // P = Aplicação (Programa)
    content += tagBlock('DocumentStatus', statusContent, 3);

    content += tag('Hash', hash, 3);
    content += tag('HashControl', hashControl, 3);
    content += tag('Period', period, 3);
    content += tag('InvoiceDate', invoiceDate, 3);
    content += tag('InvoiceType', invoiceType, 3);

    // SpecialRegimes
    let regimesContent = '';
    regimesContent += tag('SelfBillingIndicator', '0', 4);
    regimesContent += tag('CashVATSchemeIndicator', '0', 4);
    regimesContent += tag('ThirdPartiesBillingIndicator', '0', 4);
    content += tagBlock('SpecialRegimes', regimesContent, 3);

    content += tag('SourceID', sale.users?.name || 'Sistema', 3);
    content += tag('SystemEntryDate', systemEntryDate, 3);
    content += tag('CustomerID', customerId, 3);

    // Lines
    const items = sale.items || [];
    const taxRate = company.tax_percentage ?? 14;

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const productTaxRate = item.products?.tax_percentage ?? taxRate;
        const effectiveTaxRate = isExempt ? 0 : productTaxRate;
        const unitPrice = Number(item.unit_price || 0);
        const qty = Number(item.quantity || 0);
        const lineNet = unitPrice * qty;
        const creditAmount = lineNet;

        let lineContent = '';
        lineContent += tag('LineNumber', i + 1, 4);
        lineContent += tag('ProductCode', String(item.product_id), 4);
        lineContent += tag('ProductDescription', item.products?.name || `Produto ${item.product_id}`, 4);
        lineContent += tag('Quantity', qty, 4);
        lineContent += tag('UnitOfMeasure', item.products?.unit || 'un', 4);
        lineContent += tag('UnitPrice', formatAmount(unitPrice), 4);
        lineContent += tag('TaxPointDate', invoiceDate, 4);
        lineContent += tag('Description', item.products?.name || `Artigo ${i + 1}`, 4);
        lineContent += tag('CreditAmount', formatAmount(creditAmount), 4);

        // Tax per line
        let taxContent = '';
        taxContent += tag('TaxType', 'IVA', 5);
        taxContent += tag('TaxCountryRegion', COUNTRY_CODE, 5);
        taxContent += tag('TaxCode', isExempt ? 'ISE' : 'NOR', 5);
        taxContent += tag('TaxPercentage', effectiveTaxRate, 5);
        lineContent += tagBlock('Tax', taxContent, 4);

        content += tagBlock('Line', lineContent, 3);
    }

    // If no items (edge case), add a summary line
    if (items.length === 0) {
        let lineContent = '';
        lineContent += tag('LineNumber', 1, 4);
        lineContent += tag('ProductCode', 'VENDA', 4);
        lineContent += tag('ProductDescription', 'Venda', 4);
        lineContent += tag('Quantity', 1, 4);
        lineContent += tag('UnitOfMeasure', 'un', 4);
        lineContent += tag('UnitPrice', formatAmount(sale.subtotal), 4);
        lineContent += tag('TaxPointDate', invoiceDate, 4);
        lineContent += tag('Description', 'Venda', 4);
        lineContent += tag('CreditAmount', formatAmount(sale.subtotal), 4);

        let taxContent = '';
        taxContent += tag('TaxType', 'IVA', 5);
        taxContent += tag('TaxCountryRegion', COUNTRY_CODE, 5);
        taxContent += tag('TaxCode', isExempt ? 'ISE' : 'NOR', 5);
        taxContent += tag('TaxPercentage', isExempt ? 0 : taxRate, 5);
        lineContent += tagBlock('Tax', taxContent, 4);

        content += tagBlock('Line', lineContent, 3);
    }

    // DocumentTotals
    let totalsContent = '';
    totalsContent += tag('TaxPayable', formatAmount(sale.tax), 4);
    totalsContent += tag('NetTotal', formatAmount(sale.subtotal), 4);
    totalsContent += tag('GrossTotal', formatAmount(sale.total), 4);

    // Payment info inside totals
    if (!isProForma && sale.payment_method) {
        let payBlock = '';
        payBlock += tag('PaymentMechanism', mapPaymentMechanism(sale.payment_method), 5);
        payBlock += tag('PaymentAmount', formatAmount(sale.amount_paid), 5);
        payBlock += tag('PaymentDate', invoiceDate, 5);
        totalsContent += tagBlock('Payment', payBlock, 4);
    }

    content += tagBlock('DocumentTotals', totalsContent, 3);

    return tagBlock('Invoice', content, 2);
}

// ── PAYMENTS ───────────────────────────────────────────────────────────────────

function buildPayments(payments: any[], company: any): string {
    const totalPaymentsValue = payments.reduce((s, p) => s + Number(p.amount || 0), 0);

    let content = '';
    content += tag('NumberOfEntries', payments.length, 2);
    content += tag('TotalDebit', '0.00', 2);
    content += tag('TotalCredit', formatAmount(totalPaymentsValue), 2);

    for (const payment of payments) {
        content += buildSinglePayment(payment);
    }

    return tagBlock('Payments', content, 1);
}

function buildSinglePayment(payment: any): string {
    const docNumber = payment.document_number || `RE-${payment.id}`;
    const payDate = formatDate(payment.created_at);
    const sysDate = formatDateTime(payment.created_at);
    const period = getPeriod(payment.created_at);
    const hash = payment.hash || '0000000000000000000000000000000000000000000=';
    const hashControl = buildHashControl(payment.prev_hash);
    const customerNif = normalizeTaxId(payment.sales?.customers?.nif);
    const customerId = payment.sales?.customer_id ? String(payment.sales.customer_id) : 'CF';
    const isCancelled = payment.status === 'cancelled';

    let content = '';
    content += tag('PaymentRefNo', docNumber, 3);
    content += tag('Period', period, 3);
    content += tag('TransactionDate', payDate, 3);
    content += tag('PaymentType', 'RC', 3); // RC = Recibo de Cliente

    // DocumentStatus
    let statusContent = '';
    statusContent += tag('PaymentStatus', isCancelled ? 'A' : 'N', 4);
    statusContent += tag('PaymentStatusDate', sysDate, 4);
    statusContent += tag('SourceID', 'Sistema', 4);
    statusContent += tag('SourcePayment', 'P', 4);
    content += tagBlock('DocumentStatus', statusContent, 3);

    content += tag('Hash', hash, 3);
    content += tag('HashControl', hashControl, 3);
    content += tag('SourceID', 'Sistema', 3);
    content += tag('SystemEntryDate', sysDate, 3);
    content += tag('CustomerID', customerId, 3);

    // PaymentMethod
    let pmContent = '';
    pmContent += tag('PaymentMechanism', mapPaymentMechanism(payment.payment_method), 4);
    pmContent += tag('PaymentAmount', formatAmount(payment.amount), 4);
    pmContent += tag('PaymentDate', payDate, 4);
    content += tagBlock('PaymentMethod', pmContent, 3);

    // Line (referencia à factura original)
    const originatingRef = payment.sales?.invoice_number || 'DESCONHECIDO';
    const invoiceDate = formatDate(payment.sales?.created_at);
    let lineContent = '';
    lineContent += tag('LineNumber', 1, 4);
    let srcDocContent = '';
    srcDocContent += tag('OriginatingON', originatingRef, 5);
    srcDocContent += tag('InvoiceDate', invoiceDate, 5);
    lineContent += tagBlock('SourceDocumentID', srcDocContent, 4);
    lineContent += tag('CreditAmount', formatAmount(payment.amount), 4);
    content += tagBlock('Line', lineContent, 3);

    // DocumentTotals
    let totalsContent = '';
    totalsContent += tag('TaxPayable', '0.00', 4);
    totalsContent += tag('NetTotal', formatAmount(payment.amount), 4);
    totalsContent += tag('GrossTotal', formatAmount(payment.amount), 4);
    content += tagBlock('DocumentTotals', totalsContent, 3);

    return tagBlock('Payment', content, 2);
}
