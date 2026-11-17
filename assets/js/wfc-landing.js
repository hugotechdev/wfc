document.addEventListener('DOMContentLoaded', () => {
  const root = document.documentElement;
  const themeBtn = document.getElementById('theme-toggle');

  // 1. Theme Toggle (White & Gold vs Charcoal Black-Grey & Gold)
  const savedTheme = localStorage.getItem('wfc_theme');
  if (savedTheme === 'light' || savedTheme === 'dark') {
    root.setAttribute('data-theme', savedTheme);
  }

  themeBtn.addEventListener('click', () => {
    const nextTheme = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', nextTheme);
    localStorage.setItem('wfc_theme', nextTheme);
  });

  // 2. Mobile Navigation Drawer
  const mobileNavBtn = document.getElementById('mobile-nav-btn');
  const primaryNav = document.getElementById('primary-nav');

  mobileNavBtn.addEventListener('click', () => {
    primaryNav.classList.toggle('open');
  });

  primaryNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => primaryNav.classList.remove('open'));
  });

  // 3. Copy Payment Account Numbers
  document.querySelectorAll('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const value = btn.dataset.copy;
      if (!value) return;
      try {
        await navigator.clipboard.writeText(value);
        const originalText = btn.textContent;
        btn.textContent = 'Imenakiliwa';
        setTimeout(() => {
          btn.textContent = originalText;
        }, 1600);
      } catch {
        alert('Namba ya malipo: ' + value);
      }
    });
  });

  // 4. Event Ticket Booking Modal
  const ticketModal = document.getElementById('ticket-modal');
  const ticketForm = document.getElementById('ticket-form');

  document.getElementById('open-ticket-modal').addEventListener('click', () => {
    ticketModal.showModal();
  });

  document.getElementById('close-ticket-modal').addEventListener('click', () => {
    ticketModal.close();
  });

  document.getElementById('cancel-ticket-modal').addEventListener('click', () => {
    ticketModal.close();
  });

  ticketForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(ticketForm);
    const name = formData.get('fullname');
    const amount = Number(formData.get('tier')).toLocaleString();
    alert(`Asante ${name}! Ombi la tiketi ya TSh ${amount} limepokelewa.`);
    ticketForm.reset();
    ticketModal.close();
  });
});
