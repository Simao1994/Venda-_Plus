
import React from 'react';
import {
  LayoutDashboard, Truck, Users, Wallet, Package, BookOpen, Wrench, ShieldCheck,
  LogOut, Bell, Search, Plus, FileText, Download, Trash2, Edit, Eye, Settings,
  Layers, Share2, Home, Inbox, Handshake, Building2, Newspaper, Image as ImageIcon,
  Factory, Scale, Calculator, PieChart as PieChartIcon, Sprout, Key, ClipboardList,
  UserPlus, Gamepad2, Files, CreditCard, Video, ShoppingCart
} from 'lucide-react';
import { UserRole } from './types';

let dynamicRoles: Record<string, string[]> = {};

export const setDynamicRoles = (roles: Record<string, string[]>) => {
  dynamicRoles = roles;
};

export { LogOut, Bell, Search };

export const COLORS = {
  primary: 'bg-yellow-500',
  primaryHover: 'hover:bg-yellow-600',
  secondary: 'bg-zinc-900',
  sidebar: 'bg-zinc-800',
  card: 'bg-white',
  textMain: 'text-zinc-900',
  textLight: 'text-zinc-100',
  accent: 'text-yellow-500'
};

export const MENU_ITEMS = [
  { id: 'home', label: 'Home Corporativo', icon: <Home size={20} />, path: '/' },
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
  { id: 'vendas', label: 'Vendas & POS', icon: <ShoppingCart size={20} />, path: '/vendas' },
  { id: 'arena_admin', label: 'Arena Gamer', icon: <Gamepad2 size={20} />, path: '/arena/admin' },
  { id: 'candidaturas', label: 'Candidatura Online', icon: <UserPlus size={20} />, path: '/recrutamento' },
  { id: 'solicitacoes', label: 'Solicitações', icon: <Inbox size={20} />, path: '/solicitacoes' },
  { id: 'galeria', label: 'Galeria & CEO', icon: <ImageIcon size={20} />, path: '/galeria' },
  { id: 'galeria_corp', label: 'Galeria Corporativa', icon: <ImageIcon size={20} />, path: '/dashboard/galeria' },
  { id: 'biblioteca', label: 'Biblioteca', icon: <BookOpen size={20} />, path: '/dashboard/biblioteca' },
  { id: 'agro', label: 'Amazing Agro', icon: <Sprout size={20} />, path: '/agro' },
  { id: 'imobiliario', label: 'Amazing Imobiliário', icon: <Building2 size={20} />, path: '/imobiliario' },
  { id: 'tesouraria', label: 'Tesouraria', icon: <PieChartIcon size={20} />, path: '/tesouraria' },
  { id: 'transportes', label: 'Amazing Express', icon: <Truck size={20} />, path: '/transportes' },
  { id: 'manutencao', label: 'Manutenção', icon: <Wrench size={20} />, path: '/manutencao' },
  { id: 'inventario', label: 'Inventário & Stock', icon: <Package size={20} />, path: '/inventario' },
  { id: 'live_streaming', label: 'Transmissões Ao Vivo', icon: <Video size={20} />, path: '/dashboard/transmissoes' },
  { id: 'rh', label: 'Recursos Humanos', icon: <Users size={20} />, path: '/rh' },
  { id: 'financeiro', label: 'Finanças', icon: <Wallet size={20} />, path: '/financeiro' },
  { id: 'contabilidade', label: 'Amazing ContábilExpert', icon: <Scale size={20} />, path: '/contabilidade' },
  { id: 'auditoria', label: 'Auditoria & Logs', icon: <ShieldCheck size={20} />, path: '/auditoria' },
  { id: 'blog', label: 'Blog & Notícias', icon: <Newspaper size={20} />, path: '/blog' },
  { id: 'configuracoes', label: 'Configurações', icon: <Settings size={20} />, path: '/configuracoes' },
  { id: 'parceiros', label: 'Base de Parceiros', icon: <Handshake size={20} />, path: '/parceiros' },
  { id: 'assinatura', label: 'Gestão de Assinatura', icon: <CreditCard size={20} />, path: '/configuracoes/assinatura' },
  { id: 'fornecedores', label: 'Gestão de Fornecedores', icon: <Handshake size={20} />, path: '/fornecedores' },
  { id: 'empresas', label: 'Unidades do Grupo', icon: <Building2 size={20} />, path: '/empresas' },
  { id: 'utilizadores', label: 'Gestão de Utilizadores', icon: <Users size={20} />, path: '/utilizadores' },
  { id: 'arquivos', label: 'Gestão de Arquivos', icon: <Files size={20} />, path: '/dashboard/arquivos' },
  { id: 'master', label: 'Master Admin', icon: <ShieldCheck size={20} />, path: '/master' },
];

export const ROLE_ACCESS: Record<UserRole, string[]> = {
  // Administrador tem acesso total
  admin: ['all', 'vendas'],

  // Director Amazing Arena Gamer - Apenas Arena + Dashboard + Solicitações
  director_arena: ['home', 'dashboard', 'arena_admin', 'solicitacoes', 'blog', 'live_streaming'],

  // Director Amazing Agro - Apenas Agro + Dashboard + Solicitações
  director_agro: ['home', 'dashboard', 'agro', 'solicitacoes', 'blog', 'live_streaming'],

  // Director da Amazing Express - Apenas Transportes + Dashboard + Solicitações
  director_express: ['home', 'dashboard', 'transportes', 'solicitacoes', 'blog', 'live_streaming'],

  // Amazing Imobiliário - Apenas Imobiliário + Dashboard + Solicitações
  director_realestate: ['home', 'dashboard', 'imobiliario', 'solicitacoes', 'blog', 'live_streaming'],

  // Director da Amazing ContábilExpress - Apenas Contabilidade + Dashboard + Solicitações
  director_accounting: ['home', 'dashboard', 'contabilidade', 'solicitacoes', 'blog', 'empresas', 'live_streaming'],

  // Director da Tesouraria - Apenas Tesouraria + Dashboard + Solicitações
  director_treasury: ['home', 'dashboard', 'tesouraria', 'solicitacoes', 'blog', 'live_streaming'],

  // Director da Manutenção - Apenas Manutenção + Dashboard + Solicitações
  director_maintenance: ['home', 'dashboard', 'manutencao', 'solicitacoes', 'blog', 'live_streaming'],

  // Responsável de Inventário & Stock - Apenas Inventário + Dashboard + Solicitações + Vendas
  manager_inventory: ['home', 'dashboard', 'inventario', 'solicitacoes', 'blog', 'live_streaming', 'vendas'],

  // Manager Vendas - Novo perfil logico
  manager_sales: ['home', 'dashboard', 'vendas', 'solicitacoes', 'blog', 'live_streaming'],

  // Director de Recursos Humanos - Apenas RH + Dashboard + Solicitações + CANDIDATURAS
  director_hr: ['home', 'dashboard', 'rh', 'candidaturas', 'solicitacoes', 'blog', 'live_streaming'],

  // Director de Finanças - Apenas Finanças + Dashboard + Solicitações + Vendas
  director_finance: ['home', 'dashboard', 'financeiro', 'solicitacoes', 'blog', 'empresas', 'live_streaming', 'vendas'],

  // Bibliotecário - Gestão da Biblioteca
  bibliotecario: ['home', 'dashboard', 'biblioteca', 'solicitacoes', 'blog', 'live_streaming'],

  // Operário - Acesso limitado a Galeria, Biblioteca, Home e Dashboard
  operario: ['home', 'dashboard', 'galeria_corp', 'biblioteca'],

  // Vendedor - Apenas Vendas & POS + Dashboard
  vendedor: ['home', 'dashboard', 'vendas'],

  // Master Admin (SaaS)
  saas_admin: ['all', 'master', 'vendas'],

  // Master Admin
  master: ['all'],

  // Cashier
  cashier: ['home', 'dashboard', 'vendas'],

  // Manager
  manager: ['home', 'dashboard', 'vendas', 'solicitacoes', 'blog', 'inventario'],
};

export const formatAOA = (value: number) => {
  const safeValue = isNaN(value) || value === null || value === undefined ? 0 : value;
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
  }).format(safeValue);
};

export const getMergedPermissions = (role: string): string[] => {
  // 1. Check dynamic roles from DB
  if (dynamicRoles[role]) {
    return dynamicRoles[role];
  }

  // 2. Fallback to static ROLE_ACCESS
  return (ROLE_ACCESS[role as UserRole] || []) as string[];
};
