const app = document.getElementById("app");
const modalRoot = document.getElementById("modalRoot");

function initTheme() {
  const t = localStorage.getItem("wfc-theme") || "light";
  document.documentElement.setAttribute("data-theme", t);
}
function toggleTheme() {
  const c = document.documentElement.getAttribute("data-theme") || "light";
  const n = c === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", n);
  localStorage.setItem("wfc-theme", n);
}
initTheme();

let LANG = localStorage.getItem("wfc-lang") || "sw";
const I18N = {
  sw: {
    dash: "Dashibodi", members: "Wanachama", payments: "Michango", events: "Matukio",
    tickets: "Tiketi", announcements: "Matangazo", contacts: "Ujumbe wa Tovuti",
    card: "Kitambulisho", family: "Familia", directory: "Directory", help: "Msaada",
    notifications: "Taarifa", history: "Historia", pending: "Inasubiri Idhini",
    attendance: "Mahudhurio", elections: "Uchaguzi", cases: "Kesi", saccos: "SACCOS",
    assets: "Mali", projects: "Miradi", penalties: "Faini", documents: "Nyaraka",
    roles: "Majukumu", charts: "Grafu", messages: "Ujumbe", momo: "Malipo ya Simu",
    accounting: "Uhasibu", settings: "Mipangilio", logout: "Toka Nje"
  },
  en: {
    dash: "Dashboard", members: "Members", payments: "Contributions", events: "Events",
    tickets: "Event Tickets", announcements: "Announcements", contacts: "Public Inbox",
    card: "Digital ID", family: "Family Tree", directory: "Directory", help: "Help Desk",
    notifications: "Notifications", history: "History & Logs", pending: "Pending Approval",
    attendance: "Attendance", elections: "Elections", cases: "Disciplinary & Cases", saccos: "SACCOS",
    assets: "Assets", projects: "Projects", penalties: "Penalties", documents: "Documents",
    roles: "Leadership Roles", charts: "Analytics", messages: "Dispatch", momo: "Mobile Money",
    accounting: "Accounting", settings: "Settings", logout: "Sign Out"
  }
};
function t(key) { return (I18N[LANG] && I18N[LANG][key]) || I18N.sw[key] || key; }
function toggleLang() {
  LANG = LANG === "sw" ? "en" : "sw";
  localStorage.setItem("wfc-lang", LANG);
  showDash();
}

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function openModal(title, html) {
  modalRoot.innerHTML = `<div class="modal-card">
    <div class="card-head"><h3>${esc(title)}</h3><button class="btn btn-sm ghost" onclick="closeModal()">Funga ✕</button></div>
    <div>${html}</div>
  </div>`;
  modalRoot.style.display = "flex";
  modalRoot.onclick = (e) => { if (e.target === modalRoot) closeModal(); };
}
function closeModal() {
  modalRoot.style.display = "none";
  modalRoot.innerHTML = "";
}

async function api(url, opts = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  return res.json();
}

function ico(d) {
  return `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
}
const IC = {
  home: ico('<path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z"/>'),
  users: ico('<path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9.5" cy="7" r="3"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 4.13a3 3 0 0 1 0 5.75"/>'),
  coin: ico('<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/><path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/>'),
  cal: ico('<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/>'),
  meg: ico('<path d="M4 10v4a2 2 0 0 0 2 2h2l5 4V4L8 8H6a2 2 0 0 0-2 2z"/><path d="M16 9a4 4 0 0 1 0 6"/>'),
  id: ico('<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="12" r="2"/><path d="M14 10h4M14 14h4"/>'),
  home2: ico('<path d="M4 11.5 12 5l8 6.5"/><path d="M7 10v9h10v-9"/>'),
  book: ico('<path d="M5 5h10a3 3 0 0 1 3 3v12H8a3 3 0 0 0-3 3z"/><path d="M5 5v15"/>'),
  life: ico('<circle cx="12" cy="12" r="8"/><path d="M12 8v8M8 12h8"/>'),
  clock: ico('<circle cx="12" cy="12" r="8"/><path d="M12 8v5l3 2"/>'),
  vote: ico('<path d="M4 6h16v12H4z"/><path d="M8 12l2 2 4-4"/>'),
  case: ico('<path d="M4 8h16v11H4z"/><path d="M9 8V6h6v2"/>'),
  bank: ico('<path d="M4 10h16M6 10v8M10 10v8M14 10v8M18 10v8M3 18h18M12 3 3 8h18z"/>'),
  box: ico('<path d="M3 8l9-4 9 4-9 4z"/><path d="M3 8v8l9 4 9-4V8"/>'),
  flag: ico('<path d="M5 21V4"/><path d="M5 5h11l-2 4 2 4H5"/>'),
  file: ico('<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v6h6"/>'),
  key: ico('<circle cx="8" cy="14" r="3"/><path d="M11 14h9l-2 2 2 2"/>'),
  bell: ico('<path d="M6 16V10a6 6 0 1 1 12 0v6l1 2H5z"/><path d="M10 19a2 2 0 0 0 4 0"/>'),
  chart: ico('<path d="M4 19V5M4 19h16"/><path d="M8 15v-4M12 15V8M16 15v-6"/>'),
  mail: ico('<rect x="3" y="6" width="18" height="12" rx="2"/><path d="m4 7 8 6 8-6"/>'),
  phone: ico('<rect x="8" y="3" width="8" height="18" rx="2"/><path d="M11 18h2"/>'),
  gear: ico('<circle cx="12" cy="12" r="3"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4"/>'),
  history: ico('<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/>')
};

function showOtp(phone, devCode) {
  app.innerHTML = `<div class="container">
    <img src="/wfc-logo.jpg" class="logo">
    <h1>Thibitisha OTP</h1>
    <p class="subtitle">Ingiza msimbo wa tarakimu 6. Unaisha baada ya dakika 5.</p>
    ${devCode ? `<div class="card">Msimbo wa majaribio: <strong>${esc(devCode)}</strong></div>` : ""}
    <form id="f">
      <div class="form-group"><label>Msimbo wa OTP</label><input name="code" required></div>
      <button class="btn" type="submit">Thibitisha</button>
      <div id="m"></div>
    </form>
    <p class="link"><a href="#" id="backLogin">← Rudi Kuingia</a></p>
  </div>`;
  document.getElementById("backLogin").onclick = e => { e.preventDefault(); showLogin(); };
  document.getElementById("f").onsubmit = async e => {
    e.preventDefault();
    const d = await api("/api/verify-otp", { method: "POST", body: { phone, code: new FormData(e.target).get("code") } });
    if (d.error) document.getElementById("m").innerHTML = `<div class="error">${esc(d.error)}</div>`;
    else showDash();
  };
}

function showForgotPassword() {
  app.innerHTML = `<div class="container">
    <img src="/wfc-logo.jpg" class="logo">
    <h1>Rudisha Nenosiri</h1>
    <p class="subtitle">Weka namba yako ya simu iliyosajiliwa kupata msimbo wa kubadili nenosiri.</p>
    <form id="reqForm">
      <div class="form-group"><label>Namba ya Simu</label><input name="phone" placeholder="07XXXXXXXX" required></div>
      <button class="btn" type="submit">Pata Msimbo</button>
      <div id="m1"></div>
    </form>
    <form id="resetForm" style="display:none;margin-top:16px;padding-top:16px;border-top:1px solid var(--border)">
      <div class="form-group"><label>Msimbo wa Tarakimu 6</label><input name="token" required></div>
      <div class="form-group"><label>Nenosiri Jipya</label><input name="newPassword" type="password" required></div>
      <button class="btn" type="submit">Hifadhi Nenosiri Jipya</button>
      <div id="m2"></div>
    </form>
    <p class="link"><a href="#" id="backL">← Rudi Kuingia</a></p>
  </div>`;
  document.getElementById("backL").onclick = e => { e.preventDefault(); showLogin(); };
  let targetPhone = "";
  document.getElementById("reqForm").onsubmit = async e => {
    e.preventDefault();
    targetPhone = new FormData(e.target).get("phone");
    const d = await api("/api/forgot-password", { method: "POST", body: { phone: targetPhone } });
    if (d.error) {
      document.getElementById("m1").innerHTML = `<div class="error">${esc(d.error)}</div>`;
    } else {
      document.getElementById("m1").innerHTML = `<div class="success">${esc(d.message)} ${d.devCode ? `(Msimbo: <strong>${esc(d.devCode)}</strong>)` : ""}</div>`;
      document.getElementById("resetForm").style.display = "block";
    }
  };
  document.getElementById("resetForm").onsubmit = async e => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.target));
    const d = await api("/api/reset-password", { method: "POST", body: { phone: targetPhone, ...fd } });
    document.getElementById("m2").innerHTML = d.error
      ? `<div class="error">${esc(d.error)}</div>`
      : `<div class="success">${esc(d.message)}</div>`;
    if (d.success) setTimeout(showLogin, 1500);
  };
}

function showLogin() {
  app.innerHTML = `<div class="container">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
      <a href="/" style="font-size:.82rem;text-decoration:none;color:var(--muted)">← Tovuti</a>
      <button class="theme-toggle" onclick="toggleTheme()" type="button">◐ Mandhari</button>
    </div>
    <img src="/wfc-logo.jpg" class="logo" alt="WFC">
    <div class="slogan-pill">Stand up, it's not over.</div>
    <h1>WACHAGGA FAMILY COMMUNITY</h1>
    <p class="subtitle">Umoja wa Wachagga, Nguvu ya Familia</p>
    <form id="f">
      <div class="form-group"><label>Namba ya Simu</label><input name="phone" placeholder="07XXXXXXXX" required></div>
      <div class="form-group"><label>Nenosiri</label><input name="password" type="password" required></div>
      <button class="btn" type="submit">Ingia Kwenye Portal</button>
      <div id="m"></div>
    </form>
    <p class="link">
      <a href="#" id="r">Jisajili Mwanachama Mpya</a> ·
      <a href="#" id="fp">Umesahau Nenosiri?</a>
    </p>
    <details class="demo-box">
      <summary>Akaunti za Majaribio (Quick Login)</summary>
      <p style="margin:6px 0">Mwenyekiti: <strong>0700000000</strong> / <strong>admin123</strong></p>
      <p style="margin:6px 0">Mwanachama: <strong>0711000001</strong> / <strong>demo123</strong></p>
      <p style="margin:6px 0">Mhazini: <strong>0711000002</strong> / <strong>demo123</strong></p>
    </details>
  </div>`;
  document.getElementById("r").onclick = e => { e.preventDefault(); showRegister(); };
  document.getElementById("fp").onclick = e => { e.preventDefault(); showForgotPassword(); };
  document.getElementById("f").onsubmit = async e => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.target));
    const d = await api("/api/login", { method: "POST", body });
    if (d.needOtp) return showOtp(body.phone, d.devCode);
    if (d.error) document.getElementById("m").innerHTML = `<div class="error">${esc(d.error)}</div>`;
    else showDash();
  };
}

function showRegister() {
  app.innerHTML = `<div class="container wide">
    <img src="/wfc-logo.jpg" class="logo" alt="WFC">
    <div class="slogan-pill">Stand up, it's not over.</div>
    <h1>Usajili wa Mwanachama Mpya</h1>
    <p class="subtitle">Ada ya Usajili: TSh 1,000 · Lipa kupitia M-Pesa 0755 000 888 au CRDB 0150889944200</p>
    <form id="f">
      <div class="form-grid">
        <div class="form-group"><label>Jina Kamili *</label><input name="name" placeholder="Mf. Godlisten Mushi" required></div>
        <div class="form-group"><label>Namba ya Simu *</label><input name="phone" placeholder="07XXXXXXXX" required></div>
        <div class="form-group"><label>Barua Pepe (Email)</label><input name="email" type="email" placeholder="jina@email.com"></div>
        <div class="form-group"><label>Kanda Unayoishi *</label>
          <select name="region">
            <option>Dar es Salaam</option><option>Kilimanjaro</option><option>Moshi</option>
            <option>Arusha</option><option>Tanga</option><option>Mwanza</option>
            <option>Dodoma</option><option>Mbeya</option><option>Diaspora (Nje ya Nchi)</option>
          </select>
        </div>
        <div class="form-group"><label>Ukoo (Chagga Clan)</label><input name="clan" placeholder="Mf. Mushi, Swai, Lyimo, Kimaro, Mrema..."></div>
        <div class="form-group"><label>Wilaya / Kijiji cha Asili</label><input name="village" placeholder="Mf. Machame, Marangu, Kibosho, Rombo, Uru"></div>
        <div class="form-group"><label>Wilaya Unayoishi</label><input name="district" placeholder="Mf. Kinondoni, Ilala, Hai"></div>
        <div class="form-group"><label>Taaluma / Kazi</label><input name="profession" placeholder="Mf. Mhandisi, Daktari, Mfanyabiashara"></div>
        <div class="form-group"><label>Njia ya Malipo ya Usajili</label>
          <select name="paymentMethod"><option>M-Pesa</option><option>Tigo Pesa</option><option>Airtel Money</option><option>CRDB Bank</option></select>
        </div>
        <div class="form-group"><label>Namba ya Muamala (Transaction ID)</label><input name="paymentProof" placeholder="Mf. QK89X72LMN"></div>
      </div>
      <div class="form-group"><label>Tengeneza Nenosiri *</label><input name="password" type="password" required></div>
      <button class="btn" type="submit">Kamilisha Usajili</button>
      <div id="m"></div>
    </form>
    <p class="link"><a href="#" id="l">← Tayari una akaunti? Ingia hapa</a></p>
  </div>`;
  document.getElementById("l").onclick = e => { e.preventDefault(); showLogin(); };
  document.getElementById("f").onsubmit = async e => {
    e.preventDefault();
    const d = await api("/api/register", { method: "POST", body: Object.fromEntries(new FormData(e.target)) });
    document.getElementById("m").innerHTML = d.error
      ? `<div class="error">${esc(d.error)}</div>`
      : `<div class="success">${esc(d.message)}</div>`;
    if (d.success) setTimeout(showLogin, 1600);
  };
}

function showProfileModal() {
  const u = window.__me || {};
  openModal("Wasifu Wangu & Usalama", `
    <form id="profForm">
      <div class="form-grid">
        <div class="form-group"><label>Jina Kamili</label><input name="name" value="${esc(u.name)}" required></div>
        <div class="form-group"><label>Barua Pepe</label><input name="email" value="${esc(u.email)}"></div>
        <div class="form-group"><label>Kanda</label><input name="region" value="${esc(u.region)}"></div>
        <div class="form-group"><label>Wilaya</label><input name="district" value="${esc(u.district)}"></div>
        <div class="form-group"><label>Ukoo (Clan)</label><input name="clan" value="${esc(u.clan)}"></div>
        <div class="form-group"><label>Kijiji cha Asili</label><input name="village" value="${esc(u.village)}"></div>
      </div>
      <div class="form-group"><label>Taaluma</label><input name="profession" value="${esc(u.profession)}"></div>
      <button class="btn" type="submit">Hifadhi Mabadiliko</button>
      <div id="profMsg"></div>
    </form>
    <hr style="margin:18px 0;border:0;border-top:1px solid var(--border)">
    <h4>Badili Nenosiri</h4>
    <form id="pwdForm">
      <div class="form-grid">
        <div class="form-group"><label>Nenosiri la Sasa</label><input name="currentPassword" type="password" required></div>
        <div class="form-group"><label>Nenosiri Jipya</label><input name="newPassword" type="password" required></div>
      </div>
      <button class="btn ghost" type="submit">Sasisha Nenosiri</button>
      <div id="pwdMsg"></div>
    </form>
  `);
  document.getElementById("profForm").onsubmit = async e => {
    e.preventDefault();
    const d = await api("/api/update-profile", { method: "POST", body: Object.fromEntries(new FormData(e.target)) });
    document.getElementById("profMsg").innerHTML = d.error ? `<div class="error">${esc(d.error)}</div>` : `<div class="success">Wasifu umehifadhiwa!</div>`;
    if (d.success) setTimeout(() => { closeModal(); showDash(); }, 900);
  };
  document.getElementById("pwdForm").onsubmit = async e => {
    e.preventDefault();
    const d = await api("/api/change-password", { method: "POST", body: Object.fromEntries(new FormData(e.target)) });
    document.getElementById("pwdMsg").innerHTML = d.error ? `<div class="error">${esc(d.error)}</div>` : `<div class="success">Nenosiri limebadilishwa!</div>`;
    if (d.success) e.target.reset();
  };
}

async function showDash() {
  const me = await api("/api/me");
  if (!me.user) return showLogin();
  if (me.user.status === "PENDING") {
    app.innerHTML = `<div class="container" style="text-align:center">
      <img src="/wfc-logo.jpg" class="logo">
      <h1>Inasubiri Idhini</h1>
      <p class="subtitle">Habari <strong>${esc(me.user.name)}</strong></p>
      <div class="card"><p>Usajili wako umepokelewa kikamilifu. Viongozi wanakagua uthibitisho wako wa usajili na watakupa namba yako rasmi ya WFC hivi punde.</p></div>
      <button class="btn" onclick="logout()">Toka Nje</button>
    </div>`;
    return;
  }
  window.__me = me.user;
  const isLead = ["ADMIN", "CHAIRPERSON", "SECRETARY", "TREASURER", "REGIONAL"].includes(me.user.role);

  const groups = [
    ["Kila Siku", [
      ["home", t("dash"), IC.home],
      ["members", t("members"), IC.users],
      ["payments", t("payments"), IC.coin],
      ["events", t("events"), IC.cal],
      ["announcements", t("announcements"), IC.meg]
    ]],
    ["Mwanachama", [
      ["card", t("card"), IC.id],
      ["family", t("family"), IC.home2],
      ["directory", t("directory"), IC.book],
      ["saccos", t("saccos"), IC.bank],
      ["elections", t("elections"), IC.vote],
      ["notifications", t("notifications"), IC.bell],
      ["history", t("history"), IC.history],
      ["help", t("help"), IC.life]
    ]],
    ...(isLead ? [["Ofisi & Uongozi", [
      ["pending", t("pending"), IC.clock],
      ["accounting", t("accounting"), IC.coin],
      ["tickets", t("tickets"), IC.file],
      ["contacts", t("contacts"), IC.mail],
      ["attendance", t("attendance"), IC.cal],
      ["cases", t("cases"), IC.case],
      ["assets", t("assets"), IC.box],
      ["projects", t("projects"), IC.flag],
      ["penalties", t("penalties"), IC.file],
      ["documents", t("documents"), IC.file],
      ["roles", t("roles"), IC.key],
      ["charts", t("charts"), IC.chart],
      ["messages", t("messages"), IC.mail],
      ["momo", t("momo"), IC.phone],
      ["settings", t("settings"), IC.gear]
    ]]] : [["Nyaraka & Malipo", [
      ["documents", t("documents"), IC.file],
      ["momo", t("momo"), IC.phone]
    ]]])
  ];

  app.innerHTML = `<div class="layout">
    <div class="scrim" id="scrim"></div>
    <aside class="sidebar" id="side">
      <div class="sidebar-logo">
        <img src="/wfc-logo.jpg" alt="WFC">
        <p>WACHAGGA FAMILY</p>
        <small>Stand up, it's not over.</small>
      </div>
      ${groups.map(([label, items]) => `<div class="nav-label">${esc(label)}</div>${items.map(([id, name, icon]) => `<a class="nav-item" data-p="${id}">${icon}${esc(name)}</a>`).join("")}`).join("")}
      <a class="nav-item" id="out">${IC.home}${esc(t("logout"))}</a>
    </aside>
    <div class="main">
      <div class="topbar">
        <div class="topbar-left">
          <button class="menu-btn" id="menuBtn" type="button">☰ Menyu</button>
          <strong id="pt">${esc(t("dash"))}</strong>
        </div>
        <div class="topbar-actions">
          <button class="icon-btn" id="bellBtn" type="button" title="Taarifa">🔔 <span class="notif-dot" id="notifBadge" style="display:none">0</span></button>
          <button class="icon-btn" onclick="toggleLang()" type="button">${LANG === "sw" ? "EN" : "SW"}</button>
          <button class="icon-btn" onclick="toggleTheme()" type="button">◐</button>
          <button class="icon-btn" id="profBtn" type="button">👤 ${esc(me.user.name.split(" ")[0])} ▾</button>
          <div class="dropdown-menu" id="profMenu">
            <div class="dropdown-header">
              <strong>${esc(me.user.name)}</strong><br>
              <small class="muted">${esc(me.user.wfcId || "WFC")} · ${esc(me.user.role)}</small>
            </div>
            <button class="dropdown-item" onclick="closeMenus();showProfileModal()">⚙️ Wasifu & Nenosiri</button>
            <button class="dropdown-item" onclick="closeMenus();load('card')">🪪 Kitambulisho Changu</button>
            <button class="dropdown-item" onclick="closeMenus();load('history')">📜 Historia Yangu</button>
            <button class="dropdown-item" style="color:#b42318" onclick="logout()">🚪 ${esc(t("logout"))}</button>
          </div>
        </div>
      </div>
      <div class="content" id="c"></div>
    </div>
    <nav class="tabbar">
      <button type="button" data-p="home">${IC.home}Nyumbani</button>
      <button type="button" data-p="payments">${IC.coin}Michango</button>
      <button type="button" data-p="events">${IC.cal}Matukio</button>
      <button type="button" id="moreBtn">${IC.meg}Zaidi</button>
    </nav>
  </div>`;

  const close = () => {
    document.getElementById("side").classList.remove("open");
    document.getElementById("scrim").classList.remove("on");
  };
  document.getElementById("menuBtn").onclick = () => {
    document.getElementById("side").classList.add("open");
    document.getElementById("scrim").classList.add("on");
  };
  document.getElementById("moreBtn").onclick = document.getElementById("menuBtn").onclick;
  document.getElementById("scrim").onclick = close;
  document.getElementById("out").onclick = logout;
  document.getElementById("bellBtn").onclick = () => { closeMenus(); load("notifications"); };
  document.getElementById("profBtn").onclick = e => {
    e.stopPropagation();
    document.getElementById("profMenu").classList.toggle("open");
  };
  document.addEventListener("click", closeMenus);
  document.querySelectorAll("[data-p]").forEach(el => (el.onclick = () => { close(); load(el.dataset.p); }));
  load("home");
}

function closeMenus() {
  const m = document.getElementById("profMenu");
  if (m) m.classList.remove("open");
}

async function viewMemberDetails(id) {
  const m = await api("/api/members/" + id);
  if (m.error) return alert(m.error);
  const fam = m.family || {};
  openModal("Taarifa Kamili za Mwanachama", `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
      <div class="avatar">${esc((m.name || "?").slice(0, 2).toUpperCase())}</div>
      <div>
        <strong style="font-size:1.15rem">${esc(m.name)}</strong><br>
        <span class="badge badge-active">${esc(m.wfcId || "Hana WFC ID")}</span>
        <span class="badge badge-pending">${esc(m.role)}</span>
      </div>
    </div>
    <div class="detail-grid">
      <div class="detail-item"><small>Simu</small><strong>${esc(m.phone)}</strong></div>
      <div class="detail-item"><small>Barua Pepe</small><strong>${esc(m.email || "—")}</strong></div>
      <div class="detail-item"><small>Kanda & Wilaya</small><strong>${esc(m.region)} ${m.district ? "· " + esc(m.district) : ""}</strong></div>
      <div class="detail-item"><small>Ukoo & Asili</small><strong>${esc(m.clan || "—")} ${m.village ? "· " + esc(m.village) : ""}</strong></div>
      <div class="detail-item"><small>Taaluma</small><strong>${esc(m.profession || "—")}</strong></div>
      <div class="detail-item"><small>Jumla ya Michango</small><strong>TSh ${Number(m.totalApproved || 0).toLocaleString()}</strong></div>
      <div class="detail-item"><small>Mwenzi (Spouse)</small><strong>${esc(fam.spouse || "—")}</strong></div>
      <div class="detail-item"><small>Watoto</small><strong>${esc((fam.children || []).join(", ") || "—")}</strong></div>
    </div>
    <h4>Malipo ya Hivi Karibuni</h4>
    ${(m.recentPayments || []).map(p => `<div style="padding:6px 0;border-bottom:1px solid var(--border);font-size:.86rem">${esc(p.type)} · <strong>TSh ${Number(p.amount).toLocaleString()}</strong> · ${esc(p.status)}</div>`).join("") || "<p class='muted'>Hakuna malipo bado.</p>"}
  `);
}

async function load(p) {
  const c = document.getElementById("c");
  const pageTitles = {
    home: t("dash"), members: t("members"), payments: t("payments"), events: t("events"),
    tickets: t("tickets"), announcements: t("announcements"), contacts: t("contacts"),
    card: t("card"), family: t("family"), directory: t("directory"), help: t("help"),
    notifications: t("notifications"), history: t("history"), pending: t("pending"),
    attendance: t("attendance"), elections: t("elections"), cases: t("cases"),
    saccos: t("saccos"), assets: t("assets"), projects: t("projects"),
    penalties: t("penalties"), documents: t("documents"), charts: t("charts"),
    messages: t("messages"), momo: t("momo"), settings: t("settings"),
    roles: t("roles"), accounting: t("accounting")
  };
  document.getElementById("pt").textContent = pageTitles[p] || p;
  document.querySelectorAll(".nav-item").forEach(el => el.classList.toggle("active", el.dataset.p === p));
  const money = n => "TSh " + Number(n || 0).toLocaleString();

  if (p === "home") {
    const d = await api("/api/dashboard");
    const badge = document.getElementById("notifBadge");
    if (badge) {
      if (d.stats.unreadNotifs > 0) {
        badge.textContent = d.stats.unreadNotifs;
        badge.style.display = "inline-block";
      } else {
        badge.style.display = "none";
      }
    }
    const max = Math.max(...(d.regions || []).map(r => r.value), 1);
    const fin = d.finance || { mapato: 0, matumizi: 0, balance: 0, totalDebt: 0, debtors: 0 };
    const isLead = ["ADMIN", "CHAIRPERSON", "SECRETARY", "TREASURER", "REGIONAL"].includes(d.user.role);

    c.innerHTML = `<section class="hero-band">
      <div>
        <span class="pill">${esc(d.user.status)} · STAND UP, IT'S NOT OVER.</span>
        <h2 class="serif" style="margin:8px 0 0;font-size:1.95rem">Karibu, ${esc(d.user.name)}</h2>
        <p>WFC ID: <strong>${esc(d.user.wfcId || "—")}</strong> · ${esc(d.user.region || "")} ${d.user.clan ? "· Ukoo wa " + esc(d.user.clan) : ""}</p>
      </div>
      <div>
        <div class="kicker" style="color:var(--gold-2)">Jumla Uliyochanga</div>
        <strong class="serif" style="font-size:1.85rem">${money(d.myTotalPaid)}</strong>
      </div>
    </section>
    <div class="stats">
      <div class="stat"><div>Wanachama Hai</div><div class="val">${d.stats.members}</div></div>
      <div class="stat"><div>Inasubiri Idhini</div><div class="val">${d.stats.pending}</div></div>
      <div class="stat"><div>Miamala Yote</div><div class="val">${d.stats.payments}</div></div>
      <div class="stat"><div>Matukio</div><div class="val">${d.stats.events}</div></div>
    </div>
    ${isLead ? `<div class="stats">
      <div class="stat" style="background:linear-gradient(135deg,#1a160f,#2a2418);color:#f6f1e7"><div>Mapato Yote</div><div class="val" style="color:#e6d3a1">${money(fin.mapato)}</div></div>
      <div class="stat" style="background:linear-gradient(135deg,#3a2e1c,#1a160f);color:#f6f1e7"><div>Matumizi</div><div class="val" style="color:#e6d3a1">${money(fin.matumizi)}</div></div>
      <div class="stat" style="background:linear-gradient(135deg,#c6a15b,#8d6a2a);color:#1a140c"><div>Salio (Balance)</div><div class="val">${money(fin.balance)}</div></div>
      <div class="stat"><div>Madeni ya Ada</div><div class="val">${money(fin.totalDebt)}</div><small class="muted">${fin.debtors} wanadaiwa</small></div>
    </div>` : ""}
    <div class="split">
      <div class="card">
        <div class="card-head"><h3>Mchanganuo wa Fedha</h3><a class="btn btn-sm ghost" href="/api/export/payments">Pakua Excel (CSV)</a></div>
        <canvas id="financeChart" height="170"></canvas>
      </div>
      <div class="card">
        <h3>Wanachama kwa Kanda</h3>
        ${(d.regions || []).map(r => `<div class="bar-row"><span><b>${esc(r.name)}</b><em>${r.value}</em></span><div class="track"><i style="width:${Math.round((r.value / max) * 100)}%"></i></div></div>`).join("") || "<p>Hakuna data</p>"}
      </div>
    </div>
    <div class="card">
      <div class="card-head"><h3>Malipo ya Hivi Karibuni</h3><button class="btn btn-sm" onclick="load('payments')">Wasilisha Mchango +</button></div>
      <div class="table-wrap"><table><thead><tr><th>Mwanachama</th><th>Aina</th><th>Kiasi</th><th>Muamala</th><th>Hali</th></tr></thead><tbody>
        ${(d.recent || []).map(x => `<tr><td>${esc(x.userName)}</td><td>${esc(x.type)}</td><td>${money(x.amount)}</td><td>${esc(x.transactionId)}</td><td><span class="badge ${x.status === "APPROVED" ? "badge-approved" : "badge-pending"}">${esc(x.status)}</span></td></tr>`).join("") || "<tr><td colspan=5>Hakuna</td></tr>"}
      </tbody></table></div>
    </div>`;

    if (window.Chart) {
      new Chart(document.getElementById("financeChart"), {
        type: "doughnut",
        data: {
          labels: isLead ? ["Mapato", "Matumizi", "Madeni"] : ["Ulichochanga", "Matukio"],
          datasets: [{
            data: isLead ? [fin.mapato || 1, fin.matumizi || 0, fin.totalDebt || 0] : [d.myTotalPaid || 1, d.stats.events || 1],
            backgroundColor: ["#c6a15b", "#1a160f", "#8d6a2a"],
            borderWidth: 0
          }]
        },
        options: { responsive: true, plugins: { legend: { position: "bottom" } }, cutout: "66%" }
      });
    }
  }

  if (p === "members") {
    const m = await api("/api/members");
    const isLead = ["ADMIN", "CHAIRPERSON", "SECRETARY", "TREASURER", "REGIONAL"].includes(window.__me.role);
    c.innerHTML = `<div class="card" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
      <input id="memberSearch" placeholder="Tafuta jina, simu, ukoo, kanda au WFC ID..." style="flex:1;min-width:220px">
      <select id="statusFilter" style="width:auto">
        <option value="">Hali Zote (${m.length})</option>
        <option value="ACTIVE">Hai (Active)</option>
        <option value="PENDING">Inasubiri (Pending)</option>
        <option value="SUSPENDED">Imesimamishwa</option>
      </select>
      <a class="btn btn-sm ghost" href="/api/export/members">📥 Pakua Excel</a>
    </div>
    <div id="memberGrid" class="member-grid"></div>`;

    const render = list => {
      document.getElementById("memberGrid").innerHTML = list.map(x => {
        const initials = (x.name || "?").split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase();
        const wa = x.phone ? `https://wa.me/255${x.phone.replace(/^0/, "")}` : "#";
        return `<div class="member-card">
          <div class="avatar">${esc(initials)}</div>
          <strong>${esc(x.name)}</strong>
          <div class="muted">${esc(x.wfcId || "WFC-—")} · ${esc(x.region)} ${x.clan ? "· " + esc(x.clan) : ""}</div>
          <div class="muted">${esc(x.phone)} ${x.profession ? "· " + esc(x.profession) : ""}</div>
          <span class="badge ${x.status === "ACTIVE" ? "badge-active" : x.status === "SUSPENDED" ? "badge-suspended" : "badge-pending"}">${x.status === "ACTIVE" ? "Hai" : x.status === "SUSPENDED" ? "Imesimamishwa" : "Inasubiri"}</span>
          <div class="member-actions">
            <button class="btn btn-sm ghost" onclick="viewMemberDetails('${x.id}')">👁️ Maelezo</button>
            <a class="btn btn-sm ghost" href="${wa}" target="_blank">WhatsApp</a>
            ${isLead && x.status === "PENDING" ? `<button class="btn btn-sm" onclick="approve('${x.id}')">Idhinisha</button>` : ""}
            ${isLead && x.status !== "PENDING" ? `<button class="btn btn-sm ghost" onclick="suspendMember('${x.id}')">${x.status === "SUSPENDED" ? "Rejesha" : "Simamisha"}</button>` : ""}
            ${["ADMIN", "CHAIRPERSON"].includes(window.__me.role) && x.id !== "admin-001" ? `<button class="btn btn-sm danger" onclick="removeMember('${x.id}')">Ondoa</button>` : ""}
          </div>
        </div>`;
      }).join("") || "<p class='muted'>Hakuna wanachama waliopatikana.</p>";
    };
    const applyFilter = () => {
      const q = document.getElementById("memberSearch").value.toLowerCase();
      const st = document.getElementById("statusFilter").value;
      render(m.filter(x => {
        const matchText = (x.name || "").toLowerCase().includes(q) || (x.phone || "").includes(q) || (x.region || "").toLowerCase().includes(q) || (x.clan || "").toLowerCase().includes(q) || (x.wfcId || "").toLowerCase().includes(q);
        const matchStatus = !st || x.status === st;
        return matchText && matchStatus;
      }));
    };
    render(m);
    document.getElementById("memberSearch").oninput = applyFilter;
    document.getElementById("statusFilter").onchange = applyFilter;
  }

  if (p === "payments") {
    const list = await api("/api/payments");
    const debt = await api("/api/my-debt");
    window.__pays = list;
    const canApprove = ["ADMIN", "TREASURER", "CHAIRPERSON"].includes(window.__me.role);
    c.innerHTML = `<div class="stats">
      <div class="stat"><div>Ada Inayotarajiwa</div><div class="val">${money(debt.expected)}</div></div>
      <div class="stat"><div>Ada Uliyolipa</div><div class="val">${money(debt.paid)}</div></div>
      <div class="stat"><div>Deni Lako la Ada</div><div class="val" style="color:${debt.debt > 0 ? "#9c2b2b" : "#1d7a45"}">${money(debt.debt)}</div></div>
      <div class="stat"><div>Muda (Miezi)</div><div class="val">${debt.months || 1}</div></div>
    </div>
    <div class="card">
      <h3>Wasilisha Malipo / Mchango</h3>
      <form id="pf" style="margin-top:10px">
        <div class="form-grid">
          <div class="form-group"><label>Aina ya Mchango</label><select name="type"><option>Ada ya mwezi</option><option>Kiingilio</option><option>Dharura</option><option>Msiba</option><option>Miradi ya WFC</option></select></div>
          <div class="form-group"><label>Njia ya Malipo</label><select name="channel"><option>M-Pesa</option><option>Tigo Pesa</option><option>Airtel Money</option><option>CRDB Bank</option></select></div>
          <div class="form-group"><label>Kiasi (TSh)</label><input name="amount" type="number" min="100" required></div>
          <div class="form-group"><label>Namba ya Muamala</label><input name="transactionId" placeholder="Mf. QK928172" required></div>
        </div>
        <button class="btn" type="submit">Wasilisha Malipo</button>
      </form>
    </div>
    <div class="card">
      <div class="card-head"><h3>Historia ya Malipo (${list.length})</h3><a class="btn btn-sm ghost" href="/api/export/payments">📥 Pakua Excel</a></div>
      <div class="table-wrap"><table><thead><tr><th>Mwanachama</th><th>Aina</th><th>Njia</th><th>Kiasi</th><th>Muamala</th><th>Hali</th><th>Hatua</th></tr></thead><tbody>
        ${list.map(x => `<tr>
          <td>${esc(x.userName)}</td><td>${esc(x.type)}</td><td>${esc(x.channel || "—")}</td><td>${money(x.amount)}</td><td>${esc(x.transactionId)}</td>
          <td><span class="badge ${x.status === "APPROVED" ? "badge-approved" : x.status === "REJECTED" ? "badge-rejected" : "badge-pending"}">${esc(x.status === "APPROVED" ? (x.receiptNo || "APPROVED") : x.status)}</span></td>
          <td>
            ${x.status === "PENDING" && canApprove ? `<button class="btn btn-sm" onclick="approvePay('${x.id}')">Idhinisha</button> <button class="btn btn-sm danger" onclick="rejectPay('${x.id}')">Kataa</button>` : ""}
            ${x.status === "APPROVED" ? `<button class="btn btn-sm" onclick="downloadReceipt('${x.id}')">📄 Risiti PDF</button>` : ""}
          </td>
        </tr>`).join("") || "<tr><td colspan=7>Hakuna malipo bado</td></tr>"}
      </tbody></table></div>
    </div>`;
    document.getElementById("pf").onsubmit = async e => {
      e.preventDefault();
      const d = await api("/api/submit-payment", { method: "POST", body: Object.fromEntries(new FormData(e.target)) });
      if (d.error) alert(d.error);
      else load("payments");
    };
  }

  if (p === "events") {
    const list = await api("/api/events");
    c.innerHTML = `<div class="card"><h3>Tangaza Tukio Jipya</h3><form id="ef" style="margin-top:10px">
      <div class="form-grid">
        <div class="form-group"><label>Aina ya Tukio</label><select name="type"><option>Msiba</option><option>Harusi</option><option>Festival</option><option>Mkutano</option><option>Tour</option></select></div>
        <div class="form-group"><label>Kichwa cha Tukio</label><input name="title" required></div>
        <div class="form-group"><label>Eneo / Ukumbi</label><input name="location"></div>
        <div class="form-group"><label>Tarehe ya Tukio</label><input name="eventDate" type="date"></div>
        <div class="form-group"><label>Bei ya Tiketi (TSh)</label><input name="ticketPrice" type="number" value="0"></div>
        <div class="form-group"><label>Poster (Picha &lt; 1.2MB)</label><input id="posterFile" type="file" accept="image/*"></div>
      </div>
      <button class="btn" type="submit">Chapisha Tukio</button>
    </form></div>
    <div class="card"><h3>Matukio Yote (${list.length})</h3>${list.map(ev => `<div style="padding:10px 0;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
      <div><strong>${esc(ev.title)}</strong> <span class="badge badge-pending">${esc(ev.type)}</span><br><small class="muted">${esc(ev.location || "")} ${ev.eventDate ? "· " + esc(ev.eventDate) : ""} · Tiketi: ${money(ev.ticketPrice)}</small></div>
      <a class="btn btn-sm ghost" href="/ticket/${ev.id}" target="_blank">Kiungo cha Tiketi ↗</a>
    </div>`).join("") || "<p class='muted'>Hakuna matukio</p>"}</div>`;
    document.getElementById("ef").onsubmit = async e => {
      e.preventDefault();
      const body = Object.fromEntries(new FormData(e.target));
      const file = document.getElementById("posterFile").files[0];
      if (file) {
        if (file.size > 1200000) return alert("Picha ni kubwa mno. Tumia chini ya 1.2 MB.");
        body.poster = await new Promise(resolve => { const r = new FileReader(); r.onload = () => resolve(r.result); r.readAsDataURL(file); });
      }
      await api("/api/events", { method: "POST", body });
      load("events");
    };
  }

  if (p === "tickets") {
    const list = await api("/api/tickets");
    c.innerHTML = `<div class="card"><h3>Tiketi Zilizokatwa (${list.length})</h3><div class="table-wrap"><table>
      <thead><tr><th>Msimbo</th><th>Tukio</th><th>Mnunuzi</th><th>Simu</th><th>Idadi</th><th>Jumla</th><th>Muamala</th><th>Hali</th><th>Hatua</th></tr></thead>
      <tbody>${list.map(t => `<tr>
        <td><strong>${esc(t.ticketCode || t.id)}</strong></td><td>${esc(t.eventTitle || t.eventId)}</td><td>${esc(t.name)}</td><td>${esc(t.phone)}</td>
        <td>${t.qty || 1}</td><td>${money(t.totalAmount)}</td><td>${esc(t.transactionId)}</td>
        <td><span class="badge ${t.status === "APPROVED" ? "badge-approved" : "badge-pending"}">${esc(t.status)}</span></td>
        <td>${t.status === "PENDING" ? `<button class="btn btn-sm" onclick="approveTicket('${t.id}')">Thibitisha</button>` : "✓ Tayari"}</td>
      </tr>`).join("") || "<tr><td colspan=9>Hakuna tiketi bado</td></tr>"}</tbody>
    </table></div></div>`;
  }

  if (p === "announcements") {
    const list = await api("/api/announcements");
    const isLead = ["ADMIN", "CHAIRPERSON", "SECRETARY", "TREASURER", "REGIONAL"].includes(window.__me.role);
    c.innerHTML = `${isLead ? `<div class="card"><h3>Chapisha Tangazo Jipya</h3><form id="af" style="margin-top:10px">
      <div class="form-group"><label>Kichwa</label><input name="title" required></div>
      <div class="form-group"><label>Ujumbe</label><textarea name="body" rows="3" required></textarea></div>
      <div class="form-group"><label>Kiungo (Hiari)</label><input name="link" placeholder="/#matukio au https://..."></div>
      <button class="btn" type="submit">Chapisha Tangazo</button>
    </form></div>` : ""}
    <div class="card"><h3>Matangazo ya Jumuiya</h3>${list.map(a => `<div style="padding:10px 0;border-bottom:1px solid var(--border)">
      <strong>${esc(a.title)}</strong><p style="margin:6px 0">${esc(a.body)}</p>
      ${a.link ? `<a href="${esc(a.link)}">${esc(a.link)}</a> · ` : ""}<small class="muted">Na ${esc(a.author || "Ofisi")} · ${new Date(a.createdAt).toLocaleDateString()}</small>
    </div>`).join("") || "<p class='muted'>Hakuna matangazo</p>"}</div>`;
    if (isLead && document.getElementById("af")) {
      document.getElementById("af").onsubmit = async e => {
        e.preventDefault();
        const d = await api("/api/announcements", { method: "POST", body: Object.fromEntries(new FormData(e.target)) });
        if (d.error) alert(d.error);
        else load("announcements");
      };
    }
  }

  if (p === "contacts") {
    const list = await api("/api/contacts");
    c.innerHTML = `<div class="card"><h3>Ujumbe Kutoka Tovuti Kuu (${list.length})</h3>
      ${list.map(m => `<div style="padding:10px 0;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
        <div><strong>${esc(m.name)}</strong> (${esc(m.phone)}) <span class="badge ${m.status === "RESOLVED" ? "badge-approved" : "badge-pending"}">${esc(m.status || "NEW")}</span><p style="margin:4px 0">${esc(m.message)}</p></div>
        ${m.status !== "RESOLVED" ? `<button class="btn btn-sm" onclick="resolveContact('${m.id}')">Weka Imeshughulikiwa</button>` : ""}
      </div>`).join("") || "<p class='muted'>Hakuna ujumbe mpya kutoka tovuti.</p>"}
    </div>`;
  }

  if (p === "card") {
    const d = await api("/api/dashboard");
    c.innerHTML = `<div class="card idcard">
      <img src="/wfc-logo.jpg" style="width:74px;height:74px;border-radius:50%;margin:0 auto">
      <h2>WACHAGGA FAMILY COMMUNITY</h2>
      <small style="color:var(--gold-2);letter-spacing:.12em">STAND UP, IT'S NOT OVER.</small>
      <p style="font-size:1.35rem;margin:10px 0 4px"><strong>${esc(d.user.name)}</strong></p>
      <p style="margin:2px 0;color:#e6d3a1;font-weight:700">${esc(d.user.wfcId || "WFC-MEMBER")}</p>
      <p style="margin:2px 0;font-size:.88rem">${esc(d.user.region || "—")} ${d.user.clan ? "· Ukoo: " + esc(d.user.clan) : ""}</p>
      <img id="qrc" class="qr" alt="QR Code">
      <button class="btn" onclick="window.print()">🖨️ Pakua / Chapisha Kitambulisho</button>
    </div>`;
    if (window.QRCode) {
      QRCode.toDataURL(JSON.stringify({ org: "WFC", id: d.user.wfcId || d.user.id, name: d.user.name }), { margin: 1, width: 180 }).then(url => {
        const img = document.getElementById("qrc");
        if (img) img.src = url;
      });
    }
  }

  if (p === "family") {
    const f = await api("/api/family");
    c.innerHTML = `<div class="card"><h3>Mti wa Familia Yangu</h3><form id="ff" style="margin-top:10px">
      <div class="form-group"><label>Mkuu wa Familia</label><input name="head" value="${esc(f.head || "")}"></div>
      <div class="form-group"><label>Mke / Mume</label><input name="spouse" value="${esc(f.spouse || "")}"></div>
      <div class="form-group"><label>Watoto (tenganisha kwa koma)</label><input name="children" value="${esc((f.children || []).join(", "))}"></div>
      <button class="btn" type="submit">Hifadhi Taarifa za Familia</button>
    </form></div>`;
    document.getElementById("ff").onsubmit = async e => {
      e.preventDefault();
      const o = Object.fromEntries(new FormData(e.target));
      o.children = o.children.split(",").map(s => s.trim()).filter(Boolean);
      await api("/api/family", { method: "POST", body: o });
      alert("Taarifa za familia zimehifadhiwa!");
    };
  }

  if (p === "directory") {
    const list = await api("/api/directory");
    c.innerHTML = `<div class="card"><h3>Sasisha Taaluma Yako</h3><form id="df" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
      <input name="profession" placeholder="Andika taaluma au biashara yako..." style="flex:1;min-width:200px" required>
      <button class="btn btn-sm" type="submit">Hifadhi</button>
    </form></div>
    <div class="card"><h3>Directory ya Wataalamu wa WFC (${list.length})</h3><div class="table-wrap"><table>
      <thead><tr><th>Jina</th><th>Taaluma</th><th>Ukoo</th><th>Kanda</th><th>Mawasiliano</th></tr></thead>
      <tbody>${list.map(x => `<tr><td><strong>${esc(x.name)}</strong></td><td>${esc(x.profession)}</td><td>${esc(x.clan || "—")}</td><td>${esc(x.region)}</td><td><a class="btn btn-sm ghost" href="https://wa.me/255${esc((x.phone || "").replace(/^0/, ""))}" target="_blank">WhatsApp</a></td></tr>`).join("") || "<tr><td colspan=5>Hakuna</td></tr>"}</tbody>
    </table></div></div>`;
    document.getElementById("df").onsubmit = async e => {
      e.preventDefault();
      await api("/api/my-profession", { method: "POST", body: Object.fromEntries(new FormData(e.target)) });
      load("directory");
    };
  }

  if (p === "help") {
    const list = await api("/api/support");
    const isLead = ["ADMIN", "CHAIRPERSON", "SECRETARY", "TREASURER", "REGIONAL"].includes(window.__me.role);
    c.innerHTML = `<div class="card"><h3>Omba Msaada / Tuma Tiketi</h3><form id="hf" style="margin-top:10px">
      <div class="form-group"><label>Mada</label><input name="subject" required></div>
      <div class="form-group"><label>Maelezo Kamili</label><textarea name="message" rows="3" required></textarea></div>
      <button class="btn" type="submit">Wasilisha Ombi</button>
    </form></div>
    <div class="card"><h3>Tiketi za Msaada (${list.length})</h3>${list.map(t => `<div style="padding:10px 0;border-bottom:1px solid var(--border)">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <strong>${esc(t.subject)}</strong> <span class="badge ${t.status === "RESOLVED" ? "badge-approved" : "badge-pending"}">${esc(t.status)}</span>
      </div>
      <small class="muted">Na: ${esc(t.userName || "")}</small>
      <p style="margin:6px 0">${esc(t.message || "")}</p>
      ${t.reply ? `<div style="padding:8px 12px;border-radius:10px;background:rgba(198,161,91,.12);font-size:.86rem"><strong>Jibu la Ofisi (${esc(t.repliedBy || "Kiongozi")}):</strong> ${esc(t.reply)}</div>` : ""}
      ${isLead && t.status !== "RESOLVED" ? `<button class="btn btn-sm ghost" style="margin-top:6px" onclick="replySupport('${t.id}')">Jibu & Funga Tiketi</button>` : ""}
    </div>`).join("") || "<p class='muted'>Hakuna tiketi za msaada</p>"}</div>`;
    document.getElementById("hf").onsubmit = async e => {
      e.preventDefault();
      await api("/api/support", { method: "POST", body: Object.fromEntries(new FormData(e.target)) });
      load("help");
    };
  }

  if (p === "notifications") {
    const list = await api("/api/notifications");
    const isLead = ["ADMIN", "CHAIRPERSON", "SECRETARY", "TREASURER", "REGIONAL"].includes(window.__me.role);
    c.innerHTML = `${isLead ? `<div class="card"><h3>Tuma Taarifa Kwa Wanachama Wote</h3><form id="nf">
      <div class="form-group"><label>Kichwa cha Taarifa</label><input name="title" required></div>
      <div class="form-group"><label>Ujumbe</label><textarea name="body" rows="2" required></textarea></div>
      <button class="btn" type="submit">Tuma Taarifa</button>
    </form></div>` : ""}
    <div class="card">
      <div class="card-head"><h3>Taarifa Zako (${list.length})</h3><button class="btn btn-sm ghost" onclick="markNotifsRead()">Weka Zote Zimesomwa ✓</button></div>
      ${list.map(n => `<div style="padding:10px 0;border-bottom:1px solid var(--border);opacity:${n.isRead ? ".75" : "1"}">
        <strong>${n.isRead ? "" : "🔵 "}${esc(n.title)}</strong><p style="margin:4px 0">${esc(n.body)}</p>
        <small class="muted">${new Date(n.createdAt).toLocaleString()}</small>
      </div>`).join("") || "<p class='muted'>Hakuna taarifa mpya</p>"}
    </div>`;
    if (isLead && document.getElementById("nf")) {
      document.getElementById("nf").onsubmit = async e => {
        e.preventDefault();
        const d = await api("/api/notifications", { method: "POST", body: { ...Object.fromEntries(new FormData(e.target)), userId: "all" } });
        if (d.error) alert(d.error);
        else load("notifications");
      };
    }
  }

  if (p === "history") {
    const h = await api("/api/history");
    c.innerHTML = `<div class="card">
      <div class="card-head"><h3>Historia ya Kumbukumbu & Matukio ya Mfumo</h3><a class="btn btn-sm ghost" href="/api/export/history">📥 Pakua Excel</a></div>
      <div class="table-wrap"><table><thead><tr><th>Kitendo</th><th>Mhusika</th><th>Lengo</th><th>Maelezo</th><th>Muda</th></tr></thead><tbody>
        ${(h.audits || []).map(a => `<tr><td><span class="badge badge-pending">${esc(a.action)}</span></td><td>${esc(a.actorName)}</td><td>${esc(a.target)}</td><td>${esc(a.detail)}</td><td>${new Date(a.createdAt).toLocaleString()}</td></tr>`).join("") || "<tr><td colspan=5>Hakuna kumbukumbu</td></tr>"}
      </tbody></table></div>
    </div>`;
  }

  if (p === "attendance") {
    const list = await api("/api/attendance");
    const rep = await api("/api/attendance-report");
    c.innerHTML = `<div class="card"><h3>Sajili Mahudhurio</h3><form id="af" style="display:flex;gap:8px;flex-wrap:wrap">
      <input name="meeting" value="Mkutano Mkuu wa WFC" style="flex:1;min-width:200px" required>
      <button class="btn btn-sm" type="submit">✓ Nipo Kwenye Mkutano</button>
    </form></div>
    <div class="split">
      <div class="card"><h3>Orodha ya Waliohudhuria (${list.length})</h3>${list.map(a => `<div style="padding:6px 0;border-bottom:1px solid var(--border)"><strong>${esc(a.userName)}</strong> · ${esc(a.meeting)} <small class="muted">(${new Date(a.date).toLocaleDateString()})</small></div>`).join("") || "<p class='muted'>Hakuna</p>"}</div>
      <div class="card"><h3>Muhtasari kwa Mwanachama</h3>${rep.map(r => `<div style="padding:6px 0;border-bottom:1px solid var(--border)">${esc(r.name)}: <strong>${r.count} mikutano</strong></div>`).join("") || "<p class='muted'>Hakuna</p>"}</div>
    </div>`;
    document.getElementById("af").onsubmit = async e => {
      e.preventDefault();
      await api("/api/attendance", { method: "POST", body: Object.fromEntries(new FormData(e.target)) });
      load("attendance");
    };
  }

  if (p === "elections") {
    const list = await api("/api/elections");
    const isLead = ["ADMIN", "CHAIRPERSON", "SECRETARY", "TREASURER", "REGIONAL"].includes(window.__me.role);
    c.innerHTML = `${isLead ? `<div class="card"><h3>Fungua Nafasi ya Uchaguzi</h3><form id="ef" style="display:flex;gap:8px;flex-wrap:wrap">
      <input name="position" placeholder="Mf. Mwenyekiti wa Kanda ya Dar es Salaam" style="flex:1;min-width:220px" required>
      <button class="btn btn-sm" type="submit">Fungua Uchaguzi</button>
    </form></div>` : ""}
    ${list.map(el => `<div class="card">
      <div class="card-head">
        <div><h3>${esc(el.position)}</h3><span class="badge ${el.status === "OPEN" ? "badge-approved" : "badge-suspended"}">${esc(el.status)}</span> · Jumla ya Kura: <strong>${el.votes.length}</strong></div>
        <div style="display:flex;gap:6px">
          ${el.status === "OPEN" ? `<button class="btn btn-sm ghost" onclick="nominateCandidate('${el.id}')">+ Pendekeza Mgombea</button>` : ""}
          <button class="btn btn-sm ghost" onclick="viewElectionResults('${el.id}')">📊 Matokeo</button>
          ${isLead && el.status === "OPEN" ? `<button class="btn btn-sm danger" onclick="closeElection('${el.id}')">Funga Kura</button>` : ""}
        </div>
      </div>
      <div>${el.candidates.map(cand => `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
        <div><strong>${esc(cand.name)}</strong><br><small class="muted">${esc(cand.manifesto || "")}</small></div>
        ${el.status === "OPEN" ? `<button class="btn btn-sm" onclick="castVote('${el.id}','${esc(cand.name)}')">🗳️ Piga Kura</button>` : ""}
      </div>`).join("") || "<p class='muted'>Hakuna wagombea waliopendekezwa bado.</p>"}</div>
    </div>`).join("") || "<div class='card'><p class='muted'>Hakuna uchaguzi uliofunguliwa kwa sasa.</p></div>"}`;

    if (isLead && document.getElementById("ef")) {
      document.getElementById("ef").onsubmit = async e => {
        e.preventDefault();
        await api("/api/elections", { method: "POST", body: Object.fromEntries(new FormData(e.target)) });
        load("elections");
      };
    }
  }

  if (p === "cases") {
    const list = await api("/api/cases");
    const isLead = ["ADMIN", "CHAIRPERSON", "SECRETARY", "TREASURER", "REGIONAL"].includes(window.__me.role);
    c.innerHTML = `<div class="card"><h3>Wasilisha Kesi / Shauri la Nidhamu</h3><form id="cf">
      <div class="form-group"><label>Mada</label><input name="title" required></div>
      <div class="form-group"><label>Maelezo</label><textarea name="description" rows="2" required></textarea></div>
      <button class="btn" type="submit">Wasilisha Shauri</button>
    </form></div>
    <div class="card"><h3>Orodha ya Kesi (${list.length})</h3>${list.map(x => `<div style="padding:10px 0;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;gap:10px">
      <div><strong>${esc(x.title)}</strong> <span class="badge ${x.status === "RESOLVED" ? "badge-approved" : "badge-pending"}">${esc(x.status)}</span><p style="margin:4px 0" class="muted">${esc(x.description || "")}</p></div>
      ${isLead && x.status === "OPEN" ? `<button class="btn btn-sm" onclick="resolveCase('${x.id}')">Funga Shauri</button>` : ""}
    </div>`).join("") || "<p class='muted'>Hakuna kesi</p>"}</div>`;
    document.getElementById("cf").onsubmit = async e => {
      e.preventDefault();
      await api("/api/cases", { method: "POST", body: Object.fromEntries(new FormData(e.target)) });
      load("cases");
    };
  }

  if (p === "saccos") {
    const d = await api("/api/saccos");
    const totalShares = (d.shares || []).reduce((s, x) => s + (x.amount || 0), 0);
    const totalSavings = (d.savings || []).reduce((s, x) => s + (x.amount || 0), 0);
    const canApprove = ["ADMIN", "TREASURER", "CHAIRPERSON"].includes(window.__me.role);
    c.innerHTML = `<div class="stats">
      <div class="stat"><div>Jumla ya Hisa</div><div class="val">${money(totalShares)}</div></div>
      <div class="stat"><div>Akiba (Savings)</div><div class="val">${money(totalSavings)}</div></div>
      <div class="stat"><div>Maombi ya Mikopo</div><div class="val">${(d.loans || []).length}</div></div>
      <div class="stat"><div>Mfuko Mkuu</div><div class="val">${money(totalShares + totalSavings)}</div></div>
    </div>
    <div class="split">
      <div class="card"><h3>Nunua Hisa / Weka Akiba</h3>
        <form id="sf" style="margin-bottom:12px"><div class="form-group"><label>Nunua Hisa (TSh)</label><input name="amount" type="number" required></div><button class="btn btn-sm" type="submit">Wasilisha Hisa</button></form>
        <form id="savf"><div class="form-group"><label>Weka Akiba (TSh)</label><input name="amount" type="number" required></div><button class="btn btn-sm ghost" type="submit">Weka Akiba</button></form>
      </div>
      <div class="card"><h3>Omba Mkopo wa SACCOS</h3>
        <form id="loanf">
          <div class="form-group"><label>Kiasi cha Mkopo (TSh)</label><input name="amount" type="number" required></div>
          <div class="form-group"><label>Lengo la Mkopo</label><input name="purpose" placeholder="Mf. Biashara, Kilimo, Elimu" required></div>
          <button class="btn" type="submit">Tuma Maombi ya Mkopo</button>
        </form>
      </div>
    </div>
    <div class="card"><h3>Mikopo ya SACCOS</h3><div class="table-wrap"><table>
      <thead><tr><th>Mwanachama</th><th>Kiasi</th><th>Lengo</th><th>Hali</th><th>Hatua</th></tr></thead>
      <tbody>${(d.loans || []).map(l => `<tr>
        <td>${esc(l.userName || "Mwanachama")}</td><td>${money(l.amount)}</td><td>${esc(l.purpose || "—")}</td>
        <td><span class="badge ${l.status === "APPROVED" ? "badge-approved" : l.status === "REJECTED" ? "badge-rejected" : "badge-pending"}">${esc(l.status)}</span></td>
        <td>${canApprove && l.status === "PENDING" ? `<button class="btn btn-sm" onclick="setLoanStatus('${l.id}','APPROVED')">Idhinisha</button> <button class="btn btn-sm danger" onclick="setLoanStatus('${l.id}','REJECTED')">Kataa</button>` : "—"}</td>
      </tr>`).join("") || "<tr><td colspan=5>Hakuna maombi ya mikopo</td></tr>"}</tbody>
    </table></div></div>`;

    document.getElementById("sf").onsubmit = async e => { e.preventDefault(); await api("/api/saccos/shares", { method: "POST", body: Object.fromEntries(new FormData(e.target)) }); load("saccos"); };
    document.getElementById("savf").onsubmit = async e => { e.preventDefault(); await api("/api/saccos/savings", { method: "POST", body: Object.fromEntries(new FormData(e.target)) }); load("saccos"); };
    document.getElementById("loanf").onsubmit = async e => { e.preventDefault(); await api("/api/saccos/loans", { method: "POST", body: Object.fromEntries(new FormData(e.target)) }); load("saccos"); };
  }

  if (p === "assets") {
    const list = await api("/api/assets");
    c.innerHTML = `<div class="card"><h3>Sajili Mali ya Jumuiya</h3><form id="asf">
      <div class="form-grid">
        <div class="form-group"><label>Jina la Mali</label><input name="name" required></div>
        <div class="form-group"><label>Thamani (TSh)</label><input name="value" type="number" required></div>
      </div>
      <div class="form-group"><label>Eneo Ilipo</label><input name="location"></div>
      <button class="btn" type="submit">Hifadhi Mali</button>
    </form></div>
    <div class="card"><h3>Orodha ya Mali (${list.length})</h3>${list.map(a => `<div style="padding:8px 0;border-bottom:1px solid var(--border)"><strong>${esc(a.name)}</strong> · ${money(a.value)} · <span class="muted">${esc(a.location || "")}</span></div>`).join("") || "<p class='muted'>Hakuna mali zilizosajiliwa</p>"}</div>`;
    document.getElementById("asf").onsubmit = async e => { e.preventDefault(); await api("/api/assets", { method: "POST", body: Object.fromEntries(new FormData(e.target)) }); load("assets"); };
  }

  if (p === "projects") {
    const list = await api("/api/projects");
    c.innerHTML = `<div class="card"><h3>Anzisha Mradi Mpya</h3><form id="prf">
      <div class="form-grid">
        <div class="form-group"><label>Jina la Mradi</label><input name="name" required></div>
        <div class="form-group"><label>Bajeti (TSh)</label><input name="budget" type="number" value="0"></div>
      </div>
      <div class="form-group"><label>Maendeleo ya Awali (%)</label><input name="progress" type="number" min="0" max="100" value="0"></div>
      <button class="btn" type="submit">Hifadhi Mradi</button>
    </form></div>
    <div class="card"><h3>Miradi ya WFC (${list.length})</h3>${list.map(pr => `<div style="padding:10px 0;border-bottom:1px solid var(--border)">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <strong>${esc(pr.name)}</strong> <span><strong>${pr.progress || 0}%</strong> <button class="btn btn-sm ghost" onclick="updateProject('${pr.id}', ${pr.progress || 0})">Sasisha %</button></span>
      </div>
      <div class="track"><i style="width:${pr.progress || 0}%"></i></div>
    </div>`).join("") || "<p class='muted'>Hakuna miradi</p>"}</div>`;
    document.getElementById("prf").onsubmit = async e => { e.preventDefault(); await api("/api/projects", { method: "POST", body: Object.fromEntries(new FormData(e.target)) }); load("projects"); };
  }

  if (p === "penalties") {
    const list = await api("/api/penalties");
    c.innerHTML = `<div class="card"><h3>Weka Faini Mpya</h3><form id="penf">
      <div class="form-grid">
        <div class="form-group"><label>Jina la Mwanachama</label><input name="memberName" required></div>
        <div class="form-group"><label>Kiasi (TSh)</label><input name="amount" type="number" required></div>
      </div>
      <div class="form-group"><label>Sababu ya Faini</label><input name="reason" required></div>
      <button class="btn" type="submit">Hifadhi Faini</button>
    </form></div>
    <div class="card"><h3>Orodha ya Faini (${list.length})</h3>${list.map(x => `<div style="padding:8px 0;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
      <div><strong>${esc(x.memberName || "Mwanachama")}</strong> — ${esc(x.reason)} · <strong>${money(x.amount)}</strong> <span class="badge ${x.status === "PAID" ? "badge-approved" : "badge-pending"}">${esc(x.status || "UNPAID")}</span></div>
      ${x.status !== "PAID" ? `<button class="btn btn-sm" onclick="payPenalty('${x.id}')">Weka Imelipwa</button>` : ""}
    </div>`).join("") || "<p class='muted'>Hakuna faini</p>"}</div>`;
    document.getElementById("penf").onsubmit = async e => { e.preventDefault(); await api("/api/penalties", { method: "POST", body: Object.fromEntries(new FormData(e.target)) }); load("penalties"); };
  }

  if (p === "documents") {
    const list = await api("/api/documents");
    const isLead = ["ADMIN", "CHAIRPERSON", "SECRETARY", "TREASURER", "REGIONAL"].includes(window.__me.role);
    c.innerHTML = `<div class="card"><h3>Maktaba ya Nyaraka na Katiba ya WFC (${list.length})</h3>
      ${list.map(d => `<div style="padding:10px 0;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;gap:10px">
        <div><strong>${esc(d.title)}</strong> <span class="badge badge-pending">${esc(d.category || "Nyaraka")}</span><p style="margin:4px 0" class="muted">${esc(d.summary || "")}</p></div>
        <a class="btn btn-sm ghost" href="${esc(d.url || "#")}" target="_blank">Fungua ↗</a>
      </div>`).join("") || "<p class='muted'>Hakuna nyaraka</p>"}
    </div>
    ${isLead ? `<div class="card"><h3>Ongeza Nyaraka Mpya</h3><form id="docf">
      <div class="form-grid">
        <div class="form-group"><label>Jina la Nyaraka</label><input name="title" required></div>
        <div class="form-group"><label>Kategoria</label><input name="category" value="Katiba & Kanuni"></div>
      </div>
      <div class="form-group"><label>Maelezo Mafupi</label><input name="summary"></div>
      <div class="form-group"><label>Kiungo (URL ya Google Drive / PDF)</label><input name="url" placeholder="https://..."></div>
      <button class="btn" type="submit">Hifadhi Nyaraka</button>
    </form></div>` : ""}`;
    if (isLead && document.getElementById("docf")) {
      document.getElementById("docf").onsubmit = async e => { e.preventDefault(); await api("/api/documents", { method: "POST", body: Object.fromEntries(new FormData(e.target)) }); load("documents"); };
    }
  }

  if (p === "pending") {
    const m = await api("/api/members");
    const pen = m.filter(x => x.status === "PENDING");
    c.innerHTML = `<div class="card"><h3>Wanachama Wanaosubiri Idhini (${pen.length})</h3><div class="table-wrap"><table>
      <thead><tr><th>Jina</th><th>Simu</th><th>Kanda</th><th>Ukoo</th><th>Muamala Usajili</th><th>Hatua</th></tr></thead>
      <tbody>${pen.map(x => `<tr><td><strong>${esc(x.name)}</strong></td><td>${esc(x.phone)}</td><td>${esc(x.region)}</td><td>${esc(x.clan || "—")}</td><td>${esc(x.paymentProof || "—")}</td><td><button class="btn btn-sm" onclick="approve('${x.id}')">✓ Idhinisha</button></td></tr>`).join("") || "<tr><td colspan=6>Hakuna maombi yanayosubiri</td></tr>"}</tbody>
    </table></div></div>`;
  }

  if (p === "charts") {
    const d = await api("/api/analytics");
    const bar = rows => {
      const max = Math.max(...rows.map(r => Number(r.value) || 0), 1);
      return rows.map(r => `<div class="bar-row"><span><b>${esc(r.name)}</b><em>${Number(r.value).toLocaleString()}</em></span><div class="track"><i style="width:${Math.round(((Number(r.value) || 0) / max) * 100)}%"></i></div></div>`).join("") || "<p class='muted'>Hakuna data</p>";
    };
    c.innerHTML = `<div class="split">
      <div class="card"><h3>Wanachama kwa Kanda</h3>${bar(d.regions || [])}</div>
      <div class="card"><h3>Makusanyo kwa Aina (TSh)</h3>${bar(d.types || [])}</div>
    </div>
    <div class="card"><h3>Mgawanyo wa Koo (Chagga Clans)</h3>${bar(d.clans || [])}</div>`;
  }

  if (p === "messages") {
    const members = await api("/api/members");
    const box = await api("/api/outbox");
    c.innerHTML = `<div class="card"><h3>Tuma Ujumbe (SMS / WhatsApp / Email)</h3><form id="mf">
      <div class="form-grid">
        <div class="form-group"><label>Njia</label><select name="channel"><option value="whatsapp">WhatsApp</option><option value="sms">SMS (Africa's Talking)</option><option value="email">Barua Pepe</option></select></div>
        <div class="form-group"><label>Mpokeaji</label><select name="to">${members.map(m => `<option value="${esc(m.phone)}">${esc(m.name)} · ${esc(m.phone)}</option>`).join("")}</select></div>
      </div>
      <div class="form-group"><label>Kichwa</label><input name="title" required></div>
      <div class="form-group"><label>Ujumbe</label><textarea name="body" rows="3" required></textarea></div>
      <button class="btn" type="submit">Tuma Ujumbe</button>
    </form></div>
    <div class="card"><h3>Kumbukumbu za Ujumbe (${box.length})</h3>${(box || []).map(n => `<div style="padding:8px 0;border-bottom:1px solid var(--border)"><strong>${esc(n.channel)}</strong> → ${esc(n.to)} <span class="badge badge-pending">${esc(n.status)}</span><p style="margin:4px 0">${esc(n.body)}</p><small class="muted">${esc(n.detail || "")}</small></div>`).join("") || "<p class='muted'>Hakuna ujumbe</p>"}</div>`;
    document.getElementById("mf").onsubmit = async e => {
      e.preventDefault();
      const body = Object.fromEntries(new FormData(e.target));
      if (body.channel === "whatsapp") {
        const phone = body.to.replace(/\D/g, "");
        const intl = phone.startsWith("0") ? "255" + phone.slice(1) : phone;
        window.open("https://wa.me/" + intl + "?text=" + encodeURIComponent(body.body), "_blank", "noopener");
      }
      if (body.channel === "email") window.open("mailto:?subject=" + encodeURIComponent(body.title) + "&body=" + encodeURIComponent(body.body));
      await api("/api/dispatch", { method: "POST", body });
      load("messages");
    };
  }

  if (p === "momo") {
    c.innerHTML = `<div class="card"><h3>Malipo ya Simu (M-Pesa / Tigo / Airtel / CRDB)</h3>
      <p>Namba Rasmi za WFC: <strong>M-Pesa: 0755 000 888</strong> · <strong>Tigo Pesa: 0715 000 888</strong> · <strong>Airtel Money: 0785 000 888</strong> · <strong>CRDB: 0150889944200</strong></p>
      <form id="sk"><div class="form-grid">
        <div class="form-group"><label>Namba ya Simu ya Kulipa</label><input name="phone" required></div>
        <div class="form-group"><label>Kiasi (TSh)</label><input name="amount" type="number" required></div>
      </div><button class="btn" type="submit">Tuma Ombi la STK Push</button></form><div id="skm" style="margin-top:8px"></div>
    </div>`;
    document.getElementById("sk").onsubmit = async e => {
      e.preventDefault();
      const d = await api("/api/stk", { method: "POST", body: Object.fromEntries(new FormData(e.target)) });
      document.getElementById("skm").innerHTML = `<div class="${d.ok ? "success" : "error"}">${esc(d.detail || "")}</div>`;
    };
  }

  if (p === "roles") {
    const members = await api("/api/members");
    const roles = await api("/api/roles");
    const isAdmin = window.__me && window.__me.role === "ADMIN";
    c.innerHTML = `<div class="card"><h3>Usimamizi wa Majukumu ya Viongozi</h3>
      <p class="muted">${isAdmin ? "Chagua mwanachama na umpe wadhifa." : "Admin pekee anaweza kubadilisha nyadhifa."}</p>
      ${members.map(m => `<div style="display:flex;gap:8px;align-items:center;padding:10px 0;border-bottom:1px solid var(--border);flex-wrap:wrap">
        <div style="flex:1;min-width:180px"><strong>${esc(m.name)}</strong><br><small class="muted">${esc(m.phone)} · ${esc(m.wfcId || "—")}</small></div>
        ${isAdmin ? `<select class="role-select" data-id="${m.id}" style="width:auto">${roles.map(r => `<option ${r === m.role ? "selected" : ""}>${r}</option>`).join("")}</select><button class="btn btn-sm" data-save="${m.id}">Hifadhi</button>` : `<span class="badge badge-pending">${esc(m.role)}</span>`}
      </div>`).join("")}
    </div>`;
    if (isAdmin) {
      document.querySelectorAll("[data-save]").forEach(btn => (btn.onclick = async () => {
        const id = btn.dataset.save;
        const sel = document.querySelector(`.role-select[data-id="${id}"]`);
        const d = await api("/api/set-role", { method: "POST", body: { userId: id, role: sel.value } });
        alert(d.error || "Wadhifa umehifadhiwa!");
      }));
    }
  }

  if (p === "accounting") {
    const sum = await api("/api/accounting/summary");
    const debts = await api("/api/accounting/debts");
    const expenses = await api("/api/expenses");
    const income = await api("/api/manual-income");
    const canEdit = ["ADMIN", "TREASURER", "CHAIRPERSON"].includes(window.__me.role);
    c.innerHTML = `<div class="stats">
      <div class="stat"><div>Jumla ya Mapato</div><div class="val">${money(sum.mapato)}</div></div>
      <div class="stat"><div>Jumla ya Matumizi</div><div class="val">${money(sum.matumizi)}</div></div>
      <div class="stat"><div>Salio Halisi (Balance)</div><div class="val">${money(sum.balance)}</div></div>
      <div class="stat"><div>Madeni ya Ada</div><div class="val">${money(sum.totalDebt)}</div><small class="muted">${sum.debtors} wanadaiwa</small></div>
    </div>
    ${canEdit ? `<div class="split">
      <div class="card"><h3>Rekodi Matumizi</h3><form id="expf">
        <div class="form-group"><label>Kichwa cha Matumizi</label><input name="title" required></div>
        <div class="form-grid">
          <div class="form-group"><label>Kiasi (TSh)</label><input name="amount" type="number" required></div>
          <div class="form-group"><label>Kategoria</label><select name="category"><option>Matukio</option><option>Misaada</option><option>Ofisi</option><option>Nyingine</option></select></div>
        </div>
        <button class="btn btn-sm" type="submit">+ Hifadhi Matumizi</button>
      </form></div>
      <div class="card"><h3>Rekodi Mapato ya Ziada</h3><form id="incf">
        <div class="form-group"><label>Maelezo ya Mapato</label><input name="title" required></div>
        <div class="form-grid">
          <div class="form-group"><label>Kiasi (TSh)</label><input name="amount" type="number" required></div>
          <div class="form-group"><label>Chanzo</label><input name="source" placeholder="Mf. Mfadhili, Mgeni"></div>
        </div>
        <button class="btn btn-sm" type="submit">+ Hifadhi Mapato</button>
      </form></div>
    </div>` : ""}
    <div class="card">
      <div class="card-head"><h3>Orodha ya Wanadaiwa Ada (${debts.length})</h3><a class="btn btn-sm ghost" href="/api/export/debts">📥 Pakua Ripoti ya Madeni (Excel)</a></div>
      <div class="table-wrap"><table><thead><tr><th>WFC ID</th><th>Jina</th><th>Simu</th><th>Kanda</th><th>Inayotarajiwa</th><th>Amelipa</th><th>Deni</th></tr></thead><tbody>
        ${debts.map(d => `<tr><td>${esc(d.wfcId || "—")}</td><td><strong>${esc(d.name)}</strong></td><td>${esc(d.phone)}</td><td>${esc(d.region)}</td><td>${money(d.expected)}</td><td>${money(d.paid)}</td><td style="color:#9c2b2b;font-weight:700">${money(d.debt)}</td></tr>`).join("") || "<tr><td colspan=7>Hakuna wanachama wenye madeni</td></tr>"}
      </tbody></table></div>
    </div>
    <div class="split">
      <div class="card"><h3>Matumizi (${expenses.length})</h3>${expenses.map(e => `<div style="padding:8px 0;border-bottom:1px solid var(--border)"><strong>${esc(e.title)}</strong> · ${money(e.amount)} <small class="muted">(${esc(e.category || "")})</small></div>`).join("") || "<p class='muted'>Hakuna</p>"}</div>
      <div class="card"><h3>Mapato ya Ziada (${income.length})</h3>${income.map(i => `<div style="padding:8px 0;border-bottom:1px solid var(--border)"><strong>${esc(i.title)}</strong> · ${money(i.amount)} <small class="muted">(${esc(i.source || "")})</small></div>`).join("") || "<p class='muted'>Hakuna</p>"}</div>
    </div>`;
    if (canEdit) {
      document.getElementById("expf").onsubmit = async e => { e.preventDefault(); await api("/api/expenses", { method: "POST", body: Object.fromEntries(new FormData(e.target)) }); load("accounting"); };
      document.getElementById("incf").onsubmit = async e => { e.preventDefault(); await api("/api/manual-income", { method: "POST", body: Object.fromEntries(new FormData(e.target)) }); load("accounting"); };
    }
  }

  if (p === "settings") {
    const d = await api("/api/dashboard");
    const s = d.settings || {};
    c.innerHTML = `<div class="split">
      <div class="card"><h3>Usalama wa Akaunti (2FA OTP)</h3><p class="muted">Washa au zima uthibitisho wa hatua mbili (OTP) unapoingia.</p><button class="btn" id="tfa" type="button">Washa / Zima OTP</button><p id="tfam" style="margin-top:8px"></p></div>
      <div class="card"><h3>Data ya Majaribio & Backup</h3><p class="muted">Ondoa akaunti na miamala ya majaribio kabla ya uzinduzi rasmi, au pakua nakala (JSON Backup).</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-sm danger" id="cleardemo" type="button">Ondoa Data za Majaribio</button>
          <a class="btn btn-sm ghost" href="/api/backup" target="_blank">💾 Pakua Database Backup</a>
        </div>
      </div>
    </div>
    <div class="card"><h3>Mipangilio ya Ada, SMS, WhatsApp, M-Pesa & reCAPTCHA</h3><form id="sf">
      <div class="form-grid">
        <div class="form-group"><label>Ada ya Usajili (TSh)</label><input name="registrationFee" type="number" value="${s.registrationFee || 1000}"></div>
        <div class="form-group"><label>Kiingilio (TSh)</label><input name="entryFee" type="number" value="${s.entryFee || 50000}"></div>
        <div class="form-group"><label>Ada ya Mwezi (TSh)</label><input name="monthlyFee" type="number" value="${s.monthlyFee || 10000}"></div>
        <div class="form-group"><label>Mfuko wa Dharura (TSh)</label><input name="emergencyFee" type="number" value="${s.emergencyFee || 60000}"></div>
        <div class="form-group"><label>Africa's Talking Username</label><input name="smsUsername" value="${esc(s.smsUsername || "")}"></div>
        <div class="form-group"><label>Africa's Talking API Key</label><input name="smsKey" value="${esc(s.smsKey || "")}"></div>
        <div class="form-group"><label>WhatsApp Token</label><input name="whatsappToken" value="${esc(s.whatsappToken || "")}"></div>
        <div class="form-group"><label>WhatsApp Phone ID</label><input name="whatsappPhoneId" value="${esc(s.whatsappPhoneId || "")}"></div>
        <div class="form-group"><label>M-Pesa Consumer Key</label><input name="momoConsumerKey" value="${esc(s.momoConsumerKey || "")}"></div>
        <div class="form-group"><label>M-Pesa Consumer Secret</label><input name="momoConsumerSecret" value="${esc(s.momoConsumerSecret || "")}"></div>
        <div class="form-group"><label>reCAPTCHA Site Key</label><input name="recaptchaSiteKey" value="${esc(s.recaptchaSiteKey || "")}"></div>
        <div class="form-group"><label>reCAPTCHA Secret Key</label><input name="recaptchaSecretKey" value="${esc(s.recaptchaSecretKey || "")}"></div>
      </div>
      <button class="btn" type="submit">Hifadhi Mipangilio Yote</button>
    </form></div>`;
    document.getElementById("tfa").onclick = async () => { const r = await api("/api/toggle-2fa", { method: "POST", body: {} }); document.getElementById("tfam").textContent = r.twoFactor ? "OTP imewashwa." : "OTP imezimwa."; };
    document.getElementById("cleardemo").onclick = async () => { if (!confirm("Una uhakika unataka kufuta data zote za majaribio?")) return; const r = await api("/api/demo/clear", { method: "POST", body: {} }); alert(r.error || "Data za majaribio zimeondolewa!"); };
    document.getElementById("sf").onsubmit = async e => { e.preventDefault(); const r = await api("/api/settings", { method: "POST", body: Object.fromEntries(new FormData(e.target)) }); alert(r.error || "Mipangilio imehifadhiwa!"); };
  }
}

async function downloadReceipt(id) {
  const row = (window.__pays || []).find(x => x.id === id);
  if (!row) return;
  const payload = JSON.stringify({ org: "WACHAGGA FAMILY COMMUNITY", receipt: row.receiptNo, name: row.userName, type: row.type, amount: row.amount, tx: row.transactionId });
  const qr = await QRCode.toDataURL(payload, { margin: 1, width: 220 });
  const doc = new jspdf.jsPDF();
  doc.setFillColor(18, 17, 14);
  doc.rect(0, 0, 210, 32, "F");
  doc.setTextColor(198, 154, 70);
  doc.setFontSize(16);
  doc.text("WACHAGGA FAMILY COMMUNITY", 14, 14);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text("Stand up, it's not over. | Risiti Rasmi ya Malipo", 14, 23);
  doc.setTextColor(22, 20, 15);
  doc.setFontSize(13);
  doc.text("Namba ya Risiti: " + (row.receiptNo || "RCP"), 14, 46);
  doc.setFontSize(11);
  [
    "Mwanachama: " + (row.userName || ""),
    "Aina ya Mchango: " + row.type,
    "Njia ya Malipo: " + (row.channel || "M-Pesa"),
    "Kiasi Kilicholipwa: TSh " + Number(row.amount).toLocaleString(),
    "Namba ya Muamala: " + row.transactionId,
    "Tarehe: " + new Date(row.approvedAt || row.createdAt).toLocaleDateString()
  ].forEach((line, i) => doc.text(line, 14, 58 + i * 8));
  doc.addImage(qr, "PNG", 142, 40, 48, 48);
  doc.save((row.receiptNo || "risiti-wfc") + ".pdf");
}

async function approve(id) { const d = await api("/api/approve-member", { method: "POST", body: { userId: id } }); if (d.success) { alert("Imeidhinishwa! WFC ID: " + d.wfcId); load("members"); } else alert(d.error || "Imeshindwa"); }
async function suspendMember(id) { if (!confirm("Badilisha hali ya kusimamishwa kwa mwanachama huyu?")) return; const d = await api("/api/suspend-member", { method: "POST", body: { userId: id } }); if (d.success) load("members"); else alert(d.error || "Imeshindwa"); }
async function removeMember(id) { if (!confirm("Ondoa mwanachama huyu kabisa kwenye mfumo?")) return; const d = await api("/api/remove-member", { method: "POST", body: { userId: id } }); if (d.success) load("members"); else alert(d.error || "Imeshindwa"); }
async function approvePay(id) { const d = await api("/api/approve-payment", { method: "POST", body: { paymentId: id } }); if (d.success) { alert("Malipo yameidhinishwa! Risiti: " + d.receiptNo); load("payments"); } else alert(d.error || "Imeshindwa"); }
async function rejectPay(id) { const reason = prompt("Sababu ya kukataa muamala huu:"); if (!reason) return; const d = await api("/api/reject-payment", { method: "POST", body: { paymentId: id, reason } }); if (d.success) load("payments"); else alert(d.error || "Imeshindwa"); }
async function approveTicket(id) { const d = await api("/api/approve-ticket", { method: "POST", body: { ticketId: id } }); if (d.success) load("tickets"); else alert(d.error || "Imeshindwa"); }
async function resolveContact(id) { await api("/api/contacts/" + id + "/reply", { method: "POST", body: {} }); load("contacts"); }
async function replySupport(id) { const reply = prompt("Andika jibu kwa mwanachama:"); if (!reply) return; await api("/api/support/" + id + "/reply", { method: "POST", body: { reply } }); load("help"); }
async function markNotifsRead() { await api("/api/notifications/read", { method: "POST", body: {} }); load("notifications"); }
async function nominateCandidate(electionId) { const name = prompt("Jina la mgombea:"); if (!name) return; const manifesto = prompt("Ilani fupi ya mgombea (hiari):") || ""; const d = await api("/api/elections/nominate", { method: "POST", body: { electionId, name, manifesto } }); if (d.error) alert(d.error); else load("elections"); }
async function castVote(electionId, candidate) { if (!confirm("Thibitisha kumpigia kura " + candidate + "?")) return; const d = await api("/api/elections/vote", { method: "POST", body: { electionId, candidate } }); if (d.error) alert(d.error); else { alert("Kura yako imehifadhiwa!"); load("elections"); } }
async function closeElection(id) { if (!confirm("Funga zoezi la kupiga kura?")) return; await api("/api/elections/" + id + "/close", { method: "POST", body: {} }); load("elections"); }
async function viewElectionResults(id) {
  const r = await api("/api/elections/" + id + "/results");
  if (r.error) return alert(r.error);
  const rows = Object.entries(r.results || {});
  openModal("Matokeo: " + r.position, `<p>Jumla ya Kura: <strong>${r.total}</strong></p>` +
    (rows.map(([cand, count]) => `<div class="bar-row"><span><b>${esc(cand)}</b><em>${count} kura (${r.total ? Math.round((count / r.total) * 100) : 0}%)</em></span><div class="track"><i style="width:${r.total ? Math.round((count / r.total) * 100) : 0}%"></i></div></div>`).join("") || "<p class='muted'>Hakuna kura bado.</p>"));
}
async function resolveCase(id) { await api("/api/cases/" + id + "/status", { method: "POST", body: { status: "RESOLVED" } }); load("cases"); }
async function setLoanStatus(id, status) { await api("/api/saccos/loans/" + id + "/status", { method: "POST", body: { status } }); load("saccos"); }
async function updateProject(id, cur) { const val = prompt("Weka asilimia mpya ya maendeleo (0 - 100):", cur); if (val === null) return; await api("/api/projects/" + id + "/progress", { method: "POST", body: { progress: Number(val) } }); load("projects"); }
async function payPenalty(id) { await api("/api/penalties/" + id + "/pay", { method: "POST", body: {} }); load("penalties"); }
async function logout() { await api("/api/logout", { method: "POST" }); showLogin(); }

(async () => {
  const me = await api("/api/me");
  if (me.user) showDash();
  else showLogin();
})();
