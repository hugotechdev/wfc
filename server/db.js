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
  auditLogs: [],
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
  if (!Array.isArray(db.auditLogs)) db.auditLogs = [];

  for (const u of db.users) {
    if (u.password && !isBcryptHash(u.password)) {
      u.password = await bcrypt.hash(String(u.password), 10);
    }
    if (!u.heritage) u.heritage = {};
    if (!Array.isArray(u.memberDocuments)) u.memberDocuments = [];
    if (!Array.isArray(u.historyLogs)) u.historyLogs = [];
  }

  if (!db.users.find((u) => u.phone === "0700000000")) {
    const adminHash = await bcrypt.hash(process.env.ADMIN_INITIAL_PASSWORD || "admin123", 10);
    db.users.push({
      id: "admin-001",
      name: "Mwenyekiti WFC",
      phone: "0700000000",
      email: "admin@wachaggafamily.co.tz",
      gender: "Me",
      dob: "1980-01-01",
      nida: "19800101-11111-00001-12",
      maritalStatus: "Ndoa",
      occupation: "Kiongozi wa Biashara",
      region: "Dar es Salaam",
      password: adminHash,
      role: "ADMIN",
      status: "ACTIVE",
      wfcId: "WFC-ADMIN",
      category: "Founder",
      expiryDate: "2030-12-31",
      heritage: {
        district: "Kinondoni",
        division: "Mbezi Beach",
        ward: "Africana",
        village: "Kilema",
        clan: "Mushi",
        subClan: "Wachagga",
        ancestralArea: "Machame",
        fatherName: "William Mushi",
        grandfatherName: "Mushi Senior",
        placeOfBirth: "Moshi"
      },
      family: { head: "Mwenyekiti WFC", spouse: "", children: [] },
      memberDocuments: [],
      historyLogs: [{ action: "Kuanzishwa kwa akaunti ya Admin V6", date: new Date().toISOString() }],
      createdAt: new Date().toISOString()
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
      } catch (e) {
        console.error("Failed reading local db.json during migration:", e.message);
      }
    }

    stateCache = await normalizeAndMigrateState(raw);
    await persistToPg(stateCache);
    console.log("PostgreSQL storage connected & initialized (WFC V6).");
  } else {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    let raw = null;
    if (fs.existsSync(DATA_FILE)) {
      raw = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    }
    stateCache = await normalizeAndMigrateState(raw);
    fs.writeFileSync(DATA_FILE, JSON.stringify(stateCache, null, 2));
    console.log("Local JSON storage active (WFC V6).");
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
