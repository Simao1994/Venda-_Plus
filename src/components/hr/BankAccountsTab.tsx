import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ContaBancariaHR, User } from '../../types';
import { PlusCircle, Edit, Trash2, Building, CheckCircle2, AlertCircle, RefreshCw, Save } from 'lucide-react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { useAuth } from '../../contexts/AuthContext';

interface BankAccountsTabProps {
   funcionarioId: string;
   user: User; // Para validação de permissão: Admin ou RH podem editar
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

   const canEdit = user?.role ? ['admin', 'hr', 'director_hr', 'saas_admin'].includes(user.role) : true;

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
         // Se temos um funcionário específico, filtra por ele
         // Se não (aba geral de empresa), filtra por company_id
         let query = supabase
            .from('rh_contas_bancarias')
            .select('*')
            .order('principal', { ascending: false })
            .order('criado_em', { ascending: false });

         if (funcionarioId) {
            query = query.eq('funcionario_id', funcionarioId);
         } else if (companyId) {
            query = query.eq('company_id', companyId);
         }

         const { data, error } = await query;

         if (error) throw error;
         setContas(data || []);
      } catch (err: any) {
         console.error('Erro ao buscar contas:', err);
         setContas([]);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      // Carrega sempre que temos um company_id ou funcionarioId
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
         // Se for definida como principal, tirar flag das outras. 
         // O trigger do lado do postgres seria ideal, mas fazemos aqui para garantir caso falte na db.
         if (formData.principal && funcionarioId) {
            await supabase
               .from('rh_contas_bancarias')
               .update({ principal: false })
               .eq('funcionario_id', funcionarioId);
         }

         const payLoad = {
            funcionario_id: funcionarioId || null,
            nome_banco: formData.nome_banco,
            numero_conta: formData.numero_conta,
            iban: formatIBAN(formData.iban),
            swift_bic: formData.swift_bic,
            tipo_conta: formData.tipo_conta,
            moeda: formData.moeda,
            titular_conta: formData.titular_conta,
            pais_banco: formData.pais_banco,
            codigo_banco: formData.codigo_banco,
            codigo_agencia: formData.codigo_agencia,
            principal: formData.principal,
            status: formData.status,
            observacoes: formData.observacoes,
            company_id: companyId,
            atualizado_em: new Date().toISOString()
         };

         if (editingConta) {
            const { error } = await supabase
               .from('rh_contas_bancarias')
               .update(payLoad)
               .eq('id', editingConta.id);
            if (error) throw error;
         } else {
            // Nova conta. Se for a primeira e unica, forcamos a ser principal
            let isPrincipal = formData.principal;
            if (contas.length === 0) isPrincipal = true;

            const { error } = await supabase
               .from('rh_contas_bancarias')
               .insert([{ ...payLoad, principal: isPrincipal, criado_em: new Date().toISOString() }]);
            if (error) throw error;
         }

         await fetchContas();
         resetForm();
         if ((window as any).notify) (window as any).notify("Conta bancária salva com sucesso!", "success");

      } catch (err: any) {
         console.error('Erro ao salvar conta:', err);
         alert(`Erro ao salvar: ${err.message || 'Verifique se a tabela rh_contas_bancarias já foi criada no banco de dados.'}`);
      } finally {
         setIsSubmitting(false);
      }
   };

   const handleDelete = async (id: string) => {
      if (!confirm('Eliminar esta conta bancária? Esta ação não pode ser desfeita.')) return;
      try {
         const { error } = await supabase.from('rh_contas_bancarias').delete().eq('id', id);
         if (error) throw error;
         await fetchContas();
         if ((window as any).notify) (window as any).notify("Conta removida com sucesso.", "success");
      } catch (err) {
         console.error(err);
         alert("Erro ao excluir conta.");
      }
   };

   const setAsPrincipal = async (id: string) => {
      try {
         // Tirar o flag de principal de todas as contas desta empresa
         let clearQuery = supabase.from('rh_contas_bancarias').update({ principal: false });
         if (funcionarioId) {
            clearQuery = clearQuery.eq('funcionario_id', funcionarioId);
         } else if (companyId) {
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

   if (loading) {
      return <div className="p-10 flex justify-center"><RefreshCw className="animate-spin text-zinc-400" /></div>;
   }

   return (
      <div className="space-y-6">
         <div className="flex justify-between items-center bg-zinc-50 p-6 rounded-3xl border border-zinc-100">
            <div>
               <h3 className="text-sm font-black text-zinc-900 uppercase tracking-widest flex items-center gap-2">
                  <Building size={16} className="text-yellow-500" /> Contas Bancárias (RH)
               </h3>
               <p className="text-xs text-zinc-500 mt-1 font-medium">Dados exclusivos para gestão e processamento financeiro interno.</p>
            </div>
            {canEdit && !showForm && (
               <button onClick={() => setShowForm(true)} className="px-5 py-2.5 bg-zinc-900 text-white font-black text-[10px] uppercase rounded-xl hover:bg-yellow-500 hover:text-zinc-900 transition-all flex items-center gap-2 shadow-lg">
                  <PlusCircle size={16} /> Adicionar Conta
               </button>
            )}
         </div>

         {showForm ? (
            <div className="bg-white p-8 rounded-3xl border border-sky-100 shadow-xl overflow-hidden animate-in slide-in-from-top-4">
               <h4 className="text-sm font-black text-zinc-900 uppercase mb-6 flex items-center gap-2 border-b border-zinc-100 pb-4">
                  {editingConta ? <Edit size={16} className="text-yellow-500" /> : <PlusCircle size={16} className="text-yellow-500" />}
                  {editingConta ? 'Editar Conta Bancária' : 'Registar Nova Conta'}
               </h4>
               <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Informações Básicas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <Input label="Banco / Instituição" value={formData.nome_banco} onChange={e => setFormData({ ...formData, nome_banco: e.target.value })} required placeholder="Ex: BAI, BFA, Standard Bank" />
                     <Input label="Nº da Conta" value={formData.numero_conta} onChange={e => setFormData({ ...formData, numero_conta: e.target.value })} required placeholder="Apenas números e hifens" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <Input label="IBAN" value={formData.iban} onChange={e => setFormData({ ...formData, iban: formatIBAN(e.target.value) })} required placeholder="AO06.xxxxxxxxxxxx" />
                     <Input label="Nome do Titular" value={formData.titular_conta} onChange={e => setFormData({ ...formData, titular_conta: e.target.value })} placeholder="Deixe em branco se for o próprio funcionário" />
                  </div>

                  {/* Informações Secundárias */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-zinc-50 p-6 rounded-2xl border border-zinc-100">
                     <Select label="Tipo de Conta" value={formData.tipo_conta} onChange={e => setFormData({ ...formData, tipo_conta: e.target.value })} options={[
                        { value: 'Ordem', label: 'Ordem / Corrente' },
                        { value: 'Poupança', label: 'Poupança' },
                        { value: 'Salário', label: 'Conta Salário' }
                     ]} />
                     <Select label="Moeda" value={formData.moeda} onChange={e => setFormData({ ...formData, moeda: e.target.value })} options={[
                        { value: 'AOA', label: 'AOA (Kwanza)' },
                        { value: 'USD', label: 'USD (Dólar)' },
                        { value: 'EUR', label: 'EUR (Euro)' },
                     ]} />
                     <Input label="Agência / Balcão" value={formData.codigo_agencia} onChange={e => setFormData({ ...formData, codigo_agencia: e.target.value })} placeholder="Cód ou Nome" />
                     <Input label="SWIFT / BIC" value={formData.swift_bic} onChange={e => setFormData({ ...formData, swift_bic: e.target.value })} placeholder="Para transf. internacionais" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <Input label="Observações (Opcional)" value={formData.observacoes} onChange={e => setFormData({ ...formData, observacoes: e.target.value })} placeholder="Ex: Conta usada apenas para subsídios" />

                     <div className="flex gap-6 items-center bg-zinc-50 px-6 py-4 rounded-xl border border-zinc-100">
                        <label className="flex items-center gap-2 cursor-pointer">
                           <input type="checkbox" checked={formData.principal} onChange={e => setFormData({ ...formData, principal: e.target.checked })} className="w-4 h-4 text-yellow-500 rounded border-zinc-300 focus:ring-yellow-500 accent-yellow-500" />
                           <span className="text-xs font-black uppercase text-zinc-700">Conta Principal</span>
                        </label>
                        <Select label="Estado" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as any })} options={[
                           { value: 'ativo', label: 'Ativa' },
                           { value: 'inativo', label: 'Inativa' }
                        ]} />
                     </div>
                  </div>

                  <div className="flex justify-end gap-4 pt-6 border-t border-zinc-100">
                     <button type="button" onClick={resetForm} className="px-6 py-3 font-black text-xs uppercase text-zinc-400 hover:text-zinc-900 transition-all">Cancelar</button>
                     <button type="submit" disabled={isSubmitting} className="px-8 py-3 bg-zinc-900 text-white font-black text-xs uppercase rounded-xl hover:bg-yellow-500 hover:text-zinc-900 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50">
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
                        <div key={conta.id} className={`p-6 rounded-3xl border shadow-sm relative group transition-all ${conta.status === 'inativo' ? 'bg-zinc-100 border-zinc-200 grayscale opacity-70' : (conta.principal ? 'bg-zinc-900 text-white border-zinc-900 shadow-xl' : 'bg-white border-sky-100 hover:shadow-lg')}`}>
                           {conta.principal && <div className="absolute -top-3 -right-3 bg-yellow-500 text-zinc-900 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg flex items-center gap-1"><CheckCircle2 size={12} /> Principal</div>}

                           <div className="flex justify-between items-start mb-6">
                              <div>
                                 <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${conta.principal ? 'text-zinc-400' : 'text-zinc-400'}`}>{conta.tipo_conta} - {conta.moeda}</p>
                                 <h4 className={`text-xl font-black ${conta.principal ? 'text-white' : 'text-zinc-900'}`}>{conta.nome_banco}</h4>
                              </div>
                              <div className={`p-2 rounded-xl ${conta.principal ? 'bg-white/10' : 'bg-zinc-50'}`}>
                                 <Building size={24} className={conta.principal ? 'text-yellow-500' : 'text-sky-600'} />
                              </div>
                           </div>

                           <div className="space-y-4 mb-6">
                              <div className={`p-4 rounded-2xl font-mono text-sm tracking-widest text-center ${conta.principal ? 'bg-white/5 border border-white/10 text-yellow-500' : 'bg-zinc-50 border border-zinc-100 text-zinc-700'}`}>
                                 {conta.iban || 'S/ IBAN'}
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-xs">
                                 <div>
                                    <p className={`text-[9px] uppercase font-bold ${conta.principal ? 'text-zinc-500' : 'text-zinc-400'}`}>Nº Conta</p>
                                    <p className={`font-black ${conta.principal ? 'text-zinc-300' : 'text-zinc-700'}`}>{conta.numero_conta}</p>
                                 </div>
                                 {conta.titular_conta && (
                                    <div>
                                       <p className={`text-[9px] uppercase font-bold ${conta.principal ? 'text-zinc-500' : 'text-zinc-400'}`}>Titular Dif.</p>
                                       <p className={`font-black truncate ${conta.principal ? 'text-zinc-300' : 'text-zinc-700'}`} title={conta.titular_conta}>{conta.titular_conta}</p>
                                    </div>
                                 )}
                              </div>
                           </div>

                           {canEdit && (
                              <div className={`flex justify-end gap-2 pt-4 border-t ${conta.principal ? 'border-white/10' : 'border-zinc-100'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                                 {!conta.principal && conta.status === 'ativo' && (
                                    <button onClick={() => setAsPrincipal(conta.id)} className="px-3 py-1.5 bg-yellow-50 text-yellow-700 hover:bg-yellow-500 hover:text-zinc-900 text-[9px] font-black uppercase rounded-lg transition-all" title="Definir Principal">
                                       <CheckCircle2 size={14} />
                                    </button>
                                 )}
                                 <button onClick={() => openEditForm(conta)} className={`px-3 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all flex items-center gap-1 ${conta.principal ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-zinc-50 hover:bg-zinc-200 text-zinc-600'}`}>
                                    <Edit size={12} /> Editar
                                 </button>
                                 <button onClick={() => handleDelete(conta.id)} className={`px-3 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all flex items-center gap-1 ${conta.principal ? 'bg-red-500/20 hover:bg-red-500/40 text-red-400' : 'bg-red-50 hover:bg-red-500 hover:text-white text-red-500'}`}>
                                    <Trash2 size={12} />
                                 </button>
                              </div>
                           )}
                        </div>
                     ))}
                  </div>
               ) : (
                  <div className="bg-zinc-50 border border-dashed border-zinc-200 rounded-[3rem] p-12 text-center flex flex-col items-center">
                     <AlertCircle size={48} className="text-zinc-300 mb-4" />
                     <h4 className="text-lg font-black text-zinc-900 mb-2">Nenhuma conta registada</h4>
                     <p className="text-sm text-zinc-500 mb-6 max-w-sm">Este colaborador ainda não possui contas bancárias associadas no sistema. Os pagamentos seguirão o método tradicional.</p>
                     {canEdit && (
                        <button onClick={() => setShowForm(true)} className="px-6 py-3 bg-zinc-900 text-white font-black text-xs uppercase rounded-xl hover:bg-yellow-500 hover:text-zinc-900 transition-all">
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

// Componente helper para icone de Save interno
const SaveIcon = () => (
   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
);

export default BankAccountsTab;
