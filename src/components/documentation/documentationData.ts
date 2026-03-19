export interface DocumentationItem {
    id: string;
    title: string;
    category: string;
    content: string;
    trainingSteps?: string[];
    keywords: string[];
    icon?: string;
}

export const DOCUMENTATION_DATA: DocumentationItem[] = [
    {
        id: 'intro',
        title: 'Introdução ao Sistema',
        category: 'Introdução',
        content: `
      <h2>O que é o sistema?</h2>
      <p>O <strong>VENDA PLUS</strong> é um ecossistema ERP avançado, desenhado para centralizar a gestão empresarial de forma intuitiva, segura e eficiente. Focado no mercado angolano, cumpre rigorosamente as normas da AGT.</p>
      
      <h2>Objetivo</h2>
      <p>Providenciar uma plataforma única para controlo de stock, faturação, recursos humanos, contabilidade e gestão farmacêutica, permitindo que gestores tomem decisões baseadas em dados reais.</p>
      
      <h2>Objetivo</h2>
      <p>O PVG providencia uma plataforma única para controlo de stock, faturação, recursos humanos, contabilidade e gestão farmacêutica, permitindo que gestores tomem decisões baseadas em dados reais.</p>
      
      <h2>Benefícios</h2>
      <ul>
        <li>Interface Premium e Intuitiva</li>
        <li>Conformidade com AGT (SAF-T)</li>
        <li>Gestão Multiempresa</li>
        <li>Acesso Mobile e Desktop</li>
        <li>Integração Contabilística Automática</li>
      </ul>
      
      <h2>Estrutura Geral</h2>
      <p>O sistema divide-se em módulos especializados (Vendas, Farmácia, RH, Contabilidade) que comunicam entre si em tempo real.</p>
    `,
        trainingSteps: [
            'Faça o login com as suas credenciais corporativas.',
            'Explore o Dashboard principal para ver os indicadores de desempenho.',
            'Navegue entre os módulos através da barra lateral esquerda.'
        ],
        keywords: ['introdução', 'sobre', 'benefícios', 'objetivo']
    },
    {
        id: 'users',
        title: 'Gestão de Utilizadores',
        category: 'Utilizadores',
        content: `
      <h2>Criar Utilizadores</h2>
      <p>No módulo de Utilizadores, Administradores podem criar novas contas, definir emails corporativos e palavras-passe temporárias.</p>
      
      <h2>Níveis de Acesso</h2>
      <p>O sistema utiliza o modelo RBAC (Role Based Access Control):</p>
      <ul>
        <li><strong>MASTER:</strong> Acesso total ao SaaS e gestão de empresas.</li>
        <li><strong>ADMIN:</strong> Acesso total à empresa específica.</li>
        <li><strong>GERENTE:</strong> Acesso a relatórios e operações, sem configurações globais.</li>
        <li><strong>CAIXA:</strong> Acesso restrito ao POS e vendas.</li>
      </ul>
      
      <h2>Segurança</h2>
      <p>Todas as sessões são validadas via JWT. Recomenda-se a alteração periódica de palavras-passe.</p>
    `,
        trainingSteps: [
            'Vá ao menu "Utilizadores".',
            'Clique em "Novo Utilizador".',
            'Preencha os dados e atribua um "Role" (Papel).',
            'Salve e partilhe os acessos com o funcionário.'
        ],
        keywords: ['utilizadores', 'acesso', 'segurança', 'admin', 'permissões']
    },
    {
        id: 'sales',
        title: 'Módulo de Vendas',
        category: 'Vendas',
        content: `
      <h2>Criar Cliente</h2>
      <p>Antes de uma venda, pode registar o cliente com NIF para emissão de faturas personalizadas.</p>
      
      <h2>Registar Venda</h2>
      <p>Selecione os produtos, aplique descontos se necessário, e confirme o método de pagamento.</p>
      
      <h2>Histórico</h2>
      <p>Todas as vendas ficam registadas para consulta posterior e re-impressão de documentos.</p>
    `,
        trainingSteps: [
            'Aceda ao módulo de "Vendas".',
            'Selecione ou crie um novo cliente.',
            'Adicione itens ao carrinho e clique em "Finalizar".'
        ],
        keywords: ['vendas', 'clientes', 'registar', 'histórico']
    },
    {
        id: 'facturacao',
        title: 'Facturação (AGT)',
        category: 'Facturação',
        content: `
      <h2>Emissão de Factura</h2>
      <p>O sistema gera documentos fiscais numerados sequencialmente conforme as regras da AGT.</p>
      
      <h2>Regras Fiscais</h2>
      <p>O IVA é aplicado automaticamente (padrão 14%) dependendo da configuração da empresa.</p>
      
      <h2>SAF-T Explicado</h2>
      <p>O ficheiro SAF-T AO é o Standard Audit File for Tax Purposes para Angola. Pode exportar este ficheiro mensalmente nas configurações.</p>
      
      <h2>Tipos de Documentos</h2>
      <ul>
        <li><strong>FAC:</strong> Factura</li>
        <li><strong>FR:</strong> Factura/Recibo</li>
        <li><strong>PRO:</strong> Factura Pro-forma</li>
        <li><strong>NC:</strong> Nota de Crédito</li>
      </ul>
    `,
        trainingSteps: [
            'Ao finalizar uma venda, selecione o tipo de documento desejado.',
            'Garanta que os dados do cliente (NIF) estão correctos para documentos nominais.',
            'O sistema assina digitalmente o documento após a emissão.'
        ],
        keywords: ['facturação', 'agt', 'saf-t', 'iva', 'fiscal', 'impostos']
    },
    {
        id: 'pos',
        title: 'Terminal de Vendas (POS)',
        category: 'POS',
        content: `
      <h2>Interface de Vendas Rápidas</h2>
      <p>O POS foi desenhado para ecrãs tácteis e operações rápidas em balcão.</p>
      
      <h2>Impressão Térmica</h2>
      <p>Suporta talões de 80mm e 58mm diretamente do navegador.</p>
      
      <h2>Fecho de Caixa</h2>
      <p>Ao final do turno, o sistema gera um resumo de entradas em dinheiro, multicaixa e outras formas de pagamento.</p>
    `,
        trainingSteps: [
            'Abra o POS clicando no ícone de carrinho.',
            'Use a pesquisa ou categorias para encontrar produtos rapidamente.',
            'Clique em "Pagar" para abrir o modal de finalização.'
        ],
        keywords: ['pos', 'terminal', 'caixa', 'balcão', 'impressão', 'térmica']
    },
    {
        id: 'contabilidade',
        title: 'Módulo de Contabilidade',
        category: 'Contabilidade',
        content: `
      <h2>Integração Automática</h2>
      <p>Toda venda gera automaticamente um lançamento contabilístico nos diários correspondentes.</p>
      
      <h2>Plano de Contas</h2>
      <p>Baseado no PGC (Plano Geral de Contabilidade) de Angola.</p>
      
      <h2>Relatórios Contabilísticos</h2>
      <ul>
        <li><strong>Balancete:</strong> Verificação de débitos e créditos.</li>
        <li><strong>Demonstração de Resultados:</strong> Cálculo de lucro ou prejuízo do período.</li>
        <li><strong>Fluxo de Caixa:</strong> Entradas e saídas de liquidez.</li>
      </ul>
      
      <h2>Regras de Ouro</h2>
      <p>O sistema impede a eliminação de registos faturados para manter a integridade contabilística perante a AGT.</p>
    `,
        trainingSteps: [
            'Aceda ao módulo de "Contabilidade".',
            'Visualize os lançamentos automáticos vindos das vendas.',
            'Gere o Balancete para conferência mensal.'
        ],
        keywords: ['contabilidade', 'pvg', 'balancete', 'resultados', 'caixa', 'lançamentos']
    },
    {
        id: 'rh',
        title: 'Recursos Humanos (RH)',
        category: 'RH',
        content: `
      <h2>Cadastro de Funcionários</h2>
      <p>Registe dados pessoais, habilitações literárias e tipos de contrato.</p>
      
      <h2>Folha Salarial</h2>
      <p>O processamento inclui Salário Base, Subsídios (Trans./Alim.) e descontos obrigatórios.</p>
      
      <h2>Descontos (Angola)</h2>
      <ul>
        <li><strong>INSS (Trabalhador):</strong> 3%</li>
        <li><strong>INSS (Empresa):</strong> 8%</li>
        <li><strong>IRT:</strong> Calculado conforme a tabela progressiva oficial.</li>
        <li><strong>Honorários (Prestadores):</strong> 6.5% de retenção na fonte.</li>
      </ul>
      
      <h2>Processamento Automático</h2>
      <p>Emita todos os recibos de ordenado com um único clique no final do mês.</p>
    `,
        trainingSteps: [
            'Cadastre os funcionários em RH -> Funcionários.',
            'Configure os salários e subsídios no perfil.',
            'Vá a "Processamento Salarial" no final do mês e clique em "Gerar Folha".'
        ],
        keywords: ['rh', 'funcionários', 'salários', 'inss', 'irt', 'recibos']
    },
    {
        id: 'farmacia',
        title: 'Módulo de Farmácia',
        category: 'Farmácia',
        content: `
      <h2>Cadastro de Medicamentos</h2>
      <p>Inclui campos para Princípio Activo, Forma Galénica e Dosagem.</p>
      
      <h2>Controlo de Stock por Lote</h2>
      <p>Crucial para medicamentos: o sistema gere quantidades por lotes individuais e datas de validade.</p>
      
      <h2>Alertas de Expiração</h2>
      <p>O sistema destaca visualmente produtos próximos do fim da validade e impede a venda de expirados.</p>
      
      <h2>Venda de Medicamentos</h2>
      <p>Interface adaptada para leitura de códigos de barras de fármacos.</p>
    `,
        trainingSteps: [
            'Cadastre o medicamento indicando o lote e validade.',
            'Configure alertas de "Stock Baixo" no perfil do produto.',
            'Realize as vendas no POS de Farmácia.'
        ],
        keywords: ['farmácia', 'medicamentos', 'lote', 'validade', 'expiração', 'fármacos']
    },
    {
        id: 'relatorios',
        title: 'Relatórios do Sistema',
        category: 'Relatórios',
        content: `
      <h2>Relatórios Financeiros</h2>
      <p>Extração de mapas de vendas, margem de lucro e impostos por pagar.</p>
      
      <h2>Relatórios de Farmácia</h2>
      <p>Listagem de produtos expirados, movimentação de lotes e inventário.</p>
      
      <h2>Relatórios de RH</h2>
      <p>Folhas de férias e resumos de pagamentos mensais.</p>
    `,
        trainingSteps: [
            'Aceda ao menu de Relatórios.',
            'Selecione o período (De/Até) desejado.',
            'Escolha o formato (PDF, Excel ou Impressão Directa).'
        ],
        keywords: ['relatórios', 'estatísticas', 'finanças', 'dashboard']
    },
    {
        id: 'configuracoes',
        title: 'Configurações Gerais',
        category: 'Configurações',
        content: `
      <h2>Dados da Empresa</h2>
      <p>Atualize NIF, Morada e Logotipo que aparecerá em todos os documentos.</p>
      
      <h2>Configuração de Impostos</h2>
      <p>Defina as taxas de IVA padrão e isenções quando aplicável.</p>
      
      <h2>Preferências</h2>
      <p>Ajuste moedas, idiomas e notificações do sistema.</p>
    `,
        trainingSteps: [
            'Vá a "Configurações" na barra lateral.',
            'Verifique se os dados fiscais estão completos.',
            'Personalize o logotipo para faturas profissionais.'
        ],
        keywords: ['configurações', 'definições', 'empresa', 'nif', 'logo']
    },
    {
        id: 'faq',
        title: 'FAQ - Perguntas Frequentes',
        category: 'FAQ',
        content: `
      <h3>Como exportar o SAF-T?</h3>
      <p>Vá a Configurações -> Estado do Sistema -> Exportar SAF-T AO.</p>
      
      <h3>O sistema funciona offline?</h3>
      <p>O VENDA PLUS é cloud-based para garantir sincronização multiempresa, mas o POS tem protecção básica para oscilações de rede.</p>
      
      <h3>Esqueci a minha palavra-passe. E agora?</h3>
      <p>Solicite ao administrador a redefinição da sua conta no módulo de Utilizadores.</p>
    `,
        trainingSteps: [
            'Consulte a FAQ antes de abrir um ticket de suporte.',
            'Use a pesquisa para encontrar respostas rápidas.'
        ],
        keywords: ['faq', 'ajuda', 'suporte', 'dúvidas', 'saf-t', 'login']
    }
];
