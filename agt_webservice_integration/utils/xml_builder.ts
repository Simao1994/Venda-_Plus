/**
 * Converte o objecto de factura do Venda Plus para o formato XML esperado pela AGT
 */
export function buildInvoiceXml(invoice: any): string {
    // invoice = Objeto genérico representando a venda recém-criada
    const invoiceNo = invoice.invoice_number || `FT ${new Date().getFullYear()}/${invoice.id}`;
    const invoiceDate = invoice.created_at ? new Date(invoice.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    // FT = Fatura, NC = Nota de Crédito, ND = Nota de Débito, FR = Fatura/Recibo, PP = Pró-Forma
    // Ignorar Pró-Formas se a integração for estrita, neste exemplo mapeamos direto
    const invoiceType = invoice.is_pro_forma ? 'PP' : 'FT';

    const custTaxId = invoice.customer_nif || 'Consumidor final';

    const netTotal = invoice.subtotal || 0;
    const taxPayable = invoice.tax || 0;
    const grossTotal = invoice.total || 0;

    return `
        <soapenv:Body>
            <agt:RegisterInvoice xmlns:agt="http://minfin.gov.ao/agt/webservice">
                <agt:Invoice>
                    <agt:InvoiceNo>${invoiceNo}</agt:InvoiceNo>
                    <agt:InvoiceDate>${invoiceDate}</agt:InvoiceDate>
                    <agt:InvoiceType>${invoiceType}</agt:InvoiceType>
                    <agt:CustomerTaxID>${custTaxId}</agt:CustomerTaxID>
                    
                    <agt:Hash>${invoice.hash || ''}</agt:Hash>
                    <agt:HashControl>${(invoice.prev_hash || '').substring(0, 4) || '0000'}</agt:HashControl>

                    <agt:InvoiceLines>
                        ${(invoice.items || []).map((item: any, idx: number) => `
                        <agt:Line>
                            <agt:LineNumber>${idx + 1}</agt:LineNumber>
                            <agt:ProductCode>${item.product_id || item.id}</agt:ProductCode>
                            <agt:ProductDescription>${item.product_name || item.name || 'Artigo'}</agt:ProductDescription>
                            <agt:Quantity>${item.quantity}</agt:Quantity>
                            <agt:UnitOfMeasure>${item.unit || 'un'}</agt:UnitOfMeasure>
                            <agt:UnitPrice>${Number(item.unit_price || 0).toFixed(2)}</agt:UnitPrice>
                            <agt:Tax>
                                <agt:TaxType>IVA</agt:TaxType>
                                <agt:TaxPercentage>${item.tax_percentage || 14}</agt:TaxPercentage>
                            </agt:Tax>
                            <agt:NetTotal>${(Number(item.unit_price || 0) * Number(item.quantity || 0)).toFixed(2)}</agt:NetTotal>
                        </agt:Line>
                        `).join('')}
                    </agt:InvoiceLines>

                    <agt:DocumentTotals>
                        <agt:TaxPayable>${taxPayable.toFixed(2)}</agt:TaxPayable>
                        <agt:NetTotal>${netTotal.toFixed(2)}</agt:NetTotal>
                        <agt:GrossTotal>${grossTotal.toFixed(2)}</agt:GrossTotal>
                    </agt:DocumentTotals>
                </agt:Invoice>
            </agt:RegisterInvoice>
        </soapenv:Body>
    `;
}

/**
 * Monta o Envelope SOAP completo
 */
export function buildSoapEnvelope(headerXml: string, bodyXml: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
    ${headerXml}
    ${bodyXml}
</soapenv:Envelope>`;
}
