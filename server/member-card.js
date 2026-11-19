const { readFileSync } = require("node:fs");
const path = require("node:path");
const { jsPDF } = require("jspdf");
const QRCode = require("qrcode");
const jpeg = require("jpeg-js");

const assets = path.join(__dirname, "../public/assets/member-id");
const illustration = readFileSync(path.join(assets, "kilimanjaro.jpg"));
const fonts = [
  ["OpenSans-Regular.ttf", "normal"],
  ["OpenSans-Bold.ttf", "bold"]
].map(([filename, weight]) => ({
  filename,
  weight,
  data: readFileSync(path.join(assets, filename), "base64")
}));

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
  return QRCode.toBuffer(url, { width: 384, margin: 4, errorCorrectionLevel: "M" });
}

async function buildMemberCard(member, group, verificationUrl, english) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: [85.6, 54], compress: true });
  doc.setProperties({ title: (english ? "Member ID" : "Kitambulisho cha mwanachama") + " — " + member.wfcId });
  for (const { filename, weight, data } of fonts) {
    doc.addFileToVFS(filename, data);
    doc.addFont(filename, "OpenSans", weight);
  }

  doc.setFillColor("#fbfaf8");
  doc.rect(0, 0, 85.6, 54, "F");
  doc.addImage(illustration, "JPEG", 0, 0, 85.6, 19.8);
  doc.setFillColor("#dd8753");
  doc.rect(0, 19.8, 85.6, 0.4, "F");

  doc.setFont("OpenSans", "bold");
  doc.setTextColor("#ffffff");
  doc.setFontSize(8.5);
  let logoPlaced = false;
  if (group.logo) {
    try {
      const logo = doc.getImageProperties(group.logo);
      const scale = Math.min(10 / logo.width, 10 / logo.height);
      const width = logo.width * scale;
      const height = logo.height * scale;
      doc.addImage(group.logo, logo.fileType, 4 + (10 - width) / 2, 5 + (10 - height) / 2, width, height);
      logoPlaced = true;
    } catch {
      // Use the group abbreviation if the uploaded logo cannot be rendered.
    }
  }
  if (!logoPlaced) {
    doc.setFontSize(6);
    doc.text(doc.splitTextToSize(group.shortName, 10).slice(0, 2), 4, 9.4);
    doc.setFontSize(8.5);
  }

  const groupLines = doc.splitTextToSize(group.name, 49).slice(0, 2);
  const groupY = groupLines.length > 1 ? 7.5 : 9.8;
  doc.text(groupLines, 17, groupY, { lineHeightFactor: 1.12 });
  if (group.slogan) {
    doc.setFont("OpenSans", "normal");
    doc.setFontSize(5.6);
    doc.setTextColor("#ffe0cc");
    doc.text(doc.splitTextToSize(group.slogan, 50).slice(0, 2), 17, 13.7, { lineHeightFactor: 1.1 });
  }

  doc.addImage("data:image/jpeg;base64," + member.profilePhoto, "JPEG", 4, 26.7, 21, 21);
  doc.setFont("OpenSans", "normal");
  doc.setFontSize(5.5);
  doc.setTextColor("#85411e");
  doc.text(english ? "Member ID" : "Kitambulisho cha mwanachama", 29, 27.3);

  const name = english && member.id === "admin-001" && member.name === "Msimamizi" ? "Administrator" : member.name;
  doc.setFont("OpenSans", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor("#25262a");
  let nameLines = doc.splitTextToSize(name, 33);
  if (nameLines.length > 2) {
    doc.setFontSize(7.4);
    nameLines = doc.splitTextToSize(name, 33);
  }
  doc.text(nameLines.slice(0, 3), 29, 32.5, { lineHeightFactor: 1.04 });
  doc.setFontSize(7);
  doc.text(String(member.wfcId), 29, 43.7);
  doc.setFont("OpenSans", "normal");
  doc.setFontSize(5.5);
  doc.setTextColor("#305844");
  doc.text(english ? "Active membership" : "Uanachama hai", 29, 47.5);

  doc.setDrawColor("#ded8d2");
  doc.setLineWidth(0.2);
  doc.line(64, 26.7, 64, 47.7);
  doc.addImage(await cardQr(verificationUrl), "PNG", 66.8, 29.4, 15.5, 15.5);

  doc.setFillColor("#f4e8df");
  doc.lines([[85.6, 0], [0, -4.5], [-20.6, 0], [-7.7, 2.9], [-42.8, 0], [-4.5, -1.6], [-10, 0]],
    0, 54, [1, 1], "F", true);
  doc.setDrawColor("#c77d50");
  doc.setLineWidth(0.19);
  doc.lines([[10, 0], [4.5, 1.6], [42.8, 0], [7.7, -2.9], [20.6, 0]], 0, 50.8);
  doc.setDrawColor("#dbb59c");
  doc.setLineWidth(0.12);
  doc.lines([[8.3, 0], [4.5, 1.6], [44.7, 0], [7.7, -2.9], [20.4, 0]], 0, 52.2);
  return Buffer.from(doc.output("arraybuffer"));
}

module.exports = { normalizePortrait, cardQr, buildMemberCard };
