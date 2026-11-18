const express = require("express");
const session = require("express-session");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "../data");
const DATA_FILE = path.join(DATA_DIR, "db.json");

// Ensure data directory and file exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
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

// Ensure default Admin exists
(function ensureAdmin() {
  const db = loadDB();
  const adminPhone = "0700000000";
  if (!db.users.find(u => u.phone === adminPhone)) {
    db.users.push({
      id: "admin-001",
      name: "Mwenyekiti WFC",
      phone: adminPhone,
      region: "Dar es Salaam",
      password: "admin123",
      role: "ADMIN",
      status: "ACTIVE",
      wfcId: "WFC-ADMIN",
      createdAt: new Date().toISOString()
    });
    saveDB(db);
    console.log("Default Admin created: 0700000000 / admin123");
  }
})();

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

// ===== PUBLIC API (no login required) =====
app.get("/api/public/events", (req, res) => {
  const db = loadDB();
  res.json((db.events || []).filter(e => e.public !== false));
});

app.get("/api/public/announcements", (req, res) => {
  const db = loadDB();
  res.json(db.announcements || []);
});

// Serve uploaded posters
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

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

// ===== EVENTS =====
app.get("/api/events", requireAuth, (req, res) => {
  const db = loadDB();
  res.json(db.events || []);
});

app.post("/api/events", requireAuth, (req, res) => {
  const { type, title, location, targetAmount, ticketPrice, poster, description } = req.body;
  const db = loadDB();
  if (!db.events) db.events = [];
  db.events.push({
    id: Date.now().toString(),
    type, title, location, description: description || "",
    targetAmount: Number(targetAmount) || 0,
    ticketPrice: Number(ticketPrice) || 0,
    poster: poster || "",
    raisedAmount: 0,
    status: "ACTIVE",
    public: true,
    reportedBy: req.session.user.name,
    createdAt: new Date().toISOString()
  });
  saveDB(db);
  res.json({ success: true });
});

// ===== ANNOUNCEMENTS =====
app.get("/api/announcements", requireAuth, (req, res) => {
  const db = loadDB();
  res.json(db.announcements || []);
});

app.post("/api/announcements", requireAuth, (req, res) => {
  if (!["ADMIN", "SECRETARY"].includes(req.session.user.role)) {
    return res.status(403).json({ error: "Huna mamlaka" });
  }
  const { title, body } = req.body;
  const db = loadDB();
  if (!db.announcements) db.announcements = [];
  db.announcements.unshift({
    id: Date.now().toString(),
    title, body,
    author: req.session.user.name,
    createdAt: new Date().toISOString()
  });
  saveDB(db);
  res.json({ success: true });
});

app.get("/ticket/:id", (req, res) => res.sendFile(path.join(__dirname, "../public/ticket.html")));

// Simple ticket submission
app.post("/api/tickets", (req, res) => {
  const { eventId, name, phone, qty, transactionId } = req.body;
  const db = loadDB();
  if (!db.tickets) db.tickets = [];
  if (db.tickets.find(t => t.transactionId === transactionId)) {
    return res.status(400).json({ error: "Namba ya muamala tayari imetumika" });
  }
  db.tickets.push({
    id: Date.now().toString(),
    eventId, name, phone, qty: Number(qty) || 1, transactionId,
    status: "PENDING",
    createdAt: new Date().toISOString()
  });
  saveDB(db);
  res.json({ success: true });
});

// Catch-all for frontend
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.listen(PORT, () => console.log(`WFC Portal running on port ${PORT}`));
