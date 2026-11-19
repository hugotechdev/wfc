const app = document.getElementById("app");
const groupModules = { tickets: "Tiketi", attendance: "Mahudhurio", elections: "Uchaguzi", saccos: "SACCOS" };
const canReviewPayments = role => ["ADMIN", "TREASURER", "CHAIRPERSON"].includes(role);
const canViewReports = role => ["ADMIN", "TREASURER", "CHAIRPERSON", "SECRETARY", "REGIONAL"].includes(role);
const formatTsh = value => "TSh " + Number(value || 0).toLocaleString();

function downloadReport(filename, columns, rows) {
  const cell = value => {
    const text = String(value ?? "");
    const safe = /^[\s]*[=+@-]|^[\t\r\n]/.test(text) && typeof value !== "number" ? "'" + text : text;
    return '"' + safe.replaceAll('"', '""') + '"';
  };
  const csv = [columns, ...rows].map(row => row.map(cell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}


function groupLogo(className = "logo") {
  return `<span class="${className} group-logo" data-group-logo>${escapeHtml(groupProfile.shortName)}</span>`;
}

const languageWidget = document.getElementById("google_translate_element");

function placeLanguageSwitcher() {
  const slot = document.getElementById("portalLanguage") || document.getElementById("authLanguage");
  slot.append(languageWidget);
  applyGroupProfile(groupProfile);
}

function escapeHtml(value) {
  const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return String(value ?? "").replace(/[&<>"']/g, character => entities[character]);
}

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

async function api(path, opts = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  return res.json();
}

function ico(d) {
  return `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
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
  logout: ico('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>')
};

function showOtp(phone, devCode) {
  app.innerHTML = `<div class="auth-page"><div class="auth-language" id="authLanguage"></div>
    <div class="container">
      ${groupLogo()}
      <h1>Thibitisha OTP</h1>
      <p class="subtitle">Ingiza msimbo wa tarakimu 6 uliotumwa kwako. Unaisha baada ya dakika 5.</p>
      ${devCode ? `<div class="payment-hint">SMS haijaunganishwa. Msimbo wa majaribio: <strong>${devCode}</strong></div>` : ""}
      <form id="f">
        <div class="form-group"><label>Msimbo wa OTP</label><input name="code" placeholder="000000" required></div>
        <button class="btn" type="submit">Thibitisha na Ingia</button>
        <div id="m"></div>
      </form>
    </div>
  </div>`;
  placeLanguageSwitcher();
  document.getElementById("f").onsubmit = async e => {
    e.preventDefault();
    const d = await api("/api/verify-otp", { method: "POST", body: { phone, code: new FormData(e.target).get("code") } });
    if (d.error) document.getElementById("m").innerHTML = `<div class="error">${d.error}</div>`;
    else showDash();
  };
}

function showLogin() {
  app.innerHTML = `<div class="auth-page signin-page"><div class="auth-language" id="authLanguage"></div>
    <section class="signin-brand" aria-label="Utambulisho wa kikundi">
      <div class="studio-orbit" aria-hidden="true">
        <div class="studio-orbit-ring"></div><div class="studio-orbit-core">${escapeHtml(groupProfile.shortName.slice(0, 7))}</div>
      </div>
      <div class="signin-brand-copy">
            <h2>${escapeHtml(groupProfile.slogan || groupProfile.name)}</h2>
      </div>
    </section>
    <div class="container">
      <div class="auth-topbar">
        <span class="kicker">Ingia</span>
        <button class="theme-toggle" onclick="toggleTheme()" type="button" aria-label="Badili mwanga">◐ Mandhari</button>
      </div>
      ${groupLogo()}
      <h1 translate="no">${escapeHtml(groupProfile.name)}</h1>
      <p class="subtitle">Ingia kwa namba ya simu na nenosiri lako.</p>
      <form id="f">
        <div class="form-group"><label>Namba ya Simu</label><input name="phone" placeholder="07XX XXX XXX" required></div>
        <div class="form-group"><label>Nenosiri</label><input name="password" type="password" placeholder="••••••••" required></div>
        <button class="btn" type="submit">Ingia kwenye Akaunti</button>
        <div id="m"></div>
      </form>
      <p class="link">Huna akaunti? <a href="#" id="r">Jisajili sasa</a> · <a href="/">Tovuti kuu</a></p>
    </div>
  </div>`;
  placeLanguageSwitcher();
  document.getElementById("r").onclick = e => { e.preventDefault(); showRegister(); };
  document.getElementById("f").onsubmit = async e => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.target));
    const d = await api("/api/login", { method: "POST", body });
    if (d.needOtp) return showOtp(body.phone, d.devCode);
    if (d.error) document.getElementById("m").innerHTML = `<div class="error">${d.error}</div>`;
    else showDash();
  };
}

function showRegister() {
  app.innerHTML = `<div class="auth-page"><div class="auth-language" id="authLanguage"></div>
    <div class="container">
      ${groupLogo()}
      <h1>Usajili wa Mwanachama</h1>
      <p class="subtitle">Ada ya usajili: <strong>TSh ${groupProfile.registrationFee.toLocaleString("sw-TZ")}</strong></p>
      ${groupProfile.registrationFee > 0 ? `<div class="payment-hint">${escapeHtml(paymentInstructions(groupProfile))}</div>` : ""}
      <form id="f">
        <div class="form-group"><label>Jina Kamili</label><input name="name" placeholder="Mf. Amina Swai" required></div>
        <div class="form-row-2">
          <div class="form-group"><label>Namba ya Simu</label><input name="phone" placeholder="07XX XXX XXX" required></div>
          <div class="form-group"><label>Kanda</label><input name="region" placeholder="Andika eneo lako"></div>
        </div>
        <div class="form-group"><label>Nenosiri</label><input name="password" type="password" placeholder="Unda nenosiri imara" minlength="12" maxlength="128" required></div>
        ${groupProfile.registrationFee > 0 ? `<div class="form-group"><label for="groupPaymentProof">Namba ya muamala</label><input id="groupPaymentProof" name="paymentProof" required></div>` : ""}
        ${groupProfile.rules ? `<div class="payment-hint"><strong>Kanuni za kikundi</strong><div class="group-rules">${escapeHtml(groupProfile.rules)}</div>
          <label class="group-check"><input type="checkbox" name="acceptRules" required> Nimesoma na ninakubali kanuni.</label></div>` : ""}
        <button class="btn" type="submit">Wasilisha Usajili</button>
        <div id="m"></div>
      </form>
      <p class="link">Tayari una akaunti? <a href="#" id="l">Rudi Kuingia</a></p>
    </div>
  </div>`;
  placeLanguageSwitcher();
  document.getElementById("l").onclick = e => { e.preventDefault(); showLogin(); };
  document.getElementById("f").onsubmit = async e => {
    e.preventDefault();
    const d = await api("/api/register", { method: "POST", body: { ...Object.fromEntries(new FormData(e.target)), displayedRules: groupProfile.rules } });
    document.getElementById("m").innerHTML = d.error ? `<div class="error">${d.error}</div>` : `<div class="success">${d.message}</div>`;
    if (d.success) setTimeout(showLogin, 1200);
  };
}

async function showDash() {
  const me = await api("/api/me");
  if (!me.user) return showLogin();
  if (me.user.status !== "ACTIVE") {
    app.innerHTML = `<div class="auth-page"><div class="auth-language" id="authLanguage"></div>
      <div class="container">
        ${groupLogo()}
        <div style="text-align:center;margin-bottom:10px"><span class="badge badge-pending">Akaunti haijawa hai</span></div>
        <h1>Inasubiri Idhini</h1>
        <p class="subtitle">Habari <strong>${me.user.name}</strong></p>
        <div class="payment-hint" style="text-align:center">
          Ombi lako la usajili limepokelewa. Subiri viongozi waidhinishe akaunti yako na kukupatia namba ya uanachama.
        </div>
        <button class="btn ghost" onclick="logout()">Toka nje</button>
      </div>
    </div>`;
    placeLanguageSwitcher();
    return;
  }

  window.__me = me.user;
  const initials = (me.user.name || "W").split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase();

  const groups = [
    ["Kila siku", [
      ["home", "Dashibodi", IC.home],
      ["members", "Wanachama", IC.users],
      ["payments", "Michango", IC.coin],
      ["events", "Matukio", IC.cal],
      ["announcements", "Matangazo", IC.meg]
    ]],
    ["Mwanachama", [
      ["account", "Akaunti yangu", IC.id],
      ["card", "Kitambulisho", IC.id],
      ["family", "Familia", IC.home2],
      ["directory", "Directory", IC.book],
      ["help", "Msaada", IC.life],
      ["notifications", "Taarifa", IC.bell]
    ]],
    ["Ofisi", [
      ...(canViewReports(me.user.role) ? [["pending", "Maombi ya uanachama", IC.clock], ["reports", "Ripoti na historia", IC.file]] : []),
      ...(groupProfile.modules?.attendance !== false ? [["attendance", "Mahudhurio", IC.cal]] : []),
      ...(groupProfile.modules?.elections !== false ? [["elections", "Uchaguzi", IC.vote]] : []),
      ["cases", "Kesi", IC.case],
      ...(groupProfile.modules?.saccos !== false ? [["saccos", "SACCOS", IC.bank]] : []),
      ["assets", "Mali", IC.box],
      ["projects", "Miradi", IC.flag],
      ["penalties", "Faini", IC.file],
      ["documents", "Nyaraka", IC.file],
      ["roles", "Majukumu", IC.key],
      ["charts", "Grafu", IC.chart],
      ["messages", "Ujumbe", IC.mail],
      ["momo", "Malipo ya simu", IC.phone],
      ["accounting", "Uhasibu", IC.coin],
      ...(me.user.role === "ADMIN" ? [["settings", "Mipangilio ya kikundi", IC.gear]] : [])
    ]]
  ];

  const collapsed = localStorage.getItem("wfc-sidebar-collapsed") === "1" ? "is-collapsed" : "";

  app.innerHTML = `<div class="layout ${collapsed}" id="layoutRoot">
    <div class="scrim" id="scrim"></div>
    <aside class="sidebar" id="side" aria-label="Menyu kuu">
      <div class="sidebar-header">
        <div class="sidebar-brand">
          ${groupLogo("sidebar-group-logo")}
          <div class="sidebar-brand-text">
            <strong>${escapeHtml(groupProfile.name)}</strong>
            <span data-group-text="shortName"></span>
          </div>
        </div>
        <button class="collapse-btn" id="collapseBtn" type="button" aria-label="Kunja au fungua menyu" aria-expanded="${!collapsed}">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
      </div>

      <div class="sidebar-scroll">
        ${groups.map(([label, items]) => `
          <div class="nav-label">${label}</div>
          ${items.map(([id, name, icon]) => `<button class="nav-item" type="button" data-p="${id}" title="${name}" aria-label="${name}">${icon}<span class="nav-text">${name}</span></button>`).join("")}
        `).join("")}
      </div>

      <div class="sidebar-footer">
        <button class="nav-item logout-item" type="button" id="out" aria-label="Toka nje" title="Toka nje">${IC.logout}<span class="nav-text">Toka nje</span></button>
      </div>
    </aside>

    <div class="main">
      <header class="topbar">
        <div class="topbar-left">
          <button class="menu-btn" id="menuBtn" type="button" aria-controls="side" aria-expanded="false">Menyu</button>
          <div class="topbar-title-group">
            <strong id="pt">Dashibodi</strong>
            <span class="topbar-sub">${escapeHtml(groupProfile.name)} · Ofisi ya kidijitali</span>
          </div>
        </div>
        <div class="topbar-actions">
          <button class="theme-toggle" onclick="toggleTheme()" type="button">◐ Mwanga</button>
          <div id="portalLanguage"></div>
          <details class="profile-menu" id="profileMenu">
            <summary class="user-chip">
              <span class="user-chip-avatar" aria-hidden="true">${escapeHtml(initials)}</span>
              <span class="user-chip-name" translate="no">${escapeHtml(me.user.name)}</span>
            </summary>
            <div class="profile-panel">
              <button type="button" data-p="account">Akaunti yangu</button>
              <button type="button" data-p="profile">Wasifu wangu</button>
              <button type="button" data-p="preferences">Mipangilio ya akaunti</button>
              <button type="button" data-p="password">Badili nenosiri</button>
              <button type="button" id="profileLogout">Toka nje</button>
            </div>
          </details>
          <button class="btn btn-sm ghost header-logout" type="button" id="headerLogout" aria-label="Toka nje">${IC.logout}<span>Toka nje</span></button>
        </div>
      </header>
      <main class="content" id="c" tabindex="-1"></main>
    </div>

    <nav class="tabbar" aria-label="Menyu ya haraka">
      <button type="button" data-p="home">${IC.home}<span>Nyumbani</span></button>
      <button type="button" data-p="payments">${IC.coin}<span>Michango</span></button>
      <button type="button" data-p="events">${IC.cal}<span>Matukio</span></button>
      <button type="button" id="moreBtn">${IC.meg}<span>Zaidi</span></button>
    </nav>
  </div>`;

  placeLanguageSwitcher();
  const layoutRoot = document.getElementById("layoutRoot");
  document.getElementById("collapseBtn").onclick = () => {
    layoutRoot.classList.toggle("is-collapsed");
    localStorage.setItem("wfc-sidebar-collapsed", layoutRoot.classList.contains("is-collapsed") ? "1" : "0");
    document.getElementById("collapseBtn").setAttribute("aria-expanded", String(!layoutRoot.classList.contains("is-collapsed")));
    window.dispatchEvent(new Event("resize"));
  };

  const close = () => {
    document.getElementById("side").classList.remove("open");
    document.getElementById("scrim").classList.remove("on");
    document.getElementById("menuBtn").setAttribute("aria-expanded", "false");
  };
  document.getElementById("menuBtn").onclick = () => {
    document.getElementById("side").classList.add("open");
    document.getElementById("scrim").classList.add("on");
    document.getElementById("menuBtn").setAttribute("aria-expanded", "true");
    document.querySelector("#side [data-p]").focus();
  };
  document.getElementById("moreBtn").onclick = document.getElementById("menuBtn").onclick;
  document.getElementById("scrim").onclick = close;
  document.getElementById("out").onclick = logout;
  document.getElementById("profileLogout").onclick = logout;
  document.getElementById("headerLogout").onclick = logout;
  const profileMenu = document.getElementById("profileMenu");
  layoutRoot.addEventListener("click", event => {
    if (!profileMenu.contains(event.target)) profileMenu.open = false;
  });
  layoutRoot.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;
    if (profileMenu.open) {
      profileMenu.open = false;
      profileMenu.querySelector("summary").focus();
    }
    if (document.getElementById("side").classList.contains("open")) {
      close();
      document.getElementById("menuBtn").focus();
    }
  });
  document.querySelectorAll("[data-p]").forEach(el => el.onclick = () => {
    close();
    profileMenu.open = false;
    load(el.dataset.p);
    document.getElementById("c").focus();
  });

  load("home");
}

function apexBaseOptions() {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  const labelColor = isDark ? "#94A3B8" : "#6B7280";
  const gridColor = isDark ? "rgba(226,232,240,0.08)" : "#E5E7EB";
  return {
    chart: {
      fontFamily: "Inter, -apple-system, sans-serif",
      toolbar: { show: false },
      zoom: { enabled: false },
      background: "transparent"
    },
    grid: {
      borderColor: gridColor,
      strokeDashArray: 4,
      xaxis: { lines: { show: false } }
    },
    dataLabels: { enabled: false },
    legend: {
      position: "bottom",
      fontSize: "12.5px",
      fontWeight: 500,
      labels: { colors: labelColor },
      markers: { width: 8, height: 8, radius: 99 }
    },
    tooltip: { theme: isDark ? "dark" : "light" },
    xaxis: {
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: labelColor, fontSize: "12px" } }
    },
    yaxis: {
      labels: { style: { colors: labelColor, fontSize: "12px" } }
    }
  };
}

async function load(p) {
  const c = document.getElementById("c");
  c.dataset.page = p;
  const titles = {
    profile: "Wasifu wangu", preferences: "Mipangilio ya akaunti", password: "Badili nenosiri",
    account: "Akaunti yangu", reports: "Ripoti na historia",
    home: "Dashibodi", members: "Wanachama", payments: "Michango", events: "Matukio",
    announcements: "Matangazo", card: "Kitambulisho", family: "Familia", directory: "Directory",
    help: "Msaada", pending: "Inasubiri Idhini", attendance: "Mahudhurio", elections: "Uchaguzi",
    cases: "Kesi", saccos: "SACCOS", assets: "Mali", projects: "Miradi", penalties: "Faini",
    documents: "Nyaraka", charts: "Grafu na Takwimu", messages: "Ujumbe", momo: "Malipo ya simu",
    settings: "Mipangilio", roles: "Majukumu", notifications: "Taarifa", accounting: "Uhasibu"
  };
  document.getElementById("pt").textContent = titles[p] || p;
  document.querySelectorAll("[data-p]").forEach(el => {
    const active = el.dataset.p === p;
    el.classList.toggle("active", active);
    if (active) el.setAttribute("aria-current", "page");
    else el.removeAttribute("aria-current");
  });

  if (p === "profile") {
    const user = window.__me;
    c.innerHTML = `<section class="card"><h3>Wasifu wangu</h3><dl class="profile-fields">
      <dt>Jina</dt><dd translate="no">${escapeHtml(user.name)}</dd>
      <dt>Simu</dt><dd>${escapeHtml(user.phone)}</dd>
      <dt>Namba ya uanachama</dt><dd>${escapeHtml(user.wfcId || "—")}</dd>
      <dt>Jukumu</dt><dd>${escapeHtml(user.role)}</dd>
    </dl></section>`;
    return;
  }

  if (p === "preferences") {
    c.innerHTML = `<section class="card"><h3>Muonekano wa akaunti</h3><p class="muted">Badili mandhari ya portal kwenye kifaa hiki.</p>
      <button class="btn ghost" type="button" id="accountTheme">Badili mandhari</button></section>`;
    document.getElementById("accountTheme").onclick = toggleTheme;
    return;
  }

  if (p === "password") {
    c.innerHTML = `<section class="card"><form id="passwordForm">
      <div class="form-group"><label for="oldPassword">Nenosiri la sasa</label><input id="oldPassword" name="currentPassword" type="password" autocomplete="current-password" required></div>
      <div class="form-group"><label for="newPassword">Nenosiri jipya</label><input id="newPassword" name="newPassword" type="password" autocomplete="new-password" minlength="12" maxlength="128" required></div>
      <button type="submit" class="btn">Hifadhi nenosiri</button><p id="passwordResult" role="status"></p>
    </form></section>`;
    document.getElementById("passwordForm").onsubmit = async event => {
      event.preventDefault();
      const form = event.currentTarget;
      const result = document.getElementById("passwordResult");
      const submit = form.querySelector("button");
      submit.disabled = true;
      try {
        const response = await api("/api/change-password", { method: "POST", body: Object.fromEntries(new FormData(form)) });
        result.textContent = response.success ? "Nenosiri limebadilishwa." : response.error || "Imeshindwa kuhifadhi.";
        if (response.success) form.reset();
      } catch {
        result.textContent = "Muunganisho umekatika. Jaribu tena.";
      } finally {
        submit.disabled = false;
      }
    };
    return;
  }

  c.innerHTML = `<div class="stats">${[1, 2, 3, 4].map(() => `<div class="stat"><div class="skeleton" style="height:74px"></div></div>`).join("")}</div><div class="card"><div class="skeleton" style="height:220px"></div></div>`;

  if (p === "home") {
    const d = await api("/api/dashboard");
    const max = Math.max(...(d.regions || []).map(r => r.value), 1);
    const money = n => "TSh " + Number(n || 0).toLocaleString();
    if (c.dataset.page !== p) return;
    const fin = d.finance;

    c.innerHTML = `
      <div class="dashboard-studio">
      <section class="hero-band overview-hero">
        <div class="studio-orbit hero-orbit" aria-hidden="true">
          <div class="studio-orbit-ring"></div><div class="studio-orbit-core">${escapeHtml(groupProfile.shortName.slice(0, 7))}</div>
        </div>
        <div>
          <span class="pill">${d.user.status === "ACTIVE" ? "Mwanachama hai" : escapeHtml(d.user.status)}</span>
          <h2>Karibu, ${escapeHtml(d.user.name)}</h2>
          <p>Namba ya uanachama: <strong>${escapeHtml(d.user.wfcId || "—")}</strong> · Kanda ya ${escapeHtml(d.user.region || "Tanzania")} · Jukumu: ${d.user.role}</p>
        </div>
        <div class="hero-contribution">
          <div class="kicker">Jumla Uliyochanga</div>
          <strong>${money(d.myTotalPaid)}</strong>
        </div>
      </section>
      <h3 class="studio-section-title">Hatua za haraka</h3>
      <nav class="overview-actions" aria-label="Hatua za haraka">
        <button type="button" data-overview-page="account">${IC.coin}<span>Akaunti yangu</span></button>
        <button type="button" data-overview-page="card">${IC.id}<span>Kitambulisho</span></button>
        <button type="button" data-overview-page="events">${IC.cal}<span>Matukio</span></button>
        <button type="button" data-overview-page="notifications">${IC.bell}<span>Arifa</span></button>
      </nav>

      <h3 class="studio-section-title">Muhtasari wa jumuiya</h3>
      <div class="stats">
        <div class="stat">
          <div class="stat-top">
            <div class="stat-icon">${IC.users}</div>
            <span class="stat-trend">Hai</span>
          </div>
          <div class="stat-label">Wanachama Hai</div>
          <div class="val">${d.stats.members}</div>
          <div class="stat-desc">Walioidhinishwa kwenye kanda zote</div>
        </div>
        <div class="stat">
          <div class="stat-top">
            <div class="stat-icon amber">${IC.clock}</div>
            <span class="stat-trend warn">${d.stats.pending > 0 ? "Inahitaji hatua" : "Safi"}</span>
          </div>
          <div class="stat-label">Inasubiri Idhini</div>
          <div class="val">${d.stats.pending}</div>
          <div class="stat-desc">Maombi mapya ya uanachama</div>
        </div>
        <div class="stat">
          <div class="stat-top">
            <div class="stat-icon green">${IC.coin}</div>
            <span class="stat-trend">Miamala</span>
          </div>
          <div class="stat-label">Malipo Yote</div>
          <div class="val">${d.stats.payments}</div>
          <div class="stat-desc">Michango iliyorekodiwa</div>
        </div>
        <div class="stat">
          <div class="stat-top">
            <div class="stat-icon">${IC.cal}</div>
            <span class="stat-trend neutral">Ratiba</span>
          </div>
          <div class="stat-label">Matukio</div>
          <div class="val">${d.stats.events}</div>
          <div class="stat-desc">Sherehe, mikutano na misiba</div>
        </div>
      </div>

      ${fin ? `
      <h3 class="studio-section-title">Fedha za jumuiya</h3>
      <div class="stats studio-finance">
        <div class="stat">
          <div class="stat-top">
            <div class="stat-icon green">${IC.coin}</div>
            <span class="stat-trend">+ Mapato</span>
          </div>
          <div class="stat-label">Mapato Yote</div>
          <div class="val">${money(fin.mapato)}</div>
          <div class="stat-desc">Michango + mapato ya ziada</div>
        </div>
        <div class="stat">
          <div class="stat-top">
            <div class="stat-icon red">${IC.file}</div>
            <span class="stat-trend danger">- Matumizi</span>
          </div>
          <div class="stat-label">Matumizi</div>
          <div class="val">${money(fin.matumizi)}</div>
          <div class="stat-desc">Misaada na uendeshaji wa ofisi</div>
        </div>
        <div class="stat">
          <div class="stat-top">
            <div class="stat-icon">${IC.bank}</div>
            <span class="stat-trend">Salio</span>
          </div>
          <div class="stat-label">Salio halisi</div>
          <div class="val">${money(fin.balance)}</div>
          <div class="stat-desc">Fedha iliyopo mkononi / benki</div>
        </div>
        <div class="stat">
          <div class="stat-top">
            <div class="stat-icon amber">${IC.bell}</div>
            <span class="stat-trend warn">${fin.debtors} wanadaiwa</span>
          </div>
          <div class="stat-label">Madeni ya Ada</div>
          <div class="val">${money(fin.totalDebt)}</div>
          <div class="stat-desc">Limbikizo la ada za kila mwezi</div>
        </div>
      </div>` : ""}

      <div class="split">
        <div class="card">
          <div class="card-head">
            <h3>${fin ? "Mlinganisho wa Mapato na Matumizi" : "Mgawanyo wa Wanachama kwa Kanda"}</h3>
            ${fin ? `<strong class="studio-balance">Salio halisi · ${money(fin.balance)}</strong>` : ""}
          </div>
          <div id="financeApexChart" style="min-height:260px"></div>
        </div>
        <div class="card">
          <div class="card-head">
            <h3>Kanda za Wanachama</h3>
            <span class="muted">${(d.regions || []).length} kanda</span>
          </div>
          ${(d.regions || []).map(r => `
            <div class="bar-row">
              <span><b>${r.name}</b><em>${r.value}</em></span>
              <div class="track"><i style="width:${Math.round(r.value / max * 100)}%"></i></div>
            </div>`).join("") || `<div class="empty-state">Hakuna data ya kanda bado</div>`}
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <h3>Malipo ya Hivi Karibuni</h3>
          <button class="btn btn-sm ghost" type="button" onclick="load('payments')">Tazama yote →</button>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Jina la Mwanachama</th><th>Aina ya Mchango</th><th>Kiasi</th><th>Hali</th></tr></thead>
            <tbody>
              ${(d.recent || []).map(x => `
                <tr>
                  <td><strong>${x.userName || "Mwanachama"}</strong></td>
                  <td>${escapeHtml(x.type)}</td>
                  <td style="font-variant-numeric:tabular-nums;font-weight:600">${money(x.amount)}</td>
                  <td><span class="badge ${x.status === "APPROVED" ? "badge-approved" : "badge-pending"}">${x.status === "APPROVED" ? "Imeidhinishwa" : "Inasubiri"}</span></td>
                </tr>`).join("") || `<tr><td colspan="4" class="muted" style="text-align:center;padding:24px">Hakuna malipo yaliyorekodiwa bado</td></tr>`}
            </tbody>
          </table>
        </div>
      </div></div>`;

    if (window.ApexCharts) {
      const base = apexBaseOptions();
      if (fin) {
        new ApexCharts(document.querySelector("#financeApexChart"), {
          ...base,
          chart: { ...base.chart, type: "bar", height: 245, animations: { enabled: !matchMedia("(prefers-reduced-motion: reduce)").matches } },
          series: [{ name: "Kiasi", data: [fin.mapato || 0, fin.matumizi || 0] }],
          xaxis: { ...base.xaxis, categories: ["Mapato", "Matumizi"] },
          colors: ["#f3a675", "#949da8"],
          plotOptions: { bar: { horizontal: true, distributed: true, borderRadius: 8, barHeight: "45%" } },
          legend: { show: false },
          tooltip: { y: { formatter: money } }
        }).render();
      } else {
        const regList = d.regions || [];
        new ApexCharts(document.querySelector("#financeApexChart"), {
          ...base,
          chart: { ...base.chart, type: "bar", height: 270 },
          series: [{ name: "Wanachama Hai", data: regList.map(r => r.value) }],
          colors: ["#F97316"],
          plotOptions: { bar: { borderRadius: 8, columnWidth: "44%" } },
          xaxis: { ...base.xaxis, categories: regList.map(r => r.name) }
        }).render();
      }
    }
    c.querySelectorAll("[data-overview-page]").forEach(button => {
      button.onclick = () => {
        load(button.dataset.overviewPage);
        c.focus();
      };
    });
  }

  if (p === "members") {
    const m = await api("/api/members");
    window.__members = m;
    c.innerHTML = `<div class="card" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
      <input id="memberSearch" placeholder="Tafuta jina, simu, kanda au Namba ya uanachama..." style="flex:1;min-width:220px">
      <span class="badge badge-active">${m.length} wanachama</span>
    </div>
    <div id="memberGrid" class="member-grid"></div>`;
    const render = (list) => {
      document.getElementById("memberGrid").innerHTML = list.map(x => {
        const ini = (x.name || "?").split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase();
        const wa = x.phone ? `https://wa.me/255${x.phone.replace(/^0/, "")}` : "#";
        return `<div class="member-card">
          <div class="avatar">${ini}</div>
          <div class="member-info">
            <strong>${x.name}</strong>
            <div class="muted">${x.wfcId || "—"} · ${x.region || ""}</div>
            <div class="muted">${x.phone || ""}</div>
          </div>
          <span class="badge ${x.status === "ACTIVE" ? "badge-active" : x.status === "SUSPENDED" ? "badge-suspended" : "badge-pending"}">${x.status === "ACTIVE" ? "Hai" : x.status === "SUSPENDED" ? "Imesimamishwa" : "Inasubiri"}</span>
          <div class="member-actions">
            <a class="btn btn-sm ghost" href="${wa}" target="_blank">WhatsApp</a>
            <button class="btn btn-sm ghost" onclick="sendMsg('${x.phone}','${x.name}')">Ujumbe</button>
            ${x.status === "PENDING" ? `<button class="btn btn-sm" onclick="approve('${x.id}')">Idhinisha</button>` : ""}
            ${x.status === "ACTIVE" ? `<button class="btn btn-sm ghost" onclick="suspendMember('${x.id}')">Simamisha</button>` : ""}
            <button class="btn btn-sm danger-ghost" onclick="removeMember('${x.id}')">Ondoa</button>
          </div>
        </div>`;
      }).join("") || `<div class="empty-state" style="grid-column:1/-1">Hakuna mwanachama aliyepatikana</div>`;
    };
    render(m);
    document.getElementById("memberSearch").oninput = e => {
      const q = e.target.value.toLowerCase();
      render(m.filter(x => (x.name || "").toLowerCase().includes(q) || (x.phone || "").includes(q) || (x.region || "").toLowerCase().includes(q) || (x.wfcId || "").toLowerCase().includes(q)));
    };
  }

  if (p === "payments" || p === "account") {
    const account = p === "account" ? await api("/api/my-account") : null;
    const list = account ? account.payments : await api("/api/payments");
    if (!Array.isArray(list)) {
      c.textContent = "Taarifa za malipo hazikupatikana.";
      return;
    }
    const canApprove = !account && canReviewPayments(window.__me.role);
    const awaitingReview = canApprove ? list.filter(payment => payment.status === "PENDING").length : 0;
    if (canApprove) list.sort((a, b) => Number(b.status === "PENDING") - Number(a.status === "PENDING"));
    c.innerHTML = `${account ? `<section class="hero-band overview-hero"><div><h2>Akaunti yangu</h2>
      <p>${escapeHtml(account.user.name)} · ${escapeHtml(account.user.wfcId || "—")} · Mwanachama hai</p></div>
      <div class="hero-contribution"><span class="kicker">Salio la ada</span><strong>${formatTsh(account.debt)}</strong></div></section>
      <div class="stats">${[["Ada ya mwezi", account.monthly], ["Jumla ya ada inayotarajiwa", account.expected], ["Ada iliyothibitishwa", account.paid]].map(([label, value]) => `<div class="stat"><div class="stat-label">${label}</div><div class="val">${formatTsh(value)}</div></div>`).join("")}</div>` : ""}
      ${canApprove ? `<section class="card"><h3>Malipo yanayosubiri uhakiki</h3><p>${awaitingReview} miamala. Linganisha namba ya muamala na malipo yaliyopokelewa kabla ya kuidhinisha.</p></section>` : ""}
      <div class="card">
      <div class="card-head"><h3>Wasilisha Malipo Mapya</h3></div>
      <p class="payment-hint">${escapeHtml(paymentInstructions(groupProfile))}</p>
      <form id="pf">
        <div class="form-row-3">
          <div class="form-group"><label>Aina ya Mchango</label><select name="type"><option>Ada ya mwezi</option><option>Kiingilio</option><option>Dharura</option><option>Msiba</option></select></div>
          <div class="form-group"><label>Kiasi (TSh)</label><input name="amount" type="number" min="1" step="1" placeholder="10000" required></div>
          <div class="form-group"><label>Namba ya Muamala</label><input name="transactionId" placeholder="Mf. MP2608..." required></div>
        </div>
        <button class="btn btn-sm" type="submit">Wasilisha Malipo</button>
      </form>
    </div>
    <div class="card">
      <div class="card-head"><h3>Historia ya Michango</h3><span class="muted">${list.length} miamala</span></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Mwanachama</th><th>Aina</th><th>Kiasi</th><th>Muamala</th><th>Hali</th><th>Hatua</th></tr></thead>
          <tbody>
            ${list.map(x => `<tr>
              <td><strong>${escapeHtml(x.userName || "—")}</strong></td>
              <td>${x.type}</td>
              <td style="font-variant-numeric:tabular-nums;font-weight:600">TSh ${Number(x.amount || 0).toLocaleString()}</td>
              <td><code>${escapeHtml(x.transactionId)}</code></td>
              <td><span class="badge ${x.status === "APPROVED" ? "badge-approved" : "badge-pending"}">${x.status === "APPROVED" ? (x.receiptNo || "Imethibitishwa") : "Inasubiri"}</span></td>
              <td>${x.status === "APPROVED" ? `<button class="btn btn-sm ghost" data-receipt="${escapeHtml(x.id)}">Pakua risiti</button>` : canApprove ? `<button class="btn btn-sm" data-approve-payment="${escapeHtml(x.id)}">Idhinisha</button>` : "—"}</td>
            </tr>`).join("") || `<tr><td colspan="6" class="muted" style="text-align:center;padding:24px">Hakuna historia ya malipo</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>`;
    c.querySelectorAll("[data-receipt]").forEach(button => button.onclick = () => downloadReceipt(button.dataset.receipt));
    c.querySelectorAll("[data-approve-payment]").forEach(button => button.onclick = () => approvePay(button.dataset.approvePayment));
    document.getElementById("pf").onsubmit = async e => {
      e.preventDefault();
      const d = await api("/api/submit-payment", { method: "POST", body: Object.fromEntries(new FormData(e.target)) });
      if (d.error) alert(d.error); else load(p);
    };
  }

  if (p === "events") {
    const list = await api("/api/events");
    c.innerHTML = `<div class="card">
      <div class="card-head"><h3>Ongeza Tukio Jipya</h3></div>
      <form id="ef">
        <div class="form-row-2">
          <div class="form-group"><label>Aina ya Tukio</label><select name="type"><option>Msiba</option><option>Harusi</option><option>Festival</option><option>Tour</option></select></div>
          <div class="form-group"><label>Kichwa cha Tukio</label><input name="title" placeholder="Mf. Mkutano wa mwaka" required></div>
        </div>
        <div class="form-row-3">
          <div class="form-group"><label>Eneo</label><input name="location" placeholder="Moshi / Dar es Salaam"></div>
          <div class="form-group"><label>Bei ya Tiketi (TSh)</label><input name="ticketPrice" type="number" value="0"></div>
          <div class="form-group"><label>Poster (picha ≤ 1.2MB)</label><input id="posterFile" type="file" accept="image/*"></div>
        </div>
        <button class="btn btn-sm" type="submit">Chapisha Tukio</button>
      </form>
    </div>
    <div class="card">
      <div class="card-head"><h3>Orodha ya Matukio</h3><span class="muted">${list.length} matukio</span></div>
      ${list.map(e => `<div class="list-row">
        <div><strong>${e.title}</strong> <span class="badge badge-pending">${e.type}</span><div class="muted">${e.location || "Eneo halijawekwa"}</div></div>
        <div style="font-weight:700;font-variant-numeric:tabular-nums">TSh ${(e.ticketPrice || 0).toLocaleString()}</div>
      </div>`).join("") || `<div class="empty-state">Hakuna matukio yaliyorekodiwa</div>`}
    </div>`;
    document.getElementById("ef").onsubmit = async e => {
      e.preventDefault();
      const body = Object.fromEntries(new FormData(e.target));
      const file = document.getElementById("posterFile").files[0];
      if (file) {
        if (file.size > 1200000) { alert("Picha ni kubwa. Tumia chini ya 1.2 MB."); return; }
        body.poster = await new Promise(resolve => { const r = new FileReader(); r.onload = () => resolve(r.result); r.readAsDataURL(file); });
      }
      await api("/api/events", { method: "POST", body });
      load("events");
    };
  }

  if (p === "announcements") {
    const list = await api("/api/announcements");
    c.innerHTML = `<div class="card">
      <div class="card-head"><h3>Tangazo Jipya</h3></div>
      <form id="af">
        <div class="form-row-2">
          <div class="form-group"><label>Kichwa</label><input name="title" required></div>
          <div class="form-group"><label>Kiungo (hiari)</label><input name="link" placeholder="/#matukio au https://..."></div>
        </div>
        <div class="form-group"><label>Ujumbe</label><textarea name="body" rows="3" required></textarea></div>
        <button class="btn btn-sm" type="submit">Chapisha Tangazo</button>
      </form>
    </div>
    <div class="card">
      <div class="card-head"><h3>Matangazo Yaliyochapishwa</h3></div>
      ${list.map(a => `<div class="list-row" style="align-items:flex-start">
        <div>
          <strong>${a.title}</strong>
          <p style="margin:4px 0 6px;color:var(--text)">${a.body}</p>
          ${a.link ? `<a href="${a.link}" style="color:var(--brand-orange);font-size:.82rem;font-weight:600">${a.link} →</a>` : ""}
        </div>
        <span class="badge badge-active">${a.author || "Ofisi"}</span>
      </div>`).join("") || `<div class="empty-state">Hakuna matangazo</div>`}
    </div>`;
    document.getElementById("af").onsubmit = async e => {
      e.preventDefault();
      const d = await api("/api/announcements", { method: "POST", body: Object.fromEntries(new FormData(e.target)) });
      if (d.error) alert(d.error); else load("announcements");
    };
  }

  if (p === "card") {
    const d = await api("/api/dashboard");
    c.innerHTML = `<div class="card idcard" style="margin:0 auto;text-align:center">
      ${groupLogo()}
      <h2>Kitambulisho cha ${escapeHtml(groupProfile.name)}</h2>
      <p style="font-size:1.35rem;margin:6px 0 2px;color:var(--ink)"><strong>${d.user.name}</strong></p>
      <p style="font-weight:700;color:var(--brand-orange);margin:0 0 6px">${d.user.wfcId || "Inasubiri idhini"}</p>
      <p class="muted" style="margin:0 0 8px">${d.user.region || "Tanzania"} · <span class="badge badge-active">${d.user.status}</span></p>
      <img id="qrc" class="qr" alt="QR Code">
      <button class="btn" onclick="window.print()">Pakua / Chapisha Kitambulisho</button>
    </div>`;
    if (window.QRCode) QRCode.toDataURL(d.user.wfcId || d.user.name, { margin: 1, width: 180 }).then(url => { const img = document.getElementById("qrc"); if (img) img.src = url; });
  }

  if (p === "family") {
    const f = await api("/api/family");
    c.innerHTML = `<div class="card">
      <div class="card-head"><h3>Taarifa za Familia</h3><span class="kicker">Kumbukumbu za Ukoo</span></div>
      <form id="ff">
        <div class="form-row-2">
          <div class="form-group"><label>Mkuu wa Familia</label><input name="head" value="${f.head || ""}"></div>
          <div class="form-group"><label>Mke / Mume</label><input name="spouse" value="${f.spouse || ""}"></div>
        </div>
        <div class="form-group"><label>Watoto (tenganisha kwa koma)</label><input name="children" value="${(f.children || []).join(", ")}" placeholder="Mf. Nuru, Eli, Imani"></div>
        <button class="btn btn-sm" type="submit">Hifadhi Taarifa</button>
      </form>
    </div>`;
    document.getElementById("ff").onsubmit = async e => {
      e.preventDefault();
      const o = Object.fromEntries(new FormData(e.target));
      o.children = o.children.split(",").map(s => s.trim()).filter(Boolean);
      await api("/api/family", { method: "POST", body: o });
      alert("Taarifa za familia zimehifadhiwa");
    };
  }

  if (p === "directory") {
    const list = await api("/api/directory");
    c.innerHTML = `<div class="card">
      <div class="card-head"><h3>Sasisha Taaluma Yako</h3></div>
      <form id="df" style="display:flex;gap:10px;flex-wrap:wrap;align-items:end">
        <div class="form-group" style="flex:1;min-width:220px;margin:0"><label>Taaluma / Kazi</label><input name="profession" placeholder="Mf. Mhandisi, Daktari, Mhasibu"></div>
        <button class="btn btn-sm" type="submit">Hifadhi</button>
      </form>
    </div>
    <div class="card">
      <div class="card-head"><h3>Directory ya Wanachama</h3><span class="muted">${list.length} wataalamu</span></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Jina</th><th>Taaluma</th><th>Kanda</th></tr></thead>
          <tbody>${list.map(x => `<tr><td><strong>${x.name}</strong></td><td>${x.profession}</td><td>${x.region}</td></tr>`).join("") || `<tr><td colspan="3" class="muted" style="text-align:center;padding:20px">Hakuna taarifa bado</td></tr>`}</tbody>
        </table>
      </div>
    </div>`;
    document.getElementById("df").onsubmit = async e => { e.preventDefault(); await api("/api/my-profession", { method: "POST", body: Object.fromEntries(new FormData(e.target)) }); load("directory"); };
  }

  if (p === "help") {
    const list = await api("/api/support");
    c.innerHTML = `<div class="card">
      <div class="card-head"><h3>Omba Msaada wa Ofisi</h3></div>
      <form id="hf">
        <div class="form-group"><label>Mada</label><input name="subject" required></div>
        <div class="form-group"><label>Maelezo ya Ujumbe</label><textarea name="message" rows="3" required></textarea></div>
        <button class="btn btn-sm" type="submit">Wasilisha Ombi</button>
      </form>
    </div>
    <div class="card">
      <div class="card-head"><h3>Maombi Yako</h3></div>
      ${list.map(t => `<div class="list-row"><div><strong>${t.subject}</strong><div class="muted">${t.message || ""}</div></div><span class="badge badge-pending">${t.status}</span></div>`).join("") || `<div class="empty-state">Hakuna maombi ya msaada</div>`}
    </div>`;
    document.getElementById("hf").onsubmit = async e => { e.preventDefault(); await api("/api/support", { method: "POST", body: Object.fromEntries(new FormData(e.target)) }); load("help"); };
  }

  if (p === "attendance") {
    const list = await api("/api/attendance");
    c.innerHTML = `<div class="card">
      <div class="card-head"><h3>Thibitisha Mahudhurio</h3></div>
      <form id="af" style="display:flex;gap:10px;flex-wrap:wrap;align-items:end">
        <div class="form-group" style="flex:1;min-width:220px;margin:0"><label>Jina la Mkutano</label><input name="meeting" value="Mkutano Mkuu"></div>
        <button class="btn btn-sm" type="submit">Saini Mahudhurio (Nipo)</button>
      </form>
    </div>
    <div class="card">
      <div class="card-head"><h3>Orodha ya Waliohudhuria</h3><span class="muted">${list.length}</span></div>
      ${list.map(a => `<div class="list-row"><strong>${a.userName}</strong><span class="badge badge-active">${a.meeting}</span></div>`).join("") || `<div class="empty-state">Hakuna mahudhurio bado</div>`}
    </div>`;
    document.getElementById("af").onsubmit = async e => { e.preventDefault(); await api("/api/attendance", { method: "POST", body: Object.fromEntries(new FormData(e.target)) }); load("attendance"); };
  }

  if (p === "elections") {
    const list = await api("/api/elections");
    c.innerHTML = `<div class="card">
      <div class="card-head"><h3>Fungua Nafasi ya Uchaguzi</h3></div>
      <form id="ef" style="display:flex;gap:10px;flex-wrap:wrap;align-items:end">
        <div class="form-group" style="flex:1;min-width:220px;margin:0"><label>Nafasi ya Uongozi</label><input name="position" placeholder="Mf. Mwenyekiti wa Kanda" required></div>
        <button class="btn btn-sm" type="submit">Fungua Uchaguzi</button>
      </form>
    </div>
    <div class="card">
      <div class="card-head"><h3>Chaguzi Zinazoendelea</h3></div>
      ${list.map(e => `<div class="list-row">
        <div><strong>${e.position}</strong><div class="muted">Wagombea: ${e.candidates.length} · Kura zilizopigwa: ${e.votes.length}</div></div>
        <span class="badge badge-active">${e.status}</span>
      </div>`).join("") || `<div class="empty-state">Hakuna uchaguzi uliowekwa</div>`}
    </div>`;
    document.getElementById("ef").onsubmit = async e => { e.preventDefault(); await api("/api/elections", { method: "POST", body: Object.fromEntries(new FormData(e.target)) }); load("elections"); };
  }

  if (p === "cases") {
    const list = await api("/api/cases");
    c.innerHTML = `<div class="card">
      <div class="card-head"><h3>Sajili Kesi / Shauri</h3></div>
      <form id="cf">
        <div class="form-group"><label>Mada ya Shauri</label><input name="title" required></div>
        <div class="form-group"><label>Maelezo Kamili</label><textarea name="description" rows="2"></textarea></div>
        <button class="btn btn-sm" type="submit">Wasilisha Shauri</button>
      </form>
    </div>
    <div class="card">
      <div class="card-head"><h3>Orodha ya Kesi</h3></div>
      ${list.map(x => `<div class="list-row"><div><strong>${x.title}</strong><div class="muted">${x.description || ""}</div></div><span class="badge badge-pending">${x.status}</span></div>`).join("") || `<div class="empty-state">Hakuna kesi zilizosajiliwa</div>`}
    </div>`;
    document.getElementById("cf").onsubmit = async e => { e.preventDefault(); await api("/api/cases", { method: "POST", body: Object.fromEntries(new FormData(e.target)) }); load("cases"); };
  }

  if (p === "saccos") {
    const d = await api("/api/saccos");
    c.innerHTML = `<div class="card">
      <div class="card-head"><h3>SACCOS — Nunua Hisa</h3></div>
      <form id="sf" style="display:flex;gap:10px;flex-wrap:wrap;align-items:end">
        <div class="form-group" style="flex:1;min-width:220px;margin:0"><label>Kiasi cha Hisa (TSh)</label><input name="amount" type="number" placeholder="50000" required></div>
        <button class="btn btn-sm" type="submit">Wasilisha Hisa</button>
      </form>
    </div>
    <div class="card">
      <div class="card-head"><h3>Kumbukumbu za Hisa</h3><span class="muted">${(d.shares || []).length} miamala</span></div>
      ${(d.shares || []).map(s => `<div class="list-row"><strong>Ununuzi wa Hisa</strong><span style="font-weight:700;color:var(--success-ink)">TSh ${Number(s.amount || 0).toLocaleString()}</span></div>`).join("") || `<div class="empty-state">Hakuna hisa zilizorekodiwa bado</div>`}
    </div>`;
    document.getElementById("sf").onsubmit = async e => { e.preventDefault(); await api("/api/saccos/shares", { method: "POST", body: Object.fromEntries(new FormData(e.target)) }); load("saccos"); };
  }

  if (p === "assets") {
    const list = await api("/api/assets");
    c.innerHTML = `<div class="card">
      <div class="card-head"><h3>Sajili Mali ya Jumuiya</h3></div>
      <form id="asf">
        <div class="form-row-3">
          <div class="form-group"><label>Jina la Mali</label><input name="name" required></div>
          <div class="form-group"><label>Thamani (TSh)</label><input name="value" type="number"></div>
          <div class="form-group"><label>Eneo Ilipo</label><input name="location"></div>
        </div>
        <button class="btn btn-sm" type="submit">Hifadhi Mali</button>
      </form>
    </div>
    <div class="card">
      <div class="card-head"><h3>Daftari la mali za kikundi</h3></div>
      ${list.map(a => `<div class="list-row"><div><strong>${a.name}</strong><div class="muted">${a.location || "—"}</div></div><strong>TSh ${(Number(a.value) || 0).toLocaleString()}</strong></div>`).join("") || `<div class="empty-state">Hakuna mali zilizosajiliwa</div>`}
    </div>`;
    document.getElementById("asf").onsubmit = async e => { e.preventDefault(); await api("/api/assets", { method: "POST", body: Object.fromEntries(new FormData(e.target)) }); load("assets"); };
  }

  if (p === "projects") {
    const list = await api("/api/projects");
    c.innerHTML = `<div class="card">
      <div class="card-head"><h3>Ongeza Mradi wa Maendeleo</h3></div>
      <form id="prf">
        <div class="form-row-2">
          <div class="form-group"><label>Jina la Mradi</label><input name="name" placeholder="Mf. Mradi wa akiba" required></div>
          <div class="form-group"><label>Maendeleo (%)</label><input name="progress" type="number" value="0" min="0" max="100"></div>
        </div>
        <button class="btn btn-sm" type="submit">Hifadhi Mradi</button>
      </form>
    </div>
    <div class="card">
      <div class="card-head"><h3>Miradi ya Jumuiya</h3></div>
      ${list.map(pr => `<div class="bar-row"><span><b>${pr.name}</b><em>${pr.progress || 0}%</em></span><div class="track"><i style="width:${Math.min(100, Number(pr.progress) || 0)}%"></i></div></div>`).join("") || `<div class="empty-state">Hakuna miradi iliyowekwa</div>`}
    </div>`;
    document.getElementById("prf").onsubmit = async e => { e.preventDefault(); await api("/api/projects", { method: "POST", body: Object.fromEntries(new FormData(e.target)) }); load("projects"); };
  }

  if (p === "penalties") {
    const list = await api("/api/penalties");
    c.innerHTML = `<div class="card">
      <div class="card-head"><h3>Rekodi Faini</h3></div>
      <form id="penf">
        <div class="form-row-2">
          <div class="form-group"><label>Sababu ya Faini</label><input name="reason" required></div>
          <div class="form-group"><label>Kiasi (TSh)</label><input name="amount" type="number" required></div>
        </div>
        <button class="btn btn-sm" type="submit">Hifadhi Faini</button>
      </form>
    </div>
    <div class="card">
      <div class="card-head"><h3>Orodha ya Faini</h3></div>
      ${list.map(x => `<div class="list-row"><strong>${x.reason}</strong><span class="badge badge-suspended">TSh ${Number(x.amount || 0).toLocaleString()}</span></div>`).join("") || `<div class="empty-state">Hakuna faini zilizorekodiwa</div>`}
    </div>`;
    document.getElementById("penf").onsubmit = async e => { e.preventDefault(); await api("/api/penalties", { method: "POST", body: Object.fromEntries(new FormData(e.target)) }); load("penalties"); };
  }

  if (p === "documents") {
    const list = await api("/api/documents");
    const constitution = list.find(d => (d.title || "").toLowerCase().includes("katiba")) || { title: "Katiba ya kikundi", url: "#", summary: "Sheria, kanuni na misingi ya kikundi." };
    c.innerHTML = `<div class="hero-band">
      <div>
        <span class="kicker">Nyaraka Kuu</span>
        <h2 style="font-size:1.3rem">${constitution.title}</h2>
        <p>${constitution.summary || "Soma katiba ili ujue haki na wajibu wako kama mwanachama."}</p>
      </div>
      <a class="btn btn-sm" href="${constitution.url || "#"}" target="_blank">Soma Katiba →</a>
    </div>
    <div class="card">
      <div class="card-head"><h3>Maktaba ya Nyaraka</h3></div>
      <div class="doc-list">${list.filter(d => d !== constitution).map(d => `<div class="doc-item"><strong>${d.title}</strong><div class="muted" style="margin:4px 0">${d.summary || ""}</div><a href="${d.url || "#"}" target="_blank" style="color:var(--brand-orange);font-weight:600;font-size:.84rem">Fungua nyaraka →</a></div>`).join("") || `<div class="empty-state">Hakuna nyaraka nyingine</div>`}</div>
    </div>
    <div class="card">
      <div class="card-head"><h3>Ongeza Nyaraka Mpya</h3></div>
      <form id="docf">
        <div class="form-row-2">
          <div class="form-group"><label>Jina la Nyaraka</label><input name="title" required></div>
          <div class="form-group"><label>Kiungo (URL)</label><input name="url" placeholder="https://..."></div>
        </div>
        <div class="form-group"><label>Maelezo mafupi</label><input name="summary"></div>
        <button class="btn btn-sm" type="submit">Hifadhi Nyaraka</button>
      </form>
    </div>`;
    document.getElementById("docf").onsubmit = async e => { e.preventDefault(); await api("/api/documents", { method: "POST", body: Object.fromEntries(new FormData(e.target)) }); load("documents"); };
  }

  if (p === "pending") {
    const m = await api("/api/members");
    const pen = m.filter(x => x.status === "PENDING");
    c.innerHTML = `<div class="card">
      <div class="card-head"><h3>Maombi Yanayosubiri Idhini</h3><span class="badge badge-pending">${pen.length} wanasubiri</span></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Jina</th><th>Simu</th><th>Kanda</th><th>Muamala wa usajili</th><th>Hatua</th></tr></thead>
          <tbody>
            ${pen.map(x => `<tr><td><strong>${escapeHtml(x.name)}</strong></td><td>${escapeHtml(x.phone)}</td><td>${escapeHtml(x.region)}</td><td>${escapeHtml(x.paymentProof || "—")}</td><td><button class="btn btn-sm" onclick="approve('${x.id}')">Idhinisha Mwanachama</button></td></tr>`).join("") || `<tr><td colspan="5" class="muted" style="text-align:center;padding:24px">Hakuna maombi yanayosubiri</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>`;
  }

  if (p === "charts") {
    const d = await api("/api/analytics");
    const regions = d.regions || [];
    const types = d.types || [];
    c.innerHTML = `<div class="split" style="grid-template-columns:1fr 1fr">
      <div class="card">
        <div class="card-head"><h3>Wanachama kwa Kanda</h3><span class="badge badge-approved">Kanda</span></div>
        <div id="regionsApexChart" style="min-height:300px"></div>
      </div>
      <div class="card">
        <div class="card-head"><h3>Makusanyo kwa Aina (TSh)</h3><span class="badge badge-pending">Mapato</span></div>
        <div id="typesApexChart" style="min-height:300px"></div>
      </div>
    </div>`;
    if (window.ApexCharts) {
      const base = apexBaseOptions();
      new ApexCharts(document.querySelector("#regionsApexChart"), {
        ...base,
        chart: { ...base.chart, type: "bar", height: 300 },
        series: [{ name: "Wanachama", data: regions.map(r => r.value) }],
        colors: ["#F97316"],
        plotOptions: { bar: { borderRadius: 8, columnWidth: "46%" } },
        xaxis: { ...base.xaxis, categories: regions.map(r => r.name) }
      }).render();

      new ApexCharts(document.querySelector("#typesApexChart"), {
        ...base,
        chart: { ...base.chart, type: "donut", height: 300 },
        series: types.map(t => Number(t.value) || 0),
        labels: types.map(t => t.name),
        colors: ["#F97316", "#22C55E", "#111827", "#FB923C"],
        plotOptions: { pie: { donut: { size: "66%" } } }
      }).render();
    }
  }

  if (p === "messages") {
    const members = await api("/api/members");
    const box = await api("/api/outbox");
    c.innerHTML = `<div class="card">
      <div class="card-head"><h3>Tuma Ujumbe kwa Mwanachama</h3></div>
      <form id="mf">
        <div class="form-row-2">
          <div class="form-group"><label>Kituo cha Mawasiliano</label><select name="channel"><option value="sms">SMS</option><option value="whatsapp">WhatsApp</option><option value="email">Barua pepe</option></select></div>
          <div class="form-group"><label>Mpokeaji</label><select name="to">${members.map(m => `<option value="${m.phone}">${m.name} · ${m.phone}</option>`).join("")}</select></div>
        </div>
        <div class="form-group"><label>Kichwa</label><input name="title" required></div>
        <div class="form-group"><label>Ujumbe</label><textarea name="body" rows="3" required></textarea></div>
        <button class="btn btn-sm" type="submit">Tuma Ujumbe</button>
      </form>
      <p class="muted" style="margin-top:10px">Bila funguo za API, WhatsApp inafunguliwa moja kwa moja na barua pepe inafungua programu yako.</p>
    </div>
    <div class="card">
      <div class="card-head"><h3>Kumbukumbu za Ujumbe (Outbox)</h3></div>
      ${(box || []).map(n => `<div class="list-row"><div><strong>${n.channel.toUpperCase()}</strong> → ${n.to}<div class="muted">${n.body || ""}</div><small class="muted">${n.detail || ""}</small></div><span class="badge badge-approved">${n.status}</span></div>`).join("") || `<div class="empty-state">Hakuna ujumbe uliotumwa</div>`}
    </div>`;
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
    c.innerHTML = `<div class="card">
      <div class="card-head"><h3>Omba Malipo ya Simu (STK Push)</h3></div>
      <form id="sk">
        <div class="form-row-2">
          <div class="form-group"><label>Namba ya Simu</label><input name="phone" placeholder="07XX XXX XXX" required></div>
          <div class="form-group"><label>Kiasi (TSh)</label><input name="amount" type="number" required></div>
        </div>
        <button class="btn btn-sm" type="submit">Tuma Ombi la STK</button>
      </form>
      <div id="skm" class="muted" style="margin-top:10px"></div>
      <div class="payment-hint" style="margin-top:14px">
        ${escapeHtml(paymentInstructions(groupProfile))}
      </div>
    </div>
    <div class="card">
      <div class="card-head"><h3>Weka Namba ya Muamala</h3></div>
      <form id="cf">
        <div class="form-row-3">
          <div class="form-group"><label>Aina</label><select name="type"><option>Ada ya mwezi</option><option>Kiingilio</option><option>Dharura</option></select></div>
          <div class="form-group"><label>Kiasi (TSh)</label><input name="amount" type="number" required></div>
          <div class="form-group"><label>Namba ya Muamala</label><input name="transactionId" required></div>
        </div>
        <button class="btn btn-sm" type="submit">Wasilisha kwa Idhini</button>
      </form>
    </div>`;
    document.getElementById("sk").onsubmit = async e => { e.preventDefault(); const d = await api("/api/stk", { method: "POST", body: Object.fromEntries(new FormData(e.target)) }); document.getElementById("skm").textContent = d.detail || ""; };
    document.getElementById("cf").onsubmit = async e => { e.preventDefault(); const d = await api("/api/submit-payment", { method: "POST", body: Object.fromEntries(new FormData(e.target)) }); if (d.error) alert(d.error); else load("payments"); };
  }

  if (p === "reports") {
    const report = await api("/api/group-reports");
    if (report.error) { c.textContent = report.error; return; }
    const sections = [
      { title: "Michango iliyoidhinishwa", file: "michango.csv", fields: ["Mwanachama", "Aina", "Kiasi (TSh)", "Risiti", "Tarehe"],
        rows: report.payments.map(row => [row.userName, row.type, row.amount, row.receiptNo, row.approvedAt || row.createdAt]) },
      { title: "Madeni ya ada", file: "madeni.csv", fields: ["Mwanachama", "Namba ya uanachama", "Ada (TSh)", "Iliyolipwa (TSh)", "Deni (TSh)"],
        rows: report.debts.map(row => [row.name, row.memberNumber, row.expected, row.paid, row.debt]) },
      { title: "Historia ya idhini", file: "historia-ya-idhini.csv", fields: ["Aina", "Rejea", "Aliyeidhinisha", "Tarehe"],
        rows: report.approvals.map(row => [row.category, row.subject, row.actor, row.date]) }
    ];
    c.innerHTML = sections.map(({title, fields, rows}, index) => `<section class="card">
      <div class="card-head"><h3>${title}</h3><button class="btn btn-sm ghost" data-export="${index}">Pakua CSV</button></div>
      <div class="table-wrap"><table><thead><tr>${fields.map(field => `<th>${field}</th>`).join("")}</tr></thead>
      <tbody>${rows.map(row => `<tr>${row.map(value => `<td>${escapeHtml(value ?? "—")}</td>`).join("")}</tr>`).join("") || `<tr><td colspan="${fields.length}">Hakuna rekodi bado.</td></tr>`}</tbody></table></div>
    </section>`).join("");
    c.querySelectorAll("[data-export]").forEach(button => {
      const {file, fields, rows} = sections[Number(button.dataset.export)];
      button.onclick = () => downloadReport(file, fields, rows);
    });
  }

  if (p === "settings") {
    if (window.__me.role !== "ADMIN") {
      c.textContent = "Mipangilio hii ni ya msimamizi wa kikundi.";
      return;
    }
    const d = await api("/api/dashboard");
    const s = d.settings || {};
    const group = groupProfile;
    const field = (name, label, value, limit) => `<div class="form-group"><label for="group-${name}">${label}</label><input id="group-${name}" name="${name}" value="${escapeHtml(value)}" maxlength="${limit}"></div>`;
    c.innerHTML = `<section class="card">
      <div class="card-head"><h3>Mipangilio ya kikundi</h3></div>
      <form id="groupForm">
        <p id="setupStep" class="muted" aria-live="polite"></p>
        <fieldset data-setup-step><legend>Utambulisho</legend>
        <div class="form-row-2">
          ${field("name", "Jina la kikundi", group.name, 80)}
          ${field("shortName", "Kifupi cha jina", group.shortName, 12)}
          ${field("slogan", "Kaulimbiu", group.slogan, 120)}
          ${field("phone", "Simu ya mawasiliano", group.phone, 40)}
        </div>
        <div class="form-group"><label for="group-description">Maelezo ya kikundi</label><textarea id="group-description" name="description" maxlength="600" rows="3">${escapeHtml(group.description)}</textarea></div>
        <div class="form-row-2">
          <div class="form-group"><label for="group-logo">Nembo (PNG, JPG au WebP, KB 500)</label><input id="group-logo" type="file" accept="image/png,image/jpeg,image/webp"></div>
          <label class="group-check"><input name="removeLogo" type="checkbox"> Ondoa nembo iliyopo</label>
        </div>
        </fieldset>
        <fieldset data-setup-step hidden><legend>Kanuni na ada</legend>
        <div class="form-group"><label for="group-rules">Kanuni na taratibu</label><textarea id="group-rules" name="rules" maxlength="12000" rows="5">${escapeHtml(group.rules)}</textarea></div>
        <div class="form-row-2">
          <div class="form-group"><label for="group-registrationFee">Ada ya usajili (TSh)</label><input id="group-registrationFee" name="registrationFee" type="number" min="0" max="1000000000" value="${group.registrationFee}" required></div>
          <div class="form-group"><label for="group-monthlyFee">Ada ya mwezi (TSh)</label><input id="group-monthlyFee" name="monthlyFee" type="number" min="0" max="1000000000" value="${group.monthlyFee}" required></div>
        </div>
        <div class="form-row-2">${Object.entries(paymentLabels).map(([key, label]) => field(key, label, group.paymentNumbers[key], 40)).join("")}</div>
        </fieldset>
        <fieldset data-setup-step hidden><legend>Vipengele na mwaliko</legend>
          <p class="muted">Chagua vipengele vinavyotumika kwenye kikundi hiki.</p>
          <div class="form-row-2">${Object.entries(groupModules).map(([key,label]) => `<label class="group-check"><input type="checkbox" name="module-${key}" ${group.modules?.[key] !== false ? "checked" : ""}> ${label}</label>`).join("")}</div>
          <div class="form-group"><label for="groupInvite">Kiungo cha kuwaalika wanachama</label><input id="groupInvite" value="${escapeHtml(location.origin + "/app#register")}" readonly></div>
          <button class="btn ghost" id="copyInvite" type="button">Nakili kiungo</button>
        </fieldset>
        <div class="btn-row">
          <button class="btn ghost" id="setupBack" type="button">Rudi</button>
          <button class="btn" id="setupNext" type="button">Endelea</button>
          <button class="btn" type="submit" hidden>Hifadhi mipangilio ya kikundi</button>
        </div><p id="groupResult" role="status"></p>
      </form>
    </section>
    <div class="card">
      <div class="card-head"><h3>Funguo za Huduma (API Integrations)</h3></div>
      <form id="sf">
        <div class="form-row-2">
          <div class="form-group"><label>Africa's Talking Username</label><input name="smsUsername" value="${escapeHtml(s.smsUsername || "")}"></div>
          <div class="form-group"><label>SMS API Key</label><input name="smsKey" value="${escapeHtml(s.smsKey || "")}"></div>
        </div>
        <div class="form-row-2">
          <div class="form-group"><label>WhatsApp Token</label><input name="whatsappToken" value="${escapeHtml(s.whatsappToken || "")}"></div>
          <div class="form-group"><label>WhatsApp Phone ID</label><input name="whatsappPhoneId" value="${escapeHtml(s.whatsappPhoneId || "")}"></div>
        </div>
        <div class="form-row-3">
          <div class="form-group"><label>M-Pesa Consumer Key</label><input name="momoConsumerKey" value="${escapeHtml(s.momoConsumerKey || "")}"></div>
          <div class="form-group"><label>M-Pesa Consumer Secret</label><input name="momoConsumerSecret" value="${escapeHtml(s.momoConsumerSecret || "")}"></div>
          <div class="form-group"><label>Shortcode</label><input name="momoShortcode" value="${escapeHtml(s.momoShortcode || "")}"></div>
        </div>
        <button class="btn btn-sm" type="submit">Hifadhi Mipangilio</button>
      </form>
    </div>`;
    const groupForm = document.getElementById("groupForm");
    const steps = [...groupForm.querySelectorAll("[data-setup-step]")];
    const back = document.getElementById("setupBack");
    const next = document.getElementById("setupNext");
    let currentStep = 0;
    const showStep = index => {
      currentStep = index;
      steps.forEach((step, i) => step.hidden = i !== index);
      document.getElementById("setupStep").textContent = `Hatua ${index + 1} kati ya ${steps.length}`;
      back.hidden = index === 0;
      next.hidden = index === steps.length - 1;
      groupForm.querySelector("button[type=submit]").hidden = !next.hidden;
    };
    back.onclick = () => showStep(currentStep - 1);
    next.onclick = () => {
      const invalid = steps[currentStep].querySelector(":invalid");
      if (invalid) invalid.reportValidity();
      else showStep(currentStep + 1);
    };
    document.getElementById("copyInvite").onclick = async () => {
      const invite = document.getElementById("groupInvite");
      try {
        await navigator.clipboard.writeText(invite.value);
        document.getElementById("groupResult").textContent = "Kiungo kimenakiliwa.";
      } catch {
        invite.select();
        document.getElementById("groupResult").textContent = "Nakili kiungo kilichochaguliwa.";
      }
    };
    showStep(0);
    document.getElementById("groupForm").onsubmit = async event => {
      event.preventDefault();
      if (currentStep !== steps.length - 1) { next.click(); return; }
      const form = event.currentTarget;
      const submit = form.querySelector("button[type=submit]");
      const result = document.getElementById("groupResult");
      submit.disabled = true;
      try {
        const body = Object.fromEntries(new FormData(form));
        body.modules = Object.fromEntries(Object.keys(groupModules).map(key => [key, Boolean(body["module-" + key])]));
        body.removeLogo = Boolean(body.removeLogo);
        const file = document.getElementById("group-logo").files[0];
        if (file) {
          if (file.size > 512000) throw new Error("Nembo isizidi KB 500.");
          body.logo = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error("Nembo haijasomwa."));
            reader.readAsDataURL(file);
          });
        }
        const response = await api("/api/group", { method: "POST", body });
        if (!response.success) throw new Error(response.error || "Mipangilio haijahifadhiwa.");
        applyGroupProfile(response.group);
        await showDash();
        await load("settings");
        const nextStep = document.getElementById("setupNext");
        nextStep.click();
        nextStep.click();
        document.getElementById("groupResult").textContent = "Mipangilio ya kikundi imehifadhiwa.";
      } catch (error) {
        result.textContent = error.message;
      } finally {
        submit.disabled = false;
      }
    };
    document.getElementById("sf").onsubmit = async e => { e.preventDefault(); const r = await api("/api/settings", { method: "POST", body: Object.fromEntries(new FormData(e.target)) }); alert(r.error || "Mipangilio imehifadhiwa"); };
  }

  if (p === "roles") {
    const members = await api("/api/members");
    const roles = await api("/api/roles");
    const isAdmin = window.__me && window.__me.role === "ADMIN";
    c.innerHTML = `<div class="card">
      <div class="card-head"><h3>Usimamizi wa Viongozi (RBAC)</h3><span class="badge badge-active">${isAdmin ? "Admin Access" : "Tazama tu"}</span></div>
      <p class="muted" style="margin-bottom:14px">${isAdmin ? "Chagua mwanachama na umpe jukumu. Mabadiliko yanahifadhiwa mara moja." : "Admin pekee anaweza kubadilisha majukumu ya uongozi."}</p>
      <div class="form-group"><input id="roleSearch" placeholder="Tafuta jina au namba ya simu..."></div>
      <div id="roleList">${members.map(m => `
        <div class="role-row list-row" data-name="${m.name.toLowerCase()}" data-phone="${m.phone}">
          <div><strong>${m.name}</strong><div class="muted">${m.phone} · ${m.wfcId || "—"}</div></div>
          <div style="display:flex;gap:8px;align-items:center">
            ${isAdmin ? `<select class="role-select" data-id="${m.id}" style="width:auto">${roles.map(r => `<option ${r === m.role ? "selected" : ""}>${r}</option>`).join("")}</select><button class="btn btn-sm" data-save="${m.id}">Hifadhi</button>` : `<span class="badge badge-approved">${m.role}</span>`}
          </div>
        </div>`).join("")}</div>
    </div>`;
    const search = document.getElementById("roleSearch");
    if (search) search.oninput = () => {
      const q = search.value.toLowerCase();
      document.querySelectorAll(".role-row").forEach(row => {
        row.style.display = row.dataset.name.includes(q) || row.dataset.phone.includes(q) ? "" : "none";
      });
    };
    if (isAdmin) {
      document.querySelectorAll("[data-save]").forEach(btn => btn.onclick = async () => {
        const id = btn.dataset.save;
        const sel = document.querySelector(`.role-select[data-id="${id}"]`);
        const d = await api("/api/set-role", { method: "POST", body: { userId: id, role: sel.value } });
        alert(d.error || "Jukumu limehifadhiwa");
      });
    }
  }

  if (p === "notifications") {
    const list = await api("/api/notifications");
    c.innerHTML = `<div class="card">
      <div class="card-head"><h3>Tuma Taarifa kwa Wanachama</h3></div>
      <form id="nf">
        <div class="form-group"><label>Kichwa cha Taarifa</label><input name="title" required></div>
        <div class="form-group"><label>Ujumbe</label><textarea name="body" rows="3" required></textarea></div>
        <button class="btn btn-sm" type="submit">Tuma kwa Wote</button>
      </form>
    </div>
    <div class="card">
      <div class="card-head"><h3>Taarifa Zilizopo</h3></div>
      ${(list || []).map(n => `<div class="list-row" style="align-items:flex-start"><div><strong>${n.title}</strong><p style="margin:4px 0 0;color:var(--text)">${n.body}</p></div><span class="badge badge-active">Mpya</span></div>`).join("") || `<div class="empty-state">Hakuna taarifa</div>`}
    </div>`;
    document.getElementById("nf").onsubmit = async e => { e.preventDefault(); const d = await api("/api/notifications", { method: "POST", body: { ...Object.fromEntries(new FormData(e.target)), userId: "all" } }); if (d.error) alert(d.error); else load("notifications"); };
  }

  if (p === "accounting") {
    const sum = await api("/api/accounting/summary");
    const debts = await api("/api/accounting/debts");
    const expenses = await api("/api/expenses");
    const income = await api("/api/manual-income");
    const money = n => "TSh " + Number(n || 0).toLocaleString();
    const canEdit = window.__me && ["ADMIN", "TREASURER", "CHAIRPERSON"].includes(window.__me.role);
    c.innerHTML = `<div class="stats">
      <div class="stat"><div class="stat-top"><div class="stat-icon green">${IC.coin}</div><span class="stat-trend">Mapato</span></div><div class="stat-label">Mapato Yote</div><div class="val">${money(sum.mapato)}</div></div>
      <div class="stat"><div class="stat-top"><div class="stat-icon red">${IC.file}</div><span class="stat-trend danger">Matumizi</span></div><div class="stat-label">Matumizi Yote</div><div class="val">${money(sum.matumizi)}</div></div>
      <div class="stat"><div class="stat-top"><div class="stat-icon">${IC.bank}</div><span class="stat-trend">Salio</span></div><div class="stat-label">Balance</div><div class="val">${money(sum.balance)}</div></div>
      <div class="stat"><div class="stat-top"><div class="stat-icon amber">${IC.bell}</div><span class="stat-trend warn">${sum.debtors} wanadaiwa</span></div><div class="stat-label">Madeni</div><div class="val">${money(sum.totalDebt)}</div></div>
    </div>
    ${canEdit ? `<div class="split" style="grid-template-columns:1fr 1fr">
      <div class="card">
        <div class="card-head"><h3>Ongeza Matumizi</h3></div>
        <form id="expf">
          <div class="form-group"><label>Kichwa</label><input name="title" required></div>
          <div class="form-row-2">
            <div class="form-group"><label>Kiasi (TSh)</label><input name="amount" type="number" required></div>
            <div class="form-group"><label>Aina</label><select name="category"><option>Matukio</option><option>Misaada</option><option>Ofisi</option><option>Nyingine</option></select></div>
          </div>
          <button class="btn btn-sm" type="submit">Ongeza Matumizi</button>
        </form>
      </div>
      <div class="card">
        <div class="card-head"><h3>Ongeza Mapato ya Ziada</h3></div>
        <form id="incf">
          <div class="form-group"><label>Kichwa</label><input name="title" required></div>
          <div class="form-row-2">
            <div class="form-group"><label>Kiasi (TSh)</label><input name="amount" type="number" required></div>
            <div class="form-group"><label>Chanzo</label><input name="source" placeholder="Mf. Mgeni, Mchango"></div>
          </div>
          <button class="btn btn-sm" type="submit">Ongeza Mapato</button>
        </form>
      </div>
    </div>` : ""}
    <div class="card">
      <div class="card-head"><h3>Wanadaiwa (${debts.length})</h3><span class="badge badge-pending">Ada za mwezi</span></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Jina</th><th>Kanda</th><th>Deni</th></tr></thead>
          <tbody>${debts.map(d => `<tr><td><strong>${d.name}</strong></td><td>${d.region || "—"}</td><td style="font-weight:700;color:var(--error-ink)">${money(d.debt)}</td></tr>`).join("") || `<tr><td colspan="3" class="muted" style="text-align:center;padding:20px">Hakuna madeni</td></tr>`}</tbody>
        </table>
      </div>
    </div>
    <div class="split" style="grid-template-columns:1fr 1fr">
      <div class="card">
        <div class="card-head"><h3>Kumbukumbu za Matumizi</h3></div>
        ${expenses.map(e => `<div class="list-row"><div><strong>${e.title}</strong><div class="muted">${e.category || ""}</div></div><strong>${money(e.amount)}</strong></div>`).join("") || `<div class="empty-state">Hakuna matumizi</div>`}
      </div>
      <div class="card">
        <div class="card-head"><h3>Mapato ya Ziada</h3></div>
        ${income.map(i => `<div class="list-row"><div><strong>${i.title}</strong><div class="muted">${i.source || ""}</div></div><strong>${money(i.amount)}</strong></div>`).join("") || `<div class="empty-state">Hakuna mapato ya ziada</div>`}
      </div>
    </div>`;
    if (canEdit) {
      document.getElementById("expf").onsubmit = async e => { e.preventDefault(); const d = await api("/api/expenses", { method: "POST", body: Object.fromEntries(new FormData(e.target)) }); if (d.error) alert(d.error); else load("accounting"); };
      document.getElementById("incf").onsubmit = async e => { e.preventDefault(); const d = await api("/api/manual-income", { method: "POST", body: Object.fromEntries(new FormData(e.target)) }); if (d.error) alert(d.error); else load("accounting"); };
    }
  }
}

function downloadReceipt(id) {
  window.location.assign("/api/payments/" + encodeURIComponent(id) + "/receipt");
}

async function approve(id) {
  const d = await api("/api/approve-member", { method: "POST", body: { userId: id } });
  if (d.success) { alert("Imeidhinishwa: " + d.wfcId); load(document.getElementById("c").dataset.page); } else alert(d.error || "Imeshindwa");
}
async function approvePay(id) {
  const d = await api("/api/approve-payment", { method: "POST", body: { paymentId: id } });
  if (d.success) { alert("Imeidhinishwa. Risiti: " + d.receiptNo); load("payments"); } else alert(d.error || "Imeshindwa");
}
async function suspendMember(id) {
  if (!confirm("Simamisha mwanachama huyu?")) return;
  const d = await api("/api/suspend-member", { method: "POST", body: { userId: id } });
  if (d.success) load("members"); else alert(d.error || "Imeshindwa");
}
async function removeMember(id) {
  if (!confirm("Ondoa mwanachama huyu kabisa?")) return;
  const d = await api("/api/remove-member", { method: "POST", body: { userId: id } });
  if (d.success) load("members"); else alert(d.error || "Imeshindwa");
}
function sendMsg(phone, name) {
  const msg = prompt("Ujumbe kwa " + name + ":");
  if (msg) alert("Ujumbe umewekwa. (SMS/WhatsApp itatuma baadaye)");
}
async function logout() {
  await api("/api/logout", { method: "POST" });
  showLogin();
}

(async () => {
  await groupReady;
  const me = await api("/api/me");
  if (me.user) showDash();
  else if (location.hash === "#register") showRegister();
  else showLogin();
})();
