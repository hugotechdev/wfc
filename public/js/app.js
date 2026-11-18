const loginScreen = document.getElementById("login-screen");
const dashboardScreen = document.getElementById("dashboard-screen");
const content = document.getElementById("content");
const pageTitle = document.getElementById("page-title");

document.getElementById("login-form").addEventListener("submit", (e) => {
  e.preventDefault();
  loginScreen.classList.add("hidden");
  dashboardScreen.classList.remove("hidden");
  showPage("home");
});

document.getElementById("logout").addEventListener("click", (e) => {
  e.preventDefault();
  dashboardScreen.classList.add("hidden");
  loginScreen.classList.remove("hidden");
});

document.querySelectorAll(".nav-item[data-page]").forEach((el) => {
  el.addEventListener("click", (e) => {
    e.preventDefault();
    document.querySelectorAll(".nav-item").forEach((n) => n.classList.remove("active"));
    el.classList.add("active");
    showPage(el.dataset.page);
  });
});

async function showPage(page) {
  if (page === "home") {
    pageTitle.textContent = "Dashboard";
    const stats = await fetch("/api/stats").then((r) => r.json());
    content.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card"><div class="label">Wanachama</div><div class="value orange">${stats.members}</div></div>
        <div class="stat-card"><div class="label">Michango (Mwezi)</div><div class="value">TSh ${(stats.monthlyContributions / 1000000).toFixed(1)}M</div></div>
        <div class="stat-card"><div class="label">Matukio Hai</div><div class="value">${stats.activeEvents}</div></div>
        <div class="stat-card"><div class="label">Deni Jumla</div><div class="value red">TSh ${(stats.totalDebt / 1000000).toFixed(1)}M</div></div>
      </div>
      <div class="table-container" style="padding:20px">
        <h3>Karibu kwenye WFC Portal</h3>
        <p style="color:#666;margin-top:8px">Umoja wa Wachagga, Nguvu ya Familia. Stand up, It's not over.</p>
      </div>
    `;
  }

  if (page === "members") {
    pageTitle.textContent = "Wanachama";
    const members = await fetch("/api/members").then((r) => r.json());
    content.innerHTML = `
      <div class="table-container">
        <table>
          <thead><tr><th>WFC ID</th><th>Jina</th><th>Kanda</th><th>Hali</th></tr></thead>
          <tbody>
            ${members.map((m) => `
              <tr>
                <td style="color:#ff6b00;font-weight:600">${m.wfcId}</td>
                <td>${m.name}</td>
                <td>${m.region}</td>
                <td><span class="badge ${m.status === "Hai" ? "green" : "red"}">${m.status}</span></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  if (page === "contributions") {
    pageTitle.textContent = "Michango";
    content.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card" style="background:#ff6b00;color:white"><div class="label">Kiingilio</div><div class="value">TSh 50,000</div></div>
        <div class="stat-card" style="background:#111;color:white"><div class="label">Ada ya mwezi</div><div class="value">TSh 10,000</div></div>
        <div class="stat-card"><div class="label">Dharura</div><div class="value orange">TSh 60,000</div></div>
      </div>
      <div class="table-container" style="padding:20px"><p>Historia ya malipo itaonekana hapa.</p></div>
    `;
  }

  if (page === "events") {
    pageTitle.textContent = "Matukio";
    content.innerHTML = `<div class="table-container" style="padding:20px"><p>Misiba, Harusi na Ugonjwa zitatajwa hapa.</p></div>`;
  }

  if (page === "announcements") {
    pageTitle.textContent = "Matangazo";
    content.innerHTML = `<div class="table-container" style="padding:20px"><p>Matangazo rasmi ya WFC yataonekana hapa.</p></div>`;
  }
}
