import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  TrendingUp, 
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
  ArrowUpRight,
  AlertCircle,
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
  Receipt
} from 'lucide-react';
import { api } from '../../lib/api';
import { useReactToPrint } from 'react-to-print';
import Logo from '../Logo';

interface Investor {
  id: string;
  nome: string;
  nif: string;
  email: string;
  telefone: string;
  nacionalidade?: string;
  estado_civil?: string;
  data_nascimento?: string;
  endereco?: string;
  foto?: string;
  tipo_investidor?: string;
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
}

export default function InvestmentsModule() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'investors' | 'applications' | 'records' | 'indicadores' | 'financeiro' | 'saques' | 'extrato' | 'relatorio_investidor'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [projects, setProjects] = useState<Investment[]>([]);
  const [records, setRecords] = useState<Record[]>([]);
  const [activeProject, setActiveProject] = useState<Investment | null>(null);
  
  const [showUnifiedModal, setShowUnifiedModal] = useState(false);
  const [modalTab, setModalTab] = useState<'perfil' | 'aplicacao'>('perfil');
  const [showRecordModal, setShowRecordModal] = useState(false);
  
  const [startDate, setStartDate] = useState<string>('2026-01-01');
  const [numMonths, setNumMonths] = useState<number>(12);
  const [selectedRateType, setSelectedRateType] = useState<'simples' | 'composto'>('simples');
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

  const [modalRows, setModalRows] = useState<PreviewRow[]>([]);

  const reportRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({ contentRef: reportRef });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resInvestors, resProjects] = await Promise.all([
        api.get('/api/investments/investors').then(r => r.json()),
        api.get('/api/applications').then(r => r.json())
      ]);
      setInvestors(resInvestors || []);
      setProjects(resProjects || []);
      if (resProjects && resProjects.length > 0 && !activeProject) setActiveProject(resProjects[0]);
    } catch (error) { console.error('Error fetching data:', error); }
    finally { setLoading(false); }
  };

  const fetchRecords = async (id: string) => {
    try {
      const data = await api.get(`/api/applications/${id}/records`).then(r => r.json());
      setRecords(data || []);
    } catch (error) { console.error('Error fetching records:', error); }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResult(null);
      return;
    }
    
    let found: Investor | undefined;
    if (searchBy === 'id') {
      found = investors.find(inv => inv.id === searchQuery.trim());
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
        ? investors.filter(inv => inv.id === searchQuery.trim())
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
    if (activeProject?.id) fetchRecords(activeProject.id);
  }, [activeProject?.id]);

  useEffect(() => {
    if (showUnifiedModal) {
      const newRows = [];
      const [y, mStr] = startDate.split('-').map(Number);
      for (let i = 0; i < numMonths; i++) {
        const targetMonth = (mStr - 1) + i;
        const d = new Date(y, targetMonth, 1);
        const yActual = d.getFullYear();
        const mActual = d.getMonth() + 1;
        const dateStr = `${yActual}-${String(mActual).padStart(2, '0')}-01`;
        
        const existing = modalRows[i];
        newRows.push({
            data: dateStr,
            aumento: existing ? existing.aumento : 0,
            saque: existing ? existing.saque : 0,
            multa: existing ? existing.multa : 0
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
    // Use the exact number of months to calculate end date
    d.setMonth(d.getMonth() + Number(numMonths));
    return d.toISOString().split('T')[0];
  }, [startDate, numMonths]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setInvestorPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const previewCalculated = useMemo(() => {
    let currentCap = initialCapital;
    const taxaVal = selectedRateType === 'simples' ? 0.035 : 0.05;

    return modalRows.map(row => {
        const saldoInicial = currentCap;
        const subtotalFluxo = saldoInicial + Number(row.aumento) - Number(row.saque) - Number(row.multa);
        
        // Base de Juros: Capital Inicial + Aumento (conforme regra anterior)
        const capitalBaseInteresse = saldoInicial + Number(row.aumento);
        const juros = capitalBaseInteresse * taxaVal;
        const iac = juros * 0.10;
        
        let capitalFinal = capitalBaseInteresse + juros - iac;
        if (Number(row.saque) > 0 || Number(row.multa) > 0) capitalFinal -= (Number(row.saque) + Number(row.multa));
        
        const [yLabel, mLabel, dLabel] = row.data.split('-').map(Number);
        const mesesNomes = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        const mesLabel = mesesNomes[mLabel - 1];
        
        const result = {
            ...row,
            mesLabel,
            saldoInicial,
            subtotalFluxo: subtotalFluxo,
            taxa: selectedRateType === 'simples' ? '3,5%' : '5%',
            juros,
            iac,
            final: capitalFinal
        };
        currentCap = capitalFinal;
        return result;
    });
  }, [modalRows, initialCapital, selectedRateType]);

  const updateModalRow = (index: number, field: keyof PreviewRow, value: string | number) => {
    const newRows = [...modalRows];
    const numVal = Number(value) || 0;
    newRows[index] = { ...newRows[index], [field]: numVal };
    
    // Auto-calculate 10% fine when saque is entered, but ONLY if we are editing saque
    if (field === 'saque' && numVal > 0) {
      newRows[index].multa = numVal * 0.10;
    }
    
    setModalRows(newRows);
  };

  const calculatedHistory = useMemo(() => {
    if (!activeProject || !records.length) return [];
    let currentCapital = Number(activeProject.capital_inicial);
    const taxa = activeProject.taxa?.includes('5') ? 0.05 : 0.035;

    return records.sort((a,b) => new Date(a.data).getTime() - new Date(b.data).getTime()).map(rec => {
      const capitalInicial = currentCapital;
      const capitalBase = capitalInicial + Number(rec.aumento);
      const juros = capitalBase * taxa;
      const iac = juros * 0.10;
      let capitalFinal = capitalBase + juros - iac;
      if (Number(rec.saque) > 0 || Number(rec.multa) > 0) capitalFinal -= (Number(rec.saque) + Number(rec.multa));
      currentCapital = capitalFinal;
      return { ...rec, capitalInicial, capitalBase, taxaAplicada: taxa * 100, juros, iac, capitalFinal } as CalculatedMonth;
    });
  }, [activeProject, records]);

  const totals = useMemo(() => {
    return calculatedHistory.reduce((acc, cur) => ({
      aumento: acc.aumento + Number(cur.aumento),
      juros: acc.juros + Number(cur.juros),
      iac: acc.iac + Number(cur.iac),
      resultado: cur.capitalFinal
    }), { aumento: 0, juros: 0, iac: 0, resultado: activeProject?.capital_inicial || 0 });
  }, [calculatedHistory, activeProject]);

  const handleUnifiedRegistration = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    try {
      let invId = selectedInvestor?.id;
      if (!invId) {
        const invRes = await api.post('/api/investments/investors', {
          nome: data.nome, nif: data.nif, email: data.email, telefone: data.telefone,
          telefone_alternativo: data.telefone_alternativo, whatsapp: data.whatsapp,
          morada: data.morada, naturalidade: data.naturalidade, provincia: data.provincia,
          nacionalidade: data.nacionalidade, data_nascimento: data.data_nascimento,
          data_emissao: data.data_emissao, data_validade: data.data_validade,
          escolaridade: data.escolaridade, curso: data.curso, profissao: data.profissao,
          estado_civil: data.estado_civil,
          banco_principal: data.banco_principal, iban_principal: data.iban_principal,
          banco_alternativo: data.banco_alternativo, iban_alternativo: data.iban_alternativo,
          foto: investorPhoto, tipo_investidor: data.tipo_investidor
        }).then(r => r.json());
        invId = invRes.id;
      }
      const appRes = await api.post('/api/applications', {
        titulo: data.titulo, investidor_id: invId, capital_inicial: initialCapital,
        data_inicio: startDate, data_fim: calculatedEndDate, regime: selectedRateType === 'simples' ? 'Simples' : 'Composto',
        taxa: selectedRateType === 'simples' ? '3.5%' : '5%', periodicidade: 'Mensal', duracao: `${numMonths} Meses`
      }).then(r => r.json());

      for (const row of modalRows) {
        if (row.aumento > 0 || row.saque > 0 || row.multa > 0) {
            await api.post('/api/applications/records', { investimento_id: appRes.id, data: row.data, aumento: row.aumento, saque: row.saque, multa: row.multa, observacoes: 'Lançamento Inicial' });
        }
      }
      setShowUnifiedModal(false); setModalRows([]); setSelectedInvestor(null); fetchData();
    } catch (err) { alert('Erro ao processar cadastro'); }
  };

  const handleAddRecord = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const rawData = Object.fromEntries(formData.entries());
    try {
      await api.post('/api/applications/records', { ...rawData, investimento_id: activeProject?.id, aumento: Number(rawData.aumento) || 0, saque: Number(rawData.saque) || 0, multa: Number(rawData.multa) || 0 });
      setShowRecordModal(false); fetchData(); if (activeProject?.id) fetchRecords(activeProject.id);
    } catch (err) { alert('Erro ao registar movimento'); }
  };

  if (loading) return <div className="flex items-center justify-center p-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-primary"></div></div>;

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 text-white">
        <div>
          <h1 className="text-4xl font-black tracking-tighter italic font-display leading-none mb-3">
            Gestão de <span className="text-gold-gradient">Aplicações Financeiras</span>
          </h1>
          <p className="text-gold-primary/40 font-black text-[10px] uppercase tracking-[0.4em]">Banking Assets Management 2026</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => { setModalTab('perfil'); setSelectedInvestor(null); setModalRows([]); setShowUnifiedModal(true); }} className="bg-gradient-to-r from-gold-primary to-gold-secondary text-bg-deep px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-gold-primary/20 hover:scale-105 transition-all flex items-center gap-2">
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
          { id: 'saques', label: 'Consulta de Saques', icon: DollarSign },
          { id: 'applications', label: 'Gestão de Títulos', icon: Briefcase },
          { id: 'records', label: 'Relatórios Mensais', icon: History },
          { id: 'investors', label: 'Titulares Activos', icon: Users },
          { id: 'extrato', label: 'Extrato PDF', icon: FileText },
          { id: 'relatorio_investidor', label: 'Relatório por Investidor', icon: PieChart }
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
        
        {searchResult && (
          <div className="mt-4 p-4 bg-gold-primary/10 rounded-2xl border border-gold-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gold-primary/20 rounded-xl flex items-center justify-center">
                  <Users className="text-gold-primary" size={24} />
                </div>
                <div>
                  <p className="font-black text-white">{searchResult.nome}</p>
                  <p className="text-[10px] text-white/40">ID: {searchResult.id} | NIF: {searchResult.nif}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {filteredProjects.find(p => p.investidor_id === searchResult.id) && (
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-black uppercase">
                    Com Investimento
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
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
        <div>
          {searchQuery && (
            <div className="mb-6 p-4 bg-gold-primary/10 rounded-2xl border border-gold-primary/20">
              <p className="text-[10px] font-black text-gold-primary uppercase tracking-widest">
                A mostrar {filteredProjects.length} investimento(s) para: "{searchQuery}"
              </p>
            </div>
          )}
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

          <div className="flex-1 space-y-8">
             {activeProject && (
               <div className="glass-panel rounded-[30px] border-white/5 overflow-hidden shadow-2xl">
                  <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                     <div>
                        <h3 className="text-xl font-black text-white tracking-tighter italic text-gold-gradient uppercase">Demonstrativo de Histórico Bancário</h3>
                        <p className="text-[10px] font-black text-gold-primary/40 uppercase tracking-widest mt-1">Titular: {activeProject.investidores?.nome} | Regime: {activeProject.regime}</p>
                     </div>
                     <button onClick={() => setShowRecordModal(true)} className="p-3 bg-white/5 border border-white/10 rounded-xl text-gold-primary hover:bg-gold-primary hover:text-bg-deep transition-all shadow-lg active:scale-95"><Plus size={20} /></button>
                  </div>
                  
                  <div className="overflow-x-auto p-8">
                    <table className="w-full border-collapse border border-white/10">
                       <thead className="bg-[#002855] text-white">
                         <tr>
                           <th className="py-4 px-6 border border-white/10 font-bold uppercase text-[11px]">Mês</th>
                           <th className="py-4 px-6 border border-white/10 font-bold uppercase text-[11px]">Capital Inicial</th>
                           <th className="py-4 px-6 border border-white/10 font-bold uppercase text-[11px]">Aumento</th>
                           <th className="py-4 px-6 border border-white/10 font-bold uppercase text-[11px]">Taxa</th>
                           <th className="py-4 px-6 border border-white/10 font-bold uppercase text-[11px]">Juros Brutos</th>
                           <th className="py-4 px-6 border border-white/10 font-bold uppercase text-[11px]">Retenção IAC</th>
                         </tr>
                       </thead>
                       <tbody className="text-white">
                         {calculatedHistory.map(row => (
                           <tr key={row.id} className="hover:bg-white/5 transition-colors border-b border-white/5">
                             <td className="py-4 px-6 border-r border-white/10 text-center font-bold text-[11px] uppercase whitespace-nowrap">{new Date(row.data).toLocaleDateString('pt-AO', { day: '2-digit', month: 'long', year: 'numeric' })}</td>
                             <td className="py-4 px-6 border-r border-white/10 text-center font-bold text-sm">{formatarNum(row.capitalInicial)}</td>
                             <td className="py-4 px-6 border-r border-white/10 text-center font-bold text-sm">{formatarNum(row.aumento)}</td>
                             <td className="py-4 px-6 border-r border-white/10 text-center font-bold text-sm text-emerald-400">{activeProject.taxa}</td>
                             <td className="py-4 px-6 border-r border-white/10 text-center font-bold text-sm">{formatarNum(row.juros)}</td>
                             <td className="py-4 px-6 text-center font-bold text-sm">{formatarNum(row.iac)}</td>
                           </tr>
                         ))}
                         <tr className="bg-[#002855]/40 font-black">
                           <td className="py-5 px-6 border border-white/10 text-center uppercase text-[11px]">Consolidação de Ciclo</td>
                           <td className="py-5 px-6 border border-white/10 text-center">-</td>
                           <td className="py-5 px-6 border border-white/10 text-center text-sm">{formatarNum(totals.aumento)}</td>
                           <td className="py-5 px-6 border border-white/10 text-center">-</td>
                           <td className="py-5 px-6 border border-white/10 text-center text-sm">{formatarNum(totals.juros)}</td>
                           <td className="py-5 px-6 border border-white/10 text-center text-sm">{formatarNum(totals.iac)}</td>
                         </tr>
                       </tbody>
                    </table>
                  </div>

                  <div className="px-8 pb-8 flex justify-end">
                     <div className="glass-panel p-6 rounded-2xl border-white/10 bg-white/5 min-w-[320px] gold-glow shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-gold-primary/5 rounded-bl-full group-hover:bg-gold-primary/10 transition-all pointer-events-none" />
                        <span className="text-[10px] font-black uppercase text-gold-primary/60 block mb-1">Património Atualizado Bancário</span>
                        <span className="text-3xl font-black text-gold-primary italic">{formatarKz(totals.resultado)}</span>
                     </div>
                  </div>
               </div>
             )}
          </div>
        </div>
      )}

      {activeTab === 'investors' && (
        <div className="glass-panel p-8 rounded-[40px] border-white/5 overflow-hidden shadow-2xl animate-in fade-in duration-500">
          {searchQuery && (
            <div className="mb-6 p-4 bg-gold-primary/10 rounded-2xl border border-gold-primary/20">
              <p className="text-[10px] font-black text-gold-primary uppercase tracking-widest">
                A mostrar {filteredInvestors.length} resultado(s) para: "{searchQuery}"
              </p>
            </div>
          )}
          <table className="w-full text-white">
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
              {filteredInvestors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-white/30 font-black uppercase tracking-widest">
                    Nenhum investidor encontrado
                  </td>
                </tr>
              ) : (
                filteredInvestors.map(inv => (
                  <tr key={inv.id} className="group hover:bg-white/[0.02] transition-all">
                    <td className="py-6 pl-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center text-gold-primary/20 shadow-inner group-hover:border-gold-primary/30 transition-all">
                         {inv.foto ? <img src={inv.foto} alt="" className="w-full h-full object-cover" /> : <Users size={20} />}
                      </div>
                      <span className="font-black text-slate-100 group-hover:text-gold-primary transition-colors">{inv.nome}</span>
                    </td>
                    <td className="py-6 font-mono text-[10px] text-white/40">{inv.id.substring(0, 8)}...</td>
                    <td className="py-6 font-bold opacity-30">{inv.nif}</td>
                    <td className="py-6 font-bold text-slate-400">{inv.telefone}</td>
                    <td className="py-6 text-right pr-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setSearchResult(inv); const p = projects.find(pro => pro.investidor_id === inv.id); if (p) setActiveProject(p); }} className="p-3 opacity-20 hover:opacity-100 hover:text-gold-primary hover:bg-white/5 rounded-xl transition-all shadow-sm"><FileText size={18} /></button>
                        <button onClick={() => { const p = projects.find(pro => pro.investidor_id === inv.id); if (p) setActiveProject(p); setActiveTab('records'); }} className="p-3 opacity-20 hover:opacity-100 hover:text-gold-primary hover:bg-white/5 rounded-xl transition-all shadow-sm"><ChevronRight size={22} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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

          <div className="glass-panel rounded-3xl border-amber-500/20 overflow-hidden">
            <div className="bg-amber-500/10 p-6 border-b border-amber-500/20 flex items-center gap-4">
              <AlertTriangle className="text-amber-500" size={24} />
              <h3 className="text-xl font-black text-amber-500 uppercase tracking-wider">Contratos a Vencer (30 dias)</h3>
            </div>
            <div className="p-6">
              {projects.filter(p => {
                if (!p.data_fim) return false;
                const endDate = new Date(p.data_fim);
                const today = new Date();
                const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                return diffDays >= 0 && diffDays <= 30;
              }).length === 0 ? (
                <p className="text-white/40 text-center py-8 font-black uppercase tracking-widest">Nenhum contrato a vencer nos próximos 30 dias</p>
              ) : (
                <div className="space-y-4">
                  {projects.filter(p => {
                    if (!p.data_fim) return false;
                    const endDate = new Date(p.data_fim);
                    const today = new Date();
                    const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    return diffDays >= 0 && diffDays <= 30;
                  }).map(p => {
                    const diffDays = Math.ceil((new Date(p.data_fim!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                    return (
                      <div key={p.id} className="flex items-center justify-between p-4 bg-amber-500/5 rounded-2xl border border-amber-500/20">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                            <Clock size={20} className="text-amber-500" />
                          </div>
                          <div>
                            <p className="font-black text-white">{p.investidores?.nome || 'Investidor'}</p>
                            <p className="text-[10px] font-black uppercase text-amber-500/60 tracking-widest">{p.titulo}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">Data do Fim</p>
                          <p className="font-black text-amber-500">{new Date(p.data_fim!).toLocaleDateString('pt-AO', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                          <p className="text-[10px] font-black text-amber-500/60">{diffDays} dias restantes</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'financeiro' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          {searchResult && (
            <div className="glass-panel p-4 rounded-2xl border-gold-primary/20 bg-gold-primary/10 flex items-center gap-4">
              <Users size={18} className="text-gold-primary" />
              <p className="text-[10px] font-black text-gold-primary uppercase tracking-widest">
                Dados filtrados para: {searchResult.nome}
              </p>
            </div>
          )}
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
              const filteredRecords = records.filter(r => {
                const recordDate = new Date(r.data);
                const start = reportStartDate ? new Date(reportStartDate) : null;
                const end = reportEndDate ? new Date(reportEndDate) : null;
                if (start && recordDate < start) return false;
                if (end && recordDate > end) return false;
                if (selectedInvestorForReport) {
                  const project = projects.find(p => p.id === r.investimento_id);
                  if (project?.investidor_id !== selectedInvestorForReport) return false;
                }
                return true;
              });
              return (
                <>
                  <div className="glass-panel p-8 rounded-3xl border-emerald-500/20 bg-emerald-500/5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500/60 block mb-2">Total de Aumento</span>
                    <span className="text-3xl font-black text-emerald-500">{formatarKz(filteredRecords.reduce((acc, r) => acc + Number(r.aumento), 0))}</span>
                  </div>
                  <div className="glass-panel p-8 rounded-3xl border-red-500/20 bg-red-500/5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-red-500/60 block mb-2">Total de Saques</span>
                    <span className="text-3xl font-black text-red-500">{formatarKz(filteredRecords.reduce((acc, r) => acc + Number(r.saque), 0))}</span>
                  </div>
                  <div className="glass-panel p-8 rounded-3xl border-amber-500/20 bg-amber-500/5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-500/60 block mb-2">Total de Juros</span>
                    <span className="text-3xl font-black text-amber-500">{formatarKz(filteredRecords.reduce((acc, r) => acc + Number(r.juros), 0))}</span>
                  </div>
                  <div className="glass-panel p-8 rounded-3xl border-blue-500/20 bg-blue-500/5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-500/60 block mb-2">Total de IAC</span>
                    <span className="text-3xl font-black text-blue-500">{formatarKz(filteredRecords.reduce((acc, r) => acc + Number(r.iac), 0))}</span>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {activeTab === 'saques' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          {searchResult && (
            <div className="glass-panel p-4 rounded-2xl border-gold-primary/20 bg-gold-primary/10 flex items-center gap-4">
              <Users size={18} className="text-gold-primary" />
              <p className="text-[10px] font-black text-gold-primary uppercase tracking-widest">
                Dados filtrados para: {searchResult.nome}
              </p>
            </div>
          )}
          <div className="glass-panel p-8 rounded-3xl border-white/10">
            <h3 className="text-xl font-black text-gold-primary uppercase tracking-wider mb-6 flex items-center gap-4">
              <DollarSign size={24} /> Consulta de Saques
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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

            <div className="glass-panel rounded-2xl border-white/5 overflow-hidden">
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
                    const projRecords = records.filter(r => {
                      if (r.investimento_id !== proj.id) return false;
                      if (r.saque <= 0) return false;
                      const recordDate = new Date(r.data);
                      const start = reportStartDate ? new Date(reportStartDate) : null;
                      const end = reportEndDate ? new Date(reportEndDate) : null;
                      if (start && recordDate < start) return false;
                      if (end && recordDate > end) return false;
                      if (selectedInvestorForReport && proj.investidor_id !== selectedInvestorForReport) return false;
                      return true;
                    });
                    if (projRecords.length === 0) return null;
                    const totalSaque = projRecords.reduce((acc, r) => acc + Number(r.saque), 0);
                    return (
                      <tr key={proj.id} className="hover:bg-white/[0.02] transition-all">
                        <td className="py-4 px-6 font-black text-white">{proj.investidores?.nome || 'N/A'}</td>
                        <td className="py-4 px-6 text-center text-white/40">{proj.data_inicio ? new Date(proj.data_inicio).toLocaleDateString('pt-AO') : '-'}</td>
                        <td className="py-4 px-6 text-center font-black text-red-400">{projRecords.length}</td>
                        <td className="py-4 px-6 text-right font-black text-red-400">{formatarKz(totalSaque)}</td>
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
          {searchResult && (
            <div className="glass-panel p-4 rounded-2xl border-gold-primary/20 bg-gold-primary/10 flex items-center gap-4">
              <Users size={18} className="text-gold-primary" />
              <p className="text-[10px] font-black text-gold-primary uppercase tracking-widest">
                Dados filtrados para: {searchResult.nome}
              </p>
            </div>
          )}
          <div className="glass-panel p-8 rounded-3xl border-white/10">
            <h3 className="text-xl font-black text-gold-primary uppercase tracking-wider mb-6 flex items-center gap-4">
              <Receipt size={24} /> Extrato Individual por Investidor
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredProjects.length === 0 ? (
                <div className="col-span-2 text-center py-12 text-white/30 font-black uppercase tracking-widest">
                  Nenhum investimento encontrado
                </div>
              ) : (
                filteredProjects.map(proj => (
                  <div key={proj.id} className="p-6 bg-white/5 rounded-2xl border border-white/10 hover:border-gold-primary/30 transition-all">
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
                    <button 
                      onClick={() => { setExtratoInvestor(proj); setShowExtratoModal(true); }}
                      className="w-full bg-gold-primary text-bg-deep py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                    >
                      <Printer size={16} /> Gerar Extrato PDF
                    </button>
                  </div>
                ))
              )}
            </div>
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
                    <th className="py-4 px-4 text-right">Total Aumento</th>
                    <th className="py-4 px-4 text-right">Total Juros</th>
                    <th className="py-4 px-4 text-right">Total IAC</th>
                    <th className="py-4 px-4 text-right">Total Saques</th>
                    <th className="py-4 px-4 text-right">Total Multas</th>
                    <th className="py-4 px-4 text-right text-gold-primary">Resultado Final</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {projects.map(proj => {
                    const invRecords = records.filter(r => r.investimento_id === proj.id);
                    const totalAumento = invRecords.reduce((acc, r) => acc + Number(r.aumento), 0);
                    const totalJuros = invRecords.reduce((acc, r) => acc + Number(r.juros), 0);
                    const totalIac = invRecords.reduce((acc, r) => acc + Number(r.iac), 0);
                    const totalSaques = invRecords.reduce((acc, r) => acc + Number(r.saque), 0);
                    const totalMultas = invRecords.reduce((acc, r) => acc + Number(r.multa), 0);
                    const resultadoFinal = Number(proj.capital_inicial) + totalAumento + totalJuros - totalIac - totalSaques;
                    return (
                      <tr key={proj.id} className="hover:bg-white/[0.02] transition-all">
                        <td className="py-4 px-4">
                          <p className="font-black text-white">{proj.investidores?.nome || 'N/A'}</p>
                          <p className="text-[10px] text-white/40">{proj.titulo}</p>
                        </td>
                        <td className="py-4 px-4 text-right font-bold text-white">{formatarKz(proj.capital_inicial)}</td>
                        <td className="py-4 px-4 text-right font-bold text-emerald-400">{formatarKz(totalAumento)}</td>
                        <td className="py-4 px-4 text-right font-bold text-blue-400">{formatarKz(totalJuros)}</td>
                        <td className="py-4 px-4 text-right font-bold text-red-400">{formatarKz(totalIac)}</td>
                        <td className="py-4 px-4 text-right font-bold text-red-400">{formatarKz(totalSaques)}</td>
                        <td className="py-4 px-4 text-right font-bold text-slate-400">{formatarKz(totalMultas)}</td>
                        <td className="py-4 px-4 text-right font-black text-gold-primary text-lg">{formatarKz(resultadoFinal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gold-primary/10 border-t border-gold-primary/20">
                  <tr className="text-[10px] font-black uppercase text-gold-primary">
                    <td className="py-4 px-4">TOTAL GERAL</td>
                    <td className="py-4 px-4 text-right">{formatarKz(projects.reduce((acc, p) => acc + Number(p.capital_inicial), 0))}</td>
                    <td className="py-4 px-4 text-right text-emerald-400">{formatarKz(records.reduce((acc, r) => acc + Number(r.aumento), 0))}</td>
                    <td className="py-4 px-4 text-right text-blue-400">{formatarKz(records.reduce((acc, r) => acc + Number(r.juros), 0))}</td>
                    <td className="py-4 px-4 text-right text-red-400">{formatarKz(records.reduce((acc, r) => acc + Number(r.iac), 0))}</td>
                    <td className="py-4 px-4 text-right text-red-400">{formatarKz(records.reduce((acc, r) => acc + Number(r.saque), 0))}</td>
                    <td className="py-4 px-4 text-right text-slate-400">{formatarKz(records.reduce((acc, r) => acc + Number(r.multa), 0))}</td>
                    <td className="py-4 px-4 text-right text-gold-primary text-lg">{formatarKz(
                      projects.reduce((acc, p) => acc + Number(p.capital_inicial), 0) +
                      records.reduce((acc, r) => acc + Number(r.aumento), 0) +
                      records.reduce((acc, r) => acc + Number(r.juros), 0) -
                      records.reduce((acc, r) => acc + Number(r.iac), 0) -
                      records.reduce((acc, r) => acc + Number(r.saque), 0)
                    )}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {showUnifiedModal && (
        <div className="fixed inset-0 bg-bg-deep/95 backdrop-blur-3xl z-[100] flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-7xl rounded-[50px] overflow-hidden border-gold-primary/20 gold-glow flex flex-col max-h-[96vh] shadow-[0_0_150px_rgba(212,175,55,0.1)] transition-all animate-in zoom-in duration-300">
            <div className="p-8 border-b border-white/10 flex justify-between items-center bg-white/5">
                <div>
                    <h3 className="text-3xl font-black text-gold-gradient italic tracking-widest uppercase">Cadastro do Investidor</h3>
                    <div className="flex gap-4 mt-6">
                        <button onClick={() => setModalTab('perfil')} className={`text-[10px] font-black uppercase tracking-widest pb-3 transition-all border-b-2 flex items-center gap-2 ${modalTab === 'perfil' ? 'text-gold-primary border-gold-primary' : 'text-white/30 border-transparent hover:text-white/50'}`}>
                           <UserPlus size={14} /> Dados Pessoais
                        </button>
                        <button onClick={() => setModalTab('aplicacao')} className={`text-[10px] font-black uppercase tracking-widest pb-3 transition-all border-b-2 flex items-center gap-2 ${modalTab === 'aplicacao' ? 'text-gold-primary border-gold-primary' : 'text-white/30 border-transparent hover:text-white/50'}`}>
                           <ShieldCheck size={14} /> 2. Estratégia de Rendimento
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="opacity-70 hover:opacity-100 transition-opacity">
                        <Logo className="h-10" />
                    </div>
                    <button onClick={() => { setShowUnifiedModal(false); setModalRows([]); }} className="p-4 bg-white/5 rounded-2xl text-white/40 hover:text-white transition-all hover:rotate-90 shadow-lg"><X size={26} /></button>
                </div>
            </div>
            
            <form onSubmit={handleUnifiedRegistration} className="flex-1 overflow-y-auto custom-scrollbar p-10 bg-gradient-to-b from-transparent to-white/[0.01]">
               {modalTab === 'perfil' && (
                   <div className={`grid grid-cols-1 md:grid-cols-3 gap-16 animate-in slide-in-from-left duration-500`}>
                      <div className="flex flex-col items-center gap-8">
                         <div className="bg-white/5 p-8 rounded-[50px] border-2 border-dashed border-white/10 flex flex-col items-center gap-6 cursor-pointer hover:border-gold-primary transition-all relative aspect-square w-full justify-center group overflow-hidden shadow-[inset_0_10px_40px_rgba(0,0,0,0.4)]">
                            <input type="file" accept="image/*" onChange={handlePhotoChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                            {investorPhoto ? (
                                <img src={investorPhoto} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform" />
                            ) : (
                                <>
                                  <Camera size={64} className="text-white/10 group-hover:text-gold-primary transition-colors" />
                                  <span className="text-[10px] font-black uppercase tracking-widest text-white/30 text-center">Registrar Fotografia<br/>do Titular</span>
                                </>
                            )}
                         </div>
                         <div className="flex items-center gap-3 text-gold-primary/40 font-black text-[9px] uppercase tracking-widest">
                            <CheckCircle2 size={12} /> BI/NIF Validado
                         </div>
                      </div>

                      <div className="md:col-span-2 space-y-10">
<div className="flex justify-between items-center bg-white/5 p-6 rounded-3xl border border-white/10 shadow-inner">
                            <h4 className="text-sm font-black text-gold-gradient uppercase tracking-[0.4em]">Identidade Pessoal</h4>
                            <div className="flex items-center gap-4">
                               <div className="flex items-center gap-3 bg-gold-primary/10 px-4 py-2 rounded-xl border border-gold-primary/30">
                                  <span className="text-[9px] font-black uppercase opacity-60">Nº de Investidor:</span>
                                  <span className="font-black text-gold-primary tracking-wider">INV-Nº{String(investors.length + 1).padStart(3, '0')}/{new Date().getFullYear().toString().slice(-2)}</span>
                               </div>
                               <div className="flex items-center gap-3">
                                  <span className="text-[10px] font-black uppercase opacity-40">Idade Estimada:</span>
                                  <span className="bg-gold-primary text-bg-deep px-4 py-1 rounded-full font-black text-xs shadow-lg">{calculateAge(birthDate) || '--'} Anos</span>
                               </div>
                            </div>
                         </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-white">
                           {/* Seção 1: Dados Pessoais */}
                           <div className="md:col-span-3">
                              <span className="text-[9px] font-black uppercase text-gold-primary/40 tracking-[0.3em] block mb-4 border-l-2 border-gold-primary/20 pl-3">I. IDENTIFICAÇÃO CIVIL & CONTACTOS</span>
                           </div>
                           <div className="md:col-span-2 space-y-3">
                               <label className="text-[10px] font-black uppercase opacity-40 ml-4 tracking-[0.2em]">Nome Completo</label>
                               <input name="nome" required placeholder="Simão Pambo Puca" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 font-bold outline-none focus:border-gold-primary shadow-inner" />
                           </div>
                           <div className="space-y-3">
                               <label className="text-[10px] font-black uppercase opacity-40 ml-4 tracking-[0.2em]">Nº Bilhete / NIF</label>
                               <input name="nif" required placeholder="00000000LA000" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 font-bold outline-none focus:border-gold-primary shadow-inner" />
                           </div>
                           <div className="space-y-3">
                               <label className="text-[10px] font-black uppercase opacity-40 ml-4 tracking-[0.2em]">Nascimento</label>
                               <input name="data_nascimento" type="date" required value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 font-bold outline-none focus:border-gold-primary shadow-inner" />
                           </div>

                           <div className="space-y-3">
                               <label className="text-[10px] font-black uppercase opacity-40 ml-4 tracking-[0.2em]">Data Emissão</label>
                               <input name="data_emissao" type="date" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 font-bold outline-none focus:border-gold-primary shadow-inner" />
                           </div>
                           <div className="space-y-3">
                               <label className="text-[10px] font-black uppercase opacity-40 ml-4 tracking-[0.2em]">Validade</label>
                               <input name="data_validade" type="date" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 font-bold outline-none focus:border-gold-primary shadow-inner" />
                           </div>
                           <div className="space-y-3">
                               <label className="text-[10px] font-black uppercase opacity-40 ml-4 tracking-[0.2em]">Nacionalidade</label>
                               <input name="nacionalidade" defaultValue="Angolana" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 font-bold outline-none focus:border-gold-primary shadow-inner" />
                           </div>

                           <div className="space-y-3">
                               <label className="text-[10px] font-black uppercase opacity-40 ml-4 tracking-[0.2em]">Naturalidade</label>
                               <input name="naturalidade" placeholder="Ex: Luanda" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 font-bold outline-none focus:border-gold-primary shadow-inner" />
                           </div>
                           <div className="space-y-3">
                               <label className="text-[10px] font-black uppercase opacity-40 ml-4 tracking-[0.2em]">Província</label>
                               <select name="provincia" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 font-bold outline-none focus:border-gold-primary shadow-inner text-white">
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
                           <div className="md:col-span-3 space-y-3">
                               <label className="text-[10px] font-black uppercase opacity-40 ml-4 tracking-[0.2em]">Morada completa</label>
                               <input name="morada" placeholder="Bairro, Rua, Casa..." className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 font-bold outline-none focus:border-gold-primary shadow-inner" />
                           </div>

                           <div className="space-y-3">
                               <label className="text-[10px] font-black uppercase opacity-40 ml-4 tracking-[0.2em]">Estado Civil</label>
                               <select name="estado_civil" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 font-bold outline-none focus:border-gold-primary shadow-inner text-white">
                                  <option value="" className="bg-[#0f172a] text-white">-- Selecione o Estado Civil --</option>
                                  <option value="Solteiro(a)" className="bg-[#0f172a] text-white">Solteiro(a)</option>
                                  <option value="Casado(a)" className="bg-[#0f172a] text-white">Casado(a)</option>
                                  <option value="Divorciado(a)" className="bg-[#0f172a] text-white">Divorciado(a)</option>
                                  <option value="Viúvo(a)" className="bg-[#0f172a] text-white">Viúvo(a)</option>
                               </select>
                           </div>
                           <div className="space-y-3">
                               <label className="text-[10px] font-black uppercase opacity-40 ml-4 tracking-[0.2em]">Escolaridade</label>
                               <select name="escolaridade" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 font-bold outline-none focus:border-gold-primary shadow-inner text-white">
                                  <option value="" className="bg-[#0f172a] text-white">-- Selecione a Escolaridade --</option>
                                  <option value="Ensino Primário" className="bg-[#0f172a] text-white">Ensino Primário</option>
                                  <option value="Ensino Secundário" className="bg-[#0f172a] text-white">Ensino Secundário</option>
                                  <option value="Ensino Médio" className="bg-[#0f172a] text-white">Ensino Médio</option>
                                  <option value="Bacharel" className="bg-[#0f172a] text-white">Bacharel</option>
                                  <option value="Licenciatura" className="bg-[#0f172a] text-white">Licenciatura</option>
                                  <option value="Mestrado" className="bg-[#0f172a] text-white">Mestrado</option>
                                  <option value="Doutoramento" className="bg-[#0f172a] text-white">Doutoramento</option>
                               </select>
                           </div>
                           <div className="space-y-3">
                               <label className="text-[10px] font-black uppercase opacity-40 ml-4 tracking-[0.2em]">Curso Académico</label>
                               <select name="curso" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 font-bold outline-none focus:border-gold-primary shadow-inner text-white">
                                  <option value="" className="bg-[#0f172a] text-white">-- Selecione o Curso --</option>
                                  <option value="Economia" className="bg-[#0f172a] text-white">Economia</option>
                                  <option value="Gestão de Empresas" className="bg-[#0f172a] text-white">Gestão de Empresas</option>
                                  <option value="Contabilidade e Auditoria" className="bg-[#0f172a] text-white">Contabilidade e Auditoria</option>
                                  <option value="Direito" className="bg-[#0f172a] text-white">Direito</option>
                                  <option value="Engenharia de Informática" className="bg-[#0f172a] text-white">Engenharia de Informática</option>
                                  <option value="Engenharia Civil" className="bg-[#0f172a] text-white">Engenharia Civil</option>
                                  <option value="Relações Internacionais" className="bg-[#0f172a] text-white">Relações Internacionais</option>
                                  <option value="Medicina" className="bg-[#0f172a] text-white">Medicina</option>
                                  <option value="Psicologia" className="bg-[#0f172a] text-white">Psicologia</option>
                                  <option value="Outro" className="bg-[#0f172a] text-white">Outro / Especialização</option>
                                </select>
                           </div>
                           <div className="space-y-3">
                               <label className="text-[10px] font-black uppercase opacity-40 ml-4 tracking-[0.2em]">Profissão / Cargo</label>
                               <input name="profissao" placeholder="Ex: Gestor Bancário" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 font-bold outline-none focus:border-gold-primary shadow-inner" />
                           </div>

<div className="space-y-3">
                                <label className="text-[10px] font-black uppercase opacity-40 ml-4 tracking-[0.2em]">Telefone Principal</label>
                                <input name="telefone" required placeholder="+244 9XX XXX XXX" onInput={(e) => { const v = e.target.value.replace(/[^0-9+\s]/g, ''); if (v.length > 0 && !v.startsWith('+')) { e.target.classList.add('border-red-500'); } else { e.target.classList.remove('border-red-500'); } e.target.value = v; }} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 font-bold outline-none focus:border-gold-primary shadow-inner" />
                                <span className="text-[8px] font-black uppercase opacity-30 ml-4">Formato: +244 9XX XXX XXX</span>
                            </div>
<div className="space-y-3">
                                <label className="text-[10px] font-black uppercase opacity-40 ml-4 tracking-[0.2em]">Telefone Alternativo</label>
                                <input name="telefone_alternativo" placeholder="+244 9XX XXX XXX" onInput={(e) => { const v = e.target.value.replace(/[^0-9+\s]/g, ''); if (v.length > 0 && !v.startsWith('+')) { e.target.classList.add('border-red-500'); } else { e.target.classList.remove('border-red-500'); } e.target.value = v; }} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 font-bold outline-none focus:border-gold-primary shadow-inner" />
                                <span className="text-[8px] font-black uppercase opacity-30 ml-4">Formato: +244 9XX XXX XXX</span>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase opacity-40 ml-4 tracking-[0.2em]">WhatsApp</label>
                                <input name="whatsapp" placeholder="+244 9XX XXX XXX" onInput={(e) => { const v = e.target.value.replace(/[^0-9+\s]/g, ''); if (v.length > 0 && !v.startsWith('+')) { e.target.classList.add('border-red-500'); } else { e.target.classList.remove('border-red-500'); } e.target.value = v; }} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 font-bold outline-none focus:border-green-500 shadow-inner" />
                                <span className="text-[8px] font-black uppercase opacity-30 ml-4">Formato: +244 9XX XXX XXX</span>
                            </div>
                            <div className="md:col-span-2 space-y-3">
                                <label className="text-[10px] font-black uppercase opacity-40 ml-4 tracking-[0.2em]">E-mail Oficial</label>
                                <input name="email" type="email" placeholder="exemplo@dominio.com" pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$" onInput={(e) => { const v = e.target.value; const valid = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v); if (v.length > 0 && !valid) { e.target.classList.add('border-red-500'); } else { e.target.classList.remove('border-red-500'); } }} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 font-bold outline-none focus:border-gold-primary shadow-inner" />
                                <span className="text-[8px] font-black uppercase opacity-30 ml-4">Formato: exemplo@dominio.com</span>
                            </div>

                           {/* Seção 2: Dados Bancários */}
                           <div className="md:col-span-3 pt-6">
                              <span className="text-[9px] font-black uppercase text-gold-primary/40 tracking-[0.3em] block mb-4 border-l-2 border-gold-primary/20 pl-3">II. COORDENADAS BANCÁRIAS PARA RESGATE</span>
                           </div>
                            <datalist id="bancos_angola">
                               <option value="BAI" />
                               <option value="BFA" />
                               <option value="BIC" />
                               <option value="BNI" />
                               <option value="BCI" />
                               <option value="BMA" />
                               <option value="BPC" />
                               <option value="SOL" />
                               <option value="KEVE" />
                               <option value="VTB" />
                               <option value="ATLANTICO" />
                               <option value="ECONOMICO" />
                               <option value="STANDARD BANK" />
                               <option value="BIR" />
                               <option value="SBA" />
                               <option value="FINIBANCO" />
                               <option value="BCA" />
                            </datalist>
                           <div className="space-y-3">
                               <label className="text-[10px] font-black uppercase opacity-40 ml-4 tracking-[0.2em]">Banco Principal</label>
                               <input name="banco_principal" list="bancos_angola" placeholder="Selecione ou insira o banco" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 font-bold outline-none focus:border-gold-primary shadow-inner" />
                           </div>
<div className="md:col-span-2 space-y-3">
                                <label className="text-[10px] font-black uppercase opacity-40 ml-4 tracking-[0.2em]">IBAN Principal</label>
                                <input name="iban_principal" placeholder="AO06.0000.0000.0000.0000.0000.0" pattern="^AO[0-9]{2}[0-9]{4}[0-9]{4}[0-9]{4}[0-9]{4}[0-9]{4}[0-9]{1}$" onInput={(e) => { const v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); if (v.length > 0 && !v.startsWith('AO')) { e.target.setCustomValidity('IBAN deve começar com AO'); e.target.classList.add('border-red-500'); } else if (v.length >= 4 && v.length < 25) { e.target.setCustomValidity('IBAN angolano deve ter 25 caracteres'); e.target.classList.add('border-red-500'); } else { e.target.setCustomValidity(''); e.target.classList.remove('border-red-500'); } e.target.value = v; }} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 font-bold outline-none focus:border-gold-primary shadow-inner" />
                                <span className="text-[8px] font-black uppercase opacity-30 ml-4">Formato: AO00.0000.0000.0000.0000.0000.0 (25 dígitos)</span>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase opacity-40 ml-4 tracking-[0.2em]">Banco Alternativo</label>
                                <input name="banco_alternativo" list="bancos_angola" placeholder="Selecione o banco" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 font-bold outline-none focus:border-gold-primary shadow-inner" />
                            </div>
                            <div className="md:col-span-2 space-y-3">
                                <label className="text-[10px] font-black uppercase opacity-40 ml-4 tracking-[0.2em]">IBAN Alternativo</label>
                                <input name="iban_alternativo" placeholder="AO06.0000.0000.0000.0000.0000.0" pattern="^AO[0-9]{2}[0-9]{4}[0-9]{4}[0-9]{4}[0-9]{4}[0-9]{4}[0-9]{1}$" onInput={(e) => { const v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); if (v.length > 0 && !v.startsWith('AO')) { e.target.setCustomValidity('IBAN deve começar com AO'); e.target.classList.add('border-red-500'); } else if (v.length >= 4 && v.length < 25) { e.target.setCustomValidity('IBAN angolano deve ter 25 caracteres'); e.target.classList.add('border-red-500'); } else { e.target.setCustomValidity(''); e.target.classList.remove('border-red-500'); } e.target.value = v; }} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 font-bold outline-none focus:border-gold-primary shadow-inner" />
                                <span className="text-[8px] font-black uppercase opacity-30 ml-4">Formato: AO00.0000.0000.0000.0000.0000.0 (25 dígitos)</span>
                            </div>

                           <div className="pt-10 md:col-span-3">
                               <button type="button" onClick={() => setModalTab('aplicacao')} className="w-full bg-gold-primary text-bg-deep py-6 rounded-3xl font-black text-[12px] uppercase tracking-[0.3em] hover:scale-[1.02] active:scale-[0.98] shadow-[0_15px_40px_rgba(212,175,55,0.2)] transition-all flex items-center justify-center gap-4">Configurar Estratégia financeira <ArrowRight size={20} /></button>
                           </div>
                        </div>
                      </div>
                   </div>
               )}

               {modalTab === 'aplicacao' && (
                  <div className="space-y-12 animate-in slide-in-from-right duration-500">
                     <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase opacity-50 text-white ml-2 tracking-widest">Capital Inicial</label>
                            <input name="capital_inicial" type="number" required placeholder="Valor de Origem" onChange={(e) => setInitialCapital(Number(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white font-black text-lg outline-none focus:border-gold-primary shadow-inner" />
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
                        <div className="space-y-2 text-white">
                            <label className="text-[10px] font-black uppercase opacity-50 ml-2 tracking-widest">Identificador de Título</label>
                            <input name="titulo" required placeholder="Denominação Bancária" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 font-bold outline-none focus:border-gold-primary shadow-inner placeholder:opacity-20" />
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
                        
                        <div className="overflow-x-auto custom-scrollbar bg-[#020617]/40">
                            <table className="w-full border-collapse">
                                <thead className="bg-[#002855]/95 text-white/50">
                                    <tr className="text-[10px] font-black uppercase tracking-[0.2em] border-b border-white/5">
                                        <th className="py-7 px-8 text-center border-r border-white/5 w-40">Ciclo Mensal</th>
                                        <th className="py-7 px-8 text-center border-r border-white/5 w-44">Saldo INICIAL</th>
                                        <th className="py-7 px-8 text-center border-r border-white/5 w-full min-w-[500px]">Movimentações Reais de Caixa (Kz)</th>
                                        <th className="py-7 px-8 text-center border-r border-white/5 w-48">Subtotal de Caixa</th>
                                        <th className="py-7 px-8 text-center border-r border-white/5 w-44">Cálculos Bancários (Rentabilidade)</th>
                                        <th className="py-7 px-10 text-center w-48">Saldo Final</th>
                                    </tr>
                                </thead>
                                <tbody className="text-white">
                                    {previewCalculated.map((m, idx) => (
                                        <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.05] transition-all h-36 group">
                                            <td className="px-8 border-r border-white/5 text-center font-black text-[14px] text-white tracking-widest uppercase py-6">{m.mesLabel}</td>
                                            <td className="px-8 border-r border-white/5 text-center bg-white/[0.02]">
                                               <span className="text-[9px] font-black uppercase opacity-20 block mb-2">Base do Mês</span>
                                               <span className="text-[16px] font-black text-slate-100">{formatarNum(m.saldoInicial)}</span>
                                            </td>
                                            <td className="px-10 border-r border-white/5">
                                                <div className="flex gap-6 justify-center items-center h-full">
                                                    <div className="flex flex-col gap-2 items-start flex-1 min-w-[120px]">
                                                        <span className="text-[12px] font-black uppercase text-emerald-400 px-2 tracking-widest">AUMENTO</span>
                                                        <div className="relative w-full shadow-lg rounded-2xl overflow-hidden group/input">
                                                            <input type="number" value={m.aumento || ''} placeholder="0" onChange={(e) => updateModalRow(idx, 'aumento', e.target.value)} className="w-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl px-5 py-4 text-center font-black text-[12px] outline-none focus:border-emerald-500 focus:bg-emerald-500/20 transition-all font-display" />
                                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] opacity-30 font-black">Kz</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col gap-2 items-start flex-1 min-w-[120px]">
                                                        <span className="text-[12px] font-black uppercase text-red-500 px-2 tracking-widest">Saque</span>
                                                        <div className="relative w-full shadow-lg rounded-2xl overflow-hidden group/input">
                                                            <input type="number" value={m.saque || ''} placeholder="0" onChange={(e) => updateModalRow(idx, 'saque', e.target.value)} className="w-full bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl px-5 py-4 text-center font-black text-[12px] outline-none focus:border-red-500 focus:bg-red-500/20 transition-all font-display" />
                                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] opacity-30 font-black">Kz</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col gap-2 items-start flex-1 min-w-[120px]">
                                                        <span className="text-[12px] font-black uppercase text-slate-300 px-2 tracking-widest">Multa</span>
                                                        <div className="relative w-full shadow-lg rounded-2xl overflow-hidden group/input">
                                                            <input type="number" value={m.multa || ''} placeholder="0" readOnly className="w-full bg-white/5 border border-white/10 text-white/40 rounded-2xl px-5 py-4 text-center font-black text-[12px] outline-none cursor-not-allowed font-display" />
                                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] opacity-30 font-black">Kz</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 border-r border-white/5 text-center bg-white/[0.03]">
                                               <span className="text-[9px] font-black uppercase opacity-20 block mb-2 tracking-widest italic">Subtotal</span>
                                               <span className="text-[17px] font-bold text-gold-primary">{formatarNum(m.subtotalFluxo)}</span>
                                            </td>
                                            <td className="px-8 border-r border-white/5 text-center">
                                                <div className="flex flex-col gap-1.5 opacity-60 group-hover:opacity-100 transition-all">
                                                   <div className="flex justify-between items-center text-[10px] font-bold">
                                                      <span className="text-emerald-400">Juros ({m.taxa})</span>
                                                      <span>+{formatarNum(m.juros)}</span>
                                                   </div>
                                                   <div className="flex justify-between items-center text-[10px] font-bold">
                                                      <span className="text-red-400">IAC (10%)</span>
                                                      <span>-{formatarNum(m.iac)}</span>
                                                   </div>
                                                </div>
                                            </td>
                                            <td className="px-8 text-center bg-[#002855]/20">
                                               <span className="text-[9px] font-black uppercase opacity-20 block mb-2">Resultante</span>
                                               <span className="text-[18px] font-black text-gold-gradient tracking-tighter">{formatarNum(m.final)}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                     </div>

                     <div className="flex justify-between items-center p-12 bg-[#002855]/20 rounded-[50px] border border-white/5 shadow-inner">
                        <div className="text-white">
                            <span className="text-[11px] font-black uppercase opacity-30 block mb-2 tracking-[0.4em]">Resgate Final Estimado ao Término (Líquido)</span>
                            <div className="flex items-baseline gap-4 mt-2">
                               <span className="text-5xl font-black text-gold-gradient tracking-tighter shadow-2xl drop-shadow-lg whitespace-nowrap">{formatarKz(previewCalculated[previewCalculated.length - 1]?.final || 0)}</span>
                               <span className="text-[10px] font-black uppercase text-gold-primary/40 tracking-widest italic animate-pulse">Cálculo Financeiro Concluído</span>
                            </div>
                        </div>
                        <div className="flex gap-8">
                            <button type="button" onClick={() => setModalTab('perfil')} className="px-16 py-7 bg-white/5 text-white/40 rounded-[35px] font-black text-[12px] uppercase tracking-[0.3em] hover:bg-white/10 hover:text-white transition-all border border-white/10 shadow-xl">Revisar Perfil Civico</button>
                            <button type="submit" className="px-28 py-7 bg-gradient-to-r from-gold-primary to-gold-secondary text-bg-deep rounded-[35px] font-black text-[12px] uppercase tracking-[0.3em] shadow-[0_20px_80px_rgba(212,175,55,0.3)] hover:scale-[1.05] active:scale-[0.95] transition-all outline-none border-t-2 border-white/20">Activar e Registrar Conta</button>
                        </div>
                     </div>
                  </div>
               )}
            </form>
          </div>
        </div>
      )}

      {showRecordModal && (
        <div className="fixed inset-0 bg-bg-deep/95 backdrop-blur-3xl z-[100] flex items-center justify-center p-4 shadow-2xl">
          <div className="glass-panel w-full max-w-xl rounded-[60px] overflow-hidden border-gold-primary/20 gold-glow shadow-[0_0_150px_rgba(0,0,0,0.6)] animate-in slide-in-from-top-12 duration-500">
             <div className="p-10 border-b border-white/10 flex justify-between items-center bg-white/5">
                <div>
                   <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-2">Registro de Ciclo Activo</h3>
                   <p className="text-[9px] font-black uppercase text-gold-primary/40 tracking-[0.5em]">Private Banking Management</p>
                </div>
                <button onClick={() => setShowRecordModal(false)} className="p-4 bg-white/5 rounded-2xl text-white/40 hover:text-white transition-all shadow-xl hover:rotate-90"><X size={28} /></button>
             </div>
             <form onSubmit={handleAddRecord} className="p-14 space-y-12">
                <div className="space-y-12">
                   <div className="space-y-3">
                       <label className="text-[11px] font-black uppercase text-gold-primary opacity-50 ml-6 tracking-widest">Data de Referência</label>
                       <input name="data" type="date" required className="w-full bg-white/5 border border-white/10 rounded-3xl px-8 py-6 text-white font-black text-xl outline-none focus:border-gold-primary transition-all shadow-inner" />
                   </div>
                   <div className="space-y-3">
                       <label className="text-[11px] font-black uppercase text-emerald-400 opacity-50 ml-6 tracking-widest">Valor do AUMENTO (Kz)</label>
                       <input name="aumento" type="number" placeholder="Introduzir Montante Bancário" required className="group w-full bg-white/5 border border-white/10 rounded-3xl px-8 py-6 text-white font-black text-2xl outline-none focus:border-emerald-500 shadow-inner group-hover:bg-emerald-500/10 transition-all font-display" />
                   </div>
                   <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3 text-center">
                        <label className="text-[11px] font-black uppercase text-red-500 opacity-50 tracking-widest block">Saque Externo</label>
                        <input name="saque" type="number" placeholder="0" defaultValue="0" className="w-full bg-red-500/5 border border-red-500/20 rounded-3xl px-8 py-6 text-red-500 font-black text-xl text-center outline-none focus:border-red-500 shadow-inner" />
                      </div>
                      <div className="space-y-3 text-center">
                        <label className="text-[11px] font-black uppercase text-slate-100 opacity-50 tracking-widest block">Multa Bancária (10%)</label>
                        <input name="multa" type="number" placeholder="0" defaultValue="0" className="w-full bg-white/5 border border-white/10 rounded-3xl px-8 py-6 text-white font-black text-xl text-center outline-none focus:border-gold-primary shadow-inner" />
                      </div>
                   </div>
                </div>
                <button type="submit" className="w-full bg-gold-primary text-bg-deep py-7 rounded-[40px] font-black text-[14px] uppercase tracking-[0.4em] shadow-[0_20px_50px_rgba(212,175,55,0.3)] hover:scale-[1.03] active:scale-[0.97] transition-all border-t-4 border-white/20">Consolidar Fluxo Bancário</button>
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
           <table className="w-full border-collapse border-4 border-[#002855] shadow-[0_45px_100px_rgba(0,0,0,0.1)]">
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
                  <div className="w-24 h-24 bg-[#002855] rounded-full flex items-center justify-center text-white font-black text-[28px] shadow-2xl mb-4 border-4 border-gold-primary rotate-12 group-hover:rotate-0 transition-transform">Ã¢Å“â€œ</div>
                  <span className="text-[11px] font-black opacity-50 uppercase tracking-[0.4em]">Status: Activo</span>
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
                 <p className="text-[10px] opacity-40 font-bold tracking-tighter">Identidade Reconhecida sob Protocolo de Custódia</p>
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
                       <p className="text-[10px] opacity-60 mt-1">{extratoInvestor.titulo}</p>
                     </div>
                     <div className="text-right">
                       <p className="text-[9px] font-black uppercase opacity-40 tracking-widest mb-2">Período Contratual</p>
                       <p className="font-black">{new Date(extratoInvestor.data_inicio).toLocaleDateString('pt-AO', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                       <p className="text-[10px] opacity-60">até {extratoInvestor.data_fim ? new Date(extratoInvestor.data_fim).toLocaleDateString('pt-AO', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'}</p>
                     </div>
                   </div>

                   {(() => {
                     const invRecords = records.filter(r => r.investimento_id === extratoInvestor.id);
                     const totalAumento = invRecords.reduce((acc, r) => acc + Number(r.aumento), 0);
                     const totalJuros = invRecords.reduce((acc, r) => acc + Number(r.juros), 0);
                     const totalIac = invRecords.reduce((acc, r) => acc + Number(r.iac), 0);
                     const totalSaques = invRecords.reduce((acc, r) => acc + Number(r.saque), 0);
                     const totalMultas = invRecords.reduce((acc, r) => acc + Number(r.multa), 0);
                     return (
                       <>
                         <div className="bg-[#002855] text-white py-4 px-8 rounded-t-xl font-black uppercase text-[12px] tracking-[0.3em]">
                           Histórico Mensal
                         </div>
                         <table className="w-full border-collapse border-2 border-[#002855]">
                           <thead className="bg-slate-100 text-[#002855]">
                             <tr className="text-[10px] font-black uppercase">
                               <th className="p-4 border border-slate-300 text-left">Mês</th>
                               <th className="p-4 border border-slate-300 text-right">Capital</th>
                               <th className="p-4 border border-slate-300 text-right">Aumento</th>
                               <th className="p-4 border border-slate-300 text-right">Juros</th>
                               <th className="p-4 border border-slate-300 text-right">IAC</th>
                               <th className="p-4 border border-slate-300 text-right">Saques</th>
                             </tr>
                           </thead>
                           <tbody>
                             {invRecords.map((row, idx) => (
                               <tr key={idx} className="border border-slate-200">
                                 <td className="p-3 text-[10px] font-medium">{new Date(row.data).toLocaleDateString('pt-AO', { month: 'long', year: 'numeric' }).toUpperCase()}</td>
                                 <td className="p-3 text-[10px] text-right font-bold">{formatarNum(row.capitalInicial || extratoInvestor.capital_inicial)}</td>
                                 <td className="p-3 text-[10px] text-right text-emerald-700 font-bold">{formatarNum(row.aumento)}</td>
                                 <td className="p-3 text-[10px] text-right text-blue-700 font-bold">{formatarNum(row.juros)}</td>
                                 <td className="p-3 text-[10px] text-right text-red-700 font-bold">{formatarNum(row.iac)}</td>
                                 <td className="p-3 text-[10px] text-right text-red-600 font-bold">{formatarNum(row.saque)}</td>
                               </tr>
                             ))}
                           </tbody>
                           <tfoot className="bg-[#002855] text-white">
                             <tr className="text-[10px] font-black uppercase">
                               <td className="p-4 border border-[#002855]">TOTAL</td>
                               <td className="p-4 border border-[#002855] text-right">-</td>
                               <td className="p-4 border border-[#002855] text-right text-emerald-400">{formatarNum(totalAumento)}</td>
                               <td className="p-4 border border-[#002855] text-right text-blue-300">{formatarNum(totalJuros)}</td>
                               <td className="p-4 border border-[#002855] text-right text-red-300">{formatarNum(totalIac)}</td>
                               <td className="p-4 border border-[#002855] text-right text-red-400">{formatarNum(totalSaques)}</td>
                             </tr>
                           </tfoot>
                         </table>

                         <div className="mt-8 grid grid-cols-3 gap-6">
                           <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                             <p className="text-[9px] font-black uppercase opacity-40 tracking-widest mb-1">Capital Inicial</p>
                             <p className="text-2xl font-black">{formatarKz(extratoInvestor.capital_inicial)}</p>
                           </div>
                           <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-200">
                             <p className="text-[9px] font-black uppercase text-emerald-600 tracking-widest mb-1">Total Aumento</p>
                             <p className="text-2xl font-black text-emerald-700">{formatarKz(totalAumento)}</p>
                           </div>
                           <div className="bg-blue-50 p-6 rounded-2xl border border-blue-200">
                             <p className="text-[9px] font-black uppercase text-blue-600 tracking-widest mb-1">Total Juros</p>
                             <p className="text-2xl font-black text-blue-700">{formatarKz(totalJuros)}</p>
                           </div>
                           <div className="bg-red-50 p-6 rounded-2xl border border-red-200">
                             <p className="text-[9px] font-black uppercase text-red-600 tracking-widest mb-1">Total IAC</p>
                             <p className="text-2xl font-black text-red-700">{formatarKz(totalIac)}</p>
                           </div>
                           <div className="bg-red-50 p-6 rounded-2xl border border-red-200">
                             <p className="text-[9px] font-black uppercase text-red-600 tracking-widest mb-1">Total Saques</p>
                             <p className="text-2xl font-black text-red-700">{formatarKz(totalSaques)}</p>
                           </div>
                           <div className="bg-[#002855] text-white p-6 rounded-2xl">
                             <p className="text-[9px] font-black uppercase opacity-60 tracking-widest mb-1">Resultado Final</p>
                             <p className="text-2xl font-black">{formatarKz(extratoInvestor.capital_inicial + totalAumento + totalJuros - totalIac - totalSaques)}</p>
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
