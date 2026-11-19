const fs = require("node:fs");
const path = require("node:path");

const DEFAULT_GROUP = {
  name: "Wachagga Community Family",
  shortName: "WFC",
  slogan: "Umoja wa Wachagga, nguvu ya familia",
  description: "Ofisi ya kidijitali ya wanachama, michango na matukio.",
  rules: "",
  phone: "",
  logo: "data:image/jpeg;base64," + fs.readFileSync(path.join(__dirname, "../public/assets/wachagga-logo.jpg"), "base64"),
  registrationFee: 0,
  monthlyFee: 0,
  modules: { tickets: true, attendance: true, elections: true, saccos: true },
  paymentNumbers: { mpesa: "", tigo: "", airtel: "", crdb: "" }
};

function readGroup(db) {
  const stored = db.group || {};
  return {
    ...DEFAULT_GROUP,
    ...stored,
    paymentNumbers: { ...DEFAULT_GROUP.paymentNumbers, ...stored.paymentNumbers },
    modules: { ...DEFAULT_GROUP.modules, ...stored.modules }
  };
}

function updateGroup(current, input) {
  const group = { ...current, paymentNumbers: { ...current.paymentNumbers } };
  for (const [key, limit] of Object.entries({name: 80, shortName: 12, slogan: 120, description: 600, rules: 12000, phone: 40})) {
    if (typeof input[key] !== "string" || input[key].length > limit) throw new Error(`Hakiki taarifa ya ${key} (upeo wa herufi ${limit}).`);
    group[key] = input[key].trim();
  }
  group.shortName = group.shortName.toUpperCase();
  if (!group.name || !/^[A-Z0-9]{2,12}$/.test(group.shortName)) {
    throw new Error("Weka jina la kikundi na kifupi chenye herufi A–Z au tarakimu 2–12.");
  }
  for (const key of ["registrationFee", "monthlyFee"]) {
    const amount = Number(input[key]);
    if (typeof input[key] !== "string" || !/^\d+$/.test(input[key]) || !Number.isSafeInteger(amount) || amount > 1000000000) {
      throw new Error("Weka ada halali katika TSh, bila desimali.");
    }
    group[key] = amount;
  }
  for (const key of Object.keys(group.paymentNumbers)) {
    const value = input[key];
    if (typeof value !== "string" || !/^[0-9 +()\-]{0,40}$/.test(value)) throw new Error("Hakiki namba za malipo.");
    group.paymentNumbers[key] = value.trim();
  }
  if (input.removeLogo === true) group.logo = "";
  if (input.logo) {
    if (typeof input.logo !== "string" || input.logo.length > 700000) throw new Error("Nembo isizidi KB 500.");
    const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(input.logo);
    if (!match) throw new Error("Tumia nembo ya PNG, JPG au WebP.");
    const bytes = Buffer.from(match[2], "base64");
    const format = match[1];
    const valid = format === "png" ? bytes.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"))
      : format === "jpeg" ? bytes.subarray(0, 3).equals(Buffer.from("ffd8ff", "hex"))
      : bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
    if (!valid || bytes.length > 512000) throw new Error("Faili la nembo halitambuliki au linazidi KB 500.");
    group.logo = input.logo;
  }
  if (input.modules !== undefined) {
    if (!input.modules || typeof input.modules !== "object") throw new Error("Chagua vipengele vya kikundi.");
    group.modules = Object.fromEntries(Object.keys(DEFAULT_GROUP.modules).map(key => [key, input.modules[key] === true]));
  }
  return group;
}

module.exports = { DEFAULT_GROUP, readGroup, updateGroup };
