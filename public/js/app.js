const app = document.getElementById("app");
let currentUser = null;

const REGIONS = ["Dar es Salaam", "Moshi", "Arusha", "Kilimanjaro", "Tanga", "Mwanza", "Dodoma", "Nyingine"];
const LEADERS = ["ADMIN", "CHAIRPERSON", "SECRETARY", "TREASURER", "REGIONAL"];
const isLeader = (r) => LEADERS.includes(r);
const isFinance = (r) => ["ADMIN", "TREASURER", "CHAIRPERSON"].includes(r);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m]));
const money = (n) => "TSh " + Number(n || 0).toLocaleString();

// Theme persistence
if (localStorage.getItem("wfc-theme") === "dark") document.body.classList.add("dark");
function toggleTheme() {
  document.body.classList.toggle("dark");
  localStorage.setItem("wfc-theme", document.body.classList.contains("dark") ? "dark" : "light");
}

function topAuthBar(title, sub) {
  return `
    <div class="auth-topbar">
      <a href="/" class="brand-inline" style="text-decoration:none;color:inherit">
        <img src="/wfc-logo.jpg" alt="WFC Logo">
        <div>
          <div class="b-title">${title}</div>
          <div class="b-sub">${sub}</div>
        </div>
      </a>
      <button class="theme-toggle" onclick="toggleTheme()" type="button" title="Badili Mandhari">◐ Mandhari</button>
    </div>`;
}

async function api(url, method = "GET", body = null) {
  const opts = { method, headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Hitilafu imetokea");
  return data;
}

function showMsg(el, text, isErr = false) {
  el.innerHTML = `<div class="${isErr ? "error" : "success"}">${esc(text)}</div>`;
}

// ---------------- AUTH VIEWS ----------------
function renderLogin() {
  app.innerHTML = `
  <div class="auth-page">
    <div class="container">
      ${topAuthBar("WFC Portal", "Wachagga Family Community")}
      <h2>Karibu Tena</h2>
      <p class="subtitle">Ingia kwenye mfumo wa jumuiya ya familia</p>
      <form id="loginForm">
        <div class="form-group"><label>Namba ya Simu au Barua Pepe</label><input name="identifier" placeholder="07XX XXX XXX au jina@mfano.co.tz" required></div>
        <div class="form-group">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <label style="margin:0">Nenosiri</label>
            <a href="#" onclick="renderForgotPassword();return false" style="font-size:12px;font-weight:600;text-decoration:none">Umesahau nenosiri?</a>
          </div>
          <input name="password" type="password" placeholder="Weka nenosiri lako" required>
        </div>
        <button class="btn" type="submit">Ingia kwenye Portal</button>
        <div id="msg"></div>
      </form>
      <p class="link">Huna akaunti? <a href="#" onclick="renderRegister();return false">Jisajili sasa</a> &middot; <a href="/">Nyumbani</a></p>
    </div>
  </div>`;
  document.getElementById("loginForm").onsubmit = async (e) => {
    e.preventDefault();
    const msg = document.getElementById("msg");
    try {
      const data = Object.fromEntries(new FormData(e.target));
      const res = await api("/api/login", "POST", data);
      if (res.needOtp) return renderOtp(data.identifier, res.devCode);
      currentUser = res.user;
      loadApp();
    } catch (err) { showMsg(msg, err.message, true); }
  };
}

function renderForgotPassword() {
  app.innerHTML = `
  <div class="auth-page">
    <div class="container">
      ${topAuthBar("WFC Portal", "Rejesha Akaunti")}
      <h2>Umesahau Nenosiri?</h2>
      <p class="subtitle">Weka barua pepe au namba ya simu iliyosajiliwa kupata kiungo cha kubadili nenosiri.</p>
      <form id="forgotForm">
        <div class="form-group">
          <label>Barua Pepe au Namba ya Simu</label>
          <input name="identifier" placeholder="jina@mfano.co.tz au 07XX XXX XXX" required>
        </div>
        <button class="btn" type="submit">Tuma Kiungo cha Kubadili Nenosiri</button>
        <div id="msg"></div>
      </form>
      <p class="link"><a href="#" onclick="renderLogin();return false">&larr; Rudi Kwenye Kuingia</a></p>
    </div>
  </div>`;
  document.getElementById("forgotForm").onsubmit = async (e) => {
    e.preventDefault();
    const msg = document.getElementById("msg");
    try {
      const data = Object.fromEntries(new FormData(e.target));
      const res = await api("/api/forgot-password", "POST", data);
      let extra = "";
      if (res.previewUrl) {
        extra = `<div style="margin-top:8px"><a href="${esc(res.previewUrl)}" style="font-weight:700;word-break:break-all">Fungua Kiungo cha Kubadili Nenosiri &rarr;</a></div>`;
      }
      msg.innerHTML = `<div class="success">${esc(res.message)}${extra}</div>`;
    } catch (err) {
      showMsg(msg, err.message, true);
    }
  };
}

async function renderResetPassword(token) {
  app.innerHTML = `
  <div class="auth-page">
    <div class="container">
      ${topAuthBar("WFC Portal", "Nenosiri Jipya")}
      <h2>Weka Nenosiri Jipya</h2>
      <p class="subtitle" id="resetSub">Inahakiki kiungo chako...</p>
      <div id="resetBody"></div>
    </div>
  </div>`;
  const sub = document.getElementById("resetSub");
  const body = document.getElementById("resetBody");
  try {
    const info = await api(`/api/reset-password/${encodeURIComponent(token)}`);
    sub.textContent = info.name ? `Habari ${info.name}, ingiza nenosiri lako jipya hapa chini.` : "Ingiza nenosiri lako jipya hapa chini.";
    body.innerHTML = `
      <form id="resetForm">
        <div class="form-group">
          <label>Nenosiri Jipya (angalau herufi 6)</label>
          <input name="password" type="password" minlength="6" placeholder="Weka nenosiri jipya" required>
        </div>
        <div class="form-group">
          <label>Thibitisha Nenosiri Jipya</label>
          <input name="confirmPassword" type="password" minlength="6" placeholder="Rudia nenosiri jipya" required>
        </div>
        <button class="btn" type="submit">Hifadhi Nenosiri Jipya</button>
        <div id="msg"></div>
      </form>`;
    document.getElementById("resetForm").onsubmit = async (e) => {
      e.preventDefault();
      const msg = document.getElementById("msg");
      const fd = Object.fromEntries(new FormData(e.target));
      if (fd.password !== fd.confirmPassword) {
        return showMsg(msg, "Manenosiri mawili hayafanani!", true);
      }
      try {
        const res = await api("/api/reset-password", "POST", { token, password: fd.password });
        history.replaceState({}, "", "/app");
        msg.innerHTML = `<div class="success">${esc(res.message)}</div><p class="link"><a href="#" onclick="renderLogin();return false">Endelea Kuingia &rarr;</a></p>`;
      } catch (err) {
        showMsg(msg, err.message, true);
      }
    };
  } catch (err) {
    sub.textContent = "";
    body.innerHTML = `<div class="error">${esc(err.message)}</div><p class="link"><a href="#" onclick="renderForgotPassword();return false">Omba kiungo kipya</a> &middot; <a href="#" onclick="renderLogin();return false">Ingia</a></p>`;
  }
}

function renderOtp(phone, devCode) {
  app.innerHTML = `
  <div class="auth-page">
    <div class="container">
      ${topAuthBar("Uthibitisho wa 2FA", phone)}
      <h2>Weka Msimbo wa Usalama</h2>
      <p class="subtitle">Tumetuma msimbo wa tarakimu 6 kwenye namba yako.${devCode ? ` (Msimbo wa majaribio: <b>${esc(devCode)}</b>)` : ""}</p>
      <form id="otpForm">
        <div class="form-group"><label>Msimbo (OTP)</label><input name="code" maxlength="6" placeholder="000000" required></div>
        <button class="btn" type="submit">Thibitisha &amp; Ingia</button>
        <div id="msg"></div>
      </form>
      <p class="link"><a href="#" onclick="renderLogin();return false">&larr; Rudi nyuma</a></p>
    </div>
  </div>`;
  document.getElementById("otpForm").onsubmit = async (e) => {
    e.preventDefault();
    try {
      const code = new FormData(e.target).get("code");
      const res = await api("/api/verify-otp", "POST", { phone, code });
      currentUser = res.user;
      loadApp();
    } catch (err) { showMsg(document.getElementById("msg"), err.message, true); }
  };
}

function renderRegister() {
  app.innerHTML = `
  <div class="auth-page">
    <div class="container">
      ${topAuthBar("Jiunge na WFC", "Usajili wa Mwanachama Mpya")}
      <h2>Fomu ya Usajili</h2>
      <p class="subtitle">Jaza taarifa zako na uthibitishe ada ya usajili</p>
      <form id="regForm">
        <div class="form-group"><label>Jina Kamili</label><input name="name" placeholder="Mf. Amina Joseph Swai" required></div>
        <div class="form-row-2">
          <div class="form-group"><label>Namba ya Simu</label><input name="phone" placeholder="07XX XXX XXX" required></div>
          <div class="form-group"><label>Barua Pepe (Email)</label><input name="email" type="email" placeholder="jina@mfano.co.tz" required></div>
        </div>
        <div class="form-group"><label>Mkoa / Kanda</label>
          <select name="region">${REGIONS.map(r => `<option value="${r}">${r}</option>`).join("")}</select>
        </div>
        <div class="form-group"><label>Nenosiri (angalau herufi 6)</label><input name="password" type="password" minlength="6" placeholder="Weka nenosiri imara" required></div>

        <div class="pay-box">
          <div class="pay-title"><span>Ada ya Usajili (Mpya)</span><span>TSh 1,000</span></div>
          <div class="pay-lines">
            Lipa kwenda: <b>M-Pesa 0755 000 888</b> &middot; <b>Tigo Pesa 0715 000 888</b><br>
            <b>Airtel Money 0785 000 888</b> &middot; <b>CRDB 0150889944200</b>
          </div>
        </div>

        <div class="form-group"><label>Namba ya Muamala wa Usajili (Transaction ID)</label><input name="paymentProof" placeholder="Mf. QK82J910LP" required></div>
        <button class="btn" type="submit">Kamilisha Usajili</button>
        <div id="msg"></div>
      </form>
      <p class="link">Tayari una akaunti? <a href="#" onclick="renderLogin();return false">Ingia hapa</a> &middot; <a href="/">Nyumbani</a></p>
    </div>
  </div>`;
  document.getElementById("regForm").onsubmit = async (e) => {
    e.preventDefault();
    const msg = document.getElementById("msg");
    try {
      const data = Object.fromEntries(new FormData(e.target));
      const res = await api("/api/register", "POST", data);
      showMsg(msg, res.message);
      setTimeout(renderLogin, 2200);
    } catch (err) { showMsg(msg, err.message, true); }
  };
}

// ---------------- PENDING GATE ----------------
function renderPending(u) {
  app.innerHTML = `
  <div class="auth-page">
    <div class="container">
      ${topAuthBar("WFC Portal", esc(u.name))}
      <div class="pending-hero">
        <div class="pending-icon">&#9203;</div>
        <span class="badge PENDING" style="margin-bottom:10px">INASUBIRI IDHINI YA UONGOZI</span>
        <h2>Asante kwa Kujisajili!</h2>
        <p class="subtitle">Usajili wako na muamala wa <b>TSh 1,000</b> (${esc(u.paymentProof || "Imepokelewa")}) vinahakikiwa na Mwenyekiti / Katibu / Mhazini.</p>
      </div>
      <div class="pay-box">
        <div class="pay-title"><span>Taarifa Zako</span><span>${esc(u.region || "")}</span></div>
        <div class="pay-lines">
          Simu: <b>${esc(u.phone)}</b>${u.email ? ` &middot; Email: <b>${esc(u.email)}</b>` : ""}<br>
          Mara tu utakapoidhinishwa, utapata <b>WFC ID</b> yako rasmi na kufunguliwa mfumo mzima.
        </div>
      </div>
      <div style="display:flex;gap:10px;margin-top:14px">
        <button class="btn secondary" onclick="loadApp()">Angalia Tena Hali</button>
        <button class="btn ghost" onclick="logout()">Toka</button>
      </div>
    </div>
  </div>`;
}

// ---------------- SHELL & NAVIGATION ----------------
const NAV_ITEMS = [
  { id: "dash", label: "Muhtasari", group: "Kuu" },
  { id: "idcard", label: "Kitambulisho (QR)", group: "Kuu" },
  { id: "payments", label: "Michango & Risiti", group: "Fedha" },
  { id: "saccos", label: "SACCOS & Mikopo", group: "Fedha" },
  { id: "events", label: "Matukio & Tiketi", group: "Jumuiya" },
  { id: "family", label: "Mti wa Familia", group: "Jumuiya" },
  { id: "directory", label: "Taaluma & Ajira", group: "Jumuiya" },
  { id: "announcements", label: "Matangazo", group: "Jumuiya" },
  { id: "attendance", label: "Mahudhurio", group: "Utawala" },
  { id: "elections", label: "Uchaguzi", group: "Utawala" },
  { id: "projects", label: "Miradi ya WFC", group: "Utawala" },
  { id: "members", label: "Wanachama", group: "Utawala", leader: true },
  { id: "accounting", label: "Uhasibu & Madeni", group: "Utawala", leader: true },
  { id: "discipline", label: "Nidhamu & Faini", group: "Utawala", leader: true },
  { id: "assets", label: "Mali & Nyaraka", group: "Utawala", leader: true },
  { id: "help", label: "Msaada", group: "Msaada" },
  { id: "settings", label: "Mipangilio", group: "Msaada" }
];

function toggleSidebar(force) {
  const sb = document.getElementById("sidebar");
  const bd = document.getElementById("backdrop");
  if (!sb) return;
  const open = typeof force === "boolean" ? force : !sb.classList.contains("open");
  sb.classList.toggle("open", open);
  bd.classList.toggle("open", open);
}

function renderShell(activeTab, title, bodyHtml) {
  const items = NAV_ITEMS.filter(i => !i.leader || isLeader(currentUser.role));
  let lastGroup = "";
  const navHtml = items.map(i => {
    const hdr = i.group !== lastGroup ? `<div class="nav-section">${i.group}</div>` : "";
    lastGroup = i.group;
    return `${hdr}<a href="#" class="${activeTab === i.id ? "active" : ""}" onclick="navigate('${i.id}');toggleSidebar(false);return false">${i.label}</a>`;
  }).join("");

  const mobileTabs = ["dash", "payments", "events", "idcard", "announcements"];
  const mobileHtml = mobileTabs.map(id => {
    const it = NAV_ITEMS.find(x => x.id === id);
    return `<a href="#" class="${activeTab === id ? "active" : ""}" onclick="navigate('${id}');return false">${it.label.split(" ")[0]}</a>`;
  }).join("");

  app.innerHTML = `
  <div class="layout">
    <div id="backdrop" class="backdrop" onclick="toggleSidebar(false)"></div>
    <aside id="sidebar" class="sidebar">
      <div class="side-brand">
        <img src="/wfc-logo.jpg" alt="WFC">
        <div>
          <h3>WFC Portal</h3>
          <span>${esc(currentUser.wfcId || currentUser.role)}</span>
        </div>
      </div>
      <nav class="nav">${navHtml}</nav>
      <div style="margin-top:auto;padding-top:14px">
        <button class="btn ghost" style="color:#F9FAFB;border-color:rgba(255,255,255,.18)" onclick="logout()">Toka kwenye Akaunti</button>
      </div>
    </aside>
    <div class="main-wrap">
      <header class="topbar">
        <div class="topbar-left">
          <button class="menu-btn" onclick="toggleSidebar()" aria-label="Menu">&#9776;</button>
          <span class="topbar-title">${esc(title)}</span>
        </div>
        <div class="topbar-right">
          <span class="badge ROLE">${esc(currentUser.role)}</span>
          <button class="theme-toggle" onclick="toggleTheme()" title="Mandhari">&#9680;</button>
        </div>
      </header>
      <main class="main">${bodyHtml}</main>
    </div>
  </div>
  <nav class="bottom-nav">${mobileHtml}</nav>`;
}

// ---------------- PAGES ----------------
async function navigate(tab) {
  try {
    if (tab === "dash") return await pageDashboard();
    if (tab === "idcard") return await pageIdCard();
    if (tab === "payments") return await pagePayments();
    if (tab === "saccos") return await pageSaccos();
    if (tab === "events") return await pageEvents();
    if (tab === "family") return await pageFamily();
    if (tab === "directory") return await pageDirectory();
    if (tab === "announcements") return await pageAnnouncements();
    if (tab === "attendance") return await pageAttendance();
    if (tab === "elections") return await pageElections();
    if (tab === "projects") return await pageProjects();
    if (tab === "members") return await pageMembers();
    if (tab === "accounting") return await pageAccounting();
    if (tab === "discipline") return await pageDiscipline();
    if (tab === "assets") return await pageAssets();
    if (tab === "help") return await pageHelp();
    if (tab === "settings") return await pageSettings();
  } catch (err) {
    renderShell(tab, "Hitilafu", `<div class="error">${esc(err.message)}</div>`);
  }
}

function donutSvg(parts) {
  const total = parts.reduce((s, p) => s + (p.value || 0), 0);
  if (!total) return `<p class="subtitle">Hakuna takwimu za kutosha bado.</p>`;
  const r = 52, c = 2 * Math.PI * r;
  let off = 0;
  const circles = parts.map(p => {
    const len = (p.value / total) * c;
    const el = `<circle cx="75" cy="75" r="${r}" fill="none" stroke="${p.color}" stroke-width="20" stroke-dasharray="${len} ${c - len}" stroke-dashoffset="${-off}"/>`;
    off += len;
    return el;
  }).join("");
  const legend = parts.map(p => `
    <div class="leg-row">
      <span class="leg-left"><i class="leg-dot" style="background:${p.color}"></i>${esc(p.label)}</span>
      <b>${typeof p.fmt === "function" ? p.fmt(p.value) : p.value}</b>
    </div>`).join("");
  return `<div class="donut-wrap"><svg class="donut-svg" viewBox="0 0 150 150">${circles}</svg><div class="donut-legend">${legend}</div></div>`;
}

function vbarsHtml(rows) {
  if (!rows || !rows.length) return `<p class="subtitle">Hakuna data za mikoa bado.</p>`;
  const max = Math.max(...rows.map(r => r.value), 1);
  return `<div class="vchart">${rows.map(r => `
    <div class="vcol">
      <span class="vval">${r.value}</span>
      <div class="vbar" style="height:${Math.max(8, Math.round((r.value / max) * 115))}px"></div>
      <span class="vlbl">${esc(r.name)}</span>
    </div>`).join("")}</div>`;
}

async function pageDashboard() {
  const [d, debt] = await Promise.all([api("/api/dashboard"), api("/api/my-debt")]);
  const f = d.finance;
  const finCards = f ? `
    <div class="grid-4">
      <div class="stat green"><div class="label">Mapato Yote</div><div class="val">${money(f.mapato)}</div></div>
      <div class="stat amber"><div class="label">Matumizi Yote</div><div class="val">${money(f.matumizi)}</div></div>
      <div class="stat"><div class="label">Salio la Mfuko</div><div class="val">${money(f.balance)}</div></div>
      <div class="stat dark"><div class="label">Jumla ya Madeni (${f.debtors})</div><div class="val">${money(f.totalDebt)}</div></div>
    </div>` : "";
  const finChart = f ? donutSvg([
    { label: "Mapato", value: f.mapato, color: "#15803D", fmt: money },
    { label: "Matumizi", value: f.matumizi, color: "#DC2626", fmt: money },
    { label: "Madeni", value: f.totalDebt, color: "#F97316", fmt: money }
  ]) : donutSvg([
    { label: "Ulicholipa", value: d.myTotalPaid, color: "#15803D", fmt: money },
    { label: "Deni Lako", value: debt.debt, color: "#F97316", fmt: money }
  ]);

  renderShell("dash", "Muhtasari", `
    <div class="card dash-welcome">
      <div>
        <span class="dash-kicker">${esc(d.user.wfcId || "MWANACHAMA")} &middot; ${esc(d.user.region || "Tanzania")}</span>
        <h2>Habari, ${esc(d.user.name)}</h2>
        <p>Umoja Wetu, Nguvu Yetu &mdash; Muhtasari wa shughuli na fedha za jumuiya.</p>
      </div>
      <div class="dash-actions">
        <button class="btn sm" onclick="navigate('payments')">+ Lipa Mchango</button>
        <button class="btn sm secondary" onclick="navigate('events')">+ Tangaza Tukio</button>
        <button class="btn sm ghost" onclick="navigate('idcard')">Kitambulisho</button>
      </div>
    </div>

    <div class="grid-4">
      <div class="stat"><div class="label">Wanachama Hai</div><div class="val">${d.stats.members}</div></div>
      <div class="stat green"><div class="label">Michango Yako</div><div class="val">${money(d.myTotalPaid)}</div></div>
      <div class="stat amber"><div class="label">Deni Lako la Ada</div><div class="val">${money(debt.debt)}</div></div>
      <div class="stat dark"><div class="label">Wanaosubiri Idhini</div><div class="val">${d.stats.pending}</div></div>
    </div>
    ${finCards}

    <div class="grid-2">
      <div class="card">
        <div class="card-header"><h3>${f ? "Mlinganyo wa Fedha za Jumuiya" : "Hali Yako ya Ada"}</h3></div>
        ${finChart}
      </div>
      <div class="card">
        <div class="card-header"><h3>Wanachama kwa Kanda</h3></div>
        ${vbarsHtml(d.regions || [])}
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header"><h3>Matukio Yanayokuja</h3><button class="btn sm ghost" onclick="navigate('events')">Yote</button></div>
        ${(d.upcoming || []).length ? d.upcoming.map(ev => `
          <div class="feed-item">
            <div><b>${esc(ev.title)}</b><small>${esc(ev.type || "Tukio")} &middot; ${esc(ev.location || "")}</small></div>
            <span class="badge ACTIVE">${Number(ev.ticketPrice) ? money(ev.ticketPrice) : "Bure"}</span>
          </div>`).join("") : `<p class="subtitle">Hakuna matukio mapya.</p>`}
      </div>
      <div class="card">
        <div class="card-header"><h3>Matangazo ya Hivi Karibuni</h3><button class="btn sm ghost" onclick="navigate('announcements')">Yote</button></div>
        ${(d.notices || []).length ? d.notices.map(a => `
          <div class="feed-item">
            <div><b>${esc(a.title)}</b><small>${esc(a.body).slice(0, 90)}</small></div>
            <small>${new Date(a.createdAt).toLocaleDateString("sw-TZ")}</small>
          </div>`).join("") : `<p class="subtitle">Hakuna matangazo mapya.</p>`}
      </div>
    </div>

    <div class="card">
      <div class="card-header"><h3>Miamala ya Hivi Karibuni</h3><button class="btn sm ghost" onclick="navigate('payments')">Yote</button></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Mwanachama</th><th>Aina</th><th>Kiasi</th><th>Muamala</th><th>Hali</th></tr></thead>
          <tbody>
            ${(d.recent || []).map(p => `<tr>
              <td>${esc(p.userName)}</td><td>${esc(p.type)}</td><td>${money(p.amount)}</td>
              <td>${esc(p.transactionId)}</td><td><span class="badge ${p.status}">${p.status}</span></td>
            </tr>`).join("") || `<tr><td colspan="5">Hakuna miamala bado</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>`);
}

async function pageIdCard() {
  const d = await api("/api/dashboard");
  const u = d.user;
  renderShell("idcard", "Kitambulisho cha Kidijitali", `
    <div class="card">
      <div class="card-header"><h3>Kadi Rasmi ya Uanachama (WFC)</h3><button class="btn sm" onclick="downloadIdPdf()">Pakua PDF</button></div>
      <div id="wfcCard" class="id-card">
        <div class="id-top">
          <div class="id-top-brand">
            <img src="/wfc-logo.jpg" alt="WFC">
            <div><small>Wachagga Family Community</small><strong>KITAMBULISHO CHA MWANACHAMA</strong></div>
          </div>
          <span class="badge ACTIVE">HAI</span>
        </div>
        <div class="id-body">
          <div>
            <div class="id-name">${esc(u.name)}</div>
            <div class="id-meta">
              Kanda: ${esc(u.region || "Tanzania")}<br>
              Cheo: ${esc(u.role)}<br>
              Simu: ${esc(u.phone)}
            </div>
            <div class="id-num">${esc(u.wfcId || "WFC-MEMBER")}</div>
          </div>
          <div class="qr-box"><div id="qrTarget"></div></div>
        </div>
      </div>
    </div>`);
  if (window.QRCode) {
    new QRCode(document.getElementById("qrTarget"), {
      text: JSON.stringify({ id: u.wfcId, name: u.name, status: u.status }),
      width: 82, height: 82
    });
  }
}

async function downloadIdPdf() {
  const el = document.getElementById("wfcCard");
  if (!window.html2canvas || !window.jspdf) return window.print();
  const canvas = await html2canvas(el, { scale: 2 });
  const pdf = new window.jspdf.jsPDF({ orientation: "landscape", unit: "px", format: [canvas.width / 2 + 40, canvas.height / 2 + 40] });
  pdf.addImage(canvas.toDataURL("image/png"), "PNG", 20, 20, canvas.width / 2, canvas.height / 2);
  pdf.save("WFC-Kitambulisho.pdf");
}

async function pagePayments() {
  const [list, d] = await Promise.all([api("/api/payments"), api("/api/dashboard")]);
  const nums = d.settings.paymentNumbers || {};
  const visible = isFinance(currentUser.role) ? list : list.filter(p => p.userId === currentUser.id);
  renderShell("payments", "Michango & Risiti", `
    <div class="grid-2">
      <div class="card">
        <h3>Wasilisha Mchango Mpya</h3>
        <div class="pay-box">
          <div class="pay-title"><span>Namba Rasmi za Malipo</span><span>WFC</span></div>
          <div class="pay-lines">
            M-Pesa: <b>${esc(nums.mpesa)}</b> &middot; Tigo: <b>${esc(nums.tigo)}</b><br>
            Airtel: <b>${esc(nums.airtel)}</b> &middot; CRDB: <b>${esc(nums.crdb)}</b>
          </div>
        </div>
        <form id="payForm">
          <div class="form-group"><label>Aina ya Mchango</label>
            <select name="type">
              <option value="Ada ya mwezi">Ada ya Mwezi (TSh 10,000)</option>
              <option value="Kiingilio">Ada ya Kiingilio (TSh 50,000)</option>
              <option value="Dharura">Mfuko wa Dharura (TSh 60,000)</option>
              <option value="Msiba">Mchango wa Msiba</option>
              <option value="Harusi">Mchango wa Harusi</option>
            </select>
          </div>
          <div class="form-row-2">
            <div class="form-group"><label>Kiasi (TSh)</label><input name="amount" type="number" value="10000" required></div>
            <div class="form-group"><label>Namba ya Muamala</label><input name="transactionId" placeholder="Mf. QK82J910LP" required></div>
          </div>
          <button class="btn" type="submit">Wasilisha Uthibitisho</button>
          <div id="pMsg"></div>
        </form>
      </div>
      <div class="card">
        <h3>Maelekezo &amp; STK Push</h3>
        <p class="subtitle">1. Tuma pesa kwenye moja ya akaunti za WFC.<br>2. Nakili namba ya muamala (Transaction ID).<br>3. Wasilisha hapa ili Mhazini aidhinishe na kutoa risiti rasmi.</p>
        <div class="pay-box">
          <div class="pay-title"><span>Omba Malipo ya Simu (M-Pesa STK)</span><span>Sandbox</span></div>
          <form id="stkForm" style="margin-top:8px">
            <div class="form-row-2">
              <div class="form-group"><label>Namba ya Simu</label><input name="phone" value="${esc(currentUser.phone)}" required></div>
              <div class="form-group"><label>Kiasi (TSh)</label><input name="amount" type="number" value="10000" required></div>
            </div>
            <button class="btn sm secondary" type="submit">Tuma Ombi la STK</button>
            <div id="stkMsg"></div>
          </form>
        </div>
      </div>
    </div>
    <div class="card">
      <h3>Historia ya Michango</h3>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Mwanachama</th><th>Aina</th><th>Kiasi</th><th>Muamala</th><th>Risiti</th><th>Hali</th><th>Hatua</th></tr></thead>
          <tbody>
            ${visible.slice().reverse().map(p => `<tr>
              <td>${esc(p.userName)}</td><td>${esc(p.type)}</td><td>${money(p.amount)}</td>
              <td>${esc(p.transactionId)}</td><td>${esc(p.receiptNo || "-")}</td>
              <td><span class="badge ${p.status}">${p.status}</span></td>
              <td>${p.status === "PENDING" && isFinance(currentUser.role)
                ? `<button class="btn sm secondary" onclick="approvePay('${p.id}')">Idhinisha</button>`
                : (p.receiptNo ? `<button class="btn sm ghost" onclick="printReceipt('${esc(p.receiptNo)}','${esc(p.userName)}','${esc(p.type)}',${p.amount})">Risiti</button>` : "-")}</td>
            </tr>`).join("") || `<tr><td colspan="7">Hakuna michango bado</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>`);
  document.getElementById("payForm").onsubmit = async (e) => {
    e.preventDefault();
    try {
      await api("/api/submit-payment", "POST", Object.fromEntries(new FormData(e.target)));
      navigate("payments");
    } catch (err) { showMsg(document.getElementById("pMsg"), err.message, true); }
  };
  document.getElementById("stkForm").onsubmit = async (e) => {
    e.preventDefault();
    const res = await api("/api/stk", "POST", Object.fromEntries(new FormData(e.target)));
    showMsg(document.getElementById("stkMsg"), res.detail, !res.ok);
  };
}

async function approvePay(paymentId) {
  await api("/api/approve-payment", "POST", { paymentId });
  navigate("payments");
}

function printReceipt(no, name, type, amount) {
  const w = window.open("", "_blank", "width=420,height=520");
  w.document.write(`<body style="font-family:sans-serif;padding:24px"><h2>RISITI RASMI — WFC</h2><hr><p><b>Namba:</b> ${no}</p><p><b>Mwanachama:</b> ${name}</p><p><b>Aina:</b> ${type}</p><p><b>Kiasi:</b> TSh ${Number(amount).toLocaleString()}</p><p><b>Hali:</b> IMELIPWA</p><script>window.print()<\/script></body>`);
}

async function pageMembers() {
  const [list, roles] = await Promise.all([api("/api/members"), api("/api/roles")]);
  const activeCount = list.filter(m => m.status === "ACTIVE").length;
  const pendingCount = list.filter(m => m.status === "PENDING").length;
  const roleCounts = roles.map(r => ({ r, n: list.filter(m => m.role === r).length }));
  renderShell("members", "Usimamizi wa Wanachama & Vyeo", `
    <div class="grid-3">
      <div class="stat"><div class="label">Jumla ya Wanachama</div><div class="val">${list.length}</div></div>
      <div class="stat green"><div class="label">Wanachama Hai</div><div class="val">${activeCount}</div></div>
      <div class="stat amber"><div class="label">Wanaosubiri Idhini</div><div class="val">${pendingCount}</div></div>
    </div>
    <div class="card role-bar">
      <div class="card-header"><h3>Mgawanyo wa Vyeo</h3></div>
      <div class="role-pills">${roleCounts.map(x => `<span class="role-pill">${esc(x.r)} (${x.n})</span>`).join("")}</div>
    </div>
    <div class="card">
      <div class="card-header">
        <h3>Orodha ya Wanachama</h3>
        <input id="memSearch" placeholder="Tafuta jina, WFC ID au kanda..." style="max-width:260px" oninput="filterMembers()">
      </div>
      <div class="table-wrap">
        <table id="memTable">
          <thead><tr><th>WFC ID</th><th>Jina</th><th>Simu</th><th>Kanda</th><th>Cheo</th><th>Hali</th><th>Hatua</th></tr></thead>
          <tbody>
            ${list.map(m => `<tr data-q="${esc((m.name + " " + (m.wfcId || "") + " " + (m.region || "") + " " + m.role).toLowerCase())}">
              <td><b>${esc(m.wfcId || "-")}</b></td>
              <td>${esc(m.name)}</td>
              <td>${esc(m.phone)}</td>
              <td>${esc(m.region || "-")}</td>
              <td>${currentUser.role === "ADMIN" ? `<select onchange="setRole('${m.id}', this.value)">${roles.map(r => `<option value="${r}" ${m.role === r ? "selected" : ""}>${r}</option>`).join("")}</select>` : `<span class="badge ROLE">${esc(m.role)}</span>`}</td>
              <td><span class="badge ${m.status}">${m.status}</span></td>
              <td>${m.status === "PENDING" ? `<button class="btn sm secondary" onclick="approveMem('${m.id}')">Idhinisha</button>` : "-"}</td>
            </tr>`).join("")}
          </tbody>
        </table>
      </div>
    </div>`);
}
function filterMembers() {
  const q = (document.getElementById("memSearch")?.value || "").toLowerCase().trim();
  document.querySelectorAll("#memTable tbody tr").forEach(tr => {
    tr.style.display = !q || tr.dataset.q.includes(q) ? "" : "none";
  });
}
async function approveMem(userId) { await api("/api/approve-member", "POST", { userId }); navigate("members"); }
async function setRole(userId, role) { await api("/api/set-role", "POST", { userId, role }); navigate("members"); }

async function pageAccounting() {
  const [sum, debts, exps, incs, pays] = await Promise.all([
    api("/api/accounting/summary"),
    api("/api/accounting/debts"),
    api("/api/expenses"),
    api("/api/manual-income"),
    api("/api/payments")
  ]);
  const approvedPays = pays.filter(p => p.status === "APPROVED");
  const ledger = [
    ...approvedPays.map(p => ({ date: p.approvedAt || p.createdAt, title: `${p.type} — ${p.userName}`, kind: "IN", amount: p.amount })),
    ...incs.map(i => ({ date: i.createdAt, title: `${i.title} (${i.source})`, kind: "IN", amount: i.amount })),
    ...exps.map(e => ({ date: e.createdAt, title: `${e.title} (${e.category})`, kind: "OUT", amount: e.amount }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  renderShell("accounting", "Uhasibu & Madeni", `
    <div class="grid-4">
      <div class="stat green"><div class="label">Mapato Yote</div><div class="val">${money(sum.mapato)}</div></div>
      <div class="stat amber"><div class="label">Matumizi Yote</div><div class="val">${money(sum.matumizi)}</div></div>
      <div class="stat"><div class="label">Salio Halisi</div><div class="val">${money(sum.balance)}</div></div>
      <div class="stat dark"><div class="label">Madeni (${sum.debtors})</div><div class="val">${money(sum.totalDebt)}</div></div>
    </div>
    ${isFinance(currentUser.role) ? `
    <div class="grid-2">
      <div class="card">
        <h3>Rekodi Matumizi</h3>
        <form id="expForm">
          <div class="form-group"><label>Maelezo ya Matumizi</label><input name="title" placeholder="Mf. Kukodi ukumbi wa mkutano" required></div>
          <div class="form-row-2">
            <div class="form-group"><label>Kiasi (TSh)</label><input name="amount" type="number" required></div>
            <div class="form-group"><label>Kundi</label><select name="category"><option>Matukio</option><option>Misaada</option><option>Uendeshaji</option><option>Nyingine</option></select></div>
          </div>
          <div class="form-group"><label>Maelezo ya Ziada</label><input name="note" placeholder="Hiari"></div>
          <button class="btn danger" type="submit">Hifadhi Matumizi</button>
        </form>
      </div>
      <div class="card">
        <h3>Rekodi Mapato Mengine</h3>
        <form id="incForm">
          <div class="form-group"><label>Chanzo cha Mapato</label><input name="title" placeholder="Mf. Mchango wa mgeni / wafadhili" required></div>
          <div class="form-row-2">
            <div class="form-group"><label>Kiasi (TSh)</label><input name="amount" type="number" required></div>
            <div class="form-group"><label>Aina</label><select name="source"><option>Mgeni</option><option>Ufadhili</option><option>Mradi</option><option>Nyingine</option></select></div>
          </div>
          <div class="form-group"><label>Maelezo ya Ziada</label><input name="note" placeholder="Hiari"></div>
          <button class="btn secondary" type="submit">Hifadhi Mapato</button>
        </form>
      </div>
    </div>` : ""}

    <div class="card">
      <div class="card-header"><h3>Orodha ya Wadaiwa wa Ada</h3></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>WFC ID</th><th>Mwanachama</th><th>Kanda</th><th>Anayopaswa</th><th>Amelipa</th><th>Deni</th></tr></thead>
          <tbody>
            ${debts.map(d => `<tr>
              <td><b>${esc(d.wfcId || "-")}</b></td><td>${esc(d.name)}</td><td>${esc(d.region || "-")}</td>
              <td>${money(d.expected)}</td><td>${money(d.paid)}</td><td><span class="badge PENDING">${money(d.debt)}</span></td>
            </tr>`).join("") || `<tr><td colspan="6">Hakuna mwanachama mwenye deni la ada</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><h3>Leja Kuu (Mapato na Matumizi)</h3></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Tarehe</th><th>Maelezo</th><th>Aina</th><th>Kiasi</th></tr></thead>
          <tbody>
            ${ledger.slice(0, 30).map(r => `<tr>
              <td>${new Date(r.date).toLocaleDateString("sw-TZ")}</td><td>${esc(r.title)}</td>
              <td><span class="badge ${r.kind === "IN" ? "APPROVED" : "REJECTED"}">${r.kind === "IN" ? "MAPATO" : "MATUMIZI"}</span></td>
              <td><b>${r.kind === "IN" ? "+" : "-"}${money(r.amount)}</b></td>
            </tr>`).join("") || `<tr><td colspan="4">Hakuna miamala</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>`);
  const ef = document.getElementById("expForm");
  if (ef) ef.onsubmit = async (e) => { e.preventDefault(); await api("/api/expenses", "POST", Object.fromEntries(new FormData(e.target))); navigate("accounting"); };
  const inf = document.getElementById("incForm");
  if (inf) inf.onsubmit = async (e) => { e.preventDefault(); await api("/api/manual-income", "POST", Object.fromEntries(new FormData(e.target))); navigate("accounting"); };
}

async function pageEvents() {
  const list = await api("/api/events");
  renderShell("events", "Matukio & Tiketi", `
    <div class="grid-2">
      <div class="card">
        <h3>Tangaza Tukio Jipya</h3>
        <form id="evForm">
          <div class="form-group"><label>Aina ya Tukio</label>
            <select name="type"><option>Harusi</option><option>Msiba</option><option>Mkutano Mkuu</option><option>Festival</option><option>Mahafali</option></select>
          </div>
          <div class="form-group"><label>Kichwa cha Tukio</label><input name="title" placeholder="Mf. Harusi ya Familia Swai" required></div>
          <div class="form-row-2">
            <div class="form-group"><label>Mahali</label><input name="location" placeholder="Moshi / Dar" required></div>
            <div class="form-group"><label>Bei ya Tiketi (TSh, 0=Bure)</label><input name="ticketPrice" type="number" value="0"></div>
          </div>
          <button class="btn" type="submit">Chapisha Tukio</button>
        </form>
      </div>
      <div class="card">
        <h3>Matukio Yaliyopo (${list.length})</h3>
        ${list.map(ev => `
          <div style="padding:12px 0;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;gap:10px">
            <div>
              <span class="badge ROLE">${esc(ev.type || "Tukio")}</span>
              <div style="font-weight:700;margin-top:4px">${esc(ev.title)}</div>
              <small style="color:var(--muted)">${esc(ev.location || "")} &middot; ${Number(ev.ticketPrice) ? money(ev.ticketPrice) : "Bure"}</small>
            </div>
            <a class="btn sm" href="/ticket/${esc(ev.id)}" target="_blank">Tiketi</a>
          </div>`).join("") || `<p class="subtitle">Hakuna matukio bado.</p>`}
      </div>
    </div>`);
  document.getElementById("evForm").onsubmit = async (e) => {
    e.preventDefault();
    await api("/api/events", "POST", Object.fromEntries(new FormData(e.target)));
    navigate("events");
  };
}

async function pageFamily() {
  const fam = await api("/api/family");
  const kids = Array.isArray(fam.children) ? fam.children.join(", ") : "";
  renderShell("family", "Mti wa Familia", `
    <div class="card" style="max-width:560px">
      <h3>Taarifa za Familia Yangu</h3>
      <p class="subtitle">Sajili mwenza na watoto ili watambulike kwenye mfumo wa misaada ya familia.</p>
      <form id="famForm">
        <div class="form-group"><label>Mkuu wa Familia</label><input name="head" value="${esc(fam.head || currentUser.name)}" required></div>
        <div class="form-group"><label>Jina la Mwenza (Mke / Mume)</label><input name="spouse" value="${esc(fam.spouse || "")}" placeholder="Hiari"></div>
        <div class="form-group"><label>Watoto (tenganisha kwa mkato)</label><input name="children" value="${esc(kids)}" placeholder="Mf. Neema, Brian, Kelvin"></div>
        <button class="btn" type="submit">Hifadhi Familia</button>
        <div id="fMsg"></div>
      </form>
    </div>`);
  document.getElementById("famForm").onsubmit = async (e) => {
    e.preventDefault();
    const raw = Object.fromEntries(new FormData(e.target));
    raw.children = raw.children ? raw.children.split(",").map(s => s.trim()).filter(Boolean) : [];
    await api("/api/family", "POST", raw);
    showMsg(document.getElementById("fMsg"), "Taarifa za familia zimehifadhiwa!");
  };
}

async function pageDirectory() {
  const list = await api("/api/directory");
  renderShell("directory", "Taaluma & Ajira", `
    <div class="grid-2">
      <div class="card">
        <h3>Weka Taaluma / Biashara Yako</h3>
        <form id="profForm">
          <div class="form-group"><label>Taaluma / Huduma Unayotoa</label><input name="profession" placeholder="Mf. Daktari, Mhasibu, Mkandarasi, Mfanyabiashara" required></div>
          <button class="btn" type="submit">Hifadhi kwenye Orodha</button>
        </form>
      </div>
      <div class="card">
        <h3>Wataalamu wa Jumuiya (${list.length})</h3>
        ${list.map(x => `<div style="padding:10px 0;border-bottom:1px solid var(--border)"><b>${esc(x.name)}</b> &mdash; ${esc(x.profession)} <small style="color:var(--muted)">(${esc(x.region || "")})</small></div>`).join("") || `<p class="subtitle">Hakuna taaluma zilizowekwa bado.</p>`}
      </div>
    </div>`);
  document.getElementById("profForm").onsubmit = async (e) => {
    e.preventDefault();
    await api("/api/my-profession", "POST", Object.fromEntries(new FormData(e.target)));
    navigate("directory");
  };
}

async function pageAnnouncements() {
  const list = await api("/api/announcements");
  renderShell("announcements", "Matangazo ya Jumuiya", `
    ${isLeader(currentUser.role) ? `
    <div class="card">
      <h3>Chapisha Tangazo Jipya</h3>
      <form id="anForm">
        <div class="form-group"><label>Kichwa</label><input name="title" required></div>
        <div class="form-group"><label>Ujumbe</label><textarea name="body" rows="3" required></textarea></div>
        <button class="btn sm" type="submit">Chapisha</button>
      </form>
    </div>` : ""}
    <div class="card">
      <h3>Matangazo Yote</h3>
      ${list.map(a => `<div style="padding:12px 0;border-bottom:1px solid var(--border)"><b>${esc(a.title)}</b><p style="margin:4px 0;color:var(--muted)">${esc(a.body)}</p><small>${esc(a.author || "Uongozi")} &middot; ${new Date(a.createdAt).toLocaleDateString("sw-TZ")}</small></div>`).join("") || `<p class="subtitle">Hakuna matangazo.</p>`}
    </div>`);
  const f = document.getElementById("anForm");
  if (f) f.onsubmit = async (e) => {
    e.preventDefault();
    await api("/api/announcements", "POST", Object.fromEntries(new FormData(e.target)));
    navigate("announcements");
  };
}

async function pageAttendance() {
  const list = await api("/api/attendance");
  renderShell("attendance", "Mahudhurio ya Mikutano", `
    <div class="card">
      <h3>Jisajili Mahudhurio</h3>
      <form id="attForm" style="display:flex;gap:10px;flex-wrap:wrap">
        <input name="meeting" placeholder="Jina la Mkutano (Mf. Mkutano Mkuu 2026)" required style="flex:1;min-width:220px">
        <button class="btn sm" type="submit">Thibitisha Kuhudhuria</button>
      </form>
    </div>
    <div class="card">
      <h3>Rekodi za Mahudhurio (${list.length})</h3>
      <div class="table-wrap"><table><thead><tr><th>Mwanachama</th><th>Mkutano</th><th>Tarehe</th></tr></thead>
      <tbody>${list.slice().reverse().map(a => `<tr><td>${esc(a.userName)}</td><td>${esc(a.meeting)}</td><td>${new Date(a.date).toLocaleString("sw-TZ")}</td></tr>`).join("") || `<tr><td colspan="3">Hakuna rekodi</td></tr>`}</tbody></table></div>
    </div>`);
  document.getElementById("attForm").onsubmit = async (e) => {
    e.preventDefault();
    await api("/api/attendance", "POST", Object.fromEntries(new FormData(e.target)));
    navigate("attendance");
  };
}

async function pageElections() {
  const list = await api("/api/elections");
  renderShell("elections", "Uchaguzi wa Viongozi", `
    ${isLeader(currentUser.role) ? `
    <div class="card">
      <h3>Fungua Nafasi ya Uchaguzi</h3>
      <form id="elForm" style="display:flex;gap:10px;flex-wrap:wrap">
        <input name="position" placeholder="Nafasi (Mf. Mwenyekiti wa Kanda)" required style="flex:1;min-width:220px">
        <button class="btn sm" type="submit">Fungua Uchaguzi</button>
      </form>
    </div>` : ""}
    ${list.map(el => `
      <div class="card">
        <div class="card-header"><h3>${esc(el.position)}</h3><span class="badge ACTIVE">${el.votes.length} Kura</span></div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px">
          ${el.candidates.map(c => `<button class="btn sm secondary" onclick="vote('${el.id}','${esc(c.name)}')">Piga Kura: ${esc(c.name)}</button>`).join("") || `<small class="subtitle">Hakuna wagombea bado</small>`}
        </div>
        <form onsubmit="nominate(event,'${el.id}')" style="display:flex;gap:8px;flex-wrap:wrap">
          <input name="name" placeholder="Pendekeza mgombea..." required style="flex:1;min-width:180px">
          <button class="btn sm ghost" type="submit">+ Mgombea</button>
        </form>
      </div>`).join("") || `<div class="card"><p class="subtitle">Hakuna uchaguzi uliofunguliwa kwa sasa.</p></div>`}`);
  const ef = document.getElementById("elForm");
  if (ef) ef.onsubmit = async (e) => { e.preventDefault(); await api("/api/elections", "POST", Object.fromEntries(new FormData(e.target))); navigate("elections"); };
}
async function nominate(e, electionId) { e.preventDefault(); await api("/api/elections/nominate", "POST", { electionId, name: new FormData(e.target).get("name") }); navigate("elections"); }
async function vote(electionId, candidate) { try { await api("/api/elections/vote", "POST", { electionId, candidate }); navigate("elections"); } catch (err) { alert(err.message); } }

async function pageSaccos() {
  const s = await api("/api/saccos");
  const myShares = (s.shares || []).filter(x => x.userId === currentUser.id).reduce((a, b) => a + (b.amount || 0), 0);
  renderShell("saccos", "SACCOS, Hisa & Mikopo", `
    <div class="grid-2">
      <div class="card">
        <h3>Hisa Zako: ${money(myShares)}</h3>
        <form id="shForm">
          <div class="form-group"><label>Nunua Hisa Mpya (TSh)</label><input name="amount" type="number" value="20000" required></div>
          <button class="btn" type="submit">Rekodi Hisa</button>
        </form>
      </div>
      <div class="card">
        <h3>Omba Mkopo wa SACCOS</h3>
        <form id="lnForm">
          <div class="form-group"><label>Kiasi cha Mkopo (TSh)</label><input name="amount" type="number" value="100000" required></div>
          <button class="btn secondary" type="submit">Tuma Maombi</button>
        </form>
      </div>
    </div>
    <div class="card">
      <h3>Maombi ya Mikopo</h3>
      <div class="table-wrap"><table><thead><tr><th>Mwombaji</th><th>Kiasi</th><th>Hali</th></tr></thead>
      <tbody>${(s.loans || []).map(l => `<tr><td>${esc(l.userName)}</td><td>${money(l.amount)}</td><td><span class="badge ${l.status}">${l.status}</span></td></tr>`).join("") || `<tr><td colspan="3">Hakuna maombi</td></tr>`}</tbody></table></div>
    </div>`);
  document.getElementById("shForm").onsubmit = async (e) => { e.preventDefault(); await api("/api/saccos/shares", "POST", Object.fromEntries(new FormData(e.target))); navigate("saccos"); };
  document.getElementById("lnForm").onsubmit = async (e) => { e.preventDefault(); await api("/api/saccos/loans", "POST", Object.fromEntries(new FormData(e.target))); navigate("saccos"); };
}

async function pageProjects() {
  const list = await api("/api/projects");
  renderShell("projects", "Miradi ya Jumuiya", `
    <div class="card">
      <h3>Pendekeza / Anzisha Mradi</h3>
      <form id="prForm">
        <div class="form-group"><label>Jina la Mradi</label><input name="name" placeholder="Mf. Shamba la Pamoja Kilimanjaro" required></div>
        <div class="form-group"><label>Maelezo</label><textarea name="description" rows="2"></textarea></div>
        <button class="btn sm" type="submit">Hifadhi Mradi</button>
      </form>
    </div>
    <div class="card">
      <h3>Miradi Iliyopo (${list.length})</h3>
      ${list.map(p => `<div style="padding:10px 0;border-bottom:1px solid var(--border)"><b>${esc(p.name)}</b><p style="color:var(--muted);font-size:13px">${esc(p.description || "")}</p></div>`).join("") || `<p class="subtitle">Hakuna miradi bado.</p>`}
    </div>`);
  document.getElementById("prForm").onsubmit = async (e) => { e.preventDefault(); await api("/api/projects", "POST", Object.fromEntries(new FormData(e.target))); navigate("projects"); };
}

async function pageDiscipline() {
  const [cases, penalties] = await Promise.all([api("/api/cases"), api("/api/penalties")]);
  renderShell("discipline", "Nidhamu & Faini", `
    <div class="grid-2">
      <div class="card">
        <h3>Sajili Shauri la Nidhamu</h3>
        <form id="csForm">
          <div class="form-group"><label>Kichwa</label><input name="title" required></div>
          <div class="form-group"><label>Maelezo</label><textarea name="details" rows="2" required></textarea></div>
          <button class="btn sm" type="submit">Wasilisha</button>
        </form>
      </div>
      <div class="card">
        <h3>Toza Faini</h3>
        <form id="pnForm">
          <div class="form-group"><label>Mwanachama</label><input name="memberName" required></div>
          <div class="form-group"><label>Kiasi (TSh)</label><input name="amount" type="number" value="5000" required></div>
          <button class="btn sm danger" type="submit">Rekodi Faini</button>
        </form>
      </div>
    </div>
    <div class="card"><h3>Mashauri (${cases.length}) &middot; Faini (${penalties.length})</h3></div>`);
  document.getElementById("csForm").onsubmit = async (e) => { e.preventDefault(); await api("/api/cases", "POST", Object.fromEntries(new FormData(e.target))); navigate("discipline"); };
  document.getElementById("pnForm").onsubmit = async (e) => { e.preventDefault(); await api("/api/penalties", "POST", Object.fromEntries(new FormData(e.target))); navigate("discipline"); };
}

async function pageAssets() {
  const [assets, docs] = await Promise.all([api("/api/assets"), api("/api/documents")]);
  renderShell("assets", "Mali & Nyaraka za WFC", `
    <div class="grid-2">
      <div class="card">
        <h3>Ongeza Mali ya Jumuiya</h3>
        <form id="asForm">
          <div class="form-group"><label>Jina la Mali</label><input name="name" placeholder="Mf. Kiwanja Moshi" required></div>
          <div class="form-group"><label>Thamani (TSh)</label><input name="value" type="number" required></div>
          <button class="btn sm" type="submit">Hifadhi</button>
        </form>
        <div style="margin-top:12px">${assets.map(a => `<div>&bull; ${esc(a.name)} (${money(a.value)})</div>`).join("")}</div>
      </div>
      <div class="card">
        <h3>Nyaraka &amp; Katiba</h3>
        <form id="dcForm">
          <div class="form-group"><label>Jina la Waraka</label><input name="title" placeholder="Mf. Katiba ya WFC 2026" required></div>
          <div class="form-group"><label>Kiungo / Muhtasari</label><input name="url" required></div>
          <button class="btn sm secondary" type="submit">Hifadhi Waraka</button>
        </form>
        <div style="margin-top:12px">${docs.map(d => `<div>&bull; <b>${esc(d.title)}</b>: ${esc(d.url)}</div>`).join("")}</div>
      </div>
    </div>`);
  document.getElementById("asForm").onsubmit = async (e) => { e.preventDefault(); await api("/api/assets", "POST", Object.fromEntries(new FormData(e.target))); navigate("assets"); };
  document.getElementById("dcForm").onsubmit = async (e) => { e.preventDefault(); await api("/api/documents", "POST", Object.fromEntries(new FormData(e.target))); navigate("assets"); };
}

async function pageHelp() {
  const list = await api("/api/support");
  renderShell("help", "Msaada & Mawasiliano", `
    <div class="card" style="max-width:600px">
      <h3>Tuma Swali au Ombi la Msaada</h3>
      <form id="supForm">
        <div class="form-group"><label>Mada</label><input name="subject" required></div>
        <div class="form-group"><label>Maelezo</label><textarea name="message" rows="3" required></textarea></div>
        <button class="btn sm" type="submit">Tuma Ombi</button>
      </form>
    </div>
    <div class="card">
      <h3>Maombi Yako (${list.length})</h3>
      ${list.map(t => `<div style="padding:10px 0;border-bottom:1px solid var(--border)"><b>${esc(t.subject)}</b> <span class="badge ${t.status}">${t.status}</span><p style="color:var(--muted);font-size:13px">${esc(t.message)}</p></div>`).join("") || `<p class="subtitle">Hakuna maombi.</p>`}
    </div>`);
  document.getElementById("supForm").onsubmit = async (e) => { e.preventDefault(); await api("/api/support", "POST", Object.fromEntries(new FormData(e.target))); navigate("help"); };
}

async function pageSettings() {
  const [d, outbox] = await Promise.all([api("/api/dashboard"), api("/api/outbox")]);
  const s = d.settings || {};
  const admin = currentUser.role === "ADMIN";
  renderShell("settings", "Mipangilio", `
    <div class="grid-2">
      <div class="card">
        <h3>Akaunti &amp; Usalama</h3>
        <div class="set-row">
          <div><b>Mandhari ya Giza (Dark Mode)</b><small>Badili muonekano wa rangi za portal</small></div>
          <label class="switch"><input type="checkbox" ${document.body.classList.contains("dark") ? "checked" : ""} onchange="toggleTheme()"><span class="slider"></span></label>
        </div>
        <div class="set-row">
          <div><b>Uthibitisho wa Hatua Mbili (2FA)</b><small>Omba msimbo wa OTP kila unapoingia</small></div>
          <label class="switch"><input type="checkbox" ${d.user.twoFactor ? "checked" : ""} onchange="toggle2fa(this)"><span class="slider"></span></label>
        </div>
        <div class="set-row">
          <div><b>Namba ya Uanachama</b><small>${esc(d.user.wfcId || "-")} &middot; ${esc(d.user.phone)}${d.user.email ? " &middot; " + esc(d.user.email) : ""}</small></div>
          <span class="badge ACTIVE">${esc(d.user.role)}</span>
        </div>
      </div>

      ${isLeader(currentUser.role) ? `
      <div class="card">
        <h3>Tuma Arifa (SMS / WhatsApp / Email)</h3>
        <form id="dispForm">
          <div class="form-row-2">
            <div class="form-group"><label>Njia</label><select name="channel"><option value="sms">SMS</option><option value="whatsapp">WhatsApp</option><option value="email">Email</option></select></div>
            <div class="form-group"><label>Mpokeaji (Simu / Email)</label><input name="to" placeholder="07XX XXX XXX" required></div>
          </div>
          <div class="form-group"><label>Kichwa</label><input name="title" value="Taarifa kutoka WFC" required></div>
          <div class="form-group"><label>Ujumbe</label><textarea name="body" rows="2" required></textarea></div>
          <button class="btn sm" type="submit">Tuma Ujumbe</button>
          <div id="dispMsg"></div>
        </form>
      </div>` : ""}
    </div>

    ${admin ? `
    <div class="card">
      <h3>Uunganishaji wa API (Admin Pekee)</h3>
      <form id="apiSetForm">
        <div class="form-row-2">
          <div class="form-group"><label>Africa's Talking Username</label><input name="smsUsername" value="${esc(s.smsUsername || "")}"></div>
          <div class="form-group"><label>Africa's Talking API Key</label><input name="smsKey" type="password" value="${esc(s.smsKey || "")}"></div>
        </div>
        <div class="form-row-2">
          <div class="form-group"><label>WhatsApp Phone ID</label><input name="whatsappPhoneId" value="${esc(s.whatsappPhoneId || "")}"></div>
          <div class="form-group"><label>WhatsApp Access Token</label><input name="whatsappToken" type="password" value="${esc(s.whatsappToken || "")}"></div>
        </div>
        <div class="form-row-2">
          <div class="form-group"><label>M-Pesa Consumer Key</label><input name="momoConsumerKey" value="${esc(s.momoConsumerKey || "")}"></div>
          <div class="form-group"><label>M-Pesa Consumer Secret</label><input name="momoConsumerSecret" type="password" value="${esc(s.momoConsumerSecret || "")}"></div>
        </div>
        <div class="form-group"><label>Barua Pepe ya Kutumia (Resend Email From)</label><input name="emailFrom" placeholder="WFC Portal <noreply@wfc.or.tz>" value="${esc(s.emailFrom || "")}"></div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn sm" type="submit">Hifadhi Mipangilio</button>
          <button class="btn sm danger" type="button" onclick="clearDemoData()">Ondoa Data za Majaribio</button>
        </div>
        <div id="setMsg"></div>
      </form>
    </div>` : ""}

    ${isLeader(currentUser.role) ? `
    <div class="card">
      <h3>Kumbukumbu ya Ujumbe Uliotumwa (${outbox.length})</h3>
      <div class="table-wrap"><table><thead><tr><th>Njia</th><th>Mpokeaji</th><th>Kichwa</th><th>Hali</th><th>Maelezo</th></tr></thead>
      <tbody>${outbox.slice(0, 15).map(o => `<tr><td>${esc(o.channel)}</td><td>${esc(o.to)}</td><td>${esc(o.title)}</td><td><span class="badge ${o.status === "sent" ? "APPROVED" : "PENDING"}">${esc(o.status)}</span></td><td><small>${esc(o.detail || "")}</small></td></tr>`).join("") || `<tr><td colspan="5">Hakuna ujumbe uliotumwa bado</td></tr>`}</tbody></table></div>
    </div>` : ""}`);

  const df = document.getElementById("dispForm");
  if (df) df.onsubmit = async (e) => {
    e.preventDefault();
    const res = await api("/api/dispatch", "POST", Object.fromEntries(new FormData(e.target)));
    showMsg(document.getElementById("dispMsg"), res.detail, res.status === "failed");
  };
  const af = document.getElementById("apiSetForm");
  if (af) af.onsubmit = async (e) => {
    e.preventDefault();
    await api("/api/settings", "POST", Object.fromEntries(new FormData(e.target)));
    showMsg(document.getElementById("setMsg"), "Mipangilio imehifadhiwa.");
  };
}

async function toggle2fa(cb) {
  const res = await api("/api/toggle-2fa", "POST");
  cb.checked = res.twoFactor;
}

async function clearDemoData() {
  if (!confirm("Una uhakika unataka kufuta data zote za majaribio?")) return;
  await api("/api/demo/clear", "POST");
  navigate("dash");
}

async function logout() {
  await api("/api/logout", "POST");
  currentUser = null;
  renderLogin();
}

async function loadApp() {
  const params = new URLSearchParams(location.search);
  const resetToken = params.get("resetToken");
  if (resetToken) return renderResetPassword(resetToken);

  try {
    const me = await api("/api/me");
    if (!me.user) return location.hash === "#register" ? renderRegister() : renderLogin();
    currentUser = me.user;
    if (currentUser.status === "PENDING") {
      const d = await api("/api/dashboard");
      return renderPending(d.user);
    }
    navigate("dash");
  } catch {
    renderLogin();
  }
}

loadApp();
