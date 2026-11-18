const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const hasPg = Boolean(process.env.DATABASE_URL);
const pool = hasPg
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.DATABASE_URL.includes("localhost") ||
        process.env.DATABASE_URL.includes("127.0.0.1")
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
  memberDocuments: [],
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
    rulesText:
      "1. Kila mwanachama hai anapaswa kulipa ada ya mwezi (TSh 10,000) kabla ya tarehe 5 ya mwezi husika.\n2. Kuchelewa kulipa ada kunatozwa faini iliyowekwa na uongozi.\n3. Michango ya dharura na misiba inawasilishwa ndani ya muda uliotangazwa na ofisi.",
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

function defaultExpiryFrom(isoDate) {
  const d = isoDate ? new Date(isoDate) : new Date();
  if (Number.isNaN(d.getTime())) return new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10);
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

function getRoleResponsibilities(role) {
  const map = {
    ADMIN: "Usimamizi mkuu wa mfumo, sera, viwango vya ada na faini, majukumu ya viongozi (RBAC), na usalama wa taarifa za WFC.",
    CHAIRPERSON: "Mwenyekiti wa Jumuiya: Kuongoza vikao vikuu, kuidhinisha wanachama na maamuzi ya kimkakati ya WFC.",
    SECRETARY: "Katibu Mkuu: Kutunza kumbukumbu za vikao, mawasiliano rasmi, nyaraka za wanachama, na matangazo.",
    TREASURER: "Mhazini: Kusimamia mapato, matumizi, michango ya wanachama, risiti za malipo, na taarifa za kifedha.",
    REGIONAL: "Kiongozi wa Kanda: Kuratibu wanachama wa kanda husika, mahudhurio, na taarifa za familia.",
    MEMBER: "Mwanachama Hai: Kushiriki vikao, kulipa ada na michango kwa wakati, na kudumisha mshikamano wa familia."
  };
  return map[role] || map.MEMBER;
}

function enrichUserV6(u) {
  const created = u.createdAt || new Date().toISOString();
  u.gender = u.gender || "";
  u.dob = u.dob || "";
  u.email = u.email || "";
  u.nationalId = u.nationalId || "";
  u.maritalStatus = u.maritalStatus || "";
  u.occupation = u.occupation || u.profession || "";
  u.profession = u.profession || u.occupation || "";

  // Chagga Heritage Information
  u.originRegion = u.originRegion || "Kilimanjaro";
  u.district = u.district || "";
  u.division = u.division || "";
  u.ward = u.ward || "";
  u.village = u.village || "";
  u.clan = u.clan || "";
  u.subClan = u.subClan || "";
  u.ancestralArea = u.ancestralArea || "";
  u.fatherName = u.fatherName || "";
  u.grandfatherName = u.grandfatherName || "";
  u.placeOfBirth = u.placeOfBirth || "";

  // Membership Information
  u.membershipCategory = u.membershipCategory || "Mwanachama wa Kawaida";
  u.registrationDate = u.registrationDate || created.slice(0, 10);
  u.membershipExpiryDate = u.membershipExpiryDate || defaultExpiryFrom(created);
  u.profilePhoto = u.profilePhoto || "";

  if (!u.family || typeof u.family !== "object") {
    u.family = { head: u.name || "", spouse: "", children: [] };
  }
  if (!Array.isArray(u.family.children)) u.family.children = [];

  if (!Array.isArray(u.history) || u.history.length === 0) {
    u.history = [
      {
        id: `hist-reg-${u.id}`,
        type: "REGISTRATION",
        title: "Usajili wa Uanachama",
        detail: `Alisajiliwa kwenye mfumo wa WFC (${u.region || "Tanzania"})`,
        date: created,
        actor: u.name || "Mfumo"
      }
    ];
    if (u.status === "ACTIVE") {
      u.history.push({
        id: `hist-act-${u.id}`,
        type: "STATUS",
        title: "Uanachama Uliidhinishwa (ACTIVE)",
        detail: `Alipatiwa namba ya uanachama ${u.wfcId || "WFC"}`,
        date: created,
        actor: "Uongozi WFC"
      });
    }
  }

  if (!Array.isArray(u.leadershipHistory) || u.leadershipHistory.length === 0) {
    if (u.role && u.role !== "MEMBER") {
      u.leadershipHistory = [
        {
          id: `lead-${u.id}-1`,
          position: u.role,
          startDate: created.slice(0, 10),
          endDate: "Sasa (Current)",
          status: "CURRENT",
          responsibilities: getRoleResponsibilities(u.role)
        }
      ];
    } else {
      u.leadershipHistory = [];
    }
  }

  return u;
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
  if (!Array.isArray(db.memberDocuments)) db.memberDocuments = [];
  if (!Array.isArray(db.notifications)) db.notifications = [];

  for (const u of db.users) {
    if (u.password && !isBcryptHash(u.password)) {
      u.password = await bcrypt.hash(String(u.password), 10);
    }
    enrichUserV6(u);
  }

  if (!db.users.find((u) => u.phone === "0700000000")) {
    const adminHash = await bcrypt.hash(process.env.ADMIN_INITIAL_PASSWORD || "admin123", 10);
    const adminUser = enrichUserV6({
      id: "admin-001",
      name: "Mwenyekiti WFC",
      gender: "Me",
      dob: "1980-05-15",
      phone: "0700000000",
      email: "mwenyekiti@wfc.co.tz",
      nationalId: "19800515-00001-00001-11",
      maritalStatus: "Ameoa/Ameolewa",
      occupation: "Mkurugenzi & Kiongozi",
      region: "Dar es Salaam",
      originRegion: "Kilimanjaro",
      district: "Hai",
      division: "Machame",
      ward: "Machame Kaskazini",
      village: "Foo",
      clan: "Swai",
      subClan: "Swai wa Machame",
      ancestralArea: "Machame",
      fatherName: "Eldad Swai",
      grandfatherName: "Ndesanjo Swai",
      placeOfBirth: "Machame, Kilimanjaro",
      membershipCategory: "Mwanachama Mwanzilishi",
      password: adminHash,
      role: "ADMIN",
      status: "ACTIVE",
      wfcId: "WFC-ADMIN",
      family: { head: "Mwenyekiti WFC", spouse: "", children: [] },
      profession: "Kiongozi",
      createdAt: new Date().toISOString()
    });
    db.users.push(adminUser);
  }

  if (db.settings.demoSeed !== false && db.users.length <= 1) {
    const ago = (days) => new Date(Date.now() - days * 86400000).toISOString();
    const demoHash = await bcrypt.hash("demo123", 10);
    const people = [
      {
        id: "demo-amina",
        name: "Amina Swai",
        gender: "Ke",
        dob: "1991-08-22",
        phone: "0711000001",
        email: "amina.swai@mfano.co.tz",
        nationalId: "19910822-14102-00012-24",
        maritalStatus: "Ameoa/Ameolewa",
        occupation: "Muuguzi Mkuu",
        region: "Dar es Salaam",
        originRegion: "Kilimanjaro",
        district: "Hai",
        division: "Machame",
        ward: "Machame Magharibi",
        village: "Nronga",
        clan: "Swai",
        subClan: "",
        ancestralArea: "Machame",
        fatherName: "Godwin Swai",
        grandfatherName: "Lema Swai",
        placeOfBirth: "Machame, Hai",
        membershipCategory: "Mwanachama wa Kawaida",
        password: demoHash,
        role: "MEMBER",
        status: "ACTIVE",
        wfcId: "WFC-0145",
        profession: "Muuguzi",
        family: { head: "Amina Swai", spouse: "Godson Swai", children: ["Nuru", "Eli"] },
        createdAt: ago(140)
      },
      {
        id: "demo-john",
        name: "John Mushi",
        gender: "Me",
        dob: "1985-03-10",
        phone: "0711000002",
        email: "john.mushi@mfano.co.tz",
        nationalId: "19850310-22101-00045-19",
        maritalStatus: "Ameoa/Ameolewa",
        occupation: "Mhasibu Mwandamizi",
        region: "Moshi",
        originRegion: "Kilimanjaro",
        district: "Moshi Vijijini",
        division: "Kibosho",
        ward: "Kibosho Kati",
        village: "Otaruni",
        clan: "Mushi",
        subClan: "Mushi wa Kibosho",
        ancestralArea: "Kibosho",
        fatherName: "Peter Mushi",
        grandfatherName: "Joseph Mushi",
        placeOfBirth: "Kibosho, Moshi",
        membershipCategory: "Mwanachama Mwanzilishi",
        password: demoHash,
        role: "TREASURER",
        status: "ACTIVE",
        wfcId: "WFC-0088",
        profession: "Mhasibu",
        family: { head: "John Mushi", spouse: "", children: [] },
        createdAt: ago(400)
      },
      {
        id: "demo-neema",
        name: "Neema Lyimo",
        gender: "Ke",
        dob: "1995-11-04",
        phone: "0711000003",
        email: "neema.lyimo@mfano.co.tz",
        nationalId: "19951104-31204-00089-20",
        maritalStatus: "Hajaoa/Hajaolewa",
        occupation: "Mhandisi wa Ujenzi",
        region: "Arusha",
        originRegion: "Kilimanjaro",
        district: "Moshi Vijijini",
        division: "Vunjo Mashariki",
        ward: "Marangu Mashariki",
        village: "Sembeti",
        clan: "Lyimo",
        subClan: "",
        ancestralArea: "Marangu",
        fatherName: "Emmanuel Lyimo",
        grandfatherName: "Alfred Lyimo",
        placeOfBirth: "Marangu, Moshi",
        membershipCategory: "Mwanachama wa Kawaida",
        password: demoHash,
        role: "MEMBER",
        status: "PENDING",
        wfcId: null,
        profession: "Mhandisi",
        family: { head: "Neema Lyimo", spouse: "", children: [] },
        createdAt: ago(3)
      },
      {
        id: "demo-baraka",
        name: "Baraka Kimaro",
        gender: "Me",
        dob: "1988-07-19",
        phone: "0711000004",
        email: "baraka.kimaro@mfano.co.tz",
        nationalId: "19880719-41102-00033-15",
        maritalStatus: "Ameoa/Ameolewa",
        occupation: "Mwalimu wa Sekondari",
        region: "Kilimanjaro",
        originRegion: "Kilimanjaro",
        district: "Rombo",
        division: "Mashati",
        ward: "Kisale Msaranga",
        village: "Msaranga",
        clan: "Kimaro",
        subClan: "",
        ancestralArea: "Rombo",
        fatherName: "Francis Kimaro",
        grandfatherName: "Barnabas Kimaro",
        placeOfBirth: "Mashati, Rombo",
        membershipCategory: "Mwanachama wa Kawaida",
        password: demoHash,
        role: "SECRETARY",
        status: "ACTIVE",
        wfcId: "WFC-0102",
        profession: "Mwalimu",
        family: { head: "Baraka Kimaro", spouse: "Aika", children: ["Imani"] },
        createdAt: ago(220)
      },
      {
        id: "demo-sarah",
        name: "Sarah Mrema",
        gender: "Ke",
        dob: "1990-02-14",
        phone: "0711000005",
        email: "sarah.mrema@mfano.co.tz",
        nationalId: "19900214-51209-00077-28",
        maritalStatus: "Ameoa/Ameolewa",
        occupation: "Mfanyabiashara",
        region: "Tanga",
        originRegion: "Kilimanjaro",
        district: "Moshi Vijijini",
        division: "Vunjo Magharibi",
        ward: "Mwika Kaskazini",
        village: "Lole",
        clan: "Mrema",
        subClan: "",
        ancestralArea: "Mwika",
        fatherName: "Charles Mrema",
        grandfatherName: "Wilson Mrema",
        placeOfBirth: "Mwika, Moshi",
        membershipCategory: "Mwanachama wa Kawaida",
        password: demoHash,
        role: "MEMBER",
        status: "SUSPENDED",
        wfcId: "WFC-0119",
        profession: "Mfanyabiashara",
        family: { head: "Sarah Mrema", spouse: "", children: [] },
        createdAt: ago(300)
      }
    ];
    people.forEach((p) => {
      if (!db.users.find((u) => u.id === p.id || u.phone === p.phone)) {
        db.users.push(enrichUserV6({ ...p, demo: true, paymentProof: "DEMO-MP-001" }));
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
        { id: "demo-ev-1", type: "Harusi", title: "Harusi ya Familia Swai", location: "Kibo Hall, Moshi", eventDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10), ticketPrice: 20000, poster: "", public: true, status: "ACTIVE", raisedAmount: 0, reportedBy: "Ofisi", createdAt: ago(4) },
        { id: "demo-ev-2", type: "Festival", title: "WFC Festival ya Mwaka", location: "Mnazi Mmoja, Dar es Salaam", eventDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10), ticketPrice: 10000, poster: "", public: true, status: "ACTIVE", raisedAmount: 0, reportedBy: "Ofisi", createdAt: ago(8) }
      ],
      announcements: [
        { id: "demo-an-1", title: "Mkutano mkuu mwezi huu", body: "Wanachama wote hai wanakutana kujadili ada na miradi. Weka tiketi yako mapema.", link: "/#matukio", author: "Katibu", createdAt: ago(1) },
        { id: "demo-an-2", title: "Ada ya mwezi inakamilika", body: "TSh 10,000 kwa kila mwanachama hai. Wasilisha namba ya muamala ndani ya portal.", link: "/app", author: "Mhazini", createdAt: ago(2) },
        { id: "demo-an-3", title: "Jiunge na directory ya taaluma", body: "Weka kazi yako ili wanachama waweze kukutana kwa msaada wa kitaalamu.", link: "/app", author: "Ofisi", createdAt: ago(6) }
      ],
      notifications: [
        { id: "demo-notif-1", userId: "all", category: "ANNOUNCEMENT", title: "Karibu WFC Portal V6", body: "Mfumo umeboreshwa ukiwa na historia ya wanachama, nyaraka, na ripoti kamili.", readBy: [], createdAt: ago(1) },
        { id: "demo-notif-2", userId: "all", category: "EVENT_REMINDER", title: "Kikumbusho: Harusi ya Familia Swai", body: "Tukio litafanyika Kibo Hall, Moshi. Hakikisha umekata tiketi yako mapema.", readBy: [], createdAt: ago(2) },
        { id: "demo-notif-3", userId: "admin-001", category: "NEW_MEMBER", title: "Usajili Mpya: Neema Lyimo", body: "Neema Lyimo (Arusha / Marangu) amewasilisha maombi ya uanachama.", readBy: [], createdAt: ago(3) }
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
    console.log("PostgreSQL storage connected & initialized (V6).");
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
  hasPg,
  enrichUserV6,
  getRoleResponsibilities,
  defaultExpiryFrom
};
