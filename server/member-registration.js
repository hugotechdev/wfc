const { normalizePortrait } = require("./member-card");

function text(value, limit) {
  return typeof value === "string" && value.trim().length <= limit ? value.trim() : "";
}

function memberPhoneKey(value) {
  return String(value || "").trim().replace(/[ ()-]/g, "").replace(/^\+/, "").replace(/^0(?=\d{9}$)/, "255");
}

function readMemberRegistration(input) {
  const name = text(input.name, 120);
  const phone = text(input.phone, 30).replace(/[ ()-]/g, "");
  const email = text(input.email, 254);
  const region = text(input.region, 80);
  const profile = {
    gender: text(input.gender, 24),
    dateOfBirth: text(input.dateOfBirth, 10),
    email,
    nationalId: text(input.nationalId, 40),
    maritalStatus: text(input.maritalStatus, 24),
    occupation: text(input.occupation, 120),
    district: text(input.district, 80),
    street: text(input.street, 120),
    clan: text(input.clan, 80),
    ancestralArea: text(input.ancestralArea, 80),
    membershipCategory: text(input.membershipCategory, 24)
  };

  if (!name || !/^\+?\d{7,15}$/.test(phone) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Weka jina, namba ya simu na barua pepe halali.");
  }
  const birth = profile.dateOfBirth;
  const calendarDate = new Date(birth + "T00:00:00.000Z");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birth) || !Number.isFinite(calendarDate.getTime()) ||
      calendarDate.toISOString().slice(0, 10) !== birth || birth < "0001-01-01" ||
      birth > new Date().toISOString().slice(0, 10)) {
    throw new Error("Weka tarehe halali ya kuzaliwa.");
  }
  if (!["female", "male", "other", "undisclosed"].includes(profile.gender) ||
      !["regular", "supporting"].includes(profile.membershipCategory) ||
      (input.maritalStatus && !["single", "married", "divorced", "widowed", "undisclosed"].includes(profile.maritalStatus)) ||
      (input.nationalId && !/^[\p{L}\d][\p{L}\d -]{1,39}$/u.test(profile.nationalId)) ||
      (input.occupation && !profile.occupation)) {
    throw new Error("Hakiki jinsia, chaguo la uanachama na taarifa za hiari.");
  }
  if (!region || !profile.district || !profile.street || !profile.clan || !profile.ancestralArea) {
    throw new Error("Jaza taarifa zote za asili.");
  }
  if (!input.profilePhoto) throw new Error("Ambatisha picha yako ya wasifu.");
  let profilePhoto;
  try { profilePhoto = normalizePortrait(input.profilePhoto); }
  catch { throw new Error("Picha haikubaliki au ni kubwa sana."); }
  return { name, phone, region, registrationProfile: profile, profilePhoto };
}

module.exports = { memberPhoneKey, readMemberRegistration };
