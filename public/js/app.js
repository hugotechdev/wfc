const app = document.getElementById("app");

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, m => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[m]));
}

async function api(path, opts = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  return res.json();
}

function showLogin() {
  app.innerHTML = `<div class="auth-page">
    <div class="container" style="text-align:center">
      <img src="/wfc-logo.jpg" class="logo" alt="WFC Logo">
      <h1 style="font-size:1.35rem;margin:6px 0 2px">WACHAGGA FAMILY COMMUNITY</h1>
      <p style="color:var(--brand-orange);font-weight:700;font-size:0.85rem;margin:0 0 20px">Stand up, it's not over</p>
      <form id="f">
        <div class="form-group" style="text-align:left"><label>Namba ya Simu</label><input name="phone" placeholder="07XX XXX XXX" required></div>
        <div class="form-group" style="text-align:left"><label>Nenosiri</label><input name="password" type="password" placeholder="••••••••" required></div>
        <button class="btn" type="submit">Ingia kwenye Akaunti</button>
        <div id="m"></div>
      </form>
      <p class="link">Huna akaunti? <a href="#" id="r">Jisajili sasa</a> · <a href="#" id="fp">Umesahau nenosiri?</a></p>
    </div>
  </div>`;
  document.getElementById("r").onclick = e => { e.preventDefault(); showRegister(); };
  document.getElementById("fp").onclick = e => { e.preventDefault(); showReset(); };
  document.getElementById("f").onsubmit = async e => {
    e.preventDefault();
    const d = await api("/api/login", { method: "POST", body: Object.fromEntries(new FormData(e.target)) });
    if (d.error) document.getElementById("m").innerHTML = `<div class="error">${esc(d.error)}</div>`;
    else showDash();
  };
}

function showReset() {
  app.innerHTML = `<div class="auth-page">
    <div class="container" style="text-align:center">
      <img src="/wfc-logo.jpg" class="logo" alt="WFC">
      <h1 style="font-size:1.25rem;margin:6px 0">Wachagga Family Community</h1>
      <p class="subtitle" style="font-size:0.85rem;color:var(--muted);margin-bottom:16px">Weka namba yako ya simu na nenosiri jipya</p>
      <form id="rf">
        <div class="form-group" style="text-align:left"><label>Namba ya Simu</label><input name="phone" placeholder="07XX XXX XXX" required></div>
        <div class="form-group" style="text-align:left"><label>Nenosiri Jipya (angalau herufi 6)</label><input name="newPassword" type="password" minlength="6" placeholder="••••••••" required></div>
        <button class="btn" type="submit">Badili Nenosiri</button>
        <div id="rm"></div>
      </form>
      <p class="link"><a href="#" id="back">← Rudi Kuingia</a></p>
    </div>
  </div>`;
  document.getElementById("back").onclick = e => { e.preventDefault(); showLogin(); };
  document.getElementById("rf").onsubmit = async e => {
    e.preventDefault();
    const d = await api("/api/auth/reset-password", { method: "POST", body: Object.fromEntries(new FormData(e.target)) });
    document.getElementById("rm").innerHTML = d.error ? `<div class="error">${esc(d.error)}</div>` : `<div class="success">${esc(d.message)}</div>`;
    if (d.success) setTimeout(() => showLogin(), 1500);
  };
}

function showRegister() {
  app.innerHTML = `<div class="auth-page">
    <div class="container" style="max-width:520px">
      <img src="/wfc-logo.jpg" class="logo" alt="WFC">
      <h1 style="text-align:center;font-size:1.3rem">Usajili — Wachagga Family Community</h1>
      <p style="text-align:center;color:var(--brand-orange);font-weight:600;font-size:0.8rem;margin-bottom:16px">Stand up, it's not over</p>
      <form id="regf">
        <div class="form-group"><label>Jina Kamili</label><input name="name" placeholder="Mf. Amina Swai" required></div>
        <div class="form-group"><label>Namba ya Simu</label><input name="phone" placeholder="07XX XXX XXX" required></div>
        <div class="form-group"><label>Nenosiri (angalau herufi 6)</label><input name="password" type="password" minlength="6" required></div>
        <button class="btn" type="submit">Wasilisha Usajili</button>
        <div id="regm"></div>
      </form>
      <p class="link">Tayari una akaunti? <a href="#" id="l">Rudi Kuingia</a></p>
    </div>
  </div>`;
  document.getElementById("l").onclick = e => { e.preventDefault(); showLogin(); };
  document.getElementById("regf").onsubmit = async e => {
    e.preventDefault();
    const d = await api("/api/register", { method: "POST", body: Object.fromEntries(new FormData(e.target)) });
    document.getElementById("regm").innerHTML = d.error ? `<div class="error">${esc(d.error)}</div>` : `<div class="success">${esc(d.message)}</div>`;
    if (d.success) setTimeout(() => showLogin(), 1500);
  };
}

async function showDash() {
  const me = await api("/api/me");
  if (!me.user) return showLogin();
  app.innerHTML = `<div class="layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <img src="/wfc-logo.jpg" style="width:36px;height:36px;border-radius:10px;object-fit:cover" alt="WFC">
        <div class="sidebar-brand-text">
          <strong>WACHAGGA FAMILY</strong>
          <span>Stand up, it's not over</span>
        </div>
      </div>
      <div class="sidebar-scroll">
        <a class="nav-item active">Dashibodi</a>
        <a class="nav-item" onclick="logout()">Toka Nje</a>
      </div>
    </aside>
    <div class="main">
      <header class="topbar">
        <strong>Dashibodi Kuu</strong>
        <div><strong>${esc(me.user.name)}</strong> (${esc(me.user.role)})</div>
      </header>
      <main class="content">
        <div class="card">
          <h2>Karibu kwenye Wachagga Family Community Portal V6</h2>
          <p>Akaunti yako imethibitishwa. Jina rasmi na slogan vimesasishwa kikamilifu.</p>
        </div>
      </main>
    </div>
  </div>`;
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
