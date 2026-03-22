import { supabase } from "./src/lib/supabase.ts";
import "dotenv/config";

async function test() {
    console.log("🔗 Connecting to:", process.env.VITE_SUPABASE_URL);
    const { data, error } = await supabase.from('companies').select('count', { count: 'exact', head: true });
    if (error) {
        console.error("❌ Connection failed:", error);
    } else {
        console.log("✅ Connection successful! Total companies:", data);
    }
}

test();
