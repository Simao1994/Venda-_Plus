import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react({
            // Usar SWC para transpilação ultra-rápida (10-20x mais rápido que Babel)
            babel: undefined,
        }),
        tailwindcss(),
    ],
    server: {
        port: 3000,
        strictPort: true,
        hmr: {
            overlay: true,
        },
        // Pré-bundle de todas as dependências pesadas para HMR instantâneo
        warmup: {
            clientFiles: [
                './src/components/accounting/Accounting.tsx',
                './src/App.tsx',
                './src/components/Sales.tsx',
            ],
        },
    },
    optimizeDeps: {
        // Forçar pré-bundle das libs mais pesadas para carregamento instantâneo
        include: [
            'react',
            'react-dom',
            'react-dom/client',
            'lucide-react',
            'recharts',
            'react-to-print',
            '@supabase/supabase-js',
        ],
        force: false, // só re-bundle se houver mudanças
    },
    build: {
        rollupOptions: {
            output: {
                // Separar vendor chunks para melhor cache
                manualChunks: {
                    'react-vendor': ['react', 'react-dom'],
                    'charts': ['recharts'],
                    'icons': ['lucide-react'],
                },
            },
        },
        // Reduzir threshold de aviso de chunk size
        chunkSizeWarningLimit: 1500,
    },
});
