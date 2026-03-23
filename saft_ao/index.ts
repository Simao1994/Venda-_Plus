/**
 * SAF-T (AOA) XML — Módulo Independente

 * Ponto de entrada público — exporta o gerador e registra as rotas no Express
 *
 * Uso em server.ts:
 *   import { registerSaftRoutes } from './saft_ao';
 *   registerSaftRoutes(app, authenticate);
 */

export { generateSaftXml } from './generator';
export type { SaftGenerationParams, SaftGenerationResult } from './types';

import type { Express } from 'express';
import { generateSaftXml } from './generator';
import { supabase } from '../src/lib/supabase';

/**
 * Regista as rotas do módulo SAF-T no servidor Express.
 *
 * Rotas adicionadas:
 *   GET  /api/saft/export        — Gera e descarrega o XML SAF-T
 *   GET  /api/saft/preview       — Devolve metadados sem gerar XML completo
 *   GET  /api/saft/history       — Lista ficheiros SAF-T gerados anteriormente
 */
export function registerSaftRoutes(app: Express, authenticate: any): void {

    /**
     * POST /api/saft/export
     * Gera o ficheiro SAF-T (AOA) XML e envia como download

     *
     * Body: { fiscal_year: number, start_date: string, end_date: string }
     * ou Query: ?year=2026&start=2026-01-01&end=2026-12-31
     */
    app.get('/api/saft/export', authenticate, async (req: any, res: any) => {
        try {
            // Apenas admin e master podem exportar SAF-T
            if (!['admin', 'master'].includes(req.user.role)) {
                return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem exportar o SAF-T.' });
            }

            const year = parseInt(String(req.query.year || new Date().getFullYear()));
            const startDate = String(req.query.start || `${year}-01-01`);
            const endDate = String(req.query.end || `${year}-12-31`);

            // Validação de datas
            if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
                return res.status(400).json({ error: 'Formato de data inválido. Use YYYY-MM-DD.' });
            }
            if (new Date(endDate) < new Date(startDate)) {
                return res.status(400).json({ error: 'A data de fim deve ser posterior à data de início.' });
            }

            console.log(`[SAF-T AOA XML] Pedido de exportação por ${req.user.email} — Período: ${startDate} → ${endDate}`);


            const result = await generateSaftXml({
                company_id: req.user.company_id,
                fiscal_year: year,
                start_date: startDate,
                end_date: endDate,
            });

            // Guardar log de geração (não bloqueia a resposta em caso de falha)
            (async () => {
                try {
                    await supabase.from('saft_generation_logs').insert({
                        company_id: req.user.company_id,
                        user_id: req.user.id,
                        fiscal_year: year,
                        start_date: startDate,
                        end_date: endDate,
                        filename: result.filename,
                        total_invoices: result.stats.totalInvoices,
                        total_payments: result.stats.totalPayments,
                        total_gross_value: result.stats.totalGrossValue,
                        generated_at: result.stats.generatedAt,
                    });
                } catch (logErr: any) {
                    console.warn('[SAF-T AOA XML] Aviso: não foi possível guardar log de geração:', logErr.message);

                }
            })();


            // Enviar como ficheiro XML para download
            res.setHeader('Content-Type', 'application/xml; charset=UTF-8');
            res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
            res.setHeader('X-SAF-T-Invoices', result.stats.totalInvoices);
            res.setHeader('X-SAF-T-GrossTotal', result.stats.totalGrossValue.toFixed(2));
            res.send(result.xml);

        } catch (err: any) {
            console.error('[SAF-T AOA XML] Erro na exportação:', err.message);

            res.status(500).json({ error: `Erro ao gerar SAF-T: ${err.message}` });
        }
    });

    /**
     * GET /api/saft/preview
     * Devolve estatísticas do período sem gerar o XML completo.
     * Útil para mostrar ao utilizador quantos documentos serão incluídos.
     */
    app.get('/api/saft/preview', authenticate, async (req: any, res: any) => {
        try {
            if (!['admin', 'master'].includes(req.user.role)) {
                return res.status(403).json({ error: 'Acesso negado.' });
            }

            const year = parseInt(String(req.query.year || new Date().getFullYear()));
            const startDate = String(req.query.start || `${year}-01-01`);
            const endDate = String(req.query.end || `${year}-12-31`);

            const [salesResult, paymentsResult, customersResult, productsResult] = await Promise.all([
                supabase.from('sales').select('id, total, subtotal, tax', { count: 'exact' })
                    .eq('company_id', req.user.company_id)
                    .gte('created_at', `${startDate}T00:00:00`)
                    .lte('created_at', `${endDate}T23:59:59`),
                supabase.from('payments').select('id, amount', { count: 'exact' })
                    .eq('company_id', req.user.company_id)
                    .gte('created_at', `${startDate}T00:00:00`)
                    .lte('created_at', `${endDate}T23:59:59`),
                supabase.from('customers').select('id', { count: 'exact' })
                    .eq('company_id', req.user.company_id),
                supabase.from('products').select('id', { count: 'exact' })
                    .eq('company_id', req.user.company_id),
            ]);

            const sales = salesResult.data || [];
            const totalNet = sales.reduce((s: number, v: any) => s + Number(v.subtotal || 0), 0);
            const totalTax = sales.reduce((s: number, v: any) => s + Number(v.tax || 0), 0);
            const totalGross = sales.reduce((s: number, v: any) => s + Number(v.total || 0), 0);

            res.json({
                period: { year, start_date: startDate, end_date: endDate },
                stats: {
                    totalInvoices: salesResult.count || 0,
                    totalPayments: paymentsResult.count || 0,
                    totalCustomers: customersResult.count || 0,
                    totalProducts: productsResult.count || 0,
                    totalNetValue: totalNet,
                    totalTaxValue: totalTax,
                    totalGrossValue: totalGross,
                },
                readyToExport: true,
            });
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    });

    /**
     * GET /api/saft/history
     * Lista histórico de ficheiros SAF-T gerados pela empresa
     */
    app.get('/api/saft/history', authenticate, async (req: any, res: any) => {
        try {
            if (!['admin', 'master'].includes(req.user.role)) {
                return res.status(403).json({ error: 'Acesso negado.' });
            }

            const { data, error } = await supabase
                .from('saft_generation_logs')
                .select('*')
                .eq('company_id', req.user.company_id)
                .order('generated_at', { ascending: false })
                .limit(50);

            if (error) {
                // Tabela pode não existir ainda — retorna lista vazia
                return res.json([]);
            }

            res.json(data || []);
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    });

    console.log('✅ [SAF-T AOA XML] Rotas registadas: GET /api/saft/export, /api/saft/preview, /api/saft/history');

}
