const express = require("express");
const session = require("express-session");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "../data/db.json");

fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });

// Ensure data file exists
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({
    users: [],
    members: [],
    payments: [],
    events: [],
    announcements: [],
    settings: {
      registrationFee: 1000,
      entryFee: 50000,
      monthlyFee: 10000,
      emergencyFee: 60000,
      paymentNumbers: {
        mpesa: "0755 000 888",
        tigo: "0715 000 888",
        airtel: "0785 000 888",
        crdb: "0150889944200"
      }
    }
  }, null, 2));
}

function loadDB() { return JSON.parse(fs.readFileSync(DATA_FILE, "utf8")); }
function saveDB(db) { fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2)); }

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../public")));
app.use(session({
  secret: process.env.SESSION_SECRET || "wfc-secret-key-change-in-production",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// Auth middleware
function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: "Login required" });
  next();
}

// ===== PUBLIC ROUTES =====
app.post("/api/register", (req, res) => {
  const { name, phone, region, password, paymentProof } = req.body;
  if (!name || !phone || !password) return res.status(400).json({ error: "Jaza taarifa zote" });

  const db = loadDB();
  if (db.users.find(u => u.phone === phone)) return res.status(400).json({ error: "Namba ya simu tayari imesajiliwa" });

  const user = {
    id: Date.now().toString(),
    name, phone, region: region || "Dar es Salaam",
    password, // In production: hash this
    role: "MEMBER",
    status: "PENDING",
    paymentProof: paymentProof || "",
    createdAt: new Date().toISOString()
  };
  db.users.push(user);
  saveDB(db);
  res.json({ success: true, message: "Usajili umepokelewa. Subiri idhini." });
});

app.post("/api/login", (req, res) => {
  const { phone, password } = req.body;
  const db = loadDB();
  const user = db.users.find(u => u.phone === phone && u.password === password);
  if (!user) return res.status(401).json({ error: "Namba au nenosiri si sahihi" });

  req.session.user = { id: user.id, name: user.name, phone: user.phone, role: user.role, status: user.status };
  res.json({ success: true, user: req.session.user });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get("/api/me", (req, res) => {
  if (!req.session.user) return res.json({ user: null });
  res.json({ user: req.session.user });
});

// ===== PROTECTED ROUTES =====
app.get("/api/dashboard", requireAuth, (req, res) => {
  const db = loadDB();
  const user = db.users.find(u => u.id === req.session.user.id);
  res.json({
    user,
    stats: {
      members: db.users.filter(u => u.status === "ACTIVE").length,
      pending: db.users.filter(u => u.status === "PENDING").length,
      payments: db.payments.length
    },
    settings: db.settings
  });
});

app.get("/api/members", requireAuth, (req, res) => {
  const db = loadDB();
  const members = db.users.map(u => ({
    id: u.id, name: u.name, phone: u.phone, region: u.region, status: u.status, role: u.role
  }));
  res.json(members);
});

app.post("/api/approve-member", requireAuth, (req, res) => {
  if (!["ADMIN", "TREASURER", "SECRETARY"].includes(req.session.user.role)) {
    return res.status(403).json({ error: "Huna mamlaka" });
  }
  const { userId } = req.body;
  const db = loadDB();
  const user = db.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: "Mwanachama hajapatikana" });
  user.status = "ACTIVE";
  user.wfcId = "WFC-" + String(db.users.filter(u => u.wfcId).length + 1).padStart(4, "0");
  saveDB(db);
  res.json({ success: true, wfcId: user.wfcId });
});

app.get("/api/payments", requireAuth, (req, res) => {
  const db = loadDB();
  res.json(db.payments);
});

app.post("/api/submit-payment", requireAuth, (req, res) => {
  const { type, amount, transactionId, proof } = req.body;
  const db = loadDB();
  // Anti-duplicate
  if (db.payments.find(p => p.transactionId === transactionId)) {
    return res.status(400).json({ error: "Namba ya muamala tayari imetumika" });
  }
  db.payments.push({
    id: Date.now().toString(),
    userId: req.session.user.id,
    userName: req.session.user.name,
    type, amount: Number(amount), transactionId, proof: proof || "",
    status: "PENDING",
    createdAt: new Date().toISOString()
  });
  saveDB(db);
  res.json({ success: true });
});

app.post("/api/approve-payment", requireAuth, (req, res) => {
  if (!["ADMIN", "TREASURER"].includes(req.session.user.role)) {
    return res.status(403).json({ error: "Huna mamlaka" });
  }
  const { paymentId } = req.body;
  const db = loadDB();
  const payment = db.payments.find(p => p.id === paymentId);
  if (!payment) return res.status(404).json({ error: "Malipo hayajapatikana" });
  payment.status = "APPROVED";
  payment.approvedAt = new Date().toISOString();
  payment.receiptNo = "RCP-" + Date.now().toString().slice(-6);
  saveDB(db);
  res.json({ success: true, receiptNo: payment.receiptNo });
});

// Catch-all for frontend
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.listen(PORT, () => console.log(`WFC Portal running on port ${PORT}`));
