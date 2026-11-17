const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'wfc.sqlite');
let db = null;

function saveDb() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function queryOne(sql, params = []) {
  const rows = queryAll(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

function runSql(sql, params = []) {
  db.run(sql, params);
  const lastIdRow = queryOne('SELECT last_insert_rowid() AS id');
  saveDb();
  return lastIdRow ? lastIdRow.id : null;
}

async function initDb() {
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wfc_id TEXT UNIQUE NOT NULL,
      fullname TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      clan TEXT DEFAULT 'Mushi',
      region TEXT DEFAULT 'Dar es Salaam',
      role TEXT NOT NULL DEFAULT 'member',
      password_hash TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      receipt_no TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      member_name TEXT NOT NULL,
      wfc_id TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      channel TEXT NOT NULL,
      reference_code TEXT NOT NULL,
      receipt_image TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      stage TEXT NOT NULL DEFAULT 'pending_treasurer',
      approved_by TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS welfare_cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_code TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL,
      member_name TEXT NOT NULL,
      wfc_id TEXT DEFAULT '',
      region TEXT DEFAULT 'Kilimanjaro',
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      target_amount REAL NOT NULL DEFAULT 1500000,
      collected_amount REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL DEFAULT 'TAARIFA',
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      meet_link TEXT DEFAULT '',
      author_name TEXT NOT NULL,
      author_role TEXT NOT NULL,
      likes_count INTEGER NOT NULL DEFAULT 12,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tag TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      target_amount REAL NOT NULL DEFAULT 50000000,
      raised_amount REAL NOT NULL DEFAULT 0,
      progress_percent INTEGER NOT NULL DEFAULT 50,
      status TEXT NOT NULL DEFAULT 'active'
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_code TEXT UNIQUE NOT NULL,
      event_title TEXT NOT NULL,
      fullname TEXT NOT NULL,
      phone TEXT NOT NULL,
      tier TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL,
      total_amount REAL NOT NULL,
      channel TEXT NOT NULL DEFAULT 'M-Pesa',
      reference_code TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'confirmed',
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  const userCount = queryOne('SELECT COUNT(*) AS count FROM users');
  if (!userCount || userCount.count === 0) {
    const defaultHash = bcrypt.hashSync('123456', 10);
    const seedUsers = [
      ['WFC-2026-0001', 'Mwanzilishi WFC (Super Admin)', '0700000001', 'Mushi', 'Dar es Salaam', 'super_admin', defaultHash],
      ['WFC-2026-0002', 'Mwenyekiti Taifa WFC', '0700000002', 'Massawe', 'Kilimanjaro', 'chairperson', defaultHash],
      ['WFC-2026-0003', 'Katibu Mkuu WFC', '0700000003', 'Kimaro', 'Dar es Salaam', 'secretary', defaultHash],
      ['WFC-2026-0004', 'Mhasibu Mkuu WFC', '0700000004', 'Lyimo', 'Arusha', 'treasurer', defaultHash],
      ['WFC-2026-0005', 'Kiongozi wa Kanda - Dar', '0700000005', 'Swai', 'Dar es Salaam', 'regional_leader', defaultHash],
      ['WFC-2026-0475', 'Mwanachama Hai WFC', '0711111111', 'Shirima', 'Kilimanjaro', 'member', defaultHash]
    ];
    for (const u of seedUsers) {
      db.run(
        'INSERT INTO users (wfc_id, fullname, phone, clan, region, role, password_hash) VALUES (?, ?, ?, ?, ?, ?, ?)',
        u
      );
    }

    const seedTransactions = [
      ['WFC-RCT-2026-101', 6, 'Mwanachama Hai WFC', 'WFC-2026-0475', 'Ada ya Mwezi', 50000, 'M-Pesa', 'MP261110A91', '', 'Ada ya mwezi Novemba 2026', 'approved_chairperson', 'Mwenyekiti Taifa WFC'],
      ['WFC-RCT-2026-102', 5, 'Kiongozi wa Kanda - Dar', 'WFC-2026-0005', 'Uwekezaji WCSC / SACCOS', 250000, 'CRDB Bank', 'CRDB889012', '', 'Hisa za WCSC robo ya nne', 'approved_secretary', 'Katibu Mkuu WFC'],
      ['WFC-RCT-2026-103', 6, 'Mwanachama Hai WFC', 'WFC-2026-0475', 'Mfuko wa Maafa / Msiba', 30000, 'Tigo Pesa', 'TG88990044', '', 'Mchango wa rambirambi familia ya Mzee Tarimo', 'verified_treasurer', 'Mhasibu Mkuu WFC'],
      ['WFC-RCT-2026-104', 6, 'Mwanachama Hai WFC', 'WFC-2026-0475', 'Tamasha la WFC', 60000, 'Airtel Money', 'AM77231099', '', 'Malipo ya maandalizi ya WFC Festival', 'pending_treasurer', '']
    ];
    for (const t of seedTransactions) {
      db.run(
        'INSERT INTO transactions (receipt_no, user_id, member_name, wfc_id, category, amount, channel, reference_code, receipt_image, notes, stage, approved_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        t
      );
    }

    const seedWelfare = [
      ['WFC-WLF-01', 'Msiba', 'Familia ya Mzee E. Tarimo', 'WFC-2026-0118', 'Marangu, Kilimanjaro', 'Rambirambi ya Msiba wa Mzee E. Tarimo', 'Jumuiya inashirikiana kufariji familia ya mwanachama mwenzetu aliyefiwa na baba mzazi huko Marangu.', 2000000, 1650000, 'active'],
      ['WFC-WLF-02', 'Harusi', 'Bwana & Bibi K. Urassa', 'WFC-2026-0214', 'Dar es Salaam', 'Sherehe ya Harusi ya Mwanachama K. Urassa', 'Mchango wa zawadi na heshima ya WFC kwa harusi itakayofanyika Mikocheni, Dar es Salaam.', 1500000, 1280000, 'active'],
      ['WFC-WLF-03', 'Ugonjwa', 'Bi. Grace Mrema', 'WFC-2026-0309', 'Arusha', 'Msaada wa Matibabu (KCMC Moshi)', 'Tuungane kumsaidia dada yetu Grace Mrema anayeendelea na matibabu katika hospitali ya rufaa KCMC.', 1200000, 940000, 'active']
    ];
    for (const w of seedWelfare) {
      db.run(
        'INSERT INTO welfare_cases (case_code, type, member_name, wfc_id, region, title, description, target_amount, collected_amount, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        w
      );
    }

    const seedAnnouncements = [
      ['KIKAO', 'Kikao Kikuu cha Robo Mwaka cha WFC Mtandaoni', 'Habari wana-WFC. Tunawakaribisha kwenye kikao chetu kikuu kupitia Google Meet kujadili maendeleo ya WCSC, SACCOS na maandalizi ya Wachagga Family Community Festival. Stand up, it\'s not over!', 'https://meet.google.com', 'Katibu Mkuu WFC', 'Katibu Mkuu', 48],
      ['MAENDELEO', 'Gawio la Uwekezaji wa WFC SACCOS & UTT AMIS 2026', 'Kamati ya Uchumi na Uwekezaji inapenda kuwataarifu wanachama wote kuwa mifuko yetu ya WCSC na UTT AMIS imeongezeka kwa asilimia 18.4 katika robo hii.', '', 'Mhasibu Mkuu WFC', 'Mhasibu / Mweka Hazina', 63]
    ];
    for (const a of seedAnnouncements) {
      db.run(
        'INSERT INTO announcements (category, title, body, meet_link, author_name, author_role, likes_count) VALUES (?, ?, ?, ?, ?, ?, ?)',
        a
      );
    }

    const seedProjects = [
      ['UWEKEZAJI', 'WCSC (Wachagga Community Savings & Credit)', 'Mfuko wa uwekezaji wa pamoja na mikopo nafuu kwa wanachama wa WFC.', 80000000, 62400000, 78, 'active'],
      ['MAENDELEO', 'WFC SACCOS & UTT AMIS', 'Uwekezaji wa pamoja katika mifuko ya UTT AMIS (Umoja & Wekeza Maisha) kwa niaba ya jumuiya.', 60000000, 45000000, 75, 'active'],
      ['UTAMADUNI', 'Community Tours (Kilimanjaro & Ngorongoro)', 'Utalii wa ndani na utamaduni wa Wachagga kuimarisha umoja na vipato.', 25000000, 17500000, 70, 'active'],
      ['UWEZESHAJI', 'WFC Queens Empowerment', 'Programu maalum ya wanawake wa WFC katika ujasiriamali na uongozi.', 30000000, 24600000, 82, 'active'],
      ['MAANDALIZI', 'Wachagga Family Community Festival', 'Tamasha la kila mwaka linalokutanisha wanachama wote wa WFC.', 40000000, 34000000, 85, 'active']
    ];
    for (const p of seedProjects) {
      db.run(
        'INSERT INTO projects (tag, title, description, target_amount, raised_amount, progress_percent, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        p
      );
    }

    db.run(
      'INSERT INTO tickets (ticket_code, event_title, fullname, phone, tier, quantity, unit_price, total_amount, channel, reference_code, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      ['WFC-TKT-202601', 'Wachagga Family Community Festival 2026', 'Mwanachama Hai WFC', '0711111111', 'VIP', 1, 60000, 60000, 'M-Pesa', 'MP99887766', 'confirmed']
    );

    saveDb();
  }

  return db;
}

module.exports = {
  initDb,
  queryAll,
  queryOne,
  runSql,
  saveDb
};
