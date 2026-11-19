"use strict";

let groupProfile = {
  name: "Wachagga Community Family", shortName: "WFC", slogan: "Umoja wa Wachagga, nguvu ya familia",
  logo: "/assets/wachagga-logo.jpg", description: "", rules: "", phone: "",
  registrationFee: 0, monthlyFee: 0, paymentNumbers: {}
};

const paymentLabels = { mpesa: "M-Pesa", tigo: "Mixx by Yas", airtel: "Airtel Money", crdb: "CRDB" };

function paymentInstructions(group) {
  return Object.entries(paymentLabels)
    .filter(([key]) => group.paymentNumbers[key])
    .map(([key, label]) => `${label}: ${group.paymentNumbers[key]}`).join(" · ")
    || "Wasiliana na uongozi kupata maelekezo ya malipo.";
}

function applyGroupProfile(group) {
  groupProfile = group;
  document.title = document.body.dataset.pageTitle
    ? `${document.body.dataset.pageTitle} — ${group.name}` : group.name;
  for (const el of document.querySelectorAll("[data-group-text]")) {
    const key = el.dataset.groupText;
    if (key === "name" || key === "shortName") el.translate = false;
    el.textContent = key === "payments" ? paymentInstructions(group) : group[key] || "";
  }
  for (const slot of document.querySelectorAll("[data-group-logo]")) {
    slot.textContent = group.shortName;
    if (!group.logo) continue;
    const img = new Image();
    img.alt = group.name;
    img.onload = () => slot.replaceChildren(img);
    img.src = group.logo;
  }
  for (const section of document.querySelectorAll("[data-group-optional]")) {
    section.hidden = !group[section.dataset.groupOptional];
  }
}

const groupReady = fetch("/api/public/group", { cache: "no-store" })
  .then(response => { if (!response.ok) throw new Error("Group unavailable"); return response.json(); })
  .then(applyGroupProfile)
  .catch(() => applyGroupProfile(groupProfile));
