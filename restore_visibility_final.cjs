const fs = require('fs');
const path = 'd:/Venda Plus/server.ts';
let content = fs.readFileSync(path, 'utf8');

// 1. Remover filtro de company_id na rota /api/applications (GET)
const appGetRegex = /app\.get\('\/api\/applications',\s*authenticate,\s*async\s*\(req:\s*any,\s*res\)\s*=>\s*\{[\s\S]*?const\s*\{ data,\s*error \}\s*=\s*await\s*query;/;
const appGetFixed = `app.get('/api/applications', authenticate, async (req: any, res) => {
    try {
      const { data, error } = await supabase
        .from('investimentos')
        .select(\`
          *,
          investidores (nome)
        \`);`;

if (content.match(appGetRegex)) {
    content = content.replace(appGetRegex, appGetFixed);
}

// 2. Remover filtro de company_id na rota /api/investments/results (GET)
const resGetRegex = /app\.get\('\/api\/investments\/results',\s*authenticate,\s*async\s*\(req:\s*any,\s*res\)\s*=>\s*\{[\s\S]*?\.eq\('company_id',\s*req\.user\.company_id\);/;
const resGetFixed = `app.get('/api/investments/results', authenticate, async (req: any, res) => {
    try {
      const { data, error } = await supabase
        .from('resultados_finais_investimentos')
        .select(\`
          *,
          investimentos (*),
          investidores (nome)
        \`);`;

if (content.match(resGetRegex)) {
    content = content.replace(resGetRegex, resGetFixed);
}

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully removed all restrictive company_id filters from GET routes');
