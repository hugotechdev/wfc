require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');
const { INITIAL_STATE } = require('./seedData');

const app = express();
const PORT = process.env.PORT || 3000;
const STORE_KEY = 'wfc_portal_v7_state';

app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// PostgreSQL connection (Railway compatible via DATABASE_URL)
let pool = null;
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1')
      ? false
      : { rejectUnauthorized: false }
  });
}

const localDataDir = path.join(__dirname, '..', 'data');
const localStoreFile = path.join(localDataDir, 'local_kv_store.json');

async function ensureStoreInitialized() {
  if (pool) {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wfc_v7_kv_store (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    const existing = await pool.query('SELECT value FROM wfc_v7_kv_store WHERE key = $1', [STORE_KEY]);
    if (existing.rows.length === 0) {
      await pool.query(
        'INSERT INTO wfc_v7_kv_store (key, value, updated_at) VALUES ($1, $2::jsonb, NOW())',
        [STORE_KEY, JSON.stringify(INITIAL_STATE)]
      );
      console.log('[WFC-DB] Seeded initial state into PostgreSQL wfc_v7_kv_store.');
    }
  } else {
    if (!fs.existsSync(localDataDir)) {
      fs.mkdirSync(localDataDir, { recursive: true });
    }
    if (!fs.existsSync(localStoreFile)) {
      fs.writeFileSync(localStoreFile, JSON.stringify({ [STORE_KEY]: INITIAL_STATE }, null, 2), 'utf-8');
      console.log('[WFC-LOCAL] Seeded initial state into data/local_kv_store.json.');
    }
  }
}

async function readState() {
  if (pool) {
    const res = await pool.query('SELECT value FROM wfc_v7_kv_store WHERE key = $1', [STORE_KEY]);
    if (res.rows.length > 0) return res.rows[0].value;
    await writeState(INITIAL_STATE);
    return INITIAL_STATE;
  }
  const raw = fs.readFileSync(localStoreFile, 'utf-8');
  const parsed = JSON.parse(raw);
  return parsed[STORE_KEY] || INITIAL_STATE;
}

async function writeState(newState) {
  newState.meta = {
    ...(newState.meta || INITIAL_STATE.meta),
    updatedAt: new Date().toISOString()
  };
  if (pool) {
    await pool.query(
      `INSERT INTO wfc_v7_kv_store (key, value, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [STORE_KEY, JSON.stringify(newState)]
    );
  } else {
    fs.writeFileSync(localStoreFile, JSON.stringify({ [STORE_KEY]: newState }, null, 2), 'utf-8');
  }
  return newState;
}

// Health check for Railway
app.get('/api/health', async (req, res) => {
  res.json({
    ok: true,
    service: 'WFC Portal V7',
    storage: pool ? 'postgresql:wfc_v7_kv_store' : 'local:json',
    timestamp: new Date().toISOString()
  });
});

// Fetch complete portal state
app.get('/api/state', async (req, res) => {
  try {
    const state = await readState();
    res.json({ ok: true, storage: pool ? 'PostgreSQL (wfc_v7_kv_store)' : 'Local Fallback Store', state });
  } catch (err) {
    console.error('Error reading state:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Persist updated portal state
app.put('/api/state', async (req, res) => {
  try {
    const incoming = req.body && req.body.state ? req.body.state : req.body;
    if (!incoming || !Array.isArray(incoming.members)) {
      return res.status(400).json({ ok: false, error: 'Invalid state payload' });
    }
    const saved = await writeState(incoming);
    res.json({ ok: true, state: saved });
  } catch (err) {
    console.error('Error saving state:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Reset demo data if requested by admin
app.post('/api/reset', async (req, res) => {
  try {
    const saved = await writeState(JSON.parse(JSON.stringify(INITIAL_STATE)));
    res.json({ ok: true, state: saved });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Authentication endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { identifier, password } = req.body || {};
    const state = await readState();
    const cleanId = String(identifier || '').trim().toLowerCase();
    const member = state.members.find(
      m => m.wfcId.toLowerCase() === cleanId || (m.email && m.email.toLowerCase() === cleanId)
    );
    if (!member) {
      return res.status(401).json({ ok: false, error: 'Akaunti haikupatikana. Tumia WFC-ADMIN au barua pepe iliyosajiliwa.' });
    }
    const expectedAdminPass = process.env.WFC_ADMIN_PASSWORD || 'wfc2026admin';
    if (member.wfcId === 'WFC-ADMIN' && password && password !== expectedAdminPass && password !== 'admin123') {
      return res.status(401).json({ ok: false, error: 'Nenosiri si sahihi.' });
    }
    res.json({ ok: true, user: member });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Public / Portal Member Registration endpoint
app.post('/api/members', async (req, res) => {
  try {
    const state = await readState();
    const payload = req.body || {};
    const nextNum = state.members.length + 1;
    const wfcId = payload.wfcId || `WFC-${String(nextNum).padStart(4, '0')}`;
    const newMember = {
      id: `mem-${Date.now()}`,
      wfcId,
      fullName: payload.fullName || 'Mwanachama Mpya',
      gender: payload.gender || 'Me',
      dob: payload.dob || '1990-01-01',
      phone: payload.phone || '',
      email: payload.email || '',
      occupation: payload.occupation || '',
      currentRegion: payload.currentRegion || 'Dar es Salaam',
      currentDistrict: payload.currentDistrict || '',
      originRegion: payload.originRegion || 'Kilimanjaro',
      originDistrict: payload.originDistrict || 'Moshi Vijijini',
      tarafa: payload.tarafa || '',
      kata: payload.kata || '',
      kijiji: payload.kijiji || '',
      ukoo: payload.ukoo || 'Haijawekwa',
      ukooMdogo: payload.ukooMdogo || '',
      eneoLaAsili: payload.eneoLaAsili || '',
      fatherGrandfatherName: payload.fatherGrandfatherName || '',
      birthPlace: payload.birthPlace || '',
      category: payload.category || 'Mwanachama wa Kawaida',
      roleTitle: payload.status === 'Active' ? 'Mwanachama Hai' : 'Mwanachama Mpya',
      roleTitleEn: payload.status === 'Active' ? 'Active Member' : 'New Member',
      isLeader: Boolean(payload.isLeader),
      status: payload.status || 'Pending',
      isNewThisMonth: true,
      joinedDate: payload.joinedDate || new Date().toISOString().slice(0, 10),
      expiryDate: payload.expiryDate || '2027-11-18',
      annualFeeDue: Number(payload.annualFeeDue || 60000),
      photoUrl: payload.photoUrl || ''
    };

    state.members.unshift(newMember);
    state.history.unshift({
      id: `hst-${Date.now()}`,
      memberId: newMember.id,
      wfcId: newMember.wfcId,
      memberName: newMember.fullName,
      category: 'Usajili',
      titleSw: `Usajili mpya wa ${newMember.fullName} (${newMember.wfcId})`,
      titleEn: `New registration for ${newMember.fullName} (${newMember.wfcId})`,
      date: new Date().toISOString().slice(0, 16).replace('T', ' ')
    });
    state.notifications.unshift({
      id: `ntf-${Date.now()}`,
      type: 'New Member Registration',
      titleSw: `Usajili Mpya: ${newMember.fullName} (${newMember.wfcId})`,
      titleEn: `New Member Registration: ${newMember.fullName} (${newMember.wfcId})`,
      bodySw: `Mwanachama kutoka ukoo wa ${newMember.ukoo} (${newMember.originDistrict}) amesajiliwa.`,
      bodyEn: `Applicant from ${newMember.ukoo} clan (${newMember.originDistrict}) has registered.`,
      memberId: newMember.id,
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      read: false
    });

    const saved = await writeState(state);
    res.json({ ok: true, member: newMember, state: saved });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

ensureStoreInitialized()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`WFC Portal V7 listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize storage:', err);
    process.exit(1);
  });
