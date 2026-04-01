import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown,
  Users, 
  Plus, 
  FileText, 
  Calendar, 
  DollarSign, 
  Briefcase, 
  Search, 
  Download, 
  ChevronRight,
  PieChart,
  Edit2,
  ArrowUpRight,
  AlertCircle,
  Layout,
  LayoutDashboard,
  History,
  Clock,
  ExternalLink,
  ShieldCheck,
  UserPlus,
  Camera,
  CheckCircle2,
  X,
  ArrowRight,
  Trash2,
  BarChart3,
  FileWarning,
  Wallet,
  Printer,
  AlertTriangle,
  Receipt,
  UserCheck,
  Eye,
  EyeOff
} from 'lucide-react';
import { api } from '../../lib/api';
import { useReactToPrint } from 'react-to-print';


interface Investor {
  id: string;
  numero_sequencial?: number;
  nome: string;
  nif: string;
  email: string;
  password?: string;
  telefone: string;
  telefone_alternativo?: string;
  whatsapp?: string;
  morada?: string;
  naturalidade?: string;
  provincia?: string;
  nacionalidade?: string;
  data_nascimento?: string;
  data_emissao?: string;
  data_validade?: string;
  escolaridade?: string;
  curso?: string;
  profissao?: string;
  foto?: string;
  tipo_investidor?: string;
  status?: string;
  banco_principal?: string;
  iban_principal?: string;
  banco_alternativo?: string;
  iban_alternativo?: string;
  data_inscricao?: string;
}

interface Investment {
  id: string;
  investidor_id: string;
  titulo: string;
  capital_inicial: number;
  data_inicio: string;
  data_fim?: string;
  contrato_url?: string;
  regime?: string;
  taxa?: string;
  duracao?: string;
  periodicidade?: string;
  status: string;
  investidores?: { nome: string };
}

interface Record {
  id: string;
  investimento_id: string;
  data: string;
  aumento: number;
  juros: number;
  iac: number;
  saque: number;
  multa: number;
  comissao?: number;
  observacoes?: string;
}

interface CalculatedMonth extends Record {
  capitalInicial: number;
  capitalBase: number;
  taxaAplicada: number;
  capitalFinal: number;
}

interface PreviewRow {
  data: string;
  aumento: number;
  saque: number;
  multa: number;
  comissao?: number;
  jurosBruto?: number;
  iac?: number;
}

export default function InvestmentsModule() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'investors' | 'applications' | 'records' | 'indicadores' | 'financeiro' | 'saques' | 'extrato' | 'relatorio_investidor' | 'consulta_investidor' | 'expired_contracts'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [projects, setProjects] = useState<Investment[]>([]);
  const [records, setRecords] = useState<Record[]>([]);
  const [activeProject, setActiveProject] = useState<Investment | null>(null);
  
  const [showUnifiedModal, setShowUnifiedModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingInvestor, setEditingInvestor] = useState<Investor | null>(null);
  const [modalTab, setModalTab] = useState<'perfil' | 'aplicacao'>('perfil');
  const [showRecordModal, setShowRecordModal] = useState(false);
  
  const [startDate, setStartDate] = useState<string>('2026-01-01');
  const [numMonths, setNumMonths] = useState<number>(12);
  const [selectedRateType, setSelectedRateType] = useState<'simples' | 'composto'>('simples');
  const [periodicidade, setPeriodicidade] = useState<string>('Mensal');
  const [investorPhoto, setInvestorPhoto] = useState<string | null>(null);
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(null);
  const [birthDate, setBirthDate] = useState<string>('');

  const [reportStartDate, setReportStartDate] = useState<string>('');
  const [reportEndDate, setReportEndDate] = useState<string>('');
  const [selectedInvestorForReport, setSelectedInvestorForReport] = useState<string>('');
  const [showExtratoModal, setShowExtratoModal] = useState(false);
  const [extratoInvestor, setExtratoInvestor] = useState<Investment | null>(null);
  const extratoRef = useRef<HTMLDivElement>(null);
  const handleExtratoPrint = useReactToPrint({ contentRef: extratoRef });
  const [editingRecord, setEditingRecord] = useState<Record | null>(null);
  const [showEditRecordModal, setShowEditRecordModal] = useState(false);
  
  // Modal Novo Lançamento Controlled States
  const [modalForm, setModalForm] = useState({
    investimento_id: '',
    data: new Date().toISOString().slice(0, 16),
    aumento: 0,
    juros: 0,
    iac: 0,
    saque: 0,
    multa: 0
  });

  // Auto-calculate IAC when Aumento or Juros changes in Modal
  useEffect(() => {
    if (showRecordModal) {
      const totalTaxable = (Number(modalForm.aumento) || 0) + (Number(modalForm.juros) || 0);
      setModalForm(prev => ({ ...prev, iac: Number((totalTaxable * 0.10).toFixed(2)) }));
    }
  }, [modalForm.aumento, modalForm.juros, showRecordModal]);

  // Sync modal project with activeTab project
  useEffect(() => {
    if (showRecordModal && activeProject) {
      setModalForm(prev => ({ ...prev, investimento_id: activeProject.id }));
    }
  }, [showRecordModal, activeProject]);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchBy, setSearchBy] = useState<'nome' | 'id'>('nome');
  const [searchResult, setSearchResult] = useState<Investor | null>(null);

  const calculateAge = (dob: string) => {
    if (!dob) return null;
    const birthday = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthday.getFullYear();
    const m = today.getMonth() - birthday.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthday.getDate())) {
        age--;
    }
    return age;
  };
  const [initialCapital, setInitialCapital] = useState<number>(0);
  const [titulo, setTitulo] = useState<string>('');
  const [modalRows, setModalRows] = useState<PreviewRow[]>([]);
  const [isOnlyInvestor, setIsOnlyInvestor] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const reportRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({ contentRef: reportRef });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resInvestors, resProjects, resRecords] = await Promise.all([
        api.get('/api/investments/investors').then(r => r.json()).catch(err => { console.error(err); return []; }),
        api.get('/api/applications').then(r => r.json()).catch(err => { console.error(err); return []; }),
        api.get('/api/applications/records/all').then(r => r.json()).catch(err => { console.error(err); return []; })
      ]);
      setInvestors(resInvestors || []);
      setProjects(resProjects || []);
      setRecords(resRecords || []);
      if (resProjects && resProjects.length > 0 && !activeProject) setActiveProject(resProjects[0]);
    } catch (error) { console.error('Error fetching data:', error); }
    finally { setLoading(false); }
  };

  const fetchRecords = async (id: string) => {
    // Mantido por retrocompatibilidade se existirem chamadas isoladas, mas fetchData já busca tudo
    fetchData();
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResult(null);
      return;
    }
    
    let found: Investor | undefined;
    if (searchBy === 'id') {
      const query = searchQuery.trim().toUpperCase();
      // Permitir busca por número sequencial (ex: 001 ou INV-001/026)
      found = investors.find(inv => {
        if (!inv.numero_sequencial) return false;
        const seqStr = inv.numero_sequencial.toString().padStart(3, '0');
        const fullId = `INV-${seqStr}/026`;
        return seqStr === query || fullId === query || inv.id === query;
      });
    } else {
      const query = searchQuery.toLowerCase().trim();
      found = investors.find(inv => inv.nome.toLowerCase().includes(query));
    }
    
    setSearchResult(found || null);
    
    if (found) {
      const proj = projects.find(p => p.investidor_id === found!.id);
      if (proj) setActiveProject(proj);
    }
  };

  const filteredInvestors = searchQuery.trim() 
    ? (searchBy === 'id' 
        ? investors.filter(inv => {
            const query = searchQuery.trim().toUpperCase();
            if (!inv.numero_sequencial) return inv.id === query;
            const seqStr = inv.numero_sequencial.toString().padStart(3, '0');
            const fullId = `INV-${seqStr}/026`;
            return seqStr === query || fullId === query || inv.id === query;
          })
        : investors.filter(inv => inv.nome.toLowerCase().includes(searchQuery.toLowerCase().trim())))
    : investors;

  const filteredProjects = searchResult 
    ? projects.filter(p => p.investidor_id === searchResult.id)
    : projects;

  const filteredRecords = searchResult
    ? records.filter(r => {
        const proj = projects.find(p => p.id === r.investimento_id);
        return proj?.investidor_id === searchResult.id;
      })
    : records;

  useEffect(() => {
    // Removed specific activeProject fetching to use the global state
    // if (activeProject?.id) fetchRecords(activeProject.id);
  }, [activeProject?.id]);

  useEffect(() => {
    if (showUnifiedModal) {
      const newRows = [];
      const [y, mStr] = startDate.split('-').map(Number);
      
      // Armazenamos o estado atual numa constante para evitar inconsistências no mapping
      const currentLoadedRows = [...modalRows];

      for (let i = 0; i < numMonths; i++) {
        const targetMonth = (mStr - 1) + i;
        const d = new Date(y, targetMonth, 1);
        const yActual = d.getFullYear();
        const mActual = d.getMonth() + 1;
        const prefix = `${yActual}-${String(mActual).padStart(2, '0')}`;
        const dateStr = `${prefix}-01`;
        
        // Match the database record by year and month instead of sequential array index
        const existing = currentLoadedRows.find(r => r.data && r.data.startsWith(prefix));
        
        newRows.push({
            data: dateStr,
            aumento: existing ? (Number(existing.aumento) || 0) : 0,
            saque: existing ? (Number(existing.saque) || 0) : 0,
            multa: existing ? (Number(existing.multa) || 0) : 0
        });
      }
      setModalRows(newRows);
    }
  }, [showUnifiedModal, numMonths, startDate]);

  const formatarNum = (valor: number) => {
    return new Intl.NumberFormat('pt-PT', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(valor)).replace(/\./g, ' ');
  };

  const formatarKz = (valor: number) => `${formatarNum(valor)} Kz`;

  const calculatedEndDate = useMemo(() => {
    if (!startDate || !numMonths) return '';
    const d = new Date(startDate);
    d.setMonth(d.getMonth() + Number(numMonths));
    return d.toISOString().split('T')[0];
  }, [startDate, numMonths]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          setInvestorPhoto(compressedBase64);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const safeISODate = (dateStr: any) => {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '';
        return d.toISOString().split('T')[0];
    } catch (e) { return ''; }
  };

  const handleEditInvestor = async (investor: Investor) => {
    console.log(`[EDIT] Iniciando edição do investidor: ${investor.nome} (${investor.id})`);
    setIsEditing(true);
    setEditingInvestor(investor);
    setModalTab('perfil');
    setInvestorPhoto(investor.foto || null);
    setBirthDate(safeISODate(investor.data_nascimento));
    
    // Buscar projeto deste investidor no estado local
    const project = projects.find(p => p.investidor_id === investor.id);
    if (project) {
      console.log(`[EDIT] Projeto encontrado: ${project.titulo}. Carregando estratégia...`);
      setInitialCapital(Number(project.capital_inicial));
      setStartDate(safeISODate(project.data_inicio) || new Date().toISOString().split('T')[0]);
      const months = parseInt(project.duracao) || 12;
      setNumMonths(months);
      setSelectedRateType(project.regime?.toLowerCase() === 'composto' ? 'composto' : 'simples');
      setTitulo(project.titulo || '');

      // CARREGAR LANÇAMENTOS DO PROJETO (Aumentos, Saques, etc.)
      try {
        console.log(`[EDIT] Carregando lançamentos existentes do projeto ${project.id}...`);
        const res = await api.get(`/api/applications/${project.id}/records`).then(r => r.json());
        if (Array.isArray(res)) {
           const mappedRows = res.map((r: any) => ({
             data: safeISODate(r.data),
             aumento: Number(r.aumento) || 0,
             saque: Number(r.saque) || 0,
             multa: Number(r.multa) || 0
           }));
           setModalRows(mappedRows);
           console.log(`[EDIT] ${mappedRows.length} lançamentos carregados.`);
        }
      } catch (err) {
        console.error('[EDIT] Erro ao carregar lançamentos:', err);
      }
    } else {
      console.warn(`[EDIT] Nenhum projeto encontrado para o investidor ${investor.id}. Resetando campos de estratégia.`);
      setInitialCapital(0);
      setStartDate(new Date().toISOString().split('T')[0]);
      setNumMonths(12);
      setSelectedRateType('simples');
      setTitulo('');
      setModalRows([]);
    }
    
    setShowUnifiedModal(true);
  };

  const handleDeleteInvestor = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este investidor? Esta ação não pode ser desfeita.')) return;
    try {
      await api.delete(`/api/investments/investors/${id}`);
      setInvestors(prev => prev.filter(inv => inv.id !== id));
    } catch (error) { alert('Erro ao excluir investidor'); }
  };

  const previewCalculated = useMemo(() => {
    let currentPrincipal = initialCapital;
    let totalInterestAcum = 0;
    let totalCommissionAcum = 0;
    let totalIACAcum = 0;
    const taxaVal = selectedRateType === 'simples' ? 0.035 : 0.05;

    return modalRows.map((row, idx) => {
        const isLastMonth = idx === modalRows.length - 1;
        const saldoAbertura = currentPrincipal;
        
        const aumento = Number(row.aumento) || 0;
        const saque = Number(row.saque) || 0;
        const multa = Number(row.multa) || 0;

        // 1. Acúmulo de Juros Internos (Capitalização sobre a base total retida)
        const baseJuros = Number((currentPrincipal + totalInterestAcum + aumento).toFixed(2));
        
        // 2. Cálculo Mensal (Transparência)
        const jurosBruto = row.jurosBruto !== undefined ? row.jurosBruto : Number((baseJuros * taxaVal).toFixed(2));
        const comissao = row.comissao !== undefined ? row.comissao : Number((jurosBruto * 0.025).toFixed(2));
        const iacDoMes = row.iac !== undefined ? row.iac : Number((jurosBruto * 0.10).toFixed(2));
        
        // Somar ao pote retido
        totalInterestAcum = Number((totalInterestAcum + jurosBruto).toFixed(2));
        totalCommissionAcum = Number((totalCommissionAcum + comissao).toFixed(2));
        totalIACAcum = Number((totalIACAcum + iacDoMes).toFixed(2));
        
        // 3. Atualizar Capital Principal (Liquidez Mensal)
        // Saques e multas reduzem o capital imediatamente e afetam a base de cálculo futura
        currentPrincipal = Number((currentPrincipal + (aumento - saque - multa)).toFixed(2));
        
        // 4. Saldo Final da Linha (Regra: Apenas Capital até o fim)
        let finalValue = currentPrincipal;
        if (isLastMonth) {
            // No último mês, liquida tudo: Capital + Juros Retidos - Taxas Retidas
            finalValue = Number((currentPrincipal + totalInterestAcum - totalCommissionAcum - totalIACAcum).toFixed(2));
        }

        const [yLabel, mLabel, dLabel] = row.data.split('-').map(Number);
        const mesesNomes = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        const mesLabel = mesesNomes[mLabel - 1];
        
        return {
            ...row,
            mesLabel,
            saldoInicial: saldoAbertura,
            subtotalFluxo: baseJuros,
            taxa: selectedRateType === 'simples' ? '3,5%' : '5%',
            juros: jurosBruto,
            jurosBruto,
            comissao,
            iac: iacDoMes,
            final: finalValue
        };
    });
  }, [modalRows, initialCapital, selectedRateType, periodicidade]);

  const updateModalRow = (index: number, field: keyof PreviewRow, value: string | number) => {
    const newRows = [...modalRows];
    const numVal = Number(value) || 0;
    newRows[index] = { ...newRows[index], [field]: numVal };

    // Ao editar o Juro Bruto, sugere automaticamente IAC e Comissão
    if (field === 'jurosBruto') {
      newRows[index].iac = Number((numVal * 0.10).toFixed(2));
      newRows[index].comissao = Number((numVal * 0.025).toFixed(2));
    }

    if (field === 'saque' && numVal > 0) {
      newRows[index].multa = Number((numVal * 0.10).toFixed(2));
    }
    setModalRows(newRows);
  };

  const calculateProjectFullHistory = (project: Investment, currentRecords: Record[]) => {
    if (!project) return { history: [], totals: { aumento: 0, juros: 0, iac: 0, comissao: 0, saque: 0, multa: 0, resultado: 0 } };
    
    const startDate = new Date(project.data_inicio);
    const numMonthsStr = project.duracao ? String(project.duracao).replace(/\D/g, '') : '12';
    const monthsElapsed = parseInt(numMonthsStr) || 12;
    const taxaVal = project.taxa?.toString().includes('3.5') ? 0.035 : 0.05;
    
    let currentPrincipal = Number(project.capital_inicial);
    let totalInterestAcum = 0;
    let totalCommissionAcum = 0;
    let totalIACAcum = 0;
    const history: any[] = [];
    
    for (let i = 0; i < monthsElapsed; i++) {
        const isLastMonth = i === monthsElapsed - 1;
        const targetDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
        const dateStr = targetDate.toISOString().split('T')[0];
      
        const monthRecords = currentRecords.filter(r => {
            const d = new Date(r.data);
            return d.getFullYear() === targetDate.getFullYear() && d.getMonth() === targetDate.getMonth();
        });

        const tAumento = Number(monthRecords.reduce((acc, r) => acc + (Number(r.aumento) || 0), 0).toFixed(2));
        const tSaque = Number(monthRecords.reduce((acc, r) => acc + (Number(r.saque) || 0), 0).toFixed(2));
        const tMulta = Number(monthRecords.reduce((acc, r) => acc + (Number(r.multa) || 0), 0).toFixed(2));
        
        const baseJuros = Number((currentPrincipal + totalInterestAcum + tAumento).toFixed(2));
        
        const recordedJuros = monthRecords.find(r => Number(r.juros) > 0)?.juros;
        const recordedIAC = monthRecords.find(r => Number(r.iac) > 0)?.iac;
        const recordedComissao = monthRecords.find(r => Number(r.comissao) > 0)?.comissao;

        const jurosBruto = recordedJuros !== undefined ? Number(recordedJuros) : Number((baseJuros * taxaVal).toFixed(2));
        const comissao = recordedComissao !== undefined ? Number(recordedComissao) : Number((jurosBruto * 0.025).toFixed(2));
        const iacDoMes = recordedIAC !== undefined ? Number(recordedIAC) : Number((jurosBruto * 0.10).toFixed(2));

        totalInterestAcum = Number((totalInterestAcum + jurosBruto).toFixed(2));
        totalCommissionAcum = Number((totalCommissionAcum + comissao).toFixed(2));
        totalIACAcum = Number((totalIACAcum + iacDoMes).toFixed(2));

        const capitalAbertura = currentPrincipal;
        currentPrincipal = Number((currentPrincipal + (tAumento - tSaque - tMulta)).toFixed(2));
        
        let finalRowValue = currentPrincipal;
        if (isLastMonth) {
            finalRowValue = Number((currentPrincipal + totalInterestAcum - totalCommissionAcum - totalIACAcum).toFixed(2));
        }

        history.push({
            id: `full-${i}`,
            data: dateStr,
            capitalInicial: capitalAbertura,
            capitalBase: baseJuros,
            aumento: tAumento,
            juros: jurosBruto,
            comissao,
            iac: iacDoMes,
            saque: tSaque,
            multa: tMulta,
            capitalFinal: finalRowValue,
            taxaAplicada: taxaVal * 100
        });
    }
    
    const totals = history.reduce((acc, cur) => ({
      aumento: Number((acc.aumento + cur.aumento).toFixed(2)),
      juros: Number((acc.juros + cur.juros).toFixed(2)),
      comissao: Number((acc.comissao + cur.comissao).toFixed(2)),
      iac: Number((acc.iac + cur.iac).toFixed(2)),
      saque: Number((acc.saque + cur.saque).toFixed(2)),
      multa: Number((acc.multa + cur.multa).toFixed(2)),
      resultado: cur.capitalFinal
    }), { aumento: 0, juros: 0, comissao: 0, iac: 0, saque: 0, multa: 0, resultado: Number(project.capital_inicial) });
    
    return { history, totals };
  };

  const calculatedHistory = useMemo(() => {
    if (!activeProject) return [];
    return calculateProjectFullHistory(activeProject, records.filter(r => r.investimento_id === activeProject.id)).history;
  }, [activeProject, records]);

  const totals = useMemo(() => {
    if (!activeProject) return { aumento: 0, juros: 0, iac: 0, resultado: 0 };
    return calculateProjectFullHistory(activeProject, records.filter(r => r.investimento_id === activeProject.id)).totals;
  }, [activeProject, records]);

  const handleUnifiedRegistration = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    try {
      let invId = editingInvestor?.id;
      const payload = {
        nome: data.nome, nif: data.nif, email: data.email, telefone: data.telefone,
        telefone_alternativo: data.telefone_alternativo, whatsapp: data.whatsapp,
        morada: data.morada, naturalidade: data.naturalidade, provincia: data.provincia,
        nacionalidade: data.nacionalidade,
        data_nascimento: data.data_nascimento || null,
        data_emissao: data.data_emissao || null,
        data_validade: data.data_validade || null,
        escolaridade: data.escolaridade, curso: data.curso, profissao: data.profissao,
        estado_civil: data.estado_civil, password: data.password,
        banco_principal: data.banco_principal, iban_principal: data.iban_principal,
        banco_alternativo: data.banco_alternativo, iban_alternativo: data.iban_alternativo,
        foto: investorPhoto, tipo_investidor: data.tipo_investidor, status: data.status,
        data_inscricao: data.data_inscricao || null
      };

      if (isEditing && invId) {
        console.log(`[SAVE] Atualizando investidor...`);
        const updatedInv = await api.put(`/api/investments/investors/${invId}`, payload).then(r => r.json());
        
        // Atualização em Tempo Real (Local State)
        setInvestors(prev => prev.map(inv => inv.id === invId ? { ...inv, ...updatedInv } : inv));
        
        // Estratégia de Rendimento (Aplicação)
        const appPayload = {
          titulo: titulo,
          investidor_id: invId,
          capital_inicial: initialCapital,
          data_inicio: startDate,
          data_fim: calculatedEndDate,
          regime: selectedRateType === 'simples' ? 'Simples' : 'Composto',
          taxa: selectedRateType === 'simples' ? '3.5%' : '5%',
          periodicidade: periodicidade,
          duracao: `${numMonths} Meses`
        };

        const existingProject = projects.find(p => String(p.investidor_id) === String(invId));
        if (existingProject) {
          console.log(`[SAVE] Sincronizando aplicação [ID: ${existingProject.id}]...`);
          await api.put(`/api/applications/${existingProject.id}`, appPayload);
          
          // SINCRONIZAR LANÇAMENTOS (Aumentos, Saques, Multas) NO MODO EDIÇÃO
          console.log(`[SAVE] Sincronizando histórico de movimentações...`);
          await api.delete(`/api/applications/${existingProject.id}/records`); // Limpar antigos
          
          for (const row of previewCalculated) {
            const vAumento = Number(row.aumento) || 0;
            const vSaque = Number(row.saque) || 0;
            const vMulta = Number(row.multa) || 0;
            const vJuros = Number(row.jurosBruto) || 0;
            const vIAC = Number(row.iac) || 0;
            const vComissao = Number(row.comissao) || 0;
            
            if (vAumento > 0 || vSaque > 0 || vMulta > 0 || vJuros > 0) {
              await api.post('/api/applications/records', { 
                investimento_id: existingProject.id, 
                data: row.data, 
                aumento: vAumento, 
                saque: vSaque, 
                multa: vMulta,
                juros: vJuros,
                iac: vIAC,
                comissao: vComissao,
                observacoes: 'Atualização pela Estratégia' 
              });
            }
          }
        } else if (!isOnlyInvestor && initialCapital > 0) {
          console.log(`[SAVE] Criando nova aplicação para investidor existente...`);
          const appRes = await api.post('/api/applications', appPayload).then(r => r.json());
          
          // Gravar registros da nova aplicação
          for (const row of previewCalculated) {
            if (row.aumento > 0 || row.saque > 0 || row.multa > 0 || row.jurosBruto > 0) {
              await api.post('/api/applications/records', { 
                investimento_id: appRes.id, 
                data: row.data, 
                aumento: row.aumento, 
                saque: row.saque, 
                multa: row.multa, 
                juros: row.jurosBruto,
                iac: row.iac,
                comissao: row.comissao,
                observacoes: 'Lançamento Inicial' 
              });
            }
          }
        }
      } else {
        console.log('[API] Tentando POST para /api/investments/investors');
        const invRes = await api.post('/api/investments/investors', payload).then(r => r.json());
        invId = invRes.id;
        
        // Adicionar novo investidor ao estado local
        setInvestors(prev => [invRes, ...prev]);

        if (!isOnlyInvestor) {
          if (!initialCapital || !titulo) {
            alert('Por favor, preencha o Capital Inicial e o Identificador de Título na aba de Estratégia Financeira.');
            setModalTab('aplicacao');
            return;
          }

          const appRes = await api.post('/api/applications', {
            titulo: titulo,
            investidor_id: invId,
            capital_inicial: initialCapital,
            data_inicio: startDate,
            data_fim: calculatedEndDate,
            regime: selectedRateType === 'simples' ? 'Simples' : 'Composto',
            taxa: selectedRateType === 'simples' ? '3.5%' : '5%',
            periodicidade: periodicidade,
            duracao: `${numMonths} Meses`
          }).then(r => r.json());

          for (const row of previewCalculated) {
            if (row.aumento > 0 || row.saque > 0 || row.multa > 0 || row.jurosBruto > 0) {
              await api.post('/api/applications/records', { 
                investimento_id: appRes.id, 
                data: row.data, 
                aumento: row.aumento, 
                saque: row.saque, 
                multa: row.multa,
                juros: row.jurosBruto,
                iac: row.iac,
                comissao: row.comissao,
                observacoes: 'Lançamento Inicial' 
              });
            }
          }
        }
      }
      
      alert(isEditing ? 'Dados atualizados com sucesso!' : 'Investidor registrado com sucesso!');
      setShowUnifiedModal(false); 
      setModalRows([]); 
      setEditingInvestor(null);
      setIsEditing(false); 
      setIsOnlyInvestor(false); 
      fetchData(); // Sincronização final
    } catch (err) { 
      console.error('[API Error]:', err);
      alert('Erro ao processar cadastro: ' + err); 
    }
  };

  // Trigger suggestion automatically only when "Aumento" is provided
  useEffect(() => {
    if (showRecordModal && modalForm.investimento_id) {
      if ((Number(modalForm.aumento) || 0) > 0) {
        suggestRendimento();
      } else {
        // Clear fields if Aumento is empty/zero
        setModalForm(prev => ({ ...prev, juros: 0, iac: 0, saque: 0, multa: 0 }));
      }
    }
  }, [modalForm.investimento_id, modalForm.aumento, showRecordModal]);

  const suggestRendimento = () => {
    const proj = projects.find(p => p.id === modalForm.investimento_id);
    if (!proj) return;

    // Fixed Rates: Composto = 5% (0.05), Simples = 3.5% (0.035)
    const rateNum = proj.regime === 'Composto' ? 0.05 : 0.035;

    // Calculate current month's capital base
    const projRecords = records.filter(r => r.investimento_id === proj.id);
    let capitalBase = proj.capital_inicial;

    projRecords.forEach(r => {
      capitalBase += (Number(r.aumento) || 0);
      capitalBase -= (Number(r.saque) || 0);
      
      if (proj.regime === 'Composto') {
        capitalBase += (Number(r.juros) || 0);
        capitalBase -= (Number(r.iac) || 0);
      }
    });

    const currentAumento = Number(modalForm.aumento) || 0;
    const finalBase = capitalBase + currentAumento;

    const calculatedJuros = Number((finalBase * rateNum).toFixed(2));
    setModalForm(prev => ({ 
      ...prev, 
      juros: calculatedJuros,
      iac: Number((calculatedJuros * 0.10).toFixed(2))
    }));
  };

  const handleAddRecord = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!modalForm.investimento_id) {
      alert('Por favor, selecione um investimento/titular.');
      return;
    }

    try {
      await api.post('/api/applications/records', { 
        ...modalForm, 
        aumento: Number(modalForm.aumento) || 0, 
        juros: Number(modalForm.juros) || 0,
        iac: Number(modalForm.iac) || 0,
        saque: Number(modalForm.saque) || 0, 
        multa: Number(modalForm.multa) || 0 
      });
      setShowRecordModal(false); 
      setModalForm({
        investimento_id: '',
        data: new Date().toISOString().slice(0, 16),
        aumento: 0,
        juros: 0,
        iac: 0,
        saque: 0,
        multa: 0
      });
      fetchData();
      alert('Lançamento registado com sucesso!');
    } catch (err) { alert('Erro ao registar movimento'); }
  };

  const handleEditRecord = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingRecord) return;
    const formData = new FormData(e.currentTarget);
    const rawData = Object.fromEntries(formData.entries());
    try {
      await api.put(`/api/applications/records/single/${editingRecord.id}`, { 
        ...rawData, 
        aumento: Number(rawData.aumento) || 0, 
        juros: Number(rawData.juros) || 0,
        iac: Number(rawData.iac) || 0,
        saque: Number(rawData.saque) || 0, 
        multa: Number(rawData.multa) || 0 
      });
      setShowEditRecordModal(false); 
      setEditingRecord(null);
      fetchData();
      alert('Lançamento atualizado com sucesso!');
    } catch (err) { alert('Erro ao atualizar movimento'); }
  };

  if (loading) return <div className="flex items-center justify-center p-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-primary"></div></div>;

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 text-white">
        <div>
          <h1 className="text-4xl font-black tracking-tighter italic font-display leading-none mb-3">
            Gestão de <span className="text-gold-gradient">Aplicações Financeiras</span>
          </h1>
          <p className="text-gold-primary/40 font-black text-[10px] uppercase tracking-[0.4em]">Banking Assets Management 2026</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => { 
            setIsEditing(false); 
            setEditingInvestor(null); 
            setModalTab('perfil'); 
            setSelectedInvestor(null); 
            setModalRows([]); 
            setBirthDate(''); 
            setInvestorPhoto(null);
            setShowUnifiedModal(true); 
          }} className="bg-gradient-to-r from-gold-primary to-gold-secondary text-bg-deep px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-gold-primary/20 hover:scale-105 transition-all flex items-center gap-2">
            <Plus size={18} /> Novo Registro Bancário
          </button>
          <button onClick={handlePrint} className="p-3 bg-white/5 border border-white/10 text-gold-primary rounded-2xl hover:bg-white/10 transition-all shadow-lg shadow-gold-primary/5 active:scale-90 transition-all"><Download size={20} /></button>
        </div>
      </div>

      <div className="flex border-b border-white/5 mb-10 gap-8 overflow-x-auto pb-1">
        {[
          { id: 'dashboard', label: 'Centro de Comando', icon: LayoutDashboard },
          { id: 'indicadores', label: 'Indicadores', icon: BarChart3 },
          { id: 'financeiro', label: 'Relatório Financeiro', icon: Wallet },
          { id: 'records', label: 'Lançamentos', icon: History },
          { id: 'saques', label: 'Consulta de Saques', icon: DollarSign },
          { id: 'applications', label: 'Gestão de Títulos', icon: Briefcase },
          { id: 'expired_contracts', label: 'Contratos Terminados', icon: FileWarning },
          { id: 'investors', label: 'Investidores Cadastrados', icon: Users },
          { id: 'extrato', label: 'Extrato PDF', icon: FileText },
          { id: 'relatorio_investidor', label: 'Relatório por Investidor', icon: PieChart },
          { id: 'consulta_investidor', label: 'Área do Investidor', icon: UserCheck }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-3 pb-4 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === tab.id ? 'text-gold-primary' : 'text-white/30 hover:text-white/60'}`}>
            <tab.icon size={18} /> {tab.label}
            {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gold-primary" />}
          </button>
        ))}
      </div>

      <div className="glass-panel p-6 rounded-3xl border-gold-primary/20 mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex gap-2">
            <button 
              onClick={() => setSearchBy('nome')}
              className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${searchBy === 'nome' ? 'bg-gold-primary text-bg-deep' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
            >
              Por Nome
            </button>
            <button 
              onClick={() => setSearchBy('id')}
              className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${searchBy === 'id' ? 'bg-gold-primary text-bg-deep' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
            >
              Por Número
            </button>
          </div>
          <div className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
              <input 
                type="text" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={searchBy === 'nome' ? 'Digite o nome do investidor...' : 'Digite o número do investidor...'}
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-white font-bold outline-none focus:border-gold-primary"
              />
            </div>
            <button 
              onClick={handleSearch}
              className="bg-gold-primary text-bg-deep px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all"
            >
              <Search size={18} />
            </button>
          </div>
          {searchResult && (
            <button 
              onClick={() => { setSearchQuery(''); setSearchResult(null); }}
              className="bg-red-500/20 text-red-400 px-4 py-4 rounded-2xl hover:bg-red-500/30 transition-all"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in slide-in-from-bottom duration-500">
          <div className="glass-panel p-8 rounded-3xl border-white/5 group hover:border-gold-primary/30 transition-all">
            <span className="text-[10px] font-black uppercase tracking-widest text-gold-primary/40 block mb-2">Títulos Ativos</span>
            <span className="text-2xl font-black text-white group-hover:text-gold-primary">{projects.length}</span>
          </div>
          <div className="glass-panel p-8 rounded-3xl border-white/5 group hover:border-emerald-400/30 transition-all">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400/40 block mb-2 group-hover:text-emerald-400">Património Gerido</span>
            <span className="text-2xl font-black text-white">{formatarKz(projects.reduce((acc, p) => acc + Number(p.capital_inicial), 0))}</span>
          </div>
          <div className="glass-panel p-8 rounded-3xl border-white/5 group hover:border-gold-primary/30 transition-all text-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-gold-primary/40 block mb-2">Ano Fiscal Corrente</span>
            <span className="text-2xl font-black text-gold-gradient">2026</span>
          </div>
          <div className="glass-panel p-8 rounded-3xl border-white/5 bg-gold-primary/5 group hover:bg-gold-primary/10 transition-all">
            <span className="text-[10px] font-black uppercase tracking-widest text-gold-primary/60 block mb-2">Base de Titulares</span>
            <span className="text-2xl font-black text-gold-primary">{investors.length}</span>
          </div>
        </div>
      )}

      {activeTab === 'applications' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-500">
          {filteredProjects.length === 0 ? (
            <div className="col-span-2 text-center py-12 text-white/30 font-black uppercase tracking-widest">
              Nenhum investimento encontrado
            </div>
          ) : (
            filteredProjects.map(proj => (
              <div key={proj.id} className="glass-panel p-6 rounded-[30px] border-white/5 flex items-center justify-between group cursor-pointer hover:border-gold-primary/20 transition-all" onClick={() => { setActiveProject(proj); setActiveTab('records'); }}>
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-gold-primary group-hover:scale-110 transition-transform"><Briefcase size={24} /></div>
                  <div>
                    <h3 className="text-lg font-black text-white tracking-tight italic">{proj.titulo}</h3>
                    <p className="text-[10px] font-black uppercase text-gold-primary/40 tracking-widest">{proj.investidores?.nome}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="block text-[9px] font-black uppercase text-gold-primary/40 mb-1">Aporte de Origem</span>
                  <span className="text-lg font-black text-white">{formatarKz(proj.capital_inicial)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'records' && (
        <div className="flex flex-col gap-8 text-white animate-in zoom-in-95 duration-500">
          <div className="flex items-center gap-4 mb-2 overflow-x-auto pb-2 custom-scrollbar">
             {filteredProjects.map(p => (
                <button key={p.id} onClick={() => setActiveProject(p)} className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shrink-0 border ${activeProject?.id === p.id ? 'bg-gold-primary text-bg-deep border-gold-primary shadow-lg shadow-gold-primary/20' : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10'}`}>
                   {p.titulo}
                </button>
             ))}
          </div>

          {activeProject && (
            <div className="glass-panel rounded-[30px] border-white/5 overflow-hidden shadow-2xl">
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                <div>
                  <h3 className="text-xl font-black text-white tracking-tighter italic text-gold-gradient uppercase">Demonstrativo de Histórico Bancário</h3>
                  <p className="text-[10px] font-black text-gold-primary/40 uppercase tracking-widest mt-1">ID: {activeProject.investidor_id} | Titular: {activeProject.investidores?.nome} | Regime: {activeProject.regime}</p>
                </div>
                <button onClick={() => setShowRecordModal(true)} className="p-3 bg-white/5 border border-white/10 rounded-xl text-gold-primary hover:bg-gold-primary hover:text-bg-deep transition-all shadow-lg active:scale-95"><Plus size={20} /></button>
              </div>
              
              <div className="overflow-x-auto p-8">
                <table className="w-full border-collapse border border-white/10 font-mono-table">
                  <thead className="bg-[#002855] text-white">
                    <tr>
                      <th className="py-4 px-6 border border-white/10 font-bold uppercase text-[11px]">Data / Hora</th>
                      <th className="py-4 px-6 border border-white/10 font-bold uppercase text-[11px]">Aumento</th>
                      <th className="py-4 px-6 border border-white/10 font-bold uppercase text-[11px]">Juros</th>
                      <th className="py-4 px-6 border border-white/10 font-bold uppercase text-[11px]">IAC</th>
                      <th className="py-4 px-6 border border-white/10 font-bold uppercase text-[11px]">Saque</th>
                      <th className="py-4 px-6 border border-white/10 font-bold uppercase text-[11px]">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="text-white">
                    {records.filter(r => r.investimento_id === activeProject.id).sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()).map(row => (
                      <tr key={row.id} className="hover:bg-white/5 transition-colors border-b border-white/5">
                        <td className="py-4 px-6 border-r border-white/10 text-center font-bold text-[11px] uppercase whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span>{new Date(row.data).toLocaleDateString('pt-AO', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                            <span className="text-[8px] text-white/30 lowercase">às {new Date(row.data).toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 border-r border-white/10 text-center font-bold text-sm text-emerald-400">+{formatarNum(row.aumento)}</td>
                        <td className="py-4 px-6 border-r border-white/10 text-center font-bold text-sm text-blue-400">+{formatarNum(row.juros)}</td>
                        <td className="py-4 px-6 border-r border-white/10 text-center font-bold text-sm text-rose-400">-{formatarNum(row.iac)}</td>
                        <td className="py-4 px-6 border-r border-white/10 text-center font-bold text-sm text-rose-500">-{formatarNum(row.saque)}</td>
                        <td className="py-4 px-6 border-white/10 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => {
                                setEditingRecord(row);
                                setShowEditRecordModal(true);
                              }}
                              className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white transition-all"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              onClick={async () => {
                                if (confirm('Deseja eliminar este lançamento definitivamente?')) {
                                  try {
                                    await api.delete(`/api/applications/records/single/${row.id}`);
                                    alert('Lançamento eliminado com sucesso!');
                                    fetchData();
                                  } catch (err) {
                                    alert('Erro ao eliminar lançamento');
                                  }
                                }
                              }}
                              className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-[#002855]/60 font-black border-t-2 border-gold-primary/30">
                      <td className="py-5 px-6 border border-white/10 text-center uppercase text-[10px] tracking-widest text-gold-primary/60 italic">
                        Consolidado Acumulado
                      </td>
                      <td className="py-5 px-6 border border-white/10 text-center text-emerald-400 font-black">
                        +{formatarNum(totals.aumento)}
                      </td>
                      <td className="py-5 px-6 border border-white/10 text-center text-blue-400 font-black">
                        +{formatarNum(totals.juros)}
                      </td>
                      <td className="py-5 px-6 border border-white/10 text-center text-rose-400 font-black">
                        -{formatarNum(totals.iac)}
                      </td>
                      <td className="py-5 px-6 border border-white/10 text-center text-rose-500 font-black">
                        -{formatarNum(totals.saque)}
                      </td>
                      <td className="py-5 px-6 border border-white/10 text-center text-gold-primary font-black italic text-base">
                        {formatarKz(totals.resultado)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* --- BARRA DE RESUMO DINÂMICA (Scroll Horizontal) --- */}
              <div className="px-8 pb-8">
                <div className="relative">
                  {/* Label */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-1 h-6 bg-gold-primary rounded-full" />
                    <span className="text-[10px] font-black uppercase text-gold-primary/50 tracking-[0.4em] italic">Indicadores Consolidados do Contrato</span>
                    <div className="flex-1 h-px bg-white/5" />
                    <span className="text-[9px] font-black text-white/20 italic tracking-widest">← deslize para ver →</span>
                  </div>

                  {/* Scrollable Strip */}
                  <div className="overflow-x-auto pb-3 custom-scrollbar">
                    <div className="flex gap-4 min-w-max">

                      {/* SALDO FINAL - Destaque */}
                      <div className="flex-shrink-0 bg-gold-primary/10 border-2 border-gold-primary/30 p-6 rounded-[28px] min-w-[200px] gold-glow relative overflow-hidden group hover:bg-gold-primary/15 transition-all">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-gold-primary/5 rounded-bl-full group-hover:bg-gold-primary/10 transition-all" />
                        <span className="text-[9px] font-black uppercase text-gold-primary/50 block mb-2 tracking-widest flex items-center gap-1">
                          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping inline-block" />
                          Saldo Final Líquido
                        </span>
                        <span className="text-2xl font-black text-gold-primary italic font-display">{formatarKz(totals.resultado)}</span>
                      </div>

                      {/* Separador */}
                      <div className="flex-shrink-0 w-px bg-white/10 self-stretch my-2" />

                      {/* AUMENTO */}
                      <div className="flex-shrink-0 bg-emerald-500/5 border border-emerald-500/15 p-5 rounded-[24px] min-w-[160px] hover:bg-emerald-500/10 transition-all group">
                        <span className="text-[9px] font-black uppercase text-emerald-400/50 block mb-2 tracking-widest">↑ Total Depósitos</span>
                        <span className="text-lg font-black text-emerald-400 font-display">+{formatarKz(totals.aumento)}</span>
                      </div>

                      {/* SAQUE */}
                      <div className="flex-shrink-0 bg-rose-500/5 border border-rose-500/15 p-5 rounded-[24px] min-w-[160px] hover:bg-rose-500/10 transition-all group">
                        <span className="text-[9px] font-black uppercase text-rose-500/50 block mb-2 tracking-widest">↓ Total Saques</span>
                        <span className="text-lg font-black text-rose-400 font-display">-{formatarKz(totals.saque)}</span>
                      </div>

                      {/* MULTA */}
                      <div className="flex-shrink-0 bg-slate-500/5 border border-slate-500/15 p-5 rounded-[24px] min-w-[160px] hover:bg-slate-500/10 transition-all group">
                        <span className="text-[9px] font-black uppercase text-slate-400/50 block mb-2 tracking-widest">⚠ Total Multas</span>
                        <span className="text-lg font-black text-slate-400 font-display">-{formatarKz(totals.multa)}</span>
                      </div>

                      {/* Separador */}
                      <div className="flex-shrink-0 w-px bg-white/10 self-stretch my-2" />

                      {/* JUROS BRUTO */}
                      <div className="flex-shrink-0 bg-blue-500/5 border border-blue-500/15 p-5 rounded-[24px] min-w-[160px] hover:bg-blue-500/10 transition-all group">
                        <span className="text-[9px] font-black uppercase text-blue-400/50 block mb-2 tracking-widest">★ Juros Bruto Acum.</span>
                        <span className="text-lg font-black text-blue-400 font-display">+{formatarKz(totals.juros)}</span>
                      </div>

                      {/* COMISSÃO */}
                      <div className="flex-shrink-0 bg-gold-primary/5 border border-gold-primary/15 p-5 rounded-[24px] min-w-[160px] hover:bg-gold-primary/10 transition-all group">
                        <span className="text-[9px] font-black uppercase text-gold-primary/50 block mb-2 tracking-widest">% Comissões (2.5%)</span>
                        <span className="text-lg font-black text-gold-primary font-display">-{formatarKz(totals.comissao)}</span>
                      </div>

                      {/* IAC */}
                      <div className="flex-shrink-0 bg-rose-400/5 border border-rose-400/15 p-5 rounded-[24px] min-w-[160px] hover:bg-rose-400/10 transition-all group">
                        <span className="text-[9px] font-black uppercase text-rose-400/50 block mb-2 tracking-widest">🔒 IAC Retido (10%)</span>
                        <span className="text-lg font-black text-rose-300 font-display">-{formatarKz(totals.iac)}</span>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'indicadores' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="glass-panel p-8 rounded-3xl border-gold-primary/20 bg-gold-primary/5">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-gold-primary/20 rounded-2xl flex items-center justify-center"><Users size={24} className="text-gold-primary" /></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gold-primary/60">Total de Investidores</span>
              </div>
              <span className="text-4xl font-black text-gold-primary">{investors.length}</span>
            </div>
            <div className="glass-panel p-8 rounded-3xl border-red-500/20 bg-red-500/5">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-red-500/20 rounded-2xl flex items-center justify-center"><AlertCircle size={24} className="text-red-500" /></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-red-500/60">Contratos Terminados</span>
              </div>
              <span className="text-4xl font-black text-red-500">
                {projects.filter(p => p.data_fim && new Date(p.data_fim) < new Date()).length}
              </span>
            </div>
            <div className="glass-panel p-8 rounded-3xl border-amber-500/20 bg-amber-500/5">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-amber-500/20 rounded-2xl flex items-center justify-center"><AlertTriangle size={24} className="text-amber-500" /></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-500/60">Alerta 30 Dias</span>
              </div>
              <span className="text-4xl font-black text-amber-500">
                {projects.filter(p => {
                  if (!p.data_fim) return false;
                  const endDate = new Date(p.data_fim);
                  const today = new Date();
                  const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  return diffDays >= 0 && diffDays <= 30;
                }).length}
              </span>
            </div>
            <div className="glass-panel p-8 rounded-3xl border-emerald-500/20 bg-emerald-500/5">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center"><TrendingUp size={24} className="text-emerald-500" /></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500/60">Património Total</span>
              </div>
              <span className="text-2xl font-black text-emerald-500">{formatarKz(projects.reduce((acc, p) => acc + Number(p.capital_inicial), 0))}</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'financeiro' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="glass-panel p-8 rounded-3xl border-white/10">
            <h3 className="text-xl font-black text-gold-primary uppercase tracking-wider mb-6 flex items-center gap-4">
              <Calendar size={24} /> Filtros por Período
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-white/40 tracking-widest">Data Início</label>
                <input type="date" value={reportStartDate} onChange={e => setReportStartDate(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-gold-primary" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-white/40 tracking-widest">Data Fim</label>
                <input type="date" value={reportEndDate} onChange={e => setReportEndDate(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-gold-primary" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-white/40 tracking-widest">Investidor</label>
                <select value={selectedInvestorForReport} onChange={e => setSelectedInvestorForReport(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-gold-primary">
                  <option value="">Todos os Investidores</option>
                  {investors.map(inv => (
                    <option key={inv.id} value={inv.id}>{inv.nome}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {(() => {
              const fRecords = records.filter(r => {
                const recordDate = new Date(r.data);
                const start = reportStartDate ? new Date(reportStartDate) : null;
                const end = reportEndDate ? new Date(reportEndDate) : null;
                if (start && recordDate < start) return false;
                if (end && recordDate > end) return false;
                if (selectedInvestorForReport) {
                  const p = projects.find(proj => proj.id === r.investimento_id);
                  if (p?.investidor_id !== selectedInvestorForReport) return false;
                }
                return true;
              });
              return (
                <>
                  <div className="glass-panel p-8 rounded-3xl border-emerald-500/20 bg-emerald-500/5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500/60 block mb-2">Total de AUMENTO</span>
                    <span className="text-3xl font-black text-emerald-500">{formatarKz(fRecords.reduce((acc, r) => acc + Number(r.aumento), 0))}</span>
                  </div>
                  <div className="glass-panel p-8 rounded-3xl border-red-500/20 bg-red-500/5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-red-500/60 block mb-2">Total de Saques</span>
                    <span className="text-3xl font-black text-red-500">{formatarKz(fRecords.reduce((acc, r) => acc + Number(r.saque), 0))}</span>
                  </div>
                  <div className="glass-panel p-8 rounded-3xl border-amber-500/20 bg-amber-500/5">
                    <span className="text-[12px] font-black uppercase tracking-widest text-amber-500/60 block mb-2">Total de Juros</span>
                    <span className="text-3xl font-black text-amber-500">{formatarKz(fRecords.reduce((acc, r) => acc + Number(r.juros), 0))}</span>
                  </div>
                  <div className="glass-panel p-8 rounded-3xl border-blue-500/20 bg-blue-500/5">
                    <span className="text-[12px] font-black uppercase tracking-widest text-blue-500/60 block mb-2">Total de IAC</span>
                    <span className="text-3xl font-black text-blue-500">{formatarKz(fRecords.reduce((acc, r) => acc + Number(r.iac), 0))}</span>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {activeTab === 'saques' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="glass-panel p-8 rounded-3xl border-white/10">
            <h3 className="text-xl font-black text-gold-primary uppercase tracking-wider mb-6 flex items-center gap-4">
              <DollarSign size={24} /> Consulta de Saques
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr className="text-[10px] font-black uppercase text-white/40 tracking-widest">
                    <th className="py-4 px-6 text-left">Investidor</th>
                    <th className="py-4 px-6 text-center">Data</th>
                    <th className="py-4 px-6 text-center">Nº Saques</th>
                    <th className="py-4 px-6 text-right">Valor Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {projects.map(proj => {
                    const projRecords = records.filter(r => r.investimento_id === proj.id && r.saque > 0);
                    if (projRecords.length === 0) return null;
                    return (
                      <tr key={proj.id} className="hover:bg-white/[0.02] transition-all">
                        <td className="py-4 px-6 font-black text-white">{proj.investidores?.nome || 'N/A'}</td>
                        <td className="py-4 px-6 text-center text-white/40">{proj.data_inicio ? new Date(proj.data_inicio).toLocaleDateString('pt-AO') : '-'}</td>
                        <td className="py-4 px-6 text-center font-black text-red-400">{projRecords.length}</td>
                        <td className="py-4 px-6 text-right font-black text-red-400">{formatarKz(projRecords.reduce((acc, r) => acc + Number(r.saque), 0))}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'extrato' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredProjects.map(proj => (
              <div key={proj.id} className="glass-panel p-6 rounded-2xl border border-white/10 hover:border-gold-primary/30 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-black text-white text-lg">{proj.investidores?.nome || 'Investidor'}</p>
                    <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">{proj.titulo}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase text-white/40">Capital</p>
                    <p className="font-black text-gold-primary">{formatarKz(proj.capital_inicial)}</p>
                  </div>
                </div>
                <button onClick={() => { setExtratoInvestor(proj); setShowExtratoModal(true); }} className="w-full bg-gold-primary text-bg-deep py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                  <Printer size={16} /> Gerar Extrato PDF
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'relatorio_investidor' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="glass-panel p-8 rounded-3xl border-white/10">
            <h3 className="text-xl font-black text-gold-primary uppercase tracking-wider mb-6 flex items-center gap-4">
              <PieChart size={24} /> Relatório por Investidor
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr className="text-[10px] font-black uppercase text-white/40 tracking-widest">
                    <th className="py-4 px-4 text-left">Investidor</th>
                    <th className="py-4 px-4 text-right">Capital Inicial</th>
                    <th className="py-4 px-4 text-right">Total AUMENTO</th>
                    <th className="py-4 px-4 text-right">Total Juros</th>
                    <th className="py-4 px-4 text-right">Total IAC</th>
                    <th className="py-4 px-4 text-right">Total Saques</th>
                    <th className="py-4 px-4 text-right text-gold-primary">Resultado Final</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {projects.map(proj => {
                    const { totals: t } = calculateProjectFullHistory(proj, records.filter(r => r.investimento_id === proj.id));
                    return (
                      <tr key={proj.id} className="hover:bg-white/[0.02] transition-all">
                        <td className="py-4 px-4">
                          <p className="font-black text-white">{proj.investidores?.nome || 'N/A'}</p>
                          <p className="text-[10px] text-white/40">{proj.titulo}</p>
                        </td>
                        <td className="py-4 px-4 text-right font-bold text-white">{formatarKz(proj.capital_inicial)}</td>
                        <td className="py-4 px-4 text-right font-bold text-emerald-400">{formatarKz(t.aumento)}</td>
                        <td className="py-4 px-4 text-right font-bold text-blue-400">{formatarKz(t.juros)}</td>
                        <td className="py-4 px-4 text-right font-bold text-red-400">{formatarKz(t.iac)}</td>
                        <td className="py-4 px-4 text-right font-bold text-red-400">{formatarKz(t.saque + t.multa)}</td>
                        <td className="py-4 px-4 text-right font-black text-gold-primary text-lg">{formatarKz(t.resultado)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'consulta_investidor' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="glass-panel p-8 rounded-3xl border-white/10">
            <h3 className="text-xl font-black text-gold-primary uppercase tracking-wider mb-6 flex items-center gap-4">
              <UserCheck size={24} /> Área do Investidor - Consulta de Extrato
            </h3>
            {searchResult && (() => {
              const proj = projects.find(p => p.investidor_id === searchResult.id);
              if (!proj) return <p className="text-[10px] uppercase font-black opacity-20 text-center py-10 tracking-widest italic">Nenhuma Aplicação Ativa Detectada</p>;
              
              const { totals: t } = calculateProjectFullHistory(proj, records.filter(r => r.investimento_id === proj.id));

              return (
                <div className="space-y-6">
                  <div className="flex items-center justify-between bg-gold-primary/10 p-6 rounded-2xl border border-gold-primary/20">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gold-primary/20 rounded-2xl flex items-center justify-center">
                        <Users className="text-gold-primary" size={32} />
                      </div>
                      <div>
                        <p className="text-2xl font-black text-white">{searchResult.nome}</p>
                        <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">INV-{searchResult.id}</p>
                      </div>
                    </div>
                    <button onClick={() => { setExtratoInvestor(proj); setShowExtratoModal(true); }} className="bg-gold-primary text-bg-deep px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2">
                      <Printer size={18} /> Imprimir Extrato
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white/5 p-6 rounded-[32px] border border-white/5 shadow-inner">
                      <p className="text-[10px] font-black uppercase opacity-40 mb-2 tracking-widest">Capital Base</p>
                      <p className="text-2xl font-black text-white">{formatarKz(proj.capital_inicial)}</p>
                    </div>
                    <div className="bg-white/5 p-6 rounded-[32px] border border-white/5 shadow-inner">
                      <p className="text-[10px] font-black uppercase text-blue-400 mb-2 tracking-widest">Juros Brutos</p>
                      <p className="text-2xl font-black text-blue-400">{formatarKz(t.juros)}</p>
                    </div>
                    <div className="bg-white/5 p-6 rounded-[32px] border border-white/5 shadow-inner">
                      <p className="text-[10px] font-black uppercase text-red-500 mb-2 tracking-widest">Dedução IAC (10%)</p>
                      <p className="text-2xl font-black text-red-500">{formatarKz(t.iac)}</p>
                    </div>
                    <div className="bg-gold-primary/10 p-6 rounded-[32px] border border-gold-primary/20 shadow-2xl gold-glow">
                      <p className="text-[10px] font-black uppercase text-gold-primary mb-2 tracking-widest italic">Saldo Disponível</p>
                      <p className="text-3xl font-black text-gold-gradient">{formatarKz(t.resultado)}</p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {activeTab === 'investors' && (
        <div className="glass-panel p-8 rounded-[40px] border-white/5 overflow-hidden shadow-2xl animate-in fade-in duration-500">
          <table className="w-full text-white font-mono-table">
            <thead>
              <tr className="text-left text-[10px] font-black uppercase tracking-widest text-gold-primary/40 border-b border-white/5">
                <th className="pb-6 pl-4">Titular Responsável</th>
                <th className="pb-6">ID</th>
                <th className="pb-6">BI / NIF Oficial</th>
                <th className="pb-6">Telemóvel</th>
                <th className="pb-6 text-right pr-4">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredInvestors.map(inv => (
                <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-6 pl-4">
                    <div className="flex items-center gap-4">
                      {inv.foto ? (
                        <img src={inv.foto} className="w-12 h-12 rounded-2xl object-cover border border-white/10" />
                      ) : (
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center font-black text-white/20">
                          {inv.nome.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-black text-white">{inv.nome}</p>
                        <p className="text-[10px] text-white/40 uppercase font-black">{inv.profissao || 'Investidor'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="font-black text-gold-primary">INV-{inv.id}</td>
                  <td className="text-white/60 font-medium">{inv.nif}</td>
                  <td className="text-white/60 font-medium">{inv.telefone}</td>
                  <td className="pr-4">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleEditInvestor(inv)} className="p-3 bg-white/5 rounded-xl text-white/40 hover:text-gold-primary hover:bg-gold-primary/10 transition-all">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDeleteInvestor(inv.id)} className="p-3 bg-white/5 rounded-xl text-white/40 hover:text-red-500 hover:bg-red-500/10 transition-all">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'expired_contracts' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="glass-panel p-8 rounded-3xl border-white/10">
            <h3 className="text-xl font-black text-red-400 uppercase tracking-wider mb-6 flex items-center gap-4">
              <FileWarning size={24} /> Contratos Terminados
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr className="text-[10px] font-black uppercase text-white/40 tracking-widest">
                    <th className="py-4 px-6 text-left">Investidor</th>
                    <th className="py-4 px-6 text-left">Título</th>
                    <th className="py-4 px-6 text-center">Início</th>
                    <th className="py-4 px-6 text-center">Término</th>
                    <th className="py-4 px-6 text-right">Montante</th>
                    <th className="py-4 px-6 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {projects.filter(p => p.data_fim && new Date(p.data_fim) < new Date()).map(proj => (
                      <tr key={proj.id} className="hover:bg-white/[0.02] transition-all">
                        <td className="py-4 px-6 font-black text-white">{proj.investidores?.nome || 'N/A'}</td>
                        <td className="py-4 px-6 text-white/60">{proj.titulo}</td>
                        <td className="py-4 px-6 text-center text-white/40">{new Date(proj.data_inicio).toLocaleDateString('pt-AO')}</td>
                        <td className="py-4 px-6 text-center text-red-400 font-bold">{new Date(proj.data_fim!).toLocaleDateString('pt-AO')}</td>
                        <td className="py-4 px-6 text-right font-black text-gold-primary">{formatarKz(proj.capital_inicial)}</td>
                        <td className="py-4 px-6 text-center">
                          <span className="bg-red-500/10 text-red-500 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-red-500/20">Finalizado</span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showUnifiedModal && (
        <div className="fixed inset-0 bg-bg-deep/95 backdrop-blur-3xl z-[100] flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-7xl rounded-[50px] overflow-hidden border-gold-primary/20 gold-glow flex flex-col max-h-[96vh] shadow-[0_0_150px_rgba(212,175,55,0.1)] transition-all animate-in zoom-in duration-300">
            <div className="p-8 border-b border-white/10 flex justify-between items-center bg-white/5 relative overflow-hidden">
                <div className="absolute right-32 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
                    <img src="/logo_amazing.png" alt="Amazing Corp Logo" className="h-20" />
                </div>
                <div className="flex items-center gap-6 relative z-10">
                    <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
                        <img src="/logo_amazing.png" alt="Logo Amazing Corp" className="h-10" />
                    </div>
                    <div>
                        <h3 className="text-3xl font-black text-gold-gradient italic tracking-widest uppercase">{isEditing ? 'Editar Investidor' : 'Cadastro do Investidor'}</h3>
                        <div className="flex gap-4 mt-4">
                            <button onClick={() => setModalTab('perfil')} className={`text-[10px] font-black uppercase tracking-widest pb-3 transition-all border-b-2 flex items-center gap-2 ${modalTab === 'perfil' ? 'text-gold-primary border-gold-primary' : 'text-white/30 border-transparent hover:text-white/50'}`}>
                               <UserPlus size={14} /> Dados Pessoais
                            </button>
                            <button onClick={() => setModalTab('aplicacao')} className={`text-[10px] font-black uppercase tracking-widest pb-3 transition-all border-b-2 flex items-center gap-2 ${modalTab === 'aplicacao' ? 'text-gold-primary border-gold-primary' : 'text-white/30 border-transparent hover:text-white/50'}`}>
                               <ShieldCheck size={14} /> 2. Estratégia de Rendimento
                            </button>
                        </div>
                    </div>
                </div>
                <button onClick={() => { setShowUnifiedModal(false); setIsEditing(false); }} className="p-4 bg-white/5 rounded-2xl text-white/40 hover:text-white transition-all hover:rotate-90 shadow-lg relative z-10"><X size={26} /></button>
            </div>
            
            <form noValidate onSubmit={handleUnifiedRegistration} className="flex-1 overflow-y-auto custom-scrollbar p-10 bg-gradient-to-b from-transparent to-white/[0.01]">
               <div className={modalTab !== 'perfil' ? 'hidden' : ''}>
                   <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

                      {/* Foto do Titular */}
                      <div className="flex flex-col items-center gap-5">
                         <div className="bg-white/5 p-6 rounded-[40px] border-2 border-dashed border-white/10 flex flex-col items-center gap-4 cursor-pointer hover:border-gold-primary transition-all relative aspect-square w-full justify-center group overflow-hidden shadow-[inset_0_10px_40px_rgba(0,0,0,0.4)]">
                            <input type="file" accept="image/*" onChange={handlePhotoChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                            {investorPhoto ? (
                                <img src={investorPhoto} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform" />
                            ) : (
                                <>
                                  <Camera size={48} className="text-white/10 group-hover:text-gold-primary transition-colors" />
                                  <span className="text-[9px] font-black uppercase tracking-widest text-white/30 text-center">Foto do<br/>Titular</span>
                                </>
                            )}
                       </div>
                      </div>

                      <div className="md:col-span-3 space-y-8">
                        <div>
                          <span className="text-[9px] font-black uppercase text-gold-primary/40 tracking-[0.3em] block mb-4 border-l-2 border-gold-primary/20 pl-3">I. IDENTIFICAÇÃO CIVIL</span>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 text-white">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase opacity-40 ml-3 tracking-[0.2em]">ID do Titular</label>
                                <div className="w-full bg-gold-primary/10 border-2 border-gold-primary/30 rounded-2xl px-5 py-4 text-gold-primary font-black text-lg outline-none shadow-[0_0_20px_rgba(212,175,55,0.1)] flex items-center justify-center italic">
                                    {editingInvestor?.numero_sequencial ? `Nº INV-${editingInvestor.numero_sequencial.toString().padStart(3, '0')}/026` : (editingInvestor?.id ? `Nº INV-${editingInvestor.id.substring(0, 8).toUpperCase()}/026` : 'Nº INV-PENDENTE/026')}
                                </div>
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                 <label className="text-[10px] font-black uppercase opacity-40 ml-3 tracking-[0.2em]">Nome Completo</label>
                                 <input name="nome" required defaultValue={editingInvestor?.nome || ''} placeholder="Nome completo do titular" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 font-bold outline-none focus:border-gold-primary shadow-inner" />
                             </div>
                             <div className="space-y-2">
                                 <label className="text-[10px] font-black uppercase opacity-40 ml-3 tracking-[0.2em]">Nº BI / NIF</label>
                                 <input name="nif" required defaultValue={editingInvestor?.nif || ''} placeholder="00000000LA000" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 font-bold outline-none focus:border-gold-primary shadow-inner" />
                             </div>
                             <div className="space-y-2">
                                 <label className="text-[10px] font-black uppercase opacity-40 ml-3 tracking-[0.2em]">Data de Nascimento</label>
                                 <input name="data_nascimento" type="date" required value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 font-bold outline-none focus:border-gold-primary shadow-inner" />
                             </div>
                             <div className="space-y-2">
                                 <label className="text-[10px] font-black uppercase text-gold-primary ml-3 tracking-[0.2em]">Idade Atual</label>
                                 <div className="w-full h-[62px] bg-gold-primary/5 border border-gold-primary/30 rounded-2xl px-5 py-4 font-black text-gold-primary shadow-inner flex items-center justify-center">
                                   {birthDate ? (
                                     <span className="text-xl font-black text-gold-gradient animate-in fade-in zoom-in duration-500">
                                       {calculateAge(birthDate)} ANOS
                                     </span>
                                   ) : (
                                     <span className="opacity-20 text-[9px] uppercase tracking-widest font-black italic">Aguardando Data...</span>
                                   )}
                                 </div>
                             </div>
                             <div className="space-y-2">
                                 <label className="text-[10px] font-black uppercase opacity-40 ml-3 tracking-[0.2em]">Data de Emissão BI</label>
                                 <input name="data_emissao" type="date" defaultValue={editingInvestor?.data_emissao ? new Date(editingInvestor.data_emissao).toISOString().split('T')[0] : ''} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 font-bold outline-none focus:border-gold-primary shadow-inner" />
                             </div>
                             <div className="space-y-2">
                                 <label className="text-[10px] font-black uppercase opacity-40 ml-3 tracking-[0.2em]">Validade do BI</label>
                                 <input name="data_validade" type="date" defaultValue={editingInvestor?.data_validade ? new Date(editingInvestor.data_validade).toISOString().split('T')[0] : ''} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 font-bold outline-none focus:border-gold-primary shadow-inner" />
                             </div>
                             <div className="space-y-2">
                                 <label className="text-[10px] font-black uppercase opacity-40 ml-3 tracking-[0.2em]">Nacionalidade</label>
                                 <input name="nacionalidade" defaultValue={editingInvestor?.nacionalidade || "Angolana"} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 font-bold outline-none focus:border-gold-primary shadow-inner" />
                             </div>
                             <div className="space-y-2">
                                 <label className="text-[10px] font-black uppercase opacity-40 ml-3 tracking-[0.2em]">Naturalidade</label>
                                 <input name="naturalidade" defaultValue={editingInvestor?.naturalidade || ''} placeholder="Ex: Luanda" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 font-bold outline-none focus:border-gold-primary shadow-inner" />
                             </div>
                             <div className="space-y-2">
                                 <label className="text-[10px] font-black uppercase opacity-40 ml-4 tracking-[0.2em]">Província</label>
                                 <select name="provincia" defaultValue={editingInvestor?.provincia || ''} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 font-bold outline-none focus:border-gold-primary shadow-inner text-white">
                                   <option value="" className="bg-[#0f172a] text-white">-- Selecione a Província --</option>
                                   <option value="Luanda" className="bg-[#0f172a] text-white">Luanda</option>
                                   <option value="Bengo" className="bg-[#0f172a] text-white">Bengo</option>
                                   <option value="Benguela" className="bg-[#0f172a] text-white">Benguela</option>
                                   <option value="Bié" className="bg-[#0f172a] text-white">Bié</option>
                                   <option value="Cabinda" className="bg-[#0f172a] text-white">Cabinda</option>
                                   <option value="Cuando" className="bg-[#0f172a] text-white">Cuando</option>
                                   <option value="Cubango" className="bg-[#0f172a] text-white">Cubango</option>
                                   <option value="Cuanza Norte" className="bg-[#0f172a] text-white">Cuanza Norte</option>
                                   <option value="Cuanza Sul" className="bg-[#0f172a] text-white">Cuanza Sul</option>
                                   <option value="Cunene" className="bg-[#0f172a] text-white">Cunene</option>
                                   <option value="Huambo" className="bg-[#0f172a] text-white">Huambo</option>
                                   <option value="Huíla" className="bg-[#0f172a] text-white">Huíla</option>
                                   <option value="Icolo e Bengo" className="bg-[#0f172a] text-white">Icolo e Bengo</option>
                                   <option value="Lunda Norte" className="bg-[#0f172a] text-white">Lunda Norte</option>
                                   <option value="Lunda Sul" className="bg-[#0f172a] text-white">Lunda Sul</option>
                                   <option value="Malanje" className="bg-[#0f172a] text-white">Malanje</option>
                                   <option value="Moxico" className="bg-[#0f172a] text-white">Moxico</option>
                                   <option value="Moxico Leste" className="bg-[#0f172a] text-white">Moxico Leste</option>
                                   <option value="Namibe" className="bg-[#0f172a] text-white">Namibe</option>
                                   <option value="Uíge" className="bg-[#0f172a] text-white">Uíge</option>
                                   <option value="Zaire" className="bg-[#0f172a] text-white">Zaire</option>
                                </select>
                            </div>
                             <div className="space-y-2">
                                 <label className="text-[10px] font-black uppercase opacity-40 ml-3 tracking-[0.2em]">Estado Civil</label>
                                 <select name="estado_civil" defaultValue={editingInvestor?.estado_civil || ''} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 font-bold outline-none focus:border-gold-primary shadow-inner text-white">
                                    <option value="" className="bg-[#0f172a] text-white">-- Selecione --</option>
                                    <option value="Solteiro(a)" className="bg-[#0f172a] text-white">Solteiro(a)</option>
                                    <option value="Casado(a)" className="bg-[#0f172a] text-white">Casado(a)</option>
                                    <option value="Divorciado(a)" className="bg-[#0f172a] text-white">Divorciado(a)</option>
                                    <option value="Viúvo(a)" className="bg-[#0f172a] text-white">Viúvo(a)</option>
                                 </select>
                             </div>
                             <div className="space-y-2">
                                 <label className="text-[10px] font-black uppercase text-gold-primary ml-3 tracking-[0.2em]">Status do Investidor</label>
                                 <select name="status" defaultValue={editingInvestor?.status || 'Ativo'} className="w-full bg-gold-primary/5 border border-gold-primary/20 rounded-2xl px-5 py-4 font-black outline-none focus:border-gold-primary shadow-inner text-gold-primary">
                                    <option value="Ativo" className="bg-[#0f172a] text-white">Ativo</option>
                                    <option value="Pendente" className="bg-[#0f172a] text-white">Pendente</option>
                                    <option value="Suspenso" className="bg-[#0f172a] text-white">Suspenso</option>
                                    <option value="Inativo" className="bg-[#0f172a] text-white">Inativo</option>
                                 </select>
                             </div>
                             <div className="space-y-2">
                                 <label className="text-[10px] font-black uppercase opacity-40 ml-3 tracking-[0.2em]">Tipo de Investidor</label>
                                 <select name="tipo_investidor" defaultValue={editingInvestor?.tipo_investidor || 'Particular'} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 font-bold outline-none focus:border-gold-primary shadow-inner text-white">
                                    <option value="Particular" className="bg-[#0f172a] text-white">Particular</option>
                                    <option value="Empresa" className="bg-[#0f172a] text-white">Empresa</option>
                                    <option value="Institucional" className="bg-[#0f172a] text-white">Institucional</option>
                                 </select>
                             </div>
                             <div className="md:col-span-2 space-y-2">
                                 <label className="text-[10px] font-black uppercase opacity-40 ml-3 tracking-[0.2em]">Morada Completa</label>
                                 <input name="morada" defaultValue={editingInvestor?.morada || ''} placeholder="Bairro, Rua, Nº de Casa..." className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 font-bold outline-none focus:border-gold-primary shadow-inner" />
                             </div>
                          </div>
                        </div>

                        <div>
                          <span className="text-[9px] font-black uppercase text-gold-primary/40 tracking-[0.3em] block mb-4 border-l-2 border-gold-primary/20 pl-3">II. DADOS ACADÉMICOS & PROFISSIONAIS</span>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-white">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase opacity-40 ml-3 tracking-[0.2em]">Escolaridade</label>
                              <select name="escolaridade" defaultValue={editingInvestor?.escolaridade || ''} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 font-bold outline-none focus:border-gold-primary shadow-inner text-white">
                                <option value="" className="bg-[#0f172a]">-- Selecione --</option>
                                <option value="Ensino Primário" className="bg-[#0f172a]">Ensino Primário</option>
                                <option value="Ensino Secundário" className="bg-[#0f172a]">Ensino Secundário</option>
                                <option value="Ensino Médio" className="bg-[#0f172a]">Ensino Médio</option>
                                <option value="Bacharel" className="bg-[#0f172a]">Bacharel</option>
                                <option value="Licenciatura" className="bg-[#0f172a]">Licenciatura</option>
                                <option value="Mestrado" className="bg-[#0f172a]">Mestrado</option>
                                <option value="Doutoramento" className="bg-[#0f172a]">Doutoramento</option>
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase opacity-40 ml-3 tracking-[0.2em]">Curso Académico</label>
                              <select name="curso" defaultValue={editingInvestor?.curso || ''} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 font-bold outline-none focus:border-gold-primary shadow-inner text-white">
                                <option value="" className="bg-[#0f172a]">-- Selecione --</option>
                                <option value="Economia" className="bg-[#0f172a]">Economia</option>
                                <option value="Gestão de Empresas" className="bg-[#0f172a]">Gestão de Empresas</option>
                                <option value="Contabilidade e Auditoria" className="bg-[#0f172a]">Contabilidade e Auditoria</option>
                                <option value="Direito" className="bg-[#0f172a]">Direito</option>
                                <option value="Engenharia de Informática" className="bg-[#0f172a]">Engenharia de Informática</option>
                                <option value="Engenharia Civil" className="bg-[#0f172a]">Engenharia Civil</option>
                                <option value="Relações Internacionais" className="bg-[#0f172a]">Relações Internacionais</option>
                                <option value="Medicina" className="bg-[#0f172a]">Medicina</option>
                                <option value="Psicologia" className="bg-[#0f172a]">Psicologia</option>
                                <option value="Outro" className="bg-[#0f172a]">Outro / Especialização</option>
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase opacity-40 ml-3 tracking-[0.2em]">Profissão / Cargo</label>
                              <input name="profissao" defaultValue={editingInvestor?.profissao || ''} placeholder="Ex: Gestor Bancário" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 font-bold outline-none focus:border-gold-primary shadow-inner" />
                            </div>
                          </div>
                        </div>

                        <div>
                          <span className="text-[9px] font-black uppercase text-gold-primary/40 tracking-[0.3em] block mb-4 border-l-2 border-gold-primary/20 pl-3">III. CONTACTOS & ACESSO AO PORTAL</span>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-white">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase opacity-40 ml-3 tracking-[0.2em]">Telefone Principal</label>
                              <input name="telefone" required defaultValue={editingInvestor?.telefone || ''} placeholder="+244 9XX XXX XXX" onInput={(e: React.FormEvent<HTMLInputElement>) => { const t = e.currentTarget; const v = t.value.replace(/[^0-9+\s]/g, ''); if (v.length > 0 && !v.startsWith('+')) { t.classList.add('border-red-500'); } else { t.classList.remove('border-red-500'); } t.value = v; }} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 font-bold outline-none focus:border-gold-primary shadow-inner" />
                              <span className="text-[8px] font-black uppercase opacity-30 ml-3">Formato: +244 9XX XXX XXX</span>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase opacity-40 ml-3 tracking-[0.2em]">Telefone Alternativo</label>
                              <input name="telefone_alternativo" defaultValue={editingInvestor?.telefone_alternativo || ''} placeholder="+244 9XX XXX XXX" onInput={(e: React.FormEvent<HTMLInputElement>) => { const t = e.currentTarget; const v = t.value.replace(/[^0-9+\s]/g, ''); if (v.length > 0 && !v.startsWith('+')) { t.classList.add('border-red-500'); } else { t.classList.remove('border-red-500'); } t.value = v; }} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 font-bold outline-none focus:border-gold-primary shadow-inner" />
                              <span className="text-[8px] font-black uppercase opacity-30 ml-3">Formato: +244 9XX XXX XXX</span>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase opacity-40 ml-3 tracking-[0.2em]">WhatsApp</label>
                              <input name="whatsapp" defaultValue={editingInvestor?.whatsapp || ''} placeholder="+244 9XX XXX XXX" onInput={(e: React.FormEvent<HTMLInputElement>) => { const t = e.currentTarget; const v = t.value.replace(/[^0-9+\s]/g, ''); if (v.length > 0 && !v.startsWith('+')) { t.classList.add('border-red-500'); } else { t.classList.remove('border-red-500'); } t.value = v; }} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 font-bold outline-none focus:border-green-500 shadow-inner" />
                              <span className="text-[8px] font-black uppercase opacity-30 ml-3">Formato: +244 9XX XXX XXX</span>
                            </div>
                            <div className="space-y-2">
                               <label className="text-[9px] font-black uppercase text-gold-primary tracking-[0.2em] ml-2 block">Data de Inscrição</label>
                               <input name="data_inscricao" type="date" defaultValue={editingInvestor?.data_inscricao ? new Date(editingInvestor.data_inscricao).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]} className="w-full bg-gold-primary/10 border border-gold-primary/30 rounded-2xl px-5 py-4 text-gold-primary font-black text-sm outline-none focus:border-gold-primary shadow-inner" />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                              <label className="text-[10px] font-black uppercase opacity-40 ml-3 tracking-[0.2em]">E-mail Oficial</label>
                              <input name="email" type="email" defaultValue={editingInvestor?.email || ''} placeholder="exemplo@dominio.com" onInput={(e: React.FormEvent<HTMLInputElement>) => { const t = e.currentTarget; const valid = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(t.value); if (t.value.length > 0 && !valid) { t.classList.add('border-red-500'); } else { t.classList.remove('border-red-500'); } }} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 font-bold outline-none focus:border-gold-primary shadow-inner" />
                              <span className="text-[8px] font-black uppercase opacity-30 ml-3">Formato: exemplo@dominio.com</span>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-gold-primary uppercase tracking-[0.2em] ml-3 block">Senha do Portal</label>
                              <div className="relative group">
                                <input 
                                  name="password" 
                                  type={showPassword ? "text" : "password"} 
                                  required={!isEditing} 
                                  defaultValue={editingInvestor?.password || ''} 
                                  placeholder={isEditing ? "Manter ou Nova Senha" : "Nova Senha"} 
                                  className="w-full bg-gold-primary/5 border border-gold-primary/30 rounded-2xl px-5 py-4 font-bold outline-none focus:border-gold-primary shadow-inner pr-14" 
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gold-primary/40 hover:text-gold-primary transition-all rounded-xl hover:bg-gold-primary/10"
                                  title={showPassword ? "Ocultar Senha" : "Ver Senha"}
                                >
                                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                              </div>
                              <span className="text-[8px] font-black uppercase opacity-30 ml-3">Mínimo 4 caracteres</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <span className="text-[9px] font-black uppercase text-gold-primary/40 tracking-[0.3em] block mb-4 border-l-2 border-gold-primary/20 pl-3">IV. COORDENADAS BANCÁRIAS PARA RESGATE</span>
                          <datalist id="bancos_angola">
                            <option value="BAI" /><option value="BFA" /><option value="BIC" /><option value="BNI" />
                            <option value="BCI" /><option value="BMA" /><option value="BPC" /><option value="SOL" />
                            <option value="KEVE" /><option value="VTB" /><option value="ATLANTICO" /><option value="ECONOMICO" />
                            <option value="STANDARD BANK" /><option value="BIR" /><option value="SBA" /><option value="FINIBANCO" /><option value="BCA" />
                          </datalist>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-white">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase opacity-40 ml-3 tracking-[0.2em]">Banco Principal</label>
                              <input name="banco_principal" list="bancos_angola" defaultValue={editingInvestor?.banco_principal || ''} placeholder="Selecione o banco" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 font-bold outline-none focus:border-gold-primary shadow-inner" />
                             </div>
                             <div className="md:col-span-2 space-y-2">
                               <label className="text-[10px] font-black uppercase opacity-40 ml-3 tracking-[0.2em]">IBAN Principal</label>
                               <input
                                 name="iban_principal"
                                 defaultValue={editingInvestor?.iban_principal || ''}
                                 placeholder="AO06.XXXX.XXXX.XXXX.XXXX.XXXX.X"
                                 maxLength={31}
                                 onInput={(e: React.FormEvent<HTMLInputElement>) => {
                                   const t = e.currentTarget;
                                   const raw = t.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 25);
                                   if (raw.length > 0 && !raw.startsWith('AO')) {
                                     t.setCustomValidity('IBAN deve começar com AO');
                                     t.classList.add('border-red-500');
                                   } else {
                                     t.setCustomValidity('');
                                     t.classList.remove('border-red-500');
                                   }
                                   t.value = raw.match(/.{1,4}/g)?.join('.') || raw;
                                 }}
                                 className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 font-bold outline-none focus:border-gold-primary shadow-inner tracking-wider"
                               />
                               <span className="text-[8px] font-black uppercase opacity-30 ml-3">Ex: AO06.XXXX.XXXX.XXXX.XXXX.XXXX.X</span>
                             </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase opacity-40 ml-3 tracking-[0.2em]">Banco Alternativo</label>
                              <input name="banco_alternativo" list="bancos_angola" defaultValue={editingInvestor?.banco_alternativo || ''} placeholder="Selecione o banco" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 font-bold outline-none focus:border-gold-primary shadow-inner" />
                             </div>
                             <div className="md:col-span-2 space-y-2">
                               <label className="text-[10px] font-black uppercase opacity-40 ml-3 tracking-[0.2em]">IBAN Alternativo</label>
                               <input
                                 name="iban_alternativo"
                                 defaultValue={editingInvestor?.iban_alternativo || ''}
                                 placeholder="AO06.XXXX.XXXX.XXXX.XXXX.XXXX.X"
                                 maxLength={31}
                                 onInput={(e: React.FormEvent<HTMLInputElement>) => {
                                   const t = e.currentTarget;
                                   const raw = t.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 25);
                                   if (raw.length > 0 && !raw.startsWith('AO')) {
                                     t.setCustomValidity('IBAN deve começar com AO');
                                     t.classList.add('border-red-500');
                                   } else {
                                     t.setCustomValidity('');
                                     t.classList.remove('border-red-500');
                                   }
                                   t.value = raw.match(/.{1,4}/g)?.join('.') || raw;
                                 }}
                                 className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 font-bold outline-none focus:border-gold-primary shadow-inner tracking-wider"
                               />
                               <span className="text-[8px] font-black uppercase opacity-30 ml-3">Ex: AO06.XXXX.XXXX.XXXX.XXXX.XXXX.X</span>
                             </div>
                          </div>
                        </div>

                        <div className="flex gap-5 pt-2">
                          <button type="submit" onClick={() => setIsOnlyInvestor(true)} className="flex-1 bg-white/5 text-gold-primary border border-gold-primary/30 py-5 rounded-3xl font-black text-[12px] uppercase tracking-[0.3em] hover:bg-gold-primary/10 transition-all flex items-center justify-center gap-3">
                            <UserPlus size={18} /> Registrar Apenas Investidor
                          </button>
                          <button type="button" onClick={() => { setIsOnlyInvestor(false); setModalTab('aplicacao'); }} className="flex-1 bg-gold-primary text-bg-deep py-5 rounded-3xl font-black text-[12px] uppercase tracking-[0.3em] hover:scale-[1.02] active:scale-[0.98] shadow-[0_15px_40px_rgba(212,175,55,0.2)] transition-all flex items-center justify-center gap-3">
                            Configurar Estratégia Financeira <ArrowRight size={18} />
                          </button>
                        </div>

                      </div>
                   </div>
               </div>

               <div className={modalTab !== 'aplicacao' ? 'hidden' : ''}>
                  <div className="space-y-12 animate-in slide-in-from-right duration-500">
                     <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase opacity-50 text-white ml-2 tracking-widest">Capital Inicial</label>
                            <div className="relative">
                                <input 
                                  type="text" 
                                  placeholder="0,00" 
                                  value={initialCapital ? new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(initialCapital) : ''} 
                                  onChange={(e) => {
                                      const rawValue = e.target.value.replace(/\D/g, '');
                                      setInitialCapital(Number(rawValue) / 100);
                                  }} 
                                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-6 pr-16 py-5 text-white font-black text-lg outline-none focus:border-gold-primary shadow-inner" 
                                />
                                <input type="hidden" name="capital_inicial" value={initialCapital || ''} />
                                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-white/40 font-black tracking-widest">Kz</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase opacity-50 text-white ml-2 tracking-widest">Data de inicio</label>
                            <input name="data_inicio" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-white/5 border border-white/20 rounded-2xl px-6 py-5 text-white font-bold outline-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase opacity-50 text-white ml-2 tracking-widest">Duração em Meses</label>
                            <input name="num_meses" type="number" value={numMonths} onChange={(e) => setNumMonths(Number(e.target.value))} className="w-full bg-gold-primary/10 border-gold-primary/30 border-2 rounded-2xl px-6 py-5 text-gold-primary font-black text-lg outline-none shadow-sm" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase opacity-50 text-white ml-2 tracking-widest">TIPOS DE TAXAS</label>
                            <div className="grid grid-cols-2 gap-1 p-1 bg-white/5 rounded-2xl border border-white/10 h-[68px] shadow-inner">
                                <button type="button" onClick={() => setSelectedRateType('simples')} className={`rounded-xl font-black text-[10px] uppercase transition-all ${selectedRateType === 'simples' ? 'bg-gold-primary text-bg-deep shadow-2xl' : 'text-white/30 hover:text-white/50'}`}>SIMPLES<br/>3,5%</button>
                                <button type="button" onClick={() => setSelectedRateType('composto')} className={`rounded-xl font-black text-[10px] uppercase transition-all ${selectedRateType === 'composto' ? 'bg-gold-primary text-bg-deep shadow-2xl' : 'text-white/30 hover:text-white/50'}`}>COMPOSTO<br/>5%</button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase opacity-50 text-white ml-2 tracking-widest">Periodicidade</label>
                            <select value={periodicidade} onChange={(e) => setPeriodicidade(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-[21px] text-white font-bold outline-none focus:border-gold-primary shadow-inner">
                                <option value="Mensal" className="bg-[#0f172a]">Mensal</option>
                                <option value="Trimestral" className="bg-[#0f172a]">Trimestral</option>
                                <option value="Semestral" className="bg-[#0f172a]">Semestral</option>
                                <option value="Anual" className="bg-[#0f172a]">Anual</option>
                            </select>
                        </div>
                        <div className="space-y-2 text-white">
                            <label className="text-[10px] font-black uppercase opacity-50 ml-2 tracking-widest">Identificador de Título</label>
                            <input name="titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Denominação Bancária" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 font-bold outline-none focus:border-gold-primary shadow-inner placeholder:opacity-20" />
                        </div>
                     </div>

                     <div className="glass-panel rounded-[50px] border-white/10 overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.5)]">
                        <div className="bg-[#002855] text-white p-10 flex justify-between items-center relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gold-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            <div className="relative z-10 flex items-center gap-10">
                                <div>
                                    <h4 className="font-black text-[13px] uppercase tracking-[0.5em] mb-3">Mapa Estratégico de Fluxo Patrimonial</h4>
                                    <div className="flex gap-4 items-center">
                                        <span className="text-[10px] font-black uppercase bg-gold-primary text-bg-deep px-4 py-1.5 rounded-full shadow-2xl tracking-widest">Data do fim do contrato</span>
                                        <span className="text-[13px] font-black text-white italic tracking-[0.2em]">{new Date(calculatedEndDate).toLocaleDateString('pt-AO', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right flex flex-col items-end gap-1">
                                <span className="text-[10px] font-black uppercase opacity-40 tracking-[0.3em]">Ambiente de Simulação</span>
                                <div className="flex items-center gap-2 text-emerald-400 font-black uppercase text-[12px] tracking-widest">
                                   <CheckCircle2 size={16} /> Planejamento Seguro
                                </div>
                            </div>
                        </div>
                        
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="min-w-[2500px] border-collapse">
                                    <thead className="bg-[#002855]/95 text-white/30 sticky top-0 z-10">
                                        <tr className="text-[12px] font-black uppercase tracking-[0.3em] border-b border-white/5">
                                            <th className="py-10 px-6 text-center border-r border-white/5 w-32 font-display">Período</th>
                                            <th className="py-10 px-6 text-center border-r border-white/5 w-48">Saldo Inicial</th>
                                            <th className="py-10 px-6 text-center border-r border-white/5 w-[450px]">Movimentações</th>
                                            <th className="py-10 px-6 text-center border-r border-white/5 w-80 text-red-400 font-bold">Multa</th>
                                            <th className="py-10 px-6 text-center border-r border-white/5 w-80 text-emerald-400 font-bold">Juro Bruto</th>
                                            <th className="py-10 px-6 text-center border-r border-white/5 w-80 text-gold-primary font-bold">Comissão</th>
                                            <th className="py-10 px-6 text-center border-r border-white/5 w-80 text-rose-400 font-bold">IAC</th>
                                            <th className="py-10 px-6 text-center w-80 bg-gold-primary/10 text-gold-primary font-black shadow-inner">Saldo Final</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-white divide-y divide-white/[0.02]">
                                        {previewCalculated.map((m, idx) => (
                                            <tr key={idx} className="hover:bg-white/[0.04] transition-all h-36 group">
                                                {/* 1. Mês */}
                                                <td className="px-6 border-r border-white/5 text-center">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-[14px] font-black text-white tracking-widest uppercase font-display">{m.mesLabel}</span>
                                                        <span className="text-[8px] font-black opacity-30 uppercase tracking-[0.2em]">Ciclo {idx + 1}</span>
                                                    </div>
                                                </td>

                                                {/* 2. Saldo Inicial */}
                                                <td className="px-8 border-r border-white/5 text-center bg-white/[0.01]">
                                                   <span className="text-[12px] font-black text-slate-400 font-display">{formatarKz(m.saldoInicial)}</span>
                                                   <span className="text-[12px] font-black uppercase opacity-10 block mt-1">Abertura</span>
                                                </td>

                                                {/* 3. Movimentações (INPUTS) */}
                                                <td className="px-6 border-r border-white/5">
                                                    <div className="flex gap-4 justify-center items-center">
                                                        <div className="flex flex-col gap-2 flex-1 min-w-[150px]">
                                                            <span className="text-[12px] font-black uppercase text-emerald-400 pl-1 tracking-widest text-center opacity-40">Depósito</span>
                                                            <input type="number" value={m.aumento} onChange={(e) => updateModalRow(idx, 'aumento', e.target.value)} className="w-full bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 rounded-xl px-5 py-4 text-center font-black text-[13px] outline-none focus:border-emerald-500 transition-all font-display" />
                                                        </div>
                                                        <div className="flex flex-col gap-2 flex-1 min-w-[150px]">
                                                            <span className="text-[12px] font-black uppercase text-red-500 pl-1 tracking-widest text-center opacity-40">Saque</span>
                                                            <input type="number" value={m.saque} onChange={(e) => updateModalRow(idx, 'saque', e.target.value)} className="w-full bg-red-500/5 border border-red-500/10 text-red-400 rounded-xl px-5 py-4 text-center font-black text-[13px] outline-none focus:border-red-500 transition-all font-display" />
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* 4. Multa */}
                                                <td className="px-6 border-r border-white/5">
                                                    <div className="flex flex-col gap-2">
                                                        <span className="text-[12px] font-black uppercase text-slate-500 tracking-widest text-center opacity-40">Multa</span>
                                                        <input type="number" value={m.multa} onChange={(e) => updateModalRow(idx, 'multa', e.target.value)} className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-5 py-4 text-center font-black text-[13px] outline-none focus:border-white/30 transition-all font-display" />
                                                    </div>
                                                </td>

                                                {/* 5. Juro Bruto */}
                                                <td className="px-6 border-r border-white/5 bg-emerald-500/[0.01]">
                                                    <div className="flex flex-col gap-2">
                                                        <span className="text-[12px] font-black uppercase text-emerald-400/50 tracking-widest text-center">Juro Bruto</span>
                                                        <input type="number" value={m.jurosBruto} onChange={(e) => updateModalRow(idx, 'jurosBruto', e.target.value)} className="w-full bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 rounded-xl px-5 py-4 text-center font-black text-[13px] outline-none focus:border-emerald-400 transition-all font-display shadow-lg" />
                                                    </div>
                                                </td>

                                                {/* 6. Comissão */}
                                                <td className="px-6 border-r border-white/5">
                                                    <div className="flex flex-col gap-2">
                                                        <span className="text-[12px] font-black uppercase text-gold-primary/50 tracking-widest text-center">Comissão</span>
                                                        <input type="number" value={m.comissao} onChange={(e) => updateModalRow(idx, 'comissao', e.target.value)} className="w-full bg-gold-primary/5 border border-gold-primary/10 text-gold-primary rounded-xl px-5 py-4 text-center font-black text-[13px] outline-none focus:border-gold-primary transition-all font-display" />
                                                    </div>
                                                </td>

                                                {/* 7. IAC */}
                                                <td className="px-6 border-r border-white/5">
                                                    <div className="flex flex-col gap-2">
                                                        <span className="text-[12px] font-black uppercase text-rose-400/50 tracking-widest text-center">IAC</span>
                                                        <input type="number" value={m.iac} onChange={(e) => updateModalRow(idx, 'iac', e.target.value)} className="w-full bg-rose-500/5 border border-rose-500/10 text-rose-400 rounded-xl px-5 py-4 text-center font-black text-[13px] outline-none focus:border-rose-400 transition-all font-display" />
                                                    </div>
                                                </td>

                                                {/* 8. Saldo Final */}
                                                <td className={`px-8 text-center ${idx === previewCalculated.length - 1 ? 'bg-gold-primary/20 animate-pulse border-2 border-gold-primary/50' : 'bg-gold-primary/5'}`}>
                                                   <span className={`text-[15px] font-black font-display ${idx === previewCalculated.length - 1 ? 'text-gold-primary' : 'text-white/90'}`}>{formatarKz(m.final)}</span>
                                                   <span className="text-[12px] font-black uppercase opacity-20 block mt-1 tracking-widest">Fechamento</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Resumo Estratégico de Performance - Layout VIP Reordenado */}
                            <div className="flex flex-col lg:flex-row gap-6 p-8 bg-white/[0.01]">
                               {/* SALDO LÍQUIDO (Destaque) */}
                               <div className="lg:w-1/3 glass-panel p-8 rounded-[35px] border border-gold-primary/30 relative overflow-hidden group hover:border-gold-primary transition-all gold-glow bg-gold-primary/5">
                                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                                  <Briefcase size={80} className="text-gold-primary" />
                                </div>
                                <p className="text-[11px] font-black text-gold-primary uppercase tracking-[0.4em] mb-4 italic flex items-center gap-2">
                                  <ShieldCheck size={14} /> Saldo Líquido Parcial
                                </p>
                                <h3 className="text-4xl font-black text-white tracking-tighter italic pb-4 font-mono-table drop-shadow-2xl">
                                  {formatarKz(previewCalculated[previewCalculated.length - 1]?.final || 0)}
                                </h3>
                                <div className="flex items-center gap-3 mt-4">
                                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
                                  <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest italic">Património Projetado</span>
                                </div>
                              </div>

                              {/* Grelha de Indicadores de Fluxo */}
                              <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-4">
                                 {/* 1. Depósito */}
                                 <div className="glass-panel p-6 rounded-[25px] border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all flex flex-col justify-center">
                                    <span className="text-[9px] font-black uppercase text-emerald-400 pl-1 tracking-widest opacity-40 block mb-2 flex items-center gap-2">
                                       <ArrowUpRight size={12} /> Total Depósitos
                                    </span>
                                    <span className="text-xl font-black text-emerald-500 font-display">+{formatarKz(previewCalculated.reduce((acc, r) => acc + Number(r.aumento || 0), 0))}</span>
                                 </div>

                                 {/* 2. Saque */}
                                 <div className="glass-panel p-6 rounded-[25px] border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all flex flex-col justify-center">
                                    <span className="text-[9px] font-black uppercase text-rose-500 pl-1 tracking-widest opacity-40 block mb-2 flex items-center gap-2">
                                       <ExternalLink size={12} /> Total Saques
                                    </span>
                                    <span className="text-xl font-black text-rose-500 font-display">-{formatarKz(previewCalculated.reduce((acc, r) => acc + Number(r.saque || 0), 0))}</span>
                                 </div>

                                 {/* 3. Multa */}
                                 <div className="glass-panel p-6 rounded-[25px] border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all flex flex-col justify-center">
                                    <span className="text-[9px] font-black uppercase text-slate-400 pl-1 tracking-widest opacity-40 block mb-2 flex items-center gap-2">
                                       <AlertCircle size={12} /> Total Multas
                                    </span>
                                    <span className="text-xl font-black text-slate-300 font-display">-{formatarKz(previewCalculated.reduce((acc, r) => acc + Number(r.multa || 0), 0))}</span>
                                 </div>

                                 {/* 4. Juro Bruto */}
                                 <div className="glass-panel p-6 rounded-[25px] border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all flex flex-col justify-center">
                                    <span className="text-[9px] font-black uppercase text-blue-400 pl-1 tracking-widest opacity-40 block mb-2 flex items-center gap-2">
                                       <TrendingUp size={12} /> Juro Bruto Acum.
                                    </span>
                                    <span className="text-xl font-black text-blue-400 font-display">+{formatarKz(previewCalculated.reduce((acc, r) => acc + Number(r.jurosBruto || 0), 0))}</span>
                                 </div>

                                 {/* 5. Comissão */}
                                 <div className="glass-panel p-6 rounded-[25px] border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all flex flex-col justify-center">
                                    <span className="text-[9px] font-black uppercase text-gold-primary pl-1 tracking-widest opacity-40 block mb-2 flex items-center gap-2">
                                       <Briefcase size={12} /> Total Comissões
                                    </span>
                                    <span className="text-xl font-black text-gold-primary font-display">-{formatarKz(previewCalculated.reduce((acc, r) => acc + Number(r.comissao || 0), 0))}</span>
                                 </div>

                                 {/* 6. IAC */}
                                 <div className="glass-panel p-6 rounded-[25px] border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all flex flex-col justify-center">
                                    <span className="text-[9px] font-black uppercase text-rose-400 pl-1 tracking-widest opacity-40 block mb-2 flex items-center gap-2">
                                       <ShieldCheck size={12} /> Total IAC Retido
                                    </span>
                                    <span className="text-xl font-black text-rose-400 font-display">-{formatarKz(previewCalculated.reduce((acc, r) => acc + Number(r.iac || 0), 0))}</span>
                                 </div>
                              </div>
                            </div>
                         </div>

                         <div className="flex flex-col gap-5 p-12 bg-white/[0.01]">
                            <button type="submit" className="w-full px-14 py-8 bg-gold-gradient text-bg-deep rounded-[35px] font-black text-[15px] uppercase tracking-[0.6em] shadow-[0_40px_100px_rgba(212,175,55,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all border-t-2 border-white/30 whitespace-nowrap flex items-center justify-center gap-4 group">
                                <ShieldCheck size={24} className="group-hover:scale-110 transition-transform" />
                                {isEditing ? "Consolidar Actualização" : "Ativar Estratégia de Rendimento"}
                            </button>
                            <button type="button" onClick={() => setModalTab('perfil')} className="w-full px-14 py-6 bg-white/5 text-white/40 rounded-[30px] font-black text-[11px] uppercase tracking-[0.4em] hover:bg-white/10 hover:text-white transition-all border border-white/5">
                                ⟵ Retornar aos Dados Cadastrais
                            </button>
                         </div>
                      </div>
                   </div>
                </form>
             </div>
          </div>
      )}


      {showRecordModal && (
        <div className="fixed inset-0 bg-bg-deep/95 backdrop-blur-3xl z-[100] flex items-center justify-center p-4 shadow-2xl">
          <div className="glass-panel w-full max-w-2xl rounded-[60px] overflow-hidden border-gold-primary/20 gold-glow shadow-[0_0_150px_rgba(0,0,0,0.6)] animate-in slide-in-from-top-12 duration-500">
           <div className="p-10 border-b border-white/10 flex justify-between items-center bg-white/5">
                <div>
                   <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-2">Novo Lançamento Bancário</h3>
                   <p className="text-[10px] font-black uppercase text-gold-primary tracking-[0.3em] flex items-center gap-2">
                     <Users size={12} /> Global Private Assets Selection
                   </p>
                </div>
                <button onClick={() => setShowRecordModal(false)} className="p-4 bg-white/5 rounded-2xl text-white/40 hover:text-white transition-all shadow-xl hover:rotate-90"><X size={28} /></button>
             </div>
             <form onSubmit={handleAddRecord} className="p-12 space-y-8 max-h-[85vh] overflow-y-auto custom-scrollbar">
                <div className="space-y-4">
                  <div className="flex justify-between items-end px-6">
                    <label className="text-[11px] font-black uppercase text-gold-primary opacity-50 tracking-widest">Selecionar Titular / Investimento Ativo</label>
                    {modalForm.investimento_id && (
                      <div className="flex gap-4">
                        <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20 uppercase tracking-tighter">
                          Taxa: {projects.find(p => p.id === modalForm.investimento_id)?.regime === 'Composto' ? '5%' : '3.5%'}
                        </span>
                        <span className="text-[10px] font-black bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full border border-blue-500/20 uppercase tracking-tighter">
                          Regime: {projects.find(p => p.id === modalForm.investimento_id)?.regime}
                        </span>
                      </div>
                    )}
                  </div>
                  <select 
                    name="investimento_id" 
                    value={modalForm.investimento_id}
                    onChange={(e) => setModalForm({...modalForm, investimento_id: e.target.value})}
                    required 
                    className="w-full bg-white/5 border border-white/10 rounded-3xl px-8 py-5 text-white font-black text-lg outline-none focus:border-gold-primary transition-all appearance-none cursor-pointer"
                  >
                    <option value="" disabled className="bg-bg-deep">Escolher Investidor...</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id} className="bg-bg-deep text-white">
                        {p.investidor_id} — {p.investidores?.nome} ({p.titulo})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="col-span-2 space-y-3">
                       <label className="text-[11px] font-black uppercase text-gold-primary opacity-50 ml-6 tracking-widest">Data / Hora de Referência</label>
                       <input 
                         name="data" 
                         type="datetime-local" 
                         value={modalForm.data}
                         onChange={(e) => setModalForm({...modalForm, data: e.target.value})}
                         required 
                         className="w-full bg-white/5 border border-white/10 rounded-3xl px-8 py-5 text-white font-black text-lg outline-none focus:border-gold-primary transition-all shadow-inner" 
                       />
                   </div>
                   <div className="space-y-3">
                       <label className="text-[11px] font-black uppercase text-emerald-400 opacity-50 ml-6 tracking-widest">Aumento / Depósito (Kz)</label>
                       <input 
                         name="aumento" 
                         type="number" 
                         step="any" 
                         placeholder="0" 
                         value={modalForm.aumento || ''}
                         onChange={(e) => setModalForm({...modalForm, aumento: parseFloat(e.target.value) || 0})}
                         className="w-full bg-white/5 border border-white/10 rounded-3xl px-8 py-5 text-white font-black text-lg outline-none focus:border-emerald-500" 
                       />
                   </div>
                   <div className="space-y-3">
                       <div className="flex justify-between items-center px-4">
                         <label className="text-[11px] font-black uppercase text-blue-400 opacity-50 tracking-widest">Juros Gerados (Kz)</label>
                         <button 
                           type="button" 
                           onClick={suggestRendimento}
                           className="text-[9px] font-black text-gold-primary hover:text-white uppercase tracking-tighter bg-gold-primary/10 px-2 py-1 rounded border border-gold-primary/20 transition-all active:scale-95"
                         >
                           Sugerir
                         </button>
                       </div>
                       <input 
                         name="juros" 
                         type="number" 
                         step="any" 
                         placeholder="0" 
                         value={modalForm.juros || ''}
                         onChange={(e) => setModalForm({...modalForm, juros: parseFloat(e.target.value) || 0})}
                         className="w-full bg-white/5 border border-white/10 rounded-3xl px-8 py-5 text-white font-black text-lg outline-none focus:border-blue-400" 
                       />
                   </div>
                   <div className="space-y-3">
                       <label className="text-[11px] font-black uppercase text-rose-400 opacity-50 ml-6 tracking-widest">Retenção IAC (10%) (Kz)</label>
                       <input 
                         name="iac" 
                         type="number" 
                         step="any" 
                         placeholder="0" 
                         value={modalForm.iac || ''}
                         readOnly
                         className="w-full bg-white/5 border border-white/10 rounded-3xl px-8 py-5 text-rose-400/60 font-black text-lg outline-none cursor-not-allowed shadow-inner"
                       />
                       <p className="text-[9px] text-rose-400/40 ml-6 font-bold">* Calculado automaticamente</p>
                   </div>
                   <div className="space-y-3">
                       <label className="text-[11px] font-black uppercase text-rose-500 opacity-50 ml-6 tracking-widest">Valor do Saque (Kz)</label>
                       <input 
                         name="saque" 
                         type="number" 
                         step="any" 
                         placeholder="0" 
                         value={modalForm.saque || ''}
                         onChange={(e) => setModalForm({...modalForm, saque: parseFloat(e.target.value) || 0})}
                         className="w-full bg-red-500/5 border border-red-500/20 rounded-3xl px-8 py-5 text-rose-500 font-black text-lg outline-none focus:border-rose-500" 
                       />
                   </div>
                   <div className="col-span-2 space-y-3 text-center">
                     <label className="text-[11px] font-black uppercase text-slate-100 opacity-50 tracking-widest block">Multa Bancária Aplicada (Kz)</label>
                     <input 
                       name="multa" 
                       type="number" 
                       step="any" 
                       placeholder="0" 
                       value={modalForm.multa || ''}
                       onChange={(e) => setModalForm({...modalForm, multa: parseFloat(e.target.value) || 0})}
                       className="w-full bg-white/5 border border-white/10 rounded-3xl px-8 py-5 text-white font-black text-lg text-center outline-none focus:border-gold-primary shadow-inner" 
                     />
                   </div>
                </div>
                <button type="submit" className="w-full bg-gold-primary text-bg-deep py-7 rounded-[40px] font-black text-[14px] uppercase tracking-[0.4em] shadow-[0_20px_50px_rgba(212,175,55,0.3)] hover:scale-[1.03] active:scale-[0.97] transition-all border-t-4 border-white/20 mt-4">Consolidar Fluxo de Movimento</button>
             </form>
          </div>
        </div>
      )}

      {showEditRecordModal && editingRecord && (
         <div className="fixed inset-0 bg-bg-deep/95 backdrop-blur-3xl z-[100] flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
            <div className="bg-bg-deep border border-white/5 shadow-[0_0_100px_rgba(0,0,0,0.8)] w-full max-w-4xl rounded-[45px] overflow-hidden animate-in zoom-in-95 duration-500">
               <div className="p-14 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                  <div>
                    <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-2">Editar Lançamento Bancário</h3>
                    <p className="text-[9px] font-black uppercase text-gold-primary/40 tracking-[0.5em]">Private Banking Record Modification</p>
                  </div>
                  <button onClick={() => setShowEditRecordModal(false)} className="p-4 bg-white/5 rounded-2xl text-white/40 hover:text-white transition-all shadow-xl hover:rotate-90"><X size={28} /></button>
               </div>
               <form onSubmit={handleEditRecord} className="p-14 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <label className="text-[11px] font-black uppercase text-gold-primary opacity-50 ml-6 tracking-widest">Data / Hora do Movimento</label>
                        <input name="data" type="datetime-local" defaultValue={editingRecord.data ? new Date(editingRecord.data).toISOString().slice(0, 16) : ''} required className="w-full bg-white/5 border border-white/10 rounded-3xl px-8 py-5 text-white font-black text-lg outline-none focus:border-gold-primary" />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[11px] font-black uppercase text-emerald-400 opacity-50 ml-6 tracking-widest">Aumento de Capital (Kz)</label>
                        <input name="aumento" type="number" step="any" defaultValue={editingRecord.aumento} className="w-full bg-white/5 border border-white/10 rounded-3xl px-8 py-5 text-white font-black text-lg outline-none focus:border-emerald-400" />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[11px] font-black uppercase text-blue-400 opacity-50 ml-6 tracking-widest">Juros Brutos (Kz)</label>
                        <input name="juros" type="number" step="any" defaultValue={editingRecord.juros} className="w-full bg-white/5 border border-white/10 rounded-3xl px-8 py-5 text-white font-black text-lg outline-none focus:border-blue-400" />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[11px] font-black uppercase text-rose-400 opacity-50 ml-6 tracking-widest">Retenção IAC (Kz)</label>
                        <input name="iac" type="number" step="any" defaultValue={editingRecord.iac} className="w-full bg-white/5 border border-white/10 rounded-3xl px-8 py-5 text-white font-black text-lg outline-none focus:border-rose-400" />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[11px] font-black uppercase text-rose-500 opacity-50 ml-6 tracking-widest">Valor do Saque (Kz)</label>
                        <input name="saque" type="number" step="any" defaultValue={editingRecord.saque} className="w-full bg-white/5 border border-white/10 rounded-3xl px-8 py-5 text-white font-black text-lg outline-none focus:border-rose-500" />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[11px] font-black uppercase text-slate-400 opacity-50 ml-6 tracking-widest">Multa Aplicada (Kz)</label>
                        <input name="multa" type="number" step="any" defaultValue={editingRecord.multa} className="w-full bg-white/5 border border-white/10 rounded-3xl px-8 py-5 text-white font-black text-lg outline-none focus:border-slate-400" />
                    </div>
                  </div>
                  <button type="submit" className="w-full py-8 bg-gradient-to-r from-gold-primary to-gold-secondary text-bg-deep rounded-[35px] font-black text-[14px] uppercase tracking-[0.3em] shadow-[0_20px_80px_rgba(212,175,55,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all outline-none">Atualizar Lançamento</button>
               </form>
            </div>
         </div>
      )}

      {/* A4 Report Styles - Premium FinOps Version */}
      <div style={{ display: 'none' }}>
        <div ref={reportRef} className="p-24 text-[#002855] bg-white min-h-[297mm]">
           <div className="flex justify-between items-start mb-20 border-b-[15px] border-[#002855] pb-14 uppercase">
              <div className="relative">
                  <h1 className="text-6xl font-black tracking-tighter mb-2 text-[#002855]">VDP PRIVATE</h1>
                  <p className="text-[14px] font-black opacity-60 tracking-[0.6em] ml-2">ASSETS MANAGEMENT EXECUTIVES</p>
              </div>
              <div className="text-right flex flex-col items-end">
                  <div className="bg-[#002855] text-white px-8 py-3 rounded-xl text-[12px] font-black tracking-[0.3em] mb-4 shadow-xl">CERTIFICADO DE POSIÇÃO</div>
                  <div className="text-[10px] opacity-40 italic font-medium">Protocolo de Confidencialidade Digital Bancária</div>
              </div>
           </div>
           
           {activeProject && (
              <div className="grid grid-cols-2 gap-20 mb-24 px-10">
                 <div className="border-l-[20px] border-[#002855] pl-10 py-8 bg-slate-50 shadow-sm rounded-r-[40px]">
                    <p className="text-[11px] font-black uppercase opacity-40 mb-3 tracking-[0.2em]">Titular Responsável pelo Título</p>
                    <p className="text-[#002855] text-3xl font-black italic tracking-tight italic uppercase">{activeProject.investidores?.nome}</p>
                 </div>
                 <div className="text-right border-r-[20px] border-gold-primary/20 pr-10 py-8 bg-slate-50 shadow-sm rounded-l-[40px]">
                    <p className="text-[11px] font-black uppercase opacity-40 mb-3 tracking-[0.2em]">Data de Emissão Institucional</p>
                    <p className="text-[#002855] text-3xl font-black tracking-tighter">{new Date().toLocaleDateString('pt-AO')}</p>
                 </div>
              </div>
           )}

           <div className="bg-[#002855] text-white py-6 px-12 rounded-t-[40px] font-black uppercase text-[14px] tracking-[0.5em] flex justify-between items-center shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-white/5 pointer-events-none" />
              <span className="relative z-10">Histórico de Manutenção de Capital Estruturado</span>
              <div className="relative z-10 flex gap-8 opacity-60 text-[11px] italic">
                 <span>Regime: {activeProject?.regime}</span>
                 <span>Taxa Aplicada: {activeProject?.taxa}</span>
              </div>
           </div>
           <table className="w-full border-collapse border-4 border-[#002855] shadow-[0_45px_100px_rgba(0,0,0,0.1)] font-mono-table">
              <thead className="bg-[#f8fafc] text-[#002855]">
                 <tr className="font-black text-[12px] uppercase border-[#002855] border-b-[6px]">
                    <th className="p-8 border border-slate-300 text-center w-40">Período</th>
                    <th className="p-8 border border-slate-300 text-center bg-slate-100">Capital Inicial</th>
                    <th className="p-8 border border-slate-300 text-center">AUMENTO Mensal</th>
                    <th className="p-8 border border-slate-300 text-center w-28">Taxa %</th>
                    <th className="p-8 border border-slate-300 text-center text-emerald-800">Dividendos Brutos</th>
                    <th className="p-8 border border-slate-300 text-center text-red-800">Retenção (IAC)</th>
                 </tr>
              </thead>
              <tbody className="text-[#002855] text-sm leading-relaxed">
                 {calculatedHistory.map(row => (
                    <tr key={row.id} className="font-bold border-b border-slate-200 hover:bg-slate-50 transition-all font-sans">
                       <td className="p-8 border-l border-r border-slate-200 text-center uppercase text-[11px] italic font-black whitespace-nowrap">{new Date(row.data).toLocaleDateString('pt-AO', { day: '2-digit', month: 'long', year: 'numeric' })}</td>
                       <td className="p-8 border-r border-slate-200 text-center bg-white font-extrabold">{formatarNum(row.capitalInicial)}</td>
                       <td className="p-8 border-r border-slate-200 text-center bg-slate-50 font-black text-base">{formatarNum(row.aumento)}</td>
                       <td className="p-8 border-r border-slate-200 text-center font-black opacity-60">{row.taxaAplicada}%</td>
                       <td className="p-8 border-r border-slate-200 text-center text-emerald-800 font-black text-lg">{formatarNum(row.juros)}</td>
                       <td className="p-8 border-r border-slate-200 text-center text-red-800/80 font-black text-lg">{formatarNum(row.iac)}</td>
                    </tr>
                 ))}
                 <tr className="bg-[#002855] text-white font-black h-36 border-t-8 border-[#002855] shadow-inner">
                    <td className="p-10 text-center uppercase text-[15px] tracking-[0.4em]">Consolidação Residual</td>
                    <td className="p-10 text-center opacity-30 text-xs">-</td>
                    <td className="p-10 text-center font-black text-2xl tracking-tighter italic">{formatarNum(totals.aumento)}</td>
                    <td className="p-10 text-center opacity-30 text-xs">-</td>
                    <td className="p-10 text-center font-black text-2xl tracking-tighter italic">{formatarNum(totals.juros)}</td>
                    <td className="p-10 text-center font-black text-2xl tracking-tighter italic">{formatarNum(totals.iac)}</td>
                 </tr>
              </tbody>
           </table>

           <div className="mt-28 bg-slate-50 p-20 rounded-[60px] flex justify-between items-center border-[10px] border-[#002855] shadow-[inset_0_10px_40px_rgba(0,0,0,0.05)] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#002855]/5 rounded-bl-[100%] pointer-events-none" />
              <div className="uppercase relative z-10">
                 <p className="text-[14px] font-black opacity-50 mb-6 tracking-[0.6em]">Património Líquido Final Contratado (Assets Yield Return)</p>
                 <div className="flex items-baseline gap-8">
                    <p className="text-8xl font-black text-[#002855] italic tracking-tighter leading-none">{formatarKz(totals.resultado)}</p>
                    <span className="text-[14px] font-black text-[#002855]/30 italic tracking-widest">Ativos Correntes 2026</span>
                 </div>
              </div>
              <div className="text-right relative z-10 flex flex-col items-end">
                  <div className="w-24 h-24 bg-[#002855] rounded-full flex items-center justify-center text-white font-black text-[28px] shadow-2xl mb-4 border-4 border-gold-primary rotate-12 group-hover:rotate-0 transition-transform">✓</div>
                  <span className="text-[11px] font-black opacity-50 uppercase tracking-[0.4em]">Status: Ativo</span>
              </div>
           </div>

           <div className="mt-56 flex justify-between px-32 mb-40 relative">
              <div className="absolute top-0 left-0 w-full h-px bg-[#002855]/5 pointer-events-none" />
              <div className="text-center w-96 font-serif">
                 <div className="h-1 bg-[#002855] mb-6 shadow-xl" />
                 <p className="text-[14px] font-black uppercase text-[#002855] italic tracking-[0.4em] mb-2">Venda Plus General Management</p>
                 <p className="text-[10px] opacity-40 font-bold tracking-tighter">Selo de Autenticidade Digital ID: 2992-B</p>
              </div>
<div className="text-center w-96 font-serif">
                 <div className="h-1 bg-[#002855] mb-6 shadow-xl" />
                 <p className="text-[14px] font-black uppercase text-[#002855] italic tracking-[0.4em] mb-2">Assinatura Certificada do Titular</p>
                 <p className="text-[10px] opacity-40 font-bold tracking-tighter">Identidade Reconhecida sob Protocolo de CustÃ³dia</p>
              </div>
            </div>
         </div>
       </div>

       {showExtratoModal && extratoInvestor && (
         <div className="fixed inset-0 bg-bg-deep/95 backdrop-blur-3xl z-[100] flex items-center justify-center p-4">
           <div className="glass-panel w-full max-w-4xl rounded-[40px] overflow-hidden border-gold-primary/20 gold-glow shadow-[0_0_150px_rgba(212,175,55,0.1)]">
             <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
               <h3 className="text-2xl font-black text-gold-gradient italic tracking-widest uppercase">Extrato do Investidor</h3>
               <div className="flex gap-3">
                 <button onClick={() => { handleExtratoPrint(); }} className="bg-gold-primary text-bg-deep px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2">
                   <Printer size={16} /> Imprimir
                 </button>
                 <button onClick={() => setShowExtratoModal(false)} className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"><X size={20} className="text-white/60" /></button>
               </div>
             </div>
             <div className="p-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
               <div style={{ display: 'none' }}>
                 <div ref={extratoRef} className="p-16 text-[#002855] bg-white min-h-[297mm]">
                   <div className="flex justify-between items-start mb-12 border-b-[10px] border-[#002855] pb-8">
                     <div>
                       <h1 className="text-4xl font-black tracking-tighter mb-2">VDP PRIVATE</h1>
                       <p className="text-[11px] font-black opacity-60 tracking-[0.4em]">ASSETS MANAGEMENT</p>
                     </div>
                     <div className="text-right">
                       <div className="bg-[#002855] text-white px-6 py-2 rounded-lg text-[10px] font-black tracking-[0.2em] mb-2">EXTRATO INDIVIDUAL</div>
                       <p className="text-[9px] opacity-40">{new Date().toLocaleDateString('pt-AO')}</p>
                     </div>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-12 mb-12 px-4">
                     <div className="border-l-4 border-gold-primary pl-6">
                       <p className="text-[9px] font-black uppercase opacity-40 tracking-widest mb-2">Titular</p>
                       <p className="text-2xl font-black italic">{extratoInvestor.investidores?.nome}</p>
<span className="text-[10px] opacity-60 mt-1">{extratoInvestor.titulo}</span>
                     </div>
                     <div className="text-right">
                       <p className="text-[9px] font-black uppercase opacity-40 tracking-widest mb-2">Período Contratual</p>
                       <p className="font-black">{new Date(extratoInvestor.data_inicio).toLocaleDateString('pt-AO', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                       <p className="text-[10px] opacity-60">até {extratoInvestor.data_fim ? new Date(extratoInvestor.data_fim).toLocaleDateString('pt-AO', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'}</p>
                     </div>
                   </div>

                   {(() => {
                      const { history: invHistory, totals: t } = calculateProjectFullHistory(extratoInvestor, records.filter(r => r.investimento_id === extratoInvestor.id));
                      return (
                        <>
                          <div className="bg-[#002855] text-white py-4 px-8 rounded-t-xl font-black uppercase text-[12px] tracking-[0.3em]">
                            Histórico de Manutenção de Capital
                          </div>
                          <table className="w-full border-collapse border-2 border-[#002855]">
                            <thead className="bg-slate-100 text-[#002855]">
                              <tr className="text-[10px] font-black uppercase">
                                <th className="p-4 border border-slate-300 text-left">Mês</th>
                                <th className="p-4 border border-slate-300 text-right">Saldo Inicial</th>
                                <th className="p-4 border border-slate-300 text-right text-blue-700">Juros Brutos</th>
                                <th className="p-4 border border-slate-300 text-right text-red-700">Retenção IAC</th>
                                <th className="p-4 border border-slate-300 text-right">Movimentos</th>
                                <th className="p-4 border border-slate-300 text-right">Saldo Final</th>
                              </tr>
                            </thead>
                            <tbody>
                              {invHistory.map((row, idx) => (
                                <tr key={idx} className="border border-slate-200">
                                  <td className="p-3 text-[10px] font-medium italic">{new Date(row.data).toLocaleDateString('pt-AO', { month: 'long', year: 'numeric' }).toUpperCase()}</td>
                                  <td className="p-3 text-[10px] text-right font-bold">{formatarNum(row.capitalInicial)}</td>
                                  <td className="p-3 text-[10px] text-right text-blue-700 font-black">+{formatarNum(row.juros)}</td>
                                  <td className="p-3 text-[10px] text-right text-red-700 font-bold">-{formatarNum(row.iac)}</td>
                                  <td className="p-3 text-[10px] text-right">
                                    {row.aumento > 0 && <span className="text-emerald-600">+{formatarNum(row.aumento)} </span>}
                                    {row.saque > 0 && <span className="text-red-500">-{formatarNum(row.saque)} </span>}
                                  </td>
                                  <td className="p-3 text-[11px] text-right font-black bg-slate-50">{formatarNum(row.capitalFinal)}</td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="bg-[#002855] text-white">
                              <tr className="text-[10px] font-black uppercase">
                                <td className="p-4 border border-[#002855]">TOTAL CONSOLIDADO</td>
                                <td className="p-4 border border-[#002855] text-right">-</td>
                                <td className="p-4 border border-[#002855] text-right text-blue-300">{formatarNum(t.juros)}</td>
                                <td className="p-4 border border-[#002855] text-right text-red-300">{formatarNum(t.iac)}</td>
                                <td className="p-4 border border-[#002855] text-right">
                                  <span className="text-emerald-400">+{formatarNum(t.aumento)}</span> / 
                                  <span className="text-red-400">-{formatarNum(t.saque)}</span>
                                </td>
                                <td className="p-4 border border-[#002855] text-right text-gold-primary text-sm">{formatarNum(t.resultado)}</td>
                              </tr>
                            </tfoot>
                          </table>
                          <div className="mt-8 text-center opacity-30 text-[8px] font-black uppercase tracking-[0.5em]">
                            Consolidação de Dados: CP {formatarNum(t.aumento)} | JB {formatarNum(t.juros)} | RT {formatarNum(t.iac)} | SQ {formatarNum(t.saque)}
                          </div>

                         <div className="mt-8 grid grid-cols-3 gap-6">
                           <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                             <p className="text-[9px] font-black uppercase opacity-40 tracking-widest mb-1">Capital Inicial</p>
                             <p className="text-2xl font-black">{formatarKz(extratoInvestor.capital_inicial)}</p>
                           </div>
                           <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-200">
                             <p className="text-[9px] font-black uppercase text-emerald-600 tracking-widest mb-1">Total Aumento</p>
                             <p className="text-2xl font-black text-emerald-700">{formatarKz(t.aumento)}</p>
                           </div>
                           <div className="bg-blue-50 p-6 rounded-2xl border border-blue-200">
                             <p className="text-[9px] font-black uppercase text-blue-600 tracking-widest mb-1">Total Juros</p>
                             <p className="text-2xl font-black text-blue-700">{formatarKz(t.juros)}</p>
                           </div>
                           <div className="bg-red-50 p-6 rounded-2xl border border-red-200">
                             <p className="text-[9px] font-black uppercase text-red-600 tracking-widest mb-1">Total IAC (10%)</p>
                             <p className="text-2xl font-black text-red-700">{formatarKz(t.iac)}</p>
                           </div>
                           <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                             <p className="text-[9px] font-black uppercase opacity-40 tracking-widest mb-1">Total Saques</p>
                             <p className="text-2xl font-black text-slate-700">{formatarKz(t.saque)}</p>
                           </div>
                           <div className="bg-[#002855] text-white p-6 rounded-2xl">
                             <p className="text-[9px] font-black uppercase opacity-60 tracking-widest mb-1">Resultado Final</p>
                             <p className="text-2xl font-black text-gold-primary">{formatarKz(t.resultado)}</p>
                           </div>
                         </div>

                         <div className="mt-12 text-center text-[10px] opacity-40 font-medium">
                           Documento gerado em {new Date().toLocaleString('pt-AO')} - Venda Plus General Management
                         </div>
                       </>
                     );
                   })()}
                 </div>
               </div>
               
               <div className="text-center py-8">
                 <button onClick={() => { handleExtratoPrint(); }} className="bg-gold-primary text-bg-deep px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-gold-primary/20">
                   <Printer size={20} className="inline mr-2" /> Gerar PDF
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}
     </div>
   );
}
