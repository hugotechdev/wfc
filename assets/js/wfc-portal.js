document.addEventListener('DOMContentLoaded', () => {
  const root = document.documentElement;
  const toastEl = document.getElementById('toast-banner');
  let toastTimer = null;

  function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 3400);
  }

  // 1. Theme Switcher (Dark Charcoal & Gold <-> Light White & Gold)
  const savedTheme = localStorage.getItem('wfc_theme');
  if (savedTheme === 'light' || savedTheme === 'dark') {
    root.setAttribute('data-theme', savedTheme);
  }

  document.getElementById('theme-toggle').addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem('wfc_theme', next);
  });

  // 2. Bilingual Switcher (Kiswahili / English)
  const dict = {
    sw: {
      nav_about: 'Kuhusu WFC',
      nav_events: 'Matukio & Tiketi',
      nav_news: 'Matangazo',
      nav_projects: 'Miradi',
      nav_contact: 'Mawasiliano',
      btn_login: 'Ingia',
      btn_register: 'Jisajili',
      btn_dash: 'Dashibodi Yangu',
      hero_title: 'Ofisi ya Kidijitali ya Wachagga Family Community',
      hero_subtitle: 'Umoja wa Wachagga, Nguvu ya Familia. Fuatilia taarifa zako, michango, misaada, miradi ya maendeleo, na kata tiketi za matukio mtandaoni saa 24.',
      cta_login: 'Ingia Kwenye Akaunti',
      cta_register: 'Jisajili Mwanachama Mpya',
      cta_ticket: 'Kata Tiketi ya Tukio',
      stat_members: 'WANACHAMA HAI',
      stat_system: 'HALI YA MFUMO',
      stat_online: 'OFISI MTANDAONI'
    },
    en: {
      nav_about: 'About WFC',
      nav_events: 'Events & Tickets',
      nav_news: 'Announcements',
      nav_projects: 'Projects',
      nav_contact: 'Contact',
      btn_login: 'Sign In',
      btn_register: 'Register',
      btn_dash: 'My Dashboard',
      hero_title: 'Wachagga Family Community Digital Office',
      hero_subtitle: 'Unity of Chagga, Strength of Family. Track your contributions, welfare support, community investments, and book event tickets online 24/7.',
      cta_login: 'Sign In to Account',
      cta_register: 'Register New Member',
      cta_ticket: 'Book Event Ticket',
      stat_members: 'ACTIVE MEMBERS',
      stat_system: 'SYSTEM STATUS',
      stat_online: 'ONLINE OFFICE'
    }
  };

  const langSelect = document.getElementById('lang-select');
  function setLang(code) {
    const strings = dict[code] || dict.sw;
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const k = el.dataset.i18n;
      if (strings[k]) el.textContent = strings[k];
    });
  }

  const savedLang = localStorage.getItem('wfc_lang') || 'sw';
  langSelect.value = savedLang;
  setLang(savedLang);
  langSelect.addEventListener('change', () => {
    localStorage.setItem('wfc_lang', langSelect.value);
    setLang(langSelect.value);
  });

  // 3. Mobile Navigation Drawer
  const mobileToggle = document.getElementById('mobile-nav-toggle');
  const mainNav = document.getElementById('main-nav');
  mobileToggle.addEventListener('click', () => mainNav.classList.toggle('open'));
  mainNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => mainNav.classList.remove('open'));
  });

  // 4. One-Click Copy Payment Account Numbers
  document.querySelectorAll('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const number = btn.dataset.copy;
      if (!number) return;
      const orig = btn.textContent;
      try {
        await navigator.clipboard.writeText(number);
        btn.textContent = 'Imenakiliwa';
        showToast(`Namba ${number} imenakiliwa.`);
        setTimeout(() => {
          btn.textContent = orig;
        }, 1600);
      } catch {
        showToast(`Namba ya malipo: ${number}`);
      }
    });
  });

  // 5. Dialog Close Buttons
  document.querySelectorAll('[data-close-dialog]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const dlg = document.getElementById(btn.dataset.closeDialog);
      if (dlg) dlg.close();
    });
  });

  // 6. Ticket Booking & Verification Modals
  const ticketModal = document.getElementById('ticket-modal');
  const ticketForm = document.getElementById('ticket-form');
  document.getElementById('open-book-ticket').addEventListener('click', () => ticketModal.showModal());

  ticketForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(ticketForm);
    const name = fd.get('fullname');
    const amount = Number(fd.get('tier')).toLocaleString();
    showToast(`Asante ${name}! Hifadhi ya tiketi (TSh ${amount}) imeandaliwa.`);
    ticketForm.reset();
    ticketModal.close();
  });

  const verifyModal = document.getElementById('verify-modal');
  const verifyForm = document.getElementById('verify-form');
  document.getElementById('open-verify-ticket').addEventListener('click', () => verifyModal.showModal());

  verifyForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = document.getElementById('verify-query').value.trim();
    if (!q) return;
    showToast(`Uhakiki wa tiketi "${q}" umekamilika: Hali - Hai.`);
    verifyForm.reset();
    verifyModal.close();
  });

  // 7. Auth Modal (Ingia / Jisajili)
  const authModal = document.getElementById('auth-modal');
  const authTitle = document.getElementById('auth-modal-title');
  const authNameWrap = document.getElementById('auth-name-wrap');

  function openAuth(mode) {
    const isReg = mode === 'register';
    authTitle.textContent = isReg ? 'Jisajili Mwanachama Mpya wa WFC' : 'Ingia Kwenye Akaunti ya WFC';
    authNameWrap.style.display = isReg ? 'flex' : 'none';
    authModal.showModal();
  }

  document.getElementById('open-login-btn').addEventListener('click', (e) => {
    e.preventDefault();
    openAuth('login');
  });

  document.getElementById('open-register-btn').addEventListener('click', (e) => {
    e.preventDefault();
    openAuth('register');
  });

  document.querySelectorAll('[data-auth-open]').forEach((btn) => {
    btn.addEventListener('click', () => openAuth(btn.dataset.authOpen));
  });

  document.getElementById('auth-form').addEventListener('submit', (e) => {
    e.preventDefault();
    showToast('Karibu WFC Digital Office!');
    authModal.close();
  });
});
