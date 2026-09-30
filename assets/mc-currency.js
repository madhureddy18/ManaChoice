(() => {
  /*
   * ManaChoice storefront-only currency display.
   *
   * IMPORTANT:
   * - Base product prices are INR.
   * - These rates are fixed display rates, not Shopify checkout rates.
   * - Changing them never changes the Shopify product price or checkout amount.
   */
  const CONFIG = {
    IN: { currency: 'INR', rate: 1, locale: 'en-IN' },
    US: { currency: 'USD', rate: 95.91, locale: 'en-US' },
    GB: { currency: 'GBP', rate: 126.90, locale: 'en-US' },
    AE: { currency: 'AED', rate: 26.11, locale: 'en-US' },
    CA: { currency: 'CAD', rate: 68.05, locale: 'en-US' },
    AU: { currency: 'AUD', rate: 65.83, locale: 'en-US' },
    DE: { currency: 'EUR', rate: 108.74, locale: 'en-US' },
    SA: { currency: 'SAR', rate: 25.58, locale: 'en-US' },
    SG: { currency: 'SGD', rate: 75.04, locale: 'en-US' },
    LK: { currency: 'LKR', rate: 0.302, locale: 'en-US' },
    JP: { currency: 'JPY', rate: 0.613, locale: 'ja-JP' }
  };

  function currentConfig() {
    const country = (document.documentElement.dataset.mcCountry || 'IN').toUpperCase();
    return CONFIG[country] || CONFIG.IN;
  }

  function format(cents, config) {
    const inr = Number(cents) / 100;
    const amount = inr / config.rate;
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.currency,
      currencyDisplay: 'symbol',
      minimumFractionDigits: config.currency === 'JPY' ? 0 : 2,
      maximumFractionDigits: config.currency === 'JPY' ? 0 : 2
    }).format(amount);
  }

  function convertElement(element, config) {
    const cents = Number(element.dataset.mcPriceCents);
    if (!Number.isFinite(cents)) return;

    // Custom ManaChoice product cards use the element itself.
    if (!element.classList.contains('price')) {
      element.textContent = format(cents, config);
      return;
    }

    // Standard Shopify/Dawn price markup.
    const regular = element.querySelector('.price-item--regular');
    const sale = element.querySelector('.price-item--sale');

    if (regular && !element.classList.contains('price--on-sale')) {
      regular.textContent = format(cents, config);
    }
    if (sale) {
      sale.textContent = format(cents, config);
    }

    const compareCents = Number(element.dataset.mcCompareCents);
    if (Number.isFinite(compareCents)) {
      element.querySelectorAll('.price-item--regular').forEach((node) => {
        // Only strike-through/old-price nodes should receive compare-at value.
        if (node.closest('s')) node.textContent = format(compareCents, config);
      });
    }

    const minCents = Number(element.dataset.mcPriceMinCents);
    const maxCents = Number(element.dataset.mcPriceMaxCents);
    if (Number.isFinite(minCents) && Number.isFinite(maxCents) && minCents !== maxCents) {
      const range = element.querySelector('.price-item--regular');
      if (range) {
        range.textContent = format(minCents, config) + ' – ' + format(maxCents, config);
      }
    }
  }

  function refresh() {
    const config = currentConfig();
    document.querySelectorAll('[data-mc-price-cents]').forEach((element) => {
      convertElement(element, config);
    });
    document.querySelectorAll('[data-mc-compare-cents]').forEach((element) => {
      const cents = Number(element.dataset.mcCompareCents);
      if (Number.isFinite(cents)) element.textContent = format(cents, config);
    });
  }

  let queued = false;
  function scheduleRefresh() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      refresh();
    });
  }

  document.addEventListener('DOMContentLoaded', refresh);
  new MutationObserver(scheduleRefresh).observe(document.documentElement, {
    childList: true,
    subtree: true
  });
  refresh();
})();
