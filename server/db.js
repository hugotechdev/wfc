const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const hasPg = Boolean(process.env.DATABASE_URL);
const pool = hasPg
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes("localhost") || process.env.DATABASE_URL.includes("127.0.0.1")
        ? false
        : { rejectUnauthorized: false }
    })
  : null;

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
  outbox: [],
  expenses: [],
  manualIncome: [],
  contacts: [],
  otps: [],
  settings: {
    registrationFee: 1000,
    entryFee: 50000,
    monthlyFee: 10000,
    emergencyFee: 60000,
    latePenalty: 2000,
    penaltyGraceDays: 5,
    autoPenaltyEnabled: false,
    rulesText: "1. Kila mwanachama hai anapaswa kulipa ada ya mwezi (TSh 10,000) kabla ya tarehe 5 ya mwezi husika.\n2. Kuchelewa kulipa ada kunatozwa faini iliyowekwa na uongozi.\n3. Michango ya dharura na misiba inawasilishwa ndani ya muda uliotangazwa na ofisi.",
    paymentNumbers: {
      mpesa: "0755 000 888",
      tigo: "0715 000 888",
      airtel: "0785 000 888",
      crdb: "0150889944200"
    }
  }
};

let stateCache = null;
let writeQueue = Promise.resolve();

function isBcryptHash(str) {
  return typeof str === "string" && /^\$2[aby]\$\d{2}\$/.test(str);
}

async function normalizeAndMigrateState(raw) {
  const db = { ...defaultDB, ...(raw || {}) };
  db.settings = {
    ...defaultDB.settings,
    ...(raw && raw.settings ? raw.settings : {}),
    paymentNumbers: {
      ...defaultDB.settings.paymentNumbers,
      ...(raw && raw.settings && raw.settings.paymentNumbers ? raw.settings.paymentNumbers : {})
    }
  };
  if (!db.saccos) db.saccos = { shares: [], savings: [], loans: [] };
  if (!Array.isArray(db.saccos.shares)) db.saccos.shares = [];
  if (!Array.isArray(db.saccos.savings)) db.saccos.savings = [];
  if (!Array.isArray(db.saccos.loans)) db.saccos.loans = [];

  for (const u of db.users) {
    if (u.password && !isBcryptHash(u.password)) {
      u.password = await bcrypt.hash(String(u.password), 10);
    }
  }

  if (!db.users.find((u) => u.phone === "0700000000")) {
    const adminHash = await bcrypt.hash(process.env.ADMIN_INITIAL_PASSWORD || "admin123", 10);
    db.users.push({
      id: "admin-001",
      name: "Mwenyekiti WFC",
      phone: "0700000000",
      region: "Dar es Salaam",
      password: adminHash,
      role: "ADMIN",
      status: "ACTIVE",
      wfcId: "WFC-ADMIN",
      family: { head: "Mwenyekiti WFC", spouse: "", children: [] },
      profession: "Kiongozi",
      createdAt: new Date().toISOString()
    });
  }

  if (db.settings.demoSeed !== false && db.users.length <= 1) {
    const ago = (days) => new Date(Date.now() - days * 86400000).toISOString();
    const demoHash = await bcrypt.hash("demo123", 10);
    const people = [
      { id: "demo-amina", name: "Amina Swai", phone: "0711000001", region: "Dar es Salaam", password: demoHash, role: "MEMBER", status: "ACTIVE", wfcId: "WFC-0145", profession: "Muuguzi", family: { head: "Amina Swai", spouse: "Godson Swai", children: ["Nuru", "Eli"] }, createdAt: ago(140) },
      { id: "demo-john", name: "John Mushi", phone: "0711000002", region: "Moshi", password: demoHash, role: "TREASURER", status: "ACTIVE", wfcId: "WFC-0088", profession: "Mhasibu", family: { head: "John Mushi", spouse: "", children: [] }, createdAt: ago(400) },
      { id: "demo-neema", name: "Neema Lyimo", phone: "0711000003", region: "Arusha", password: demoHash, role: "MEMBER", status: "PENDING", wfcId: null, profession: "", family: { head: "Neema Lyimo", spouse: "", children: [] }, createdAt: ago(3) },
      { id: "demo-baraka", name: "Baraka Kimaro", phone: "0711000004", region: "Kilimanjaro", password: demoHash, role: "SECRETARY", status: "ACTIVE", wfcId: "WFC-0102", profession: "Mwalimu", family: { head: "Baraka Kimaro", spouse: "Aika", children: ["Imani"] }, createdAt: ago(220) },
      { id: "demo-sarah", name: "Sarah Mrema", phone: "0711000005", region: "Tanga", password: demoHash, role: "MEMBER", status: "SUSPENDED", wfcId: "WFC-0119", profession: "Mfanyabiashara", family: { head: "Sarah Mrema", spouse: "", children: [] }, createdAt: ago(300) }
    ];
    people.forEach((p) => {
      if (!db.users.find((u) => u.id === p.id || u.phone === p.phone)) {
        db.users.push({ ...p, demo: true, paymentProof: "DEMO" });
      }
    });

    const extras = {
      payments: [
        { id: "demo-pay-1", userId: "demo-amina", userName: "Amina Swai", type: "Ada ya mwezi", amount: 10000, transactionId: "DEMO-MP-1001", status: "APPROVED", receiptNo: "RCP-DEMO1", createdAt: ago(12) },
        { id: "demo-pay-2", userId: "demo-john", userName: "John Mushi", type: "Dharura", amount: 60000, transactionId: "DEMO-MP-1002", status: "APPROVED", receiptNo: "RCP-DEMO2", createdAt: ago(30) },
        { id: "demo-pay-3", userId: "demo-baraka", userName: "Baraka Kimaro", type: "Ada ya mwezi", amount: 10000, transactionId: "DEMO-MP-1003", status: "PENDING", createdAt: ago(1) }
      ],
      expenses: [
        { id: "demo-exp-1", title: "Kukodi ukumbi", amount: 25000, category: "Matukio", note: "Mkutano mkuu", createdAt: ago(20), demo: true },
        { id: "demo-exp-2", title: "Msaada wa msiba", amount: 50000, category: "Misaada", note: "Familia ya Mushi", createdAt: ago(45), demo: true }
      ],
      manualIncome: [
        { id: "demo-inc-1", title: "Mchango wa mgeni", amount: 15000, source: "Mgeni", note: "Festival", createdAt: ago(10), demo: true }
      ],
      events: [
        { id: "demo-ev-1", type: "Harusi", title: "Harusi ya Familia Swai", location: "Kibo Hall, Moshi", ticketPrice: 20000, poster: "", public: true, status: "ACTIVE", raisedAmount: 0, reportedBy: "Ofisi", createdAt: ago(4) },
        { id: "demo-ev-2", type: "Festival", title: "WFC Festival ya Mwaka", location: "Mnazi Mmoja, Dar es Salaam", ticketPrice: 10000, poster: "", public: true, status: "ACTIVE", raisedAmount: 0, reportedBy: "Ofisi", createdAt: ago(8) }
      ],
      announcements: [
        { id: "demo-an-1", title: "Mkutano mkuu mwezi huu", body: "Wanachama wote hai wanakutana kujadili ada na miradi. Weka tiketi yako mapema.", link: "/#matukio", author: "Katibu", createdAt: ago(1) },
        { id: "demo-an-2", title: "Ada ya mwezi inakamilika", body: "TSh 10,000 kwa kila mwanachama hai. Wasilisha namba ya muamala ndani ya portal.", link: "/app", author: "Mhazini", createdAt: ago(2) },
        { id: "demo-an-3", title: "Jiunge na directory ya taaluma", body: "Weka kazi yako ili wanachama waweze kukutana kwa msaada wa kitaalamu.", link: "/app", author: "Ofisi", createdAt: ago(6) }
      ]
    };
    Object.entries(extras).forEach(([key, rows]) => {
      rows.forEach((row) => {
        if (!db[key].find((x) => x.id === row.id)) db[key].push({ ...row, demo: true });
      });
    });
  }

  return db;
}

async function initDB() {
  if (hasPg) {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wfc_kv_store (
        store_key TEXT PRIMARY KEY,
        payload JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    const res = await pool.query("SELECT payload FROM wfc_kv_store WHERE store_key = $1", ["main"]);
    let raw = res.rows[0] ? res.rows[0].payload : null;

    if (!raw && fs.existsSync(DATA_FILE)) {
      try {
        raw = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
        console.log("Migrated existing data/db.json into PostgreSQL.");
      } catch (e) {
        console.error("Failed reading local db.json during migration:", e.message);
      }
    }

    stateCache = await normalizeAndMigrateState(raw);
    await persistToPg(stateCache);
    console.log("PostgreSQL storage connected & initialized.");
  } else {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    let raw = null;
    if (fs.existsSync(DATA_FILE)) {
      raw = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    }
    stateCache = await normalizeAndMigrateState(raw);
    fs.writeFileSync(DATA_FILE, JSON.stringify(stateCache, null, 2));
    console.log("Local JSON storage active (Set DATABASE_URL for PostgreSQL).");
  }
}

async function persistToPg(db) {
  await pool.query(
    `INSERT INTO wfc_kv_store (store_key, payload, updated_at)
     VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (store_key)
     DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()`,
    ["main", JSON.stringify(db)]
  );
}

function getDB() {
  return stateCache;
}

function saveDB(db) {
  stateCache = db;
  writeQueue = writeQueue
    .then(async () => {
      if (hasPg) {
        await persistToPg(db);
      } else {
        fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
      }
    })
    .catch((err) => {
      console.error("Database persistence error:", err);
    });
  return writeQueue;
}

module.exports = {
  initDB,
  getDB,
  saveDB,
  pool,
  hasPg
};
