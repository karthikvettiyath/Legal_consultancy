require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
pool.query('SELECT count(*) FROM clients').then(res => { console.log("Count:", res.rows[0].count); pool.end(); });
