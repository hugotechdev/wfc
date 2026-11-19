const { randomBytes } = require("node:crypto");
const jpeg = require("jpeg-js");

const MAX_TOTAL_BYTES = 8 * 1024 * 1024;
const MAX_FILE_BYTES = 5 * 1024 * 1024;

function readAttachments(input = []) {
  if (!Array.isArray(input) || input.length > 4) throw new Error("Ambatisha hadi faili nne.");
  let total = 0;
  return input.map(file => {
    if (typeof file?.data !== "string" || file.data.length > 7000000) {
      throw new Error("Faili moja lisizidi MB 5 na jumla isizidi MB 8.");
    }
    const match = /^data:(image\/jpeg|application\/pdf);base64,([A-Za-z0-9+/]+={0,2})$/.exec(file.data);
    if (!match) throw new Error("Ambatisha picha au hati ya PDF.");
    const [, type, encoded] = match;
    let bytes = Buffer.from(encoded, "base64");
    if (bytes.length > MAX_FILE_BYTES) throw new Error("Faili moja lisizidi MB 5 na jumla isizidi MB 8.");
    let name = typeof file.name === "string" ? file.name.replace(/[\/\\\x00-\x1f\x7f]/g, "_").trim().slice(0, 88) : "";
    if (type === "image/jpeg") {
      try {
        const image = jpeg.decode(bytes, { maxResolutionInMP: 4, maxMemoryUsageInMB: 80, useTArray: true });
        bytes = jpeg.encode(image, 86).data;
      } catch {
        throw new Error("Picha iliyochaguliwa haiwezi kusomwa.");
      }
      name = (name.replace(/\.[^.]+$/, "") || "Picha") + ".jpg";
    } else {
      if (!bytes.subarray(0, 8).toString("ascii").startsWith("%PDF-") ||
          !/%%EOF\s*$/.test(bytes.subarray(-1024).toString("ascii"))) {
        throw new Error("Hati iliyochaguliwa si PDF halali.");
      }
      if (!/\.pdf$/i.test(name)) name = (name || "Hati") + ".pdf";
    }
    total += bytes.length;
    if (bytes.length > MAX_FILE_BYTES || total > MAX_TOTAL_BYTES) {
      throw new Error("Faili moja lisizidi MB 5 na jumla isizidi MB 8.");
    }
    return { id: randomBytes(12).toString("hex"), name, type, bytes };
  });
}

function visiblePost(post, memberId) {
  const { likes = [], ...details } = post;
  return { ...details, attachments: post.attachments || [], likeCount: likes.length, liked: likes.includes(memberId) };
}

module.exports = { readAttachments, visiblePost };
