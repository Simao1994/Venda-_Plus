import "dotenv/config";
import { syncDatabaseSchema } from "./src/lib/database-sync.ts";

async function main() {
    console.log("🚀 Running migrations (fixed order)...");
    await syncDatabaseSchema();
    console.log("✅ Migrations finished.");
    process.exit(0);
}

main().catch(err => {
    console.error("❌ Migration failed:", err);
    process.exit(1);
});
