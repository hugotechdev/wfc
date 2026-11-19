"use strict";

// UI labels are translated locally. Member details and group content are stored as entered.
const englishLabels = new Map(`
Thibitisha OTP|Verify OTP
Ingiza msimbo wa tarakimu 6 uliotumwa kwako. Unaisha baada ya dakika 5.|Enter the six-digit code sent to you. It expires in five minutes.
SMS haijaunganishwa. Msimbo wa majaribio:|SMS is not connected. Test code:
Msimbo wa OTP|OTP code
Thibitisha na Ingia|Verify and sign in
Ingia|Sign in
◐ Mandhari|◐ Theme
◐ Mwanga|◐ Theme
Ingia kwa namba ya simu na nenosiri lako.|Sign in with your phone number and password.
Namba ya Simu|Phone number
Nenosiri|Password
Ingia kwenye Akaunti|Sign in
Huna akaunti?|New here?
Jisajili sasa|Register now
Tovuti kuu|Main website
Usajili wa Mwanachama|Member registration
Ada ya usajili:|Registration fee:
Jina Kamili|Full name
Kanda|Region
Namba ya muamala|Transaction reference
Namba ya Muamala|Transaction reference
Kanuni za kikundi|Group rules
Nimesoma na ninakubali kanuni.|I have read and accept the rules.
Wasilisha Usajili|Submit registration
Tayari una akaunti?|Already have an account?
Rudi Kuingia|Back to sign in
Akaunti haijawa hai|Account not active
Inasubiri Idhini|Awaiting approval
Inasubiri idhini|Awaiting approval
Ombi lako la usajili limepokelewa. Subiri viongozi waidhinishe akaunti yako na kukupatia namba ya uanachama.|Your application was received. A group leader will review it before issuing your membership number.
Habari|Hello
Karibu|Welcome
Toka nje|Sign out
Menyu|Menu
Dashibodi|Dashboard
Akaunti yangu|My account
Wasifu wangu|My profile
Mipangilio ya akaunti|Account settings
Badili nenosiri|Change password
Nyumbani|Home
Michango|Contributions
Matukio|Events
Zaidi|More
Jina|Name
Simu|Phone
Namba ya uanachama|Membership number
Namba ya uanachama:|Membership no.:
Jukumu|Role
Muonekano wa akaunti|Account appearance
Badili mandhari ya portal kwenye kifaa hiki.|Change the portal theme on this device.
Badili mandhari|Change theme
Nenosiri la sasa|Current password
Nenosiri jipya|New password
Hifadhi nenosiri|Save password
Jumla Uliyochanga|Your total contributions
Hatua za haraka|Quick actions
Kitambulisho|Member ID
Arifa|Notifications
Muhtasari wa jumuiya|Community overview
Hai|Active
Mwanachama hai|Active member
Wanachama Hai|Active members
Wanachama hai|Active members
Walioidhinishwa kwenye kanda zote|Approved members across all regions
Inahitaji hatua|Needs attention
Safi|Up to date
Maombi mapya ya uanachama|New membership applications
Miamala|Transactions
Malipo Yote|All payments
Michango iliyorekodiwa|Recorded contributions
Ratiba|Schedule
Sherehe, mikutano na misiba|Celebrations, meetings and bereavements
Fedha za jumuiya|Community finances
+ Mapato|+ Income
Mapato Yote|Total income
Michango + mapato ya ziada|Contributions and other income
- Matumizi|- Expenses
Matumizi|Expenses
Misaada na uendeshaji wa ofisi|Support and operating costs
Salio|Balance
Salio halisi|Net balance
Fedha iliyopo mkononi / benki|Cash and bank balance
Madeni ya Ada|Outstanding fees
Limbikizo la ada za kila mwezi|Unpaid monthly fees
Kanda za Wanachama|Member regions
Hakuna data ya kanda bado|No regional data yet
Malipo ya Hivi Karibuni|Recent payments
Tazama yote →|See all →
Jina la Mwanachama|Member name
Aina ya Mchango|Contribution type
Kiasi|Amount
Hali|Status
Hakuna malipo yaliyorekodiwa bado|No payments recorded yet
Imeidhinishwa|Approved
Imethibitishwa|Verified
Inasubiri|Pending
Imesimamishwa|Suspended
Ujumbe|Message
Idhinisha|Approve
Simamisha|Suspend
Ondoa|Remove
Hakuna mwanachama aliyepatikana|No members found
Salio la ada|Outstanding fees
Jumla ya ada inayotarajiwa|Total fees due
Ada iliyothibitishwa|Verified fee payments
Malipo yanayosubiri uhakiki|Payments awaiting review
Wasilisha Malipo Mapya|Submit a payment
Ada ya mwezi|Monthly fee
Kiingilio|Joining fee
Dharura|Emergency
Msiba|Bereavement
Kiasi (TSh)|Amount (TSh)
Wasilisha Malipo|Submit payment
Historia ya Michango|Contribution history
Mwanachama|Member
Wanachama|Members
wanachama|members
1 mwanachama|1 member
Tafuta wanachama|Search members
Tafuta jina, simu, kanda au Namba ya uanachama...|Search name, phone, region or membership number…
wanadaiwa|with outstanding fees
kanda|regions
1 kanda|1 region
Msimamizi|Administrator
miamala|transactions
wanasubiri|pending
Aina|Type
Muamala|Transaction
Hatua|Action
Pakua risiti|Download receipt
Hakuna historia ya malipo|No payment history
Ongeza Tukio Jipya|Add event
Aina ya Tukio|Event type
Harusi|Wedding
Kichwa cha Tukio|Event title
Eneo|Location
Bei ya Tiketi (TSh)|Ticket price (TSh)
Poster (picha ≤ 1.2MB)|Poster (image ≤ 1.2 MB)
Chapisha Tukio|Publish event
Orodha ya Matukio|Events
Hakuna matukio yaliyorekodiwa|No events recorded
Tangazo Jipya|New announcement
Kichwa|Title
Kiungo (hiari)|Link (optional)
Chapisha Tangazo|Publish announcement
Matangazo Yaliyochapishwa|Published announcements
Hakuna matangazo|No announcements
Pakua / Chapisha Kitambulisho|Download or print ID
Taarifa za Familia|Family details
Familia|Family
Kumbukumbu za Ukoo|Family records
Mkuu wa Familia|Head of household
Mke / Mume|Spouse
Watoto (tenganisha kwa koma)|Children (comma-separated)
Hifadhi Taarifa|Save details
Sasisha Taaluma Yako|Update your occupation
Taaluma / Kazi|Occupation
Hifadhi|Save
Directory ya Wanachama|Member directory
Taaluma|Occupation
Hakuna taarifa bado|No records yet
Omba Msaada wa Ofisi|Request support
Mada|Subject
Maelezo ya Ujumbe|Message details
Wasilisha Ombi|Submit request
Maombi Yako|Your requests
Hakuna maombi ya msaada|No support requests
Thibitisha Mahudhurio|Confirm attendance
Jina la Mkutano|Meeting name
Saini Mahudhurio (Nipo)|Mark me present
Orodha ya Waliohudhuria|Attendance list
Hakuna mahudhurio bado|No attendance recorded
Fungua Nafasi ya Uchaguzi|Create an election
Nafasi ya Uongozi|Leadership position
Fungua Uchaguzi|Open election
Chaguzi Zinazoendelea|Current elections
Hakuna uchaguzi uliowekwa|No elections scheduled
Sajili Kesi / Shauri|File a case
Mada ya Shauri|Case subject
Maelezo Kamili|Full details
Wasilisha Shauri|Submit case
Orodha ya Kesi|Cases
Hakuna kesi zilizosajiliwa|No cases recorded
SACCOS — Nunua Hisa|SACCOS — Buy shares
Kiasi cha Hisa (TSh)|Share amount (TSh)
Wasilisha Hisa|Submit share purchase
Kumbukumbu za Hisa|Share records
Ununuzi wa Hisa|Share purchase
Hakuna hisa zilizorekodiwa bado|No shares recorded
Sajili Mali ya Jumuiya|Register a community asset
Jina la Mali|Asset name
Thamani (TSh)|Value (TSh)
Eneo Ilipo|Location
Hifadhi Mali|Save asset
Daftari la mali za kikundi|Group asset register
Hakuna mali zilizosajiliwa|No assets recorded
Ongeza Mradi wa Maendeleo|Add a development project
Jina la Mradi|Project name
Maendeleo (%)|Progress (%)
Hifadhi Mradi|Save project
Miradi ya Jumuiya|Community projects
Hakuna miradi iliyowekwa|No projects recorded
Rekodi Faini|Record fine
Sababu ya Faini|Reason for fine
Hifadhi Faini|Save fine
Orodha ya Faini|Fines
Hakuna faini zilizorekodiwa|No fines recorded
Nyaraka Kuu|Key documents
Soma Katiba →|Read constitution →
Maktaba ya Nyaraka|Document library
Fungua nyaraka →|Open document →
Hakuna nyaraka nyingine|No other documents
Ongeza Nyaraka Mpya|Add document
Jina la Nyaraka|Document name
Kiungo (URL)|Link (URL)
Maelezo mafupi|Brief description
Hifadhi Nyaraka|Save document
Maombi Yanayosubiri Idhini|Applications awaiting approval
Muamala wa usajili|Registration payment reference
Idhinisha Mwanachama|Approve member
Hakuna maombi yanayosubiri|No pending applications
Wanachama kwa Kanda|Members by region
Makusanyo kwa Aina (TSh)|Collections by type (TSh)
Mapato|Income
Tuma Ujumbe kwa Mwanachama|Message a member
Kituo cha Mawasiliano|Communications
Barua pepe|Email
Mpokeaji|Recipient
Tuma Ujumbe|Send message
Bila funguo za API, WhatsApp inafunguliwa moja kwa moja na barua pepe inafungua programu yako.|Without API keys, WhatsApp and email open in their own apps.
Kumbukumbu za Ujumbe (Outbox)|Message outbox
Hakuna ujumbe uliotumwa|No messages sent
Omba Malipo ya Simu (STK Push)|Request a mobile payment
Tuma Ombi la STK|Send payment request
Weka Namba ya Muamala|Enter transaction reference
Wasilisha kwa Idhini|Submit for approval
Pakua CSV|Download CSV
Hakuna rekodi bado.|No records yet.
Mipangilio ya kikundi|Group settings
Utambulisho|Group identity
Maelezo ya kikundi|Group description
Nembo (PNG, JPG au WebP, KB 500)|Logo (PNG, JPG or WebP, 500 KB)
Ondoa nembo iliyopo|Remove current logo
Kanuni na ada|Rules and fees
Kanuni na taratibu|Rules and procedures
Ada ya usajili (TSh)|Registration fee (TSh)
Ada ya mwezi (TSh)|Monthly fee (TSh)
Vipengele na mwaliko|Features and invitation
Chagua vipengele vinavyotumika kwenye kikundi hiki.|Choose which features the group uses.
Kiungo cha kuwaalika wanachama|Member invitation link
Nakili kiungo|Copy link
Rudi|Back
Endelea|Continue
Hifadhi mipangilio ya kikundi|Save group settings
Funguo za Huduma (API Integrations)|Service keys and integrations
Hifadhi Mipangilio|Save settings
Usimamizi wa Viongozi (RBAC)|Leadership and permissions
Tuma Taarifa kwa Wanachama|Notify members
Kichwa cha Taarifa|Notification title
Tuma kwa Wote|Send to everyone
Taarifa Zilizopo|Notifications
Mpya|New
Hakuna taarifa|No notifications
Matumizi Yote|Total expenses
Madeni|Debts
Ongeza Matumizi|Add expense
Misaada|Support
Ofisi|Office
Nyingine|Other
Ongeza Mapato ya Ziada|Add other income
Chanzo|Source
Ongeza Mapato|Add income
Ada za mwezi|Monthly fees
Deni|Amount due
Hakuna madeni|No outstanding fees
Kumbukumbu za Matumizi|Expense records
Hakuna matumizi|No expenses
Mapato ya Ziada|Other income
Hakuna mapato ya ziada|No other income
Ofisi ya kidijitali|Digital office
Kuhusu|About
Matangazo|Announcements
Mawasiliano|Contact
Ingia Portal|Sign in
Fungua akaunti|Create an account
Tazama matukio|See events
Matukio hai|Active events
Ofisi ya mtandaoni|Online office
Malipo ya Haraka|Quick payments
Risiti & Kitambulisho|Receipts and member IDs
QR Code Otomatiki|Automatic QR codes
Kuhusu sisi|About us
Jumuiya inayokumbuka, inayosaidia, na inayokua pamoja.|A community that remembers, supports and grows together.
Uanachama|Membership
Kila mwanachama aliyeidhinishwa hupata namba ya uanachama.|Each approved member receives a membership number.
Matukio ya kikundi|Group events
Msiba, ugonjwa na harusi vinafuatiliwa kwa utaratibu maalum na haraka.|The group coordinates support for bereavements, illness and weddings.
Uwazi wa Kifedha|Financial transparency
Michango ina risiti za PDF zenye QR, idhini ya mhazini, na historia inayosomeka muda wowote.|Track contributions, treasurer approvals and PDF receipts with QR codes.
Habari zinazosonga.|Latest news
Yajayo na yanayoendelea.|Current and upcoming events
Tuandikie moja kwa moja.|Send us a message.
Barua pepe (hiari)|Email (optional)
Ujumbe wako|Your message
Tuma ujumbe|Send message
Makao Makuu|Head office
Simu ya ofisi|Office phone
Njia za malipo|Payment methods
Ingia kwenye Portal|Sign in
Taarifa|Notifications
Hakuna matangazo mapya kwa sasa|No new announcements
Viongozi watayachapisha matangazo muhimu hapa.|Group leaders will post important announcements here.
Fungua taarifa|Read announcement
Tukio la kikundi|Group event
Kata tiketi|Book a ticket
Hakuna matukio yaliyotangazwa kwa sasa.|No events have been announced.
Ujumbe umepokelewa. Tutawasiliana nawe.|Message received. We will get back to you.
Imeshindwa kutuma. Jaribu tena.|Could not send. Please try again.
Kata Tiketi|Book a ticket
Idadi ya Tiketi|Number of tickets
Lipa kupitia|Pay through
Namba ya Muamala (Transaction ID)|Transaction reference
Wasilisha Tiketi|Submit ticket request
← Rudi kwenye ukurasa mkuu|← Back to the homepage
Tukio halijapatikana au limefungwa.|The event could not be found or is closed.
/ tiketi|/ ticket
Tiketi imewasilishwa kikamilifu! Subiri uthibitisho.|Ticket request received. Please wait for confirmation.
Kila siku|Overview
Maombi ya uanachama|Membership applications
Ripoti na historia|Reports and history
Msaada|Support
Mahudhurio|Attendance
Uchaguzi|Elections
Kesi|Cases
Mali|Assets
Miradi|Projects
Faini|Fines
Nyaraka|Documents
Majukumu|Roles
Grafu|Charts
Grafu na Takwimu|Charts and statistics
Malipo ya simu|Mobile payments
Uhasibu|Accounting
Mipangilio|Settings
Tiketi|Tickets
Badili lugha|Change language
Menyu kuu|Main menu
Menyu ya haraka|Quick navigation
Linganisha namba ya muamala na malipo yaliyopokelewa kabla ya kuidhinisha.|Match the reference to the received payment before approving.
Nenosiri limebadilishwa.|Password changed.
Muunganisho umekatika. Jaribu tena.|Connection lost. Try again.
Fungua menyu|Open menu
Kunja au fungua menyu|Collapse or expand menu
Badili mwanga|Change theme
Andika eneo lako|Enter your location
Unda nenosiri imara|Create a strong password
Andika jina lako|Enter your name
Andika ujumbe au swali lako hapa...|Enter your message or question…
Mlinganisho wa Mapato na Matumizi|Income and expenses
Mgawanyo wa Wanachama kwa Kanda|Members by region
Hakuna muamala|No transactions
Michango iliyoidhinishwa|Approved contributions
Madeni ya ada|Outstanding fees
Historia ya idhini|Approval history
Tarehe|Date
Aliyeidhinisha|Approved by
Rejea|Reference
Risiti|Receipt
Iliyolipwa (TSh)|Paid (TSh)
Deni (TSh)|Amount due (TSh)
Jina la kikundi|Group name
Kifupi cha jina|Short name
Kaulimbiu|Motto
Simu ya mawasiliano|Contact number
Wasiliana na uongozi kupata maelekezo ya malipo.|Contact a group leader for payment instructions.
Umoja wa Wachagga, nguvu ya familia|Chagga unity, family strength
Ofisi ya kidijitali ya wanachama, michango na matukio.|A digital office for members, contributions and events.
Taarifa si sahihi|Incorrect sign-in details
Taarifa za malipo hazikupatikana.|Payment details could not be loaded.
Usajili umepokelewa. Subiri idhini.|Registration received. Please wait for approval.
Namba tayari imesajiliwa|This phone number is already registered
Huna mamlaka|You do not have permission
Picha ya wasifu|Profile photo
Chagua picha inayoonyesha uso wako vizuri. Itaonekana kwenye kitambulisho.|Choose a clear front-facing photo. It will appear on your member ID.
Hifadhi picha|Save photo
Picha imehifadhiwa.|Photo saved.
Picha haikuhifadhiwa.|Photo could not be saved.
Picha haikubaliki au ni kubwa sana.|The photo is invalid or too large.
Picha iwe angalau pikseli 96 kwa 96.|Use a photo at least 96 by 96 pixels.
Chagua picha ya JPG, PNG au WebP isiyozidi MB 8.|Choose a JPG, PNG or WebP photo up to 8 MB.
Kitambulisho cha mwanachama|Member ID
Pakua kitambulisho (PDF)|Download member ID (PDF)
Tazama kitambulisho|View member ID
Weka picha ya wasifu|Add profile photo
Badili picha ya wasifu|Change profile photo
Weka picha kwenye wasifu kabla ya kupakua kitambulisho.|Add a profile photo before downloading your member ID.
Uanachama hai|Active membership
Hakiki|Verify
Vikao na machapisho|Discussions and posts
Andika chapisho|Create a post
Tangazo|Announcement
Mjadala|Discussion
Chapisha|Publish
Maoni|Comments
Andika maoni|Write a comment
Tuma maoni|Post comment
Hakuna machapisho bado.|No posts yet.
Viongozi pekee wanaweza kuchapisha.|Only leaders can publish posts.
Weka aina, kichwa na ujumbe wa chapisho.|Choose a type and enter a title and message.
Andika maoni yasiyozidi herufi 1500.|Write a comment of up to 1,500 characters.
Chapisho halikupatikana.|Post not found.
Imeshindwa kuhifadhi.|Could not save.
Matangazo, mijadala na maoni ya wanachama.|Announcements, discussions and member comments.
Chuja machapisho|Filter posts
Yote|All
Mijadala|Discussions
Chapisho|Post
Kichwa (hiari)|Title (optional)
Andika ujumbe wa kikundi…|Write a message for the group…
Andika ujumbe au ambatisha faili.|Write a message or attach a file.
Picha au PDF|Photo or PDF
Ondoa faili|Remove attachment
Ambatisha hadi faili nne.|Attach up to four files.
Faili moja lisizidi MB 5 na jumla isizidi MB 8.|Files can be up to 5 MB each and 8 MB in total.
Ambatisha picha au hati ya PDF.|Attach a photo or PDF document.
Hati iliyochaguliwa si PDF halali.|The selected document is not a valid PDF.
Picha iliyochaguliwa haiwezi kusomwa.|The selected photo could not be read.
Inachapisha…|Publishing…
Chapisho limetumwa.|Post published.
Machapisho hayakupatikana.|Posts could not be loaded.
Pakua|Download
`.trim().split("\n").map(line => line.split("|")));

let portalLocale;
try { portalLocale = localStorage.getItem("wfc-language") === "en" ? "en" : "sw"; }
catch { portalLocale = "sw"; }

function tr(swahili, english = englishLabels.get(swahili)) {
  return portalLocale === "en" ? english || swahili : swahili;
}

const originalCopy = new WeakMap();
const uiAttributes = ["aria-label", "title", "placeholder"];
const excludedCopy = '[translate="no"], [data-group-logo], script, style, textarea, code';
const handledAttribute = Symbol("attribute values");

function updateCopy(node, key, original, write) {
  let values = originalCopy.get(node);
  if (!values) originalCopy.set(node, values = new Map());
  const saved = values.get(key);
  const source = saved && saved.last === original ? saved.source : original;
  const text = source.trim();
  if (!text) return;
  const translated = tr(text);
  const value = source.replace(text, () => translated);
  if (source === translated && !saved) return;
  values.set(key, { source, last: value });
  if (original !== value) write(value);
}

function localizeElement(el) {
  if (el.closest(excludedCopy)) return;
  if (el.tagName === "OPTION" && !el.hasAttribute("value")) el.value = el.value;
  for (const name of uiAttributes) {
    const value = el.getAttribute(name);
    if (value !== null) updateCopy(el, name, value, translated => el.setAttribute(name, translated));
  }
}

function localizeText(node) {
  if (node.parentElement && !node.parentElement.closest(excludedCopy)) {
    updateCopy(node, handledAttribute, node.data, value => { node.data = value; });
  }
}

function localizePortal(root = document.body) {
  if (root.nodeType === Node.TEXT_NODE) return localizeText(root);
  if (root.nodeType !== Node.ELEMENT_NODE || root.closest(excludedCopy)) return;
  localizeElement(root);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      return node.nodeType === Node.ELEMENT_NODE && node.matches(excludedCopy)
        ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
    }
  });
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node.nodeType === Node.TEXT_NODE) localizeText(node);
    else localizeElement(node);
  }
}

const languageWidget = document.getElementById("portal_language");
for (const choice of languageWidget.querySelectorAll("[data-language]")) {
  choice.onclick = () => {
    portalLocale = choice.dataset.language;
    try { localStorage.setItem("wfc-language", portalLocale); } catch {}
    refreshLanguage();
    document.dispatchEvent(new Event("portal-language-change"));
  };
}
function refreshLanguage() {
  document.documentElement.lang = portalLocale;
  for (const choice of languageWidget.querySelectorAll("[data-language]")) {
    choice.setAttribute("aria-pressed", String(choice.dataset.language === portalLocale));
  }
  const label = tr("Badili lugha");
  languageWidget.setAttribute("aria-label", label);
  localizePortal();
}

new MutationObserver(records => {
  for (const record of records) {
    if (record.type === "characterData") localizeText(record.target);
    else if (record.type === "attributes") localizeElement(record.target);
    else for (const child of record.addedNodes) localizePortal(child);
  }
}).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: uiAttributes });

refreshLanguage();
