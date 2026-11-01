(() => {
  'use strict';
  if (window.__bftPlayerZapping) return;
  window.__bftPlayerZapping = true;
  const token = crypto.randomUUID();
  document.documentElement.dataset.bftZapInstance = token;
  document.documentElement.classList.remove('bft-zap-scanning');
  const isCurrent = () => document.documentElement.dataset.bftZapInstance === token;
  const normalize = text => text.normalize('NFKC').replace(/\s+/g, ' ').trim().toLowerCase();
  let center, previous, next, status, channelTitle, channelHint, operation, frame = 0, statusTimer = 0, warmFavorites;
  let planRaw, lastResolved, logoIndex = new Map(), labelEvidence = '';

  function nativeClick(element) {
    if (!element?.isConnected) throw new Error('Contrôle Free indisponible.');
    element.dispatchEvent(new MouseEvent('click', {bubbles: true, cancelable: true, view: window}));
  }
  function check(context) {
    if (!isCurrent() || context.signal.aborted || !context.host.isConnected || (context.root && !context.root.isConnected)) throw new DOMException('Zapping interrompu', 'AbortError');
  }
  function nextFrame(context) {
    check(context);
    return new Promise((resolve, reject) => {
      const aborted = () => { cancelAnimationFrame(id); reject(new DOMException('Zapping interrompu', 'AbortError')); };
      const id = requestAnimationFrame(() => { context.signal.removeEventListener('abort', aborted); resolve(); });
      context.signal.addEventListener('abort', aborted, {once: true});
    });
  }
  async function settle(context) { await nextFrame(context); await nextFrame(context); check(context); }
  async function waitFor(predicate, context) {
    for (;;) {
      check(context);
      const result = predicate();
      if (result) return result;
      await nextFrame(context);
    }
  }
  function readHeader(row) {
    const match = row?.querySelector('.ZapListChannelHeader')?.textContent.match(/^\s*(\d{1,5})\s*[-–—]\s*(.+?)\s*$/u);
    return match ? {number: Number(match[1]), name: match[2]} : null;
  }
  function logoKey(value) {
    if (typeof value !== 'string' || !value) return '';
    try { return new URL(value.replace(/%d/g, '48'), location.origin).pathname.replace(/\/([wh])\d+(?=\/|\.|$)/g, '/$1#'); } catch { return ''; }
  }
  function cachedLogoIndex() {
    let raw;
    try { raw = localStorage.getItem('SERVICE_PLAN'); } catch { return logoIndex; }
    if (raw === planRaw) return logoIndex;
    planRaw = raw; logoIndex = new Map();
    try {
      const plan = JSON.parse(raw)?.data;
      if (!Array.isArray(plan?.channel_list) || !plan.channels) return logoIndex;
      for (const listing of plan.channel_list) {
        const number = Number(listing.number);
        if (!Number.isFinite(number)) continue;
        const ids = new Set([listing.channel_id, ...Object.values(listing.regional_channel || {})]);
        for (const id of ids) {
          const channel = plan.channels[String(id)];
          const key = logoKey(channel?.icon_light);
          if (!key || typeof channel?.name !== 'string') continue;
          const entries = logoIndex.get(key) || [];
          if (!entries.some(entry => entry.number === number && entry.name === channel.name)) entries.push({number, name: channel.name});
          logoIndex.set(key, entries);
        }
      }
    } catch {}
    return logoIndex;
  }
  function updateAllPosition() {
    try {
      const listings = JSON.parse(localStorage.getItem('SERVICE_PLAN'))?.data?.channel_list;
      if (!Array.isArray(listings)) return;
      const numbers = [...new Set(listings.map(item => Number(item.number)).filter(Number.isFinite))];
      const index = numbers.indexOf((channelHint || lastResolved)?.number);
      for (const column of [previous, next]) column?.querySelectorAll('button[data-scope="all"]').forEach(button => {
        const text = `${Number(button.dataset.direction) < 0 ? 'Chaîne précédente' : 'Chaîne suivante'} — toutes les chaînes (${index + 1}/${numbers.length})`;
        const tooltip = button.querySelector('.bft-zap-tooltip');
        if (tooltip && tooltip.textContent !== text) tooltip.textContent = text;
        if (button.getAttribute('aria-label') !== text) button.setAttribute('aria-label', text);
      });
    } catch {}
  }
  let favoriteOrder = [], favoriteOrderRaw;
  function updateFavoritePosition() {
    let numbers = favoriteOrder;
    try {
      const raw = localStorage.getItem('USER_FAVORITES_CHANNELS');
      if (raw !== favoriteOrderRaw) {
        const ids = new Set((JSON.parse(raw)?.data?.channel_ids || []).map(String));
        const plan = JSON.parse(localStorage.getItem('SERVICE_PLAN'))?.data;
        if (!Array.isArray(plan?.channel_list)) return;
        numbers = plan.channel_list.filter(item => [item.channel_id, ...Object.values(item.regional_channel || {})].some(id => ids.has(String(id)))).map(item => Number(item.number));
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (!key?.startsWith('free-tv-easy-favs:duplicates:v2:')) continue;
          try {
            const saved = JSON.parse(localStorage.getItem(key));
            if (Array.isArray(saved?.numbers) && Array.isArray(saved?.selected)) numbers = numbers.filter(number => !saved.numbers.some(n => Number(n) === number) || saved.selected.some(n => Number(n) === number));
          } catch {}
        }
        numbers = [...new Set(numbers)].sort((a,b) => a-b);
      }
    } catch { return; }
    const index = numbers.indexOf((channelHint || lastResolved)?.number);
    for (const column of [previous, next]) column?.querySelectorAll('button[data-scope="favorites"]').forEach(button => {
      const text = `${Number(button.dataset.direction) < 0 ? 'Chaîne précédente' : 'Chaîne suivante'} — favoris (${index + 1}/${numbers.length})`;
      const tooltip = button.querySelector('.bft-zap-tooltip');
      if (tooltip && tooltip.textContent !== text) tooltip.textContent = text;
      if (button.getAttribute('aria-label') !== text) button.setAttribute('aria-label', text);
    });
  }
  function updateChannelTitle() {
    if (!channelTitle?.isConnected) return;
    const host = center.closest('.PlayerUIControls');
    if (!host) return;
    const popupOpen = [...host.querySelectorAll('.PlayerPanel')].some(panel => {
      if (panel.hidden || panel.getAttribute('aria-hidden') === 'true') return false;
      const style = getComputedStyle(panel), bounds = panel.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0 && bounds.width > 0 && bounds.height > 0;
    });
    const visibility = popupOpen ? 'hidden' : '';
    if (channelTitle.style.visibility !== visibility) channelTitle.style.visibility = visibility;
    const logo = logoKey(host.querySelector('.ProgramInfoHeaderContainer .CircularProgress img')?.src);
    const marked = host.querySelector('.ZapListChannelRowContainer[data-bft-player-selected]');
    const observed = readHeader(marked || host.querySelector('.ZapListChannelRowContainer.selected'));
    const evidence = JSON.stringify([logo, observed, channelHint]);
    if (evidence === labelEvidence && channelTitle.textContent) return;
    labelEvidence = evidence;
    let channel = observed;
    const candidates = logo ? (cachedLogoIndex().get(logo) || []) : [];
    if (channelHint && ((channel && normalize(channel.name) === normalize(channelHint.name)) || candidates.some(entry => entry.number === channelHint.number && normalize(entry.name) === normalize(channelHint.name)))) channel = channelHint;
    if (!channel && candidates.length && new Set(candidates.map(entry => normalize(entry.name))).size === 1) channel = [...candidates].sort((a,b) => a.number-b.number)[0];
    if (!channel && lastResolved?.logo === logo) channel = lastResolved;
    if (!channel) {
      if (channelTitle.textContent) channelTitle.textContent = '';
      channelTitle.removeAttribute('title');
      return;
    }
    lastResolved = {...channel, logo};
    updateFavoritePosition();
    updateAllPosition();
    const text = `${String(channel.number).padStart(3, '0')} · ${channel.name}`;
    if (channelTitle.textContent !== text) { channelTitle.textContent = text; channelTitle.title = text; }
  }
  function channelClicked(event) {
    if (!isCurrent()) return;
    const row = event.target instanceof Element ? event.target.closest('.ZapListChannelRowContainer') : null;
    const channel = row && readHeader(row);
    if (channel) { channelHint = channel; labelEvidence = ''; schedule(); }
  }
  function currentRows(root) {
    return [...root.querySelectorAll('.ZapListModalChannelList > .ZapListChannelRowContainer')];
  }
  function isMosaic(row, entry) {
    const name = String(entry?.name || readHeader(row)?.name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    if (/\bmosaique\b/.test(name)) return true;
    return [...row.querySelectorAll('a[href]')].some(link => {
      try { return /\/mosaic\/?$/.test(new URL(link.getAttribute('href'), location.href).pathname); } catch { return false; }
    });
  }
  async function showRow(row, context) {
    check(context);
    const list = row.closest('.ZapListModalChannelList');
    if (!list || !context.root.contains(list)) throw new Error('Liste des chaînes indisponible.');
    const rowBounds = row.getBoundingClientRect();
    const listBounds = list.getBoundingClientRect();
    const delta = rowBounds.top + rowBounds.height / 2 - listBounds.top - list.clientTop - list.clientHeight / 2;
    const top = Math.max(0, Math.min(list.scrollHeight - list.clientHeight, list.scrollTop + delta));
    // Scroll this list only; scrollIntoView also moves the player and its ancestors.
    list.scrollTo({top, behavior: 'instant'});
    await waitFor(() => readHeader(row) || row.hasAttribute('data-bft-player-hidden'), context);
    await settle(context);
    return readHeader(row);
  }
  async function chooseTab(scope, context) {
    const label = scope === 'all' ? 'toutes les chaînes' : 'favoris';
    const tab = [...context.root.querySelectorAll('.ZapListMenuItem:not(.bft-player-home)')].find(tab => normalize(tab.textContent) === label);
    if (!tab) throw new Error('Onglet Free indisponible.');
    if (!tab.classList.contains('active')) nativeClick(tab);
    await waitFor(() => tab.classList.contains('active'), context);
    await settle(context);
  }
  function favoriteCache() {
    try {
      const raw = localStorage.getItem('USER_FAVORITES_CHANNELS');
      const value = JSON.parse(raw);
      if (!Array.isArray(value?.data?.channel_ids)) return null;
      return {raw, fresh: Number(value.expire) > Date.now(), count: value.data.channel_ids.length};
    } catch { return null; }
  }
  async function favoriteEntries(context) {
    const remembered = new WeakMap();
    for (;;) {
      check(context);
      const rows = currentRows(context.root);
      for (const row of rows) {
        const data = readHeader(row);
        if (data) remembered.set(row, data);
      }
      const missing = rows.find(row => !remembered.has(row) && !row.hasAttribute('data-bft-player-hidden'));
      if (!missing) {
        await settle(context);
        const latest = currentRows(context.root);
        if (latest.length !== rows.length || latest.some((row, index) => row !== rows[index])) continue;
        return latest.filter(row => !row.hasAttribute('data-bft-player-hidden') && remembered.has(row)).map(row => ({row, ...remembered.get(row)}));
      }
      await showRow(missing, context);
    }
  }
  function message(text) {
    if (!status?.isConnected) return;
    status.textContent = text;
    if (statusTimer) clearTimeout(statusTimer);
    statusTimer = setTimeout(() => { if (status) status.textContent = ''; }, 3500);
  }
  function setBusy(busy, activeButton) {
    for (const column of [previous, next]) column?.querySelectorAll('button').forEach(button => {
      button.disabled = busy;
      button.classList.toggle('disabled', busy && button === activeButton);
    });
  }
  async function zap(scope, direction, event) {
    event.stopPropagation();
    if (operation || !isCurrent() || !center?.isConnected) return;
    const controller = new AbortController();
    const context = {controller, signal: controller.signal, host: center.closest('.PlayerUIControls'), root: null, opened: false, pathname: location.pathname};
    if (!context.host) return;
    operation = context;
    setBusy(true, event.currentTarget);
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      let root = context.host.querySelector('.ZapListModalContent');
      if (!root) {
        context.opened = true;
        document.documentElement.classList.add('bft-zap-scanning');
        nativeClick(context.host.querySelector('#zap-list-button'));
        root = await waitFor(() => context.host.querySelector('.ZapListModalContent'), context);
      }
      context.root = root;
      await chooseTab('all', context);
      const selected = await waitFor(() => root.querySelector('.ZapListModalChannelList > .ZapListChannelRowContainer.selected'), context);
      const current = await showRow(selected, context);
      if (!current) throw new Error('Chaîne en cours non reconnue.');
      let target;
      if (scope === 'all') {
        const rows = currentRows(root);
        const index = rows.indexOf(selected);
        if (index < 0 || !rows.length) throw new Error('Liste des chaînes indisponible.');
        for (let step = 1; step <= rows.length; step++) {
          const candidate = rows[(index + direction * step + rows.length) % rows.length];
          const entry = await showRow(candidate, context);
          if (!isMosaic(candidate, entry)) { target = candidate; break; }
        }
        if (!target) { message('Aucune chaîne classique disponible.'); return; }
      } else {
        const allCount = currentRows(root).length;
        const before = favoriteCache()?.raw;
        let duplicateAllowance = 0;
        try {
          const catalogue = JSON.parse(localStorage.getItem('free-tv-easy-favs:duplicate-catalogue:v1'));
          if (Array.isArray(catalogue)) duplicateAllowance = catalogue.reduce((total, group) => total + (Array.isArray(group?.numbers) ? Math.max(0, new Set(group.numbers).size - 1) : 0), 0);
        } catch {}
        await chooseTab('favorites', context);
        // A rendered filtered list is authoritative even when Free's SDK cache has expired.
        // Wait for initialization only while Free still displays its transient full list.
        await waitFor(() => {
          const cache = favoriteCache();
          if (root.querySelector('.EmptyFavorites') || currentRows(root).length < allCount || (cache && (cache.fresh || cache.raw !== before || cache.raw === warmFavorites || cache.count + duplicateAllowance >= allCount))) {
            if (cache) warmFavorites = cache.raw;
            return true;
          }
          return false;
        }, context);
        await settle(context);
        await waitFor(() => root.querySelector('.ZapListModalChannelList, .EmptyFavorites'), context);
        const allFavorites = await favoriteEntries(context);
        const entries = allFavorites.filter(entry => !isMosaic(entry.row, entry));
        favoriteOrder = allFavorites.map(entry => entry.number); favoriteOrderRaw = favoriteCache()?.raw;
        updateFavoritePosition();
        if (!entries.length) { message('Aucune chaîne favorite disponible.'); return; }
        const marked = entries.findIndex(({row}) => row.hasAttribute('data-bft-player-selected'));
        const native = entries.findIndex(({row}) => row.classList.contains('selected'));
        const index = marked >= 0 ? marked : native;
        if (index >= 0) target = entries[(index + direction + entries.length) % entries.length].row;
        else {
          const candidates = entries.filter(entry => direction > 0 ? entry.number > current.number : entry.number < current.number);
          target = direction > 0 ? (candidates[0] || entries[0]).row : (candidates.at(-1) || entries.at(-1)).row;
        }
      }
      if (target === selected || target.classList.contains('selected') || target.hasAttribute('data-bft-player-selected')) return;
      await showRow(target, context);
      check(context);
      if (target.hasAttribute('data-bft-player-hidden')) throw new Error('Liste des favoris en cours de mise à jour.');
      const row = target.querySelector('.ZapListChannelRow');
      if (!row) throw new Error('Chaîne indisponible.');
      // Use the original click handler: playback, rights, parental controls and fullscreen remain native.
      nativeClick(row);
    } catch (error) {
      if (isCurrent() && center?.isConnected) message(error.name === 'AbortError' ? 'Zapping interrompu : la liste Free n’est pas prête.' : error.message);
    } finally {
      clearTimeout(timer);
      if (isCurrent()) {
        const modalRoot = context.root?.isConnected ? context.root : location.pathname === context.pathname ? document.querySelector('.ZapListModalContent') : null;
        if (context.opened && modalRoot) {
          const close = modalRoot.closest('.ZapListModal')?.querySelector('.ZapListCloseIcon');
          if (close) nativeClick(close);
        }
        document.documentElement.classList.remove('bft-zap-scanning');
        setBusy(false);
      }
      if (operation === context) operation = undefined;
    }
  }
  function column(direction) {
    const container = document.createElement('div');
    container.className = 'bft-zap-column'; container.dataset.bftOwned = '';
    for (const scope of ['all', 'favorites']) {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'PlayerButton medium bft-zap-button';
      button.dataset.scope = scope; button.dataset.direction = String(direction);
      if (scope === 'favorites') { button.addEventListener('mouseenter', updateFavoritePosition); button.addEventListener('focus', updateFavoritePosition); }
      if (scope === 'all') { button.addEventListener('mouseenter', updateAllPosition); button.addEventListener('focus', updateAllPosition); }
      const label = `${direction < 0 ? 'Chaîne précédente' : 'Chaîne suivante'} — ${scope === 'all' ? 'toutes les chaînes' : 'favoris'}`;
      button.setAttribute('aria-label', label);
      const tooltip = document.createElement('span');
      tooltip.className = 'Typography body2 bft-zap-tooltip';
      tooltip.id = `bft-zap-tip-${token}-${direction < 0 ? 'previous' : 'next'}-${scope}`;
      tooltip.setAttribute('role', 'tooltip'); tooltip.textContent = label;
      button.setAttribute('aria-describedby', tooltip.id);
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      for (const [name, value] of Object.entries({viewBox: '0 0 40 40', width: '40', height: '40', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.8', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true', class: 'PlayerButtonIcon medium'})) svg.setAttribute(name, value);
      const circle = document.createElementNS(svg.namespaceURI, 'circle');
      circle.setAttribute('cx', '20'); circle.setAttribute('cy', '20'); circle.setAttribute('r', '16');
      const path = document.createElementNS(svg.namespaceURI, 'path');
      path.setAttribute('d', direction < 0 ? 'm19.5 14-6 6 6 6m7-12-6 6 6 6' : 'm13.5 14 6 6-6 6m7-12 6 6-6 6');
      svg.append(circle, path);
      if (scope === 'favorites') {
        const star = document.createElementNS(svg.namespaceURI, 'path');
        star.setAttribute('d', 'm31 25 1.8 3.6 4 .6-2.9 2.8.7 4-3.6-1.9-3.6 1.9.7-4-2.9-2.8 4-.6Z');
        star.setAttribute('fill', 'currentColor'); star.setAttribute('stroke-width', '1'); svg.append(star);
      }
      button.append(svg, tooltip);
      button.addEventListener('click', event => { void zap(scope, direction, event); });
      button.addEventListener('dblclick', event => event.stopPropagation());
      container.append(button);
    }
    return container;
  }
  function unmount() {
    operation?.controller.abort();
    previous?.remove(); next?.remove(); status?.remove(); channelTitle?.remove();
    if (center?.dataset.bftZapOwner === token) {
      center.classList.remove('bft-zap-center');
      const layout = center.closest('.PlayerUIControlsBottomConfigFlex');
      layout?.classList.remove('bft-zap-layout');
      layout?.style.removeProperty('--bft-channel-base-size');
      delete center.dataset.bftZapOwner;
    }
    center = previous = next = status = channelTitle = undefined; labelEvidence = '';
  }
  function update() {
    frame = 0;
    if (!isCurrent()) { stop(); return; }
    const current = [...document.querySelectorAll('.PlayerUIControlsBottomConfigCenteredControlsFlex')].find(element => element.querySelector('#zap-list-button'));
    if (current === center && previous?.isConnected && next?.isConnected) { updateChannelTitle(); return; }
    unmount();
    if (!current) return;
    center = current;
    center.querySelectorAll('.bft-zap-column, .bft-zap-status, .bft-current-channel').forEach(element => element.remove());
    center.classList.add('bft-zap-center'); center.dataset.bftZapOwner = token;
    center.closest('.PlayerUIControlsBottomConfigFlex')?.classList.add('bft-zap-layout');
    previous = column(-1); next = column(1);
    center.prepend(previous); center.append(next);
    const sample = document.createElement('div'); sample.className = 'Typography body2'; sample.dataset.bftOwned = '';
    center.append(sample);
    const baseSize = getComputedStyle(sample).fontSize; sample.remove();
    center.closest('.PlayerUIControlsBottomConfigFlex')?.style.setProperty('--bft-channel-base-size', baseSize);
    status = document.createElement('div'); status.className = 'Typography body2 bft-zap-status'; status.dataset.bftOwned = '';
    status.setAttribute('role', 'status'); center.append(status);
    channelTitle = document.createElement('div'); channelTitle.className = 'Typography body2 bft-current-channel'; channelTitle.dataset.bftOwned = '';
    center.append(channelTitle); updateChannelTitle();
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(update); }
  const observer = new MutationObserver(records => {
    if (!isCurrent()) { stop(); return; }
    if (records.some(record => !record.target.parentElement?.closest('[data-bft-owned]') &&
      (record.type !== 'attributes' || record.oldValue !== record.target.getAttribute(record.attributeName)))) schedule();
  });
  function stop() {
    observer.disconnect();
    if (frame) cancelAnimationFrame(frame);
    if (statusTimer) clearTimeout(statusTimer);
    document.removeEventListener('click', channelClicked, true);
    unmount();
  }
  observer.observe(document.body, {subtree: true, childList: true, attributes: true, attributeOldValue: true, attributeFilter: ['class', 'src']});
  document.addEventListener('click', channelClicked, true);
  schedule();
})();
