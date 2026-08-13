/* ============================================
   TechDZ — Floating Widgets
   AI Assistant (local, rule-based) + Back to Top
   ============================================ */

(function () {
  'use strict';

  // ==========================================
  // Language & translations
  // ==========================================
  var lang = localStorage.getItem('techdz-lang') || 'fr';
  var T = (window.translations && (window.translations[lang] || window.translations.fr)) || {};
  function t(key, fallback) { return T[key] || fallback; }
  function page(url) { return url + '?lang=' + lang; }

  // ==========================================
  // Knowledge base (per language)
  // ==========================================
  var KB = {
    fr: [
      { kw: ['qui es tu', 'qui es-tu', 'ton nom', 'tu es qui', 'presente toi', 'presentation', 'qu est ce que tu es'], reply: "Je suis l'assistant de TechDZ, conçu pour vous guider dans la communauté. Je peux vous renseigner sur le forum, les emplois, les formations, les actualités, les événements et le networking." },
      { kw: ['bonjour', 'bonsoir', 'salut', 'hello', 'salam', 'coucou', 'hi', 'hey'], reply: "Bonjour ! Ravi de vous aider. Posez-moi une question sur la communauté, ou cliquez sur une suggestion ci-dessous." },
      { kw: ['aide', 'help', 'que peux tu', 'que sais tu', 'comment fonctionne', 'commencer', 'debuter', 'bien demarrer'], reply: "Voici ce que je peux vous indiquer :\n\u2022 Le forum de discussions\n\u2022 Les offres d'emploi\n\u2022 Les formations gratuites\n\u2022 Les actualités tech\n\u2022 Les événements (meetups, hackathons)\n\u2022 Le networking et les profils membres\n\u2022 La création de compte\n\nPosez-moi votre question !" },
      { kw: ['techdz', 'c est quoi', 'cest quoi', 'qu est ce que', 'description', 'a propos', 'apropos', 'qui sommes', 'mission', 'communaute it', 'plateforme', 'plateform'], reply: "TechDZ est la plus grande communauté IT d'Algérie : plus de 5 000 informaticiens échangent sur le forum, partagent des offres d'emploi, des formations gratuites, des actualités et organisent des événements. Le tout 100% gratuit !" },
      { kw: ['forum', 'discussion', 'question technique', 'poser question', 'post', 'reponse', 'aide technique', 'bug', 'probleme code', 'developpement'], reply: "Le forum est le c\u0153ur de TechDZ : réseaux, cybersécurité, bases de données, développement, IA, cloud... Posez vos questions et échangez avec des experts. \u2192 <a href=\"" + page('forum.html') + "\">Explorer le forum</a>" },
      { kw: ['emploi', 'job', 'travail', 'offre', 'recrutement', 'poste', 'salaire', 'cv', 'freelance', 'stage', 'carriere', 'metier'], reply: "Les offres d'emploi TechDZ sont vérifiées : développeurs, admin sys, réseau, DBA, chef de projet, cybersécurité... \u2192 <a href=\"" + page('jobs.html') + "\">Voir les offres</a>" },
      { kw: ['formation', 'cours', 'apprendre', 'certif', 'ccna', 'aws', 'ceh', 'etudier', 'tutoriel', 'bootcamp', 'elearning', 'sql', 'linux', 'python'], reply: "Des formations 100% gratuites : réseaux (CCNA), Linux, cybersécurité (CEH), bases de données SQL, data science, gestion de projet. \u2192 <a href=\"" + page('training.html') + "\">Découvrir les formations</a>" },
      { kw: ['actualite', 'news', 'information', 'tendance', 'innovation', 'a la une', 'actus', 'nouveautes'], reply: "Restez à jour avec la tech en Algérie : IA générative, startups, marché IT, certifications gratuites. \u2192 <a href=\"" + page('news.html') + "\">Lire les actualités</a>" },
      { kw: ['evenement', 'event', 'meetup', 'hackathon', 'conference', 'workshop', 'webinaire', 'atelier'], reply: "Meetups, conférences, hackathons et workshops partout en Algérie. \u2192 <a href=\"" + page('events.html') + "\">Voir les événements</a>" },
      { kw: ['networking', 'reseau pro', 'reseau professionnel', 'membres', 'profil', 'community', 'mettre en relation', 'connexion pro'], reply: "Créez votre profil, connectez-vous avec des professionnels IT de tous horizons et développez votre réseau. \u2192 <a href=\"" + page('networking.html') + "\">Accéder au networking</a>" },
      { kw: ['inscription', 'creer un compte', 'creer compte', 'rejoindre', 's inscrire', 'sinscrire', 'signup', 'compte gratuit', 'devenir membre'], reply: "Créer un compte est gratuit et prend moins d'une minute : nom + email suffisent. \u2192 <a href=\"" + page('register.html') + "\">Créer mon compte</a>" },
      { kw: ['connecter', 'connexion', 'login', 'sign in', 'mot de passe oublie', 'se connecter'], reply: "Pour vous connecter : \u2192 <a href=\"" + page('login.html') + "\">Se connecter</a>. Mot de passe oublié ? Utilisez le lien de réinitialisation sur la page de connexion." },
      { kw: ['gratuit', 'prix', 'payer', 'couter', 'cout', 'abonnement', 'payant', 'facturation'], reply: "TechDZ est 100% gratuit : forum, emplois, formations et événements. Sans carte bancaire, sans abonnement !" },
      { kw: ['langue', 'language', 'traduction', 'anglais', 'arabe', 'francais', 'translation'], reply: "Vous pouvez changer de langue à tout moment via le menu FR / EN / AR en haut à droite de la page. Le changement s'applique immédiatement." },
      { kw: ['theme', 'sombre', 'clair', 'dark', 'light', 'mode nuit', 'mode jour'], reply: "Le bouton soleil / lune en haut à droite bascule entre le thème sombre et le thème clair. Votre choix est mémorisé." },
      { kw: ['contact', 'discord', 'twitter', 'linkedin', 'github', 'support', 'mail', 'email', 'joindre', 'equipe'], reply: "Retrouvez TechDZ sur Twitter, LinkedIn, GitHub et Discord (liens en bas de page). Vous pouvez aussi créer un compte pour échanger directement avec la communauté." },
      { kw: ['merci', 'thanks', 'thank you', 'bravo', 'top', 'genial', 'super'], reply: "Avec plaisir ! N'hésitez pas si vous avez d'autres questions." },
      { kw: ['au revoir', 'bye', 'adieu', 'a bientot', 'a plus', 'bonne journee', 'bonne nuit'], reply: "Au revoir ! À bientôt sur TechDZ." }
    ],
    en: [
      { kw: ['who are you', 'your name', 'introduce yourself', 'what are you'], reply: "I'm the TechDZ assistant, built to guide you through the community. I can tell you about the forum, jobs, training, news, events and networking." },
      { kw: ['hello', 'hi', 'hey', 'good morning', 'good evening', 'salam'], reply: "Hello! Glad to help. Ask me anything about the community, or tap a suggestion below." },
      { kw: ['help', 'what can you do', 'how does it work', 'get started', 'starting'], reply: "Here's what I can tell you about:\n\u2022 The discussion forum\n\u2022 Job offers\n\u2022 Free training\n\u2022 Tech news\n\u2022 Events (meetups, hackathons)\n\u2022 Networking and member profiles\n\u2022 Creating an account\n\nAsk me your question!" },
      { kw: ['techdz', 'what is', 'about', 'description', 'mission', 'who we are', 'it community', 'platform'], reply: "TechDZ is Algeria's largest IT community: 5,000+ IT professionals exchange on the forum, share job offers, free training, news and organize events. 100% free!" },
      { kw: ['forum', 'discussion', 'question', 'post', 'reply', 'code help', 'develop'], reply: "The forum is the heart of TechDZ: networking, cybersecurity, databases, development, AI, cloud... Ask questions and get answers from experts. \u2192 <a href=\"" + page('forum.html') + "\">Explore the forum</a>" },
      { kw: ['job', 'jobs', 'employment', 'offer', 'hiring', 'position', 'salary', 'cv', 'freelance', 'internship', 'career'], reply: "TechDZ job offers are verified: developers, sys admins, network engineers, DBAs, project managers, cybersecurity... \u2192 <a href=\"" + page('jobs.html') + "\">View offers</a>" },
      { kw: ['training', 'course', 'learn', 'certification', 'ccna', 'aws', 'ceh', 'tutorial', 'bootcamp', 'sql', 'linux', 'python'], reply: "100% free training: networking (CCNA), Linux, cybersecurity (CEH), SQL databases, data science, project management. \u2192 <a href=\"" + page('training.html') + "\">Discover training</a>" },
      { kw: ['news', 'latest', 'trend', 'innovation', 'update', 'headlines'], reply: "Stay up to date with tech in Algeria: generative AI, startups, the IT market, free certifications. \u2192 <a href=\"" + page('news.html') + "\">Read the news</a>" },
      { kw: ['event', 'meetup', 'hackathon', 'conference', 'workshop', 'webinar'], reply: "Meetups, conferences, hackathons and workshops all over Algeria. \u2192 <a href=\"" + page('events.html') + "\">See events</a>" },
      { kw: ['networking', 'network', 'profile', 'members', 'connect', 'professional'], reply: "Create your profile, connect with IT professionals from all backgrounds and grow your network. \u2192 <a href=\"" + page('networking.html') + "\">Go to networking</a>" },
      { kw: ['sign up', 'signup', 'create account', 'register', 'join', 'free account', 'become member'], reply: "Creating an account is free and takes less than a minute: name + email is all you need. \u2192 <a href=\"" + page('register.html') + "\">Create my account</a>" },
      { kw: ['login', 'sign in', 'log in', 'forgot password'], reply: "To sign in: \u2192 <a href=\"" + page('login.html') + "\">Log in</a>. Forgot your password? Use the reset link on the login page." },
      { kw: ['free', 'price', 'cost', 'pay', 'subscription', 'premium'], reply: "TechDZ is 100% free: forum, jobs, training and events. No credit card, no subscription!" },
      { kw: ['language', 'translation', 'english', 'arabic', 'french', 'switch language'], reply: "You can switch languages anytime via the FR / EN / AR menu at the top right of the page. The change applies immediately." },
      { kw: ['theme', 'dark', 'light', 'night mode', 'day mode'], reply: "The sun / moon button at the top right toggles between dark and light themes. Your choice is saved." },
      { kw: ['contact', 'discord', 'twitter', 'linkedin', 'github', 'support', 'email', 'team', 'reach'], reply: "Find TechDZ on Twitter, LinkedIn, GitHub and Discord (links at the bottom of the page). You can also create an account to chat directly with the community." },
      { kw: ['thanks', 'thank you', 'great', 'awesome', 'nice'], reply: "You're welcome! Feel free to ask if you have any other questions." },
      { kw: ['bye', 'goodbye', 'see you', 'later', 'have a nice day'], reply: "Goodbye! See you soon on TechDZ." }
    ],
    ar: [
      { kw: ['من انت', 'اسمك', 'عرفني بنفسك', 'ما انت'], reply: "أنا مساعد TechDZ، صُممت لأرشدك داخل المجتمع. يمكنني إخبارك عن المنتدى والوظائف والتكوين والأخبار والأحداث والتواصل." },
      { kw: ['مرحبا', 'اهلا', 'سلام', 'صباح الخير', 'مساء الخير', 'السلام عليكم'], reply: "مرحباً! يسعدني مساعدتك. اطرح سؤالك عن المجتمع أو انقر على إحدى الاقتراحات أدناه." },
      { kw: ['مساعدة', 'ماذا يمكنك', 'كيف يعمل', 'ابدأ', 'البداية'], reply: "إليك ما يمكنني إخبارك عنه:\n\u2022 منتدى النقاشات\n\u2022 عروض العمل\n\u2022 التكوين المجاني\n\u2022 أخبار التقنية\n\u2022 الأحداث (لقاءات، هاكاثونات)\n\u2022 التواصل والملفات الشخصية\n\u2022 إنشاء حساب\n\nاطرح سؤالك!" },
      { kw: ['techdz', 'تيكدز', 'ما هو', 'ما هي', 'عن المنصة', 'من نحن', 'المجتمع'], reply: "TechDZ هي أكبر مجتمع تقني في الجزائر: أكثر من 5000 مهندس معلومات يتناقشون في المنتدى ويتبادلون عروض العمل والتكوين المجاني والأخبار وينظمون الأحداث. كل ذلك مجاناً!" },
      { kw: ['منتدى', 'نقاش', 'سؤال', 'اجابة', 'مشكلة', 'كود'], reply: "المنتدى هو قلب TechDZ: الشبكات، الأمن السيبراني، قواعد البيانات، التطوير، الذكاء الاصطناعي، السحابة... اطرح أسئلتك وتبادل مع الخبراء. \u2192 <a href=\"" + page('forum.html') + "\">استكشف المنتدى</a>" },
      { kw: ['وظيفة', 'وظائف', 'عمل', 'عرض', 'توظيف', 'راتب', 'سيرة ذاتية', 'تدريب مهني', 'مسار مهني'], reply: "عروض العمل في TechDZ مُتحقق منها: مطورون، مسؤولو أنظمة، شبكات، قواعد بيانات، مدراء مشاريع، أمن سيبراني... \u2192 <a href=\"" + page('jobs.html') + "\">شاهد العروض</a>" },
      { kw: ['تكوين', 'دورة', 'تعلم', 'شهادة', 'دراسة', 'مدرسة'], reply: "تكوينات مجانية 100%: الشبكات (CCNA)، لينكس، الأمن السيبراني (CEH)، قواعد البيانات SQL، علم البيانات، تسيير المشاريع. \u2192 <a href=\"" + page('training.html') + "\">اكتشف التكوينات</a>" },
      { kw: ['اخبار', 'أخبار', 'مستجدات', 'جديد', 'ابتكار', 'تطورات'], reply: "تابع آخر أخبار التقنية في الجزائر: الذكاء الاصطناعي التوليدي، الشركات الناشئة، سوق العمل، الشهادات المجانية. \u2192 <a href=\"" + page('news.html') + "\">اقرأ الأخبار</a>" },
      { kw: ['حدث', 'احداث', 'أحداث', 'ميتاب', 'هاكاثون', 'مؤتمر', 'ورشة', 'ندوة'], reply: "لقاءات ومؤتمرات وهاكاثونات وورشات عمل في كل أنحاء الجزائر. \u2192 <a href=\"" + page('events.html') + "\">شاهد الأحداث</a>" },
      { kw: ['تواصل', 'شبكة', 'اعضاء', 'أعضاء', 'ملف شخصي', 'تواصل مهني'], reply: "أنشئ ملفك الشخصي، تواصل مع محترفي تقنية المعلومات من جميع التخصصات ووسّع شبكتك المهنية. \u2192 <a href=\"" + page('networking.html') + "\">إلى التواصل</a>" },
      { kw: ['تسجيل', 'انشاء حساب', 'انضم', 'حساب مجاني', 'عضو جديد'], reply: "إنشاء حساب مجاني ويستغرق أقل من دقيقة: الاسم والبريد الإلكتروني يكفيان. \u2192 <a href=\"" + page('register.html') + "\">أنشئ حسابي</a>" },
      { kw: ['تسجيل الدخول', 'دخول', 'كلمة المرور', 'نسيت كلمة المرور'], reply: "لتسجيل الدخول: \u2192 <a href=\"" + page('login.html') + "\">تسجيل الدخول</a>. نسيت كلمة المرور؟ استعمل رابط إعادة التعيين في صفحة الدخول." },
      { kw: ['مجاني', 'مجانا', 'ثمن', 'سعر', 'دفع', 'اشتراك'], reply: "TechDZ مجانية 100%: المنتدى والوظائف والتكوين والأحداث. بدون بطاقة بنكية وبدون اشتراك!" },
      { kw: ['لغة', 'اللغة', 'ترجمة', 'عربية', 'فرنسية', 'انجليزية'], reply: "يمكنك تغيير اللغة في أي وقت من قائمة FR / EN / AR في أعلى يمين الصفحة. التغيير يُطبق فوراً." },
      { kw: ['مظهر', 'داكن', 'فاتح', 'ليلي', 'نهاري', 'وضع'], reply: "زر الشمس / القمر في أعلى اليمين ينقّل بين المظهر الداكن والمظهر الفاتح. يُحفظ اختيارك." },
      { kw: ['اتصال', 'تواصل معنا', 'ديسكورد', 'تويتر', 'لينكدين', 'جيت هاب', 'دعم', 'بريد', 'فريق'], reply: "تجد TechDZ على تويتر ولينكدين وجيت هاب وديسكورد (روابط أسفل الصفحة). يمكنك أيضاً إنشاء حساب للتواصل مباشرة مع المجتمع." },
      { kw: ['شكرا', 'شكراً', 'ممتاز', 'رائع', 'جزاك الله خيرا'], reply: "بكل سرور! لا تتردد في طرح أي سؤال آخر." },
      { kw: ['وداعا', 'الى اللقاء', 'مع السلامة', 'في امان الله', 'ليلة سعيدة'], reply: "وداعاً! نلتقي قريباً على TechDZ." }
    ]
  };

  function normalize(text) {
    return text.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[?!.,;:]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function findReply(message) {
    var rules = KB[lang] || KB.fr;
    var norm = normalize(message);
    var best = null;
    for (var i = 0; i < rules.length; i++) {
      var score = 0;
      for (var k = 0; k < rules[i].kw.length; k++) {
        if (norm.indexOf(normalize(rules[i].kw[k])) !== -1) score++;
      }
      if (score > 0 && (!best || score > best.score)) best = { score: score, reply: rules[i].reply };
    }
    return best ? best.reply : t('ai.unknown', 'Je n\'ai pas encore de réponse à cette question.');
  }

  // ==========================================
  // Build UI
  // ==========================================
  var fabHTML =
    '<button class="dz-fab" id="aiFab" aria-label="' + t('ai.title', 'Assistant') + '">' +
      '<i class="fas fa-robot"></i>' +
    '</button>' +
    '<div class="ai-panel" id="aiPanel" dir="' + (lang === 'ar' ? 'rtl' : 'ltr') + '">' +
      '<div class="ai-header">' +
        '<div class="ai-avatar"><i class="fas fa-robot"></i></div>' +
        '<div class="ai-header-info">' +
          '<strong>' + t('ai.title', 'Assistant TechDZ') + '</strong>' +
          '<span><span class="ai-status-dot"></span>' + t('ai.online', 'En ligne') + '</span>' +
        '</div>' +
        '<button class="ai-close" id="aiClose" aria-label="' + t('ai.close', 'Fermer') + '"><i class="fas fa-times"></i></button>' +
      '</div>' +
      '<div class="ai-messages" id="aiMessages"></div>' +
      '<div class="ai-suggestions" id="aiSuggestions">' +
        '<button class="ai-chip">' + t('ai.s1', 'Le forum') + '</button>' +
        '<button class="ai-chip">' + t('ai.s2', 'Offres d\'emploi') + '</button>' +
        '<button class="ai-chip">' + t('ai.s3', 'Formations') + '</button>' +
        '<button class="ai-chip">' + t('ai.s4', 'Contact') + '</button>' +
      '</div>' +
      '<div class="ai-input-row">' +
        '<input type="text" id="aiInput" placeholder="' + t('ai.placeholder', 'Posez votre question...') + '" aria-label="' + t('ai.placeholder', 'Posez votre question...') + '">' +
        '<button class="ai-send" id="aiSend" aria-label="' + t('ai.send', 'Envoyer') + '"><i class="fas fa-paper-plane"></i></button>' +
      '</div>' +
    '</div>' +
    '<button class="dz-fab" id="backToTop" aria-label="' + (lang === 'ar' ? 'العودة إلى الأعلى' : lang === 'en' ? 'Back to top' : 'Retour en haut') + '">' +
      '<i class="fas fa-chevron-up"></i>' +
    '</button>';

  var host = document.createElement('div');
  host.id = 'techdzWidgets';
  host.innerHTML = fabHTML;
  document.body.appendChild(host);

  var aiFab = document.getElementById('aiFab');
  var aiPanel = document.getElementById('aiPanel');
  var aiMessages = document.getElementById('aiMessages');
  var aiInput = document.getElementById('aiInput');
  var aiSend = document.getElementById('aiSend');
  var aiClose = document.getElementById('aiClose');
  var aiSuggestions = document.getElementById('aiSuggestions');
  var backToTop = document.getElementById('backToTop');

  // ==========================================
  // Back to Top
  // ==========================================
  window.addEventListener('scroll', function () {
    backToTop.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });

  backToTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ==========================================
  // AI Assistant — chat logic
  // ==========================================
  var welcomed = false;
  var typing = false;

  function scrollMessages() {
    aiMessages.scrollTop = aiMessages.scrollHeight;
  }

  function addMessage(text, cls) {
    var div = document.createElement('div');
    div.className = 'ai-msg ' + cls;
    div.innerHTML = text;
    aiMessages.appendChild(div);
    scrollMessages();
    return div;
  }

  function openPanel() {
    aiPanel.classList.add('open');
    if (!welcomed) {
      welcomed = true;
      addMessage(t('ai.welcome', 'Bonjour ! Comment puis-je vous aider ?'), 'bot');
    }
    setTimeout(function () { aiInput.focus(); }, 250);
  }

  function closePanel() {
    aiPanel.classList.remove('open');
  }

  aiFab.addEventListener('click', function () {
    aiPanel.classList.contains('open') ? closePanel() : openPanel();
  });
  aiClose.addEventListener('click', closePanel);

  document.addEventListener('click', function (e) {
    if (aiPanel.classList.contains('open') && !aiPanel.contains(e.target) && !aiFab.contains(e.target)) {
      closePanel();
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closePanel();
  });

  function botReply(message) {
    typing = true;
    var tEl = document.createElement('div');
    tEl.className = 'ai-typing';
    tEl.innerHTML = '<span></span><span></span><span></span>';
    aiMessages.appendChild(tEl);
    scrollMessages();
    var delay = Math.min(600 + message.length * 15, 1300);
    setTimeout(function () {
      tEl.remove();
      typing = false;
      addMessage(findReply(message), 'bot');
    }, delay);
  }

  function sendMessage(text) {
    var value = text != null ? text.trim() : aiInput.value.trim();
    if (!value || typing) return;
    aiInput.value = '';
    addMessage(escapeHtml(value), 'user');
    botReply(value);
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  aiSend.addEventListener('click', function () { sendMessage(); });
  aiInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') sendMessage();
  });

  aiSuggestions.querySelectorAll('.ai-chip').forEach(function (chip) {
    chip.addEventListener('click', function () { sendMessage(chip.textContent); });
  });
})();
