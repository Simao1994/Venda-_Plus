import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AlertTriangle, Clock, PackageX, CheckCircle2 } from 'lucide-react';
import { api } from '../../lib/api';

export default function Alertas() {
  const [alertas, setAlertas] = useState<{ stockBaixo: any[]; validadeProxima: any[] }>({
    stockBaixo: [],
    validadeProxima: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('/api/farmacia/alertas');
      const data = await res.json();
      setAlertas(data);
    } finally { setLoading(false); }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto relative z-10">
      {/* Header */}
      <header className="mb-10">
        <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
          Alertas do <span style={{ background: 'linear-gradient(135deg, #f87171, #ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Sistema</span>
        </h1>
        <p className="text-white/40 font-black text-[10px] uppercase tracking-[0.3em] mt-2 italic">Monitorização de stock e validades em tempo real</p>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="w-12 h-12 border-4 border-red-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* ── Stock Baixo ── */}
          <div className="glass-panel rounded-[40px] border border-red-500/10 overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-red-500/10 bg-red-500/[0.02] flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-500/10 text-red-400 rounded-2xl flex items-center justify-center border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                  <PackageX size={22} />
                </div>
                <div>
                  <h2 className="font-black text-white text-sm uppercase tracking-widest italic">Stock Baixo / Esgotado</h2>
                  <p className="text-[9px] text-white/20 uppercase tracking-widest mt-0.5">Medicamentos abaixo do mínimo</p>
                </div>
              </div>
              <span className="px-4 py-2 bg-red-500/10 text-red-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-500/20">
                {alertas.stockBaixo.length} alertas
              </span>
            </div>
            <div className="p-6 space-y-3">
              {alertas.stockBaixo.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-white/10 gap-4">
                  <CheckCircle2 size={32} className="text-emerald-400/30" />
                  <p className="text-[10px] font-black uppercase tracking-[0.4em]">Stock dentro dos limites</p>
                </div>
              ) : alertas.stockBaixo.map((item: any) => (
                <div key={item.id} className="glass-panel flex justify-between items-center p-5 rounded-2xl border border-red-500/10 hover:border-red-500/20 transition-all group">
                  <div>
                    <p className="font-black text-white text-xs uppercase tracking-tight group-hover:text-red-400 transition-colors">{item.nome_medicamento}</p>
                    <p className="text-[9px] font-black text-white/20 mt-1 uppercase tracking-widest">Mínimo: {item.estoque_minimo} uni.</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-white/20 uppercase font-black tracking-widest mb-1">Stock Atual</p>
                    <p className="font-black text-red-400 text-2xl tabular-nums">{item.stock_total}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Validade Próxima ── */}
          <div className="glass-panel rounded-[40px] border border-amber-500/10 overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-amber-500/10 bg-amber-500/[0.02] flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                  <Clock size={22} />
                </div>
                <div>
                  <h2 className="font-black text-white text-sm uppercase tracking-widest italic">Validade Próxima</h2>
                  <p className="text-[9px] text-white/20 uppercase tracking-widest mt-0.5">Lotes a vencer em menos de 90 dias</p>
                </div>
              </div>
              <span className="px-4 py-2 bg-amber-500/10 text-amber-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-500/20">
                {alertas.validadeProxima.length} lotes
              </span>
            </div>
            <div className="p-6 space-y-3">
              {alertas.validadeProxima.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-white/10 gap-4">
                  <CheckCircle2 size={32} className="text-emerald-400/30" />
                  <p className="text-[10px] font-black uppercase tracking-[0.4em]">Todos os lotes válidos</p>
                </div>
              ) : alertas.validadeProxima.map((item: any) => {
                const diasRestantes = Math.ceil((new Date(item.data_validade).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                const isUrgent = diasRestantes <= 30;
                return (
                  <div key={item.id} className={`glass-panel flex justify-between items-center p-5 rounded-2xl border transition-all group ${isUrgent ? 'border-red-500/20 hover:border-red-500/30' : 'border-amber-500/10 hover:border-amber-500/20'}`}>
                    <div>
                      <p className={`font-black text-white text-xs uppercase tracking-tight transition-colors group-hover:${isUrgent ? 'text-red-400' : 'text-amber-400'}`}>{item.nome_medicamento}</p>
                      <p className="text-[9px] font-black text-white/20 mt-1 uppercase tracking-widest">Lote: {item.numero_lote} • Qtd: {item.quantidade_atual}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-white/20 uppercase font-black tracking-widest mb-1">Vence em</p>
                      <p className={`font-black text-2xl tabular-nums ${isUrgent ? 'text-red-400' : 'text-amber-400'}`}>{diasRestantes}<span className="text-sm ml-1 font-bold opacity-60">dias</span></p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
