import "dotenv/config";
import express from "express";

import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { supabase } from "./src/lib/supabase.ts";
import { syncDatabaseSchema } from "./src/lib/database-sync.ts";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-erp-key";
import { runMigration } from "./src/lib/migrations-manager.ts";
import crypto from "crypto";
import { onInvoiceCreated } from "./agt_webservice_integration/index.ts";
import { registerSaftRoutes } from "./saft_ao/index.ts";
import { prepareSigningData, signAGTDocument, getHashControl } from "./src/lib/agt_rsa.ts";

// --- HELPERS ---
// AGT Hash Generation: Number|Date|Total|CompanyNIF
const prepareHashString = (invoiceNo: string, date: string, total: number, nif: string) => {
  // Total must be formatted with 2 decimal places and dot separator
  const formattedTotal = Number(total || 0).toFixed(2);
  return `${invoiceNo}|${date}|${formattedTotal}|${nif}`;
};

// Fallback legacy SHA256 (for non-certified or pro-forma if desired, but RSA is now standard)
const generateHash = (data: string, prevHash: string = '') => {
  return crypto.createHash('sha256').update(data + prevHash).digest('base64');
};

/**
 * AGT Compliance: RSA 2048 Signing
 * Fetches company private key and signs the document data.
 */
/**
 * AGT Compliance: RSA 2048 Signing
 * signs the document data using the provided private key.
 */
function signDocumentRSA(privateKey: string | null, date: string, sysDate: string, docNo: string, total: number, prevHash: string) {
  try {
    if (privateKey) {
      const signingData = prepareSigningData(date, sysDate, docNo, total, prevHash);
      return signAGTDocument(signingData, privateKey);
    }

    // Fallback if no RSA key is provided
    console.warn(`[AGT] AVISO: Chave RSA não fornecida para documento ${docNo}. Usando SHA256 fallback.`);
    return generateHash(prepareHashString(docNo, date, total, ''), prevHash);
  } catch (err: any) {
    console.error(`[AGT] Erro crítico ao assinar documento RSA:`, err.message);
    return generateHash(prepareHashString(docNo, date, total, ''), prevHash);
  }
}


const escapeXml = (unsafe: string) => {
  if (!unsafe) return '';
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
};

// Note: Database schema initialization is now handled via supabase_schema.sql
// which should be run in the Supabase Dashboard SQL Editor.

// --- AGT IMMUTABILITY GUARD ---
// Mandatory Rule: Documents (Sales, Payments, Invoices) CANNOT be deleted or edited after issuance.
// To reverse a document, a "Nota de Crédito" (NC) must be issued instead of modifying original data.
const blockMutation = (req: any, res: any, next: any) => {
  if (['PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return res.status(403).json({ error: "AGT Compliance: Documents are immutable and cannot be deleted or edited." });
  }
  next();
};

/**
 * AGT Compliance: Mandatory Phrases
 * Fetches the certification number and builds the required legal phrase.
 */
async function getAgtCertPhrase(companyId: number, docType: string) {
  try {
    const { data: config } = await supabase
      .from('agt_configs')
      .select('cert_number')
      .eq('company_id', companyId)
      .maybeSingle();

    const certNo = config?.cert_number || '0000/AGT/2026';
    const verb = (docType === 'RE' || docType === 'RECIBO') ? 'Emitido' : 'Processado';
    return `${verb} por programa validado n.º ${certNo}/AGT`;
  } catch {
    return `Processado por programa validado n.º 0000/AGT/2026`;
  }
}

/**
 * AGT Compliance: NIF Validation (Angola)
 * NIF must be exactly 9 digits for individuals/companies, 
 * or "Consumidor Final" for generic sales.
 */
function isValidNif(nif: string | null | undefined): boolean {
  if (!nif || nif.toLowerCase() === 'consumidor final') return true;
  const digitsOnly = nif.replace(/\D/g, '');
  return digitsOnly.length === 9;
}

async function startServer() {


  console.log('🚀 Server starting...');

  // 0. Key Validation
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (anonKey && serviceKey && anonKey === serviceKey) {
    console.error('⚠️ [CRÍTICO] SUPABASE_SERVICE_ROLE_KEY é igual à ANON_KEY!');
    console.error('⚠️ As operações administrativas do servidor serão bloqueadas pelo RLS.');
    console.error('⚠️ Por favor, obtenha a "service_role" key correta no Dashboard do Supabase.');
  }

  // Sync database schema on startup (NON-BLOCKING)
  syncDatabaseSchema().then(async () => {
    console.log('✅ Database Schema Sync Complete');
    console.log('✅ Base migrations checked.');
  }).catch(err => {
    console.error('❌ Database Schema Sync Failed:', err.message);
  });

  // Diagnostic & Repair: Ensure all companies have a branch and users are associated
  try {
    const { data: companies } = await supabase.from('companies').select('id, name');
    if (companies) {
      for (const company of companies) {
        const { data: branches } = await supabase.from('branches').select('id').eq('company_id', company.id);
        let defaultBranchId: number;

        if (!branches || branches.length === 0) {
          console.log(`🔧 Repair: Creating default branch for company ${company.name}`);
          const { data: newBranch } = await supabase.from('branches').insert({
            company_id: company.id,
            name: 'Sede Central'
          }).select('id').single();
          defaultBranchId = newBranch?.id;
        } else {
          defaultBranchId = branches[0].id;
        }

        // Fix users without branch_id
        if (defaultBranchId) {
          await supabase.from('users').update({ branch_id: defaultBranchId }).eq('company_id', company.id).is('branch_id', null);
        }
      }
    }
  } catch (err: any) {
    console.error('❌ Data Repair Failed:', err.message);
  } finally {
    const { data: testCount } = await supabase.from('branches').select('count', { count: 'exact', head: true });
    console.log(`📊 Diagnostic: Total branches in DB: ${testCount || 0}`);
  }

  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // --- APPLY AGT IMMUTABILITY GUARDS ---
  app.use("/api/sales", blockMutation);
  app.use("/api/payments", blockMutation);
  app.use("/api/documents", blockMutation);
  app.use("/api/contabil_faturas", blockMutation);

  // Auth Middleware
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err: any) {
      console.error('❌ [AUTH] Token Inválido:', err.message);
      res.status(401).json({ error: "Invalid token" });
    }
  };
  // SaaS License Middleware
  const checkLicense = async (req: any, res: any, next: any) => {
    if (req.user.role === 'master') return next();

    const { data: subscription, error } = await supabase
      .from("saas_subscriptions")
      .select("*")
      .eq("company_id", req.user.company_id)
      .eq("status", "active")
      .single();

    if (error || !subscription) return res.status(403).json({ error: "Sua licença expirou ou está suspensa. Por favor, regularize seu plano." });

    const expiryDate = new Date(subscription.data_expiracao);
    if (expiryDate < new Date()) {
      // Update status to expired
      await supabase.from("saas_subscriptions").update({ status: 'expired' }).eq("id", subscription.id);
      return res.status(403).json({ error: "Licença expirada." });
    }

    req.subscription = subscription;
    next();
  };

  const checkFeature = (feature: string) => async (req: any, res: any, next: any) => {
    if (req.user.role === 'master') return next();

    const { data: subscription, error } = await supabase
      .from("saas_subscriptions")
      .select("*, saas_plans(features)")
      .eq("company_id", req.user.company_id)
      .eq("status", "active")
      .single();

    if (error || !subscription) return res.status(403).json({ error: "Plano inativo ou expirado." });

    const features = subscription.saas_plans?.features || [];
    if (!features.includes(feature)) {
      return res.status(403).json({ error: `O seu plano atual não inclui o módulo de ${feature}. Entre em contacto para fazer upgrade.` });
    }
    next();
  };

  // --- FILE MANAGEMENT ---
  app.get("/api/files", authenticate, async (req: any, res) => {
    const { data: files, error } = await supabase
      .from("company_files")
      .select("*")
      .eq("company_id", req.user.company_id)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json(files || []);
  });

  app.post("/api/files", authenticate, async (req: any, res) => {
    const { name, file_path, file_url, file_type, category, size_bytes } = req.body;

    const { data: file, error } = await supabase
      .from("company_files")
      .insert([{
        company_id: req.user.company_id,
        name,
        file_path,
        file_url,
        file_type,
        category,
        size_bytes: size_bytes || 0,
        uploaded_by: req.user.id
      }])
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json(file);
  });

  app.delete("/api/files/:id", authenticate, async (req: any, res) => {
    const { id } = req.params;

    // Safety check: ensure file belongs to the company
    const { data: file, error: checkError } = await supabase
      .from("company_files")
      .select("company_id")
      .eq("id", id)
      .single();

    if (checkError || !file) return res.status(404).json({ error: "Ficheiro não encontrado." });
    if (file.company_id !== req.user.company_id && req.user.role !== 'master') {
      return res.status(403).json({ error: "Acesso negado a este ficheiro." });
    }

    const { error: deleteError } = await supabase
      .from("company_files")
      .delete()
      .eq("id", id);

    if (deleteError) return res.status(500).json({ error: deleteError.message });
    res.json({ success: true });
  });

  const isMaster = (req: any, res: any, next: any) => {
    if (req.user.role !== 'master') return res.status(403).json({ error: "Acesso reservado ao administrador do sistema (Master)." });
    next();
  };

  const isAdmin = (req: any, res: any, next: any) => {
    if (req.user.role !== 'admin' && req.user.role !== 'master') {
      return res.status(403).json({ error: "Acesso negado. Apenas administradores podem realizar esta ação." });
    }
    next();
  };

  // Generic Data Validator
  const validateBody = (fields: string[]) => (req: any, res: any, next: any) => {
    for (const field of fields) {
      if (req.body[field] === undefined || req.body[field] === null || (typeof req.body[field] === 'string' && req.body[field].trim() === '')) {
        return res.status(400).json({ error: `O campo '${field}' é obrigatório.` });
      }
    }
    next();
  };

  // Activity Logger Helper
  const logActivity = async (req: any, action: string, resource: string, description: string, metadata: any = {}) => {
    try {
      const companyId = req.user?.company_id;
      const userId = req.user?.id;
      const userName = req.user?.name || 'Sistema';
      const ip = req.ip || req.headers['x-forwarded-for'] || '';

      await supabase.from('activity_logs').insert({
        company_id: companyId,
        user_id: userId,
        user_name: userName,
        action,
        resource,
        description,
        metadata,
        ip_address: ip
      });
    } catch (err) {
      console.error('❌ Failed to log activity:', err);
    }
  };

  // Activity Logs Route
  app.get("/api/activity-logs", authenticate, async (req: any, res: any) => {
    try {
      const { data: logs, error } = await supabase
        .from("activity_logs")
        .select("*")
        .eq("company_id", req.user.company_id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      res.json(logs || []);
    } catch (err: any) {
      console.error('❌ Failed to fetch activity logs:', err);
      res.status(500).json({ error: "Erro ao carregar logs de atividade." });
    }
  });

  // Reports Route (Sales by Employee)
  app.get("/api/reports/sales-by-employee", authenticate, async (req: any, res: any) => {
    try {
      if (!['master', 'admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({ error: "Acesso negado." });
      }

      const { startDate, endDate } = req.query;

      let query = supabase
        .from('sales')
        .select(`
          id, total, tax, created_at,
          user_id,
          users ( name )
        `)
        .eq('company_id', req.user.company_id)
        .eq('status', 'paid');

      if (startDate) query = query.gte('created_at', startDate);
      if (endDate) query = query.lte('created_at', endDate);

      const { data: sales, error } = await query;
      if (error) throw error;

      const aggregated: Record<number, any> = {};

      (sales || []).forEach((sale: any) => {
        const uid = sale.user_id;
        if (!uid) return;

        if (!aggregated[uid]) {
          aggregated[uid] = {
            funcionario_id: uid,
            nome_funcionario: sale.users?.name || 'Desconhecido',
            numero_vendas: 0,
            total_vendido: 0,
            iva_gerado: 0,
            media_por_venda: 0
          };
        }

        aggregated[uid].numero_vendas += 1;
        aggregated[uid].total_vendido += Number(sale.total) || 0;
        aggregated[uid].iva_gerado += Number(sale.tax) || 0;
      });

      const result = Object.values(aggregated).map((item: any) => {
        item.media_por_venda = item.numero_vendas > 0 ? (item.total_vendido / item.numero_vendas) : 0;
        return item;
      });

      result.sort((a: any, b: any) => b.total_vendido - a.total_vendido);

      res.json(result);
    } catch (err: any) {
      console.error('❌ Failed to fetch employee sales report:', err);
      res.status(500).json({ error: "Erro ao gerar relatório." });
    }
  });

  // --- AI Audit Route ---
  app.post("/api/ai/audit", authenticate, async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY não configurada no servidor." });
      }

      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt não fornecido." });
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (!response.ok) {
        const errData = await response.text();
        console.error("Gemini API Error:", errData);
        throw new Error("Falha na API da IA");
      }

      const data = await response.json();
      const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sem resposta da IA.";

      res.json({ result: textResult });
    } catch (err: any) {
      console.error('❌ Error processing AI audit:', err);
      res.status(500).json({ error: "Erro ao processar auditoria da Venda Plus." });
    }
  });

  // Auth Routes
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const { data: user, error } = await supabase
      .from("users")
      .select("*, companies(name, currency, imagem_home, nif, email, phone, address, regime_iva)")
      .eq("email", email)
      .single();

    if (error) {
      console.error('❌ Erro na consulta de login (Supabase):', error.message);
      return res.status(401).json({ error: "Credenciais inválidas (Erro de Ligação)" });
    }
    // 1. Check if account is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const waitMinutes = Math.ceil((new Date(user.locked_until).getTime() - new Date().getTime()) / 60000);
      return res.status(403).json({
        error: `Conta temporariamente bloqueada por excesso de tentativas. Tente novamente em ${waitMinutes} minutos.`
      });
    }

    const matches = bcrypt.compareSync(password, user.password);

    if (!matches) {
      console.error(`❌ Senha incorreta para: ${email}`);
      const newAttempts = (user.failed_attempts || 0) + 1;
      let updatePayload: any = { failed_attempts: newAttempts };

      if (newAttempts >= 5) {
        updatePayload.locked_until = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 mins
        console.warn(`[AUTH] Conta ${email} bloqueada por 30 minutos.`);
      }

      await supabase.from("users").update(updatePayload).eq("id", user.id);

      return res.status(401).json({
        error: "Credenciais inválidas. Tentativa " + newAttempts + "/5."
      });
    }

    // 2. Success: Reset failed attempts
    await supabase.from("users").update({ failed_attempts: 0, locked_until: null }).eq("id", user.id);

    // 3. Check for Password Expiration (90 days)
    const ninetyDays = 90 * 24 * 60 * 60 * 1000;
    const lastUpdate = user.password_updated_at ? new Date(user.password_updated_at).getTime() : 0;
    const isExpired = (Date.now() - lastUpdate) > ninetyDays;
    const mustChange = !!user.must_change_password || isExpired;

    console.log(`✅ Login bem-sucedido: ${email}${mustChange ? ' (Senha Expirada/Forçada)' : ''}`);


    // Log login activity
    await logActivity({ user, ip: req.ip }, 'LOGIN', 'AUTH', `Utilizador ${email} iniciou sessão.`);

    // @ts-ignore
    const companies = user.companies;
    const token = jwt.sign({
      id: user.id,
      company_id: user.company_id,
      branch_id: user.branch_id,
      role: user.role,
      must_change_password: mustChange
    }, JWT_SECRET);

    res.json({
      token,
      must_change_password: mustChange,
      user: {

        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        company_id: user.company_id,
        company_name: companies?.name,
        currency: companies?.currency,
        company_home_image: companies?.imagem_home,
        nif: companies?.nif,
        company_email: companies?.email,
        phone: companies?.phone,
        address: companies?.address,
        regime_iva: companies?.regime_iva,
        branch_id: user.branch_id,
        is_master: user.role === 'master'
      }
    });
  });

  app.post("/api/auth/token-login", async (req, res) => {
    const { token: accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({ error: "Token de acesso é obrigatório." });
    }

    try {
      // 1. Find company by access_token
      const { data: company, error: cError } = await supabase
        .from("companies")
        .select("id, name, currency, imagem_home, nif, email, phone, address, regime_iva")
        .eq("access_token", accessToken)
        .single();

      if (cError || !company) {
        return res.status(401).json({ error: "Link de acesso inválido ou expirado." });
      }

      // 2. Find the primary admin for this company
      const { data: user, error: uError } = await supabase
        .from("users")
        .select("*")
        .eq("company_id", company.id)
        .eq("role", "admin")
        .order('id', { ascending: true })
        .limit(1)
        .single();

      if (uError || !user) {
        return res.status(404).json({ error: "Administrador não encontrado para esta empresa." });
      }

      // 3. Generate normal session token
      const sessionToken = jwt.sign({
        id: user.id,
        company_id: user.company_id,
        branch_id: user.branch_id,
        role: user.role
      }, JWT_SECRET);

      console.log(`✅ Token login bem-sucedido para empresa: ${company.name}`);

      res.json({
        token: sessionToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          company_id: user.company_id,
          company_name: company.name,
          currency: company.currency,
          company_home_image: company.imagem_home,
          nif: company.nif,
          company_email: company.email,
          phone: company.phone,
          address: company.address,
          regime_iva: company.regime_iva,
          branch_id: user.branch_id,
          is_master: user.role === 'master'
        }
      });
    } catch (err: any) {
      console.error('❌ Erro no login por token:', err.message);
      res.status(500).json({ error: "Erro interno no servidor." });
    }
  });

  // SaaS Public Routes
  app.get("/api/saas/plans", async (req, res) => {
    const { data, error } = await supabase.from("saas_plans").select("*");
    res.json(data || []);
  });

  app.post("/api/saas/register", async (req, res) => {
    const { name, email, password, plan_id, tipo_plano, status } = req.body;
    const initialStatus = status === 'active' ? 'active' : 'pending';
    const subStatus = status === 'active' ? 'active' : 'suspended';

    console.log(`[Registo SaaS] Iniciando para: ${email} (${name})`);

    try {
      // 1. Create Company
      const accessToken = crypto.randomBytes(24).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      const { data: company, error: cError } = await supabase
        .from("companies")
        .insert([{
          name,
          email,
          status: initialStatus,
          access_token: accessToken
        }])
        .select("id, access_token")
        .single();
      if (cError) {
        console.error('❌ Erro ao criar empresa:', cError.message);
        return res.status(500).json({ error: `Erro na empresa: ${cError.message}` });
      }

      // 2. Create Default Branch
      const { data: branch, error: bError } = await supabase.from("branches").insert([{
        company_id: company.id,
        name: "Sede Central"
      }]).select("id").single();

      if (bError) {
        console.error('❌ Erro ao criar filial padrão:', bError.message);
        await supabase.from("companies").delete().eq("id", company.id);
        return res.status(500).json({ error: `Erro na filial: ${bError.message}` });
      }

      // 3. Create User (Admin)
      const hashedPassword = bcrypt.hashSync(password, 10);
      const { data: user, error: uError } = await supabase.from("users").insert([{
        company_id: company.id,
        branch_id: branch.id,
        name: "Administrador",
        email,
        password: hashedPassword,
        role: 'admin'
      }]).select("id").single();

      if (uError) {
        console.error('❌ Erro ao criar utilizador admin:', uError.message);
        // Clean up company and branch if user creation fails
        await supabase.from("branches").delete().eq("id", branch.id);
        await supabase.from("companies").delete().eq("id", company.id);
        return res.status(500).json({ error: `Erro no utilizador: ${uError.message}` });
      }

      // 3. Create initial pending subscription
      console.log(`[Registo SaaS] Buscando plano: ${plan_id}`);
      const { data: plan, error: pError } = await supabase.from("saas_plans").select("duration_months, price_monthly, price_semestrial, price_yearly").eq("id", plan_id).single();

      if (pError || !plan) {
        console.error('❌ Plano não encontrado:', plan_id, pError?.message);
        return res.status(400).json({ error: "Plano selecionado não é válido." });
      }

      const planDuration = plan.duration_months || 1;
      const months = tipo_plano === 'anual' ? 12 : (tipo_plano === 'semestrial' ? 6 : planDuration);

      const expiry = new Date();
      expiry.setMonth(expiry.getMonth() + months);

      const valor = tipo_plano === 'anual' ? plan.price_yearly : (tipo_plano === 'semestrial' ? plan.price_semestrial : plan.price_monthly);

      const { error: sError } = await supabase.from("saas_subscriptions").insert([{
        company_id: company.id,
        plan_id,
        tipo_plano,
        data_expiracao: expiry.toISOString(),
        valor_pago: valor,
        status: subStatus
      }]);

      if (sError) {
        console.error('❌ Erro ao criar subscrição:', sError.message);
        return res.status(500).json({ error: `Erro na subscrição: ${sError.message}` });
      }

      console.log(`✅ Registo SaaS concluído com sucesso para: ${email}`);
      res.json({
        success: true,
        company_id: company.id,
        access_token: company.access_token
      });
    } catch (err: any) {
      console.error('❌ Erro inesperado no registo:', err.message);
      res.status(500).json({ error: "Erro interno do servidor durante o registo." });
    }
  });

  // Master Admin Area
  app.get("/api/saas/master/stats", authenticate, isMaster, async (req, res) => {
    const { count: companiesCount } = await supabase.from("companies").select("*", { count: 'exact', head: true });
    const { data: activeSubs } = await supabase.from("saas_subscriptions").select("valor_pago").eq("status", "active");
    const { count: pendingPayments } = await supabase.from("saas_payments").select("*", { count: 'exact', head: true }).eq("status", "pending");

    const mrr = activeSubs?.reduce((sum, s) => sum + (s.valor_pago || 0), 0) || 0;

    res.json({
      totalCompanies: companiesCount,
      mrr,
      pendingPayments: pendingPayments || 0
    });
  });

  app.get("/api/saas/master/companies", authenticate, isMaster, async (req, res) => {
    const { data, error } = await supabase
      .from("companies")
      .select(`
        *,
        saas_subscriptions (
          *,
          saas_plans (
            name,
            duration_months,
            user_limit
          )
        )
      `)
      .order('created_at', { ascending: false });
    res.json(data || []);
  });

  app.post("/api/saas/master/approve-subscription", authenticate, isMaster, async (req, res) => {
    const { company_id } = req.body;
    await supabase.from("companies").update({ status: 'active' }).eq("id", company_id);
    await supabase.from("saas_subscriptions").update({ status: 'active' }).eq("company_id", company_id);
    res.json({ success: true });
  });

  app.post("/api/saas/master/execute-sql", authenticate, isMaster, async (req: any, res) => {
    const { sql, name } = req.body;
    console.log(`📋 [Master SQL] Executando bloco: ${name || 'Manual'} por ${req.user.email}`);

    try {
      if (name) {
        // Run as a tracked migration
        await runMigration(name, sql);
        res.json({ success: true, message: `Migração ${name} executada ou já existente.` });
      } else {
        // Direct execution
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
        if (error) throw error;
        res.json({ success: true, data });
      }
    } catch (err: any) {
      console.error('❌ Erro no Master SQL:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/saas/master/companies/:id/subscription", authenticate, isMaster, async (req, res) => {
    const { id } = req.params;
    const { plan_id, data_expiracao, status, valor_pago, tipo_plano } = req.body;

    const { error } = await supabase
      .from("saas_subscriptions")
      .update({
        plan_id,
        data_expiracao,
        status,
        valor_pago,
        tipo_plano
      })
      .eq("company_id", id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  app.post("/api/saas/master/companies/:id/status", authenticate, isMaster, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const { error } = await supabase
      .from("companies")
      .update({ status })
      .eq("id", id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });


  // System State & Export
  app.get("/api/system/state", authenticate, async (req: any, res) => {
    try {
      const isMaster = req.user.role === 'master';

      // 1. Get stats and user count in a single RPC call (Highly Optimized)
      const { data: statsData, error: statsError } = await supabase.rpc('get_system_stats', {
        p_company_id: req.user.company_id,
        p_is_master: isMaster
      });

      if (statsError) throw statsError;

      const results = statsData as any || { table_stats: {}, total_tables: 0, current_users: 0 };

      // 2. User Limit (Subscription based)
      let userLimit = 1;
      if (!isMaster) {
        const { data: subscription } = await supabase
          .from("saas_subscriptions")
          .select("*, saas_plans(user_limit)")
          .eq("company_id", req.user.company_id)
          .eq("status", "active")
          .single();
        userLimit = subscription?.saas_plans?.user_limit || 1;
      }

      res.json({
        db_status: 'Online',
        system_status: 'Operacional',
        current_users: results.current_users || 0,
        user_limit: isMaster ? 'Ilimitado (Master)' : userLimit,
        total_tables: results.total_tables,
        table_stats: results.table_stats,
        is_master_mode: isMaster
      });
    } catch (err: any) {
      console.error('❌ Erro no diagnóstico:', err.message);
      res.json({
        db_status: 'Offline',
        system_status: 'Erro de Ligação',
        current_users: 0,
        total_tables: 0,
        table_stats: {},
        error: err.message
      });
    }
  });

  app.get("/api/system/export", authenticate, async (req: any, res) => {
    const tables = ['products', 'customers', 'sales', 'sale_items', 'expenses', 'users', 'medicamentos', 'categories', 'suppliers'];
    const dump: any = { timestamp: new Date(), company_id: req.user.company_id };

    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('company_id', req.user.company_id);

      if (!error) dump[table] = data;
    }

    res.json(dump);
  });

  // Backup Management (AGT Compliance)
  app.get("/api/system/backups", authenticate, isAdmin, async (req: any, res) => {
    const { data: backups, error } = await supabase
      .from("backup_logs")
      .select("*")
      .or(`company_id.eq.${req.user.company_id},company_id.is.null`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) return res.status(500).json({ error: error.message });
    res.json(backups || []);
  });

  app.post("/api/system/backups", authenticate, isAdmin, async (req: any, res) => {
    const { backup_type, file_name, file_size_bytes } = req.body;

    const { data, error } = await supabase
      .from("backup_logs")
      .insert([{
        company_id: req.user.company_id,
        backup_type: backup_type || 'manual',
        status: 'success',
        file_name: file_name || `manual_backup_${Date.now()}.sql`,
        file_size_bytes: file_size_bytes || 0,
        storage_provider: 'Supabase Managed'
      }])
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    // Log activity
    await logActivity(req, 'BACKUP', 'SYSTEM', `Cópia de segurança registada: ${file_name}`, { backup_type });

    res.json(data);
  });


  // User Management
  app.post("/api/auth/change-password", authenticate, async (req: any, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: "A nova senha deve ter pelo menos 8 caracteres." });
    }

    // Complexity check: Upper, Lower, Digital
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);

    if (!hasUpper || !hasLower || !hasNumber) {
      return res.status(400).json({
        error: "A senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número."
      });
    }

    try {
      // 1. Fetch current user
      const { data: user, error } = await supabase
        .from("users")
        .select("password")
        .eq("id", req.user.id)
        .single();

      if (error || !user) return res.status(404).json({ error: "Utilizador não encontrado." });

      // 2. Verify old password
      const matches = bcrypt.compareSync(oldPassword, user.password);
      if (!matches) return res.status(401).json({ error: "A senha actual está incorrecta." });

      // 3. Update password
      const hashedPassword = bcrypt.hashSync(newPassword, 10);
      const { error: updateError } = await supabase
        .from("users")
        .update({
          password: hashedPassword,
          password_updated_at: new Date().toISOString(),
          must_change_password: false
        })
        .eq("id", req.user.id);

      if (updateError) throw updateError;

      // Log activity
      await logActivity(req, 'UPDATE', 'AUTH', `Utilizador ${req.user.email} alterou a própria password.`);

      res.json({ success: true, message: "Senha alterada com sucesso." });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/users", authenticate, isAdmin, async (req: any, res) => {

    const { data: users, error } = await supabase
      .from("users")
      .select("id, name, email, role, created_at")
      .eq("company_id", req.user.company_id);

    if (error) return res.status(500).json({ error: error.message });
    res.json(users || []);
  });

  app.post("/api/users", authenticate, isAdmin, validateBody(['name', 'email', 'password', 'role']), async (req: any, res) => {
    const { name, email, password, role } = req.body;

    // Only master can create master users
    if (role === 'master' && req.user.role !== 'master') {
      return res.status(403).json({ error: "Apenas um administrador master pode criar outros administradores master." });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const { data, error } = await supabase
      .from("users")
      .insert([{
        company_id: req.user.company_id,
        name,
        email,
        password: hashedPassword,
        role
      }])
      .select("id, name, email, role")
      .single();

    if (error) return res.status(500).json({ error: error.message });

    // Log user creation
    await logActivity(req, 'CREATE', 'USER', `Utilizador ${name} (${email}) criado com perfil ${role}.`, { email, role });

    res.json(data);
  });

  app.delete("/api/users/:id", authenticate, isAdmin, async (req: any, res) => {
    // Prevent self-deletion
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: "Você não pode apagar sua própria conta." });
    }

    const { error } = await supabase
      .from("users")
      .delete()
      .eq("id", req.params.id)
      .eq("company_id", req.user.company_id); // Security: ensure it's the same company

    if (error) return res.status(500).json({ error: error.message });

    // Log user deletion
    await logActivity(req, 'DELETE', 'USER', `Utilizador ID ${req.params.id} removido.`, { user_id: req.params.id });

    res.json({ success: true });
  });

  // Companies
  app.get("/api/company/profile", authenticate, async (req: any, res) => {
    const { data: company, error } = await supabase
      .from("companies")
      .select("*")
      .eq("id", req.user.company_id)
      .single();
    res.json(company);
  });

  app.get("/api/company/subscription", authenticate, async (req: any, res) => {
    const { data: subscription, error } = await supabase
      .from("saas_subscriptions")
      .select("*, saas_plans(*)")
      .eq("company_id", req.user.company_id)
      .eq("status", "active")
      .single();

    if (error || !subscription) return res.status(404).json({ error: "Nenhuma assinatura ativa encontrada." });
    res.json(subscription);
  });

  app.put("/api/company/profile", authenticate, async (req: any, res) => {
    if (!['admin', 'master', 'manager'].includes(req.user.role)) return res.status(403).json({ error: "Acesso negado" });
    const { 
      name, nif, address, phone, email, tax_percentage, currency, logo, role_permissions, imagem_home,
      bio_nome, bio_foto, bio_formacao, bio_profissao, bio_competencias, bio_contactos, bio_emails, bio_resumo, bio_publicado
    } = req.body;

    console.log(`[Settings API] Updating company ID: ${req.user.company_id} | Name: ${name} | Published: ${bio_publicado}`);

    const { data: updatedCompany, error } = await supabase
      .from("companies")
      .update({ 
        name, nif, address, phone, email, tax_percentage, currency, logo, role_permissions, imagem_home, 
        bio_nome, bio_foto, bio_formacao, bio_profissao, bio_competencias, bio_contactos, bio_emails, bio_resumo, bio_publicado
      })
      .eq("id", req.user.company_id)
      .select()
      .single();

    if (error) {
      console.error("[Settings API] Erro Supabase ao atualizar empresa:", error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log(`[Settings API] Success! Updated ID ${req.user.company_id}. New Bio Nome: ${updatedCompany?.bio_nome}`);
    res.json(updatedCompany);
  });

  // Suppliers
  app.get("/api/suppliers", authenticate, async (req: any, res) => {
    const { data: suppliers, error } = await supabase
      .from("suppliers")
      .select("*")
      .eq("company_id", req.user.company_id);
    res.json(suppliers || []);
  });

  app.post("/api/suppliers", authenticate, isAdmin, async (req: any, res) => {
    const { name, phone, email, address } = req.body;
    const { data, error } = await supabase
      .from("suppliers")
      .insert([{ company_id: req.user.company_id, name, phone, email, address }])
      .select("id")
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ id: data.id });
  });

  app.put("/api/suppliers/:id", authenticate, isAdmin, async (req: any, res) => {
    const { name, phone, email, address } = req.body;
    const { error } = await supabase
      .from("suppliers")
      .update({ name, phone, email, address })
      .eq("id", req.params.id)
      .eq("company_id", req.user.company_id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  app.delete("/api/suppliers/:id", authenticate, isAdmin, async (req: any, res) => {
    const { error } = await supabase
      .from("suppliers")
      .delete()
      .eq("id", req.params.id)
      .eq("company_id", req.user.company_id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  // Products
  app.get("/api/products", authenticate, async (req: any, res) => {
    const { data: products, error } = await supabase
      .from("products")
      .select("*, categories(name)")
      .eq("company_id", req.user.company_id);

    // Map categories.name to category_name for frontend compatibility
    const formattedProducts = products?.map((p: any) => ({
      ...p,
      category_name: p.categories?.name
    }));

    res.json(formattedProducts || []);
  });

  app.post("/api/products", authenticate, isAdmin, validateBody(['name', 'sale_price']), async (req: any, res) => {
    const { name, barcode, category_id, supplier_id, unit, cost_price, sale_price, tax_percentage, stock, min_stock, image, expiry_date } = req.body;
    const { data, error } = await supabase
      .from("products")
      .insert([{
        company_id: req.user.company_id,
        name,
        barcode,
        category_id,
        supplier_id,
        unit,
        cost_price,
        sale_price,
        tax_percentage: tax_percentage || 14,
        stock,
        min_stock,
        image,
        expiry_date
      }])
      .select("id")
      .single();


    if (error) return res.status(500).json({ error: error.message });

    // Log product creation
    await logActivity(req, 'CREATE', 'PRODUCT', `Produto ${name} criado. Preço: ${sale_price} ${req.user.currency}. Stock inicial: ${stock}`, { name, sale_price, stock });

    res.json({ id: data.id });
  });

  app.patch("/api/products/:id/stock", authenticate, async (req: any, res) => {
    const { stock } = req.body;
    const { error } = await supabase
      .from("products")
      .update({ stock })
      .eq("id", req.params.id)
      .eq("company_id", req.user.company_id);

    if (error) return res.status(500).json({ error: error.message });

    // Log stock update
    await logActivity(req, 'UPDATE', 'PRODUCT', `Stock do produto ID ${req.params.id} atualizado para ${stock}.`, { product_id: req.params.id, new_stock: stock });

    res.json({ success: true });
  });

  // --- INVENTORY SESSIONS (SALES) ---
  app.get("/api/inventory/sessions", authenticate, async (req: any, res) => {
    const { data: sessions, error } = await supabase
      .from("inventory_sessions")
      .select("*, users(name)")
      .eq("company_id", req.user.company_id)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    const formatted = sessions?.map((s: any) => ({
      ...s,
      user_name: s.users?.name
    }));
    res.json(formatted || []);
  });

  app.post("/api/inventory/sessions", authenticate, async (req: any, res) => {
    const { notes } = req.body;
    const { data: session, error } = await supabase
      .from("inventory_sessions")
      .insert([{
        company_id: req.user.company_id,
        user_id: req.user.id,
        branch_id: req.user.branch_id,
        status: 'draft',
        notes: notes || 'Inventário Geral'
      }])
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    // Auto-populate session items with current stock
    const { data: products } = await supabase
      .from("products")
      .select("id, stock, cost_price")
      .eq("company_id", req.user.company_id);

    if (products && products.length > 0) {
      const items = products.map(p => ({
        session_id: session.id,
        product_id: p.id,
        expected_quantity: p.stock || 0,
        cost_price: p.cost_price || 0
      }));
      const { error: iError } = await supabase.from("inventory_session_items").insert(items);
      if (iError) console.error('Error inserting inventory items:', iError.message);
    }

    res.json(session);
  });

  app.post("/api/inventory/sessions/:id/counts", authenticate, async (req: any, res) => {
    const { id } = req.params;
    const { counts } = req.body; // Record<product_id, quantity>

    for (const productId in counts) {
      const qty = parseFloat(counts[productId]);
      await supabase
        .from("inventory_session_items")
        .update({
          counted_quantity: qty
        })
        .eq("session_id", id)
        .eq("product_id", productId);
    }

    res.json({ success: true });
  });

  app.post("/api/inventory/sessions/:id/finalize", authenticate, async (req: any, res) => {
    const { id } = req.params;

    // 1. Get all counted items
    const { data: items, error: fError } = await supabase
      .from("inventory_session_items")
      .select("*")
      .eq("session_id", id);

    if (fError || !items) return res.status(404).json({ error: "Sessão vazia ou não encontrada." });

    // 2. Update status
    await supabase.from("inventory_sessions").update({
      status: 'completed',
      completed_at: new Date().toISOString()
    }).eq("id", id);

    // 3. Update product stocks and record movements
    for (const item of items) {
      if (item.counted_quantity !== null) {
        const delta = item.counted_quantity - item.expected_quantity;
        if (delta !== 0) {
          // Update product stock
          await supabase.from("products").update({ stock: item.counted_quantity }).eq("id", item.product_id);

          // Record movement
          await supabase.from("inventory_movements").insert({
            company_id: req.user.company_id,
            product_id: item.product_id,
            quantity: Math.abs(delta),
            type: delta > 0 ? 'in' : 'out',
            reason: 'Reconciliação de Inventário',
            user_id: req.user.id
          });
        }
      }
    }

    res.json({ success: true });
  });

  // Categories
  app.get("/api/categories", authenticate, async (req: any, res) => {
    const { data: categories, error } = await supabase
      .from("categories")
      .select("*")
      .eq("company_id", req.user.company_id);
    res.json(categories || []);
  });

  app.post("/api/categories", authenticate, async (req: any, res) => {
    const { name } = req.body;
    const { data, error } = await supabase
      .from("categories")
      .insert([{ company_id: req.user.company_id, name }])
      .select("id")
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ id: data.id });
  });

  app.put("/api/categories/:id", authenticate, async (req: any, res) => {
    const { name } = req.body;
    const { error } = await supabase
      .from("categories")
      .update({ name })
      .eq("id", req.params.id)
      .eq("company_id", req.user.company_id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  app.delete("/api/categories/:id", authenticate, async (req: any, res) => {
    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", req.params.id)
      .eq("company_id", req.user.company_id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });
  app.post("/api/expenses", authenticate, async (req: any, res) => {
    const { supplier_id, description, amount, due_date, status } = req.body;
    const { data, error } = await supabase
      .from("expenses")
      .insert([{
        company_id: req.user.company_id,
        supplier_id: supplier_id || null,
        description,
        amount,
        due_date,
        status: status || 'pending'
      }])
      .select("id")
      .single();

    if (error) return res.status(500).json({ error: error.message });

    // Log expense creation
    await logActivity(req, 'CREATE', 'EXPENSE', `Despesa '${description}' registada no valor de ${amount} ${req.user.currency}.`, { description, amount });

    res.json({ id: data.id });
  });

  app.patch("/api/expenses/:id/status", authenticate, async (req: any, res) => {
    const { status } = req.body;
    const { error } = await supabase
      .from("expenses")
      .update({ status })
      .eq("id", req.params.id)
      .eq("company_id", req.user.company_id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  app.get("/api/expenses", authenticate, async (req: any, res) => {
    const { start_date, end_date, status, search } = req.query;
    let query = supabase
      .from("expenses")
      .select("*, suppliers(name)")
      .eq("company_id", req.user.company_id);

    if (start_date) query = query.gte("due_date", start_date);
    if (end_date) query = query.lte("due_date", end_date);
    if (status && status !== 'all') query = query.eq("status", status);
    if (search) query = query.ilike("description", `%${search}%`);

    const { data: expenses, error } = await query.order("due_date", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    const formatted = expenses?.map((e: any) => ({
      ...e,
      supplier_name: e.suppliers?.name
    }));

    res.json(formatted || []);
  });

  // Accounts Receivable (Contas a Receber)
  app.get("/api/financial/receivable", authenticate, async (req: any, res) => {
    const { start_date, end_date, status, search } = req.query;
    let query = supabase
      .from("sales")
      .select("*, customers(name)")
      .eq("company_id", req.user.company_id);

    if (start_date) query = query.gte("created_at", start_date);
    if (end_date) query = query.lte("created_at", `${end_date}T23:59:59`);

    if (status === 'paid') {
      query = query.eq("status", "paid");
    } else if (status === 'pending') {
      query = query.eq("status", "pending");
    }

    if (search) {
      query = query.or(`invoice_number.ilike.%${search}%,customers.name.ilike.%${search}%`);
    }

    const { data: sales, error } = await query.order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    const formatted = sales?.map((s: any) => ({
      ...s,
      customer_name: s.customers?.name
    }));

    res.json(formatted || []);
  });

  // Customers
  app.get("/api/customers", authenticate, async (req: any, res) => {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("company_id", req.user.company_id)
      .order("name");
    res.json(data || []);
  });

  app.post("/api/customers", authenticate, validateBody(['name']), async (req: any, res) => {
    const { name, nif, phone, address, email } = req.body;
    const { data, error } = await supabase
      .from("customers")
      .insert([{
        company_id: req.user.company_id,
        name,
        nif,
        phone,
        address,
        email
      }])
      .select("id, name")
      .single();

    if (error) return res.status(500).json({ error: error.message });

    // Log customer creation
    await logActivity(req, 'CREATE', 'CUSTOMER', `Cliente '${name}' registado.`, { name, nif });

    res.json(data);
  });

  app.get("/api/customers/:id/pending-sales", authenticate, async (req: any, res) => {
    const { data: sales, error } = await supabase
      .from("sales")
      .select("*")
      .eq("company_id", req.user.company_id)
      .eq("customer_id", req.params.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    res.json(sales || []);
  });


  app.get("/api/customers/:id/history", authenticate, async (req: any, res) => {
    const { data: sales, error: salesError } = await supabase
      .from("sales")
      .select("id, invoice_number, total, amount_paid, status, created_at")
      .eq("company_id", req.user.company_id)
      .eq("customer_id", req.params.id);

    const { data: payments, error: payError } = await supabase
      .from("payments")
      .select("id, amount, created_at, sales(invoice_number)")
      .eq("company_id", req.user.company_id);

    // Filter payments for this customer manually since we can't join deeply across tables as easily in one call
    // Or we could have used a better select if we had the customer_id in payments
    const customerPayments = payments?.filter((p: any) => p.sales?.customer_id === req.params.id) || [];

    const history = [
      ...(sales?.map(s => ({ ...s, type: 'sale', reference: s.invoice_number, amount: s.total })) || []),
      ...(payments?.map((p: any) => ({
        type: 'payment',
        id: p.id,
        reference: p.sales?.invoice_number,
        amount: p.amount,
        status: 'paid',
        created_at: p.created_at
      })) || [])
    ].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    res.json(history);
  });

  // Sales & POS
  app.get("/api/sales", authenticate, async (req: any, res) => {
    const { start_date, end_date, register_id } = req.query;
    let query = supabase
      .from("sales")
      .select("*, customers(name), items:sale_items(*, products(name))")
      .eq("company_id", req.user.company_id);

    if (start_date) query = query.gte("created_at", start_date);
    if (end_date) query = query.lte("created_at", `${end_date}T23:59:59`);
    if (register_id) query = query.eq("register_id", register_id);

    const { data: sales, error } = await query.order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    const formattedSales = sales?.map((s: any) => ({
      ...s,
      customer_name: s.customers?.name,
      items: s.items?.map((i: any) => ({
        ...i,
        product_name: i.products?.name
      }))
    }));

    res.json(formattedSales || []);
  });

  app.post("/api/sales", authenticate, async (req: any, res) => {
    const { items, customer_id, subtotal, tax, total, amount_paid, change, payment_method, discount, is_pro_forma, is_exempt, exemption_reason } = req.body;

    // AGT Compliance: Basic Validations
    if (!isValidNif(req.body.customer_nif)) {
      return res.status(400).json({ error: "NIF inválido. Deve conter 9 dígitos ou ser 'Consumidor Final'." });
    }

    if (total <= 0) {
      return res.status(400).json({ error: "O total da factura deve ser superior a zero. Use Notas de Crédito para anulações." });
    }

    // Determine Document Type and Fetch Billing Series

    let docType = is_pro_forma ? 'PRO' : 'FAC';

    // AGT: If not pro-forma and payment is immediate (not credit), it should be a Fatura-Recibo (FR)
    if (!is_pro_forma && payment_method !== 'credit') {
      docType = 'FR';
    }
    const { data: activeSeries, error: seriesError } = await supabase
      .from("billing_series")
      .select("*")
      .eq("company_id", req.user.company_id)
      .eq("doc_type", docType)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    let invoice_number;
    if (activeSeries) {
      const currentYear = new Date().getFullYear();
      let nextNumber = (activeSeries.last_number || 0) + 1;

      // Automatic Year Update & Counter Reset
      // Detect if we entered a new year relative to the last update
      const lastUpdateYear = activeSeries.updated_at ? new Date(activeSeries.updated_at).getFullYear() : currentYear;

      if (lastUpdateYear < currentYear) {
        console.log(`[Billing] Novo ano detectado (${currentYear}). Reiniciando contador da série ${activeSeries.series_name}`);
        nextNumber = 1;
      }

      const paddedNumber = String(nextNumber).padStart(3, '0');
      // Format: DOC-YEAR/NUMBER (Ex: FAC-2026/001)
      invoice_number = `${activeSeries.doc_type}-${currentYear}/${paddedNumber}`;

      // Update last_number in series
      await supabase
        .from("billing_series")
        .update({
          last_number: nextNumber,
          updated_at: new Date().toISOString()
        })
        .eq("id", activeSeries.id);
    } else {
      // Fallback to timestamp if no active series found
      invoice_number = is_pro_forma ? `PRO-${Date.now()}` : `FAC-${Date.now()}`;
    }

    // Log sale activity
    await logActivity(req, 'CREATE', 'SALE', `${is_pro_forma ? 'Fatura Pro-forma' : 'Venda'} ${invoice_number} realizada. Total: ${total} ${req.user.currency}`, { invoice_number, total, is_pro_forma });

    const status = is_pro_forma ? 'pending' : (payment_method === 'credit' ? 'pending' : 'paid');

    let branchId = req.user.branch_id;
    if (!branchId) {
      console.log(`[Venda] Utilizador ${req.user.email} sem branch_id. À procura de filial...`);
      let { data: branch } = await supabase.from("branches").select("id").eq("company_id", req.user.company_id).limit(1).maybeSingle();

      if (!branch) {
        console.log(`[Venda] Nenhuma filial encontrada para empresa ${req.user.company_id}. Criando padrão...`);
        const { data: newBranch } = await supabase.from("branches").insert({ company_id: req.user.company_id, name: 'Sede Central' }).select("id").single();
        branch = newBranch;
      }
      branchId = branch?.id;
    }

    if (!branchId) {
      console.warn(`[Venda] AVISO: branchId continua nulo para ${req.user.email}. Tentando find-any...`);
      const { data: anyBranch } = await supabase.from("branches").select("id").eq("company_id", req.user.company_id).limit(1).maybeSingle();
      branchId = anyBranch?.id;
    }

    if (!branchId) {
      console.error(`[Venda] ERRO CRÍTICO: Não foi possível determinar branchId para utilizador ${req.user.email} (Empresa: ${req.user.company_id})`);
      return res.status(400).json({
        error: "Erro de configuração: Seu utilizador não tem uma filial associada.",
        details: "Isso pode ocorrer se a configuração do servidor (Service Role Key) estiver incorreta ou se os dados foram reparados recentemente.",
        action: "Por favor, SAIA DO SISTEMA (Logout) e ENTRE NOVAMENTE para atualizar as suas permissões."
      });
    }

    // 🚀 PERFORMANCE OPTIMIZATION: Parallel Metadata Fetching
    const [
      { data: openRegister },
      { data: lastSaleForHash },
      { data: companyData },
      { data: config },
      { data: keys }
    ] = await Promise.all([
      supabase.from("cash_registers").select("id").eq("company_id", req.user.company_id).eq("user_id", req.user.id).eq("status", "open").maybeSingle(),
      supabase.from("sales").select("hash").eq("company_id", req.user.company_id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("companies").select("nif").eq("id", req.user.company_id).single(),
      supabase.from('agt_configs').select('cert_number').eq('company_id', req.user.company_id).maybeSingle(),
      supabase.from('agt_keys').select('private_key').eq('company_id', req.user.company_id).eq('is_active', true).maybeSingle()
    ]);

    const companyNif = companyData?.nif || '999999999';
    const prevHash = lastSaleForHash?.hash || '';
    const hashDate = new Date().toISOString().split('T')[0];
    const systemEntryDate = new Date().toISOString().replace('Z', '').substring(0, 19);

    // Sign using RSA 2048 (New AGT Compliance) - 🚀 Optimized: No internal DB call
    const currentHash = signDocumentRSA(keys?.private_key, hashDate, systemEntryDate, invoice_number, total, prevHash);

    const certNo = config?.cert_number || '0000/AGT/2026';
    const verb = (is_pro_forma) ? 'Processado' : 'Processado'; // Faturas are always Processado
    const cert_phrase = `${verb} por programa validado n.º ${certNo}/AGT`;

    try {
      // 1. Create Sale
      const { data: saleData, error: saleError } = await supabase
        .from("sales")
        .insert([{
          company_id: req.user.company_id,
          branch_id: branchId,
          user_id: req.user.id,
          register_id: openRegister?.id || null,
          customer_id: customer_id || null,
          customer_nif: req.body.customer_nif || '',
          customer_name: req.body.customer_name || 'Consumidor Final',
          total,

          subtotal,
          tax,
          amount_paid: is_pro_forma ? 0 : amount_paid,
          change: is_pro_forma ? 0 : change,
          discount: discount || 0,
          is_pro_forma: !!is_pro_forma,
          payment_method: is_pro_forma ? 'credit' : payment_method,
          is_exempt: is_exempt || false,
          exemption_reason: is_exempt ? exemption_reason : null,
          status,
          invoice_number,
          // AGT Compliance fields
          hash: currentHash,
          prev_hash: prevHash,
          agt_phrase: cert_phrase,
          is_certified: true
        }])
        .select("id")
        .single();

      if (saleError) {
        console.error('❌ Erro Supabase ao inserir venda:', saleError);
        return res.status(500).json({ error: `Erro na BD: ${saleError.message}`, details: saleError });
      }
      const saleId = saleData.id;

      console.log(`[Venda] Preparando saleItems para inserir. Total itens: ${items.length}`);
      const saleItems = items.map((item: any) => ({
        company_id: req.user.company_id,
        sale_id: saleId,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.sale_price,
        subtotal: item.quantity * item.sale_price
      }));

      const { error: itemsError } = await supabase.from("sale_items").insert(saleItems);
      if (itemsError) throw itemsError;

      // 2. 🚀 PERFORMANCE OPTIMIZATION: Update stock & balance ONLY if NOT Pro Forma
      if (!is_pro_forma) {
        // Parallel stock updates
        const stockTasks = items.map(async (item: any) => {
          const { data: product } = await supabase.from("products").select("stock").eq("id", item.id).single();
          if (product) {
            return supabase.from("products").update({ stock: product.stock - item.quantity }).eq("id", item.id);
          }
        });

        // 3. Update Customer Balance
        let balanceTask = null;
        if (payment_method === 'credit' && customer_id) {
          balanceTask = (async () => {
            const { data: customer } = await supabase.from("customers").select("balance").eq("id", customer_id).single();
            if (customer) {
              return supabase.from("customers").update({ balance: (customer.balance || 0) + total }).eq("id", customer_id);
            }
          })();
        }

        // Fire all stock and balance updates in parallel
        await Promise.allSettled([...stockTasks, balanceTask].filter(Boolean));
      }

      // INTEGRAÇÃO AGT: Envia fatura em background se auto_send = true
      onInvoiceCreated({
        id: saleId,
        invoice_number,
        total,
        subtotal,
        tax,
        customer_nif: req.body.customer_nif || '',
        hash: currentHash,
        prev_hash: prevHash,
        is_pro_forma: !!is_pro_forma,
        created_at: new Date().toISOString(),
        items: items.map((item: any) => ({
          product_id: item.id,
          product_name: item.name,
          quantity: item.quantity,
          unit_price: item.sale_price,
          tax_percentage: item.tax_percentage || 14,
          unit: item.unit || 'un'
        }))
      });

      res.json({ id: saleId, invoice_number, hash: currentHash, cert_phrase });
    } catch (err: any) {
      console.error('❌ Erro inesperado ao processar venda:', err);
      res.status(500).json({ error: err.message || "Erro ao processar venda" });
    }
  });

  app.post("/api/sales/:id/cancel", authenticate, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      // 1. Get Sale info
      const { data: sale, error: saleErr } = await supabase
        .from("sales")
        .select("*, items:sale_items(*)")
        .eq("id", id)
        .eq("company_id", req.user.company_id)
        .single();

      if (saleErr || !sale) return res.status(404).json({ error: "Venda não encontrada" });
      if (sale.status === 'cancelled') return res.status(400).json({ error: "Esta venda já foi anulada" });

      // 2. Generate Nota de Crédito (NC) document
      const { data: activeNCSeries } = await supabase
        .from("billing_series")
        .select("*")
        .eq("company_id", req.user.company_id)
        .eq("doc_type", "NC")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      let document_number;
      if (activeNCSeries) {
        const currentYear = new Date().getFullYear();
        let nextNumber = (activeNCSeries.last_number || 0) + 1;
        const lastUpdateYear = activeNCSeries.updated_at ? new Date(activeNCSeries.updated_at).getFullYear() : currentYear;
        if (lastUpdateYear < currentYear) nextNumber = 1;

        const paddedNumber = String(nextNumber).padStart(3, '0');
        document_number = `NC-${currentYear}/${paddedNumber}`;

        await supabase
          .from("billing_series")
          .update({ last_number: nextNumber, updated_at: new Date().toISOString() })
          .eq("id", activeNCSeries.id);
      } else {
        document_number = `NC-${Date.now()}`;
      }

      // Generate Hash for NC
      const { data: lastSaleForHash } = await supabase
        .from("sales")
        .select("hash")
        .eq("company_id", req.user.company_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Fetch company NIF for Hash
      const { data: companyData } = await supabase.from("companies").select("nif").eq("id", req.user.company_id).single();
      const companyNif = companyData?.nif || '999999999';

      const prevHash = lastSaleForHash?.hash || '';
      const hashDate = new Date().toISOString().split('T')[0];
      const systemEntryDate = new Date().toISOString().replace('Z', '').substring(0, 19);

      // Sign using RSA 2048 (New AGT Compliance)
      const currentHash = await signDocumentRSA(req.user.company_id, hashDate, systemEntryDate, document_number, sale.total, prevHash);


      // 3. Update Sale Status
      await supabase
        .from("sales")
        .update({ status: 'cancelled', metadata: { ...sale.metadata, cancelled_at: new Date().toISOString(), cancel_reason: reason, nc_number: document_number, nc_hash: currentHash } })
        .eq("id", id);

      // 4. Restore Stock
      for (const item of sale.items) {
        const { data: product } = await supabase.from("products").select("stock").eq("id", item.product_id).single();
        if (product) {
          await supabase.from("products").update({ stock: product.stock + item.quantity }).eq("id", item.product_id);
        }
      }

      // 5. Update Customer Balance if credit
      if (sale.payment_method === 'credit' && sale.customer_id) {
        const { data: customer } = await supabase.from("customers").select("balance").eq("id", sale.customer_id).single();
        if (customer) {
          await supabase.from("customers").update({ balance: Math.max(0, (customer.balance || 0) - sale.total) }).eq("id", sale.customer_id);
        }
      }

      // Log cancellation
      await logActivity(req, 'CANCEL', 'SALE', `Venda ${sale.invoice_number} anulada via ${document_number}. Motivo: ${reason}`, { sale_id: id, nc_number: document_number });

      // INTEGRAÇÃO AGT: Envia Nota de Crédito
      onInvoiceCreated({
        id: id, // ID da venda original (ou criar registro de NC se houver tabela própria)
        invoice_number: document_number,
        total: -sale.total, // Valores negativos em NC
        subtotal: -sale.subtotal,
        tax: -sale.tax,
        customer_nif: sale.customers?.nif || '',
        hash: currentHash,
        prev_hash: prevHash,
        is_nc: true,
        created_at: new Date().toISOString(),
        items: (sale.items || []).map((item: any) => ({
          product_id: item.product_id,
          product_name: item.products?.name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          tax_percentage: item.tax_percentage || 14
        }))
      });


      const cert_phrase = await getAgtCertPhrase(req.user.company_id, 'NC');
      res.json({ success: true, nc_number: document_number, hash: currentHash, cert_phrase });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Billing Series Management
  app.get("/api/billing-series", authenticate, async (req: any, res) => {
    try {
      const { data, error } = await supabase
        .from("billing_series")
        .select("*")
        .eq("company_id", req.user.company_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      res.json(data || []);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/billing-series", authenticate, isAdmin, async (req: any, res) => {
    try {
      const { doc_type, series_name } = req.body;
      const { data, error } = await supabase
        .from("billing_series")
        .insert([{
          company_id: req.user.company_id,
          doc_type,
          series_name,
          last_number: 0,
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch("/api/billing-series/:id/toggle", authenticate, isAdmin, async (req: any, res) => {
    try {
      const { is_active } = req.body;
      const { error } = await supabase
        .from("billing_series")
        .update({ is_active })
        .eq("id", req.params.id)
        .eq("company_id", req.user.company_id);

      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/payments", authenticate, async (req: any, res) => {
    const { sale_id, amount, payment_method } = req.body;

    try {
      // 1. Get Sale info
      const { data: sale, error: saleErr } = await supabase
        .from("sales")
        .select("*")
        .eq("id", sale_id)
        .eq("company_id", req.user.company_id)
        .single();

      if (saleErr || !sale) return res.status(404).json({ error: "Venda não encontrada" });

      const newAmountPaid = (sale.amount_paid || 0) + amount;
      const status = newAmountPaid >= sale.total ? 'paid' : 'pending';

      // AGT: Generate Receipt (RE) document
      const { data: activeRESeries } = await supabase
        .from("billing_series")
        .select("*")
        .eq("company_id", req.user.company_id)
        .eq("doc_type", "RE")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      let document_number;
      if (activeRESeries) {
        const currentYear = new Date().getFullYear();
        let nextNumber = (activeRESeries.last_number || 0) + 1;

        // Year reset check
        const lastUpdateYear = activeRESeries.updated_at ? new Date(activeRESeries.updated_at).getFullYear() : currentYear;
        if (lastUpdateYear < currentYear) nextNumber = 1;

        const paddedNumber = String(nextNumber).padStart(3, '0');
        document_number = `RE-${currentYear}/${paddedNumber}`;

        // Update series
        await supabase
          .from("billing_series")
          .update({ last_number: nextNumber, updated_at: new Date().toISOString() })
          .eq("id", activeRESeries.id);
      } else {
        document_number = `RE-${Date.now()}`;
      }

      // 🚀 PERFORMANCE OPTIMIZATION: Parallel Metadata for Receipts
      const [
        { data: lastPaymentForHash },
        { data: companyData },
        { data: config },
        { data: keys }
      ] = await Promise.all([
        supabase.from("payments").select("hash").eq("company_id", req.user.company_id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("companies").select("nif").eq("id", req.user.company_id).single(),
        supabase.from('agt_configs').select('cert_number').eq('company_id', req.user.company_id).maybeSingle(),
        supabase.from('agt_keys').select('private_key').eq('company_id', req.user.company_id).eq('is_active', true).maybeSingle()
      ]);

      const companyNif = companyData?.nif || '999999999';
      const prevHash = lastPaymentForHash?.hash || '';
      const hashDate = new Date().toISOString().split('T')[0];
      const systemEntryDate = new Date().toISOString().replace('Z', '').substring(0, 19);

      // Sign using RSA 2048 (New AGT Compliance) - 🚀 Optimized
      const currentHash = signDocumentRSA(keys?.private_key, hashDate, systemEntryDate, document_number, amount, prevHash);

      const certNo = config?.cert_number || '0000/AGT/2026';
      const verb = 'Emitido';
      const cert_phrase = `${verb} por programa validado n.º ${certNo}/AGT`;

      // 2. Record payment with Document info and Hash
      const { error: payError } = await supabase
        .from("payments")
        .insert([{
          company_id: req.user.company_id,
          sale_id,
          amount,
          payment_method,
          document_number,
          hash: currentHash,
          prev_hash: prevHash,
          agt_phrase: cert_phrase,
          is_certified: true
        }]);

      if (payError) throw payError;

      // 3. Update Sale
      const { error: updateErr } = await supabase
        .from("sales")
        .update({
          amount_paid: newAmountPaid,
          status,
          payment_method: sale.payment_method === 'credit' ? payment_method : sale.payment_method
        })
        .eq("id", sale_id);

      res.json({ success: true, new_amount_paid: newAmountPaid, status, document_number, hash: currentHash, cert_phrase });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Cash Registers
  app.get("/api/cash-registers/status", authenticate, async (req: any, res) => {
    const { data, error } = await supabase
      .from("cash_registers")
      .select("*")
      .eq("company_id", req.user.company_id)
      .eq("user_id", req.user.id)
      .eq("status", "open")
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  app.get("/api/cash-registers", authenticate, async (req: any, res) => {
    const { data, error } = await supabase
      .from("cash_registers")
      .select("*, users(name)")
      .eq("company_id", req.user.company_id)
      .order("opened_at", { ascending: false });
    res.json(data || []);
  });

  app.post("/api/cash-registers/open", authenticate, async (req: any, res) => {
    const { initial_value } = req.body;
    const branchId = req.user.branch_id || 1;
    const { data, error } = await supabase
      .from("cash_registers")
      .insert([{
        company_id: req.user.company_id,
        branch_id: branchId,
        user_id: req.user.id,
        initial_value,
        status: 'open'
      }])
      .select("*")
      .single();

    if (error) return res.status(500).json({ error: error.message });

    // Log cash register opening
    await logActivity(req, 'OPEN', 'CASH_REGISTER', `Caixa aberto com valor inicial de ${initial_value} ${req.user.currency}.`, { initial_value });

    res.json(data);
  });

  app.post("/api/cash-registers/close", authenticate, async (req: any, res) => {
    const { total_sold } = req.body;
    const { data: register } = await supabase
      .from("cash_registers")
      .select("*")
      .eq("company_id", req.user.company_id)
      .eq("user_id", req.user.id)
      .eq("status", "open")
      .single();

    if (!register) return res.status(404).json({ error: "Nenhum caixa aberto encontrado para fechar." });

    const { data, error } = await supabase
      .from("cash_registers")
      .update({
        status: 'closed',
        closed_at: new Date().toISOString(),
        total_sold,
        final_value: register.initial_value + total_sold
      })
      .eq("id", register.id)
      .select("*")
      .single();

    if (error) return res.status(500).json({ error: error.message });

    // Log cash register closing
    await logActivity(req, 'CLOSE', 'CASH_REGISTER', `Caixa fechado. Total vendido: ${total_sold} ${req.user.currency}.`, { total_sold, final_value: register.initial_value + total_sold });

    res.json(data);
  });


  // Dashboard Stats
  app.get("/api/dashboard/stats", authenticate, async (req: any, res) => {
    const companyId = req.user.company_id;
    const today = new Date().toISOString().split('T')[0];
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    const { data: salesToday } = await supabase.from("sales").select("total").eq("company_id", companyId).gte("created_at", today);
    const { data: salesMonth } = await supabase.from("sales").select("total").eq("company_id", companyId).gte("created_at", startOfMonth);
    const { data: lowStockProducts } = await supabase.from("products").select("name, stock, min_stock").eq("company_id", companyId).filter("stock", "lte", "min_stock");
    const { count: totalProducts } = await supabase.from("products").select("*", { count: 'exact', head: true }).eq("company_id", companyId);

    // Total Receivable/Payable
    const { data: receivableSales } = await supabase.from("sales").select("total, amount_paid").eq("company_id", companyId).eq("status", "pending");
    const { data: payableExpenses } = await supabase.from("expenses").select("amount").eq("company_id", companyId).eq("status", "pending");

    // Critical Debtors
    const { data: criticalDebtors } = await supabase.from("customers").select("id, name, balance").eq("company_id", companyId).gte("balance", 5000).order("balance", { ascending: false }).limit(5);

    // Chart data (Simplified)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentSales } = await supabase.from("sales").select("created_at, total").eq("company_id", companyId).gte("created_at", sevenDaysAgo);

    const dailySalesMap: Record<string, number> = {};
    recentSales?.forEach(s => {
      const date = s.created_at.split('T')[0];
      dailySalesMap[date] = (dailySalesMap[date] || 0) + s.total;
    });
    const dailySales = Object.entries(dailySalesMap).map(([date, total]) => ({ date, total }));

    res.json({
      salesToday: salesToday?.reduce((sum, s) => sum + s.total, 0) || 0,
      salesMonth: salesMonth?.reduce((sum, s) => sum + s.total, 0) || 0,
      lowStock: lowStockProducts?.length || 0,
      lowStockProducts: lowStockProducts || [],
      totalProducts: totalProducts || 0,
      totalReceivable: receivableSales?.reduce((sum, s) => sum + (s.total - s.amount_paid), 0) || 0,
      totalPayable: payableExpenses?.reduce((sum, e) => sum + e.amount, 0) || 0,
      criticalDebtors: criticalDebtors || [],
      dailySales
    });
  });

  app.get("/api/dashboard/top-products", authenticate, async (req: any, res) => {
    const { data: items } = await supabase.from("sale_items").select("quantity, products(name)").eq("sales.company_id", req.user.company_id);

    // Manual aggregation
    const productMap: Record<string, number> = {};
    items?.forEach((i: any) => {
      const name = i.products?.name || "Unknown";
      productMap[name] = (productMap[name] || 0) + i.quantity;
    });

    const topProducts = Object.entries(productMap)
      .map(([name, total_sold]) => ({ name, total_sold }))
      .sort((a, b) => b.total_sold - a.total_sold)
      .slice(0, 5);

    res.json(topProducts);
  });

  // --- MÓDULO FARMÁCIA APIs ---

  app.get("/api/farmacia/medicamentos", authenticate, checkFeature('pharmacy'), async (req: any, res) => {
    const { data: medicamentos, error } = await supabase
      .from("medicamentos")
      .select("*, lotes:lotes_medicamentos(quantidade_atual)")
      .eq("company_id", req.user.company_id);

    const formatted = medicamentos?.map((m: any) => ({
      ...m,
      stock_total: m.lotes?.reduce((sum: number, l: any) => sum + (l.quantidade_atual || 0), 0) || 0
    }));

    res.json(formatted || []);
  });

  app.post("/api/farmacia/medicamentos", authenticate, isAdmin, checkFeature('pharmacy'), async (req: any, res) => {
    const {
      nome_medicamento, nome_generico, codigo_interno, codigo_barras, qr_code,
      categoria_terapeutica, forma_farmaceutica, dosagem, laboratorio, pais_origem,
      necessita_receita, tipo_receita, temperatura_armazenamento, preco_compra,
      preco_venda, margem_lucro, iva, estoque_minimo
    } = req.body;

    const { data, error } = await supabase
      .from("medicamentos")
      .insert([{
        company_id: req.user.company_id,
        nome_medicamento, nome_generico, codigo_interno, codigo_barras, qr_code,
        categoria_terapeutica, forma_farmaceutica, dosagem, laboratorio, pais_origem,
        necessita_receita: necessita_receita ? 1 : 0,
        tipo_receita, temperatura_armazenamento, preco_compra, preco_venda,
        margem_lucro, iva, estoque_minimo
      }])
      .select("id")
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ id: data.id });
  });

  app.get("/api/farmacia/lotes", authenticate, async (req: any, res) => {
    const { data: lotes, error } = await supabase
      .from("lotes_medicamentos")
      .select("*, medicamentos(nome_medicamento), fornecedores_farmaceuticos(nome_empresa)")
      .eq("company_id", req.user.company_id);

    const formatted = lotes?.map((l: any) => ({
      ...l,
      nome_medicamento: l.medicamentos?.nome_medicamento,
      fornecedor_nome: l.fornecedores_farmaceuticos?.nome_empresa
    }));

    res.json(formatted || []);
  });

  app.post("/api/farmacia/lotes", authenticate, async (req: any, res) => {
    const {
      medicamento_id, numero_lote, data_fabricacao, data_validade,
      quantidade_inicial, fornecedor_id, custo_unitario, localizacao_armazenamento
    } = req.body;

    const { data, error } = await supabase
      .from("lotes_medicamentos")
      .insert([{
        company_id: req.user.company_id,
        medicamento_id,
        numero_lote,
        data_fabricacao,
        data_validade,
        quantidade_inicial,
        quantidade_atual: quantidade_inicial,
        fornecedor_id,
        custo_unitario,
        localizacao_armazenamento
      }])
      .select("id")
      .single();

    if (error) return res.status(500).json({ error: error.message });

    // Registrar movimento de stock
    await supabase.from("movimentos_stock_farmacia").insert([{
      company_id: req.user.company_id,
      medicamento_id,
      lote_id: data.id,
      tipo_movimento: 'entrada_inicial',
      quantidade: quantidade_inicial,
      utilizador_id: req.user.id
    }]);

    res.json({ id: data.id });
  });

  // Fornecedores
  app.get("/api/farmacia/fornecedores", authenticate, async (req: any, res) => {
    const { data: fornecedores, error } = await supabase
      .from("fornecedores_farmaceuticos")
      .select("*")
      .eq("company_id", req.user.company_id);
    res.json(fornecedores || []);
  });

  app.post("/api/farmacia/fornecedores", authenticate, async (req: any, res) => {
    const { nome_empresa, nif, telefone, email, endereco, licenca_sanitaria } = req.body;
    const { data, error } = await supabase
      .from("fornecedores_farmaceuticos")
      .insert([{
        company_id: req.user.company_id,
        nome_empresa,
        nif,
        telefone,
        email,
        endereco,
        licenca_sanitaria
      }])
      .select("id")
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ id: data.id });
  });

  // Compras
  app.get("/api/farmacia/compras", authenticate, async (req: any, res) => {
    const { data: compras, error } = await supabase
      .from("compras_farmacia")
      .select("*, fornecedores_farmaceuticos(nome_empresa)")
      .eq("company_id", req.user.company_id)
      .order("data_compra", { ascending: false });

    const formatted = compras?.map((c: any) => ({
      ...c,
      fornecedor_nome: c.fornecedores_farmaceuticos?.nome_empresa
    }));

    res.json(formatted || []);
  });

  app.post("/api/farmacia/compras", authenticate, async (req: any, res) => {
    const { fornecedor_id, numero_compra, data_compra, subtotal, iva, total, itens } = req.body;

    const { data: compra, error: compraError } = await supabase
      .from("compras_farmacia")
      .insert([{
        company_id: req.user.company_id,
        fornecedor_id,
        numero_compra,
        data_compra,
        subtotal,
        iva,
        total
      }])
      .select("id")
      .single();

    if (compraError) return res.status(500).json({ error: compraError.message });

    for (const item of itens) {
      // Registrar item da compra
      await supabase.from("itens_compra_farmacia").insert([{
        compra_id: compra.id,
        medicamento_id: item.medicamento_id,
        lote_id: item.lote_id,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
        total: item.total
      }]);

      // Registrar movimento de stock
      await supabase.from("movimentos_stock_farmacia").insert([{
        company_id: req.user.company_id,
        medicamento_id: item.medicamento_id,
        lote_id: item.lote_id,
        tipo_movimento: 'compra',
        quantidade: item.quantidade,
        utilizador_id: req.user.id
      }]);

      // Atualizar lote
      const { data: lote } = await supabase.from("lotes_medicamentos").select("quantidade_atual").eq("id", item.lote_id).single();
      if (lote) {
        await supabase
          .from("lotes_medicamentos")
          .update({ quantidade_atual: lote.quantidade_atual + item.quantidade })
          .eq("id", item.lote_id);
      }
    }

    res.json({ id: compra.id });
  });

  // Clientes Farmácia (Pacientes)
  app.get("/api/farmacia/clientes", authenticate, async (req: any, res) => {
    const { data: clientes, error } = await supabase
      .from("clientes_farmacia")
      .select("*")
      .eq("company_id", req.user.company_id);
    res.json(clientes || []);
  });

  app.post("/api/farmacia/clientes", authenticate, async (req: any, res) => {
    const { nome, data_nascimento, telefone, email, numero_utente, alergias, historico_medicamentos } = req.body;
    const { data, error } = await supabase
      .from("clientes_farmacia")
      .insert([{
        company_id: req.user.company_id,
        nome,
        data_nascimento,
        telefone,
        email,
        numero_utente,
        alergias,
        historico_medicamentos
      }])
      .select("id")
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ id: data.id });
  });

  // Receitas Médicas
  app.get("/api/farmacia/receitas", authenticate, async (req: any, res) => {
    const { data: receitas, error } = await supabase
      .from("receitas_medicas")
      .select("*")
      .eq("company_id", req.user.company_id)
      .order("data_receita", { ascending: false });
    res.json(receitas || []);
  });

  app.post("/api/farmacia/receitas", authenticate, async (req: any, res) => {
    const { paciente_nome, medico_nome, numero_ordem_medico, hospital, data_receita, imagem_receita, itens } = req.body;
    const { data: receita, error } = await supabase
      .from("receitas_medicas")
      .insert([{
        company_id: req.user.company_id,
        paciente_nome,
        medico_nome,
        numero_ordem_medico,
        hospital,
        data_receita,
        imagem_receita
      }])
      .select("id")
      .single();

    if (error) return res.status(500).json({ error: error.message });

    if (itens && itens.length > 0) {
      for (const item of itens) {
        await supabase.from("itens_receita_medica").insert([{
          receita_id: receita.id,
          medicamento_id: item.medicamento_id,
          quantidade: item.quantidade
        }]);
      }
    }

    res.json({ id: receita.id });
  });

  // Alertas
  app.get("/api/farmacia/alertas", authenticate, async (req: any, res) => {
    const companyId = req.user.company_id;
    const ninetyDaysFromNow = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

    // Alertas de stock baixo
    const { data: meds } = await supabase
      .from("medicamentos")
      .select("id, nome_medicamento, estoque_minimo, lotes:lotes_medicamentos(quantidade_atual)")
      .eq("company_id", companyId);

    const stockBaixo = meds?.map((m: any) => ({
      id: m.id,
      nome_medicamento: m.nome_medicamento,
      estoque_minimo: m.estoque_minimo,
      stock_total: m.lotes?.reduce((sum: number, l: any) => sum + (l.quantidade_atual || 0), 0) || 0
    })).filter(m => m.stock_total <= m.estoque_minimo) || [];

    // Alertas de validade próxima
    const { data: lotesValidade } = await supabase
      .from("lotes_medicamentos")
      .select("id, numero_lote, data_validade, medicamentos(nome_medicamento), quantidade_atual")
      .eq("company_id", companyId)
      .eq("status", "ativo")
      .gt("quantidade_atual", 0)
      .lte("data_validade", ninetyDaysFromNow);

    const validadeProxima = lotesValidade?.map((l: any) => ({
      id: l.id,
      numero_lote: l.numero_lote,
      data_validade: l.data_validade,
      nome_medicamento: l.medicamentos?.nome_medicamento,
      quantidade_atual: l.quantidade_atual
    })) || [];

    res.json({ stockBaixo, validadeProxima });
  });

  // Vendas (POS)
  app.get("/api/farmacia/vendas", authenticate, async (req: any, res) => {
    const { data: vendas, error } = await supabase
      .from("vendas_farmacia")
      .select("*, clientes_farmacia(nome), users(name)")
      .eq("company_id", req.user.company_id)
      .order("created_at", { ascending: false });

    const formatted = vendas?.map((v: any) => ({
      ...v,
      cliente_nome: v.clientes_farmacia?.nome,
      vendedor_nome: v.users?.name
    }));

    res.json(formatted || []);
  });

  app.get("/api/farmacia/stats", authenticate, async (req: any, res) => {
    const companyId = req.user.company_id;
    const today = new Date().toISOString().split('T')[0];
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    const { data: salesToday } = await supabase.from("vendas_farmacia").select("total").eq("company_id", companyId).gte("created_at", today);
    const { data: salesMonth } = await supabase.from("vendas_farmacia").select("total").eq("company_id", companyId).gte("created_at", startOfMonth);

    // Low stock count (Medicines)
    const { data: meds } = await supabase
      .from("medicamentos")
      .select("id, estoque_minimo, lotes:lotes_medicamentos(quantidade_atual)")
      .eq("company_id", companyId);

    const lowStockCount = meds?.filter((m: any) => {
      const total = m.lotes?.reduce((sum: number, l: any) => sum + (l.quantidade_atual || 0), 0) || 0;
      return total <= m.estoque_minimo;
    }).length || 0;

    // Daily sales for chart
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentSales } = await supabase.from("vendas_farmacia")
      .select("created_at, total")
      .eq("company_id", companyId)
      .gte("created_at", sevenDaysAgo);

    const dailySalesMap: Record<string, number> = {};
    recentSales?.forEach(v => {
      const date = v.created_at.split('T')[0];
      dailySalesMap[date] = (dailySalesMap[date] || 0) + v.total;
    });
    const dailySales = Object.entries(dailySalesMap).map(([date, total]) => ({
      date: new Date(date).toLocaleDateString('pt-PT', { weekday: 'short' }),
      total
    }));

    res.json({
      salesToday: salesToday?.reduce((sum, v) => sum + v.total, 0) || 0,
      salesMonth: salesMonth?.reduce((sum, v) => sum + v.total, 0) || 0,
      lowStock: lowStockCount,
      dailySales,
      totalReceivable: 0,
      totalPayable: 0
    });
  });

  // Relatório de Vendas Farmácia por Funcionário
  app.get("/api/reports/pharmacy-sales-by-employee", authenticate, async (req: any, res: any) => {
    try {
      const { startDate, endDate } = req.query;
      const companyId = req.user.company_id;

      if (!['master', 'admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({ error: "Acesso negado. Apenas administradores podem ver este relatório." });
      }

      let query = supabase
        .from('vendas_farmacia')
        .select(`
          id, total, iva, created_at,
          vendedor_id,
          users ( name ),
          itens:itens_venda_farmacia ( quantidade )
        `)
        .eq('company_id', companyId);

      if (startDate) query = query.gte('created_at', startDate);
      if (endDate) query = query.lte('created_at', endDate);

      const { data: vendas, error } = await query;

      if (error) throw error;
      if (!vendas) return res.json([]);

      // Agregação manual
      console.log(`📊 [Relatório Farmácia] Processando ${vendas.length} vendas.`);

      const grouped = vendas.reduce((acc: any, venda: any) => {
        const userId = venda.vendedor_id || 'vendedor_desconhecido';
        const userName = venda.users?.name || 'Sistema/Desconhecido';

        if (!acc[userId]) {
          acc[userId] = {
            id: userId,
            name: userName,
            sales_count: 0,
            total_amount: 0,
            total_tax: 0,
            total_items: 0
          };
        }

        acc[userId].sales_count++;
        acc[userId].total_amount += Number(venda.total || 0);
        acc[userId].total_tax += Number(venda.iva || 0);

        // Somar quantidades dos itens
        // Nota: itens:itens_venda_farmacia pode vir como array devido ao select
        const itemsArr = Array.isArray(venda.itens) ? venda.itens : [];
        const itemsQty = itemsArr.reduce((sum: number, it: any) => sum + Number(it.quantidade || 0), 0);
        acc[userId].total_items += itemsQty;

        return acc;
      }, {});

      const result = Object.values(grouped).sort((a: any, b: any) => b.total_amount - a.total_amount);
      console.log(`✅ [Relatório Farmácia] Enviando stats de ${result.length} funcionários.`);
      res.json(result);

    } catch (err: any) {
      console.error('❌ Erro no relatório de farmácia:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/farmacia/vendas", authenticate, async (req: any, res) => {
    const { itens, cliente_id, forma_pagamento, valor_entregue } = req.body;
    const companyId = req.user.company_id;
    const vendedorId = req.user.id;

    if (total <= 0) {
      return res.status(400).json({ error: "Venda de farmácia não pode ter valor zero ou negativo." });
    }


    let subtotal = itens.reduce((acc: number, item: any) => acc + (item.quantidade * item.preco_unitario), 0);
    const iva = subtotal * 0.14;
    const total = subtotal + iva;
    const troco = valor_entregue ? valor_entregue - total : 0;
    const { data: activeSeries } = await supabase
      .from("billing_series")
      .select("*")
      .eq("company_id", companyId)
      .eq("doc_type", "FR")
      .eq("is_active", true)
      .maybeSingle();

    let numero_factura;
    if (activeSeries) {
      const currentYear = new Date().getFullYear();
      let nextNumber = (activeSeries.last_number || 0) + 1;
      const lastUpdateYear = activeSeries.updated_at ? new Date(activeSeries.updated_at).getFullYear() : currentYear;
      if (lastUpdateYear < currentYear) nextNumber = 1;
      const paddedNumber = String(nextNumber).padStart(3, '0');
      numero_factura = `FR-FARM-${currentYear}/${paddedNumber}`;
      await supabase.from("billing_series").update({ last_number: nextNumber, updated_at: new Date().toISOString() }).eq("id", activeSeries.id);
    } else {
      numero_factura = `FR-FARM-${Date.now()}`;
    }

    // 🚀 PERFORMANCE OPTIMIZATION: Parallel Metadata for Pharmacy
    const [
      { data: lastPharmSale },
      { data: companyData },
      { data: config },
      { data: branchResult },
      { data: keys }
    ] = await Promise.all([
      supabase.from("vendas_farmacia").select("hash").eq("company_id", companyId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("companies").select("nif").eq("id", companyId).single(),
      supabase.from('agt_configs').select('cert_number').eq('company_id', companyId).maybeSingle(),
      (!req.user.branch_id ? supabase.from("branches").select("id").eq("company_id", companyId).limit(1).maybeSingle() : Promise.resolve({ data: { id: req.user.branch_id } })),
      supabase.from('agt_keys').select('private_key').eq('company_id', companyId).eq('is_active', true).maybeSingle()
    ]);

    const companyNif = companyData?.nif || '999999999';
    const prevHash = lastPharmSale?.hash || '';
    const hashDate = new Date().toISOString().split('T')[0];
    const systemEntryDate = new Date().toISOString().replace('Z', '').substring(0, 19);

    // Sign using RSA 2048 (New AGT Compliance) - 🚀 Optimized
    const currentHash = signDocumentRSA(keys?.private_key, hashDate, systemEntryDate, numero_factura, total, prevHash);

    const certNo = config?.cert_number || '0000/AGT/2026';
    const cert_phrase = `Processado por programa validado n.º ${certNo}/AGT`;

    let branchId = branchResult?.data?.id;

    // Create sale record
    const { data: venda, error: vendaError } = await supabase
      .from("vendas_farmacia")
      .insert([{
        company_id: companyId,
        branch_id: branchId,
        cliente_id: cliente_id || null,
        vendedor_id: vendedorId,
        numero_factura,
        subtotal,
        iva,
        total,
        valor_entregue: valor_entregue || total,
        troco,
        forma_pagamento: forma_pagamento || 'dinheiro',
        // AGT Compliance fields
        hash: currentHash,
        prev_hash: prevHash,
        agt_phrase: cert_phrase,
        is_certified: true
      }])
      .select("id")
      .single();

    if (vendaError) {
      console.error('❌ Erro Supabase ao inserir venda farmácia:', vendaError);
      return res.status(500).json({ error: `Erro na BD Farmácia: ${vendaError.message}`, details: vendaError });
    }

    // 🚀 PERFORMANCE OPTIMIZATION: Refactored FIFO Loop to remove sequential DB calls
    const lotUpdates: Promise<any>[] = [];
    const vendaItems: any[] = [];
    const movimentos: any[] = [];

    for (const item of itens) {
      let qtdRestante = item.quantidade;
      const { data: lotes } = await supabase
        .from("lotes_medicamentos")
        .select("id, quantidade_atual")
        .eq("company_id", companyId)
        .eq("medicamento_id", item.medicamento_id)
        .eq("status", "ativo")
        .gt("quantidade_atual", 0)
        .order("data_validade", { ascending: true });

      if (!lotes || lotes.length === 0) {
        return res.status(400).json({ error: `Sem stock para o medicamento ID ${item.medicamento_id}` });
      }

      for (const lote of lotes) {
        if (qtdRestante <= 0) break;

        const qtdDeducao = Math.min(qtdRestante, lote.quantidade_atual);
        qtdRestante -= qtdDeducao;

        // Accumulate lot update
        lotUpdates.push(
          supabase.from("lotes_medicamentos")
            .update({ quantidade_atual: lote.quantidade_atual - qtdDeducao })
            .eq("id", lote.id)
        );

        const itemIva = (qtdDeducao * item.preco_unitario) * 0.14;
        const itemTotalValue = (qtdDeducao * item.preco_unitario) + itemIva;

        // Accumulate sale item
        vendaItems.push({
          company_id: companyId,
          venda_id: venda.id,
          medicamento_id: item.medicamento_id,
          lote_id: lote.id,
          quantidade: qtdDeducao,
          preco_unitario: item.preco_unitario,
          iva: itemIva,
          total: itemTotalValue
        });

        // Accumulate movement
        movimentos.push({
          company_id: companyId,
          medicamento_id: item.medicamento_id,
          lote_id: lote.id,
          tipo_movimento: 'saida_venda',
          quantidade: qtdDeducao,
          utilizador_id: vendedorId
        });
      }

      if (qtdRestante > 0) {
        return res.status(400).json({ error: `Stock insuficiente para atender toda a quantidade do medicamento ${item.medicamento_id}` });
      }
    }

    // 🚀 BATCH EXECUTION: Execute all pharmacy operations in parallel
    await Promise.all([
      Promise.all(lotUpdates),
      supabase.from("itens_venda_farmacia").insert(vendaItems),
      supabase.from("movimentos_stock_farmacia").insert(movimentos)
    ]);

    // INTEGRAÇÃO AGT: Envia venda de farmácia
    onInvoiceCreated({
      id: venda.id,
      invoice_number: numero_factura,
      total,
      subtotal,
      tax: iva,
      customer_nif: req.body.customer_nif || '',
      hash: currentHash,
      prev_hash: prevHash,
      created_at: new Date().toISOString(),
      items: itens.map((item: any) => ({
        product_id: item.medicamento_id,
        product_name: item.nome_medicamento,
        quantity: item.quantity,
        unit_price: item.preco_unitario,
        tax_percentage: 14,
        unit: 'un'
      }))
    });

    res.json({ success: true, venda_id: venda.id, numero_factura, hash: currentHash, cert_phrase });


  });

  // --- PHARMACY INVENTORY SESSIONS ---
  app.get("/api/farmacia/inventory/sessions", authenticate, async (req: any, res) => {
    const { data: sessions, error } = await supabase
      .from("pharmacy_inventory_sessions")
      .select("*, users(name)")
      .eq("company_id", req.user.company_id)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    const formatted = sessions?.map((s: any) => ({
      ...s,
      user_name: s.users?.name
    }));
    res.json(formatted || []);
  });

  app.post("/api/farmacia/inventory/sessions", authenticate, async (req: any, res) => {
    const { notes } = req.body;
    const { data: session, error } = await supabase
      .from("pharmacy_inventory_sessions")
      .insert([{
        company_id: req.user.company_id,
        user_id: req.user.id,
        branch_id: req.user.branch_id,
        status: 'draft',
        notes: notes || 'Inventário Farmácia'
      }])
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    // Auto-populate with current stock from lotes_medicamentos
    const { data: lotes } = await supabase
      .from("lotes_medicamentos")
      .select("id, quantidade_atual")
      .eq("company_id", req.user.company_id);

    if (lotes && lotes.length > 0) {
      const items = lotes.map(l => ({
        session_id: session.id,
        lote_id: l.id,
        expected_quantity: l.quantidade_atual || 0
      }));
      await supabase.from("pharmacy_inventory_session_items").insert(items);
    }

    res.json(session);
  });

  app.post("/api/farmacia/inventory/sessions/:id/counts", authenticate, async (req: any, res) => {
    const { id } = req.params;
    const { counts } = req.body; // Record<lote_id, quantity>

    for (const loteId in counts) {
      const qty = parseFloat(counts[loteId]);
      await supabase
        .from("pharmacy_inventory_session_items")
        .update({ counted_quantity: qty })
        .eq("session_id", id)
        .eq("lote_id", loteId);
    }

    res.json({ success: true });
  });

  app.post("/api/farmacia/inventory/sessions/:id/finalize", authenticate, async (req: any, res) => {
    const { id } = req.params;

    const { data: items, error: fError } = await supabase
      .from("pharmacy_inventory_session_items")
      .select("*")
      .eq("session_id", id);

    if (fError || !items) return res.status(404).json({ error: "Sessão vazia ou não encontrada." });

    await supabase.from("pharmacy_inventory_sessions").update({
      status: 'completed',
      completed_at: new Date().toISOString()
    }).eq("id", id);

    for (const item of items) {
      if (item.counted_quantity !== null) {
        const delta = item.counted_quantity - item.expected_quantity;
        if (delta !== 0) {
          // Update lot stock
          await supabase.from("lotes_medicamentos").update({
            quantidade_atual: item.counted_quantity
          }).eq("id", item.lote_id);

          // Record movement
          const { data: loteInfo } = await supabase.from("lotes_medicamentos").select("medicamento_id").eq("id", item.lote_id).single();

          await supabase.from("movimentos_stock_farmacia").insert({
            company_id: req.user.company_id,
            medicamento_id: loteInfo?.medicamento_id,
            lote_id: item.lote_id,
            quantidade: Math.abs(delta),
            tipo_movimento: delta > 0 ? 'ajuste_positivo' : 'ajuste_negativo',
            utilizador_id: req.user.id
          });
        }
      }
    }

    res.json({ success: true });
  });

  // --- MOVIMENTOS & AJUSTES FARMÁCIA ---
  app.get("/api/farmacia/movimentos", authenticate, async (req: any, res) => {
    const { data: movements, error } = await supabase
      .from("movimentos_stock_farmacia")
      .select("*, medicamentos(nome_medicamento), lotes_medicamentos(numero_lote)")
      .eq("company_id", req.user.company_id)
      .order("data_movimento", { ascending: false })
      .limit(100);

    if (error) return res.status(500).json({ error: error.message });

    const formatted = movements?.map((m: any) => ({
      ...m,
      nome_medicamento: m.medicamentos?.nome_medicamento,
      lote_numero: m.lotes_medicamentos?.numero_lote
    }));

    res.json(formatted || []);
  });

  app.post("/api/farmacia/lotes/:id/ajustar", authenticate, isAdmin, async (req: any, res) => {
    const { id } = req.params;
    const { tipo, quantidade, motivo, medicamento_id } = req.body;

    const { data: lote } = await supabase.from("lotes_medicamentos").select("quantidade_atual").eq("id", id).single();
    if (!lote) return res.status(404).json({ error: "Lote não encontrado." });

    const novaQuantidade = tipo === 'entrada' ? lote.quantidade_atual + quantidade : lote.quantidade_atual - quantidade;

    if (novaQuantidade < 0) return res.status(400).json({ error: "Stock insuficiente para este ajuste." });

    await supabase.from("lotes_medicamentos").update({ quantidade_atual: novaQuantidade }).eq("id", id);

    await supabase.from("movimentos_stock_farmacia").insert({
      company_id: req.user.company_id,
      medicamento_id,
      lote_id: id,
      quantidade,
      tipo_movimento: tipo === 'entrada' ? 'ajuste_positivo' : 'ajuste_negativo',
      motivo: motivo || 'Ajuste Manual',
      utilizador_id: req.user.id
    });

    res.json({ success: true });
  });

  // --- FIM MÓDULO FARMÁCIA APIs ---


  // Reports
  app.get("/api/reports/profit", authenticate, async (req: any, res) => {
    const companyId = req.user.company_id;
    const { start, end } = req.query;

    let query = supabase
      .from("sale_items")
      .select("quantity, unit_price, products!inner(cost_price)")
      .eq("sales.company_id", companyId);

    if (start && end) {
      query = query.gte("sales.created_at", start).lte("sales.created_at", end);
    }

    const { data: items, error } = await query;

    if (error) return res.status(500).json({ error: error.message });

    const report = items?.reduce((acc, item: any) => {
      const revenue = item.quantity * item.unit_price;
      const cost = item.quantity * (item.products?.cost_price || 0);
      acc.revenue += revenue;
      acc.cost += cost;
      acc.profit += (revenue - cost);
      return acc;
    }, { revenue: 0, cost: 0, profit: 0 }) || { revenue: 0, cost: 0, profit: 0 };

    res.json(report);
  });

  app.get("/api/reports/top-selling", authenticate, async (req: any, res) => {
    const { data: items, error } = await supabase
      .from("sale_items")
      .select("quantity, subtotal, products(name)")
      .eq("sales.company_id", req.user.company_id);

    // Aggregate manually
    const productMap: Record<string, any> = {};
    items?.forEach((i: any) => {
      const name = i.products?.name || "Unknown";
      if (!productMap[name]) {
        productMap[name] = { name, total_quantity: 0, total_revenue: 0 };
      }
      productMap[name].total_quantity += i.quantity;
      productMap[name].total_revenue += i.subtotal;
    });

    const topSelling = Object.values(productMap)
      .sort((a, b) => b.total_quantity - a.total_quantity)
      .slice(0, 10);

    res.json(topSelling);
  });

  app.get("/api/reports/saft", authenticate, async (req: any, res) => {
    const { month, year } = req.query;
    const companyId = req.user.company_id;

    if (!month || !year) return res.status(400).json({ error: "Mês e Ano são obrigatórios." });

    try {
      // 1. Fetch Data
      const startDate = `${year}-${month.padStart(2, '0')}-01T00:00:00.000Z`;
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
      const endDate = `${year}-${month.padStart(2, '0')}-${lastDay}T23:59:59.999Z`;

      const { data: company } = await supabase.from("companies").select("*").eq("id", companyId).single();
      const { data: sales, error: salesError } = await supabase
        .from("sales")
        .select("*, sale_items(*, products(*)), customers(*)")
        .eq("company_id", companyId)
        .gte("created_at", startDate)
        .lte("created_at", endDate);

      if (salesError) throw salesError;

      // 2. Build XML
      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      xml += `<AuditFile xmlns="urn:OECD:StandardAuditFile-Tax:AO:1.01">\n`;

      // Header
      xml += `  <Header>\n`;
      xml += `    <AuditFileVersion>1.01</AuditFileVersion>\n`;
      xml += `    <CompanyID>${escapeXml(company?.nif || '---')}</CompanyID>\n`;
      xml += `    <TaxRegistrationNumber>${escapeXml(company?.nif || '---')}</TaxRegistrationNumber>\n`;
      xml += `    <CompanyName>${escapeXml(company?.name || '---')}</CompanyName>\n`;
      xml += `    <CompanyAddress>\n`;
      xml += `      <AddressDetail>${escapeXml(company?.address || '---')}</AddressDetail>\n`;
      xml += `      <City>${escapeXml(company?.city || 'Luanda')}</City>\n`;
      xml += `      <Country>AO</Country>\n`;
      xml += `    </CompanyAddress>\n`;
      xml += `    <FiscalYear>${year}</FiscalYear>\n`;
      xml += `    <StartDate>${startDate.split('T')[0]}</StartDate>\n`;
      xml += `    <EndDate>${endDate.split('T')[0]}</EndDate>\n`;
      xml += `    <CurrencyCode>AOA</CurrencyCode>\n`;
      xml += `    <DateCreated>${new Date().toISOString().split('T')[0]}</DateCreated>\n`;
      xml += `    <TaxEntity>Global</TaxEntity>\n`;
      xml += `    <ProductCompanyID>Amazing Corporation</ProductCompanyID>\n`;
      xml += `    <SoftwareCertificateNumber>0000/AGT/2026</SoftwareCertificateNumber>\n`;
      xml += `    <ProductID>Venda Plus/AGT-Verified</ProductID>\n`;
      xml += `    <ProductVersion>2.0.0</ProductVersion>\n`;
      xml += `  </Header>\n`;

      // MasterFiles
      xml += `  <MasterFiles>\n`;

      // Customers
      const uniqueCustomers = Array.from(new Set(sales?.map(s => s.customers?.id).filter(id => id)));
      for (const cid of uniqueCustomers) {
        const cust = sales?.find(s => s.customers?.id === cid)?.customers;
        if (cust) {
          xml += `    <Customer>\n`;
          xml += `      <CustomerID>${cust.id}</CustomerID>\n`;
          xml += `      <CustomerTaxID>${escapeXml(cust.nif || '999999999')}</CustomerTaxID>\n`;
          xml += `      <AccountID>Desconhecido</AccountID>\n`;
          xml += `      <CompanyName>${escapeXml(cust.name)}</CompanyName>\n`;
          xml += `      <BillingAddress><AddressDetail>---</AddressDetail><City>---</City><Country>AO</Country></BillingAddress>\n`;
          xml += `      <SelfBillingIndicator>0</SelfBillingIndicator>\n`;
          xml += `    </Customer>\n`;
        }
      }

      // Products
      const productsMap = new Map();
      sales?.forEach(s => s.sale_items?.forEach((si: any) => {
        if (si.products) productsMap.set(si.products.id, si.products);
      }));
      for (const prod of productsMap.values()) {
        xml += `    <Product>\n`;
        xml += `      <ProductType>P</ProductType>\n`;
        xml += `      <ProductCode>${prod.id}</ProductCode>\n`;
        xml += `      <ProductDescription>${escapeXml(prod.name)}</ProductDescription>\n`;
        xml += `      <ProductNumberCode>${prod.id}</ProductNumberCode>\n`;
        xml += `    </Product>\n`;
      }

      // TaxTable
      xml += `    <TaxTable>\n`;
      xml += `      <TaxTableEntry>\n`;
      xml += `        <TaxType>IVA</TaxType>\n`;
      xml += `        <TaxCountryRegion>AO</TaxCountryRegion>\n`;
      xml += `        <TaxCode>NOR</TaxCode>\n`;
      xml += `        <Description>Taxa Normal</Description>\n`;
      xml += `        <TaxPercentage>14.00</TaxPercentage>\n`;
      xml += `      </TaxTableEntry>\n`;
      xml += `      <TaxTableEntry>\n`;
      xml += `        <TaxType>IVA</TaxType>\n`;
      xml += `        <TaxCountryRegion>AO</TaxCountryRegion>\n`;
      xml += `        <TaxCode>ISE</TaxCode>\n`;
      xml += `        <Description>Isento</Description>\n`;
      xml += `        <TaxPercentage>0.00</TaxPercentage>\n`;
      xml += `      </TaxTableEntry>\n`;
      xml += `    </TaxTable>\n`;
      xml += `  </MasterFiles>\n`;

      // SourceDocuments
      xml += `  <SourceDocuments>\n`;
      xml += `    <SalesInvoices>\n`;
      xml += `      <NumberOfEntries>${sales?.length || 0}</NumberOfEntries>\n`;
      xml += `      <TotalDebit>0.00</TotalDebit>\n`;
      xml += `      <TotalCredit>${sales?.reduce((acc, s) => acc + s.total, 0).toFixed(2) || '0.00'}</TotalCredit>\n`;

      for (const s of (sales || [])) {
        const type = s.is_pro_forma ? 'PRO' : 'FT';
        xml += `      <Invoice>\n`;
        xml += `        <InvoiceNo>${type} ${s.id}</InvoiceNo>\n`;
        xml += `        <DocumentStatus>\n`;
        xml += `          <InvoiceStatus>N</InvoiceStatus>\n`;
        xml += `          <InvoiceStatusDate>${s.created_at}</InvoiceStatusDate>\n`;
        xml += `          <SourceID>${s.vendedor_id || 'system'}</SourceID>\n`;
        xml += `          <SourceBilling>P</SourceBilling>\n`;
        xml += `        </DocumentStatus>\n`;
        xml += `        <Hash>${escapeXml(s.hash || '')}</Hash>\n`;
        xml += `        <HashControl>1</HashControl>\n`;
        xml += `        <Period>${month}</Period>\n`;
        xml += `        <InvoiceDate>${s.created_at.split('T')[0]}</InvoiceDate>\n`;
        xml += `        <InvoiceType>${type}</InvoiceType>\n`;
        xml += `        <SelfBillingIndicator>0</SelfBillingIndicator>\n`;
        xml += `        <SystemEntryDate>${s.created_at}</SystemEntryDate>\n`;
        xml += `        <CustomerID>${s.customers?.id || '0'}</CustomerID>\n`;

        s.sale_items?.forEach((si: any, idx: number) => {
          xml += `        <Line>\n`;
          xml += `          <LineNumber>${idx + 1}</LineNumber>\n`;
          xml += `          <ProductCode>${si.products?.id}</ProductCode>\n`;
          xml += `          <ProductDescription>${escapeXml(si.products?.name)}</ProductDescription>\n`;
          xml += `          <Quantity>${si.quantity}</Quantity>\n`;
          xml += `          <UnitOfMeasure>un</UnitOfMeasure>\n`;
          xml += `          <UnitPrice>${(si.unit_price || 0).toFixed(2)}</UnitPrice>\n`;
          xml += `          <TaxPointDate>${s.created_at.split('T')[0]}</TaxPointDate>\n`;
          xml += `          <Description>${escapeXml(si.products?.name)}</Description>\n`;
          xml += `          <CreditAmount>${(si.total || 0).toFixed(2)}</CreditAmount>\n`;
          xml += `          <Tax>\n`;
          xml += `            <TaxType>IVA</TaxType>\n`;
          xml += `            <TaxCountryRegion>AO</TaxCountryRegion>\n`;
          xml += `            <TaxCode>${s.is_exempt ? 'ISE' : 'NOR'}</TaxCode>\n`;
          xml += `            <TaxPercentage>${s.is_exempt ? '0.00' : '14.00'}</TaxPercentage>\n`;
          xml += `          </Tax>\n`;
          if (s.is_exempt) {
            xml += `          <TaxExemptionReason>${escapeXml(s.exemption_reason || 'Isento')}</TaxExemptionReason>\n`;
            xml += `          <TaxExemptionCode>M00</TaxExemptionCode>\n`;
          }
          xml += `          <SettlementAmount>0.00</SettlementAmount>\n`;
          xml += `        </Line>\n`;
        });

        xml += `        <DocumentTotals>\n`;
        xml += `          <TaxPayable>${(s.total - (s.total / 1.14)).toFixed(2)}</TaxPayable>\n`;
        xml += `          <NetTotal>${(s.total / 1.14).toFixed(2)}</NetTotal>\n`;
        xml += `          <GrossTotal>${s.total.toFixed(2)}</GrossTotal>\n`;
        xml += `        </DocumentTotals>\n`;
        xml += `      </Invoice>\n`;
      }

      xml += `    </SalesInvoices>\n`;
      xml += `  </SourceDocuments>\n`;
      xml += `</AuditFile>`;

      res.setHeader('Content-Type', 'application/xml');
      res.setHeader('Content-Disposition', `attachment; filename=SAFT_AO_${company?.nif || 'EMPRESA'}_${year}_${month}.xml`);
      res.send(xml);

    } catch (err: any) {
      console.error("SAFT Error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // --- MÓDULO RECURSOS HUMANOS APIs ---

  // Partners Locations & Hours API
  app.get("/api/public/partners", async (req, res) => {
    const { data: partners, error } = await supabase
      .from("branches")
      .select(`
        *,
        companies (
          name,
          logo,
          category,
          phone,
          email
        )
      `)
      .eq("is_public", true);

    if (error) return res.status(500).json({ error: error.message });

    const formatted = partners?.map((p: any) => ({
      id: p.id,
      name: p.name,
      address: p.address,
      latitude: p.latitude,
      longitude: p.longitude,
      working_hours: p.working_hours,
      company_name: p.companies?.name,
      company_logo: p.companies?.logo,
      category: p.companies?.category,
      phone: p.companies?.phone || p.phone
    }));

    res.json(formatted || []);
  });

  // Publications APIs
  app.get("/api/public/publications", async (req, res) => {
    const { data: publications, error } = await supabase
      .from("publications")
      .select("*, companies(name, logo, phone, email, address)")
      .order("created_at", { ascending: false });

    const formatted = publications?.map((p: any) => ({
      ...p,
      company_name: p.companies?.name,
      company_logo: p.companies?.logo,
      company_phone: p.companies?.phone,
      company_email: p.companies?.email,
      company_address: p.companies?.address
    }));

    res.json(formatted || []);
  });

  app.post("/api/publications", authenticate, async (req: any, res) => {
    const { title, content, image, type } = req.body;
    const { data, error } = await supabase
      .from("publications")
      .insert([{
        company_id: req.user.company_id,
        title,
        content,
        image,
        type: type || 'news'
      }])
      .select("id")
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ id: data.id });
  });

  app.delete("/api/publications/:id", authenticate, async (req: any, res) => {
    const { error } = await supabase
      .from("publications")
      .delete()
      .eq("id", req.params.id)
      .eq("company_id", req.user.company_id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  // Helper for IRT calculation (Angola 2024)
  function calculateIRT(taxableIncome: number): number {
    if (taxableIncome <= 100000) return 0;
    if (taxableIncome <= 150000) return (taxableIncome - 100000) * 0.10;
    if (taxableIncome <= 200000) return 5000 + (taxableIncome - 150000) * 0.13;
    if (taxableIncome <= 300000) return 11500 + (taxableIncome - 200000) * 0.16;
    if (taxableIncome <= 500000) return 27500 + (taxableIncome - 300000) * 0.18;
    if (taxableIncome <= 1000000) return 63500 + (taxableIncome - 500000) * 0.19;
    if (taxableIncome <= 1500000) return 158500 + (taxableIncome - 1000000) * 0.20;
    if (taxableIncome <= 2000000) return 258500 + (taxableIncome - 1500000) * 0.21;
    if (taxableIncome <= 5000000) return 363500 + (taxableIncome - 2000000) * 0.22;
    if (taxableIncome <= 10000000) return 1023500 + (taxableIncome - 5000000) * 0.23;
    return 2173500 + (taxableIncome - 10000000) * 0.25;
  }

  // Departments
  app.get("/api/hr/departments", authenticate, checkFeature('hr'), async (req: any, res) => {
    const { data: depts, error } = await supabase
      .from("hr_departments")
      .select("*")
      .eq("company_id", req.user.company_id);
    res.json(depts || []);
  });

  app.post("/api/hr/departments", authenticate, async (req: any, res) => {
    const { name, description } = req.body;
    const { data, error } = await supabase
      .from("hr_departments")
      .insert([{ company_id: req.user.company_id, name, description }])
      .select("id")
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ id: data.id });
  });

  app.put("/api/hr/departments/:id", authenticate, async (req: any, res) => {
    const { name, description } = req.body;
    const { error } = await supabase
      .from("hr_departments")
      .update({ name, description })
      .eq("id", req.params.id)
      .eq("company_id", req.user.company_id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  app.delete("/api/hr/departments/:id", authenticate, async (req: any, res) => {
    const { error } = await supabase
      .from("hr_departments")
      .delete()
      .eq("id", req.params.id)
      .eq("company_id", req.user.company_id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  // Employees
  app.get("/api/hr/employees", authenticate, async (req: any, res) => {
    const { data: employees, error } = await supabase
      .from("hr_employees")
      .select("*, hr_departments(name)")
      .eq("company_id", req.user.company_id);

    if (error) return res.status(500).json({ error: error.message });

    const formatted = employees?.map((e: any) => ({
      ...e,
      department_name: e.hr_departments?.name
    }));

    res.json(formatted || []);
  });

  app.post("/api/hr/employees", authenticate, async (req: any, res) => {
    const {
      name, email, phone, address, position, department_id,
      hire_date, salary_base, food_allowance, transport_allowance,
      other_deductions, is_service_provider, status, bank_account, nif
    } = req.body;

    const { data, error } = await supabase
      .from("hr_employees")
      .insert([{
        company_id: req.user.company_id,
        department_id: department_id || null,
        name,
        email,
        phone,
        address,
        position,
        hire_date,
        salary_base: salary_base || 0,
        food_allowance: food_allowance || 0,
        transport_allowance: transport_allowance || 0,
        other_deductions: other_deductions || 0,
        is_service_provider: is_service_provider || false,
        bank_account,
        nif,
        status: status || 'active'
      }])
      .select("id")
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ id: data.id });
  });

  app.put("/api/hr/employees/:id", authenticate, async (req: any, res) => {
    const {
      name, email, phone, address, position, department_id,
      hire_date, salary_base, food_allowance, transport_allowance,
      other_deductions, is_service_provider, status, bank_account, nif
    } = req.body;

    const { error } = await supabase
      .from("hr_employees")
      .update({
        name,
        email,
        phone,
        address,
        position,
        department_id: department_id || null,
        hire_date,
        salary_base: salary_base || 0,
        food_allowance: food_allowance || 0,
        transport_allowance: transport_allowance || 0,
        other_deductions: other_deductions || 0,
        is_service_provider: is_service_provider || false,
        bank_account,
        nif,
        status
      })
      .eq("id", req.params.id)
      .eq("company_id", req.user.company_id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });


  app.delete("/api/hr/employees/:id", authenticate, async (req: any, res) => {
    const { error } = await supabase
      .from("hr_employees")
      .delete()
      .eq("id", req.params.id)
      .eq("company_id", req.user.company_id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  // Attendance
  app.get("/api/hr/attendance", authenticate, async (req: any, res) => {
    const { date } = req.query;
    const { data: attendance, error } = await supabase
      .from("hr_attendance")
      .select("*, hr_employees(name)")
      .eq("hr_employees.company_id", req.user.company_id)
      .eq("date", date);

    const formatted = attendance?.map((a: any) => ({
      ...a,
      employee_name: a.hr_employees?.name
    }));

    res.json(formatted || []);
  });

  app.post("/api/hr/attendance", authenticate, async (req: any, res) => {
    const { employee_id, date, status, check_in, check_out } = req.body;
    const { error } = await supabase
      .from("hr_attendance")
      .upsert({
        employee_id,
        date,
        status,
        check_in,
        check_out
      }, { onConflict: 'employee_id,date' });

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  // Payrolls
  app.get("/api/hr/payrolls", authenticate, async (req: any, res) => {
    const { data: payrolls, error } = await supabase
      .from("hr_payrolls")
      .select("*")
      .eq("company_id", req.user.company_id)
      .order("year", { ascending: false })
      .order("month", { ascending: false });
    res.json(payrolls || []);
  });

  app.get("/api/hr/payrolls/:id", authenticate, async (req: any, res) => {
    const { data: payroll, error: pError } = await supabase
      .from("hr_payrolls")
      .select("*")
      .eq("id", req.params.id)
      .eq("company_id", req.user.company_id)
      .single();

    if (!payroll) return res.status(404).json({ error: "Payroll not found" });

    const { data: items, error: iError } = await supabase
      .from("hr_payroll_items")
      .select("*, hr_employees(name, position, is_service_provider)")
      .eq("payroll_id", req.params.id);

    const formattedItems = items?.map((i: any) => ({
      ...i,
      employee_name: i.hr_employees?.name,
      position: i.hr_employees?.position,
      is_service_provider: i.hr_employees?.is_service_provider
    }));

    res.json({ ...payroll, items: formattedItems || [] });
  });

  app.post("/api/hr/payrolls/generate", authenticate, async (req: any, res) => {
    const { month, year } = req.body;
    const companyId = req.user.company_id;

    // Check if payroll already exists
    const { data: existing } = await supabase
      .from("hr_payrolls")
      .select("id")
      .eq("company_id", companyId)
      .eq("month", month)
      .eq("year", year)
      .single();

    if (existing) return res.status(400).json({ error: "Folha salarial já existe para este período" });

    const { data: employees } = await supabase
      .from("hr_employees")
      .select("*")
      .eq("company_id", companyId)
      .eq("status", "active");

    if (!employees) return res.status(400).json({ error: "Nenhum funcionário ativo encontrado" });

    let totalGross = 0, totalNet = 0, totalInssEmployee = 0, totalInssEmployer = 0, totalIrt = 0, totalOtherDeductions = 0;

    const { data: payroll, error } = await supabase
      .from("hr_payrolls")
      .insert([{ company_id: companyId, month, year, status: 'draft' }])
      .select("id")
      .single();

    if (error) return res.status(500).json({ error: error.message });

    for (const emp of employees) {
      const salaryBase = emp.salary_base || 0;
      const foodAllowance = emp.food_allowance || 0;
      const transportAllowance = emp.transport_allowance || 0;
      const otherDeductions = emp.other_deductions || 0;
      const grossSalary = salaryBase + foodAllowance + transportAllowance;

      let inssEmployee = 0, inssEmployer = 0, irt = 0;

      if (emp.is_service_provider) {
        irt = grossSalary * 0.065;
      } else {
        inssEmployee = salaryBase * 0.03;
        inssEmployer = salaryBase * 0.08;
        const taxableFood = Math.max(0, foodAllowance - 30000);
        const taxableTransport = Math.max(0, transportAllowance - 30000);
        const taxableIncome = salaryBase - inssEmployee + taxableFood + taxableTransport;
        irt = calculateIRT(taxableIncome);
      }

      const netSalary = grossSalary - inssEmployee - irt - otherDeductions;

      await supabase.from("hr_payroll_items").insert([{
        payroll_id: payroll.id,
        employee_id: emp.id,
        salary_base: salaryBase,
        food_allowance: foodAllowance,
        transport_allowance: transportAllowance,
        gross_salary: grossSalary,
        inss_employee: inssEmployee,
        inss_employer: inssEmployer,
        irt: irt,
        other_deductions: otherDeductions,
        net_salary: netSalary
      }]);

      totalGross += grossSalary;
      totalNet += netSalary;
      totalInssEmployee += inssEmployee;
      totalInssEmployer += inssEmployer;
      totalIrt += irt;
      totalOtherDeductions += otherDeductions;
    }

    await supabase
      .from("hr_payrolls")
      .update({
        total_gross: totalGross,
        total_net: totalNet,
        total_inss_employee: totalInssEmployee,
        total_inss_employer: totalInssEmployer,
        total_irt: totalIrt,
        total_other_deductions: totalOtherDeductions
      })
      .eq("id", payroll.id);

    res.json({ id: payroll.id });
  });

  app.put("/api/hr/payrolls/:id/finalize", authenticate, async (req: any, res) => {
    const { error } = await supabase
      .from("hr_payrolls")
      .update({ status: 'finalized' })
      .eq("id", req.params.id)
      .eq("company_id", req.user.company_id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  app.delete("/api/hr/payrolls/:id", authenticate, async (req: any, res) => {
    // Delete items first
    await supabase.from("hr_payroll_items").delete().eq("payroll_id", req.params.id);
    const { error } = await supabase
      .from("hr_payrolls")
      .delete()
      .eq("id", req.params.id)
      .eq("company_id", req.user.company_id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  // HR Dashboard Stats
  app.get("/api/hr/stats", authenticate, async (req: any, res) => {
    const companyId = req.user.company_id;
    const { count: employeeCount } = await supabase.from("hr_employees").select("*", { count: 'exact', head: true }).eq("company_id", companyId).eq("status", "active");
    const { count: departmentCount } = await supabase.from("hr_departments").select("*", { count: 'exact', head: true }).eq("company_id", companyId);

    const { data: lastPayroll } = await supabase
      .from("hr_payrolls")
      .select("*")
      .eq("company_id", companyId)
      .order("year", { ascending: false })
      .order("month", { ascending: false })
      .limit(1)
      .single();

    res.json({
      employees: employeeCount || 0,
      departments: departmentCount || 0,
      lastPayroll: lastPayroll || null
    });
  });

  // --- FIM MÓDULO RECURSOS HUMANOS APIs ---

  // --- PROCUREMENT & INVENTORY APIs ---
  app.get("/api/purchase-orders", authenticate, async (req: any, res) => {
    const { data: orders, error } = await supabase
      .from("purchase_orders")
      .select("*, suppliers(name), items:purchase_order_items(id)")
      .eq("company_id", req.user.company_id)
      .order("created_at", { ascending: false });

    const formatted = orders?.map((o: any) => ({
      ...o,
      supplier_name: o.suppliers?.name,
      items_count: o.items?.length || 0
    }));

    res.json(formatted || []);
  });

  app.post("/api/purchase-orders", authenticate, async (req: any, res) => {
    const { supplier_id, items } = req.body;
    const total_amount = items.reduce((acc: number, curr: any) => acc + (curr.quantity * curr.cost), 0);

    const branchId = req.user.branch_id || 1;
    const { data: order, error: orderError } = await supabase
      .from("purchase_orders")
      .insert([{
        company_id: req.user.company_id,
        branch_id: branchId,
        supplier_id,
        total_amount,
        status: 'pending'
      }])
      .select("id")
      .single();

    if (orderError) return res.status(500).json({ error: orderError.message });

    for (const item of items) {
      await supabase.from("purchase_order_items").insert([{
        purchase_order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        cost_price: item.cost
      }]);
    }

    res.json({ id: order.id });
  });

  app.post("/api/purchase-orders/:id/receive", authenticate, async (req: any, res) => {
    try {
      const { data: order, error: oError } = await supabase
        .from("purchase_orders")
        .select("*")
        .eq("id", req.params.id)
        .eq("company_id", req.user.company_id)
        .single();

      if (oError) return res.status(500).json({ error: oError.message });
      if (!order || order.status !== 'pending') return res.status(400).json({ error: "Ordem de compra inválida ou já recebida" });

      const { data: items, error: iError } = await supabase
        .from("purchase_order_items")
        .select("*")
        .eq("purchase_order_id", req.params.id);

      if (iError) return res.status(500).json({ error: iError.message });
      if (!items) return res.status(400).json({ error: "Itens não encontrados" });

      for (const item of items) {
        // Update product stock and cost price
        const { data: product, error: pError } = await supabase.from("products").select("stock").eq("id", item.product_id).single();
        if (pError) return res.status(500).json({ error: pError.message });

        if (product) {
          const { error: updateError } = await supabase
            .from("products")
            .update({
              stock: product.stock + item.quantity,
              cost_price: item.cost_price
            })
            .eq("id", item.product_id);
          if (updateError) return res.status(500).json({ error: updateError.message });
        }

        // Record stock movement
        const { error: movementError } = await supabase.from("stock_movements").insert([{
          company_id: req.user.company_id,
          branch_id: req.user.branch_id,
          product_id: item.product_id,
          type: 'in',
          quantity: item.quantity,
          reason: `Ordem de Compra OC-${req.params.id}`,
          user_id: req.user.id
        }]);
        if (movementError) return res.status(500).json({ error: movementError.message });
      }

      // Update order status
      const { error: updateOrderError } = await supabase.from("purchase_orders").update({ status: 'received' }).eq("id", req.params.id);
      if (updateOrderError) return res.status(500).json({ error: updateOrderError.message });

      // Create expense in accounts payable
      const { error: expenseError } = await supabase.from("expenses").insert([{
        company_id: req.user.company_id,
        supplier_id: order.supplier_id,
        description: `Pagamento OC-${req.params.id}`,
        amount: order.total_amount,
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'pending'
      }]);
      if (expenseError) return res.status(500).json({ error: expenseError.message });

      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get("/api/inventory/movements", authenticate, async (req: any, res) => {
    const { data: movements, error } = await supabase
      .from("stock_movements")
      .select("*, products(name), users(name)")
      .eq("company_id", req.user.company_id)
      .order("created_at", { ascending: false });

    const formatted = movements?.map((m: any) => ({
      ...m,
      product_name: m.products?.name,
      user_name: m.users?.name
    }));

    res.json(formatted || []);
  });

  app.post("/api/inventory/movements", authenticate, async (req: any, res) => {
    const { product_id, quantity, type, reason } = req.body;

    const branchId = req.user.branch_id || 1;
    // Record movement
    const { error: movementError } = await supabase.from("stock_movements").insert([{
      company_id: req.user.company_id,
      branch_id: branchId,
      product_id,
      type,
      quantity,
      reason,
      user_id: req.user.id
    }]);

    if (movementError) return res.status(500).json({ error: movementError.message });

    // Update product stock
    const stockChange = type === 'in' ? quantity : -quantity;
    const { data: product } = await supabase.from("products").select("stock").eq("id", product_id).single();

    if (product) {
      await supabase
        .from("products")
        .update({ stock: product.stock + stockChange })
        .eq("id", product_id);
    }

    res.json({ success: true });
  });

  // Activity Logs API
  app.get("/api/activity-logs", authenticate, isAdmin, async (req: any, res) => {
    try {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("*")
        .eq("company_id", req.user.company_id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      res.json(data || []);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- MASTER ADMIN APIs ---
  app.get("/api/saas/master/stats", authenticate, isMaster, async (req, res) => {
    try {
      const { data: companies } = await supabase.from("companies").select("id");
      const { data: payments } = await supabase.from("saas_payments").select("amount").eq("status", "approved");
      const { data: pending } = await supabase.from("saas_payments").select("id").eq("status", "pending");

      const mrr = payments?.reduce((acc, curr) => acc + curr.amount, 0) || 0;

      res.json({
        totalCompanies: companies?.length || 0,
        mrr: mrr,
        pendingPayments: pending?.length || 0
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/saas/master/companies", authenticate, isMaster, async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("companies")
        .select(`
          *,
          saas_subscriptions!company_id (
            status,
            saas_plans (name)
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      res.json(data || []);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/saas/master/approve-subscription", authenticate, isMaster, async (req, res) => {
    const { company_id } = req.body;
    try {
      // 1. Update company status
      await supabase.from("companies").update({ status: 'active' }).eq("id", company_id);

      // 2. Update subscription status if exists
      await supabase.from("saas_subscriptions").update({ status: 'active' }).eq("company_id", company_id);

      // 3. Mark payments as approved
      await supabase.from("saas_payments").update({ status: 'approved' }).eq("company_id", company_id);

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // SaaS Plans Management
  app.get("/api/saas/plans", async (req, res) => {
    try {
      const { data, error } = await supabase.from("saas_plans").select("*").order("price_monthly");
      if (error) throw error;
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/saas/master/plans", authenticate, isMaster, async (req, res) => {
    try {
      const { data, error } = await supabase.from("saas_plans").insert(req.body).select();
      if (error) throw error;
      res.json(data[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/saas/master/plans/:id", authenticate, isMaster, async (req, res) => {
    try {
      const { data, error } = await supabase.from("saas_plans").update(req.body).eq("id", req.params.id).select();
      if (error) throw error;
      res.json(data[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/saas/master/plans/:id", authenticate, isMaster, async (req, res) => {
    try {
      const { error } = await supabase.from("saas_plans").delete().eq("id", req.params.id);
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- FIM PROCUREMENT & INVENTORY APIs ---

  // --- SYSTEM CONFIGURATION ---
  app.get("/api/system/config", async (req, res) => {
    try {
      const { data, error } = await supabase.from("system_config").select("key, value").eq("is_public", true);
      if (error) throw error;

      const config: any = {};
      data.forEach(item => { config[item.key] = item.value; });
      res.json(config);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/saas/master/config", authenticate, isMaster, async (req, res) => {
    try {
      const { data, error } = await supabase.from("system_config").select("*");
      if (error) throw error;
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/saas/master/config/:key", authenticate, isMaster, async (req, res) => {
    try {
      const { data, error } = await supabase.from("system_config").update({ value: req.body.value }).eq("key", req.params.key).select();
      if (error) throw error;
      res.json(data[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });


  const PORT = process.env.PORT || 3000;
  // Certified Document Generation (Universal)
  // Certified Document Generation (Universal)
  app.post('/api/documents', authenticate, async (req: any, res: any) => {
    const { type, items, customer_name, customer_id, metadata, company_id, is_exempt, exemption_reason } = req.body;
    console.log('📄 [DOCS] Início de emissão:', { type, customer_name, customer_id, company_id });

    if (!type || !items || !customer_name) {
      console.log('⚠️ [DOCS] Campos em falta:', { type, items_len: items?.length, customer_name });
      return res.status(400).json({ error: 'Missing required fields (type, items, customer_name)' });
    }

    try {
      const doc_type = type === 'Factura' ? 'FAC' :
        type === 'Factura-Recibo' ? 'FR' :
          type === 'Recibo' ? 'RE' :
            type === 'Nota de Crédito' ? 'NC' :
              type === 'Nota de Débito' ? 'ND' : 'PRO';

      const year = new Date().getFullYear();
      const series_name = String(year);
      const effCompanyId = company_id || req.user.company_id;

      // 1. Get/Update Sequence
      console.log('📄 [DOCS] Verificando série:', { doc_type, series_name });
      let { data: bSeries, error: sError } = await supabase
        .from('billing_series')
        .select('*')
        .eq('doc_type', doc_type)
        .eq('series_name', series_name)
        .eq('company_id', effCompanyId)
        .single();

      if (sError && sError.code !== 'PGRST116') {
        console.log('❌ [DOCS] Erro na série:', sError);
        throw sError;
      }

      let nextNum = 1;
      if (bSeries) {
        nextNum = (bSeries.last_number || 0) + 1;
        console.log('📄 [DOCS] Atualizando número para:', nextNum);
        await supabase.from('billing_series').update({ last_number: nextNum, updated_at: new Date().toISOString() }).eq('id', bSeries.id);
      } else {
        console.log('📄 [DOCS] Criando nova série:', { doc_type, series_name });
        await supabase.from('billing_series').insert({
          doc_type,
          series_name,
          last_number: 1,
          company_id: effCompanyId,
          is_active: true
        });
      }

      const paddedNumber = String(nextNum).padStart(3, '0');
      const docNumber = `${doc_type}-${series_name}/${paddedNumber}`;
      console.log('📄 [DOCS] Número gerado:', docNumber);

      // 2. Calculate Totals (Safely)
      const subtotal = items.reduce((acc: number, i: any) => {
        const itemVal = Number(i.total || (Number(i.qtd || 0) * Number(i.preco_unitario || 0)));
        return acc + (isNaN(itemVal) ? 0 : itemVal);
      }, 0);

      const iva = is_exempt ? 0 : subtotal * 0.14;
      const finalTotal = subtotal + (isNaN(iva) ? 0 : iva);
      console.log('📄 [DOCS] Totais:', { subtotal, iva, finalTotal });

      // 3. Security Hash - 🚀 PERFORMANCE OPTIMIZATION: Parallel Metadata
      const [
        { data: lastDoc },
        { data: companyData },
        { data: config },
        { data: keys }
      ] = await Promise.all([
        supabase.from('contabil_faturas').select('hash').eq('company_id', effCompanyId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from("companies").select("nif").eq("id", effCompanyId).single(),
        supabase.from('agt_configs').select('cert_number').eq('company_id', effCompanyId).maybeSingle(),
        supabase.from('agt_keys').select('private_key').eq('company_id', effCompanyId).eq('is_active', true).maybeSingle()
      ]);

      const companyNif = companyData?.nif || '999999999';
      const prevHash = lastDoc?.hash || '';

      const certNo = config?.cert_number || '0000/AGT/2026';
      const cert_phrase = `Processado por programa validado n.º ${certNo}/AGT`;

      const hashDate = new Date().toISOString();
      const hashString = prepareHashString(docNumber, hashDate, finalTotal, companyNif);
      const hash = generateHash(hashString, prevHash);

      const paid = (doc_type === 'FR') ? finalTotal : (Number(req.body.amount_paid) || 0);
      const debt = Math.max(0, finalTotal - paid);
      let docStatus = 'PENDENTE';
      if (paid >= finalTotal) docStatus = 'PAGO';
      else if (paid > 0) docStatus = 'PARCIAL';

      // Cálculo de vencimento padrão (30 dias)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);
      const dueDateStr = dueDate.toISOString().split('T')[0];

      const insertData: any = {
        numero_fatura: docNumber,
        cliente_id: req.body.cliente_id, // Ensure cliente_id is stored
        cliente_nome: customer_name,
        data_emissao: new Date().toISOString().split('T')[0],
        data_vencimento: dueDateStr,
        valor_total: finalTotal,
        valor_pago: paid,
        valor_em_divida: debt,
        status: docStatus,
        company_id: effCompanyId,
        type_prefix: doc_type, // Map doc_type to type_prefix
        tipo: type, // Add tipo for frontend compatibility
        hash,
        prev_hash: prevHash,
        agt_phrase: cert_phrase,
        is_exempt: !!is_exempt,
        exemption_reason: exemption_reason || null,
        metadata: {
          items: items || [],
          subtotal: Number(subtotal) || 0,
          iva: Number(iva) || 0,
          finalTotal: Number(finalTotal) || 0,
          amount_paid: paid,
          change: Number(req.body.change) || 0,
          customer_nif: req.body.customer_nif || '999999999'
        }
      };

      console.log('📄 [DOCS] Dados para inserção:', JSON.stringify(insertData, null, 2));
      console.log('📄 [DOCS] Inserindo no Supabase...');
      const { data: doc, error: dError } = await supabase.from('contabil_faturas').insert(insertData).select().single();

      if (doc && paid > 0) {
        // Registar histórico inicial
        await supabase.from('fin_pagamentos_historico').insert({
          documento_id: doc.id,
          origem: 'FATURA',
          valor: paid,
          metodo: 'Pagamento no Ato',
          company_id: effCompanyId
        });
      }

      if (dError) {
        console.log('❌ [DOCS] Erro detalhado na inserção:', JSON.stringify(dError, null, 2));
        // Fallback for metadata if column is missing (temporarily to avoid crash)
        if (dError.message?.includes('metadata') || dError.code === '42703') {
          console.log('⚠️ [DOCS] Coluna metadata em falta. Tentando sem metadata...');
          const { metadata, ...fallbackData } = insertData;
          const { data: docF, error: dErrorF } = await supabase.from('contabil_faturas').insert(fallbackData).select().single();
          if (dErrorF) throw dErrorF;
          // Devolvemos o documento com os metadados (mesmo não gravados) para que a impressão imediata funcione
          return res.json({ success: true, doc: { ...docF, metadata: insertData.metadata }, cert_phrase });
        }
        throw dError;
      }

      console.log('✅ [DOCS] Documento emitido com sucesso:', doc.numero_fatura);

      // --- ACCOUNTING INTEGRATION ---
      try {
        const { data: activePeriod } = await supabase
          .from('acc_periodos')
          .select('id')
          .eq('company_id', effCompanyId)
          .eq('status', 'Aberto')
          .order('ano', { ascending: false })
          .order('mes', { ascending: false })
          .limit(1)
          .single();

        if (activePeriod) {
          // 1. Factura (Deb: Cliente, Cred: Receita)
          const { data: lnc, error: lError } = await supabase.from('acc_lancamentos').insert({
            company_id: effCompanyId,
            periodo_id: activePeriod.id,
            data: new Date().toISOString().split('T')[0],
            descricao: `Emissão de ${type} ${docNumber}`,
            tipo: 'Venda',
            valor_total: finalTotal,
            status: 'Confirmado'
          }).select().single();

          if (lnc) {
            await supabase.from('acc_lancamento_itens').insert([
              { lancamento_id: lnc.id, company_id: effCompanyId, conta_id: '3.1', debito: finalTotal, credito: 0, descricao: 'Débito em conta de cliente' },
              { lancamento_id: lnc.id, company_id: effCompanyId, conta_id: '6.1', debito: 0, credito: finalTotal, descricao: 'Receita de vendas' }
            ]);
          }

          // 2. Pagamento Imediato (FR ou Pagamento à cabeça)
          if (paid > 0) {
            const { data: pLnc } = await supabase.from('acc_lancamentos').insert({
              company_id: effCompanyId,
              periodo_id: activePeriod.id,
              data: new Date().toISOString().split('T')[0],
              descricao: `Recebimento de ${type} ${docNumber}`,
              tipo: 'Tesouraria',
              valor_total: paid,
              status: 'Confirmado'
            }).select().single();

            if (pLnc) {
              await supabase.from('acc_lancamento_itens').insert([
                { lancamento_id: pLnc.id, company_id: effCompanyId, conta_id: '1.1', debito: paid, credito: 0, descricao: 'Entrada em Caixa' },
                { lancamento_id: pLnc.id, company_id: effCompanyId, conta_id: '3.1', debito: 0, credito: paid, descricao: 'Liquidação de cliente' }
              ]);
            }
          }
        }
      } catch (accErr) {
        console.error('⚠️ [DOCS] Erro na integração contabilística:', accErr);
      }

      return res.json({ success: true, doc, cert_phrase });

      if (!doc) {
        console.log('❌ [DOCS] Documento retornado nulo');
        throw new Error("Erro ao confirmar criação do documento no banco.");
      }

      // 5. Async Logging
      logActivity(req, 'CREATE', 'contabil_faturas', `Documento ${docNumber} emitido.`, { doc_id: doc.id, type });

      // INTEGRAÇÃO AGT: Envia fatura em background se auto_send = true
      onInvoiceCreated({
        id: doc.id,
        invoice_number: doc.document_number,
        total: doc.total_amount,
        subtotal: doc.tax_base_amount,
        tax: doc.tax_amount,
        customer_nif: doc.customer_nif,
        is_pro_forma: doc.type === 'Proforma' || doc.type === 'Proforma (PP)'
      });

      console.log('✅ [DOCS] Sucesso:', docNumber);
      res.json(doc);
    } catch (err: any) {
      console.error('❌ [DOCS] Erro fatal:', err);
      res.status(500).json({ error: err.message || 'Erro interno ao processar documento' });
    }
  });

  app.post("/api/documents/:id/payment", authenticate, async (req: any, res) => {
    const { id } = req.params;
    const { amount, payment_method } = req.body;
    const effCompanyId = req.user.company_id;

    if (!amount || amount <= 0) return res.status(400).json({ error: "Valor de pagamento inválido" });

    try {
      // 1. Fetch current document
      const { data: doc, error: fError } = await supabase
        .from('contabil_faturas')
        .select('*')
        .eq('id', id)
        .eq('company_id', effCompanyId)
        .single();

      if (fError || !doc) return res.status(404).json({ error: "Documento não encontrado" });

      const newPaid = Number(doc.valor_pago || 0) + Number(amount);
      const newDebt = Math.max(0, Number(doc.valor_total) - newPaid);

      let newStatus = 'PENDENTE';
      if (newPaid >= Number(doc.valor_total)) newStatus = 'PAGO';
      else if (newPaid > 0) newStatus = 'PARCIAL';

      // 2. Update document
      const { error: uError } = await supabase
        .from('contabil_faturas')
        .update({
          valor_pago: newPaid,
          valor_em_divida: newDebt,
          status: newStatus
        })
        .eq('id', id);

      if (uError) throw uError;

      // --- HISTORICO DE PAGAMENTO ---
      await supabase.from('fin_pagamentos_historico').insert({
        documento_id: id,
        origem: 'FATURA',
        valor: amount,
        metodo: 'Liquidação Parcial/Total',
        company_id: effCompanyId
      });

      // --- ACCOUNTING INTEGRATION (PAYMENT) ---
      try {
        const { data: activePeriod } = await supabase
          .from('acc_periodos')
          .select('id')
          .eq('company_id', effCompanyId)
          .eq('status', 'Aberto')
          .order('ano', { ascending: false })
          .order('mes', { ascending: false })
          .limit(1)
          .single();

        if (activePeriod) {
          const { data: pLnc } = await supabase.from('acc_lancamentos').insert({
            company_id: effCompanyId,
            periodo_id: activePeriod.id,
            data: new Date().toISOString().split('T')[0],
            descricao: `Recebimento Parcial/Total: ${doc.numero_fatura}`,
            tipo: 'Tesouraria',
            valor_total: amount,
            status: 'Confirmado'
          }).select().single();

          if (pLnc) {
            await supabase.from('acc_lancamento_itens').insert([
              { lancamento_id: pLnc.id, company_id: effCompanyId, conta_id: '1.1', debito: amount, credito: 0, descricao: 'Entrada em Caixa' },
              { lancamento_id: pLnc.id, company_id: effCompanyId, conta_id: '3.1', debito: 0, credito: amount, descricao: 'Liquidação de cliente' }
            ]);
          }
        }
      } catch (accErr) {
        console.error('⚠️ [PAY] Erro na integração contabilística:', accErr);
      }

      logActivity(req, 'PAYMENT', 'contabil_faturas', `Pagamento de ${amount} registado para ${doc.numero_fatura}. Novo Saldo: ${newDebt}`, { doc_id: id, amount });

      res.json({ success: true, new_status: newStatus, new_debt: newDebt });
    } catch (err: any) {
      console.error('❌ [PAY] Erro ao registar pagamento:', err);
      res.status(500).json({ error: err.message || 'Erro ao processar pagamento' });
    }
  });

  app.post("/api/documents/:id/cancel", authenticate, async (req: any, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const effCompanyId = req.user.company_id;

    try {
      console.log(`📄 [DOCS] Anulando documento ${id}...`);
      const { data: doc, error: fError } = await supabase
        .from('contabil_faturas')
        .select('*')
        .eq('id', id)
        .eq('company_id', effCompanyId)
        .single();

      if (fError || !doc) return res.status(404).json({ error: "Documento não encontrado" });
      if (doc.status === 'Anulado') return res.status(400).json({ error: "Este documento já foi anulado" });

      const { error: uError } = await supabase
        .from('contabil_faturas')
        .update({ status: 'Anulado' })
        .eq('id', id);

      if (uError) throw uError;

      logActivity(req, 'CANCEL', 'contabil_faturas', `Documento ${doc.numero_fatura} anulado. Motivo: ${reason || 'N/A'}`, { doc_id: id });

      res.json({ success: true });
    } catch (err: any) {
      console.error('❌ [DOCS] Erro ao anular:', err);
      res.status(500).json({ error: err.message || 'Erro ao anular documento' });
    }
  });


  // --- NOVO: ENDPOINT CONTAS A RECEBER ---
  app.get('/api/receivables', authenticate, async (req: any, res) => {
    try {
      const effCompanyId = req.query.company_id || req.user.company_id;
      const { data, error } = await supabase
        .from('contabil_faturas')
        .select('*')
        .eq('company_id', effCompanyId)
        .gt('valor_em_divida', 0)
        .neq('status', 'Anulado')
        .order('data_vencimento', { ascending: true });

      if (error) throw error;

      const now = new Date().toISOString().split('T')[0];
      const enhancedData = data.map(d => ({
        ...d,
        is_overdue: d.data_vencimento ? d.data_vencimento < now : false
      }));

      res.json(enhancedData);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- NOVO: HISTÓRICO DE PAGAMENTOS ---
  app.get('/api/documents/:id/history', authenticate, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { data, error } = await supabase
        .from('fin_pagamentos_historico')
        .select('*')
        .eq('documento_id', id)
        .order('data', { ascending: false });

      if (error) throw error;
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── MÓDULO SAF-T (AOA) XML ────────────────────────────────────────────────
  // Módulo independente de geração do ficheiro SAF-T (AOA) XML

  // Rotas: GET /api/saft/export, /api/saft/preview, /api/saft/history
  registerSaftRoutes(app, authenticate);

  // Vite middleware (MUST BE AFTER ALL API ROUTES)
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // Global Error Handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('🔥 [GLOBAL ERROR]:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  });
}

startServer();

