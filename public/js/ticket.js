"use strict";

const ticketForm = document.getElementById("f");
const ticketInfo = document.getElementById("info");
const ticketMoney = value => "TSh " + Number(value).toLocaleString("en-TZ");

function customTicketInput(field) {
  const name = "answer-" + publicEscape(field.id);
  const required = field.required ? "required" : "";
  const control = field.type === "select"
    ? `<select name="${name}" ${required}><option value="">Chagua</option>${field.options.map(option => `<option value="${publicEscape(option)}">${publicEscape(option)}</option>`).join("")}</select>`
    : `<input name="${name}" type="${["email", "number"].includes(field.type) ? field.type : "text"}" maxlength="250" ${field.type === "number" ? 'step="any"' : ""} ${required}>`;
  return `<label class="ticket-extra" translate="no">${publicEscape(field.label)}${control}</label>`;
}

async function showTicketStatus(token) {
  ticketForm.classList.add("hidden");
  const response = await fetch("/api/tickets/status/" + encodeURIComponent(token), { cache: "no-store" });
  const order = await response.json();
  if (!response.ok) throw new Error(order.error);
  const downloadUrl = "/api/tickets/status/" + encodeURIComponent(token) + "/pdf";
  ticketInfo.innerHTML = `<article class="ticket-event-box ticket-confirmation">
    <span class="badge ${order.status === "APPROVED" ? "badge-active" : "badge-pending"}">${order.status === "APPROVED" ? "Tiketi imethibitishwa" : "Inasubiri uhakiki wa malipo"}</span>
    <h2 translate="no">${publicEscape(order.eventName)}</h2>
    <p><span>Jina Kamili</span> <strong translate="no">${publicEscape(order.name)}</strong></p>
    <p><span>Idadi ya Tiketi</span> <strong>${Number(order.qty)}</strong> · <strong>${ticketMoney(order.amount)}</strong></p>
    <p><span>Namba ya ombi</span> <strong class="ticket-reference" translate="no">${publicEscape(order.reference)}</strong></p>
    ${order.receiptNo ? `<p><span>Risiti</span> <strong translate="no">${publicEscape(order.receiptNo)}</strong></p>` : ""}
    <div class="ticket-status-actions">
      <p>Hifadhi kiungo hiki ili kufuatilia tiketi yako.</p>
      ${order.status === "APPROVED" ? `<p>PDF ina QR tofauti kwa kila tiketi.</p><a class="btn" id="downloadApprovedTicket" href="${downloadUrl}?lang=${portalLocale}">Pakua tiketi (PDF)</a>`
        : '<button class="btn" id="refreshTicket" type="button">Angalia hali ya tiketi</button>'}
    </div>
  </article>`;
  const download = document.getElementById("downloadApprovedTicket");
  if (download) download.addEventListener("click", () => { download.href = downloadUrl + "?lang=" + portalLocale; });
  document.getElementById("refreshTicket")?.addEventListener("click", () => location.reload());
}

async function openTicket() {
  const token = new URLSearchParams(location.search).get("order");
  if (token) return showTicketStatus(token);
  const id = location.pathname.split("/").pop();
  const response = await fetch("/api/public/events");
  if (!response.ok) throw new Error("Tukio halijapatikana au limefungwa.");
  const events = await response.json();
  const event = events.find(item => item.id === id && item.ticketEnabled !== false);
  if (!event) throw new Error("Tukio halijapatikana au limefungwa.");
  ticketInfo.innerHTML = `<div class="ticket-event-box"><span class="badge badge-pending">Tukio</span>
    <h2 translate="no">${publicEscape(event.title)}</h2><p class="muted" translate="no">${publicEscape(event.location || "")}</p>
    <div class="ticket-price-tag">${ticketMoney(event.ticketPrice)} <span>/ tiketi</span></div></div>`;
  const fields = event.ticketFields || [];
  document.getElementById("customTicketFields").innerHTML = fields.map(customTicketInput).join("");
  const qty = ticketForm.elements.qty;
  qty.max = 50;
  if (event.ticketPrice > 0) {
    document.getElementById("ticketPayment").hidden = false;
    document.getElementById("ticketProof").innerHTML = manualProofFields();
    const total = document.getElementById("ticketAmount");
    const update = () => { total.textContent = ticketMoney(event.ticketPrice * Number(qty.value || 0)); };
    qty.oninput = update;
    update();
    await groupReady;
    applyGroupProfile(groupProfile);
  }
  const method = ticketForm.elements.deliveryMethod;
  const emailField = document.getElementById("ticketEmailField");
  const email = ticketForm.elements.email;
  const updateDelivery = () => {
    const selected = method.value === "email";
    emailField.hidden = !selected;
    email.disabled = !selected;
    email.required = selected;
  };
  method.onchange = updateDelivery;
  updateDelivery();
  ticketForm.classList.remove("hidden");
  ticketForm.onsubmit = async event => {
    event.preventDefault();
    const status = document.getElementById("m");
    const button = ticketForm.querySelector('[type="submit"]');
    button.disabled = true;
    try {
      const body = await paymentFormData(ticketForm);
      body.eventId = id;
      body.answers = Object.fromEntries(fields.map(field => [field.id, body["answer-" + field.id]]));
      const result = await fetch("/api/tickets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await result.json();
      if (!data.success) throw new Error(data.error);
      history.replaceState(null, "", "?order=" + encodeURIComponent(data.token));
      await showTicketStatus(data.token);
    } catch (error) { status.textContent = error.message || "Imeshindwa kuwasilisha"; }
    finally { button.disabled = false; }
  };
}

openTicket().catch(error => { ticketInfo.textContent = error.message || "Tukio halijapatikana au limefungwa."; });
