import { supabase } from '../../src/lib/supabase';
import { AuthService } from './AuthService';
import { buildInvoiceXml, buildSoapEnvelope } from '../utils/xml_builder';

const MAX_RETRIES = 3;

/**
 * Cliente central que executa o envio do XML para a Autoridade Geral Tributária (Angola)
 * Agora com suporte a persistência e multi-empresa.
 */
export class SoapClientAGT {
    /**
     * Tenta enviar a factura formatada para a AGT
     */
    static async sendInvoiceToAGT(invoice: any, attempt = 1): Promise<any> {
        const companyId = invoice.company_id;
        const invoiceNo = invoice.invoice_number || `INV-${invoice.id}`;

        try {
            // 1. Carregar configuração específica da empresa
            const { data: config, error: configError } = await supabase
                .from('agt_configs')
                .select('*')
                .eq('company_id', companyId)
                .single();

            if (configError || !config) {
                console.error(`[AGT] Configuração não encontrada para empresa ${companyId}.`);
                await this.logToDb(companyId, invoice, 'IGNORADO', 'Configuração AGT ausente para esta empresa.');
                return { state: 'IGNORADO', reason: 'MISSING_CONFIG' };
            }

            if (!config.auto_send) {
                console.log(`[AGT] Envio automático desativado para empresa ${companyId}.`);
                await this.logToDb(companyId, invoice, 'IGNORADO', 'Envio automático desativado.');
                return { state: 'IGNORADO', reason: 'AUTO_SEND_OFF' };
            }

            // 2. Preparar Payload
            const header = AuthService.buildWsseHeader(config.username, config.password, config.aes_secret_key);
            const body = buildInvoiceXml(invoice);
            const soapMessage = buildSoapEnvelope(header, body);

            console.log(`[AGT] Enviando factura ${invoiceNo} (Tentativa ${attempt}/${MAX_RETRIES})`);

            // 3. Comunicação HTTP
            const response = await fetch(config.endpoint_soap, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/xml;charset=UTF-8',
                    'SOAPAction': 'RegisterInvoice'
                },
                body: soapMessage
            });

            const responseText = await response.text();

            if (!response.ok || responseText.includes('Fault')) {
                throw new Error(responseText.substring(0, 200) || `Erro HTTP ${response.status}`);
            }

            // 4. Sucesso: Gravar Log e Retornar
            console.log(`[AGT] Factura ${invoiceNo} comunicada com sucesso!`);
            await this.logToDb(companyId, invoice, 'ENVIADO', null, responseText);

            return { state: 'ENVIADO', invoice_id: invoice.id };

        } catch (error: any) {
            console.error(`[AGT] Erro na submissão ${invoiceNo}:`, error.message);

            if (attempt < MAX_RETRIES) {
                const delay = attempt * 2000;
                await new Promise(res => setTimeout(res, delay));
                return this.sendInvoiceToAGT(invoice, attempt + 1);
            } else {
                await this.logToDb(companyId, invoice, 'ERRO', error.message);
                return { state: 'ERRO', info: error.message };
            }
        }
    }

    /**
     * Grava o resultado da operação na tabela agt_logs
     */
    private static async logToDb(companyId: number, invoice: any, status: string, error?: string | null, response?: string) {
        try {
            await supabase.from('agt_logs').insert({
                company_id: companyId,
                invoice_id: invoice.id,
                invoice_number: invoice.invoice_number,
                status: status,
                error_message: error,
                response_xml: response
            });
        } catch (e) {
            console.error('[AGT] Falha ao gravar log no banco:', e);
        }
    }
}
