import jwt from 'jsonwebtoken';

const token = jwt.sign(
    { id: 1, company_id: 1, role: 'admin', auth_id: 'test-user-id' },
    'super-secret-erp-key',
    { expiresIn: '1h' }
);

async function createSale() {
    const salePayload = {
        customer_id: null,
        items: [
            { product_id: 1, product_name: 'Test Product', quantity: 1, purchase_price: 10, sale_price: 20 }
        ],
        subtotal: 20,
        tax: 0,
        tax_total: 0,
        discount_total: 0,
        total: 20,
        amount_paid: 20,
        change: 0,
        payment_method: 'DINHEIRO',
        document_type: 'FR' // Fatura/Recibo
    };

    try {
        const res = await fetch('http://localhost:3000/api/sales', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(salePayload)
        });

        const data = await res.json();
        console.log('Status:', res.status);
        console.log('Response:', data);
    } catch (err) {
        console.error('Error:', err);
    }
}

createSale();
