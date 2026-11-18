const express = require("express");
const session = require("express-session");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "../data");
const DATA_FILE = path.join(DATA_DIR, "db.json");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const defaultDB = {
  users: [],
  payments: [],
  events: [],
  tickets: [],
  announcements: [],
  supportTickets: [],
  attendance: [],
  settings: {
    registrationFee: 1000,
    entryFee: 50000,
    monthlyFee: 10000,
    emergencyFee: 60000,
    latePenalty: 2000,
    paymentNumbers: { mpesa: "0755 000 888", tigo: "0715 000 888", airtel: "0785 000 888", crdb: "0150889944200" }
  }
};

if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify(defaultDB, null, 2));

function loadDB() { return JSON.parse(fs.readFileSync(DATA_FILE, "utf8")); }
function saveDB(db) { fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2)); }

(function ensureAdmin() {
  const db = loadDB();
  if (!db.users.find(u => u.phone === "0700000000")) {
    db.users.push({
      id: "admin-001", name: "Mwenyekiti WFC", phone: "0700000000", region: "Dar es Salaam",
      password: "admin123", role: "ADMIN", status: "ACTIVE", wfcId: "WFC-ADMIN",
      family: { head: "Mwenyekiti WFC", spouse: "", children: [] },
      profession: "Kiongozi", createdAt: new Date().toISOString()
    });
    saveDB(db);
  }
})();

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../public")));
app.use(session({ secret: process.env.SESSION_SECRET || "wfc-secret", resave: false, saveUninitialized: false }));

function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: "Login required" });
  next();
}
function isLeader(role) { return ["ADMIN", "CHAIRPERSON", "SECRETARY", "TREASURER", "REGIONAL"].includes(role); }

// Public
app.get("/", (req, res) => {
  if (req.session.user) return res.redirect("/app");
  res.sendFile(path.join(__dirname, "../public/landing.html"));
});
app.get("/app", (req, res) => res.sendFile(path.join(__dirname, "../public/index.html")));
app.get("/ticket/:id", (req, res) => res.sendFile(path.join(__dirname, "../public/ticket.html")));

app.get("/api/public/events", (req, res) => {
  const db = loadDB();
  res.json((db.events || []).filter(e => e.public !== false));
});
app.get("/api/public/announcements", (req, res) => res.json(loadDB().announcements || []));

app.post("/api/register", (req, res) => {
  const { name, phone, region, password, paymentProof } = req.body;
  if (!name || !phone || !password) return res.status(400).json({ error: "Jaza taarifa zote" });
  const db = loadDB();
  if (db.users.find(u => u.phone === phone)) return res.status(400).json({ error: "Namba tayari imesajiliwa" });
  db.users.push({
    id: Date.now().toString(), name, phone, region: region || "Dar es Salaam", password,
    role: "MEMBER", status: "PENDING", paymentProof: paymentProof || "", wfcId: null,
    family: { head: name, spouse: "", children: [] }, profession: "", createdAt: new Date().toISOString()
  });
  saveDB(db);
  res.json({ success: true, message: "Usajili umepokelewa. Subiri idhini." });
});

app.post("/api/login", (req, res) => {
  const { phone, password } = req.body;
  const db = loadDB();
  const user = db.users.find(u => u.phone === phone && u.password === password);
  if (!user) return res.status(401).json({ error: "Taarifa si sahihi" });
  req.session.user = { id: user.id, name: user.name, phone: user.phone, role: user.role, status: user.status, wfcId: user.wfcId };
  res.json({ success: true, user: req.session.user });
});

app.post("/api/logout", (req, res) => { req.session.destroy(); res.json({ success: true }); });
app.get("/api/me", (req, res) => res.json({ user: req.session.user || null }));

// Dashboard
app.get("/api/dashboard", requireAuth, (req, res) => {
  const db = loadDB();
  const user = db.users.find(u => u.id === req.session.user.id);
  const myPayments = db.payments.filter(p => p.userId === user.id && p.status === "APPROVED");
  const totalPaid = myPayments.reduce((s, p) => s + (p.amount || 0), 0);
  res.json({
    user,
    stats: {
      members: db.users.filter(u => u.status === "ACTIVE").length,
      pending: db.users.filter(u => u.status === "PENDING").length,
      payments: db.payments.length,
      events: (db.events || []).length
    },
    myTotalPaid: totalPaid,
    settings: db.settings
  });
});

// Members
app.get("/api/members", requireAuth, (req, res) => {
  const db = loadDB();
  res.json(db.users.map(u => ({
    id: u.id, name: u.name, phone: u.phone, region: u.region, status: u.status, role: u.role, wfcId: u.wfcId, profession: u.profession
  })));
});

app.post("/api/approve-member", requireAuth, (req, res) => {
  if (!isLeader(req.session.user.role)) return res.status(403).json({ error: "Huna mamlaka" });
  const db = loadDB();
  const user = db.users.find(u => u.id === req.body.userId);
  if (!user) return res.status(404).json({ error: "Hajapatikana" });
  user.status = "ACTIVE";
  if (!user.wfcId) user.wfcId = "WFC-" + String(db.users.filter(u => u.wfcId).length + 1).padStart(4, "0");
  saveDB(db);
  res.json({ success: true, wfcId: user.wfcId });
});

// Payments
app.get("/api/payments", requireAuth, (req, res) => res.json(loadDB().payments));

app.post("/api/submit-payment", requireAuth, (req, res) => {
  const { type, amount, transactionId } = req.body;
  const db = loadDB();
  if (db.payments.find(p => p.transactionId === transactionId)) return res.status(400).json({ error: "Namba ya muamala tayari imetumika" });
  db.payments.push({
    id: Date.now().toString(), userId: req.session.user.id, userName: req.session.user.name,
    type, amount: Number(amount), transactionId, status: "PENDING", createdAt: new Date().toISOString()
  });
  saveDB(db);
  res.json({ success: true });
});

app.post("/api/approve-payment", requireAuth, (req, res) => {
  if (!["ADMIN", "TREASURER", "CHAIRPERSON"].includes(req.session.user.role)) return res.status(403).json({ error: "Huna mamlaka" });
  const db = loadDB();
  const p = db.payments.find(x => x.id === req.body.paymentId);
  if (!p) return res.status(404).json({ error: "Haijapatikana" });
  p.status = "APPROVED";
  p.approvedAt = new Date().toISOString();
  p.receiptNo = "RCP-" + Date.now().toString().slice(-6);
  saveDB(db);
  res.json({ success: true, receiptNo: p.receiptNo });
});

// Events
app.get("/api/events", requireAuth, (req, res) => res.json(loadDB().events || []));
app.post("/api/events", requireAuth, (req, res) => {
  const db = loadDB();
  if (!db.events) db.events = [];
  db.events.push({
    id: Date.now().toString(), ...req.body,
    ticketPrice: Number(req.body.ticketPrice) || 0,
    raisedAmount: 0, status: "ACTIVE", public: true,
    reportedBy: req.session.user.name, createdAt: new Date().toISOString()
  });
  saveDB(db);
  res.json({ success: true });
});

// Announcements
app.get("/api/announcements", requireAuth, (req, res) => res.json(loadDB().announcements || []));
app.post("/api/announcements", requireAuth, (req, res) => {
  if (!isLeader(req.session.user.role)) return res.status(403).json({ error: "Huna mamlaka" });
  const db = loadDB();
  if (!db.announcements) db.announcements = [];
  db.announcements.unshift({ id: Date.now().toString(), ...req.body, author: req.session.user.name, createdAt: new Date().toISOString() });
  saveDB(db);
  res.json({ success: true });
});

// Family
app.get("/api/family", requireAuth, (req, res) => {
  const db = loadDB();
  const u = db.users.find(x => x.id === req.session.user.id);
  res.json(u.family || {});
});
app.post("/api/family", requireAuth, (req, res) => {
  const db = loadDB();
  const u = db.users.find(x => x.id === req.session.user.id);
  u.family = req.body;
  saveDB(db);
  res.json({ success: true });
});

// Directory
app.get("/api/directory", requireAuth, (req, res) => {
  const db = loadDB();
  res.json(db.users.filter(u => u.status === "ACTIVE" && u.profession).map(u => ({ name: u.name, profession: u.profession, region: u.region })));
});
app.post("/api/my-profession", requireAuth, (req, res) => {
  const db = loadDB();
  const u = db.users.find(x => x.id === req.session.user.id);
  u.profession = req.body.profession;
  saveDB(db);
  res.json({ success: true });
});

// Help
app.get("/api/support", requireAuth, (req, res) => {
  const db = loadDB();
  const list = (db.supportTickets || []).filter(t => t.userId === req.session.user.id || isLeader(req.session.user.role));
  res.json(list);
});
app.post("/api/support", requireAuth, (req, res) => {
  const db = loadDB();
  if (!db.supportTickets) db.supportTickets = [];
  db.supportTickets.push({ id: Date.now().toString(), userId: req.session.user.id, userName: req.session.user.name, ...req.body, status: "OPEN", createdAt: new Date().toISOString() });
  saveDB(db);
  res.json({ success: true });
});

// Tickets
app.post("/api/tickets", (req, res) => {
  const db = loadDB();
  if (!db.tickets) db.tickets = [];
  if (db.tickets.find(t => t.transactionId === req.body.transactionId)) return res.status(400).json({ error: "Namba tayari imetumika" });
  db.tickets.push({ id: Date.now().toString(), ...req.body, status: "PENDING", createdAt: new Date().toISOString() });
  saveDB(db);
  res.json({ success: true });
});

app.get("*", (req, res) => res.sendFile(path.join(__dirname, "../public/index.html")));
app.listen(PORT, () => console.log("WFC running on " + PORT));
