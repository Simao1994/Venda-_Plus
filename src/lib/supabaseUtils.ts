// Utility functions for Supabase interaction
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from './supabase';

/**
 * Opções para a consulta segura
 */
interface SafeQueryOptions<T> {
    retries?: number;
    delay?: number;
    cacheKey?: string;
    cacheTTL?: number; // em ms
    fallbackData?: T | null;
    forceRefresh?: boolean;
}

/**
 * Cache simples em memória
 */
const queryCache = new Map<string, { data: any; count?: number | null; expiry: number }>();

/**
 * Controle de concorrência: rastreia consultas em andamento
 */
const pendingQueries = new Map<string, Promise<any>>();

/**
 * Sistema de Retentativa e Re-conexão (Helper)
 */
export async function safeQuery<T>(
    queryFn: () => PromiseLike<{ data: T | null; error: any; count?: number | null }>,
    options: SafeQueryOptions<T> = {}
): Promise<{ data: T | null; error: any; count?: number | null }> {
    const {
        retries = 3,
        delay = 1000,
        cacheKey,
        cacheTTL = 30000, // 30 segundos por padrão
        fallbackData = null,
        forceRefresh = false
    } = options;

    // 1. Verificar Cache (apenas se tiver cacheKey e for uma leitura)
    if (cacheKey && !forceRefresh) {
        const cached = queryCache.get(cacheKey);
        if (cached && cached.expiry > Date.now()) {
            console.log(`[Cache Hit] ${cacheKey}`);
            return { data: cached.data as T, error: null, count: cached.count };
        }
    }

    // 2. Controle de Concorrência (Deduplicação de chamadas simultâneas)
    const concurrencyKey = cacheKey || queryFn.toString().substring(0, 100);
    if (!forceRefresh && pendingQueries.has(concurrencyKey)) {
        console.log(`[Concurrency] Aguardando consulta duplicada: ${concurrencyKey}`);
        return pendingQueries.get(concurrencyKey);
    }

    const executeQuery = async (): Promise<{ data: T | null; error: any; count?: number | null }> => {
        let currentDelay = delay;
        let lastError: any;

        for (let i = 0; i < retries; i++) {
            const startTime = Date.now();
            try {
                // @ts-ignore
                const { data, error, count } = await Promise.race([
                    queryFn(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT_EXCEEDED')), 30000))
                ]);

                const duration = Date.now() - startTime;

                if (!error) {
                    if (duration > 1000) console.warn(`[Supabase Slow Query] ${concurrencyKey} levou ${duration}ms`);

                    // Gravar no cache se necessário
                    if (cacheKey) {
                        queryCache.set(cacheKey, {
                            data,
                            count,
                            expiry: Date.now() + cacheTTL
                        });
                    }
                    return { data, error: null, count };
                }

                lastError = error;

                // Log detalhado para diagnóstico
                const errorMsg = error?.message?.toLowerCase() || '';
                const errorCode = error?.code;
                const errorStatus = error?.status;

                console.error(`[Supabase ERROR] Tentativa ${i + 1}/${retries} falhou (${duration}ms):`, {
                    message: error.message,
                    code: errorCode,
                    status: errorStatus,
                    key: concurrencyKey
                });

                // Erros de rede ou timeout (PGRST301 = JWT, 504 = Gateway, 502 = Bad Gateway, 408 = Timeout)
                const isRetryable = errorMsg.includes('fetch') ||
                    errorMsg.includes('network') ||
                    errorMsg.includes('timeout') ||
                    errorCode === 'PGRST301' ||
                    [408, 502, 503, 504].includes(errorStatus);

                if (!isRetryable) break;

                await new Promise(resolve => setTimeout(resolve, currentDelay));
                currentDelay *= 2; // Exponential backoff
            } catch (err: any) {
                lastError = err;
                const duration = Date.now() - startTime;
                const errLower = err?.message?.toLowerCase() || '';

                console.warn(`[Supabase EXCEPTION] Tentativa ${i + 1}/${retries} (${duration}ms): ${err.message}`);

                if (errLower.includes('fetch') || errLower.includes('network') || err.message === 'TIMEOUT_EXCEEDED') {
                    await new Promise(resolve => setTimeout(resolve, currentDelay));
                    currentDelay *= 2;
                    continue;
                }
                break;
            }
        }

        // Se falhou após todas as tentativas, usar fallback se houver
        if (fallbackData !== null) {
            console.warn(`[Supabase Fallback] Usando dados de contingência para falha crítica.`);
            return { data: fallbackData, error: null };
        }

        return { data: null, error: lastError };
    };

    const queryPromise = executeQuery();
    pendingQueries.set(concurrencyKey, queryPromise);

    try {
        return await queryPromise;
    } finally {
        pendingQueries.delete(concurrencyKey);
    }
}

/**
 * Utilitário de Paginação
 */
export async function paginate<T>(
    table: string,
    page: number,
    pageSize: number,
    filters: (query: any) => any = (q) => q,
    order: { column: string; ascending?: boolean } = { column: 'created_at', ascending: false }
): Promise<{ data: T[] | null; count: number; error: any }> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count, error } = await safeQuery<any>(
        () => filters(
            supabase
                .from(table)
                .select('*', { count: 'exact' })
                .order(order.column, { ascending: order.ascending })
                .range(from, to)
        ),
        { cacheKey: `pag-${table}-${page}-${pageSize}-${JSON.stringify(order)}`, cacheTTL: 60000 }
    );

    return { data, count: count || 0, error };
}

/**
 * Hook para Carregamento Infinito (Lazy Loading)
 */
export function useInfiniteQuery<T>(
    table: string,
    pageSize: number = 10,
    filters: (query: any) => any = (q) => q,
    order: { column: string; ascending?: boolean } = { column: 'created_at', ascending: false }
) {
    const [data, setData] = useState<T[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<any>(null);

    const loadMore = useCallback(async (isInitial = false) => {
        if (loading || (!hasMore && !isInitial)) return;

        setLoading(true);
        const currentPage = isInitial ? 1 : page;

        try {
            const { data: newData, count, error: queryError } = await paginate<T>(
                table,
                currentPage,
                pageSize,
                filters,
                order
            );

            if (queryError) throw queryError;

            if (newData) {
                setData(prev => isInitial ? newData : [...prev, ...newData]);
                setHasMore(data.length + newData.length < count);
                setPage(currentPage + 1);
            }
        } catch (err) {
            setError(err);
            console.error(`[InfiniteQuery] Erro ao carregar ${table}:`, err);
        } finally {
            setLoading(false);
        }
    }, [table, page, hasMore, loading, pageSize, filters, order]);

    const reset = () => {
        setData([]);
        setPage(1);
        setHasMore(true);
        loadMore(true);
    };

    useEffect(() => {
        loadMore(true);
    }, [table]);

    return { data, loading, hasMore, error, loadMore, reset };
}

/**
 * Limpar o cache manualmente se necessário
 */
export const clearQueryCache = (key?: string) => {
    if (key) {
        queryCache.delete(key);
    } else {
        queryCache.clear();
    }
};

/**
 * Helper para obter perfil de utilizador com cache
 */
export async function getUserProfile(userId: string) {
    return safeQuery(() =>
        supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single(),
        { cacheKey: `profile-${userId}`, cacheTTL: 300000 } // 5 minutos
    );
}

/**
 * Obter lista de tenants com cache
 */
export async function getTenants() {
    return safeQuery(() =>
        supabase
            .from('saas_tenants')
            .select('*')
            .eq('status', 'ativo'),
        { cacheKey: 'global-tenants', cacheTTL: 600000 } // 10 minutos
    );
}

/**
 * Upload de media para o blog
 */
export async function uploadBlogMedia(file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('blog-media')
        .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
        .from('blog-media')
        .getPublicUrl(filePath);

    return data.publicUrl;
}

/**
 * Upload múltiplo de media
 */
export async function uploadMultipleBlogMedia(files: FileList | File[]) {
    const uploadPromises = Array.from(files).map(file => uploadBlogMedia(file));
    return Promise.all(uploadPromises);
}

