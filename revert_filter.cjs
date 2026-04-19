const fs = require('fs');
const path = 'd:/Venda Plus/server.ts';
let content = fs.readFileSync(path, 'utf8');

// 1. Revert investments/investors GET route filter
const investorsGetOriginal = `  app.get('/api/investments/investors', authenticate, async (req: any, res) => {
    try {
      let query = supabase.from('investidores').select('*');
      if (req.user?.company_id) {
        query = query.eq('company_id', req.user.company_id);
      }
      const { data, error } = await query;
      if (error) throw error;
      res.json(data || []);
    } catch (err: any) {`;

const investorsGetFixed = `  app.get('/api/investments/investors', authenticate, async (req: any, res) => {
    try {
      const { data, error } = await supabase.from('investidores').select('*');
      if (error) throw error;
      res.json(data || []);
    } catch (err: any) {`;

if (content.indexOf(investorsGetOriginal.trim()) !== -1) {
    content = content.replace(investorsGetOriginal.trim(), investorsGetFixed.trim());
}

// 2. Revert applications GET route filter (if it was there before, but let's check)
// Actually, let's only touch what I added.
// I added the filter to /api/investments/investors.

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully reverted company_id filter for investors GET route');
