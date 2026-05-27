// /js-scripts/includeMobileHeader2.js

async function mountComponent(name, url) {
  const mount = document.querySelector(`[data-component="${name}"]`);
  if (!mount) {
    console.warn(`[mountComponent] no element matching [data-component="${name}"]`);
    return null;
  }

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to load ${url} (${res.status})`);
    mount.innerHTML = await res.text();

    // IMPORTANT: Alpine doesn't auto-bind new DOM injected via innerHTML.
    // initTree tells Alpine to scan and bind directives on this subtree.
    if (window.Alpine && typeof window.Alpine.initTree === "function") {
      window.Alpine.initTree(mount);
    }

    return mount;
  } catch (err) {
    console.error("mountComponent:", err);
    mount.innerHTML = `<div class="p-4 text-sm text-red-500">Failed to load component</div>`;
    return null;
  }
}

window.mountComponent = mountComponent;

// Wait for Alpine to be ready before mounting (Alpine ships with `defer`).
function boot() {
  const run = async () => {
    await mountComponent("mobile-header", "/components/mobile-header2.html");

    // set title from <body data-page-title="...">
    const title = document.body.getAttribute("data-page-title");
    if (title) {
      const el = document.querySelector("[data-mobile-title]");
      if (el) el.textContent = title;
    }

    // load notifications after component is in the DOM
    if (window.loadNotifications) window.loadNotifications();
  };

  if (window.Alpine) {
    run();
  } else {
    document.addEventListener("alpine:init", run, { once: true });
    // Fallback in case Alpine never loads
    setTimeout(() => {
      if (!document.querySelector('[data-component="mobile-header"]')?.innerHTML?.trim()) {
        run();
      }
    }, 1500);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}