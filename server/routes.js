const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { run, get, all } = require('./db');
const {
  JWT_SECRET,
  upload,
  authRequired,
  optionalAuth,
  requireRole,
  logAudit,
  notifyUser
} = require('./middleware');

const router = express.Router();

// Helper: compute member financial summary
function getMemberSummary(userId) {
  const user = get('SELECT * FROM users WHERE id = ?', [userId]);
  if (!user) return null;

  const settingsRows = all('SELECT key, value FROM settings');
  const settings = {};
  settingsRows.forEach(r => settings[r.key] = r.value);

  const entryTarget = Number(settings.entry_fee || 50000);
  const monthlyRate = Number(settings.monthly_fee || 10000);
  const emergencyTarget = Number(settings.emergency_fee || 60000);

  const approvedPayments = all('SELECT * FROM payments WHERE user_id = ? AND status = "approved"', [userId]);
  const pendingPayments = all('SELECT * FROM payments WHERE user_id = ? AND status = "pending"', [userId]);

  let totalPaid = 0;
  let entryPaid = 0;
  let monthlyPaid = 0;
  let emergencyPaid = 0;
  let otherPaid = 0;

  approvedPayments.forEach(p => {
    const amt = Number(p.amount || 0);
    totalPaid += amt;
    if (p.fund_account === 'kiingilio') entryPaid += amt;
    else if (p.fund_account === 'ada') monthlyPaid += amt;
    else if (p.fund_account === 'dharura') emergencyPaid += amt;
    else otherPaid += amt;
  });

  // Calculate expected monthly fees since joined_date (or months_owed baseline)
  let monthsElapsed = 1;
  if (user.joined_date) {
    const jd = new Date(user.joined_date);
    const now = new Date();
    const diff = (now.getFullYear() - jd.getFullYear()) * 12 + (now.getMonth() - jd.getMonth()) + 1;
    monthsElapsed = Math.max(1, diff);
  }
  const expectedMonthlyTotal = monthsElapsed * monthlyRate;
  const monthlyDebt = Math.max(0, expectedMonthlyTotal - monthlyPaid);
  const entryDebt = Math.max(0, entryTarget - entryPaid);
  const emergencyDebt = Math.max(0, emergencyTarget - emergencyPaid);
  const totalDebt = monthlyDebt + entryDebt + emergencyDebt;

  // Refunds / Benefits received by this member
  const disbursements = all(
    'SELECT * FROM expenses WHERE recipient_user_id = ? AND status = "approved" ORDER BY created_at DESC',
    [userId]
  );

  // Active campaigns & whether member already contributed
  const activeCampaigns = all('SELECT * FROM campaigns WHERE status = "active" ORDER BY created_at DESC');
  const actionableCampaigns = activeCampaigns.map(c => {
    const contrib = get(
      'SELECT SUM(amount) as paid FROM payments WHERE user_id = ? AND campaign_id = ? AND status IN ("approved", "pending")',
      [userId, c.id]
    );
    const paidAmt = Number((contrib && contrib.paid) || 0);
    return {
      ...c,
      member_paid: paidAmt,
      is_completed: c.target_per_member > 0 ? paidAmt >= c.target_per_member : paidAmt > 0
    };
  });

  return {
    user: {
      id: user.id,
      wfc_id: user.wfc_id,
      full_name: user.full_name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      status: user.status,
      region: user.region,
      district: user.district,
      branch: user.branch,
      home_origin: user.home_origin,
      joined_date: user.joined_date
    },
    finances: {
      total_paid: totalPaid,
      entry_paid: entryPaid,
      entry_debt: entryDebt,
      monthly_paid: monthlyPaid,
      monthly_debt: monthlyDebt,
      emergency_paid: emergencyPaid,
      emergency_debt: emergencyDebt,
      other_paid: otherPaid,
      total_debt: totalDebt,
      pending_count: pendingPayments.length,
      rates: { entryTarget, monthlyRate, emergencyTarget }
    },
    disbursements,
    actionable_campaigns: actionableCampaigns
  };
}

// ================= PUBLIC ENDPOINTS =================

router.get('/public/home', (req, res) => {
  const settingsRows = all('SELECT key, value FROM settings');
  const settings = {};
  settingsRows.forEach(r => settings[r.key] = r.value);

  const memberCountRow = get('SELECT COUNT(*) as c FROM users WHERE status = "active"');
  const totalMembers = 469 + (memberCountRow ? Number(memberCountRow.c) : 0);

  const posts = all(`
    SELECT p.*, u.full_name as author_name, u.role as author_role,
           (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comments_count
    FROM posts p
    LEFT JOIN users u ON p.author_id = u.id
    WHERE p.status = 'published'
    ORDER BY p.created_at DESC LIMIT 6
  `);

  const events = all(`
    SELECT e.*,
           (SELECT COALESCE(SUM(quantity), 0) FROM tickets t WHERE t.event_id = e.id AND t.status = 'approved') as sold_tickets
    FROM events e
    WHERE e.status = 'open'
    ORDER BY e.event_date ASC
  `);

  const projects = all('SELECT * FROM projects ORDER BY id ASC');

  res.json({
    stats: {
      total_members: totalMembers,
      system_status: 'ACTIVE'
    },
    settings,
    posts,
    events,
    projects
  });
});

// Register new member
router.post('/auth/register', (req, res) => {
  const { full_name, phone, password, region, district, branch, home_origin, email } = req.body;
  if (!full_name || !phone || !password) {
    return res.status(400).json({ error: 'Jina kamili, namba ya simu na nenosiri vinahitajika.' });
  }
  const cleanPhone = phone.trim().replace(/\s+/g, '');
  const existing = get('SELECT id FROM users WHERE phone = ?', [cleanPhone]);
  if (existing) {
    return res.status(400).json({ error: 'Namba hii ya simu tayari imesajiliwa kwenye WFC.' });
  }

  const countRow = get('SELECT MAX(id) as maxId FROM users');
  const nextNum = ((countRow && countRow.maxId) ? countRow.maxId : 0) + 1;
  const wfcId = 'WFC-' + String(nextNum).padStart(4, '0');
  const hash = bcrypt.hashSync(String(password), 10);
  const today = new Date().toISOString().slice(0, 10);

  run(`
    INSERT INTO users (wfc_id, full_name, phone, email, password_hash, role, status, region, district, branch, home_origin, joined_date)
    VALUES (?, ?, ?, ?, ?, 'member', 'pending', ?, ?, ?, ?, ?)
  `, [wfcId, full_name.trim(), cleanPhone, email || '', hash, region || 'Dar es Salaam', district || '', branch || '', home_origin || '', today]);

  const newUser = get('SELECT * FROM users WHERE wfc_id = ?', [wfcId]);
  notifyUser(newUser.id, 'Usajili Umepokelewa!', `Karibu ${newUser.full_name}! Namba yako ya WFC ni ${wfcId}. Lipa Kiingilio (TSh 50,000) ili akaunti yako iwe Hai (Active).`);
  logAudit(newUser, 'MEMBER_REGISTER', `Mwanachama mpya amejisajili: ${newUser.full_name} (${wfcId})`);

  const token = jwt.sign({ id: newUser.id, wfc_id: newUser.wfc_id, full_name: newUser.full_name, role: newUser.role, region: newUser.region }, JWT_SECRET, { expiresIn: '7d' });

  res.json({
    message: 'Usajili umekamilika! Namba yako ya utambulisho ni ' + wfcId,
    token,
    user: { id: newUser.id, wfc_id: newUser.wfc_id, full_name: newUser.full_name, role: newUser.role, status: newUser.status }
  });
});

// Simple Login (Phone OR WFC ID + Password/PIN)
router.post('/auth/login', (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ error: 'Weka namba ya simu (au WFC ID) na nenosiri.' });
  }
  const cleanId = identifier.trim().replace(/\s+/g, '');
  const user = get('SELECT * FROM users WHERE phone = ? OR UPPER(wfc_id) = UPPER(?)', [cleanId, cleanId]);
  if (!user) {
    return res.status(401).json({ error: 'Akaunti haijapatikana. Hakikisha namba ya simu au WFC ID.' });
  }
  if (user.status === 'suspended' || user.status === 'exited') {
    return res.status(403).json({ error: 'Akaunti yako imesimamishwa au imefungwa. Wasiliana na uongozi wa WFC.' });
  }
  const valid = bcrypt.compareSync(String(password), user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Nenosiri si sahihi. Jaribu tena.' });
  }

  const token = jwt.sign(
    { id: user.id, wfc_id: user.wfc_id, full_name: user.full_name, role: user.role, region: user.region },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      wfc_id: user.wfc_id,
      full_name: user.full_name,
      phone: user.phone,
      role: user.role,
      status: user.status,
      region: user.region
    }
  });
});

// Public Event Ticket Booking
router.post('/public/tickets/book', upload.single('proof_image'), (req, res) => {
  const { event_id, buyer_name, buyer_phone, tier, quantity, payment_method, transaction_ref, sms_text, user_id } = req.body;
  if (!event_id || !buyer_name || !buyer_phone || (!transaction_ref && !sms_text && !req.file)) {
    return res.status(400).json({ error: 'Jaza taarifa zote za mnunuzi na uthibitisho wa malipo (Namba ya muamala, SMS au Risiti).' });
  }

  const ev = get('SELECT * FROM events WHERE id = ?', [event_id]);
  if (!ev) return res.status(404).json({ error: 'Tukio halijapatikana.' });

  const cleanRef = (transaction_ref || '').trim().toUpperCase();
  if (cleanRef) {
    const dupTicket = get('SELECT id FROM tickets WHERE transaction_ref = ?', [cleanRef]);
    const dupPay = get('SELECT id FROM payments WHERE transaction_ref = ?', [cleanRef]);
    if (dupTicket || dupPay) {
      return res.status(400).json({ error: 'Namba hii ya muamala (' + cleanRef + ') tayari imeshatumika kwenye mfumo!' });
    }
  }

  const qty = Math.max(1, Number(quantity || 1));
  let unitPrice = Number(ev.regular_price || 20000);
  if (tier === 'VIP') unitPrice = Number(ev.vip_price || 50000);
  if (tier === 'Family') unitPrice = Number(ev.family_price || 100000);
  const totalAmount = unitPrice * qty;

  const ticketCode = 'WFC-TKT-' + Math.floor(100000 + Math.random() * 900000);
  const proofPath = req.file ? '/uploads/' + req.file.filename : '';

  run(`
    INSERT INTO tickets (ticket_code, event_id, user_id, buyer_name, buyer_phone, tier, quantity, total_amount, payment_method, transaction_ref, sms_text, proof_image, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `, [ticketCode, event_id, user_id || null, buyer_name.trim(), buyer_phone.trim(), tier || 'Regular', qty, totalAmount, payment_method || 'M-Pesa', cleanRef || ticketCode, sms_text || '', proofPath]);

  res.json({
    message: 'Ombi la tiketi limepokelewa! Mhasibu atathibitisha malipo yako muda mfupi ujao.',
    ticket_code: ticketCode,
    total_amount: totalAmount
  });
});

// Check ticket status publicly by code or phone
router.get('/public/tickets/check', (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json({ tickets: [] });
  const tickets = all(`
    SELECT t.*, e.title as event_title, e.venue, e.event_date
    FROM tickets t
    JOIN events e ON t.event_id = e.id
    WHERE UPPER(t.ticket_code) = UPPER(?) OR t.buyer_phone = ?
    ORDER BY t.created_at DESC
  `, [q, q]);
  res.json({ tickets });
});

// ================= MEMBER PORTAL ENDPOINTS =================

router.get('/me/dashboard', authRequired, (req, res) => {
  const summary = getMemberSummary(req.user.id);
  if (!summary) return res.status(404).json({ error: 'Mwanachama hajapatikana.' });

  const payments = all(`
    SELECT p.*, c.title as campaign_title
    FROM payments p
    LEFT JOIN campaigns c ON p.campaign_id = c.id
    WHERE p.user_id = ?
    ORDER BY p.created_at DESC
  `, [req.user.id]);

  const notifications = all(`
    SELECT * FROM notifications
    WHERE user_id = ? OR user_id = 0
    ORDER BY created_at DESC LIMIT 25
  `, [req.user.id]);

  const myTickets = all(`
    SELECT t.*, e.title as event_title, e.venue, e.event_date
    FROM tickets t
    JOIN events e ON t.event_id = e.id
    WHERE t.user_id = ? OR t.buyer_phone = ?
    ORDER BY t.created_at DESC
  `, [req.user.id, summary.user.phone]);

  const settingsRows = all('SELECT key, value FROM settings');
  const settings = {};
  settingsRows.forEach(r => settings[r.key] = r.value);

  res.json({
    ...summary,
    payments,
    notifications,
    tickets: myTickets,
    payment_channels: {
      mpesa: settings.mpesa_number,
      tigopesa: settings.tigopesa_number,
      airtel: settings.airtel_number,
      bank: settings.bank_details
    }
  });
});

router.post('/me/notifications/read', authRequired, (req, res) => {
  run('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user.id]);
  res.json({ ok: true });
});

// Submit Payment Proof (SMS or Screenshot)
router.post('/me/payments', authRequired, upload.single('proof_image'), (req, res) => {
  const { fund_account, campaign_id, amount, payment_method, transaction_ref, sms_text, for_month } = req.body;
  const amt = Number(amount || 0);
  if (!fund_account || amt <= 0) {
    return res.status(400).json({ error: 'Chagua aina ya mchango na weka kiasi sahihi.' });
  }
  if (!transaction_ref && !sms_text && !req.file) {
    return res.status(400).json({ error: 'Tafadhali weka namba ya muamala, bandika SMS ya muamala, au pakia picha ya risiti.' });
  }

  const cleanRef = (transaction_ref || '').trim().toUpperCase();
  if (cleanRef) {
    const dup = get('SELECT id FROM payments WHERE transaction_ref = ?', [cleanRef]);
    const dupT = get('SELECT id FROM tickets WHERE transaction_ref = ?', [cleanRef]);
    if (dup || dupT) {
      return res.status(400).json({ error: 'Namba hii ya muamala (' + cleanRef + ') tayari imeshatumika! Tafadhali weka muamala mpya.' });
    }
  }

  const receiptNo = 'WFC-REC-' + Date.now().toString().slice(-6) + Math.floor(10 + Math.random() * 89);
  const proofPath = req.file ? '/uploads/' + req.file.filename : '';

  run(`
    INSERT INTO payments (receipt_no, user_id, fund_account, campaign_id, amount, payment_method, transaction_ref, sms_text, proof_image, for_month, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `, [
    receiptNo,
    req.user.id,
    fund_account,
    campaign_id || null,
    amt,
    payment_method || 'M-Pesa',
    cleanRef || receiptNo,
    sms_text || '',
    proofPath,
    for_month || new Date().toISOString().slice(0, 7)
  ]);

  logAudit(req.user, 'PAYMENT_SUBMITTED', `Ametuma uthibitisho wa malipo TSh ${amt} (${fund_account})`);
  res.json({
    message: 'Uthibitisho wa malipo umetumwa kwa Mhasibu! Utapata taarifa na risiti rasmi pindi utakapothibitishwa.',
    receipt_no: receiptNo
  });
});

// ================= SOCIAL FEED & TEXT COMMENTS =================

router.get('/feed', authRequired, (req, res) => {
  const posts = all(`
    SELECT p.*, u.full_name as author_name, u.role as author_role,
           (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id) as likes_count,
           (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = ?) as user_liked
    FROM posts p
    LEFT JOIN users u ON p.author_id = u.id
    WHERE p.status = 'published'
    ORDER BY p.created_at DESC
  `, [req.user.id]);

  const enriched = posts.map(post => {
    const comments = all(`
      SELECT c.*, u.full_name, u.wfc_id, u.role
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `, [post.id]);
    return { ...post, comments };
  });

  res.json({ posts: enriched });
});

router.post('/feed', authRequired, requireRole('chairperson', 'secretary', 'treasurer', 'committee', 'regional_leader'), upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'document', maxCount: 1 }
]), (req, res) => {
  const { title, content, category, meet_link, event_date } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Kichwa cha habari na maelezo vinahitajika.' });
  }
  const imgFile = req.files && req.files.image ? '/uploads/' + req.files.image[0].filename : '';
  const docFile = req.files && req.files.document ? '/uploads/' + req.files.document[0].filename : '';
  const docName = req.files && req.files.document ? req.files.document[0].originalname : '';

  run(`
    INSERT INTO posts (title, content, category, meet_link, event_date, image_path, doc_path, doc_name, status, author_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'published', ?)
  `, [title.trim(), content.trim(), category || 'Tangazo', meet_link || '', event_date || '', imgFile, docFile, docName, req.user.id]);

  notifyUser(0, 'Tangazo Jipya WFC: ' + title.trim(), content.trim().slice(0, 100) + '...');
  logAudit(req.user, 'POST_CREATED', `Amechapisha tangazo: ${title}`);
  res.json({ message: 'Tangazo limechapishwa kwa wanachama wote!' });
});

router.post('/feed/:id/like', authRequired, (req, res) => {
  const postId = Number(req.params.id);
  const exists = get('SELECT * FROM post_likes WHERE post_id = ? AND user_id = ?', [postId, req.user.id]);
  if (exists) {
    run('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?', [postId, req.user.id]);
  } else {
    run('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)', [postId, req.user.id]);
  }
  res.json({ ok: true });
});

// Text-only comments
router.post('/feed/:id/comments', authRequired, (req, res) => {
  const postId = Number(req.params.id);
  const text = (req.body.comment_text || '').trim();
  if (!text) return res.status(400).json({ error: 'Andika maoni yako kwanza.' });
  if (text.length > 1000) return res.status(400).json({ error: 'Maoni yasizidi herufi 1000.' });

  run('INSERT INTO comments (post_id, user_id, comment_text) VALUES (?, ?, ?)', [postId, req.user.id, text]);
  res.json({ message: 'Maoni yameongezwa.' });
});

router.delete('/feed/comments/:commentId', authRequired, requireRole('chairperson', 'secretary', 'committee'), (req, res) => {
  run('DELETE FROM comments WHERE id = ?', [req.params.commentId]);
  logAudit(req.user, 'COMMENT_DELETED', `Amefuta maoni #${req.params.commentId}`);
  res.json({ ok: true });
});

// ================= LEADERSHIP & MULTI-LEVEL APPROVALS =================

router.get('/admin/overview', authRequired, requireRole('chairperson', 'secretary', 'treasurer', 'regional_leader', 'committee'), (req, res) => {
  // Regional filter for regional_leader
  const isRegional = req.user.role === 'regional_leader';
  const regionClause = isRegional ? `WHERE region = '${req.user.region.replace(/'/g, "''")}'` : '';

  const members = all(`SELECT id, wfc_id, full_name, phone, email, role, status, region, district, branch, home_origin, joined_date FROM users ${regionClause} ORDER BY id DESC`);

  // Fund balances
  const incomeByFund = all(`SELECT fund_account, COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'approved' GROUP BY fund_account`);
  const expenseByFund = all(`SELECT fund_account, COALESCE(SUM(amount), 0) as total FROM expenses WHERE status = 'approved' GROUP BY fund_account`);

  const fundsMap = {};
  ['kiingilio', 'ada', 'dharura', 'msiba', 'harusi', 'ugonjwa', 'miradi', 'festival'].forEach(f => {
    fundsMap[f] = { fund: f, income: 0, expense: 0, balance: 0 };
  });
  incomeByFund.forEach(r => {
    if (!fundsMap[r.fund_account]) fundsMap[r.fund_account] = { fund: r.fund_account, income: 0, expense: 0, balance: 0 };
    fundsMap[r.fund_account].income = Number(r.total);
  });
  expenseByFund.forEach(r => {
    if (!fundsMap[r.fund_account]) fundsMap[r.fund_account] = { fund: r.fund_account, income: 0, expense: 0, balance: 0 };
    fundsMap[r.fund_account].expense = Number(r.total);
  });
  Object.values(fundsMap).forEach(f => f.balance = f.income - f.expense);

  // Payments queue (Pending & recent)
  const payments = all(`
    SELECT p.*, u.full_name, u.wfc_id, u.phone, u.region, rev.full_name as reviewer_name
    FROM payments p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN users rev ON p.reviewed_by = rev.id
    ORDER BY CASE WHEN p.status = 'pending' THEN 0 ELSE 1 END, p.created_at DESC
    LIMIT 100
  `);

  // Multi-level Expenses & Disbursements (Misaada / Marejesho / Matumizi)
  const expenses = all(`
    SELECT ex.*,
           c.full_name as creator_name,
           s.full_name as secretary_name,
           ch.full_name as chairperson_name
    FROM expenses ex
    LEFT JOIN users c ON ex.created_by = c.id
    LEFT JOIN users s ON ex.secretary_by = s.id
    LEFT JOIN users ch ON ex.chairperson_by = ch.id
    ORDER BY ex.created_at DESC
  `);

  // Multi-level Campaigns (Misiba, Harusi, Ugonjwa, Miradi)
  const campaigns = all(`
    SELECT ca.*, cr.full_name as creator_name,
           (SELECT COALESCE(SUM(amount), 0) FROM payments p WHERE p.campaign_id = ca.id AND p.status = 'approved') as collected_amount
    FROM campaigns ca
    LEFT JOIN users cr ON ca.created_by = cr.id
    ORDER BY ca.created_at DESC
  `);

  // Tickets queue
  const tickets = all(`
    SELECT t.*, e.title as event_title
    FROM tickets t
    JOIN events e ON t.event_id = e.id
    ORDER BY CASE WHEN t.status = 'pending' THEN 0 ELSE 1 END, t.created_at DESC
  `);

  const events = all('SELECT * FROM events ORDER BY event_date DESC');
  const projects = all('SELECT * FROM projects ORDER BY id ASC');
  const auditLogs = all('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 60');
  const settingsRows = all('SELECT key, value FROM settings');
  const settings = {};
  settingsRows.forEach(r => settings[r.key] = r.value);

  res.json({
    members,
    funds: Object.values(fundsMap),
    payments,
    expenses,
    campaigns,
    tickets,
    events,
    projects,
    audit_logs: auditLogs,
    settings
  });
});

// Treasurer approves/rejects incoming payment
router.post('/admin/payments/:id/review', authRequired, requireRole('treasurer'), (req, res) => {
  const { decision, rejection_reason } = req.body; // approved | rejected
  const pay = get('SELECT * FROM payments WHERE id = ?', [req.params.id]);
  if (!pay) return res.status(404).json({ error: 'Malipo hayajapatikana.' });

  if (decision === 'approved') {
    run(`UPDATE payments SET status = 'approved', reviewed_by = ?, reviewed_at = datetime('now') WHERE id = ?`, [req.user.id, pay.id]);
    // If entry fee approved and member was pending, activate member
    if (pay.fund_account === 'kiingilio') {
      run(`UPDATE users SET status = 'active' WHERE id = ? AND status = 'pending'`, [pay.user_id]);
    }
    notifyUser(pay.user_id, 'Malipo Yamethibitishwa!', `Risiti ${pay.receipt_no}: Malipo yako ya TSh ${Number(pay.amount).toLocaleString()} (${pay.fund_account}) yamethibitishwa na Mhasibu.`);
    logAudit(req.user, 'PAYMENT_APPROVED', `Amethibitisha malipo ${pay.receipt_no} ya TSh ${pay.amount}`);
    return res.json({ message: 'Malipo yamethibitishwa na risiti imetolewa!' });
  } else {
    run(`UPDATE payments SET status = 'rejected', rejection_reason = ?, reviewed_by = ?, reviewed_at = datetime('now') WHERE id = ?`, [rejection_reason || 'Muamala haujathibitika', req.user.id, pay.id]);
    notifyUser(pay.user_id, 'Malipo Yamekataliwa', `Malipo yako ya TSh ${Number(pay.amount).toLocaleString()} hayakuthibitishwa. Sababu: ${rejection_reason || 'Muamala haujasoma'}`);
    logAudit(req.user, 'PAYMENT_REJECTED', `Amekataa malipo ${pay.receipt_no}: ${rejection_reason}`);
    return res.json({ message: 'Malipo yamekataliwa.' });
  }
});

// Multi-Level Expense / Aid / Refund Creation (Maker: Treasurer or Secretary)
router.post('/admin/expenses', authRequired, requireRole('treasurer', 'secretary', 'chairperson'), (req, res) => {
  const { fund_account, expense_type, recipient_user_id, recipient_name, amount, reason } = req.body;
  const amt = Number(amount || 0);
  if (!fund_account || amt <= 0 || !reason) {
    return res.status(400).json({ error: 'Jaza mfuko, kiasi na sababu ya matumizi/msaada.' });
  }

  let recName = recipient_name || '';
  if (recipient_user_id) {
    const u = get('SELECT full_name, wfc_id FROM users WHERE id = ?', [recipient_user_id]);
    if (u) recName = `${u.full_name} (${u.wfc_id})`;
  }

  const voucherNo = 'WFC-VCH-' + Date.now().toString().slice(-6);
  // If created by secretary, move directly to pending_chairperson; if treasurer, starts at pending_secretary
  const initialStatus = req.user.role === 'secretary' ? 'pending_chairperson' : 'pending_secretary';
  const secBy = req.user.role === 'secretary' ? req.user.id : null;

  run(`
    INSERT INTO expenses (voucher_no, fund_account, expense_type, recipient_user_id, recipient_name, amount, reason, status, created_by, secretary_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [voucherNo, fund_account, expense_type || 'matumizi', recipient_user_id || null, recName, amt, reason.trim(), initialStatus, req.user.id, secBy]);

  logAudit(req.user, 'EXPENSE_CREATED', `Ameanzisha vocha ${voucherNo} ya TSh ${amt} (${expense_type})`);
  res.json({ message: `Vocha ${voucherNo} imeanzishwa na kutumwa kwa ngazi inayofuata ya uidhinishaji.` });
});

// Multi-Level Expense Approval Step (Secretary -> Chairperson)
router.post('/admin/expenses/:id/approve', authRequired, requireRole('secretary', 'chairperson'), (req, res) => {
  const { decision, rejection_reason } = req.body;
  const ex = get('SELECT * FROM expenses WHERE id = ?', [req.params.id]);
  if (!ex) return res.status(404).json({ error: 'Vocha haijapatikana.' });

  if (decision === 'rejected') {
    run(`UPDATE expenses SET status = 'rejected', rejection_reason = ? WHERE id = ?`, [rejection_reason || 'Imekataliwa na uongozi', ex.id]);
    logAudit(req.user, 'EXPENSE_REJECTED', `Amekataa vocha ${ex.voucher_no}`);
    return res.json({ message: 'Vocha imekataliwa.' });
  }

  if (ex.status === 'pending_secretary' && (req.user.role === 'secretary' || req.user.role === 'superadmin')) {
    run(`UPDATE expenses SET status = 'pending_chairperson', secretary_by = ?, secretary_at = datetime('now') WHERE id = ?`, [req.user.id, ex.id]);
    logAudit(req.user, 'EXPENSE_VERIFIED_SECRETARY', `Katibu amehakiki vocha ${ex.voucher_no}`);
    return res.json({ message: 'Katibu amehakiki! Sasa inasubiri idhini ya mwisho ya Mwenyekiti.' });
  }

  if (ex.status === 'pending_chairperson' && (req.user.role === 'chairperson' || req.user.role === 'superadmin')) {
    run(`UPDATE expenses SET status = 'approved', chairperson_by = ?, chairperson_at = datetime('now') WHERE id = ?`, [req.user.id, ex.id]);
    if (ex.recipient_user_id) {
      notifyUser(ex.recipient_user_id, 'Msaada / Marejesho Yameidhinishwa!', `Vocha ${ex.voucher_no}: Umeidhinishiwa TSh ${Number(ex.amount).toLocaleString()} (${ex.reason}).`);
    }
    logAudit(req.user, 'EXPENSE_APPROVED_CHAIR', `Mwenyekiti ameidhinisha vocha ${ex.voucher_no} ya TSh ${ex.amount}`);
    return res.json({ message: 'Idhini ya mwisho imekamilika! Fedha zimerekodiwa rasmi.' });
  }

  return res.status(403).json({ error: 'Vocha hii haiko kwenye hatua yako ya uidhinishaji.' });
});

// Create & Approve Campaign (Msiba, Harusi, Ugonjwa, Mradi)
router.post('/admin/campaigns', authRequired, (req, res) => {
  const { title, category, description, target_per_member, target_total, beneficiary_name } = req.body;
  if (!title || !category) return res.status(400).json({ error: 'Jina la mchango na aina vinahitajika.' });

  let status = 'pending_secretary';
  if (req.user.role === 'secretary') status = 'pending_chairperson';
  if (req.user.role === 'chairperson' || req.user.role === 'superadmin') status = 'active';

  run(`
    INSERT INTO campaigns (title, category, description, target_per_member, target_total, beneficiary_name, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [title.trim(), category, description || '', Number(target_per_member || 0), Number(target_total || 0), beneficiary_name || '', status, req.user.id]);

  if (status === 'active') {
    notifyUser(0, 'Mchango Mpya wa Jumuiya: ' + title, description || 'Tafadhali shiriki kuchangia kupitia akaunti yako.');
  }
  logAudit(req.user, 'CAMPAIGN_CREATED', `Ameanzisha mchango: ${title} (${status})`);
  res.json({ message: status === 'active' ? 'Mchango umezinduliwa rasmi!' : 'Taarifa imetumwa kwa Katibu na Mwenyekiti kwa idhini.' });
});

router.post('/admin/campaigns/:id/approve', authRequired, requireRole('secretary', 'chairperson'), (req, res) => {
  const camp = get('SELECT * FROM campaigns WHERE id = ?', [req.params.id]);
  if (!camp) return res.status(404).json({ error: 'Haijapatikana.' });

  if (camp.status === 'pending_secretary' && (req.user.role === 'secretary' || req.user.role === 'superadmin')) {
    run(`UPDATE campaigns SET status = 'pending_chairperson', verified_by = ? WHERE id = ?`, [req.user.id, camp.id]);
    return res.json({ message: 'Katibu amethibitisha tukio. Linasubiri idhini ya Mwenyekiti.' });
  }
  if (camp.status === 'pending_chairperson' && (req.user.role === 'chairperson' || req.user.role === 'superadmin')) {
    run(`UPDATE campaigns SET status = 'active', approved_by = ? WHERE id = ?`, [req.user.id, camp.id]);
    notifyUser(0, 'Mchango Umeidhinishwa: ' + camp.title, camp.description || 'Ingia kwenye dashibodi yako kuchangia.');
    logAudit(req.user, 'CAMPAIGN_APPROVED', `Mwenyekiti ameidhinisha mchango: ${camp.title}`);
    return res.json({ message: 'Mchango umeidhinishwa na kutangazwa kwa wanachama wote!' });
  }
  res.status(403).json({ error: 'Hii haiko kwenye ngazi yako ya idhini.' });
});

// Member management (Update role / status)
router.post('/admin/members/:id/update', authRequired, requireRole('chairperson', 'secretary', 'regional_leader'), (req, res) => {
  const { status, role, region, district, branch } = req.body;
  const target = get('SELECT * FROM users WHERE id = ?', [req.params.id]);
  if (!target) return res.status(404).json({ error: 'Mwanachama hajapatikana.' });

  // Only superadmin or chairperson can assign leadership roles
  let newRole = target.role;
  if (role && (req.user.role === 'superadmin' || req.user.role === 'chairperson')) {
    newRole = role;
  }
  const newStatus = status || target.status;

  run(`UPDATE users SET status = ?, role = ?, region = ?, district = ?, branch = ? WHERE id = ?`, [
    newStatus, newRole, region || target.region, district || target.district, branch || target.branch, target.id
  ]);

  notifyUser(target.id, 'Taarifa za Uanachama Zimesasishwa', `Hali yako sasa ni: ${newStatus.toUpperCase()} | Cheo: ${newRole.toUpperCase()}.`);
  logAudit(req.user, 'MEMBER_UPDATED', `Amesasisha ${target.full_name} (${target.wfc_id}) -> status:${newStatus}, role:${newRole}`);
  res.json({ message: 'Taarifa za mwanachama zimesasishwa!' });
});

// Events & Ticket Approval + Gate Check-in
router.post('/admin/events', authRequired, requireRole('chairperson', 'secretary', 'committee'), (req, res) => {
  const { title, description, venue, event_date, regular_price, vip_price, family_price, total_capacity } = req.body;
  if (!title || !venue || !event_date) return res.status(400).json({ error: 'Jina la tukio, ukumbi na tarehe vinahitajika.' });

  run(`
    INSERT INTO events (title, description, venue, event_date, regular_price, vip_price, family_price, total_capacity, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open', ?)
  `, [title, description || '', venue, event_date, Number(regular_price || 20000), Number(vip_price || 50000), Number(family_price || 100000), Number(total_capacity || 500), req.user.id]);

  notifyUser(0, 'Tukio Jipya WFC: ' + title, `Ukumbi: ${venue} | Tarehe: ${event_date}. Kata tiketi yako sasa!`);
  logAudit(req.user, 'EVENT_CREATED', `Ametengeneza tukio: ${title}`);
  res.json({ message: 'Tukio limechapishwa na tiketi zimeanza kuuzwa!' });
});

router.post('/admin/tickets/:id/review', authRequired, requireRole('treasurer'), (req, res) => {
  const { decision } = req.body;
  const tkt = get('SELECT * FROM tickets WHERE id = ?', [req.params.id]);
  if (!tkt) return res.status(404).json({ error: 'Tiketi haijapatikana.' });

  run(`UPDATE tickets SET status = ?, reviewed_by = ? WHERE id = ?`, [decision, req.user.id, tkt.id]);
  if (tkt.user_id) {
    notifyUser(tkt.user_id, decision === 'approved' ? 'Tiketi Yako Imethibitishwa!' : 'Malipo ya Tiketi Hayakukubaliwa', `Namba ya Tiketi: ${tkt.ticket_code} (${tkt.tier} x${tkt.quantity}).`);
  }
  logAudit(req.user, 'TICKET_REVIEWED', `Tiketi ${tkt.ticket_code} -> ${decision}`);
  res.json({ message: 'Hali ya tiketi imesasishwa!' });
});

router.post('/admin/tickets/checkin', authRequired, requireRole('chairperson', 'secretary', 'treasurer', 'committee'), (req, res) => {
  const code = (req.body.ticket_code || '').trim().toUpperCase();
  const tkt = get('SELECT t.*, e.title as event_title FROM tickets t JOIN events e ON t.event_id = e.id WHERE UPPER(t.ticket_code) = ?', [code]);
  if (!tkt) return res.status(404).json({ error: 'Tiketi hii HAIPO kwenye mfumo!' });
  if (tkt.status !== 'approved') return res.status(400).json({ error: 'Tiketi hii BADO HAIJATHIBITISHWA malipo yake!' });
  if (tkt.checked_in === 1) return res.status(400).json({ error: `TAHADHARI: Tiketi hii ilishatumika kuingia saa ${tkt.checked_in_at}!` });

  run(`UPDATE tickets SET checked_in = 1, checked_in_at = datetime('now') WHERE id = ?`, [tkt.id]);
  logAudit(req.user, 'TICKET_CHECKIN', `Amekagua tiketi ${tkt.ticket_code} (${tkt.buyer_name})`);
  res.json({ message: `TIKETI HALALI! Karibu ${tkt.buyer_name} (${tkt.tier} - Watu ${tkt.quantity})`, ticket: tkt });
});

// Update System Settings
router.post('/admin/settings', authRequired, requireRole('chairperson', 'treasurer'), (req, res) => {
  const entries = Object.entries(req.body || {});
  for (const [k, v] of entries) {
    run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [k, String(v)]);
  }
  logAudit(req.user, 'SETTINGS_UPDATED', 'Amesasisha mipangilio ya viwango/akaunti za WFC');
  res.json({ message: 'Mipangilio imehifadhiwa!' });
});

module.exports = router;
