import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ShoppingCart, Plus, ShoppingBag, Truck, CheckCircle2, Clock, AlertCircle, Search, Calendar, Package } from 'lucide-react';

interface PurchaseOrder {
    id: number;
    supplier_name: string;
    total_amount: number;
    status: 'pending' | 'received' | 'cancelled';
    created_at: string;
    items_count: number;
}

export default function PurchaseOrders() {
    const { token, user } = useAuth();
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
                fetch('/api/purchase-orders', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/products', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/suppliers', { headers: { Authorization: `Bearer ${token}` } })
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
            const res = await fetch('/api/purchase-orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(newOrder)
            });

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
            const res = await fetch(`/api/purchase-orders/${id}/receive`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) fetchData();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <header className="mb-8 flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Ordens de Compra</h1>
                    <p className="text-gray-500 font-medium">Faça a gestão de pedidos a fornecedores e reposição de stock.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-emerald-600 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                >
                    <Plus size={18} />
                    Novo Pedido
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pendentes</p>
                        <p className="text-2xl font-black text-gray-900">{orders.filter(o => o.status === 'pending').length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                        <Truck size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Recebidas</p>
                        <p className="text-2xl font-black text-gray-900">{orders.filter(o => o.status === 'received').length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                        <ShoppingBag size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Gasto</p>
                        <p className="text-2xl font-black text-gray-900">
                            {orders.filter(o => o.status === 'received').reduce((acc, curr) => acc + curr.total_amount, 0).toLocaleString()} <span className="text-xs">{user?.currency}</span>
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b">
                                <th className="px-6 py-5">Nº Pedido / Fornecedor</th>
                                <th className="px-6 py-5">Data</th>
                                <th className="px-6 py-5">Itens</th>
                                <th className="px-6 py-5 text-right">Total</th>
                                <th className="px-6 py-5 text-center">Estado</th>
                                <th className="px-6 py-5 text-right">Acções</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {orders.map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-gray-900">OC-{order.id.toString().padStart(4, '0')}</p>
                                        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{order.supplier_name}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-xs font-bold text-gray-600">{new Date(order.created_at).toLocaleDateString()}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-bold text-gray-500">{order.items_count} produtos</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <p className="font-black text-gray-900">{order.total_amount.toLocaleString()} {user?.currency}</p>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${order.status === 'received' ? 'bg-emerald-100 text-emerald-700' :
                                                order.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                            }`}>
                                            {order.status === 'received' ? 'Recebido' :
                                                order.status === 'cancelled' ? 'Cancelado' : 'Pendente'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {order.status === 'pending' && (
                                            <button
                                                onClick={() => markAsReceived(order.id)}
                                                className="text-emerald-600 hover:text-emerald-700 font-black text-[10px] uppercase tracking-widest flex items-center gap-1 justify-end ml-auto"
                                            >
                                                <CheckCircle2 size={14} />
                                                Marcar como Recebido
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {orders.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center">
                                        <AlertCircle size={40} className="text-gray-200 mx-auto mb-4" />
                                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Nenhuma ordem de compra encontrada.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* New Order Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-8 border-b bg-gray-50/50">
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">Novo Pedido a Fornecedor</h3>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Selecione o fornecedor e os itens para reposição</p>
                        </div>

                        <div className="p-8 overflow-y-auto flex-1 gap-8 flex">
                            <div className="flex-1 space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Fornecedor</label>
                                    <select
                                        className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-gray-900"
                                        value={newOrder.supplier_id}
                                        onChange={(e) => setNewOrder({ ...newOrder, supplier_id: e.target.value })}
                                    >
                                        <option value="">Selecione um fornecedor</option>
                                        {suppliers.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Pesquisar Itens</label>
                                    <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-2">
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
                                                className="p-3 bg-gray-50 rounded-xl text-left hover:bg-emerald-50 hover:ring-1 hover:ring-emerald-200 transition-all group"
                                            >
                                                <p className="text-xs font-bold text-gray-900 group-hover:text-emerald-700">{p.name}</p>
                                                <p className="text-[10px] text-gray-400 font-medium">Stock: {p.stock} | Preço: {p.cost_price}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="w-[350px] bg-gray-50 rounded-3xl p-6 flex flex-col">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Lista do Pedido</h4>
                                <div className="flex-1 space-y-3 overflow-y-auto">
                                    {newOrder.items.map((item, idx) => (
                                        <div key={idx} className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
                                            <div className="flex justify-between items-start mb-2">
                                                <p className="text-xs font-bold text-gray-900 pr-2">{item.name}</p>
                                                <button
                                                    onClick={() => setNewOrder({ ...newOrder, items: newOrder.items.filter((_, i) => i !== idx) })}
                                                    className="text-red-400 hover:text-red-600"
                                                >
                                                    &times;
                                                </button>
                                            </div>
                                            <div className="flex gap-2">
                                                <input
                                                    type="number"
                                                    className="w-20 p-2 bg-gray-50 rounded-lg text-xs font-bold outline-none"
                                                    placeholder="Qtd"
                                                    value={item.quantity}
                                                    onChange={(e) => {
                                                        const newItems = [...newOrder.items];
                                                        newItems[idx].quantity = parseFloat(e.target.value) || 0;
                                                        setNewOrder({ ...newOrder, items: newItems });
                                                    }}
                                                />
                                                <input
                                                    type="number"
                                                    className="flex-1 p-2 bg-gray-50 rounded-lg text-xs font-bold outline-none"
                                                    placeholder="Custo"
                                                    value={item.cost}
                                                    onChange={(e) => {
                                                        const newItems = [...newOrder.items];
                                                        newItems[idx].cost = parseFloat(e.target.value) || 0;
                                                        setNewOrder({ ...newOrder, items: newItems });
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    {newOrder.items.length === 0 && (
                                        <p className="text-[10px] font-bold text-gray-300 text-center mt-10">Carrinho vazio</p>
                                    )}
                                </div>

                                <div className="pt-4 border-t mt-4">
                                    <div className="flex justify-between items-center mb-6">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Estimado</p>
                                        <p className="text-xl font-black text-emerald-600">
                                            {newOrder.items.reduce((acc, curr) => acc + (curr.quantity * curr.cost), 0).toLocaleString()} {user?.currency}
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleCreateOrder}
                                        disabled={!newOrder.supplier_id || newOrder.items.length === 0}
                                        className="w-full py-4 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl disabled:opacity-50"
                                    >
                                        Confirmar Pedido
                                    </button>
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="w-full py-3 mt-2 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-all"
                                    >
                                        Cancelar
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
