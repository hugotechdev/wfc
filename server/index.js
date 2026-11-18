const express = require("express");
const session = require("express-session");
const path = require("path");
const { initDB, loadDB, saveDB, logAudit, isPostgresActive } = require("./db");
const {
  securityHeaders,
  rateLimit,
  hashPassword,
  verifyPassword,
  isHashed,
  sanitizeText,
  verifyRecaptcha
} = require("./security");

const app = express();
const PORT = process.env.PORT || 3000;

app.set("trust proxy", 1);
app.use(securityHeaders);
app.use(express.json({ limit: "6mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../public")));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "wfc-v6-production-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000
    }
  })
);

function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: "Tafadhali ingia kwenye akaunti kwanza" });
  next();
}

function isLeader(role) {
  return ["ADMIN", "CHAIRPERSON", "SECRETARY", "TREASURER", "REGIONAL"].includes(role);
}

function isFinanceLeader(role) {
  return ["ADMIN", "TREASURER", "CHAIRPERSON"].includes(role);
}

// ===== PUBLIC ROUTES =====
app.get("/", (req, res) => {
  if (req.session.user) return res.redirect("/app");
  res.sendFile(path.join(__dirname, "../public/landing.html"));
});

app.get("/app", (req, res) => res.sendFile(path.join(__dirname, "../public/index.html")));
app.get("/ticket/:id", (req, res) => res.sendFile(path.join(__dirname, "../public/ticket.html")));

app.get("/manifest.json", (req, res) =>
  res.json({
    name: "WACHAGGA FAMILY COMMUNITY (WFC)",
    short_name: "WFC Portal",
    start_url: "/",
    display: "standalone",
    background_color: "#12100c",
    theme_color: "#c6a15b",
    icons: [{ src: "/wfc-logo.jpg", sizes: "512x512", type: "image/jpeg" }]
  })
);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", version: "6.0.0", storage: isPostgresActive() ? "postgresql" : "json" });
});

app.get("/api/public/config", (req, res) => {
  const db = loadDB();
  res.json({
    orgName: db.settings.orgName || "WACHAGGA FAMILY COMMUNITY",
    slogan: db.settings.slogan || "Stand up, it's not over.",
    subSlogan: db.settings.subSlogan || "Umoja wa Wachagga, Nguvu ya Familia",
    registrationFee: db.settings.registrationFee || 1000,
    entryFee: db.settings.entryFee || 50000,
    monthlyFee: db.settings.monthlyFee || 10000,
    emergencyFee: db.settings.emergencyFee || 60000,
    paymentNumbers: db.settings.paymentNumbers,
    recaptchaSiteKey: db.settings.recaptchaSiteKey || ""
  });
});

app.get("/api/public/events", (req, res) => {
  const db = loadDB();
  res.json((db.events || []).filter((e) => e.public !== false));
});

app.get("/api/public/announcements", (req, res) => {
  res.json(loadDB().announcements || []);
});

app.get("/api/public/stats", (req, res) => {
  const db = loadDB();
  const activeUsers = (db.users || []).filter((u) => u.status === "ACTIVE");
  const regions = new Set(activeUsers.map((u) => u.region).filter(Boolean));
  res.json({
    members: activeUsers.length,
    events: (db.events || []).filter((e) => e.public !== false).length,
    regions: regions.size || 1
  });
});

app.post("/api/contact", rateLimit(15, 15 * 60 * 1000), (req, res) => {
  const name = sanitizeText(req.body?.name, 120);
  const phone = sanitizeText(req.body?.phone, 40);
  const email = sanitizeText(req.body?.email, 120);
  const message = sanitizeText(req.body?.message, 1500);
  if (!name || !phone || !message) return res.status(400).json({ error: "Tafadhali jaza jina, simu na ujumbe" });

  const db = loadDB();
  if (!db.contacts) db.contacts = [];
  db.contacts.unshift({
    id: "CNT-" + Date.now(),
    name,
    phone,
    email,
    message,
    status: "NEW",
    createdAt: new Date().toISOString()
  });
  saveDB(db);
  res.json({ success: true });
});

app.post("/api/tickets", rateLimit(25, 15 * 60 * 1000), (req, res) => {
  const db = loadDB();
  if (!db.tickets) db.tickets = [];
  const transactionId = sanitizeText(req.body?.transactionId, 80);
  const name = sanitizeText(req.body?.name, 120);
  const phone = sanitizeText(req.body?.phone, 40);
  const eventId = sanitizeText(req.body?.eventId, 80);
  const qty = Math.max(1, Math.min(50, Number(req.body?.qty) || 1));

  if (!name || !phone || !transactionId) return res.status(400).json({ error: "Jaza taarifa zote za tiketi" });
  if (db.tickets.find((t) => t.transactionId === transactionId)) {
    return res.status(400).json({ error: "Namba hii ya muamala tayari imetumika" });
  }
  const ev = (db.events || []).find((e) => e.id === eventId);
  const ticketCode = "TKT-" + Math.random().toString(36).substring(2, 8).toUpperCase();
  db.tickets.unshift({
    id: Date.now().toString(),
    ticketCode,
    eventId,
    eventTitle: ev ? ev.title : "Tukio la WFC",
    name,
    phone,
    qty,
    unitPrice: ev ? Number(ev.ticketPrice || 0) : 0,
    totalAmount: ev ? Number(ev.ticketPrice || 0) * qty : 0,
    transactionId,
    status: "PENDING",
    createdAt: new Date().toISOString()
  });
  saveDB(db);
  res.json({ success: true, ticketCode });
});

// ===== AUTH & SECURITY =====
app.post("/api/register", rateLimit(15, 15 * 60 * 1000), async (req, res) => {
  const db = loadDB();
  const okCaptcha = await verifyRecaptcha(req.body?.recaptchaToken, db.settings?.recaptchaSecretKey, req.ip);
  if (!okCaptcha) return res.status(400).json({ error: "Thibitisha reCAPTCHA kwanza" });

  const name = sanitizeText(req.body?.name, 120);
  const phone = sanitizeText(req.body?.phone, 40);
  const email = sanitizeText(req.body?.email, 120);
  const region = sanitizeText(req.body?.region, 80) || "Dar es Salaam";
  const district = sanitizeText(req.body?.district, 80);
  const clan = sanitizeText(req.body?.clan, 80);
  const village = sanitizeText(req.body?.village, 80);
  const profession = sanitizeText(req.body?.profession, 100);
  const paymentMethod = sanitizeText(req.body?.paymentMethod, 40) || "M-Pesa";
  const paymentProof = sanitizeText(req.body?.paymentProof, 200);
  const password = String(req.body?.password || "");

  if (!name || !phone || !password) return res.status(400).json({ error: "Jaza jina, namba ya simu na nenosiri" });
  if (password.length < 4) return res.status(400).json({ error: "Nenosiri liwe na angalau herufi 4" });
  if (db.users.find((u) => u.phone === phone)) return res.status(400).json({ error: "Namba hii ya simu tayari imesajiliwa" });

  const newUser = {
    id: Date.now().toString(),
    name,
    phone,
    email,
    region,
    district,
    clan,
    village,
    password: hashPassword(password),
    role: "MEMBER",
    status: "PENDING",
    paymentMethod,
    paymentProof,
    wfcId: null,
    family: { head: name, spouse: "", children: [] },
    profession,
    createdAt: new Date().toISOString()
  };
  db.users.push(newUser);
  logAudit(db, { id: newUser.id, name }, "USAJILI_MPYA", phone, `Ukoo: ${clan || "-"}, Kanda: ${region}`);
  saveDB(db);
  res.json({ success: true, message: "Usajili wako umepokelewa! Subiri idhini ya uongozi." });
});

app.post("/api/login", rateLimit(20, 15 * 60 * 1000), async (req, res) => {
  const db = loadDB();
  const okCaptcha = await verifyRecaptcha(req.body?.recaptchaToken, db.settings?.recaptchaSecretKey, req.ip);
  if (!okCaptcha) return res.status(400).json({ error: "Thibitisha reCAPTCHA kwanza" });

  const phone = sanitizeText(req.body?.phone, 40);
  const password = String(req.body?.password || "");
  const user = db.users.find((u) => u.phone === phone);

  if (!user || !verifyPassword(password, user.password)) {
    return res.status(401).json({ error: "Namba ya simu au nenosiri si sahihi" });
  }
  if (user.status === "SUSPENDED") {
    return res.status(403).json({ error: "Akaunti yako imesimamishwa kwa muda. Wasiliana na uongozi." });
  }

  // Transparently upgrade legacy plaintext password to salted scrypt hash
  if (!isHashed(user.password)) {
    user.password = hashPassword(password);
    saveDB(db);
  }

  if (user.twoFactor) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    db.otps = (db.otps || []).filter((o) => o.exp > Date.now());
    db.otps.push({ phone: user.phone, code, exp: Date.now() + 5 * 60 * 1000 });
    saveDB(db);
    const smsOn = !!(db.settings.smsKey && db.settings.smsUsername);
    return res.json({ needOtp: true, devCode: smsOn ? null : code });
  }

  req.session.user = {
    id: user.id,
    name: user.name,
    phone: user.phone,
    role: user.role,
    status: user.status,
    wfcId: user.wfcId
  };
  logAudit(db, req.session.user, "KUINGIA_PORTAL", user.phone, `Role: ${user.role}`);
  saveDB(db);
  res.json({ success: true, user: req.session.user });
});

app.post("/api/verify-otp", rateLimit(15, 15 * 60 * 1000), (req, res) => {
  const db = loadDB();
  const phone = sanitizeText(req.body?.phone, 40);
  const code = sanitizeText(req.body?.code, 12);
  const otp = (db.otps || []).find((o) => o.phone === phone && o.code === code && o.exp > Date.now());
  if (!otp) return res.status(401).json({ error: "Msimbo wa OTP si sahihi au muda wake umeisha" });

  const user = db.users.find((u) => u.phone === phone);
  if (!user) return res.status(401).json({ error: "Akaunti haijapatikana" });

  db.otps = db.otps.filter((o) => o !== otp);
  saveDB(db);
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

app.post("/api/forgot-password", rateLimit(10, 15 * 60 * 1000), (req, res) => {
  const phone = sanitizeText(req.body?.phone, 40);
  const db = loadDB();
  const user = db.users.find((u) => u.phone === phone);
  if (!user) return res.status(404).json({ error: "Namba hii ya simu haijasajiliwa kwenye mfumo" });

  const token = String(Math.floor(100000 + Math.random() * 900000));
  db.resetTokens = (db.resetTokens || []).filter((t) => t.exp > Date.now() && t.phone !== phone);
  db.resetTokens.push({ phone, token, exp: Date.now() + 15 * 60 * 1000 });
  logAudit(db, { id: user.id, name: user.name }, "OMBI_NENOSIRI", phone, "Msimbo wa kubadili nenosiri umetolewa");
  saveDB(db);
  res.json({
    success: true,
    message: "Msimbo wa tarakimu 6 umetengenezwa. Ingiza msimbo huo na nenosiri jipya.",
    devCode: token
  });
});

app.post("/api/reset-password", rateLimit(10, 15 * 60 * 1000), (req, res) => {
  const phone = sanitizeText(req.body?.phone, 40);
  const token = sanitizeText(req.body?.token, 12);
  const newPassword = String(req.body?.newPassword || "");

  if (!phone || !token || newPassword.length < 4) {
    return res.status(400).json({ error: "Jaza taarifa zote; nenosiri liwe angalau herufi 4" });
  }

  const db = loadDB();
  const entry = (db.resetTokens || []).find((t) => t.phone === phone && t.token === token && t.exp > Date.now());
  if (!entry) return res.status(400).json({ error: "Msimbo si sahihi au muda wake umeisha" });

  const user = db.users.find((u) => u.phone === phone);
  if (!user) return res.status(404).json({ error: "Mwanachama hajapatikana" });

  user.password = hashPassword(newPassword);
  db.resetTokens = db.resetTokens.filter((t) => t !== entry);
  logAudit(db, { id: user.id, name: user.name }, "BADILI_NENOSIRI", phone, "Nenosiri limewekwa upya");
  saveDB(db);
  res.json({ success: true, message: "Nenosiri limebadilishwa kikamilifu! Sasa unaweza kuingia." });
});

app.post("/api/change-password", requireAuth, (req, res) => {
  const currentPassword = String(req.body?.currentPassword || "");
  const newPassword = String(req.body?.newPassword || "");
  if (newPassword.length < 4) return res.status(400).json({ error: "Nenosiri jipya liwe na angalau herufi 4" });

  const db = loadDB();
  const user = db.users.find((u) => u.id === req.session.user.id);
  if (!user || !verifyPassword(currentPassword, user.password)) {
    return res.status(400).json({ error: "Nenosiri la sasa si sahihi" });
  }
  user.password = hashPassword(newPassword);
  logAudit(db, req.session.user, "BADILI_NENOSIRI", user.phone, "Mabadiliko ndani ya akaunti");
  saveDB(db);
  res.json({ success: true });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get("/api/me", (req, res) => {
  if (!req.session.user) return res.json({ user: null });
  const db = loadDB();
  const fresh = db.users.find((u) => u.id === req.session.user.id);
  if (!fresh) {
    req.session.destroy();
    return res.json({ user: null });
  }
  req.session.user = {
    id: fresh.id,
    name: fresh.name,
    phone: fresh.phone,
    email: fresh.email || "",
    region: fresh.region || "",
    district: fresh.district || "",
    clan: fresh.clan || "",
    village: fresh.village || "",
    profession: fresh.profession || "",
    role: fresh.role,
    status: fresh.status,
    wfcId: fresh.wfcId,
    twoFactor: !!fresh.twoFactor
  };
  res.json({ user: req.session.user });
});

// ===== DASHBOARD =====
app.get("/api/dashboard", requireAuth, (req, res) => {
  const db = loadDB();
  const user = db.users.find((u) => u.id === req.session.user.id);
  if (!user) return res.status(401).json({ error: "Akaunti haijapatikana" });

  const myPayments = (db.payments || []).filter((p) => p.userId === user.id && p.status === "APPROVED");
  const totalPaid = myPayments.reduce((s, p) => s + (p.amount || 0), 0);
  const unreadNotifs = (db.notifications || []).filter(
    (n) => (n.userId === user.id || n.userId === "all") && !(n.readBy || []).includes(user.id)
  ).length;

  const regionMap = {};
  (db.users || [])
    .filter((u) => u.status === "ACTIVE")
    .forEach((u) => {
      const k = u.region || "Nyingine";
      regionMap[k] = (regionMap[k] || 0) + 1;
    });

  res.json({
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email || "",
      region: user.region || "",
      district: user.district || "",
      clan: user.clan || "",
      village: user.village || "",
      profession: user.profession || "",
      role: user.role,
      status: user.status,
      wfcId: user.wfcId,
      createdAt: user.createdAt
    },
    stats: {
      members: db.users.filter((u) => u.status === "ACTIVE").length,
      pending: db.users.filter((u) => u.status === "PENDING").length,
      payments: db.payments.length,
      events: (db.events || []).length,
      unreadNotifs
    },
    myTotalPaid: totalPaid,
    recent: db.payments.slice(-8).reverse(),
    upcoming: (db.events || []).slice(0, 4),
    notices: (db.announcements || []).slice(0, 3),
    regions: Object.entries(regionMap).map(([name, value]) => ({ name, value })),
    settings:
      req.session.user.role === "ADMIN"
        ? db.settings
        : {
            orgName: db.settings.orgName,
            slogan: db.settings.slogan,
            registrationFee: db.settings.registrationFee,
            entryFee: db.settings.entryFee,
            monthlyFee: db.settings.monthlyFee,
            emergencyFee: db.settings.emergencyFee,
            paymentNumbers: db.settings.paymentNumbers
          },
    finance: isLeader(req.session.user.role) ? computeFinance(db) : null
  });
});

function computeFinance(db) {
  const approved = (db.payments || []).filter((p) => p.status === "APPROVED");
  const incomeFromPayments = approved.reduce((s, p) => s + (p.amount || 0), 0);
  const manual = (db.manualIncome || []).reduce((s, i) => s + (i.amount || 0), 0);
  const ticketIncome = (db.tickets || [])
    .filter((t) => t.status === "APPROVED")
    .reduce((s, t) => s + (t.totalAmount || 0), 0);
  const expenses = (db.expenses || []).reduce((s, e) => s + (e.amount || 0), 0);
  const monthly = db.settings.monthlyFee || 10000;
  const active = (db.users || []).filter((u) => u.status === "ACTIVE");

  let totalDebt = 0;
  let debtors = 0;
  active.forEach((u) => {
    const months = Math.max(1, Math.floor((Date.now() - new Date(u.createdAt).getTime()) / (30 * 24 * 60 * 60 * 1000)));
    const expected = months * monthly;
    const paid = approved
      .filter((p) => p.userId === u.id && p.type === "Ada ya mwezi")
      .reduce((s, p) => s + (p.amount || 0), 0);
    const debt = Math.max(0, expected - paid);
    if (debt > 0) {
      totalDebt += debt;
      debtors++;
    }
  });

  const mapato = incomeFromPayments + manual + ticketIncome;
  return {
    mapato,
    matumizi: expenses,
    balance: mapato - expenses,
    totalDebt,
    debtors,
    incomeFromPayments,
    manualIncome: manual,
    ticketIncome
  };
}

// ===== ACCOUNTING =====
app.get("/api/accounting/summary", requireAuth, (req, res) => {
  if (!isLeader(req.session.user.role)) return res.status(403).json({ error: "Huna mamlaka" });
  res.json(computeFinance(loadDB()));
});

app.get("/api/accounting/debts", requireAuth, (req, res) => {
  if (!isLeader(req.session.user.role)) return res.status(403).json({ error: "Huna mamlaka" });
  const db = loadDB();
  const monthly = db.settings.monthlyFee || 10000;
  const approved = (db.payments || []).filter((p) => p.status === "APPROVED" && p.type === "Ada ya mwezi");
  const list = (db.users || [])
    .filter((u) => u.status === "ACTIVE")
    .map((u) => {
      const months = Math.max(1, Math.floor((Date.now() - new Date(u.createdAt).getTime()) / (30 * 24 * 60 * 60 * 1000)));
      const expected = months * monthly;
      const paid = approved.filter((p) => p.userId === u.id).reduce((s, p) => s + (p.amount || 0), 0);
      return {
        id: u.id,
        name: u.name,
        phone: u.phone,
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
  res.json(loadDB().expenses || []);
});

app.post("/api/expenses", requireAuth, (req, res) => {
  if (!isFinanceLeader(req.session.user.role)) return res.status(403).json({ error: "Huna mamlaka" });
  const db = loadDB();
  if (!db.expenses) db.expenses = [];
  const title = sanitizeText(req.body?.title, 160);
  const amount = Number(req.body?.amount) || 0;
  if (!title || amount <= 0) return res.status(400).json({ error: "Weka kichwa na kiasi sahihi" });

  db.expenses.unshift({
    id: Date.now().toString(),
    title,
    amount,
    category: sanitizeText(req.body?.category, 60) || "Nyingine",
    note: sanitizeText(req.body?.note, 300),
    recordedBy: req.session.user.name,
    createdAt: new Date().toISOString()
  });
  logAudit(db, req.session.user, "MATUMIZI_MAPYA", title, `TSh ${amount.toLocaleString()}`);
  saveDB(db);
  res.json({ success: true });
});

app.get("/api/manual-income", requireAuth, (req, res) => {
  if (!isLeader(req.session.user.role)) return res.status(403).json({ error: "Huna mamlaka" });
  res.json(loadDB().manualIncome || []);
});

app.post("/api/manual-income", requireAuth, (req, res) => {
  if (!isFinanceLeader(req.session.user.role)) return res.status(403).json({ error: "Huna mamlaka" });
  const db = loadDB();
  if (!db.manualIncome) db.manualIncome = [];
  const title = sanitizeText(req.body?.title, 160);
  const amount = Number(req.body?.amount) || 0;
  if (!title || amount <= 0) return res.status(400).json({ error: "Weka kichwa na kiasi sahihi" });

  db.manualIncome.unshift({
    id: Date.now().toString(),
    title,
    amount,
    source: sanitizeText(req.body?.source, 80) || "Nyingine",
    note: sanitizeText(req.body?.note, 300),
    recordedBy: req.session.user.name,
    createdAt: new Date().toISOString()
  });
  logAudit(db, req.session.user, "MAPATO_ZIADA", title, `TSh ${amount.toLocaleString()}`);
  saveDB(db);
  res.json({ success: true });
});

// ===== MEMBERS =====
app.get("/api/members", requireAuth, (req, res) => {
  const db = loadDB();
  res.json(
    db.users.map((u) => ({
      id: u.id,
      name: u.name,
      phone: u.phone,
      email: u.email || "",
      region: u.region || "",
      district: u.district || "",
      clan: u.clan || "",
      village: u.village || "",
      status: u.status,
      role: u.role,
      wfcId: u.wfcId,
      profession: u.profession || "",
      paymentProof: u.paymentProof || "",
      createdAt: u.createdAt
    }))
  );
});

app.get("/api/members/:id", requireAuth, (req, res) => {
  const db = loadDB();
  const u = db.users.find((x) => x.id === req.params.id);
  if (!u) return res.status(404).json({ error: "Mwanachama hajapatikana" });

  const payments = (db.payments || []).filter((p) => p.userId === u.id);
  const totalApproved = payments.filter((p) => p.status === "APPROVED").reduce((s, p) => s + (p.amount || 0), 0);
  const attendanceCount = (db.attendance || []).filter((a) => a.userId === u.id).length;
  res.json({
    id: u.id,
    name: u.name,
    phone: u.phone,
    email: u.email || "",
    region: u.region || "",
    district: u.district || "",
    clan: u.clan || "",
    village: u.village || "",
    status: u.status,
    role: u.role,
    wfcId: u.wfcId,
    profession: u.profession || "",
    family: u.family || { head: u.name, spouse: "", children: [] },
    paymentMethod: u.paymentMethod || "",
    paymentProof: u.paymentProof || "",
    createdAt: u.createdAt,
    totalApproved,
    paymentsCount: payments.length,
    attendanceCount,
    recentPayments: payments.slice(-5).reverse()
  });
});

app.post("/api/update-profile", requireAuth, (req, res) => {
  const db = loadDB();
  const u = db.users.find((x) => x.id === req.session.user.id);
  if (!u) return res.status(404).json({ error: "Akaunti haijapatikana" });

  if (req.body.name) u.name = sanitizeText(req.body.name, 120);
  if (req.body.email !== undefined) u.email = sanitizeText(req.body.email, 120);
  if (req.body.region) u.region = sanitizeText(req.body.region, 80);
  if (req.body.district !== undefined) u.district = sanitizeText(req.body.district, 80);
  if (req.body.clan !== undefined) u.clan = sanitizeText(req.body.clan, 80);
  if (req.body.village !== undefined) u.village = sanitizeText(req.body.village, 80);
  if (req.body.profession !== undefined) u.profession = sanitizeText(req.body.profession, 100);

  logAudit(db, req.session.user, "SASISHA_WASIFU", u.phone, u.name);
  saveDB(db);
  res.json({ success: true });
});

app.post("/api/approve-member", requireAuth, (req, res) => {
  if (!isLeader(req.session.user.role)) return res.status(403).json({ error: "Huna mamlaka" });
  const db = loadDB();
  const user = db.users.find((u) => u.id === req.body.userId);
  if (!user) return res.status(404).json({ error: "Hajapatikana" });

  user.status = "ACTIVE";
  if (!user.wfcId) {
    const existingCount = db.users.filter((u) => u.wfcId && u.wfcId.startsWith("WFC-0")).length;
    user.wfcId = "WFC-" + String(existingCount + 101).padStart(4, "0");
  }
  if (!db.notifications) db.notifications = [];
  db.notifications.unshift({
    id: Date.now().toString(),
    userId: user.id,
    title: "Karibu WFC! Uanachama Umeidhinishwa",
    body: `Hongera ${user.name}, akaunti yako imethibitishwa. Namba yako ya WFC ni ${user.wfcId}.`,
    readBy: [],
    createdAt: new Date().toISOString()
  });
  logAudit(db, req.session.user, "IDHINISHA_MWANACHAMA", user.name, `WFC ID: ${user.wfcId}`);
  saveDB(db);
  res.json({ success: true, wfcId: user.wfcId });
});

app.post("/api/suspend-member", requireAuth, (req, res) => {
  if (!isLeader(req.session.user.role)) return res.status(403).json({ error: "Huna mamlaka" });
  const db = loadDB();
  const user = db.users.find((u) => u.id === req.body.userId);
  if (!user) return res.status(404).json({ error: "Mwanachama hajapatikana" });
  if (user.id === "admin-001") return res.status(400).json({ error: "Huwezi kumsimamisha Mwenyekiti Mkuu" });

  user.status = user.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
  logAudit(db, req.session.user, user.status === "SUSPENDED" ? "SIMAMISHA_MWANACHAMA" : "REJESHA_MWANACHAMA", user.name, user.phone);
  saveDB(db);
  res.json({ success: true, status: user.status });
});

app.post("/api/remove-member", requireAuth, (req, res) => {
  if (!["ADMIN", "CHAIRPERSON"].includes(req.session.user.role)) {
    return res.status(403).json({ error: "Admin au Mwenyekiti pekee anaweza kuondoa mwanachama" });
  }
  const db = loadDB();
  const user = db.users.find((u) => u.id === req.body.userId);
  if (!user) return res.status(404).json({ error: "Mwanachama hajapatikana" });
  if (user.id === "admin-001" || user.id === req.session.user.id) {
    return res.status(400).json({ error: "Huwezi kufuta akaunti kuu au akaunti yako mwenyewe" });
  }

  db.users = db.users.filter((u) => u.id !== user.id);
  logAudit(db, req.session.user, "ONDOA_MWANACHAMA", user.name, user.phone);
  saveDB(db);
  res.json({ success: true });
});

// ===== PAYMENTS =====
app.get("/api/payments", requireAuth, (req, res) => {
  const db = loadDB();
  if (isLeader(req.session.user.role)) return res.json(db.payments || []);
  res.json((db.payments || []).filter((p) => p.userId === req.session.user.id));
});

app.post("/api/submit-payment", requireAuth, (req, res) => {
  const type = sanitizeText(req.body?.type, 60) || "Ada ya mwezi";
  const channel = sanitizeText(req.body?.channel, 40) || "M-Pesa";
  const transactionId = sanitizeText(req.body?.transactionId, 80);
  const amount = Number(req.body?.amount) || 0;

  if (!transactionId || amount <= 0) return res.status(400).json({ error: "Weka kiasi na namba sahihi ya muamala" });
  const db = loadDB();
  if (db.payments.find((p) => p.transactionId === transactionId)) {
    return res.status(400).json({ error: "Namba ya muamala tayari imetumika" });
  }

  db.payments.unshift({
    id: Date.now().toString(),
    userId: req.session.user.id,
    userName: req.session.user.name,
    type,
    channel,
    amount,
    transactionId,
    status: "PENDING",
    createdAt: new Date().toISOString()
  });
  logAudit(db, req.session.user, "WASILISHA_MALIPO", transactionId, `${type} - TSh ${amount.toLocaleString()}`);
  saveDB(db);
  res.json({ success: true });
});

app.post("/api/approve-payment", requireAuth, (req, res) => {
  if (!isFinanceLeader(req.session.user.role)) return res.status(403).json({ error: "Huna mamlaka" });
  const db = loadDB();
  const p = db.payments.find((x) => x.id === req.body.paymentId);
  if (!p) return res.status(404).json({ error: "Malipo hayajapatikana" });

  p.status = "APPROVED";
  p.approvedAt = new Date().toISOString();
  p.approvedBy = req.session.user.name;
  p.receiptNo = "RCP-" + Date.now().toString().slice(-6);

  if (!db.notifications) db.notifications = [];
  db.notifications.unshift({
    id: (Date.now() + 1).toString(),
    userId: p.userId,
    title: "Malipo Yameidhinishwa (" + p.receiptNo + ")",
    body: `Malipo yako ya ${p.type} (TSh ${Number(p.amount).toLocaleString()}) yameidhinishwa. Pakua risiti yako kwenye sehemu ya Michango.`,
    readBy: [],
    createdAt: new Date().toISOString()
  });
  logAudit(db, req.session.user, "IDHINISHA_MALIPO", p.receiptNo, `${p.userName} - TSh ${p.amount.toLocaleString()}`);
  saveDB(db);
  res.json({ success: true, receiptNo: p.receiptNo });
});

app.post("/api/reject-payment", requireAuth, (req, res) => {
  if (!isFinanceLeader(req.session.user.role)) return res.status(403).json({ error: "Huna mamlaka" });
  const db = loadDB();
  const p = db.payments.find((x) => x.id === req.body.paymentId);
  if (!p) return res.status(404).json({ error: "Malipo hayajapatikana" });

  p.status = "REJECTED";
  p.rejectReason = sanitizeText(req.body.reason, 200) || "Muamala haujathibitika";
  logAudit(db, req.session.user, "KATAA_MALIPO", p.transactionId, p.rejectReason);
  saveDB(db);
  res.json({ success: true });
});

// ===== EVENTS & TICKETS =====
app.get("/api/events", requireAuth, (req, res) => res.json(loadDB().events || []));

app.post("/api/events", requireAuth, (req, res) => {
  const db = loadDB();
  if (!db.events) db.events = [];
  const title = sanitizeText(req.body?.title, 160);
  if (!title) return res.status(400).json({ error: "Weka kichwa cha tukio" });

  db.events.unshift({
    id: Date.now().toString(),
    type: sanitizeText(req.body?.type, 60) || "Tukio",
    title,
    location: sanitizeText(req.body?.location, 160),
    eventDate: sanitizeText(req.body?.eventDate, 40),
    ticketPrice: Number(req.body?.ticketPrice) || 0,
    poster: req.body?.poster || "",
    raisedAmount: 0,
    status: "ACTIVE",
    public: true,
    reportedBy: req.session.user.name,
    createdAt: new Date().toISOString()
  });
  logAudit(db, req.session.user, "TUKIO_JIPYA", title, req.body?.location || "");
  saveDB(db);
  res.json({ success: true });
});

app.get("/api/tickets", requireAuth, (req, res) => {
  if (!isLeader(req.session.user.role)) return res.status(403).json({ error: "Huna mamlaka" });
  res.json(loadDB().tickets || []);
});

app.post("/api/approve-ticket", requireAuth, (req, res) => {
  if (!isLeader(req.session.user.role)) return res.status(403).json({ error: "Huna mamlaka" });
  const db = loadDB();
  const t = (db.tickets || []).find((x) => x.id === req.body.ticketId);
  if (!t) return res.status(404).json({ error: "Tiketi haijapatikana" });
  t.status = "APPROVED";
  t.approvedAt = new Date().toISOString();
  logAudit(db, req.session.user, "IDHINISHA_TIKETI", t.ticketCode || t.id, t.name);
  saveDB(db);
  res.json({ success: true });
});

// ===== ANNOUNCEMENTS & PUBLIC CONTACTS =====
app.get("/api/announcements", requireAuth, (req, res) => res.json(loadDB().announcements || []));

app.post("/api/announcements", requireAuth, (req, res) => {
  if (!isLeader(req.session.user.role)) return res.status(403).json({ error: "Huna mamlaka" });
  const db = loadDB();
  if (!db.announcements) db.announcements = [];
  const title = sanitizeText(req.body?.title, 160);
  const body = sanitizeText(req.body?.body, 1500);
  if (!title || !body) return res.status(400).json({ error: "Jaza kichwa na ujumbe" });

  db.announcements.unshift({
    id: Date.now().toString(),
    title,
    body,
    link: sanitizeText(req.body?.link, 250),
    author: req.session.user.name,
    createdAt: new Date().toISOString()
  });
  logAudit(db, req.session.user, "TANGAZO_JIPYA", title, "");
  saveDB(db);
  res.json({ success: true });
});

app.get("/api/contacts", requireAuth, (req, res) => {
  if (!isLeader(req.session.user.role)) return res.status(403).json({ error: "Huna mamlaka" });
  res.json(loadDB().contacts || []);
});

app.post("/api/contacts/:id/reply", requireAuth, (req, res) => {
  if (!isLeader(req.session.user.role)) return res.status(403).json({ error: "Huna mamlaka" });
  const db = loadDB();
  const c = (db.contacts || []).find((x) => x.id === req.params.id);
  if (!c) return res.status(404).json({ error: "Ujumbe haujapatikana" });
  c.status = "RESOLVED";
  c.replyNote = sanitizeText(req.body?.replyNote, 500) || "Imeshughulikiwa";
  saveDB(db);
  res.json({ success: true });
});

// ===== FAMILY, DIRECTORY, SUPPORT =====
app.get("/api/family", requireAuth, (req, res) => {
  const db = loadDB();
  const u = db.users.find((x) => x.id === req.session.user.id);
  res.json(u?.family || {});
});

app.post("/api/family", requireAuth, (req, res) => {
  const db = loadDB();
  const u = db.users.find((x) => x.id === req.session.user.id);
  if (!u) return res.status(404).json({ error: "Hajapatikana" });
  u.family = {
    head: sanitizeText(req.body?.head, 120),
    spouse: sanitizeText(req.body?.spouse, 120),
    children: Array.isArray(req.body?.children) ? req.body.children.map((c) => sanitizeText(c, 80)) : []
  };
  saveDB(db);
  res.json({ success: true });
});

app.get("/api/directory", requireAuth, (req, res) => {
  const db = loadDB();
  res.json(
    db.users
      .filter((u) => u.status === "ACTIVE" && u.profession)
      .map((u) => ({
        name: u.name,
        phone: u.phone,
        profession: u.profession,
        clan: u.clan || "",
        region: u.region || ""
      }))
  );
});

app.post("/api/my-profession", requireAuth, (req, res) => {
  const db = loadDB();
  const u = db.users.find((x) => x.id === req.session.user.id);
  if (u) u.profession = sanitizeText(req.body?.profession, 100);
  saveDB(db);
  res.json({ success: true });
});

app.get("/api/support", requireAuth, (req, res) => {
  const db = loadDB();
  const list = (db.supportTickets || []).filter(
    (t) => t.userId === req.session.user.id || isLeader(req.session.user.role)
  );
  res.json(list);
});

app.post("/api/support", requireAuth, (req, res) => {
  const db = loadDB();
  if (!db.supportTickets) db.supportTickets = [];
  const subject = sanitizeText(req.body?.subject, 160);
  const message = sanitizeText(req.body?.message, 1500);
  if (!subject || !message) return res.status(400).json({ error: "Jaza mada na ujumbe" });

  db.supportTickets.unshift({
    id: Date.now().toString(),
    userId: req.session.user.id,
    userName: req.session.user.name,
    subject,
    message,
    reply: "",
    status: "OPEN",
    createdAt: new Date().toISOString()
  });
  saveDB(db);
  res.json({ success: true });
});

app.post("/api/support/:id/reply", requireAuth, (req, res) => {
  if (!isLeader(req.session.user.role)) return res.status(403).json({ error: "Huna mamlaka" });
  const db = loadDB();
  const t = (db.supportTickets || []).find((x) => x.id === req.params.id);
  if (!t) return res.status(404).json({ error: "Tiketi haijapatikana" });
  t.reply = sanitizeText(req.body?.reply, 1000);
  t.status = "RESOLVED";
  t.repliedBy = req.session.user.name;
  saveDB(db);
  res.json({ success: true });
});

// ===== OPERATIONS MODULES =====
app.get("/api/my-debt", requireAuth, (req, res) => {
  const db = loadDB();
  const user = db.users.find((u) => u.id === req.session.user.id);
  if (!user || user.status !== "ACTIVE") return res.json({ debt: 0, expected: 0, paid: 0, months: 0 });
  const monthly = db.settings.monthlyFee || 10000;
  const monthsSince = Math.max(1, Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (30 * 24 * 60 * 60 * 1000)));
  const expected = monthsSince * monthly;
  const paid = db.payments
    .filter((p) => p.userId === user.id && p.type === "Ada ya mwezi" && p.status === "APPROVED")
    .reduce((s, p) => s + (p.amount || 0), 0);
  res.json({ debt: Math.max(0, expected - paid), expected, paid, months: monthsSince });
});

app.get("/api/attendance", requireAuth, (req, res) => res.json(loadDB().attendance || []));
app.post("/api/attendance", requireAuth, (req, res) => {
  const db = loadDB();
  if (!db.attendance) db.attendance = [];
  db.attendance.unshift({
    id: Date.now().toString(),
    userId: req.session.user.id,
    userName: req.session.user.name,
    meeting: sanitizeText(req.body?.meeting, 120) || "Mkutano Mkuu",
    date: new Date().toISOString()
  });
  saveDB(db);
  res.json({ success: true });
});

app.get("/api/attendance-report", requireAuth, (req, res) => {
  const db = loadDB();
  const byUser = {};
  (db.attendance || []).forEach((a) => {
    if (!byUser[a.userId]) byUser[a.userId] = { name: a.userName, count: 0 };
    byUser[a.userId].count++;
  });
  res.json(Object.values(byUser));
});

// Elections
app.get("/api/elections", requireAuth, (req, res) => res.json(loadDB().elections || []));
app.post("/api/elections", requireAuth, (req, res) => {
  if (!isLeader(req.session.user.role)) return res.status(403).json({ error: "Huna mamlaka" });
  const db = loadDB();
  if (!db.elections) db.elections = [];
  const position = sanitizeText(req.body?.position, 120);
  if (!position) return res.status(400).json({ error: "Weka nafasi ya uchaguzi" });
  db.elections.unshift({
    id: Date.now().toString(),
    position,
    candidates: [],
    votes: [],
    status: "OPEN",
    createdAt: new Date().toISOString()
  });
  logAudit(db, req.session.user, "FUNGUA_UCHAGUZI", position, "");
  saveDB(db);
  res.json({ success: true });
});

app.post("/api/elections/nominate", requireAuth, (req, res) => {
  const db = loadDB();
  const e = (db.elections || []).find((x) => x.id === req.body.electionId);
  if (!e) return res.status(404).json({ error: "Uchaguzi haujapatikana" });
  if (e.status !== "OPEN") return res.status(400).json({ error: "Uchaguzi umefungwa" });
  const name = sanitizeText(req.body?.name, 120);
  if (!name) return res.status(400).json({ error: "Weka jina la mgombea" });
  e.candidates.push({ name, manifesto: sanitizeText(req.body?.manifesto, 400) });
  saveDB(db);
  res.json({ success: true });
});

app.post("/api/elections/vote", requireAuth, (req, res) => {
  const db = loadDB();
  const e = (db.elections || []).find((x) => x.id === req.body.electionId);
  if (!e) return res.status(404).json({ error: "Uchaguzi haujapatikana" });
  if (e.status !== "OPEN") return res.status(400).json({ error: "Uchaguzi umefungwa" });
  if (e.votes.find((v) => v.userId === req.session.user.id)) return res.status(400).json({ error: "Tayari umeshapiga kura" });
  e.votes.push({ userId: req.session.user.id, candidate: sanitizeText(req.body?.candidate, 120), votedAt: new Date().toISOString() });
  saveDB(db);
  res.json({ success: true });
});

app.post("/api/elections/:id/close", requireAuth, (req, res) => {
  if (!isLeader(req.session.user.role)) return res.status(403).json({ error: "Huna mamlaka" });
  const db = loadDB();
  const e = (db.elections || []).find((x) => x.id === req.params.id);
  if (!e) return res.status(404).json({ error: "Haijapatikana" });
  e.status = "CLOSED";
  saveDB(db);
  res.json({ success: true });
});

app.get("/api/elections/:id/results", requireAuth, (req, res) => {
  const db = loadDB();
  const e = (db.elections || []).find((x) => x.id === req.params.id);
  if (!e) return res.status(404).json({ error: "Haijapatikana" });
  const counts = {};
  e.candidates.forEach((c) => { counts[c.name] = 0; });
  e.votes.forEach((v) => { counts[v.candidate] = (counts[v.candidate] || 0) + 1; });
  res.json({ position: e.position, status: e.status, results: counts, total: e.votes.length });
});

// Cases
app.get("/api/cases", requireAuth, (req, res) => res.json(loadDB().cases || []));
app.post("/api/cases", requireAuth, (req, res) => {
  const db = loadDB();
  if (!db.cases) db.cases = [];
  db.cases.unshift({
    id: Date.now().toString(),
    title: sanitizeText(req.body?.title, 160),
    description: sanitizeText(req.body?.description, 1000),
    reportedBy: req.session.user.name,
    status: "OPEN",
    createdAt: new Date().toISOString()
  });
  saveDB(db);
  res.json({ success: true });
});
app.post("/api/cases/:id/status", requireAuth, (req, res) => {
  if (!isLeader(req.session.user.role)) return res.status(403).json({ error: "Huna mamlaka" });
  const db = loadDB();
  const c = (db.cases || []).find((x) => x.id === req.params.id);
  if (!c) return res.status(404).json({ error: "Haijapatikana" });
  c.status = sanitizeText(req.body?.status, 40) || "RESOLVED";
  saveDB(db);
  res.json({ success: true });
});

// SACCOS
app.get("/api/saccos", requireAuth, (req, res) => res.json(loadDB().saccos || { shares: [], savings: [], loans: [] }));
app.post("/api/saccos/shares", requireAuth, (req, res) => {
  const db = loadDB();
  if (!db.saccos) db.saccos = { shares: [], savings: [], loans: [] };
  const amount = Number(req.body?.amount) || 0;
  if (amount <= 0) return res.status(400).json({ error: "Weka kiasi sahihi" });
  db.saccos.shares.unshift({
    id: Date.now().toString(),
    userId: req.session.user.id,
    userName: req.session.user.name,
    amount,
    date: new Date().toISOString()
  });
  saveDB(db);
  res.json({ success: true });
});
app.post("/api/saccos/savings", requireAuth, (req, res) => {
  const db = loadDB();
  if (!db.saccos) db.saccos = { shares: [], savings: [], loans: [] };
  if (!db.saccos.savings) db.saccos.savings = [];
  const amount = Number(req.body?.amount) || 0;
  if (amount <= 0) return res.status(400).json({ error: "Weka kiasi sahihi" });
  db.saccos.savings.unshift({
    id: Date.now().toString(),
    userId: req.session.user.id,
    userName: req.session.user.name,
    amount,
    date: new Date().toISOString()
  });
  saveDB(db);
  res.json({ success: true });
});
app.post("/api/saccos/loans", requireAuth, (req, res) => {
  const db = loadDB();
  if (!db.saccos) db.saccos = { shares: [], savings: [], loans: [] };
  const amount = Number(req.body?.amount) || 0;
  if (amount <= 0) return res.status(400).json({ error: "Weka kiasi cha mkopo" });
  db.saccos.loans.unshift({
    id: Date.now().toString(),
    userId: req.session.user.id,
    userName: req.session.user.name,
    amount,
    purpose: sanitizeText(req.body?.purpose, 200),
    status: "PENDING",
    createdAt: new Date().toISOString()
  });
  saveDB(db);
  res.json({ success: true });
});
app.post("/api/saccos/loans/:id/status", requireAuth, (req, res) => {
  if (!isFinanceLeader(req.session.user.role)) return res.status(403).json({ error: "Huna mamlaka" });
  const db = loadDB();
  const loan = (db.saccos?.loans || []).find((l) => l.id === req.params.id);
  if (!loan) return res.status(404).json({ error: "Mkopo haujapatikana" });
  loan.status = sanitizeText(req.body?.status, 30) || "APPROVED";
  saveDB(db);
  res.json({ success: true });
});

// Assets, Projects, Penalties, Documents
app.get("/api/assets", requireAuth, (req, res) => res.json(loadDB().assets || []));
app.post("/api/assets", requireAuth, (req, res) => {
  if (!isLeader(req.session.user.role)) return res.status(403).json({ error: "Huna mamlaka" });
  const db = loadDB();
  if (!db.assets) db.assets = [];
  db.assets.unshift({
    id: Date.now().toString(),
    name: sanitizeText(req.body?.name, 140),
    value: Number(req.body?.value) || 0,
    location: sanitizeText(req.body?.location, 140),
    createdAt: new Date().toISOString()
  });
  saveDB(db);
  res.json({ success: true });
});

app.get("/api/projects", requireAuth, (req, res) => res.json(loadDB().projects || []));
app.post("/api/projects", requireAuth, (req, res) => {
  const db = loadDB();
  if (!db.projects) db.projects = [];
  db.projects.unshift({
    id: Date.now().toString(),
    name: sanitizeText(req.body?.name, 160),
    budget: Number(req.body?.budget) || 0,
    progress: Math.max(0, Math.min(100, Number(req.body?.progress) || 0)),
    lead: req.session.user.name,
    tasks: [],
    createdAt: new Date().toISOString()
  });
  saveDB(db);
  res.json({ success: true });
});
app.post("/api/projects/:id/progress", requireAuth, (req, res) => {
  const db = loadDB();
  const pr = (db.projects || []).find((x) => x.id === req.params.id);
  if (!pr) return res.status(404).json({ error: "Mradi haujapatikana" });
  pr.progress = Math.max(0, Math.min(100, Number(req.body?.progress) || 0));
  saveDB(db);
  res.json({ success: true });
});

app.get("/api/penalties", requireAuth, (req, res) => res.json(loadDB().penalties || []));
app.post("/api/penalties", requireAuth, (req, res) => {
  if (!isLeader(req.session.user.role)) return res.status(403).json({ error: "Huna mamlaka" });
  const db = loadDB();
  if (!db.penalties) db.penalties = [];
  db.penalties.unshift({
    id: Date.now().toString(),
    memberName: sanitizeText(req.body?.memberName, 120) || "Mwanachama",
    reason: sanitizeText(req.body?.reason, 200),
    amount: Number(req.body?.amount) || 0,
    status: "UNPAID",
    createdAt: new Date().toISOString()
  });
  saveDB(db);
  res.json({ success: true });
});
app.post("/api/penalties/:id/pay", requireAuth, (req, res) => {
  if (!isLeader(req.session.user.role)) return res.status(403).json({ error: "Huna mamlaka" });
  const db = loadDB();
  const pen = (db.penalties || []).find((x) => x.id === req.params.id);
  if (!pen) return res.status(404).json({ error: "Haijapatikana" });
  pen.status = "PAID";
  saveDB(db);
  res.json({ success: true });
});

app.get("/api/documents", requireAuth, (req, res) => res.json(loadDB().documents || []));
app.post("/api/documents", requireAuth, (req, res) => {
  if (!isLeader(req.session.user.role)) return res.status(403).json({ error: "Huna mamlaka" });
  const db = loadDB();
  if (!db.documents) db.documents = [];
  db.documents.unshift({
    id: Date.now().toString(),
    title: sanitizeText(req.body?.title, 160),
    category: sanitizeText(req.body?.category, 60) || "Nyaraka",
    summary: sanitizeText(req.body?.summary, 400),
    url: sanitizeText(req.body?.url, 300) || "#",
    createdAt: new Date().toISOString()
  });
  saveDB(db);
  res.json({ success: true });
});

// Notifications
app.get("/api/notifications", requireAuth, (req, res) => {
  const db = loadDB();
  const uid = req.session.user.id;
  const list = (db.notifications || [])
    .filter((n) => n.userId === uid || n.userId === "all")
    .slice(0, 40)
    .map((n) => ({ ...n, isRead: (n.readBy || []).includes(uid) }));
  res.json(list);
});

app.post("/api/notifications", requireAuth, (req, res) => {
  if (!isLeader(req.session.user.role)) return res.status(403).json({ error: "Huna mamlaka" });
  const db = loadDB();
  if (!db.notifications) db.notifications = [];
  db.notifications.unshift({
    id: Date.now().toString(),
    userId: req.body.userId || "all",
    title: sanitizeText(req.body?.title, 160),
    body: sanitizeText(req.body?.body, 1000),
    readBy: [],
    createdAt: new Date().toISOString()
  });
  saveDB(db);
  res.json({ success: true });
});

app.post("/api/notifications/read", requireAuth, (req, res) => {
  const db = loadDB();
  const uid = req.session.user.id;
  (db.notifications || []).forEach((n) => {
    if (n.userId === uid || n.userId === "all") {
      if (!n.readBy) n.readBy = [];
      if (!n.readBy.includes(uid)) n.readBy.push(uid);
    }
  });
  saveDB(db);
  res.json({ success: true });
});

// Dispatch & STK
app.post("/api/dispatch", requireAuth, async (req, res) => {
  const db = loadDB();
  const { channel, to, title, body } = req.body || {};
  const message = `${title || "WFC"}\n${body || ""}`;
  let status = "queued";
  let detail = "Imehifadhiwa kwenye kumbukumbu";
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
      const r = await fetch(`https://graph.facebook.com/v21.0/${db.settings.whatsappPhoneId}/messages`, {
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
      });
      detail = (await r.text()).slice(0, 280);
      status = r.ok ? "sent" : "failed";
    } else if (channel === "sms") {
      detail = "Weka Africa's Talking username na API key kwenye Mipangilio.";
    } else if (channel === "whatsapp") {
      detail = "WhatsApp imefunguliwa moja kwa moja.";
    } else if (channel === "email") {
      detail = "Barua pepe imefunguliwa kwenye kifaa.";
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
  saveDB(db);
  res.json({ success: true, status, detail });
});

app.get("/api/outbox", requireAuth, (req, res) => res.json(loadDB().outbox || []));

app.post("/api/stk", requireAuth, async (req, res) => {
  const db = loadDB();
  const { phone, amount } = req.body || {};
  if (!db.settings.momoConsumerKey || !db.settings.momoConsumerSecret) {
    return res.json({
      ok: false,
      detail: "M-Pesa Daraja haijaunganishwa bado. Lipa kwa namba rasmi za WFC kisha wasilisha namba ya muamala."
    });
  }
  const auth = Buffer.from(`${db.settings.momoConsumerKey}:${db.settings.momoConsumerSecret}`).toString("base64");
  const tokenRes = await fetch("https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials", {
    headers: { Authorization: `Basic ${auth}` }
  });
  const text = await tokenRes.text();
  res.json({
    ok: tokenRes.ok,
    detail: tokenRes.ok ? `Token imepatikana. Ombi la STK kwa ${phone}, TSh ${amount}.` : text.slice(0, 280)
  });
});

// History & Audit Trail Module
app.get("/api/history", requireAuth, (req, res) => {
  const db = loadDB();
  const uid = req.session.user.id;
  const leader = isLeader(req.session.user.role);
  const audits = (db.auditLogs || []).filter((a) => leader || a.actorId === uid).slice(0, 120);
  const myPayments = (db.payments || []).filter((p) => leader || p.userId === uid).slice(0, 80);
  res.json({ audits, payments: myPayments });
});

// Analytics
app.get("/api/analytics", requireAuth, (req, res) => {
  const db = loadDB();
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
      types[p.type] = (types[p.type] || 0) + (p.amount || 0);
    });
  const clans = {};
  db.users
    .filter((u) => u.status === "ACTIVE" && u.clan)
    .forEach((u) => {
      clans[u.clan] = (clans[u.clan] || 0) + 1;
    });
  res.json({
    regions: Object.entries(regions).map(([name, value]) => ({ name, value })),
    types: Object.entries(types).map(([name, value]) => ({ name, value })),
    clans: Object.entries(clans).map(([name, value]) => ({ name, value }))
  });
});

// Server-side CSV/Excel Export
app.get("/api/export/:type", requireAuth, (req, res) => {
  const db = loadDB();
  const type = req.params.type;
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  let rows = [];
  let filename = `wfc-${type}.csv`;

  if (type === "members") {
    rows.push(["WFC ID", "Jina", "Simu", "Barua Pepe", "Kanda", "Wilaya", "Ukoo", "Taaluma", "Wadhifa", "Hali"]);
    (db.users || []).forEach((u) =>
      rows.push([u.wfcId || "-", u.name, u.phone, u.email || "", u.region, u.district || "", u.clan || "", u.profession || "", u.role, u.status])
    );
  } else if (type === "payments") {
    rows.push(["Risiti", "Mwanachama", "Aina", "Njia", "Kiasi (TZS)", "Muamala", "Hali", "Tarehe"]);
    const list = isLeader(req.session.user.role)
      ? db.payments || []
      : (db.payments || []).filter((p) => p.userId === req.session.user.id);
    list.forEach((p) =>
      rows.push([p.receiptNo || "-", p.userName, p.type, p.channel || "-", p.amount, p.transactionId, p.status, p.createdAt])
    );
  } else if (type === "debts") {
    if (!isLeader(req.session.user.role)) return res.status(403).send("Huna mamlaka");
    const monthly = db.settings.monthlyFee || 10000;
    const approved = (db.payments || []).filter((p) => p.status === "APPROVED" && p.type === "Ada ya mwezi");
    rows.push(["WFC ID", "Jina", "Simu", "Kanda", "Miezi", "Inayotarajiwa (TZS)", "Amelipa (TZS)", "Deni (TZS)"]);
    (db.users || [])
      .filter((u) => u.status === "ACTIVE")
      .forEach((u) => {
        const months = Math.max(1, Math.floor((Date.now() - new Date(u.createdAt).getTime()) / (30 * 24 * 60 * 60 * 1000)));
        const expected = months * monthly;
        const paid = approved.filter((p) => p.userId === u.id).reduce((s, p) => s + (p.amount || 0), 0);
        rows.push([u.wfcId || "-", u.name, u.phone, u.region, months, expected, paid, Math.max(0, expected - paid)]);
      });
  } else {
    rows.push(["Tukio", "Mhusika", "Lengo", "Maelezo", "Muda"]);
    (db.auditLogs || []).forEach((a) => rows.push([a.action, a.actorName, a.target, a.detail, a.createdAt]));
  }

  const csv = "\uFEFF" + rows.map((r) => r.map(esc).join(",")).join("\n");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(csv);
});

// Admin Backup, Settings, Roles, Demo Clear
app.get("/api/backup", requireAuth, (req, res) => {
  if (req.session.user.role !== "ADMIN") return res.status(403).json({ error: "Admin pekee" });
  res.json(loadDB());
});

app.get("/api/roles", requireAuth, (req, res) => {
  res.json(["ADMIN", "CHAIRPERSON", "SECRETARY", "TREASURER", "REGIONAL", "MEMBER"]);
});

app.post("/api/set-role", requireAuth, (req, res) => {
  if (req.session.user.role !== "ADMIN") return res.status(403).json({ error: "Admin pekee" });
  const db = loadDB();
  const u = db.users.find((x) => x.id === req.body.userId);
  if (!u) return res.status(404).json({ error: "Hajapatikana" });
  u.role = req.body.role;
  logAudit(db, req.session.user, "BADILI_WADHIFA", u.name, `Wadhifa mpya: ${u.role}`);
  saveDB(db);
  res.json({ success: true });
});

app.post("/api/settings", requireAuth, (req, res) => {
  if (req.session.user.role !== "ADMIN") return res.status(403).json({ error: "Admin pekee" });
  const db = loadDB();
  const keys = [
    "orgName",
    "slogan",
    "subSlogan",
    "smsUsername",
    "smsKey",
    "whatsappToken",
    "whatsappPhoneId",
    "emailFrom",
    "momoConsumerKey",
    "momoConsumerSecret",
    "momoShortcode",
    "recaptchaSiteKey",
    "recaptchaSecretKey"
  ];
  keys.forEach((k) => {
    if (req.body[k] !== undefined) db.settings[k] = req.body[k];
  });
  ["registrationFee", "entryFee", "monthlyFee", "emergencyFee", "latePenalty"].forEach((k) => {
    if (req.body[k] !== undefined && !isNaN(Number(req.body[k]))) db.settings[k] = Number(req.body[k]);
  });
  logAudit(db, req.session.user, "SASISHA_MIPANGILIO", "Settings", "Mipangilio ya mfumo imehifadhiwa");
  saveDB(db);
  res.json({ success: true });
});

app.post("/api/toggle-2fa", requireAuth, (req, res) => {
  const db = loadDB();
  const u = db.users.find((x) => x.id === req.session.user.id);
  if (!u) return res.status(404).json({ error: "Hajapatikana" });
  u.twoFactor = !u.twoFactor;
  saveDB(db);
  res.json({ twoFactor: !!u.twoFactor });
});

app.post("/api/demo/clear", requireAuth, (req, res) => {
  if (req.session.user.role !== "ADMIN") return res.status(403).json({ error: "Admin pekee" });
  const db = loadDB();
  const demoIds = new Set(db.users.filter((u) => u.demo).map((u) => u.id));
  db.users = db.users.filter((u) => !u.demo);
  ["payments", "events", "announcements", "tickets", "attendance", "expenses", "manualIncome"].forEach((k) => {
    if (Array.isArray(db[k])) db[k] = db[k].filter((x) => !x.demo && !demoIds.has(x.userId));
  });
  db.settings.demoSeed = false;
  logAudit(db, req.session.user, "ONDOA_DATA_MAJARIBIO", "Demo Data", "Data zote za majaribio zimeondolewa");
  saveDB(db);
  res.json({ success: true });
});

// Catch-all SPA route
app.get("*", (req, res) => res.sendFile(path.join(__dirname, "../public/index.html")));

initDB().then(() => {
  app.listen(PORT, () => console.log(`WFC Portal V6 running on port ${PORT}`));
});
