const crypto = require("crypto");

function securityHeaders(req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
}

const buckets = new Map();
function rateLimit(maxRequests = 20, windowMs = 15 * 60 * 1000) {
  return (req, res, next) => {
    const key = `${req.ip || "unknown"}:${req.path}`;
    const now = Date.now();
    const entry = buckets.get(key) || { count: 0, reset: now + windowMs };
    if (now > entry.reset) {
      entry.count = 0;
      entry.reset = now + windowMs;
    }
    entry.count++;
    buckets.set(key, entry);
    if (entry.count > maxRequests) {
      return res.status(429).json({ error: "Majaribio mengi mno. Tafadhali subiri dakika chache." });
    }
    next();
  };
}

function hashPassword(plain) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(String(plain), salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

function verifyPassword(plain, stored) {
  if (!stored) return false;
  if (stored.startsWith("scrypt:")) {
    const [, salt, originalHash] = stored.split(":");
    const derived = crypto.scryptSync(String(plain), salt, 64).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(derived, "hex"), Buffer.from(originalHash, "hex"));
  }
  return String(plain) === String(stored);
}

function isHashed(stored) {
  return typeof stored === "string" && stored.startsWith("scrypt:");
}

function sanitizeText(val, maxLen = 500) {
  if (val === undefined || val === null) return "";
  return String(val).trim().slice(0, maxLen);
}

async function verifyRecaptcha(token, secretKey, remoteIp) {
  if (!secretKey) return true;
  if (!token) return false;
  try {
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret: secretKey, response: token, remoteip: remoteIp || "" })
    });
    const data = await res.json();
    return !!data.success;
  } catch {
    return false;
  }
}

module.exports = {
  securityHeaders,
  rateLimit,
  hashPassword,
  verifyPassword,
  isHashed,
  sanitizeText,
  verifyRecaptcha
};
