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

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
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
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Majaribio mengi mno. Subiri dakika 15 kisha jaribu tena." }
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

function isAdmin(role) {
  return role === "ADMIN";
}

async function verifyCaptcha(req, res, next) {
  const token = req.body && req.body.recaptchaToken;
  if (process.env.RECAPTCHA_SECRET && token) {
    try {
      const verifyRes = await fetch("https://www.google.com/recaptcha/api/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ secret: process.env.RECAPTCHA_SECRET, response: token })
      });
      const data = await verifyRes.json();
      if (!data.success) {
        return res.status(400).json({ error: "Uthibitisho wa reCAPTCHA umeshindwa. Jaribu tena." });
      }
    } catch (err) {
      console.error("Captcha error:", err);
    }
  }
  next();
}

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

app.post("/api/register", authLimiter, verifyCaptcha, async (req, res) => {
  const name = cleanStr(req.body && req.body.name, 120);
  const phone = cleanPhone(req.body && req.body.phone);
  const email = cleanStr(req.body && req.body.email, 120);
  const gender = cleanStr(req.body && req.body.gender, 20);
  const dob = cleanStr(req.body && req.body.dob, 20);
  const nida = cleanStr(req.body && req.body.nida, 50);
  const maritalStatus = cleanStr(req.body && req.body.maritalStatus, 30);
  const occupation = cleanStr(req.body && req.body.occupation, 80);
  
  const region = cleanStr(req.body && req.body.region, 60) || "Dar es Salaam";
  const category = cleanStr(req.body && req.body.category, 40) || "Ordinary";
  const password = String((req.body && req.body.password) || "");
  const paymentProof = cleanStr(req.body && req.body.paymentProof, 300);

  const heritage = {
    district: cleanStr(req.body && req.body.district, 60),
    division: cleanStr(req.body && req.body.division, 60),
    ward: cleanStr(req.body && req.body.ward, 60),
    village: cleanStr(req.body && req.body.village, 60),
    clan: cleanStr(req.body && req.body.clan, 60),
    subClan: cleanStr(req.body && req.body.subClan, 60),
    ancestralArea: cleanStr(req.body && req.body.ancestralArea, 60) || "Machame",
    fatherName: cleanStr(req.body && req.body.fatherName, 100),
    grandfatherName: cleanStr(req.body && req.body.grandfatherName, 100),
    placeOfBirth: cleanStr(req.body && req.body.placeOfBirth, 80)
  };

  if (!name || !phone || password.length < 6) {
    return res.status(400).json({ error: "Jaza taarifa muhimu (nenosiri angalau herufi 6)" });
  }

  const db = getDB();
  if (db.users.find((u) => cleanPhone(u.phone) === phone)) {
    return res.status(400).json({ error: "Namba hii ya simu tayari imesajiliwa" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = {
    id: Date.now().toString(),
    name,
    phone,
    email,
    gender,
    dob,
    nida,
    maritalStatus,
    occupation,
    region,
    category,
    password: passwordHash,
    role: "MEMBER",
    status: "PENDING",
    paymentProof,
    wfcId: null,
    expiryDate: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
    heritage,
    family: { head: name, spouse: "", children: [] },
    memberDocuments: [],
    historyLogs: [{ action: "Usajili mpya umewasilishwa", date: new Date().toISOString() }],
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  await saveDB(db);
  res.json({ success: true, message: "Usajili umepokelewa. Subiri idhini ya viongozi." });
});

app.post("/api/login", authLimiter, verifyCaptcha, async (req, res) => {
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

app.post("/api/auth/reset-password", authLimiter, async (req, res) => {
  const phone = cleanPhone(req.body && req.body.phone);
  const newPassword = String(req.body && req.body.newPassword || "");
  if (!phone || newPassword.length < 6) {
    return res.status(400).json({ error: "Weka namba sahihi na nenosiri jipya (angalau herufi 6)" });
  }
  const db = getDB();
  const user = db.users.find((u) => cleanPhone(u.phone) === phone);
  if (!user) return res.status(404).json({ error: "Mwanachama mwenye namba hii hajapatikana" });

  user.password = await bcrypt.hash(newPassword, 10);
  user.historyLogs.unshift({ action: "Nenosiri limerekebishwa kupitia Password Reset", date: new Date().toISOString() });
  await saveDB(db);
  res.json({ success: true, message: "Nenosiri limebadilishwa kikamilifu. Sasa unaweza kuingia." });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

app.get("/api/me", requireAuth, (req, res) => {
  const db = getDB();
  const fresh = db.users.find((u) => u.id === req.session.user.id);
  if (!fresh || fresh.status === "SUSPENDED") {
    req.session.destroy(() => {});
    return res.json({ user: null, isProd });
  }
  res.json({ user: sanitizeUser(fresh), isProd });
});

app.post("/api/profile/update", requireAuth, async (req, res) => {
  const db = getDB();
  const user = db.users.find((u) => u.id === req.session.user.id);
  if (!user) return res.status(404).json({ error: "Akaunti haipatikani" });

  user.name = cleanStr(req.body.name, 120) || user.name;
  user.email = cleanStr(req.body.email, 120) || user.email;
  user.gender = cleanStr(req.body.gender, 20) || user.gender;
  user.dob = cleanStr(req.body.dob, 20) || user.dob;
  user.nida = cleanStr(req.body.nida, 50) || user.nida;
  user.maritalStatus = cleanStr(req.body.maritalStatus, 30) || user.maritalStatus;
  user.occupation = cleanStr(req.body.occupation, 80) || user.occupation;
  user.region = cleanStr(req.body.region, 60) || user.region;

  if (req.body.heritage) {
    user.heritage = {
      district: cleanStr(req.body.heritage.district, 60),
      division: cleanStr(req.body.heritage.division, 60),
      ward: cleanStr(req.body.heritage.ward, 60),
      village: cleanStr(req.body.heritage.village, 60),
      clan: cleanStr(req.body.heritage.clan, 60),
      subClan: cleanStr(req.body.heritage.subClan, 60),
      ancestralArea: cleanStr(req.body.heritage.ancestralArea, 60),
      fatherName: cleanStr(req.body.heritage.fatherName, 100),
      grandfatherName: cleanStr(req.body.heritage.grandfatherName, 100),
      placeOfBirth: cleanStr(req.body.heritage.placeOfBirth, 80)
    };
  }

  if (typeof req.body.profilePhoto === "string" && req.body.profilePhoto.startsWith("data:image/")) {
    user.profilePhoto = req.body.profilePhoto.slice(0, 1500000);
  }

  user.historyLogs.unshift({ action: "Taarifa za wasifu zimesasishwa", date: new Date().toISOString() });
  await saveDB(db);
  res.json({ success: true, user: sanitizeUser(user) });
});

app.post("/api/profile/change-password", requireAuth, async (req, res) => {
  const currentPassword = String(req.body.currentPassword || "");
  const newPassword = String(req.body.newPassword || "");
  if (newPassword.length < 6) return res.status(400).json({ error: "Nenosiri jipya liwe na angalau herufi 6" });

  const db = getDB();
  const user = db.users.find((u) => u.id === req.session.user.id);
  const ok = await bcrypt.compare(currentPassword, user.password);
  if (!ok) return res.status(401).json({ error: "Nenosiri la sasa si sahihi" });

  user.password = await bcrypt.hash(newPassword, 10);
  user.historyLogs.unshift({ action: "Nenosiri limebadilishwa na mtumiaji", date: new Date().toISOString() });
  await saveDB(db);
  res.json({ success: true });
});

app.get("/api/dashboard", requireAuth, (req, res) => {
  const db = getDB();
  const user = db.users.find((u) => u.id === req.session.user.id);
  const leader = isLeader(req.session.user.role);

  const myPayments = db.payments.filter((p) => p.userId === user.id && p.status === "APPROVED");
  const totalPaid = myPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const unreadNoticesCount = (db.notifications || []).filter(
    (n) => (n.userId === user.id || n.userId === "all") && (!n.readBy || !n.readBy.includes(user.id))
  ).length;

  res.json({
    user: sanitizeUser(user),
    stats: {
      members: db.users.filter((u) => u.status === "ACTIVE").length,
      newThisMonth: db.users.filter((u) => u.status === "ACTIVE" && new Date(u.createdAt).getMonth() === new Date().getMonth()).length,
      pending: db.users.filter((u) => u.status === "PENDING").length,
      payments: db.payments.length,
      events: (db.events || []).length,
      unreadNotifications: unreadNoticesCount
    },
    myTotalPaid: totalPaid,
    recent: db.payments.filter((p) => leader || p.userId === user.id).slice(-6).reverse(),
    upcoming: (db.events || []).slice(0, 4),
    regions: Object.entries(
      db.users.filter((u) => u.status === "ACTIVE").reduce((m, u) => {
        m[u.region || "Nyingine"] = (m[u.region || "Nyingine"] || 0) + 1;
        return m;
      }, {})
    ).map(([name, value]) => ({ name, value }))
  });
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
    app.listen(PORT, () => console.log("Wachagga Family Community Portal v6.0 running on port " + PORT));
  })
  .catch((err) => {
    console.error("Fatal DB startup error:", err);
    process.exit(1);
  });
