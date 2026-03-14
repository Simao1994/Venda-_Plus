import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('--- Database Check ---');
    console.log('URL:', supabaseUrl);

    const { data: users, error } = await supabase
        .from('users')
        .select('email, password, role')
        .eq('email', 'simaopambo94@gmail.com');

    if (error) {
        console.error('❌ Error fetching user:', error.message);
        return;
    }

    if (!users || users.length === 0) {
        console.error('❌ User simaopambo94@gmail.com NOT FOUND in database.');
        console.log('Note: Please ensure you ran the SQL in supabase_schema.sql in the Dashboard.');
        return;
    }

    const user = users[0];
    console.log('✅ User found. Role:', user.role);

    const matches = bcrypt.compareSync('leonora1994', user.password);
    console.log(matches ? '✅ Password matches "leonora1994"' : '❌ Password DOES NOT match');
}

check();
