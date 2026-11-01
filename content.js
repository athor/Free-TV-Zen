(() => {
  'use strict';
  const categoryApi = globalThis.__bftChannelCategories;
  if (!categoryApi) return;
  if (window.__betterFreeTV) return;
  window.__betterFreeTV = true;
  const instance = crypto.randomUUID();
  document.documentElement.dataset.bftInstance = instance;
  const currentInstance = () => document.documentElement.dataset.bftInstance === instance;
  const EDIT = '/home/favorite_channels/edit';
  const selectedPath = 'M14.5 2c-6.6 0-12 5.4-12 12';
  const cache = new Map();
  // Identical metadata creates a candidate, not proof of a shared Free favourite.
  const duplicateGroups = new Map();
  const groupKey = entry => JSON.stringify([entry.name.normalize('NFKC').replace(/\s+/g, ' ').trim().toLowerCase(), entry.src]);
  const preferenceKey = group => 'free-tv-easy-favs:duplicates:v2:' + group.key;
  function saveChoices(group) {
    try { localStorage.setItem(preferenceKey(group), JSON.stringify({numbers: [...group.members.keys()], selected: [...group.choices]})); } catch {}
  }
  function restoreChoices(group) {
    let saved;
    try { saved = JSON.parse(localStorage.getItem(preferenceKey(group))); } catch {}
    // Retain the choice from the previous National Geographic implementation.
    if (!saved && [...group.members.values()].every(entry => entry.name === 'National Geographic')) {
      try {
        const legacy = JSON.parse(localStorage.getItem('free-tv-easy-favs:national-geographic:v1'));
        if (Array.isArray(legacy)) saved = {numbers: ['056', '520'], selected: legacy};
      } catch {}
    }
    const numbers = [...group.members.keys()].sort();
    if (!saved || !Array.isArray(saved.numbers) || !Array.isArray(saved.selected) || JSON.stringify([...saved.numbers].sort()) !== JSON.stringify(numbers)) return;
    const nativeSelected = [...group.members.values()].some(entry => entry.checked);
    const chosen = saved.selected.filter(number => group.members.has(number));
    group.choices = new Set(nativeSelected ? (chosen.length ? chosen : [numbers[0]]) : []);
  }
  function prepareIndependent(cards) {
    for (const group of duplicateGroups.values()) for (const entry of group.members.values()) entry.card = null;
    for (const card of cards) {
      const entry = read(card);
      if (!entry || !entry.src) continue;
      const key = groupKey(entry);
      let group = duplicateGroups.get(key);
      if (!group) {
        group = {key, members: new Map(), choices: null, pending: null, restored: false};
        duplicateGroups.set(key, group);
      }
      group.members.set(entry.number, entry);
    }
    for (const group of duplicateGroups.values()) {
      if (group.members.size < 2) continue;
      for (const entry of group.members.values()) {
        if (!entry.card) continue;
        const others = duplicateNumbers(entry);
        const number = entry.card.querySelector('.ChannelNumber');
        if (!number) continue;
        let alias = number.querySelector('.bft-alias-number');
        if (!alias) {
          alias = make('span', 'bft-alias-number');
          alias.dataset.bftOwned = '';
          number.append(alias);
        }
        const label = ` (${others.join(', ')})`;
        if (alias.textContent !== label) alias.textContent = label;
      }
      if (!group.restored) { restoreChoices(group); group.restored = true; }
      const pending = group.pending;
      if (pending) {
        const clicked = group.members.get(pending.number);
        if (clicked?.card && clicked.checked !== pending.before.get(pending.number)) {
          // Only a synchronised change on a second visible channel proves linkage.
          const linked = [...group.members.values()].some(entry => entry.card && entry.number !== pending.number && pending.before.has(entry.number) && entry.checked !== pending.before.get(entry.number));
          if (linked) {
            group.choices = new Set([...pending.before].filter(([, checked]) => checked).map(([number]) => number));
            if (pending.before.get(pending.number)) group.choices.delete(pending.number);
            else group.choices.add(pending.number);
            saveChoices(group);
            if ((group.choices.size > 0) !== clicked.checked) {
              // Restore the shared native favourite when another local number remains selected.
              group.pending = null;
              restoringNative = true;
              try { clicked.card.click(); } finally { restoringNative = false; }
            }
          }
          group.pending = null;
        } else if (performance.now() - pending.time > 1500) group.pending = null;
      }
      if (!group.choices) continue;
      for (const entry of group.members.values()) {
        if (!entry.card) continue;
        entry.card.dataset.bftIndependent = '';
        let icon = entry.card.querySelector('.bft-choice-indicator');
        if (!icon) {
          icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          icon.setAttribute('class', 'bft-choice-indicator');
          icon.setAttribute('viewBox', '0 0 29 28');
          icon.setAttribute('fill', 'none');
          const circle = document.createElementNS(icon.namespaceURI, 'circle');
          for (const [name, value] of Object.entries({cx: '14.5', cy: '14', r: '14', fill: '#181818', 'fill-opacity': '0.6'})) circle.setAttribute(name, value);
          const path = document.createElementNS(icon.namespaceURI, 'path');
          path.setAttribute('fill', '#fff');
          icon.append(circle, path);
          icon.dataset.bftOwned = '';
          icon.setAttribute('aria-hidden', 'true');
          entry.card.querySelector('.EditThumbnail').append(icon);
        }
        const shape = group.choices.has(entry.number) ? "M14.5 2c-6.6 0-12 5.4-12 12s5.4 12 12 12 12-5.4 12-12-5.4-12-12-12m6.9 9.3-7.9 7.6c-.3.3-.7.4-1 .4-.4 0-.7-.1-1-.4l-3.8-3.5c-.6-.6-.6-1.5-.1-2.2s1.5-.6 2.2-.1l2.8 2.6 6.9-6.6c.6-.6 1.5-.6 2.2 0 .4.6.3 1.6-.3 2.2" : "M14.5 26c-6.6 0-12-5.4-12-12s5.4-12 12-12 12 5.4 12 12-5.4 12-12 12m0-20.8c-4.8 0-8.8 4-8.8 8.8s4 8.8 8.8 8.8 8.8-4 8.8-8.8-4-8.8-8.8-8.8";
        const path = icon.querySelector('path');
        if (path.getAttribute('d') !== shape) path.setAttribute('d', shape);
      }
    }
    publishDuplicateCatalogue();
  }
  let publishedCatalogue = '';
  function publishDuplicateCatalogue() {
    const current = [...duplicateGroups.values()].filter(group => group.members.size > 1).map(group => ({
      name: JSON.parse(group.key)[0], numbers: [...group.members.keys()].sort((a,b) => Number(a) - Number(b)), preference: preferenceKey(group)
    }));
    if (!current.length) return;
    const signature = JSON.stringify(current);
    if (signature === publishedCatalogue) return;
    try {
      const key = 'free-tv-easy-favs:duplicate-catalogue:v1';
      const stored = JSON.parse(localStorage.getItem(key));
      const merged = new Map();
      for (const group of [...(Array.isArray(stored) ? stored : []), ...current]) {
        if (typeof group?.name === 'string' && Array.isArray(group.numbers)) merged.set(JSON.stringify([group.name, [...group.numbers].sort()]), group);
      }
      localStorage.setItem(key, JSON.stringify([...merged.values()]));
      publishedCatalogue = signature;
    } catch {}
  }
  function selected(entry) {
    const group = entry.src && duplicateGroups.get(groupKey(entry));
    return group?.choices ? group.choices.has(entry.number) : entry.checked;
  }
  function duplicateNumbers(entry) {
    const group = duplicateGroups.get(groupKey(entry));
    return group ? [...group.members.keys()].filter(number => number !== entry.number).sort((a,b) => Number(a) - Number(b)) : [];
  }
  let restoringNative = false;
  function independentClick(event) {
    if (!currentInstance()) { stop(); return; }
    if (!active() || restoringNative) return;
    const card = event.target instanceof Element ? event.target.closest('.ChannelsFavoriteGrid > .EditThumbnailContainer') : null;
    const entry = card && read(card);
    const group = entry && duplicateGroups.get(groupKey(entry));
    if (!group || group.members.size < 2) return;
    if (group.choices) {
      if (group.choices.has(entry.number)) group.choices.delete(entry.number);
      else group.choices.add(entry.number);
      if ((group.choices.size > 0) === entry.checked) {
        event.preventDefault(); event.stopImmediatePropagation();
      }
      saveChoices(group);
    } else {
      group.pending = {number: entry.number, before: new Map([...group.members].map(([number, member]) => [number, member.card ? read(member.card)?.checked : member.checked])), time: performance.now()};
    }
    schedule();
  }
  let scrollHost, panel, toolbar, support, supportAnchor, total, list, heading, note, parent, categoryNav, categoryEmpty, frame = 0, signature = '', filteredSignature = '';
  let activeCategory = 'all';
  let mode = 'compact', layoutScale = 1;
  function positionZen() {
    const logo = parent?.querySelector('.bft-zen-signature');
    const caption = support?.querySelector('.bft-support-caption');
    const nav = parent?.querySelector('.NavHeader');
    if (!logo || !caption || !nav || !toolbar?.isConnected) return;
    const walker = document.createTreeWalker(nav, NodeFilter.SHOW_TEXT);
    let text;
    while ((text = walker.nextNode()) && !text.textContent.trim()) {}
    if (!text) return;
    const range = document.createRange(); range.selectNodeContents(text);
    const title = range.getBoundingClientRect(), label = caption.getBoundingClientRect();
    const bounds = parent.getBoundingClientRect();
    const bottom = toolbar.getBoundingClientRect().bottom;
    if (logo.parentElement !== parent) parent.append(logo);
    logo.style.left = `${((title.right + label.left) / 2 - bounds.left) / layoutScale}px`;
    logo.style.top = `${(bottom - bounds.top) / (2 * layoutScale)}px`;
  }
  const validationObserver = new ResizeObserver(entries => {
    if (!currentInstance() || !toolbar?.isConnected || !parent?.isConnected) return;
    const box = entries[0]?.borderBoxSize?.[0];
    if (!box) return;
    const width = `${box.inlineSize}px`, height = `${box.blockSize}px`;
    if (toolbar.style.getPropertyValue('--bft-views-width') !== width) toolbar.style.setProperty('--bft-views-width', width);
    if (parent.style.getPropertyValue('--bft-validation-height') !== height) parent.style.setProperty('--bft-validation-height', height);
    positionZen();
  });
  function markCompactRows(grid, columns) {
    const cards = [...grid.querySelectorAll(':scope > .EditThumbnailContainer')];
    const shown = cards.filter(card => !card.hasAttribute('data-bft-category-hidden'));
    const first = shown[0], last = shown.at(-1);
    let visibleIndex = 0;
    for (const card of cards) {
      const visible = !card.hasAttribute('data-bft-category-hidden');
      const start = visible && visibleIndex++ % columns === 0;
      for (const [attribute, enabled] of [['data-bft-row-start', start], ['data-bft-band-first', card === first], ['data-bft-band-last', card === last]]) {
        if (card.hasAttribute(attribute) !== enabled) card.toggleAttribute(attribute, enabled);
      }
    }
    return shown;
  }
  const stripeObserver = new ResizeObserver(entries => {
    if (!currentInstance()) return;
    for (const {target, contentRect} of entries) {
      const contentShift = '25.5px';
      if (parent?.isConnected && parent.style.getPropertyValue('--bft-content-shift') !== contentShift) parent.style.setProperty('--bft-content-shift', contentShift);
      const outerInset = parent?.isConnected ? (parent.getBoundingClientRect().right - target.getBoundingClientRect().right) / layoutScale : 0;
      const inset = `${outerInset}px`;
      if (parent?.isConnected && parent.style.getPropertyValue('--bft-command-inset') !== inset) parent.style.setProperty('--bft-command-inset', inset);
      const compact = target.dataset.bftView === 'compact';
      const listView = target.dataset.bftView === 'list';
      const gap = compact ? 10 : 20;
      const columns = listView ? 1 : Math.max(1, Math.min(compact ? 8 : 4, Math.floor((contentRect.width + gap) / ((compact ? 120 : 220) + gap))));
      const value = String(columns);
      if (target.style.getPropertyValue('--bft-grid-columns') !== value) target.style.setProperty('--bft-grid-columns', value);
      const visibleCards = markCompactRows(target, columns);
      if (!compact && !listView) {
        const card = target.querySelector(':scope > .EditThumbnailContainer:not([data-bft-category-hidden])');
        const icon = card?.querySelector('.ThumbnailImageBackdrop');
        if (icon) {
          const image = icon.getBoundingClientRect(), bounds = card.getBoundingClientRect();
          const center = `${(image.top + image.height / 2 - bounds.top) / layoutScale}px`;
          if (target.style.getPropertyValue('--bft-standard-icon-center') !== center) target.style.setProperty('--bft-standard-icon-center', center);
        }
      }
      if (compact) {
        const card = target.querySelector(':scope > .EditThumbnailContainer:not([data-bft-category-hidden])');
        if (!card) continue;
        const bounds = card.getBoundingClientRect();
        const last = visibleCards.at(-1).getBoundingClientRect();
        const gridStyle = getComputedStyle(target);
        const bandHeight = `${(last.bottom - bounds.top) / layoutScale + parseFloat(gridStyle.paddingTop) + parseFloat(gridStyle.paddingBottom)}px`;
        if (target.style.getPropertyValue('--bft-band-height') !== bandHeight) target.style.setProperty('--bft-band-height', bandHeight);
        let nextCard = card.nextElementSibling;
        while (nextCard?.hasAttribute('data-bft-category-hidden')) nextCard = nextCard.nextElementSibling;
        const next = nextCard?.matches('.EditThumbnailContainer') ? nextCard.getBoundingClientRect() : null;
        const pitchValue = (columns > 1 && next ? next.left - bounds.left : bounds.width + 10 * layoutScale) / layoutScale;
        const pitch = `${pitchValue}px`;
        const left = `${(bounds.left + bounds.width / 2 - target.getBoundingClientRect().left) / layoutScale - pitchValue / 2 - target.clientLeft}px`;
        if (target.style.getPropertyValue('--bft-stripe-pitch') !== pitch) target.style.setProperty('--bft-stripe-pitch', pitch);
        if (target.style.getPropertyValue('--bft-stripe-left') !== left) target.style.setProperty('--bft-stripe-left', left);
        const title = card?.querySelector('.ChannelTitle');
        const walker = title && document.createTreeWalker(title, NodeFilter.SHOW_TEXT);
        let node;
        while (walker && (node = walker.nextNode())) {
          const start = node.textContent.search(/\S/);
          if (start < 0) continue;
          const range = document.createRange();
          range.setStart(node, start); range.setEnd(node, start + 1);
          const text = range.getBoundingClientRect(), bounds = card.getBoundingClientRect();
          const center = `${(text.top + text.height / 2 - bounds.top - bounds.height * .0275) / layoutScale + 3.78}px`;
          if (target.style.getPropertyValue('--bft-frame-gap-center') !== center) target.style.setProperty('--bft-frame-gap-center', center);
          break;
        }
      }

    }
  });
  const make = (tag, cls, text) => {
    const element = document.createElement(tag);
    element.className = cls;
    if (text !== undefined) element.textContent = text;
    return element;
  };
  const active = () => location.pathname.replace(/\/$/, '') === EDIT;
  const owned = node => (node.nodeType === 1 ? node : node.parentElement)?.closest('[data-bft-owned]');
  function cleanup() {
    validationObserver.disconnect();
    stripeObserver.disconnect();
    panel?.remove(); toolbar?.remove(); categoryNav?.remove(); categoryEmpty?.remove();
    support?.remove();
    document.querySelectorAll('.bft-zen-signature').forEach(el => el.remove());
    parent?.classList.remove('bft-parent', 'bft-support-inline');
    parent?.style.removeProperty('--bft-height');
    parent?.style.removeProperty('--bft-scale');
    parent?.style.removeProperty('--bft-validation-height');
    parent?.style.removeProperty('--bft-command-inset');
    parent?.style.removeProperty('--bft-content-shift');
    scrollHost?.classList.remove('bft-scroll-host');
    scrollHost = undefined;
    document.querySelectorAll('.bft-grid').forEach(grid => {
      grid.classList.remove('bft-grid'); grid.removeAttribute('data-bft-view');
      grid.style.removeProperty('--bft-stripe-pitch');
      grid.style.removeProperty('--bft-grid-columns');
      grid.style.removeProperty('--bft-stripe-left');
      grid.style.removeProperty('--bft-frame-gap-center');
      grid.style.removeProperty('--bft-standard-icon-center');
      grid.removeAttribute('data-bft-category-empty');
      grid.removeAttribute('data-bft-no-visible-channels');
      grid.style.removeProperty('--bft-band-height');
      grid.querySelectorAll('.EditThumbnailContainer').forEach(card => {card.removeAttribute('data-bft-category-hidden'); card.removeAttribute('data-bft-row-start'); card.removeAttribute('data-bft-band-first'); card.removeAttribute('data-bft-band-last'); card.style.removeProperty('--bft-list-band');});
      grid.querySelectorAll('[data-bft-selected]').forEach(el => el.removeAttribute('data-bft-selected'));
    });
    panel = toolbar = support = supportAnchor = total = list = heading = note = parent = categoryNav = categoryEmpty = undefined;
    signature = ''; filteredSignature = ''; cache.clear(); duplicateGroups.clear();
    document.querySelectorAll('.bft-choice-indicator').forEach(icon => icon.remove());
    document.querySelectorAll('[data-bft-independent]').forEach(card => card.removeAttribute('data-bft-independent'));
  }
  function removeDuplicates() {
    document.querySelectorAll('[data-bft-owned].bft-panel, [data-bft-owned].bft-toolbar, [data-bft-owned].bft-support, [data-bft-owned].bft-categories').forEach(element => {
      if (element !== panel && element !== toolbar && element !== support && element !== categoryNav) element.remove();
    });
  }
  function stop() {
    validationObserver.disconnect();
    stripeObserver.disconnect();
    observer.disconnect();
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    window.removeEventListener('popstate', schedule);
    window.removeEventListener('resize', resizeLayout);
    document.removeEventListener('click', independentClick, true);
    panel?.remove(); toolbar?.remove(); categoryNav?.remove(); categoryEmpty?.remove();
    support?.remove();
    cache.clear();
  }
  function mountSupport() {
    const validate = document.querySelector('.ChannelsFavoriteNavRight > button');
    if (!validate || !toolbar?.isConnected || (support?.isConnected && support.parentElement === validate.parentElement && supportAnchor === validate)) return;
    support?.remove();
    supportAnchor = validate;
    validationObserver.disconnect();
    validationObserver.observe(validate);
    support = make('div', 'bft-support');
    support.dataset.bftOwned = '';
    support.append(make('div', 'Typography body2 bft-support-caption', 'Vous aimez cet addon ?'));
    const link = make('a', 'bft-kofi-button');
    link.href = 'https://ko-fi.com/T0J72545CL';
    link.target = '_blank'; link.rel = 'noopener noreferrer';
    const icon = make('img', 'bft-kofi-cup');
    icon.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAR0AAADlCAMAAABZAtOJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAD8UExURQAAAP/////////////////////////////////////////////////////////////////////////////////////////18f/18PHx8f/r4v/q4v/h1P/g0//f0+Pj4//Wxf/Vxf/Mtv/Lt//LttXV1f/CqP/BqP/Bp//Ap/+3mv+3mf+3mP+2mcfHx/+ti/+tiv+si/+siv+jfP+ifLm5uf+Ybv+Ybf+Xbaurq/+OX/+OXv+NX/+DUf+DUJ2dnf95Qv95Qf9vM/9uM5CQkI+Pj/9lJP9kJf9aFoKCgoGBgXR0dHNzc2ZmZmVlZVhYWEpKSjw8PC4uLiAgILWDVz0AAAAWdFJOUwAQIDBAUF9gb3B/gI+Qn6CvsL/P3++NaW4cAAAN50lEQVR42uzYwa6jIBSAYaV2HNvGGAonccXKLTsXrNxcF8QYBN7/Xcb23kzuZKjSWm/V9HuEP+cIEswrRL2ot48/Hf+T/uPoFH+JLnYIoTBYH7SL4jg5ntIUY0IIhVkRcsY463smfTW02CT7+JhmZ0LhtcglVR8qXEaWfZJmhMLi0HN22kfBy4RRklFYuHOWvCARSjCFtcDHnywUHQisDM1i9CMLdcCwTnj2QFFGYcVwPGcbDGtHU/RuMwTH7zZDyJP7IAy9dx+nAwWAdx+niMAWERQ8wQm2KkXvL86M67WncPEeH5cDTJYzxgreE1dV/ZdsRsn6O3FV8gvGWP7a8QlTuBtjXIi6bppWdVobOy+jtVJtH7EqecHgIafwsThn/yZcVLJR2tiXMp1qZR+KzX94IQIeCiFbbRena+uyAE90P0cc/qGMXTCjag5eDs+Ow6Wxa6Aq5pPnmXHyD2PXo5MFjEkDf+FgHK7s2nSCwTAcBr7wqtu4NRwGnX3znNbexk2JkTwTb8i5tKumxeRvzw5u4dquneZw22nCcZVLuwUNm3Kwp+DGtN2ID7jpVzDsN7iVxm6GZnAD3QVDEAWn2m5KBTeQ8IG9qu3GNDm4ZcFt8Vic7W9Xcu8fRG03SBfgRNF998DabpMAJxy4IXCp7GRG99RV23xXu7ifndUXfTFrnuSOT3LxQIvPt15RXl/HYR759TW/FFXf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';
    icon.width = 22; icon.height = 15; icon.alt = '';
    link.append(icon, make('span', 'Typography body2', 'Support me on Ko-fi'));
    support.append(link);
    validate.parentElement.prepend(support);
    const nav = validate.closest('.ChannelsFavoriteNav')?.querySelector('.NavHeader');
    if (nav && !parent?.querySelector('.bft-zen-signature')) {
      const logo = make('span', 'bft-zen-signature');
      logo.dataset.bftOwned = '';
      logo.setAttribute('role', 'img'); logo.setAttribute('aria-label', 'Zen');
      nav.append(logo);
    }
    positionZen();

  }
  function resizeLayout() {
    if (!currentInstance()) { stop(); return; }
    if (!parent?.isConnected || !scrollHost?.isConnected) return;
    layoutScale = Math.min(1, Math.max(1, scrollHost.clientWidth - 32) / 1862);
    parent.style.setProperty('--bft-scale', String(layoutScale));
    const hostStyle = getComputedStyle(scrollHost);
    const parentStyle = getComputedStyle(parent);
    const top = scrollHost.getBoundingClientRect().top + scrollHost.clientTop + (parseFloat(hostStyle.paddingTop) || 0) + (parseFloat(parentStyle.marginTop) || 0);
    const bottom = (parseFloat(parentStyle.marginBottom) || 0) + (parseFloat(hostStyle.paddingBottom) || 0);
    parent.style.setProperty('--bft-height', `${Math.max(0, innerHeight - top - bottom) / layoutScale}px`);
    positionZen();
  }
  function mount(grid) {
    if (panel?.isConnected && parent === grid.parentElement) return;
    cleanup();
    parent = grid.parentElement;
    parent.classList.add('bft-parent');
    panel = make('aside', 'bft-panel');
    panel.dataset.bftOwned = '';
    panel.setAttribute('aria-label', 'Chaînes sélectionnées');
    heading = make('div', 'Typography body1');
    note = make('div', 'Typography body2 bft-note', 'Votre sélection sera enregistrée avec « Valider la sélection ».');
    list = make('div', 'bft-list');
    panel.append(heading, note, list);
    toolbar = make('div', 'bft-toolbar');
    toolbar.dataset.bftOwned = '';
    toolbar.setAttribute('role', 'group');
    toolbar.setAttribute('aria-label', 'Affichage des chaînes');
    total = make('span', 'Typography body2 bft-total');
    total.title = 'Nombre de chaînes dans les résultats affichés';
    const viewButtons = make('div', 'bft-views');
    toolbar.append(total, viewButtons);
    const views = [['standard', '▦', 'Vue standard : 4 chaînes par ligne'], ['compact', '▦▦', 'Vue compacte : 8 chaînes par ligne'], ['list', '☰', 'Vue liste : une chaîne par ligne']];
    for (const [value, icon, label] of views) {
      const button = make('button', 'Button bft-view', icon);
      button.type = 'button'; button.title = label;
      button.setAttribute('aria-label', label);
      button.dataset.view = value;
      button.addEventListener('click', () => { mode = value; schedule(); });
      viewButtons.append(button);
    }
    categoryNav = make('nav', 'bft-categories');
    categoryNav.dataset.bftOwned = '';
    categoryNav.setAttribute('aria-label', 'Filtrer les chaînes par catégorie');
    for (const {id, label} of categoryApi.categories) {
      const button = make('button', 'Button bft-category', label);
      button.type = 'button'; button.dataset.category = id;
      button.setAttribute('aria-pressed', String(id === activeCategory));
      button.addEventListener('click', () => {
        activeCategory = categoryApi.toggle(activeCategory, id);
        const currentGrid = parent?.querySelector('.ChannelsFavoriteGrid');
        if (currentGrid) currentGrid.scrollTop = 0;
        schedule();
      });
      categoryNav.append(button);
    }
    grid.before(panel, toolbar, categoryNav);
    scrollHost = parent.closest('.MainDiv');
    if (scrollHost) {
      scrollHost.classList.add('bft-scroll-host');
      scrollHost.scrollTop = 0;
      resizeLayout();
    }
  }
  function setView(grid) {
    const changed = grid.dataset.bftView !== mode;
    grid.classList.add('bft-grid');
    grid.dataset.bftView = mode;
    if (changed) { stripeObserver.disconnect(); stripeObserver.observe(grid); }
    toolbar.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === mode)));
  }
  function read(card) {
    const number = card.querySelector('.ChannelNumber')?.firstChild?.textContent.trim();
    const name = card.querySelector('.ChannelTitle')?.textContent.trim();
    if (!number || !name) return null;
    const paths = [...card.querySelectorAll('.EditThumbnailIcon path[d]')];
    // These are the site's actual checked/unchecked SVGs, verified in the supplied snapshot.
    const checked = paths.some(path => path.getAttribute('d')?.startsWith(selectedPath));
    const known = checked || paths.some(path => path.getAttribute('d')?.startsWith('M14.5 26c-6.6'));
    if (!known) return null; // Fail closed if Free changes its selection indicator.
    return { key: number, number, name, checked, card,
      src: card.querySelector('img.ThumbnailImageBackdrop')?.src || '' };
  }
  function updateCategoryButtons(counts) {
    categoryNav?.querySelectorAll('button').forEach(button => {
      const id = button.dataset.category;
      button.setAttribute('aria-pressed', String(id === activeCategory));
      button.title = `${button.textContent} : ${counts[id] || 0} chaîne${counts[id] === 1 ? '' : 's'} dans les résultats chargés`;
    });
  }
  function filterCategory(grid, cards) {
    const catalog = [...cards].map(card => ({card,
      number: card.querySelector('.ChannelNumber')?.firstChild?.textContent.trim() || '',
      name: card.querySelector('.ChannelTitle')?.textContent.trim() || ''
    }));
    const {visible, counts} = categoryApi.select(catalog, activeCategory);
    const shown = new Set(visible.map(entry => entry.card));
    const next = activeCategory + ':' + visible.map(entry => entry.number).join(',');
    let changed = filteredSignature !== next;
    for (const card of cards) {
      const hidden = !shown.has(card);
      if (card.hasAttribute('data-bft-category-hidden') !== hidden) {
        card.toggleAttribute('data-bft-category-hidden', hidden);
        changed = true;
      }
    }
    visible.forEach((entry, index) => {
      const color = index % 2 ? '#252525' : '#1b1b1b';
      if (entry.card.style.getPropertyValue('--bft-list-band') !== color) entry.card.style.setProperty('--bft-list-band', color);
    });
    const empty = activeCategory !== 'all' && visible.length === 0;
    grid.toggleAttribute('data-bft-category-empty', empty);
    grid.toggleAttribute('data-bft-no-visible-channels', visible.length === 0);
    if (empty && (!categoryEmpty?.isConnected || categoryEmpty.parentElement !== grid)) {
      categoryEmpty?.remove();
      categoryEmpty = make('p', 'Typography body2 bft-category-empty', 'Aucune chaîne de cette catégorie dans les résultats chargés.');
      categoryEmpty.dataset.bftOwned = '';
      grid.append(categoryEmpty);
    } else if (!empty) { categoryEmpty?.remove(); categoryEmpty = undefined; }
    filteredSignature = next;
    updateCategoryButtons(counts);
    const totalLabel = `${visible.length} chaîne${visible.length > 1 ? 's' : ''}`;
    if (total.textContent !== totalLabel) total.textContent = totalLabel;
    if (changed) { stripeObserver.disconnect(); stripeObserver.observe(grid); }
  }
  function update() {
    frame = 0;
    if (!currentInstance()) { stop(); return; }
    removeDuplicates();
    if (!active()) { if (panel) cleanup(); return; }
    const grid = document.querySelector('.ChannelsFavoriteGrid');
    if (!grid) {
      mountSupport();
      if (total) total.textContent = '0 chaîne';
      updateCategoryButtons({});
      if (!document.querySelector('.ChannelsFavoriteContainer') && panel) cleanup();
      return;
    }
    mount(grid); mountSupport(); setView(grid);
    for (const entry of cache.values()) entry.card = null;
    let unknown = false;
    const cards = grid.querySelectorAll(':scope > .EditThumbnailContainer');
    prepareIndependent(cards);
    filterCategory(grid, cards);
    for (const card of cards) {
      const entry = read(card);
      if (!entry) { unknown = true; card.removeAttribute('data-bft-selected'); continue; }
      entry.checked = selected(entry);
      card.dataset.bftSelected = String(entry.checked);
      if (entry.checked) cache.set(entry.key, entry); else cache.delete(entry.key);
    }
    const entries = [...cache.values()].sort((a,b) => Number(a.number) - Number(b.number));
    const next = JSON.stringify([unknown, entries.map(entry => [entry.number,entry.name,entry.src,!!entry.card?.isConnected,duplicateNumbers(entry)])]);
    if (next === signature) return;
    signature = next;
    heading.textContent = `Mes chaînes sélectionnées (${entries.length})`;
    const fragment = document.createDocumentFragment();
    if (unknown) fragment.append(make('p', 'Typography body2', 'Indicateur Free non reconnu : vérifiez votre sélection sur les vignettes.'));
    if (!entries.length) fragment.append(make('p', 'Typography body2', 'Aucune chaîne sélectionnée dans les résultats chargés.'));
    for (const entry of entries) {
      const button = make('button', 'Button bft-row');
      button.type = 'button';
      button.dataset.number = entry.number;
      const available = !!entry.card?.isConnected;
      button.disabled = !available;
      button.title = available ? `Retirer ${entry.name}` : 'Effacez la recherche du site pour retirer cette chaîne.';
      const others = duplicateNumbers(entry);
      if (others.length) {
        button.classList.add('bft-row-duplicate');
        button.title += `\nDoublon : ${others.length > 1 ? 'chaînes' : 'chaîne'} ${others.join(', ')}`;
      }
      button.setAttribute('aria-label', button.title);
      button.append(make('span', 'Typography body2 bft-favorite-number', entry.number));
      if (entry.src) {
        const img = make('img', 'bft-logo'); img.src = entry.src; img.alt = ''; img.loading = 'lazy';
        button.append(img);
      }
      button.append(make('span', 'Typography body2 bft-name', entry.name), make('span', 'bft-remove', '×'));
      button.addEventListener('click', () => {
        const current = cache.get(entry.key);
        if (current?.card?.isConnected && selected(read(current.card) || {checked: false})) current.card.click();
      });
      fragment.append(button);
    }
    list.replaceChildren(fragment);
  }
  function schedule() { if (!currentInstance()) { stop(); return; } if (!frame) frame = requestAnimationFrame(update); }
  const observer = new MutationObserver(records => {
    if (!currentInstance()) { stop(); return; }
    if (records.some(record => !owned(record.target) && (record.type !== 'attributes' || record.oldValue !== record.target.getAttribute(record.attributeName)))) schedule();
  });
  observer.observe(document.body, { subtree: true, childList: true, characterData: true,
    attributes: true, attributeOldValue: true, attributeFilter: ['class', 'd', 'src'] });
  document.addEventListener('click', independentClick, true);
  window.addEventListener('resize', resizeLayout);
  window.addEventListener('popstate', schedule);
  schedule();
})();
