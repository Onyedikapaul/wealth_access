// js/mount-mobile-nav.js
(function () {
  async function mountMobileNav(options = {}) {
    const {
      mountSelector = "[data-mobile-nav]",
      url = "/components/mobile-nav.html",
    } = options;

    const mount = document.querySelector(mountSelector);
    if (!mount) {
      console.warn(`[mobile-nav] No element matching ${mountSelector} found.`);
      return;
    }

    // Sanity check: mount MUST be inside an x-data parent so Alpine state
    // (isDesktop, showMobileMenu) is reachable from the injected template.
    const xDataParent = mount.closest("[x-data]");
    if (!xDataParent) {
      console.warn(
        "[mobile-nav] The mount point is NOT inside an x-data parent. " +
          "Alpine state (isDesktop, showMobileMenu) won't be reachable. " +
          "Move <div data-mobile-nav></div> inside your main <div x-data> wrapper."
      );
    }

    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load ${url} (${res.status})`);

      mount.innerHTML = await res.text();

      // Re-init Alpine on the injected subtree so directives bind correctly.
      if (window.Alpine && typeof window.Alpine.initTree === "function") {
        window.Alpine.initTree(mount);
      } else {
        console.warn(
          "[mobile-nav] Alpine.js not detected on window. Ensure Alpine is " +
            "loaded BEFORE this script runs."
        );
      }
    } catch (err) {
      console.error("[mobile-nav] mount failed:", err);
      mount.innerHTML = `<div class="p-4 text-sm text-red-500">Failed to load mobile nav</div>`;
    }
  }

  window.mountMobileNav = mountMobileNav;

  // Alpine ships with `defer`, so we wait for it to be ready before mounting.
  // Listen for the alpine:init event if it hasn't fired yet, otherwise mount immediately.
  function boot() {
    if (window.Alpine) {
      mountMobileNav();
    } else {
      document.addEventListener("alpine:init", () => mountMobileNav(), {
        once: true,
      });
      // Fallback: if Alpine never loads, mount anyway after DOM is ready
      // so at least the markup is on the page.
      setTimeout(() => {
        if (!document.querySelector("[data-mobile-nav]")?.innerHTML?.trim()) {
          mountMobileNav();
        }
      }, 1500);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();