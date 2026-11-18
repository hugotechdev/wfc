const express = require('express');
const path = require('path');
const crypto = require('crypto');
const {
  loadDB,
  saveDB,
  hashPassword,
  verifyPassword,
  normalizePhone
} = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const APP_SECRET = process.env.APP_SECRET || 'wfc-portal-2026-secret-key';

app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Token helpers (stateless HMAC signed session token)
function signSession(userId) {
  const payload = JSON.stringify({
    uid: userId,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000
  });
  const encoded = Buffer.from(payload).toString('base64url');
  const sig = crypto.createHmac('sha256', APP_SECRET).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

function verifySession(token) {
  if (!token || !token.includes('.')) return null;
  const [encoded, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', APP_SECRET).update(encoded).digest('base64url');
  if (sig !== expected) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (!payload.exp || Date.now() > payload.exp) return null;
    return payload.uid;
  } catch {
    return null;
  }
}

function sanitizeUser(u) {
  return {
    id: u.id,
    wfcId: u.wfcId,
    fullName: u.fullName,
    phone: u.phone,
    email: u.email,
    kanda: u.kanda,
    role: u.role,
    status: u.status,
    registrationTxRef: u.registrationTxRef,
    registrationChannel: u.registrationChannel,
    createdAt: u.createdAt
  };
}

function getBaseUrl(req) {
  if (process.env.APP_BASE_URL) {
    return process.env.APP_BASE_URL.replace(/\/$/, '');
  }
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.get('host');
  return `${proto}://${host}`;
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const uid = verifySession(token);
  if (!uid) {
    return res.status(401).json({ ok: false, message: 'Tafadhali ingia tena kwenye akaunti yako.' });
  }
  const db = loadDB();
  const user = db.users.find((u) => u.id === uid);
  if (!user) {
    return res.status(401).json({ ok: false, message: 'Akaunti haijapatikana.' });
  }
  if (user.status !== 'ACTIVE') {
    return res.status(403).json({
      ok: false,
      code: user.status,
      message: 'Akaunti yako bado inasubiri uhakiki wa malipo.'
    });
  }
  req.user = user;
  req.db = db;
  next();
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        ok: false,
        message: 'Huna ruhusa (RBAC) ya kufanya kitendo hiki.'
      });
    }
    next();
  };
}

// ==========================================
// PUBLIC CONFIG & AUTH ENDPOINTS
// ==========================================

app.get('/api/public-config', (req, res) => {
  const db = loadDB();
  res.json({
    ok: true,
    registrationFee: db.settings.registrationFee || 1000,
    paymentChannels: db.settings.paymentChannels || []
  });
});

// Login via Phone OR Email + Waiting Approval check
app.post('/api/auth/login', (req, res) => {
  const { identifier, password } = req.body || {};
  if (!identifier || !password) {
    return res.status(400).json({ ok: false, message: 'Weka namba ya simu au barua pepe na nenosiri.' });
  }

  const db = loadDB();
  const raw = String(identifier).trim().toLowerCase();
  const normPhone = normalizePhone(raw);

  const user = db.users.find((u) => {
    const emailMatch = u.email && u.email.toLowerCase() === raw;
    const phoneMatch = normPhone && normalizePhone(u.phone) === normPhone;
    const wfcIdMatch = u.wfcId && u.wfcId.toLowerCase() === raw;
    return emailMatch || phoneMatch || wfcIdMatch;
  });

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({
      ok: false,
      message: 'Namba ya simu/barua pepe au nenosiri si sahihi.'
    });
  }

  if (user.status === 'WAITING_APPROVAL') {
    const pendingPayment = db.payments.find(
      (p) => p.userId === user.id && p.category === 'REGISTRATION'
    );
    return res.status(403).json({
      ok: false,
      code: 'WAITING_APPROVAL',
      message: 'Akaunti yako inasubiri uhakiki wa ada ya usajili (TSh 1,000) kutoka kwa Mhasibu.',
      user: sanitizeUser(user),
      payment: pendingPayment || null
    });
  }

  if (user.status === 'REJECTED') {
    return res.status(403).json({
      ok: false,
      code: 'REJECTED',
      message: 'Usajili wako ulikataliwa kutokana na muamala kutothibitika. Wasiliana na uongozi wa WFC.'
    });
  }

  const token = signSession(user.id);
  return res.json({
    ok: true,
    token,
    user: sanitizeUser(user)
  });
});

// 3-Step Registration Endpoint
app.post('/api/auth/register', (req, res) => {
  const {
    fullName,
    phone,
    email,
    kanda,
    password,
    confirmPassword,
    paymentChannel,
    transactionRef
  } = req.body || {};

  if (!fullName || !phone || !email || !kanda) {
    return res.status(400).json({ ok: false, message: 'Tafadhali jaza taarifa zote za Hatua ya 1.' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ ok: false, message: 'Nenosiri lazima liwe na herufi au tarakimu zisizopungua 6.' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ ok: false, message: 'Nenosiri na Thibitisha Nenosiri havilingani.' });
  }
  if (!paymentChannel || !transactionRef || String(transactionRef).trim().length < 4) {
    return res.status(400).json({ ok: false, message: 'Weka njia ya malipo na namba halali ya muamala (TSh 1,000).' });
  }

  const db = loadDB();
  const cleanEmail = String(email).trim().toLowerCase();
  const cleanPhone = normalizePhone(phone);

  if (db.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
    return res.status(409).json({ ok: false, message: 'Barua pepe hii tayari imeshasajiliwa.' });
  }
  if (db.users.some((u) => normalizePhone(u.phone) === cleanPhone)) {
    return res.status(409).json({ ok: false, message: 'Namba hii ya simu tayari imeshasajiliwa.' });
  }

  const nextNum = String(db.users.length + 1).padStart(4, '0');
  const wfcId = `WFC-2026-${nextNum}`;
  const userId = 'usr-' + crypto.randomBytes(4).toString('hex');
  const now = new Date().toISOString();

  const newUser = {
    id: userId,
    wfcId,
    fullName: String(fullName).trim(),
    phone: cleanPhone,
    email: cleanEmail,
    kanda: String(kanda).trim(),
    role: 'MEMBER',
    status: 'WAITING_APPROVAL',
    passwordHash: hashPassword(password),
    registrationTxRef: String(transactionRef).trim().toUpperCase(),
    registrationChannel: String(paymentChannel).trim(),
    resetToken: null,
    resetTokenExpires: null,
    createdAt: now
  };

  const newPayment = {
    id: 'pay-' + crypto.randomBytes(4).toString('hex'),
    userId,
    wfcId,
    memberName: newUser.fullName,
    category: 'REGISTRATION',
    fundId: 'REG_FUND',
    amount: db.settings.registrationFee || 1000,
    channel: newUser.registrationChannel,
    txRef: newUser.registrationTxRef,
    note: 'Ada ya usajili wa mwanachama mpya (Hatua 3)',
    status: 'PENDING',
    verifiedBy: null,
    createdAt: now
  };

  db.users.push(newUser);
  db.payments.unshift(newPayment);
  saveDB(db);

  return res.status(201).json({
    ok: true,
    message: 'Usajili umekamilika! Akaunti yako inasubiri uhakiki wa ada ya TSh 1,000.',
    user: sanitizeUser(newUser),
    payment: newPayment
  });
});

// ==========================================
// FORGOT PASSWORD & RESET LINK (RESEND API)
// ==========================================

// Step 1: POST /api/forgot-password
app.post('/api/forgot-password', async (req, res) => {
  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ ok: false, message: 'Tafadhali weka barua pepe uliyotumia kujisajili.' });
  }

  const db = loadDB();
  const cleanEmail = String(email).trim().toLowerCase();
  const user = db.users.find((u) => u.email && u.email.toLowerCase() === cleanEmail);

  if (!user) {
    return res.status(404).json({
      ok: false,
      message: 'Hakuna akaunti iliyosajiliwa na barua pepe hiyo.'
    });
  }

  const token = crypto.randomBytes(24).toString('hex');
  const expiresMs = 30 * 60 * 1000; // Dakika 30
  user.resetToken = token;
  user.resetTokenExpires = Date.now() + expiresMs;
  saveDB(db);

  const baseUrl = getBaseUrl(req);
  const resetLink = `${baseUrl}/app?resetToken=${token}`;

  const resendApiKey = (process.env.RESEND_API_KEY || db.settings.resendApiKey || '').trim();
  const emailFrom = (process.env.EMAIL_FROM || db.settings.emailFrom || 'Wachagga Family Community <onboarding@resend.dev>').trim();

  if (!resendApiKey) {
    return res.json({
      ok: true,
      mode: 'preview',
      message: 'Kiungo cha kurejesha nenosiri kimetengenezwa (kinadumu dakika 30). Kwa kuwa RESEND_API_KEY haijawekwa bado, tumia kiungo hapa chini kukijaribu mara moja.',
      previewResetLink: resetLink,
      expiresInMinutes: 30
    });
  }

  try {
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; border: 1px solid #e5d8b0; border-radius: 14px; overflow: hidden;">
        <div style="background: #141414; color: #D4AF37; padding: 24px; text-align: center;">
          <h2 style="margin: 0; letter-spacing: 0.5px;">Wachagga Family Community (WFC)</h2>
          <p style="margin: 6px 0 0; color: #f3e8c8; font-size: 13px;">Ofisi ya Kidijitali — Usalama wa Akaunti</p>
        </div>
        <div style="padding: 28px; background: #ffffff; color: #1f2937;">
          <p>Habari <strong>${user.fullName}</strong> (${user.wfcId}),</p>
          <p>Tumepokea ombi la kubadilisha nenosiri la akaunti yako ya Wachagga Family Community. Bofya kitufe hapa chini kuweka nenosiri jipya:</p>
          <div style="text-align: center; margin: 28px 0;">
            <a href="${resetLink}" style="background: #C59B27; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; display: inline-block;">
              Weka Nenosiri Jipya
            </a>
          </div>
          <p style="font-size: 13px; color: #6b7280;">Kiungo hiki kitatumika ndani ya <strong>dakika 30</strong> pekee. Kama hukuomba kubadilisha nenosiri, puuza barua pepe hii.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #9ca3af;">Kama kitufe hakifunguki, nakili kiungo hiki: <br/>${resetLink}</p>
        </div>
      </div>
    `;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: emailFrom,
        to: [user.email],
        subject: 'Weka Nenosiri Jipya — Wachagga Family Community (WFC)',
        html: htmlBody
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(502).json({
        ok: false,
        message: `Resend API imerudisha hitilafu: ${data.message || 'Hakikisha RESEND_API_KEY na EMAIL_FROM ni sahihi.'}`,
        previewResetLink: resetLink
      });
    }

    return res.json({
      ok: true,
      mode: 'email_sent',
      message: `Kiungo cha kuweka nenosiri jipya kimetumwa kwenye barua pepe ${user.email}. Angalia Inbox au Spam ndani ya dakika 30.`
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: 'Imeshindwa kuwasiliana na huduma ya barua pepe: ' + err.message,
      previewResetLink: resetLink
    });
  }
});

// Step 2A: GET /api/reset-password/:token
app.get('/api/reset-password/:token', (req, res) => {
  const { token } = req.params;
  const db = loadDB();
  const user = db.users.find((u) => u.resetToken === token);

  if (!user || !user.resetTokenExpires || Date.now() > user.resetTokenExpires) {
    return res.status(400).json({
      ok: false,
      message: 'Kiungo hiki cha kubadilisha nenosiri si sahihi au muda wake (dakika 30) umekwisha.'
    });
  }

  return res.json({
    ok: true,
    fullName: user.fullName,
    wfcId: user.wfcId,
    email: user.email
  });
});

// Step 2B: POST /api/reset-password
app.post('/api/reset-password', (req, res) => {
  const { token, newPassword, confirmPassword } = req.body || {};
  if (!token || !newPassword) {
    return res.status(400).json({ ok: false, message: 'Weka token na nenosiri jipya.' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ ok: false, message: 'Nenosiri jipya lazima liwe na herufi/tarakimu 6 au zaidi.' });
  }
  if (confirmPassword !== undefined && newPassword !== confirmPassword) {
    return res.status(400).json({ ok: false, message: 'Nenosiri jipya na uthibitisho wake havilingani.' });
  }

  const db = loadDB();
  const user = db.users.find((u) => u.resetToken === token);

  if (!user || !user.resetTokenExpires || Date.now() > user.resetTokenExpires) {
    return res.status(400).json({
      ok: false,
      message: 'Kiungo hiki kimekwisha muda wake (dakika 30). Omba kiungo kipya.'
    });
  }

  user.passwordHash = hashPassword(newPassword);
  user.resetToken = null;
  user.resetTokenExpires = null;
  saveDB(db);

  return res.json({
    ok: true,
    message: 'Nenosiri jipya limehifadhiwa kikamilifu! Sasa unaweza kuingia.'
  });
});

// ==========================================
// AUTHENTICATED PORTAL ENDPOINTS
// ==========================================

app.get('/api/bootstrap', authMiddleware, (req, res) => {
  const db = req.db;
  const isLeader = ['SUPER_ADMIN', 'ACCOUNTANT', 'CHAIRPERSON', 'SECRETARY'].includes(req.user.role);

  res.json({
    ok: true,
    user: sanitizeUser(req.user),
    funds: db.funds,
    ledger: db.ledger.slice(0, 60),
    payments: isLeader
      ? db.payments
      : db.payments.filter((p) => p.userId === req.user.id),
    disbursements: db.disbursements,
    welfareCases: db.welfareCases,
    events: db.events,
    tickets: isLeader
      ? db.tickets
      : db.tickets.filter((t) => t.userId === req.user.id),
    announcements: db.announcements,
    projects: db.projects,
    members: isLeader ? db.users.map(sanitizeUser) : [],
    paymentChannels: db.settings.paymentChannels || []
  });
});

// Member submits contribution / payment proof to a specific segregated fund
app.post('/api/payments/submit', authMiddleware, (req, res) => {
  const { fundId, amount, channel, txRef, note } = req.body || {};
  const numAmount = Number(amount);
  if (!fundId || !numAmount || numAmount <= 0 || !channel || !txRef) {
    return res.status(400).json({ ok: false, message: 'Jaza mfuko husika, kiasi, njia ya malipo, na namba ya muamala.' });
  }

  const db = req.db;
  const fund = db.funds.find((f) => f.id === fundId);
  if (!fund) {
    return res.status(404).json({ ok: false, message: 'Mfuko uliochaguliwa haupatikani.' });
  }

  const entry = {
    id: 'pay-' + crypto.randomBytes(4).toString('hex'),
    userId: req.user.id,
    wfcId: req.user.wfcId,
    memberName: req.user.fullName,
    category: 'CONTRIBUTION',
    fundId: fund.id,
    amount: numAmount,
    channel: String(channel).trim(),
    txRef: String(txRef).trim().toUpperCase(),
    note: String(note || `Mchango wa ${fund.name}`).trim(),
    status: 'PENDING',
    verifiedBy: null,
    createdAt: new Date().toISOString()
  };

  db.payments.unshift(entry);
  saveDB(db);

  res.status(201).json({ ok: true, message: 'Ushahidi wa malipo umetumwa kwa Mhasibu kwa uhakiki.', payment: entry });
});

// Accountant / Super Admin verifies or rejects payment proof
app.post('/api/payments/:id/verify', authMiddleware, requireRole(['SUPER_ADMIN', 'ACCOUNTANT']), (req, res) => {
  const { decision } = req.body || {}; // 'VERIFIED' or 'REJECTED'
  if (!['VERIFIED', 'REJECTED'].includes(decision)) {
    return res.status(400).json({ ok: false, message: 'Chagua VERIFIED au REJECTED.' });
  }

  const db = req.db;
  const payment = db.payments.find((p) => p.id === req.params.id);
  if (!payment) {
    return res.status(404).json({ ok: false, message: 'Muamala haupatikani.' });
  }
  if (payment.status !== 'PENDING') {
    return res.status(400).json({ ok: false, message: 'Muamala huu tayari umeshafanyiwa maamuzi.' });
  }

  payment.status = decision;
  payment.verifiedBy = `${req.user.fullName} (${req.user.wfcId})`;
  payment.verifiedAt = new Date().toISOString();

  if (decision === 'VERIFIED') {
    const fund = db.funds.find((f) => f.id === payment.fundId);
    if (fund) {
      fund.balance += Number(payment.amount);
      db.ledger.unshift({
        id: 'ldg-' + crypto.randomBytes(4).toString('hex'),
        fundId: fund.id,
        type: 'CREDIT',
        amount: Number(payment.amount),
        reference: payment.txRef,
        note: `${payment.memberName} (${payment.wfcId}) — ${payment.note}`,
        actorName: req.user.fullName,
        createdAt: new Date().toISOString()
      });
    }

    if (payment.category === 'REGISTRATION') {
      const member = db.users.find((u) => u.id === payment.userId);
      if (member) {
        member.status = 'ACTIVE';
      }
    }
  } else if (decision === 'REJECTED' && payment.category === 'REGISTRATION') {
    const member = db.users.find((u) => u.id === payment.userId);
    if (member) {
      member.status = 'REJECTED';
    }
  }

  saveDB(db);
  res.json({ ok: true, message: decision === 'VERIFIED' ? 'Malipo yamethibitishwa na kuingizwa kwenye mfuko husika.' : 'Malipo yamekataliwa.', payment });
});

// MAKER-CHECKER Step 1: Maker initiates disbursement from a segregated fund
app.post('/api/disbursements', authMiddleware, requireRole(['SUPER_ADMIN', 'ACCOUNTANT', 'CHAIRPERSON', 'SECRETARY']), (req, res) => {
  const { fundId, amount, beneficiary, purpose } = req.body || {};
  const numAmount = Number(amount);
  if (!fundId || !numAmount || numAmount <= 0 || !beneficiary || !purpose) {
    return res.status(400).json({ ok: false, message: 'Jaza mfuko husika, kiasi, mnufaika, na sababu ya matumizi.' });
  }

  const db = req.db;
  const fund = db.funds.find((f) => f.id === fundId);
  if (!fund) {
    return res.status(404).json({ ok: false, message: 'Mfuko haupatikani.' });
  }
  if (fund.balance < numAmount) {
    return res.status(400).json({
      ok: false,
      message: `Salio la ${fund.name} (TSh ${fund.balance.toLocaleString()}) halitoshi kutoa TSh ${numAmount.toLocaleString()}.`
    });
  }

  const item = {
    id: 'dsb-' + crypto.randomBytes(4).toString('hex'),
    fundId: fund.id,
    amount: numAmount,
    beneficiary: String(beneficiary).trim(),
    purpose: String(purpose).trim(),
    makerId: req.user.id,
    makerName: req.user.fullName,
    checkerId: null,
    checkerName: null,
    status: 'PENDING_CHECKER',
    createdAt: new Date().toISOString(),
    decidedAt: null
  };

  db.disbursements.unshift(item);
  saveDB(db);

  res.status(201).json({
    ok: true,
    message: 'Ombi la matumizi limeanzishwa (Maker). Linasubiri kiongozi mwingine (Checker) kuidhinisha.',
    disbursement: item
  });
});

// MAKER-CHECKER Step 2: Checker approves or rejects (Enforces makerId !== checkerId)
app.post('/api/disbursements/:id/decide', authMiddleware, requireRole(['SUPER_ADMIN', 'ACCOUNTANT', 'CHAIRPERSON']), (req, res) => {
  const { decision } = req.body || {}; // 'APPROVED' or 'REJECTED'
  if (!['APPROVED', 'REJECTED'].includes(decision)) {
    return res.status(400).json({ ok: false, message: 'Chagua APPROVED au REJECTED.' });
  }

  const db = req.db;
  const item = db.disbursements.find((d) => d.id === req.params.id);
  if (!item) {
    return res.status(404).json({ ok: false, message: 'Ombi halipatikani.' });
  }
  if (item.status !== 'PENDING_CHECKER') {
    return res.status(400).json({ ok: false, message: 'Ombi hili tayari limeshafanyiwa maamuzi.' });
  }
  if (item.makerId === req.user.id) {
    return res.status(403).json({
      ok: false,
      message: 'Kanuni ya Maker-Checker: Huwezi kuidhinisha muamala uliouanzisha wewe mwenyewe!'
    });
  }

  const fund = db.funds.find((f) => f.id === item.fundId);
  if (decision === 'APPROVED') {
    if (!fund || fund.balance < item.amount) {
      return res.status(400).json({ ok: false, message: 'Salio la mfuko husika halitoshi tena.' });
    }
    fund.balance -= item.amount;
    db.ledger.unshift({
      id: 'ldg-' + crypto.randomBytes(4).toString('hex'),
      fundId: fund.id,
      type: 'DEBIT',
      amount: item.amount,
      reference: item.id.toUpperCase(),
      note: `Malipo kwa ${item.beneficiary}: ${item.purpose} (Maker: ${item.makerName}, Checker: ${req.user.fullName})`,
      actorName: req.user.fullName,
      createdAt: new Date().toISOString()
    });
  }

  item.status = decision;
  item.checkerId = req.user.id;
  item.checkerName = req.user.fullName;
  item.decidedAt = new Date().toISOString();
  saveDB(db);

  res.json({
    ok: true,
    message: decision === 'APPROVED' ? 'Muamala umeidhinishwa (Checker) na salio la mfuko limesasishwa.' : 'Muamala umekataliwa.',
    disbursement: item
  });
});

// Buy Event Ticket
app.post('/api/tickets/buy', authMiddleware, (req, res) => {
  const { eventId, quantity, txRef } = req.body || {};
  const qty = Math.max(1, parseInt(quantity, 10) || 1);
  if (!eventId || !txRef) {
    return res.status(400).json({ ok: false, message: 'Chagua tukio na weka namba ya muamala.' });
  }

  const db = req.db;
  const ev = db.events.find((e) => e.id === eventId);
  if (!ev) {
    return res.status(404).json({ ok: false, message: 'Tukio halipatikani.' });
  }

  const totalPaid = ev.ticketPrice * qty;
  const ticket = {
    id: 'tkt-' + crypto.randomBytes(4).toString('hex'),
    ticketCode: 'WFC-TKT-' + Math.floor(10000 + Math.random() * 90000),
    eventId: ev.id,
    eventTitle: ev.title,
    userId: req.user.id,
    memberName: req.user.fullName,
    wfcId: req.user.wfcId,
    quantity: qty,
    totalPaid,
    txRef: String(txRef).trim().toUpperCase(),
    status: 'CONFIRMED',
    createdAt: new Date().toISOString()
  };

  db.tickets.unshift(ticket);
  db.payments.unshift({
    id: 'pay-' + crypto.randomBytes(4).toString('hex'),
    userId: req.user.id,
    wfcId: req.user.wfcId,
    memberName: req.user.fullName,
    category: 'TICKET',
    fundId: ev.fundId,
    amount: totalPaid,
    channel: 'Mobile / Bank',
    txRef: ticket.txRef,
    note: `Tiketi ${qty}x — ${ev.title} (${ticket.ticketCode})`,
    status: 'PENDING',
    verifiedBy: null,
    createdAt: new Date().toISOString()
  });

  saveDB(db);
  res.status(201).json({ ok: true, message: 'Tiketi yako imetengenezwa!', ticket });
});

// Create Announcement (Leaders)
app.post('/api/announcements', authMiddleware, requireRole(['SUPER_ADMIN', 'CHAIRPERSON', 'SECRETARY']), (req, res) => {
  const { title, category, content } = req.body || {};
  if (!title || !content) {
    return res.status(400).json({ ok: false, message: 'Weka kichwa cha tangazo na maelezo.' });
  }
  const db = req.db;
  const ann = {
    id: 'ann-' + crypto.randomBytes(4).toString('hex'),
    title: String(title).trim(),
    category: String(category || 'TAARIFA RASMI').trim(),
    author: `${req.user.fullName} (${req.user.role})`,
    content: String(content).trim(),
    createdAt: new Date().toISOString()
  };
  db.announcements.unshift(ann);
  saveDB(db);
  res.status(201).json({ ok: true, announcement: ann });
});

// Create Welfare Case (Bereavement / Wedding)
app.post('/api/welfare', authMiddleware, requireRole(['SUPER_ADMIN', 'CHAIRPERSON', 'SECRETARY', 'ACCOUNTANT']), (req, res) => {
  const { type, title, memberName, targetAmount, details } = req.body || {};
  if (!type || !title || !memberName) {
    return res.status(400).json({ ok: false, message: 'Jaza aina, kichwa na jina la mwanachama.' });
  }
  const db = req.db;
  const cleanType = type === 'HARUSI' ? 'HARUSI' : 'RAMBIRAMBI';
  const entry = {
    id: 'wlf-' + crypto.randomBytes(4).toString('hex'),
    type: cleanType,
    title: String(title).trim(),
    memberName: String(memberName).trim(),
    fundId: cleanType === 'HARUSI' ? 'WEDDING_FUND' : 'BEREAVEMENT_FUND',
    targetAmount: Number(targetAmount) || 1000000,
    collectedAmount: 0,
    status: 'ACTIVE',
    details: String(details || '').trim()
  };
  db.welfareCases.unshift(entry);
  saveDB(db);
  res.status(201).json({ ok: true, welfare: entry });
});

// Update member role (Super Admin)
app.post('/api/members/:id/role', authMiddleware, requireRole(['SUPER_ADMIN']), (req, res) => {
  const { role } = req.body || {};
  if (!['SUPER_ADMIN', 'ACCOUNTANT', 'CHAIRPERSON', 'SECRETARY', 'MEMBER'].includes(role)) {
    return res.status(400).json({ ok: false, message: 'Cheo si sahihi.' });
  }
  const db = req.db;
  const member = db.users.find((u) => u.id === req.params.id);
  if (!member) return res.status(404).json({ ok: false, message: 'Mwanachama hapatikani.' });
  member.role = role;
  saveDB(db);
  res.json({ ok: true, member: sanitizeUser(member) });
});

// Admin Email / Resend API Settings
app.get('/api/admin/settings', authMiddleware, requireRole(['SUPER_ADMIN']), (req, res) => {
  const db = req.db;
  const effectiveKey = process.env.RESEND_API_KEY || db.settings.resendApiKey || '';
  res.json({
    ok: true,
    hasResendKey: Boolean(effectiveKey),
    maskedKey: effectiveKey ? `${effectiveKey.slice(0, 6)}••••••••${effectiveKey.slice(-4)}` : '',
    emailFrom: process.env.EMAIL_FROM || db.settings.emailFrom || 'Wachagga Family Community <onboarding@resend.dev>',
    source: process.env.RESEND_API_KEY ? 'Railway Environment Variable' : (db.settings.resendApiKey ? 'Admin Portal Settings' : 'Haijawekwa (Preview Mode)')
  });
});

app.post('/api/admin/settings', authMiddleware, requireRole(['SUPER_ADMIN']), (req, res) => {
  const { resendApiKey, emailFrom } = req.body || {};
  const db = req.db;
  if (typeof resendApiKey === 'string' && resendApiKey.trim()) {
    db.settings.resendApiKey = resendApiKey.trim();
  }
  if (typeof emailFrom === 'string' && emailFrom.trim()) {
    db.settings.emailFrom = emailFrom.trim();
  }
  saveDB(db);
  res.json({ ok: true, message: 'Mipangilio ya Resend Email API imehifadhiwa kikamilifu.' });
});

// Serve /app and fallback routes to index.html
app.get(['/', '/app', '/app/*'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Wachagga Family Community (WFC) Portal v3 running on port ${PORT}`);
});
