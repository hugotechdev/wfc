"use strict";

window.googleTranslateElementInit = function () {
  const host = document.getElementById("google_translate_element");
  if (!host || !window.google?.translate?.TranslateElement) return;
  new google.translate.TranslateElement({
    pageLanguage: "sw",
    includedLanguages: "en,sw",
    autoDisplay: false
  }, host.id);
  const labelControl = () => {
    const select = host.querySelector("select");
    if (!select) return false;
    select.setAttribute("aria-label", "Kiswahili / English");
    select.parentElement.classList.add("language-control");
    const labels = { "": "Lugha", sw: "Kiswahili", en: "English" };
    for (const option of select.options) {
      if (Object.hasOwn(labels, option.value)) option.textContent = labels[option.value];
    }
    return true;
  };
  if (!labelControl()) {
    const observer = new MutationObserver(() => {
      if (labelControl()) observer.disconnect();
    });
    observer.observe(host, { subtree: true, childList: true });
  }
};
