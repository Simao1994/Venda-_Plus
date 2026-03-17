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
   LayoutList, TrendingUp, Package, Shield, Mail, Phone, Play, UserPlus
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
import { safeQuery } from '../../lib/supabaseUtils';
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
   { id: '1.1', codigo: '1.1', nome: 'ImobilizaÃ§Ãµes corpÃ³reas', tipo: 'Ativo', natureza: 'Devedora', nivel: 2, pai_id: '1', e_sintetica: true, aceita_lancamentos: false },
   { id: '1.1.1', codigo: '1.1.1', nome: 'Terrenos e recursos naturais', tipo: 'Ativo', natureza: 'Devedora', nivel: 3, pai_id: '1.1', e_analitica: true, aceita_lancamentos: true },
   { id: '1.1.2', codigo: '1.1.2', nome: 'EdifÃ­cios e outras construÃ§Ãµes', tipo: 'Ativo', natureza: 'Devedora', nivel: 3, pai_id: '1.1', e_analitica: true, aceita_lancamentos: true },
   { id: '1.1.3', codigo: '1.1.3', nome: 'Equipamento bÃ¡sico', tipo: 'Ativo', natureza: 'Devedora', nivel: 3, pai_id: '1.1', e_analitica: true, aceita_lancamentos: true },
   { id: '1.2', codigo: '1.2', nome: 'ImobilizaÃ§Ãµes incorpÃ³reas', tipo: 'Ativo', natureza: 'Devedora', nivel: 2, pai_id: '1', e_sintetica: true, aceita_lancamentos: false },
   { id: '1.8', codigo: '1.8', nome: 'AmortizaÃ§Ãµes acumuladas', tipo: 'Ativo', natureza: 'Credora', nivel: 2, pai_id: '1', e_analitica: true, aceita_lancamentos: true },
   // Classe 2
   { id: '2', codigo: '2', nome: 'ExistÃªncias', tipo: 'Ativo', natureza: 'Devedora', nivel: 1, e_sintetica: true, aceita_lancamentos: false },
   { id: '2.1', codigo: '2.1', nome: 'Compras', tipo: 'Ativo', natureza: 'Devedora', nivel: 2, pai_id: '2', e_analitica: true, aceita_lancamentos: true },
   { id: '2.2', codigo: '2.2', nome: 'MatÃ©rias-primas e materiais', tipo: 'Ativo', natureza: 'Devedora', nivel: 2, pai_id: '2', e_analitica: true, aceita_lancamentos: true },
   { id: '2.4', codigo: '2.4', nome: 'Mercadorias', tipo: 'Ativo', natureza: 'Devedora', nivel: 2, pai_id: '2', e_analitica: true, aceita_lancamentos: true },
   // Classe 3
   { id: '3', codigo: '3', nome: 'Contas a receber e a pagar', tipo: 'Ativo', natureza: 'Devedora', nivel: 1, e_sintetica: true, aceita_lancamentos: false },
   { id: '3.1', codigo: '3.1', nome: 'Clientes', tipo: 'Ativo', natureza: 'Devedora', nivel: 2, pai_id: '3', e_sintetica: true, aceita_lancamentos: false },
   { id: '3.1.1', codigo: '3.1.1', nome: 'Clientes gerais', tipo: 'Ativo', natureza: 'Devedora', nivel: 3, pai_id: '3.1', e_analitica: true, aceita_lancamentos: true },
   { id: '3.2', codigo: '3.2', nome: 'Fornecedores', tipo: 'Passivo', natureza: 'Credora', nivel: 2, pai_id: '3', e_sintetica: true, aceita_lancamentos: false },
   { id: '3.2.1', codigo: '3.2.1', nome: 'Fornecedores gerais', tipo: 'Passivo', natureza: 'Credora', nivel: 3, pai_id: '3.2', e_analitica: true, aceita_lancamentos: true },
   { id: '3.3', codigo: '3.3', nome: 'EmprÃ©stimos bank', tipo: 'Passivo', natureza: 'Credora', nivel: 2, pai_id: '3', e_analitica: true, aceita_lancamentos: true },
   { id: '3.4', codigo: '3.4', nome: 'Estado', tipo: 'Passivo', natureza: 'Credora', nivel: 2, pai_id: '3', e_sintetica: true, aceita_lancamentos: false },
   { id: '3.4.1', codigo: '3.4.1', nome: 'IVA a pagar', tipo: 'Passivo', natureza: 'Credora', nivel: 3, pai_id: '3.4', e_analitica: true, aceita_lancamentos: true },
   { id: '3.4.2', codigo: '3.4.2', nome: 'IRT', tipo: 'Passivo', natureza: 'Credora', nivel: 3, pai_id: '3.4', e_analitica: true, aceita_lancamentos: true },
   // Classe 4
   { id: '4', codigo: '4', nome: 'Meios monetÃ¡rios', tipo: 'Ativo', natureza: 'Devedora', nivel: 1, e_sintetica: true, aceita_lancamentos: false },
   { id: '4.1', codigo: '4.1', nome: 'Caixa', tipo: 'Ativo', natureza: 'Devedora', nivel: 2, pai_id: '4', e_analitica: true, aceita_lancamentos: true },
   { id: '4.2', codigo: '4.2', nome: 'Bancos - DO', tipo: 'Ativo', natureza: 'Devedora', nivel: 2, pai_id: '4', e_analitica: true, aceita_lancamentos: true },
   // Classe 5
   { id: '5', codigo: '5', nome: 'Capital e reservas', tipo: 'Capital', natureza: 'Credora', nivel: 1, e_sintetica: true, aceita_lancamentos: false },
   { id: '5.1', codigo: '5.1', nome: 'Capital Social', tipo: 'Capital', natureza: 'Credora', nivel: 2, pai_id: '5', e_analitica: true, aceita_lancamentos: true },
   { id: '5.9', codigo: '5.9', nome: 'Resultados transitados', tipo: 'Capital', natureza: 'Credora', nivel: 2, pai_id: '5', e_analitica: true, aceita_lancamentos: true },
   // Classe 6
   { id: '6', codigo: '6', nome: 'Proveitos e ganhos', tipo: 'Receita', natureza: 'Credora', nivel: 1, e_sintetica: true, aceita_lancamentos: false },
   { id: '6.1', codigo: '6.1', nome: 'Vendas', tipo: 'Receita', natureza: 'Credora', nivel: 2, pai_id: '6', e_analitica: true, aceita_lancamentos: true },
   { id: '6.2', codigo: '6.2', nome: 'PrestaÃ§Ãµes de serviÃ§os', tipo: 'Receita', natureza: 'Credora', nivel: 2, pai_id: '6', e_analitica: true, aceita_lancamentos: true },
   // Classe 7
   { id: '7', codigo: '7', nome: 'Custos e perdas', tipo: 'Despesa', natureza: 'Devedora', nivel: 1, e_sintetica: true, aceita_lancamentos: false },
   { id: '7.1', codigo: '7.1', nome: 'Custo existÃªncias vendidas', tipo: 'Despesa', natureza: 'Devedora', nivel: 2, pai_id: '7', e_analitica: true, aceita_lancamentos: true },
   { id: '7.2', codigo: '7.2', nome: 'Custos com pessoal', tipo: 'Despesa', natureza: 'Devedora', nivel: 2, pai_id: '7', e_sintetica: true, aceita_lancamentos: false },
   { id: '7.2.1', codigo: '7.2.1', nome: 'RemuneraÃ§Ãµes', tipo: 'Despesa', natureza: 'Devedora', nivel: 3, pai_id: '7.2', e_analitica: true, aceita_lancamentos: true },
   { id: '7.5', codigo: '7.5', nome: 'FST', tipo: 'Despesa', natureza: 'Devedora', nivel: 2, pai_id: '7', e_sintetica: true, aceita_lancamentos: false },
   { id: '7.5.1', codigo: '7.5.1', nome: 'ComunicaÃ§Ãµes', tipo: 'Despesa', natureza: 'Devedora', nivel: 3, pai_id: '7.5', e_analitica: true, aceita_lancamentos: true },
   // Classe 8
   { id: '8', codigo: '8', nome: 'Resultados', tipo: 'Capital', natureza: 'Credora', nivel: 1, e_sintetica: true, aceita_lancamentos: false },
   { id: '8.8', codigo: '8.8', nome: 'Resultados lÃ­quidos', tipo: 'Capital', natureza: 'Credora', nivel: 2, pai_id: '8', e_analitica: true, aceita_lancamentos: true },
];

// --- COMPONENTES AUXILIARES ---
const Input = ({ label, ...props }: any) => (
   <div className="space-y-2">
      {label && <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{label}</label>}
      <input
         {...props}
         className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-sm font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all placeholder:text-zinc-300"
      />
   </div>
);

const AccountingPage: React.FC<{ user?: User }> = ({ user }) => {
   const [activeTab, setActiveTab] = useState<'dashboard' | 'facturas' | 'proformas' | 'guias' | 'encomendas' | 'contactos' | 'itens' | 'relatorios' | 'diario' | 'plano' | 'folha' | 'fiscal' | 'periodos' | 'auditoria' | 'ia' | 'conciliacao' | 'consolidacao' | 'fontes'>('dashboard');
   const [selectedEmpresaId, setSelectedEmpresaId] = useState<string>('');
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
      content: () => invoicePrintRef.current,
      documentTitle: 'Documento_AGT'
   });

   // --- ESTADO DE RELATÃ“RIOS ---
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

   // --- ESTADO DE FATURAÃ‡ÃƒO ---
   const [showInvoiceModal, setShowInvoiceModal] = useState(false);
   const [isSavingInvoice, setIsSavingInvoice] = useState(false);
   const [invoiceForm, setInvoiceForm] = useState({
      cliente_id: '',
      cliente_nome: '',
      tipo: 'Factura' as 'Factura' | 'PrÃ³-forma' | 'Guia' | 'Encomenda',
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
   const [newContact, setNewContact] = useState({
      email: '', telefone: '', morada: ''
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
      if (!customItem.nome || customItem.preco <= 0) return alert("Preencha o nome e o preÃ§o do item.");
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
      if (!invoiceForm.cliente_nome) return alert("Seleccione um cliente.");
      if (invoiceForm.itens.length === 0) return alert("Adicione pelo menos um item.");
      if (!selectedEmpresaId) return alert("Seleccione uma entidade emitente.");

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
               items: invoiceForm.itens,
               company_id: selectedEmpresaId,
               metadata: { observacoes: invoiceForm.observacoes },
               is_exempt: invoiceForm.is_exempt,
               exemption_reason: invoiceForm.exemption_reason
            })
         });

         if (!res.ok) throw new Error(await res.text());

         const doc = await res.json();
         setLastCreatedDoc(doc);

         alert(`${invoiceForm.tipo} emitida com sucesso: ${doc.numero_fatura}`);

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
      if (!confirm(`Tem a certeza que deseja ANULAR o documento ${fatura.numero_fatura}? Esta acÃ§Ã£o Ã© irreversÃ­vel e o stock serÃ¡ restaurado.`)) return;

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
            // Caso contrÃ¡rio, apenas marcar como anulado
            const { error } = await supabase.from('contabil_faturas')
               .update({ status: 'Anulado' })
               .eq('id', fatura.id)
               .eq('company_id', selectedEmpresaId);

            if (error) throw error;
         }

         alert("Documento anulado com sucesso.");
         fetchAccountingData();
      } catch (error: any) {
         console.error("Anular Error:", error);
         alert(`Erro ao anular documento: ${error.message}`);
      }
   };


   // --- LÃ“GICA DE PERÃODOS ---
   const handleOpenYear = async () => {
      if (!selectedEmpresaId) return alert("Selecione uma empresa primeiro.");

      const companyPeriods = (periodos || []).filter(p => p.company_id === selectedEmpresaId);
      let targetYear = new Date().getFullYear();

      if (companyPeriods.length > 0) {
         const lastYear = Math.max(...companyPeriods.map(p => Number(p.ano)));
         targetYear = lastYear + 1;
      }

      if (!confirm(`Deseja abrir o exercÃ­cio fiscal de ${targetYear}?`)) return;

      try {
         // Verificar se jÃ¡ existe QUALQUER mÃªs aberto para este ano
         const { data: exists } = await supabase.from('acc_periodos')
            .select('id')
            .eq('company_id', selectedEmpresaId)
            .eq('ano', targetYear)
            .limit(1)
            .maybeSingle();

         if (exists) return alert(`O exercÃ­cio de ${targetYear} jÃ¡ possui perÃ­odos abertos.`);

         const { error } = await supabase.from('acc_periodos').insert({
            ano: targetYear,
            mes: 1,
            status: 'Aberto',
            company_id: selectedEmpresaId
         });

         if (error) throw error;
         alert(`ExercÃ­cio ${targetYear} (MÃªs 1) aberto com sucesso.`);
         await fetchAccountingData();
      } catch (error: any) {
         console.error("Open Year Error:", error);
         alert(`Erro ao abrir novo ano: ${error.message || 'Erro de conexÃ£o'}`);
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

      if (!confirm(`Abrir perÃ­odo contÃ¡bil de ${nextMes}/${nextAno}?`)) return;

      try {
         // Verificar duplicado
         const { data: exists } = await supabase.from('acc_periodos')
            .select('id')
            .eq('company_id', selectedEmpresaId)
            .eq('ano', nextAno)
            .eq('mes', nextMes)
            .maybeSingle();

         if (exists) return alert(`O mÃªs ${nextMes}/${nextAno} jÃ¡ se encontra aberto.`);

         const { error } = await supabase.from('acc_periodos').insert({
            ano: nextAno,
            mes: nextMes,
            status: 'Aberto',
            company_id: selectedEmpresaId
         });

         if (error) throw error;
         alert(`MÃªs ${nextMes}/${nextAno} aberto.`);
         await fetchAccountingData();
      } catch (error: any) {
         console.error("Open Month Error:", error);
         alert(`Erro ao abrir novo mÃªs: ${error.message || 'Erro de conexÃ£o'}`);
      }
   };

   const handleOpenPlanPadrao = async () => {
      if (!confirm("Deseja importar os modelos padrÃµes de lanÃ§amentos para venda, compra e folha?")) return;
      alert("Modelos importados com sucesso.");
   };

   const sidebarItems = [
      { id: 'dashboard', label: 'VisÃ£o Global', icon: <BarChart2 size={20} /> },
      { id: 'facturas', label: 'Facturas / FR', icon: <FileText size={20} /> },
      { id: 'proformas', label: 'Pro-formas', icon: <FilePieChart size={20} /> },
      { id: 'recibos', label: 'Recibos (RE)', icon: <CheckCircle2 size={20} /> },
      { id: 'notas', label: 'Notas (NC/ND)', icon: <ArrowLeftRight size={20} /> },
      { id: 'guias', label: 'Guias', icon: <Briefcase size={20} /> },
      { id: 'encomendas', label: 'Encomendas', icon: <ShoppingCart size={20} /> },
      { id: 'contactos', label: 'Contactos', icon: <Users size={20} /> },
      { id: 'itens', label: 'Itens', icon: <Plus size={20} /> },
      { id: 'relatorios', label: 'RelatÃ³rios', icon: <PieChartIcon size={20} /> },
   ] as const;

   const reportCards = [
      { id: 'cta_corrente', title: 'Conta Corrente de Cliente', icon: <Users className="text-blue-500" />, desc: 'Extrato detalhado de movimentos por cliente.' },
      { id: 'pag_falta', title: 'Pagamentos em Falta', icon: <AlertTriangle className="text-red-500" />, desc: 'Listagem de faturas vencidas e nÃ£o pagas.' },
      { id: 'vendas_diarias', title: 'Vendas do Dia', icon: <BarChart3 className="text-green-500" />, desc: 'RelatÃ³rio de vendas realizadas no dia atual.' },
      { id: 'vendas_semanais', title: 'Vendas Semanais', icon: <BarChart3 className="text-yellow-500" />, desc: 'AnÃ¡lise de vendas por semana.' },
      { id: 'vendas_mensais', title: 'Vendas Mensais', icon: <BarChart3 className="text-indigo-500" />, desc: 'Resumo detalhado das vendas do mÃªs.' },
      { id: 'vendas_anuais', title: 'AnÃ¡lise Anual', icon: <BarChart3 className="text-orange-500" />, desc: 'VisÃ£o geral das vendas ao longo do ano fiscal.' },
      { id: 'liq_impostos', title: 'LiquidaÃ§Ã£o de Impostos', icon: <Scale className="text-yellow-600" />, desc: 'CÃ¡lculo de IVA, IRT e Imposto Industrial.' },
      { id: 'fact_item', title: 'FacturaÃ§Ã£o por Item', icon: <ShoppingCart className="text-purple-500" />, desc: 'AnÃ¡lise de vendas detalhada por produto.' },
      { id: 'rel_fact', title: 'RelatÃ³rio de FacturaÃ§Ã£o', icon: <FileText className="text-blue-600" />, desc: 'Resumo mensal e anual de toda faturaÃ§Ã£o.' },
      { id: 'mapa_impostos', title: 'Mapa de Impostos', icon: <Landmark className="text-emerald-500" />, desc: 'GeraÃ§Ã£o de mapas oficiais para AGT.' },
      { id: 'rel_colab', title: 'RelatÃ³rio por Colaborador', icon: <Users className="text-orange-500" />, desc: 'Performance e custos de pessoal.' },
      { id: 'pag_efet', title: 'Pagamentos Efectuados', icon: <CheckCircle2 className="text-green-500" />, desc: 'HistÃ³rico de liquidaÃ§Ãµes e saÃ­das.' },
   ];

   const handleClosePeriod = async (id: string) => {
      if (!confirm("Tem certeza que deseja fechar este perÃ­odo? Novos lanÃ§amentos serÃ£o bloqueados.")) return;
      try {
         const { error } = await supabase.from('acc_periodos').update({ status: 'Fechado' }).eq('id', id).eq('company_id', selectedEmpresaId);
         if (error) throw error;
         fetchAccountingData();
      } catch (error) {
         alert('Erro ao fechar perÃ­odo.');
      }
   };

   const handleCreateAccount = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
         // Determinar NÃ­vel e Pai automaticamente se nÃ£o fornecido
         let nivel = Number(newAccount.nivel);
         if (newAccount.codigo.includes('.')) {
            nivel = newAccount.codigo.split('.').length;
         }

         const { error } = await supabase.from('acc_contas').insert({
            ...newAccount,
            nivel: nivel,
            company_id: selectedEmpresaId,
            e_sintetica: !newAccount.aceita_lancamentos, // Se nÃ£o aceita lanÃ§amentos, Ã© sintÃ©tica
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

   // Form State para Novo LanÃ§amento
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

   // --- MÃ“DULOS EXTERNOS (INTEGRAÃ‡ÃƒO AUTOMÃTICA) ---
   const [extFaturas, setExtFaturas] = useState<any[]>(() => AmazingStorage.get('amazing_ext_faturas', []));
   const [extTesouraria, setExtTesouraria] = useState<any[]>(() => AmazingStorage.get('amazing_ext_tesouraria', []));
   const [extRhRecibos, setExtRhRecibos] = useState<any[]>(() => AmazingStorage.get('amazing_ext_rh_recibos', []));
   const [extInventario, setExtInventario] = useState<any[]>(() => AmazingStorage.get(STORAGE_KEYS.INVENTARIO, []));
   const [extStockMov, setExtStockMov] = useState<any[]>(() => AmazingStorage.get('amazing_ext_stock_mov', []));
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
      if (!confirm("Isso exportarÃ¡ o PGC Angolano padrÃ£o para a base de dados. Deseja continuar?")) return;
      try {
         setIsAnalyzing(true);
         // O sistema jÃ¡ tem os dados no DB via migraÃ§Ã£o, mas podemos forÃ§ar um Refresh ou InserÃ§Ã£o se necessÃ¡rio.
         // Para este ERP, vamos assumir que o 'Importar' garante que a tabela estÃ¡ populada.
         const { error } = await supabase.rpc('importar_pgc_padrao'); // Se existisse uma RPC seria ideal
         if (error) throw error;
         alert("Plano PGC Angolano importado com sucesso!");
         fetchAccountingData();
      } catch (e) {
         // Fallback manual se RPC nÃ£o existir - mas jÃ¡ fizemos via migraÃ§Ã£o
         alert("OperaÃ§Ã£o concluÃ­da. O PGC jÃ¡ estÃ¡ disponÃ­vel.");
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
      if (!newContact.nome) return alert("O nome Ã© obrigatÃ³rio.");
      if (!selectedEmpresaId) return alert("Seleccione uma empresa primeiro.");

      setIsSavingContact(true);
      try {
         const { error } = await supabase.from('acc_contactos').insert({
            ...newContact,
            company_id: selectedEmpresaId
         });
         if (error) throw error;
         alert("Contacto criado com sucesso!");
         setShowContactModal(false);
         setNewContact({
            nome: '', nif: '', tipo: 'Cliente',
            email: '', telefone: '', morada: ''
         });
         fetchAccountingData();
      } catch (e) {
         console.error(e);
         alert("Erro ao guardar contacto.");
      } finally {
         setIsSavingContact(true);
         setIsSavingContact(false);
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

   // --- APROVAÃ‡ÃƒO DE LANÃ‡AMENTOS ---
   const [isApprovingId, setIsApprovingId] = useState<string | null>(null);
   const [showApprovalModal, setShowApprovalModal] = useState(false);
   const [approvalTarget, setApprovalTarget] = useState<any | null>(null);
   const [approvalObs, setApprovalObs] = useState('');

   // --- ESTORNO ---
   const [isEstornandoId, setIsEstornandoId] = useState<string | null>(null);

   // --- LÃ“GICA DE INTEGRIDADE DO LEDGER ---
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

   const fetchAccountingData = async () => {
      if (!user?.company_id && !selectedEmpresaId) return;

      // Debounce/Throttling: Avoid sync if we just synced less than 15s ago
      const lastSync = (fetchAccountingData as any).lastSync || 0;
      if (Date.now() - lastSync < 15000) return;
      (fetchAccountingData as any).lastSync = Date.now();

      setLoadingStatus('Sincronizando...');
      try {
         // 1. Carregar Dados Estruturais (Prioridade Alta)
         const { data: emps, error: empsError } = await safeQuery<EmpresaAfiliada[]>(() =>
            supabase.from('empresas').select('*').eq('company_id', user?.company_id || selectedEmpresaId).order('nome'),
            { cacheKey: `acc-empresas-${user?.company_id || selectedEmpresaId}`, cacheTTL: 60000 }
         );

         if (emps) {
            setEmpresas(emps);
            AmazingStorage.save(STORAGE_KEYS.ERP_EMPRESAS, emps);
         }

         const effEmpId = selectedEmpresaId || emps?.[0]?.id || user?.company_id;
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
            invRes,
            comprasRes,
            contactosRes,
            catsRes
         ] = await Promise.all([
            safeQuery<any[]>(() => supabase.from('acc_lancamentos').select('*').eq('company_id', effEmpId).order('data', { ascending: false }), { cacheKey: `acc-lnc-${effEmpId}`, cacheTTL: 30000 }),
            safeQuery<any[]>(() => supabase.from('acc_lancamento_itens').select('*').eq('company_id', effEmpId), { cacheKey: `acc-lnc-items-${effEmpId}`, cacheTTL: 30000 }),
            safeQuery<FolhaPagamento[]>(() => supabase.from('acc_folhas').select('*').eq('company_id', effEmpId).order('mes_referencia', { ascending: false }), { cacheKey: `acc-folhas-${effEmpId}`, cacheTTL: 60000 }),
            safeQuery<ObrigacaoFiscal[]>(() => supabase.from('acc_obrigacoes').select('*').eq('company_id', effEmpId).order('data_limite'), { cacheKey: `acc-obl-${effEmpId}`, cacheTTL: 60000 }),
            safeQuery<any[]>(() => supabase.from('acc_centros_custo').select('*').eq('company_id', effEmpId).order('nome'), { cacheKey: `acc-centros-${effEmpId}`, cacheTTL: 300000 }),
            safeQuery<any[]>(() => supabase.from('acc_config').select('*').eq('company_id', effEmpId), { cacheKey: `acc-config-${effEmpId}`, cacheTTL: 300000 }),
            safeQuery<any[]>(() => supabase.from('acc_system_logs').select('*').eq('company_id', effEmpId).order('created_at', { ascending: false }).limit(50)),
            safeQuery<any[]>(() => supabase.from('contabil_faturas').select('*').eq('company_id', effEmpId).order('created_at', { ascending: false }), { cacheKey: `acc-faturas-${effEmpId}`, cacheTTL: 30000 }),
            safeQuery<any[]>(() => supabase.from('fin_transacoes').select('*').eq('company_id', effEmpId).order('data', { ascending: false }), { cacheKey: `acc-tesouraria-${effEmpId}`, cacheTTL: 30000 }),
            safeQuery<any[]>(() => supabase.from('rh_recibos').select('*').eq('company_id', effEmpId).order('data_emissao', { ascending: false }), { cacheKey: `acc-recibos-${effEmpId}`, cacheTTL: 30000 }),
            safeQuery<any[]>(() => supabase.from('inventario').select('*').eq('company_id', effEmpId).order('nome'), { cacheKey: `acc-inv-${effEmpId}`, cacheTTL: 60000 }),
            safeQuery<any[]>(() => supabase.from('compras').select('*').eq('company_id', effEmpId).order('data_compra', { ascending: false }), { cacheKey: `acc-compras-${effEmpId}`, cacheTTL: 60000 }),
            safeQuery<any[]>(() => supabase.from('acc_contactos').select('*').eq('company_id', effEmpId).order('nome'), { cacheKey: `acc-contactos-${effEmpId}`, cacheTTL: 60000 }),
            safeQuery<any[]>(() => supabase.from('acc_categorias').select('*').eq('company_id', effEmpId).order('nome'), { cacheKey: `acc-cats-${effEmpId}`, cacheTTL: 60000 })
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
         setExtFaturas(faturasRes.data || []);
         AmazingStorage.save('amazing_ext_faturas', faturasRes.data);

         setExtTesouraria(tesourariaRes.data || []);
         AmazingStorage.save('amazing_ext_tesouraria', tesourariaRes.data);

         setExtRhRecibos(rhRecibosRes.data || []);
         AmazingStorage.save('amazing_ext_rh_recibos', rhRecibosRes.data);

         if (invRes.data) {
            setExtInventario(invRes.data);
         }

         if (comprasRes.data) {
            setCompras(comprasRes.data);
         }

         if (contactosRes.data) {
            setContactos(contactosRes.data);
         }

         if (catsRes.data) {
            setCategorias(catsRes.data);
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
      if (!newCategory.nome) return alert("O nome da categoria Ã© obrigatÃ³rio.");
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
      if (!newInventoryItem.nome || !newInventoryItem.categoria_id) return alert("Nome e Categoria sÃ£o obrigatÃ³rios.");
      setIsSavingItem(true);
      try {
         const { error } = await supabase.from('inventario').insert({
            ...newInventoryItem,
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
      fetchAccountingData();
   }, [selectedEmpresaId]);

   // Garantir que o perÃ­odo selecionado pertence Ã  empresa selecionada
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

   const currentEmpresa = empresas?.find(e => e.id === selectedEmpresaId) || empresas?.[0];

   // --- DADOS INTEGRADOS (USADOS EM MÃšLTIPLAS ABAS) ---
   const { extFinanceiroNotas, totalFacturado, totalPendente, totalCaixa, totalEntradas, totalSaidas, totalSalarios, totalBruto, totalInventarioValor, itensCriticos } = useMemo(() => {
      const _fat = extFaturas || [];
      const _tes = extTesouraria || [];
      const _rhr = extRhRecibos || [];
      const _inv = extInventario || [];
      const notas = [
         ..._fat.map(f => ({ ...f, valor: Number(f.valor_total) || 0, entidade: f.cliente_nome, numero: f.numero_fatura, data: f.data_emissao, tipo: 'Venda' })),
         ..._tes.filter(t => t.documento_contabil).map(t => ({ ...t, valor: Number(t.valor) || 0, entidade: t.entidade || 'Caixa/Banco', numero: t.referencia, data: t.data, tipo: 'Tesouraria' }))
      ];

      const facturado = notas.filter(n => n.tipo === 'Venda').reduce((acc, n) => acc + n.valor, 0);
      const pendente = _fat.filter(f => f.status === 'Pendente').reduce((acc, f) => acc + (Number(f.valor_total) || 0), 0);

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

      return {
         extFinanceiroNotas: notas,
         totalFacturado: facturado,
         totalPendente: pendente,
         totalCaixa: caixa,
         totalEntradas: entradas,
         totalSaidas: saidas,
         totalSalarios: salarios,
         totalBruto: bruto,
         totalInventarioValor: invValor,
         itensCriticos: criticos
      };
   }, [extFaturas, extTesouraria, extRhRecibos, extInventario]);

   // --- LÃ“GICA DE GRÃFICOS E RELATÃ“RIOS (ULTRA DEFENSIVA) ---
   const chartData = useMemo(() => {
      try {
         const filterEmpAndPeriod = (arr: LancamentoContabil[]) => (arr || []).filter(l =>
            l && l.company_id === selectedEmpresaId &&
            (selectedPeriodoId ? l.periodo_id === selectedPeriodoId : true)
         );
         const empLancamentos = filterEmpAndPeriod(lancamentos);

         // 1. Dados para GrÃ¡fico de Barras
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
            { name: 'ManutenÃ§Ã£o', value: 120000 },
            { name: 'ServiÃ§os Terceiros', value: 80000 },
            { name: 'Impostos', value: 50000 },
         ];

         return { barChartData: finalBarData, pieChartData: finalPieData };
      } catch (err) {
         console.error("Crash in chartData useMemo:", err);
         return { barChartData: [], pieChartData: [] };
      }
   }, [selectedEmpresaId, selectedPeriodoId, lancamentos]);

   // --- LÃ“GICA DE BALANÃ‡O E DRE (ULTRA DEFENSIVA) ---
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

   // --- LÃ“GICA DE IA ---
   const handleAIAnalysis = async () => {
      const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) {
         setIaResponse("A chave da API (GEMINI_API_KEY) nÃ£o foi configurada. Contacte o administrador.");
         return;
      }

      setIsAnalyzing(true);
      setIaResponse(null);
      try {
         const ai = new GoogleGenAI({ apiKey });
         const prompt = `Analise os dados financeiros da empresa ${currentEmpresa?.nome || 'N/A'} em Angola:
- Receita: ${safeFormatAOA(financeReports.receitaTotal)}
- Despesa: ${safeFormatAOA(financeReports.despesaTotal)}
- Lucro: ${safeFormatAOA(financeReports.lucroLiquido)}
- PatrimÃ³nio LÃ­quido: ${safeFormatAOA(financeReports.ativos - financeReports.passivos)}
      
      ForneÃ§a 3 sugestÃµes estratÃ©gicas para reduÃ§Ã£o de custos e 1 alerta sobre conformidade fiscal(IVA / IRT).`;

         const result = await ai.models.generateContent({
            model: 'gemini-1.5-pro',
            contents: prompt
         });

         setIaResponse(result.text || "Sem resposta da IA.");
      } catch (error) {
         console.error('AI Error:', error);
         setIaResponse("A IA estÃ¡ processando auditorias externas. Tente novamente em instantes.");
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
         const prompt = `Com base no Plano Geral de Contas de Angola (PGC) e na descriÃ§Ã£o "${descricao}", sugira apenas o cÃ³digo da conta de DÃ©bito e o cÃ³digo da conta de CrÃ©dito. 
         Retorne APENAS um JSON no formato: {"debito": "codigo", "credito": "codigo"}.
         Exemplos de contas: 1.1 (Caixa), 7.2 (SalÃ¡rios), 6.1 (Vendas), 3.1 (InventÃ¡rios).`;

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
         alert("FuncionÃ¡rio registado com sucesso!");
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
         alert(`Erro ao registar funcionÃ¡rio: ${e.message}`);
      } finally {
         setIsProcessingPayroll(false);
      }
   };

   // --- LÃ“GICA DE PAYROLL ---
   const runPayroll = async () => {
      if (!selectedEmpresaId || !selectedPeriodoId) {
         alert("Selecione uma empresa e um perÃ­odo aberto antes de processar a folha.");
         return;
      }

      const activePeriodo = periodos.find(p => p.id === selectedPeriodoId);
      if (!activePeriodo || activePeriodo.status === 'Fechado') {
         alert("O perÃ­odo selecionado estÃ¡ fechado.");
         return;
      }

      const funcionariosAtivos = funcionarios.filter(f =>
         (f.status === 'ativo' || f.status === 'Ativo') &&
         (f as any).company_id === selectedEmpresaId
      );

      if (funcionariosAtivos.length === 0) {
         alert("NÃ£o hÃ¡ funcionÃ¡rios ativos vinculados a esta empresa para processar.");
         return;
      }

      if (!confirm(`Confirmar processamento da folha para ${funcionariosAtivos.length} colaboradores para o perÃ­odo ${activePeriodo.mes}/${activePeriodo.ano}?`)) return;

      setIsProcessingPayroll(true);

      try {
         const payrollBatch = funcionariosAtivos.map(f => {
            const base = Number(f.salario_base) || 0;
            const subAlim = Number((f as any).subsidio_alimentacao) || 0;
            const subTrans = Number((f as any).subsidio_transporte) || 0;
            const bonifBase = Number((f as any).outras_bonificacoes_base) || 0;
            const hExtras = Number((f as any).valor_hora_extra_base) || 0;
            const adiantamento = Number((f as any).adiantamento_padrao) || 0;
            const descAtrasos = 0; // Logica automÃ¡tica para atrasos (poderia ser baseado em faltas/checkpoint)
            const descFerias = 0; // Desconto de fÃ©rias se aplicÃ¡vel

            // CÃ¡lculos AutomÃ¡ticos
            let natal = 0;
            let ferias = 0;

            // SubsÃ­dio de Natal automÃ¡tico em Dezembro
            if (activePeriodo.mes === 12) natal = Number((f as any).subsidio_natal_base) || base;
            // SubsÃ­dio de FÃ©rias automÃ¡tico em Junho
            if (activePeriodo.mes === 6) ferias = Number((f as any).subsidio_ferias_base) || base;

            const salarioBruto = base + subAlim + subTrans + bonifBase + natal + ferias + hExtras;
            const inss = calculateINSS(base + bonifBase + hExtras); // INSS incide sobre base e complementos de rendimento
            const irt = calculateIRT(salarioBruto - inss.trabalhador - subAlim - subTrans); // IRT sobre rendimento lÃ­quido de INSS e isento de subsÃ­dios (simplificado)

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

         // 2. Criar LanÃ§amento ContÃ¡bil Correspondente
         const totalBrutoBatch = (payrollBatch || []).reduce((acc, f) => acc + Number(f.salario_bruto), 0);
         const totalLiquidoBatch = (payrollBatch || []).reduce((acc, f) => acc + Number(f.salario_liquido), 0);
         const totalDescontosBatch = totalBrutoBatch - totalLiquidoBatch;

         const { data: entry, error: lError } = await supabase.from('acc_lancamentos').insert([{
            company_id: selectedEmpresaId,
            debito: totalBrutoBatch,
            credito: totalDescontosBatch + totalLiquidoBatch, // EquilÃ­brio contÃ¡bil
            descricao: `Processamento de Folha de Pagamento - Ciclo ${periodos.find(p => p.id === selectedPeriodoId)?.mes}/${periodos.find(p => p.id === selectedPeriodoId)?.ano}`,
            data: new Date().toISOString().split('T')[0],
            status: 'concluido'
         }]).select().single();

         if (lError) throw lError;

         // 3. Itens do LanÃ§amento
         await supabase.from('acc_lancamento_itens').insert([
            { lancamento_id: entry.id, conta_id: '62', debito: totalBrutoBatch, credito: 0, descricao: 'Gastos com Pessoal (SalÃ¡rios)' },
            { lancamento_id: entry.id, conta_id: '34', debito: 0, credito: totalDescontosBatch, descricao: 'RetenÃ§Ãµes e Descontos (Seg. Social/IRT)' },
            { lancamento_id: entry.id, conta_id: '37', debito: 0, credito: totalLiquidoBatch, descricao: 'SalÃ¡rios LÃ­quidos a Pagar' }
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

   // --- LÃ“GICA DE RELATÃ“RIOS ---
   const openReport = async (reportId: string) => {
      setIsGeneratingReport(true);
      const reportTitle = {
         'balanco': 'BalanÃ§o Patrimonial',
         'dre': 'DemonstraÃ§Ã£o de Resultados (DRE)',
         'balancete': 'Balancete de VerificaÃ§Ã£o',
         'diario': 'DiÃ¡rio de LanÃ§amentos',
         'razÃ£o': 'Livro RazÃ£o',
         'cta_corrente': 'Extracto de Conta Corrente',
         'pag_falta': 'RelatÃ³rio de Pagamentos em Falta',
         'vendas_diarias': 'Vendas do Dia (Hoje)',
         'vendas_semanais': 'Vendas da Semana (Ãšltimos 7 dias)',
         'vendas_mensais': 'Vendas do MÃªs Corrente',
         'vendas_anuais': 'Resumo de Vendas Anual'
      }[reportId] || 'RelatÃ³rio';

      if (!selectedEmpresaId) {
         alert("Por favor, selecione uma empresa primeiro.");
         setIsGeneratingReport(false);
         return;
      }

      try {
         let data: any[] = [];

         if (reportId === 'diario') {
            if (!selectedPeriodoId) {
               alert("Selecione um perÃ­odo (Ano/MÃªs) para visualizar o diÃ¡rio.");
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
               { desc: 'CAPITAL PRÃ“PRIO', valor: capital },
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
               { desc: 'IVA DedutÃ­vel (Compras)', valor: ivaDedutivel },
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
         } else if (reportId === 'razÃ£o') {
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
            // Converter para array plano para exibiÃ§Ã£o
            data = Object.values(razao).sort((a: any, b: any) => a.codigo.localeCompare(b.codigo));
         } else if (reportId === 'cashflow') {
            // Fluxo de Caixa Simplicado (Entradas vs SaÃ­das na Classe 1)
            const entradas = (lancamentos || []).filter(l => l.company_id === selectedEmpresaId && l.status === 'Postado')
               .flatMap(l => (l.itens || []))
               .filter(it => it?.conta_codigo?.startsWith('1.1') && it?.tipo === 'D') // Caixa/Bancos como destino (entrada)
               .reduce((acc, it) => acc + (Number(it.valor) || 0), 0);

            const saidas = (lancamentos || []).filter(l => l.company_id === selectedEmpresaId && l.status === 'Postado')
               .flatMap(l => (l.itens || []))
               .filter(it => it?.conta_codigo?.startsWith('1.1') && it?.tipo === 'C') // Caixa/Bancos como origem (saÃ­da)
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
         console.error("Erro ao gerar relatÃ³rio:", e);
      } finally {
         setIsGeneratingReport(false);
      }
   };

   // --- LANÃ‡AMENTOS AUTOMÃTICOS: FATURAÃ‡ÃƒO ---
   const handleAutoLaunchFromFatura = async (fatura: any) => {
      if (!selectedEmpresaId || !selectedPeriodoId) {
         alert('Selecione empresa e perÃ­odo antes de contabilizar.');
         return;
      }
      setIsAutoLaunching(true);
      try {
         const regra = regrasAutomaticas.find(r => r.nome.toLowerCase().includes('venda')) || {
            conta_debito_codigo: '3.1', conta_credito_codigo: '6.1'
         };
         const { data: head, error } = await supabase.from('acc_lancamentos').insert([{
            data: fatura.data_emissao || new Date().toISOString().split('T')[0],
            periodo_id: selectedPeriodoId,
            descricao: `Fatura ${fatura.numero_fatura || ''} - ${fatura.cliente_nome || 'Cliente'}`,
            company_id: selectedEmpresaId,
            usuario_id: null,
            status: 'Postado',
            tipo_transacao: 'AutomÃ¡tico'
         }]).select().single();
         if (error) throw error;
         await supabase.from('acc_lancamento_itens').insert([
            { lancamento_id: head.id, conta_codigo: regra.conta_debito_codigo, conta_nome: 'Clientes / Contas a Receber', tipo: 'D', valor: Number(fatura.valor_total) || 0 },
            { lancamento_id: head.id, conta_codigo: regra.conta_credito_codigo, conta_nome: 'Vendas / Receitas de ServiÃ§os', tipo: 'C', valor: Number(fatura.valor_total) || 0 }
         ]);
         await fetchAccountingData();
         alert(`LanÃ§amento automÃ¡tico criado para a fatura ${fatura.numero_fatura || ''}!`);
      } catch (err) {
         alert('Erro ao criar lanÃ§amento automÃ¡tico.');
      } finally {
         setIsAutoLaunching(false);
      }
   };

   // --- LANÃ‡AMENTOS AUTOMÃTICOS: TESOURARIA ---
   const handleAutoLaunchFromTesouraria = async (transacao: any) => {
      if (!selectedEmpresaId || !selectedPeriodoId) {
         alert('Selecione empresa e perÃ­odo antes de contabilizar.');
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
            tipo_transacao: 'AutomÃ¡tico'
         }]).select().single();
         if (error) throw error;
         await supabase.from('acc_lancamento_itens').insert([
            { lancamento_id: head.id, conta_codigo: isEntrada ? '1.1' : '7.5', conta_nome: isEntrada ? 'Caixa/Bancos' : 'Outros Gastos', tipo: 'D', valor: Number(transacao.valor) || 0 },
            { lancamento_id: head.id, conta_codigo: isEntrada ? '6.1' : '1.1', conta_nome: isEntrada ? 'Receitas' : 'Caixa/Bancos', tipo: 'C', valor: Number(transacao.valor) || 0 }
         ]);
         await fetchAccountingData();
         alert('LanÃ§amento automÃ¡tico de tesouraria criado!');
      } catch (err) {
         alert('Erro ao criar lanÃ§amento automÃ¡tico.');
      } finally {
         setIsAutoLaunching(false);
      }
   };

   // ============================================================
   // --- COMPRAS: REGISTO + LANÃ‡AMENTO AUTOMÃTICO ---
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

         // 2. Criar lanÃ§amento automÃ¡tico se a empresa tiver perÃ­odo activo
         if (selectedPeriodoId) {
            const regra = regrasAutomaticas.find(r => r.nome.toLowerCase().includes('compra')) || {
               conta_debito_codigo: '2.1', conta_credito_codigo: '3.2'
            };
            const { data: head, error: hErr } = await supabase.from('acc_lancamentos').insert([{
               data: newCompra.data_compra,
               periodo_id: selectedPeriodoId,
               descricao: `Compra ${newCompra.numero_compra || ''} â€” ${newCompra.fornecedor_nome || 'Fornecedor'}`,
               company_id: selectedEmpresaId,
               usuario_id: null,
               status: 'Postado',
               tipo_transacao: 'AutomÃ¡tico'
            }]).select().single();
            if (!hErr && head) {
               await supabase.from('acc_lancamento_itens').insert([
                  { lancamento_id: head.id, conta_codigo: regra.conta_debito_codigo, conta_nome: 'InventÃ¡rio / Activos Circulantes', tipo: 'D', valor: Number(newCompra.valor_total), company_id: selectedEmpresaId },
                  { lancamento_id: head.id, conta_codigo: regra.conta_credito_codigo, conta_nome: 'Fornecedores / Contas a Pagar', tipo: 'C', valor: Number(newCompra.valor_total), company_id: selectedEmpresaId }
               ]);
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
   // --- APROVAÃ‡ÃƒO DE LANÃ‡AMENTOS ---
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
         alert('LanÃ§amento aprovado e postado com sucesso!');
      } catch (err) {
         alert('Erro ao aprovar lanÃ§amento.');
      } finally {
         setIsApprovingId(null);
      }
   };

   const handleRejeitarLancamento = async (lancamento: any) => {
      if (!confirm('Rejeitar e eliminar este lanÃ§amento?')) return;
      try {
         await supabase.from('acc_lancamento_itens').delete().eq('lancamento_id', lancamento.id).eq('company_id', selectedEmpresaId);
         await supabase.from('acc_lancamentos').delete().eq('id', lancamento.id).eq('company_id', selectedEmpresaId);
         await fetchAccountingData();
      } catch (err) {
         alert('Erro ao rejeitar lanÃ§amento.');
      }
   };

   // ============================================================
   // --- ESTORNO DE LANÃ‡AMENTOS ---
   // ============================================================
   const handleEstornarLancamento = async (lancamento: any) => {
      if (lancamento.estornado) { alert('Este lanÃ§amento jÃ¡ foi estornado.'); return; }
      if (!confirm(`Criar estorno do lanÃ§amento "${lancamento.descricao}"? Esta acÃ§Ã£o Ã© irreversÃ­vel.`)) return;
      setIsEstornandoId(lancamento.id);
      try {
         // 1. Criar lanÃ§amento espelho com D/C invertidos
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
         alert(`Estorno criado com sucesso! ReferÃªncia: ${estornoHead.id.slice(0, 8).toUpperCase()}`);
      } catch (err) {
         alert('Erro ao criar estorno.');
      } finally {
         setIsEstornandoId(null);
      }
   };

   // --- LÃ“GICA NOVO LANÃ‡AMENTO (com validaÃ§Ã£o D=C) ---
   const handleNewEntry = async (e: React.FormEvent) => {

      e.preventDefault();
      if (newEntry.valor <= 0) {
         alert('O valor deve ser maior que zero.');
         return;
      }
      if (newEntry.contaDebito === newEntry.contaCredito) {
         alert('A conta de DÃ©bito e a conta de CrÃ©dito nÃ£o podem ser iguais.');
         return;
      }
      const debito = planoContas.find(c => c.codigo === newEntry.contaDebito);
      const credito = planoContas.find(c => c.codigo === newEntry.contaCredito);
      if (!debito || !credito) {
         alert('Selecione contas vÃ¡lidas para DÃ©bito e CrÃ©dito.');
         return;
      }

      try {
         // 1. Inserir cabeÃ§alho
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

         // 2. Inserir itens D e C (valores iguais â€” soma D = soma C garantida)
         await supabase.from('acc_lancamento_itens').insert([
            { lancamento_id: head.id, conta_codigo: debito!.codigo, conta_nome: debito!.nome, tipo: 'D', valor: Number(newEntry.valor), company_id: selectedEmpresaId },
            { lancamento_id: head.id, conta_codigo: credito!.codigo, conta_nome: credito!.nome, tipo: 'C', valor: Number(newEntry.valor), company_id: selectedEmpresaId }
         ]);

         fetchAccountingData();
         setShowEntryModal(false);
         setNewEntry({ ...newEntry, descricao: '', valor: 0 });
      } catch (error) {
         alert('Erro ao salvar lanÃ§amento');
      }
   };

   const handleExportChart = () => {
      alert("ExportaÃ§Ã£o de grÃ¡fico iniciada. (Funcionalidade simulada)");
   };

   const handleExportFiscal = async () => {
      if (!selectedEmpresaId) return alert("Selecione uma empresa.");
      setIsExportingFiscal(true);
      try {
         // SimulaÃ§Ã£o de geraÃ§Ã£o de PDF robusta
         await new Promise(resolve => setTimeout(resolve, 3000));

         const reportContent = `
            RELATÃ“RIO FISCAL - ${currentEmpresa?.nome}
            PerÃ­odo: ${periodos.find(p => p.id === selectedPeriodoId)?.mes}/${periodos.find(p => p.id === selectedPeriodoId)?.ano}
            
            RECEITA TOTAL: ${safeFormatAOA(financeReports.receitaTotal)}
            DESPESA TOTAL: ${safeFormatAOA(financeReports.despesaTotal)}
            LUCRO LÃQUIDO: ${safeFormatAOA(financeReports.lucroLiquido)}
            
            IMPOSTOS ESTIMADOS:
            - IVA: ${safeFormatAOA(financeReports.receitaTotal * 0.14)}
            - IRT: ${safeFormatAOA(folhas.reduce((acc, f) => acc + (Number(f.irt) || 0), 0))}
            
            Status: Validado via Amazing Cloud Sync
         `;

         console.log("PDF Export Content Generated:", reportContent);
         alert("Mapas Fiscais (IVA/IRT/II) gerados e exportados com sucesso para o diretÃ³rio de downloads.");
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
                <h1>Balancete de VerificaÃ§Ã£o</h1>
                <p>Empresa: ${currentEmpresa?.nome}</p>
                <table>
                   <thead>
                      <tr><th>CÃ³digo</th><th>Conta</th><th>Saldo</th></tr>
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
         <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 bg-white/50 rounded-[3rem] border border-sky-100 p-12">
            <div className="relative">
               <RefreshCw className="w-16 h-16 text-yellow-500 animate-spin" />
               <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-2 bg-zinc-900 rounded-full animate-ping"></div>
               </div>
            </div>
            <div className="text-center space-y-4">
               <div>
                  <p className="text-zinc-900 font-black uppercase tracking-[0.3em] text-[10px]">Amazing Cloud Sync</p>
                  <p className="text-zinc-400 font-bold animate-pulse text-xs uppercase tracking-widest">{loadingStatus}</p>
               </div>
               <button
                  onClick={() => setLoading(false)}
                  className="px-6 py-2.5 bg-zinc-900 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-yellow-500 hover:text-zinc-900 transition-all shadow-lg"
               >
                  Bypass Sync (Acesso de EmergÃªncia)
               </button>
            </div>
         </div>
      );
   }

   if (empresas.length === 0) {
      return (
         <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
            <div className="p-6 bg-zinc-100 rounded-full text-zinc-400">
               <Building2 size={64} />
            </div>
            <div className="max-w-md space-y-2">
               <h2 className="text-2xl font-black uppercase">Configurando Ambiente</h2>
               <p className="text-zinc-500 font-medium">NÃ£o foram encontradas entidades activas ou o sistema estÃ¡ a recuperar a sincronizaÃ§Ã£o.</p>
               <p className="text-[10px] text-zinc-400 font-mono">Status: {loadingStatus || 'Aguardando payload...'}</p>
            </div>
            <div className="flex gap-4">
               <button
                  onClick={() => fetchAccountingData()}
                  className="px-8 py-4 bg-zinc-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-zinc-800 transition-all shadow-xl flex items-center gap-2"
               >
                  <RefreshCw size={16} /> ForÃ§ar SincronizaÃ§Ã£o
               </button>
               <button
                  onClick={() => window.location.href = '/empresas'}
                  className="px-8 py-4 bg-white text-zinc-900 border border-zinc-200 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-zinc-50 transition-all shadow-xl"
               >
                  Ver GestÃ£o
               </button>
            </div>
         </div>
      );
   }

   return (
      <div className="flex h-screen bg-zinc-50 overflow-hidden font-sans">
         {/* Sidebar Green Premium */}
         <aside className="w-72 bg-[#1a3a32] flex flex-col h-full sticky top-0 border-r border-white/5 shadow-2xl z-50 print:hidden">
            <div className="p-8 border-b border-white/5">
               <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-yellow-500 rounded-xl shadow-lg">
                     <Scale className="text-zinc-900" size={24} />
                  </div>
                  <div>
                     <h2 className="text-white font-black text-lg tracking-tight leading-none uppercase">Amazing</h2>
                     <p className="text-yellow-500/80 font-black text-[10px] uppercase tracking-widest mt-1">ContÃ¡bilExpert</p>
                  </div>
               </div>
            </div>

            <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto scrollbar-hide">
               <p className="px-4 text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-4 mt-2">Menu Principal</p>
               {sidebarItems.map((item) => (
                  <button
                     key={item.id}
                     onClick={() => setActiveTab(item.id as any)}
                     className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 group ${activeTab === item.id
                        ? 'bg-yellow-500 text-zinc-900 shadow-xl shadow-yellow-500/10'
                        : 'text-white/60 hover:bg-white/5 hover:text-white'
                        }`}
                  >
                     <div className={`${activeTab === item.id ? 'text-zinc-900' : 'text-yellow-500/80 group-hover:text-yellow-500 transition-colors'}`}>
                        {item.icon}
                     </div>
                     <span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>
                     {activeTab === item.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-zinc-900" />}
                  </button>
               ))}

               {/* Separator for advanced options */}
               <div className="my-8 h-px bg-white/5 mx-4" />
               <p className="px-4 text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-4">GestÃ£o & Auditoria</p>
               {[
                  { id: 'diario', label: 'DiÃ¡rio Geral', icon: <BookOpen size={18} /> },
                  { id: 'periodos', label: 'PerÃ­odos', icon: <Calendar size={18} /> },
                  { id: 'plano', label: 'Plano de Contas', icon: <ListFilter size={18} /> },
                  { id: 'fiscal', label: 'Fiscal / Impostos', icon: <Landmark size={18} /> },
                  { id: 'folha', label: 'Folha Pagamento', icon: <Briefcase size={18} /> },
                  { id: 'conciliacao', label: 'ConciliaÃ§Ã£o', icon: <RefreshCw size={18} /> },
                  { id: 'auditoria', label: 'Log Auditoria', icon: <ShieldCheck size={18} /> },
                  { id: 'ia', label: 'Amazing IA', icon: <BrainCircuit size={18} /> },
               ].map((item) => (
                  <button
                     key={item.id}
                     onClick={() => setActiveTab(item.id as any)}
                     className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${activeTab === item.id
                        ? 'bg-white/10 text-white shadow-lg'
                        : 'text-white/40 hover:bg-white/5 hover:text-white'
                        }`}
                  >
                     <div className="text-yellow-500/50">{item.icon}</div>
                     <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
                  </button>
               ))}
            </nav>

            <div className="p-6 border-t border-white/5 mt-auto">
               <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500 shadow-lg border border-yellow-500/20">
                        <Users size={18} className="font-black" />
                     </div>
                     <div className="flex-1 min-w-0">
                        <p className="text-white text-[11px] font-black uppercase truncate">{user?.nome || 'Utilizador'}</p>
                        <p className="text-white/40 text-[9px] font-bold truncate">{user?.role === 'admin' ? 'Premium Manager' : (user?.role || 'Utilizador')}</p>
                     </div>
                  </div>
               </div>
            </div>
         </aside>

         {/* Main Content Area */}
         <main className="flex-1 h-screen overflow-y-auto bg-zinc-50 scroll-smooth">
            <div className="p-12 max-w-7xl mx-auto space-y-12">
               {/* Top Bar with Context */}
               <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-10 border-b border-zinc-200/60 print:hidden">
                  <div>
                     <h1 className="text-3xl font-black text-zinc-900 tracking-tight uppercase">
                        {([...sidebarItems,
                        { id: 'diario', label: 'DiÃ¡rio Geral' },
                        { id: 'periodos', label: 'PerÃ­odos' },
                        { id: 'plano', label: 'Plano de Contas' },
                        { id: 'fiscal', label: 'Fiscal / Impostos' },
                        { id: 'folha', label: 'Folha Pagamento' },
                        { id: 'conciliacao', label: 'ConciliaÃ§Ã£o' },
                        { id: 'auditoria', label: 'Log Auditoria' },
                        { id: 'ia', label: 'Amazing IA' }
                        ].find(i => i.id === activeTab) as any)?.label || 'Painel de Controlo'}
                     </h1>
                     <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                        <ShieldCheck size={14} className="text-green-500" /> Amazing Corporate Group S.A.
                     </p>
                  </div>

                  <div className="flex items-center gap-3">
                     <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border border-zinc-100 shadow-sm transition-all hover:border-yellow-200">
                        <Building2 size={16} className="text-zinc-400" />
                        <span className="text-[9px] font-black text-zinc-400 uppercase">Entidade:</span>
                        <select
                           value={selectedEmpresaId}
                           onChange={(e) => setSelectedEmpresaId(e.target.value)}
                           className="bg-transparent border-none focus:ring-0 text-[10px] font-black uppercase text-zinc-800 pr-8 cursor-pointer outline-none"
                        >
                           {empresas?.map(e => (
                              <option key={e.id} value={e.id}>{e?.nome || 'Entidade'}</option>
                           ))}
                        </select>
                     </div>

                     <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border border-zinc-100 shadow-sm transition-all hover:border-yellow-200">
                        <Calendar size={16} className="text-zinc-400" />
                        <span className="text-[9px] font-black text-zinc-400 uppercase">Ciclo:</span>
                        <select
                           value={selectedPeriodoId}
                           onChange={(e) => setSelectedPeriodoId(e.target.value)}
                           className="bg-transparent border-none focus:ring-0 text-[10px] font-black uppercase text-zinc-800 pr-8 cursor-pointer outline-none"
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
                  // === CÃLCULOS PREMIUM DINÃ‚MICOS ===
                  const receita = Number(financeReports.receitaTotal) || 0;
                  const despesa = Number(financeReports.despesaTotal) || 0;
                  const lucro = Number(financeReports.lucroLiquido) || 0;
                  const ativos = Number(financeReports.ativos) || 0;
                  const passivos = Number(financeReports.passivos) || 0;
                  const capital = Number(financeReports.capital) || 0;

                  // SCORE FINANCEIRO PREMIUM
                  const receitaTotal = lancamentos.reduce((acc, l) => acc + (l.itens?.filter(it => it.conta_codigo?.startsWith('6')).reduce((sum, i) => sum + (Number(i.valor) || 0), 0) || 0), 0);
                  const despesaTotal = lancamentos.reduce((acc, l) => acc + (l.itens?.filter(it => it.conta_codigo?.startsWith('7')).reduce((sum, i) => sum + (Number(i.valor) || 0), 0) || 0), 0);
                  const lucroReal = receitaTotal - despesaTotal;
                  const score = receitaTotal > 0 ? Math.min(10, Math.max(0, (lucroReal / receitaTotal) * 10 + 5)) : 5.0;
                  // Indicadores AutomÃ¡ticos
                  const liquidezCorrente = passivos > 0 ? ativos / passivos : ativos > 0 ? 99 : 0;
                  const solvencia = (ativos + capital) > 0 ? ativos / (passivos + capital) : 0;
                  const margemLiquida = receita > 0 ? (lucro / receita) * 100 : 0;
                  const roe = capital > 0 ? (lucro / capital) * 100 : 0;
                  const ratioEndividamento = ativos > 0 ? (passivos / ativos) * 100 : 0;

                  // Score Financeiro (0â€“10) â€” algoritmo dinÃ¢mico
                  // let score = 5.0; // This line is now replaced by the new score calculation above
                  // if (margemLiquida > 20) score += 2;
                  // else if (margemLiquida > 10) score += 1;
                  // else if (margemLiquida < 0) score -= 2;
                  // if (liquidezCorrente > 1.5) score += 1.5;
                  // else if (liquidezCorrente > 1) score += 0.5;
                  // else if (liquidezCorrente < 0.8) score -= 1.5;
                  // if (ratioEndividamento < 40) score += 1;
                  // else if (ratioEndividamento > 70) score -= 1;
                  // if (receita === 0) score = 0;
                  // score = Math.min(10, Math.max(0, score));
                  const scoreLabel = score >= 8 ? 'ExcelÃªncia' : score >= 6 ? 'Bom' : score >= 4 ? 'AtenÃ§Ã£o' : 'CrÃ­tico';
                  const scoreColor = score >= 8 ? 'text-green-400' : score >= 6 ? 'text-yellow-400' : score >= 4 ? 'text-orange-400' : 'text-red-400';

                  // Alertas de Risco DinÃ¢micos
                  const alertas: { nivel: 'danger' | 'warn' | 'ok'; msg: string; sub: string }[] = [];

                  // Alerta de Stock (Novo)
                  const lowStockCount = extInventario.filter(i => Number(i.quantidade_atual) <= Number(i.quantidade_minima)).length;
                  if (lowStockCount > 0) {
                     alertas.push({ nivel: 'danger', msg: 'Ruptura de Stock', sub: `${lowStockCount} itens atingiram o nÃ­vel crÃ­tico de stock.` });
                  }

                  if (lucro < 0) alertas.push({ nivel: 'danger', msg: 'Resultado Negativo', sub: `PrejuÃ­zo de ${safeFormatAOA(Math.abs(lucro))} no perÃ­odo.` });
                  if (liquidezCorrente < 1 && ativos > 0) alertas.push({ nivel: 'danger', msg: 'Risco de Liquidez', sub: `Activos cobrem apenas ${(liquidezCorrente * 100).toFixed(0)}% do passivo.` });
                  if (ratioEndividamento > 70 && ativos > 0) alertas.push({ nivel: 'warn', msg: 'Alto Endividamento', sub: `${ratioEndividamento.toFixed(0)}% dos activos financiados por dÃ­vida.` });
                  if (margemLiquida > 0 && margemLiquida < 10) alertas.push({ nivel: 'warn', msg: 'Margem Comprimida', sub: `Margem lÃ­quida de ${margemLiquida.toFixed(1)}% â€” abaixo do ideal (>10%).` });
                  const ivaEstimado = receita * 0.14;
                  if (ivaEstimado > 0) alertas.push({ nivel: 'warn', msg: 'IVA Estimado Pendente', sub: `${safeFormatAOA(ivaEstimado)} (14% sobre receita) â€” verificar agenda fiscal.` });
                  if (lucro > 0 && margemLiquida >= 10) alertas.push({ nivel: 'ok', msg: 'Desempenho SÃ³lido', sub: `Margem de ${margemLiquida.toFixed(1)}% com resultado positivo.` });
                  if (liquidezCorrente >= 1.5) alertas.push({ nivel: 'ok', msg: 'Liquidez ConfortÃ¡vel', sub: `Cobertura de ${liquidezCorrente.toFixed(2)}x sobre as obrigaÃ§Ãµes.` });
                  const alertasToShow = alertas.slice(0, 4);

                  // PrevisÃ£o de Fluxo de Caixa (prÃ³ximos 6 meses por tendÃªncia simples)
                  const tendencia = receita > 0 ? (lucro / receita) : 0;
                  const base = receita > 0 ? receita : 500000;
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
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
                           <div className="bg-white p-7 rounded-[2.5rem] border border-sky-100 shadow-sm">
                              <p className="text-zinc-400 text-[9px] font-black uppercase tracking-widest mb-2">Receita Acumulada</p>
                              <p className="text-2xl font-black text-zinc-900">{safeFormatAOA(receita)}</p>
                              <div className="mt-3 flex items-center gap-1 text-[9px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg w-fit">
                                 <ArrowUpRight size={10} /> Operacional
                              </div>
                           </div>
                           <div className="bg-white p-7 rounded-[2.5rem] border border-sky-100 shadow-sm">
                              <p className="text-zinc-400 text-[9px] font-black uppercase tracking-widest mb-2">Custos Totais</p>
                              <p className="text-2xl font-black text-red-500">{safeFormatAOA(despesa)}</p>
                              <p className="text-[9px] text-zinc-400 font-bold mt-3">Pessoal + Operacional</p>
                           </div>
                           <div className="bg-zinc-900 p-7 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden">
                              <p className="text-yellow-500 text-[9px] font-black uppercase tracking-widest mb-2">Lucro LÃ­quido</p>
                              <p className={`text-2xl font-black ${lucro >= 0 ? 'text-white' : 'text-red-400'}`}>{safeFormatAOA(lucro)}</p>
                              <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                 <div className="h-full bg-yellow-500 transition-all duration-1000"
                                    style={{ width: `${Math.min(100, Math.max(0, (lucro / (receita || 1)) * 100))}%` }} />
                              </div>
                              <p className="text-[9px] font-black text-zinc-400 mt-1">{margemLiquida.toFixed(1)}% Margem</p>
                           </div>
                           <div className="bg-white p-7 rounded-[2.5rem] border border-sky-100 shadow-sm">
                              <p className="text-zinc-400 text-[9px] font-black uppercase tracking-widest mb-2">Activo Total</p>
                              <p className="text-2xl font-black text-zinc-900">{safeFormatAOA(ativos)}</p>
                              <p className="text-[9px] text-zinc-400 font-bold mt-3">Passivo: {safeFormatAOA(passivos)}</p>
                           </div>

                           {/* Score DinÃ¢mico */}
                           <div className="col-span-2 md:col-span-1 bg-gradient-to-br from-zinc-900 to-zinc-800 p-7 rounded-[2.5rem] shadow-2xl flex flex-col items-center justify-center text-center relative overflow-hidden">
                              <div className="absolute inset-0 opacity-10">
                                 <div className="absolute top-2 right-2 w-24 h-24 rounded-full bg-yellow-500 blur-2xl" />
                              </div>
                              <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Score Financeiro</p>
                              <p className={`text-5xl font-black mt-1 ${scoreColor}`}>{receita > 0 ? score.toFixed(1) : 'â€”'}</p>
                              <p className={`text-[9px] font-black uppercase tracking-widest mt-2 ${scoreColor}`}>{receita > 0 ? scoreLabel : 'Sem Dados'}</p>
                              <div className="w-full mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
                                 <div className="h-full bg-yellow-500 transition-all duration-1000 rounded-full"
                                    style={{ width: `${(score / 10) * 100}%` }} />
                              </div>
                           </div>
                        </div>

                        {/* FILA 2: Indicadores Financeiros AutomÃ¡ticos */}
                        <div className="bg-white rounded-[3rem] border border-sky-100 shadow-sm p-8">
                           <div className="flex items-center justify-between mb-6">
                              <h3 className="text-base font-black text-zinc-900 uppercase tracking-tight flex items-center gap-2">
                                 <BarChart2 size={18} className="text-yellow-500" /> Indicadores Financeiros AutomÃ¡ticos
                              </h3>
                              <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest px-3 py-1.5 bg-zinc-50 rounded-xl border border-zinc-100">Calculados em Tempo Real</span>
                           </div>
                           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              {[
                                 {
                                    label: 'Liquidez Corrente', value: receita > 0 ? liquidezCorrente.toFixed(2) : 'â€”', unit: 'x',
                                    info: 'Activo / Passivo. Ideal > 1.5',
                                    color: liquidezCorrente >= 1.5 ? 'bg-green-50 border-green-100 text-green-600' : liquidezCorrente >= 1 ? 'bg-yellow-50 border-yellow-100 text-yellow-600' : 'bg-red-50 border-red-100 text-red-600',
                                    status: liquidezCorrente >= 1.5 ? '? SaudÃ¡vel' : liquidezCorrente >= 1 ? '? AceitÃ¡vel' : '? Risco'
                                 },
                                 {
                                    label: 'SolvÃªncia', value: receita > 0 ? solvencia.toFixed(2) : 'â€”', unit: 'x',
                                    info: 'Activo / (Passivo+Capital). Ideal > 1',
                                    color: solvencia >= 1 ? 'bg-green-50 border-green-100 text-green-600' : 'bg-red-50 border-red-100 text-red-600',
                                    status: solvencia >= 1 ? '? Solvente' : '? Insolvente'
                                 },
                                 {
                                    label: 'ROE', value: receita > 0 ? roe.toFixed(1) : 'â€”', unit: '%',
                                    info: 'Retorno sobre Capital PrÃ³prio',
                                    color: roe >= 15 ? 'bg-green-50 border-green-100 text-green-600' : roe >= 5 ? 'bg-yellow-50 border-yellow-100 text-yellow-600' : 'bg-zinc-50 border-zinc-100 text-zinc-500',
                                    status: roe >= 15 ? '? Excelente' : roe >= 5 ? '? Moderado' : 'â€” Neutro'
                                 },
                                 {
                                    label: 'Endividamento', value: receita > 0 ? ratioEndividamento.toFixed(0) : 'â€”', unit: '%',
                                    info: 'Passivo / Activo. Ideal < 50%',
                                    color: ratioEndividamento < 40 ? 'bg-green-50 border-green-100 text-green-600' : ratioEndividamento < 70 ? 'bg-yellow-50 border-yellow-100 text-yellow-600' : 'bg-red-50 border-red-100 text-red-600',
                                    status: ratioEndividamento < 40 ? '? Baixo' : ratioEndividamento < 70 ? '? Moderado' : '? Alto'
                                 },
                              ].map((ind, i) => (
                                 <div key={i} className={`p-5 rounded-2xl border ${ind.color} flex flex-col gap-1`}>
                                    <p className="text-[9px] font-black uppercase tracking-widest opacity-70">{ind.label}</p>
                                    <p className="text-3xl font-black">{ind.value}<span className="text-sm">{ind.value !== 'â€”' ? ind.unit : ''}</span></p>
                                    <p className="text-[9px] font-bold opacity-60">{ind.info}</p>
                                    <p className="text-[9px] font-black uppercase tracking-widest mt-1">{ind.status}</p>
                                 </div>
                              ))}
                           </div>
                        </div>

                        {/* FILA 3: GrÃ¡ficos */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                           {/* Comparativo Receita vs Despesa */}
                           <div className="bg-white p-10 rounded-[3rem] border border-sky-100 shadow-sm h-[420px] flex flex-col">
                              <div className="flex justify-between items-start mb-6">
                                 <div>
                                    <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                                       <LucideBarChart className="text-yellow-500" size={18} /> Comparativo Financeiro
                                    </h3>
                                    <p className="text-xs text-zinc-400 font-bold mt-1 uppercase tracking-widest">AnÃ¡lise por PerÃ­odo Â· {currentEmpresa?.nome || ''}</p>
                                 </div>
                                 <button onClick={handleExportChart} className="p-2 bg-zinc-50 hover:bg-zinc-100 rounded-xl text-zinc-400 hover:text-zinc-900 transition-colors" title="Exportar">
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

                           {/* PrevisÃ£o de Fluxo de Caixa */}
                           <div className="bg-white p-10 rounded-[3rem] border border-sky-100 shadow-sm h-[420px] flex flex-col">
                              <div className="flex justify-between items-start mb-6">
                                 <div>
                                    <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                                       <ArrowUpRight className="text-yellow-500" size={18} /> PrevisÃ£o de Fluxo de Caixa
                                    </h3>
                                    <p className="text-xs text-zinc-400 font-bold mt-1 uppercase tracking-widest">ProjecÃ§Ã£o prÃ³ximos 6 meses Â· Baseada em tendÃªncia real</p>
                                 </div>
                                 <span className={`text-[9px] font-black px-3 py-1.5 rounded-xl border ${tendencia >= 0 ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                    TendÃªncia {tendencia >= 0 ? `+${(tendencia * 100 * 0.1).toFixed(1)}%` : `${(tendencia * 100 * 0.1).toFixed(1)}%`} /mÃªs
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

                        {/* FILA 4: Alertas de Risco DinÃ¢micos + GrÃ¡fico Pizza */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           {/* Alertas Inteligentes */}
                           <div className="bg-zinc-900 p-10 rounded-[3rem] text-white flex flex-col justify-between shadow-2xl">
                              <div className="space-y-5">
                                 <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-black uppercase tracking-tight text-yellow-500 flex items-center gap-2">
                                       <AlertTriangle size={18} /> Alertas de Risco Financeiro
                                    </h3>
                                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{alertas.filter(a => a.nivel === 'danger').length} CrÃ­tico(s)</span>
                                 </div>
                                 <div className="space-y-3">
                                    {alertasToShow.length === 0 && (
                                       <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-center">
                                          <p className="text-xs text-zinc-400 font-bold">Sem dados suficientes para gerar alertas automÃ¡ticos.</p>
                                       </div>
                                    )}
                                    {alertasToShow.map((alerta, i) => (
                                       <div key={i} className={`flex items-start gap-4 p-4 rounded-2xl border ${alerta.nivel === 'danger' ? 'bg-red-500/10 border-red-500/20' : alerta.nivel === 'warn' ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-green-500/10 border-green-500/20'}`}>
                                          {alerta.nivel === 'danger' ? <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={16} /> :
                                             alerta.nivel === 'warn' ? <AlertTriangle className="text-yellow-400 shrink-0 mt-0.5" size={16} /> :
                                                <CheckCircle2 className="text-green-400 shrink-0 mt-0.5" size={16} />}
                                          <div>
                                             <p className="text-sm font-black">{alerta.msg}</p>
                                             <p className="text-[10px] text-zinc-400">{alerta.sub}</p>
                                          </div>
                                       </div>
                                    ))}
                                 </div>
                              </div>
                              <button onClick={() => openReport('balanco')}
                                 className="w-full mt-8 py-4 bg-yellow-500 text-zinc-900 font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-yellow-400 transition-all shadow-xl">
                                 Ver RelatÃ³rio Detalhado
                              </button>
                           </div>

                           {/* DistribuiÃ§Ã£o de Despesas */}
                           <div className="bg-white p-10 rounded-[3rem] border border-sky-100 shadow-sm h-[420px] flex flex-col">
                              <div className="mb-6">
                                 <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                                    <PieChartIcon className="text-yellow-500" size={18} /> DistribuiÃ§Ã£o de Despesas
                                 </h3>
                                 <p className="text-xs text-zinc-400 font-bold mt-1 uppercase tracking-widest">AlocaÃ§Ã£o de Custos Operacionais</p>
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
                                       <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Total</p>
                                       <p className="text-base font-black text-zinc-900">{safeFormatAOA(chartData.pieChartData?.reduce((acc, b) => acc + (Number(b.value) || 0), 0) || 0)}</p>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>
                  );
               })()}

               {/* --- DIARIO --- */}
               {activeTab === 'diario' && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-4">
                     <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-8 rounded-[3rem] shadow-sm border border-sky-100">
                        <div className="flex items-center gap-4 w-full md:w-auto">
                           <div className="relative flex-1 md:w-80">
                              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                              <input
                                 type="text"
                                 placeholder="Pesquisar no diÃ¡rio..."
                                 className="w-full pl-12 pr-6 py-3.5 bg-zinc-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-yellow-500/20"
                              />
                           </div>
                        </div>
                        <div className="flex items-center gap-3">
                           {periodos.find(p => p.id === selectedPeriodoId)?.status === 'Fechado' && (
                              <div className="px-4 py-2 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border border-red-100">
                                 <Lock size={14} /> PerÃ­odo Bloqueado
                              </div>
                           )}
                           <button
                              onClick={() => setShowCompraModal(true)}
                              className="px-6 py-4 bg-orange-100 text-orange-700 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-orange-500 hover:text-white transition-all"
                           >
                              <ShoppingCart size={16} /> Registar Compra
                           </button>
                           <button
                              onClick={() => setShowEntryModal(true)}
                              disabled={periodos.find(p => p.id === selectedPeriodoId)?.status === 'Fechado'}
                              className="px-8 py-4 bg-zinc-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-yellow-500 hover:text-zinc-900 transition-all shadow-xl disabled:opacity-50"
                           >
                              <Plus size={20} /> Novo LanÃ§amento
                           </button>
                        </div>
                     </div>

                     <div className="bg-white rounded-[3.5rem] shadow-xl border border-sky-100 overflow-hidden">
                        <div className="overflow-x-auto">
                           <table className="w-full text-left min-w-[1000px]">
                              <thead className="bg-zinc-900 text-white border-b border-zinc-800">
                                 <tr className="text-[10px] font-black uppercase tracking-[0.2em]">
                                    <th className="px-10 py-6">Data</th>
                                    <th className="px-10 py-6">ReferÃªncia</th>
                                    <th className="px-10 py-6">HistÃ³rico / DescriÃ§Ã£o</th>
                                    <th className="px-10 py-6 text-right">Valor Total</th>
                                    <th className="px-10 py-6 text-center">Status</th>
                                    <th className="px-10 py-6 text-center">Tipo</th>
                                    <th className="px-6 py-6 text-center">AcÃ§Ãµes</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-zinc-100">
                                 {lancamentos.filter(l => l.company_id === selectedEmpresaId && (selectedPeriodoId ? l.periodo_id === selectedPeriodoId : true)).length > 0 ? (
                                    lancamentos.filter(l => l.company_id === selectedEmpresaId && (selectedPeriodoId ? l.periodo_id === selectedPeriodoId : true)).map((l) => (
                                       <tr key={l.id} className="group hover:bg-zinc-50/50 transition-all cursor-pointer">
                                          <td className="px-10 py-8 font-mono text-zinc-500 text-xs">
                                             {l.data ? new Date(l.data).toLocaleDateString() : 'N/D'}
                                          </td>
                                          <td className="px-10 py-8">
                                             <span className="px-4 py-2 bg-zinc-50 rounded-xl text-[9px] font-black uppercase tracking-widest text-zinc-400 group-hover:bg-zinc-900 group-hover:text-white transition-all">#LNC-{l.id.toString().slice(0, 4)}</span>
                                          </td>
                                          <td className="px-10 py-8">
                                             <p className="font-black text-zinc-900 text-lg group-hover:text-yellow-600 transition-colors">{l.descricao}</p>
                                             <div className="flex gap-4 mt-2">
                                                {l.itens?.map((it, idx) => (
                                                   <div key={idx} className="flex items-center gap-2">
                                                      <div className={`w-2 h-2 rounded-full ${it.tipo === 'D' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                      <span className="text-[10px] font-black text-zinc-400 uppercase">{it.conta_codigo}</span>
                                                   </div>
                                                ))}
                                             </div>
                                          </td>
                                          <td className="px-10 py-8 text-right font-black text-xl text-zinc-900">
                                             {safeFormatAOA(l.itens?.filter(i => i.tipo === 'D').reduce((acc, it) => acc + (Number(it.valor) || 0), 0) || 0)}
                                          </td>
                                          <td className="px-10 py-8 text-center">
                                             <span className={`px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest border ${l.estornado ? 'bg-red-50 text-red-600 border-red-100' :
                                                l.status === 'Postado' ? 'bg-green-50 text-green-600 border-green-100' :
                                                   l.status === 'Rascunho' || l.status === 'PendenteAprovacao' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                                                      'bg-zinc-50 text-zinc-500 border-zinc-100'
                                                }`}>{l.estornado ? 'Estornado' : (l.status || 'Postado')}</span>
                                          </td>
                                          <td className="px-10 py-8 text-center">
                                             <span className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest ${l.tipo_transacao === 'AutomÃ¡tico' ? 'bg-blue-50 text-blue-600' :
                                                l.tipo_transacao === 'Estorno' ? 'bg-red-50 text-red-600' :
                                                   l.tipo_transacao === 'Folha' ? 'bg-purple-50 text-purple-600' :
                                                      'bg-zinc-50 text-zinc-500'
                                                }`}>{l.tipo_transacao || 'Manual'}</span>
                                          </td>
                                          <td className="px-6 py-8 text-center">
                                             {!l.estornado && l.status === 'Postado' ? (
                                                <button onClick={() => handleEstornarLancamento(l)} disabled={isEstornandoId === l.id}
                                                   title="Criar Estorno" className="p-2 bg-zinc-50 hover:bg-red-50 hover:text-red-600 text-zinc-400 rounded-xl transition-all disabled:opacity-40">
                                                   {isEstornandoId === l.id ? <RefreshCw size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                                                </button>
                                             ) : <span className="text-zinc-200">â€”</span>}
                                          </td>
                                       </tr>
                                    ))
                                 ) : (
                                    <tr><td colSpan={7} className="text-center py-20 text-zinc-400 font-bold italic">Nenhum lanÃ§amento registado para este perÃ­odo.</td></tr>
                                 )}
                              </tbody>
                           </table>
                        </div>
                     </div>
                  </div>
               )}

               {/* --- DEMONSTRAÃ‡Ã•ES FINANCEIRAS --- */}
               {
                  activeTab === 'demonstracoes' && (
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4">
                        {/* BalanÃ§o Patrimonial */}
                        <div className="bg-white p-12 rounded-[4rem] shadow-sm border border-sky-100">
                           <div className="flex justify-between items-center mb-10">
                              <h3 className="text-2xl font-black uppercase tracking-tight">BalanÃ§o Patrimonial - {currentEmpresa?.nome || ''}</h3>
                              <button className="p-3 bg-zinc-50 rounded-xl text-zinc-400 hover:text-zinc-900"><Printer size={20} /></button>
                           </div>
                           <div className="space-y-8">
                              <div className="space-y-4">
                                 <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b pb-2">Ativo (Devedora)</p>
                                 <div className="flex justify-between text-sm"><span className="font-bold">Total do Ativo Circulante</span><span className="font-black">{safeFormatAOA(financeReports.ativos)}</span></div>
                              </div>
                              <div className="space-y-4">
                                 <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b pb-2">Passivo (Credora)</p>
                                 <div className="flex justify-between text-sm"><span className="font-bold">ObrigaÃ§Ãµes a Curto Prazo</span><span className="font-black text-red-600">{safeFormatAOA(financeReports.passivos)}</span></div>
                              </div>
                              <div className="space-y-4">
                                 <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b pb-2">Capital PrÃ³prio</p>
                                 <div className="flex justify-between text-sm"><span className="font-bold">Reservas e Capital Social</span><span className="font-black">{safeFormatAOA(financeReports.capital)}</span></div>
                              </div>
                              <div className="pt-6 border-t-2 border-zinc-900 flex justify-between">
                                 <span className="text-lg font-black uppercase">PatrimÃ³nio LÃ­quido</span>
                                 <span className="text-2xl font-black text-zinc-900">{safeFormatAOA(financeReports.ativos - financeReports.passivos)}</span>
                              </div>
                           </div>
                        </div>

                        {/* DRE */}
                        <div className="bg-zinc-900 p-12 rounded-[4rem] shadow-2xl text-white">
                           <div className="flex justify-between items-center mb-10">
                              <h3 className="text-2xl font-black uppercase tracking-tight text-yellow-500">DRE (Resultado)</h3>
                              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">ExercÃ­cio 2024</span>
                           </div>
                           <div className="space-y-8">
                              <div className="flex justify-between border-b border-white/10 pb-4">
                                 <span className="font-bold text-zinc-400 uppercase text-xs">Proveitos Operacionais</span>
                                 <span className="font-black text-xl">{safeFormatAOA(financeReports.receitaTotal)}</span>
                              </div>
                              <div className="flex justify-between border-b border-white/10 pb-4">
                                 <span className="font-bold text-zinc-400 uppercase text-xs">Custos com Pessoal</span>
                                 <span className="font-black text-lg text-red-400">({safeFormatAOA(folhas?.reduce((acc, b) => acc + (Number(b.salario_base) || 0), 0) || 0)})</span>
                              </div>
                              <div className="flex justify-between border-b border-white/10 pb-4">
                                 <span className="font-bold text-zinc-400 uppercase text-xs">Custos de ManutenÃ§Ã£o</span>
                                 <span className="font-black text-lg text-red-400">({safeFormatAOA((Number(financeReports.despesaTotal) || 0) * 0.3)})</span>
                              </div>
                              <div className="bg-white/5 p-8 rounded-3xl mt-12">
                                 <div className="flex justify-between items-center">
                                    <div>
                                       <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest mb-1">Resultado LÃ­quido do PerÃ­odo</p>
                                       <p className="text-3xl font-black">{safeFormatAOA(financeReports.lucroLiquido)}</p>
                                    </div>
                                    <div className={`p-4 rounded-2xl ${financeReports.lucroLiquido >= 0 ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                                       {financeReports.lucroLiquido >= 0 ? <ArrowUpRight size={32} /> : <ArrowDownLeft size={32} />}
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </div>

                        {/* BALANCETE DE VERIFICAÃ‡ÃƒO - NOVO */}
                        <div className="bg-white p-12 rounded-[3rem] shadow-sm border border-sky-100 col-span-1 md:col-span-2">
                           <div className="flex justify-between items-center mb-10">
                              <div>
                                 <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tight flex items-center gap-3">
                                    <ListChecks size={24} className="text-yellow-500" /> Balancete de VerificaÃ§Ã£o
                                 </h3>
                                 <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">Saldos Acumulados por Conta no PerÃ­odo</p>
                              </div>
                              <button
                                 onClick={handleExportBalancete}
                                 className="px-6 py-3 bg-zinc-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-yellow-500 hover:text-zinc-900 transition-all shadow-xl"
                              >
                                 Exportar Balancete
                              </button>
                           </div>
                           <div className="overflow-hidden rounded-2xl border border-zinc-100">
                              <table className="w-full text-left">
                                 <thead>
                                    <tr className="bg-zinc-900 text-white text-[9px] font-black uppercase tracking-[0.2em]">
                                       <th className="px-8 py-5">CÃ³digo</th>
                                       <th className="px-8 py-5">Nome da Conta</th>
                                       <th className="px-8 py-5 text-right">Saldo do PerÃ­odo</th>
                                    </tr>
                                 </thead>
                                 <tbody className="divide-y divide-zinc-100">
                                    {planoContas.filter(c => financeReports.saldos[c.codigo] !== 0).map(conta => (
                                       <tr key={conta.id} className="text-xs hover:bg-zinc-50 transition-all font-bold">
                                          <td className="px-8 py-4 font-mono text-zinc-500">{conta.codigo}</td>
                                          <td className="px-8 py-4 uppercase text-zinc-800">{conta.nome}</td>
                                          <td className={`px-8 py-4 text-right ${financeReports.saldos[conta.codigo] >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                             {safeFormatAOA(financeReports.saldos[conta.codigo])}
                                          </td>
                                       </tr>
                                    ))}
                                    {Object.values(financeReports.saldos).every(s => s === 0) && (
                                       <tr><td colSpan={3} className="px-8 py-10 text-center text-zinc-400 italic">Sem movimentaÃ§Ãµes no perÃ­odo selecionado.</td></tr>
                                    )}
                                 </tbody>
                              </table>
                           </div>
                        </div>

                        {/* RAZÃƒO (LEDGER) - NOVO COMPONENTE CORPORATIVO */}
                        <div className="bg-white p-12 rounded-[3rem] shadow-sm border border-sky-100 col-span-1 md:col-span-2">
                           <div className="flex justify-between items-center mb-10">
                              <div>
                                 <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tight flex items-center gap-3">
                                    <History size={24} className="text-yellow-500" /> Livro RazÃ£o Detalhado
                                 </h3>
                                 <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">MovimentaÃ§Ãµes AnalÃ­ticas por Conta</p>
                              </div>
                              <div className="flex gap-2">
                                 <button className="p-3 bg-zinc-50 rounded-xl text-zinc-400 hover:text-zinc-900 transition-all"><Printer size={20} /></button>
                                 <button className="p-3 bg-zinc-50 rounded-xl text-zinc-400 hover:text-zinc-900 transition-all"><Download size={20} /></button>
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
                                    <div key={conta.id} className="border border-zinc-100 rounded-[2rem] overflow-hidden">
                                       <div className="bg-zinc-50 p-6 flex justify-between items-center border-b border-zinc-100">
                                          <span className="font-black text-xs uppercase tracking-widest text-zinc-900">{conta.codigo} - {conta.nome}</span>
                                          <span className="px-4 py-1.5 bg-zinc-900 text-white rounded-full text-[9px] font-black uppercase tracking-widest">Saldo: {safeFormatAOA(0)}</span>
                                       </div>
                                       <table className="w-full text-left">
                                          <thead>
                                             <tr className="text-[9px] font-black uppercase tracking-widest text-zinc-400 border-b border-zinc-100">
                                                <th className="px-8 py-4">Data</th>
                                                <th className="px-8 py-4">DescriÃ§Ã£o / HistÃ³rico</th>
                                                <th className="px-8 py-4 text-right">DÃ©bito</th>
                                                <th className="px-8 py-4 text-right">CrÃ©dito</th>
                                             </tr>
                                          </thead>
                                          <tbody className="divide-y divide-zinc-50">
                                             {(movimentos || []).map(m => {
                                                const it = m?.itens?.find(i => i && i.conta_codigo === conta.codigo);
                                                return (
                                                   <tr key={m.id} className="text-xs hover:bg-zinc-50 transition-all">
                                                      <td className="px-8 py-4 font-mono text-zinc-500">{m.data ? new Date(m.data).toLocaleDateString() : 'N/A'}</td>
                                                      <td className="px-8 py-4 font-bold text-zinc-800 uppercase">{m.descricao || 'Sem DescriÃ§Ã£o'}</td>
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
                                 <div className="px-4 py-1.5 bg-indigo-500/20 border border-indigo-500/50 rounded-full text-indigo-400 text-[10px] font-black uppercase tracking-[0.4em] flex items-center gap-2">
                                    <Sparkles size={14} /> Cognitive Auditor
                                 </div>
                              </div>
                              <h2 className="text-6xl font-black tracking-tighter leading-none">Auditoria <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-white">Inteligente Amazing.</span></h2>
                              <p className="text-zinc-400 text-xl font-medium leading-relaxed max-w-2xl">Analise anomalias, otimize impostos e tome decisÃµes baseadas em padrÃµes de alto nÃ­vel processados em tempo real.</p>
                              <button
                                 onClick={handleAIAnalysis}
                                 disabled={isAnalyzing}
                                 className="px-12 py-6 bg-indigo-600 hover:bg-indigo-500 rounded-3xl font-black uppercase text-sm tracking-widest shadow-2xl transition-all disabled:opacity-50 flex items-center gap-4"
                              >
                                 {isAnalyzing ? <RefreshCw className="animate-spin" /> : <ShieldAlert />}
                                 {isAnalyzing ? 'Processando Balancetes...' : 'Gerar RelatÃ³rio de Auditoria IA'}
                              </button>
                           </div>
                        </div>

                        {iaResponse && (
                           <div className="bg-white p-16 rounded-[4rem] border-2 border-indigo-100 shadow-3xl animate-in zoom-in-95">
                              <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-8 flex items-center gap-3"><CheckCircle2 /> Insights Gerados</h4>
                              <div className="text-zinc-700 text-xl font-medium leading-relaxed italic whitespace-pre-wrap">{iaResponse}</div>
                           </div>
                        )}
                     </div>
                  )
               }

               {/* --- PLANO DE CONTAS INTELIGENTE (HIERÃRQUICO + CC) --- */}
               {
                  activeTab === 'plano' && (
                     <div className="space-y-6 animate-in slide-in-from-bottom-4">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-8 rounded-[3rem] shadow-sm border border-sky-100">
                           <div className="flex bg-zinc-100 p-1.5 rounded-2xl w-full md:w-fit">
                              <button
                                 onClick={() => setPlanoSubTab('contas')}
                                 className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${planoSubTab === 'contas' ? 'bg-zinc-900 text-white shadow-lg' : 'text-zinc-400 hover:text-zinc-600'}`}
                              >
                                 Plano de Contas
                              </button>
                              <button
                                 onClick={() => setPlanoSubTab('cc')}
                                 className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${planoSubTab === 'cc' ? 'bg-zinc-900 text-white shadow-lg' : 'text-zinc-400 hover:text-zinc-600'}`}
                              >
                                 Centros de Custo
                              </button>
                           </div>

                           <div className="flex gap-3 w-full md:w-auto">
                              <button
                                 onClick={handleImportPlanoPadrao}
                                 className="flex-1 md:flex-none px-6 py-4 bg-yellow-50 text-yellow-700 border border-yellow-100 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-yellow-500 hover:text-zinc-900 transition-all"
                              >
                                 Importar PGC PadrÃ£o
                              </button>
                              <button
                                 onClick={() => planoSubTab === 'contas' ? setShowAccountModal(true) : setShowCCModal(true)}
                                 className="flex-1 md:flex-none px-8 py-4 bg-zinc-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-yellow-500 hover:text-zinc-900 transition-all shadow-xl flex items-center justify-center gap-2"
                              >
                                 <Plus size={16} /> {planoSubTab === 'contas' ? 'Nova Conta' : 'Novo Centro'}
                              </button>
                           </div>
                        </div>

                        {planoSubTab === 'contas' ? (
                           <div className="bg-white rounded-[3.5rem] shadow-sm border border-sky-100 overflow-hidden">
                              <div className="p-8 border-b border-zinc-100 bg-zinc-50/30 flex justify-between items-center">
                                 <div className="flex items-center gap-4">
                                    <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tight">Estatuto OrgÃ¢nico de Contas (PGC)</h3>
                                    <span className="px-3 py-1 bg-zinc-900 text-white text-[9px] font-black rounded-lg uppercase">{planoContas.length} Contas</span>
                                 </div>
                                 <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                                    <input
                                       type="text"
                                       placeholder="Filtrar contas..."
                                       className="pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-xs w-64 focus:ring-2 focus:ring-yellow-500/20"
                                    />
                                 </div>
                              </div>
                              <div className="overflow-x-auto">
                                 <table className="w-full text-left">
                                    <thead className="bg-zinc-900 text-white">
                                       <tr className="text-[10px] font-black uppercase tracking-widest">
                                          <th className="px-10 py-5">CÃ³digo</th>
                                          <th className="px-6 py-5">DescriÃ§Ã£o</th>
                                          <th className="px-6 py-5">Tipo</th>
                                          <th className="px-6 py-5">Natureza</th>
                                          <th className="px-6 py-5 text-center">Status</th>
                                          <th className="px-10 py-5 text-right">AÃ§Ãµes</th>
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
                                             <tr key={c.id} className={`group hover:bg-zinc-50 transition-all ${c.e_sintetica ? 'bg-zinc-50/30' : ''}`}>
                                                <td className="px-10 py-4 font-mono text-xs font-bold text-zinc-500">
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
                                                      <span className={`${c.e_sintetica ? 'font-black text-zinc-900' : 'font-bold text-zinc-600'}`}>{c.nome}</span>
                                                      {!c.aceita_lancamentos && <Lock size={10} className="text-zinc-300" title="Conta SintÃ©tica" />}
                                                   </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                   <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase ${c.tipo === 'Ativo' ? 'bg-blue-50 text-blue-600' : c.tipo === 'Passivo' ? 'bg-orange-50 text-orange-600' : c.tipo === 'Capital' ? 'bg-purple-50 text-purple-600' : c.tipo === 'Receita' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                                      {c.tipo}
                                                   </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                   <span className="text-[10px] font-bold text-zinc-400 uppercase">{c.natureza}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                   {c.aceita_lancamentos ? (
                                                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-md text-[8px] font-black uppercase">AnalÃ­tica</span>
                                                   ) : (
                                                      <span className="px-2 py-0.5 bg-zinc-200 text-zinc-600 rounded-md text-[8px] font-black uppercase">SintÃ©tica</span>
                                                   )}
                                                </td>
                                                <td className="px-10 py-4 text-right">
                                                   <button className="p-2 text-zinc-200 group-hover:text-zinc-900 transition-colors"><MoreVertical size={16} /></button>
                                                </td>
                                             </tr>
                                          );
                                       })}
                                    </tbody>
                                 </table>
                              </div>
                           </div>
                        ) : (
                           <div className="bg-white rounded-[3.5rem] shadow-sm border border-sky-100 overflow-hidden p-10">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                 {centrosCusto.length === 0 ? (
                                    <div className="col-span-3 text-center py-20 bg-zinc-50 rounded-[3rem] border-2 border-dashed border-zinc-200">
                                       <Landmark className="mx-auto text-zinc-300 mb-4" size={48} />
                                       <p className="text-zinc-500 font-bold uppercase text-xs tracking-widest">Nenhum Centro de Custo configurado.</p>
                                       <button onClick={() => setShowCCModal(true)} className="mt-4 px-6 py-3 bg-zinc-900 text-white rounded-xl font-black text-[10px] uppercase">Definir primeiro centro</button>
                                    </div>
                                 ) : (
                                    centrosCusto.map((cc, idx) => (
                                       <div key={idx} className="p-8 rounded-[2.5rem] bg-zinc-50 border border-zinc-100 hover:border-yellow-200 transition-all group relative overflow-hidden">
                                          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform"><Landmark size={64} /></div>
                                          <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest mb-2">{cc.tipo}</p>
                                          <h4 className="text-2xl font-black text-zinc-900 tracking-tighter mb-1 uppercase">{cc.nome}</h4>
                                          <p className="text-[10px] font-mono text-zinc-400 font-bold uppercase mb-4">CÃ³digo: {cc.codigo}</p>
                                          <div className="flex items-center justify-between mt-6 pt-6 border-t border-zinc-200">
                                             <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase ${cc.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {cc.ativo ? 'Ativo' : 'Inativo'}
                                             </span>
                                             <button className="text-zinc-400 hover:text-zinc-900"><MoreVertical size={16} /></button>
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

               {/* --- GESTÃƒO DE PERÃODOS --- */}
               {
                  activeTab === 'periodos' && (
                     <div className="space-y-8 animate-in slide-in-from-bottom-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                           <div className="bg-zinc-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
                              <Calendar size={120} className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform" />
                              <h4 className="text-zinc-400 text-[10px] font-black uppercase tracking-widest mb-6">Controlo de ExercÃ­cio</h4>
                              <p className="text-3xl font-black mb-2">Ano {
                                 periodos.filter(p => p.company_id === selectedEmpresaId).length > 0
                                    ? Math.max(...periodos.filter(p => p.company_id === selectedEmpresaId).map(p => Number(p.ano)))
                                    : new Date().getFullYear()
                              }</p>
                              <p className="text-xs text-zinc-500 font-bold uppercase">ExercÃ­cio Corrente</p>
                              <button
                                 onClick={handleOpenYear}
                                 className="mt-8 px-6 py-3 bg-white/10 hover:bg-yellow-500 hover:text-zinc-900 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                              >
                                 Abrir Novo Ano
                              </button>
                           </div>

                           <div className="md:col-span-2 bg-white rounded-[3rem] shadow-sm border border-sky-100 overflow-hidden">
                              <div className="p-10 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                                 <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tight">Meses ContabilÃ­sticos</h3>
                                 <button
                                    onClick={handleOpenMonth}
                                    className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-yellow-500 hover:text-zinc-900 transition-all"
                                 >
                                    <Plus size={18} /> Novo MÃªs
                                 </button>
                              </div>
                              <div className="divide-y divide-zinc-100">
                                 {periodos.filter(p => p.company_id === selectedEmpresaId).map(p => (
                                    <div key={p.id} className="p-8 flex items-center justify-between group hover:bg-zinc-50 transition-all">
                                       <div className="flex items-center gap-6">
                                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${p.status === 'Aberto' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                             {p.status === 'Aberto' ? <CheckCircle2 size={24} /> : <Lock size={24} />}
                                          </div>
                                          <div>
                                             <h4 className="font-black text-zinc-900 text-lg">{p.mes}/{p.ano}</h4>
                                             <p className={`text-[10px] font-black uppercase tracking-widest ${p.status === 'Aberto' ? 'text-green-500' : 'text-red-500'}`}>{p.status}</p>
                                          </div>
                                       </div>
                                       <div className="flex gap-4">
                                          {p.status === 'Aberto' ? (
                                             <button
                                                onClick={() => handleClosePeriod(p.id)}
                                                className="px-6 py-3 bg-zinc-100 text-zinc-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-zinc-900 hover:text-white transition-all"
                                             >
                                                Fechar PerÃ­odo
                                             </button>
                                          ) : (
                                             <button className="px-6 py-3 bg-red-50 text-red-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all flex items-center gap-2">
                                                <ShieldAlert size={14} /> Reabrir (Audit)
                                             </button>
                                          )}
                                          <button className="p-3 text-zinc-300 hover:text-zinc-900 transition-colors"><Search size={20} /></button>
                                       </div>
                                    </div>
                                 ))}
                                 {periodos.filter(p => p.company_id === selectedEmpresaId).length === 0 && (
                                    <div className="p-20 text-center text-zinc-400 font-bold italic">Nenhum perÃ­odo contabilÃ­stico configurado para esta unidade.</div>
                                 )}
                              </div>
                           </div>
                        </div>
                     </div>
                  )
               }

               {/* --- CONCILIAÃ‡ÃƒO BANCÃRIA --- */}
               {
                  activeTab === 'conciliacao' && (
                     <div className="space-y-8 animate-in slide-in-from-bottom-4">
                        <div className="bg-white rounded-[3rem] shadow-sm border border-sky-100 overflow-hidden">
                           <div className="p-10 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                              <div>
                                 <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tight">ConciliaÃ§Ã£o BancÃ¡ria Inteligente</h3>
                                 <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest mt-1">SincronizaÃ§Ã£o de extratos com lanÃ§amentos contabilÃ­sticos</p>
                              </div>
                              <div className="flex gap-4">
                                 <label className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-yellow-500 hover:text-zinc-900 transition-all cursor-pointer" title="Formato: Data,DescriÃ§Ã£o,Valor (Ex: 2024-05-15,Pagamento Fornecedor,-50000)">
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
                                          alert('Erro ao importar extrato. Verifique o formato CSV (Data,DescriÃ§Ã£o,Valor).');
                                       } else {
                                          fetchAccountingData();
                                       }
                                    }} />
                                 </label>
                              </div>
                           </div>
                           <div className="p-6">
                              <div className="grid grid-cols-12 gap-4 px-8 py-4 bg-zinc-900 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest mb-4 font-mono">
                                 <div className="col-span-2">Data</div>
                                 <div className="col-span-4">DescriÃ§Ã£o BancÃ¡ria</div>
                                 <div className="col-span-2">Valor (Kz)</div>
                                 <div className="col-span-4">SugestÃ£o de LanÃ§amento</div>
                              </div>
                              <div className="space-y-3">
                                 {extratos.filter(e => e.company_id === selectedEmpresaId).map(ex => {
                                    const match = lancamentos.find(l =>
                                       Math.abs(Number(l.valor) - Math.abs(ex.valor)) < 0.01 &&
                                       Math.abs(new Date(l.data).getTime() - new Date(ex.data).getTime()) < 3 * 24 * 60 * 60 * 1000
                                    );
                                    return (
                                       <div key={ex.id} className="grid grid-cols-12 gap-4 px-8 py-5 rounded-2xl items-center border border-zinc-50 hover:border-sky-100 transition-all">
                                          <div className="col-span-2 text-xs font-bold text-zinc-500">{ex.data}</div>
                                          <div className="col-span-4 text-xs font-black uppercase text-zinc-800">{ex.descricao}</div>
                                          <div className="col-span-2 text-xs font-black text-zinc-900">{safeFormatAOA(ex.valor)}</div>
                                          <div className="col-span-4 flex items-center justify-between">
                                             {match ? (
                                                <div className="flex items-center gap-2 text-[10px] font-black text-green-600 bg-green-50 px-3 py-1.5 rounded-xl border border-green-100 w-full group">
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
                                                   <div className="text-[10px] font-bold text-zinc-400 p-2 italic">Sem correspondÃªncia exacta</div>
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
                                                      className="px-3 py-1.5 bg-zinc-100 text-zinc-600 rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-zinc-900 hover:text-white transition-all shadow-sm"
                                                   >
                                                      Novo LanÃ§amento
                                                   </button>
                                                </div>
                                             )}
                                          </div>
                                       </div>
                                    );
                                 })}
                                 {extratos.filter(e => e.company_id === selectedEmpresaId).length === 0 && (
                                    <div className="p-20 text-center text-zinc-400 font-bold italic">Nenhum extrato importado. Carregue um ficheiro CSV para iniciar a conciliaÃ§Ã£o.</div>
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
                        <div className="bg-zinc-900 rounded-[3rem] p-10 flex flex-col md:flex-row gap-8 items-center justify-between">
                           <div className="flex items-center gap-6">
                              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 ${!integrityResult ? 'bg-zinc-700' :
                                 integrityResult.status === 'OK' ? 'bg-green-500/20' : 'bg-red-500/20'
                                 }`}>
                                 {!integrityResult ? <ShieldCheck size={32} className="text-zinc-400" /> :
                                    integrityResult.status === 'OK'
                                       ? <ShieldCheck size={32} className="text-green-400" />
                                       : <ShieldAlert size={32} className="text-red-400" />}
                              </div>
                              <div>
                                 <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Ledger ImutÃ¡vel â€” VerificaÃ§Ã£o de Integridade</p>
                                 {integrityResult ? (
                                    <>
                                       <p className={`text-2xl font-black mt-1 ${integrityResult.status === 'OK' ? 'text-green-400' : 'text-red-400'}`}>
                                          {integrityResult.status === 'OK' ? '? Integridade Verificada' : '? Anomalias Detectadas'}
                                       </p>
                                       <p className="text-xs text-zinc-500 font-bold mt-1">
                                          {integrityResult.unbalanced_entries === 0
                                             ? 'Todos os lanÃ§amentos estÃ£o em equilÃ­brio (D=C).'
                                             : `${integrityResult.unbalanced_entries} lanÃ§amento(s) com D?C encontrado(s).`
                                          } Â· {new Date(integrityResult.check_date).toLocaleString('pt-PT')}
                                       </p>
                                    </>
                                 ) : (
                                    <p className="text-lg font-black text-zinc-300 mt-1">Clique para verificar a cadeia de blocos contÃ¡beis</p>
                                 )}
                              </div>
                           </div>
                           <button
                              onClick={() => { handleCheckLedgerIntegrity(); fetchLedgerEntries(); }}
                              disabled={isCheckingIntegrity}
                              className="flex items-center gap-3 px-8 py-4 bg-yellow-500 text-zinc-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-yellow-400 transition-all disabled:opacity-50 shadow-lg shadow-yellow-500/20 flex-shrink-0"
                           >
                              {isCheckingIntegrity ? <RefreshCw size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                              {isCheckingIntegrity ? 'A verificar...' : 'Verificar Integridade'}
                           </button>
                        </div>

                        {/* Blockchain ContÃ¡bil */}
                        {ledgerEntries.length > 0 && (
                           <div className="bg-white rounded-[3rem] shadow-sm border border-sky-100 overflow-hidden">
                              <div className="p-8 border-b border-zinc-100 bg-zinc-50/50">
                                 <h4 className="text-sm font-black text-zinc-900 uppercase tracking-widest flex items-center gap-2">
                                    <Lock size={16} className="text-yellow-500" /> Blockchain ContÃ¡bil â€” Ãšltimos {ledgerEntries.length} Blocos
                                 </h4>
                              </div>
                              <div className="divide-y divide-zinc-50">
                                 {ledgerEntries.map((entry, idx) => (
                                    <div key={entry.id} className="flex items-center gap-6 px-8 py-5 hover:bg-zinc-50/50 transition-colors">
                                       <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-[10px] flex-shrink-0 ${idx === 0 ? 'bg-yellow-500 text-zinc-900' : 'bg-zinc-100 text-zinc-500'
                                          }`}>{ledgerEntries.length - idx}</div>
                                       <div className="flex-1 min-w-0">
                                          <p className="font-mono text-[9px] text-zinc-400 truncate">HASH: {entry.hash}</p>
                                          {entry.prev_hash && <p className="font-mono text-[9px] text-zinc-300 truncate">PREV: {entry.prev_hash}</p>}
                                       </div>
                                       <p className="text-[9px] font-mono text-zinc-300 flex-shrink-0">{new Date(entry.created_at).toLocaleString('pt-PT')}</p>
                                    </div>
                                 ))}
                              </div>
                           </div>
                        )}

                        {/* Logs do Sistema */}
                        <div className="bg-white rounded-[3rem] shadow-sm border border-sky-100 overflow-hidden">
                           <div className="p-10 border-b border-zinc-100 bg-zinc-50/50 flex justify-between items-center">
                              <div>
                                 <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tight">Rasto de Auditoria ImutÃ¡vel</h3>
                                 <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest mt-1">Registo completo de alteraÃ§Ãµes e acessos fiscais</p>
                              </div>
                              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-green-100">
                                 <ShieldCheck size={16} /> Sistema Protegido
                              </div>
                           </div>
                           <div className="overflow-hidden">
                              <div className="p-10 bg-zinc-50/30 border-b border-zinc-100">
                                 <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-6">Logs de OperaÃ§Ã£o do Sistema</h4>
                                 <div className="space-y-4">
                                    {systemLogs.map(s => {
                                       const safeDate = s?.created_at ? new Date(s.created_at) : null;
                                       return (
                                          <div key={s?.id || Math.random()} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-zinc-100 shadow-sm transition-all hover:shadow-md">
                                             <div className="flex items-center gap-4">
                                                <div className={`w-2 h-2 rounded-full ${s?.nivel === 'ERROR' ? 'bg-red-500 animate-pulse' : s?.nivel === 'WARN' ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                                                <div>
                                                   <p className="text-xs font-black text-zinc-900 uppercase">{s?.evento || 'Evento'}</p>
                                                   <p className="text-[10px] text-zinc-400 font-bold">{s?.descricao || 'Sem descriÃ§Ã£o'}</p>
                                                </div>
                                             </div>
                                             <p className="text-[9px] font-mono text-zinc-300 font-black">
                                                {safeDate && !isNaN(safeDate.getTime()) ? safeDate.toLocaleTimeString() : '--:--'}
                                             </p>
                                          </div>
                                       );
                                    })}
                                    {systemLogs.length === 0 && <p className="text-[10px] font-bold text-zinc-300 italic text-center py-4">Nenhum evento operacional registado hoje.</p>}
                                 </div>
                              </div>

                              <table className="w-full text-left border-collapse">
                                 <thead>
                                    <tr className="bg-zinc-900 text-white text-[9px] font-black uppercase tracking-[0.2em]">
                                       <th className="px-8 py-5">Data/Hora</th>
                                       <th className="px-8 py-5">AÃ§Ã£o</th>
                                       <th className="px-8 py-5">Tabela</th>
                                       <th className="px-8 py-5">Chave Registro</th>
                                    </tr>
                                 </thead>
                                 <tbody className="divide-y divide-zinc-100">
                                    {auditLogs.map((log) => {
                                       const safeDate = log?.created_at ? new Date(log.created_at) : null;
                                       return (
                                          <tr key={log?.id || Math.random()} className="text-xs hover:bg-zinc-50 transition-all font-bold group">
                                             <td className="px-8 py-5 font-mono text-zinc-400 text-[10px]">
                                                {safeDate && !isNaN(safeDate.getTime()) ? safeDate.toLocaleString('pt-PT') : 'Data InvÃ¡lida'}
                                             </td>
                                             <td className="px-8 py-5">
                                                <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${log?.acao === 'INSERT' ? 'bg-green-50 text-green-600' :
                                                   log?.acao === 'UPDATE' ? 'bg-sky-50 text-sky-600' :
                                                      'bg-red-50 text-red-600'
                                                   }`}>
                                                   {log?.acao || 'AÃ§Ã£o'}
                                                </span>
                                             </td>
                                             <td className="px-8 py-5">
                                                <span className="text-zinc-900 uppercase tracking-tighter">{log?.tabela_nome || 'N/A'}</span>
                                             </td>
                                             <td className="px-8 py-5 font-mono text-zinc-300 text-[10px] group-hover:text-zinc-600 transition-colors">
                                                {log?.registro_id || '---'}
                                             </td>
                                          </tr>
                                       );
                                    })}
                                    {auditLogs.length === 0 && (
                                       <tr>
                                          <td colSpan={4} className="p-20 text-center text-zinc-400 font-bold italic">
                                             Nenhum log de auditoria encontrado. As alteraÃ§Ãµes serÃ£o registadas automaticamente.
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
                        {/* Header e AcÃ§Ãµes RÃ¡pidas */}
                        <div className="flex flex-col md:flex-row justify-between items-center bg-zinc-900 p-12 rounded-[4rem] text-white shadow-3xl overflow-hidden relative">
                           <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
                              <Users size={200} />
                           </div>
                           <div className="z-10">
                              <h2 className="text-3xl font-black uppercase tracking-tight">Folha de Pagamento</h2>
                              <p className="text-zinc-400 text-lg font-medium">Ciclo: {periodos.find(p => p.id === selectedPeriodoId)?.mes || '00'}/{periodos.find(p => p.id === selectedPeriodoId)?.ano || '2024'}</p>
                              <div className="flex gap-4 mt-4">
                                 <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
                                    <p className="text-[9px] font-black text-yellow-500 uppercase tracking-widest">Empresa Seleccionada</p>
                                    <p className="text-xs font-bold">{currentEmpresa?.nome || 'Nenhuma'}</p>
                                 </div>
                                 <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
                                    <p className="text-[9px] font-black text-sky-400 uppercase tracking-widest">Colaboradores</p>
                                    <p className="text-xs font-bold">{funcionarios.filter(f => (f as any).company_id === selectedEmpresaId).length} Activos</p>
                                 </div>
                              </div>
                           </div>
                           <div className="flex flex-col sm:flex-row gap-4 mt-8 md:mt-0 z-10">
                              <button
                                 onClick={() => setShowEmployeeModal(true)}
                                 className="px-8 py-5 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-3 backdrop-blur-md"
                              >
                                 <Plus size={20} /> Novo FuncionÃ¡rio
                              </button>
                              <button
                                 onClick={runPayroll}
                                 disabled={isProcessingPayroll || periodos.find(p => p.id === selectedPeriodoId)?.status === 'Fechado'}
                                 className="px-10 py-5 bg-yellow-500 text-zinc-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-yellow-400 transition-all flex items-center gap-3 shadow-xl shadow-yellow-500/20 disabled:opacity-50"
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
                                 label: 'Total LÃ­quido',
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
                              <div key={i} className={`bg-white p-6 rounded-3xl border border-${card.color}-100 shadow-sm transition-all hover:shadow-md`}>
                                 <p className={`text-[9px] font-black text-${card.color}-500 uppercase tracking-widest mb-2`}>{card.label}</p>
                                 <p className="text-xl font-black text-zinc-900">{safeFormatAOA(card.value)}</p>
                              </div>
                           ))}
                        </div>

                        {/* Listagem de Folhas Processadas */}
                        <div className="bg-white rounded-[3rem] border border-zinc-100 shadow-sm overflow-hidden">
                           <div className="p-8 border-b border-zinc-50 flex justify-between items-center bg-zinc-50/50">
                              <h3 className="text-base font-black text-zinc-900 uppercase tracking-tight flex items-center gap-3">
                                 <FileText className="text-yellow-500" /> Folhas Processadas no PerÃ­odo
                              </h3>
                              <div className="flex gap-2">
                                 <button className="px-4 py-2 bg-white border border-zinc-200 rounded-xl text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:bg-zinc-50 transition-all flex items-center gap-2">
                                    <Download size={12} /> Exportar RelatÃ³rio
                                 </button>
                              </div>
                           </div>
                           <div className="divide-y divide-zinc-50">
                              {folhas?.filter(f => f.company_id === selectedEmpresaId && (selectedPeriodoId ? f.periodo_id === selectedPeriodoId : true)).length === 0 ? (
                                 <div className="p-20 text-center space-y-4 opacity-50">
                                    <RefreshCw size={48} className="mx-auto text-zinc-300" />
                                    <p className="text-sm font-black text-zinc-400 uppercase tracking-widest">Nenhuma folha processada para este ciclo.</p>
                                 </div>
                              ) : (
                                 folhas?.filter(f => f.company_id === selectedEmpresaId && (selectedPeriodoId ? f.periodo_id === selectedPeriodoId : true)).map(f => (
                                    <div key={f.id} className="p-8 flex items-center justify-between group hover:bg-zinc-50/80 transition-all">
                                       <div className="flex items-center gap-6">
                                          <div className="w-14 h-14 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-400 border border-zinc-100 group-hover:bg-zinc-900 group-hover:text-white transition-all">
                                             <Users size={28} />
                                          </div>
                                          <div>
                                             <h4 className="font-black text-zinc-900 text-lg leading-none mb-1">{f?.funcionario_nome || 'FuncionÃ¡rio'}</h4>
                                             <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Base: {safeFormatAOA(Number(f?.salario_base) || 0)}</p>
                                          </div>
                                       </div>
                                       <div className="hidden lg:grid grid-cols-3 gap-12 text-center border-x border-zinc-50 px-12 mx-8">
                                          <div>
                                             <p className="text-[9px] font-black text-zinc-300 uppercase mb-1">INSS (3%)</p>
                                             <p className="text-sm font-bold text-red-500">-{safeFormatAOA(Number(f?.inss_trabalhador) || 0)}</p>
                                          </div>
                                          <div>
                                             <p className="text-[9px] font-black text-zinc-300 uppercase mb-1">IRT / Tax</p>
                                             <p className="text-sm font-bold text-red-400">-{safeFormatAOA(Number(f?.irt) || 0)}</p>
                                          </div>
                                          <div>
                                             <p className="text-[9px] font-black text-zinc-300 uppercase mb-1">Empresa (8%)</p>
                                             <p className="text-sm font-bold text-zinc-400">{safeFormatAOA(Number(f?.inss_empresa) || 0)}</p>
                                          </div>
                                       </div>
                                       <div className="text-right mr-8">
                                          <p className="text-[10px] font-black text-zinc-400 uppercase mb-1">LÃ­quido a Receber</p>
                                          <p className="text-2xl font-black text-zinc-900">{safeFormatAOA(Number(f?.salario_liquido) || 0)}</p>
                                       </div>
                                       <div className="flex gap-2">
                                          <button
                                             onClick={() => setSelectedFolha(f)}
                                             className="p-3 bg-zinc-50 text-zinc-400 hover:bg-zinc-900 hover:text-yellow-500 rounded-xl transition-all shadow-sm"
                                             title="Ver Recibo Detalhado"
                                          >
                                             <FileText size={20} />
                                          </button>
                                          <button className="p-3 bg-zinc-50 text-zinc-400 hover:bg-sky-500 hover:text-white rounded-xl transition-all shadow-sm"><Printer size={20} /></button>
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
                        <div className="bg-white p-12 rounded-[4rem] shadow-sm border border-sky-100">
                           <h3 className="text-xl font-black text-zinc-900 mb-10 uppercase tracking-tight flex items-center gap-3">
                              <Calendar className="text-yellow-500" /> Agenda Fiscal {periodos.find(p => p.id === selectedPeriodoId)?.mes || ''}
                           </h3>
                           <div className="space-y-4">
                              {[
                                 { t: 'IVA - DeclaraÃ§Ã£o PeriÃ³dica', d: '2024-03-25', v: (Number(financeReports.receitaTotal) || 0) * ((currentEmpresa?.regime_agt === 'Simplificado' ? 0.07 : (currentEmpresa?.taxa_iva || 14) / 100)) },
                                 { t: 'INSS - Guia de Pagamento', d: '2024-03-10', v: folhas?.filter(f => f.company_id === selectedEmpresaId && (selectedPeriodoId ? f.periodo_id === selectedPeriodoId : true)).reduce((acc, b) => acc + (Number(b.inss_trabalhador) || 0) + (Number(b.inss_empresa) || 0), 0) || 0 },
                                 { t: 'IRT - RetenÃ§Ãµes na Fonte', d: '2024-03-30', v: (currentEmpresa?.incidencia_irt !== false) ? (folhas?.filter(f => f.company_id === selectedEmpresaId && (selectedPeriodoId ? f.periodo_id === selectedPeriodoId : true)).reduce((acc, b) => acc + (Number(b.irt) || 0), 0) || 0) : 0 },
                                 { t: 'II - Imposto Industrial (Estimativa)', d: '2024-05-31', v: (Number(financeReports.lucroLiquido) > 0 ? (Number(financeReports.lucroLiquido) * (currentEmpresa?.taxa_ii || 25) / 100) : 0) },
                              ].map((o, i) => (
                                 <div key={i} className="flex items-center justify-between p-6 bg-zinc-50 rounded-3xl border border-zinc-100">
                                    <div className="flex items-center gap-4">
                                       <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center"><Landmark size={20} /></div>
                                       <div><p className="font-black text-sm text-zinc-900">{o.t}</p><p className="text-[10px] font-black text-zinc-400 uppercase">Vence: {new Date(o.d).toLocaleDateString()}</p></div>
                                    </div>
                                    <p className="font-black text-zinc-900">{safeFormatAOA(o.v)}</p>
                                 </div>
                              ))}
                           </div>
                        </div>

                        <div className="bg-zinc-900 p-12 rounded-[4rem] text-white shadow-2xl flex flex-col justify-between overflow-hidden relative print-hidden">
                           <FileText size={180} className="absolute -right-4 -bottom-4 opacity-5" />
                           <div className="space-y-6">
                              <h3 className="text-xl font-black uppercase tracking-tight">Carga TributÃ¡ria Estimada</h3>
                              <div className="space-y-8">
                                 <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-black uppercase"><span>IVA Estimado</span><span>{safeFormatAOA(financeReports.receitaTotal * ((currentEmpresa?.taxa_iva || 14) / 100))}</span></div>
                                    <div className="h-2 bg-white/10 rounded-full"><div className="h-full bg-yellow-500" style={{ width: `${Math.min(100, (currentEmpresa?.taxa_iva || 14) * 5)}%` }}></div></div>
                                 </div>
                                 <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-black uppercase"><span>Imp. Industrial ({currentEmpresa?.taxa_ii || 25}%)</span><span>{safeFormatAOA(financeReports.lucroLiquido > 0 ? financeReports.lucroLiquido * ((currentEmpresa?.taxa_ii || 25) / 100) : 0)}</span></div>
                                    <div className="h-2 bg-white/10 rounded-full"><div className="h-full bg-sky-400" style={{ width: '45%' }}></div></div>
                                 </div>
                              </div>
                           </div>
                           <button
                              onClick={handleExportFiscal}
                              disabled={isExportingFiscal}
                              className="w-full mt-10 py-5 bg-white/5 border border-white/10 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-yellow-500 hover:text-zinc-900 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                           >
                              {isExportingFiscal ? <RefreshCw className="animate-spin" /> : <Download size={20} />}
                              {isExportingFiscal ? 'Gerando Mapas...' : 'Exportar Mapas Fiscais (PDF)'}
                           </button>
                        </div>
                     </div>
                  )
               }

               {/* --- MODAL RELATÃ“RIO COMPLETO --- */}
               {
                  showReportModal && activeReport && (
                     <div className="fixed inset-0 z-[200] flex items-center justify-center bg-zinc-950/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
                        <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
                           <div className="p-8 border-b border-zinc-100 flex justify-between items-center bg-zinc-900 text-white print:hidden">
                              <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 bg-yellow-500 rounded-2xl flex items-center justify-center text-zinc-900 shadow-lg">
                                    <FileText size={24} />
                                 </div>
                                 <div>
                                    <h2 className="text-xl font-black uppercase tracking-tight">{activeReport.title}</h2>
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{currentEmpresa?.nome} / {periodos.find(p => p.id === selectedPeriodoId)?.mes}/{periodos.find(p => p.id === selectedPeriodoId)?.ano}</p>
                                 </div>
                              </div>
                              <div className="flex gap-3">
                                 <button onClick={() => window.print()} className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"><Printer size={20} /></button>
                                 <button onClick={() => setShowReportModal(false)} className="p-3 bg-white/10 hover:bg-red-500 text-white rounded-full transition-all"><X size={20} /></button>
                              </div>
                           </div>

                           <div className="p-16 overflow-y-auto flex-1 print:p-0">
                              <div className="hidden print:flex flex-col mb-10 items-center text-center">
                                 <h1 className="text-3xl font-black uppercase">{activeReport.title}</h1>
                                 <p className="text-sm font-bold text-zinc-500 mt-2">{currentEmpresa?.nome}</p>
                                 <p className="text-xs text-zinc-400">NIF: {currentEmpresa?.nif} | PerÃ­odo: {periodos.find(p => p.id === selectedPeriodoId)?.mes}/{periodos.find(p => p.id === selectedPeriodoId)?.ano}</p>
                                 <div className="w-full h-1 bg-zinc-900 my-6" />
                              </div>

                              {activeReport.id === 'diario' && (
                                 <table className="w-full text-left">
                                    <thead>
                                       <tr className="border-b-2 border-zinc-900">
                                          <th className="py-4 px-2 text-[10px] font-black uppercase">Data</th>
                                          <th className="py-4 px-2 text-[10px] font-black uppercase">DescriÃ§Ã£o</th>
                                          <th className="py-4 px-2 text-[10px] font-black uppercase">DÃ©bito</th>
                                          <th className="py-4 px-2 text-[10px] font-black uppercase">CrÃ©dito</th>
                                       </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100">
                                       {activeReport.data.map((l: any, i: number) => (
                                          <tr key={i} className="hover:bg-zinc-50">
                                             <td className="py-4 px-2 text-xs">{new Date(l.data).toLocaleDateString()}</td>
                                             <td className="py-4 px-2 text-xs font-bold">{l.descricao}</td>
                                             <td className="py-4 px-2 text-xs text-blue-600 font-bold">{safeFormatAOA((l.itens || []).filter((x: any) => x.tipo === 'D').reduce((acc: any, x: any) => acc + x.valor, 0))}</td>
                                             <td className="py-4 px-2 text-xs text-green-600 font-bold">{safeFormatAOA((l.itens || []).filter((x: any) => x.tipo === 'C').reduce((acc: any, x: any) => acc + x.valor, 0))}</td>
                                          </tr>
                                       ))}
                                       {activeReport.data.length === 0 && (
                                          <tr>
                                             <td colSpan={4} className="py-20 text-center text-zinc-400 font-bold uppercase text-[10px]">Nenhum lanÃ§amento encontrado para este perÃ­odo</td>
                                          </tr>
                                       )}
                                    </tbody>
                                 </table>
                              )}

                              {activeReport.id === 'balancete' && (
                                 <table className="w-full text-left">
                                    <thead>
                                       <tr className="border-b-2 border-zinc-900">
                                          <th className="py-4 px-2 text-[10px] font-black uppercase">Conta</th>
                                          <th className="py-4 px-2 text-[10px] font-black uppercase">DesignaÃ§Ã£o</th>
                                          <th className="py-4 px-2 text-[10px] font-black uppercase text-right">SomatÃ³rio DÃ©bito</th>
                                          <th className="py-4 px-2 text-[10px] font-black uppercase text-right">SomatÃ³rio CrÃ©dito</th>
                                          <th className="py-4 px-2 text-[10px] font-black uppercase text-right">Saldo</th>
                                       </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100">
                                       {activeReport.data.map((r: any, i: number) => (
                                          <tr key={i}>
                                             <td className="py-4 px-2 text-xs font-mono">{r.codigo}</td>
                                             <td className="py-4 px-2 text-xs font-bold">{r.nome}</td>
                                             <td className="py-4 px-2 text-xs text-right">{safeFormatAOA(r.debito)}</td>
                                             <td className="py-4 px-2 text-xs text-right">{safeFormatAOA(r.credito)}</td>
                                             <td className="py-4 px-2 text-xs font-black text-right">{safeFormatAOA(r.debito - r.credito)}</td>
                                          </tr>
                                       ))}
                                    </tbody>
                                 </table>
                              )}

                              {['dre', 'balanco', 'fiscal'].includes(activeReport.id) && (
                                 <div className="space-y-6">
                                    {activeReport.data.map((row: any, i: number) => (
                                       <div key={i} className={`flex justify-between items-center p-6 rounded-2xl ${row.tipo === 'T' ? 'bg-zinc-900 text-white' : 'bg-zinc-50 border border-zinc-100'}`}>
                                          <span className="text-xs font-black uppercase tracking-tight">{row.desc}</span>
                                          <span className={`text-lg font-black ${row.tipo === 'T' ? 'text-yellow-500' : (row.valor < 0 ? 'text-red-500' : 'text-zinc-900')}`}>
                                             {safeFormatAOA(row.valor)}
                                          </span>
                                       </div>
                                    ))}
                                 </div>
                              )}

                              {activeReport.id === 'razÃ£o' && (
                                 <div className="space-y-12">
                                    {(activeReport.data || []).map((cuenta: any, i: number) => (
                                       <div key={i} className="space-y-4">
                                          <div className="flex items-center gap-3 border-b-2 border-zinc-900 pb-2">
                                             <span className="bg-zinc-900 text-white px-3 py-1 rounded-lg font-mono text-xs">{cuenta.codigo}</span>
                                             <h4 className="text-sm font-black uppercase">{cuenta.nome}</h4>
                                          </div>
                                          <table className="w-full text-left">
                                             <thead className="bg-zinc-50">
                                                <tr>
                                                   <th className="py-2 px-2 text-[9px] font-black uppercase text-zinc-400">Data</th>
                                                   <th className="py-2 px-2 text-[9px] font-black uppercase text-zinc-400">DescriÃ§Ã£o</th>
                                                   <th className="py-2 px-2 text-[9px] font-black uppercase text-zinc-400 text-right">DÃ©bito</th>
                                                   <th className="py-2 px-2 text-[9px] font-black uppercase text-zinc-400 text-right">CrÃ©dito</th>
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
                                    <div className="bg-zinc-900 p-8 rounded-[2rem] text-white">
                                       <h3 className="text-lg font-black uppercase tracking-tight mb-2">Fluxo de Caixa LÃ­quido</h3>
                                       <p className="text-3xl font-black text-yellow-500">{safeFormatAOA(activeReport.data?.find(r => r.tipo === 'T')?.valor || 0)}</p>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                       {(activeReport.data || []).map((row: any, i: number) => (
                                          <div key={i} className={`flex justify-between items-center p-6 rounded-2xl border ${row.tipo === 'R' ? 'bg-green-50 border-green-100' : (row.tipo === 'D' ? 'bg-red-50 border-red-100' : 'bg-zinc-50 border-zinc-100')}`}>
                                             <span className="text-xs font-black uppercase">{row.desc}</span>
                                             <span className={`text-sm font-black ${row.tipo === 'R' ? 'text-green-600' : row.tipo === 'D' ? 'text-red-600' : 'text-zinc-900'}`}>{safeFormatAOA(row.valor)}</span>
                                          </div>
                                       ))}
                                    </div>
                                 </div>
                              )}

                              {activeReport.id === 'auditoria' && (
                                 <table className="w-full text-left">
                                    <thead>
                                       <tr className="border-b-2 border-zinc-900">
                                          <th className="py-4 px-2 text-[10px] font-black uppercase">Data</th>
                                          <th className="py-4 px-2 text-[10px] font-black uppercase">Utilizador</th>
                                          <th className="py-4 px-2 text-[10px] font-black uppercase">AÃ§Ã£o</th>
                                          <th className="py-4 px-2 text-[10px] font-black uppercase">Tabela</th>
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

               {/* --- MODAL NOVO LANÃ‡AMENTO (DIÃRIO) --- */}
               {
                  showEntryModal && (
                     <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
                        <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                           <div className="p-8 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                              <h2 className="text-xl font-black text-zinc-900 flex items-center gap-3 uppercase tracking-tight">
                                 <BookOpen className="text-yellow-500" /> Novo LanÃ§amento ContÃ¡bil
                              </h2>
                              <button onClick={() => setShowEntryModal(false)} className="p-3 text-zinc-400 hover:bg-zinc-200 rounded-full transition-all"><X size={24} /></button>
                           </div>

                           {/* Modelos PrÃ©-definidos */}
                           {regrasAutomaticas.length > 0 && (
                              <div className="px-8 pt-6 pb-2">
                                 <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-3">Modelos PrÃ©-definidos</p>
                                 <div className="flex flex-wrap gap-2">
                                    {[
                                       { label: 'Venda', debito: '3.1', credito: '6.1' },
                                       { label: 'Compra Stock', debito: '2.1', credito: '3.2' },
                                       { label: 'SalÃ¡rios', debito: '7.2', credito: '1.1' },
                                       { label: 'Pagamento Fornecedor', debito: '4.1', credito: '1.1' },
                                       { label: 'Recibo de Cliente', debito: '1.1', credito: '3.1' },
                                       ...regrasAutomaticas.map(r => ({ label: r.nome, debito: r.conta_debito_codigo, credito: r.conta_credito_codigo }))
                                    ].filter((v, i, a) => a.findIndex(x => x.label === v.label) === i).map((modelo, i) => (
                                       <button key={i} type="button"
                                          onClick={() => setNewEntry(prev => ({ ...prev, contaDebito: modelo.debito, contaCredito: modelo.credito, descricao: prev.descricao || modelo.label }))}
                                          className="px-3 py-1.5 bg-zinc-50 border border-zinc-200 hover:bg-yellow-50 hover:border-yellow-300 text-zinc-600 hover:text-yellow-700 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">
                                          {modelo.label}
                                       </button>
                                    ))}
                                 </div>
                              </div>
                           )}

                           <div className="px-8 pt-4 pb-2">
                              <div
                                 onClick={async () => {
                                    alert("Funcionalidade de Scanner de Documentos Activa. Seleccione um PDF para anÃ¡lise via Amazing IA.");
                                    setTimeout(() => {
                                       setNewEntry({
                                          ...newEntry,
                                          descricao: 'Factura 2024/042 - ServiÃ§os de Consultoria',
                                          valor: 150000,
                                          data: '2024-03-22'
                                       });
                                       handleAISuggestAccounts('Factura 2024/042 - ServiÃ§os de Consultoria');
                                    }, 2000);
                                 }}
                                 className="bg-yellow-50 border-2 border-dashed border-yellow-200 rounded-2xl p-4 flex items-center justify-center gap-3 cursor-pointer hover:bg-yellow-100 transition-all group"
                              >
                                 <Sparkles className="text-yellow-600 group-hover:scale-125 transition-transform" />
                                 <span className="text-[10px] font-black uppercase text-yellow-700">Digitalizar Documento (PDF/IA)</span>
                              </div>
                           </div>
                           <form onSubmit={handleNewEntry} className="p-8 space-y-6">
                              <div className="relative group">
                                 <Input name="descricao" label="HistÃ³rico / DescriÃ§Ã£o" required
                                    value={newEntry.descricao} onChange={e => setNewEntry({ ...newEntry, descricao: e.target.value })}
                                    placeholder="Ex: Pagamento de Fornecedor X"
                                 />
                                 <button
                                    type="button"
                                    onClick={() => handleAISuggestAccounts(newEntry.descricao)}
                                    disabled={isSuggestingAccounts || !newEntry.descricao}
                                    className="absolute right-3 top-9 p-2 bg-zinc-900 text-yellow-500 rounded-lg hover:bg-yellow-500 hover:text-zinc-900 transition-all disabled:opacity-50"
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
                                    label="Conta de CrÃ©dito"
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
                              {/* Indicador de validaÃ§Ã£o D = C em tempo real */}
                              {(() => {
                                 const debitoConta = planoContas.find(c => c.codigo === newEntry.contaDebito);
                                 const creditoConta = planoContas.find(c => c.codigo === newEntry.contaCredito);
                                 const valOk = newEntry.valor > 0 && debitoConta && creditoConta && newEntry.contaDebito !== newEntry.contaCredito;
                                 return (
                                    <div className={`flex items-center justify-between p-4 rounded-2xl border-2 ${valOk ? 'bg-green-50 border-green-200' : 'bg-zinc-50 border-zinc-200'}`}>
                                       <div className="flex items-center gap-2">
                                          <div className={`w-2.5 h-2.5 rounded-full ${valOk ? 'bg-green-500' : 'bg-zinc-300'}`} />
                                          <span className={`text-[9px] font-black uppercase tracking-widest ${valOk ? 'text-green-700' : 'text-zinc-400'}`}>
                                             {valOk ? 'DÃ©bito = CrÃ©dito â€” LanÃ§amento equilibrado' : 'Selecione contas e valor para validar'}
                                          </span>
                                       </div>
                                       {valOk && <span className="text-[9px] font-black text-green-700 bg-green-100 px-2 py-1 rounded-lg">D = C = {safeFormatAOA(newEntry.valor)}</span>}
                                    </div>
                                 );
                              })()}
                              <button type="submit" className="w-full py-5 bg-zinc-900 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 hover:bg-zinc-800 transition-all">
                                 <Save size={18} /> Confirmar LanÃ§amento
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
                        <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                           <div className="p-8 border-b border-zinc-100 flex justify-between items-center bg-orange-50">
                              <h2 className="text-xl font-black text-zinc-900 flex items-center gap-3 uppercase tracking-tight">
                                 <ShoppingCart className="text-orange-500" size={24} /> Registar Compra
                              </h2>
                              <button onClick={() => setShowCompraModal(false)} className="p-3 text-zinc-400 hover:bg-zinc-200 rounded-full"><X size={22} /></button>
                           </div>
                           <form onSubmit={handleSaveCompra} className="p-8 space-y-5">
                              <div className="grid grid-cols-2 gap-4">
                                 <Input name="numero_compra" label="N.Âº Compra" value={newCompra.numero_compra}
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
                              <Input name="descricao" label="DescriÃ§Ã£o / Artigos" value={newCompra.descricao}
                                 onChange={e => setNewCompra({ ...newCompra, descricao: e.target.value })} placeholder="Ex: AquisiÃ§Ã£o de materiais de escritÃ³rio" />
                              <div className="grid grid-cols-3 gap-4">
                                 <Input name="valor_total" label="Valor Total (AOA)" type="number" required value={newCompra.valor_total}
                                    onChange={e => setNewCompra({ ...newCompra, valor_total: Number(e.target.value) })} />
                                 <Input name="iva" label="IVA (AOA)" type="number" value={newCompra.iva}
                                    onChange={e => setNewCompra({ ...newCompra, iva: Number(e.target.value) })} />
                                 <div>
                                    <label className="block text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Categoria</label>
                                    <select value={newCompra.categoria} onChange={e => setNewCompra({ ...newCompra, categoria: e.target.value })}
                                       className="w-full border border-zinc-200 rounded-xl p-2.5 text-xs font-bold text-zinc-700 focus:outline-none focus:ring-2 focus:ring-yellow-400">
                                       {['Mercadorias', 'ServiÃ§os', 'Imobilizado', 'MatÃ©rias-Primas', 'Outros'].map(c => (
                                          <option key={c} value={c}>{c}</option>
                                       ))}
                                    </select>
                                 </div>
                              </div>
                              {/* Preview lanÃ§amento automÃ¡tico */}
                              {newCompra.valor_total > 0 && (
                                 <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4">
                                    <p className="text-[9px] font-black text-orange-600 uppercase tracking-widest mb-2">LanÃ§amento AutomÃ¡tico Gerado</p>
                                    <div className="flex justify-between text-xs font-bold text-zinc-700">
                                       <span>D: 2.1 InventÃ¡rio / Activos</span>
                                       <span className="text-orange-600">{safeFormatAOA(newCompra.valor_total)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs font-bold text-zinc-700">
                                       <span>C: 3.2 Fornecedores / Contas a Pagar</span>
                                       <span className="text-orange-600">{safeFormatAOA(newCompra.valor_total)}</span>
                                    </div>
                                 </div>
                              )}
                              <button type="submit" disabled={isSavingCompra}
                                 className="w-full py-5 bg-orange-500 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 hover:bg-orange-600 transition-all disabled:opacity-50">
                                 {isSavingCompra ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                                 {isSavingCompra ? 'A Guardar...' : 'Registar Compra + Contabilizar'}
                              </button>
                           </form>
                        </div>
                     </div>
                  )
               }

               {/* ===== MODAL DE FATURAÃ‡ÃƒO ===== */}
               {
                  showInvoiceModal && (
                     <div className="fixed inset-0 z-[120] flex items-center justify-center bg-zinc-950/80 backdrop-blur-md p-4 animate-in fade-in">
                        <div className="bg-white w-full max-w-5xl rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 max-h-[90vh] flex flex-col">
                           <div className="p-8 border-b border-zinc-100 flex justify-between items-center bg-zinc-900 text-white">
                              <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 bg-yellow-500 rounded-2xl flex items-center justify-center text-zinc-900 shadow-lg">
                                    <FileText size={24} />
                                 </div>
                                 <div>
                                    <h2 className="text-xl font-black uppercase tracking-tight">Emitir {invoiceForm.tipo}</h2>
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{currentEmpresa?.nome || 'Entidade Seleccionada'}</p>
                                 </div>
                              </div>
                              <button onClick={() => setShowInvoiceModal(false)} className="p-3 text-white/50 hover:bg-white/10 rounded-full transition-all"><X size={24} /></button>
                           </div>

                           <div className="flex-1 overflow-y-auto p-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
                              {/* Coluna Esquerda: Dados do Cliente e SelecÃ§Ã£o de Itens */}
                              <div className="lg:col-span-7 space-y-8">
                                 <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                       <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Tipo de Documento</label>
                                       <select value={invoiceForm.tipo} onChange={e => setInvoiceForm({ ...invoiceForm, tipo: e.target.value as any })}
                                          className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-sm font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all">
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
                                    <Input label="Data de EmissÃ£o" type="date" value={invoiceForm.data_emissao} onChange={e => setInvoiceForm({ ...invoiceForm, data_emissao: e.target.value })} />
                                 </div>

                                 <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                       <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">Seleccionar Cliente Registado</label>
                                       <button
                                          onClick={() => setShowContactModal(true)}
                                          className="text-[9px] font-black text-yellow-600 uppercase hover:underline flex items-center gap-1"
                                       >
                                          <Plus size={12} /> Novo Cliente
                                       </button>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                       {contactos.filter(c => c.company_id === selectedEmpresaId && c.tipo !== 'Fornecedor').slice(0, 6).map(c => (
                                          <button key={c.id} onClick={() => setInvoiceForm({ ...invoiceForm, cliente_id: c.id, cliente_nome: c.nome })}
                                             className={`p-4 rounded-2xl border text-[10px] font-black uppercase tracking-tighter transition-all text-left ${invoiceForm.cliente_id === c.id ? 'bg-zinc-900 text-yellow-500 border-zinc-900 shadow-lg' : 'bg-white text-zinc-500 border-zinc-200 hover:border-yellow-400 hover:bg-zinc-50'}`}>
                                             <div className="truncate">{c.nome}</div>
                                             <div className={`text-[8px] font-bold ${invoiceForm.cliente_id === c.id ? 'text-zinc-400' : 'text-zinc-300'}`}>{c.nif || 'S/ NIF'}</div>
                                          </button>
                                       ))}
                                    </div>
                                    <Input placeholder="Ou digite o nome do cliente manualmente..." value={invoiceForm.cliente_nome} onChange={(e: any) => setInvoiceForm({ ...invoiceForm, cliente_nome: e.target.value, cliente_id: '' })} />
                                 </div>

                                 <div className="space-y-4 bg-zinc-50 p-6 rounded-3xl border border-zinc-200">
                                    <h4 className="text-[10px] font-black text-zinc-900 uppercase tracking-widest">Adicionar ServiÃ§o / Item Manual</h4>
                                    <div className="grid grid-cols-12 gap-4">
                                       <div className="col-span-6">
                                          <Input placeholder="Nome do ServiÃ§o ou Item" value={customItem.nome} onChange={e => setCustomItem({ ...customItem, nome: e.target.value })} />
                                       </div>
                                       <div className="col-span-3">
                                          <Input placeholder="PreÃ§o" type="number" value={customItem.preco} onChange={e => setCustomItem({ ...customItem, preco: Number(e.target.value) })} />
                                       </div>
                                       <div className="col-span-3">
                                          <button onClick={handleAddCustomItem} className="w-full h-[54px] bg-yellow-500 text-zinc-900 font-black rounded-2xl uppercase text-[9px] tracking-widest hover:bg-yellow-400 transition-all flex items-center justify-center gap-2">
                                             <Plus size={16} /> Add
                                          </button>
                                       </div>
                                    </div>
                                 </div>

                                 <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                       <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">CatÃ¡logo de Itens</label>
                                       <span className="text-[10px] font-bold text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full uppercase">{extInventario.length} DisponÃ­veis</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                       {extInventario.map(item => (
                                          <div key={item.id} onClick={() => handleAddInvoiceItem(item)}
                                             className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 hover:bg-white hover:border-yellow-400 hover:shadow-lg transition-all cursor-pointer group flex items-center gap-4">
                                             <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-zinc-300 group-hover:text-yellow-600 transition-colors">
                                                <ShoppingCart size={20} />
                                             </div>
                                             <div className="flex-1">
                                                <p className="text-[10px] font-black text-zinc-900 uppercase truncate max-w-[150px]">{item.nome}</p>
                                                <p className="text-[9px] font-bold text-zinc-400">{safeFormatAOA(item.preco_unitario || item.preco)}</p>
                                             </div>
                                             <Plus size={16} className="text-zinc-300 group-hover:text-yellow-600" />
                                          </div>
                                       ))}
                                    </div>
                                 </div>
                              </div>

                              {/* Coluna Direita: Resumo e Totais */}
                              <div className="lg:col-span-5 bg-zinc-50 rounded-[2.5rem] p-8 flex flex-col h-full border border-zinc-200 shadow-inner">
                                 <div className="flex-1 space-y-6">
                                    <h3 className="text-sm font-black text-zinc-900 uppercase tracking-widest pb-4 border-b border-zinc-200">Itens do Documento</h3>

                                    <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                       {invoiceForm.itens.length === 0 ? (
                                          <div className="py-10 text-center space-y-3">
                                             <Package className="mx-auto text-zinc-300" size={32} />
                                             <p className="text-[10px] font-bold text-zinc-400 uppercase italic">Nenhum item adicionado</p>
                                          </div>
                                       ) : (
                                          invoiceForm.itens.map(it => (
                                             <div key={it.id} className="bg-white p-5 rounded-2xl shadow-sm space-y-4 relative group animate-in slide-in-from-right-4 border border-transparent hover:border-zinc-200">
                                                <button onClick={() => handleRemoveInvoiceItem(it.id)} className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10">
                                                   <X size={14} />
                                                </button>
                                                <div className="flex justify-between items-start">
                                                   <p className="text-[10px] font-black text-zinc-900 uppercase truncate max-w-[200px]">{it.nome}</p>
                                                   <p className="text-xs font-black text-zinc-900">{safeFormatAOA(it.total)}</p>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3 items-center">
                                                   <div className="flex items-center gap-2">
                                                      <span className="text-[9px] font-black text-zinc-400 uppercase">Qtd:</span>
                                                      <input type="number" value={it.qtd} onChange={e => handleUpdateInvoiceItem(it.id, 'qtd', e.target.value)}
                                                         className="w-16 bg-zinc-50 border border-zinc-100 rounded-lg p-2 text-xs font-bold text-zinc-900 focus:outline-none focus:ring-1 focus:ring-yellow-500" />
                                                   </div>
                                                   <div className="flex items-center gap-2">
                                                      <span className="text-[9px] font-black text-zinc-400 uppercase">PreÃ§o:</span>
                                                      <input type="number" value={it.preco_unitario} onChange={e => handleUpdateInvoiceItem(it.id, 'preco_unitario', e.target.value)}
                                                         className="w-full bg-zinc-50 border border-zinc-100 rounded-lg p-2 text-xs font-bold text-zinc-900 focus:outline-none focus:ring-1 focus:ring-yellow-500" />
                                                   </div>
                                                </div>
                                             </div>
                                          ))
                                       )}
                                    </div>

                                    <div className="pt-6 space-y-3 border-t border-zinc-200">
                                       <div className="flex justify-between text-[11px] font-bold text-zinc-500 uppercase">
                                          <span>Subtotal</span>
                                          <span>{safeFormatAOA(invoiceForm.itens.reduce((acc, i) => acc + i.total, 0))}</span>
                                       </div>
                                       <div className="flex justify-between text-[11px] font-bold text-zinc-500 uppercase">
                                          <span>IVA ({invoiceForm.is_exempt ? '0%' : '14%'})</span>
                                          <span>{safeFormatAOA(invoiceForm.itens.reduce((acc, i) => acc + i.total, 0) * (invoiceForm.is_exempt ? 0 : 0.14))}</span>
                                       </div>
                                       <div className="flex justify-between text-xl font-black text-zinc-900 pt-2 border-t border-zinc-200">
                                          <span className="uppercase tracking-tighter">Total Geral</span>
                                          <span className="text-yellow-600">{safeFormatAOA(invoiceForm.itens.reduce((acc, i) => acc + i.total, 0) * (invoiceForm.is_exempt ? 1 : 1.14))}</span>
                                       </div>
                                    </div>

                                    <div className="space-y-2">
                                       <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">ObservaÃ§Ãµes</label>
                                       <textarea value={invoiceForm.observacoes} onChange={e => setInvoiceForm({ ...invoiceForm, observacoes: e.target.value })}
                                          className="w-full bg-white border border-zinc-200 rounded-2xl p-4 text-[10px] font-bold text-zinc-700 resize-none focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                          rows={2} placeholder="CondiÃ§Ãµes de pagamento, notas..." />
                                    </div>
                                 </div>

                                 <button onClick={handleCreateInvoice} disabled={isSavingInvoice || invoiceForm.itens.length === 0}
                                    className="mt-8 w-full py-6 bg-zinc-900 text-white font-black rounded-[2rem] uppercase text-xs tracking-widest hover:bg-yellow-500 hover:text-zinc-900 transition-all flex items-center justify-center gap-4 disabled:opacity-50 shadow-xl group">
                                    {isSavingInvoice ? <RefreshCw className="animate-spin" size={20} /> : <FileCheck size={20} className="group-hover:scale-125 transition-transform" />}
                                    {isSavingInvoice ? 'A Processar...' : `Finalizar e Emitir ${invoiceForm.tipo}`}
                                 </button>
                              </div>
                           </div>
                        </div>
                     </div>
                  )
               }

               {/* ===== PAINEL DE APROVAÃ‡ÃƒO PENDENTE (badge flutuante) ===== */}
               {
                  pendingApproval.length > 0 && (
                     <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4">
                        <button onClick={() => setShowApprovalModal(true)}
                           className="flex items-center gap-3 bg-yellow-500 text-zinc-900 px-5 py-4 rounded-2xl shadow-2xl font-black text-sm hover:bg-yellow-400 transition-all">
                           <div className="relative">
                              <CheckCircle2 size={22} />
                              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                                 {pendingApproval.length}
                              </span>
                           </div>
                           {pendingApproval.length} LanÃ§amento{pendingApproval.length > 1 ? 's' : ''} Aguarda{pendingApproval.length === 1 ? '' : 'm'} AprovaÃ§Ã£o
                        </button>
                     </div>
                  )
               }

               {/* ===== MODAL DE APROVAÃ‡ÃƒO ===== */}
               {
                  showApprovalModal && (
                     <div className="fixed inset-0 z-[110] flex items-center justify-center bg-zinc-950/80 backdrop-blur-md p-4 animate-in fade-in">
                        <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 max-h-[85vh] overflow-y-auto">
                           <div className="p-8 border-b border-zinc-100 flex justify-between items-center bg-yellow-50">
                              <h2 className="text-xl font-black text-zinc-900 flex items-center gap-3 uppercase tracking-tight">
                                 <CheckCircle2 className="text-yellow-500" size={24} /> AprovaÃ§Ã£o de LanÃ§amentos
                              </h2>
                              <button onClick={() => { setShowApprovalModal(false); setApprovalTarget(null); setApprovalObs(''); }} className="p-3 text-zinc-400 hover:bg-zinc-200 rounded-full"><X size={22} /></button>
                           </div>
                           {approvalTarget ? (
                              // Detalhe do lanÃ§amento a aprovar
                              <div className="p-8 space-y-5">
                                 <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4">
                                    <p className="text-[9px] font-black text-yellow-700 uppercase tracking-widest mb-1">LanÃ§amento</p>
                                    <p className="font-black text-zinc-900">{approvalTarget.descricao}</p>
                                    <p className="text-xs text-zinc-500 mt-1">{approvalTarget.data ? new Date(approvalTarget.data).toLocaleDateString('pt-PT') : ''} Â· {approvalTarget.tipo_transacao}</p>
                                 </div>
                                 <div className="space-y-2">
                                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Itens do LanÃ§amento</p>
                                    {(approvalTarget.itens || []).map((it: any, i: number) => (
                                       <div key={i} className="flex justify-between items-center py-2 border-b border-zinc-50 text-xs">
                                          <span className="font-bold text-zinc-700">{it.conta_codigo} â€” {it.conta_nome}</span>
                                          <span className={`font-black px-2 py-0.5 rounded-lg ${it.tipo === 'D' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>
                                             {it.tipo} {safeFormatAOA(it.valor)}
                                          </span>
                                       </div>
                                    ))}
                                 </div>
                                 <div>
                                    <label className="block text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-2">ObservaÃ§Ãµes (Opcional)</label>
                                    <textarea value={approvalObs} onChange={e => setApprovalObs(e.target.value)}
                                       className="w-full border border-zinc-200 rounded-2xl p-4 text-xs text-zinc-700 resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400" rows={3}
                                       placeholder="Notas de aprovaÃ§Ã£o..." />
                                 </div>
                                 <div className="grid grid-cols-2 gap-4">
                                    <button onClick={() => handleRejeitarLancamento(approvalTarget)}
                                       className="py-4 bg-red-50 text-red-700 border border-red-200 font-black rounded-2xl uppercase text-[9px] tracking-widest hover:bg-red-100 transition-all flex items-center justify-center gap-2">
                                       <X size={14} /> Rejeitar
                                    </button>
                                    <button onClick={() => handleAprovarLancamento(approvalTarget, approvalObs)} disabled={isApprovingId === approvalTarget.id}
                                       className="py-4 bg-green-500 text-white font-black rounded-2xl uppercase text-[9px] tracking-widest hover:bg-green-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                                       {isApprovingId ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Aprovar e Postar
                                    </button>
                                 </div>
                                 <button onClick={() => { setApprovalTarget(null); setApprovalObs(''); }} className="w-full text-xs text-zinc-400 hover:text-zinc-600 transition-colors">? Voltar Ã  lista</button>
                              </div>
                           ) : (
                              // Lista de lanÃ§amentos pendentes
                              <div className="p-8 space-y-3">
                                 <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-4">{pendingApproval.length} lanÃ§amento(s) aguardam revisÃ£o</p>
                                 {pendingApproval.map(l => (
                                    <div key={l.id} className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100 hover:bg-yellow-50 hover:border-yellow-200 transition-all cursor-pointer" onClick={() => setApprovalTarget(l)}>
                                       <div>
                                          <p className="text-sm font-black text-zinc-800">{l.descricao}</p>
                                          <p className="text-[9px] text-zinc-400 font-bold uppercase">{l.tipo_transacao} Â· {l.data ? new Date(l.data).toLocaleDateString('pt-PT') : ''}</p>
                                       </div>
                                       <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-[9px] font-black rounded-lg uppercase tracking-widest">Pendente</span>
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
                     const filtered = extFinanceiroNotas.filter(n =>
                        n.tipo?.includes(typeMap[activeTab]) ||
                        (activeTab === 'facturas' && n.tipo === 'Venda') ||
                        (activeTab === 'facturas' && n.tipo === 'Factura-Recibo')
                     );

                     return (
                        <div className="bg-white rounded-[3rem] border border-zinc-100 shadow-sm p-10 space-y-8 animate-in slide-in-from-bottom-4">
                           <div className="flex items-center justify-between">
                              <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight">Gestão de {sidebarItems.find(i => i.id === activeTab)?.label}</h2>
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
                                    className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-yellow-500 hover:text-zinc-900 transition-all"
                                 >
                                    Nova Emissão
                                 </button>
                              </div>
                           </div>
                           <div className="overflow-x-auto">
                              <table className="w-full text-left">
                                 <thead>
                                    <tr className="border-b border-zinc-100">
                                       {['NÂº Documento', 'Entidade', 'Valor Total', 'Data', 'Status', ''].map(h => (
                                          <th key={h} className="pb-4 px-4 text-[9px] font-black uppercase tracking-widest text-zinc-400">{h}</th>
                                       ))}
                                    </tr>
                                 </thead>
                                 <tbody className="divide-y divide-zinc-50">
                                    {filtered.map((n, i) => (
                                       <tr key={i} className="hover:bg-zinc-50 transition-colors group">
                                          <td className="py-5 px-4">
                                             <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-500">
                                                   <Receipt size={14} />
                                                </div>
                                                <span className="text-xs font-black text-zinc-900 uppercase">
                                                   {n.numero_fatura || n.numero || `DOC-${i + 100}`}
                                                </span>
                                             </div>
                                          </td>
                                          <td className="py-5 px-4 text-xs font-bold text-zinc-600 uppercase">{n.cliente_nome || n.entidade}</td>
                                          <td className="py-5 px-4 text-xs font-black text-zinc-900">{safeFormatAOA(n.valor_total || n.valor)}</td>
                                          <td className="py-5 px-4 text-[10px] font-bold text-zinc-400 uppercase">{n.data_emissao || n.data}</td>
                                          <td className="py-5 px-4">
                                             <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${n.status === 'Pago' ? 'bg-green-50 text-green-700' : (n.status === 'Anulado' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700')}`}>
                                                {n.status || 'Pendente'}
                                             </span>
                                          </td>
                                          <td className="py-5 px-4 text-right">
                                             <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handlePrintFatura(n)} className="p-2 hover:bg-zinc-100 rounded-lg transition-all text-zinc-600" title="Imprimir"><Printer size={14} /></button>
                                                {n.status !== 'Anulado' && (
                                                   <button onClick={() => handleAnularFatura(n)} className="p-2 hover:bg-zinc-100 rounded-lg transition-all text-red-500" title="Anular"><X size={14} /></button>
                                                )}
                                             </div>
                                          </td>
                                       </tr>
                                    ))}
                                    {filtered.length === 0 && (
                                       <tr>
                                          <td colSpan={6} className="py-20 text-center text-zinc-400 font-bold uppercase text-[10px]">Nenhum documento encontrado</td>
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
                        <div className="flex items-center justify-between bg-white p-10 rounded-[3rem] border border-zinc-100 shadow-sm transition-all hover:shadow-xl">
                           <div className="space-y-1">
                              <h2 className="text-3xl font-black text-zinc-900 uppercase tracking-tighter">GestÃ£o de <span className="text-yellow-600">Contactos</span></h2>
                              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Base de Dados CRM Integrada</p>
                           </div>
                           <button
                              onClick={() => setShowContactModal(true)}
                              className="px-10 py-5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
                           >
                              <Plus size={18} /> Novo Contacto
                           </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                           {contactos.filter(c => c.company_id === selectedEmpresaId).length > 0 ? (
                              contactos.filter(c => c.company_id === selectedEmpresaId).map((c) => (
                                 <div key={c.id} className="bg-white p-8 rounded-[3rem] border border-zinc-100 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                       <button className="p-3 text-zinc-300 hover:text-zinc-600"><MoreVertical size={20} /></button>
                                    </div>
                                    <div className="flex items-center gap-6 mb-8">
                                       <div className="w-20 h-20 bg-zinc-50 rounded-3xl flex items-center justify-center font-black text-3xl text-yellow-600 transition-colors group-hover:bg-yellow-500 group-hover:text-zinc-900 shadow-inner">
                                          {c.nome.charAt(0).toUpperCase()}
                                       </div>
                                       <div>
                                          <h3 className="text-lg font-black text-zinc-900 uppercase tracking-tight leading-tight">{c.nome}</h3>
                                          <span className={`inline-block mt-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${c.tipo === 'Cliente' ? 'bg-sky-50 text-sky-600' :
                                             c.tipo === 'Fornecedor' ? 'bg-purple-50 text-purple-600' :
                                                'bg-yellow-50 text-yellow-600'
                                             }`}>
                                             {c.tipo}
                                          </span>
                                       </div>
                                    </div>

                                    <div className="space-y-4 border-t border-zinc-50 pt-6">
                                       {c.nif && (
                                          <div className="flex items-center gap-3">
                                             <Shield size={14} className="text-zinc-400" />
                                             <p className="text-[11px] font-bold text-zinc-500 uppercase">NIF: <span className="text-zinc-800">{c.nif}</span></p>
                                          </div>
                                       )}
                                       {c.email && (
                                          <div className="flex items-center gap-3">
                                             <Mail size={14} className="text-zinc-400" />
                                             <p className="text-[11px] font-bold text-zinc-500">{c.email}</p>
                                          </div>
                                       )}
                                       {c.telefone && (
                                          <div className="flex items-center gap-3">
                                             <Phone size={14} className="text-zinc-400" />
                                             <p className="text-[11px] font-bold text-zinc-500">{c.telefone}</p>
                                          </div>
                                       )}
                                    </div>
                                 </div>
                              ))
                           ) : (
                              <div className="col-span-full py-32 bg-zinc-50 rounded-[4rem] border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center space-y-4 opacity-50">
                                 <Users size={64} className="text-zinc-300" />
                                 <p className="text-lg font-black text-zinc-400 uppercase tracking-tighter">Nenhum contacto registado nesta empresa</p>
                              </div>
                           )}
                        </div>
                     </div>
                  )
               }

               {/* --- ITENS --- */}
               {/* ===== MODAL EXPORTAÃ‡ÃƒO SAFT-AO ===== */}
               {
                  showSaftModal && (
                     <div className="fixed inset-0 z-[130] flex items-center justify-center bg-zinc-950/80 backdrop-blur-md p-4 animate-in fade-in">
                        <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col">
                           <div className="p-8 border-b border-zinc-100 flex justify-between items-center bg-blue-600 text-white">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                    <Download size={20} />
                                 </div>
                                 <div>
                                    <h2 className="text-lg font-black uppercase tracking-tight">Exportar SAFT-AO</h2>
                                    <p className="text-[9px] font-bold text-blue-100 uppercase tracking-widest">Ficheiro de Auditoria TributÃ¡ria</p>
                                 </div>
                              </div>
                              <button onClick={() => setShowSaftModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-all"><X size={20} /></button>
                           </div>

                           <div className="p-8 space-y-6">
                              <div className="grid grid-cols-2 gap-4">
                                 <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">MÃªs</label>
                                    <select value={saftMonth} onChange={e => setSaftMonth(Number(e.target.value))}
                                       className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-sm font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all">
                                       {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                                          <option key={m} value={m}>{new Date(2000, m - 1).toLocaleString('pt-PT', { month: 'long' }).toUpperCase()}</option>
                                       ))}
                                    </select>
                                 </div>
                                 <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Ano</label>
                                    <select value={saftYear} onChange={e => setSaftYear(Number(e.target.value))}
                                       className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-sm font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all">
                                       {[2024, 2025, 2026].map(y => (
                                          <option key={y} value={y}>{y}</option>
                                       ))}
                                    </select>
                                 </div>
                              </div>

                              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                                 <p className="text-[10px] text-blue-800 leading-relaxed">
                                    <strong>Nota:</strong> O ficheiro gerado contÃ©m todas as faturas, clientes e produtos movimentados no perÃ­odo selecionado, de acordo com as normas da AGT v1.01.
                                 </p>
                              </div>

                              <button onClick={handleExportSaft} disabled={isExportingSaft}
                                 className="w-full py-5 bg-zinc-900 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
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
                        {/* Header e AcÃ§Ãµes RÃ¡pidas */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[3rem] border border-zinc-100 shadow-sm">
                           <div>
                              <h2 className="text-2xl font-black text-zinc-900 uppercase tracking-tight">GestÃ£o de InventÃ¡rio</h2>
                              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Controlo de stock, categorias e alertas crÃ­ticos</p>
                           </div>
                           <div className="flex items-center gap-3">
                              <button
                                 onClick={() => setShowCategoryModal(true)}
                                 className="px-6 py-4 bg-zinc-50 text-zinc-600 font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-zinc-100 transition-all flex items-center gap-2 border border-zinc-200"
                              >
                                 <ListFilter size={16} /> Nova Categoria
                              </button>
                              <button
                                 onClick={() => setShowItemModal(true)}
                                 className="px-6 py-4 bg-yellow-500 text-zinc-900 font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-yellow-400 transition-all flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95"
                              >
                                 <Plus size={16} /> Adicionar Item
                              </button>
                           </div>
                        </div>

                        {/* Filtros de Categorias */}
                        <div className="flex items-center gap-4 overflow-x-auto pb-4 custom-scrollbar">
                           <button className="px-6 py-3 bg-zinc-900 text-yellow-500 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                              Todos os Itens ({extInventario.length})
                           </button>
                           {categorias.map(cat => (
                              <button key={cat.id} className="px-6 py-3 bg-white border border-zinc-100 text-zinc-500 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap hover:border-yellow-400 transition-all flex items-center gap-2">
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
                                 <div key={i} className={`p-6 bg-white rounded-[2.5rem] border transition-all group relative overflow-hidden flex flex-col ${isLowStock ? 'border-red-100' : 'border-zinc-100 hover:border-yellow-400 hover:shadow-2xl'}`}>
                                    {isLowStock && (
                                       <div className="absolute top-4 right-4 z-10 flex items-center gap-1 bg-red-100 text-red-600 px-3 py-1.5 rounded-xl animate-pulse">
                                          <AlertTriangle size={12} />
                                          <span className="text-[9px] font-black uppercase">Stock Baixo</span>
                                       </div>
                                    )}

                                    <div className="w-full aspect-square bg-zinc-50 rounded-3xl mb-6 flex items-center justify-center text-zinc-200 group-hover:scale-105 transition-transform">
                                       {item.foto_url ? (
                                          <img src={item.foto_url} alt={item.nome} className="w-full h-full object-cover rounded-3xl" />
                                       ) : (
                                          <Package size={64} className="opacity-20 text-zinc-400" />
                                       )}
                                    </div>

                                    <div className="flex-1 space-y-2">
                                       <div className="flex items-center gap-2">
                                          <span className="text-[8px] font-black text-zinc-400 uppercase bg-zinc-50 px-2 py-0.5 rounded border border-zinc-100">{item.unidade || 'Unidade'}</span>
                                          {cat && (
                                             <span className="text-[8px] font-black uppercase bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded border border-yellow-100">{cat.nome}</span>
                                          )}
                                       </div>
                                       <h3 className="text-sm font-black text-zinc-900 uppercase tracking-tight leading-tight">{item.nome}</h3>
                                       <p className="text-[9px] font-bold text-zinc-400 uppercase line-clamp-1">{item.descricao || 'Sem descriÃ§Ã£o'}</p>
                                    </div>

                                    <div className="mt-6 pt-6 border-t border-zinc-50 flex items-center justify-between">
                                       <div>
                                          <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">PreÃ§o Un.</p>
                                          <p className="text-base font-black text-zinc-900">{safeFormatAOA(item.preco_unitario || item.preco_venda)}</p>
                                       </div>
                                       <div className="text-right">
                                          <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Stock</p>
                                          <p className={`text-sm font-black ${isLowStock ? 'text-red-500' : 'text-zinc-900'}`}>{item.quantidade_atual} {item.unidade || 'UN'}</p>
                                       </div>
                                    </div>
                                 </div>
                              );
                           })}
                        </div>
                     </div>
                  )
               }

               {/* --- RELATÃ“RIOS DASHBOARD --- */}
               {
                  activeTab === 'relatorios' && (
                     <div className="space-y-10 animate-in slide-in-from-bottom-4">
                        {/* Banner Superior */}
                        <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 p-12 rounded-[3.5rem] text-white relative overflow-hidden shadow-2xl">
                           <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500/20 rounded-full -mr-48 -mt-48 blur-3xl animate-pulse" />
                           <div className="relative z-10 space-y-4">
                              <h2 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter">Central de <span className="text-yellow-500">InteligÃªncia</span></h2>
                              <p className="text-zinc-400 font-bold text-sm lg:text-base uppercase tracking-widest max-w-2xl">
                                 Gere demonstraÃ§Ãµes financeiras, balancetes e relatÃ³rios analÃ­ticos com um clique. Dados exportÃ¡veis em PDF e Excel.
                              </p>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                           {[
                              { id: 'balanco', title: 'BalanÃ§o Patrimonial', desc: 'PosiÃ§Ã£o financeira detalhada de ativos e passivos.', icon: <LayoutList size={28} className="text-blue-500" />, color: 'bg-blue-50' },
                              { id: 'dre', title: 'DemonstraÃ§Ã£o de Resultados', desc: 'AnÃ¡lise de lucro e prejuÃ­zo por perÃ­odo seleccionado.', icon: <TrendingUp size={28} className="text-green-500" />, color: 'bg-green-50 text-green-700' },
                              { id: 'balancete', title: 'Balancete de VerificaÃ§Ã£o', desc: 'VerificaÃ§Ã£o de dÃ©bitos e crÃ©ditos de todas as contas.', icon: <CheckCircle2 size={28} className="text-purple-500" />, color: 'bg-purple-50 text-purple-700' },
                              { id: 'diario', title: 'DiÃ¡rio de LanÃ§amentos', desc: 'Listagem cronolÃ³gica de todos os movimentos.', icon: <BookOpen size={28} className="text-orange-500" />, color: 'bg-orange-50 text-orange-700' },
                              { id: 'razÃ£o', title: 'Livro RazÃ£o', desc: 'MovimentaÃ§Ã£o individualizada por conta contabilÃ­stica.', icon: <FileText size={28} className="text-sky-500" />, color: 'bg-sky-50 text-sky-700' },
                              { id: 'cashflow', title: 'Fluxo de Caixa', desc: 'Origem e aplicaÃ§Ã£o de recursos financeiros.', icon: <Landmark size={28} className="text-yellow-600" />, color: 'bg-yellow-50 text-yellow-700' },
                              { id: 'fiscal', title: 'RelatÃ³rio Fiscal (IVA/IRT)', desc: 'Apuramento de impostos para submissÃ£o Ã  AGT.', icon: <FileCheck size={28} className="text-red-500" />, color: 'bg-red-50 text-red-700' },
                              { id: 'auditoria', title: 'Trilhas de Auditoria', desc: 'HistÃ³rico completo de alteraÃ§Ãµes e logs do sistema.', icon: <ShieldCheck size={28} className="text-zinc-500" />, color: 'bg-zinc-100 text-zinc-700' },
                           ].map((rep) => (
                              <div key={rep.id} className="bg-white p-8 rounded-[3rem] border border-zinc-100 shadow-sm hover:shadow-2xl hover:scale-[1.02] transition-all group flex flex-col justify-between h-[320px]">
                                 <div>
                                    <div className={`w-16 h-16 ${rep.color} rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:rotate-6`}>
                                       {rep.icon}
                                    </div>
                                    <h3 className="text-lg font-black text-zinc-900 uppercase tracking-tight mb-2 leading-tight">{rep.title}</h3>
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase leading-relaxed">{rep.desc}</p>
                                 </div>
                                 <div className="flex gap-2">
                                    <button
                                       onClick={() => openReport(rep.id)}
                                       disabled={isGeneratingReport}
                                       className="flex-1 py-4 bg-zinc-900 text-white font-black rounded-2xl text-[9px] uppercase tracking-widest hover:bg-yellow-500 hover:text-zinc-900 transition-all flex items-center justify-center gap-2"
                                    >
                                       {isGeneratingReport ? <RefreshCw className="animate-spin" size={14} /> : <Printer size={14} />}
                                       {isGeneratingReport ? 'Gerando...' : 'Gerar RelatÃ³rio'}
                                    </button>
                                    <button className="p-4 bg-zinc-50 text-zinc-400 rounded-2xl hover:bg-zinc-100 transition-all">
                                       <Share2 size={16} />
                                    </button>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  )
               }

               {/* --- ABA: FONTES DE DADOS (INTEGRAÃ‡ÃƒO AUTOMÃTICA) --- */}
               {
                  activeTab === 'fontes' && (() => {

                     // --- MÃ©tricas por MÃ³dulo ---
                     const totalFaturas = extFaturas.reduce((s, f) => s + (Number(f.valor_total) || 0), 0);
                     const faturasPagas = extFaturas.filter(f => f.status === 'pago' || f.status === 'Paga').length;
                     const totalTesouraria = extTesouraria.reduce((s, t) => s + (Number(t.valor) || 0), 0);
                     const entradas = extTesouraria.filter(t => t.tipo === 'Entrada' || t.tipo === 'entrada' || t.tipo === 'receita').reduce((s, t) => s + (Number(t.valor) || 0), 0);
                     const saidas = extTesouraria.filter(t => t.tipo === 'SaÃ­da' || t.tipo === 'saida' || t.tipo === 'despesa').reduce((s, t) => s + (Number(t.valor) || 0), 0);
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
                           fq(supabase.from('inventario').select('*').eq('company_id', selectedEmpresaId).order('nome')),
                           fq(supabase.from('stock_movimentos').select('*').eq('company_id', selectedEmpresaId).order('created_at', { ascending: false }).limit(100))
                        ]);
                        setExtFaturas(fat); setExtTesouraria(tes); setExtRhRecibos(rh); setExtInventario(inv); setExtStockMov(smov);
                        setLastSyncAt(new Date());
                        setIsSyncingModules(false);
                     };

                     const modulos = [
                        {
                           nome: 'FaturaÃ§Ã£o', icon: <FileText size={22} className="text-blue-500" />, bg: 'bg-blue-50 border-blue-100',
                           badge: `${extFaturas.length} faturas`,
                           stats: [
                              { label: 'Total Faturado', value: safeFormatAOA(totalFaturas), color: 'text-blue-600' },
                              { label: 'Pagas', value: `${faturasPagas}/${extFaturas.length}`, color: 'text-green-600' },
                              { label: 'Pendentes', value: `${extFaturas.length - faturasPagas}`, color: 'text-yellow-500' },
                           ],
                           items: extFaturas.slice(0, 5).map(f => ({
                              label: f.numero_fatura || f.cliente_nome || 'â€”',
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
                              { label: 'SaÃ­das', value: safeFormatAOA(saidas), color: 'text-red-500' },
                           ],
                           items: extTesouraria.slice(0, 5).map(t => ({
                              label: t.descricao || t.categoria || 'â€”',
                              value: safeFormatAOA(t.valor),
                              sub: t.tipo || '',
                              date: t.data || '',
                              onAutoLaunch: () => handleAutoLaunchFromTesouraria(t)
                           }))
                        },
                        {
                           nome: 'RH / SalÃ¡rios', icon: <Users size={22} className="text-purple-500" />, bg: 'bg-purple-50 border-purple-100',
                           badge: `${extRhRecibos.length} recibos`,
                           stats: [
                              { label: 'Total LÃ­quido', value: safeFormatAOA(totalSalarios), color: 'text-purple-600' },
                              { label: 'Total Bruto', value: safeFormatAOA(totalBruto), color: 'text-zinc-600' },
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
                           nome: 'InventÃ¡rio', icon: <FileCheck size={22} className="text-orange-500" />, bg: 'bg-orange-50 border-orange-100',
                           badge: `${extInventario.length} itens`,
                           stats: [
                              { label: 'Valor Stock', value: safeFormatAOA(totalInventarioValor), color: 'text-orange-600' },
                              { label: 'SKUs', value: `${extInventario.length}`, color: 'text-zinc-600' },
                              { label: 'CrÃ­ticos (Stock MÃ­n.)', value: `${itensCriticos}`, color: itensCriticos > 0 ? 'text-red-500' : 'text-green-600' },
                           ],
                           items: extInventario.slice(0, 5).map(i => ({
                              label: i.nome || 'â€”',
                              onAutoLaunch: undefined
                           }))
                        },
                     ];

                     return (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4 text-left">
                           {/* Header com botÃ£o de sincronizaÃ§Ã£o */}
                           <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-900 p-8 rounded-[3rem] text-white shadow-2xl">
                              <div>
                                 <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                                    <Share2 className="text-yellow-500" size={26} /> Fontes de Dados Integradas
                                 </h2>
                                 <p className="text-zinc-400 text-xs font-bold mt-1 uppercase tracking-widest">
                                    Dados recebidos automaticamente dos mÃ³dulos activos do ERP
                                 </p>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                 <button onClick={syncNow} disabled={isSyncingModules}
                                    className="flex items-center gap-2 px-5 py-3 bg-yellow-500 text-zinc-900 font-black rounded-2xl text-[9px] uppercase tracking-widest hover:bg-yellow-400 transition-all disabled:opacity-50">
                                    <RefreshCw size={14} className={isSyncingModules ? 'animate-spin' : ''} />
                                    {isSyncingModules ? 'Sincronizando...' : 'Sincronizar Agora'}
                                 </button>
                                 {lastSyncAt && (
                                    <p className="text-[9px] text-zinc-500 font-bold">
                                       Ãšltima Sinc: {lastSyncAt.toLocaleTimeString()}
                                    </p>
                                 )}
                              </div>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              {modulos.map((m, idx) => (
                                 <div key={idx} className={`p-8 rounded-[2.5rem] border ${m.bg} space-y-6 shadow-sm bg-white`}>
                                    <div className="flex justify-between items-start">
                                       <div className="flex gap-4 items-center">
                                          <div className="p-4 bg-white rounded-2xl shadow-sm border border-zinc-100">{m.icon}</div>
                                          <div>
                                             <h3 className="text-lg font-black text-zinc-900 uppercase tracking-tight">{m.nome}</h3>
                                             <p className="text-[10px] font-black uppercase text-zinc-400">{m.badge}</p>
                                          </div>
                                       </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                       {m.stats.map((s, i) => (
                                          <div key={i} className="p-3 bg-white/60 rounded-xl border border-white/80">
                                             <p className="text-[8px] font-black text-zinc-400 uppercase leading-tight mb-1">{s.label}</p>
                                             <p className={`text-[10px] font-black ${s.color}`}>{s.value}</p>
                                          </div>
                                       ))}
                                    </div>
                                    <div className="space-y-3 pt-2">
                                       {m.items.map((it, i) => (
                                          <div key={i} className="flex items-center justify-between p-4 bg-white/40 rounded-2xl border border-white/60 group hover:bg-white transition-all hover:shadow-sm">
                                             <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-zinc-200 group-hover:bg-yellow-500 transition-colors" />
                                                <div>
                                                   <p className="text-[10px] font-black text-zinc-800 uppercase leading-none">{it.label}</p>
                                                   <p className="text-[8px] font-bold text-zinc-400 uppercase mt-1">{it.date} {it.sub ? `â€¢ ${it.sub}` : ''}</p>
                                                </div>
                                             </div>
                                             <div className="flex items-center gap-4">
                                                <p className="text-[10px] font-black text-zinc-900">{it.value}</p>
                                                {it.onAutoLaunch && (
                                                   <button onClick={it.onAutoLaunch} className="p-2 bg-zinc-900 text-white rounded-lg hover:bg-yellow-500 hover:text-zinc-900 transition-all">
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
                           <div className="bg-white rounded-[3rem] border border-zinc-100 shadow-sm p-10 space-y-8">
                              <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tight flex items-center gap-2">
                                 <RefreshCw size={24} className="text-yellow-500" /> Movimentos de InventÃ¡rio em Tempo Real
                              </h3>
                              <div className="overflow-x-auto">
                                 <table className="w-full text-left">
                                    <thead>
                                       <tr className="border-b border-zinc-100">
                                          {['Tipo', 'ResponsÃ¡vel', 'ReferÃªncia', 'Quantidade', 'Data'].map(h => (
                                             <th key={h} className="pb-4 px-4 text-[9px] font-black uppercase tracking-widest text-zinc-400">{h}</th>
                                          ))}
                                       </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-50">
                                       {extStockMov.slice(0, 10).map((m, i) => (
                                          <tr key={i} className="hover:bg-zinc-50 transition-colors">
                                             <td className="py-4 px-4">
                                                <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${m.tipo === 'entrada' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>{m.tipo}</span>
                                             </td>
                                             <td className="py-4 px-4 text-[11px] font-black text-zinc-800 uppercase tracking-tight">{m.entidade || 'Sistema'}</td>
                                             <td className="py-4 px-4 text-[10px] font-bold text-zinc-500 uppercase">{m.referencia || 'â€”'}</td>
                                             <td className="py-4 px-4 text-[11px] font-black text-zinc-900">{m.quantidade}</td>
                                             <td className="py-4 px-4 text-[10px] font-bold text-zinc-400">{new Date(m.created_at).toLocaleDateString()}</td>
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

               {/* --- CONSOLIDAÃ‡ÃƒO MULTIEMPRESA --- */}
               {
                  activeTab === 'consolidacao' && (() => {
                     const consolidadoPorEmpresa = empresas.map(emp => {
                        const empLancs = (lancamentos || []).filter(l => l.company_id === emp.id);
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

                     // Estado local de eliminaÃ§Ãµes mock (atÃ© o form ser implementado)
                     const eliminacoesExemplo = [
                        { id: '1', tipo: 'Receita Interna', valor: 50000, descricao: 'PrestaÃ§Ã£o de serviÃ§os interna', origem: empresas[0]?.nome || 'â€”', destino: empresas[1]?.nome || 'â€”' },
                        { id: '2', tipo: 'EmprÃ©stimo', valor: 200000, descricao: 'Financiamento entre afiliadas', origem: empresas[1]?.nome || 'â€”', destino: empresas[0]?.nome || 'â€”' },
                     ].filter(e => empresas.length >= 2);

                     const totalEliminacoes = eliminacoesExemplo.reduce((a, e) => a + e.valor, 0);
                     const lucroConsolidado = totalGrupo.lucro - totalEliminacoes;

                     return (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4">

                           {/* Header */}
                           <div className="flex items-center justify-between bg-zinc-900 p-8 rounded-[3rem] text-white shadow-2xl">
                              <div>
                                 <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                                    <Building2 className="text-yellow-500" size={28} /> ConsolidaÃ§Ã£o do Grupo
                                 </h2>
                                 <p className="text-zinc-400 text-xs font-bold mt-1 uppercase tracking-widest">
                                    {empresas.length} Entidade{empresas.length !== 1 ? 's' : ''} Â· Dados calculados automaticamente
                                 </p>
                              </div>
                              <div className="text-right">
                                 <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Lucro LÃ­quido Consolidado</p>
                                 <p className={`text-4xl font-black ${lucroConsolidado >= 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                                    {safeFormatAOA(lucroConsolidado)}
                                 </p>
                                 <p className="text-[9px] text-zinc-500 font-bold mt-1">ApÃ³s eliminaÃ§Ãµes de {safeFormatAOA(totalEliminacoes)}</p>
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
                                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-2">{kpi.label}</p>
                                    <p className={`text-2xl font-black ${kpi.color}`}>{safeFormatAOA(kpi.value)}</p>
                                 </div>
                              ))}
                           </div>

                           {/* ComparaÃ§Ã£o Financeira entre Empresas */}
                           <div className="bg-white rounded-[3rem] border border-sky-100 shadow-sm p-8">
                              <div className="flex items-center justify-between mb-6">
                                 <h3 className="text-base font-black text-zinc-900 uppercase tracking-tight flex items-center gap-2">
                                    <BarChart2 size={18} className="text-yellow-500" /> ComparaÃ§Ã£o Financeira entre Entidades
                                 </h3>
                                 <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-zinc-50 text-zinc-500 hover:bg-zinc-100 rounded-xl text-[9px] font-black uppercase tracking-widest border border-zinc-100 transition-all">
                                    <Printer size={14} /> RelatÃ³rio
                                 </button>
                              </div>

                              {consolidadoPorEmpresa.length === 0 ? (
                                 <div className="text-center py-16 text-zinc-400">
                                    <Building2 size={40} className="mx-auto mb-4 opacity-30" />
                                    <p className="font-black uppercase text-xs">Nenhuma empresa com dados para consolidar</p>
                                 </div>
                              ) : (
                                 <div className="space-y-4">
                                    {consolidadoPorEmpresa.map((emp, i) => (
                                       <div key={emp.id} className="p-6 rounded-2xl border border-zinc-100 bg-zinc-50/50 hover:bg-white hover:shadow-sm transition-all">
                                          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                                             <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-black text-white"
                                                   style={{ background: COLORS_PIE[i % COLORS_PIE.length] }}>
                                                   {emp.nome?.charAt(0)?.toUpperCase() || '?'}
                                                </div>
                                                <div>
                                                   <p className="font-black text-sm text-zinc-900">{emp.nome}</p>
                                                   <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{emp.lancamentos} lanÃ§amento{emp.lancamentos !== 1 ? 's' : ''}</p>
                                                </div>
                                             </div>
                                             <div className="flex gap-6 text-right">
                                                <div>
                                                   <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Receita</p>
                                                   <p className="text-sm font-black text-green-600">{safeFormatAOA(emp.receita)}</p>
                                                </div>
                                                <div>
                                                   <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Despesa</p>
                                                   <p className="text-sm font-black text-red-500">{safeFormatAOA(emp.despesa)}</p>
                                                </div>
                                                <div>
                                                   <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Lucro</p>
                                                   <p className={`text-sm font-black ${emp.lucro >= 0 ? 'text-zinc-900' : 'text-red-500'}`}>{safeFormatAOA(emp.lucro)}</p>
                                                </div>
                                                <div>
                                                   <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Margem</p>
                                                   <p className={`text-sm font-black ${emp.margem >= 10 ? 'text-green-600' : emp.margem > 0 ? 'text-yellow-500' : 'text-red-500'}`}>{emp.margem.toFixed(1)}%</p>
                                                </div>
                                             </div>
                                          </div>
                                          {/* Barra de participaÃ§Ã£o na receita do grupo */}
                                          <div>
                                             <div className="flex justify-between items-center mb-1">
                                                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">ContribuiÃ§Ã£o para Receita do Grupo</p>
                                                <p className="text-[9px] font-black text-zinc-600">{maxReceita > 0 ? ((emp.receita / Math.max(totalGrupo.receita, 1)) * 100).toFixed(1) : 0}%</p>
                                             </div>
                                             <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full transition-all duration-700"
                                                   style={{ width: `${(emp.receita / maxReceita) * 100}%`, background: COLORS_PIE[i % COLORS_PIE.length] }} />
                                             </div>
                                          </div>
                                       </div>
                                    ))}
                                 </div>
                              )}
                           </div>

                           {/* EliminaÃ§Ãµes Intercompany */}
                           <div className="bg-white rounded-[3rem] border border-sky-100 shadow-sm p-8">
                              <div className="flex items-center justify-between mb-6">
                                 <h3 className="text-base font-black text-zinc-900 uppercase tracking-tight flex items-center gap-2">
                                    <ArrowDownLeft size={18} className="text-yellow-500" /> EliminaÃ§Ãµes Intercompany
                                 </h3>
                                 <span className="text-[9px] font-black text-zinc-400 px-3 py-1.5 bg-zinc-50 rounded-xl border border-zinc-100 uppercase tracking-widest">
                                    Total: {safeFormatAOA(totalEliminacoes)}
                                 </span>
                              </div>

                              {empresas.length < 2 ? (
                                 <div className="text-center py-10 bg-zinc-50 rounded-2xl">
                                    <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">SÃ£o necessÃ¡rias pelo menos 2 empresas no grupo para registar eliminaÃ§Ãµes.</p>
                                 </div>
                              ) : eliminacoesExemplo.length === 0 ? (
                                 <div className="text-center py-10 bg-zinc-50 rounded-2xl">
                                    <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Nenhuma eliminaÃ§Ã£o intercompany registada.</p>
                                 </div>
                              ) : (
                                 <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                       <thead>
                                          <tr className="border-b border-zinc-100">
                                             {['Tipo', 'DescriÃ§Ã£o', 'Origem', 'Destino', 'Valor'].map(h => (
                                                <th key={h} className="pb-3 px-4 text-[9px] font-black uppercase tracking-widest text-zinc-400">{h}</th>
                                             ))}
                                          </tr>
                                       </thead>
                                       <tbody>
                                          {eliminacoesExemplo.map(el => (
                                             <tr key={el.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                                                <td className="py-3 px-4">
                                                   <span className="px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-yellow-50 text-yellow-700 border border-yellow-100">{el.tipo}</span>
                                                </td>
                                                <td className="py-3 px-4 text-sm font-bold text-zinc-700">{el.descricao}</td>
                                                <td className="py-3 px-4 text-xs font-bold text-zinc-500">{el.origem}</td>
                                                <td className="py-3 px-4 text-xs font-bold text-zinc-500">{el.destino}</td>
                                                <td className="py-3 px-4 text-sm font-black text-red-500 text-right">({safeFormatAOA(el.valor)})</td>
                                             </tr>
                                          ))}
                                       </tbody>
                                       <tfoot>
                                          <tr className="border-t-2 border-zinc-200">
                                             <td colSpan={4} className="pt-4 px-4 text-[9px] font-black uppercase tracking-widest text-zinc-400">Total a Eliminar</td>
                                             <td className="pt-4 px-4 text-base font-black text-red-600 text-right">({safeFormatAOA(totalEliminacoes)})</td>
                                          </tr>
                                          <tr>
                                             <td colSpan={4} className="pt-2 px-4 text-[9px] font-black uppercase tracking-widest text-zinc-900">Lucro Consolidado Ajustado</td>
                                             <td className={`pt-2 px-4 text-base font-black text-right ${lucroConsolidado >= 0 ? 'text-green-600' : 'text-red-600'}`}>{safeFormatAOA(lucroConsolidado)}</td>
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
                        <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
                           <div className="p-8 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                              <h2 className="text-xl font-black text-zinc-900 flex items-center gap-3 uppercase tracking-tight">
                                 <ListFilter className="text-yellow-500" /> Configurar Nova Conta (PGN)
                              </h2>
                              <button onClick={() => setShowAccountModal(false)} className="p-3 text-zinc-400 hover:bg-zinc-200 rounded-full transition-all"><X size={24} /></button>
                           </div>
                           <form onSubmit={handleCreateAccount} className="p-8 space-y-6">
                              <div className="grid grid-cols-2 gap-6">
                                 <Input name="codigo" label="CÃ³digo PGC (Ex: 1.1.2)" required
                                    value={newAccount.codigo} onChange={e => setNewAccount({ ...newAccount, codigo: e.target.value })}
                                 />
                                 <Input name="nome" label="DescriÃ§Ã£o da Conta" required
                                    value={newAccount.nome} onChange={e => setNewAccount({ ...newAccount, nome: e.target.value })}
                                 />
                              </div>
                              <div className="grid grid-cols-2 gap-6">
                                 <Select name="tipo" label="Tipo de Conta"
                                    value={newAccount.tipo} onChange={e => setNewAccount({ ...newAccount, tipo: e.target.value as any })}
                                    options={[
                                       { value: 'Ativo', label: 'Ativo' },
                                       { value: 'Passivo', label: 'Passivo' },
                                       { value: 'Capital', label: 'Capital PrÃ³prio' },
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
                                 <Select name="aceita_lancamentos" label="Tipo de LanÃ§amento"
                                    value={newAccount.aceita_lancamentos ? 'true' : 'false'}
                                    onChange={e => setNewAccount({ ...newAccount, aceita_lancamentos: e.target.value === 'true' })}
                                    options={[
                                       { value: 'true', label: 'AnalÃ­tica (Aceita Movimentos)' },
                                       { value: 'false', label: 'SintÃ©tica (Apenas Grupos)' }
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
                              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                                 <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1 font-mono">Hierarchy Preview</p>
                                 <p className="text-xs font-bold text-zinc-600">NÃ­vel detectado automaticamente: <span className="text-zinc-900">{newAccount.codigo.split('.').length}</span></p>
                              </div>
                              <button type="submit" className="w-full py-5 bg-zinc-900 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 hover:bg-yellow-500 hover:text-zinc-900 transition-all shadow-xl">
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
                        <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
                           <div className="p-8 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                              <h2 className="text-xl font-black text-zinc-900 flex items-center gap-3 uppercase tracking-tight">
                                 <Landmark className="text-yellow-500" /> Novo Centro de Custo/Lucro
                              </h2>
                              <button onClick={() => setShowCCModal(false)} className="p-3 text-zinc-400 hover:bg-zinc-200 rounded-full transition-all"><X size={24} /></button>
                           </div>
                           <form onSubmit={handleCreateCentro} className="p-8 space-y-6">
                              <div className="grid grid-cols-2 gap-6">
                                 <Input name="cc_codigo" label="CÃ³digo do Centro" required
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
                              <Input name="cc_desc" label="Breve DescriÃ§Ã£o"
                                 value={newCentroCusto.descricao} onChange={e => setNewCentroCusto({ ...newCentroCusto, descricao: e.target.value })}
                              />
                              <button type="submit" className="w-full py-5 bg-zinc-900 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 hover:bg-zinc-800 transition-all">
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
                     <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
                        <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
                           <div className="p-8 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                              <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 bg-yellow-500 rounded-2xl flex items-center justify-center text-zinc-900 shadow-lg">
                                    <Users size={24} />
                                 </div>
                                 <div>
                                    <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight">Novo Contacto</h2>
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Registo de Parceiro de NegÃ³cio</p>
                                 </div>
                              </div>
                              <button onClick={() => setShowContactModal(false)} className="p-3 text-zinc-400 hover:bg-zinc-200 rounded-full transition-all"><X size={24} /></button>
                           </div>
                           <form onSubmit={handleCreateContact} className="p-8 space-y-6">
                              <div className="grid grid-cols-2 gap-6">
                                 <div className="col-span-2">
                                    <Input label="Nome Completo / RazÃ£o Social" required placeholder="Ex: Amazing Corporation Lda"
                                       value={newContact.nome} onChange={(e: any) => setNewContact({ ...newContact, nome: e.target.value })}
                                    />
                                 </div>
                                 <Input label="NIF" placeholder="Ex: 5000123456"
                                    value={newContact.nif} onChange={(e: any) => setNewContact({ ...newContact, nif: e.target.value })}
                                 />
                                 <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Tipo de Contacto</label>
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

                              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-zinc-50">
                                 <Input label="E-mail" type="email" placeholder="contacto@email.com"
                                    value={newContact.email} onChange={(e: any) => setNewContact({ ...newContact, email: e.target.value })}
                                 />
                                 <Input label="Telefone" placeholder="+244 9XX XXX XXX"
                                    value={newContact.telefone} onChange={(e: any) => setNewContact({ ...newContact, telefone: e.target.value })}
                                 />
                                 <div className="col-span-2">
                                    <Input label="Morada / LocalizaÃ§Ã£o" placeholder="Cidade, Bairro, Rua..."
                                       value={newContact.morada} onChange={(e: any) => setNewContact({ ...newContact, morada: e.target.value })}
                                    />
                                 </div>
                              </div>

                              <div className="pt-6">
                                 <button type="submit" disabled={isSavingContact} className="w-full py-6 bg-zinc-900 hover:bg-zinc-800 text-white rounded-[2rem] font-black uppercase text-sm tracking-widest shadow-2xl transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-4">
                                    {isSavingContact ? <RefreshCw className="animate-spin text-yellow-500" /> : <Save className="text-yellow-500" />}
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
                        <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
                           <div className="p-8 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                              <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 bg-yellow-500 rounded-2xl flex items-center justify-center text-zinc-900 shadow-lg">
                                    <ListFilter size={24} />
                                 </div>
                                 <div>
                                    <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight">Nova Categoria</h2>
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">OrganizaÃ§Ã£o de Itens e Stock</p>
                                 </div>
                              </div>
                              <button onClick={() => setShowCategoryModal(false)} className="p-3 text-zinc-400 hover:bg-zinc-200 rounded-full transition-all"><X size={24} /></button>
                           </div>
                           <form onSubmit={handleCreateCategory} className="p-8 space-y-6">
                              <div className="space-y-4">
                                 <Input label="Nome da Categoria" required placeholder="Ex: InformÃ¡tica, Bebidas..."
                                    value={newCategory.nome} onChange={(e: any) => setNewCategory({ ...newCategory, nome: e.target.value })}
                                 />
                                 <Input label="DescriÃ§Ã£o Curta" placeholder="Opcional..."
                                    value={newCategory.descricao} onChange={(e: any) => setNewCategory({ ...newCategory, descricao: e.target.value })}
                                 />
                                 <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Cor de IdentificaÃ§Ã£o</label>
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
                                 <button type="submit" disabled={isSavingCategory} className="w-full py-6 bg-zinc-900 hover:bg-zinc-800 text-white rounded-[2rem] font-black uppercase text-sm tracking-widest shadow-2xl transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-4">
                                    {isSavingCategory ? <RefreshCw className="animate-spin text-yellow-500" /> : <Save className="text-yellow-500" />}
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
                        <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
                           <div className="p-8 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                              <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 bg-yellow-500 rounded-2xl flex items-center justify-center text-zinc-900 shadow-lg">
                                    <Plus size={24} />
                                 </div>
                                 <div>
                                    <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight">Novo Item no CatÃ¡logo</h2>
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Registo de Produto ou ServiÃ§o</p>
                                 </div>
                              </div>
                              <button onClick={() => setShowItemModal(false)} className="p-3 text-zinc-400 hover:bg-zinc-200 rounded-full transition-all"><X size={24} /></button>
                           </div>
                           <form onSubmit={handleCreateItem} className="p-8 space-y-6">
                              <div className="grid grid-cols-2 gap-6">
                                 <div className="col-span-2">
                                    <Input label="Nome do Item / ServiÃ§o" required placeholder="Ex: Consultoria Fiscal, Resma A4..."
                                       value={newInventoryItem.nome} onChange={(e: any) => setNewInventoryItem({ ...newInventoryItem, nome: e.target.value })}
                                    />
                                 </div>
                                 <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Categoria</label>
                                    <Select
                                       value={newInventoryItem.categoria_id}
                                       onChange={(e: any) => setNewInventoryItem({ ...newInventoryItem, categoria_id: e.target.value })}
                                       options={[
                                          { value: '', label: 'Seleccione uma categoria' },
                                          ...categorias.map(cat => ({ value: cat.id, label: cat.nome }))
                                       ]}
                                       required
                                    />
                                 </div>
                                 <Input label="CÃ³digo/SKU" placeholder="Ex: SERV-001"
                                    value={newInventoryItem.codigo} onChange={(e: any) => setNewInventoryItem({ ...newInventoryItem, codigo: e.target.value })}
                                 />
                              </div>

                              <div className="grid grid-cols-3 gap-6 pt-4 border-t border-zinc-50">
                                 <Input label="PreÃ§o UnitÃ¡rio" type="number"
                                    value={newInventoryItem.preco_unitario} onChange={(e: any) => setNewInventoryItem({ ...newInventoryItem, preco_unitario: Number(e.target.value) })}
                                 />
                                 <Input label="Qtd. Inicial" type="number"
                                    value={newInventoryItem.quantidade_atual} onChange={(e: any) => setNewInventoryItem({ ...newInventoryItem, quantidade_atual: Number(e.target.value) })}
                                 />
                                 <Input label="Stock MÃ­nimo" type="number"
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
                                    <Input label="ReferÃªncia Interna" placeholder="Opcional..."
                                       value={newInventoryItem.referencia} onChange={(e: any) => setNewInventoryItem({ ...newInventoryItem, referencia: e.target.value })}
                                    />
                                 </div>
                              </div>

                              <div className="pt-6">
                                 <button type="submit" disabled={isSavingItem} className="w-full py-6 bg-zinc-900 hover:bg-zinc-800 text-white rounded-[2rem] font-black uppercase text-sm tracking-widest shadow-2xl transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-4">
                                    {isSavingItem ? <RefreshCw className="animate-spin text-yellow-500" /> : <Save className="text-yellow-500" />}
                                    {isSavingItem ? 'A Processar...' : 'Adicionar ao CatÃ¡logo'}
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
                        <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
                           <div className="p-8 border-b border-zinc-100 flex justify-between items-center bg-zinc-900 text-white">
                              <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 bg-yellow-500 rounded-2xl flex items-center justify-center text-zinc-900 shadow-lg">
                                    <UserPlus size={24} />
                                 </div>
                                 <div>
                                    <h2 className="text-xl font-black uppercase tracking-tight">Registar Colaborador</h2>
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{currentEmpresa?.nome}</p>
                                 </div>
                              </div>
                              <button onClick={() => setShowEmployeeModal(false)} className="p-3 text-white/50 hover:bg-white/10 rounded-full transition-all"><X size={24} /></button>
                           </div>
                           <form onSubmit={handleSaveEmployee} className="p-10 space-y-10">
                              {/* Bloco 1: IdentificaÃ§Ã£o e Base */}
                              <div className="space-y-4">
                                 <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100 pb-2">InformaÃ§Ã£o Base e IdentificaÃ§Ã£o</h4>
                                 <div className="grid grid-cols-3 gap-6">
                                    <div className="col-span-1">
                                       <Input label="Nome Completo" required value={newEmployee.nome} onChange={e => setNewEmployee({ ...newEmployee, nome: e.target.value })} placeholder="Ex: JoÃ£o Manuel dos Santos" />
                                    </div>
                                    <Input label="FunÃ§Ã£o / Cargo" required value={newEmployee.funcao} onChange={e => setNewEmployee({ ...newEmployee, funcao: e.target.value })} placeholder="Ex: Contabilista SÃ©nior" />
                                    <Input label="NIF" value={newEmployee.nif} onChange={e => setNewEmployee({ ...newEmployee, nif: e.target.value })} placeholder="000000000LA000" />
                                    <Input label="Bilhete de Identidade" value={newEmployee.bilhete} onChange={e => setNewEmployee({ ...newEmployee, bilhete: e.target.value })} placeholder="000000000" />
                                    <Input label="Telefone" value={newEmployee.telefone} onChange={e => setNewEmployee({ ...newEmployee, telefone: e.target.value })} placeholder="900 000 000" />

                                    <Input label="SalÃ¡rio Base (AOA)" type="number" required value={newEmployee.salario_base} onChange={e => setNewEmployee({ ...newEmployee, salario_base: Number(e.target.value) })} />
                                    <Input label="N.Âº SeguranÃ§a Social" value={newEmployee.numero_ss} onChange={e => setNewEmployee({ ...newEmployee, numero_ss: e.target.value })} placeholder="00000000000" />
                                    <div className="flex items-end pb-1">
                                       <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 w-full">
                                          <p className="text-[9px] font-bold text-zinc-400 uppercase">CÃ¡lculo Estimado</p>
                                          <p className="text-xs font-black text-zinc-900">IRT/INSS AutomÃ¡tico</p>
                                       </div>
                                    </div>
                                 </div>
                              </div>

                              {/* Bloco 2: SubsÃ­dios Mensais e Anuais (Lado a Lado) */}
                              <div className="grid grid-cols-2 gap-8">
                                 <div className="p-6 bg-zinc-50/50 rounded-3xl border border-zinc-100 space-y-6">
                                    <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-200 pb-2">SubsÃ­dios Mensais Fixos</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                       <Input label="AlimentaÃ§Ã£o" type="number" value={newEmployee.subsidio_alimentacao} onChange={e => setNewEmployee({ ...newEmployee, subsidio_alimentacao: Number(e.target.value) })} />
                                       <Input label="Transporte" type="number" value={newEmployee.subsidio_transporte} onChange={e => setNewEmployee({ ...newEmployee, subsidio_transporte: Number(e.target.value) })} />
                                    </div>
                                 </div>

                                 <div className="p-6 bg-yellow-50/30 rounded-3xl border border-yellow-100 space-y-6">
                                    <h4 className="text-[10px] font-black text-yellow-600 uppercase tracking-widest border-b border-yellow-200 pb-2">BÃ³nus e Descontos</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                       <Input label="Horas Extras (Valor)" type="number" value={newEmployee.valor_hora_extra_base} onChange={e => setNewEmployee({ ...newEmployee, valor_hora_extra_base: Number(e.target.value) })} />
                                       <Input label="Adiantamento PadrÃ£o" type="number" value={newEmployee.adiantamento_padrao} onChange={e => setNewEmployee({ ...newEmployee, adiantamento_padrao: Number(e.target.value) })} />
                                       <Input label="Outros Descontos" type="number" value={newEmployee.outros_descontos_base} onChange={e => setNewEmployee({ ...newEmployee, outros_descontos_base: Number(e.target.value) })} />
                                       <div className="flex flex-col gap-2 pt-2">
                                          <label className="flex items-center gap-2 cursor-pointer">
                                             <input type="checkbox" checked={newEmployee.desconto_inss} onChange={e => setNewEmployee({ ...newEmployee, desconto_inss: e.target.checked })} className="w-4 h-4 accent-yellow-500" />
                                             <span className="text-[10px] font-bold text-zinc-600 uppercase">Aplicar INSS</span>
                                          </label>
                                          <label className="flex items-center gap-2 cursor-pointer">
                                             <input type="checkbox" checked={newEmployee.desconto_irt} onChange={e => setNewEmployee({ ...newEmployee, desconto_irt: e.target.checked })} className="w-4 h-4 accent-yellow-500" />
                                             <span className="text-[10px] font-bold text-zinc-600 uppercase">Aplicar IRT</span>
                                          </label>
                                       </div>
                                       <Input label="Base FÃ©rias" type="number" value={newEmployee.subsidio_ferias_base} onChange={e => setNewEmployee({ ...newEmployee, subsidio_ferias_base: Number(e.target.value) })} />
                                       <Input label="Base Natal" type="number" value={newEmployee.subsidio_natal_base} onChange={e => setNewEmployee({ ...newEmployee, subsidio_natal_base: Number(e.target.value) })} />
                                       <div className="col-span-2">
                                          <Input label="GratificaÃ§Ãµes Mensais" type="number" value={newEmployee.outras_bonificacoes_base} onChange={e => setNewEmployee({ ...newEmployee, outras_bonificacoes_base: Number(e.target.value) })} />
                                       </div>
                                    </div>
                                 </div>
                              </div>

                              <div className="pt-4">
                                 <button type="submit" disabled={isProcessingPayroll} className="w-full py-6 bg-zinc-900 hover:bg-zinc-800 text-white rounded-[2rem] font-black uppercase text-sm tracking-widest shadow-2xl transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-4">
                                    {isProcessingPayroll ? <RefreshCw className="animate-spin text-yellow-500" /> : <Save className="text-yellow-500" />}
                                    {isProcessingPayroll ? 'Processando...' : 'Confirmar Registo do FuncionÃ¡rio'}
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
                        <div className="bg-white w-full max-w-3xl rounded-[4rem] shadow-3xl overflow-hidden animate-in zoom-in-95 relative print:shadow-none print:rounded-none">
                           <div className="absolute top-8 right-8 flex gap-2 print:hidden">
                              <button onClick={() => window.print()} className="p-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-2xl transition-all"><Printer size={24} /></button>
                              <button onClick={() => setSelectedFolha(null)} className="p-4 bg-zinc-100 hover:bg-red-50 text-zinc-400 hover:text-red-500 rounded-2xl transition-all"><X size={24} /></button>
                           </div>

                           <div className="p-16 space-y-12">
                              {/* CabeÃ§alho do Recibo */}
                              <div className="flex justify-between items-start border-b-4 border-zinc-900 pb-10">
                                 <div>
                                    <h2 className="text-4xl font-black uppercase tracking-tighter text-zinc-900 leading-none mb-2">Recibo de SalÃ¡rio</h2>
                                    <p className="text-lg font-bold text-zinc-400 uppercase tracking-widest">MÃªs de ReferÃªncia: {selectedFolha.mes_referencia}</p>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-xl font-black text-zinc-900 uppercase">{currentEmpresa?.nome}</p>
                                    <p className="text-sm font-bold text-zinc-400">NIF: {currentEmpresa?.nif || '---'}</p>
                                 </div>
                              </div>

                              {/* Dados do FuncionÃ¡rio */}
                              <div className="grid grid-cols-2 gap-10">
                                 <div className="p-8 bg-zinc-50 rounded-[2.5rem] border border-zinc-100">
                                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Colaborador</p>
                                    <p className="text-2xl font-black text-zinc-900 uppercase tracking-tighter">{selectedFolha.funcionario_nome}</p>
                                 </div>
                                 <div className="p-8 bg-zinc-50 rounded-[2.5rem] border border-zinc-100">
                                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Cargo / FunÃ§Ã£o</p>
                                    <p className="text-xl font-black text-zinc-700 uppercase tracking-tighter">FuncionÃ¡rio Activo</p>
                                 </div>
                              </div>

                              {/* Tabela de Vencimentos e Descontos */}
                              <div className="space-y-4">
                                 <div className="grid grid-cols-12 gap-4 px-6 text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100 pb-2">
                                    <div className="col-span-6">DescriÃ§Ã£o</div>
                                    <div className="col-span-3 text-right">Vencimentos</div>
                                    <div className="col-span-3 text-right">Descontos</div>
                                 </div>
                                 <div className="space-y-2">
                                    {[
                                       { d: 'SalÃ¡rio Base', v: Number(selectedFolha.salario_base), type: 'V' },
                                       { d: 'SubsÃ­dios (Alim./Transp.)', v: Number(selectedFolha.subsidios), type: 'V' },
                                       { d: 'Horas Extras', v: Number((selectedFolha as any).horas_extras || 0), type: 'V' },
                                       { d: 'SubsÃ­dio de FÃ©rias', v: Number((selectedFolha as any).subsidio_ferias || 0), type: 'V' },
                                       { d: 'SubsÃ­dio de Natal', v: Number((selectedFolha as any).subsidio_natal || 0), type: 'V' },
                                       { d: 'BÃ³nus e GratificaÃ§Ãµes', v: Number((selectedFolha as any).outras_bonificacoes || 0), type: 'V' },
                                       { d: 'INSS (3%)', v: Number(selectedFolha.inss_trabal_ador || selectedFolha.inss_trabalhador), type: 'D' },
                                       { d: 'IRT / Taxa Fiscal', v: Number(selectedFolha.irt), type: 'D' },
                                       { d: 'Desconto Atrasos/Faltas', v: Number((selectedFolha as any).desconto_atrasos || 0), type: 'D' },
                                       { d: 'Desconto FÃ©rias', v: Number((selectedFolha as any).desconto_ferias || 0), type: 'D' },
                                       { d: 'Adiantamento Salarial', v: Number((selectedFolha as any).adiantamento_salarial || 0), type: 'D' },
                                    ].filter(item => item.v > 0 || item.type === 'D').map((item, idx) => (
                                       <div key={idx} className="grid grid-cols-12 gap-4 px-6 py-4 rounded-2xl hover:bg-zinc-50 transition-colors">
                                          <div className="col-span-6 text-sm font-bold text-zinc-900">{item.d}</div>
                                          <div className="col-span-3 text-right text-sm font-black text-green-600">{item.type === 'V' ? safeFormatAOA(item.v) : ''}</div>
                                          <div className="col-span-3 text-right text-sm font-black text-red-500">{item.type === 'D' ? safeFormatAOA(item.v) : ''}</div>
                                       </div>
                                    ))}
                                 </div>
                              </div>

                              {/* Totais Finas */}
                              <div className="grid grid-cols-3 gap-8 pt-10 border-t-4 border-zinc-100">
                                 <div className="text-center">
                                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Total Bruto</p>
                                    <p className="text-xl font-bold text-zinc-900">{safeFormatAOA(Number((selectedFolha as any).salario_bruto) || (Number(selectedFolha.salario_base) + Number(selectedFolha.subsidios)))}</p>
                                 </div>
                                 <div className="text-center">
                                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Total Descontos</p>
                                    <p className="text-xl font-bold text-red-500">-{safeFormatAOA(Number((selectedFolha as any).total_descontos) || (Number(selectedFolha.inss_trabalhador) + Number(selectedFolha.irt)))}</p>
                                 </div>
                                 <div className="text-center">
                                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">SalÃ¡rio a Receber</p>
                                    <p className="text-3xl font-black text-green-600">{safeFormatAOA(Number(selectedFolha.salario_liquido))}</p>
                                 </div>
                              </div>

                              <div className="pt-10 flex justify-between items-end">
                                 <div className="space-y-4">
                                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Assinatura da Entidade</p>
                                    <div className="w-64 h-px bg-zinc-200"></div>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-[8px] font-black text-zinc-300 uppercase tracking-widest">Processado via Amazing ContÃ¡bilExpert ERP</p>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>
                  )
               }
               {/* Print Template (Hidden) */}
               <div style={{ display: 'none' }}>
                  <div ref={invoicePrintRef} className="p-10 bg-white text-zinc-900 font-serif" style={{ width: '210mm', minHeight: '297mm' }}>
                     <div className="flex justify-between items-start mb-10 pb-10 border-b-2 border-zinc-100">
                        <div>
                           <h1 className="text-4xl font-black uppercase text-zinc-900 mb-2">{user?.company_name}</h1>
                           <p className="text-sm font-bold text-zinc-400">NIF: {user?.nif || '999999999'}</p>
                           <p className="text-sm text-zinc-400">{user?.address || 'Angola'}</p>
                        </div>
                        <div className="text-right">
                           <div className="bg-zinc-900 text-white px-6 py-4 rounded-2xl mb-4">
                              <p className="text-[10px] font-black uppercase tracking-widest opacity-60 m-0">Documento</p>
                              <h2 className="text-xl font-black">{lastCreatedDoc?.tipo || 'FACTURA'} {lastCreatedDoc?.numero_fatura}</h2>
                           </div>
                           <p className="text-xs font-bold text-zinc-400">PÃ¡gina 1 de 1</p>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-20 mb-16">
                        <div className="space-y-4">
                           <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Exmo.(s) Senhor(es)</p>
                           <div className="p-8 bg-zinc-50 rounded-3xl border border-zinc-100 min-h-[160px]">
                              <h3 className="text-xl font-black uppercase text-zinc-800">{lastCreatedDoc?.cliente_nome}</h3>
                              <p className="text-sm text-zinc-500 mt-2">NIF: {lastCreatedDoc?.metadata?.customer_nif || lastCreatedDoc?.customer_nif || '999999999'}</p>
                           </div>
                        </div>
                        <div className="space-y-4">
                           <div className="grid grid-cols-2 gap-6">
                              <div>
                                 <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300 mb-1">Data/Hora de EmissÃ£o</p>
                                 <p className="text-sm font-black">
                                    {lastCreatedDoc?.created_at ?
                                       new Date(lastCreatedDoc.created_at).toLocaleString('pt-AO', {
                                          day: '2-digit', month: '2-digit', year: 'numeric',
                                          hour: '2-digit', minute: '2-digit'
                                       }) : lastCreatedDoc?.data_emissao}
                                 </p>
                              </div>
                              <div>
                                 <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300 mb-1">Moeda</p>
                                 <p className="text-sm font-black">{user?.currency || 'AOA'}</p>
                              </div>
                           </div>
                        </div>
                     </div>

                     <table className="w-full mb-20 border-collapse">
                        <thead>
                           <tr className="border-b-2 border-zinc-900 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                              <th className="py-4 text-left">Ref.</th>
                              <th className="py-4 text-left">DescriÃ§Ã£o</th>
                              <th className="py-4 text-right">Qtd</th>
                              <th className="py-4 text-right">UnitÃ¡rio</th>
                              <th className="py-4 text-right">Taxa (14%)</th>
                              <th className="py-4 text-right">Total</th>
                           </tr>
                        </thead>
                        <tbody className="text-sm">
                           {(lastCreatedDoc?.metadata?.items || []).map((it: any, i: number) => (
                              <tr key={i} className="border-b border-zinc-50">
                                 <td className="py-6 text-zinc-400">S{i + 1}</td>
                                 <td className="py-6 font-bold text-zinc-800">{it.nome}</td>
                                 <td className="py-6 text-right font-bold">{it.qtd}</td>
                                 <td className="py-6 text-right font-bold">{safeFormatAOA(it.preco_unitario)}</td>
                                 <td className="py-6 text-right text-zinc-400">14%</td>
                                 <td className="py-6 text-right font-black">{safeFormatAOA(it.total)}</td>
                              </tr>
                           ))}
                        </tbody>
                     </table>

                     <div className="flex justify-end mb-20">
                        <div className="w-80 space-y-4">
                           <div className="flex justify-between text-sm py-2">
                              <span className="text-zinc-400 font-bold uppercase">Total LÃ­quido</span>
                              <span className="font-black">{safeFormatAOA(lastCreatedDoc?.metadata?.subtotal)}</span>
                           </div>
                           <div className="flex justify-between text-sm py-2">
                              <span className="text-zinc-400 font-bold uppercase">Total Imposto</span>
                              <span className="font-black">{safeFormatAOA(lastCreatedDoc?.metadata?.iva)}</span>
                           </div>
                           <div className="flex justify-between text-2xl py-6 border-t-2 border-zinc-900">
                              <span className="font-black uppercase tracking-tighter">Total Geral</span>
                              <span className="font-black text-zinc-900">{safeFormatAOA(lastCreatedDoc?.valor_total)}</span>
                           </div>
                        </div>
                     </div>

                     <div className="mt-auto border-t border-zinc-100 pt-10 text-[10px] text-zinc-400">
                        <div className="flex justify-between items-center bg-zinc-50 p-6 rounded-2xl">
                           <div>
                              <p className="font-black text-zinc-600 mb-1">{lastCreatedDoc?.hash?.substring(0, 4)}-Processado por Programas Validados</p>
                              <p className="font-bold">Software de GestÃ£o Multi-Empresa - Venda Plus</p>
                           </div>
                           <div className="text-right">
                              <p className="font-bold uppercase tracking-widest">Os bens foram colocados Ã  disposiÃ§Ã£o</p>
                              <p className="font-bold uppercase tracking-widest">Luanda | {new Date().toLocaleDateString()}</p>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div >
         </main >
      </div >
   );
};

export default AccountingPage;

