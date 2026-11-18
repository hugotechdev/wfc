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
  return `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" width="18" height="18">${d}</svg>`;
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

function showLogin() {
  app.innerHTML = `<div class="auth-page">
    <div class="container">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <span class="kicker">WFC Portal</span>
        <button class="btn btn-sm ghost" onclick="toggleTheme()" type="button">◐ Mandhari</button>
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
      <p class="link" style="text-align:center;margin-top:16px">Huna akaunti? <a href="#" id="r" style="color:var(--brand-orange);font-weight:600">Jisajili sasa</a> · <a href="/" style="color:var(--brand-orange)">Tovuti kuu</a></p>
      <details style="margin-top:18px;border:1px dashed var(--border);padding:10px 14px;border-radius:12px;font-size:0.82rem;color:var(--muted)">
        <summary style="cursor:pointer;font-weight:600;color:var(--ink)">Akaunti za majaribio (Demo)</summary>
        <p style="margin:6px 0 0"><strong>Mwenyekiti:</strong> 0700000000 / admin123</p>
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
      <p class="subtitle">Ada ya Usajili: <strong>TSh 1,000</strong></p>
      <form id="f">
        <div class="form-group"><label>Jina Kamili</label><input name="name" placeholder="Mf. Amina Swai" required></div>
        <div class="form-row-2">
          <div class="form-group"><label>Namba ya Simu</label><input name="phone" placeholder="07XX XXX XXX" required></div>
          <div class="form-group"><label>Kanda</label><select name="region"><option>Dar es Salaam</option><option>Arusha</option><option>Moshi</option><option>Kilimanjaro</option></select></div>
        </div>
        <div class="form-group"><label>Nenosiri</label><input name="password" type="password" placeholder="Unda nenosiri imara" required></div>
        <button class="btn" type="submit">Wasilisha Usajili</button>
        <div id="m"></div>
      </form>
      <p class="link" style="text-align:center;margin-top:16px">Tayari una akaunti? <a href="#" id="l" style="color:var(--brand-orange);font-weight:600">Rudi Kuingia</a></p>
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
      ["payments", "Michango", IC.coin],
      ["events", "Matukio", IC.cal],
      ["announcements", "Matangazo", IC.meg]
    ]],
    ["Ofisi", [
      ["pending", "Inasubiri", IC.clock],
      ["accounting", "Uhasibu", IC.coin],
      ["settings", "Mipangilio", IC.gear]
    ]]
  ];

  app.innerHTML = `<div class="layout" id="layoutRoot">
    <aside class="sidebar" id="side" aria-label="Menyu kuu">
      <div class="sidebar-header">
        <div style="display:flex;align-items:center;gap:11px">
          <img src="/wfc-logo.jpg" alt="WFC" style="width:38px;height:38px;border-radius:11px;object-fit:cover">
          <div><strong>WFC Portal</strong><br><span style="font-size:0.7rem;color:var(--brand-orange)">Wachagga Family</span></div>
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
        <div style="display:flex;flex-direction:column">
          <strong id="pt" style="font-size:1.15rem">Dashibodi</strong>
          <span style="font-size:0.76rem;color:var(--muted)">Wachagga Family Community · Ofisi ya Kidijitali</span>
        </div>
        <div style="display:flex;align-items:center;gap:10px">
          <button class="btn btn-sm ghost" onclick="toggleTheme()" type="button">◐ Mwanga</button>
          <div style="display:inline-flex;align-items:center;gap:8px;padding:5px 12px 5px 6px;background:var(--bg);border:1px solid var(--border);border-radius:999px">
            <div style="width:26px;height:26px;border-radius:50%;background:var(--brand-gradient);color:#fff;display:grid;place-items:center;font-size:0.72rem;font-weight:700">${initials}</div>
            <span>${me.user.name}</span>
          </div>
        </div>
      </header>
      <main class="content" id="c"></main>
    </div>
  </div>`;

  document.getElementById("out").onclick = logout;
  document.querySelectorAll("[data-p]").forEach(el => el.onclick = () => load(el.dataset.p));
  load("home");
}

async function load(p) {
  const c = document.getElementById("c");
  document.getElementById("pt").textContent = p.toUpperCase();
  document.querySelectorAll("[data-p]").forEach(el => el.classList.toggle("active", el.dataset.p === p));

  if (p === "home") {
    const d = await api("/api/dashboard");
    const money = n => "TSh " + Number(n || 0).toLocaleString();
    c.innerHTML = `
      <div class="card" style="border-left:4px solid var(--brand-orange)">
        <h2>Karibu, ${d.user.name}</h2>
        <p>WFC ID: <strong>${d.user.wfcId || "—"}</strong> · Kanda ya ${d.user.region || "Tanzania"} · Jukumu: ${d.user.role}</p>
      </div>
      <div class="stats">
        <div class="stat"><div style="color:var(--muted)">Wanachama Hai</div><div style="font-size:1.55rem;font-weight:700">${d.stats.members}</div></div>
        <div class="stat"><div style="color:var(--muted)">Inasubiri Idhini</div><div style="font-size:1.55rem;font-weight:700">${d.stats.pending}</div></div>
        <div class="stat"><div style="color:var(--muted)">Malipo Yote</div><div style="font-size:1.55rem;font-weight:700">${d.stats.payments}</div></div>
        <div class="stat"><div style="color:var(--muted)">Matukio</div><div style="font-size:1.55rem;font-weight:700">${d.stats.events}</div></div>
      </div>`;
  }

  if (p === "members") {
    const m = await api("/api/members");
    c.innerHTML = `<div class="card"><h3>Wanachama (${m.length})</h3></div>
    <div class="member-grid">${m.map(x => `<div class="member-card">
      <div class="avatar">${(x.name||"W")[0]}</div>
      <strong>${x.name}</strong>
      <div style="color:var(--muted);font-size:0.83rem">${x.wfcId || "—"} · ${x.region || ""}</div>
      <span class="badge ${x.status === "ACTIVE" ? "badge-active" : "badge-pending"}">${x.status}</span>
      ${x.status === "PENDING" ? `<button class="btn btn-sm" style="margin-top:10px" onclick="approve('${x.id}')">Idhinisha</button>` : ""}
    </div>`).join("")}</div>`;
  }

  if (p === "payments") {
    const list = await api("/api/payments");
    c.innerHTML = `<div class="card">
      <h3>Wasilisha Malipo</h3>
      <form id="pf" style="margin-top:14px">
        <div class="form-row-3">
          <div class="form-group"><label>Aina ya Mchango</label><select name="type"><option>Ada ya mwezi</option><option>Kiingilio</option><option>Dharura</option></select></div>
          <div class="form-group"><label>Kiasi (TSh)</label><input name="amount" type="number" placeholder="10000" required></div>
          <div class="form-group"><label>Namba ya Muamala</label><input name="transactionId" placeholder="MP2608..." required></div>
        </div>
        <button class="btn btn-sm" type="submit">Wasilisha</button>
      </form>
    </div>
    <div class="card">
      <h3>Historia ya Michango</h3>
      <div class="table-wrap" style="margin-top:14px"><table>
        <thead><tr><th>Mwanachama</th><th>Aina</th><th>Kiasi</th><th>Muamala</th><th>Risiti ya PDF (QR)</th><th>Hatua</th></tr></thead>
        <tbody>${list.map(x => `<tr>
          <td><strong>${x.userName || "—"}</strong></td>
          <td>${x.type}</td>
          <td>TSh ${Number(x.amount).toLocaleString()}</td>
          <td><code>${x.transactionId}</code></td>
          <td>${x.receiptUrl ? `<a href="${x.receiptUrl}" target="_blank" style="color:var(--brand-orange);font-weight:600">Pakua Risiti ya PDF</a>` : "—"}</td>
          <td>${x.status === "PENDING" ? `<button class="btn btn-sm" onclick="approvePay('${x.id}')">Idhinisha & Tengeneza PDF</button>` : `<span class="badge badge-approved">${x.receiptNo}</span>`}</td>
        </tr>`).join("")}</tbody>
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
    c.innerHTML = `<div class="card"><h3>Matukio (${list.length})</h3></div>`;
  }

  if (p === "announcements") {
    const list = await api("/api/announcements");
    c.innerHTML = `<div class="card"><h3>Matangazo</h3></div>`;
  }

  if (p === "pending") {
    const m = await api("/api/members");
    const pen = m.filter(x => x.status === "PENDING");
    c.innerHTML = `<div class="card"><h3>Inasubiri Idhini (${pen.length})</h3></div>`;
  }

  if (p === "accounting") {
    c.innerHTML = `<div class="card"><h3>Uhasibu na Fedha</h3></div>`;
  }

  if (p === "settings") {
    c.innerHTML = `<div class="card"><h3>Mipangilio ya Mfumo</h3></div>`;
  }
}

async function approve(id) {
  const d = await api("/api/approve-member", { method: "POST", body: { userId: id } });
  if (d.success) load("members"); else alert("Imeshindwa");
}

async function approvePay(id) {
  const d = await api("/api/approve-payment", { method: "POST", body: { paymentId: id } });
  if (d.success) { alert("Risiti ya PDF na QR imetengenezwa kikamilifu!"); load("payments"); } else alert("Imeshindwa");
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
