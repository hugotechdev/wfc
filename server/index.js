const express = require("express");
const session = require("express-session");
const path = require("path");
const { Pool } = require("pg");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// Security & Rate Limiting
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["*"],
        scriptSrc: ["*", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["*", "'unsafe-inline'"],
        imgSrc: ["*", "data:", "blob:"],
        connectSrc: ["*"]
      }
    }
  })
);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: "Majaribio mengi sana. Tafadhali subiri kidogo." }
});

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "wfc-hugo-tech-secret-2026-secure",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
  })
);

app.use(express.static(path.join(__dirname, "../public")));

const receiptsDir = path.join(__dirname, "../public/receipts");
if (!fs.existsSync(receiptsDir)) {
  fs.mkdirSync(receiptsDir, { recursive: true });
}

// PostgreSQL Pool Connection (Railway / Heroku / Neon etc.)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/wfc_db",
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Initialize Tables
async function initDb() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT,
        phone TEXT UNIQUE,
        region TEXT,
        password TEXT,
        role TEXT DEFAULT 'MEMBER',
        status TEXT DEFAULT 'PENDING',
        wfcId TEXT,
        profession TEXT
      );

      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        userId TEXT,
        userName TEXT,
        type TEXT,
        amount NUMERIC,
        transactionId TEXT,
        receiptNo TEXT,
        status TEXT DEFAULT 'PENDING',
        receiptUrl TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        type TEXT,
        title TEXT,
        location TEXT,
        ticketPrice NUMERIC,
        poster TEXT
      );

      CREATE TABLE IF NOT EXISTS announcements (
        id TEXT PRIMARY KEY,
        title TEXT,
        body TEXT,
        link TEXT,
        author TEXT
      );

      CREATE TABLE IF NOT EXISTS support (
        id TEXT PRIMARY KEY,
        userId TEXT,
        subject TEXT,
        message TEXT,
        status TEXT DEFAULT 'PENDING'
      );

      CREATE TABLE IF NOT EXISTS attendance (
        id TEXT PRIMARY KEY,
        userId TEXT,
        userName TEXT,
        meeting TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS elections (
        id TEXT PRIMARY KEY,
        position TEXT,
        candidates TEXT,
        votes TEXT,
        status TEXT DEFAULT 'OPEN'
      );

      CREATE TABLE IF NOT EXISTS cases (
        id TEXT PRIMARY KEY,
        title TEXT,
        description TEXT,
        status TEXT DEFAULT 'OPEN'
      );

      CREATE TABLE IF NOT EXISTS saccos (
        id TEXT PRIMARY KEY,
        userId TEXT,
        amount NUMERIC,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS assets (
        id TEXT PRIMARY KEY,
        name TEXT,
        value NUMERIC,
        location TEXT
      );

      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT,
        progress INTEGER
      );

      CREATE TABLE IF NOT EXISTS penalties (
        id TEXT PRIMARY KEY,
        reason TEXT,
        amount NUMERIC
      );

      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        title TEXT,
        url TEXT,
        summary TEXT
      );

      CREATE TABLE IF NOT EXISTS outbox (
        id TEXT PRIMARY KEY,
        channel TEXT,
        toPhone TEXT,
        title TEXT,
        body TEXT,
        status TEXT DEFAULT 'SENT'
      );

      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        title TEXT,
        amount NUMERIC,
        category TEXT
      );

      CREATE TABLE IF NOT EXISTS manual_income (
        id TEXT PRIMARY KEY,
        title TEXT,
        amount NUMERIC,
        source TEXT
      );

      CREATE TABLE IF NOT EXISTS family (
        userId TEXT PRIMARY KEY,
        head TEXT,
        spouse TEXT,
        children TEXT
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);

    // Seed default admin
    const adminCheck = await client.query("SELECT * FROM users WHERE phone = $1", ["0700000000"]);
    if (adminCheck.rows.length === 0) {
      await client.query(
        `INSERT INTO users (id, name, phone, region, password, role, status, wfcId) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        ["admin-1", "Mwenyekiti Mkuu", "0700000000", "Dar es Salaam", "admin123", "ADMIN", "ACTIVE", "WFC-DSM-001"]
      );
    }
    console.log("PostgreSQL Connected & Initialized successfully.");
  } catch (err) {
    console.error("Database initialization error:", err);
  } finally {
    client.release();
  }
}

initDb();

// API Endpoints
app.post("/api/login", authLimiter, async (req, res) => {
  const { phone, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE phone = $1 AND password = $2", [phone, password]);
    const user = result.rows[0];
    if (!user) return res.json({ error: "Namba ya simu au nenosiri si sahihi." });
    if (user.status === "SUSPENDED") return res.json({ error: "Akaunti yako imesimamishwa." });
    req.session.userId = user.id;
    res.json({ success: true, user });
  } catch (err) {
    res.json({ error: "Hitilafu kwenye mfumo" });
  }
});

app.post("/api/verify-otp", authLimiter, async (req, res) => {
  const { phone } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE phone = $1", [phone]);
    const user = result.rows[0];
    if (!user) return res.json({ error: "Mtumiaji hajapatikana" });
    req.session.userId = user.id;
    res.json({ success: true, user });
  } catch (err) {
    res.json({ error: "Hitilafu kwenye mfumo" });
  }
});

app.post("/api/register", authLimiter, async (req, res) => {
  const { name, phone, region, password } = req.body;
  const id = "usr-" + Date.now();
  const wfcId = "WFC-PEND-" + Math.floor(1000 + Math.random() * 9000);
  try {
    await pool.query(
      `INSERT INTO users (id, name, phone, region, password, status, wfcId) VALUES ($1, $2, $3, $4, $5, 'PENDING', $6)`,
      [id, name, phone, region || "Dar es Salaam", password, wfcId]
    );
    res.json({ success: true, message: "Usajili umewasilishwa kikamilifu! Subiri idhini ya viongozi." });
  } catch (err) {
    res.json({ error: "Namba hii ya simu imeshasajiliwa tayari." });
  }
});

app.get("/api/me", async (req, res) => {
  if (!req.session.userId) return res.json({ user: null });
  try {
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [req.session.userId]);
    res.json({ user: result.rows[0] || null });
  } catch (err) {
    res.json({ user: null });
  }
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

app.get("/api/public/stats", async (req, res) => {
  try {
    const r1 = await pool.query("SELECT COUNT(*) FROM users WHERE status = 'ACTIVE'");
    const r2 = await pool.query("SELECT COUNT(*) FROM events");
    res.json({ members: parseInt(r1.rows[0].count), events: parseInt(r2.rows[0].count) });
  } catch (err) {
    res.json({ members: 0, events: 0 });
  }
});

app.get("/api/public/announcements", async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM announcements ORDER BY rowid DESC");
    res.json(r.rows);
  } catch (err) {
    res.json([]);
  }
});

app.get("/api/public/events", async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM events");
    res.json(r.rows);
  } catch (err) {
    res.json([]);
  }
});

app.post("/api/contact", (req, res) => {
  res.json({ success: true });
});

app.post("/api/tickets", (req, res) => {
  res.json({ success: true, ticketId: "TCK-" + Math.floor(100000 + Math.random() * 900000) });
});

app.get("/api/dashboard", async (req, res) => {
  if (!req.session.userId) return res.json({ user: null });
  try {
    const uRes = await pool.query("SELECT * FROM users WHERE id = $1", [req.session.userId]);
    const user = uRes.rows[0];
    if (!user) return res.json({ user: null });

    const s1 = await pool.query("SELECT COUNT(*) FROM users WHERE status = 'ACTIVE'");
    const s2 = await pool.query("SELECT COUNT(*) FROM users WHERE status = 'PENDING'");
    const s3 = await pool.query("SELECT COUNT(*) FROM payments");
    const s4 = await pool.query("SELECT COUNT(*) FROM events");
    const regions = await pool.query("SELECT region as name, COUNT(*) as value FROM users WHERE status = 'ACTIVE' GROUP BY region");
    const recent = await pool.query("SELECT * FROM payments ORDER BY createdAt DESC LIMIT 5");
    const myTot = await pool.query("SELECT SUM(amount) as total FROM payments WHERE userId = $1 AND status = 'APPROVED'", [user.id]);
    const sumPay = await pool.query("SELECT SUM(amount) as total FROM payments WHERE status = 'APPROVED'");
    const sumExp = await pool.query("SELECT SUM(amount) as total FROM expenses");
    const sumInc = await pool.query("SELECT SUM(amount) as total FROM manual_income");
    const sumSac = await pool.query("SELECT SUM(amount) as total FROM saccos");

    const mapato = Number(sumPay.rows[0]?.total || 0) + Number(sumInc.rows[0]?.total || 0) + Number(sumSac.rows[0]?.total || 0);
    const matumizi = Number(sumExp.rows[0]?.total || 0);
    const balance = mapato - matumizi;

    res.json({
      user,
      stats: {
        members: parseInt(s1.rows[0].count),
        pending: parseInt(s2.rows[0].count),
        payments: parseInt(s3.rows[0].count),
        events: parseInt(s4.rows[0].count)
      },
      regions: regions.rows,
      recent: recent.rows,
      myTotalPaid: Number(myTot.rows[0]?.total || 0),
      finance: { mapato, matumizi, balance, debtors: 0, totalDebt: 0 }
    });
  } catch (err) {
    res.json({ user: null });
  }
});

app.get("/api/members", async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM users");
    res.json(r.rows);
  } catch (err) {
    res.json([]);
  }
});

app.post("/api/approve-member", async (req, res) => {
  const { userId } = req.body;
  const wfcId = "WFC-DSM-" + Math.floor(100 + Math.random() * 900);
  try {
    await pool.query("UPDATE users SET status = 'ACTIVE', wfcId = $1 WHERE id = $2", [wfcId, userId]);
    res.json({ success: true, wfcId });
  } catch (err) {
    res.json({ error: "Imeshindwa kuidhinisha" });
  }
});

app.post("/api/suspend-member", async (req, res) => {
  try {
    await pool.query("UPDATE users SET status = 'SUSPENDED' WHERE id = $1", [req.body.userId]);
    res.json({ success: true });
  } catch (err) {
    res.json({ error: "Imeshindwa" });
  }
});

app.post("/api/remove-member", async (req, res) => {
  try {
    await pool.query("DELETE FROM users WHERE id = $1", [req.body.userId]);
    res.json({ success: true });
  } catch (err) {
    res.json({ error: "Imeshindwa" });
  }
});

app.get("/api/payments", async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM payments ORDER BY createdAt DESC");
    res.json(r.rows);
  } catch (err) {
    res.json([]);
  }
});

app.post("/api/submit-payment", async (req, res) => {
  if (!req.session.userId) return res.json({ error: "Hairuhusiwi" });
  try {
    const uRes = await pool.query("SELECT * FROM users WHERE id = $1", [req.session.userId]);
    const user = uRes.rows[0];
    const id = "pay-" + Date.now();
    await pool.query(
      `INSERT INTO payments (id, userId, userName, type, amount, transactionId, status) VALUES ($1, $2, $3, $4, $5, $6, 'PENDING')`,
      [id, user.id, user.name, req.body.type, req.body.amount, req.body.transactionId]
    );
    res.json({ success: true });
  } catch (err) {
    res.json({ error: "Imeshindwa kuwasilisha" });
  }
});

// PDF & QR Generation on Approval
app.post("/api/approve-payment", async (req, res) => {
  const receiptNo = "WFC-RCP-" + Math.floor(100000 + Math.random() * 900000);
  const paymentId = req.body.paymentId;

  try {
    const pRes = await pool.query("SELECT * FROM payments WHERE id = $1", [paymentId]);
    const payment = pRes.rows[0];
    if (!payment) return res.json({ error: "Malipo hayajapatikana" });

    const filename = `${receiptNo}.pdf`;
    const filepath = path.join(receiptsDir, filename);
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    doc.rect(0, 0, 612, 100).fill("#111827");
    doc.fillColor("#F97316").fontSize(20).text("WACHAGGA FAMILY COMMUNITY", 50, 30);
    doc.fillColor("#FFFFFF").fontSize(12).text("Risiti Rasmi ya Malipo / Official Receipt", 50, 60);

    doc.moveDown(4);
    doc.fillColor("#111827").fontSize(14).text(`Namba ya Risiti: ${receiptNo}`);
    doc.moveDown(1);
    doc.fontSize(11).text(`Jina la Mwanachama: ${payment.username || payment.username || "Mwanachama"}`);
    doc.text(`Aina ya Mchango: ${payment.type}`);
    doc.text(`Kiasi Kimelipwa: TSh ${Number(payment.amount).toLocaleString()}`);
    doc.text(`Namba ya Muamala: ${payment.transactionid || payment.transactionId}`);
    doc.text(`Tarehe: ${new Date().toLocaleString()}`);
    doc.moveDown(2);

    try {
      const qrData = JSON.stringify({ org: "WFC", receipt: receiptNo, amount: payment.amount });
      const qrBuffer = await QRCode.toBuffer(qrData, { width: 120 });
      doc.image(qrBuffer, 420, 140, { width: 120 });
    } catch (e) {}

    doc.moveDown(4);
    doc.fontSize(10).fillColor("#6B7280").text("Imetolewa kidijitali na mfumo wa WFC Portal — Hugo Tech", 50, 700, { align: "center" });
    doc.end();

    stream.on("finish", async () => {
      const receiptUrl = `/receipts/${filename}`;
      await pool.query("UPDATE payments SET status = 'APPROVED', receiptNo = $1, receiptUrl = $2 WHERE id = $3", [receiptNo, receiptUrl, paymentId]);
      res.json({ success: true, receiptNo, receiptUrl });
    });
  } catch (err) {
    res.json({ error: "Imeshindwa kuidhinisha malipo" });
  }
});

app.get("/api/events", async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM events");
    res.json(r.rows);
  } catch (err) {
    res.json([]);
  }
});

app.post("/api/events", async (req, res) => {
  const id = "ev-" + Date.now();
  try {
    await pool.query(
      `INSERT INTO events (id, type, title, location, ticketPrice, poster) VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, req.body.type, req.body.title, req.body.location, req.body.ticketPrice || 0, req.body.poster || ""]
    );
    res.json({ success: true });
  } catch (err) {
    res.json({ error: "Imeshindwa" });
  }
});

app.get("/api/announcements", async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM announcements");
    res.json(r.rows);
  } catch (err) {
    res.json([]);
  }
});

app.post("/api/announcements", async (req, res) => {
  const id = "ann-" + Date.now();
  try {
    await pool.query(
      `INSERT INTO announcements (id, title, body, link, author) VALUES ($1, $2, $3, $4, $5)`,
      [id, req.body.title, req.body.body, req.body.link || "", "Ofisi ya WFC"]
    );
    res.json({ success: true });
  } catch (err) {
    res.json({ error: "Imeshindwa" });
  }
});

app.get("/api/family", async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM family WHERE userId = $1", [req.session.userId]);
    const row = r.rows[0];
    if (!row) return res.json({ head: "", spouse: "", children: [] });
    res.json({ ...row, children: JSON.parse(row.children || "[]") });
  } catch (err) {
    res.json({ head: "", spouse: "", children: [] });
  }
});

app.post("/api/family", async (req, res) => {
  const { head, spouse, children } = req.body;
  try {
    await pool.query(
      `INSERT INTO family (userId, head, spouse, children) VALUES ($1, $2, $3, $4) ON CONFLICT (userId) DO UPDATE SET head = EXCLUDED.head, spouse = EXCLUDED.spouse, children = EXCLUDED.children`,
      [req.session.userId, head, spouse, JSON.stringify(children || [])]
    );
    res.json({ success: true });
  } catch (err) {
    res.json({ error: "Imeshindwa" });
  }
});

app.get("/api/directory", async (req, res) => {
  try {
    const r = await pool.query("SELECT name, profession, region FROM users WHERE profession IS NOT NULL AND status = 'ACTIVE'");
    res.json(r.rows);
  } catch (err) {
    res.json([]);
  }
});

app.post("/api/my-profession", async (req, res) => {
  try {
    await pool.query("UPDATE users SET profession = $1 WHERE id = $2", [req.body.profession, req.session.userId]);
    res.json({ success: true });
  } catch (err) {
    res.json({ error: "Imeshindwa" });
  }
});

app.get("/api/support", async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM support WHERE userId = $1", [req.session.userId]);
    res.json(r.rows);
  } catch (err) {
    res.json([]);
  }
});

app.post("/api/support", async (req, res) => {
  const id = "sup-" + Date.now();
  try {
    await pool.query("INSERT INTO support (id, userId, subject, message) VALUES ($1, $2, $3, $4)", [id, req.session.userId, req.body.subject, req.body.message]);
    res.json({ success: true });
  } catch (err) {
    res.json({ error: "Imeshindwa" });
  }
});

app.get("/api/attendance", async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM attendance");
    res.json(r.rows);
  } catch (err) {
    res.json([]);
  }
});

app.post("/api/attendance", async (req, res) => {
  try {
    const uRes = await pool.query("SELECT name FROM users WHERE id = $1", [req.session.userId]);
    const u = uRes.rows[0];
    const id = "att-" + Date.now();
    await pool.query("INSERT INTO attendance (id, userId, userName, meeting) VALUES ($1, $2, $3, $4)", [id, req.session.userId, u ? u.name : "Mwanachama", req.body.meeting]);
    res.json({ success: true });
  } catch (err) {
    res.json({ error: "Imeshindwa" });
  }
});

app.get("/api/elections", async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM elections");
    res.json(r.rows.map(row => ({ ...row, candidates: JSON.parse(row.candidates || "[]"), votes: JSON.parse(row.votes || "[]") })));
  } catch (err) {
    res.json([]);
  }
});

app.post("/api/elections", async (req, res) => {
  const id = "el-" + Date.now();
  try {
    await pool.query("INSERT INTO elections (id, position, candidates, votes) VALUES ($1, $2, '[]', '[]')", [id, req.body.position]);
    res.json({ success: true });
  } catch (err) {
    res.json({ error: "Imeshindwa" });
  }
});

app.get("/api/cases", async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM cases");
    res.json(r.rows);
  } catch (err) {
    res.json([]);
  }
});

app.post("/api/cases", async (req, res) => {
  const id = "case-" + Date.now();
  try {
    await pool.query("INSERT INTO cases (id, title, description) VALUES ($1, $2, $3)", [id, req.body.title, req.body.description]);
    res.json({ success: true });
  } catch (err) {
    res.json({ error: "Imeshindwa" });
  }
});

app.get("/api/saccos", async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM saccos WHERE userId = $1", [req.session.userId]);
    res.json({ shares: r.rows });
  } catch (err) {
    res.json({ shares: [] });
  }
});

app.post("/api/saccos/shares", async (req, res) => {
  const id = "sac-" + Date.now();
  try {
    await pool.query("INSERT INTO saccos (id, userId, amount) VALUES ($1, $2, $3)", [id, req.session.userId, req.body.amount]);
    res.json({ success: true });
  } catch (err) {
    res.json({ error: "Imeshindwa" });
  }
});

app.get("/api/assets", async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM assets");
    res.json(r.rows);
  } catch (err) {
    res.json([]);
  }
});

app.post("/api/assets", async (req, res) => {
  const id = "ast-" + Date.now();
  try {
    await pool.query("INSERT INTO assets (id, name, value, location) VALUES ($1, $2, $3, $4)", [id, req.body.name, req.body.value, req.body.location]);
    res.json({ success: true });
  } catch (err) {
    res.json({ error: "Imeshindwa" });
  }
});

app.get("/api/projects", async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM projects");
    res.json(r.rows);
  } catch (err) {
    res.json([]);
  }
});

app.post("/api/projects", async (req, res) => {
  const id = "prj-" + Date.now();
  try {
    await pool.query("INSERT INTO projects (id, name, progress) VALUES ($1, $2, $3)", [id, req.body.name, req.body.progress]);
    res.json({ success: true });
  } catch (err) {
    res.json({ error: "Imeshindwa" });
  }
});

app.get("/api/penalties", async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM penalties");
    res.json(r.rows);
  } catch (err) {
    res.json([]);
  }
});

app.post("/api/penalties", async (req, res) => {
  const id = "pen-" + Date.now();
  try {
    await pool.query("INSERT INTO penalties (id, reason, amount) VALUES ($1, $2, $3)", [id, req.body.reason, req.body.amount]);
    res.json({ success: true });
  } catch (err) {
    res.json({ error: "Imeshindwa" });
  }
});

app.get("/api/documents", async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM documents");
    res.json(r.rows);
  } catch (err) {
    res.json([]);
  }
});

app.post("/api/documents", async (req, res) => {
  const id = "doc-" + Date.now();
  try {
    await pool.query("INSERT INTO documents (id, title, url, summary) VALUES ($1, $2, $3, $4)", [id, req.body.title, req.body.url, req.body.summary]);
    res.json({ success: true });
  } catch (err) {
    res.json({ error: "Imeshindwa" });
  }
});

app.get("/api/analytics", async (req, res) => {
  try {
    const regions = await pool.query("SELECT region as name, COUNT(*) as value FROM users WHERE status = 'ACTIVE' GROUP BY region");
    const types = await pool.query("SELECT type as name, SUM(amount) as value FROM payments WHERE status = 'APPROVED' GROUP BY type");
    res.json({ regions: regions.rows, types: types.rows });
  } catch (err) {
    res.json({ regions: [], types: [] });
  }
});

app.get("/api/outbox", async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM outbox");
    res.json(r.rows);
  } catch (err) {
    res.json([]);
  }
});

app.post("/api/dispatch", async (req, res) => {
  const id = "out-" + Date.now();
  try {
    await pool.query("INSERT INTO outbox (id, channel, toPhone, title, body) VALUES ($1, $2, $3, $4, $5)", [id, req.body.channel, req.body.to, req.body.title, req.body.body]);
    res.json({ success: true });
  } catch (err) {
    res.json({ error: "Imeshindwa" });
  }
});

app.post("/api/stk", (req, res) => {
  res.json({ success: true, detail: "Ombi la STK Push limetumwa kwenye namba " + req.body.phone });
});

app.get("/api/expenses", async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM expenses");
    res.json(r.rows);
  } catch (err) {
    res.json([]);
  }
});

app.post("/api/expenses", async (req, res) => {
  const id = "exp-" + Date.now();
  try {
    await pool.query("INSERT INTO expenses (id, title, amount, category) VALUES ($1, $2, $3, $4)", [id, req.body.title, req.body.amount, req.body.category]);
    res.json({ success: true });
  } catch (err) {
    res.json({ error: "Imeshindwa" });
  }
});

app.get("/api/manual-income", async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM manual_income");
    res.json(r.rows);
  } catch (err) {
    res.json([]);
  }
});

app.post("/api/manual-income", async (req, res) => {
  const id = "inc-" + Date.now();
  try {
    await pool.query("INSERT INTO manual_income (id, title, amount, source) VALUES ($1, $2, $3, $4)", [id, req.body.title, req.body.amount, req.body.source]);
    res.json({ success: true });
  } catch (err) {
    res.json({ error: "Imeshindwa" });
  }
});

app.get("/api/accounting/summary", async (req, res) => {
  try {
    const sumPay = await pool.query("SELECT SUM(amount) as total FROM payments WHERE status = 'APPROVED'");
    const sumInc = await pool.query("SELECT SUM(amount) as total FROM manual_income");
    const sumSac = await pool.query("SELECT SUM(amount) as total FROM saccos");
    const sumExp = await pool.query("SELECT SUM(amount) as total FROM expenses");

    const mapato = Number(sumPay.rows[0]?.total || 0) + Number(sumInc.rows[0]?.total || 0) + Number(sumSac.rows[0]?.total || 0);
    const matumizi = Number(sumExp.rows[0]?.total || 0);
    res.json({ mapato, matumizi, balance: mapato - matumizi, debtors: 0, totalDebt: 0 });
  } catch (err) {
    res.json({ mapato: 0, matumizi: 0, balance: 0, debtors: 0, totalDebt: 0 });
  }
});

app.get("/api/accounting/debts", (req, res) => {
  res.json([]);
});

app.post("/api/toggle-2fa", (req, res) => {
  res.json({ twoFactor: false });
});

app.post("/api/demo/clear", (req, res) => {
  res.json({ success: true, message: "Data ya majaribio imeondolewa." });
});

app.post("/api/settings", (req, res) => {
  res.json({ success: true });
});

app.post("/api/set-role", async (req, res) => {
  try {
    await pool.query("UPDATE users SET role = $1 WHERE id = $2", [req.body.role, req.body.userId]);
    res.json({ success: true });
  } catch (err) {
    res.json({ error: "Imeshindwa" });
  }
});

app.get("/api/notifications", async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM announcements");
    res.json(r.rows);
  } catch (err) {
    res.json([]);
  }
});

app.post("/api/notifications", async (req, res) => {
  const id = "notif-" + Date.now();
  try {
    await pool.query("INSERT INTO announcements (id, title, body, link, author) VALUES ($1, $2, $3, '', 'Uongozi')", [id, req.body.title, req.body.body]);
    res.json({ success: true });
  } catch (err) {
    res.json({ error: "Imeshindwa" });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.listen(PORT, () => {
  console.log(`WCF Server imewashwa kwenye bandari (Port): ${PORT}`);
});
