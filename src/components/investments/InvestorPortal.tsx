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
  Briefcase,
  Clock
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
  const [statementTab, setStatementTab] = useState<'monthly' | 'detailed'>('monthly');
  const printRef = useRef<HTMLDivElement>(null);

  const fetchFreshData = async () => {
    if (!investor?.id) return;
    setLoading(true);
    try {
      console.log(`[InvestorPortal] Buscando dados atualizados para o investidor ${investor.id}...`);

      const options = { headers: { 'Authorization': `Bearer ${token}` } };

      const invRes = await api.get(`/api/applications?investor_id=${investor.id}`, options).then(r => r.json());
      if (Array.isArray(invRes)) {
        setInvestments(invRes);

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

  const calculateProjectFullHistory = (project: any, currentRecords: any[]) => {
    if (!project) return { history: [], totals: { aumento: 0, juros: 0, iac: 0, comissao: 0, saque: 0, multa: 0, resultado: 0 } };

    const startDate = new Date(project.data_inicio);
    const numMonthsStr = project.duracao ? String(project.duracao).replace(/\D/g, '') : '12';
    const monthsElapsed = parseInt(numMonthsStr) || 12;
    const taxaVal = project.taxa?.toString().includes('3.5') ? 0.035 : 0.05;

    const capitalInicial = Number(project.capital_inicial);
    let currentPrincipal = capitalInicial;
    let totalAumentoAcum = 0;
    let totalJurosAcum = 0;
    let totalIACAcum = 0;
    let totalComissaoAcum = 0;
    let totalSaqueAcum = 0;
    let totalMultaAcum = 0;
    const history: any[] = [];

    for (let i = 0; i < monthsElapsed; i++) {
      const targetDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
      const dateStr = targetDate.toISOString().split('T')[0];

      const monthRecords = currentRecords.filter(r => {
        const dateStrRec = String(r.data).split('T')[0];
        const [y, m] = dateStrRec.split('-').map(Number);
        return y === targetDate.getFullYear() && (m - 1) === targetDate.getMonth();
      });

      const tAumento = Number(monthRecords.reduce((acc, r) => acc + (Number(r.aumento) || 0), 0).toFixed(2));
      const tSaque = Number(monthRecords.reduce((acc, r) => acc + (Number(r.saque) || 0), 0).toFixed(2));
      const tMulta = Number(monthRecords.reduce((acc, r) => acc + (Number(r.multa) || 0), 0).toFixed(2));

      const baseJuros = taxaVal === 0.05
        ? Number((currentPrincipal + totalJurosAcum + tAumento).toFixed(2))
        : Number((currentPrincipal + tAumento).toFixed(2));

      const recordedJuros = monthRecords.find(r => r.juros !== undefined && r.juros !== null)?.juros;
      const recordedIAC = monthRecords.find(r => r.iac !== undefined && r.iac !== null)?.iac;
      const recordedComissao = monthRecords.find(r => r.comissao !== undefined && r.comissao !== null)?.comissao;

      const jurosBruto = recordedJuros !== undefined ? Number(recordedJuros) : Number((baseJuros * taxaVal).toFixed(2));
      const comissao = recordedComissao !== undefined ? Number(recordedComissao) : Number((jurosBruto * 0.025).toFixed(2));
      const iacDoMes = recordedIAC !== undefined ? Number(recordedIAC) : Number((jurosBruto * 0.10).toFixed(2));

      totalAumentoAcum = Number((totalAumentoAcum + tAumento).toFixed(2));
      totalJurosAcum = Number((totalJurosAcum + jurosBruto).toFixed(2));
      totalIACAcum = Number((totalIACAcum + iacDoMes).toFixed(2));
      totalComissaoAcum = Number((totalComissaoAcum + comissao).toFixed(2));
      totalSaqueAcum = Number((totalSaqueAcum + tSaque).toFixed(2));
      totalMultaAcum = Number((totalMultaAcum + tMulta).toFixed(2));

      const capitalAbertura = currentPrincipal;
      currentPrincipal = Number((currentPrincipal + tAumento - tSaque - tMulta).toFixed(2));

      const finalRowValue = Number((
        currentPrincipal
        + totalJurosAcum
        - totalIACAcum
        - totalComissaoAcum
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

    const resultadoFinal = Number((currentPrincipal + totalJurosAcum - totalIACAcum - totalComissaoAcum).toFixed(2));

    const totals = {
      capitalInicial,
      aumento: totalAumentoAcum,
      juros: totalJurosAcum,
      comissao: totalComissaoAcum,
      iac: totalIACAcum,
      saque: totalSaqueAcum,
      multa: totalMultaAcum,
      resultado: resultadoFinal
    };

    return { history, totals };
  };

  const allCalculated = (investments || []).map(p => calculateProjectFullHistory(p, history.filter(h => h.investimento_id === p.id)));

  const globalTotals = allCalculated.reduce((acc, calc) => ({
    investido: acc.investido + calc.totals.resultado,
    capitalInicialTotal: acc.capitalInicialTotal + Number(calc.totals.capitalInicial || 0),
    aumentos: acc.aumentos + calc.totals.aumento,
    juros: acc.juros + calc.totals.juros,
    comissao: acc.comissao + calc.totals.comissao,
    iac: acc.iac + calc.totals.iac,
    saques: acc.saques + calc.totals.saque,
    multas: acc.multas + calc.totals.multa
  }), { investido: 0, capitalInicialTotal: 0, aumentos: 0, juros: 0, comissao: 0, iac: 0, saques: 0, multas: 0 });

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
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div>
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="inline-flex items-center gap-3 px-4 py-2 bg-gold-primary/10 border border-gold-primary/20 rounded-full text-gold-primary text-[9px] font-black uppercase tracking-[0.3em] italic">
                <ShieldCheck size={14} />
                Protocolo AES-256 + SSL Ativo
              </div>
              <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-white/40 text-[9px] font-black uppercase tracking-[0.3em] italic">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Sessão Encriptada Ponta-a-Ponta
              </div>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white uppercase italic tracking-tight">
              Olá, <span className="text-gold-gradient">{investor?.nome || 'Investidor'}</span>.
            </h1>
            
            <div className="flex flex-wrap gap-4 mt-6">
              <div className="flex items-center gap-3 px-5 py-3 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
                <Calendar className="text-gold-primary" size={20} />
                <div>
                  <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] leading-none mb-1">Início do Contrato</p>
                  <p className="text-xs font-black text-white uppercase tracking-tight">
                    {investments.length > 0 && investments[0].data_inicio 
                      ? new Date(investments[0].data_inicio).toLocaleDateString('pt-AO', { day: '2-digit', month: 'long', year: 'numeric' }) 
                      : '---'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-5 py-3 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
                <Clock className="text-gold-primary" size={20} />
                <div>
                  <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] leading-none mb-1">Término do Contrato</p>
                  <p className="text-xs font-black text-white uppercase tracking-tight">
                    {investments.length > 0 && investments[0].data_fim 
                      ? new Date(investments[0].data_fim).toLocaleDateString('pt-AO', { day: '2-digit', month: 'long', year: 'numeric' }) 
                      : '---'}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-white/40 font-medium mt-8 text-sm max-w-xl leading-relaxed">
              Bem-vindo ao seu portal de gestão patrimonial. A Amazing Corporation, Lda utiliza rigorosos protocolos de segurança e transparência para garantir a proteção total dos seus ativos, com acesso detalhado ao desempenho e histórico das suas operações.
            </p>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-3 px-8 py-5 bg-white/5 border border-white/10 rounded-[32px] text-white font-black text-[10px] uppercase tracking-widest hover:bg-gold-primary hover:text-bg-deep transition-all gold-glow"
          >
            <Printer size={18} /> Imprimir Extrato A4
          </button>
        </div>

        <div className="glass-panel p-8 rounded-[40px] border border-gold-primary/20 mb-12 bg-white/[0.02]">
          <h3 className="text-lg font-black text-gold-primary uppercase tracking-[0.3em] mb-8 italic flex items-center gap-3">
            <div className="w-8 h-8 bg-gold-primary/10 rounded-lg flex items-center justify-center text-gold-primary"><ShieldCheck size={18} /></div>
            CONTRATOS ATIVOS E <span className="text-gold-gradient">PERFORMANCE GLOBAL</span>
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
                        {inv.data_inicio ? new Date(inv.data_inicio).toLocaleDateString('pt-AO') : 'N/A'} <br />
                        <span className="text-[8px] text-white/30">ATÉ</span> <br />
                        {inv.data_fim ? new Date(inv.data_fim).toLocaleDateString('pt-AO') : 'N/A'}
                      </td>
                      <td className="px-4 py-6 border border-white/5 text-[10px] font-black text-white/80 uppercase">
                        {inv.regime}<br />
                        <span className="text-[8px] text-gold-primary">{inv.taxa}</span>
                      </td>
                      <td className="px-4 py-6 border border-white/5 font-black text-sm whitespace-nowrap">{formatarNum(capIni)} <span className="text-[8px] opacity-30">Kz</span></td>
                      <td className="px-4 py-6 border border-white/5 font-black text-[12px] text-emerald-400 whitespace-nowrap">+{formatarNum(calc.totals.aumento)} <span className="text-[8px] opacity-30">Kz</span></td>
                      <td className="px-4 py-6 border border-white/5 font-black text-[12px] text-rose-500 whitespace-nowrap">-{formatarNum(calc.totals.saque)} <span className="text-[8px] opacity-30">Kz</span></td>
                      <td className="px-4 py-6 border border-white/5 font-black text-[12px] text-slate-400 whitespace-nowrap">-{formatarNum(calc.totals.multa)} <span className="text-[8px] opacity-30">Kz</span></td>
                      <td className="px-4 py-6 border border-white/5 font-black text-xl text-gold-primary italic bg-gold-primary/5 whitespace-nowrap">{formatarNum(calc.totals.resultado)} <span className="text-[10px] opacity-30 not-italic">Kz</span></td>
                      <td className="px-4 py-6 border border-white/5 font-black text-[12px] text-rose-400 whitespace-nowrap">-{formatarNum(calc.totals.iac)} <span className="text-[8px] opacity-30">Kz</span></td>
                      <td className="px-4 py-6 border border-white/5 font-black text-[12px] text-gold-primary whitespace-nowrap">-{formatarNum(calc.totals.comissao)} <span className="text-[8px] opacity-30">Kz</span></td>
                      <td className="px-4 py-6 border border-white/5 font-black text-[12px] text-blue-400 whitespace-nowrap">+{formatarNum(calc.totals.juros)} <span className="text-[8px] opacity-30">Kz</span></td>
                    </tr>
                  )
                }) : (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-[10px] font-black uppercase text-white/40 tracking-widest">Nenhuma aplicação registada</td>
                  </tr>
                )}
                <tr className="bg-white/5 border-t-2 border-gold-primary/20">
                  <td colSpan={3} className="px-4 py-6 font-black text-xs uppercase text-gold-primary text-right tracking-widest">TOTAIS CONSOLIDADOS:</td>
                  <td className="px-4 py-6 font-black text-sm text-white whitespace-nowrap">{formatarNum(totalInvestido)} <span className="text-[8px] opacity-30">Kz</span></td>
                  <td className="px-4 py-6 font-black text-sm text-emerald-400 whitespace-nowrap">+{formatarNum(totalAumentos)} <span className="text-[8px] opacity-30">Kz</span></td>
                  <td className="px-4 py-6 font-black text-sm text-rose-500 whitespace-nowrap">-{formatarNum(totalSaques)} <span className="text-[8px] opacity-30">Kz</span></td>
                  <td className="px-4 py-6 font-black text-sm text-slate-400 whitespace-nowrap">-{formatarNum(totalMultas)} <span className="text-[8px] opacity-30">Kz</span></td>
                  <td className="px-4 py-6 font-black text-xl text-gold-primary italic bg-gold-primary/10 whitespace-nowrap">{formatarNum(saldoDisponivel)} <span className="text-[10px] opacity-30 not-italic">Kz</span></td>
                  <td className="px-4 py-6 font-black text-sm text-rose-400 whitespace-nowrap">-{formatarNum(totalIacAcumulado)} <span className="text-[8px] opacity-30">Kz</span></td>
                  <td className="px-4 py-6 font-black text-sm text-gold-primary whitespace-nowrap">-{formatarNum(globalTotals.comissao)} <span className="text-[8px] opacity-30">Kz</span></td>
                  <td className="px-4 py-6 font-black text-sm text-blue-400 whitespace-nowrap">+{formatarNum(totalJurosBruto)} <span className="text-[8px] opacity-30">Kz</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 mb-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div className="lg:w-1/3 glass-panel p-10 rounded-[45px] border border-gold-primary/30 relative overflow-hidden group hover:border-gold-primary transition-all gold-glow bg-gold-primary/5">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <Wallet size={80} className="text-gold-primary" />
            </div>
            <p className="text-[11px] font-black text-gold-primary uppercase tracking-[0.4em] mb-4 italic flex items-center gap-2">
              <ShieldCheck size={14} /> Saldo Líquido Total
            </p>
            <h3 className="text-5xl font-black text-white tracking-tighter italic pb-4 font-mono-table drop-shadow-2xl whitespace-nowrap">
              {formatarNum(saldoDisponivel)} <span className="text-xl text-gold-primary/40 not-italic ml-2">Kz</span>
            </h3>
            <div className="flex items-center gap-3 mt-4">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
              <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest italic">Património Atualizado</span>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-6">
            <div className="glass-panel p-6 rounded-[35px] border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all">
              <span className="text-[9px] font-black uppercase text-emerald-400 pl-1 tracking-widest opacity-40 block mb-2 flex items-center gap-2">
                <ArrowUpRight size={12} /> Total Depósitos
              </span>
              <span className="text-xl font-black text-emerald-500 font-display whitespace-nowrap">
                {formatarNum(totalAumentos)} <span className="text-[10px] opacity-40 ml-1">Kz</span>
              </span>
            </div>

            <div className="glass-panel p-6 rounded-[35px] border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all">
              <span className="text-[9px] font-black uppercase text-rose-500 pl-1 tracking-widest opacity-40 block mb-2 flex items-center gap-2">
                <ExternalLink size={12} /> Total Saques
              </span>
              <span className="text-xl font-black text-rose-500 font-display whitespace-nowrap">
                -{formatarNum(totalSaques)} <span className="text-[10px] opacity-40 ml-1">Kz</span>
              </span>
            </div>

            <div className="glass-panel p-6 rounded-[35px] border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all">
              <span className="text-[9px] font-black uppercase text-slate-400 pl-1 tracking-widest opacity-40 block mb-2 flex items-center gap-2">
                <AlertCircle size={12} /> Total Multas
              </span>
              <span className="text-xl font-black text-slate-300 font-display whitespace-nowrap">
                -{formatarNum(totalMultas)} <span className="text-[10px] opacity-40 ml-1">Kz</span>
              </span>
            </div>

            <div className="glass-panel p-6 rounded-[35px] border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all">
              <span className="text-[9px] font-black uppercase text-blue-400 pl-1 tracking-widest opacity-40 block mb-2 flex items-center gap-2">
                <TrendingUp size={12} /> Juro Bruto Acum.
              </span>
              <span className="text-xl font-black text-blue-400 font-display whitespace-nowrap">
                +{formatarNum(totalJurosBruto)} <span className="text-[10px] opacity-40 ml-1">Kz</span>
              </span>
            </div>

            <div className="glass-panel p-6 rounded-[35px] border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all">
              <span className="text-[9px] font-black uppercase text-gold-primary pl-1 tracking-widest opacity-40 block mb-2 flex items-center gap-2">
                <Briefcase size={12} /> Total Comissões
              </span>
              <span className="text-xl font-black text-gold-primary font-display whitespace-nowrap">
                -{formatarNum(globalTotals.comissao)} <span className="text-[10px] opacity-40 ml-1">Kz</span>
              </span>
            </div>

            <div className="glass-panel p-6 rounded-[35px] border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all">
              <span className="text-[9px] font-black uppercase text-rose-400 pl-1 tracking-widest opacity-40 block mb-2 flex items-center gap-2">
                <ShieldCheck size={12} /> Total IAC Retido
              </span>
              <span className="text-xl font-black text-rose-400 font-display whitespace-nowrap">
                -{formatarNum(totalIacAcumulado)} <span className="text-[10px] opacity-40 ml-1">Kz</span>
              </span>
            </div>
          </div>
        </div>

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

            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
              <button
                onClick={() => setStatementTab('monthly')}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statementTab === 'monthly' ? 'bg-gold-primary text-bg-deep shadow-lg' : 'text-white/40 hover:text-white'}`}
              >
                Resumo Mensal
              </button>
              <button
                onClick={() => setStatementTab('detailed')}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statementTab === 'detailed' ? 'bg-gold-primary text-bg-deep shadow-lg' : 'text-white/40 hover:text-white'}`}
              >
                Movimentos Detalhados
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            {statementTab === 'monthly' ? (
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
                          {row.created_at && (
                            <div className="flex items-center gap-1.5 text-[9px] text-white/40 tracking-widest lowercase py-1">
                              <Clock size={10} className="text-gold-primary/40" />
                              <span>
                                {new Date(row.created_at).toLocaleString('pt-AO', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          )}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest italic truncate block max-w-[150px]">{row.descricao}</span>
                      </td>
                      <td className="px-8 py-5 text-right whitespace-nowrap">
                        <span className="text-xs font-black text-white/40">
                          {formatarNum(row.capitalInicial)} <span className="text-[8px] opacity-30">Kz</span>
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right whitespace-nowrap">
                        <span className={`text-xs font-black ${row.aumento > 0 ? 'text-emerald-500' : 'text-white/10 italic'}`}>
                          {row.aumento > 0 ? `+${formatarNum(row.aumento)}` : '---'}
                          {row.aumento > 0 && <span className="text-[8px] opacity-30 ml-1">Kz</span>}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right whitespace-nowrap">
                        <span className={`text-xs font-black ${row.saque > 0 ? 'text-rose-500' : 'text-white/10 italic'}`}>
                          {row.saque > 0 ? `-${formatarNum(row.saque)}` : '---'}
                          {row.saque > 0 && <span className="text-[8px] opacity-30 ml-1">Kz</span>}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right whitespace-nowrap">
                        <span className={`text-xs font-black ${row.multa > 0 ? 'text-slate-300' : 'text-white/10 italic'}`}>
                          {row.multa > 0 ? `-${formatarNum(row.multa)}` : '---'}
                          {row.multa > 0 && <span className="text-[8px] opacity-30 ml-1">Kz</span>}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right bg-white/5 whitespace-nowrap">
                        <span className="text-sm font-black text-white italic bg-white/5 px-3 py-1 rounded-lg">
                          {formatarNum(row.capitalFinal)} <span className="text-[9px] opacity-30">Kz</span>
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right whitespace-nowrap">
                        <span className={`text-xs font-black ${row.iac > 0 ? 'text-rose-400' : 'text-white/10 italic'}`}>
                          {row.iac > 0 ? `-${formatarNum(row.iac)}` : '---'}
                          {row.iac > 0 && <span className="text-[8px] opacity-30 ml-1">Kz</span>}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right whitespace-nowrap">
                        <span className={`text-xs font-black ${row.comissao > 0 ? 'text-gold-primary' : 'text-white/10 italic'}`}>
                          {row.comissao > 0 ? `-${formatarNum(row.comissao)}` : '---'}
                          {row.comissao > 0 && <span className="text-[8px] opacity-30 ml-1">Kz</span>}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right whitespace-nowrap">
                        <span className={`text-xs font-black ${row.juros > 0 ? 'text-blue-400' : 'text-white/10 italic'}`}>
                          {row.juros > 0 ? `+${formatarNum(row.juros)}` : '---'}
                          {row.juros > 0 && <span className="text-[8px] opacity-30 ml-1">Kz</span>}
                        </span>
                      </td>
                    </tr>
                  ))
                  }
                  {allCalculated.flatMap(calc => calc.history).length > 0 && (
                    <tr className="bg-white/5 border-t-2 border-white/10">
                      <td colSpan={2} className="px-8 py-6 text-[10px] font-black text-gold-primary uppercase tracking-[0.3em] italic">Consolidado Acumulado</td>
                      <td className="px-8 py-6 text-right font-black text-white/60 text-xs whitespace-nowrap">
                        {formatarNum(totalInvestido)} <span className="text-[8px] opacity-30">Kz</span>
                      </td>
                      <td className="px-8 py-6 text-right font-black text-emerald-500 text-xs whitespace-nowrap">
                        +{formatarNum(allCalculated.flatMap(calc => calc.history).reduce((acc, r) => acc + (r.aumento || 0), 0))} <span className="text-[8px] opacity-30 ml-1">Kz</span>
                      </td>
                      <td className="px-8 py-6 text-right font-black text-rose-500 text-xs whitespace-nowrap">
                        -{formatarNum(allCalculated.flatMap(calc => calc.history).reduce((acc, r) => acc + (r.saque || 0), 0))} <span className="text-[8px] opacity-30 ml-1">Kz</span>
                      </td>
                      <td className="px-8 py-6 text-right font-black text-slate-300 text-xs whitespace-nowrap">
                        -{formatarNum(allCalculated.flatMap(calc => calc.history).reduce((acc, r) => acc + (r.multa || 0), 0))} <span className="text-[8px] opacity-30 ml-1">Kz</span>
                      </td>
                      <td className="px-8 py-6 text-right font-black text-white text-sm italic bg-white/5 whitespace-nowrap">
                        {formatarNum(saldoDisponivel)} <span className="text-[10px] opacity-30 not-italic ml-1">Kz</span>
                      </td>
                      <td className="px-8 py-6 text-right font-black text-rose-400 text-xs whitespace-nowrap">
                        -{formatarNum(allCalculated.flatMap(calc => calc.history).reduce((acc, r) => acc + (r.iac || 0), 0))} <span className="text-[8px] opacity-30 ml-1">Kz</span>
                      </td>
                      <td className="px-8 py-6 text-right font-black text-gold-primary text-xs whitespace-nowrap">
                        -{formatarNum(allCalculated.flatMap(calc => calc.history).reduce((acc, r) => acc + (r.comissao || 0), 0))} <span className="text-[8px] opacity-30 ml-1">Kz</span>
                      </td>
                      <td className="px-8 py-6 text-right font-black text-blue-400 text-xs whitespace-nowrap">
                        +{formatarNum(allCalculated.flatMap(calc => calc.history).reduce((acc, r) => acc + (r.juros || 0), 0))} <span className="text-[8px] opacity-30 ml-1">Kz</span>
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
            ) : (
              <table className="w-full text-left border-collapse font-mono-table">
                <thead>
                  <tr className="bg-white/[0.01]">
                    <th className="px-8 py-6 text-[10px] font-black text-gold-primary uppercase tracking-[0.3em] italic">Data / Hora</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gold-primary uppercase tracking-[0.3em] italic">Descrição / Observações</th>
                    <th className="px-8 py-6 text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] italic text-right">Entrada (+)</th>
                    <th className="px-8 py-6 text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] italic text-right">Saída (-)</th>
                    <th className="px-8 py-6 text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] italic text-right">Rendimento (+)</th>
                    <th className="px-8 py-6 text-[10px] font-black text-rose-400 uppercase tracking-[0.3em] italic text-right">Taxa (IAC)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(history || []).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()).map((rec, i) => (
                    <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-black text-white group-hover:text-gold-primary transition-colors uppercase">
                            {new Date(rec.data).toLocaleDateString('pt-AO', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </span>
                          <span className="text-[9px] text-white/30 font-black tracking-widest uppercase">
                            às {new Date(rec.created_at || rec.data).toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest italic block max-w-[250px] truncate">
                          {rec.observacoes || (rec.aumento > 0 ? 'Aumento de Capital' : rec.saque > 0 ? 'Saque Efetuado' : rec.juros > 0 ? 'Crédito de Rendimento' : 'Movimentação')}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right whitespace-nowrap">
                        <span className={`text-xs font-black ${rec.aumento > 0 ? 'text-emerald-500' : 'text-white/10 italic'}`}>
                          {rec.aumento > 0 ? `+${formatarNum(rec.aumento)}` : '---'}
                          {rec.aumento > 0 && <span className="text-[8px] opacity-30 ml-1">Kz</span>}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right whitespace-nowrap">
                        <span className={`text-xs font-black ${rec.saque > 0 || rec.multa > 0 ? 'text-rose-500' : 'text-white/10 italic'}`}>
                          {rec.saque > 0 ? `-${formatarNum(rec.saque)}` : rec.multa > 0 ? `-${formatarNum(rec.multa)} (Multa)` : '---'}
                          {(rec.saque > 0 || rec.multa > 0) && <span className="text-[8px] opacity-30 ml-1">Kz</span>}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right whitespace-nowrap">
                        <span className={`text-xs font-black ${rec.juros > 0 ? 'text-blue-400' : 'text-white/10 italic'}`}>
                          {rec.juros > 0 ? `+${formatarNum(rec.juros)}` : '---'}
                          {rec.juros > 0 && <span className="text-[8px] opacity-30 ml-1">Kz</span>}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right whitespace-nowrap">
                        <span className={`text-xs font-black ${rec.iac > 0 ? 'text-rose-400' : 'text-white/10 italic'}`}>
                          {rec.iac > 0 ? `-${formatarNum(rec.iac)}` : '---'}
                          {rec.iac > 0 && <span className="text-[8px] opacity-30 ml-1">Kz</span>}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(history || []).length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-8 py-20 text-center text-white/10 font-black uppercase tracking-[0.4em] italic text-xs">
                        Nenhuma movimentação detalhada encontrada.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      <footer className="py-12 border-t border-white/5 opacity-40">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-[12px] font-black text-white uppercase tracking-[0.2em] italic">
            © 2026 SISTEMA DE CONTROLO FINANCEIRO AMAZING CORPORATION, LDA TODO DIREITO RESERVADO
          </p>
        </div>
      </footer>

      <div className="hidden">
        <div ref={printRef} className="text-[#002855] bg-white min-h-[297mm] font-sans overflow-visible relative" style={{ width: '210mm', padding: '15mm', paddingBottom: '30mm' }}>


          <div className="hidden print:block a4-page-number-footer" />

          <div className="flex justify-between items-start mb-4 border-b-[4px] border-[#002855] pb-4 px-4 pt-4">
            <div className="flex gap-4 items-center">
              <img src="/logo_amazing.png" alt="Amazing Corp" className="h-16 object-contain" />
              <div className="ml-2">
                <h1 className="text-3xl font-black text-[#002855] uppercase tracking-tighter">Extrato de Movimentação Financeira</h1>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Documento Oficial de Consulta do Investidor</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[#002855] font-black text-base border-2 border-[#002855] px-4 py-1 rounded-lg">
                {investor?.numero_sequencial ? `INV-${investor.numero_sequencial.toString().padStart(3, '0')}/026` : (investor?.id || '---')}
              </div>
              <p className="text-[8px] font-bold uppercase text-slate-400 mt-1 italic">ID de Autenticidade Digital</p>

            </div>

          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-8 bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-sm mx-4">
            <div>
              <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1">Titular da Conta:</p>
              <p className="text-xl font-black text-[#002855] uppercase italic">{investor?.nome || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1">Moeda Corrente:</p>
              <p className="text-xl font-black text-[#002855] uppercase italic">Kwanza (AOA)</p>
            </div>
            <div>
              <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1">Início do Contrato:</p>
              <p className="text-lg font-bold text-[#002855] uppercase">{investments.length > 0 && investments[0].data_inicio ? new Date(investments[0].data_inicio).toLocaleDateString('pt-AO') : '---'}</p>
            </div>
            <div>
              <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1">Término do Contrato:</p>
              <p className="text-lg font-bold text-[#002855] uppercase">{investments.length > 0 && investments[0].data_fim ? new Date(investments[0].data_fim).toLocaleDateString('pt-AO') : '---'}</p>
            </div>
          </div>

          <div className="mb-6 overflow-hidden rounded-xl border-2 border-[#002855] mx-auto max-w-[200mm]">
            <div className="bg-[#002855] text-white py-2 px-4 text-[9px] font-black uppercase tracking-[0.2em] flex justify-between items-center shadow-lg">
              <span>CONTRATOS ATIVOS E PERFORMANCE GLOBAL</span>
            </div>
            <table className="w-full text-center border-collapse text-[7.2px] font-bold text-[#002855] leading-tight">
              <thead className="bg-slate-100 border-b-2 border-slate-300">
                <tr className="text-[#002855]/70 uppercase text-[6.8px] tracking-tighter">
                  <th className="py-2 px-0.5 border-r border-slate-200">Nome / Título</th>
                  <th className="py-2 px-0.5 border-r border-slate-200">Datas (Inc-Fim)</th>
                  <th className="py-2 px-0.5 border-r border-slate-200 w-10">Regime</th>
                  <th className="py-2 px-0.5 border-r border-slate-200">Cap. Inicial</th>
                  <th className="py-2 px-0.5 border-r border-slate-200 text-emerald-700">Aum.</th>
                  <th className="py-2 px-0.5 border-r border-slate-200 text-rose-500">Saq.</th>
                  <th className="py-2 px-0.5 border-r border-slate-200 text-slate-500">Mult.</th>
                  <th className="py-2 px-0.5 border-r border-slate-200 font-black italic bg-slate-200">S. Final</th>
                  <th className="py-2 px-0.5 border-r border-slate-200 text-rose-700 whitespace-nowrap">IAC (10%)</th>
                  <th className="py-2 px-0.5 border-r border-slate-200 text-amber-700 whitespace-nowrap">Comis.(2.5%)</th>
                  <th className="py-2 px-0.5">Juro Bruto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {investments.map((inv) => {
                  const calc = calculateProjectFullHistory(inv, history.filter(h => h.investimento_id === inv.id));
                  const capIni = Number(inv.capital_inicial) || 0;

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50">
                      <td className="py-2 px-0.5 border-r border-slate-200">
                        <div className="font-black leading-tight text-wrap">{investor?.nome}</div>
                        <div className="text-[6px] text-slate-400 leading-tight">{inv.titulo}</div>
                      </td>
                      <td className="py-2 px-0.5 border-r border-slate-200 text-[6.5px] leading-none whitespace-nowrap">
                        {inv.data_inicio ? new Date(inv.data_inicio).toLocaleDateString('pt-AO', { day: '2-digit', month: '2-digit', year: '2-digit' }) : ''} <br />- <br /> {inv.data_fim ? new Date(inv.data_fim).toLocaleDateString('pt-AO', { day: '2-digit', month: '2-digit', year: '2-digit' }) : ''}
                      </td>
                      <td className="py-2 px-0.5 border-r border-slate-200 text-[6.5px] leading-tight">{inv.regime} <br /> {inv.taxa}</td>
                      <td className="py-2 px-0.5 border-r border-slate-200">{formatarNum(capIni)}</td>
                      <td className="py-2 px-0.5 border-r border-slate-200 text-emerald-700">{calc.totals.aumento > 0 ? `+${formatarNum(calc.totals.aumento)}` : '---'}</td>
                      <td className="py-2 px-0.5 border-r border-slate-200 text-rose-500">{calc.totals.saque > 0 ? `-${formatarNum(calc.totals.saque)}` : '---'}</td>
                      <td className="py-2 px-0.5 border-r border-slate-200 text-slate-500">{calc.totals.multa > 0 ? `-${formatarNum(calc.totals.multa)}` : '---'}</td>
                      <td className="py-2 px-0.5 border-r border-slate-200 italic font-black text-[#002855] bg-slate-50/50">{formatarNum(calc.totals.resultado)}</td>
                      <td className="py-2 px-0.5 border-r border-slate-200 text-rose-700">{calc.totals.iac > 0 ? `-${formatarNum(calc.totals.iac)}` : '---'}</td>
                      <td className="py-2 px-0.5 border-r border-slate-200 text-amber-700">{calc.totals.comissao > 0 ? `-${formatarNum(calc.totals.comissao)}` : '---'}</td>
                      <td className="py-2 px-0.5 text-blue-700">{formatarNum(calc.totals.juros)}</td>
                    </tr>
                  );
                })}
                <tr className="bg-slate-100 border-t-2 border-[#002855] uppercase text-[7.5px]">
                  <td colSpan={3} className="py-2 px-1 font-black text-right border-r border-slate-300">TOTAIS:</td>
                  <td className="py-2 px-1 font-black border-r border-slate-300">{formatarNum(totalInvestido)}</td>
                  <td className="py-2 px-1 font-black text-emerald-700 border-r border-slate-300">{formatarNum(totalAumentos)}</td>
                  <td className="py-2 px-1 font-black text-rose-500 border-r border-slate-300">-{formatarNum(totalSaques)}</td>
                  <td className="py-2 px-1 font-black text-slate-500 border-r border-slate-300">-{formatarNum(totalMultas)}</td>
                  <td className="py-2 px-1 font-black italic text-[#002855] bg-slate-200 border-r border-slate-300">{formatarNum(saldoDisponivel)}</td>
                  <td className="py-2 px-1 font-black text-rose-700 border-r border-slate-300">-{formatarNum(totalIacAcumulado)}</td>
                  <td className="py-2 px-1 font-black text-amber-700 border-r border-slate-300">-{formatarNum(globalTotals.comissao)}</td>
                  <td className="py-2 px-1 text-blue-700 font-black italic tracking-widest">{formatarNum(totalJurosBruto)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mb-4 text-[10px] font-black text-[#002855] uppercase tracking-[0.3em] border-l-4 border-gold-primary pl-4 italic mx-auto max-w-[200mm]">Historial de Fluxo e Tributação Detalhado</div>
          <div className="mx-auto max-w-[200mm] overflow-hidden rounded-xl border border-slate-200 shadow-sm">
            <table className="w-full border-collapse">
              <thead className="bg-[#002855]/5 text-[#002855]">
                <tr className="text-[7px] font-black uppercase tracking-tight text-center">
                  <th className="p-1 border border-slate-300">Data</th>
                  <th className="p-1 border border-slate-300">Descrição</th>
                  <th className="p-1 border border-slate-300 text-right">S. Inicial</th>
                  <th className="p-1 border border-slate-300 text-right">Depós.</th>
                  <th className="p-1 border border-slate-300 text-right text-rose-500">Saques</th>
                  <th className="p-1 border border-slate-300 text-right text-slate-500">Multas</th>
                  <th className="p-1 border border-slate-300 text-right font-bold bg-slate-100">S. Final</th>
                  <th className="p-1 border border-slate-300 text-right text-rose-600">IAC</th>
                  <th className="p-1 border border-slate-300 text-right text-gold-600">Comis.</th>
                  <th className="p-1 border border-slate-300 text-right">Juro Bruto</th>
                </tr>
              </thead>
              <tbody>
                {allCalculated.flatMap(calc => calc.history).sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()).map((row, idx) => (
                  <tr key={idx} className="border border-slate-200 odd:bg-white even:bg-slate-50/50 text-[7.2px]">
                    <td className="p-1 font-black uppercase italic text-center">
                      <span className="whitespace-nowrap">{new Date(row.data).toLocaleDateString('pt-AO', { month: '2-digit', year: '2-digit' })}</span>
                    </td>
                    <td className="p-1 font-bold uppercase text-[#002855] text-center italic leading-none truncate max-w-[80px]">{row.descricao}</td>
                    <td className="p-1 text-right font-bold text-slate-400 whitespace-nowrap">{formatarNum(row.capitalInicial)}</td>
                    <td className="p-1 text-right font-black text-emerald-700 whitespace-nowrap">{row.aumento > 0 ? formatarNum(row.aumento) : '---'}</td>
                    <td className="p-1 text-right font-black text-rose-500 whitespace-nowrap">{row.saque > 0 ? `-${formatarNum(row.saque)}` : '---'}</td>
                    <td className="p-1 text-right font-black text-slate-500 whitespace-nowrap">{row.multa > 0 ? `-${formatarNum(row.multa)}` : '---'}</td>
                    <td className="p-1 text-right font-black text-[#002855] bg-slate-100 whitespace-nowrap">{formatarNum(row.capitalFinal)}</td>
                    <td className="p-1 text-right font-black text-rose-600 whitespace-nowrap">{row.iac > 0 ? `-${formatarNum(row.iac)}` : '---'}</td>
                    <td className="p-1 text-right font-black text-amber-600 whitespace-nowrap">{row.comissao > 0 ? `-${formatarNum(row.comissao)}` : '---'}</td>
                    <td className="p-1 text-right font-black text-blue-700 whitespace-nowrap">{row.juros > 0 ? formatarNum(row.juros) : '---'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-[#002855] text-white">
                <tr className="text-[7.2px] font-black uppercase tracking-tight">
                  <td colSpan={3} className="p-1 border border-[#002855] text-center">TOTAIS DE FLUXO E RETENÇÃO</td>
                  <td className="p-1 border border-[#002855] text-right whitespace-nowrap">+{formatarNum(totalAumentos)}</td>
                  <td className="p-1 border border-[#002855] text-right text-rose-200 whitespace-nowrap">-{formatarNum(totalSaques)}</td>
                  <td className="p-1 border border-[#002855] text-right text-slate-300 whitespace-nowrap">-{formatarNum(totalMultas)}</td>
                  <td className="p-1 border border-[#002855] text-right italic font-black bg-white/10 whitespace-nowrap">{formatarNum(saldoDisponivel)}</td>
                  <td className="p-1 border border-[#002855] text-right text-rose-300 whitespace-nowrap">-{formatarNum(totalIacAcumulado)}</td>
                  <td className="p-1 border border-[#002855] text-right text-gold-300 whitespace-nowrap">-{formatarNum(globalTotals.comissao)}</td>
                  <td className="p-1 border border-[#002855] text-right whitespace-nowrap">+{formatarNum(totalJurosBruto)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="mt-2 flex justify-between items-end border-t border-slate-100 pt-6">


            <div className="max-w-[300px]">
              <p className="text-[7px] font-black text-slate-400 uppercase tracking-tight mb-2 max-w-[300px]">
                Segurança: Encriptação Avançada para Proteção de Dados Pessoais e Confidencialidade das Informações
              </p>
              <img src="/logo_amazing.png" alt="Stamp" className="h-14 opacity-20 grayscale border-2 border-slate-400 p-2 rounded-xl" />
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-[#002855] uppercase italic mb-1">Emitido em: {new Date().toLocaleString('pt-AO')}</p>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Sistema de Controlo Financeiro - Amazing Corporation, Lda</p>
              <p className="text-[7px] text-slate-400 mt-2 italic max-w-[400px] ml-auto">
                Este extrato é um documento oficial gerado eletronicamente. A Amazing Corporation, Lda garante a integridade,
                segurança e confidencialidade total dos dados aqui apresentados, em conformidade com os protocolos de proteção de ativos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
