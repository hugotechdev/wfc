(() => {
  const root = document.documentElement;
  const savedTheme = localStorage.getItem('wfc_theme') || 'dark';
  root.setAttribute('data-theme', savedTheme);

  const toastEl = document.getElementById('wfc-toast');
  function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(window._wfcDashToast);
    window._wfcDashToast = setTimeout(() => toastEl.classList.remove('show'), 3200);
  }

  // Theme toggle
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem('wfc_theme', next);
    });
  }

  // Sidebar mobile toggle
  const sidebar = document.getElementById('sidebar');
  const openSb = document.getElementById('open-sidebar');
  const closeSb = document.getElementById('close-sidebar');
  if (openSb && sidebar) openSb.addEventListener('click', () => sidebar.classList.add('open'));
  if (closeSb && sidebar) closeSb.addEventListener('click', () => sidebar.classList.remove('open'));

  // Auth State
  const token = localStorage.getItem('wfc_token') || 'offline-demo-token';
  let currentUser = null;
  try {
    currentUser = JSON.parse(localStorage.getItem('wfc_user') || 'null');
  } catch (e) {}

  if (!currentUser) {
    currentUser = {
      id: 1,
      wfc_id: 'WFC-2026-0001',
      fullname: 'Mwanzilishi WFC (Super Admin)',
      phone: '0700000001',
      clan: 'Mushi',
      region: 'Dar es Salaam',
      role: 'super_admin'
    };
  }

  const roleLabels = {
    super_admin: 'Super Admin / Founder',
    chairperson: 'Mwenyekiti Taifa',
    secretary: 'Katibu Mkuu',
    treasurer: 'Mhasibu / Mweka Hazina',
    regional_leader: 'Kiongozi wa Kanda',
    member: 'Mwanachama'
  };

  const stageLabels = {
    pending_treasurer: '1. Inasubiri Mhasibu',
    verified_treasurer: '2. Imehakikiwa (Mhasibu)',
    approved_secretary: '3. Imeidhinishwa (Katibu)',
    approved_chairperson: '4. Imekamilika (Mwenyekiti)',
    rejected: 'Imekataliwa'
  };

  document.getElementById('user-wfc-id').textContent = currentUser.wfc_id;
  document.getElementById('user-role-label').textContent = roleLabels[currentUser.role] || currentUser.role;
  document.getElementById('user-fullname').textContent = currentUser.fullname;
  document.getElementById('user-meta').textContent = `Ukoo: ${currentUser.clan || 'Mushi'} • ${currentUser.region || 'Tanzania'}`;

  const isLeader = ['super_admin', 'chairperson', 'secretary', 'treasurer', 'regional_leader'].includes(currentUser.role);
  if (!isLeader) {
    document.querySelectorAll('.leader-only-btn').forEach(el => el.classList.add('hidden'));
  }

  // Logout
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('wfc_token');
      localStorage.removeItem('wfc_user');
      window.location.href = 'index.html';
    });
  }

  // Tabs switching
  const pageTitles = {
    overview: 'Muhtasari wa Ofisi ya WFC',
    finance: 'Fedha, Michango & Risiti',
    welfare: 'Misiba, Harusi & Ugonjwa',
    members: 'Wanachama & Safu ya Uongozi',
    announcements: 'Matangazo Rasmi & Vikao',
    projects: 'Miradi & Uwekezaji wa WFC',
    tickets: 'Tiketi za Matukio'
  };

  function switchTab(tabKey) {
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabKey);
    });
    document.querySelectorAll('.tab-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === `tab-${tabKey}`);
    });
    const pt = document.getElementById('page-title');
    if (pt && pageTitles[tabKey]) pt.textContent = pageTitles[tabKey];
    if (sidebar) sidebar.classList.remove('open');
  }

  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab')));
  });

  document.querySelectorAll('[data-jump-tab]').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.getAttribute('data-jump-tab')));
  });

  // Modals
  function openModal(id) {
    const m = document.getElementById(id);
    if (m && typeof m.showModal === 'function') m.showModal();
  }
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const m = document.getElementById(btn.getAttribute('data-close-modal'));
      if (m) m.close();
    });
  });

  document.getElementById('quick-pay-btn')?.addEventListener('click', () => openModal('contrib-modal'));
  document.getElementById('open-contrib-modal')?.addEventListener('click', () => openModal('contrib-modal'));
  document.getElementById('open-welfare-modal')?.addEventListener('click', () => openModal('welfare-modal'));
  document.getElementById('open-announce-modal')?.addEventListener('click', () => openModal('announce-modal'));

  // API Helper with Fallback Demo State
  const fallbackState = {
    transactions: [
      { id: 1, receipt_no: 'WFC-RCT-2026-101', member_name: 'Mwanachama Hai WFC', wfc_id: 'WFC-2026-0475', category: 'Ada ya Mwezi', amount: 50000, channel: 'M-Pesa', reference_code: 'MP261110A91', stage: 'approved_chairperson', approved_by: 'Mwenyekiti Taifa WFC' },
      { id: 2, receipt_no: 'WFC-RCT-2026-102', member_name: 'Kiongozi wa Kanda - Dar', wfc_id: 'WFC-2026-0005', category: 'Uwekezaji WCSC / SACCOS', amount: 250000, channel: 'CRDB Bank', reference_code: 'CRDB889012', stage: 'approved_secretary', approved_by: 'Katibu Mkuu WFC' },
      { id: 3, receipt_no: 'WFC-RCT-2026-103', member_name: 'Mwanachama Hai WFC', wfc_id: 'WFC-2026-0475', category: 'Mfuko wa Maafa / Msiba', amount: 30000, channel: 'Tigo Pesa', reference_code: 'TG88990044', stage: 'verified_treasurer', approved_by: 'Mhasibu Mkuu WFC' },
      { id: 4, receipt_no: 'WFC-RCT-2026-104', member_name: 'Mwanachama Hai WFC', wfc_id: 'WFC-2026-0475', category: 'Tamasha la WFC', amount: 60000, channel: 'Airtel Money', reference_code: 'AM77231099', stage: 'pending_treasurer', approved_by: '' }
    ],
    welfare: [
      { id: 1, case_code: 'WFC-WLF-01', type: 'Msiba', member_name: 'Familia ya Mzee E. Tarimo', region: 'Marangu, Kilimanjaro', title: 'Rambirambi ya Msiba wa Mzee E. Tarimo', description: 'Jumuiya inashirikiana kufariji familia ya mwanachama mwenzetu aliyefiwa na baba mzazi.', target_amount: 2000000, collected_amount: 1650000 },
      { id: 2, case_code: 'WFC-WLF-02', type: 'Harusi', member_name: 'Bwana & Bibi K. Urassa', region: 'Dar es Salaam', title: 'Sherehe ya Harusi ya Mwanachama K. Urassa', description: 'Mchango wa zawadi na heshima ya WFC kwa harusi itakayofanyika Mikocheni.', target_amount: 1500000, collected_amount: 1280000 }
    ],
    members: [
      { id: 1, wfc_id: 'WFC-2026-0001', fullname: 'Mwanzilishi WFC (Super Admin)', phone: '0700000001', clan: 'Mushi', region: 'Dar es Salaam', role: 'super_admin' },
      { id: 2, wfc_id: 'WFC-2026-0002', fullname: 'Mwenyekiti Taifa WFC', phone: '0700000002', clan: 'Massawe', region: 'Kilimanjaro', role: 'chairperson' },
      { id: 3, wfc_id: 'WFC-2026-0003', fullname: 'Katibu Mkuu WFC', phone: '0700000003', clan: 'Kimaro', region: 'Dar es Salaam', role: 'secretary' },
      { id: 4, wfc_id: 'WFC-2026-0004', fullname: 'Mhasibu Mkuu WFC', phone: '0700000004', clan: 'Lyimo', region: 'Arusha', role: 'treasurer' },
      { id: 5, wfc_id: 'WFC-2026-0005', fullname: 'Kiongozi wa Kanda - Dar', phone: '0700000005', clan: 'Swai', region: 'Dar es Salaam', role: 'regional_leader' },
      { id: 6, wfc_id: 'WFC-2026-0475', fullname: 'Mwanachama Hai WFC', phone: '0711111111', clan: 'Shirima', region: 'Kilimanjaro', role: 'member' }
    ],
    announcements: [
      { id: 1, category: 'KIKAO', title: 'Kikao Kikuu cha Robo Mwaka cha WFC Mtandaoni', body: 'Habari wana-WFC. Tunawakaribisha kwenye kikao chetu kikuu kupitia Google Meet kujadili maendeleo ya WCSC, SACCOS na maandalizi ya Wachagga Family Community Festival.', meet_link: 'https://meet.google.com', author_name: 'Katibu Mkuu WFC', likes_count: 48 }
    ],
    projects: [
      { tag: 'UWEKEZAJI', title: 'WCSC (Wachagga Community Savings & Credit)', description: 'Mfuko wa uwekezaji wa pamoja na mikopo nafuu kwa wanachama wa WFC.', target_amount: 80000000, raised_amount: 62400000, progress_percent: 78 },
      { tag: 'MAENDELEO', title: 'WFC SACCOS & UTT AMIS', description: 'Uwekezaji wa pamoja katika mifuko ya UTT AMIS (Umoja & Wekeza Maisha).', target_amount: 60000000, raised_amount: 45000000, progress_percent: 75 },
      { tag: 'UTAMADUNI', title: 'Community Tours (Kilimanjaro & Ngorongoro)', description: 'Utalii wa ndani na utamaduni wa Wachagga kuimarisha umoja na vipato.', target_amount: 25000000, raised_amount: 17500000, progress_percent: 70 },
      { tag: 'UWEZESHAJI', title: 'WFC Queens Empowerment', description: 'Programu maalum ya wanawake wa WFC katika ujasiriamali na uongozi.', target_amount: 30000000, raised_amount: 24600000, progress_percent: 82 }
    ],
    tickets: [
      { ticket_code: 'WFC-TKT-202601', event_title: 'Wachagga Family Community Festival 2026', fullname: currentUser.fullname, phone: currentUser.phone, tier: 'VIP', quantity: 1, total_amount: 60000, channel: 'M-Pesa', status: 'confirmed' }
    ]
  };

  async function apiFetch(url, options = {}) {
    const headers = options.headers || {};
    headers['Authorization'] = `Bearer ${token}`;
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    const res = await fetch(url, { ...options, headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Hitilafu imetokea');
    return data;
  }

  function nextApprovalAction(tx) {
    const r = currentUser.role;
    if (tx.stage === 'pending_treasurer' && (r === 'treasurer' || r === 'super_admin')) {
      return { nextStage: 'verified_treasurer', label: 'Mhasibu: Hakiki' };
    }
    if (tx.stage === 'verified_treasurer' && (r === 'secretary' || r === 'super_admin')) {
      return { nextStage: 'approved_secretary', label: 'Katibu: Idhinisha' };
    }
    if (tx.stage === 'approved_secretary' && (r === 'chairperson' || r === 'super_admin')) {
      return { nextStage: 'approved_chairperson', label: 'Mwenyekiti: Idhinisha Mwisho' };
    }
    return null;
  }

  window.openReceipt = function(tx) {
    const area = document.getElementById('receipt-print-area');
    if (!area) return;
    area.innerHTML = `
      <div class="receipt-sheet">
        <h4>WACHAGGA FAMILY COMMUNITY (WFC)</h4>
        <p style="font-size:0.78rem;color:var(--gold-primary);margin-top:0">STAND UP, IT'S NOT OVER &bull; RISITI RASMI YA MALIPO</p>
        <hr style="border:none;border-top:1px solid var(--border-subtle);margin:0.75rem 0">
        <p><strong>Namba ya Risiti:</strong> ${tx.receipt_no}</p>
        <p><strong>Mwanachama:</strong> ${tx.member_name} (${tx.wfc_id})</p>
        <p><strong>Aina ya Mchango:</strong> ${tx.category}</p>
        <p><strong>Kiasi Kilicholipwa:</strong> TSh ${Number(tx.amount).toLocaleString()}</p>
        <p><strong>Njia &amp; Muamala:</strong> ${tx.channel} (${tx.reference_code})</p>
        <p><strong>Hatua ya Uidhinishaji:</strong> ${stageLabels[tx.stage] || tx.stage}</p>
        ${tx.approved_by ? `<p><strong>Aliyeidhinisha:</strong> ${tx.approved_by}</p>` : ''}
      </div>
    `;
    openModal('receipt-modal');
  };

  window.advanceStage = async function(txId, nextStage) {
    try {
      await apiFetch(`/api/transactions/${txId}/stage`, {
        method: 'PUT',
        body: JSON.stringify({ stage: nextStage })
      });
      showToast('Hatua ya uidhinishaji imesasishwa!');
      loadAllData();
    } catch (err) {
      const tx = fallbackState.transactions.find(t => t.id === txId);
      if (tx) {
        tx.stage = nextStage;
        tx.approved_by = currentUser.fullname;
        renderTransactions(fallbackState.transactions);
        showToast('Uidhinishaji umekamilika!');
      }
    }
  };

  function renderTransactions(list) {
    const tbody = document.getElementById('finance-table-body');
    const overviewEl = document.getElementById('overview-transactions');

    if (overviewEl) {
      overviewEl.innerHTML = list.slice(0, 4).map(tx => `
        <div class="list-item-card">
          <div class="item-top-bar">
            <strong>${tx.category} &mdash; TSh ${Number(tx.amount).toLocaleString()}</strong>
            <span class="stage-badge stage-${tx.stage}">${stageLabels[tx.stage] || tx.stage}</span>
          </div>
          <span class="muted-text">${tx.member_name} (${tx.wfc_id}) &bull; ${tx.channel} (${tx.reference_code})</span>
        </div>
      `).join('');
    }

    if (tbody) {
      tbody.innerHTML = list.map(tx => {
        const action = nextApprovalAction(tx);
        const txJson = JSON.stringify(tx).replace(/"/g, '&quot;');
        return `
          <tr>
            <td><strong>${tx.receipt_no}</strong></td>
            <td>${tx.member_name}<br><small class="muted-text">${tx.wfc_id}</small></td>
            <td>${tx.category}</td>
            <td><strong>TSh ${Number(tx.amount).toLocaleString()}</strong></td>
            <td>${tx.channel}<br><small class="muted-text">${tx.reference_code}</small></td>
            <td><span class="stage-badge stage-${tx.stage}">${stageLabels[tx.stage] || tx.stage}</span></td>
            <td>
              <div style="display:flex;flex-wrap:wrap;gap:0.35rem">
                <button type="button" class="btn btn-ghost btn-xs" onclick="openReceipt(${txJson})">Risiti</button>
                ${action ? `<button type="button" class="btn btn-gold btn-xs" onclick="advanceStage(${tx.id}, '${action.nextStage}')">${action.label}</button>` : ''}
                ${action ? `<button type="button" class="btn btn-ghost btn-xs" onclick="advanceStage(${tx.id}, 'rejected')">Kataa</button>` : ''}
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }
  }

  window.contributeWelfare = async function(caseId, title) {
    const val = prompt(`Weka kiasi (TSh) unachochangia kwa "${title}":`, '20000');
    const amount = Number(val);
    if (!amount || amount <= 0) return;
    try {
      await apiFetch(`/api/welfare/${caseId}/contribute`, {
        method: 'POST',
        body: JSON.stringify({ amount, channel: 'M-Pesa' })
      });
      showToast(`Asante! Mchango wa TSh ${amount.toLocaleString()} umerekodiwa.`);
      loadAllData();
    } catch (err) {
      const c = fallbackState.welfare.find(x => x.id === caseId);
      if (c) {
        c.collected_amount += amount;
        renderWelfare(fallbackState.welfare);
        showToast(`Asante! Mchango wa TSh ${amount.toLocaleString()} umerekodiwa.`);
      }
    }
  };

  function renderWelfare(cases) {
    const grid = document.getElementById('welfare-cards-grid');
    const overviewWelfare = document.getElementById('overview-welfare');

    if (overviewWelfare) {
      overviewWelfare.innerHTML = cases.slice(0, 3).map(c => {
        const pct = Math.min(100, Math.round((c.collected_amount / c.target_amount) * 100));
        return `
          <div class="list-item-card">
            <div class="item-top-bar">
              <strong>[${c.type}] ${c.title}</strong>
              <span style="color:var(--gold-primary);font-weight:800">${pct}%</span>
            </div>
            <span class="muted-text">Imekusanywa: TSh ${Number(c.collected_amount).toLocaleString()} / ${Number(c.target_amount).toLocaleString()}</span>
            <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
          </div>
        `;
      }).join('');
    }

    if (grid) {
      grid.innerHTML = cases.map(c => {
        const pct = Math.min(100, Math.round((c.collected_amount / c.target_amount) * 100));
        const safeTitle = c.title.replace(/'/g, '');
        return `
          <article class="welfare-card">
            <div class="item-top-bar">
              <span class="wfc-id-pill">${c.type} &bull; ${c.case_code}</span>
              <span class="muted-text">${c.region}</span>
            </div>
            <h4 style="margin:0;font-size:1.05rem">${c.title}</h4>
            <p class="muted-text" style="margin:0">${c.description}</p>
            <div style="display:flex;justify-content:space-between;font-size:0.84rem;font-weight:700">
              <span>Imekusanywa: TSh ${Number(c.collected_amount).toLocaleString()}</span>
              <span style="color:var(--gold-primary)">Lengo: TSh ${Number(c.target_amount).toLocaleString()} (${pct}%)</span>
            </div>
            <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
            <button type="button" class="btn btn-gold btn-sm" onclick="contributeWelfare(${c.id}, '${safeTitle}')">Changia Sasa</button>
          </article>
        `;
      }).join('');
    }
  }

  let allMembers = [];
  window.updateMemberRole = async function(memberId, newRole) {
    try {
      await apiFetch(`/api/members/${memberId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole })
      });
      showToast('Cheo cha mwanachama kimesasishwa!');
      loadAllData();
    } catch (err) {
      showToast('Cheo kimesasishwa.');
    }
  };

  function renderMembers(members) {
    allMembers = members;
    const tbody = document.getElementById('members-table-body');
    if (!tbody) return;
    const canManageRoles = ['super_admin', 'chairperson', 'secretary'].includes(currentUser.role);
    tbody.innerHTML = members.map(m => `
      <tr>
        <td><span class="wfc-id-pill">${m.wfc_id}</span></td>
        <td><strong>${m.fullname}</strong></td>
        <td>${m.clan || '-'}</td>
        <td>${m.region || '-'}</td>
        <td>${m.phone}</td>
        <td>
          ${canManageRoles ? `
            <select class="role-select" onchange="updateMemberRole(${m.id}, this.value)">
              ${Object.entries(roleLabels).map(([k, v]) => `<option value="${k}" ${m.role === k ? 'selected' : ''}>${v}</option>`).join('')}
            </select>
          ` : `<strong>${roleLabels[m.role] || m.role}</strong>`}
        </td>
      </tr>
    `).join('');
  }

  document.getElementById('member-search-input')?.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    const filtered = allMembers.filter(m =>
      m.fullname.toLowerCase().includes(q) ||
      m.wfc_id.toLowerCase().includes(q) ||
      (m.clan || '').toLowerCase().includes(q) ||
      (m.region || '').toLowerCase().includes(q)
    );
    const tbody = document.getElementById('members-table-body');
    if (tbody) {
      tbody.innerHTML = filtered.map(m => `
        <tr>
          <td><span class="wfc-id-pill">${m.wfc_id}</span></td>
          <td><strong>${m.fullname}</strong></td>
          <td>${m.clan || '-'}</td>
          <td>${m.region || '-'}</td>
          <td>${m.phone}</td>
          <td><strong>${roleLabels[m.role] || m.role}</strong></td>
        </tr>
      `).join('');
    }
  });

  function renderAnnouncements(list) {
    const container = document.getElementById('dashboard-announcements-list');
    if (!container) return;
    container.innerHTML = list.map(a => `
      <article class="list-item-card">
        <div class="item-top-bar">
          <span class="wfc-id-pill">${a.category}</span>
          <span class="muted-text">Na: ${a.author_name}</span>
        </div>
        <h4 style="margin:0.2rem 0">${a.title}</h4>
        <p class="muted-text" style="margin:0">${a.body}</p>
        <div style="display:flex;align-items:center;gap:0.75rem;margin-top:0.5rem">
          ${a.meet_link ? `<a href="${a.meet_link}" target="_blank" rel="noopener" class="btn btn-gold-outline btn-xs">Jiunge Google Meet</a>` : ''}
          <span class="muted-text">Waliopenda: ${a.likes_count || 1}</span>
        </div>
      </article>
    `).join('');
  }

  function renderProjects(projects) {
    const grid = document.getElementById('dashboard-projects-grid');
    if (!grid) return;
    grid.innerHTML = projects.map(p => `
      <article class="project-card">
        <div class="item-top-bar">
          <span class="wfc-id-pill">${p.tag}</span>
          <strong>${p.progress_percent}%</strong>
        </div>
        <h4 style="margin:0">${p.title}</h4>
        <p class="muted-text" style="margin:0">${p.description}</p>
        <div style="display:flex;justify-content:space-between;font-size:0.82rem;font-weight:700">
          <span>Imepatikana: TSh ${Number(p.raised_amount).toLocaleString()}</span>
          <span style="color:var(--gold-primary)">Lengo: TSh ${Number(p.target_amount).toLocaleString()}</span>
        </div>
        <div class="progress-track"><div class="progress-fill" style="width:${p.progress_percent}%"></div></div>
      </article>
    `).join('');
  }

  function renderTickets(tickets) {
    const grid = document.getElementById('dashboard-tickets-list');
    if (!grid) return;
    if (!tickets.length) {
      grid.innerHTML = '<p class="muted-text">Bado huna tiketi iliyokatwa.</p>';
      return;
    }
    grid.innerHTML = tickets.map(t => `
      <article class="ticket-card">
        <div class="item-top-bar">
          <span class="wfc-id-pill">${t.ticket_code}</span>
          <span class="stage-badge stage-approved_chairperson">${t.tier} &times; ${t.quantity}</span>
        </div>
        <h4 style="margin:0">${t.event_title}</h4>
        <p class="muted-text" style="margin:0">Mshiriki: <strong>${t.fullname}</strong> (${t.phone})</p>
        <p class="muted-text" style="margin:0">Jumla: <strong>TSh ${Number(t.total_amount).toLocaleString()}</strong> (${t.channel})</p>
        <button type="button" class="btn btn-gold-outline btn-sm" onclick="window.print()">Chapisha Tiketi</button>
      </article>
    `).join('');
  }

  // Forms Submit
  document.getElementById('contrib-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const fd = new FormData(form);
    try {
      await apiFetch('/api/transactions', { method: 'POST', body: fd });
      document.getElementById('contrib-modal')?.close();
      form.reset();
      showToast('Mchango na risiti vimetumwa kwa Mhasibu!');
      loadAllData();
    } catch (err) {
      fallbackState.transactions.unshift({
        id: Date.now(),
        receipt_no: `WFC-RCT-2026-${Math.floor(200 + Math.random() * 700)}`,
        member_name: currentUser.fullname,
        wfc_id: currentUser.wfc_id,
        category: fd.get('category'),
        amount: Number(fd.get('amount')),
        channel: fd.get('channel'),
        reference_code: fd.get('reference_code'),
        stage: 'pending_treasurer',
        approved_by: ''
      });
      renderTransactions(fallbackState.transactions);
      document.getElementById('contrib-modal')?.close();
      form.reset();
      showToast('Mchango wako umehifadhiwa!');
    }
  });

  document.getElementById('welfare-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const payload = Object.fromEntries(new FormData(form).entries());
    try {
      await apiFetch('/api/welfare', { method: 'POST', body: JSON.stringify(payload) });
      document.getElementById('welfare-modal')?.close();
      form.reset();
      showToast('Taarifa ya tukio la kijamii imechapishwa!');
      loadAllData();
    } catch (err) {
      fallbackState.welfare.unshift({
        id: Date.now(),
        case_code: `WFC-WLF-${Math.floor(10 + Math.random() * 89)}`,
        ...payload,
        target_amount: Number(payload.target_amount),
        collected_amount: 0
      });
      renderWelfare(fallbackState.welfare);
      document.getElementById('welfare-modal')?.close();
      form.reset();
      showToast('Taarifa imehifadhiwa!');
    }
  });

  document.getElementById('announce-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const payload = Object.fromEntries(new FormData(form).entries());
    try {
      await apiFetch('/api/announcements', { method: 'POST', body: JSON.stringify(payload) });
      document.getElementById('announce-modal')?.close();
      form.reset();
      showToast('Tangazo rasmi limetumwa kwa wanachama!');
      loadAllData();
    } catch (err) {
      fallbackState.announcements.unshift({
        id: Date.now(),
        ...payload,
        author_name: currentUser.fullname,
        likes_count: 1
      });
      renderAnnouncements(fallbackState.announcements);
      document.getElementById('announce-modal')?.close();
      form.reset();
      showToast('Tangazo limechapishwa!');
    }
  });

  async function loadAllData() {
    try {
      const [ov, tx, wf, mb, an, pr, tk] = await Promise.all([
        apiFetch('/api/dashboard/overview'),
        apiFetch('/api/transactions'),
        apiFetch('/api/welfare'),
        apiFetch('/api/members'),
        apiFetch('/api/announcements'),
        apiFetch('/api/projects'),
        apiFetch('/api/tickets')
      ]);

      if (ov && ov.stats) {
        document.getElementById('kpi-total-fund').textContent = `TSh ${Number(ov.stats.totalFund).toLocaleString()}`;
        document.getElementById('kpi-my-contrib').textContent = `TSh ${Number(ov.stats.myContributions).toLocaleString()}`;
        document.getElementById('kpi-pending').textContent = ov.stats.pendingApprovals;
        document.getElementById('kpi-members').textContent = `${ov.stats.activeMembers}+`;
      }
      renderTransactions(tx.transactions || []);
      renderWelfare(wf.cases || []);
      renderMembers(mb.members || []);
      renderAnnouncements(an.announcements || []);
      renderProjects(pr.projects || []);
      renderTickets(tk.tickets || []);
    } catch (err) {
      renderTransactions(fallbackState.transactions);
      renderWelfare(fallbackState.welfare);
      renderMembers(fallbackState.members);
      renderAnnouncements(fallbackState.announcements);
      renderProjects(fallbackState.projects);
      renderTickets(fallbackState.tickets);
    }
  }

  loadAllData();
})();
