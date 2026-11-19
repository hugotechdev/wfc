"use strict";

let groupProfile = {
  name: "Wachagga Community Family", shortName: "WFC", slogan: "Umoja wa Wachagga, nguvu ya familia",
  logo: "/assets/wachagga-logo.jpg?v=ebb0f8240bd5", description: "", rules: "", phone: "",
  registrationFee: 0, monthlyFee: 0, paymentNumbers: {}
};

const paymentLabels = { mpesa: "M-Pesa", tigo: "Mixx by Yas", airtel: "Airtel Money", crdb: "CRDB" };

function paymentInstructions(group) {
  return Object.entries(paymentLabels)
    .filter(([key]) => group.paymentNumbers[key])
    .map(([key, label]) => `${label}: ${group.paymentNumbers[key]}`).join(" · ")
    || "Wasiliana na uongozi kupata maelekezo ya malipo.";
}

function applyGroupLogos(container, group = groupProfile) {
  for (const slot of container.querySelectorAll("[data-group-logo]")) {
    if (!group.logo) {
      slot.textContent = group.shortName;
      continue;
    }
    const current = slot.firstElementChild;
    if (current?.getAttribute("src") === group.logo && current.alt === group.name) continue;
    const img = new Image();
    img.alt = group.name;
    img.decoding = "async";
    img.onerror = () => {
      if (slot.firstElementChild === img) slot.textContent = groupProfile.shortName;
    };
    img.src = group.logo;
    slot.replaceChildren(img);
  }
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
  applyGroupLogos(document, group);
  for (const section of document.querySelectorAll("[data-group-optional]")) {
    section.hidden = !group[section.dataset.groupOptional];
  }
}

const groupReady = fetch("/api/public/group", { cache: "no-store" })
  .then(response => { if (!response.ok) throw new Error("Group unavailable"); return response.json(); })
  .then(applyGroupProfile)
  .catch(() => applyGroupProfile(groupProfile));
