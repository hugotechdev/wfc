"use strict";

const EMBED_HOSTS = new Set(["www.facebook.com", "www.instagram.com", "www.tiktok.com", "www.youtube-nocookie.com", "www.linkedin.com"]);
const SOCIAL_NETWORK_NAMES = new Set(["Facebook", "Instagram", "TikTok", "YouTube", "LinkedIn"]);

function socialSlideCard(social) {
  if (!social || !SOCIAL_NETWORK_NAMES.has(social.network)) return "";
  const source = safePublicLink(social.url);
  if (!source?.startsWith("https://")) return "";
  return `<div class="social-slide-card">
    <div class="social-slide-source"><span aria-hidden="true">${publicEscape(social.network.slice(0, 1))}</span>
      <div><strong>${publicEscape(social.network)}</strong>${social.publishedDate ? `<time>${publicEscape(social.publishedDate)}</time>` : ""}</div>
    </div>
    <div class="social-slide-actions">
      ${social.embedUrl ? `<button class="btn btn-sm ghost" type="button" data-social-embed="${publicEscape(social.embedUrl)}" data-network="${social.network}">Tazama hapa</button>` : ""}
      <a class="btn btn-sm ghost" href="${publicEscape(source)}" target="_blank" rel="noopener noreferrer">Fungua chapisho</a>
    </div>
    <div class="social-slide-embed"></div>
  </div>`;
}

document.addEventListener("click", event => {
  const button = event.target.closest("[data-social-embed]");
  if (!button) return;
  let url;
  try { url = new URL(button.dataset.socialEmbed); } catch { return; }
  if (url.protocol !== "https:" || !EMBED_HOSTS.has(url.hostname)) return;
  const card = button.closest(".social-slide-card");
  const frame = document.createElement("iframe");
  frame.src = url.href;
  frame.title = button.dataset.network;
  frame.allowFullscreen = true;
  frame.allow = "encrypted-media; picture-in-picture; fullscreen";
  frame.referrerPolicy = "strict-origin-when-cross-origin";
  frame.setAttribute("sandbox", "allow-scripts allow-same-origin allow-presentation allow-popups allow-forms");
  if (button.dataset.network === "YouTube") frame.className = "social-video-wide";
  card.querySelector(".social-slide-embed").replaceChildren(frame);
  card.dispatchEvent(new CustomEvent("social-embed-open", { bubbles: true }));
  button.remove();
  frame.focus();
});

function announcementSlides(announcements, events) {
  const eventIndex = new Map(events.map(event => [event.id, event]));
  const linked = new Set(announcements.map(item => item.eventId));
  return [
    ...announcements.map(item => ({ ...item, event: eventIndex.get(item.eventId) })),
    ...events.filter(event => !linked.has(event.id)).map(event => ({
      title: event.title, body: event.description, createdAt: event.createdAt, event
    }))
  ].sort((a, b) => (Date.parse(b.social?.publishedDate || b.createdAt) || 0)
    - (Date.parse(a.social?.publishedDate || a.createdAt) || 0));
}

function announcementPoster(source, title, className = "") {
  return typeof source === "string" && /^data:image\/(?:jpeg|png|webp);base64,[a-z0-9+/=]+$/i.test(source)
    ? `<img class="${className}" src="${publicEscape(source)}" alt="${publicEscape(title)}">` : "";
}

function mountAnnouncementCarousel(container, slides, render) {
  const stage = container.querySelector("[data-carousel-stage]");
  const controls = container.querySelector("[data-carousel-controls]");
  const dots = container.querySelector("[data-carousel-dots]");
  const toggle = container.querySelector("[data-carousel-toggle]");
  const motion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  let timer;
  let index = 0;
  const setRotation = enabled => {
    clearInterval(timer);
    timer = null;
    stage.setAttribute("aria-live", enabled ? "off" : "polite");
    toggle.textContent = enabled ? "Sitisha" : "Endesha slaidi";
    if (enabled && slides.length > 1) {
      timer = setInterval(() => {
        if (!container.isConnected) { dispose(); return; }
        if (!document.hidden && !stage.matches(":hover") && !stage.contains(document.activeElement)) show(index + 1);
      }, 7500);
    }
  };
  const show = requested => {
    index = (requested + slides.length) % slides.length;
    render(slides[index]);
    dots.querySelectorAll("button").forEach((button, i) => {
      button.classList.toggle("on", i === index);
      button.setAttribute("aria-pressed", String(i === index));
    });
  };
  const go = requested => { setRotation(false); show(requested); };
  const pause = () => setRotation(false);
  const respectMotion = event => { if (event.matches) pause(); };
  const dispose = () => {
    clearInterval(timer);
    stage.removeEventListener("social-embed-open", pause);
    motion?.removeEventListener?.("change", respectMotion);
  };
  if (!slides.length) return dispose;
  controls.hidden = slides.length < 2;
  dots.innerHTML = slides.length > 1 ? slides.map((_, n) =>
    `<button class="dot" type="button" aria-label="Slaidi ${n + 1}"></button>`).join("") : "";
  dots.querySelectorAll("button").forEach((button, n) => button.onclick = () => go(n));
  container.querySelector("[data-carousel-previous]").onclick = () => go(index - 1);
  container.querySelector("[data-carousel-next]").onclick = () => go(index + 1);
  toggle.onclick = () => setRotation(!timer);
  stage.addEventListener("social-embed-open", pause);
  motion?.addEventListener?.("change", respectMotion);
  show(0);
  setRotation(slides.length > 1 && !motion?.matches);
  return dispose;
}
