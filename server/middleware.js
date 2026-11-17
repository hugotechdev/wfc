const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { run } = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'wfc_pride_of_chagga_super_secret_key_2026';
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(__dirname, '..', 'public', 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '');
    const safeName = Date.now() + '-' + Math.round(Math.random() * 1e6) + ext;
    cb(null, safeName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Tafadhali ingia kwenye akaunti yako kwanza.' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Muda wa kuingia umeisha. Tafadhali ingia tena.' });
  }
}

function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch (e) {}
  }
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Huna ruhusa.' });
    if (req.user.role === 'superadmin' || roles.includes(req.user.role)) {
      return next();
    }
    return res.status(403).json({ error: 'Huna mamlaka ya kufanya kitendo hiki kwenye mfumo.' });
  };
}

function logAudit(user, action, details) {
  try {
    run(
      'INSERT INTO audit_logs (actor_id, actor_name, actor_role, action, details) VALUES (?, ?, ?, ?, ?)',
      [user ? user.id : 0, user ? user.full_name : 'System/Public', user ? user.role : 'guest', action, details]
    );
  } catch (e) {
    console.error('Audit log error:', e);
  }
}

function notifyUser(userId, title, message, link = '/portal.html') {
  try {
    run(
      'INSERT INTO notifications (user_id, title, message, link) VALUES (?, ?, ?, ?)',
      [userId, title, message, link]
    );
  } catch (e) {
    console.error('Notification error:', e);
  }
}

module.exports = {
  JWT_SECRET,
  UPLOADS_DIR,
  upload,
  authRequired,
  optionalAuth,
  requireRole,
  logAudit,
  notifyUser
};
