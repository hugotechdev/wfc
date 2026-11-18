const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'wfc_db.json');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, key] = storedHash.split(':');
  const keyBuffer = Buffer.from(key, 'hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  if (keyBuffer.length !== derivedKey.length) return false;
  return crypto.timingSafeEqual(keyBuffer, derivedKey);
}

function normalizePhone(phone) {
  if (!phone) return '';
  let digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('255')) digits = '0' + digits.slice(3);
  return digits;
}

function createInitialData() {
  const now = new Date().toISOString();
  return {
    settings: {
      resendApiKey: process.env.RESEND_API_KEY || '',
      emailFrom: process.env.EMAIL_FROM || 'Wachagga Family Community <onboarding@resend.dev>',
      registrationFee: 1000,
      paymentChannels: [
        { id: 'mpesa', provider: 'M-Pesa (Vodacom)', accountName: 'Wachagga Family Community', number: '0755 000 888', copyValue: '0755000888' },
        { id: 'tigopesa', provider: 'Tigo Pesa (Mixx by Yas)', accountName: 'Wachagga Family Community', number: '0715 000 888', copyValue: '0715000888' },
        { id: 'lipanamba', provider: 'Lipa Namba (Tigo / Mitandao Yote)', accountName: 'WFC Treasury', number: '89900', copyValue: '89900' },
        { id: 'airtel', provider: 'Airtel Money', accountName: 'Wachagga Family Community', number: '0785 000 888', copyValue: '0785000888' },
        { id: 'crdb', provider: 'CRDB Bank PLC', accountName: 'Wachagga Family Community', number: '0150889944200', copyValue: '0150889944200' }
      ]
    },
    users: [
      {
        id: 'usr-1',
        wfcId: 'WFC-2026-0001',
        fullName: 'Hugo Ildefonce Mlula',
        phone: '0755000001',
        email: 'admin@wfc.co.tz',
        kanda: 'Dar es Salaam',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        passwordHash: hashPassword('Admin@2026'),
        registrationTxRef: 'CRDB-INIT-001',
        registrationChannel: 'CRDB Bank PLC',
        resetToken: null,
        resetTokenExpires: null,
        createdAt: now
      },
      {
        id: 'usr-2',
        wfcId: 'WFC-2026-0002',
        fullName: 'Grace Massawe (Mhasibu)',
        phone: '0755000002',
        email: 'mhasibu@wfc.co.tz',
        kanda: 'Kilimanjaro',
        role: 'ACCOUNTANT',
        status: 'ACTIVE',
        passwordHash: hashPassword('Mhasibu@2026'),
        registrationTxRef: 'MP-INIT-002',
        registrationChannel: 'M-Pesa (Vodacom)',
        resetToken: null,
        resetTokenExpires: null,
        createdAt: now
      },
      {
        id: 'usr-3',
        wfcId: 'WFC-2026-0003',
        fullName: 'Joseph Shirima (Mwenyekiti)',
        phone: '0755000003',
        email: 'mwenyekiti@wfc.co.tz',
        kanda: 'Arusha',
        role: 'CHAIRPERSON',
        status: 'ACTIVE',
        passwordHash: hashPassword('Mwenyekiti@2026'),
        registrationTxRef: 'MP-INIT-003',
        registrationChannel: 'M-Pesa (Vodacom)',
        resetToken: null,
        resetTokenExpires: null,
        createdAt: now
      },
      {
        id: 'usr-4',
        wfcId: 'WFC-2026-0004',
        fullName: 'Neema Mushi',
        phone: '0755000004',
        email: 'mwanachama@wfc.co.tz',
        kanda: 'Dar es Salaam',
        role: 'MEMBER',
        status: 'ACTIVE',
        passwordHash: hashPassword('Member@2026'),
        registrationTxRef: 'TG-INIT-004',
        registrationChannel: 'Tigo Pesa (Mixx by Yas)',
        resetToken: null,
        resetTokenExpires: null,
        createdAt: now
      },
      {
        id: 'usr-5',
        wfcId: 'WFC-2026-0005',
        fullName: 'Kelvin Temba',
        phone: '0755000005',
        email: 'pending@wfc.co.tz',
        kanda: 'Mwanza',
        role: 'MEMBER',
        status: 'WAITING_APPROVAL',
        passwordHash: hashPassword('Pending@2026'),
        registrationTxRef: 'MP261118.1045.A9921',
        registrationChannel: 'M-Pesa (Vodacom)',
        resetToken: null,
        resetTokenExpires: null,
        createdAt: now
      }
    ],
    funds: [
      { id: 'REG_FUND', name: 'Mfuko wa Ada za Usajili & Uanachama', code: 'FND-01', balance: 450000, description: 'Ada za usajili wa wanachama wapya (TSh 1,000) na uendeshaji wa ofisi ya kidijitali.' },
      { id: 'BEREAVEMENT_FUND', name: 'Mfuko wa Rambirambi (Bereavement)', code: 'FND-02', balance: 2850000, description: 'Mfuko maalum wa pole na rambirambi kwa wanachama wanapopatwa na misiba.' },
      { id: 'WEDDING_FUND', name: 'Mfuko wa Harusi (Weddings)', code: 'FND-03', balance: 1620000, description: 'Michango ya zawadi na sherehe za harusi za wanachama wa WFC.' },
      { id: 'WCSC_FUND', name: 'WCSC (Social Welfare)', code: 'FND-04', balance: 3100000, description: 'Mfuko wa ustawi wa jamii, elimu na misaada ya dharura.' },
      { id: 'SACCOS_FUND', name: 'WFC SACCOS', code: 'FND-05', balance: 8450000, description: 'Hisa, akiba na mikopo yenye riba nafuu kwa wanachama.' },
      { id: 'UTT_AMIS_FUND', name: 'UTT AMIS Uwekezaji', code: 'FND-06', balance: 5200000, description: 'Uwekezaji wa pamoja katika mifuko ya UTT AMIS (Umoja, Wekeza, Watoto, Jikimu).' },
      { id: 'TOURS_FUND', name: 'Community Tours & Utalii', code: 'FND-07', balance: 980000, description: 'Safari za pamoja za utalii wa ndani na kutembelea asili Kilimanjaro.' },
      { id: 'QUEENS_FUND', name: 'WFC Queens Empowerment', code: 'FND-08', balance: 1450000, description: 'Uwezeshaji wa wanawake wajasiriamali na uongozi ndani ya WFC.' },
      { id: 'FESTIVAL_FUND', name: 'WFC Cultural Festival', code: 'FND-09', balance: 2150000, description: 'Maandalizi ya tamasha kubwa la mwaka la utamaduni wa Wachagga.' }
    ],
    ledger: [
      { id: 'ldg-1', fundId: 'REG_FUND', type: 'CREDIT', amount: 450000, reference: 'OPENING-BAL-01', note: 'Salio la awali la mfuko wa usajili', actorName: 'Mfumo', createdAt: now },
      { id: 'ldg-2', fundId: 'BEREAVEMENT_FUND', type: 'CREDIT', amount: 2850000, reference: 'OPENING-BAL-02', note: 'Salio la awali la mfuko wa rambirambi', actorName: 'Mfumo', createdAt: now },
      { id: 'ldg-3', fundId: 'SACCOS_FUND', type: 'CREDIT', amount: 8450000, reference: 'OPENING-BAL-05', note: 'Hisa na akiba za wanachama SACCOS', actorName: 'Mfumo', createdAt: now }
    ],
    payments: [
      {
        id: 'pay-101',
        userId: 'usr-5',
        wfcId: 'WFC-2026-0005',
        memberName: 'Kelvin Temba',
        category: 'REGISTRATION',
        fundId: 'REG_FUND',
        amount: 1000,
        channel: 'M-Pesa (Vodacom)',
        txRef: 'MP261118.1045.A9921',
        note: 'Ada ya usajili wa uanachama mpya',
        status: 'PENDING',
        verifiedBy: null,
        createdAt: now
      },
      {
        id: 'pay-102',
        userId: 'usr-4',
        wfcId: 'WFC-2026-0004',
        memberName: 'Neema Mushi',
        category: 'CONTRIBUTION',
        fundId: 'BEREAVEMENT_FUND',
        amount: 20000,
        channel: 'Lipa Namba (89900)',
        txRef: 'TG261118.0912.B4410',
        note: 'Mchango wa rambirambi wa mwezi',
        status: 'PENDING',
        verifiedBy: null,
        createdAt: now
      }
    ],
    disbursements: [
      {
        id: 'dsb-201',
        fundId: 'BEREAVEMENT_FUND',
        amount: 300000,
        beneficiary: 'Familia ya Marehemu Mzee Kileo (Moshi)',
        purpose: 'Mkono wa pole na rambirambi rasmi ya jumuiya',
        makerId: 'usr-2',
        makerName: 'Grace Massawe (Mhasibu)',
        checkerId: null,
        checkerName: null,
        status: 'PENDING_CHECKER',
        createdAt: now,
        decidedAt: null
      }
    ],
    welfareCases: [
      {
        id: 'wlf-1',
        type: 'RAMBIRAMBI',
        title: 'Pole kwa Familia ya Mzee Kileo — Uru, Moshi',
        memberName: 'Familia ya Kileo',
        fundId: 'BEREAVEMENT_FUND',
        targetAmount: 1500000,
        collectedAmount: 1120000,
        status: 'ACTIVE',
        details: 'Mazishi yatafanyika Jumamosi Uru Shimbwe. Wanachama wanaombwa kuwasilisha rambirambi kupitia Mfuko wa Rambirambi.'
      },
      {
        id: 'wlf-2',
        type: 'HARUSI',
        title: 'Harusi ya Mwanachama Brian Tarimo & Joyce Mlay',
        memberName: 'Brian Tarimo (WFC-2026-0019)',
        fundId: 'WEDDING_FUND',
        targetAmount: 2000000,
        collectedAmount: 1620000,
        status: 'ACTIVE',
        details: 'Sherehe itafanyika Mbezi Beach Garden, Dar es Salaam. Michango inapokelewa kwenye Mfuko wa Harusi.'
      }
    ],
    events: [
      {
        id: 'evt-1',
        title: 'WFC Annual Cultural Festival 2026',
        date: '2026-12-27',
        venue: 'Moshi Club Grounds, Kilimanjaro',
        ticketPrice: 25000,
        fundId: 'FESTIVAL_FUND',
        availableSeats: 250,
        description: 'Tamasha kubwa la utamaduni, vyakula vya asili, ngoma, na fursa za uwekezaji.'
      },
      {
        id: 'evt-2',
        title: 'Kilimanjaro Heritage & Waterfall Tour',
        date: '2026-12-12',
        venue: 'Materuni & Marangu Gate',
        ticketPrice: 45000,
        fundId: 'TOURS_FUND',
        availableSeats: 60,
        description: 'Safari ya pamoja ya wanachama kutembelea maporomoko ya Materuni na makumbusho ya Wachagga.'
      }
    ],
    tickets: [
      {
        id: 'tkt-1',
        ticketCode: 'WFC-TKT-88412',
        eventId: 'evt-1',
        eventTitle: 'WFC Annual Cultural Festival 2026',
        userId: 'usr-4',
        memberName: 'Neema Mushi',
        wfcId: 'WFC-2026-0004',
        quantity: 2,
        totalPaid: 50000,
        txRef: 'MP261110.1400.T112',
        status: 'CONFIRMED',
        createdAt: now
      }
    ],
    announcements: [
      {
        id: 'ann-1',
        title: 'Uzinduzi wa Mfumo Mpya wa Kidijitali (WFC Portal v3)',
        category: 'TAARIFA RASMI',
        author: 'Uongozi Mkuu wa WFC',
        content: 'Wanachama wote sasa wanaweza kulipia ada ya usajili (TSh 1,000), kufuatilia salio la kila mfuko kwa uwazi (Segregated Accounting), na kurejesha nenosiri kupitia barua pepe.',
        createdAt: now
      },
      {
        id: 'ann-2',
        title: 'Gawio na Uwekezaji wa Pamoja wa UTT AMIS & SACCOS',
        category: 'UWEKEZAJI',
        author: 'Kamati ya Fedha & Uchumi',
        content: 'Dirisha la kuongeza hisa za SACCOS na vipande vya UTT AMIS lipo wazi. Wasilisha risiti yako kupitia sehemu ya Uhakiki wa Malipo.',
        createdAt: now
      }
    ],
    projects: [
      { id: 'prj-1', code: 'WCSC', name: 'Wachagga Community Social Welfare (WCSC)', fundId: 'WCSC_FUND', progress: 82, lead: 'Kamati ya Ustawi', summary: 'Mfuko endelevu wa kusaidia elimu ya watoto na bima ya afya ya jamii.' },
      { id: 'prj-2', code: 'SACCOS', name: 'WFC SACCOS Ltd', fundId: 'SACCOS_FUND', progress: 90, lead: 'Bodi ya SACCOS', summary: 'Utoaji wa mikopo nafuu ya biashara na maendeleo kwa wanachama hai.' },
      { id: 'prj-3', code: 'UTT AMIS', name: 'Mpango wa Uwekezaji UTT AMIS', fundId: 'UTT_AMIS_FUND', progress: 75, lead: 'Kamati ya Uwekezaji', summary: 'Uwekezaji wa pamoja katika mifuko ya Umoja na Wekeza Maisha.' },
      { id: 'prj-4', code: 'TOURS', name: 'Community Tours & Utalii wa Ndani', fundId: 'TOURS_FUND', progress: 68, lead: 'Kamati ya Utalii', summary: 'Ziara za kihistoria na kimazingira mkoani Kilimanjaro na kanda zote.' },
      { id: 'prj-5', code: 'QUEENS', name: 'WFC Queens Empowerment', fundId: 'QUEENS_FUND', progress: 85, lead: 'Umoja wa Wanawake WFC', summary: 'Mafunzo ya ujasiriamali, mitaji na uongozi kwa wanawake.' },
      { id: 'prj-6', code: 'FESTIVAL', name: 'WFC Cultural Festival', fundId: 'FESTIVAL_FUND', progress: 72, lead: 'Kamati ya Maandalizi', summary: 'Tamasha la kila mwaka linalokutanisha wanachama kutoka ndani na nje ya Tanzania.' }
    ]
  };
}

function loadDB() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    const initial = createInitialData();
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    const fallback = createInitialData();
    fs.writeFileSync(DB_PATH, JSON.stringify(fallback, null, 2), 'utf8');
    return fallback;
  }
}

function saveDB(db) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tmpPath = DB_PATH + '.tmp';
  fs.writeFileSync(tmpPath, JSON.stringify(db, null, 2), 'utf8');
  fs.renameSync(tmpPath, DB_PATH);
}

module.exports = {
  loadDB,
  saveDB,
  hashPassword,
  verifyPassword,
  normalizePhone
};
