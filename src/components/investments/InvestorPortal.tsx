import React, { useRef, useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Wallet, 
  History, 
  Printer, 
  LogOut, 
  User, 
  Calendar, 
  ArrowUpRight, 
  ShieldCheck,
  Building2,
  FileText,
  PieChart,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  Briefcase
} from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import Logo from '../Logo';
import { api } from '../../lib/api';

interface InvestorPortalProps {
  session: {
    investor: any;
    token: string;
    investments: any[];
    history: any[];
  };
  onLogout: () => void;
}

export default function InvestorPortal({ session, onLogout }: InvestorPortalProps) {
  const { investor, token } = session || {};
  const [investments, setInvestments] = useState<any[]>(session?.investments || []);
  const [history, setHistory] = useState<any[]>(session?.history || []);
  const [loading, setLoading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const fetchFreshData = async () => {
    if (!investor?.id) return;
    setLoading(true);
    try {
      console.log(`[InvestorPortal] Buscando dados atualizados para o investidor ${investor.id}...`);
      
      // Buscar contratos do investidor (enviando o token para autorização)
      const options = { headers: { 'Authorization': `Bearer ${token}` } };
      
      const invRes = await api.get(`/api/applications?investor_id=${investor.id}`, options).then(r => r.json());
      if (Array.isArray(invRes)) {
        setInvestments(invRes);
        
        // Buscar TODO o histórico de registros associado a estes contratos
        const allRecords: any[] = [];
        for (const inv of invRes) {
          const recs = await api.get(`/api/applications/${inv.id}/records`, options).then(r => r.json());
          if (Array.isArray(recs)) {
            allRecords.push(...recs.map(r => ({ ...r, investimento_id: inv.id })));
          }
        }
        setHistory(allRecords);
        console.log(`[InvestorPortal] Dados atualizados com sucesso via API.`);
      }
    } catch (err) {
      console.error('[InvestorPortal] Erro ao atualizar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFreshData();
  }, [investor?.id]);

  const handlePrint = useReactToPrint({ 
    contentRef: printRef,
    documentTitle: `Extrato_Investidor_${investor?.nome ? String(investor.nome).replace(/\s+/g, '_') : 'Inv'}`
  });

  const formatter = React.useMemo(() => new Intl.NumberFormat('pt-BR', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }), []);

  const formatarNum = (valor: number) => {
    return formatter.format(valor);
  };

  const formatarKz = (valor: number) => `${formatarNum(valor)} Kz`;

  // Função Universal de Cálculo de Histórico e Projeção Bancária (Sincronizada com Administrativo)
  const calculateProjectFullHistory = (project: any, currentRecords: any[]) => {
    if (!project) return { history: [], totals: { aumento: 0, juros: 0, iac: 0, comissao: 0, saque: 0, multa: 0, resultado: 0 } };
    
    const startDate = new Date(project.data_inicio);
    const numMonthsStr = project.duracao ? String(project.duracao).replace(/\D/g, '') : '12';
    const monthsElapsed = parseInt(numMonthsStr) || 12;
    const taxaVal = project.taxa?.toString().includes('3.5') ? 0.035 : 0.05;
    
    const capitalInicial = Number(project.capital_inicial);
    let currentPrincipal = capitalInicial;
    const history: any[] = [];
    
    // Acumuladores totais
    let totalAumentoAcum = 0;
    let totalJurosAcum = 0;
    let totalIACAcum = 0;
    let totalComissaoAcum = 0;
    let totalSaqueAcum = 0;
    let totalMultaAcum = 0;
    
    for (let i = 0; i < monthsElapsed; i++) {
        const targetDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
        const dateStr = targetDate.toISOString().split('T')[0];
      
        const monthRecords = currentRecords.filter(r => {
            const dateStrRec = String(r.data).split('T')[0];
            const [y, m] = dateStrRec.split('-').map(Number);
            return y === targetDate.getFullYear() && (m - 1) === targetDate.getMonth();
        });

        const tAumento = Number(monthRecords.reduce((acc, r) => acc + (Number(r.aumento) || 0), 0).toFixed(2));
        const tSaque   = Number(monthRecords.reduce((acc, r) => acc + (Number(r.saque)   || 0), 0).toFixed(2));
        const tMulta   = Number(monthRecords.reduce((acc, r) => acc + (Number(r.multa)   || 0), 0).toFixed(2));
        
        // Base de cálculo de Juro: Principal corrente + Aumento do mês
        const baseJuros = Number((currentPrincipal + tAumento).toFixed(2));
        
        // Valores registados (prevalecem sobre os calculados)
        const recordedJuros   = monthRecords.find(r => r.juros    !== undefined && r.juros    !== null)?.juros;
        const recordedIAC     = monthRecords.find(r => r.iac      !== undefined && r.iac      !== null)?.iac;
        const recordedComissao = monthRecords.find(r => r.comissao !== undefined && r.comissao !== null)?.comissao;

        const jurosBruto = recordedJuros    !== undefined ? Number(recordedJuros)    : Number((baseJuros * taxaVal).toFixed(2));
        const comissao   = recordedComissao !== undefined ? Number(recordedComissao) : Number((jurosBruto * 0.025).toFixed(2));
        const iacDoMes   = recordedIAC      !== undefined ? Number(recordedIAC)      : Number((jurosBruto * 0.10).toFixed(2));

        const capitalAbertura = currentPrincipal;
        // Actualizar principal com movimentos líquidos do mês (sem interferência dos encargos)
        currentPrincipal = Number((currentPrincipal + tAumento - tSaque - tMulta).toFixed(2));
        
        // Acumular tudo
        totalAumentoAcum  = Number((totalAumentoAcum  + tAumento).toFixed(2));
        totalJurosAcum    = Number((totalJurosAcum    + jurosBruto).toFixed(2));
        totalIACAcum      = Number((totalIACAcum      + iacDoMes).toFixed(2));
        totalComissaoAcum = Number((totalComissaoAcum + comissao).toFixed(2));
        totalSaqueAcum    = Number((totalSaqueAcum    + tSaque).toFixed(2));
        totalMultaAcum    = Number((totalMultaAcum    + tMulta).toFixed(2));

        // ─────────────────────────────────────────────────────────────────
        // RESULTADO FINAL (linha-a-linha para o extrato)
        // Fórmula: Capital Inicial + Aumentos + Juros − IAC − Comissão − Multas
        // (Saques já estão descontados no currentPrincipal)
        // ─────────────────────────────────────────────────────────────────
        const finalRowValue = Number((
          capitalInicial
          + totalAumentoAcum
          + totalJurosAcum
          - totalIACAcum
          - totalComissaoAcum
          - totalMultaAcum
          - totalSaqueAcum
        ).toFixed(2));

        history.push({
            data: dateStr,
            descricao: i === 0 ? "ESTRATÉGIA INICIAL" : "RENDIMENTO MENSAL",
            capitalInicial: capitalAbertura,
            aumento: tAumento,
            juros: jurosBruto,
            comissao,
            iac: iacDoMes,
            saque: tSaque,
            multa: tMulta,
            capitalFinal: finalRowValue
        });
    }
    
    // Resultado Final Total = Capital Inicial + ΣAumentos + ΣJuros − ΣIAC − ΣComissão − ΣMultas − ΣSaques
    const resultadoFinal = Number((
      capitalInicial
      + totalAumentoAcum
      + totalJurosAcum
      - totalIACAcum
      - totalComissaoAcum
      - totalMultaAcum
      - totalSaqueAcum
    ).toFixed(2));

    const totals = {
      aumento:   totalAumentoAcum,
      juros:     totalJurosAcum,
      comissao:  totalComissaoAcum,
      iac:       totalIACAcum,
      saque:     totalSaqueAcum,
      multa:     totalMultaAcum,
      resultado: resultadoFinal
    };
    
    return { history, totals };
  };

  // Processamento de dados globais (Soma de todos os contratos e respectivos históricos projetados)
  const allCalculated = (investments || []).map(p => calculateProjectFullHistory(p, history.filter(h => h.investimento_id === p.id)));
  
  const globalTotals = allCalculated.reduce((acc, calc) => ({
    investido: acc.investido + calc.totals.resultado,
    capitalInicialTotal: acc.capitalInicialTotal + Number(allCalculated[0]?.history[0]?.capitalInicial || 0),
    aumentos: acc.aumentos + calc.totals.aumento,
    juros: acc.juros + calc.totals.juros,
    comissao: acc.comissao + calc.totals.comissao,
    iac: acc.iac + calc.totals.iac,
    saques: acc.saques + calc.totals.saque,
    multas: acc.multas + calc.totals.multa
  }), { investido: 0, capitalInicialTotal: 0, aumentos: 0, juros: 0, comissao: 0, iac: 0, saques: 0, multas: 0 });

  // Adicionar um log para ajudar a depurar (invisível para o utilizador final)
  console.log(`[InvestorPortal] Processando ${investments?.length} investimentos. Total movimentos: ${history?.length}`);
  const totalInvestido = (investments || []).reduce((acc: number, p: any) => acc + (Number(p.capital_inicial) || 0), 0);
  const totalAumentos = globalTotals.aumentos;
  const totalJurosBruto = globalTotals.juros;
  const totalIacAcumulado = globalTotals.iac;
  const totalSaques = globalTotals.saques;
  const totalMultas = globalTotals.multas;
  const saldoDisponivel = allCalculated.reduce((acc, c) => acc + c.totals.resultado, 0);

  if (!investor) return null;

  return (
    <div className="min-h-screen bg-bg-deep text-white font-sans selection:bg-gold-primary/30">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-bg-deep/80 backdrop-blur-xl border-b border-white/5 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gold-primary rounded-xl flex items-center justify-center text-bg-deep shadow-[0_0_20px_rgba(212,175,55,0.3)]">
              <TrendingUp size={24} />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black text-white tracking-tight italic uppercase leading-none">Portal do <span className="text-gold-gradient">Investidor</span></span>
              <span className="text-[7px] font-black uppercase tracking-[0.4em] text-gold-primary/40 mt-1">Sessão Segura V.2026</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end mr-4">
              <span className="text-[10px] font-black text-white uppercase tracking-tight italic">{investor?.nome || 'Investidor'}</span>
              <span className="text-[8px] font-black text-gold-primary/40 uppercase tracking-widest">{investor?.numero_sequencial ? `INV-${investor.numero_sequencial.toString().padStart(3, '0')}/026` : (investor?.id || 'ID-PENDENTE')}</span>
            </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={fetchFreshData}
                    disabled={loading}
                    className={`p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all text-gold-primary/60 hover:text-gold-primary ${loading ? 'animate-spin' : ''}`}
                    title="Atualizar Dados"
                  >
                    <RefreshCw size={20} />
                  </button>
                  <button 
                    onClick={onLogout}
                    className="p-3 bg-rose-500/10 rounded-2xl hover:bg-rose-500/20 transition-all text-rose-500 group"
                  >
                    <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20 max-w-7xl mx-auto px-6">
        {/* Welcome Section */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div>
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-gold-primary/10 border border-gold-primary/20 rounded-full text-gold-primary text-[9px] font-black uppercase tracking-[0.3em] mb-4 italic">
              <ShieldCheck size={14} />
              Protocolo de Segurança Ativo
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white uppercase italic tracking-tight">
              Olá, <span className="text-gold-gradient">{String(investor?.nome || 'Investidor').split(' ')[0]}</span>.
            </h1>
            <p className="text-white/40 font-medium mt-4 text-sm max-w-xl">
              Bem-vindo ao seu dashboard privado. Aqui pode consultar o desempenho das suas aplicações e o histórico detalhado de movimentos.
            </p>
          </div>

          <button 
            onClick={handlePrint}
            className="flex items-center gap-3 px-8 py-5 bg-white/5 border border-white/10 rounded-[32px] text-white font-black text-[10px] uppercase tracking-widest hover:bg-gold-primary hover:text-bg-deep transition-all gold-glow"
          >
            <Printer size={18} /> Imprimir Extrato A4
          </button>
        </div>

        {/* --- APLICAÇÕES / CONTRATOS DO INVESTIDOR --- */}
        <div className="glass-panel p-8 rounded-[40px] border border-gold-primary/20 mb-12 bg-white/[0.02]">
           <h3 className="text-lg font-black text-gold-primary uppercase tracking-[0.3em] mb-8 italic flex items-center gap-3">
             <div className="w-8 h-8 bg-gold-primary/10 rounded-lg flex items-center justify-center text-gold-primary"><ShieldCheck size={18} /></div>
             Portal do <span className="text-gold-gradient">Investidor</span>
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse font-mono-table">
              <thead>
                <tr className="bg-white/5">
                   <th className="px-4 py-4 text-[9px] font-black text-white/40 uppercase tracking-widest border border-white/5">Nome / Título</th>
                   <th className="px-4 py-4 text-[9px] font-black text-white/40 uppercase tracking-widest border border-white/5">Datas (Início - Fim)</th>
                   <th className="px-4 py-4 text-[9px] font-black text-white/40 uppercase tracking-widest border border-white/5">Regime</th>
                   <th className="px-4 py-4 text-[9px] font-black text-white/40 uppercase tracking-widest border border-white/5">Capital Inicial</th>
                   <th className="px-4 py-4 text-[9px] font-black text-emerald-400 uppercase tracking-widest border border-white/5">Aumentos</th>
                   <th className="px-4 py-4 text-[9px] font-black text-rose-500 uppercase tracking-widest border border-white/5">Saques</th>
                   <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border border-white/5">Multas</th>
                   <th className="px-4 py-4 text-[9px] font-black text-gold-primary uppercase tracking-widest border border-white/5 font-bold bg-gold-primary/5 italic">Saldo Final</th>
                   <th className="px-4 py-4 text-[9px] font-black text-rose-400 uppercase tracking-widest border border-white/5">IAC (10%)</th>
                   <th className="px-4 py-4 text-[9px] font-black text-gold-primary uppercase tracking-widest border border-white/5">Comiss. (2.5%)</th>
                   <th className="px-4 py-4 text-[9px] font-black text-blue-400 uppercase tracking-widest border border-white/5">Juro Bruto</th>
                </tr>
              </thead>
              <tbody className="text-white divide-y divide-white/5">
                {investments.length > 0 ? investments.map(inv => {
                  const calc = calculateProjectFullHistory(inv, history.filter(h => h.investimento_id === inv.id));
                  const capIni = Number(inv.capital_inicial) || 0;

                  return (
                    <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-6 border border-white/5">
                        <span className="font-black text-[11px] block text-white italic">{investor?.nome || 'N/A'}</span>
                        <span className="text-[9px] font-black text-gold-primary/60 uppercase">{inv.titulo || `CONT-${inv.id?.toString().substring(0, 5)}`}</span>
                      </td>
                      <td className="px-4 py-6 border border-white/5 text-[10px] uppercase font-black text-white/60">
                         {inv.data_inicio ? new Date(inv.data_inicio).toLocaleDateString('pt-AO') : 'N/A'} <br/>
                         <span className="text-[8px] text-white/30">ATÉ</span> <br/>
                         {inv.data_fim ? new Date(inv.data_fim).toLocaleDateString('pt-AO') : 'N/A'}
                      </td>
                      <td className="px-4 py-6 border border-white/5 text-[10px] font-black text-white/80 uppercase">
                         {inv.regime}<br/>
                         <span className="text-[8px] text-gold-primary">{inv.taxa}%</span>
                      </td>
                      <td className="px-4 py-6 border border-white/5 font-black text-sm">{formatarNum(capIni)}</td>
                      <td className="px-4 py-6 border border-white/5 font-black text-[12px] text-emerald-400">+{formatarNum(calc.totals.aumento)}</td>
                      <td className="px-4 py-6 border border-white/5 font-black text-[12px] text-rose-500">-{formatarNum(calc.totals.saque)}</td>
                      <td className="px-4 py-6 border border-white/5 font-black text-[12px] text-slate-400">-{formatarNum(calc.totals.multa)}</td>
                      <td className="px-4 py-6 border border-white/5 font-black text-xl text-gold-primary italic bg-gold-primary/5">{formatarNum(calc.totals.resultado)}</td>
                      <td className="px-4 py-6 border border-white/5 font-black text-[12px] text-rose-400">-{formatarNum(calc.totals.iac)}</td>
                      <td className="px-4 py-6 border border-white/5 font-black text-[12px] text-gold-primary">-{formatarNum(calc.totals.comissao)}</td>
                      <td className="px-4 py-6 border border-white/5 font-black text-[12px] text-blue-400">+{formatarNum(calc.totals.juros)}</td>
                    </tr>
                  )
                }) : (
                   <tr>
                     <td colSpan={11} className="py-12 text-center text-[10px] font-black uppercase text-white/40 tracking-widest">Nenhuma aplicação registada</td>
                   </tr>
                )}
                <tr className="bg-white/5 border-t-2 border-gold-primary/20">
                  <td colSpan={3} className="px-4 py-6 font-black text-xs uppercase text-gold-primary text-right tracking-widest">TOTAIS CONSOLIDADOS:</td>
                  <td className="px-4 py-6 font-black text-sm text-white">{formatarNum(totalInvestido)}</td>
                  <td className="px-4 py-6 font-black text-sm text-emerald-400">+{formatarNum(totalAumentos)}</td>
                  <td className="px-4 py-6 font-black text-sm text-rose-500">-{formatarNum(totalSaques)}</td>
                  <td className="px-4 py-6 font-black text-sm text-slate-400">-{formatarNum(totalMultas)}</td>
                  <td className="px-4 py-6 font-black text-xl text-gold-primary italic bg-gold-primary/10">{formatarNum(saldoDisponivel)}</td>
                  <td className="px-4 py-6 font-black text-sm text-rose-400">-{formatarNum(totalIacAcumulado)}</td>
                  <td className="px-4 py-6 font-black text-sm text-gold-primary">-{formatarNum(globalTotals.comissao)}</td>
                  <td className="px-4 py-6 font-black text-sm text-blue-400">+{formatarNum(totalJurosBruto)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Cards - Layout VIP Reordenado */}
        <div className="flex flex-col lg:flex-row gap-8 mb-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
           {/* SALDO LÍQUIDO (Destaque) */}
           <div className="lg:w-1/3 glass-panel p-10 rounded-[45px] border border-gold-primary/30 relative overflow-hidden group hover:border-gold-primary transition-all gold-glow bg-gold-primary/5">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <Wallet size={80} className="text-gold-primary" />
            </div>
            <p className="text-[11px] font-black text-gold-primary uppercase tracking-[0.4em] mb-4 italic flex items-center gap-2">
              <ShieldCheck size={14} /> Saldo Líquido Total
            </p>
            <h3 className="text-5xl font-black text-white tracking-tighter italic pb-4 font-mono-table drop-shadow-2xl">
              {formatarKz(saldoDisponivel)}
            </h3>
            <div className="flex items-center gap-3 mt-4">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
              <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest italic">Património Atualizado</span>
            </div>
          </div>

          {/* Grelha de Indicadores de Fluxo */}
          <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-6">
             {/* 1. Depósito */}
             <div className="glass-panel p-6 rounded-[35px] border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all">
                <span className="text-[9px] font-black uppercase text-emerald-400 pl-1 tracking-widest opacity-40 block mb-2 flex items-center gap-2">
                   <ArrowUpRight size={12} /> Total Depósitos
                </span>
                <span className="text-xl font-black text-emerald-500 font-display">{formatarKz(totalAumentos)}</span>
             </div>

             {/* 2. Saque */}
             <div className="glass-panel p-6 rounded-[35px] border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all">
                <span className="text-[9px] font-black uppercase text-rose-500 pl-1 tracking-widest opacity-40 block mb-2 flex items-center gap-2">
                   <ExternalLink size={12} /> Total Saques
                </span>
                <span className="text-xl font-black text-rose-500 font-display">-{formatarKz(totalSaques)}</span>
             </div>

             {/* 3. Multa */}
             <div className="glass-panel p-6 rounded-[35px] border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all">
                <span className="text-[9px] font-black uppercase text-slate-400 pl-1 tracking-widest opacity-40 block mb-2 flex items-center gap-2">
                   <AlertCircle size={12} /> Total Multas
                </span>
                <span className="text-xl font-black text-slate-300 font-display">-{formatarKz(totalMultas)}</span>
             </div>

             {/* 4. Juro Bruto */}
             <div className="glass-panel p-6 rounded-[35px] border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all">
                <span className="text-[9px] font-black uppercase text-blue-400 pl-1 tracking-widest opacity-40 block mb-2 flex items-center gap-2">
                   <TrendingUp size={12} /> Juro Bruto Acum.
                </span>
                <span className="text-xl font-black text-blue-400 font-display">+{formatarKz(totalJurosBruto)}</span>
             </div>

             {/* 5. Comissão */}
             <div className="glass-panel p-6 rounded-[35px] border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all">
                <span className="text-[9px] font-black uppercase text-gold-primary pl-1 tracking-widest opacity-40 block mb-2 flex items-center gap-2">
                   <Briefcase size={12} /> Total Comissões
                </span>
                <span className="text-xl font-black text-gold-primary font-display">-{formatarKz(globalTotals.comissao)}</span>
             </div>

             {/* 6. IAC */}
             <div className="glass-panel p-6 rounded-[35px] border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all">
                <span className="text-[9px] font-black uppercase text-rose-400 pl-1 tracking-widest opacity-40 block mb-2 flex items-center gap-2">
                   <ShieldCheck size={12} /> Total IAC Retido
                </span>
                <span className="text-xl font-black text-rose-400 font-display">-{formatarKz(totalIacAcumulado)}</span>
             </div>
          </div>
        </div>

        {/* Statement Section */}
        <div className="glass-panel rounded-[48px] border border-white/5 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-gold-primary border border-white/5">
                <FileText size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-white uppercase italic tracking-[0.2em]">Extrato de movimento da conta</h3>
                <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Todos os lançamentos, rendimentos e impostos aplicados</p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono-table">
              <thead>
                <tr className="bg-white/[0.01]">
                  <th className="px-8 py-6 text-[10px] font-black text-gold-primary uppercase tracking-[0.3em] italic">Referência</th>
                  <th className="px-8 py-6 text-[10px] font-black text-gold-primary uppercase tracking-[0.3em] italic">Descrição</th>
                  <th className="px-8 py-6 text-[10px] font-black text-white/40 uppercase tracking-[0.3em] italic text-right">Saldo Inicial</th>
                  <th className="px-8 py-6 text-[10px] font-black text-gold-primary uppercase tracking-[0.3em] italic text-right">Depósitos</th>
                  <th className="px-8 py-6 text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] italic text-right">Saques</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] italic text-right">Multas</th>
                  <th className="px-8 py-6 text-[10px] font-black text-white uppercase tracking-[0.3em] italic text-right font-bold bg-white/5">Saldo Final</th>
                  <th className="px-8 py-6 text-[10px] font-black text-rose-400 uppercase tracking-[0.3em] italic text-right">IAC (10%)</th>
                  <th className="px-8 py-6 text-[10px] font-black text-gold-primary uppercase tracking-[0.3em] italic text-right">Comissão</th>
                  <th className="px-8 py-6 text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] italic text-right">Juro Bruto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {allCalculated.flatMap(calc => calc.history).sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()).map((row, i) => (
                    <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-8 py-5">
                        <span className="text-xs font-black text-white group-hover:text-gold-primary transition-colors flex flex-col gap-1 uppercase">
                          <span>{new Date(row.data).toLocaleDateString('pt-AO', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                          {row.created_at && row.descricao !== `RENDIMENTO MENSAL` && (
                            <span className="text-[9px] text-white/40 tracking-widest lowercase bg-white/5 py-1 px-2 rounded-md self-start border border-white/5">
                              {new Date(row.created_at).toLocaleString('pt-AO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest italic truncate block max-w-[150px]">{row.descricao}</span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <span className="text-xs font-black text-white/40">
                          {formatarKz(row.capitalInicial)}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <span className={`text-xs font-black ${row.aumento > 0 ? 'text-emerald-500' : 'text-white/10 italic'}`}>
                          {row.aumento > 0 ? `+${formatarKz(row.aumento)}` : '---'}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <span className={`text-xs font-black ${row.saque > 0 ? 'text-rose-500' : 'text-white/10 italic'}`}>
                          {row.saque > 0 ? `-${formatarKz(row.saque)}` : '---'}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <span className={`text-xs font-black ${row.multa > 0 ? 'text-slate-300' : 'text-white/10 italic'}`}>
                          {row.multa > 0 ? `-${formatarKz(row.multa)}` : '---'}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right bg-white/5">
                        <span className="text-sm font-black text-white italic bg-white/5 px-3 py-1 rounded-lg">
                          {formatarKz(row.capitalFinal)}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <span className={`text-xs font-black ${row.iac > 0 ? 'text-rose-400' : 'text-white/10 italic'}`}>
                          {row.iac > 0 ? `-${formatarKz(row.iac)}` : '---'}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <span className={`text-xs font-black ${row.comissao > 0 ? 'text-gold-primary' : 'text-white/10 italic'}`}>
                          {row.comissao > 0 ? `-${formatarKz(row.comissao)}` : '---'}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <span className={`text-xs font-black ${row.juros > 0 ? 'text-blue-400' : 'text-white/10 italic'}`}>
                          {row.juros > 0 ? `+${formatarKz(row.juros)}` : '---'}
                        </span>
                      </td>
                    </tr>
                  ))
                }
                {allCalculated.flatMap(calc => calc.history).length > 0 && (
                  <tr className="bg-white/5 border-t-2 border-white/10">
                    <td colSpan={3} className="px-8 py-6 text-[10px] font-black text-gold-primary uppercase tracking-[0.3em] italic">Consolidado Acumulado</td>
                    <td className="px-8 py-6 text-right font-black text-emerald-500 text-xs">
                      {formatarKz(allCalculated.flatMap(calc => calc.history).reduce((acc, r) => acc + (r.aumento || 0), 0))}
                    </td>
                    <td className="px-8 py-6 text-right font-black text-rose-500 text-xs">
                      -{formatarKz(allCalculated.flatMap(calc => calc.history).reduce((acc, r) => acc + (r.saque || 0), 0))}
                    </td>
                    <td className="px-8 py-6 text-right font-black text-slate-300 text-xs">
                      -{formatarKz(allCalculated.flatMap(calc => calc.history).reduce((acc, r) => acc + (r.multa || 0), 0))}
                    </td>
                    <td className="px-8 py-6 text-right font-black text-white text-sm italic bg-white/5">
                      {formatarKz(allCalculated.flatMap(calc => calc.history).length > 0 ? allCalculated.flatMap(calc => calc.history)[allCalculated.flatMap(calc => calc.history).length - 1].capitalFinal : 0)}
                    </td>
                    <td className="px-8 py-6 text-right font-black text-rose-400 text-xs">
                      -{formatarKz(allCalculated.flatMap(calc => calc.history).reduce((acc, r) => acc + (r.iac || 0), 0))}
                    </td>
                    <td className="px-8 py-6 text-right font-black text-gold-primary text-xs">
                      -{formatarKz(allCalculated.flatMap(calc => calc.history).reduce((acc, r) => acc + (r.comissao || 0), 0))}
                    </td>
                    <td className="px-8 py-6 text-right font-black text-blue-400 text-xs">
                      {formatarKz(allCalculated.flatMap(calc => calc.history).reduce((acc, r) => acc + (r.juros || 0), 0))}
                    </td>
                  </tr>
                )}
                {allCalculated.flatMap(calc => calc.history).length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-8 py-20 text-center text-white/10 font-black uppercase tracking-[0.4em] italic text-xs">
                      Nenhum movimento registado até ao momento.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="py-12 border-t border-white/5 opacity-40">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-[8px] font-black text-white uppercase tracking-[0.5em] italic">
            © 2026 VENDA PLUS RETAIL CLOUD &bull; SISTEMA DE GESTÃO PATRIMONIAL CERTIFICADO
          </p>
        </div>
      </footer>

      {/* --- HIDDEN PRINT TEMPLATE (A4 PREMIUM VERSION) --- */}
      <div className="hidden">
        <div ref={printRef} className="p-16 text-[#002855] bg-white min-h-[297mm] font-sans" style={{ width: '210mm' }}>
          <div className="flex justify-between items-start mb-12 border-b-[8px] border-[#002855] pb-8">
            <div className="flex gap-6 items-center">
              <img src="/logo_amazing.png" alt="Logo" className="h-20 object-contain" />
              <div>
                <h1 className="text-3xl font-black text-[#002855] uppercase tracking-tighter">Extrato de Movimentação Financeira</h1>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Documento Oficial de Consulta do Investidor</p>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-[#002855] text-white px-6 py-2 rounded-lg font-black text-xs inline-block mb-2">PRIVATE BANKING</div>
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Referência</p>
              <p className="font-bold text-[#002855] tracking-widest">{investor?.numero_sequencial ? `INV-${investor.numero_sequencial.toString().padStart(3, '0')}/026` : (investor?.id || '---')}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-x-12 gap-y-6 mb-12 bg-slate-50 p-10 rounded-3xl border border-slate-100 shadow-sm">
            <div>
              <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1">Titular da Conta:</p>
              <p className="text-xl font-black text-[#002855] uppercase italic">{investor?.nome || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1">Moeda Corrente:</p>
              <p className="text-xl font-black text-[#002855] uppercase italic">Kwanza (AOA)</p>
            </div>
          </div>

          {/* TABLE RESUMO ESTRATÉGICO */}
          <div className="mb-10 overflow-hidden rounded-2xl border-2 border-[#002855]">
             <div className="bg-[#002855] text-white py-4 px-6 text-[10px] font-black uppercase tracking-[0.3em] flex justify-between items-center shadow-lg">
               <span>Contratos Ativos e Perfomance Global</span>
             </div>
             <table className="w-full text-center border-collapse text-[9px] font-bold text-[#002855]">
               <thead className="bg-slate-100 border-b-2 border-slate-300">
                 <tr className="text-[#002855]/70 uppercase tracking-widest">
                   <th className="py-4 px-2 border-r border-slate-200">Titulo</th>
                   <th className="py-4 px-2 border-r border-slate-200">Regime</th>
                   <th className="py-4 px-2 border-r border-slate-200">Início-Fim</th>
                   <th className="py-4 px-2 border-r border-slate-200">Inicial</th>
                   <th className="py-4 px-2 border-r border-slate-200 text-emerald-700">Aumentos</th>
                   <th className="py-4 px-2 border-r border-slate-200 text-rose-500">Saques</th>
                   <th className="py-4 px-2 border-r border-slate-200 text-slate-500">Multas</th>
                   <th className="py-4 px-2 border-r border-slate-200 font-black italic bg-slate-200">Final</th>
                   <th className="py-4 px-2 border-r border-slate-200 text-rose-700">IAC</th>
                   <th className="py-4 px-2 border-r border-slate-200 text-amber-700">Comiss.</th>
                   <th className="py-4 px-2">Juros</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-200">
                 {investments.map((inv) => {
                   const calc = calculateProjectFullHistory(inv, history.filter(h => h.investimento_id === inv.id));
                   const capIni = Number(inv.capital_inicial) || 0;

                   return (
                     <tr key={inv.id} className="hover:bg-slate-50">
                       <td className="py-4 px-2 border-r border-slate-200">{inv.titulo}</td>
                       <td className="py-4 px-2 border-r border-slate-200">{inv.regime} {inv.taxa}%</td>
                       <td className="py-4 px-2 border-r border-slate-200 text-[8px]">{inv.data_inicio ? new Date(inv.data_inicio).toLocaleDateString('pt-AO'):''} a {inv.data_fim ? new Date(inv.data_fim).toLocaleDateString('pt-AO'):''}</td>
                       <td className="py-4 px-2 border-r border-slate-200">{formatarNum(capIni)}</td>
                       <td className="py-4 px-2 border-r border-slate-200 text-emerald-700">+{formatarNum(calc.totals.aumento)}</td>
                       <td className="py-4 px-2 border-r border-slate-200 text-rose-500">-{formatarNum(calc.totals.saque)}</td>
                       <td className="py-4 px-2 border-r border-slate-200 text-slate-500">-{formatarNum(calc.totals.multa)}</td>
                       <td className="py-4 px-2 border-r border-slate-200 italic font-black text-[#002855] bg-slate-50">{formatarNum(calc.totals.resultado)}</td>
                       <td className="py-4 px-2 border-r border-slate-200 text-rose-700">-{formatarNum(calc.totals.iac)}</td>
                       <td className="py-4 px-2 border-r border-slate-200 text-amber-700">-{formatarNum(calc.totals.comissao)}</td>
                       <td className="py-4 px-2 text-blue-700">+{formatarNum(calc.totals.juros)}</td>
                     </tr>
                   );
                 })}
                 <tr className="bg-slate-100 border-t-2 border-[#002855] uppercase text-[10px]">
                   <td colSpan={3} className="py-4 px-2 font-black text-right border-r border-slate-300">TOTAIS:</td>
                   <td className="py-4 px-2 font-black border-r border-slate-300">{formatarNum(totalInvestido)}</td>
                   <td className="py-4 px-2 font-black text-emerald-700 border-r border-slate-300">+{formatarNum(totalAumentos)}</td>
                   <td className="py-4 px-2 font-black text-rose-500 border-r border-slate-300">-{formatarNum(totalSaques)}</td>
                   <td className="py-4 px-2 font-black text-slate-500 border-r border-slate-300">-{formatarNum(totalMultas)}</td>
                   <td className="py-4 px-2 font-black text-lg italic text-[#002855] bg-slate-200 border-r border-slate-300">{formatarNum(saldoDisponivel)}</td>
                   <td className="py-4 px-2 font-black text-rose-700 border-r border-slate-300">-{formatarNum(totalIacAcumulado)}</td>
                   <td className="py-4 px-2 font-black text-amber-700 border-r border-slate-300">-{formatarNum(globalTotals.comissao)}</td>
                   <td className="p-4 border-r border-slate-300 text-blue-700">+{formatarNum(totalJurosBruto)}</td>
                 </tr>
               </tbody>
             </table>
          </div>

          <div className="mb-4 text-[11px] font-black text-[#002855] uppercase tracking-[0.4em] border-l-8 border-gold-primary pl-4 italic">Historial de Fluxo e Tributação Detalhado</div>
          <table className="w-full border-collapse border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <thead className="bg-[#002855]/5 text-[#002855]">
              <tr className="text-[9px] font-black uppercase tracking-widest text-center">
                <th className="p-4 border border-slate-300">Data</th>
                <th className="p-4 border border-slate-300">Descrição</th>
                <th className="p-4 border border-slate-300 text-right">Saldo Inicial</th>
                <th className="p-4 border border-slate-300 text-right">Depósitos</th>
                <th className="p-4 border border-slate-300 text-right text-rose-500">Saques</th>
                <th className="p-4 border border-slate-300 text-right text-slate-500">Multas</th>
                <th className="p-4 border border-slate-300 text-right font-bold bg-slate-100">Saldo Final</th>
                <th className="p-4 border border-slate-300 text-right text-rose-600">IAC</th>
                <th className="p-4 border border-slate-300 text-right text-gold-600">Comiss.</th>
                <th className="p-4 border border-slate-300 text-right">Juros (Bruto)</th>
              </tr>
            </thead>
            <tbody>
              {allCalculated.flatMap(calc => calc.history).sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()).map((row, idx) => (
                <tr key={idx} className="border border-slate-200 odd:bg-white even:bg-slate-50/50">
                  <td className="p-3 text-[9px] font-black uppercase italic text-center">
                    <span>{new Date(row.data).toLocaleDateString('pt-AO', { month: 'short', year: 'numeric' })}</span>
                  </td>
                  <td className="p-3 text-[9px] font-bold uppercase text-[#002855] text-center italic leading-tight">{row.descricao}</td>
                  <td className="p-3 text-[9px] text-right font-bold text-slate-400">{formatarNum(row.capitalInicial)}</td>
                  <td className="p-3 text-[9px] text-right font-black text-emerald-700">{row.aumento > 0 ? formatarNum(row.aumento) : '---'}</td>
                  <td className="p-3 text-[9px] text-right font-black text-rose-500">{row.saque > 0 ? `-${formatarNum(row.saque)}` : '---'}</td>
                  <td className="p-3 text-[9px] text-right font-black text-slate-500">{row.multa > 0 ? `-${formatarNum(row.multa)}` : '---'}</td>
                  <td className="p-3 text-[9px] text-right font-black text-[#002855] bg-slate-100">{formatarNum(row.capitalFinal)}</td>
                  <td className="p-3 text-[9px] text-right font-black text-rose-600">{row.iac > 0 ? `-${formatarNum(row.iac)}` : '---'}</td>
                  <td className="p-3 text-[9px] text-right font-black text-amber-600">{row.comissao > 0 ? `-${formatarNum(row.comissao)}` : '---'}</td>
                  <td className="p-3 text-[9px] text-right font-black text-blue-700">{row.juros > 0 ? formatarNum(row.juros) : '---'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-[#002855] text-white">
              <tr className="text-[9px] font-black uppercase tracking-[0.2em]">
                <td colSpan={3} className="p-4 border border-[#002855] text-center">TOTAIS DE FLUXO E RETENÇÃO</td>
                <td className="p-4 border border-[#002855] text-right">+{formatarNum(totalAumentos)}</td>
                <td className="p-4 border border-[#002855] text-right text-rose-200">-{formatarNum(totalSaques)}</td>
                <td className="p-4 border border-[#002855] text-right text-slate-300">-{formatarNum(totalMultas)}</td>
                <td className="p-4 border border-[#002855] text-right italic font-black bg-white/10">{formatarNum(saldoDisponivel)}</td>
                <td className="p-4 border border-[#002855] text-right text-rose-300">-{formatarNum(totalIacAcumulado)}</td>
                <td className="p-4 border border-[#002855] text-right text-gold-300">-{formatarNum(globalTotals.comissao)}</td>
                <td className="p-4 border border-[#002855] text-right">+{formatarNum(totalJurosBruto)}</td>
              </tr>
            </tfoot>
          </table>

          <div className="mt-20 flex justify-between items-end border-t border-slate-100 pt-12">
            <div className="max-w-[300px]">
                <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.4em] mb-4">Certificação Bancária</p>
                <img src="/logo_amazing.png" alt="Stamp" className="h-14 opacity-20 grayscale border-2 border-slate-400 p-2 rounded-xl" />
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-[#002855] uppercase italic mb-1">Emitido em: {new Date().toLocaleString('pt-AO')}</p>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.5em]">VENDA PLUS ASSET MANAGEMENT SYSTEM</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
