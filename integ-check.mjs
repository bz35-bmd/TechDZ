/* TechDZ — integ-check : vérification statique (sélecteur d'animation du hero,
   captcha Turnstile + reset par email, présence en ligne).
   Node pur (aucune dépendance). Usage : node integ-check.mjs */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const here = path.dirname(fileURLToPath(import.meta.url));
const p = f => path.join(here, f);
const read = f => fs.readFileSync(p(f), 'utf8');

let failures = 0;
function ok(cond, label) {
  console.log((cond ? '  PASS ' : '  FAIL ') + label);
  if (!cond) failures++;
}

/* ---------- 1. Syntaxe JS ---------- */
console.log('\n== Syntaxe JS ==');
for (const f of ['script.js', 'translations.js', 'widgets.js', 'assets/hero-animation.js']) {
  const r = spawnSync(process.execPath, ['--check', p(f)], { encoding: 'utf8' });
  ok(r.status === 0, `${f} --check` + (r.status === 0 ? '' : '\n      ' + (r.stderr || '').split('\n')[0]));
}

/* ---------- 2. index.html : markup du picker ---------- */
console.log('\n== index.html : markup ==');
const html = read('index.html');
const picker = html.match(/<div class="theme-picker hero-anim-picker">([\s\S]*?)<\/div>\s*<\/div>/);
ok(!!picker, 'bloc .hero-anim-picker présent');
if (picker) {
  const m = picker[1];
  ok(/id="heroAnimPickerBtn"/.test(m), 'bouton #heroAnimPickerBtn');
  ok(/id="heroAnimPickerMenu"/.test(m), 'menu #heroAnimPickerMenu');
  const variants = [...m.matchAll(/data-hero-anim="(\w+)"/g)].map(x => x[1]);
  ok(JSON.stringify(variants) === JSON.stringify(['minimal', 'network', 'signal']),
    `3 variantes minimal/network/signal (trouvé: ${variants.join(',')})`);
  ok(!/id="haReplayBtn"/.test(m), 'bouton replay supprimé');
  ok(/aria-checked="false"/.test(m), 'aria-checked initialisé');
  ok(/data-i18n-aria="heroanim\.choose"/.test(m), 'aria-label i18n lié');
  ok(/assets\/hero-animation\.js/.test(html), 'script hero-animation.js chargé');
}

/* ---------- 3. style.css : swatches + masquage ---------- */
console.log('\n== style.css ==');
const css = read('style.css');
for (const sel of ['body.hero-anim-ready .hero-badge', '.ha-swatch', '.ha-minimal', '.ha-network', '.ha-signal']) {
  ok(css.includes(sel), `sélecteur ${sel}`);
}
ok(!/\.ha-replay/.test(css), 'CSS .ha-replay supprimé');
ok(/\b\w+\b.*\b\w+\b.*\w+/.test(css) && /\.hero-anim-picker \.theme-picker-menu/.test(css), 'média mobile .hero-anim-picker');

/* ---------- 4. hero-animation.js : logique ---------- */
console.log('\n== assets/hero-animation.js ==');
const ha = read('assets/hero-animation.js');
for (const fn of ['function playVariant', 'function initNavPicker', 'function ready', 'function showAll', 'boot()']) {
  ok(ha.includes(fn), `contient ${fn}`);
}
ok(/STORAGE_KEY\s*=\s*'techdz-hero-anim'/.test(ha), 'clé stockage techdz-hero-anim');
ok(/const MIGRATE = { a: 'minimal', b: 'network', c: 'signal' }/.test(ha), 'migration a/b/c -> variantes');
ok(!/haReplayBtn/.test(ha), 'binding replay supprimé');
ok(/Escape/.test(ha), 'fermeture Échap');

/* ---------- 5. translations.js : cohérence i18n ---------- */
console.log('\n== translations.js : cohérence i18n ==');
const tr = read('translations.js');
const KEYS = ['heroanim.title', 'heroanim.choose', 'heroanim.minimal', 'heroanim.minimalDesc',
  'heroanim.network', 'heroanim.networkDesc', 'heroanim.signal', 'heroanim.signalDesc'];
const langs = ['fr', 'en', 'ar'];
const parts = tr.split(/\n\s{2}(\w+): \{/).slice(1);
const blocks = {};
for (let i = 0; i + 1 < parts.length; i += 2) blocks[parts[i]] = parts[i + 1];
for (const lang of langs) {
  for (const k of KEYS) ok(blocks[lang] && blocks[lang].includes(`"${k}"`), `${lang}: clé "${k}"`);
}
const allLangKeys = new Set([...tr.matchAll(/"(\w+\.\w+)":\s*"/g)].map(m => m[1]));
const missing = KEYS.filter(k => !allLangKeys.has(k));
ok(missing.length === 0, 'toutes les clés heroanim.* sont définies');

/* ---------- 5b. Captcha Cloudflare (Turnstile) + reset par email ---------- */
console.log('\n== Captcha Cloudflare + reset par email ==');
const auth = read('auth.js');
for (const fn of ['async requestPasswordReset(email, captchaToken)', 'resetPasswordForEmail(email, options)',
  'turnstileOptions()', 'renderTurnstile()', 'resetCaptcha()', 'signInWithPassword']) {
  ok(auth.includes(fn), `auth.js : ${fn.replace(/\(.*\)/, '(...)')}`);
}
ok(/sitekey:\s*window\.TURNSTILE_SITE_KEY/.test(auth), 'auth.js : sitekey piloté par config');
ok(/if \(captchaToken\) options\.captchaToken = captchaToken/.test(auth), 'auth.js : token Turnstile transmis à Supabase');

const captchaPages = ['login.html', 'register.html', 'reset-password.html', 'admin/login.html'];
for (const f of captchaPages) {
  const h = read(f);
  ok(h.includes('id="turnstile-widget"'), `${f} : #turnstile-widget`);
  ok(h.includes('https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'), `${f} : script api.js chargé`);
  ok(h.includes('Auth.renderTurnstile()'), `${f} : rendu Auth.renderTurnstile()`);
}
const rp = read('reset-password.html');
ok(/data-i18n="reset\.email"/.test(rp), 'reset-password.html : champ email traduit');
ok(/data-i18n-placeholder="reset\.emailPlaceholder"/.test(rp), 'reset-password.html : placeholder traduit');
ok(/Auth\.requestPasswordReset\(/.test(rp), 'reset-password.html : appel Auth.requestPasswordReset');

const CR_KEYS = ['captcha.loading', 'captcha.complete', 'captcha.loadError',
  'reset.email', 'reset.emailPlaceholder', 'reset.title', 'reset.subtitle', 'reset.sent',
  'reset.tooMany', 'reset.send', 'reset.remember'];
for (const lang of langs) {
  ok(CR_KEYS.every(k => blocks[lang] && blocks[lang].includes(`"${k}"`)), `${lang} : clés captcha.* et reset.*`);
}
ok(CR_KEYS.filter(k => !allLangKeys.has(k)).length === 0, 'toutes les clés captcha.* / reset.* sont définies');

/* ---------- 5c. Présence en ligne (badge, widget home, networking) ---------- */
console.log('\n== Présence en ligne (badge, home, networking) ==');
ok(/--online:\s*#10B981/.test(css), 'style.css : variable --online');
ok(/--online-rgb:\s*16,\s*185,\s*129/.test(css), 'style.css : variable --online-rgb');
for (const sel of ['.online-badge', '.online-badge-dot', '.online-card-dot', '.members-section-sep',
  '.online-pulse', '.online-user', '.online-avatar-img', '.online-empty-icon', '.online-now-count',
  '.online-now-empty-icon', '.toast']) {
  ok(css.includes(sel), `style.css : ${sel}`);
}
ok(css.includes('@keyframes online-ping'), 'style.css : animation online-ping');
ok(css.includes('@keyframes online-user-in'), 'style.css : animation online-user-in');
ok(/rgba\(var\(--online-rgb\)/.test(css), 'style.css : couleurs via variables (pas de vert en dur)');

const js = read('script.js');
ok(js.includes("badge.className = 'online-badge'"), 'script.js : badge navbar généré');
ok(js.includes("getElementById('onlineAvatars')"), 'script.js : grille #onlineAvatars');
ok(js.includes("getElementById('onlineEmpty')"), 'script.js : état vide #onlineEmpty');
ok(js.includes("'none' : 'flex'"), 'script.js : état vide affiché en flex');
ok(/online-now-item/.test(js), 'script.js : item #onlineNowList');
ok(/online-now-empty/.test(js), 'script.js : état vide online-now');

const idx = read('index.html');
for (const id of ['onlineAvatars', 'onlineEmpty', 'onlineCount', 'onlineCountLabel']) {
  ok(new RegExp('id="' + id + '"').test(idx), `index.html : #${id}`);
}
const nw = read('networking.html');
for (const id of ['onlineNowSection', 'onlineNowCount', 'onlineNowList']) {
  ok(new RegExp('id="' + id + '"').test(nw), `networking.html : #${id}`);
}
for (const token of ['online-pulse', 'members-section-sep', 'is-online', 'online-card-dot']) {
  ok(nw.includes(token), `networking.html : ${token}`);
}

const ON_KEYS = ['online.badge', 'online.title', 'online.title2', 'online.members', 'online.member',
  'online.first', 'online.others', 'online.cta', 'online.now', 'online.online', 'online.offline', 'online.justConnected'];
for (const lang of langs) {
  ok(ON_KEYS.every(k => blocks[lang] && blocks[lang].includes(`"${k}"`)), `${lang} : clés online.*`);
}
ok(ON_KEYS.filter(k => !allLangKeys.has(k)).length === 0, 'toutes les clés online.* sont définies');

/* ---------- 6. Cohérence markup/i18n ---------- */
console.log('\n== Cohérence data-i18n du picker ==');
if (picker) {
  const used = [...picker[1].matchAll(/data-i18n(?:-aria)?="([^"]+)"/g)].map(m => m[1]);
  const undefinedKeys = used.filter(k => !allLangKeys.has(k));
  ok(undefinedKeys.length === 0, `toutes les clés du picker existent` +
    (undefinedKeys.length ? ` (manquantes: ${undefinedKeys.join(',')})` : ''));
  const haVars = [...picker[1].matchAll(/data-hero-anim="(\w+)"/g)].map(m => m[1]);
  const scriptVars = ['timelineA', 'timelineB', 'timelineC'].every(fn =>
    new RegExp('function ' + fn + '\\b').test(ha));
  ok(scriptVars, 'chaque variante du menu a une timeline dans hero-animation.js');
  ok(/if \(v === 'minimal'\)/.test(ha) && /else if \(v === 'network'\)/.test(ha), 'dispatch minimal/network/signal câblé');
}

console.log('\n' + (failures === 0 ? 'OK : tous les contrôles passent.' : `ECHEC : ${failures} contrôle(s) en échec.`));
process.exit(failures === 0 ? 0 : 1);
