/**
 * SAF-T (AOA) XML — Funções auxiliares

 * Escapamento XML, formatação de datas, mapeamento de tipos de pagamento
 */

/**
 * Escapa caracteres especiais XML
 */
export function escapeXml(value: any): string {
    if (value === undefined || value === null) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * Formata número com 2 casas decimais para o XML
 */
export function formatAmount(value: number | null | undefined): string {
    return Number(value || 0).toFixed(2);
}

/**
 * Formata data para YYYY-MM-DD
 */
export function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return new Date().toISOString().split('T')[0];
    try {
        return new Date(dateStr).toISOString().split('T')[0];
    } catch {
        return new Date().toISOString().split('T')[0];
    }
}

/**
 * Formata data/hora para YYYY-MM-DDTHH:MM:SS
 */
export function formatDateTime(dateStr: string | null | undefined): string {
    if (!dateStr) return new Date().toISOString().replace('Z', '').substring(0, 19);
    try {
        return new Date(dateStr).toISOString().replace('Z', '').substring(0, 19);
    } catch {
        return new Date().toISOString().replace('Z', '').substring(0, 19);
    }
}

/**
 * Mapeia o método de pagamento interno para o código SAF-T
 * CC=CartãoCrédito, CD=CartãoDébito, NU=Numerário, TB=Transferência
 */
export function mapPaymentMechanism(method: string): string {
    const map: Record<string, string> = {
        cash: 'NU',
        card: 'CC',
        debit_card: 'CD',
        credit: 'OU',    // Outro (crédito a prazo)
        transfer: 'TB',
        check: 'CH',
        mobile: 'OU',
    };
    return map[method] || 'OU';
}

/**
 * Determina o tipo de documento SAF-T a partir do invoice_number
 */
export function mapInvoiceType(invoiceNumber: string, isProForma: boolean, isCancelled: boolean): string {
    if (isCancelled) return 'NC'; // Nota de Crédito
    if (isProForma) return 'PP';  // Fatura Pro-Forma
    if (invoiceNumber?.startsWith('FR')) return 'FR'; // Fatura-Recibo
    if (invoiceNumber?.startsWith('FAC')) return 'FT'; // Fatura
    if (invoiceNumber?.startsWith('NC')) return 'NC';
    if (invoiceNumber?.startsWith('PRO')) return 'PP';
    return 'FT';
}

/**
 * Obtém o mês do período a partir de uma data
 */
export function getPeriod(dateStr: string): number {
    try {
        return new Date(dateStr).getMonth() + 1;
    } catch {
        return new Date().getMonth() + 1;
    }
}

/**
 * Gera o HashControl (primeiros 4 caracteres do hash anterior)
 * Conforme especificação AGT Angola
 */
export function buildHashControl(prevHash: string | null | undefined): string {
    if (!prevHash || prevHash.length < 4) return '0000';
    return prevHash.substring(0, 4);
}

/**
 * Normaliza NIF: se vazio, usa código de consumidor final
 */
export function normalizeTaxId(nif: string | null | undefined): string {
    if (!nif || nif.trim() === '') return 'Consumidor Final';
    return nif.trim();
}

/**
 * Wrap seguro de texto em tag XML
 */
export function tag(name: string, value: any, indent = 0): string {
    const spaces = '  '.repeat(indent);
    return `${spaces}<${name}>${escapeXml(value)}</${name}>\n`;
}

/**
 * Wrap de bloco XML (subestrutura)
 */
export function tagBlock(name: string, content: string, indent = 0): string {
    const spaces = '  '.repeat(indent);
    return `${spaces}<${name}>\n${content}${spaces}</${name}>\n`;
}
