const fs = require("fs");
const path = require("path");
const { hashPassword } = require("./security");

const DATA_DIR = path.join(__dirname, "../data");
const DATA_FILE = path.join(DATA_DIR, "db.json");

const defaultDB = {
  users: [],
  payments: [],
  events: [],
  tickets: [],
  announcements: [],
  supportTickets: [],
  attendance: [],
  elections: [],
  cases: [],
  saccos: { shares: [], savings: [], loans: [] },
  assets: [],
  projects: [],
  penalties: [],
  documents: [],
  notifications: [],
  expenses: [],
  manualIncome: [],
  contacts: [],
  outbox: [],
  auditLogs: [],
  otps: [],
  resetTokens: [],
  settings: {
    orgName: "WACHAGGA FAMILY COMMUNITY",
    slogan: "Stand up, it's not over.",
    subSlogan: "Umoja wa Wachagga, Nguvu ya Familia",
    registrationFee: 1000,
    entryFee: 50000,
    monthlyFee: 10000,
    emergencyFee: 60000,
    latePenalty: 2000,
    smsUsername: process.env.AT_USERNAME || "",
    smsKey: process.env.AT_API_KEY || "",
    whatsappToken: process.env.WHATSAPP_TOKEN || "",
    whatsappPhoneId: process.env.WHATSAPP_PHONE_ID || "",
    momoConsumerKey: process.env.MOMO_CONSUMER_KEY || "",
    momoConsumerSecret: process.env.MOMO_CONSUMER_SECRET || "",
    momoShortcode: process.env.MOMO_SHORTCODE || "",
    recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY || "",
    recaptchaSecretKey: process.env.RECAPTCHA_SECRET_KEY || "",
    paymentNumbers: {
      mpesa: "0755 000 888",
      tigo: "0715 000 888",
      airtel: "0785 000 888",
      crdb: "0150889944200"
    }
  }
};

function cloneDefault() {
  return JSON.parse(JSON.stringify(defaultDB));
}

let memoryDB = null;
let pgPool = null;
let persistTimer = null;

function ensureSeedData(db) {
  let changed = false;
  if (!db.settings) { db.settings = cloneDefault().settings; changed = true; }
  if (!db.settings.paymentNumbers) { db.settings.paymentNumbers = cloneDefault().settings.paymentNumbers; changed = true; }
  if (!db.saccos) { db.saccos = { shares: [], savings: [], loans: [] }; changed = true; }
  if (!db.saccos.savings) { db.saccos.savings = []; changed = true; }
  if (!db.auditLogs) { db.auditLogs = []; changed = true; }
  if (!db.contacts) { db.contacts = []; changed = true; }
  if (!db.documents) { db.documents = []; changed = true; }

  // Ensure default Admin (Mwenyekiti)
  if (!db.users.find(u => u.phone === "0700000000")) {
    db.users.push({
      id: "admin-001",
      name: "Mwenyekiti WFC",
      phone: "0700000000",
      email: "mwenyekiti@wfc.or.tz",
      region: "Dar es Salaam",
      district: "Kinondoni",
      clan: "Mushi",
      village: "Machame",
      password: hashPassword("admin123"),
      role: "ADMIN",
      status: "ACTIVE",
      wfcId: "WFC-ADMIN",
      family: { head: "Mwenyekiti WFC", spouse: "", children: [] },
      profession: "Kiongozi Mkuu",
      createdAt: new Date().toISOString()
    });
    changed = true;
  }

  // Seed initial Constitution / Core Documents if empty
  if (db.documents.length === 0) {
    db.documents.push(
      {
        id: "doc-katiba-01",
        title: "Katiba ya Wachagga Family Community (WFC)",
        category: "Katiba & Sheria",
        summary: "Katiba kuu inayoongoza uanachama, haki, wajibu, uongozi, na misingi ya umoja wa WFC.",
        url: "/#kuhusu",
        createdAt: new Date().toISOString()
      },
      {
        id: "doc-fedha-02",
        title: "Kanuni za Fedha, Ada na Mifuko ya Dharura",
        category: "Fedha & SACCOS",
        summary: "Mwongozo wa ada ya usajili (TSh 1,000), kiingilio (TSh 50,000), ada ya mwezi (TSh 10,000), na mfuko wa dharura (TSh 60,000).",
        url: "/app",
        createdAt: new Date().toISOString()
      }
    );
    changed = true;
  }

  if (db.settings && db.settings.demoSeed === false) return changed;

  const ago = (days) => new Date(Date.now() - days * 86400000).toISOString();
  const people = [
    { id: "demo-amina", name: "Amina Swai", phone: "0711000001", email: "amina.swai@example.com", region: "Dar es Salaam", district: "Ilala", clan: "Swai", village: "Uru", password: hashPassword("demo123"), role: "MEMBER", status: "ACTIVE", wfcId: "WFC-0145", profession: "Muuguzi Mkuu", family: { head: "Amina Swai", spouse: "Godson Swai", children: ["Nuru", "Eli"] }, createdAt: ago(140) },
    { id: "demo-john", name: "John Mushi", phone: "0711000002", email: "john.mushi@example.com", region: "Moshi", district: "Moshi Mjini", clan: "Mushi", village: "Kibosho", password: hashPassword("demo123"), role: "TREASURER", status: "ACTIVE", wfcId: "WFC-0088", profession: "Mhasibu (CPA)", family: { head: "John Mushi", spouse: "Grace Mushi", children: ["Kelvin"] }, createdAt: ago(400) },
    { id: "demo-neema", name: "Neema Lyimo", phone: "0711000003", email: "neema.lyimo@example.com", region: "Arusha", district: "Arusha Mjini", clan: "Lyimo", village: "Marangu", password: hashPassword("demo123"), role: "MEMBER", status: "PENDING", wfcId: null, profession: "Mhandisi", family: { head: "Neema Lyimo", spouse: "", children: [] }, createdAt: ago(3) },
    { id: "demo-baraka", name: "Baraka Kimaro", phone: "0711000004", email: "baraka.kimaro@example.com", region: "Kilimanjaro", district: "Rombo", clan: "Kimaro", village: "Mkuu Rombo", password: hashPassword("demo123"), role: "SECRETARY", status: "ACTIVE", wfcId: "WFC-0102", profession: "Mwalimu", family: { head: "Baraka Kimaro", spouse: "Aika", children: ["Imani"] }, createdAt: ago(220) },
    { id: "demo-sarah", name: "Sarah Mrema", phone: "0711000005", email: "sarah.mrema@example.com", region: "Tanga", district: "Tanga Mjini", clan: "Mrema", village: "Kilema", password: hashPassword("demo123"), role: "MEMBER", status: "SUSPENDED", wfcId: "WFC-0119", profession: "Mfanyabiashara", family: { head: "Sarah Mrema", spouse: "", children: [] }, createdAt: ago(300) }
  ];

  people.forEach((p) => {
    if (!db.users.find((u) => u.id === p.id || u.phone === p.phone)) {
      db.users.push({ ...p, demo: true, paymentProof: "MPESA-DEMO-REG" });
      changed = true;
    }
  });

  const extras = {
    payments: [
      { id: "demo-pay-1", userId: "demo-amina", userName: "Amina Swai", type: "Ada ya mwezi", channel: "M-Pesa", amount: 10000, transactionId: "DEMO-MP-1001", status: "APPROVED", receiptNo: "RCP-DEMO1", createdAt: ago(12) },
      { id: "demo-pay-2", userId: "demo-john", userName: "John Mushi", type: "Dharura", channel: "CRDB", amount: 60000, transactionId: "DEMO-MP-1002", status: "APPROVED", receiptNo: "RCP-DEMO2", createdAt: ago(30) },
      { id: "demo-pay-3", userId: "demo-baraka", userName: "Baraka Kimaro", type: "Ada ya mwezi", channel: "Tigo Pesa", amount: 10000, transactionId: "DEMO-MP-1003", status: "PENDING", createdAt: ago(1) }
    ],
    expenses: [
      { id: "demo-exp-1", title: "Kukodi ukumbi wa mkutano", amount: 25000, category: "Matukio", note: "Mkutano mkuu", createdAt: ago(20) },
      { id: "demo-exp-2", title: "Msaada wa msiba", amount: 50000, category: "Misaada", note: "Familia ya Mushi", createdAt: ago(45) }
    ],
    manualIncome: [
      { id: "demo-inc-1", title: "Mchango wa mgeni rasmi", amount: 15000, source: "Mgeni", note: "Festival", createdAt: ago(10) }
    ],
    events: [
      { id: "demo-ev-1", type: "Harusi", title: "Harusi ya Familia Swai", location: "Kibo Hall, Moshi", eventDate: "2026-12-12", ticketPrice: 20000, poster: "", public: true, status: "ACTIVE", raisedAmount: 0, reportedBy: "Ofisi", createdAt: ago(4) },
      { id: "demo-ev-2", type: "Festival", title: "WFC Annual Heritage Festival", location: "Mnazi Mmoja, Dar es Salaam", eventDate: "2026-12-26", ticketPrice: 10000, poster: "", public: true, status: "ACTIVE", raisedAmount: 0, reportedBy: "Ofisi", createdAt: ago(8) }
    ],
    announcements: [
      { id: "demo-an-1", title: "Mkutano Mkuu wa WFC Mwezi Huu", body: "Wanachama wote hai wanakutana kujadili maendeleo, SACCOS na miradi ya jumuiya.", link: "/#matukio", author: "Katibu", createdAt: ago(1) },
      { id: "demo-an-2", title: "Kukamilisha Ada ya Mwezi", body: "Ada ya mwezi ni TSh 10,000. Wasilisha namba ya muamala kupitia portal kupata risiti ya QR.", link: "/app", author: "Mhazini", createdAt: ago(2) },
      { id: "demo-an-3", title: "Jiunge na Directory ya Taaluma", body: "Sasisha taaluma na ukoo wako ili kuimarisha mtandao wa wanachama.", link: "/app", author: "Ofisi", createdAt: ago(6) }
    ]
  };

  Object.entries(extras).forEach(([key, rows]) => {
    if (!db[key]) db[key] = [];
    rows.forEach((row) => {
      if (!db[key].find((x) => x.id === row.id)) {
        db[key].push({ ...row, demo: true });
        changed = true;
      }
    });
  });

  return changed;
}

async function initDB() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  if (process.env.DATABASE_URL) {
    try {
      const { Pool } = require("pg");
      const ssl = process.env.PGSSLMODE === "disable" ? false : { rejectUnauthorized: false };
      pgPool = new Pool({ connectionString: process.env.DATABASE_URL, ssl });
      await pgPool.query(`
        CREATE TABLE IF NOT EXISTS wfc_kv_store (
          store_key VARCHAR(64) PRIMARY KEY,
          payload JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      const res = await pgPool.query("SELECT payload FROM wfc_kv_store WHERE store_key = 'main'");
      if (res.rows.length > 0 && res.rows[0].payload) {
        memoryDB = res.rows[0].payload;
      } else if (fs.existsSync(DATA_FILE)) {
        memoryDB = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
      } else {
        memoryDB = cloneDefault();
      }
      const changed = ensureSeedData(memoryDB);
      if (changed || res.rows.length === 0) {
        await flushPostgres(memoryDB);
      }
      console.log("[WFC DB] Connected to PostgreSQL.");
      return;
    } catch (err) {
      console.error("[WFC DB] PostgreSQL init error, falling back to JSON:", err.message);
      pgPool = null;
    }
  }

  if (fs.existsSync(DATA_FILE)) {
    try {
      memoryDB = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    } catch {
      memoryDB = cloneDefault();
    }
  } else {
    memoryDB = cloneDefault();
  }
  ensureSeedData(memoryDB);
  writeJsonAtomic(memoryDB);
  console.log("[WFC DB] Running with local JSON store (data/db.json).");
}

function writeJsonAtomic(db) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    const tmp = DATA_FILE + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(db, null, 2), "utf8");
    fs.renameSync(tmp, DATA_FILE);
  } catch (e) {
    console.error("[WFC DB] JSON write error:", e.message);
  }
}

async function flushPostgres(db) {
  if (!pgPool) return;
  try {
    await pgPool.query(
      `INSERT INTO wfc_kv_store (store_key, payload, updated_at)
       VALUES ('main', $1::jsonb, NOW())
       ON CONFLICT (store_key) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()`,
      [JSON.stringify(db)]
    );
  } catch (err) {
    console.error("[WFC DB] PostgreSQL sync error:", err.message);
  }
}

function loadDB() {
  if (!memoryDB) {
    if (fs.existsSync(DATA_FILE)) {
      memoryDB = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    } else {
      memoryDB = cloneDefault();
    }
    ensureSeedData(memoryDB);
  }
  return memoryDB;
}

function saveDB(db) {
  memoryDB = db;
  writeJsonAtomic(db);
  if (pgPool) {
    clearTimeout(persistTimer);
    persistTimer = setTimeout(() => flushPostgres(db), 100);
  }
}

function logAudit(db, actor, action, target = "", detail = "") {
  if (!db.auditLogs) db.auditLogs = [];
  db.auditLogs.unshift({
    id: "AUD-" + Date.now() + "-" + Math.floor(Math.random() * 999),
    actorId: actor?.id || "SYSTEM",
    actorName: actor?.name || "Mfumo",
    action,
    target,
    detail,
    createdAt: new Date().toISOString()
  });
  if (db.auditLogs.length > 500) db.auditLogs.length = 500;
}

function isPostgresActive() {
  return !!pgPool;
}

module.exports = {
  initDB,
  loadDB,
  saveDB,
  logAudit,
  isPostgresActive
};
