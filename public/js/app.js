const app = document.getElementById("app");

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
  return `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="18" height="18">${d}</svg>`;
}

const IC = {
  home: ico('<path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z"/>'),
  users: ico('<path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9.5" cy="7" r="3"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 4.13a3 3 0 0 1 0 5.75"/>'),
  coin: ico('<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/><path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/>'),
  cal: ico('<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/>'),
  meg: ico('<path d="M4 10v4a2 2 0 0 0 2 2h2l5 4V4L8 8H6a2 2 0 0 0-2 2z"/><path d="M16 9a4 4 0 0 1 0 6"/>'),
  clock: ico('<circle cx="12" cy="12" r="8"/><path d="M12 8v5l3 2"/>'),
  gear: ico('<circle cx="12" cy="12" r="3"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4"/>'),
  logout: ico('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>')
};

function showLogin() {
  app.innerHTML = `<div class="auth-page">
    <div class="container">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <span class="kicker" style="margin:0">WFC Portal</span>
        <button class="btn btn-sm ghost" onclick="toggleTheme()" type="button">◐ Mandhari</button>
      </div>
      <img src="/wfc-logo.jpg" class="logo" alt="WFC Logo">
      <h1>Karibu WFC Portal</h1>
      <p class="subtitle">Umoja wa Wachagga, Nguvu ya Familia</p>
      <form id="f">
        <div class="form-group"><label>Namba ya Simu</label><input name="phone" placeholder="07XX XXX XXX" required></div>
        <div class="form-group"><label>Nenosiri</label><input name="password" type="password" placeholder="••••••••" required></div>
        <button class="btn btn-block" type="submit">Ingia kwenye Akaunti</button>
        <div id="m"></div>
      </form>
      <p style="text-align:center;margin-top:18px;font-size:0.88rem">Huna akaunti? <a href="#" id="r" style="color:var(--brand-orange);font-weight:600">Jisajili sasa</a> · <a href="/" style="color:var(--brand-orange);font-weight:600">Tovuti kuu</a></p>
      <details style="margin-top:16px;border:1px dashed var(--border-strong);padding:10px 14px;border-radius:12px;font-size:0.82rem;color:var(--muted)">
        <summary style="cursor:pointer;font-weight:600;color:var(--ink)">Akaunti ya Mwenyekiti (Chaguo-msingi)</summary>
        <p style="margin:6px 0 0"><strong>Simu:</strong> 0700000000 &nbsp;|&nbsp; <strong>Nenosiri:</strong> admin123</p>
      </details>
    </div>
  </div>`;
  document.getElementById("r").onclick = e => { e.preventDefault(); showRegister(); };
  document.getElementById("f").onsubmit = async e => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.target));
    const d = await api("/api/login", { method: "POST", body });
    if (d.error) document.getElementById("m").innerHTML = `<div class="error">${d.error}</div>`;
    else showDash();
  };
}

function showRegister() {
  app.innerHTML = `<div class="auth-page">
    <div class="container">
      <img src="/wfc-logo.jpg" class="logo" alt="WFC Logo">
      <h1>Usajili wa Mwanachama</h1>
      <p class="subtitle">Jiunge na Wachagga Family Community</p>
      <form id="f">
        <div class="form-group"><label>Jina Kamili</label><input name="name" placeholder="Mf. Amina Swai" required></div>
        <div class="form-row-2">
          <div class="form-group"><label>Namba ya Simu</label><input name="phone" placeholder="07XX XXX XXX" required></div>
          <div class="form-group"><label>Kanda</label><select name="region"><option>Dar es Salaam</option><option>Arusha</option><option>Moshi</option><option>Kilimanjaro</option><option>Mwanza</option><option>Dodoma</option></select></div>
        </div>
        <div class="form-group"><label>Nenosiri</label><input name="password" type="password" placeholder="Unda nenosiri imara" required></div>
        <button class="btn btn-block" type="submit">Wasilisha Usajili</button>
        <div id="m"></div>
      </form>
      <p style="text-align:center;margin-top:16px;font-size:0.88rem">Tayari una akaunti? <a href="#" id="l" style="color:var(--brand-orange);font-weight:600">Rudi Kuingia</a></p>
    </div>
  </div>`;
  document.getElementById("l").onclick = e => { e.preventDefault(); showLogin(); };
  document.getElementById("f").onsubmit = async e => {
    e.preventDefault();
    const d = await api("/api/register", { method: "POST", body: Object.fromEntries(new FormData(e.target)) });
    document.getElementById("m").innerHTML = d.error ? `<div class="error">${d.error}</div>` : `<div class="success">${d.message}</div>`;
    if (d.success) setTimeout(showLogin, 1500);
  };
}

async function showDash() {
  const me = await api("/api/me");
  if (!me.user) return showLogin();
  window.__me = me.user;
  const initials = (me.user.name || "W").split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase();

  const groups = [
    ["Kila siku", [
      ["home", "Dashibodi", IC.home],
      ["members", "Wanachama", IC.users],
      ["payments", "Michango & Risiti", IC.coin],
      ["events", "Matukio", IC.cal],
      ["announcements", "Matangazo", IC.meg]
    ]],
    ["Ofisi & Uongozi", [
      ["pending", "Inasubiri Idhini", IC.clock],
      ["accounting", "Uhasibu & Fedha", IC.coin],
      ["settings", "Mipangilio", IC.gear]
    ]]
  ];

  app.innerHTML = `<div class="layout" id="layoutRoot">
    <aside class="sidebar" id="side" aria-label="Menyu kuu">
      <div class="sidebar-header">
        <div style="display:flex;align-items:center;gap:11px">
          <img src="/wfc-logo.jpg" alt="WFC" style="width:38px;height:38px;border-radius:11px;object-fit:cover">
          <div><strong style="font-size:0.95rem">WFC Portal</strong><br><span style="font-size:0.72rem;color:var(--brand-orange);font-weight:600">PostgreSQL Live</span></div>
        </div>
      </div>
      <div class="sidebar-scroll">
        ${groups.map(([label, items]) => `
          <div class="nav-label">${label}</div>
          ${items.map(([id, name, icon]) => `<a class="nav-item" data-p="${id}">${icon}<span>${name}</span></a>`).join("")}
        `).join("")}
      </div>
      <div style="padding:12px;border-top:1px solid var(--border)">
        <a class="nav-item" id="out" style="color:var(--error-ink)">${IC.logout}<span>Toka nje</span></a>
      </div>
    </aside>
    <div class="main">
      <header class="topbar">
        <div style="display:flex;align-items:center;gap:12px">
          <button class="btn btn-sm ghost" onclick="document.getElementById('side').classList.toggle('open')" type="button">☰</button>
          <div style="display:flex;flex-direction:column">
            <strong id="pt" style="font-size:1.12rem">DASHIBODI</strong>
            <span style="font-size:0.75rem;color:var(--muted)">Wachagga Family Community · Ofisi ya Kidijitali</span>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:10px">
          <button class="btn btn-sm ghost" onclick="toggleTheme()" type="button">◐ Mandhari</button>
          <div style="display:inline-flex;align-items:center;gap:8px;padding:5px 12px 5px 6px;background:var(--bg);border:1px solid var(--border);border-radius:999px">
            <div style="width:28px;height:28px;border-radius:50%;background:var(--brand-gradient);color:#fff;display:grid;place-items:center;font-size:0.75rem;font-weight:700">${initials}</div>
            <span style="font-weight:600;font-size:0.85rem">${me.user.name}</span>
          </div>
        </div>
      </header>
      <main class="content" id="c"></main>
    </div>
  </div>`;

  document.getElementById("out").onclick = logout;
  document.querySelectorAll("[data-p]").forEach(el => el.onclick = () => {
    document.getElementById("side").classList.remove("open");
    load(el.dataset.p);
  });
  load("home");
}

async function load(p) {
  const c = document.getElementById("c");
  const titles = {
    home: "DASHIBODI",
    members: "WANACHAMA",
    payments: "MICHANGO & RISITI",
    events: "MATUKIO",
    announcements: "MATANGAZO",
    pending: "INASUBIRI IDHINI",
    accounting: "UHASIBU & FEDHA",
    settings: "MIPANGILIO"
  };
  document.getElementById("pt").textContent = titles[p] || p.toUpperCase();
  document.querySelectorAll("[data-p]").forEach(el => el.classList.toggle("active", el.dataset.p === p));
  const money = n => "TSh " + Number(n || 0).toLocaleString();

  if (p === "home") {
    const d = await api("/api/dashboard");
    c.innerHTML = `
      <div class="card" style="border-left:4px solid var(--brand-orange);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px">
        <div>
          <span class="kicker">Kitambulisho cha Kidijitali</span>
          <h2 style="margin-bottom:6px">Karibu, ${d.user.name}</h2>
          <p class="muted" style="margin:0">WFC ID: <strong>${d.user.wfcId || "Inasubiri"}</strong> · Kanda: <strong>${d.user.region || "Tanzania"}</strong> · Jukumu: <span class="badge badge-active">${d.user.role}</span></p>
        </div>
        <div id="idQrBox" style="background:#fff;padding:8px;border-radius:12px;border:1px solid var(--border)"></div>
      </div>
      <div class="stats">
        <div class="stat"><div class="muted" style="font-size:0.82rem">Wanachama Hai</div><div style="font-size:1.65rem;font-weight:700;margin-top:4px">${d.stats.members}</div></div>
        <div class="stat"><div class="muted" style="font-size:0.82rem">Inasubiri Idhini</div><div style="font-size:1.65rem;font-weight:700;margin-top:4px;color:var(--brand-orange)">${d.stats.pending}</div></div>
        <div class="stat"><div class="muted" style="font-size:0.82rem">Salio la Mfuko</div><div style="font-size:1.45rem;font-weight:700;margin-top:4px;color:var(--success-ink)">${money(d.finance.balance)}</div></div>
        <div class="stat"><div class="muted" style="font-size:0.82rem">Matukio Hai</div><div style="font-size:1.65rem;font-weight:700;margin-top:4px">${d.stats.events}</div></div>
      </div>
      <div class="card">
        <h3>Miamala ya Hivi Karibuni</h3>
        <div class="table-wrap" style="margin-top:12px"><table>
          <thead><tr><th>Mwanachama</th><th>Aina</th><th>Kiasi</th><th>Hali</th><th>Risiti</th></tr></thead>
          <tbody>${d.recent.length ? d.recent.map(x => `<tr>
            <td><strong>${x.userName || "—"}</strong></td>
            <td>${x.type}</td>
            <td>${money(x.amount)}</td>
            <td><span class="badge ${x.status === "APPROVED" ? "badge-approved" : "badge-pending"}">${x.status}</span></td>
            <td>${x.receiptUrl ? `<a href="${x.receiptUrl}" target="_blank" style="color:var(--brand-orange);font-weight:600">Pakua PDF</a>` : "—"}</td>
          </tr>`).join("") : `<tr><td colspan="5" style="text-align:center;color:var(--muted)">Hakuna miamala bado.</td></tr>`}</tbody>
        </table></div>
      </div>`;
    if (window.QRCode) {
      const canvas = document.createElement("canvas");
      QRCode.toCanvas(canvas, JSON.stringify({ id: d.user.wfcId, name: d.user.name }), { width: 76, margin: 1 }, () => {
        const box = document.getElementById("idQrBox");
        if (box) box.appendChild(canvas);
      });
    }
  }

  if (p === "members") {
    const m = await api("/api/members");
    c.innerHTML = `<div class="card" style="display:flex;justify-content:space-between;align-items:center">
      <div><h3 style="margin:0">Wanachama Wote (${m.length})</h3><p class="muted" style="margin:4px 0 0">Orodha ya wanachama waliosajiliwa kwenye PostgreSQL.</p></div>
    </div>
    <div class="member-grid">${m.map(x => `<div class="member-card">
      <div class="avatar">${(x.name || "W")[0]}</div>
      <strong>${x.name}</strong>
      <div class="muted" style="font-size:0.82rem;margin:4px 0 8px">${x.wfcId || "—"} · ${x.region || ""} · ${x.phone}</div>
      <span class="badge ${x.status === "ACTIVE" ? "badge-active" : "badge-pending"}">${x.status}</span>
      <div style="margin-top:12px;display:flex;gap:8px;justify-content:center">
        ${x.status === "PENDING" ? `<button class="btn btn-sm" onclick="approve('${x.id}')">Idhinisha</button>` : ""}
        ${x.status === "ACTIVE" && x.phone !== "0700000000" ? `<button class="btn btn-sm danger-ghost" onclick="suspend('${x.id}')">Simamisha</button>` : ""}
      </div>
    </div>`).join("")}</div>`;
  }

  if (p === "payments") {
    const list = await api("/api/payments");
    c.innerHTML = `<div class="card">
      <h3>Wasilisha Malipo Mapya</h3>
      <form id="pf" style="margin-top:14px">
        <div class="form-row-3">
          <div class="form-group"><label>Aina ya Mchango</label><select name="type"><option>Ada ya Mwezi</option><option>Kiingilio</option><option>Mchango wa Dharura</option><option>Sherehe / Tukio</option></select></div>
          <div class="form-group"><label>Kiasi (TSh)</label><input name="amount" type="number" placeholder="10000" required></div>
          <div class="form-group"><label>Namba ya Muamala (M-Pesa/Tigo/CRDB)</label><input name="transactionId" placeholder="MP2611..." required></div>
        </div>
        <button class="btn btn-sm" type="submit">Wasilisha Malipo</button>
      </form>
    </div>
    <div class="card">
      <h3>Historia ya Michango & Risiti za PDF (QR)</h3>
      <div class="table-wrap" style="margin-top:14px"><table>
        <thead><tr><th>Mwanachama</th><th>Aina</th><th>Kiasi</th><th>Muamala</th><th>Risiti ya PDF</th><th>Hatua</th></tr></thead>
        <tbody>${list.length ? list.map(x => `<tr>
          <td><strong>${x.userName || "—"}</strong></td>
          <td>${x.type}</td>
          <td>${money(x.amount)}</td>
          <td><code>${x.transactionId}</code></td>
          <td>${x.receiptUrl ? `<a href="${x.receiptUrl}" target="_blank" style="color:var(--brand-orange);font-weight:600">Pakua Risiti (PDF)</a>` : "—"}</td>
          <td>${x.status === "PENDING" ? `<button class="btn btn-sm" onclick="approvePay('${x.id}')">Idhinisha & Unda PDF</button>` : `<span class="badge badge-approved">${x.receiptNo}</span>`}</td>
        </tr>`).join("") : `<tr><td colspan="6" style="text-align:center;color:var(--muted)">Hakuna michango iliyowasilishwa bado.</td></tr>`}</tbody>
      </table></div>
    </div>`;
    document.getElementById("pf").onsubmit = async e => {
      e.preventDefault();
      await api("/api/submit-payment", { method: "POST", body: Object.fromEntries(new FormData(e.target)) });
      load("payments");
    };
  }

  if (p === "events") {
    const list = await api("/api/events");
    c.innerHTML = `<div class="card">
      <h3>Ongeza Tukio Jipya</h3>
      <form id="ef" style="margin-top:14px">
        <div class="form-row-3">
          <div class="form-group"><label>Kichwa cha Tukio</label><input name="title" placeholder="Mkutano Mkuu wa Mwaka" required></div>
          <div class="form-group"><label>Eneo</label><input name="location" placeholder="Dar es Salaam / Moshi" required></div>
          <div class="form-group"><label>Kiingilio / Tiketi (TSh)</label><input name="ticketPrice" type="number" value="0"></div>
        </div>
        <button class="btn btn-sm" type="submit">Chapisha Tukio</button>
      </form>
    </div>
    <div class="event-grid">${list.map(e => `<div class="ev">
      <div class="b">
        <div class="ev-top"><span class="badge badge-pending">${e.type || "Tukio"}</span><span class="ev-price">${money(e.ticketPrice)}</span></div>
        <h3>${e.title}</h3>
        <p class="muted">${e.location}</p>
        <button class="btn btn-sm danger-ghost" onclick="delEvent('${e.id}')">Futa Tukio</button>
      </div>
    </div>`).join("")}</div>`;
    document.getElementById("ef").onsubmit = async e => {
      e.preventDefault();
      await api("/api/events", { method: "POST", body: Object.fromEntries(new FormData(e.target)) });
      load("events");
    };
  }

  if (p === "announcements") {
    const list = await api("/api/announcements");
    c.innerHTML = `<div class="card">
      <h3>Chapisha Tangazo Jipya</h3>
      <form id="af" style="margin-top:14px">
        <div class="form-group"><label>Kichwa cha Tangazo</label><input name="title" placeholder="Taarifa Muhimu kwa Wanafamilia" required></div>
        <div class="form-group"><label>Maelezo ya Tangazo</label><textarea name="body" rows="3" placeholder="Andika ujumbe hapa..." required></textarea></div>
        <button class="btn btn-sm" type="submit">Chapisha Tangazo</button>
      </form>
    </div>
    ${list.map(a => `<div class="card" style="border-left:4px solid var(--brand-orange)">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <h3 style="margin:0">${a.title}</h3>
        <button class="btn btn-sm danger-ghost" onclick="delAnn('${a.id}')">Futa</button>
      </div>
      <p class="muted" style="margin:8px 0 0">${a.body}</p>
    </div>`).join("")}`;
    document.getElementById("af").onsubmit = async e => {
      e.preventDefault();
      await api("/api/announcements", { method: "POST", body: Object.fromEntries(new FormData(e.target)) });
      load("announcements");
    };
  }

  if (p === "pending") {
    const m = await api("/api/members");
    const pen = m.filter(x => x.status === "PENDING");
    c.innerHTML = `<div class="card"><h3>Wanachama Wanaosubiri Idhini (${pen.length})</h3></div>
    <div class="member-grid">${pen.length ? pen.map(x => `<div class="member-card">
      <div class="avatar">${(x.name || "W")[0]}</div>
      <strong>${x.name}</strong>
      <div class="muted" style="font-size:0.83rem;margin:6px 0">${x.phone} · ${x.region}</div>
      <button class="btn btn-sm" onclick="approve('${x.id}')">Idhinisha Uanachama</button>
    </div>`).join("") : `<div class="empty-state">Hakuna maombi yanayosubiri idhini kwa sasa.</div>`}</div>`;
  }

  if (p === "accounting") {
    const d = await api("/api/dashboard");
    const exps = await api("/api/expenses");
    c.innerHTML = `
      <div class="stats">
        <div class="stat"><div class="muted">Jumla ya Mapato</div><div style="font-size:1.5rem;font-weight:700;color:var(--success-ink)">${money(d.finance.mapato)}</div></div>
        <div class="stat"><div class="muted">Jumla ya Matumizi</div><div style="font-size:1.5rem;font-weight:700;color:var(--error-ink)">${money(d.finance.matumizi)}</div></div>
        <div class="stat"><div class="muted">Salio Lililopo</div><div style="font-size:1.5rem;font-weight:700;color:var(--brand-orange)">${money(d.finance.balance)}</div></div>
        <div class="stat"><div class="muted">Database</div><div style="font-size:1.2rem;font-weight:700;margin-top:6px">PostgreSQL</div></div>
      </div>
      <div class="card">
        <h3>Rekodi Matumizi ya Ofisi</h3>
        <form id="expf" style="margin-top:12px">
          <div class="form-row-3">
            <div class="form-group"><label>Maelezo ya Matumizi</label><input name="title" placeholder="Mf. Posho ya kikao / Chapisho" required></div>
            <div class="form-group"><label>Kiasi (TSh)</label><input name="amount" type="number" required></div>
            <div class="form-group"><label>Kipengele</label><select name="category"><option>Uendeshaji</option><option>Msaada wa Dharura</option><option>Matukio</option></select></div>
          </div>
          <button class="btn btn-sm" type="submit">Hifadhi Matumizi</button>
        </form>
      </div>
      <div class="card">
        <h3>Orodha ya Matumizi</h3>
        <div class="table-wrap" style="margin-top:12px"><table>
          <thead><tr><th>Maelezo</th><th>Kipengele</th><th>Kiasi</th></tr></thead>
          <tbody>${exps.length ? exps.map(x => `<tr><td>${x.title}</td><td>${x.category}</td><td>${money(x.amount)}</td></tr>`).join("") : `<tr><td colspan="3" style="text-align:center;color:var(--muted)">Hakuna matumizi yaliyorekodiwa.</td></tr>`}</tbody>
        </table></div>
      </div>`;
    document.getElementById("expf").onsubmit = async e => {
      e.preventDefault();
      await api("/api/expenses", { method: "POST", body: Object.fromEntries(new FormData(e.target)) });
      load("accounting");
    };
  }

  if (p === "settings") {
    c.innerHTML = `<div class="card">
      <h3>Mipangilio ya Mfumo & Database</h3>
      <p class="muted">Mfumo huu umeunganishwa moja kwa moja na <strong>PostgreSQL</strong> pamoja na ulinzi wa <strong>Helmet</strong>, <strong>Express Rate Limit</strong>, na uzalishaji wa <strong>PDF + QR Code Receipts</strong>.</p>
      <div style="display:flex;gap:12px;margin-top:16px">
        <button class="btn btn-sm" onclick="toggleTheme()">Badili Mandhari (Mwanga / Giza)</button>
        <a class="btn btn-sm ghost" href="/">Fungua Tovuti Kuu</a>
      </div>
    </div>`;
  }
}

async function approve(id) {
  const d = await api("/api/approve-member", { method: "POST", body: { userId: id } });
  if (d.success) load("members");
}

async function suspend(id) {
  const d = await api("/api/suspend-member", { method: "POST", body: { userId: id } });
  if (d.success) load("members");
}

async function approvePay(id) {
  const d = await api("/api/approve-payment", { method: "POST", body: { paymentId: id } });
  if (d.success) {
    alert("Malipo yameidhinishwa na Risiti ya PDF yenye QR Code imetengenezwa!");
    load("payments");
  }
}

async function delEvent(id) {
  await api("/api/events/" + id, { method: "DELETE" });
  load("events");
}

async function delAnn(id) {
  await api("/api/announcements/" + id, { method: "DELETE" });
  load("announcements");
}

async function logout() {
  await api("/api/logout", { method: "POST" });
  showLogin();
}

(async () => {
  const me = await api("/api/me");
  if (me.user) showDash();
  else showLogin();
})();
