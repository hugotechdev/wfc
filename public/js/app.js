const app = document.getElementById("app");
function initTheme(){ const t = localStorage.getItem("wfc-theme")||"light"; document.documentElement.setAttribute("data-theme", t); }
function toggleTheme(){ const c = document.documentElement.getAttribute("data-theme")||"light"; const n = c==="light"?"dark":"light"; document.documentElement.setAttribute("data-theme", n); localStorage.setItem("wfc-theme", n); }
initTheme();

async function api(path, opts={}){
  const res = await fetch(path, { headers:{"Content-Type":"application/json"}, ...opts, body: opts.body ? JSON.stringify(opts.body) : undefined });
  return res.json();
}

function showOtp(phone, devCode){
  app.innerHTML = `<div class="container">
    <h1>Thibitisha OTP</h1>
    <p class="subtitle">Msimbo wa tarakimu 6. Unaisha baada ya dakika 5.</p>
    ${devCode ? `<div class="card">SMS haijaunganishwa. Msimbo wa majaribio: <strong>${devCode}</strong></div>` : ""}
    <form id="f"><div class="form-group"><label>Msimbo</label><input name="code" required></div><button class="btn" type="submit">Thibitisha</button><div id="m"></div></form>
  </div>`;
  document.getElementById("f").onsubmit = async e => {
    e.preventDefault();
    const d = await api("/api/verify-otp", {method:"POST", body:{ phone, code: new FormData(e.target).get("code") }});
    if(d.error) document.getElementById("m").innerHTML = `<div class="error">${d.error}</div>`; else showDash();
  };
}

function ico(d){return `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`}
const IC={
  home:ico('<path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z"/>'),
  users:ico('<path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9.5" cy="7" r="3"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 4.13a3 3 0 0 1 0 5.75"/>'),
  coin:ico('<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/><path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/>'),
  cal:ico('<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/>'),
  meg:ico('<path d="M4 10v4a2 2 0 0 0 2 2h2l5 4V4L8 8H6a2 2 0 0 0-2 2z"/><path d="M16 9a4 4 0 0 1 0 6"/>'),
  id:ico('<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="12" r="2"/><path d="M14 10h4M14 14h4"/>'),
  home2:ico('<path d="M4 11.5 12 5l8 6.5"/><path d="M7 10v9h10v-9"/>'),
  book:ico('<path d="M5 5h10a3 3 0 0 1 3 3v12H8a3 3 0 0 0-3 3z"/><path d="M5 5v15"/>'),
  life:ico('<circle cx="12" cy="12" r="8"/><path d="M12 8v8M8 12h8"/>'),
  clock:ico('<circle cx="12" cy="12" r="8"/><path d="M12 8v5l3 2"/>'),
  vote:ico('<path d="M4 6h16v12H4z"/><path d="M8 12l2 2 4-4"/>'),
  case:ico('<path d="M4 8h16v11H4z"/><path d="M9 8V6h6v2"/>'),
  bank:ico('<path d="M4 10h16M6 10v8M10 10v8M14 10v8M18 10v8M3 18h18M12 3 3 8h18z"/>'),
  box:ico('<path d="M3 8l9-4 9 4-9 4z"/><path d="M3 8v8l9 4 9-4V8"/>'),
  flag:ico('<path d="M5 21V4"/><path d="M5 5h11l-2 4 2 4H5"/>'),
  file:ico('<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v6h6"/>'),
  key:ico('<circle cx="8" cy="14" r="3"/><path d="M11 14h9l-2 2 2 2"/>'),
  bell:ico('<path d="M6 16V10a6 6 0 1 1 12 0v6l1 2H5z"/><path d="M10 19a2 2 0 0 0 4 0"/>'),
  chart:ico('<path d="M4 19V5M4 19h16"/><path d="M8 15v-4M12 15V8M16 15v-6"/>'),
  mail:ico('<rect x="3" y="6" width="18" height="12" rx="2"/><path d="m4 7 8 6 8-6"/>'),
  phone:ico('<rect x="8" y="3" width="8" height="18" rx="2"/><path d="M11 18h2"/>'),
  gear:ico('<circle cx="12" cy="12" r="3"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4"/>')
};

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
    <p class="link"><a href="#" id="r">Jisajili</a> · <a href="/">Tovuti</a></p>
    <details class="demo-box"><summary>Akaunti za majaribio</summary>
      <p>Mwenyekiti: 0700000000 / admin123</p>
      <p>Mwanachama: 0711000001 / demo123</p>
      <p>Mhazini: 0711000002 / demo123</p>
    </details>
  </div>`;
  document.getElementById("r").onclick = e => { e.preventDefault(); showRegister(); };
  document.getElementById("f").onsubmit = async e => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.target));
    const d = await api("/api/login", {method:"POST", body});
    if(d.needOtp) return showOtp(body.phone, d.devCode);
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
  window.__me = me.user;
  const groups = [
    ["Kila siku", [["home","Dashibodi",IC.home],["members","Wanachama",IC.users],["payments","Michango",IC.coin],["events","Matukio",IC.cal],["announcements","Matangazo",IC.meg]]],
    ["Mwanachama", [["card","Kitambulisho",IC.id],["family","Familia",IC.home2],["directory","Directory",IC.book],["help","Msaada",IC.life],["notifications","Taarifa",IC.bell]]],
    ["Ofisi", [["pending","Inasubiri",IC.clock],["attendance","Mahudhurio",IC.cal],["elections","Uchaguzi",IC.vote],["cases","Kesi",IC.case],["saccos","SACCOS",IC.bank],["assets","Mali",IC.box],["projects","Miradi",IC.flag],["penalties","Faini",IC.file],["documents","Nyaraka",IC.file],["roles","Majukumu",IC.key],["charts","Grafu",IC.chart],["messages","Ujumbe",IC.mail],["momo","Malipo ya simu",IC.phone],["settings","Mipangilio",IC.gear]]]
  ];
  app.innerHTML = `<div class="layout">
    <div class="scrim" id="scrim"></div>
    <aside class="sidebar" id="side">
      <div class="sidebar-logo"><img src="/wfc-logo.jpg" alt=""><p>WACHAGGA FAMILY</p></div>
      ${groups.map(([label, items])=>`<div class="nav-label">${label}</div>${items.map(([id,name,icon])=>`<a class="nav-item" data-p="${id}">${icon}${name}</a>`).join("")}`).join("")}
      <a class="nav-item" id="out">${IC.home}Toka nje</a>
    </aside>
    <div class="main">
      <div class="topbar">
        <div style="display:flex;align-items:center;gap:10px"><button class="menu-btn" id="menuBtn" type="button">Menyu</button><strong id="pt">Dashibodi</strong></div>
        <div><button class="theme-toggle" onclick="toggleTheme()" type="button">Mwanga</button> <span class="who">${me.user.name} · ${me.user.role}</span></div>
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
  const close = () => { document.getElementById("side").classList.remove("open"); document.getElementById("scrim").classList.remove("on"); };
  document.getElementById("menuBtn").onclick = () => { document.getElementById("side").classList.add("open"); document.getElementById("scrim").classList.add("on"); };
  document.getElementById("moreBtn").onclick = document.getElementById("menuBtn").onclick;
  document.getElementById("scrim").onclick = close;
  document.getElementById("out").onclick = logout;
  document.querySelectorAll("[data-p]").forEach(el => el.onclick = () => { close(); load(el.dataset.p); });
  load("home");
}

async function load(p){
  const c = document.getElementById("c");
  const titles = {home:"Dashibodi",members:"Wanachama",payments:"Michango",events:"Matukio",announcements:"Matangazo",card:"Kitambulisho",family:"Familia",directory:"Directory",help:"Msaada",pending:"Inasubiri Idhini",attendance:"Mahudhurio",elections:"Uchaguzi",cases:"Kesi",saccos:"SACCOS",assets:"Mali",projects:"Miradi",penalties:"Faini",documents:"Nyaraka",charts:"Grafu",messages:"Ujumbe",momo:"Malipo ya simu",settings:"Mipangilio",roles:"Majukumu",notifications:"Taarifa"};
  document.getElementById("pt").textContent = titles[p] || p;
  document.querySelectorAll(".nav-item").forEach(el => el.classList.toggle("active", el.dataset.p === p));

  if(p==="home"){
    const d = await api("/api/dashboard");
    const max = Math.max(...(d.regions||[]).map(r=>r.value), 1);
    const money = n => "TSh " + Number(n||0).toLocaleString();
    c.innerHTML = `<section class="hero-band">
      <div><span class="pill">${d.user.status}</span><h2 class="serif" style="margin:8px 0 0;font-size:2rem">Karibu, ${d.user.name}</h2><p>WFC ID ${d.user.wfcId||"—"} · ${d.user.region||""}</p></div>
      <div><div class="kicker">Umechanga</div><strong class="serif" style="font-size:1.8rem">${money(d.myTotalPaid)}</strong></div>
    </section>
    <div class="stats">
      <div class="stat"><div>Wanachama hai</div><div class="val">${d.stats.members}</div></div>
      <div class="stat"><div>Inasubiri</div><div class="val">${d.stats.pending}</div></div>
      <div class="stat"><div>Malipo yote</div><div class="val">${d.stats.payments}</div></div>
      <div class="stat"><div>Matukio</div><div class="val">${d.stats.events}</div></div>
    </div>
    <div class="split">
      <div class="card"><h3>Kanda</h3>${(d.regions||[]).map(r=>`<div class="bar-row"><span><b>${r.name}</b><em>${r.value}</em></span><div class="track"><i style="width:${Math.round(r.value/max*100)}%"></i></div></div>`).join("")||"<p>Hakuna data</p>"}</div>
      <div class="card"><h3>Matukio</h3>${(d.upcoming||[]).map(e=>`<div style="padding:8px 0;border-bottom:1px solid var(--border)"><strong>${e.title}</strong><br><small>${e.location||""}</small></div>`).join("")||"<p>Hakuna</p>"}</div>
    </div>
    <div class="card"><h3>Malipo ya hivi karibuni</h3><table><thead><tr><th>Jina</th><th>Aina</th><th>Kiasi</th><th>Hali</th></tr></thead><tbody>
      ${(d.recent||[]).map(x=>`<tr><td>${x.userName||""}</td><td>${x.type}</td><td>${money(x.amount)}</td><td>${x.status}</td></tr>`).join("")||"<tr><td colspan=4>Hakuna</td></tr>"}
    </tbody></table></div>`;
  }
  if(p==="members"){
    const m = await api("/api/members");
    c.innerHTML = `<div class="card"><table><thead><tr><th>Jina</th><th>Simu</th><th>Kanda</th><th>Hali</th><th>Hatua</th></tr></thead><tbody>
      ${m.map(x=>`<tr><td>${x.name}</td><td>${x.phone}</td><td>${x.region}</td><td><span class="badge ${x.status==="ACTIVE"?"badge-active":x.status==="SUSPENDED"?"badge-suspended":"badge-pending"}">${x.status==="ACTIVE"?"Hai":x.status==="SUSPENDED"?"Imesimamishwa":"Inasubiri"}</span></td><td>${x.status==="PENDING"?`<button class="btn btn-sm" onclick="approve('${x.id}')">Idhinisha</button>`:""}</td></tr>`).join("")}
    </tbody></table></div>`;
  }
  if(p==="payments"){
    const list = await api("/api/payments");
    window.__pays = list;
    c.innerHTML = `<div class="card"><h3>Wasilisha Malipo</h3><form id="pf" style="margin-top:10px">
      <div class="form-group"><label>Aina</label><select name="type"><option>Ada ya mwezi</option><option>Kiingilio</option><option>Dharura</option><option>Msiba</option></select></div>
      <div class="form-group"><label>Kiasi</label><input name="amount" type="number" required></div>
      <div class="form-group"><label>Namba ya Muamala</label><input name="transactionId" required></div>
      <button class="btn" type="submit">Wasilisha</button>
    </form></div>
    <div class="card"><h3>Historia</h3><table style="margin-top:8px"><thead><tr><th>Aina</th><th>Kiasi</th><th>Muamala</th><th>Hali</th><th></th></tr></thead><tbody>
      ${list.map(x=>`<tr><td>${x.userName||""}</td><td>${x.type}</td><td>TSh ${x.amount.toLocaleString()}</td><td>${x.transactionId}</td><td><span class="badge ${x.status==="APPROVED"?"badge-approved":"badge-pending"}">${x.status==="APPROVED"?(x.receiptNo||"OK"):"Inasubiri"}</span></td><td>${x.status==="PENDING"?`<button class="btn btn-sm" onclick="approvePay('${x.id}')">Idhinisha</button>`:`<button class="btn btn-sm" onclick="downloadReceipt('${x.id}')">PDF</button>`}</td></tr>`).join("")}
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
      <div class="form-group"><label>Poster (picha)</label><input id="posterFile" type="file" accept="image/*"></div>
      <button class="btn" type="submit">Wasilisha</button>
    </form></div>
    <div class="card"><h3>Matukio</h3>${list.map(e=>`<div style="padding:8px 0;border-bottom:1px solid var(--border)"><strong>${e.title}</strong> <span class="badge badge-pending">${e.type}</span><br><small>${e.location||""} · TSh ${(e.ticketPrice||0).toLocaleString()}</small></div>`).join("")||"<p>Hakuna</p>"}</div>`;
    document.getElementById("ef").onsubmit = async e => {
      e.preventDefault();
      const body = Object.fromEntries(new FormData(e.target));
      const file = document.getElementById("posterFile").files[0];
      if (file) {
        if (file.size > 1200000) { alert("Picha ni kubwa. Tumia chini ya 1.2 MB."); return; }
        body.poster = await new Promise(resolve => { const r = new FileReader(); r.onload = () => resolve(r.result); r.readAsDataURL(file); });
      }
      await api("/api/events",{method:"POST",body});
      load("events");
    };
  }
  if(p==="announcements"){
    const list = await api("/api/announcements");
    c.innerHTML = `<div class="card"><h3>Tangazo Jipya</h3><form id="af" style="margin-top:10px">
      <div class="form-group"><label>Kichwa</label><input name="title" required></div>
      <div class="form-group"><label>Ujumbe</label><textarea name="body" rows="3" required></textarea></div>
      <div class="form-group"><label>Kiungo (hiari)</label><input name="link" placeholder="/#matukio au https://..."></div>
      <button class="btn" type="submit">Chapisha</button>
    </form></div>
    <div class="card"><h3>Matangazo</h3>${list.map(a=>`<div style="padding:8px 0;border-bottom:1px solid var(--border)"><strong>${a.title}</strong><p style="margin-top:4px">${a.body}</p>${a.link?`<a href="${a.link}">${a.link}</a>`:""}<br><small>${a.author||""}</small></div>`).join("")||"<p>Hakuna</p>"}</div>`;
    document.getElementById("af").onsubmit = async e => { e.preventDefault(); const d = await api("/api/announcements",{method:"POST",body:Object.fromEntries(new FormData(e.target))}); if(d.error) alert(d.error); else load("announcements"); };
  }
  if(p==="card"){
    const d = await api("/api/dashboard");
    c.innerHTML = `<div class="card idcard">
      <img src="/wfc-logo.jpg" style="width:70px;height:70px;border-radius:50%">
      <h2>WFC MEMBERSHIP</h2>
      <p style="font-size:1.35rem;margin:8px 0"><strong>${d.user.name}</strong></p>
      <p>${d.user.wfcId||"—"}</p>
      <p>${d.user.region||"—"} · ${d.user.status}</p>
      <img id="qrc" class="qr" alt="QR">
      <button class="btn" onclick="window.print()">Pakua / chapisha</button>
    </div>`;
    if (window.QRCode) QRCode.toDataURL(d.user.wfcId || d.user.name, { margin:1, width:180 }).then(url => { const img=document.getElementById("qrc"); if(img) img.src=url; });
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
  if(p==="attendance"){
    const list = await api("/api/attendance");
    c.innerHTML = `<div class="card"><h3>Andika Mahudhurio</h3><form id="af"><div class="form-group"><label>Mkutano</label><input name="meeting" value="Mkutano Mkuu"></div><button class="btn" type="submit">Nipo</button></form></div>
    <div class="card"><h3>Historia</h3>${list.map(a=>`<div style="padding:6px 0;border-bottom:1px solid var(--border)">${a.userName} · ${a.meeting}</div>`).join("")||"<p>Hakuna</p>"}</div>`;
    document.getElementById("af").onsubmit = async e => { e.preventDefault(); await api("/api/attendance",{method:"POST",body:Object.fromEntries(new FormData(e.target))}); load("attendance"); };
  }
  if(p==="elections"){
    const list = await api("/api/elections");
    c.innerHTML = `<div class="card"><h3>Fungua Uchaguzi</h3><form id="ef"><div class="form-group"><label>Nafasi</label><input name="position" required></div><button class="btn" type="submit">Fungua</button></form></div>
    <div class="card"><h3>Uchaguzi</h3>${list.map(e=>`<div style="padding:8px 0;border-bottom:1px solid var(--border)"><strong>${e.position}</strong> · ${e.status} · Wagombea: ${e.candidates.length} · Kura: ${e.votes.length}</div>`).join("")||"<p>Hakuna</p>"}</div>`;
    document.getElementById("ef").onsubmit = async e => { e.preventDefault(); await api("/api/elections",{method:"POST",body:Object.fromEntries(new FormData(e.target))}); load("elections"); };
  }
  if(p==="cases"){
    const list = await api("/api/cases");
    c.innerHTML = `<div class="card"><h3>Fungua Kesi</h3><form id="cf"><div class="form-group"><label>Mada</label><input name="title" required></div><div class="form-group"><label>Maelezo</label><textarea name="description" rows="2"></textarea></div><button class="btn" type="submit">Wasilisha</button></form></div>
    <div class="card"><h3>Kesi</h3>${list.map(x=>`<div style="padding:6px 0;border-bottom:1px solid var(--border)"><strong>${x.title}</strong> · ${x.status}</div>`).join("")||"<p>Hakuna</p>"}</div>`;
    document.getElementById("cf").onsubmit = async e => { e.preventDefault(); await api("/api/cases",{method:"POST",body:Object.fromEntries(new FormData(e.target))}); load("cases"); };
  }
  if(p==="saccos"){
    const d = await api("/api/saccos");
    c.innerHTML = `<div class="card"><h3>Nunua Hisa</h3><form id="sf"><div class="form-group"><label>Kiasi</label><input name="amount" type="number" required></div><button class="btn" type="submit">Wasilisha</button></form></div>
    <div class="card"><h3>Hisa</h3>${(d.shares||[]).map(s=>`<div>TSh ${s.amount.toLocaleString()}</div>`).join("")||"<p>Hakuna</p>"}</div>`;
    document.getElementById("sf").onsubmit = async e => { e.preventDefault(); await api("/api/saccos/shares",{method:"POST",body:Object.fromEntries(new FormData(e.target))}); load("saccos"); };
  }
  if(p==="assets"){
    const list = await api("/api/assets");
    c.innerHTML = `<div class="card"><h3>Ongeza Mali</h3><form id="asf"><div class="form-group"><label>Jina</label><input name="name" required></div><div class="form-group"><label>Thamani</label><input name="value" type="number"></div><div class="form-group"><label>Eneo</label><input name="location"></div><button class="btn" type="submit">Hifadhi</button></form></div>
    <div class="card"><h3>Mali</h3>${list.map(a=>`<div style="padding:6px 0;border-bottom:1px solid var(--border)"><strong>${a.name}</strong> · TSh ${(a.value||0).toLocaleString()} · ${a.location||""}</div>`).join("")||"<p>Hakuna</p>"}</div>`;
    document.getElementById("asf").onsubmit = async e => { e.preventDefault(); await api("/api/assets",{method:"POST",body:Object.fromEntries(new FormData(e.target))}); load("assets"); };
  }
  if(p==="projects"){
    const list = await api("/api/projects");
    c.innerHTML = `<div class="card"><h3>Ongeza Mradi</h3><form id="prf"><div class="form-group"><label>Jina</label><input name="name" required></div><div class="form-group"><label>Maendeleo %</label><input name="progress" type="number" value="0"></div><button class="btn" type="submit">Hifadhi</button></form></div>
    <div class="card"><h3>Miradi</h3>${list.map(p=>`<div style="padding:6px 0;border-bottom:1px solid var(--border)"><strong>${p.name}</strong> · ${p.progress||0}%</div>`).join("")||"<p>Hakuna</p>"}</div>`;
    document.getElementById("prf").onsubmit = async e => { e.preventDefault(); await api("/api/projects",{method:"POST",body:Object.fromEntries(new FormData(e.target))}); load("projects"); };
  }
  if(p==="penalties"){
    const list = await api("/api/penalties");
    c.innerHTML = `<div class="card"><h3>Ongeza Faini</h3><form id="penf"><div class="form-group"><label>Sababu</label><input name="reason" required></div><div class="form-group"><label>Kiasi</label><input name="amount" type="number" required></div><button class="btn" type="submit">Hifadhi</button></form></div>
    <div class="card"><h3>Faini</h3>${list.map(x=>`<div>${x.reason} · TSh ${x.amount.toLocaleString()}</div>`).join("")||"<p>Hakuna</p>"}</div>`;
    document.getElementById("penf").onsubmit = async e => { e.preventDefault(); await api("/api/penalties",{method:"POST",body:Object.fromEntries(new FormData(e.target))}); load("penalties"); };
  }
  if(p==="documents"){
    const list = await api("/api/documents");
    c.innerHTML = `<div class="card"><h3>Ongeza Nyaraka</h3><form id="docf"><div class="form-group"><label>Jina</label><input name="title" required></div><div class="form-group"><label>URL</label><input name="url"></div><button class="btn" type="submit">Hifadhi</button></form></div>
    <div class="card"><h3>Nyaraka</h3>${list.map(d=>`<div><a href="${d.url||"#"}" target="_blank">${d.title}</a></div>`).join("")||"<p>Hakuna</p>"}</div>`;
    document.getElementById("docf").onsubmit = async e => { e.preventDefault(); await api("/api/documents",{method:"POST",body:Object.fromEntries(new FormData(e.target))}); load("documents"); };
  }
  if(p==="pending"){
    const m = await api("/api/members");
    const pen = m.filter(x=>x.status==="PENDING");
    c.innerHTML = `<div class="card"><h3>Inasubiri Idhini</h3><table style="margin-top:8px"><thead><tr><th>Jina</th><th>Simu</th><th>Kanda</th><th></th></tr></thead><tbody>
      ${pen.map(x=>`<tr><td>${x.name}</td><td>${x.phone}</td><td>${x.region}</td><td><button class="btn btn-sm" onclick="approve('${x.id}')">Idhinisha</button></td></tr>`).join("")||"<tr><td colspan=4>Hakuna</td></tr>"}
    </tbody></table></div>`;
  }
  if(p==="charts"){
    const d = await api("/api/analytics");
    const bar = rows => { const max = Math.max(...rows.map(r=>Number(r.value)||0), 1); return rows.map(r => `<div class="bar-row"><span><b>${r.name}</b><em>${Number(r.value).toLocaleString()}</em></span><div class="track"><i style="width:${Math.round((Number(r.value)||0)/max*100)}%"></i></div></div>`).join("") || "<p>Hakuna data</p>"; };
    c.innerHTML = `<div class="card"><h3>Wanachama kwa kanda</h3>${bar(d.regions||[])}</div><div class="card"><h3>Makusanyo (TSh)</h3>${bar((d.types||[]).map(t=>({name:t.name,value:t.value})))}</div>`;
  }
  if(p==="messages"){
    const members = await api("/api/members");
    const box = await api("/api/outbox");
    c.innerHTML = `<div class="card"><h3>Tuma ujumbe</h3><form id="mf">
      <div class="form-group"><label>Kituo</label><select name="channel"><option value="sms">SMS</option><option value="whatsapp">WhatsApp</option><option value="email">Barua pepe</option></select></div>
      <div class="form-group"><label>Mpokeaji</label><select name="to">${members.map(m=>`<option value="${m.phone}">${m.name} · ${m.phone}</option>`).join("")}</select></div>
      <div class="form-group"><label>Kichwa</label><input name="title" required></div>
      <div class="form-group"><label>Ujumbe</label><textarea name="body" rows="3" required></textarea></div>
      <button class="btn" type="submit">Tuma</button>
    </form><p style="margin-top:8px;color:var(--muted)">Bila funguo, WhatsApp inafunguliwa kwenye simu na barua pepe inafungua programu yako.</p></div>
    <div class="card"><h3>Kumbukumbu</h3>${(box||[]).map(n=>`<div style="padding:6px 0;border-bottom:1px solid var(--border)"><strong>${n.channel}</strong> → ${n.to} · ${n.status}<br>${n.body||""}<br><small>${n.detail||""}</small></div>`).join("")||"<p>Hakuna</p>"}</div>`;
    document.getElementById("mf").onsubmit = async e => {
      e.preventDefault();
      const body = Object.fromEntries(new FormData(e.target));
      if(body.channel==="whatsapp"){
        const phone = body.to.replace(/\D/g,"");
        const intl = phone.startsWith("0") ? "255"+phone.slice(1) : phone;
        window.open("https://wa.me/"+intl+"?text="+encodeURIComponent(body.body), "_blank", "noopener");
      }
      if(body.channel==="email") window.open("mailto:?subject="+encodeURIComponent(body.title)+"&body="+encodeURIComponent(body.body));
      await api("/api/dispatch",{method:"POST",body});
      load("messages");
    };
  }
  if(p==="momo"){
    c.innerHTML = `<div class="card"><h3>Omba STK</h3><form id="sk">
      <div class="form-group"><label>Simu</label><input name="phone" required></div>
      <div class="form-group"><label>Kiasi</label><input name="amount" type="number" required></div>
      <button class="btn" type="submit">Omba</button>
    </form><div id="skm"></div>
    <p style="margin-top:8px">M-Pesa 0755 000 888 · Tigo 0715 000 888 · Airtel 0785 000 888 · CRDB 0150889944200</p></div>
    <div class="card"><h3>Weka namba ya muamala</h3><form id="cf">
      <div class="form-group"><label>Aina</label><select name="type"><option>Ada ya mwezi</option><option>Kiingilio</option><option>Dharura</option></select></div>
      <div class="form-group"><label>Kiasi</label><input name="amount" type="number" required></div>
      <div class="form-group"><label>Namba ya muamala</label><input name="transactionId" required></div>
      <button class="btn" type="submit">Wasilisha kwa idhini</button>
    </form></div>`;
    document.getElementById("sk").onsubmit = async e => { e.preventDefault(); const d = await api("/api/stk",{method:"POST",body:Object.fromEntries(new FormData(e.target))}); document.getElementById("skm").textContent = d.detail || ""; };
    document.getElementById("cf").onsubmit = async e => { e.preventDefault(); const d = await api("/api/submit-payment",{method:"POST",body:Object.fromEntries(new FormData(e.target))}); if(d.error) alert(d.error); else load("payments"); };
  }
  if(p==="settings"){
    const d = await api("/api/dashboard");
    const s = d.settings || {};
    c.innerHTML = `<div class="card"><h3>OTP</h3><button class="btn" id="tfa" type="button">Washa / zima OTP</button><p id="tfam" style="margin-top:8px"></p></div>
    <div class="card"><h3>Data ya majaribio</h3><p>Akaunti 0711000001 hadi 0711000005, nenosiri demo123. Kuondoa hakuathiri wanachama halisi.</p><button class="btn" id="cleardemo" type="button">Ondoa data ya majaribio</button></div>
    <div class="card"><h3>Funguo za huduma</h3><form id="sf">
      <div class="form-group"><label>Africa's Talking username</label><input name="smsUsername" value="${s.smsUsername||""}"></div>
      <div class="form-group"><label>SMS API key</label><input name="smsKey" value="${s.smsKey||""}"></div>
      <div class="form-group"><label>WhatsApp token</label><input name="whatsappToken" value="${s.whatsappToken||""}"></div>
      <div class="form-group"><label>WhatsApp Phone ID</label><input name="whatsappPhoneId" value="${s.whatsappPhoneId||""}"></div>
      <div class="form-group"><label>M-Pesa consumer key</label><input name="momoConsumerKey" value="${s.momoConsumerKey||""}"></div>
      <div class="form-group"><label>M-Pesa consumer secret</label><input name="momoConsumerSecret" value="${s.momoConsumerSecret||""}"></div>
      <div class="form-group"><label>Shortcode</label><input name="momoShortcode" value="${s.momoShortcode||""}"></div>
      <button class="btn" type="submit">Hifadhi</button>
    </form></div>`;
    document.getElementById("tfa").onclick = async () => { const r = await api("/api/toggle-2fa",{method:"POST",body:{}}); document.getElementById("tfam").textContent = r.twoFactor ? "OTP imewashwa." : "OTP imezimwa."; };
    document.getElementById("cleardemo").onclick = async () => { const r = await api("/api/demo/clear",{method:"POST",body:{}}); alert(r.error || "Data ya majaribio imeondolewa. Haitarudi ikianzishwa tena."); };
    document.getElementById("sf").onsubmit = async e => { e.preventDefault(); const r = await api("/api/settings",{method:"POST",body:Object.fromEntries(new FormData(e.target))}); alert(r.error || "Imehifadhiwa"); };
  }
  if(p==="roles"){
    const members = await api("/api/members");
    const roles = await api("/api/roles");
    c.innerHTML = `<div class="card"><h3>Majukumu</h3><p>Badilisha cheo cha mwanachama. Admin pekee.</p>
      ${members.map(m=>`<form class="rolef" style="display:flex;gap:8px;align-items:center;margin:8px 0;flex-wrap:wrap"><input type="hidden" name="userId" value="${m.id}"><strong style="min-width:140px">${m.name}</strong><select name="role">${roles.map(r=>`<option ${r===m.role?"selected":""}>${r}</option>`).join("")}</select><button class="btn btn-sm" type="submit">Hifadhi</button></form>`).join("")}
    </div>`;
    document.querySelectorAll(".rolef").forEach(f => f.onsubmit = async e => { e.preventDefault(); const d = await api("/api/set-role",{method:"POST",body:Object.fromEntries(new FormData(e.target))}); alert(d.error || "Imehifadhiwa"); });
  }
  if(p==="notifications"){
    const list = await api("/api/notifications");
    c.innerHTML = `<div class="card"><h3>Tuma taarifa</h3><form id="nf"><div class="form-group"><label>Kichwa</label><input name="title" required></div><div class="form-group"><label>Ujumbe</label><textarea name="body" rows="3" required></textarea></div><button class="btn" type="submit">Tuma kwa wote</button></form></div>
    <div class="card"><h3>Zilizopo</h3>${(list||[]).map(n=>`<div style="padding:8px 0;border-bottom:1px solid var(--border)"><strong>${n.title}</strong><p>${n.body}</p></div>`).join("")||"<p>Hakuna taarifa</p>"}</div>`;
    document.getElementById("nf").onsubmit = async e => { e.preventDefault(); const d = await api("/api/notifications",{method:"POST",body:{...Object.fromEntries(new FormData(e.target)), userId:"all"}}); if(d.error) alert(d.error); else load("notifications"); };
  }
}

async function downloadReceipt(id){
  const row = (window.__pays||[]).find(x => x.id === id);
  if(!row) return;
  const payload = JSON.stringify({ org:"WFC", receipt: row.receiptNo, name: row.userName, type: row.type, amount: row.amount, tx: row.transactionId });
  const qr = await QRCode.toDataURL(payload, { margin: 1, width: 220 });
  const doc = new jspdf.jsPDF();
  doc.setFillColor(18, 17, 14);
  doc.rect(0, 0, 210, 28, "F");
  doc.setTextColor(196, 154, 70);
  doc.setFontSize(16);
  doc.text("WACHAGGA FAMILY COMMUNITY", 14, 12);
  doc.setTextColor(255,255,255);
  doc.setFontSize(11);
  doc.text("Risiti rasmi", 14, 20);
  doc.setTextColor(22,20,15);
  doc.setFontSize(12);
  doc.text(row.receiptNo || "Risiti", 14, 42);
  ["Jina: "+(row.userName||""), "Aina: "+row.type, "Kiasi: TSh "+Number(row.amount).toLocaleString(), "Muamala: "+row.transactionId].forEach((line,i)=>doc.text(line, 14, 54+i*8));
  doc.addImage(qr, "PNG", 140, 36, 50, 50);
  doc.save((row.receiptNo||"risiti")+".pdf");
}

async function approve(id){ const d = await api("/api/approve-member",{method:"POST",body:{userId:id}}); if(d.success){ alert("Imeidhinishwa: "+d.wfcId); load("pending"); } else alert(d.error||"Imeshindwa"); }
async function approvePay(id){ const d = await api("/api/approve-payment",{method:"POST",body:{paymentId:id}}); if(d.success){ alert("Imeidhinishwa. Risiti: "+d.receiptNo); load("payments"); } else alert(d.error||"Imeshindwa"); }
async function logout(){ await api("/api/logout",{method:"POST"}); showLogin(); }

(async()=>{ const me = await api("/api/me"); if(me.user) showDash(); else showLogin(); })();
