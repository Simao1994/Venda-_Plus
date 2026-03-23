import { agtConfig } from '../config/agt_config';
import { generateNonce, getCreatedTimestamp, encryptPasswordAES } from '../utils/crypto_utils';

/**
 * Constrói o cabeçalho WS-Security (SOAP Header) exigido pela AGT
 */
export class AuthService {
    /**
     * Retorna a string XML do cabeçalho SOAP com UsernameToken e Password cifrada
     */
    static buildWsseHeader(username: string, password: string, aesKey?: string): string {
        const nonce = generateNonce();
        const created = getCreatedTimestamp();

        const encryptedPassword = encryptPasswordAES(password, aesKey);

        return `
        <soapenv:Header>
            <wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" 
                           xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">
                <wsse:UsernameToken wsu:Id="UsernameToken-1">
                    <wsse:Username>${username}</wsse:Username>
                    <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText">${encryptedPassword}</wsse:Password>
                    <wsse:Nonce EncodingType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary">${nonce}</wsse:Nonce>
                    <wsu:Created>${created}</wsu:Created>
                </wsse:UsernameToken>
            </wsse:Security>
        </soapenv:Header>
        `;
    }
}
