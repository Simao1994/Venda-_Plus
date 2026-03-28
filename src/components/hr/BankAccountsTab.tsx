import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ContaBancariaHR, User } from '../../types';
import { PlusCircle, Edit, Trash2, Building, CheckCircle2, AlertCircle, RefreshCw, Save } from 'lucide-react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { useAuth } from '../../contexts/AuthContext';

interface BankAccountsTabProps {
   funcionarioId: string;
   user: User;
}

const formatIBAN = (value: string) => {
   const val = value.replace(/\s+/g, '').toUpperCase();
   const parts = val.match(/.{1,4}/g);
   return parts ? parts.join(' ') : val;
};

const BankAccountsTab: React.FC<BankAccountsTabProps> = ({ funcionarioId, user }) => {
   const { user: authUser } = useAuth();
   const companyId = authUser?.company_id || user?.company_id;
   const [contas, setContas] = useState<ContaBancariaHR[]>([]);
   const [loading, setLoading] = useState(true);
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [showForm, setShowForm] = useState(false);
   const [editingConta, setEditingConta] = useState<ContaBancariaHR | null>(null);

   const canEdit = user?.role ? ['admin', 'master', 'manager'].includes(user.role) : true;
   const isMaster = user?.role === 'master';

   const [formData, setFormData] = useState({
      nome_banco: '',
      numero_conta: '',
      iban: '',
      swift_bic: '',
      tipo_conta: 'Ordem',
      moeda: 'AOA',
      titular_conta: '',
      pais_banco: 'Angola',
      codigo_banco: '',
      codigo_agencia: '',
      principal: false,
      status: 'ativo' as 'ativo' | 'inativo',
      observacoes: ''
   });

   const fetchContas = async () => {
      setLoading(true);
      try {
         const token = localStorage.getItem('token');
         let url = '/api/hr/bank-accounts';
         if (funcionarioId) {
            url += `?funcionarioId=${funcionarioId}`;
         }

         const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
         });
         if (!res.ok) throw new Error('Falha ao carregar contas');
         const data = await res.json();
         setContas(data || []);
      } catch (err: any) {
         console.error('Erro ao buscar contas:', err);
         setContas([]);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      if (funcionarioId || companyId) {
         fetchContas();
      } else {
         setLoading(false);
      }
   }, [funcionarioId, companyId]);

   const resetForm = () => {
      setEditingConta(null);
      setFormData({
         nome_banco: '',
         numero_conta: '',
         iban: '',
         swift_bic: '',
         tipo_conta: 'Ordem',
         moeda: 'AOA',
         titular_conta: '',
         pais_banco: 'Angola',
         codigo_banco: '',
         codigo_agencia: '',
         principal: false,
         status: 'ativo',
         observacoes: ''
      });
      setShowForm(false);
   };

   const openEditForm = (conta: ContaBancariaHR) => {
      setEditingConta(conta);
      setFormData({
         nome_banco: conta.nome_banco,
         numero_conta: conta.numero_conta,
         iban: conta.iban || '',
         swift_bic: conta.swift_bic || '',
         tipo_conta: conta.tipo_conta || 'Ordem',
         moeda: conta.moeda || 'AOA',
         titular_conta: conta.titular_conta || '',
         pais_banco: conta.pais_banco || 'Angola',
         codigo_banco: conta.codigo_banco || '',
         codigo_agencia: conta.codigo_agencia || '',
         principal: conta.principal,
         status: conta.status,
         observacoes: conta.observacoes || ''
      });
      setShowForm(true);
   };

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);

      try {
         const token = localStorage.getItem('token');
         const payload = {
            ...formData,
            nome_banco: formData.nome_banco,
            funcionario_id: funcionarioId ? parseInt(funcionarioId) : null,
            company_id: companyId,
            iban: formatIBAN(formData.iban),
            atualizado_em: new Date().toISOString()
         };

         const url = editingConta ? `/api/hr/bank-accounts/${editingConta.id}` : '/api/hr/bank-accounts';
         const method = editingConta ? 'PUT' : 'POST';

         const res = await fetch(url, {
            method,
            headers: { 
               'Content-Type': 'application/json',
               'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
         });

         if (!res.ok) throw new Error('Falha ao guardar conta bancária');

         resetForm();
         fetchContas();
         if ((window as any).notify) (window as any).notify("Conta bancária salva com sucesso!", "success");

      } catch (err: any) {
         console.error('Erro ao salvar conta:', err);
         alert(`Erro ao guardar: ${err.message}`);
      } finally {
         setIsSubmitting(false);
      }
   };

   const handleDelete = async (id: string) => {
      if (!confirm('Deseja realmente eliminar esta conta?')) return;
      try {
         const token = localStorage.getItem('token');
         const res = await fetch(`/api/hr/bank-accounts/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
         });
         if (!res.ok) throw new Error('Falha ao eliminar conta');
         fetchContas();
         if ((window as any).notify) (window as any).notify("Conta removida com sucesso.", "success");
      } catch (err: any) {
         console.error('Erro ao eliminar:', err);
         alert('Erro ao eliminar a conta.');
      }
   };

   const setAsPrincipal = async (id: string) => {
      try {
         let clearQuery = supabase.from('rh_contas_bancarias').update({ principal: false });
         if (funcionarioId) {
            clearQuery = clearQuery.eq('funcionario_id', funcionarioId);
         } else if (companyId) {
            clearQuery = clearQuery.eq('company_id', companyId);
         }
         if (!isMaster) {
            clearQuery = clearQuery.eq('company_id', companyId);
         }
         await clearQuery;
         const { error } = await supabase.from('rh_contas_bancarias').update({ principal: true }).eq('id', id);
         if (error) throw error;
         await fetchContas();
      } catch (err) {
         console.error(err);
         alert("Erro ao definir como principal.");
      }
   };

   const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-gold-primary focus:border-transparent transition-all placeholder:text-white/20";

   if (loading) {
      return <div className="p-10 flex justify-center"><RefreshCw className="animate-spin text-gold-primary" /></div>;
   }

   return (
      <div className="space-y-6">
         <div className="flex justify-between items-center glass-panel p-6 rounded-2xl border border-white/5">
            <div>
               <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <Building size={16} className="text-gold-primary" /> Contas Bancárias (Recursos Humanos)
               </h3>
               <p className="text-xs text-white/30 mt-1 font-medium">Dados exclusivos para gestão e processamento financeiro interno.</p>
            </div>
            {canEdit && !showForm && (
               <button onClick={() => setShowForm(true)} className="px-5 py-2.5 bg-gold-primary/20 text-gold-primary font-black text-[10px] uppercase rounded-xl border border-gold-primary/30 hover:bg-gold-primary/30 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(99,102,241,0.1)]">
                  <PlusCircle size={16} /> Adicionar Conta
               </button>
            )}
         </div>

         {showForm ? (
            <div className="glass-panel p-8 rounded-2xl border border-white/10 shadow-xl overflow-hidden animate-in slide-in-from-top-4">
               <h4 className="text-sm font-black text-white uppercase mb-6 flex items-center gap-2 border-b border-white/5 pb-4">
                  {editingConta ? <Edit size={16} className="text-gold-primary" /> : <PlusCircle size={16} className="text-gold-primary" />}
                  {editingConta ? 'Editar Conta Bancária' : 'Registar Nova Conta'}
               </h4>
               <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Banco / Instituição *</label>
                        <input className={inputCls} value={formData.nome_banco} onChange={e => setFormData({ ...formData, nome_banco: e.target.value })} required placeholder="Ex: BAI, BFA, Standard Bank" />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Nº da Conta *</label>
                        <input className={inputCls} value={formData.numero_conta} onChange={e => setFormData({ ...formData, numero_conta: e.target.value })} required placeholder="Apenas números e hifens" />
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">IBAN *</label>
                        <input className={inputCls} value={formData.iban} onChange={e => setFormData({ ...formData, iban: formatIBAN(e.target.value) })} required placeholder="AO06.xxxxxxxxxxxx" />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Nome do Titular</label>
                        <input className={inputCls} value={formData.titular_conta} onChange={e => setFormData({ ...formData, titular_conta: e.target.value })} placeholder="Deixe em branco se for o próprio funcionário" />
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-white/5 p-6 rounded-2xl border border-white/5">
                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Tipo de Conta</label>
                        <select className={inputCls} value={formData.tipo_conta} onChange={e => setFormData({ ...formData, tipo_conta: e.target.value })}>
                           <option value="Ordem">Ordem / Corrente</option>
                           <option value="Poupança">Poupança</option>
                           <option value="Salário">Conta Salário</option>
                        </select>
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Moeda</label>
                        <select className={inputCls} value={formData.moeda} onChange={e => setFormData({ ...formData, moeda: e.target.value })}>
                           <option value="AOA">AOA (Kwanza)</option>
                           <option value="USD">USD (Dólar)</option>
                           <option value="EUR">EUR (Euro)</option>
                        </select>
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Agência / Balcão</label>
                        <input className={inputCls} value={formData.codigo_agencia} onChange={e => setFormData({ ...formData, codigo_agencia: e.target.value })} placeholder="Cód ou Nome" />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">SWIFT / BIC</label>
                        <input className={inputCls} value={formData.swift_bic} onChange={e => setFormData({ ...formData, swift_bic: e.target.value })} placeholder="Para transf. internacionais" />
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Observações (Opcional)</label>
                        <input className={inputCls} value={formData.observacoes} onChange={e => setFormData({ ...formData, observacoes: e.target.value })} placeholder="Ex: Conta usada apenas para subsídios" />
                     </div>

                     <div className="flex gap-6 items-center bg-white/5 px-6 py-4 rounded-xl border border-white/5">
                        <label className="flex items-center gap-2 cursor-pointer">
                           <input type="checkbox" checked={formData.principal} onChange={e => setFormData({ ...formData, principal: e.target.checked })} className="w-4 h-4 text-gold-primary rounded border-white/20 focus:ring-gold-primary accent-gold-primary bg-white/5" />
                           <span className="text-xs font-black uppercase text-white/70">Conta Principal</span>
                        </label>
                        <div className="space-y-1">
                           <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Estado</label>
                           <select className={inputCls} value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as any })}>
                              <option value="ativo">Ativa</option>
                              <option value="inativo">Inativa</option>
                           </select>
                        </div>
                     </div>
                  </div>

                  <div className="flex justify-end gap-4 pt-6 border-t border-white/5">
                     <button type="button" onClick={resetForm} className="px-6 py-3 font-black text-xs uppercase text-white/30 hover:text-white/60 transition-all">Cancelar</button>
                     <button type="submit" disabled={isSubmitting} className="px-8 py-3 bg-gold-primary/20 text-gold-primary font-black text-xs uppercase rounded-xl border border-gold-primary/30 hover:bg-gold-primary/30 transition-all shadow-[0_0_20px_rgba(99,102,241,0.1)] flex items-center gap-2 disabled:opacity-50">
                        {isSubmitting ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />} Guardar Conta
                     </button>
                  </div>
               </form>
            </div>
         ) : (
            <>
               {contas.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {contas.map(conta => (
                        <div key={conta.id} className={`p-6 rounded-2xl border relative group transition-all ${conta.status === 'inativo' ? 'glass-panel border-white/5 grayscale opacity-70' : (conta.principal ? 'bg-gradient-to-br from-gold-primary/20 to-gold-secondary/10 border-gold-primary/20 shadow-[0_0_30px_rgba(99,102,241,0.1)]' : 'glass-panel border-white/5 hover:border-gold-primary/20')}`}>
                           {conta.principal && <div className="absolute -top-3 -right-3 bg-gold-primary text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg flex items-center gap-1"><CheckCircle2 size={12} /> Principal</div>}

                           <div className="flex justify-between items-start mb-6">
                              <div>
                                 <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-white/30">{conta.tipo_conta} - {conta.moeda}</p>
                                 <h4 className="text-xl font-black text-white">{conta.nome_banco}</h4>
                              </div>
                              <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                                 <Building size={24} className="text-gold-primary" />
                              </div>
                           </div>

                           <div className="space-y-4 mb-6">
                              <div className="p-4 rounded-2xl font-mono text-sm tracking-widest text-center bg-white/5 border border-white/10 text-gold-primary">
                                 {conta.iban || 'S/ IBAN'}
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-xs">
                                 <div>
                                    <p className="text-[9px] uppercase font-bold text-white/20">Nº Conta</p>
                                    <p className="font-black text-white/60">{conta.numero_conta}</p>
                                 </div>
                                 {conta.titular_conta && (
                                    <div>
                                       <p className="text-[9px] uppercase font-bold text-white/20">Titular Dif.</p>
                                       <p className="font-black text-white/60 truncate" title={conta.titular_conta}>{conta.titular_conta}</p>
                                    </div>
                                 )}
                              </div>
                           </div>

                           {canEdit && (
                              <div className="flex justify-end gap-2 pt-4 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                                 {!conta.principal && conta.status === 'ativo' && (
                                    <button onClick={() => setAsPrincipal(conta.id)} className="px-3 py-1.5 bg-gold-primary/10 text-gold-primary hover:bg-gold-primary/20 text-[9px] font-black uppercase rounded-lg transition-all border border-gold-primary/20" title="Definir Principal">
                                       <CheckCircle2 size={14} />
                                    </button>
                                 )}
                                 <button onClick={() => openEditForm(conta)} className="px-3 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all flex items-center gap-1 bg-white/5 hover:bg-white/10 text-white/40 border border-white/10">
                                    <Edit size={12} /> Editar
                                 </button>
                                 <button onClick={() => handleDelete(conta.id)} className="px-3 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all flex items-center gap-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20">
                                    <Trash2 size={12} />
                                 </button>
                              </div>
                           )}
                        </div>
                     ))}
                  </div>
               ) : (
                  <div className="glass-panel border border-dashed border-white/10 rounded-[2rem] p-12 text-center flex flex-col items-center">
                     <AlertCircle size={48} className="text-white/10 mb-4" />
                     <h4 className="text-lg font-black text-white mb-2">Nenhuma conta registada</h4>
                     <p className="text-sm text-white/30 mb-6 max-w-sm">Este colaborador ainda não possui contas bancárias associadas no sistema. Os pagamentos seguirão o método tradicional.</p>
                     {canEdit && (
                        <button onClick={() => setShowForm(true)} className="px-6 py-3 bg-gold-primary/20 text-gold-primary font-black text-xs uppercase rounded-xl border border-gold-primary/30 hover:bg-gold-primary/30 transition-all">
                           Adicionar Primeira Conta
                        </button>
                     )}
                  </div>
               )}
            </>
         )}
      </div>
   );
};

export default BankAccountsTab;


