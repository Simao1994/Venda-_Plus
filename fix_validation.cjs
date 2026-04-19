const fs = require('fs');
const path = 'd:/Venda Plus/src/components/investments/InvestmentsModule.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
    `<form onSubmit={handleUnifiedRegistration}`,
    `<form noValidate onSubmit={handleUnifiedRegistration}`
);

const searchStr = `if (!data.nome || String(data.nome).trim() === '') {
          alert('Por favor, preencha o nome do investidor');
          return;
        }`;

const replaceStr = `if (!data.nome || String(data.nome).trim() === '') {
          alert('Por favor, preencha o nome do investidor');
          setModalTab('perfil');
          return;
        }
        if (!data.nif || !data.data_nascimento || !data.telefone || !data.password) {
          alert('Por favor, preencha os campos obrigatórios de identidade (NIF, Nascimento, Telefone e Senha).');
          setModalTab('perfil');
          return;
        }`;

content = content.replace(searchStr, replaceStr);

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed validation logic');
