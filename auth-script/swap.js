

let btcRate = 87468;
const THIRTY_MINUTES = 30 * 60 * 1000;

// ─── Currency helpers ─────────────────────────────────────────────────────────
function getUserSymbol() { return window._userProfile?.currency?.symbol ?? "$"; }
function getUserCode()   { return window._userProfile?.currency?.code   ?? "USD"; }

// ─── Data Fetching ────────────────────────────────────────────────────────────
async function loadSwapData() {
  try {
    const res  = await fetch("/api/swap/data", { credentials: "include" });
    const data = await res.json();
    if (!data.success) return;

    btcRate = data.btcRate || btcRate;
    applyToUI(data.balance, data.crypto_balance, btcRate);

    // save to cache WITH the user's currency code so we can validate it later
    localStorage.setItem("swapDataCache", JSON.stringify({
      balance:        data.balance,
      crypto_balance: data.crypto_balance,
      btcRate:        data.btcRate,
      currencyCode:   getUserCode(),   // <-- store the currency code
      cachedAt:       Date.now(),
    }));
  } catch (err) {
    console.error("[swap] Failed to load swap data:", err);
  }
}

function loadFromCacheOrFetch() {
  try {
    const cached = localStorage.getItem("swapDataCache");
    if (cached) {
      const parsed = JSON.parse(cached);
      const age            = Date.now() - parsed.cachedAt;
      const cacheIsFresh   = age < THIRTY_MINUTES;
      // ── bust cache if user's currency changed (e.g. country was updated) ──
      const currencyMatch  = parsed.currencyCode === getUserCode();

      if (cacheIsFresh && currencyMatch) {
        btcRate = parsed.btcRate || btcRate;
        applyToUI(parsed.balance, parsed.crypto_balance, btcRate);
        return;
      }
    }
  } catch (e) {
    // ignore
  }

  // cache missing, stale, or currency mismatch — fetch fresh
  localStorage.removeItem("swapDataCache");
  loadSwapData();
}

function applyToUI(balance, cryptoBalance, rate) {
  const symbol = getUserSymbol();
  const code   = getUserCode();

  const fiatBalance   = balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const btcBalance    = cryptoBalance.toLocaleString("en-US", { minimumFractionDigits: 8, maximumFractionDigits: 8 });
  const rateFormatted = rate.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  $("#usd-balance-display").text(`${symbol}${fiatBalance}`);
  $("#btc-balance-display").text(`${btcBalance} BTC`);
  $("#btc-rate-display").text(`1 BTC = $${rateFormatted} USD`);
  $("#fiat-balance-label").text(`${code} Balance`);
  $("#swap-pair-badge").text(`BTC • ${code}`);

  $("#from_currency").html(`
    <option value="fiat">${code} (${symbol}${fiatBalance})</option>
    <option value="btc">BTC (${btcBalance})</option>
  `);

  updateCurrencyLabel();
  updateToCurrency();
}

// ─── UI Helpers ───────────────────────────────────────────────────────────────
function updateCurrencyLabel() {
  const code = getUserCode();
  $(".currency-label").text($("#from_currency").val() === "fiat" ? code : "BTC");
}

function updateToCurrency() {
  const code = getUserCode();
  if ($("#from_currency").val() === "fiat") {
    $("#to_currency").html('<option value="btc">BTC</option>');
  } else {
    $("#to_currency").html(`<option value="fiat">${code}</option>`);
  }
}

function calculateConversion() {
  const fromCurrency = $("#from_currency").val();
  const amount       = parseFloat($("#amount").val()) || 0;
  const symbol       = getUserSymbol();
  const code         = getUserCode();

  if (amount <= 0) {
    $("#conversionResult").html(
      '<div class="text-center text-gray-500 dark:text-gray-400 text-xs">Enter an amount to see conversion</div>'
    );
    return;
  }

  let html = "";
  if (fromCurrency === "fiat") {
    const btcAmount = amount / btcRate;
    html = buildConversionHTML(
      `${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${code}`,
      `${btcAmount.toLocaleString("en-US", { minimumFractionDigits: 8, maximumFractionDigits: 8 })} BTC`,
    );
  } else {
    const fiatAmount = amount * btcRate;
    html = buildConversionHTML(
      `${amount.toLocaleString("en-US", { minimumFractionDigits: 8, maximumFractionDigits: 8 })} BTC`,
      `${symbol}${fiatAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${code}`,
    );
  }
  $("#conversionResult").html(html);
}

function buildConversionHTML(from, to) {
  return `
    <div class="flex items-center justify-between">
      <div class="flex flex-col">
        <span class="text-xs text-gray-500 dark:text-gray-400">From:</span>
        <span class="font-medium text-gray-900 dark:text-white">${from}</span>
      </div>
      <div class="flex items-center justify-center mx-2">
        <i class="fa-solid fa-arrow-right text-gray-400 text-sm"></i>
      </div>
      <div class="flex flex-col items-end">
        <span class="text-xs text-gray-500 dark:text-gray-400">To:</span>
        <span class="font-medium text-gray-900 dark:text-white">${to}</span>
      </div>
    </div>`;
}

// ─── Form Submit ──────────────────────────────────────────────────────────────
async function submitSwap(e) {
  e.preventDefault();
  const btn = $("#swapForm").find('button[type="submit"]');
  btn.prop("disabled", true).html('<i class="fa-solid fa-spinner fa-spin mr-2"></i> Processing...');

  try {
    const res  = await fetch("/api/swap", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        from_currency: $("#from_currency").val(),
        to_currency:   $("#to_currency").val(),
        amount:        $("#amount").val(),
      }),
    });
    const data = await res.json();

    if (data.success) {
      $("#conversionResult").html(`
        <div class="text-center text-green-600 dark:text-green-400 font-semibold text-sm">
          ✅ ${data.message}
        </div>`);
      $("#amount").val("");
      localStorage.removeItem("swapDataCache");
      await loadSwapData();
    } else {
      $("#conversionResult").html(`
        <div class="text-center text-red-500 dark:text-red-400 font-semibold text-sm">
          ❌ ${data.message}
        </div>`);
    }
  } catch (err) {
    $("#conversionResult").html(
      '<div class="text-center text-red-500 text-sm">Network error. Try again.</div>'
    );
  }

  btn.prop("disabled", false).html(
    '<i class="fa-solid fa-arrows-rotate text-xs mr-2"></i><span>Swap Currencies</span>'
  );
}

// ─── Init ─────────────────────────────────────────────────────────────────────
$(document).ready(function () {
  function waitForUserProfile(cb, attempts = 0) {
    if (window._userProfile)   { cb(); }
    else if (attempts < 20)    { setTimeout(() => waitForUserProfile(cb, attempts + 1), 100); }
    else                       { cb(); }
  }

  // ── MUST wait for _userProfile before ANYTHING runs ───────────────────────
  waitForUserProfile(() => {
    loadFromCacheOrFetch();
    setInterval(loadSwapData, THIRTY_MINUTES);
  });

  $("#swapForm").on("submit", submitSwap);
  $("#from_currency").on("change", function () {
    updateCurrencyLabel();
    updateToCurrency();
    calculateConversion();
  });
  $("#amount").on("input", calculateConversion);
});