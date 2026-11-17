const token = localStorage.getItem('wfc_token');
if (!token) {
  window.location.href = '/index.html';
}

let dashData = null;
let adminData = null;

// Theme toggle (Light / Dark) – outline icons
const ICON_MOON = '<svg viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
const ICON_SUN = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';

function setThemeIcon(theme) {
  const el = document.getElementById('themeIcon');
  if (el) el.innerHTML = theme === 'dark' ? ICON_MOON : ICON_SUN;
}

function toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('wfc_theme', next);
  setThemeIcon(next);
}
(function() {
  const t = localStorage.getItem('wfc_theme') || 'dark';
  setThemeIcon(t);
})();

function authHeaders(isJson = true) {
  const h = { Authorization: 'Bearer ' + token };
  if (isJson) h['Content-Type'] = 'application/json';
  return h;
}

function logout() {
  localStorage.removeItem('wfc_token');
  localStorage.removeItem('wfc_user');
  window.location.href = '/index.html';
}

function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

function switchTab(tab) {
  ['overview', 'pay', 'receipts', 'feed', 'leader'].forEach(t => {
    const sec = document.getElementById('tab-' + t);
    const btn = document.getElementById('tabBtn-' + t);
    if (sec) sec.style.display = (t === tab) ? 'block' : 'none';
    if (btn) btn.classList.toggle('active', t === tab);
  });
  if (tab === 'feed') loadFeed();
  if (tab === 'leader') loadAdminOverview();
}

function showLeaderSub(subId) {
  document.querySelectorAll('.leader-sub').forEach(el => el.style.display = 'none');
  const target = document.getElementById(subId);
  if (target) target.style.display = 'block';
}

const ROLE_LABELS = {
  superadmin: 'FOUNDER / SUPER ADMIN',
  chairperson: 'MWENYEKITI WA WFC',
  secretary: 'KATIBU MKUU WFC',
  treasurer: 'MWEKA HAZINA (MHASIBU)',
  regional_leader: 'KIONGOZI WA KANDA',
  committee: 'MJUMBE WA KAMATI',
  member: 'MWANACHAMA WA WFC'
};

async function loadDashboard() {
  const res = await fetch('/api/me/dashboard', { headers: authHeaders() });
  if (res.status === 401) return logout();
  dashData = await res.json();

  const u = dashData.user;
  const f = dashData.finances;

  document.getElementById('memberName').textContent = u.full_name;
  document.getElementById('memberWfcId').textContent = u.wfc_id;
  document.getElementById('memberRegion').textContent = `${u.region}${u.district ? ' - ' + u.district : ''}`;
  document.getElementById('memberOrigin').textContent = u.home_origin || 'Kilimanjaro';
  document.getElementById('headerUserRole').textContent = `${ROLE_LABELS[u.role] || u.role} • STAND UP, IT'S NOT OVER`;

  const badge = document.getElementById('memberStatusBadge');
  badge.textContent = u.status === 'active' ? 'MWANACHAMA HAI' : 'INASUBIRI UTHIBITISHO';
  badge.className = 'badge ' + (u.status === 'active' ? 'badge-active' : 'badge-pending');

  // Show Leadership Tab if not ordinary member
  if (u.role !== 'member') {
    document.getElementById('tabBtn-leader').style.display = 'flex';
    document.getElementById('createPostBox').style.display = 'block';
  }

  // Financial Cards
  document.getElementById('sumTotalPaid').textContent = 'TSh ' + Number(f.total_paid).toLocaleString();
  document.getElementById('sumTotalDebt').textContent = 'TSh ' + Number(f.total_debt).toLocaleString();
  document.getElementById('debtBreakdown').textContent = `Ada: ${Number(f.monthly_debt).toLocaleString()} | Kiingilio: ${Number(f.entry_debt).toLocaleString()} | Dharura: ${Number(f.emergency_debt).toLocaleString()}`;
  document.getElementById('sumEmergency').textContent = `TSh ${Number(f.emergency_paid).toLocaleString()} / ${Number(f.rates.emergencyTarget).toLocaleString()}`;
  document.getElementById('sumPending').textContent = f.pending_count;

  // Payment Channels
  document.getElementById('portalMpesa').textContent = dashData.payment_channels.mpesa;
  document.getElementById('portalTigo').textContent = dashData.payment_channels.tigopesa;
  document.getElementById('portalAirtel').textContent = dashData.payment_channels.airtel;
  document.getElementById('portalBank').textContent = dashData.payment_channels.bank;

  // Notifications
  const unread = dashData.notifications.filter(n => !n.is_read).length;
  document.getElementById('notifCount').textContent = unread;
  document.getElementById('notifList').innerHTML = dashData.notifications.length
    ? dashData.notifications.map(n => `
        <div class="card" style="padding:12px; margin-bottom:10px; border-color:${n.is_read ? 'var(--border)' : 'var(--orange)'};">
          <strong style="color:var(--gold);">${n.title}</strong>
          <p style="font-size:0.9rem; margin:4px 0;">${n.message}</p>
          <small style="color:var(--text-muted);">${n.created_at}</small>
        </div>
      `).join('')
    : '<p>Hakuna taarifa mpya kwa sasa.</p>';

  // Actionable Items (Debts + Active Campaigns)
  const actions = [];
  if (f.entry_debt > 0) {
    actions.push({
      title: 'Kamilisha Kiingilio cha Uanachama',
      desc: `Unadaiwa salio la Kiingilio TSh ${Number(f.entry_debt).toLocaleString()} ili akaunti yako iwe Hai.`,
      fund: 'kiingilio',
      amount: f.entry_debt,
      campaignId: ''
    });
  }
  if (f.monthly_debt > 0) {
    actions.push({
      title: 'Lipa Malimbikizo ya Ada ya Mwezi',
      desc: `Una deni la ada ya miezi iliyopita jumla TSh ${Number(f.monthly_debt).toLocaleString()}.`,
      fund: 'ada',
      amount: f.monthly_debt,
      campaignId: ''
    });
  }
  if (f.emergency_debt > 0) {
    actions.push({
      title: 'Jazia Mfuko wa Dharura',
      desc: `Salio lako ni TSh ${Number(f.emergency_paid).toLocaleString()} kati ya TSh ${Number(f.rates.emergencyTarget).toLocaleString()}.`,
      fund: 'dharura',
      amount: f.emergency_debt,
      campaignId: ''
    });
  }
  dashData.actionable_campaigns.forEach(c => {
    if (!c.is_completed) {
      actions.push({
        title: c.title,
        desc: `${c.description || ''} (Kiwango: TSh ${Number(c.target_per_member).toLocaleString()})`,
        fund: c.category,
        amount: c.target_per_member || 10000,
        campaignId: c.id
      });
    }
  });

  const actionBox = document.getElementById('actionableList');
  if (!actions.length) {
    actionBox.innerHTML = '<div style="color:#4ade80; font-weight:700;">🎉 Hongera! Huna deni wala mchango unaokusubiri kwa sasa.</div>';
  } else {
    actionBox.innerHTML = actions.map(a => `
      <div style="background:var(--bg-elevated); padding:14px; border-radius:12px; border:1px solid var(--border); display:flex; flex-direction:column; justify-content:space-between; gap:10px;">
        <div>
          <strong style="color:var(--gold); font-size:1.02rem;">${a.title}</strong>
          <p style="font-size:0.88rem; color:#d4d4d8; margin-top:4px;">${a.desc}</p>
        </div>
        <button class="btn-primary" onclick="quickPay('${a.fund}', ${a.amount}, '${a.campaignId}')">
          ⚡ Lipa TSh ${Number(a.amount).toLocaleString()} Sasa
        </button>
      </div>
    `).join('');
  }

  // Populate Campaign dropdown in Pay Tab
  const campSel = document.getElementById('payCampaignId');
  campSel.innerHTML = '<option value="">-- Chagua Tukio --</option>' +
    dashData.actionable_campaigns.map(c => `<option value="${c.id}">${c.title} (TSh ${Number(c.target_per_member).toLocaleString()})</option>`).join('');

  // Disbursements / Refunds Received
  const disbBox = document.getElementById('disbursementsList');
  if (!dashData.disbursements.length) {
    disbBox.innerHTML = '<p style="color:var(--text-muted); font-size:0.92rem;">Bado hujapokea marejesho au msaada wowote wa kifedha kutoka WFC.</p>';
  } else {
    disbBox.innerHTML = dashData.disbursements.map(d => `
      <div style="background:var(--bg-elevated); padding:12px; border-radius:10px; margin-bottom:8px; border-left:4px solid var(--green);">
        <strong>${d.voucher_no} — TSh ${Number(d.amount).toLocaleString()}</strong> (${d.expense_type.toUpperCase()})
        <p style="font-size:0.9rem; color:#d4d4d8;">${d.reason}</p>
        <small style="color:var(--text-muted);">Imeidhinishwa: ${d.chairperson_at || d.created_at}</small>
      </div>
    `).join('');
  }

  // Receipts Table
  const recBody = document.getElementById('receiptsTableBody');
  recBody.innerHTML = dashData.payments.length
    ? dashData.payments.map(p => `
        <tr>
          <td><strong>${p.receipt_no}</strong></td>
          <td>${p.fund_account.toUpperCase()} ${p.campaign_title ? '(' + p.campaign_title + ')' : ''}</td>
          <td><strong>TSh ${Number(p.amount).toLocaleString()}</strong></td>
          <td>${p.payment_method} (${p.transaction_ref || '-'})</td>
          <td><span class="badge badge-${p.status}">${p.status}</span>${p.rejection_reason ? '<br/><small style="color:#f87171;">' + p.rejection_reason + '</small>' : ''}</td>
          <td>
            ${p.status === 'approved' ? `<button class="btn-primary" style="padding:6px 12px; font-size:0.82rem;" onclick='showReceipt(${JSON.stringify(p)})'>🧾 Risiti</button>` : '<small style="color:var(--text-muted);">Inasubiri</small>'}
          </td>
        </tr>
      `).join('')
    : '<tr><td colspan="6">Bado hujafanya malipo yoyote.</td></tr>';

  // My Tickets
  const tktGrid = document.getElementById('myTicketsGrid');
  tktGrid.innerHTML = dashData.tickets.length
    ? dashData.tickets.map(t => `
        <div class="card" style="border-color:${t.status === 'approved' ? 'var(--green)' : 'var(--gold)'};">
          <div style="display:flex; justify-content:space-between;">
            <strong>${t.ticket_code}</strong>
            <span class="badge badge-${t.status}">${t.status}</span>
          </div>
          <h4 style="margin:6px 0;">${t.event_title}</h4>
          <p style="font-size:0.88rem;">📍 ${t.venue} | 📅 ${t.event_date}</p>
          <p style="font-size:0.88rem;">Daraja: <strong>${t.tier} x${t.quantity}</strong> — TSh ${Number(t.total_amount).toLocaleString()}</p>
          ${t.status === 'approved' ? `<button class="btn-primary" style="margin-top:8px;" onclick='showTicketQr(${JSON.stringify(t)})'>🎟️ Onyesha QR Tiketi</button>` : ''}
        </div>
      `).join('')
    : '<p style="color:var(--text-muted);">Huna tiketi za matukio bado.</p>';
}

function quickPay(fund, amount, campaignId) {
  switchTab('pay');
  document.getElementById('payFund').value = fund;
  document.getElementById('payAmount').value = amount;
  toggleCampaignSelect();
  if (campaignId) {
    document.getElementById('payCampaignId').value = campaignId;
  }
}

function toggleCampaignSelect() {
  const val = document.getElementById('payFund').value;
  const show = ['msiba', 'harusi', 'ugonjwa', 'miradi', 'festival'].includes(val);
  document.getElementById('campaignSelectWrap').style.display = show ? 'block' : 'none';
}

async function openNotifications() {
  openModal('notifModal');
  await fetch('/api/me/notifications/read', { method: 'POST', headers: authHeaders() });
  document.getElementById('notifCount').textContent = '0';
}

function showReceipt(p) {
  const u = dashData.user;
  document.getElementById('receiptDetails').innerHTML = `
    <p><strong>Namba ya Risiti:</strong> ${p.receipt_no}</p>
    <p><strong>Mwanachama:</strong> ${u.full_name} (${u.wfc_id})</p>
    <p><strong>Mfuko / Sababu:</strong> ${p.fund_account.toUpperCase()}</p>
    <p><strong>Kiasi Kilicholipwa:</strong> TSh ${Number(p.amount).toLocaleString()}</p>
    <p><strong>Njia & Muamala:</strong> ${p.payment_method} (${p.transaction_ref})</p>
    <p><strong>Tarehe ya Idhini:</strong> ${p.reviewed_at || p.created_at}</p>
  `;
  const qrData = `WFC-RECEIPT|${p.receipt_no}|${u.wfc_id}|TSh ${p.amount}|APPROVED`;
  document.getElementById('receiptQr').src = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(qrData)}`;
  const waText = `RISITI YA WACHAGGA FAMILY COMMUNITY (WFC)%0ANamba: ${p.receipt_no}%0AJina: ${u.full_name} (${u.wfc_id})%0AMfuko: ${p.fund_account.toUpperCase()}%0AKiasi: TSh ${Number(p.amount).toLocaleString()}%0AHali: IMETHIBITISHWA (APPROVED)`;
  document.getElementById('whatsappShareBtn').href = `https://wa.me/?text=${waText}`;
  openModal('receiptModal');
}

function showTicketQr(t) {
  document.getElementById('receiptDetails').innerHTML = `
    <p><strong>Namba ya Tiketi:</strong> ${t.ticket_code}</p>
    <p><strong>Tukio:</strong> ${t.event_title}</p>
    <p><strong>Mhudhuriaji:</strong> ${t.buyer_name} (${t.buyer_phone})</p>
    <p><strong>Daraja & Idadi:</strong> ${t.tier} (Tiketi ${t.quantity})</p>
    <p><strong>Ukumbi & Tarehe:</strong> ${t.venue} | ${t.event_date}</p>
  `;
  document.getElementById('receiptQr').src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(t.ticket_code)}`;
  const waText = `TIKETI RASMI YA WFC%0ACode: ${t.ticket_code}%0ATukio: ${t.event_title}%0AJina: ${t.buyer_name}%0ADaraja: ${t.tier} x${t.quantity}`;
  document.getElementById('whatsappShareBtn').href = `https://wa.me/?text=${waText}`;
  openModal('receiptModal');
}

async function submitPaymentProof(e) {
  e.preventDefault();
  const fd = new FormData();
  fd.append('fund_account', document.getElementById('payFund').value);
  fd.append('campaign_id', document.getElementById('payCampaignId').value);
  fd.append('amount', document.getElementById('payAmount').value);
  fd.append('for_month', document.getElementById('payMonth').value);
  fd.append('payment_method', document.getElementById('payMethod').value);
  fd.append('transaction_ref', document.getElementById('payRef').value);
  fd.append('sms_text', document.getElementById('paySms').value);
  const file = document.getElementById('payProofFile').files[0];
  if (file) fd.append('proof_image', file);

  const msg = document.getElementById('paySubmitMsg');
  msg.style.color = '#fbbf24';
  msg.textContent = 'Inatuma uthibitisho...';

  const res = await fetch('/api/me/payments', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token },
    body: fd
  });
  const data = await res.json();
  if (!res.ok) {
    msg.style.color = '#f87171';
    msg.textContent = data.error || 'Hitilafu imetokea.';
  } else {
    msg.style.color = '#4ade80';
    msg.textContent = '✅ ' + data.message;
    e.target.reset();
    loadDashboard();
  }
}

// ================= SOCIAL FEED (TEXT-ONLY COMMENTS) =================

async function loadFeed() {
  const res = await fetch('/api/feed', { headers: authHeaders() });
  const data = await res.json();
  const box = document.getElementById('feedContainer');

  if (!data.posts.length) {
    box.innerHTML = '<div class="card">Hakuna matangazo yaliyochapishwa bado.</div>';
    return;
  }

  const canModerate = ['superadmin', 'chairperson', 'secretary', 'committee'].includes(dashData.user.role);

  box.innerHTML = data.posts.map(p => `
    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <div>
          <span class="badge badge-pending">${p.category}</span>
          <strong style="margin-left:8px; color:var(--gold);">${p.author_name || 'Uongozi WFC'}</strong>
        </div>
        <small style="color:var(--text-muted);">${p.created_at}</small>
      </div>
      <h3 style="margin:10px 0 6px; font-size:1.22rem;">${p.title}</h3>
      <p style="color:#e4e4e7; white-space:pre-line; margin-bottom:12px;">${p.content}</p>

      ${p.image_path ? `<img src="${p.image_path}" style="max-width:100%; max-height:360px; border-radius:12px; margin-bottom:12px; border:1px solid var(--border);" />` : ''}
      ${p.doc_path ? `<p style="margin-bottom:10px;"><a href="${p.doc_path}" target="_blank" class="btn-outline">📄 Pakua Nyaraka: ${p.doc_name || 'Document'}</a></p>` : ''}
      ${p.meet_link ? `<p style="margin-bottom:10px;"><a href="${p.meet_link}" target="_blank" class="btn-primary">🎥 Jiunge na Kikao (Google Meet)</a></p>` : ''}

      <div style="display:flex; gap:12px; align-items:center; padding-top:10px; border-top:1px solid var(--border);">
        <button class="btn-outline" style="padding:6px 14px;" onclick="toggleLike(${p.id})">
          👍 Penda (${p.likes_count})
        </button>
        <span style="color:var(--text-muted); font-size:0.9rem;">💬 Maoni (${p.comments.length})</span>
      </div>

      <!-- Text-only Comments Section -->
      <div style="margin-top:12px; background:var(--bg-elevated); padding:12px; border-radius:12px;">
        ${p.comments.map(c => `
          <div style="padding:8px 0; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; gap:8px;">
            <div>
              <strong style="color:var(--orange); font-size:0.88rem;">${c.full_name} (${c.wfc_id}):</strong>
              <span style="font-size:0.92rem; color:#f4f4f5;">${escapeHtml(c.comment_text)}</span>
            </div>
            ${canModerate ? `<button onclick="deleteComment(${c.id})" style="background:none; border:none; color:#f87171; cursor:pointer;" title="Futa maoni">🗑️</button>` : ''}
          </div>
        `).join('')}

        <form onsubmit="postComment(event, ${p.id})" style="display:flex; gap:8px; margin-top:10px;">
          <input type="text" id="commentInput-${p.id}" class="form-control" placeholder="Andika maoni yako (maandishi pekee)..." required />
          <button type="submit" class="btn-primary" style="padding:8px 16px;">Tuma</button>
        </form>
      </div>
    </div>
  `).join('');
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

async function createPost(e) {
  e.preventDefault();
  const fd = new FormData();
  fd.append('title', document.getElementById('postTitle').value);
  fd.append('category', document.getElementById('postCategory').value);
  fd.append('content', document.getElementById('postContent').value);
  fd.append('meet_link', document.getElementById('postMeet').value);
  const img = document.getElementById('postImage').files[0];
  const doc = document.getElementById('postDoc').files[0];
  if (img) fd.append('image', img);
  if (doc) fd.append('document', doc);

  const res = await fetch('/api/feed', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token },
    body: fd
  });
  if (res.ok) {
    e.target.reset();
    loadFeed();
  }
}

async function toggleLike(postId) {
  await fetch(`/api/feed/${postId}/like`, { method: 'POST', headers: authHeaders() });
  loadFeed();
}

async function postComment(e, postId) {
  e.preventDefault();
  const inp = document.getElementById('commentInput-' + postId);
  const text = inp.value.trim();
  if (!text) return;
  const res = await fetch(`/api/feed/${postId}/comments`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ comment_text: text })
  });
  if (res.ok) {
    inp.value = '';
    loadFeed();
  }
}

async function deleteComment(commentId) {
  if (!confirm('Futa maoni haya?')) return;
  await fetch(`/api/feed/comments/${commentId}`, { method: 'DELETE', headers: authHeaders() });
  loadFeed();
}

// ================= LEADERSHIP & MULTI-LEVEL APPROVALS =================

async function loadAdminOverview() {
  const res = await fetch('/api/admin/overview', { headers: authHeaders() });
  if (!res.ok) return;
  adminData = await res.json();

  const role = dashData.user.role;
  const isTreasurer = ['treasurer', 'superadmin'].includes(role);
  const isSecretary = ['secretary', 'superadmin'].includes(role);
  const isChair = ['chairperson', 'superadmin'].includes(role);

  // 1. Incoming Payments Queue
  const pendingPays = adminData.payments.filter(p => p.status === 'pending');
  document.getElementById('badgePendingPay').textContent = pendingPays.length;

  document.getElementById('adminPaymentsBody').innerHTML = adminData.payments.map(p => `
    <tr>
      <td><strong>${p.full_name}</strong><br/><small>${p.wfc_id} • ${p.phone}</small></td>
      <td>${p.fund_account.toUpperCase()}</td>
      <td><strong>TSh ${Number(p.amount).toLocaleString()}</strong></td>
      <td>
        <strong>${p.payment_method}:</strong> ${p.transaction_ref || '-'}<br/>
        ${p.sms_text ? `<small style="color:#d4d4d8;">"${escapeHtml(p.sms_text)}"</small><br/>` : ''}
        ${p.proof_image ? `<a href="${p.proof_image}" target="_blank" style="color:var(--orange); font-weight:700;">🖼️ Angalia Risiti</a>` : ''}
      </td>
      <td><span class="badge badge-${p.status}">${p.status}</span></td>
      <td>
        ${p.status === 'pending' && isTreasurer ? `
          <button class="btn-success" onclick="reviewPayment(${p.id}, 'approved')">✓ Approve</button>
          <button class="btn-danger" onclick="reviewPayment(${p.id}, 'rejected')">✕ Kataa</button>
        ` : `<small>${p.reviewer_name || '-'}</small>`}
      </td>
    </tr>
  `).join('');

  // Populate recipient dropdown for expenses
  const recSel = document.getElementById('expRecipientUser');
  recSel.innerHTML = '<option value="">-- Si mwanachama mmoja / Nje --</option>' +
    adminData.members.map(m => `<option value="${m.id}">${m.full_name} (${m.wfc_id})</option>`).join('');

  // 2. Multi-Level Expenses / Aid / Refunds
  document.getElementById('adminExpensesBody').innerHTML = adminData.expenses.map(ex => {
    let actionHtml = '<small style="color:var(--text-muted);">Imekamilika</small>';
    if (ex.status === 'pending_secretary' && isSecretary) {
      actionHtml = `<button class="btn-primary" style="padding:6px 10px;" onclick="approveExpense(${ex.id}, 'approved')">✓ Katibu Hakiki</button>
                    <button class="btn-danger" style="padding:6px 10px;" onclick="approveExpense(${ex.id}, 'rejected')">✕</button>`;
    } else if (ex.status === 'pending_chairperson' && isChair) {
      actionHtml = `<button class="btn-success" style="padding:6px 10px;" onclick="approveExpense(${ex.id}, 'approved')">✓ Mwenyekiti Idhinisha</button>
                    <button class="btn-danger" style="padding:6px 10px;" onclick="approveExpense(${ex.id}, 'rejected')">✕</button>`;
    }
    return `
      <tr>
        <td><strong>${ex.voucher_no}</strong></td>
        <td>${ex.fund_account.toUpperCase()} (${ex.expense_type})<br/><small>${ex.reason}</small></td>
        <td>${ex.recipient_name || '-'}</td>
        <td><strong>TSh ${Number(ex.amount).toLocaleString()}</strong></td>
        <td><span class="badge badge-${ex.status === 'approved' ? 'approved' : (ex.status === 'rejected' ? 'rejected' : 'pending')}">${ex.status}</span></td>
        <td>${actionHtml}</td>
      </tr>
    `;
  }).join('');

  // 3. Campaigns
  document.getElementById('adminCampaignsList').innerHTML = adminData.campaigns.map(c => `
    <div class="card">
      <div style="display:flex; justify-content:space-between;">
        <span class="badge badge-${c.status === 'active' ? 'approved' : 'pending'}">${c.status}</span>
        <small>${c.category.toUpperCase()}</small>
      </div>
      <h4 style="margin:8px 0;">${c.title}</h4>
      <p style="font-size:0.88rem; color:#d4d4d8;">${c.description || ''}</p>
      <p style="margin-top:6px; font-weight:700; color:var(--gold);">Imekusanywa: TSh ${Number(c.collected_amount).toLocaleString()}</p>
      ${c.status === 'pending_secretary' && isSecretary ? `<button class="btn-primary" style="margin-top:8px;" onclick="approveCampaign(${c.id})">✓ Katibu Thibitisha</button>` : ''}
      ${c.status === 'pending_chairperson' && isChair ? `<button class="btn-success" style="margin-top:8px;" onclick="approveCampaign(${c.id})">✓ Mwenyekiti Zindua</button>` : ''}
    </div>
  `).join('');

  // 4. Funds Grid
  document.getElementById('adminFundsGrid').innerHTML = adminData.funds.map(f => `
    <div class="card" style="border-top:3px solid var(--orange);">
      <strong style="color:var(--gold); text-transform:uppercase;">${f.fund}</strong>
      <div style="font-size:1.35rem; font-weight:900; margin:6px 0; color:#4ade80;">TSh ${Number(f.balance).toLocaleString()}</div>
      <small style="color:var(--text-muted);">Mapato: ${Number(f.income).toLocaleString()} | Matumizi: ${Number(f.expense).toLocaleString()}</small>
    </div>
  `).join('');

  // 5. Members
  renderAdminMembers();

  // 6. Tickets
  document.getElementById('adminTicketsBody').innerHTML = adminData.tickets.map(t => `
    <tr>
      <td><strong>${t.ticket_code}</strong></td>
      <td>${t.buyer_name}<br/><small>${t.buyer_phone}</small></td>
      <td>${t.event_title}<br/><small>${t.tier} x${t.quantity}</small></td>
      <td>TSh ${Number(t.total_amount).toLocaleString()}<br/><small>${t.transaction_ref}</small></td>
      <td><span class="badge badge-${t.status}">${t.status}</span> ${t.checked_in ? '✅ AMEINGIA' : ''}</td>
      <td>
        ${t.status === 'pending' && isTreasurer ? `
          <button class="btn-success" onclick="reviewTicket(${t.id}, 'approved')">✓ Approve</button>
          <button class="btn-danger" onclick="reviewTicket(${t.id}, 'rejected')">✕</button>
        ` : '-'}
      </td>
    </tr>
  `).join('');

  // 7. Settings & Audit Logs
  if (adminData.settings) {
    document.getElementById('setEntry').value = adminData.settings.entry_fee || 50000;
    document.getElementById('setMonthly').value = adminData.settings.monthly_fee || 10000;
    document.getElementById('setEmergency').value = adminData.settings.emergency_fee || 60000;
    document.getElementById('setMpesa').value = adminData.settings.mpesa_number || '';
    document.getElementById('setTigo').value = adminData.settings.tigopesa_number || '';
  }

  document.getElementById('auditLogsBody').innerHTML = adminData.audit_logs.map(l => `
    <tr>
      <td><small>${l.created_at}</small></td>
      <td><strong>${l.actor_name}</strong> (${l.actor_role})</td>
      <td><span class="badge badge-pending">${l.action}</span></td>
      <td><small>${l.details}</small></td>
    </tr>
  `).join('');
}

function renderAdminMembers() {
  if (!adminData) return;
  const q = (document.getElementById('memberSearchInput').value || '').toLowerCase();
  const canAssignRole = ['superadmin', 'chairperson'].includes(dashData.user.role);

  const filtered = adminData.members.filter(m =>
    m.full_name.toLowerCase().includes(q) ||
    (m.wfc_id || '').toLowerCase().includes(q) ||
    (m.region || '').toLowerCase().includes(q) ||
    (m.phone || '').includes(q)
  );

  document.getElementById('adminMembersBody').innerHTML = filtered.map(m => `
    <tr>
      <td><strong>${m.wfc_id}</strong></td>
      <td>${m.full_name}<br/><small>${m.phone}</small></td>
      <td>${m.region}<br/><small>${m.home_origin || '-'}</small></td>
      <td>
        ${canAssignRole ? `
          <select onchange="updateMember(${m.id}, this.value, null)" class="form-control" style="padding:6px; font-size:0.84rem;">
            ${['member', 'regional_leader', 'committee', 'treasurer', 'secretary', 'chairperson', 'superadmin'].map(r =>
              `<option value="${r}" ${m.role === r ? 'selected' : ''}>${r}</option>`
            ).join('')}
          </select>
        ` : m.role}
      </td>
      <td><span class="badge badge-${m.status}">${m.status}</span></td>
      <td>
        <select onchange="updateMember(${m.id}, null, this.value)" class="form-control" style="padding:6px; font-size:0.84rem;">
          <option value="active" ${m.status === 'active' ? 'selected' : ''}>Active (Hai)</option>
          <option value="pending" ${m.status === 'pending' ? 'selected' : ''}>Pending</option>
          <option value="suspended" ${m.status === 'suspended' ? 'selected' : ''}>Suspended</option>
          <option value="exited" ${m.status === 'exited' ? 'selected' : ''}>Exited</option>
        </select>
      </td>
    </tr>
  `).join('');
}

async function reviewPayment(id, decision) {
  let rejection_reason = '';
  if (decision === 'rejected') {
    rejection_reason = prompt('Andika sababu ya kukataa malipo haya:') || 'Muamala haujathibitika';
  }
  const res = await fetch(`/api/admin/payments/${id}/review`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ decision, rejection_reason })
  });
  const data = await res.json();
  alert(data.message || data.error);
  loadAdminOverview();
  loadDashboard();
}

async function createExpenseVoucher(e) {
  e.preventDefault();
  const payload = {
    fund_account: document.getElementById('expFund').value,
    expense_type: document.getElementById('expType').value,
    amount: document.getElementById('expAmount').value,
    recipient_user_id: document.getElementById('expRecipientUser').value,
    recipient_name: document.getElementById('expRecipientName').value,
    reason: document.getElementById('expReason').value
  };
  const res = await fetch('/api/admin/expenses', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  alert(data.message || data.error);
  e.target.reset();
  loadAdminOverview();
}

async function approveExpense(id, decision) {
  const res = await fetch(`/api/admin/expenses/${id}/approve`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ decision })
  });
  const data = await res.json();
  alert(data.message || data.error);
  loadAdminOverview();
}

async function createCampaign(e) {
  e.preventDefault();
  const payload = {
    title: document.getElementById('campTitle').value,
    category: document.getElementById('campCategory').value,
    target_per_member: document.getElementById('campPerMember').value,
    description: document.getElementById('campDesc').value
  };
  const res = await fetch('/api/admin/campaigns', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  alert(data.message || data.error);
  e.target.reset();
  loadAdminOverview();
}

async function approveCampaign(id) {
  const res = await fetch(`/api/admin/campaigns/${id}/approve`, {
    method: 'POST',
    headers: authHeaders()
  });
  const data = await res.json();
  alert(data.message || data.error);
  loadAdminOverview();
}

async function updateMember(id, role, status) {
  const body = {};
  if (role) body.role = role;
  if (status) body.status = status;
  const res = await fetch(`/api/admin/members/${id}/update`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body)
  });
  const data = await res.json();
  alert(data.message || data.error);
  loadAdminOverview();
}

async function createEvent(e) {
  e.preventDefault();
  const payload = {
    title: document.getElementById('evTitle').value,
    venue: document.getElementById('evVenue').value,
    event_date: document.getElementById('evDate').value,
    regular_price: document.getElementById('evReg').value,
    vip_price: document.getElementById('evVip').value,
    family_price: document.getElementById('evFam').value
  };
  const res = await fetch('/api/admin/events', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  alert(data.message || data.error);
  e.target.reset();
  loadAdminOverview();
}

async function reviewTicket(id, decision) {
  const res = await fetch(`/api/admin/tickets/${id}/review`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ decision })
  });
  const data = await res.json();
  alert(data.message || data.error);
  loadAdminOverview();
}

async function checkinTicket() {
  const ticket_code = document.getElementById('checkinCodeInput').value;
  const res = await fetch('/api/admin/tickets/checkin', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ ticket_code })
  });
  const data = await res.json();
  const box = document.getElementById('checkinResult');
  box.style.color = res.ok ? '#4ade80' : '#f87171';
  box.textContent = data.message || data.error;
  loadAdminOverview();
}

async function saveSettings(e) {
  e.preventDefault();
  const payload = {
    entry_fee: document.getElementById('setEntry').value,
    monthly_fee: document.getElementById('setMonthly').value,
    emergency_fee: document.getElementById('setEmergency').value,
    mpesa_number: document.getElementById('setMpesa').value,
    tigopesa_number: document.getElementById('setTigo').value
  };
  const res = await fetch('/api/admin/settings', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  alert(data.message || data.error);
}

loadDashboard();
