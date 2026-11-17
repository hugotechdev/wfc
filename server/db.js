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

function run(sql, params = []) {
  db.run(sql, params);
  saveDb();
}

function get(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  let row = null;
  if (stmt.step()) {
    row = stmt.getAsObject();
  }
  stmt.free();
  return row;
}

function all(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
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
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wfc_id TEXT UNIQUE,
      full_name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      email TEXT,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'member', -- superadmin, chairperson, secretary, treasurer, regional_leader, committee, member
      status TEXT DEFAULT 'pending', -- active, pending, suspended, exited
      region TEXT DEFAULT 'Dar es Salaam',
      district TEXT DEFAULT '',
      branch TEXT DEFAULT '',
      home_origin TEXT DEFAULT '', -- Kijiji/Wilaya ya asili Kilimanjaro (Moshi, Hai, Rombo, Siha, Mwanga, Same)
      avatar TEXT DEFAULT '',
      joined_date TEXT,
      months_owed INTEGER DEFAULT 0,
      emergency_paid REAL DEFAULT 0,
      entry_fee_paid REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL, -- msiba, harusi, ugonjwa, mradi, festival, dharura
      description TEXT,
      target_per_member REAL DEFAULT 0,
      target_total REAL DEFAULT 0,
      beneficiary_user_id INTEGER,
      beneficiary_name TEXT,
      status TEXT DEFAULT 'pending_secretary', -- pending_secretary, pending_chairperson, active, completed, rejected
      created_by INTEGER,
      verified_by INTEGER,
      approved_by INTEGER,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      receipt_no TEXT UNIQUE,
      user_id INTEGER NOT NULL,
      fund_account TEXT NOT NULL, -- kiingilio, ada, dharura, msiba, harusi, ugonjwa, miradi, festival
      campaign_id INTEGER,
      amount REAL NOT NULL,
      payment_method TEXT DEFAULT 'M-Pesa',
      transaction_ref TEXT UNIQUE,
      sms_text TEXT,
      proof_image TEXT,
      for_month TEXT,
      status TEXT DEFAULT 'pending', -- pending, approved, rejected
      rejection_reason TEXT,
      reviewed_by INTEGER,
      reviewed_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      voucher_no TEXT UNIQUE,
      fund_account TEXT NOT NULL,
      expense_type TEXT DEFAULT 'matumizi', -- matumizi, msaada, marejesho
      recipient_user_id INTEGER,
      recipient_name TEXT,
      amount REAL NOT NULL,
      reason TEXT NOT NULL,
      attachment TEXT,
      status TEXT DEFAULT 'pending_secretary', -- pending_secretary, pending_chairperson, approved, rejected
      rejection_reason TEXT,
      created_by INTEGER,
      secretary_by INTEGER,
      secretary_at TEXT,
      chairperson_by INTEGER,
      chairperson_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT DEFAULT 'Tangazo', -- Tangazo, Kikao, Mradi, Taarifa
      meet_link TEXT,
      event_date TEXT,
      image_path TEXT,
      doc_path TEXT,
      doc_name TEXT,
      status TEXT DEFAULT 'published', -- draft, published
      author_id INTEGER,
      likes_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS post_likes (
      post_id INTEGER,
      user_id INTEGER,
      PRIMARY KEY (post_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      comment_text TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      venue TEXT NOT NULL,
      event_date TEXT NOT NULL,
      banner_image TEXT,
      regular_price REAL DEFAULT 20000,
      vip_price REAL DEFAULT 50000,
      family_price REAL DEFAULT 100000,
      total_capacity INTEGER DEFAULT 500,
      status TEXT DEFAULT 'open', -- open, closed
      created_by INTEGER,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_code TEXT UNIQUE NOT NULL,
      event_id INTEGER NOT NULL,
      user_id INTEGER,
      buyer_name TEXT NOT NULL,
      buyer_phone TEXT NOT NULL,
      tier TEXT DEFAULT 'Regular', -- Regular, VIP, Family
      quantity INTEGER DEFAULT 1,
      total_amount REAL NOT NULL,
      payment_method TEXT DEFAULT 'M-Pesa',
      transaction_ref TEXT UNIQUE,
      sms_text TEXT,
      proof_image TEXT,
      status TEXT DEFAULT 'pending', -- pending, approved, rejected
      checked_in INTEGER DEFAULT 0,
      checked_in_at TEXT,
      reviewed_by INTEGER,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT,
      description TEXT,
      target_capital REAL DEFAULT 0,
      raised_capital REAL DEFAULT 0,
      status TEXT DEFAULT 'Inaendelea',
      lead_person TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL, -- 0 means broadcast to all
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      link TEXT DEFAULT '/portal.html',
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_id INTEGER,
      actor_name TEXT,
      actor_role TEXT,
      action TEXT NOT NULL,
      details TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Seed default settings
  const defaultSettings = [
    ['entry_fee', '50000'],
    ['monthly_fee', '10000'],
    ['emergency_fee', '60000'],
    ['mpesa_number', '0755 000 888 (Jina: WACHAGGA FAMILY COMMUNITY)'],
    ['tigopesa_number', '0715 000 888 (Lipa Namba: 889900 - WFC)'],
    ['airtel_number', '0785 000 888 (Jina: WACHAGGA FAMILY COMMUNITY)'],
    ['bank_details', 'CRDB Bank - A/C: 0150889944200 (WACHAGGA FAMILY COMMUNITY)'],
    ['community_about', 'Wachagga Family Community (WFC) ni jumuiya rasmi inayowaunganisha Wachagga wote ndani na nje ya Tanzania kwa lengo la mshikamano, kusaidiana katika shida na raha, na kukuza maendeleo ya kiuchumi. Stand up, It\'s not over!'],
    ['contact_phone', '+255 755 000 888'],
    ['contact_email', 'info@wachaggacommunity.or.tz'],
    ['contact_address', 'Moshi, Kilimanjaro & Dar es Salaam, Tanzania']
  ];

  for (const [k, v] of defaultSettings) {
    const exists = get('SELECT key FROM settings WHERE key = ?', [k]);
    if (!exists) {
      run('INSERT INTO settings (key, value) VALUES (?, ?)', [k, v]);
    }
  }

  // Seed default users if empty
  const userCount = get('SELECT COUNT(*) as c FROM users');
  if (!userCount || userCount.c === 0) {
    const hash = bcrypt.hashSync('123456', 10);
    const seedUsers = [
      ['WFC-0001', 'Msimamizi Mkuu (Founder)', '0700000001', 'admin@wfc.or.tz', hash, 'superadmin', 'active', 'Dar es Salaam', 'Kinondoni', 'Mbezi Beach', 'Marangu, Moshi', '2025-01-01', 0, 60000, 50000],
      ['WFC-0002', 'Mwenyekiti wa Taifa WFC', '0700000002', 'chair@wfc.or.tz', hash, 'chairperson', 'active', 'Dar es Salaam', 'Ilala', 'Upanga', 'Machame, Hai', '2025-01-01', 0, 60000, 50000],
      ['WFC-0003', 'Katibu Mkuu WFC', '0700000003', 'secretary@wfc.or.tz', hash, 'secretary', 'active', 'Kilimanjaro', 'Moshi Mjini', 'Shanty Town', 'Kibosho, Moshi', '2025-01-01', 0, 60000, 50000],
      ['WFC-0004', 'Mweka Hazina (Mhasibu)', '0700000004', 'treasurer@wfc.or.tz', hash, 'treasurer', 'active', 'Dar es Salaam', 'Temeke', 'Kigamboni', 'Mkuu, Rombo', '2025-01-01', 0, 60000, 50000],
      ['WFC-0005', 'Kiongozi Kanda ya Dar', '0700000005', 'dar@wfc.or.tz', hash, 'regional_leader', 'active', 'Dar es Salaam', 'Ubungo', 'Mlimani', 'Uru, Moshi', '2025-02-01', 0, 60000, 50000],
      ['WFC-0006', 'Amani Massawe (Mwanachama)', '0711111111', 'amani@wfc.or.tz', hash, 'member', 'active', 'Dar es Salaam', 'Kinondoni', 'Mikocheni', 'Old Moshi', '2026-06-01', 2, 30000, 50000]
    ];

    for (const u of seedUsers) {
      run(`INSERT INTO users (wfc_id, full_name, phone, email, password_hash, role, status, region, district, branch, home_origin, joined_date, months_owed, emergency_paid, entry_fee_paid)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, u);
    }

    // Seed sample approved payment for member WFC-0006
    run(`INSERT INTO payments (receipt_no, user_id, fund_account, amount, payment_method, transaction_ref, for_month, status, reviewed_by, reviewed_at)
         VALUES ('WFC-REC-1001', 6, 'kiingilio', 50000, 'M-Pesa', 'MPESA8821001', '2026-06', 'approved', 4, datetime('now'))`);
    run(`INSERT INTO payments (receipt_no, user_id, fund_account, amount, payment_method, transaction_ref, for_month, status, reviewed_by, reviewed_at)
         VALUES ('WFC-REC-1002', 6, 'dharura', 30000, 'Tigo Pesa', 'TIGO8821002', '2026-07', 'approved', 4, datetime('now'))`);

    // Seed active campaign (Mchango unaotakiwa)
    run(`INSERT INTO campaigns (title, category, description, target_per_member, target_total, beneficiary_name, status, created_by, verified_by, approved_by)
         VALUES ('Mchango wa Msiba - Familia ya Mzee Shirima (Rombo)', 'msiba', 'Jumuiya inatoa pole kwa familia ya mwanachama mwenzetu aliyefiwa. Kila mwanachama anaombwa kuchangia angalau TSh 10,000.', 10000, 4500000, 'Familia ya Mzee Shirima', 'active', 3, 3, 2)`);

    // Seed sample post
    run(`INSERT INTO posts (title, content, category, meet_link, event_date, status, author_id, likes_count)
         VALUES ('Kikao Kikuu cha Robo Mwaka cha WFC Mtandaoni', 'Habari wana-WFC! Tunawakaribisha kwenye kikao chetu kikuu kupitia Google Meet kujadili maendeleo ya WCSC, SACCOS na maandalizi ya Wachagga Family Community Festival. Stand up, It\'s not over!', 'Kikao', 'https://meet.google.com/wfc-general-meeting', '2026-11-28 19:00', 'published', 3, 24)`);

    // Seed sample event
    run(`INSERT INTO events (title, description, venue, event_date, regular_price, vip_price, family_price, total_capacity, status, created_by)
         VALUES ('Wachagga Family Community Festival 2026', 'Tamasha kubwa la utamaduni, mbege, nyama choma, mtandao wa biashara na burudani ya asili kwa familia zote za WFC na marafiki!', 'Mlimani City Conference Hall, Dar es Salaam', '2026-12-20 14:00', 25000, 60000, 120000, 600, 'open', 2)`);

    // Seed sample projects
    const seedProjects = [
      ['WCSC (Wachagga Community Savings & Credit)', 'WCSC', 'Mfuko wa uwekezaji wa pamoja na mikopo nafuu kwa wanachama wa WFC.', 50000000, 32500000, 'Inaendelea', 'Kamati ya Uchumi'],
      ['WFC SACCOS & UTT AMIS', 'SACCOS', 'Uwekezaji wa pamoja katika mifuko ya UTT AMIS (Umoja & Wekeza Maisha) kwa niaba ya jumuiya.', 100000000, 64000000, 'Inaendelea', 'Mweka Hazina'],
      ['Community Tours (Kilimanjaro & Ngorongoro)', 'TOURS', 'Utalii wa ndani na utamaduni wa Wachagga kuimarisha umoja na mapato.', 15000000, 11200000, 'Inaendelea', 'Kamati ya Matukio'],
      ['WFC Queens Empowerment', 'QUEENS', 'Programu maalum ya wanawake wa WFC katika ujasiriamali na uongozi.', 20000000, 14800000, 'Inaendelea', 'Mwenyekiti Queens'],
      ['Wachagga Family Community Festival', 'FESTIVAL', 'Tamasha la kila mwaka linalokutanisha wanachama wote wa WFC.', 35000000, 21000000, 'Maandalizi', 'Kamati ya Festival']
    ];
    for (const p of seedProjects) {
      run(`INSERT INTO projects (name, code, description, target_capital, raised_capital, status, lead_person)
           VALUES (?, ?, ?, ?, ?, ?, ?)`, p);
    }

    // Seed notification for member 6
    run(`INSERT INTO notifications (user_id, title, message, link)
         VALUES (6, 'Karibu WFC Online Portal!', 'Malipo yako ya Kiingilio (TSh 50,000) yamethibitishwa. Una deni la ada ya miezi 2 (TSh 20,000) na salio la Dharura (TSh 30,000).', '/portal.html')`);
  }

  saveDb();
  console.log('WFC Database initialized successfully at:', DB_PATH);
}

module.exports = { initDb, run, get, all, saveDb };
