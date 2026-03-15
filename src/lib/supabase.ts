import { createClient } from '@supabase/supabase-js';

let supabaseUrl = '';
let supabaseKey = '';

// 1. Tentar ler do frontend (Vite)
try {
    // @ts-ignore
    supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    // @ts-ignore
    supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
} catch (error) {
    // Em Node (backend), import.meta.env vai atirar TypeError
}

// 2. Tentar ler do backend (Node.js)
if (!supabaseUrl && typeof process !== 'undefined' && process.env) {
    supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
}

if (!supabaseUrl || !supabaseKey) {
    console.error('⚠️ [AVISO] Missing Supabase environment variables (URL or Key).');
}

export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseKey || 'placeholder'
);
