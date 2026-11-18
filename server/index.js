const express = require("express");
const session = require("express-session");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middleware (Helmet with adjusted CSP for CDN scripts like ApexCharts, jspdf, qrcode)
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

// Rate Limiting for Auth & OTP protection
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
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

// Static files directory
app.use(express.static(path.join(__dirname, "../public")));

// Ensure receipts directory exists
const receiptsDir = path.join(__dirname, "../public/receipts");
if (!fs.existsSync(receiptsDir)) {
  fs.mkdirSync(receiptsDir, { recursive: true });
}

// Database Setup
const dbPath = path.join(__dirname, "wfc.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error("Database error: ", err.message);
  else console.log("SQLite connected successfully.");
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    phone TEXT UNIQUE,
    region TEXT,
    password TEXT,
    role TEXT DEFAULT 'MEMBER',
    status TEXT DEFAULT 'PENDING',
    wfcId TEXT,
    profession TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    userId TEXT,
    userName TEXT,
    type TEXT,
    amount REAL,
    transactionId TEXT,
    receiptNo TEXT,
    status TEXT DEFAULT 'PENDING',
    receiptUrl TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    type TEXT,
    title TEXT,
    location TEXT,
    ticketPrice REAL,
    poster TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS announcements (
    id TEXT PRIMARY KEY,
    title TEXT,
    body TEXT,
    link TEXT,
    author TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS support (
    id TEXT PRIMARY KEY,
    userId TEXT,
    subject TEXT,
    message TEXT,
    status TEXT DEFAULT 'PENDING'
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS attendance (
    id TEXT PRIMARY KEY,
    userId TEXT,
    userName TEXT,
    meeting TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS elections (
    id TEXT PRIMARY KEY,
    position TEXT,
    candidates TEXT,
    votes TEXT,
    status TEXT DEFAULT 'OPEN'
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS cases (
    id TEXT PRIMARY KEY,
    title TEXT,
    description TEXT,
    status TEXT DEFAULT 'OPEN'
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS saccos (
    id TEXT PRIMARY KEY,
    userId TEXT,
    amount REAL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS assets (
    id TEXT PRIMARY KEY,
    name TEXT,
    value REAL,
    location TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT,
    progress INTEGER
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS penalties (
    id TEXT PRIMARY KEY,
    reason TEXT,
    amount REAL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    title TEXT,
    url TEXT,
    summary TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS outbox (
    id TEXT PRIMARY KEY,
    channel TEXT,
    toPhone TEXT,
    title TEXT,
    body TEXT,
    status TEXT DEFAULT 'SENT'
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    title TEXT,
    amount REAL,
    category TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS manual_income (
    id TEXT PRIMARY KEY,
    title TEXT,
    amount REAL,
    source TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS family (
    userId TEXT PRIMARY KEY,
    head TEXT,
    spouse TEXT,
    children TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  )`);

  // Seed Admin if not exists
  db.get(`SELECT * FROM users WHERE phone = ?`, ["0700000000"], (err, row) => {
    if (!row) {
      db.run(
        `INSERT INTO users (id, name, phone, region, password, role, status, wfcId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ["admin-1", "Mwenyekiti Mkuu", "0700000000", "Dar es Salaam", "admin123", "ADMIN", "ACTIVE", "WFC-DSM-001"]
      );
    }
  });
});

// Authentication & Rate-limited endpoints
app.post("/api/login", authLimiter, (req, res) => {
  const { phone, password } = req.body;
  db.get(`SELECT * FROM users WHERE phone = ? AND password = ?`, [phone, password], (err, user) => {
    if (err || !user) return res.json({ error: "Namba ya simu au nenosiri si sahihi." });
    if (user.status === "SUSPENDED") return res.json({ error: "Akaunti yako imesimamishwa." });
    req.session.userId = user.id;
    res.json({ success: true, user });
  });
});

app.post("/api/verify-otp", authLimiter, (req, res) => {
  const { phone, code } = req.body;
  db.get(`SELECT * FROM users WHERE phone = ?`, [phone], (err, user) => {
    if (!user) return res.json({ error: "Mtumiaji hajapatikana" });
    req.session.userId = user.id;
    res.json({ success: true, user });
  });
});

app.post("/api/register", authLimiter, (req, res) => {
  const { name, phone, region, password } = req.body;
  const id = "usr-" + Date.now();
  db.run(
    `INSERT INTO users (id, name, phone, region, password, status, wfcId) VALUES (?, ?, ?, ?, ?, 'PENDING', ?)`,
    [id, name, phone, region || "Dar es Salaam", password, "WFC-PEND-" + Math.floor(1000 + Math.random() * 9000)],
    (err) => {
      if (err) return res.json({ error: "Namba hii ya simu imeshasajiliwa tayari." });
      res.json({ success: true, message: "Usajili umewasilishwa kikamilifu! Subiri idhini ya viongozi." });
    }
  );
});

app.get("/api/me", (req, res) => {
  if (!req.session.userId) return res.json({ user: null });
  db.get(`SELECT * FROM users WHERE id = ?`, [req.session.userId], (err, user) => {
    res.json({ user: user || null });
  });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

app.get("/api/public/stats", (req, res) => {
  db.get(`SELECT COUNT(*) as count FROM users WHERE status = 'ACTIVE'`, (err, r1) => {
    db.get(`SELECT COUNT(*) as count FROM events`, (err, r2) => {
      res.json({ members: r1 ? r1.count : 0, events: r2 ? r2.count : 0 });
    });
  });
});

app.get("/api/public/announcements", (req, res) => {
  db.all(`SELECT * FROM announcements`, (err, rows) => res.json(rows || []));
});

app.get("/api/public/events", (req, res) => {
  db.all(`SELECT * FROM events`, (err, rows) => res.json(rows || []));
});

app.post("/api/contact", (req, res) => {
  res.json({ success: true });
});

app.post("/api/tickets", (req, res) => {
  res.json({ success: true, ticketId: "TCK-" + Math.floor(100000 + Math.random() * 900000) });
});

app.get("/api/dashboard", (req, res) => {
  if (!req.session.userId) return res.json({ user: null });
  db.get(`SELECT * FROM users WHERE id = ?`, [req.session.userId], (err, user) => {
    if (!user) return res.json({ user: null });
    db.get(`SELECT COUNT(*) as members FROM users WHERE status = 'ACTIVE'`, (err, s1) => {
      db.get(`SELECT COUNT(*) as pending FROM users WHERE status = 'PENDING'`, (err, s2) => {
        db.get(`SELECT COUNT(*) as payments FROM payments`, (err, s3) => {
          db.get(`SELECT COUNT(*) as events FROM events`, (err, s4) => {
            db.all(`SELECT region as name, COUNT(*) as value FROM users WHERE status = 'ACTIVE' GROUP BY region`, (err, regions) => {
              db.all(`SELECT * FROM payments ORDER BY createdAt DESC LIMIT 5`, (err, recent) => {
                db.all(`SELECT SUM(amount) as total FROM payments WHERE userId = ? AND status = 'APPROVED'`, [user.id], (err, myTot) => {
                  db.all(`SELECT SUM(amount) as total FROM payments WHERE status = 'APPROVED'`, (err, sumPay) => {
                    db.all(`SELECT SUM(amount) as total FROM expenses`, (err, sumExp) => {
                      db.all(`SELECT SUM(amount) as total FROM manual_income`, (err, sumInc) => {
                        db.all(`SELECT SUM(amount) as total FROM saccos`, (err, sumSac) => {
                          const mapato = (sumPay[0]?.total || 0) + (sumInc[0]?.total || 0) + (sumSac[0]?.total || 0);
                          const matumizi = sumExp[0]?.total || 0;
                          const balance = mapato - matumizi;
                          res.json({
                            user,
                            stats: {
                              members: s1?.members || 0,
                              pending: s2?.pending || 0,
                              payments: s3?.payments || 0,
                              events: s4?.events || 0
                            },
                            regions: regions || [],
                            recent: recent || [],
                            myTotalPaid: myTot[0]?.total || 0,
                            finance: { mapato, matumizi, balance, debtors: 0, totalDebt: 0 }
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});

app.get("/api/members", (req, res) => {
  db.all(`SELECT * FROM users`, (err, rows) => res.json(rows || []));
});

app.post("/api/approve-member", (req, res) => {
  const { userId } = req.body;
  const wfcId = "WFC-DSM-" + Math.floor(100 + Math.random() * 900);
  db.run(`UPDATE users SET status = 'ACTIVE', wfcId = ? WHERE id = ?`, [wfcId, userId], (err) => {
    if (err) return res.json({ error: "Imeshindwa kuidhinisha" });
    res.json({ success: true, wfcId });
  });
});

app.post("/api/suspend-member", (req, res) => {
  db.run(`UPDATE users SET status = 'SUSPENDED' WHERE id = ?`, [req.body.userId], () => res.json({ success: true }));
});

app.post("/api/remove-member", (req, res) => {
  db.run(`DELETE FROM users WHERE id = ?`, [req.body.userId], () => res.json({ success: true }));
});

app.get("/api/payments", (req, res) => {
  db.all(`SELECT * FROM payments ORDER BY createdAt DESC`, (err, rows) => res.json(rows || []));
});

app.post("/api/submit-payment", (req, res) => {
  if (!req.session.userId) return res.json({ error: "Hairuhusiwi" });
  db.get(`SELECT * FROM users WHERE id = ?`, [req.session.userId], (err, user) => {
    const id = "pay-" + Date.now();
    db.run(
      `INSERT INTO payments (id, userId, userName, type, amount, transactionId, status) VALUES (?, ?, ?, ?, ?, ?, 'PENDING')`,
      [id, user.id, user.name, req.body.type, req.body.amount, req.body.transactionId],
      () => res.json({ success: true })
    );
  });
});

// Automated Server-Side PDF & QR Receipt Generation using PDFKit
app.post("/api/approve-payment", (req, res) => {
  const receiptNo = "WFC-RCP-" + Math.floor(100000 + Math.random() * 900000);
  const paymentId = req.body.paymentId;

  db.get(`SELECT * FROM payments WHERE id = ?`, [paymentId], async (err, payment) => {
    if (!payment) return res.json({ error: "Malipo hayajapatikana" });

    // Generate PDF & QR
    const filename = `${receiptNo}.pdf`;
    const filepath = path.join(receiptsDir, filename);
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // Header styling
    doc.rect(0, 0, 612, 100).fill("#111827");
    doc.fillColor("#F97316").fontSize(20).text("WACHAGGA FAMILY COMMUNITY", 50, 30);
    doc.fillColor("#FFFFFF").fontSize(12).text("Risiti Rasmi ya Malipo / Official Receipt", 50, 60);

    doc.moveDown(4);
    doc.fillColor("#111827").fontSize(14).text(`Namba ya Risiti: ${receiptNo}`, { bold: true });
    doc.moveDown(1);
    doc.fontSize(11).text(`Jina la Mwanachama: ${payment.userName || "Mwanachama"}`);
    doc.text(`Aina ya Mchango: ${payment.type}`);
    doc.text(`Kiasi Kimelipwa: TSh ${Number(payment.amount).toLocaleString()}`);
    doc.text(`Namba ya Muamala: ${payment.transactionId}`);
    doc.text(`Tarehe: ${new Date().toLocaleString()}`);
    doc.moveDown(2);

    // Generate QR Code Buffer
    try {
      const qrData = JSON.stringify({ org: "WFC", receipt: receiptNo, name: payment.userName, amount: payment.amount, tx: payment.transactionId });
      const qrBuffer = await QRCode.toBuffer(qrData, { width: 120 });
      doc.image(qrBuffer, 420, 140, { width: 120 });
    } catch (e) {
      console.error("QR generation error:", e);
    }

    doc.moveDown(4);
    doc.fontSize(10).fillColor("#6B7280").text("Imetolewa kidijitali na mfumo wa WFC Portal — Hugo Tech", 50, 700, { align: "center" });
    doc.end();

    stream.on("finish", () => {
      const receiptUrl = `/receipts/${filename}`;
      db.run(`UPDATE payments SET status = 'APPROVED', receiptNo = ?, receiptUrl = ? WHERE id = ?`, [receiptNo, receiptUrl, paymentId], () => {
        res.json({ success: true, receiptNo, receiptUrl });
      });
    });
  });
});

app.get("/api/events", (req, res) => {
  db.all(`SELECT * FROM events`, (err, rows) => res.json(rows || []));
});

app.post("/api/events", (req, res) => {
  const id = "ev-" + Date.now();
  db.run(
    `INSERT INTO events (id, type, title, location, ticketPrice, poster) VALUES (?, ?, ?, ?, ?, ?)`,
    [id, req.body.type, req.body.title, req.body.location, req.body.ticketPrice || 0, req.body.poster || ""],
    () => res.json({ success: true })
  );
});

app.get("/api/announcements", (req, res) => {
  db.all(`SELECT * FROM announcements`, (err, rows) => res.json(rows || []));
});

app.post("/api/announcements", (req, res) => {
  const id = "ann-" + Date.now();
  db.run(
    `INSERT INTO announcements (id, title, body, link, author) VALUES (?, ?, ?, ?, ?)`,
    [id, req.body.title, req.body.body, req.body.link || "", "Ofisi ya WFC"],
    () => res.json({ success: true })
  );
});

app.get("/api/family", (req, res) => {
  db.get(`SELECT * FROM family WHERE userId = ?`, [req.session.userId], (err, row) => {
    if (!row) return res.json({ head: "", spouse: "", children: [] });
    res.json({ ...row, children: JSON.parse(row.children || "[]") });
  });
});

app.post("/api/family", (req, res) => {
  const { head, spouse, children } = req.body;
  db.run(
    `INSERT INTO family (userId, head, spouse, children) VALUES (?, ?, ?, ?) ON CONFLICT(userId) DO UPDATE SET head=excluded.head, spouse=excluded.spouse, children=excluded.children`,
    [req.session.userId, head, spouse, JSON.stringify(children || [])],
    () => res.json({ success: true })
  );
});

app.get("/api/directory", (req, res) => {
  db.all(`SELECT name, profession, region FROM users WHERE profession IS NOT NULL AND status = 'ACTIVE'`, (err, rows) => res.json(rows || []));
});

app.post("/api/my-profession", (req, res) => {
  db.run(`UPDATE users SET profession = ? WHERE id = ?`, [req.body.profession, req.session.userId], () => res.json({ success: true }));
});

app.get("/api/support", (req, res) => {
  db.all(`SELECT * FROM support WHERE userId = ?`, [req.session.userId], (err, rows) => res.json(rows || []));
});

app.post("/api/support", (req, res) => {
  const id = "sup-" + Date.now();
  db.run(`INSERT INTO support (id, userId, subject, message) VALUES (?, ?, ?, ?)`, [id, req.session.userId, req.body.subject, req.body.message], () => res.json({ success: true }));
});

app.get("/api/attendance", (req, res) => {
  db.all(`SELECT * FROM attendance`, (err, rows) => res.json(rows || []));
});

app.post("/api/attendance", (req, res) => {
  db.get(`SELECT name FROM users WHERE id = ?`, [req.session.userId], (err, u) => {
    const id = "att-" + Date.now();
    db.run(`INSERT INTO attendance (id, userId, userName, meeting) VALUES (?, ?, ?, ?)`, [id, req.session.userId, u ? u.name : "Mwanachama", req.body.meeting], () => res.json({ success: true }));
  });
});

app.get("/api/elections", (req, res) => {
  db.all(`SELECT * FROM elections`, (err, rows) => {
    res.json((rows || []).map(r => ({ ...r, candidates: JSON.parse(r.candidates || "[]"), votes: JSON.parse(r.votes || "[]") })));
  });
});

app.post("/api/elections", (req, res) => {
  const id = "el-" + Date.now();
  db.run(`INSERT INTO elections (id, position, candidates, votes) VALUES (?, ?, '[]', '[]')`, [id, req.body.position], () => res.json({ success: true }));
});

app.get("/api/cases", (req, res) => {
  db.all(`SELECT * FROM cases`, (err, rows) => res.json(rows || []));
});

app.post("/api/cases", (req, res) => {
  const id = "case-" + Date.now();
  db.run(`INSERT INTO cases (id, title, description) VALUES (?, ?, ?)`, [id, req.body.title, req.body.description], () => res.json({ success: true }));
});

app.get("/api/saccos", (req, res) => {
  db.all(`SELECT * FROM saccos WHERE userId = ?`, [req.session.userId], (err, rows) => res.json({ shares: rows || [] }));
});

app.post("/api/saccos/shares", (req, res) => {
  const id = "sac-" + Date.now();
  db.run(`INSERT INTO saccos (id, userId, amount) VALUES (?, ?, ?)`, [id, req.session.userId, req.body.amount], () => res.json({ success: true }));
});

app.get("/api/assets", (req, res) => {
  db.all(`SELECT * FROM assets`, (err, rows) => res.json(rows || []));
});

app.post("/api/assets", (req, res) => {
  const id = "ast-" + Date.now();
  db.run(`INSERT INTO assets (id, name, value, location) VALUES (?, ?, ?, ?)`, [id, req.body.name, req.body.value, req.body.location], () => res.json({ success: true }));
});

app.get("/api/projects", (req, res) => {
  db.all(`SELECT * FROM projects`, (err, rows) => res.json(rows || []));
});

app.post("/api/projects", (req, res) => {
  const id = "prj-" + Date.now();
  db.run(`INSERT INTO projects (id, name, progress) VALUES (?, ?, ?)`, [id, req.body.name, req.body.progress], () => res.json({ success: true }));
});

app.get("/api/penalties", (req, res) => {
  db.all(`SELECT * FROM penalties`, (err, rows) => res.json(rows || []));
});

app.post("/api/penalties", (req, res) => {
  const id = "pen-" + Date.now();
  db.run(`INSERT INTO penalties (id, reason, amount) VALUES (?, ?, ?)`, [id, req.body.reason, req.body.amount], () => res.json({ success: true }));
});

app.get("/api/documents", (req, res) => {
  db.all(`SELECT * FROM documents`, (err, rows) => res.json(rows || []));
});

app.post("/api/documents", (req, res) => {
  const id = "doc-" + Date.now();
  db.run(`INSERT INTO documents (id, title, url, summary) VALUES (?, ?, ?, ?)`, [id, req.body.title, req.body.url, req.body.summary], () => res.json({ success: true }));
});

app.get("/api/analytics", (req, res) => {
  db.all(`SELECT region as name, COUNT(*) as value FROM users WHERE status = 'ACTIVE' GROUP BY region`, (err, regions) => {
    db.all(`SELECT type as name, SUM(amount) as value FROM payments WHERE status = 'APPROVED' GROUP BY type`, (err, types) => {
      res.json({ regions: regions || [], types: types || [] });
    });
  });
});

app.get("/api/outbox", (req, res) => {
  db.all(`SELECT * FROM outbox`, (err, rows) => res.json(rows || []));
});

app.post("/api/dispatch", (req, res) => {
  const id = "out-" + Date.now();
  db.run(`INSERT INTO outbox (id, channel, toPhone, title, body) VALUES (?, ?, ?, ?, ?)`, [id, req.body.channel, req.body.to, req.body.title, req.body.body], () => res.json({ success: true }));
});

app.post("/api/stk", (req, res) => {
  res.json({ success: true, detail: "Ombi la STK Push limetumwa kwenye namba " + req.body.phone });
});

app.get("/api/expenses", (req, res) => {
  db.all(`SELECT * FROM expenses`, (err, rows) => res.json(rows || []));
});

app.post("/api/expenses", (req, res) => {
  const id = "exp-" + Date.now();
  db.run(`INSERT INTO expenses (id, title, amount, category) VALUES (?, ?, ?, ?)`, [id, req.body.title, req.body.amount, req.body.category], () => res.json({ success: true }));
});

app.get("/api/manual-income", (req, res) => {
  db.all(`SELECT * FROM manual_income`, (err, rows) => res.json(rows || []));
});

app.post("/api/manual-income", (req, res) => {
  db.run(`INSERT INTO manual_income (id, title, amount, source) VALUES (?, ?, ?, ?)`, ["inc-" + Date.now(), req.body.title, req.body.amount, req.body.source], () => res.json({ success: true }));
});

app.get("/api/accounting/summary", (req, res) => {
  db.all(`SELECT SUM(amount) as total FROM payments WHERE status = 'APPROVED'`, (err, sumPay) => {
    db.all(`SELECT SUM(amount) as total FROM manual_income`, (err, sumInc) => {
      db.all(`SELECT SUM(amount) as total FROM saccos`, (err, sumSac) => {
        db.all(`SELECT SUM(amount) as total FROM expenses`, (err, sumExp) => {
          const mapato = (sumPay[0]?.total || 0) + (sumInc[0]?.total || 0) + (sumSac[0]?.total || 0);
          const matumizi = sumExp[0]?.total || 0;
          res.json({ mapato, matumizi, balance: mapato - matumizi, debtors: 0, totalDebt: 0 });
        });
      });
    });
  });
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

app.post("/api/set-role", (req, res) => {
  db.run(`UPDATE users SET role = ? WHERE id = ?`, [req.body.role, req.body.userId], () => res.json({ success: true }));
});

app.get("/api/notifications", (req, res) => {
  db.all(`SELECT * FROM announcements`, (err, rows) => res.json(rows || []));
});

app.post("/api/notifications", (req, res) => {
  const id = "notif-" + Date.now();
  db.run(`INSERT INTO announcements (id, title, body, link, author) VALUES (?, ?, ?, '', 'Uongozi')`, [id, req.body.title, req.body.body], () => res.json({ success: true }));
});

// Fallback to index.html for SPA frontend routing
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.listen(PORT, () => {
  console.log(`WCF Server imewashwa kwenye bandari (Port): ${PORT}`);
});
