(function () {
  'use strict';

  // =========================================================================
  // 1. BILINGUAL DICTIONARY (SW / EN) — Pure Idiomatic Strings, Zero Clutter
  // =========================================================================
  const I18N = {
    sw: {
      orgName: 'Wachagga Family Community',
      digitalOffice: 'Ofisi ya Kidijitali V7',
      motto: 'Simama · Bado Haijaisha',
      navGroupMain: 'UTAWALA & WANACHAMA',
      navGroupOps: 'FEDHA, MATUKIO & RIPOTI',
      navGroupSystem: 'OFISI & USALAMA',
      navDashboard: 'Dashibodi Kuu',
      navMembers: 'Wanachama',
      navMemberHistory: 'Historia ya Mwanachama',
      navContributions: 'Michango & Uhasibu',
      navEvents: 'Matukio & Tiketi',
      navDocuments: 'Nyaraka za Wanachama',
      navReports: 'Ripoti & Mauzo',
      navLeadership: 'Uongozi (RBAC)',
      navApprovals: 'Idhini Zinazosubiri',
      navCases: 'Kesi & Nidhamu',
      navAssets: 'Mali za Jamii',
      navProjects: 'Miradi ya Maendeleo',
      navMessages: 'Kituo cha Ujumbe',
      navSecurity: 'Akaunti & Usalama',
      modePortal: 'Portal',
      modeLanding: 'Tovuti Kuu',
      modeLogin: 'Ingia / Sajili',
      modeTickets: 'Ukurasa wa Tiketi',
      logout: 'Ondoka',
      myProfile: 'Wasifu Wangu',
      accountSettings: 'Mipangilio ya Akaunti',
      changePassword: 'Badili Nenosiri',
      notificationsTitle: 'Taarifa na Arifa',
      markAllRead: 'Soma Zote',
      unreadLabel: 'Hazijasomwa',
      readLabel: 'Imesomwa',
      registerMemberBtn: '+ Sajili Mwanachama Mpya',
      viewDetails: 'Tazama Maelezo',
      kpiTotalMembers: 'Jumla ya Wanachama',
      kpiTotalMembersSub: 'Waliosajiliwa kwenye mfumo',
      kpiActiveMembers: 'Wanachama Hai',
      kpiActiveMembersSub: 'Waliothibitishwa na WFC ID',
      kpiNewMonth: 'Wanachama Wapya Mwezi Huu',
      kpiNewMonthSub: 'Ndani ya siku 30 zilizopita',
      kpiTotalContrib: 'Jumla ya Michango',
      kpiTotalContribSub: 'Malipo yaliyothibitishwa',
      kpiUpcomingEvents: 'Matukio Yajayo',
      kpiUpcomingEventsSub: 'Kalenda rasmi ya WFC',
      kpiPendingApprovals: 'Inasubiri Idhini',
      kpiPendingApprovalsSub: 'Wanachama, Michango & Nyaraka',
      kpiNotifSummary: 'Muhtasari wa Taarifa',
      kpiNotifSummarySub: 'Hazijasomwa / Jumla ya taarifa',
      finIncome: 'Jumla ya Mapato',
      finExpense: 'Jumla ya Matumizi',
      finBalance: 'Salio la Mfuko',
      finArrears: 'Madeni ya Ada (Wanachama 4)',
      chartGrowth: 'Mwenendo wa Ukuaji wa Wanachama',
      chartContrib: 'Mwenendo wa Michango (TSh)',
      chartRegion: 'Wanachama kwa Kanda / Mkoa',
      chartClan: 'Wanachama kwa Ukoo',
      chartAttendance: 'Takwimu za Mahudhurio ya Matukio',
      recentContrib: 'Michango ya Hivi Karibuni',
      upcomingEventsCard: 'Matukio & Matangazo',
      searchPlaceholder: 'Tafuta kwa jina, WFC ID, simu, barua pepe, mkoa, wilaya, ukoo au hali...',
      filterAll: 'Wote',
      filterActive: 'Hai',
      filterInactivePending: 'Wasio Hai / Wanaosubiri',
      filterLeaders: 'Viongozi',
      filterNew: 'Wanachama Wapya',
      filterPendingApproval: 'Wanaosubiri Idhini',
      exportPdf: 'Hamisha PDF',
      exportExcel: 'Hamisha Excel',
      printReport: 'Chapisha Ripoti',
      close: 'Funga',
      save: 'Hifadhi Taarifa',
      approve: 'Idhinisha'
    },
    en: {
      orgName: 'Wachagga Family Community',
      digitalOffice: 'Digital Office V7',
      motto: "Stand up · It's not over",
      navGroupMain: 'GOVERNANCE & MEMBERS',
      navGroupOps: 'FINANCE, EVENTS & REPORTS',
      navGroupSystem: 'OFFICE & SECURITY',
      navDashboard: 'Main Dashboard',
      navMembers: 'Members Directory',
      navMemberHistory: 'Member History',
      navContributions: 'Contributions & Accounting',
      navEvents: 'Events & Tickets',
      navDocuments: 'Document Management',
      navReports: 'Reports & Exports',
      navLeadership: 'Leadership (RBAC)',
      navApprovals: 'Pending Approvals',
      navCases: 'Cases & Discipline',
      navAssets: 'Community Assets',
      navProjects: 'Community Projects',
      navMessages: 'Message Center',
      navSecurity: 'Account & Security',
      modePortal: 'Portal',
      modeLanding: 'Landing Page',
      modeLogin: 'Login / Register',
      modeTickets: 'Ticket Page',
      logout: 'Logout',
      myProfile: 'My Profile',
      accountSettings: 'Account Settings',
      changePassword: 'Change Password',
      notificationsTitle: 'Notifications Center',
      markAllRead: 'Mark All as Read',
      unreadLabel: 'Unread',
      readLabel: 'Read',
      registerMemberBtn: '+ Register New Member',
      viewDetails: 'View Details',
      kpiTotalMembers: 'Total Members',
      kpiTotalMembersSub: 'Registered in WFC registry',
      kpiActiveMembers: 'Active Members',
      kpiActiveMembersSub: 'Verified with active WFC ID',
      kpiNewMonth: 'New Members This Month',
      kpiNewMonthSub: 'Registered in the last 30 days',
      kpiTotalContrib: 'Total Contributions',
      kpiTotalContribSub: 'Verified and approved inflows',
      kpiUpcomingEvents: 'Upcoming Events',
      kpiUpcomingEventsSub: 'Official WFC calendar',
      kpiPendingApprovals: 'Pending Approvals',
      kpiPendingApprovalsSub: 'Members, Contributions & Docs',
      kpiNotifSummary: 'Notifications Summary',
      kpiNotifSummarySub: 'Unread / Total alerts',
      finIncome: 'Total Income',
      finExpense: 'Total Expenses',
      finBalance: 'Fund Balance',
      finArrears: 'Annual Fee Arrears (4 Members)',
      chartGrowth: 'Membership Growth Trend',
      chartContrib: 'Contribution Trend (TSh)',
      chartRegion: 'Members by Region',
      chartClan: 'Members by Clan',
      chartAttendance: 'Event Attendance Statistics',
      recentContrib: 'Recent Contributions',
      upcomingEventsCard: 'Upcoming Events & Announcements',
      searchPlaceholder: 'Search by name, WFC ID, phone, email, region, district, clan, or status...',
      filterAll: 'All',
      filterActive: 'Active',
      filterInactivePending: 'Inactive/Pending',
      filterLeaders: 'Leaders',
      filterNew: 'New Members',
      filterPendingApproval: 'Pending Approval',
      exportPdf: 'PDF Export',
      exportExcel: 'Excel Export',
      printReport: 'Print Report',
      close: 'Close',
      save: 'Save Record',
      approve: 'Approve'
    }
  };

  // =========================================================================
  // 2. CRISP CUSTOM SVG ICON LIBRARY (No Generic Emoji Slop)
  // =========================================================================
  const ICONS = {
    dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>',
    members: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    history: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>',
    finance: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>',
    events: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    documents: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
    reports: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
    leadership: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
    approvals: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
    cases: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    assets: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>',
    projects: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>',
    messages: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    security: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="17" height="17"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
    chevronLeft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><polyline points="15 18 9 12 15 6"/></svg>',
    chevronRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><polyline points="9 18 15 12 9 6"/></svg>'
  };

  // =========================================================================
  // 3. APPLICATION STATE
  // =========================================================================
  const appState = {
    lang: localStorage.getItem('wfc_lang') || 'sw',
    viewMode: 'portal', // 'portal' | 'landing' | 'login' | 'tickets'
    activePage: 'dashboard',
    sidebarCollapsed: localStorage.getItem('wfc_sidebar_collapsed') === 'true',
    mobileMenuOpen: false,
    notifDropdownOpen: false,
    profileDropdownOpen: false,
    storageEngine: 'PostgreSQL (wfc_kv_store)',
    currentUser: null,
    data: null,
    searchQuery: '',
    memberFilter: 'All',
    selectedHistoryMemberId: 'all',
    activeReportTab: 'membership',
    docCategoryFilter: 'All',
    modal: null, // { type, payload, tab, step }
    toast: ''
  };

  function t(key) {
    return (I18N[appState.lang] && I18N[appState.lang][key]) || I18N.sw[key] || key;
  }

  function fmtTsh(val) {
    return 'TSh ' + Number(val || 0).toLocaleString('en-US');
  }

  function showToast(msg) {
    appState.toast = msg;
    render();
    setTimeout(() => {
      appState.toast = '';
      render();
    }, 3200);
  }

  function initials(name) {
    return String(name || 'WF')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(s => s[0].toUpperCase())
      .join('');
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // =========================================================================
  // 4. API & POSTGRESQL (wfc_kv_store) SYNC
  // =========================================================================
  async function loadServerState() {
    try {
      const res = await fetch('/api/state');
      const json = await res.json();
      if (json.ok && json.state) {
        appState.data = json.state;
        appState.storageEngine = json.storage || 'PostgreSQL (wfc_kv_store)';
        const savedUserId = localStorage.getItem('wfc_user_id') || 'mem-1';
        appState.currentUser =
          appState.data.members.find(m => m.id === savedUserId) || appState.data.members[0];
        render();
      }
    } catch (err) {
      console.error('State load error:', err);
    }
  }

  async function persistState(toastMsg) {
    try {
      const res = await fetch('/api/state', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: appState.data })
      });
      const json = await res.json();
      if (json.ok && json.state) {
        appState.data = json.state;
      }
      if (toastMsg) showToast(toastMsg);
      else render();
    } catch (err) {
      showToast('Hitilafu ya kuhifadhi: ' + err.message);
    }
  }

  // =========================================================================
  // 5. DETERMINISTIC QR CODE SVG GENERATOR (For Contribution Receipts & Tickets)
  // =========================================================================
  function generateQrSvg(seedText, size) {
    const dim = size || 110;
    const cells = 21;
    const cellSize = dim / cells;
    let hash = 2166136261;
    for (let i = 0; i < seedText.length; i++) {
      hash ^= seedText.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    let rects = '';
    const isFinder = (r, c) =>
      (r < 7 && c < 7) || (r < 7 && c >= cells - 7) || (r >= cells - 7 && c < 7);

    for (let r = 0; r < cells; r++) {
      for (let c = 0; c < cells; c++) {
        let filled = false;
        if (isFinder(r, c)) {
          const lr = r >= cells - 7 ? r - (cells - 7) : r;
          const lc = c >= cells - 7 ? c - (cells - 7) : c;
          filled =
            lr === 0 || lr === 6 || lc === 0 || lc === 6 || (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4);
        } else {
          const bit = ((hash >>> ((r * 7 + c * 13) % 24)) ^ (r * 31 + c * 17)) & 1;
          filled = bit === 1;
        }
        if (filled) {
          rects += `<rect x="${(c * cellSize).toFixed(2)}" y="${(r * cellSize).toFixed(2)}" width="${cellSize.toFixed(2)}" height="${cellSize.toFixed(2)}" fill="#181816"/>`;
        }
      }
    }
    return `<svg width="${dim}" height="${dim}" viewBox="0 0 ${dim} ${dim}" style="background:#FFF;border:1px solid #D6D1C6;padding:4px;border-radius:6px">${rects}</svg>`;
  }

  // =========================================================================
  // 6. ANALYTICAL CHARTS (Crisp SVG · Integer Ticks · Wrapped Labels)
  // =========================================================================
  function renderGrowthChart(members) {
    const points = [
      { label: '2025-10', val: 1 },
      { label: '2026-01', val: 1 },
      { label: '2026-04', val: 2 },
      { label: '2026-07', val: 4 },
      { label: '2026-11', val: members.length }
    ];
    const maxVal = Math.max(6, ...points.map(p => p.val));
    const w = 520, h = 210, padL = 36, padR = 24, padT = 20, padB = 34;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    let grid = '';
    for (let v = 0; v <= maxVal; v += Math.max(1, Math.ceil(maxVal / 5))) {
      const y = padT + plotH - (v / maxVal) * plotH;
      grid += `<line x1="${padL}" y1="${y}" x2="${w - padR}" y2="${y}" stroke="#EAE6DF" stroke-width="1"/>`;
      grid += `<text x="${padL - 8}" y="${y + 4}" text-anchor="end" font-size="11" fill="#78716C">${v}</text>`;
    }

    const coords = points.map((p, idx) => {
      const x = padL + (idx / (points.length - 1)) * plotW;
      const y = padT + plotH - (p.val / maxVal) * plotH;
      return { ...p, x, y };
    });

    const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
    const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${padT + plotH} L ${coords[0].x} ${padT + plotH} Z`;

    const dots = coords
      .map(
        c => `
        <circle cx="${c.x}" cy="${c.y}" r="4.5" fill="#C2410C" stroke="#FFFFFF" stroke-width="2"/>
        <text x="${c.x}" y="${c.y - 9}" text-anchor="middle" font-size="11" font-weight="700" fill="#181816">${c.val}</text>
        <text x="${c.x}" y="${h - 10}" text-anchor="middle" font-size="11" fill="#57534E">${c.label}</text>
      `
      )
      .join('');

    return `
      <svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto;display:block">
        <defs>
          <linearGradient id="wfcArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#C2410C" stop-opacity="0.22"/>
            <stop offset="100%" stop-color="#C2410C" stop-opacity="0.01"/>
          </linearGradient>
        </defs>
        ${grid}
        <path d="${areaPath}" fill="url(#wfcArea)"/>
        <path d="${linePath}" fill="none" stroke="#C2410C" stroke-width="2.5" stroke-linecap="round"/>
        ${dots}
      </svg>
    `;
  }

  function renderContributionChart(contributions) {
    const approved = contributions.filter(c => c.status === 'APPROVED');
    const octTotal = approved.filter(c => c.month === '2026-10').reduce((s, c) => s + Number(c.amount), 0);
    const novTotal = approved.filter(c => c.month === '2026-11').reduce((s, c) => s + Number(c.amount), 0);
    const bars = [
      { label: '2026-10', val: octTotal },
      { label: '2026-11', val: novTotal }
    ];
    const maxVal = Math.max(70000, ...bars.map(b => b.val));
    const w = 520, h = 210, padL = 58, padR = 24, padT = 20, padB = 34;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    let grid = '';
    for (let i = 0; i <= 4; i++) {
      const val = Math.round((maxVal / 4) * i);
      const y = padT + plotH - (val / maxVal) * plotH;
      grid += `<line x1="${padL}" y1="${y}" x2="${w - padR}" y2="${y}" stroke="#EAE6DF" stroke-width="1"/>`;
      grid += `<text x="${padL - 8}" y="${y + 4}" text-anchor="end" font-size="11" fill="#78716C">${val.toLocaleString()}</text>`;
    }

    const barWidth = 88;
    const barSvg = bars
      .map((b, idx) => {
        const cx = padL + ((idx + 0.5) / bars.length) * plotW;
        const bh = (b.val / maxVal) * plotH;
        const y = padT + plotH - bh;
        return `
          <rect x="${cx - barWidth / 2}" y="${y}" width="${barWidth}" height="${bh}" rx="6" fill="#15803D"/>
          <text x="${cx}" y="${y - 7}" text-anchor="middle" font-size="11" font-weight="700" fill="#181816">${b.val.toLocaleString()}</text>
          <text x="${cx}" y="${h - 10}" text-anchor="middle" font-size="11" fill="#57534E">${b.label}</text>
        `;
      })
      .join('');

    return `<svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto;display:block">${grid}${barSvg}</svg>`;
  }

  function renderRegionChart(members) {
    const counts = {};
    members.forEach(m => {
      const reg = m.currentRegion || 'Dar es Salaam';
      counts[reg] = (counts[reg] || 0) + 1;
    });
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const maxVal = Math.max(3, ...entries.map(e => e[1]));

    return entries
      .map(([reg, count]) => {
        const pct = Math.round((count / maxVal) * 100);
        return `
          <div style="margin-bottom:12px;">
            <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;">
              <span style="font-weight:600;color:var(--ink-primary);">${escapeHtml(reg)}</span>
              <span class="tabular-nums" style="font-weight:700;color:var(--ink-secondary);">${count}</span>
            </div>
            <div style="height:10px;background:var(--bg-subtle);border-radius:999px;overflow:hidden;">
              <div style="width:${pct}%;height:100%;background:#1D4ED8;border-radius:999px;"></div>
            </div>
          </div>
        `;
      })
      .join('');
  }

  function renderClanChart(members) {
    const counts = {};
    members.forEach(m => {
      const clan = m.ukoo || 'Haijawekwa';
      counts[clan] = (counts[clan] || 0) + 1;
    });
    const palette = ['#C2410C', '#15803D', '#1D4ED8', '#B45309', '#57534E'];
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const total = members.length || 1;
    const radius = 52;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;

    const segments = entries
      .map(([clan, count], idx) => {
        const len = (count / total) * circumference;
        const color = palette[idx % palette.length];
        const seg = `<circle cx="72" cy="72" r="${radius}" fill="none" stroke="${color}" stroke-width="20" stroke-dasharray="${len} ${circumference - len}" stroke-dashoffset="${-offset}"/>`;
        offset += len;
        return seg;
      })
      .join('');

    const legend = entries
      .map(([clan, count], idx) => {
        const color = palette[idx % palette.length];
        const pct = Math.round((count / total) * 100);
        return `
          <div style="display:flex;align-items:center;justify-content:space-between;font-size:12px;margin-bottom:5px;">
            <span style="display:inline-flex;align-items:center;gap:6px;">
              <span style="width:9px;height:9px;border-radius:50%;background:${color};display:inline-block;"></span>
              <strong>${escapeHtml(clan)}</strong>
            </span>
            <span class="tabular-nums" style="color:var(--ink-secondary);">${count} (${pct}%)</span>
          </div>
        `;
      })
      .join('');

    return `
      <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
        <svg width="144" height="144" viewBox="0 0 144 144" style="transform:rotate(-90deg);flex-shrink:0;">
          <circle cx="72" cy="72" r="${radius}" fill="none" stroke="#EAE6DF" stroke-width="20"/>
          ${segments}
        </svg>
        <div style="flex:1;min-width:130px;">${legend}</div>
      </div>
    `;
  }

  function renderAttendanceChart(events) {
    return events
      .map(ev => {
        const tickets = ev.ticketBuyers.reduce((s, b) => s + Number(b.qty), 0);
        const attended = ev.ticketBuyers.filter(b => b.checkedIn).reduce((s, b) => s + Number(b.qty), 0);
        const title = appState.lang === 'en' ? ev.titleEn : ev.title;
        return `
          <div style="padding:10px 12px;border:1px solid var(--border-hairline);border-radius:8px;margin-bottom:10px;background:var(--bg-canvas);">
            <div style="font-size:12px;font-weight:700;color:var(--ink-primary);margin-bottom:6px;line-height:1.35;">
              ${escapeHtml(title)}
            </div>
            <div style="display:flex;gap:14px;font-size:11px;color:var(--ink-secondary);">
              <span><strong style="color:#C2410C;">${tickets}</strong> ${appState.lang === 'en' ? 'Tickets Sold' : 'Tiketi'}</span>
              <span><strong style="color:#15803D;">${attended}</strong> ${appState.lang === 'en' ? 'Checked In' : 'Mahudhurio'}</span>
            </div>
          </div>
        `;
      })
      .join('');
  }

  // =========================================================================
  // 7. MODALS (3-STEP REGISTRATION · 6-TAB MEMBER DETAILS · CONTRIB/EVENT/RBAC DETAILS · QR RECEIPT)
  // =========================================================================
  function openMemberRegModal(isPublic) {
    const nextNum = (appState.data ? appState.data.members.length : 6) + 1;
    appState.modal = {
      type: 'registerMember',
      step: 1,
      isPublic: Boolean(isPublic),
      form: {
        fullName: '',
        gender: 'Me',
        dob: '1993-06-15',
        phone: '',
        email: '',
        occupation: '',
        currentRegion: 'Dar es Salaam',
        currentDistrict: 'Kinondoni',
        originRegion: 'Kilimanjaro',
        originDistrict: 'Moshi Vijijini',
        tarafa: '',
        kata: '',
        kijiji: '',
        ukoo: 'Swai',
        ukooMdogo: '',
        eneoLaAsili: '',
        fatherGrandfatherName: '',
        birthPlace: '',
        wfcId: `WFC-${String(nextNum).padStart(4, '0')}`,
        category: 'Mwanachama wa Kawaida',
        joinedDate: new Date().toISOString().slice(0, 10),
        expiryDate: '2027-11-18',
        status: isPublic ? 'Pending' : 'Active',
        photoUrl: ''
      }
    };
    render();
  }

  function openMemberDetailsModal(memberId, initialTab) {
    appState.modal = {
      type: 'memberDetails',
      memberId,
      tab: initialTab || 'profile'
    };
    render();
  }

  function openContributionDetailsModal(contribId) {
    appState.modal = {
      type: 'contributionDetails',
      contribId
    };
    render();
  }

  function openEventDetailsModal(eventId) {
    appState.modal = {
      type: 'eventDetails',
      eventId
    };
    render();
  }

  function openLeadershipDetailsModal(leaderId) {
    appState.modal = {
      type: 'leadershipDetails',
      leaderId
    };
    render();
  }

  function renderModal() {
    const m = appState.modal;
    if (!m) return '';
    const isEn = appState.lang === 'en';

    // A. 3-STEP MEMBER REGISTRATION MODAL (Requirement #4)
    if (m.type === 'registerMember') {
      const f = m.form;
      const stepLabels = isEn
        ? ['1. Personal Details', '2. Chagga Heritage & Origin', '3. Membership & Photo']
        : ['1. Taarifa Binafsi', '2. Asili ya Kichagga', '3. Uanachama & Picha'];

      let stepBody = '';
      if (m.step === 1) {
        stepBody = `
          <div class="form-grid">
            <div class="form-group"><label>${isEn ? 'Full Name *' : 'Jina Kamili *'}</label><input data-reg="fullName" value="${escapeHtml(f.fullName)}" placeholder="Mf. Emanuel Tarimo"/></div>
            <div class="form-group"><label>${isEn ? 'Gender' : 'Jinsia'}</label>
              <select data-reg="gender">
                <option value="Me" ${f.gender === 'Me' ? 'selected' : ''}>${isEn ? 'Male' : 'Mwanaume (Me)'}</option>
                <option value="Ke" ${f.gender === 'Ke' ? 'selected' : ''}>${isEn ? 'Female' : 'Mwanamke (Ke)'}</option>
              </select>
            </div>
            <div class="form-group"><label>${isEn ? 'Date of Birth' : 'Tarehe ya Kuzaliwa'}</label><input type="date" data-reg="dob" value="${escapeHtml(f.dob)}"/></div>
            <div class="form-group"><label>${isEn ? 'Phone Number *' : 'Namba ya Simu *'}</label><input data-reg="phone" value="${escapeHtml(f.phone)}" placeholder="+255 7XX XXX XXX"/></div>
            <div class="form-group"><label>${isEn ? 'Email Address' : 'Barua Pepe'}</label><input type="email" data-reg="email" value="${escapeHtml(f.email)}" placeholder="jina@mfano.co.tz"/></div>
            <div class="form-group"><label>${isEn ? 'Occupation' : 'Kazi / Taaluma'}</label><input data-reg="occupation" value="${escapeHtml(f.occupation)}" placeholder="Mf. Mfanyabiashara / Mhandisi"/></div>
            <div class="form-group"><label>${isEn ? 'Current Region' : 'Mkoa Unaoishi Sasa'}</label><input data-reg="currentRegion" value="${escapeHtml(f.currentRegion)}"/></div>
            <div class="form-group"><label>${isEn ? 'Current District' : 'Wilaya Unayoishi Sasa'}</label><input data-reg="currentDistrict" value="${escapeHtml(f.currentDistrict)}"/></div>
          </div>
        `;
      } else if (m.step === 2) {
        stepBody = `
          <div class="form-grid-3">
            <div class="form-group"><label>${isEn ? 'Origin Region (Mkoa)' : 'Mkoa wa Asili'}</label><input data-reg="originRegion" value="${escapeHtml(f.originRegion)}"/></div>
            <div class="form-group"><label>${isEn ? 'Origin District (Wilaya)' : 'Wilaya ya Asili'}</label>
              <select data-reg="originDistrict">
                ${['Moshi Vijijini', 'Moshi Mjini', 'Hai', 'Siha', 'Rombo', 'Mwanga', 'Same'].map(d => `<option value="${d}" ${f.originDistrict === d ? 'selected' : ''}>${d}</option>`).join('')}
              </select>
            </div>
            <div class="form-group"><label>${isEn ? 'Division (Tarafa)' : 'Tarafa'}</label><input data-reg="tarafa" value="${escapeHtml(f.tarafa)}" placeholder="Mf. Vunjo / Machame / Kibosho"/></div>
            <div class="form-group"><label>${isEn ? 'Ward (Kata)' : 'Kata'}</label><input data-reg="kata" value="${escapeHtml(f.kata)}" placeholder="Mf. Marangu Mashariki"/></div>
            <div class="form-group"><label>${isEn ? 'Village (Kijiji)' : 'Kijiji'}</label><input data-reg="kijiji" value="${escapeHtml(f.kijiji)}" placeholder="Mf. Sembeti"/></div>
            <div class="form-group"><label>${isEn ? 'Clan (Ukoo) *' : 'Ukoo *'}</label><input data-reg="ukoo" value="${escapeHtml(f.ukoo)}" placeholder="Mf. Swai, Mushi, Kimaro, Lyimo"/></div>
            <div class="form-group"><label>${isEn ? 'Sub-Clan (Ukoo Mdogo)' : 'Ukoo Mdogo'}</label><input data-reg="ukooMdogo" value="${escapeHtml(f.ukooMdogo)}" placeholder="Mf. Swai wa Nronga"/></div>
            <div class="form-group"><label>${isEn ? 'Ancestral Homestead (Eneo la Asili)' : 'Eneo la Asili (Kihamba)'}</label><input data-reg="eneoLaAsili" value="${escapeHtml(f.eneoLaAsili)}" placeholder="Mf. Kihamba cha Kati"/></div>
            <div class="form-group"><label>${isEn ? 'Place of Birth' : 'Mahali Alipozaliwa'}</label><input data-reg="birthPlace" value="${escapeHtml(f.birthPlace)}" placeholder="Mf. KCMC, Moshi"/></div>
            <div class="form-group full"><label>${isEn ? "Father's & Grandfather's Full Name" : 'Jina la Baba na Babu'}</label><input data-reg="fatherGrandfatherName" value="${escapeHtml(f.fatherGrandfatherName)}" placeholder="Mf. Mzee Leonard Tarimo / Yohana Tarimo"/></div>
          </div>
        `;
      } else {
        stepBody = `
          <div class="form-grid">
            <div class="form-group"><label>${isEn ? 'Auto-Generated WFC ID' : 'Namba ya WFC (Moja kwa Moja)'}</label><input class="mono" data-reg="wfcId" value="${escapeHtml(f.wfcId)}" readonly style="background:var(--bg-subtle);font-weight:700;"/></div>
            <div class="form-group"><label>${isEn ? 'Membership Category' : 'Kategoria ya Uanachama'}</label>
              <select data-reg="category">
                ${['Mwanachama wa Kawaida', 'Mwanachama Mwanzilishi', 'Mwanachama Mwanafunzi', 'Mwanachama wa Heshima', 'Kiongozi'].map(c => `<option value="${c}" ${f.category === c ? 'selected' : ''}>${c}</option>`).join('')}
              </select>
            </div>
            <div class="form-group"><label>${isEn ? 'Registration Date' : 'Tarehe ya Usajili'}</label><input type="date" data-reg="joinedDate" value="${escapeHtml(f.joinedDate)}"/></div>
            <div class="form-group"><label>${isEn ? 'Membership Expiry Date' : 'Tarehe ya Mwisho wa Ada'}</label><input type="date" data-reg="expiryDate" value="${escapeHtml(f.expiryDate)}"/></div>
            <div class="form-group full">
              <label>${isEn ? 'Upload Passport Photo' : 'Pakia Picha ya Mwanachama'}</label>
              <input type="file" id="regPhotoInput" accept="image/*"/>
              ${f.photoUrl ? `<img src="${f.photoUrl}" alt="Preview" style="width:68px;height:68px;border-radius:8px;object-fit:cover;margin-top:8px;border:1px solid var(--border-strong);"/>` : ''}
            </div>
          </div>
        `;
      }

      return `
        <div class="modal-backdrop" data-close-modal="true">
          <div class="modal-card" onclick="event.stopPropagation()">
            <div class="modal-header">
              <div>
                <strong style="font-size:15px;">${isEn ? 'WFC Member Registration Form (3-Stage)' : 'Fomu ya Usajili wa Mwanachama wa WFC (Sehemu 3)'}</strong>
                <div style="font-size:12px;color:var(--ink-muted);">${isEn ? 'Complete personal, Chagga heritage, and membership details' : 'Jaza taarifa binafsi, asili ya Kichagga, na uanachama'}</div>
              </div>
              <button class="btn btn-sm" data-action="closeModal">${t('close')}</button>
            </div>
            <div class="modal-body">
              <div class="step-indicator">
                ${stepLabels.map((lbl, idx) => `<div class="step-box ${m.step === idx + 1 ? 'active' : m.step > idx + 1 ? 'done' : ''}">${lbl}</div>`).join('')}
              </div>
              ${stepBody}
            </div>
            <div class="modal-footer">
              ${m.step > 1 ? `<button class="btn" data-action="regPrevStep">${isEn ? '← Previous' : '← Nyuma'}</button>` : ''}
              ${m.step < 3
                ? `<button class="btn btn-primary" data-action="regNextStep">${isEn ? 'Next Step →' : 'Hatua Inayofuata →'}</button>`
                : `<button class="btn btn-primary" data-action="submitMemberReg">${isEn ? 'Complete Registration' : 'Kamilisha Usajili'}</button>`}
            </div>
          </div>
        </div>
      `;
    }

    // B. 6-TAB MEMBER VIEW DETAILS MODAL (Requirement #5)
    if (m.type === 'memberDetails') {
      const member = appState.data.members.find(x => x.id === m.memberId);
      if (!member) return '';
      const tabs = isEn
        ? [
            ['profile', 'Complete Profile'],
            ['membership', 'Registration & Membership History'],
            ['contributions', 'Contributions History'],
            ['attendance', 'Attendance History'],
            ['documents', 'Uploaded Documents'],
            ['notifications', 'Notifications History']
          ]
        : [
            ['profile', 'Wasifu Kamili'],
            ['membership', 'Historia ya Usajili & Uanachama'],
            ['contributions', 'Historia ya Michango'],
            ['attendance', 'Historia ya Mahudhurio'],
            ['documents', 'Nyaraka Zilizopakiwa'],
            ['notifications', 'Historia ya Taarifa']
          ];

      let tabContent = '';
      if (m.tab === 'profile') {
        tabContent = `
          <div style="display:flex;gap:14px;align-items:center;padding-bottom:14px;border-bottom:1px solid var(--border-hairline);margin-bottom:14px;">
            <div class="avatar-circle" style="width:52px;height:52px;font-size:16px;">
              ${member.photoUrl ? `<img src="${member.photoUrl}" alt=""/>` : initials(member.fullName)}
            </div>
            <div>
              <div style="font-size:16px;font-weight:700;">${escapeHtml(member.fullName)} <span class="mono badge badge-neutral">${escapeHtml(member.wfcId)}</span></div>
              <div style="font-size:12px;color:var(--ink-secondary);">${escapeHtml(member.occupation)} · ${escapeHtml(member.phone)} · ${escapeHtml(member.email)}</div>
            </div>
          </div>
          <div class="form-grid-3" style="font-size:12px;">
            <div><strong>${isEn ? 'Clan (Ukoo)' : 'Ukoo'}:</strong><div>${escapeHtml(member.ukoo)} (${escapeHtml(member.ukooMdogo || '-')})</div></div>
            <div><strong>${isEn ? 'Origin Region / District' : 'Mkoa / Wilaya ya Asili'}:</strong><div>${escapeHtml(member.originRegion)} / ${escapeHtml(member.originDistrict)}</div></div>
            <div><strong>${isEn ? 'Division / Ward / Village' : 'Tarafa / Kata / Kijiji'}:</strong><div>${escapeHtml(member.tarafa || '-')} / ${escapeHtml(member.kata || '-')} / ${escapeHtml(member.kijiji || '-')}</div></div>
            <div><strong>${isEn ? 'Ancestral Homestead' : 'Eneo la Asili'}:</strong><div>${escapeHtml(member.eneoLaAsili || '-')}</div></div>
            <div><strong>${isEn ? 'Father / Grandfather' : 'Jina la Baba / Babu'}:</strong><div>${escapeHtml(member.fatherGrandfatherName || '-')}</div></div>
            <div><strong>${isEn ? 'Place of Birth' : 'Mahali Alipozaliwa'}:</strong><div>${escapeHtml(member.birthPlace || '-')}</div></div>
          </div>
        `;
      } else if (m.tab === 'membership') {
        const logs = appState.data.history.filter(h => h.memberId === member.id);
        tabContent = `
          <div class="card" style="background:var(--bg-canvas);margin-bottom:12px;">
            <div><strong>${isEn ? 'Category' : 'Kategoria'}:</strong> ${escapeHtml(member.category)} · <strong>Status:</strong> ${escapeHtml(member.status)}</div>
            <div style="font-size:12px;color:var(--ink-secondary);margin-top:4px;">${isEn ? 'Registered' : 'Tarehe ya Usajili'}: <strong>${member.joinedDate}</strong> · ${isEn ? 'Valid Until' : 'Mwisho wa Ada'}: <strong>${member.expiryDate}</strong></div>
          </div>
          ${logs.map(l => `<div style="padding:8px 0;border-bottom:1px solid var(--border-hairline);font-size:12px;"><span class="badge badge-neutral">${escapeHtml(l.category)}</span> <strong>${escapeHtml(isEn ? l.titleEn : l.titleSw)}</strong> <span style="color:var(--ink-muted);">(${l.date})</span></div>`).join('') || '<p>Hakuna rekodi za ziada.</p>'}
        `;
      } else if (m.tab === 'contributions') {
        const list = appState.data.contributions.filter(c => c.memberId === member.id || c.wfcId === member.wfcId);
        tabContent = list.length
          ? `<table class="wfc-table"><thead><tr><th>Risiti</th><th>Aina</th><th>Kiasi</th><th>Hali</th></tr></thead><tbody>${list.map(c => `<tr><td class="mono">${escapeHtml(c.reference)}</td><td>${escapeHtml(c.type)}</td><td class="tabular-nums"><strong>${fmtTsh(c.amount)}</strong></td><td><span class="badge ${c.status === 'APPROVED' ? 'badge-success' : 'badge-warning'}">${c.status}</span></td></tr>`).join('')}</tbody></table>`
          : `<p style="color:var(--ink-muted);">${isEn ? 'No contributions recorded yet.' : 'Hakuna michango iliyorekodiwa bado.'}</p>`;
      } else if (m.tab === 'attendance') {
        const attendedEvents = appState.data.events.filter(ev =>
          ev.ticketBuyers.some(b => b.wfcId === member.wfcId || b.name.toLowerCase() === member.fullName.toLowerCase())
        );
        tabContent = attendedEvents.length
          ? attendedEvents.map(ev => `<div style="padding:10px;border:1px solid var(--border-hairline);border-radius:8px;margin-bottom:8px;"><strong>${escapeHtml(isEn ? ev.titleEn : ev.title)}</strong> — ${escapeHtml(ev.venue)} (${ev.date})</div>`).join('')
          : `<p style="color:var(--ink-muted);">${isEn ? 'No event tickets or attendance records yet.' : 'Hakuna rekodi za tiketi au mahudhurio bado.'}</p>`;
      } else if (m.tab === 'documents') {
        const docs = appState.data.documents.filter(d => d.memberId === member.id || d.wfcId === member.wfcId);
        tabContent = docs.length
          ? docs.map(d => `<div style="display:flex;justify-content:space-between;align-items:center;padding:9px;border:1px solid var(--border-hairline);border-radius:8px;margin-bottom:8px;"><div><strong>${escapeHtml(d.docType)}</strong><div style="font-size:11px;color:var(--ink-muted);">${escapeHtml(d.fileName)} · ${d.uploadedAt}</div></div><button class="btn btn-sm" data-action="downloadDoc" data-id="${d.id}">Download</button></div>`).join('')
          : `<p style="color:var(--ink-muted);">${isEn ? 'No documents uploaded for this member.' : 'Hakuna nyaraka zilizopakiwa kwa mwanachama huyu.'}</p>`;
      } else if (m.tab === 'notifications') {
        const ntfs = appState.data.notifications.filter(n => n.memberId === member.id);
        tabContent = ntfs.length
          ? ntfs.map(n => `<div style="padding:9px;border-bottom:1px solid var(--border-hairline);"><div style="font-weight:600;">${escapeHtml(isEn ? n.titleEn : n.titleSw)}</div><div style="font-size:12px;color:var(--ink-secondary);">${escapeHtml(isEn ? n.bodyEn : n.bodySw)}</div></div>`).join('')
          : `<p style="color:var(--ink-muted);">${isEn ? 'No direct notifications logged.' : 'Hakuna taarifa maalum zilizotumwa.'}</p>`;
      }

      return `
        <div class="modal-backdrop" data-close-modal="true">
          <div class="modal-card" onclick="event.stopPropagation()">
            <div class="modal-header">
              <strong>${escapeHtml(member.fullName)} · ${t('viewDetails')}</strong>
              <button class="btn btn-sm" data-action="closeModal">${t('close')}</button>
            </div>
            <div class="modal-body">
              <div class="tabs-bar">
                ${tabs.map(([key, label]) => `<button class="tab-btn ${m.tab === key ? 'active' : ''}" data-action="memberDetailTab" data-tab="${key}">${label}</button>`).join('')}
              </div>
              ${tabContent}
            </div>
          </div>
        </div>
      `;
    }

    // C. CONTRIBUTION VIEW DETAILS + QR/PDF RECEIPT (Requirement #5)
    if (m.type === 'contributionDetails') {
      const c = appState.data.contributions.find(x => x.id === m.contribId);
      if (!c) return '';
      const mem = appState.data.members.find(x => x.id === c.memberId || x.wfcId === c.wfcId);
      const memberContribs = appState.data.contributions.filter(x => x.wfcId === c.wfcId);
      const remainingDebt = mem ? Number(mem.annualFeeDue || 0) : 0;

      return `
        <div class="modal-backdrop" data-close-modal="true">
          <div class="modal-card" onclick="event.stopPropagation()">
            <div class="modal-header">
              <strong>${isEn ? 'Contribution Details & Official QR Receipt' : 'Maelezo ya Mchango & Risiti Rasmi ya QR'}</strong>
              <div style="display:flex;gap:8px;">
                <button class="btn btn-sm btn-primary" onclick="window.print()">${isEn ? 'Print / Save PDF Receipt' : 'Chapisha / Hifadhi PDF'}</button>
                <button class="btn btn-sm" data-action="closeModal">${t('close')}</button>
              </div>
            </div>
            <div class="modal-body">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;padding:16px;border:1px solid var(--border-strong);border-radius:10px;background:var(--bg-canvas);margin-bottom:16px;">
                <div>
                  <div class="mono" style="font-size:12px;color:var(--accent-primary);font-weight:700;">${escapeHtml(c.receiptNo)} · REF: ${escapeHtml(c.reference)}</div>
                  <h3 style="margin:4px 0 6px;font-size:18px;">${escapeHtml(c.memberName)} (${escapeHtml(c.wfcId)})</h3>
                  <div style="font-size:13px;">${isEn ? 'Category' : 'Aina ya Mchango'}: <strong>${escapeHtml(isEn ? c.typeEn : c.type)}</strong> (${escapeHtml(c.method)})</div>
                  <div style="font-size:13px;">${isEn ? 'Date' : 'Tarehe'}: <strong>${c.date}</strong> · Status: <span class="badge ${c.status === 'APPROVED' ? 'badge-success' : 'badge-warning'}">${c.status}</span></div>
                  <div style="margin-top:10px;font-size:20px;font-weight:700;" class="tabular-nums">${fmtTsh(c.amount)}</div>
                  <div style="margin-top:4px;font-size:12px;color:var(--danger-ink);font-weight:600;" class="tabular-nums">
                    ${isEn ? 'Remaining Annual Fee Balance' : 'Deni la Ada Lililobaki'}: ${fmtTsh(remainingDebt)}
                  </div>
                </div>
                <div style="text-align:center;">
                  ${generateQrSvg(`${c.receiptNo}|${c.wfcId}|${c.amount}|${c.status}`, 108)}
                  <div style="font-size:10px;color:var(--ink-muted);margin-top:4px;">WFC VERIFIED QR</div>
                </div>
              </div>
              <h4 style="margin:0 0 8px;font-size:13px;">${isEn ? 'Member Contribution History' : 'Historia ya Michango ya Mwanachama Huyu'}</h4>
              <table class="wfc-table">
                <thead><tr><th>Reference</th><th>${isEn ? 'Type' : 'Aina'}</th><th>${isEn ? 'Date' : 'Tarehe'}</th><th>${isEn ? 'Amount' : 'Kiasi'}</th><th>Status</th></tr></thead>
                <tbody>
                  ${memberContribs.map(mc => `<tr><td class="mono">${escapeHtml(mc.reference)}</td><td>${escapeHtml(isEn ? mc.typeEn : mc.type)}</td><td>${mc.date}</td><td class="tabular-nums"><strong>${fmtTsh(mc.amount)}</strong></td><td><span class="badge ${mc.status === 'APPROVED' ? 'badge-success' : 'badge-warning'}">${mc.status}</span></td></tr>`).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    }

    // D. EVENT VIEW DETAILS (Requirement #5)
    if (m.type === 'eventDetails') {
      const ev = appState.data.events.find(x => x.id === m.eventId);
      if (!ev) return '';
      const totalTickets = ev.ticketBuyers.reduce((s, b) => s + Number(b.qty), 0);
      const totalCheckedIn = ev.ticketBuyers.filter(b => b.checkedIn).reduce((s, b) => s + Number(b.qty), 0);
      const totalRevenue = ev.ticketBuyers.reduce((s, b) => s + Number(b.amount), 0);

      return `
        <div class="modal-backdrop" data-close-modal="true">
          <div class="modal-card" onclick="event.stopPropagation()">
            <div class="modal-header">
              <strong>${escapeHtml(isEn ? ev.titleEn : ev.title)}</strong>
              <button class="btn btn-sm" data-action="closeModal">${t('close')}</button>
            </div>
            <div class="modal-body">
              <p style="margin-top:0;color:var(--ink-secondary);">${escapeHtml(isEn ? ev.descriptionEn : ev.description)}</p>
              <div class="form-grid-3" style="margin-bottom:16px;">
                <div class="card" style="background:var(--bg-canvas);"><div class="kpi-label">${isEn ? 'Tickets Sold' : 'Tiketi Zilizouzwa'}</div><div class="kpi-value tabular-nums">${totalTickets} / ${ev.capacity}</div></div>
                <div class="card" style="background:var(--bg-canvas);"><div class="kpi-label">${isEn ? 'Checked-In Attendance' : 'Mahudhurio Halisi'}</div><div class="kpi-value tabular-nums">${totalCheckedIn}</div></div>
                <div class="card" style="background:var(--bg-canvas);"><div class="kpi-label">${isEn ? 'Ticket Revenue' : 'Mapato ya Tiketi'}</div><div class="kpi-value tabular-nums">${fmtTsh(totalRevenue)}</div></div>
              </div>
              <h4 style="margin:0 0 8px;font-size:13px;">${isEn ? 'Ticket Buyers & Attendance' : 'Wanunuzi wa Tiketi & Mahudhurio'}</h4>
              <table class="wfc-table">
                <thead><tr><th>Ticket ID</th><th>${isEn ? 'Buyer' : 'Mnunuzi'}</th><th>Qty</th><th>${isEn ? 'Paid' : 'Malipo'}</th><th>${isEn ? 'Attendance' : 'Mahudhurio'}</th></tr></thead>
                <tbody>
                  ${ev.ticketBuyers.map((b, idx) => `
                    <tr>
                      <td class="mono">${escapeHtml(b.ticketCode)}</td>
                      <td><strong>${escapeHtml(b.name)}</strong> (${escapeHtml(b.wfcId)})</td>
                      <td class="tabular-nums">${b.qty}</td>
                      <td class="tabular-nums">${fmtTsh(b.amount)}</td>
                      <td>
                        <button class="btn btn-sm ${b.checkedIn ? 'btn-success' : ''}" data-action="toggleCheckIn" data-event-id="${ev.id}" data-buyer-idx="${idx}">
                          ${b.checkedIn ? (isEn ? 'Checked In' : 'Amehudhuria') : (isEn ? 'Mark Present' : 'Thibitisha Kuhudhuria')}
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    }

    // E. LEADERSHIP RBAC VIEW DETAILS (Requirement #5)
    if (m.type === 'leadershipDetails') {
      const ldr = appState.data.leadership.find(x => x.id === m.leaderId);
      if (!ldr) return '';
      const roles = isEn ? ldr.responsibilitiesEn : ldr.responsibilities;
      return `
        <div class="modal-backdrop" data-close-modal="true">
          <div class="modal-card" onclick="event.stopPropagation()">
            <div class="modal-header">
              <strong>${escapeHtml(ldr.name)} · ${escapeHtml(isEn ? ldr.currentPositionEn : ldr.currentPosition)}</strong>
              <button class="btn btn-sm" data-action="closeModal">${t('close')}</button>
            </div>
            <div class="modal-body">
              <div class="card" style="background:var(--bg-canvas);margin-bottom:14px;">
                <div><strong>${isEn ? 'Current Position' : 'Nafasi ya Sasa'}:</strong> ${escapeHtml(isEn ? ldr.currentPositionEn : ldr.currentPosition)} <span class="badge badge-info mono">${escapeHtml(ldr.rbacRole)}</span></div>
                <div style="margin-top:4px;"><strong>${isEn ? 'Service Tenure' : 'Kipindi cha Utumishi'}:</strong> ${escapeHtml(ldr.tenure)}</div>
              </div>
              <h4 style="margin:0 0 8px;font-size:13px;">${isEn ? 'Core Responsibilities' : 'Majukumu Makuu'}</h4>
              <ul style="margin:0 0 16px;padding-left:18px;">
                ${roles.map(r => `<li style="margin-bottom:5px;">${escapeHtml(r)}</li>`).join('')}
              </ul>
              <h4 style="margin:0 0 8px;font-size:13px;">${isEn ? 'Previous Positions Held' : 'Historia ya Nafasi Alizowahi Kushika'}</h4>
              ${ldr.previousRoles.map(pr => `<div style="padding:8px 10px;border:1px solid var(--border-hairline);border-radius:7px;margin-bottom:6px;"><strong>${escapeHtml(pr.title)}</strong> — <span style="color:var(--ink-muted);">${escapeHtml(pr.period)}</span></div>`).join('')}
            </div>
          </div>
        </div>
      `;
    }

    return '';
  }

  // =========================================================================
  // 8. PORTAL PAGES (DASHBOARD, MEMBERS, HISTORY, FINANCE, EVENTS, DOCS, REPORTS, RBAC, ETC.)
  // =========================================================================
  function renderDashboardPage() {
    const d = appState.data;
    const isEn = appState.lang === 'en';
    const totalMembers = d.members.length;
    const activeMembers = d.members.filter(m => m.status === 'Active').length;
    const newThisMonth = d.members.filter(m => m.isNewThisMonth).length;
    const totalContributions = d.contributions
      .filter(c => c.status === 'APPROVED')
      .reduce((s, c) => s + Number(c.amount), 0);
    const upcomingEvents = d.events.length;
    const pendingApprovals =
      d.members.filter(m => m.status === 'Pending').length +
      d.contributions.filter(c => c.status === 'PENDING').length;
    const unreadNotifs = d.notifications.filter(n => !n.read).length;

    return `
      <!-- 7 Primary KPI Cards (Requirement #9) -->
      <div class="kpi-grid-7">
        <div class="kpi-card">
          <div class="kpi-label">${t('kpiTotalMembers')}</div>
          <div class="kpi-value tabular-nums">${totalMembers}</div>
          <div class="kpi-sub">${t('kpiTotalMembersSub')}</div>
        </div>
        <div class="kpi-card success">
          <div class="kpi-label">${t('kpiActiveMembers')}</div>
          <div class="kpi-value tabular-nums">${activeMembers}</div>
          <div class="kpi-sub">${t('kpiActiveMembersSub')}</div>
        </div>
        <div class="kpi-card info">
          <div class="kpi-label">${t('kpiNewMonth')}</div>
          <div class="kpi-value tabular-nums">${newThisMonth}</div>
          <div class="kpi-sub">${t('kpiNewMonthSub')}</div>
        </div>
        <div class="kpi-card success">
          <div class="kpi-label">${t('kpiTotalContrib')}</div>
          <div class="kpi-value tabular-nums">${fmtTsh(totalContributions)}</div>
          <div class="kpi-sub">${t('kpiTotalContribSub')}</div>
        </div>
        <div class="kpi-card accent">
          <div class="kpi-label">${t('kpiUpcomingEvents')}</div>
          <div class="kpi-value tabular-nums">${upcomingEvents}</div>
          <div class="kpi-sub">${t('kpiUpcomingEventsSub')}</div>
        </div>
        <div class="kpi-card warning">
          <div class="kpi-label">${t('kpiPendingApprovals')}</div>
          <div class="kpi-value tabular-nums">${pendingApprovals}</div>
          <div class="kpi-sub">${t('kpiPendingApprovalsSub')}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">${t('kpiNotifSummary')}</div>
          <div class="kpi-value tabular-nums">${unreadNotifs} / ${d.notifications.length}</div>
          <div class="kpi-sub">${t('kpiNotifSummarySub')}</div>
        </div>
        <div class="kpi-card accent" style="display:flex;flex-direction:column;justify-content:space-between;">
          <div class="kpi-label">${isEn ? 'Quick Action' : 'Hatua ya Haraka'}</div>
          <button class="btn btn-primary btn-sm" data-action="openRegModal">${t('registerMemberBtn')}</button>
          <div class="kpi-sub">PostgreSQL: <span class="mono">wfc_kv_store</span></div>
        </div>
      </div>

      <!-- Financial Summary Strip -->
      <div class="finance-strip">
        <div class="kpi-card success">
          <div class="kpi-label">${t('finIncome')}</div>
          <div class="kpi-value tabular-nums" style="font-size:19px;">${fmtTsh(d.accounting.totalIncome)}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">${t('finExpense')}</div>
          <div class="kpi-value tabular-nums" style="font-size:19px;">${fmtTsh(d.accounting.totalExpense)}</div>
        </div>
        <div class="kpi-card info">
          <div class="kpi-label">${t('finBalance')}</div>
          <div class="kpi-value tabular-nums" style="font-size:19px;">${fmtTsh(d.accounting.balance)}</div>
        </div>
        <div class="kpi-card warning">
          <div class="kpi-label">${t('finArrears')}</div>
          <div class="kpi-value tabular-nums" style="font-size:19px;">${fmtTsh(d.accounting.feeArrearsTotal)}</div>
        </div>
      </div>

      <!-- Top 2 Analytical Charts -->
      <div class="charts-grid-2">
        <div class="card">
          <div class="card-header"><h3 class="card-title">${ICONS.history} ${t('chartGrowth')}</h3></div>
          ${renderGrowthChart(d.members)}
        </div>
        <div class="card">
          <div class="card-header"><h3 class="card-title">${ICONS.finance} ${t('chartContrib')}</h3></div>
          ${renderContributionChart(d.contributions)}
        </div>
      </div>

      <!-- Bottom 3 Analytical Charts -->
      <div class="charts-grid-3">
        <div class="card">
          <div class="card-header"><h3 class="card-title">${ICONS.members} ${t('chartRegion')}</h3></div>
          ${renderRegionChart(d.members)}
        </div>
        <div class="card">
          <div class="card-header"><h3 class="card-title">${ICONS.assets} ${t('chartClan')}</h3></div>
          ${renderClanChart(d.members)}
        </div>
        <div class="card">
          <div class="card-header"><h3 class="card-title">${ICONS.events} ${t('chartAttendance')}</h3></div>
          ${renderAttendanceChart(d.events)}
        </div>
      </div>

      <!-- Recent Contributions & Upcoming Events -->
      <div class="charts-grid-2">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">${t('recentContrib')}</h3>
            <button class="btn btn-sm" data-nav="contributions">${isEn ? 'View All →' : 'Yote →'}</button>
          </div>
          ${d.contributions
            .slice(0, 4)
            .map(
              c => `
              <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border-hairline);">
                <div>
                  <div style="font-weight:700;">${escapeHtml(c.memberName)}</div>
                  <div style="font-size:11px;color:var(--ink-muted);">${escapeHtml(isEn ? c.typeEn : c.type)} · <span class="mono">${escapeHtml(c.reference)}</span></div>
                </div>
                <div style="text-align:right;">
                  <div class="tabular-nums" style="font-weight:700;">${fmtTsh(c.amount)}</div>
                  <span class="badge ${c.status === 'APPROVED' ? 'badge-success' : 'badge-warning'}">${c.status}</span>
                </div>
              </div>
            `
            )
            .join('')}
        </div>

        <div class="card">
          <div class="card-header">
            <h3 class="card-title">${t('upcomingEventsCard')}</h3>
            <button class="btn btn-sm" data-nav="events">${isEn ? 'All Events →' : 'Matukio →'}</button>
          </div>
          ${d.events
            .map(
              ev => `
              <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px;border:1px solid var(--border-hairline);border-radius:8px;margin-bottom:10px;background:var(--bg-canvas);">
                <div>
                  <div style="font-weight:700;">${escapeHtml(isEn ? ev.titleEn : ev.title)}</div>
                  <div style="font-size:12px;color:var(--ink-secondary);">${escapeHtml(isEn ? ev.categoryEn : ev.category)} · ${escapeHtml(ev.venue)} (${ev.date})</div>
                </div>
                <button class="btn btn-sm" data-action="viewEvent" data-id="${ev.id}">${t('viewDetails')}</button>
              </div>
            `
            )
            .join('')}
        </div>
      </div>
    `;
  }

  function renderMembersPage() {
    const isEn = appState.lang === 'en';
    const q = appState.searchQuery.trim().toLowerCase();
    const f = appState.memberFilter;

    const filtered = appState.data.members.filter(m => {
      if (f === 'Active' && m.status !== 'Active') return false;
      if (f === 'Inactive/Pending' && m.status === 'Active') return false;
      if (f === 'Leaders' && !m.isLeader) return false;
      if (f === 'New Members' && !m.isNewThisMonth) return false;
      if (f === 'Pending Approval' && m.status !== 'Pending') return false;

      if (!q) return true;
      const hay = [
        m.fullName,
        m.wfcId,
        m.phone,
        m.email,
        m.currentRegion,
        m.originRegion,
        m.originDistrict,
        m.ukoo,
        m.status
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });

    const filters = [
      ['All', t('filterAll')],
      ['Active', t('filterActive')],
      ['Inactive/Pending', t('filterInactivePending')],
      ['Leaders', t('filterLeaders')],
      ['New Members', t('filterNew')],
      ['Pending Approval', t('filterPendingApproval')]
    ];

    return `
      <div class="card">
        <div class="toolbar-row">
          <div class="search-input-wrap">
            ${ICONS.search}
            <input id="memberSearchInput" value="${escapeHtml(appState.searchQuery)}" placeholder="${t('searchPlaceholder')}" />
          </div>
          <button class="btn btn-primary" data-action="openRegModal">${t('registerMemberBtn')}</button>
        </div>

        <div class="filter-pills" style="margin-bottom:16px;">
          ${filters.map(([key, label]) => `<button class="filter-pill ${f === key ? 'active' : ''}" data-action="setMemberFilter" data-filter="${key}">${label}</button>`).join('')}
        </div>

        <div class="table-wrap">
          <table class="wfc-table">
            <thead>
              <tr>
                <th>WFC ID</th>
                <th>${isEn ? 'Member Name' : 'Jina la Mwanachama'}</th>
                <th>${isEn ? 'Clan (Ukoo)' : 'Ukoo'}</th>
                <th>${isEn ? 'Origin District' : 'Wilaya ya Asili'}</th>
                <th>${isEn ? 'Current Region' : 'Mkoa Anaoishi'}</th>
                <th>Status</th>
                <th>${isEn ? 'Actions' : 'Hatua'}</th>
              </tr>
            </thead>
            <tbody>
              ${filtered
                .map(
                  m => `
                  <tr>
                    <td class="mono" style="font-weight:600;">${escapeHtml(m.wfcId)}</td>
                    <td>
                      <div style="font-weight:700;">${escapeHtml(m.fullName)}</div>
                      <div style="font-size:11px;color:var(--ink-muted);">${escapeHtml(m.phone)} · ${escapeHtml(isEn ? m.roleTitleEn : m.roleTitle)}</div>
                    </td>
                    <td><strong>${escapeHtml(m.ukoo)}</strong></td>
                    <td>${escapeHtml(m.originDistrict)}</td>
                    <td>${escapeHtml(m.currentRegion)}</td>
                    <td><span class="badge ${m.status === 'Active' ? 'badge-success' : 'badge-warning'}">${escapeHtml(m.status)}</span></td>
                    <td>
                      <div style="display:flex;gap:6px;">
                        <button class="btn btn-sm" data-action="viewMember" data-id="${m.id}">${t('viewDetails')}</button>
                        ${m.status === 'Pending' ? `<button class="btn btn-sm btn-success" data-action="approveMember" data-id="${m.id}">${t('approve')}</button>` : ''}
                      </div>
                    </td>
                  </tr>
                `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderMemberHistoryPage() {
    const isEn = appState.lang === 'en';
    const sel = appState.selectedHistoryMemberId;
    const logs = appState.data.history.filter(h => sel === 'all' || h.memberId === sel);

    return `
      <div class="card">
        <div class="toolbar-row">
          <div>
            <h3 class="card-title">${ICONS.history} ${isEn ? 'Complete Member Audit Timeline' : 'Mfuatano Kamili wa Historia ya Mwanachama'}</h3>
            <p style="margin:3px 0 0;font-size:12px;color:var(--ink-muted);">${isEn ? 'Registration, membership updates, contributions, attendance, leadership, notifications & documents' : 'Usajili, mabadiliko ya uanachama, michango, mahudhurio, uongozi, taarifa, hadi nyaraka'}</p>
          </div>
          <select id="historyMemberSelect" style="padding:8px 12px;border:1px solid var(--border-strong);border-radius:6px;">
            <option value="all">${isEn ? 'All WFC Members' : 'Wanachama Wote wa WFC'}</option>
            ${appState.data.members.map(m => `<option value="${m.id}" ${sel === m.id ? 'selected' : ''}>${escapeHtml(m.fullName)} (${escapeHtml(m.wfcId)})</option>`).join('')}
          </select>
        </div>

        <div style="border-left:2px solid var(--border-strong);margin-left:10px;padding-left:18px;">
          ${logs
            .map(
              item => `
              <div style="position:relative;padding:10px 14px;background:var(--bg-canvas);border:1px solid var(--border-hairline);border-radius:8px;margin-bottom:10px;">
                <span style="position:absolute;left:-25px;top:15px;width:12px;height:12px;border-radius:50%;background:var(--accent-primary);border:2px solid #FFF;"></span>
                <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:3px;">
                  <div><span class="badge badge-neutral">${escapeHtml(item.category)}</span> <strong>${escapeHtml(item.memberName)}</strong> <span class="mono" style="font-size:11px;color:var(--ink-muted);">(${escapeHtml(item.wfcId)})</span></div>
                  <span class="mono" style="font-size:11px;color:var(--ink-muted);">${escapeHtml(item.date)}</span>
                </div>
                <div style="font-size:13px;color:var(--ink-primary);">${escapeHtml(isEn ? item.titleEn : item.titleSw)}</div>
              </div>
            `
            )
            .join('')}
        </div>
      </div>
    `;
  }

  function renderContributionsPage() {
    const isEn = appState.lang === 'en';
    const d = appState.data;
    return `
      <div class="finance-strip">
        <div class="kpi-card success"><div class="kpi-label">${t('finIncome')}</div><div class="kpi-value tabular-nums">${fmtTsh(d.accounting.totalIncome)}</div></div>
        <div class="kpi-card"><div class="kpi-label">${t('finExpense')}</div><div class="kpi-value tabular-nums">${fmtTsh(d.accounting.totalExpense)}</div></div>
        <div class="kpi-card info"><div class="kpi-label">${t('finBalance')}</div><div class="kpi-value tabular-nums">${fmtTsh(d.accounting.balance)}</div></div>
        <div class="kpi-card warning"><div class="kpi-label">${t('finArrears')}</div><div class="kpi-value tabular-nums">${fmtTsh(d.accounting.feeArrearsTotal)}</div></div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">${ICONS.finance} ${isEn ? 'Contributions & Mobile Money Ledger' : 'Orodha ya Michango & Risiti'}</h3>
        </div>
        <div class="table-wrap">
          <table class="wfc-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>${isEn ? 'Member' : 'Mwanachama'}</th>
                <th>${isEn ? 'Category' : 'Aina'}</th>
                <th>${isEn ? 'Channel' : 'Njia'}</th>
                <th>${isEn ? 'Amount' : 'Kiasi'}</th>
                <th>Status</th>
                <th>${isEn ? 'Actions' : 'Hatua'}</th>
              </tr>
            </thead>
            <tbody>
              ${d.contributions
                .map(
                  c => `
                  <tr>
                    <td class="mono">${escapeHtml(c.reference)}</td>
                    <td><strong>${escapeHtml(c.memberName)}</strong> <span class="mono" style="font-size:11px;color:var(--ink-muted);">(${escapeHtml(c.wfcId)})</span></td>
                    <td>${escapeHtml(isEn ? c.typeEn : c.type)}</td>
                    <td>${escapeHtml(c.method)}</td>
                    <td class="tabular-nums"><strong>${fmtTsh(c.amount)}</strong></td>
                    <td><span class="badge ${c.status === 'APPROVED' ? 'badge-success' : 'badge-warning'}">${c.status}</span></td>
                    <td>
                      <div style="display:flex;gap:6px;">
                        <button class="btn btn-sm" data-action="viewContrib" data-id="${c.id}">${t('viewDetails')}</button>
                        ${c.status === 'PENDING' ? `<button class="btn btn-sm btn-success" data-action="approveContrib" data-id="${c.id}">${t('approve')}</button>` : ''}
                      </div>
                    </td>
                  </tr>
                `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderEventsPage() {
    const isEn = appState.lang === 'en';
    return `
      <div class="charts-grid-2">
        ${appState.data.events
          .map(ev => {
            const sold = ev.ticketBuyers.reduce((s, b) => s + Number(b.qty), 0);
            const revenue = ev.ticketBuyers.reduce((s, b) => s + Number(b.amount), 0);
            return `
              <div class="card">
                <div class="card-header">
                  <div>
                    <span class="badge badge-info">${escapeHtml(isEn ? ev.categoryEn : ev.category)}</span>
                    <h3 style="margin:6px 0 2px;font-size:16px;">${escapeHtml(isEn ? ev.titleEn : ev.title)}</h3>
                    <div style="font-size:12px;color:var(--ink-muted);">${escapeHtml(ev.venue)} · ${ev.date} (${ev.time})</div>
                  </div>
                  <button class="btn btn-primary btn-sm" data-action="viewEvent" data-id="${ev.id}">${t('viewDetails')}</button>
                </div>
                <p style="font-size:13px;color:var(--ink-secondary);">${escapeHtml(isEn ? ev.descriptionEn : ev.description)}</p>
                <div style="display:flex;justify-content:space-between;padding-top:10px;border-top:1px solid var(--border-hairline);font-size:12px;">
                  <span>${isEn ? 'Ticket Price' : 'Bei ya Tiketi'}: <strong class="tabular-nums">${fmtTsh(ev.ticketPrice)}</strong></span>
                  <span>${isEn ? 'Sold' : 'Zilizouzwa'}: <strong class="tabular-nums">${sold}/${ev.capacity}</strong></span>
                  <span>${isEn ? 'Revenue' : 'Mapato'}: <strong class="tabular-nums">${fmtTsh(revenue)}</strong></span>
                </div>
              </div>
            `;
          })
          .join('')}
      </div>
    `;
  }

  function renderDocumentsPage() {
    const isEn = appState.lang === 'en';
    const docTypes = [
      'All',
      'National ID',
      'Birth Certificate',
      'Passport Photo',
      'Membership Application Form',
      'Other Supporting Documents'
    ];
    const filtered = appState.data.documents.filter(
      doc => appState.docCategoryFilter === 'All' || doc.docType === appState.docCategoryFilter
    );

    return `
      <div class="card">
        <div class="toolbar-row">
          <div>
            <h3 class="card-title">${ICONS.documents} ${isEn ? 'Member Document Vault' : 'Hifadhi ya Nyaraka za Wanachama'}</h3>
            <p style="margin:2px 0 0;font-size:12px;color:var(--ink-muted);">National ID, Birth Certificate, Passport Photo, Membership Application Form, Other Supporting Documents</p>
          </div>
          <div style="display:flex;gap:8px;align-items:center;">
            <select id="newDocTypeSelect" style="padding:7px 10px;border:1px solid var(--border-strong);border-radius:6px;font-size:12px;">
              ${docTypes.slice(1).map(dt => `<option value="${dt}">${dt}</option>`).join('')}
            </select>
            <label class="btn btn-primary btn-sm" style="cursor:pointer;">
              + ${isEn ? 'Upload Document' : 'Pakia Waraka'}
              <input type="file" id="uploadNewDocInput" style="display:none;" />
            </label>
          </div>
        </div>

        <div class="filter-pills" style="margin-bottom:14px;">
          ${docTypes.map(dt => `<button class="filter-pill ${appState.docCategoryFilter === dt ? 'active' : ''}" data-action="setDocFilter" data-cat="${dt}">${dt}</button>`).join('')}
        </div>

        <div class="table-wrap">
          <table class="wfc-table">
            <thead>
              <tr>
                <th>${isEn ? 'Member' : 'Mwanachama'}</th>
                <th>${isEn ? 'Document Type' : 'Aina ya Waraka'}</th>
                <th>${isEn ? 'File Name' : 'Jina la Faili'}</th>
                <th>${isEn ? 'Uploaded' : 'Tarehe'}</th>
                <th>${isEn ? 'Actions' : 'Hatua'}</th>
              </tr>
            </thead>
            <tbody>
              ${filtered
                .map(
                  doc => `
                  <tr>
                    <td><strong>${escapeHtml(doc.memberName)}</strong> <span class="mono" style="font-size:11px;color:var(--ink-muted);">(${escapeHtml(doc.wfcId)})</span></td>
                    <td><span class="badge badge-neutral">${escapeHtml(doc.docType)}</span></td>
                    <td class="mono" style="font-size:12px;">${escapeHtml(doc.fileName)} <span style="color:var(--ink-muted);">(${escapeHtml(doc.fileSize)})</span></td>
                    <td>${escapeHtml(doc.uploadedAt)}</td>
                    <td>
                      <div style="display:flex;gap:6px;flex-wrap:wrap;">
                        <button class="btn btn-sm" data-action="viewDoc" data-id="${doc.id}">View</button>
                        <button class="btn btn-sm" data-action="downloadDoc" data-id="${doc.id}">Download</button>
                        <label class="btn btn-sm" style="cursor:pointer;">
                          Replace
                          <input type="file" data-replace-doc="${doc.id}" style="display:none;" />
                        </label>
                        <button class="btn btn-sm btn-danger-outline" data-action="deleteDoc" data-id="${doc.id}">Delete</button>
                      </div>
                    </td>
                  </tr>
                `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderReportsPage() {
    const isEn = appState.lang === 'en';
    const d = appState.data;
    const tabs = [
      ['membership', 'Membership Reports'],
      ['financial', 'Financial Reports'],
      ['regional', 'Regional & Clan Reports'],
      ['event', 'Event Reports'],
      ['leadership', 'Leadership Reports']
    ];
    const active = appState.activeReportTab;

    let reportTable = '';
    if (active === 'membership') {
      reportTable = `<table class="wfc-table" id="activeReportTable"><thead><tr><th>WFC ID</th><th>Name</th><th>Clan (Ukoo)</th><th>Origin District</th><th>Current Region</th><th>Status</th></tr></thead><tbody>${d.members.map(m => `<tr><td class="mono">${m.wfcId}</td><td>${m.fullName}</td><td>${m.ukoo}</td><td>${m.originDistrict}</td><td>${m.currentRegion}</td><td>${m.status}</td></tr>`).join('')}</tbody></table>`;
    } else if (active === 'financial') {
      reportTable = `<table class="wfc-table" id="activeReportTable"><thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Amount (TSh)</th></tr></thead><tbody>${d.accounting.ledger.map(l => `<tr><td>${l.date}</td><td>${l.description}</td><td>${l.category}</td><td class="tabular-nums">${l.amount.toLocaleString()}</td></tr>`).join('')}</tbody></table>`;
    } else if (active === 'regional') {
      reportTable = `<table class="wfc-table" id="activeReportTable"><thead><tr><th>WFC ID</th><th>Member</th><th>Origin Region</th><th>Origin District</th><th>Village</th><th>Clan</th></tr></thead><tbody>${d.members.map(m => `<tr><td class="mono">${m.wfcId}</td><td>${m.fullName}</td><td>${m.originRegion}</td><td>${m.originDistrict}</td><td>${m.kijiji || '-'}</td><td>${m.ukoo}</td></tr>`).join('')}</tbody></table>`;
    } else if (active === 'event') {
      reportTable = `<table class="wfc-table" id="activeReportTable"><thead><tr><th>Event</th><th>Venue</th><th>Date</th><th>Tickets Sold</th><th>Revenue (TSh)</th></tr></thead><tbody>${d.events.map(ev => `<tr><td>${ev.title}</td><td>${ev.venue}</td><td>${ev.date}</td><td>${ev.ticketBuyers.reduce((s, b) => s + b.qty, 0)}</td><td class="tabular-nums">${ev.ticketBuyers.reduce((s, b) => s + b.amount, 0).toLocaleString()}</td></tr>`).join('')}</tbody></table>`;
    } else {
      reportTable = `<table class="wfc-table" id="activeReportTable"><thead><tr><th>WFC ID</th><th>Leader</th><th>Current Position</th><th>RBAC Role</th><th>Tenure</th></tr></thead><tbody>${d.leadership.map(l => `<tr><td class="mono">${l.wfcId}</td><td>${l.name}</td><td>${l.currentPosition}</td><td>${l.rbacRole}</td><td>${l.tenure}</td></tr>`).join('')}</tbody></table>`;
    }

    return `
      <div class="card">
        <div class="toolbar-row">
          <h3 class="card-title">${ICONS.reports} ${isEn ? 'WFC Executive Reports & Exports' : 'Moduli ya Ripoti Rasmi za WFC'}</h3>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-primary btn-sm" data-action="exportPdfReport">${t('exportPdf')}</button>
            <button class="btn btn-success btn-sm" data-action="exportExcelReport">${t('exportExcel')}</button>
            <button class="btn btn-sm" onclick="window.print()">${t('printReport')}</button>
          </div>
        </div>

        <div class="tabs-bar">
          ${tabs.map(([key, label]) => `<button class="tab-btn ${active === key ? 'active' : ''}" data-action="setReportTab" data-tab="${key}">${label}</button>`).join('')}
        </div>

        <div class="table-wrap">${reportTable}</div>
      </div>
    `;
  }

  function renderLeadershipPage() {
    const isEn = appState.lang === 'en';
    return `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">${ICONS.leadership} ${isEn ? 'Leadership & Role-Based Access Control (RBAC)' : 'Safu ya Uongozi & Mamlaka (RBAC)'}</h3>
        </div>
        <div class="table-wrap">
          <table class="wfc-table">
            <thead>
              <tr>
                <th>WFC ID</th>
                <th>${isEn ? 'Leader' : 'Kiongozi'}</th>
                <th>${isEn ? 'Current Position' : 'Nafasi ya Sasa'}</th>
                <th>RBAC</th>
                <th>${isEn ? 'Service Period' : 'Kipindi cha Utumishi'}</th>
                <th>${isEn ? 'Actions' : 'Hatua'}</th>
              </tr>
            </thead>
            <tbody>
              ${appState.data.leadership
                .map(
                  l => `
                  <tr>
                    <td class="mono">${escapeHtml(l.wfcId)}</td>
                    <td><strong>${escapeHtml(l.name)}</strong></td>
                    <td>${escapeHtml(isEn ? l.currentPositionEn : l.currentPosition)}</td>
                    <td><span class="badge badge-info mono">${escapeHtml(l.rbacRole)}</span></td>
                    <td>${escapeHtml(l.tenure)}</td>
                    <td><button class="btn btn-sm" data-action="viewLeader" data-id="${l.id}">${t('viewDetails')}</button></td>
                  </tr>
                `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderApprovalsPage() {
    const isEn = appState.lang === 'en';
    const pendingMembers = appState.data.members.filter(m => m.status === 'Pending');
    const pendingContribs = appState.data.contributions.filter(c => c.status === 'PENDING');

    return `
      <div class="charts-grid-2">
        <div class="card">
          <div class="card-header"><h3 class="card-title">${isEn ? 'Pending Member Registrations' : 'Usajili wa Wanachama Unaopaswa Kuidhinishwa'} (${pendingMembers.length})</h3></div>
          ${pendingMembers.length
            ? pendingMembers
                .map(
                  m => `
                  <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border-hairline);">
                    <div><strong>${escapeHtml(m.fullName)}</strong> (${escapeHtml(m.wfcId)})<div style="font-size:11px;color:var(--ink-muted);">Ukoo: ${escapeHtml(m.ukoo)} · ${escapeHtml(m.originDistrict)}</div></div>
                    <div style="display:flex;gap:6px;">
                      <button class="btn btn-sm" data-action="viewMember" data-id="${m.id}">${t('viewDetails')}</button>
                      <button class="btn btn-sm btn-success" data-action="approveMember" data-id="${m.id}">${t('approve')}</button>
                    </div>
                  </div>
                `
                )
                .join('')
            : `<p style="color:var(--ink-muted);">${isEn ? 'No pending member applications.' : 'Hakuna maombi ya uanachama yanayosubiri.'}</p>`}
        </div>

        <div class="card">
          <div class="card-header"><h3 class="card-title">${isEn ? 'Pending Contributions' : 'Michango Inayosubiri Idhini'} (${pendingContribs.length})</h3></div>
          ${pendingContribs.length
            ? pendingContribs
                .map(
                  c => `
                  <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border-hairline);">
                    <div><strong>${escapeHtml(c.memberName)}</strong> · <span class="tabular-nums">${fmtTsh(c.amount)}</span><div style="font-size:11px;color:var(--ink-muted);">${escapeHtml(c.reference)} · ${escapeHtml(c.method)}</div></div>
                    <button class="btn btn-sm btn-success" data-action="approveContrib" data-id="${c.id}">${t('approve')}</button>
                  </div>
                `
                )
                .join('')
            : `<p style="color:var(--ink-muted);">${isEn ? 'All contributions have been reconciled.' : 'Michango yote imeshathibitishwa.'}</p>`}
        </div>
      </div>
    `;
  }

  function renderSecondaryModulePage() {
    const p = appState.activePage;
    const isEn = appState.lang === 'en';
    const ex = appState.data.extraModules;

    if (p === 'cases') {
      return `<div class="card"><div class="card-header"><h3 class="card-title">${ICONS.cases} ${t('navCases')}</h3></div>${ex.cases.map(c => `<div style="padding:10px;border:1px solid var(--border-hairline);border-radius:8px;margin-bottom:8px;"><span class="mono badge badge-neutral">${c.ref}</span> <strong>${escapeHtml(c.subject)}</strong> — <span class="badge badge-warning">${c.status}</span> (${c.date})</div>`).join('')}</div>`;
    }
    if (p === 'assets') {
      return `<div class="card"><div class="card-header"><h3 class="card-title">${ICONS.assets} ${t('navAssets')}</h3></div>${ex.assets.map(a => `<div style="padding:10px;border:1px solid var(--border-hairline);border-radius:8px;margin-bottom:8px;"><strong>${escapeHtml(a.name)}</strong> · ${escapeHtml(a.location)} — <strong class="tabular-nums">${fmtTsh(a.value)}</strong></div>`).join('')}</div>`;
    }
    if (p === 'projects') {
      return `<div class="card"><div class="card-header"><h3 class="card-title">${ICONS.projects} ${t('navProjects')}</h3></div>${ex.projects.map(pr => `<div style="padding:12px;border:1px solid var(--border-hairline);border-radius:8px;margin-bottom:10px;"><strong>${escapeHtml(pr.name)}</strong><div style="font-size:12px;color:var(--ink-secondary);margin-top:4px;" class="tabular-nums">${isEn ? 'Raised' : 'Imekusanywa'}: <strong>${fmtTsh(pr.raised)}</strong> / ${fmtTsh(pr.target)}</div></div>`).join('')}</div>`;
    }
    if (p === 'messages') {
      return `<div class="card"><div class="card-header"><h3 class="card-title">${ICONS.messages} ${t('navMessages')}</h3></div>${ex.messages.map(ms => `<div style="padding:10px;border-bottom:1px solid var(--border-hairline);"><div><strong>${escapeHtml(ms.subject)}</strong> <span style="font-size:11px;color:var(--ink-muted);">· ${escapeHtml(ms.sender)} (${ms.date})</span></div><div style="font-size:12px;color:var(--ink-secondary);">${escapeHtml(ms.preview)}</div></div>`).join('')}</div>`;
    }
    // Account & Security
    const u = appState.currentUser;
    return `
      <div class="card" style="max-width:680px;">
        <div class="card-header"><h3 class="card-title">${ICONS.security} ${t('navSecurity')}</h3></div>
        <div class="form-grid">
          <div class="form-group"><label>WFC ID</label><input class="mono" value="${escapeHtml(u.wfcId)}" readonly/></div>
          <div class="form-group"><label>${isEn ? 'Role' : 'Cheo'}</label><input value="${escapeHtml(isEn ? u.roleTitleEn : u.roleTitle)}" readonly/></div>
          <div class="form-group"><label>${isEn ? 'Full Name' : 'Jina Kamili'}</label><input id="secFullName" value="${escapeHtml(u.fullName)}"/></div>
          <div class="form-group"><label>${isEn ? 'Phone' : 'Simu'}</label><input id="secPhone" value="${escapeHtml(u.phone)}"/></div>
        </div>
        <div style="margin-top:14px;display:flex;gap:10px;">
          <button class="btn btn-primary" data-action="saveAccountProfile">${t('save')}</button>
          <button class="btn" data-action="resetDemoDatabase">${isEn ? 'Restore Default Seed Data' : 'Rejesha Data za Mwanzo'}</button>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // 9. PUBLIC STANDALONE VIEWS (LANDING, LOGIN/REGISTER, TICKET PAGE)
  //    Each includes the dedicated SW/EN switcher inside the Top Navigation Bar
  // =========================================================================
  function renderPublicTopbar() {
    const isEn = appState.lang === 'en';
    return `
      <header class="public-navbar">
        <div class="brand-identity">
          <img src="/wfc-logo.jpg" alt="WFC Logo" class="brand-logo" onerror="this.style.display='none'"/>
          <div>
            <div style="font-weight:700;font-size:15px;">WFC Portal <span class="brand-version">V7</span></div>
            <div style="font-size:11px;color:var(--ink-muted);">${t('orgName')}</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <button class="btn btn-sm ${appState.viewMode === 'landing' ? 'btn-dark' : ''}" data-action="setViewMode" data-mode="landing">${t('modeLanding')}</button>
          <button class="btn btn-sm ${appState.viewMode === 'tickets' ? 'btn-dark' : ''}" data-action="setViewMode" data-mode="tickets">${t('modeTickets')}</button>
          <button class="btn btn-sm ${appState.viewMode === 'login' ? 'btn-dark' : ''}" data-action="setViewMode" data-mode="login">${t('modeLogin')}</button>
          <button class="btn btn-sm btn-primary" data-action="setViewMode" data-mode="portal">${isEn ? 'Enter Digital Office →' : 'Ingia Ofisi ya Kidijitali →'}</button>
          <div class="lang-switcher">
            <button class="lang-btn ${appState.lang === 'sw' ? 'active' : ''}" data-action="setLang" data-lang="sw">SW</button>
            <button class="lang-btn ${appState.lang === 'en' ? 'active' : ''}" data-action="setLang" data-lang="en">EN</button>
          </div>
        </div>
      </header>
    `;
  }

  function renderPublicView() {
    const isEn = appState.lang === 'en';
    const d = appState.data;
    let body = '';

    if (appState.viewMode === 'landing') {
      body = `
        <section class="hero-banner">
          <div class="hero-inner">
            <div>
              <span class="badge badge-warning" style="margin-bottom:12px;">${t('motto')}</span>
              <h1 style="font-size:32px;margin:0 0 12px;line-height:1.2;">${isEn ? 'Uniting Wachagga Heritage, Solidarity & Digital Governance' : 'Umoja wa Asili ya Kichagga, Mshikamano na Utawala wa Kidijitali'}</h1>
              <p style="color:#D6D3D1;font-size:15px;margin:0 0 20px;">${isEn ? 'Official digital registry for clans, monthly contributions, community events, and transparent leadership across Tanzania and the diaspora.' : 'Kanzidata rasmi ya koo, michango ya mshikamano, matukio ya jamii, na uongozi wenye uwazi ndani na nje ya Tanzania.'}</p>
              <div style="display:flex;gap:10px;flex-wrap:wrap;">
                <button class="btn btn-primary" data-action="openPublicRegModal">${t('registerMemberBtn')}</button>
                <button class="btn" data-action="setViewMode" data-mode="tickets">${t('modeTickets')}</button>
              </div>
            </div>
            <div class="card" style="color:var(--ink-primary);">
              <div class="kpi-label">${isEn ? 'Community Snapshot' : 'Takwimu za Jumuiya'}</div>
              <div style="font-size:26px;font-weight:700;margin:4px 0;" class="tabular-nums">${d.members.length} ${isEn ? 'Registered Members' : 'Wanachama'}</div>
              <div style="font-size:12px;color:var(--ink-secondary);margin-bottom:12px;">${d.events.length} ${isEn ? 'Upcoming Community Events' : 'Matukio Yajayo'}</div>
              <button class="btn btn-dark" style="width:100%;" data-action="setViewMode" data-mode="portal">${isEn ? 'Open Leadership Portal' : 'Fungua Portal ya Uongozi'}</button>
            </div>
          </div>
        </section>
      `;
    } else if (appState.viewMode === 'login') {
      body = `
        <div style="max-width:460px;margin:48px auto;padding:0 16px;">
          <div class="card">
            <h2 style="margin:0 0 6px;font-size:19px;">${isEn ? 'Sign In to WFC Digital Office' : 'Ingia Kwenye Ofisi ya Kidijitali ya WFC'}</h2>
            <p style="margin:0 0 16px;font-size:12px;color:var(--ink-muted);">${isEn ? 'Use WFC-ADMIN or any registered member email' : 'Tumia WFC-ADMIN au barua pepe ya mwanachama aliyesajiliwa'}</p>
            <div class="form-group" style="margin-bottom:12px;">
              <label>WFC ID / Email</label>
              <input id="loginIdInput" value="WFC-ADMIN" />
            </div>
            <div class="form-group" style="margin-bottom:16px;">
              <label>${isEn ? 'Password' : 'Nenosiri'}</label>
              <input id="loginPassInput" type="password" value="wfc2026admin" />
            </div>
            <button class="btn btn-primary" style="width:100%;margin-bottom:10px;" data-action="submitLogin">${isEn ? 'Sign In' : 'Ingia Kwenye Mfumo'}</button>
            <button class="btn" style="width:100%;" data-action="openPublicRegModal">${t('registerMemberBtn')}</button>
          </div>
        </div>
      `;
    } else {
      // Public Ticket Page
      body = `
        <div style="max-width:920px;margin:32px auto;padding:0 16px;">
          <h2 style="margin:0 0 14px;">${isEn ? 'WFC Event Tickets & Instant QR Pass' : 'Tiketi za Matukio ya WFC & Pasi ya QR'}</h2>
          <div class="charts-grid-2">
            ${d.events
              .map(
                ev => `
                <div class="card">
                  <span class="badge badge-info">${escapeHtml(isEn ? ev.categoryEn : ev.category)}</span>
                  <h3 style="margin:8px 0 4px;">${escapeHtml(isEn ? ev.titleEn : ev.title)}</h3>
                  <div style="font-size:12px;color:var(--ink-muted);margin-bottom:10px;">${escapeHtml(ev.venue)} · ${ev.date} (${ev.time})</div>
                  <p style="font-size:13px;color:var(--ink-secondary);">${escapeHtml(isEn ? ev.descriptionEn : ev.description)}</p>
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;">
                    <strong class="tabular-nums">${fmtTsh(ev.ticketPrice)}</strong>
                    <button class="btn btn-primary btn-sm" data-action="bookQuickTicket" data-id="${ev.id}">${isEn ? 'Book Ticket Now' : 'Kata Tiketi Sasa'}</button>
                  </div>
                </div>
              `
              )
              .join('')}
          </div>
        </div>
      `;
    }

    return `
      <div class="public-shell">
        ${renderPublicTopbar()}
        ${body}
        ${renderModal()}
        ${appState.toast ? `<div class="toast-banner">${escapeHtml(appState.toast)}</div>` : ''}
      </div>
    `;
  }

  // =========================================================================
  // 10. MAIN PORTAL RENDERER
  // =========================================================================
  function render() {
    const root = document.getElementById('app');
    if (!root) return;
    if (!appState.data) {
      root.innerHTML = '<div style="padding:48px;text-align:center;font-weight:600;">Inapakia WFC Portal V7...</div>';
      return;
    }

    if (appState.viewMode !== 'portal') {
      root.innerHTML = renderPublicView();
      bindEvents();
      return;
    }

    const d = appState.data;
    const isEn = appState.lang === 'en';
    const user = appState.currentUser || d.members[0];
    const unreadCount = d.notifications.filter(n => !n.read).length;
    const pendingApprovals =
      d.members.filter(m => m.status === 'Pending').length +
      d.contributions.filter(c => c.status === 'PENDING').length;

    const navSections = [
      {
        group: t('navGroupMain'),
        items: [
          { id: 'dashboard', label: t('navDashboard'), icon: ICONS.dashboard },
          { id: 'members', label: t('navMembers'), icon: ICONS.members, badge: d.members.length },
          { id: 'history', label: t('navMemberHistory'), icon: ICONS.history },
          { id: 'leadership', label: t('navLeadership'), icon: ICONS.leadership },
          { id: 'approvals', label: t('navApprovals'), icon: ICONS.approvals, badge: pendingApprovals }
        ]
      },
      {
        group: t('navGroupOps'),
        items: [
          { id: 'contributions', label: t('navContributions'), icon: ICONS.finance },
          { id: 'events', label: t('navEvents'), icon: ICONS.events },
          { id: 'documents', label: t('navDocuments'), icon: ICONS.documents },
          { id: 'reports', label: t('navReports'), icon: ICONS.reports }
        ]
      },
      {
        group: t('navGroupSystem'),
        items: [
          { id: 'cases', label: t('navCases'), icon: ICONS.cases },
          { id: 'assets', label: t('navAssets'), icon: ICONS.assets },
          { id: 'projects', label: t('navProjects'), icon: ICONS.projects },
          { id: 'messages', label: t('navMessages'), icon: ICONS.messages },
          { id: 'security', label: t('navSecurity'), icon: ICONS.security }
        ]
      }
    ];

    let activeViewHtml = '';
    if (appState.activePage === 'dashboard') activeViewHtml = renderDashboardPage();
    else if (appState.activePage === 'members') activeViewHtml = renderMembersPage();
    else if (appState.activePage === 'history') activeViewHtml = renderMemberHistoryPage();
    else if (appState.activePage === 'contributions') activeViewHtml = renderContributionsPage();
    else if (appState.activePage === 'events') activeViewHtml = renderEventsPage();
    else if (appState.activePage === 'documents') activeViewHtml = renderDocumentsPage();
    else if (appState.activePage === 'reports') activeViewHtml = renderReportsPage();
    else if (appState.activePage === 'leadership') activeViewHtml = renderLeadershipPage();
    else if (appState.activePage === 'approvals') activeViewHtml = renderApprovalsPage();
    else activeViewHtml = renderSecondaryModulePage();

    const activeNavObj = navSections.flatMap(s => s.items).find(i => i.id === appState.activePage);

    root.innerHTML = `
      <div class="portal-shell ${appState.sidebarCollapsed ? 'sidebar-collapsed' : ''} ${appState.mobileMenuOpen ? 'mobile-open' : ''}">
        <!-- Sidebar (Requirement #1: Language switcher removed from here) -->
        <aside class="sidebar">
          <div class="sidebar-brand">
            <div class="brand-identity">
              <img src="/wfc-logo.jpg" alt="WFC" class="brand-logo" onerror="this.style.display='none'"/>
              <div class="brand-text">
                <div class="brand-title-row">
                  <span class="brand-title">WFC Portal</span>
                  <span class="brand-version">V7</span>
                </div>
                <div class="brand-motto">${t('motto')}</div>
              </div>
            </div>
            <button class="sidebar-collapse-btn" data-action="toggleSidebarCollapse" title="Collapse/Expand">
              ${appState.sidebarCollapsed ? ICONS.chevronRight : ICONS.chevronLeft}
            </button>
          </div>

          <div class="sidebar-scroll">
            ${navSections
              .map(
                sec => `
                <div class="sidebar-group-label">${sec.group}</div>
                ${sec.items
                  .map(
                    item => `
                    <button class="nav-item ${appState.activePage === item.id ? 'active' : ''}" data-nav="${item.id}" title="${escapeHtml(item.label)}">
                      ${item.icon}
                      <span class="nav-label">${escapeHtml(item.label)}</span>
                      ${item.badge ? `<span class="nav-badge">${item.badge}</span>` : ''}
                    </button>
                  `
                  )
                  .join('')}
              `
              )
              .join('')}
          </div>

          <div class="sidebar-footer">
            <div class="avatar-circle">${initials(user.fullName)}</div>
            <div class="sidebar-footer-info" style="min-width:0;">
              <div style="font-size:12px;font-weight:700;color:#FFF;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(user.fullName)}</div>
              <div style="font-size:11px;color:#FB923C;font-weight:600;">${escapeHtml(user.wfcId)} · ${escapeHtml(isEn ? user.roleTitleEn : user.roleTitle)}</div>
            </div>
          </div>
        </aside>

        <!-- Main Workspace -->
        <div class="main-area">
          <!-- Top Navigation Bar (Requirements #2, #3, #8) -->
          <header class="topbar">
            <div class="topbar-left">
              <button class="btn btn-icon mobile-menu-btn" data-action="toggleMobileMenu">${ICONS.menu}</button>
              <div class="page-heading-group">
                <h1>${escapeHtml(activeNavObj ? activeNavObj.label : t('navDashboard'))}</h1>
                <p>${t('orgName')} · ${t('digitalOffice')}</p>
              </div>
            </div>

            <div class="topbar-right">
              <!-- Public View Quick Links -->
              <div class="view-mode-pills">
                <button class="view-mode-btn active" data-action="setViewMode" data-mode="portal">${t('modePortal')}</button>
                <button class="view-mode-btn" data-action="setViewMode" data-mode="landing">${t('modeLanding')}</button>
                <button class="view-mode-btn" data-action="setViewMode" data-mode="tickets">${t('modeTickets')}</button>
                <button class="view-mode-btn" data-action="setViewMode" data-mode="login">${t('modeLogin')}</button>
              </div>

              <!-- Dedicated Language Switcher in Topbar -->
              <div class="lang-switcher">
                <button class="lang-btn ${appState.lang === 'sw' ? 'active' : ''}" data-action="setLang" data-lang="sw">SW</button>
                <button class="lang-btn ${appState.lang === 'en' ? 'active' : ''}" data-action="setLang" data-lang="en">EN</button>
              </div>

              <!-- Notification Bell & Dropdown (Requirement #8) -->
              <div class="notif-wrapper">
                <button class="bell-btn" data-action="toggleNotifDropdown" title="${t('notificationsTitle')}">
                  ${ICONS.bell}
                  ${unreadCount > 0 ? `<span class="bell-count">${unreadCount}</span>` : ''}
                </button>
                ${
                  appState.notifDropdownOpen
                    ? `
                    <div class="dropdown-panel">
                      <div class="dropdown-header">
                        <strong style="font-size:12px;">${t('notificationsTitle')} (${unreadCount})</strong>
                        <button class="btn btn-sm" data-action="markAllNotifsRead">${t('markAllRead')}</button>
                      </div>
                      <div style="max-height:320px;overflow-y:auto;">
                        ${d.notifications
                          .map(
                            n => `
                            <div style="padding:10px 14px;border-bottom:1px solid var(--border-hairline);background:${n.read ? '#FFF' : 'var(--accent-soft)'};cursor:pointer;" data-action="toggleNotifRead" data-id="${n.id}">
                              <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:2px;">
                                <span class="badge badge-neutral">${escapeHtml(n.type)}</span>
                                <span style="font-weight:700;color:${n.read ? 'var(--ink-muted)' : 'var(--accent-primary)'};">${n.read ? t('readLabel') : t('unreadLabel')}</span>
                              </div>
                              <div style="font-size:12px;font-weight:700;">${escapeHtml(isEn ? n.titleEn : n.titleSw)}</div>
                              <div style="font-size:11px;color:var(--ink-secondary);">${escapeHtml(isEn ? n.bodyEn : n.bodySw)}</div>
                            </div>
                          `
                          )
                          .join('')}
                      </div>
                    </div>
                  `
                    : ''
                }
              </div>

              <!-- User Profile Dropdown & Dedicated Logout Button (Requirement #3) -->
              <div class="profile-wrapper">
                <button class="profile-trigger" data-action="toggleProfileDropdown">
                  <div class="avatar-circle" style="width:30px;height:30px;font-size:11px;">${initials(user.fullName)}</div>
                  <div class="profile-meta">
                    <div class="profile-name">${escapeHtml(user.fullName)}</div>
                    <div class="profile-role">${escapeHtml(user.wfcId)} · ${escapeHtml(isEn ? user.roleTitleEn : user.roleTitle)}</div>
                  </div>
                </button>
                ${
                  appState.profileDropdownOpen
                    ? `
                    <div class="dropdown-panel profile-dropdown">
                      <button class="dropdown-item" data-action="viewMember" data-id="${user.id}">${t('myProfile')}</button>
                      <button class="dropdown-item" data-nav="security">${t('accountSettings')}</button>
                      <button class="dropdown-item" data-nav="security">${t('changePassword')}</button>
                      <button class="dropdown-item" style="color:var(--danger-ink);border-top:1px solid var(--border-hairline);" data-action="logoutUser">${t('logout')}</button>
                    </div>
                  `
                    : ''
                }
              </div>

              <button class="btn btn-sm btn-danger-outline" data-action="logoutUser" title="${t('logout')}">
                ${ICONS.logout} <span>${t('logout')}</span>
              </button>
            </div>
          </header>

          <main class="workspace">
            ${activeViewHtml}
          </main>
        </div>
      </div>
      ${renderModal()}
      ${appState.toast ? `<div class="toast-banner">${escapeHtml(appState.toast)}</div>` : ''}
    `;

    bindEvents();
  }

  // =========================================================================
  // 11. INTERACTIVE EVENT BINDINGS
  // =========================================================================
  function bindEvents() {
    document.querySelectorAll('[data-nav]').forEach(el => {
      el.onclick = () => {
        appState.activePage = el.getAttribute('data-nav');
        appState.mobileMenuOpen = false;
        appState.profileDropdownOpen = false;
        appState.notifDropdownOpen = false;
        render();
      };
    });

    document.querySelectorAll('[data-close-modal]').forEach(el => {
      el.onclick = () => {
        appState.modal = null;
        render();
      };
    });

    const searchInp = document.getElementById('memberSearchInput');
    if (searchInp) {
      searchInp.oninput = e => {
        appState.searchQuery = e.target.value;
        render();
        const nextInp = document.getElementById('memberSearchInput');
        if (nextInp) {
          nextInp.focus();
          nextInp.setSelectionRange(nextInp.value.length, nextInp.value.length);
        }
      };
    }

    const histSel = document.getElementById('historyMemberSelect');
    if (histSel) {
      histSel.onchange = e => {
        appState.selectedHistoryMemberId = e.target.value;
        render();
      };
    }

    document.querySelectorAll('[data-reg]').forEach(inp => {
      inp.oninput = e => {
        if (appState.modal && appState.modal.form) {
          appState.modal.form[inp.getAttribute('data-reg')] = e.target.value;
        }
      };
    });

    const regPhoto = document.getElementById('regPhotoInput');
    if (regPhoto) {
      regPhoto.onchange = e => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          if (appState.modal && appState.modal.form) {
            appState.modal.form.photoUrl = reader.result;
            render();
          }
        };
        reader.readAsDataURL(file);
      };
    }

    const uploadDocInp = document.getElementById('uploadNewDocInput');
    if (uploadDocInp) {
      uploadDocInp.onchange = e => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const docType = document.getElementById('newDocTypeSelect').value;
        const u = appState.currentUser;
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = String(reader.result).split(',')[1] || '';
          appState.data.documents.unshift({
            id: `doc-${Date.now()}`,
            memberId: u.id,
            wfcId: u.wfcId,
            memberName: u.fullName,
            docType,
            fileName: file.name,
            fileSize: `${Math.max(1, Math.round(file.size / 1024))} KB`,
            uploadedAt: new Date().toISOString().slice(0, 10),
            verified: true,
            mimeType: file.type || 'application/octet-stream',
            contentBase64: base64
          });
          persistState(`Waraka "${file.name}" umepakiwa kikamilifu.`);
        };
        reader.readAsDataURL(file);
      };
    }

    document.querySelectorAll('[data-replace-doc]').forEach(inp => {
      inp.onchange = e => {
        const docId = inp.getAttribute('data-replace-doc');
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          const doc = appState.data.documents.find(d => d.id === docId);
          if (doc) {
            doc.fileName = file.name;
            doc.fileSize = `${Math.max(1, Math.round(file.size / 1024))} KB`;
            doc.uploadedAt = new Date().toISOString().slice(0, 10);
            doc.mimeType = file.type || 'application/octet-stream';
            doc.contentBase64 = String(reader.result).split(',')[1] || '';
            persistState(`Waraka umebadilishwa kuwa "${file.name}".`);
          }
        };
        reader.readAsDataURL(file);
      };
    });

    document.querySelectorAll('[data-action]').forEach(el => {
      el.onclick = async () => {
        const act = el.getAttribute('data-action');
        if (act === 'setLang') {
          appState.lang = el.getAttribute('data-lang');
          localStorage.setItem('wfc_lang', appState.lang);
          render();
        } else if (act === 'setViewMode') {
          appState.viewMode = el.getAttribute('data-mode');
          render();
        } else if (act === 'toggleSidebarCollapse') {
          appState.sidebarCollapsed = !appState.sidebarCollapsed;
          localStorage.setItem('wfc_sidebar_collapsed', String(appState.sidebarCollapsed));
          render();
        } else if (act === 'toggleMobileMenu') {
          appState.mobileMenuOpen = !appState.mobileMenuOpen;
          render();
        } else if (act === 'toggleNotifDropdown') {
          appState.notifDropdownOpen = !appState.notifDropdownOpen;
          appState.profileDropdownOpen = false;
          render();
        } else if (act === 'toggleProfileDropdown') {
          appState.profileDropdownOpen = !appState.profileDropdownOpen;
          appState.notifDropdownOpen = false;
          render();
        } else if (act === 'markAllNotifsRead') {
          appState.data.notifications.forEach(n => (n.read = true));
          persistState('Taarifa zote zimetiwa alama kuwa zimesomwa.');
        } else if (act === 'toggleNotifRead') {
          const n = appState.data.notifications.find(x => x.id === el.getAttribute('data-id'));
          if (n) {
            n.read = !n.read;
            persistState();
          }
        } else if (act === 'openRegModal') {
          openMemberRegModal(false);
        } else if (act === 'openPublicRegModal') {
          openMemberRegModal(true);
        } else if (act === 'regNextStep') {
          appState.modal.step = Math.min(3, appState.modal.step + 1);
          render();
        } else if (act === 'regPrevStep') {
          appState.modal.step = Math.max(1, appState.modal.step - 1);
          render();
        } else if (act === 'submitMemberReg') {
          const form = appState.modal.form;
          if (!form.fullName.trim()) {
            showToast('Tafadhali jaza jina kamili la mwanachama.');
            return;
          }
          const res = await fetch('/api/members', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form)
          });
          const json = await res.json();
          if (json.ok && json.state) {
            appState.data = json.state;
            appState.modal = null;
            showToast(`Mwanachama ${form.fullName} (${form.wfcId}) amesajiliwa!`);
          }
        } else if (act === 'closeModal') {
          appState.modal = null;
          render();
        } else if (act === 'setMemberFilter') {
          appState.memberFilter = el.getAttribute('data-filter');
          render();
        } else if (act === 'viewMember') {
          appState.profileDropdownOpen = false;
          openMemberDetailsModal(el.getAttribute('data-id'), 'profile');
        } else if (act === 'memberDetailTab') {
          appState.modal.tab = el.getAttribute('data-tab');
          render();
        } else if (act === 'approveMember') {
          const mem = appState.data.members.find(x => x.id === el.getAttribute('data-id'));
          if (mem) {
            mem.status = 'Active';
            mem.roleTitle = 'Mwanachama Hai';
            mem.roleTitleEn = 'Active Member';
            persistState(`${mem.fullName} (${mem.wfcId}) ameidhinishwa!`);
          }
        } else if (act === 'viewContrib') {
          openContributionDetailsModal(el.getAttribute('data-id'));
        } else if (act === 'approveContrib') {
          const c = appState.data.contributions.find(x => x.id === el.getAttribute('data-id'));
          if (c) {
            c.status = 'APPROVED';
            c.approvedBy = appState.currentUser.fullName;
            appState.data.accounting.totalIncome += Number(c.amount);
            appState.data.accounting.balance += Number(c.amount);
            persistState(`Mchango ${c.reference} umeidhinishwa!`);
          }
        } else if (act === 'viewEvent') {
          openEventDetailsModal(el.getAttribute('data-id'));
        } else if (act === 'toggleCheckIn') {
          const ev = appState.data.events.find(x => x.id === el.getAttribute('data-event-id'));
          const idx = Number(el.getAttribute('data-buyer-idx'));
          if (ev && ev.ticketBuyers[idx]) {
            ev.ticketBuyers[idx].checkedIn = !ev.ticketBuyers[idx].checkedIn;
            persistState('Hali ya mahudhurio imesasishwa.');
          }
        } else if (act === 'viewLeader') {
          openLeadershipDetailsModal(el.getAttribute('data-id'));
        } else if (act === 'setDocFilter') {
          appState.docCategoryFilter = el.getAttribute('data-cat');
          render();
        } else if (act === 'viewDoc') {
          const doc = appState.data.documents.find(x => x.id === el.getAttribute('data-id'));
          if (doc) {
            const decoded = atob(doc.contentBase64 || '');
            alert(`${doc.docType} — ${doc.fileName}\n\n${decoded.slice(0, 600)}`);
          }
        } else if (act === 'downloadDoc') {
          const doc = appState.data.documents.find(x => x.id === el.getAttribute('data-id'));
          if (doc) {
            const a = document.createElement('a');
            a.href = `data:${doc.mimeType || 'text/plain'};base64,${doc.contentBase64 || ''}`;
            a.download = doc.fileName;
            a.click();
          }
        } else if (act === 'deleteDoc') {
          const id = el.getAttribute('data-id');
          appState.data.documents = appState.data.documents.filter(d => d.id !== id);
          persistState('Waraka umefutwa.');
        } else if (act === 'setReportTab') {
          appState.activeReportTab = el.getAttribute('data-tab');
          render();
        } else if (act === 'exportExcelReport') {
          const table = document.getElementById('activeReportTable');
          if (!table) return;
          const rows = Array.from(table.querySelectorAll('tr')).map(tr =>
            Array.from(tr.children)
              .map(td => `"${td.innerText.replace(/"/g, '""')}"`)
              .join(',')
          );
          const csv = '\uFEFF' + rows.join('\n');
          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `WFC_Report_${appState.activeReportTab}_${new Date().toISOString().slice(0, 10)}.csv`;
          a.click();
          URL.revokeObjectURL(url);
          showToast('Ripoti ya Excel (CSV) imepakuliwa.');
        } else if (act === 'exportPdfReport') {
          window.print();
        } else if (act === 'logoutUser') {
          appState.profileDropdownOpen = false;
          appState.viewMode = 'login';
          render();
        } else if (act === 'submitLogin') {
          const idVal = document.getElementById('loginIdInput').value;
          const passVal = document.getElementById('loginPassInput').value;
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier: idVal, password: passVal })
          });
          const json = await res.json();
          if (json.ok && json.user) {
            appState.currentUser = json.user;
            localStorage.setItem('wfc_user_id', json.user.id);
            appState.viewMode = 'portal';
            showToast(`Karibu ${json.user.fullName}!`);
          } else {
            showToast(json.error || 'Imeshindwa kuingia.');
          }
        } else if (act === 'bookQuickTicket') {
          const ev = appState.data.events.find(x => x.id === el.getAttribute('data-id'));
          if (ev) {
            const code = `WFC-TKT-${Math.floor(100 + Math.random() * 899)}`;
            ev.ticketBuyers.push({
              ticketCode: code,
              name: appState.currentUser ? appState.currentUser.fullName : 'Mgeni wa WFC',
              wfcId: appState.currentUser ? appState.currentUser.wfcId : 'GUEST',
              qty: 1,
              amount: ev.ticketPrice,
              checkedIn: false
            });
            persistState(`Tiketi ${code} imehifadhiwa kwa ${ev.title}!`);
          }
        } else if (act === 'saveAccountProfile') {
          appState.currentUser.fullName = document.getElementById('secFullName').value;
          appState.currentUser.phone = document.getElementById('secPhone').value;
          persistState('Taarifa za akaunti zimehifadhiwa.');
        } else if (act === 'resetDemoDatabase') {
          const res = await fetch('/api/reset', { method: 'POST' });
          const json = await res.json();
          if (json.ok && json.state) {
            appState.data = json.state;
            appState.currentUser = appState.data.members[0];
            showToast('Data za mwanzo zimerejeshwa.');
          }
        }
      };
    });
  }

  loadServerState();
})();
