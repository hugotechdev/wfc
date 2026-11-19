function ticketMailer(env = process.env, request = fetch) {
  if (!env.RESEND_API_KEY || !env.TICKET_EMAIL_FROM) return null;
  return async (order, link) => {
    const response = await request("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + env.RESEND_API_KEY,
        "Content-Type": "application/json",
        "Idempotency-Key": "event-ticket/" + order.id
      },
      body: JSON.stringify({
        from: env.TICKET_EMAIL_FROM,
        to: [order.email],
        subject: "Tiketi imethibitishwa | Ticket confirmed",
        text: `Tiketi ya ${order.eventName} imeidhinishwa. Pakua tiketi yako yenye QR kupitia kiungo hiki:\n${link}\n\nYour ticket is confirmed. Use this link to download your QR ticket.`
      }),
      signal: AbortSignal.timeout(12000)
    });
    if (!response.ok) return false;
    const result = await response.json();
    return typeof result.id === "string" && Boolean(result.id);
  };
}

module.exports = { ticketMailer };
