import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
    Settings,
    History,
    Send,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Shield,
    Globe,
    Lock,
    RefreshCcw,
    Clock
} from 'lucide-react';

export default function AgtModule() {
    const { user } = useAuth();
    const [activeSubTab, setActiveSubTab] = useState<'config' | 'logs'>('config');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Config State
    const [config, setConfig] = useState<any>({
        nif_empresa: '',
        username: '',
        password: '',
        endpoint_soap: 'https://servicos.minfin.gov.ao/ws/faturacao',
        auto_send: false,
        aes_secret_key: ''
    });

    // Logs State
    const [logs, setLogs] = useState<any[]>([]);

    useEffect(() => {
        if (user?.company_id) {
            fetchConfig();
            fetchLogs();
        }
    }, [user]);

    const fetchConfig = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('agt_configs')
                .select('*')
                .eq('company_id', user?.company_id)
                .single();

            if (data) setConfig(data);
        } catch (e) {
            console.error('[AGT] Erro ao carregar config:', e);
        }
        setLoading(false);
    };

    const fetchLogs = async () => {
        try {
            const { data, error } = await supabase
                .from('agt_logs')
                .select('*')
                .eq('company_id', user?.company_id)
                .order('created_at', { ascending: false })
                .limit(50);

            if (data) setLogs(data);
        } catch (e) {
            console.error('[AGT] Erro ao carregar logs:', e);
        }
    };

    const handleSaveConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const { error } = await supabase
            .from('agt_configs')
            .upsert({
                company_id: user?.company_id,
                ...config,
                id: config.id // Preservar ID se existir
            });

        if (error) {
            alert('Erro ao salvar configuração: ' + error.message);
        } else {
            alert('Configuração salva com sucesso!');
        }
        setSaving(false);
    };

    return (
        <div className="p-8 space-y-8 relative h-full overflow-y-auto custom-scrollbar">
            {/* Background Glow */}
            <div className="absolute top-[10%] right-[10%] w-[30%] h-[30%] bg-gold-primary/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10">
                <h1 className="text-3xl font-black text-white tracking-tighter italic uppercase">
                    Integração <span className="text-gold-gradient">Webservice AGT</span>
                </h1>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mt-2">
                    Comunicação Directa de Facturação em Tempo Real
                </p>
            </div>

            {/* Sub-Tabs */}
            <div className="flex gap-4 relative z-10">
                <button
                    onClick={() => setActiveSubTab('config')}
                    className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${activeSubTab === 'config' ? 'bg-gold-primary text-bg-deep' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                >
                    <Settings size={14} /> Configuração
                </button>
                <button
                    onClick={() => setActiveSubTab('logs')}
                    className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${activeSubTab === 'logs' ? 'bg-gold-primary text-bg-deep' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                >
                    <History size={14} /> Histórico de Envios
                </button>
            </div>

            {activeSubTab === 'config' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
                    {/* Form Panel */}
                    <div className="glass-panel p-8 rounded-[32px] border border-white/5 space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Shield className="text-gold-primary" size={20} />
                            <h3 className="text-lg font-black text-white uppercase tracking-tight">Credenciais de Acesso</h3>
                        </div>

                        <form onSubmit={handleSaveConfig} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black uppercase text-gold-primary/60 mb-2">NIF da Empresa</label>
                                    <input
                                        type="text"
                                        value={config.nif_empresa}
                                        onChange={e => setConfig({ ...config, nif_empresa: e.target.value })}
                                        className="w-full px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-bold focus:border-gold-primary outline-none transition-all"
                                        placeholder="5400000000"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black uppercase text-gold-primary/60 mb-2">Username (NIF/User)</label>
                                    <input
                                        type="text"
                                        value={config.username}
                                        onChange={e => setConfig({ ...config, username: e.target.value })}
                                        className="w-full px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-bold focus:border-gold-primary outline-none transition-all"
                                        placeholder="5400000000/Admin"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-black uppercase text-gold-primary/60 mb-2">Palavra-passe (Webservice)</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                                    <input
                                        type="password"
                                        value={config.password}
                                        onChange={e => setConfig({ ...config, password: e.target.value })}
                                        className="w-full pl-12 pr-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-bold focus:border-gold-primary outline-none transition-all"
                                        placeholder="••••••••••••"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-black uppercase text-gold-primary/60 mb-2">Endpoint SOAP (AGT)</label>
                                <div className="relative">
                                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                                    <input
                                        type="text"
                                        value={config.endpoint_soap}
                                        onChange={e => setConfig({ ...config, endpoint_soap: e.target.value })}
                                        className="w-full pl-12 pr-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-bold focus:border-gold-primary outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-black uppercase text-gold-primary/60 mb-2">Chave de Encriptação AES (32 chars)</label>
                                <input
                                    type="text"
                                    value={config.aes_secret_key}
                                    onChange={e => setConfig({ ...config, aes_secret_key: e.target.value })}
                                    className="w-full px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-bold focus:border-gold-primary outline-none transition-all"
                                    placeholder="SUA_CHAVE_AES_256_BITS_AQUI"
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                <div className="flex flex-col">
                                    <span className="text-xs font-black text-white uppercase italic">Envio Automático</span>
                                    <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest">Comunicar ao fechar venda</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setConfig({ ...config, auto_send: !config.auto_send })}
                                    className={`w-12 h-6 rounded-full relative transition-all ${config.auto_send ? 'bg-gold-primary' : 'bg-white/10'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${config.auto_send ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full py-4 rounded-2xl bg-gradient-to-r from-gold-primary to-gold-secondary text-bg-deep font-black uppercase tracking-widest hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {saving ? <div className="w-5 h-5 border-2 border-bg-deep border-t-transparent rounded-full animate-spin" /> : 'Guardar Configurações'}
                            </button>
                        </form>
                    </div>

                    {/* Info/Status Panel */}
                    <div className="space-y-6">
                        <div className="glass-panel p-8 rounded-[32px] border border-white/5">
                            <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-3 mb-6">
                                <AlertTriangle className="text-gold-primary" size={20} />
                                Status da Integração
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-6 bg-white/5 rounded-[24px] border border-white/5 flex flex-col items-center text-center">
                                    <span className="text-[8px] font-black uppercase text-gold-primary/40 mb-2 tracking-widest">Estado Local</span>
                                    {config.auto_send ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <CheckCircle className="text-green-500" size={32} />
                                            <span className="text-xs font-black text-white uppercase">Activo</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2">
                                            <Clock className="text-white/20" size={32} />
                                            <span className="text-xs font-black text-white/40 uppercase">Inactivo</span>
                                        </div>
                                    )}
                                </div>
                                <div className="p-6 bg-white/5 rounded-[24px] border border-white/5 flex flex-col items-center text-center">
                                    <span className="text-[8px] font-black uppercase text-gold-primary/40 mb-2 tracking-widest">Servidor AGT</span>
                                    <div className="flex flex-col items-center gap-2">
                                        <Globe className="text-gold-primary animate-pulse" size={32} />
                                        <span className="text-xs font-black text-white uppercase">Online</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="glass-panel p-8 rounded-[32px] border border-white/5 bg-gold-primary/[0.02]">
                            <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4 italic">Sobre o Webservice AGT</h3>
                            <p className="text-[11px] text-white/60 font-medium leading-relaxed">
                                Este módulo realiza a comunicação direta de faturas em formato XML SOAP com os servidores da Autoridade Geral Tributária.
                                <br /><br />
                                <strong className="text-gold-primary">Importante:</strong> Certifique-se de que a password e o NIF correspondem aos dados cadastrados no portal do contribuinte para o acesso ao Webservice.
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="glass-panel p-8 rounded-[32px] border border-white/5 relative z-10 min-h-[500px] flex flex-col">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                            <History className="text-gold-primary" size={24} />
                            Faturas Comunicadas
                        </h3>
                        <button
                            onClick={fetchLogs}
                            className="p-3 bg-white/5 rounded-xl text-gold-primary hover:bg-white/10 transition-all"
                        >
                            <RefreshCcw size={18} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar -mr-4 pr-4 space-y-3">
                        {logs.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-white/10 py-20">
                                <Send size={64} className="mb-4 opacity-5" />
                                <p className="text-[10px] uppercase font-black tracking-[0.3em]">Nenhum histórico encontrado</p>
                            </div>
                        ) : (
                            logs.map((log) => (
                                <div key={log.id} className="bg-white/5 p-5 rounded-2xl flex items-center justify-between border border-white/5 hover:border-gold-primary/20 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all ${log.status === 'ENVIADO' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                                log.status === 'ERRO' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                    'bg-white/5 text-white/40 border-white/5'
                                            }`}>
                                            {log.status === 'ENVIADO' ? <CheckCircle size={20} /> : <XCircle size={20} />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className="text-sm font-black text-white">{log.invoice_number || 'S/ Nº'}</span>
                                                <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${log.status === 'ENVIADO' ? 'bg-green-500/20 text-green-400' :
                                                        log.status === 'ERRO' ? 'bg-red-500/20 text-red-400' :
                                                            'bg-white/10 text-white/40'
                                                    }`}>
                                                    {log.status}
                                                </span>
                                            </div>
                                            <p className="text-[10px] font-black uppercase text-white/40 tracking-wider">
                                                {new Date(log.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>

                                    {log.error_message && (
                                        <div className="hidden lg:block max-w-xs overflow-hidden">
                                            <p className="text-[9px] text-red-400/60 font-bold truncate">
                                                {log.error_message}
                                            </p>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-3">
                                        <button className="px-4 py-2 rounded-xl bg-white/5 text-[9px] font-black text-white/60 uppercase tracking-widest hover:bg-white/10 transition-all">
                                            XML
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
