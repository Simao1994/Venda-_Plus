import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { api } from '../../lib/api';
import {
    File, FileText, Image as ImageIcon, FileSpreadsheet,
    Download, Trash2, Plus, Search, Filter,
    FolderOpen, Grid, List, X, CheckCircle2,
    AlertCircle, Loader2, MoreVertical, ExternalLink,
    Clock, Shield, Layout, HardDrive
} from 'lucide-react';

const CATEGORIES = ['Contratos', 'Faturas', 'RH', 'Farmácia', 'Outros'];

export default function FilesModule() {
    const { user } = useAuth();
    const [files, setFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [filterType, setFilterType] = useState<string>('all');
    const [stats, setStats] = useState({ total: 0, size: 0 });

    useEffect(() => {
        fetchFiles();
    }, [user?.company_id]);

    const fetchFiles = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/files');
            if (!response.ok) throw new Error('Erro ao carregar ficheiros');
            const data = await response.json();

            setFiles(data || []);

            // Calculate stats
            const totalSize = (data || []).reduce((acc: number, f: any) => acc + (f.size_bytes || 0), 0);
            setStats({ total: data?.length || 0, size: totalSize });
        } catch (err) {
            console.error('Erro ao procurar ficheiros:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const file = formData.get('file') as File;
        const category = formData.get('category') as string;

        if (!file || !category) return;

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
            const filePath = `${user?.company_id}/${category}/${fileName}`;

            // 1. Upload to Storage (Frontend handles this directly)
            const { error: uploadError } = await supabase.storage
                .from('company-files')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('company-files')
                .getPublicUrl(filePath);

            // 3. Save to DB via Backend API (to avoid RLS issues)
            const response = await api.post('/api/files', {
                name: file.name,
                file_path: filePath,
                file_url: publicUrl,
                file_type: file.type || fileExt || 'unknown',
                category,
                size_bytes: file.size
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erro ao guardar metadados');
            }

            setShowUploadModal(false);
            fetchFiles();
        } catch (err: any) {
            alert(`Erro no upload: ${err.message}`);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: number, filePath: string) => {
        if (!confirm('Tem a certeza que deseja eliminar este ficheiro permanentemente?')) return;

        try {
            // 1. Delete from Storage
            const { error: storageError } = await supabase.storage
                .from('company-files')
                .remove([filePath]);

            if (storageError) console.error('Aviso: Erro ao remover do storage:', storageError);

            // 2. Delete from DB via Backend API
            const response = await api.delete(`/api/files/${id}`);
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erro ao eliminar');
            }

            fetchFiles();
        } catch (err: any) {
            alert(`Erro ao eliminar: ${err.message}`);
        }
    };

    const getFileIcon = (type: string) => {
        if (type.includes('image')) return <ImageIcon className="text-pink-400" size={24} />;
        if (type.includes('pdf')) return <FileText className="text-red-400" size={24} />;
        if (type.includes('word') || type.includes('text')) return <FileText className="text-blue-400" size={24} />;
        if (type.includes('excel') || type.includes('spreadsheet') || type.includes('csv')) return <FileSpreadsheet className="text-emerald-400" size={24} />;
        return <File className="text-zinc-400" size={24} />;
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const filteredFiles = files.filter(f => {
        const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = filterCategory === 'all' || f.category === filterCategory;

        let matchesType = true;
        if (filterType !== 'all') {
            const type = f.file_type.toLowerCase();
            if (filterType === 'pdf') matchesType = type.includes('pdf');
            else if (filterType === 'image') matchesType = type.includes('image');
            else if (filterType === 'doc') matchesType = type.includes('word') || type.includes('text') || type.includes('doc');
            else if (filterType === 'sheet') matchesType = type.includes('excel') || type.includes('spreadsheet') || type.includes('csv') || type.includes('sheet');
        }

        return matchesSearch && matchesCategory && matchesType;
    });

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-full flex flex-col gap-8 relative z-10">
            {/* Header Section */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="animate-in fade-in slide-in-from-left duration-700">
                    <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic flex items-center gap-4">
                        Gestão de <span className="text-gold-gradient">Documentos</span>
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 shrink-0">
                            <FolderOpen className="text-gold-primary" size={24} />
                        </div>
                    </h1>
                    <p className="text-white/40 font-black text-[10px] uppercase tracking-[0.4em] mt-3 italic flex items-center gap-2">
                        <Shield size={12} className="text-gold-primary/40" /> Armazenamento Seguro & Proteção de Dados
                    </p>
                </div>

                <button
                    onClick={() => setShowUploadModal(true)}
                    className="bg-gradient-to-r from-gold-primary to-gold-secondary text-bg-deep px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] transition-all active:scale-95 shadow-2xl group"
                >
                    <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                    Carregar Ficheiro
                </button>
            </header>

            {/* Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in zoom-in duration-700 delay-100">
                <div className="glass-panel p-6 rounded-[32px] border border-white/5 flex items-center gap-6 group hover:border-gold-primary/20 transition-all">
                    <div className="w-14 h-14 bg-gold-primary/10 rounded-2xl flex items-center justify-center text-gold-primary shrink-0 group-hover:scale-110 transition-transform">
                        <Layout size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Total de Arquivos</p>
                        <p className="text-2xl font-black text-white tabular-nums">{stats.total}</p>
                    </div>
                </div>

                <div className="glass-panel p-6 rounded-[32px] border border-white/5 flex items-center gap-6 group hover:border-blue-500/20 transition-all">
                    <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 shrink-0 group-hover:scale-110 transition-transform">
                        <HardDrive size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Espaço Utilizado</p>
                        <p className="text-2xl font-black text-white tabular-nums">{formatSize(stats.size)}</p>
                    </div>
                </div>

                <div className="glass-panel p-6 rounded-[32px] border border-white/5 flex items-center gap-6 group hover:border-emerald-500/20 transition-all">
                    <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-110 transition-transform">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Última Atividade</p>
                        <p className="text-2xl font-black text-white text-sm uppercase">{files[0] ? new Date(files[0].created_at).toLocaleDateString() : 'Sem dados'}</p>
                    </div>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="glass-panel p-4 rounded-[32px] border border-white/5 flex flex-col lg:flex-row items-center gap-4 shadow-2xl animate-in fade-in duration-700 delay-200">
                <div className="flex-1 relative w-full group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gold-primary/40 group-focus-within:text-gold-primary transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Pesquisar por nome do documento..."
                        className="w-full pl-16 pr-6 py-4 bg-white/5 border border-white/5 rounded-2xl focus:bg-white/[0.08] focus:border-gold-primary/30 focus:ring-4 focus:ring-gold-primary/5 font-black text-[11px] text-white placeholder:text-white/20 outline-none transition-all uppercase tracking-[0.1em]"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-3 w-full lg:w-auto">
                    <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5">
                        <button
                            onClick={() => setViewType('grid')}
                            className={`p-2.5 rounded-xl transition-all ${viewType === 'grid' ? 'bg-gold-primary text-bg-deep shadow-lg' : 'text-white/30 hover:text-white'}`}
                        >
                            <Grid size={18} />
                        </button>
                        <button
                            onClick={() => setViewType('list')}
                            className={`p-2.5 rounded-xl transition-all ${viewType === 'list' ? 'bg-gold-primary text-bg-deep shadow-lg' : 'text-white/30 hover:text-white'}`}
                        >
                            <List size={18} />
                        </button>
                    </div>

                    <select
                        className="flex-1 lg:w-40 bg-white/5 border border-white/5 rounded-2xl px-6 py-4 font-black text-[10px] text-white/80 uppercase tracking-widest outline-none focus:border-gold-primary/30 transition-all cursor-pointer appearance-none"
                        value={filterCategory}
                        onChange={e => setFilterCategory(e.target.value)}
                    >
                        <option value="all" className="bg-bg-deep">Categorias</option>
                        {CATEGORIES.map(c => <option key={c} value={c} className="bg-bg-deep">{c}</option>)}
                    </select>

                    <select
                        className="flex-1 lg:w-40 bg-white/5 border border-white/5 rounded-2xl px-6 py-4 font-black text-[10px] text-white/80 uppercase tracking-widest outline-none focus:border-gold-primary/30 transition-all cursor-pointer appearance-none"
                        value={filterType}
                        onChange={e => setFilterType(e.target.value)}
                    >
                        <option value="all" className="bg-bg-deep">Tipos</option>
                        <option value="pdf" className="bg-bg-deep">PDF</option>
                        <option value="image" className="bg-bg-deep">Imagens</option>
                        <option value="doc" className="bg-bg-deep">Documentos</option>
                        <option value="sheet" className="bg-bg-deep">Planilhas</option>
                    </select>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 relative">
                {loading ? (
                    <div className="h-64 flex flex-col items-center justify-center gap-4">
                        <Loader2 className="animate-spin text-gold-primary" size={40} />
                        <p className="text-[10px] font-black text-gold-primary/40 uppercase tracking-[0.5em] animate-pulse italic">Sincronizando Arquivos...</p>
                    </div>
                ) : filteredFiles.length === 0 ? (
                    <div className="h-96 flex flex-col items-center justify-center text-center glass-panel rounded-[40px] border border-dashed border-white/10 animate-in fade-in duration-1000">
                        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 text-white/10">
                            <FolderOpen size={48} />
                        </div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">Nenhum Documento Localizado</h3>
                        <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mt-2">Os seus uploads aparecerão nesta secção organizada por categorias</p>
                    </div>
                ) : viewType === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                        {filteredFiles.map(file => (
                            <div key={file.id} className="glass-panel group relative overflow-hidden rounded-[32px] border border-white/5 hover:border-gold-primary/30 transition-all hover:scale-[1.02] hover:shadow-2xl">
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center shadow-inner group-hover:bg-gold-primary/10 transition-colors">
                                            {getFileIcon(file.file_type)}
                                        </div>
                                        <div className="flex gap-2">
                                            <a
                                                href={file.file_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="p-2 text-white/20 hover:text-gold-primary transition-colors bg-white/5 rounded-xl hover:bg-gold-primary/10"
                                                title="Visualizar"
                                            >
                                                <ExternalLink size={16} />
                                            </a>
                                            <a
                                                href={file.file_url}
                                                download={file.name}
                                                className="p-2 text-white/20 hover:text-emerald-400 transition-colors bg-white/5 rounded-xl hover:bg-emerald-500/10"
                                                title="Download"
                                            >
                                                <Download size={16} />
                                            </a>
                                        </div>
                                    </div>

                                    <h4 className="font-black text-white text-sm uppercase tracking-tight mb-2 truncate group-hover:text-gold-primary transition-colors" title={file.name}>
                                        {file.name}
                                    </h4>

                                    <div className="flex flex-wrap gap-2 mb-4">
                                        <span className="text-[8px] font-black uppercase tracking-widest px-2 py-1 bg-white/5 text-white/40 rounded-lg border border-white/5">
                                            {file.category}
                                        </span>
                                        <span className="text-[8px] font-black uppercase tracking-widest px-2 py-1 bg-pink-500/10 text-pink-400/60 rounded-lg border border-pink-500/10">
                                            {formatSize(file.size_bytes)}
                                        </span>
                                    </div>

                                    <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[9px] font-black text-white/20 uppercase tracking-widest">
                                        <span className="flex items-center gap-1.5"><Clock size={10} /> {new Date(file.created_at).toLocaleDateString()}</span>
                                        <button
                                            onClick={() => handleDelete(file.id, file.file_path)}
                                            className="text-white/10 hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="glass-panel rounded-[40px] border border-white/5 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-white/[0.03] text-[9px] font-black text-white/30 uppercase tracking-[0.2em] border-b border-white/5">
                                    <th className="px-8 py-6">Nome do Arquivo</th>
                                    <th className="px-8 py-6">Categoria</th>
                                    <th className="px-8 py-6">Tamanho</th>
                                    <th className="px-8 py-6">Data</th>
                                    <th className="px-8 py-6 text-right">Acções</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredFiles.map(file => (
                                    <tr key={file.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center shrink-0">
                                                    {getFileIcon(file.file_type)}
                                                </div>
                                                <span className="font-black text-white text-xs uppercase tracking-tight truncate max-w-xs">{file.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-white/5 text-white/40 rounded-full border border-white/5">
                                                {file.category}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 font-black text-white/50 text-[10px] tabular-nums">{formatSize(file.size_bytes)}</td>
                                        <td className="px-8 py-6 font-black text-white/30 text-[10px] tabular-nums">{new Date(file.created_at).toLocaleDateString()}</td>
                                        <td className="px-8 py-6">
                                            <div className="flex justify-end gap-3">
                                                <a
                                                    href={file.file_url}
                                                    className="w-10 h-10 flex items-center justify-center bg-white/5 text-white/30 hover:text-gold-primary hover:bg-gold-primary/10 rounded-xl transition-all"
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    <Download size={16} />
                                                </a>
                                                <button
                                                    onClick={() => handleDelete(file.id, file.file_path)}
                                                    className="w-10 h-10 flex items-center justify-center bg-white/5 text-white/10 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-bg-deep/80 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
                    <div className="glass-panel rounded-[40px] w-full max-w-lg overflow-hidden shadow-2xl border border-white/10 relative animate-in zoom-in duration-300">
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-gold-primary/40 to-transparent" />

                        <div className="p-10 border-b border-white/5 bg-gold-primary/[0.02] flex justify-between items-start">
                            <div>
                                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                                    Novo <span className="text-gold-gradient">Upload</span>
                                </h3>
                                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mt-2 italic">Armazenamento Centralizado</p>
                            </div>
                            <button
                                onClick={() => setShowUploadModal(false)}
                                className="w-10 h-10 text-white/20 hover:text-white transition-colors border border-white/5 rounded-xl flex items-center justify-center hover:bg-white/5"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleUpload} className="p-10 space-y-6">
                            <div className="glass-panel p-6 rounded-3xl border-2 border-dashed border-white/10 hover:border-gold-primary/30 transition-all text-center group cursor-pointer relative">
                                <input
                                    type="file"
                                    name="file"
                                    required
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const label = document.getElementById('file-label');
                                            if (label) label.innerText = file.name;
                                        }
                                    }}
                                />
                                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white/10 group-hover:text-gold-primary transition-colors">
                                    <Plus size={32} />
                                </div>
                                <p id="file-label" className="text-xs font-black text-white/40 uppercase tracking-widest leading-relaxed">
                                    Clique ou arraste um arquivo para selecionar<br />
                                    <span className="text-[9px] text-white/10 mt-2 block">(PDF, DOCX, XLSX, JPG, PNG)</span>
                                </p>
                            </div>

                            <div className="glass-panel p-4 rounded-2xl border border-white/5 focus-within:border-gold-primary/30 transition-all">
                                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-2">Categoria Empresarial *</label>
                                <select
                                    name="category"
                                    required
                                    className="w-full bg-transparent border-none outline-none font-black text-white/80 text-[11px] uppercase tracking-widest appearance-none cursor-pointer"
                                >
                                    <option value="" className="bg-bg-deep">Selecione uma categoria...</option>
                                    {CATEGORIES.map(c => <option key={c} value={c} className="bg-bg-deep">{c}</option>)}
                                </select>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowUploadModal(false)}
                                    className="flex-1 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white/30 border border-white/5 hover:bg-white/5 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className="flex-1 py-5 bg-gradient-to-r from-gold-primary to-gold-secondary text-bg-deep rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] transition-all active:scale-95 shadow-2xl disabled:opacity-50"
                                >
                                    {uploading ? (
                                        <div className="flex items-center justify-center gap-3">
                                            <Loader2 size={16} className="animate-spin" />
                                            PROCESSANDO...
                                        </div>
                                    ) : 'Iniciar Upload'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
