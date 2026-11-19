"use strict";

const SOCIAL_TYPES = { announcement: "Tangazo", discussion: "Mjadala" };
const SOCIAL_FILE_LIMIT = 5 * 1024 * 1024;
const SOCIAL_TOTAL_LIMIT = 8 * 1024 * 1024;

async function readSocialFile(file) {
  if (file.size > SOCIAL_FILE_LIMIT) throw new Error("Faili moja lisizidi MB 5 na jumla isizidi MB 8.");
  if (file.type === "application/pdf" || (!file.type && /\.pdf$/i.test(file.name))) {
    const data = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.replace(/^data:[^;]+;/, "data:application/pdf;"));
      reader.onerror = () => reject(new Error("Hati iliyochaguliwa si PDF halali."));
      reader.readAsDataURL(file);
    });
    return { name: file.name, data, photo: false, size: file.size };
  }
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Ambatisha picha au hati ya PDF.");
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const scale = Math.min(1, 1700 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const data = canvas.toDataURL("image/jpeg", 0.86);
    return { name: file.name, data, photo: true, size: Math.ceil(data.split(",")[1].length * 0.75) };
  } catch {
    throw new Error("Picha iliyochaguliwa haiwezi kusomwa.");
  } finally {
    URL.revokeObjectURL(url);
  }
}

function socialAvatar(name) {
  const letter = String(name || "?").trim().slice(0, 1).toUpperCase();
  return `<span class="social-avatar" aria-hidden="true">${escapeHtml(letter)}</span>`;
}

function socialTime(date) {
  const time = new Date(date);
  return Number.isFinite(time.getTime()) ? new Intl.DateTimeFormat(portalLocale === "en" ? "en-TZ" : "sw-TZ", {
    dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Dar_es_Salaam"
  }).format(time) : "";
}

function socialComment(note) {
  return `<article class="post-comment">${socialAvatar(note.author)}
    <div class="social-comment-bubble"><div class="post-byline"><strong translate="no">${escapeHtml(note.author)}</strong>
      <time datetime="${escapeHtml(note.createdAt)}">${socialTime(note.createdAt)}</time></div>
      <p translate="no">${escapeHtml(note.text)}</p></div></article>`;
}

function socialPostCard(post) {
  const id = escapeHtml(post.id);
  const endpoint = "/api/portal-posts/" + encodeURIComponent(post.id);
  const attachmentUrl = file => endpoint + "/attachments/" + encodeURIComponent(file.id);
  const images = (post.attachments || []).filter(file => file.type === "image/jpeg");
  const documents = (post.attachments || []).filter(file => file.type === "application/pdf");
  return `<article class="card portal-post" data-post-id="${id}" data-post-type="${escapeHtml(post.type)}">
    <header class="social-post-header">${socialAvatar(post.author)}
      <div class="social-author"><strong translate="no">${escapeHtml(post.author)}</strong>
      <time datetime="${escapeHtml(post.createdAt)}">${socialTime(post.createdAt)}</time></div>
      <span class="social-type">${SOCIAL_TYPES[post.type] || "Chapisho"}</span>
    </header>
    ${post.title ? `<h3 translate="no">${escapeHtml(post.title)}</h3>` : ""}
    ${post.text ? `<p class="post-text" translate="no">${escapeHtml(post.text)}</p>` : ""}
    ${images.length ? `<div class="social-images ${images.length === 1 ? "single" : ""}">
      ${images.map(file => `<a href="${escapeHtml(attachmentUrl(file))}" target="_blank" rel="noopener noreferrer">
        <img loading="lazy" src="${escapeHtml(attachmentUrl(file))}" alt="${escapeHtml(file.name)}"></a>`).join("")}
    </div>` : ""}
    ${documents.length ? `<div class="social-documents">
      ${documents.map(file => `<a class="social-document" href="${escapeHtml(attachmentUrl(file))}" download>
        <span class="social-file-icon">${IC.file}</span>
        <span><strong translate="no">${escapeHtml(file.name)}</strong><small>PDF · ${Math.max(1, Math.ceil(file.size / 1024))} KB</small></span>
        <span class="social-download">Pakua</span>
      </a>`).join("")}</div>` : ""}
    <div class="social-engagement">
      <span><span class="social-heart-count" aria-hidden="true">♥</span> <span data-like-count>${Number(post.likeCount || 0)}</span></span>
      <button class="social-comment-count" type="button" data-social-comments aria-expanded="false" aria-controls="social-comments-${id}">
        <span data-comment-count>${post.comments.length}</span> <span>Maoni</span></button>
    </div>
    <div class="social-actions">
      <button type="button" data-social-like aria-pressed="${Boolean(post.liked)}"><span data-heart aria-hidden="true">${post.liked ? "♥" : "♡"}</span> Like</button>
      <button type="button" data-social-comments aria-expanded="false" aria-controls="social-comments-${id}">${IC.book}<span>Maoni</span></button>
    </div>
    <p class="social-action-status" role="status"></p>
    <section class="social-comments" id="social-comments-${id}" hidden>
      <div class="post-comments">${post.comments.map(socialComment).join("")}</div>
      <form class="portal-comment-form" method="post">
        <label for="reply-${id}" class="social-visually-hidden">Andika maoni</label>
        <textarea id="reply-${id}" name="text" rows="1" maxlength="1500" placeholder="Andika maoni" required></textarea>
        <button class="btn btn-sm" type="submit">Tuma maoni</button><p role="status"></p>
      </form>
    </section>
  </article>`;
}

function wireSocialPost(card) {
  const endpoint = "/api/portal-posts/" + encodeURIComponent(card.dataset.postId);
  const like = card.querySelector("[data-social-like]");
  const status = card.querySelector(".social-action-status");
  like.onclick = async () => {
    like.disabled = true;
    status.textContent = "";
    try {
      const result = await api(endpoint + "/like", { method: "PUT", body: { liked: like.getAttribute("aria-pressed") !== "true" } });
      if (!result.success) throw new Error(result.error || "Imeshindwa kuhifadhi.");
      like.setAttribute("aria-pressed", String(result.liked));
      like.querySelector("[data-heart]").textContent = result.liked ? "♥" : "♡";
      card.querySelector("[data-like-count]").textContent = result.likeCount;
    } catch (error) {
      status.textContent = error.message;
    } finally {
      like.disabled = false;
    }
  };
  const thread = card.querySelector(".social-comments");
  const toggles = card.querySelectorAll("[data-social-comments]");
  const form = thread.querySelector("form");
  for (const button of toggles) button.onclick = () => {
    thread.hidden = !thread.hidden;
    for (const toggle of toggles) toggle.setAttribute("aria-expanded", String(!thread.hidden));
    if (!thread.hidden) form.elements.text.focus();
  };
  form.onsubmit = async event => {
    event.preventDefault();
    const text = form.elements.text.value.trim();
    if (!text) return;
    const submit = form.querySelector('button[type="submit"]');
    const status = form.querySelector("[role=status]");
    submit.disabled = true;
    status.textContent = "";
    try {
      const result = await api(endpoint + "/comments", { method: "POST", body: { text } });
      if (!result.success) throw new Error(result.error || "Imeshindwa kuhifadhi.");
      thread.querySelector(".post-comments").insertAdjacentHTML("beforeend", socialComment(result.comment));
      const count = card.querySelector("[data-comment-count]");
      count.textContent = String(Number(count.textContent) + 1);
      if (form.elements.text.value.trim() === text) form.reset();
    } catch (error) {
      status.textContent = error.message;
    } finally {
      submit.disabled = false;
    }
  };
}

function wireSocialComposer(form, saved) {
  const files = form.querySelector("#socialFiles");
  const attachments = [];
  const preview = form.querySelector(".social-upload-preview");
  const status = form.querySelector("[role=status]");
  const publish = form.querySelector('button[type="submit"]');
  const render = () => {
    preview.innerHTML = attachments.map((file, index) => `<div class="social-upload-item">
      ${file.photo ? `<img src="${escapeHtml(file.data)}" alt="">` : `<span class="social-file-icon">${IC.file}</span>`}
      <span translate="no">${escapeHtml(file.name)}</span>
      <button type="button" data-remove-attachment="${index}" aria-label="Ondoa faili">×</button></div>`).join("");
    for (const button of preview.querySelectorAll("[data-remove-attachment]")) {
      button.onclick = () => { attachments.splice(Number(button.dataset.removeAttachment), 1); render(); };
    }
  };
  files.onchange = async () => {
    const selected = [...files.files];
    files.value = "";
    if (!selected.length) return;
    status.textContent = "";
    files.disabled = publish.disabled = true;
    try {
      if (selected.length + attachments.length > 4) throw new Error("Ambatisha hadi faili nne.");
      const loaded = await Promise.all(selected.map(readSocialFile));
      if ([...attachments, ...loaded].reduce((total, file) => total + file.size, 0) > SOCIAL_TOTAL_LIMIT) {
        throw new Error("Faili moja lisizidi MB 5 na jumla isizidi MB 8.");
      }
      attachments.push(...loaded);
      render();
    } catch (error) {
      status.textContent = error.message;
    } finally {
      files.disabled = publish.disabled = false;
    }
  };
  form.onsubmit = async event => {
    event.preventDefault();
    if (publish.disabled) return;
    const body = Object.fromEntries(new FormData(form));
    body.title = body.title.trim();
    body.text = body.text.trim();
    if (!body.title && !body.text && !attachments.length) {
      status.textContent = "Andika ujumbe au ambatisha faili.";
      return;
    }
    body.attachments = attachments.map(({ name, data }) => ({ name, data }));
    files.disabled = publish.disabled = true;
    status.textContent = "Inachapisha…";
    try {
      const result = await api("/api/portal-posts", { method: "POST", body });
      if (!result.success) throw new Error(result.error || "Imeshindwa kuhifadhi.");
      form.reset();
      attachments.length = 0;
      render();
      status.textContent = "Chapisho limetumwa.";
      saved(result.post);
    } catch (error) {
      status.textContent = error.message;
    } finally {
      files.disabled = publish.disabled = false;
    }
  };
}

function renderSocialFeed(container, posts, user) {
  container.innerHTML = `<section class="portal-feed">
    <header class="social-feed-heading"><span class="social-feed-mark">${IC.users}</span>
      <div><h2>Social Post</h2><p>Matangazo, mijadala na maoni ya wanachama.</p></div>
    </header>
    ${canViewReports(user.role) ? `<details class="card social-composer">
      <summary>${socialAvatar(user.name)}<span>Andika chapisho</span><span class="social-compose-plus" aria-hidden="true">+</span></summary>
      <form method="post" id="portalPostForm">
        <div class="social-composer-fields"><div><label for="portalPostType">Aina</label>
          <select name="type" id="portalPostType"><option value="announcement">Tangazo</option><option value="discussion">Mjadala</option></select></div>
          <div><label for="portalPostTitle">Kichwa (hiari)</label><input maxlength="100" id="portalPostTitle" name="title"></div></div>
        <label for="portalPostText" class="social-visually-hidden">Ujumbe</label>
        <textarea id="portalPostText" name="text" rows="3" maxlength="4000" placeholder="Andika ujumbe wa kikundi…"></textarea>
        <div class="social-upload-preview"></div>
        <div class="social-compose-toolbar"><label class="social-upload-button">${IC.file}<span>Picha au PDF</span>
          <input id="socialFiles" type="file" accept="image/jpeg,image/png,image/webp,application/pdf,.pdf" multiple></label>
          <button class="btn" type="submit">Chapisha</button>
        </div><p class="social-compose-status" role="status"></p>
      </form>
    </details>` : ""}
    <nav class="social-filters" aria-label="Chuja machapisho">
      <button type="button" data-social-filter="all" aria-pressed="true">Yote</button>
      <button type="button" data-social-filter="announcement" aria-pressed="false">Matangazo</button>
      <button type="button" data-social-filter="discussion" aria-pressed="false">Mijadala</button>
    </nav>
    <div class="social-post-list">${posts.map(socialPostCard).join("")}</div>
    <div class="card social-empty" hidden><span class="social-feed-mark">${IC.meg}</span><p>Hakuna machapisho bado.</p></div>
  </section>`;
  const list = container.querySelector(".social-post-list");
  const filters = container.querySelectorAll("[data-social-filter]");
  const empty = container.querySelector(".social-empty");
  const filterPosts = kind => {
    for (const button of filters) button.setAttribute("aria-pressed", String(button.dataset.socialFilter === kind));
    let visible = 0;
    for (const card of list.children) {
      card.hidden = kind !== "all" && card.dataset.postType !== kind;
      if (!card.hidden) visible++;
    }
    empty.hidden = Boolean(visible);
  };
  filterPosts("all");
  for (const button of filters) button.onclick = () => filterPosts(button.dataset.socialFilter);
  for (const card of list.children) wireSocialPost(card);
  const form = container.querySelector("#portalPostForm");
  if (form) wireSocialComposer(form, post => {
    list.insertAdjacentHTML("afterbegin", socialPostCard(post));
    wireSocialPost(list.firstElementChild);
    filterPosts("all");
  });
}
