const fs = require('fs');

const path = 'd:/Venda Plus/src/components/investments/InvestmentsModule.tsx';
let content = fs.readFileSync(path, 'utf8');

const regexToReplace = /morada: data\.morada, naturalidade: data\.naturalidade, provincia: data\.provincia,\s*nacionalidade: data\.nacionalidade, data_nascimento: data\.data_nascimento,\s*data_emissao: data\.data_emissao, data_validade: data\.data_validade,/;

const replacement = 'morada: data.morada, data_nascimento: data.data_nascimento,';

const newContent = content.replace(regexToReplace, replacement);

fs.writeFileSync(path, newContent, 'utf8');
console.log('Fixed API POST params');
