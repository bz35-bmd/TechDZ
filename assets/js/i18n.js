/* TechDZ — Module i18n partagé
   Charge la langue (?lang= ou localStorage), applique les attributs
   data-i18n / data-i18n-placeholder / data-i18n-title / data-i18n-aria
   et expose window.t() pour les traductions dynamiques. */
(function () {
  'use strict';

  function detectLang() {
    const params = new URLSearchParams(window.location.search);
    const lang = params.get('lang') || localStorage.getItem('techdz-lang') || 'fr';
    localStorage.setItem('techdz-lang', lang);
    return lang;
  }

  const LANG = detectLang();
  window.__lang = LANG;
  document.documentElement.setAttribute('lang', LANG);
  if (LANG === 'ar') document.documentElement.setAttribute('dir', 'rtl');
  else document.documentElement.removeAttribute('dir');

  const dicts = () => {
    const tr = window.translations;
    return (tr && tr[LANG]) || (tr && tr.fr) || {};
  };

  window.t = function (key, fb) {
    const v = dicts()[key];
    return (v !== undefined && v !== null && v !== '') ? v : (fb !== undefined ? fb : key);
  };

  function apply(root) {
    const scope = root || document;
    const walk = (attr, set) => scope.querySelectorAll('[' + attr + ']').forEach(el => {
      const k = el.getAttribute(attr);
      const v = window.t(k);
      if (v !== k) set(el, v);
    });
    walk('data-i18n', (el, v) => el.textContent = v);
    walk('data-i18n-placeholder', (el, v) => el.placeholder = v);
    walk('data-i18n-title', (el, v) => el.title = v);
    walk('data-i18n-aria', (el, v) => el.setAttribute('aria-label', v));
  }
  window.applyI18n = apply;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => apply(document));
  } else {
    apply(document);
  }
})();