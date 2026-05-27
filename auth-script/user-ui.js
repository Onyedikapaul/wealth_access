
import { formatBalance, getCurrencySymbol, getCurrencyCode } from "/utils/currencyUtils.js";

function setTextByClass(className, value) {
  document.querySelectorAll(`.${className}`).forEach((el) => {
    el.textContent = value ?? "";
  });
}

function setAttrByClass(className, attr, value) {
  document.querySelectorAll(`.${className}`).forEach((el) => {
    el.setAttribute(attr, value ?? "");
  });
}

async function loadUserProfile() {
  try {
    const res = await fetch("/api/user/profile", { credentials: "include" });
    const data = await res.json();
    if (!data.success) return;

    const u = data.user;

    // ── Grab currency info from user's country ─────────────────────────────
    const symbol = getCurrencySymbol(u.country); // e.g. "₦" for Nigeria
    const code   = getCurrencyCode(u.country);   // e.g. "NGN"

    // ── Helper: format any raw number with the user's local currency ───────
    const fmt = (amount) => formatBalance(amount, u.country);

    // ── Basic profile fields ───────────────────────────────────────────────
    setTextByClass("user-name",           u.name);
    setTextByClass("user-lastname",       u.lastname);
    setTextByClass("user-fullname",       u.fullname);
    setTextByClass("user-username",       `@${u.username}`);
    setTextByClass("user-email",          u.email);
    setTextByClass("user-phone",          u.phone);
    setTextByClass("user-country",        u.country);
    setTextByClass("user-accounttype",    u.accounttype);
    setTextByClass("user-account-number", u.accountNumber);
    setTextByClass("user-status",         u.accountStatus);

    // ── Card counts (no currency needed) ──────────────────────────────────
    setTextByClass("user-total-cards",   u.totalCards);
    setTextByClass("user-active-cards",  u.activeCards);
    setTextByClass("user-pending-cards", u.pendingCards);
    setTextByClass("user-pending-count", `${u.pendingCount} awaiting processing`);

    // ── All money fields — now use local currency symbol ───────────────────
    setTextByClass("user-balance",            fmt(u.balance));
    setTextByClass("user-crypto-balance",     u.crypto_balance);
    setTextByClass("user-total-portfolio",    fmt(u.totalPortfolio));
    setTextByClass("user-monthly-deposits",   fmt(u.monthlyDeposits));
    setTextByClass("user-monthly-expenses",   fmt(u.monthlyExpenses));
    setTextByClass("user-pending-total",      fmt(u.pendingTotal));
    setTextByClass("user-monthly-total",      fmt(u.monthlyDeposits + u.monthlyExpenses));
    setTextByClass("user-currency-symbol", symbol);

    // ── BTC price stays in USD since it's a global market price ───────────
    setTextByClass("user-btc-price", `$${u.btcPrice?.toLocaleString()}`);
    setTextByClass("user-btc-usd",   fmt(u.btcInUsd));

    // ── Avatar ─────────────────────────────────────────────────────────────
    if (u.avatarUrl) {
      setAttrByClass("user-avatar", "src", u.avatarUrl);
    }

    // ── Store globally — now includes currency info ────────────────────────
    window._userProfile = { ...u, currency: { symbol, code } };

  } catch (err) {
    console.error("loadUserProfile error:", err);
  }
}

loadUserProfile();