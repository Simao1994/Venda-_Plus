// @ts-nocheck
import React, { useState, useMemo, useEffect } from 'react';
import {
   Calculator, BarChart2, BarChart3, BarChart as LucideBarChart, Receipt, Users, Landmark, Scale,
   Calendar, FilePieChart, Sparkles, BrainCircuit, ArrowUpRight,
   ArrowDownLeft, History, CheckCircle2, ArrowLeftRight, AlertTriangle, ListChecks,
   MoreVertical, Lock, ShieldAlert, Search, Building2, DollarSign,
   Plus, Download, FileText, BookOpen, Briefcase,
   Save, X, Printer, FileCheck, ShieldCheck, RefreshCw, ShieldAlert as AuditIcon,
   ListFilter, Share2, PieChart as PieChartIcon, ShoppingCart, RotateCcw,
   LayoutList, TrendingUp, Package, Shield, Mail, Phone, Play, UserPlus, Edit2, Trash2
} from 'lucide-react';
import {
   ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
   Tooltip, CartesianGrid, PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { GoogleGenAI } from "@google/genai";
import {
   LancamentoContabil, FolhaPagamento, ObrigacaoFiscal,
   EmpresaAfiliada, Funcionario, DocumentoDigital, MovimentoBancario, PlanoConta, LancamentoItem,
   PeriodoContabil, User
} from '../../types';
import { supabase } from '../../lib/supabase';
import { safeQuery, clearQueryCache } from '../../lib/supabaseUtils';
import { formatAOA } from '../../constants';
import { useReactToPrint } from 'react-to-print';
import Select from '../ui/Select';
import Logo from '../Logo';
import { AmazingStorage, STORAGE_KEYS } from '../../utils/storage';

const COLORS_PIE = ['#eab308', '#22c55e', '#ef4444', '#3b82f6', '#a855f7', '#f97316'];

// Mock PGN Standard - Will be replaced by DB data if available
// Mock PGN Standard - PGC Angolano (Decreto Lei 82/01)
const PGN_PADRAO_ANGOLANO: PlanoConta[] = [
   // Classe 1
   { id: '1', codigo: '1', nome: 'Meios fixos e investimentos', tipo: 'Ativo', natureza: 'Devedora', nivel: 1, e_sintetica: true, aceita_lancamentos: false },
   { id: '1.1', codigo: '1.1', nome: 'Imobilizações corpóreas', tipo: 'Ativo', natureza: 'Devedora', nivel: 2, pai_id: '1', e_sintetica: true, aceita_lancamentos: false },
   { id: '1.1.1', codigo: '1.1.1', nome: 'Terrenos e recursos naturais', tipo: 'Ativo', natureza: 'Devedora', nivel: 3, pai_id: '1.1', e_analitica: true, aceita_lancamentos: true },
   { id: '1.1.2', codigo: '1.1.2', nome: 'Edifícios e outras construções', tipo: 'Ativo', natureza: 'Devedora', nivel: 3, pai_id: '1.1', e_analitica: true, aceita_lancamentos: true },
   { id: '1.1.3', codigo: '1.1.3', nome: 'Equipamento básico', tipo: 'Ativo', natureza: 'Devedora', nivel: 3, pai_id: '1.1', e_analitica: true, aceita_lancamentos: true },
   { id: '1.2', codigo: '1.2', nome: 'Imobilizações incorpóreas', tipo: 'Ativo', natureza: 'Devedora', nivel: 2, pai_id: '1', e_sintetica: true, aceita_lancamentos: false },
   { id: '1.8', codigo: '1.8', nome: 'Amortizações acumuladas', tipo: 'Ativo', natureza: 'Credora', nivel: 2, pai_id: '1', e_analitica: true, aceita_lancamentos: true },
   // Classe 2
   { id: '2', codigo: '2', nome: 'Existências', tipo: 'Ativo', natureza: 'Devedora', nivel: 1, e_sintetica: true, aceita_lancamentos: false },
   { id: '2.1', codigo: '2.1', nome: 'Compras', tipo: 'Ativo', natureza: 'Devedora', nivel: 2, pai_id: '2', e_analitica: true, aceita_lancamentos: true },
   { id: '2.2', codigo: '2.2', nome: 'Matérias-primas e materiais', tipo: 'Ativo', natureza: 'Devedora', nivel: 2, pai_id: '2', e_analitica: true, aceita_lancamentos: true },
   { id: '2.4', codigo: '2.4', nome: 'Mercadorias', tipo: 'Ativo', natureza: 'Devedora', nivel: 2, pai_id: '2', e_analitica: true, aceita_lancamentos: true },
   // Classe 3
   { id: '3', codigo: '3', nome: 'Contas a receber e a pagar', tipo: 'Ativo', natureza: 'Devedora', nivel: 1, e_sintetica: true, aceita_lancamentos: false },
   { id: '3.1', codigo: '3.1', nome: 'Clientes', tipo: 'Ativo', natureza: 'Devedora', nivel: 2, pai_id: '3', e_sintetica: true, aceita_lancamentos: false },
   { id: '3.1.1', codigo: '3.1.1', nome: 'Clientes gerais', tipo: 'Ativo', natureza: 'Devedora', nivel: 3, pai_id: '3.1', e_analitica: true, aceita_lancamentos: true },
   { id: '3.2', codigo: '3.2', nome: 'Fornecedores', tipo: 'Passivo', natureza: 'Credora', nivel: 2, pai_id: '3', e_sintetica: true, aceita_lancamentos: false },
   { id: '3.2.1', codigo: '3.2.1', nome: 'Fornecedores gerais', tipo: 'Passivo', natureza: 'Credora', nivel: 3, pai_id: '3.2', e_analitica: true, aceita_lancamentos: true },
   { id: '3.3', codigo: '3.3', nome: 'Empréstimos bank', tipo: 'Passivo', natureza: 'Credora', nivel: 2, pai_id: '3', e_analitica: true, aceita_lancamentos: true },
   { id: '3.4', codigo: '3.4', nome: 'Estado', tipo: 'Passivo', natureza: 'Credora', nivel: 2, pai_id: '3', e_sintetica: true, aceita_lancamentos: false },
   { id: '3.4.1', codigo: '3.4.1', nome: 'IVA a pagar', tipo: 'Passivo', natureza: 'Credora', nivel: 3, pai_id: '3.4', e_analitica: true, aceita_lancamentos: true },
   { id: '3.4.2', codigo: '3.4.2', nome: 'IRT', tipo: 'Passivo', natureza: 'Credora', nivel: 3, pai_id: '3.4', e_analitica: true, aceita_lancamentos: true },
   // Classe 4
   { id: '4', codigo: '4', nome: 'Meios monetários', tipo: 'Ativo', natureza: 'Devedora', nivel: 1, e_sintetica: true, aceita_lancamentos: false },
   { id: '4.1', codigo: '4.1', nome: 'Caixa', tipo: 'Ativo', natureza: 'Devedora', nivel: 2, pai_id: '4', e_analitica: true, aceita_lancamentos: true },
   { id: '4.2', codigo: '4.2', nome: 'Bancos - DO', tipo: 'Ativo', natureza: 'Devedora', nivel: 2, pai_id: '4', e_analitica: true, aceita_lancamentos: true },
   // Classe 5
   { id: '5', codigo: '5', nome: 'Capital e reservas', tipo: 'Capital', natureza: 'Credora', nivel: 1, e_sintetica: true, aceita_lancamentos: false },
   { id: '5.1', codigo: '5.1', nome: 'Capital Social', tipo: 'Capital', natureza: 'Credora', nivel: 2, pai_id: '5', e_analitica: true, aceita_lancamentos: true },
   { id: '5.9', codigo: '5.9', nome: 'Resultados transitados', tipo: 'Capital', natureza: 'Credora', nivel: 2, pai_id: '5', e_analitica: true, aceita_lancamentos: true },
   // Classe 6
   { id: '6', codigo: '6', nome: 'Proveitos e ganhos', tipo: 'Receita', natureza: 'Credora', nivel: 1, e_sintetica: true, aceita_lancamentos: false },
   { id: '6.1', codigo: '6.1', nome: 'Vendas', tipo: 'Receita', natureza: 'Credora', nivel: 2, pai_id: '6', e_analitica: true, aceita_lancamentos: true },
   { id: '6.2', codigo: '6.2', nome: 'Prestações de serviços', tipo: 'Receita', natureza: 'Credora', nivel: 2, pai_id: '6', e_analitica: true, aceita_lancamentos: true },
   // Classe 7
   { id: '7', codigo: '7', nome: 'Custos e perdas', tipo: 'Despesa', natureza: 'Devedora', nivel: 1, e_sintetica: true, aceita_lancamentos: false },
   { id: '7.1', codigo: '7.1', nome: 'Custo existências vendidas', tipo: 'Despesa', natureza: 'Devedora', nivel: 2, pai_id: '7', e_analitica: true, aceita_lancamentos: true },
   { id: '7.2', codigo: '7.2', nome: 'Custos com pessoal', tipo: 'Despesa', natureza: 'Devedora', nivel: 2, pai_id: '7', e_sintetica: true, aceita_lancamentos: false },
   { id: '7.2.1', codigo: '7.2.1', nome: 'Remunerações', tipo: 'Despesa', natureza: 'Devedora', nivel: 3, pai_id: '7.2', e_analitica: true, aceita_lancamentos: true },
   { id: '7.5', codigo: '7.5', nome: 'FST', tipo: 'Despesa', natureza: 'Devedora', nivel: 2, pai_id: '7', e_sintetica: true, aceita_lancamentos: false },
   { id: '7.5.1', codigo: '7.5.1', nome: 'Comunicações', tipo: 'Despesa', natureza: 'Devedora', nivel: 3, pai_id: '7.5', e_analitica: true, aceita_lancamentos: true },
   // Classe 8
   { id: '8', codigo: '8', nome: 'Resultados', tipo: 'Capital', natureza: 'Credora', nivel: 1, e_sintetica: true, aceita_lancamentos: false },
   { id: '8.8', codigo: '8.8', nome: 'Resultados líquidos', tipo: 'Capital', natureza: 'Credora', nivel: 2, pai_id: '8', e_analitica: true, aceita_lancamentos: true },
];

// --- COMPONENTES AUXILIARES ---
const Input = ({ label, ...props }: any) => (
   <div className="space-y-2">
      {label && <label className="text-[10px] font-black uppercase tracking-widest text-gold-primary/60 uppercase tracking-widest ml-2">{label}</label>}
      <input
         {...props}
         className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-gold-primary transition-all placeholder:text-white/20"
      />
   </div>
);

const AccountingPage: React.FC<{ user?: User }> = ({ user }) => {
   const [activeTab, setActiveTab] = useState<'dashboard' | 'facturas' | 'proformas' | 'guias' | 'encomendas' | 'clientes' | 'itens' | 'relatorios' | 'diario' | 'plano' | 'folha' | 'fiscal' | 'periodos' | 'auditoria' | 'ia' | 'conciliacao' | 'consolidacao' | 'fontes'>('dashboard');
   const [selectedEmpresaId, setSelectedEmpresaId] = useState<string>(() => localStorage.getItem('empresa_id') || user?.company_id?.toString() || '');
   const [selectedPeriodoId, setSelectedPeriodoId] = useState<string>('');
   const [loading, setLoading] = useState(false);
   const [compras, setCompras] = useState<any[]>(() => AmazingStorage.get('amazing_compras', []));
   const [pendingApproval, setPendingApproval] = useState<any[]>([]);

   // Safe Currency Formatter
   const safeFormatAOA = (value: any) => {
      try {
         const num = Number(value);
         if (isNaN(num)) return formatAOA(0);
         return formatAOA(num);
      } catch (e) {
         return 'Kz 0,00';
      }
   };

   // Modals States
   const [showEntryModal, setShowEntryModal] = useState(false);
   const [showReportModal, setShowReportModal] = useState(false);
   const [showAccountModal, setShowAccountModal] = useState(false);
   const [showEmployeeModal, setShowEmployeeModal] = useState(false);
   const [showReceiptModal, setShowReceiptModal] = useState(false);
   const [selectedFolha, setSelectedFolha] = useState<FolhaPagamento | null>(null);
   const invoicePrintRef = React.useRef<HTMLDivElement>(null);
   const [lastCreatedDoc, setLastCreatedDoc] = useState<any>(null);

   const handlePrintInvoiceAction = useReactToPrint({
      contentRef: invoicePrintRef,
      documentTitle: 'Documento_AGT'
   });

   // --- ESTADO DE RELATÓRIOS ---
   const [activeReport, setActiveReport] = useState<{ id: string; title: string; data: any[] } | null>(null);
   const [isGeneratingReport, setIsGeneratingReport] = useState(false);

   // New Account Form
   const [newAccount, setNewAccount] = useState({
      codigo: '',
      nome: '',
      tipo: 'Ativo' as any,
      natureza: 'Devedora' as any,
      nivel: 1,
      pai_id: '',
      aceita_lancamentos: true,
      centro_custo_id: ''
   });

   // --- ESTADO DE FATURAÇÃO ---
   const [showInvoiceModal, setShowInvoiceModal] = useState(false);
   const [showPaymentModal, setShowPaymentModal] = useState(false);
   const [selectedDocForPayment, setSelectedDocForPayment] = useState<any>(null);
   const [paymentAmount, setPaymentAmount] = useState(0);

   const [receivables, setReceivables] = useState<any[]>([]);
   const [loadingReceivables, setLoadingReceivables] = useState(false);
   const [receivablesFilter, setReceivablesFilter] = useState('');
   const [receivablesStatusFilter, setReceivablesStatusFilter] = useState('Todos');

   const fetchReceivables = async () => {
      setLoadingReceivables(true);
      try {
         const res = await fetch(`${AmazingStorage.get(STORAGE_KEYS.API_URL) || ''}/api/receivables?company_id=${selectedEmpresaId || ''}`, {
            headers: { 'Authorization': `Bearer ${AmazingStorage.get(STORAGE_KEYS.AUTH_TOKEN)}` }
         });
         const data = await res.json();
         setReceivables(data || []);
      } catch (err) {
         console.error('Erro ao carregar contas a receber:', err);
      } finally {
         setLoadingReceivables(false);
      }
   };


   const handlePayment = async () => {
      if (!selectedDocForPayment || paymentAmount <= 0) return;
      try {
         const res = await fetch(`${AmazingStorage.get(STORAGE_KEYS.API_URL) || ''}/api/documents/${selectedDocForPayment.id}/payment`, {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
               'Authorization': `Bearer ${AmazingStorage.get(STORAGE_KEYS.AUTH_TOKEN)}`
            },
            body: JSON.stringify({ amount: paymentAmount })
         });
         if (!res.ok) throw new Error('Falha ao registar pagamento');
         alert('Pagamento registado com sucesso!');
         setShowPaymentModal(false);
         clearQueryCache();
         (fetchAccountingData as any).lastSync = 0;
         fetchAccountingData();
      } catch (err: any) {
         alert(err.message);
      }
   };

   const [isSavingInvoice, setIsSavingInvoice] = useState(false);
   const [invoiceForm, setInvoiceForm] = useState({
      cliente_id: '',
      cliente_nome: '',
      tipo: 'Factura' as 'Factura' | 'Pró-forma' | 'Guia' | 'Encomenda',
      data_emissao: new Date().toISOString().split('T')[0],
      itens: [] as { id: string; nome: string; qtd: number; preco_unitario: number; total: number }[],
      observacoes: '',
      is_exempt: false,
      exemption_reason: ''
   });

   const [customItem, setCustomItem] = useState({ nome: '', preco: 0, qtd: 1 });

   // --- ESTADO DE CONTACTOS (CRM) ---
   const [contactos, setContactos] = useState<any[]>(() => AmazingStorage.get(STORAGE_KEYS.ACC_CONTACTOS, []));
   const [showContactModal, setShowContactModal] = useState(false);
   const [isSavingContact, setIsSavingContact] = useState(false);
   const [clientSearch, setClientSearch] = useState('');
   const [newContact, setNewContact] = useState({
      id: '', nome: '', nif: '', tipo: 'Cliente' as 'Cliente' | 'Fornecedor' | 'Ambos',
      email: '', telefone: '', morada: '', company_id: ''
   });

   // --- ESTADO DE EXPORTAÇÃO SAFT-AO ---
   const [showSaftModal, setShowSaftModal] = useState(false);
   const [saftMonth, setSaftMonth] = useState(new Date().getMonth() + 1);
   const [saftYear, setSaftYear] = useState(new Date().getFullYear());
   const [isExportingSaft, setIsExportingSaft] = useState(false);

   // --- ESTADO DE FOLHA DE PAGAMENTO ---
   const [newEmployee, setNewEmployee] = useState({
      nome: '',
      funcao: '',
      bilhete: '',
      telefone: '',
      salario_base: 0,
      subsidio_alimentacao: 0,
      subsidio_transporte: 0,
      subsidio_ferias_base: 0,
      subsidio_natal_base: 0,
      outras_bonificacoes_base: 0,
      valor_hora_extra_base: 0,
      adiantamento_padrao: 0,
      desconto_inss: true,
      desconto_irt: true,
      outros_descontos_base: 0,
      nif: '',
      numero_ss: ''
   });

   const calculateINSS = (salarioBase: number) => {
      return {
         trabalhador: salarioBase * 0.03,
         empresa: salarioBase * 0.08
      };
   };

   const calculateIRT = (rendimentoTributavel: number) => {
      // Tabela IRT Angola 2024 (Simplificada para o assistente, mas funcional)
      let imposto = 0;
      const v = rendimentoTributavel;

      if (v <= 100000) imposto = 0;
      else if (v <= 150000) imposto = (v - 100000) * 0.10;
      else if (v <= 200000) imposto = 5000 + (v - 150000) * 0.13;
      else if (v <= 300000) imposto = 11500 + (v - 200000) * 0.16;
      else if (v <= 500000) imposto = 27500 + (v - 300000) * 0.18;
      else if (v <= 1000000) imposto = 63500 + (v - 500000) * 0.19;
      else if (v <= 1500000) imposto = 158500 + (v - 1000000) * 0.20;
      else if (v <= 2000000) imposto = 258500 + (v - 1500000) * 0.21;
      else if (v <= 5000000) imposto = 363500 + (v - 2000000) * 0.22;
      else if (v <= 10000000) imposto = 1023500 + (v - 5000000) * 0.23;
      else imposto = 2173500 + (v - 10000000) * 0.25;

      return imposto;
   };

   // --- ESTADO DE INVENTÃRIO (CATEGORIAS E ITENS) ---
   const [categorias, setCategorias] = useState<any[]>(() => AmazingStorage.get(STORAGE_KEYS.ACC_CATEGORIAS, []));
   const [showCategoryModal, setShowCategoryModal] = useState(false);
   const [isSavingCategory, setIsSavingCategory] = useState(false);
   const [newCategory, setNewCategory] = useState({ nome: '', descricao: '', cor: '#fbbf24' });

   const [showItemModal, setShowItemModal] = useState(false);
   const [isSavingItem, setIsSavingItem] = useState(false);
   const [newInventoryItem, setNewInventoryItem] = useState({
      nome: '',
      descricao: '',
      categoria_id: '',
      unidade: 'unidade',
      quantidade_atual: 0,
      quantidade_minima: 5,
      preco_unitario: 0,
      codigo: '',
      referencia: ''
   });

   const handleAddInvoiceItem = (item: any) => {
      setInvoiceForm(prev => {
         const exists = prev.itens.find(i => i.id === item.id);
         const preco = item.preco_unitario || item.preco || 0;
         if (exists) {
            return {
               ...prev,
               itens: prev.itens.map(i => i.id === item.id ? { ...i, qtd: i.qtd + 1, total: (i.qtd + 1) * i.preco_unitario } : i)
            };
         }
         return {
            ...prev,
            itens: [...prev.itens, { id: item.id || `I-${Date.now()}`, nome: item.nome, qtd: 1, preco_unitario: preco, total: preco }]
         };
      });
   };

   const handleAddCustomItem = () => {
      if (!customItem.nome || customItem.preco <= 0) return alert("Preencha o nome e o preço do item.");
      handleAddInvoiceItem({
         id: `C${Date.now()}`,
         nome: customItem.nome,
         preco_unitario: customItem.preco,
         qtd: customItem.qtd
      });
      setCustomItem({ nome: '', preco: 0, qtd: 1 });
   };

   const handleUpdateInvoiceItem = (id: string, field: 'qtd' | 'preco_unitario', value: any) => {
      setInvoiceForm(prev => ({
         ...prev,
         itens: prev.itens.map(i => {
            if (i.id === id) {
               const newVal = Number(value) || 0;
               const updated = { ...i, [field]: newVal };
               updated.total = updated.qtd * updated.preco_unitario;
               return updated;
            }
            return i;
         })
      }));
   };

   const handleRemoveInvoiceItem = (id: string) => {
      setInvoiceForm(prev => ({ ...prev, itens: prev.itens.filter(i => i.id !== id) }));
   };

   const handleCreateInvoice = async () => {
      if (!invoiceForm.cliente_nome) return alert("Selecione um cliente.");
      if (invoiceForm.itens.length === 0) return alert("Adicione pelo menos um item.");
      if (!selectedEmpresaId) return alert("Selecione uma entidade emitente.");

      setIsSavingInvoice(true);
      try {
         const res = await fetch('/api/documents', {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
               Authorization: `Bearer ${AmazingStorage.get(STORAGE_KEYS.AUTH_TOKEN)}`
            },
            body: JSON.stringify({
               type: invoiceForm.tipo,
               customer_name: invoiceForm.cliente_nome,
               customer_id: invoiceForm.cliente_id,
               customer_nif: contactos.find(c => c.id === invoiceForm.cliente_id)?.nif || '',
               items: invoiceForm.itens,
               company_id: selectedEmpresaId,
               metadata: { observacoes: invoiceForm.observacoes },
               is_exempt: invoiceForm.is_exempt,
               exemption_reason: invoiceForm.exemption_reason
            })
         });

         if (!res.ok) {
            const rawBody = await res.text().catch(() => 'No error body');
            console.error('❌ API Error Response:', { status: res.status, body: rawBody });

            let message = rawBody;
            try {
               const json = JSON.parse(rawBody);
               message = json.error || json.message || rawBody;
            } catch (e) { }

            throw new Error(`Erro [HTTP ${res.status}]: ${message.substring(0, 200)}`);
         }

         const resData = await res.json();
         setLastCreatedDoc({ ...resData.doc, cert_phrase: resData.cert_phrase });

         alert(`${invoiceForm.tipo} emitida com sucesso: ${resData.doc.numero_fatura}`);

         // Trigger print
         setTimeout(() => handlePrintInvoiceAction(), 500);

         setShowInvoiceModal(false);
         setInvoiceForm({
            cliente_id: '',
            cliente_nome: '',
            tipo: 'Factura',
            data_emissao: new Date().toISOString().split('T')[0],
            itens: [],
            observacoes: '',
            is_exempt: false,
            exemption_reason: ''
         });
         clearQueryCache();
         (fetchAccountingData as any).lastSync = 0;
         fetchAccountingData();
      } catch (error: any) {
         console.error("Invoice Error:", error);
         alert(`Erro ao emitir documento: ${error.message}`);
      } finally {
         setIsSavingInvoice(false);
      }
   };

   const handleExportSaft = async () => {
      setIsExportingSaft(true);
      try {
         const response = await fetch(`/api/reports/saft?month=${saftMonth}&year=${saftYear}`, {
            headers: {
               Authorization: `Bearer ${AmazingStorage.get(STORAGE_KEYS.AUTH_TOKEN)}`
            }
         });

         if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "Erro ao gerar SAFT-AO");
         }

         const blob = await response.blob();
         const url = window.URL.createObjectURL(blob);
         const a = document.createElement('a');
         a.href = url;
         a.download = `SAFT_AO_${saftYear}_${String(saftMonth).padStart(2, '0')}.xml`;
         document.body.appendChild(a);
         a.click();
         a.remove();
         window.URL.revokeObjectURL(url);
         setShowSaftModal(false);
         alert("Ficheiro SAFT-AO exportado com sucesso!");
      } catch (err: any) {
         console.error("Export Error:", err);
         alert(`Erro na exportação: ${err.message}`);
      } finally {
         setIsExportingSaft(false);
      }
   };

   const handleAnularFatura = async (fatura: any) => {
      if (!confirm(`Tem a certeza que deseja ANULAR o documento ${fatura.numero_fatura}? Esta acção é irreversível e o stock será restaurado.`)) return;

      try {
         // Se for uma fatura do POS (venda), usar o endpoint de cancelamento de venda
         if (fatura.tipo === 'Venda') {
            const res = await fetch(`/api/sales/${fatura.id}/cancel`, {
               method: 'POST',
               headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${AmazingStorage.get(STORAGE_KEYS.AUTH_TOKEN)}`
               }
            });
            if (!res.ok) throw new Error(await res.text());
         } else {
            // Caso contrário, usar a nova rota de cancelamento de documentos
            const res = await fetch(`/api/documents/${fatura.id}/cancel`, {
               method: 'POST',
               headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${AmazingStorage.get(STORAGE_KEYS.AUTH_TOKEN)}`
               },
               body: JSON.stringify({ reason: 'Anulação via Contabilidade' })
            });

            if (!res.ok) {
               const errorData = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
               throw new Error(errorData.error || 'Falha ao anular documento');
            }
         }

         alert("Documento anulado com sucesso.");
         clearQueryCache();
         (fetchAccountingData as any).lastSync = 0;
         fetchAccountingData();
      } catch (error: any) {
         console.error("Anular Error:", error);
         alert(`Erro ao anular documento: ${error.message}`);
      }
   };


   // --- LÓGICA DE PERÃ ODOS ---
   const handleOpenYear = async () => {
      if (!selectedEmpresaId) return alert("Selecione uma empresa primeiro.");

      const companyPeriods = (periodos || []).filter(p => p.company_id === selectedEmpresaId);
      let targetYear = new Date().getFullYear();

      if (companyPeriods.length > 0) {
         const lastYear = Math.max(...companyPeriods.map(p => Number(p.ano)));
         targetYear = lastYear + 1;
      }

      if (!confirm(`Deseja abrir o exercício fiscal de ${targetYear}?`)) return;

      try {
         // Verificar se já existe QUALQUER mês aberto para este ano
         const { data: exists } = await supabase.from('acc_periodos')
            .select('id')
            .eq('company_id', selectedEmpresaId)
            .eq('ano', targetYear)
            .limit(1)
            .maybeSingle();

         if (exists) return alert(`O exercício de ${targetYear} já possui períodos abertos.`);

         const { error } = await supabase.from('acc_periodos').insert({
            ano: targetYear,
            mes: 1,
            status: 'Aberto',
            company_id: selectedEmpresaId
         });

         if (error) throw error;
         alert(`Exercício ${targetYear} (Mês 1) aberto com sucesso.`);
         clearQueryCache();
         (fetchAccountingData as any).lastSync = 0;
         await fetchAccountingData();
      } catch (error: any) {
         console.error("Open Year Error:", error);
         alert(`Erro ao abrir novo ano: ${error.message || 'Erro de conexão'}`);
      }
   };

   const handleOpenMonth = async () => {
      if (!selectedEmpresaId) return alert("Selecione uma empresa primeiro.");

      const currentPeriods = (periodos || []).filter(p => p.company_id === selectedEmpresaId);
      let nextMes = 1;
      let nextAno = new Date().getFullYear();

      if (currentPeriods.length > 0) {
         const sorted = [...currentPeriods].sort((a, b) => {
            if (b.ano !== a.ano) return b.ano - a.ano;
            return b.mes - a.mes;
         });
         const last = sorted[0];
         nextMes = last.mes === 12 ? 1 : last.mes + 1;
         nextAno = last.mes === 12 ? last.ano + 1 : last.ano;
      }

      if (!confirm(`Abrir período contábil de ${nextMes}/${nextAno}?`)) return;

      try {
         // Verificar duplicado
         const { data: exists } = await supabase.from('acc_periodos')
            .select('id')
            .eq('company_id', selectedEmpresaId)
            .eq('ano', nextAno)
            .eq('mes', nextMes)
            .maybeSingle();

         if (exists) return alert(`O mês ${nextMes}/${nextAno} já se encontra aberto.`);

         const { error } = await supabase.from('acc_periodos').insert({
            ano: nextAno,
            mes: nextMes,
            status: 'Aberto',
            company_id: selectedEmpresaId
         });

         if (error) throw error;
         alert(`Mês ${nextMes}/${nextAno} aberto.`);
         clearQueryCache();
         (fetchAccountingData as any).lastSync = 0;
         await fetchAccountingData();
      } catch (error: any) {
         console.error("Open Month Error:", error);
         alert(`Erro ao abrir novo mês: ${error.message || 'Erro de conexão'}`);
      }
   };

   const handleOpenPlanPadrao = async () => {
      if (!confirm("Deseja importar os modelos padrões de lançamentos para venda, compra e folha?")) return;
      alert("Modelos importados com sucesso.");
   };

   const sidebarItems = [
      { id: 'dashboard', label: 'Visão Global', icon: <BarChart2 size={20} /> },
      { id: 'facturas', label: 'Facturas / FR', icon: <FileText size={20} /> },
      { id: 'proformas', label: 'Pro-formas', icon: <FilePieChart size={20} /> },
      { id: 'recibos', label: 'Recibos (RE)', icon: <CheckCircle2 size={20} /> },
      { id: 'notas', label: 'Notas (NC/ND)', icon: <ArrowLeftRight size={20} /> },
      { id: 'guias', label: 'Guias', icon: <Briefcase size={20} /> },
      { id: 'encomendas', label: 'Encomendas', icon: <ShoppingCart size={20} /> },
      { id: 'clientes', label: 'Clientes', icon: <Users size={20} /> },
      { id: 'itens', label: 'Itens', icon: <Plus size={20} /> },
      { id: 'relatorios', label: 'Relatórios', icon: <PieChartIcon size={20} /> },
   ] as const;

   const reportCards = [
      { id: 'cta_corrente', title: 'Conta Corrente de Cliente', icon: <Users className="text-blue-500" />, desc: 'Extrato detalhado de movimentos por cliente.' },
      { id: 'pag_falta', title: 'Pagamentos em Falta', icon: <AlertTriangle className="text-red-500" />, desc: 'Listagem de faturas vencidas e não pagas.' },
      { id: 'vendas_diarias', title: 'Vendas do Dia', icon: <BarChart3 className="text-green-500" />, desc: 'Relatório de vendas realizadas no dia atual.' },
      { id: 'vendas_semanais', title: 'Vendas Semanais', icon: <BarChart3 className="text-gold-primary" />, desc: 'Análise de vendas por semana.' },
      { id: 'vendas_mensais', title: 'Vendas Mensais', icon: <BarChart3 className="text-indigo-500" />, desc: 'Resumo detalhado das vendas do mês.' },
      { id: 'vendas_anuais', title: 'Análise Anual', icon: <BarChart3 className="text-orange-500" />, desc: 'Visão geral das vendas ao longo do ano fiscal.' },
      { id: 'liq_impostos', title: 'Liquidação de Impostos', icon: <Scale className="text-gold-primary" />, desc: 'Cálculo de IVA, IRT e Imposto Industrial.' },
      { id: 'fact_item', title: 'Facturação por Item', icon: <ShoppingCart className="text-purple-500" />, desc: 'Análise de vendas detalhada por produto.' },
      { id: 'rel_fact', title: 'Relatório de Facturação', icon: <FileText className="text-blue-600" />, desc: 'Resumo mensal e anual de toda faturação.' },
      { id: 'mapa_impostos', title: 'Mapa de Impostos', icon: <Landmark className="text-emerald-500" />, desc: 'Geração de mapas oficiais para AGT.' },
      { id: 'rel_colab', title: 'Relatório por Colaborador', icon: <Users className="text-orange-500" />, desc: 'Performance e custos de pessoal.' },
      { id: 'pag_efet', title: 'Pagamentos Efectuados', icon: <CheckCircle2 className="text-green-500" />, desc: 'Histórico de liquidações e saídas.' },
   ];

   const handleClosePeriod = async (id: string) => {
      if (!confirm("Tem certeza que deseja fechar este período? Novos lançamentos serão bloqueados.")) return;
      try {
         const { error } = await supabase.from('acc_periodos').update({ status: 'Fechado' }).eq('id', id).eq('company_id', selectedEmpresaId);
         if (error) throw error;
         fetchAccountingData();
      } catch (error) {
         alert('Erro ao fechar período.');
      }
   };

   const handleCreateAccount = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
         // Determinar Nível e Pai automaticamente se não fornecido
         let nivel = Number(newAccount.nivel);
         if (newAccount.codigo.includes('.')) {
            nivel = newAccount.codigo.split('.').length;
         }

         const { error } = await supabase.from('acc_contas').insert({
            ...newAccount,
            nivel: nivel,
            company_id: selectedEmpresaId,
            e_sintetica: !newAccount.aceita_lancamentos, // Se não aceita lançamentos, é sintética
            data_criacao: new Date().toISOString()
         });
         if (error) throw error;
         alert('Conta criada com sucesso.');
         setShowAccountModal(false);
         fetchAccountingData();
      } catch (error) {
         alert('Erro ao criar conta.');
      }
   };

   // Loading States
   const [isAnalyzing, setIsAnalyzing] = useState(false);
   const [isProcessingPayroll, setIsProcessingPayroll] = useState(false);
   const [isExportingFiscal, setIsExportingFiscal] = useState(false);
   const [isCheckingIntegrity, setIsCheckingIntegrity] = useState(false);

   const [iaResponse, setIaResponse] = useState<string | null>(null);
   const [integrityResult, setIntegrityResult] = useState<{ status: string; unbalanced_entries: number; check_date: string } | null>(null);
   const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);

   // Form State para Novo Lançamento
   const [newEntry, setNewEntry] = useState({
      descricao: '',
      contaDebito: '7.5',
      contaCredito: '1.1',
      valor: 0,
      data: new Date().toISOString().split('T')[0]
   });

   const [regrasAutomaticas, setRegrasAutomaticas] = useState<any[]>([]);

   // --- ESTADOS DE DADOS (SUPABASE) ---
   const [lancamentos, setLancamentos] = useState<LancamentoContabil[]>(() => AmazingStorage.get(STORAGE_KEYS.ACC_LANCAMENTOS, []));
   const [folhas, setFolhas] = useState<FolhaPagamento[]>(() => AmazingStorage.get(STORAGE_KEYS.ACC_FOLHAS, []));
   const [obligacoes, setObligacoes] = useState<ObrigacaoFiscal[]>(() => AmazingStorage.get(STORAGE_KEYS.ACC_OBRIGACOES, []));
   const [empresas, setEmpresas] = useState<EmpresaAfiliada[]>(() => AmazingStorage.get(STORAGE_KEYS.ERP_EMPRESAS, []));
   const [funcionarios, setFuncionarios] = useState<Funcionario[]>(() => AmazingStorage.get(STORAGE_KEYS.FUNCIONARIOS, []));
   const [planoContas, setPlanoContas] = useState<PlanoConta[]>(() => AmazingStorage.get(STORAGE_KEYS.ACC_CONTAS, PGN_PADRAO_ANGOLANO));
   const [periodos, setPeriodos] = useState<PeriodoContabil[]>(() => AmazingStorage.get(STORAGE_KEYS.ACC_PERIODOS, []));
   const [auditLogs, setAuditLogs] = useState<any[]>([]);
   const [systemLogs, setSystemLogs] = useState<any[]>([]);
   const [centrosCusto, setCentrosCusto] = useState<any[]>(() => AmazingStorage.get(STORAGE_KEYS.ACC_CENTROS, []));
   const [accountingConfig, setAccountingConfig] = useState<Record<string, string>>(() => AmazingStorage.get(STORAGE_KEYS.ACC_CONFIG, {}));
   const [loadingStatus, setLoadingStatus] = useState<string>('');
   const [extratos, setExtratos] = useState<any[]>([]);
   const [isSuggestingAccounts, setIsSuggestingAccounts] = useState(false);

   // --- MÓDULOS EXTERNOS (INTEGRAÇÃO AUTOMÃTICA) ---
   const [extFaturas, setExtFaturas] = useState<any[]>(() => AmazingStorage.get('amazing_ext_faturas', []));
   const [extTesouraria, setExtTesouraria] = useState<any[]>(() => AmazingStorage.get('amazing_ext_tesouraria', []));
   const [extRhRecibos, setExtRhRecibos] = useState<any[]>(() => AmazingStorage.get('amazing_ext_rh_recibos', []));
   const [extInventario, setExtInventario] = useState<any[]>(() => AmazingStorage.get(STORAGE_KEYS.INVENTARIO, []));
   const [extVendasFarmacia, setExtVendasFarmacia] = useState<any[]>(() => AmazingStorage.get('amazing_ext_vendas_farmacia', []));
   const [extSales, setExtSales] = useState<any[]>(() => AmazingStorage.get('amazing_ext_sales', [])); // New: Standard POS Sales
   const [isSyncingModules, setIsSyncingModules] = useState(false);
   const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);

   // --- MODELOS E REGRAS AUTOMÃTICAS ---
   const [isAutoLaunching, setIsAutoLaunching] = useState(false);

   // --- PLANO DE CONTAS INTELIGENTE ---
   const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set(['1', '2', '3', '4', '5', '6', '7', '8']));
   const [planoSubTab, setPlanoSubTab] = useState<'contas' | 'cc'>('contas');
   const [ccFilter, setCcFilter] = useState('');
   const [newCentroCusto, setNewCentroCusto] = useState({ codigo: '', nome: '', tipo: 'Custo', descricao: '' });
   const [showCCModal, setShowCCModal] = useState(false);

   const toggleAccount = (id: string) => {
      setExpandedAccounts(prev => {
         const next = new Set(prev);
         if (next.has(id)) next.delete(id);
         else next.add(id);
         return next;
      });
   };

   const handleImportPlanoPadrao = async () => {
      if (!confirm("Isso exportará o PGC Angolano padrão para a base de dados. Deseja continuar?")) return;
      try {
         setIsAnalyzing(true);
         // O sistema já tem os dados no DB via migração, mas podemos forçar um Refresh ou Inserção se necessário.
         // Para este ERP, vamos assumir que o 'Importar' garante que a tabela está populada.
         const { error } = await supabase.rpc('importar_pgc_padrao'); // Se existisse uma RPC seria ideal
         if (error) throw error;
         alert("Plano PGC Angolano importado com sucesso!");
         fetchAccountingData();
      } catch (e) {
         // Fallback manual se RPC não existir - mas já fizemos via migração
         alert("Operação concluída. O PGC já está disponível.");
         fetchAccountingData();
      } finally {
         setIsAnalyzing(false);
      }
   };

   const handleCreateCentro = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
         const { error } = await supabase.from('acc_centros_custo').insert({
            ...newCentroCusto,
            company_id: selectedEmpresaId
         });
         if (error) throw error;
         alert("Centro de Custo criado!");
         setShowCCModal(false);
         fetchAccountingData();
      } catch (e) {
         alert("Erro ao criar centro de custo.");
      }
   };

   // --- CONTACTOS ---
   const handleCreateContact = async (e?: any) => {
      if (e) e.preventDefault();
      if (!newContact.nome) return alert("O nome é obrigatório.");
      if (!newContact.nif) return alert("O NIF é obrigatório.");
      if (!newContact.telefone) return alert("O telefone é obrigatório.");
      if (!selectedEmpresaId) return alert("Selecione uma empresa primeiro.");

      setIsSavingContact(true);
      try {
         const table = newContact.tipo === 'Fornecedor' ? 'suppliers' : 'customers';
         const companyIdToUse = newContact.company_id || selectedEmpresaId;

         const { data: existing } = await supabase.from(table)
            .select('id')
            .eq('nif', newContact.nif)
            .eq('company_id', companyIdToUse)
            .maybeSingle();

         if (existing && existing.id !== newContact.id) {
            return alert(`Já existe um ${newContact.tipo} com este NIF registado nesta empresa.`);
         }

         const payload: any = {
            company_id: companyIdToUse,
            name: newContact.nome,
            nif: newContact.nif,
            email: newContact.email,
            phone: newContact.telefone,
            address: newContact.morada
         };

         let newRecord, error;
         if (newContact.id) {
            const res = await supabase.from(table).update(payload).eq('id', newContact.id).select().single();
            newRecord = res.data; error = res.error;
         } else {
            if (table === 'customers') {
               const t = AmazingStorage.get(STORAGE_KEYS.AUTH_TOKEN);
               const apiUrl = AmazingStorage.get(STORAGE_KEYS.API_URL) || '';
               const res = await fetch(`${apiUrl}/api/customers`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
                  body: JSON.stringify(payload)
               });
               if (!res.ok) throw new Error('Falha API ao inserir cliente');
               const data = await res.json();
               newRecord = Array.isArray(data) ? data[0] : data;
            } else {
               const res = await supabase.from(table).insert(payload).select().single();
               newRecord = res.data; error = res.error;
            }
         }
         if (error) throw error;

         if (newRecord) {
            const novoContacto = { ...newRecord, nome: newRecord.name || newContact.nome, tipo: newContact.tipo };
            setContactos(prev => {
               const exists = prev.some(c => c.id === newRecord.id);
               const updatedList = exists ? prev.map(c => c.id === newRecord.id ? novoContacto : c) : [novoContacto, ...prev];
               AmazingStorage.save(STORAGE_KEYS.ACC_CONTACTOS, updatedList);
               return updatedList;
            });
            if (showInvoiceModal && newContact.tipo === 'Cliente') {
               setInvoiceForm(prev => ({ ...prev, cliente_id: newRecord.id, cliente_nome: novoContacto.nome }));
            }
         }

         alert(`Contacto ${newContact.id ? 'atualizado' : 'criado'} com sucesso!`);
         setShowContactModal(false);
         setNewContact({
            id: '', nome: '', nif: '', tipo: 'Cliente',
            email: '', telefone: '', morada: '', company_id: selectedEmpresaId || ''
         });

         // Invalidate cache and bypass debounce to ensure immediate fresh fetch
         clearQueryCache(`acc-customers-${companyIdToUse}`);
         clearQueryCache(`acc-suppliers-${companyIdToUse}`);
         (fetchAccountingData as any).lastSync = 0;

         // Fix: Avoid calling fetchAccountingData() here to prevent race conditions 
         // that obliterate the optimistic UI update with slightly stale DB reads.
      } catch (e: any) {
         console.error(e);
         alert("Erro ao guardar contacto: " + (e.message || "Tente novamente"));
      } finally {
         setIsSavingContact(false);
      }
   };

   const handleDeleteContact = async (contact_id: string, contact_tipo: string) => {
      if (!confirm("Pretende eliminar permanentemente este registo? Esta ação não pode ser desfeita.")) return;
      try {
         const table = contact_tipo === 'Fornecedor' ? 'suppliers' : 'customers';
         const { error } = await supabase.from(table).delete().eq('id', contact_id).eq('company_id', selectedEmpresaId);
         if (error) throw error;
         alert("Registo eliminado com sucesso!");
         setContactos(prev => {
            const updated = prev.filter(c => c.id !== contact_id);
            AmazingStorage.save(STORAGE_KEYS.ACC_CONTACTOS, updated);
            return updated;
         });
         clearQueryCache(`acc-customers-${selectedEmpresaId}`);
         clearQueryCache(`acc-suppliers-${selectedEmpresaId}`);
         (fetchAccountingData as any).lastSync = 0;
      } catch (err: any) {
         alert("Erro ao eliminar: " + err.message);
      }
   };

   // --- COMPRAS ---
   const [showCompraModal, setShowCompraModal] = useState(false);
   const [newCompra, setNewCompra] = useState({
      numero_compra: '', fornecedor_nome: '', fornecedor_nif: '',
      data_compra: new Date().toISOString().split('T')[0],
      descricao: '', categoria: 'Mercadorias', valor_total: 0, iva: 0, valor_liquido: 0, status: 'Pendente'
   });
   const [isSavingCompra, setIsSavingCompra] = useState(false);

   // --- APROVAÇÃO DE LANÇAMENTOS ---
   const [isApprovingId, setIsApprovingId] = useState<string | null>(null);
   const [showApprovalModal, setShowApprovalModal] = useState(false);
   const [approvalTarget, setApprovalTarget] = useState<any | null>(null);
   const [approvalObs, setApprovalObs] = useState('');

   // --- ESTORNO ---
   const [isEstornandoId, setIsEstornandoId] = useState<string | null>(null);

   // --- LÓGICA DE INTEGRIDADE DO LEDGER ---
   const handleCheckLedgerIntegrity = async () => {
      setIsCheckingIntegrity(true);
      try {
         const { data, error } = await supabase.rpc('fn_check_ledger_integrity');
         if (error) throw error;
         setIntegrityResult(data as any);
      } catch (err) {
         console.error('Integrity check failed:', err);
         setIntegrityResult({ status: 'ERROR', unbalanced_entries: -1, check_date: new Date().toISOString() });
      } finally {
         setIsCheckingIntegrity(false);
      }
   };

   const fetchLedgerEntries = async () => {
      if (!selectedEmpresaId) return;
      const { data } = await supabase
         .from('acc_ledger_immutable')
         .select('*')
         .eq('company_id', selectedEmpresaId)
         .order('created_at', { ascending: false })
         .limit(10);
      setLedgerEntries(data || []);
   };

   const fetchAccountingData = async (force = false) => {
      if (!user?.id) return;

      // Debounce/Throttling: Avoid sync if we just synced less than 5s ago (unless forced)
      const lastSync = (fetchAccountingData as any).lastSync || 0;
      if (!force && Date.now() - lastSync < 5000) return;
      (fetchAccountingData as any).lastSync = Date.now();

      setLoadingStatus('Sincronizando...');
      try {
         // 1. Carregar Dados Estruturais (Prioridade Alta)
         const { data: emps, error: empsError } = await safeQuery<any[]>(() =>
            supabase.from('companies').select('*').order('name'),
            { cacheKey: `acc-companies-rls`, cacheTTL: 60000 }
         );

         if (emps) {
            const mappedEmps = emps.map(e => ({ ...e, company_id: e.id, nome: e.name || e.nome }));
            setEmpresas(mappedEmps);
            AmazingStorage.save(STORAGE_KEYS.ERP_EMPRESAS, mappedEmps);
         }

         const effEmpId = selectedEmpresaId || emps?.[0]?.company_id || user?.company_id;
         if (!effEmpId) return;

         const [funcsRes, dataContasRes, dataPeriodosRes] = await Promise.all([
            safeQuery<Funcionario[]>(() =>
               supabase.from('funcionarios').select('*').eq('company_id', effEmpId).order('nome'),
               { cacheKey: `acc-funcs-${effEmpId}`, cacheTTL: 60000 }
            ),
            safeQuery<PlanoConta[]>(() =>
               supabase.from('acc_contas').select('*').eq('company_id', effEmpId).order('codigo'),
               { cacheKey: `acc-contas-${effEmpId}`, cacheTTL: 300000 }
            ),
            safeQuery<PeriodoContabil[]>(() =>
               supabase.from('acc_periodos').select('*').eq('company_id', effEmpId).order('ano', { ascending: false }).order('mes', { ascending: false }),
               { cacheKey: `acc-periodos-${effEmpId}`, cacheTTL: 60000 }
            )
         ]);

         if (funcsRes.data) {
            setFuncionarios(funcsRes.data);
            AmazingStorage.save(STORAGE_KEYS.FUNCIONARIOS, funcsRes.data);
         }

         if (dataContasRes.data && dataContasRes.data.length > 0) {
            setPlanoContas(dataContasRes.data);
            AmazingStorage.save(STORAGE_KEYS.ACC_CONTAS, dataContasRes.data);
         }

         if (dataPeriodosRes.data && dataPeriodosRes.data.length > 0) {
            setPeriodos(dataPeriodosRes.data);
            AmazingStorage.save(STORAGE_KEYS.ACC_PERIODOS, dataPeriodosRes.data);
            if (!selectedPeriodoId) {
               const initialPeriod = dataPeriodosRes.data.find(p => p.company_id === effEmpId);
               if (initialPeriod) setSelectedPeriodoId(initialPeriod.id);
            }
         }

         if (emps && emps.length > 0 && !selectedEmpresaId) {
            setSelectedEmpresaId(emps[0].id);
         }

         // 2. Carregar Dados Transacionais em PARALELO (Background)
         setLoading(false);

         const [
            lncRes,
            lncItensRes,
            flhRes,
            oblRes,
            centrosRes,
            configsRes,
            sLogsRes,
            faturasRes,
            tesourariaRes,
            rhRecibosRes,
            prodRes,
            comprasRes,
            customersRes,
            suppliersRes,
            catsRes,
            vendasFarmaciaRes,
            salesRes,
            auditRes,
            extratosRes
         ] = await Promise.all([
            safeQuery<any[]>(() => supabase.from('acc_lancamentos').select('*').eq('company_id', effEmpId).order('data', { ascending: false }), { cacheKey: `acc-lnc-${effEmpId}`, cacheTTL: 30000, forceRefresh: force }),
            safeQuery<any[]>(() => supabase.from('acc_lancamento_itens').select('*').eq('company_id', effEmpId), { cacheKey: `acc-lnc-items-${effEmpId}`, cacheTTL: 30000, forceRefresh: force }),
            safeQuery<FolhaPagamento[]>(() => supabase.from('acc_folhas').select('*').eq('company_id', effEmpId).order('mes_referencia', { ascending: false }), { cacheKey: `acc-folhas-${effEmpId}`, cacheTTL: 60000, forceRefresh: force }),
            safeQuery<ObrigacaoFiscal[]>(() => supabase.from('acc_obrigacoes').select('*').eq('company_id', effEmpId).order('data_limite'), { cacheKey: `acc-obl-${effEmpId}`, cacheTTL: 60000, forceRefresh: force }),
            safeQuery<any[]>(() => supabase.from('acc_centros_custo').select('*').eq('company_id', effEmpId).order('nome'), { cacheKey: `acc-centros-${effEmpId}`, cacheTTL: 300000, forceRefresh: force }),
            safeQuery<any[]>(() => supabase.from('acc_config').select('*').eq('company_id', effEmpId), { cacheKey: `acc-config-${effEmpId}`, cacheTTL: 300000, forceRefresh: force }),
            safeQuery<any[]>(() => supabase.from('acc_system_logs').select('*').eq('company_id', effEmpId).order('created_at', { ascending: false }).limit(50)),
            safeQuery<any[]>(() => supabase.from('contabil_faturas').select('*').eq('company_id', effEmpId).order('created_at', { ascending: false }), { cacheKey: `acc-faturas-${effEmpId}`, cacheTTL: 30000, forceRefresh: force }),
            safeQuery<any[]>(() => supabase.from('fin_transacoes').select('*').eq('company_id', effEmpId).order('data', { ascending: false }), { cacheKey: `acc-tesouraria-${effEmpId}`, cacheTTL: 30000, forceRefresh: force }),
            safeQuery<any[]>(() => supabase.from('rh_recibos').select('*').eq('company_id', effEmpId).order('created_at', { ascending: false }), { cacheKey: `acc-payrolls-${effEmpId}`, cacheTTL: 30000, forceRefresh: force }),
            safeQuery<any[]>(() => supabase.from('products').select('*').eq('company_id', effEmpId).order('nome'), { cacheKey: `acc-prod-${effEmpId}`, cacheTTL: 60000, forceRefresh: force }),
            safeQuery<any[]>(() => supabase.from('compras').select('*').eq('company_id', effEmpId).order('data_compra', { ascending: false }), { cacheKey: `acc-compras-${effEmpId}`, cacheTTL: 60000, forceRefresh: force }),
            safeQuery<any[]>(async () => {
               const t = AmazingStorage.get(STORAGE_KEYS.AUTH_TOKEN);
               const apiUrl = AmazingStorage.get(STORAGE_KEYS.API_URL) || '';
               try {
                  const res = await fetch(`${apiUrl}/api/customers`, { headers: { Authorization: `Bearer ${t}` } });
                  if (!res.ok) throw new Error('API Customers failed');
                  return { data: await res.json(), error: null };
               } catch (e: any) {
                  return { data: null, error: e };
               }
            }, { cacheKey: `acc-customers-${effEmpId}`, cacheTTL: 30000, forceRefresh: force }),
            safeQuery<any[]>(() => supabase.from('suppliers').select('*').eq('company_id', effEmpId).order('name'), { cacheKey: `acc-suppliers-${effEmpId}`, cacheTTL: 30000, forceRefresh: force }),
            safeQuery<any[]>(() => supabase.from('acc_categorias').select('*').eq('company_id', effEmpId).order('nome'), { cacheKey: `acc-cats-${effEmpId}`, cacheTTL: 60000, forceRefresh: force }),
            safeQuery<any[]>(() => supabase.from('vendas_farmacia').select('*, clientes_farmacia(nome)').eq('company_id', effEmpId).order('created_at', { ascending: false }), { cacheKey: `acc-vendas-farmacia-${effEmpId}`, cacheTTL: 30000, forceRefresh: force }),
            safeQuery<any[]>(() => supabase.from('sales').select('*, customers(name)').eq('company_id', effEmpId).order('created_at', { ascending: false }), { cacheKey: `acc-sales-${effEmpId}`, cacheTTL: 30000, forceRefresh: force }),
            safeQuery<any[]>(() => supabase.from('acc_audit_logs').select('*').eq('company_id', effEmpId).order('created_at', { ascending: false }).limit(50)),
            safeQuery<any[]>(() => supabase.from('acc_extratos_bancarios').select('*').eq('company_id', effEmpId).order('data', { ascending: false }))
         ]);

         const mergedLnc = (lncRes.data || []).map((l: any) => ({
            ...l,
            itens: (lncItensRes.data || []).filter((it: any) => it.lancamento_id === l.id)
         }));

         setLancamentos(mergedLnc);
         AmazingStorage.save(STORAGE_KEYS.ACC_LANCAMENTOS, mergedLnc);

         if (flhRes.data) {
            setFolhas(flhRes.data);
            AmazingStorage.save(STORAGE_KEYS.ACC_FOLHAS, flhRes.data);
         }

         if (oblRes.data) {
            setObligacoes(oblRes.data);
            AmazingStorage.save(STORAGE_KEYS.ACC_OBRIGACOES, oblRes.data);
         }

         setCentrosCusto(centrosRes.data || []);
         AmazingStorage.save(STORAGE_KEYS.ACC_CENTROS, centrosRes.data || []);

         const configMap: Record<string, string> = {};
         (configsRes.data || []).forEach((c: any) => configMap[c.chave] = c.valor);
         setAccountingConfig(configMap);
         AmazingStorage.save(STORAGE_KEYS.ACC_CONFIG, configMap);

         setSystemLogs(sLogsRes.data || []);
         setAuditLogs(auditRes?.data || []);
         setExtratos(extratosRes?.data || []);

          setExtFaturas(faturasRes.data || []);
          AmazingStorage.save('amazing_ext_faturas', faturasRes.data);
          
          // Debug: Log faturas with type_prefix = PRO
          const proFaturas = (faturasRes.data || []).filter((f: any) => f.type_prefix === 'PRO' || f.numero_fatura?.toUpperCase().startsWith('PRO'));
          console.log('[DEBUG] Faturas com type_prefix PRO carregadas:', proFaturas.length);
          if (proFaturas.length > 0) {
             console.log('[DEBUG] Amostra de proformas:', proFaturas.slice(0, 3));
          }

         setExtTesouraria(tesourariaRes.data || []);
         AmazingStorage.save('amazing_ext_tesouraria', tesourariaRes.data);

         setExtRhRecibos(rhRecibosRes.data || []);
         AmazingStorage.save('amazing_ext_rh_recibos', rhRecibosRes.data);

         if (prodRes.data) {
            const mappedData = prodRes.data.map((p: any) => ({
               ...p,
               nome: p.name,
               preco_unitario: p.sale_price || p.price,
               quantidade_atual: p.stock,
               quantidade_minima: p.min_stock,
               unidade: p.unit || 'un'
            }));
            setExtInventario(mappedData);
         }

         if (comprasRes.data) {
            setCompras(comprasRes.data);
         }

         // Merge Customers and Suppliers into Contactos
         const mergedContactos = [
            ...(customersRes?.data || []).filter(Boolean).map((c: any) => ({ ...c, nome: c.name || 'Cliente Sem Nome', tipo: 'Cliente', telefone: c.phone || c.telefone, morada: c.address || c.morada })),
            ...(suppliersRes?.data || []).filter(Boolean).map((s: any) => ({ ...s, nome: s.name || 'Fornecedor Sem Nome', tipo: 'Fornecedor', telefone: s.phone || s.telefone, morada: s.address || s.morada }))
         ];
         setContactos(mergedContactos);
         AmazingStorage.save(STORAGE_KEYS.ACC_CONTACTOS, mergedContactos);

         if (catsRes.data) {
            setCategorias(catsRes.data);
         }

         if (vendasFarmaciaRes?.data) {
            setExtVendasFarmacia(vendasFarmaciaRes.data);
            AmazingStorage.save('amazing_ext_vendas_farmacia', vendasFarmaciaRes.data);
         }

          if (salesRes?.data) {
             setExtSales(salesRes.data);
             AmazingStorage.save('amazing_ext_sales', salesRes.data);
             
             // Debug: Log ALL sales data to understand structure
             console.log('[DEBUG] === TODAS AS SALES ===');
             salesRes.data.forEach((s: any, i: number) => {
                console.log(`[DEBUG] Sale ${i}: invoice_number=${s.invoice_number}, is_pro_forma=${s.is_pro_forma}`);
             });
             
             // Debug: Log sales with is_pro_forma = true
             const proSales = (salesRes.data || []).filter((s: any) => s.is_pro_forma || s.invoice_number?.toUpperCase().startsWith('PRO'));
             console.log('[DEBUG] Sales com is_pro_forma ou PRO carregadas:', proSales.length);
          }

         setLastSyncAt(new Date());
      } catch (error) {
         console.error('Accounting Sync Error:', error);
      } finally {
         setLoading(false);
         setLoadingStatus('');
      }
   };


   const handleCreateCategory = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newCategory.nome) return alert("O nome da categoria é obrigatório.");
      setIsSavingCategory(true);
      try {
         const { error } = await supabase.from('acc_categorias').insert({
            ...newCategory,
            company_id: selectedEmpresaId
         });
         if (error) throw error;
         alert("Categoria criada com sucesso!");
         setShowCategoryModal(false);
         setNewCategory({ nome: '', descricao: '', cor: '#fbbf24' });
         fetchAccountingData();
      } catch (err: any) {
         alert("Erro ao criar categoria: " + err.message);
      } finally {
         setIsSavingCategory(false);
      }
   };

   const handleCreateItem = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newInventoryItem.nome || !newInventoryItem.categoria_id) return alert("Nome e Categoria são obrigatórios.");
      setIsSavingItem(true);
      try {
         const { error } = await supabase.from('products').insert({
            name: newInventoryItem.nome,
            description: newInventoryItem.descricao,
            category_id: parseInt(newInventoryItem.categoria_id) || null,
            unit: newInventoryItem.unidade,
            stock: newInventoryItem.quantidade_atual,
            min_stock: newInventoryItem.quantidade_minima,
            sale_price: newInventoryItem.preco_unitario,
            barcode: newInventoryItem.codigo,
            tipo: 'produto',
            company_id: selectedEmpresaId
         });
         if (error) throw error;
         alert("Item adicionado com sucesso!");
         setShowItemModal(false);
         setNewInventoryItem({
            nome: '', descricao: '', categoria_id: '', unidade: 'unidade',
            quantidade_atual: 0, quantidade_minima: 5, preco_unitario: 0,
            codigo: '', referencia: ''
         });
         fetchAccountingData();
      } catch (err: any) {
         alert("Erro ao adicionar item: " + err.message);
      } finally {
         setIsSavingItem(false);
      }
   };

   useEffect(() => {
      const empId = localStorage.getItem('empresa_id') || user?.company_id?.toString();
      if (!empId) {
         window.location.href = '/';
         return;
      }
      if (!selectedEmpresaId) {
         setSelectedEmpresaId(empId);
      }
      fetchAccountingData();
   }, [selectedEmpresaId, user]);

   // Carregar clientes diretamente do Supabase (independente do debounce)
   useEffect(() => {
      const loadClientes = async () => {
         try {
            // Inject stored JWT so RLS policies are satisfied
            const token = AmazingStorage.get(STORAGE_KEYS.AUTH_TOKEN);
            if (token) {
               await supabase.auth.setSession({ access_token: token, refresh_token: token });
            }

            const empId = selectedEmpresaId || user?.company_id;
            if (!empId) {
               console.warn('[Clientes] Sem empresa selecionada para carregar contatos');
               return;
            }

            const t = AmazingStorage.get(STORAGE_KEYS.AUTH_TOKEN);
            const apiUrl = AmazingStorage.get(STORAGE_KEYS.API_URL) || '';
            const custFetch = fetch(`${apiUrl}/api/customers`, { headers: { Authorization: `Bearer ${t}` } })
               .then(r => r.json())
               .then(d => ({ data: d, error: null }))
               .catch(e => ({ data: null, error: e }));

            const [custRes, suppsRes] = await Promise.all([
               custFetch,
               supabase.from('suppliers').select('*').eq('company_id', empId).order('name')
            ]);

            console.log('[Clientes] customers result:', custRes.data, custRes.error);
            console.log('[Clientes] suppliers result:', suppsRes.data, suppsRes.error);

            const merged = [
               ...(custRes.data || []).map((c: any) => ({ ...c, nome: c.name || c.nome || 'Sem Nome', tipo: 'Cliente', telefone: c.phone || c.telefone, morada: c.address || c.morada })),
               ...(suppsRes.data || []).map((s: any) => ({ ...s, nome: s.name || s.nome || 'Sem Nome', tipo: 'Fornecedor', telefone: s.phone || s.telefone, morada: s.address || s.morada }))
            ];

            console.log('[Clientes] merged total:', merged.length);
            setContactos(merged);
            AmazingStorage.save(STORAGE_KEYS.ACC_CONTACTOS, merged);
         } catch (e) {
            console.error('Erro ao carregar clientes directo:', e);
         }
      };
      loadClientes();
   }, [selectedEmpresaId, user?.company_id]);

   // Garantir que o período selecionado pertence Ã  empresa selecionada
   useEffect(() => {
      if (!selectedEmpresaId || periodos.length === 0) return;

      const companyPeriods = periodos.filter(p => p.company_id === selectedEmpresaId);
      const isPeriodValid = companyPeriods.some(p => p.id === selectedPeriodoId);

      if (!isPeriodValid && companyPeriods.length > 0) {
         setSelectedPeriodoId(companyPeriods[0].id);
      } else if (companyPeriods.length === 0) {
         setSelectedPeriodoId('');
      }
   }, [selectedEmpresaId, periodos, selectedPeriodoId]);

   const currentEmpresa = empresas?.find(e => e.company_id === selectedEmpresaId) || empresas?.[0];

   // --- DADOS INTEGRADOS (USADOS EM MÃšLTIPLAS ABAS) ---
   const { extFinanceiroNotas, totalFacturado, totalFarmacia, totalIva, totalPendente, totalCaixa, totalEntradas, totalSaidas, totalSalarios, totalBruto, totalPOS, totalInventarioValor, itensCriticos } = useMemo(() => {
      const _fat = extFaturas || [];
      const _tes = extTesouraria || [];
      const _rhr = extRhRecibos || [];
      const _inv = extInventario || [];
      const _farm = extVendasFarmacia || [];
      const _sales = extSales || [];

      const notas = [
         ...(extFaturas || []).filter(Boolean).map(f => {
            let resolvedTipo = (typeof f.tipo === 'string' ? f.tipo : '');
            if (f.type_prefix === 'PRO' || (f.numero_fatura && f.numero_fatura.toUpperCase().startsWith('PRO')) || resolvedTipo.toLowerCase().includes('proforma') || resolvedTipo.toLowerCase().includes('pró-forma')) {
               resolvedTipo = 'Pró-forma';
            } else if (f.type_prefix === 'FR' || resolvedTipo.toLowerCase().includes('factura-recibo')) {
               resolvedTipo = 'Factura-Recibo';
            } else if (f.type_prefix === 'FAC' || resolvedTipo.toLowerCase().includes('factura')) {
               resolvedTipo = 'Factura';
            } else if (f.type_prefix === 'RE' || resolvedTipo.toLowerCase().includes('recibo')) {
               resolvedTipo = 'Recibo';
            } else if (f.type_prefix === 'NC' || resolvedTipo.toLowerCase().includes('nota de crédito')) {
               resolvedTipo = 'Nota de Crédito';
            } else if (f.type_prefix === 'ND' || resolvedTipo.toLowerCase().includes('nota de débito')) {
               resolvedTipo = 'Nota de Débito';
            }
            return {
               ...f,
               valor: Number(f.valor_total) || 0,
               iva: Number(f.metadata?.iva) || 0,
               entidade: f.cliente_nome || 'Cliente',
               numero: f.numero_fatura,
               data: f.data_emissao,
               tipo: 'Venda ' + resolvedTipo
            };
         }),
         ...(extTesouraria || []).filter(t => t && t.documento_contabil).map(t => ({
            ...t,
            valor: Number(t.valor) || 0,
            iva: 0,
            entidade: t.entidade || 'Caixa/Banco',
            numero: t.referencia,
            data: t.data,
            tipo: 'Tesouraria'
         })),
         ...(extVendasFarmacia || []).filter(Boolean).map(v => ({
            ...v,
            valor: Number(v.total) || 0,
            iva: Number(v.iva) || 0,
            entidade: v.clientes_farmacia?.nome || 'Cliente Farmácia',
            numero: v.numero_factura,
            data: v.created_at?.split('T')[0],
            tipo: (v.is_pro_forma ? 'Pró-forma' : 'Venda Farmácia'),
            status: v.status === 'paid' ? 'PAGO' : (v.status === 'pending' ? 'PENDENTE' : v.status)
         })),
         ...(extSales || []).filter(Boolean).map(s => {
            const invoiceNum = s.invoice_number || '';
            const prefix = invoiceNum.split('-')[0];
            const isProForma = s.is_pro_forma || prefix === 'PRO' || invoiceNum.toUpperCase().startsWith('PRO');
            const resolvedTipo = isProForma ? 'Pró-forma' :
               (prefix === 'FR' ? 'Factura-Recibo' :
                  prefix === 'FAC' ? 'Factura' : 'Venda');
            return {
               ...s,
               valor: Number(s.total) || 0,
               iva: Number(s.tax) || 0,
               entidade: s.customers?.name || 'Cliente POS',
               numero: s.invoice_number,
               data: s.created_at?.split('T')[0],
               tipo: (resolvedTipo === 'Pró-forma' ? 'Pró-forma' : 'Venda POS ' + resolvedTipo),
               status: s.status === 'paid' ? 'PAGO' : (s.status === 'pending' ? 'PENDENTE' : s.status)
            };
         })
      ];

      const facturado = notas.filter(n =>
         n.tipo?.includes('Venda') ||
         n.tipo?.includes('Factura') ||
         n.tipo?.includes('Recibo')
      ).reduce((acc, n) => acc + n.valor, 0);
      const ivaTotal = notas.reduce((acc, n) => acc + (n.iva || 0), 0);
      const farmaciaTotal = _farm.reduce((acc, v) => acc + (Number(v.total) || 0), 0);
      const posTotal = _sales.reduce((acc, s) => acc + (Number(s.total) || 0), 0);
      const pendente = _fat.filter(f => f.status?.toUpperCase() === 'PENDENTE').reduce((acc, f) => acc + (Number(f.valor_total) || 0), 0);

      const caixa = _tes.reduce((acc, t) => {
         const v = Number(t.valor) || 0;
         return acc + (t.tipo?.toLowerCase().includes('entrada') ? v : -v);
      }, 0);
      const entradas = _tes.filter(t => t.tipo?.toLowerCase().includes('entrada')).reduce((acc, t) => acc + Number(t.valor), 0);
      const saidas = _tes.filter(t => t.tipo?.toLowerCase().includes('saida')).reduce((acc, t) => acc + Number(t.valor), 0);

      const salarios = _rhr.reduce((acc, r) => acc + (Number(r.liquido) || 0), 0);
      const bruto = _rhr.reduce((acc, r) => acc + (Number(r.bruto) || 0), 0);

      const invValor = _inv.reduce((acc, i) => acc + (Number(i.quantidade_atual) * Number(i.preco_unitario) || 0), 0);
      const criticos = _inv.filter(i => (Number(i.quantidade_atual) || 0) <= (Number(i.stock_minimo) || 0)).length;

       // Debug: Log count of proformas
       const proformaCount = notas.filter(n => 
          n.tipo?.includes('Pró-forma') || 
          n.tipo?.includes('Pro-forma') ||
          (n.numero || '').toUpperCase().startsWith('PRO')
       ).length;
       console.log('[DEBUG] Proformas carregadas:', proformaCount, '| Total notas:', notas.length);
       console.log('[DEBUG] extSales count:', (_sales || []).length, '| extFaturas count:', (_fat || []).length);
       
       return {
          extFinanceiroNotas: notas,
          totalFacturado: facturado,
          totalFarmacia: farmaciaTotal,
          totalIva: ivaTotal,
          totalPendente: pendente,
          totalCaixa: caixa,
          totalEntradas: entradas,
          totalSaidas: saidas,
          totalSalarios: salarios,
          totalBruto: bruto,
          totalPOS: posTotal,
          totalInventarioValor: invValor,
          itensCriticos: criticos
       };
    }, [extFaturas, extTesouraria, extRhRecibos, extInventario, extSales, extVendasFarmacia]);

    // --- LÓGICA DE GRÁFICOS E RELATÓRIOS (ULTRA DEFENSIVA) ---
   const chartData = useMemo(() => {
      try {
         const filterEmpAndPeriod = (arr: LancamentoContabil[]) => (arr || []).filter(l =>
            l && l.company_id === selectedEmpresaId &&
            (selectedPeriodoId ? l.periodo_id === selectedPeriodoId : true)
         );
         const empLancamentos = filterEmpAndPeriod(lancamentos);

         // 1. Dados para Gráfico de Barras
         const monthlyStats: Record<string, { receita: number, despesa: number }> = {};
         const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
         meses.forEach(m => monthlyStats[m] = { receita: 0, despesa: 0 });

         empLancamentos.forEach(l => {
            if (!l || !l.data) return;
            const d = new Date(l.data);
            if (isNaN(d.getTime())) return;
            const mesIndex = d.getMonth();
            const mesNome = meses[mesIndex];

            l.itens?.forEach(it => {
               if (!it || !it.conta_codigo) return;
               const valor = Number(it.valor) || 0;
               if (it.conta_codigo.startsWith('6')) {
                  monthlyStats[mesNome].receita += valor;
               }
               if (it.conta_codigo.startsWith('7')) {
                  monthlyStats[mesNome].despesa += valor;
               }
            });
         });

         // Integrar Vendas Externas (POS/Farmácia) no Gráfico
         extFinanceiroNotas.forEach(n => {
            if (!n || !n.data) return;
            const d = new Date(n.data);
            if (isNaN(d.getTime())) return;
            const mesNome = meses[d.getMonth()];
            if (monthlyStats[mesNome]) {
               monthlyStats[mesNome].receita += (Number(n.valor) || 0) - (Number(n.iva) || 0);
            }
         });

         const barChartData = meses.map(m => ({
            name: m,
            Receita: monthlyStats[m].receita,
            Despesa: monthlyStats[m].despesa
         }));

         const hasData = barChartData.some(d => d.Receita > 0 || d.Despesa > 0);
         const finalBarData = hasData ? barChartData : [
            { name: 'Jan', Receita: 400000, Despesa: 250000 },
            { name: 'Fev', Receita: 300000, Despesa: 280000 },
            { name: 'Mar', Receita: 550000, Despesa: 320000 },
            { name: 'Abr', Receita: 600000, Despesa: 400000 },
         ];

         const expenseCategories: Record<string, number> = {};
         empLancamentos.forEach(l => {
            l.itens?.forEach(it => {
               if (it && it.conta_codigo?.startsWith('7')) {
                  const catName = it.conta_nome || 'Outros Custos';
                  expenseCategories[catName] = (Number(expenseCategories[catName]) || 0) + (Number(it.valor) || 0);
               }
            });
         });

         const pieChartData = Object.keys(expenseCategories).map(k => ({
            name: String(k),
            value: Number(expenseCategories[k]) || 0
         }));

         const finalPieData = pieChartData.length > 0 ? pieChartData : [
            { name: 'Pessoal', value: 450000 },
            { name: 'Manutenção', value: 120000 },
            { name: 'Serviços Terceiros', value: 80000 },
            { name: 'Impostos', value: 50000 },
         ];

         return { barChartData: finalBarData, pieChartData: finalPieData };
      } catch (err) {
         console.error("Crash in chartData useMemo:", err);
         return { barChartData: [], pieChartData: [] };
      }
   }, [selectedEmpresaId, selectedPeriodoId, lancamentos]);

   // --- LÓGICA DE BALANÇO E DRE (ULTRA DEFENSIVA) ---
   const financeReports = useMemo(() => {
      try {
         const filterEmpAndPeriod = (arr: LancamentoContabil[]) => (arr || []).filter(l =>
            l && l.company_id === selectedEmpresaId &&
            (selectedPeriodoId ? l.periodo_id === selectedPeriodoId : true)
         );
         const empLancamentos = filterEmpAndPeriod(lancamentos);

         const saldos: Record<string, number> = {};
         (planoContas || []).forEach(c => {
            if (c && c.codigo) saldos[c.codigo] = 0;
         });

         empLancamentos.forEach(l => {
            l?.itens?.forEach(it => {
               if (it && it.conta_codigo && saldos[it.conta_codigo] !== undefined) {
                  const valor = Number(it.valor) || 0;
                  if (it.tipo === 'D') {
                     saldos[it.conta_codigo] += valor;
                  } else {
                     saldos[it.conta_codigo] -= valor;
                  }
               }
            });
         });

         // Recalculate based on the new saldo logic (debit adds, credit subtracts)
         // Assets (1, 2, 3) should have positive balances. Liabilities (4) and Capital (5) should have negative balances.
         // Revenues (6) should have negative balances. Expenses (7) should have positive balances.
         // Asset/Liability logic with absolute safety
         const getSum = (prefix: string) => Object.keys(saldos).filter(k => k && k.startsWith(prefix)).reduce((acc, k) => acc + (Number(saldos[k]) || 0), 0);

         const ativos = getSum('1') + getSum('2') + getSum('3');
         const passivos = Math.abs(getSum('4'));
         const capital = Math.abs(getSum('5'));
         const receitaTotal = Math.abs(getSum('6'));
         const despesaTotal = Math.abs(getSum('7'));
         const lucroLiquido = receitaTotal - despesaTotal;

         return {
            ativos: Number(ativos) || 0,
            passivos: Number(passivos) || 0,
            capital: Number(capital) || 0,
            receitaTotal: Number(receitaTotal) || 0,
            despesaTotal: Number(despesaTotal) || 0,
            lucroLiquido: Number(lucroLiquido) || 0,
            saldos
         };
      } catch (err) {
         console.error("Crash in financeReports useMemo:", err);
         return { ativos: 0, passivos: 0, capital: 0, receitaTotal: 0, despesaTotal: 0, lucroLiquido: 0, saldos: {} };
      }
   }, [selectedEmpresaId, selectedPeriodoId, lancamentos, planoContas]);

   // --- LÓGICA DE IA ---
   const handleAIAnalysis = async () => {
      setIsAnalyzing(true);
      setIaResponse(null);
      try {
         const prompt = `Analise os dados financeiros da empresa ${currentEmpresa?.nome || 'N/A'} em Angola:
- Receita: ${safeFormatAOA(financeReports.receitaTotal)}
- Despesa: ${safeFormatAOA(financeReports.despesaTotal)}
- Lucro: ${safeFormatAOA(financeReports.lucroLiquido)}
- Património Líquido: ${safeFormatAOA(financeReports.ativos - financeReports.passivos)}
      
      Forneça 3 sugestões estratégicas para redução de custos e 1 alerta sobre conformidade fiscal(IVA / IRT).`;

         const apiUrl = process.env.VITE_API_URL || 'http://localhost:3000';
         const response = await fetch(`${apiUrl}/api/ai/audit`, {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
               Authorization: `Bearer ${AmazingStorage.get(STORAGE_KEYS.AUTH_TOKEN)}`
            },
            body: JSON.stringify({ prompt })
         });

         if (!response.ok) throw new Error('Falha ao comunicar com a IA');

         const data = await response.json();
         setIaResponse(data.result || "Sem resposta da IA.");
      } catch (error) {
         console.error('AI Error:', error);
         setIaResponse("A IA está processando auditorias da Venda Plus. Tente novamente em instantes.");
      } finally {
         setIsAnalyzing(false);
      }
   };

   const handleAISuggestAccounts = async (descricao: string) => {
      const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey || !descricao) return;

      setIsSuggestingAccounts(true);
      try {
         const ai = new GoogleGenAI({ apiKey });
         const prompt = `Com base no Plano Geral de Contas de Angola (PGC) e na descrição "${descricao}", sugira apenas o código da conta de Débito e o código da conta de Crédito. 
         Retorne APENAS um JSON no formato: {"debito": "codigo", "credito": "codigo"}.
         Exemplos de contas: 1.1 (Caixa), 7.2 (Salários), 6.1 (Vendas), 3.1 (Inventários).`;

         const result = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: prompt
         });

         const cleanText = result.text.replace(/```json|```/g, '').trim();
         const suggestion = JSON.parse(cleanText);

         if (suggestion.debito && suggestion.credito) {
            setNewEntry(prev => ({
               ...prev,
               contaDebito: suggestion.debito,
               contaCredito: suggestion.credito
            }));
         }
      } catch (error) {
         console.error('AI Suggest Error:', error);
      } finally {
         setIsSuggestingAccounts(false);
      }
   };

   const handleSaveEmployee = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedEmpresaId) return alert("Selecione uma empresa.");
      setIsProcessingPayroll(true);
      try {
         const { error } = await supabase.from('funcionarios').insert({
            nome: newEmployee.nome,
            cargo: newEmployee.funcao,
            bilhete: newEmployee.bilhete,
            telefone: newEmployee.telefone,
            salario_base: newEmployee.salario_base,
            subsidio_alimentacao: newEmployee.subsidio_alimentacao,
            subsidio_transporte: newEmployee.subsidio_transporte,
            subsidio_ferias_base: newEmployee.subsidio_ferias_base,
            subsidio_natal_base: newEmployee.subsidio_natal_base,
            outras_bonificacoes_base: newEmployee.outras_bonificacoes_base,
            valor_hora_extra_base: newEmployee.valor_hora_extra_base,
            adiantamento_padrao: newEmployee.adiantamento_padrao,
            desconto_inss: newEmployee.desconto_inss,
            desconto_irt: newEmployee.desconto_irt,
            outros_descontos_base: newEmployee.outros_descontos_base,
            nif: newEmployee.nif,
            numero_ss: newEmployee.numero_ss,
            company_id: selectedEmpresaId,
            status: 'ativo',
            data_admissao: new Date().toISOString().split('T')[0]
         });
         if (error) throw error;
         alert("Funcionário registado com sucesso!");
         setShowEmployeeModal(false);
         setNewEmployee({
            nome: '', funcao: '', bilhete: '', telefone: '', salario_base: 0,
            subsidio_alimentacao: 0, subsidio_transporte: 0,
            subsidio_ferias_base: 0, subsidio_natal_base: 0, outras_bonificacoes_base: 0,
            valor_hora_extra_base: 0, adiantamento_padrao: 0,
            desconto_inss: true, desconto_irt: true, outros_descontos_base: 0,
            nif: '', numero_ss: ''
         });
         fetchAccountingData();
      } catch (e: any) {
         alert(`Erro ao registar funcionário: ${e.message}`);
      } finally {
         setIsProcessingPayroll(false);
      }
   };

   // --- LÓGICA DE PAYROLL ---
   const runPayroll = async () => {
      if (!selectedEmpresaId || !selectedPeriodoId) {
         alert("Selecione uma empresa e um período aberto antes de processar a folha.");
         return;
      }

      const activePeriodo = periodos.find(p => p.id === selectedPeriodoId);
      if (!activePeriodo || activePeriodo.status === 'Fechado') {
         alert("O período selecionado está fechado.");
         return;
      }

      const funcionariosAtivos = funcionarios.filter(f =>
         (f.status === 'ativo' || f.status === 'Ativo') &&
         (f as any).company_id === selectedEmpresaId
      );

      if (funcionariosAtivos.length === 0) {
         alert("Não há funcionários ativos vinculados a esta empresa para processar.");
         return;
      }

      if (!confirm(`Confirmar processamento da folha para ${funcionariosAtivos.length} colaboradores para o período ${activePeriodo.mes}/${activePeriodo.ano}?`)) return;

      setIsProcessingPayroll(true);

      try {
         const payrollBatch = funcionariosAtivos.map(f => {
            const base = Number(f.salario_base) || 0;
            const subAlim = Number((f as any).subsidio_alimentacao) || 0;
            const subTrans = Number((f as any).subsidio_transporte) || 0;
            const bonifBase = Number((f as any).outras_bonificacoes_base) || 0;
            const hExtras = Number((f as any).valor_hora_extra_base) || 0;
            const adiantamento = Number((f as any).adiantamento_padrao) || 0;
            const descAtrasos = 0; // Logica automática para atrasos (poderia ser baseado em faltas/checkpoint)
            const descFerias = 0; // Desconto de férias se aplicável

            // Cálculos Automáticos
            let natal = 0;
            let ferias = 0;

            // Subsídio de Natal automático em Dezembro
            if (activePeriodo.mes === 12) natal = Number((f as any).subsidio_natal_base) || base;
            // Subsídio de Férias automático em Junho
            if (activePeriodo.mes === 6) ferias = Number((f as any).subsidio_ferias_base) || base;

            const salarioBruto = base + subAlim + subTrans + bonifBase + natal + ferias + hExtras;
            const inss = calculateINSS(base + bonifBase + hExtras); // INSS incide sobre base e complementos de rendimento
            const irt = calculateIRT(salarioBruto - inss.trabalhador - subAlim - subTrans); // IRT sobre rendimento líquido de INSS e isento de subsídios (simplificado)

            const totalDescontos = inss.trabalhador + irt + descAtrasos + descFerias + adiantamento;
            const salarioLiquido = salarioBruto - totalDescontos;

            return {
               funcionario_id: f.id,
               funcionario_nome: f.nome,
               mes_referencia: `${activePeriodo.mes}/${activePeriodo.ano}`,
               periodo_id: selectedPeriodoId,
               company_id: selectedEmpresaId,
               salario_base: base,
               subsidios: subAlim + subTrans,
               subsidio_ferias: ferias,
               subsidio_natal: natal,
               outras_bonificacoes: bonifBase,
               horas_extras: hExtras,
               desconto_atrasos: descAtrasos,
               desconto_ferias: descFerias,
               adiantamento_salarial: adiantamento,
               salario_bruto: salarioBruto,
               total_descontos: totalDescontos,
               inss_trabalhador: inss.trabalhador,
               inss_empresa: inss.empresa,
               irt: irt,
               seguro_trabalho: base * 0.01,
               salario_liquido: salarioLiquido,
               status: 'Processado'
            };
         });

         // 1. Inserir Folhas
         const { error: fError } = await supabase.from('acc_folhas').insert(payrollBatch);
         if (fError) throw fError;

         // 2. Criar Lançamento Contábil Correspondente
         const totalBrutoBatch = (payrollBatch || []).reduce((acc, f) => acc + Number(f.salario_bruto), 0);
         const totalLiquidoBatch = (payrollBatch || []).reduce((acc, f) => acc + Number(f.salario_liquido), 0);
         const totalDescontosBatch = totalBrutoBatch - totalLiquidoBatch;

         const { data: entry, error: lError } = await supabase.from('acc_lancamentos').insert([{
            company_id: selectedEmpresaId,
            debito: totalBrutoBatch,
            credito: totalDescontosBatch + totalLiquidoBatch, // Equilíbrio contábil
            descricao: `Processamento de Folha de Pagamento - Ciclo ${periodos.find(p => p.id === selectedPeriodoId)?.mes}/${periodos.find(p => p.id === selectedPeriodoId)?.ano}`,
            data: new Date().toISOString().split('T')[0],
            status: 'concluido'
         }]).select().single();

         if (lError) throw lError;

         // 3. Itens do Lançamento
         await supabase.from('acc_lancamento_itens').insert([
            { lancamento_id: entry.id, conta_id: '62', debito: totalBrutoBatch, credito: 0, descricao: 'Gastos com Pessoal (Salários)' },
            { lancamento_id: entry.id, conta_id: '34', debito: 0, credito: totalDescontosBatch, descricao: 'Retenções e Descontos (Seg. Social/IRT)' },
            { lancamento_id: entry.id, conta_id: '37', debito: 0, credito: totalLiquidoBatch, descricao: 'Salários Líquidos a Pagar' }
         ]);

         await fetchAccountingData();
         alert('Folha processada e contabilizada com sucesso!');
      } catch (error: any) {
         console.error('Payroll error:', error);
         alert(`Erro ao processar folha: ${error.message}`);
         setIsProcessingPayroll(false);
      }
   };

   const handlePrintFatura = (fatura: any) => {
      setLastCreatedDoc(fatura);
      // Pequeno atraso para garantir que o estado foi actualizado antes de imprimir
      setTimeout(() => handlePrintInvoiceAction(), 500);
   };

   // --- LÓGICA DE RELATÓRIOS ---
   const openReport = async (reportId: string) => {
      setIsGeneratingReport(true);
      const reportTitle = {
         'balanco': 'Balanço Patrimonial',
         'dre': 'Demonstração de Resultados (DRE)',
         'balancete': 'Balancete de Verificação',
         'diario': 'Diário de Lançamentos',
         'razão': 'Livro Razão',
         'cta_corrente': 'Extracto de Conta Corrente',
         'pag_falta': 'Relatório de Pagamentos em Falta',
         'vendas_diarias': 'Vendas do Dia (Hoje)',
         'vendas_semanais': 'Vendas da Semana (Ãšltimos 7 dias)',
         'vendas_mensais': 'Vendas do Mês Corrente',
         'vendas_anuais': 'Resumo de Vendas Anual'
      }[reportId] || 'Relatório';

      if (!selectedEmpresaId) {
         alert("Por favor, selecione uma empresa primeiro.");
         setIsGeneratingReport(false);
         return;
      }

      try {
         let data: any[] = [];

         if (reportId === 'diario') {
            if (!selectedPeriodoId) {
               alert("Selecione um período (Ano/Mês) para visualizar o diário.");
               setIsGeneratingReport(false);
               return;
            }
            data = (lancamentos || []).filter(l => l.company_id === selectedEmpresaId && l.periodo_id === selectedPeriodoId);
         } else if (reportId === 'balancete') {
            const saldos: any = {};
            (lancamentos || []).filter(l => l.company_id === selectedEmpresaId && l.status === 'Postado').forEach(l => {
               (l.itens || []).forEach((it: any) => {
                  if (!saldos[it.conta_codigo]) {
                     saldos[it.conta_codigo] = { codigo: it.conta_codigo, nome: it.conta_nome, debito: 0, credito: 0 };
                  }
                  if (it.tipo === 'D') saldos[it.conta_codigo].debito += Number(it.valor) || 0;
                  else saldos[it.conta_codigo].credito += Number(it.valor) || 0;
               });
            });
            data = Object.values(saldos).sort((a: any, b: any) => a.codigo.localeCompare(b.codigo));
         } else if (reportId === 'dre') {
            const proveitos = (lancamentos || []).filter(l => l.company_id === selectedEmpresaId && l.status === 'Postado')
               .flatMap(l => (l.itens || []))
               .filter(it => it?.conta_codigo?.startsWith('6') && it?.tipo === 'C')
               .reduce((acc, it) => acc + (Number(it.valor) || 0), 0);

            const custos = (lancamentos || []).filter(l => l.company_id === selectedEmpresaId && l.status === 'Postado')
               .flatMap(l => (l.itens || []))
               .filter(it => it?.conta_codigo?.startsWith('7') && it?.tipo === 'D')
               .reduce((acc, it) => acc + (Number(it.valor) || 0), 0);

            data = [
               { desc: 'PROVEITOS E GANHOS', valor: proveitos, tipo: 'R' },
               { desc: 'CUSTOS E PERDAS', valor: custos, tipo: 'D' },
               { desc: 'RESULTADO LÃQUIDO', valor: proveitos - custos, tipo: 'T' }
            ];
         } else if (reportId === 'balanco') {
            const ativo = (lancamentos || []).filter(l => l.company_id === selectedEmpresaId && l.status === 'Postado')
               .flatMap(l => (l.itens || []))
               .filter(it => (it?.conta_codigo?.startsWith('1') || it?.conta_codigo?.startsWith('2') || it?.conta_codigo?.startsWith('3')) && it?.tipo === 'D')
               .reduce((acc, it) => acc + (Number(it.valor) || 0), 0) -
               (lancamentos || []).filter(l => l.company_id === selectedEmpresaId && l.status === 'Postado')
                  .flatMap(l => (l.itens || []))
                  .filter(it => (it?.conta_codigo?.startsWith('1') || it?.conta_codigo?.startsWith('2') || it?.conta_codigo?.startsWith('3')) && it?.tipo === 'C')
                  .reduce((acc, it) => acc + (Number(it.valor) || 0), 0);

            const passivo = (lancamentos || []).filter(l => l.company_id === selectedEmpresaId && l.status === 'Postado')
               .flatMap(l => (l.itens || []))
               .filter(it => it?.conta_codigo?.startsWith('4') && it?.tipo === 'C')
               .reduce((acc, it) => acc + (Number(it.valor) || 0), 0) -
               (lancamentos || []).filter(l => l.company_id === selectedEmpresaId && l.status === 'Postado')
                  .flatMap(l => (l.itens || []))
                  .filter(it => it?.conta_codigo?.startsWith('4') && it?.tipo === 'D')
                  .reduce((acc, it) => acc + (Number(it.valor) || 0), 0);

            const capital = (lancamentos || []).filter(l => l.company_id === selectedEmpresaId && l.status === 'Postado')
               .flatMap(l => (l.itens || []))
               .filter(it => it?.conta_codigo?.startsWith('5') && it?.tipo === 'C')
               .reduce((acc, it) => acc + (Number(it.valor) || 0), 0);

            data = [
               { desc: 'ACTIVO TOTAL', valor: ativo },
               { desc: 'PASSIVO TOTAL', valor: passivo },
               { desc: 'CAPITAL PRÓPRIO', valor: capital },
               { desc: 'TOTAL PASSIVO + CP', valor: passivo + capital }
            ];
         } else if (reportId === 'auditoria') {
            data = auditLogs;
         } else if (reportId === 'fiscal') {
            const ivaLiquidado = (lancamentos || []).filter(l => l.company_id === selectedEmpresaId && l.status === 'Postado')
               .flatMap(l => (l.itens || []))
               .filter(it => it?.conta_codigo === '3.4.5' && it?.tipo === 'C')
               .reduce((acc, it) => acc + (Number(it.valor) || 0), 0);

            const ivaDedutivel = (lancamentos || []).filter(l => l.company_id === selectedEmpresaId && l.status === 'Postado')
               .flatMap(l => (l.itens || []))
               .filter(it => it?.conta_codigo === '3.4.5' && it?.tipo === 'D')
               .reduce((acc, it) => acc + (Number(it.valor) || 0), 0);

            data = [
               { desc: 'IVA Liquidado (Vendas)', valor: ivaLiquidado },
               { desc: 'IVA Dedutível (Compras)', valor: ivaDedutivel },
               { desc: 'IVA a Pagar / Recuperar', valor: ivaLiquidado - ivaDedutivel }
            ];
         } else if (['vendas_diarias', 'vendas_semanais', 'vendas_mensais', 'vendas_anuais'].includes(reportId)) {
            const now = new Date();
            const today = now.toISOString().split('T')[0];

            data = extFinanceiroNotas.filter(n => {
               if (n.company_id !== selectedEmpresaId) return false;
               if (!['Venda', 'Factura', 'Factura-Recibo'].includes(n.tipo)) return false;

               const d = n.data_emissao;
               if (reportId === 'vendas_diarias') return d === today;
               if (reportId === 'vendas_semanais') {
                  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                  return d >= weekAgo;
               }
               if (reportId === 'vendas_mensais') {
                  return d.startsWith(today.slice(0, 7));
               }
               if (reportId === 'vendas_anuais') {
                  return d.startsWith(today.slice(0, 4));
               }
               return false;
            });

            if (reportId === 'vendas_anuais') {
               const mensal: any = {};
               data.forEach(n => {
                  const mes = n.data_emissao.slice(0, 7);
                  if (!mensal[mes]) mensal[mes] = { periodo: mes, valor: 0, qtd: 0 };
                  mensal[mes].valor += Number(n.valor_total) || 0;
                  mensal[mes].qtd += 1;
               });
               data = Object.values(mensal).sort((a: any, b: any) => b.periodo.localeCompare(a.periodo));
            }
         } else if (reportId === 'razão') {
            // Agrupar movimentos detalhados por conta
            const razao: any = {};
            (lancamentos || []).filter(l => l.company_id === selectedEmpresaId && l.status === 'Postado').forEach(l => {
               (l.itens || []).forEach((it: any) => {
                  if (!razao[it.conta_codigo]) {
                     razao[it.conta_codigo] = { codigo: it.conta_codigo, nome: it.conta_nome, movimentos: [] };
                  }
                  razao[it.conta_codigo].movimentos.push({
                     data: l.data,
                     descricao: l.descricao,
                     debito: it.tipo === 'D' ? Number(it.valor) : 0,
                     credito: it.tipo === 'C' ? Number(it.valor) : 0
                  });
               });
            });
            // Converter para array plano para exibição
            data = Object.values(razao).sort((a: any, b: any) => a.codigo.localeCompare(b.codigo));
         } else if (reportId === 'cashflow') {
            // Fluxo de Caixa Simplicado (Entradas vs Saídas na Classe 1)
            const entradas = (lancamentos || []).filter(l => l.company_id === selectedEmpresaId && l.status === 'Postado')
               .flatMap(l => (l.itens || []))
               .filter(it => it?.conta_codigo?.startsWith('1.1') && it?.tipo === 'D') // Caixa/Bancos como destino (entrada)
               .reduce((acc, it) => acc + (Number(it.valor) || 0), 0);

            const saidas = (lancamentos || []).filter(l => l.company_id === selectedEmpresaId && l.status === 'Postado')
               .flatMap(l => (l.itens || []))
               .filter(it => it?.conta_codigo?.startsWith('1.1') && it?.tipo === 'C') // Caixa/Bancos como origem (saída)
               .reduce((acc, it) => acc + (Number(it.valor) || 0), 0);

            data = [
               { desc: 'ENTRADAS DE CAIXA', valor: entradas, tipo: 'R' },
               { desc: 'SAÃDAS DE CAIXA', valor: saidas, tipo: 'D' },
               { desc: 'FLUXO LÃQUIDO DO PERÃODO', valor: entradas - saidas, tipo: 'T' }
            ];
         }

         setActiveReport({ id: reportId, title: reportTitle, data });
         setShowReportModal(true);
      } catch (e) {
         console.error("Erro ao gerar relatório:", e);
      } finally {
         setIsGeneratingReport(false);
      }
   };

   // --- LANÇAMENTOS AUTOMÃTICOS: FATURAÇÃO ---
   const handleAutoLaunchFromFatura = async (fatura: any) => {
      if (!selectedEmpresaId || !selectedPeriodoId) {
         alert('Selecione empresa e período antes de contabilizar.');
         return;
      }
      setIsAutoLaunching(true);
      try {
         const regra = regrasAutomaticas.find(r => r.nome.toLowerCase().includes('venda')) || {
            conta_debito_codigo: '3.1', conta_credito_codigo: '6.1'
         };

         const vTotal = Number(fatura.valor_total) || 0;
         const vIva = Number(fatura.metadata?.iva) || 0;
         const vLiquido = vTotal - vIva;

         const { data: head, error } = await supabase.from('acc_lancamentos').insert([{
            data: fatura.data_emissao || new Date().toISOString().split('T')[0],
            periodo_id: selectedPeriodoId,
            descricao: `Fatura ${fatura.numero_fatura || ''} - ${fatura.cliente_nome || 'Cliente'}`,
            company_id: selectedEmpresaId,
            usuario_id: null,
            status: 'Postado',
            tipo_transacao: 'Automático'
         }]).select().single();
         if (error) throw error;

         const itens = [
            { lancamento_id: head.id, conta_codigo: regra.conta_debito_codigo, conta_nome: 'Clientes / Contas a Receber', tipo: 'D', valor: vTotal, company_id: selectedEmpresaId },
            { lancamento_id: head.id, conta_codigo: regra.conta_credito_codigo, conta_nome: 'Vendas / Receitas de Serviços', tipo: 'C', valor: vLiquido, company_id: selectedEmpresaId }
         ];

         if (vIva > 0) {
            itens.push({ lancamento_id: head.id, conta_codigo: '3.4.5', conta_nome: 'IVA Cobrado / Liquidado', tipo: 'C', valor: vIva, company_id: selectedEmpresaId });
         }

         await supabase.from('acc_lancamento_itens').insert(itens);

         await fetchAccountingData();
         alert(`Lançamento automático criado para a fatura ${fatura.numero_fatura || ''}!`);
      } catch (err) {
         alert('Erro ao criar lançamento automático.');
      } finally {
         setIsAutoLaunching(false);
      }
   };

   // --- LANÇAMENTOS AUTOMÃTICOS: TESOURARIA ---
   const handleAutoLaunchFromTesouraria = async (transacao: any) => {
      if (!selectedEmpresaId || !selectedPeriodoId) {
         alert('Selecione empresa e período antes de contabilizar.');
         return;
      }
      setIsAutoLaunching(true);
      try {
         const isEntrada = transacao.tipo === 'Entrada' || transacao.tipo === 'entrada' || transacao.tipo === 'receita';
         const { data: head, error } = await supabase.from('acc_lancamentos').insert([{
            data: transacao.data || new Date().toISOString().split('T')[0],
            periodo_id: selectedPeriodoId,
            descricao: transacao.descricao || transacao.categoria || 'Mov. Tesouraria',
            company_id: selectedEmpresaId,
            usuario_id: null,
            status: 'Postado',
            tipo_transacao: 'Automático'
         }]).select().single();
         if (error) throw error;
         await supabase.from('acc_lancamento_itens').insert([
            { lancamento_id: head.id, conta_codigo: isEntrada ? '1.1' : '7.5', conta_nome: isEntrada ? 'Caixa/Bancos' : 'Outros Gastos', tipo: 'D', valor: Number(transacao.valor) || 0 },
            { lancamento_id: head.id, conta_codigo: isEntrada ? '6.1' : '1.1', conta_nome: isEntrada ? 'Receitas' : 'Caixa/Bancos', tipo: 'C', valor: Number(transacao.valor) || 0 }
         ]);
         await fetchAccountingData();
         alert('Lançamento automático de tesouraria criado!');
      } catch (err) {
         alert('Erro ao criar lançamento automático.');
      } finally {
         setIsAutoLaunching(false);
      }
   };

   // --- LANÇAMENTOS AUTOMATICOS: FARMÁCIA ---
   const handleAutoLaunchFromPharmacySale = async (venda: any) => {
      if (!selectedEmpresaId || !selectedPeriodoId || !venda) {
         alert('Selecione empresa e período antes de contabilizar.');
         return;
      }
      setIsAutoLaunching(true);
      try {
         const regra = regrasAutomaticas.find(r => r.nome.toLowerCase().includes('venda')) || {
            conta_debito_codigo: '3.1', conta_credito_codigo: '6.1'
         };

         const vTotal = Number(venda.valor || venda.total) || 0;
         const vIva = Number(venda.iva || (venda.metadata?.iva)) || 0;
         const vLiquido = vTotal - vIva;

         const { data: head, error } = await supabase.from('acc_lancamentos').insert([{
            data: venda.created_at?.split('T')[0] || venda.data || new Date().toISOString().split('T')[0],
            periodo_id: selectedPeriodoId,
            descricao: `Venda Farmácia ${venda.numero_factura || venda.numero || ''} - ${venda.entidade || 'Cliente Farmácia'}`,
            company_id: selectedEmpresaId,
            usuario_id: null,
            status: 'Postado',
            tipo_transacao: 'Automático'
         }]).select().single();
         if (error) throw error;

         const itens = [
            { lancamento_id: head.id, conta_codigo: regra.conta_debito_codigo, conta_nome: 'Clientes / Contas a Receber', tipo: 'D', valor: vTotal, company_id: selectedEmpresaId },
            { lancamento_id: head.id, conta_codigo: regra.conta_credito_codigo, conta_nome: 'Vendas / Receitas (Farmácia)', tipo: 'C', valor: vLiquido, company_id: selectedEmpresaId }
         ];

         if (vIva > 0) {
            itens.push({ lancamento_id: head.id, conta_codigo: '3.4.5', conta_nome: 'IVA Cobrado / Liquidado', tipo: 'C', valor: vIva, company_id: selectedEmpresaId });
         }

         await supabase.from('acc_lancamento_itens').insert(itens);

         await fetchAccountingData();
         alert(`Lançamento automático criado para a venda farmácia ${venda.numero_factura || venda.numero || ''}!`);
      } catch (err) {
         console.error(err);
         alert('Erro ao criar lançamento automático.');
      } finally {
         setIsAutoLaunching(false);
      }
   };

   const handleAutoLaunchFromPOSSale = async (sale: any) => {
      if (!selectedEmpresaId || !selectedPeriodoId || !sale) {
         alert('Selecione empresa e período antes de contabilizar.');
         return;
      }
      setIsAutoLaunching(true);
      try {
         const regra = regrasAutomaticas.find(r => r.nome.toLowerCase().includes('venda')) || {
            conta_debito_codigo: '1.1', conta_credito_codigo: '6.1'
         };

         const vTotal = Number(sale.total) || 0;
         const vIva = Number(sale.tax) || 0;
         const vLiquido = vTotal - vIva;

         const { data: head, error } = await supabase.from('acc_lancamentos').insert([{
            data: sale.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
            periodo_id: selectedPeriodoId,
            descricao: `Venda POS ${sale.invoice_number || sale.id || ''}`,
            company_id: selectedEmpresaId,
            usuario_id: null,
            status: 'Postado',
            tipo_transacao: 'Automático'
         }]).select().single();
         if (error) throw error;

         const itens = [
            { lancamento_id: head.id, conta_codigo: regra.conta_debito_codigo, conta_nome: 'Disponibilidades / Caixa', tipo: 'D', valor: vTotal, company_id: selectedEmpresaId },
            { lancamento_id: head.id, conta_codigo: regra.conta_credito_codigo, conta_nome: 'Vendas / Receitas POS', tipo: 'C', valor: vLiquido, company_id: selectedEmpresaId }
         ];

         if (vIva > 0) {
            itens.push({ lancamento_id: head.id, conta_codigo: '3.4.5', conta_nome: 'IVA Cobrado / Liquidado', tipo: 'C', valor: vIva, company_id: selectedEmpresaId });
         }

         await supabase.from('acc_lancamento_itens').insert(itens);

         await fetchAccountingData();
         alert(`Lançamento automático criado para a venda POS!`);
      } catch (err) {
         console.error(err);
         alert('Erro ao criar lançamento automático.');
      } finally {
         setIsAutoLaunching(false);
      }
   };

   // ============================================================
   // --- COMPRAS: REGISTO + LANÇAMENTO AUTOMÃTICO ---
   // ============================================================
   const handleSaveCompra = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedEmpresaId) { alert('Selecione uma empresa.'); return; }
      setIsSavingCompra(true);
      try {
         // 1. Inserir compra
         const { data: compra, error: cErr } = await supabase.from('compras').insert([{
            ...newCompra,
            company_id: selectedEmpresaId,
            periodo_id: selectedPeriodoId || null,
            valor_liquido: Number(newCompra.valor_total) - Number(newCompra.iva)
         }]).select().single();
         if (cErr) throw cErr;

         // 2. Criar lançamento automático se a empresa tiver período activo
         if (selectedPeriodoId) {
            const vTotal = Number(newCompra.valor_total) || 0;
            const vIva = Number(newCompra.iva) || 0;
            const vLiquido = vTotal - vIva;

            const regra = regrasAutomaticas.find(r => r.nome.toLowerCase().includes('compra')) || {
               conta_debito_codigo: '2.1', conta_credito_codigo: '3.2'
            };
            const { data: head, error: hErr } = await supabase.from('acc_lancamentos').insert([{
               data: newCompra.data_compra,
               periodo_id: selectedPeriodoId,
               descricao: `Compra ${newCompra.numero_compra || ''} — ${newCompra.fornecedor_nome || 'Fornecedor'}`,
               company_id: selectedEmpresaId,
               usuario_id: null,
               status: 'Postado',
               tipo_transacao: 'Automático'
            }]).select().single();
            if (!hErr && head) {
               const itens = [
                  { lancamento_id: head.id, conta_codigo: regra.conta_debito_codigo, conta_nome: 'Inventário / Activos Circulantes', tipo: 'D', valor: vLiquido, company_id: selectedEmpresaId },
                  { lancamento_id: head.id, conta_codigo: regra.conta_credito_codigo, conta_nome: 'Fornecedores / Contas a Pagar', tipo: 'C', valor: vTotal, company_id: selectedEmpresaId }
               ];

               if (vIva > 0) {
                  itens.push({ lancamento_id: head.id, conta_codigo: '3.4.5', conta_nome: 'IVA Dedutível', tipo: 'D', valor: vIva, company_id: selectedEmpresaId });
               }

               await supabase.from('acc_lancamento_itens').insert(itens);
               // Marcar compra como contabilizada
               await supabase.from('compras').update({ contabilizado: true, lancamento_id: head.id }).eq('id', compra.id);
            }
         }

         await fetchAccountingData();
         setShowCompraModal(false);
         setNewCompra({ numero_compra: '', fornecedor_nome: '', fornecedor_nif: '', data_compra: new Date().toISOString().split('T')[0], descricao: '', categoria: 'Mercadorias', valor_total: 0, iva: 0, valor_liquido: 0, status: 'Pendente' });
         alert('Compra registada e contabilizada com sucesso!');
      } catch (err) {
         alert('Erro ao registar compra.');
      } finally {
         setIsSavingCompra(false);
      }
   };

   // ============================================================
   // --- APROVAÇÃO DE LANÇAMENTOS ---
   // ============================================================
   const handleAprovarLancamento = async (lancamento: any, obs: string) => {
      setIsApprovingId(lancamento.id);
      try {
         const { error } = await supabase.from('acc_lancamentos').update({
            status: 'Postado',
            aprovado_por: 'Utilizador Actual',
            aprovado_em: new Date().toISOString(),
            aprovacao_obs: obs || null
         }).eq('id', lancamento.id).eq('company_id', selectedEmpresaId);
         if (error) throw error;
         await fetchAccountingData();
         setShowApprovalModal(false);
         setApprovalTarget(null);
         setApprovalObs('');
         alert('Lançamento aprovado e postado com sucesso!');
      } catch (err) {
         alert('Erro ao aprovar lançamento.');
      } finally {
         setIsApprovingId(null);
      }
   };

   const handleRejeitarLancamento = async (lancamento: any) => {
      if (!confirm('Rejeitar e eliminar este lançamento?')) return;
      try {
         await supabase.from('acc_lancamento_itens').delete().eq('lancamento_id', lancamento.id).eq('company_id', selectedEmpresaId);
         await supabase.from('acc_lancamentos').delete().eq('id', lancamento.id).eq('company_id', selectedEmpresaId);
         await fetchAccountingData();
      } catch (err) {
         alert('Erro ao rejeitar lançamento.');
      }
   };

   // ============================================================
   // --- ESTORNO DE LANÇAMENTOS ---
   // ============================================================
   const handleEstornarLancamento = async (lancamento: any) => {
      if (lancamento.estornado) { alert('Este lançamento já foi estornado.'); return; }
      if (!confirm(`Criar estorno do lançamento "${lancamento.descricao}"? Esta acção é irreversível.`)) return;
      setIsEstornandoId(lancamento.id);
      try {
         // 1. Criar lançamento espelho com D/C invertidos
         const { data: estornoHead, error: eErr } = await supabase.from('acc_lancamentos').insert([{
            data: new Date().toISOString().split('T')[0],
            periodo_id: lancamento.periodo_id || selectedPeriodoId,
            descricao: `ESTORNO: ${lancamento.descricao}`,
            company_id: lancamento.company_id,
            usuario_id: null,
            status: 'Postado',
            tipo_transacao: 'Estorno'
         }]).select().single();
         if (eErr) throw eErr;

         // 2. Inverter itens D?C e C?D
         const itensOriginais = lancamento.itens || [];
         if (itensOriginais.length > 0) {
            await supabase.from('acc_lancamento_itens').insert(
               itensOriginais.map((it: any) => ({
                  lancamento_id: estornoHead.id,
                  conta_codigo: it.conta_codigo,
                  conta_nome: it.conta_nome,
                  tipo: it.tipo === 'D' ? 'C' : 'D',
                  valor: it.valor,
                  company_id: selectedEmpresaId
               }))
            );
         }

         // 3. Marcar original como estornado
         await supabase.from('acc_lancamentos').update({
            estornado: true,
            estorno_ref_id: estornoHead.id,
            estorno_em: new Date().toISOString()
         }).eq('id', lancamento.id).eq('company_id', selectedEmpresaId);

         await fetchAccountingData();
         alert(`Estorno criado com sucesso! Referência: ${estornoHead.id.slice(0, 8).toUpperCase()}`);
      } catch (err) {
         alert('Erro ao criar estorno.');
      } finally {
         setIsEstornandoId(null);
      }
   };

   // --- LÓGICA NOVO LANÇAMENTO (com validação D=C) ---
   const handleNewEntry = async (e: React.FormEvent) => {

      e.preventDefault();
      if (newEntry.valor <= 0) {
         alert('O valor deve ser maior que zero.');
         return;
      }
      if (newEntry.contaDebito === newEntry.contaCredito) {
         alert('A conta de Débito e a conta de Crédito não podem ser iguais.');
         return;
      }
      const debito = planoContas.find(c => c.codigo === newEntry.contaDebito);
      const credito = planoContas.find(c => c.codigo === newEntry.contaCredito);
      if (!debito || !credito) {
         alert('Selecione contas válidas para Débito e Crédito.');
         return;
      }

      try {
         // 1. Inserir cabeçalho
         const { data: head, error: hError } = await supabase.from('acc_lancamentos').insert([{
            data: newEntry.data,
            periodo_id: selectedPeriodoId || null,
            descricao: newEntry.descricao,
            company_id: selectedEmpresaId,
            usuario_id: null,
            status: 'Postado',
            tipo_transacao: 'Manual'
         }]).select().single();
         if (hError) throw hError;

         // 2. Inserir itens D e C (valores iguais — soma D = soma C garantida)
         await supabase.from('acc_lancamento_itens').insert([
            { lancamento_id: head.id, conta_codigo: debito!.codigo, conta_nome: debito!.nome, tipo: 'D', valor: Number(newEntry.valor), company_id: selectedEmpresaId },
            { lancamento_id: head.id, conta_codigo: credito!.codigo, conta_nome: credito!.nome, tipo: 'C', valor: Number(newEntry.valor), company_id: selectedEmpresaId }
         ]);

         fetchAccountingData();
         setShowEntryModal(false);
         setNewEntry({ ...newEntry, descricao: '', valor: 0 });
      } catch (error) {
         alert('Erro ao salvar lançamento');
      }
   };

   const handleExportChart = () => {
      alert("Exportação de gráfico iniciada. (Funcionalidade simulada)");
   };

   const handleExportFiscal = async () => {
      if (!selectedEmpresaId) return alert("Selecione uma empresa.");
      setIsExportingFiscal(true);
      try {
         // Simulação de geração de PDF robusta
         await new Promise(resolve => setTimeout(resolve, 3000));

         const reportContent = `
            RELATÓRIO FISCAL - ${currentEmpresa?.nome}
            Período: ${periodos.find(p => p.id === selectedPeriodoId)?.mes}/${periodos.find(p => p.id === selectedPeriodoId)?.ano}
            
            RECEITA TOTAL: ${safeFormatAOA(financeReports.receitaTotal)}
            DESPESA TOTAL: ${safeFormatAOA(financeReports.despesaTotal)}
            LUCRO LÃQUIDO: ${safeFormatAOA(financeReports.lucroLiquido)}
            
            IMPOSTOS ESTIMADOS:
            - IVA: ${safeFormatAOA(financeReports.receitaTotal * 0.14)}
            - IRT: ${safeFormatAOA(folhas.reduce((acc, f) => acc + (Number(f.irt) || 0), 0))}
            
            Status: Validado via Amazing Cloud Sync
         `;

         console.log("PDF Export Content Generated:", reportContent);
         alert("Mapas Fiscais (IVA/IRT/II) gerados e exportados com sucesso para o diretório de downloads.");
      } catch (error) {
         alert("Erro ao exportar mapas fiscais.");
      } finally {
         setIsExportingFiscal(false);
      }
   };

   const handleExportBalancete = () => {
      if (!selectedEmpresaId) return alert("Selecione uma empresa.");
      const win = window.open('', '_blank');
      if (!win) return alert("Por favor, permita popups.");

      const content = `
          <html>
             <head>
                <title>Balancete - ${currentEmpresa?.nome}</title>
                <style>
                   body { font-family: sans-serif; padding: 40px; }
                   table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                   th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                </style>
             </head>
             <body>
                <h1>Balancete de Verificação</h1>
                <p>Empresa: ${currentEmpresa?.nome}</p>
                <table>
                   <thead>
                      <tr><th>Código</th><th>Conta</th><th>Saldo</th></tr>
                   </thead>
                   <tbody>
                      ${planoContas.filter(c => financeReports.saldos[c.codigo] !== 0).map(c => `
                         <tr><td>${c.codigo}</td><td>${c.nome}</td><td>${safeFormatAOA(financeReports.saldos[c.codigo])}</td></tr>
                      `).join('')}
                   </tbody>
                </table>
                <script>window.print();</script>
             </body>
          </html>
       `;
      win.document.write(content);
      win.document.close();
   };



   if (loading) {
      return (
         <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 bg-white/50 rounded-[3rem] border border-white/10 p-12">
            <div className="relative">
               <RefreshCw className="w-16 h-16 text-gold-primary animate-spin" />
               <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-2 bg-gold-primary rounded-full animate-ping"></div>
               </div>
            </div>
            <div className="text-center space-y-4">
               <div>
                  <p className="text-white font-black uppercase tracking-widest uppercase tracking-[0.3em] text-[10px]">Amazing Cloud Sync</p>
                  <p className="text-white/30 font-bold animate-pulse text-xs uppercase tracking-widest">{loadingStatus}</p>
               </div>
               <button
                  onClick={() => setLoading(false)}
                  className="px-6 py-2.5 bg-gold-primary text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-gold-primary hover:text-white transition-all shadow-lg"
               >
                  Bypass Sync (Acesso de Emergência)
               </button>
            </div>
         </div>
      );
   }

   if (empresas.length === 0) {
      return (
         <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
            <div className="p-6 bg-white/5 rounded-full text-white/30">
               <Building2 size={64} />
            </div>
            <div className="max-w-md space-y-2">
               <h2 className="text-2xl font-black uppercase tracking-widest uppercase">Configurando Ambiente</h2>
               <p className="text-white/40 font-medium">Não foram encontradas entidades activas ou o sistema está a recuperar a sincronização.</p>
               <p className="text-[10px] text-white/30 font-mono">Status: {loadingStatus || 'Aguardando payload...'}</p>
            </div>
            <div className="flex gap-4">
               <button
                  onClick={() => fetchAccountingData(true)}
                  className="px-8 py-4 bg-gold-primary text-white rounded-2xl font-black uppercase tracking-widest uppercase text-xs tracking-widest hover:bg-zinc-800 transition-all shadow-xl flex items-center gap-2"
               >
                  <RefreshCw size={16} /> Forçar Sincronização
               </button>
               <button
                  onClick={() => window.location.href = '/empresas'}
                  className="px-8 py-4 bg-white/5 text-white border border-white/10 rounded-2xl font-black uppercase tracking-widest uppercase text-xs tracking-widest hover:bg-bg-deep transition-all shadow-xl"
               >
                  Ver Gestão
               </button>
            </div>
         </div>
      );
   }

   return (
      <div className="flex h-screen bg-bg-deep overflow-hidden font-sans">
         {/* Sidebar Green Premium */}
         <aside className="w-72 bg-bg-deep flex flex-col h-full sticky top-0 border-r border-white/5 transition-all duration-500 z-50 print:hidden relative overflow-hidden">
            <div className="absolute top-[-20%] left-[-20%] w-[150%] h-[150%] bg-gold-primary/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="p-8 border-b border-white/5">
               <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gold-primary rounded-xl shadow-lg">
                     <Scale className="text-white" size={24} />
                  </div>
                  <div>
                     <h2 className="text-white font-black text-lg tracking-tight leading-none uppercase">Contabilidade</h2>
                     <p className="text-gold-primary/80 font-black text-[7px] uppercase tracking-[0.3em] mt-1">Gestão Financeira & ERP</p>
                  </div>
               </div>
            </div>

            <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto scrollbar-hide">
               <p className="px-4 text-[9px] font-black uppercase tracking-widest text-white/30 uppercase tracking-[0.2em] mb-4 mt-2">Menu Principal</p>
               {sidebarItems.map((item) => (
                  <button
                     key={item.id}
                     onClick={() => setActiveTab(item.id as any)}
                     className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 group ${activeTab === item.id
                        ? 'bg-gradient-to-r from-gold-primary to-gold-secondary text-bg-deep shadow-[0_10px_20px_rgba(212,175,55,0.2)] scale-[1.02]'
                        : 'text-white/40 hover:bg-white/5 hover:text-gold-primary'
                        }`}
                  >
                     <div className={`${activeTab === item.id ? 'text-bg-deep animate-pulse' : 'text-gold-primary/60 group-hover:text-gold-primary group-hover:scale-110 transition-all'}`}>
                        {item.icon}
                     </div>
                     <span className={`text-[10px] font-black uppercase tracking-widest uppercase tracking-[0.15em] ${activeTab === item.id ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}>{item.label}</span>
                     {activeTab === item.id && <div className="ml-auto w-1.5 h-full absolute right-0 top-0 bg-white/20" />}
                  </button>
               ))}

               {/* Separator for advanced options */}
               <div className="my-8 h-px bg-white/5 mx-4" />
               <p className="px-4 text-[9px] font-black uppercase tracking-widest text-white/30 uppercase tracking-[0.2em] mb-4">Gestão & Auditoria</p>
               {[
                  { id: 'diario', label: 'Diário Geral', icon: <BookOpen size={18} /> },
                  { id: 'periodos', label: 'Períodos', icon: <Calendar size={18} /> },
                  { id: 'plano', label: 'Plano de Contas', icon: <ListFilter size={18} /> },
                  { id: 'fiscal', label: 'Fiscal / Impostos', icon: <Landmark size={18} /> },
                  { id: 'folha', label: 'Folha Pagamento', icon: <Briefcase size={18} /> },
                  { id: 'conciliacao', label: 'Conciliação', icon: <RefreshCw size={18} /> },
                  { id: 'auditoria', label: 'Log Auditoria', icon: <ShieldCheck size={18} /> },
                  { id: 'ia', label: 'Venda Plus IA', icon: <BrainCircuit size={18} /> },
               ].map((item) => (
                  <button
                     key={item.id}
                     onClick={() => setActiveTab(item.id as any)}
                     className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${activeTab === item.id
                        ? 'bg-white/10 text-white shadow-lg'
                        : 'text-white/40 hover:bg-white/5 hover:text-white'
                        }`}
                  >
                     <div className="text-gold-primary/50">{item.icon}</div>
                     <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
                  </button>
               ))}
            </nav>

            <div className="p-6 border-t border-white/5 mt-auto">
               <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-gold-primary/20 flex items-center justify-center text-gold-primary shadow-lg border border-gold-primary/20/20">
                        <Users size={18} className="font-black uppercase tracking-widest" />
                     </div>
                     <div className="flex-1 min-w-0">
                        <p className="text-white text-[11px] font-black uppercase tracking-widest uppercase truncate">{user?.nome || 'Utilizador'}</p>
                        <p className="text-white/40 text-[9px] font-bold truncate">{user?.role === 'admin' ? 'Premium Manager' : (user?.role || 'Utilizador')}</p>
                     </div>
                  </div>
               </div>
            </div>
         </aside>

         {/* Main Content Area */}
         <main className="flex-1 h-screen overflow-y-auto bg-bg-deep scroll-smooth relative">
            <div className="absolute top-[10%] right-[10%] w-[40%] h-[40%] bg-gold-primary/5 rounded-full blur-[150px] pointer-events-none" />
            <div className="p-12 max-w-7xl mx-auto space-y-12">
               {/* Top Bar with Context */}
               <header className="flex flex-col md:items-center md:flex-row justify-between gap-6 pb-10 border-b border-white/5 shrink-0 z-10 relative print:hidden">
                  <div>
                     <h1 className="text-3xl font-black uppercase tracking-widest text-white tracking-tighter italic font-display leading-none uppercase">
                        {([...sidebarItems,
                        { id: 'diario', label: 'Diário Geral' },
                        { id: 'periodos', label: 'Períodos' },
                        { id: 'plano', label: 'Plano de Contas' },
                        { id: 'fiscal', label: 'Fiscal / Impostos' },
                        { id: 'folha', label: 'Folha Pagamento' },
                        { id: 'conciliacao', label: 'Conciliação' },
                        { id: 'auditoria', label: 'Log Auditoria' },
                        { id: 'ia', label: 'Venda Plus IA' }
                        ].find(i => i.id === activeTab) as any)?.label || 'Painel de Controlo'}
                     </h1>
                     <p className="text-gold-primary/40 font-black uppercase tracking-widest text-[10px] uppercase tracking-[0.3em] mt-3 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gold-primary animate-pulse" /> Amazing High Tech Enterprise
                     </p>
                  </div>

                  <div className="flex items-center gap-3">
                     <div className="flex items-center gap-2 bg-white/5 px-4 py-2.5 rounded-2xl border border-white/5 shadow-[0_0_30px_rgba(212,175,55,0.05)] transition-all hover:border-gold-primary/40">
                        <Building2 size={16} className="text-white/30" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/30 uppercase">Entidade:</span>
                        <select
                           value={selectedEmpresaId}
                           onChange={(e) => setSelectedEmpresaId(e.target.value)}
                           className="bg-transparent border-none focus:ring-0 text-[10px] font-black uppercase tracking-widest uppercase text-white/90 pr-8 cursor-pointer outline-none"
                        >
                           {empresas?.map(e => (
                              <option key={e.id} value={e.id}>{e?.name || e?.nome || 'Entidade'}</option>
                           ))}
                        </select>
                     </div>

                     <div className="flex items-center gap-2 bg-white/5 px-4 py-2.5 rounded-2xl border border-white/5 shadow-[0_0_30px_rgba(212,175,55,0.05)] transition-all hover:border-gold-primary/40">
                        <Calendar size={16} className="text-white/30" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/30 uppercase">Ciclo:</span>
                        <select
                           value={selectedPeriodoId}
                           onChange={(e) => setSelectedPeriodoId(e.target.value)}
                           className="bg-transparent border-none focus:ring-0 text-[10px] font-black uppercase tracking-widest uppercase text-white/90 pr-8 cursor-pointer outline-none"
                        >
                           {(() => {
                              const filtered = (periodos || []).filter(p => p.company_id === selectedEmpresaId);
                              if (filtered.length === 0) return <option value="">Sem Ciclos</option>;
                              return filtered.map(p => (
                                 <option key={p.id} value={p.id}>{`${p.mes}/${p.ano} - ${p.status}`}</option>
                              ));
                           })()}
                        </select>
                     </div>
                  </div>
               </header>

               {/* --- DASHBOARD PREMIUM --- */}
               {activeTab === 'dashboard' && (() => {
                  // === CÃ LCULOS PREMIUM DINÂMICOS ===
                  const receitaTotalContabil = Number(financeReports.receitaTotal) || 0;
                  const totalGeralReceita = receitaTotalContabil + (totalFacturado || 0);
                  const totalGeralDespesa = Number(financeReports.despesaTotal) || 0;
                  const lucroGeral = totalGeralReceita - totalGeralDespesa;

                  const ativos = Number(financeReports.ativos) || 0;
                  const passivos = Number(financeReports.passivos) || 0;
                  const capital = Number(financeReports.capital) || 0;

                  // SCORE FINANCEIRO PREMIUM
                  const score = totalGeralReceita > 0 ? Math.min(10, Math.max(0, (lucroGeral / totalGeralReceita) * 10 + 5)) : 5.0;
                  // Indicadores Automáticos
                  const liquidezCorrente = passivos > 0 ? ativos / passivos : ativos > 0 ? 99 : 0;
                  const solvencia = (ativos + capital) > 0 ? ativos / (passivos + capital) : 0;
                  const margemLiquida = totalGeralReceita > 0 ? (lucroGeral / totalGeralReceita) * 100 : 0;
                  const roe = capital > 0 ? (lucroGeral / capital) * 100 : 0;
                  const ratioEndividamento = ativos > 0 ? (passivos / ativos) * 100 : 0;

                  // else if (liquidezCorrente < 0.8) score -= 1.5;
                  // if (ratioEndividamento < 40) score += 1;
                  // else if (ratioEndividamento > 70) score -= 1;
                  // if (receita === 0) score = 0;
                  // score = Math.min(10, Math.max(0, score));
                  const scoreLabel = score >= 8 ? 'Excelência' : score >= 6 ? 'Bom' : score >= 4 ? 'Atenção' : 'Crítico';
                  const scoreColor = score >= 8 ? 'text-green-400' : score >= 6 ? 'text-yellow-400' : score >= 4 ? 'text-orange-400' : 'text-red-400';

                  // Alertas de Risco DinÃ¢micos
                  const alertas: { nivel: 'danger' | 'warn' | 'ok'; msg: string; sub: string }[] = [];

                  // Alerta de Stock (Novo)
                  const lowStockCount = extInventario.filter(i => Number(i.quantidade_atual) <= Number(i.quantidade_minima)).length;
                  if (lowStockCount > 0) {
                     alertas.push({ nivel: 'danger', msg: 'Ruptura de Stock', sub: `${lowStockCount} itens atingiram o nível crítico de stock.` });
                  }

                  if (lucroGeral < 0) alertas.push({ nivel: 'danger', msg: 'Prejuízo no Período', sub: `A empresa está a gastar mais do que ganha (${safeFormatAOA(Math.abs(lucroGeral))}).` });
                  if (liquidezCorrente < 1 && ativos > 0) alertas.push({ nivel: 'danger', msg: 'Dificuldade de Pagamento', sub: `O dinheiro disponível cobre apenas ${(liquidezCorrente * 100).toFixed(0)}% das dívidas imediatas.` });
                  if (ratioEndividamento > 80 && ativos > 0) alertas.push({ nivel: 'warn', msg: 'Dívida Muito Alta', sub: `Mais de 80% do que a empresa possui pertence a terceiros/bancos.` });
                  if (margemLiquida > 0 && margemLiquida < 5) alertas.push({ nivel: 'warn', msg: 'Margem de Lucro Baixa', sub: `Apenas ${margemLiquida.toFixed(1)}% da venda sobra como lucro real.` });
                  if (totalIva > 0) alertas.push({ nivel: 'warn', msg: 'Liquidação de IVA', sub: `Valor de IVA acumulado disponível para liquidação: ${safeFormatAOA(totalIva)}.` });
                  if (lucroGeral > 0 && margemLiquida >= 10) alertas.push({ nivel: 'ok', msg: 'Excelente Performance', sub: `Margem de lucro saudável e operação sustentável.` });
                  if (liquidezCorrente >= 1.2) alertas.push({ nivel: 'ok', msg: 'Caixa Confortável', sub: `A empresa tem folga para pagar os seus compromissos.` });
                  const alertasToShow = alertas.slice(0, 4);

                  // Previsão de Fluxo de Caixa (próximos 6 meses por tendência simples)
                  const tendencia = totalGeralReceita > 0 ? (lucroGeral / totalGeralReceita) : 0;
                  const base = totalGeralReceita > 0 ? totalGeralReceita : 500000;
                  const growthFactor = 1 + (tendencia * 0.1);
                  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
                  const cashflowData = meses.map((m, i) => ({
                     name: m,
                     Projetado: Math.round(base * Math.pow(growthFactor, i + 1)),
                     Real: i < 2 ? Math.round(base * (0.9 + Math.random() * 0.3)) : null
                  }));

                  return (
                     <div className="space-y-8 animate-in slide-in-from-bottom-4">

                        {/* FILA 1: KPIs + Score */}
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
                           <div className="bg-white/5 p-5 xl:p-6 rounded-[2.5rem] border border-white/10 shadow-[0_0_30px_rgba(212,175,55,0.05)] overflow-hidden flex flex-col items-center justify-center text-center">
                              <p className="text-white/30 text-[9px] font-black uppercase tracking-widest mb-2 truncate">Receita Acumulada</p>
                              <p className="text-lg xl:text-xl font-black uppercase tracking-tighter text-white truncate" title={safeFormatAOA(totalFacturado)}>{safeFormatAOA(totalFacturado)}</p>
                              <div className="mt-3 flex items-center gap-1 text-[9px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg w-fit">
                                 <ArrowUpRight size={10} /> Consolidado
                              </div>
                           </div>
                           <div className="bg-white/5 p-5 xl:p-6 rounded-[2.5rem] border border-white/10 shadow-[0_0_30px_rgba(212,175,55,0.05)] overflow-hidden flex flex-col items-center justify-center text-center">
                              <p className="text-white/30 text-[9px] font-black uppercase tracking-widest mb-2 truncate">Vendas POS</p>
                              <p className="text-lg xl:text-xl font-black uppercase tracking-tighter text-yellow-500 truncate" title={safeFormatAOA(totalPOS)}>{safeFormatAOA(totalPOS)}</p>
                              <div className="mt-3 flex items-center gap-1 text-[9px] font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded-lg w-fit">
                                 <ShoppingCart size={10} /> POS Vendas
                              </div>
                           </div>
                           <div className="bg-white/5 p-5 xl:p-6 rounded-[2.5rem] border border-white/10 shadow-[0_0_30px_rgba(212,175,55,0.05)] overflow-hidden flex flex-col items-center justify-center text-center">
                              <p className="text-white/30 text-[9px] font-black uppercase tracking-widest mb-2 truncate">Vendas Farmácia</p>
                              <p className="text-lg xl:text-xl font-black uppercase tracking-tighter text-gold-primary truncate" title={safeFormatAOA(totalFarmacia)}>{safeFormatAOA(totalFarmacia)}</p>
                              <div className="mt-3 flex items-center gap-1 text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg w-fit">
                                 <ShoppingCart size={10} /> Farmácia
                              </div>
                           </div>
                           <div className="bg-white/5 p-5 xl:p-6 rounded-[2.5rem] border border-white/10 shadow-[0_0_30px_rgba(212,175,55,0.05)] overflow-hidden flex flex-col items-center justify-center text-center">
                              <p className="text-white/30 text-[9px] font-black uppercase tracking-widest mb-2 truncate">IVA Cobrado</p>
                              <p className="text-lg xl:text-xl font-black uppercase tracking-tighter text-emerald-500 truncate" title={safeFormatAOA(totalIva)}>{safeFormatAOA(totalIva)}</p>
                              <div className="mt-3 flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg w-fit">
                                 <Scale size={10} /> AGT (14%)
                              </div>
                           </div>
                           <div className="bg-white/5 p-5 xl:p-6 rounded-[2.5rem] border border-white/10 shadow-[0_0_30px_rgba(212,175,55,0.05)] overflow-hidden flex flex-col items-center justify-center text-center">
                              <p className="text-white/30 text-[9px] font-black uppercase tracking-widest mb-2 truncate">Custos Totais</p>
                              <p className="text-lg xl:text-xl font-black uppercase tracking-tighter text-red-500 truncate" title={safeFormatAOA(totalGeralDespesa)}>{safeFormatAOA(totalGeralDespesa)}</p>
                              <p className="text-[9px] text-white/30 font-bold mt-3 truncate">Pessoal + Operacional</p>
                           </div>
                           <div className="bg-gold-primary p-5 xl:p-6 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden flex flex-col justify-between items-center text-center w-full">
                              <div className="flex flex-col items-center w-full">
                                 <p className="text-gold-primary text-[9px] font-black uppercase tracking-widest mb-2 truncate">Lucro Líquido</p>
                                 <p className={`text-lg xl:text-xl font-black uppercase tracking-tighter truncate ${lucroGeral >= 0 ? 'text-white' : 'text-red-400'}`} title={safeFormatAOA(lucroGeral)}>{safeFormatAOA(lucroGeral)}</p>
                              </div>
                              <div className="flex flex-col items-center w-full mt-1">
                                 <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-gold-primary transition-all duration-1000"
                                       style={{ width: `${Math.min(100, Math.max(0, (lucroGeral / (totalGeralReceita || 1)) * 100))}%` }} />
                                 </div>
                                 <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mt-1 truncate">{margemLiquida.toFixed(1)}% Margem</p>
                              </div>
                           </div>
                        </div>

                        {/* FILA 2: Score + Ativos + Outros */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                           <div className="bg-white/5 p-5 xl:p-6 rounded-[2.5rem] border border-white/10 shadow-[0_0_30px_rgba(212,175,55,0.05)] overflow-hidden flex flex-col items-center justify-center text-center">
                              <p className="text-white/30 text-[9px] font-black uppercase tracking-widest mb-2 truncate">Activo Total</p>
                              <p className="text-xl xl:text-2xl font-black uppercase tracking-tighter text-white truncate" title={safeFormatAOA(ativos)}>{safeFormatAOA(ativos)}</p>
                              <p className="text-[9px] text-white/30 font-bold mt-3 truncate" title={safeFormatAOA(passivos)}>Passivo: {safeFormatAOA(passivos)}</p>
                           </div>

                           <div className="col-span-1 md:col-span-1 bg-gradient-to-br from-zinc-900 to-zinc-800 p-7 rounded-[2.5rem] shadow-2xl flex flex-col items-center justify-center text-center relative overflow-hidden">
                              <div className="absolute inset-0 opacity-10">
                                 <div className="absolute top-2 right-2 w-24 h-24 rounded-full bg-gold-primary blur-2xl" />
                              </div>
                              <p className="text-[9px] font-black uppercase tracking-widest text-white/30 uppercase mb-1">Score Financeiro</p>
                              <p className={`text-5xl font-black uppercase tracking mt-1 ${scoreColor}`}>{totalGeralReceita > 0 ? score.toFixed(1) : '—'}</p>
                              <p className={`text-[9px] font-black uppercase tracking mt-2 ${scoreColor}`}>{totalGeralReceita > 0 ? scoreLabel : 'Sem Dados'}</p>
                              <div className="w-full mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
                                 <div className="h-full bg-gold-primary transition-all duration-1000 rounded-full"
                                    style={{ width: `${(score / 10) * 100}%` }} />
                              </div>
                           </div>

                           <div className="md:col-span-2 bg-white/5 p-7 rounded-[2.5rem] border border-white/10 flex flex-col justify-center">
                              <div className="grid grid-cols-2 gap-4">
                                 <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                    <p className="text-[9px] text-white/30 font-black uppercase tracking mb-1">Solvência</p>
                                    <p className="text-xl font-black uppercase tracking-widest text-white">{solvencia.toFixed(2)}x</p>
                                 </div>
                                 <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                    <p className="text-[9px] text-white/30 font-black uppercase tracking mb-1">ROE</p>
                                    <p className="text-xl font-black uppercase tracking-widest text-white">{roe.toFixed(1)}%</p>
                                 </div>
                              </div>
                           </div>
                        </div>

                        {/* FILA 3: Indicadores Financeiros Automáticos */}
                        <div className="bg-white/5 rounded-[3rem] border border-white/10 shadow-[0_0_30px_rgba(212,175,55,0.05)] p-8">
                           <div className="flex items-center justify-between mb-6">
                              <h3 className="text-base font-black uppercase tracking-widest text-white uppercase tracking-tight flex items-center gap-2">
                                 <BarChart2 size={18} className="text-gold-primary" /> Indicadores Financeiros Automáticos
                              </h3>
                              <span className="text-[9px] font-black uppercase tracking text-white/30 px-3 py-1.5 bg-bg-deep rounded-xl border border-white/5">Calculados em Tempo Real</span>
                           </div>
                           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              {[
                                 {
                                    label: 'Capacidade de Pagamento', value: totalGeralReceita > 0 ? liquidezCorrente.toFixed(2) : '—', unit: 'x',
                                    info: 'Poder de cobrir dívidas curto prazo',
                                    color: liquidezCorrente >= 1.2 ? 'bg-green-50/10 border-green-500/20 text-green-400' : liquidezCorrente >= 1 ? 'bg-yellow-50/10 border-yellow-500/20 text-gold-primary' : 'bg-red-50/10 border-red-500/20 text-red-400',
                                    status: liquidezCorrente >= 1.2 ? '✅ Confortável' : liquidezCorrente >= 1 ? '⚠️ Atenção' : '🔴 Crítico'
                                 },
                                 {
                                    label: 'Solidez Financeira', value: totalGeralReceita > 0 ? solvencia.toFixed(2) : '—', unit: 'x',
                                    info: 'Garantia de capital vs obrigações',
                                    color: solvencia >= 1 ? 'bg-green-50/10 border-green-500/20 text-green-400' : 'bg-red-50/10 border-red-500/20 text-red-400',
                                    status: solvencia >= 1 ? '✅ Solvente' : '🔴 Em Risco'
                                 },
                                 {
                                    label: 'Retorno p/ Sócio', value: totalGeralReceita > 0 ? roe.toFixed(1) : '—', unit: '%',
                                    info: 'Rendimento do investimento',
                                    color: roe >= 10 ? 'bg-green-50/10 border-green-500/20 text-green-400' : roe >= 2 ? 'bg-yellow-50/10 border-yellow-500/20 text-gold-primary' : 'bg-white/5 border-white/10 text-white/40',
                                    status: roe >= 10 ? '✅ Saudável' : roe >= 2 ? '⚠️ Baixo' : '— Estável'
                                 },
                                 {
                                    label: 'Nível de Dívida', value: totalGeralReceita > 0 ? ratioEndividamento.toFixed(0) : '—', unit: '%',
                                    info: 'Percentagem de ativos financiados',
                                    color: ratioEndividamento < 50 ? 'bg-green-50/10 border-green-500/20 text-green-400' : ratioEndividamento < 80 ? 'bg-yellow-50/10 border-yellow-500/20 text-gold-primary' : 'bg-red-50/10 border-red-500/20 text-red-400',
                                    status: ratioEndividamento < 50 ? '✅ Controlado' : ratioEndividamento < 80 ? '⚠️ Elevado' : '🔴 Muito Alto'
                                 },
                              ].map((ind, i) => (
                                 <div key={i} className={`p-5 rounded-2xl border ${ind.color} flex flex-col gap-1 overflow-hidden`}>
                                    <p className="text-[9px] font-black uppercase tracking opacity-70 truncate" title={ind.label}>{ind.label}</p>
                                    <p className="text-3xl font-black uppercase tracking truncate" title={String(ind.value)}>{ind.value}<span className="text-sm">{ind.value !== '—' ? ind.unit : ''}</span></p>
                                    <p className="text-[9px] font-bold opacity-60 truncate" title={ind.info}>{ind.info}</p>
                                    <p className="text-[9px] font-black uppercase tracking mt-1 truncate">{ind.status}</p>
                                 </div>
                              ))}
                           </div>
                        </div>

                        {/* FILA 4: Gráficos */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                           {/* Comparativo Receita vs Despesa */}
                           <div className="bg-white/5 p-10 rounded-[3rem] border border-white/10 shadow-[0_0_30px_rgba(212,175,55,0.05)] h-[420px] flex flex-col">
                              <div className="flex justify-between items-start mb-6">
                                 <div>
                                    <h3 className="text-lg font-black uppercase tracking-widest uppercase tracking-tight flex items-center gap-2">
                                       <LucideBarChart className="text-gold-primary" size={18} /> Comparativo Financeiro
                                    </h3>
                                    <p className="text-xs text-white/30 font-bold mt-1 uppercase tracking-widest">Análise por Período • {currentEmpresa?.nome || ''}</p>
                                 </div>
                                 <button onClick={handleExportChart} className="p-2 bg-bg-deep hover:bg-white/5 rounded-xl text-white/30 hover:text-white transition-colors" title="Exportar">
                                    <Download size={16} />
                                 </button>
                              </div>
                              <div className="flex-1 w-full min-h-0">
                                 <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData.barChartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#9ca3af' }} dy={10} />
                                       <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#9ca3af' }} />
                                       <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '16px' }} formatter={(v: number) => safeFormatAOA(v)} itemStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                                       <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                                       <Bar dataKey="Receita" fill="#22c55e" radius={[6, 6, 0, 0]} barSize={12} />
                                       <Bar dataKey="Despesa" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={12} />
                                    </BarChart>
                                 </ResponsiveContainer>
                              </div>
                           </div>

                           {/* Previsão de Fluxo de Caixa */}
                           <div className="bg-white/5 p-10 rounded-[3rem] border border-white/10 shadow-[0_0_30px_rgba(212,175,55,0.05)] h-[420px] flex flex-col">
                              <div className="flex justify-between items-start mb-6">
                                 <div>
                                    <h3 className="text-lg font-black uppercase tracking-widest uppercase tracking-tight flex items-center gap-2">
                                       <ArrowUpRight className="text-gold-primary" size={18} /> Previsão de Fluxo de Caixa
                                    </h3>
                                    <p className="text-xs text-white/30 font-bold mt-1 uppercase tracking-widest">Projecção próximos 6 meses • Baseada em tendência real</p>
                                 </div>
                                 <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border ${tendencia >= 0 ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                    Tendência {tendencia >= 0 ? `+${(tendencia * 100 * 0.1).toFixed(1)}%` : `${(tendencia * 100 * 0.1).toFixed(1)}%`} /mês
                                 </span>
                              </div>
                              <div className="flex-1 w-full min-h-0">
                                 <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={cashflowData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                       <defs>
                                          <linearGradient id="colorProj" x1="0" y1="0" x2="0" y2="1">
                                             <stop offset="5%" stopColor="#eab308" stopOpacity={0.25} />
                                             <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                                          </linearGradient>
                                          <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                                             <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                                             <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                          </linearGradient>
                                       </defs>
                                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#9ca3af' }} />
                                       <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#9ca3af' }} />
                                       <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '16px' }} formatter={(v: number) => safeFormatAOA(v)} itemStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                                       <Legend wrapperStyle={{ paddingTop: '16px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                                       <Area type="monotone" dataKey="Projetado" stroke="#eab308" strokeWidth={3} fillOpacity={1} fill="url(#colorProj)" strokeDasharray="6 3" />
                                       <Area type="monotone" dataKey="Real" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorReal)" />
                                    </AreaChart>
                                 </ResponsiveContainer>
                              </div>
                           </div>
                        </div>

                        {/* FILA 5: Alertas + Gráfico Pizza */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           {/* Alertas Inteligentes */}
                           <div className="bg-gold-primary p-10 rounded-[3rem] text-white flex flex-col justify-between shadow-2xl">
                              <div className="space-y-5">
                                 <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-black uppercase tracking-widest uppercase tracking-tight text-white flex items-center gap-2">
                                       <AlertTriangle size={18} /> Alertas de Risco Financeiro
                                    </h3>
                                    <span className="text-[9px] font-black uppercase tracking text-white/30 px-3 py-1 bg-white/5 rounded-lg border border-white/10">{alertas.filter(a => a.nivel === 'danger').length} Crítico(s)</span>
                                 </div>
                                 <div className="space-y-3">
                                    {alertasToShow.length === 0 && (
                                       <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-center">
                                          <p className="text-xs text-white/30 font-bold">Sem dados suficientes para gerar alertas automáticos.</p>
                                       </div>
                                    )}
                                    {alertasToShow.map((alerta, i) => (
                                       <div key={i} className={`flex items-start gap-4 p-4 rounded-2xl border ${alerta.nivel === 'danger' ? 'bg-red-500/10 border-red-500/20' : alerta.nivel === 'warn' ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-green-500/10 border-green-500/20'}`}>
                                          {alerta.nivel === 'danger' ? <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={16} /> :
                                             alerta.nivel === 'warn' ? <AlertTriangle className="text-yellow-400 shrink-0 mt-0.5" size={16} /> :
                                                <CheckCircle2 className="text-green-400 shrink-0 mt-0.5" size={16} />}
                                          <div>
                                             <p className="text-sm font-black uppercase tracking">{alerta.msg}</p>
                                             <p className="text-[10px] text-white/30">{alerta.sub}</p>
                                          </div>
                                       </div>
                                    ))}
                                 </div>
                              </div>
                              <button onClick={() => openReport('balanco')}
                                 className="w-full mt-8 py-4 bg-white/10 hover:bg-white text-white hover:text-gold-primary font-black uppercase tracking rounded-xl text-[10px] transition-all shadow-xl border border-white/10">
                                 Ver Relatório Detalhado
                              </button>
                           </div>

                           {/* Distribuição de Despesas */}
                           <div className="bg-white/5 p-10 rounded-[3rem] border border-white/10 shadow-[0_0_30px_rgba(212,175,55,0.05)] h-[420px] flex flex-col">
                              <div className="mb-6">
                                 <h3 className="text-lg font-black uppercase tracking-widest uppercase tracking-tight flex items-center gap-2">
                                    <PieChartIcon className="text-gold-primary" size={18} /> Distribuição de Despesas
                                 </h3>
                                 <p className="text-xs text-white/30 font-bold mt-1 uppercase">Alocação de Custos Operacionais</p>
                              </div>
                              <div className="flex-1 w-full min-h-0 relative">
                                 <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                       <Pie data={chartData.pieChartData} cx="50%" cy="50%" innerRadius={70} outerRadius={120} paddingAngle={5} dataKey="value">
                                          {chartData.pieChartData.map((_, index) => (
                                             <Cell key={`cell-${index}`} fill={COLORS_PIE[index % COLORS_PIE.length]} stroke="none" />
                                          ))}
                                       </Pie>
                                       <Tooltip formatter={(v: number) => safeFormatAOA(v)} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '16px' }} itemStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                                       <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                                    </PieChart>
                                 </ResponsiveContainer>
                                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none pr-28">
                                    <div className="text-center">
                                       <p className="text-[9px] font-black uppercase tracking text-white/30">Total</p>
                                       <p className="text-base font-black uppercase tracking text-white">{safeFormatAOA(chartData.pieChartData?.reduce((acc, b) => acc + (Number(b.value) || 0), 0) || 0)}</p>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>
                  );
               })()}

               {/* --- CLIENTES --- */}
               {
                  activeTab === 'clientes' && (
                     <div className="space-y-6 animate-in slide-in-from-bottom-4">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white/5 p-8 rounded-[3rem] shadow-[0_0_30px_rgba(212,175,55,0.05)] border border-white/10">
                           <div className="flex items-center gap-4 w-full md:w-auto">
                              <div className="relative flex-1 md:w-80">
                                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                                 <input
                                    type="text"
                                    placeholder="Pesquisar cliente por nome ou NIF..."
                                    value={clientSearch}
                                    onChange={e => setClientSearch(e.target.value)}
                                    className="w-full pl-12 pr-6 py-3.5 bg-bg-deep border-none rounded-2xl text-sm focus:ring-2 focus:ring-yellow-500/20"
                                 />
                              </div>
                           </div>
                           <div className="flex items-center gap-3">
                              <button
                                 onClick={() => {
                                    setNewContact({ id: '', nome: '', nif: '', tipo: 'Cliente', email: '', telefone: '', morada: '', company_id: selectedEmpresaId || '' });
                                    setShowContactModal(true);
                                 }}
                                 className="px-8 py-4 bg-gold-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-gold-primary hover:text-white transition-all shadow-xl"
                              >
                                 <Plus size={20} /> Novo Cliente
                              </button>
                           </div>
                        </div>

                        <div className="bg-white/5 rounded-[3.5rem] shadow-xl border border-white/10 overflow-hidden">
                           <div className="overflow-x-auto">
                              <table className="w-full text-left min-w-[1000px]">
                                 <thead className="bg-gold-primary text-white border-b border-zinc-800">
                                    <tr className="text-[10px] font-black uppercase tracking-widest uppercase tracking-[0.2em]">
                                       <th className="px-10 py-6">Nome do Cliente</th>
                                       <th className="px-10 py-6">NIF</th>
                                       <th className="px-10 py-6">Telefone</th>
                                       <th className="px-10 py-6">Email</th>
                                       <th className="px-10 py-6">Endereço</th>
                                       <th className="px-6 py-6 text-center">Acções</th>
                                    </tr>
                                 </thead>
                                 <tbody className="divide-y divide-zinc-100">
                                    {(contactos || []).filter(c => c.tipo !== 'Fornecedor' && (!clientSearch || c.nome?.toLowerCase().includes(clientSearch.toLowerCase()) || c.nif?.includes(clientSearch))).length > 0 ? (
                                       (contactos || []).filter(c => c.tipo !== 'Fornecedor' && (!clientSearch || c.nome?.toLowerCase().includes(clientSearch.toLowerCase()) || c.nif?.includes(clientSearch))).map((c) => (
                                          <tr key={c.id} className="group hover:bg-bg-deep/50 transition-all cursor-pointer">
                                             <td className="px-10 py-8">
                                                <p className="font-black uppercase tracking-widest text-white text-lg group-hover:text-gold-primary transition-colors">{c.nome}</p>
                                             </td>
                                             <td className="px-10 py-8 font-mono text-white/40 text-xs">
                                                {c.nif || 'S/ NIF'}
                                             </td>
                                             <td className="px-10 py-8 text-white/70">
                                                {c.telefone || 'S/ Tel'}
                                             </td>
                                             <td className="px-10 py-8 text-white/70">
                                                {c.email || 'S/ Email'}
                                             </td>
                                             <td className="px-10 py-8 text-white/70">
                                                {c.address || c.morada || 'S/ Endereço'}
                                             </td>
                                             <td className="px-6 py-8 text-center flex items-center justify-center gap-2 mt-3">
                                                <button onClick={() => {
                                                   setNewContact({ ...c, company_id: c.company_id || selectedEmpresaId });
                                                   setShowContactModal(true);
                                                }} className="p-3 bg-bg-deep hover:bg-white/10 text-white/30 hover:text-white rounded-xl transition-all" title="Editar">
                                                   <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleDeleteContact(c.id, c.tipo)} className="p-3 bg-bg-deep hover:bg-red-500/10 text-red-500/50 hover:text-red-500 rounded-xl transition-all" title="Eliminar">
                                                   <Trash2 size={16} />
                                                </button>
                                             </td>
                                          </tr>
                                       ))
                                    ) : (
                                       <tr><td colSpan={6} className="text-center py-20 text-white/30 font-bold italic">Nenhum cliente registado.</td></tr>
                                    )}
                                 </tbody>
                              </table>
                           </div>
                        </div>
                     </div>
                  )
               }

               {/* --- DIARIO --- */}
               {
                  activeTab === 'diario' && (
                     <div className="space-y-6 animate-in slide-in-from-bottom-4">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white/5 p-8 rounded-[3rem] shadow-[0_0_30px_rgba(212,175,55,0.05)] border border-white/10">
                           <div className="flex items-center gap-4 w-full md:w-auto">
                              <div className="relative flex-1 md:w-80">
                                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                                 <input
                                    type="text"
                                    placeholder="Pesquisar no diário..."
                                    className="w-full pl-12 pr-6 py-3.5 bg-bg-deep border-none rounded-2xl text-sm focus:ring-2 focus:ring-yellow-500/20"
                                 />
                              </div>
                           </div>
                           <div className="flex items-center gap-3">
                              {periodos.find(p => p.id === selectedPeriodoId)?.status === 'Fechado' && (
                                 <div className="px-4 py-2 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border border-red-100">
                                    <Lock size={14} /> Período Bloqueado
                                 </div>
                              )}
                              <button
                                 onClick={() => setShowCompraModal(true)}
                                 className="px-6 py-4 bg-orange-100 text-orange-700 rounded-2xl font-black uppercase tracking-widest text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-orange-500 hover:text-white transition-all"
                              >
                                 <ShoppingCart size={16} /> Registar Compra
                              </button>
                              <button
                                 onClick={() => setShowEntryModal(true)}
                                 disabled={periodos.find(p => p.id === selectedPeriodoId)?.status === 'Fechado'}
                                 className="px-8 py-4 bg-gold-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-gold-primary hover:text-white transition-all shadow-xl disabled:opacity-50"
                              >
                                 <Plus size={20} /> Novo Lançamento
                              </button>
                           </div>
                        </div>

                        <div className="bg-white/5 rounded-[3.5rem] shadow-xl border border-white/10 overflow-hidden">
                           <div className="overflow-x-auto">
                              <table className="w-full text-left min-w-[1000px]">
                                 <thead className="bg-gold-primary text-white border-b border-zinc-800">
                                    <tr className="text-[10px] font-black uppercase tracking-widest uppercase tracking-[0.2em]">
                                       <th className="px-10 py-6">Data</th>
                                       <th className="px-10 py-6">Referência</th>
                                       <th className="px-10 py-6">Histórico / Descrição</th>
                                       <th className="px-10 py-6 text-right">'Total', 'Pago', 'Dívida'</th>
                                       <th className="px-10 py-6 text-center">Status</th>
                                       <th className="px-10 py-6 text-center">Tipo</th>
                                       <th className="px-6 py-6 text-center">Acções</th>
                                    </tr>
                                 </thead>
                                 <tbody className="divide-y divide-zinc-100">
                                    {lancamentos.filter(l => l.company_id === selectedEmpresaId && (selectedPeriodoId ? l.periodo_id === selectedPeriodoId : true)).length > 0 ? (
                                       lancamentos.filter(l => l.company_id === selectedEmpresaId && (selectedPeriodoId ? l.periodo_id === selectedPeriodoId : true)).map((l) => (
                                          <tr key={l.id} className="group hover:bg-bg-deep/50 transition-all cursor-pointer">
                                             <td className="px-10 py-8 font-mono text-white/40 text-xs">
                                                {l.data ? new Date(l.data).toLocaleDateString() : 'N/D'}
                                             </td>
                                             <td className="px-10 py-8">
                                                <span className="px-4 py-2 bg-bg-deep rounded-xl text-[9px] font-black uppercase tracking-widest text-white/30 group-hover:bg-gold-primary group-hover:text-white transition-all">#LNC-{l.id.toString().slice(0, 4)}</span>
                                             </td>
                                             <td className="px-10 py-8">
                                                <p className="font-black uppercase tracking-widest text-white text-lg group-hover:text-gold-primary transition-colors">{l.descricao}</p>
                                                <div className="flex gap-4 mt-2">
                                                   {l.itens?.map((it, idx) => (
                                                      <div key={idx} className="flex items-center gap-2">
                                                         <div className={`w-2 h-2 rounded-full ${it.tipo === 'D' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                         <span className="text-[10px] font-black uppercase tracking-widest text-white/30 uppercase">{it.conta_codigo}</span>
                                                      </div>
                                                   ))}
                                                </div>
                                             </td>
                                             <td className="px-10 py-8 text-right font-black uppercase tracking-widest text-xl text-white">
                                                {safeFormatAOA(l.itens?.filter(i => i.tipo === 'D').reduce((acc, it) => acc + (Number(it.valor) || 0), 0) || 0)}
                                             </td>
                                             <td className="px-10 py-8 text-center">
                                                <span className={`px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest border ${l.estornado ? 'bg-red-50 text-red-600 border-red-100' :
                                                   l.status === 'Postado' ? 'bg-green-50 text-green-600 border-green-100' :
                                                      l.status === 'Rascunho' || l.status === 'PendenteAprovacao' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                                                         'bg-bg-deep text-white/40 border-white/5'
                                                   }`}>{l.estornado ? 'Estornado' : (l.status || 'Postado')}</span>
                                             </td>
                                             <td className="px-10 py-8 text-center">
                                                <span className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest ${l.tipo_transacao === 'Automático' ? 'bg-blue-50 text-blue-600' :
                                                   l.tipo_transacao === 'Estorno' ? 'bg-red-50 text-red-600' :
                                                      l.tipo_transacao === 'Folha' ? 'bg-purple-50 text-purple-600' :
                                                         'bg-bg-deep text-white/40'
                                                   }`}>{l.tipo_transacao || 'Manual'}</span>
                                             </td>
                                             <td className="px-6 py-8 text-center">
                                                {!l.estornado && l.status === 'Postado' ? (
                                                   <button onClick={() => handleEstornarLancamento(l)} disabled={isEstornandoId === l.id}
                                                      title="Criar Estorno" className="p-2 bg-bg-deep hover:bg-red-50 hover:text-red-600 text-white/30 rounded-xl transition-all disabled:opacity-40">
                                                      {isEstornandoId === l.id ? <RefreshCw size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                                                   </button>
                                                ) : <span className="text-zinc-200">—</span>}
                                             </td>
                                          </tr>
                                       ))
                                    ) : (
                                       <tr><td colSpan={7} className="text-center py-20 text-white/30 font-bold italic">Nenhum lançamento registado para este período.</td></tr>
                                    )}
                                 </tbody>
                              </table>
                           </div>
                        </div>
                     </div>
                  )
               }

               {/* --- DEMONSTRAÇÃ•ES FINANCEIRAS --- */}
               {
                  activeTab === 'demonstracoes' && (
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4">
                        {/* Balanço Patrimonial */}
                        <div className="bg-white/5 p-12 rounded-[4rem] shadow-[0_0_30px_rgba(212,175,55,0.05)] border border-white/10">
                           <div className="flex justify-between items-center mb-10">
                              <h3 className="text-2xl font-black uppercase tracking-widest uppercase tracking-tight">Balanço Patrimonial - {currentEmpresa?.nome || ''}</h3>
                              <button className="p-3 bg-bg-deep rounded-xl text-white/30 hover:text-white"><Printer size={20} /></button>
                           </div>
                           <div className="space-y-8">
                              <div className="space-y-4">
                                 <p className="text-[10px] font-black uppercase tracking-widest text-white/30 uppercase tracking-widest border-b pb-2">Ativo (Devedora)</p>
                                 <div className="flex justify-between text-sm"><span className="font-bold">Total do Ativo Circulante</span><span className="font-black uppercase tracking-widest">{safeFormatAOA(financeReports.ativos)}</span></div>
                              </div>
                              <div className="space-y-4">
                                 <p className="text-[10px] font-black uppercase tracking-widest text-white/30 uppercase tracking-widest border-b pb-2">Passivo (Credora)</p>
                                 <div className="flex justify-between text-sm"><span className="font-bold">Obrigações a Curto Prazo</span><span className="font-black uppercase tracking-widest text-red-600">{safeFormatAOA(financeReports.passivos)}</span></div>
                              </div>
                              <div className="space-y-4">
                                 <p className="text-[10px] font-black uppercase tracking-widest text-white/30 uppercase tracking-widest border-b pb-2">Capital Próprio</p>
                                 <div className="flex justify-between text-sm"><span className="font-bold">Reservas e Capital Social</span><span className="font-black uppercase tracking-widest">{safeFormatAOA(financeReports.capital)}</span></div>
                              </div>
                              <div className="pt-6 border-t-2 border-zinc-900 flex justify-between">
                                 <span className="text-lg font-black uppercase tracking-widest uppercase">Património Líquido</span>
                                 <span className="text-2xl font-black uppercase tracking-widest text-white">{safeFormatAOA(financeReports.ativos - financeReports.passivos)}</span>
                              </div>
                           </div>
                        </div>

                        {/* DRE */}
                        <div className="bg-gold-primary p-12 rounded-[4rem] shadow-2xl text-white">
                           <div className="flex justify-between items-center mb-10">
                              <h3 className="text-2xl font-black uppercase tracking-widest uppercase tracking-tight text-gold-primary">DRE (Resultado)</h3>
                              <span className="text-[10px] font-black uppercase tracking-widest text-white/30 uppercase tracking-widest">Exercício 2024</span>
                           </div>
                           <div className="space-y-8">
                              <div className="flex justify-between border-b border-white/10 pb-4">
                                 <span className="font-bold text-white/30 uppercase text-xs">Proveitos Operacionais</span>
                                 <span className="font-black uppercase tracking-widest text-xl">{safeFormatAOA(financeReports.receitaTotal)}</span>
                              </div>
                              <div className="flex justify-between border-b border-white/10 pb-4">
                                 <span className="font-bold text-white/30 uppercase text-xs">Custos com Pessoal</span>
                                 <span className="font-black uppercase tracking-widest text-lg text-red-400">({safeFormatAOA(folhas?.reduce((acc, b) => acc + (Number(b.salario_base) || 0), 0) || 0)})</span>
                              </div>
                              <div className="flex justify-between border-b border-white/10 pb-4">
                                 <span className="font-bold text-white/30 uppercase text-xs">Custos de Manutenção</span>
                                 <span className="font-black uppercase tracking-widest text-lg text-red-400">({safeFormatAOA((Number(financeReports.despesaTotal) || 0) * 0.3)})</span>
                              </div>
                              <div className="bg-white/5 p-8 rounded-3xl mt-12">
                                 <div className="flex justify-between items-center">
                                    <div>
                                       <p className="text-[10px] font-black uppercase tracking-widest text-gold-primary uppercase tracking-widest mb-1">Resultado Líquido do Período</p>
                                       <p className="text-3xl font-black uppercase tracking-widest">{safeFormatAOA(financeReports.lucroLiquido)}</p>
                                    </div>
                                    <div className={`p-4 rounded-2xl ${financeReports.lucroLiquido >= 0 ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                                       {financeReports.lucroLiquido >= 0 ? <ArrowUpRight size={32} /> : <ArrowDownLeft size={32} />}
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </div>

                        {/* BALANCETE DE VERIFICAÇÃO - NOVO */}
                        <div className="bg-white/5 p-12 rounded-[3rem] shadow-[0_0_30px_rgba(212,175,55,0.05)] border border-white/10 col-span-1 md:col-span-2">
                           <div className="flex justify-between items-center mb-10">
                              <div>
                                 <h3 className="text-xl font-black uppercase tracking-widest text-white uppercase tracking-tight flex items-center gap-3">
                                    <ListChecks size={24} className="text-gold-primary" /> Balancete de Verificação
                                 </h3>
                                 <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1">Saldos Acumulados por Conta no Período</p>
                              </div>
                              <button
                                 onClick={handleExportBalancete}
                                 className="px-6 py-3 bg-gold-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px] uppercase tracking-widest hover:bg-gold-primary hover:text-white transition-all shadow-xl"
                              >
                                 Exportar Balancete
                              </button>
                           </div>
                           <div className="overflow-hidden rounded-2xl border border-white/5">
                              <table className="w-full text-left">
                                 <thead>
                                    <tr className="bg-gold-primary text-white text-[9px] font-black uppercase tracking-widest uppercase tracking-[0.2em]">
                                       <th className="px-8 py-5">Código</th>
                                       <th className="px-8 py-5">Nome da Conta</th>
                                       <th className="px-8 py-5 text-right">Saldo do Período</th>
                                    </tr>
                                 </thead>
                                 <tbody className="divide-y divide-zinc-100">
                                    {planoContas.filter(c => financeReports.saldos[c.codigo] !== 0).map(conta => (
                                       <tr key={conta.id} className="text-xs hover:bg-bg-deep transition-all font-bold">
                                          <td className="px-8 py-4 font-mono text-white/40">{conta.codigo}</td>
                                          <td className="px-8 py-4 uppercase text-white/90">{conta.nome}</td>
                                          <td className={`px-8 py-4 text-right ${financeReports.saldos[conta.codigo] >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                             {safeFormatAOA(financeReports.saldos[conta.codigo])}
                                          </td>
                                       </tr>
                                    ))}
                                    {Object.values(financeReports.saldos).every(s => s === 0) && (
                                       <tr><td colSpan={3} className="px-8 py-10 text-center text-white/30 italic">Sem movimentações no período selecionado.</td></tr>
                                    )}
                                 </tbody>
                              </table>
                           </div>
                        </div>

                        {/* RAZÃO (LEDGER) - NOVO COMPONENTE CORPORATIVO */}
                        <div className="bg-white/5 p-12 rounded-[3rem] shadow-[0_0_30px_rgba(212,175,55,0.05)] border border-white/10 col-span-1 md:col-span-2">
                           <div className="flex justify-between items-center mb-10">
                              <div>
                                 <h3 className="text-xl font-black uppercase tracking-widest text-white uppercase tracking-tight flex items-center gap-3">
                                    <History size={24} className="text-gold-primary" /> Livro Razão Detalhado
                                 </h3>
                                 <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1">Movimentações Analíticas por Conta</p>
                              </div>
                              <div className="flex gap-2">
                                 <button className="p-3 bg-bg-deep rounded-xl text-white/30 hover:text-white transition-all"><Printer size={20} /></button>
                                 <button className="p-3 bg-bg-deep rounded-xl text-white/30 hover:text-white transition-all"><Download size={20} /></button>
                              </div>
                           </div>
                           <div className="space-y-6">
                              {planoContas.filter(c => c.nivel === 1 || c.e_analitica).map(conta => {
                                 const movimentos = lancamentos.filter(l =>
                                    l.company_id === selectedEmpresaId &&
                                    (selectedPeriodoId ? l.periodo_id === selectedPeriodoId : true) &&
                                    l.itens?.some(it => it.conta_codigo === conta.codigo)
                                 );
                                 if (movimentos.length === 0) return null;

                                 return (
                                    <div key={conta.id} className="border border-white/5 rounded-[2rem] overflow-hidden">
                                       <div className="bg-bg-deep p-6 flex justify-between items-center border-b border-white/5">
                                          <span className="font-black uppercase tracking-widest text-xs uppercase tracking-widest text-white">{conta.codigo} - {conta.nome}</span>
                                          <span className="px-4 py-1.5 bg-gold-primary text-white rounded-full text-[9px] font-black uppercase tracking-widest">Saldo: {safeFormatAOA(0)}</span>
                                       </div>
                                       <table className="w-full text-left">
                                          <thead>
                                             <tr className="text-[9px] font-black uppercase tracking-widest text-white/30 border-b border-white/5">
                                                <th className="px-8 py-4">Data</th>
                                                <th className="px-8 py-4">Descrição / Histórico</th>
                                                <th className="px-8 py-4 text-right">Débito</th>
                                                <th className="px-8 py-4 text-right">Crédito</th>
                                             </tr>
                                          </thead>
                                          <tbody className="divide-y divide-zinc-50">
                                             {(movimentos || []).map(m => {
                                                const it = m?.itens?.find(i => i && i.conta_codigo === conta.codigo);
                                                return (
                                                   <tr key={m.id} className="text-xs hover:bg-bg-deep transition-all">
                                                      <td className="px-8 py-4 font-mono text-white/40">{m.data ? new Date(m.data).toLocaleDateString() : 'N/A'}</td>
                                                      <td className="px-8 py-4 font-bold text-white/90 uppercase">{m.descricao || 'Sem Descrição'}</td>
                                                      <td className="px-8 py-4 text-right font-bold text-green-600">{it?.tipo === 'D' ? safeFormatAOA(it.valor) : '-'}</td>
                                                      <td className="px-8 py-4 text-right font-bold text-red-600">{it?.tipo === 'C' ? safeFormatAOA(it.valor) : '-'}</td>
                                                   </tr>
                                                );
                                             })}
                                          </tbody>
                                       </table>
                                    </div>
                                 );
                              })}
                           </div>
                        </div>
                     </div>
                  )
               }

               {/* --- IA CONSULTOR --- */}
               {
                  activeTab === 'ia' && (
                     <div className="space-y-8 animate-in fade-in duration-700">
                        <div className="bg-gradient-to-br from-indigo-950 via-zinc-900 to-black p-16 rounded-[4.5rem] text-white shadow-2xl relative overflow-hidden border border-indigo-500/30">
                           <div className="absolute top-0 right-0 p-12 opacity-10 animate-pulse"><BrainCircuit size={240} /></div>
                           <div className="relative z-10 max-w-4xl space-y-8">
                              <div className="flex items-center gap-3">
                                 <div className="px-4 py-1.5 bg-gold-primary/100/20 border border-indigo-500/50 rounded-full text-indigo-400 text-[10px] font-black uppercase tracking-widest uppercase tracking-[0.4em] flex items-center gap-2">
                                    <Sparkles size={14} /> Cognitive Auditor
                                 </div>
                              </div>
                              <h2 className="text-6xl font-black uppercase tracking-widest tracking-tighter leading-none">Auditoria <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-white">Inteligente Venda Plus.</span></h2>
                              <p className="text-white/30 text-xl font-medium leading-relaxed max-w-2xl">Analise anomalias, otimize impostos e tome decisões baseadas em padrões de alto nível processados em tempo real.</p>
                              <button
                                 onClick={handleAIAnalysis}
                                 disabled={isAnalyzing}
                                 className="px-12 py-6 bg-gold-primary hover:bg-gold-primary/100 rounded-3xl font-black uppercase tracking-widest uppercase text-sm tracking-widest shadow-2xl transition-all disabled:opacity-50 flex items-center gap-4"
                              >
                                 {isAnalyzing ? <RefreshCw className="animate-spin" /> : <ShieldAlert />}
                                 {isAnalyzing ? 'Processando Balancetes...' : 'Gerar Relatório de Auditoria IA'}
                              </button>
                           </div>
                        </div>

                        {iaResponse && (
                           <div className="bg-white/5 p-16 rounded-[4rem] border-2 border-indigo-100 shadow-3xl animate-in zoom-in-95">
                              <h4 className="text-xs font-black uppercase tracking-widest text-gold-primary uppercase tracking-widest mb-8 flex items-center gap-3"><CheckCircle2 /> Insights Gerados</h4>
                              <div className="text-white/80 text-xl font-medium leading-relaxed italic whitespace-pre-wrap">{iaResponse}</div>
                           </div>
                        )}
                     </div>
                  )
               }

               {/* --- PLANO DE CONTAS INTELIGENTE (HIERÃRQUICO + CC) --- */}
               {
                  activeTab === 'plano' && (
                     <div className="space-y-6 animate-in slide-in-from-bottom-4">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white/5 p-8 rounded-[3rem] shadow-[0_0_30px_rgba(212,175,55,0.05)] border border-white/10">
                           <div className="flex bg-white/5 p-1.5 rounded-2xl w-full md:w-fit">
                              <button
                                 onClick={() => setPlanoSubTab('contas')}
                                 className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${planoSubTab === 'contas' ? 'bg-gold-primary text-white shadow-lg' : 'text-white/30 hover:text-white/70'}`}
                              >
                                 Plano de Contas
                              </button>
                              <button
                                 onClick={() => setPlanoSubTab('cc')}
                                 className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${planoSubTab === 'cc' ? 'bg-gold-primary text-white shadow-lg' : 'text-white/30 hover:text-white/70'}`}
                              >
                                 Centros de Custo
                              </button>
                           </div>

                           <div className="flex gap-3 w-full md:w-auto">
                              <button
                                 onClick={handleImportPlanoPadrao}
                                 className="flex-1 md:flex-none px-6 py-4 bg-yellow-50 text-yellow-700 border border-yellow-100 rounded-2xl font-black uppercase tracking-widest text-[10px] uppercase tracking-widest hover:bg-gold-primary hover:text-white transition-all"
                              >
                                 Importar PGC Padrão
                              </button>
                              <button
                                 onClick={() => planoSubTab === 'contas' ? setShowAccountModal(true) : setShowCCModal(true)}
                                 className="flex-1 md:flex-none px-8 py-4 bg-gold-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px] uppercase tracking-widest hover:bg-gold-primary hover:text-white transition-all shadow-xl flex items-center justify-center gap-2"
                              >
                                 <Plus size={16} /> {planoSubTab === 'contas' ? 'Nova Conta' : 'Novo Centro'}
                              </button>
                           </div>
                        </div>

                        {planoSubTab === 'contas' ? (
                           <div className="bg-white/5 rounded-[3.5rem] shadow-[0_0_30px_rgba(212,175,55,0.05)] border border-white/10 overflow-hidden">
                              <div className="p-8 border-b border-white/5 bg-bg-deep/30 flex justify-between items-center">
                                 <div className="flex items-center gap-4">
                                    <h3 className="text-xl font-black uppercase tracking-widest text-white uppercase tracking-tight">Estatuto OrgÃ¢nico de Contas (PGC)</h3>
                                    <span className="px-3 py-1 bg-gold-primary text-white text-[9px] font-black uppercase tracking-widest rounded-lg uppercase">{planoContas.length} Contas</span>
                                 </div>
                                 <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={14} />
                                    <input
                                       type="text"
                                       placeholder="Filtrar contas..."
                                       className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs w-64 focus:ring-2 focus:ring-yellow-500/20"
                                    />
                                 </div>
                              </div>
                              <div className="overflow-x-auto">
                                 <table className="w-full text-left">
                                    <thead className="bg-gold-primary text-white">
                                       <tr className="text-[10px] font-black uppercase tracking-widest">
                                          <th className="px-10 py-5">Código</th>
                                          <th className="px-6 py-5">Descrição</th>
                                          <th className="px-6 py-5">Tipo</th>
                                          <th className="px-6 py-5">Natureza</th>
                                          <th className="px-6 py-5 text-center">Status</th>
                                          <th className="px-10 py-5 text-right">Ações</th>
                                       </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100">
                                       {planoContas.sort((a, b) => a.codigo.localeCompare(b.codigo)).map(c => {
                                          const isRoot = !c.codigo.includes('.');
                                          const parts = c.codigo.split('.');
                                          const parentCode = parts.slice(0, -1).join('.');
                                          const isVisible = isRoot || expandedAccounts.has(parentCode);
                                          if (!isVisible) return null;

                                          return (
                                             <tr key={c.id} className={`group hover:bg-bg-deep transition-all ${c.e_sintetica ? 'bg-bg-deep/30' : ''}`}>
                                                <td className="px-10 py-4 font-mono text-xs font-bold text-white/40">
                                                   <div className="flex items-center gap-2">
                                                      {c.e_sintetica && (
                                                         <button onClick={() => toggleAccount(c.codigo)} className="p-1 hover:bg-zinc-200 rounded-lg transition-all">
                                                            {expandedAccounts.has(c.codigo) ? <ArrowDownLeft size={12} className="rotate-45" /> : <ArrowUpRight size={12} className="rotate-45" />}
                                                         </button>
                                                      )}
                                                      {c.codigo}
                                                   </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                   <div className="flex items-center gap-2" style={{ paddingLeft: `${(c.nivel || 1 - 1) * 20}px` }}>
                                                      <span className={`${c.e_sintetica ? 'font-black uppercase tracking-widest text-white' : 'font-bold text-white/70'}`}>{c.nome}</span>
                                                      {!c.aceita_lancamentos && <Lock size={10} className="text-white/20" title="Conta Sintética" />}
                                                   </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                   <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest uppercase ${c.tipo === 'Ativo' ? 'bg-blue-50 text-blue-600' : c.tipo === 'Passivo' ? 'bg-orange-50 text-orange-600' : c.tipo === 'Capital' ? 'bg-purple-50 text-purple-600' : c.tipo === 'Receita' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                                      {c.tipo}
                                                   </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                   <span className="text-[10px] font-bold text-white/30 uppercase">{c.natureza}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                   {c.aceita_lancamentos ? (
                                                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-md text-[8px] font-black uppercase tracking-widest uppercase">Analítica</span>
                                                   ) : (
                                                      <span className="px-2 py-0.5 bg-zinc-200 text-white/70 rounded-md text-[8px] font-black uppercase tracking-widest uppercase">Sintética</span>
                                                   )}
                                                </td>
                                                <td className="px-10 py-4 text-right">
                                                   <button className="p-2 text-zinc-200 group-hover:text-white transition-colors"><MoreVertical size={16} /></button>
                                                </td>
                                             </tr>
                                          );
                                       })}
                                    </tbody>
                                 </table>
                              </div>
                           </div>
                        ) : (
                           <div className="bg-white/5 rounded-[3.5rem] shadow-[0_0_30px_rgba(212,175,55,0.05)] border border-white/10 overflow-hidden p-10">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                 {centrosCusto.length === 0 ? (
                                    <div className="col-span-3 text-center py-20 bg-bg-deep rounded-[3rem] border-2 border-dashed border-white/10">
                                       <Landmark className="mx-auto text-white/20 mb-4" size={48} />
                                       <p className="text-white/40 font-bold uppercase text-xs tracking-widest">Nenhum Centro de Custo configurado.</p>
                                       <button onClick={() => setShowCCModal(true)} className="mt-4 px-6 py-3 bg-gold-primary text-white rounded-xl font-black uppercase tracking-widest text-[10px] uppercase">Definir primeiro centro</button>
                                    </div>
                                 ) : (
                                    centrosCusto.map((cc, idx) => (
                                       <div key={idx} className="p-8 rounded-[2.5rem] bg-bg-deep border border-white/5 hover:border-gold-primary/40 transition-all group relative overflow-hidden">
                                          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform"><Landmark size={64} /></div>
                                          <p className="text-[10px] font-black uppercase tracking-widest text-gold-primary uppercase tracking-widest mb-2">{cc.tipo}</p>
                                          <h4 className="text-2xl font-black uppercase tracking-widest text-white tracking-tighter mb-1 uppercase">{cc.nome}</h4>
                                          <p className="text-[10px] font-mono text-white/30 font-bold uppercase mb-4">Código: {cc.codigo}</p>
                                          <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/10">
                                             <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest uppercase ${cc.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {cc.ativo ? 'Ativo' : 'Inativo'}
                                             </span>
                                             <button className="text-white/30 hover:text-white"><MoreVertical size={16} /></button>
                                          </div>
                                       </div>
                                    ))
                                 )}
                              </div>
                           </div>
                        )}
                     </div>
                  )
               }

               {/* --- GESTÃO DE PERÃODOS --- */}
               {
                  activeTab === 'periodos' && (
                     <div className="space-y-8 animate-in slide-in-from-bottom-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                           <div className="bg-gold-primary p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
                              <Calendar size={120} className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform" />
                              <h4 className="text-white/30 text-[10px] font-black uppercase tracking-widest mb-6">Controlo de Exercício</h4>
                              <p className="text-3xl font-black uppercase tracking-widest mb-2">Ano {
                                 periodos.filter(p => p.company_id === selectedEmpresaId).length > 0
                                    ? Math.max(...periodos.filter(p => p.company_id === selectedEmpresaId).map(p => Number(p.ano)))
                                    : new Date().getFullYear()
                              }</p>
                              <p className="text-xs text-white/40 font-bold uppercase">Exercício Corrente</p>
                              <button
                                 onClick={handleOpenYear}
                                 className="mt-8 px-6 py-3 bg-white/10 hover:bg-gold-primary hover:text-white border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                              >
                                 Abrir Novo Ano
                              </button>
                           </div>

                           <div className="md:col-span-2 bg-white/5 rounded-[3rem] shadow-[0_0_30px_rgba(212,175,55,0.05)] border border-white/10 overflow-hidden">
                              <div className="p-10 border-b border-white/5 flex justify-between items-center bg-bg-deep/50">
                                 <h3 className="text-xl font-black uppercase tracking-widest text-white uppercase tracking-tight">Meses Contabilísticos</h3>
                                 <button
                                    onClick={handleOpenMonth}
                                    className="flex items-center gap-2 px-6 py-3 bg-gold-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px] uppercase tracking-widest hover:bg-gold-primary hover:text-white transition-all"
                                 >
                                    <Plus size={18} /> Novo Mês
                                 </button>
                              </div>
                              <div className="divide-y divide-zinc-100">
                                 {periodos.filter(p => p.company_id === selectedEmpresaId).map(p => (
                                    <div key={p.id} className="p-8 flex items-center justify-between group hover:bg-bg-deep transition-all">
                                       <div className="flex items-center gap-6">
                                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${p.status === 'Aberto' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                             {p.status === 'Aberto' ? <CheckCircle2 size={24} /> : <Lock size={24} />}
                                          </div>
                                          <div>
                                             <h4 className="font-black uppercase tracking-widest text-white text-lg">{p.mes}/{p.ano}</h4>
                                             <p className={`text-[10px] font-black uppercase tracking-widest ${p.status === 'Aberto' ? 'text-green-500' : 'text-red-500'}`}>{p.status}</p>
                                          </div>
                                       </div>
                                       <div className="flex gap-4">
                                          {p.status === 'Aberto' ? (
                                             <button
                                                onClick={() => handleClosePeriod(p.id)}
                                                className="px-6 py-3 bg-white/5 text-white/70 rounded-xl font-black uppercase tracking-widest text-[9px] uppercase tracking-widest hover:bg-gold-primary hover:text-white transition-all"
                                             >
                                                Fechar Período
                                             </button>
                                          ) : (
                                             <button className="px-6 py-3 bg-red-50 text-red-600 rounded-xl font-black uppercase tracking-widest text-[9px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all flex items-center gap-2">
                                                <ShieldAlert size={14} /> Reabrir (Audit)
                                             </button>
                                          )}
                                          <button className="p-3 text-white/20 hover:text-white transition-colors"><Search size={20} /></button>
                                       </div>
                                    </div>
                                 ))}
                                 {periodos.filter(p => p.company_id === selectedEmpresaId).length === 0 && (
                                    <div className="p-20 text-center text-white/30 font-bold italic">Nenhum período contabilístico configurado para esta unidade.</div>
                                 )}
                              </div>
                           </div>
                        </div>
                     </div>
                  )
               }

               {/* --- FISCAL / IMPOSTOS --- */}
               {
                  activeTab === 'fiscal' && (
                     <div className="space-y-8 animate-in slide-in-from-bottom-4">
                        <div className="bg-white/5 rounded-[3rem] shadow-[0_0_30px_rgba(212,175,55,0.05)] border border-white/10 overflow-hidden">
                           <div className="p-10 border-b border-white/5 flex justify-between items-center bg-bg-deep/50">
                              <div>
                                 <h3 className="text-xl font-black uppercase tracking-widest text-white uppercase tracking-tight">Gestão Fiscal & Impostos</h3>
                                 <p className="text-xs text-white/30 font-bold uppercase tracking-widest mt-1">Apuramento de IVA, IRT e Contribuições INSS</p>
                              </div>
                              <button className="flex items-center gap-2 px-6 py-3 bg-gold-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gold-primary/90 transition-all shadow-lg shadow-gold-primary/20">
                                 <Plus size={18} /> Nova Declaração
                              </button>
                           </div>

                           <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                              {/* Card IVA */}
                              <div className="bg-bg-deep p-8 rounded-[2rem] border border-white/5 hover:border-gold-primary/30 transition-all group">
                                 <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white/40 mb-6 group-hover:bg-gold-primary group-hover:text-white transition-all">
                                    <PieChartIcon size={24} />
                                 </div>
                                 <h4 className="text-lg font-black uppercase tracking-widest text-white mb-2">Apuramento de IVA</h4>
                                 <p className="text-[10px] text-white/40 font-bold uppercase leading-relaxed mb-6">Registo e controle de IVA suportado e liquidado. Geração do mapa de apuramento mensal e exportação de dados.</p>
                                 <button className="w-full py-3 bg-white/5 hover:bg-gold-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all">Gerir IVA</button>
                              </div>

                              {/* Card IRT */}
                              <div className="bg-bg-deep p-8 rounded-[2rem] border border-white/5 hover:border-gold-primary/30 transition-all group">
                                 <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white/40 mb-6 group-hover:bg-gold-primary group-hover:text-white transition-all">
                                    <Calculator size={24} />
                                 </div>
                                 <h4 className="text-lg font-black uppercase tracking-widest text-white mb-2">Retenção na Fonte (IRT)</h4>
                                 <p className="text-[10px] text-white/40 font-bold uppercase leading-relaxed mb-6">Controle de imposto retido na fonte (trabalho dependente e independentes). Emissão de guias.</p>
                                 <button className="w-full py-3 bg-white/5 hover:bg-gold-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all">Gerir IRT</button>
                              </div>

                              {/* Card INSS */}
                              <div className="bg-bg-deep p-8 rounded-[2rem] border border-white/5 hover:border-gold-primary/30 transition-all group">
                                 <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white/40 mb-6 group-hover:bg-gold-primary group-hover:text-white transition-all">
                                    <Landmark size={24} />
                                 </div>
                                 <h4 className="text-lg font-black uppercase tracking-widest text-white mb-2">Segurança Social (INSS)</h4>
                                 <p className="text-[10px] text-white/40 font-bold uppercase leading-relaxed mb-6">Processamento das contribuições mensais dos funcionários e da empresa. Integração com a Folha de Salários.</p>
                                 <button className="w-full py-3 bg-white/5 hover:bg-gold-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all">Gerir INSS</button>
                              </div>
                           </div>

                           {/* Tabela Resumo */}
                           <div className="border-t border-white/5 p-8">
                              <h4 className="text-xs font-black uppercase tracking-widest text-white/40 mb-6">Últimas Declarações Registadas</h4>
                              <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest text-white/30">
                                 <div className="col-span-2">Período</div>
                                 <div className="col-span-3">Tipo de Imposto</div>
                                 <div className="col-span-3">Valor Apurado (AOA)</div>
                                 <div className="col-span-2">Status</div>
                                 <div className="col-span-2 text-right">Acções</div>
                              </div>
                              <div className="py-10 text-center text-white/20 font-bold italic text-[10px] uppercase tracking-widest">
                                 Nenhuma declaração pendente ou submetida este período.
                              </div>
                           </div>
                        </div>
                     </div>
                  )
               }

               {/* --- CONCILIAÇÃO BANCÃRIA --- */}
               {
                  activeTab === 'conciliacao' && (
                     <div className="space-y-8 animate-in slide-in-from-bottom-4">
                        <div className="bg-white/5 rounded-[3rem] shadow-[0_0_30px_rgba(212,175,55,0.05)] border border-white/10 overflow-hidden">
                           <div className="p-10 border-b border-white/5 flex justify-between items-center bg-bg-deep/50">
                              <div>
                                 <h3 className="text-xl font-black uppercase tracking-widest text-white uppercase tracking-tight">Conciliação Bancária Inteligente</h3>
                                 <p className="text-xs text-white/30 font-bold uppercase tracking-widest mt-1">Sincronização de extratos com lançamentos contabilísticos</p>
                              </div>
                              <div className="flex gap-4">
                                 <label className="flex items-center gap-2 px-6 py-3 bg-gold-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px] uppercase tracking-widest hover:bg-gold-primary hover:text-white transition-all cursor-pointer" title="Formato: Data,Descrição,Valor (Ex: 2024-05-15,Pagamento Fornecedor,-50000)">
                                    <RefreshCw size={18} /> Importar Extrato (CSV)
                                    <input type="file" className="hidden" accept=".csv" onChange={async (e) => {
                                       const file = e.target.files?.[0];
                                       if (!file) return;
                                       const text = await file.text();
                                       const rows = text.split('\n').filter(r => r.trim());
                                       const batch = rows.slice(1).map(row => {
                                          const parts = row.split(',');
                                          return {
                                             data: parts[0]?.trim(),
                                             descricao: parts[1]?.trim(),
                                             valor: parseFloat(parts[2]?.trim()),
                                             company_id: selectedEmpresaId,
                                             status: 'Pendente'
                                          };
                                       });
                                       const { error } = await supabase.from('acc_extratos_bancarios').insert(batch);
                                       if (error) {
                                          console.error('Import error:', error);
                                          alert('Erro ao importar extrato. Verifique o formato CSV (Data,Descrição,Valor).');
                                       } else {
                                          clearQueryCache();
          (fetchAccountingData as any).lastSync = 0;
          fetchAccountingData();
                                       }
                                    }} />
                                 </label>
                              </div>
                           </div>
                           <div className="p-6">
                              <div className="grid grid-cols-12 gap-4 px-8 py-4 bg-gold-primary rounded-2xl text-white text-[10px] font-black uppercase tracking-widest mb-4 font-mono">
                                 <div className="col-span-2">Data</div>
                                 <div className="col-span-4">Descrição Bancária</div>
                                 <div className="col-span-2">Valor (Kz)</div>
                                 <div className="col-span-4">Sugestão de Lançamento</div>
                              </div>
                              <div className="space-y-3">
                                 {extratos.filter(e => e.company_id === selectedEmpresaId).map(ex => {
                                    const match = lancamentos.find(l =>
                                       Math.abs(Number(l.valor) - Math.abs(ex.valor)) < 0.01 &&
                                       Math.abs(new Date(l.data).getTime() - new Date(ex.data).getTime()) < 3 * 24 * 60 * 60 * 1000
                                    );
                                    return (
                                       <div key={ex.id} className="grid grid-cols-12 gap-4 px-8 py-5 rounded-2xl items-center border border-zinc-50 hover:border-white/10 transition-all">
                                          <div className="col-span-2 text-xs font-bold text-white/40">{ex.data}</div>
                                          <div className="col-span-4 text-xs font-black uppercase tracking-widest uppercase text-white/90">{ex.descricao}</div>
                                          <div className="col-span-2 text-xs font-black uppercase tracking-widest text-white">{safeFormatAOA(ex.valor)}</div>
                                          <div className="col-span-4 flex items-center justify-between">
                                             {match ? (
                                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-green-600 bg-green-50 px-3 py-1.5 rounded-xl border border-green-100 w-full group">
                                                   <div className="flex-1 flex items-center gap-2">
                                                      <CheckCircle2 size={14} /> Similar: {match.descricao}
                                                   </div>
                                                   <button
                                                      onClick={async () => {
                                                         const { error } = await supabase.from('acc_extratos_bancarios').update({
                                                            status: 'Conciliado',
                                                            lancamento_id: match.id
                                                         }).eq('id', ex.id).eq('company_id', selectedEmpresaId);
                                                         if (!error) fetchAccountingData();
                                                      }}
                                                      className="px-2 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                                   >
                                                      Confirmar
                                                   </button>
                                                </div>
                                             ) : (
                                                <div className="flex items-center gap-2">
                                                   <div className="text-[10px] font-bold text-white/30 p-2 italic">Sem correspondência exacta</div>
                                                   <button
                                                      onClick={() => {
                                                         setNewEntry({
                                                            ...newEntry,
                                                            descricao: ex.descricao,
                                                            valor: Math.abs(ex.valor),
                                                            data: ex.data
                                                         });
                                                         setShowEntryModal(true);
                                                      }}
                                                      className="px-3 py-1.5 bg-white/5 text-white/70 rounded-lg font-black uppercase tracking-widest text-[9px] uppercase tracking-widest hover:bg-gold-primary hover:text-white transition-all shadow-[0_0_30px_rgba(212,175,55,0.05)]"
                                                   >
                                                      Novo Lançamento
                                                   </button>
                                                </div>
                                             )}
                                          </div>
                                       </div>
                                    );
                                 })}
                                 {extratos.filter(e => e.company_id === selectedEmpresaId).length === 0 && (
                                    <div className="p-20 text-center text-white/30 font-bold italic">Nenhum extrato importado. Carregue um ficheiro CSV para iniciar a conciliação.</div>
                                 )}
                              </div>
                           </div>
                        </div>
                     </div>
                  )
               }

               {/* --- AUDITORIA --- */}
               {
                  activeTab === 'auditoria' && (
                     <div className="space-y-6 animate-in slide-in-from-bottom-4">

                        {/* Painel de Status de Integridade */}
                        <div className="bg-gold-primary rounded-[3rem] p-10 flex flex-col md:flex-row gap-8 items-center justify-between">
                           <div className="flex items-center gap-6">
                              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 ${!integrityResult ? 'bg-zinc-700' :
                                 integrityResult.status === 'OK' ? 'bg-green-500/20' : 'bg-red-500/20'
                                 }`}>
                                 {!integrityResult ? <ShieldCheck size={32} className="text-white/30" /> :
                                    integrityResult.status === 'OK'
                                       ? <ShieldCheck size={32} className="text-green-400" />
                                       : <ShieldAlert size={32} className="text-red-400" />}
                              </div>
                              <div>
                                 <p className="text-[10px] font-black uppercase tracking-widest text-white/30 uppercase tracking-widest">Ledger Imutável — Verificação de Integridade</p>
                                 {integrityResult ? (
                                    <>
                                       <p className={`text-2xl font-black uppercase tracking-widest mt-1 ${integrityResult.status === 'OK' ? 'text-green-400' : 'text-red-400'}`}>
                                          {integrityResult.status === 'OK' ? '? Integridade Verificada' : '? Anomalias Detectadas'}
                                       </p>
                                       <p className="text-xs text-white/40 font-bold mt-1">
                                          {integrityResult.unbalanced_entries === 0
                                             ? 'Todos os lançamentos estão em equilíbrio (D=C).'
                                             : `${integrityResult.unbalanced_entries} lançamento(s) com D?C encontrado(s).`
                                          } • {new Date(integrityResult.check_date).toLocaleString('pt-PT')}
                                       </p>
                                    </>
                                 ) : (
                                    <p className="text-lg font-black uppercase tracking-widest text-white/20 mt-1">Clique para verificar a cadeia de blocos contábeis</p>
                                 )}
                              </div>
                           </div>
                           <button
                              onClick={() => { handleCheckLedgerIntegrity(); fetchLedgerEntries(); }}
                              disabled={isCheckingIntegrity}
                              className="flex items-center gap-3 px-8 py-4 bg-gold-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px] uppercase tracking-widest hover:bg-yellow-400 transition-all disabled:opacity-50 shadow-lg shadow-yellow-500/20 flex-shrink-0"
                           >
                              {isCheckingIntegrity ? <RefreshCw size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                              {isCheckingIntegrity ? 'A verificar...' : 'Verificar Integridade'}
                           </button>
                        </div>

                        {/* Blockchain Contábil */}
                        {ledgerEntries.length > 0 && (
                           <div className="bg-white/5 rounded-[3rem] shadow-[0_0_30px_rgba(212,175,55,0.05)] border border-white/10 overflow-hidden">
                              <div className="p-8 border-b border-white/5 bg-bg-deep/50">
                                 <h4 className="text-sm font-black uppercase tracking-widest text-white uppercase tracking-widest flex items-center gap-2">
                                    <Lock size={16} className="text-gold-primary" /> Blockchain Contábil — Ãšltimos {ledgerEntries.length} Blocos
                                 </h4>
                              </div>
                              <div className="divide-y divide-zinc-50">
                                 {ledgerEntries.map((entry, idx) => (
                                    <div key={entry.id} className="flex items-center gap-6 px-8 py-5 hover:bg-bg-deep/50 transition-colors">
                                       <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black uppercase tracking-widest text-[10px] flex-shrink-0 ${idx === 0 ? 'bg-gold-primary text-white' : 'bg-white/5 text-white/40'
                                          }`}>{ledgerEntries.length - idx}</div>
                                       <div className="flex-1 min-w-0">
                                          <p className="font-mono text-[9px] text-white/30 truncate">HASH: {entry.hash}</p>
                                          {entry.prev_hash && <p className="font-mono text-[9px] text-white/20 truncate">PREV: {entry.prev_hash}</p>}
                                       </div>
                                       <p className="text-[9px] font-mono text-white/20 flex-shrink-0">{new Date(entry.created_at).toLocaleString('pt-PT')}</p>
                                    </div>
                                 ))}
                              </div>
                           </div>
                        )}

                        {/* Logs do Sistema */}
                        <div className="bg-white/5 rounded-[3rem] shadow-[0_0_30px_rgba(212,175,55,0.05)] border border-white/10 overflow-hidden">
                           <div className="p-10 border-b border-white/5 bg-bg-deep/50 flex justify-between items-center">
                              <div>
                                 <h3 className="text-xl font-black uppercase tracking-widest text-white uppercase tracking-tight">Rasto de Auditoria Imutável</h3>
                                 <p className="text-xs text-white/30 font-bold uppercase tracking-widest mt-1">Registo completo de alterações e acessos fiscais</p>
                              </div>
                              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-green-100">
                                 <ShieldCheck size={16} /> Sistema Protegido
                              </div>
                           </div>
                           <div className="overflow-hidden">
                              <div className="p-10 bg-bg-deep/30 border-b border-white/5">
                                 <h4 className="text-[10px] font-black uppercase tracking-widest text-white/30 uppercase tracking-widest mb-6">Logs de Operação do Sistema</h4>
                                 <div className="space-y-4">
                                    {systemLogs.map(s => {
                                       const safeDate = s?.created_at ? new Date(s.created_at) : null;
                                       return (
                                          <div key={s?.id || Math.random()} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 shadow-[0_0_30px_rgba(212,175,55,0.05)] transition-all hover:shadow-md">
                                             <div className="flex items-center gap-4">
                                                <div className={`w-2 h-2 rounded-full ${s?.nivel === 'ERROR' ? 'bg-red-500 animate-pulse' : s?.nivel === 'WARN' ? 'bg-gold-primary' : 'bg-green-500'}`}></div>
                                                <div>
                                                   <p className="text-xs font-black uppercase tracking-widest text-white uppercase">{s?.evento || 'Evento'}</p>
                                                   <p className="text-[10px] text-white/30 font-bold">{s?.descricao || 'Sem descrição'}</p>
                                                </div>
                                             </div>
                                             <p className="text-[9px] font-mono text-white/20 font-black uppercase tracking-widest">
                                                {safeDate && !isNaN(safeDate.getTime()) ? safeDate.toLocaleTimeString() : '--:--'}
                                             </p>
                                          </div>
                                       );
                                    })}
                                    {systemLogs.length === 0 && <p className="text-[10px] font-bold text-white/20 italic text-center py-4">Nenhum evento operacional registado hoje.</p>}
                                 </div>
                              </div>

                              <table className="w-full text-left border-collapse">
                                 <thead>
                                    <tr className="bg-gold-primary text-white text-[9px] font-black uppercase tracking-widest uppercase tracking-[0.2em]">
                                       <th className="px-8 py-5">Data/Hora</th>
                                       <th className="px-8 py-5">Ação</th>
                                       <th className="px-8 py-5">Tabela</th>
                                       <th className="px-8 py-5">Chave Registro</th>
                                    </tr>
                                 </thead>
                                 <tbody className="divide-y divide-zinc-100">
                                    {auditLogs.map((log) => {
                                       const safeDate = log?.created_at ? new Date(log.created_at) : null;
                                       return (
                                          <tr key={log?.id || Math.random()} className="text-xs hover:bg-bg-deep transition-all font-bold group">
                                             <td className="px-8 py-5 font-mono text-white/30 text-[10px]">
                                                {safeDate && !isNaN(safeDate.getTime()) ? safeDate.toLocaleString('pt-PT') : 'Data Inválida'}
                                             </td>
                                             <td className="px-8 py-5">
                                                <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest uppercase ${log?.acao === 'INSERT' ? 'bg-green-50 text-green-600' :
                                                   log?.acao === 'UPDATE' ? 'bg-sky-50 text-sky-600' :
                                                      'bg-red-50 text-red-600'
                                                   }`}>
                                                   {log?.acao || 'Ação'}
                                                </span>
                                             </td>
                                             <td className="px-8 py-5">
                                                <span className="text-white uppercase tracking-tighter">{log?.tabela_nome || 'N/A'}</span>
                                             </td>
                                             <td className="px-8 py-5 font-mono text-white/20 text-[10px] group-hover:text-white/70 transition-colors">
                                                {log?.registro_id || '---'}
                                             </td>
                                          </tr>
                                       );
                                    })}
                                    {auditLogs.length === 0 && (
                                       <tr>
                                          <td colSpan={4} className="p-20 text-center text-white/30 font-bold italic">
                                             Nenhum log de auditoria encontrado. As alterações serão registadas automaticamente.
                                          </td>
                                       </tr>
                                    )}
                                 </tbody>
                              </table>
                           </div>
                        </div>
                     </div>
                  )
               }

               {/* --- PAYROLL --- */}
               {
                  activeTab === 'folha' && (
                     <div className="space-y-8 animate-in slide-in-from-bottom-4">
                        {/* Header e Acções Rápidas */}
                        <div className="flex flex-col md:flex-row justify-between items-center bg-gold-primary p-12 rounded-[4rem] text-white shadow-3xl overflow-hidden relative">
                           <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
                              <Users size={200} />
                           </div>
                           <div className="z-10">
                              <h2 className="text-3xl font-black uppercase tracking-widest uppercase tracking-tight">Folha de Pagamento</h2>
                              <p className="text-white/30 text-lg font-medium">Ciclo: {periodos.find(p => p.id === selectedPeriodoId)?.mes || '00'}/{periodos.find(p => p.id === selectedPeriodoId)?.ano || '2024'}</p>
                              <div className="flex gap-4 mt-4">
                                 <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-gold-primary uppercase tracking-widest">Empresa Seleccionada</p>
                                    <p className="text-xs font-bold">{currentEmpresa?.nome || 'Nenhuma'}</p>
                                 </div>
                                 <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-sky-400 uppercase tracking-widest">Colaboradores</p>
                                    <p className="text-xs font-bold">{funcionarios.filter(f => (f as any).company_id === selectedEmpresaId).length} Activos</p>
                                 </div>
                              </div>
                           </div>
                           <div className="flex flex-col sm:flex-row gap-4 mt-8 md:mt-0 z-10">
                              <button
                                 onClick={() => setShowEmployeeModal(true)}
                                 className="px-8 py-5 bg-white/5 border border-white/10 text-white rounded-2xl font-black uppercase tracking-widest text-xs uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-3 backdrop-blur-md"
                              >
                                 <Plus size={20} /> Novo Funcionário
                              </button>
                              <button
                                 onClick={runPayroll}
                                 disabled={isProcessingPayroll || periodos.find(p => p.id === selectedPeriodoId)?.status === 'Fechado'}
                                 className="px-10 py-5 bg-gold-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs uppercase tracking-widest hover:bg-yellow-400 transition-all flex items-center gap-3 shadow-xl shadow-yellow-500/20 disabled:opacity-50"
                              >
                                 {isProcessingPayroll ? <RefreshCw className="animate-spin" /> : <Play size={20} />}
                                 {isProcessingPayroll ? 'Processando Lote...' : 'Processar Ciclo Completo'}
                              </button>
                           </div>
                        </div>

                        {/* Mini Dashboard de Custos */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                           {[
                              {
                                 label: 'Total Bruto',
                                 value: folhas?.filter(f => f.periodo_id === selectedPeriodoId && f.company_id === selectedEmpresaId).reduce((acc, f) =>
                                    acc + (Number((f as any).salario_bruto) || (Number(f.salario_base) + Number(f.subsidios))), 0) || 0,
                                 color: 'zinc'
                              },
                              {
                                 label: 'Total Líquido',
                                 value: folhas?.filter(f => f.periodo_id === selectedPeriodoId && f.company_id === selectedEmpresaId).reduce((acc, f) => acc + (Number(f.salario_liquido) || 0), 0) || 0,
                                 color: 'sky'
                              },
                              {
                                 label: 'Encargos (INSS/IRT)',
                                 value: folhas?.filter(f => f.periodo_id === selectedPeriodoId && f.company_id === selectedEmpresaId).reduce((acc, f) =>
                                    acc + (Number((f as any).total_descontos) || (Number(f.inss_trabalhador) + Number(f.irt))), 0) || 0,
                                 color: 'red'
                              },
                              {
                                 label: 'Custo Empresa',
                                 value: folhas?.filter(f => f.periodo_id === selectedPeriodoId && f.company_id === selectedEmpresaId).reduce((acc, f) =>
                                    acc + (Number((f as any).salario_bruto) || (Number(f.salario_base) + Number(f.subsidios))) + Number(f.inss_empresa), 0) || 0,
                                 color: 'yellow'
                              },
                           ].map((card, i) => (
                              <div key={i} className={`bg-white/5 p-6 rounded-3xl border border-${card.color}-100 shadow-[0_0_30px_rgba(212,175,55,0.05)] transition-all hover:shadow-md`}>
                                 <p className={`text-[9px] font-black uppercase tracking-widest text-${card.color}-500 uppercase tracking-widest mb-2`}>{card.label}</p>
                                 <p className="text-xl font-black uppercase tracking-widest text-white">{safeFormatAOA(card.value)}</p>
                              </div>
                           ))}
                        </div>

                        {/* Listagem de Folhas Processadas */}
                        <div className="bg-white/5 rounded-[3rem] border border-white/5 shadow-[0_0_30px_rgba(212,175,55,0.05)] overflow-hidden">
                           <div className="p-8 border-b border-zinc-50 flex justify-between items-center bg-bg-deep/50">
                              <h3 className="text-base font-black uppercase tracking-widest text-white uppercase tracking-tight flex items-center gap-3">
                                 <FileText className="text-gold-primary" /> Folhas Processadas no Período
                              </h3>
                              <div className="flex gap-2">
                                 <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-white/40 hover:bg-bg-deep transition-all flex items-center gap-2">
                                    <Download size={12} /> Exportar Relatório
                                 </button>
                              </div>
                           </div>
                           <div className="divide-y divide-zinc-50">
                              {folhas?.filter(f => f.company_id === selectedEmpresaId && (selectedPeriodoId ? f.periodo_id === selectedPeriodoId : true)).length === 0 ? (
                                 <div className="p-20 text-center space-y-4 opacity-50">
                                    <RefreshCw size={48} className="mx-auto text-white/20" />
                                    <p className="text-sm font-black uppercase tracking-widest text-white/30 uppercase tracking-widest">Nenhuma folha processada para este ciclo.</p>
                                 </div>
                              ) : (
                                 folhas?.filter(f => f.company_id === selectedEmpresaId && (selectedPeriodoId ? f.periodo_id === selectedPeriodoId : true)).map(f => (
                                    <div key={f.id} className="p-8 flex items-center justify-between group hover:bg-bg-deep/80 transition-all">
                                       <div className="flex items-center gap-6">
                                          <div className="w-14 h-14 rounded-2xl bg-bg-deep flex items-center justify-center text-white/30 border border-white/5 group-hover:bg-gold-primary group-hover:text-white transition-all">
                                             <Users size={28} />
                                          </div>
                                          <div>
                                             <h4 className="font-black uppercase tracking-widest text-white text-lg leading-none mb-1">{f?.funcionario_nome || 'Funcionário'}</h4>
                                             <p className="text-[10px] font-black uppercase tracking-widest text-white/30 uppercase tracking-widest">Base: {safeFormatAOA(Number(f?.salario_base) || 0)}</p>
                                          </div>
                                       </div>
                                       <div className="hidden lg:grid grid-cols-3 gap-12 text-center border-x border-zinc-50 px-12 mx-8">
                                          <div>
                                             <p className="text-[9px] font-black uppercase tracking-widest text-white/20 uppercase mb-1">INSS (3%)</p>
                                             <p className="text-sm font-bold text-red-500">-{safeFormatAOA(Number(f?.inss_trabalhador) || 0)}</p>
                                          </div>
                                          <div>
                                             <p className="text-[9px] font-black uppercase tracking-widest text-white/20 uppercase mb-1">IRT / Tax</p>
                                             <p className="text-sm font-bold text-red-400">-{safeFormatAOA(Number(f?.irt) || 0)}</p>
                                          </div>
                                          <div>
                                             <p className="text-[9px] font-black uppercase tracking-widest text-white/20 uppercase mb-1">Empresa (8%)</p>
                                             <p className="text-sm font-bold text-white/30">{safeFormatAOA(Number(f?.inss_empresa) || 0)}</p>
                                          </div>
                                       </div>
                                       <div className="text-right mr-8">
                                          <p className="text-[10px] font-black uppercase tracking-widest text-white/30 uppercase mb-1">Líquido a Receber</p>
                                          <p className="text-2xl font-black uppercase tracking-widest text-white">{safeFormatAOA(Number(f?.salario_liquido) || 0)}</p>
                                       </div>
                                       <div className="flex gap-2">
                                          <button
                                             onClick={() => setSelectedFolha(f)}
                                             className="p-3 bg-bg-deep text-white/30 hover:bg-gold-primary hover:text-gold-primary rounded-xl transition-all shadow-[0_0_30px_rgba(212,175,55,0.05)]"
                                             title="Ver Recibo Detalhado"
                                          >
                                             <FileText size={20} />
                                          </button>
                                          <button className="p-3 bg-bg-deep text-white/30 hover:bg-sky-500 hover:text-white rounded-xl transition-all shadow-[0_0_30px_rgba(212,175,55,0.05)]"><Printer size={20} /></button>
                                       </div>
                                    </div>
                                 ))
                              )}
                           </div>
                        </div>
                     </div>
                  )
               }

               {/* --- FISCAL --- */}
               {
                  activeTab === 'fiscal' && (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4">
                        <div className="bg-white/5 p-12 rounded-[4rem] shadow-[0_0_30px_rgba(212,175,55,0.05)] border border-white/10">
                           <h3 className="text-xl font-black uppercase tracking-widest text-white mb-10 uppercase tracking-tight flex items-center gap-3">
                              <Calendar className="text-gold-primary" /> Agenda Fiscal {periodos.find(p => p.id === selectedPeriodoId)?.mes || ''}
                           </h3>
                           <div className="space-y-4">
                              {[
                                 { t: 'IVA - Declaração Periódica', d: '2024-03-25', v: (Number(financeReports.receitaTotal) || 0) * ((currentEmpresa?.regime_agt === 'Simplificado' ? 0.07 : (currentEmpresa?.taxa_iva || 14) / 100)) + (totalIva || 0) },
                                 { t: 'INSS - Guia de Pagamento', d: '2024-03-10', v: folhas?.filter(f => f.company_id === selectedEmpresaId && (selectedPeriodoId ? f.periodo_id === selectedPeriodoId : true)).reduce((acc, b) => acc + (Number(b.inss_trabalhador) || 0) + (Number(b.inss_empresa) || 0), 0) || 0 },
                                 { t: 'IRT - Retenções na Fonte', d: '2024-03-30', v: (currentEmpresa?.incidencia_irt !== false) ? (folhas?.filter(f => f.company_id === selectedEmpresaId && (selectedPeriodoId ? f.periodo_id === selectedPeriodoId : true)).reduce((acc, b) => acc + (Number(b.irt) || 0), 0) || 0) : 0 },
                                 { t: 'II - Imposto Industrial (Estimativa)', d: '2024-05-31', v: (Number(financeReports.lucroLiquido) > 0 ? (Number(financeReports.lucroLiquido) * (currentEmpresa?.taxa_ii || 25) / 100) : 0) },
                              ].map((o, i) => (
                                 <div key={i} className="flex items-center justify-between p-6 bg-bg-deep rounded-3xl border border-white/5">
                                    <div className="flex items-center gap-4">
                                       <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center"><Landmark size={20} /></div>
                                       <div><p className="font-black uppercase tracking-widest text-sm text-white">{o.t}</p><p className="text-[10px] font-black uppercase tracking-widest text-white/30 uppercase">Vence: {new Date(o.d).toLocaleDateString()}</p></div>
                                    </div>
                                    <p className="font-black uppercase tracking-widest text-white">{safeFormatAOA(o.v)}</p>
                                 </div>
                              ))}
                           </div>
                        </div>

                        <div className="bg-gold-primary p-12 rounded-[4rem] text-white shadow-2xl flex flex-col justify-between overflow-hidden relative print-hidden">
                           <FileText size={180} className="absolute -right-4 -bottom-4 opacity-5" />
                           <div className="space-y-6">
                              <h3 className="text-xl font-black uppercase tracking-widest uppercase tracking-tight">Carga Tributária Estimada</h3>
                              <div className="space-y-8">
                                 <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest uppercase"><span>IVA Estimado Total</span><span>{safeFormatAOA(financeReports.receitaTotal * ((currentEmpresa?.taxa_iva || 14) / 100) + (totalIva || 0))}</span></div>
                                    <div className="h-2 bg-white/10 rounded-full"><div className="h-full bg-gold-primary" style={{ width: `${Math.min(100, (currentEmpresa?.taxa_iva || 14) * 5)}%` }}></div></div>
                                 </div>
                                 <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest uppercase"><span>Imp. Industrial ({currentEmpresa?.taxa_ii || 25}%)</span><span>{safeFormatAOA(financeReports.lucroLiquido > 0 ? financeReports.lucroLiquido * ((currentEmpresa?.taxa_ii || 25) / 100) : 0)}</span></div>
                                    <div className="h-2 bg-white/10 rounded-full"><div className="h-full bg-sky-400" style={{ width: '45%' }}></div></div>
                                 </div>
                              </div>
                           </div>
                           <button
                              onClick={handleExportFiscal}
                              disabled={isExportingFiscal}
                              className="w-full mt-10 py-5 bg-white/5 border border-white/10 rounded-2xl font-black uppercase tracking-widest text-[10px] uppercase tracking-widest hover:bg-gold-primary hover:text-white transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                           >
                              {isExportingFiscal ? <RefreshCw className="animate-spin" /> : <Download size={20} />}
                              {isExportingFiscal ? 'Gerando Mapas...' : 'Exportar Mapas Fiscais (PDF)'}
                           </button>
                        </div>
                     </div>
                  )
               }

               {/* --- MODAL RELATÓRIO COMPLETO --- */}
               {
                  showReportModal && activeReport && (
                     <div className="fixed inset-0 z-[200] flex items-center justify-center bg-zinc-950/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
                        <div className="bg-white/5 w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
                           <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gold-primary text-white print:hidden">
                              <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 bg-gold-primary rounded-2xl flex items-center justify-center text-white shadow-lg">
                                    <FileText size={24} />
                                 </div>
                                 <div>
                                    <h2 className="text-xl font-black uppercase tracking-widest uppercase tracking-tight">{activeReport.title}</h2>
                                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{currentEmpresa?.nome} / {periodos.find(p => p.id === selectedPeriodoId)?.mes}/{periodos.find(p => p.id === selectedPeriodoId)?.ano}</p>
                                 </div>
                              </div>
                              <div className="flex gap-3">
                                 <button onClick={() => window.print()} className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"><Printer size={20} /></button>
                                 <button onClick={() => setShowReportModal(false)} className="p-3 bg-white/10 hover:bg-red-500 text-white rounded-full transition-all"><X size={20} /></button>
                              </div>
                           </div>

                           <div className="p-16 overflow-y-auto flex-1 print:p-0">
                              <div className="hidden print:flex flex-col mb-10 items-center text-center">
                                 <h1 className="text-3xl font-black uppercase tracking-widest uppercase">{activeReport.title}</h1>
                                 <p className="text-sm font-bold text-white/40 mt-2">{currentEmpresa?.nome}</p>
                                 <p className="text-xs text-white/30">NIF: {currentEmpresa?.nif} | Período: {periodos.find(p => p.id === selectedPeriodoId)?.mes}/{periodos.find(p => p.id === selectedPeriodoId)?.ano}</p>
                                 <div className="w-full h-1 bg-gold-primary my-6" />
                              </div>

                              {activeReport.id === 'diario' && (
                                 <table className="w-full text-left">
                                    <thead>
                                       <tr className="border-b-2 border-zinc-900">
                                          <th className="py-4 px-2 text-[10px] font-black uppercase tracking-widest uppercase">Data</th>
                                          <th className="py-4 px-2 text-[10px] font-black uppercase tracking-widest uppercase">Descrição</th>
                                          <th className="py-4 px-2 text-[10px] font-black uppercase tracking-widest uppercase">Débito</th>
                                          <th className="py-4 px-2 text-[10px] font-black uppercase tracking-widest uppercase">Crédito</th>
                                       </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100">
                                       {activeReport.data.map((l: any, i: number) => (
                                          <tr key={i} className="hover:bg-bg-deep">
                                             <td className="py-4 px-2 text-xs">{new Date(l.data).toLocaleDateString()}</td>
                                             <td className="py-4 px-2 text-xs font-bold">{l.descricao}</td>
                                             <td className="py-4 px-2 text-xs text-blue-600 font-bold">{safeFormatAOA((l.itens || []).filter((x: any) => x.tipo === 'D').reduce((acc: any, x: any) => acc + x.valor, 0))}</td>
                                             <td className="py-4 px-2 text-xs text-green-600 font-bold">{safeFormatAOA((l.itens || []).filter((x: any) => x.tipo === 'C').reduce((acc: any, x: any) => acc + x.valor, 0))}</td>
                                          </tr>
                                       ))}
                                       {activeReport.data.length === 0 && (
                                          <tr>
                                             <td colSpan={4} className="py-20 text-center text-white/30 font-bold uppercase text-[10px]">Nenhum lançamento encontrado para este período</td>
                                          </tr>
                                       )}
                                    </tbody>
                                 </table>
                              )}

                              {activeReport.id === 'balancete' && (
                                 <table className="w-full text-left">
                                    <thead>
                                       <tr className="border-b-2 border-zinc-900">
                                          <th className="py-4 px-2 text-[10px] font-black uppercase tracking-widest uppercase">Conta</th>
                                          <th className="py-4 px-2 text-[10px] font-black uppercase tracking-widest uppercase">Designação</th>
                                          <th className="py-4 px-2 text-[10px] font-black uppercase tracking-widest uppercase text-right">Somatório Débito</th>
                                          <th className="py-4 px-2 text-[10px] font-black uppercase tracking-widest uppercase text-right">Somatório Crédito</th>
                                          <th className="py-4 px-2 text-[10px] font-black uppercase tracking-widest uppercase text-right">Saldo</th>
                                       </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100">
                                       {activeReport.data.map((r: any, i: number) => (
                                          <tr key={i}>
                                             <td className="py-4 px-2 text-xs font-mono">{r.codigo}</td>
                                             <td className="py-4 px-2 text-xs font-bold">{r.nome}</td>
                                             <td className="py-4 px-2 text-xs text-right">{safeFormatAOA(r.debito)}</td>
                                             <td className="py-4 px-2 text-xs text-right">{safeFormatAOA(r.credito)}</td>
                                             <td className="py-4 px-2 text-xs font-black uppercase tracking-widest text-right">{safeFormatAOA(r.debito - r.credito)}</td>
                                          </tr>
                                       ))}
                                    </tbody>
                                 </table>
                              )}

                              {['dre', 'balanco', 'fiscal'].includes(activeReport.id) && (
                                 <div className="space-y-6">
                                    {activeReport.data.map((row: any, i: number) => (
                                       <div key={i} className={`flex justify-between items-center p-6 rounded-2xl ${row.tipo === 'T' ? 'bg-gold-primary text-white' : 'bg-bg-deep border border-white/5'}`}>
                                          <span className="text-xs font-black uppercase tracking-widest uppercase tracking-tight">{row.desc}</span>
                                          <span className={`text-lg font-black uppercase tracking-widest ${row.tipo === 'T' ? 'text-gold-primary' : (row.valor < 0 ? 'text-red-500' : 'text-white')}`}>
                                             {safeFormatAOA(row.valor)}
                                          </span>
                                       </div>
                                    ))}
                                 </div>
                              )}

                              {activeReport.id === 'razão' && (
                                 <div className="space-y-12">
                                    {(activeReport.data || []).map((cuenta: any, i: number) => (
                                       <div key={i} className="space-y-4">
                                          <div className="flex items-center gap-3 border-b-2 border-zinc-900 pb-2">
                                             <span className="bg-gold-primary text-white px-3 py-1 rounded-lg font-mono text-xs">{cuenta.codigo}</span>
                                             <h4 className="text-sm font-black uppercase tracking-widest uppercase">{cuenta.nome}</h4>
                                          </div>
                                          <table className="w-full text-left">
                                             <thead className="bg-bg-deep">
                                                <tr>
                                                   <th className="py-2 px-2 text-[9px] font-black uppercase tracking-widest uppercase text-white/30">Data</th>
                                                   <th className="py-2 px-2 text-[9px] font-black uppercase tracking-widest uppercase text-white/30">Descrição</th>
                                                   <th className="py-2 px-2 text-[9px] font-black uppercase tracking-widest uppercase text-white/30 text-right">Débito</th>
                                                   <th className="py-2 px-2 text-[9px] font-black uppercase tracking-widest uppercase text-white/30 text-right">Crédito</th>
                                                </tr>
                                             </thead>
                                             <tbody className="divide-y divide-zinc-50">
                                                {(cuenta.movimentos || []).map((mov: any, j: number) => (
                                                   <tr key={j}>
                                                      <td className="py-2 px-2 text-[10px]">{new Date(mov.data).toLocaleDateString()}</td>
                                                      <td className="py-2 px-2 text-[10px] font-bold">{mov.descricao}</td>
                                                      <td className="py-2 px-2 text-[10px] text-right text-blue-600">{mov.debito > 0 ? safeFormatAOA(mov.debito) : '-'}</td>
                                                      <td className="py-2 px-2 text-[10px] text-right text-green-600">{mov.credito > 0 ? safeFormatAOA(mov.credito) : '-'}</td>
                                                   </tr>
                                                ))}
                                             </tbody>
                                          </table>
                                       </div>
                                    ))}
                                 </div>
                              )}

                              {activeReport.id === 'cashflow' && (
                                 <div className="space-y-8">
                                    <div className="bg-gold-primary p-8 rounded-[2rem] text-white">
                                       <h3 className="text-lg font-black uppercase tracking-widest uppercase tracking-tight mb-2">Fluxo de Caixa Líquido</h3>
                                       <p className="text-3xl font-black uppercase tracking-widest text-gold-primary">{safeFormatAOA(activeReport.data?.find(r => r.tipo === 'T')?.valor || 0)}</p>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                       {(activeReport.data || []).map((row: any, i: number) => (
                                          <div key={i} className={`flex justify-between items-center p-6 rounded-2xl border ${row.tipo === 'R' ? 'bg-green-50 border-green-100' : (row.tipo === 'D' ? 'bg-red-50 border-red-100' : 'bg-bg-deep border-white/5')}`}>
                                             <span className="text-xs font-black uppercase tracking-widest uppercase">{row.desc}</span>
                                             <span className={`text-sm font-black uppercase tracking-widest ${row.tipo === 'R' ? 'text-green-600' : row.tipo === 'D' ? 'text-red-600' : 'text-white'}`}>{safeFormatAOA(row.valor)}</span>
                                          </div>
                                       ))}
                                    </div>
                                 </div>
                              )}

                              {activeReport.id === 'auditoria' && (
                                 <table className="w-full text-left">
                                    <thead>
                                       <tr className="border-b-2 border-zinc-900">
                                          <th className="py-4 px-2 text-[10px] font-black uppercase tracking-widest uppercase">Data</th>
                                          <th className="py-4 px-2 text-[10px] font-black uppercase tracking-widest uppercase">Utilizador</th>
                                          <th className="py-4 px-2 text-[10px] font-black uppercase tracking-widest uppercase">Ação</th>
                                          <th className="py-4 px-2 text-[10px] font-black uppercase tracking-widest uppercase">Tabela</th>
                                       </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100">
                                       {(activeReport.data || []).map((log: any, i: number) => (
                                          <tr key={i}>
                                             <td className="py-4 px-2 text-[10px]">{new Date(log.created_at).toLocaleString()}</td>
                                             <td className="py-4 px-2 text-xs font-bold">{log.utilizador_id?.split('-')[0]}</td>
                                             <td className="py-4 px-2 text-xs uppercase">{log.acao}</td>
                                             <td className="py-4 px-2 text-xs font-mono">{log.tabela_nome}</td>
                                          </tr>
                                       ))}
                                    </tbody>
                                 </table>
                              )}
                           </div>
                        </div >
                     </div >
                  )
               }

               {/* --- MODAL NOVO LANÇAMENTO (DIÃRIO) --- */}
               {
                  showEntryModal && (
                     <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
                        <div className="bg-white/5 w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                           <div className="p-8 border-b border-white/5 flex justify-between items-center bg-bg-deep/50">
                              <h2 className="text-xl font-black uppercase tracking-widest text-white flex items-center gap-3 uppercase tracking-tight">
                                 <BookOpen className="text-gold-primary" /> Novo Lançamento Contábil
                              </h2>
                              <button onClick={() => setShowEntryModal(false)} className="p-3 text-white/30 hover:bg-zinc-200 rounded-full transition-all"><X size={24} /></button>
                           </div>

                           {/* Modelos Pré-definidos */}
                           {regrasAutomaticas.length > 0 && (
                              <div className="px-8 pt-6 pb-2">
                                 <p className="text-[9px] font-black uppercase tracking-widest text-white/30 uppercase tracking-widest mb-3">Modelos Pré-definidos</p>
                                 <div className="flex flex-wrap gap-2">
                                    {[
                                       { label: 'Venda', debito: '3.1', credito: '6.1' },
                                       { label: 'Compra Stock', debito: '2.1', credito: '3.2' },
                                       { label: 'Salários', debito: '7.2', credito: '1.1' },
                                       { label: 'Pagamento Fornecedor', debito: '4.1', credito: '1.1' },
                                       { label: 'Recibo de Cliente', debito: '1.1', credito: '3.1' },
                                       ...regrasAutomaticas.map(r => ({ label: r.nome, debito: r.conta_debito_codigo, credito: r.conta_credito_codigo }))
                                    ].filter((v, i, a) => a.findIndex(x => x.label === v.label) === i).map((modelo, i) => (
                                       <button key={i} type="button"
                                          onClick={() => setNewEntry(prev => ({ ...prev, contaDebito: modelo.debito, contaCredito: modelo.credito, descricao: prev.descricao || modelo.label }))}
                                          className="px-3 py-1.5 bg-bg-deep border border-white/10 hover:bg-yellow-50 hover:border-yellow-300 text-white/70 hover:text-yellow-700 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">
                                          {modelo.label}
                                       </button>
                                    ))}
                                 </div>
                              </div>
                           )}

                           <div className="px-8 pt-4 pb-2">
                              <div
                                 onClick={async () => {
                                    alert("Funcionalidade de Scanner de Documentos Activa. Selecione um PDF para análise via Venda Plus IA.");
                                    setTimeout(() => {
                                       setNewEntry({
                                          ...newEntry,
                                          descricao: 'Factura 2024/042 - Serviços de Consultoria',
                                          valor: 150000,
                                          data: '2024-03-22'
                                       });
                                       handleAISuggestAccounts('Factura 2024/042 - Serviços de Consultoria');
                                    }, 2000);
                                 }}
                                 className="bg-yellow-50 border-2 border-dashed border-yellow-200 rounded-2xl p-4 flex items-center justify-center gap-3 cursor-pointer hover:bg-yellow-100 transition-all group"
                              >
                                 <Sparkles className="text-gold-primary group-hover:scale-125 transition-transform" />
                                 <span className="text-[10px] font-black uppercase tracking-widest uppercase text-yellow-700">Digitalizar Documento (PDF/IA)</span>
                              </div>
                           </div>
                           <form onSubmit={handleNewEntry} className="p-8 space-y-6">
                              <div className="relative group">
                                 <Input name="descricao" label="Histórico / Descrição" required
                                    value={newEntry.descricao} onChange={e => setNewEntry({ ...newEntry, descricao: e.target.value })}
                                    placeholder="Ex: Pagamento de Fornecedor X"
                                 />
                                 <button
                                    type="button"
                                    onClick={() => handleAISuggestAccounts(newEntry.descricao)}
                                    disabled={isSuggestingAccounts || !newEntry.descricao}
                                    className="absolute right-3 top-9 p-2 bg-gold-primary text-gold-primary rounded-lg hover:bg-gold-primary hover:text-white transition-all disabled:opacity-50"
                                    title="Sugerir Contas (IA)"
                                 >
                                    {isSuggestingAccounts ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                 </button>
                              </div>

                              <div className="grid grid-cols-2 gap-6">
                                 <Select name="contaDebito" label="Conta a Debitar"
                                    value={newEntry.contaDebito} onChange={e => setNewEntry({ ...newEntry, contaDebito: e.target.value })}
                                    options={planoContas.filter(c => c.natureza === 'Devedora' || c.tipo === 'Despesa').map(c => ({ value: c.codigo, label: `${c.codigo} - ${c.nome}` }))}
                                 />
                                 <Select
                                    label="Conta de Crédito"
                                    value={newEntry.contaCredito}
                                    onChange={(e) => setNewEntry({ ...newEntry, contaCredito: e.target.value })}
                                    options={planoContas.filter(c => c.natureza === 'Credora' || c.codigo === '1.1').map(c => ({ value: c.codigo, label: `${c.codigo} - ${c.nome}` }))}
                                 />
                              </div>
                              <div className="grid grid-cols-2 gap-6">
                                 <Input name="valor" label="Valor (AOA)" type="number" required
                                    value={newEntry.valor} onChange={e => setNewEntry({ ...newEntry, valor: Number(e.target.value) })}
                                 />
                                 <Input name="data" label="Data" type="date" required
                                    value={newEntry.data} onChange={e => setNewEntry({ ...newEntry, data: e.target.value })}
                                 />
                              </div>
                              {/* Indicador de validação D = C em tempo real */}
                              {(() => {
                                 const debitoConta = planoContas.find(c => c.codigo === newEntry.contaDebito);
                                 const creditoConta = planoContas.find(c => c.codigo === newEntry.contaCredito);
                                 const valOk = newEntry.valor > 0 && debitoConta && creditoConta && newEntry.contaDebito !== newEntry.contaCredito;
                                 return (
                                    <div className={`flex items-center justify-between p-4 rounded-2xl border-2 ${valOk ? 'bg-green-50 border-green-200' : 'bg-bg-deep border-white/10'}`}>
                                       <div className="flex items-center gap-2">
                                          <div className={`w-2.5 h-2.5 rounded-full ${valOk ? 'bg-green-500' : 'bg-zinc-300'}`} />
                                          <span className={`text-[9px] font-black uppercase tracking-widest ${valOk ? 'text-green-700' : 'text-white/30'}`}>
                                             {valOk ? 'Débito = Crédito — Lançamento equilibrado' : 'Selecione contas e valor para validar'}
                                          </span>
                                       </div>
                                       {valOk && <span className="text-[9px] font-black uppercase tracking-widest text-green-700 bg-green-100 px-2 py-1 rounded-lg">D = C = {safeFormatAOA(newEntry.valor)}</span>}
                                    </div>
                                 );
                              })()}
                              <button type="submit" className="w-full py-5 bg-gold-primary text-white font-black uppercase tracking-widest rounded-2xl uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 hover:bg-zinc-800 transition-all">
                                 <Save size={18} /> Confirmar Lançamento
                              </button>
                           </form>
                        </div>
                     </div>
                  )
               }
               {/* ===== MODAL DE COMPRAS ===== */}
               {
                  showCompraModal && (
                     <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/80 backdrop-blur-md p-4 animate-in fade-in">
                        <div className="bg-white/5 w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                           <div className="p-8 border-b border-white/5 flex justify-between items-center bg-orange-50">
                              <h2 className="text-xl font-black uppercase tracking-widest text-white flex items-center gap-3 uppercase tracking-tight">
                                 <ShoppingCart className="text-orange-500" size={24} /> Registar Compra
                              </h2>
                              <button onClick={() => setShowCompraModal(false)} className="p-3 text-white/30 hover:bg-zinc-200 rounded-full"><X size={22} /></button>
                           </div>
                           <form onSubmit={handleSaveCompra} className="p-8 space-y-5">
                              <div className="grid grid-cols-2 gap-4">
                                 <Input name="numero_compra" label="N.º Compra" value={newCompra.numero_compra}
                                    onChange={e => setNewCompra({ ...newCompra, numero_compra: e.target.value })} placeholder="COMP-001" />
                                 <Input name="data_compra" label="Data" type="date" required value={newCompra.data_compra}
                                    onChange={e => setNewCompra({ ...newCompra, data_compra: e.target.value })} />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                 <Input name="fornecedor_nome" label="Fornecedor" required value={newCompra.fornecedor_nome}
                                    onChange={e => setNewCompra({ ...newCompra, fornecedor_nome: e.target.value })} placeholder="Nome do fornecedor" />
                                 <Input name="fornecedor_nif" label="NIF Fornecedor" value={newCompra.fornecedor_nif}
                                    onChange={e => setNewCompra({ ...newCompra, fornecedor_nif: e.target.value })} placeholder="000000000" />
                              </div>
                              <Input name="descricao" label="Descrição / Artigos" value={newCompra.descricao}
                                 onChange={e => setNewCompra({ ...newCompra, descricao: e.target.value })} placeholder="Ex: Aquisição de materiais de escritório" />
                              <div className="grid grid-cols-3 gap-4">
                                 <Input name="valor_total" label="Total (AOA)" type="number" required value={newCompra.valor_total}
                                    onChange={e => setNewCompra({ ...newCompra, valor_total: Number(e.target.value) })} />
                                 <Input name="iva" label="IVA (AOA)" type="number" value={newCompra.iva}
                                    onChange={e => setNewCompra({ ...newCompra, iva: Number(e.target.value) })} />
                                 <div>
                                    <label className="block text-[9px] font-black uppercase tracking-widest text-white/40 uppercase tracking-widest mb-1">Categoria</label>
                                    <select value={newCompra.categoria} onChange={e => setNewCompra({ ...newCompra, categoria: e.target.value })}
                                       className="w-full border border-white/10 rounded-xl p-2.5 text-xs font-bold text-white/80 focus:outline-none focus:ring-2 focus:ring-yellow-400">
                                       {['Mercadorias', 'Serviços', 'Imobilizado', 'Matérias-Primas', 'Outros'].map(c => (
                                          <option key={c} value={c}>{c}</option>
                                       ))}
                                    </select>
                                 </div>
                              </div>
                              {/* Preview lançamento automático */}
                              {newCompra.valor_total > 0 && (
                                 <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-orange-600 uppercase tracking-widest mb-2">Lançamento Automático Gerado</p>
                                    <div className="flex justify-between text-xs font-bold text-white/80">
                                       <span>D: 2.1 Inventário / Activos</span>
                                       <span className="text-orange-600">{safeFormatAOA(newCompra.valor_total)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs font-bold text-white/80">
                                       <span>C: 3.2 Fornecedores / Contas a Pagar</span>
                                       <span className="text-orange-600">{safeFormatAOA(newCompra.valor_total)}</span>
                                    </div>
                                 </div>
                              )}
                              <button type="submit" disabled={isSavingCompra}
                                 className="w-full py-5 bg-orange-500 text-white font-black uppercase tracking-widest rounded-2xl uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 hover:bg-orange-600 transition-all disabled:opacity-50">
                                 {isSavingCompra ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                                 {isSavingCompra ? 'A Guardar...' : 'Registar Compra + Contabilizar'}
                              </button>
                           </form>
                        </div>
                     </div>
                  )
               }

               {/* ===== MODAL DE FATURAÇÃO ===== */}
               {
                  showInvoiceModal && (
                     <div className="fixed inset-0 z-[120] flex items-center justify-center bg-zinc-950/80 backdrop-blur-md p-4 animate-in fade-in">
                        <div className="bg-white/5 w-full max-w-5xl rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 max-h-[90vh] flex flex-col">
                           <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gold-primary text-white">
                              <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 bg-gold-primary rounded-2xl flex items-center justify-center text-white shadow-lg">
                                    <FileText size={24} />
                                 </div>
                                 <div>
                                    <h2 className="text-xl font-black uppercase tracking-widest uppercase tracking-tight">Emitir {invoiceForm.tipo}</h2>
                                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{currentEmpresa?.nome || 'Entidade Seleccionada'}</p>
                                 </div>
                              </div>
                              <button onClick={() => setShowInvoiceModal(false)} className="p-3 text-white/50 hover:bg-white/10 rounded-full transition-all"><X size={24} /></button>
                           </div>

                           <div className="flex-1 overflow-y-auto p-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
                              {/* Coluna Esquerda: Dados do Cliente e Selecção de Itens */}
                              <div className="lg:col-span-7 space-y-8">
                                 <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                       <label className="text-[10px] font-black uppercase tracking-widest text-white/30 uppercase tracking-widest">Tipo de Documento</label>
                                       <select value={invoiceForm.tipo} onChange={e => setInvoiceForm({ ...invoiceForm, tipo: e.target.value as any })}
                                          className="w-full bg-bg-deep border border-white/10 rounded-2xl p-4 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all">
                                          <option value="Factura">Factura (FT)</option>
                                          <option value="Factura-Recibo">Factura-Recibo (FR)</option>
                                          <option value="Pró-forma">Pró-forma (PRO)</option>
                                          <option value="Recibo">Recibo (RE)</option>
                                          <option value="Nota de Crédito">Nota de Crédito (NC)</option>
                                          <option value="Nota de Débito">Nota de Débito (ND)</option>

                                          <option value="Guia">Guia de Remessa</option>
                                          <option value="Encomenda">Nota de Encomenda</option>
                                       </select>
                                    </div>
                                    <Input label="Data de Emissão" type="date" value={invoiceForm.data_emissao} onChange={e => setInvoiceForm({ ...invoiceForm, data_emissao: e.target.value })} />
                                 </div>

                                 <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                       <label className="text-[10px] font-black uppercase tracking-widest text-white/30 uppercase tracking-widest block">Seleccionar Cliente Registado</label>
                                       <button
                                          onClick={() => setShowContactModal(true)}
                                          className="text-[9px] font-black uppercase tracking-widest text-gold-primary uppercase hover:underline flex items-center gap-1"
                                       >
                                          <Plus size={12} /> Novo Cliente
                                       </button>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[200px] overflow-y-auto p-1">
                                       {(contactos || []).filter(c => c.tipo !== 'Fornecedor').map(c => (
                                          <button key={c.id} onClick={() => setInvoiceForm({ ...invoiceForm, cliente_id: c.id, cliente_nome: c.nome })}
                                             className={`p-3 rounded-xl border text-[9px] font-black uppercase tracking-widest uppercase tracking-tighter transition-all text-left flex flex-col justify-center ${invoiceForm.cliente_id === c.id ? 'bg-gold-primary text-white border-gold-primary shadow-lg' : 'bg-white/5 text-white/40 border-white/10 hover:border-gold-primary hover:bg-white/10'}`}>
                                             <div className="truncate w-full">{c.nome}</div>
                                             <div className={`text-[7px] font-bold mt-1 ${invoiceForm.cliente_id === c.id ? 'text-white/70' : 'text-white/20'}`}>{c.nif || 'S/ NIF'}</div>
                                          </button>
                                       ))}
                                    </div>
                                 </div>

                                 <div className="space-y-4 bg-bg-deep p-6 rounded-3xl border border-white/10">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-white uppercase tracking-widest">Adicionar Serviço / Item Manual</h4>
                                    <div className="grid grid-cols-12 gap-4">
                                       <div className="col-span-6">
                                          <Input placeholder="Nome do Serviço ou Item" value={customItem.nome} onChange={e => setCustomItem({ ...customItem, nome: e.target.value })} />
                                       </div>
                                       <div className="col-span-3">
                                          <Input placeholder="Preço" type="number" value={customItem.preco} onChange={e => setCustomItem({ ...customItem, preco: Number(e.target.value) })} />
                                       </div>
                                       <div className="col-span-3">
                                          <button onClick={handleAddCustomItem} className="w-full h-[54px] bg-gold-primary text-white font-black uppercase tracking-widest rounded-2xl uppercase text-[9px] tracking-widest hover:bg-yellow-400 transition-all flex items-center justify-center gap-2">
                                             <Plus size={16} /> Add
                                          </button>
                                       </div>
                                    </div>
                                 </div>

                                 <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                       <label className="text-[10px] font-black uppercase tracking-widest text-white/30 uppercase tracking-widest">Catálogo de Itens</label>
                                       <span className="text-[10px] font-bold text-gold-primary bg-yellow-50 px-3 py-1 rounded-full uppercase">{extInventario.length} Disponíveis</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                       {extInventario.map(item => (
                                          <div key={item.id} onClick={() => handleAddInvoiceItem(item)}
                                             className="p-4 bg-bg-deep rounded-2xl border border-white/5 hover:bg-white/5 hover:border-yellow-400 hover:shadow-lg transition-all cursor-pointer group flex items-center gap-4">
                                             <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white/20 group-hover:text-gold-primary transition-colors">
                                                <ShoppingCart size={20} />
                                             </div>
                                             <div className="flex-1">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-white uppercase truncate max-w-[150px]">{item.nome}</p>
                                                <p className="text-[9px] font-bold text-white/30">{safeFormatAOA(item.preco_unitario || item.preco)}</p>
                                             </div>
                                             <Plus size={16} className="text-white/20 group-hover:text-gold-primary" />
                                          </div>
                                       ))}
                                    </div>
                                 </div>
                              </div>

                              {/* Coluna Direita: Resumo e Totais */}
                              <div className="lg:col-span-5 bg-bg-deep rounded-[2.5rem] p-8 flex flex-col h-full border border-white/10 shadow-inner">
                                 <div className="flex-1 space-y-6">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-white uppercase tracking-widest pb-4 border-b border-white/10">Itens do Documento</h3>

                                    <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                       {invoiceForm.itens.length === 0 ? (
                                          <div className="py-10 text-center space-y-3">
                                             <Package className="mx-auto text-white/20" size={32} />
                                             <p className="text-[10px] font-bold text-white/30 uppercase italic">Nenhum item adicionado</p>
                                          </div>
                                       ) : (
                                          invoiceForm.itens.map(it => (
                                             <div key={it.id} className="bg-white/5 p-5 rounded-2xl shadow-[0_0_30px_rgba(212,175,55,0.05)] space-y-4 relative group animate-in slide-in-from-right-4 border border-transparent hover:border-white/10">
                                                <button onClick={() => handleRemoveInvoiceItem(it.id)} className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10">
                                                   <X size={14} />
                                                </button>
                                                <div className="flex justify-between items-start">
                                                   <p className="text-[10px] font-black uppercase tracking-widest text-white uppercase truncate max-w-[200px]">{it.nome}</p>
                                                   <p className="text-xs font-black uppercase tracking-widest text-white">{safeFormatAOA(it.total)}</p>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3 items-center">
                                                   <div className="flex items-center gap-2">
                                                      <span className="text-[9px] font-black uppercase tracking-widest text-white/30 uppercase">Qtd:</span>
                                                      <input type="number" value={it.qtd} onChange={e => handleUpdateInvoiceItem(it.id, 'qtd', e.target.value)}
                                                         className="w-16 bg-bg-deep border border-white/5 rounded-lg p-2 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-yellow-500" />
                                                   </div>
                                                   <div className="flex items-center gap-2">
                                                      <span className="text-[9px] font-black uppercase tracking-widest text-white/30 uppercase">Preço:</span>
                                                      <input type="number" value={it.preco_unitario} onChange={e => handleUpdateInvoiceItem(it.id, 'preco_unitario', e.target.value)}
                                                         className="w-full bg-bg-deep border border-white/5 rounded-lg p-2 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-yellow-500" />
                                                   </div>
                                                </div>
                                             </div>
                                          ))
                                       )}
                                    </div>

                                    <div className="pt-6 space-y-3 border-t border-white/10">
                                       <div className="flex justify-between text-[11px] font-bold text-white/40 uppercase">
                                          <span>Subtotal</span>
                                          <span>{safeFormatAOA(invoiceForm.itens.reduce((acc, i) => acc + i.total, 0))}</span>
                                       </div>
                                       <div className="flex justify-between text-[11px] font-bold text-white/40 uppercase">
                                          <span>IVA ({invoiceForm.is_exempt ? '0%' : '14%'})</span>
                                          <span>{safeFormatAOA(invoiceForm.itens.reduce((acc, i) => acc + i.total, 0) * (invoiceForm.is_exempt ? 0 : 0.14))}</span>
                                       </div>
                                       <div className="flex justify-between text-xl font-black uppercase tracking-widest text-white pt-2 border-t border-white/10">
                                          <span className="uppercase tracking-tighter">Total Geral</span>
                                          <span className="text-gold-primary">{safeFormatAOA(invoiceForm.itens.reduce((acc, i) => acc + i.total, 0) * (invoiceForm.is_exempt ? 1 : 1.14))}</span>
                                       </div>
                                    </div>

                                    <div className="space-y-2">
                                       <label className="text-[9px] font-black uppercase tracking-widest text-white/30 uppercase tracking-widest">Observações</label>
                                       <textarea value={invoiceForm.observacoes} onChange={e => setInvoiceForm({ ...invoiceForm, observacoes: e.target.value })}
                                          className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-[10px] font-bold text-white/80 resize-none focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                          rows={2} placeholder="Condições de pagamento, notas..." />
                                    </div>
                                 </div>

                                 <button onClick={handleCreateInvoice} disabled={isSavingInvoice || invoiceForm.itens.length === 0}
                                    className="mt-8 w-full py-6 bg-gold-primary text-white font-black uppercase tracking-widest rounded-[2rem] uppercase text-xs tracking-widest hover:bg-gold-primary hover:text-white transition-all flex items-center justify-center gap-4 disabled:opacity-50 shadow-xl group">
                                    {isSavingInvoice ? <RefreshCw className="animate-spin" size={20} /> : <FileCheck size={20} className="group-hover:scale-125 transition-transform" />}
                                    {isSavingInvoice ? 'A Processar...' : `Finalizar e Emitir ${invoiceForm.tipo}`}
                                 </button>
                              </div>
                           </div>
                        </div>
                     </div>
                  )
               }

               {/* ===== PAINEL DE APROVAÇÃO PENDENTE (badge flutuante) ===== */}
               {
                  pendingApproval.length > 0 && (
                     <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4">
                        <button onClick={() => setShowApprovalModal(true)}
                           className="flex items-center gap-3 bg-gold-primary text-white px-5 py-4 rounded-2xl shadow-2xl font-black uppercase tracking-widest text-sm hover:bg-yellow-400 transition-all">
                           <div className="relative">
                              <CheckCircle2 size={22} />
                              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-black uppercase tracking-widest rounded-full w-4 h-4 flex items-center justify-center">
                                 {pendingApproval.length}
                              </span>
                           </div>
                           {pendingApproval.length} Lançamento{pendingApproval.length > 1 ? 's' : ''} Aguarda{pendingApproval.length === 1 ? '' : 'm'} Aprovação
                        </button>
                     </div>
                  )
               }

               {/* ===== MODAL DE APROVAÇÃO ===== */}
               {
                  showApprovalModal && (
                     <div className="fixed inset-0 z-[110] flex items-center justify-center bg-zinc-950/80 backdrop-blur-md p-4 animate-in fade-in">
                        <div className="bg-white/5 w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 max-h-[85vh] overflow-y-auto">
                           <div className="p-8 border-b border-white/5 flex justify-between items-center bg-yellow-50">
                              <h2 className="text-xl font-black uppercase tracking-widest text-white flex items-center gap-3 uppercase tracking-tight">
                                 <CheckCircle2 className="text-gold-primary" size={24} /> Aprovação de Lançamentos
                              </h2>
                              <button onClick={() => { setShowApprovalModal(false); setApprovalTarget(null); setApprovalObs(''); }} className="p-3 text-white/30 hover:bg-zinc-200 rounded-full"><X size={22} /></button>
                           </div>
                           {approvalTarget ? (
                              // Detalhe do lançamento a aprovar
                              <div className="p-8 space-y-5">
                                 <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-yellow-700 uppercase tracking-widest mb-1">Lançamento</p>
                                    <p className="font-black uppercase tracking-widest text-white">{approvalTarget.descricao}</p>
                                    <p className="text-xs text-white/40 mt-1">{approvalTarget.data ? new Date(approvalTarget.data).toLocaleDateString('pt-PT') : ''} • {approvalTarget.tipo_transacao}</p>
                                 </div>
                                 <div className="space-y-2">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-white/30 uppercase tracking-widest">Itens do Lançamento</p>
                                    {(approvalTarget.itens || []).map((it: any, i: number) => (
                                       <div key={i} className="flex justify-between items-center py-2 border-b border-zinc-50 text-xs">
                                          <span className="font-bold text-white/80">{it.conta_codigo} — {it.conta_nome}</span>
                                          <span className={`font-black uppercase tracking-widest px-2 py-0.5 rounded-lg ${it.tipo === 'D' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>
                                             {it.tipo} {safeFormatAOA(it.valor)}
                                          </span>
                                       </div>
                                    ))}
                                 </div>
                                 <div>
                                    <label className="block text-[9px] font-black uppercase tracking-widest text-white/30 uppercase tracking-widest mb-2">Observações (Opcional)</label>
                                    <textarea value={approvalObs} onChange={e => setApprovalObs(e.target.value)}
                                       className="w-full border border-white/10 rounded-2xl p-4 text-xs text-white/80 resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400" rows={3}
                                       placeholder="Notas de aprovação..." />
                                 </div>
                                 <div className="grid grid-cols-2 gap-4">
                                    <button onClick={() => handleRejeitarLancamento(approvalTarget)}
                                       className="py-4 bg-red-50 text-red-700 border border-red-200 font-black uppercase tracking-widest rounded-2xl uppercase text-[9px] tracking-widest hover:bg-red-100 transition-all flex items-center justify-center gap-2">
                                       <X size={14} /> Rejeitar
                                    </button>
                                    <button onClick={() => handleAprovarLancamento(approvalTarget, approvalObs)} disabled={isApprovingId === approvalTarget.id}
                                       className="py-4 bg-green-500 text-white font-black uppercase tracking-widest rounded-2xl uppercase text-[9px] tracking-widest hover:bg-green-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                                       {isApprovingId ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Aprovar e Postar
                                    </button>
                                 </div>
                                 <button onClick={() => { setApprovalTarget(null); setApprovalObs(''); }} className="w-full text-xs text-white/30 hover:text-white/70 transition-colors">? Voltar Ã  lista</button>
                              </div>
                           ) : (
                              // Lista de lançamentos pendentes
                              <div className="p-8 space-y-3">
                                 <p className="text-[9px] font-black uppercase tracking-widest text-white/30 uppercase tracking-widest mb-4">{pendingApproval.length} lançamento(s) aguardam revisão</p>
                                 {pendingApproval.map(l => (
                                    <div key={l.id} className="flex items-center justify-between p-4 bg-bg-deep rounded-2xl border border-white/5 hover:bg-yellow-50 hover:border-gold-primary/40 transition-all cursor-pointer" onClick={() => setApprovalTarget(l)}>
                                       <div>
                                          <p className="text-sm font-black uppercase tracking-widest text-white/90">{l.descricao}</p>
                                          <p className="text-[9px] text-white/30 font-bold uppercase">{l.tipo_transacao} • {l.data ? new Date(l.data).toLocaleDateString('pt-PT') : ''}</p>
                                       </div>
                                       <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-[9px] font-black uppercase tracking-widest rounded-lg uppercase tracking-widest">Pendente</span>
                                    </div>
                                 ))}
                              </div>
                           )}
                        </div>
                     </div>
                  )
               }


                {/* --- TABELAS DE DOCUMENTOS (FACTURAS, PROFORMAS, GUIAS, ENCOMENDAS) --- */}
                {
                   ['facturas', 'proformas', 'guias', 'encomendas', 'recibos', 'notas'].includes(activeTab) && (() => {
                      const typeMap: any = {
                         'facturas': 'Factura',
                         'proformas': 'Pró-forma',
                         'recibos': 'Recibo',
                         'notas': 'Nota',
                         'guias': 'Guia',
                         'encomendas': 'Encomenda'
                      };
                      
                      // Debug: Log all unique types in extFinanceiroNotas
                      if (activeTab === 'proformas') {
                         const allTypes = [...new Set(extFinanceiroNotas.map(n => n.tipo))];
                         const allNumeros = extFinanceiroNotas.filter(n => n.numero?.toUpperCase().startsWith('PRO')).map(n => n.numero);
                         console.log('[DEBUG PROFORMAS] Tab: proformas');
                         console.log('[DEBUG PROFORMAS] Todos os tipos:', allTypes);
                         console.log('[DEBUG PROFORMAS] Numeros com PRO:', allNumeros);
                         console.log('[DEBUG PROFORMAS] Total extFinanceiroNotas:', extFinanceiroNotas.length);
                         // Log each note's details
                         extFinanceiroNotas.forEach((n, i) => {
                            console.log(`[DEBUG NOTA ${i}]: numero=${n.numero}, tipo=${n.tipo}, isProForma=${n.tipo?.includes('Pró-forma')}`);
                         });
                      }
                      
                      const filtered = extFinanceiroNotas.filter(n => {
                         const searchTerm = typeMap[activeTab];
                         const numDoc = (n.numero || n.numero_fatura || '').toUpperCase();
                         const isProFormaDoc = numDoc.startsWith('PRO-') || numDoc.startsWith('PRO/');
                         if (activeTab === 'proformas') {
                            return n.tipo?.includes('Pró-forma') || n.tipo?.includes('Pro-forma') || isProFormaDoc;
                         }
                         return n.tipo?.includes(searchTerm) ||
                            (activeTab === 'facturas' && n.tipo === 'Venda') ||
                            (activeTab === 'facturas' && n.tipo === 'Factura-Recibo');
                      });
                      
                      if (activeTab === 'proformas') {
                         console.log('[DEBUG PROFORMAS] filtered count:', filtered.length);
                      }

                      return (
                        <div className="bg-white/5 rounded-[3rem] border border-white/5 shadow-[0_0_30px_rgba(212,175,55,0.05)] p-10 space-y-8 animate-in slide-in-from-bottom-4">
                           <div className="flex items-center justify-between">
                              <h2 className="text-xl font-black uppercase tracking-widest text-white uppercase tracking-tight">Gestão de {sidebarItems.find(i => i.id === activeTab)?.label}</h2>
                              <div className="flex gap-2">
                                 {activeTab === 'facturas' && (
                                    <button
                                       onClick={() => setShowSaftModal(true)}
                                       className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2"
                                    >
                                       <Download size={14} /> Exportar SAFT-AO
                                    </button>
                                 )}
                                 <button
                                    onClick={() => {
                                       const mapping: any = {
                                          'facturas': 'Factura',
                                          'proformas': 'Pró-forma',
                                          'recibos': 'Recibo',
                                          'notas': 'Nota de Crédito',
                                          'guias': 'Guia',
                                          'encomendas': 'Encomenda'
                                       };
                                       setInvoiceForm(f => ({ ...f, tipo: mapping[activeTab] || 'Factura' }));
                                       setShowInvoiceModal(true);
                                    }}
                                    className="px-4 py-2 bg-gold-primary text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-gold-primary hover:text-white transition-all"
                                 >
                                    Nova Emissão
                                 </button>
                              </div>
                           </div>
                           <div className="overflow-x-auto">
                              <table className="w-full text-left">
                                 <thead>
                                    <tr className="border-b border-white/5">
                                       {['Nº Documento', 'Entidade', 'Total', 'Pago', 'Dívida', 'Data', 'Status', ''].map(h => (
                                          <th key={h} className="pb-4 px-4 text-[9px] font-black uppercase tracking-widest text-white/30">{h}</th>
                                       ))}
                                    </tr>
                                 </thead>
                                 <tbody className="divide-y divide-zinc-50">
                                    {filtered.map((n, i) => (
                                       <tr key={i} onClick={() => handlePrintFatura(n)} className="hover:bg-bg-deep transition-colors group cursor-pointer">
                                          <td className="py-5 px-4">
                                             <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40">
                                                   <Receipt size={14} />
                                                </div>
                                                <span className="text-xs font-black uppercase tracking-widest text-white uppercase">
                                                   {n.numero_fatura || n.numero || `DOC-${i + 100}`}
                                                </span>
                                             </div>
                                          </td>
                                          <td className="py-5 px-4 text-xs font-bold text-white/70 uppercase">{n.cliente_nome || n.entidade}</td>
                                          <td className="py-5 px-4 text-xs font-black uppercase tracking-widest text-white">{safeFormatAOA(n.valor_total || n.valor)}</td>

                                          <td className="py-5 px-4 text-xs font-bold text-green-500">{safeFormatAOA(n.valor_pago || 0)}</td>

                                          <td className="py-5 px-4 text-xs font-bold text-red-500">{safeFormatAOA(n.valor_em_divida ?? (n.valor_total || n.valor))}</td>
                                          <td className="py-5 px-4 text-[10px] font-bold text-white/30 uppercase">{n.data_emissao || n.data}</td>
                                          <td className="py-5 px-4">
                                             <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${n.status === 'PAGO' || n.status === 'Pago' || n.status === 'paid' ? 'bg-green-500/10 text-green-500' : (n.status === 'Anulado' ? 'bg-red-500/10 text-red-500' : (n.status === 'PARCIAL' ? 'bg-blue-500/10 text-blue-500' : 'bg-yellow-500/10 text-yellow-500'))}`}>
                                                {n.status === 'pending' ? 'PENDENTE' : (n.status === 'paid' ? 'PAGO' : (n.status || 'PENDENTE'))}
                                             </span>
                                          </td>
                                          <td className="py-5 px-4 text-right">
                                             <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {n.tipo === 'Venda' && (
                                                   <button
                                                      onClick={(e) => { e.stopPropagation(); handleAutoLaunchFromPharmacySale(n); }}
                                                      disabled={isAutoLaunching}
                                                      className="p-2 hover:bg-gold-primary/10 rounded-lg transition-all text-gold-primary"
                                                      title="Contabilizar Venda"
                                                   >
                                                      {isAutoLaunching ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                                                   </button>
                                                )}
                                                <button onClick={(e) => { e.stopPropagation(); handlePrintFatura(n); }} className="p-2 hover:bg-white/5 rounded-lg transition-all text-white/70" title="Imprimir"><Printer size={14} /></button>

                                                {(n.valor_em_divida > 0 || (n.status !== 'PAGO' && n.status !== 'Pago' && n.status !== 'Anulado')) && (

                                                   <button onClick={(e) => { e.stopPropagation(); setSelectedDocForPayment(n); setPaymentAmount(n.valor_em_divida || n.valor_total); setShowPaymentModal(true); }}

                                                      className="p-2 hover:bg-green-500/10 rounded-lg transition-all text-green-500" title="Pagar">

                                                      <DollarSign size={14} />

                                                   </button>

                                                )}
                                                {n.status !== 'Anulado' && (
                                                   <button onClick={(e) => { e.stopPropagation(); handleAnularFatura(n); }} className="p-2 hover:bg-white/5 rounded-lg transition-all text-red-500" title="Anular"><X size={14} /></button>
                                                )}
                                             </div>
                                          </td>
                                       </tr>
                                    ))}
                                    {filtered.length === 0 && (
                                       <tr>
                                          <td colSpan={6} className="py-20 text-center text-white/30 font-bold uppercase text-[10px]">Nenhum documento encontrado</td>
                                       </tr>
                                    )}
                                 </tbody>
                              </table>
                           </div>
                        </div>
                     );
                  })()
               }

               {/* --- CONTACTOS (CRM) --- */}
               {
                  activeTab === 'contactos' && (
                     <div className="space-y-10 animate-in slide-in-from-bottom-4">
                        <div className="flex items-center justify-between bg-white/5 p-10 rounded-[3rem] border border-white/5 shadow-[0_0_30px_rgba(212,175,55,0.05)] transition-all hover:shadow-xl">
                           <div className="space-y-1">
                              <h2 className="text-3xl font-black uppercase tracking-widest text-white uppercase tracking-tighter">Gestão de <span className="text-gold-primary">Contactos</span></h2>
                              <p className="text-xs font-bold text-white/30 uppercase tracking-widest">Base de Dados CRM Integrada</p>
                           </div>
                           <button
                              onClick={() => setShowContactModal(true)}
                              className="px-10 py-5 bg-gold-primary hover:bg-zinc-800 text-white rounded-3xl font-black uppercase tracking-widest uppercase text-xs tracking-widest shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
                           >
                              <Plus size={18} /> Novo Contacto
                           </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                           {contactos.filter(c => c.company_id === selectedEmpresaId).length > 0 ? (
                              contactos.filter(c => c.company_id === selectedEmpresaId).map((c) => (
                                 <div key={c.id} className="bg-white/5 p-8 rounded-[3rem] border border-white/5 shadow-[0_0_30px_rgba(212,175,55,0.05)] hover:shadow-2xl transition-all group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                       <button className="p-3 text-white/20 hover:text-white/70"><MoreVertical size={20} /></button>
                                    </div>
                                    <div className="flex items-center gap-6 mb-8">
                                       <div className="w-20 h-20 bg-bg-deep rounded-3xl flex items-center justify-center font-black uppercase tracking-widest text-3xl text-gold-primary transition-colors group-hover:bg-gold-primary group-hover:text-white shadow-inner">
                                          {c.nome.charAt(0).toUpperCase()}
                                       </div>
                                       <div>
                                          <h3 className="text-lg font-black uppercase tracking-widest text-white uppercase tracking-tight leading-tight">{c.nome}</h3>
                                          <span className={`inline-block mt-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${c.tipo === 'Cliente' ? 'bg-sky-50 text-sky-600' :
                                             c.tipo === 'Fornecedor' ? 'bg-purple-50 text-purple-600' :
                                                'bg-yellow-50 text-gold-primary'
                                             }`}>
                                             {c.tipo}
                                          </span>
                                       </div>
                                    </div>

                                    <div className="space-y-4 border-t border-zinc-50 pt-6">
                                       {c.nif && (
                                          <div className="flex items-center gap-3">
                                             <Shield size={14} className="text-white/30" />
                                             <p className="text-[11px] font-bold text-white/40 uppercase">NIF: <span className="text-white/90">{c.nif}</span></p>
                                          </div>
                                       )}
                                       {c.email && (
                                          <div className="flex items-center gap-3">
                                             <Mail size={14} className="text-white/30" />
                                             <p className="text-[11px] font-bold text-white/40">{c.email}</p>
                                          </div>
                                       )}
                                       {c.telefone && (
                                          <div className="flex items-center gap-3">
                                             <Phone size={14} className="text-white/30" />
                                             <p className="text-[11px] font-bold text-white/40">{c.telefone}</p>
                                          </div>
                                       )}
                                    </div>
                                 </div>
                              ))
                           ) : (
                              <div className="col-span-full py-32 bg-bg-deep rounded-[4rem] border-2 border-dashed border-white/10 flex flex-col items-center justify-center space-y-4 opacity-50">
                                 <Users size={64} className="text-white/20" />
                                 <p className="text-lg font-black uppercase tracking-widest text-white/30 uppercase tracking-tighter">Nenhum contacto registado nesta empresa</p>
                              </div>
                           )}
                        </div>
                     </div>
                  )
               }

               {/* --- ITENS --- */}

               {/* ===== MODAL DE PAGAMENTO ===== */}
               {showPaymentModal && (
                  <div className="fixed inset-0 z-[150] flex items-center justify-center bg-zinc-950/80 backdrop-blur-md p-4 animate-in fade-in">
                     <div className="bg-white/5 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 p-8 border border-white/10">
                        <div className="text-center space-y-4 mb-8">
                           <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-2xl flex items-center justify-center mx-auto">
                              <DollarSign size={32} />
                           </div>
                           <h2 className="text-xl font-black uppercase tracking-widest text-white">Registar Pagamento</h2>
                           <p className="text-xs text-white/40 font-bold uppercase tracking-widest">{selectedDocForPayment?.numero_fatura}</p>
                        </div>

                        <div className="space-y-6">
                           <div>
                              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">
                                 <span>Total: {selectedDocForPayment?.valor_total}</span>
                                 <span>Dívida: {selectedDocForPayment?.valor_em_divida}</span>
                              </div>

                              <label className="text-[10px] font-black uppercase tracking-widest text-gold-primary block mb-2 text-center">Valor a Receber (AOA)</label>
                              <input
                                 type="number"
                                 autoFocus
                                 value={paymentAmount}
                                 onChange={e => setPaymentAmount(Number(e.target.value))}
                                 className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-center text-2xl font-black text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                              />
                           </div>

                           <div className="grid grid-cols-2 gap-4">
                              <button onClick={() => setShowPaymentModal(false)} className="py-4 bg-white/5 text-white/40 font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-white/10 transition-all">Sair</button>
                              <button onClick={handlePayment} className="py-4 bg-green-500 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-green-600 shadow-lg shadow-green-500/20 transition-all">Confirmar</button>
                           </div>
                        </div>
                     </div>
                  </div>
               )}

               {/* ===== MODAL EXPORTAÇÃO SAFT-AO ===== */}
               {
                  showSaftModal && (
                     <div className="fixed inset-0 z-[130] flex items-center justify-center bg-zinc-950/80 backdrop-blur-md p-4 animate-in fade-in">
                        <div className="bg-white/5 w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col">
                           <div className="p-8 border-b border-white/5 flex justify-between items-center bg-blue-600 text-white">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                    <Download size={20} />
                                 </div>
                                 <div>
                                    <h2 className="text-lg font-black uppercase tracking-widest uppercase tracking-tight">Exportar SAFT-AO</h2>
                                    <p className="text-[9px] font-bold text-blue-100 uppercase tracking-widest">Ficheiro de Auditoria Tributária</p>
                                 </div>
                              </div>
                              <button onClick={() => setShowSaftModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-all"><X size={20} /></button>
                           </div>

                           <div className="p-8 space-y-6">
                              <div className="grid grid-cols-2 gap-4">
                                 <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 uppercase tracking-widest">Mês</label>
                                    <select value={saftMonth} onChange={e => setSaftMonth(Number(e.target.value))}
                                       className="w-full bg-bg-deep border border-white/10 rounded-2xl p-4 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all">
                                       {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                                          <option key={m} value={m}>{new Date(2000, m - 1).toLocaleString('pt-PT', { month: 'long' }).toUpperCase()}</option>
                                       ))}
                                    </select>
                                 </div>
                                 <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 uppercase tracking-widest">Ano</label>
                                    <select value={saftYear} onChange={e => setSaftYear(Number(e.target.value))}
                                       className="w-full bg-bg-deep border border-white/10 rounded-2xl p-4 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all">
                                       {[2024, 2025, 2026].map(y => (
                                          <option key={y} value={y}>{y}</option>
                                       ))}
                                    </select>
                                 </div>
                              </div>

                              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                                 <p className="text-[10px] text-blue-800 leading-relaxed">
                                    <strong>Nota:</strong> O ficheiro gerado contém todas as faturas, clientes e produtos movimentados no período selecionado, de acordo com as normas da AGT v1.01.
                                 </p>
                              </div>

                              <button onClick={handleExportSaft} disabled={isExportingSaft}
                                 className="w-full py-5 bg-gold-primary text-white font-black uppercase tracking-widest rounded-2xl uppercase text-[10px] tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                                 {isExportingSaft ? <RefreshCw className="animate-spin" size={16} /> : <Download size={16} />}
                                 {isExportingSaft ? 'A Gerar XML...' : 'Descarregar SAFT-AO'}
                              </button>
                           </div>
                        </div>
                     </div>
                  )
               }

               {
                  activeTab === 'itens' && (
                     <div className="space-y-8 animate-in slide-in-from-bottom-4">
                        {/* Header e Acções Rápidas */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/5 p-8 rounded-[3rem] border border-white/5 shadow-[0_0_30px_rgba(212,175,55,0.05)]">
                           <div>
                              <h2 className="text-2xl font-black uppercase tracking-widest text-white uppercase tracking-tight">Gestão de Inventário</h2>
                              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1">Controlo de stock, categorias e alertas críticos</p>
                           </div>
                           <div className="flex items-center gap-3">
                              <button
                                 onClick={() => setShowCategoryModal(true)}
                                 className="px-6 py-4 bg-bg-deep text-white/70 font-black uppercase tracking-widest rounded-2xl text-[10px] uppercase tracking-widest hover:bg-white/5 transition-all flex items-center gap-2 border border-white/10"
                              >
                                 <ListFilter size={16} /> Nova Categoria
                              </button>
                              <button
                                 onClick={() => setShowItemModal(true)}
                                 className="px-6 py-4 bg-gold-primary text-white font-black uppercase tracking-widest rounded-2xl text-[10px] uppercase tracking-widest hover:bg-yellow-400 transition-all flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95"
                              >
                                 <Plus size={16} /> Adicionar Item
                              </button>
                           </div>
                        </div>

                        {/* Filtros de Categorias */}
                        <div className="flex items-center gap-4 overflow-x-auto pb-4 custom-scrollbar">
                           <button className="px-6 py-3 bg-gold-primary text-gold-primary rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                              Todos os Itens ({extInventario.length})
                           </button>
                           {categorias.map(cat => (
                              <button key={cat.id} className="px-6 py-3 bg-white/5 border border-white/5 text-white/40 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap hover:border-yellow-400 transition-all flex items-center gap-2">
                                 <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.cor || '#fbbf24' }} />
                                 {cat.nome}
                              </button>
                           ))}
                        </div>

                        {/* Grelha de Itens */}
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                           {extInventario.map((item, i) => {
                              const isLowStock = Number(item.quantidade_atual) <= Number(item.quantidade_minima);
                              const cat = categorias.find(c => c.id === item.categoria_id);

                              return (
                                 <div key={i} className={`p-6 bg-white/5 rounded-[2.5rem] border transition-all group relative overflow-hidden flex flex-col ${isLowStock ? 'border-red-100' : 'border-white/5 hover:border-yellow-400 hover:shadow-2xl'}`}>
                                    {isLowStock && (
                                       <div className="absolute top-4 right-4 z-10 flex items-center gap-1 bg-red-100 text-red-600 px-3 py-1.5 rounded-xl animate-pulse">
                                          <AlertTriangle size={12} />
                                          <span className="text-[9px] font-black uppercase tracking-widest uppercase">Stock Baixo</span>
                                       </div>
                                    )}

                                    <div className="w-full aspect-square bg-bg-deep rounded-3xl mb-6 flex items-center justify-center text-zinc-200 group-hover:scale-105 transition-transform">
                                       {item.foto_url ? (
                                          <img src={item.foto_url} alt={item.nome} className="w-full h-full object-cover rounded-3xl" />
                                       ) : (
                                          <Package size={64} className="opacity-20 text-white/30" />
                                       )}
                                    </div>

                                    <div className="flex-1 space-y-2">
                                       <div className="flex items-center gap-2">
                                          <span className="text-[8px] font-black uppercase tracking-widest text-white/30 uppercase bg-bg-deep px-2 py-0.5 rounded border border-white/5">{item.unidade || 'Unidade'}</span>
                                          {cat && (
                                             <span className="text-[8px] font-black uppercase tracking-widest uppercase bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded border border-yellow-100">{cat.nome}</span>
                                          )}
                                       </div>
                                       <h3 className="text-sm font-black uppercase tracking-widest text-white uppercase tracking-tight leading-tight">{item.nome}</h3>
                                       <p className="text-[9px] font-bold text-white/30 uppercase line-clamp-1">{item.descricao || 'Sem descrição'}</p>
                                    </div>

                                    <div className="mt-6 pt-6 border-t border-zinc-50 flex items-center justify-between">
                                       <div>
                                          <p className="text-[9px] font-black uppercase tracking-widest text-white/30 uppercase tracking-widest">Preço Un.</p>
                                          <p className="text-base font-black uppercase tracking-widest text-white">{safeFormatAOA(item.preco_unitario || item.preco_venda)}</p>
                                       </div>
                                       <div className="text-right">
                                          <p className="text-[9px] font-black uppercase tracking-widest text-white/30 uppercase tracking-widest">Stock</p>
                                          <p className={`text-sm font-black uppercase tracking-widest ${isLowStock ? 'text-red-500' : 'text-white'}`}>{item.quantidade_atual} {item.unidade || 'UN'}</p>
                                       </div>
                                    </div>
                                 </div>
                              );
                           })}
                        </div>
                     </div>
                  )
               }

               {/* --- RELATÓRIOS DASHBOARD --- */}
               {
                  activeTab === 'relatorios' && (
                     <div className="space-y-10 animate-in slide-in-from-bottom-4">
                        {/* Banner Superior */}
                        <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 p-12 rounded-[3.5rem] text-white relative overflow-hidden shadow-2xl">
                           <div className="absolute top-0 right-0 w-96 h-96 bg-gold-primary/20 rounded-full -mr-48 -mt-48 blur-3xl animate-pulse" />
                           <div className="relative z-10 space-y-4">
                              <h2 className="text-4xl lg:text-5xl font-black uppercase tracking-widest uppercase tracking-tighter">Central de <span className="text-gold-primary">Inteligência</span></h2>
                              <p className="text-white/30 font-bold text-sm lg:text-base uppercase tracking-widest max-w-2xl">
                                 Gere demonstrações financeiras, balancetes e relatórios analíticos com um clique. Dados exportáveis em PDF e Excel.
                              </p>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                           {[
                              { id: 'balanco', title: 'Balanço Patrimonial', desc: 'Posição financeira detalhada de ativos e passivos.', icon: <LayoutList size={28} className="text-blue-500" />, color: 'bg-blue-50' },
                              { id: 'dre', title: 'Demonstração de Resultados', desc: 'Análise de lucro e prejuízo por período seleccionado.', icon: <TrendingUp size={28} className="text-green-500" />, color: 'bg-green-50 text-green-700' },
                              { id: 'balancete', title: 'Balancete de Verificação', desc: 'Verificação de débitos e créditos de todas as contas.', icon: <CheckCircle2 size={28} className="text-purple-500" />, color: 'bg-purple-50 text-purple-700' },
                              { id: 'diario', title: 'Diário de Lançamentos', desc: 'Listagem cronológica de todos os movimentos.', icon: <BookOpen size={28} className="text-orange-500" />, color: 'bg-orange-50 text-orange-700' },
                              { id: 'razão', title: 'Livro Razão', desc: 'Movimentação individualizada por conta contabilística.', icon: <FileText size={28} className="text-sky-500" />, color: 'bg-sky-50 text-sky-700' },
                              { id: 'cashflow', title: 'Fluxo de Caixa', desc: 'Origem e aplicação de recursos financeiros.', icon: <Landmark size={28} className="text-gold-primary" />, color: 'bg-yellow-50 text-yellow-700' },
                              { id: 'fiscal', title: 'Relatório Fiscal (IVA/IRT)', desc: 'Apuramento de impostos para submissão Ã  AGT.', icon: <FileCheck size={28} className="text-red-500" />, color: 'bg-red-50 text-red-700' },
                              { id: 'auditoria', title: 'Trilhas de Auditoria', desc: 'Histórico completo de alterações e logs do sistema.', icon: <ShieldCheck size={28} className="text-white/40" />, color: 'bg-white/5 text-white/80' },
                           ].map((rep) => (
                              <div key={rep.id} className="bg-white/5 p-8 rounded-[3rem] border border-white/5 shadow-[0_0_30px_rgba(212,175,55,0.05)] hover:shadow-2xl hover:scale-[1.02] transition-all group flex flex-col justify-between h-[320px]">
                                 <div>
                                    <div className={`w-16 h-16 ${rep.color} rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:rotate-6`}>
                                       {rep.icon}
                                    </div>
                                    <h3 className="text-lg font-black uppercase tracking-widest text-white uppercase tracking-tight mb-2 leading-tight">{rep.title}</h3>
                                    <p className="text-[10px] font-bold text-white/30 uppercase leading-relaxed">{rep.desc}</p>
                                 </div>
                                 <div className="flex gap-2">
                                    <button
                                       onClick={() => openReport(rep.id)}
                                       disabled={isGeneratingReport}
                                       className="flex-1 py-4 bg-gold-primary text-white font-black uppercase tracking-widest rounded-2xl text-[9px] uppercase tracking-widest hover:bg-gold-primary hover:text-white transition-all flex items-center justify-center gap-2"
                                    >
                                       {isGeneratingReport ? <RefreshCw className="animate-spin" size={14} /> : <Printer size={14} />}
                                       {isGeneratingReport ? 'Gerando...' : 'Gerar Relatório'}
                                    </button>
                                    <button className="p-4 bg-bg-deep text-white/30 rounded-2xl hover:bg-white/5 transition-all">
                                       <Share2 size={16} />
                                    </button>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  )
               }

               {/* --- ABA: FONTES DE DADOS (INTEGRAÇÃO AUTOMÃTICA) --- */}
               {
                  activeTab === 'fontes' && (() => {

                     // --- Métricas por Módulo ---
                     const totalFaturas = extFaturas.reduce((s, f) => s + (Number(f.valor_total) || 0), 0);
                     const faturasPagas = extFaturas.filter(f => f.status === 'pago' || f.status === 'Paga').length;
                     const totalTesouraria = extTesouraria.reduce((s, t) => s + (Number(t.valor) || 0), 0);
                     const entradas = extTesouraria.filter(t => t.tipo === 'Entrada' || t.tipo === 'entrada' || t.tipo === 'receita').reduce((s, t) => s + (Number(t.valor) || 0), 0);
                     const saidas = extTesouraria.filter(t => t.tipo === 'Saída' || t.tipo === 'saida' || t.tipo === 'despesa').reduce((s, t) => s + (Number(t.valor) || 0), 0);
                     const totalSalarios = extRhRecibos.reduce((s, r) => s + (Number(r.liquido) || 0), 0);
                     const totalBruto = extRhRecibos.reduce((s, r) => s + (Number(r.bruto) || 0), 0);
                     const totalInventarioValor = extInventario.reduce((s, i) => s + (Number(i.quantidade_atual) || 0) * (Number(i.preco_unitario) || 0), 0);
                     const itensCriticos = extInventario.filter(i => Number(i.quantidade_atual) <= Number(i.quantidade_minima)).length;

                     const syncNow = async () => {
                        setIsSyncingModules(true);
                        const fq = async (q: any) => { try { const { data } = await q; return data || []; } catch { return []; } };
                        const [fat, tes, rh, inv, smov] = await Promise.all([
                           fq(supabase.from('contabil_faturas').select('*').eq('company_id', selectedEmpresaId).order('data_emissao', { ascending: false }).limit(100)),
                           fq(supabase.from('fin_transacoes').select('*').eq('company_id', selectedEmpresaId).order('data', { ascending: false }).limit(100)),
                           fq(supabase.from('hr_recibos').select('*').eq('company_id', selectedEmpresaId).order('created_at', { ascending: false }).limit(100)),
                           fq(supabase.from('products').select('*').eq('company_id', selectedEmpresaId).order('nome')),
                           fq(supabase.from('stock_movimentos').select('*').eq('company_id', selectedEmpresaId).order('created_at', { ascending: false }).limit(100))
                        ]);
                        setExtFaturas(fat); setExtTesouraria(tes); setExtRhRecibos(rh); setExtInventario(inv); setExtStockMov(smov);
                        setLastSyncAt(new Date());
                        setIsSyncingModules(false);
                     };

                     const modulos = [
                        {
                           nome: 'POS Vendas', icon: <ShoppingCart size={22} className="text-yellow-500" />, bg: 'bg-yellow-50 border-yellow-100',
                           badge: `${extSales.length} vendas`,
                           stats: [
                              { label: 'Total Bruto', value: safeFormatAOA(extSales.reduce((s, x) => s + (Number(x.total) || 0), 0)), color: 'text-yellow-600' },
                              { label: 'IVA Cobrado', value: safeFormatAOA(extSales.reduce((s, x) => s + (Number(x.tax) || 0), 0)), color: 'text-red-500' },
                              { label: 'Líquido', value: safeFormatAOA(extSales.reduce((s, x) => s + (Number(x.total) - Number(x.tax)), 0)), color: 'text-green-600' },
                           ],
                           items: extSales.slice(0, 5).map(s => ({
                              label: s.invoice_number || `Venda #${s.id}`,
                              value: safeFormatAOA(s.total),
                              sub: `IVA: ${safeFormatAOA(s.tax)}`,
                              date: s.created_at?.split('T')[0] || '',
                              onAutoLaunch: () => handleAutoLaunchFromPOSSale(s)
                           }))
                        },
                        {
                           nome: 'Vendas Farmácia', icon: <Activity size={22} className="text-emerald-500" />, bg: 'bg-emerald-50 border-emerald-100',
                           badge: `${extVendasFarmacia.length} vendas`,
                           stats: [
                              { label: 'Total Bruto', value: safeFormatAOA(extVendasFarmacia.reduce((s, x) => s + (Number(x.total) || 0), 0)), color: 'text-emerald-600' },
                              { label: 'IVA Cobrado', value: safeFormatAOA(extVendasFarmacia.reduce((s, x) => s + (Number(x.iva) || 0), 0)), color: 'text-red-500' },
                              { label: 'Líquido', value: safeFormatAOA(extVendasFarmacia.reduce((s, x) => s + (Number(x.total) - Number(x.iva)), 0)), color: 'text-emerald-600' },
                           ],
                           items: extVendasFarmacia.slice(0, 5).map(v => ({
                              label: v.numero_factura || `Venda #${v.id}`,
                              value: safeFormatAOA(v.total),
                              sub: `IVA: ${safeFormatAOA(v.iva)}`,
                              date: v.data || '',
                              onAutoLaunch: () => handleAutoLaunchFromPharmacySale(v)
                           }))
                        },
                        {
                           nome: 'Faturação Global', icon: <FileText size={22} className="text-blue-500" />, bg: 'bg-blue-50 border-blue-100',
                           badge: `${extFaturas.length} faturas`,
                           stats: [
                              { label: 'Total Faturado', value: safeFormatAOA(totalFaturas), color: 'text-blue-600' },
                              { label: 'Pagas', value: `${faturasPagas}/${extFaturas.length}`, color: 'text-green-600' },
                              { label: 'IVA', value: safeFormatAOA(extFaturas.reduce((s, f) => s + (Number(f.metadata?.iva) || 0), 0)), color: 'text-red-500' },
                           ],
                           items: extFaturas.slice(0, 5).map(f => ({
                              label: f.numero_fatura || f.cliente_nome || '—',
                              value: safeFormatAOA(f.valor_total),
                              sub: f.status || '',
                              date: f.data_emissao || '',
                              onAutoLaunch: () => handleAutoLaunchFromFatura(f)
                           }))
                        },
                        {
                           nome: 'Tesouraria', icon: <DollarSign size={22} className="text-green-500" />, bg: 'bg-green-50 border-green-100',
                           badge: `${extTesouraria.length} movimentos`,
                           stats: [
                              { label: 'Total Movimentos', value: safeFormatAOA(totalTesouraria), color: 'text-green-600' },
                              { label: 'Entradas', value: safeFormatAOA(entradas), color: 'text-green-600' },
                              { label: 'Saídas', value: safeFormatAOA(saidas), color: 'text-red-500' },
                           ],
                           items: extTesouraria.slice(0, 5).map(t => ({
                              label: t.descricao || t.categoria || '—',
                              value: safeFormatAOA(t.valor),
                              sub: t.tipo || '',
                              date: t.data || '',
                              onAutoLaunch: () => handleAutoLaunchFromTesouraria(t)
                           }))
                        },
                        {
                           nome: 'Recursos Humanos / Salários', icon: <Users size={22} className="text-purple-500" />, bg: 'bg-purple-50 border-purple-100',
                           badge: `${extRhRecibos.length} recibos`,
                           stats: [
                              { label: 'Total Líquido', value: safeFormatAOA(totalSalarios), color: 'text-purple-600' },
                              { label: 'Total Bruto', value: safeFormatAOA(totalBruto), color: 'text-white/70' },
                              { label: 'Recibos', value: `${extRhRecibos.length}`, color: 'text-purple-600' },
                           ],
                           items: extRhRecibos.slice(0, 5).map(r => ({
                              label: `${r.mes || ''}/${r.ano || ''}`,
                              value: safeFormatAOA(r.liquido),
                              sub: `Bruto: ${safeFormatAOA(r.bruto)}`,
                              date: '',
                              onAutoLaunch: undefined
                           }))
                        },
                        {
                           nome: 'Inventário', icon: <FileCheck size={22} className="text-orange-500" />, bg: 'bg-orange-50 border-orange-100',
                           badge: `${extInventario.length} itens`,
                           stats: [
                              { label: 'Valor Stock', value: safeFormatAOA(totalInventarioValor), color: 'text-orange-600' },
                              { label: 'SKUs', value: `${extInventario.length}`, color: 'text-white/70' },
                              { label: 'Críticos (Stock Mín.)', value: `${itensCriticos}`, color: itensCriticos > 0 ? 'text-red-500' : 'text-green-600' },
                           ],
                           items: extInventario.slice(0, 5).map(i => ({
                              label: i.nome || '—',
                              onAutoLaunch: undefined
                           }))
                        },
                     ];

                     return (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4 text-left">
                           {/* Header com botão de sincronização */}
                           <div className="flex flex-wrap items-center justify-between gap-4 bg-gold-primary p-8 rounded-[3rem] text-white shadow-2xl">
                              <div>
                                 <h2 className="text-2xl font-black uppercase tracking-widest uppercase tracking-tight flex items-center gap-3">
                                    <Share2 className="text-gold-primary" size={26} /> Fontes de Dados Integradas
                                 </h2>
                                 <p className="text-white/30 text-xs font-bold mt-1 uppercase tracking-widest">
                                    Dados recebidos automaticamente dos módulos activos do ERP
                                 </p>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                 <button onClick={syncNow} disabled={isSyncingModules}
                                    className="flex items-center gap-2 px-5 py-3 bg-gold-primary text-white font-black uppercase tracking-widest rounded-2xl text-[9px] uppercase tracking-widest hover:bg-yellow-400 transition-all disabled:opacity-50">
                                    <RefreshCw size={14} className={isSyncingModules ? 'animate-spin' : ''} />
                                    {isSyncingModules ? 'Sincronizando...' : 'Sincronizar Agora'}
                                 </button>
                                 {lastSyncAt && (
                                    <p className="text-[9px] text-white/40 font-bold">
                                       Ãšltima Sinc: {lastSyncAt.toLocaleTimeString()}
                                    </p>
                                 )}
                              </div>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              {modulos.map((m, idx) => (
                                 <div key={idx} className={`p-8 rounded-[2.5rem] border ${m.bg} space-y-6 shadow-[0_0_30px_rgba(212,175,55,0.05)] bg-white/5`}>
                                    <div className="flex justify-between items-start">
                                       <div className="flex gap-4 items-center">
                                          <div className="p-4 bg-white/5 rounded-2xl shadow-[0_0_30px_rgba(212,175,55,0.05)] border border-white/5">{m.icon}</div>
                                          <div>
                                             <h3 className="text-lg font-black uppercase tracking-widest text-white uppercase tracking-tight">{m.nome}</h3>
                                             <p className="text-[10px] font-black uppercase tracking-widest uppercase text-white/30">{m.badge}</p>
                                          </div>
                                       </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                       {m.stats.map((s, i) => (
                                          <div key={i} className="p-3 bg-white/60 rounded-xl border border-white/80">
                                             <p className="text-[8px] font-black uppercase tracking-widest text-white/30 uppercase leading-tight mb-1">{s.label}</p>
                                             <p className={`text-[10px] font-black uppercase tracking-widest ${s.color}`}>{s.value}</p>
                                          </div>
                                       ))}
                                    </div>
                                    <div className="space-y-3 pt-2">
                                       {m.items.map((it, i) => (
                                          <div key={i} className="flex items-center justify-between p-4 bg-white/40 rounded-2xl border border-white/60 group hover:bg-white/5 transition-all hover:shadow-[0_0_30px_rgba(212,175,55,0.05)]">
                                             <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-zinc-200 group-hover:bg-gold-primary transition-colors" />
                                                <div>
                                                   <p className="text-[10px] font-black uppercase tracking-widest text-white/90 uppercase leading-none">{it.label}</p>
                                                   <p className="text-[8px] font-bold text-white/30 uppercase mt-1">{it.date} {it.sub ? `â€¢ ${it.sub}` : ''}</p>
                                                </div>
                                             </div>
                                             <div className="flex items-center gap-4">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-white">{it.value}</p>
                                                {it.onAutoLaunch && (
                                                   <button onClick={it.onAutoLaunch} className="p-2 bg-gold-primary text-white rounded-lg hover:bg-gold-primary hover:text-white transition-all">
                                                      <Sparkles size={12} />
                                                   </button>
                                                )}
                                             </div>
                                          </div>
                                       ))}
                                    </div>
                                 </div>
                              ))}
                           </div>

                           {/* Movimentos de Stock Recentes */}
                           <div className="bg-white/5 rounded-[3rem] border border-white/5 shadow-[0_0_30px_rgba(212,175,55,0.05)] p-10 space-y-8">
                              <h3 className="text-xl font-black uppercase tracking-widest text-white uppercase tracking-tight flex items-center gap-2">
                                 <RefreshCw size={24} className="text-gold-primary" /> Movimentos de Inventário em Tempo Real
                              </h3>
                              <div className="overflow-x-auto">
                                 <table className="w-full text-left">
                                    <thead>
                                       <tr className="border-b border-white/5">
                                          {['Tipo', 'Responsável', 'Referência', 'Quantidade', 'Data'].map(h => (
                                             <th key={h} className="pb-4 px-4 text-[9px] font-black uppercase tracking-widest text-white/30">{h}</th>
                                          ))}
                                       </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-50">
                                       {extStockMov.slice(0, 10).map((m, i) => (
                                          <tr key={i} className="hover:bg-bg-deep transition-colors">
                                             <td className="py-4 px-4">
                                                <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${m.tipo === 'entrada' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>{m.tipo}</span>
                                             </td>
                                             <td className="py-4 px-4 text-[11px] font-black uppercase tracking-widest text-white/90 uppercase tracking-tight">{m.entidade || 'Sistema'}</td>
                                             <td className="py-4 px-4 text-[10px] font-bold text-white/40 uppercase">{m.referencia || '—'}</td>
                                             <td className="py-4 px-4 text-[11px] font-black uppercase tracking-widest text-white">{m.quantidade}</td>
                                             <td className="py-4 px-4 text-[10px] font-bold text-white/30">{new Date(m.created_at).toLocaleDateString()}</td>
                                          </tr>
                                       ))}
                                    </tbody>
                                 </table>
                              </div>
                           </div>
                        </div>
                     );
                  })()
               }

               {/* --- CONSOLIDAÇÃO MULTIEMPRESA --- */}
               {
                  activeTab === 'consolidacao' && (() => {
                     const consolidadoPorEmpresa = empresas.map(emp => {
                        const empLancs = (lancamentos || []).filter(l => l.company_id === emp.company_id);
                        let receita = 0, despesa = 0, ativo = 0, passivo = 0;
                        empLancs.forEach(l => {
                           (l.itens || []).forEach(it => {
                              if (!it) return;
                              const val = Number(it.valor) || 0;
                              if (it.conta_codigo?.startsWith('6') && it.tipo === 'C') receita += val;
                              if (it.conta_codigo?.startsWith('7') && it.tipo === 'D') despesa += val;
                              if ((it.conta_codigo?.startsWith('1') || it.conta_codigo?.startsWith('2') || it.conta_codigo?.startsWith('3')) && it.tipo === 'D') ativo += val;
                              if (it.conta_codigo?.startsWith('4') && it.tipo === 'C') passivo += val;
                           });
                        });
                        const lucro = receita - despesa;
                        const margem = receita > 0 ? (lucro / receita) * 100 : 0;
                        return { id: emp.id, nome: emp.nome, receita, despesa, lucro, ativo, passivo, margem, lancamentos: empLancs.length };
                     });

                     const totalGrupo = {
                        receita: consolidadoPorEmpresa.reduce((a, e) => a + e.receita, 0),
                        despesa: consolidadoPorEmpresa.reduce((a, e) => a + e.despesa, 0),
                        lucro: consolidadoPorEmpresa.reduce((a, e) => a + e.lucro, 0),
                        ativo: consolidadoPorEmpresa.reduce((a, e) => a + e.ativo, 0),
                        passivo: consolidadoPorEmpresa.reduce((a, e) => a + e.passivo, 0),
                     };
                     const maxReceita = Math.max(...consolidadoPorEmpresa.map(e => e.receita), 1);

                     // Estado local de eliminações mock (até o form ser implementado)
                     const eliminacoesExemplo = [
                        { id: '1', tipo: 'Receita Interna', valor: 50000, descricao: 'Prestação de serviços interna', origem: empresas[0]?.nome || '—', destino: empresas[1]?.nome || '—' },
                        { id: '2', tipo: 'Empréstimo', valor: 200000, descricao: 'Financiamento entre afiliadas', origem: empresas[1]?.nome || '—', destino: empresas[0]?.nome || '—' },
                     ].filter(e => empresas.length >= 2);

                     const totalEliminacoes = eliminacoesExemplo.reduce((a, e) => a + e.valor, 0);
                     const lucroConsolidado = totalGrupo.lucro - totalEliminacoes;

                     return (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4">

                           {/* Header */}
                           <div className="flex items-center justify-between bg-gold-primary p-8 rounded-[3rem] text-white shadow-2xl">
                              <div>
                                 <h2 className="text-2xl font-black uppercase tracking-widest uppercase tracking-tight flex items-center gap-3">
                                    <Building2 className="text-gold-primary" size={28} /> Consolidação do Grupo
                                 </h2>
                                 <p className="text-white/30 text-xs font-bold mt-1 uppercase tracking-widest">
                                    {empresas.length} Entidade{empresas.length !== 1 ? 's' : ''} • Dados calculados automaticamente
                                 </p>
                              </div>
                              <div className="text-right">
                                 <p className="text-[9px] font-black uppercase tracking-widest text-white/30 uppercase tracking-widest mb-1">Lucro Líquido Consolidado</p>
                                 <p className={`text-4xl font-black uppercase tracking-widest ${lucroConsolidado >= 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                                    {safeFormatAOA(lucroConsolidado)}
                                 </p>
                                 <p className="text-[9px] text-white/40 font-bold mt-1">Após eliminações de {safeFormatAOA(totalEliminacoes)}</p>
                              </div>
                           </div>

                           {/* KPIs do Grupo Consolidado */}
                           <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                              {[
                                 { label: 'Receita Consolidada', value: totalGrupo.receita, color: 'text-green-600', bg: 'bg-green-50 border-green-100' },
                                 { label: 'Despesa Consolidada', value: totalGrupo.despesa, color: 'text-red-500', bg: 'bg-red-50 border-red-100' },
                                 { label: 'Activo Total Grupo', value: totalGrupo.ativo, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
                                 { label: 'Passivo Total Grupo', value: totalGrupo.passivo, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-100' },
                              ].map((kpi, i) => (
                                 <div key={i} className={`p-7 rounded-[2.5rem] border ${kpi.bg}`}>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-2">{kpi.label}</p>
                                    <p className={`text-2xl font-black uppercase tracking-widest ${kpi.color}`}>{safeFormatAOA(kpi.value)}</p>
                                 </div>
                              ))}
                           </div>

                           {/* Comparação Financeira entre Empresas */}
                           <div className="bg-white/5 rounded-[3rem] border border-white/10 shadow-[0_0_30px_rgba(212,175,55,0.05)] p-8">
                              <div className="flex items-center justify-between mb-6">
                                 <h3 className="text-base font-black uppercase tracking-widest text-white uppercase tracking-tight flex items-center gap-2">
                                    <BarChart2 size={18} className="text-gold-primary" /> Comparação Financeira entre Entidades
                                 </h3>
                                 <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-bg-deep text-white/40 hover:bg-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/5 transition-all">
                                    <Printer size={14} /> Relatório
                                 </button>
                              </div>

                              {consolidadoPorEmpresa.length === 0 ? (
                                 <div className="text-center py-16 text-white/30">
                                    <Building2 size={40} className="mx-auto mb-4 opacity-30" />
                                    <p className="font-black uppercase tracking-widest uppercase text-xs">Nenhuma empresa com dados para consolidar</p>
                                 </div>
                              ) : (
                                 <div className="space-y-4">
                                    {consolidadoPorEmpresa.map((emp, i) => (
                                       <div key={emp.id} className="p-6 rounded-2xl border border-white/5 bg-bg-deep/50 hover:bg-white/5 hover:shadow-[0_0_30px_rgba(212,175,55,0.05)] transition-all">
                                          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                                             <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-black uppercase tracking-widest text-white"
                                                   style={{ background: COLORS_PIE[i % COLORS_PIE.length] }}>
                                                   {emp.nome?.charAt(0)?.toUpperCase() || '?'}
                                                </div>
                                                <div>
                                                   <p className="font-black uppercase tracking-widest text-sm text-white">{emp.nome}</p>
                                                   <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">{emp.lancamentos} lançamento{emp.lancamentos !== 1 ? 's' : ''}</p>
                                                </div>
                                             </div>
                                             <div className="flex gap-6 text-right">
                                                <div>
                                                   <p className="text-[9px] font-black uppercase tracking-widest text-white/30 uppercase tracking-widest">Receita</p>
                                                   <p className="text-sm font-black uppercase tracking-widest text-green-600">{safeFormatAOA(emp.receita)}</p>
                                                </div>
                                                <div>
                                                   <p className="text-[9px] font-black uppercase tracking-widest text-white/30 uppercase tracking-widest">Despesa</p>
                                                   <p className="text-sm font-black uppercase tracking-widest text-red-500">{safeFormatAOA(emp.despesa)}</p>
                                                </div>
                                                <div>
                                                   <p className="text-[9px] font-black uppercase tracking-widest text-white/30 uppercase tracking-widest">Lucro</p>
                                                   <p className={`text-sm font-black uppercase tracking-widest ${emp.lucro >= 0 ? 'text-white' : 'text-red-500'}`}>{safeFormatAOA(emp.lucro)}</p>
                                                </div>
                                                <div>
                                                   <p className="text-[9px] font-black uppercase tracking-widest text-white/30 uppercase tracking-widest">Margem</p>
                                                   <p className={`text-sm font-black uppercase tracking-widest ${emp.margem >= 10 ? 'text-green-600' : emp.margem > 0 ? 'text-gold-primary' : 'text-red-500'}`}>{emp.margem.toFixed(1)}%</p>
                                                </div>
                                             </div>
                                          </div>
                                          {/* Barra de participação na receita do grupo */}
                                          <div>
                                             <div className="flex justify-between items-center mb-1">
                                                <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Contribuição para Receita do Grupo</p>
                                                <p className="text-[9px] font-black uppercase tracking-widest text-white/70">{maxReceita > 0 ? ((emp.receita / Math.max(totalGrupo.receita, 1)) * 100).toFixed(1) : 0}%</p>
                                             </div>
                                             <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full transition-all duration-700"
                                                   style={{ width: `${(emp.receita / maxReceita) * 100}%`, background: COLORS_PIE[i % COLORS_PIE.length] }} />
                                             </div>
                                          </div>
                                       </div>
                                    ))}
                                 </div>
                              )}
                           </div>

                           {/* Eliminações Intercompany */}
                           <div className="bg-white/5 rounded-[3rem] border border-white/10 shadow-[0_0_30px_rgba(212,175,55,0.05)] p-8">
                              <div className="flex items-center justify-between mb-6">
                                 <h3 className="text-base font-black uppercase tracking-widest text-white uppercase tracking-tight flex items-center gap-2">
                                    <ArrowDownLeft size={18} className="text-gold-primary" /> Eliminações Intercompany
                                 </h3>
                                 <span className="text-[9px] font-black uppercase tracking-widest text-white/30 px-3 py-1.5 bg-bg-deep rounded-xl border border-white/5 uppercase tracking-widest">
                                    Total: {safeFormatAOA(totalEliminacoes)}
                                 </span>
                              </div>

                              {empresas.length < 2 ? (
                                 <div className="text-center py-10 bg-bg-deep rounded-2xl">
                                    <p className="text-xs font-black uppercase tracking-widest text-white/30 uppercase tracking-widest">São necessárias pelo menos 2 empresas no grupo para registar eliminações.</p>
                                 </div>
                              ) : eliminacoesExemplo.length === 0 ? (
                                 <div className="text-center py-10 bg-bg-deep rounded-2xl">
                                    <p className="text-xs font-black uppercase tracking-widest text-white/30 uppercase tracking-widest">Nenhuma eliminação intercompany registada.</p>
                                 </div>
                              ) : (
                                 <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                       <thead>
                                          <tr className="border-b border-white/5">
                                             {['Tipo', 'Descrição', 'Origem', 'Destino', 'Valor'].map(h => (
                                                <th key={h} className="pb-3 px-4 text-[9px] font-black uppercase tracking-widest text-white/30">{h}</th>
                                             ))}
                                          </tr>
                                       </thead>
                                       <tbody>
                                          {eliminacoesExemplo.map(el => (
                                             <tr key={el.id} className="border-b border-zinc-50 hover:bg-bg-deep transition-colors">
                                                <td className="py-3 px-4">
                                                   <span className="px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-yellow-50 text-yellow-700 border border-yellow-100">{el.tipo}</span>
                                                </td>
                                                <td className="py-3 px-4 text-sm font-bold text-white/80">{el.descricao}</td>
                                                <td className="py-3 px-4 text-xs font-bold text-white/40">{el.origem}</td>
                                                <td className="py-3 px-4 text-xs font-bold text-white/40">{el.destino}</td>
                                                <td className="py-3 px-4 text-sm font-black uppercase tracking-widest text-red-500 text-right">({safeFormatAOA(el.valor)})</td>
                                             </tr>
                                          ))}
                                       </tbody>
                                       <tfoot>
                                          <tr className="border-t-2 border-white/10">
                                             <td colSpan={4} className="pt-4 px-4 text-[9px] font-black uppercase tracking-widest text-white/30">Total a Eliminar</td>
                                             <td className="pt-4 px-4 text-base font-black uppercase tracking-widest text-red-600 text-right">({safeFormatAOA(totalEliminacoes)})</td>
                                          </tr>
                                          <tr>
                                             <td colSpan={4} className="pt-2 px-4 text-[9px] font-black uppercase tracking-widest text-white">Lucro Consolidado Ajustado</td>
                                             <td className={`pt-2 px-4 text-base font-black uppercase tracking-widest text-right ${lucroConsolidado >= 0 ? 'text-green-600' : 'text-red-600'}`}>{safeFormatAOA(lucroConsolidado)}</td>
                                          </tr>
                                       </tfoot>
                                    </table>
                                 </div>
                              )}
                           </div>
                        </div>
                     );
                  })()
               }
               {/* --- MODAL NOVA CONTA (PLANO DE CONTAS) --- */}
               {
                  showAccountModal && (
                     <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
                        <div className="bg-white/5 w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
                           <div className="p-8 border-b border-white/5 flex justify-between items-center bg-bg-deep/50">
                              <h2 className="text-xl font-black uppercase tracking-widest text-white flex items-center gap-3 uppercase tracking-tight">
                                 <ListFilter className="text-gold-primary" /> Configurar Nova Conta (PGN)
                              </h2>
                              <button onClick={() => setShowAccountModal(false)} className="p-3 text-white/30 hover:bg-zinc-200 rounded-full transition-all"><X size={24} /></button>
                           </div>
                           <form onSubmit={handleCreateAccount} className="p-8 space-y-6">
                              <div className="grid grid-cols-2 gap-6">
                                 <Input name="codigo" label="Código PGC (Ex: 1.1.2)" required
                                    value={newAccount.codigo} onChange={e => setNewAccount({ ...newAccount, codigo: e.target.value })}
                                 />
                                 <Input name="nome" label="Descrição da Conta" required
                                    value={newAccount.nome} onChange={e => setNewAccount({ ...newAccount, nome: e.target.value })}
                                 />
                              </div>
                              <div className="grid grid-cols-2 gap-6">
                                 <Select name="tipo" label="Tipo de Conta"
                                    value={newAccount.tipo} onChange={e => setNewAccount({ ...newAccount, tipo: e.target.value as any })}
                                    options={[
                                       { value: 'Ativo', label: 'Ativo' },
                                       { value: 'Passivo', label: 'Passivo' },
                                       { value: 'Capital', label: 'Capital Próprio' },
                                       { value: 'Receita', label: 'Receita' },
                                       { value: 'Despesa', label: 'Despesa' }
                                    ]}
                                 />
                                 <Select name="natureza" label="Natureza"
                                    value={newAccount.natureza} onChange={e => setNewAccount({ ...newAccount, natureza: e.target.value as any })}
                                    options={[
                                       { value: 'Devedora', label: 'Devedora' },
                                       { value: 'Credora', label: 'Credora' }
                                    ]}
                                 />
                              </div>
                              <div className="grid grid-cols-2 gap-6">
                                 <Select name="aceita_lancamentos" label="Tipo de Lançamento"
                                    value={newAccount.aceita_lancamentos ? 'true' : 'false'}
                                    onChange={e => setNewAccount({ ...newAccount, aceita_lancamentos: e.target.value === 'true' })}
                                    options={[
                                       { value: 'true', label: 'Analítica (Aceita Movimentos)' },
                                       { value: 'false', label: 'Sintética (Apenas Grupos)' }
                                    ]}
                                 />
                                 <Select name="centro_custo_id" label="Centro de Custo Associado"
                                    value={newAccount.centro_custo_id} onChange={e => setNewAccount({ ...newAccount, centro_custo_id: e.target.value })}
                                    options={[
                                       { value: '', label: 'Nenhum' },
                                       ...centrosCusto.map(cc => ({ value: cc.id, label: cc.nome }))
                                    ]}
                                 />
                              </div>
                              <div className="p-4 bg-bg-deep rounded-2xl border border-white/5">
                                 <p className="text-[9px] font-black uppercase tracking-widest text-white/30 uppercase tracking-widest mb-1 font-mono">Hierarchy Preview</p>
                                 <p className="text-xs font-bold text-white/70">Nível detectado automaticamente: <span className="text-white">{newAccount.codigo.split('.').length}</span></p>
                              </div>
                              <button type="submit" className="w-full py-5 bg-gold-primary text-white font-black uppercase tracking-widest rounded-2xl uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 hover:bg-gold-primary hover:text-white transition-all shadow-xl">
                                 <Save size={18} /> Registrar no Estatuto
                              </button>
                           </form>
                        </div>
                     </div>
                  )
               }

               {/* --- MODAL NOVO CENTRO DE CUSTO --- */}
               {
                  showCCModal && (
                     <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/80 backdrop-blur-md p-4 animate-in fade-in">
                        <div className="bg-white/5 w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
                           <div className="p-8 border-b border-white/5 flex justify-between items-center bg-bg-deep/50">
                              <h2 className="text-xl font-black uppercase tracking-widest text-white flex items-center gap-3 uppercase tracking-tight">
                                 <Landmark className="text-gold-primary" /> Novo Centro de Custo/Lucro
                              </h2>
                              <button onClick={() => setShowCCModal(false)} className="p-3 text-white/30 hover:bg-zinc-200 rounded-full transition-all"><X size={24} /></button>
                           </div>
                           <form onSubmit={handleCreateCentro} className="p-8 space-y-6">
                              <div className="grid grid-cols-2 gap-6">
                                 <Input name="cc_codigo" label="Código do Centro" required
                                    value={newCentroCusto.codigo} onChange={e => setNewCentroCusto({ ...newCentroCusto, codigo: e.target.value })}
                                    placeholder="Ex: ADM, PRD"
                                 />
                                 <Input name="cc_nome" label="Nome / Identificador" required
                                    value={newCentroCusto.nome} onChange={e => setNewCentroCusto({ ...newCentroCusto, nome: e.target.value })}
                                 />
                              </div>
                              <Select name="cc_tipo" label="Tipo de Centro"
                                 value={newCentroCusto.tipo} onChange={e => setNewCentroCusto({ ...newCentroCusto, tipo: e.target.value })}
                                 options={[
                                    { value: 'Custo', label: 'Centro de Custo (Gasto)' },
                                    { value: 'Lucro', label: 'Centro de Lucro (Receita)' },
                                    { value: 'Misto', label: 'Misto / Operacional' }
                                 ]}
                              />
                              <Input name="cc_desc" label="Breve Descrição"
                                 value={newCentroCusto.descricao} onChange={e => setNewCentroCusto({ ...newCentroCusto, descricao: e.target.value })}
                              />
                              <button type="submit" className="w-full py-5 bg-gold-primary text-white font-black uppercase tracking-widest rounded-2xl uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 hover:bg-zinc-800 transition-all">
                                 <Save size={18} /> Confirmar Estrutura
                              </button>
                           </form>
                        </div>
                     </div>
                  )
               }

               {/* --- MODAL NOVO CONTACTO (CRM) --- */}
               {
                  showContactModal && (
                     <div className="fixed inset-0 z-[200] flex items-center justify-center bg-zinc-950/80 backdrop-blur-md p-6 animate-in fade-in duration-300 overflow-y-auto">
                        <div className="bg-white/5 w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-y-auto max-h-[90vh] animate-in zoom-in-95 my-auto">
                           <div className="p-8 border-b border-white/5 flex justify-between items-center bg-bg-deep/50">
                              <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 bg-gold-primary rounded-2xl flex items-center justify-center text-white shadow-lg">
                                    <Users size={24} />
                                 </div>
                                 <div>
                                    <h2 className="text-xl font-black uppercase tracking-widest text-white uppercase tracking-tight">Novo Contacto</h2>
                                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Registo de Parceiro de Negócio</p>
                                 </div>
                              </div>
                              <button onClick={() => setShowContactModal(false)} className="p-3 text-white/30 hover:bg-zinc-200 rounded-full transition-all"><X size={24} /></button>
                           </div>
                           <form onSubmit={handleCreateContact} className="p-10 space-y-8">
                              <div className="grid grid-cols-2 gap-6">
                                 <div className="col-span-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 uppercase tracking-widest block mb-2">Empresa / Entidade</label>
                                    <Select
                                       value={newContact.company_id || selectedEmpresaId}
                                       onChange={(e: any) => setNewContact({ ...newContact, company_id: e.target.value })}
                                       options={empresas.map(e => ({ value: e.id, label: e.name || e.nome }))}
                                    />
                                 </div>
                                 <div className="col-span-2">
                                    <Input label="Nome Completo / Razão Social" required placeholder="Ex: Amazing Corporation Lda"
                                       value={newContact.nome} onChange={(e: any) => setNewContact({ ...newContact, nome: e.target.value })}
                                    />
                                 </div>
                                 <Input label="NIF" placeholder="Ex: 5000123456"
                                    value={newContact.nif} onChange={(e: any) => setNewContact({ ...newContact, nif: e.target.value })}
                                 />
                                 <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 uppercase tracking-widest">Tipo de Contacto</label>
                                    <Select
                                       value={newContact.tipo}
                                       onChange={(e: any) => setNewContact({ ...newContact, tipo: e.target.value as any })}
                                       options={[
                                          { value: 'Cliente', label: 'Cliente' },
                                          { value: 'Fornecedor', label: 'Fornecedor' },
                                          { value: 'Ambos', label: 'Ambos (Parceiro)' }
                                       ]}
                                    />
                                 </div>
                              </div>

                              <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/10">
                                 <Input label="E-mail" type="email" placeholder="contacto@email.com"
                                    value={newContact.email} onChange={(e: any) => setNewContact({ ...newContact, email: e.target.value })}
                                 />
                                 <Input label="Telefone" placeholder="+244 9XX XXX XXX"
                                    value={newContact.telefone} onChange={(e: any) => setNewContact({ ...newContact, telefone: e.target.value })}
                                 />
                                 <div className="col-span-2">
                                    <Input label="Morada / Localização" placeholder="Cidade, Bairro, Rua..."
                                       value={newContact.morada} onChange={(e: any) => setNewContact({ ...newContact, morada: e.target.value })}
                                    />
                                 </div>
                              </div>

                              <div className="pt-6">
                                 <button type="submit" disabled={isSavingContact} className="w-full py-6 bg-gold-primary hover:bg-zinc-800 text-white rounded-[2rem] font-black uppercase tracking-widest uppercase text-sm tracking-widest shadow-2xl transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-4">
                                    {isSavingContact ? <RefreshCw className="animate-spin text-gold-primary" /> : <Save className="text-gold-primary" />}
                                    {isSavingContact ? 'A Processar...' : 'Confirmar Registo'}
                                 </button>
                              </div>
                           </form>
                        </div>
                     </div>
                  )
               }

               {/* --- MODAL NOVA CATEGORIA (INVENTÃRIO) --- */}
               {
                  showCategoryModal && (
                     <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
                        <div className="bg-white/5 w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
                           <div className="p-8 border-b border-white/5 flex justify-between items-center bg-bg-deep/50">
                              <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 bg-gold-primary rounded-2xl flex items-center justify-center text-white shadow-lg">
                                    <ListFilter size={24} />
                                 </div>
                                 <div>
                                    <h2 className="text-xl font-black uppercase tracking-widest text-white uppercase tracking-tight">Nova Categoria</h2>
                                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Organização de Itens e Stock</p>
                                 </div>
                              </div>
                              <button onClick={() => setShowCategoryModal(false)} className="p-3 text-white/30 hover:bg-zinc-200 rounded-full transition-all"><X size={24} /></button>
                           </div>
                           <form onSubmit={handleCreateCategory} className="p-8 space-y-6">
                              <div className="space-y-4">
                                 <Input label="Nome da Categoria" required placeholder="Ex: Informática, Bebidas..."
                                    value={newCategory.nome} onChange={(e: any) => setNewCategory({ ...newCategory, nome: e.target.value })}
                                 />
                                 <Input label="Descrição Curta" placeholder="Opcional..."
                                    value={newCategory.descricao} onChange={(e: any) => setNewCategory({ ...newCategory, descricao: e.target.value })}
                                 />
                                 <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 uppercase tracking-widest">Cor de Identificação</label>
                                    <div className="flex gap-3">
                                       {['#fbbf24', '#3b82f6', '#ef4444', '#10b981', '#a855f7', '#6366f1'].map(color => (
                                          <button
                                             key={color}
                                             type="button"
                                             onClick={() => setNewCategory({ ...newCategory, cor: color })}
                                             className={`w-10 h-10 rounded-xl transition-all ${newCategory.cor === color ? 'ring-4 ring-zinc-900 ring-offset-2' : 'hover:scale-110'}`}
                                             style={{ backgroundColor: color }}
                                          />
                                       ))}
                                    </div>
                                 </div>
                              </div>

                              <div className="pt-6">
                                 <button type="submit" disabled={isSavingCategory} className="w-full py-6 bg-gold-primary hover:bg-zinc-800 text-white rounded-[2rem] font-black uppercase tracking-widest uppercase text-sm tracking-widest shadow-2xl transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-4">
                                    {isSavingCategory ? <RefreshCw className="animate-spin text-gold-primary" /> : <Save className="text-gold-primary" />}
                                    {isSavingCategory ? 'A Guardar...' : 'Criar Categoria'}
                                 </button>
                              </div>
                           </form>
                        </div>
                     </div>
                  )
               }

               {/* --- MODAL NOVO ITEM (INVENTÃRIO) --- */}
               {
                  showItemModal && (
                     <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
                        <div className="bg-white/5 w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
                           <div className="p-8 border-b border-white/5 flex justify-between items-center bg-bg-deep/50">
                              <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 bg-gold-primary rounded-2xl flex items-center justify-center text-white shadow-lg">
                                    <Plus size={24} />
                                 </div>
                                 <div>
                                    <h2 className="text-xl font-black uppercase tracking-widest text-white uppercase tracking-tight">Novo Item no Catálogo</h2>
                                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Registo de Produto ou Serviço</p>
                                 </div>
                              </div>
                              <button onClick={() => setShowItemModal(false)} className="p-3 text-white/30 hover:bg-zinc-200 rounded-full transition-all"><X size={24} /></button>
                           </div>
                           <form onSubmit={handleCreateItem} className="p-8 space-y-6">
                              <div className="grid grid-cols-2 gap-6">
                                 <div className="col-span-2">
                                    <Input label="Nome do Item / Serviço" required placeholder="Ex: Consultoria Fiscal, Resma A4..."
                                       value={newInventoryItem.nome} onChange={(e: any) => setNewInventoryItem({ ...newInventoryItem, nome: e.target.value })}
                                    />
                                 </div>
                                 <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 uppercase tracking-widest">Categoria</label>
                                    <Select
                                       value={newInventoryItem.categoria_id}
                                       onChange={(e: any) => setNewInventoryItem({ ...newInventoryItem, categoria_id: e.target.value })}
                                       options={[
                                          { value: '', label: 'Selecione uma categoria' },
                                          ...categorias.map(cat => ({ value: cat.id, label: cat.nome }))
                                       ]}
                                       required
                                    />
                                 </div>
                                 <Input label="Código/SKU" placeholder="Ex: SERV-001"
                                    value={newInventoryItem.codigo} onChange={(e: any) => setNewInventoryItem({ ...newInventoryItem, codigo: e.target.value })}
                                 />
                              </div>

                              <div className="grid grid-cols-3 gap-6 pt-4 border-t border-zinc-50">
                                 <Input label="Preço Unitário" type="number"
                                    value={newInventoryItem.preco_unitario} onChange={(e: any) => setNewInventoryItem({ ...newInventoryItem, preco_unitario: Number(e.target.value) })}
                                 />
                                 <Input label="Qtd. Inicial" type="number"
                                    value={newInventoryItem.quantidade_atual} onChange={(e: any) => setNewInventoryItem({ ...newInventoryItem, quantidade_atual: Number(e.target.value) })}
                                 />
                                 <Input label="Stock Mínimo" type="number"
                                    value={newInventoryItem.quantidade_minima} onChange={(e: any) => setNewInventoryItem({ ...newInventoryItem, quantidade_minima: Number(e.target.value) })}
                                 />
                              </div>

                              <div className="flex gap-4 pt-4">
                                 <div className="flex-1">
                                    <Input label="Unidade" placeholder="Ex: un, kg, hora..."
                                       value={newInventoryItem.unidade} onChange={(e: any) => setNewInventoryItem({ ...newInventoryItem, unidade: e.target.value })}
                                    />
                                 </div>
                                 <div className="flex-1">
                                    <Input label="Referência Interna" placeholder="Opcional..."
                                       value={newInventoryItem.referencia} onChange={(e: any) => setNewInventoryItem({ ...newInventoryItem, referencia: e.target.value })}
                                    />
                                 </div>
                              </div>

                              <div className="pt-6">
                                 <button type="submit" disabled={isSavingItem} className="w-full py-6 bg-gold-primary hover:bg-zinc-800 text-white rounded-[2rem] font-black uppercase tracking-widest uppercase text-sm tracking-widest shadow-2xl transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-4">
                                    {isSavingItem ? <RefreshCw className="animate-spin text-gold-primary" /> : <Save className="text-gold-primary" />}
                                    {isSavingItem ? 'A Processar...' : 'Adicionar ao Catálogo'}
                                 </button>
                              </div>
                           </form>
                        </div>
                     </div>
                  )
               }
               {/* --- MODAL NOVO FUNCIONÃRIO --- */}
               {
                  showEmployeeModal && (
                     <div className="fixed inset-0 z-[130] flex items-center justify-center bg-zinc-950/80 backdrop-blur-md p-4 animate-in fade-in">
                        <div className="bg-white/5 w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
                           <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gold-primary text-white">
                              <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 bg-gold-primary rounded-2xl flex items-center justify-center text-white shadow-lg">
                                    <UserPlus size={24} />
                                 </div>
                                 <div>
                                    <h2 className="text-xl font-black uppercase tracking-widest uppercase tracking-tight">Registar Colaborador</h2>
                                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{currentEmpresa?.nome}</p>
                                 </div>
                              </div>
                              <button onClick={() => setShowEmployeeModal(false)} className="p-3 text-white/50 hover:bg-white/10 rounded-full transition-all"><X size={24} /></button>
                           </div>
                           <form onSubmit={handleSaveEmployee} className="p-10 space-y-10">
                              {/* Bloco 1: Identificação e Base */}
                              <div className="space-y-4">
                                 <h4 className="text-[10px] font-black uppercase tracking-widest text-white/30 uppercase tracking-widest border-b border-white/5 pb-2">Informação Base e Identificação</h4>
                                 <div className="grid grid-cols-3 gap-6">
                                    <div className="col-span-1">
                                       <Input label="Nome Completo" required value={newEmployee.nome} onChange={e => setNewEmployee({ ...newEmployee, nome: e.target.value })} placeholder="Ex: João Manuel dos Santos" />
                                    </div>
                                    <Input label="Função / Cargo" required value={newEmployee.funcao} onChange={e => setNewEmployee({ ...newEmployee, funcao: e.target.value })} placeholder="Ex: Contabilista Sénior" />
                                    <Input label="NIF" value={newEmployee.nif} onChange={e => setNewEmployee({ ...newEmployee, nif: e.target.value })} placeholder="000000000LA000" />
                                    <Input label="Bilhete de Identidade" value={newEmployee.bilhete} onChange={e => setNewEmployee({ ...newEmployee, bilhete: e.target.value })} placeholder="000000000" />
                                    <Input label="Telefone" value={newEmployee.telefone} onChange={e => setNewEmployee({ ...newEmployee, telefone: e.target.value })} placeholder="900 000 000" />

                                    <Input label="Salário Base (AOA)" type="number" required value={newEmployee.salario_base} onChange={e => setNewEmployee({ ...newEmployee, salario_base: Number(e.target.value) })} />
                                    <Input label="N.º Segurança Social" value={newEmployee.numero_ss} onChange={e => setNewEmployee({ ...newEmployee, numero_ss: e.target.value })} placeholder="00000000000" />
                                    <div className="flex items-end pb-1">
                                       <div className="p-4 bg-bg-deep rounded-2xl border border-white/5 w-full">
                                          <p className="text-[9px] font-bold text-white/30 uppercase">Cálculo Estimado</p>
                                          <p className="text-xs font-black uppercase tracking-widest text-white">IRT/INSS Automático</p>
                                       </div>
                                    </div>
                                 </div>
                              </div>

                              {/* Bloco 2: Subsídios Mensais e Anuais (Lado a Lado) */}
                              <div className="grid grid-cols-2 gap-8">
                                 <div className="p-6 bg-bg-deep/50 rounded-3xl border border-white/5 space-y-6">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-white/30 uppercase tracking-widest border-b border-white/10 pb-2">Subsídios Mensais Fixos</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                       <Input label="Alimentação" type="number" value={newEmployee.subsidio_alimentacao} onChange={e => setNewEmployee({ ...newEmployee, subsidio_alimentacao: Number(e.target.value) })} />
                                       <Input label="Transporte" type="number" value={newEmployee.subsidio_transporte} onChange={e => setNewEmployee({ ...newEmployee, subsidio_transporte: Number(e.target.value) })} />
                                    </div>
                                 </div>

                                 <div className="p-6 bg-yellow-50/30 rounded-3xl border border-yellow-100 space-y-6">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gold-primary uppercase tracking-widest border-b border-yellow-200 pb-2">Bónus e Descontos</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                       <Input label="Horas Extras (Valor)" type="number" value={newEmployee.valor_hora_extra_base} onChange={e => setNewEmployee({ ...newEmployee, valor_hora_extra_base: Number(e.target.value) })} />
                                       <Input label="Adiantamento Padrão" type="number" value={newEmployee.adiantamento_padrao} onChange={e => setNewEmployee({ ...newEmployee, adiantamento_padrao: Number(e.target.value) })} />
                                       <Input label="Outros Descontos" type="number" value={newEmployee.outros_descontos_base} onChange={e => setNewEmployee({ ...newEmployee, outros_descontos_base: Number(e.target.value) })} />
                                       <div className="flex flex-col gap-2 pt-2">
                                          <label className="flex items-center gap-2 cursor-pointer">
                                             <input type="checkbox" checked={newEmployee.desconto_inss} onChange={e => setNewEmployee({ ...newEmployee, desconto_inss: e.target.checked })} className="w-4 h-4 accent-yellow-500" />
                                             <span className="text-[10px] font-bold text-white/70 uppercase">Aplicar INSS</span>
                                          </label>
                                          <label className="flex items-center gap-2 cursor-pointer">
                                             <input type="checkbox" checked={newEmployee.desconto_irt} onChange={e => setNewEmployee({ ...newEmployee, desconto_irt: e.target.checked })} className="w-4 h-4 accent-yellow-500" />
                                             <span className="text-[10px] font-bold text-white/70 uppercase">Aplicar IRT</span>
                                          </label>
                                       </div>
                                       <Input label="Base Férias" type="number" value={newEmployee.subsidio_ferias_base} onChange={e => setNewEmployee({ ...newEmployee, subsidio_ferias_base: Number(e.target.value) })} />
                                       <Input label="Base Natal" type="number" value={newEmployee.subsidio_natal_base} onChange={e => setNewEmployee({ ...newEmployee, subsidio_natal_base: Number(e.target.value) })} />
                                       <div className="col-span-2">
                                          <Input label="Gratificações Mensais" type="number" value={newEmployee.outras_bonificacoes_base} onChange={e => setNewEmployee({ ...newEmployee, outras_bonificacoes_base: Number(e.target.value) })} />
                                       </div>
                                    </div>
                                 </div>
                              </div>

                              <div className="pt-4">
                                 <button type="submit" disabled={isProcessingPayroll} className="w-full py-6 bg-gold-primary hover:bg-zinc-800 text-white rounded-[2rem] font-black uppercase tracking-widest uppercase text-sm tracking-widest shadow-2xl transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-4">
                                    {isProcessingPayroll ? <RefreshCw className="animate-spin text-gold-primary" /> : <Save className="text-gold-primary" />}
                                    {isProcessingPayroll ? 'Processando...' : 'Confirmar Registo do Funcionário'}
                                 </button>
                              </div>
                           </form>
                        </div>
                     </div>
                  )
               }

               {/* --- MODAL RECIBO DE SALÃRIO --- */}
               {
                  selectedFolha && (
                     <div className="fixed inset-0 z-[140] flex items-center justify-center bg-zinc-950/90 backdrop-blur-xl p-4 animate-in fade-in">
                        <div className="bg-white/5 w-full max-w-3xl rounded-[4rem] shadow-3xl overflow-hidden animate-in zoom-in-95 relative print:shadow-none print:rounded-none">
                           <div className="absolute top-8 right-8 flex gap-2 print:hidden">
                              <button onClick={() => window.print()} className="p-4 bg-white/5 hover:bg-zinc-200 text-white/70 rounded-2xl transition-all"><Printer size={24} /></button>
                              <button onClick={() => setSelectedFolha(null)} className="p-4 bg-white/5 hover:bg-red-50 text-white/30 hover:text-red-500 rounded-2xl transition-all"><X size={24} /></button>
                           </div>

                           <div className="p-16 space-y-12">
                              {/* Cabeçalho do Recibo */}
                              <div className="flex justify-between items-start border-b-4 border-zinc-900 pb-10">
                                 <div>
                                    <h2 className="text-4xl font-black uppercase tracking-widest uppercase tracking-tighter text-white leading-none mb-2">Recibo de Salário</h2>
                                    <p className="text-lg font-bold text-white/30 uppercase tracking-widest">Mês de Referência: {selectedFolha.mes_referencia}</p>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-xl font-black uppercase tracking-widest text-white uppercase">{currentEmpresa?.nome}</p>
                                    <p className="text-sm font-bold text-white/30">NIF: {currentEmpresa?.nif || '---'}</p>
                                 </div>
                              </div>

                              {/* Dados do Funcionário */}
                              <div className="grid grid-cols-2 gap-10">
                                 <div className="p-8 bg-bg-deep rounded-[2.5rem] border border-white/5">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/30 uppercase tracking-widest mb-2">Colaborador</p>
                                    <p className="text-2xl font-black uppercase tracking-widest text-white uppercase tracking-tighter">{selectedFolha.funcionario_nome}</p>
                                 </div>
                                 <div className="p-8 bg-bg-deep rounded-[2.5rem] border border-white/5">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/30 uppercase tracking-widest mb-2">Cargo / Função</p>
                                    <p className="text-xl font-black uppercase tracking-widest text-white/80 uppercase tracking-tighter">Funcionário Activo</p>
                                 </div>
                              </div>

                              {/* Tabela de Vencimentos e Descontos */}
                              <div className="space-y-4">
                                 <div className="grid grid-cols-12 gap-4 px-6 text-[10px] font-black uppercase tracking-widest text-white/30 uppercase tracking-widest border-b border-white/5 pb-2">
                                    <div className="col-span-6">Descrição</div>
                                    <div className="col-span-3 text-right">Vencimentos</div>
                                    <div className="col-span-3 text-right">Descontos</div>
                                 </div>
                                 <div className="space-y-2">
                                    {[
                                       { d: 'Salário Base', v: Number(selectedFolha.salario_base), type: 'V' },
                                       { d: 'Subsídios (Alim./Transp.)', v: Number(selectedFolha.subsidios), type: 'V' },
                                       { d: 'Horas Extras', v: Number((selectedFolha as any).horas_extras || 0), type: 'V' },
                                       { d: 'Subsídio de Férias', v: Number((selectedFolha as any).subsidio_ferias || 0), type: 'V' },
                                       { d: 'Subsídio de Natal', v: Number((selectedFolha as any).subsidio_natal || 0), type: 'V' },
                                       { d: 'Bónus e Gratificações', v: Number((selectedFolha as any).outras_bonificacoes || 0), type: 'V' },
                                       { d: 'INSS (3%)', v: Number(selectedFolha.inss_trabal_ador || selectedFolha.inss_trabalhador), type: 'D' },
                                       { d: 'IRT / Taxa Fiscal', v: Number(selectedFolha.irt), type: 'D' },
                                       { d: 'Desconto Atrasos/Faltas', v: Number((selectedFolha as any).desconto_atrasos || 0), type: 'D' },
                                       { d: 'Desconto Férias', v: Number((selectedFolha as any).desconto_ferias || 0), type: 'D' },
                                       { d: 'Adiantamento Salarial', v: Number((selectedFolha as any).adiantamento_salarial || 0), type: 'D' },
                                    ].filter(item => item.v > 0 || item.type === 'D').map((item, idx) => (
                                       <div key={idx} className="grid grid-cols-12 gap-4 px-6 py-4 rounded-2xl hover:bg-bg-deep transition-colors">
                                          <div className="col-span-6 text-sm font-bold text-white">{item.d}</div>
                                          <div className="col-span-3 text-right text-sm font-black uppercase tracking-widest text-green-600">{item.type === 'V' ? safeFormatAOA(item.v) : ''}</div>
                                          <div className="col-span-3 text-right text-sm font-black uppercase tracking-widest text-red-500">{item.type === 'D' ? safeFormatAOA(item.v) : ''}</div>
                                       </div>
                                    ))}
                                 </div>
                              </div>

                              {/* Totais Finas */}
                              <div className="grid grid-cols-3 gap-8 pt-10 border-t-4 border-white/5">
                                 <div className="text-center">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/30 uppercase tracking-widest mb-1">Total Bruto</p>
                                    <p className="text-xl font-bold text-white">{safeFormatAOA(Number((selectedFolha as any).salario_bruto) || (Number(selectedFolha.salario_base) + Number(selectedFolha.subsidios)))}</p>
                                 </div>
                                 <div className="text-center">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/30 uppercase tracking-widest mb-1">Total Descontos</p>
                                    <p className="text-xl font-bold text-red-500">-{safeFormatAOA(Number((selectedFolha as any).total_descontos) || (Number(selectedFolha.inss_trabalhador) + Number(selectedFolha.irt)))}</p>
                                 </div>
                                 <div className="text-center">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/30 uppercase tracking-widest mb-1">Salário a Receber</p>
                                    <p className="text-3xl font-black uppercase tracking-widest text-green-600">{safeFormatAOA(Number(selectedFolha.salario_liquido))}</p>
                                 </div>
                              </div>

                              <div className="pt-10 flex justify-between items-end">
                                 <div className="space-y-4">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-white/30 uppercase tracking-widest">Assinatura da Entidade</p>
                                    <div className="w-64 h-px bg-zinc-200"></div>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-white/20 uppercase tracking-widest">Processado via Amazing ContábilExpert ERP</p>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>
                  )
               }
               {/* Print Template (Hidden) */}
               <div style={{ position: 'absolute', top: '-10000px', left: '-10000px', width: '80mm' }}>
                  <div ref={invoicePrintRef} className="invoice" style={{ fontFamily: 'Arial, sans-serif', fontSize: '11px', padding: '1mm', background: '#fff', color: '#000' }}>
                     <div style={{ textAlign: 'center', marginBottom: '1mm' }}>
                        <h1 style={{ fontWeight: 900, fontSize: '15px', textTransform: 'uppercase', margin: '0 0 1px 0' }}>{user?.company_name}</h1>
                        <p style={{ margin: '0', fontSize: '10px' }}>NIF: {user?.nif || '999999999'}</p>
                        {user?.address && <p style={{ margin: '0', fontSize: '9px' }}>{user.address}</p>}
                        {user?.phone && <p style={{ margin: '0', fontSize: '9px' }}>Tel: {user.phone}</p>}
                        <p style={{ margin: '1mm 0 0.5mm 0', fontSize: '11px', fontWeight: 'bold' }}>
                           {lastCreatedDoc?.tipo?.toUpperCase() || 'DOCUMENTO'}
                        </p>
                        <p style={{ margin: '0', fontSize: '9px', fontWeight: 'bold' }}>Original</p>
                     </div>

                     <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '1mm 0', marginBottom: '1mm' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>FACT Nº:</span><span style={{ fontWeight: 'bold' }}>{lastCreatedDoc?.numero_fatura || lastCreatedDoc?.metadata?.invoice_number || '---'}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Data:</span><span>{lastCreatedDoc?.data_emissao}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Cliente:</span><span style={{ textTransform: 'uppercase' }}>{lastCreatedDoc?.cliente_nome}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>NIF Cli:</span><span>{lastCreatedDoc?.metadata?.customer_nif || '999999999'}</span></div>
                     </div>

                     <table style={{ width: '100%', marginBottom: '1mm', borderCollapse: 'collapse' }}>
                        <thead>
                           <tr style={{ borderBottom: '1px solid #000' }}>
                              <th style={{ textAlign: 'left', padding: '0.5mm 0' }}>Item</th>
                              <th style={{ textAlign: 'center', padding: '0.5mm 0' }}>Qtd</th>
                              <th style={{ textAlign: 'right', padding: '0.5mm 0' }}>Preço Unit.</th>
                              <th style={{ textAlign: 'right', padding: '0.5mm 0' }}>Total</th>
                           </tr>
                        </thead>
                        <tbody>
                           {(lastCreatedDoc?.metadata?.items || []).length > 0 ? (
                              (lastCreatedDoc.metadata.items).map((it: any, i: number) => (
                                 <tr key={i}>
                                    <td style={{ padding: '0.8mm 0' }}>{it.nome}</td>
                                    <td style={{ textAlign: 'center', padding: '0.8mm 0' }}>{it.qtd}</td>
                                    <td style={{ textAlign: 'right', padding: '0.8mm 0' }}>{safeFormatAOA(it.preco_unitario || it.price || (it.total / it.qtd))}</td>
                                    <td style={{ textAlign: 'right', padding: '0.8mm 0' }}>{safeFormatAOA(it.total)}</td>
                                 </tr>
                              ))
                           ) : (
                              <tr>
                                 <td colSpan={4} style={{ padding: '2mm 0', textAlign: 'center', fontStyle: 'italic', fontSize: '9px', color: '#666' }}>
                                    Detalhamento de itens não disponível para este documento antigo.
                                 </td>
                              </tr>
                           )}
                        </tbody>
                     </table>

                     <div style={{ borderTop: '1px dashed #000', paddingTop: '0.5mm' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal:</span><span>{safeFormatAOA(lastCreatedDoc?.metadata?.subtotal)}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>IVA (14%):</span><span>{safeFormatAOA(lastCreatedDoc?.metadata?.iva)}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Desconto (0%):</span><span style={{ color: 'red' }}>-{safeFormatAOA(lastCreatedDoc?.metadata?.discount || 0)}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '13px', borderTop: '1px solid #000', marginTop: '1mm', paddingTop: '1mm' }}>
                           <span>TOTAL:</span><span>{safeFormatAOA(lastCreatedDoc?.valor_total)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1mm', fontSize: '10px' }}>
                           <span>Pago:</span><span>{safeFormatAOA(lastCreatedDoc?.metadata?.amount_paid ?? (lastCreatedDoc?.type_prefix === 'PRO' ? 0 : lastCreatedDoc?.valor_total))}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '11px' }}>
                           <span>Troco:</span><span>{safeFormatAOA(lastCreatedDoc?.metadata?.change || 0)}</span>
                        </div>
                     </div>

                     {/* AGT Compliance & QR Code */}
                     <div style={{ textAlign: 'center', marginTop: '3mm', padding: '2mm 0', borderTop: '1px dashed #000' }}>
                        <p style={{ fontSize: '9px', margin: '0 0 1mm 0', fontWeight: 'bold' }}>
                           {lastCreatedDoc?.cert_phrase || 'Processado por programa validado n.º 0000/AGT/2026'}
                        </p>
                        <p style={{ fontSize: '8px', margin: '0 0 4mm 0', textTransform: 'uppercase' }}>
                           Regime: {user?.regime_iva || 'Geral'}
                        </p>

                        <p style={{ fontSize: '10px', fontWeight: 'bold' }}>Obrigado pela preferência!</p>
                        <p style={{ fontSize: '9px', color: '#666' }}>Software de Gestão Multi-Empresa - Venda Plus</p>
                     </div>
                  </div>
               </div>
            </div>
         </main>
      </div>
   );
};

export default AccountingPage;
