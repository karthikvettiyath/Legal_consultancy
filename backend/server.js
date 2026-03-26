require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const dns = require("dns");
const XLSX = require("xlsx");

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

    // Auto-create dsc_records table
    await client.query(`
      CREATE TABLE IF NOT EXISTS dsc_records (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        client_name VARCHAR(255) NOT NULL,
        email_id VARCHAR(255),
        phone_no VARCHAR(50),
        dsc_taken_date DATE,
        dsc_expiry_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

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
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure Multer for PDF Uploads
// Saving to frontend public/docs for immediate availability in dev/local
const uploadDir = path.join(__dirname, '../frontend/public/docs');
// Ensure it exists
if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
  } catch (e) {
    console.warn("Could not create upload dir:", e);
  }
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Sanitize: replace spaces with underscores, remove special chars
    const name = file.originalname.replace(/\s+/g, '_').replace(/[^\w\.-]/g, '');
    cb(null, name);
  }
});

const upload = multer({ storage: storage });


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


// Upload PDF
app.post("/api/upload", authenticateToken, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  // Return the path relative to frontend public
  const publicPath = `/docs/${req.file.filename}`;
  res.json({ success: true, filePath: publicPath });
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
    const result = await pool.query("SELECT * FROM clients ORDER BY name ASC");
    res.json(result.rows);
  } catch (err) {
    console.error("❌ GET /api/clients error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Add client
app.post("/api/clients", authenticateToken, async (req, res) => {
  const { name, email, phone, address, type_of_work, case_number, dob, review_rating, file_no, file_date, is_contacted } = req.body;
  if (!pool) return res.status(503).json({ error: "Database unavailable" });

  try {
    const result = await pool.query(
      `INSERT INTO clients (name, email, phone, address, type_of_work, case_number, dob, review_rating, file_no, file_date, is_contacted, managed_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [name, email, phone, address, type_of_work, case_number, dob, review_rating, file_no, file_date, is_contacted || false, req.body.managed_by]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error adding client:", err);
    res.status(500).json({ error: "Failed to add client" });
  }
});

// Update client
app.put("/api/clients/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, address, type_of_work, case_number, dob, review_rating, file_no, file_date, is_contacted, managed_by } = req.body;

  console.log(`PUT /api/clients/${id} Body:`, req.body);

  if (!pool) return res.status(503).json({ error: "Database unavailable" });

  try {
    const result = await pool.query(
      `UPDATE clients 
       SET name = $1, email = $2, phone = $3, address = $4, type_of_work = $5, case_number = $6, dob = $7, review_rating = $8, file_no = $9, file_date = $10, is_contacted = $11, managed_by = $12 
       WHERE id = $13 RETURNING *`,
      [name, email, phone, address, type_of_work, case_number, dob, review_rating, file_no, file_date, is_contacted, managed_by, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Client not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating client:", err);
    res.status(500).json({ error: "Failed to update client" });
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

/* =========================
   BILLINGS CRUD
   ========================= */

// Get all billings
app.get("/api/billings", authenticateToken, async (req, res) => {
  const { search } = req.query;
  if (!pool) return res.status(503).json({ error: "Database unavailable" });

  try {
    let query = "SELECT * FROM billings";
    const values = [];

    if (search) {
      query += " WHERE client_name ILIKE $1 OR invoice_no ILIKE $1";
      values.push(`%${search}%`);
    }

    query += " ORDER BY created_at DESC";

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ GET /api/billings error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Generate next invoice number logic
app.get("/api/billings/next-invoice-no", authenticateToken, async (req, res) => {
  const { series, type } = req.query;
  if (!series) return res.status(400).json({ error: "Series is required" });
  if (!pool) return res.status(503).json({ error: "Database unavailable" });

  try {
    // Find the last invoice for this series (authority) and optionally type
    let query = "SELECT invoice_no FROM billings WHERE authorities = $1";
    const values = [series];

    if (type) {
      query += " AND type = $2";
      values.push(type);
    }

    query += " ORDER BY id DESC LIMIT 1";

    const result = await pool.query(query, values);

    const lastNo = result.rows[0]?.invoice_no;

    // Default start
    let nextNo = `${series}-001`;

    if (lastNo) {
      // Check if it matches pattern "Start with Series"
      // If it's just a number like "4139", we define policy:
      // Since User wants "vary according to series", "4139" doesn't vary.
      // So we ignore "4139" and start "A-001"?
      // OR we continue "4140"?
      // Given the requirement "series names ... aligned with ... Sarath - A", 
      // it implies they want "A-xxxx".
      // So if last entry is "4139" (legacy), we switch to "A-001".
      // IF last entry is "A-005", we go to "A-006".

      if (lastNo.startsWith(series)) {
        const match = lastNo.match(/(\d+)$/);
        if (match) {
          const numStr = match[1];
          const num = parseInt(numStr, 10) + 1;
          const padding = numStr.length;
          // Ensure at least 3 digits?
          const finalPadding = Math.max(padding, 3);
          nextNo = lastNo.replace(/(\d+)$/, num.toString().padStart(finalPadding, '0'));
        }
      }
    }

    // Final check: ensure this number doesn't exist (unlikely if sequential, but good safety)
    // Ignoring for now to keep it simple.

    res.json({ nextInvoiceNo: nextNo });
  } catch (err) {
    console.error("❌ GET /api/billings/next-invoice-no error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Create billing
app.post("/api/billings", authenticateToken, async (req, res) => {
  const { invoice_no, client_name, date, amount, type, data, category, authorities } = req.body;
  if (!pool) return res.status(503).json({ error: "Database unavailable" });

  try {
    const result = await pool.query(
      `INSERT INTO billings (invoice_no, client_name, date, amount, type, data, category, authorities) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [invoice_no, client_name, date, amount, type, data, category, authorities]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating billing:", err);
    res.status(500).json({ error: "Failed to create billing" });
  }
});

// Update billing
app.put("/api/billings/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { invoice_no, client_name, date, amount, type, data, category, authorities } = req.body;
  if (!pool) return res.status(503).json({ error: "Database unavailable" });

  try {
    const result = await pool.query(
      `UPDATE billings 
       SET invoice_no = $1, client_name = $2, date = $3, amount = $4, type = $5, data = $6, category = $7, authorities = $8 
       WHERE id = $9 RETURNING *`,
      [invoice_no, client_name, date, amount, type, data, category, authorities, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Billing not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating billing:", err);
    res.status(500).json({ error: "Failed to update billing" });
  }
});

// Delete billing
app.delete("/api/billings/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  if (!pool) return res.status(503).json({ error: "Database unavailable" });

  try {
    const result = await pool.query("DELETE FROM billings WHERE id = $1 RETURNING id", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Billing not found" });
    }
    res.json({ success: true, message: "Billing deleted successfully" });
  } catch (err) {
    console.error("❌ DELETE /api/billings/:id error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/* =========================
   LICENSE & AGREEMENT MANAGEMENT
   ========================= */

// ---- License Types CRUD ----

// Get all license types
app.get("/api/license-types", authenticateToken, async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Database unavailable" });
  try {
    const result = await pool.query(`
      SELECT lt.*, 
        (SELECT COUNT(*) FROM client_licenses cl WHERE cl.license_type_id = lt.id) as client_count
      FROM license_types lt 
      ORDER BY lt.name ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ GET /api/license-types error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get single license type
app.get("/api/license-types/:id", authenticateToken, async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Database unavailable" });
  try {
    const result = await pool.query("SELECT * FROM license_types WHERE id = $1", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "License type not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ GET /api/license-types/:id error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Create license type
app.post("/api/license-types", authenticateToken, async (req, res) => {
  const { name, description } = req.body;
  if (!pool) return res.status(503).json({ error: "Database unavailable" });
  if (!name) return res.status(400).json({ error: "Name is required" });

  try {
    const result = await pool.query(
      "INSERT INTO license_types (name, description) VALUES ($1, $2) RETURNING *",
      [name, description || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("❌ POST /api/license-types error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update license type
app.put("/api/license-types/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  if (!pool) return res.status(503).json({ error: "Database unavailable" });

  try {
    const result = await pool.query(
      "UPDATE license_types SET name = $1, description = $2, updated_at = NOW() WHERE id = $3 RETURNING *",
      [name, description, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "License type not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ PUT /api/license-types/:id error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete license type
app.delete("/api/license-types/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  if (!pool) return res.status(503).json({ error: "Database unavailable" });

  try {
    const result = await pool.query("DELETE FROM license_types WHERE id = $1 RETURNING id", [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "License type not found" });
    res.json({ success: true, message: "License type deleted successfully" });
  } catch (err) {
    console.error("❌ DELETE /api/license-types/:id error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ---- Client Licenses CRUD ----

// Get all client licenses (optionally filtered by license_type_id)
app.get("/api/client-licenses", authenticateToken, async (req, res) => {
  const { license_type_id, status, search } = req.query;
  if (!pool) return res.status(503).json({ error: "Database unavailable" });

  try {
    let query = `
      SELECT cl.*, 
        COALESCE(c.name, cl.manual_client_name) as client_name, 
        c.email as client_email, c.phone as client_phone,
        lt.name as license_type_name,
        CASE 
          WHEN cl.expiry_date < CURRENT_DATE AND cl.status != 'Expired' THEN 'Expired'
          ELSE cl.status 
        END as computed_status,
        (cl.expiry_date - CURRENT_DATE) as remaining_days
      FROM client_licenses cl
      LEFT JOIN clients c ON cl.client_id = c.id
      JOIN license_types lt ON cl.license_type_id = lt.id
      WHERE 1=1
    `;
    const values = [];
    let paramIndex = 1;

    if (license_type_id) {
      query += ` AND cl.license_type_id = $${paramIndex}`;
      values.push(license_type_id);
      paramIndex++;
    }
    if (status) {
      query += ` AND cl.status = $${paramIndex}`;
      values.push(status);
      paramIndex++;
    }
    if (search) {
      query += ` AND (c.name ILIKE $${paramIndex} OR cl.manual_client_name ILIKE $${paramIndex} OR cl.file_no ILIKE $${paramIndex})`;
      values.push(`%${search}%`);
      paramIndex++;
    }

    query += " ORDER BY cl.expiry_date ASC";

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ GET /api/client-licenses error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Export client licenses to Excel
app.get("/api/client-licenses/download/excel", authenticateToken, async (req, res) => {
  const { license_type_id, status, search } = req.query;
  if (!pool) return res.status(503).json({ error: "Database unavailable" });

  try {
    let query = `
      SELECT 
        COALESCE(c.name, cl.manual_client_name) as "Client Name",
        lt.name as "License Type",
        cl.file_no as "File Number",
        TO_CHAR(cl.service_date, 'DD-MM-YYYY') as "Service Date",
        TO_CHAR(cl.expiry_date, 'DD-MM-YYYY') as "Expiry Date",
        CASE 
          WHEN cl.expiry_date < CURRENT_DATE AND cl.status != 'Expired' THEN 'Expired'
          ELSE cl.status 
        END as "Status",
        (cl.expiry_date - CURRENT_DATE) as "Days Remaining",
        cl.notes as "Notes"
      FROM client_licenses cl
      LEFT JOIN clients c ON cl.client_id = c.id
      JOIN license_types lt ON cl.license_type_id = lt.id
      WHERE 1=1
    `;
    const values = [];
    let paramIndex = 1;

    if (license_type_id) {
      query += ` AND cl.license_type_id = $${paramIndex}`;
      values.push(license_type_id);
      paramIndex++;
    }
    if (status) {
      query += ` AND cl.status = $${paramIndex}`;
      values.push(status);
      paramIndex++;
    }
    if (search) {
      query += ` AND (c.name ILIKE $${paramIndex} OR cl.manual_client_name ILIKE $${paramIndex} OR cl.file_no ILIKE $${paramIndex})`;
      values.push(`%${search}%`);
      paramIndex++;
    }

    query += " ORDER BY cl.expiry_date ASC";

    const result = await pool.query(query, values);

    // Create Excel sheet
    const ws = XLSX.utils.json_to_sheet(result.rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Licenses");

    // Buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="licenses_export.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.end(buf);
  } catch (err) {
    console.error("❌ GET /api/client-licenses/excel error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get single client license
app.get("/api/client-licenses/:id", authenticateToken, async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Database unavailable" });
  try {
    const result = await pool.query(`
      SELECT cl.*, 
        COALESCE(c.name, cl.manual_client_name) as client_name, 
        c.email as client_email, c.phone as client_phone,
        lt.name as license_type_name,
        (cl.expiry_date - CURRENT_DATE) as remaining_days
      FROM client_licenses cl
      LEFT JOIN clients c ON cl.client_id = c.id
      JOIN license_types lt ON cl.license_type_id = lt.id
      WHERE cl.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Client license not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ GET /api/client-licenses/:id error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Create client license
app.post("/api/client-licenses", authenticateToken, async (req, res) => {
  const { client_id, manual_client_name, license_type_id, file_no, service_date, expiry_date, status, notes } = req.body;
  if (!pool) return res.status(503).json({ error: "Database unavailable" });
  if ((!client_id && !manual_client_name) || !license_type_id) {
    return res.status(400).json({ error: "Client (or Manual Name) and License Type are required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO client_licenses (client_id, manual_client_name, license_type_id, file_no, service_date, expiry_date, status, notes) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [client_id || null, manual_client_name || null, license_type_id, file_no, service_date || null, expiry_date || null, status || 'Active', notes || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("❌ POST /api/client-licenses error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update client license
app.put("/api/client-licenses/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { client_id, manual_client_name, license_type_id, file_no, service_date, expiry_date, status, notes } = req.body;
  if (!pool) return res.status(503).json({ error: "Database unavailable" });

  try {
    const result = await pool.query(
      `UPDATE client_licenses 
       SET client_id = $1, manual_client_name = $2, license_type_id = $3, file_no = $4, 
           service_date = $5, expiry_date = $6, status = $7, notes = $8, updated_at = NOW() 
       WHERE id = $9 RETURNING *`,
      [client_id || null, manual_client_name || null, license_type_id, file_no, service_date, expiry_date, status, notes, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Client license not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ PUT /api/client-licenses/:id error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete client license
app.delete("/api/client-licenses/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  if (!pool) return res.status(503).json({ error: "Database unavailable" });

  try {
    const result = await pool.query("DELETE FROM client_licenses WHERE id = $1 RETURNING id", [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Client license not found" });
    res.json({ success: true, message: "Client license deleted successfully" });
  } catch (err) {
    console.error("❌ DELETE /api/client-licenses/:id error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Renew client license
app.post("/api/client-licenses/:id/renew", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { service_date, expiry_date, notes } = req.body;
  if (!pool) return res.status(503).json({ error: "Database unavailable" });
  if (!service_date || !expiry_date) return res.status(400).json({ error: "New dates are required" });

  const client = await pool.connect();
  try {
    // Update existing record
    const result = await client.query(
      `UPDATE client_licenses 
       SET service_date = $1, expiry_date = $2, notes = $3, status = 'Renewed', updated_at = NOW() 
       WHERE id = $4 RETURNING *`,
      [service_date, expiry_date, notes || null, id]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "License not found" });
    }

    await client.query("COMMIT");
    res.json(result.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ POST /api/client-licenses/:id/renew error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
});

// ---- License Services ----

// Get services for a client license
app.get("/api/license-services/:clientLicenseId", authenticateToken, async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Database unavailable" });
  try {
    const result = await pool.query(
      "SELECT * FROM license_services WHERE client_license_id = $1 ORDER BY service_date DESC",
      [req.params.clientLicenseId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ GET /api/license-services error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Add service to a client license
app.post("/api/license-services", authenticateToken, async (req, res) => {
  const { client_license_id, service_description, service_cost, service_date } = req.body;
  if (!pool) return res.status(503).json({ error: "Database unavailable" });

  try {
    const result = await pool.query(
      `INSERT INTO license_services (client_license_id, service_description, service_cost, service_date) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [client_license_id, service_description, service_cost || 0, service_date || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("❌ POST /api/license-services error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete service
app.delete("/api/license-services/:id", authenticateToken, async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Database unavailable" });
  try {
    const result = await pool.query("DELETE FROM license_services WHERE id = $1 RETURNING id", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Service not found" });
    res.json({ success: true });
  } catch (err) {
    console.error("❌ DELETE /api/license-services/:id error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ---- License Billing ----

// Get billing for a client license
app.get("/api/license-billing/:clientLicenseId", authenticateToken, async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Database unavailable" });
  try {
    const result = await pool.query(
      "SELECT * FROM license_billing WHERE client_license_id = $1 ORDER BY created_at DESC",
      [req.params.clientLicenseId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ GET /api/license-billing error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Add billing record
app.post("/api/license-billing", authenticateToken, async (req, res) => {
  const { client_license_id, amount, payment_status, invoice_no, payment_date } = req.body;
  if (!pool) return res.status(503).json({ error: "Database unavailable" });

  try {
    const result = await pool.query(
      `INSERT INTO license_billing (client_license_id, amount, payment_status, invoice_no, payment_date) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [client_license_id, amount, payment_status || 'Pending', invoice_no, payment_date || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("❌ POST /api/license-billing error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update billing payment status
app.put("/api/license-billing/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { amount, payment_status, invoice_no, payment_date } = req.body;
  if (!pool) return res.status(503).json({ error: "Database unavailable" });

  try {
    const result = await pool.query(
      `UPDATE license_billing SET amount = $1, payment_status = $2, invoice_no = $3, payment_date = $4 
       WHERE id = $5 RETURNING *`,
      [amount, payment_status, invoice_no, payment_date, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Billing record not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ PUT /api/license-billing/:id error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete billing record
app.delete("/api/license-billing/:id", authenticateToken, async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Database unavailable" });
  try {
    const result = await pool.query("DELETE FROM license_billing WHERE id = $1 RETURNING id", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Billing record not found" });
    res.json({ success: true });
  } catch (err) {
    console.error("❌ DELETE /api/license-billing/:id error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ---- License Notifications ----

// Get all notifications
app.get("/api/license-notifications", authenticateToken, async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Database unavailable" });
  try {
    const result = await pool.query(`
      SELECT ln.*, cl.file_no, c.name as client_name, lt.name as license_type_name, cl.expiry_date
      FROM license_notifications ln
      JOIN client_licenses cl ON ln.client_license_id = cl.id
      JOIN clients c ON cl.client_id = c.id
      JOIN license_types lt ON cl.license_type_id = lt.id
      ORDER BY ln.scheduled_date ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ GET /api/license-notifications error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ---- Dashboard Summary ----

app.get("/api/license-dashboard", authenticateToken, async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Database unavailable" });

  try {
    // Overall stats
    const totalLicenses = await pool.query("SELECT COUNT(*) as count FROM client_licenses");
    const activeLicenses = await pool.query("SELECT COUNT(*) as count FROM client_licenses WHERE status IN ('Active', 'Renewed') AND expiry_date >= CURRENT_DATE");
    const expiredLicenses = await pool.query("SELECT COUNT(*) as count FROM client_licenses WHERE (expiry_date < CURRENT_DATE OR status = 'Expired') AND status != 'Renewed'");

    // Expiring in 30 days
    const expiringSoon = await pool.query(`
      SELECT cl.*, COALESCE(c.name, cl.manual_client_name) as client_name, lt.name as license_type_name,
        (cl.expiry_date - CURRENT_DATE) as remaining_days
      FROM client_licenses cl
      LEFT JOIN clients c ON cl.client_id = c.id
      JOIN license_types lt ON cl.license_type_id = lt.id
      WHERE cl.expiry_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '30 days')
        AND cl.status IN ('Active', 'Renewed')
      ORDER BY cl.expiry_date ASC
    `);

    // Recently expired
    const recentlyExpired = await pool.query(`
      SELECT cl.*, COALESCE(c.name, cl.manual_client_name) as client_name, lt.name as license_type_name,
        (CURRENT_DATE - cl.expiry_date) as days_expired
      FROM client_licenses cl
      LEFT JOIN clients c ON cl.client_id = c.id
      JOIN license_types lt ON cl.license_type_id = lt.id
      WHERE cl.expiry_date < CURRENT_DATE AND status != 'Renewed'
      ORDER BY cl.expiry_date DESC
      LIMIT 20
    `);

    // Recently renewed
    const recentlyRenewed = await pool.query(`
      SELECT cl.*, COALESCE(c.name, cl.manual_client_name) as client_name, lt.name as license_type_name
      FROM client_licenses cl
      LEFT JOIN clients c ON cl.client_id = c.id
      JOIN license_types lt ON cl.license_type_id = lt.id
      WHERE cl.status = 'Renewed'
      ORDER BY cl.updated_at DESC
      LIMIT 10
    `);

    // License type breakdown
    const typeBreakdown = await pool.query(`
      SELECT lt.name, COUNT(cl.id) as count
      FROM license_types lt
      LEFT JOIN client_licenses cl ON cl.license_type_id = lt.id
      GROUP BY lt.id, lt.name
      ORDER BY count DESC
    `);

    // Pending billing
    const pendingBilling = await pool.query(`
      SELECT SUM(amount) as total FROM license_billing WHERE payment_status = 'Pending'
    `);

    res.json({
      stats: {
        total: parseInt(totalLicenses.rows[0].count),
        active: parseInt(activeLicenses.rows[0].count),
        expired: parseInt(expiredLicenses.rows[0].count),
        expiring_soon: expiringSoon.rows.length,
        pending_billing: parseFloat(pendingBilling.rows[0].total || 0)
      },
      expiring_soon: expiringSoon.rows,
      recently_expired: recentlyExpired.rows,
      recently_renewed: recentlyRenewed.rows,
      type_breakdown: typeBreakdown.rows
    });
  } catch (err) {
    console.error("❌ GET /api/license-dashboard error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ---- Auto-update expired licenses (called on dashboard load) ----
app.post("/api/license-auto-update", authenticateToken, async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Database unavailable" });

  try {
    const result = await pool.query(`
      UPDATE client_licenses 
      SET status = 'Expired', updated_at = NOW()
      WHERE expiry_date < CURRENT_DATE AND status = 'Active'
      RETURNING id
    `);
    res.json({ updated: result.rows.length });
  } catch (err) {
    console.error("❌ POST /api/license-auto-update error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/* =========================
   DSC MANAGEMENT
   ========================= */

// Get all DSC records
app.get("/api/dsc", authenticateToken, async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Database unavailable" });
  try {
    const { search } = req.query;
    let query = `
      SELECT *, 
             (dsc_expiry_date - dsc_taken_date) as total_duration_days,
             (dsc_expiry_date - CURRENT_DATE) as remaining_days 
      FROM dsc_records`;
    const values = [];
    if (search) {
      query += " WHERE client_name ILIKE $1 OR username ILIKE $1";
      values.push(`%${search}%`);
    }
    query += " ORDER BY dsc_expiry_date ASC";
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ GET /api/dsc error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Create DSC record
app.post("/api/dsc", authenticateToken, async (req, res) => {
  const { username, password, client_name, email_id, phone_no, dsc_taken_date, dsc_expiry_date } = req.body;
  if (!pool) return res.status(503).json({ error: "Database unavailable" });
  try {
    const result = await pool.query(
      `INSERT INTO dsc_records (username, password, client_name, email_id, phone_no, dsc_taken_date, dsc_expiry_date) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [username, password, client_name, email_id, phone_no, dsc_taken_date, dsc_expiry_date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("❌ POST /api/dsc error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update DSC record
app.put("/api/dsc/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { username, password, client_name, email_id, phone_no, dsc_taken_date, dsc_expiry_date } = req.body;
  if (!pool) return res.status(503).json({ error: "Database unavailable" });
  try {
    const result = await pool.query(
      `UPDATE dsc_records 
       SET username = $1, password = $2, client_name = $3, email_id = $4, phone_no = $5, dsc_taken_date = $6, dsc_expiry_date = $7, updated_at = NOW()
       WHERE id = $8 RETURNING *`,
      [username, password, client_name, email_id, phone_no, dsc_taken_date, dsc_expiry_date, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "DSC record not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ PUT /api/dsc error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete DSC record
app.delete("/api/dsc/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  if (!pool) return res.status(503).json({ error: "Database unavailable" });
  try {
    const result = await pool.query("DELETE FROM dsc_records WHERE id = $1 RETURNING id", [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "DSC record not found" });
    res.json({ success: true, message: "DSC record deleted successfully" });
  } catch (err) {
    console.error("❌ DELETE /api/dsc error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get DSC warnings (expiry <= 30 days)
app.get("/api/dsc/warnings", authenticateToken, async (req, res) => {
  if (!pool) return res.status(503).json({ error: "Database unavailable" });
  try {
    const result = await pool.query(`
      SELECT *, 
             (dsc_expiry_date - dsc_taken_date) as total_duration_days,
             (dsc_expiry_date - CURRENT_DATE) as remaining_days
      FROM dsc_records
      WHERE (dsc_expiry_date - CURRENT_DATE) <= 30
      ORDER BY dsc_expiry_date ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ GET /api/dsc/warnings error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = app;
