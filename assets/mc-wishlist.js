(function () {
  'use strict';

  var KEY = 'manachoice_wishlist_v1';

  function read() {
    try {
      var value = JSON.parse(localStorage.getItem(KEY) || '[]');
      return Array.isArray(value) ? value : [];
    } catch (e) {
      return [];
    }
  }

  function write(items) {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch (e) {}
  }

  function isSaved(id) {
    return read().some(function (item) { return String(item.id) === String(id); });
  }

  function updateHeaderCount() {
    var count = read().length;
    document.querySelectorAll('.mc-wishlist-count').forEach(function (el) {
      el.textContent = count;
      el.classList.toggle('is-visible', count > 0);
    });
  }

  function syncButtons() {
    document.querySelectorAll('[data-mc-wishlist]').forEach(function (button) {
      var id = button.dataset.productId;
      var active = isSaved(id);
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
      var label = button.querySelector('.mc-product-wishlist__label');
      if (label) label.textContent = active ? 'Saved to wishlist' : 'Add to wishlist';
      if (button.dataset.productTitle) {
        button.setAttribute('aria-label', (active ? 'Remove ' : 'Add ') + button.dataset.productTitle + ' ' + (active ? 'from' : 'to') + ' wishlist');
      }
      var icon = button.querySelector('[aria-hidden="true"]');
      if (icon) icon.textContent = active ? '♥' : '♡';
      else if (!button.classList.contains('mc-product-wishlist')) button.textContent = active ? '♥' : '♡';
    });
  }

  function toggle(button) {
    var id = button.dataset.productId;
    if (!id) return;
    var items = read();
    var index = items.findIndex(function (item) { return String(item.id) === String(id); });
    if (index >= 0) {
      items.splice(index, 1);
    } else {
      items.push({
        id: id,
        url: button.dataset.productUrl || '#',
        title: button.dataset.productTitle || 'Product',
        image: button.dataset.productImage || '',
        priceCents: Number(button.dataset.productPriceCents || 0)
      });
    }
    write(items);
    syncButtons();
    updateHeaderCount();
    renderWishlistPage();
  }

  function renderWishlistPage() {
    var root = document.querySelector('[data-mc-wishlist-page]');
    if (!root) return;
    var items = read();
    var empty = root.querySelector('[data-mc-wishlist-empty]');
    var grid = root.querySelector('[data-mc-wishlist-grid]');
    var count = root.querySelector('[data-mc-wishlist-total]');
    if (count) count.textContent = items.length + (items.length === 1 ? ' item' : ' items');
    if (empty) empty.hidden = items.length !== 0;
    if (!grid) return;
    grid.innerHTML = '';

    items.forEach(function (item) {
      var card = document.createElement('article');
      card.className = 'mc-wl-card';
      card.innerHTML =
        '<div class="mc-wl-card__image">' +
          (item.image ? '<img src="' + escapeHtml(item.image) + '" alt="' + escapeHtml(item.title) + '">' : '<div class="mc-wl-card__no-image">No image</div>') +
          '<button type="button" class="mc-wl-card__remove" data-wl-remove="' + escapeHtml(item.id) + '" aria-label="Remove ' + escapeHtml(item.title) + ' from wishlist">×</button>' +
        '</div>' +
        '<div class="mc-wl-card__body">' +
          '<a href="' + escapeHtml(item.url) + '" class="mc-wl-card__title">' + escapeHtml(item.title) + '</a>' +
          '<div class="mc-wl-card__price" data-mc-price-cents="' + Number(item.priceCents || 0) + '"></div>' +
          '<div class="mc-wl-card__actions"><a href="' + escapeHtml(item.url) + '">View product</a><button type="button" data-wl-remove="' + escapeHtml(item.id) + '">Remove</button></div>' +
        '</div>';
      grid.appendChild(card);
    });

    grid.querySelectorAll('[data-wl-remove]').forEach(function (button) {
      button.addEventListener('click', function () {
        var id = button.getAttribute('data-wl-remove');
        write(read().filter(function (item) { return String(item.id) !== String(id); }));
        renderWishlistPage();
        syncButtons();
        updateHeaderCount();
      });
    });

    if (window.ManaChoiceCurrency && typeof window.ManaChoiceCurrency.refresh === 'function') {
      window.ManaChoiceCurrency.refresh();
    }
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char];
    });
  }

  document.addEventListener('click', function (event) {
    var button = event.target.closest && event.target.closest('[data-mc-wishlist]');
    if (button) {
      event.preventDefault();
      event.stopPropagation();
      toggle(button);
    }
  });

  document.addEventListener('DOMContentLoaded', function () {
    syncButtons();
    updateHeaderCount();
    renderWishlistPage();
  });

  window.addEventListener('storage', function (event) {
    if (event.key === KEY) {
      syncButtons();
      updateHeaderCount();
      renderWishlistPage();
    }
  });
})();