"use strict";

const MANUAL_NETWORKS = {
  mpesa: "M-Pesa", tigo: "Mixx by Yas", airtel: "Airtel Money", halopesa: "HaloPesa",
  bank: "Benki", other: "Nyingine"
};

function publicEscape(value) {
  const codes = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return String(value ?? "").replace(/[&<>"']/g, character => codes[character]);
}

async function readPaymentPhoto(file) {
  if (!file || !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 8 * 1024 * 1024) {
    throw new Error("Chagua picha ya JPG, PNG au WebP isiyozidi MB 8.");
  }
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const scale = Math.min(1, 1700 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.87);
  } finally { URL.revokeObjectURL(url); }
}

function manualProofFields(payerName = "") {
  return `<fieldset class="manual-proof"><legend>Uthibitisho wa malipo</legend>
  <div class="form-row-2">
    <label>Jina la mlipaji<input name="payerName" maxlength="120" value="${publicEscape(payerName)}" required></label>
    <label>Mtandao wa malipo<select name="network" required><option value="">Chagua mtandao</option>
      ${Object.entries(MANUAL_NETWORKS).map(([key, label]) => `<option value="${key}">${label}</option>`).join("")}</select></label>
  </div>
  <label>Namba ya muamala (hiari)<input name="transactionId" maxlength="64"></label>
  <p class="muted">Ambatisha picha ya risiti au bandika ujumbe wa muamala.</p>
  <label>Ujumbe wa muamala<textarea rows="3" name="transactionMessage" maxlength="1600"></textarea></label>
  <label>Picha ya risiti<input name="receiptFile" type="file" accept="image/jpeg,image/png,image/webp"></label>
  </fieldset>`;
}

async function paymentFormData(form) {
  const body = Object.fromEntries(new FormData(form));
  const file = body.receiptFile;
  delete body.receiptFile;
  if (file?.size) body.receiptImage = await readPaymentPhoto(file);
  return body;
}

function safePublicLink(value) {
  if (typeof value !== "string") return "";
  if (value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")) return value;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : "";
  } catch { return ""; }
}

function contactLinks(phone) {
  const digits = String(phone || "").replace(/\D/g, "").replace(/^0(?=\d{9}$)/, "255");
  if (!/^\d{7,15}$/.test(digits)) return "";
  return `<div class="event-contact"><details><summary class="btn btn-sm ghost">Mawasiliano</summary>
    <div class="event-contact-options"><a href="https://wa.me/${digits}" target="_blank" rel="noopener noreferrer">WhatsApp</a>
    <a href="sms:+${digits}">SMS</a><a href="tel:+${digits}">Piga simu</a></div></details></div>`;
}
