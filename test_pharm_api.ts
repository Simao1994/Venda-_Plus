
import jwt from 'jsonwebtoken';

const JWT_SECRET = "super-secret-erp-key"; // From server.ts

async function testApi() {
    // 1. Generate a mock token for company 1
    const token = jwt.sign({
        id: 1,
        company_id: 1,
        branch_id: 1,
        role: 'admin'
    }, JWT_SECRET);

    console.log('Testing /api/farmacia/movimentos...');
    try {
        const res = await fetch('http://localhost:5173/api/farmacia/movimentos', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        console.log('✅ /api/farmacia/movimentos: ', res.status, Array.isArray(data) ? 'Array' : typeof data);
    } catch (err: any) {
        console.log('❌ /api/farmacia/movimentos failed:', err.message);
    }

    console.log('Testing /api/farmacia/lotes...');
    try {
        const res = await fetch('http://localhost:5173/api/farmacia/lotes', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        console.log('✅ /api/farmacia/lotes: ', res.status, Array.isArray(data) ? 'Array' : typeof data);
    } catch (err: any) {
        console.log('❌ /api/farmacia/lotes failed:', err.message);
    }
}

testApi();
