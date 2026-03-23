import crypto from 'crypto';
import { agtConfig } from '../config/agt_config';

/**
 * Gera um Nonce aleatório para o cabeçalho WS-Security
 */
export function generateNonce(): string {
    return crypto.randomBytes(16).toString('base64');
}

/**
 * Obtém o timestamp ISO de criação
 */
export function getCreatedTimestamp(): string {
    return new Date().toISOString();
}

/**
 * Aplica Criptografia AES + Base64 na password original
 */
export function encryptPasswordAES(password: string, aesKey?: string): string {
    try {
        const algorithm = 'aes-256-cbc';
        const secret = aesKey || agtConfig.aes_secret_key;
        const key = Buffer.from(secret.slice(0, 32).padEnd(32, '0'));
        const iv = crypto.randomBytes(16);

        const cipher = crypto.createCipheriv(algorithm, key, iv);
        let encrypted = cipher.update(password, 'utf8', 'base64');
        encrypted += cipher.final('base64');

        const packet = iv.toString('hex') + ':' + encrypted;
        return Buffer.from(packet).toString('base64');
    } catch (e) {
        console.error('[AGT Crypto] Falha ao criptografar password:', e);
        return '';
    }
}
