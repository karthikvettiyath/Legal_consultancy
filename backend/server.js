require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const dns = require("dns");

/* =========================
   FORCE IPV4 ONLY (RENDER FIX)
========================= */
try {
  dns.setDefaultResultOrder("ipv4first");
} catch {
  // Ignore on older Node versions
}

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

function stripSurroundingQuotes(value) {
  if (!value) return value;
  const trimmed = String(value).trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

const DATABASE_URL = stripSurroundingQuotes(process.env.DATABASE_URL);

let pool = null;
let dbHealthy = false;

if (!DATABASE_URL) {
  console.warn(
    "⚠️  DATABASE_URL not set. Backend will start, but /api/services will return 503 until a database is configured."
  );
} else {
  // Safe diagnostics (does NOT log password)
  try {
    const parsed = new URL(DATABASE_URL);
    console.log(
      `🔎 DB target: ${parsed.username || "(none)"}@${parsed.host || "(none)"}${parsed.pathname || ""}`
    );
    if (parsed.port === "5432" && parsed.hostname.startsWith("db.")) {
      console.warn(
        "⚠️  You are using the direct Supabase DB host on port 5432. On Render this can fail due to IPv6 routing. Prefer the Supabase pooler URL (port 6543)."
      );
    }
  } catch {
    console.warn(
      "⚠️  DATABASE_URL is not a valid URL. Backend will start, but /api/services will return 503 until DATABASE_URL is fixed."
    );
  }

  /* =========================
     FORCE IPV4 IN PG
  ========================= */
  pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    // 👇 THIS IS THE KEY LINE
    family: 4, // force IPv4, block IPv6
  });
}

/* =========================
   TEST DB CONNECTION
========================= */
(async () => {
  if (!pool) return;
  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    dbHealthy = true;
    console.log("✅ Connected to Supabase Database (IPv4)");
  } catch (err) {
    dbHealthy = false;
    console.error("❌ Database connection failed:", err);
  }
})();

/* =========================
   ROUTES
========================= */
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

app.get("/api/services", async (req, res) => {
  const { search } = req.query;

  try {
    if (!pool) {
      return res.status(503).json({ error: "Database unavailable (No Pool)" });
    }


    let query = `
      SELECT
        sn.id,
        sn.name,
        sc.title,
        sc.description,
        sc.image_path,
        sc.details
      FROM service_names sn
      JOIN service_content sc
        ON sn.id = sc.service_id
    `;

    const values = [];

    // If search is provided, filter. If NOT provided, return ALL services (useful for Admin).
    if (search) {
      query += `
        WHERE sn.name ILIKE $1
           OR sc.title ILIKE $1
           OR sc.description ILIKE $1
      `;
      values.push(`%${search}%`);
    }

    query += ` ORDER BY sn.id ASC`; // Consistent ordering

    const { rows } = await pool.query(query, values);
    dbHealthy = true;
    res.json(rows);
  } catch (err) {
    console.error("❌ /api/services error:", err);
    const code = err?.code;
    if (code === "ENETUNREACH" || code === "ECONNREFUSED" || code === "ETIMEDOUT") {
      dbHealthy = false;
      return res.status(503).json({ error: "Database unavailable" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const jwt = require('jsonwebtoken');

// ... imports ...

/* =========================
   AUTH MECHANISM
   ========================= */
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
// In a real app, use a hash. For this MVP, we check plain text from ENV, 
// or you could use bcrypt.compare if you stored a hash in ENV.
// For simplicity:
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_change_me';

if (!ADMIN_PASSWORD) {
  console.warn("⚠️  ADMIN_PASSWORD not set in .env. Admin login will fail or be insecure.");
}

// Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) return res.status(401).json({ error: "Access token required" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
}

// 1. Login Endpoint
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  // Check Admin
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = jwt.sign({ username, role: 'admin' }, JWT_SECRET, { expiresIn: '8h' });
    return res.json({ token, username, role: 'admin' });
  }

  // Check Standard User
  if (username === 'user' && password === 'user123') {
    const token = jwt.sign({ username, role: 'user' }, JWT_SECRET, { expiresIn: '8h' });
    return res.json({ token, username, role: 'user' });
  }

  return res.status(401).json({ error: "Invalid credentials" });
});

// Create new service
app.post("/api/services", authenticateToken, async (req, res) => {
  const { name, title, description, details } = req.body;

  if (!pool) {
    return res.status(503).json({ error: "Database unavailable" });
  }

  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Insert into service_names
      const nameRes = await client.query(
        "INSERT INTO service_names (name) VALUES ($1) RETURNING id",
        [name]
      );
      const newServiceId = nameRes.rows[0].id;

      // 2. Insert into service_content
      // Default image_path to null or empty string for now
      await client.query(
        `INSERT INTO service_content (service_id, title, description, details, image_path)
         VALUES ($1, $2, $3, $4, '')`,
        [newServiceId, title, description, details]
      );

      await client.query("COMMIT");
      res.status(201).json({ success: true, message: "Service created successfully", id: newServiceId });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("❌ /api/services POST error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.put("/api/services/:id", authenticateToken, async (req, res) => {
  // ... implementation ...

  const { id } = req.params;
  const { name, title, description, details } = req.body;

  if (!pool) {
    return res.status(503).json({ error: "Database unavailable" });
  }

  try {
    // Start transaction
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Update service name
      if (name) {
        await client.query("UPDATE service_names SET name = $1 WHERE id = $2", [name, id]);
      }

      // Update service content
      // Note: This updates the content associated with the service_id.
      // Assuming 1-to-1 mapping for simplicity based on the GET query.
      await client.query(
        `UPDATE service_content 
         SET title = COALESCE($1, title), 
             description = COALESCE($2, description), 
             details = COALESCE($3, details) 
         WHERE service_id = $4`,
        [title, description, details, id]
      );

      await client.query("COMMIT");
      res.json({ success: true, message: "Service updated successfully" });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("❌ /api/services/:id update error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete service
app.delete("/api/services/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  if (!pool) {
    return res.status(503).json({ error: "Database unavailable" });
  }

  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Delete content first (foreign key)
      await client.query("DELETE FROM service_content WHERE service_id = $1", [id]);

      // Delete service name/entry
      await client.query("DELETE FROM service_names WHERE id = $1", [id]);

      await client.query("COMMIT");
      res.json({ success: true, message: "Service deleted successfully" });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("❌ /api/services/:id DELETE error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}


/* =========================
   CLIENTS CRUD
   ========================= */

// Get all clients
app.get("/api/clients", authenticateToken, async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Database unavailable" });
  try {
    const result = await pool.query("SELECT * FROM clients ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("❌ GET /api/clients error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Add client
app.post("/api/clients", authenticateToken, async (req, res) => {
  const { name, email, phone, address, type_of_work, case_number, dob, review_rating } = req.body;
  if (!pool) return res.status(503).json({ error: "Database unavailable" });

  try {
    const result = await pool.query(
      `INSERT INTO clients (name, email, phone, address, type_of_work, case_number, dob, review_rating) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [name, email, phone, address, type_of_work, case_number, dob, review_rating]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("❌ POST /api/clients error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update client
app.put("/api/clients/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, address, type_of_work, case_number, dob, review_rating } = req.body;
  if (!pool) return res.status(503).json({ error: "Database unavailable" });

  try {
    const result = await pool.query(
      `UPDATE clients 
       SET name = $1, email = $2, phone = $3, address = $4, type_of_work = $5, case_number = $6, dob = $7, review_rating = $8 
       WHERE id = $9 RETURNING *`,
      [name, email, phone, address, type_of_work, case_number, dob, review_rating, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Client not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ PUT /api/clients/:id error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete client
app.delete("/api/clients/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  if (!pool) return res.status(503).json({ error: "Database unavailable" });

  try {
    const result = await pool.query("DELETE FROM clients WHERE id = $1 RETURNING id", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Client not found" });
    }
    res.json({ success: true, message: "Client deleted successfully" });
  } catch (err) {
    console.error("❌ DELETE /api/clients/:id error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = app;
