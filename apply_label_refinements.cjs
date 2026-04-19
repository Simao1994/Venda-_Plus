const fs = require('fs');
const path = 'd:/Venda Plus/src/components/investments/InvestmentsModule.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Rename 'Património Atualizado Bancário' to 'RESULTADO'
content = content.replace(/Património Atualizado Bancário/g, 'RESULTADO');

// 2. Rename 'Património Líquido Final Contratado (Assets Yield Return)' to 'RESULTADO (Yield Return Consolidado)'
content = content.replace(/Património Líquido Final Contratado \(Assets Yield Return\)/g, 'RESULTADO (Yield Return Consolidado)');

// 3. Rename 'Juros Brutos' to 'Juros ({activeProject.regime})'
content = content.replace(/Juros Brutos/g, 'Juros ({activeProject.regime})');

// 4. Rename 'Dividendos Brutos' to 'Juros ({activeProject?.regime})'
content = content.replace(/Dividendos Brutos/g, 'Juros ({activeProject?.regime})');

fs.writeFileSync(path, content, 'utf8');
console.log('Applied terminology updates to dashboard and reports');
