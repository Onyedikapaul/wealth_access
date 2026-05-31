/**
 * desktop-dashboard.js
 * -----------------------------------------------------------
 * Powers the unified responsive dashboard.
 * - Fetch /api/dashboard/overview → stats, chart, activities
 * - Fetch /api/user/cards → user cards section (horizontal scroll, real colors)
 * - Dark-mode aware Chart.js.
 * - Self-contained, no dependency on old scripts.
 * - ✅ DYNAMIC CURRENCY SUPPORT based on user's country
 * -----------------------------------------------------------
 */

(function () {
  "use strict";

  // ---------- CURRENCY MAPPING (Country/Code → Symbol) ----------
  const CURRENCY_MAP = {
    // Africa
    NG: { symbol: "₦", code: "NGN", country: "Nigeria" },
    KE: { symbol: "KSh", code: "KES", country: "Kenya" },
    ZA: { symbol: "R", code: "ZAR", country: "South Africa" },
    EG: { symbol: "E£", code: "EGP", country: "Egypt" },
    GH: { symbol: "₵", code: "GHS", country: "Ghana" },

    // Americas
    US: { symbol: "$", code: "USD", country: "United States" },
    CA: { symbol: "C$", code: "CAD", country: "Canada" },
    MX: { symbol: "$", code: "MXN", country: "Mexico" },
    BR: { symbol: "R$", code: "BRL", country: "Brazil" },

    // Europe
    GB: { symbol: "£", code: "GBP", country: "United Kingdom" },
    DE: { symbol: "€", code: "EUR", country: "Germany" },
    FR: { symbol: "€", code: "EUR", country: "France" },
    IT: { symbol: "€", code: "EUR", country: "Italy" },
    ES: { symbol: "€", code: "EUR", country: "Spain" },
    NL: { symbol: "€", code: "EUR", country: "Netherlands" },

    // Asia
    IN: { symbol: "₹", code: "INR", country: "India" },
    JP: { symbol: "¥", code: "JPY", country: "Japan" },
    SG: { symbol: "S$", code: "SGD", country: "Singapore" },
    CN: { symbol: "¥", code: "CNY", country: "China" },
  };

  // ---------- Get Currency from User Profile or Country ----------
  function getCurrencyInfo() {
    const profile = window._userProfile;

    // First, try to get from profile's currency field
    if (profile?.currency?.symbol && profile?.currency?.code) {
      return {
        symbol: profile.currency.symbol,
        code: profile.currency.code,
      };
    }

    // Second, try to get from profile's country code
    if (profile?.country) {
      const countryCode = profile.country.toUpperCase();
      if (CURRENCY_MAP[countryCode]) {
        return CURRENCY_MAP[countryCode];
      }
    }

    // Third, try to get from profile's country name
    if (profile?.countryName) {
      const countryName = profile.countryName.toUpperCase();
      for (const [code, info] of Object.entries(CURRENCY_MAP)) {
        if (info.country.toUpperCase() === countryName) {
          return info;
        }
      }
    }

    // Fallback: Default to USD
    return { symbol: "$", code: "USD" };
  }

  function getUserSymbol() {
    return getCurrencyInfo().symbol;
  }

  function getUserCode() {
    return getCurrencyInfo().code;
  }

  // ---------- Helpers ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const fmtFiat = (n, decimals = 2) => {
    const symbol = getUserSymbol();
    const formatted = Number(n || 0).toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    return `${symbol}${formatted}`;
  };

  const fmtBTC = (n) => `${Number(n || 0).toFixed(6)} BTC`;

  const setTextAll = (selector, value) => {
    $$(selector).forEach((el) => (el.textContent = value));
  };

  const formatDate = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    const day = String(d.getDate()).padStart(2, "0");
    const month = d.toLocaleString("en-US", { month: "short" });
    const year = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${day} ${month}, ${year} ${hh}:${mm}`;
  };

  const greetingFor = (date = new Date()) => {
    const h = date.getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  const isDark = () => document.documentElement.classList.contains("dark");

  const statusStyles = {
    completed:
      "text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30",
    pending:
      "text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30",
    processing:
      "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30",
    failed: "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30",
    cancelled: "text-gray-700 dark:text-gray-400 bg-gray-100 dark:bg-gray-700",
  };

  const statusDot = {
    completed: "bg-green-500",
    pending: "bg-yellow-500",
    processing: "bg-blue-500",
    failed: "bg-red-500",
    cancelled: "bg-gray-500",
  };

  const activityIcon = (act) => {
    const m = (act.method || act.activity || "").toLowerCase();
    if (m.includes("wire"))
      return {
        icon: "fa-globe",
        color: "text-blue-600 bg-blue-50 dark:bg-blue-900/30",
      };
    if (m.includes("crypto") || m.includes("btc"))
      return {
        icon: "fa-bitcoin",
        color: "text-orange-600 bg-orange-50 dark:bg-orange-900/30",
        brand: true,
      };
    if (m.includes("paypal"))
      return {
        icon: "fa-paypal",
        color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30",
        brand: true,
      };
    if (m.includes("zelle"))
      return {
        icon: "fa-z",
        color: "text-purple-600 bg-purple-50 dark:bg-purple-900/30",
      };
    if (m.includes("wise"))
      return {
        icon: "fa-arrow-right-arrow-left",
        color: "text-green-600 bg-green-50 dark:bg-green-900/30",
      };
    if (m.includes("local") || act.type === "local")
      return {
        icon: "fa-building-columns",
        color: "text-primary-600 bg-primary-50 dark:bg-primary-900/30",
      };
    return {
      icon: "fa-arrow-right-arrow-left",
      color: "text-gray-600 bg-gray-100 dark:bg-gray-700",
    };
  };

  // ---------- Card color schemes (matches user-cards.js exactly) ----------
  const CARD_SCHEMES = {
    blue: {
      gradient:
        "linear-gradient(135deg, #1a56db 0%, #1e40af 50%, #1e3a8a 100%)",
      shine: "rgba(255,255,255,0.12)",
      accent: "#93c5fd",
    },
    purple: {
      gradient:
        "linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #4c1d95 100%)",
      shine: "rgba(255,255,255,0.10)",
      accent: "#c4b5fd",
    },
    violet: {
      gradient:
        "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 40%, #4338ca 100%)",
      shine: "rgba(255,255,255,0.12)",
      accent: "#ddd6fe",
    },
    rose: {
      gradient:
        "linear-gradient(135deg, #e11d48 0%, #be123c 50%, #881337 100%)",
      shine: "rgba(255,255,255,0.10)",
      accent: "#fda4af",
    },
    gold: {
      gradient:
        "linear-gradient(135deg, #b45309 0%, #92400e 50%, #78350f 100%)",
      shine: "rgba(255,215,0,0.15)",
      accent: "#fcd34d",
    },
    emerald: {
      gradient:
        "linear-gradient(135deg, #059669 0%, #047857 50%, #064e3b 100%)",
      shine: "rgba(255,255,255,0.10)",
      accent: "#6ee7b7",
    },
    slate: {
      gradient:
        "linear-gradient(135deg, #334155 0%, #1e293b 50%, #0f172a 100%)",
      shine: "rgba(255,255,255,0.08)",
      accent: "#94a3b8",
    },
    cyan: {
      gradient:
        "linear-gradient(135deg, #0891b2 0%, #0e7490 50%, #164e63 100%)",
      shine: "rgba(255,255,255,0.12)",
      accent: "#67e8f9",
    },
    pink: {
      gradient:
        "linear-gradient(135deg, #db2777 0%, #be185d 50%, #831843 100%)",
      shine: "rgba(255,255,255,0.10)",
      accent: "#f9a8d4",
    },
    black: {
      gradient:
        "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0d0d0d 100%)",
      shine: "rgba(255,255,255,0.06)",
      accent: "#e2e8f0",
    },
    default: {
      gradient:
        "linear-gradient(135deg, #1a56db 0%, #1e40af 50%, #1e3a8a 100%)",
      shine: "rgba(255,255,255,0.12)",
      accent: "#93c5fd",
    },
  };

  const BRAND_ICONS = {
    mastercard: "fa-brands fa-cc-mastercard",
    visa: "fa-brands fa-cc-visa",
    amex: "fa-brands fa-cc-amex",
  };

  const STATUS_BADGE = {
    active: {
      bg: "rgba(52,211,153,0.2)",
      border: "rgba(52,211,153,0.4)",
      dot: "#34d399",
      label: "Active",
    },
    pending: {
      bg: "rgba(251,191,36,0.2)",
      border: "rgba(251,191,36,0.4)",
      dot: "#fbbf24",
      label: "Pending",
    },
    blocked: {
      bg: "rgba(239,68,68,0.2)",
      border: "rgba(239,68,68,0.4)",
      dot: "#ef4444",
      label: "Blocked",
    },
    inactive: {
      bg: "rgba(148,163,184,0.2)",
      border: "rgba(148,163,184,0.4)",
      dot: "#94a3b8",
      label: "Inactive",
    },
  };

  // ---------- State ----------
  let chartInstance = null;
  let cachedData = null;

  // ---------- Render: stat cards + wallets + stats ----------
  function renderTopSections(data) {
    const greetEl = $("#dd-greeting");
    if (greetEl) greetEl.textContent = greetingFor();
    setTextAll(".dd-firstname", (data.user?.fullname || "there").split(" ")[0]);

    setTextAll(".dd-total-income", fmtFiat(data.stats?.totalIncome));
    setTextAll(".dd-total-revenue", fmtFiat(data.stats?.totalRevenue));
    setTextAll(".dd-income-change", `${data.changes?.income ?? 8}%`);
    setTextAll(".dd-revenue-change", `${data.changes?.revenue ?? 4}%`);
    setTextAll(".dd-total-balance", fmtFiat(data.balances?.fiat));
    setTextAll(".dd-total-earnings", fmtFiat(data.stats?.monthlyDeposits));
    setTextAll(".dd-total-spending", fmtFiat(data.stats?.monthlyExpenses));
    setTextAll(".dd-total-volume", fmtFiat(data.stats?.totalVolume));

    setTextAll(".dd-balance-change", `${data.changes?.balance ?? 5}%`);
    setTextAll(".dd-earnings-change", `${data.changes?.earnings ?? 7}%`);
    setTextAll(".dd-spending-change", `${data.changes?.spending ?? 5}%`);
    setTextAll(".dd-volume-change", `${data.changes?.volume ?? 4}%`);

    setTextAll(".dd-fiat-balance", fmtFiat(data.balances?.fiat));
    setTextAll(".dd-btc-balance", fmtBTC(data.balances?.btc));

    setTextAll(".dd-tx-limit", fmtFiat(data.stats?.transactionLimit, 0));
    setTextAll(".dd-pending-total", fmtFiat(data.stats?.pendingTotal));
    setTextAll(
      ".dd-pending-count",
      `${data.stats?.pendingCount || 0} transactions`,
    );

    const spent = Number(data.spendingLimit?.spent || 0);
    const limit = Number(data.spendingLimit?.limit || 0);
    const pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
    const bar = $("#dd-spending-bar");
    if (bar) bar.style.width = `${pct}%`;
    setTextAll(".dd-spent", fmtFiat(spent));
    setTextAll(".dd-limit", fmtFiat(limit));
  }

  // ---------- Render: chart ----------
  function renderChart(profitLoss) {
    const canvas = $("#dd-profit-loss-chart");
    if (!canvas || typeof Chart === "undefined") return;

    const labels = profitLoss.map((p) => p.month);
    const profitData = profitLoss.map((p) => p.profit);
    const lossData = profitLoss.map((p) => p.loss);

    const dark = isDark();
    const gridColor = dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";
    const tickColor = dark ? "#6b7280" : "#9ca3af";

    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(canvas.getContext("2d"), {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Profit",
            data: profitData,
            backgroundColor: "#ef4444", // red primary
            hoverBackgroundColor: "#dc2626",
            borderRadius: {
              topLeft: 6,
              topRight: 6,
              bottomLeft: 0,
              bottomRight: 0,
            },
            borderSkipped: false,
            barThickness: 16,
            categoryPercentage: 0.7,
            barPercentage: 0.85,
          },
          {
            label: "Loss",
            data: lossData,
            backgroundColor: dark ? "#ffffff" : "#111827", // white in dark, near-black in light
            hoverBackgroundColor: dark ? "#e2e8f0" : "#1f2937",
            borderRadius: {
              topLeft: 6,
              topRight: 6,
              bottomLeft: 0,
              bottomRight: 0,
            },
            borderSkipped: false,
            barThickness: 16,
            categoryPercentage: 0.7,
            barPercentage: 0.85,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: "index",
          intersect: false,
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: dark ? "#1f2937" : "#111827",
            titleColor: "#fff",
            bodyColor: "#d1d5db",
            padding: 12,
            cornerRadius: 10,
            displayColors: true,
            callbacks: {
              label: (ctx) =>
                ` ${ctx.dataset.label}: ${fmtFiat(ctx.parsed.y, 0)}`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: {
              color: tickColor,
              font: { size: 11 },
            },
          },
          y: {
            grid: {
              color: gridColor,
              drawBorder: false,
            },
            border: { display: false, dash: [4, 4] },
            ticks: {
              color: tickColor,
              font: { size: 11 },
              maxTicksLimit: 5,
              callback: (v) => {
                if (v >= 1000000) return `${v / 1000000}M`;
                if (v >= 1000) return `${v / 1000}k`;
                return v;
              },
            },
            beginAtZero: true,
          },
        },
      },
    });
  }

  // ---------- Render: activities ----------
  function renderActivities(activities) {
    const tbody = $("#dd-activities-body");
    if (!tbody) return;

    if (!activities || activities.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="px-5 py-12 text-center text-xs text-gray-400">
            <i class="fa-solid fa-inbox text-2xl mb-2 block"></i>
            No recent activities yet
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = activities
      .slice(0, 10)
      .map((a) => {
        const icon = activityIcon(a);
        const status = (a.status || "pending").toLowerCase();
        const pill = statusStyles[status] || statusStyles.pending;
        const dot = statusDot[status] || statusDot.pending;
        const iconClass = icon.brand
          ? `fa-brands ${icon.icon}`
          : `fa-solid ${icon.icon}`;
        const amountColor =
          a.type === "credit"
            ? "text-green-600 dark:text-green-400"
            : "text-gray-900 dark:text-white";
        const amountPrefix = a.type === "credit" ? "+" : "";

        return `
          <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors" data-status="${status}" data-search="${(a.orderId || "") + " " + (a.activity || "")}">
            <td class="px-5 py-4"><input type="checkbox" class="rounded border-gray-300 dark:border-gray-600"></td>
            <td class="px-5 py-4 text-xs font-mono text-gray-600 dark:text-gray-300">${a.orderId || "—"}</td>
            <td class="px-5 py-4">
              <div class="flex items-center gap-2.5">
                <div class="w-7 h-7 ${icon.color} rounded-lg flex items-center justify-center">
                  <i class="${iconClass} text-xs"></i>
                </div>
                <span class="text-xs font-medium text-gray-900 dark:text-white">${a.activity || a.method || "Transfer"}</span>
              </div>
            </td>
            <td class="px-5 py-4 text-right text-xs font-semibold ${amountColor}">${amountPrefix}${fmtFiat(a.amount)}</td>
            <td class="px-5 py-4">
              <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${pill}">
                <span class="w-1.5 h-1.5 rounded-full ${dot}"></span>
                ${status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
            </td>
            <td class="px-5 py-4 text-xs text-gray-500 dark:text-gray-400">${formatDate(a.date)}</td>
            <td class="px-5 py-4 text-center">
              <button class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><i class="fa-solid fa-ellipsis text-xs"></i></button>
            </td>
          </tr>`;
      })
      .join("");
  }

  // ---------- Inject card-specific CSS ----------
  function injectCardStyles() {
    if (document.getElementById("dd-card-styles")) return;
    const style = document.createElement("style");
    style.id = "dd-card-styles";
    style.textContent = `
      .dd-cards-row {
        display: flex;
        gap: 14px;
        overflow-x: auto;
        overflow-y: hidden;
        padding-bottom: 8px;
        scroll-snap-type: x mandatory;
        -webkit-overflow-scrolling: touch;
      }
      .dd-cards-row::-webkit-scrollbar { height: 6px; }
      .dd-cards-row::-webkit-scrollbar-track { background: transparent; }
      .dd-cards-row::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.3); border-radius: 3px; }
      .dd-cards-row::-webkit-scrollbar-thumb:hover { background: rgba(148,163,184,0.5); }

      .dd-card {
        flex: 0 0 280px;
        max-width: 280px;
        position: relative;
        border-radius: 16px;
        padding: 16px;
        min-height: 170px;
        overflow: hidden;
        cursor: pointer;
        scroll-snap-align: start;
        box-shadow: 0 8px 32px rgba(0,0,0,0.35);
        transition: transform 0.3s ease, box-shadow 0.3s ease;
      }
      .dd-card:hover {
        transform: translateY(-3px) scale(1.01);
        box-shadow: 0 16px 48px rgba(0,0,0,0.45);
      }
      .dd-card-shine {
        position: absolute; inset: 0;
        opacity: 0;
        transition: opacity 0.5s ease;
        pointer-events: none;
      }
      .dd-card:hover .dd-card-shine { opacity: 1; }
      .dd-card-circle {
        position: absolute;
        border-radius: 50%;
        pointer-events: none;
      }
      .dd-card-c1 { width: 120px; height: 120px; top: -40px; right: -30px; }
      .dd-card-c2 { width: 80px;  height: 80px;  bottom: -20px; left: 20px; }
      .dd-card-chip {
        position: absolute; top: 14px; left: 14px;
        width: 38px; height: 30px;
        background: rgba(255,255,255,0.15);
        border: 1px solid rgba(255,255,255,0.25);
        border-radius: 6px;
        display: flex; align-items: center; justify-content: center;
        backdrop-filter: blur(4px);
      }
      .dd-card-status {
        position: absolute; top: 14px; right: 14px;
        display: inline-flex; align-items: center; gap: 5px;
        padding: 4px 10px;
        border-radius: 8px;
        font-size: 0.7rem; font-weight: 700;
        color: rgba(255,255,255,0.95);
        backdrop-filter: blur(6px);
      }
      .dd-card-dot {
        width: 6px; height: 6px;
        border-radius: 50%;
        display: inline-block;
      }
      .dd-card-body {
        position: relative; z-index: 2;
        padding-top: 52px;
      }
      .dd-card-type {
        font-size: 0.65rem; font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: rgba(255,255,255,0.7);
        margin-bottom: 6px;
      }
      .dd-card-number {
        font-family: 'Courier New', monospace;
        font-size: 0.95rem; font-weight: 700;
        letter-spacing: 0.18em;
        color: #fff;
        text-shadow: 0 1px 4px rgba(0,0,0,0.3);
        margin-bottom: 18px;
      }
      .dd-card-foot {
        display: flex; justify-content: space-between; align-items: flex-end;
      }
      .dd-card-label {
        font-size: 0.6rem; font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: rgba(255,255,255,0.6);
        margin-bottom: 3px;
      }
      .dd-card-value {
        font-size: 0.82rem; font-weight: 700;
        color: #fff;
      }
      .dd-card-holder {
        max-width: 150px;
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      }
      .dd-card-brand {
        position: absolute; bottom: 12px; right: 14px;
        z-index: 2;
        opacity: 0.5;
      }
    `;
    document.head.appendChild(style);
  }

  // ---------- Render: cards ----------
  function renderCards(cards) {
    const mount = $(".userCardsMount");
    if (!mount) return;

    injectCardStyles();

    if (!cards || cards.length === 0) {
      mount.innerHTML = `
        <div class="flex flex-col items-center justify-center py-8 text-center">
          <div class="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
            <i class="fa-solid fa-credit-card text-gray-400 text-lg"></i>
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">No cards yet</p>
          <a href="/dashboard/cards.html" class="text-xs text-primary-600 dark:text-primary-400 font-medium hover:underline">
            Apply for your first card
          </a>
        </div>`;
      return;
    }

    const cardsHtml = cards
      .map((c) => {
        const scheme = CARD_SCHEMES[c.color_scheme] || CARD_SCHEMES.default;
        const status = STATUS_BADGE[c.status] || STATUS_BADGE.inactive;
        const brandClass =
          BRAND_ICONS[(c.card_brand || "visa").toLowerCase()] ||
          BRAND_ICONS.visa;
        const typeLabel =
          c.card_type === "physical" ? "Physical Card" : "Virtual Card";
        const masked = c.last_four
          ? `•••• •••• •••• ${c.last_four}`
          : "•••• •••• •••• ••••";
        const expiry =
          c.expiry_formatted ||
          (c.expiry_month && c.expiry_year
            ? `${c.expiry_month}/${String(c.expiry_year).slice(-2)}`
            : "••/••");

        return `
        <div class="dd-card" style="background: ${scheme.gradient};">
          <div class="dd-card-shine" style="background: linear-gradient(135deg, transparent 30%, ${scheme.shine} 50%, transparent 70%);"></div>
          <div class="dd-card-circle dd-card-c1" style="background: ${scheme.shine};"></div>
          <div class="dd-card-circle dd-card-c2" style="background: ${scheme.shine};"></div>

          <div class="dd-card-chip">
            <i class="fa-solid fa-microchip" style="color: ${scheme.accent}; font-size: 13px;"></i>
          </div>

          <div class="dd-card-status" style="background: ${status.bg}; border: 1px solid ${status.border};">
            <span class="dd-card-dot" style="background: ${status.dot};"></span>
            ${status.label}
          </div>

          <div class="dd-card-body">
            <div class="dd-card-type">${typeLabel}</div>
            <div class="dd-card-number">${masked}</div>

            <div class="dd-card-foot">
              <div>
                <div class="dd-card-label">Card Holder</div>
                <div class="dd-card-value dd-card-holder">${c.card_holder_name || "—"}</div>
              </div>
              <div style="text-align: right;">
                <div class="dd-card-label">Expires</div>
                <div class="dd-card-value">${expiry}</div>
              </div>
            </div>
          </div>

          <div class="dd-card-brand">
            <i class="${brandClass}" style="color: rgba(255,255,255,0.5); font-size: 26px;"></i>
          </div>
        </div>`;
      })
      .join("");

    mount.innerHTML = `<div class="dd-cards-row">${cardsHtml}</div>`;
  }

  // ---------- Search filter ----------
  function attachSearch() {
    const input = $("#dd-search");
    if (!input) return;
    input.addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase();
      $$("#dd-activities-body tr").forEach((row) => {
        const hay = (row.dataset.search || "").toLowerCase();
        row.style.display = hay.includes(q) ? "" : "none";
      });
    });
  }

  // ---------- Chart range selector ----------
  function attachRangeSelector() {
    const sel = $("#dd-chart-range");
    if (!sel) return;
    sel.addEventListener("change", () => {
      if (!cachedData?.profitLoss) return;
      const range = sel.value;
      const months = range === "1m" ? 1 : range === "3m" ? 3 : 6;
      renderChart(cachedData.profitLoss.slice(-months));
    });
  }

  // ---------- Dark mode re-render ----------
  function watchDarkMode() {
    const obs = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.attributeName === "class" && cachedData?.profitLoss) {
          const sel = $("#dd-chart-range");
          const months = sel?.value === "1m" ? 1 : sel?.value === "3m" ? 3 : 6;
          renderChart(cachedData.profitLoss.slice(-months));
        }
      }
    });
    obs.observe(document.documentElement, { attributes: true });
  }

  // ---------- Fetch overview ----------
  async function loadOverview() {
    try {
      const res = await fetch("/api/dashboard/overview", {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Overview fetch failed: ${res.status}`);
      const data = await res.json();
      cachedData = data;

      renderTopSections(data);
      renderChart(data.profitLoss || []);
      renderActivities(data.recentActivities || []);
    } catch (err) {
      console.error("[desktop-dashboard] overview:", err);
      const tbody = $("#dd-activities-body");
      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" class="px-5 py-12 text-center text-xs text-red-500">
              <i class="fa-solid fa-triangle-exclamation mr-1"></i>
              Couldn't load dashboard data. Refresh to retry.
            </td>
          </tr>`;
      }
    }
  }

  // ---------- Fetch cards ----------
  async function loadCards() {
    const mount = $(".userCardsMount");
    if (!mount) return;

    injectCardStyles();
    mount.innerHTML = `
      <div class="dd-cards-row">
        <div class="dd-card" style="background: linear-gradient(135deg, #1e293b, #0f172a);"></div>
        <div class="dd-card" style="background: linear-gradient(135deg, #1e293b, #0f172a);"></div>
      </div>`;

    try {
      const res = await fetch("/api/user/cards", { credentials: "include" });
      if (!res.ok) throw new Error(`Cards fetch failed: ${res.status}`);
      const data = await res.json();
      const cards = data.cards || [];
      console.log(
        "[desktop-dashboard] cards:",
        cards.map((c) => ({ id: c._id || c.id, color_scheme: c.color_scheme })),
      );
      renderCards(cards);
    } catch (err) {
      console.error("[desktop-dashboard] cards:", err);
      mount.innerHTML = `
        <div class="py-6 text-center text-xs text-red-500">
          <i class="fa-solid fa-triangle-exclamation mr-1"></i>
          Couldn't load your cards.
        </div>`;
    }
  }

  // ---------- Init ----------
  function init() {
    console.log(
      "[desktop-dashboard] Initializing with currency:",
      getCurrencyInfo(),
    );
    loadOverview();
    loadCards();
    attachSearch();
    attachRangeSelector();
    watchDarkMode();
  }

  // ── WAIT FOR USER PROFILE BEFORE RUNNING ──
  function waitForUserProfile(callback, attempts = 0, maxAttempts = 40) {
    if (window._userProfile) {
      console.log(
        "[desktop-dashboard] User profile found:",
        window._userProfile,
      );
      callback();
    } else if (attempts < maxAttempts) {
      setTimeout(
        () => waitForUserProfile(callback, attempts + 1, maxAttempts),
        250,
      );
    } else {
      console.warn(
        "[desktop-dashboard] Timeout waiting for user profile, proceeding anyway",
      );
      callback();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      waitForUserProfile(init);
    });
  } else {
    waitForUserProfile(init);
  }
})();
