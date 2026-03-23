/**
 * SAF-T (AOA) XML — Standard Audit File for Tax purposes - Angola

 * Tipos TypeScript alinhados com a estrutura oficial exigida pela AGT Angola
 * Referência: Portaria do Ministério das Finanças de Angola
 */

// ── PARÂMETROS DE GERAÇÃO ────────────────────────────────────────────────────

export interface SaftGenerationParams {
    company_id: number;
    fiscal_year: number;
    start_date: string; // YYYY-MM-DD
    end_date: string;   // YYYY-MM-DD
}

// ── HEADER ───────────────────────────────────────────────────────────────────

export interface SaftHeader {
    AuditFileVersion: string;       // "1.0" — versão do ficheiro SAF-T (AOA) XML

    CompanyID: string;              // NIF da empresa
    TaxRegistrationNumber: string;  // NIF (igual ao CompanyID em Angola)
    TaxAccountingBasis: string;     // "F" = Faturação
    CompanyName: string;            // Nome da empresa
    BusinessName?: string;          // Nome comercial
    CompanyAddress: {
        AddressDetail?: string;
        City?: string;
        PostalCode?: string;
        Country: string;              // "AO"
    };
    FiscalYear: number;             // Ano fiscal
    StartDate: string;              // YYYY-MM-DD
    EndDate: string;                // YYYY-MM-DD
    CurrencyCode: string;           // "AOA"
    DateCreated: string;            // YYYY-MM-DD
    TaxEntity: string;              // "Global" ou código de filial
    ProductCompanyTaxID: string;    // NIF do produtor do software
    SoftwareCertificateNumber: string; // Número de certificação AGT (ex: "0001/AGT/2026")
    GeneratedBy: string;            // "Venda Plus ERP"
}

// ── MASTER FILES ─────────────────────────────────────────────────────────────

export interface SaftCustomer {
    CustomerID: string;             // ID interno
    AccountID: string;              // Conta contabilística (ex: "21")
    CustomerTaxID: string;          // NIF do cliente
    CompanyName: string;            // Nome
    BillingAddress: {
        AddressDetail?: string;
        City?: string;
        PostalCode?: string;
        Country: string;              // "AO"
    };
    Telephone?: string;
    Email?: string;
    SelfBillingIndicator: 0 | 1;    // 0 = não, 1 = sim
}

export interface SaftProduct {
    ProductType: 'P' | 'S' | 'O' | 'E' | 'I'; // P=Produto, S=Serviço, O=Outro, E=Excisável, I=Isento
    ProductCode: string;
    ProductGroup?: string;
    ProductDescription: string;
    ProductNumberCode: string;      // código de barras ou código interno
    CustomsDetails?: {
        UNNumber?: string;
        CNCode?: string;
    };
}

export interface SaftTaxTableEntry {
    TaxType: 'IVA' | 'NS' | 'IS';  // IVA, NS=Não Sujeito, IS=Isento
    TaxCountryRegion: string;       // "AO"
    TaxCode: string;                // "NOR" = Normal, "INT" = Intermédio, "RED" = Reduzido, "ISE" = Isento
    Description: string;
    TaxPercentage: number;          // 14 para Angola taxa padrão
}

// ── SOURCE DOCUMENTS — SALES INVOICES ────────────────────────────────────────

export interface SaftInvoiceLine {
    LineNumber: number;
    ProductCode: string;
    ProductDescription: string;
    Quantity: number;
    UnitOfMeasure: string;
    UnitPrice: number;
    TaxPointDate: string;           // YYYY-MM-DD
    References?: { Reference: string }[];
    Description: string;
    DebitAmount?: number;
    CreditAmount?: number;
    Tax: {
        TaxType: string;
        TaxCountryRegion: string;
        TaxCode: string;
        TaxPercentage: number;
    };
    SettlementAmount?: number;
}

export interface SaftInvoice {
    InvoiceNo: string;              // Ex: "FAC-2026/001"
    ATCUD?: string;                 // Código único do documento (se existir)
    DocumentStatus: {
        InvoiceStatus: 'N' | 'A' | 'F' | 'R'; // N=Normal, A=Anulado, F=Faturado, R=Resumo
        InvoiceStatusDate: string;
        SourceID: string;             // Utilizador que emitiu
        SourceBilling: 'P' | 'I' | 'M'; // P=Programa, I=Integrado, M=Manual
    };
    Hash: string;                   // SHA-256 / RSA hash
    HashControl: string;            // Primeiros 4 chars do hash anterior
    Period: number;                 // Mês fiscal (1-12)
    InvoiceDate: string;            // YYYY-MM-DD
    InvoiceType: 'FT' | 'FR' | 'ND' | 'NC' | 'PP' | 'FS' | 'TV'; // tipos de documento
    SpecialRegimes: {
        SelfBillingIndicator: 0 | 1;
        CashVATSchemeIndicator: 0 | 1;
        ThirdPartiesBillingIndicator: 0 | 1;
    };
    SourceID: string;
    SystemEntryDate: string;        // YYYY-MM-DDTHH:MM:SS
    CustomerID: string;
    ShipTo?: {
        DeliveryDate?: string;
        Address?: { Country: string };
    };
    ShipFrom?: {
        Address?: { Country: string };
    };
    MovementEndTime?: string;
    MovementStartTime?: string;
    Line: SaftInvoiceLine[];
    DocumentTotals: {
        TaxPayable: number;
        NetTotal: number;
        GrossTotal: number;
        Settlement?: { SettlementAmount: number }[];
        Payment?: { PaymentMechanism: string; PaymentAmount: number }[];
    };
    WithholdingTax?: { WithholdingTaxType: string; WithholdingTaxAmount: number }[];
}

// ── SOURCE DOCUMENTS — PAYMENTS ──────────────────────────────────────────────

export interface SaftPaymentLine {
    LineNumber: number;
    SourceDocumentID: {
        OriginatingON: string;
        InvoiceDate: string;
    };
    DebitAmount?: number;
    CreditAmount?: number;
    Tax?: {
        TaxType: string;
        TaxCountryRegion: string;
        TaxCode: string;
        TaxPercentage: number;
    };
}

export interface SaftPayment {
    PaymentRefNo: string;           // Ex: "RE-2026/001"
    ATCUD?: string;
    Period: number;
    TransactionID?: string;
    TransactionDate: string;
    PaymentType: 'RC' | 'RG';      // RC=Recibo de Cliente, RG=Recibo Global
    Description?: string;
    SystemID?: string;
    DocumentStatus: {
        PaymentStatus: 'N' | 'A';
        PaymentStatusDate: string;
        SourceID: string;
        SourcePayment: 'P' | 'I' | 'M';
    };
    PaymentMethod: {
        PaymentMechanism: 'CC' | 'CD' | 'CH' | 'CO' | 'CS' | 'DE' | 'LC' | 'MB' | 'NU' | 'OU' | 'PR' | 'TB' | 'TR';
        PaymentAmount: number;
        PaymentDate: string;
    }[];
    SourceID: string;
    SystemEntryDate: string;
    CustomerID: string;
    Line: SaftPaymentLine[];
    DocumentTotals: {
        TaxPayable: number;
        NetTotal: number;
        GrossTotal: number;
        Settlement?: { SettlementAmount: number }[];
    };
    WithholdingTax?: { WithholdingTaxType: string; WithholdingTaxAmount: number }[];
}

// ── RESULT ────────────────────────────────────────────────────────────────────

export interface SaftGenerationResult {
    xml: string;
    filename: string;
    stats: {
        totalInvoices: number;
        totalPayments: number;
        totalCustomers: number;
        totalProducts: number;
        totalNetValue: number;
        totalTaxValue: number;
        totalGrossValue: number;
        generatedAt: string;
    };
}
