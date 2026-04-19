const fs = require('fs');
const path = 'd:/Venda Plus/server.ts';
let content = fs.readFileSync(path, 'utf8');

// The GET /api/investments/investors route as seen in the last view_file
const target = `  app.get('/api/investments/investors', authenticate, async (req: any, res) => {
    try {
      let query = supabase.from('investidores').select('*');
      if (req.user?.company_id) {
        query = query.eq('company_id', req.user.company_id);
      }
      const { data, error } = await query;
      if (error) throw error;
      res.json(data || []);
    } catch (err: any) {`;

const replacement = `  app.get('/api/investments/investors', authenticate, async (req: any, res) => {
    try {
      const { data, error } = await supabase.from('investidores').select('*');
      if (error) throw error;
      res.json(data || []);
    } catch (err: any) {`;

// Normalize spaces for safer match
const normalize = (s) => s.replace(/\s+/g, ' ').trim();
const normalizedContent = normalize(content);
const normalizedTarget = normalize(target);

if (normalizedContent.indexOf(normalizedTarget) !== -1) {
    // Try to find the actual block with some flexibility
    const lines = content.split('\n');
    let found = false;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("app.get('/api/investments/investors'") && lines[i+1]?.includes("try {")) {
            // Found the start, now find the end (res.json(data || []);)
            let endLine = -1;
            for (let j = i; j < i + 15; j++) {
                if (lines[j]?.includes("res.json(data || []);")) {
                    endLine = j;
                    break;
                }
            }
            if (endLine !== -1) {
                lines.splice(i, endLine - i + 1, replacement);
                content = lines.join('\n');
                found = true;
                break;
            }
        }
    }
    if (found) {
        fs.writeFileSync(path, content, 'utf8');
        console.log('Successfully reverted company_id filter for investors GET route');
    } else {
        console.error('Target block not found via flexible search');
    }
} else {
    console.error('Target block not found via normalized search');
}
