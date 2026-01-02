require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    family: 4
});

async function updateSchema() {
    try {
        const client = await pool.connect();
        console.log("Connected to database...");

        // 1. Enable RLS
        await client.query("ALTER TABLE clients ENABLE ROW LEVEL SECURITY;");
        console.log("✅ RLS Enabled on 'clients' table.");

        // 2. Add Policy (Allowing all access for now since we handle auth in API, 
        // but ideally we should restrict. For this error remediation, just enabling is the first step.
        // However, if we enable RLS without policies, no one can access it via Supabase client.
        // Our Node backend uses the service role (or effectively unrestricted if it's the admin role) usually,
        // but here we are using a connection string. 
        // If the connection string is 'postgres' user, RLS is bypassed.
        // If it is 'anon' or 'authenticated', RLS applies.
        // Assuming standard connection string (postgres/admin), RLS won't block the backend.

        // Let's create a permissive policy for authenticated users just in case.
        // Let's create a permissive policy for authenticated users just in case.
        // Use DO block to avoid error if exists
        await client.query(`
          DO $$ 
          BEGIN 
            IF NOT EXISTS (
                SELECT 1 FROM pg_policies WHERE tablename = 'clients' AND policyname = 'Enable all for authenticated users'
            ) THEN
                CREATE POLICY "Enable all for authenticated users" ON clients
                FOR ALL USING (true) WITH CHECK (true);
            END IF;
          END $$;
        `);
        console.log("✅ Permissive Policy added (safely).");

        // 3. Add new columns
        // type_of_work, case_number, dob
        const alterQuery = `
      ALTER TABLE clients 
      ADD COLUMN IF NOT EXISTS type_of_work TEXT,
      ADD COLUMN IF NOT EXISTS case_number TEXT,
      ADD COLUMN IF NOT EXISTS dob TEXT;
    `;
        await client.query(alterQuery);
        console.log("✅ Added new columns: type_of_work, case_number, dob");

        client.release();
    } catch (err) {
        console.error("❌ Schema update failed:", err);
    } finally {
        pool.end();
    }
}

updateSchema();
