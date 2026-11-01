(() => {
  'use strict';
  const categories = Object.freeze([
    ['all', 'Toutes'], ['general', 'Généralistes / TNT'], ['cinema', 'Cinéma / Séries'],
    ['sport', 'Sport'], ['youth', 'Jeunesse'], ['entertainment', 'Divertissement / Découverte'],
    ['news', 'Information'], ['music', 'Musique'], ['local', 'Locales / Régionales'],
    ['international', 'Internationales']
  ].map(([id, label]) => Object.freeze({id, label})));
  const ids = new Set(categories.map(category => category.id));
  const nameKey = name => String(name || '').normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  // Official plan effective 25 August 2026; never a list of one subscriber's channels.
  // https://portail.free.fr/media/001_Dossier_integral_549879dbda.pdf
  function thematicCategory(number) {
    if (number >= 1981 && number <= 1999) return 'general';
    if (number >= 1000) return 'international';
    if (number >= 900) return 'local';
    if (number >= 800) return null; // No extra button: these remain accessible in Toutes.
    if (number >= 700) return 'music';
    if (number >= 600) return 'news';
    if (number >= 400) return 'entertainment';
    if (number >= 300) return 'youth';
    if (number >= 200) return 'sport';
    if (number >= 100) return 'cinema';
    return null;
  }
  function createClassifier(entries) {
    const knownNames = new Map();
    for (const entry of entries) {
      const number = Number(entry.number), key = nameKey(entry.name);
      if (!key || number < 100 || number >= 800) continue;
      const category = thematicCategory(number);
      if (!knownNames.has(key)) knownNames.set(key, category);
      else if (knownNames.get(key) !== category) knownNames.set(key, null);
    }
    return (number, name) => {
      const n = Number(number);
      if (!Number.isInteger(n) || n < 1) return null;
      if (n >= 100) return thematicCategory(n);
      // TNT also appears in the generalist filter, even when it has another main theme.
      if (n === 12) return 'youth';
      if (n >= 13 && n <= 16) return 'news';
      if (n === 20) return 'cinema';
      if (n === 21) return 'sport';
      if (n === 24 || n === 25) return 'entertainment';
      if (n <= 29) return 'general';
      if (n === 30) return 'local';
      const learned = knownNames.get(nameKey(name));
      if (learned) return learned;
      if ((n >= 35 && n <= 39) || (n >= 42 && n <= 44)) return 'sport';
      if ([32, 33, 34, 45, 46, 48, 52, 54].includes(n)) return 'cinema';
      if (n >= 49 && n <= 51) return 'youth';
      if ([53, 55, 56].includes(n)) return 'entertainment';
      if ([40, 41, 62].includes(n)) return 'general';
      return null;
    };
  }
  function select(entries, category = 'all') {
    const active = ids.has(category) ? category : 'all';
    const classify = createClassifier(entries);
    const counts = Object.fromEntries(categories.map(item => [item.id, 0]));
    const visible = [];
    for (const entry of entries) {
      counts.all++;
      const primary = classify(entry.number, entry.name);
      const general = Number(entry.number) >= 1 && Number(entry.number) <= 29;
      if (primary) counts[primary]++;
      if (general && primary !== 'general') counts.general++;
      if (active === 'all' || primary === active || (active === 'general' && general)) visible.push(entry);
    }
    return {visible, counts};
  }
  function toggle(current, clicked) {
    return ids.has(clicked) ? (clicked === current ? 'all' : clicked) : current;
  }
  globalThis.__bftChannelCategories = Object.freeze({categories, createClassifier, select, toggle});
})();
