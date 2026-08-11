/* TechDZ — Sélecteur de thème (fond animé + logo)
   Identité unifiée : le réseau de nœuds est présent dans TOUS les thèmes.
   Chaque thème = un « ciel » d'ambiance + le même réseau de nœuds par-dessus.
   Thèmes :
     - code   : éditeur (encre) + réseau        + logo accolades </>
     - signal : réseau pur (défaut)             + logo nœud-émetteur
     - fusion : encre + réseau                  + logo nœud-émetteur
     - dunes  : dunes du Sahara + réseau or     + logo nœud or
     - nuit   : ciel étoilé + réseau indigo     + logo nœud indigo
   Choix mémorisé dans localStorage ("techdz-theme") */
(function () {
  'use strict';

  var script = document.currentScript || document.querySelector('script[src*="themes.js"]');
  var BASE = (script && script.getAttribute('data-base')) || '';
  var KEY = 'techdz-theme';
  var DEFAULT = 'signal';
  var NETWORK = 'network-background.js';

  var THEMES = {
    code:   { bgs: ['liquid-ink-background.js', NETWORK], logo: 'logo-code.svg' },
    signal: { bgs: [NETWORK],                            logo: 'logo.svg' },
    fusion: { bgs: ['liquid-ink-background.js', NETWORK], logo: 'logo.svg' },
    dunes:  { bgs: ['dunes-background.js', NETWORK],      logo: 'logo-dunes.svg' },
    nuit:   { bgs: ['nuit-background.js', NETWORK],       logo: 'logo-nuit.svg' }
  };

  var ENGINES = {
    'liquid-ink-background.js': {
      key: '__liquidInk',
      layer: '[data-ink-version]',
      show: function () {
        var el = document.querySelector('[data-ink-version]');
        if (el && el.parentNode) el.parentNode.style.display = '';
      }
    },
    'network-background.js': {
      key: '__netBg',
      layer: '.network-bg',
      show: function () {
        var c = document.querySelector('.network-bg');
        if (c) c.style.display = '';
      }
    },
    'dunes-background.js': {
      key: '__dunesBg',
      layer: '.dunes-bg',
      show: function () {
        var c = document.querySelector('.dunes-bg');
        if (c) c.style.display = '';
      }
    },
    'nuit-background.js': {
      key: '__nuitBg',
      layer: '.nuit-bg',
      show: function () {
        var c = document.querySelector('.nuit-bg');
        if (c) c.style.display = '';
      }
    }
  };

  var current = null;

  function hideBg() {
    for (var name in ENGINES) {
      var e = window[ENGINES[name].key];
      if (e && typeof e.stop === 'function') {
        try { e.stop(); } catch (err) {}
      }
    }
    var layers = document.querySelectorAll('.network-bg, .dunes-bg, .nuit-bg, [data-ink-version]');
    for (var i = 0; i < layers.length; i++) {
      var el = layers[i];
      if (el.hasAttribute('data-ink-version')) {
        if (el.parentNode) el.parentNode.style.display = 'none';
      } else {
        el.style.display = 'none';
      }
    }
  }

  function loadScript(file) {
    var s = document.createElement('script');
    s.src = BASE + 'assets/' + file;
    s.setAttribute('data-theme-bg', '1');
    (document.body || document.documentElement).appendChild(s);
  }

  function showBg(file) {
    var eng = ENGINES[file];
    if (!eng) return;
    if (window[eng.key]) {
      try { eng.show(); } catch (e) {}
      try { window[eng.key].start(); } catch (e) {}
      return;
    }
    loadScript(file);
  }

  function applyLogos(file) {
    var logoRe = /logo(-code|-dunes|-nuit)?\.svg$/;
    var imgs = document.querySelectorAll('img');
    for (var i = 0; i < imgs.length; i++) {
      if (logoRe.test(imgs[i].getAttribute('src') || '')) {
        imgs[i].src = BASE + file;
      }
    }
    var links = document.querySelectorAll('link[rel~="icon"]');
    for (var j = 0; j < links.length; j++) {
      if (logoRe.test(links[j].getAttribute('href') || '')) {
        links[j].href = BASE + file;
      }
    }
  }

  function updateUI(name) {
    var opts = document.querySelectorAll('[data-theme-option]');
    for (var i = 0; i < opts.length; i++) {
      var isActive = opts[i].getAttribute('data-theme-option') === name;
      opts[i].classList.toggle('active', isActive);
      opts[i].setAttribute('aria-checked', isActive ? 'true' : 'false');
    }
  }

  function applyTheme(name, persist) {
    if (!THEMES[name]) name = DEFAULT;
    if (persist) {
      try { localStorage.setItem(KEY, name); } catch (e) {}
    }
    if (name === current) {
      updateUI(name);
      return;
    }
    current = name;
    hideBg();
    applyLogos(THEMES[name].logo);
    var bgs = THEMES[name].bgs;
    for (var i = 0; i < bgs.length; i++) {
      showBg(bgs[i]);
    }
    document.documentElement.setAttribute('data-bg-theme', name);
    updateUI(name);
  }

  function initPicker() {
    var btn = document.getElementById('themePickerBtn');
    if (!btn) return;
    var menu = document.getElementById('themePickerMenu');
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = menu.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    var opts = menu.querySelectorAll('[data-theme-option]');
    for (var i = 0; i < opts.length; i++) {
      opts[i].addEventListener('click', function () {
        applyTheme(this.getAttribute('data-theme-option'), true);
        menu.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      });
    }
    document.addEventListener('click', function () {
      menu.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        menu.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function init() {
    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) {}
    if (saved === 'sahara') saved = 'dunes';
    else if (saved === 'cosmos') saved = 'nuit';
    applyTheme(saved || DEFAULT, false);
    initPicker();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
