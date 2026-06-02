/**
 * spending-limit.js
 * ----------------------------------------------------------
 * Standalone script for the Monthly Spending Limit card.
 * Uses unique IDs: sl-bar, sl-spent, sl-limit, sl-tx-limit
 * No conflict with desktop-dashboard.js
 * ----------------------------------------------------------
 */

(function () {
  "use strict";

  // ---------- Format currency ----------
  const fmtFiat = (n, decimals = 2) => {
    const symbol = window._userProfile?.currency?.symbol || "₦";
    return `${symbol}${Number(n || 0).toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}`;
  };

  // ---------- Render ----------
  function render(spent, limit) {
    const bar      = document.getElementById("sl-bar");
    const spentEl  = document.getElementById("sl-spent");
    const limitEl  = document.getElementById("sl-limit");
    const txLimit  = document.getElementById("sl-tx-limit");

    // percentage
    const pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;

    // update bar width
    if (bar) {
      bar.style.width = `${pct}%`;

      // color based on usage
      bar.classList.remove(
        "from-primary-500", "to-primary-400",
        "from-yellow-500",  "to-yellow-400",
        "from-red-500",     "to-red-400"
      );

      if (pct >= 80) {
        bar.classList.add("from-red-500", "to-red-400");
      } else if (pct >= 50) {
        bar.classList.add("from-yellow-500", "to-yellow-400");
      } else {
        bar.classList.add("from-primary-500", "to-primary-400");
      }
    }

    if (spentEl)  spentEl.textContent  = fmtFiat(spent);
    if (limitEl)  limitEl.textContent  = fmtFiat(limit);
    if (txLimit)  txLimit.textContent  = fmtFiat(limit, 0);
  }

  // ---------- Fetch ----------
  async function load() {
    try {
      const res = await fetch("/api/dashboard/spending-limit", {
        credentials: "include",
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      render(Number(data.spent || 0), Number(data.limit || 0));

    } catch (err) {
      console.error("[spending-limit]", err);

      // show dashes on error
      ["sl-spent", "sl-limit", "sl-tx-limit"].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.textContent = "—";
      });
    }
  }

  // ---------- Wait for user profile ----------
  function waitAndLoad(attempts = 0) {
    if (window._userProfile || attempts >= 40) {
      load();
    } else {
      setTimeout(() => waitAndLoad(attempts + 1), 250);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => waitAndLoad());
  } else {
    waitAndLoad();
  }

})();