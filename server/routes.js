const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { queryAll, queryOne, runSql } = require('./db');
const { JWT_SECRET, upload, authenticateToken, requireRoles } = require('./middleware');

const router = express.Router();

// Public summary for Landing Page
router.get('/public/summary', (req, res) => {
  try {
    const countRow = queryOne('SELECT COUNT(*) AS total FROM users');
    const memberCount = 470 + (countRow ? Number(countRow.total) : 5);
    const announcements = queryAll('SELECT * FROM announcements ORDER BY id DESC LIMIT 6');
    const projects = queryAll('SELECT * FROM projects ORDER BY id ASC');
    res.json({
      memberCount,
      announcements,
      projects
    });
  } catch (err) {
    res.status(500).json({ error: 'Imeshindwa kupakia taarifa za jumuiya.' });
  }
});

// Auth: Login
router.post('/auth/login', (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) {
    return res.status(400).json({ error: 'Weka namba ya simu na nenosiri.' });
  }
  const cleanPhone = String(phone).replace(/\s+/g, '');
  const user = queryOne('SELECT * FROM users WHERE phone = ?', [cleanPhone]);
  if (!user) {
    return res.status(401).json({ error: 'Akaunti yenye namba hii haikupatikana.' });
  }
  const valid = bcrypt.compareSync(String(password), user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Nenosiri uliloweka si sahihi.' });
  }
  const payload = {
    id: user.id,
    wfc_id: user.wfc_id,
    fullname: user.fullname,
    phone: user.phone,
    clan: user.clan,
    region: user.region,
    role: user.role
  };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: payload });
});

// Auth: Register New Member
router.post('/auth/register', (req, res) => {
  const { fullname, phone, clan, region, password } = req.body;
  if (!fullname || !phone || !password) {
    return res.status(400).json({ error: 'Jina kamili, namba ya simu na nenosiri vinahitajika.' });
  }
  const cleanPhone = String(phone).replace(/\s+/g, '');
  const existing = queryOne('SELECT id FROM users WHERE phone = ?', [cleanPhone]);
  if (existing) {
    return res.status(409).json({ error: 'Namba hii ya simu tayari imesajiliwa WFC.' });
  }
  const countRow = queryOne('SELECT COUNT(*) AS total FROM users');
  const nextSeq = 476 + (countRow ? Number(countRow.total) : 0);
  const wfcId = `WFC-2026-${String(nextSeq).padStart(4, '0')}`;
  const hash = bcrypt.hashSync(String(password), 10);

  const userId = runSql(
    'INSERT INTO users (wfc_id, fullname, phone, clan, region, role, password_hash) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [wfcId, fullname.trim(), cleanPhone, (clan || 'Mushi').trim(), (region || 'Dar es Salaam').trim(), 'member', hash]
  );

  const payload = {
    id: userId,
    wfc_id: wfcId,
    fullname: fullname.trim(),
    phone: cleanPhone,
    clan: (clan || 'Mushi').trim(),
    region: (region || 'Dar es Salaam').trim(),
    role: 'member'
  };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({ token, user: payload });
});

// Auth: Current User
router.get('/auth/me', authenticateToken, (req, res) => {
  const user = queryOne(
    'SELECT id, wfc_id, fullname, phone, clan, region, role, status, created_at FROM users WHERE id = ?',
    [req.user.id]
  );
  if (!user) return res.status(404).json({ error: 'Mwanachama hakupatikana.' });
  res.json({ user });
});

// Public Event Ticketing: Book Ticket
router.post('/tickets/book', (req, res) => {
  const { fullname, phone, tier, quantity, channel, reference_code } = req.body;
  if (!fullname || !phone) {
    return res.status(400).json({ error: 'Jina kamili na namba ya simu vinahitajika.' });
  }
  const tierPrices = {
    Regular: 25000,
    VIP: 60000,
    Familia: 120000
  };
  const selectedTier = tierPrices[tier] ? tier : 'Regular';
  const unitPrice = tierPrices[selectedTier];
  const qty = Math.max(1, Math.min(20, Number(quantity) || 1));
  const totalAmount = unitPrice * qty;
  const randomCode = Math.floor(100000 + Math.random() * 900000);
  const ticketCode = `WFC-TKT-${randomCode}`;
  const cleanPhone = String(phone).replace(/\s+/g, '');
  const ref = (reference_code || `PAY-${randomCode}`).trim();

  runSql(
    'INSERT INTO tickets (ticket_code, event_title, fullname, phone, tier, quantity, unit_price, total_amount, channel, reference_code, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [ticketCode, 'Wachagga Family Community Festival 2026', fullname.trim(), cleanPhone, selectedTier, qty, unitPrice, totalAmount, channel || 'M-Pesa', ref, 'confirmed']
  );

  const ticket = queryOne('SELECT * FROM tickets WHERE ticket_code = ?', [ticketCode]);
  res.status(201).json({ ticket });
});

// Public Event Ticketing: Verify / Lookup Ticket
router.get('/tickets/verify/:query', (req, res) => {
  const q = String(req.params.query || '').trim().replace(/\s+/g, '');
  if (!q) return res.status(400).json({ error: 'Ingiza namba ya tiketi au simu.' });
  const tickets = queryAll(
    'SELECT * FROM tickets WHERE UPPER(ticket_code) = UPPER(?) OR phone = ? ORDER BY id DESC',
    [q, q]
  );
  if (!tickets.length) {
    return res.status(404).json({ error: 'Hakuna tiketi iliyopatikana kwa taarifa hizo.' });
  }
  res.json({ tickets });
});

// Dashboard Overview
router.get('/dashboard/overview', authenticateToken, (req, res) => {
  const totalFundRow = queryOne("SELECT COALESCE(SUM(amount), 0) AS total FROM transactions WHERE stage != 'rejected'");
  const myContribRow = queryOne("SELECT COALESCE(SUM(amount), 0) AS total FROM transactions WHERE user_id = ? AND stage != 'rejected'", [req.user.id]);
  const pendingRow = queryOne("SELECT COUNT(*) AS count FROM transactions WHERE stage IN ('pending_treasurer', 'verified_treasurer', 'approved_secretary')");
  const welfareRow = queryOne("SELECT COUNT(*) AS count FROM welfare_cases WHERE status = 'active'");
  const usersRow = queryOne('SELECT COUNT(*) AS total FROM users');

  const recentTransactions = queryAll('SELECT * FROM transactions ORDER BY id DESC LIMIT 6');
  const activeWelfare = queryAll("SELECT * FROM welfare_cases WHERE status = 'active' ORDER BY id DESC LIMIT 3");
  const announcements = queryAll('SELECT * FROM announcements ORDER BY id DESC LIMIT 3');

  res.json({
    stats: {
      totalFund: (totalFundRow ? Number(totalFundRow.total) : 0) + 18450000,
      myContributions: myContribRow ? Number(myContribRow.total) : 0,
      pendingApprovals: pendingRow ? Number(pendingRow.count) : 0,
      activeWelfareCount: welfareRow ? Number(welfareRow.count) : 0,
      activeMembers: 470 + (usersRow ? Number(usersRow.total) : 5)
    },
    recentTransactions,
    activeWelfare,
    announcements
  });
});

// Transactions: List
router.get('/transactions', authenticateToken, (req, res) => {
  const rows = queryAll('SELECT * FROM transactions ORDER BY id DESC');
  res.json({ transactions: rows });
});

// Transactions: Submit New Contribution with Optional Receipt Image
router.post('/transactions', authenticateToken, upload.single('receipt_image'), (req, res) => {
  const { category, amount, channel, reference_code, notes } = req.body;
  const numAmount = Number(amount);
  if (!category || !numAmount || numAmount <= 0 || !channel || !reference_code) {
    return res.status(400).json({ error: 'Jaza aina ya mchango, kiasi, njia ya malipo na namba ya muamala.' });
  }
  const receiptNo = `WFC-RCT-2026-${Math.floor(100 + Math.random() * 900)}`;
  const receiptImage = req.file ? `/uploads/${req.file.filename}` : '';

  const id = runSql(
    'INSERT INTO transactions (receipt_no, user_id, member_name, wfc_id, category, amount, channel, reference_code, receipt_image, notes, stage) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [receiptNo, req.user.id, req.user.fullname, req.user.wfc_id, category, numAmount, channel, reference_code.trim(), receiptImage, (notes || '').trim(), 'pending_treasurer']
  );

  const created = queryOne('SELECT * FROM transactions WHERE id = ?', [id]);
  res.status(201).json({ transaction: created });
});

// Transactions: Multi-Tier Approval Workflow (Mhasibu -> Katibu -> Mwenyekiti)
router.put(
  '/transactions/:id/stage',
  authenticateToken,
  requireRoles(['super_admin', 'treasurer', 'secretary', 'chairperson']),
  (req, res) => {
    const { stage } = req.body;
    const allowedStages = ['verified_treasurer', 'approved_secretary', 'approved_chairperson', 'rejected'];
    if (!allowedStages.includes(stage)) {
      return res.status(400).json({ error: 'Hatua ya uidhinishaji si sahihi.' });
    }
    runSql(
      'UPDATE transactions SET stage = ?, approved_by = ? WHERE id = ?',
      [stage, req.user.fullname, Number(req.params.id)]
    );
    const updated = queryOne('SELECT * FROM transactions WHERE id = ?', [Number(req.params.id)]);
    res.json({ transaction: updated });
  }
);

// Welfare Cases: List
router.get('/welfare', authenticateToken, (req, res) => {
  const cases = queryAll('SELECT * FROM welfare_cases ORDER BY id DESC');
  res.json({ cases });
});

// Welfare Cases: Create
router.post('/welfare', authenticateToken, (req, res) => {
  const { type, member_name, region, title, description, target_amount } = req.body;
  if (!type || !member_name || !title || !description) {
    return res.status(400).json({ error: 'Tafadhali jaza taarifa zote za tukio la kijamii.' });
  }
  const caseCode = `WFC-WLF-${Math.floor(10 + Math.random() * 90)}`;
  const id = runSql(
    'INSERT INTO welfare_cases (case_code, type, member_name, wfc_id, region, title, description, target_amount, collected_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [caseCode, type, member_name.trim(), req.user.wfc_id, (region || req.user.region).trim(), title.trim(), description.trim(), Number(target_amount) || 1500000, 0]
  );
  const created = queryOne('SELECT * FROM welfare_cases WHERE id = ?', [id]);
  res.status(201).json({ welfareCase: created });
});

// Welfare Cases: Record Support Contribution
router.post('/welfare/:id/contribute', authenticateToken, (req, res) => {
  const amount = Number(req.body.amount);
  const channel = req.body.channel || 'M-Pesa';
  const reference_code = req.body.reference_code || `WLF-${Date.now().toString().slice(-6)}`;
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Weka kiasi sahihi cha mchango.' });
  }
  const wCase = queryOne('SELECT * FROM welfare_cases WHERE id = ?', [Number(req.params.id)]);
  if (!wCase) return res.status(404).json({ error: 'Tukio halikupatikana.' });

  runSql('UPDATE welfare_cases SET collected_amount = collected_amount + ? WHERE id = ?', [amount, wCase.id]);

  const receiptNo = `WFC-RCT-2026-${Math.floor(100 + Math.random() * 900)}`;
  runSql(
    'INSERT INTO transactions (receipt_no, user_id, member_name, wfc_id, category, amount, channel, reference_code, notes, stage) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [receiptNo, req.user.id, req.user.fullname, req.user.wfc_id, `${wCase.type} (${wCase.case_code})`, amount, channel, reference_code, wCase.title, 'pending_treasurer']
  );

  const updated = queryOne('SELECT * FROM welfare_cases WHERE id = ?', [wCase.id]);
  res.json({ welfareCase: updated });
});

// Announcements: List & Create
router.get('/announcements', authenticateToken, (req, res) => {
  const announcements = queryAll('SELECT * FROM announcements ORDER BY id DESC');
  res.json({ announcements });
});

router.post(
  '/announcements',
  authenticateToken,
  requireRoles(['super_admin', 'chairperson', 'secretary', 'treasurer', 'regional_leader']),
  (req, res) => {
    const { category, title, body, meet_link } = req.body;
    if (!title || !body) {
      return res.status(400).json({ error: 'Kichwa cha tangazo na ujumbe vinahitajika.' });
    }
    const id = runSql(
      'INSERT INTO announcements (category, title, body, meet_link, author_name, author_role, likes_count) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [category || 'TAARIFA', title.trim(), body.trim(), (meet_link || '').trim(), req.user.fullname, req.user.role, 1]
    );
    const created = queryOne('SELECT * FROM announcements WHERE id = ?', [id]);
    res.status(201).json({ announcement: created });
  }
);

router.post('/announcements/:id/like', authenticateToken, (req, res) => {
  runSql('UPDATE announcements SET likes_count = likes_count + 1 WHERE id = ?', [Number(req.params.id)]);
  const updated = queryOne('SELECT * FROM announcements WHERE id = ?', [Number(req.params.id)]);
  res.json({ announcement: updated });
});

// Projects: List
router.get('/projects', authenticateToken, (req, res) => {
  const projects = queryAll('SELECT * FROM projects ORDER BY id ASC');
  res.json({ projects });
});

// Members: Directory & Role Update
router.get('/members', authenticateToken, (req, res) => {
  const members = queryAll(
    'SELECT id, wfc_id, fullname, phone, clan, region, role, status, created_at FROM users ORDER BY id ASC'
  );
  res.json({ members });
});

router.put(
  '/members/:id/role',
  authenticateToken,
  requireRoles(['super_admin', 'chairperson', 'secretary']),
  (req, res) => {
    const { role } = req.body;
    const validRoles = ['super_admin', 'chairperson', 'secretary', 'treasurer', 'regional_leader', 'member'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Cheo kilichochaguliwa si sahihi.' });
    }
    runSql('UPDATE users SET role = ? WHERE id = ?', [role, Number(req.params.id)]);
    const updated = queryOne(
      'SELECT id, wfc_id, fullname, phone, clan, region, role, status FROM users WHERE id = ?',
      [Number(req.params.id)]
    );
    res.json({ member: updated });
  }
);

// Tickets: List in Dashboard
router.get('/tickets', authenticateToken, (req, res) => {
  const isLeader = ['super_admin', 'chairperson', 'secretary', 'treasurer'].includes(req.user.role);
  const tickets = isLeader
    ? queryAll('SELECT * FROM tickets ORDER BY id DESC')
    : queryAll('SELECT * FROM tickets WHERE phone = ? ORDER BY id DESC', [req.user.phone]);
  res.json({ tickets });
});

module.exports = router;
