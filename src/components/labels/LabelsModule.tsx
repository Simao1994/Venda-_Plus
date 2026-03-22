import React, { useState, useEffect, useRef } from 'react';
import {
    Plus, Search, Tag, Printer, X, CheckSquare,
    Square, Filter, Package, Cross, Calendar,
    Trash2, ChevronRight, Hash
} from 'lucide-react';
import { api } from '../../lib/api';
import { useReactToPrint } from 'react-to-print';

interface Product {
    id: string;
    name: string;
    sale_price: number;
    tipo: 'produto' | 'medicamento';
    barcode?: string;
    expiry_date?: string;
    category_name?: string;
}

interface SelectedLabel {
    product: Product;
    quantity: number;
}

const LabelsModule: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | 'produto' | 'medicamento'>('all');
    const [selectedLabels, setSelectedLabels] = useState<SelectedLabel[]>([]);
    const [showPreview, setShowPreview] = useState(false);
    const [layoutType, setLayoutType] = useState<'thermal' | 'a4'>('thermal');

    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: 'Etiquetas_VendaPlus',
    });

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await api.get('/api/products');
            if (res.ok) {
                setProducts(await res.json());
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.barcode?.includes(searchTerm);
        const matchesType = typeFilter === 'all' || p.tipo === typeFilter;
        return matchesSearch && matchesType;
    });

    const toggleSelection = (product: Product) => {
        setSelectedLabels(prev => {
            const exists = prev.find(l => l.product.id === product.id);
            if (exists) {
                return prev.filter(l => l.product.id !== product.id);
            }
            return [...prev, { product, quantity: 1 }];
        });
    };

    const updateQuantity = (id: string, qty: number) => {
        if (qty < 1) return;
        setSelectedLabels(prev => prev.map(l =>
            l.product.id === id ? { ...l, quantity: qty } : l
        ));
    };

    const removeSelected = (id: string) => {
        setSelectedLabels(prev => prev.filter(l => l.product.id !== id));
    };

    // Generate the flat list of labels for printing
    const printItems = selectedLabels.flatMap(l =>
        Array(l.quantity).fill(l.product)
    );

    return (
        <div className="flex flex-col h-full bg-bg-deep p-8 overflow-hidden animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tighter italic flex items-center gap-3">
                        <Tag size={32} className="text-gold-primary" />
                        GERADOR DE <span className="text-gold-gradient">ETIQUETAS</span>
                    </h1>
                    <p className="text-gold-primary/40 font-black text-[10px] uppercase tracking-[0.3em] mt-2">Módulo de Impressão Térmica e A4 Independente</p>
                </div>

                <div className="flex gap-4">
                    {selectedLabels.length > 0 && (
                        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                            <button
                                onClick={() => setLayoutType('thermal')}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${layoutType === 'thermal' ? 'bg-gold-primary text-bg-deep shadow-lg' : 'text-white/40 hover:text-white'}`}
                            >
                                Térmica
                            </button>
                            <button
                                onClick={() => setLayoutType('a4')}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${layoutType === 'a4' ? 'bg-gold-primary text-bg-deep shadow-lg' : 'text-white/40 hover:text-white'}`}
                            >
                                Folha A4
                            </button>
                        </div>
                    )}
                    {selectedLabels.length > 0 && (
                        <button
                            onClick={() => setShowPreview(true)}
                            className="flex items-center gap-2 bg-gradient-to-r from-gold-primary to-gold-secondary text-bg-deep px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all active:scale-95"
                        >
                            <Printer size={18} />
                            Gerar Etiquetas ({printItems.length})
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 overflow-hidden">
                {/* Product List */}
                <div className="lg:col-span-2 flex flex-col glass-panel rounded-[40px] overflow-hidden border border-white/5">
                    <div className="p-6 border-b border-white/5 space-y-4">
                        <div className="relative">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-primary/40" />
                            <input
                                type="text"
                                placeholder="Pesquisar por nome ou código..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-gold-primary transition-all"
                            />
                        </div>

                        <div className="flex gap-2">
                            {(['all', 'produto', 'medicamento'] as const).map(f => (
                                <button
                                    key={f}
                                    onClick={() => setTypeFilter(f)}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${typeFilter === f
                                        ? 'bg-gold-primary text-bg-deep'
                                        : 'bg-white/5 text-white/40 hover:bg-white/10'
                                        }`}
                                >
                                    {f === 'all' ? 'Todos' : f === 'produto' ? 'Produtos' : 'Medicamentos'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-40">
                                <div className="w-12 h-12 border-4 border-gold-primary/20 border-t-gold-primary rounded-full animate-spin" />
                                <span className="text-[10px] font-black text-gold-primary uppercase tracking-widest">A carregar inventário...</span>
                            </div>
                        ) : (
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-gold-primary/40 text-[10px] font-black uppercase tracking-widest border-b border-white/5">
                                        <th className="pb-4 w-12">#</th>
                                        <th className="pb-4">Produto</th>
                                        <th className="pb-4">Tipo</th>
                                        <th className="pb-4 text-right">Preço</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredProducts.map(p => {
                                        const isSelected = selectedLabels.some(l => l.product.id === p.id);
                                        return (
                                            <tr
                                                key={p.id}
                                                onClick={() => toggleSelection(p)}
                                                className={`group cursor-pointer hover:bg-white/[0.02] transition-colors ${isSelected ? 'bg-gold-primary/[0.03]' : ''}`}
                                            >
                                                <td className="py-4">
                                                    {isSelected ?
                                                        <CheckSquare size={18} className="text-gold-primary" /> :
                                                        <Square size={18} className="text-white/20 group-hover:text-gold-primary/40" />
                                                    }
                                                </td>
                                                <td className="py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-black text-white">{p.name}</span>
                                                        <span className="text-[9px] font-bold text-white/30 uppercase tracking-tighter">{p.barcode || 'SEM CÓDIGO'}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4">
                                                    <div className="flex items-center gap-2">
                                                        {p.tipo === 'medicamento' ?
                                                            <Cross size={12} className="text-emerald-500" /> :
                                                            <Package size={12} className="text-blue-500" />
                                                        }
                                                        <span className="text-[10px] font-bold text-white/40 uppercase">
                                                            {p.tipo === 'medicamento' ? 'Medicamento' : 'Produto'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-4 text-right">
                                                    <span className="text-xs font-black text-gold-secondary">
                                                        {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(p.sale_price)}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Selected Items List */}
                <div className="flex flex-col glass-panel rounded-[40px] overflow-hidden border border-white/5 bg-white/[0.02]">
                    <div className="p-6 border-b border-white/5 bg-gold-primary/[0.02]">
                        <h3 className="text-xs font-black text-gold-primary uppercase tracking-widest flex items-center gap-2">
                            <Printer size={14} /> Seleção Actual ({layoutType === 'thermal' ? 'Térmica' : 'A4'})
                        </h3>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                        {selectedLabels.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-20">
                                <Tag size={40} />
                                <p className="text-[10px] font-black uppercase tracking-widest max-w-[150px]">Selecione produtos na lista ao lado para começar</p>
                            </div>
                        ) : (
                            selectedLabels.map(item => (
                                <div key={item.product.id} className="bg-white/5 rounded-3xl p-4 border border-white/5 group hover:border-gold-primary/20 transition-all">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="min-w-0">
                                            <h4 className="text-[11px] font-black text-white truncate">{item.product.name}</h4>
                                            <span className="text-[8px] font-bold text-gold-primary/40 uppercase">{item.product.tipo}</span>
                                        </div>
                                        <button
                                            onClick={() => removeSelected(item.product.id)}
                                            className="p-2 text-white/20 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-2 bg-black/20 rounded-xl px-3 py-1 border border-white/5">
                                            <span className="text-[9px] font-black text-white/40 uppercase">Preço</span>
                                            <span className="text-[10px] font-black text-gold-secondary">{item.product.sale_price} Kz</span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-black text-white/40 uppercase">Qtd</span>
                                            <input
                                                type="number"
                                                value={item.quantity}
                                                onChange={e => updateQuantity(item.product.id, parseInt(e.target.value))}
                                                className="w-14 bg-white/10 border border-white/10 rounded-lg px-2 py-1 text-xs font-bold text-white text-center focus:outline-none focus:ring-1 focus:ring-gold-primary"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {selectedLabels.length > 0 && (
                        <div className="p-6 bg-black/40 border-t border-white/5">
                            <div className="flex justify-between mb-4">
                                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Total de Etiquetas</span>
                                <span className="text-xl font-black text-gold-primary">{printItems.length}</span>
                            </div>
                            <button
                                onClick={() => setSelectedLabels([])}
                                className="w-full py-3 text-[10px] font-black text-red-400/60 uppercase tracking-widest hover:text-red-400 transition-colors"
                            >
                                Limpar Tudo
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Print Preview Modal */}
            {showPreview && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-bg-deep/95 backdrop-blur-xl" />

                    <div className="relative w-full max-w-5xl h-full flex flex-col glass-panel rounded-[50px] border border-gold-primary/20 shadow-[0_0_100px_rgba(212,175,55,0.1)] overflow-hidden">
                        <div className="p-8 border-b border-white/10 flex items-center justify-between bg-gold-primary/[0.02]">
                            <div>
                                <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                                    <Printer size={26} className="text-gold-primary" /> Visualização ({layoutType === 'thermal' ? '50x30mm' : 'A4 Grid'})
                                </h2>
                                <p className="text-[10px] font-bold text-gold-primary/40 uppercase tracking-widest mt-1">
                                    {layoutType === 'thermal' ? 'Impressora Térmica Seleccionada' : 'Impressora Laser/Jacto de Tinta (Folha A4)'}
                                </p>
                            </div>

                            <div className="flex items-center gap-4">
                                <button
                                    onClick={handlePrint}
                                    className="bg-gold-primary text-bg-deep px-8 py-4 rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(212,175,55,0.3)] hover:scale-105 transition-all"
                                >
                                    Confirmar Impressão
                                </button>
                                <button
                                    onClick={() => setShowPreview(false)}
                                    className="p-4 bg-white/5 border border-white/10 rounded-2xl text-white/60 hover:text-white transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-12 bg-black/20 custom-scrollbar">
                            <div className={`bg-white shadow-2xl mx-auto ${layoutType === 'a4' ? 'w-[210mm]' : 'w-fit'} p-8 min-h-full`}>
                                <div ref={printRef} className="print-container">
                                    <style>
                                        {`
                                    @media print {
                                      @page {
                                        size: ${layoutType === 'a4' ? 'A4' : '50mm 30mm'};
                                        margin: ${layoutType === 'a4' ? '10mm' : '0'};
                                      }
                                      body {
                                        margin: 0;
                                        padding: 0;
                                        -webkit-print-color-adjust: exact;
                                      }
                                      .print-container {
                                        width: 100%;
                                        display: ${layoutType === 'a4' ? 'grid' : 'block'};
                                        grid-template-columns: ${layoutType === 'a4' ? 'repeat(4, 50mm)' : '1fr'};
                                        gap: ${layoutType === 'a4' ? '1mm' : '0'};
                                      }
                                      .label-item {
                                        width: 50mm;
                                        height: 30mm;
                                        padding: 1mm 1.5mm;
                                        box-sizing: border-box;
                                        page-break-inside: avoid;
                                        page-break-after: ${layoutType === 'thermal' ? 'always' : 'auto'};
                                        display: flex;
                                        flex-direction: column;
                                        justify-content: space-between;
                                        align-items: center;
                                        text-align: center;
                                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                                        color: black !important;
                                        background: white !important;
                                        border: 0.3mm solid #000;
                                        position: relative;
                                        overflow: hidden;
                                      }
                                      .label-header {
                                        font-size: 4pt;
                                        font-weight: 900;
                                        color: #000;
                                        text-transform: uppercase;
                                        letter-spacing: 0.1em;
                                        border-bottom: 0.1mm solid #000;
                                        width: 100%;
                                        padding-bottom: 0.2mm;
                                        margin-bottom: 0.2mm;
                                      }
                                      .label-body {
                                        flex: 1;
                                        display: flex;
                                        flex-direction: column;
                                        justify-content: center;
                                        width: 100%;
                                        gap: 0.1mm;
                                        overflow: hidden;
                                      }
                                      .label-name {
                                        font-size: 6.5pt;
                                        font-weight: 700;
                                        text-transform: uppercase;
                                        line-height: 1;
                                        color: #000;
                                        display: -webkit-box;
                                        -webkit-line-clamp: 2;
                                        -webkit-box-orient: vertical;
                                        overflow: hidden;
                                      }
                                      .label-price-container {
                                        margin: 0.1mm 0;
                                      }
                                      .label-currency {
                                        font-size: 6pt;
                                        font-weight: 800;
                                        vertical-align: super;
                                        margin-right: 2pt;
                                      }
                                      .label-price {
                                        font-size: 13pt;
                                        font-weight: 950;
                                        color: #000;
                                        letter-spacing: -0.5pt;
                                      }
                                      .label-footer {
                                        width: 100%;
                                        display: flex;
                                        flex-direction: column;
                                        align-items: center;
                                        border-top: 0.2mm solid #000;
                                        padding-top: 0.3mm;
                                        margin-top: 0.1mm;
                                      }
                                      .label-meta-list {
                                        width: 100%;
                                        display: flex;
                                        flex-direction: column;
                                        align-items: center;
                                        gap: 0.1mm;
                                      }
                                      .label-meta-item {
                                        font-size: 4.5pt;
                                        font-weight: 900;
                                        color: #000;
                                        text-transform: uppercase;
                                        white-space: nowrap;
                                      }
                                    }
                                    
                                    /* Preview Styles in Modal */
                                    .preview-grid {
                                       display: grid;
                                       grid-template-columns: ${layoutType === 'a4' ? 'repeat(4, 50mm)' : 'repeat(auto-fill, 50mm)'};
                                       gap: ${layoutType === 'a4' ? '2mm' : '5mm'};
                                       justify-content: center;
                                       padding: 5mm;
                                    }
                                    .label-card {
                                        width: 50mm;
                                        height: 30mm;
                                        background: white;
                                        border: 0.5mm solid #000;
                                        display: flex;
                                        flex-direction: column;
                                        justify-content: space-between;
                                        align-items: center;
                                        text-align: center;
                                        color: black;
                                        box-shadow: 0 5px 20px rgba(0,0,0,0.1);
                                    }
                                  `}
                                    </style>

                                    <div className="preview-grid">
                                        {printItems.map((p, idx) => (
                                            <div key={idx} className="label-item label-card">
                                                <div className="label-header">PRODUTO</div>
                                                <div className="label-body">
                                                    <div className="label-name">{p.name}</div>
                                                    <div className="label-price-container">
                                                        <span className="label-currency">Kz </span>
                                                        <span className="label-price">
                                                            {new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 2 }).format(p.sale_price)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="label-footer">
                                                    <div className="label-meta-list">
                                                        {p.tipo === 'medicamento' && p.expiry_date && (
                                                            <div className="label-meta-item">VAL: {new Date(p.expiry_date).toLocaleDateString()}</div>
                                                        )}
                                                        <div className="label-meta-item">CÓDIGO: {p.barcode || '0000000000000'}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LabelsModule;
