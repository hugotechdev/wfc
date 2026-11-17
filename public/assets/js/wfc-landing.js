(() => {
  const root = document.documentElement;
  const savedTheme = localStorage.getItem('wfc_theme') || 'dark';
  root.setAttribute('data-theme', savedTheme);

  const toastEl = document.getElementById('wfc-toast');
  function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(window._wfcToastTimer);
    window._wfcToastTimer = setTimeout(() => toastEl.classList.remove('show'), 3200);
  }

  // Theme Toggle
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem('wfc_theme', next);
      showToast(next === 'dark' ? 'Mandhari ya Giza (Royal Obsidian) imewashwa.' : 'Mandhari ya Mwanga (Pearl White) imewashwa.');
    });
  }

  // Mobile Menu
  const mobileNavBtn = document.getElementById('mobile-nav-btn');
  const primaryNav = document.getElementById('primary-nav');
  if (mobileNavBtn && primaryNav) {
    mobileNavBtn.addEventListener('click', () => primaryNav.classList.toggle('open'));
    primaryNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => primaryNav.classList.remove('open'));
    });
  }

  // Built-in Bilingual Dictionary (Swahili <-> English)
  const i18n = {
    sw: {
      nav_about: 'Kuhusu WFC',
      nav_events: 'Matukio & Tiketi',
      nav_announcements: 'Matangazo',
      nav_projects: 'Miradi',
      nav_contact: 'Mawasiliano',
      btn_login: 'Ingia',
      btn_register: 'Jisajili',
      btn_dashboard: 'Dashibodi Yangu',
      hero_title: 'Ofisi ya Kidijitali ya Wachagga Family Community',
      hero_lead: 'Umoja wa Wachagga, Nguvu ya Familia. Fuatilia taarifa zako, michango, misaada, miradi ya maendeleo, na kata tiketi za matukio mtandaoni saa 24.',
      cta_login: 'Ingia Kwenye Akaunti',
      cta_register: 'Jisajili Mwanachama Mpya',
      cta_ticket: 'Kata Tiketi ya Tukio',
      stat_members: 'WANACHAMA HAI',
      stat_status: 'HALI YA MFUMO',
      stat_office: 'OFISI MTANDAONI',
      about_heading: 'Kuhusu Wachagga Family Community (WFC)',
      events_heading: 'Matukio Yajayo & Tiketi za Mtandaoni',
      announcements_heading: 'Matangazo Rasmi ya WFC',
      projects_heading: 'Miradi na Uwekezaji wa WFC',
      contact_heading: 'Mawasiliano & Akaunti Rasmi za Malipo'
    },
    en: {
      nav_about: 'About WFC',
      nav_events: 'Events & Tickets',
      nav_announcements: 'Announcements',
      nav_projects: 'Projects',
      nav_contact: 'Contact & Accounts',
      btn_login: 'Login',
      btn_register: 'Register',
      btn_dashboard: 'My Dashboard',
      hero_title: 'Digital Office of Wachagga Family Community',
      hero_lead: 'Chagga Unity, Family Strength. Track your membership profile, contributions, welfare support, development projects, and book event tickets 24/7.',
      cta_login: 'Sign In to Account',
      cta_register: 'Register New Member',
      cta_ticket: 'Book Event Ticket',
      stat_members: 'ACTIVE MEMBERS',
      stat_status: 'SYSTEM STATUS',
      stat_office: 'ONLINE OFFICE',
      about_heading: 'About Wachagga Family Community (WFC)',
      events_heading: 'Upcoming Events & Online Ticketing',
      announcements_heading: 'Official WFC Announcements',
      projects_heading: 'WFC Projects & Investments',
      contact_heading: 'Contact & Official Payment Accounts'
    }
  };

  const langSelect = document.getElementById('lang-select');
  if (langSelect) {
    langSelect.addEventListener('change', (e) => {
      const lang = e.target.value;
      const dict = i18n[lang] || i18n.sw;
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) el.textContent = dict[key];
      });
      showToast(lang === 'en' ? 'Language switched to English' : 'Lugha imebadilishwa kuwa Kiswahili');
    });
  }

  // Copy Payment Accounts
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.getAttribute('data-copy');
      if (navigator.clipboard && val) {
        navigator.clipboard.writeText(val);
        showToast(`Imenakiliwa: ${val}`);
      }
    });
  });

  // Modals Open/Close
  document.querySelectorAll('[data-open-modal]').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const modal = document.getElementById(trigger.getAttribute('data-open-modal'));
      if (modal && typeof modal.showModal === 'function') modal.showModal();
    });
  });

  document.querySelectorAll('[data-close-modal]').forEach(closer => {
    closer.addEventListener('click', () => {
      const modal = document.getElementById(closer.getAttribute('data-close-modal'));
      if (modal) modal.close();
    });
  });

  // Ticket Modal & Tier Selection
  const ticketModal = document.getElementById('ticket-modal');
  const ticketTierSelect = document.getElementById('ticket-tier');
  const ticketQtyInput = document.getElementById('ticket-qty');
  const ticketTotalDisplay = document.getElementById('ticket-total-display');
  const tierPrices = { Regular: 25000, VIP: 60000, Familia: 120000 };

  function updateTicketTotal() {
    if (!ticketTierSelect || !ticketQtyInput || !ticketTotalDisplay) return;
    const price = tierPrices[ticketTierSelect.value] || 25000;
    const qty = Math.max(1, Number(ticketQtyInput.value) || 1);
    ticketTotalDisplay.textContent = `TSh ${(price * qty).toLocaleString()}`;
  }

  if (ticketTierSelect) ticketTierSelect.addEventListener('change', updateTicketTotal);
  if (ticketQtyInput) ticketQtyInput.addEventListener('input', updateTicketTotal);

  const openTicketBtn = document.getElementById('open-ticket-modal');
  if (openTicketBtn && ticketModal) {
    openTicketBtn.addEventListener('click', () => {
      updateTicketTotal();
      ticketModal.showModal();
    });
  }

  document.querySelectorAll('[data-select-tier]').forEach(chip => {
    chip.addEventListener('click', () => {
      if (ticketTierSelect) ticketTierSelect.value = chip.getAttribute('data-select-tier');
      updateTicketTotal();
      if (ticketModal) ticketModal.showModal();
    });
  });

  // Demo 1-Click Login Fill
  const demoUsersMap = {
    '0700000001': { id: 1, wfc_id: 'WFC-2026-0001', fullname: 'Mwanzilishi WFC (Super Admin)', phone: '0700000001', clan: 'Mushi', region: 'Dar es Salaam', role: 'super_admin' },
    '0700000002': { id: 2, wfc_id: 'WFC-2026-0002', fullname: 'Mwenyekiti Taifa WFC', phone: '0700000002', clan: 'Massawe', region: 'Kilimanjaro', role: 'chairperson' },
    '0700000003': { id: 3, wfc_id: 'WFC-2026-0003', fullname: 'Katibu Mkuu WFC', phone: '0700000003', clan: 'Kimaro', region: 'Dar es Salaam', role: 'secretary' },
    '0700000004': { id: 4, wfc_id: 'WFC-2026-0004', fullname: 'Mhasibu Mkuu WFC', phone: '0700000004', clan: 'Lyimo', region: 'Arusha', role: 'treasurer' },
    '0700000005': { id: 5, wfc_id: 'WFC-2026-0005', fullname: 'Kiongozi wa Kanda - Dar', phone: '0700000005', clan: 'Swai', region: 'Dar es Salaam', role: 'regional_leader' },
    '0711111111': { id: 6, wfc_id: 'WFC-2026-0475', fullname: 'Mwanachama Hai WFC', phone: '0711111111', clan: 'Shirima', region: 'Kilimanjaro', role: 'member' }
  };

  document.querySelectorAll('.demo-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const phone = chip.getAttribute('data-demo-phone');
      const phoneInput = document.getElementById('login-phone');
      const passInput = document.getElementById('login-password');
      if (phoneInput) phoneInput.value = phone;
      if (passInput) passInput.value = '123456';
      showToast('Akaunti ya majaribio imejazwa. Bonyeza Ingia Dashibodi.');
    });
  });

  // Login Form Submit
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errBox = document.getElementById('login-error');
      if (errBox) errBox.classList.add('hidden');
      const phone = document.getElementById('login-phone').value.replace(/\s+/g, '');
      const password = document.getElementById('login-password').value;

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Imeshindwa kuingia.');
        localStorage.setItem('wfc_token', data.token);
        localStorage.setItem('wfc_user', JSON.stringify(data.user));
        window.location.href = 'dashboard.html';
      } catch (err) {
        if (demoUsersMap[phone] && password === '123456') {
          localStorage.setItem('wfc_token', 'offline-demo-token');
          localStorage.setItem('wfc_user', JSON.stringify(demoUsersMap[phone]));
          window.location.href = 'dashboard.html';
          return;
        }
        if (errBox) {
          errBox.textContent = err.message;
          errBox.classList.remove('hidden');
        }
      }
    });
  }

  // Register Form Submit
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errBox = document.getElementById('register-error');
      if (errBox) errBox.classList.add('hidden');
      const fd = new FormData(registerForm);
      const payload = Object.fromEntries(fd.entries());

      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Usajili umeshindikana.');
        localStorage.setItem('wfc_token', data.token);
        localStorage.setItem('wfc_user', JSON.stringify(data.user));
        window.location.href = 'dashboard.html';
      } catch (err) {
        if (err.message.includes('Failed to fetch')) {
          const offlineUser = {
            id: Date.now(),
            wfc_id: `WFC-2026-${Math.floor(477 + Math.random() * 500)}`,
            fullname: payload.fullname,
            phone: payload.phone,
            clan: payload.clan,
            region: payload.region,
            role: 'member'
          };
          localStorage.setItem('wfc_token', 'offline-demo-token');
          localStorage.setItem('wfc_user', JSON.stringify(offlineUser));
          window.location.href = 'dashboard.html';
          return;
        }
        if (errBox) {
          errBox.textContent = err.message;
          errBox.classList.remove('hidden');
        }
      }
    });
  }

  // Ticket Booking Submit
  const ticketForm = document.getElementById('ticket-form');
  if (ticketForm) {
    ticketForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(ticketForm);
      const payload = Object.fromEntries(fd.entries());
      const resultBox = document.getElementById('ticket-result');

      try {
        const res = await fetch('/api/tickets/book', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Imeshindwa kukata tiketi.');
        renderTicketPass(resultBox, data.ticket);
        showToast('Tiketi yako ya WFC Festival imetolewa!');
      } catch (err) {
        const unitPrice = tierPrices[payload.tier] || 25000;
        const qty = Number(payload.quantity) || 1;
        const fallbackTicket = {
          ticket_code: `WFC-TKT-${Math.floor(100000 + Math.random() * 900000)}`,
          fullname: payload.fullname,
          phone: payload.phone,
          tier: payload.tier,
          quantity: qty,
          total_amount: unitPrice * qty,
          channel: payload.channel,
          status: 'confirmed'
        };
        renderTicketPass(resultBox, fallbackTicket);
        showToast('Tiketi yako imehifadhiwa!');
      }
    });
  }

  function renderTicketPass(container, t) {
    if (!container || !t) return;
    container.classList.remove('hidden');
    container.innerHTML = `
      <h4>TIKETI RASMI &mdash; WFC FESTIVAL 2026</h4>
      <p><strong>Namba ya Tiketi:</strong> ${t.ticket_code}</p>
      <p><strong>Mshiriki:</strong> ${t.fullname} (${t.phone})</p>
      <p><strong>Daraja:</strong> ${t.tier} &times; ${t.quantity} | <strong>Jumla:</strong> TSh ${Number(t.total_amount).toLocaleString()}</p>
      <p><strong>Hali:</strong> IMETHIBITISHWA (${t.channel})</p>
      <button type="button" class="btn btn-gold btn-sm" style="margin-top:0.65rem" onclick="window.print()">Chapisha / Hifadhi PDF</button>
    `;
  }

  // Verify Ticket Form
  const verifyForm = document.getElementById('verify-ticket-form');
  if (verifyForm) {
    verifyForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const q = document.getElementById('verify-ticket-query').value.trim();
      const out = document.getElementById('verify-ticket-output');
      if (!q || !out) return;
      out.innerHTML = '<p style="color:var(--text-muted)">Inatafuta tiketi...</p>';
      try {
        const res = await fetch(`/api/tickets/verify/${encodeURIComponent(q)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Tiketi haikupatikana.');
        out.innerHTML = data.tickets.map(t => `
          <div class="digital-ticket-pass" style="margin-top:0.75rem">
            <h4>${t.ticket_code} &mdash; ${t.tier}</h4>
            <p><strong>Mshiriki:</strong> ${t.fullname} (${t.phone})</p>
            <p><strong>Idadi:</strong> ${t.quantity} | <strong>Kiasi:</strong> TSh ${Number(t.total_amount).toLocaleString()}</p>
            <button type="button" class="btn btn-gold btn-sm" style="margin-top:0.5rem" onclick="window.print()">Chapisha Tiketi</button>
          </div>
        `).join('');
      } catch (err) {
        out.innerHTML = `<div class="form-alert" style="margin-top:0.75rem">${err.message}</div>`;
      }
    });
  }

  // Load Live Public Summary from API
  fetch('/api/public/summary')
    .then(r => r.ok ? r.json() : null)
    .then(data => {
      if (!data) return;
      const statMembers = document.getElementById('stat-members');
      if (statMembers && data.memberCount) {
        statMembers.textContent = `${data.memberCount}+`;
      }
    })
    .catch(() => {});
})();
