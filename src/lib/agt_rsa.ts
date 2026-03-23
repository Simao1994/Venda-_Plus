import crypto from 'crypto';

/**
 * AGT RSA Digital Signature Utilities - Angola
 * Consistent with AGT requirements for 2048-bit RSA signatures.
 */

export interface AGTKeyPair {
    privateKey: string;
    publicKey: string;
}

/**
 * Generates a persistent RSA 2048-bit key pair in PEM format.
 */
export function generateAGTKeyPair(): AGTKeyPair {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
        }
    });

    return {
        privateKey,
        publicKey
    };
}

/**
 * Prepares the canonical string for AGT signing.
 * Format: Date;SystemEntryDate;InvoiceNo;GrossTotal;PrevHash
 * 
 * @param date - Invoice date (YYYY-MM-DD)
 * @param systemEntryDate - System entry date (YYYY-MM-DDTHH:MM:SS)
 * @param invoiceNo - Invoice number (e.g., "FAC-2026/001")
 * @param grossTotal - Gross total of the invoice
 * @param prevHash - The complete signature (base64) of the previous document
 */
export function prepareSigningData(
    date: string,
    systemEntryDate: string,
    invoiceNo: string,
    grossTotal: number,
    prevHash: string = ''
): string {
    const formattedTotal = Number(grossTotal || 0).toFixed(2).replace(',', '.');
    return `${date};${systemEntryDate};${invoiceNo};${formattedTotal};${prevHash}`;
}

/**
 * Signs the provided data using an RSA-SHA256 digital signature.
 * 
 * @param data - The canonical string to sign
 * @param privateKey - RSA private key in PEM format
 * @returns The base64-encoded signature
 */
export function signAGTDocument(data: string, privateKey: string): string {
    const signer = crypto.createSign('RSA-SHA256');
    signer.update(data);
    signer.end();
    return signer.sign(privateKey, 'base64');
}

/**
 * Verifies an RSA-SHA256 signature against the data and public key.
 */
export function verifyAGTSignature(data: string, signature: string, publicKey: string): boolean {
    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(data);
    verifier.end();
    return verifier.verify(publicKey, signature, 'base64');
}

/**
 * Extracts the HashControl (first 4 characters of the previous signature).
 * Used in SAF-T (AOA) XML and display on documents.

 */
export function getHashControl(signature: string | null | undefined): string {
    if (!signature || signature.length < 4) return '0000';
    return signature.substring(0, 4);
}
