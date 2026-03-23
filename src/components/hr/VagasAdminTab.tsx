import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { safeQuery } from '../../lib/supabaseUtils';
import { useAuth } from '../../contexts/AuthContext';
import { RhVaga, RhCandidaturaPublica } from '../../types';
import { Plus, Edit2, Trash2, Users, ExternalLink, Download, Search, CheckCircle, XCircle, Clock, X } from 'lucide-react';

const VagasAdminTab: React.FC = () => {
    const { user } = useAuth();
    const [vagas, setVagas] = useState<RhVaga[]>([]);
    const [candidaturas, setCandidaturas] = useState<RhCandidaturaPublica[]>([]);
    const [loading, setLoading] = useState(true);

    const [showVagaModal, setShowVagaModal] = useState(false);
    const [showCandidaturasModal, setShowCandidaturasModal] = useState(false);

    const [editingVaga, setEditingVaga] = useState<Partial<RhVaga>>({
        status: 'ativa',
        quantidade: 1,
        tipo_contrato: 'Tempo Inteiro',
        nivel_experiencia: 'Júnior',
        salario: '',
        data_encerramento: ''
    });

    const [selectedVaga, setSelectedVaga] = useState<RhVaga | null>(null);

    useEffect(() => {
        if (user?.company_id) {
            fetchVagas();
        }
    }, [user?.company_id]);

    const fetchVagas = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/hr/vagas', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Falha ao carregar vagas');
            const data = await res.json();
            setVagas(data || []);
        } catch (error) {
            console.error(error);
            alert('Erro ao carregar vagas.');
        } finally {
            setLoading(false);
        }
    };

    const fetchCandidaturas = async (vagaId: string) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/hr/candidaturas?vagaId=${vagaId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Falha ao carregar candidaturas');
            const data = await res.json();
            setCandidaturas(data || []);
        } catch (error) {
            console.error(error);
        }
    };

    const handleOpenCandidaturas = (vaga: RhVaga) => {
        setSelectedVaga(vaga);
        fetchCandidaturas(vaga.id);
        setShowCandidaturasModal(true);
    };

    const handleSaveVaga = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const url = editingVaga.id ? `/api/hr/vagas/${editingVaga.id}` : '/api/hr/vagas';
            const method = editingVaga.id ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(editingVaga)
            });

            if (!res.ok) throw new Error('Falha ao guardar vaga');
            
            setShowVagaModal(false);
            setEditingVaga({ status: 'ativa', quantidade: 1, tipo_contrato: 'Tempo Inteiro', nivel_experiencia: 'Júnior', salario: '', data_encerramento: '' });
            fetchVagas();
            alert('Vaga guardada com sucesso!');
        } catch (error: any) {
            alert(`Erro: ${error.message}`);
        }
    };

    const handleDeleteVaga = async (id: string, titulo: string) => {
        if (!confirm(`Apagar a vaga ${titulo}? Todas as candidaturas associadas serão apagadas.`)) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/hr/vagas/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Falha ao eliminar vaga');
            fetchVagas();
        } catch (error: any) {
            alert(`Erro: ${error.message}`);
        }
    };

    const handleUpdateCandidaturaStatus = async (id: string, newStatus: string) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/hr/candidaturas/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });
            if (!res.ok) throw new Error('Falha ao atualizar status da candidatura');
            if (selectedVaga) fetchCandidaturas(selectedVaga.id);
        } catch (error: any) {
            alert(`Erro: ${error.message}`);
        }
    };

    const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm font-bold text-white focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-white/20";

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto relative z-10">
            <div className="flex justify-between items-center glass-panel p-6 rounded-[2rem] border border-white/5">
                <div>
                    <h2 className="text-xl font-bold text-white">Portal de Vagas e Recrutamento</h2>
                    <p className="text-sm text-white/30">Gestão de oportunidades públicas e análise de currículos.</p>
                </div>
                <button
                    onClick={() => {
                        setEditingVaga({ status: 'ativa', quantidade: 1, tipo_contrato: 'Tempo Inteiro', nivel_experiencia: 'Júnior', salario: '', data_encerramento: '' });
                        setShowVagaModal(true);
                    }}
                    className="flex items-center gap-2 bg-indigo-500/20 text-indigo-400 px-6 py-3 rounded-xl font-bold transition-all border border-indigo-500/30 hover:bg-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.1)]"
                >
                    <Plus size={20} />
                    Publicar Nova Vaga
                </button>
            </div>

            {/* LISTA DE VAGAS */}
            <div className="glass-panel rounded-[2rem] border border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-white/5 border-b border-white/5">
                            <tr>
                                <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-widest text-white/20">Cargo / Título</th>
                                <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-widest text-white/20">Localização</th>
                                <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-widest text-white/20">Estado</th>
                                <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-widest text-white/20">Publicação</th>
                                <th className="text-right py-4 px-6 font-black text-[10px] uppercase tracking-widest text-white/20">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan={5} className="p-8 text-center text-white/30">A carregar vagas...</td></tr>
                            ) : vagas.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-white/30">Nenhuma vaga publicada.</td></tr>
                            ) : (
                                vagas.map((vaga) => (
                                    <tr key={vaga.id} className="hover:bg-white/5 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-white">{vaga.titulo}</span>
                                                <span className="text-xs text-white/30">{vaga.tipo_contrato} • {vaga.nivel_experiencia}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-sm text-white/40">{vaga.localizacao || 'Não definido'}</td>
                                        <td className="py-4 px-6">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${vaga.status === 'ativa' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                                                {vaga.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-sm text-white/40">
                                            {new Date(vaga.data_publicacao).toLocaleDateString()}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => handleOpenCandidaturas(vaga)} className="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors" title="Ver Candidaturas">
                                                    <Users size={18} />
                                                </button>
                                                <button onClick={() => { setEditingVaga(vaga); setShowVagaModal(true); }} className="p-2 text-white/20 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors">
                                                    <Edit2 size={18} />
                                                </button>
                                                <button onClick={() => handleDeleteVaga(vaga.id, vaga.titulo)} className="p-2 text-white/20 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL NOVA VAGA */}
            {showVagaModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="glass-panel rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-white/10">
                        <div className="sticky top-0 glass-panel border-b border-white/5 px-8 py-6 rounded-t-[2rem] flex justify-between items-center z-10">
                            <div>
                                <h3 className="text-2xl font-bold text-white">{editingVaga.id ? 'Editar Vaga' : 'Publicar Vaga de Emprego'}</h3>
                                <p className="text-white/30">Detalhes visíveis no site corporativo</p>
                            </div>
                            <button onClick={() => setShowVagaModal(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                                <X size={24} className="text-white/30" />
                            </button>
                        </div>
                        <form onSubmit={handleSaveVaga} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Título da Vaga *</label>
                                    <input required type="text" value={editingVaga.titulo || ''} onChange={e => setEditingVaga({ ...editingVaga, titulo: e.target.value })} className={inputCls} placeholder="Ex: Engenheiro de Software Sênior" />
                                </div>

                                <div className="col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Descrição Resumida *</label>
                                    <textarea required rows={3} value={editingVaga.descricao || ''} onChange={e => setEditingVaga({ ...editingVaga, descricao: e.target.value })} className={inputCls} placeholder="Resumo atrativo sobre a vaga e a equipa..." />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Localização *</label>
                                    <input required type="text" value={editingVaga.localizacao || ''} onChange={e => setEditingVaga({ ...editingVaga, localizacao: e.target.value })} className={inputCls} placeholder="Ex: Luanda, Talatona (Híbrido)" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Tipo de Contrato</label>
                                    <select value={editingVaga.tipo_contrato || ''} onChange={e => setEditingVaga({ ...editingVaga, tipo_contrato: e.target.value })} className={inputCls}>
                                        <option value="Tempo Inteiro">Tempo Inteiro</option>
                                        <option value="Meio Tempo">Meio Tempo</option>
                                        <option value="Estágio">Estágio</option>
                                        <option value="Freelancer">Freelancer</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Experiência</label>
                                    <select value={editingVaga.nivel_experiencia || ''} onChange={e => setEditingVaga({ ...editingVaga, nivel_experiencia: e.target.value })} className={inputCls}>
                                        <option value="Estagiário">Estagiário</option>
                                        <option value="Júnior">Júnior</option>
                                        <option value="Pleno">Pleno</option>
                                        <option value="Sênior">Sênior</option>
                                        <option value="Diretor">Diretor</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Pretensão Salarial (Opcional)</label>
                                    <input type="text" value={editingVaga.salario || ''} onChange={e => setEditingVaga({ ...editingVaga, salario: e.target.value })} className={inputCls} placeholder="Ex: Negociável, ou 1.000.000 Kz" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Nº de Vagas Abertas</label>
                                    <input type="number" min="1" value={editingVaga.quantidade || 1} onChange={e => setEditingVaga({ ...editingVaga, quantidade: parseInt(e.target.value) })} className={inputCls} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Data de Encerramento (Opcional)</label>
                                    <input type="date" value={editingVaga.data_encerramento ? new Date(editingVaga.data_encerramento).toISOString().split('T')[0] : ''} onChange={e => setEditingVaga({ ...editingVaga, data_encerramento: e.target.value })} className={inputCls} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Status da Vaga</label>
                                    <select value={editingVaga.status || ''} onChange={e => setEditingVaga({ ...editingVaga, status: e.target.value as any })} className={inputCls}>
                                        <option value="ativa">Ativa (Visível no Site)</option>
                                        <option value="encerrada">Encerrada (Invisível)</option>
                                    </select>
                                </div>

                                <div className="col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Requisitos (Um por linha)</label>
                                    <textarea rows={4} value={editingVaga.requisitos || ''} onChange={e => setEditingVaga({ ...editingVaga, requisitos: e.target.value })} className={inputCls} placeholder={"- Licenciatura em...\n- 3 Anos de Exp..."} />
                                </div>
                            </div>
                            <div className="pt-6 flex justify-end gap-4 border-t border-white/5">
                                <button type="button" onClick={() => setShowVagaModal(false)} className="px-6 py-3 font-bold text-white/40 hover:bg-white/5 rounded-xl transition-colors border border-white/10">Cancelar</button>
                                <button type="submit" className="px-8 py-3 bg-indigo-500/20 text-indigo-400 font-bold rounded-xl transition-all border border-indigo-500/30 hover:bg-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.1)]">Guardar Vaga</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL CANDIDATURAS */}
            {showCandidaturasModal && selectedVaga && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="glass-panel rounded-[2rem] w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-white/10">
                        <div className="bg-gradient-to-r from-indigo-500/20 to-indigo-600/10 px-8 py-6 flex justify-between items-center shrink-0 border-b border-white/5">
                            <div>
                                <h3 className="text-2xl font-bold text-white">Candidatos: {selectedVaga.titulo}</h3>
                                <p className="text-white/30">{candidaturas.length} Currículos Recebidos</p>
                            </div>
                            <button onClick={() => setShowCandidaturasModal(false)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                                <X size={24} className="text-white" />
                            </button>
                        </div>
                        <div className="p-0 overflow-y-auto flex-1">
                            {candidaturas.length === 0 ? (
                                <div className="p-12 text-center text-white/30 flex flex-col items-center">
                                    <Users size={48} className="text-white/10 mb-4" />
                                    <p>Ainda não há candidatos para esta vaga.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-white/5">
                                    {candidaturas.map(c => (
                                        <div key={c.id} className="p-6 hover:bg-white/5 transition-colors flex items-center justify-between gap-6">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h4 className="text-lg font-bold text-white">{c.nome}</h4>
                                                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase border
                                                    ${c.status === 'pendente' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                            c.status === 'em_analise' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                                c.status === 'aprovado' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                                                        {c.status.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-white/30 flex gap-4">
                                                    <span>{c.email}</span>
                                                    {c.telefone && <span>• {c.telefone}</span>}
                                                    <span>• {new Date(c.data_envio).toLocaleDateString()}</span>
                                                </div>
                                                {c.mensagem && (
                                                    <p className="text-sm text-white/40 mt-3 p-3 bg-white/5 rounded-lg italic border border-white/5">"{c.mensagem}"</p>
                                                )}
                                            </div>

                                            <div className="flex flex-col items-end gap-3">
                                                {c.cv_path && (
                                                    <a href={c.cv_path} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-4 py-2 rounded-lg transition-colors border border-indigo-500/20">
                                                        <Download size={16} /> Ver Currículo (PDF)
                                                    </a>
                                                )}

                                                <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
                                                    <select
                                                        value={c.status}
                                                        onChange={(e) => handleUpdateCandidaturaStatus(c.id, e.target.value)}
                                                        className="bg-transparent border-none text-sm font-semibold text-white outline-none cursor-pointer focus:ring-0"
                                                    >
                                                        <option value="pendente">⏳ Pendente</option>
                                                        <option value="em_analise">👀 Em Análise</option>
                                                        <option value="aprovado">✅ Aprovar</option>
                                                        <option value="rejeitado">❌ Rejeitar</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VagasAdminTab;
