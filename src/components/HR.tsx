
import React, { useState, useMemo, useEffect, useDeferredValue } from 'react';
import {
   Users, UserPlus, Search, Edit, Trash2, Camera, Printer, X, Save,
   ShieldCheck, Wallet, Calendar, Briefcase, Phone, MapPin,
   Fingerprint, TrendingUp, Star, CheckCircle2, AlertTriangle,
   Download, Filter, QrCode, IdCard, RefreshCw, Zap, Award,
   BarChart4, ArrowUpRight, ArrowDownLeft, FileText, LayoutDashboard,
   Settings, Layers, DollarSign, Clock, PlusCircle, LogOut, Target,
   Image as ImageIcon, Eye, Calculator, MapPinOff, UserCheck, FileCheck,
   FileSpreadsheet, FileDown, ClipboardList, GraduationCap, Home,
   Coins, Ban, Percent, Timer, CalendarDays, ScanBarcode, PieChart as PieIcon, Landmark,
   MessageCircle, Mail, ArrowLeft, History
} from 'lucide-react';
import {
   ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
   BarChart, Bar, Cell, PieChart, Pie, Legend, LineChart, Line, CartesianGrid
} from 'recharts';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { formatAOA } from '../constants';
import {
   Funcionario, RegistroPresenca, ReciboSalarial,
   MetaDesempenho, Departamento, ContratoTipo, FuncionarioStatus, PasseServico, User
} from '../types';
import { AmazingStorage, STORAGE_KEYS } from '../utils/storage';
import { supabase } from '../src/lib/supabase';
import Logo from '../components/Logo';
import BankAccountsTab from '../components/hr/BankAccountsTab';
import ContasBancariasPage from './ContasBancariasPage';
import VagasAdminTab from '../components/hr/VagasAdminTab';
import { formatError, withTimeout } from '../src/lib/utils';
import { safeQuery } from '../src/lib/supabaseUtils';
import { useSaaS } from '../src/contexts/SaaSContext';

// --- CONFIGURA��O DE HORÁRIO E REGRAS ---
const WORK_RULES = {
   startHour: 8, // 08:00
   startMinute: 0,
   endHour: 17, // 17:00
   toleranceMinutes: 15, // Tolerância de atraso
   dailyHours: 8,
   overtimeRateNormal: 1.5, // 150% Dias �teis
   overtimeRateSpecial: 2.0 // 200% Fim de semana/Feriados
};

const HOLIDAYS_ANGOLA: Record<string, string> = {
   '01-01': 'Ano Novo',
   '02-04': 'Dia do Início da Luta Armada',
   '03-08': 'Dia Internacional da Mulher',
   '04-04': 'Dia da Paz e Reconciliação Nacional',
   '05-01': 'Dia Internacional do Trabalhador',
   '09-17': 'Dia do Herói Nacional',
   '11-02': 'Dia dos Finados',
   '11-11': 'Dia da Independência Nacional',
   '12-25': 'Natal'
};

const PROVINCIAS = [
   'Bengo', 'Benguela', 'Bi�', 'Cabinda', 'Cuando Cubango', 'Cuanza Norte', 'Cuanza Sul',
   'Cunene', 'Huambo', 'Hu�la', 'Luanda', 'Lunda Norte', 'Lunda Sul', 'Malanje', 'Moxico',
   'Namibe', 'U�ge', 'Zaire'
];

// --- MOTOR DE CÁLCULO FISCAL ANGOLANO (IRT 2024 - CONFORME TABELA AGT) ---
const calculateIRT = (baseTributavel: number, isPrestacaoServico: boolean = false): number => {
   // Para Prestadores de Serviço, aplica-se a taxa flat de 6,5% (Retenção na Fonte - Art.º 67 CIRT)
   if (isPrestacaoServico) return baseTributavel * 0.065;

   if (baseTributavel <= 70000) return 0;
   if (baseTributavel <= 100000) return 3000 + (baseTributavel - 70000) * 0.10;
   if (baseTributavel <= 150000) return 6000 + (baseTributavel - 100000) * 0.13;
   if (baseTributavel <= 200000) return 12500 + (baseTributavel - 150000) * 0.16;
   if (baseTributavel <= 300000) return 31250 + (baseTributavel - 200000) * 0.18;
   if (baseTributavel <= 500000) return 49250 + (baseTributavel - 300000) * 0.19;
   if (baseTributavel <= 1000000) return 87250 + (baseTributavel - 500000) * 0.20;
   if (baseTributavel <= 1500000) return 187250 + (baseTributavel - 1000000) * 0.21;
   if (baseTributavel <= 2000000) return 292000 + (baseTributavel - 1500000) * 0.22;
   if (baseTributavel <= 2500000) return 402250 + (baseTributavel - 2000000) * 0.23;
   if (baseTributavel <= 5000000) return 517250 + (baseTributavel - 2500000) * 0.24;
   if (baseTributavel <= 10000000) return 1117250 + (baseTributavel - 5000000) * 0.245;
   return 2342250 + (baseTributavel - 10000000) * 0.25;
};

// --- HELPERS DE TEMPO ---
const calculateAge = (birthDate: string) => {
   if (!birthDate) return 0;
   const today = new Date();
   const birth = new Date(birthDate);
   let age = today.getFullYear() - birth.getFullYear();
   const m = today.getMonth() - birth.getMonth();
   if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
   return Math.max(0, age);
};

const isSpecialDay = (dateStr: string) => {
   const date = new Date(dateStr);
   const day = date.getDay();
   const md = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

   const isWeekend = day === 0 || day === 6; // Domingo ou Sbado
   const holidayName = HOLIDAYS_ANGOLA[md];
   const isHoliday = !!holidayName;

   return { isWeekend, isHoliday, holidayName, isSpecial: isWeekend || isHoliday };
};

const calculateTimeStats = (start: string, end: string, dateStr: string) => {
   const [h1, m1] = start.split(':').map(Number);
   const [h2, m2] = end.split(':').map(Number);

   const d1 = new Date(); d1.setHours(h1, m1, 0);
   const d2 = new Date(); d2.setHours(h2, m2, 0);

   const diffMs = d2.getTime() - d1.getTime();
   const totalHours = diffMs / (1000 * 60 * 60);

   // Verifica��o de Atraso
   const scheduleStart = new Date();
   scheduleStart.setHours(WORK_RULES.startHour, WORK_RULES.startMinute, 0);
   // Ajustar d1 para comparar apenas tempo
   const entryTime = new Date(scheduleStart);
   entryTime.setHours(h1, m1, 0);

   let delayMinutes = 0;
   if (entryTime > scheduleStart) {
      const delayMs = entryTime.getTime() - scheduleStart.getTime();
      const delayMins = delayMs / (1000 * 60);
      if (delayMins > WORK_RULES.toleranceMinutes) {
         delayMinutes = Math.floor(delayMins);
      }
   }

   // Verifica��o de Horas Extras e Tipo de Dia
   const { isSpecial } = isSpecialDay(dateStr);

   let extraHours = 0;
   let normalHours = 0;

   if (isSpecial) {
      // Fim de semana ou feriado: Tudo conta como extra
      extraHours = totalHours;
   } else {
      // Dia �til
      if (totalHours > WORK_RULES.dailyHours) {
         normalHours = WORK_RULES.dailyHours;
         extraHours = totalHours - WORK_RULES.dailyHours;
      } else {
         normalHours = totalHours;
      }
   }

   return {
      total: Number(totalHours.toFixed(2)),
      extra: Number(extraHours.toFixed(2)),
      delay: delayMinutes,
      isSpecial
   };
};

// --- HELPER DE MAPEAMENTO DE DADOS DO BANCO PARA O ESTADO ---
const mapFuncionario = (f: any): Funcionario => ({
   id: f.id,
   nome: f.nome,
   // Fallback para o regex caso os campos novos estejam vazios (dados antigos)
   data_nascimento: f.data_nascimento || f.notas?.match(/Nascimento: (.*?)(?:$|\n)/)?.[1] || '',
   funcao: f.cargo || f.funcao,
   bilhete: f.bi || f.bilhete,
   telefone: f.telefone,
   morada: f.morada || f.notas?.match(/Morada: (.*?)(?:$|\n)/)?.[1] || '',
   departamento_id: f.departamento || f.departamento_id,
   data_admissao: f.data_admissao,
   tipo_contrato: f.tipo_contrato || f.notas?.match(/Contrato: (.*?)(?:$|\n)/)?.[1] || 'Efectivo',
   status: f.status as any,
   nivel_escolaridade: f.nivel_escolaridade || f.notas?.match(/Escolaridade: (.*?)(?:$|\n)/)?.[1] || '',
   area_formacao: f.area_formacao || f.notas?.match(/Curso: (.*?)(?:$|\n)/)?.[1] || '',
   salario_base: Number(f.salario || f.salario_base) || 0,
   subsidio_alimentacao: Number(f.subsidio_alimentacao) || 0,
   subsidio_transporte: Number(f.subsidio_transporte) || 0,
   bonus_assiduidade: 0,
   outros_bonus: Number(f.outros_bonus) || 0,
   foto_url: f.foto_url,
   documentos: f.documentos || [],
   historico_alteracoes: f.historico_alteracoes || [],
   tempo_contrato: f.tempo_contrato || f.notas?.match(/Tempo: (.*?)(?:$|\n)/)?.[1] || '',
   provincia: f.provincia || f.notas?.match(/Provincia: (.*?)(?:$|\n)/)?.[1] || 'Benguela',
   municipio: f.municipio || f.notas?.match(/Municipio: (.*?)(?:$|\n)/)?.[1] || '',
   nome_pai: f.nome_pai || f.notas?.match(/Pai: (.*?)(?:$|\n)/)?.[1] || '',
   nome_mae: f.nome_mae || f.notas?.match(/Mae: (.*?)(?:$|\n)/)?.[1] || '',
   telefone_alternativo: f.telefone_alternativo || f.notas?.match(/TelAlt: (.*?)(?:$|\n)/)?.[1] || ''
});

// --- TIPOS LOCAIS PARA PROCESSAMENTO ---
interface PayrollInput {
   horasExtras: number; // em horas
   faltas: number; // em dias
   bonus: number; // valor monet�rio
   premios: number; // valor monet�rio
   adiantamento: number; // valor monet�rio (loans)
   subFerias?: number;
   subNatal?: number;
   emprestimos?: number;
   outrosDesc?: number;
   numeroDocumento?: string;
}

interface HRPageProps {
   user: User;
}

const HRPage: React.FC<HRPageProps> = ({ user }) => {
   const { tenant, subscription, isModuleActive } = useSaaS();
   const isHRAdmin = true;
   const realRole = user.role;
   const [activeTab, setActiveTab] = useState<'dashboard' | 'gente' | 'payroll' | 'presenca' | 'performance' | 'passes' | 'contas' | 'vagas' | 'settings'>('dashboard');
   const [showModal, setShowModal] = useState(false);
   const [showMetaModal, setShowMetaModal] = useState(false);
   const [editingItem, setEditingItem] = useState<Funcionario | null>(null);
   const [searchTerm, setSearchTerm] = useState('');
   const deferredSearchTerm = useDeferredValue(searchTerm);
   const [isProcessing, setIsProcessing] = useState(false);
   const [photoPreview, setPhotoPreview] = useState<string | null>(null);
   const [printingPass, setPrintingPass] = useState<Funcionario | null>(null);
   const [viewingRecibo, setViewingRecibo] = useState<ReciboSalarial | null>(null);
   const [showPayrollSheetModal, setShowPayrollSheetModal] = useState(false);
   const [historyFuncionario, setHistoryFuncionario] = useState<Funcionario | null>(null);
   const [modalActiveTab, setModalActiveTab] = useState<'geral' | 'contas'>('geral');
   const [showShareOptions, setShowShareOptions] = useState(false);
   const [customWhatsApp, setCustomWhatsApp] = useState('');
   const [customMessage, setCustomMessage] = useState('');

   const handleWhatsAppShare = () => {
      if (!viewingRecibo) return;
      const phone = customWhatsApp.replace(/\D/g, '');
      if (!phone) return alert("Por favor, insira um nmero de WhatsApp vlido.");

      const message = encodeURIComponent(customMessage);
      window.open(`https://wa.me/${phone.startsWith('244') ? phone : '244' + phone}?text=${message}`, '_blank');
   };

   const handleEmailShare = () => {
      if (!viewingRecibo) return;
      const subject = encodeURIComponent(`Folha de Salrio - ${viewingRecibo.mes} ${viewingRecibo.ano}`);
      const body = encodeURIComponent(`Ol,\n\nSegue o resumo da sua folha de salrio:\n\nFuncionrio: ${viewingRecibo.nome}\nPerodo: ${viewingRecibo.mes} ${viewingRecibo.ano}\nValor Lquido: ${formatAOA(viewingRecibo.liquido)}\n\nAtenciosamente,\nAmazing Corporation`);
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
   };

   // Estados locais do formulrio para controlo dinâmico
   const [formState, setFormState] = useState({
      nascimento: '',
      idade: 0,
      provincia: 'Benguela',
      municipio: '',
      nome_pai: '',
      nome_mae: '',
      escolaridade: 'Ensino Mdio',
      curso: ''
   });

   const [funcionarios, setFuncionarios] = useState<Funcionario[]>(() => AmazingStorage.get(STORAGE_KEYS.FUNCIONARIOS, []).map(mapFuncionario));
   const [presencas, setPresencas] = useState<RegistroPresenca[]>(() => AmazingStorage.get(STORAGE_KEYS.PRESENCA, []));
   const [recibos, setRecibos] = useState<ReciboSalarial[]>(() => AmazingStorage.get(STORAGE_KEYS.RECIBOS, []));
   const [metas, setMetas] = useState<MetaDesempenho[]>(() => AmazingStorage.get(STORAGE_KEYS.METAS, []));
   const [corporateInfo, setCorporateInfo] = useState<any>(() => AmazingStorage.get(STORAGE_KEYS.CORPORATE_INFO, null));
   const [loading, setLoading] = useState(false);
   const [showMetaHistoryModal, setShowMetaHistoryModal] = useState(false);

   // --- ESTADO PARA PROCESSAMENTO DE FOLHA ---
   const [payrollInputs, setPayrollInputs] = useState<Record<string, PayrollInput>>({});

   useEffect(() => {
      if (viewingRecibo) {
         const funcionario = funcionarios.find(f => f.id === viewingRecibo.funcionario_id);
         setCustomWhatsApp(funcionario?.telefone || '');
         setCustomMessage(`*Amazing Corporation - Folha de Salário*\n\nOlá, segue o resumo do seu recibo de ${viewingRecibo.mes}/${viewingRecibo.ano}:\n\n👤 *Funcionário:* ${viewingRecibo.nome}\n📅 *Período:* ${viewingRecibo.mes} ${viewingRecibo.ano}\n💰 *Líquido a Receber:* ${formatAOA(viewingRecibo.liquido)}\n\n_Documento Interno: #${viewingRecibo.id.substring(0, 8).toUpperCase()}_`);
         setShowShareOptions(false);
      }
   }, [viewingRecibo, funcionarios]);
   const [payrollDocNumber, setPayrollDocNumber] = useState(`DOC-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);

   const currentMonthName = new Date().toLocaleString('pt-PT', { month: 'long' });
   const currentFiscalYear = new Date().getFullYear();

   const lastFetchRef = React.useRef<number>(0);
   const fetchHRData = async () => {
      // Debounce: evitar múltiplas chamadas em menos de 2 segundos
      const now = Date.now();
      if (now - lastFetchRef.current < 2000) return;
      lastFetchRef.current = now;
      setLoading(true);

      // Fail-safe: Forçar desativação do loading após 8s se a rede estiver lenta
      const failSafe = setTimeout(() => {
         setLoading(prev => {
            if (prev) {
               console.warn("HR: Sincronização demorou demais, liberando UI...");
               return false;
            }
            return prev;
         });
      }, 8000);

      try {
         const tenantId = user.tenant_id || tenant?.id;

         if (!tenantId && user.role !== 'saas_admin') {
            console.warn("HR: Tenant ID não encontrado, abortando fetch.");
            setLoading(false);
            return;
         }

         console.log("HR: Iniciando sincronização de dados...");
         // 1. Fetch everything in PARALLEL to avoid waterfalls
         const [funcsRes, presRes, recRes, metasRes, corpRes] = await Promise.allSettled([
            safeQuery(() => supabase.from('funcionarios').select('*').eq('tenant_id', tenantId).order('nome', { ascending: true })),
            safeQuery(() => supabase.from('hr_presencas').select('*').eq('tenant_id', tenantId).order('data', { ascending: false }).limit(200)),
            safeQuery(() => supabase.from('hr_recibos').select('*').eq('tenant_id', tenantId).order('data_emissao', { ascending: false }).limit(200)),
            safeQuery(() => supabase.from('hr_metas').select('*').eq('tenant_id', tenantId).order('status', { ascending: true })),
            safeQuery(() => supabase.from('config_sistema').select('*').eq('tenant_id', tenantId).eq('categoria', 'empresa'))
         ]) as any[];

         // --- PROCESS EMPLOYEES ---
         if (funcsRes.status === 'fulfilled' && !funcsRes.value.error && funcsRes.value.data) {
            const data = funcsRes.value.data;
            setFuncionarios(data.map(mapFuncionario));
            localStorage.setItem(STORAGE_KEYS.FUNCIONARIOS, JSON.stringify(data));
         } else {
            if (funcsRes.status === 'rejected') console.error("HR: Erro ao carregar funcionários", funcsRes.reason);
            const cached = AmazingStorage.get(STORAGE_KEYS.FUNCIONARIOS, []);
            if (cached.length > 0) setFuncionarios(cached.map(mapFuncionario));
         }

         // --- PROCESS PRESENCES ---
         if (presRes.status === 'fulfilled' && !presRes.value.error && presRes.value.data) {
            const data = presRes.value.data;
            setPresencas(data as any);
            localStorage.setItem(STORAGE_KEYS.PRESENCA, JSON.stringify(data));
         } else {
            setPresencas(AmazingStorage.get(STORAGE_KEYS.PRESENCA, []));
         }

         // --- PROCESS RECEIPTS ---
         if (recRes.status === 'fulfilled' && !recRes.value.error && recRes.value.data) {
            const data = recRes.value.data;
            setRecibos(data);
            localStorage.setItem(STORAGE_KEYS.RECIBOS, JSON.stringify(data));
         } else {
            setRecibos(AmazingStorage.get(STORAGE_KEYS.RECIBOS, []));
         }

         // --- PROCESS METAS ---
         if (metasRes.status === 'fulfilled' && !metasRes.value.error && metasRes.value.data) {
            setMetas(metasRes.value.data);
            localStorage.setItem(STORAGE_KEYS.METAS, JSON.stringify(metasRes.value.data));
         } else {
            setMetas(AmazingStorage.get(STORAGE_KEYS.METAS, []));
         }

         // --- PROCESS CORPORATE INFO ---
         if (corpRes.status === 'fulfilled' && !corpRes.value.error && corpRes.value.data) {
            const data = corpRes.value.data;
            const info: any = { ...corporateInfo };
            data.forEach((item: any) => {
               info[item.chave] = item.valor;
            });
            setCorporateInfo(info);
            AmazingStorage.save(STORAGE_KEYS.CORPORATE_INFO, info);
         }
      } catch (err) {
         console.error("HR: Erro crítico na sincronização:", err);
      } finally {
         clearTimeout(failSafe);
         setLoading(false);
         console.log("HR: Sincronização concluída.");
      }
   };

   useEffect(() => {
      // 2. Initial background sync
      fetchHRData();

      // 3. Real-time Subscriptions (Optimized: Single channel for all HR changes)
      const tenantId = user.tenant_id || tenant?.id;
      if (!tenantId) return;

      const channel = supabase.channel(`hr_changes_${tenantId}`)
         .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'funcionarios',
            filter: `tenant_id=eq.${tenantId}`
         }, () => fetchHRData())
         .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'hr_presencas',
            filter: `tenant_id=eq.${tenantId}`
         }, () => fetchHRData())
         .subscribe();

      // Fallback polling (cada 120 seg - aumentado de 60s)
      const interval = setInterval(() => {
         fetchHRData();
      }, 120000);

      return () => {
         supabase.removeChannel(channel);
         clearInterval(interval);
      };
   }, []);

   // Atualiza idade quando data de nascimento muda
   useEffect(() => {
      if (formState.nascimento) {
         setFormState(prev => ({ ...prev, idade: calculateAge(prev.nascimento) }));
      }
   }, [formState.nascimento]);

   const handleSaveCorporateInfo = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const newInfo = { ...corporateInfo };
      const keys = ['company_name', 'company_nif', 'company_address', 'company_phone', 'company_email', 'company_bank', 'company_iban'];

      setLoading(true);
      try {
         for (const key of keys) {
            const val = formData.get(key) as string;
            newInfo[key] = val;
            await safeQuery(() => supabase.from('config_sistema').upsert({
               tenant_id: user.tenant_id,
               categoria: 'empresa',
               chave: key,
               valor: val,
               updated_at: new Date().toISOString()
            }, { onConflict: 'tenant_id,categoria,chave' }));
         }
         setCorporateInfo(newInfo);
         AmazingStorage.save(STORAGE_KEYS.CORPORATE_INFO, newInfo);
         alert("Configurações atualizadas com sucesso!");
      } catch (err) {
         console.error("Erro ao salvar config:", err);
      } finally {
         setLoading(false);
      }
   };

   const handleOpenModal = (func: Funcionario | null) => {
      setEditingItem(func);
      setPhotoPreview(func?.foto_url || null);
      if (func) {
         setFormState({
            nascimento: func.data_nascimento,
            idade: calculateAge(func.data_nascimento),
            provincia: (func as any).provincia || 'Benguela',
            municipio: (func as any).municipio || '',
            nome_pai: (func as any).nome_pai || '',
            nome_mae: (func as any).nome_mae || '',
            escolaridade: func.nivel_escolaridade || 'Ensino Mdio',
            curso: func.area_formacao || ''
         });
      } else {
         setFormState({
            nascimento: '',
            idade: 0,
            provincia: 'Benguela',
            municipio: '',
            nome_pai: '',
            nome_mae: '',
            escolaridade: 'Ensino Mdio',
            curso: ''
         });
      }
      setModalActiveTab('geral');
      setShowModal(true);
   };

   const handleAddMeta = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const nova = {
         funcionario_id: fd.get('func_id') as string,
         titulo: fd.get('titulo') as string,
         progresso: 0,
         prazo: fd.get('prazo') as string,
         status: 'Em curso',
         tenant_id: user.tenant_id
      };

      try {
         const { error } = await safeQuery(() => supabase.from('hr_metas').insert([nova]));
         if (error) throw error;
         fetchHRData();
         setShowMetaModal(false);
      } catch (err: any) {
         console.error('Erro ao criar meta:', err);
         alert(`Erro ao criar meta: ${err.message || 'Erro desconhecido'}`);
      }
   };

   const handleDeleteMeta = async (id: string) => {
      if (!confirm('Deseja realmente eliminar esta meta?')) return;
      try {
         const { error } = await safeQuery(() => supabase.from('hr_metas').delete().eq('id', id).eq('tenant_id', user.tenant_id));
         if (error) throw error;
         fetchHRData();
      } catch (err: any) {
         console.error('Erro ao eliminar meta:', err);
         alert(`Erro ao eliminar meta: ${err.message || 'Erro desconhecido'}`);
      }
   };

   const updateMetaProgresso = async (id: string, novoProgresso: number) => {
      try {
         const { error } = await safeQuery(() => supabase.from('hr_metas').update({
            progresso: novoProgresso,
            status: novoProgresso === 100 ? 'Concluda' : 'Em curso'
         }).eq('id', id).eq('tenant_id', user.tenant_id));
         if (error) throw error;
         fetchHRData();
      } catch (err) {
         alert('Erro ao atualizar meta');
      }
   };

   const registrarPonto = async (funcId: string, tipo: 'entrada' | 'saida') => {
      const hoje = new Date().toISOString().split('T')[0];
      const agora = new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
      const func = funcionarios.find(f => f.id === funcId);

      try {
         if (tipo === 'entrada') {
            const { data: existing, error: checkErr } = await safeQuery(() => supabase
               .from('hr_presencas')
               .select('*')
               .eq('tenant_id', user.tenant_id)
               .eq('funcionario_id', funcId)
               .eq('data', hoje)
               .maybeSingle());

            if (existing) return alert("J registou entrada hoje.");

            const [h, m] = agora.split(':').map(Number);
            const entryDate = new Date(); entryDate.setHours(h, m, 0);
            const scheduleDate = new Date(); scheduleDate.setHours(WORK_RULES.startHour, WORK_RULES.startMinute, 0);

            let status: any = 'Presente';
            if (entryDate > scheduleDate) {
               const diffMins = (entryDate.getTime() - scheduleDate.getTime()) / 60000;
               if (diffMins > WORK_RULES.toleranceMinutes) status = 'Atraso';
            }

            const { error } = await safeQuery(() => supabase.from('hr_presencas').insert([{
               funcionario_id: funcId,
               data: hoje,
               entrada: agora,
               status: status,
               tenant_id: user.tenant_id
            }]));

            if (error) throw error;
            await fetchHRData();
            AmazingStorage.logAction('Ponto', 'RH', `Check-in: ${func?.nome} (${status})`);
         } else {
            const { data: ponto, error: fetchErr } = await safeQuery(() => supabase
               .from('hr_presencas')
               .select('*')
               .eq('tenant_id', user.tenant_id)
               .eq('funcionario_id', funcId)
               .eq('data', hoje)
               .is('saida', null)
               .maybeSingle());

            if (fetchErr || !ponto) return alert("Registo de entrada ativo no localizado para hoje.");

            const stats = calculateTimeStats(ponto.entrada, agora, hoje);

            const { error: updErr } = await safeQuery(() => supabase.from('hr_presencas').update({
               saida: agora,
               horas_extras: stats.extra
            }).eq('id', ponto.id).eq('tenant_id', user.tenant_id));

            if (updErr) throw updErr;

            await fetchHRData();
            AmazingStorage.logAction('Ponto', 'RH', `Check-out: ${func?.nome}`);
         }
      } catch (err: any) {
         console.error("Erro no ponto:", err);
         alert(`Erro ao registar ponto: ${err.message || 'Verifique a ligao'}`);
      }
   };

   // --- ATUALIZAO DE VARIÁVEIS DE FOLHA ---
   const updatePayrollInput = (id: string, field: keyof PayrollInput, value: number) => {
      const numericValue = isNaN(value) ? 0 : value;
      setPayrollInputs(prev => ({
         ...prev,
         [id]: {
            ...(prev[id] || { horasExtras: 0, faltas: 0, bonus: 0, adiantamento: 0, premios: 0, subFerias: 0, subNatal: 0, emprestimos: 0, outrosDesc: 0 }),
            [field]: numericValue
         }
      }));
   };

   // --- AGREGAO AUTOMÁTICA DE DADOS DE PONTO PARA FOLHA ---
   const getAutoPayrollData = (funcId: string): PayrollInput => {
      if (payrollInputs[funcId]) return payrollInputs[funcId];

      const now = new Date();
      const currentMonthStr = now.toISOString().slice(0, 7);
      const records = presencas.filter(p => p.funcionario_id === funcId && p.data.startsWith(currentMonthStr));

      let totalExtras = 0;
      let faltas = 0;

      // Calcular faltas automáticas até ao dia de hoje
      const dayOfMonth = now.getDate();
      for (let i = 1; i <= dayOfMonth; i++) {
         const d = new Date(now.getFullYear(), now.getMonth(), i);
         const dateStr = d.toISOString().split('T')[0];
         const { isSpecial } = isSpecialDay(dateStr);

         if (!isSpecial) { // Dia útil
            const hasRecord = records.some(p => p.data === dateStr);
            if (!hasRecord) faltas++;
         }
      }

      records.forEach(r => {
         if (r.horas_extras) {
            const { isSpecial } = isSpecialDay(r.data);
            const factor = isSpecial ? (WORK_RULES.overtimeRateSpecial / WORK_RULES.overtimeRateNormal) : 1;
            totalExtras += (r.horas_extras * factor);
         }
      });

      return {
         horasExtras: parseFloat(totalExtras.toFixed(2)),
         faltas: faltas,
         bonus: 0,
         adiantamento: 0,
         premios: 0,
         subFerias: 0,
         subNatal: 0,
         emprestimos: 0,
         outrosDesc: 0
      };
   };

   // --- CÁLCULO DE FOLHA INDIVIDUAL (MOTOR DE CÁLCULO) ---
   const calculatePayrollForEmployee = (f: Funcionario) => {
      const inputs = payrollInputs[f.id] || getAutoPayrollData(f.id);

      const DIAS_UTEIS = 30;
      const HORAS_MENSAIS = 173.33;
      const INSS_WORKER_RATE = 0.03;
      const INSS_COMPANY_RATE = 0.08;
      const EXEMPT_ALLOWANCE_LIMIT = 30000;

      const isPrestacaoServico = f.tipo_contrato === 'Prestação de Serviços';

      const base = Number(f.salario_base) || 0;
      const valorHora = base / HORAS_MENSAIS;
      const valorDia = base / DIAS_UTEIS;

      // Rendimentos
      const valorHorasExtras = inputs.horasExtras * (valorHora * WORK_RULES.overtimeRateNormal);
      const subAlim = Number(f.subsidio_alimentacao) || 0;
      const subTrans = Number(f.subsidio_transporte) || 0;
      const subFerias = Number(inputs.subFerias) || 0;
      const subNatal = Number(inputs.subNatal) || 0;
      const subsidiosTotal = subAlim + subTrans + subFerias + subNatal;
      const premiosBonus = (inputs.bonus || 0) + (inputs.premios || 0) + (Number(f.outros_bonus) || 0);

      // Total Proventos (Salário Base + Horas Extras + Subsídios + Bónus)
      const totalProventos = base + valorHorasExtras + subsidiosTotal + premiosBonus;
      const bruto = totalProventos;

      // INSS (Base: Salário Base + Horas Extras + Bónus)
      // Trabalhadores em Prestação de Serviço geralmente não descontam INSS na folha da empresa
      const baseINSS = isPrestacaoServico ? 0 : (base + valorHorasExtras + premiosBonus);
      const inss = baseINSS * INSS_WORKER_RATE;
      const inssEmpresa = baseINSS * INSS_COMPANY_RATE;

      // IRT (Base: Bruto - INSS - Isenções)
      const exemptSubAlim = Math.min(subAlim, EXEMPT_ALLOWANCE_LIMIT);
      const exemptSubTrans = Math.min(subTrans, EXEMPT_ALLOWANCE_LIMIT);
      const baseIRT = bruto - inss - exemptSubAlim - exemptSubTrans;

      const irt = calculateIRT(baseIRT, isPrestacaoServico);

      // Descontos
      const descontoFaltas = (inputs.faltas || 0) * valorDia;
      const emprestimos = (inputs.emprestimos || 0) + (inputs.adiantamento || 0);
      const outrosDesc = (inputs.outrosDesc || 0);
      const totalDescontos = inss + irt + descontoFaltas + emprestimos + outrosDesc;

      const liquido = bruto - totalDescontos;

      return {
         bruto, inss, inssEmpresa, irt, descontoFaltas, totalDescontos, liquido,
         valorHorasExtras, premiosBonus, subsidiosTotal, subAlim, subTrans, subFerias, subNatal,
         totalProventos, emprestimos, outrosDesc, inputs
      };
   };

   const handleProcessPayroll = async () => {
      const ativos = funcionarios.filter(f => f.status === 'ativo');
      if (ativos.length === 0) return alert("No existem colaboradores activos.");

      // 1. Transparent session check (no more alerts)
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      let session = currentSession;

      if (!session) {
         const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
         session = refreshedSession;
      }
      // If still no session, let the insert/select fail and handle via catch, avoiding the early alert.

      // Verificar se j existe processamento para este ms
      const { data: existing } = await safeQuery(() => supabase.from('hr_recibos').select('id').eq('tenant_id', user.tenant_id).eq('mes', currentMonthName).eq('ano', currentFiscalYear));

      if (existing && existing.length > 0) {
         const confirmUpdate = confirm(`A folha de ${currentMonthName}/${currentFiscalYear} j foi processada (${existing.length} recibos). Deseja ANULAR os anteriores e processar novamente?`);
         if (!confirmUpdate) return;

         // Eliminar anteriores
         const { error: delError } = await safeQuery(() => supabase.from('hr_recibos').delete().eq('tenant_id', user.tenant_id).eq('mes', currentMonthName).eq('ano', currentFiscalYear));
         if (delError) return alert("Erro ao limpar processamento anterior.");
      } else {
         if (!confirm(`Confirma o processamento definitivo da folha de ${currentMonthName}/${currentFiscalYear}?`)) return;
      }

      setIsProcessing(true);
      try {
         const novosRecibos = ativos.map(f => {
            const calc = calculatePayrollForEmployee(f);
            return {
               id: `REC-${Date.now()}-${f.id.substring(0, 5)}-${Math.random().toString(36).substring(2, 7)}`,
               funcionario_id: f.id,
               nome: f.nome,
               cargo: f.funcao,
               bilhete: f.bilhete,
               mes: currentMonthName,
               ano: currentFiscalYear,
               base: f.salario_base || 0,
               subsidios: Number((calc.subsidiosTotal || 0).toFixed(2)),
               subsidio_alimentacao: Number((calc.subAlim || 0).toFixed(2)),
               subsidio_transporte: Number((calc.subTrans || 0).toFixed(2)),
               subsidio_ferias: Number((calc.subFerias || 0).toFixed(2)),
               subsidio_natal: Number((calc.subNatal || 0).toFixed(2)),
               horas_extras_valor: Number((calc.valorHorasExtras || 0).toFixed(2)),
               bonus_premios: Number((calc.premiosBonus || 0).toFixed(2)),
               total_proventos: Number((calc.totalProventos || 0).toFixed(2)),
               inss_trabalhador: Number((calc.inss || 0).toFixed(2)),
               irt: Number((calc.irt || 0).toFixed(2)),
               faltas_desconto: Number((calc.descontoFaltas || 0).toFixed(2)),
               adiantamentos: Number((calc.emprestimos || 0).toFixed(2)),
               emprestimos: Number((calc.emprestimos || 0).toFixed(2)),
               outros_descontos: Number((calc.outrosDesc || 0).toFixed(2)),
               bruto: Number((calc.bruto || 0).toFixed(2)),
               liquido: Number((calc.liquido || 0).toFixed(2)),
               data_emissao: new Date().toISOString(),
               numero_documento: payrollDocNumber,
               tenant_id: user.tenant_id
            };
         });

         const { error } = await safeQuery(() => supabase.from('hr_recibos').insert(novosRecibos));

         if (error) {
            console.error("Payroll Insert Error:", error);
            throw error;
         }

         await fetchHRData();
         AmazingStorage.logAction('Payroll', 'RH', `Folha de ${currentMonthName} processada com sucesso.`);
         alert("Folha de salrios processada e fechada com sucesso!");
      } catch (error: any) {
         console.error("Critical Payroll Error:", error);
         alert(`Falha no processamento: ${error.message || 'Erro de rede ou permisso'}`);
      } finally {
         setIsProcessing(false);
      }
   };

   // --- ANALYTICS DATA PREPARATION ---
   const analyticsData = useMemo(() => {
      // 1. Custos por Departamento (Pie Chart)
      const deptCosts: Record<string, number> = {};
      funcionarios.forEach(f => {
         const dept = f.departamento_id || 'Administrao';
         deptCosts[dept] = (deptCosts[dept] || 0) + (f.salario_base || 0);
      });
      const pieData = Object.entries(deptCosts).map(([name, value]) => ({ name, value }));

      // 2. Evoluo de Custos (Area Chart) - Baseado nos recibos existentes
      const monthsShort = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const monthMap: Record<string, string> = {
         'janeiro': 'Jan', 'fevereiro': 'Fev', 'maro': 'Mar', 'abril': 'Abr', 'maio': 'Mai', 'junho': 'Jun',
         'julho': 'Jul', 'agosto': 'Ago', 'setembro': 'Set', 'outubro': 'Out', 'novembro': 'Nov', 'dezembro': 'Dez'
      };

      const history: Record<string, number> = {};

      recibos.forEach(r => {
         const mShort = monthMap[r.mes?.toLowerCase()] || r.mes;
         history[mShort] = (history[mShort] || 0) + (r.liquido || 0);
      });

      const currentMonthShort = monthMap[currentMonthName.toLowerCase()] || currentMonthName;
      const chartArea = monthsShort.map(m => ({
         name: m,
         custo: history[m] || 0
      })).filter(d => d.custo > 0 || monthsShort.indexOf(d.name) <= monthsShort.indexOf(currentMonthShort));

      // 3. Performance de Metas (Bar Chart)
      const metaStats = { completed: 0, pending: 0 };
      metas.forEach(m => {
         if (m.status === 'Concluda') metaStats.completed++;
         else metaStats.pending++;
      });
      const barData = [
         { name: 'Concludas', valor: metaStats.completed, fill: '#22c55e' },
         { name: 'Em Curso', valor: metaStats.pending, fill: '#eab308' }
      ];

      // 4. Notificaões de Contratos a Expirar (Prximos 30 dias)
      const proximosVencimentos = funcionarios.filter(f => {
         if (f.tipo_contrato !== 'Determinado' && f.tipo_contrato !== 'Estgio') return false;
         if (!f.data_admissao || !f.tempo_contrato) return false;

         const meses = parseInt(f.tempo_contrato);
         if (isNaN(meses)) return false;

         const admissao = new Date(f.data_admissao);
         const vencimento = new Date(admissao.setMonth(admissao.getMonth() + meses));
         const hoje = new Date();
         const diffDays = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

         return diffDays > 0 && diffDays <= 30;
      }).map(f => ({
         id: f.id,
         nome: f.nome,
         cargo: f.cargo,
         vencimento: new Date(new Date(f.data_admissao).setMonth(new Date(f.data_admissao).getMonth() + parseInt(f.tempo_contrato))).toLocaleDateString()
      }));

      const currentCost = funcionarios.reduce((acc, f) => acc + (f.salario_base || 0), 0);

      return {
         total: funcionarios.length,
         ativos: funcionarios.filter(f => f.status === 'ativo').length,
         metasTotal: metas.length,
         pieData,
         chartArea,
         barData,
         payrollCost: currentCost,
         proximosVencimentos
      };
   }, [funcionarios, metas, recibos]);

   const handleSubmitFuncionario = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const notes = [
         `Nascimento: ${formState.nascimento}`,
         `Morada: ${fd.get('morada')}`,
         `Contrato: ${fd.get('tipo_contrato')}`,
         `Escolaridade: ${formState.escolaridade}`,
         `Curso: ${formState.curso}`,
         `SubAlim: ${fd.get('sub_alim')}`,
         `SubTrans: ${fd.get('sub_trans')}`,
         `Tempo: ${fd.get('tempo')}`,
         `Provincia: ${formState.provincia}`,
         `Municipio: ${formState.municipio}`,
         `Pai: ${formState.nome_pai}`,
         `Mae: ${formState.nome_mae}`,
         `TelAlt: ${fd.get('telefone_alternativo')}`
      ].join('\n');

      const dbData = {
         nome: fd.get('nome') as string,
         cargo: fd.get('funcao') as string,
         bi: fd.get('bilhete') as string,
         telefone: fd.get('telefone') as string,
         departamento: fd.get('departamento') as string,
         data_admissao: fd.get('admissao') as string,
         status: (fd.get('status') as string) || 'ativo',
         salario: Number(fd.get('salario_base')) || 0,
         subsidio_alimentacao: Number(fd.get('sub_alim')) || 0,
         subsidio_transporte: Number(fd.get('sub_trans')) || 0,
         outros_bonus: Number(fd.get('outros_bonus')) || 0,
         foto_url: photoPreview || `https://ui-avatars.com/api/?name=${fd.get('nome')}&background=random`,
         notas: notes,
         updated_at: new Date().toISOString(),
         // Novos campos persistidos diretamente
         data_nascimento: formState.nascimento,
         provincia: formState.provincia,
         municipio: formState.municipio,
         nome_pai: formState.nome_pai,
         nome_mae: formState.nome_mae,
         telefone_alternativo: fd.get('telefone_alternativo') as string,
         nivel_escolaridade: formState.escolaridade,
         area_formacao: formState.curso,
         tempo_contrato: fd.get('tempo') as string,
         tipo_contrato: fd.get('tipo_contrato') as string,
         morada: fd.get('morada') as string,
         tenant_id: user.tenant_id
      };

      try {
         if (editingItem) {
            const { error } = await safeQuery(() => supabase.from('funcionarios').update(dbData).eq('id', editingItem.id).eq('tenant_id', user.tenant_id));
            if (error) throw error;
         } else {
            const { error } = await safeQuery(() => supabase.from('funcionarios').insert([{ ...dbData, created_at: new Date().toISOString() }]));
            if (error) throw error;
         }
         fetchHRData();
         setShowModal(false);
      } catch (err) {
         alert(formatError(err));
      }
   };

   const handleDeleteFuncionario = async (f: Funcionario) => {
      if (!confirm(`Deseja realmente EXCLUIR o colaborador ${f.nome} e todo o seu histórico (Recibos, Pontos e Metas)? Esta ação é irreversível!`)) return;

      try {
         // 1. Eliminar dependências (para evitar erro de Foreign Key)
         await Promise.all([
            safeQuery(() => supabase.from('hr_presencas').delete().eq('funcionario_id', f.id).eq('tenant_id', user.tenant_id)),
            safeQuery(() => supabase.from('hr_recibos').delete().eq('funcionario_id', f.id).eq('tenant_id', user.tenant_id)),
            safeQuery(() => supabase.from('hr_metas').delete().eq('funcionario_id', f.id).eq('tenant_id', user.tenant_id)),
            safeQuery(() => supabase.from('rh_contas_bancarias').delete().eq('funcionario_id', f.id).eq('tenant_id', user.tenant_id))
         ]);

         // 2. Eliminar o funcionário
         const { error } = await safeQuery(() => supabase.from('funcionarios').delete().eq('id', f.id).eq('tenant_id', user.tenant_id));
         if (error) throw error;

         // 3. Feedback e Sincronização
         if ((window as any).notify) {
            (window as any).notify("Colaborador eliminado com sucesso!", "success");
         } else {
            alert("Colaborador eliminado com sucesso!");
         }
         await fetchHRData();
      } catch (err: any) {
         console.error("Erro ao eliminar colaborador:", err);
         alert(`Falha ao eliminar: ${err.message || 'Erro de integridade ou permissão'}`);
      }
   };

   const COLORS_PIE = ['#eab308', '#22c55e', '#3b82f6', '#ef4444', '#a855f7'];

   // O carregamento agora é não-bloqueante

   return (
      <div className="space-y-8 animate-in fade-in duration-700 pb-20">
         <style>{`
            @media print {
               @page { size: A4 portrait; margin: 15mm; }
               body { background: white !important; }
               .no-print { display: none !important; }
               .print-only { display: block !important; }
               .active-tab-content { padding: 0 !important; margin: 0 !important; }
            }
         `}</style>

         {/* ... (MODALS DE RECIBO E FICHA TCNICA MANTIDOS DO CDIGO ANTERIOR) ... */}

         {/* CONTEÚDO PRINCIPAL (OCULTO NA IMPRESSÃO SE MODAL ESTIVER ABERTO) */}
         <div className={(viewingRecibo || printingPass) ? 'print:hidden' : ''}>
            {/* HEADER RH */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-sky-200 print:hidden">
               <div className="flex items-center gap-3">
                  <div className="p-3 bg-zinc-900 rounded-2xl shadow-xl border border-white/10"><Users className="text-yellow-500" size={28} /></div>
                  <div>
                     <h1 className="text-4xl font-black text-zinc-900 tracking-tighter uppercase leading-none">Gesto de <span className="text-yellow-500">Talentos</span></h1>
                     <p className="text-zinc-500 font-bold flex items-center gap-2 mt-1"><ShieldCheck size={14} className="text-green-600" /> Amazing Corporate Governance</p>
                  </div>
               </div>
               <div className="flex flex-wrap gap-2 bg-white/50 p-1.5 rounded-2xl border border-white/20 shadow-xl backdrop-blur-md">
                  {[
                     { id: 'dashboard', icon: <LayoutDashboard size={18} />, label: 'Resumo' },
                     { id: 'gente', icon: <Users size={18} />, label: 'Cadastro' },
                     { id: 'payroll', icon: <Wallet size={18} />, label: 'Folha' },
                     { id: 'presenca', icon: <Fingerprint size={18} />, label: 'Ponto' },
                     { id: 'performance', icon: <Award size={18} />, label: 'Metas' },
                     { id: 'passes', icon: <IdCard size={18} />, label: 'Passes' },
                     { id: 'vagas', icon: <UserPlus size={18} />, label: 'Vagas' },
                     { id: 'contas', icon: <Landmark size={18} />, label: 'Contas Bancrias' },
                     { id: 'settings', icon: <Settings size={18} />, label: 'Empresa' }
                  ].filter(tab => isHRAdmin || !['gente', 'payroll', 'contas', 'vagas'].includes(tab.id)).map(tab => (
                     <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === tab.id ? 'bg-zinc-900 text-white shadow-xl scale-105' : 'text-zinc-400 hover:bg-white hover:text-zinc-900'}`}>{tab.icon} {tab.label}</button>
                  ))}
               </div>
            </div>

            {/* DASHBOARD ANALÍTICO */}
            {activeTab === 'dashboard' && (
               <div className="space-y-8 animate-in slide-in-from-bottom-4">
                  {/* Notificaões e Alertas */}
                  {analyticsData.proximosVencimentos.length > 0 && (
                     <div className="bg-red-50 border border-red-100 p-8 rounded-[2.5rem] flex items-center justify-between shadow-sm animate-pulse">
                        <div className="flex items-center gap-6">
                           <div className="p-4 bg-red-600 text-white rounded-2xl shadow-lg">
                              <AlertTriangle size={32} />
                           </div>
                           <div>
                              <h4 className="text-lg font-black text-red-900 uppercase tracking-tight">Alertas de Contrato</h4>
                              <p className="text-sm font-bold text-red-700">H {analyticsData.proximosVencimentos.length} colaboradores com contrato a terminar nos prximos 30 dias.</p>
                           </div>
                        </div>
                        <div className="flex -space-x-4">
                           {analyticsData.proximosVencimentos.slice(0, 5).map(v => (
                              <div key={v.id} title={`${v.nome} - ${v.vencimento}`} className="w-12 h-12 rounded-full border-4 border-white bg-zinc-200 flex items-center justify-center font-black text-[10px] text-zinc-600 shadow-md">
                                 {v.nome.substring(0, 2).toUpperCase()}
                              </div>
                           ))}
                           {analyticsData.proximosVencimentos.length > 5 && (
                              <div className="w-12 h-12 rounded-full border-4 border-white bg-zinc-900 text-white flex items-center justify-center font-black text-[10px] shadow-md">
                                 +{analyticsData.proximosVencimentos.length - 5}
                              </div>
                           )}
                        </div>
                     </div>
                  )}

                  {/* KPI Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                     {loading && funcionarios.length === 0 ? (
                        <div className="col-span-4 py-12 text-center bg-white rounded-[2.5rem] border border-sky-100 shadow-sm animate-pulse flex flex-col items-center justify-center gap-4">
                           <RefreshCw className="w-10 h-10 text-yellow-500 animate-spin" />
                           <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Sincronizando Talentos...</p>
                        </div>
                     ) : (
                        <>
                           <div className="bg-white p-8 rounded-[2.5rem] border border-sky-100 shadow-sm flex flex-col justify-between">
                              <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">Colaboradores</p>
                              <p className="text-4xl font-black text-zinc-900">{analyticsData.total}</p>
                              <div className="mt-2 flex items-center gap-2 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg w-fit"><CheckCircle2 size={12} /> {analyticsData.ativos} Activos</div>
                           </div>
                           <div className="bg-zinc-900 p-8 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden">
                              <p className="text-yellow-500 text-[10px] font-black uppercase tracking-widest">Custo Mensal (Est)</p>
                              <p className="text-3xl font-black">{formatAOA(analyticsData.payrollCost)}</p>
                              <div className="absolute -right-4 -bottom-4 opacity-10"><DollarSign size={80} /></div>
                           </div>
                           <div className="bg-white p-8 rounded-[2.5rem] border border-sky-100 shadow-sm flex flex-col justify-between">
                              <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">Metas Activas</p>
                              <p className="text-4xl font-black text-zinc-900">{analyticsData.metasTotal}</p>
                           </div>
                           <div className="bg-white p-8 rounded-[2.5rem] border border-sky-100 shadow-sm flex flex-col justify-between">
                              <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">Departamentos</p>
                              <p className="text-4xl font-black text-zinc-900">{analyticsData.pieData.length}</p>
                           </div>
                        </>
                     )}
                  </div>

                  {/* Grficos */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                     <div className="bg-white p-10 rounded-[3rem] border border-sky-100 shadow-sm h-[400px] flex flex-col">
                        <h3 className="text-lg font-black uppercase tracking-tight mb-6 flex items-center gap-2">
                           <PieIcon className="text-yellow-500" size={20} /> Distribuio por Departamento
                        </h3>
                        <div className="flex-1 w-full min-h-0 relative">
                           <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                 <Pie
                                    data={analyticsData.pieData}
                                    cx="50%" cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                 >
                                    {analyticsData.pieData.map((entry, index) => (
                                       <Cell key={`cell-${index}`} fill={COLORS_PIE[index % COLORS_PIE.length]} stroke="none" />
                                    ))}
                                 </Pie>
                                 <Tooltip contentStyle={{ borderRadius: '16px', border: 'none' }} />
                                 <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                              </PieChart>
                           </ResponsiveContainer>
                        </div>
                     </div>

                     <div className="bg-white p-10 rounded-[3rem] border border-sky-100 shadow-sm h-[400px] flex flex-col">
                        <h3 className="text-lg font-black uppercase tracking-tight mb-6 flex items-center gap-2">
                           <TrendingUp className="text-green-600" size={20} /> Evoluo de Custos (Semestral)
                        </h3>
                        <div className="flex-1 w-full min-h-0">
                           <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={analyticsData.chartArea}>
                                 <defs>
                                    <linearGradient id="colorCusto" x1="0" y1="0" x2="0" y2="1">
                                       <stop offset="5%" stopColor="#eab308" stopOpacity={0.3} />
                                       <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                                    </linearGradient>
                                 </defs>
                                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                                 <YAxis hide />
                                 <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    formatter={(v: number) => formatAOA(v)}
                                 />
                                 <Area type="monotone" dataKey="custo" stroke="#eab308" strokeWidth={4} fillOpacity={1} fill="url(#colorCusto)" />
                              </AreaChart>
                           </ResponsiveContainer>
                        </div>
                     </div>
                  </div>
               </div>
            )}



            {/* GENTE / CADASTRO */}
            {activeTab === 'gente' && (
               <div className="space-y-6 animate-in slide-in-from-bottom-4">
                  <div className="flex flex-col md:flex-row gap-4 items-center">
                     <div className="flex-1 bg-white p-2 rounded-[2rem] shadow-sm border border-sky-100 w-full flex items-center">
                        <Search className="ml-6 text-zinc-300" /><input placeholder="Pesquisar..." className="w-full bg-transparent border-none focus:ring-0 py-4 px-4 font-bold" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                     </div>
                     {isHRAdmin && <button onClick={() => handleOpenModal(null)} className="px-10 py-5 bg-zinc-900 text-white rounded-2xl font-black text-[10px] uppercase hover:bg-yellow-500 transition-all flex items-center gap-3 shadow-xl"><UserPlus size={20} /> Admitir</button>}
                  </div>
                  <div className="bg-white rounded-[3rem] border border-sky-100 shadow-sm overflow-hidden">
                     <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[600px]">
                           <thead>
                              <tr className="bg-zinc-50 border-b border-zinc-100 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                 <th className="px-8 py-6">Colaborador</th><th className="px-8 py-6">Funo / Dept</th><th className="px-8 py-6">Vencimento</th><th className="px-8 py-6">Estado</th><th className="px-8 py-6 text-right">Acões</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-zinc-50 text-sm">
                              {funcionarios.filter(f => f.nome.toLowerCase().includes(deferredSearchTerm.toLowerCase())).map(f => (
                                 <tr key={f.id} className="hover:bg-zinc-50/50">
                                    <td className="px-8 py-5"><div className="flex items-center gap-4"><img src={f.foto_url} className="w-10 h-10 rounded-xl object-cover shadow-md" /><div><p className="font-black text-zinc-900">{f.nome}</p><p className="text-[10px] text-zinc-400">{f.bilhete}</p></div></div></td>
                                    <td className="px-8 py-5"><p className="font-bold text-zinc-700">{f.funcao}</p><p className="text-[10px] font-black text-sky-600 uppercase">{f.departamento_id}</p></td>
                                    <td className="px-8 py-5 font-black text-zinc-900">{formatAOA(f.salario_base)}</td>
                                    <td className="px-8 py-5"><span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${f.status === 'ativo' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{f.status}</span></td>
                                    <td className="px-8 py-5 text-right flex justify-end gap-2">
                                       <button onClick={() => setHistoryFuncionario(f)} className="p-3 text-zinc-300 hover:text-zinc-900" title="Ver Histrico Completo"><ClipboardList size={18} /></button>
                                       {isHRAdmin && <button onClick={() => handleOpenModal(f)} className="p-3 text-zinc-300 hover:text-yellow-600"><Edit size={18} /></button>}
                                       {isHRAdmin && <button onClick={() => { if (confirm('Excluir colaborador?')) safeQuery(() => supabase.from('funcionarios').delete().eq('id', f.id).eq('tenant_id', user.tenant_id)).then(() => fetchHRData()); }} className="p-3 text-zinc-300 hover:text-red-500"><Trash2 size={18} /></button>}
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  </div>
               </div>
            )}

            {/* PAYROLL / FOLHA */}
            {activeTab === 'payroll' && (
               <div className="space-y-8 animate-in slide-in-from-bottom-4">
                  {/* Grfico de Tendncia Salarial */}
                  <div className="bg-white p-8 rounded-[3rem] border border-sky-100 shadow-sm h-[300px]">
                     <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-4">Custo Total de Pessoal (Projeo)</h3>
                     <ResponsiveContainer width="100%" height="85%">
                        <AreaChart data={analyticsData.chartArea}>
                           <defs>
                              <linearGradient id="colorPayroll" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                 <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                              </linearGradient>
                           </defs>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                           <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                           <Tooltip formatter={(v: number) => formatAOA(v)} />
                           <Area type="monotone" dataKey="custo" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorPayroll)" />
                        </AreaChart>
                     </ResponsiveContainer>
                  </div>

                  <div className="bg-zinc-900 p-12 rounded-[4rem] text-white shadow-3xl overflow-hidden relative flex flex-col md:flex-row justify-between items-center">
                     <DollarSign className="absolute -right-10 -bottom-10 opacity-10" size={240} />
                     <div>
                        <h2 className="text-3xl font-black uppercase text-yellow-500">Mesa de Processamento</h2>
                        <p className="text-zinc-400 font-medium">Ciclo: {currentMonthName} {currentFiscalYear}</p>
                        <p className="text-[10px] text-zinc-500 mt-2 uppercase tracking-widest font-bold">Introduza variveis antes de processar</p>
                     </div>
                     <div className="flex flex-col md:flex-row gap-4 relative z-10 items-center">
                        <div className="flex flex-col gap-2">
                           <label className="text-[10px] font-black uppercase text-zinc-500 ml-4">N Documento</label>
                           <input
                              type="text"
                              value={payrollDocNumber}
                              onChange={e => setPayrollDocNumber(e.target.value)}
                              className="px-6 py-4 bg-white/5 border border-white/10 rounded-[2rem] text-white font-bold text-sm focus:border-yellow-500 transition-all outline-none min-w-[200px]"
                              placeholder="Ex: DOC-2024-001"
                           />
                        </div>
                        <button
                           onClick={handleProcessPayroll}
                           disabled={isProcessing}
                           className="px-8 py-5 bg-yellow-500 text-zinc-900 rounded-[2rem] font-black uppercase text-[10px] hover:bg-white transition-all shadow-2xl flex items-center gap-3 disabled:opacity-50 active:scale-95"
                        >
                           {isProcessing ? <RefreshCw className="animate-spin" size={20} /> : <Calculator size={20} />} {isProcessing ? 'Calculando...' : 'Processar Folha'}
                        </button>
                        <button
                           onClick={() => setShowPayrollSheetModal(true)}
                           className="px-8 py-5 bg-white/10 text-white border border-white/20 rounded-[2rem] font-black uppercase text-[10px] hover:bg-white hover:text-zinc-900 transition-all flex items-center gap-3 shadow-xl"
                        >
                           <FileText size={20} /> Imprimir Folha Geral
                        </button>
                     </div>
                  </div>

                  {/* WORKSPACE DE VARIÁVEIS MENSAIS */}
                  <div className="bg-white p-8 rounded-[3rem] border border-sky-100 shadow-sm overflow-hidden">
                     <table className="w-full text-left">
                        <thead>
                           <tr className="bg-zinc-50 border-b border-zinc-100 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                              <th className="px-6 py-4">Colaborador</th>
                              <th className="px-6 py-4">Salrio Base</th>
                              <th className="px-6 py-4 text-center">H. Extras</th>
                              <th className="px-6 py-4 text-center">Faltas</th>
                              <th className="px-6 py-4">Subsdios (Alim/Trans)</th>
                              <th className="px-6 py-4">Subs. Extras (Fr/Nat)</th>
                              <th className="px-6 py-4">Bnus/Prmios</th>
                              <th className="px-6 py-4">Emprst/Desc</th>
                              <th className="px-6 py-4 text-right">Lquido Est.</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50 text-xs">
                           {funcionarios.filter(f => f.status === 'ativo').map(f => {
                              const inputs = payrollInputs[f.id] || getAutoPayrollData(f.id);
                              const preview = calculatePayrollForEmployee(f);

                              return (
                                 <tr key={f.id} className="hover:bg-zinc-50/50 transition-all">
                                    <td className="px-6 py-4 font-bold text-zinc-900">{f.nome}</td>
                                    <td className="px-6 py-4 text-zinc-500">{formatAOA(f.salario_base)}</td>
                                    <td className="px-6 py-4">
                                       <input type="number" min="0" step="0.5" className="w-16 bg-zinc-100 border-none rounded p-1 text-center font-bold"
                                          value={inputs.horasExtras}
                                          onChange={e => updatePayrollInput(f.id, 'horasExtras', Number(e.target.value))}
                                       />
                                    </td>
                                    <td className="px-6 py-4">
                                       <input type="number" min="0" className="w-16 bg-zinc-100 border-none rounded p-1 text-center font-bold text-red-500"
                                          value={inputs.faltas}
                                          onChange={e => updatePayrollInput(f.id, 'faltas', Number(e.target.value))}
                                       />
                                    </td>
                                    <td className="px-6 py-4">
                                       <div className="flex flex-col gap-1">
                                          <input type="number" placeholder="Alim" className="hidden" />
                                          <div className="text-[10px] font-bold text-zinc-500">
                                             A: {formatAOA(f.subsidio_alimentacao)} | T: {formatAOA(f.subsidio_transporte)}
                                          </div>
                                       </div>
                                    </td>
                                    <td className="px-6 py-4">
                                       <div className="flex flex-col gap-1">
                                          <div className="flex items-center gap-1">
                                             <span className="text-[8px] font-black text-zinc-400">Fr:</span>
                                             <input type="number" min="0" className="w-20 bg-zinc-100 border-none rounded p-1 text-right text-[10px] font-bold"
                                                value={inputs.subFerias} onChange={e => updatePayrollInput(f.id, 'subFerias', Number(e.target.value))} />
                                          </div>
                                          <div className="flex items-center gap-1">
                                             <span className="text-[8px] font-black text-zinc-400">Nat:</span>
                                             <input type="number" min="0" className="w-20 bg-zinc-100 border-none rounded p-1 text-right text-[10px] font-bold"
                                                value={inputs.subNatal} onChange={e => updatePayrollInput(f.id, 'subNatal', Number(e.target.value))} />
                                          </div>
                                       </div>
                                    </td>
                                    <td className="px-6 py-4">
                                       <div className="flex flex-col gap-1">
                                          <input type="number" min="0" className="w-24 bg-zinc-100 border-none rounded p-1 text-right font-bold text-green-600"
                                             value={inputs.bonus}
                                             onChange={e => updatePayrollInput(f.id, 'bonus', Number(e.target.value))}
                                          />
                                          <div className="text-[9px] font-bold text-sky-600">Base: {formatAOA(f.outros_bonus)}</div>
                                       </div>
                                    </td>
                                    <td className="px-6 py-4">
                                       <div className="flex flex-col gap-1">
                                          <div className="flex items-center gap-1">
                                             <span className="text-[8px] font-black text-zinc-400">Emp:</span>
                                             <input type="number" min="0" className="w-20 bg-zinc-100 border-none rounded p-1 text-right text-[10px] font-bold text-orange-600"
                                                value={inputs.emprestimos} onChange={e => updatePayrollInput(f.id, 'emprestimos', Number(e.target.value))} />
                                          </div>
                                          <div className="flex items-center gap-1">
                                             <span className="text-[8px] font-black text-zinc-400">Out:</span>
                                             <input type="number" min="0" className="w-20 bg-zinc-100 border-none rounded p-1 text-right text-[10px] font-bold text-red-400"
                                                value={inputs.outrosDesc} onChange={e => updatePayrollInput(f.id, 'outrosDesc', Number(e.target.value))} />
                                          </div>
                                       </div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-black text-zinc-900 text-sm">
                                       {formatAOA(preview.liquido)}
                                    </td>
                                 </tr>
                              );
                           })}
                        </tbody>
                     </table>
                  </div>

                  {/* LISTA DE RECIBOS GERADOS */}
                  <div className="grid grid-cols-1 gap-4">
                     <h3 className="text-lg font-black text-zinc-900 uppercase ml-4">Histrico de Recibos Emitidos</h3>
                     {recibos.length > 0 ? recibos.map(r => (
                        <div key={r.id} className="bg-white p-8 rounded-[2.5rem] border border-sky-100 shadow-sm flex items-center justify-between group hover:shadow-xl transition-all">
                           <div className="flex items-center gap-6"><div className="w-14 h-14 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:bg-zinc-900 group-hover:text-white transition-all"><FileText size={28} /></div><div><h4 className="font-black text-zinc-900 text-lg">{r.nome}</h4><p className="text-[10px] font-black text-zinc-400 uppercase">{r.mes} / {r.ano}</p></div></div>
                           <div className="text-right">
                              <p className="text-[10px] font-black text-zinc-400 uppercase mb-1">Lquido</p>
                              <p className="text-2xl font-black text-zinc-900">{formatAOA(r.liquido)}</p>
                           </div>
                           <div className="flex gap-2 ml-6">
                              <button onClick={() => setViewingRecibo(r)} className="p-3 bg-zinc-50 text-zinc-400 hover:bg-zinc-900 hover:text-white rounded-xl transition-all"><Eye size={20} /></button>
                              <button onClick={() => { setViewingRecibo(r); setTimeout(() => window.print(), 300); }} className="p-3 bg-zinc-50 text-zinc-400 hover:bg-sky-600 hover:text-white rounded-xl transition-all"><Printer size={20} /></button>
                           </div>
                        </div>
                     )) : (
                        <div className="py-20 text-center bg-white rounded-[3rem] border border-dashed border-sky-200"><AlertTriangle className="mx-auto text-sky-100 mb-4" size={48} /><p className="text-zinc-400 font-bold italic">Sem recibos neste ciclo.</p></div>
                     )}
                  </div>
               </div>
            )}

            {/* PONTO / PRESENÇA */}
            {activeTab === 'presenca' && (
               <div className="space-y-8 animate-in slide-in-from-bottom-4">
                  {/* BANNER INFORMATIVO: TERMINAL DE PONTO */}
                  <div className="bg-zinc-900 p-10 rounded-[3rem] shadow-2xl text-white flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
                     <Fingerprint className="absolute -left-6 -bottom-6 opacity-10 text-yellow-500" size={200} />
                     <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                           <span className="px-3 py-1 bg-yellow-500 text-zinc-900 text-[9px] font-black uppercase rounded-full">Sistema Ativo</span>
                           <span className="text-zinc-500 text-[9px] font-black uppercase tracking-widest flex items-center gap-1"><Clock size={10} /> 08:00 - 17:00</span>
                        </div>
                        <h3 className="text-3xl font-black uppercase text-white tracking-tighter">Terminal de <span className="text-yellow-500">Ponto Digital</span></h3>
                        <p className="text-zinc-400 text-sm font-medium">Controlo Biométrico Virtual & Gestão de Assiduidade</p>
                     </div>
                     <div className="flex gap-4 relative z-10">
                        <div className="bg-white/5 px-8 py-5 rounded-[2rem] border border-white/10 text-center backdrop-blur-md">
                           <p className="text-[10px] font-black text-zinc-500 uppercase mb-1">Mês de Referência</p>
                           <p className="text-xl font-black uppercase text-yellow-500">{currentMonthName}</p>
                        </div>
                        <div className="bg-white/5 px-8 py-5 rounded-[2rem] border border-white/10 text-center backdrop-blur-md">
                           <p className="text-xl font-black">{new Date().toLocaleDateString('pt-PT')}</p>
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                     {/* COLUNA ESQUERDA: RESUMO E CALENDÁRIO */}
                     <div className="lg:col-span-8 space-y-8">
                        {/* RESUMO MENSAL PARA RH */}
                        {isHRAdmin && (
                           <div className="bg-white p-8 rounded-[3rem] border border-sky-100 shadow-sm overflow-hidden transition-all hover:shadow-xl">
                              <div className="flex items-center justify-between mb-8">
                                 <div>
                                    <h3 className="text-lg font-black text-zinc-900 uppercase">Assiduidade do Ciclo</h3>
                                    <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Resumo Consolidado (Base: 22 Dias Úteis)</p>
                                 </div>
                                 <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                       <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                       <span className="text-[10px] font-black text-zinc-500 uppercase">Faltas</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                       <div className="w-4 h-4 bg-yellow-500 rounded-lg flex items-center justify-center text-zinc-900"><Timer size={10} /></div>
                                       <span className="text-[10px] font-black text-zinc-500 uppercase">H. Extras</span>
                                    </div>
                                 </div>
                              </div>
                              <div className="overflow-x-auto">
                                 <table className="w-full text-left">
                                    <thead>
                                       <tr className="bg-zinc-50 border-b border-zinc-100 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                          <th className="px-6 py-4">Colaborador</th>
                                          <th className="px-6 py-4 text-center">Status</th>
                                          <th className="px-6 py-4 text-center">Presenças</th>
                                          <th className="px-6 py-4 text-center">Faltas</th>
                                          <th className="px-6 py-4 text-center">H. Extras</th>
                                          <th className="px-6 py-4 text-right">Aproveitamento</th>
                                       </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-50 text-xs">
                                       {funcionarios.filter(f => f.status === 'ativo').map(f => {
                                          const stats = getAutoPayrollData(f.id);
                                          const pontoHoje = presencas.find(p => p.funcionario_id === f.id && p.data === new Date().toISOString().split('T')[0]);
                                          const presencasMes = presencas.filter(p => p.funcionario_id === f.id && p.data.startsWith(new Date().toISOString().slice(0, 7))).length;
                                          const attendanceRate = Math.round((presencasMes / 22) * 100);

                                          return (
                                             <tr key={f.id} className="hover:bg-zinc-50/50 transition-all group">
                                                <td className="px-6 py-4">
                                                   <div className="flex items-center gap-3">
                                                      <img src={f.foto_url} className="w-8 h-8 rounded-lg object-cover shadow-sm grayscale group-hover:grayscale-0 transition-all" />
                                                      <span className="font-bold text-zinc-900 group-hover:text-yellow-600 transition-colors">{f.nome}</span>
                                                   </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                   <span className={`px-2 py-1 rounded-md text-[8px] font-black uppercase ${pontoHoje ? (pontoHoje.saida ? 'bg-zinc-100 text-zinc-400' : 'bg-green-500 text-white shadow-sm animate-pulse') : 'bg-red-50 text-red-400'}`}>
                                                      {pontoHoje ? (pontoHoje.saida ? 'Concluído' : 'Presente') : 'Pendente'}
                                                   </span>
                                                </td>
                                                <td className="px-6 py-4 text-center font-bold text-zinc-500">{presencasMes}</td>
                                                <td className="px-6 py-4 text-center font-black text-red-600">{stats.faltas}</td>
                                                <td className="px-6 py-4 text-center font-black text-yellow-600">+{stats.horasExtras}h</td>
                                                <td className="px-6 py-4">
                                                   <div className="flex items-center justify-end gap-3">
                                                      <div className="w-20 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                                                         <div className={`h-full rounded-full ${attendanceRate > 80 ? 'bg-green-500' : attendanceRate > 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${Math.min(100, attendanceRate)}%` }}></div>
                                                      </div>
                                                      <span className="text-[10px] font-black text-zinc-400">{attendanceRate}%</span>
                                                   </div>
                                                </td>
                                             </tr>
                                          );
                                       })}
                                    </tbody>
                                 </table>
                              </div>
                           </div>
                        )}

                        {/* GRID DE CARTÕES DE PONTO */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           {funcionarios.filter(f => f.status === 'ativo').map(f => {
                              const ponto = presencas.find(p => p.funcionario_id === f.id && p.data === new Date().toISOString().split('T')[0]);
                              return (
                                 <div key={f.id} className={`bg-white p-6 rounded-[2.5rem] border border-sky-100 shadow-sm flex flex-col justify-between hover:shadow-xl transition-all group ${ponto?.saida ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                                    <div className="flex items-center gap-4 mb-6">
                                       <div className="relative">
                                          <img src={f.foto_url} className="w-14 h-14 rounded-2xl object-cover shadow-md" />
                                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${ponto ? (ponto.saida ? 'bg-zinc-400' : 'bg-green-500 animate-pulse') : 'bg-red-500'}`}></div>
                                       </div>
                                       <div>
                                          <h4 className="font-black text-zinc-900 uppercase text-sm">{f.nome.split(' ')[0]}</h4>
                                          <p className="text-[9px] font-bold text-zinc-400 uppercase">{f.funcao}</p>
                                       </div>
                                    </div>
                                    <div className="space-y-4">
                                       <div className="grid grid-cols-2 gap-2 text-[9px] font-black uppercase text-zinc-400 bg-zinc-50 p-3 rounded-2xl">
                                          <div className="text-center"><p className="mb-1">Entrada</p><p className="text-xs text-zinc-900 font-black">{ponto?.entrada || '--:--'}</p></div>
                                          <div className="text-center border-l border-zinc-200"><p className="mb-1">Saída</p><p className="text-xs text-zinc-900 font-black">{ponto?.saida || '--:--'}</p></div>
                                       </div>
                                       {!ponto ? (
                                          <button onClick={() => registrarPonto(f.id, 'entrada')} className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-black uppercase text-[10px] hover:bg-green-600 transition-all flex items-center justify-center gap-2"><Clock size={14} /> Check-in</button>
                                       ) : !ponto.saida ? (
                                          <button onClick={() => registrarPonto(f.id, 'saida')} className="w-full py-4 bg-yellow-500 text-zinc-900 rounded-2xl font-black uppercase text-[10px] hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"><LogOut size={14} /> Check-out</button>
                                       ) : <div className="w-full py-4 bg-zinc-100 text-zinc-400 rounded-2xl text-center font-black uppercase text-[10px]">Jornada Concluída</div>}
                                    </div>
                                 </div>
                              );
                           })}
                        </div>
                     </div>

                     {/* COLUNA DIREITA: CALENDÁRIO E FEED */}
                     <div className="lg:col-span-4 space-y-8">
                        {/* CALENDÁRIO DE FERIADOS */}
                        <div className="bg-white p-8 rounded-[3rem] border border-sky-100 shadow-sm">
                           <div className="flex items-center gap-3 mb-6">
                              <CalendarDays className="text-yellow-600" size={24} />
                              <h3 className="text-lg font-black text-zinc-900 uppercase">Feriados {currentMonthName}</h3>
                           </div>
                           <div className="space-y-4">
                              {Object.entries(HOLIDAYS_ANGOLA).filter(([md]) => md.startsWith(String(new Date().getMonth() + 1).padStart(2, '0'))).map(([md, name]) => (
                                 <div key={md} className="flex items-start gap-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                                    <div className="w-12 h-12 rounded-xl bg-white flex flex-col items-center justify-center shadow-sm">
                                       <span className="text-[8px] font-black text-zinc-400 uppercase">{currentMonthName.slice(0, 3)}</span>
                                       <span className="text-lg font-black text-zinc-900">{md.split('-')[1]}</span>
                                    </div>
                                    <div className="flex-1">
                                       <h4 className="font-black text-xs text-zinc-900">{name}</h4>
                                       <p className="text-[9px] font-bold text-zinc-400 uppercase">Feriado Nacional</p>
                                    </div>
                                 </div>
                              ))}
                              {Object.entries(HOLIDAYS_ANGOLA).filter(([md]) => md.startsWith(String(new Date().getMonth() + 1).padStart(2, '0'))).length === 0 && (
                                 <p className="text-zinc-400 text-xs italic text-center py-4">Sem feriados para o mês atual.</p>
                              )}
                           </div>
                        </div>

                        {/* FEED DE ATIVIDADE */}
                        <div className="bg-zinc-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                           <Layers className="absolute -right-8 -top-8 opacity-10" size={150} />
                           <h3 className="text-sm font-black uppercase mb-6 flex items-center gap-3"><Zap className="text-yellow-500" size={16} /> Últimos Movimentos</h3>
                           <div className="space-y-6 relative z-10">
                              {presencas.slice(-5).reverse().map((p, idx) => {
                                 const func = funcionarios.find(f => f.id === p.funcionario_id);
                                 return (
                                    <div key={p.id} className="flex gap-4 items-start">
                                       <img src={func?.foto_url} className="w-8 h-8 rounded-lg object-cover grayscale" />
                                       <div className="flex-1 border-b border-white/5 pb-3">
                                          <p className="text-[10px] font-black text-zinc-400 uppercase"><span className="text-white">{func?.nome.split(' ')[0]}</span> • {p.data.split('-').reverse().join('/')}</p>
                                          <p className="text-[10px] font-bold text-yellow-500">{p.saida ? 'Check-out às ' + p.saida : 'Check-in às ' + p.entrada}</p>
                                       </div>
                                    </div>
                                 );
                              })}
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            )}

            {/* PERFORMANCE / METAS */}
            {activeTab === 'performance' && (
               <div className="space-y-6 animate-in slide-in-from-bottom-4">
                  {/* Chart Metas */}
                  <div className="bg-white p-8 rounded-[3rem] border border-sky-100 shadow-sm h-[300px]">
                     <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-4">Aproveitamento de KPIs</h3>
                     <ResponsiveContainer width="100%" height="85%">
                        <BarChart data={analyticsData.barData} layout="vertical">
                           <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                           <XAxis type="number" hide />
                           <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                           <Tooltip cursor={{ fill: 'transparent' }} />
                           <Bar dataKey="valor" radius={[0, 4, 4, 0]} barSize={20}>
                              {analyticsData.barData.map((entry, index) => (
                                 <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                           </Bar>
                        </BarChart>
                     </ResponsiveContainer>
                  </div>

                  <div className="flex justify-between items-center bg-zinc-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                     <Target className="absolute -right-8 -bottom-8 opacity-10" size={200} />
                     <div><h2 className="text-3xl font-black uppercase">Desempenho</h2><p className="text-zinc-400 font-medium">Acompanhamento de KPIs</p></div>
                     <div className="flex gap-4 relative z-10">
                        <button onClick={() => setShowMetaHistoryModal(true)} className="px-8 py-4 bg-white/10 border border-white/20 text-white rounded-2xl font-black uppercase text-[10px] hover:bg-white/20 transition-all flex items-center gap-3"><History size={20} /> Histórico Completo</button>
                        <button onClick={() => setShowMetaModal(true)} className="px-8 py-4 bg-yellow-500 text-zinc-900 rounded-2xl font-black uppercase text-[10px] hover:bg-white transition-all flex items-center gap-3"><PlusCircle size={20} /> Atribuir Meta</button>
                     </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {metas.map(m => {
                        const func = funcionarios.find(f => f.id === m.funcionario_id);
                        return (
                           <div key={m.id} className="bg-white p-8 rounded-[3rem] border border-sky-100 shadow-sm space-y-6 hover:shadow-xl transition-all">
                              <div className="flex justify-between items-start">
                                 <div className="flex items-center gap-3">
                                    <img src={func?.foto_url} className="w-10 h-10 rounded-xl object-cover grayscale" />
                                    <h4 className="font-black text-zinc-900 text-sm">{func?.nome.split(' ')[0]}</h4>
                                 </div>
                                 <div className="flex items-center gap-2">
                                    <button
                                       onClick={(e) => { e.stopPropagation(); handleDeleteMeta(m.id); }}
                                       className="p-1.5 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                       title="Eliminar Meta"
                                    >
                                       <Trash2 size={14} />
                                    </button>
                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${m.status === 'Concluída' || m.status === 'Concluda' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{m.status}</span>
                                 </div>
                              </div>
                              <h3 className="text-base font-black text-zinc-900 mb-4">{m.titulo}</h3>
                              <div className="space-y-2">
                                 <input type="range" min="0" max="100" value={m.progresso} onChange={(e) => updateMetaProgresso(m.id, Number(e.target.value))} className="w-full h-2 bg-zinc-100 rounded-full appearance-none cursor-pointer accent-yellow-500" />
                                 <p className="text-right text-[10px] font-black text-zinc-900">{m.progresso}%</p>
                              </div>
                           </div>
                        );
                     })}
                  </div>
               </div>
            )}

            {/* MODAL: FOLHA DE SALÁRIO GERAL (TABELA) */}
            {showPayrollSheetModal && (
               <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/90 backdrop-blur-xl p-4 md:p-10 print:p-0 print:bg-white print:relative print:block">
                  <div className="bg-white w-full h-full max-w-[95vw] rounded-[3rem] overflow-hidden flex flex-col shadow-2xl print:rounded-none print:shadow-none print:max-w-none">
                     <style>{`
                     @media print {
                        @page { size: landscape; margin: 1cm; }
                        body * { visibility: hidden; }
                        #payroll-sheet-print, #payroll-sheet-print * { visibility: visible; }
                        #payroll-sheet-print { position: absolute; left: 0; top: 0; width: 100%; }
                        .print-hidden { display: none !important; }
                     }
                     .payroll-table {
                        font-family: "Times New Roman", Times, serif;
                        font-size: 10pt;
                        width: 100%;
                        border-collapse: collapse;
                     }
                     .payroll-table th, .payroll-table td {
                        border: 1px solid black;
                        padding: 4px 6px;
                        text-align: center;
                     }
                     .payroll-table th {
                        font-weight: bold;
                        background-color: #f3f4f6;
                     }
                     .highlight-bold { font-weight: bold; }
                  `}</style>

                     <div className="p-8 border-b border-zinc-100 flex justify-between items-center print-hidden">
                        <div>
                           <h2 className="text-2xl font-black uppercase text-zinc-900">Folha de Salário - {currentMonthName} {currentFiscalYear}</h2>
                           <p className="text-zinc-500 font-medium tracking-tight uppercase text-[10px]">Documento Nº: <span className="text-zinc-900 font-black">{payrollDocNumber}</span></p>
                           <p className="text-zinc-400 text-[9px] font-bold">Relatório Geral de Processamento</p>
                        </div>
                        <div className="flex gap-3">
                           <button onClick={() => window.print()} className="p-4 bg-zinc-900 text-white rounded-2xl hover:bg-yellow-500 transition-all flex items-center gap-2 font-bold uppercase text-[10px]">
                              <Printer size={20} /> Imprimir Agora
                           </button>
                           <button onClick={() => setShowPayrollSheetModal(false)} className="p-4 bg-zinc-100 text-zinc-400 hover:bg-zinc-200 rounded-2xl transition-all">
                              <X size={24} />
                           </button>
                        </div>
                     </div>

                     <div className="flex-1 overflow-auto p-8 print:p-0" id="payroll-sheet-print">
                        <div className="mb-6 text-center">
                           <h1 className="text-xl font-bold uppercase" style={{ fontFamily: 'Times New Roman' }}>Folha de Salário - {corporateInfo?.name || 'Amazing Corporation'}</h1>
                           <p className="text-sm italic" style={{ fontFamily: 'Times New Roman' }}>Período: {currentMonthName} de {currentFiscalYear}</p>
                        </div>

                        <table className="payroll-table">
                           <thead>
                              <tr>
                                 <th>Nº</th>
                                 <th>Nome</th>
                                 <th>Cargo</th>
                                 <th>Salário Base</th>
                                 <th>Horas Extras</th>
                                 <th>Subs. Alimentação</th>
                                 <th>Subs. Transporte</th>
                                 <th>Subs. Férias</th>
                                 <th>Subs. Natal</th>
                                 <th>Bônus</th>
                                 <th>Total Proventos</th>
                                 <th>INSS (3%)</th>
                                 <th>SS Empresa (8%)</th>
                                 <th>IRT</th>
                                 <th>Faltas</th>
                                 <th>Empréstimos</th>
                                 <th>Outros Desc.</th>
                                 <th>Total Descontos</th>
                                 <th className="highlight-bold">Salário Bruto</th>
                                 <th className="highlight-bold">Salário Líquido</th>
                              </tr>
                           </thead>
                           <tbody>
                              {funcionarios.filter(f => f.status === 'ativo').map((f, index) => {
                                 const calc = calculatePayrollForEmployee(f);
                                 const proventosTotal = calc.totalProventos;
                                 const descontosTotal = calc.totalDescontos;

                                 return (
                                    <tr key={f.id}>
                                       <td>{index + 1}</td>
                                       <td style={{ textAlign: 'left' }}>{f.nome}</td>
                                       <td style={{ textAlign: 'left' }}>{f.funcao}</td>
                                       <td>{formatAOA(f.salario_base)}</td>
                                       <td>{formatAOA(calc.valorHorasExtras)}</td>
                                       <td>{formatAOA(calc.subAlim)}</td>
                                       <td>{formatAOA(calc.subTrans)}</td>
                                       <td>{formatAOA(calc.subFerias)}</td>
                                       <td>{formatAOA(calc.subNatal)}</td>
                                       <td>{formatAOA(calc.premiosBonus)}</td>
                                       <td className="highlight-bold">{formatAOA(proventosTotal)}</td>
                                       <td>{formatAOA(calc.inss)}</td>
                                       <td className="text-zinc-400 italic">{formatAOA(calc.inssEmpresa)}</td>
                                       <td>{formatAOA(calc.irt)}</td>
                                       <td>{formatAOA(calc.descontoFaltas)}</td>
                                       <td>{formatAOA(calc.emprestimos)}</td>
                                       <td>{formatAOA(calc.outrosDesc)}</td>
                                       <td className="highlight-bold">{formatAOA(descontosTotal)}</td>
                                       <td className="highlight-bold">{formatAOA(calc.bruto)}</td>
                                       <td className="highlight-bold bg-yellow-50">{formatAOA(calc.liquido)}</td>
                                    </tr>
                                 );
                              })}
                           </tbody>
                        </table>

                        <div className="mt-12 text-[10pt] italic" style={{ fontFamily: 'Times New Roman' }}>
                           <p><strong>Total Proventos:</strong> Salário Base + Horas Extras + Subsídios + Bônus</p>
                           <p><strong>Salário Bruto:</strong> Total Proventos (antes dos descontos)</p>
                           <p><strong>Total Descontos:</strong> INSS (3%) + IRT + Faltas + Empréstimos + Outros</p>
                           <p><strong>Salário Líquido:</strong> Salário Bruto - Total Descontos</p>
                           <p className="mt-2 text-[10px] text-zinc-400 italic font-medium border-t pt-2">
                              * Para trabalhadores em <strong>Prestação de Serviços</strong>, aplica-se uma taxa flat de 6,5% de IRT (Retenção na Fonte) e isenção de SS na folha comercial.
                           </p>
                        </div>
                     </div>
                  </div>
               </div>
            )}

            {activeTab === 'passes' && (
               <div className="space-y-6 animate-in slide-in-from-bottom-4">
                  <div className="bg-zinc-50 p-10 rounded-[3rem] border border-sky-100 flex items-center justify-between"><div><h2 className="text-2xl font-black text-zinc-900 uppercase">Identificao Corporativa</h2><p className="text-zinc-500 text-sm font-medium">Emisso e gesto de passes PVC.</p></div><ScanBarcode size={32} className="text-yellow-600" /></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                     {funcionarios.map(f => (
                        <div key={f.id} className="bg-white p-6 rounded-[2.5rem] border border-sky-50 shadow-sm flex flex-col items-center text-center group hover:shadow-2xl transition-all">
                           <div className="relative mb-4"><img src={f.foto_url} className="w-24 h-24 rounded-3xl object-cover border-4 border-white shadow-xl group-hover:scale-105 transition-transform" /><div className="absolute -bottom-2 -right-2 p-2 bg-yellow-500 text-zinc-900 rounded-xl shadow-lg"><QrCode size={14} /></div></div>
                           <h3 className="font-black text-zinc-900 text-sm truncate w-full px-4">{f.nome}</h3>
                           <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mt-1 mb-6">{f.funcao}</p>

                           <div className="flex gap-2 w-full mt-auto">
                              <button onClick={() => setPrintingPass(f)} className="flex-1 py-3 bg-zinc-900 text-white rounded-xl font-black text-[9px] uppercase hover:bg-yellow-500 hover:text-zinc-900 transition-all flex items-center justify-center gap-2" title="Visualizar / Re-emitir">
                                 <Eye size={14} /> Visualizar
                              </button>
                              <button onClick={() => handleOpenModal(f)} className="p-3 bg-zinc-100 text-zinc-400 rounded-xl hover:bg-zinc-200 transition-all" title="Editar Dados">
                                 <Edit size={14} />
                              </button>
                              <button onClick={() => { if (confirm('Excluir este colaborador e o seu passe permanentemente?')) setFuncionarios(funcionarios.filter(x => x.id !== f.id)) }} className="p-3 bg-red-50 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all" title="Excluir">
                                 <Trash2 size={14} />
                              </button>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            )}

            {/* CONTAS BANCÁRIAS (GLOBAL) */}
            {activeTab === 'contas' && (
               <div className="animate-in slide-in-from-bottom-4">
                  <ContasBancariasPage user={user} inAppTab={true} />
               </div>
            )}

            {/* VAGAS DE EMPREGO (RECRUTAMENTO) */}
            {activeTab === 'vagas' && (
               <div className="animate-in slide-in-from-bottom-4">
                  <VagasAdminTab />
               </div>
            )}

            {/* ABA CONFIGURAÇÕES DA EMPRESA */}
            {activeTab === 'settings' && isHRAdmin && (
               <div className="animate-in slide-in-from-bottom-4 space-y-8">
                  <div className="bg-white p-10 rounded-[3rem] border border-sky-100 shadow-sm">
                     <div className="flex items-center gap-4 mb-8">
                        <div className="p-4 bg-zinc-900 rounded-3xl text-yellow-500 shadow-xl"><Settings size={28} /></div>
                        <div>
                           <h2 className="text-2xl font-black text-zinc-900 uppercase">Perfil da Empresa</h2>
                           <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">Configure os dados que aparecem nos documentos oficiais</p>
                        </div>
                     </div>

                     <form onSubmit={handleSaveCorporateInfo} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="space-y-6">
                              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100 pb-2">Identidade Corporativa</h3>
                              <Input name="company_name" label="Nome da Empresa" defaultValue={corporateInfo?.company_name} placeholder="Amazing Corporation, Lda" required />
                              <Input name="company_nif" label="NIF / Número de Contribuinte" defaultValue={corporateInfo?.company_nif} placeholder="50002181797" required />
                              <div className="grid grid-cols-2 gap-4">
                                 <Input name="company_phone" label="Telefone Geral" defaultValue={corporateInfo?.company_phone} placeholder="+244 931 116 696" />
                                 <Input name="company_email" label="Email de Contacto" defaultValue={corporateInfo?.company_email} placeholder="geral@amazing.com" />
                              </div>
                           </div>

                           <div className="space-y-6">
                              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100 pb-2">Localização & Pagamentos</h3>
                              <Input name="company_address" label="Morada Completa" defaultValue={corporateInfo?.company_address} placeholder="Benguela, Angola" required />
                              <div className="bg-zinc-50 p-6 rounded-[2rem] border border-zinc-100 space-y-4">
                                 <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Dados Bancários para Recibos</p>
                                 <div className="grid grid-cols-1 gap-4">
                                    <Input name="company_bank" label="Banco" defaultValue={corporateInfo?.company_bank} placeholder="BAI / BFA / BIC" required />
                                    <Input name="company_iban" label="IBAN Completo" defaultValue={corporateInfo?.company_iban} placeholder="AO06 0000 ..." required className="font-mono text-xs" />
                                 </div>
                              </div>
                           </div>
                        </div>

                        <div className="flex justify-end pt-4">
                           <button
                              type="submit"
                              disabled={loading}
                              className="px-12 py-5 bg-zinc-900 text-white rounded-2xl font-black uppercase text-xs hover:bg-yellow-500 hover:text-zinc-900 transition-all shadow-2xl flex items-center gap-3 disabled:opacity-50"
                           >
                              <Save size={20} /> Guardar Alterações
                           </button>
                        </div>
                     </form>
                  </div>
               </div>
            )}

         </div>

         {/* MODAL CADASTRO FUNCIONÁRIO (MANTIDO) */}
         {
            showModal && (
               <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/80 backdrop-blur-md p-4 animate-in fade-in">
                  <div className="bg-white w-full max-w-6xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[95vh]">
                     <div className="p-8 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                        <h2 className="text-2xl font-black text-zinc-900 flex items-center gap-3">
                           {editingItem ? <Edit className="text-yellow-500" /> : <UserPlus className="text-yellow-500" />}
                           {editingItem ? 'Ficha do Colaborador' : 'Nova Admissão'}
                        </h2>
                        <button onClick={() => setShowModal(false)} className="p-3 hover:bg-zinc-200 rounded-full transition-all text-zinc-400"><X size={28} /></button>
                     </div>

                     {/* ABAS DO MODAL */}
                     {editingItem && (
                        <div className="flex border-b border-zinc-100 bg-white px-8 pt-4 gap-6">
                           <button
                              onClick={() => setModalActiveTab('geral')}
                              className={`pb-4 font-black text-sm uppercase px-2 transition-all border-b-4 ${modalActiveTab === 'geral' ? 'border-yellow-500 text-zinc-900' : 'border-transparent text-zinc-400 hover:text-zinc-600'}`}
                           >
                              Dados Gerais
                           </button>
                           <button
                              onClick={() => setModalActiveTab('contas')}
                              className={`pb-4 font-black text-sm uppercase px-2 transition-all border-b-4 ${modalActiveTab === 'contas' ? 'border-yellow-500 text-zinc-900' : 'border-transparent text-zinc-400 hover:text-zinc-600'}`}
                           >
                              Contas Bancárias
                           </button>
                        </div>
                     )}

                     <div className="overflow-y-auto w-full h-full p-0">
                        {modalActiveTab === 'geral' ? (
                           <form onSubmit={handleSubmitFuncionario} className="p-10 space-y-8">
                              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                                 {/* Coluna da Foto */}
                                 <div className="md:col-span-3 flex flex-col items-center gap-4">
                                    <div className="w-full aspect-square bg-zinc-50 rounded-[3rem] border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center text-zinc-400 overflow-hidden cursor-pointer hover:border-yellow-500 transition-all relative" onClick={() => document.getElementById('photo-upload')?.click()}>
                                       {photoPreview ? <img src={photoPreview} className="w-full h-full object-cover" /> : <Camera size={48} />}
                                       <input type="file" id="photo-upload" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) { const r = new FileReader(); r.onload = () => setPhotoPreview(r.result as string); r.readAsDataURL(file); } }} />
                                    </div>
                                    <p className="text-[9px] font-black text-zinc-400 uppercase">Foto Institucional</p>
                                 </div>

                                 {/* Dados Pessoais Principais */}
                                 <div className="md:col-span-9 space-y-6">
                                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2"><UserCheck size={14} /> Identificação & Contactos</h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                       <Input name="nome" label="Nome Completo" defaultValue={editingItem?.nome} required />
                                       <Input name="bilhete" label="Nº BI / Identidade" defaultValue={editingItem?.bilhete} required />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                       <div className="md:col-span-4 grid grid-cols-3 gap-4">
                                          <div className="col-span-2">
                                             <Input
                                                name="nascimento" label="Data de Nascimento" type="date" required
                                                value={formState.nascimento}
                                                onChange={e => setFormState({ ...formState, nascimento: e.target.value })}
                                             />
                                          </div>
                                          <Input label="Idade" readOnly value={formState.idade} className="bg-zinc-100 font-bold text-center text-zinc-500 cursor-not-allowed" />
                                       </div>

                                       <div className="md:col-span-4">
                                          <Input name="telefone" label="Telemóvel Pessoal" defaultValue={editingItem?.telefone} required placeholder="9xx xxx xxx" />
                                       </div>

                                       <div className="md:col-span-4">
                                          <Input name="telefone_alternativo" label="Telefone Alternativo" defaultValue={(editingItem as any)?.telefone_alternativo} placeholder="Opcional" />
                                       </div>
                                    </div>

                                    <div className="w-full">
                                       <Input name="morada" label="Bairro / Rua / Referência" defaultValue={editingItem?.morada} required />
                                    </div>
                                 </div>
                              </div>

                              {/* Secção de Filiação e Origem (NOVO) */}
                              <div className="bg-zinc-50 p-6 rounded-3xl border border-zinc-100 space-y-6">
                                 <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2"><Users size={14} /> Origem & Filiação</h3>
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input name="nome_pai" label="Nome do Pai" value={formState.nome_pai} onChange={e => setFormState({ ...formState, nome_pai: e.target.value })} />
                                    <Input name="nome_mae" label="Nome da Mãe" value={formState.nome_mae} onChange={e => setFormState({ ...formState, nome_mae: e.target.value })} />
                                 </div>
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Select
                                       name="provincia" label="Naturalidade (Província)"
                                       value={formState.provincia}
                                       onChange={e => setFormState({ ...formState, provincia: e.target.value })}
                                       options={PROVINCIAS.map(p => ({ value: p, label: p }))}
                                    />
                                    <Input name="municipio" label="Município" value={formState.municipio} onChange={e => setFormState({ ...formState, municipio: e.target.value })} />
                                 </div>
                              </div>

                              {/* Secção Académica e Profissional */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                 <div className="space-y-6 bg-white border border-zinc-100 p-6 rounded-3xl shadow-sm">
                                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2"><GraduationCap size={14} /> Habilitações</h3>
                                    <Select
                                       name="escolaridade" label="Nível de Escolaridade"
                                       value={formState.escolaridade}
                                       onChange={e => setFormState({ ...formState, escolaridade: e.target.value })}
                                       options={[{ value: 'Ensino Básico', label: 'Ensino Básico' }, { value: 'Ensino Médio', label: 'Ensino Médio' }, { value: 'Licenciatura', label: 'Licenciatura' }, { value: 'Mestrado', label: 'Mestrado' }]}
                                    />
                                    <Input name="formacao" label="Curso / Especialidade" value={formState.curso} onChange={e => setFormState({ ...formState, curso: e.target.value })} />
                                 </div>

                                 <div className="space-y-6 bg-white border border-zinc-100 p-6 rounded-3xl shadow-sm">
                                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2"><Briefcase size={14} /> Cargo & Função</h3>
                                    <Input name="funcao" label="Função a Desempenhar" defaultValue={editingItem?.funcao} required />
                                    <Input name="departamento" label="Departamento" defaultValue={editingItem?.departamento_id} required />
                                 </div>
                              </div>

                              {/* Contrato e Financeiro */}
                              <div className="bg-zinc-900 p-10 rounded-[3.5rem] text-white space-y-8 border-l-[12px] border-yellow-500 shadow-2xl">
                                 <h3 className="text-xs font-black text-yellow-500 uppercase tracking-widest flex items-center gap-2"><Wallet size={14} /> Dados Contratuais</h3>
                                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <Select name="tipo_contrato" label="Regime" defaultValue={editingItem?.tipo_contrato} className="bg-zinc-800 border-zinc-700 text-white" options={[{ value: 'Indeterminado', label: 'Indeterminado' }, { value: 'Determinado', label: 'Determinado' }, { value: 'Estágio', label: 'Estágio Remunerado' }, { value: 'Prestação de Serviços', label: 'Prestação de Serviços (Conta Própria)' }]} />
                                    <Input name="admissao" label="Data de Início" type="date" defaultValue={editingItem?.data_admissao} required className="bg-zinc-800 border-zinc-700 text-white" />
                                    <Select name="status" label="Estado Inicial" defaultValue={editingItem?.status || 'ativo'} className="bg-zinc-800 border-zinc-700 text-white" options={[{ value: 'ativo', label: 'Activo' }, { value: 'ferias', label: 'Férias' }, { value: 'inativo', label: 'Inactivo' }, { value: 'rescindido', label: 'Rescindido' }]} />
                                 </div>
                                 <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pt-4 border-t border-white/10">
                                    <Input name="salario_base" label="Base (AOA)" type="number" defaultValue={editingItem?.salario_base} className="bg-zinc-800 border-zinc-700 text-white font-black" required />
                                    <Input name="sub_alim" label="Sub. Alim." type="number" defaultValue={editingItem?.subsidio_alimentacao} className="bg-zinc-800 border-zinc-700 text-white" />
                                    <Input name="sub_trans" label="Sub. Trans." type="number" defaultValue={editingItem?.subsidio_transporte} className="bg-zinc-800 border-zinc-700 text-white" />
                                    <Input name="outros_bonus" label="Outros Bónus" type="number" defaultValue={editingItem?.outros_bonus} className="bg-zinc-800 border-zinc-700 text-white border-dashed border-2" />
                                 </div>
                              </div>

                              <div className="flex justify-end gap-6 pt-6">
                                 <button type="button" onClick={() => setShowModal(false)} className="px-10 py-5 text-[11px] font-black uppercase text-zinc-400">Cancelar</button>
                                 <button type="submit" className="px-16 py-5 bg-zinc-900 text-white font-black rounded-2xl uppercase text-[11px] shadow-2xl hover:bg-yellow-500 hover:text-zinc-900 transition-all flex items-center gap-3">
                                    <Save size={20} /> {editingItem ? 'Actualizar Ficha' : 'Efectivar Admissão'}
                                 </button>
                              </div>
                           </form>
                        ) : (
                           <div className="p-10 min-h-[500px]">
                              {editingItem && <BankAccountsTab funcionarioId={editingItem.id} user={user} />}
                           </div>
                        )}
                     </div>
                  </div>
               </div>
            )}

         {/* MODAL METAS */}
         {showMetaModal && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center bg-zinc-950/90 backdrop-blur-md p-4 animate-in fade-in">
               <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden">
                  <div className="p-8 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50"><h2 className="text-xl font-black text-zinc-900 flex items-center gap-3 uppercase"><Target className="text-yellow-500" /> Nova Meta de Performance</h2><button onClick={() => setShowMetaModal(false)} className="p-3 text-zinc-400 hover:bg-zinc-200 rounded-full transition-all"><X size={24} /></button></div>
                  <form onSubmit={handleAddMeta} className="p-8 space-y-6">
                     <Select name="func_id" label="Responsável" required options={funcionarios.map(f => ({ value: f.id, label: f.nome }))} />
                     <Input name="titulo" label="KPI / Objectivo" required placeholder="Ex: Reduzir custos de frota em 10%" />
                     <Input name="prazo" label="Prazo Final" type="date" required defaultValue={new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]} />
                     <button type="submit" className="w-full py-5 bg-zinc-900 text-white font-black rounded-2xl uppercase text-[10px] hover:bg-yellow-500 transition-all shadow-xl"><Save size={18} /> Efectivar Atribuição</button>
                  </form>
               </div>
            </div>
         )}

         {/* MODAL HISTÓRICO DE METAS */}
         {showMetaHistoryModal && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center bg-zinc-950/90 backdrop-blur-md p-4 animate-in fade-in">
               <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col">
                  <div className="p-8 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                     <div>
                        <h2 className="text-xl font-black text-zinc-900 flex items-center gap-3 uppercase"><History className="text-yellow-500" /> Histórico de Performance</h2>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Registo completo de todos os KPIs</p>
                     </div>
                     <button onClick={() => setShowMetaHistoryModal(false)} className="p-3 text-zinc-400 hover:bg-zinc-200 rounded-full transition-all">
                        <X size={24} />
                     </button>
                  </div>
                  <div className="flex-1 overflow-auto p-8">
                     <table className="w-full text-left border-collapse">
                        <thead>
                           <tr className="border-b border-zinc-100 text-[10px] uppercase font-black text-zinc-400 tracking-widest">
                              <th className="pb-4">Responsável</th>
                              <th className="pb-4">Meta / KPI</th>
                              <th className="pb-4">Prazo</th>
                              <th className="pb-4">Progresso</th>
                              <th className="pb-4 text-right">Acções</th>
                           </tr>
                        </thead>
                        <tbody>
                           {metas.map(m => {
                              const func = funcionarios.find(f => f.id === m.funcionario_id);
                              return (
                                 <tr key={m.id} className="border-b border-zinc-50 group hover:bg-zinc-50/50 transition-all">
                                    <td className="py-4 whitespace-nowrap">
                                       <div className="flex items-center gap-3">
                                          <img src={func?.foto_url} className="w-8 h-8 rounded-lg object-cover grayscale" />
                                          <div>
                                             <p className="text-sm font-black text-zinc-900">{func?.nome.split(' ')[0]}</p>
                                             <p className="text-[10px] text-zinc-400">{func?.funcao}</p>
                                          </div>
                                       </div>
                                    </td>
                                    <td className="py-4">
                                       <p className="text-sm font-bold text-zinc-800">{m.titulo}</p>
                                       <span className={`text-[9px] font-black uppercase ${m.status === 'Concluída' || m.status === 'Concluda' ? 'text-green-500' : 'text-yellow-500'}`}>{m.status}</span>
                                    </td>
                                    <td className="py-4 text-xs font-bold text-zinc-500">{m.prazo}</td>
                                    <td className="py-4">
                                       <div className="w-24 bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                                          <div className={`h-full ${m.progresso === 100 ? 'bg-green-500' : 'bg-yellow-500'}`} style={{ width: `${m.progresso}%` }}></div>
                                       </div>
                                       <p className="text-[9px] font-black mt-1">{m.progresso}%</p>
                                    </td>
                                    <td className="py-4 text-right">
                                       <button
                                          onClick={() => handleDeleteMeta(m.id)}
                                          className="p-2 text-zinc-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                                       >
                                          <Trash2 size={16} />
                                       </button>
                                    </td>
                                 </tr>
                              );
                           })}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
         )}

         {/* MODAL RECIBO PROFISSIONAL (ESTILO CANVA) */}
         {viewingRecibo && (
            <>
               <style>{`
                  @media print {
                     @page { size: A4; margin: 0; }
                     body { margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                     .print-bg-fix { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                  }
               `}</style>

               <div className="fixed inset-0 z-[200] flex items-center justify-center bg-zinc-950/80 backdrop-blur-xl p-4 overflow-y-auto animate-in fade-in py-10 print:static print:p-0 print:bg-white print:block">
                  <div className="bg-white w-full max-w-4xl shadow-2xl relative print:shadow-none print:w-[210mm] print:h-[297mm] print:mx-auto flex flex-col overflow-hidden">

                     {/* DESIGN GEOMÉTRICO SUPERIOR (POLÍGONOS FORÇADOS PARA PRINT) */}
                     <div className="relative h-48 w-full print:h-48 overflow-hidden bg-white border-b-4 border-zinc-900 print-bg-fix">
                        {/* Blue Polygon */}
                        <div
                           className="absolute top-0 right-0 w-[65%] h-full bg-sky-600 origin-top-right print:bg-sky-600 print-bg-fix"
                           style={{ clipPath: 'polygon(15% 0, 100% 0, 100% 100%, 0% 100%)', WebkitPrintColorAdjust: 'exact' }}
                        ></div>
                        {/* Black Polygon */}
                        <div
                           className="absolute top-0 right-0 w-[55%] h-[85%] bg-zinc-900 origin-top-right print:bg-zinc-900 print-bg-fix"
                           style={{ clipPath: 'polygon(20% 0, 100% 0, 100% 100%, 0% 100%)', WebkitPrintColorAdjust: 'exact' }}
                        ></div>

                        {/* DESIGN GEOMÉTRICO - APENAS VISUAL */}
                        <div className="absolute top-0 right-12 p-8 z-10 w-full text-right">
                           <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-xl border border-white/10 inline-block">
                              <p className="text-[12px] font-black text-white uppercase tracking-[0.3em]">Recibo Oficial</p>
                              <p className="text-[9px] font-bold text-white/40 uppercase mt-1 tracking-widest italic">Amazing Corp Cloud – ERP</p>
                           </div>
                        </div>
                     </div>

                     <div className="fixed top-12 right-12 flex items-center gap-3 print:hidden z-[250] bg-white/90 backdrop-blur-xl p-4 rounded-[2.5rem] shadow-2xl border border-zinc-100 animate-in slide-in-from-right-10 duration-500">
                        <button
                           onClick={() => setViewingRecibo(null)}
                           className="flex items-center gap-2 px-6 py-4 bg-zinc-100 text-zinc-600 rounded-2xl font-black uppercase text-[10px] hover:bg-zinc-200 transition-all shadow-xl"
                        >
                           <ArrowLeft size={18} /> Voltar
                        </button>

                        <div className="h-10 w-[1px] bg-zinc-200 mx-1"></div>

                        <div className="relative">
                           <button
                              onClick={() => setShowShareOptions(!showShareOptions)}
                              title="Partilhar no WhatsApp"
                              className={`p-4 rounded-2xl transition-all shadow-xl ${showShareOptions ? 'bg-green-600 text-white' : 'bg-zinc-900 text-white hover:bg-green-600'}`}
                           >
                              <MessageCircle size={20} />
                           </button>

                           {showShareOptions && (
                              <div className="absolute top-16 right-0 bg-white border border-zinc-100 shadow-2xl p-6 rounded-[2rem] w-80 animate-in fade-in duration-300 slide-in-from-top-4 z-[210]">
                                 <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Configurar WhatsApp</h4>
                                    <button onClick={() => setShowShareOptions(false)} className="text-zinc-300 hover:text-zinc-900"><X size={16} /></button>
                                 </div>
                                 <div className="space-y-4">
                                    <div className="flex flex-col gap-1.5">
                                       <label className="text-[9px] font-black uppercase text-zinc-900 ml-1">Nº do Telefone (Funcionário)</label>
                                       <input
                                          type="text"
                                          value={customWhatsApp}
                                          onChange={(e) => setCustomWhatsApp(e.target.value)}
                                          className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-green-500 outline-none transition-all"
                                          placeholder="Ex: 931116696"
                                       />
                                       <p className="text-[8px] text-zinc-400 italic">O prefixo +244 será adicionado automaticamente.</p>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                       <label className="text-[9px] font-black uppercase text-zinc-900 ml-1">Mensagem (Editável)</label>
                                       <textarea
                                          value={customMessage}
                                          onChange={(e) => setCustomMessage(e.target.value)}
                                          rows={5}
                                          className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl text-[10px] font-bold focus:ring-2 focus:ring-green-500 outline-none transition-all resize-none"
                                       />
                                    </div>
                                    <button
                                       onClick={() => { handleWhatsAppShare(); setShowShareOptions(false); }}
                                       className="w-full py-4 bg-zinc-900 text-white rounded-xl font-black uppercase text-[10px] hover:bg-green-600 transition-all shadow-lg flex items-center justify-center gap-2"
                                    >
                                       <MessageCircle size={16} /> Enviar p/ WhatsApp
                                    </button>
                                 </div>
                              </div>
                           )}
                        </div>

                        <button
                           onClick={handleEmailShare}
                           title="Enviar por Email"
                           className="p-4 bg-zinc-900 text-white rounded-2xl hover:bg-sky-600 transition-all shadow-xl"
                        >
                           <Mail size={20} />
                        </button>

                        <button
                           onClick={() => window.print()}
                           title="Imprimir / Exportar PDF"
                           className="p-4 bg-zinc-900 text-white rounded-2xl hover:bg-yellow-500 hover:text-zinc-900 transition-all shadow-xl"
                        >
                           <Printer size={20} />
                        </button>
                     </div>

                     <div className="flex-1 pt-[5.5cm] px-16 pb-32 print:px-12 flex flex-col relative">
                        {/* LINHA DE TÍTULO - REESTRUTURADA PARA MÁXIMA VISIBILIDADE */}
                        <div className="border-b-[4px] border-zinc-900 pb-6 mb-8 flex justify-between items-center">
                           {/* ESQUERDA: LOGO E INFO (MAIS ROBUSTO) */}
                           <div className="flex items-center gap-6">
                              <div className="w-44 h-24 bg-zinc-50 rounded-xl flex items-center justify-center p-2 border border-zinc-100 print:border-none print-bg-fix relative">
                                 <Logo className="h-16 w-auto z-10" />
                                 <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-zinc-300 uppercase tracking-widest text-center px-4">{corporateInfo?.company_name || 'Amazing Corp'}</span>
                              </div>
                              <div className="flex flex-col text-[11px] leading-tight font-black uppercase text-zinc-600">
                                 <span className="text-zinc-900 font-black text-[14px] mb-1 tracking-tighter italic">{corporateInfo?.company_name || 'Amazing Corporation'}</span>
                                 <span className="text-zinc-900 font-bold">NIF: {corporateInfo?.company_nif || '50002181797'}</span>
                                 <span>{corporateInfo?.company_address || 'Benguela/Angola • Massangarala'}</span>
                                 <span className="text-zinc-900 mt-1 font-black">Tel: {corporateInfo?.company_phone || '+244 931 116 696'}</span>
                                 <span className="lowercase text-sky-700 font-black text-xs">Email: {corporateInfo?.company_email || 'geral.amazingcorporation@gmail.com'}</span>
                              </div>
                           </div>

                           {/* CENTRO: TÍTULO 18PX - NA MESMA LINHA */}
                           <div className="text-center">
                              <h2 className="text-[18px] font-black text-zinc-900 uppercase tracking-tight leading-none">Folha de Salário</h2>
                              <div className="mt-2 inline-block bg-zinc-900 text-white px-4 py-1 rounded-full">
                                 <p className="text-[10px] font-black uppercase tracking-widest">Período: {viewingRecibo.mes} {viewingRecibo.ano}</p>
                              </div>
                           </div>

                           {/* DIREITA: Nº DOCUMENTO */}
                           <div className="text-right">
                              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Nº Documento</p>
                              <p className="text-xl font-black text-zinc-900 tabular-nums uppercase">#{viewingRecibo.numero_documento || viewingRecibo.id.substring(0, 8).toUpperCase()}</p>
                           </div>
                        </div>

                        {/* DADOS DO FUNCIONÁRIO - TABELA REFINADA */}
                        <div className="mb-12 overflow-hidden rounded-2xl border border-zinc-200">
                           <table className="w-full text-sm text-left">
                              <thead className="bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest">
                                 <tr>
                                    <th className="px-6 py-3 border-r border-white/10">Nome do Colaborador</th>
                                    <th className="px-6 py-3 border-r border-white/10">Cargo / Função</th>
                                    <th className="px-6 py-3">Nº Bilhete</th>
                                 </tr>
                              </thead>
                              <tbody className="bg-zinc-50 font-bold text-zinc-900">
                                 <tr>
                                    <td className="px-6 py-4 border-r border-zinc-200">{viewingRecibo.nome || '---'}</td>
                                    <td className="px-6 py-4 border-r border-zinc-200">{viewingRecibo.cargo || '---'}</td>
                                    <td className="px-6 py-4">{viewingRecibo.bilhete || '---'}</td>
                                 </tr>
                              </tbody>
                           </table>
                        </div>

                        {/* TABELA DE RENDIMENTOS E DESCONTOS - UNIFICADA */}
                        <div className="mb-12">
                           <table className="w-full text-left border-collapse" style={{ fontFamily: 'Times New Roman', fontSize: '14px' }}>
                              <thead>
                                 <tr className="border-b-2 border-zinc-900 bg-zinc-50/50">
                                    <th className="py-3 px-4 text-zinc-900 font-black uppercase text-[11px] w-1/2">Descrição</th>
                                    <th className="py-3 px-4 text-right text-zinc-900 font-black uppercase text-[11px]">Rendimentos (+)</th>
                                    <th className="py-3 px-4 text-right text-zinc-900 font-black uppercase text-[11px]">Descontos (-)</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-zinc-100">
                                 {/* RENDIMENTOS */}
                                 <tr>
                                    <td className="py-2 px-4 text-zinc-700 font-bold">Vencimento Base</td>
                                    <td className="py-2 px-4 text-right font-bold text-zinc-900">{formatAOA(viewingRecibo.base)}</td>
                                    <td className="py-2 px-4 text-right text-zinc-300">---</td>
                                 </tr>
                                 {viewingRecibo.subsidio_alimentacao > 0 && (
                                    <tr>
                                       <td className="py-2 px-4 text-zinc-700">Subsídio de Alimentação</td>
                                       <td className="py-2 px-4 text-right font-bold text-zinc-900">{formatAOA(viewingRecibo.subsidio_alimentacao)}</td>
                                       <td className="py-2 px-4 text-right text-zinc-300">---</td>
                                    </tr>
                                 )}
                                 {viewingRecibo.subsidio_transporte > 0 && (
                                    <tr>
                                       <td className="py-2 px-4 text-zinc-700">Subsídio de Transporte</td>
                                       <td className="py-2 px-4 text-right font-bold text-zinc-900">{formatAOA(viewingRecibo.subsidio_transporte)}</td>
                                       <td className="py-2 px-4 text-right text-zinc-300">---</td>
                                    </tr>
                                 )}
                                 {((viewingRecibo.horas_extras_valor || 0) + (viewingRecibo.bonus_premios || 0)) > 0 && (
                                    <tr>
                                       <td className="py-2 px-4 text-zinc-700">Horas Extras / Bónus</td>
                                       <td className="py-2 px-4 text-right font-bold text-zinc-900">{formatAOA((viewingRecibo.horas_extras_valor || 0) + (viewingRecibo.bonus_premios || 0))}</td>
                                       <td className="py-2 px-4 text-right text-zinc-300">---</td>
                                    </tr>
                                 )}

                                 {/* DESCONTOS */}
                                 {viewingRecibo.inss_trabalhador > 0 && (
                                    <tr>
                                       <td className="py-2 px-4 text-zinc-700">Segurança Social (3%)</td>
                                       <td className="py-2 px-4 text-right text-zinc-300">---</td>
                                       <td className="py-2 px-4 text-right font-bold text-red-500">-{formatAOA(viewingRecibo.inss_trabalhador)}</td>
                                    </tr>
                                 )}
                                 {viewingRecibo.irt > 0 && (
                                    <tr>
                                       <td className="py-2 px-4 text-zinc-700">I.R.T.</td>
                                       <td className="py-2 px-4 text-right text-zinc-300">---</td>
                                       <td className="py-2 px-4 text-right font-bold text-red-500">-{formatAOA(viewingRecibo.irt)}</td>
                                    </tr>
                                 )}
                                 {viewingRecibo.adiantamentos > 0 && (
                                    <tr>
                                       <td className="py-2 px-4 text-zinc-700">Adiantamentos / Empréstimos</td>
                                       <td className="py-2 px-4 text-right text-zinc-300">---</td>
                                       <td className="py-2 px-4 text-right font-bold text-red-500">-{formatAOA(viewingRecibo.adiantamentos)}</td>
                                    </tr>
                                 )}
                                 {viewingRecibo.faltas_desconto > 0 && (
                                    <tr>
                                       <td className="py-2 px-4 text-zinc-700">Faltas / Atrasos</td>
                                       <td className="py-2 px-4 text-right text-zinc-300">---</td>
                                       <td className="py-2 px-4 text-right font-bold text-red-500">-{formatAOA(viewingRecibo.faltas_desconto)}</td>
                                    </tr>
                                 )}
                              </tbody>
                           </table>
                        </div>

                        {/* RESUMO TOTAL - DESIGN LIMPO */}
                        <div className="flex justify-start gap-4 text-zinc-900">
                           <span className="font-bold uppercase text-[16px] text-zinc-500 w-48">Total Bruto:</span>
                           <span className="font-bold">{formatAOA(viewingRecibo.bruto || 0)}</span>
                        </div>
                        <div className="flex justify-start gap-4 text-zinc-900">
                           <span className="font-black uppercase text-[16px] text-zinc-900 w-48">Líquido a Receber:</span>
                           <span className="font-black text-2xl border-b-2 border-zinc-900">{formatAOA(viewingRecibo.liquido)}</span>
                        </div>
                     </div>

                     {/* DADOS BANCÁRIOS NO RECIBO (ABAIXO DO TOTAL) */}
                     <div className="mt-10 p-6 bg-zinc-50 rounded-3xl border border-zinc-100 space-y-4">
                        <p className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em] border-b border-zinc-200 pb-2">Informação para Transferência</p>
                        <div className="flex justify-between items-end">
                           <div>
                              <p className="text-[9px] font-black text-zinc-400 uppercase mb-1">Banco</p>
                              <p className="text-sm font-black text-zinc-900 uppercase italic">{corporateInfo?.company_bank || 'BAI'}</p>
                           </div>
                           <div className="text-right">
                              <p className="text-[9px] font-black text-zinc-400 uppercase mb-1">IBAN de Destino</p>
                              <p className="text-[15px] font-black text-zinc-900 font-mono select-all tracking-tighter">{corporateInfo?.company_iban || 'AO06 0000 0000 8921 3451 2'}</p>
                           </div>
                        </div>
                     </div>

                     {/* ASSINATURAS E VALIDAÇÃO */}
                     <div className="mt-16 grid grid-cols-3 gap-12 items-end">
                        <div className="text-center">
                           <div className="h-16 flex items-center justify-center"></div>
                           <div className="border-t-2 border-zinc-900 mt-4 pt-2">
                              <p className="text-[13px] font-black uppercase text-black" style={{ fontFamily: 'Times New Roman' }}>Entidade Empregadora</p>
                           </div>
                        </div>
                        <div className="flex flex-col items-center">
                           <div className="h-24"></div>
                        </div>
                        <div className="text-center">
                           <div className="h-12"></div>
                           <div className="border-t-2 border-zinc-900 mt-4 pt-2">
                              <p className="text-[14px] font-black text-black" style={{ fontFamily: 'Times New Roman' }}>Assinatura do Colaborador</p>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* RODAPÉ REFINADO (ALTA VISIBILIDADE) */}
                  <div className="absolute bottom-0 left-0 w-full h-[2.5cm] overflow-hidden bg-white print:bg-white border-t border-zinc-200 flex items-center justify-end px-16">
                     <div className='flex flex-col gap-1 items-end text-right text-black' style={{ fontFamily: 'Times New Roman' }}>
                        <div className='flex items-center gap-4'>
                           <p className='text-[13px] italic font-normal'>Pág. 01 / 01</p>
                           <div className='h-4 w-[1px] bg-zinc-300'></div>
                           <p className='text-[12px] font-black uppercase tracking-tight'>Amazing Corporation, Lda</p>
                        </div>
                        <p className='text-[10px] font-bold uppercase tracking-tight'>
                           Folha de Salário processada pelo Computador em {new Date().toLocaleString('pt-PT')}
                        </p>
                     </div>
                  </div>

                  {/* BOTÃO VOLTAR NO FINAL (PARA FACILIDADE) */}
                  <div className="p-8 border-t border-zinc-100 flex justify-center print:hidden bg-zinc-50/50">
                     <button
                        onClick={() => setViewingRecibo(null)}
                        className="flex items-center gap-3 px-12 py-5 bg-zinc-900 text-white rounded-[2rem] font-black uppercase text-xs hover:bg-yellow-500 hover:text-zinc-900 transition-all shadow-2xl"
                     >
                        <Printer size={20} />
                     </button>
                  </div>

               </div>
            </>
         )}

         {/* MODAL PASSE PVC */}
         {
            printingPass && (
               <div className="fixed inset-0 z-[250] flex items-center justify-center bg-zinc-950/90 backdrop-blur-md p-4 animate-in fade-in py-10 overflow-y-auto">
                  <div className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 my-auto">
                     <div className="p-8 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                        <h2 className="text-xl font-black text-zinc-900 uppercase flex items-center gap-2">
                           <IdCard className="text-yellow-500" size={24} /> Emissão PVC Corporativo
                        </h2>
                        <button onClick={() => setPrintingPass(null)} className="p-2 text-zinc-400 hover:bg-zinc-200 rounded-full transition-all"><X size={24} /></button>
                     </div>

                     <div className="p-10 flex flex-col items-center gap-8">
                        <div id="pvc-card" className="w-[320px] h-[520px] bg-zinc-900 rounded-[3rem] shadow-[0_25px_60px_rgba(0,0,0,0.4)] overflow-hidden relative flex flex-col items-center p-0 print:shadow-none border border-white/5">
                           <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full -translate-y-32 translate-x-32"></div>
                           <div className="absolute top-0 left-0 w-48 h-48 bg-sky-600/10 rounded-full -translate-y-24 -translate-x-24"></div>

                           <div className="z-10 mt-10 mb-8 flex flex-col items-center text-white">
                              <div className="scale-75 opacity-90 filter brightness-0 invert">
                                 <Logo />
                              </div>
                              <div className="w-8 h-1 bg-yellow-500 rounded-full mt-4"></div>
                           </div>

                           <div className="relative mb-8">
                              <img src={printingPass.foto_url} className="w-32 h-32 rounded-[2.5rem] object-cover border-4 border-zinc-800 shadow-2xl relative z-10" />
                              <div className="absolute -inset-2 bg-gradient-to-tr from-sky-600/20 to-yellow-500/20 rounded-[2.8rem] blur-xl opacity-50"></div>
                           </div>

                           <div className="flex-1 w-full flex flex-col items-center px-8 text-center text-white">
                              <h2 className="text-2xl font-black leading-tight uppercase tracking-tighter mb-1">{printingPass.nome}</h2>
                              <p className="text-[11px] font-black text-yellow-500 uppercase tracking-[0.4em] mb-8">{printingPass.funcao}</p>

                              <div className="grid grid-cols-2 gap-3 w-full mb-10">
                                 <div className="bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                                    <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">ID Registo</p>
                                    <p className="text-[11px] font-black text-white font-mono tracking-tighter">#{printingPass.id.substring(0, 8).toUpperCase()}</p>
                                 </div>
                                 <div className="bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                                    <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Validade</p>
                                    <p className="text-[11px] font-black text-white">
                                       {(() => {
                                          const d = new Date();
                                          d.setFullYear(d.getFullYear() + 2);
                                          return d.toLocaleDateString('pt-PT');
                                       })()}
                                    </p>
                                 </div>
                              </div>

                              <div className="mt-auto mb-10 bg-white p-2.5 rounded-[1.2rem] shadow-2xl">
                                 <QrCode size={40} className="text-zinc-900" />
                              </div>
                           </div>

                           <div className="absolute bottom-0 left-0 w-full flex h-1.5">
                              <div className="flex-1 bg-sky-600"></div>
                              <div className="flex-1 bg-yellow-500"></div>
                              <div className="flex-1 bg-zinc-900 border-t border-white/10"></div>
                           </div>
                        </div>

                        <div className="flex gap-4 w-full">
                           <button onClick={() => window.print()} className="flex-1 py-5 bg-zinc-900 text-white rounded-2xl font-black text-xs uppercase hover:bg-yellow-500 hover:text-zinc-900 transition-all flex items-center justify-center gap-3 shadow-xl">
                              <Printer size={20} /> Emitir Passe PVC
                           </button>
                           <button onClick={() => setPrintingPass(null)} className="px-8 py-5 bg-zinc-100 text-zinc-400 rounded-2xl font-black text-xs uppercase hover:bg-zinc-200 transition-all">Sair</button>
                        </div>
                     </div>
                  </div>
               </div>
            )
         }
      </div >
   );
};

export default HRPage;
