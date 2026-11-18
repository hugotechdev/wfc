let appState = JSON.parse(localStorage.getItem('wfc_portal_v6_state')) || JSON.parse(JSON.stringify(WFC_INITIAL_DATA));
let currentLang = localStorage.getItem('wfc_portal_v6_lang') || 'sw';
let currentMemberFilter = 'all';
let currentReportType = 'membership';
let chartsInstance = {};

function saveState() {
  localStorage.setItem('wfc_portal_v6_state', JSON.stringify(appState));
}

function showToast(msg) {
  const toast = document.getElementById('toastBox');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3200);
}

function formatTZS(num) {
  return 'TZS ' + Number(num || 0).toLocaleString('en-US');
}

function getInitials(name) {
  return (name || 'WF').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

// Language Switcher
function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('wfc_portal_v6_lang', lang);
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
  const dict = WFC_I18N[lang] || WFC_I18N.sw;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) el.textContent = dict[key];
  });
  renderAll();
}

// Navigation
function navigateTo(viewId) {
  document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
  const target = document.getElementById('view-' + viewId);
  if (target) target.classList.add('active');

  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.view === viewId);
  });

  const activeNav = document.querySelector(`.nav-item[data-view="${viewId}"] span`);
  if (activeNav) {
    document.getElementById('headerPageTitle').textContent = activeNav.textContent;
  }

  // Close mobile sidebar if open
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarBackdrop').classList.remove('open');

  if (viewId === 'dashboard') {
    setTimeout(renderCharts, 50);
  }
}

// Sidebar Mobile Toggle
function toggleSidebar(forceState) {
  const sb = document.getElementById('sidebar');
  const bd = document.getElementById('sidebarBackdrop');
  const shouldOpen = typeof forceState === 'boolean' ? forceState : !sb.classList.contains('open');
  sb.classList.toggle('open', shouldOpen);
  bd.classList.toggle('open', shouldOpen);
}

// Dropdown Toggles
function toggleDropdown(id) {
  const target = document.getElementById(id);
  const wasOpen = target.classList.contains('open');
  document.querySelectorAll('.dropdown-panel').forEach(p => p.classList.remove('open'));
  if (!wasOpen) target.classList.add('open');
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('.header-icon-wrap') && !e.target.closest('.profile-wrap')) {
    document.querySelectorAll('.dropdown-panel').forEach(p => p.classList.remove('open'));
  }
});

// Dashboard KPIs & Charts
function renderDashboard() {
  const total = appState.members.length;
  const active = appState.members.filter(m => m.status === 'Active').length;
  const newMonth = appState.members.filter(m => m.isNew || (m.registrationDate && m.registrationDate.startsWith('2026-11'))).length;
  const totalContrib = appState.contributions.reduce((acc, c) => acc + Number(c.amount || 0), 0);
  const upcomingEvents = appState.events.filter(e => e.status === 'Upcoming').length;
  const pendingApprovals = appState.members.filter(m => m.status === 'Pending').length;
  const unreadNotifs = appState.notifications.filter(n => !n.read).length;

  document.getElementById('kpiTotalMembers').textContent = total;
  document.getElementById('kpiActiveMembers').textContent = active;
  document.getElementById('kpiNewMembers').textContent = newMonth;
  document.getElementById('kpiTotalContrib').textContent = formatTZS(totalContrib);
  document.getElementById('kpiUpcomingEvents').textContent = upcomingEvents;
  document.getElementById('kpiPendingApprovals').textContent = pendingApprovals;
  document.getElementById('kpiNotifSummary').textContent = `${unreadNotifs} Unread / ${appState.notifications.length}`;

  // Recent Members Table on Dashboard
  const recentBody = document.getElementById('dashboardRecentMembers');
  recentBody.innerHTML = appState.members.slice(0, 5).map(m => `
    <tr>
      <td>
        <div class="member-cell">
          ${m.photo ? `<img src="${m.photo}" class="member-thumb" alt="${m.fullName}">` : `<div class="member-thumb">${getInitials(m.fullName)}</div>`}
          <div>
            <strong>${m.fullName}</strong>
            <div style="font-size:11.5px;color:#64748b">${m.membershipNumber}</div>
          </div>
        </div>
      </td>
      <td>${m.ukoo} (${m.eneoLaAsili})</td>
      <td>${m.mkoa}</td>
      <td><span class="badge badge-${m.status.toLowerCase()}">${m.status}</span></td>
      <td><button class="btn btn-sm btn-outline" onclick="openViewDetails('member', '${m.id}')">View Details</button></td>
    </tr>
  `).join('');
}

function renderCharts() {
  if (typeof Chart === 'undefined') return;

  // 1. Membership Growth Chart
  const ctxGrowth = document.getElementById('growthChart');
  if (ctxGrowth) {
    if (chartsInstance.growth) chartsInstance.growth.destroy();
    chartsInstance.growth = new Chart(ctxGrowth, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
        datasets: [{
          label: 'Total Members',
          data: [120, 134, 149, 162, 178, 195, 210, 228, 245, 268, 284 + appState.members.length],
          borderColor: '#064e3b',
          backgroundColor: 'rgba(6, 78, 59, 0.12)',
          fill: true,
          tension: 0.35,
          borderWidth: 3
        }]
      },
      options: { responsive: true, plugins: { legend: { display: false } } }
    });
  }

  // 2. Contributions Chart
  const ctxContrib = document.getElementById('contribChart');
  if (ctxContrib) {
    if (chartsInstance.contrib) chartsInstance.contrib.destroy();
    chartsInstance.contrib = new Chart(ctxContrib, {
      type: 'bar',
      data: {
        labels: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
        datasets: [{
          label: 'TZS Collected',
          data: [4200000, 5100000, 4850000, 6300000, 7150000, 8450000],
          backgroundColor: '#d97706',
          borderRadius: 6
        }]
      },
      options: { responsive: true, plugins: { legend: { display: false } } }
    });
  }

  // 3. Members by Region Chart
  const ctxRegion = document.getElementById('regionChart');
  if (ctxRegion) {
    if (chartsInstance.region) chartsInstance.region.destroy();
    const regionCounts = {};
    appState.members.forEach(m => {
      regionCounts[m.mkoa] = (regionCounts[m.mkoa] || 0) + 1;
    });
    chartsInstance.region = new Chart(ctxRegion, {
      type: 'doughnut',
      data: {
        labels: Object.keys(regionCounts),
        datasets: [{
          data: Object.values(regionCounts),
          backgroundColor: ['#064e3b', '#d97706', '#0284c7', '#059669', '#7c3aed']
        }]
      },
      options: { responsive: true }
    });
  }
}

// 10. Search & Filters on Member Management
function setMemberFilter(filter, btn) {
  currentMemberFilter = filter;
  document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderMembersTable();
}

function resetMemberSearch() {
  ['searchName', 'searchMemNo', 'searchPhone', 'searchMkoa', 'searchWilaya', 'searchUkoo', 'searchStatus'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  setMemberFilter('all', document.querySelector('.filter-pill[data-filter="all"]'));
}

function renderMembersTable() {
  const qName = (document.getElementById('searchName')?.value || '').toLowerCase();
  const qMemNo = (document.getElementById('searchMemNo')?.value || '').toLowerCase();
  const qPhone = (document.getElementById('searchPhone')?.value || '').toLowerCase();
  const qMkoa = (document.getElementById('searchMkoa')?.value || '').toLowerCase();
  const qWilaya = (document.getElementById('searchWilaya')?.value || '').toLowerCase();
  const qUkoo = (document.getElementById('searchUkoo')?.value || '').toLowerCase();
  const qStatus = (document.getElementById('searchStatus')?.value || '').toLowerCase();

  const filtered = appState.members.filter(m => {
    if (currentMemberFilter === 'active' && m.status !== 'Active') return false;
    if (currentMemberFilter === 'inactive' && m.status !== 'Inactive') return false;
    if (currentMemberFilter === 'leaders' && !m.isLeader) return false;
    if (currentMemberFilter === 'new' && !m.isNew) return false;

    if (qName && !m.fullName.toLowerCase().includes(qName)) return false;
    if (qMemNo && !m.membershipNumber.toLowerCase().includes(qMemNo)) return false;
    if (qPhone && !m.phone.toLowerCase().includes(qPhone)) return false;
    if (qMkoa && !m.mkoa.toLowerCase().includes(qMkoa)) return false;
    if (qWilaya && !m.wilaya.toLowerCase().includes(qWilaya)) return false;
    if (qUkoo && !m.ukoo.toLowerCase().includes(qUkoo)) return false;
    if (qStatus && m.status.toLowerCase() !== qStatus) return false;
    return true;
  });

  const tbody = document.getElementById('membersTableBody');
  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:28px;color:#64748b;">Hakuna mwanachama aliyepatikana kwa vigezo ulivyoweka.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(m => `
    <tr>
      <td>
        <div class="member-cell">
          ${m.photo ? `<img src="${m.photo}" class="member-thumb" alt="${m.fullName}">` : `<div class="member-thumb">${getInitials(m.fullName)}</div>`}
          <div>
            <strong>${m.fullName}</strong>
            <div style="font-size:11.5px;color:#64748b">${m.phone}</div>
          </div>
        </div>
      </td>
      <td><strong style="color:#064e3b">${m.membershipNumber}</strong></td>
      <td><strong>${m.ukoo}</strong><div style="font-size:11.5px;color:#64748b">${m.eneoLaAsili}</div></td>
      <td>${m.mkoa}, ${m.wilaya}</td>
      <td>${m.category}</td>
      <td><span class="badge badge-${m.status.toLowerCase()}">${m.status}</span></td>
      <td>
        <button class="btn btn-sm btn-primary" onclick="openViewDetails('member', '${m.id}')">View Details</button>
      </td>
    </tr>
  `).join('');
}

// 4. Member Registration Form Enhancement
function openRegisterModal() {
  const nextNum = String(appState.members.length + 1).padStart(4, '0');
  document.getElementById('regForm').reset();
  document.getElementById('regMemNumber').value = `WFC-2026-${nextNum}`;
  document.getElementById('regDate').value = new Date().toISOString().slice(0, 10);
  document.getElementById('regPhotoPreview').style.display = 'none';
  document.getElementById('regPhotoPreview').src = '';
  document.getElementById('registerModal').classList.add('open');
}

function previewRegPhoto(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.getElementById('regPhotoPreview');
      img.src = e.target.result;
      img.style.display = 'block';
    };
    reader.readAsDataURL(input.files[0]);
  }
}

function submitMemberRegistration(e) {
  e.preventDefault();
  const newMember = {
    id: 'M' + String(Date.now()).slice(-4),
    membershipNumber: document.getElementById('regMemNumber').value,
    fullName: document.getElementById('regFullName').value,
    gender: document.getElementById('regGender').value,
    dob: document.getElementById('regDob').value,
    phone: document.getElementById('regPhone').value,
    email: document.getElementById('regEmail').value,
    nationalId: document.getElementById('regNationalId').value,
    maritalStatus: document.getElementById('regMarital').value,
    mkoa: document.getElementById('regMkoa').value,
    wilaya: document.getElementById('regWilaya').value,
    tarafa: document.getElementById('regTarafa').value,
    kata: document.getElementById('regKata').value,
    kijiji: document.getElementById('regKijiji').value,
    ukoo: document.getElementById('regUkoo').value,
    kabilaDogo: document.getElementById('regKabilaDogo').value,
    eneoLaAsili: document.getElementById('regEneoAsili').value,
    jinaLaBaba: document.getElementById('regBaba').value,
    jinaLaBabu: document.getElementById('regBabu').value,
    mahaliAlipozaliwa: document.getElementById('regBirthPlace').value,
    category: document.getElementById('regCategory').value,
    registrationDate: document.getElementById('regDate').value,
    status: document.getElementById('regStatus').value,
    isLeader: false,
    isNew: true,
    photo: document.getElementById('regPhotoPreview').src || ''
  };

  appState.members.unshift(newMember);
  appState.notifications.unshift({
    id: 'N' + Date.now(),
    type: 'New Member Registration',
    title: `Usajili Mpya: ${newMember.fullName}`,
    message: `Mwanachama mpya (${newMember.membershipNumber}) kutoka ${newMember.mkoa} - Ukoo wa ${newMember.ukoo} (${newMember.eneoLaAsili}) amesajiliwa.`,
    time: 'Sasa hivi',
    read: false,
    memberId: newMember.id
  });

  saveState();
  closeModal('registerModal');
  renderAll();
  showToast(`Mwanachama ${newMember.fullName} (${newMember.membershipNumber}) amesajiliwa kikamilifu!`);
}

// 5. View Details Feature (Member, Events, Contributions, Leadership)
function openViewDetails(entityType, id) {
  const modal = document.getElementById('viewDetailsModal');
  const titleEl = document.getElementById('viewDetailsTitle');
  const bodyEl = document.getElementById('viewDetailsBody');

  if (entityType === 'member') {
    const m = appState.members.find(x => x.id === id);
    if (!m) return;
    titleEl.textContent = `${m.fullName} (${m.membershipNumber})`;
    const memberContribs = appState.contributions.filter(c => c.memberId === m.id);
    const memberEvents = appState.events.filter(ev => ev.participants.some(p => p.memberId === m.id));
    const memberDocs = appState.documents.filter(d => d.memberId === m.id);

    bodyEl.innerHTML = `
      <div class="detail-tabs">
        <button class="detail-tab-btn active" onclick="switchDetailTab(this, 'tab-m-info')">Taarifa Zote</button>
        <button class="detail-tab-btn" onclick="switchDetailTab(this, 'tab-m-reg')">Historia ya Usajili</button>
        <button class="detail-tab-btn" onclick="switchDetailTab(this, 'tab-m-contrib')">Historia ya Michango (${memberContribs.length})</button>
        <button class="detail-tab-btn" onclick="switchDetailTab(this, 'tab-m-events')">Historia ya Mahudhurio (${memberEvents.length})</button>
        <button class="detail-tab-btn" onclick="switchDetailTab(this, 'tab-m-docs')">Documents (${memberDocs.length})</button>
      </div>
      <div id="tab-m-info" class="detail-tab-pane">
        <h4 style="margin-bottom:10px;color:#064e3b;">Basic & Membership Information</h4>
        <div class="detail-kv-grid" style="margin-bottom:16px;">
          <div class="detail-kv"><span>Full Name</span><strong>${m.fullName}</strong></div>
          <div class="detail-kv"><span>Membership No</span><strong>${m.membershipNumber}</strong></div>
          <div class="detail-kv"><span>Gender / DOB</span><strong>${m.gender} / ${m.dob}</strong></div>
          <div class="detail-kv"><span>Phone / Email</span><strong>${m.phone} / ${m.email}</strong></div>
          <div class="detail-kv"><span>National ID (NIDA)</span><strong>${m.nationalId}</strong></div>
          <div class="detail-kv"><span>Marital Status</span><strong>${m.maritalStatus}</strong></div>
          <div class="detail-kv"><span>Category</span><strong>${m.category}</strong></div>
          <div class="detail-kv"><span>Status</span><strong>${m.status}</strong></div>
        </div>
        <h4 style="margin-bottom:10px;color:#064e3b;">Chagga Identity Information</h4>
        <div class="detail-kv-grid">
          <div class="detail-kv"><span>Ukoo (Clan)</span><strong>${m.ukoo}</strong></div>
          <div class="detail-kv"><span>Kabila Dogo</span><strong>${m.kabilaDogo || '-'}</strong></div>
          <div class="detail-kv"><span>Eneo la Asili</span><strong>${m.eneoLaAsili}</strong></div>
          <div class="detail-kv"><span>Jina la Baba</span><strong>${m.jinaLaBaba}</strong></div>
          <div class="detail-kv"><span>Jina la Babu</span><strong>${m.jinaLaBabu}</strong></div>
          <div class="detail-kv"><span>Mahali Alipozaliwa</span><strong>${m.mahaliAlipozaliwa}</strong></div>
          <div class="detail-kv"><span>Mkoa / Wilaya</span><strong>${m.mkoa} / ${m.wilaya}</strong></div>
          <div class="detail-kv"><span>Tarafa / Kata / Kijiji</span><strong>${m.tarafa}, ${m.kata}, ${m.kijiji}</strong></div>
        </div>
      </div>
      <div id="tab-m-reg" class="detail-tab-pane" style="display:none;">
        <div class="timeline">
          <div class="timeline-item">
            <strong>Tarehe ya Usajili: ${m.registrationDate}</strong>
            <p style="font-size:13px;color:#475569;margin-top:4px;">Alisajiliwa rasmi kama <em>${m.category}</em> chini ya ukoo wa <strong>${m.ukoo}</strong> (${m.eneoLaAsili}).</p>
          </div>
          <div class="timeline-item">
            <strong>Hali ya Sasa: ${m.status}</strong>
            <p style="font-size:13px;color:#475569;margin-top:4px;">Namba ya uanachama ${m.membershipNumber} imehakikiwa kwenye kanzidata ya WFC.</p>
          </div>
        </div>
      </div>
      <div id="tab-m-contrib" class="detail-tab-pane" style="display:none;">
        ${memberContribs.length ? `<table><thead><tr><th>Risiti</th><th>Aina ya Mchango</th><th>Kiasi</th><th>Salio</th><th>Tarehe</th></tr></thead><tbody>
          ${memberContribs.map(c => `<tr><td>${c.receiptNo}</td><td>${c.type}</td><td>${formatTZS(c.amount)}</td><td>${formatTZS(c.balance)}</td><td>${c.date}</td></tr>`).join('')}
        </tbody></table>` : '<p>Hakuna rekodi ya michango kwa mwanachama huyu.</p>'}
      </div>
      <div id="tab-m-events" class="detail-tab-pane" style="display:none;">
        ${memberEvents.length ? `<table><thead><tr><th>Tukio</th><th>Tarehe</th><th>Mahali</th><th>Hali</th></tr></thead><tbody>
          ${memberEvents.map(ev => `<tr><td>${ev.title}</td><td>${ev.date}</td><td>${ev.location}</td><td><span class="badge badge-active">Alishiriki</span></td></tr>`).join('')}
        </tbody></table>` : '<p>Hakuna historia ya mahudhurio ya matukio.</p>'}
      </div>
      <div id="tab-m-docs" class="detail-tab-pane" style="display:none;">
        ${memberDocs.length ? `<table><thead><tr><th>Aina</th><th>Faili</th><th>Tarehe</th><th>Hali</th></tr></thead><tbody>
          ${memberDocs.map(d => `<tr><td>${d.docType}</td><td>${d.fileName}</td><td>${d.uploadDate}</td><td><span class="badge badge-verified">${d.status}</span></td></tr>`).join('')}
        </tbody></table>` : '<p>Hakuna nyaraka zilizowasilishwa bado.</p>'}
      </div>
    `;
  } else if (entityType === 'event') {
    const ev = appState.events.find(x => x.id === id);
    if (!ev) return;
    titleEl.textContent = ev.title;
    bodyEl.innerHTML = `
      <div class="detail-tabs">
        <button class="detail-tab-btn active" onclick="switchDetailTab(this, 'tab-e-info')">Event Details</button>
        <button class="detail-tab-btn" onclick="switchDetailTab(this, 'tab-e-part')">Participants (${ev.participants.length})</button>
        <button class="detail-tab-btn" onclick="switchDetailTab(this, 'tab-e-att')">Attendance History</button>
      </div>
      <div id="tab-e-info" class="detail-tab-pane">
        <div class="detail-kv-grid" style="margin-bottom:14px;">
          <div class="detail-kv"><span>Tarehe</span><strong>${ev.date}</strong></div>
          <div class="detail-kv"><span>Mahali</span><strong>${ev.location}</strong></div>
          <div class="detail-kv"><span>Mratibu</span><strong>${ev.coordinator}</strong></div>
          <div class="detail-kv"><span>Hali</span><strong>${ev.status}</strong></div>
        </div>
        <p style="font-size:14px;color:#334155;background:#f8fafc;padding:14px;border-radius:8px;border:1px solid #e2e8f0;">${ev.description}</p>
      </div>
      <div id="tab-e-part" class="detail-tab-pane" style="display:none;">
        <table><thead><tr><th>Jina la Mshiriki</th><th>Hali</th><th>Muda wa Kuingia</th></tr></thead><tbody>
          ${ev.participants.map(p => `<tr><td>${p.name}</td><td><span class="badge badge-active">${p.status}</span></td><td>${p.checkIn}</td></tr>`).join('')}
        </tbody></table>
      </div>
      <div id="tab-e-att" class="detail-tab-pane" style="display:none;">
        <div class="detail-kv-grid">
          <div class="detail-kv"><span>Walioalikwa / Wanaotarajiwa</span><strong>${ev.expectedCount}</strong></div>
          <div class="detail-kv"><span>Waliohudhuria / Waliothibitisha</span><strong>${ev.attendedCount}</strong></div>
          <div class="detail-kv"><span>Asilimia ya Mahudhurio</span><strong>${Math.round((ev.attendedCount / ev.expectedCount) * 100)}%</strong></div>
        </div>
      </div>
    `;
  } else if (entityType === 'contribution') {
    const c = appState.contributions.find(x => x.id === id);
    if (!c) return;
    titleEl.textContent = `Mchango - ${c.receiptNo}`;
    bodyEl.innerHTML = `
      <div class="detail-tabs">
        <button class="detail-tab-btn active" onclick="switchDetailTab(this, 'tab-c-pay')">Payment History</button>
        <button class="detail-tab-btn" onclick="switchDetailTab(this, 'tab-c-rec')">Receipt</button>
        <button class="detail-tab-btn" onclick="switchDetailTab(this, 'tab-c-bal')">Outstanding Balances</button>
      </div>
      <div id="tab-c-pay" class="detail-tab-pane">
        <div class="detail-kv-grid">
          <div class="detail-kv"><span>Mwanachama</span><strong>${c.memberName}</strong></div>
          <div class="detail-kv"><span>Aina ya Mchango</span><strong>${c.type}</strong></div>
          <div class="detail-kv"><span>Kiasi Kilicholipwa</span><strong>${formatTZS(c.amount)}</strong></div>
          <div class="detail-kv"><span>Njia ya Malipo</span><strong>${c.method}</strong></div>
          <div class="detail-kv"><span>Tarehe</span><strong>${c.date}</strong></div>
          <div class="detail-kv"><span>Hali</span><strong>${c.status}</strong></div>
        </div>
      </div>
      <div id="tab-c-rec" class="detail-tab-pane" style="display:none;">
        <div style="border:2px dashed #064e3b;padding:20px;border-radius:12px;background:#f0fdf4;">
          <h4 style="color:#064e3b;margin-bottom:6px;">RISITI RASMI YA WACHAGGA FAMILY COMMUNITY (WFC)</h4>
          <p style="font-size:13px;"><strong>Namba ya Risiti:</strong> ${c.receiptNo}</p>
          <p style="font-size:13px;"><strong>Imepokelewa Kutoka:</strong> ${c.memberName}</p>
          <p style="font-size:13px;"><strong>Kwa Ajili Ya:</strong> ${c.type}</p>
          <p style="font-size:13px;"><strong>Kiasi:</strong> ${formatTZS(c.amount)} (${c.method})</p>
          <p style="font-size:13px;"><strong>Tarehe:</strong> ${c.date}</p>
          <button class="btn btn-sm btn-primary" style="margin-top:12px;" onclick="window.print()">Chapa Risiti</button>
        </div>
      </div>
      <div id="tab-c-bal" class="detail-tab-pane" style="display:none;">
        <div class="detail-kv">
          <span>Salio Linalodaiwa (Outstanding Balance)</span>
          <strong style="font-size:20px;color:${c.balance > 0 ? '#dc2626' : '#059669'};">${formatTZS(c.balance)}</strong>
        </div>
      </div>
    `;
  } else if (entityType === 'leadership') {
    const l = appState.leadership.find(x => x.id === id);
    if (!l) return;
    titleEl.textContent = `Uongozi - ${l.memberName}`;
    bodyEl.innerHTML = `
      <div class="detail-tabs">
        <button class="detail-tab-btn active" onclick="switchDetailTab(this, 'tab-l-pos')">Position History</button>
        <button class="detail-tab-btn" onclick="switchDetailTab(this, 'tab-l-term')">Terms Served</button>
      </div>
      <div id="tab-l-pos" class="detail-tab-pane">
        <div class="timeline">
          ${l.history.map(h => `
            <div class="timeline-item">
              <strong>${h.role} (${h.period})</strong>
              <p style="font-size:13px;color:#475569;margin-top:4px;">${h.notes}</p>
            </div>
          `).join('')}
        </div>
      </div>
      <div id="tab-l-term" class="detail-tab-pane" style="display:none;">
        <div class="detail-kv-grid">
          <div class="detail-kv"><span>Kiongozi</span><strong>${l.memberName}</strong></div>
          <div class="detail-kv"><span>Wadhifa wa Sasa / Mwisho</span><strong>${l.position}</strong></div>
          <div class="detail-kv"><span>Muhula (Term)</span><strong>${l.term}</strong></div>
          <div class="detail-kv"><span>Ukoo</span><strong>${l.ukoo}</strong></div>
        </div>
      </div>
    `;
  }

  modal.classList.add('open');
}

function switchDetailTab(btn, paneId) {
  const parent = btn.closest('.modal-body');
  parent.querySelectorAll('.detail-tab-btn').forEach(b => b.classList.remove('active'));
  parent.querySelectorAll('.detail-tab-pane').forEach(p => p.style.display = 'none');
  btn.classList.add('active');
  document.getElementById(paneId).style.display = 'block';
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

// 6. Member History Module
function renderMemberHistoryModule() {
  const select = document.getElementById('historyMemberSelect');
  if (!select) return;
  const currentVal = select.value || appState.members[0]?.id;
  select.innerHTML = appState.members.map(m => `<option value="${m.id}" ${m.id === currentVal ? 'selected' : ''}>${m.fullName} (${m.membershipNumber})</option>`).join('');

  const m = appState.members.find(x => x.id === select.value) || appState.members[0];
  if (!m) return;

  const contribs = appState.contributions.filter(c => c.memberId === m.id);
  const events = appState.events.filter(e => e.participants.some(p => p.memberId === m.id));
  const leaders = appState.leadership.filter(l => l.memberId === m.id);
  const notifs = appState.notifications.filter(n => n.memberId === m.id);
  const docs = appState.documents.filter(d => d.memberId === m.id);

  document.getElementById('memberHistoryContainer').innerHTML = `
    <div class="detail-kv-grid" style="margin-bottom:20px;">
      <div class="detail-kv"><span>Mwanachama</span><strong>${m.fullName}</strong></div>
      <div class="detail-kv"><span>Ukoo & Asili</span><strong>${m.ukoo} — ${m.eneoLaAsili}</strong></div>
      <div class="detail-kv"><span>Tarehe ya Usajili</span><strong>${m.registrationDate}</strong></div>
      <div class="detail-kv"><span>Hali ya Uanachama</span><strong>${m.status}</strong></div>
    </div>
    <div class="form-grid">
      <div class="card"><div class="card-header"><h4 class="card-title">1. Registration History</h4></div><div class="card-body">
        <p><strong>Namba:</strong> ${m.membershipNumber}</p>
        <p><strong>Aina:</strong> ${m.category}</p>
        <p><strong>Tarehe:</strong> ${m.registrationDate}</p>
        <p><strong>Eneo:</strong> ${m.mkoa}, ${m.wilaya}</p>
      </div></div>
      <div class="card"><div class="card-header"><h4 class="card-title">2. Contributions History (${contribs.length})</h4></div><div class="card-body">
        ${contribs.length ? contribs.map(c => `<div style="padding:6px 0;border-bottom:1px solid #eee;"><strong>${c.type}</strong>: ${formatTZS(c.amount)} (${c.date})</div>`).join('') : '<p style="color:#64748b;">Hakuna michango.</p>'}
      </div></div>
      <div class="card"><div class="card-header"><h4 class="card-title">3. Event Attendance History (${events.length})</h4></div><div class="card-body">
        ${events.length ? events.map(e => `<div style="padding:6px 0;border-bottom:1px solid #eee;"><strong>${e.title}</strong> (${e.date})</div>`).join('') : '<p style="color:#64748b;">Hakuna mahudhurio.</p>'}
      </div></div>
      <div class="card"><div class="card-header"><h4 class="card-title">4. Leadership / Service History (${leaders.length})</h4></div><div class="card-body">
        ${leaders.length ? leaders.map(l => `<div><strong>${l.position}</strong> (${l.term})</div>`).join('') : '<p style="color:#64748b;">Mwanachama wa kawaida.</p>'}
      </div></div>
      <div class="card"><div class="card-header"><h4 class="card-title">5. Notifications Received (${notifs.length})</h4></div><div class="card-body">
        ${notifs.length ? notifs.map(n => `<div style="padding:6px 0;border-bottom:1px solid #eee;"><strong>${n.title}</strong><div style="font-size:12px;color:#64748b;">${n.time}</div></div>`).join('') : '<p style="color:#64748b;">Hakuna arifa maalum.</p>'}
      </div></div>
      <div class="card"><div class="card-header"><h4 class="card-title">6. Documents History (${docs.length})</h4></div><div class="card-body">
        ${docs.length ? docs.map(d => `<div style="padding:6px 0;border-bottom:1px solid #eee;"><strong>${d.docType}</strong>: ${d.fileName} (${d.uploadDate})</div>`).join('') : '<p style="color:#64748b;">Hakuna nyaraka.</p>'}
      </div></div>
    </div>
  `;
}

// Contributions, Events, Leadership Tables
function renderOtherTables() {
  document.getElementById('contributionsTableBody').innerHTML = appState.contributions.map(c => `
    <tr>
      <td><strong>${c.receiptNo}</strong></td>
      <td>${c.memberName}</td>
      <td>${c.type}</td>
      <td><strong>${formatTZS(c.amount)}</strong></td>
      <td style="color:${c.balance > 0 ? '#dc2626' : '#059669'};font-weight:600;">${formatTZS(c.balance)}</td>
      <td>${c.date}</td>
      <td><span class="badge badge-${c.status === 'Paid' ? 'paid' : (c.status === 'Partial' ? 'pending' : 'overdue')}">${c.status}</span></td>
      <td><button class="btn btn-sm btn-primary" onclick="openViewDetails('contribution', '${c.id}')">View Details</button></td>
    </tr>
  `).join('');

  document.getElementById('eventsTableBody').innerHTML = appState.events.map(e => `
    <tr>
      <td><strong>${e.title}</strong></td>
      <td>${e.date}</td>
      <td>${e.location}</td>
      <td>${e.attendedCount} / ${e.expectedCount}</td>
      <td><span class="badge badge-${e.status === 'Upcoming' ? 'upcoming' : 'active'}">${e.status}</span></td>
      <td><button class="btn btn-sm btn-primary" onclick="openViewDetails('event', '${e.id}')">View Details</button></td>
    </tr>
  `).join('');

  document.getElementById('leadershipTableBody').innerHTML = appState.leadership.map(l => `
    <tr>
      <td><strong>${l.memberName}</strong></td>
      <td>${l.position}</td>
      <td>${l.ukoo}</td>
      <td>${l.term}</td>
      <td><span class="badge badge-${l.status === 'Current' ? 'active' : 'info'}">${l.status}</span></td>
      <td><button class="btn btn-sm btn-primary" onclick="openViewDetails('leadership', '${l.id}')">View Details</button></td>
    </tr>
  `).join('');
}

// 7. Reports Module (Membership, Financial, Location, Event, Leadership + Export PDF, Export Excel, Print)
function selectReportCategory(cat, btn) {
  currentReportType = cat;
  document.querySelectorAll('#reportCategoryTabs .filter-pill').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderReportsModule();
}

function renderReportsModule() {
  const container = document.getElementById('reportOutputContainer');
  if (!container) return;

  if (currentReportType === 'membership') {
    const total = appState.members.length;
    const active = appState.members.filter(m => m.status === 'Active').length;
    const inactive = appState.members.filter(m => m.status === 'Inactive').length;
    const newly = appState.members.filter(m => m.isNew).length;
    container.innerHTML = `
      <div class="kpi-grid">
        <div class="kpi-card"><div><div class="kpi-label">Total Members</div><div class="kpi-value">${total}</div></div></div>
        <div class="kpi-card"><div><div class="kpi-label">Active Members</div><div class="kpi-value" style="color:#059669">${active}</div></div></div>
        <div class="kpi-card"><div><div class="kpi-label">Inactive Members</div><div class="kpi-value" style="color:#dc2626">${inactive}</div></div></div>
        <div class="kpi-card"><div><div class="kpi-label">New Members</div><div class="kpi-value" style="color:#0284c7">${newly}</div></div></div>
      </div>
      <div class="table-responsive"><table id="activeReportTable">
        <thead><tr><th>Membership No</th><th>Full Name</th><th>Ukoo</th><th>Eneo la Asili</th><th>Registration Date</th><th>Status</th></tr></thead>
        <tbody>${appState.members.map(m => `<tr><td>${m.membershipNumber}</td><td>${m.fullName}</td><td>${m.ukoo}</td><td>${m.eneoLaAsili}</td><td>${m.registrationDate}</td><td>${m.status}</td></tr>`).join('')}</tbody>
      </table></div>
    `;
  } else if (currentReportType === 'financial') {
    const collected = appState.contributions.reduce((s, c) => s + Number(c.amount), 0);
    const outstanding = appState.contributions.reduce((s, c) => s + Number(c.balance), 0);
    container.innerHTML = `
      <div class="kpi-grid">
        <div class="kpi-card"><div><div class="kpi-label">Contributions Summary (Collected)</div><div class="kpi-value">${formatTZS(collected)}</div></div></div>
        <div class="kpi-card"><div><div class="kpi-label">Monthly Collections (Nov 2026)</div><div class="kpi-value">${formatTZS(collected)}</div></div></div>
        <div class="kpi-card"><div><div class="kpi-label">Annual Collections (2026)</div><div class="kpi-value">${formatTZS(collected + 28500000)}</div></div></div>
        <div class="kpi-card"><div><div class="kpi-label">Outstanding Contributions</div><div class="kpi-value" style="color:#dc2626">${formatTZS(outstanding)}</div></div></div>
      </div>
      <div class="table-responsive"><table id="activeReportTable">
        <thead><tr><th>Receipt No</th><th>Member</th><th>Contribution Type</th><th>Paid Amount</th><th>Outstanding Balance</th><th>Date</th></tr></thead>
        <tbody>${appState.contributions.map(c => `<tr><td>${c.receiptNo}</td><td>${c.memberName}</td><td>${c.type}</td><td>${formatTZS(c.amount)}</td><td>${formatTZS(c.balance)}</td><td>${c.date}</td></tr>`).join('')}</tbody>
      </table></div>
    `;
  } else if (currentReportType === 'location') {
    const byRegion = {}, byDistrict = {}, byClan = {};
    appState.members.forEach(m => {
      byRegion[m.mkoa] = (byRegion[m.mkoa] || 0) + 1;
      byDistrict[m.wilaya] = (byDistrict[m.wilaya] || 0) + 1;
      byClan[m.ukoo] = (byClan[m.ukoo] || 0) + 1;
    });
    container.innerHTML = `
      <div class="form-grid" style="margin-bottom:18px;">
        <div class="card"><div class="card-header"><h4 class="card-title">Members by Region (Mkoa)</h4></div><div class="card-body">
          ${Object.entries(byRegion).map(([k, v]) => `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #eee;"><span>${k}</span><strong>${v}</strong></div>`).join('')}
        </div></div>
        <div class="card"><div class="card-header"><h4 class="card-title">Members by District (Wilaya)</h4></div><div class="card-body">
          ${Object.entries(byDistrict).map(([k, v]) => `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #eee;"><span>${k}</span><strong>${v}</strong></div>`).join('')}
        </div></div>
        <div class="card"><div class="card-header"><h4 class="card-title">Members by Clan (Ukoo)</h4></div><div class="card-body">
          ${Object.entries(byClan).map(([k, v]) => `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #eee;"><span>${k}</span><strong>${v}</strong></div>`).join('')}
        </div></div>
      </div>
      <div class="table-responsive"><table id="activeReportTable">
        <thead><tr><th>Member</th><th>Mkoa</th><th>Wilaya</th><th>Ukoo (Clan)</th><th>Eneo la Asili</th></tr></thead>
        <tbody>${appState.members.map(m => `<tr><td>${m.fullName}</td><td>${m.mkoa}</td><td>${m.wilaya}</td><td>${m.ukoo}</td><td>${m.eneoLaAsili}</td></tr>`).join('')}</tbody>
      </table></div>
    `;
  } else if (currentReportType === 'event') {
    container.innerHTML = `
      <div class="table-responsive"><table id="activeReportTable">
        <thead><tr><th>Event Title</th><th>Date</th><th>Location</th><th>Expected</th><th>Attended</th><th>Participation Rate</th></tr></thead>
        <tbody>${appState.events.map(e => `<tr><td>${e.title}</td><td>${e.date}</td><td>${e.location}</td><td>${e.expectedCount}</td><td>${e.attendedCount}</td><td>${Math.round((e.attendedCount / e.expectedCount) * 100)}%</td></tr>`).join('')}</tbody>
      </table></div>
    `;
  } else if (currentReportType === 'leadership') {
    container.innerHTML = `
      <div class="table-responsive"><table id="activeReportTable">
        <thead><tr><th>Leader Name</th><th>Position</th><th>Ukoo</th><th>Term</th><th>Category</th></tr></thead>
        <tbody>${appState.leadership.map(l => `<tr><td>${l.memberName}</td><td>${l.position}</td><td>${l.ukoo}</td><td>${l.term}</td><td>${l.status} Leaders</td></tr>`).join('')}</tbody>
      </table></div>
    `;
  }
}

function exportReportExcel() {
  const table = document.getElementById('activeReportTable');
  if (!table) return;
  let csv = [];
  for (let row of table.rows) {
    let cols = Array.from(row.cells).map(c => '"' + c.innerText.replace(/"/g, '""') + '"');
    csv.push(cols.join(','));
  }
  const blob = new Blob([csv.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `WFC_Report_${currentReportType}_2026.csv`;
  link.click();
  showToast('Ripoti imepakuliwa katika muundo wa Excel (CSV)!');
}

function exportReportPDF() {
  showToast('Inaandaa nakala ya PDF ya ripoti...');
  setTimeout(() => window.print(), 350);
}

// 8. Notifications Enhancement
function renderNotifications() {
  const unread = appState.notifications.filter(n => !n.read).length;
  const badge = document.getElementById('headerNotifBadge');
  badge.textContent = unread;
  badge.style.display = unread > 0 ? 'flex' : 'none';

  const sideBadge = document.getElementById('sidebarNotifBadge');
  if (sideBadge) {
    sideBadge.textContent = unread;
    sideBadge.style.display = unread > 0 ? 'inline-block' : 'none';
  }

  // Header Mini List
  document.getElementById('headerNotifList').innerHTML = appState.notifications.slice(0, 4).map(n => `
    <div class="notif-mini-item ${n.read ? '' : 'unread'}" onclick="toggleNotificationRead('${n.id}')">
      <span class="notif-dot"></span>
      <div>
        <div style="font-size:11px;font-weight:700;color:#064e3b;">${n.type}</div>
        <div style="font-size:12.5px;font-weight:600;">${n.title}</div>
        <div style="font-size:11px;color:#64748b;">${n.time}</div>
      </div>
    </div>
  `).join('');

  // Full Notifications View
  const filterType = document.getElementById('notifTypeFilter')?.value || 'ALL';
  const filtered = appState.notifications.filter(n => filterType === 'ALL' || n.type === filterType);
  document.getElementById('allNotificationsList').innerHTML = filtered.map(n => `
    <div style="padding:16px;border-bottom:1px solid #e2e8f0;background:${n.read ? '#fff' : '#f0fdf4'};display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">
      <div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
          <span class="badge ${n.read ? 'badge-info' : 'badge-active'}">${n.read ? 'Read' : 'Unread'}</span>
          <span style="font-size:12px;font-weight:700;color:#064e3b;">${n.type}</span>
          <span style="font-size:11.5px;color:#64748b;">• ${n.time}</span>
        </div>
        <h4 style="font-size:14.5px;margin-bottom:4px;">${n.title}</h4>
        <p style="font-size:13px;color:#475569;">${n.message}</p>
      </div>
      <button class="btn btn-sm btn-outline" onclick="toggleNotificationRead('${n.id}')">${n.read ? 'Mark Unread' : 'Mark Read'}</button>
    </div>
  `).join('');
}

function toggleNotificationRead(id) {
  const n = appState.notifications.find(x => x.id === id);
  if (n) {
    n.read = !n.read;
    saveState();
    renderNotifications();
    renderDashboard();
  }
}

function markAllNotificationsRead() {
  appState.notifications.forEach(n => n.read = true);
  saveState();
  renderNotifications();
  renderDashboard();
  showToast('Arifa zote zimewekwa alama kuwa zimesomwa.');
}

// 11. Documents Module (View, Download, Replace, Delete)
function renderDocuments() {
  const catFilter = document.getElementById('docCategoryFilter')?.value || 'ALL';
  const list = appState.documents.filter(d => catFilter === 'ALL' || d.docType === catFilter);

  document.getElementById('documentsTableBody').innerHTML = list.map(d => `
    <tr>
      <td><strong>${d.memberName}</strong></td>
      <td><span class="badge badge-info">${d.docType}</span></td>
      <td>${d.fileName} <div style="font-size:11px;color:#64748b;">${d.fileSize} • ${d.uploadDate}</div></td>
      <td><span class="badge badge-${d.status === 'Verified' ? 'verified' : 'pending'}">${d.status}</span></td>
      <td>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          <button class="btn btn-sm btn-outline" onclick="viewDocument('${d.id}')">View</button>
          <button class="btn btn-sm btn-outline" onclick="downloadDocument('${d.id}')">Download</button>
          <button class="btn btn-sm btn-outline" onclick="triggerReplaceDocument('${d.id}')">Replace</button>
          <button class="btn btn-sm btn-danger-outline" onclick="deleteDocument('${d.id}')">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function viewDocument(id) {
  const d = appState.documents.find(x => x.id === id);
  if (!d) return;
  document.getElementById('viewDetailsTitle').textContent = `Nyaraka: ${d.fileName}`;
  document.getElementById('viewDetailsBody').innerHTML = `
    <div class="detail-kv-grid" style="margin-bottom:16px;">
      <div class="detail-kv"><span>Mwanachama</span><strong>${d.memberName}</strong></div>
      <div class="detail-kv"><span>Aina ya Nyaraka</span><strong>${d.docType}</strong></div>
      <div class="detail-kv"><span>Tarehe ya Kupakia</span><strong>${d.uploadDate}</strong></div>
      <div class="detail-kv"><span>Ukubwa / Hali</span><strong>${d.fileSize} (${d.status})</strong></div>
    </div>
    <div style="background:#f8fafc;border:1px solid #cbd5e1;border-radius:10px;padding:24px;text-align:center;">
      <p style="font-weight:700;color:#064e3b;margin-bottom:8px;">HAKIKI YA NYARAKA (${d.fileName})</p>
      <p style="font-size:13.5px;color:#334155;">${d.summary}</p>
    </div>
  `;
  document.getElementById('viewDetailsModal').classList.add('open');
}

function downloadDocument(id) {
  const d = appState.documents.find(x => x.id === id);
  if (!d) return;
  const content = `WFC PORTAL V6 DOCUMENT RECORD\nMember: ${d.memberName}\nType: ${d.docType}\nFile: ${d.fileName}\nDate: ${d.uploadDate}\nDetails: ${d.summary}`;
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = d.fileName.replace(/\.[^/.]+$/, "") + "_WFC.txt";
  a.click();
  showToast(`Inapakua ${d.fileName}...`);
}

let docIdToReplace = null;
function triggerReplaceDocument(id) {
  docIdToReplace = id;
  document.getElementById('hiddenReplaceInput').click();
}

function handleReplaceFileSelected(input) {
  if (!input.files || !input.files[0] || !docIdToReplace) return;
  const file = input.files[0];
  const d = appState.documents.find(x => x.id === docIdToReplace);
  if (d) {
    d.fileName = file.name;
    d.fileSize = Math.max(12, Math.round(file.size / 1024)) + ' KB';
    d.uploadDate = new Date().toISOString().slice(0, 10);
    d.status = 'Verified';
    saveState();
    renderDocuments();
    showToast(`Nyaraka imebadilishwa kuwa ${file.name}!`);
  }
  input.value = '';
  docIdToReplace = null;
}

function deleteDocument(id) {
  if (!confirm('Je, una uhakika unataka kufuta nyaraka hii?')) return;
  appState.documents = appState.documents.filter(d => d.id !== id);
  saveState();
  renderDocuments();
  showToast('Nyaraka imefutwa.');
}

function openUploadDocModal() {
  const sel = document.getElementById('docMemberSelect');
  sel.innerHTML = appState.members.map(m => `<option value="${m.id}">${m.fullName} (${m.membershipNumber})</option>`).join('');
  document.getElementById('uploadDocModal').classList.add('open');
}

function submitNewDocument(e) {
  e.preventDefault();
  const memberId = document.getElementById('docMemberSelect').value;
  const member = appState.members.find(m => m.id === memberId);
  const docType = document.getElementById('docTypeSelect').value;
  const fileInput = document.getElementById('docFileInput');
  const fileName = fileInput.files[0] ? fileInput.files[0].name : `${docType.replace(/\s+/g, '_')}_${member.ukoo}.pdf`;

  appState.documents.unshift({
    id: 'D' + Date.now(),
    memberId,
    memberName: member ? member.fullName : 'Mwanachama',
    docType,
    fileName,
    uploadDate: new Date().toISOString().slice(0, 10),
    fileSize: '540 KB',
    status: 'Verified',
    summary: `Nyaraka ya ${docType} iliyopakiwa kwenye mfumo wa WFC Portal V6.`
  });

  saveState();
  closeModal('uploadDocModal');
  renderDocuments();
  showToast('Nyaraka mpya imehifadhiwa!');
}

// User Profile & Logout Actions
function openProfileModal(tab) {
  document.querySelectorAll('.dropdown-panel').forEach(p => p.classList.remove('open'));
  const titleMap = { profile: 'My Profile', settings: 'System Settings', password: 'Change Password' };
  document.getElementById('profileModalTitle').textContent = titleMap[tab] || 'My Profile';
  document.getElementById('profileTabContent').style.display = tab === 'profile' ? 'block' : 'none';
  document.getElementById('settingsTabContent').style.display = tab === 'settings' ? 'block' : 'none';
  document.getElementById('passwordTabContent').style.display = tab === 'password' ? 'block' : 'none';
  document.getElementById('profileModal').classList.add('open');
}

function handleLogout() {
  if (confirm('Je, unataka kutoka kwenye mfumo wa WFC Portal V6 (Logout)?')) {
    showToast('Umetoka kwenye mfumo kwa usalama. Karibu tena WFC Portal V6!');
  }
}

function renderAll() {
  renderDashboard();
  renderMembersTable();
  renderMemberHistoryModule();
  renderOtherTables();
  renderReportsModule();
  renderNotifications();
  renderDocuments();
}

document.addEventListener('DOMContentLoaded', () => {
  setLanguage(currentLang);
  renderCharts();
});
