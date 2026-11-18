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
  if (user.twoFactor) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    db.otps = (db.otps || []).filter(o => o.exp > Date.now());
    db.otps.push({ phone: user.phone, code, exp: Date.now() + 5 * 60 * 1000 });
    saveDB(db);
    const smsOn = !!(db.settings.smsKey && db.settings.smsUsername);
    return res.json({ needOtp: true, devCode: smsOn ? null : code });
  }
  req.session.user = { id: user.id, name: user.name, phone: user.phone, role: user.role, status: user.status, wfcId: user.wfcId };
  res.json({ success: true, user: req.session.user });
});

app.post("/api/verify-otp", (req, res) => {
  const db = loadDB();
  const otp = (db.otps || []).find(o => o.phone === req.body.phone && o.code === String(req.body.code || "").trim() && o.exp > Date.now());
  if (!otp) return res.status(401).json({ error: "Msimbo si sahihi au umeisha" });
  const user = db.users.find(u => u.phone === req.body.phone);
  if (!user) return res.status(401).json({ error: "Akaunti haijapatikana" });
  db.otps = db.otps.filter(o => o !== otp);
  saveDB(db);
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

// ===== NEW MODULES =====

// Debt calculation
app.get("/api/my-debt", requireAuth, (req, res) => {
  const db = loadDB();
  const user = db.users.find(u => u.id === req.session.user.id);
  if (!user || user.status !== "ACTIVE") return res.json({ debt: 0, breakdown: [] });
  const monthly = db.settings.monthlyFee || 10000;
  const monthsSince = Math.max(1, Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (30*24*60*60*1000)));
  const expected = monthsSince * monthly;
  const paid = db.payments.filter(p => p.userId === user.id && p.type === "Ada ya mwezi" && p.status === "APPROVED").reduce((s,p)=>s+(p.amount||0),0);
  const debt = Math.max(0, expected - paid);
  res.json({ debt, expected, paid, months: monthsSince });
});

// Attendance
app.get("/api/attendance", requireAuth, (req, res) => res.json(loadDB().attendance || []));
app.post("/api/attendance", requireAuth, (req, res) => {
  const db = loadDB();
  if (!db.attendance) db.attendance = [];
  db.attendance.push({ id: Date.now().toString(), userId: req.session.user.id, userName: req.session.user.name, meeting: req.body.meeting || "Mkutano", date: new Date().toISOString() });
  saveDB(db);
  res.json({ success: true });
});

// Election
app.get("/api/elections", requireAuth, (req, res) => res.json(loadDB().elections || []));
app.post("/api/elections", requireAuth, (req, res) => {
  if (!isLeader(req.session.user.role)) return res.status(403).json({ error: "Huna mamlaka" });
  const db = loadDB();
  if (!db.elections) db.elections = [];
  db.elections.push({ id: Date.now().toString(), position: req.body.position, candidates: [], votes: [], status: "OPEN", createdAt: new Date().toISOString() });
  saveDB(db);
  res.json({ success: true });
});
app.post("/api/elections/nominate", requireAuth, (req, res) => {
  const db = loadDB();
  const e = (db.elections||[]).find(x => x.id === req.body.electionId);
  if (!e) return res.status(404).json({ error: "Haijapatikana" });
  e.candidates.push({ name: req.body.name, manifesto: req.body.manifesto || "" });
  saveDB(db);
  res.json({ success: true });
});
app.post("/api/elections/vote", requireAuth, (req, res) => {
  const db = loadDB();
  const e = (db.elections||[]).find(x => x.id === req.body.electionId);
  if (!e) return res.status(404).json({ error: "Haijapatikana" });
  if (e.votes.find(v => v.userId === req.session.user.id)) return res.status(400).json({ error: "Umeshapiga kura" });
  e.votes.push({ userId: req.session.user.id, candidate: req.body.candidate });
  saveDB(db);
  res.json({ success: true });
});

// Discipline
app.get("/api/cases", requireAuth, (req, res) => res.json(loadDB().cases || []));
app.post("/api/cases", requireAuth, (req, res) => {
  const db = loadDB();
  if (!db.cases) db.cases = [];
  db.cases.push({ id: Date.now().toString(), ...req.body, status: "OPEN", createdAt: new Date().toISOString() });
  saveDB(db);
  res.json({ success: true });
});

// SACCOS
app.get("/api/saccos", requireAuth, (req, res) => res.json(loadDB().saccos || { shares: [], savings: [], loans: [] }));
app.post("/api/saccos/shares", requireAuth, (req, res) => {
  const db = loadDB();
  if (!db.saccos) db.saccos = { shares: [], savings: [], loans: [] };
  db.saccos.shares.push({ id: Date.now().toString(), userId: req.session.user.id, amount: Number(req.body.amount), date: new Date().toISOString() });
  saveDB(db);
  res.json({ success: true });
});

// Assets
app.get("/api/assets", requireAuth, (req, res) => res.json(loadDB().assets || []));
app.post("/api/assets", requireAuth, (req, res) => {
  if (!isLeader(req.session.user.role)) return res.status(403).json({ error: "Huna mamlaka" });
  const db = loadDB();
  if (!db.assets) db.assets = [];
  db.assets.push({ id: Date.now().toString(), ...req.body, createdAt: new Date().toISOString() });
  saveDB(db);
  res.json({ success: true });
});

// Projects
app.get("/api/projects", requireAuth, (req, res) => res.json(loadDB().projects || []));
app.post("/api/projects", requireAuth, (req, res) => {
  const db = loadDB();
  if (!db.projects) db.projects = [];
  db.projects.push({ id: Date.now().toString(), ...req.body, progress: 0, tasks: [], createdAt: new Date().toISOString() });
  saveDB(db);
  res.json({ success: true });
});

// Penalties
app.get("/api/penalties", requireAuth, (req, res) => res.json(loadDB().penalties || []));
app.post("/api/penalties", requireAuth, (req, res) => {
  if (!isLeader(req.session.user.role)) return res.status(403).json({ error: "Huna mamlaka" });
  const db = loadDB();
  if (!db.penalties) db.penalties = [];
  db.penalties.push({ id: Date.now().toString(), ...req.body, createdAt: new Date().toISOString() });
  saveDB(db);
  res.json({ success: true });
});

// Documents
app.get("/api/documents", requireAuth, (req, res) => res.json(loadDB().documents || []));
app.post("/api/documents", requireAuth, (req, res) => {
  if (!isLeader(req.session.user.role)) return res.status(403).json({ error: "Huna mamlaka" });
  const db = loadDB();
  if (!db.documents) db.documents = [];
  db.documents.push({ id: Date.now().toString(), ...req.body, createdAt: new Date().toISOString() });
  saveDB(db);
  res.json({ success: true });
});

// Notifications
app.get("/api/notifications", requireAuth, (req, res) => {
  const db = loadDB();
  const list = (db.notifications || []).filter(n => n.userId === req.session.user.id || n.userId === "all");
  res.json(list.slice(0, 30));
});

// Backup
app.get("/api/backup", requireAuth, (req, res) => {
  if (req.session.user.role !== "ADMIN") return res.status(403).json({ error: "Admin only" });
  res.json(loadDB());
});

// PWA
app.get("/manifest.json", (req, res) => res.json({
  name: "WFC Portal", short_name: "WFC", start_url: "/", display: "standalone", background_color: "#111", theme_color: "#d4af37",
  icons: [{ src: "/wfc-logo.jpg", sizes: "192x192", type: "image/jpeg" }]
}));

// Roles list
app.get("/api/roles", requireAuth, (req, res) => {
  res.json(["ADMIN", "CHAIRPERSON", "SECRETARY", "TREASURER", "REGIONAL", "MEMBER"]);
});

app.post("/api/set-role", requireAuth, (req, res) => {
  if (req.session.user.role !== "ADMIN") return res.status(403).json({ error: "Admin only" });
  const db = loadDB();
  const u = db.users.find(x => x.id === req.body.userId);
  if (!u) return res.status(404).json({ error: "Haijapatikana" });
  u.role = req.body.role;
  saveDB(db);
  res.json({ success: true });
});

// Attendance report
app.get("/api/attendance-report", requireAuth, (req, res) => {
  const db = loadDB();
  const list = db.attendance || [];
  const byUser = {};
  list.forEach(a => {
    if (!byUser[a.userId]) byUser[a.userId] = { name: a.userName, count: 0 };
    byUser[a.userId].count++;
  });
  res.json(Object.values(byUser));
});

// Election results
app.get("/api/elections/:id/results", requireAuth, (req, res) => {
  const db = loadDB();
  const e = (db.elections || []).find(x => x.id === req.params.id);
  if (!e) return res.status(404).json({ error: "Haijapatikana" });
  const counts = {};
  e.votes.forEach(v => { counts[v.candidate] = (counts[v.candidate] || 0) + 1; });
  res.json({ position: e.position, results: counts, total: e.votes.length });
});

// SACCOS loans
app.post("/api/saccos/loans", requireAuth, (req, res) => {
  const db = loadDB();
  if (!db.saccos) db.saccos = { shares: [], savings: [], loans: [] };
  db.saccos.loans.push({ id: Date.now().toString(), userId: req.session.user.id, userName: req.session.user.name, amount: Number(req.body.amount), status: "PENDING", createdAt: new Date().toISOString() });
  saveDB(db);
  res.json({ success: true });
});

// Notifications create
app.post("/api/notifications", requireAuth, (req, res) => {
  if (!isLeader(req.session.user.role)) return res.status(403).json({ error: "Huna mamlaka" });
  const db = loadDB();
  if (!db.notifications) db.notifications = [];
  db.notifications.unshift({ id: Date.now().toString(), userId: req.body.userId || "all", title: req.body.title, body: req.body.body, createdAt: new Date().toISOString() });
  saveDB(db);
  res.json({ success: true });
});

app.post("/api/dispatch", requireAuth, async (req, res) => {
  const db = loadDB();
  const { channel, to, title, body } = req.body;
  const message = `${title || "WFC"}\n${body || ""}`;
  let status = "queued";
  let detail = "Imehifadhiwa";
  try {
    if (channel === "sms" && db.settings.smsKey && db.settings.smsUsername) {
      const r = await fetch("https://api.africastalking.com/version1/messaging", {
        method: "POST",
        headers: { apiKey: db.settings.smsKey, Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ username: db.settings.smsUsername, to, message })
      });
      detail = (await r.text()).slice(0, 280);
      status = r.ok ? "sent" : "failed";
    } else if (channel === "whatsapp" && db.settings.whatsappToken && db.settings.whatsappPhoneId) {
      const r = await fetch(`https://graph.facebook.com/v21.0/${db.settings.whatsappPhoneId}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${db.settings.whatsappToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ messaging_product: "whatsapp", to: String(to).replace(/\D/g, ""), type: "text", text: { body: message } })
      });
      detail = (await r.text()).slice(0, 280);
      status = r.ok ? "sent" : "failed";
    } else if (channel === "sms") {
      detail = "Weka Africa's Talking username na API key.";
    } else if (channel === "whatsapp") {
      detail = "Fungua WhatsApp kwa mkono, au weka token.";
    } else if (channel === "email") {
      detail = "Barua pepe inafunguliwa kwenye kifaa.";
    }
  } catch (err) {
    status = "failed";
    detail = String(err.message || err).slice(0, 200);
  }
  if (!db.outbox) db.outbox = [];
  db.outbox.unshift({ id: Date.now().toString(), channel, to, title, body, status, detail, createdAt: new Date().toISOString() });
  saveDB(db);
  res.json({ success: true, status, detail });
});

app.get("/api/outbox", requireAuth, (req, res) => res.json(loadDB().outbox || []));

app.post("/api/stk", requireAuth, async (req, res) => {
  const db = loadDB();
  const { phone, amount } = req.body;
  if (!db.settings.momoConsumerKey || !db.settings.momoConsumerSecret) {
    return res.json({ ok: false, detail: "Daraja haijaunganishwa. Lipa kwa namba ya WFC kisha weka namba ya muamala." });
  }
  const auth = Buffer.from(`${db.settings.momoConsumerKey}:${db.settings.momoConsumerSecret}`).toString("base64");
  const tokenRes = await fetch("https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials", { headers: { Authorization: `Basic ${auth}` } });
  const text = await tokenRes.text();
  res.json({ ok: tokenRes.ok, detail: tokenRes.ok ? `Token imepatikana. Ombi la STK kwa ${phone}, TSh ${amount}.` : text.slice(0, 280) });
});

app.post("/api/settings", requireAuth, (req, res) => {
  if (req.session.user.role !== "ADMIN") return res.status(403).json({ error: "Admin only" });
  const db = loadDB();
  const keys = ["smsUsername", "smsKey", "whatsappToken", "whatsappPhoneId", "emailFrom", "momoConsumerKey", "momoConsumerSecret", "momoShortcode"];
  keys.forEach(k => { if (req.body[k] !== undefined) db.settings[k] = req.body[k]; });
  saveDB(db);
  res.json({ success: true });
});

app.post("/api/toggle-2fa", requireAuth, (req, res) => {
  const db = loadDB();
  const u = db.users.find(x => x.id === req.session.user.id);
  if (!u) return res.status(404).json({ error: "Haijapatikana" });
  u.twoFactor = !u.twoFactor;
  saveDB(db);
  res.json({ twoFactor: !!u.twoFactor });
});

app.get("/api/analytics", requireAuth, (req, res) => {
  const db = loadDB();
  const regions = {};
  db.users.filter(u => u.status === "ACTIVE").forEach(u => { regions[u.region || "Nyingine"] = (regions[u.region || "Nyingine"] || 0) + 1; });
  const types = {};
  db.payments.filter(p => p.status === "APPROVED").forEach(p => { types[p.type] = (types[p.type] || 0) + (p.amount || 0); });
  res.json({
    regions: Object.entries(regions).map(([name, value]) => ({ name, value })),
    types: Object.entries(types).map(([name, value]) => ({ name, value }))
  });
});

// Catch-all
app.get("*", (req, res) => res.sendFile(path.join(__dirname, "../public/index.html")));
app.listen(PORT, () => console.log("WFC running on " + PORT));
