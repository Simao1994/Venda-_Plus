const fs = require('fs');
const path = require('path');

const targetFile = 'd:/Venda Plus/src/components/investments/InvestmentsModule.tsx';

let content = fs.readFileSync(targetFile, 'utf8');

const replacements = {
  'IDENTIFICAÃ‡ÃƒO': 'IDENTIFICAÇÃO',
  'COORDENADAS BANCÃ RIAS': 'COORDENADAS BANCÁRIAS',
  'COORDENADAS BANCÁ RIAS': 'COORDENADAS BANCÁRIAS',
  'BancÃ¡rio': 'Bancário',
  'bancÃ¡rio': 'bancário',
  'BancÃ¡ria': 'Bancária',
  'bancÃ¡ria': 'bancária',
  'InstituiÃ§Ã£o': 'Instituição',
  'EmissÃ£o': 'Emissão',
  'emissÃ£o': 'emissão',
  'ReferÃªncia': 'Referência',
  'referÃªncia': 'referência',
  'Montante BancÃ¡rio': 'Montante Bancário',
  'MÃ­nimo': 'Mínimo',
  'mÃ­nimo': 'mínimo',
  'seguranÃ§a': 'segurança',
  'bÃ¡sica': 'básica',
  'AcadÃ©mico': 'Académico',
  'acadÃ©mico': 'académico',
  'RelaÃ§Ãµes': 'Relações',
  'EspecializaÃ§Ã£o': 'Especialização',
  'GestÃ£o': 'Gestão',
  'InformÃ¡tica': 'Informática',
  'MÃ©dio': 'Médio',
  'PrimÃ¡rio': 'Primário',
  'SecundÃ¡rio': 'Secundário',
  'ViÃºvo': 'Viúvo',
  'ProvÃ­ncia': 'Província',
  'BiÃ©': 'Bié',
  'HuÃ­la': 'Huíla',
  'UÃ­ge': 'Uíge',
  'AplicaÃ§Ã£o': 'Aplicação',
  'aplicaÃ§Ã£o': 'aplicação',
  'NÂº': 'Nº',
  'nÂº': 'nº',
  'EstratÃ©gia': 'Estratégia',
  'estratÃ©gia': 'estratégia',
  'TÃ­tulo': 'Título',
  'tÃ­tulo': 'título',
  'DenominaÃ§Ã£o': 'Denominação',
  'SimulaÃ§Ã£o': 'Simulação',
  'simulaÃ§Ã£o': 'simulação',
  'cÃ¡lculos': 'cálculos',
  'CÃ¡lculos': 'Cálculos',
  'cÃ¡lculo': 'cálculo',
  'CÃ¡lculo': 'Cálculo',
  'dÃ­gitos': 'dígitos',
  'comeÃ§ar': 'começar',
  'nÃ£o': 'não',
  'NÃ£o': 'Não',
  'ActivaÃ§Ã£o': 'Activação',
  'VÃ¡lido': 'Válido', // for completeness
  'vÃ¡lido': 'válido',
  'AtravÃ©s': 'Através',
  'atravÃ©s': 'através',
  'AvaliÃ§Ã£o': 'Avaliação',
  'AÃ§Ãµes': 'Ações',
  'aÃ§Ãµes': 'ações',
  'Ã¡': 'á',
  'Ã¢': 'â',
  'Ã£': 'ã',
  'Ã©': 'é',
  'Ãª': 'ê',
  'Ã­': 'í', 
  'Ã³': 'ó',
  'Ã´': 'ô',
  'Ãµ': 'õ',
  'Ãº': 'ú',
  'Ã§': 'ç',
  'Ã‡': 'Ç',
  'Ãƒ': 'Ã',
  'Ã‰': 'É',
  'ÃŠ': 'Ê',
  'Ã': 'Í',
  'Ã“': 'Ó',
  'Ã”': 'Ô',
  'Ã•': 'Õ',
  'Ãš': 'Ú',
  'Ã€': 'À'
};

// Apply specialized replacements first, then general characters
for (const [bad, good] of Object.entries(replacements)) {
  // Use global replacement instead of replaceAll to be safe on all Node versions
  content = content.replace(new RegExp(bad, 'g'), good);
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Fixed encodings in file.');
