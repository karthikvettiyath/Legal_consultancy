require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function check() {
    const res = await pool.query(`
        SELECT 
            count(*) as total,
            sum(case when file_no = '-' then 1 else 0 end) as missing_file,
            sum(case when case_number = '-' then 1 else 0 end) as missing_case,
            sum(case when phone = '-' then 1 else 0 end) as missing_phone,
            sum(case when type_of_work = '-' then 1 else 0 end) as missing_type
        FROM clients
    `);
    console.log("DB Stats:", res.rows[0]);
    pool.end();
}
check();
