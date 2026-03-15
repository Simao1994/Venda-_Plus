import express from "express";
import dotenv from "dotenv";
dotenv.config();

import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { supabase } from "./src/lib/supabase";
import { syncDatabaseSchema } from "./src/lib/database-sync";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-erp-key";
import { runMigration } from "./src/lib/migrations-manager.ts";

// Note: Database schema initialization is now handled via supabase_schema.sql
// which should be run in the Supabase Dashboard SQL Editor.

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

  // Sync database schema on startup (Non-blocking)
  syncDatabaseSchema().then(() => {
    console.log('✅ Database Schema Sync Complete');
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
  app.use(express.json());

  // Auth Middleware
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
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

  // Auth Routes
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const { data: user, error } = await supabase
      .from("users")
      .select("*, companies(name, currency)")
      .eq("email", email)
      .single();

    if (error) {
      console.error('❌ Erro na consulta de login (Supabase):', error.message);
      return res.status(401).json({ error: "Credenciais inválidas (Erro de Ligação)" });
    }
    if (!user) {
      console.error(`❌ Utilizador não encontrado: ${email}`);
      return res.status(401).json({ error: "Credenciais inválidas (Utilizador)" });
    }

    const matches = bcrypt.compareSync(password, user.password);
    if (!matches) {
      console.error(`❌ Senha incorreta para: ${email}`);
      return res.status(401).json({ error: "Credenciais inválidas (Senha)" });
    }

    console.log(`✅ Login bem-sucedido: ${email}`);

    // @ts-ignore
    const companies = user.companies;
    const token = jwt.sign({
      id: user.id,
      company_id: user.company_id,
      branch_id: user.branch_id,
      role: user.role
    }, JWT_SECRET);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        company_id: user.company_id,
        company_name: companies?.name,
        currency: companies?.currency,
        branch_id: user.branch_id,
        is_master: user.role === 'master'
      }
    });
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
      const { data: company, error: cError } = await supabase.from("companies").insert([{ name, email, status: initialStatus }]).select("id").single();
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
      res.json({ success: true, company_id: company.id });
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
    const tables = ['products', 'customers', 'sales', 'expenses', 'users', 'medicamentos'];
    const results: any = {};

    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .eq('company_id', req.user.company_id);

      if (!error) results[table] = count;
    }

    res.json(results);
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

  // User Management
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
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Acesso negado" });
    const { name, nif, address, phone, email, tax_percentage, currency } = req.body;
    const { error } = await supabase
      .from("companies")
      .update({ name, nif, address, phone, email, tax_percentage, currency })
      .eq("id", req.user.company_id);

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
    const { name, barcode, category_id, supplier_id, unit, cost_price, sale_price, tax_percentage, stock, min_stock, image } = req.body;
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
        image
      }])
      .select("id")
      .single();


    if (error) return res.status(500).json({ error: error.message });
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

  // Accounts Receivable (Contas a Receber)
  app.get("/api/financial/receivable", authenticate, async (req: any, res) => {
    const { data: pendingSales, error } = await supabase
      .from("sales")
      .select("*, customers(name)")
      .eq("company_id", req.user.company_id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    const formatted = pendingSales?.map((s: any) => ({
      ...s,
      customer_name: s.customers?.name
    }));

    res.json(formatted || []);
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

  app.post("/api/payments", authenticate, async (req: any, res) => {
    const { sale_id, amount, payment_method } = req.body;

    // Record payment
    const { error: payError } = await supabase
      .from("payments")
      .insert([{
        company_id: req.user.company_id,
        sale_id,
        amount,
        payment_method
      }]);

    if (payError) return res.status(500).json({ error: payError.message });

    // Update sale
    const { data: sale } = await supabase.from("sales").select("*").eq("id", sale_id).single();
    if (!sale) return res.status(404).json({ error: "Venda não encontrada" });

    const newAmountPaid = (sale.amount_paid || 0) + amount;
    const newStatus = newAmountPaid >= sale.total ? 'paid' : 'pending';

    await supabase
      .from("sales")
      .update({ amount_paid: newAmountPaid, status: newStatus })
      .eq("id", sale_id);

    // Update customer balance
    if (sale.customer_id) {
      const { data: customer } = await supabase.from("customers").select("balance").eq("id", sale.customer_id).single();
      if (customer) {
        await supabase
          .from("customers")
          .update({ balance: (customer.balance || 0) - amount })
          .eq("id", sale.customer_id);
      }
    }

    res.json({ sale_id, newAmountPaid, newStatus });
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
    const { data: sales, error } = await supabase
      .from("sales")
      .select("*, customers(name), items:sale_items(*, products(name))")
      .eq("company_id", req.user.company_id)
      .order("created_at", { ascending: false });

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
    const { items, customer_id, subtotal, tax, total, amount_paid, change, payment_method } = req.body;
    const invoice_number = `FAC-${Date.now()}`;
    const status = payment_method === 'credit' ? 'pending' : 'paid';

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

    console.log(`[Venda] Final branch_id: ${branchId}`);

    try {
      // 1. Create Sale
      const { data: saleData, error: saleError } = await supabase
        .from("sales")
        .insert([{
          company_id: req.user.company_id,
          branch_id: branchId,
          user_id: req.user.id,
          customer_id: customer_id || null,
          total,
          subtotal,
          tax,
          amount_paid,
          change,
          payment_method,
          status,
          invoice_number
        }])
        .select("id")
        .single();

      if (saleError) {
        console.error('❌ Erro Supabase ao inserir venda:', saleError);
        return res.status(500).json({ error: `Erro na BD: ${saleError.message}`, details: saleError });
      }
      const saleId = saleData.id;

      console.log(`[Venda] Preparando saleItems para inserir. Total itens: ${items.length}`);
      const saleItems = items.map((item: any) => {
        const payload = {
          company_id: req.user.company_id,
          sale_id: saleId,
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.sale_price,
          subtotal: item.quantity * item.sale_price
        };
        console.log(`[Venda Item] Product: ${item.name} (${item.id}), Company: ${payload.company_id}`);
        return payload;
      });

      const { error: itemsError } = await supabase.from("sale_items").insert(saleItems);
      if (itemsError) throw itemsError;

      // Update products stock (sequentially or via RPC for safety)
      for (const item of items) {
        const { data: product } = await supabase.from("products").select("stock").eq("id", item.id).single();
        if (product) {
          await supabase.from("products").update({ stock: product.stock - item.quantity }).eq("id", item.id);
        }
      }

      // 3. Update Customer Balance
      if (payment_method === 'credit' && customer_id) {
        const { data: customer } = await supabase.from("customers").select("balance").eq("id", customer_id).single();
        if (customer) {
          await supabase.from("customers").update({ balance: (customer.balance || 0) + total }).eq("id", customer_id);
        }
      }

      res.json({ id: saleId, invoice_number });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Erro ao processar venda" });
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

  app.post("/api/farmacia/vendas", authenticate, async (req: any, res) => {
    const { itens, cliente_id, forma_pagamento, valor_entregue } = req.body;
    const companyId = req.user.company_id;
    const vendedorId = req.user.id;

    let subtotal = itens.reduce((acc: number, item: any) => acc + (item.quantidade * item.preco_unitario), 0);
    const iva = subtotal * 0.14;
    const total = subtotal + iva;
    const troco = valor_entregue ? valor_entregue - total : 0;
    const numero_factura = `FR-FARM-${Date.now()}`;

    let branchId = req.user.branch_id;
    if (!branchId) {
      console.log(`[Venda Farmácia] Utilizador ${req.user.email} sem branch_id. À procura de filial...`);
      let { data: branch } = await supabase.from("branches").select("id").eq("company_id", companyId).limit(1).maybeSingle();

      if (!branch) {
        console.log(`[Venda Farmácia] Nenhuma filial encontrada para empresa ${companyId}. Criando padrão...`);
        const { data: newBranch } = await supabase.from("branches").insert({ company_id: companyId, name: 'Sede Central' }).select("id").single();
        branch = newBranch;
      }
      branchId = branch?.id;
    }

    if (!branchId) {
      console.warn(`[Venda Farmácia] AVISO: branchId continua nulo para ${req.user.email}. Tentando find-any...`);
      const { data: anyBranch } = await supabase.from("branches").select("id").eq("company_id", companyId).limit(1).maybeSingle();
      branchId = anyBranch?.id;
    }

    if (!branchId) {
      console.error(`[Venda Farmácia] ERRO CRÍTICO: Não foi possível determinar branchId para utilizador ${req.user.email} (Empresa: ${companyId})`);
      return res.status(400).json({
        error: "Erro de filial: Falha ao determinar filial na Farmácia.",
        details: "Certifique-se que o utilizador ou empresa possui uma filial válida."
      });
    }

    console.log(`[Venda Farmácia] Final branch_id: ${branchId}`);

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
        forma_pagamento: forma_pagamento || 'dinheiro'
      }])
      .select("id")
      .single();

    if (vendaError) {
      console.error('❌ Erro Supabase ao inserir venda farmácia:', vendaError);
      return res.status(500).json({ error: `Erro na BD Farmácia: ${vendaError.message}`, details: vendaError });
    }

    // Process each item (Lot deduction - FIFO)
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

        // Update lote
        await supabase
          .from("lotes_medicamentos")
          .update({ quantidade_atual: lote.quantidade_atual - qtdDeducao })
          .eq("id", lote.id);

        // Insert sale item
        const itemIva = (qtdDeducao * item.preco_unitario) * 0.14;
        const itemTotalValue = (qtdDeducao * item.preco_unitario) + itemIva;

        const pharmItem = {
          company_id: companyId,
          venda_id: venda.id,
          medicamento_id: item.medicamento_id,
          lote_id: lote.id,
          quantidade: qtdDeducao,
          preco_unitario: item.preco_unitario,
          iva: itemIva,
          total: itemTotalValue
        };
        console.log(`[Venda Farmácia Item] Lote: ${lote.id}, Company: ${pharmItem.company_id}`);

        await supabase.from("itens_venda_farmacia").insert([pharmItem]);

        // Record movement
        await supabase.from("movimentos_stock_farmacia").insert([{
          company_id: companyId,
          medicamento_id: item.medicamento_id,
          lote_id: lote.id,
          tipo_movimento: 'saida_venda',
          quantidade: qtdDeducao,
          utilizador_id: vendedorId
        }]);
      }

      if (qtdRestante > 0) {
        return res.status(400).json({ error: `Stock insuficiente para atender toda a quantidade do medicamento ${item.medicamento_id}` });
      }
    }

    res.json({ success: true, venda_id: venda.id, numero_factura });
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

  // --- MÓDULO RECURSOS HUMANOS APIs ---

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

  // Vite middleware
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


  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
 
