export const agtConfig = {
    // Configurações base da AGT
    nif_empresa: process.env.AGT_NIF || '000000000',
    username: process.env.AGT_USERNAME || '000000000/User',
    password: process.env.AGT_PASSWORD || 'sua_senha_aqui',

    // URL do ambiente (produção vs testes)
    endpoint_soap: process.env.AGT_SOAP_URL || 'https://servicos.minfin.gov.ao/ws/faturacao',

    // Definir se deve enviar faturas ao finalizar automaticamente
    auto_send: process.env.AGT_AUTO_SEND === 'true' || false,

    // Chave provisória para simular a criptografia AES exigida
    aes_secret_key: process.env.AGT_AES_KEY || 'SUACHAVESECRETA32CARACTERESAAAAA'
};
