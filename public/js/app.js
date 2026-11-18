const app = document.getElementById("app");

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[m]));
}

function safeUrl(u) {
  const s = String(u || "").trim();
  return (s.startsWith("/") || s.startsWith("https://") || s.startsWith("http://")) ? esc(s) : "#";
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
  logout: ico('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>'),
  shield: ico('<path d="M12 3l7 4v5c0 5-3.5 8.5-7 9-3.5-.5-7-4-7-9V7l7-4z"/><path d="M9 12l2 2 4-4"/>')
};

function isLeaderRole(role) {
  return ["ADMIN", "CHAIRPERSON", "SECRETARY", "TREASURER", "REGIONAL"].includes(role);
}

function showOtp(phone, devCode) {
  app.innerHTML = `<div class="auth-page">
    <div class="container">
      <img src="/wfc-logo.jpg" class="logo" alt="WFC">
      <h1>Thibitisha OTP</h1>
      <p class="subtitle">Ingiza msimbo wa tarakimu 6 uliotumwa kwako. Unaisha baada ya dakika 5.</p>
      ${devCode ? `<div class="payment-hint">SMS haijaunganishwa. Msimbo wa majaribio: <strong>${esc(devCode)}</strong></div>` : ""}
      <form id="f">
        <div class="form-group"><label>Msimbo wa OTP</label><input name="code" placeholder="000000" required></div>
        <button class="btn" type="submit">Thibitisha na Ingia</button>
        <div id="m"></div>
      </form>
    </div>
  </div>`;
  document.getElementById("f").onsubmit = async e => {
    e.preventDefault();
    const d = await api("/api/verify-otp", { method: "POST", body: { phone, code: new FormData(e.target).get("code") } });
    if (d.error) document.getElementById("m").innerHTML = `<div class="error">${esc(d.error)}</div>`;
    else showDash();
  };
}

function showLogin(isProd = true) {
  app.innerHTML = `<div class="auth-page">
    <div class="container">
      <div class="auth-topbar">
        <span class="kicker">WFC Portal</span>
        <button class="theme-toggle" onclick="toggleTheme()" type="button" aria-label="Badili mwanga">◐ Mandhari</button>
      </div>
      <img src="/wfc-logo.jpg" class="logo" alt="WFC Logo">
      <h1>Karibu WFC Portal</h1>
      <p class="subtitle">Umoja wa Wachagga, Nguvu ya Familia</p>
      <form id="f">
        <div class="form-group"><label>Namba ya Simu</label><input name="phone" placeholder="07XX XXX XXX" required></div>
        <div class="form-group"><label>Nenosiri</label><input name="password" type="password" placeholder="••••••••" required></div>
        <button class="btn" type="submit">Ingia kwenye Akaunti</button>
        <div id="m"></div>
      </form>
      <p class="link">Huna akaunti? <a href="#" id="r">Jisajili sasa</a> · <a href="/">Tovuti kuu</a></p>
      ${!isProd ? `<details class="demo-box"><summary>Akaunti za majaribio (Development)</summary>
        <p><strong>Mwenyekiti:</strong> 0700000000 / admin123</p>
        <p><strong>Mwanachama:</strong> 0711000001 / demo123</p>
        <p><strong>Mhazini:</strong> 0711000002 / demo123</p>
      </details>` : ""}
    </div>
  </div>`;
  document.getElementById("r").onclick = e => { e.preventDefault(); showRegister(); };
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
  app.innerHTML = `<div class="auth-page">
    <div class="container">
      <img src="/wfc-logo.jpg" class="logo" alt="WFC Logo">
      <h1>Usajili wa Mwanachama</h1>
      <p class="subtitle">Ada ya Usajili: <strong>TSh 1,000</strong></p>
      <div class="payment-hint">
        Lipa ada ya usajili kupitia M-Pesa <code>0755 000 888</code>, Tigo <code>0715 000 888</code>, Airtel <code>0785 000 888</code> au CRDB <code>0150889944200</code> kisha weka uthibitisho hapa chini.
      </div>
      <form id="f">
        <div class="form-group"><label>Jina Kamili</label><input name="name" placeholder="Mf. Amina Swai" required></div>
        <div class="form-row-2">
          <div class="form-group"><label>Namba ya Simu</label><input name="phone" placeholder="07XX XXX XXX" required></div>
          <div class="form-group"><label>Kanda</label><select name="region"><option>Dar es Salaam</option><option>Arusha</option><option>Moshi</option><option>Kilimanjaro</option><option>Tanga</option><option>Mwanza</option></select></div>
        </div>
        <div class="form-group"><label>Nenosiri (angalau herufi 6)</label><input name="password" type="password" minlength="6" placeholder="Unda nenosiri imara" required></div>
        <div class="form-group"><label>Uthibitisho wa Malipo (Namba ya Muamala)</label><textarea name="paymentProof" rows="2" placeholder="Weka namba ya muamala au ujumbe wa malipo"></textarea></div>
        <button class="btn" type="submit">Wasilisha Usajili</button>
        <div id="m"></div>
      </form>
      <p class="link">Tayari una akaunti? <a href="#" id="l">Rudi Kuingia</a></p>
    </div>
  </div>`;
  document.getElementById("l").onclick = e => { e.preventDefault(); showLogin(); };
  document.getElementById("f").onsubmit = async e => {
    e.preventDefault();
    const d = await api("/api/register", { method: "POST", body: Object.fromEntries(new FormData(e.target)) });
    document.getElementById("m").innerHTML = d.error ? `<div class="error">${esc(d.error)}</div>` : `<div class="success">${esc(d.message)}</div>`;
    if (d.success) setTimeout(() => showLogin(), 1200);
  };
}

async function showDash() {
  const me = await api("/api/me");
  if (!me.user) return showLogin(me.isProd);
  if (me.user.status === "PENDING") {
    app.innerHTML = `<div class="auth-page">
      <div class="container">
        <img src="/wfc-logo.jpg" class="logo" alt="WFC">
        <div style="text-align:center;margin-bottom:10px"><span class="badge badge-pending">Waiting Approval</span></div>
        <h1>Inasubiri Idhini</h1>
        <p class="subtitle">Habari <strong>${esc(me.user.name)}</strong></p>
        <div class="payment-hint" style="text-align:center">
          Usajili wako na malipo yamepokelewa. Tafadhali subiri viongozi waidhinishe akaunti yako na kukupatia WFC ID.
        </div>
        <button class="btn ghost" onclick="logout()">Toka nje</button>
      </div>
    </div>`;
    return;
  }

  window.__me = me.user;
  const role = me.user.role;
  const leader = isLeaderRole(role);
  const admin = role === "ADMIN";
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
      ["card", "Kitambulisho", IC.id],
      ["family", "Familia", IC.home2],
      ["directory", "Directory", IC.book],
      ["saccos", "SACCOS", IC.bank],
      ["elections", "Uchaguzi", IC.vote],
      ["attendance", "Mahudhurio", IC.cal],
      ["penalties", "Utaratibu & Faini", IC.shield],
      ["documents", "Nyaraka", IC.file],
      ["help", "Msaada", IC.life],
      ["notifications", "Taarifa", IC.bell],
      ["settings", "Akaunti & Usalama", IC.gear]
    ]]
  ];

  if (leader) {
    const officeItems = [
      ["pending", "Inasubiri Idhini", IC.clock],
      ["accounting", "Uhasibu", IC.coin],
      ["tickets", "Tiketi za Matukio", IC.cal],
      ["cases", "Kesi & Nidhamu", IC.case],
      ["assets", "Mali za Jumuiya", IC.box],
      ["projects", "Miradi", IC.flag],
      ["charts", "Grafu & Takwimu", IC.chart],
      ["messages", "Kituo cha Ujumbe", IC.mail],
      ["momo", "Malipo ya Simu", IC.phone]
    ];
    if (admin) {
      officeItems.push(["roles", "Majukumu (RBAC)", IC.key]);
    }
    groups.push(["Ofisi & Uongozi", officeItems]);
  }

  const collapsed = localStorage.getItem("wfc-sidebar-collapsed") === "1" ? "is-collapsed" : "";

  app.innerHTML = `<div class="layout ${collapsed}" id="layoutRoot">
    <div class="scrim" id="scrim"></div>
    <aside class="sidebar" id="side" aria-label="Menyu kuu">
      <div class="sidebar-header">
        <div class="sidebar-brand">
          <img src="/wfc-logo.jpg" alt="WFC">
          <div class="sidebar-brand-text">
            <strong>WFC Portal</strong>
            <span>Wachagga Family</span>
          </div>
        </div>
        <button class="collapse-btn" id="collapseBtn" type="button" aria-label="Kunja menyu">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
      </div>

      <div class="sidebar-scroll">
        ${groups.map(([label, items]) => `
          <div class="nav-label">${esc(label)}</div>
          ${items.map(([id, name, icon]) => `<a class="nav-item" data-p="${esc(id)}" title="${esc(name)}">${icon}<span class="nav-text">${esc(name)}</span></a>`).join("")}
        `).join("")}
      </div>

      <div class="sidebar-footer">
        <a class="nav-item logout-item" id="out" title="Toka nje">${IC.logout}<span class="nav-text">Toka nje</span></a>
      </div>
    </aside>

    <div class="main">
      <header class="topbar">
        <div class="topbar-left">
          <button class="menu-btn" id="menuBtn" type="button">Menyu</button>
          <div class="topbar-title-group">
            <strong id="pt">Dashibodi</strong>
            <span class="topbar-sub">Wachagga Family Community · Ofisi ya Kidijitali</span>
          </div>
        </div>
        <div class="topbar-actions">
          <button class="theme-toggle" onclick="toggleTheme()" type="button">◐ Mwanga</button>
          <div class="user-chip">
            <span class="user-chip-avatar">${esc(initials)}</span>
            <span class="user-chip-name">${esc(me.user.name)}</span>
            <span class="role-tag">${esc(me.user.role)}</span>
          </div>
        </div>
      </header>
      <main class="content" id="c"></main>
    </div>

    <nav class="tabbar" aria-label="Menyu ya haraka">
      <button type="button" data-p="home">${IC.home}<span>Nyumbani</span></button>
      <button type="button" data-p="payments">${IC.coin}<span>Michango</span></button>
      <button type="button" data-p="penalties">${IC.shield}<span>Utaratibu</span></button>
      <button type="button" id="moreBtn">${IC.meg}<span>Zaidi</span></button>
    </nav>
  </div>`;

  const layoutRoot = document.getElementById("layoutRoot");
  document.getElementById("collapseBtn").onclick = () => {
    layoutRoot.classList.toggle("is-collapsed");
    localStorage.setItem("wfc-sidebar-collapsed", layoutRoot.classList.contains("is-collapsed") ? "1" : "0");
    window.dispatchEvent(new Event("resize"));
  };

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
  document.querySelectorAll("[data-p]").forEach(el => el.onclick = () => { close(); load(el.dataset.p); });

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
  const me = window.__me || {};
  const leader = isLeaderRole(me.role);
  const admin = me.role === "ADMIN";
  const money = n => "TSh " + Number(n || 0).toLocaleString();

  const titles = {
    home: "Dashibodi", members: "Wanachama", payments: "Michango", events: "Matukio",
    announcements: "Matangazo", card: "Kitambulisho", family: "Familia", directory: "Directory",
    help: "Msaada", pending: "Inasubiri Idhini", attendance: "Mahudhurio", elections: "Uchaguzi",
    cases: "Kesi & Nidhamu", saccos: "SACCOS", assets: "Mali", projects: "Miradi",
    penalties: "Utaratibu na Faini", documents: "Nyaraka", charts: "Grafu na Takwimu",
    messages: "Kituo cha Ujumbe", momo: "Malipo ya Simu", settings: "Mipangilio & Usalama",
    roles: "Majukumu (RBAC)", notifications: "Taarifa", accounting: "Uhasibu",
    tickets: "Tiketi za Matukio"
  };
  document.getElementById("pt").textContent = titles[p] || p;
  document.querySelectorAll("[data-p]").forEach(el => el.classList.toggle("active", el.dataset.p === p));

  c.innerHTML = `<div class="stats">${[1, 2, 3, 4].map(() => `<div class="stat"><div class="skeleton" style="height:74px"></div></div>`).join("")}</div><div class="card"><div class="skeleton" style="height:220px"></div></div>`;

  if (p === "home") {
    const d = await api("/api/dashboard");
    const max = Math.max(...(d.regions || []).map(r => r.value), 1);
    const fin = d.finance;

    c.innerHTML = `
      <section class="hero-band">
        <div>
          <span class="pill">${esc(d.user.status)}</span>
          <h2>Karibu, ${esc(d.user.name)}</h2>
          <p>WFC ID: <strong>${esc(d.user.wfcId || "—")}</strong> · Kanda ya ${esc(d.user.region || "Tanzania")} · Jukumu: ${esc(d.user.role)}</p>
        </div>
        <div class="hero-contribution">
          <div class="kicker">Jumla Uliyochanga</div>
          <strong>${money(d.myTotalPaid)}</strong>
        </div>
      </section>

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
      <div class="stats">
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
          <div class="stat-label">Salio Halisi (Balance)</div>
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
          <div class="stat-desc">Faini ambazo hazijalipwa: ${money(fin.unpaidPenalties)}</div>
        </div>
      </div>` : ""}

      <div class="split">
        <div class="card">
          <div class="card-head">
            <h3>${fin ? "Mlinganisho wa Mapato na Matumizi" : "Mgawanyo wa Wanachama kwa Kanda"}</h3>
            <span class="badge badge-approved">Mubashara</span>
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
              <span><b>${esc(r.name)}</b><em>${r.value}</em></span>
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
                  <td><strong>${esc(x.userName || "Mwanachama")}</strong></td>
                  <td>${esc(x.type)}</td>
                  <td style="font-variant-numeric:tabular-nums;font-weight:600">${money(x.amount)}</td>
                  <td><span class="badge ${x.status === "APPROVED" ? "badge-approved" : "badge-pending"}">${x.status === "APPROVED" ? "Imeidhinishwa" : "Inasubiri"}</span></td>
                </tr>`).join("") || `<tr><td colspan="4" class="muted" style="text-align:center;padding:24px">Hakuna malipo yaliyorekodiwa bado</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>`;

    if (window.ApexCharts) {
      const base = apexBaseOptions();
      if (fin) {
        new ApexCharts(document.querySelector("#financeApexChart"), {
          ...base,
          chart: { ...base.chart, type: "donut", height: 270 },
          series: [fin.mapato || 0, fin.matumizi || 0, Math.max(0, fin.balance || 0)],
          labels: ["Mapato", "Matumizi", "Salio (Balance)"],
          colors: ["#F97316", "#EF4444", "#22C55E"],
          stroke: { width: 2, colors: ["var(--card)"] },
          plotOptions: { pie: { donut: { size: "68%" } } },
          yaxis: { labels: { formatter: v => "TSh " + Number(v).toLocaleString() } }
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
  }

  if (p === "penalties") {
    const policy = await api("/api/policy");
    const list = await api("/api/penalties");
    const members = admin ? await api("/api/members") : [];
    const pn = policy.paymentNumbers || {};

    c.innerHTML = `
      <div class="hero-band">
        <div>
          <span class="kicker">Kanuni & Taratibu Rasmi</span>
          <h2 style="font-size:1.35rem">Utaratibu wa Michango na Faini za WFC</h2>
          <p>Ada ya mwezi: <strong>${money(policy.monthlyFee)}</strong> (Siku za neema: kabla ya tarehe ${policy.penaltyGraceDays || 5}) · Faini ya kuchelewa: <strong>${money(policy.latePenalty)}</strong></p>
        </div>
        ${admin ? `<button class="btn btn-sm" type="button" id="batchPenaltyBtn">Toza Faini Waliochelewa Ada</button>` : ""}
      </div>

      ${admin ? `
      <div class="split" style="grid-template-columns:1.2fr 0.8fr">
        <div class="card">
          <div class="card-head">
            <h3>Weka Utaratibu na Viwango (Admin)</h3>
            <span class="badge badge-active">Admin Control</span>
          </div>
          <form id="policyForm">
            <div class="form-row-3">
              <div class="form-group"><label>Ada ya Usajili (TSh)</label><input name="registrationFee" type="number" value="${policy.registrationFee || 1000}" required></div>
              <div class="form-group"><label>Kiingilio (TSh)</label><input name="entryFee" type="number" value="${policy.entryFee || 50000}" required></div>
              <div class="form-group"><label>Ada ya Mwezi (TSh)</label><input name="monthlyFee" type="number" value="${policy.monthlyFee || 10000}" required></div>
            </div>
            <div class="form-row-3">
              <div class="form-group"><label>Mchango wa Dharura (TSh)</label><input name="emergencyFee" type="number" value="${policy.emergencyFee || 60000}" required></div>
              <div class="form-group"><label>Faini ya Kuchelewa (TSh)</label><input name="latePenalty" type="number" value="${policy.latePenalty || 2000}" required></div>
              <div class="form-group"><label>Siku ya Mwisho ya Mwezi (1-31)</label><input name="penaltyGraceDays" type="number" min="1" max="31" value="${policy.penaltyGraceDays || 5}" required></div>
            </div>
            <div class="form-row-2">
              <div class="form-group"><label>Namba ya M-Pesa</label><input name="mpesa" value="${esc(pn.mpesa || "")}"></div>
              <div class="form-group"><label>Namba ya Tigo Pesa</label><input name="tigo" value="${esc(pn.tigo || "")}"></div>
            </div>
            <div class="form-row-2">
              <div class="form-group"><label>Namba ya Airtel Money</label><input name="airtel" value="${esc(pn.airtel || "")}"></div>
              <div class="form-group"><label>Akaunti ya CRDB</label><input name="crdb" value="${esc(pn.crdb || "")}"></div>
            </div>
            <div class="form-group">
              <label>Utaratibu na Kanuni za Jumuiya (Zinaonekana kwa wanachama wote na ukurasa wa mbele)</label>
              <textarea name="rulesText" rows="5" required>${esc(policy.rulesText || "")}</textarea>
            </div>
            <button class="btn btn-sm" type="submit">Hifadhi Utaratibu na Viwango</button>
          </form>
        </div>

        <div class="card">
          <div class="card-head">
            <h3>Andika Faini kwa Mwanachama</h3>
            <span class="badge badge-suspended">Adhabu</span>
          </div>
          <form id="penf">
            <div class="form-group">
              <label>Chagua Mwanachama</label>
              <select name="userId">
                <option value="">-- Mwanachama / Jumla --</option>
                ${members.map(m => `<option value="${esc(m.id)}">${esc(m.name)} (${esc(m.wfcId || m.phone)})</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label>Sababu ya Faini</label>
              <input name="reason" placeholder="Mf. Kuchelewa ada ya mwezi / Kukosa mkutano" required>
            </div>
            <div class="form-group">
              <label>Kiasi cha Faini (TSh)</label>
              <input name="amount" type="number" value="${policy.latePenalty || 2000}" required>
            </div>
            <button class="btn btn-sm" type="submit">Toza Faini Sasa</button>
          </form>
        </div>
      </div>` : `
      <div class="card">
        <div class="card-head"><h3>Utaratibu na Kanuni za WFC</h3><span class="badge badge-approved">Rasmi</span></div>
        <div style="white-space:pre-line;line-height:1.7;color:var(--text)">${esc(policy.rulesText || "Hakuna utaratibu uliowekwa bado.")}</div>
        <div class="payment-hint" style="margin-top:16px">
          <strong>Viwango:</strong> Usajili ${money(policy.registrationFee)} · Kiingilio ${money(policy.entryFee)} · Ada ya Mwezi ${money(policy.monthlyFee)} · Dharura ${money(policy.emergencyFee)} · Faini ya Kuchelewa ${money(policy.latePenalty)}
        </div>
      </div>`}

      <div class="card">
        <div class="card-head">
          <h3>Daftari la Faini (${list.length})</h3>
          <span class="muted">${leader ? "Faini zote za wanachama" : "Faini zako"}</span>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Mwanachama</th><th>Sababu</th><th>Kiasi</th><th>Hali</th><th>Hatua</th></tr></thead>
            <tbody>
              ${list.map(x => `<tr>
                <td><strong>${esc(x.userName || "Mwanachama")}</strong> <span class="muted">${esc(x.wfcId || "")}</span></td>
                <td>${esc(x.reason)}</td>
                <td style="font-weight:700;font-variant-numeric:tabular-nums">${money(x.amount)}</td>
                <td><span class="badge ${x.status === "PAID" ? "badge-approved" : "badge-suspended"}">${x.status === "PAID" ? "Imelipwa" : "Haijalipwa"}</span></td>
                <td>${x.status !== "PAID" && (admin || ["TREASURER", "CHAIRPERSON"].includes(me.role)) ? `<button class="btn btn-sm" onclick="clearPenalty('${esc(x.id)}')">Thibitisha Malipo</button>` : "—"}</td>
              </tr>`).join("") || `<tr><td colspan="5" class="muted" style="text-align:center;padding:22px">Hakuna faini zilizorekodiwa</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>`;

    if (admin) {
      document.getElementById("policyForm").onsubmit = async e => {
        e.preventDefault();
        const raw = Object.fromEntries(new FormData(e.target));
        const body = {
          registrationFee: raw.registrationFee,
          entryFee: raw.entryFee,
          monthlyFee: raw.monthlyFee,
          emergencyFee: raw.emergencyFee,
          latePenalty: raw.latePenalty,
          penaltyGraceDays: raw.penaltyGraceDays,
          rulesText: raw.rulesText,
          paymentNumbers: {
            mpesa: raw.mpesa,
            tigo: raw.tigo,
            airtel: raw.airtel,
            crdb: raw.crdb
          }
        };
        const d = await api("/api/admin/policy", { method: "POST", body });
        if (d.error) alert(d.error);
        else { alert("Utaratibu na viwango vimehifadhiwa kikamilifu."); load("penalties"); }
      };

      document.getElementById("penf").onsubmit = async e => {
        e.preventDefault();
        const d = await api("/api/penalties", { method: "POST", body: Object.fromEntries(new FormData(e.target)) });
        if (d.error) alert(d.error);
        else load("penalties");
      };

      document.getElementById("batchPenaltyBtn").onclick = async () => {
        if (!confirm("Toza faini ya kuchelewa ada kwa wanachama wote hai wenye malimbikizo mwezi huu?")) return;
        const d = await api("/api/penalties/apply-late-batch", { method: "POST", body: {} });
        if (d.error) alert(d.error);
        else { alert(`Faini zimetozwa kwa wanachama ${d.count}.`); load("penalties"); }
      };
    }
  }

  if (p === "members") {
    const m = await api("/api/members");
    window.__members = m;
    c.innerHTML = `<div class="card" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
      <input id="memberSearch" placeholder="Tafuta jina, simu, kanda au WFC ID..." style="flex:1;min-width:220px">
      <span class="badge badge-active">${m.length} wanachama</span>
    </div>
    <div id="memberGrid" class="member-grid"></div>`;
    const render = (list) => {
      document.getElementById("memberGrid").innerHTML = list.map(x => {
        const ini = (x.name || "?").split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase();
        const cleanNum = String(x.phone || "").replace(/\D/g, "");
        const wa = cleanNum ? `https://wa.me/${cleanNum.startsWith("0") ? "255" + cleanNum.slice(1) : cleanNum}` : "#";
        return `<div class="member-card">
          <div class="avatar">${esc(ini)}</div>
          <div class="member-info">
            <strong>${esc(x.name)}</strong>
            <div class="muted">${esc(x.wfcId || "WFC-—")} · ${esc(x.region || "")}</div>
            <div class="muted">${esc(x.phone || "")}</div>
          </div>
          <span class="badge ${x.status === "ACTIVE" ? "badge-active" : x.status === "SUSPENDED" ? "badge-suspended" : "badge-pending"}">${x.status === "ACTIVE" ? "Hai" : x.status === "SUSPENDED" ? "Imesimamishwa" : "Inasubiri"}</span>
          <div class="member-actions">
            <a class="btn btn-sm ghost" href="${wa}" target="_blank" rel="noopener">WhatsApp</a>
            ${leader ? `<button class="btn btn-sm ghost" data-msg-phone="${esc(x.phone)}" data-msg-name="${esc(x.name)}">Ujumbe</button>` : ""}
            ${leader && x.status === "PENDING" ? `<button class="btn btn-sm" onclick="approve('${esc(x.id)}')">Idhinisha</button>` : ""}
            ${admin && x.id !== me.id ? `<button class="btn btn-sm ghost" onclick="suspendMember('${esc(x.id)}')">${x.status === "SUSPENDED" ? "Rejesha" : "Simamisha"}</button>` : ""}
            ${admin && x.id !== me.id ? `<button class="btn btn-sm danger-ghost" onclick="removeMember('${esc(x.id)}')">Ondoa</button>` : ""}
          </div>
        </div>`;
      }).join("") || `<div class="empty-state" style="grid-column:1/-1">Hakuna mwanachama aliyepatikana</div>`;

      document.querySelectorAll("[data-msg-phone]").forEach(btn => {
        btn.onclick = () => sendMsg(btn.dataset.msgPhone, btn.dataset.msgName);
      });
    };
    render(m);
    document.getElementById("memberSearch").oninput = e => {
      const q = e.target.value.toLowerCase();
      render(m.filter(x => (x.name || "").toLowerCase().includes(q) || (x.phone || "").includes(q) || (x.region || "").toLowerCase().includes(q) || (x.wfcId || "").toLowerCase().includes(q)));
    };
  }

  if (p === "payments") {
    const list = await api("/api/payments");
    const canApprovePay = ["ADMIN", "TREASURER", "CHAIRPERSON"].includes(me.role);
    window.__pays = list;
    c.innerHTML = `<div class="card">
      <div class="card-head"><h3>Wasilisha Malipo Mapya</h3><span class="kicker">M-Pesa · Tigo · Airtel · CRDB</span></div>
      <form id="pf">
        <div class="form-row-3">
          <div class="form-group"><label>Aina ya Mchango</label><select name="type"><option>Ada ya mwezi</option><option>Kiingilio</option><option>Dharura</option><option>Msiba</option><option>Faini</option></select></div>
          <div class="form-group"><label>Kiasi (TSh)</label><input name="amount" type="number" min="500" placeholder="10000" required></div>
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
              <td><strong>${esc(x.userName || "—")}</strong></td>
              <td>${esc(x.type)}</td>
              <td style="font-variant-numeric:tabular-nums;font-weight:600">${money(x.amount)}</td>
              <td><code>${esc(x.transactionId)}</code></td>
              <td><span class="badge ${x.status === "APPROVED" ? "badge-approved" : "badge-pending"}">${x.status === "APPROVED" ? esc(x.receiptNo || "Imethibitishwa") : "Inasubiri"}</span></td>
              <td>${x.status === "PENDING" && canApprovePay ? `<button class="btn btn-sm" onclick="approvePay('${esc(x.id)}')">Idhinisha</button>` : x.status === "APPROVED" ? `<button class="btn btn-sm ghost" onclick="downloadReceipt('${esc(x.id)}')">Pakua PDF</button>` : `<span class="muted">Inasubiri</span>`}</td>
            </tr>`).join("") || `<tr><td colspan="6" class="muted" style="text-align:center;padding:24px">Hakuna historia ya malipo</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>`;
    document.getElementById("pf").onsubmit = async e => {
      e.preventDefault();
      const d = await api("/api/submit-payment", { method: "POST", body: Object.fromEntries(new FormData(e.target)) });
      if (d.error) alert(d.error); else load("payments");
    };
  }

  if (p === "events") {
    const list = await api("/api/events");
    c.innerHTML = `${leader ? `<div class="card">
      <div class="card-head"><h3>Ongeza Tukio Jipya</h3></div>
      <form id="ef">
        <div class="form-row-2">
          <div class="form-group"><label>Aina ya Tukio</label><select name="type"><option>Msiba</option><option>Harusi</option><option>Festival</option><option>Tour</option><option>Mkutano</option></select></div>
          <div class="form-group"><label>Kichwa cha Tukio</label><input name="title" placeholder="Mf. WFC Festival" required></div>
        </div>
        <div class="form-row-3">
          <div class="form-group"><label>Eneo</label><input name="location" placeholder="Moshi / Dar es Salaam"></div>
          <div class="form-group"><label>Bei ya Tiketi (TSh)</label><input name="ticketPrice" type="number" value="0"></div>
          <div class="form-group"><label>Poster (picha ≤ 1.2MB)</label><input id="posterFile" type="file" accept="image/*"></div>
        </div>
        <button class="btn btn-sm" type="submit">Chapisha Tukio</button>
      </form>
    </div>` : ""}
    <div class="card">
      <div class="card-head"><h3>Orodha ya Matukio</h3><span class="muted">${list.length} matukio</span></div>
      ${list.map(e => `<div class="list-row">
        <div><strong>${esc(e.title)}</strong> <span class="badge badge-pending">${esc(e.type)}</span><div class="muted">${esc(e.location || "Eneo halijawekwa")}</div></div>
        <div style="display:flex;gap:10px;align-items:center">
          <strong style="font-variant-numeric:tabular-nums">${money(e.ticketPrice)}</strong>
          <a class="btn btn-sm ghost" href="/ticket/${esc(e.id)}">Kata Tiketi</a>
        </div>
      </div>`).join("") || `<div class="empty-state">Hakuna matukio yaliyorekodiwa</div>`}
    </div>`;
    if (leader) {
      document.getElementById("ef").onsubmit = async e => {
        e.preventDefault();
        const body = Object.fromEntries(new FormData(e.target));
        const file = document.getElementById("posterFile").files[0];
        if (file) {
          if (file.size > 1200000) { alert("Picha ni kubwa. Tumia chini ya 1.2 MB."); return; }
          body.poster = await new Promise(resolve => { const r = new FileReader(); r.onload = () => resolve(r.result); r.readAsDataURL(file); });
        }
        const d = await api("/api/events", { method: "POST", body });
        if (d.error) alert(d.error); else load("events");
      };
    }
  }

  if (p === "tickets") {
    const list = await api("/api/tickets");
    c.innerHTML = `<div class="card">
      <div class="card-head"><h3>Tiketi Zilizokatwa Mtandaoni</h3><span class="badge badge-pending">${list.length} tiketi</span></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Mnunuzi</th><th>Simu</th><th>Tukio</th><th>Idadi</th><th>Jumla</th><th>Muamala</th><th>Hali</th><th>Hatua</th></tr></thead>
          <tbody>
            ${list.map(t => `<tr>
              <td><strong>${esc(t.name)}</strong></td>
              <td>${esc(t.phone)}</td>
              <td>${esc(t.eventTitle || t.eventId)}</td>
              <td>${t.qty}</td>
              <td>${money(t.totalAmount)}</td>
              <td><code>${esc(t.transactionId)}</code></td>
              <td><span class="badge ${t.status === "APPROVED" ? "badge-approved" : "badge-pending"}">${t.status === "APPROVED" ? "Imethibitishwa" : "Inasubiri"}</span></td>
              <td>${t.status !== "APPROVED" ? `<button class="btn btn-sm" onclick="approveTicket('${esc(t.id)}')">Thibitisha</button>` : "—"}</td>
            </tr>`).join("") || `<tr><td colspan="8" class="muted" style="text-align:center;padding:24px">Hakuna tiketi zilizokatwa bado</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>`;
  }

  if (p === "announcements") {
    const list = await api("/api/announcements");
    c.innerHTML = `${leader ? `<div class="card">
      <div class="card-head"><h3>Tangazo Jipya</h3></div>
      <form id="af">
        <div class="form-row-2">
          <div class="form-group"><label>Kichwa</label><input name="title" required></div>
          <div class="form-group"><label>Kiungo (hiari)</label><input name="link" placeholder="/#matukio au https://..."></div>
        </div>
        <div class="form-group"><label>Ujumbe</label><textarea name="body" rows="3" required></textarea></div>
        <button class="btn btn-sm" type="submit">Chapisha Tangazo</button>
      </form>
    </div>` : ""}
    <div class="card">
      <div class="card-head"><h3>Matangazo Yaliyochapishwa</h3></div>
      ${list.map(a => `<div class="list-row" style="align-items:flex-start">
        <div>
          <strong>${esc(a.title)}</strong>
          <p style="margin:4px 0 6px;color:var(--text)">${esc(a.body)}</p>
          ${a.link ? `<a href="${safeUrl(a.link)}" style="color:var(--brand-orange);font-size:.82rem;font-weight:600">Fungua kiungo →</a>` : ""}
        </div>
        <span class="badge badge-active">${esc(a.author || "Ofisi")}</span>
      </div>`).join("") || `<div class="empty-state">Hakuna matangazo</div>`}
    </div>`;
    if (leader) {
      document.getElementById("af").onsubmit = async e => {
        e.preventDefault();
        const d = await api("/api/announcements", { method: "POST", body: Object.fromEntries(new FormData(e.target)) });
        if (d.error) alert(d.error); else load("announcements");
      };
    }
  }

  if (p === "card") {
    const d = await api("/api/dashboard");
    c.innerHTML = `<div class="card idcard" style="margin:0 auto;text-align:center">
      <img src="/wfc-logo.jpg" class="logo" alt="WFC">
      <h2>WFC Official Membership</h2>
      <p style="font-size:1.35rem;margin:6px 0 2px;color:var(--ink)"><strong>${esc(d.user.name)}</strong></p>
      <p style="font-weight:700;color:var(--brand-orange);margin:0 0 6px">${esc(d.user.wfcId || "WFC-PENDING")}</p>
      <p class="muted" style="margin:0 0 8px">${esc(d.user.region || "Tanzania")} · <span class="badge badge-active">${esc(d.user.status)}</span></p>
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
          <div class="form-group"><label>Mkuu wa Familia</label><input name="head" value="${esc(f.head || "")}"></div>
          <div class="form-group"><label>Mke / Mume</label><input name="spouse" value="${esc(f.spouse || "")}"></div>
        </div>
        <div class="form-group"><label>Watoto (tenganisha kwa koma)</label><input name="children" value="${esc((f.children || []).join(", "))}" placeholder="Mf. Nuru, Eli, Imani"></div>
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
        <div class="form-group" style="flex:1;min-width:220px;margin:0"><label>Taaluma / Kazi</label><input name="profession" placeholder="Mf. Mhandisi, Daktari, Mhasibu" required></div>
        <button class="btn btn-sm" type="submit">Hifadhi</button>
      </form>
    </div>
    <div class="card">
      <div class="card-head"><h3>Directory ya Wanachama</h3><span class="muted">${list.length} wataalamu</span></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Jina</th><th>Taaluma</th><th>Kanda</th><th>Simu</th></tr></thead>
          <tbody>${list.map(x => `<tr><td><strong>${esc(x.name)}</strong></td><td>${esc(x.profession)}</td><td>${esc(x.region)}</td><td>${esc(x.phone || "—")}</td></tr>`).join("") || `<tr><td colspan="4" class="muted" style="text-align:center;padding:20px">Hakuna taarifa bado</td></tr>`}</tbody>
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
      ${list.map(t => `<div class="list-row"><div><strong>${esc(t.subject)}</strong> <span class="muted">(${esc(t.userName || "")})</span><div class="muted">${esc(t.message || "")}</div></div><span class="badge badge-pending">${esc(t.status)}</span></div>`).join("") || `<div class="empty-state">Hakuna maombi ya msaada</div>`}
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
      ${list.map(a => `<div class="list-row"><strong>${esc(a.userName)}</strong><span class="badge badge-active">${esc(a.meeting)}</span></div>`).join("") || `<div class="empty-state">Hakuna mahudhurio bado</div>`}
    </div>`;
    document.getElementById("af").onsubmit = async e => { e.preventDefault(); await api("/api/attendance", { method: "POST", body: Object.fromEntries(new FormData(e.target)) }); load("attendance"); };
  }

  if (p === "elections") {
    const list = await api("/api/elections");
    c.innerHTML = `${leader ? `<div class="card">
      <div class="card-head"><h3>Fungua Nafasi ya Uchaguzi</h3></div>
      <form id="ef" style="display:flex;gap:10px;flex-wrap:wrap;align-items:end">
        <div class="form-group" style="flex:1;min-width:220px;margin:0"><label>Nafasi ya Uongozi</label><input name="position" placeholder="Mf. Mwenyekiti wa Kanda" required></div>
        <button class="btn btn-sm" type="submit">Fungua Uchaguzi</button>
      </form>
    </div>` : ""}
    ${list.map(e => {
      const counts = {};
      (e.votes || []).forEach(v => { counts[v.candidate] = (counts[v.candidate] || 0) + 1; });
      return `<div class="card">
        <div class="card-head">
          <div><h3>${esc(e.position)}</h3><span class="muted">Jumla ya kura: ${(e.votes || []).length}</span></div>
          <span class="badge badge-active">${esc(e.status)}</span>
        </div>
        ${(e.candidates || []).map(cand => `
          <div class="list-row">
            <div>
              <strong>${esc(cand.name)}</strong>
              <div class="muted">${esc(cand.manifesto || "Mgombea rasmi")}</div>
            </div>
            <div style="display:flex;gap:10px;align-items:center">
              <span class="badge badge-pending">${counts[cand.name] || 0} kura</span>
              ${!e.hasVoted ? `<button class="btn btn-sm" onclick="castVote('${esc(e.id)}','${esc(cand.name)}')">Piga Kura</button>` : ""}
            </div>
          </div>`).join("") || `<p class="muted">Hakuna wagombea walioongezwa bado.</p>`}
        ${e.hasVoted ? `<div class="success" style="margin-top:10px">Umeshapiga kura yako kwenye nafasi hii.</div>` : ""}
        ${leader ? `<form class="nomForm" data-eid="${esc(e.id)}" style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">
          <input name="name" placeholder="Jina la mgombea mpya" style="flex:1;min-width:160px" required>
          <input name="manifesto" placeholder="Ilani fupi (hiari)" style="flex:1;min-width:160px">
          <button class="btn btn-sm ghost" type="submit">+ Ongeza Mgombea</button>
        </form>` : ""}
      </div>`;
    }).join("") || `<div class="empty-state">Hakuna uchaguzi uliowekwa kwa sasa</div>`}`;

    if (leader && document.getElementById("ef")) {
      document.getElementById("ef").onsubmit = async e => {
        e.preventDefault();
        await api("/api/elections", { method: "POST", body: Object.fromEntries(new FormData(e.target)) });
        load("elections");
      };
    }
    document.querySelectorAll(".nomForm").forEach(f => {
      f.onsubmit = async e => {
        e.preventDefault();
        const body = Object.fromEntries(new FormData(f));
        body.electionId = f.dataset.eid;
        const d = await api("/api/elections/nominate", { method: "POST", body });
        if (d.error) alert(d.error); else load("elections");
      };
    });
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
      ${list.map(x => `<div class="list-row"><div><strong>${esc(x.title)}</strong><div class="muted">${esc(x.description || "")}</div></div><span class="badge badge-pending">${esc(x.status)}</span></div>`).join("") || `<div class="empty-state">Hakuna kesi zilizosajiliwa</div>`}
    </div>`;
    document.getElementById("cf").onsubmit = async e => { e.preventDefault(); await api("/api/cases", { method: "POST", body: Object.fromEntries(new FormData(e.target)) }); load("cases"); };
  }

  if (p === "saccos") {
    const d = await api("/api/saccos");
    c.innerHTML = `<div class="split" style="grid-template-columns:1fr 1fr">
      <div class="card">
        <div class="card-head"><h3>WFC SACCOS — Nunua Hisa</h3></div>
        <form id="sf" style="display:flex;gap:10px;flex-wrap:wrap;align-items:end">
          <div class="form-group" style="flex:1;min-width:180px;margin:0"><label>Kiasi cha Hisa (TSh)</label><input name="amount" type="number" min="1000" placeholder="50000" required></div>
          <button class="btn btn-sm" type="submit">Wasilisha Hisa</button>
        </form>
      </div>
      <div class="card">
        <div class="card-head"><h3>Omba Mkopo wa SACCOS</h3></div>
        <form id="lf">
          <div class="form-row-2">
            <div class="form-group"><label>Kiasi (TSh)</label><input name="amount" type="number" min="10000" placeholder="200000" required></div>
            <div class="form-group"><label>Lengo la Mkopo</label><input name="purpose" placeholder="Mf. Biashara / Dharura" required></div>
          </div>
          <button class="btn btn-sm" type="submit">Tuma Ombi la Mkopo</button>
        </form>
      </div>
    </div>
    <div class="split" style="grid-template-columns:1fr 1fr">
      <div class="card">
        <div class="card-head"><h3>Kumbukumbu za Hisa</h3><span class="muted">${(d.shares || []).length}</span></div>
        ${(d.shares || []).map(s => `<div class="list-row"><div><strong>${esc(s.userName || "Ununuzi wa Hisa")}</strong></div><span style="font-weight:700;color:var(--success-ink)">${money(s.amount)}</span></div>`).join("") || `<div class="empty-state">Hakuna hisa zilizorekodiwa bado</div>`}
      </div>
      <div class="card">
        <div class="card-head"><h3>Maombi ya Mikopo</h3><span class="muted">${(d.loans || []).length}</span></div>
        ${(d.loans || []).map(l => `<div class="list-row"><div><strong>${esc(l.userName || "Mkopo")}</strong><div class="muted">${esc(l.purpose || "")}</div></div><div><strong>${money(l.amount)}</strong> <span class="badge badge-pending">${esc(l.status)}</span></div></div>`).join("") || `<div class="empty-state">Hakuna maombi ya mikopo</div>`}
      </div>
    </div>`;
    document.getElementById("sf").onsubmit = async e => { e.preventDefault(); const r = await api("/api/saccos/shares", { method: "POST", body: Object.fromEntries(new FormData(e.target)) }); if (r.error) alert(r.error); else load("saccos"); };
    document.getElementById("lf").onsubmit = async e => { e.preventDefault(); const r = await api("/api/saccos/loans", { method: "POST", body: Object.fromEntries(new FormData(e.target)) }); if (r.error) alert(r.error); else load("saccos"); };
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
      <div class="card-head"><h3>Daftari la Mali za WFC</h3></div>
      ${list.map(a => `<div class="list-row"><div><strong>${esc(a.name)}</strong><div class="muted">${esc(a.location || "—")}</div></div><strong>${money(a.value)}</strong></div>`).join("") || `<div class="empty-state">Hakuna mali zilizosajiliwa</div>`}
    </div>`;
    document.getElementById("asf").onsubmit = async e => { e.preventDefault(); await api("/api/assets", { method: "POST", body: Object.fromEntries(new FormData(e.target)) }); load("assets"); };
  }

  if (p === "projects") {
    const list = await api("/api/projects");
    c.innerHTML = `<div class="card">
      <div class="card-head"><h3>Ongeza Mradi wa Maendeleo</h3></div>
      <form id="prf">
        <div class="form-row-2">
          <div class="form-group"><label>Jina la Mradi</label><input name="name" placeholder="Mf. WFC Queens / UTT AMIS" required></div>
          <div class="form-group"><label>Maendeleo (%)</label><input name="progress" type="number" value="0" min="0" max="100"></div>
        </div>
        <button class="btn btn-sm" type="submit">Hifadhi Mradi</button>
      </form>
    </div>
    <div class="card">
      <div class="card-head"><h3>Miradi ya Jumuiya</h3></div>
      ${list.map(pr => `<div class="bar-row"><span><b>${esc(pr.name)}</b><em>${Number(pr.progress) || 0}%</em></span><div class="track"><i style="width:${Math.min(100, Number(pr.progress) || 0)}%"></i></div></div>`).join("") || `<div class="empty-state">Hakuna miradi iliyowekwa</div>`}
    </div>`;
    document.getElementById("prf").onsubmit = async e => { e.preventDefault(); await api("/api/projects", { method: "POST", body: Object.fromEntries(new FormData(e.target)) }); load("projects"); };
  }

  if (p === "documents") {
    const list = await api("/api/documents");
    const constitution = list.find(d => (d.title || "").toLowerCase().includes("katiba")) || { title: "Katiba ya WFC", url: "#", summary: "Sheria, kanuni na misingi mikuu ya Wachagga Family Community." };
    c.innerHTML = `<div class="hero-band">
      <div>
        <span class="kicker">Nyaraka Kuu</span>
        <h2 style="font-size:1.3rem">${esc(constitution.title)}</h2>
        <p>${esc(constitution.summary || "Soma katiba ili ujue haki na wajibu wako kama mwanachama.")}</p>
      </div>
      <a class="btn btn-sm" href="${safeUrl(constitution.url)}" target="_blank" rel="noopener">Soma Katiba →</a>
    </div>
    <div class="card">
      <div class="card-head"><h3>Maktaba ya Nyaraka</h3></div>
      <div class="doc-list">${list.filter(d => d !== constitution).map(d => `<div class="doc-item"><strong>${esc(d.title)}</strong><div class="muted" style="margin:4px 0">${esc(d.summary || "")}</div><a href="${safeUrl(d.url)}" target="_blank" rel="noopener" style="color:var(--brand-orange);font-weight:600;font-size:.84rem">Fungua nyaraka →</a></div>`).join("") || `<div class="empty-state">Hakuna nyaraka nyingine</div>`}</div>
    </div>
    ${leader ? `<div class="card">
      <div class="card-head"><h3>Ongeza Nyaraka Mpya</h3></div>
      <form id="docf">
        <div class="form-row-2">
          <div class="form-group"><label>Jina la Nyaraka</label><input name="title" required></div>
          <div class="form-group"><label>Kiungo (URL)</label><input name="url" placeholder="https://..."></div>
        </div>
        <div class="form-group"><label>Maelezo mafupi</label><input name="summary"></div>
        <button class="btn btn-sm" type="submit">Hifadhi Nyaraka</button>
      </form>
    </div>` : ""}`;
    if (leader) {
      document.getElementById("docf").onsubmit = async e => { e.preventDefault(); await api("/api/documents", { method: "POST", body: Object.fromEntries(new FormData(e.target)) }); load("documents"); };
    }
  }

  if (p === "pending") {
    const m = await api("/api/members");
    const pen = m.filter(x => x.status === "PENDING");
    c.innerHTML = `<div class="card">
      <div class="card-head"><h3>Maombi Yanayosubiri Idhini</h3><span class="badge badge-pending">${pen.length} wanasubiri</span></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Jina</th><th>Simu</th><th>Kanda</th><th>Uthibitisho wa Malipo</th><th>Hatua</th></tr></thead>
          <tbody>
            ${pen.map(x => `<tr><td><strong>${esc(x.name)}</strong></td><td>${esc(x.phone)}</td><td>${esc(x.region)}</td><td><code>${esc(x.paymentProof || "—")}</code></td><td><button class="btn btn-sm" onclick="approve('${esc(x.id)}')">Idhinisha Mwanachama</button></td></tr>`).join("") || `<tr><td colspan="5" class="muted" style="text-align:center;padding:24px">Hakuna maombi yanayosubiri</td></tr>`}
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
    const contacts = await api("/api/contacts");
    c.innerHTML = `<div class="card">
      <div class="card-head"><h3>Tuma Ujumbe kwa Mwanachama</h3></div>
      <form id="mf">
        <div class="form-row-2">
          <div class="form-group"><label>Kituo cha Mawasiliano</label><select name="channel"><option value="sms">SMS</option><option value="whatsapp">WhatsApp</option><option value="email">Barua pepe</option></select></div>
          <div class="form-group"><label>Mpokeaji</label><select name="to">${members.map(m => `<option value="${esc(m.phone)}">${esc(m.name)} · ${esc(m.phone)}</option>`).join("")}</select></div>
        </div>
        <div class="form-group"><label>Kichwa</label><input name="title" required></div>
        <div class="form-group"><label>Ujumbe</label><textarea name="body" rows="3" required></textarea></div>
        <button class="btn btn-sm" type="submit">Tuma Ujumbe</button>
      </form>
    </div>
    <div class="split" style="grid-template-columns:1fr 1fr">
      <div class="card">
        <div class="card-head"><h3>Ujumbe Kutoka Tovuti Kuu (${contacts.length})</h3></div>
        ${(contacts || []).map(ct => `<div class="list-row" style="align-items:flex-start"><div><strong>${esc(ct.name)}</strong> (${esc(ct.phone)})<div class="muted">${esc(ct.message)}</div></div><span class="badge badge-pending">Tovuti</span></div>`).join("") || `<div class="empty-state">Hakuna ujumbe kutoka tovuti kuu</div>`}
      </div>
      <div class="card">
        <div class="card-head"><h3>Kumbukumbu za Ujumbe (Outbox)</h3></div>
        ${(box || []).map(n => `<div class="list-row"><div><strong>${esc(n.channel.toUpperCase())}</strong> → ${esc(n.to)}<div class="muted">${esc(n.body || "")}</div><small class="muted">${esc(n.detail || "")}</small></div><span class="badge badge-approved">${esc(n.status)}</span></div>`).join("") || `<div class="empty-state">Hakuna ujumbe uliotumwa</div>`}
      </div>
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
    </div>`;
    document.getElementById("sk").onsubmit = async e => { e.preventDefault(); const d = await api("/api/stk", { method: "POST", body: Object.fromEntries(new FormData(e.target)) }); document.getElementById("skm").textContent = d.detail || ""; };
  }

  if (p === "settings") {
    const d = await api("/api/dashboard");
    const s = d.settings || {};
    c.innerHTML = `<div class="split" style="grid-template-columns:1fr 1fr">
      <div class="card">
        <div class="card-head"><h3>Usalama wa OTP (2FA)</h3></div>
        <p class="muted">Washa au zima uthibitisho wa msimbo wa OTP wakati wa kuingia kwenye akaunti yako.</p>
        <button class="btn btn-sm" id="tfa" type="button">Washa / Zima OTP</button>
        <p id="tfam" class="muted" style="margin-top:10px"></p>
      </div>
      <div class="card">
        <div class="card-head"><h3>Badili Nenosiri</h3></div>
        <form id="pwf">
          <div class="form-group"><label>Nenosiri la Sasa</label><input name="currentPassword" type="password" required></div>
          <div class="form-group"><label>Nenosiri Jipya (angalau herufi 6)</label><input name="newPassword" type="password" minlength="6" required></div>
          <button class="btn btn-sm" type="submit">Sasisha Nenosiri</button>
        </form>
      </div>
    </div>
    ${admin ? `
    <div class="card">
      <div class="card-head"><h3>Backup & Data ya Majaribio (Admin)</h3></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <a class="btn btn-sm ghost" href="/api/backup">Pakua Backup ya JSON</a>
        <button class="btn btn-sm danger-ghost" id="cleardemo" type="button">Ondoa Data ya Majaribio (Demo)</button>
      </div>
    </div>
    <div class="card">
      <div class="card-head"><h3>Funguo za Huduma (API Integrations)</h3></div>
      <form id="sf">
        <div class="form-row-2">
          <div class="form-group"><label>Africa's Talking Username</label><input name="smsUsername" value="${esc(s.smsUsername || "")}"></div>
          <div class="form-group"><label>SMS API Key</label><input name="smsKey" type="password" value="${esc(s.smsKey || "")}"></div>
        </div>
        <div class="form-row-2">
          <div class="form-group"><label>WhatsApp Token</label><input name="whatsappToken" type="password" value="${esc(s.whatsappToken || "")}"></div>
          <div class="form-group"><label>WhatsApp Phone ID</label><input name="whatsappPhoneId" value="${esc(s.whatsappPhoneId || "")}"></div>
        </div>
        <div class="form-row-3">
          <div class="form-group"><label>M-Pesa Consumer Key</label><input name="momoConsumerKey" value="${esc(s.momoConsumerKey || "")}"></div>
          <div class="form-group"><label>M-Pesa Consumer Secret</label><input name="momoConsumerSecret" type="password" value="${esc(s.momoConsumerSecret || "")}"></div>
          <div class="form-group"><label>Shortcode</label><input name="momoShortcode" value="${esc(s.momoShortcode || "")}"></div>
        </div>
        <button class="btn btn-sm" type="submit">Hifadhi Mipangilio</button>
      </form>
    </div>` : ""}`;
    document.getElementById("tfa").onclick = async () => { const r = await api("/api/toggle-2fa", { method: "POST", body: {} }); document.getElementById("tfam").textContent = r.twoFactor ? "OTP imewashwa." : "OTP imezimwa."; };
    document.getElementById("pwf").onsubmit = async e => { e.preventDefault(); const r = await api("/api/change-password", { method: "POST", body: Object.fromEntries(new FormData(e.target)) }); alert(r.error || "Nenosiri limebadilishwa kikamilifu."); if (r.success) e.target.reset(); };
    if (admin) {
      document.getElementById("cleardemo").onclick = async () => { const r = await api("/api/demo/clear", { method: "POST", body: {} }); alert(r.error || "Data ya majaribio imeondolewa."); };
      document.getElementById("sf").onsubmit = async e => { e.preventDefault(); const r = await api("/api/settings", { method: "POST", body: Object.fromEntries(new FormData(e.target)) }); alert(r.error || "Mipangilio imehifadhiwa"); };
    }
  }

  if (p === "roles") {
    const members = await api("/api/members");
    const roles = await api("/api/roles");
    c.innerHTML = `<div class="card">
      <div class="card-head"><h3>Usimamizi wa Viongozi (RBAC)</h3><span class="badge badge-active">${admin ? "Admin Access" : "Tazama tu"}</span></div>
      <div class="form-group"><input id="roleSearch" placeholder="Tafuta jina au namba ya simu..."></div>
      <div id="roleList">${members.map(m => `
        <div class="role-row list-row" data-name="${esc(m.name.toLowerCase())}" data-phone="${esc(m.phone)}">
          <div><strong>${esc(m.name)}</strong><div class="muted">${esc(m.phone)} · ${esc(m.wfcId || "—")}</div></div>
          <div style="display:flex;gap:8px;align-items:center">
            ${admin ? `<select class="role-select" data-id="${esc(m.id)}" style="width:auto">${roles.map(r => `<option ${r === m.role ? "selected" : ""}>${esc(r)}</option>`).join("")}</select><button class="btn btn-sm" data-save="${esc(m.id)}">Hifadhi</button>` : `<span class="badge badge-approved">${esc(m.role)}</span>`}
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
    if (admin) {
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
    c.innerHTML = `${leader ? `<div class="card">
      <div class="card-head"><h3>Tuma Taarifa kwa Wanachama</h3></div>
      <form id="nf">
        <div class="form-group"><label>Kichwa cha Taarifa</label><input name="title" required></div>
        <div class="form-group"><label>Ujumbe</label><textarea name="body" rows="3" required></textarea></div>
        <button class="btn btn-sm" type="submit">Tuma kwa Wote</button>
      </form>
    </div>` : ""}
    <div class="card">
      <div class="card-head"><h3>Taarifa Zilizopo</h3></div>
      ${(list || []).map(n => `<div class="list-row" style="align-items:flex-start"><div><strong>${esc(n.title)}</strong><p style="margin:4px 0 0;color:var(--text)">${esc(n.body)}</p></div><span class="badge badge-active">Taarifa</span></div>`).join("") || `<div class="empty-state">Hakuna taarifa</div>`}
    </div>`;
    if (leader) {
      document.getElementById("nf").onsubmit = async e => { e.preventDefault(); const d = await api("/api/notifications", { method: "POST", body: { ...Object.fromEntries(new FormData(e.target)), userId: "all" } }); if (d.error) alert(d.error); else load("notifications"); };
    }
  }

  if (p === "accounting") {
    const sum = await api("/api/accounting/summary");
    const debts = await api("/api/accounting/debts");
    const expenses = await api("/api/expenses");
    const income = await api("/api/manual-income");
    const canEdit = ["ADMIN", "TREASURER", "CHAIRPERSON"].includes(me.role);
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
          <tbody>${debts.map(d => `<tr><td><strong>${esc(d.name)}</strong></td><td>${esc(d.region || "—")}</td><td style="font-weight:700;color:var(--error-ink)">${money(d.debt)}</td></tr>`).join("") || `<tr><td colspan="3" class="muted" style="text-align:center;padding:20px">Hakuna madeni</td></tr>`}</tbody>
        </table>
      </div>
    </div>
    <div class="split" style="grid-template-columns:1fr 1fr">
      <div class="card">
        <div class="card-head"><h3>Kumbukumbu za Matumizi</h3></div>
        ${expenses.map(e => `<div class="list-row"><div><strong>${esc(e.title)}</strong><div class="muted">${esc(e.category || "")}</div></div><strong>${money(e.amount)}</strong></div>`).join("") || `<div class="empty-state">Hakuna matumizi</div>`}
      </div>
      <div class="card">
        <div class="card-head"><h3>Mapato ya Ziada</h3></div>
        ${income.map(i => `<div class="list-row"><div><strong>${esc(i.title)}</strong><div class="muted">${esc(i.source || "")}</div></div><strong>${money(i.amount)}</strong></div>`).join("") || `<div class="empty-state">Hakuna mapato ya ziada</div>`}
      </div>
    </div>`;
    if (canEdit) {
      document.getElementById("expf").onsubmit = async e => { e.preventDefault(); const d = await api("/api/expenses", { method: "POST", body: Object.fromEntries(new FormData(e.target)) }); if (d.error) alert(d.error); else load("accounting"); };
      document.getElementById("incf").onsubmit = async e => { e.preventDefault(); const d = await api("/api/manual-income", { method: "POST", body: Object.fromEntries(new FormData(e.target)) }); if (d.error) alert(d.error); else load("accounting"); };
    }
  }
}

async function downloadReceipt(id) {
  const row = (window.__pays || []).find(x => x.id === id);
  if (!row) return;
  const payload = JSON.stringify({ org: "WFC", receipt: row.receiptNo, name: row.userName, type: row.type, amount: row.amount, tx: row.transactionId });
  const qr = await QRCode.toDataURL(payload, { margin: 1, width: 220 });
  const doc = new jspdf.jsPDF();
  doc.setFillColor(17, 24, 39);
  doc.rect(0, 0, 210, 28, "F");
  doc.setTextColor(249, 115, 22);
  doc.setFontSize(16);
  doc.text("WACHAGGA FAMILY COMMUNITY", 14, 12);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.text("Risiti Rasmi ya Malipo", 14, 20);
  doc.setTextColor(17, 24, 39);
  doc.setFontSize(12);
  doc.text(row.receiptNo || "Risiti", 14, 42);
  ["Jina: " + (row.userName || ""), "Aina: " + row.type, "Kiasi: TSh " + Number(row.amount).toLocaleString(), "Muamala: " + row.transactionId].forEach((line, i) => doc.text(line, 14, 54 + i * 8));
  doc.addImage(qr, "PNG", 140, 36, 50, 50);
  doc.save((row.receiptNo || "risiti") + ".pdf");
}

async function approve(id) {
  const d = await api("/api/approve-member", { method: "POST", body: { userId: id } });
  if (d.success) { alert("Imeidhinishwa: " + d.wfcId); load("members"); } else alert(d.error || "Imeshindwa");
}
async function approvePay(id) {
  const d = await api("/api/approve-payment", { method: "POST", body: { paymentId: id } });
  if (d.success) { alert("Imeidhinishwa. Risiti: " + d.receiptNo); load("payments"); } else alert(d.error || "Imeshindwa");
}
async function approveTicket(id) {
  const d = await api("/api/tickets/approve", { method: "POST", body: { ticketId: id } });
  if (d.success) load("tickets"); else alert(d.error || "Imeshindwa");
}
async function clearPenalty(id) {
  const d = await api("/api/penalties/pay", { method: "POST", body: { penaltyId: id } });
  if (d.success) load("penalties"); else alert(d.error || "Imeshindwa");
}
async function castVote(electionId, candidate) {
  if (!confirm(`Thibitisha kura yako kwa ${candidate}?`)) return;
  const d = await api("/api/elections/vote", { method: "POST", body: { electionId, candidate } });
  if (d.error) alert(d.error); else load("elections");
}
async function suspendMember(id) {
  if (!confirm("Badili hali ya usimamisho wa mwanachama huyu?")) return;
  const d = await api("/api/suspend-member", { method: "POST", body: { userId: id } });
  if (d.success) load("members"); else alert(d.error || "Imeshindwa");
}
async function removeMember(id) {
  if (!confirm("Ondoa mwanachama huyu kabisa?")) return;
  const d = await api("/api/remove-member", { method: "POST", body: { userId: id } });
  if (d.success) load("members"); else alert(d.error || "Imeshindwa");
}
async function sendMsg(phone, name) {
  const msg = prompt("Andika ujumbe kwa " + name + ":");
  if (!msg) return;
  const d = await api("/api/dispatch", { method: "POST", body: { channel: "sms", to: phone, title: "Ujumbe kutoka WFC", body: msg } });
  alert(d.detail || "Ujumbe umetumwa.");
}
async function logout() {
  await api("/api/logout", { method: "POST" });
  showLogin();
}

(async () => {
  const me = await api("/api/me");
  if (me.user) showDash();
  else showLogin(me.isProd);
})();
