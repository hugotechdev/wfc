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

// Required behind Railway / reverse proxies for express-rate-limit & secure cookies
app.set("trust proxy", 1);

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
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Majaribio mengi sana. Tafadhali subiri dakika chache." }
});

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "wfc-hugo-tech-secret-2026-production",
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

// PostgreSQL Pool Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/wfc_db",
  ssl: process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("localhost")
    ? { rejectUnauthorized: false }
    : false
});

// Helper to normalize PostgreSQL lowercase column names to camelCase expected by frontend
function norm(row) {
  if (!row) return null;
  return {
    ...row,
    userId: row.userid ?? row.userId,
    userName: row.username ?? row.userName,
    wfcId: row.wfcid ?? row.wfcId,
    transactionId: row.transactionid ?? row.transactionId,
    receiptNo: row.receiptno ?? row.receiptNo,
    receiptUrl: row.receipturl ?? row.receiptUrl,
    createdAt: row.createdat ?? row.createdAt,
    ticketPrice: row.ticketprice ?? row.ticketPrice,
    toPhone: row.tophone ?? row.toPhone
  };
}

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
        wfcid TEXT,
        profession TEXT,
        createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        userid TEXT,
        username TEXT,
        type TEXT,
        amount NUMERIC,
        transactionid TEXT,
        receiptno TEXT,
        status TEXT DEFAULT 'PENDING',
        receipturl TEXT,
        createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        type TEXT,
        title TEXT,
        location TEXT,
        ticketprice NUMERIC DEFAULT 0,
        poster TEXT,
        eventdate TEXT,
        createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS announcements (
        id TEXT PRIMARY KEY,
        title TEXT,
        body TEXT,
        link TEXT,
        author TEXT,
        createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        title TEXT,
        amount NUMERIC,
        category TEXT,
        createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS manual_income (
        id TEXT PRIMARY KEY,
        title TEXT,
        amount NUMERIC,
        source TEXT,
        createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS contact_messages (
        id TEXT PRIMARY KEY,
        name TEXT,
        phone TEXT,
        email TEXT,
        message TEXT,
        createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);

    const adminCheck = await client.query("SELECT id FROM users WHERE phone = $1", ["0700000000"]);
    if (adminCheck.rows.length === 0) {
      await client.query(
        `INSERT INTO users (id, name, phone, region, password, role, status, wfcid)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        ["admin-1", "Mwenyekiti Mkuu", "0700000000", "Dar es Salaam", "admin123", "ADMIN", "ACTIVE", "WFC-DSM-001"]
      );
    }
    console.log("PostgreSQL Connected & Tables Verified.");
  } catch (err) {
    console.error("PostgreSQL init error:", err.message);
  } finally {
    client.release();
  }
}

initDb();

// Auth & User Endpoints
app.post("/api/login", authLimiter, async (req, res) => {
  const { phone, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE phone = $1 AND password = $2", [phone, password]);
    const user = norm(result.rows[0]);
    if (!user) return res.json({ error: "Namba ya simu au nenosiri si sahihi." });
    if (user.status === "SUSPENDED") return res.json({ error: "Akaunti yako imesimamishwa. Wasiliana na uongozi." });
    req.session.userId = user.id;
    res.json({ success: true, user });
  } catch (err) {
    console.error(err);
    res.json({ error: "Hitilafu ya muunganisho wa database." });
  }
});

app.post("/api/register", authLimiter, async (req, res) => {
  const { name, phone, region, password } = req.body;
  const id = "usr-" + Date.now();
  const wfcId = "WFC-PEND-" + Math.floor(1000 + Math.random() * 9000);
  try {
    await pool.query(
      `INSERT INTO users (id, name, phone, region, password, status, wfcid) VALUES ($1, $2, $3, $4, $5, 'PENDING', $6)`,
      [id, name, phone, region || "Dar es Salaam", password, wfcId]
    );
    res.json({ success: true, message: "Usajili umewasilishwa! Subiri idhini ya uongozi." });
  } catch (err) {
    res.json({ error: "Namba hii ya simu imeshasajiliwa tayari." });
  }
});

app.get("/api/me", async (req, res) => {
  if (!req.session.userId) return res.json({ user: null });
  try {
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [req.session.userId]);
    res.json({ user: norm(result.rows[0]) });
  } catch (err) {
    res.json({ user: null });
  }
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

// Public Endpoints
app.get("/api/public/stats", async (req, res) => {
  try {
    const r1 = await pool.query("SELECT COUNT(*) FROM users WHERE status = 'ACTIVE'");
    const r2 = await pool.query("SELECT COUNT(*) FROM events");
    res.json({ members: parseInt(r1.rows[0].count || 0), events: parseInt(r2.rows[0].count || 0) });
  } catch (err) {
    res.json({ members: 0, events: 0 });
  }
});

app.get("/api/public/announcements", async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM announcements ORDER BY createdat DESC");
    res.json(r.rows.map(norm));
  } catch (err) {
    res.json([]);
  }
});

app.get("/api/public/events", async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM events ORDER BY createdat DESC");
    res.json(r.rows.map(norm));
  } catch (err) {
    res.json([]);
  }
});

app.post("/api/contact", async (req, res) => {
  const { name, phone, email, message } = req.body;
  try {
    await pool.query(
      "INSERT INTO contact_messages (id, name, phone, email, message) VALUES ($1, $2, $3, $4, $5)",
      ["msg-" + Date.now(), name, phone, email || "", message]
    );
    res.json({ success: true });
  } catch (err) {
    res.json({ success: true });
  }
});

app.post("/api/tickets", (req, res) => {
  res.json({ success: true, ticketId: "TCK-" + Math.floor(100000 + Math.random() * 900000) });
});

// Dashboard & Members
app.get("/api/dashboard", async (req, res) => {
  if (!req.session.userId) return res.json({ user: null });
  try {
    const uRes = await pool.query("SELECT * FROM users WHERE id = $1", [req.session.userId]);
    const user = norm(uRes.rows[0]);
    if (!user) return res.json({ user: null });

    const s1 = await pool.query("SELECT COUNT(*) FROM users WHERE status = 'ACTIVE'");
    const s2 = await pool.query("SELECT COUNT(*) FROM users WHERE status = 'PENDING'");
    const s3 = await pool.query("SELECT COUNT(*) FROM payments");
    const s4 = await pool.query("SELECT COUNT(*) FROM events");
    const regions = await pool.query("SELECT region as name, COUNT(*)::int as value FROM users WHERE status = 'ACTIVE' GROUP BY region");
    const recent = await pool.query("SELECT * FROM payments ORDER BY createdat DESC LIMIT 6");
    const myTot = await pool.query("SELECT COALESCE(SUM(amount),0) as total FROM payments WHERE userid = $1 AND status = 'APPROVED'", [user.id]);
    const sumPay = await pool.query("SELECT COALESCE(SUM(amount),0) as total FROM payments WHERE status = 'APPROVED'");
    const sumExp = await pool.query("SELECT COALESCE(SUM(amount),0) as total FROM expenses");
    const sumInc = await pool.query("SELECT COALESCE(SUM(amount),0) as total FROM manual_income");

    const mapato = Number(sumPay.rows[0].total) + Number(sumInc.rows[0].total);
    const matumizi = Number(sumExp.rows[0].total);

    res.json({
      user,
      stats: {
        members: parseInt(s1.rows[0].count),
        pending: parseInt(s2.rows[0].count),
        payments: parseInt(s3.rows[0].count),
        events: parseInt(s4.rows[0].count)
      },
      regions: regions.rows,
      recent: recent.rows.map(norm),
      myTotalPaid: Number(myTot.rows[0].total),
      finance: { mapato, matumizi, balance: mapato - matumizi }
    });
  } catch (err) {
    console.error(err);
    res.json({ user: null });
  }
});

app.get("/api/members", async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM users ORDER BY createdat DESC");
    res.json(r.rows.map(norm));
  } catch (err) {
    res.json([]);
  }
});

app.post("/api/approve-member", async (req, res) => {
  const { userId } = req.body;
  const wfcId = "WFC-DSM-" + Math.floor(100 + Math.random() * 900);
  try {
    await pool.query("UPDATE users SET status = 'ACTIVE', wfcid = $1 WHERE id = $2", [wfcId, userId]);
    res.json({ success: true, wfcId });
  } catch (err) {
    res.json({ error: "Imeshindwa kuidhinisha mwanachama" });
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

app.post("/api/set-role", async (req, res) => {
  try {
    await pool.query("UPDATE users SET role = $1 WHERE id = $2", [req.body.role, req.body.userId]);
    res.json({ success: true });
  } catch (err) {
    res.json({ error: "Imeshindwa kubadili jukumu" });
  }
});

// Payments & Automated PDF + QR Receipt Generation
app.get("/api/payments", async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM payments ORDER BY createdat DESC");
    res.json(r.rows.map(norm));
  } catch (err) {
    res.json([]);
  }
});

app.post("/api/submit-payment", async (req, res) => {
  if (!req.session.userId) return res.json({ error: "Tafadhali ingia kwanza" });
  try {
    const uRes = await pool.query("SELECT * FROM users WHERE id = $1", [req.session.userId]);
    const user = norm(uRes.rows[0]);
    const id = "pay-" + Date.now();
    await pool.query(
      `INSERT INTO payments (id, userid, username, type, amount, transactionid, status) VALUES ($1, $2, $3, $4, $5, $6, 'PENDING')`,
      [id, user.id, user.name, req.body.type, req.body.amount, req.body.transactionId]
    );
    res.json({ success: true });
  } catch (err) {
    res.json({ error: "Imeshindwa kuwasilisha malipo" });
  }
});

app.post("/api/approve-payment", async (req, res) => {
  const receiptNo = "WFC-RCP-" + Math.floor(100000 + Math.random() * 900000);
  const paymentId = req.body.paymentId;

  try {
    const pRes = await pool.query("SELECT * FROM payments WHERE id = $1", [paymentId]);
    const payment = norm(pRes.rows[0]);
    if (!payment) return res.json({ error: "Malipo hayajapatikana" });

    const filename = `${receiptNo}.pdf`;
    const filepath = path.join(receiptsDir, filename);
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    doc.rect(0, 0, 612, 105).fill("#111827");
    doc.fillColor("#F97316").fontSize(20).text("WACHAGGA FAMILY COMMUNITY", 50, 32);
    doc.fillColor("#FFFFFF").fontSize(12).text("Risiti Rasmi ya Malipo / Official Digital Receipt", 50, 62);

    doc.moveDown(4);
    doc.fillColor("#111827").fontSize(14).text(`Namba ya Risiti: ${receiptNo}`);
    doc.moveDown(0.8);
    doc.fontSize(11).text(`Jina la Mwanachama: ${payment.userName || "Mwanachama"}`);
    doc.text(`Aina ya Mchango: ${payment.type}`);
    doc.text(`Kiasi Kilicholipwa: TSh ${Number(payment.amount).toLocaleString()}`);
    doc.text(`Namba ya Muamala: ${payment.transactionId}`);
    doc.text(`Hali ya Malipo: IMETHIBITISHWA (APPROVED)`);
    doc.text(`Tarehe: ${new Date().toLocaleString()}`);

    try {
      const qrData = JSON.stringify({ org: "WFC", receipt: receiptNo, member: payment.userName, amount: payment.amount });
      const qrBuffer = await QRCode.toBuffer(qrData, { width: 130 });
      doc.image(qrBuffer, 415, 135, { width: 130 });
    } catch (e) {}

    doc.fontSize(10).fillColor("#6B7280").text("Imetolewa kidijitali na mfumo wa WFC Portal — Powered by Hugo Tech", 50, 720, { align: "center" });
    doc.end();

    stream.on("finish", async () => {
      const receiptUrl = `/receipts/${filename}`;
      await pool.query(
        "UPDATE payments SET status = 'APPROVED', receiptno = $1, receipturl = $2 WHERE id = $3",
        [receiptNo, receiptUrl, paymentId]
      );
      res.json({ success: true, receiptNo, receiptUrl });
    });
  } catch (err) {
    console.error(err);
    res.json({ error: "Imeshindwa kuidhinisha malipo" });
  }
});

// Events & Announcements
app.get("/api/events", async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM events ORDER BY createdat DESC");
    res.json(r.rows.map(norm));
  } catch (err) {
    res.json([]);
  }
});

app.post("/api/events", async (req, res) => {
  const id = "ev-" + Date.now();
  try {
    await pool.query(
      `INSERT INTO events (id, type, title, location, ticketprice, poster, eventdate) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, req.body.type || "Mkutano", req.body.title, req.body.location, req.body.ticketPrice || 0, req.body.poster || "", req.body.eventDate || ""]
    );
    res.json({ success: true });
  } catch (err) {
    res.json({ error: "Imeshindwa kuongeza tukio" });
  }
});

app.delete("/api/events/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM events WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.json({ error: "Imeshindwa kufuta" });
  }
});

app.get("/api/announcements", async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM announcements ORDER BY createdat DESC");
    res.json(r.rows.map(norm));
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
    res.json({ error: "Imeshindwa kuchapisha tangazo" });
  }
});

app.delete("/api/announcements/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM announcements WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.json({ error: "Imeshindwa kufuta" });
  }
});

// Accounting (Expenses & Manual Income)
app.get("/api/expenses", async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM expenses ORDER BY createdat DESC");
    res.json(r.rows.map(norm));
  } catch (err) {
    res.json([]);
  }
});

app.post("/api/expenses", async (req, res) => {
  try {
    await pool.query(
      "INSERT INTO expenses (id, title, amount, category) VALUES ($1, $2, $3, $4)",
      ["exp-" + Date.now(), req.body.title, req.body.amount, req.body.category || "Uendeshaji"]
    );
    res.json({ success: true });
  } catch (err) {
    res.json({ error: "Imeshindwa" });
  }
});

app.get("/api/manual-income", async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM manual_income ORDER BY createdat DESC");
    res.json(r.rows.map(norm));
  } catch (err) {
    res.json([]);
  }
});

app.post("/api/manual-income", async (req, res) => {
  try {
    await pool.query(
      "INSERT INTO manual_income (id, title, amount, source) VALUES ($1, $2, $3, $4)",
      ["inc-" + Date.now(), req.body.title, req.body.amount, req.body.source || "Wadau"]
    );
    res.json({ success: true });
  } catch (err) {
    res.json({ error: "Imeshindwa" });
  }
});

// Clean Frontend Page Routing
app.get(["/app", "/app/*"], (req, res) => {
  res.sendFile(path.join(__dirname, "../public/app.html"));
});

app.get(["/ticket", "/ticket/*"], (req, res) => {
  res.sendFile(path.join(__dirname, "../public/ticket.html"));
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.listen(PORT, () => {
  console.log(`WCF Portal Server inafanya kazi kwenye bandari: ${PORT}`);
});
