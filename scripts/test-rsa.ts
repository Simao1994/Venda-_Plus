import { generateAGTKeyPair, prepareSigningData, signAGTDocument, verifyAGTSignature, getHashControl } from '../src/lib/agt_rsa.ts';

/**
 * Test script for AGT RSA 2048 implementation.
 */
async function test() {
    console.log('--- AGT RSA 2048 TEST ---');

    // 1. Generate Key Pair
    console.log('1. Generating 2048-bit key pair...');
    const { privateKey, publicKey } = generateAGTKeyPair();
    console.log('✅ Key pair generated.');
    console.log('Public Key (First 50 chars):', publicKey.substring(0, 50) + '...');

    // 2. Prepare Data
    const date = '2026-03-22';
    const sysDate = '2026-03-22T16:45:00';
    const docNo = 'FAC-2026/001';
    const total = 1500.50;
    const prevHash = 'INITIAL-HASH-12345';

    const data = prepareSigningData(date, sysDate, docNo, total, prevHash);
    console.log('2. Data to sign:', data);

    // 3. Sign
    console.log('3. Signing data...');
    const signature = signAGTDocument(data, privateKey);
    console.log('✅ Signature generated (Base64).');
    console.log('Signature length:', signature.length); // Should be ~344 for 2048-bit
    console.log('Signature preview:', signature.substring(0, 40) + '...');

    // 4. Verify
    console.log('4. Verifying signature...');
    const isValid = verifyAGTSignature(data, signature, publicKey);
    console.log(isValid ? '✅ VERIFIED' : '❌ FAILED');

    // 5. HashControl
    const hashControl = getHashControl(signature);
    console.log('5. HashControl (First 4 chars):', hashControl);

    if (isValid && signature.length > 300) {
        console.log('\n--- TEST SUCCESSFUL ---');
    } else {
        console.error('\n--- TEST FAILED ---');
        process.exit(1);
    }
}

test().catch(err => {
    console.error('Test error:', err);
    process.exit(1);
});
