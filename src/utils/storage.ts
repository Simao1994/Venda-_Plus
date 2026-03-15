
import { supabase } from '../lib/supabase';

export const STORAGE_KEYS = {
  FUNCIONARIOS: 'amazing_hr_staff_v5',
  DEPARTAMENTOS: 'amazing_departamentos',
  PRESENCA: 'amazing_hr_attendance_v5',
  FERIAS: 'amazing_hr_vacations',
  RECIBOS: 'amazing_hr_paystubs_v5',
  PASSES: 'amazing_hr_service_passes',
  METAS: 'amazing_hr_performance_goals',
  LOGS: 'amazing_system_logs',
  USER: 'amazing_user',
  POSTS: 'amazing_posts',
  SOLICITACOES: 'amazing_solicitacoes',
  TESTEMUNHOS: 'amazing_testemunhos',
  FORNECEDORES: 'amazing_fornecedores',
  AFILIADAS: 'amazing_afiliadas',
  FINANCE_TRANSACTIONS: 'amazing_finance_hub_v1',
  CORPORATE_INFO: 'amazing_corporate_info',
  INVENTARIO: 'amazing_inventario',
  MOTOQUEIROS: 'amazing_motoqueiros',
  MANUTENCAO: 'amazing_manutencao',
  NOTAS: 'amazing_notas',
  GRUPOS: 'amazing_grupos_frota',
  MOVIMENTACOES: 'amazing_movimentacoes',
  BLOG: 'amazing_blog',
  PARCEIROS: 'amazing_parceiros_extra',
  LANCAMENTOS: 'amazing_lancamentos_contabeis',
  FOLHA_PAGAMENTO: 'amazing_folhas_pagamento',
  FISCAL_TASKS: 'amazing_tarefas_fiscais',
  AGRICULTORES: 'amazing_agro_farmers',
  FINANCIAMENTOS_AGRO: 'amazing_agro_loans',
  VISITAS_AGRO: 'amazing_agro_visits',
  COLHEITAS: 'amazing_agro_harvests',
  CULTIVOS: 'amazing_agro_crops_list',
  IMOVEIS: 'amazing_real_estate_properties',
  CONTRATOS_IMOVEIS: 'amazing_real_estate_contracts',
  OBRAS_IMOVEIS: 'amazing_real_estate_projects',
  CHAT_MESSAGES: 'amazing_chat_messages',
  INTERNAL_ADS: 'amazing_internal_ads',
  CANDIDATURAS: 'amazing_candidaturas_v1',
  // Arena Games Keys
  ARENA_GAMES: 'amazing_arena_games_v1',
  ARENA_PAYMENTS: 'amazing_arena_payments_v1',
  ARENA_SESSIONS: 'amazing_arena_sessions_v1',
  // Fix: Added missing Arena keys used in pages
  ARENA_TOURNAMENTS: 'amazing_arena_tournaments_v1',
  ARENA_RANKING: 'amazing_arena_ranking_v1',
  // Accounting & ERP Keys
  ACC_EMPRESAS: 'amazing_acc_companies',
  ACC_CONTAS: 'amazing_acc_accounts',
  ACC_PERIODOS: 'amazing_acc_periods',
  ACC_LANCAMENTOS: 'amazing_acc_ledger',
  ACC_LANCAMENTO_ITENS: 'amazing_acc_ledger_items',
  ACC_FOLHAS: 'amazing_acc_payroll',
  ACC_OBRIGACOES: 'amazing_acc_fiscal_tasks',
  ACC_CONFIG: 'amazing_acc_config',
  ACC_CENTROS: 'amazing_acc_cost_centers',
  ACC_CATEGORIAS: 'amazing_acc_inventory_categories',
  ACC_CONTACTOS: 'amazing_acc_contacts',
  ERP_EMPRESAS: 'amazing_erp_entities_general'
};

export interface SystemLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  module: string;
  details: string;
  type: 'info' | 'warning' | 'error';
}

export const AmazingStorage = {
  save: (key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      AmazingStorage.syncToCloud(key, data);
      return true;
    } catch (error) {
      return false;
    }
  },

  get: <T>(key: string, fallback: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch (error) {
      return fallback;
    }
  },

  syncToCloud: async (key: string, data: any) => {
    try {
      // FAST-PATH: Use localStorage directly for session detection
      const hasSession = !!localStorage.getItem('supabase.auth.token') ||
        !!localStorage.getItem('sb-jgktemwegesmmomlftgt-auth-token');
      if (!hasSession) return;

      await supabase
        .from('erp_data')
        .upsert({
          key_name: key,
          json_data: data,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key_name' });
    } catch (err) { }
  },

  lastLoadAll: 0,
  loadAllFromCloud: async (force = false) => {
    const now = Date.now();
    // Cooldown: only sync everything once every 10 minutes unless forced
    if (!force && now - AmazingStorage.lastLoadAll < 10 * 60 * 1000) {
      console.log('Skipping cloud sync (cooldown active)');
      return true;
    }

    try {
      const fetchPromise = supabase.from('erp_data').select('key_name, json_data');
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Cloud load timeout')), 10000)
      );

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;
      if (error) throw error;
      if (data) {
        // Batch update localStorage
        data.forEach((row: any) => {
          localStorage.setItem(row.key_name, JSON.stringify(row.json_data));
        });
        AmazingStorage.lastLoadAll = now;
      }
      return true;
    } catch (err) {
      console.error('Cloud load error:', err);
      return false;
    }
  },

  loadKeyFromCloud: async (key: string) => {
    try {
      const { data, error } = await supabase
        .from('erp_data')
        .select('json_data')
        .eq('key_name', key)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows found"
      if (data?.json_data) {
        localStorage.setItem(key, JSON.stringify(data.json_data));
        return data.json_data;
      }
      return null;
    } catch (err) {
      console.error(`Error loading key ${key} from cloud:`, err);
      return null;
    }
  },

  loadSpecificKeys: async (keys: string[]) => {
    try {
      // Return local cache immediately if it exists to unblock UI
      const results: Record<string, any> = {};
      keys.forEach(k => {
        const val = localStorage.getItem(k);
        if (val) results[k] = JSON.parse(val);
      });

      // Background fetch to update cache
      const { data, error } = await supabase
        .from('erp_data')
        .select('*')
        .in('key_name', keys);

      if (!error && data) {
        data.forEach((row: any) => {
          localStorage.setItem(row.key_name, JSON.stringify(row.json_data));
        });
      }
      return true;
    } catch (err) {
      console.error('Error loading specific keys:', err);
      return false;
    }
  },

  logAction: async (action: string, module: string, details: string, type: SystemLog['type'] = 'info') => {
    const user = AmazingStorage.get<any>(STORAGE_KEYS.USER, { nome: 'Sistema' });
    try {
      // Guard: only log if there is an active authenticated session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      await supabase.from('sys_logs').insert([{
        user_name: user.nome,
        action,
        module,
        details,
        type
      }]);
    } catch (err) {
      console.error('Audit Log Error:', err);
    }
  },

  saveSolicitacaoDirect: async (solicitacao: any) => {
    try {
      const { error } = await supabase.from('solicitacoes').insert([solicitacao]);
      return !error;
    } catch { return false; }
  }
};
