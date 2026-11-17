document.addEventListener('DOMContentLoaded', () => {
  const root = document.documentElement;
  const themeBtn = document.getElementById('theme-toggle');

  // 1. Restore saved theme preference (Light White & Gold vs Dark Charcoal & Gold)
  const savedTheme = localStorage.getItem('wfc_theme');
  if (savedTheme === 'dark' || savedTheme === 'light') {
    root.setAttribute('data-theme', savedTheme);
  }

  themeBtn.addEventListener('click', () => {
    const nextTheme = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', nextTheme);
    localStorage.setItem('wfc_theme', nextTheme);
  });

  // 2. Module Tab Active State
  const moduleCards = document.querySelectorAll('.module-card');
  moduleCards.forEach((card) => {
    card.addEventListener('click', () => {
      moduleCards.forEach((c) => c.classList.remove('active'));
      card.classList.add('active');
    });
  });

  // 3. Payment Dialog Handling
  const modal = document.getElementById('payment-modal');
  const payCategory = document.getElementById('pay-category');
  const payAmount = document.getElementById('pay-amount');
  const payForm = document.getElementById('payment-form');

  document.querySelectorAll('[data-open-pay]').forEach((btn) => {
    btn.addEventListener('click', () => {
      payCategory.value = btn.dataset.openPay || 'Mchango wa WFC';
      payAmount.value = btn.dataset.amount || '';
      modal.showModal();
    });
  });

  document.getElementById('close-modal').addEventListener('click', () => modal.close());
  document.getElementById('cancel-modal').addEventListener('click', () => modal.close());

  payForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const ref = document.getElementById('pay-ref').value.trim();
    if (!ref) return;
    alert(`Risiti (${ref}) ya TSh ${Number(payAmount.value).toLocaleString()} imetumwa kwa Mhasibu.`);
    payForm.reset();
    modal.close();
  });
});
