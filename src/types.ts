
export type CandidaturaStatus = 'pendente' | 'aprovado' | 'rejeitado';
export type EscolaridadeTipo = 'Ensino Primário' | 'Ensino Médio' | 'Licenciatura' | 'Mestrado' | 'Doutoramento';

export type UserRole =
  | 'admin'
  | 'director_arena'
  | 'director_agro'
  | 'director_express'
  | 'director_realestate'
  | 'director_accounting'
  | 'director_treasury'
  | 'director_maintenance'
  | 'manager_inventory'
  | 'manager_sales'
  | 'director_hr'
  | 'director_finance'
  | 'bibliotecario'
  | 'operario'
  | 'vendedor'
  | 'saas_admin'
  | 'master'
  | 'cashier'
  | 'manager';

export interface User {
  id: string;
  nome: string;
  role: UserRole;
  email: string;
  company_id: number;
}

export interface LancamentoContabil {
  id: string;
  data: string;
  periodo_id?: string;
  mes_referencia?: string;
  ano_referencia?: number;
  descricao: string;
  company_id: number;
  usuario_id: string;
  usuario_name?: string;
  status: 'Postado' | 'Pendente' | 'Anulado';
  tipo_transacao: 'Manual' | 'Folha' | 'Venda' | 'Compra' | 'Ajuste';
  itens: LancamentoItem[];
}

export interface LancamentoItem {
  id: string;
  conta_codigo: string;
  conta_nome: string;
  tipo: 'D' | 'C';
  valor: number;
}

export interface FolhaPagamento {
  id: string;
  funcionario_id: string;
  funcionario_nome: string;
  mes_referencia: string;
  salario_base: number;
  subsidios: number;
  inss_trabalhador: number;
  inss_empresa: number;
  irt: number;
  seguro_trabalhador: number;
  salario_liquido: number;
  status: 'Pendente' | 'Processado' | 'Pago';
}

export interface ObrigacaoFiscal {
  id: string;
  titulo: string;
  data_vencimento: string;
  valor: number;
  status: 'Pendente' | 'Pago' | 'Atrasado';
}

export interface EmpresaAfiliada {
  id: string;
  nome: string;
  nif: string;
  setor: string;
  localizacao: string;
  responsavel: string;
}

export interface Funcionario {
  id: string;
  nome: string;
  funcao: string;
  salario_base: number;
  company_id: number;
}

export interface DocumentoDigital {
  id: string;
  nome: string;
  url: string;
}

export interface MovimentoBancario {
  id: string;
  data: string;
  valor: number;
}

export interface PlanoConta {
  id: string;
  codigo: string;
  nome: string;
  tipo: 'Ativo' | 'Passivo' | 'Capital' | 'Receita' | 'Despesa';
  natureza: 'Devedora' | 'Credora';
  nivel: number;
  pai_id?: string;
  e_sintetica?: boolean;
  aceita_lancamentos?: boolean;
  e_analitica?: boolean;
}

export interface PeriodoContabil {
  id: string;
  ano: number;
  mes: number;
  status: 'Aberto' | 'Fechado';
  company_id: number;
}

export interface BlogPost {
  id: string;
  titulo: string;
  categoria: string;
  conteudo: string;
  autor: string;
  data: string;
  imagem_url: string;
  video_url?: string;
  galeria_urls?: string[];
  tipo: 'artigo' | 'video' | 'galeria' | 'momento';
  is_publico: boolean;
  visualizacoes: number;
  company_id: number;
}

export interface RhVaga {
  id: string;
  titulo: string;
  descricao: string;
  requisitos?: string;
  responsabilidades?: string;
  localizacao?: string;
  tipo_contrato: string;
  nivel_experiencia: string;
  salario: string;
  status: 'ativa' | 'pausada' | 'encerrada';
  quantidade: number;
  data_publicacao: string;
  data_encerramento?: string;
  company_id: number;
  criado_em: string;
}

export interface RhCandidaturaPublica {
  id: string;
  vaga_id: string;
  nome: string;
  email: string;
  telefone: string;
  linkedin?: string;
  portfolio?: string;
  cv_url: string;
  mensagem?: string;
  status: 'pendente' | 'em_analise' | 'entrevista' | 'aprovado' | 'rejeitado';
  data_envio: string;
  company_id: number;
}

export interface ContaBancariaHR {
  id: string;
  funcionario_id: string;
  nome_banco: string;
  numero_conta: string;
  iban?: string;
  swift_bic?: string;
  tipo_conta?: string;
  moeda?: string;
  titular_conta?: string;
  pais_banco?: string;
  codigo_banco?: string;
  codigo_agencia?: string;
  principal: boolean;
  status: 'ativo' | 'inativo';
  observacoes?: string;
  company_id: number;
  criado_em: string;
  atualizado_em: string;
}

export interface ReciboPagamentoHR {
  id: string;
  funcionario_id: string;
  mes: number;
  ano: number;
  bruto: number;
  liquido: number;
  company_id: number;
  created_at: string;
}

export interface AuditoriaEvento {
  id: string;
  usuario_id: string;
  acao: string;
  modulo: string;
  detalhes: string;
  data: string;
  company_id: number;
}

export interface ConciliacaoBancaria {
  id: string;
  data: string;
  valor: number;
  descricao: string;
  status: 'conciliado' | 'pendente';
  company_id: number;
}
