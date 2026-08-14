/* ============================================
   TechDZ — Script
   ============================================ */

// ==========================================
// Language — apply immediately on script load
// ==========================================
(function initLang() {
  const urlParams = new URLSearchParams(window.location.search);
  const lang = urlParams.get('lang') || localStorage.getItem('techdz-lang');
  if (!lang) return;
  localStorage.setItem('techdz-lang', lang);
  const tr = window.translations;
  if (!tr) return;
  const langData = tr[lang];
  if (!langData) return;
  const html = document.documentElement;
  html.setAttribute('lang', lang);
  if (lang === 'ar') html.setAttribute('dir', 'rtl');
  else html.removeAttribute('dir');
  const i18nEls = document.querySelectorAll('[data-i18n]');
  i18nEls.forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (langData[key]) el.textContent = langData[key];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (langData[key]) el.placeholder = langData[key];
  });
})();

function t(key, fallback) {
  const tr = window.translations;
  if (!tr) return fallback !== undefined ? fallback : key;
  const lang = localStorage.getItem('techdz-lang') || 'fr';
  const data = tr[lang] || tr.fr || {};
  const v = data[key];
  return (v !== undefined && v !== null && v !== '') ? v : (fallback !== undefined ? fallback : key);
}

function getTranslationUrl(url, lang) {
  const sep = url.includes('?') ? '&' : '?';
  return url + sep + 'lang=' + lang;
}

function updateLinksWithLang() {
  const lang = localStorage.getItem('techdz-lang');
  if (!lang) return;
  document.querySelectorAll('a[href]').forEach(a => {
    const href = a.getAttribute('href');
    if (!href) return;
    if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return;
    let url;
    try { url = new URL(a.href); } catch (e) { return; }
    if (url.protocol !== 'http:' && url.protocol !== 'https:' && url.protocol !== 'file:') return;
    if (url.hostname !== window.location.hostname) return;
    url.searchParams.set('lang', lang);
    a.href = url.toString();
  });
}
updateLinksWithLang();

/* ============================================
   Online module — badge navbar, widget "en ligne",
   polling 30s, toasts temps réel (Supabase Realtime)
   ============================================ */
const Online = {
  count: 0,
  users: [],
  userSet: new Set(),
  timer: null,
  myId: null,
  channel: null,
  started: false,
  toastTimer: {},

  start(myId) {
    if (this.started) return;
    this.started = true;
    this.myId = myId || null;
    this.injectBadge();
    this.injectToastContainer();
    this.refresh();
    this.timer = setInterval(() => this.refresh(), 30000);
    this.subscribeRealtime();
  },

  stop() {
    this.started = false;
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    if (this.channel && window.Auth) {
      try { Auth.getClient().removeChannel(this.channel); } catch (e) {}
      this.channel = null;
    }
  },

  async refresh() {
    try {
      const { count } = await DB.getOnlineCount();
      if (count !== undefined) {
        this.count = count;
        this.updateBadge();
      }
    } catch (e) {}
    try {
      const { data } = await DB.getOnlineUsers(20);
      if (data) {
        this.users = data;
        this.userSet = new Set(data.map(u => u.id));
        this.renderWidgets();
        document.dispatchEvent(new CustomEvent('online-updated'));
      }
    } catch (e) {}
  },

  notifyUpdate() {
    document.dispatchEvent(new CustomEvent('online-updated'));
  },

  // ==========================================
  // Badge navbar : ● 12
  // ==========================================
  injectBadge() {
    if (document.getElementById('onlineNavBadge')) return;
    const navActions = document.querySelector('.navbar .nav-actions');
    if (!navActions) return;
    const lang = localStorage.getItem('techdz-lang') || 'fr';
    const badge = document.createElement('a');
    badge.className = 'online-badge';
    badge.href = 'networking.html' + (lang ? '?lang=' + lang : '');
    badge.title = t('online.title', 'Communauté en ligne');
    badge.innerHTML = '<span class="online-badge-dot"></span><span class="online-badge-count" id="onlineNavBadge">0</span>';
    navActions.insertBefore(badge, navActions.firstChild);
  },

  updateBadge() {
    const el = document.getElementById('onlineNavBadge');
    if (el) el.textContent = this.count;
  },

  // ==========================================
  // Widgets : index.html (Communauté en ligne) + networking.html (En ligne maintenant)
  // ==========================================
  renderWidgets() {
    const homeCount = document.getElementById('onlineCount');
    if (homeCount) {
      homeCount.textContent = this.count;
      const homeLabel = document.getElementById('onlineCountLabel');
      if (homeLabel) homeLabel.textContent = this.count > 1 ? t('online.members', 'membres en ligne') : t('online.member', 'membre en ligne');
      const homeEmpty = document.getElementById('onlineEmpty');
      if (homeEmpty) homeEmpty.style.display = this.users.length ? 'none' : 'flex';
      const homeGrid = document.getElementById('onlineAvatars');
      if (homeGrid) homeGrid.innerHTML = this.users.slice(0, 8).map((u, i) => this.userPill(u, i)).join('');
      const extra = document.getElementById('onlineExtra');
      if (extra) extra.innerHTML = this.users.length > 8 ? `+${this.users.length - 8} ${t('online.others', 'autres')}` : '';
    }

    const nowSection = document.getElementById('onlineNowSection');
    if (nowSection) {
      nowSection.style.display = 'block';
      const nowCount = document.getElementById('onlineNowCount');
      if (nowCount) nowCount.textContent = this.count;
      const nowList = document.getElementById('onlineNowList');
      if (nowList) {
        nowList.innerHTML = this.users.length === 0
          ? `<div class="online-now-empty"><i class="fas fa-users online-now-empty-icon"></i> ${t('online.first', 'Soyez le premier à vous connecter !')}</div>`
          : this.users.map((u, i) => this.nowItem(u, i)).join('');
      }
    }
  },

  // ---------- Helpers de rendu : échappement + avatars (photo ou initiales) ----------
  escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  },

  initials(name) {
    return (name || 'U').split(/\s+/).filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase();
  },

  avatar(u) {
    const name = this.escapeHtml(u.full_name || '');
    if (u.avatar_url) {
      return `<div class="online-avatar online-avatar-img" role="img" aria-label="${name}" style="background-image:url('${this.escapeHtml(u.avatar_url)}')"></div>`;
    }
    return `<div class="online-avatar">${this.initials(u.full_name)}</div>`;
  },

  userPill(u, index) {
    const lang = localStorage.getItem('techdz-lang') || '';
    const href = 'networking.html' + (lang ? '?lang=' + lang : '');
    const name = this.escapeHtml(u.full_name || '');
    const city = u.city ? `<span class="online-user-city"><i class="fas fa-map-marker-alt"></i>${this.escapeHtml(u.city)}</span>` : '';
    return `<a class="online-user" href="${href}" title="${name}${u.city ? ' — ' + this.escapeHtml(u.city) : ''}" style="animation-delay:${Math.min(index * 45, 400)}ms">${this.avatar(u)}<span class="online-user-name">${name}</span>${city}</a>`;
  },

  nowItem(u, index) {
    const name = this.escapeHtml(u.full_name || '');
    const role = u.role === 'admin' ? t('common.admin', 'Admin') : u.role === 'moderator' ? t('common.moderator', 'Modérateur') : t('common.member', 'Membre');
    return `<div class="online-now-item" style="animation-delay:${Math.min(index * 40, 400)}ms">${this.avatar(u)}
      <div class="online-now-info">
        <strong>${name}</strong>
        <span>${this.escapeHtml(u.job_title || '')}${u.city ? ' • ' + this.escapeHtml(u.city) : ''}</span>
      </div>
      <span class="member-role-tag ${u.role || 'member'}">${this.escapeHtml(role)}</span>
    </div>`;
  },

  // ==========================================
  // Toasts temps réel (connexion d'un membre)
  // ==========================================
  injectToastContainer() {
    if (document.getElementById('toastContainer')) return;
    const c = document.createElement('div');
    c.id = 'toastContainer';
    c.className = 'toast-container';
    document.body.appendChild(c);
  },

  toast(message) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    if (container.children.length >= 3) {
      const first = container.firstChild;
      if (first && first._timer) clearTimeout(first._timer);
      first.remove();
    }
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `
      <div class="toast-icon"><i class="fas fa-circle"></i></div>
      <div class="toast-msg">${message}</div>
      <button class="toast-close" aria-label="Fermer"><i class="fas fa-times"></i></button>`;
    el.querySelector('.toast-close').addEventListener('click', () => {
      clearTimeout(el._timer);
      el.remove();
    });
    container.appendChild(el);
    el._timer = setTimeout(() => el.remove(), 3000);
  },

  // ==========================================
  // Supabase Realtime : détecter les nouvelles connexions
  // ==========================================
  subscribeRealtime() {
    if (!window.Auth) return;
    const self = this;
    try {
      const client = Auth.getClient();
      this.channel = client.channel('online-presence')
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles'
        }, payload => {
          const rec = payload.new || {};
          if (!rec.last_active || !rec.full_name) return;
          if (rec.role === 'admin' || rec.role === 'moderator') return;
          if (self.myId && rec.id === self.myId) return;
          const fresh = (Date.now() - new Date(rec.last_active).getTime()) < 5 * 60 * 1000;
          if (!fresh) return;
          if (self.userSet.has(rec.id)) return;
          self.userSet.add(rec.id);
          self.notifyUpdate();
          self.toast(t('online.justConnected', '{name} vient de se connecter').replace('{name}', rec.full_name));
        })
        .subscribe();
    } catch (e) {
      console.warn('Realtime indisponible:', e.message);
    }
  }
};
window.Online = Online;

function setLanguage(lang) {
  const html = document.documentElement;
  const tr = window.translations;
  if (!tr) return;
  const langData = tr[lang];
  if (!langData) return;
  html.setAttribute('lang', lang);
  if (lang === 'ar') html.setAttribute('dir', 'rtl');
  else html.removeAttribute('dir');
  localStorage.setItem('techdz-lang', lang);
  const i18nEls = document.querySelectorAll('[data-i18n]');
  i18nEls.forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (langData[key]) el.textContent = langData[key];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (langData[key]) el.placeholder = langData[key];
  });
  // Sync URL with lang param
  const url = new URL(window.location);
  url.searchParams.set('lang', lang);
  history.replaceState(null, '', url.toString());
  // Update all internal links
  updateLinksWithLang();
}

document.addEventListener('DOMContentLoaded', () => {
  const html = document.documentElement;

  // ==========================================
  // Preloader
  // ==========================================
  const preloader = document.getElementById('preloader');
  if (preloader) {
    window.addEventListener('load', () => {
      setTimeout(() => preloader.classList.add('hidden'), 800);
    });
    setTimeout(() => preloader.classList.add('hidden'), 3000);
  }

  // ==========================================
  // Theme Toggle
  // ==========================================
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    const themeIcon = themeToggle.querySelector('i');
    const savedTheme = localStorage.getItem('techdz-theme') || 'light';
    html.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    themeToggle.addEventListener('click', () => {
      const current = html.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
      localStorage.setItem('techdz-theme', next);
      updateThemeIcon(next);
    });

    function updateThemeIcon(theme) {
      themeIcon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    }
  }

  // ==========================================
  // Language Switcher UI
  // ==========================================
  const savedLang = localStorage.getItem('techdz-lang');
  if (savedLang) {
    const url = new URL(window.location);
    url.searchParams.set('lang', savedLang);
    history.replaceState(null, '', url.toString());
  }
  const langSwitcher = document.getElementById('langSwitcher');
  const langBtn = document.getElementById('langBtn');
  if (langSwitcher && langBtn) {
    const langOptions = document.querySelectorAll('.lang-option');
    if (savedLang) {
      langOptions.forEach(opt => opt.classList.toggle('active', opt.getAttribute('data-lang') === savedLang));
      langBtn.querySelector('.lang-flag').textContent = savedLang.toUpperCase();
    }

    langBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      langSwitcher.classList.toggle('open');
    });

    langOptions.forEach(option => {
      option.addEventListener('click', () => {
        const lang = option.getAttribute('data-lang');
        setLanguage(lang);
        langOptions.forEach(opt => opt.classList.toggle('active', opt.getAttribute('data-lang') === lang));
        langBtn.querySelector('.lang-flag').textContent = lang.toUpperCase();
        langSwitcher.classList.remove('open');
      });
    });

    document.addEventListener('click', (e) => {
      if (!langSwitcher.contains(e.target)) langSwitcher.classList.remove('open');
    });
  }

  // ==========================================
  // Navbar Scroll
  // ==========================================
  const navbar = document.getElementById('navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 50);
    });
  }

  // ==========================================
  // Mobile Navigation
  // ==========================================
  const mobileToggle = document.getElementById('mobileToggle');
  const mobileNav = document.getElementById('mobileNav');
  const mobileClose = document.getElementById('mobileClose');
  const mobileOverlay = document.getElementById('mobileOverlay');

  function closeMobileNav() {
    if (mobileNav) mobileNav.classList.remove('open');
    if (mobileOverlay) mobileOverlay.classList.remove('visible');
    if (mobileToggle) mobileToggle.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (mobileToggle && mobileNav) {
    function openMobileNav() {
      mobileNav.classList.add('open');
      if (mobileOverlay) mobileOverlay.classList.add('visible');
      mobileToggle.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    mobileToggle.addEventListener('click', () => {
      mobileNav.classList.contains('open') ? closeMobileNav() : openMobileNav();
    });
    if (mobileClose) mobileClose.addEventListener('click', closeMobileNav);
    if (mobileOverlay) mobileOverlay.addEventListener('click', closeMobileNav);
    document.querySelectorAll('.mobile-link').forEach(link => link.addEventListener('click', closeMobileNav));
  }

  // ==========================================
  // Modale vidéo de présentation ("Découvrir" → défilement + vidéo autoplay)
  // ==========================================
  const videoModal = document.getElementById('videoModal');
  const videoFrame = document.getElementById('videoFrame');
  const discoverBtn = document.getElementById('discoverBtn');
  if (videoModal && videoFrame && discoverBtn && window.VIDEO_ID) {
    const openVideo = () => {
      videoFrame.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(window.VIDEO_ID) + '?autoplay=1&rel=0&modestbranding=1&playsinline=1';
      videoModal.classList.add('open');
      videoModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    };
    const closeVideo = () => {
      videoFrame.src = '';
      videoModal.classList.remove('open');
      videoModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    };
    discoverBtn.addEventListener('click', openVideo);
    videoModal.querySelectorAll('[data-video-close]').forEach(el => el.addEventListener('click', closeVideo));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && videoModal.classList.contains('open')) closeVideo(); });
  }

  // ==========================================
  // Recherche animée (icône loupe → champ premium)
  // Câblage de tous les .search-wrap présents dans le DOM
  // (barres de recherche locales des pages : forum → events).
  // La navbar n'injecte plus de loupe : chaque page gère son accès.
  // ==========================================
  document.querySelectorAll('.search-wrap').forEach(wrap => {
    const btn = wrap.querySelector('.search-btn');
    const field = wrap.querySelector('.search-field');
    const input = field ? field.querySelector('input') : null;
    if (!btn || !field || !input) return;
    const open = () => {
      field.classList.add('open');
      btn.classList.add('ping');
      setTimeout(() => btn.classList.remove('ping'), 600);
      setTimeout(() => input.focus(), 120);
    };
    const close = () => field.classList.remove('open');
    btn.addEventListener('click', e => {
      e.stopPropagation();
      field.classList.contains('open') ? close() : open();
    });
    document.addEventListener('click', e => { if (!wrap.contains(e.target)) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  });

  // ==========================================
  // AUTH STATE MANAGEMENT
  // ==========================================
  const authLoggedOut = document.getElementById('authLoggedOut');
  const authLoggedIn = document.getElementById('authLoggedIn');
  const mobileAuthOut = document.getElementById('mobileAuthOut');
  const mobileAuthIn = document.getElementById('mobileAuthIn');
  const navUserAvatar = document.getElementById('navUserAvatar');
  const dropdownName = document.getElementById('dropdownName');
  const dropdownEmail = document.getElementById('dropdownEmail');
  const adminLink = document.getElementById('adminLink');
  const userMenu = document.getElementById('userMenu');
  const userDropdown = document.getElementById('userDropdown');

  let currentUser = null;
  let currentProfile = null;

  function showLoggedIn(user, profile) {
    currentUser = user;
    currentProfile = profile;
    if (authLoggedOut) authLoggedOut.style.display = 'none';
    if (authLoggedIn) authLoggedIn.style.display = 'flex';
    if (mobileAuthOut) mobileAuthOut.style.display = 'none';
    if (mobileAuthIn) mobileAuthIn.style.display = 'block';
    if (navUserAvatar) navUserAvatar.textContent = (profile?.full_name || user.email || 'U')[0].toUpperCase();
    if (dropdownName) dropdownName.textContent = profile?.full_name || 'Utilisateur';
    if (dropdownEmail) dropdownEmail.textContent = user.email;
    if (adminLink && profile?.role === 'admin') adminLink.style.display = 'block';
    if (window.Auth) Auth.startActivityTracking();
    if (window.Online) Online.start(user?.id || null);
  }

  function showLoggedOut() {
    currentUser = null;
    currentProfile = null;
    if (authLoggedOut) authLoggedOut.style.display = 'flex';
    if (authLoggedIn) authLoggedIn.style.display = 'none';
    if (mobileAuthOut) mobileAuthOut.style.display = 'block';
    if (mobileAuthIn) mobileAuthIn.style.display = 'none';
    if (window.Auth) Auth.stopActivityTracking();
    if (window.Online) Online.start(null);
  }

  // User menu toggle
  if (userMenu) {
    document.getElementById('userAvatarBtn').addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
      if (!userMenu.contains(e.target)) userDropdown.classList.remove('open');
    });
  }

  // Logout
  document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    await Auth.signOut();
  });
  document.getElementById('mobileLogoutBtn')?.addEventListener('click', async () => {
    await Auth.signOut();
  });

  // Initialize Supabase and listen for auth
  function initAuth() {
    if (typeof Auth === 'undefined') {
      console.error('Auth module not loaded');
      showLoggedOut();
      return;
    }
    if (!Auth.init()) {
      console.error('Auth.init() failed');
      showLoggedOut();
      return;
    }

    Auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event);
      if (session?.user) {
        if (event === 'SIGNED_IN' && window.Auth) {
          Auth.logConnection('login');
        }
        const { data: profile, error } = await Auth.getProfile(session.user.id);
        if (error) console.warn('Profile error:', error);
        showLoggedIn(session.user, profile);
      } else {
        showLoggedOut();
      }
    });

    Auth.getUser().then(async ({ user, error }) => {
      console.log('Initial user check:', user ? user.email : 'none', error);
      if (user) {
        if (!Auth.isEmailConfirmed(user)) {
          // Email non confirmé → déconnexion et retour à la page de connexion
          await Auth.signOut('login.html');
          return;
        }
        const { data: profile } = await Auth.getProfile(user.id);
        showLoggedIn(user, profile);
      } else {
        showLoggedOut();
      }
    }).catch(err => {
      console.error('getUser error:', err);
      showLoggedOut();
    });
  }

  initAuth();

  // ==========================================
  // CTA Registration Form → Supabase
  // ==========================================
  const ctaForm = document.getElementById('ctaRegisterForm');
  if (ctaForm) {
    ctaForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('ctaName').value.trim();
      const email = document.getElementById('ctaEmail').value.trim();
      if (!name || !email) return;

      const btn = ctaForm.querySelector('button[type="submit"]');
      const originalHTML = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
      btn.disabled = true;

      // Redirect to register with pre-filled data
      window.location.href = `register.html?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}`;
    });
  }

  // ==========================================
  // Scroll Animations
  // ==========================================
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = entry.target.getAttribute('data-delay') || 0;
        setTimeout(() => entry.target.classList.add('visible'), parseInt(delay));
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el));

  // ==========================================
  // Smooth Scroll
  // ==========================================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ==========================================
  // Animated Counters
  // ==========================================
  const heroStats = document.querySelector('.hero-stats');
  if (heroStats && !window.__heroAnimActive) {
    const statsObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          document.querySelectorAll('.stat-number').forEach(el => {
            const text = el.textContent.replace(/,/g, '');
            const target = parseInt(text);
            if (isNaN(target)) return;
            const duration = 2000;
            const startTime = performance.now();
            function update(currentTime) {
              const progress = Math.min((currentTime - startTime) / duration, 1);
              el.textContent = Math.floor(target * (1 - Math.pow(1 - progress, 3))).toLocaleString();
              if (progress < 1) requestAnimationFrame(update);
            }
            requestAnimationFrame(update);
          });
          statsObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    statsObserver.observe(heroStats);
  }

  // ==========================================
  // Forum Vote (placeholder for DB)
  // ==========================================
  document.querySelectorAll('.vote-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const countEl = btn.parentElement.querySelector('.vote-count');
      const current = parseInt(countEl.textContent);
      countEl.textContent = btn.querySelector('.fa-caret-up') ? current + 1 : current - 1;
    });
  });

  // ==========================================
  // Keyboard
  // ==========================================
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeMobileNav();
      if (langSwitcher) langSwitcher.classList.remove('open');
      const userDropdown = document.getElementById('userDropdown');
      if (userDropdown) userDropdown.classList.remove('open');
    }
  });
});
