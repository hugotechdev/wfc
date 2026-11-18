const express = require("express");
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const path = require("path");
const { initDB, getDB, saveDB, pool, hasPg } = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === "production";

app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);

app.use(express.json({ limit: "3mb" }));
app.use(express.urlencoded({ extended: true, limit: "3mb" }));
app.use(express.static(path.join(__dirname, "../public")));

const sessionSecret =
  process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex");

const sessionConfig = {
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
};

if (hasPg && pool) {
  sessionConfig.store = new pgSession({
    pool,
    tableName: "wfc_user_sessions",
    createTableIfMissing: true
  });
}

app.use(session(sessionConfig));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Majaribio mengi mno. Subiri dakika 15 kisha jaribu tena." }
});

const publicFormLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Maombi mengi mno. Jaribu tena baadaye." }
});

function cleanStr(val, max = 500) {
  if (val === undefined || val === null) return "";
  return String(val).trim().slice(0, max);
}

function cleanPhone(val) {
  return cleanStr(val, 25).replace(/\s+/g, "");
}

function sanitizeUser(u) {
  if (!u) return null;
  const { password, ...safe } = u;
  return safe;
}

function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: "Login required" });
  const db = getDB();
  const fresh = db.users.find((u) => u.id === req.session.user.id);
  if (!fresh) {
    req.session.destroy(() => {});
    return res.status(401).json({ error: "Akaunti haipatikani" });
  }
  if (fresh.status === "SUSPENDED") {
    req.session.destroy(() => {});
    return res.status(403).json({ error: "Akaunti yako imesimamishwa na uongozi." });
  }
  req.session.user = {
    id: fresh.id,
    name: fresh.name,
    phone: fresh.phone,
    role: fresh.role,
    status: fresh.status,
    wfcId: fresh.wfcId
  };
  next();
}

function isLeader(role) {
  return ["ADMIN", "CHAIRPERSON", "SECRETARY", "TREASURER", "REGIONAL"].includes(role);
}

function isFinanceLeader(role) {
  return ["ADMIN", "TREASURER", "CHAIRPERSON"].includes(role);
}

function isAdmin(role) {
  return role === "ADMIN";
}

// ==================== PUBLIC ROUTES ====================

app.get("/", (req, res) => {
  if (req.session.user) return res.redirect("/app");
  res.sendFile(path.join(__dirname, "../public/landing.html"));
});

app.get("/app", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.get("/ticket/:id", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/ticket.html"));
});

app.get("/api/public/events", (req, res) => {
  const db = getDB();
  res.json((db.events || []).filter((e) => e.public !== false && e.status !== "CLOSED"));
});

app.get("/api/public/announcements", (req, res) => {
  res.json(getDB().announcements || []);
});

app.get("/api/public/stats", (req, res) => {
  const db = getDB();
  res.json({
    members: db.users.filter((u) => u.status === "ACTIVE").length,
    events: (db.events || []).filter((e) => e.public !== false).length
  });
});

app.get("/api/public/policy", (req, res) => {
  const s = getDB().settings || {};
  res.json({
    registrationFee: s.registrationFee || 1000,
    entryFee: s.entryFee || 50000,
    monthlyFee: s.monthlyFee || 10000,
    emergencyFee: s.emergencyFee || 60000,
    latePenalty: s.latePenalty || 2000,
    penaltyGraceDays: s.penaltyGraceDays || 5,
    rulesText: s.rulesText || "",
    paymentNumbers: s.paymentNumbers || {}
  });
});

app.post("/api/contact", publicFormLimiter, async (req, res) => {
  const name = cleanStr(req.body && req.body.name, 120);
  const phone = cleanPhone(req.body && req.body.phone);
  const email = cleanStr(req.body && req.body.email, 120);
  const message = cleanStr(req.body && req.body.message, 1500);
  if (!name || !phone || !message) {
    return res.status(400).json({ error: "Jaza taarifa zote zinazohitajika" });
  }
  const db = getDB();
  if (!db.contacts) db.contacts = [];
  db.contacts.unshift({
    id: Date.now().toString(),
    name,
    phone,
    email,
    message,
    status: "UNREAD",
    createdAt: new Date().toISOString()
  });
  await saveDB(db);
  res.json({ success: true });
});

app.get("/api/contacts", requireAuth, (req, res) => {
  if (!isLeader(req.session.user.role)) return res.status(403).json({ error: "Huna mamlaka" });
  res.json(getDB().contacts || []);
});

app.post("/api/tickets", publicFormLimiter, async (req, res) => {
  const eventId = cleanStr(req.body && req.body.eventId, 60);
  const name = cleanStr(req.body && req.body.name, 120);
  const phone = cleanPhone(req.body && req.body.phone);
  const qty = Math.max(1, Math.min(50, Number(req.body && req.body.qty) || 1));
  const transactionId = cleanStr(req.body && req.body.transactionId, 80).toUpperCase();

  if (!eventId || !name || !phone || !transactionId) {
    return res.status(400).json({ error: "Jaza taarifa zote za tiketi" });
  }

  const db = getDB();
  const ev = (db.events || []).find((e) => e.id === eventId);
  if (!ev) return res.status(404).json({ error: "Tukio halijapatikana" });

  if (!db.tickets) db.tickets = [];
  if (db.tickets.find((t) => String(t.transactionId).toUpperCase() === transactionId)) {
    return res.status(400).json({ error: "Namba ya muamala tayari imetumika" });
  }

  db.tickets.unshift({
    id: Date.now().toString(),
    eventId,
    eventTitle: ev.title,
    name,
    phone,
    qty,
    totalAmount: qty * (Number(ev.ticketPrice) || 0),
    transactionId,
    status: "PENDING",
    createdAt: new Date().toISOString()
  });
  await saveDB(db);
  res.json({ success: true });
});

app.get("/api/tickets", requireAuth, (req, res) => {
  if (!isLeader(req.session.user.role)) return res.status(403).json({ error: "Huna mamlaka" });
  res.json(getDB().tickets || []);
});

app.post("/api/tickets/approve", requireAuth, async (req, res) => {
  if (!isLeader(req.session.user.role)) return res.status(403).json({ error: "Huna mamlaka" });
  const db = getDB();
  const t = (db.tickets || []).find((x) => x.id === cleanStr(req.body.ticketId, 60));
  if (!t) return res.status(404).json({ error: "Tiketi haijapatikana" });
  t.status = "APPROVED";
  t.approvedBy = req.session.user.name;
  t.approvedAt = new Date().toISOString();
  await saveDB(db);
  res.json({ success: true });
});

// ==================== AUTH ROUTES ====================

app.post("/api/register", authLimiter, async (req, res) => {
  const name = cleanStr(req.body && req.body.name, 120);
  const phone = cleanPhone(req.body && req.body.phone);
  const region = cleanStr(req.body && req.body.region, 60) || "Dar es Salaam";
  const password = String((req.body && req.body.password) || "");
  const paymentProof = cleanStr(req.body && req.body.paymentProof, 300);

  if (!name || !phone || password.length < 6) {
    return res.status(400).json({ error: "Jaza taarifa zote (nenosiri angalau herufi 6)" });
  }

  const db = getDB();
  if (db.users.find((u) => cleanPhone(u.phone) === phone)) {
    return res.status(400).json({ error: "Namba hii ya simu tayari imesajiliwa" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  db.users.push({
    id: Date.now().toString(),
    name,
    phone,
    region,
    password: passwordHash,
    role: "MEMBER",
    status: "PENDING",
    paymentProof,
    wfcId: null,
    family: { head: name, spouse: "", children: [] },
    profession: "",
    createdAt: new Date().toISOString()
  });
  await saveDB(db);
  res.json({ success: true, message: "Usajili umepokelewa. Subiri idhini ya uongozi." });
});

app.post("/api/login", authLimiter, async (req, res) => {
  const phone = cleanPhone(req.body && req.body.phone);
  const password = String((req.body && req.body.password) || "");
  const db = getDB();
  const user = db.users.find((u) => cleanPhone(u.phone) === phone);
  if (!user) return res.status(401).json({ error: "Taarifa za kuingia si sahihi" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: "Taarifa za kuingia si sahihi" });

  if (user.status === "SUSPENDED") {
    return res.status(403).json({ error: "Akaunti yako imesimamishwa. Wasiliana na uongozi." });
  }

  if (user.twoFactor) {
    const code = String(crypto.randomInt(100000, 1000000));
    db.otps = (db.otps || []).filter((o) => o.exp > Date.now() && o.phone !== user.phone);
    db.otps.push({ phone: user.phone, code, exp: Date.now() + 5 * 60 * 1000 });
    await saveDB(db);
    const smsOn = Boolean(db.settings.smsKey && db.settings.smsUsername);
    return res.json({ needOtp: true, devCode: smsOn || isProd ? null : code });
  }

  req.session.user = {
    id: user.id,
    name: user.name,
    phone: user.phone,
    role: user.role,
    status: user.status,
    wfcId: user.wfcId
  };
  res.json({ success: true, user: req.session.user });
});

app.post("/api/verify-otp", authLimiter, async (req, res) => {
  const phone = cleanPhone(req.body && req.body.phone);
  const code = cleanStr(req.body && req.body.code, 10);
  const db = getDB();
  const otp = (db.otps || []).find(
    (o) => cleanPhone(o.phone) === phone && o.code === code && o.exp > Date.now()
  );
  if (!otp) return res.status(401).json({ error: "Msimbo wa OTP si sahihi au umeisha muda" });

  const user = db.users.find((u) => cleanPhone(u.phone) === phone);
  if (!user) return res.status(401).json({ error: "Akaunti haijapatikana" });

  db.otps = db.otps.filter((o) => o !== otp);
  await saveDB(db);

  req.session.user = {
    id: user.id,
    name: user.name,
    phone: user.phone,
    role: user.role,
    status: user.status,
    wfcId: user.wfcId
  };
  res.json({ success: true, user: req.session.user });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

app.get("/api/me", (req, res) => {
  if (!req.session.user) return res.json({ user: null, isProd });
  const db = getDB();
  const fresh = db.users.find((u) => u.id === req.session.user.id);
  if (!fresh || fresh.status === "SUSPENDED") {
    req.session.destroy(() => {});
    return res.json({ user: null, isProd });
  }
  req.session.user = {
    id: fresh.id,
    name: fresh.name,
    phone: fresh.phone,
    role: fresh.role,
    status: fresh.status,
    wfcId: fresh.wfcId
  };
  res.json({ user: req.session.user, isProd });
});

// ==================== DASHBOARD & ANALYTICS ====================

function computeFinance(db) {
  const approved = (db.payments || []).filter((p) => p.status === "APPROVED");
  const incomeFromPayments = approved.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const manual = (db.manualIncome || []).reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const expenses = (db.expenses || []).reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const monthly = Number(db.settings.monthlyFee) || 10000;
  const active = (db.users || []).filter((u) => u.status === "ACTIVE");

  let totalDebt = 0;
  let debtors = 0;
  active.forEach((u) => {
    const months = Math.max(
      1,
      Math.floor((Date.now() - new Date(u.createdAt).getTime()) / (30 * 24 * 60 * 60 * 1000))
    );
    const expected = months * monthly;
    const paid = approved
      .filter((p) => p.userId === u.id && p.type === "Ada ya mwezi")
      .reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const debt = Math.max(0, expected - paid);
    if (debt > 0) {
      totalDebt += debt;
      debtors++;
    }
  });

  const unpaidPenalties = (db.penalties || [])
    .filter((p) => p.status !== "PAID")
    .reduce((s, p) => s + (Number(p.amount) || 0), 0);

  return {
    mapato: incomeFromPayments + manual,
    matumizi: expenses,
    balance: incomeFromPayments + manual - expenses,
    totalDebt,
    debtors,
    unpaidPenalties,
    incomeFromPayments,
    manualIncome: manual
  };
}

app.get("/api/dashboard", requireAuth, (req, res) => {
  const db = getDB();
  const user = db.users.find((u) => u.id === req.session.user.id);
  const leader = isLeader(req.session.user.role);

  const myPayments = db.payments.filter((p) => p.userId === user.id && p.status === "APPROVED");
  const totalPaid = myPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const visiblePayments = leader
    ? db.payments
    : db.payments.filter((p) => p.userId === user.id);

  const safeSettings = isAdmin(req.session.user.role)
    ? db.settings
    : {
        registrationFee: db.settings.registrationFee,
        entryFee: db.settings.entryFee,
        monthlyFee: db.settings.monthlyFee,
        emergencyFee: db.settings.emergencyFee,
        latePenalty: db.settings.latePenalty,
        penaltyGraceDays: db.settings.penaltyGraceDays,
        rulesText: db.settings.rulesText,
        paymentNumbers: db.settings.paymentNumbers
      };

  res.json({
    user: sanitizeUser(user),
    stats: {
      members: db.users.filter((u) => u.status === "ACTIVE").length,
      pending: db.users.filter((u) => u.status === "PENDING").length,
      payments: visiblePayments.length,
      events: (db.events || []).length
    },
    myTotalPaid: totalPaid,
    recent: visiblePayments.slice(-6).reverse(),
    upcoming: (db.events || []).slice(0, 4),
    notices: (db.announcements || []).slice(0, 3),
    regions: Object.entries(
      db.users
        .filter((u) => u.status === "ACTIVE")
        .reduce((m, u) => {
          m[u.region || "Nyingine"] = (m[u.region || "Nyingine"] || 0) + 1;
          return m;
        }, {})
    ).map(([name, value]) => ({ name, value })),
    settings: safeSettings,
    finance: leader ? computeFinance(db) : null
  });
});

// ==================== ADMIN RULES, FEES & PENALTIES ====================

app.get("/api/policy", requireAuth, (req, res) => {
  const s = getDB().settings || {};
  res.json({
    registrationFee: s.registrationFee || 1000,
    entryFee: s.entryFee || 50000,
    monthlyFee: s.monthlyFee || 10000,
    emergencyFee: s.emergencyFee || 60000,
    latePenalty: s.latePenalty || 2000,
    penaltyGraceDays: s.penaltyGraceDays || 5,
    autoPenaltyEnabled: Boolean(s.autoPenaltyEnabled),
    rulesText: s.rulesText || "",
    paymentNumbers: s.paymentNumbers || {}
  });
});

app.post("/api/admin/policy", requireAuth, async (req, res) => {
  if (!isAdmin(req.session.user.role)) {
    return res.status(403).json({ error: "Admin pekee anaweza kubadilisha utaratibu na viwango vya ada/faini." });
  }
  const db = getDB();
  const b = req.body || {};

  if (b.registrationFee !== undefined) db.settings.registrationFee = Math.max(0, Number(b.registrationFee) || 0);
  if (b.entryFee !== undefined) db.settings.entryFee = Math.max(0, Number(b.entryFee) || 0);
  if (b.monthlyFee !== undefined) db.settings.monthlyFee = Math.max(0, Number(b.monthlyFee) || 0);
  if (b.emergencyFee !== undefined) db.settings.emergencyFee = Math.max(0, Number(b.emergencyFee) || 0);
  if (b.latePenalty !== undefined) db.settings.latePenalty = Math.max(0, Number(b.latePenalty) || 0);
  if (b.penaltyGraceDays !== undefined) db.settings.penaltyGraceDays = Math.max(1, Math.min(31, Number(b.penaltyGraceDays) || 5));
  if (b.autoPenaltyEnabled !== undefined) db.settings.autoPenaltyEnabled = Boolean(b.autoPenaltyEnabled);
  if (b.rulesText !== undefined) db.settings.rulesText = cleanStr(b.rulesText, 5000);

  if (b.paymentNumbers && typeof b.paymentNumbers === "object") {
    db.settings.paymentNumbers = {
      mpesa: cleanStr(b.paymentNumbers.mpesa, 40) || db.settings.paymentNumbers.mpesa,
      tigo: cleanStr(b.paymentNumbers.tigo, 40) || db.settings.paymentNumbers.tigo,
      airtel: cleanStr(b.paymentNumbers.airtel, 40) || db.settings.paymentNumbers.airtel,
      crdb: cleanStr(b.paymentNumbers.crdb, 40) || db.settings.paymentNumbers.crdb
    };
  }

  db.settings.policyUpdatedAt = new Date().toISOString();
  db.settings.policyUpdatedBy = req.session.user.name;
  await saveDB(db);
  res.json({ success: true });
});

app.get("/api/penalties", requireAuth, (req, res) => {
  const db = getDB();
  const list = db.penalties || [];
  if (isLeader(req.session.user.role)) return res.json(list);
  res.json(list.filter((p) => p.userId === req.session.user.id || !p.userId));
});

app.post("/api/penalties", requireAuth, async (req, res) => {
  if (!isAdmin(req.session.user.role)) {
    return res.status(403).json({ error: "Admin pekee anaweza kuweka faini kwa wanachama." });
  }
  const db = getDB();
  if (!db.penalties) db.penalties = [];

  const userId = cleanStr(req.body.userId, 60);
  const member = userId ? db.users.find((u) => u.id === userId) : null;
  const reason = cleanStr(req.body.reason, 250);
  const amount = Math.max(0, Number(req.body.amount) || Number(db.settings.latePenalty) || 0);

  if (!reason || amount <= 0) {
    return res.status(400).json({ error: "Weka sababu na kiasi sahihi cha faini." });
  }

  db.penalties.unshift({
    id: Date.now().toString(),
    userId: member ? member.id : null,
    userName: member ? member.name : "Jumla / Mwanachama",
    wfcId: member ? member.wfcId : "—",
    reason,
    amount,
    status: "UNPAID",
    issuedBy: req.session.user.name,
    createdAt: new Date().toISOString()
  });

  if (member) {
    if (!db.notifications) db.notifications = [];
    db.notifications.unshift({
      id: (Date.now() + 1).toString(),
      userId: member.id,
      title: "Notisi ya Faini — WFC",
      body: `Umeandikiwa faini ya TSh ${amount.toLocaleString()} kwa sababu: ${reason}.`,
      createdAt: new Date().toISOString()
    });
  }

  await saveDB(db);
  res.json({ success: true });
});

app.post("/api/penalties/pay", requireAuth, async (req, res) => {
  if (!isAdmin(req.session.user.role) && !isFinanceLeader(req.session.user.role)) {
    return res.status(403).json({ error: "Huna mamlaka ya kuthibitisha malipo ya faini." });
  }
  const db = getDB();
  const pen = (db.penalties || []).find((x) => x.id === cleanStr(req.body.penaltyId, 60));
  if (!pen) return res.status(404).json({ error: "Faini haijapatikana" });
  pen.status = "PAID";
  pen.paidAt = new Date().toISOString();
  pen.clearedBy = req.session.user.name;
  await saveDB(db);
  res.json({ success: true });
});

app.post("/api/penalties/apply-late-batch", requireAuth, async (req, res) => {
  if (!isAdmin(req.session.user.role)) {
    return res.status(403).json({ error: "Admin pekee anaweza kutoza faini za kuchelewa ada." });
  }
  const db = getDB();
  if (!db.penalties) db.penalties = [];
  const monthly = Number(db.settings.monthlyFee) || 10000;
  const fineAmt = Number(db.settings.latePenalty) || 2000;
  const monthTag = new Date().toISOString().slice(0, 7);
  const approved = (db.payments || []).filter((p) => p.status === "APPROVED" && p.type === "Ada ya mwezi");

  let count = 0;
  (db.users || [])
    .filter((u) => u.status === "ACTIVE" && u.role !== "ADMIN")
    .forEach((u) => {
      const months = Math.max(
        1,
        Math.floor((Date.now() - new Date(u.createdAt).getTime()) / (30 * 24 * 60 * 60 * 1000))
      );
      const expected = months * monthly;
      const paid = approved
        .filter((p) => p.userId === u.id)
        .reduce((s, p) => s + (Number(p.amount) || 0), 0);
      const debt = Math.max(0, expected - paid);
      const alreadyCharged = db.penalties.find(
        (x) => x.userId === u.id && x.batchMonth === monthTag
      );

      if (debt > 0 && !alreadyCharged) {
        db.penalties.unshift({
          id: `${Date.now()}-${u.id}`,
          userId: u.id,
          userName: u.name,
          wfcId: u.wfcId || "—",
          reason: `Kuchelewa kulipa ada ya mwezi (${monthTag})`,
          amount: fineAmt,
          status: "UNPAID",
          batchMonth: monthTag,
          issuedBy: req.session.user.name,
          createdAt: new Date().toISOString()
        });
        count++;
      }
    });

  await saveDB(db);
  res.json({ success: true, count });
});

// ==================== ACCOUNTING ====================

app.get("/api/accounting/summary", requireAuth, (req, res) => {
  if (!isLeader(req.session.user.role)) return res.status(403).json({ error: "Huna mamlaka" });
  res.json(computeFinance(getDB()));
});

app.get("/api/accounting/debts", requireAuth, (req, res) => {
  if (!isLeader(req.session.user.role)) return res.status(403).json({ error: "Huna mamlaka" });
  const db = getDB();
  const monthly = Number(db.settings.monthlyFee) || 10000;
  const approved = (db.payments || []).filter(
    (p) => p.status === "APPROVED" && p.type === "Ada ya mwezi"
  );
  const list = (db.users || [])
    .filter((u) => u.status === "ACTIVE")
    .map((u) => {
      const months = Math.max(
        1,
        Math.floor((Date.now() - new Date(u.createdAt).getTime()) / (30 * 24 * 60 * 60 * 1000))
      );
      const expected = months * monthly;
      const paid = approved
        .filter((p) => p.userId === u.id)
        .reduce((s, p) => s + (Number(p.amount) || 0), 0);
      return {
        id: u.id,
        name: u.name,
        region: u.region,
        wfcId: u.wfcId,
        expected,
        paid,
        debt: Math.max(0, expected - paid),
        months
      };
    })
    .filter((x) => x.debt > 0);
  res.json(list);
});

app.get("/api/expenses", requireAuth, (req, res) => {
  if (!isLeader(req.session.user.role)) return res.status(403).json({ error: "Huna mamlaka" });
  res.json(getDB().expenses || []);
});

app.post("/api/expenses", requireAuth, async (req, res) => {
  if (!isFinanceLeader(req.session.user.role)) return res.status(403).json({ error: "Huna mamlaka" });
  const db = getDB();
  if (!db.expenses) db.expenses = [];
  db.expenses.unshift({
    id: Date.now().toString(),
    title: cleanStr(req.body.title, 150),
    amount: Math.max(0, Number(req.body.amount) || 0),
    category: cleanStr(req.body.category, 60) || "Nyingine",
    note: cleanStr(req.body.note, 300),
    createdBy: req.session.user.name,
    createdAt: new Date().toISOString()
  });
  await saveDB(db);
  res.json({ success: true });
});

app.get("/api/manual-income", requireAuth, (req, res) => {
  if (!isLeader(req.session.user.role)) return res.status(403).json({ error: "Huna mamlaka" });
  res.json(getDB().manualIncome || []);
});

app.post("/api/manual-income", requireAuth, async (req, res) => {
  if (!isFinanceLeader(req.session.user.role)) return res.status(403).json({ error: "Huna mamlaka" });
  const db = getDB();
  if (!db.manualIncome) db.manualIncome = [];
  db.manualIncome.unshift({
    id: Date.now().toString(),
    title: cleanStr(req.body.title, 150),
    amount: Math.max(0, Number(req.body.amount) || 0),
    source: cleanStr(req.body.source, 100) || "Nyingine",
    note: cleanStr(req.body.note, 300),
    createdBy: req.session.user.name,
    createdAt: new Date().toISOString()
  });
  await saveDB(db);
  res.json({ success: true });
});

// ==================== MEMBERS & RBAC ====================

app.get("/api/members", requireAuth, (req, res) => {
  const db = getDB();
  res.json(
    db.users.map((u) => ({
      id: u.id,
      name: u.name,
      phone: u.phone,
      region: u.region,
      status: u.status,
      role: u.role,
      wfcId: u.wfcId,
      profession: u.profession,
      paymentProof: isLeader(req.session.user.role) ? u.paymentProof : undefined
    }))
  );
});

app.post("/api/approve-member", requireAuth, async (req, res) => {
  if (!isLeader(req.session.user.role)) return res.status(403).json({ error: "Huna mamlaka" });
  const db = getDB();
  const user = db.users.find((u) => u.id === cleanStr(req.body.userId, 60));
  if (!user) return res.status(404).json({ error: "Mwanachama hajapatikana" });
  user.status = "ACTIVE";
  if (!user.wfcId) {
    user.wfcId = "WFC-" + String(db.users.filter((u) => u.wfcId).length + 1).padStart(4, "0");
  }
  await saveDB(db);
  res.json({ success: true, wfcId: user.wfcId });
});

app.post("/api/suspend-member", requireAuth, async (req, res) => {
  if (!isAdmin(req.session.user.role)) return res.status(403).json({ error: "Admin pekee anaweza kusimamisha mwanachama" });
  const db = getDB();
  const user = db.users.find((u) => u.id === cleanStr(req.body.userId, 60));
  if (!user) return res.status(404).json({ error: "Mwanachama hajapatikana" });
  if (user.id === req.session.user.id) return res.status(400).json({ error: "Huwezi kujisimamisha mwenyewe" });
  user.status = user.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
  await saveDB(db);
  res.json({ success: true, status: user.status });
});

app.post("/api/remove-member", requireAuth, async (req, res) => {
  if (!isAdmin(req.session.user.role)) return res.status(403).json({ error: "Admin pekee anaweza kuondoa mwanachama" });
  const db = getDB();
  const targetId = cleanStr(req.body.userId, 60);
  if (targetId === req.session.user.id) return res.status(400).json({ error: "Huwezi kujiondoa mwenyewe" });
  const before = db.users.length;
  db.users = db.users.filter((u) => u.id !== targetId);
  if (db.users.length === before) return res.status(404).json({ error: "Mwanachama hajapatikana" });
  await saveDB(db);
  res.json({ success: true });
});

// ==================== PAYMENTS ====================

app.get("/api/payments", requireAuth, (req, res) => {
  const db = getDB();
  if (isLeader(req.session.user.role)) return res.json(db.payments);
  res.json(db.payments.filter((p) => p.userId === req.session.user.id));
});

app.post("/api/submit-payment", requireAuth, async (req, res) => {
  const type = cleanStr(req.body.type, 80);
  const amount = Math.max(0, Number(req.body.amount) || 0);
  const transactionId = cleanStr(req.body.transactionId, 80).toUpperCase();

  if (!type || amount <= 0 || !transactionId) {
    return res.status(400).json({ error: "Jaza aina, kiasi sahihi na namba ya muamala" });
  }

  const db = getDB();
  if (db.payments.find((p) => String(p.transactionId).toUpperCase() === transactionId)) {
    return res.status(400).json({ error: "Namba ya muamala tayari imetumika" });
  }

  db.payments.unshift({
    id: Date.now().toString(),
    userId: req.session.user.id,
    userName: req.session.user.name,
    type,
    amount,
    transactionId,
    status: "PENDING",
    createdAt: new Date().toISOString()
  });
  await saveDB(db);
  res.json({ success: true });
});

app.post("/api/approve-payment", requireAuth, async (req, res) => {
  if (!isFinanceLeader(req.session.user.role)) return res.status(403).json({ error: "Huna mamlaka" });
  const db = getDB();
  const p = db.payments.find((x) => x.id === cleanStr(req.body.paymentId, 60));
  if (!p) return res.status(404).json({ error: "Muamala haujapatikana" });
  p.status = "APPROVED";
  p.approvedBy = req.session.user.name;
  p.approvedAt = new Date().toISOString();
  p.receiptNo = p.receiptNo || "RCP-" + Date.now().toString().slice(-6);
  await saveDB(db);
  res.json({ success: true, receiptNo: p.receiptNo });
});

// ==================== EVENTS & ANNOUNCEMENTS ====================

app.get("/api/events", requireAuth, (req, res) => res.json(getDB().events || []));

app.post("/api/events", requireAuth, async (req, res) => {
  if (!isLeader(req.session.user.role)) return res.status(403).json({ error: "Viongozi pekee wanaweza kuongeza tukio" });
  const db = getDB();
  if (!db.events) db.events = [];
  const poster = typeof req.body.poster === "string" && req.body.poster.startsWith("data:image/")
    ? req.body.poster.slice(0, 1700000)
    : "";
  db.events.unshift({
    id: Date.now().toString(),
    type: cleanStr(req.body.type, 50) || "Tukio",
    title: cleanStr(req.body.title, 150),
    location: cleanStr(req.body.location, 150),
    ticketPrice: Math.max(0, Number(req.body.ticketPrice) || 0),
    poster,
    raisedAmount: 0,
    status: "ACTIVE",
    public: true,
    reportedBy: req.session.user.name,
    createdAt: new Date().toISOString()
  });
  await saveDB(db);
  res.json({ success: true });
});

app.get("/api/announcements", requireAuth, (req, res) => res.json(getDB().announcements || []));

app.post("/api/announcements", requireAuth, async (req, res) => {
  if (!isLeader(req.session.user.role)) return res.status(403).json({ error: "Huna mamlaka" });
  const db = getDB();
  if (!db.announcements) db.announcements = [];
  const rawLink = cleanStr(req.body.link, 300);
  const safeLink =
    rawLink && (rawLink.startsWith("/") || rawLink.startsWith("https://") || rawLink.startsWith("http://"))
      ? rawLink
      : "";
  db.announcements.unshift({
    id: Date.now().toString(),
    title: cleanStr(req.body.title, 160),
    body: cleanStr(req.body.body, 2000),
    link: safeLink,
    author: req.session.user.name,
    createdAt: new Date().toISOString()
  });
  await saveDB(db);
  res.json({ success: true });
});

// ==================== MEMBER MODULES ====================

app.get("/api/family", requireAuth, (req, res) => {
  const u = getDB().users.find((x) => x.id === req.session.user.id);
  res.json((u && u.family) || {});
});

app.post("/api/family", requireAuth, async (req, res) => {
  const db = getDB();
  const u = db.users.find((x) => x.id === req.session.user.id);
  u.family = {
    head: cleanStr(req.body.head, 120),
    spouse: cleanStr(req.body.spouse, 120),
    children: Array.isArray(req.body.children)
      ? req.body.children.map((c) => cleanStr(c, 80)).filter(Boolean).slice(0, 20)
      : []
  };
  await saveDB(db);
  res.json({ success: true });
});

app.get("/api/directory", requireAuth, (req, res) => {
  const db = getDB();
  res.json(
    db.users
      .filter((u) => u.status === "ACTIVE" && u.profession)
      .map((u) => ({ name: u.name, profession: u.profession, region: u.region, phone: u.phone }))
  );
});

app.post("/api/my-profession", requireAuth, async (req, res) => {
  const db = getDB();
  const u = db.users.find((x) => x.id === req.session.user.id);
  u.profession = cleanStr(req.body.profession, 120);
  await saveDB(db);
  res.json({ success: true });
});

app.get("/api/support", requireAuth, (req, res) => {
  const db = getDB();
  const list = (db.supportTickets || []).filter(
    (t) => t.userId === req.session.user.id || isLeader(req.session.user.role)
  );
  res.json(list);
});

app.post("/api/support", requireAuth, async (req, res) => {
  const db = getDB();
  if (!db.supportTickets) db.supportTickets = [];
  db.supportTickets.unshift({
    id: Date.now().toString(),
    userId: req.session.user.id,
    userName: req.session.user.name,
    subject: cleanStr(req.body.subject, 160),
    message: cleanStr(req.body.message, 2000),
    status: "OPEN",
    createdAt: new Date().toISOString()
  });
  await saveDB(db);
  res.json({ success: true });
});

app.get("/api/my-debt", requireAuth, (req, res) => {
  const db = getDB();
  const user = db.users.find((u) => u.id === req.session.user.id);
  if (!user || user.status !== "ACTIVE") return res.json({ debt: 0, expected: 0, paid: 0, months: 0 });
  const monthly = Number(db.settings.monthlyFee) || 10000;
  const monthsSince = Math.max(
    1,
    Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (30 * 24 * 60 * 60 * 1000))
  );
  const expected = monthsSince * monthly;
  const paid = db.payments
    .filter((p) => p.userId === user.id && p.type === "Ada ya mwezi" && p.status === "APPROVED")
    .reduce((s, p) => s + (Number(p.amount) || 0), 0);
  res.json({ debt: Math.max(0, expected - paid), expected, paid, months: monthsSince });
});

// ==================== GOVERNANCE, SACCOS, ASSETS & PROJECTS ====================

app.get("/api/attendance", requireAuth, (req, res) => res.json(getDB().attendance || []));
app.post("/api/attendance", requireAuth, async (req, res) => {
  const db = getDB();
  if (!db.attendance) db.attendance = [];
  db.attendance.unshift({
    id: Date.now().toString(),
    userId: req.session.user.id,
    userName: req.session.user.name,
    meeting: cleanStr(req.body.meeting, 140) || "Mkutano",
    date: new Date().toISOString()
  });
  await saveDB(db);
  res.json({ success: true });
});

app.get("/api/elections", requireAuth, (req, res) => {
  const db = getDB();
  res.json(
    (db.elections || []).map((e) => ({
      ...e,
      hasVoted: (e.votes || []).some((v) => v.userId === req.session.user.id)
    }))
  );
});

app.post("/api/elections", requireAuth, async (req, res) => {
  if (!isLeader(req.session.user.role)) return res.status(403).json({ error: "Huna mamlaka" });
  const db = getDB();
  if (!db.elections) db.elections = [];
  db.elections.unshift({
    id: Date.now().toString(),
    position: cleanStr(req.body.position, 140),
    candidates: [],
    votes: [],
    status: "OPEN",
    createdAt: new Date().toISOString()
  });
  await saveDB(db);
  res.json({ success: true });
});

app.post("/api/elections/nominate", requireAuth, async (req, res) => {
  if (!isLeader(req.session.user.role)) return res.status(403).json({ error: "Viongozi pekee wanaweza kuongeza mgombea" });
  const db = getDB();
  const e = (db.elections || []).find((x) => x.id === cleanStr(req.body.electionId, 60));
  if (!e) return res.status(404).json({ error: "Uchaguzi haujapatikana" });
  const name = cleanStr(req.body.name, 120);
  if (!name) return res.status(400).json({ error: "Weka jina la mgombea" });
  e.candidates.push({ name, manifesto: cleanStr(req.body.manifesto, 400) });
  await saveDB(db);
  res.json({ success: true });
});

app.post("/api/elections/vote", requireAuth, async (req, res) => {
  const db = getDB();
  const e = (db.elections || []).find((x) => x.id === cleanStr(req.body.electionId, 60));
  if (!e) return res.status(404).json({ error: "Uchaguzi haujapatikana" });
  if (e.votes.find((v) => v.userId === req.session.user.id)) {
    return res.status(400).json({ error: "Tayari umeshapiga kura kwenye nafasi hii" });
  }
  const candidate = cleanStr(req.body.candidate, 120);
  if (!e.candidates.find((c) => c.name === candidate)) {
    return res.status(400).json({ error: "Mgombea si sahihi" });
  }
  e.votes.push({ userId: req.session.user.id, candidate, votedAt: new Date().toISOString() });
  await saveDB(db);
  res.json({ success: true });
});

app.get("/api/cases", requireAuth, (req, res) => res.json(getDB().cases || []));
app.post("/api/cases", requireAuth, async (req, res) => {
  const db = getDB();
  if (!db.cases) db.cases = [];
  db.cases.unshift({
    id: Date.now().toString(),
    userId: req.session.user.id,
    reportedBy: req.session.user.name,
    title: cleanStr(req.body.title, 160),
    description: cleanStr(req.body.description, 2000),
    status: "OPEN",
    createdAt: new Date().toISOString()
  });
  await saveDB(db);
  res.json({ success: true });
});

app.get("/api/saccos", requireAuth, (req, res) => {
  const db = getDB();
  const saccos = db.saccos || { shares: [], savings: [], loans: [] };
  if (isLeader(req.session.user.role)) return res.json(saccos);
  res.json({
    shares: (saccos.shares || []).filter((s) => s.userId === req.session.user.id),
    savings: (saccos.savings || []).filter((s) => s.userId === req.session.user.id),
    loans: (saccos.loans || []).filter((l) => l.userId === req.session.user.id)
  });
});

app.post("/api/saccos/shares", requireAuth, async (req, res) => {
  const db = getDB();
  if (!db.saccos) db.saccos = { shares: [], savings: [], loans: [] };
  const amount = Math.max(0, Number(req.body.amount) || 0);
  if (amount <= 0) return res.status(400).json({ error: "Weka kiasi sahihi" });
  db.saccos.shares.unshift({
    id: Date.now().toString(),
    userId: req.session.user.id,
    userName: req.session.user.name,
    amount,
    date: new Date().toISOString()
  });
  await saveDB(db);
  res.json({ success: true });
});

app.post("/api/saccos/loans", requireAuth, async (req, res) => {
  const db = getDB();
  if (!db.saccos) db.saccos = { shares: [], savings: [], loans: [] };
  const amount = Math.max(0, Number(req.body.amount) || 0);
  if (amount <= 0) return res.status(400).json({ error: "Weka kiasi sahihi cha mkopo" });
  db.saccos.loans.unshift({
    id: Date.now().toString(),
    userId: req.session.user.id,
    userName: req.session.user.name,
    amount,
    purpose: cleanStr(req.body.purpose, 250),
    status: "PENDING",
    createdAt: new Date().toISOString()
  });
  await saveDB(db);
  res.json({ success: true });
});

app.get("/api/assets", requireAuth, (req, res) => res.json(getDB().assets || []));
app.post("/api/assets", requireAuth, async (req, res) => {
  if (!isLeader(req.session.user.role)) return res.status(403).json({ error: "Huna mamlaka" });
  const db = getDB();
  if (!db.assets) db.assets = [];
  db.assets.unshift({
    id: Date.now().toString(),
    name: cleanStr(req.body.name, 150),
    value: Math.max(0, Number(req.body.value) || 0),
    location: cleanStr(req.body.location, 150),
    createdAt: new Date().toISOString()
  });
  await saveDB(db);
  res.json({ success: true });
});

app.get("/api/projects", requireAuth, (req, res) => res.json(getDB().projects || []));
app.post("/api/projects", requireAuth, async (req, res) => {
  if (!isLeader(req.session.user.role)) return res.status(403).json({ error: "Viongozi pekee wanaweza kuongeza mradi" });
  const db = getDB();
  if (!db.projects) db.projects = [];
  db.projects.unshift({
    id: Date.now().toString(),
    name: cleanStr(req.body.name, 150),
    progress: Math.max(0, Math.min(100, Number(req.body.progress) || 0)),
    tasks: [],
    createdAt: new Date().toISOString()
  });
  await saveDB(db);
  res.json({ success: true });
});

app.get("/api/documents", requireAuth, (req, res) => res.json(getDB().documents || []));
app.post("/api/documents", requireAuth, async (req, res) => {
  if (!isLeader(req.session.user.role)) return res.status(403).json({ error: "Huna mamlaka" });
  const db = getDB();
  if (!db.documents) db.documents = [];
  const rawUrl = cleanStr(req.body.url, 400);
  const safeUrl =
    rawUrl && (rawUrl.startsWith("https://") || rawUrl.startsWith("http://") || rawUrl.startsWith("/"))
      ? rawUrl
      : "#";
  db.documents.unshift({
    id: Date.now().toString(),
    title: cleanStr(req.body.title, 160),
    url: safeUrl,
    summary: cleanStr(req.body.summary, 400),
    createdAt: new Date().toISOString()
  });
  await saveDB(db);
  res.json({ success: true });
});

app.get("/api/notifications", requireAuth, (req, res) => {
  const db = getDB();
  const list = (db.notifications || []).filter(
    (n) => n.userId === req.session.user.id || n.userId === "all"
  );
  res.json(list.slice(0, 40));
});

app.post("/api/notifications", requireAuth, async (req, res) => {
  if (!isLeader(req.session.user.role)) return res.status(403).json({ error: "Huna mamlaka" });
  const db = getDB();
  if (!db.notifications) db.notifications = [];
  db.notifications.unshift({
    id: Date.now().toString(),
    userId: cleanStr(req.body.userId, 60) || "all",
    title: cleanStr(req.body.title, 160),
    body: cleanStr(req.body.body, 1500),
    createdAt: new Date().toISOString()
  });
  await saveDB(db);
  res.json({ success: true });
});

app.get("/api/roles", requireAuth, (req, res) => {
  res.json(["ADMIN", "CHAIRPERSON", "SECRETARY", "TREASURER", "REGIONAL", "MEMBER"]);
});

app.post("/api/set-role", requireAuth, async (req, res) => {
  if (!isAdmin(req.session.user.role)) return res.status(403).json({ error: "Admin only" });
  const db = getDB();
  const u = db.users.find((x) => x.id === cleanStr(req.body.userId, 60));
  if (!u) return res.status(404).json({ error: "Hajapatikana" });
  const allowed = ["ADMIN", "CHAIRPERSON", "SECRETARY", "TREASURER", "REGIONAL", "MEMBER"];
  if (!allowed.includes(req.body.role)) return res.status(400).json({ error: "Jukumu si sahihi" });
  u.role = req.body.role;
  await saveDB(db);
  res.json({ success: true });
});

app.post("/api/dispatch", requireAuth, async (req, res) => {
  if (!isLeader(req.session.user.role)) return res.status(403).json({ error: "Huna mamlaka" });
  const db = getDB();
  const channel = cleanStr(req.body.channel, 20);
  const to = cleanStr(req.body.to, 80);
  const title = cleanStr(req.body.title, 160);
  const body = cleanStr(req.body.body, 1500);
  const message = `${title || "WFC"}\n${body || ""}`;
  let status = "queued";
  let detail = "Imehifadhiwa";

  try {
    if (channel === "sms" && db.settings.smsKey && db.settings.smsUsername) {
      const r = await fetch("https://api.africastalking.com/version1/messaging", {
        method: "POST",
        headers: {
          apiKey: db.settings.smsKey,
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({ username: db.settings.smsUsername, to, message })
      });
      detail = (await r.text()).slice(0, 280);
      status = r.ok ? "sent" : "failed";
    } else if (channel === "whatsapp" && db.settings.whatsappToken && db.settings.whatsappPhoneId) {
      const r = await fetch(
        `https://graph.facebook.com/v21.0/${db.settings.whatsappPhoneId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${db.settings.whatsappToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: String(to).replace(/\D/g, ""),
            type: "text",
            text: { body: message }
          })
        }
      );
      detail = (await r.text()).slice(0, 280);
      status = r.ok ? "sent" : "failed";
    } else if (channel === "sms") {
      detail = "Weka Africa's Talking username na API key kwenye Mipangilio.";
    } else if (channel === "whatsapp") {
      detail = "Imefunguliwa kupitia WhatsApp Web/App.";
    } else if (channel === "email") {
      detail = "Imefunguliwa kwenye programu ya barua pepe.";
    }
  } catch (err) {
    status = "failed";
    detail = String(err.message || err).slice(0, 200);
  }

  if (!db.outbox) db.outbox = [];
  db.outbox.unshift({
    id: Date.now().toString(),
    channel,
    to,
    title,
    body,
    status,
    detail,
    createdAt: new Date().toISOString()
  });
  await saveDB(db);
  res.json({ success: true, status, detail });
});

app.get("/api/outbox", requireAuth, (req, res) => {
  if (!isLeader(req.session.user.role)) return res.status(403).json({ error: "Huna mamlaka" });
  res.json(getDB().outbox || []);
});

app.post("/api/stk", requireAuth, async (req, res) => {
  const db = getDB();
  const phone = cleanPhone(req.body.phone);
  const amount = Math.max(0, Number(req.body.amount) || 0);
  if (!db.settings.momoConsumerKey || !db.settings.momoConsumerSecret) {
    return res.json({
      ok: false,
      detail: "Daraja haijaunganishwa. Lipa kwa namba ya WFC kisha weka namba ya muamala."
    });
  }
  const auth = Buffer.from(
    `${db.settings.momoConsumerKey}:${db.settings.momoConsumerSecret}`
  ).toString("base64");
  const tokenRes = await fetch(
    "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
    { headers: { Authorization: `Basic ${auth}` } }
  );
  const text = await tokenRes.text();
  res.json({
    ok: tokenRes.ok,
    detail: tokenRes.ok
      ? `Token imepatikana. Ombi la STK kwa ${phone}, TSh ${amount}.`
      : text.slice(0, 280)
  });
});

app.post("/api/settings", requireAuth, async (req, res) => {
  if (!isAdmin(req.session.user.role)) return res.status(403).json({ error: "Admin only" });
  const db = getDB();
  const keys = [
    "smsUsername",
    "smsKey",
    "whatsappToken",
    "whatsappPhoneId",
    "emailFrom",
    "momoConsumerKey",
    "momoConsumerSecret",
    "momoShortcode"
  ];
  keys.forEach((k) => {
    if (req.body[k] !== undefined) db.settings[k] = cleanStr(req.body[k], 300);
  });
  await saveDB(db);
  res.json({ success: true });
});

app.post("/api/toggle-2fa", requireAuth, async (req, res) => {
  const db = getDB();
  const u = db.users.find((x) => x.id === req.session.user.id);
  if (!u) return res.status(404).json({ error: "Haijapatikana" });
  u.twoFactor = !u.twoFactor;
  await saveDB(db);
  res.json({ twoFactor: Boolean(u.twoFactor) });
});

app.post("/api/change-password", requireAuth, async (req, res) => {
  const currentPassword = String((req.body && req.body.currentPassword) || "");
  const newPassword = String((req.body && req.body.newPassword) || "");
  if (newPassword.length < 6) {
    return res.status(400).json({ error: "Nenosiri jipya liwe na angalau herufi 6" });
  }
  const db = getDB();
  const u = db.users.find((x) => x.id === req.session.user.id);
  if (!u) return res.status(404).json({ error: "Akaunti haijapatikana" });
  const ok = await bcrypt.compare(currentPassword, u.password);
  if (!ok) return res.status(401).json({ error: "Nenosiri la sasa si sahihi" });
  u.password = await bcrypt.hash(newPassword, 10);
  await saveDB(db);
  res.json({ success: true });
});

app.get("/api/analytics", requireAuth, (req, res) => {
  const db = getDB();
  const regions = {};
  db.users
    .filter((u) => u.status === "ACTIVE")
    .forEach((u) => {
      regions[u.region || "Nyingine"] = (regions[u.region || "Nyingine"] || 0) + 1;
    });
  const types = {};
  db.payments
    .filter((p) => p.status === "APPROVED")
    .forEach((p) => {
      types[p.type] = (types[p.type] || 0) + (Number(p.amount) || 0);
    });
  res.json({
    regions: Object.entries(regions).map(([name, value]) => ({ name, value })),
    types: Object.entries(types).map(([name, value]) => ({ name, value }))
  });
});

app.get("/api/backup", requireAuth, (req, res) => {
  if (!isAdmin(req.session.user.role)) return res.status(403).json({ error: "Admin only" });
  const db = getDB();
  const safeBackup = {
    ...db,
    users: db.users.map(sanitizeUser)
  };
  res.setHeader("Content-Disposition", `attachment; filename="wfc-backup-${Date.now()}.json"`);
  res.json(safeBackup);
});

app.post("/api/demo/clear", requireAuth, async (req, res) => {
  if (!isAdmin(req.session.user.role)) return res.status(403).json({ error: "Admin only" });
  const db = getDB();
  const demoIds = new Set(db.users.filter((u) => u.demo).map((u) => u.id));
  db.users = db.users.filter((u) => !u.demo);
  ["payments", "events", "announcements", "tickets", "attendance", "expenses", "manualIncome"].forEach((k) => {
    if (Array.isArray(db[k])) {
      db[k] = db[k].filter((x) => !x.demo && !demoIds.has(x.userId));
    }
  });
  db.settings.demoSeed = false;
  await saveDB(db);
  res.json({ success: true });
});

app.get("/manifest.json", (req, res) =>
  res.json({
    name: "WFC Portal",
    short_name: "WFC",
    start_url: "/",
    display: "standalone",
    background_color: "#F8FAFC",
    theme_color: "#F97316",
    icons: [{ src: "/wfc-logo.jpg", sizes: "192x192", type: "image/jpeg" }]
  })
);

app.get("*", (req, res) => res.sendFile(path.join(__dirname, "../public/index.html")));

initDB()
  .then(() => {
    app.listen(PORT, () => console.log("WFC Portal v4.0 running on port " + PORT));
  })
  .catch((err) => {
    console.error("Fatal DB startup error:", err);
    process.exit(1);
  });
