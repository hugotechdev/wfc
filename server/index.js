const express = require("express");
const session = require("express-session");
const path = require("path");
const fs = require("fs");
const { jsPDF } = require("jspdf");
const QRCode = require("qrcode");
const { normalizePortrait, cardQr, buildMemberCard } = require("./member-card");
const { readAttachments, visiblePost } = require("./social-post");
const { DEFAULT_GROUP, readGroup, updateGroup } = require("./group");
const { randomBytes, scryptSync, timingSafeEqual } = require("node:crypto");

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  return `scrypt:${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

function matchPassword(user, password) {
  if (typeof password !== "string" || password.length > 128) return false;
  if (!user.passwordHash) return user.password === password;
  const [algorithm, salt, hash] = user.passwordHash.split(":");
  if (algorithm !== "scrypt" || !/^[a-f0-9]{32}$/.test(salt) || !/^[a-f0-9]{128}$/.test(hash)) return false;
  return timingSafeEqual(scryptSync(password, salt, 64), Buffer.from(hash, "hex"));
}

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "../data");
const DATA_FILE = path.join(DATA_DIR, "db.json");
const POST_FILES = path.join(DATA_DIR, "social-attachments");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const defaultDB = {
  users: [],
  payments: [],
  events: [],
  tickets: [],
  announcements: [],
  supportTickets: [],
  attendance: [],
  group: DEFAULT_GROUP,
  settings: {}
};

if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify(defaultDB, null, 2), { mode: 0o600 });

function loadDB() { return JSON.parse(fs.readFileSync(DATA_FILE, "utf8")); }
function saveDB(db) {
  const temporary = DATA_FILE + ".tmp";
  fs.writeFileSync(temporary, JSON.stringify(db, null, 2), { mode: 0o600 });
  fs.renameSync(temporary, DATA_FILE);
}

function ensureMemberNumber(db, user) {
  if (user.wfcId) return;
  let number = db.nextMemberNumber || 1;
  const prefix = readGroup(db).shortName;
  do {
    user.wfcId = prefix + "-" + String(number++).padStart(4, "0");
  } while (db.users.some(other => other !== user && other.wfcId === user.wfcId));
  db.nextMemberNumber = number;
}

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret || sessionSecret.length < 32) throw new Error("Set SESSION_SECRET to a unique random value of at least 32 characters.");

(function ensureAdmin() {
  const db = loadDB();
  if (db.users.some(user => user.role === "ADMIN")) return;
  const phone = process.env.ADMIN_PHONE?.trim();
  const password = process.env.ADMIN_PASSWORD;
  if (!phone || !password || password.length < 12 || password.length > 128 || db.users.some(user => user.phone === phone)) {
    throw new Error("Set a unique ADMIN_PHONE and ADMIN_PASSWORD (12–128 characters) to create the administrator.");
  }
  db.users.push({
    id: "admin-001", name: process.env.ADMIN_NAME || "Msimamizi", phone,
    passwordHash: hashPassword(password), role: "ADMIN", status: "ACTIVE", wfcId: null,
    family: {}, createdAt: new Date().toISOString()
  });
  saveDB(db);
})();

app.post("/api/portal-posts", express.json({ limit: "12mb" }));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../public"), { index: false }));
if (process.env.NODE_ENV === "production") app.set("trust proxy", 1);
app.use(session({
  name: "group.sid", secret: sessionSecret, resave: false, saveUninitialized: false,
  cookie: { sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 8 * 60 * 60 * 1000 }
}));

function requireAuth(req, res, next) {
  const member = loadDB().users.find(user => user.id === req.session.user?.id);
  if (!member) return res.status(401).json({ error: "Ingia kwenye akaunti yako." });
  if (member.status !== "ACTIVE") return res.status(403).json({ error: "Akaunti haijaidhinishwa." });
  Object.assign(req.session.user, { role: member.role, status: member.status, wfcId: member.wfcId });
  next();
}
function isLeader(role) { return ["ADMIN", "CHAIRPERSON", "SECRETARY", "TREASURER", "REGIONAL"].includes(role); }

const moduleRoutes = {
  tickets: ["/ticket", "/api/tickets"],
  attendance: ["/api/attendance", "/api/attendance-report"],
  elections: ["/api/elections"],
  saccos: ["/api/saccos"]
};
for (const [key, routes] of Object.entries(moduleRoutes)) {
  app.use(routes, (req, res, next) => {
    if (!readGroup(loadDB()).modules[key]) return res.status(404).json({ error: "Kipengele hiki kimezimwa na kikundi." });
    next();
  });
}

function recordApproval(db, actor, category, subject, date) {
  if (!db.approvalHistory) db.approvalHistory = [];
  db.approvalHistory.unshift({ actorId: actor.id, actor: actor.name, category, subject, date });
}

function memberBalance(db, user) {
  const monthly = readGroup(db).monthlyFee;
  const startedAt = new Date(user.membershipApprovedAt || user.createdAt).getTime();
  const months = Number.isFinite(startedAt) ? Math.max(1, Math.floor((Date.now() - startedAt) / 2592000000)) : 1;
  const expected = months * monthly;
  const paid = db.payments.filter(p => p.userId === user.id && p.type === "Ada ya mwezi" && p.status === "APPROVED")
    .reduce((total, payment) => total + (payment.amount || 0), 0);
  return { monthly, months, expected, paid, debt: Math.max(0, expected - paid) };
}

// Public
app.get("/", (req, res) => {
  if (req.session.user) return res.redirect("/app");
  res.sendFile(path.join(__dirname, "../public/landing.html"));
});
app.get("/app", (req, res) => res.sendFile(path.join(__dirname, "../public/index.html")));
app.get("/ticket/:id", (req, res) => res.sendFile(path.join(__dirname, "../public/ticket.html")));

app.get("/api/public/group", (req, res) => {
  res.set("Cache-Control", "no-store").json(readGroup(loadDB()));
});

app.post("/api/group", requireAuth, (req, res) => {
  if (req.session.user.role !== "ADMIN") return res.status(403).json({ error: "Weka mipangilio kupitia akaunti ya msimamizi." });
  const db = loadDB();
  try {
    db.group = updateGroup(readGroup(db), req.body || {});
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
  saveDB(db);
  res.json({ success: true, group: db.group });
});

app.get("/api/public/events", (req, res) => {
  const db = loadDB();
  res.json((db.events || []).filter(e => e.public !== false));
});
app.get("/api/public/announcements", (req, res) => res.json(loadDB().announcements || []));
app.get("/api/public/stats", (req, res) => {
  const db = loadDB();
  res.json({
    members: db.users.filter(u => u.status === "ACTIVE").length,
    events: (db.events || []).filter(e => e.public !== false).length
  });
});
app.post("/api/contact", (req, res) => {
  const { name, phone, message } = req.body || {};
  if (!name || !phone || !message) return res.status(400).json({ error: "Jaza taarifa" });
  const db = loadDB();
  if (!db.contacts) db.contacts = [];
  db.contacts.unshift({ id: randomBytes(12).toString("hex"), name, phone, email: req.body.email || "", message, createdAt: new Date().toISOString() });
  saveDB(db);
  res.json({ success: true });
});
app.get("/api/contacts", requireAuth, (req, res) => {
  if (!isLeader(req.session.user.role)) return res.status(403).json({ error: "Huna mamlaka" });
  res.json(loadDB().contacts || []);
});

app.post("/api/register", (req, res) => {
  const { name, phone, region, password, paymentProof, acceptRules, displayedRules } = req.body;
  if (!name || !phone || typeof password !== "string" || password.length < 12 || password.length > 128) return res.status(400).json({ error: "Jaza taarifa na tumia nenosiri lenye herufi 12 hadi 128." });
  const db = loadDB();
  const group = readGroup(db);
  if (group.rules && (acceptRules !== "on" || displayedRules !== group.rules)) {
    return res.status(400).json({ error: "Soma na ukubali kanuni za sasa kabla ya kusajili." });
  }
  if (group.registrationFee > 0 && (typeof paymentProof !== "string" || !paymentProof.trim())) {
    return res.status(400).json({ error: "Weka namba ya muamala wa ada ya usajili." });
  }
  if (db.users.find(u => u.phone === phone)) return res.status(400).json({ error: "Namba tayari imesajiliwa" });
  db.users.push({
    id: Date.now().toString(), name, phone, region: region || "Haijatajwa", passwordHash: hashPassword(password),
    role: "MEMBER", status: "PENDING", rulesAcceptedAt: group.rules ? new Date().toISOString() : null, paymentProof: paymentProof || "", wfcId: null,
    family: { head: name, spouse: "", children: [] }, profession: "", createdAt: new Date().toISOString()
  });
  saveDB(db);
  res.json({ success: true, message: "Usajili umepokelewa. Subiri idhini." });
});

app.post("/api/login", (req, res) => {
  const { phone, password } = req.body;
  const db = loadDB();
  const user = db.users.find(u => u.phone === phone);
  if (!user || !matchPassword(user, password)) return res.status(401).json({ error: "Taarifa si sahihi" });
  if (!user.passwordHash) {
    user.passwordHash = hashPassword(password);
    delete user.password;
    saveDB(db);
  }
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

app.post("/api/change-password", requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (typeof newPassword !== "string" || newPassword.length < 12 || newPassword.length > 128 || newPassword === currentPassword) {
    return res.status(400).json({ error: "Tumia nenosiri jipya lenye urefu wa herufi 12 hadi 128." });
  }
  const db = loadDB();
  const user = db.users.find(row => row.id === req.session.user.id);
  if (!user || user.status !== "ACTIVE") return res.status(403).json({ error: "Akaunti haijaruhusiwa." });
  if (!matchPassword(user, currentPassword)) return res.status(400).json({ error: "Nenosiri la sasa si sahihi." });
  user.passwordHash = hashPassword(newPassword);
  delete user.password;
  saveDB(db);
  res.json({ success: true });
});

app.post("/api/logout", (req, res) => { req.session.destroy(); res.json({ success: true }); });
app.get("/api/me", (req, res) => {
  const sessionUser = req.session.user;
  const user = sessionUser && loadDB().users.find(member => member.id === sessionUser.id);
  res.json({ user: user ? { ...sessionUser, status: user.status, role: user.role, wfcId: user.wfcId } : null });
});

// A photo is served only to its owner and is never included in member lists.
app.get("/api/me/photo", requireAuth, (req, res) => {
  const member = loadDB().users.find(user => user.id === req.session.user.id);
  if (!member.profilePhoto) return res.sendStatus(404);
  res.set({ "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" });
  res.type("jpeg").send(Buffer.from(member.profilePhoto, "base64"));
});

app.put("/api/me/photo", requireAuth, (req, res) => {
  let photo;
  try {
    photo = normalizePortrait(req.body?.photo);
  } catch {
    return res.status(400).json({ error: "Picha haikubaliki au ni kubwa sana." });
  }
  const db = loadDB();
  const member = db.users.find(user => user.id === req.session.user.id);
  member.profilePhoto = photo;
  saveDB(db);
  res.json({ success: true });
});

function prepareMemberCard(req) {
  const db = loadDB();
  const member = db.users.find(user => user.id === req.session.user.id);
  if (!member.wfcId || !member.cardToken) {
    ensureMemberNumber(db, member);
    member.cardToken ||= randomBytes(24).toString("hex");
    saveDB(db);
  }
  req.session.user.wfcId = member.wfcId;
  const origin = (process.env.PUBLIC_ORIGIN || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "");
  return { db, member, verificationUrl: `${origin}/verify/member/${member.cardToken}` };
}

app.get("/api/member-card", requireAuth, (req, res) => {
  const { member } = prepareMemberCard(req);
  res.set("Cache-Control", "private, no-store").json({
    id: member.id, name: member.name, number: member.wfcId,
    hasPhoto: Boolean(member.profilePhoto)
  });
});

app.get("/api/member-card/qr", requireAuth, async (req, res, next) => {
  try {
    const { verificationUrl } = prepareMemberCard(req);
    const qr = await cardQr(verificationUrl);
    res.set("Cache-Control", "private, no-store").type("png").send(qr);
  } catch (error) { next(error); }
});

app.get("/api/member-card/pdf", requireAuth, async (req, res, next) => {
  try {
    const { db, member, verificationUrl } = prepareMemberCard(req);
    if (!member.profilePhoto) return res.status(409).json({ error: "Weka picha kwenye wasifu kabla ya kupakua kitambulisho." });
    const pdf = await buildMemberCard(member, readGroup(db), verificationUrl, req.query.lang === "en");
    res.set("Cache-Control", "private, no-store").attachment(`Member-ID-${member.wfcId.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`).send(pdf);
  } catch (error) { next(error); }
});

app.get("/verify/member/:token", (req, res) => {
  const token = req.params.token;
  const member = /^[a-f0-9]{48}$/.test(token) && loadDB().users.find(user => user.cardToken === token);
  const active = member && member.status === "ACTIVE" && member.wfcId;
  res.set("Cache-Control", "no-store").status(active ? 200 : 404).type("html").send(`<!doctype html>
<html lang="sw"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Uhakiki wa uanachama</title><style>body{font:1rem system-ui;background:#fff5e9;color:#25180d;padding:2rem}main{max-width:32rem;margin:auto;padding:1.4rem;background:white;border-radius:1rem;border-top:5px solid #f47b1f}</style>
<main><h1>Uhakiki wa uanachama</h1><p>${active ? "Uanachama hai • Active membership" : "Kitambulisho hakijathibitishwa • Membership could not be verified"}</p>${active ? `<p><code>${String(member.wfcId).replace(/[^a-zA-Z0-9_-]/g, "")}</code></p>` : ""}</main></html>`);
});

// Dashboard
app.get("/api/dashboard", requireAuth, (req, res) => {
  const db = loadDB();
  const user = db.users.find(u => u.id === req.session.user.id);
  const myPayments = db.payments.filter(p => p.userId === user.id && p.status === "APPROVED");
  const totalPaid = myPayments.reduce((s, p) => s + (p.amount || 0), 0);
  const { password, passwordHash, profilePhoto, cardToken, readNotificationIds, ...publicUser } = user;
  res.json({
    user: publicUser,
    stats: {
      members: db.users.filter(u => u.status === "ACTIVE").length,
      pending: db.users.filter(u => u.status === "PENDING").length,
      payments: db.payments.length,
      events: (db.events || []).length
    },
    myTotalPaid: totalPaid,
    recent: db.payments.filter(p => isLeader(req.session.user.role) || p.userId === user.id).slice(-6).reverse(),
    upcoming: (db.events || []).slice(0, 4),
    notices: (db.announcements || []).slice(0, 3),
    regions: Object.entries(db.users.filter(u => u.status === "ACTIVE").reduce((m, u) => { m[u.region || "Nyingine"] = (m[u.region || "Nyingine"] || 0) + 1; return m; }, {})).map(([name, value]) => ({ name, value })),
    settings: req.session.user.role === "ADMIN" ? db.settings : {
      registrationFee: readGroup(db).registrationFee,
      monthlyFee: readGroup(db).monthlyFee,
      paymentNumbers: readGroup(db).paymentNumbers
    },
    finance: isLeader(req.session.user.role) ? computeFinance(db) : null
  });
});

function computeFinance(db) {
  const approved = (db.payments || []).filter(p => p.status === "APPROVED");
  const incomeFromPayments = approved.reduce((s, p) => s + (p.amount || 0), 0);
  const manual = (db.manualIncome || []).reduce((s, i) => s + (i.amount || 0), 0);
  const expenses = (db.expenses || []).reduce((s, e) => s + (e.amount || 0), 0);
  const debts = db.users.filter(user => user.status === "ACTIVE").map(user => memberBalance(db, user).debt);
  const totalDebt = debts.reduce((total, debt) => total + debt, 0);
  const debtors = debts.filter(debt => debt > 0).length;
  return {
    mapato: incomeFromPayments + manual,
    matumizi: expenses,
    balance: incomeFromPayments + manual - expenses,
    totalDebt,
    debtors,
    incomeFromPayments,
    manualIncome: manual
  };
}

app.get("/api/accounting/summary", requireAuth, (req, res) => {
  if (!isLeader(req.session.user.role)) return res.status(403).json({ error: "Huna mamlaka" });
  const db = loadDB();
  res.json(computeFinance(db));
});

app.get("/api/accounting/debts", requireAuth, (req, res) => {
  if (!isLeader(req.session.user.role)) return res.status(403).json({ error: "Huna mamlaka" });
  const db = loadDB();
  const list = db.users.filter(u => u.status === "ACTIVE").map(u => ({
    id: u.id, name: u.name, region: u.region, wfcId: u.wfcId, ...memberBalance(db, u)
  })).filter(row => row.debt > 0);
  res.json(list);
});

app.get("/api/expenses", requireAuth, (req, res) => {
  if (!isLeader(req.session.user.role)) return res.status(403).json({ error: "Huna mamlaka" });
  res.json(loadDB().expenses || []);
});

app.post("/api/expenses", requireAuth, (req, res) => {
  if (!["ADMIN", "TREASURER", "CHAIRPERSON"].includes(req.session.user.role)) return res.status(403).json({ error: "Huna mamlaka" });
  const db = loadDB();
  if (!db.expenses) db.expenses = [];
  db.expenses.unshift({ id: Date.now().toString(), title: req.body.title, amount: Number(req.body.amount) || 0, category: req.body.category || "Nyingine", note: req.body.note || "", createdAt: new Date().toISOString() });
  saveDB(db);
  res.json({ success: true });
});

app.get("/api/manual-income", requireAuth, (req, res) => {
  if (!isLeader(req.session.user.role)) return res.status(403).json({ error: "Huna mamlaka" });
  res.json(loadDB().manualIncome || []);
});

app.post("/api/manual-income", requireAuth, (req, res) => {
  if (!["ADMIN", "TREASURER", "CHAIRPERSON"].includes(req.session.user.role)) return res.status(403).json({ error: "Huna mamlaka" });
  const db = loadDB();
  if (!db.manualIncome) db.manualIncome = [];
  db.manualIncome.unshift({ id: Date.now().toString(), title: req.body.title, amount: Number(req.body.amount) || 0, source: req.body.source || "Nyingine", note: req.body.note || "", createdAt: new Date().toISOString() });
  saveDB(db);
  res.json({ success: true });
});

// Members
app.get("/api/members", requireAuth, (req, res) => {
  const db = loadDB();
  res.json(db.users.map(u => ({
    id: u.id, name: u.name, phone: u.phone, region: u.region, status: u.status, role: u.role, wfcId: u.wfcId, profession: u.profession,
    paymentProof: isLeader(req.session.user.role) ? u.paymentProof : undefined
  })));
});

app.post("/api/approve-member", requireAuth, (req, res) => {
  if (!isLeader(req.session.user.role)) return res.status(403).json({ error: "Huna mamlaka" });
  const db = loadDB();
  const user = db.users.find(u => u.id === req.body.userId);
  if (!user) return res.status(404).json({ error: "Hajapatikana" });
  if (user.status === "ACTIVE" && user.wfcId) return res.json({ success: true, wfcId: user.wfcId });
  if (user.status !== "PENDING") return res.status(409).json({ error: "Ombi hili halisubiri idhini." });
  user.status = "ACTIVE";
  user.membershipApprovedAt = new Date().toISOString();
  ensureMemberNumber(db, user);
  recordApproval(db, req.session.user, "Uanachama", user.wfcId, user.membershipApprovedAt);
  saveDB(db);
  res.json({ success: true, wfcId: user.wfcId });
});

// Payments
app.get("/api/payments", requireAuth, (req, res) => res.json(loadDB().payments.filter(p => isLeader(req.session.user.role) || p.userId === req.session.user.id)));

app.post("/api/submit-payment", requireAuth, (req, res) => {
  const { type, amount } = req.body;
  const transactionId = typeof req.body.transactionId === "string" ? req.body.transactionId.trim().toUpperCase() : "";
  const paymentAmount = Number(amount);
  if (!["Ada ya mwezi", "Kiingilio", "Dharura", "Msiba"].includes(type) ||
      !/^[A-Z0-9][A-Z0-9._/-]{0,63}$/.test(transactionId) ||
      !Number.isSafeInteger(paymentAmount) || paymentAmount <= 0) {
    return res.status(400).json({ error: "Weka aina ya mchango, kiasi halali na namba ya muamala." });
  }
  const db = loadDB();
  if (db.payments.find(p => String(p.transactionId).trim().toUpperCase() === transactionId)) return res.status(400).json({ error: "Namba ya muamala tayari imetumika" });
  db.payments.push({
    id: randomBytes(12).toString("hex"), userId: req.session.user.id, userName: req.session.user.name,
    type, amount: paymentAmount, transactionId, status: "PENDING", createdAt: new Date().toISOString()
  });
  saveDB(db);
  res.json({ success: true });
});

app.post("/api/approve-payment", requireAuth, (req, res) => {
  if (!["ADMIN", "TREASURER", "CHAIRPERSON"].includes(req.session.user.role)) return res.status(403).json({ error: "Huna mamlaka" });
  const db = loadDB();
  const p = db.payments.find(x => x.id === req.body.paymentId);
  if (!p) return res.status(404).json({ error: "Haijapatikana" });
  if (p.status === "APPROVED") return res.json({ success: true, receiptNo: p.receiptNo });
  if (p.status !== "PENDING") return res.status(409).json({ error: "Malipo haya hayasubiri uhakiki." });
  p.status = "APPROVED";
  p.approvedAt = new Date().toISOString();
  p.receiptNo = "RCP-" + randomBytes(8).toString("hex").toUpperCase();
  recordApproval(db, req.session.user, "Malipo", p.receiptNo, p.approvedAt);
  saveDB(db);
  res.json({ success: true, receiptNo: p.receiptNo });
});

app.get("/api/payments/:id/receipt", requireAuth, async (req, res) => {
  const db = loadDB();
  const row = db.payments.find(payment => payment.id === req.params.id && payment.status === "APPROVED");
  if (!row || (row.userId !== req.session.user.id && !isLeader(req.session.user.role))) {
    return res.status(404).json({ error: "Risiti haipatikani." });
  }
  try {
    const group = readGroup(db);
    const number = row.receiptNo || "RCP-" + row.id;
    const qr = await QRCode.toDataURL(JSON.stringify({ receipt: number, amount: row.amount, transaction: row.transactionId }), { margin: 1, width: 220 });
    const doc = new jsPDF();
    doc.setFontSize(18);
    const title = doc.splitTextToSize(group.name, 180);
    doc.text(title, 14, 20);
    let y = 26 + title.length * 8;
    doc.setFontSize(14);
    doc.text("Risiti ya malipo", 14, y);
    doc.setFontSize(11);
    for (const line of [
      "Risiti: " + number,
      "Mwanachama: " + row.userName,
      "Mchango: " + row.type,
      "Kiasi: TSh " + Number(row.amount).toLocaleString("en-TZ"),
      "Muamala: " + row.transactionId,
      "Tarehe: " + String(row.approvedAt || row.createdAt).slice(0, 10)
    ]) {
      const lines = doc.splitTextToSize(line, 116);
      y += 8;
      doc.text(lines, 14, y);
      y += (lines.length - 1) * 5;
    }
    doc.addImage(qr, "PNG", 147, 42, 45, 45);
    res.set("Cache-Control", "private, no-store");
    res.attachment(number.replace(/[^a-zA-Z0-9_-]/g, "_") + ".pdf");
    res.send(Buffer.from(doc.output("arraybuffer")));
  } catch (error) {
    console.error("Receipt generation failed:", error.message);
    res.status(500).json({ error: "Risiti haikuweza kutengenezwa." });
  }
});

function readPostText(value, maxLength) {
  return typeof value === "string" && value.trim().length <= maxLength ? value.trim() : "";
}

app.get("/api/portal-posts", requireAuth, (req, res) => {
  const posts = loadDB().portalPosts || [];
  res.set("Cache-Control", "private, no-store").json(posts.map(post => visiblePost(post, req.session.user.id)));
});

app.post("/api/portal-posts", requireAuth, (req, res, next) => {
  const actor = req.session.user;
  if (!isLeader(actor.role)) return res.status(403).json({ error: "Viongozi pekee wanaweza kuchapisha." });
  const input = req.body || {};
  const title = readPostText(input.title, 100);
  const text = readPostText(input.text, 4000);
  const type = input.type;
  if (!["announcement", "discussion"].includes(type) ||
      (input.title != null && (typeof input.title !== "string" || input.title.trim().length > 100)) ||
      (input.text != null && (typeof input.text !== "string" || input.text.trim().length > 4000))) {
    return res.status(400).json({ error: "Weka aina, kichwa na ujumbe wa chapisho." });
  }
  let files;
  try {
    files = readAttachments(input.attachments);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
  if (!title && !text && files.length === 0) {
    return res.status(400).json({ error: "Andika ujumbe au ambatisha faili." });
  }
  const db = loadDB();
  const post = {
    id: randomBytes(12).toString("hex"), title, text, type, author: actor.name, createdAt: new Date().toISOString(),
    comments: [], likes: [],
    attachments: files.map(({ id, name, type, bytes }) => ({ id, name, type, size: bytes.length }))
  };
  const saved = [];
  try {
    if (files.length) fs.mkdirSync(POST_FILES, { recursive: true, mode: 0o700 });
    for (const file of files) {
      const filePath = path.join(POST_FILES, file.id);
      fs.writeFileSync(filePath, file.bytes, { flag: "wx", mode: 0o600 });
      saved.push(filePath);
    }
    (db.portalPosts ||= []).unshift(post);
    saveDB(db);
  } catch (error) {
    for (const filePath of saved) fs.rmSync(filePath, { force: true });
    return next(error);
  }
  res.status(201).json({ success: true, post: visiblePost(post, actor.id) });
});

app.get("/api/portal-posts/:id/attachments/:file", requireAuth, (req, res) => {
  const post = (loadDB().portalPosts || []).find(entry => entry.id === req.params.id);
  const file = post?.attachments?.find(entry => entry.id === req.params.file);
  if (!file || !/^[a-f0-9]{24}$/.test(file.id)) return res.sendStatus(404);
  res.set({ "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "sandbox" });
  if (file.type === "application/pdf") res.attachment(file.name);
  res.type(file.type).sendFile(path.join(POST_FILES, file.id));
});

app.put("/api/portal-posts/:id/like", requireAuth, (req, res) => {
  const desired = req.body?.liked;
  if (typeof desired !== "boolean") return res.status(400).json({ error: "Imeshindwa kuhifadhi." });
  const db = loadDB();
  const post = (db.portalPosts || []).find(entry => entry.id === req.params.id);
  if (!post) return res.status(404).json({ error: "Chapisho halikupatikana." });
  const member = req.session.user.id;
  const likes = post.likes ||= [];
  if (desired !== likes.includes(member)) {
    post.likes = desired ? [...likes, member] : likes.filter(id => id !== member);
    saveDB(db);
  }
  res.json({ success: true, liked: desired, likeCount: post.likes.length });
});

app.post("/api/portal-posts/:id/comments", requireAuth, (req, res) => {
  const text = readPostText(req.body?.text, 1500);
  if (!text) return res.status(400).json({ error: "Andika maoni yasiyozidi herufi 1500." });
  const db = loadDB();
  const post = (db.portalPosts || []).find(entry => entry.id === req.params.id);
  if (!post) return res.status(404).json({ error: "Chapisho halikupatikana." });
  const comment = { id: randomBytes(12).toString("hex"), text, author: req.session.user.name, createdAt: new Date().toISOString() };
  post.comments.push(comment);
  saveDB(db);
  res.status(201).json({ success: true, comment });
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
  res.json(memberBalance(db, user));
});

app.get("/api/my-account", requireAuth, (req, res) => {
  const db = loadDB();
  const user = db.users.find(member => member.id === req.session.user.id);
  res.json({
    ...memberBalance(db, user),
    user: req.session.user,
    payments: db.payments.filter(payment => payment.userId === user.id).reverse()
  });
});

app.get("/api/group-reports", requireAuth, (req, res) => {
  if (!isLeader(req.session.user.role)) return res.status(403).json({ error: "Huna mamlaka." });
  const db = loadDB();
  const debts = db.users.filter(user => user.status === "ACTIVE")
    .map(user => ({ name: user.name, memberNumber: user.wfcId, ...memberBalance(db, user) }))
    .filter(user => user.debt > 0);
  res.json({
    payments: db.payments.filter(payment => payment.status === "APPROVED").reverse(),
    debts,
    approvals: db.approvalHistory || []
  });
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
function memberNotifications(db, memberId) {
  return (db.notifications || []).filter(note => note.userId === memberId || note.userId === "all").slice(0, 30);
}

app.get("/api/notifications", requireAuth, (req, res) => {
  const db = loadDB();
  const memberId = req.session.user.id;
  const member = db.users.find(user => user.id === memberId);
  const read = new Set(member.readNotificationIds || []);
  res.set("Cache-Control", "private, no-store").json(memberNotifications(db, memberId)
    .map(note => ({ ...note, read: read.has(note.id) })));
});

app.put("/api/notifications/read", requireAuth, (req, res) => {
  if (!Array.isArray(req.body?.ids) || req.body.ids.length > 30) {
    return res.status(400).json({ error: "Arifa hazikupatikana." });
  }
  const db = loadDB();
  const member = db.users.find(user => user.id === req.session.user.id);
  const notes = memberNotifications(db, member.id);
  const selected = new Set(req.body.ids);
  const previous = new Set(member.readNotificationIds || []);
  member.readNotificationIds = notes.filter(note => selected.has(note.id) || previous.has(note.id)).map(note => note.id);
  saveDB(db);
  res.json({ success: true, unreadCount: notes.length - member.readNotificationIds.length });
});

// Backup
app.get("/api/backup", requireAuth, (req, res) => {
  if (req.session.user.role !== "ADMIN") return res.status(403).json({ error: "Admin only" });
  res.json(loadDB());
});

// PWA
app.get("/manifest.json", (req, res) => {
  const group = readGroup(loadDB());
  res.json({
    name: group.name, short_name: group.shortName, start_url: "/", display: "standalone",
    background_color: "#F8FAFC", theme_color: "#F97316",
    icons: group.logo ? [{ src: group.logo, sizes: "any" }] : []
  });
});

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
  db.notifications.unshift({ id: randomBytes(12).toString("hex"), userId: req.body.userId || "all", title: req.body.title, body: req.body.body, createdAt: new Date().toISOString() });
  saveDB(db);
  res.json({ success: true });
});

app.post("/api/dispatch", requireAuth, async (req, res) => {
  const db = loadDB();
  const { channel, to, title, body } = req.body;
  const message = `${title || readGroup(db).name}\n${body || ""}`;
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
    return res.json({ ok: false, detail: "Daraja haijaunganishwa. Lipa kwa namba ya kikundi kisha weka namba ya muamala." });
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

app.post("/api/demo/clear", requireAuth, (req, res) => {
  if (req.session.user.role !== "ADMIN") return res.status(403).json({ error: "Admin only" });
  const db = loadDB();
  const demoIds = new Set(db.users.filter(u => u.demo).map(u => u.id));
  db.users = db.users.filter(u => !u.demo);
  ["payments", "events", "announcements", "tickets", "attendance"].forEach(k => {
    if (Array.isArray(db[k])) db[k] = db[k].filter(x => !x.demo && !demoIds.has(x.userId));
  });
  db.settings.demoSeed = false;
  saveDB(db);
  res.json({ success: true });
});

// Catch-all
app.get("*", (req, res) => res.sendFile(path.join(__dirname, "../public/index.html")));
app.listen(PORT, () => console.log("Kikundi Portal running on " + PORT));
