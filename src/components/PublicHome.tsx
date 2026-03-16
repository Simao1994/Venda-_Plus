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
    <div className="flex items-center gap-4 px-4 py-2 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm transition-all hover:bg-gray-100">
      <div className="flex items-center gap-2 text-emerald-600">
        <Clock size={16} />
        <span className="text-xs font-black tracking-tighter uppercase italic">{time.toLocaleTimeString('pt-PT')}</span>
      </div>
      <div className="w-px h-4 bg-gray-200" />
      <div className="flex items-center gap-2 text-gray-400">
        <Calendar size={16} />
        <span className="text-xs font-black tracking-tighter uppercase italic">{time.toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
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
    <div className="min-h-screen bg-white selection:bg-emerald-100">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <Store size={24} />
            </div>
            <span className="text-2xl font-black text-gray-900 tracking-tighter italic">VENDA <span className="text-emerald-600">PLUS</span></span>
          </div>

          <div className="hidden md:flex items-center gap-10">
            <a href="#solucoes" className="text-sm font-bold text-gray-600 hover:text-emerald-600 transition-colors">Soluções</a>
            <a href="#market" className="text-sm font-bold text-gray-600 hover:text-emerald-600 transition-colors">Market</a>
            <a href="#vagas" className="text-sm font-bold text-gray-600 hover:text-emerald-600 transition-colors">Vagas</a>
            <a href="#contacto" className="text-sm font-bold text-gray-600 hover:text-emerald-600 transition-colors">Contacto</a>
            <a href="#precos" className="text-sm font-bold text-gray-600 hover:text-emerald-600 transition-colors">Preços</a>
          </div>

          <div className="hidden lg:block">
            <DigitalClock />
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onLoginClick}
              className="px-8 py-3 bg-gray-900 text-white rounded-2xl font-bold text-sm hover:bg-emerald-600 transition-all shadow-xl shadow-gray-200"
            >
              Acesso à Gestão
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="pt-32 pb-20 overflow-hidden relative min-h-[90vh] flex items-center">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gray-950">
          <img
            src="/hero-new.png"
            alt="Venda Plus Analytics Hero"
            className="w-full h-full object-cover opacity-60"
            style={{ filter: 'brightness(0.7)', objectPosition: 'center right' }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/80 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 w-full">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-8 backdrop-blur-md">
              <ShieldCheck size={14} />
              Software de Gestão Retail Premium
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-white leading-tight tracking-tighter mb-8 max-w-2xl">
              A inteligência por trás do seu <br />
              <span className="text-emerald-500">supermercado.</span>
            </h1>

            <p className="text-xl text-slate-300 font-medium leading-relaxed mb-12 max-w-xl">
              Venda Plus Retail Cloud: Uma plataforma completa para gestão de inventário, PDV de alta performance e fidelização de clientes em tempo real.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-20">
              <button
                onClick={onStartClick}
                className="px-10 py-5 bg-emerald-600 text-white rounded-[24px] font-black text-lg hover:bg-emerald-700 transition-all shadow-2xl shadow-emerald-600/20 flex items-center justify-center gap-2"
              >
                Ativar Minha Licença <ArrowRight size={20} />
              </button>
              <a
                href="#precos"
                className="px-10 py-5 bg-white/5 text-white border-2 border-white/10 backdrop-blur-md rounded-[24px] font-black text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-2"
              >
                Explorar Planos
              </a>
            </div>

            <div className="grid grid-cols-3 gap-12 border-t border-white/10 pt-12">
              {config.landing_stats.map((stat: any, i: number) => (
                <div key={i}>
                  <p className="text-3xl font-black text-white">{stat.value}</p>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Modules Grid */}
      <section id="solucoes" className="py-32 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter mb-4">Módulos Inteligentes</h2>
            <p className="text-gray-500 font-medium text-lg max-w-2xl mx-auto">
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
                  className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group cursor-pointer"
                >
                  <div className={`w-16 h-16 ${m.color} rounded-2xl flex items-center justify-center text-white mb-8 shadow-lg shadow-gray-100 group-hover:scale-110 transition-transform`}>
                    <Icon size={28} />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-4">{m.title}</h3>
                  <p className="text-gray-500 font-medium leading-relaxed mb-6 line-clamp-2">{m.desc}</p>
                  <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm group-hover:gap-4 transition-all uppercase tracking-widest text-[10px]">
                    Saiba Mais <ArrowRight size={14} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Market Preview */}
      <section id="market" className="py-32 overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-end justify-between gap-8 mb-16">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-widest mb-4">
                <Globe size={14} />
                VENDA PLUS MARKET
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter">Oportunidades em Tempo Real</h2>
            </div>

            <div className="w-full md:w-96 relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Pesquisar ofertas..."
                className="w-full pl-14 pr-6 py-4 rounded-2xl border-2 border-gray-50 focus:border-emerald-500 text-gray-900 font-bold transition-all shadow-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-gray-50 rounded-[40px] h-96 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filtered.map(pub => (
                <article key={pub.id} className="bg-white rounded-[32px] overflow-hidden group border border-gray-50 hover:border-emerald-100 transition-all shadow-sm hover:shadow-xl">
                  {pub.image && (
                    <div className="aspect-[4/3] overflow-hidden">
                      <img src={pub.image} alt={pub.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                        <Store size={14} className="text-gray-400" />
                      </div>
                      <span className="text-xs font-black text-gray-900 uppercase tracking-tighter truncate">{pub.company_name}</span>
                    </div>
                    <h3 className="font-black text-gray-900 text-lg mb-2 leading-tight group-hover:text-emerald-600 transition-colors">{pub.title}</h3>
                    <p className="text-gray-500 text-xs line-clamp-3 leading-relaxed mb-6">{pub.content}</p>

                    {pub.company_phone && (
                      <a
                        href={`https://wa.me/${pub.company_phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá! Vi a vossa publicação "${pub.title}" no Venda Plus Market e gostaria de obter mais informações.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-600 hover:text-white transition-all"
                      >
                        <Smartphone size={14} />
                        Pedir Informação
                      </a>
                    )}
                  </div>
                </article>
              ))}
              {filtered.length === 0 && (
                <div className="col-span-full py-20 text-center text-gray-400 font-bold">
                  Nenhuma publicação encontrada.
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Vacancies Section */}
      <section id="vagas" className="py-32 bg-gray-50/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-widest mb-4">
              <Briefcase size={14} />
              OPORTUNIDADES DE CARREIRA
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter">Vagas Disponíveis</h2>
            <p className="text-gray-500 font-medium mt-4 max-w-xl mx-auto">
              Junte-se às melhores empresas que utilizam a nossa tecnologia. Encontre a sua próxima oportunidade aqui.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {vagas.map((vaga) => (
              <div key={vaga.id} className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full mb-3">
                      {vaga.tipo_contrato || 'Tempo Inteiro'}
                    </span>
                    <h3 className="text-2xl font-black text-gray-900 leading-tight group-hover:text-emerald-600 transition-colors">
                      {vaga.titulo}
                    </h3>
                    <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-tighter italic">
                      {vaga.companies?.name || 'Venda Plus Partner'}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400">
                    <Briefcase size={24} />
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3 text-sm text-gray-500 font-medium">
                    <Globe size={16} className="text-emerald-500" />
                    <span>{vaga.localizacao || 'Angola'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-500 font-medium">
                    <Zap size={16} className="text-emerald-500" />
                    <span>{vaga.nivel_experiencia || 'Experiência Relevante'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                  <div className="text-lg font-black text-gray-900">
                    {vaga.salario || 'Salário Negociável'}
                  </div>
                  <button
                    onClick={() => {
                      const msg = `Olá! Gostaria de me candidatar à vaga de "${vaga.titulo}" que vi no Venda Plus.`;
                      window.open(`https://wa.me/244923000000?text=${encodeURIComponent(msg)}`, '_blank');
                    }}
                    className="px-6 py-3 bg-gray-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-gray-200"
                  >
                    Candidatar-se
                  </button>
                </div>
              </div>
            ))}

            {vagas.length === 0 && (
              <div className="col-span-full py-20 text-center bg-white rounded-[40px] border border-dashed border-gray-200">
                <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-300 mx-auto mb-4">
                  <Briefcase size={28} />
                </div>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Sem vagas ativas no momento</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="precos" className="py-32 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">Planos Escaláveis</h2>
            <p className="text-slate-400 font-medium text-lg max-w-2xl mx-auto">
              Escolha o plano que melhor se adapta ao tamanho do seu negócio hoje, e cresça connosco amanhã.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.slice(0, 3).map((plan, i) => {
              const publicFeatures = Array.isArray(plan.public_features) ? plan.public_features : [];
              return (
                <div key={i} className={`p-10 rounded-[40px] border-2 transition-all duration-500 ${plan.is_featured ? 'bg-indigo-600 border-indigo-500 shadow-2xl shadow-indigo-500/20 scale-105' : 'bg-slate-800/50 border-slate-700 hover:border-slate-500'
                  }`}>
                  <h3 className="text-2xl font-black mb-1">{plan.name}</h3>
                  <p className="text-xs font-bold text-slate-400 mb-6 line-clamp-2 italic">{plan.description}</p>
                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="text-5xl font-black">{plan.price_monthly.toLocaleString()}</span>
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Kz/mês</span>
                  </div>
                  <ul className="space-y-4 mb-10">
                    {publicFeatures.map((f: string, j: number) => (
                      <li key={j} className="flex items-center gap-3 text-sm font-bold">
                        <CheckCircle2 size={18} className={plan.is_featured ? 'text-indigo-200' : 'text-emerald-500'} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={onStartClick}
                    className={`w-full py-5 rounded-2xl font-black transition-all ${plan.is_featured ? 'bg-white text-indigo-600 hover:bg-slate-50' : 'bg-slate-700 text-white hover:bg-slate-600'
                      }`}
                  >
                    Começar Agora
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contacto" className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-widest mb-4">
                <MessageSquare size={14} />
                FALE CONNOSCO
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter mb-6">
                Precisa de uma informação ou <span className="text-emerald-600">fazer um pedido?</span>
              </h2>
              <p className="text-gray-500 font-medium text-lg leading-relaxed mb-8">
                Envie a sua mensagem directamente para as empresas. O seu pedido será processado e respondido através do nosso blog corporativo.
              </p>

              <div className="space-y-6">
                <div className="flex items-center gap-4 p-6 bg-gray-50 rounded-[32px] border border-gray-100">
                  <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-900 uppercase tracking-widest">Segurança Total</p>
                    <p className="text-xs text-gray-500 font-medium">Os seus dados são protegidos e enviados apenas à empresa destino.</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-6 bg-gray-50 rounded-[32px] border border-gray-100">
                  <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                    <Zap size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-900 uppercase tracking-widest">Resposta Rápida</p>
                    <p className="text-xs text-gray-500 font-medium">As empresas são notificadas instantaneamente do seu pedido.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-8 md:p-12 rounded-[50px] border border-gray-100 shadow-sm">
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
                  alert('Mensagem enviada com sucesso! Verifique o Blog Corporativo para a resposta em breve.');
                  form.reset();
                } catch (err) {
                  console.error('Erro ao enviar mensagem:', err);
                  alert('Erro ao enviar mensagem. Por favor, tente novamente.');
                }
              }} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Seu Nome</label>
                  <input name="nome" required type="text" className="w-full px-6 py-4 rounded-2xl border-2 border-gray-100 focus:border-emerald-500 transition-all font-bold" placeholder="Ex: João Silva" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Seu Email</label>
                  <input name="email" required type="email" className="w-full px-6 py-4 rounded-2xl border-2 border-gray-100 focus:border-emerald-500 transition-all font-bold" placeholder="joao@exemplo.com" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Empresa Destino</label>
                  <select name="company_id" required className="w-full px-6 py-4 rounded-2xl border-2 border-gray-100 focus:border-emerald-500 transition-all font-bold bg-white">
                    <option value="">Selecione uma empresa...</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Assunto / Motivo</label>
                  <select name="assunto" className="w-full px-6 py-4 rounded-2xl border-2 border-gray-100 focus:border-emerald-500 transition-all font-bold bg-white">
                    <option>Pedido de Informação</option>
                    <option>Solicitar Orçamento</option>
                    <option>Parceria Comercial</option>
                    <option>Suporte Técnico</option>
                    <option>Outros</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Mensagem</label>
                  <textarea name="mensagem" required rows={4} className="w-full px-6 py-4 rounded-2xl border-2 border-gray-100 focus:border-emerald-500 transition-all font-bold" placeholder="Como podemos ajudar?" />
                </div>
                <button type="submit" className="w-full py-5 bg-emerald-600 text-white rounded-[24px] font-black text-lg hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200">
                  Enviar Pedido Agora
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-emerald-600 rounded-[50px] p-12 md:p-24 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-8 leading-none">
                Pronto para digitalizar o seu negócio?
              </h2>
              <p className="text-emerald-50 text-xl font-medium mb-12 max-w-2xl mx-auto">
                Jorne-se à Venda Plus e tenha total controlo administrativo com as ferramentas mais modernas do mercado angolano.
              </p>
              <button
                onClick={onStartClick}
                className="px-12 py-6 bg-white text-emerald-600 rounded-[28px] font-black text-xl hover:bg-gray-50 transition-all shadow-2xl flex items-center justify-center gap-3 mx-auto"
              >
                Acesso à Gestão <ExternalLink size={24} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-20 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
              <Store size={20} />
            </div>
            <span className="text-xl font-black text-gray-900 tracking-tighter italic">VENDA <span className="text-emerald-600">PLUS</span></span>
          </div>

          <div className="text-sm font-bold text-gray-400">
            &copy; 2026 Venda Plus. Gestão Inteligente de Negócios.
          </div>

          <div className="flex gap-8">
            <a href="https://wa.me/244923000000?text=Termos" target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-gray-900 hover:text-emerald-600 transition-colors">Termos</a>
            <a href="https://wa.me/244923000000?text=Privacidade" target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-gray-900 hover:text-emerald-600 transition-colors">Privacidade</a>
            <a href="https://wa.me/244923000000?text=Contactos" target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-gray-900 hover:text-emerald-600 transition-colors">Contactos</a>
          </div>
        </div>
      </footer>

      {/* Module Detail Modal */}
      {selectedModule && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 text-left animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] w-full max-w-2xl overflow-hidden shadow-2xl relative">
            <button
              onClick={() => setSelectedModule(null)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 transition-colors"
            >
              <X size={32} />
            </button>
            <div className="p-10 md:p-16">
              <div className={`w-20 h-20 ${selectedModule.color} rounded-3xl flex items-center justify-center text-white mb-8 shadow-2xl shadow-gray-100`}>
                {React.createElement(IconMap[selectedModule.icon] || ShoppingCart, { size: 40 })}
              </div>
              <h2 className="text-4xl font-black text-slate-900 mb-6 tracking-tighter">{selectedModule.title}</h2>
              <p className="text-lg text-slate-500 font-medium leading-relaxed mb-10">
                {ModuleDetailedInfo[selectedModule.title]?.longDesc || selectedModule.desc}
              </p>

              <div className="space-y-4 mb-12">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4">Funcionalidades Chave</p>
                {(ModuleDetailedInfo[selectedModule.title]?.features || []).map((feature: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-4 text-slate-700 font-bold">
                    <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => {
                    setSelectedModule(null);
                    onStartClick();
                  }}
                  className="flex-1 py-5 bg-emerald-600 text-white rounded-3xl font-black text-lg hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200"
                >
                  Ativar Módulo
                </button>
                <a
                  href={`https://wa.me/244923000000?text=${encodeURIComponent(`Olá! Gostaria de mais informações sobre o módulo "${selectedModule.title}" do Venda Plus.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-3xl font-black text-lg hover:bg-slate-200 transition-all text-center flex items-center justify-center"
                >
                  Solicitar Informação
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
