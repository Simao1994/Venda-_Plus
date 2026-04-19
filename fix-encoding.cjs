const fs = require('fs');
let c = fs.readFileSync('server.ts', 'utf8');

c = c.replace(/ðŸš€/g, '[START]')
     .replace(/ðŸ“Š/g, '[DIAGNOSTIC]')
     .replace(/âœ…/g, '[OK]')
     .replace(/â Œ/g, '[FAIL]')
     .replace(/âš ï¸ /g, '[WARN] ')
     .replace(/âš ï¸/g, '[WARN]')
     .replace(/Ã©/g, 'é')
     .replace(/Ã£/g, 'ã')
     .replace(/Ã§/g, 'ç')
     .replace(/Ãµ/g, 'õ')
     .replace(/Ã­/g, 'í')
     .replace(/Ã¡/g, 'á')
     .replace(/Ã¢/g, 'â')
     .replace(/Ã³/g, 'ó')
     .replace(/Ãª/g, 'ê')
     .replace(/Âº/g, 'º')
     .replace(/Ã/g, 'í');

fs.writeFileSync('server.ts', c, 'utf8');
console.log('Encoding fixed.');
