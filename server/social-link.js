const HOSTS = {
  "facebook.com": "Facebook", "www.facebook.com": "Facebook", "m.facebook.com": "Facebook", "fb.watch": "Facebook",
  "instagram.com": "Instagram", "www.instagram.com": "Instagram",
  "tiktok.com": "TikTok", "www.tiktok.com": "TikTok", "vm.tiktok.com": "TikTok", "vt.tiktok.com": "TikTok",
  "youtube.com": "YouTube", "www.youtube.com": "YouTube", "m.youtube.com": "YouTube", "youtu.be": "YouTube",
  "linkedin.com": "LinkedIn", "www.linkedin.com": "LinkedIn"
};

function socialLink(value) {
  if (typeof value !== "string" || value.length > 1200) return null;
  let url;
  try { url = new URL(value.trim()); } catch { return null; }
  if (url.protocol !== "https:" || url.username || url.password || url.port || !Object.hasOwn(HOSTS, url.hostname)) return null;
  const network = HOSTS[url.hostname];
  const path = url.pathname.replace(/\/$/, "");
  let embedUrl = "";
  if (network === "YouTube") {
    const videoId = url.hostname === "youtu.be" ? path.slice(1)
      : path === "/watch" ? url.searchParams.get("v") : /^\/(?:shorts|live|embed)\/([\w-]+)$/.exec(path)?.[1];
    if (!/^[\w-]{11}$/.test(videoId || "")) return null;
    url = new URL("https://www.youtube.com/watch?v=" + videoId);
    embedUrl = "https://www.youtube-nocookie.com/embed/" + videoId;
  } else if (network === "Instagram") {
    const post = /^\/(p|reel|tv)\/([\w-]{3,40})(?:\/embed)?$/.exec(path);
    if (!post) return null;
    url = new URL(`https://www.instagram.com/${post[1]}/${post[2]}/`);
    embedUrl = url.href + "embed/";
  } else if (network === "TikTok") {
    const videoId = /\/(?:video|photo)\/(\d{10,25})$/.exec(path)?.[1];
    if (videoId) {
      url.search = "";
      embedUrl = "https://www.tiktok.com/player/v1/" + videoId;
    } else if (!/^(?:vm|vt)\.tiktok\.com$/.test(url.hostname) && !/^\/t\/[\w-]+$/.test(path)) return null;
  } else if (network === "LinkedIn") {
    const activity = /^\/posts\/[^/]*[-_]activity-(\d{12,25})(?:[-_][^/]*)?$/.exec(path)?.[1];
    const direct = /^\/(?:embed\/)?feed\/update\/(urn:li:(?:activity|share|ugcPost):\d+)$/.exec(path)?.[1]
      || (activity ? "urn:li:activity:" + activity : "");
    if (direct) {
      url = new URL("https://www.linkedin.com/feed/update/" + direct + "/");
      embedUrl = "https://www.linkedin.com/embed/feed/update/" + direct;
    } else if (!/^\/posts\/[^/]+$/.test(path)) return null;
  } else {
    const post = /\/(?:posts|videos|reel)\/[^/]+$/.test(path) || /^\/(?:permalink|story|photo)\.php$/.test(path) ||
      (path === "/watch" && url.searchParams.has("v"));
    const shared = /^\/share\/(?:[prv]\/)?[\w-]+$/.test(path) || url.hostname === "fb.watch";
    if (!post && !shared) return null;
    url.hostname = url.hostname === "fb.watch" ? "fb.watch" : "www.facebook.com";
    if (post) embedUrl = "facebook";
  }
  url.hash = "";
  for (const key of [...url.searchParams.keys()]) {
    if (/^(utm_|fbclid$|igsh$|si$)/i.test(key)) url.searchParams.delete(key);
  }
  if (embedUrl === "facebook") embedUrl = "https://www.facebook.com/plugins/post.php?" + new URLSearchParams({ href: url.href, show_text: "true" });
  return { network, url: url.href, embedUrl };
}

module.exports = { socialLink };
