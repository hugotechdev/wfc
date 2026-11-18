let ME = null;
let POLICY = null;
let currentPage = "home";
let currentLang = localStorage.getItem("wfc_lang") || "sw";
let cachedNotifications = [];
let cachedMembers = [];
let cachedPayments = [];
let cachedEvents = [];
let cachedReports = null;
let regPhotoDataUrl = "";
let adminRegPhotoDataUrl = "";

const I18N = {
  sw: {
    back_home: "← Rudi kwenye Tovuti",
    lbl_phone: "Namba ya Simu",
    lbl_password: "Nenosiri",
    btn_login: "Ingia Kwenye Mfumo",
    no_account: "Huna akaunti?",
    link_register: "Jisajili hapa",
    demo_hint: "Demo: 0700000000 / admin123 (Admin) · 0711000001 / demo123 (Mwanachama)",
    notif_title: "Taarifa & Arifa",
    mark_all_read: "Soma Zote",
    view_all_notifs: "Tazama Taarifa Zote →",
    dd_my_profile: "My Profile (Wasifu Wangu)",
    dd_account_settings: "Account Settings (Mipangilio)",
    dd_change_password: "Change Password (Badili Nenosiri)",
    dd_logout: "Logout (Toka Nje)",
    btn_logout: "Logout",
    sec_main: "Kuu & Uendeshaji",
    sec_member: "Huduma za Mwanachama",
    sec_office: "Ofisi, Ripoti & Uongozi",
    sec_account: "Akaunti & Usalama"
  },
  en: {
    back_home: "← Back to Website",
    lbl_phone: "Phone Number",
    lbl_password: "Password",
    btn_login: "Sign In to Portal",
    no_account: "Don't have an account?",
    link_register: "Register here",
    demo_hint: "Demo: 0700000000 / admin123 (Admin) · 0711000001 / demo123 (Member)",
    notif_title: "Notifications & Alerts",
    mark_all_read: "Mark All as Read",
    view_all_notifs: "View All Notifications →",
    dd_my_profile: "My Profile",
    dd_account_settings: "Account Settings",
    dd_change_password: "Change Password",
    dd_logout: "Logout",
    btn_logout: "Logout",
    sec_main: "Main Navigation",
    sec_member: "Member Services",
    sec_office: "Office, Reports & Leadership",
    sec_account: "Account & Security"
  }
};

function t(key) {
  return (I18N[currentLang] && I18N[currentLang][key]) || I18N.sw[key] || key;
}

function setPortalLang(lang) {
  currentLang = lang === "en" ? "en" : "sw";
  localStorage.setItem("wfc_lang", currentLang);
  document.querySelectorAll(".lang-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.lang === currentLang);
  });
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const k = el.getAttribute("data-i18n");
    if (t(k)) el.textContent = t(k);
  });
  if (ME) {
    renderNav();
    go(currentPage);
  }
}

function esc(v) {
  return String(v == null ? "" : v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeUrl(u) {
  const s = String(u || "").trim();
  if (s.startsWith("https://") || s.startsWith("http://") || s.startsWith("/")) return s;
  return "#";
}

function fmt(n) {
  return "TSh " + Number(n || 0).toLocaleString();
}

function fmtDate(d) {
  if (!d) return "—";
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? String(d) : dt.toLocaleDateString("sw-TZ");
}

function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.remove("hidden");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.add("hidden"), 3400);
}

async function api(url, method = "GET", body = null) {
  const opts = { method, headers: {} };
  if (body) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }
  const r = await fetch(url, opts);
  const d = await r.json().catch(() => ({}));
  if (!r.ok) {
    toast(d.error || "Hitilafu imetokea");
    return null;
  }
  return d;
}

function statusBadge(s) {
  const v = String(s || "").toUpperCase();
  if (v === "ACTIVE" || v === "APPROVED" || v === "PAID" || v === "CURRENT") {
    return `<span class="badge badge-ok">${esc(v)}</span>`;
  }
  if (v === "SUSPENDED" || v === "UNPAID" || v === "REJECTED") {
    return `<span class="badge badge-bad">${esc(v)}</span>`;
  }
  if (v === "FORMER") {
    return `<span class="badge badge-info">${esc(v)}</span>`;
  }
  return `<span class="badge badge-warn">${esc(v || "PENDING")}</span>`;
}

function docTypeLabel(code) {
  const map = {
    NATIONAL_ID: "National ID (NIDA)",
    BIRTH_CERTIFICATE: "Birth Certificate (Cheti cha Kuzaliwa)",
    PASSPORT_PHOTO: "Passport Photo (Picha ya Pasipoti)",
    APPLICATION_FORM: "Membership Application Form (Fomu ya Maombi)",
    OTHER: "Other Supporting Document (Nyaraka Nyingine)"
  };
  return map[code] || code || "Other Supporting Document";
}

function notifCategoryLabel(code) {
  const map = {
    NEW_MEMBER: "New Member Registration",
    CONTRIBUTION: "Contribution Received",
    EVENT_REMINDER: "Event Reminder",
    RENEWAL_REMINDER: "Membership Renewal",
    LEADERSHIP: "Leadership Updates",
    ANNOUNCEMENT: "System Announcement"
  };
  return map[code] || "System Announcement";
}

// ==================== SIDEBAR & TOPBAR INTERACTIONS ====================

function openMobileSidebar() {
  document.getElementById("sidebar").classList.add("open");
  document.getElementById("sidebarBackdrop").classList.add("open");
}

function closeMobileSidebar() {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("sidebarBackdrop").classList.remove("open");
}

function toggleSidebarCollapse() {
  document.getElementById("sidebar").classList.toggle("collapsed");
}

function toggleNotifPopover(e) {
  e.stopPropagation();
  document.getElementById("profileDropdown").classList.add("hidden");
  document.getElementById("notifPopover").classList.toggle("hidden");
}

function toggleProfileDropdown(e) {
  e.stopPropagation();
  document.getElementById("notifPopover").classList.add("hidden");
  document.getElementById("profileDropdown").classList.toggle("hidden");
}

function closePopovers() {
  const np = document.getElementById("notifPopover");
  const pd = document.getElementById("profileDropdown");
  if (np) np.classList.add("hidden");
  if (pd) pd.classList.add("hidden");
}

document.addEventListener("click", (e) => {
  if (!e.target.closest(".notif-wrap") && !e.target.closest(".profile-dd-wrap")) {
    closePopovers();
  }
});

function openDetailsModal(title, subtitle, bodyHtml) {
  document.getElementById("detailsModalTitle").textContent = title || "Maelezo Kamili";
  document.getElementById("detailsModalSub").textContent = subtitle || "";
  document.getElementById("detailsModalBody").innerHTML = bodyHtml || "";
  document.getElementById("detailsModal").classList.remove("hidden");
}

function closeDetailsModal() {
  document.getElementById("detailsModal").classList.add("hidden");
}

// ==================== AUTH & REGISTRATION ====================

function initRegDates() {
  const today = new Date();
  const nextYear = new Date(today);
  nextYear.setFullYear(today.getFullYear() + 1);
  const regInput = document.getElementById("rRegDate");
  const expInput = document.getElementById("rExpDate");
  if (regInput) regInput.value = today.toISOString().slice(0, 10);
  if (expInput) expInput.value = nextYear.toISOString().slice(0, 10);
}

function previewRegPhoto(input) {
  const f = input && input.files && input.files[0];
  if (!f) return;
  if (f.size > 1500000) {
    toast("Picha isizidi 1.5MB");
    input.value = "";
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    regPhotoDataUrl = String(reader.result || "");
    const img = document.getElementById("rPhotoPreviewImg");
    if (img && regPhotoDataUrl) img.src = regPhotoDataUrl;
  };
  reader.readAsDataURL(f);
}

function showLogin() {
  ["regBox", "otpBox"].forEach((id) => document.getElementById(id).classList.add("hidden"));
  document.getElementById("loginBox").classList.remove("hidden");
}

async function showRegister() {
  ["loginBox", "otpBox"].forEach((id) => document.getElementById(id).classList.add("hidden"));
  document.getElementById("regBox").classList.remove("hidden");
  initRegDates();
  try {
    const pol = await fetch("/api/public/policy").then((r) => r.json());
    if (pol && pol.paymentNumbers) {
      const p = pol.paymentNumbers;
      document.getElementById("regFeeBanner").innerHTML = `
        <strong>Malipo ya Kujiunga na WFC</strong>
        <span>Lipa ada ya fomu (${fmt(pol.registrationFee)}) + kiingilio (${fmt(pol.entryFee)}) kupitia M-Pesa (${esc(p.mpesa)}) · Tigo Pesa (${esc(p.tigo)}) · Airtel (${esc(p.airtel)}) kisha jaza fomu kamili hapa chini.</span>`;
    }
  } catch (e) {}
}

document.getElementById("loginBox").onsubmit = async (e) => {
  e.preventDefault();
  const d = await api("/api/login", "POST", {
    phone: document.getElementById("lPhone").value,
    password: document.getElementById("lPass").value
  });
  if (!d) return;
  if (d.needOtp) {
    document.getElementById("loginBox").classList.add("hidden");
    document.getElementById("otpBox").classList.remove("hidden");
    document.getElementById("otpMsg").textContent = d.devCode
      ? `Msimbo wa majaribio: ${d.devCode}`
      : "Msimbo wa OTP umetumwa kwenye simu yako.";
    return;
  }
  bootApp();
};

document.getElementById("otpBox").onsubmit = async (e) => {
  e.preventDefault();
  const d = await api("/api/verify-otp", "POST", {
    phone: document.getElementById("lPhone").value,
    code: document.getElementById("otpCode").value
  });
  if (d) bootApp();
};

document.getElementById("regBox").onsubmit = async (e) => {
  e.preventDefault();
  const d = await api("/api/register", "POST", {
    name: document.getElementById("rName").value,
    gender: document.getElementById("rGender").value,
    dob: document.getElementById("rDob").value,
    phone: document.getElementById("rPhone").value,
    email: document.getElementById("rEmail").value,
    nationalId: document.getElementById("rNationalId").value,
    maritalStatus: document.getElementById("rMarital").value,
    occupation: document.getElementById("rOccupation").value,
    region: document.getElementById("rRegion").value,
    originRegion: document.getElementById("rOriginRegion").value,
    district: document.getElementById("rDistrict").value,
    division: document.getElementById("rDivision").value,
    ward: document.getElementById("rWard").value,
    village: document.getElementById("rVillage").value,
    clan: document.getElementById("rClan").value,
    subClan: document.getElementById("rSubClan").value,
    ancestralArea: document.getElementById("rAncestralArea").value,
    placeOfBirth: document.getElementById("rPlaceOfBirth").value,
    fatherName: document.getElementById("rFatherName").value,
    grandfatherName: document.getElementById("rGrandfatherName").value,
    membershipCategory: document.getElementById("rCategory").value,
    registrationDate: document.getElementById("rRegDate").value,
    membershipExpiryDate: document.getElementById("rExpDate").value,
    profilePhoto: regPhotoDataUrl,
    paymentProof: document.getElementById("rProof").value,
    password: document.getElementById("rPass").value
  });
  if (d) {
    toast(d.message || "Usajili umepokelewa!");
    regPhotoDataUrl = "";
    e.target.reset();
    showLogin();
  }
};

async function logout() {
  closePopovers();
  await api("/api/logout", "POST");
  ME = null;
  document.getElementById("appShell").classList.add("hidden");
  document.getElementById("authScreen").classList.remove("hidden");
  showLogin();
}

// ==================== NAVIGATION & ICONS ====================

const ICONS = {
  home: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>`,
  members: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  payments: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>`,
  events: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  announcements: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11l18-5v12L3 13v-2z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>`,
  card: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M15 8h3"/><path d="M15 12h3"/><path d="M7 16h10"/></svg>`,
  history: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/></svg>`,
  documents: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
  family: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>`,
  directory: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  saccos: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
  elections: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
  attendance: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>`,
  penalties: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  help: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  notifications: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
  reports: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
  pending: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3z"/></svg>`,
  accounting: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/></svg>`,
  tickets: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/></svg>`,
  cases: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  assets: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`,
  projects: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
  messages: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  momo: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`,
  roles: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3 7h7l-5.5 4.5L18.5 21 12 16.5 5.5 21l2-7.5L2 9h7z"/></svg>`,
  settings: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`
};

const NAV_SECTIONS = [
  {
    secKey: "sec_main",
    items: [
      { id: "home", sw: "Dashibodi", en: "Dashboard" },
      { id: "members", sw: "Wanachama", en: "Members" },
      { id: "payments", sw: "Michango", en: "Contributions" },
      { id: "events", sw: "Matukio", en: "Events" },
      { id: "announcements", sw: "Matangazo", en: "Announcements" }
    ]
  },
  {
    secKey: "sec_member",
    items: [
      { id: "card", sw: "Kitambulisho", en: "Digital ID Card" },
      { id: "history", sw: "Historia ya Mwanachama", en: "Member History" },
      { id: "documents", sw: "Nyaraka", en: "Document Management" },
      { id: "family", sw: "Familia Yangu", en: "My Family" },
      { id: "directory", sw: "Directory", en: "Professionals Directory" },
      { id: "saccos", sw: "SACCOS", en: "SACCOS" },
      { id: "elections", sw: "Uchaguzi", en: "Elections" },
      { id: "attendance", sw: "Mahudhurio", en: "Attendance" },
      { id: "penalties", sw: "Utaratibu & Faini", en: "Rules & Penalties" },
      { id: "help", sw: "Msaada", en: "Support" },
      { id: "notifications", sw: "Taarifa", en: "Notifications" }
    ]
  },
  {
    secKey: "sec_office",
    leader: true,
    items: [
      { id: "reports", sw: "Ripoti & Takwimu", en: "Reports & Exports", leader: true },
      { id: "pending", sw: "Inasubiri Idhini", en: "Pending Approvals", leader: true },
      { id: "accounting", sw: "Uhasibu", en: "Accounting", leader: true },
      { id: "tickets", sw: "Tiketi za Matukio", en: "Event Tickets", leader: true },
      { id: "cases", sw: "Kesi & Nidhamu", en: "Cases & Discipline", leader: true },
      { id: "assets", sw: "Mali za Jumuiya", en: "Community Assets", leader: true },
      { id: "projects", sw: "Miradi", en: "Projects", leader: true },
      { id: "messages", sw: "Kituo cha Ujumbe", en: "Message Center", leader: true },
      { id: "momo", sw: "Malipo ya Simu", en: "Mobile Money", leader: true },
      { id: "roles", sw: "Uongozi & RBAC", en: "Leadership & Roles", admin: true }
    ]
  },
  {
    secKey: "sec_account",
    items: [
      { id: "settings", sw: "Akaunti & Usalama", en: "Account & Security" }
    ]
  }
];

function isLeaderRole() {
  return ["ADMIN", "CHAIRPERSON", "SECRETARY", "TREASURER", "REGIONAL"].includes(ME && ME.role);
}

function getAllAllowedItems() {
  const leader = isLeaderRole();
  const admin = ME && ME.role === "ADMIN";
  const out = [];
  NAV_SECTIONS.forEach((sec) => {
    if (sec.leader && !leader) return;
    sec.items.forEach((item) => {
      if (item.admin && !admin) return;
      if (item.leader && !leader) return;
      out.push({
        ...item,
        label: currentLang === "en" ? item.en : item.sw
      });
    });
  });
  return out;
}

function renderNav() {
  const leader = isLeaderRole();
  const admin = ME && ME.role === "ADMIN";
  const sb = document.getElementById("sbNav");

  sb.innerHTML = NAV_SECTIONS.map((sec) => {
    if (sec.leader && !leader) return "";
    const visibleItems = sec.items.filter((i) => (!i.admin || admin) && (!i.leader || leader));
    if (!visibleItems.length) return "";
    return `
      <div class="sb-sec">${esc(t(sec.secKey))}</div>
      ${visibleItems
        .map((i) => {
          const lbl = currentLang === "en" ? i.en : i.sw;
          return `<button type="button" class="sb-item" data-id="${i.id}" onclick="go('${i.id}')" title="${esc(lbl)}">
            ${ICONS[i.id] || ICONS.home}
            <span class="sb-label">${esc(lbl)}</span>
          </button>`;
        })
        .join("")}`;
  }).join("");

  const tabs = [
    { id: "home", sw: "Mwanzo", en: "Home" },
    { id: "members", sw: "Wanachama", en: "Members" },
    { id: "payments", sw: "Michango", en: "Payments" },
    { id: "history", sw: "Historia", en: "History" },
    { id: "card", sw: "Kadi", en: "ID Card" }
  ];
  document.getElementById("tabbar").innerHTML = tabs
    .map((tb) => {
      const lbl = currentLang === "en" ? tb.en : tb.sw;
      return `<button type="button" data-id="${tb.id}" onclick="go('${tb.id}')">${ICONS[tb.id] || ""}<span>${esc(lbl)}</span></button>`;
    })
    .join("");
}

function syncHeaderUserAndNotifications() {
  if (!ME) return;
  const photo = ME.profilePhoto && ME.profilePhoto.startsWith("data:image/") ? ME.profilePhoto : "/wfc-logo.jpg";
  document.getElementById("topUserAvatar").src = photo;
  document.getElementById("topUserName").textContent = ME.name;
  document.getElementById("topRoleBadge").textContent = `${ME.role} · ${ME.wfcId || "PENDING"}`;
  document.getElementById("pdFullName").textContent = ME.name;
  document.getElementById("pdWfcId").textContent = `${ME.wfcId || "Inasubiri ID"} · ${ME.phone}`;

  document.getElementById("sbUserMini").innerHTML = `
    <img src="${photo}" alt="">
    <div class="sb-mini-txt">
      <strong>${esc(ME.name)}</strong>
      <small>${esc(ME.role)} · ${esc(ME.region || "WFC")}</small>
    </div>`;
}

async function refreshHeaderNotifications() {
  if (!ME) return;
  const list = await api("/api/notifications");
  if (!Array.isArray(list)) return;
  cachedNotifications = list;
  const unread = list.filter((n) => !n.isRead);
  const badge = document.getElementById("notifBadge");
  if (unread.length > 0) {
    badge.textContent = unread.length > 99 ? "99+" : String(unread.length);
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
  }
  document.getElementById("notifPopSub").textContent =
    currentLang === "en" ? `${unread.length} unread alerts` : `Taarifa ${unread.length} hazijasomwa`;

  const popList = document.getElementById("notifPopList");
  popList.innerHTML = list.length
    ? list
        .slice(0, 6)
        .map(
          (n) => `
        <div class="notif-pop-item ${n.isRead ? "" : "unread"}" onclick="markSingleNotifRead('${esc(n.id)}')">
          <span class="notif-dot ${n.isRead ? "read" : ""}"></span>
          <div style="flex:1;min-width:0">
            <div style="display:flex;justify-content:space-between;gap:6px">
              <strong style="font-size:12.5px">${esc(n.title)}</strong>
              <small class="muted" style="font-size:10.5px">${fmtDate(n.createdAt)}</small>
            </div>
            <p class="muted" style="font-size:12px;margin-top:2px">${esc(n.body)}</p>
          </div>
        </div>`
        )
        .join("")
    : `<div style="padding:18px;text-align:center" class="muted">Hakuna taarifa mpya.</div>`;
}

async function markSingleNotifRead(id) {
  await api("/api/notifications/mark-read", "POST", { id });
  await refreshHeaderNotifications();
  if (currentPage === "notifications") renderNotifications();
}

async function markAllNotificationsRead() {
  await api("/api/notifications/mark-all-read", "POST", {});
  toast(currentLang === "en" ? "All notifications marked as read." : "Taarifa zote zimewekwa alama ya kusomwa.");
  await refreshHeaderNotifications();
  if (currentPage === "notifications") renderNotifications();
}

function goToChangePassword() {
  go("settings").then(() => {
    setTimeout(() => {
      const inp = document.getElementById("oldPass");
      if (inp) inp.focus();
    }, 150);
  });
}

async function go(id) {
  currentPage = id;
  closeMobileSidebar();
  const allowed = getAllAllowedItems();
  const item = allowed.find((x) => x.id === id) || allowed[0];
  document.getElementById("pageTitle").textContent = item.label;
  document.querySelectorAll("[data-id]").forEach((el) =>
    el.classList.toggle("active", el.dataset.id === item.id)
  );
  const c = document.getElementById("content");
  c.innerHTML = `<div class="card"><p class="muted">${currentLang === "en" ? "Loading..." : "Inapakia..."}</p></div>`;
  const routes = {
    home: renderHome,
    members: renderMembers,
    payments: renderPayments,
    events: renderEvents,
    announcements: renderAnnouncements,
    card: renderCard,
    history: renderMemberHistoryPage,
    documents: renderDocuments,
    family: renderFamily,
    directory: renderDirectory,
    saccos: renderSaccos,
    elections: renderElections,
    attendance: renderAttendance,
    penalties: renderPenalties,
    help: renderHelp,
    notifications: renderNotifications,
    reports: renderReports,
    pending: renderPending,
    accounting: renderAccounting,
    tickets: renderTicketsAdmin,
    cases: renderCases,
    assets: renderAssets,
    projects: renderProjects,
    messages: renderMessages,
    momo: renderMomo,
    roles: renderRoles,
    settings: renderSettings
  };
  await (routes[item.id] || renderHome)();
}

// ==================== 9. DASHBOARD IMPROVEMENTS (7 CARDS + 5 CHARTS) ====================

async function renderHome() {
  const [d, an] = await Promise.all([api("/api/dashboard"), api("/api/analytics")]);
  if (!d) return;
  POLICY = d.settings || POLICY;
  const c = document.getElementById("content");
  const leader = isLeaderRole();

  c.innerHTML = `
    <div class="kpis-7">
      <div class="kpi">
        <small>Jumla ya Wanachama (Total Members)</small>
        <strong>${d.stats.totalMembers}</strong>
        <span class="kpi-sub">Waliosajiliwa kwenye mfumo</span>
      </div>
      <div class="kpi kpi-ok">
        <small>Wanachama Hai (Active Members)</small>
        <strong>${d.stats.members}</strong>
        <span class="kpi-sub">Waliothibitishwa na WFC ID</span>
      </div>
      <div class="kpi kpi-info">
        <small>Wanachama Wapya (New This Month)</small>
        <strong>${d.stats.newMembersThisMonth}</strong>
        <span class="kpi-sub">Ndani ya siku 30 zilizopita</span>
      </div>
      <div class="kpi kpi-ok">
        <small>${leader ? "Jumla ya Michango (Total Contributions)" : "Michango Yangu Iliyoidhinishwa"}</small>
        <strong>${fmt(d.stats.totalContributions)}</strong>
        <span class="kpi-sub">Malipo yaliyothibitishwa</span>
      </div>
      <div class="kpi kpi-info">
        <small>Matukio Yajayo (Upcoming Events)</small>
        <strong>${d.stats.events}</strong>
        <span class="kpi-sub">Kalenda ya WFC</span>
      </div>
      <div class="kpi kpi-warn">
        <small>Inasubiri Idhini (Pending Approvals)</small>
        <strong>${leader ? d.stats.pendingTotal : d.stats.pending}</strong>
        <span class="kpi-sub">${leader ? "Wanachama, Michango & Tiketi" : "Hali ya maombi"}</span>
      </div>
      <div class="kpi">
        <small>Muhtasari wa Taarifa (Notifications)</small>
        <strong>${d.stats.unreadNotifications} <span style="font-size:13px;font-weight:600;color:var(--muted)">/ ${d.stats.totalNotifications}</span></strong>
        <span class="kpi-sub">Hazijasomwa / Jumla ya taarifa</span>
      </div>
      <div class="kpi">
        <small>Namba Yangu ya WFC</small>
        <strong>${esc(d.user.wfcId || "Inasubiri")}</strong>
        <span class="kpi-sub">${esc(d.user.membershipCategory || "Mwanachama")}</span>
      </div>
    </div>

    ${
      d.finance
        ? `<div class="kpis">
            <div class="kpi kpi-ok"><small>Jumla ya Mapato</small><strong>${fmt(d.finance.mapato)}</strong></div>
            <div class="kpi kpi-bad"><small>Jumla ya Matumizi</small><strong>${fmt(d.finance.matumizi)}</strong></div>
            <div class="kpi kpi-info"><small>Salio la Mfuko (Balance)</small><strong>${fmt(d.finance.balance)}</strong></div>
            <div class="kpi kpi-warn"><small>Madeni ya Ada (${d.finance.debtors} wanachama)</small><strong>${fmt(d.finance.totalDebt)}</strong></div>
          </div>`
        : ""
    }

    <div class="grid-2">
      <div class="card">
        <div class="card-head"><h3>📈 Mwenendo wa Ukuaji wa Wanachama (Membership Growth)</h3></div>
        <div id="chartGrowth"></div>
      </div>
      <div class="card">
        <div class="card-head"><h3>💰 Mwenendo wa Michango (Contribution Trend)</h3></div>
        <div id="chartContribTrend"></div>
      </div>
    </div>

    <div class="grid-3-cards">
      <div class="card">
        <div class="card-head"><h3>🗺️ Wanachama kwa Kanda / Mkoa</h3></div>
        <div id="chartRegion"></div>
      </div>
      <div class="card">
        <div class="card-head"><h3>🏔️ Wanachama kwa Ukoo (By Clan)</h3></div>
        <div id="chartClan"></div>
      </div>
      <div class="card">
        <div class="card-head"><h3>🎟️ Takwimu za Mahudhurio ya Matukio</h3></div>
        <div id="chartEventAtt"></div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-head"><h3>Michango ya Hivi Karibuni</h3><button class="btn-xs btn-secondary" onclick="go('payments')">Yote →</button></div>
        ${
          d.recent.length
            ? d.recent
                .map(
                  (p) => `<div class="row">
                    <div><strong>${esc(p.userName)}</strong><small class="muted" style="display:block">${esc(p.type)} · ${esc(p.transactionId)}</small></div>
                    <div style="text-align:right"><strong>${fmt(p.amount)}</strong><div>${statusBadge(p.status)}</div></div>
                  </div>`
                )
                .join("")
            : '<p class="muted">Hakuna mchango bado.</p>'
        }
      </div>
      <div class="card">
        <div class="card-head"><h3>Matukio &amp; Matangazo</h3><button class="btn-xs btn-secondary" onclick="go('events')">Matukio →</button></div>
        ${
          d.upcoming.length
            ? d.upcoming
                .map(
                  (e) => `<div class="row">
                    <div><strong>${esc(e.title)}</strong><small class="muted" style="display:block">${esc(e.type)} · ${esc(e.location || "")}</small></div>
                    <button class="btn-xs btn-outline" onclick="viewEventDetails('${esc(e.id)}')">View Details</button>
                  </div>`
                )
                .join("")
            : '<p class="muted">Hakuna tukio jipya.</p>'
        }
      </div>
    </div>`;

  if (window.ApexCharts && an) {
    // 1. Membership Growth Trend
    const gLabels = (an.growthTrend || []).map((x) => x.month);
    const gSeries = (an.growthTrend || []).map((x) => x.count);
    new ApexCharts(document.querySelector("#chartGrowth"), {
      chart: { type: "area", height: 245, toolbar: { show: false } },
      series: [{ name: "Wanachama Wapya", data: gSeries.length ? gSeries : [0] }],
      xaxis: { categories: gLabels.length ? gLabels : ["2026"] },
      colors: ["#F97316"],
      stroke: { curve: "smooth", width: 3 },
      fill: { type: "gradient", gradient: { opacityFrom: 0.4, opacityTo: 0.05 } }
    }).render();

    // 2. Contribution Trend
    const cLabels = (an.contributionTrend || []).map((x) => x.month);
    const cSeries = (an.contributionTrend || []).map((x) => x.amount);
    new ApexCharts(document.querySelector("#chartContribTrend"), {
      chart: { type: "bar", height: 245, toolbar: { show: false } },
      series: [{ name: "Michango (TSh)", data: cSeries.length ? cSeries : [0] }],
      xaxis: { categories: cLabels.length ? cLabels : ["2026"] },
      colors: ["#16A34A"],
      plotOptions: { bar: { borderRadius: 6 } }
    }).render();

    // 3. Members by Region
    const rList = an.regions || [];
    new ApexCharts(document.querySelector("#chartRegion"), {
      chart: { type: "bar", height: 240, toolbar: { show: false } },
      series: [{ name: "Wanachama", data: rList.map((r) => r.value) }],
      xaxis: { categories: rList.map((r) => r.name) },
      colors: ["#2563EB"],
      plotOptions: { bar: { horizontal: true, borderRadius: 5 } }
    }).render();

    // 4. Members by Clan
    const clList = an.clans || [];
    new ApexCharts(document.querySelector("#chartClan"), {
      chart: { type: "donut", height: 240 },
      series: clList.length ? clList.map((c) => c.value) : [1],
      labels: clList.length ? clList.map((c) => c.name) : ["Hakuna Data"],
      colors: ["#F97316", "#0F172A", "#16A34A", "#2563EB", "#D97706", "#7C3AED"]
    }).render();

    // 5. Event Attendance Statistics
    const evList = an.eventStats || [];
    new ApexCharts(document.querySelector("#chartEventAtt"), {
      chart: { type: "bar", height: 240, toolbar: { show: false } },
      series: [
        { name: "Tiketi", data: evList.map((e) => e.tickets) },
        { name: "Mahudhurio", data: evList.map((e) => e.attendance) }
      ],
      xaxis: { categories: evList.map((e) => e.title.slice(0, 14)) },
      colors: ["#F97316", "#0F172A"],
      plotOptions: { bar: { borderRadius: 4 } }
    }).render();
  }
}

// ==================== 10 & 5. MEMBERS MODULE (ADVANCED SEARCH, FILTERS & VIEW DETAILS) ====================

let memberQuickFilter = "ALL";

async function renderMembers() {
  const list = await api("/api/members");
  if (!list) return;
  cachedMembers = list;
  const leader = isLeaderRole();
  const admin = ME.role === "ADMIN";
  const c = document.getElementById("content");

  const uniqueRegions = [...new Set(list.map((u) => u.region).filter(Boolean))].sort();
  const uniqueDistricts = [...new Set(list.map((u) => u.district).filter(Boolean))].sort();
  const uniqueClans = [...new Set(list.map((u) => u.clan).filter(Boolean))].sort();

  c.innerHTML = `
    <div class="filter-panel">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px">
        <div>
          <strong>Utafutaji &amp; Uchujaji wa Kina (Advanced Search &amp; Filters)</strong>
          <small class="muted" style="display:block">Tafuta kwa jina, WFC ID, namba ya simu, barua pepe, mkoa, wilaya, ukoo au hali ya uanachama.</small>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${leader ? `<button class="btn-primary" onclick="openAdminRegisterMemberModal()">+ Sajili Mwanachama Mpya</button>` : ""}
          <button class="btn-secondary" onclick="resetMemberFilters()">↺ Safisha Vichujio</button>
        </div>
      </div>

      <div class="filter-grid">
        <div>
          <label class="lbl">Tafuta (Jina / WFC ID / Simu / Email / Ukoo)</label>
          <input id="mSearchInput" placeholder="Andika jina, WFC-0145, 0711..., Swai..." oninput="applyMemberFilters()">
        </div>
        <div>
          <label class="lbl">Mkoa (Region)</label>
          <select id="mFilterRegion" onchange="applyMemberFilters()">
            <option value="">Mikoa Yote</option>
            ${uniqueRegions.map((r) => `<option value="${esc(r)}">${esc(r)}</option>`).join("")}
          </select>
        </div>
        <div>
          <label class="lbl">Wilaya (District)</label>
          <select id="mFilterDistrict" onchange="applyMemberFilters()">
            <option value="">Wilaya Zote</option>
            ${uniqueDistricts.map((d) => `<option value="${esc(d)}">${esc(d)}</option>`).join("")}
          </select>
        </div>
        <div>
          <label class="lbl">Ukoo (Clan)</label>
          <select id="mFilterClan" onchange="applyMemberFilters()">
            <option value="">Koo Zote</option>
            ${uniqueClans.map((cl) => `<option value="${esc(cl)}">${esc(cl)}</option>`).join("")}
          </select>
        </div>
        <div>
          <label class="lbl">Hali (Status)</label>
          <select id="mFilterStatus" onchange="applyMemberFilters()">
            <option value="">Hali Zote</option>
            <option value="ACTIVE">ACTIVE (Hai)</option>
            <option value="PENDING">PENDING (Inasubiri)</option>
            <option value="SUSPENDED">SUSPENDED (Imesimamishwa)</option>
          </select>
        </div>
      </div>

      <div class="chip-bar" id="memberFilterChips">
        <button type="button" class="filter-chip active" data-qf="ALL" onclick="setMemberQuickFilter('ALL')">Wote (${list.length})</button>
        <button type="button" class="filter-chip" data-qf="ACTIVE" onclick="setMemberQuickFilter('ACTIVE')">Active Members (${list.filter((u) => u.status === "ACTIVE").length})</button>
        <button type="button" class="filter-chip" data-qf="INACTIVE" onclick="setMemberQuickFilter('INACTIVE')">Inactive / Pending (${list.filter((u) => u.status !== "ACTIVE").length})</button>
        <button type="button" class="filter-chip" data-qf="LEADERS" onclick="setMemberQuickFilter('LEADERS')">Leaders (${list.filter((u) => u.role && u.role !== "MEMBER").length})</button>
        <button type="button" class="filter-chip" data-qf="NEW" onclick="setMemberQuickFilter('NEW')">New Members (30d)</button>
        <button type="button" class="filter-chip" data-qf="PENDING" onclick="setMemberQuickFilter('PENDING')">Pending Approval (${list.filter((u) => u.status === "PENDING").length})</button>
      </div>
    </div>

    <div class="card">
      <div class="card-head">
        <h3>Orodha ya Wanachama (<span id="mFilteredCount">${list.length}</span>)</h3>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Mwanachama</th>
              <th>WFC ID</th>
              <th>Simu &amp; Email</th>
              <th>Mkoa / Wilaya</th>
              <th>Ukoo &amp; Asili</th>
              <th>Hali</th>
              <th>Vitendo (Actions)</th>
            </tr>
          </thead>
          <tbody id="mBody"></tbody>
        </table>
      </div>
    </div>`;

  applyMemberFilters();
}

function setMemberQuickFilter(qf) {
  memberQuickFilter = qf;
  document.querySelectorAll("#memberFilterChips .filter-chip").forEach((b) => {
    b.classList.toggle("active", b.dataset.qf === qf);
  });
  applyMemberFilters();
}

function resetMemberFilters() {
  memberQuickFilter = "ALL";
  const ids = ["mSearchInput", "mFilterRegion", "mFilterDistrict", "mFilterClan", "mFilterStatus"];
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  setMemberQuickFilter("ALL");
}

function applyMemberFilters() {
  const q = (document.getElementById("mSearchInput")?.value || "").toLowerCase().trim();
  const fReg = document.getElementById("mFilterRegion")?.value || "";
  const fDist = document.getElementById("mFilterDistrict")?.value || "";
  const fClan = document.getElementById("mFilterClan")?.value || "";
  const fStat = document.getElementById("mFilterStatus")?.value || "";
  const thirtyDaysAgo = Date.now() - 30 * 86400000;
  const admin = ME.role === "ADMIN";
  const leader = isLeaderRole();

  const filtered = cachedMembers.filter((u) => {
    if (memberQuickFilter === "ACTIVE" && u.status !== "ACTIVE") return false;
    if (memberQuickFilter === "INACTIVE" && u.status === "ACTIVE") return false;
    if (memberQuickFilter === "LEADERS" && (!u.role || u.role === "MEMBER")) return false;
    if (memberQuickFilter === "PENDING" && u.status !== "PENDING") return false;
    if (memberQuickFilter === "NEW") {
      const ts = new Date(u.registrationDate || u.createdAt || 0).getTime();
      if (ts < thirtyDaysAgo) return false;
    }

    if (fReg && u.region !== fReg) return false;
    if (fDist && u.district !== fDist) return false;
    if (fClan && u.clan !== fClan) return false;
    if (fStat && u.status !== fStat) return false;

    if (q) {
      const hay = [u.name, u.wfcId, u.phone, u.email, u.region, u.district, u.clan, u.ancestralArea, u.status]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const countEl = document.getElementById("mFilteredCount");
  if (countEl) countEl.textContent = filtered.length;

  const tbody = document.getElementById("mBody");
  if (!tbody) return;
  tbody.innerHTML = filtered.length
    ? filtered
        .map((u) => {
          const photo = u.profilePhoto && u.profilePhoto.startsWith("data:image/") ? u.profilePhoto : "/wfc-logo.jpg";
          const canView = leader || u.id === ME.id;
          return `<tr>
            <td>
              <div style="display:flex;align-items:center;gap:10px">
                <img src="${photo}" alt="" style="width:36px;height:36px;border-radius:50%;object-fit:cover;border:1.5px solid var(--border)">
                <div>
                  <strong>${esc(u.name)}</strong>
                  <small class="muted" style="display:block">${esc(u.role)} · ${esc(u.membershipCategory || "Kawaida")}</small>
                </div>
              </div>
            </td>
            <td class="mono"><strong>${esc(u.wfcId || "—")}</strong></td>
            <td>
              <div>${esc(u.phone)}</div>
              <small class="muted">${esc(u.email || "—")}</small>
            </td>
            <td>
              <div>${esc(u.region || "—")}</div>
              <small class="muted">${esc(u.district || "—")}</small>
            </td>
            <td>
              <div><strong>${esc(u.clan || "—")}</strong></div>
              <small class="muted">${esc(u.ancestralArea || "—")}</small>
            </td>
            <td>${statusBadge(u.status)}</td>
            <td>
              <div class="tbl-actions">
                ${canView ? `<button class="btn-xs btn-outline" onclick="viewMemberDetails('${esc(u.id)}')">👁️ View Details</button>` : ""}
                ${leader && u.status === "PENDING" ? `<button class="btn-xs btn-primary" onclick="approveMember('${esc(u.id)}')">Idhinisha</button>` : ""}
                ${
                  admin && u.id !== ME.id
                    ? `<button class="btn-xs btn-secondary" onclick="suspendMember('${esc(u.id)}')">${u.status === "SUSPENDED" ? "Rejesha" : "Simamisha"}</button>`
                    : ""
                }
              </div>
            </td>
          </tr>`;
        })
        .join("")
    : `<tr><td colspan="7" class="muted" style="text-align:center;padding:24px">Hakuna mwanachama aliyepatikana kwa vigezo ulivyochagua.</td></tr>`;
}

// ==================== 5. MEMBER VIEW DETAILS MODAL (6 COMPREHENSIVE TABS) ====================

async function viewMemberDetails(userId, initialTab = "profile") {
  const data = await api(`/api/members/${encodeURIComponent(userId)}/details`);
  if (!data) return;
  const m = data.member;
  const photo = m.profilePhoto && m.profilePhoto.startsWith("data:image/") ? m.profilePhoto : "/wfc-logo.jpg";

  const tabsHtml = `
    <div style="display:flex;align-items:center;gap:14px;padding-bottom:16px;border-bottom:1px solid var(--border);margin-bottom:16px;flex-wrap:wrap">
      <img src="${photo}" alt="" style="width:68px;height:68px;border-radius:50%;object-fit:cover;border:3px solid var(--brand)">
      <div style="flex:1;min-width:200px">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <h3 style="font-size:19px">${esc(m.name)}</h3>
          ${statusBadge(m.status)}
          <span class="badge badge-brand">${esc(m.role)}</span>
        </div>
        <p class="muted" style="font-size:13px;margin-top:3px">
          WFC ID: <strong class="mono">${esc(m.wfcId || "Inasubiri")}</strong> · Simu: <strong>${esc(m.phone)}</strong> · Ukoo: <strong>${esc(m.clan || "—")}</strong> (${esc(m.ancestralArea || "—")})
        </p>
      </div>
      <div style="text-align:right">
        <small class="muted" style="display:block">Deni la Ada ya Mwezi</small>
        <strong style="color:${data.debtInfo.debt > 0 ? "var(--bad)" : "var(--ok)"};font-size:16px">${fmt(data.debtInfo.debt)}</strong>
      </div>
    </div>

    <div class="tabs" id="mdTabs">
      <button type="button" class="tab ${initialTab === "profile" ? "active" : ""}" onclick="switchMdTab('profile')">1. Complete Profile</button>
      <button type="button" class="tab ${initialTab === "history" ? "active" : ""}" onclick="switchMdTab('history')">2. Registration &amp; Membership History (${data.history.length})</button>
      <button type="button" class="tab ${initialTab === "payments" ? "active" : ""}" onclick="switchMdTab('payments')">3. Contributions History (${data.payments.length})</button>
      <button type="button" class="tab ${initialTab === "attendance" ? "active" : ""}" onclick="switchMdTab('attendance')">4. Attendance History (${data.attendance.length})</button>
      <button type="button" class="tab ${initialTab === "docs" ? "active" : ""}" onclick="switchMdTab('docs')">5. Uploaded Documents (${data.documents.length})</button>
      <button type="button" class="tab ${initialTab === "notifs" ? "active" : ""}" onclick="switchMdTab('notifs')">6. Notifications History (${data.notifications.length})</button>
    </div>

    <div id="mdPane-profile" class="md-pane ${initialTab === "profile" ? "" : "hidden"}">
      <h4 style="margin-bottom:10px;color:var(--brand-d)">A. Taarifa Binafsi (Personal Information)</h4>
      <div class="detail-kv-grid">
        <div class="detail-kv"><small>Jina Kamili</small><strong>${esc(m.name)}</strong></div>
        <div class="detail-kv"><small>Jinsia (Gender)</small><strong>${esc(m.gender || "—")}</strong></div>
        <div class="detail-kv"><small>Tarehe ya Kuzaliwa</small><strong>${esc(m.dob || "—")}</strong></div>
        <div class="detail-kv"><small>Namba ya Simu</small><strong>${esc(m.phone)}</strong></div>
        <div class="detail-kv"><small>Barua Pepe</small><strong>${esc(m.email || "—")}</strong></div>
        <div class="detail-kv"><small>Namba ya NIDA</small><strong>${esc(m.nationalId || "—")}</strong></div>
        <div class="detail-kv"><small>Hali ya Ndoa</small><strong>${esc(m.maritalStatus || "—")}</strong></div>
        <div class="detail-kv"><small>Kazi / Taaluma</small><strong>${esc(m.occupation || m.profession || "—")}</strong></div>
        <div class="detail-kv"><small>Mkoa Unaoishi</small><strong>${esc(m.region || "—")}</strong></div>
      </div>

      <h4 style="margin:14px 0 10px;color:var(--brand-d)">B. Taarifa za Asili ya Kichagga (Chagga Heritage Information)</h4>
      <div class="detail-kv-grid">
        <div class="detail-kv"><small>Mkoa wa Asili</small><strong>${esc(m.originRegion || "Kilimanjaro")}</strong></div>
        <div class="detail-kv"><small>Wilaya (District)</small><strong>${esc(m.district || "—")}</strong></div>
        <div class="detail-kv"><small>Tarafa (Division)</small><strong>${esc(m.division || "—")}</strong></div>
        <div class="detail-kv"><small>Kata (Ward)</small><strong>${esc(m.ward || "—")}</strong></div>
        <div class="detail-kv"><small>Kijiji (Village)</small><strong>${esc(m.village || "—")}</strong></div>
        <div class="detail-kv"><small>Ukoo (Clan)</small><strong>${esc(m.clan || "—")}</strong></div>
        <div class="detail-kv"><small>Ukoo Mdogo (Sub-clan)</small><strong>${esc(m.subClan || "—")}</strong></div>
        <div class="detail-kv"><small>Eneo la Asili</small><strong>${esc(m.ancestralArea || "—")}</strong></div>
        <div class="detail-kv"><small>Mahali Alipozaliwa</small><strong>${esc(m.placeOfBirth || "—")}</strong></div>
        <div class="detail-kv"><small>Jina la Baba</small><strong>${esc(m.fatherName || "—")}</strong></div>
        <div class="detail-kv"><small>Jina la Babu</small><strong>${esc(m.grandfatherName || "—")}</strong></div>
      </div>

      <h4 style="margin:14px 0 10px;color:var(--brand-d)">C. Taarifa za Uanachama (Membership Information)</h4>
      <div class="detail-kv-grid">
        <div class="detail-kv"><small>Namba ya Uanachama</small><strong class="mono">${esc(m.wfcId || "Inasubiri")}</strong></div>
        <div class="detail-kv"><small>Kategoria</small><strong>${esc(m.membershipCategory || "Mwanachama wa Kawaida")}</strong></div>
        <div class="detail-kv"><small>Hali ya Uanachama</small><strong>${esc(m.status)}</strong></div>
        <div class="detail-kv"><small>Tarehe ya Usajili</small><strong>${esc(m.registrationDate || fmtDate(m.createdAt))}</strong></div>
        <div class="detail-kv"><small>Tarehe ya Mwisho (Expiry)</small><strong>${esc(m.membershipExpiryDate || "—")}</strong></div>
        <div class="detail-kv"><small>Uthibitisho wa Kiingilio</small><strong class="mono">${esc(m.paymentProof || "—")}</strong></div>
      </div>
    </div>

    <div id="mdPane-history" class="md-pane ${initialTab === "history" ? "" : "hidden"}">
      ${renderTimelineHtml(data.history)}
    </div>

    <div id="mdPane-payments" class="md-pane ${initialTab === "payments" ? "" : "hidden"}">
      <div class="table-wrap">
        <table>
          <thead><tr><th>Aina ya Mchango</th><th>Kiasi</th><th>Muamala</th><th>Risiti</th><th>Tarehe</th><th>Hali</th></tr></thead>
          <tbody>
            ${
              data.payments.length
                ? data.payments
                    .map(
                      (p) => `<tr>
                        <td><strong>${esc(p.type)}</strong></td>
                        <td>${fmt(p.amount)}</td>
                        <td class="mono">${esc(p.transactionId)}</td>
                        <td class="mono">${esc(p.receiptNo || "—")}</td>
                        <td>${fmtDate(p.createdAt)}</td>
                        <td>${statusBadge(p.status)}</td>
                      </tr>`
                    )
                    .join("")
                : `<tr><td colspan="6" class="muted">Hakuna historia ya michango kwa mwanachama huyu.</td></tr>`
            }
          </tbody>
        </table>
      </div>
    </div>

    <div id="mdPane-attendance" class="md-pane ${initialTab === "attendance" ? "" : "hidden"}">
      ${
        data.attendance.length
          ? data.attendance
              .map(
                (a) => `<div class="row">
                  <div><strong>${esc(a.meeting)}</strong><small class="muted" style="display:block">${new Date(a.date).toLocaleString("sw-TZ")}</small></div>
                  <span class="badge badge-ok">ALIHUDHURIA</span>
                </div>`
              )
              .join("")
          : '<p class="muted">Hakuna rekodi ya mahudhurio bado.</p>'
      }
    </div>

    <div id="mdPane-docs" class="md-pane ${initialTab === "docs" ? "" : "hidden"}">
      ${
        data.documents.length
          ? data.documents
              .map(
                (doc) => `<div class="row">
                  <div>
                    <strong>${esc(doc.title)}</strong>
                    <small class="muted" style="display:block">${esc(docTypeLabel(doc.docType))} · ${esc(doc.fileName)} · ${fmtDate(doc.createdAt)}</small>
                  </div>
                  <div class="tbl-actions">
                    <button class="btn-xs btn-outline" onclick="previewMemberDocument('${esc(doc.id)}')">View</button>
                    <button class="btn-xs btn-secondary" onclick="downloadMemberDocument('${esc(doc.id)}')">Download</button>
                  </div>
                </div>`
              )
              .join("")
          : '<p class="muted">Hakuna nyaraka zilizopakiwa kwa mwanachama huyu.</p>'
      }
    </div>

    <div id="mdPane-notifs" class="md-pane ${initialTab === "notifs" ? "" : "hidden"}">
      ${
        data.notifications.length
          ? data.notifications
              .slice(0, 20)
              .map(
                (n) => `<div class="row">
                  <div>
                    <span class="badge badge-info">${esc(notifCategoryLabel(n.category))}</span>
                    <strong style="margin-left:6px">${esc(n.title)}</strong>
                    <p class="muted" style="font-size:13px;margin-top:3px">${esc(n.body)}</p>
                  </div>
                  <small class="muted">${fmtDate(n.createdAt)}</small>
                </div>`
              )
              .join("")
          : '<p class="muted">Hakuna taarifa zilizotumwa.</p>'
      }
    </div>`;

  openDetailsModal(`Wasifu & Historia: ${m.name}`, `${m.wfcId || "WFC"} · ${m.region || ""}`, tabsHtml);
}

function switchMdTab(tabName) {
  document.querySelectorAll(".md-pane").forEach((p) => p.classList.add("hidden"));
  const target = document.getElementById(`mdPane-${tabName}`);
  if (target) target.classList.remove("hidden");
  document.querySelectorAll("#mdTabs .tab").forEach((b, idx) => {
    const names = ["profile", "history", "payments", "attendance", "docs", "notifs"];
    b.classList.toggle("active", names[idx] === tabName);
  });
}

function openMyProfileModal() {
  if (!ME) return;
  viewMemberDetails(ME.id, "profile");
}

function openAdminRegisterMemberModal() {
  adminRegPhotoDataUrl = "";
  const today = new Date().toISOString().slice(0, 10);
  const nextYr = new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10);
  const html = `
    <form id="adminRegForm" onsubmit="submitAdminRegisterMember(event)">
      <div class="reg-section-card">
        <h4 class="reg-sec-title">1. Taarifa Binafsi (Personal Information)</h4>
        <div class="grid-3-form">
          <div><label class="lbl">Jina Kamili *</label><input id="arName" required></div>
          <div><label class="lbl">Jinsia</label><select id="arGender"><option value="Me">Mwanaume</option><option value="Ke">Mwanamke</option></select></div>
          <div><label class="lbl">Tarehe ya Kuzaliwa</label><input id="arDob" type="date"></div>
          <div><label class="lbl">Namba ya Simu *</label><input id="arPhone" required></div>
          <div><label class="lbl">Barua Pepe</label><input id="arEmail" type="email"></div>
          <div><label class="lbl">Namba ya NIDA</label><input id="arNida"></div>
          <div><label class="lbl">Hali ya Ndoa</label><select id="arMarital"><option>Hajaoa/Hajaolewa</option><option>Ameoa/Ameolewa</option><option>Mjane</option><option>Mtalaka</option></select></div>
          <div><label class="lbl">Kazi / Taaluma</label><input id="arOcc"></div>
          <div><label class="lbl">Mkoa Unaoishi</label><input id="arRegion" value="Dar es Salaam"></div>
        </div>
      </div>

      <div class="reg-section-card">
        <h4 class="reg-sec-title">2. Asili ya Kichagga (Chagga Heritage Information)</h4>
        <div class="grid-3-form">
          <div><label class="lbl">Mkoa wa Asili</label><input id="arOrigin" value="Kilimanjaro"></div>
          <div><label class="lbl">Wilaya</label><select id="arDistrict"><option>Hai</option><option>Moshi Vijijini</option><option>Moshi Mjini</option><option>Rombo</option><option>Siha</option><option>Mwanga</option><option>Same</option></select></div>
          <div><label class="lbl">Tarafa</label><input id="arDivision"></div>
          <div><label class="lbl">Kata</label><input id="arWard"></div>
          <div><label class="lbl">Kijiji</label><input id="arVillage"></div>
          <div><label class="lbl">Ukoo (Clan) *</label><input id="arClan" required></div>
          <div><label class="lbl">Ukoo Mdogo</label><input id="arSubClan"></div>
          <div><label class="lbl">Eneo la Asili</label><select id="arArea"><option>Machame</option><option>Marangu</option><option>Rombo</option><option>Kibosho</option><option>Uru</option><option>Old Moshi</option><option>Mwika</option><option>Kilema</option><option>Mamba</option><option>Siha</option></select></div>
          <div><label class="lbl">Mahali Alipozaliwa</label><input id="arPob"></div>
          <div><label class="lbl">Jina la Baba</label><input id="arFather"></div>
          <div><label class="lbl">Jina la Babu</label><input id="arGrandfather"></div>
        </div>
      </div>

      <div class="reg-section-card">
        <h4 class="reg-sec-title">3. Taarifa za Uanachama</h4>
        <div class="grid-3-form">
          <div><label class="lbl">Kategoria</label><select id="arCat"><option>Mwanachama wa Kawaida</option><option>Mwanachama Mwanzilishi</option><option>Mwanachama wa Familia</option><option>Mwanafunzi / Kijana</option></select></div>
          <div><label class="lbl">Hali ya Awali</label><select id="arStatus"><option value="ACTIVE">ACTIVE (Idhinisha Sasa)</option><option value="PENDING">PENDING</option></select></div>
          <div><label class="lbl">Nenosiri la Awali</label><input id="arPass" value="wfc12345" required></div>
          <div><label class="lbl">Tarehe ya Usajili</label><input id="arRegDate" type="date" value="${today}"></div>
          <div><label class="lbl">Tarehe ya Mwisho</label><input id="arExpDate" type="date" value="${nextYr}"></div>
          <div><label class="lbl">Picha ya Mwanachama</label><input type="file" accept="image/*" onchange="handleAdminRegPhoto(this)"></div>
        </div>
      </div>
      <button class="btn-primary" style="width:100%">Hifadhi na Sajili Mwanachama</button>
    </form>`;
  openDetailsModal("Sajili Mwanachama Mpya (Ofisi)", "Usajili wa moja kwa moja wenye taarifa kamili za V6", html);
}

function handleAdminRegPhoto(inp) {
  const f = inp && inp.files && inp.files[0];
  if (!f || f.size > 1500000) return;
  const r = new FileReader();
  r.onload = () => {
    adminRegPhotoDataUrl = String(r.result || "");
  };
  r.readAsDataURL(f);
}

async function submitAdminRegisterMember(e) {
  e.preventDefault();
  const d = await api("/api/members/register-admin", "POST", {
    name: document.getElementById("arName").value,
    gender: document.getElementById("arGender").value,
    dob: document.getElementById("arDob").value,
    phone: document.getElementById("arPhone").value,
    email: document.getElementById("arEmail").value,
    nationalId: document.getElementById("arNida").value,
    maritalStatus: document.getElementById("arMarital").value,
    occupation: document.getElementById("arOcc").value,
    region: document.getElementById("arRegion").value,
    originRegion: document.getElementById("arOrigin").value,
    district: document.getElementById("arDistrict").value,
    division: document.getElementById("arDivision").value,
    ward: document.getElementById("arWard").value,
    village: document.getElementById("arVillage").value,
    clan: document.getElementById("arClan").value,
    subClan: document.getElementById("arSubClan").value,
    ancestralArea: document.getElementById("arArea").value,
    placeOfBirth: document.getElementById("arPob").value,
    fatherName: document.getElementById("arFather").value,
    grandfatherName: document.getElementById("arGrandfather").value,
    membershipCategory: document.getElementById("arCat").value,
    status: document.getElementById("arStatus").value,
    password: document.getElementById("arPass").value,
    registrationDate: document.getElementById("arRegDate").value,
    membershipExpiryDate: document.getElementById("arExpDate").value,
    profilePhoto: adminRegPhotoDataUrl
  });
  if (d) {
    toast(`Mwanachama ${d.member.name} (${d.member.wfcId}) amesajiliwa!`);
    closeDetailsModal();
    renderMembers();
  }
}

// ==================== 6. DEDICATED MEMBER HISTORY MODULE ====================

function renderTimelineHtml(items) {
  if (!items || !items.length) {
    return `<p class="muted">Hakuna kumbukumbu za historia bado.</p>`;
  }
  return `<div class="timeline">
    ${items
      .map(
        (h) => `
      <div class="tl-item">
        <span class="tl-dot"></span>
        <div class="tl-card">
          <div class="tl-head">
            <div>
              <span class="badge badge-brand">${esc(h.type || "EVENT")}</span>
              <strong style="margin-left:6px">${esc(h.title)}</strong>
            </div>
            <small class="muted">${new Date(h.date).toLocaleString("sw-TZ")}</small>
          </div>
          <p style="font-size:13.5px;color:#334155">${esc(h.detail)}</p>
          <small class="muted">Mhusika: ${esc(h.actor || "Mfumo")}</small>
        </div>
      </div>`
      )
      .join("")}
  </div>`;
}

async function renderMemberHistoryPage() {
  const leader = isLeaderRole();
  const c = document.getElementById("content");
  let membersList = [];
  if (leader) {
    membersList = (await api("/api/members")) || [];
  }
  const selectedId = leader && membersList.length ? membersList[0].id : ME.id;

  c.innerHTML = `
    <div class="card">
      <div class="card-head">
        <div>
          <h3>Historia Kamili ya Mwanachama (Member History Module)</h3>
          <small class="muted">Usajili, mabadiliko ya uanachama, michango, mahudhurio, uongozi, taarifa, na nyaraka.</small>
        </div>
        ${
          leader
            ? `<div style="min-width:280px">
                <label class="lbl">Chagua Mwanachama wa Kukagua</label>
                <select id="histMemberSelect" onchange="loadMemberHistoryTarget(this.value)">
                  ${membersList
                    .map((u) => `<option value="${esc(u.id)}" ${u.id === ME.id ? "selected" : ""}>${esc(u.name)} (${esc(u.wfcId || u.phone)})</option>`)
                    .join("")}
                </select>
              </div>`
            : ""
        }
      </div>
      <div id="memberHistoryTargetBox"><p class="muted">Inapakia historia...</p></div>
    </div>`;

  await loadMemberHistoryTarget(leader ? ME.id : selectedId);
}

async function loadMemberHistoryTarget(userId) {
  const data = await api(`/api/members/${encodeURIComponent(userId)}/details`);
  if (!data) return;
  const box = document.getElementById("memberHistoryTargetBox");
  if (!box) return;
  const m = data.member;

  box.innerHTML = `
    <div class="kpis" style="margin-top:10px">
      <div class="kpi"><small>Tarehe ya Usajili</small><strong>${esc(m.registrationDate || fmtDate(m.createdAt))}</strong></div>
      <div class="kpi kpi-ok"><small>Michango Iliyofanyika</small><strong>${data.payments.length}</strong></div>
      <div class="kpi kpi-info"><small>Mahudhurio ya Matukio</small><strong>${data.attendance.length}</strong></div>
      <div class="kpi kpi-warn"><small>Nyaraka Zilizopakiwa</small><strong>${data.documents.length}</strong></div>
    </div>

    <div class="tabs" id="mhFilterTabs">
      <button class="tab active" onclick="filterMhPane('all',this)">Mfuatano Wote (${data.history.length})</button>
      <button class="tab" onclick="filterMhPane('contrib',this)">Michango (${data.payments.length})</button>
      <button class="tab" onclick="filterMhPane('events',this)">Matukio &amp; Mahudhurio (${data.attendance.length})</button>
      <button class="tab" onclick="filterMhPane('leadership',this)">Uongozi (${data.leadershipHistory.length})</button>
      <button class="tab" onclick="filterMhPane('docs',this)">Nyaraka (${data.documents.length})</button>
      <button class="tab" onclick="filterMhPane('notifs',this)">Taarifa (${data.notifications.length})</button>
    </div>

    <div id="mhPane-all" class="mh-pane">${renderTimelineHtml(data.history)}</div>
    <div id="mhPane-contrib" class="mh-pane hidden">
      ${
        data.payments.length
          ? data.payments
              .map(
                (p) => `<div class="row">
                  <div><strong>${esc(p.type)}</strong> · <span class="mono">${esc(p.transactionId)}</span><small class="muted" style="display:block">${fmtDate(p.createdAt)} · Risiti: ${esc(p.receiptNo || "—")}</small></div>
                  <div style="text-align:right"><strong>${fmt(p.amount)}</strong><div>${statusBadge(p.status)}</div></div>
                </div>`
              )
              .join("")
          : '<p class="muted">Hakuna historia ya michango.</p>'
      }
    </div>
    <div id="mhPane-events" class="mh-pane hidden">
      ${
        data.attendance.length
          ? data.attendance
              .map(
                (a) => `<div class="row">
                  <div><strong>${esc(a.meeting)}</strong><small class="muted" style="display:block">${new Date(a.date).toLocaleString("sw-TZ")}</small></div>
                  <span class="badge badge-ok">ALIHUDHURIA</span>
                </div>`
              )
              .join("")
          : '<p class="muted">Hakuna historia ya mahudhurio ya matukio.</p>'
      }
    </div>
    <div id="mhPane-leadership" class="mh-pane hidden">
      ${
        data.leadershipHistory.length
          ? data.leadershipHistory
              .map(
                (l) => `<div class="row">
                  <div>
                    <strong>${esc(l.position)}</strong>
                    <small class="muted" style="display:block">Kipindi: ${esc(l.startDate)} → ${esc(l.endDate)}</small>
                    <p style="font-size:13px;margin-top:4px">${esc(l.responsibilities)}</p>
                  </div>
                  ${statusBadge(l.status)}
                </div>`
              )
              .join("")
          : '<p class="muted">Hana rekodi ya nafasi za uongozi bado.</p>'
      }
    </div>
    <div id="mhPane-docs" class="mh-pane hidden">
      ${
        data.documents.length
          ? data.documents
              .map(
                (doc) => `<div class="row">
                  <div><strong>${esc(doc.title)}</strong><small class="muted" style="display:block">${esc(docTypeLabel(doc.docType))} · ${fmtDate(doc.createdAt)}</small></div>
                  <button class="btn-xs btn-outline" onclick="previewMemberDocument('${esc(doc.id)}')">View</button>
                </div>`
              )
              .join("")
          : '<p class="muted">Hakuna historia ya upakiaji wa nyaraka.</p>'
      }
    </div>
    <div id="mhPane-notifs" class="mh-pane hidden">
      ${
        data.notifications.length
          ? data.notifications
              .slice(0, 25)
              .map(
                (n) => `<div class="row">
                  <div><strong>${esc(n.title)}</strong><p class="muted" style="font-size:13px">${esc(n.body)}</p></div>
                  <small class="muted">${fmtDate(n.createdAt)}</small>
                </div>`
              )
              .join("")
          : '<p class="muted">Hakuna taarifa zilizopokelewa.</p>'
      }
    </div>`;
}

function filterMhPane(pane, btn) {
  document.querySelectorAll(".mh-pane").forEach((el) => el.classList.add("hidden"));
  const target = document.getElementById(`mhPane-${pane}`);
  if (target) target.classList.remove("hidden");
  document.querySelectorAll("#mhFilterTabs .tab").forEach((b) => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
}

// ==================== 11. DOCUMENT MANAGEMENT MODULE ====================

let cachedMemberDocs = [];

async function renderDocuments() {
  const [mDocs, commDocs, members] = await Promise.all([
    api("/api/member-documents"),
    api("/api/documents"),
    isLeaderRole() ? api("/api/members") : Promise.resolve([])
  ]);
  if (!mDocs) return;
  cachedMemberDocs = mDocs;
  const leader = isLeaderRole();
  const c = document.getElementById("content");

  c.innerHTML = `
    <div class="grid-2">
      <div class="card">
        <div class="card-head"><h3>📤 Pakia Nyaraka ya Mwanachama</h3></div>
        <form id="memberDocUploadForm">
          ${
            leader
              ? `<label class="lbl">Mwanachama Mhusika</label>
                 <select id="mdOwnerId">
                   ${(members || []).map((u) => `<option value="${esc(u.id)}" ${u.id === ME.id ? "selected" : ""}>${esc(u.name)} (${esc(u.wfcId || u.phone)})</option>`).join("")}
                 </select>`
              : ""
          }
          <label class="lbl">Aina ya Nyaraka (Document Type)</label>
          <select id="mdDocType">
            <option value="NATIONAL_ID">National ID (Kitambulisho cha NIDA)</option>
            <option value="BIRTH_CERTIFICATE">Birth Certificate (Cheti cha Kuzaliwa)</option>
            <option value="PASSPORT_PHOTO">Passport Photo (Picha ya Pasipoti)</option>
            <option value="APPLICATION_FORM">Membership Application Form (Fomu ya Maombi)</option>
            <option value="OTHER">Other Supporting Documents (Nyaraka Nyingine)</option>
          </select>
          <label class="lbl">Kichwa / Maelezo ya Nyaraka *</label>
          <input id="mdTitle" placeholder="Mfano: Kitambulisho cha Taifa - NIDA" required>
          <label class="lbl">Chagua Faili (PDF, JPG, PNG — hadi 2MB) *</label>
          <input id="mdFile" type="file" accept=".pdf,image/*,.doc,.docx" required>
          <button class="btn-primary" style="width:100%">Hifadhi Nyaraka Salama</button>
        </form>
      </div>

      <div class="card">
        <div class="card-head"><h3>📚 Maktaba &amp; Katiba ya Jumuiya</h3></div>
        ${
          leader
            ? `<form id="docForm" style="margin-bottom:14px">
                <label class="lbl">Kichwa cha Nyaraka ya Jumuiya</label><input id="dTitle" required>
                <label class="lbl">Kiungo (URL)</label><input id="dUrl" placeholder="https://...">
                <label class="lbl">Muhtasari</label><input id="dSum">
                <button class="btn-secondary">Ongeza kwenye Maktaba</button>
              </form>`
            : ""
        }
        ${
          (commDocs || []).length
            ? commDocs
                .map(
                  (d) => `<div class="row">
                    <div><strong>${esc(d.title)}</strong><small class="muted" style="display:block">${esc(d.summary || "")}</small></div>
                    <a href="${esc(safeUrl(d.url))}" target="_blank" rel="noopener noreferrer" class="btn-xs btn-outline">Fungua</a>
                  </div>`
                )
                .join("")
            : '<p class="muted">Hakuna nyaraka za jumuiya zilizowekwa bado.</p>'
        }
      </div>
    </div>

    <div class="card">
      <div class="card-head">
        <h3>🗂️ Nyaraka za Wanachama (${mDocs.length})</h3>
        <select id="mdFilterType" style="width:auto;min-width:220px;margin:0" onchange="filterMemberDocsTable()">
          <option value="">Aina Zote za Nyaraka</option>
          <option value="NATIONAL_ID">National ID</option>
          <option value="BIRTH_CERTIFICATE">Birth Certificate</option>
          <option value="PASSPORT_PHOTO">Passport Photo</option>
          <option value="APPLICATION_FORM">Membership Application Form</option>
          <option value="OTHER">Other Supporting Documents</option>
        </select>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Mwanachama</th>
              <th>Aina ya Nyaraka</th>
              <th>Jina la Nyaraka</th>
              <th>Faili</th>
              <th>Tarehe</th>
              <th>Vitendo (View / Download / Replace / Delete)</th>
            </tr>
          </thead>
          <tbody id="mdTableBody"></tbody>
        </table>
      </div>
    </div>`;

  filterMemberDocsTable();

  document.getElementById("memberDocUploadForm").onsubmit = async (e) => {
    e.preventDefault();
    const f = document.getElementById("mdFile").files[0];
    if (!f) return toast("Chagua faili kwanza");
    if (f.size > 2200000) return toast("Faili lisizidi 2.2MB");

    const reader = new FileReader();
    reader.onload = async () => {
      const res = await api("/api/member-documents", "POST", {
        userId: leader ? document.getElementById("mdOwnerId").value : ME.id,
        docType: document.getElementById("mdDocType").value,
        title: document.getElementById("mdTitle").value,
        fileName: f.name,
        mimeType: f.type,
        fileSize: f.size,
        fileData: reader.result
      });
      if (res) {
        toast("Nyaraka imehifadhiwa kikamilifu!");
        renderDocuments();
      }
    };
    reader.readAsDataURL(f);
  };

  if (leader && document.getElementById("docForm")) {
    document.getElementById("docForm").onsubmit = async (e) => {
      e.preventDefault();
      if (
        await api("/api/documents", "POST", {
          title: document.getElementById("dTitle").value,
          url: document.getElementById("dUrl").value,
          summary: document.getElementById("dSum").value
        })
      ) {
        toast("Nyaraka ya jumuiya imeongezwa");
        renderDocuments();
      }
    };
  }
}

function filterMemberDocsTable() {
  const fType = document.getElementById("mdFilterType")?.value || "";
  const rows = cachedMemberDocs.filter((d) => !fType || d.docType === fType);
  const tbody = document.getElementById("mdTableBody");
  if (!tbody) return;
  tbody.innerHTML = rows.length
    ? rows
        .map(
          (d) => `<tr>
            <td><strong>${esc(d.userName)}</strong><small class="muted mono" style="display:block">${esc(d.wfcId || "")}</small></td>
            <td><span class="badge badge-info">${esc(docTypeLabel(d.docType))}</span></td>
            <td><strong>${esc(d.title)}</strong></td>
            <td><small class="muted">${esc(d.fileName)}</small></td>
            <td>${fmtDate(d.updatedAt || d.createdAt)}</td>
            <td>
              <div class="tbl-actions">
                <button class="btn-xs btn-outline" onclick="previewMemberDocument('${esc(d.id)}')">👁️ View</button>
                <button class="btn-xs btn-secondary" onclick="downloadMemberDocument('${esc(d.id)}')">⬇️ Download</button>
                <button class="btn-xs btn-secondary" onclick="promptReplaceMemberDocument('${esc(d.id)}')">🔄 Replace</button>
                <button class="btn-xs btn-danger" onclick="deleteMemberDocument('${esc(d.id)}')">🗑️ Delete</button>
              </div>
            </td>
          </tr>`
        )
        .join("")
    : `<tr><td colspan="6" class="muted" style="text-align:center;padding:20px">Hakuna nyaraka iliyopakiwa bado.</td></tr>`;
}

async function getDocById(docId) {
  let doc = cachedMemberDocs.find((d) => d.id === docId);
  if (!doc) {
    const all = (await api("/api/member-documents")) || [];
    cachedMemberDocs = all;
    doc = all.find((d) => d.id === docId);
  }
  return doc;
}

async function previewMemberDocument(docId) {
  const doc = await getDocById(docId);
  if (!doc) return toast("Nyaraka haijapatikana");
  const isImg = String(doc.mimeType || "").startsWith("image/") || String(doc.fileData || "").startsWith("data:image/");
  const isPdf = String(doc.mimeType || "").includes("pdf") || String(doc.fileData || "").startsWith("data:application/pdf");

  let viewer = `<div class="detail-kv-grid">
    <div class="detail-kv"><small>Mmiliki</small><strong>${esc(doc.userName)} (${esc(doc.wfcId || "—")})</strong></div>
    <div class="detail-kv"><small>Aina ya Nyaraka</small><strong>${esc(docTypeLabel(doc.docType))}</strong></div>
    <div class="detail-kv"><small>Jina la Faili</small><strong>${esc(doc.fileName)}</strong></div>
  </div>`;

  if (isImg) {
    viewer += `<div style="text-align:center;background:#F8FAFC;padding:14px;border-radius:12px;border:1px solid var(--border)">
      <img src="${doc.fileData}" alt="${esc(doc.title)}" style="max-width:100%;max-height:520px;border-radius:10px">
    </div>`;
  } else if (isPdf) {
    viewer += `<iframe src="${doc.fileData}" style="width:100%;height:520px;border:1px solid var(--border);border-radius:12px"></iframe>`;
  } else {
    viewer += `<div class="card" style="text-align:center">
      <p>Faili hili (${esc(doc.fileName)}) liko tayari kupakuliwa.</p>
      <button class="btn-primary" style="margin-top:10px" onclick="downloadMemberDocument('${esc(doc.id)}')">⬇️ Pakua Faili Sasa</button>
    </div>`;
  }

  openDetailsModal(doc.title, `${docTypeLabel(doc.docType)} · ${fmtDate(doc.createdAt)}`, viewer);
}

async function downloadMemberDocument(docId) {
  const doc = await getDocById(docId);
  if (!doc || !doc.fileData) return toast("Faili halipatikani");
  const a = document.createElement("a");
  a.href = doc.fileData;
  a.download = doc.fileName || `${doc.title}.file`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function promptReplaceMemberDocument(docId) {
  const html = `
    <form onsubmit="submitReplaceMemberDocument(event, '${esc(docId)}')">
      <label class="lbl">Chagua Faili Jipya la Kubadilisha (hadi 2MB) *</label>
      <input id="repDocFile" type="file" accept=".pdf,image/*,.doc,.docx" required>
      <button class="btn-primary" style="width:100%">Badilisha Nyaraka Sasa</button>
    </form>`;
  openDetailsModal("Badilisha Nyaraka (Replace Document)", "Faili la awali litabadilishwa na kumbukumbu itahifadhiwa kwenye historia.", html);
}

function submitReplaceMemberDocument(e, docId) {
  e.preventDefault();
  const f = document.getElementById("repDocFile").files[0];
  if (!f || f.size > 2200000) return toast("Chagua faili lisilozidi 2.2MB");
  const r = new FileReader();
  r.onload = async () => {
    const res = await api(`/api/member-documents/${encodeURIComponent(docId)}/replace`, "POST", {
      fileName: f.name,
      mimeType: f.type,
      fileSize: f.size,
      fileData: r.result
    });
    if (res) {
      toast("Nyaraka imebadilishwa kikamilifu!");
      closeDetailsModal();
      renderDocuments();
    }
  };
  r.readAsDataURL(f);
}

async function deleteMemberDocument(docId) {
  if (!confirm("Una uhakika unataka kufuta nyaraka hii?")) return;
  const res = await api(`/api/member-documents/${encodeURIComponent(docId)}`, "DELETE");
  if (res) {
    toast("Nyaraka imefutwa.");
    renderDocuments();
  }
}

// ==================== 7. REPORTS MODULE (PDF, EXCEL & PRINT EXPORTS) ====================

let activeReportTab = "membership";

async function renderReports() {
  const rep = await api("/api/reports/summary");
  if (!rep) return;
  cachedReports = rep;
  const c = document.getElementById("content");

  c.innerHTML = `
    <div class="card">
      <div class="card-head">
        <div>
          <h3>📊 Ripoti Kamili za Jumuiya (Reports &amp; Analytics)</h3>
          <small class="muted">Ripoti za Wanachama, Fedha, Mikoa/Koo, Matukio na Uongozi zenye PDF, Excel na Print.</small>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn-primary" onclick="exportActiveReportPDF()">📄 PDF Export</button>
          <button class="btn-secondary" onclick="exportActiveReportExcel()">📊 Excel Export</button>
          <button class="btn-outline" onclick="window.print()">🖨️ Print Report</button>
        </div>
      </div>

      <div class="tabs" id="repTabs">
        <button class="tab active" onclick="switchReportTab('membership',this)">1. Membership Reports</button>
        <button class="tab" onclick="switchReportTab('financial',this)">2. Financial Reports</button>
        <button class="tab" onclick="switchReportTab('regional',this)">3. Regional &amp; Clan Reports</button>
        <button class="tab" onclick="switchReportTab('events',this)">4. Event Reports</button>
        <button class="tab" onclick="switchReportTab('leadership',this)">5. Leadership Reports</button>
      </div>

      <div id="repBody"></div>
    </div>`;

  switchReportTab("membership", document.querySelector("#repTabs .tab"));
}

function switchReportTab(tab, btn) {
  activeReportTab = tab;
  document.querySelectorAll("#repTabs .tab").forEach((b) => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
  const box = document.getElementById("repBody");
  const r = cachedReports;
  if (!box || !r) return;

  if (tab === "membership") {
    const m = r.membership;
    box.innerHTML = `
      <div class="kpis-7">
        <div class="kpi"><small>Total Members</small><strong>${m.total}</strong></div>
        <div class="kpi kpi-ok"><small>Active Members</small><strong>${m.active}</strong></div>
        <div class="kpi kpi-warn"><small>Inactive / Pending</small><strong>${m.inactive}</strong></div>
        <div class="kpi kpi-bad"><small>Suspended Members</small><strong>${m.suspended}</strong></div>
        <div class="kpi kpi-info"><small>New Members (30d)</small><strong>${m.newMembers}</strong></div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>WFC ID</th><th>Jina Kamili</th><th>Jinsia</th><th>Simu</th><th>Mkoa</th><th>Wilaya</th><th>Ukoo</th><th>Kategoria</th><th>Hali</th><th>Usajili</th></tr></thead>
          <tbody>
            ${m.rows
              .map(
                (u) => `<tr>
                  <td class="mono">${esc(u.wfcId)}</td>
                  <td><strong>${esc(u.name)}</strong></td>
                  <td>${esc(u.gender)}</td>
                  <td>${esc(u.phone)}</td>
                  <td>${esc(u.region)}</td>
                  <td>${esc(u.district)}</td>
                  <td>${esc(u.clan)}</td>
                  <td>${esc(u.category)}</td>
                  <td>${statusBadge(u.status)}</td>
                  <td>${esc(u.registrationDate)}</td>
                </tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>`;
  } else if (tab === "financial") {
    const f = r.financial;
    box.innerHTML = `
      <div class="kpis-7">
        <div class="kpi kpi-ok"><small>Total Contributions</small><strong>${fmt(f.totalContributions)}</strong></div>
        <div class="kpi kpi-info"><small>Mapato Mengine</small><strong>${fmt(f.manualIncome)}</strong></div>
        <div class="kpi kpi-bad"><small>Matumizi Yote</small><strong>${fmt(f.expenses)}</strong></div>
        <div class="kpi kpi-ok"><small>Salio Halisi</small><strong>${fmt(f.balance)}</strong></div>
        <div class="kpi kpi-warn"><small>Outstanding Contributions</small><strong>${fmt(f.outstandingContributions)}</strong></div>
      </div>
      <div class="grid-2">
        <div>
          <h4 style="margin-bottom:8px">Makusanyo ya Kila Mwezi (Monthly Collections)</h4>
          <div class="table-wrap">
            <table><thead><tr><th>Mwezi (YYYY-MM)</th><th>Kiasi Kilichokusanywa</th></tr></thead>
            <tbody>${f.monthlyCollections.map((x) => `<tr><td><strong>${esc(x.period)}</strong></td><td>${fmt(x.amount)}</td></tr>`).join("") || '<tr><td colspan="2" class="muted">Hakuna data</td></tr>'}</tbody></table>
          </div>
        </div>
        <div>
          <h4 style="margin-bottom:8px">Makusanyo ya Kila Mwaka (Annual Collections)</h4>
          <div class="table-wrap">
            <table><thead><tr><th>Mwaka</th><th>Kiasi Kilichokusanywa</th></tr></thead>
            <tbody>${f.annualCollections.map((x) => `<tr><td><strong>${esc(x.period)}</strong></td><td>${fmt(x.amount)}</td></tr>`).join("") || '<tr><td colspan="2" class="muted">Hakuna data</td></tr>'}</tbody></table>
          </div>
        </div>
      </div>
      <h4 style="margin:16px 0 8px">Orodha ya Wadaiwa (Outstanding Contributions)</h4>
      <div class="table-wrap">
        <table><thead><tr><th>WFC ID</th><th>Jina</th><th>Mkoa</th><th>Inayopaswa</th><th>Amelipa</th><th>Deni</th></tr></thead>
        <tbody>${f.debtsList.map((d) => `<tr><td class="mono">${esc(d.wfcId)}</td><td><strong>${esc(d.name)}</strong></td><td>${esc(d.region)}</td><td>${fmt(d.expected)}</td><td>${fmt(d.paid)}</td><td style="color:var(--bad)"><strong>${fmt(d.debt)}</strong></td></tr>`).join("") || '<tr><td colspan="6" class="muted">Hakuna madeni ya ada.</td></tr>'}</tbody></table>
      </div>`;
  } else if (tab === "regional") {
    const reg = r.regional;
    box.innerHTML = `
      <div class="grid-3-cards">
        <div>
          <h4 style="margin-bottom:8px">Members by Region (Mkoa)</h4>
          <table><thead><tr><th>Mkoa</th><th>Idadi</th></tr></thead>
          <tbody>${reg.byRegion.map((x) => `<tr><td><strong>${esc(x.name)}</strong></td><td>${x.count}</td></tr>`).join("")}</tbody></table>
        </div>
        <div>
          <h4 style="margin-bottom:8px">Members by District (Wilaya)</h4>
          <table><thead><tr><th>Wilaya</th><th>Idadi</th></tr></thead>
          <tbody>${reg.byDistrict.map((x) => `<tr><td><strong>${esc(x.name)}</strong></td><td>${x.count}</td></tr>`).join("")}</tbody></table>
        </div>
        <div>
          <h4 style="margin-bottom:8px">Members by Clan (Ukoo)</h4>
          <table><thead><tr><th>Ukoo</th><th>Idadi</th></tr></thead>
          <tbody>${reg.byClan.map((x) => `<tr><td><strong>${esc(x.name)}</strong></td><td>${x.count}</td></tr>`).join("")}</tbody></table>
        </div>
      </div>`;
  } else if (tab === "events") {
    const ev = r.events;
    box.innerHTML = `
      <div class="kpis">
        <div class="kpi"><small>Jumla ya Matukio</small><strong>${ev.totalEvents}</strong></div>
        <div class="kpi kpi-ok"><small>Jumla ya Mahudhurio Yaliyorekodiwa</small><strong>${ev.totalAttendance}</strong></div>
      </div>
      <div class="table-wrap">
        <table><thead><tr><th>Tukio</th><th>Aina</th><th>Mahali</th><th>Tarehe</th><th>Tiketi Zilizouzwa</th><th>Mahudhurio</th><th>Mapato ya Tiketi</th></tr></thead>
        <tbody>${ev.eventRows.map((x) => `<tr><td><strong>${esc(x.title)}</strong></td><td>${esc(x.type)}</td><td>${esc(x.location)}</td><td>${esc(x.eventDate)}</td><td>${x.ticketsSold}</td><td>${x.attendees}</td><td>${fmt(x.revenue)}</td></tr>`).join("") || '<tr><td colspan="7" class="muted">Hakuna matukio bado.</td></tr>'}</tbody></table>
      </div>`;
  } else if (tab === "leadership") {
    const ld = r.leadership;
    box.innerHTML = `
      <h4 style="margin-bottom:8px">Viongozi wa Sasa (Current Leaders)</h4>
      <div class="table-wrap" style="margin-bottom:18px">
        <table><thead><tr><th>WFC ID</th><th>Jina</th><th>Mkoa</th><th>Nafasi</th><th>Kipindi</th><th>Majukumu Makuu</th></tr></thead>
        <tbody>${ld.currentLeaders.map((l) => `<tr><td class="mono">${esc(l.wfcId)}</td><td><strong>${esc(l.name)}</strong></td><td>${esc(l.region)}</td><td><span class="badge badge-brand">${esc(l.position)}</span></td><td>${esc(l.startDate)} → ${esc(l.endDate)}</td><td><small>${esc(l.responsibilities)}</small></td></tr>`).join("") || '<tr><td colspan="6" class="muted">Hakuna data</td></tr>'}</tbody></table>
      </div>
      <h4 style="margin-bottom:8px">Viongozi Waliopita (Former Leaders)</h4>
      <div class="table-wrap">
        <table><thead><tr><th>WFC ID</th><th>Jina</th><th>Nafasi</th><th>Muda wa Utumishi</th></tr></thead>
        <tbody>${ld.formerLeaders.map((l) => `<tr><td class="mono">${esc(l.wfcId)}</td><td><strong>${esc(l.name)}</strong></td><td>${esc(l.position)}</td><td>${esc(l.startDate)} → ${esc(l.endDate)}</td></tr>`).join("") || '<tr><td colspan="4" class="muted">Hakuna viongozi wa zamani waliorekodiwa bado.</td></tr>'}</tbody></table>
      </div>`;
  }
}

function getReportTableRowsForExport() {
  const r = cachedReports;
  if (!r) return { title: "WFC Report", headers: [], rows: [] };
  if (activeReportTab === "membership") {
    return {
      title: "WFC Membership Report",
      headers: ["WFC ID", "Full Name", "Gender", "Phone", "Region", "District", "Clan", "Category", "Status", "Reg Date"],
      rows: r.membership.rows.map((u) => [u.wfcId, u.name, u.gender, u.phone, u.region, u.district, u.clan, u.category, u.status, u.registrationDate])
    };
  }
  if (activeReportTab === "financial") {
    return {
      title: "WFC Financial Collections & Outstanding Report",
      headers: ["WFC ID", "Member Name", "Region", "Expected (TSh)", "Paid (TSh)", "Outstanding Debt (TSh)"],
      rows: r.financial.debtsList.map((d) => [d.wfcId, d.name, d.region, d.expected, d.paid, d.debt])
    };
  }
  if (activeReportTab === "regional") {
    return {
      title: "WFC Members by Region Report",
      headers: ["Region", "Member Count"],
      rows: r.regional.byRegion.map((x) => [x.name, x.count])
    };
  }
  if (activeReportTab === "events") {
    return {
      title: "WFC Event Attendance & Participation Report",
      headers: ["Event Title", "Type", "Location", "Date", "Tickets Sold", "Attendees", "Revenue (TSh)"],
      rows: r.events.eventRows.map((x) => [x.title, x.type, x.location, x.eventDate, x.ticketsSold, x.attendees, x.revenue])
    };
  }
  return {
    title: "WFC Leadership Report",
    headers: ["WFC ID", "Name", "Region", "Position", "Start Date", "End Date"],
    rows: r.leadership.currentLeaders.map((l) => [l.wfcId, l.name, l.region, l.position, l.startDate, l.endDate])
  };
}

function exportActiveReportExcel() {
  const { title, headers, rows } = getReportTableRowsForExport();
  const csvLines = [
    headers.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(","),
    ...rows.map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
  ];
  const blob = new Blob(["\uFEFF" + csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${title.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  toast("Excel/CSV report imepakuliwa!");
}

function exportActiveReportPDF() {
  const { jsPDF } = window.jspdf || {};
  if (!jsPDF) return toast("Maktaba ya PDF haipatikani");
  const { title, headers, rows } = getReportTableRowsForExport();
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFillColor(249, 115, 22);
  doc.rect(0, 0, 297, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text(`WACHAGGA FAMILY COMMUNITY — ${title.toUpperCase()}`, 14, 14);
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.text(`Tarehe ya Ripoti: ${new Date().toLocaleString("sw-TZ")}`, 14, 30);

  let y = 40;
  doc.setFontSize(9);
  doc.text(headers.join("  |  "), 14, y);
  y += 4;
  doc.line(14, y, 283, y);
  y += 6;
  rows.slice(0, 35).forEach((row) => {
    doc.text(row.map((c) => String(c ?? "").slice(0, 22)).join("  |  "), 14, y);
    y += 6;
    if (y > 192) {
      doc.addPage();
      y = 20;
    }
  });
  doc.save(`${title.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.pdf`);
  toast("PDF report imepakuliwa!");
}

// ==================== 5 & PAYMENTS MODULE (WITH VIEW DETAILS & RECEIPT) ====================

async function renderPayments() {
  const [list, debt, pol] = await Promise.all([api("/api/payments"), api("/api/my-debt"), api("/api/policy")]);
  if (!list) return;
  cachedPayments = list;
  const financeLeader = ["ADMIN", "TREASURER", "CHAIRPERSON"].includes(ME.role);
  const pNums = (pol && pol.paymentNumbers) || { mpesa: "0755 000 888", tigo: "0715 000 888", airtel: "0785 000 888", crdb: "0150889944200" };
  const c = document.getElementById("content");

  c.innerHTML = `
    <div class="grid-2">
      <div class="card">
        <div class="card-head"><h3>Wasilisha Mchango</h3></div>
        <div class="pay-instructions">
          <strong>Lipa Kwanza Kwenye Namba za Jumuiya</strong>
          <span>M-Pesa: <b>${esc(pNums.mpesa)}</b> · Tigo Pesa: <b>${esc(pNums.tigo)}</b> · Airtel: <b>${esc(pNums.airtel)}</b> · CRDB: <b>${esc(pNums.crdb)}</b></span>
        </div>
        <form id="payForm">
          <label class="lbl">Aina ya Mchango</label>
          <select id="pType" onchange="autofillPayAmount()">
            <option value="Ada ya mwezi">Ada ya mwezi (${fmt((pol && pol.monthlyFee) || 10000)})</option>
            <option value="Kiingilio">Kiingilio (${fmt((pol && pol.entryFee) || 50000)})</option>
            <option value="Dharura">Dharura / Msiba (${fmt((pol && pol.emergencyFee) || 60000)})</option>
            <option value="Harusi">Harusi / Tukio</option>
          </select>
          <label class="lbl">Kiasi (TSh)</label><input id="pAmount" type="number" value="${(pol && pol.monthlyFee) || 10000}" required>
          <label class="lbl">Namba ya Muamala (Transaction ID)</label><input id="pTxn" placeholder="Mfano: MP260418.1234.A12345" required>
          <button class="btn-primary" style="width:100%">Wasilisha Uthibitisho</button>
        </form>
      </div>
      <div class="card">
        <div class="card-head"><h3>Hali Yangu ya Ada ya Mwezi</h3></div>
        <div class="kpi ${debt && debt.debt > 0 ? "kpi-warn" : "kpi-ok"}" style="margin-bottom:14px">
          <small>Deni la Ada ya Mwezi</small>
          <strong>${fmt(debt ? debt.debt : 0)}</strong>
        </div>
        <p class="muted">Jumla inayopaswa: <strong>${fmt(debt ? debt.expected : 0)}</strong> · Umeshalipa: <strong>${fmt(debt ? debt.paid : 0)}</strong></p>
        <p class="muted" style="margin-top:8px">Baada ya mhasibu kuthibitisha muamala wako, risiti rasmi yenye QR code inatolewa papo hapo.</p>
      </div>
    </div>

    <div class="card">
      <div class="card-head"><h3>Rekodi za Michango (${list.length})</h3></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Mwanachama</th><th>Aina</th><th>Kiasi</th><th>Muamala</th><th>Risiti</th><th>Hali</th><th>Vitendo</th></tr></thead>
          <tbody>
            ${list
              .map(
                (p) => `<tr>
                  <td><strong>${esc(p.userName)}</strong></td>
                  <td>${esc(p.type)}</td>
                  <td>${fmt(p.amount)}</td>
                  <td class="mono">${esc(p.transactionId)}</td>
                  <td class="mono">${esc(p.receiptNo || "—")}</td>
                  <td>${statusBadge(p.status)}</td>
                  <td>
                    <div class="tbl-actions">
                      <button class="btn-xs btn-outline" onclick="viewContributionDetails('${esc(p.id)}')">👁️ View Details</button>
                      ${p.status === "APPROVED" ? `<button class="btn-xs btn-secondary" onclick='downloadReceipt(${JSON.stringify(p).replace(/'/g, "&#39;")})'>📄 Risiti</button>` : ""}
                      ${financeLeader && p.status === "PENDING" ? `<button class="btn-xs btn-primary" onclick="approvePayment('${esc(p.id)}')">Idhinisha</button>` : ""}
                    </div>
                  </td>
                </tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </div>`;

  document.getElementById("payForm").onsubmit = async (e) => {
    e.preventDefault();
    const d = await api("/api/submit-payment", "POST", {
      type: document.getElementById("pType").value,
      amount: document.getElementById("pAmount").value,
      transactionId: document.getElementById("pTxn").value
    });
    if (d) {
      toast("Muamala umewasilishwa. Subiri uthibitisho wa mhasibu.");
      renderPayments();
    }
  };
}

function autofillPayAmount() {
  const tVal = document.getElementById("pType")?.value;
  const inp = document.getElementById("pAmount");
  if (!inp || !POLICY) return;
  if (tVal === "Ada ya mwezi") inp.value = POLICY.monthlyFee || 10000;
  else if (tVal === "Kiingilio") inp.value = POLICY.entryFee || 50000;
  else if (tVal === "Dharura") inp.value = POLICY.emergencyFee || 60000;
}

async function viewContributionDetails(paymentId) {
  const pay = cachedPayments.find((p) => p.id === paymentId);
  if (!pay) return;
  const memberHist = cachedPayments.filter((p) => p.userId === pay.userId);
  const memberDetails = await api(`/api/members/${encodeURIComponent(pay.userId)}/details`);
  const debtAmt = memberDetails && memberDetails.debtInfo ? memberDetails.debtInfo.debt : 0;

  const html = `
    <div class="detail-kv-grid">
      <div class="detail-kv"><small>Mwanachama</small><strong>${esc(pay.userName)}</strong></div>
      <div class="detail-kv"><small>Aina ya Mchango</small><strong>${esc(pay.type)}</strong></div>
      <div class="detail-kv"><small>Kiasi Kilicholipwa</small><strong style="color:var(--ok)">${fmt(pay.amount)}</strong></div>
      <div class="detail-kv"><small>Namba ya Muamala</small><strong class="mono">${esc(pay.transactionId)}</strong></div>
      <div class="detail-kv"><small>Namba ya Risiti</small><strong class="mono">${esc(pay.receiptNo || "Inasubiri Idhini")}</strong></div>
      <div class="detail-kv"><small>Salio la Deni (Outstanding)</small><strong style="color:${debtAmt > 0 ? "var(--bad)" : "var(--ok)"}">${fmt(debtAmt)}</strong></div>
      <div class="detail-kv"><small>Tarehe ya Malipo</small><strong>${new Date(pay.createdAt).toLocaleString("sw-TZ")}</strong></div>
      <div class="detail-kv"><small>Aliyeidhinisha</small><strong>${esc(pay.approvedBy || "—")}</strong></div>
      <div class="detail-kv"><small>Hali</small><strong>${esc(pay.status)}</strong></div>
    </div>
    ${
      pay.status === "APPROVED"
        ? `<div style="margin-bottom:16px"><button class="btn-primary" onclick='downloadReceipt(${JSON.stringify(pay).replace(/'/g, "&#39;")})'>📄 Pakua Risiti Rasmi (PDF)</button></div>`
        : ""
    }
    <h4 style="margin-bottom:8px">Historia ya Michango ya ${esc(pay.userName)} (${memberHist.length})</h4>
    <div class="table-wrap">
      <table><thead><tr><th>Aina</th><th>Kiasi</th><th>Muamala</th><th>Risiti</th><th>Tarehe</th><th>Hali</th></tr></thead>
      <tbody>${memberHist.map((x) => `<tr><td>${esc(x.type)}</td><td>${fmt(x.amount)}</td><td class="mono">${esc(x.transactionId)}</td><td class="mono">${esc(x.receiptNo || "—")}</td><td>${fmtDate(x.createdAt)}</td><td>${statusBadge(x.status)}</td></tr>`).join("")}</tbody></table>
    </div>`;
  openDetailsModal(`Maelezo ya Mchango: ${pay.receiptNo || pay.transactionId}`, `${pay.userName} · ${pay.type}`, html);
}

async function approvePayment(paymentId) {
  if (await api("/api/approve-payment", "POST", { paymentId })) {
    toast("Mchango umeidhinishwa na risiti imetolewa");
    renderPayments();
  }
}

function downloadReceipt(p) {
  const { jsPDF } = window.jspdf || {};
  if (!jsPDF) return toast("Maktaba ya PDF haipatikani");
  const doc = new jsPDF();
  doc.setFillColor(249, 115, 22);
  doc.rect(0, 0, 210, 32, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text("WACHAGGA FAMILY COMMUNITY (WFC)", 16, 15);
  doc.setFontSize(10);
  doc.text("Stand up · It's not over · Risiti Rasmi ya Malipo", 16, 24);
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  let y = 48;
  [
    ["Namba ya Risiti", p.receiptNo || "—"],
    ["Jina la Mwanachama", p.userName],
    ["Aina ya Mchango", p.type],
    ["Kiasi Kilicholipwa", fmt(p.amount)],
    ["Namba ya Muamala", p.transactionId],
    ["Tarehe", new Date(p.createdAt).toLocaleString("sw-TZ")],
    ["Imeidhinishwa na", p.approvedBy || "Mhazini WFC"]
  ].forEach(([k, v]) => {
    doc.setFont(undefined, "bold");
    doc.text(k + ":", 16, y);
    doc.setFont(undefined, "normal");
    doc.text(String(v), 78, y);
    y += 11;
  });
  const qrWrap = document.createElement("div");
  if (window.QRCode) {
    new QRCode(qrWrap, { text: `WFC|${p.receiptNo}|${p.transactionId}|${p.amount}`, width: 120, height: 120 });
    const canvas = qrWrap.querySelector("canvas");
    if (canvas) doc.addImage(canvas.toDataURL("image/png"), "PNG", 16, y + 6, 36, 36);
  }
  doc.save(`WFC-Risiti-${p.receiptNo || p.id}.pdf`);
}

// ==================== 5. EVENTS MODULE (WITH VIEW DETAILS) ====================

async function renderEvents() {
  const list = await api("/api/events");
  if (!list) return;
  cachedEvents = list;
  const leader = isLeaderRole();
  const c = document.getElementById("content");
  c.innerHTML = `
    ${
      leader
        ? `<div class="card">
            <div class="card-head"><h3>Tangaza Tukio Jipya</h3></div>
            <form id="evForm" class="grid-2">
              <div><label class="lbl">Aina ya Tukio</label><select id="eType"><option>Harusi</option><option>Msiba</option><option>Mkutano</option><option>Festival</option></select></div>
              <div><label class="lbl">Kichwa cha Tukio</label><input id="eTitle" required></div>
              <div><label class="lbl">Mahali</label><input id="eLoc"></div>
              <div><label class="lbl">Tarehe</label><input id="eDate" type="date" required></div>
              <div><label class="lbl">Bei ya Tiketi (TSh, 0 = Bure)</label><input id="ePrice" type="number" value="0"></div>
              <div><label class="lbl">Picha / Tangazo la Tukio (hiari)</label><input id="ePoster" type="file" accept="image/*"></div>
              <div style="grid-column:1/-1"><button class="btn-primary">Hifadhi na Tangaza</button></div>
            </form>
          </div>`
        : ""
    }
    <div class="grid-3-cards">
      ${list
        .map(
          (e) => `<div class="card ev-card">
            ${e.poster && e.poster.startsWith("data:image/") ? `<img src="${e.poster}" class="ev-poster" alt="">` : `<div class="ev-poster ev-ph">${esc(e.type)}</div>`}
            <span class="badge badge-info">${esc(e.type)}</span>
            <h3>${esc(e.title)}</h3>
            <p class="muted">${esc(e.location || "Ukumbi utatangazwa")} · ${esc(e.eventDate || "")}</p>
            <div class="ev-foot">
              <strong>${Number(e.ticketPrice) > 0 ? fmt(e.ticketPrice) : "Bure"}</strong>
              <div class="tbl-actions">
                <button class="btn-xs btn-outline" onclick="viewEventDetails('${esc(e.id)}')">👁️ View Details</button>
                <a href="/ticket/${encodeURIComponent(e.id)}" target="_blank" rel="noopener noreferrer" class="btn-xs btn-primary">Tiketi</a>
              </div>
            </div>
          </div>`
        )
        .join("")}
    </div>`;

  if (leader && document.getElementById("evForm")) {
    document.getElementById("evForm").onsubmit = async (e) => {
      e.preventDefault();
      let poster = "";
      const f = document.getElementById("ePoster").files[0];
      if (f) {
        if (f.size > 1500000) return toast("Picha isizidi 1.5MB");
        poster = await new Promise((res) => {
          const r = new FileReader();
          r.onload = () => res(r.result);
          r.readAsDataURL(f);
        });
      }
      if (
        await api("/api/events", "POST", {
          type: document.getElementById("eType").value,
          title: document.getElementById("eTitle").value,
          location: document.getElementById("eLoc").value,
          eventDate: document.getElementById("eDate").value,
          ticketPrice: document.getElementById("ePrice").value,
          poster
        })
      ) {
        toast("Tukio limetangazwa");
        renderEvents();
      }
    };
  }
}

async function viewEventDetails(eventId) {
  let ev = cachedEvents.find((x) => x.id === eventId);
  if (!ev) {
    const all = (await api("/api/events")) || [];
    cachedEvents = all;
    ev = all.find((x) => x.id === eventId);
  }
  if (!ev) return;

  const [tickets, attendance] = await Promise.all([
    isLeaderRole() ? api("/api/tickets") : Promise.resolve([]),
    api("/api/attendance")
  ]);

  const evTickets = (tickets || []).filter((t) => t.eventId === ev.id);
  const evAtt = (attendance || []).filter(
    (a) => a.eventId === ev.id || (a.meeting || "").toLowerCase().includes((ev.title || "").toLowerCase())
  );
  const totalRevenue = evTickets
    .filter((t) => t.status === "APPROVED")
    .reduce((s, t) => s + (Number(t.totalAmount) || 0), 0);

  const html = `
    ${ev.poster && ev.poster.startsWith("data:image/") ? `<img src="${ev.poster}" style="width:100%;max-height:220px;object-fit:cover;border-radius:12px;margin-bottom:14px">` : ""}
    <div class="detail-kv-grid">
      <div class="detail-kv"><small>Aina ya Tukio</small><strong>${esc(ev.type)}</strong></div>
      <div class="detail-kv"><small>Mahali</small><strong>${esc(ev.location || "—")}</strong></div>
      <div class="detail-kv"><small>Tarehe</small><strong>${esc(ev.eventDate || "—")}</strong></div>
      <div class="detail-kv"><small>Bei ya Tiketi</small><strong>${Number(ev.ticketPrice) > 0 ? fmt(ev.ticketPrice) : "Bure"}</strong></div>
      <div class="detail-kv"><small>Tiketi Zilizokatwa</small><strong>${evTickets.reduce((s, t) => s + (Number(t.qty) || 1), 0)}</strong></div>
      <div class="detail-kv"><small>Mapato Yaliyothibitishwa</small><strong style="color:var(--ok)">${fmt(totalRevenue)}</strong></div>
    </div>

    <h4 style="margin:12px 0 8px">Orodha ya Waliojisajili / Tiketi (${evTickets.length})</h4>
    <div class="table-wrap" style="margin-bottom:16px">
      <table><thead><tr><th>Jina</th><th>Simu</th><th>Idadi</th><th>Kiasi</th><th>Muamala</th><th>Hali</th></tr></thead>
      <tbody>${evTickets.map((t) => `<tr><td><strong>${esc(t.name)}</strong></td><td>${esc(t.phone)}</td><td>${t.qty}</td><td>${fmt(t.totalAmount)}</td><td class="mono">${esc(t.transactionId)}</td><td>${statusBadge(t.status)}</td></tr>`).join("") || '<tr><td colspan="6" class="muted">Hakuna tiketi zilizokatwa bado.</td></tr>'}</tbody></table>
    </div>

    <h4 style="margin:12px 0 8px">Historia ya Mahudhurio ya Tukio (${evAtt.length})</h4>
    ${
      evAtt.length
        ? evAtt.map((a) => `<div class="row"><div><strong>${esc(a.userName)}</strong><small class="muted" style="display:block">${new Date(a.date).toLocaleString("sw-TZ")}</small></div><span class="badge badge-ok">ALIHUDHURIA</span></div>`).join("")
        : '<p class="muted">Hakuna rekodi ya mahudhurio ya moja kwa moja bado.</p>'
    }`;

  openDetailsModal(`Maelezo ya Tukio: ${ev.title}`, `${ev.type} · ${ev.location || ""}`, html);
}

// ==================== 8. NOTIFICATIONS PAGE (6 CATEGORIES + READ/UNREAD) ====================

let notifFilterCat = "ALL";

async function renderNotifications() {
  const list = await api("/api/notifications");
  if (!list) return;
  cachedNotifications = list;
  const leader = isLeaderRole();
  const c = document.getElementById("content");

  c.innerHTML = `
    ${
      leader
        ? `<div class="card">
            <div class="card-head"><h3>📢 Tuma Taarifa / Arifa Mpya</h3></div>
            <form id="notifForm" class="grid-2">
              <div>
                <label class="lbl">Aina ya Taarifa (Notification Type)</label>
                <select id="nCategory">
                  <option value="ANNOUNCEMENT">System Announcements</option>
                  <option value="NEW_MEMBER">New Member Registration</option>
                  <option value="CONTRIBUTION">Contribution Received</option>
                  <option value="EVENT_REMINDER">Event Reminder</option>
                  <option value="RENEWAL_REMINDER">Membership Renewal Reminder</option>
                  <option value="LEADERSHIP">Leadership Updates</option>
                </select>
              </div>
              <div>
                <label class="lbl">Kichwa cha Taarifa *</label>
                <input id="nTitle" required>
              </div>
              <div style="grid-column:1/-1">
                <label class="lbl">Ujumbe Kamili *</label>
                <textarea id="nBody" rows="3" required></textarea>
              </div>
              <div style="grid-column:1/-1"><button class="btn-primary">Tuma Taarifa</button></div>
            </form>
          </div>`
        : ""
    }
    <div class="card">
      <div class="card-head">
        <div>
          <h3>Taarifa Zote (${list.length})</h3>
          <small class="muted">Hazijasomwa: ${list.filter((n) => !n.isRead).length}</small>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <select id="nCatFilter" style="width:auto;margin:0" onchange="notifFilterCat=this.value;renderNotifListItems()">
            <option value="ALL">Aina Zote</option>
            <option value="UNREAD">Hazijasomwa Pekee</option>
            <option value="NEW_MEMBER">New Member Registration</option>
            <option value="CONTRIBUTION">Contribution Received</option>
            <option value="EVENT_REMINDER">Event Reminder</option>
            <option value="RENEWAL_REMINDER">Membership Renewal Reminder</option>
            <option value="LEADERSHIP">Leadership Updates</option>
            <option value="ANNOUNCEMENT">System Announcements</option>
          </select>
          <button class="btn-secondary" onclick="markAllNotificationsRead()">✓ Mark All as Read</button>
        </div>
      </div>
      <div id="notifPageList"></div>
    </div>`;

  renderNotifListItems();

  if (leader && document.getElementById("notifForm")) {
    document.getElementById("notifForm").onsubmit = async (e) => {
      e.preventDefault();
      if (
        await api("/api/notifications", "POST", {
          userId: "all",
          category: document.getElementById("nCategory").value,
          title: document.getElementById("nTitle").value,
          body: document.getElementById("nBody").value
        })
      ) {
        toast("Taarifa imetumwa kwa wanachama");
        await refreshHeaderNotifications();
        renderNotifications();
      }
    };
  }
}

function renderNotifListItems() {
  const box = document.getElementById("notifPageList");
  if (!box) return;
  const rows = cachedNotifications.filter((n) => {
    if (notifFilterCat === "ALL") return true;
    if (notifFilterCat === "UNREAD") return !n.isRead;
    return n.category === notifFilterCat;
  });
  box.innerHTML = rows.length
    ? rows
        .map(
          (n) => `<div class="row" style="${n.isRead ? "" : "background:#FFF7ED;padding:12px;border-radius:10px"}">
            <div>
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                <span class="badge ${n.isRead ? "badge-info" : "badge-brand"}">${esc(notifCategoryLabel(n.category))}</span>
                <strong>${esc(n.title)}</strong>
                ${n.isRead ? '<span class="badge badge-ok">Imesomwa</span>' : '<span class="badge badge-warn">Mpya</span>'}
              </div>
              <p class="muted" style="margin-top:4px">${esc(n.body)}</p>
            </div>
            <div style="text-align:right">
              <small class="muted" style="display:block">${fmtDate(n.createdAt)}</small>
              ${!n.isRead ? `<button class="btn-xs btn-outline" style="margin-top:4px" onclick="markSingleNotifRead('${esc(n.id)}')">Weka Imesomwa</button>` : ""}
            </div>
          </div>`
        )
        .join("")
    : '<p class="muted">Hakuna taarifa katika kundi hili.</p>';
}

// ==================== 5. LEADERSHIP & RBAC MODULE (WITH VIEW DETAILS) ====================

async function renderRoles() {
  const [members, roles, leadData] = await Promise.all([
    api("/api/members"),
    api("/api/roles"),
    api("/api/leadership")
  ]);
  if (!members || !roles) return;
  const c = document.getElementById("content");
  const leaders = (leadData && leadData.currentLeaders) || [];

  c.innerHTML = `
    <div class="card">
      <div class="card-head"><h3>🏛️ Viongozi wa Sasa (Leadership Directory)</h3></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Kiongozi</th><th>WFC ID</th><th>Nafasi ya Sasa</th><th>Kipindi cha Utumishi</th><th>Vitendo</th></tr></thead>
          <tbody>
            ${leaders
              .map(
                (l) => `<tr>
                  <td><strong>${esc(l.name)}</strong><small class="muted" style="display:block">${esc(l.region || "")}</small></td>
                  <td class="mono">${esc(l.wfcId || "—")}</td>
                  <td><span class="badge badge-brand">${esc(l.position)}</span></td>
                  <td>${esc(l.startDate)} → ${esc(l.endDate)}</td>
                  <td><button class="btn-xs btn-outline" onclick="viewLeadershipDetails('${esc(l.userId)}')">👁️ View Details</button></td>
                </tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </div>

    <div class="card">
      <div class="card-head"><h3>Mgawanyo wa Majukumu (RBAC)</h3></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Mwanachama</th><th>Simu</th><th>Jukumu la Sasa</th><th>Badilisha Jukumu</th><th>Historia</th></tr></thead>
          <tbody>
            ${members
              .map(
                (u) => `<tr>
                  <td><strong>${esc(u.name)}</strong></td>
                  <td>${esc(u.phone)}</td>
                  <td><span class="badge badge-info">${esc(u.role)}</span></td>
                  <td>
                    <select style="width:auto;margin:0" onchange="setRole('${esc(u.id)}',this.value)">
                      ${roles.map((r) => `<option value="${esc(r)}" ${r === u.role ? "selected" : ""}>${esc(r)}</option>`).join("")}
                    </select>
                  </td>
                  <td><button class="btn-xs btn-outline" onclick="viewLeadershipDetails('${esc(u.id)}')">👁️ View Details</button></td>
                </tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </div>`;
}

async function viewLeadershipDetails(userId) {
  const data = await api(`/api/members/${encodeURIComponent(userId)}/details`);
  if (!data) return;
  const m = data.member;
  const lHist = data.leadershipHistory || [];
  const currentPos = lHist.find((h) => h.status === "CURRENT");

  const html = `
    <div class="detail-kv-grid">
      <div class="detail-kv"><small>Jina la Kiongozi / Mwanachama</small><strong>${esc(m.name)}</strong></div>
      <div class="detail-kv"><small>Nafasi ya Sasa (Current Position)</small><strong>${esc(m.role)}</strong></div>
      <div class="detail-kv"><small>Kanda / Mkoa</small><strong>${esc(m.region || "—")}</strong></div>
    </div>
    ${
      currentPos
        ? `<div class="pay-instructions">
            <strong>Majukumu ya Nafasi ya Sasa (${esc(currentPos.position)})</strong>
            <span>${esc(currentPos.responsibilities)}</span>
          </div>`
        : ""
    }
    <h4 style="margin:12px 0 8px">Historia ya Nafasi za Uongozi &amp; Vipindi vya Utumishi (${lHist.length})</h4>
    ${
      lHist.length
        ? lHist
            .map(
              (h) => `<div class="row">
                <div>
                  <strong>${esc(h.position)}</strong>
                  <small class="muted" style="display:block">Kipindi cha Utumishi: ${esc(h.startDate)} → ${esc(h.endDate)}</small>
                  <p style="font-size:13px;margin-top:4px">${esc(h.responsibilities)}</p>
                </div>
                ${statusBadge(h.status)}
              </div>`
            )
            .join("")
        : '<p class="muted">Hakuna rekodi ya uongozi iliyoandikwa bado.</p>'
    }`;
  openDetailsModal(`Taarifa za Uongozi: ${m.name}`, `${m.wfcId || "WFC"} · ${m.role}`, html);
}

async function setRole(userId, role) {
  if (await api("/api/set-role", "POST", { userId, role })) {
    toast("Jukumu limebadilishwa na kuingizwa kwenye historia ya uongozi");
    renderRoles();
  }
}

// ==================== REMAINING MODULES (ANNOUNCEMENTS, CARD, FAMILY, DIRECTORY, SACCOS, ETC.) ====================

async function renderAnnouncements() {
  const list = await api("/api/announcements");
  if (!list) return;
  const leader = isLeaderRole();
  const c = document.getElementById("content");
  c.innerHTML = `
    ${
      leader
        ? `<div class="card">
            <div class="card-head"><h3>Chapisha Tangazo Jipya</h3></div>
            <form id="anForm">
              <label class="lbl">Kichwa</label><input id="aTitle" required>
              <label class="lbl">Maelezo</label><textarea id="aBody" rows="3" required></textarea>
              <label class="lbl">Kiungo cha Mwelekeo (hiari)</label><input id="aLink" placeholder="/#matukio">
              <button class="btn-primary">Chapisha</button>
            </form>
          </div>`
        : ""
    }
    <div class="card">
      <div class="card-head"><h3>Matangazo Rasmi</h3></div>
      ${
        list.length
          ? list
              .map(
                (n) => `<div class="row">
                  <div>
                    <strong>${esc(n.title)}</strong>
                    <p class="muted" style="margin:4px 0">${esc(n.body)}</p>
                    <small class="muted">Na ${esc(n.author || "Ofisi")} · ${fmtDate(n.createdAt)}</small>
                  </div>
                  ${n.link ? `<a href="${esc(safeUrl(n.link))}" class="btn-xs btn-outline">Fungua</a>` : ""}
                </div>`
              )
              .join("")
          : '<p class="muted">Hakuna tangazo bado.</p>'
      }
    </div>`;

  if (leader && document.getElementById("anForm")) {
    document.getElementById("anForm").onsubmit = async (e) => {
      e.preventDefault();
      if (
        await api("/api/announcements", "POST", {
          title: document.getElementById("aTitle").value,
          body: document.getElementById("aBody").value,
          link: document.getElementById("aLink").value
        })
      ) {
        toast("Tangazo limechapishwa");
        renderAnnouncements();
      }
    };
  }
}

async function renderCard() {
  const photo = ME.profilePhoto && ME.profilePhoto.startsWith("data:image/") ? ME.profilePhoto : "/wfc-logo.jpg";
  const c = document.getElementById("content");
  c.innerHTML = `
    <div class="id-card" id="idCardBox">
      <div class="id-top">
        <img src="${photo}" alt="WFC">
        <div>
          <strong>Wachagga Family Community</strong>
          <small style="color:#FDBA74;display:block">Stand up · It's not over</small>
        </div>
      </div>
      <div class="id-grid">
        <div><small>Jina la Mwanachama</small><strong>${esc(ME.name)}</strong></div>
        <div><small>Namba ya WFC</small><strong>${esc(ME.wfcId || "Inasubiri Idhini")}</strong></div>
        <div><small>Kanda / Ukoo</small><strong>${esc(ME.region)} · ${esc(ME.clan || "WFC")}</strong></div>
        <div><small>Halali Hadi</small><strong>${esc(ME.membershipExpiryDate || "ACTIVE")}</strong></div>
      </div>
      <div class="qr-box" id="qr"></div>
      <p style="text-align:center;font-size:11.5px;color:#FDBA74;margin-top:12px">Kitambulisho Rasmi cha Kidijitali · WFC Portal V6</p>
    </div>
    <div style="text-align:center;margin-top:16px">
      <button class="btn-primary" onclick="window.print()">Chapisha / Hifadhi PDF</button>
    </div>`;
  if (window.QRCode) {
    new QRCode(document.getElementById("qr"), {
      text: `WFC|${ME.wfcId || ME.id}|${ME.name}|${ME.phone}`,
      width: 116,
      height: 116
    });
  }
}

async function renderFamily() {
  const f = await api("/api/family");
  if (!f) return;
  const c = document.getElementById("content");
  c.innerHTML = `
    <div class="card">
      <div class="card-head"><h3>Taarifa za Familia Yangu</h3></div>
      <form id="famForm">
        <label class="lbl">Mkuu wa Familia</label><input id="fHead" value="${esc(f.head || ME.name)}">
        <label class="lbl">Mwenza</label><input id="fSpouse" value="${esc(f.spouse || "")}">
        <label class="lbl">Watoto / Wategemezi (tenganisha kwa koma)</label>
        <input id="fKids" value="${esc((f.children || []).join(", "))}">
        <button class="btn-primary">Hifadhi Taarifa</button>
      </form>
    </div>`;
  document.getElementById("famForm").onsubmit = async (e) => {
    e.preventDefault();
    const children = document
      .getElementById("fKids")
      .value.split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (
      await api("/api/family", "POST", {
        head: document.getElementById("fHead").value,
        spouse: document.getElementById("fSpouse").value,
        children
      })
    ) {
      toast("Taarifa za familia zimehifadhiwa");
    }
  };
}

async function renderDirectory() {
  const list = await api("/api/directory");
  if (!list) return;
  const c = document.getElementById("content");
  c.innerHTML = `
    <div class="card">
      <div class="card-head"><h3>Weka Taaluma / Biashara Yako</h3></div>
      <form id="profForm" style="display:flex;gap:10px;flex-wrap:wrap">
        <input id="myProf" style="flex:1;min-width:220px;margin:0" value="${esc(ME.profession || "")}" placeholder="Mfano: Daktari, Mhandisi, Mwanasheria, Mkandarasi">
        <button class="btn-primary">Hifadhi</button>
      </form>
    </div>
    <div class="card">
      <div class="card-head"><h3>Directory ya Wataalamu wa WFC (${list.length})</h3></div>
      ${
        list.length
          ? list
              .map(
                (p) => `<div class="row">
                  <div><strong>${esc(p.name)}</strong><small class="muted" style="display:block">${esc(p.profession)} · ${esc(p.region)} ${p.clan ? "· Ukoo: " + esc(p.clan) : ""}</small></div>
                  <a href="tel:${esc(p.phone)}" class="btn-xs btn-outline">${esc(p.phone)}</a>
                </div>`
              )
              .join("")
          : '<p class="muted">Hakuna mtaalamu aliyejiandikisha bado.</p>'
      }
    </div>`;
  document.getElementById("profForm").onsubmit = async (e) => {
    e.preventDefault();
    const profession = document.getElementById("myProf").value;
    if (await api("/api/my-profession", "POST", { profession })) {
      ME.profession = profession;
      toast("Taaluma imehifadhiwa");
      renderDirectory();
    }
  };
}

async function renderSaccos() {
  const s = await api("/api/saccos");
  if (!s) return;
  const totalShares = (s.shares || []).reduce((a, b) => a + (Number(b.amount) || 0), 0);
  const c = document.getElementById("content");
  c.innerHTML = `
    <div class="kpis">
      <div class="kpi"><small>Jumla ya Hisa</small><strong>${fmt(totalShares)}</strong></div>
      <div class="kpi kpi-info"><small>Maombi ya Mikopo</small><strong>${(s.loans || []).length}</strong></div>
    </div>
    <div class="grid-2">
      <div class="card">
        <div class="card-head"><h3>Nunua Hisa</h3></div>
        <form id="shareForm">
          <label class="lbl">Kiasi (TSh)</label><input id="shAmt" type="number" min="1000" required>
          <button class="btn-primary" style="width:100%">Weka Hisa</button>
        </form>
      </div>
      <div class="card">
        <div class="card-head"><h3>Omba Mkopo</h3></div>
        <form id="loanForm">
          <label class="lbl">Kiasi (TSh)</label><input id="lnAmt" type="number" min="10000" required>
          <label class="lbl">Madhumuni</label><input id="lnPurp" required>
          <button class="btn-primary" style="width:100%">Tuma Ombi</button>
        </form>
      </div>
    </div>
    <div class="card">
      <div class="card-head"><h3>Orodha ya Mikopo</h3></div>
      ${
        (s.loans || []).length
          ? s.loans
              .map(
                (l) => `<div class="row">
                  <div><strong>${esc(l.userName)}</strong> · ${fmt(l.amount)}<small class="muted" style="display:block">${esc(l.purpose)}</small></div>
                  ${statusBadge(l.status)}
                </div>`
              )
              .join("")
          : '<p class="muted">Hakuna ombi la mkopo.</p>'
      }
    </div>`;

  document.getElementById("shareForm").onsubmit = async (e) => {
    e.preventDefault();
    if (await api("/api/saccos/shares", "POST", { amount: document.getElementById("shAmt").value })) {
      toast("Hisa zimehifadhiwa");
      renderSaccos();
    }
  };
  document.getElementById("loanForm").onsubmit = async (e) => {
    e.preventDefault();
    if (
      await api("/api/saccos/loans", "POST", {
        amount: document.getElementById("lnAmt").value,
        purpose: document.getElementById("lnPurp").value
      })
    ) {
      toast("Ombi la mkopo limetumwa");
      renderSaccos();
    }
  };
}

async function renderElections() {
  const list = await api("/api/elections");
  if (!list) return;
  const leader = isLeaderRole();
  const c = document.getElementById("content");
  c.innerHTML = `
    ${
      leader
        ? `<div class="card">
            <div class="card-head"><h3>Fungua Nafasi Mpya ya Uchaguzi</h3></div>
            <form id="elForm" style="display:flex;gap:10px;flex-wrap:wrap">
              <input id="elPos" style="flex:1;min-width:220px;margin:0" placeholder="Mfano: Mwenyekiti wa Jumuiya" required>
              <button class="btn-primary">Fungua</button>
            </form>
          </div>`
        : ""
    }
    ${
      list.length
        ? list
            .map(
              (el) => `<div class="card">
                <div class="card-head"><h3>${esc(el.position)}</h3><span class="badge badge-info">Kura ${(el.votes || []).length}</span></div>
                ${(el.candidates || [])
                  .map((cand) => {
                    const count = (el.votes || []).filter((v) => v.candidate === cand.name).length;
                    return `<div class="row">
                      <div><strong>${esc(cand.name)}</strong><small class="muted" style="display:block">${esc(cand.manifesto || "")}</small></div>
                      <div style="display:flex;align-items:center;gap:10px">
                        <strong>${count} kura</strong>
                        ${el.hasVoted ? "" : `<button class="btn-xs btn-primary" onclick="vote('${esc(el.id)}','${esc(cand.name)}')">Piga Kura</button>`}
                      </div>
                    </div>`;
                  })
                  .join("")}
                ${
                  leader
                    ? `<form style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap" onsubmit="nominate(event,'${esc(el.id)}')">
                        <input name="name" style="flex:1;min-width:160px;margin:0" placeholder="Jina la mgombea" required>
                        <input name="manifesto" style="flex:2;min-width:200px;margin:0" placeholder="Ilani fupi">
                        <button class="btn-secondary">Ongeza Mgombea</button>
                      </form>`
                    : ""
                }
              </div>`
            )
            .join("")
        : '<div class="card"><p class="muted">Hakuna uchaguzi uliopo wazi kwa sasa.</p></div>'
    }`;

  if (leader && document.getElementById("elForm")) {
    document.getElementById("elForm").onsubmit = async (e) => {
      e.preventDefault();
      if (await api("/api/elections", "POST", { position: document.getElementById("elPos").value })) {
        toast("Nafasi imefunguliwa");
        renderElections();
      }
    };
  }
}

async function nominate(e, electionId) {
  e.preventDefault();
  const f = e.target;
  if (await api("/api/elections/nominate", "POST", { electionId, name: f.name.value, manifesto: f.manifesto.value })) {
    toast("Mgombea ameongezwa");
    renderElections();
  }
}

async function vote(electionId, candidate) {
  if (await api("/api/elections/vote", "POST", { electionId, candidate })) {
    toast("Asante! Kura yako imehesabiwa");
    renderElections();
  }
}

async function renderAttendance() {
  const [list, events] = await Promise.all([api("/api/attendance"), api("/api/events")]);
  if (!list) return;
  const c = document.getElementById("content");
  c.innerHTML = `
    <div class="card">
      <div class="card-head"><h3>Thibitisha Mahudhurio (Check-In)</h3></div>
      <form id="attForm" style="display:flex;gap:10px;flex-wrap:wrap">
        <select id="attEventSelect" style="flex:1;min-width:200px;margin:0" onchange="if(this.value)document.getElementById('attMeet').value=this.options[this.selectedIndex].text">
          <option value="">-- Chagua Tukio (Hiari) --</option>
          ${(events || []).map((ev) => `<option value="${esc(ev.id)}">${esc(ev.title)} (${esc(ev.eventDate)})</option>`).join("")}
        </select>
        <input id="attMeet" style="flex:1.5;min-width:220px;margin:0" placeholder="Jina la kikao au tukio" required>
        <button class="btn-primary">Thibitisha</button>
      </form>
    </div>
    <div class="card">
      <div class="card-head"><h3>Rekodi za Mahudhurio (${list.length})</h3></div>
      ${
        list.length
          ? list
              .slice(0, 40)
              .map(
                (a) => `<div class="row">
                  <div><strong>${esc(a.userName)}</strong><small class="muted" style="display:block">${esc(a.meeting)}</small></div>
                  <small class="muted">${new Date(a.date).toLocaleString("sw-TZ")}</small>
                </div>`
              )
              .join("")
          : '<p class="muted">Hakuna rekodi bado.</p>'
      }
    </div>`;
  document.getElementById("attForm").onsubmit = async (e) => {
    e.preventDefault();
    if (
      await api("/api/attendance", "POST", {
        eventId: document.getElementById("attEventSelect").value,
        meeting: document.getElementById("attMeet").value
      })
    ) {
      toast("Mahudhurio yamethibitishwa");
      renderAttendance();
    }
  };
}

async function renderPenalties() {
  const [pol, list, members] = await Promise.all([
    api("/api/policy"),
    api("/api/penalties"),
    isLeaderRole() ? api("/api/members") : Promise.resolve([])
  ]);
  if (!pol) return;
  const admin = ME.role === "ADMIN";
  const financeLeader = ["ADMIN", "TREASURER", "CHAIRPERSON"].includes(ME.role);
  const c = document.getElementById("content");

  c.innerHTML = `
    <div class="card">
      <div class="card-head">
        <h3>Utaratibu wa Jumuiya &amp; Viwango vya Ada</h3>
        <span class="badge badge-info">Siku ya mwisho ya ada: Tarehe ${esc(pol.penaltyGraceDays)} ya mwezi</span>
      </div>
      <div class="kpis">
        <div class="kpi"><small>Ada ya Fomu</small><strong>${fmt(pol.registrationFee)}</strong></div>
        <div class="kpi"><small>Kiingilio</small><strong>${fmt(pol.entryFee)}</strong></div>
        <div class="kpi kpi-ok"><small>Ada ya Mwezi</small><strong>${fmt(pol.monthlyFee)}</strong></div>
        <div class="kpi kpi-bad"><small>Faini ya Kuchelewa</small><strong>${fmt(pol.latePenalty)}</strong></div>
      </div>
      <div style="background:#F8FAFC;border:1px solid var(--border);border-radius:12px;padding:16px;white-space:pre-line;line-height:1.7">
        ${esc(pol.rulesText || "Hakuna utaratibu ulioandikwa bado.")}
      </div>
    </div>

    ${
      admin
        ? `<div class="grid-2">
            <div class="card">
              <div class="card-head"><h3>Hariri Utaratibu &amp; Viwango (Admin)</h3></div>
              <form id="policyForm">
                <div class="grid-2">
                  <div><label class="lbl">Ada ya Fomu (TSh)</label><input id="polReg" type="number" value="${pol.registrationFee}"></div>
                  <div><label class="lbl">Kiingilio (TSh)</label><input id="polEntry" type="number" value="${pol.entryFee}"></div>
                  <div><label class="lbl">Ada ya Mwezi (TSh)</label><input id="polMonth" type="number" value="${pol.monthlyFee}"></div>
                  <div><label class="lbl">Mchango wa Dharura (TSh)</label><input id="polEmerg" type="number" value="${pol.emergencyFee}"></div>
                  <div><label class="lbl">Faini ya Kuchelewa (TSh)</label><input id="polFine" type="number" value="${pol.latePenalty}"></div>
                  <div><label class="lbl">Siku ya Mwisho (1–31)</label><input id="polGrace" type="number" min="1" max="31" value="${pol.penaltyGraceDays}"></div>
                </div>
                <label class="lbl">Kanuni na Utaratibu wa Jumuiya</label>
                <textarea id="polRules" rows="5">${esc(pol.rulesText || "")}</textarea>
                <button class="btn-primary" style="width:100%">Hifadhi Utaratibu</button>
              </form>
            </div>

            <div class="card">
              <div class="card-head"><h3>Toza Faini kwa Mwanachama</h3></div>
              <form id="fineForm">
                <label class="lbl">Chagua Mwanachama</label>
                <select id="fnUser">
                  <option value="">-- Mwanachama / Jumla --</option>
                  ${(members || []).filter((m) => m.status === "ACTIVE").map((m) => `<option value="${esc(m.id)}">${esc(m.name)} (${esc(m.wfcId || m.phone)})</option>`).join("")}
                </select>
                <label class="lbl">Sababu ya Faini</label>
                <input id="fnReason" placeholder="Mfano: Kuchelewa ada / Kutohudhuria kikao" required>
                <label class="lbl">Kiasi cha Faini (TSh)</label>
                <input id="fnAmt" type="number" value="${pol.latePenalty}" required>
                <button class="btn-primary" style="width:100%">Andika Faini</button>
              </form>
              <hr style="border:none;border-top:1px solid var(--border);margin:16px 0">
              <button class="btn-danger" style="width:100%" onclick="applyLateBatch()">Toza Faini ya Kuchelewa Ada kwa Wadaiwa Wote</button>
            </div>
          </div>`
        : ""
    }

    <div class="card">
      <div class="card-head"><h3>Orodha ya Faini (${(list || []).length})</h3></div>
      ${
        (list || []).length
          ? `<div class="table-wrap"><table>
              <thead><tr><th>Mwanachama</th><th>WFC ID</th><th>Sababu</th><th>Kiasi</th><th>Tarehe</th><th>Hali</th>${financeLeader ? "<th>Hatua</th>" : ""}</tr></thead>
              <tbody>${list
                .map(
                  (p) => `<tr>
                    <td><strong>${esc(p.userName)}</strong></td>
                    <td class="mono">${esc(p.wfcId || "—")}</td>
                    <td>${esc(p.reason)}</td>
                    <td>${fmt(p.amount)}</td>
                    <td>${fmtDate(p.createdAt)}</td>
                    <td>${statusBadge(p.status)}</td>
                    ${financeLeader ? `<td>${p.status !== "PAID" ? `<button class="btn-xs btn-primary" onclick="clearPenalty('${esc(p.id)}')">Thibitisha Imelipwa</button>` : "—"}</td>` : ""}
                  </tr>`
                )
                .join("")}</tbody>
            </table></div>`
          : '<p class="muted">Hakuna faini iliyoandikwa.</p>'
      }
    </div>`;

  if (admin) {
    document.getElementById("policyForm").onsubmit = async (e) => {
      e.preventDefault();
      if (
        await api("/api/admin/policy", "POST", {
          registrationFee: document.getElementById("polReg").value,
          entryFee: document.getElementById("polEntry").value,
          monthlyFee: document.getElementById("polMonth").value,
          emergencyFee: document.getElementById("polEmerg").value,
          latePenalty: document.getElementById("polFine").value,
          penaltyGraceDays: document.getElementById("polGrace").value,
          rulesText: document.getElementById("polRules").value
        })
      ) {
        toast("Utaratibu na viwango vimehifadhiwa!");
        renderPenalties();
      }
    };
    document.getElementById("fineForm").onsubmit = async (e) => {
      e.preventDefault();
      if (
        await api("/api/penalties", "POST", {
          userId: document.getElementById("fnUser").value,
          reason: document.getElementById("fnReason").value,
          amount: document.getElementById("fnAmt").value
        })
      ) {
        toast("Faini imeandikwa!");
        renderPenalties();
      }
    };
  }
}

async function applyLateBatch() {
  const d = await api("/api/penalties/apply-late-batch", "POST", {});
  if (d) {
    toast(`Faini zimewekwa kwa wanachama ${d.count} waliochelewa.`);
    renderPenalties();
  }
}

async function clearPenalty(penaltyId) {
  if (await api("/api/penalties/pay", "POST", { penaltyId })) {
    toast("Faini imethibitishwa kulipwa");
    renderPenalties();
  }
}

async function renderHelp() {
  const list = await api("/api/support");
  if (!list) return;
  const c = document.getElementById("content");
  c.innerHTML = `
    <div class="card">
      <div class="card-head"><h3>Wasiliana na Ofisi ya WFC</h3></div>
      <form id="supForm">
        <label class="lbl">Mada</label><input id="sSub" required>
        <label class="lbl">Maelezo</label><textarea id="sMsg" rows="3" required></textarea>
        <button class="btn-primary">Tuma Ombi la Msaada</button>
      </form>
    </div>
    <div class="card">
      <div class="card-head"><h3>Maombi Yako</h3></div>
      ${
        list.length
          ? list
              .map(
                (t) => `<div class="row">
                  <div><strong>${esc(t.subject)}</strong><small class="muted" style="display:block">${esc(t.message)}</small></div>
                  ${statusBadge(t.status)}
                </div>`
              )
              .join("")
          : '<p class="muted">Hakuna ombi lililotumwa.</p>'
      }
    </div>`;
  document.getElementById("supForm").onsubmit = async (e) => {
    e.preventDefault();
    if (
      await api("/api/support", "POST", {
        subject: document.getElementById("sSub").value,
        message: document.getElementById("sMsg").value
      })
    ) {
      toast("Ombi limepokewa na ofisi");
      renderHelp();
    }
  };
}

async function renderPending() {
  const [members, payments, tickets] = await Promise.all([
    api("/api/members"),
    api("/api/payments"),
    api("/api/tickets")
  ]);
  const pm = (members || []).filter((u) => u.status === "PENDING");
  const pp = (payments || []).filter((p) => p.status === "PENDING");
  const pt = (tickets || []).filter((t) => t.status === "PENDING");
  const financeLeader = ["ADMIN", "TREASURER", "CHAIRPERSON"].includes(ME.role);
  const c = document.getElementById("content");

  c.innerHTML = `
    <div class="card">
      <div class="card-head"><h3>Wanachama Wapya (${pm.length})</h3></div>
      ${
        pm.length
          ? pm
              .map(
                (u) => `<div class="row">
                  <div><strong>${esc(u.name)}</strong> · ${esc(u.phone)}<small class="muted" style="display:block">${esc(u.region)} · Ukoo: ${esc(u.clan || "—")} · Muamala: ${esc(u.paymentProof || "—")}</small></div>
                  <div class="tbl-actions">
                    <button class="btn-xs btn-outline" onclick="viewMemberDetails('${esc(u.id)}')">👁️ View Details</button>
                    <button class="btn-xs btn-primary" onclick="approveMember('${esc(u.id)}')">Idhinisha</button>
                  </div>
                </div>`
              )
              .join("")
          : '<p class="muted">Hakuna mwanachama anayesubiri.</p>'
      }
    </div>
    <div class="card">
      <div class="card-head"><h3>Michango Inayosubiri (${pp.length})</h3></div>
      ${
        pp.length
          ? pp
              .map(
                (p) => `<div class="row">
                  <div><strong>${esc(p.userName)}</strong> · ${fmt(p.amount)}<small class="muted" style="display:block">${esc(p.type)} · ${esc(p.transactionId)}</small></div>
                  ${financeLeader ? `<button class="btn-xs btn-primary" onclick="approvePayment('${esc(p.id)}')">Idhinisha</button>` : statusBadge("PENDING")}
                </div>`
              )
              .join("")
          : '<p class="muted">Hakuna mchango unaosubiri.</p>'
      }
    </div>
    <div class="card">
      <div class="card-head"><h3>Tiketi za Matukio (${pt.length})</h3></div>
      ${
        pt.length
          ? pt
              .map(
                (t) => `<div class="row">
                  <div><strong>${esc(t.name)}</strong> · ${esc(t.eventTitle)} (${t.qty} tiketi)<small class="muted" style="display:block">${fmt(t.totalAmount)} · ${esc(t.transactionId)}</small></div>
                  <button class="btn-xs btn-primary" onclick="approveTicket('${esc(t.id)}')">Thibitisha Tiketi</button>
                </div>`
              )
              .join("")
          : '<p class="muted">Hakuna tiketi inayosubiri.</p>'
      }
    </div>`;
}

async function approveMember(userId) {
  const d = await api("/api/approve-member", "POST", { userId });
  if (d) {
    toast("Ameidhinishwa · " + d.wfcId);
    go(currentPage);
  }
}

async function suspendMember(userId) {
  const d = await api("/api/suspend-member", "POST", { userId });
  if (d) {
    toast("Hali imebadilishwa: " + d.status);
    renderMembers();
  }
}

async function approveTicket(ticketId) {
  if (await api("/api/tickets/approve", "POST", { ticketId })) {
    toast("Tiketi imethibitishwa");
    go(currentPage);
  }
}

async function renderAccounting() {
  const [fin, debts, exps, incs] = await Promise.all([
    api("/api/accounting/summary"),
    api("/api/accounting/debts"),
    api("/api/expenses"),
    api("/api/manual-income")
  ]);
  if (!fin) return;
  const financeLeader = ["ADMIN", "TREASURER", "CHAIRPERSON"].includes(ME.role);
  const c = document.getElementById("content");
  c.innerHTML = `
    <div class="kpis">
      <div class="kpi kpi-ok"><small>Jumla ya Mapato</small><strong>${fmt(fin.mapato)}</strong></div>
      <div class="kpi kpi-bad"><small>Jumla ya Matumizi</small><strong>${fmt(fin.matumizi)}</strong></div>
      <div class="kpi kpi-info"><small>Salio Halisi</small><strong>${fmt(fin.balance)}</strong></div>
      <div class="kpi kpi-warn"><small>Madeni (${fin.debtors} wanachama)</small><strong>${fmt(fin.totalDebt)}</strong></div>
    </div>
    ${
      financeLeader
        ? `<div class="grid-2">
            <div class="card">
              <div class="card-head"><h3>Rekodi Matumizi</h3></div>
              <form id="expForm">
                <label class="lbl">Maelezo</label><input id="exTitle" required>
                <label class="lbl">Kiasi (TSh)</label><input id="exAmt" type="number" required>
                <label class="lbl">Kategoria</label><select id="exCat"><option>Misaada</option><option>Matukio</option><option>Ofisi</option><option>Nyingine</option></select>
                <button class="btn-primary" style="width:100%">Hifadhi Matumizi</button>
              </form>
            </div>
            <div class="card">
              <div class="card-head"><h3>Rekodi Mapato Mengine</h3></div>
              <form id="incForm">
                <label class="lbl">Maelezo</label><input id="inTitle" required>
                <label class="lbl">Kiasi (TSh)</label><input id="inAmt" type="number" required>
                <label class="lbl">Chanzo</label><input id="inSrc" placeholder="Mfano: Mchango wa mgeni">
                <button class="btn-primary" style="width:100%">Hifadhi Mapato</button>
              </form>
            </div>
          </div>`
        : ""
    }
    <div class="card">
      <div class="card-head"><h3>Orodha ya Wadaiwa wa Ada (${(debts || []).length})</h3></div>
      ${
        (debts || []).length
          ? `<div class="table-wrap"><table><thead><tr><th>Mwanachama</th><th>WFC ID</th><th>Mkoa</th><th>Inayopaswa</th><th>Amelipa</th><th>Deni</th></tr></thead>
            <tbody>${debts.map((d) => `<tr><td><strong>${esc(d.name)}</strong></td><td class="mono">${esc(d.wfcId || "—")}</td><td>${esc(d.region)}</td><td>${fmt(d.expected)}</td><td>${fmt(d.paid)}</td><td><strong style="color:var(--bad)">${fmt(d.debt)}</strong></td></tr>`).join("")}</tbody></table></div>`
          : '<p class="muted">Hakuna mwanachama mwenye deni.</p>'
      }
    </div>
    <div class="grid-2">
      <div class="card"><div class="card-head"><h3>Matumizi (${(exps || []).length})</h3></div>${(exps || []).map((x) => `<div class="row"><div><strong>${esc(x.title)}</strong><small class="muted" style="display:block">${esc(x.category)}</small></div><strong>${fmt(x.amount)}</strong></div>`).join("") || '<p class="muted">Hakuna rekodi.</p>'}</div>
      <div class="card"><div class="card-head"><h3>Mapato Mengine (${(incs || []).length})</h3></div>${(incs || []).map((x) => `<div class="row"><div><strong>${esc(x.title)}</strong><small class="muted" style="display:block">${esc(x.source)}</small></div><strong>${fmt(x.amount)}</strong></div>`).join("") || '<p class="muted">Hakuna rekodi.</p>'}</div>
    </div>`;

  if (financeLeader) {
    document.getElementById("expForm").onsubmit = async (e) => {
      e.preventDefault();
      if (
        await api("/api/expenses", "POST", {
          title: document.getElementById("exTitle").value,
          amount: document.getElementById("exAmt").value,
          category: document.getElementById("exCat").value
        })
      ) {
        toast("Matumizi yamehifadhiwa");
        renderAccounting();
      }
    };
    document.getElementById("incForm").onsubmit = async (e) => {
      e.preventDefault();
      if (
        await api("/api/manual-income", "POST", {
          title: document.getElementById("inTitle").value,
          amount: document.getElementById("inAmt").value,
          source: document.getElementById("inSrc").value
        })
      ) {
        toast("Mapato yamehifadhiwa");
        renderAccounting();
      }
    };
  }
}

async function renderTicketsAdmin() {
  const list = await api("/api/tickets");
  if (!list) return;
  const c = document.getElementById("content");
  c.innerHTML = `
    <div class="card">
      <div class="card-head"><h3>Tiketi Zote za Matukio (${list.length})</h3></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Mnunuzi</th><th>Simu</th><th>Tukio</th><th>Idadi</th><th>Kiasi</th><th>Muamala</th><th>Hali</th><th></th></tr></thead>
          <tbody>
            ${list
              .map(
                (t) => `<tr>
                  <td><strong>${esc(t.name)}</strong></td>
                  <td>${esc(t.phone)}</td>
                  <td>${esc(t.eventTitle)}</td>
                  <td>${t.qty}</td>
                  <td>${fmt(t.totalAmount)}</td>
                  <td class="mono">${esc(t.transactionId)}</td>
                  <td>${statusBadge(t.status)}</td>
                  <td>${t.status === "PENDING" ? `<button class="btn-xs btn-primary" onclick="approveTicket('${esc(t.id)}')">Thibitisha</button>` : ""}</td>
                </tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </div>`;
}

async function renderCases() {
  const list = await api("/api/cases");
  if (!list) return;
  const c = document.getElementById("content");
  c.innerHTML = `
    <div class="card">
      <div class="card-head"><h3>Sajili Kesi / Malalamiko</h3></div>
      <form id="caseForm">
        <label class="lbl">Kichwa</label><input id="csTitle" required>
        <label class="lbl">Maelezo</label><textarea id="csDesc" rows="3" required></textarea>
        <button class="btn-primary">Wasilisha</button>
      </form>
    </div>
    <div class="card">
      <div class="card-head"><h3>Kesi Zilizosajiliwa (${list.length})</h3></div>
      ${
        list.length
          ? list
              .map(
                (x) => `<div class="row">
                  <div><strong>${esc(x.title)}</strong><small class="muted" style="display:block">Na ${esc(x.reportedBy)} · ${esc(x.description)}</small></div>
                  ${statusBadge(x.status)}
                </div>`
              )
              .join("")
          : '<p class="muted">Hakuna kesi iliyosajiliwa.</p>'
      }
    </div>`;
  document.getElementById("caseForm").onsubmit = async (e) => {
    e.preventDefault();
    if (
      await api("/api/cases", "POST", {
        title: document.getElementById("csTitle").value,
        description: document.getElementById("csDesc").value
      })
    ) {
      toast("Kesi imesajiliwa");
      renderCases();
    }
  };
}

async function renderAssets() {
  const list = await api("/api/assets");
  if (!list) return;
  const c = document.getElementById("content");
  c.innerHTML = `
    <div class="card">
      <div class="card-head"><h3>Ongeza Mali ya Jumuiya</h3></div>
      <form id="asForm" class="grid-3-cards">
        <div><label class="lbl">Jina la Mali</label><input id="asName" required></div>
        <div><label class="lbl">Thamani (TSh)</label><input id="asVal" type="number" required></div>
        <div><label class="lbl">Mahali</label><input id="asLoc"></div>
        <div style="grid-column:1/-1"><button class="btn-primary">Hifadhi</button></div>
      </form>
    </div>
    <div class="card">
      <div class="card-head"><h3>Orodha ya Mali (${list.length})</h3></div>
      ${list.map((a) => `<div class="row"><div><strong>${esc(a.name)}</strong><small class="muted" style="display:block">${esc(a.location || "")}</small></div><strong>${fmt(a.value)}</strong></div>`).join("") || '<p class="muted">Hakuna mali iliyosajiliwa.</p>'}
    </div>`;
  document.getElementById("asForm").onsubmit = async (e) => {
    e.preventDefault();
    if (
      await api("/api/assets", "POST", {
        name: document.getElementById("asName").value,
        value: document.getElementById("asVal").value,
        location: document.getElementById("asLoc").value
      })
    ) {
      toast("Mali imehifadhiwa");
      renderAssets();
    }
  };
}

async function renderProjects() {
  const list = await api("/api/projects");
  if (!list) return;
  const c = document.getElementById("content");
  c.innerHTML = `
    <div class="card">
      <div class="card-head"><h3>Ongeza Mradi wa Jumuiya</h3></div>
      <form id="prForm" style="display:flex;gap:10px;flex-wrap:wrap">
        <input id="prName" style="flex:2;min-width:200px;margin:0" placeholder="Jina la mradi" required>
        <input id="prProg" type="number" min="0" max="100" style="flex:1;min-width:120px;margin:0" placeholder="Maendeleo (%)" value="10">
        <button class="btn-primary">Ongeza</button>
      </form>
    </div>
    <div class="card">
      <div class="card-head"><h3>Miradi ya WFC (${list.length})</h3></div>
      ${
        list.length
          ? list
              .map(
                (p) => `<div style="margin-bottom:14px">
                  <div style="display:flex;justify-content:space-between"><strong>${esc(p.name)}</strong><span>${Number(p.progress) || 0}%</span></div>
                  <div class="progress"><div style="width:${Math.min(100, Math.max(0, Number(p.progress) || 0))}%"></div></div>
                </div>`
              )
              .join("")
          : '<p class="muted">Hakuna mradi bado.</p>'
      }
    </div>`;
  document.getElementById("prForm").onsubmit = async (e) => {
    e.preventDefault();
    if (
      await api("/api/projects", "POST", {
        name: document.getElementById("prName").value,
        progress: document.getElementById("prProg").value
      })
    ) {
      toast("Mradi umeongezwa");
      renderProjects();
    }
  };
}

async function renderMessages() {
  const [outbox, contacts] = await Promise.all([api("/api/outbox"), api("/api/contacts")]);
  const c = document.getElementById("content");
  c.innerHTML = `
    <div class="card">
      <div class="card-head"><h3>Tuma Ujumbe (SMS / WhatsApp / Barua pepe)</h3></div>
      <form id="msgForm">
        <div class="grid-2">
          <div><label class="lbl">Njia</label><select id="mChan"><option value="whatsapp">WhatsApp</option><option value="sms">SMS</option><option value="email">Barua pepe</option></select></div>
          <div><label class="lbl">Namba au Barua pepe</label><input id="mTo" placeholder="255712345678" required></div>
        </div>
        <label class="lbl">Kichwa</label><input id="mTitle" required>
        <label class="lbl">Ujumbe</label><textarea id="mBody" rows="3" required></textarea>
        <button class="btn-primary">Tuma Ujumbe</button>
      </form>
    </div>
    <div class="grid-2">
      <div class="card"><div class="card-head"><h3>Historia ya Ujumbe (${(outbox || []).length})</h3></div>${(outbox || []).slice(0, 15).map((o) => `<div class="row"><div><strong>${esc(o.title)}</strong><small class="muted" style="display:block">${esc(o.channel)} → ${esc(o.to)}</small></div>${statusBadge(o.status)}</div>`).join("") || '<p class="muted">Hakuna ujumbe uliotumwa.</p>'}</div>
      <div class="card"><div class="card-head"><h3>Ujumbe Kutoka Tovuti (${(contacts || []).length})</h3></div>${(contacts || []).slice(0, 15).map((x) => `<div class="row"><div><strong>${esc(x.name)}</strong> · ${esc(x.phone)}<small class="muted" style="display:block">${esc(x.message)}</small></div></div>`).join("") || '<p class="muted">Hakuna ujumbe mpya.</p>'}</div>
    </div>`;

  document.getElementById("msgForm").onsubmit = async (e) => {
    e.preventDefault();
    const channel = document.getElementById("mChan").value;
    const to = document.getElementById("mTo").value;
    const title = document.getElementById("mTitle").value;
    const body = document.getElementById("mBody").value;
    const d = await api("/api/dispatch", "POST", { channel, to, title, body });
    if (d) {
      toast(d.detail || "Imetumwa");
      if (channel === "whatsapp") {
        window.open(`https://wa.me/${encodeURIComponent(to.replace(/\D/g, ""))}?text=${encodeURIComponent(title + "\n" + body)}`, "_blank", "noopener,noreferrer");
      }
      if (channel === "email") {
        window.location.href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
      }
      renderMessages();
    }
  };
}

async function renderMomo() {
  const c = document.getElementById("content");
  c.innerHTML = `
    <div class="card" style="max-width:540px">
      <div class="card-head"><h3>Omba Malipo ya Simu (STK Push)</h3></div>
      <form id="stkForm">
        <label class="lbl">Namba ya Simu</label><input id="stkPhone" placeholder="255712345678" required>
        <label class="lbl">Kiasi (TSh)</label><input id="stkAmt" type="number" value="10000" required>
        <button class="btn-primary" style="width:100%">Tuma Ombi la STK</button>
      </form>
      <p id="stkOut" class="muted" style="margin-top:12px"></p>
    </div>`;
  document.getElementById("stkForm").onsubmit = async (e) => {
    e.preventDefault();
    const d = await api("/api/stk", "POST", {
      phone: document.getElementById("stkPhone").value,
      amount: document.getElementById("stkAmt").value
    });
    if (d) document.getElementById("stkOut").textContent = d.detail;
  };
}

async function renderSettings() {
  const admin = ME.role === "ADMIN";
  const c = document.getElementById("content");
  c.innerHTML = `
    <div class="grid-2">
      <div class="card">
        <div class="card-head"><h3>Usalama wa Akaunti Yangu</h3></div>
        <p style="margin-bottom:12px">Uthibitishaji wa Hatua Mbili (2FA): <strong>${ME.twoFactor ? "IMEWASHWA" : "IMEZIMWA"}</strong></p>
        <button class="btn-secondary" onclick="toggle2FA()">${ME.twoFactor ? "Zima 2FA" : "Washa 2FA"}</button>
        <hr style="border:none;border-top:1px solid var(--border);margin:18px 0">
        <h4 style="margin-bottom:10px">Badili Nenosiri (Change Password)</h4>
        <form id="passForm">
          <label class="lbl">Nenosiri la Sasa</label><input id="oldPass" type="password" required>
          <label class="lbl">Nenosiri Jipya (angalau herufi 6)</label><input id="newPass" type="password" minlength="6" required>
          <button class="btn-primary">Badili Nenosiri</button>
        </form>
      </div>
      ${
        admin
          ? `<div class="card">
              <div class="card-head"><h3>Data, Mfumo &amp; Nakala Rudufu</h3></div>
              <p class="muted" style="margin-bottom:14px">Pakua nakala kamili ya data zote au ondoa data za majaribio (demo).</p>
              <div style="display:flex;gap:10px;flex-wrap:wrap">
                <a href="/api/backup" class="btn-primary">Pakua Nakala (JSON)</a>
                <button class="btn-danger" onclick="clearDemo()">Ondoa Data za Demo</button>
              </div>
              <hr style="border:none;border-top:1px solid var(--border);margin:18px 0">
              <h4 style="margin-bottom:10px">Uunganishaji wa SMS / WhatsApp / Daraja</h4>
              <form id="cfgForm">
                <label class="lbl">Africa's Talking Username</label><input id="cfgSmsU">
                <label class="lbl">Africa's Talking API Key</label><input id="cfgSmsK" type="password">
                <label class="lbl">WhatsApp Token</label><input id="cfgWaT" type="password">
                <label class="lbl">WhatsApp Phone ID</label><input id="cfgWaP">
                <button class="btn-primary">Hifadhi Mipangilio</button>
              </form>
            </div>`
          : ""
      }
    </div>`;

  document.getElementById("passForm").onsubmit = async (e) => {
    e.preventDefault();
    if (
      await api("/api/change-password", "POST", {
        currentPassword: document.getElementById("oldPass").value,
        newPassword: document.getElementById("newPass").value
      })
    ) {
      toast("Nenosiri limebadilishwa");
      e.target.reset();
    }
  };
  if (admin && document.getElementById("cfgForm")) {
    document.getElementById("cfgForm").onsubmit = async (e) => {
      e.preventDefault();
      if (
        await api("/api/settings", "POST", {
          smsUsername: document.getElementById("cfgSmsU").value,
          smsKey: document.getElementById("cfgSmsK").value,
          whatsappToken: document.getElementById("cfgWaT").value,
          whatsappPhoneId: document.getElementById("cfgWaP").value
        })
      ) {
        toast("Mipangilio imehifadhiwa");
      }
    };
  }
}

async function toggle2FA() {
  const d = await api("/api/toggle-2fa", "POST");
  if (d) {
    ME.twoFactor = d.twoFactor;
    toast(d.twoFactor ? "2FA imewashwa" : "2FA imezimwa");
    renderSettings();
  }
}

async function clearDemo() {
  if (await api("/api/demo/clear", "POST")) {
    toast("Data za majaribio zimeondolewa");
    go("home");
  }
}

// ==================== BOOTSTRAP ====================

async function bootApp() {
  const me = await api("/api/me");
  if (!me || !me.user) {
    document.getElementById("authScreen").classList.remove("hidden");
    document.getElementById("appShell").classList.add("hidden");
    if (location.hash === "#register") showRegister();
    return;
  }
  ME = me.user;
  document.getElementById("authScreen").classList.add("hidden");
  document.getElementById("appShell").classList.remove("hidden");
  syncHeaderUserAndNotifications();
  renderNav();
  await refreshHeaderNotifications();
  go("home");
}

setPortalLang(currentLang);
bootApp();
