const app = document.getElementById("app");

// Theme
function initTheme() {
  const saved = localStorage.getItem("wfc-theme") || "light";
  document.documentElement.setAttribute("data-theme", saved);
}
function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "light";
  const next = current === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("wfc-theme", next);
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

function showLogin() {
  app.innerHTML = `
    <div class="container">
      <img src="/wfc-logo.jpg" class="logo" alt="WFC">
      <h1>WFC Portal</h1>
      <p class="subtitle">Umoja wa Wachagga, Nguvu ya Familia</p>
      <form id="login-form">
        <div class="form-group">
          <label>Namba ya Simu</label>
          <input name="phone" required placeholder="07xxxxxxxx">
        </div>
        <div class="form-group">
          <label>Nenosiri / PIN</label>
          <input name="password" type="password" required>
        </div>
        <button class="btn" type="submit">Ingia</button>
        <div id="msg"></div>
      </form>
      <p class="link">Huna akaunti? <a href="#" id="go-register">Jisajili</a></p>
    </div>
  `;
  document.getElementById("go-register").onclick = (e) => { e.preventDefault(); showRegister(); };
  document.getElementById("login-form").onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = await api("/api/login", { method: "POST", body: Object.fromEntries(fd) });
    if (data.error) document.getElementById("msg").innerHTML = `<div class="error">${data.error}</div>`;
    else showDashboard();
  };
}

function showRegister() {
  app.innerHTML = `
    <div class="container">
      <img src="/wfc-logo.jpg" class="logo" alt="WFC">
      <h1>Usajili wa Mwanachama</h1>
      <p class="subtitle">Ada ya Usajili: TSh 1,000</p>
      <form id="reg-form">
        <div class="form-group"><label>Jina Kamili</label><input name="name" required></div>
        <div class="form-group"><label>Namba ya Simu</label><input name="phone" required></div>
        <div class="form-group">
          <label>Kanda</label>
          <select name="region">
            <option>Dar es Salaam</option><option>Arusha</option><option>Moshi</option>
            <option>Kilimanjaro</option><option>Tanga</option><option>Mwanza</option>
          </select>
        </div>
        <div class="form-group"><label>Nenosiri / PIN</label><input name="password" type="password" required></div>
        <div class="form-group">
          <label>Uthibitisho wa Malipo (Namba ya Muamala au SMS)</label>
          <textarea name="paymentProof" rows="3" placeholder="Weka namba ya muamala au andika SMS"></textarea>
        </div>
        <button class="btn" type="submit">Wasilisha Usajili</button>
        <div id="msg"></div>
      </form>
      <p class="link"><a href="#" id="go-login">Rudi kwenye Kuingia</a></p>
    </div>
  `;
  document.getElementById("go-login").onclick = (e) => { e.preventDefault(); showLogin(); };
  document.getElementById("reg-form").onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = await api("/api/register", { method: "POST", body: Object.fromEntries(fd) });
    if (data.error) document.getElementById("msg").innerHTML = `<div class="error">${data.error}</div>`;
    else {
      document.getElementById("msg").innerHTML = `<div class="success">${data.message}</div>`;
      setTimeout(showLogin, 1500);
    }
  };
}

async function showDashboard() {
  const me = await api("/api/me");
  if (!me.user) return showLogin();
  const dash = await api("/api/dashboard");

  if (me.user.status === "PENDING") {
    app.innerHTML = `
      <div class="container">
        <img src="/wfc-logo.jpg" class="logo">
        <h1>Akaunti Yako Inasubiri Idhini</h1>
        <p class="subtitle">Habari ${me.user.name}</p>
        <div class="card">
          <p>Usajili wako na malipo ya TSh 1,000 yamepokelewa.</p>
          <p style="margin-top:12px">Viongozi wanathibitisha taarifa zako. Utapata ufikiaji kamili baada ya kuidhinishwa.</p>
        </div>
        <button class="btn btn-secondary" onclick="logout()">Toka nje</button>
      </div>
    `;
    return;
  }

  // Active user dashboard
  app.innerHTML = `
    <div class="layout">
      <aside class="sidebar">
        <div class="sidebar-logo">
          <img src="/wfc-logo.jpg">
          <p>WACHAGGA FAMILY COMMUNITY</p>
        </div>
        <a class="nav-item active" data-page="home">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          Dashboard
        </a>
        <a class="nav-item" data-page="members">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          Wanachama
        </a>
        <a class="nav-item" data-page="payments">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          Michango
        </a>
        <a class="nav-item" data-page="pending">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          Inasubiri Idhini
        </a>
        <a class="nav-item" data-page="events">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          Matukio
        </a>
        <a class="nav-item" data-page="announcements">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          Matangazo
        </a>
        <a class="nav-item" onclick="logout()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Toka nje
        </a>
      </aside>
      <div class="main">
        <div class="topbar">
          <strong id="page-title">Dashboard</strong>
          <div style="display:flex;align-items:center;gap:12px">
            <button class="theme-toggle" onclick="toggleTheme()" title="Badilisha muonekano">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            </button>
            <span>${me.user.name} · ${me.user.role}</span>
          </div>
        </div>
        <div class="content" id="content"></div>
      </div>
    </div>
  `;

  document.querySelectorAll(".nav-item[data-page]").forEach(el => {
    el.onclick = () => loadPage(el.dataset.page);
  });
  loadPage("home");
}

async function loadPage(page) {
  const content = document.getElementById("content");
  document.getElementById("page-title").textContent = 
    page === "home" ? "Dashboard" : 
    page === "members" ? "Wanachama" : 
    page === "payments" ? "Michango" : 
    page === "events" ? "Matukio" :
    page === "announcements" ? "Matangazo" : "Inasubiri Idhini";

  if (page === "home") {
    const d = await api("/api/dashboard");
    content.innerHTML = `
      <div class="stats">
        <div class="stat"><div>Wanachama Hai</div><div class="val">${d.stats.members}</div></div>
        <div class="stat"><div>Inasubiri</div><div class="val">${d.stats.pending}</div></div>
        <div class="stat"><div>Malipo</div><div class="val">${d.stats.payments}</div></div>
      </div>
      <div class="card">
        <h3>Karibu ${d.user.name}</h3>
        <p style="margin-top:8px;color:#666">WFC ID: ${d.user.wfcId || "Bado haijatengenezwa"} · Hali: ${d.user.status}</p>
      </div>
    `;
  }

  if (page === "members") {
    const members = await api("/api/members");
    content.innerHTML = `
      <div class="card">
        <table>
          <thead><tr><th>Jina</th><th>Simu</th><th>Kanda</th><th>Hali</th><th>Hatua</th></tr></thead>
          <tbody>
            ${members.map(m => `
              <tr>
                <td>${m.name}</td>
                <td>${m.phone}</td>
                <td>${m.region}</td>
                <td><span class="badge ${m.status === "ACTIVE" ? "badge-active" : "badge-pending"}">${m.status === "ACTIVE" ? "Hai" : "Inasubiri"}</span></td>
                <td>${m.status === "PENDING" ? `<button class="btn btn-sm" onclick="approve('${m.id}')">Idhinisha</button>` : ""}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  if (page === "payments") {
    const payments = await api("/api/payments");
    content.innerHTML = `
      <div class="card">
        <h3>Wasilisha Malipo</h3>
        <form id="pay-form" style="margin-top:12px">
          <div class="form-group"><label>Aina</label>
            <select name="type"><option>Ada ya mwezi</option><option>Kiingilio</option><option>Dharura</option><option>Msiba</option></select>
          </div>
          <div class="form-group"><label>Kiasi (TSh)</label><input name="amount" type="number" required></div>
          <div class="form-group"><label>Namba ya Muamala</label><input name="transactionId" required></div>
          <button class="btn" type="submit">Wasilisha</button>
        </form>
      </div>
      <div class="card">
        <h3>Historia</h3>
        <table style="margin-top:12px">
          <thead><tr><th>Aina</th><th>Kiasi</th><th>Muamala</th><th>Hali</th></tr></thead>
          <tbody>
            ${payments.map(p => `<tr><td>${p.type}</td><td>TSh ${p.amount.toLocaleString()}</td><td>${p.transactionId}</td><td><span class="badge ${p.status === "APPROVED" ? "badge-approved" : "badge-pending"}">${p.status}</span></td></tr>`).join("")}
          </tbody>
        </table>
      </div>
    `;
    document.getElementById("pay-form").onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const data = await api("/api/submit-payment", { method: "POST", body: Object.fromEntries(fd) });
      if (data.error) alert(data.error); else loadPage("payments");
    };
  }

  if (page === "events") {
    const events = await api("/api/events");
    content.innerHTML = `
      <div class="card">
        <h3>Ripoti Tukio</h3>
        <form id="event-form" style="margin-top:12px">
          <div class="form-group"><label>Aina</label>
            <select name="type"><option>Msiba</option><option>Harusi</option><option>Ugonjwa</option><option>Festival</option><option>Tour</option></select>
          </div>
          <div class="form-group"><label>Kichwa</label><input name="title" required></div>
          <div class="form-group"><label>Maelezo</label><textarea name="description" rows="2"></textarea></div>
          <div class="form-group"><label>Eneo</label><input name="location"></div>
          <div class="form-group"><label>Bei ya Tiketi (TSh)</label><input name="ticketPrice" type="number" value="0"></div>
          <div class="form-group"><label>Poster (URL au pakia baadaye)</label><input name="poster" placeholder="https://... au /uploads/poster.jpg"></div>
          <button class="btn" type="submit">Wasilisha</button>
        </form>
      </div>
      <div class="card">
        <h3>Matukio</h3>
        ${events.map(e => `
          <div style="padding:12px 0;border-bottom:1px solid var(--border)">
            <strong>${e.title}</strong> <span class="badge badge-pending">${e.type}</span>
            <p style="font-size:0.85rem;color:var(--text-muted);margin-top:4px">${e.location || ""} · Lengo: TSh ${(e.targetAmount||0).toLocaleString()}</p>
          </div>
        `).join("") || "<p>Hakuna matukio</p>"}
      </div>
    `;
    document.getElementById("event-form").onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      await api("/api/events", { method: "POST", body: Object.fromEntries(fd) });
      loadPage("events");
    };
  }

  if (page === "announcements") {
    const anns = await api("/api/announcements");
    content.innerHTML = `
      <div class="card">
        <h3>Tangazo Jipya</h3>
        <form id="ann-form" style="margin-top:12px">
          <div class="form-group"><label>Kichwa</label><input name="title" required></div>
          <div class="form-group"><label>Ujumbe</label><textarea name="body" rows="3" required></textarea></div>
          <button class="btn" type="submit">Chapisha</button>
        </form>
      </div>
      <div class="card">
        <h3>Matangazo</h3>
        ${anns.map(a => `
          <div style="padding:12px 0;border-bottom:1px solid var(--border)">
            <strong>${a.title}</strong>
            <p style="font-size:0.85rem;margin-top:4px">${a.body}</p>
            <small style="color:var(--text-muted)">${a.author} · ${new Date(a.createdAt).toLocaleDateString()}</small>
          </div>
        `).join("") || "<p>Hakuna matangazo</p>"}
      </div>
    `;
    document.getElementById("ann-form").onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const data = await api("/api/announcements", { method: "POST", body: Object.fromEntries(fd) });
      if (data.error) alert(data.error); else loadPage("announcements");
    };
  }
}

async function approve(id) {
  const data = await api("/api/approve-member", { method: "POST", body: { userId: id } });
  if (data.success) { alert("Imeidhinishwa. WFC ID: " + data.wfcId); loadPage("pending"); }
  else alert(data.error || "Imeshindwa");
}

async function logout() {
  await api("/api/logout", { method: "POST" });
  showLogin();
}

// Init
(async () => {
  const me = await api("/api/me");
  if (me.user) showDashboard(); else showLogin();
})();
