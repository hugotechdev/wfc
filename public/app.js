(function () {
  const state = {
    token: localStorage.getItem('wfc_token') || null,
    user: null,
    data: null,
    channels: [],
    resetToken: new URLSearchParams(window.location.search).get('resetToken') || null
  };

  // Register Service Worker for PWA
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }

  // Theme Toggle (Light / Dark)
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('wfc_theme', theme);
  }
  applyTheme(localStorage.getItem('wfc_theme') || 'light');

  ['authThemeToggle', 'dashThemeToggle'].forEach((id) => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener('click', () => {
        const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        applyTheme(next);
      });
    }
  });

  // Eye Toggle Buttons
  document.querySelectorAll('.eye-toggle-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.dataset.toggleTarget);
      if (!target) return;
      target.type = target.type === 'password' ? 'text' : 'password';
    });
  });

  function showAlert(elId, message, type = 'info') {
    const box = document.getElementById(elId);
    if (!box) return;
    box.className = `alert-box alert-${type}`;
    box.textContent = message;
    box.classList.remove('hidden');
  }

  function hideAlert(elId) {
    const box = document.getElementById(elId);
    if (box) box.classList.add('hidden');
  }

  function formatTsh(num) {
    return 'TSh ' + Number(num || 0).toLocaleString('en-US');
  }

  function renderChannelCards(containerId, channels) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = channels
      .map(
        (ch) => `
      <div class="channel-copy-card">
        <div>
          <strong>${ch.provider}</strong>
          <span>${ch.number}</span>
        </div>
        <button type="button" class="copy-btn" data-copy="${ch.copyValue}">Nakili</button>
      </div>
    `
      )
      .join('');

    el.querySelectorAll('.copy-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        navigator.clipboard.writeText(btn.dataset.copy).then(() => {
          const orig = btn.textContent;
          btn.textContent = 'Imenakiliwa!';
          setTimeout(() => (btn.textContent = orig), 1500);
        });
      });
    });
  }

  // Load public payment channels
  fetch('/api/public-config')
    .then((r) => r.json())
    .then((res) => {
      if (res.ok) {
        state.channels = res.paymentChannels || [];
        renderChannelCards('regPaymentChannels', state.channels);
      }
    })
    .catch(() => {});

  // Auth View Switchers
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const forgotForm = document.getElementById('forgotForm');
  const resetPasswordForm = document.getElementById('resetPasswordForm');
  const waitingApprovalView = document.getElementById('waitingApprovalView');
  const authTabsBar = document.getElementById('authTabsBar');

  function switchAuthMode(mode) {
    hideAlert('authAlert');
    [loginForm, registerForm, forgotForm, resetPasswordForm, waitingApprovalView].forEach((el) =>
      el.classList.add('hidden')
    );
    document.getElementById('tabLoginBtn').classList.remove('active');
    document.getElementById('tabRegisterBtn').classList.remove('active');

    if (mode === 'login') {
      authTabsBar.classList.remove('hidden');
      loginForm.classList.remove('hidden');
      document.getElementById('tabLoginBtn').classList.add('active');
    } else if (mode === 'register') {
      authTabsBar.classList.remove('hidden');
      registerForm.classList.remove('hidden');
      document.getElementById('tabRegisterBtn').classList.add('active');
      setRegStep(1);
    } else if (mode === 'forgot') {
      authTabsBar.classList.add('hidden');
      forgotForm.classList.remove('hidden');
    } else if (mode === 'reset') {
      authTabsBar.classList.add('hidden');
      resetPasswordForm.classList.remove('hidden');
    } else if (mode === 'waiting') {
      authTabsBar.classList.add('hidden');
      waitingApprovalView.classList.remove('hidden');
    }
  }

  document.getElementById('tabLoginBtn').addEventListener('click', () => switchAuthMode('login'));
  document.getElementById('tabRegisterBtn').addEventListener('click', () => switchAuthMode('register'));
  document.getElementById('openForgotBtn').addEventListener('click', () => switchAuthMode('forgot'));
  document.getElementById('backToLoginFromForgot').addEventListener('click', () => switchAuthMode('login'));
  document.getElementById('backFromWaitingBtn').addEventListener('click', () => switchAuthMode('login'));
  document.getElementById('backToLoginFromReset').addEventListener('click', () => {
    window.history.replaceState({}, '', '/app');
    state.resetToken = null;
    switchAuthMode('login');
  });

  // Check if URL has ?resetToken=...
  if (state.resetToken) {
    switchAuthMode('reset');
    fetch(`/api/reset-password/${encodeURIComponent(state.resetToken)}`)
      .then((r) => r.json())
      .then((res) => {
        if (!res.ok) {
          showAlert('authAlert', res.message, 'error');
          document.getElementById('resetAccountMeta').textContent = 'Kiungo kimekwisha muda wake.';
        } else {
          document.getElementById('resetAccountMeta').textContent = `Akaunti: ${res.fullName} (${res.wfcId} • ${res.email})`;
        }
      });
  }

  // 3-Step Registration Wizard Navigation
  function setRegStep(step) {
    hideAlert('authAlert');
    [1, 2, 3].forEach((n) => {
      document.getElementById(`regStep${n}`).classList.toggle('hidden', n !== step);
      const badge = document.getElementById(`stepBadge${n}`);
      badge.classList.remove('active', 'done');
      if (n < step) badge.classList.add('done');
      if (n === step) badge.classList.add('active');
    });
  }

  document.getElementById('toStep2Btn').addEventListener('click', () => {
    const name = document.getElementById('regFullName').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const kanda = document.getElementById('regKanda').value;
    if (!name || !phone || !email || !kanda) {
      return showAlert('authAlert', 'Jaza Jina Kamili, Simu, Barua Pepe, na Kanda kabla ya kuendelea.', 'error');
    }
    setRegStep(2);
  });

  document.getElementById('backToStep1Btn').addEventListener('click', () => setRegStep(1));

  document.getElementById('toStep3Btn').addEventListener('click', () => {
    const pass = document.getElementById('regPassword').value;
    const conf = document.getElementById('regConfirmPassword').value;
    if (!pass || pass.length < 6) {
      return showAlert('authAlert', 'Nenosiri lazima liwe na herufi au tarakimu zisizopungua 6.', 'error');
    }
    if (pass !== conf) {
      return showAlert('authAlert', 'Nenosiri na Thibitisha Nenosiri havilingani.', 'error');
    }
    setRegStep(3);
  });

  document.getElementById('backToStep2Btn').addEventListener('click', () => setRegStep(2));

  // Submit Registration
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert('authAlert');
    const payload = {
      fullName: document.getElementById('regFullName').value.trim(),
      phone: document.getElementById('regPhone').value.trim(),
      email: document.getElementById('regEmail').value.trim(),
      kanda: document.getElementById('regKanda').value,
      password: document.getElementById('regPassword').value,
      confirmPassword: document.getElementById('regConfirmPassword').value,
      paymentChannel: document.getElementById('regPaymentChannel').value,
      transactionRef: document.getElementById('regTxRef').value.trim()
    };

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!data.ok) {
      return showAlert('authAlert', data.message, 'error');
    }

    document.getElementById('waitingName').textContent = data.user.fullName;
    document.getElementById('waitingWfcId').textContent = data.user.wfcId;
    document.getElementById('waitingChannel').textContent = data.user.registrationChannel;
    document.getElementById('waitingTxRef').textContent = data.user.registrationTxRef;
    switchAuthMode('waiting');
  });

  // Submit Login
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert('authAlert');
    const identifier = document.getElementById('loginIdentifier').value.trim();
    const password = document.getElementById('loginPassword').value;

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password })
    });
    const data = await res.json();

    if (data.code === 'WAITING_APPROVAL' && data.user) {
      document.getElementById('waitingName').textContent = data.user.fullName;
      document.getElementById('waitingWfcId').textContent = data.user.wfcId;
      document.getElementById('waitingChannel').textContent = data.user.registrationChannel || 'Mobile / Bank';
      document.getElementById('waitingTxRef').textContent = data.user.registrationTxRef || '-';
      return switchAuthMode('waiting');
    }

    if (!data.ok) {
      return showAlert('authAlert', data.message, 'error');
    }

    state.token = data.token;
    localStorage.setItem('wfc_token', data.token);
    await loadDashboard();
  });

  // Submit Forgot Password
  forgotForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert('authAlert');
    const previewBox = document.getElementById('previewResetBox');
    previewBox.classList.add('hidden');

    const email = document.getElementById('forgotEmail').value.trim();
    const res = await fetch('/api/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (!data.ok) {
      showAlert('authAlert', data.message, 'error');
    } else {
      showAlert('authAlert', data.message, 'success');
    }

    if (data.previewResetLink) {
      previewBox.innerHTML = `<strong>Kiungo cha Majaribio (Dakika 30):</strong><br/><a href="${data.previewResetLink}" style="color:var(--gold-dark); font-weight:700;">Bofya hapa kuweka nenosiri jipya →</a>`;
      previewBox.classList.remove('hidden');
    }
  });

  // Submit Reset Password
  resetPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert('authAlert');
    const newPassword = document.getElementById('resetNewPassword').value;
    const confirmPassword = document.getElementById('resetConfirmPassword').value;

    const res = await fetch('/api/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: state.resetToken,
        newPassword,
        confirmPassword
      })
    });
    const data = await res.json();
    if (!data.ok) {
      return showAlert('authAlert', data.message, 'error');
    }

    window.history.replaceState({}, '', '/app');
    state.resetToken = null;
    switchAuthMode('login');
    showAlert('authAlert', data.message, 'success');
  });

  // ==========================================
  // AUTHENTICATED DASHBOARD LOGIC
  // ==========================================
  async function apiFetch(url, options = {}) {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${state.token}`,
        ...(options.headers || {})
      }
    });
    return res.json();
  }

  async function loadDashboard() {
    if (!state.token) return;
    const res = await apiFetch('/api/bootstrap');
    if (!res.ok) {
      localStorage.removeItem('wfc_token');
      state.token = null;
      return;
    }

    state.user = res.user;
    state.data = res;

    document.getElementById('authView').classList.add('hidden');
    document.getElementById('dashboardView').classList.remove('hidden');

    document.getElementById('topUserWfcId').textContent = `${res.user.fullName} (${res.user.wfcId})`;
    document.getElementById('topUserRole').textContent = res.user.role;

    const isLeader = ['SUPER_ADMIN', 'ACCOUNTANT', 'CHAIRPERSON', 'SECRETARY'].includes(res.user.role);
    const isAdmin = res.user.role === 'SUPER_ADMIN';

    document.getElementById('navMembersBtn').classList.toggle('hidden', !isLeader);
    document.getElementById('navSettingsBtn').classList.toggle('hidden', !isAdmin);
    document.getElementById('makerCreateCard').classList.toggle('hidden', !isLeader);
    document.getElementById('welfareCreateCard').classList.toggle('hidden', !isLeader);
    document.getElementById('annCreateCard').classList.toggle('hidden', !isLeader);

    renderAllSections();
    if (isAdmin) loadAdminSettings();
  }

  function renderAllSections() {
    const d = state.data;
    const totalBalance = d.funds.reduce((sum, f) => sum + Number(f.balance || 0), 0);
    const pendingPayments = d.payments.filter((p) => p.status === 'PENDING').length;
    const pendingDisbursements = d.disbursements.filter((x) => x.status === 'PENDING_CHECKER').length;

    // KPI Cards
    document.getElementById('kpiGrid').innerHTML = `
      <div class="kpi-card">
        <span>Jumla ya Mifuko Yote (9)</span>
        <h3>${formatTsh(totalBalance)}</h3>
      </div>
      <div class="kpi-card">
        <span>Malipo Yanayosubiri Uhakiki</span>
        <h3>${pendingPayments}</h3>
      </div>
      <div class="kpi-card">
        <span>Maker-Checker Zinazosubiri</span>
        <h3>${pendingDisbursements}</h3>
      </div>
      <div class="kpi-card">
        <span>Kanda Yako • Hali</span>
        <h3>${d.user.kanda}</h3>
      </div>
    `;

    // Funds cards
    const fundHtml = d.funds
      .map(
        (f) => `
      <div class="fund-card">
        <div class="fund-card-top">
          <span class="fund-code">${f.code}</span>
          <strong style="color:var(--gold-dark); font-size:1.05rem;">${formatTsh(f.balance)}</strong>
        </div>
        <strong style="display:block; margin-bottom:4px;">${f.name}</strong>
        <p style="font-size:0.8rem; color:var(--text-muted);">${f.description}</p>
      </div>
    `
      )
      .join('');
    document.getElementById('dashFundsPreview').innerHTML = fundHtml;
    document.getElementById('allFundsGrid').innerHTML = fundHtml;

    // Populate fund selects
    const fundOptions = d.funds.map((f) => `<option value="${f.id}">${f.code} — ${f.name} (${formatTsh(f.balance)})</option>`).join('');
    document.getElementById('payFundSelect').innerHTML = fundOptions;
    document.getElementById('mcFundSelect').innerHTML = fundOptions;

    renderChannelCards('dashChannelsList', d.paymentChannels || []);

    // Ledger table
    const fundMap = Object.fromEntries(d.funds.map((f) => [f.id, f.name]));
    document.getElementById('dashLedgerBody').innerHTML = d.ledger
      .slice(0, 15)
      .map(
        (l) => `
      <tr>
        <td>${new Date(l.createdAt).toLocaleDateString('sw-TZ')}</td>
        <td><strong>${fundMap[l.fundId] || l.fundId}</strong></td>
        <td><span class="badge ${l.type === 'CREDIT' ? 'badge-verified' : 'badge-rejected'}">${l.type}</span></td>
        <td><strong>${formatTsh(l.amount)}</strong></td>
        <td><code>${l.reference}</code></td>
        <td>${l.note}</td>
      </tr>
    `
      )
      .join('');

    // Payments Verification Table
    const canVerify = ['SUPER_ADMIN', 'ACCOUNTANT'].includes(d.user.role);
    document.getElementById('paymentsTableBody').innerHTML = d.payments
      .map(
        (p) => `
      <tr>
        <td><strong>${p.memberName}</strong><br/><small>${p.wfcId}</small></td>
        <td>${p.category}</td>
        <td>${fundMap[p.fundId] || p.fundId}</td>
        <td><strong>${formatTsh(p.amount)}</strong></td>
        <td>${p.channel}<br/><code>${p.txRef}</code></td>
        <td><span class="badge badge-${p.status.toLowerCase()}">${p.status}</span></td>
        <td>
          ${
            canVerify && p.status === 'PENDING'
              ? `<button class="btn btn-success btn-sm" onclick="verifyPay('${p.id}','VERIFIED')">Kubali</button>
                 <button class="btn btn-danger btn-sm" onclick="verifyPay('${p.id}','REJECTED')">Kataa</button>`
              : `<small>${p.verifiedBy || '-'}</small>`
          }
        </td>
      </tr>
    `
      )
      .join('');

    // Maker-Checker Table
    const canCheck = ['SUPER_ADMIN', 'ACCOUNTANT', 'CHAIRPERSON'].includes(d.user.role);
    document.getElementById('disbursementsTableBody').innerHTML = d.disbursements
      .map((item) => {
        const isSameMaker = item.makerId === d.user.id;
        let actionHtml = `<small>${item.checkerName || '-'}</small>`;
        if (item.status === 'PENDING_CHECKER' && canCheck) {
          if (isSameMaker) {
            actionHtml = `<small style="color:var(--warn);">Wewe ni Maker (Subiri kiongozi mwingine)</small>`;
          } else {
            actionHtml = `
              <button class="btn btn-success btn-sm" onclick="decideDisb('${item.id}','APPROVED')">Idhinisha (Checker)</button>
              <button class="btn btn-danger btn-sm" onclick="decideDisb('${item.id}','REJECTED')">Kataa</button>
            `;
          }
        }
        return `
          <tr>
            <td><strong>${fundMap[item.fundId] || item.fundId}</strong></td>
            <td><strong>${formatTsh(item.amount)}</strong></td>
            <td><strong>${item.beneficiary}</strong><br/><small>${item.purpose}</small></td>
            <td>${item.makerName}</td>
            <td>${item.checkerName || 'Anasubiriwa'}</td>
            <td><span class="badge badge-${item.status === 'APPROVED' ? 'approved' : item.status === 'REJECTED' ? 'rejected' : 'pending'}">${item.status}</span></td>
            <td>${actionHtml}</td>
          </tr>
        `;
      })
      .join('');

    // Welfare Cases
    document.getElementById('welfareGrid').innerHTML = d.welfareCases
      .map(
        (w) => `
      <div class="panel-card">
        <span class="fund-code">${w.type}</span>
        <h4 style="margin:8px 0 6px;">${w.title}</h4>
        <p style="font-size:0.86rem; color:var(--text-muted); margin-bottom:10px;">${w.details}</p>
        <div style="font-size:0.84rem;">
          <strong>Lengo:</strong> ${formatTsh(w.targetAmount)} • <strong>Imekusanywa:</strong> ${formatTsh(w.collectedAmount)}
        </div>
      </div>
    `
      )
      .join('');

    // Events & Tickets
    document.getElementById('eventsGrid').innerHTML = d.events
      .map(
        (ev) => `
      <div class="fund-card">
        <div class="fund-card-top">
          <span class="fund-code">${ev.date}</span>
          <strong>${formatTsh(ev.ticketPrice)} / tiketi</strong>
        </div>
        <h4 style="margin-bottom:4px;">${ev.title}</h4>
        <p style="font-size:0.82rem; color:var(--text-muted); margin-bottom:12px;">${ev.venue} — ${ev.description}</p>
        <button type="button" class="btn btn-primary btn-sm" onclick="buyTicketPrompt('${ev.id}', '${ev.title.replace(/'/g, '')}')">Nunua Tiketi</button>
      </div>
    `
      )
      .join('');

    document.getElementById('ticketsTableBody').innerHTML = d.tickets
      .map(
        (t) => `
      <tr>
        <td><code>${t.ticketCode}</code></td>
        <td><strong>${t.eventTitle}</strong></td>
        <td>${t.memberName} (${t.wfcId})</td>
        <td>${t.quantity}</td>
        <td>${formatTsh(t.totalPaid)}</td>
        <td><code>${t.txRef}</code></td>
      </tr>
    `
      )
      .join('');

    // Projects
    document.getElementById('projectsGrid').innerHTML = d.projects
      .map(
        (pr) => `
      <div class="fund-card">
        <div class="fund-card-top">
          <span class="fund-code">${pr.code}</span>
          <strong>Maendeleo: ${pr.progress}%</strong>
        </div>
        <h4 style="margin-bottom:4px;">${pr.name}</h4>
        <p style="font-size:0.82rem; color:var(--text-muted); margin-bottom:6px;">${pr.summary}</p>
        <small><strong>Msimamizi:</strong> ${pr.lead}</small>
      </div>
    `
      )
      .join('');

    // Announcements
    document.getElementById('announcementsList').innerHTML = d.announcements
      .map(
        (a) => `
      <div class="panel-card">
        <div class="panel-header" style="margin-bottom:8px;">
          <span class="fund-code">${a.category}</span>
          <small style="color:var(--text-muted);">${new Date(a.createdAt).toLocaleDateString('sw-TZ')} • ${a.author}</small>
        </div>
        <h4 style="margin-bottom:6px;">${a.title}</h4>
        <p style="font-size:0.9rem; color:var(--text-muted);">${a.content}</p>
      </div>
    `
      )
      .join('');

    // Members RBAC Table
    if (d.members && d.members.length) {
      document.getElementById('membersTableBody').innerHTML = d.members
        .map(
          (m) => `
        <tr>
          <td><code>${m.wfcId}</code></td>
          <td><strong>${m.fullName}</strong></td>
          <td>${m.phone}<br/><small>${m.email}</small></td>
          <td>${m.kanda}</td>
          <td><span class="badge badge-${m.status === 'ACTIVE' ? 'active' : m.status === 'REJECTED' ? 'rejected' : 'pending'}">${m.status}</span></td>
          <td>
            ${
              d.user.role === 'SUPER_ADMIN'
                ? `<select onchange="changeRole('${m.id}', this.value)" style="padding:6px; font-size:0.8rem;">
                    ${['MEMBER', 'ACCOUNTANT', 'SECRETARY', 'CHAIRPERSON', 'SUPER_ADMIN']
                      .map((r) => `<option value="${r}" ${m.role === r ? 'selected' : ''}>${r}</option>`)
                      .join('')}
                  </select>`
                : m.role
            }
          </td>
        </tr>
      `
        )
        .join('');
    }
  }

  // Global action handlers
  window.verifyPay = async function (id, decision) {
    const res = await apiFetch(`/api/payments/${id}/verify`, {
      method: 'POST',
      body: JSON.stringify({ decision })
    });
    showAlert('dashAlert', res.message, res.ok ? 'success' : 'error');
    if (res.ok) await loadDashboard();
  };

  window.decideDisb = async function (id, decision) {
    const res = await apiFetch(`/api/disbursements/${id}/decide`, {
      method: 'POST',
      body: JSON.stringify({ decision })
    });
    showAlert('dashAlert', res.message, res.ok ? 'success' : 'error');
    if (res.ok) await loadDashboard();
  };

  window.buyTicketPrompt = async function (eventId, title) {
    const qty = prompt(`Idadi ya tiketi kwa "${title}":`, '1');
    if (!qty) return;
    const txRef = prompt('Weka Namba ya Muamala wa malipo ya tiketi:');
    if (!txRef) return;
    const res = await apiFetch('/api/tickets/buy', {
      method: 'POST',
      body: JSON.stringify({ eventId, quantity: Number(qty), txRef })
    });
    showAlert('dashAlert', res.message, res.ok ? 'success' : 'error');
    if (res.ok) await loadDashboard();
  };

  window.changeRole = async function (userId, role) {
    const res = await apiFetch(`/api/members/${userId}/role`, {
      method: 'POST',
      body: JSON.stringify({ role })
    });
    showAlert('dashAlert', res.ok ? 'Cheo kimesasishwa.' : res.message, res.ok ? 'success' : 'error');
    if (res.ok) await loadDashboard();
  };

  // Dashboard Forms
  document.getElementById('submitPaymentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const res = await apiFetch('/api/payments/submit', {
      method: 'POST',
      body: JSON.stringify({
        fundId: document.getElementById('payFundSelect').value,
        amount: document.getElementById('payAmount').value,
        channel: document.getElementById('payChannel').value,
        txRef: document.getElementById('payTxRef').value,
        note: document.getElementById('payNote').value
      })
    });
    showAlert('dashAlert', res.message, res.ok ? 'success' : 'error');
    if (res.ok) {
      e.target.reset();
      await loadDashboard();
    }
  });

  document.getElementById('makerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const res = await apiFetch('/api/disbursements', {
      method: 'POST',
      body: JSON.stringify({
        fundId: document.getElementById('mcFundSelect').value,
        amount: document.getElementById('mcAmount').value,
        beneficiary: document.getElementById('mcBeneficiary').value,
        purpose: document.getElementById('mcPurpose').value
      })
    });
    showAlert('dashAlert', res.message, res.ok ? 'success' : 'error');
    if (res.ok) {
      e.target.reset();
      await loadDashboard();
    }
  });

  document.getElementById('welfareForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const res = await apiFetch('/api/welfare', {
      method: 'POST',
      body: JSON.stringify({
        type: document.getElementById('wlfType').value,
        title: document.getElementById('wlfTitle').value,
        memberName: document.getElementById('wlfMember').value,
        targetAmount: document.getElementById('wlfTarget').value,
        details: document.getElementById('wlfDetails').value
      })
    });
    if (res.ok) {
      e.target.reset();
      await loadDashboard();
    }
  });

  document.getElementById('annForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const res = await apiFetch('/api/announcements', {
      method: 'POST',
      body: JSON.stringify({
        title: document.getElementById('annTitle').value,
        category: document.getElementById('annCategory').value,
        content: document.getElementById('annContent').value
      })
    });
    if (res.ok) {
      e.target.reset();
      await loadDashboard();
    }
  });

  async function loadAdminSettings() {
    const res = await apiFetch('/api/admin/settings');
    if (!res.ok) return;
    document.getElementById('settingEmailFrom').value = res.emailFrom || '';
    const banner = document.getElementById('resendStatusBanner');
    banner.textContent = res.hasResendKey
      ? `Resend API Imewashwa (${res.maskedKey}) — Chanzo: ${res.source}`
      : 'Resend API Key haijawekwa bado. Mfumo unaonyesha kiungo cha majaribio moja kwa moja kwenye skrini.';
  }

  document.getElementById('adminSettingsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const res = await apiFetch('/api/admin/settings', {
      method: 'POST',
      body: JSON.stringify({
        resendApiKey: document.getElementById('settingResendKey').value,
        emailFrom: document.getElementById('settingEmailFrom').value
      })
    });
    showAlert('dashAlert', res.message, res.ok ? 'success' : 'error');
    if (res.ok) {
      document.getElementById('settingResendKey').value = '';
      await loadAdminSettings();
    }
  });

  // Sidebar Navigation
  document.querySelectorAll('.nav-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const targetId = btn.dataset.section;
      document.querySelectorAll('.dash-section').forEach((sec) => {
        sec.classList.toggle('hidden', sec.id !== targetId);
      });
      document.getElementById('pageTitle').textContent = btn.textContent.trim();
      document.getElementById('sidebar').classList.remove('open');
    });
  });

  document.getElementById('mobileMenuBtn').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });

  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('wfc_token');
    state.token = null;
    document.getElementById('dashboardView').classList.add('hidden');
    document.getElementById('authView').classList.remove('hidden');
    switchAuthMode('login');
  });

  // Auto-boot if session token exists
  if (state.token && !state.resetToken) {
    loadDashboard();
  }
})();
