
const fs = require('fs');
const content = fs.readFileSync('d:\\Venda Plus\\server.ts', 'utf8');
const lines = content.split('\n');
for (let i = 492; i < 508; i++) {
    console.log(`${i + 1}: ${JSON.stringify(lines[i])}`);
}
