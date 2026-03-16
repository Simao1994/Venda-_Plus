import React, { useState, useEffect, useMemo } from 'react';
import { Newspaper, Plus, Search, Edit, Trash2, Calendar, User as UserIcon, Tag, Eye, X, Send, Image as ImageIcon, RefreshCw, Play, Lock, FileDown } from 'lucide-react';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';
import { BlogPost, User } from '../types';
import { supabase } from '../lib/supabase';
import { uploadBlogMedia, uploadMultipleBlogMedia } from '../lib/supabaseUtils';
import { Upload, FileVideo } from 'lucide-react';

interface BlogPageProps {
  user?: User;
}

const BlogPage: React.FC<BlogPageProps> = ({ user: appUser }) => {
  const [activeSubTab, setActiveSubTab] = useState<'posts' | 'inbox'>('posts');
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);

  // File upload state
  const [headerFile, setHeaderFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<FileList | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const headerInputRef = React.useRef<HTMLInputElement>(null);
  const videoInputRef = React.useRef<HTMLInputElement>(null);
  const galleryInputRef = React.useRef<HTMLInputElement>(null);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('blog_posts')
        .select('*');

      if (appUser && appUser.role !== 'master') {
        query = query.eq('company_id', appUser.company_id);
      }

      const { data, error } = await query.order('data_publicacao', { ascending: false });

      if (error) throw error;

      // Map to frontend type
      const mapped = (data || []).map(p => ({
        id: p.id,
        titulo: p.titulo,
        categoria: p.categoria,
        conteudo: p.conteudo,
        autor: p.autor || p.autor_name, // Suporte a ambas as colunas se existirem
        data: p.data || p.data_publicacao, // Suporte a ambas as colunas
        imagem_url: p.imagem_url,
        video_url: p.video_url,
        galeria_urls: p.galeria_urls,
        tipo: p.tipo || 'artigo',
        is_publico: p.is_publico !== false,
        visualizacoes: p.visualizacoes || 0
      }));

      setPosts(mapped as any);
    } catch (err) {
      console.error('Erro ao carregar blog:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInquiries = async () => {
    try {
      let query = supabase
        .from('public_inquiries')
        .select('*');

      if (appUser && appUser.role !== 'master') {
        query = query.eq('company_id', appUser.company_id);
      }

      const { data, error } = await query.order('data_envio', { ascending: false });

      if (error) throw error;
      setInquiries(data || []);
    } catch (err) {
      console.error('Erro ao carregar mensagens:', err);
    }
  };

  useEffect(() => {
    fetchPosts();
    fetchInquiries();
  }, []);

  useEffect(() => {
    if (activeSubTab === 'inbox') {
      fetchInquiries();
    }
  }, [activeSubTab]);

  const filtered = useMemo(() =>
    posts.filter(p => p.titulo.toLowerCase().includes(searchTerm.toLowerCase())),
    [searchTerm, posts]
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const isEditing = !!editingItem;

    try {
      // Robust session check: try to fetch current user definitive session
      let { data: { session } } = await supabase.auth.getSession();

      // If no session, try to refresh it
      if (!session) {
        const { data: refreshData } = await supabase.auth.refreshSession();
        session = refreshData.session;
      }

      // Final check: if still no session and no appUser, block
      if (!session && !appUser) {
        alert("Sua sessão expirou. Por favor, faça login novamente para publicar.");
        return;
      }

      let finalImageUrl = formData.get('imagem_url') as string;
      let finalVideoUrl = formData.get('video_url') as string;

      // Upload Header Image if selected
      if (headerFile) {
        finalImageUrl = await uploadBlogMedia(headerFile);
      }

      // Upload Video if selected
      if (videoFile) {
        finalVideoUrl = await uploadBlogMedia(videoFile);
      }

      const galeriaString = formData.get('galeria_urls') as string;
      let galeriaArray = galeriaString ? galeriaString.split(',').map(s => s.trim()).filter(Boolean) : [];

      // Upload Gallery Files if selected
      if (galleryFiles && galleryFiles.length > 0) {
        const uploadedUrls = await uploadMultipleBlogMedia(galleryFiles);
        galeriaArray = [...galeriaArray, ...uploadedUrls];
      }

      const tipo = formData.get('tipo') as any || 'artigo';

      const dataPayload = {
        titulo: formData.get('titulo') as string,
        categoria: formData.get('categoria') as any || 'Institucional',
        conteudo: formData.get('conteudo') as string,
        autor: formData.get('autor') as string, // Usar 'autor' conforme recovery.sql
        data: editingItem?.data || new Date().toISOString().split('T')[0], // Usar 'data' conforme recovery.sql
        imagem_url: finalImageUrl,
        video_url: finalVideoUrl || null,
        galeria_urls: galeriaArray,
        tipo: tipo,
        is_publico: formData.get('is_publico') === 'on',
        company_id: appUser?.company_id,
        updated_at: new Date().toISOString()
      };

      if (isEditing) {
        const { error } = await supabase
          .from('blog_posts')
          .update(dataPayload)
          .eq('id', editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('blog_posts')
          .insert([dataPayload]);
        if (error) throw error;
      }

      await fetchPosts();
      setShowModal(false);
      setEditingItem(null);
      setHeaderFile(null);
      setVideoFile(null);
      setGalleryFiles(null);
    } catch (err: any) {
      console.error('Erro ao guardar artigo:', err);
      const isStorageError = err.message?.toLowerCase().includes('storage') || err.statusCode === '404' || err.error === 'Not Found';
      alert(`Não foi possível publicar o artigo: ${err.message || 'Erro desconhecido'}. ${isStorageError ? 'Verifique se o bucket "blog-media" existe e é público no Supabase.' : ''}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, titulo: string) => {
    if (confirm(`Remover permanentemente o artigo "${titulo}"?`)) {
      try {
        const { error } = await supabase
          .from('blog_posts')
          .delete()
          .eq('id', id);
        if (error) throw error;
        await fetchPosts();
      } catch (err) {
        console.error('Erro ao eliminar artigo:', err);
      }
    }
  };


  // O carregamento agora é não-bloqueante

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-sky-200">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Newspaper className="text-yellow-500" size={14} />
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em]">Comunicação Corporativa</span>
          </div>
          <h1 className="text-4xl font-black text-zinc-900 tracking-tight uppercase">Blog & Notícias</h1>
          <p className="text-zinc-500 font-medium mt-1">Gestão de artigos oficiais e comunicados do grupo Amazing.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveSubTab('posts')}
            className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeSubTab === 'posts' ? 'bg-yellow-500 text-zinc-900 shadow-lg shadow-yellow-200' : 'text-zinc-400 hover:bg-zinc-100'}`}
          >
            Artigos Publicados
          </button>
          <button
            onClick={() => setActiveSubTab('inbox')}
            className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeSubTab === 'inbox' ? 'bg-yellow-500 text-zinc-900 shadow-lg shadow-yellow-200' : 'text-zinc-400 hover:bg-zinc-100'} flex items-center gap-2`}
          >
            Mensagens Recebidas
            {inquiries.filter(i => i.status === 'pendente').length > 0 && (
              <span className="w-5 h-5 bg-zinc-900 text-white rounded-full flex items-center justify-center text-[10px]">
                {inquiries.filter(i => i.status === 'pendente').length}
              </span>
            )}
          </button>
          <button
            onClick={() => { setEditingItem(null); setShowModal(true); }}
            className="ml-4 px-8 py-4 bg-zinc-900 text-white rounded-2xl flex items-center gap-3 font-black shadow-xl hover:bg-zinc-800 transition-all active:scale-95"
          >
            <Plus size={20} /> ESCREVER ARTIGO
          </button>
        </div>
      </div>

      {activeSubTab === 'posts' && (
        <>
          <div className="bg-white p-2 rounded-[2rem] shadow-sm border border-sky-100">
            <Input
              placeholder="Pesquisar por título ou palavra-chave..."
              icon={<Search size={20} className="text-zinc-400" />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none py-4 text-lg font-semibold"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {loading ? (
              <div className="col-span-full py-32 text-center space-y-4">
                <RefreshCw className="mx-auto w-12 h-12 text-yellow-500 animate-spin" />
                <p className="text-zinc-400 font-black uppercase tracking-[0.3em] text-xs animate-pulse">A carregar artigos...</p>
              </div>
            ) : filtered.length > 0 ? (
              filtered.map(post => (
                <div key={post.id} className="bg-white rounded-[3rem] overflow-hidden border border-sky-100 shadow-sm hover:shadow-2xl transition-all group flex flex-col md:flex-row">
                  <div className="md:w-1/3 aspect-video md:aspect-auto overflow-hidden relative bg-zinc-900">
                    {post.video_url ? (() => {
                      const url = post.video_url;
                      const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
                      const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);

                      if (ytMatch) {
                        return <iframe src={`https://www.youtube.com/embed/${ytMatch[1]}?rel=0`} className="w-full h-full min-h-[180px]" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={post.titulo} />;
                      } else if (vimeoMatch) {
                        return <iframe src={`https://player.vimeo.com/video/${vimeoMatch[1]}`} className="w-full h-full min-h-[180px]" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen title={post.titulo} />;
                      } else {
                        return <video src={url} controls className="w-full h-full object-cover" preload="metadata" poster={post.imagem_url || undefined} />;
                      }
                    })() : (
                      <>
                        <img
                          src={post.imagem_url || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800'}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 cursor-zoom-in"
                          alt={post.titulo}
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingImage(post.imagem_url || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800');
                          }}
                        />
                        <div className="absolute top-4 left-4 flex gap-2">
                          <span className="px-3 py-1 bg-yellow-500 text-zinc-900 text-[9px] font-black uppercase tracking-widest rounded-lg shadow-lg">{post.categoria}</span>
                          {!post.is_publico && <span className="px-3 py-1 bg-zinc-900 text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-lg flex items-center gap-1"><Lock size={10} /> Interno</span>}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="md:w-2/3 p-8 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-black text-zinc-900 leading-tight group-hover:text-yellow-600 transition-colors uppercase tracking-tight">{post.titulo}</h3>
                        <div className="flex gap-2">
                          <button onClick={() => { setEditingItem(post); setShowModal(true); }} className="p-2 text-zinc-300 hover:text-yellow-600 transition-colors"><Edit size={16} /></button>
                          <button onClick={() => handleDelete(post.id, post.titulo)} className="p-2 text-zinc-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                        </div>
                      </div>
                      <p className="text-zinc-500 text-sm line-clamp-2 font-medium mb-6">{post.conteudo}</p>
                    </div>
                    <div className="pt-4 border-t border-zinc-50 flex items-center justify-between text-zinc-400">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest"><UserIcon size={12} className="text-yellow-500" /> {post.autor}</div>
                        <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest"><Calendar size={12} className="text-yellow-500" /> {new Date(post.data).toLocaleDateString()}</div>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest"><Eye size={12} className="text-yellow-500" /> {post.visualizacoes}</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-sky-100">
                <Newspaper size={64} className="mx-auto text-sky-100 mb-4" />
                <p className="text-zinc-400 font-bold italic text-lg">Nenhum artigo encontrado no blog.</p>
              </div>
            )}
          </div>
        </>
      )}

      {activeSubTab === 'inbox' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-black text-zinc-900 uppercase">Gestão de Mensagens</h2>
            <button
              onClick={() => fetchInquiries()}
              disabled={loading}
              className="p-3 bg-zinc-100 rounded-2xl hover:bg-yellow-500 hover:text-zinc-900 transition-all active:scale-95"
              title="Actualizar Mensagens"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
          {inquiries.length > 0 ? (
            inquiries.map(inquiry => (
              <div key={inquiry.id} className="bg-white rounded-[2.5rem] p-8 border border-sky-100 shadow-sm hover:shadow-xl transition-all">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center text-zinc-400 font-black">
                      {inquiry.nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-black text-zinc-900 text-lg leading-tight">{inquiry.nome}</h4>
                      <div className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1">
                        <Send size={12} className="text-yellow-500" /> {inquiry.email}
                      </div>
                    </div>
                  </div>
                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${inquiry.status === 'pendente' ? 'bg-yellow-50 text-yellow-600' :
                    inquiry.status === 'respondida' ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-50 text-zinc-400'
                    }`}>
                    {inquiry.status}
                  </span>
                </div>

                <div className="p-6 bg-zinc-50 rounded-[2rem] border border-zinc-100 mb-6">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 italic">Assunto: {inquiry.assunto}</p>
                  <p className="text-zinc-700 font-medium leading-relaxed">{inquiry.mensagem}</p>
                </div>

                {inquiry.resposta && (
                  <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 mb-6 relative">
                    <div className="absolute -top-3 left-6 px-3 py-1 bg-emerald-600 text-white text-[8px] font-black uppercase tracking-widest rounded-full">Resposta</div>
                    <p className="text-emerald-800 font-bold leading-relaxed">{inquiry.resposta}</p>
                    <div className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mt-2">
                      Respondido em: {new Date(inquiry.data_resposta).toLocaleString()}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-zinc-50 pt-6">
                  <div className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">
                    Recebido em: {new Date(inquiry.data_envio).toLocaleString()}
                  </div>
                  <div className="flex gap-2">
                    {inquiry.status === 'pendente' && (
                      <button
                        onClick={async () => {
                          const resp = prompt(`Responder a ${inquiry.nome}:`);
                          if (resp) {
                            setSaving(true);
                            try {
                              const { error } = await supabase
                                .from('public_inquiries')
                                .update({
                                  resposta: resp,
                                  status: 'respondida',
                                  data_resposta: new Date().toISOString()
                                })
                                .eq('id', inquiry.id);
                              if (error) throw error;
                              fetchInquiries();
                            } catch (err) {
                              console.error('Erro ao responder:', err);
                            } finally {
                              setSaving(false);
                            }
                          }
                        }}
                        className="px-6 py-2.5 bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-yellow-500 hover:text-zinc-900 transition-all"
                      >
                        Responder
                      </button>
                    )}
                    <button
                      onClick={async () => {
                        if (confirm('Eliminar esta mensagem?')) {
                          const { error } = await supabase.from('public_inquiries').delete().eq('id', inquiry.id);
                          if (!error) fetchInquiries();
                        }
                      }}
                      className="p-2.5 text-zinc-300 hover:text-red-500 transition-all rounded-xl"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-sky-100">
              <Send size={48} className="mx-auto text-sky-100 mb-4" />
              <p className="text-zinc-400 font-bold">Nenhuma mensagem recebida.</p>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-8 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
              <h2 className="text-2xl font-black text-zinc-900 flex items-center gap-3">
                <Send className="text-yellow-500" />
                {editingItem ? 'Editar Conteúdo' : 'Redigir Novo Artigo'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingItem(null);
                  setHeaderFile(null);
                  setVideoFile(null);
                }}
                className="p-3 hover:bg-zinc-200 rounded-full transition-all"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-6 overflow-y-auto max-h-[75vh]">
              <div className="grid grid-cols-2 gap-6">
                <Select name="tipo" label="Tipo de Conteúdo" defaultValue={editingItem?.tipo || 'artigo'} options={[
                  { value: 'artigo', label: 'Artigo / Notícia' },
                  { value: 'video', label: 'Vídeo / Reportagem' },
                  { value: 'galeria', label: 'Galeria de Fotos' },
                  { value: 'momento', label: 'Momento Social' }
                ]} />
                <Select name="categoria" label="Categoria" defaultValue={editingItem?.categoria || 'Institucional'} options={[
                  { value: 'Logística', label: 'Logística & Transportes' },
                  { value: 'Agronegócio', label: 'Agronegócio' },
                  { value: 'Imobiliário', label: 'Imobiliário' },
                  { value: 'Institucional', label: 'Institucional / RH' },
                  { value: 'Social', label: 'Responsabilidade Social' }
                ]} />
              </div>

              <Input name="titulo" label="Título do Artigo" defaultValue={editingItem?.titulo} required placeholder="Ex: A Nova Era da Logística em Angola" />

              <div className="grid grid-cols-2 gap-6">
                <Input name="autor" label="Autor / Fonte" defaultValue={editingItem?.autor || 'Comunicação Amazing'} required />
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest">Data de Publicação</label>
                  <input
                    type="date"
                    name="data"
                    defaultValue={editingItem?.data ? editingItem.data.split('T')[0] : new Date().toISOString().split('T')[0]}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 text-sm font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
              </div>

              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-3 cursor-pointer p-4 bg-zinc-50 rounded-2xl border border-zinc-100 hover:bg-zinc-100 transition-all">
                  <input type="checkbox" name="is_publico" defaultChecked={editingItem ? editingItem.is_publico : true} className="w-5 h-5 accent-yellow-500" />
                  <span className="text-[10px] font-black text-zinc-900 uppercase tracking-widest">Publicar no Site Principal</span>
                </label>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-black text-zinc-700 uppercase tracking-widest">Imagem de Capa</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    onClick={() => headerInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${headerFile ? 'bg-yellow-50 border-yellow-500 text-yellow-700' : 'bg-zinc-50 border-zinc-200 text-zinc-400 hover:border-yellow-500 hover:bg-yellow-50'}`}
                  >
                    <input type="file" ref={headerInputRef} onChange={(e) => setHeaderFile(e.target.files?.[0] || null)} className="hidden" accept="image/*" />
                    <Upload size={20} />
                    <span className="text-[10px] font-bold uppercase">{headerFile ? headerFile.name : 'Carregar do PC'}</span>
                  </div>
                  <Input name="imagem_url" label="Ou usar Link Externo" defaultValue={editingItem?.imagem_url} placeholder="https://..." icon={<ImageIcon size={18} />} />
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-black text-zinc-700 uppercase tracking-widest">Vídeo / Reportagem</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    onClick={() => videoInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${videoFile ? 'bg-sky-50 border-sky-500 text-sky-700' : 'bg-zinc-50 border-zinc-200 text-zinc-400 hover:border-sky-500 hover:bg-sky-50'}`}
                  >
                    <input type="file" ref={videoInputRef} onChange={(e) => setVideoFile(e.target.files?.[0] || null)} className="hidden" accept="video/*" />
                    <FileVideo size={20} />
                    <span className="text-[10px] font-bold uppercase">{videoFile ? videoFile.name : 'Carregar Vídeo'}</span>
                  </div>
                  <Input name="video_url" label="Ou Link do YouTube/Vimeo" defaultValue={editingItem?.video_url} placeholder="https://youtube.com/..." icon={<Play size={18} />} />
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-black text-zinc-700 uppercase tracking-widest">Galeria de Fotografias</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    onClick={() => galleryInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${galleryFiles && galleryFiles.length > 0 ? 'bg-orange-50 border-orange-500 text-orange-700' : 'bg-zinc-50 border-zinc-200 text-zinc-400 hover:border-orange-500 hover:bg-orange-50'}`}
                  >
                    <input type="file" ref={galleryInputRef} onChange={(e) => setGalleryFiles(e.target.files)} className="hidden" accept="image/*" multiple />
                    <ImageIcon size={20} />
                    <span className="text-[10px] font-bold uppercase">{galleryFiles && galleryFiles.length > 0 ? `${galleryFiles.length} fotos selecionadas` : 'Carregar Fotos'}</span>
                  </div>
                  <Input name="galeria_urls" label="Ou Links (separados por vírgula)" defaultValue={editingItem?.galeria_urls?.join(', ')} placeholder="Link1, Link2..." icon={<ImageIcon size={18} />} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest">Resumo / Lead <span className="text-zinc-300 normal-case font-medium">(aparece na listagem)</span></label>
                <textarea
                  name="resumo"
                  defaultValue={(editingItem as any)?.resumo}
                  rows={2}
                  className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 font-medium text-zinc-700 text-sm resize-none"
                  placeholder="Uma frase que resume o artigo e aparece nos cartões de listagem…"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest">Conteúdo Completo do Artigo *</label>
                <textarea
                  name="conteudo"
                  defaultValue={editingItem?.conteudo}
                  required
                  className="w-full p-6 bg-zinc-50 border border-zinc-200 rounded-[2rem] h-52 outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 font-medium text-zinc-700 resize-none"
                  placeholder="Escreva aqui a sua notícia ou comunicado completo…"
                />
              </div>
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-5 bg-zinc-900 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-xl hover:bg-zinc-800 transition-all disabled:opacity-70"
                >
                  {saving ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
                  {saving ? 'PROCESSANDO UPLOAD...' : (editingItem ? 'SALVAR ALTERAÇÕES' : 'PUBLICAR ARTIGO AGORA')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingImage && (
        <div
          className="fixed inset-0 z-[500] flex items-center justify-center bg-black/95 p-4"
          onClick={() => setViewingImage(null)}
        >
          <div className="absolute top-10 right-10 flex gap-6" onClick={(e) => e.stopPropagation()}>
            <a
              href={viewingImage}
              download="amazing-image.jpg"
              target="_blank"
              onClick={(e) => e.stopPropagation()}
              className="text-white hover:text-yellow-500 transition-all bg-white/10 p-4 rounded-full"
            >
              <FileDown size={32} />
            </a>
            <button
              className="text-white hover:text-yellow-500 transition-all bg-white/10 p-4 rounded-full"
              onClick={() => setViewingImage(null)}
            >
              <X size={32} />
            </button>
          </div>
          <img
            src={viewingImage}
            className="max-w-full max-h-[85vh] rounded-3xl shadow-2xl object-contain border-4 border-white/10"
            alt="Preview"
          />
        </div>
      )}
    </div>
  );
};

export default BlogPage;