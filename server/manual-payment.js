const { createHash, randomBytes } = require("node:crypto");
const { readAttachments } = require("./social-post");

const NETWORKS = ["mpesa", "tigo", "airtel", "halopesa", "bank", "other"];
const APPROVERS = ["ADMIN", "TREASURER", "CHAIRPERSON", "PAYMENT_APPROVER"];
const TICKET_TYPES = ["text", "email", "number", "select"];

function paymentText(value, limit) {
  return typeof value === "string" && value.trim().length <= limit ? value.trim() : "";
}

function paymentEvidence(input, db) {
  const payerName = paymentText(input.payerName, 120);
  const network = paymentText(input.network, 20);
  const transactionId = paymentText(input.transactionId, 64).toUpperCase();
  const transactionMessage = paymentText(input.transactionMessage, 1600);
  if (!payerName || !NETWORKS.includes(network) ||
      (input.transactionId && !/^[A-Z0-9][A-Z0-9._/-]{0,63}$/.test(transactionId)) ||
      (input.transactionMessage && !transactionMessage)) {
    throw new Error("Weka jina la mlipaji, mtandao na taarifa halali za muamala.");
  }
  const photo = input.receiptImage ? readAttachments([{ name: "risiti.jpg", data: input.receiptImage }])[0] : null;
  if (photo && photo.type !== "image/jpeg") throw new Error("Ambatisha picha ya risiti.");
  if (!transactionMessage && !photo) throw new Error("Ambatisha picha ya risiti au bandika ujumbe wa muamala.");
  const proofHash = createHash("sha256").update(photo ? photo.bytes : transactionMessage).digest("hex");
  const alreadyUsed = db.payments.some(payment => payment.proofHash === proofHash ||
    (transactionId && String(payment.transactionId || "").trim().toUpperCase() === transactionId));
  const legacyTicket = transactionId && (db.tickets || []).some(order =>
    !order.token && String(order.transactionId || "").trim().toUpperCase() === transactionId);
  if (alreadyUsed || legacyTicket) {
    throw new Error("Uthibitisho au namba hii ya muamala tayari imetumika.");
  }
  return {
    data: { payerName, network, transactionId, transactionMessage, proofHash, ...(photo ? { proofId: photo.id } : {}) },
    photo
  };
}

function ticketFields(input = []) {
  if (!Array.isArray(input) || input.length > 8) throw new Error("Weka hadi sehemu 8 za ziada za tiketi.");
  const names = new Set();
  return input.map(field => {
    const label = paymentText(field?.label, 80);
    const type = field?.type;
    if (!label || names.has(label.toLowerCase()) || !TICKET_TYPES.includes(type)) throw new Error("Hakiki sehemu za fomu ya tiketi.");
    names.add(label.toLowerCase());
    const options = type === "select" && Array.isArray(field.options)
      ? [...new Set(field.options.map(option => paymentText(option, 80)).filter(Boolean))] : [];
    if (type === "select" && (options.length < 2 || options.length > 12)) throw new Error("Sehemu ya kuchagua iwe na chaguo 2 hadi 12.");
    return { id: randomBytes(8).toString("hex"), label, type, required: field.required === true, options };
  });
}

function ticketAnswers(fields, input = {}) {
  return fields.map(field => {
    const value = paymentText(input?.[field.id], 250);
    if ((field.required && !value) || (input?.[field.id] && !value) || (value && (
      (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) ||
      (field.type === "number" && !/^-?\d+(?:\.\d+)?$/.test(value)) ||
      (field.type === "select" && !field.options.includes(value))
    ))) throw new Error("Jaza sehemu za fomu ya tiketi kwa usahihi.");
    return { label: field.label, value };
  });
}

module.exports = { APPROVERS, paymentText, paymentEvidence, ticketFields, ticketAnswers };
