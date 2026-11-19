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

const TICKET_EMAIL_STATES = {
  SENT: "Barua pepe imetumwa",
  FAILED: "Barua pepe haikutumwa",
  QUEUED: "Barua pepe inasubiri kutumwa",
  NOT_CONFIGURED: "Huduma ya email haijaunganishwa."
};

function renderTicketDelivery(delivery, allowRetry) {
  const link = safePublicLink(delivery?.link);
  if (!link || !/^https?:\/\//.test(link)) return "";
  const digits = String(delivery.phone || "").replace(/\D/g, "").replace(/^0(?=\d{9}$)/, "255");
  const message = encodeURIComponent(tr("Tiketi imethibitishwa") + " — " + delivery.eventName + "\n" + link);
  return `<div class="ticket-delivery">
    ${delivery.method === "email" ? `<p class="muted" data-ticket-email-status role="status">${TICKET_EMAIL_STATES[delivery.emailStatus] || ""}</p>` : ""}
    <div class="event-actions">
      <a class="btn btn-sm ghost" href="${publicEscape(link)}" target="_blank" rel="noopener noreferrer">Fungua tiketi</a>
      ${/^\d{7,15}$/.test(digits) ? `<a class="btn btn-sm ghost" href="https://wa.me/${digits}?text=${message}" target="_blank" rel="noopener noreferrer">Tuma WhatsApp</a>` : ""}
      ${delivery.email ? `<a class="btn btn-sm ghost" href="mailto:${encodeURIComponent(delivery.email)}?subject=${encodeURIComponent(tr("Tiketi imethibitishwa"))}&amp;body=${message}">Fungua email</a>` : ""}
      ${allowRetry && delivery.method === "email" && ["FAILED", "QUEUED"].includes(delivery.emailStatus)
        ? `<button class="btn btn-sm ghost" type="button" data-send-ticket-email="${publicEscape(delivery.id)}">Jaribu tena email</button>` : ""}
    </div>
  </div>`;
}

function bindTicketDelivery(container) {
  for (const button of container.querySelectorAll("[data-send-ticket-email]")) button.onclick = async () => {
    button.disabled = true;
    const status = button.closest(".ticket-delivery").querySelector("[data-ticket-email-status]");
    try {
      const result = await api("/api/events/orders/" + encodeURIComponent(button.dataset.sendTicketEmail) + "/send-email", { method: "POST", body: {} });
      status.textContent = TICKET_EMAIL_STATES[result.emailStatus] || result.error || "Barua pepe haikutumwa";
      if (result.emailStatus === "SENT") button.remove();
    } catch { status.textContent = "Barua pepe haikutumwa"; }
    finally { button.disabled = false; }
  };
}
