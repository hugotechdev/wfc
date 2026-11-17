document.addEventListener('DOMContentLoaded', () => {
  const root = document.documentElement;
  const toastEl = document.getElementById('toast-banner');
  let toastTimer = null;

  function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove('show');
    }, 3400);
  }

  // 1. Synchronized Light (White & Gold) / Dark (Charcoal Black-Grey & Gold) Theme
  const savedTheme = localStorage.getItem('wfc_theme');
  if (savedTheme === 'dark' || savedTheme === 'light') {
    root.setAttribute('data-theme', savedTheme);
  }

  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem('wfc_theme', next);
    });
  }

  // 2. Bilingual Switcher (SW / EN)
  const translations = {
    sw: {
      nav_about: 'Kuhusu WFC',
      nav_events: 'Matukio & Tiketi',
      nav_news: 'Matangazo',
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
      menu_main: 'Menyu Kuu',
      menu_community: 'Jumuiya',
      nav_dash: 'Taarifa & Madeni',
      nav_pay: 'Lipa & Tuma Risiti',
      nav_receipts: 'Risiti & Tiketi',
      nav_announcements: 'Matangazo & Maoni',
      nav_projects_side: 'Miradi & Festival',
      nav_public: 'Tovuti Kuu ya WFC',
      btn_exit: 'Toka'
    },
    en: {
      nav_about: 'About WFC',
      nav_events: 'Events & Tickets',
      nav_news: 'Announcements',
      nav_projects: 'Projects',
      nav_contact: 'Contact',
      btn_login: 'Sign In',
      btn_register: 'Register',
      btn_dashboard: 'My Dashboard',
      hero_title: 'Wachagga Family Community Digital Office',
      hero_lead: 'Unity of Chagga, Strength of Family. Track your contributions, welfare support, community investments, and book event tickets online 24/7.',
      cta_login: 'Sign In to Account',
      cta_register: 'Register New Member',
      cta_ticket: 'Book Event Ticket',
      stat_members: 'ACTIVE MEMBERS',
      stat_status: 'SYSTEM STATUS',
      stat_office: 'ONLINE OFFICE',
      menu_main: 'Main Menu',
      menu_community: 'Community',
      nav_dash: 'Statements & Dues',
      nav_pay: 'Pay & Submit Receipt',
      nav_receipts: 'Receipts & Tickets',
      nav_announcements: 'Announcements & Forum',
      nav_projects_side: 'Projects & Festival',
      nav_public: 'WFC Public Portal',
      btn_exit: 'Log Out'
    }
  };

  const langSelect = document.getElementById('lang-select');
  function applyLang(lang) {
    const dict = translations[lang] || translations.sw;
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.dataset.i18n;
      if (dict[key]) el.textContent = dict[key];
    });
  }

  const savedLang = localStorage.getItem('wfc_lang') || 'sw';
  if (langSelect) {
    langSelect.value = savedLang;
    applyLang(savedLang);
    langSelect.addEventListener('change', () => {
      localStorage.setItem('wfc_lang', langSelect.value);
      applyLang(langSelect.value);
    });
  }

  // 3. Public Mobile Navigation
  const mobileNavBtn = document.getElementById('mobile-nav-btn');
  const primaryNav = document.getElementById('primary-nav');
  if (mobileNavBtn && primaryNav) {
    mobileNavBtn.addEventListener('click', () => primaryNav.classList.toggle('open'));
    primaryNav.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => primaryNav.classList.remove('open'));
    });
  }

  // 4. Dashboard Sidebar Drawer & View Switching
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');

  function closeSidebar() {
    if (sidebar) sidebar.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');
  }

  if (mobileMenuBtn && sidebar && backdrop) {
    mobileMenuBtn.addEventListener('click', () => {
      sidebar.classList.add('open');
      backdrop.classList.add('open');
    });
    backdrop.addEventListener('click', closeSidebar);
  }

  const viewTriggers = document.querySelectorAll('[data-switch-view]');
  const viewSections = document.querySelectorAll('.view-section');

  viewTriggers.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.switchView;
      viewTriggers.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      viewSections.forEach((sec) => {
        sec.classList.toggle('active', sec.id === targetId);
      });
      if (window.innerWidth <= 880) closeSidebar();
    });
  });

  // 5. Notifications Popover
  const notifToggle = document.getElementById('notif-toggle');
  const notifPopover = document.getElementById('notif-popover');
  if (notifToggle && notifPopover) {
    notifToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      notifPopover.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
      if (!notifPopover.contains(e.target)) notifPopover.classList.remove('open');
    });
  }

  // 6. Live Search & Urgent Filter on Dashboard
  const globalSearch = document.getElementById('global-search');
  const obligationRows = document.querySelectorAll('#obligations-tbody tr');
  if (globalSearch && obligationRows.length) {
    globalSearch.addEventListener('input', () => {
      const q = globalSearch.value.trim().toLowerCase();
      obligationRows.forEach((row) => {
        row.style.display = (row.dataset.search || '').includes(q) ? '' : 'none';
      });
    });
  }

  const filterUrgentBtn = document.getElementById('filter-urgent-btn');
  let onlyUrgent = false;
  if (filterUrgentBtn && obligationRows.length) {
    filterUrgentBtn.addEventListener('click', () => {
      onlyUrgent = !onlyUrgent;
      filterUrgentBtn.textContent = onlyUrgent ? 'Onyesha Zote' : 'Chuja Muhimu';
      obligationRows.forEach((row) => {
        row.style.display = !onlyUrgent || row.dataset.urgent === 'true' ? '' : 'none';
      });
    });
  }

  // 7. One-Click Copy Payment Account Numbers
  document.querySelectorAll('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const val = btn.dataset.copy;
      if (!val) return;
      const orig = btn.textContent;
      try {
        await navigator.clipboard.writeText(val);
        btn.textContent = 'Imenakiliwa';
        showToast(`Namba ${val} imenakiliwa.`);
        setTimeout(() => {
          btn.textContent = orig;
        }, 1600);
      } catch {
        showToast(`Namba ya malipo: ${val}`);
      }
    });
  });

  // 8. Receipt Submission Helper (Updates Pending KPI & Receipts Table)
  let pendingReceipts = 0;
  function recordSubmittedReceipt(category, amount, ref) {
    pendingReceipts += 1;
    const pendingEl = document.getElementById('kpi-pending-count');
    if (pendingEl) pendingEl.textContent = String(pendingReceipts);

    const receiptsBody = document.getElementById('receipts-tbody');
    if (receiptsBody) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="row-primary num-tabular">${ref.toUpperCase()}</td>
        <td class="row-muted">${category}</td>
        <td class="row-amount num-tabular">TSh ${Number(amount).toLocaleString()}</td>
        <td><span class="row-tag tag-gold">Inakaguliwa na Mhasibu</span></td>
        <td class="text-right">
          <a href="https://wa.me/255755000888?text=Risiti%20${encodeURIComponent(ref)}%20ya%20TSh%20${encodeURIComponent(amount)}" target="_blank" rel="noopener" class="btn btn-ghost btn-xs">Tuma WhatsApp</a>
        </td>
      `;
      receiptsBody.prepend(tr);
    }
    showToast(`Risiti (${ref.toUpperCase()}) ya TSh ${Number(amount).toLocaleString()} imewasilishwa.`);
  }

  // Payment Modal
  const payModal = document.getElementById('payment-modal');
  const payCategory = document.getElementById('pay-category');
  const payAmount = document.getElementById('pay-amount');
  const payForm = document.getElementById('payment-form');

  if (payModal && payForm) {
    document.querySelectorAll('[data-open-pay]').forEach((btn) => {
      btn.addEventListener('click', () => {
        payCategory.value = btn.dataset.openPay || 'Mchango wa WFC';
        payAmount.value = btn.dataset.amount || '';
        payModal.showModal();
      });
    });

    const closeBtn = document.getElementById('close-modal');
    const cancelBtn = document.getElementById('cancel-modal');
    if (closeBtn) closeBtn.addEventListener('click', () => payModal.close());
    if (cancelBtn) cancelBtn.addEventListener('click', () => payModal.close());

    payForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const ref = document.getElementById('pay-ref').value.trim();
      if (!ref) return;
      recordSubmittedReceipt(payCategory.value, payAmount.value, ref);
      payForm.reset();
      payModal.close();
    });
  }

  // Inline Payment Form inside "Lipa & Tuma Risiti" view
  const inlinePayForm = document.getElementById('inline-pay-form');
  if (inlinePayForm) {
    inlinePayForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const cat = document.getElementById('inline-category').value;
      const amt = document.getElementById('inline-amount').value;
      const ref = document.getElementById('inline-ref').value.trim();
      if (!ref) return;
      recordSubmittedReceipt(cat, amt, ref);
      inlinePayForm.reset();
    });
  }

  // 9. Public Ticket Modal
  const ticketModal = document.getElementById('ticket-modal');
  const ticketForm = document.getElementById('ticket-form');
  const openTicketBtn = document.getElementById('open-ticket-modal');
  if (ticketModal && ticketForm && openTicketBtn) {
    openTicketBtn.addEventListener('click', () => ticketModal.showModal());
    document.getElementById('close-ticket-modal').addEventListener('click', () => ticketModal.close());
    document.getElementById('cancel-ticket-modal').addEventListener('click', () => ticketModal.close());

    ticketForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(ticketForm);
      const name = fd.get('fullname');
      const amt = Number(fd.get('tier')).toLocaleString();
      showToast(`Asante ${name}! Hifadhi ya tiketi (TSh ${amt}) imeandaliwa.`);
      ticketForm.reset();
      ticketModal.close();
    });
  }

  // 10. Auth Page Tabs & Redirect to Dashboard
  const authTabs = document.querySelectorAll('[data-auth-tab]');
  if (authTabs.length) {
    const params = new URLSearchParams(window.location.search);
    const initialMode = params.get('mode') === 'register' ? 'register' : 'login';

    function switchAuth(mode) {
      authTabs.forEach((t) => t.classList.toggle('active', t.dataset.authTab === mode));
      document.getElementById('login-form').classList.toggle('active', mode === 'login');
      document.getElementById('register-form').classList.toggle('active', mode === 'register');
    }

    switchAuth(initialMode);
    authTabs.forEach((tab) => {
      tab.addEventListener('click', () => switchAuth(tab.dataset.authTab));
    });

    document.getElementById('login-form').addEventListener('submit', (e) => {
      e.preventDefault();
      window.location.href = 'dashboard.html';
    });

    document.getElementById('register-form').addEventListener('submit', (e) => {
      e.preventDefault();
      window.location.href = 'dashboard.html';
    });
  }

  // 11. Announcements Comment Box
  const commentForm = document.getElementById('comment-form');
  const commentsList = document.getElementById('comments-list');
  if (commentForm && commentsList) {
    commentForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('comment-input');
      const text = input.value.trim();
      if (!text) return;
      const item = document.createElement('div');
      item.className = 'sub-card';
      item.innerHTML = `<strong style="font-size: 13px; color: var(--gold-primary);">HUGO MUSHI (WFC-0007)</strong><p style="margin-top: 4px;">${text}</p>`;
      commentsList.prepend(item);
      input.value = '';
      showToast('Maoni yako yametumwa.');
    });
  }
});
