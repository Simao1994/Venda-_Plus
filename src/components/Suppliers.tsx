import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Truck, Plus, Search, Edit2, Trash2, Phone, Mail, MapPin, Save, X, Printer } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { A4ReportTemplate } from './reports/A4ReportTemplate';
import { api } from '../lib/api';

interface Supplier {
    id: number;
    name: string;
    phone: string;
    email: string;
    address: string;
}

export default function Suppliers() {
    const { token, user } = useAuth();
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        address: ''
    });

    const printRef = React.useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Relatorio-Fornecedores-${new Date().toLocaleDateString('pt-AO')}`
    });

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        try {
            const res = await api.get('/api/suppliers');
            const data = await res.json();
            setSuppliers(data);
        } catch (error) {
            console.error('Error fetching suppliers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const method = editingSupplier ? 'PUT' : 'POST';
        const url = editingSupplier ? `/api/suppliers/${editingSupplier.id}` : '/api/suppliers';

        try {
            const res = await (editingSupplier
                ? api.put(`/api/suppliers/${editingSupplier.id}`, formData)
                : api.post('/api/suppliers', formData));

            if (res.ok) {
                setShowModal(false);
                setEditingSupplier(null);
                setFormData({ name: '', phone: '', email: '', address: '' });
                fetchSuppliers();
            }
        } catch (error) {
            console.error('Error saving supplier:', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Tem a certeza que deseja eliminar este fornecedor?')) return;
        try {
            const res = await api.delete(`/api/suppliers/${id}`);
            if (res.ok) fetchSuppliers();
        } catch (error) {
            console.error('Error deleting supplier:', error);
        }
    };

    const openEdit = (supplier: Supplier) => {
        setEditingSupplier(supplier);
        setFormData({
            name: supplier.name,
            phone: supplier.phone || '',
            email: supplier.email || '',
            address: supplier.address || ''
        });
        setShowModal(true);
    };

    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.phone && s.phone.includes(search))
    );

    return (
        <div className="p-8 space-y-10 relative">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10 text-left">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tighter italic uppercase">
                        Supplier <span className="text-gold-gradient">Registry</span>
                    </h1>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mt-2">Strategic partner network & supply chain links</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-3 px-8 py-4 bg-white/5 text-white/60 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all shadow-xl"
                    >
                        <Printer size={18} />
                        Imprimir Relatório
                    </button>
                    <button
                        onClick={() => {
                            setEditingSupplier(null);
                            setFormData({ name: '', phone: '', email: '', address: '' });
                            setShowModal(true);
                        }}
                        className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-gold-primary to-gold-secondary text-bg-deep rounded-2xl text-[10px] font-black uppercase tracking-widest hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] transition-all shadow-2xl"
                    >
                        <Plus size={18} />
                        Initialize Partner
                    </button>
                </div>
            </div>

            {/* Hidden A4 Report */}
            <div style={{ display: 'none' }}>
                <A4ReportTemplate
                    ref={printRef}
                    title="Relatório de Fornecedores"
                    companyData={user}
                    orientation="portrait"
                >
                    <table className="a4-table">
                        <thead>
                            <tr>
                                <th>Denominação</th>
                                <th>Telefone</th>
                                <th>Email</th>
                                <th>Endereço</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSuppliers.map(s => (
                                <tr key={s.id}>
                                    <td className="font-bold">{s.name}</td>
                                    <td>{s.phone || '-'}</td>
                                    <td>{s.email || '-'}</td>
                                    <td>{s.address || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </A4ReportTemplate>
            </div>

            <div className="relative z-10">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gold-primary/40" size={20} />
                <input
                    type="text"
                    placeholder="LOCATE PARTNER BY DENOMINATION..."
                    className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/5 rounded-2xl focus:ring-4 focus:ring-gold-primary/10 focus:border-gold-primary/30 text-white text-[10px] font-black placeholder:text-white/10 outline-none transition-all uppercase tracking-widest shadow-xl"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="glass-panel rounded-3xl border border-white/5 overflow-hidden shadow-2xl relative z-10">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left">
                        <thead className="bg-white/[0.02] text-gold-primary/40 text-[9px] uppercase tracking-[0.3em] border-b border-white/5 font-black">
                            <tr>
                                <th className="px-8 py-5">Partner Denomination</th>
                                <th className="px-8 py-5">Communication Link</th>
                                <th className="px-8 py-5">Digital Vector</th>
                                <th className="px-8 py-5">Physical Base</th>
                                <th className="px-8 py-5 text-right">Control</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-10 h-10 border-2 border-gold-primary/20 border-t-gold-primary rounded-full animate-spin"></div>
                                            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Synchronizing Partner Stream...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredSuppliers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center opacity-20">
                                        <Truck size={48} className="mx-auto mb-4 text-white" />
                                        <p className="text-[10px] font-black text-white uppercase tracking-[0.3em]">No registry entries detected</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredSuppliers.map(supplier => (
                                    <tr key={supplier.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white/20 group-hover:text-gold-primary/40 transition-colors border border-white/5">
                                                    <Truck size={20} />
                                                </div>
                                                <div className="font-black text-white uppercase tracking-tight group-hover:text-gold-primary transition-colors text-xs">
                                                    {supplier.name}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3 text-[10px] font-black text-white/40 uppercase tracking-widest">
                                                <Phone size={14} className="text-gold-primary/30" />
                                                {supplier.phone || 'NO LINK'}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-left">
                                            <div className="flex items-center gap-3 text-[10px] font-black text-white/40 tracking-widest lowercase">
                                                <Mail size={14} className="text-gold-primary/30" />
                                                {supplier.email || 'unset@vector.io'}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3 text-[10px] font-black text-white/40 uppercase tracking-widest italic line-clamp-1">
                                                <MapPin size={14} className="text-gold-primary/30" />
                                                {supplier.address || 'Location Undefined'}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end gap-3 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all">
                                                <button
                                                    onClick={() => openEdit(supplier)}
                                                    className="p-3 text-white/40 hover:text-gold-primary bg-white/5 hover:bg-gold-primary/10 rounded-xl transition-all border border-transparent hover:border-gold-primary/30"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(supplier.id)}
                                                    className="p-3 text-white/40 hover:text-red-500 bg-white/5 hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-500/30"
                                                >
                                                    <Trash2 size={16} />
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

            {showModal && (
                <div className="fixed inset-0 bg-bg-deep/80 backdrop-blur-xl flex items-center justify-center z-[110] p-4 text-left">
                    <div className="glass-panel rounded-[40px] w-full max-w-md overflow-hidden shadow-2xl border border-white/10 relative">
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-gold-primary/40 to-transparent" />

                        <div className="p-8 border-b border-white/5 bg-gold-primary/[0.02] flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black text-white italic uppercase tracking-widest">
                                    {editingSupplier ? 'Entity Modification' : 'Partner Initialization'}
                                </h3>
                                <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mt-2 text-left">Initialize strategic link vector</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/40">
                                <X size={24} className="rotate-0 hover:rotate-90 transition-transform" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-10 space-y-6">
                            <div className="text-left">
                                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-3">Partner Denomination</label>
                                <div className="glass-panel p-4 rounded-2xl border border-white/5 focus-within:border-gold-primary/30 transition-all">
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-transparent border-none outline-none font-black text-white uppercase tracking-tight"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="PARTNER IDENTIFIER..."
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-left">
                                <div>
                                    <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-3">Communications</label>
                                    <div className="glass-panel p-4 rounded-2xl border border-white/5 focus-within:border-gold-primary/30 transition-all">
                                        <input
                                            type="text"
                                            className="w-full bg-transparent border-none outline-none font-black text-white uppercase tracking-tight"
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="+244..."
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-3">Digital Vector</label>
                                    <div className="glass-panel p-4 rounded-2xl border border-white/5 focus-within:border-gold-primary/30 transition-all">
                                        <input
                                            type="email"
                                            className="w-full bg-transparent border-none outline-none font-black text-white lowercase tracking-normal"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="partner@network.io"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="text-left">
                                <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-3">Physical Base</label>
                                <div className="glass-panel p-4 rounded-2xl border border-white/5 focus-within:border-gold-primary/30 transition-all">
                                    <textarea
                                        rows={3}
                                        className="w-full bg-transparent border-none outline-none font-black text-white uppercase tracking-tight resize-none"
                                        value={formData.address}
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                        placeholder="LOCATE PARTNER..."
                                    />
                                </div>
                            </div>

                            <div className="pt-6 flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white/30 border border-white/5 hover:bg-white/5 transition-all"
                                >
                                    Terminate
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-5 bg-gradient-to-r from-gold-primary to-gold-secondary text-bg-deep rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] transition-all shadow-xl"
                                >
                                    {editingSupplier ? 'Update Link' : 'Confirm Protocol'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
