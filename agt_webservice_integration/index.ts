import { SoapClientAGT } from './services/SoapClientAGT';

/**
 * Hook disparado após a criação de uma factura no sistema principal.
 * Esta função é assíncrona e não bloqueia o fluxo principal.
 */
export async function onInvoiceCreated(invoice: any) {
    try {
        console.log(`[AGT Hook] Processando nova factura: ${invoice.invoice_number || invoice.id}`);

        // Dispara o envio para a AGT
        // O SoapClient agora carrega a config do banco e valida se o auto_send está activo
        const result = await SoapClientAGT.sendInvoiceToAGT(invoice);

        return result;
    } catch (error) {
        console.error('[AGT Hook] Erro crítico ao processar evento de factura:', error);
    }
}

export { SoapClientAGT } from './services/SoapClientAGT';
