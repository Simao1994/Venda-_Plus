import React, { useState, useEffect, useMemo } from 'react';
import {
    Search, Book, GraduationCap, Printer, Download, Edit3,
    Save, X, ChevronRight, HelpCircle, Info, Shield,
    CheckCircle2, AlertCircle, FileText
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { DOCUMENTATION_DATA, DocumentationItem } from './documentationData';

interface SystemDocumentationProps {
    isAdmin: boolean;
}

export default function SystemDocumentation({ isAdmin }: SystemDocumentationProps) {
    const [docs, setDocs] = useState<DocumentationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeId, setActiveId] = useState('intro');
    const [searchQuery, setSearchQuery] = useState('');
    const [trainingMode, setTrainingMode] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editedContent, setEditedContent] = useState<DocumentationItem | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchDocs();
    }, []);

    const fetchDocs = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('system_documentation')
                .select('*')
                .order('category', { ascending: true });

            if (error) throw error;

            if (!data || data.length === 0) {
                console.log('🌱 Seeding documentation from local data...');
                await seedDatabase();
            } else {
                // Transform snake_case from DB to camelCase for component
                const formattedDocs = data.map((d: any) => ({
                    id: d.id,
                    title: d.title,
                    category: d.category,
                    content: d.content,
                    trainingSteps: d.training_steps || [],
                    keywords: d.keywords || []
                }));
                setDocs(formattedDocs);
            }
        } catch (err) {
            console.error('Error fetching docs:', err);
            // Fallback to local data if DB fails or isn't ready
            setDocs(DOCUMENTATION_DATA);
        } finally {
            setLoading(false);
        }
    };

    const seedDatabase = async () => {
        try {
            const seedData = DOCUMENTATION_DATA.map(d => ({
                id: d.id,
                title: d.title,
                category: d.category,
                content: d.content,
                training_steps: d.trainingSteps || [],
                keywords: d.keywords || []
            }));

            const { error } = await supabase
                .from('system_documentation')
                .insert(seedData);

            if (error) {
                console.error('Seed error:', error);
                setDocs(DOCUMENTATION_DATA);
            } else {
                setDocs(DOCUMENTATION_DATA);
            }
        } catch (err) {
            console.error('Seed catch error:', err);
            setDocs(DOCUMENTATION_DATA);
        }
    };

    const activeDoc = useMemo(() =>
        docs.find(d => d.id === activeId) || docs[0],
        [docs, activeId]);

    const filteredDocs = useMemo(() => {
        if (!searchQuery) return docs;
        const lowerQuery = searchQuery.toLowerCase();
        return docs.filter(d =>
            d.title.toLowerCase().includes(lowerQuery) ||
            d.category.toLowerCase().includes(lowerQuery) ||
            d.keywords.some(k => k.toLowerCase().includes(lowerQuery))
        );
    }, [docs, searchQuery]);

    const categories = useMemo(() => {
        const cats = Array.from(new Set(docs.map(d => d.category)));
        return cats;
    }, [docs]);

    const handleEdit = () => {
        if (!activeDoc) return;
        setEditedContent({ ...activeDoc });
        setEditMode(true);
    };

    const handleSave = async () => {
        if (!editedContent) return;
        setSaving(true);
        try {
            const { error } = await supabase
                .from('system_documentation')
                .update({
                    title: editedContent.title,
                    content: editedContent.content,
                    training_steps: editedContent.trainingSteps,
                    keywords: editedContent.keywords
                })
                .eq('id', editedContent.id);

            if (error) throw error;

            setDocs(prev => prev.map(d => d.id === editedContent.id ? editedContent : d));
            setEditMode(false);
            alert('Documentação atualizada com sucesso!');
        } catch (err) {
            console.error('Error saving doc:', err);
            alert('Erro ao salvar documentação.');
        } finally {
            setSaving(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading && docs.length === 0) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="w-12 h-12 border-4 border-gold-primary border-t-transparent rounded-full animate-spin" />
                <span className="ml-4 font-black uppercase tracking-widest text-gold-primary/60">Carregando Manuais...</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-180px)] bg-bg-deep rounded-[32px] overflow-hidden border border-white/5 shadow-2xl print:h-auto print:bg-white print:border-none print:shadow-none">

            {/* Sidebar */}
            <aside className="w-full md:w-80 bg-white/[0.02] border-r border-white/5 flex flex-col shrink-0 print:hidden">
                <div className="p-6 border-b border-white/5">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-primary/40 group-focus-within:text-gold-primary transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Pesquisar manuais..."
                            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold text-white focus:ring-2 focus:ring-gold-primary/20 outline-none transition-all"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-6">
                    {categories.map(cat => {
                        const catDocs = filteredDocs.filter(d => d.category === cat);
                        if (catDocs.length === 0) return null;

                        return (
                            <div key={cat} className="space-y-2">
                                <h3 className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-gold-primary/40 mb-3">{cat}</h3>
                                <div className="space-y-1">
                                    {catDocs.map(doc => (
                                        <button
                                            key={doc.id}
                                            onClick={() => {
                                                setActiveId(doc.id);
                                                setEditMode(false);
                                                setTrainingMode(false);
                                            }}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${activeId === doc.id ? 'bg-gold-primary/10 text-gold-primary border border-gold-primary/20' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
                                        >
                                            <ChevronRight size={14} className={`transition-transform ${activeId === doc.id ? 'rotate-90' : 'opacity-0 group-hover:opacity-100'}`} />
                                            <span className="text-[11px] font-bold text-left line-clamp-1">{doc.title}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </nav>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto bg-gradient-to-br from-transparent to-gold-primary/[0.02] custom-scrollbar relative print:overflow-visible">

                {/* Header Actions */}
                <div className="sticky top-0 z-10 p-6 bg-bg-deep/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between print:hidden">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gold-primary/10 flex items-center justify-center text-gold-primary">
                            <Book size={18} />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-white/40">Central de Documentação</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setTrainingMode(!trainingMode)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${trainingMode ? 'bg-gold-primary text-bg-deep' : 'bg-white/5 text-gold-primary/60 hover:text-gold-primary hover:bg-white/10'}`}
                        >
                            <GraduationCap size={16} />
                            {trainingMode ? 'Modo Texto' : 'Modo Formação'}
                        </button>

                        {isAdmin && !editMode && (
                            <button
                                onClick={handleEdit}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                                <Edit3 size={16} />
                                Editar
                            </button>
                        )}

                        <button
                            onClick={handlePrint}
                            className="p-2.5 bg-white/5 text-white/40 hover:text-gold-primary hover:bg-white/10 rounded-xl transition-all"
                            title="Exportar PDF / Imprimir"
                        >
                            <Printer size={18} />
                        </button>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto p-8 md:p-12">
                    {editMode ? (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Título do Artigo</label>
                                <input
                                    type="text"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-2xl font-black text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
                                    value={editedContent?.title || ''}
                                    onChange={e => setEditedContent(prev => prev ? { ...prev, title: e.target.value } : null)}
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Conteúdo (HTML)</label>
                                <textarea
                                    className="w-full h-[400px] bg-white/5 border border-white/10 rounded-2xl px-6 py-6 text-sm font-medium text-white/80 focus:ring-2 focus:ring-indigo-500/50 outline-none font-mono"
                                    value={editedContent?.content || ''}
                                    onChange={e => setEditedContent(prev => prev ? { ...prev, content: e.target.value } : null)}
                                />
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-900/20"
                                >
                                    {saving ? 'Salvando...' : <><Save size={18} /> Salvar Alterações</>}
                                </button>
                                <button
                                    onClick={() => setEditMode(false)}
                                    className="px-8 py-4 bg-white/5 text-white/40 hover:text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    ) : trainingMode ? (
                        <div className="space-y-12 animate-in fade-in zoom-in-95 duration-500">
                            <div className="text-center">
                                <span className="inline-block px-4 py-1.5 bg-gold-primary/10 text-gold-primary rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-4">Guia Prático Passo-a-Passo</span>
                                <h1 className="text-4xl font-black text-white tracking-tighter italic font-display">{activeDoc?.title}</h1>
                            </div>

                            <div className="space-y-6">
                                {activeDoc?.trainingSteps?.map((step, idx) => (
                                    <div key={idx} className="flex gap-6 group">
                                        <div className="flex flex-col items-center shrink-0">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold-primary to-gold-secondary text-bg-deep flex items-center justify-center font-black text-xl shadow-lg shadow-gold-primary/20 group-hover:scale-110 transition-transform">
                                                {idx + 1}
                                            </div>
                                            {idx < (activeDoc.trainingSteps?.length || 0) - 1 && (
                                                <div className="w-0.5 flex-1 bg-gradient-to-b from-gold-primary/40 to-transparent my-2" />
                                            )}
                                        </div>
                                        <div className="pt-2">
                                            <p className="text-lg font-bold text-white/90 group-hover:text-gold-primary transition-colors leading-relaxed">
                                                {step}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-gold-primary/[0.03] border border-gold-primary/10 p-8 rounded-[40px] text-center">
                                <CheckCircle2 size={40} className="text-gold-primary mx-auto mb-4" />
                                <h3 className="text-xl font-black text-white mb-2 italic tracking-tight">Módulo Concluído!</h3>
                                <p className="text-gold-primary/40 font-bold text-sm">Agora você está pronto para operar estas funcionalidades com segurança.</p>
                            </div>
                        </div>
                    ) : (
                        <article className="prose prose-invert prose-gold max-w-none animate-in fade-in duration-700">
                            <div className="mb-12">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gold-primary/40 mb-4">
                                    <span>{activeDoc?.category}</span>
                                    <ChevronRight size={10} />
                                    <span className="text-gold-primary/60">{activeDoc?.title}</span>
                                </div>
                                <h1 className="text-5xl font-black text-white tracking-tighter italic font-display leading-[0.9] mb-6">
                                    {activeDoc?.title}
                                </h1>
                                <div className="w-20 h-1.5 bg-gold-primary rounded-full" />
                            </div>

                            <div
                                className="doc-content text-white/70 leading-relaxed space-y-6 text-sm md:text-base font-medium"
                                dangerouslySetInnerHTML={{ __html: activeDoc?.content || '' }}
                            />

                            {activeDoc?.trainingSteps && activeDoc.trainingSteps.length > 0 && (
                                <div className="mt-16 pt-12 border-t border-white/5">
                                    <h3 className="flex items-center gap-3 text-xl font-black text-white mb-8 italic">
                                        <GraduationCap className="text-gold-primary" size={24} />
                                        Resumo de Formação
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {activeDoc.trainingSteps.map((step, i) => (
                                            <div key={i} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex gap-3 items-start hover:border-gold-primary/30 transition-all">
                                                <CheckCircle2 size={16} className="text-gold-primary shrink-0 mt-0.5" />
                                                <span className="text-[11px] font-bold text-white/60">{step}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => setTrainingMode(true)}
                                        className="mt-8 w-full py-4 bg-gold-primary/10 text-gold-primary rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-gold-primary hover:text-bg-deep transition-all"
                                    >
                                        Iniciar Formação Prática
                                    </button>
                                </div>
                            )}
                        </article>
                    )}
                </div>
            </main>

            {/* Styles for the dangerouslySetInnerHTML content */}
            <style dangerouslySetInnerHTML={{
                __html: `
        .doc-content h2 { 
          font-size: 1.5rem; 
          font-weight: 900; 
          color: white; 
          margin-top: 2rem; 
          margin-bottom: 1rem;
          font-style: italic;
          letter-spacing: -0.02em;
        }
        .doc-content h3 { 
          font-size: 1.2rem; 
          font-weight: 900; 
          color: #D4AF37; 
          margin-top: 1.5rem; 
          margin-bottom: 0.75rem;
        }
        .doc-content p { margin-bottom: 1rem; }
        .doc-content ul { 
          list-style: none; 
          padding-left: 0; 
          margin-bottom: 1.5rem;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 0.75rem;
        }
        .doc-content ul li { 
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.05);
          padding: 1rem;
          border-radius: 1rem;
          font-size: 0.8rem;
          font-weight: 700;
          color: rgba(255,255,255,0.6);
          position: relative;
        }
        .doc-content ul li strong { color: #D4AF37; display: block; margin-bottom: 0.25rem; }
        .doc-content strong { font-weight: 900; color: white; }
        
        @media print {
          .custom-scrollbar { overflow: visible !important; }
          .bg-bg-deep { background: white !important; color: black !important; }
          .text-white { color: black !important; }
          .text-gold-primary { color: #D4AF37 !important; }
          .text-white\/70 { color: #333 !important; }
          .text-white\/40 { color: #666 !important; }
          .border-white\/5 { border-color: #eee !important; }
        }
      `}} />
        </div>
    );
}
