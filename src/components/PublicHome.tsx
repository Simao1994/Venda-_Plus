import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  Store,
  Search,
  ArrowRight,
  ExternalLink,
  ShoppingCart,
  Briefcase,
  Cross,
  Smartphone,
  ShieldCheck,
  Globe,
  Users,
  CheckCircle2,
  Package,
  FileText,
  CreditCard,
  Zap,
  Settings,
  X,
  Clock,
  Calendar,
  MessageSquare
} from 'lucide-react';

function DigitalClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-white/[0.03] rounded-2xl border border-white/5 shadow-inner transition-all hover:bg-white/[0.05]">
      <div className="flex items-center gap-2 text-gold-primary">
        <Clock size={16} />
        <span className="text-xs font-black tracking-tight uppercase italic tabular-nums pb-0.5">{time.toLocaleTimeString('pt-PT')}</span>
      </div>
      <div className="w-px h-4 bg-white/10" />
      <div className="flex items-center gap-2 text-white/40">
        <Calendar size={16} />
        <span className="text-xs font-black tracking-tight uppercase italic pb-0.5">{time.toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
      </div>
    </div>
  );
}

export default function PublicHome({ onLoginClick, onStartClick }: { onLoginClick: () => void, onStartClick: () => void }) {
  const [publications, setPublications] = useState<any[]>([]);
  const [vagas, setVagas] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [config, setConfig] = useState<any>({
    landing_stats: [],
    landing_modules: []
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedModule, setSelectedModule] = useState<any>(null);
  const [showIntro, setShowIntro] = useState(false);

  const ModuleDetailedInfo: any = {
    'Vendas & Facturação': {
      features: [
        'PDV (Ponto de Venda) ultra-rápido',
        'Emissão de facturas certificadas (AGT)',
        'Controlo de stock em tempo real',
        'Gestão de múltiplos terminais e caixas',
        'Relatórios de fecho de caixa automáticos'
      ],
      longDesc: 'Transforme o seu checkout numa máquina de eficiência. O nosso sistema de vendas é desenhado para minimercados e grandes superfícies que não podem parar.'
    },
    'Recursos Humanos': {
      features: [
        'Processamento de salários automático',
        'Gestão de assiduidade e faltas',
        'Emissão de recibos de vencimento',
        'Controlo de contratos e documentos',
        'Portal do colaborador'
      ],
      longDesc: 'Simplifique a gestão das suas equipas. Desde a contratação ao pagamento, tudo num só lugar com total conformidade legal.'
    },
    'Gestão de Farmácia': {
      features: [
        'Controlo rigoroso de lotes e validades',
        'Gestão de receitas e stock crítico',
        'Inventários inteligentes e reposição',
        'Histórico de compras e fornecedores',
        'Alertas de stock próximo da expiração'
      ],
      longDesc: 'Segurança e precisão absoluta para a sua farmácia. Controle cada medicamento e garanta que nada passe do prazo.'
    },
    'Marketing Digital': {
      features: [
        'Exposição no Venda Plus Market',
        'Criação de promoções em segundos',
        'Botão de contacto direto via WhatsApp',
        'Estatísticas de visualização de ofertas',
        'Partilha em redes sociais facilitada'
      ],
      longDesc: 'Leve os seus produtos até aos clientes. O nosso Market público é a montra digital que o seu negócio precisava para crescer.'
    }
  };

  const IconMap: any = { ShoppingCart, Users, Cross, Smartphone };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/saas/plans');
      const data = await res.json();
      setPlans(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao buscar planos:', error);
    }
  };

  const fetchPublications = async () => {
    try {
      const res = await fetch('/api/public/publications');
      const data = await res.json();
      setPublications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao buscar publicações:', error);
    }
  };

  const fetchVagas = async () => {
    try {
      const { data, error } = await supabase
        .from('rh_vagas')
        .select(`
          *,
          companies (name)
        `)
        .eq('status', 'ativa')
        .order('data_publicacao', { ascending: false });

      if (!error) setVagas(data || []);
    } catch (error) {
      console.error('Erro ao buscar vagas:', error);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/system/config');
      const data = await res.json();
      setConfig(prev => ({ ...prev, ...data }));
    } catch (error) {
      console.error('Erro ao buscar configuração:', error);
    }
  };

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .in('status', ['active', 'pending'])
        .order('name');
      if (!error) setCompanies(data || []);
    } catch (error) {
      console.error('Erro ao buscar empresas:', error);
    }
  };

  const fetchInitialData = async () => {
    setLoading(true);
    await Promise.all([
      fetchPublications(),
      fetchVagas(),
      fetchPlans(),
      fetchCompanies(),
      fetchConfig()
    ]);
    setLoading(false);
  };

  const filtered = publications.filter(p =>
    p.title?.toLowerCase().includes(search.toLowerCase()) ||
    p.company_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.content?.toLowerCase().includes(search.toLowerCase())
  );


  return (
    <div className="min-h-screen bg-bg-deep selection:bg-gold-primary/30">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-bg-deep/80 backdrop-blur-xl border-b border-white/5 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div
            onClick={() => setShowIntro(true)}
            className="flex items-center gap-2 group cursor-pointer -ml-2"
          >
            <div className="w-10 h-10 bg-gold-primary rounded-xl flex items-center justify-center text-bg-deep shadow-[0_0_20px_rgba(212,175,55,0.3)] group-hover:shadow-[0_0_30px_rgba(212,175,55,0.5)] transition-all">
              <Store size={24} />
            </div>
            <span className="text-2xl font-black text-white tracking-normal italic uppercase pr-4">VENDA <span className="text-gold-gradient">PLUS</span></span>
          </div>

          <div className="hidden md:flex items-center gap-10">
            <a href="#solucoes" className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-gold-primary transition-colors">Soluções</a>
            <a href="#market" className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-gold-primary transition-colors">Market</a>
            <a href="#vagas" className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-gold-primary transition-colors">Vagas</a>
            <a href="#precos" className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-gold-primary transition-colors">Preços</a>
            <a href="#contacto" className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-gold-primary transition-colors">Contacto</a>
          </div>

          <div className="hidden lg:block">
            <DigitalClock />
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onLoginClick}
              className="px-8 py-3 bg-white/5 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gold-primary hover:text-bg-deep transition-all border border-white/10 hover:border-gold-primary shadow-2xl"
            >
              Acesso à Gestão
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="pt-32 pb-20 overflow-hidden relative min-h-screen flex items-center">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-bg-deep">
          <img
            src="/hero-new.png"
            alt="Venda Plus Analytics Hero"
            className="w-full h-full object-cover opacity-30 grayscale contrast-125"
            style={{ objectPosition: 'center right' }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-bg-deep via-bg-deep/80 to-transparent" />
          <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-bg-deep to-transparent" />

          {/* Animated Glows */}
          <div className="absolute top-[20%] left-[10%] w-[30%] h-[30%] bg-gold-primary/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[20%] right-[10%] w-[40%] h-[40%] bg-gold-secondary/5 rounded-full blur-[150px]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 w-full">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-gold-primary/10 border border-gold-primary/20 rounded-full text-gold-primary text-[10px] font-black uppercase tracking-[0.3em] mb-10 backdrop-blur-xl shadow-[0_0_20px_rgba(212,175,55,0.1)]">
              <ShieldCheck size={16} />
              Protocolo Retail Premium V.2026
            </div>

            <h1 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tight mb-8 max-w-2xl uppercase">
              A inteligência por trás do seu <br />
              <span className="text-gold-gradient">supermercado.</span>
            </h1>

            <p className="text-lg text-white/50 font-medium leading-relaxed mb-12 max-w-2xl tracking-wide">
              Venda Plus Retail Cloud: Uma plataforma completa para gestão de inventário, PDV de alta performance e fidelização de clientes em tempo real.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 mb-24">
              <button
                onClick={onStartClick}
                className="px-12 py-6 bg-gold-primary text-bg-deep rounded-[32px] font-black text-lg uppercase tracking-[0.2em] hover:bg-white transition-all shadow-[0_0_40px_rgba(212,175,55,0.3)] flex items-center justify-center gap-4 active:scale-95"
              >
                Inicie Agora <ArrowRight size={20} />
              </button>
              <a
                href="#precos"
                className="px-12 py-6 bg-white/5 text-white border border-white/10 backdrop-blur-xl rounded-[32px] font-black text-lg uppercase tracking-[0.2em] hover:bg-white/10 transition-all flex items-center justify-center gap-4"
              >
                Explorar Planos
              </a>
            </div>

            <div className="grid grid-cols-3 gap-16 border-t border-white/5 pt-16 relative">
              <div className="absolute top-0 left-0 w-20 h-px bg-gold-primary/40" />
              {config.landing_stats.map((stat: any, i: number) => (
                <div key={i}>
                  <p className="text-4xl font-black text-white tracking-tight tabular-nums mb-1 italic pb-1">{stat.value}</p>
                  <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Modules Grid */}
      <section id="solucoes" className="py-40 bg-bg-deep relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gold-primary/10 to-transparent" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-24">
            <h2 className="text-5xl md:text-6xl font-black text-white tracking-tight mb-6 uppercase italic">
              Módulos <span className="text-gold-gradient">Inteligentes</span>
            </h2>
            <p className="text-white/40 font-black text-xs uppercase tracking-[0.4em] max-w-2xl mx-auto italic">
              Cada módulo foi desenhado para maximizar a eficiência de um pilar específico do seu negócio.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {config.landing_modules.map((m: any, i: number) => {
              const Icon = IconMap[m.icon] || ShoppingCart;
              return (
                <div
                  key={i}
                  onClick={() => setSelectedModule(m)}
                  className="glass-panel p-10 rounded-[48px] border border-white/5 hover:border-gold-primary/30 transition-all duration-500 group cursor-pointer relative overflow-hidden gold-glow"
                >
                  <div className="absolute inset-0 bg-gold-primary opacity-0 group-hover:opacity-[0.02] transition-opacity" />

                  <div className={`w-20 h-20 ${m.color} rounded-3xl flex items-center justify-center text-white mb-10 shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 relative z-10 metallic-border`}>
                    <Icon size={32} />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-normal italic group-hover:text-gold-primary transition-colors">{m.title}</h3>
                  <p className="text-white/40 font-medium leading-relaxed mb-8 line-clamp-2 text-sm">{m.desc}</p>
                  <div className="flex items-center gap-3 text-gold-primary font-black text-[10px] uppercase tracking-[0.3em] group-hover:gap-5 transition-all">
                    Saber Mais <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Market Preview */}
      <section id="market" className="py-40 overflow-hidden bg-bg-deep relative">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row items-end justify-between gap-10 mb-20">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-3 text-gold-primary font-black text-[10px] uppercase tracking-[0.4em] mb-6 px-4 py-2 bg-gold-primary/10 rounded-full border border-gold-primary/20 italic">
                <Globe size={14} className="animate-spin-slow" />
                VENDA PLUS MARKET PROTOCOL
              </div>
              <h2 className="text-5xl md:text-6xl font-black text-white tracking-tight italic uppercase">
                Oportunidades em <span className="text-gold-gradient">Tempo Real</span>
              </h2>
            </div>

            <div className="w-full md:w-96 relative group">
              <div className="absolute inset-0 bg-gold-primary/20 blur-2xl opacity-0 group-focus-within:opacity-30 transition-opacity" />
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gold-primary/40 group-focus-within:text-gold-primary transition-colors" size={20} />
              <input
                type="text"
                placeholder="INVESTIGAR OFERTAS..."
                className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/5 rounded-3xl focus:ring-4 focus:ring-gold-primary/10 focus:border-gold-primary/40 text-white font-black text-xs transition-all placeholder:text-white/10 outline-none uppercase tracking-widest"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white/[0.02] border border-white/5 rounded-[48px] h-96 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {filtered.map(pub => (
                <article key={pub.id} className="glass-panel rounded-[40px] overflow-hidden group border border-white/5 hover:border-gold-primary/30 transition-all duration-700 shadow-2xl relative">
                  <div className="absolute inset-0 bg-gold-primary opacity-0 group-hover:opacity-[0.01] transition-opacity" />

                  {pub.image && (
                    <div className="aspect-[5/4] overflow-hidden relative border-b border-white/5">
                      <img src={pub.image} alt={pub.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 grayscale group-hover:grayscale-0" />
                      <div className="absolute inset-0 bg-gradient-to-t from-bg-deep to-transparent opacity-60" />
                    </div>
                  )}
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0 group-hover:text-gold-primary transition-colors">
                        <Store size={18} className="text-white/20" />
                      </div>
                      <span className="text-[10px] font-black text-white/40 uppercase tracking-tight truncate italic">{pub.company_name}</span>
                    </div>
                    <h3 className="font-black text-white text-xl mb-3 leading-tight uppercase tracking-tight group-hover:text-gold-primary transition-colors line-clamp-2">{pub.title}</h3>
                    <p className="text-white/30 text-xs font-medium line-clamp-3 leading-relaxed mb-8">{pub.content}</p>

                    {pub.company_phone && (
                      <a
                        href={`https://wa.me/${pub.company_phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá! Vi a vossa publicação "${pub.title}" no Venda Plus Market e gostaria de obter mais informações.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-4 bg-gold-primary/10 text-gold-primary rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-gold-primary hover:text-bg-deep transition-all border border-gold-primary/20 hover:border-gold-primary"
                      >
                        <Smartphone size={16} />
                        Protocolar Informação
                      </a>
                    )}
                  </div>
                </article>
              ))}
              {filtered.length === 0 && (
                <div className="col-span-full py-32 text-center text-white/10 font-black uppercase tracking-[0.4em] italic text-xs border-2 border-dashed border-white/5 rounded-[48px]">
                  Nenhuma publicação detectada nos radares.
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Vacancies Section */}
      <section id="vagas" className="py-40 bg-bg-deep relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(212,175,55,0.05)_0%,transparent_50%)]" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-24">
            <div className="inline-flex items-center gap-3 text-gold-primary font-black text-[10px] uppercase tracking-[0.4em] mb-6 italic">
              <Briefcase size={16} />
              OPORTUNIDADES ESTRATÉGICAS
            </div>
            <h2 className="text-5xl md:text-6xl font-black text-white tracking-tight italic uppercase pb-2">Vagas <span className="text-gold-gradient">Disponíveis</span></h2>
            <p className="text-white/40 font-black text-xs uppercase tracking-[0.3em] mt-6 max-w-xl mx-auto italic">
              Junte-se às melhores empresas que utilizam a nossa tecnologia. Encontre a sua próxima oportunidade aqui.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {vagas.map((vaga) => (
              <div key={vaga.id} className="glass-panel p-10 rounded-[48px] border border-white/5 hover:border-gold-primary/30 transition-all duration-500 group relative gold-glow">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <span className="inline-block px-4 py-1.5 bg-gold-primary/10 text-gold-primary text-[9px] font-black uppercase tracking-[0.2em] rounded-full mb-4 border border-gold-primary/20">
                      {vaga.tipo_contrato || 'Protocolo Standard'}
                    </span>
                    <h3 className="text-3xl font-black text-white leading-tight uppercase tracking-tight group-hover:text-gold-primary transition-colors italic">
                      {vaga.titulo}
                    </h3>
                    <p className="text-[10px] font-black text-white/20 mt-2 uppercase tracking-[0.2em] italic">
                      {vaga.companies?.name || 'Venda Plus Hub Partner'}
                    </p>
                  </div>
                  <div className="w-16 h-16 bg-white/5 border border-white/5 rounded-3xl flex items-center justify-center text-white/20 group-hover:text-gold-primary group-hover:bg-gold-primary/10 transition-all duration-500">
                    <Briefcase size={32} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-10">
                  <div className="flex items-center gap-4 text-[10px] text-white/40 font-black uppercase tracking-widest">
                    <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-gold-primary">
                      <Globe size={16} />
                    </div>
                    <span>{vaga.localizacao || 'Angola Hub'}</span>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] text-white/40 font-black uppercase tracking-widest">
                    <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-gold-primary">
                      <Zap size={16} />
                    </div>
                    <span>{vaga.nivel_experiencia || 'Expert Level'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-8 border-t border-white/5">
                  <div className="text-xl font-black text-white tracking-tight italic uppercase group-hover:text-gold-gradient transition-all pb-1">
                    {vaga.salario || 'Sob Consulta'}
                  </div>
                  <button
                    onClick={() => {
                      const msg = `Olá! Gostaria de me candidatar à vaga de "${vaga.titulo}" que vi no Venda Plus.`;
                      window.open(`https://wa.me/244923000000?text=${encodeURIComponent(msg)}`, '_blank');
                    }}
                    className="px-8 py-4 bg-gold-primary text-bg-deep rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white transition-all shadow-2xl active:scale-95 italic"
                  >
                    PROTOCOLAR CANDIDATURA
                  </button>
                </div>
              </div>
            ))}

            {vagas.length === 0 && (
              <div className="col-span-full py-32 text-center bg-white/[0.01] rounded-[60px] border-2 border-dashed border-white/5">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-white/10 mx-auto mb-6">
                  <Briefcase size={32} />
                </div>
                <p className="text-white/10 font-black uppercase tracking-[0.4em] text-xs italic">Nenhuma vaga ativa detectada no momento</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="precos" className="py-40 bg-bg-deep text-white overflow-hidden relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_rgba(212,175,55,0.05)_0%,transparent_70%)]" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-24">
            <h2 className="text-5xl md:text-6xl font-black tracking-tight mb-6 italic uppercase pb-2">Algoritmos de <span className="text-gold-gradient">Custo</span></h2>
            <p className="text-white/40 font-black text-xs uppercase tracking-[0.3em] max-w-2xl mx-auto italic">
              Escolha o plano que melhor se adapta ao tamanho do seu negócio hoje, e cresça connosco amanhã.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {plans.slice(0, 3).map((plan, i) => {
              const publicFeatures = Array.isArray(plan.public_features) ? plan.public_features : [];
              return (
                <div key={i} className={`p-10 rounded-[56px] border transition-all duration-700 relative overflow-hidden group gold-glow ${plan.is_featured ? 'bg-gold-primary border-gold-primary shadow-[0_0_50px_rgba(212,175,55,0.2)] scale-105 z-20' : 'glass-panel border-white/5 hover:border-gold-primary/30 z-10'
                  }`}>
                  {plan.is_featured && (
                    <div className="absolute top-0 right-0 px-6 py-2 bg-bg-deep text-gold-primary text-[8px] font-black uppercase tracking-[0.4em] rounded-bl-3xl italic">
                      RECOMENDADO
                    </div>
                  )}

                  <h3 className={`text-2xl font-black mb-2 italic uppercase tracking-tight ${plan.is_featured ? 'text-bg-deep' : 'text-white'}`}>{plan.name}</h3>
                  <p className={`text-[10px] font-black uppercase tracking-widest mb-10 italic ${plan.is_featured ? 'text-bg-deep/60' : 'text-white/20'}`}>{plan.description}</p>

                  <div className="flex items-baseline gap-2 mb-10">
                    <span className={`text-6xl font-black tracking-tight italic pb-2 ${plan.is_featured ? 'text-bg-deep' : 'text-white'}`}>{plan.price_monthly.toLocaleString()}</span>
                    <span className={`text-[10px] font-black uppercase tracking-[0.3em] italic ${plan.is_featured ? 'text-bg-deep/40' : 'text-white/20'}`}>KZ / CICLO</span>
                  </div>

                  <ul className="space-y-4 mb-12">
                    {publicFeatures.map((f: string, j: number) => (
                      <li key={j} className={`flex items-center gap-4 text-xs font-black uppercase tracking-tight ${plan.is_featured ? 'text-bg-deep/80' : 'text-white/60'}`}>
                        <CheckCircle2 size={18} className={plan.is_featured ? 'text-bg-deep/40' : 'text-gold-primary'} />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={onStartClick}
                    className={`w-full py-6 rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all italic active:scale-95 ${plan.is_featured ? 'bg-bg-deep text-white hover:bg-white hover:text-bg-deep' : 'bg-gold-primary text-bg-deep hover:bg-white hover:text-bg-deep'
                      }`}
                  >
                    INICIAR PROTOCOLO
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contacto" className="py-40 bg-bg-deep relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-gold-primary/5 rounded-full blur-[120px]" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <div className="inline-flex items-center gap-3 text-gold-primary font-black text-[10px] uppercase tracking-[0.4em] mb-8 italic">
                <MessageSquare size={16} />
                FALE COM O HUB
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-white tracking-normal mb-8 italic uppercase leading-[1.3] pb-4 pr-6">
                Precisa de uma informação ou <span className="text-gold-gradient">activar um protocolo?</span>
              </h2>
              <p className="text-white/40 font-black text-xs uppercase tracking-[0.2em] leading-relaxed mb-12 italic">
                Envie a sua mensagem directamente para as empresas. O seu pedido será processado e respondido através do nosso blog corporativo.
              </p>

              <div className="space-y-8">
                <div className="glass-panel flex items-center gap-6 p-8 rounded-[40px] border border-white/5 hover:border-gold-primary/20 transition-all gold-glow">
                  <div className="w-14 h-14 bg-gold-primary/10 rounded-2xl flex items-center justify-center text-gold-primary border border-gold-primary/20">
                    <ShieldCheck size={28} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-white uppercase tracking-[0.2em] italic mb-1">Criptografia de Dados</p>
                    <p className="text-[10px] text-white/20 font-black uppercase tracking-widest italic">Protocolo de segurança Retail Premium V.2026.</p>
                  </div>
                </div>
                <div className="glass-panel flex items-center gap-6 p-8 rounded-[40px] border border-white/5 hover:border-gold-primary/20 transition-all gold-glow">
                  <div className="w-14 h-14 bg-gold-primary/10 rounded-2xl flex items-center justify-center text-gold-primary border border-gold-primary/20">
                    <Zap size={28} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-white uppercase tracking-[0.2em] italic mb-1">Processamento Síncrono</p>
                    <p className="text-[10px] text-white/20 font-black uppercase tracking-widest italic">As empresas são notificadas instantaneamente do seu pedido.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-panel p-10 md:p-14 rounded-[60px] border border-white/5 shadow-2xl relative gold-glow">
              <div className="absolute inset-0 bg-gold-primary opacity-[0.01]" />
              <form onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const formData = new FormData(form);

                const data = {
                  company_id: parseInt(formData.get('company_id') as string),
                  nome: formData.get('nome') as string,
                  email: formData.get('email') as string,
                  assunto: formData.get('assunto') as string,
                  mensagem: formData.get('mensagem') as string
                };

                try {
                  const { error } = await supabase.from('public_inquiries').insert([data]);
                  if (error) throw error;
                  alert('Protocolo enviado com sucesso! Verifique o Blog Corporativo.');
                  form.reset();
                } catch (err) {
                  console.error('Erro ao enviar protocolo:', err);
                  alert('Erro no processamento. Tente novamente.');
                }
              }} className="space-y-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[9px] font-black uppercase text-gold-primary tracking-[0.3em] ml-2 italic">IDENTIDADE</label>
                    <input name="nome" required type="text" className="w-full px-6 py-5 bg-white/5 border border-white/5 rounded-2xl focus:border-gold-primary/40 focus:ring-4 focus:ring-gold-primary/10 text-white font-black text-xs uppercase tracking-widest placeholder:text-white/5 outline-none transition-all" placeholder="EX: AGENTE DELTA" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[9px] font-black uppercase text-gold-primary tracking-[0.3em] ml-2 italic">ENDEREÇO DIGITAL</label>
                    <input name="email" required type="email" className="w-full px-6 py-5 bg-white/5 border border-white/5 rounded-2xl focus:border-gold-primary/40 focus:ring-4 focus:ring-gold-primary/10 text-white font-black text-xs uppercase tracking-widest placeholder:text-white/5 outline-none transition-all" placeholder="USER@PROTOCOL.COM" />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[9px] font-black uppercase text-gold-primary tracking-[0.3em] ml-2 italic">DESTINO DO PROTOCOLO</label>
                  <select name="company_id" required className="w-full px-6 py-5 bg-white/5 border border-white/5 rounded-2xl focus:border-gold-primary/40 focus:ring-4 focus:ring-gold-primary/10 text-white font-black text-xs uppercase tracking-widest outline-none transition-all cursor-pointer">
                    <option value="" className="bg-bg-deep">SELECIONE O TARGET...</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id} className="bg-bg-deep">{c.name.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[9px] font-black uppercase text-gold-primary tracking-[0.3em] ml-2 italic">MOTIVO DA CONEXÃO</label>
                  <select name="assunto" className="w-full px-6 py-5 bg-white/5 border border-white/5 rounded-2xl focus:border-gold-primary/40 focus:ring-4 focus:ring-gold-primary/10 text-white font-black text-xs uppercase tracking-widest outline-none transition-all cursor-pointer">
                    <option className="bg-bg-deep">PEDIDO DE INFORMAÇÃO</option>
                    <option className="bg-bg-deep">SOLICITAR ORÇAMENTO</option>
                    <option className="bg-bg-deep">PARCERIA COMERCIAL</option>
                    <option className="bg-bg-deep">SUPORTE TÉCNICO</option>
                    <option className="bg-bg-deep">OUTROS</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[9px] font-black uppercase text-gold-primary tracking-[0.3em] ml-2 italic">MENSAGEM DE COMUNICAÇÃO</label>
                  <textarea name="mensagem" required rows={4} className="w-full px-6 py-5 bg-white/5 border border-white/5 rounded-2xl focus:border-gold-primary/40 focus:ring-4 focus:ring-gold-primary/10 text-white font-black text-xs uppercase tracking-widest placeholder:text-white/5 outline-none transition-all resize-none" placeholder="DESCREVA O OBJECTIVO..." />
                </div>
                <button type="submit" className="w-full py-6 bg-gold-primary text-bg-deep rounded-[32px] font-black text-sm uppercase tracking-[0.4em] hover:bg-white transition-all shadow-2xl active:scale-95 italic">
                  TRANSMITIR PROTOCOLO AGORA
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-gold-primary rounded-[60px] p-16 md:p-32 text-center text-bg-deep relative overflow-hidden shadow-[0_0_80px_rgba(212,175,55,0.2)] metallic-border">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white opacity-10 rounded-full -mr-60 -mt-60 blur-3xl animate-pulse" />
            <div className="relative z-10">
              <h2 className="text-5xl md:text-8xl font-black tracking-tight mb-10 leading-tight italic uppercase pb-4">
                Pronto para digitalizar <br /> o seu negócio?
              </h2>
              <p className="text-bg-deep/60 text-xl font-black mb-16 max-w-2xl mx-auto uppercase tracking-normal italic pb-2">
                Junte-se à Venda Plus e tenha total controlo administrativo com as ferramentas mais modernas do mercado angolano.
              </p>
              <button
                onClick={onStartClick}
                className="px-16 py-8 bg-bg-deep text-white rounded-[32px] font-black text-xl uppercase tracking-[0.4em] hover:bg-white hover:text-bg-deep transition-all shadow-2xl flex items-center justify-center gap-4 mx-auto italic active:scale-95"
              >
                ACESSO À GESTÃO <ExternalLink size={28} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-bg-deep py-24 border-t border-white/5 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">
          <div
            onClick={() => setShowIntro(true)}
            className="flex items-center gap-4 group cursor-pointer"
          >
            <div className="w-10 h-10 bg-gold-primary rounded-xl flex items-center justify-center text-bg-deep shadow-2xl group-hover:scale-110 transition-transform">
              <Store size={24} />
            </div>
            <span className="text-2xl font-black text-white tracking-tight italic uppercase pr-1">VENDA <span className="text-gold-gradient">PLUS</span></span>
          </div>

          <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] italic">
            &copy; 2026 Venda Plus Hub. Gestão de Alta Performance.
          </div>

          <div className="flex gap-10">
            <a href="https://wa.me/244923000000?text=Termos" target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-white/40 hover:text-gold-primary uppercase tracking-[0.2em] transition-colors italic">Termos</a>
            <a href="https://wa.me/244923000000?text=Privacidade" target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-white/40 hover:text-gold-primary uppercase tracking-[0.2em] transition-colors italic">Privacidade</a>
            <a href="https://wa.me/244923000000?text=Contactos" target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-white/40 hover:text-gold-primary uppercase tracking-[0.2em] transition-colors italic">Contactos</a>
          </div>
        </div>
      </footer>

      {/* Module Detail Modal */}
      {selectedModule && (
        <div className="fixed inset-0 bg-bg-deep/80 backdrop-blur-3xl flex items-center justify-center z-[100] p-4 text-left animate-in fade-in zoom-in duration-500">
          <div className="glass-panel rounded-[60px] w-full max-w-3xl overflow-hidden shadow-[0_0_100px_rgba(212,175,55,0.15)] relative border border-white/5 metallic-border">
            <button
              onClick={() => setSelectedModule(null)}
              className="absolute top-10 right-10 text-white/20 hover:text-gold-primary transition-colors active:scale-90"
            >
              <X size={40} />
            </button>
            <div className="p-12 md:p-20">
              <div className={`w-28 h-28 ${selectedModule.color} rounded-[40px] flex items-center justify-center text-white mb-10 shadow-2xl relative gold-glow-hover`}>
                {React.createElement(IconMap[selectedModule.icon] || ShoppingCart, { size: 48 })}
              </div>
              <h2 className="text-5xl font-black text-white mb-6 tracking-normal uppercase italic italic pb-2">{selectedModule.title}</h2>
              <p className="text-xl text-white/40 font-black uppercase tracking-tight leading-relaxed mb-12 italic">
                {ModuleDetailedInfo[selectedModule.title]?.longDesc || selectedModule.desc}
              </p>

              <div className="space-y-6 mb-16">
                <p className="text-[10px] font-black uppercase text-gold-primary tracking-[0.4em] mb-6 italic">Protocolos Chave</p>
                {(ModuleDetailedInfo[selectedModule.title]?.features || []).map((feature: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-6 text-white/60 font-black text-xs uppercase tracking-widest italic group">
                    <CheckCircle2 size={24} className="text-gold-primary shrink-0 group-hover:scale-110 transition-transform" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-6">
                <button
                  onClick={() => {
                    setSelectedModule(null);
                    onStartClick();
                  }}
                  className="flex-1 py-6 bg-gold-primary text-bg-deep rounded-[32px] font-black text-sm uppercase tracking-[0.3em] hover:bg-white transition-all shadow-2xl italic active:scale-95"
                >
                  INICIAR MÓDULO
                </button>
                <a
                  href={`https://wa.me/244923000000?text=${encodeURIComponent(`Olá! Gostaria de mais informações sobre o módulo "${selectedModule.title}" do Venda Plus.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-6 bg-white/5 text-white border border-white/10 rounded-[32px] font-black text-sm uppercase tracking-[0.3em] hover:bg-white/10 transition-all text-center flex items-center justify-center italic"
                >
                  INFO. PROTOCOLO
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Software Introduction Modal */}
      {showIntro && (
        <div className="fixed inset-0 bg-bg-deep/90 backdrop-blur-3xl flex items-center justify-center z-[110] p-4 text-left animate-in fade-in zoom-in duration-500">
          <div className="glass-panel rounded-[60px] w-full max-w-4xl overflow-hidden shadow-[0_0_120px_rgba(212,175,55,0.2)] relative border border-white/5 metallic-border">
            <button
              onClick={() => setShowIntro(false)}
              className="absolute top-10 right-10 text-white/20 hover:text-gold-primary transition-colors active:scale-90 z-20"
            >
              <X size={40} />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-12 md:p-16 border-b md:border-b-0 md:border-r border-white/5 bg-white/[0.01]">
                <div className="w-20 h-20 bg-gold-primary rounded-[32px] flex items-center justify-center text-bg-deep mb-8 shadow-2xl group-hover:scale-110 transition-transform">
                  <Store size={40} />
                </div>
                <h2 className="text-4xl font-black text-white mb-6 tracking-tight uppercase italic">VENDA <span className="text-gold-gradient">PLUS</span></h2>
                <p className="text-white/40 font-black text-xs uppercase tracking-[0.2em] leading-relaxed italic mb-10">
                  O ecossistema definitivo para gestão empresarial em Angola.
                </p>

                <div className="space-y-6">
                  <div className="flex items-start gap-4 p-5 bg-white/[0.03] rounded-3xl border border-white/5">
                    <div className="mt-1 text-gold-primary"><Zap size={20} /></div>
                    <div>
                      <p className="text-xs font-black text-white uppercase tracking-wider mb-1">Performance Síncrona</p>
                      <p className="text-[10px] text-white/20 font-medium leading-relaxed">Arquitectura de baixa latência para operações críticas em tempo real.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-5 bg-white/[0.03] rounded-3xl border border-white/5">
                    <div className="mt-1 text-gold-primary"><ShieldCheck size={20} /></div>
                    <div>
                      <p className="text-xs font-black text-white uppercase tracking-wider mb-1">Segurança Militar</p>
                      <p className="text-[10px] text-white/20 font-medium leading-relaxed">Criptografia de ponta a ponta e redundância de dados multi-região.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-12 md:p-16 space-y-10">
                <div>
                  <h3 className="text-gold-primary font-black text-[10px] uppercase tracking-[0.4em] mb-8 italic">PROPÓSITO DO PROTOCOLO</h3>
                  <div className="space-y-8">
                    <div className="group">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-gold-primary/10 border border-gold-primary/20 flex items-center justify-center text-gold-primary group-hover:bg-gold-primary group-hover:text-bg-deep transition-all">
                          <ShoppingCart size={16} />
                        </div>
                        <p className="text-sm font-black text-white uppercase tracking-widest italic">Vendas & Facturação</p>
                      </div>
                      <p className="text-[11px] text-white/40 font-medium leading-relaxed ml-12">PDV de alta performance, gestão de inventário inteligente e controlo total de tesouraria.</p>
                    </div>

                    <div className="group">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-gold-primary/10 border border-gold-primary/20 flex items-center justify-center text-gold-primary group-hover:bg-gold-primary group-hover:text-bg-deep transition-all">
                          <Package size={16} />
                        </div>
                        <p className="text-sm font-black text-white uppercase tracking-widest italic">Gestão Farmacêutica</p>
                      </div>
                      <p className="text-[11px] text-white/40 font-medium leading-relaxed ml-12">Controlo rigoroso de lotes, datas de validade e conformidade normativa do sector.</p>
                    </div>

                    <div className="group">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-gold-primary/10 border border-gold-primary/20 flex items-center justify-center text-gold-primary group-hover:bg-gold-primary group-hover:text-bg-deep transition-all">
                          <Users size={16} />
                        </div>
                        <p className="text-sm font-black text-white uppercase tracking-widest italic">Recursos Humanos</p>
                      </div>
                      <p className="text-[11px] text-white/40 font-medium leading-relaxed ml-12">Gestão de talentos, processamento de salários e monitorização de performance automatizada.</p>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    onClick={() => {
                      setShowIntro(false);
                      onStartClick();
                    }}
                    className="w-full py-5 bg-gold-primary text-bg-deep rounded-[24px] font-black text-xs uppercase tracking-[0.3em] hover:bg-white transition-all shadow-2xl italic active:scale-95"
                  >
                    ACTIVAR SISTEMA AGORA
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
