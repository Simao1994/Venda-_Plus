-- Optimize System Stats Calculation
-- Consolidates multiple table count queries into a single call

CREATE OR REPLACE FUNCTION public.get_system_stats(p_company_id INTEGER, p_is_master BOOLEAN)
RETURNS JSONB AS $$
DECLARE
    v_results JSONB := '{}'::JSONB;
    v_table RECORD;
    v_count BIGINT;
    v_total_tables INTEGER := 0;
    v_user_count BIGINT := 0;
BEGIN
    FOR v_table IN 
        SELECT 
            t.table_name,
            EXISTS (
                SELECT 1 FROM information_schema.columns c 
                WHERE c.table_name = t.table_name 
                AND c.table_schema = t.table_schema 
                AND c.column_name = 'company_id'
            ) as has_company_id
        FROM information_schema.tables t
        WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
        AND t.table_name NOT LIKE 'pg_%' 
        AND t.table_name NOT LIKE 'sql_%'
    LOOP
        -- Count all public tables in total_tables
        v_total_tables := v_total_tables + 1;

        -- For row counts (table_stats), filter by tenant if not master
        IF p_is_master OR v_table.has_company_id OR v_table.table_name = 'companies' THEN
            -- Dynamic SQL for counting
            IF v_table.has_company_id AND NOT p_is_master THEN
                EXECUTE format('SELECT count(*) FROM public.%I WHERE company_id = %L', v_table.table_name, p_company_id) INTO v_count;
            ELSE
                EXECUTE format('SELECT count(*) FROM public.%I', v_table.table_name) INTO v_count;
            END IF;
            
            v_results := v_results || jsonb_build_object(v_table.table_name, v_count);
        END IF;
    END LOOP;

    -- User count
    IF p_is_master THEN
        SELECT count(*) INTO v_user_count FROM public.users;
    ELSE
        SELECT count(*) INTO v_user_count FROM public.users WHERE company_id = p_company_id;
    END IF;
    
    RETURN jsonb_build_object(
        'table_stats', v_results,
        'total_tables', v_total_tables,
        'current_users', v_user_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
