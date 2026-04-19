import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ShoppingCart, Plus, ShoppingBag, Truck, CheckCircle2, Clock, AlertCircle, Search, Calendar, Package } from 'lucide-react';
import { api } from '../lib/api';

interface PurchaseOrder {
    id: number;
    supplier_name: string;
    total_amount: number;
    status: 'pending' | 'received' | 'cancelled';
    created_at: string;
    items_count: number;
}

export default function PurchaseOrders() {
    const { user } = useAuth();
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [products, setProducts] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);

    const [newOrder, setNewOrder] = useState({
        supplier_id: '',
        items: [] as { product_id: number; name: string; quantity: number; cost: number }[]
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [ordRes, prodRes, supRes] = await Promise.all([
                api.get('/api/purchase-orders'),
                api.get('/api/products'),
                api.get('/api/suppliers')
            ]);
            setOrders(await ordRes.json() || []);
            setProducts(await prodRes.json() || []);
            setSuppliers(await supRes.json() || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newOrder.items.length === 0) return;

        try {
            const res = await api.post('/api/purchase-orders', newOrder);

            if (res.ok) {
                setShowModal(false);
                setNewOrder({ supplier_id: '', items: [] });
                fetchData();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const markAsReceived = async (id: number) => {
        try {
            const res = await api.post(`/api/purchase-orders/${id}/receive`, {});
            if (res.ok) fetchData();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="p-8 space-y-10 relative animate-in fade-in duration-700">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative">
                <div className="relative">
                    <div className="absolute -left-10 top-1/2 -translate-y-1/2 w-1 h-12 bg-gold-primary rounded-full shadow-[0_0_20px_rgba(212,175,55,0.4)]" />
                    <h1 className="text-4xl font-black text-white tracking-tighter italic uppercase">
                        Procurement <span className="text-gold-gradient">Hub</span>
                    </h1>
                    <p className="text-[10px] font-black text-gold-primary/40 uppercase tracking-[0.4em] mt-2 italic">Supply chain management & acquisitions</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-gold-gradient text-bg-deep rounded-2xl hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] font-black uppercase tracking-widest text-[10px] transition-all shadow-2xl active:scale-95 border border-white/10"
                >
                    <Plus size={18} />
                    Initialize Request
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="glass-panel p-8 rounded-[32px] border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-16 -mt-16 group-hover:bg-amber-500/10 transition-all blur-3xl" />
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center shadow-inner">
                            <Clock size={28} />
                        </div>
                        <div>
                            <h3 className="text-white/30 text-[10px] font-black uppercase tracking-widest mb-1 italic">Pending Orders</h3>
                            <p className="text-4xl font-black text-white italic tracking-tighter">{orders.filter(o => o.status === 'pending').length}</p>
                        </div>
                    </div>
                </div>
                <div className="glass-panel p-8 rounded-[32px] border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-all blur-3xl" />
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center shadow-inner">
                            <Truck size={28} />
                        </div>
                        <div>
                            <h3 className="text-white/30 text-[10px] font-black uppercase tracking-widest mb-1 italic">Received Logistics</h3>
                            <p className="text-4xl font-black text-white italic tracking-tighter">{orders.filter(o => o.status === 'received').length}</p>
                        </div>
                    </div>
                </div>
                <div className="glass-panel p-8 rounded-[32px] border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gold-primary/5 rounded-full -mr-16 -mt-16 group-hover:bg-gold-primary/10 transition-all blur-3xl" />
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-gold-primary/10 text-gold-primary rounded-2xl flex items-center justify-center shadow-inner">
                            <ShoppingBag size={28} />
                        </div>
                        <div>
                            <h3 className="text-white/30 text-[10px] font-black uppercase tracking-widest mb-1 italic">Capital Outflow</h3>
                            <p className="text-4xl font-black text-gold-gradient italic tracking-tighter">
                                {orders.filter(o => o.status === 'received').reduce((acc, curr) => acc + curr.total_amount, 0).toLocaleString()} <span className="text-xs">{user?.currency}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="glass-panel rounded-[40px] border border-white/5 overflow-hidden shadow-2xl relative">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-[#0B0B0B] text-[10px] font-black text-white/20 uppercase tracking-[0.2em] border-b border-white/5">
                                <th className="px-10 py-6">ID / Entidade</th>
                                <th className="px-10 py-6">Timestamp</th>
                                <th className="px-10 py-6">Asset Count</th>
                                <th className="px-10 py-6 text-right">Magnitude</th>
                                <th className="px-10 py-6 text-center">Status</th>
                                <th className="px-10 py-6 text-right">Execution</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {orders.map((order) => (
                                <tr key={order.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-10 py-6">
                                        <p className="font-black text-white italic tracking-tighter uppercase text-base">OC-{order.id.toString().padStart(4, '0')}</p>
                                        <p className="text-[10px] font-black text-gold-primary/40 uppercase tracking-[0.2em] italic">{order.supplier_name}</p>
                                    </td>
                                    <td className="px-10 py-6">
                                        <p className="text-[11px] font-bold text-white/60">{new Date(order.created_at).toLocaleDateString()}</p>
                                    </td>
                                    <td className="px-10 py-6">
                                        <span className="text-[11px] font-black text-white/30 uppercase tracking-widest italic">{order.items_count} assets</span>
                                    </td>
                                    <td className="px-10 py-6 text-right">
                                        <p className="font-black text-white text-lg italic tracking-tighter">{order.total_amount.toLocaleString()} <span className="text-[10px] opacity-30 italic ml-1">{user?.currency}</span></p>
                                    </td>
                                    <td className="px-10 py-6 text-center">
                                        <span className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border ${order.status === 'received' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' :
                                                order.status === 'cancelled' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                                            }`}>
                                            {order.status === 'received' ? 'Authenticated' :
                                                order.status === 'cancelled' ? 'Aborted' : 'Transit'}
                                        </span>
                                    </td>
                                    <td className="px-10 py-6 text-right">
                                        {order.status === 'pending' && (
                                            <button
                                                onClick={() => markAsReceived(order.id)}
                                                className="px-5 py-2.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-500 hover:text-white transition-all ml-auto hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] shadow-inner"
                                            >
                                                <CheckCircle2 size={14} />
                                                Certify Receipt
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {orders.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-10 py-32 text-center text-white/10 font-black uppercase text-[12px] tracking-[0.4em] italic bg-[#0B0B0B]/40 animate-pulse">
                                        No procurement logs detected.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* New Order Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-bg-deep/90 backdrop-blur-xl flex items-center justify-center z-[110] p-4 text-left">
                    <div className="glass-panel rounded-[40px] w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-white/10 relative">
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-gold-primary/40 to-transparent" />
                        
                        <div className="p-10 border-b border-white/5 bg-gold-primary/[0.02] flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Procurement <span className="text-gold-gradient">Synthesis</span></h3>
                                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mt-2 italic">Select partner and aggregate asset vectors</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-3 hover:bg-white/5 rounded-full transition-colors text-white/30">
                                <Plus size={28} className="rotate-45" />
                            </button>
                        </div>

                        <div className="p-10 overflow-y-auto flex-1 gap-10 flex flex-col lg:flex-row bg-[#080808]/50">
                            <div className="flex-1 space-y-10">
                                <div className="space-y-4">
                                    <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] italic">Strategic Partner</label>
                                    <div className="relative group">
                                        <Truck className="absolute left-5 top-1/2 -translate-y-1/2 text-gold-primary/40 group-focus-within:text-gold-primary transition-colors" size={20} />
                                        <select
                                            className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/5 rounded-2xl focus:border-gold-primary/30 outline-none font-black text-[11px] text-white uppercase tracking-widest appearance-none cursor-pointer group-hover:bg-white/[0.08] transition-all"
                                            value={newOrder.supplier_id}
                                            onChange={(e) => setNewOrder({ ...newOrder, supplier_id: e.target.value })}
                                        >
                                            <option value="" className="bg-bg-deep">Detecting partner network...</option>
                                            {suppliers.map(s => (
                                                <option key={s.id} value={s.id} className="bg-bg-deep">{s.name?.toUpperCase()}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] italic">Asset Inventory</label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-3 custom-scrollbar">
                                        {products.map(p => (
                                            <button
                                                key={p.id}
                                                onClick={() => {
                                                    const exists = newOrder.items.find(i => i.product_id === p.id);
                                                    if (!exists) {
                                                        setNewOrder({
                                                            ...newOrder,
                                                            items: [...newOrder.items, { product_id: p.id, name: p.name, quantity: 1, cost: p.cost_price || 0 }]
                                                        });
                                                    }
                                                }}
                                                className="p-5 bg-white/5 rounded-2xl text-left border border-white/5 hover:border-gold-primary/30 hover:bg-white/[0.08] transition-all group relative overflow-hidden"
                                            >
                                                <div className="relative z-10">
                                                    <p className="text-xs font-black text-white uppercase tracking-tight group-hover:text-gold-primary transition-colors">{p.name}</p>
                                                    <div className="flex justify-between items-center mt-3">
                                                        <p className="text-[9px] text-white/20 font-black uppercase tracking-widest">Stock: <span className="text-white/60">{p.stock}</span></p>
                                                        <p className="text-[9px] text-gold-primary/40 font-black tracking-widest italic">{p.cost_price?.toLocaleString()} {user?.currency}</p>
                                                    </div>
                                                </div>
                                                <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Plus size={14} className="text-gold-primary" />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="w-full lg:w-[400px] bg-white/[0.02] rounded-[32px] p-8 border border-white/5 flex flex-col shadow-inner">
                                <h4 className="text-[10px] font-black text-gold-primary/40 uppercase tracking-[0.4em] mb-8 italic flex items-center gap-3">
                                    <Package size={14} /> Manifest Aggregation
                                </h4>
                                <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                                    {newOrder.items.map((item, idx) => (
                                        <div key={idx} className="bg-white/5 p-5 rounded-2xl border border-white/5 animate-in slide-in-from-right duration-300">
                                            <div className="flex justify-between items-start mb-4">
                                                <p className="text-[11px] font-black text-white uppercase tracking-tight leading-tight flex-1">{item.name}</p>
                                                <button
                                                    onClick={() => setNewOrder({ ...newOrder, items: newOrder.items.filter((_, i) => i !== idx) })}
                                                    className="text-white/20 hover:text-red-500 transition-colors p-1"
                                                >
                                                    <Plus size={18} className="rotate-45" />
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-2">
                                                    <span className="text-[8px] font-black text-white/10 uppercase tracking-widest">Quantum</span>
                                                    <input
                                                        type="number"
                                                        className="w-full p-3 bg-bg-deep rounded-xl text-[11px] font-black text-white border border-white/5 focus:border-gold-primary/30 outline-none transition-all shadow-inner"
                                                        value={item.quantity}
                                                        onChange={(e) => {
                                                            const newItems = [...newOrder.items];
                                                            newItems[idx].quantity = parseFloat(e.target.value) || 0;
                                                            setNewOrder({ ...newOrder, items: newItems });
                                                        }}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                     <span className="text-[8px] font-black text-white/10 uppercase tracking-widest">Unit Cost</span>
                                                    <input
                                                        type="number"
                                                        className="w-full p-3 bg-bg-deep rounded-xl text-[11px] font-black text-gold-primary border border-white/5 focus:border-gold-primary/30 outline-none transition-all shadow-inner"
                                                        value={item.cost}
                                                        onChange={(e) => {
                                                            const newItems = [...newOrder.items];
                                                            newItems[idx].cost = parseFloat(e.target.value) || 0;
                                                            setNewOrder({ ...newOrder, items: newItems });
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {newOrder.items.length === 0 && (
                                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-20">
                                            <ShoppingBag size={40} className="text-white" />
                                            <p className="text-[9px] font-black text-white uppercase tracking-[0.3em]">Manifest is empty</p>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-8 border-t border-white/5 mt-8 space-y-6">
                                    <div className="flex justify-between items-center">
                                        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] italic">Aggregate Sum</p>
                                        <p className="text-3xl font-black text-gold-gradient italic tracking-tighter">
                                            {newOrder.items.reduce((acc, curr) => acc + (curr.quantity * curr.cost), 0).toLocaleString()} <span className="text-[10px] text-gold-primary/40 uppercase ml-1 italic">{user?.currency}</span>
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleCreateOrder}
                                        disabled={!newOrder.supplier_id || newOrder.items.length === 0}
                                        className="w-full py-5 bg-gold-gradient text-bg-deep rounded-2xl text-[11px] font-black uppercase tracking-[0.4em] hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] transition-all shadow-2xl disabled:opacity-20 disabled:grayscale active:scale-95 border border-white/10"
                                    >
                                        Confirm Dispatch
                                    </button>
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="w-full py-2 text-[9px] font-black text-white/20 uppercase tracking-[0.4em] hover:text-white/60 transition-all italic"
                                    >
                                        Abort Signal
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
