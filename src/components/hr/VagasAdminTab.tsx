import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { safeQuery } from '../../lib/supabaseUtils';
import { useAuth } from '../../contexts/AuthContext';
import { RhVaga, RhCandidaturaPublica } from '../../types';
import { Plus, Edit2, Trash2, Users, ExternalLink, Download, Search, CheckCircle, XCircle, Clock } from 'lucide-react';

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

    // Vaga selecionada para ver candidaturas
    const [selectedVaga, setSelectedVaga] = useState<RhVaga | null>(null);

    useEffect(() => {
        if (user?.company_id) {
            fetchVagas();
        }
    }, [user?.company_id]);

    const fetchVagas = async () => {
        if (!user?.company_id) return;
        setLoading(true);
        const { data, error } = await safeQuery(() =>
            supabase.from('rh_vagas').select('*').eq('company_id', user.company_id).order('criado_em', { ascending: false })
        );
        if (error) {
            console.error(error);
            alert(`Erro ao carregar vagas: ${error.message}`);
        }
        if (!error && data) {
            setVagas(data);
        }
        setLoading(false);
    };

    const fetchCandidaturas = async (vagaId: string) => {
        if (!user?.company_id) return;
        const { data, error } = await safeQuery(() =>
            supabase.from('rh_candidaturas')
                .select('*')
                .eq('company_id', user.company_id)
                .eq('vaga_id', vagaId)
                .order('data_envio', { ascending: false })
        );

        if (!error && data) {
            setCandidaturas(data);
        }
    };

    const handleOpenCandidaturas = (vaga: RhVaga) => {
        setSelectedVaga(vaga);
        fetchCandidaturas(vaga.id);
        setShowCandidaturasModal(true);
    };

    const handleSaveVaga = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.tenant_id) return;
        try {
            if (editingVaga.id) {
                // UPDATE
                const { error } = await safeQuery(() =>
                    supabase.from('rh_vagas').update(editingVaga).eq('id', editingVaga.id).eq('company_id', user.company_id)
                );
                if (error) throw error;
            } else {
                // INSERT
                const { id, ...vagaToInsert } = editingVaga;
                const { error } = await safeQuery(() =>
                    supabase.from('rh_vagas').insert([{ ...vagaToInsert, company_id: user.company_id }])
                );
                if (error) throw error;
            }
            setShowVagaModal(false);
            setEditingVaga({ status: 'ativa', quantidade: 1, tipo_contrato: 'Tempo Inteiro', nivel_experiencia: 'Júnior', salario: '', data_encerramento: '' });
            fetchVagas();
            alert('Vaga guardada com sucesso!');
        } catch (error: any) {
            const msg = error?.message || JSON.stringify(error);
            alert(`Erro do Banco de Dados ao Guardar: ${msg}`);
            console.error('Supabase save error:', error);
        }
    };

    const handleDeleteVaga = async (id: string, titulo: string) => {
        if (!confirm(`Apagar a vaga ${titulo}? Todas as candidaturas associadas serão apagadas.`)) return;
        if (!user?.tenant_id) return;
        await safeQuery(() => supabase.from('rh_vagas').delete().eq('id', id).eq('tenant_id', user.tenant_id));
        fetchVagas();
    };

    const handleUpdateCandidaturaStatus = async (id: string, newStatus: string) => {
        if (!user?.tenant_id) return;
        await safeQuery(() =>
            supabase.from('rh_candidaturas').update({ status: newStatus }).eq('id', id).eq('tenant_id', user.tenant_id)
        );
        if (selectedVaga) fetchCandidaturas(selectedVaga.id);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-zinc-100">
                <div>
                    <h2 className="text-xl font-bold text-zinc-900">Portal de Vagas e Recrutamento</h2>
                    <p className="text-sm text-zinc-500">Gestão de oportunidades públicas e análise de currículos.</p>
                </div>
                <button
                    onClick={() => {
                        setEditingVaga({ status: 'ativa', quantidade: 1, tipo_contrato: 'Tempo Inteiro', nivel_experiencia: 'Júnior', salario: '', data_encerramento: '' });
                        setShowVagaModal(true);
                    }}
                    className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-yellow-950 px-6 py-3 rounded-xl font-bold transition-all shadow-sm"
                >
                    <Plus size={20} />
                    Publicar Nova Vaga
                </button>
            </div>

            {/* LISTA DE VAGAS */}
            <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-zinc-50 border-b border-zinc-100">
                            <tr>
                                <th className="text-left py-4 px-6 font-semibold text-zinc-600">Cargo / Título</th>
                                <th className="text-left py-4 px-6 font-semibold text-zinc-600">Localização</th>
                                <th className="text-left py-4 px-6 font-semibold text-zinc-600">Estado</th>
                                <th className="text-left py-4 px-6 font-semibold text-zinc-600">Publicação</th>
                                <th className="text-right py-4 px-6 font-semibold text-zinc-600">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {loading ? (
                                <tr><td colSpan={5} className="p-8 text-center text-zinc-500">A carregar vagas...</td></tr>
                            ) : vagas.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-zinc-500">Nenhuma vaga publicada.</td></tr>
                            ) : (
                                vagas.map((vaga) => (
                                    <tr key={vaga.id} className="hover:bg-zinc-50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-zinc-900">{vaga.titulo}</span>
                                                <span className="text-xs text-zinc-500">{vaga.tipo_contrato} • {vaga.nivel_experiencia}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-sm text-zinc-600">{vaga.localizacao || 'Não definido'}</td>
                                        <td className="py-4 px-6">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${vaga.status === 'ativa' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {vaga.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-sm text-zinc-600">
                                            {new Date(vaga.data_publicacao).toLocaleDateString()}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => handleOpenCandidaturas(vaga)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors tooltip-trigger relative group" title="Ver Candidaturas">
                                                    <Users size={18} />
                                                </button>
                                                <button onClick={() => { setEditingVaga(vaga); setShowVagaModal(true); }} className="p-2 text-zinc-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors">
                                                    <Edit2 size={18} />
                                                </button>
                                                <button onClick={() => handleDeleteVaga(vaga.id, vaga.titulo)} className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="sticky top-0 bg-white border-b border-zinc-100 px-8 py-6 rounded-t-3xl flex justify-between items-center z-10">
                            <div>
                                <h3 className="text-2xl font-bold text-zinc-900">{editingVaga.id ? 'Editar Vaga' : 'Publicar Vaga de Emprego'}</h3>
                                <p className="text-zinc-500">Detalhes visíveis no site corporativo</p>
                            </div>
                            <button onClick={() => setShowVagaModal(false)} className="p-2 bg-zinc-100 rounded-full hover:bg-zinc-200 transition-colors">
                                <XCircle size={24} className="text-zinc-500" />
                            </button>
                        </div>
                        <form onSubmit={handleSaveVaga} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="col-span-2 space-y-2">
                                    <label className="text-xs font-black text-zinc-400 uppercase tracking-widest">Título da Vaga *</label>
                                    <input required type="text" value={editingVaga.titulo || ''} onChange={e => setEditingVaga({ ...editingVaga, titulo: e.target.value })} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-sm font-bold text-zinc-900 focus:ring-2 focus:ring-yellow-500 outline-none" placeholder="Ex: Engenheiro de Software Sênior" />
                                </div>

                                <div className="col-span-2 space-y-2">
                                    <label className="text-xs font-black text-zinc-400 uppercase tracking-widest">Descrição Resumida *</label>
                                    <textarea required rows={3} value={editingVaga.descricao || ''} onChange={e => setEditingVaga({ ...editingVaga, descricao: e.target.value })} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-sm text-zinc-900 focus:ring-2 focus:ring-yellow-500 outline-none" placeholder="Resumo atrativo sobre a vaga e a equipa..." />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-zinc-400 uppercase tracking-widest">Localização *</label>
                                    <input required type="text" value={editingVaga.localizacao || ''} onChange={e => setEditingVaga({ ...editingVaga, localizacao: e.target.value })} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-sm text-zinc-900 focus:ring-2 focus:ring-yellow-500 outline-none" placeholder="Ex: Luanda, Talatona (Híbrido)" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-zinc-400 uppercase tracking-widest">Tipo de Contrato</label>
                                    <select value={editingVaga.tipo_contrato || ''} onChange={e => setEditingVaga({ ...editingVaga, tipo_contrato: e.target.value })} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-sm text-zinc-900 focus:ring-2 focus:ring-yellow-500 outline-none">
                                        <option value="Tempo Inteiro">Tempo Inteiro</option>
                                        <option value="Meio Tempo">Meio Tempo</option>
                                        <option value="Estágio">Estágio</option>
                                        <option value="Freelancer">Freelancer</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-zinc-400 uppercase tracking-widest">Experiência</label>
                                    <select value={editingVaga.nivel_experiencia || ''} onChange={e => setEditingVaga({ ...editingVaga, nivel_experiencia: e.target.value })} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-sm text-zinc-900 focus:ring-2 focus:ring-yellow-500 outline-none">
                                        <option value="Estagiário">Estagiário</option>
                                        <option value="Júnior">Júnior</option>
                                        <option value="Pleno">Pleno</option>
                                        <option value="Sênior">Sênior</option>
                                        <option value="Diretor">Diretor</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-zinc-400 uppercase tracking-widest">Pretensão Salarial (Opcional)</label>
                                    <input type="text" value={editingVaga.salario || ''} onChange={e => setEditingVaga({ ...editingVaga, salario: e.target.value })} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-sm text-zinc-900 focus:ring-2 focus:ring-yellow-500 outline-none" placeholder="Ex: Negociável, ou 1.000.000 Kz" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-zinc-400 uppercase tracking-widest">Nº de Vagas Abertas</label>
                                    <input type="number" min="1" value={editingVaga.quantidade || 1} onChange={e => setEditingVaga({ ...editingVaga, quantidade: parseInt(e.target.value) })} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-sm text-zinc-900 focus:ring-2 focus:ring-yellow-500 outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-zinc-400 uppercase tracking-widest">Data de Encerramento (Opcional)</label>
                                    <input type="date" value={editingVaga.data_encerramento ? new Date(editingVaga.data_encerramento).toISOString().split('T')[0] : ''} onChange={e => setEditingVaga({ ...editingVaga, data_encerramento: e.target.value })} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-sm text-zinc-900 focus:ring-2 focus:ring-yellow-500 outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-zinc-400 uppercase tracking-widest">Status da Vaga</label>
                                    <select value={editingVaga.status || ''} onChange={e => setEditingVaga({ ...editingVaga, status: e.target.value as any })} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-sm text-zinc-900 font-bold focus:ring-2 focus:ring-yellow-500 outline-none">
                                        <option value="ativa">Ativa (Visível no Site)</option>
                                        <option value="encerrada">Encerrada (Invisível)</option>
                                    </select>
                                </div>

                                <div className="col-span-2 space-y-2">
                                    <label className="text-xs font-black text-zinc-400 uppercase tracking-widest">Requisitos (Um por linha)</label>
                                    <textarea rows={4} value={editingVaga.requisitos || ''} onChange={e => setEditingVaga({ ...editingVaga, requisitos: e.target.value })} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-sm text-zinc-900 focus:ring-2 focus:ring-yellow-500 outline-none" placeholder="- Licenciatura em...&#10;- 3 Anos de Exp..." />
                                </div>
                            </div>
                            <div className="pt-6 flex justify-end gap-4 border-t border-zinc-100">
                                <button type="button" onClick={() => setShowVagaModal(false)} className="px-6 py-3 font-semibold text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors">Cancelar</button>
                                <button type="submit" className="px-8 py-3 bg-yellow-400 hover:bg-yellow-500 text-yellow-950 font-bold rounded-xl transition-all shadow-sm">Guardar Vaga</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL CANDIDATURAS */}
            {showCandidaturasModal && selectedVaga && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                        <div className="bg-zinc-900 text-white px-8 py-6 flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="text-2xl font-bold">Candidatos: {selectedVaga.titulo}</h3>
                                <p className="text-zinc-400">{candidaturas.length} Currículos Recebidos</p>
                            </div>
                            <button onClick={() => setShowCandidaturasModal(false)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                                <XCircle size={24} className="text-white" />
                            </button>
                        </div>
                        <div className="p-0 overflow-y-auto bg-zinc-50 flex-1">
                            {candidaturas.length === 0 ? (
                                <div className="p-12 text-center text-zinc-500 flex flex-col items-center">
                                    <Users size={48} className="text-zinc-300 mb-4" />
                                    <p>Ainda não há candidatos para esta vaga.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-zinc-200">
                                    {candidaturas.map(c => (
                                        <div key={c.id} className="p-6 bg-white hover:bg-zinc-50/50 transition-colors flex items-center justify-between gap-6">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h4 className="text-lg font-bold text-zinc-900">{c.nome}</h4>
                                                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase
                                                    ${c.status === 'pendente' ? 'bg-orange-100 text-orange-700' :
                                                            c.status === 'em_analise' ? 'bg-blue-100 text-blue-700' :
                                                                c.status === 'aprovado' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {c.status.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-zinc-500 flex gap-4">
                                                    <span>{c.email}</span>
                                                    {c.telefone && <span>• {c.telefone}</span>}
                                                    <span>• {new Date(c.data_envio).toLocaleDateString()}</span>
                                                </div>
                                                {c.mensagem && (
                                                    <p className="text-sm text-zinc-600 mt-3 p-3 bg-zinc-50 rounded-lg italic">"{c.mensagem}"</p>
                                                )}
                                            </div>

                                            <div className="flex flex-col items-end gap-3">
                                                {c.cv_path && (
                                                    <a href={c.cv_path} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-4 py-2 rounded-lg transition-colors">
                                                        <Download size={16} /> Ver Currículo (PDF)
                                                    </a>
                                                )}

                                                <div className="flex bg-zinc-100 p-1 rounded-lg">
                                                    <select
                                                        value={c.status}
                                                        onChange={(e) => handleUpdateCandidaturaStatus(c.id, e.target.value)}
                                                        className="bg-transparent border-none text-sm font-semibold text-zinc-700 outline-none cursor-pointer focus:ring-0"
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
