const { jsPDF } = require("jspdf");
const QRCode = require("qrcode");
const jpeg = require("jpeg-js");

function normalizePortrait(photo) {
  if (typeof photo !== "string" || photo.length > 350000) throw new Error("Picha haikubaliki au ni kubwa sana.");
  const match = /^data:image\/jpeg;base64,([A-Za-z0-9+/]+={0,2})$/.exec(photo);
  if (!match) throw new Error("Picha haikubaliki au ni kubwa sana.");
  const decoded = jpeg.decode(Buffer.from(match[1], "base64"), {
    maxResolutionInMP: 1,
    maxMemoryUsageInMB: 16,
    useTArray: true
  });
  if (decoded.width !== decoded.height || decoded.width < 96 || decoded.width > 600) {
    throw new Error("Picha haikubaliki au ni kubwa sana.");
  }
  return jpeg.encode(decoded, 83).data.toString("base64");
}

function cardQr(url) {
  return QRCode.toBuffer(url, { width: 384, margin: 2, errorCorrectionLevel: "M" });
}

async function buildMemberCard(member, group, verificationUrl, english) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: [85.6, 54], compress: true });
  doc.setProperties({ title: (english ? "Member ID" : "Kitambulisho cha mwanachama") + " — " + member.wfcId });
  doc.setFillColor("#171819");
  doc.rect(0, 0, 85.6, 54, "F");
  doc.setFillColor("#f47b1f");
  doc.rect(0, 0, 85.6, 1.4, "F");
  doc.setFillColor("#242629");
  doc.circle(83, 4, 19, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor("#ffffff");
  if (group.logo) {
    try {
      const logo = doc.getImageProperties(group.logo);
      const scale = Math.min(9 / logo.width, 9 / logo.height);
      doc.addImage(group.logo, logo.fileType, 4, 3.9, logo.width * scale, logo.height * scale);
    } catch {
      doc.text(group.shortName, 4, 10);
    }
  } else {
    doc.text(group.shortName, 4, 10);
  }
  doc.text(doc.splitTextToSize(group.name, 64).slice(0, 2), 16, 7.1, { lineHeightFactor: 1.05 });
  doc.setFillColor("#fff5e9");
  doc.roundedRect(3.5, 15.5, 78.6, 34.8, 2.5, 2.5, "F");
  doc.addImage("data:image/jpeg;base64," + member.profilePhoto, "JPEG", 6, 20, 25, 25);
  doc.setFontSize(6.5);
  doc.setTextColor("#a44316");
  doc.text(english ? "MEMBER ID" : "KITAMBULISHO CHA MWANACHAMA", 34, 22.2);
  doc.setFontSize(11);
  doc.setTextColor("#1c1a19");
  const name = english && member.id === "admin-001" && member.name === "Msimamizi" ? "Administrator" : member.name;
  const lines = doc.splitTextToSize(name, 30).slice(0, 3);
  doc.text(lines, 34, 28, { lineHeightFactor: 1 });
  doc.setFontSize(8);
  doc.text(String(member.wfcId), 34, 42.6);
  doc.setFontSize(6.4);
  doc.setFont("helvetica", "normal");
  doc.text(english ? "Active membership" : "Uanachama hai", 34, 46.6);
  doc.addImage(await cardQr(verificationUrl), "PNG", 65, 24, 15, 15);
  doc.text(english ? "Verify" : "Hakiki", 72.5, 42.6, { align: "center" });
  return Buffer.from(doc.output("arraybuffer"));
}

module.exports = { normalizePortrait, cardQr, buildMemberCard };
