(() => {
  'use strict';
  if (window.__bftPlayerFavorites) return;
  window.__bftPlayerFavorites = true;
  const token = crypto.randomUUID();
  document.documentElement.dataset.bftPlayerInstance = token;
  const isCurrent = () => document.documentElement.dataset.bftPlayerInstance === token;
  const PREFIX = 'free-tv-easy-favs:duplicates:v2:';
  const CATALOGUE = 'free-tv-easy-favs:duplicate-catalogue:v1';
  const normalize = name => name.normalize('NFKC').replace(/\s+/g, ' ').trim().toLowerCase();
  const numberOf = value => /^\d{1,5}$/.test(String(value)) ? String(value).padStart(3, '0') : null;
  let root, manager, home, policies, management, returnContext, managementTimer = 0, frame = 0, metadata = new WeakMap();

  function loadPolicies() {
    const groups = new Map();
    const add = (name, numbers, selected) => {
      if (typeof name !== 'string' || !Array.isArray(numbers)) return;
      numbers = [...new Set(numbers.map(numberOf).filter(Boolean))];
      if (numbers.length < 2) return;
      numbers.sort((a,b) => Number(a) - Number(b));
      const chosen = Array.isArray(selected) ? selected.map(numberOf).filter(number => numbers.includes(number)) : [];
      chosen.sort((a,b) => Number(a) - Number(b));
      const key = JSON.stringify([normalize(name), numbers]);
      groups.set(key, {name: normalize(name), numbers, preferred: chosen[0] || numbers[0]});
    };
    try {
      const catalogue = JSON.parse(localStorage.getItem(CATALOGUE));
      if (Array.isArray(catalogue)) for (const group of catalogue) {
        let preference;
        try { preference = typeof group?.preference === 'string' && group.preference.startsWith(PREFIX) ? JSON.parse(localStorage.getItem(group.preference)) : null; } catch {}
        add(group?.name, group?.numbers, preference?.selected);
      }
      // Existing choices work immediately, including before revisiting the editor.
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key?.startsWith(PREFIX)) continue;
        try {
          const identity = JSON.parse(key.slice(PREFIX.length));
          const preference = JSON.parse(localStorage.getItem(key));
          if (Array.isArray(identity)) {
            const numbers = preference?.numbers;
            const groupKey = Array.isArray(numbers) ? JSON.stringify([normalize(String(identity[0])), numbers.map(numberOf).filter(Boolean).sort((a,b) => Number(a)-Number(b))]) : '';
            if (!groups.has(groupKey)) add(identity[0], numbers, preference?.selected);
          }
        } catch {}
      }
    } catch {}
    return [...groups.values()];
  }

  function mountHome(current) {
    const menu = current?.querySelector('.ZapListMenu');
    if (!menu) { home?.remove(); home = undefined; return; }
    for (const duplicate of menu.querySelectorAll('.bft-player-home')) if (duplicate !== home) duplicate.remove();
    if (home?.parentElement !== menu) {
      home?.remove();
      home = document.createElement('a');
      home.className = 'ZapListMenuItem bft-player-home';
      home.dataset.bftOwned = '';
      home.href = '/home';
      home.title = 'Accueil'; home.setAttribute('aria-label', 'Accueil');
      const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      for (const [name, value] of Object.entries({viewBox: '0 0 24 24', width: '20', height: '20', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.8', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true'})) icon.setAttribute(name, value);
      const path = document.createElementNS(icon.namespaceURI, 'path');
      path.setAttribute('d', 'm3 10 9-7 9 7M5 9v11h5v-6h4v6h5V9');
      icon.append(path); home.append(icon);
    }
    if (menu.lastElementChild !== home) menu.append(home);
    const native = menu.querySelector('.ZapListMenuItem:not(.bft-player-home):not(.bft-manage-player)');
    if (native) {
      const height = `${native.getBoundingClientRect().height}px`;
      const radius = getComputedStyle(native).borderRadius;
      if (menu.style.getPropertyValue('--bft-menu-height') !== height) menu.style.setProperty('--bft-menu-height', height);
      if (menu.style.getPropertyValue('--bft-menu-radius') !== radius) menu.style.setProperty('--bft-menu-radius', radius);
    }

  }
  function restoreRows() {
    root?.querySelectorAll('[data-bft-player-hidden], [data-bft-player-selected]').forEach(row => {
      row.removeAttribute('data-bft-player-hidden');
      row.removeAttribute('data-bft-player-selected');
    });
  }
  function cleanup() {
    manager?.remove(); manager = undefined;
    if (root?.dataset.bftPlayerOwner === token) {
      restoreRows();
      root.classList.remove('bft-player-favorites');
      delete root.dataset.bftPlayerOwner;
    }
    root = undefined; metadata = new WeakMap(); policies = undefined;
  }
  function readRow(row) {
    const header = row.querySelector('.ZapListChannelHeader');
    if (!header) return metadata.get(row);
    const match = header.textContent.match(/^\s*(\d{1,5})\s*[-–—]\s*(.+?)\s*$/u);
    if (!match) { metadata.delete(row); return null; }
    const result = {number: numberOf(match[1]), name: normalize(match[2])};
    metadata.set(row, result);
    return result;
  }
  function cancelManagement() {
    management = undefined;
    if (returnContext?.stage === 'opening') returnContext = undefined;
    if (managementTimer) clearTimeout(managementTimer);
    managementTimer = 0;
  }
  function openManagement(event) {
    if (!isCurrent() || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const link = document.querySelector('.ChannelsPage a[data-test-id="submenu-favorite_channels"]');
    if (!link || new URL(link.href, location.href).origin !== location.origin || new URL(link.href, location.href).pathname.replace(/\/$/, '') !== '/home/favorite_channels') return;
    event.preventDefault();
    if (management) return;
    management = {from: location.pathname};
    returnContext = /^\/home\/(?:channels|favorite_channels|included_channels)\/[^/]+\/(?:play|mosaic)\/?$/.test(location.pathname) ? {stage: 'opening', validating: false} : undefined;
    managementTimer = setTimeout(cancelManagement, 10000);
    // Use Free's own SPA links: a full document load empties its favourites store.
    link.click();
    schedule();
  }
  function finishManagement() {
    if (!management) return;
    const pathname = location.pathname.replace(/\/$/, '');
    if (pathname !== '/home/favorite_channels') {
      if (location.pathname !== management.from) cancelManagement();
      return;
    }
    const button = [...document.querySelectorAll('.ChannelsPageSubMenuContainer button')].find(button => normalize(button.textContent) === 'gérer mes favoris');
    const empty = document.querySelector('.ChannelsPage .EmptyFavorites button');
    const target = button || empty;
    if (!target || target.disabled) return;
    if (returnContext) returnContext.stage = 'waiting-editor';
    cancelManagement();
    target.click();
  }
  function validationClicked(event) {
    if (!isCurrent() || !returnContext || location.pathname.replace(/\/$/, '') !== '/home/favorite_channels/edit') return;
    const button = event.target instanceof Element ? event.target.closest('.ChannelsFavoriteNavRight > button') : null;
    if (!button || button.disabled || normalize(button.textContent) !== 'valider la sélection') return;
    returnContext.stage = 'editor';
    returnContext.validating = true;
  }
  function finishReturn() {
    if (!returnContext) return;
    const pathname = location.pathname.replace(/\/$/, '');
    if (returnContext.stage === 'opening') {
      if (!management) returnContext = undefined;
      return;
    }
    if (pathname === '/home/favorite_channels/edit') { returnContext.stage = 'editor'; return; }
    if (returnContext.stage === 'waiting-editor' && pathname === '/home/favorite_channels') return;
    const shouldReturn = returnContext.stage === 'editor' && returnContext.validating && pathname === '/home/favorite_channels';
    returnContext = undefined;
    // Free has submitted the selection and returned one step to the grid. The preceding entry is our original player.
    if (shouldReturn) history.back();
  }
  function update() {
    frame = 0;
    if (!isCurrent()) { stop(); return; }
    finishReturn();
    finishManagement();
    const current = document.querySelector('.ZapListModalContent');
    mountHome(current);
    const active = current?.querySelector('.ZapListMenuItem.active');
    if (!current || !active || normalize(active.textContent) !== 'favoris') { cleanup(); return; }
    if (current !== root) { cleanup(); root = current; }
    root.dataset.bftPlayerOwner = token;
    root.classList.add('bft-player-favorites');
    for (const duplicate of root.querySelectorAll('.bft-manage-player')) if (duplicate !== manager) duplicate.remove();
    if (!manager?.isConnected) {
      manager = document.createElement('a');
      manager.className = 'ZapListMenuItem bft-manage-player Typography body2';
      manager.dataset.bftOwned = '';
      manager.href = '/home/favorite_channels/edit';
      manager.textContent = 'Gérer mes favoris';
      manager.addEventListener('click', openManagement);
      const menu = root.querySelector('.ZapListMenu');
      menu.insertBefore(manager, home?.parentElement === menu ? home : null);
    }
    const menu = root.querySelector('.ZapListMenu');
    if (manager.parentElement !== menu || manager.nextElementSibling !== home) menu.insertBefore(manager, home?.parentElement === menu ? home : null);
    if (!policies) policies = loadPolicies();
    const list = root.querySelector('.ZapListModalChannelList');
    if (!list) return;
    const rows = [...list.querySelectorAll(':scope > .ZapListChannelRowContainer')];
    const entries = rows.map(row => ({row, entry: readRow(row)}));
    const allKnown = entries.every(({entry}) => entry);
    const hidden = new Set(), selected = new Set();
    for (const group of policies) {
      const matches = entries.filter(({entry}) => entry && entry.name === group.name && group.numbers.includes(entry.number));
      if (!matches.length) continue;
      let preferred = group.preferred;
      if (allKnown && !matches.some(({entry}) => entry.number === preferred)) {
        preferred = [...matches].sort((a,b) => Number(a.entry.number) - Number(b.entry.number))[0].entry.number;
      }
      const keep = matches.find(({entry}) => entry.number === preferred);
      for (const {row, entry} of matches) if (entry.number !== preferred) hidden.add(row);
      if (keep && matches.some(({row}) => row.classList.contains('selected'))) selected.add(keep.row);
    }
    for (const {row} of entries) {
      if (hidden.has(row)) row.setAttribute('data-bft-player-hidden', '');
      else row.removeAttribute('data-bft-player-hidden');
      if (selected.has(row)) row.setAttribute('data-bft-player-selected', '');
      else row.removeAttribute('data-bft-player-selected');
    }
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(update); }
  function storageChanged(event) {
    if (event.key === null || event.key === CATALOGUE || event.key.startsWith(PREFIX)) { policies = undefined; schedule(); }
  }
  const observer = new MutationObserver(records => {
    if (!isCurrent()) { stop(); return; }
    if (records.some(record => !record.target.parentElement?.closest('[data-bft-owned]') &&
      (record.type !== 'attributes' || record.oldValue !== record.target.getAttribute(record.attributeName)))) schedule();
  });
  function stop() {
    observer.disconnect();
    home?.remove(); home = undefined;
    cancelManagement();
    returnContext = undefined;
    document.removeEventListener('click', validationClicked, true);
    if (frame) cancelAnimationFrame(frame);
    window.removeEventListener('storage', storageChanged);
    window.removeEventListener('popstate', schedule);
    cleanup();
  }
  observer.observe(document.body, {subtree: true, childList: true, characterData: true,
    attributes: true, attributeOldValue: true, attributeFilter: ['class']});
  document.addEventListener('click', validationClicked, true);
  window.addEventListener('storage', storageChanged);
  window.addEventListener('popstate', schedule);
  schedule();
})();
