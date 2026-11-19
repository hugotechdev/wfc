const { createHmac, timingSafeEqual } = require("node:crypto");
const { jsPDF } = require("jspdf");
const QRCode = require("qrcode");

function ticketNumber(order, seat) {
  return `TKT-${order.id.toUpperCase()}-${String(seat).padStart(2, "0")}`;
}

function verificationCode(order, seat) {
  return createHmac("sha256", order.token).update(`event-ticket-v1:${order.id}:${seat}`).digest("hex").slice(0, 40);
}

function validTicket(order, seat, code) {
  if (!order?.token || order.status !== "APPROVED" || !Number.isSafeInteger(seat) ||
      seat < 1 || seat > order.qty || !/^[a-f0-9]{40}$/.test(code)) return false;
  return timingSafeEqual(Buffer.from(code, "hex"), Buffer.from(verificationCode(order, seat), "hex"));
}

function ticketLink(origin, order) {
  return `${origin}/ticket/${encodeURIComponent(order.eventId)}?order=${encodeURIComponent(order.token)}`;
}

async function buildTicketPdf(order, event, group, origin, english) {
  const doc = new jsPDF({ orientation: "landscape", format: "a5", unit: "mm", compress: true });
  const strings = english
    ? { pass: "EVENT TICKET", verified: "APPROVED", holder: "Ticket holder", date: "Date and venue", scan: "Scan to verify", serial: "Ticket number" }
    : { pass: "TIKETI YA TUKIO", verified: "IMEIDHINISHWA", holder: "Mwenye tiketi", date: "Tarehe na eneo", scan: "Soma QR kuhakiki", serial: "Namba ya tiketi" };
  doc.setProperties({ title: strings.pass + " – " + order.eventName });
  for (let seat = 1; seat <= order.qty; seat++) {
    if (seat > 1) doc.addPage("a5", "landscape");
    doc.setFillColor("#fff7ee");
    doc.rect(0, 0, 210, 148, "F");
    doc.setFillColor("#201b17");
    doc.rect(0, 0, 210, 32, "F");
    doc.setFillColor("#f29e69");
    doc.rect(0, 32, 210, 2, "F");
    let groupX = 13;
    if (group.logo) {
      try {
        const logo = doc.getImageProperties(group.logo);
        const scale = Math.min(16 / logo.width, 16 / logo.height);
        doc.addImage(group.logo, logo.fileType, 13, 8, logo.width * scale, logo.height * scale);
        groupX = 33;
      } catch {}
    }
    doc.setFont("helvetica", "bold");
    doc.setTextColor("#ffffff");
    doc.setFontSize(15);
    doc.text(doc.splitTextToSize(group.name, 130).slice(0, 2), groupX, 18);
    doc.setTextColor("#914628");
    doc.setFontSize(11);
    doc.text(strings.pass, 13, 46);
    doc.setTextColor("#211913");
    doc.setFontSize(21);
    doc.text(doc.splitTextToSize(order.eventName, 117).slice(0, 3), 13, 58);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(strings.holder, 13, 85);
    doc.setFontSize(13);
    doc.text(doc.splitTextToSize(order.name, 115).slice(0, 2), 13, 92);
    const location = [typeof event?.eventDate === "string" ? event.eventDate.replace("T", " ") : "", event?.location].filter(Boolean).join(" | ");
    if (location) {
      doc.setFontSize(10);
      doc.text(strings.date, 13, 107);
      doc.text(doc.splitTextToSize(location, 115).slice(0, 2), 13, 113);
    }
    doc.setFontSize(9);
    doc.text(strings.serial, 13, 129);
    doc.setFont("helvetica", "bold");
    doc.text(ticketNumber(order, seat), 13, 136);
    doc.setFillColor("#ffffff");
    doc.roundedRect(137, 46, 61, 91, 4, 4, "F");
    const verifyUrl = `${origin}/verify/ticket/${order.id}/${seat}/${verificationCode(order, seat)}`;
    const qr = await QRCode.toBuffer(verifyUrl, { width: 440, margin: 3 });
    doc.addImage(qr, "PNG", 145, 53, 45, 45);
    doc.setFontSize(9);
    doc.text(strings.scan, 167.5, 104, { align: "center" });
    doc.setFontSize(13);
    doc.text(`${seat} / ${order.qty}`, 167.5, 118, { align: "center" });
    doc.setTextColor("#316748");
    doc.setFontSize(10);
    doc.text(strings.verified, 167.5, 128, { align: "center" });
  }
  return Buffer.from(doc.output("arraybuffer"));
}

module.exports = { ticketNumber, validTicket, ticketLink, buildTicketPdf };
