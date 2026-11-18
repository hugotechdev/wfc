const app = document.getElementById("app");
function initTheme(){ const t = localStorage.getItem("wfc-theme")||"light"; document.documentElement.setAttribute("data-theme", t); }
function toggleTheme(){ const c = document.documentElement.getAttribute("data-theme")||"light"; const n = c==="light"?"dark":"light"; document.documentElement.setAttribute("data-theme", n); localStorage.setItem("wfc-theme", n); }
initTheme();

async function api(path, opts={}){
  const res = await fetch(path, { headers:{"Content-Type":"application/json"}, ...opts, body: opts.body ? JSON.stringify(opts.body) : undefined });
  return res.json();
}

function showLogin(){
  app.innerHTML = `<div class="container">
    <div style="text-align:right"><button class="theme-toggle" onclick="toggleTheme()">◐</button></div>
    <img src="/wfc-logo.jpg" class="logo">
    <h1>WFC Portal</h1><p class="subtitle">Umoja wa Wachagga, Nguvu ya Familia</p>
    <form id="f">
      <div class="form-group"><label>Namba ya Simu</label><input name="phone" required></div>
      <div class="form-group"><label>Nenosiri</label><input name="password" type="password" required></div>
      <button class="btn" type="submit">Ingia</button><div id="m"></div>
    </form>
    <p class="link"><a href="#" id="r">Jisajili</a></p>
  </div>`;
  document.getElementById("r").onclick = e => { e.preventDefault(); showRegister(); };
  document.getElementById("f").onsubmit = async e => {
    e.preventDefault();
    const d = await api("/api/login", {method:"POST", body:Object.fromEntries(new FormData(e.target))});
    if(d.error) document.getElementById("m").innerHTML = `<div class="error">${d.error}</div>`; else showDash();
  };
}

function showRegister(){
  app.innerHTML = `<div class="container">
    <img src="/wfc-logo.jpg" class="logo"><h1>Usajili</h1><p class="subtitle">Ada ya Usajili: TSh 1,000</p>
    <form id="f">
      <div class="form-group"><label>Jina</label><input name="name" required></div>
      <div class="form-group"><label>Simu</label><input name="phone" required></div>
      <div class="form-group"><label>Kanda</label><select name="region"><option>Dar es Salaam</option><option>Arusha</option><option>Moshi</option><option>Kilimanjaro</option><option>Tanga</option><option>Mwanza</option></select></div>
      <div class="form-group"><label>Nenosiri</label><input name="password" type="password" required></div>
      <div class="form-group"><label>Uthibitisho wa Malipo</label><textarea name="paymentProof" rows="2"></textarea></div>
      <button class="btn" type="submit">Wasilisha</button><div id="m"></div>
    </form>
    <p class="link"><a href="#" id="l">Rudi Kuingia</a></p>
  </div>`;
  document.getElementById("l").onclick = e => { e.preventDefault(); showLogin(); };
  document.getElementById("f").onsubmit = async e => {
    e.preventDefault();
    const d = await api("/api/register", {method:"POST", body:Object.fromEntries(new FormData(e.target))});
    document.getElementById("m").innerHTML = d.error ? `<div class="error">${d.error}</div>` : `<div class="success">${d.message}</div>`;
    if(d.success) setTimeout(showLogin, 1200);
  };
}

async function showDash(){
  const me = await api("/api/me");
  if(!me.user) return showLogin();
  if(me.user.status === "PENDING"){
    app.innerHTML = `<div class="container"><img src="/wfc-logo.jpg" class="logo"><h1>Inasubiri Idhini</h1><p class="subtitle">Habari ${me.user.name}</p><div class="card"><p>Usajili wako na malipo ya TSh 1,000 yamepokelewa. Subiri viongozi.</p></div><button class="btn" onclick="logout()">Toka nje</button></div>`;
    return;
  }
  app.innerHTML = `<div class="layout">
    <aside class="sidebar">
      <div class="sidebar-logo"><img src="/wfc-logo.jpg"><p>WACHAGGA FAMILY COMMUNITY</p></div>
      <a class="nav-item active" data-p="home">Dashboard</a>
      <a class="nav-item" data-p="members">Wanachama</a>
      <a class="nav-item" data-p="payments">Michango</a>
      <a class="nav-item" data-p="events">Matukio</a>
      <a class="nav-item" data-p="announcements">Matangazo</a>
      <a class="nav-item" data-p="card">Kitambulisho</a>
      <a class="nav-item" data-p="family">Familia</a>
      <a class="nav-item" data-p="directory">Directory</a>
      <a class="nav-item" data-p="help">Msaada</a>
      <a class="nav-item" data-p="pending">Inasubiri</a>
      <a class="nav-item" onclick="logout()">Toka nje</a>
    </aside>
    <div class="main">
      <div class="topbar"><strong id="pt">Dashboard</strong><div><button class="theme-toggle" onclick="toggleTheme()">◐</button> <span>${me.user.name} · ${me.user.role}</span></div></div>
      <div class="content" id="c"></div>
    </div>
  </div>`;
  document.querySelectorAll(".nav-item[data-p]").forEach(el => el.onclick = () => load(el.dataset.p));
  load("home");
}

async function load(p){
  const c = document.getElementById("c");
  const titles = {home:"Dashboard",members:"Wanachama",payments:"Michango",events:"Matukio",announcements:"Matangazo",card:"Kitambulisho",family:"Familia",directory:"Directory",help:"Msaada",pending:"Inasubiri Idhini"};
  document.getElementById("pt").textContent = titles[p] || p;

  if(p==="home"){
    const d = await api("/api/dashboard");
    c.innerHTML = `<div class="stats">
      <div class="stat"><div>Wanachama Hai</div><div class="val">${d.stats.members}</div></div>
      <div class="stat"><div>Inasubiri</div><div class="val">${d.stats.pending}</div></div>
      <div class="stat"><div>Malipo</div><div class="val">${d.stats.payments}</div></div>
      <div class="stat"><div>Nimechangia</div><div class="val">TSh ${(d.myTotalPaid||0).toLocaleString()}</div></div>
    </div><div class="card"><h3>Karibu ${d.user.name}</h3><p style="margin-top:6px;color:var(--muted)">WFC ID: ${d.user.wfcId||"—"} · Hali: ${d.user.status}</p></div>`;
  }
  if(p==="members"){
    const m = await api("/api/members");
    c.innerHTML = `<div class="card"><table><thead><tr><th>Jina</th><th>Simu</th><th>Kanda</th><th>Hali</th><th>Hatua</th></tr></thead><tbody>
      ${m.map(x=>`<tr><td>${x.name}</td><td>${x.phone}</td><td>${x.region}</td><td><span class="badge ${x.status==="ACTIVE"?"badge-active":"badge-pending"}">${x.status==="ACTIVE"?"Hai":"Inasubiri"}</span></td><td>${x.status==="PENDING"?`<button class="btn btn-sm" onclick="approve('${x.id}')">Idhinisha</button>`:""}</td></tr>`).join("")}
    </tbody></table></div>`;
  }
  if(p==="payments"){
    const list = await api("/api/payments");
    c.innerHTML = `<div class="card"><h3>Wasilisha Malipo</h3><form id="pf" style="margin-top:10px">
      <div class="form-group"><label>Aina</label><select name="type"><option>Ada ya mwezi</option><option>Kiingilio</option><option>Dharura</option><option>Msiba</option></select></div>
      <div class="form-group"><label>Kiasi</label><input name="amount" type="number" required></div>
      <div class="form-group"><label>Namba ya Muamala</label><input name="transactionId" required></div>
      <button class="btn" type="submit">Wasilisha</button>
    </form></div>
    <div class="card"><h3>Historia</h3><table style="margin-top:8px"><thead><tr><th>Aina</th><th>Kiasi</th><th>Muamala</th><th>Hali</th><th></th></tr></thead><tbody>
      ${list.map(x=>`<tr><td>${x.type}</td><td>TSh ${x.amount.toLocaleString()}</td><td>${x.transactionId}</td><td><span class="badge ${x.status==="APPROVED"?"badge-approved":"badge-pending"}">${x.status}</span></td><td>${x.status==="PENDING"?`<button class="btn btn-sm" onclick="approvePay('${x.id}')">Idhinisha</button>`:""}</td></tr>`).join("")}
    </tbody></table></div>`;
    document.getElementById("pf").onsubmit = async e => { e.preventDefault(); const d = await api("/api/submit-payment",{method:"POST",body:Object.fromEntries(new FormData(e.target))}); if(d.error) alert(d.error); else load("payments"); };
  }
  if(p==="events"){
    const list = await api("/api/events");
    c.innerHTML = `<div class="card"><h3>Ongeza Tukio</h3><form id="ef" style="margin-top:10px">
      <div class="form-group"><label>Aina</label><select name="type"><option>Msiba</option><option>Harusi</option><option>Festival</option><option>Tour</option></select></div>
      <div class="form-group"><label>Kichwa</label><input name="title" required></div>
      <div class="form-group"><label>Eneo</label><input name="location"></div>
      <div class="form-group"><label>Bei ya Tiketi</label><input name="ticketPrice" type="number" value="0"></div>
      <div class="form-group"><label>Poster URL</label><input name="poster"></div>
      <button class="btn" type="submit">Wasilisha</button>
    </form></div>
    <div class="card"><h3>Matukio</h3>${list.map(e=>`<div style="padding:8px 0;border-bottom:1px solid var(--border)"><strong>${e.title}</strong> <span class="badge badge-pending">${e.type}</span><br><small>${e.location||""} · TSh ${(e.ticketPrice||0).toLocaleString()}</small></div>`).join("")||"<p>Hakuna</p>"}</div>`;
    document.getElementById("ef").onsubmit = async e => { e.preventDefault(); await api("/api/events",{method:"POST",body:Object.fromEntries(new FormData(e.target))}); load("events"); };
  }
  if(p==="announcements"){
    const list = await api("/api/announcements");
    c.innerHTML = `<div class="card"><h3>Tangazo Jipya</h3><form id="af" style="margin-top:10px">
      <div class="form-group"><label>Kichwa</label><input name="title" required></div>
      <div class="form-group"><label>Ujumbe</label><textarea name="body" rows="3" required></textarea></div>
      <button class="btn" type="submit">Chapisha</button>
    </form></div>
    <div class="card"><h3>Matangazo</h3>${list.map(a=>`<div style="padding:8px 0;border-bottom:1px solid var(--border)"><strong>${a.title}</strong><p style="margin-top:4px">${a.body}</p><small>${a.author}</small></div>`).join("")||"<p>Hakuna</p>"}</div>`;
    document.getElementById("af").onsubmit = async e => { e.preventDefault(); const d = await api("/api/announcements",{method:"POST",body:Object.fromEntries(new FormData(e.target))}); if(d.error) alert(d.error); else load("announcements"); };
  }
  if(p==="card"){
    const d = await api("/api/dashboard");
    c.innerHTML = `<div class="card" style="max-width:380px;text-align:center;border:2px solid var(--gold)">
      <img src="/wfc-logo.jpg" style="width:70px;height:70px;border-radius:50%;margin:0 auto 10px">
      <h2 style="color:var(--gold-dark)">WFC MEMBERSHIP CARD</h2>
      <p style="margin:12px 0;font-size:1.05rem"><strong>${d.user.name}</strong></p>
      <p>WFC ID: <strong>${d.user.wfcId||"—"}</strong></p>
      <p>Kanda: ${d.user.region||"—"}</p>
      <p>Hali: <span class="badge badge-active">${d.user.status}</span></p>
      <div style="margin:16px auto;width:100px;height:100px;background:#f0f0f0;border-radius:8px;display:flex;align-items:center;justify-content:center">QR</div>
      <button class="btn" onclick="window.print()">Print / Pakua</button>
    </div>`;
  }
  if(p==="family"){
    const f = await api("/api/family");
    c.innerHTML = `<div class="card"><h3>Familia</h3><form id="ff" style="margin-top:10px">
      <div class="form-group"><label>Mwenyekiti</label><input name="head" value="${f.head||""}"></div>
      <div class="form-group"><label>Mke/Mume</label><input name="spouse" value="${f.spouse||""}"></div>
      <div class="form-group"><label>Watoto (koma)</label><input name="children" value="${(f.children||[]).join(", ")}"></div>
      <button class="btn" type="submit">Hifadhi</button>
    </form></div>`;
    document.getElementById("ff").onsubmit = async e => { e.preventDefault(); const o = Object.fromEntries(new FormData(e.target)); o.children = o.children.split(",").map(s=>s.trim()).filter(Boolean); await api("/api/family",{method:"POST",body:o}); alert("Imehifadhiwa"); };
  }
  if(p==="directory"){
    const list = await api("/api/directory");
    c.innerHTML = `<div class="card"><h3>Directory</h3><form id="df" style="margin:10px 0"><div class="form-group"><label>Taaluma yako</label><input name="profession"></div><button class="btn btn-sm" type="submit">Hifadhi</button></form>
      <table><thead><tr><th>Jina</th><th>Taaluma</th><th>Kanda</th></tr></thead><tbody>${list.map(x=>`<tr><td>${x.name}</td><td>${x.profession}</td><td>${x.region}</td></tr>`).join("")||"<tr><td colspan=3>Hakuna</td></tr>"}</tbody></table></div>`;
    document.getElementById("df").onsubmit = async e => { e.preventDefault(); await api("/api/my-profession",{method:"POST",body:Object.fromEntries(new FormData(e.target))}); load("directory"); };
  }
  if(p==="help"){
    const list = await api("/api/support");
    c.innerHTML = `<div class="card"><h3>Omba Msaada</h3><form id="hf" style="margin-top:10px">
      <div class="form-group"><label>Mada</label><input name="subject" required></div>
      <div class="form-group"><label>Ujumbe</label><textarea name="message" rows="3" required></textarea></div>
      <button class="btn" type="submit">Wasilisha</button>
    </form></div><div class="card"><h3>Tiketi</h3>${list.map(t=>`<div style="padding:6px 0;border-bottom:1px solid var(--border)"><strong>${t.subject}</strong><br><small>${t.status}</small></div>`).join("")||"<p>Hakuna</p>"}</div>`;
    document.getElementById("hf").onsubmit = async e => { e.preventDefault(); await api("/api/support",{method:"POST",body:Object.fromEntries(new FormData(e.target))}); load("help"); };
  }
  if(p==="pending"){
    const m = await api("/api/members");
    const pen = m.filter(x=>x.status==="PENDING");
    c.innerHTML = `<div class="card"><h3>Inasubiri Idhini</h3><table style="margin-top:8px"><thead><tr><th>Jina</th><th>Simu</th><th>Kanda</th><th></th></tr></thead><tbody>
      ${pen.map(x=>`<tr><td>${x.name}</td><td>${x.phone}</td><td>${x.region}</td><td><button class="btn btn-sm" onclick="approve('${x.id}')">Idhinisha</button></td></tr>`).join("")||"<tr><td colspan=4>Hakuna</td></tr>"}
    </tbody></table></div>`;
  }
}

async function approve(id){ const d = await api("/api/approve-member",{method:"POST",body:{userId:id}}); if(d.success){ alert("Imeidhinishwa: "+d.wfcId); load("pending"); } else alert(d.error||"Imeshindwa"); }
async function approvePay(id){ const d = await api("/api/approve-payment",{method:"POST",body:{paymentId:id}}); if(d.success){ alert("Imeidhinishwa. Risiti: "+d.receiptNo); load("payments"); } else alert(d.error||"Imeshindwa"); }
async function logout(){ await api("/api/logout",{method:"POST"}); showLogin(); }

(async()=>{ const me = await api("/api/me"); if(me.user) showDash(); else showLogin(); })();
