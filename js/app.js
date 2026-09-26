import { store } from './store.js';
import { apiGateway } from './api.js';

class AppController {
  constructor() {
    this.currentView = 'dashboard';
    this.autosaveTimer = null;
    this.pendingFieldTarget = null;
    this.pendingFieldAiText = '';
    this.startStep = 0;
    this.startAnswers = {};
    this.startAnalyzing = false;
  }

  async init() {
    await store.init();
    this.bindNavigation();
    this.enhanceIcons();
    this.bindBrandSelector();
    this.bindStartWizard();
    this.bindBrandDnaForm();
    this.bindBrandDnaNavigation();
    this.bindMobileMore();
    this.bindCommandPalette();
    this.bindGenerators();
    this.bindInstagramGuides();
    this.bindMediaChecklist();
    this.bindAiGateway();
    this.bindSectionGuide();
    this.bindTheme();
    this.bindModelCatalog();
    this.bindModals();
    this.bindKeyboardShortcuts();

    this.renderActiveBrand();
    this.renderDashboard();
    this.checkApiStatusSilent();

    const initialView = window.location.hash.replace(/^#/, '').trim();
    if (initialView && document.getElementById(`view-${initialView}`)) {
      this.switchView(initialView, false);
    } else {
      this.switchView('dashboard', false);
    }
  }

  toast(message, type = 'info') {
    const stack = document.getElementById('toastStack');
    if (!stack) return;
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.innerText = message;
    stack.appendChild(el);

    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(10px)';
      el.style.transition = 'all 200ms ease';
      setTimeout(() => el.remove(), 200);
    }, 4000);
  }

  bindTheme() {
    const key = 'we-studio-theme';
    const btn = document.getElementById('btnThemeToggle');
    const apply = (theme) => {
      const dark = theme === 'dark';
      document.body.classList.toggle('dark-mode', dark);
      document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
      if (btn) {
        btn.setAttribute('aria-label', dark ? 'فعال کردن حالت روشن' : 'فعال کردن حالت دارک');
        btn.setAttribute('title', dark ? 'حالت روشن' : 'حالت دارک');
        const icon = btn.querySelector('.theme-icon');
        const label = btn.querySelector('.theme-label');
        if (icon) icon.textContent = dark ? '☀' : '☾';
        if (label) label.textContent = dark ? 'روشن' : 'دارک';
      }
    };
    let saved = 'light';
    try { saved = localStorage.getItem(key) || 'light'; } catch (_) {}
    apply(saved);
    btn?.addEventListener('click', () => {
      const next = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
      apply(next);
      try { localStorage.setItem(key, next); } catch (_) {}
    });
  }

  enhanceIcons() {
    const icons = {
      dashboard: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 11.5 12 4l8 7.5v7a1 1 0 0 1-1 1h-5v-5h-4v5H5a1 1 0 0 1-1-1v-7Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
      start: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z" stroke="currentColor" stroke-width="1.4"/></svg>',
      'brand-dna': '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m12 3 7 9-7 9-7-9 7-9Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="12" cy="12" r="2.2" fill="currentColor"/></svg>',
      instagram: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="3.5" stroke="currentColor" stroke-width="1.8"/><circle cx="17.2" cy="6.8" r="1" fill="currentColor"/></svg>',
      youtube: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3.5" y="6.5" width="17" height="11" rx="3" stroke="currentColor" stroke-width="1.8"/><path d="m10 9 5 3-5 3V9Z" fill="currentColor"/></svg>',
      stories: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="5" y="4" width="14" height="16" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
      media: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.8"/><path d="m8.5 12 2.3 2.4 4.9-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      history: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.8"/><path d="M12 7.5V12l3 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M5 5.5V9h3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
      'ai-gateway': '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.8"/></svg>'
    };
    document.querySelectorAll('.nav-pill-btn[data-view]').forEach(btn => {
      const svg = icons[btn.dataset.view];
      const holder = btn.querySelector('.nav-icon, .mobile-nav-icon');
      if (svg && holder) holder.innerHTML = svg;
    });
  }

  bindNavigation() {
    const navBtns = document.querySelectorAll('.nav-pill-btn');

    const navigate = (view, updateHash = true) => {
      if (!view) return;
      this.switchView(view, updateHash);
    };

    navBtns.forEach(btn => {
      btn.addEventListener('click', () => navigate(btn.dataset.view));
    });

    document.querySelectorAll('[data-jump]').forEach(btn => {
      btn.addEventListener('click', () => navigate(btn.dataset.jump));
    });

    document.getElementById('btnViewAllHistory')?.addEventListener('click', () => navigate('history'));
    document.getElementById('btnOpenShortcuts')?.addEventListener('click', () => {
      document.getElementById('shortcutsModal')?.classList.add('open');
    });

    window.addEventListener('hashchange', () => {
      const requested = window.location.hash.replace(/^#/, '').trim();
      const valid = requested && document.getElementById(`view-${requested}`);
      navigate(valid ? requested : 'dashboard', false);
    });
  }

  switchView(viewName, updateHash = true) {
    const panel = document.getElementById(`view-${viewName}`);
    if (!panel) viewName = 'dashboard';
    this.currentView = viewName;

    if (updateHash && window.location.hash !== `#${viewName}`) {
      history.replaceState(null, '', `#${viewName}`);
    }
    document.querySelector('.topnav')?.classList.remove('mobile-visible');
    document.querySelectorAll('.nav-pill-btn').forEach(el => {
      const isActive = el.dataset.view === viewName;
      el.classList.toggle('active', isActive);
      if (isActive) el.setAttribute('aria-current', 'page'); else el.removeAttribute('aria-current');
    });

    document.querySelectorAll('.view-panel').forEach(panel => {
      panel.classList.remove('active');
    });

    const targetPanel = document.getElementById(`view-${viewName}`);
    if (targetPanel) {
      targetPanel.classList.add('active');
    }

    const titles = {
      'dashboard': 'داشبورد',
      'start': 'شروع',
      'brand-dna': 'Brand DNA',
      'instagram': 'Instagram Engine',
      'youtube': 'YouTube Engine',
      'stories': 'Story Architecture',
      'media': 'بازبینی قبل از انتشار',
      'history': 'تاریخچه خروجی‌ها',
      'ai-gateway': 'AI Gateway'
    };
    const titleEl = document.getElementById('pageTitle');
    if (titleEl) titleEl.innerText = titles[viewName] || 'داشبورد';

    if (viewName === 'history') this.renderHistoryList();
    if (viewName === 'dashboard') this.renderDashboard();
    if (viewName === 'start') this.renderStartWizard();
  }

  bindStartWizard() {
    document.getElementById('btnStartGoGateway')?.addEventListener('click', () => this.switchView('ai-gateway'));
    document.getElementById('btnStartBack')?.addEventListener('click', () => this.startPreviousStep());
    document.getElementById('btnStartNext')?.addEventListener('click', () => this.startNextStep());
    document.getElementById('btnStartAnalyze')?.addEventListener('click', () => this.analyzeStartAnswers());
    document.getElementById('btnStartOpenBrand')?.addEventListener('click', () => this.switchView('brand-dna'));
    document.getElementById('btnStartRestart')?.addEventListener('click', () => this.startRestart());
    document.getElementById('btnStartHelp')?.addEventListener('click', () => {
      const panel = document.getElementById('startHelpDetail');
      if (panel) panel.hidden = !panel.hidden;
    });
    document.getElementById('startAnswer')?.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        const isLast = this.startStep === this.getStartQuestions().length - 1;
        if (isLast) this.analyzeStartAnswers(); else this.startNextStep();
      }
    });
  }

  getStartQuestions() {
    return [
      { key: 'userName', title: 'اول از همه، خودت را معرفی کن', question: 'اسمت چیست؟ دوست داری من تو را با چه نامی صدا بزنم؟', hint: 'نامت را ساده و دقیق بنویس.', example: 'مثلاً: امین', help: 'نام تو را برای شخصی‌تر شدن گفت‌وگو و ساخت تجربه مناسب‌تر نگه می‌داریم. اینجا پاسخ استانداردی وجود ندارد؛ نام خودت را بنویس.', options: [], mode: 'single', required: true },
      { key: 'brandName', title: 'اسم کسب‌وکار یا برندت چیست؟', question: 'برند، کسب‌وکار یا پروژه‌ای که می‌خواهی برایش هویت بسازیم چه نامی دارد؟', hint: 'اگر نام نهایی نداری، نام موقت هم قابل قبول است.', example: 'مثلاً: ای آی کارت', help: 'نام برند باید همان نامی باشد که دوست داری در Brand DNA استفاده شود. اگر هنوز قطعی نیست، نام موقت بنویس؛ بعداً می‌توانی آن را اصلاح کنی.', options: [], mode: 'single', required: true },
      { key: 'business', title: 'چه کاری انجام می‌دهی؟', question: 'اگر بخواهی خیلی ساده برای یک دوست توضیح بدهی، کسب‌وکار تو بیشتر در کدام دسته است؟', hint: 'یک گزینه را انتخاب کن یا خودت با زبان ساده توضیح بده.', example: 'مثلاً: خدمات طراحی سایت برای کسب‌وکارهای کوچک', help: 'اگر چند مورد با هم درست است، نزدیک‌ترین گزینه را انتخاب کن و جزئیات را در کادر تایپ کن.', options: ['فروش محصول', 'ارائه خدمات', 'آموزش و دوره', 'نرم‌افزار و فناوری', 'رسانه و تولید محتوا', 'فروشگاه / تجارت آنلاین'], mode: 'single', required: true },
      { key: 'audience', title: 'مخاطب تو چه کسی است؟', question: 'بیشتر دوست داری چه آدم‌هایی مشتری یا دنبال‌کننده تو باشند؟', hint: 'می‌توانی چند گزینه را هم‌زمان انتخاب کنی.', example: 'مثلاً: صاحبان کسب‌وکار کوچک و تولیدکنندگان محتوا', help: 'سن دقیق لازم نیست. شغل، نیاز، سطح تجربه یا نوع کسب‌وکار مخاطب برای ما مهم‌تر است.', options: ['مصرف‌کننده عمومی', 'صاحبان کسب‌وکار کوچک', 'مدیران و تیم‌های سازمانی', 'متخصصان و فریلنسرها', 'تولیدکنندگان محتوا', 'دانشجویان و علاقه‌مندان'], mode: 'multi', required: true },
      { key: 'problem', title: 'چه مشکلی را برایشان حل می‌کنی؟', question: 'مخاطب قبل از آشنایی با تو بیشتر با کدام مشکل روبه‌رو است؟', hint: 'چند مورد را انتخاب کن؛ اگر مشکل دیگری داری، تایپ کن.', example: 'مثلاً: وقت کم، پیچیدگی ابزارها و نتیجه نگرفتن', help: 'به درد واقعی فکر کن، نه فقط ویژگی محصول. چیزی که مخاطب بابت آن زمان، پول یا انرژی از دست می‌دهد را مشخص کن.', options: ['کمبود زمان', 'پیچیدگی و سردرگمی', 'کیفیت پایین نتیجه', 'هزینه زیاد', 'نبود اعتماد و اطمینان', 'بی‌نظمی و نداشتن سیستم'], mode: 'multi', required: true },
      { key: 'difference', title: 'چه چیزی تو را متفاوت می‌کند؟', question: 'کدام ویژگی بیشتر باعث می‌شود مخاطب تو را به گزینه‌های دیگر ترجیح دهد؟', hint: 'یک یا چند مورد را انتخاب کن و اگر لازم بود توضیح بده.', example: 'مثلاً: ساده، سریع و کاملاً کاربردی هستیم', help: 'اگر هنوز تفاوت مشخصی نداری هم اشکالی ندارد؛ نزدیک‌ترین گزینه را انتخاب کن. AI از پاسخ تو برای پیشنهاد جایگاه برند استفاده می‌کند.', options: ['سادگی و قابل‌فهم بودن', 'سرعت و صرفه‌جویی در زمان', 'تخصص و تجربه', 'کیفیت و دقت بالا', 'خدمات و پشتیبانی بهتر', 'نوآوری و متفاوت بودن'], mode: 'multi', required: true },
      { key: 'feeling', title: 'دوست داری برندت چه حسی بدهد؟', question: 'وقتی کسی با برندت روبه‌رو می‌شود، دوست داری چه حسی پیدا کند؟', hint: 'سه تا پنج مورد را انتخاب کن یا حس موردنظر خودت را بنویس.', example: 'مثلاً: حرفه‌ای، قابل اعتماد، ساده و صمیمی', help: 'این پاسخ به شخصیت برند کمک می‌کند. لازم نیست از اصطلاحات روان‌شناسی یا برندینگ استفاده کنی؛ همان حسی که می‌خواهی منتقل شود کافی است.', options: ['قابل اعتماد', 'حرفه‌ای', 'صمیمی و دوستانه', 'لوکس و ممتاز', 'مدرن و به‌روز', 'پرانرژی و الهام‌بخش'], mode: 'multi', required: true },
      { key: 'goal', title: 'مهم‌ترین هدفت چیست؟', question: 'اگر برندت در یک سال آینده فقط یک نتیجه مهم بگیرد، بیشتر دوست داری کدام باشد؟', hint: 'یک گزینه را انتخاب کن یا هدف دقیق خودت را بنویس.', example: 'مثلاً: تبدیل شدن به مرجع شناخته‌شده حوزه خودمان', help: 'این هدف به AI کمک می‌کند بین آگاهی از برند، فروش، اعتبار، جامعه‌سازی و رشد کسب‌وکار اولویت‌گذاری کند.', options: ['افزایش فروش', 'شناخته‌شدن برند', 'تبدیل‌شدن به مرجع تخصصی', 'ساخت جامعه و دنبال‌کننده وفادار', 'افزایش بازگشت مشتری', 'گسترش بازار و ورود به حوزه‌های جدید'], mode: 'single', required: true },
      { key: 'tone', title: 'چطور حرف بزنیم؟', question: 'دوست داری برندت در گفتگو با مخاطب چه لحنی داشته باشد؟', hint: 'چند گزینه را انتخاب کن؛ همیشه می‌توانی توضیح خودت را هم تایپ یا بگویی.', example: 'مثلاً: ساده و صمیمی، اما حرفه‌ای؛ بدون اغراق', help: 'Voice شخصیت ثابت برند است و Tone لحن هر موقعیت. اینجا درباره نوع صحبت کردن روزمره برند تصمیم می‌گیریم؛ AI بعداً این پاسخ را دقیق‌تر به Voice و Tone تبدیل می‌کند.', options: ['ساده و قابل‌فهم', 'صمیمی و دوستانه', 'حرفه‌ای و متخصص', 'مقتدر و مرجع', 'پرانرژی و هیجان‌انگیز', 'آرام و مطمئن'], mode: 'multi', required: true }
    ];
  }

  renderStartWizard() {
    const gate = document.getElementById('startApiGate');
    const wizard = document.getElementById('startWizard');
    const completed = document.getElementById('startCompleted');
    if (!gate || !wizard || !completed) return;

    const configured = apiGateway.isConfigured();
    gate.hidden = configured;
    wizard.hidden = !configured;
    const active = store.getActiveBrand();
    const done = Boolean(active?.onboarding?.completed);
    completed.hidden = !(configured && done && !this.startAnswers._editing);

    if (!configured) return;
    if (done && !this.startAnswers._editing) {
      wizard.hidden = true;
      const name = active?.onboarding?.userName || '';
      const title = document.getElementById('startCompletedTitle');
      if (title) title.innerText = name ? `عالیه ${name}، پاسخ‌ها آماده‌اند.` : 'عالیه، پاسخ‌ها آماده‌اند.';
      return;
    }

    completed.hidden = true;
    wizard.hidden = false;
    this.renderStartStep();
  }

  startRestart() {
    if (!apiGateway.isConfigured()) {
      this.renderStartWizard();
      return;
    }
    const active = store.getActiveBrand();
    const saved = active?.onboarding?.answers || {};
    this.startAnswers = { ...saved, _editing: true };
    this.startStep = 0;
    this.renderStartStep();
  }

  renderStartStep() {
    const questions = this.getStartQuestions();
    const q = questions[this.startStep];
    if (!q) return;
    const answer = document.getElementById('startAnswer');
    const title = document.getElementById('startQuestionTitle');
    const hint = document.getElementById('startQuestionHint');
    const text = document.getElementById('startQuestionText');
    const example = document.getElementById('startQuestionExample');
    const helpText = document.getElementById('startHelpText');
    const optionsWrap = document.getElementById('startOptions');
    const progressText = document.getElementById('startProgressText');
    const progressBar = document.getElementById('startProgressBar');
    const back = document.getElementById('btnStartBack');
    const next = document.getElementById('btnStartNext');
    const analyze = document.getElementById('btnStartAnalyze');

    if (title) title.innerText = q.title;
    if (hint) hint.innerText = q.hint;
    if (text) text.innerText = q.question;
    if (example) example.innerText = q.example;
    if (helpText) helpText.innerText = q.help;
    if (progressText) progressText.innerText = `${this.toPersianNumber(this.startStep + 1)} از ${this.toPersianNumber(questions.length)}`;
    if (progressBar) progressBar.style.width = `${((this.startStep + 1) / questions.length) * 100}%`;
    if (answer) {
      answer.value = this.startAnswers[q.key] || '';
      answer.placeholder = q.example;
      answer.focus({ preventScroll: true });
    }
    if (optionsWrap) {
      optionsWrap.innerHTML = '';
      (q.options || []).forEach(option => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'start-option-chip';
        chip.innerText = option;
        chip.setAttribute('aria-pressed', this.isStartOptionSelected(option, q.mode));
        if (this.isStartOptionSelected(option, q.mode)) chip.classList.add('selected');
        chip.addEventListener('click', () => this.selectStartOption(option, q));
        optionsWrap.appendChild(chip);
      });
      optionsWrap.hidden = !(q.options && q.options.length);
    }
    if (back) back.disabled = this.startStep === 0;
    const last = this.startStep === questions.length - 1;
    if (next) next.hidden = last;
    if (analyze) analyze.hidden = !last;
  }

  isStartOptionSelected(option, mode = 'single') {
    const q = this.getStartQuestions()[this.startStep];
    const raw = String(this.startAnswers[q?.key] || '').trim();
    if (!raw) return false;
    if (mode === 'multi') return raw.split(/،|,/).map(v => v.trim()).includes(option);
    return raw === option;
  }

  selectStartOption(option, q) {
    const current = String(this.startAnswers[q.key] || '').trim();
    if (q.mode === 'multi') {
      let values = current ? current.split(/،|,/).map(v => v.trim()).filter(Boolean) : [];
      if (values.includes(option)) values = values.filter(v => v !== option);
      else values.push(option);
      this.startAnswers[q.key] = values.join('، ');
    } else {
      this.startAnswers[q.key] = option;
    }
    const answer = document.getElementById('startAnswer');
    if (answer) answer.value = this.startAnswers[q.key];
    this.renderStartStep();
    if (answer) { answer.focus({ preventScroll: true }); answer.setSelectionRange(answer.value.length, answer.value.length); }
  }

  startNextStep() {
    // ذخیره پاسخ فعلی قبل از رفتن به سؤال بعدی
    if (!this.collectStartAnswer()) return;

    const questions = this.getStartQuestions();
    if (this.startStep >= questions.length - 1) {
      this.analyzeStartAnswers();
      return;
    }

    this.startStep += 1;
    this.renderStartStep();
  }

  startPreviousStep() {
    // پاسخ فعلی را نگه می‌داریم، اما اعتبارسنجی اجباری نمی‌کنیم تا کاربر
    // بتواند آزادانه به سؤال قبلی برگردد.
    const q = this.getStartQuestions()[this.startStep];
    const value = document.getElementById('startAnswer')?.value.trim() || '';
    if (q) this.startAnswers[q.key] = value;

    if (this.startStep <= 0) return;
    this.startStep -= 1;
    this.renderStartStep();
  }

  collectStartAnswer() {
    const q = this.getStartQuestions()[this.startStep];
    const answer = document.getElementById('startAnswer')?.value.trim() || '';
    if (!answer) {
      this.toast(q.key === 'userName' ? 'اسم تو برای شروع لازم است.' : 'یک پاسخ انتخاب کن یا پاسخ خودت را تایپ کن.', 'error');
      document.getElementById('startAnswer')?.focus();
      return false;
    }
    this.startAnswers[q.key] = answer;
    return true;
  }

  async analyzeStartAnswers() {
    if (this.startAnalyzing) return;
    if (!apiGateway.isConfigured()) {
      this.toast('ابتدا API را در تنظیمات AI وصل کن.', 'error');
      this.renderStartWizard();
      return;
    }
    if (!this.collectStartAnswer()) return;

    const questions = this.getStartQuestions();
    const missing = questions.filter(q => !String(this.startAnswers[q.key] || '').trim());
    if (missing.length) {
      this.toast('هنوز همه پاسخ‌ها کامل نشده‌اند.', 'error');
      this.startStep = questions.findIndex(q => !String(this.startAnswers[q.key] || '').trim());
      this.renderStartStep();
      return;
    }

    const active = store.getActiveBrand();
    if (!active) return;
    this.startAnalyzing = true;
    const btn = document.getElementById('btnStartAnalyze');
    const original = btn?.innerText;
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> در حال تحلیل پاسخ‌ها…';
    }

    try {
      const answers = { ...this.startAnswers };
      delete answers._editing;
      const systemPrompt = `تو یک مشاور ارشد استراتژی برند و متخصص Brand DNA هستی.\n\nکاربر به سؤال‌های ساده درباره خودش، کسب‌وکار و مخاطبش پاسخ داده است. از همین پاسخ‌ها یک هویت برند واقعی، منسجم و قابل اجرا بساز. چیزی را بدون پشتوانه به عنوان واقعیت قطعی اضافه نکن؛ اگر لازم است از پاسخ‌ها استنباط حرفه‌ای داشته باشی، آن را به شکل یک پیشنهاد منطقی تبدیل کن. زبان خروجی فارسی روان، انسانی، دقیق و غیرکلیشه‌ای باشد. Voice و Tone را از هم تفکیک کن. خروجی فقط JSON معتبر باشد.\n\nساختار اجباری:\n{\n  "archetype":"", "mission":"", "vision":"", "values":"", "promise":"", "positioning":"", "usp":"",\n  "audience":{"description":"","painPoints":"","desires":""},\n  "voice":{"tone":"","traits":"","preferredWords":"","formality":""},\n  "kapferer":{"physique":"","personality":"","culture":"","relationship":"","reflection":"","selfImage":""},\n  "content":{"pillars":"","goals":""},\n  "bannedWords":""\n}`;
      const userPrompt = `پاسخ‌های مشاوره‌ای کاربر را تحلیل کن و بر اساس آن Brand DNA کامل بساز.\n\nنام کاربر: ${answers.userName}\nنام برند: ${answers.brandName}\nکار و فعالیت: ${answers.business}\nمخاطب: ${answers.audience}\nمشکل مخاطب: ${answers.problem}\nتفاوت برند: ${answers.difference}\nحس مطلوب برند: ${answers.feeling}\nهدف اصلی: ${answers.goal}\nلحن و موارد ممنوع: ${answers.tone}\n\nنکته مهم: نام برند باید دقیقاً همین «${answers.brandName}» باقی بماند و نام کاربر را با نام برند اشتباه نگیر.`;

      const result = await apiGateway.generateJSON({ systemPrompt, userPrompt, type: 'start_onboarding_dna', model: store.state.onboardingModel || 'gpt-4o-mini' });
      store._saveBrandSnapshot(active);
      const dna = { ...result, name: answers.brandName };
      store.updateBrandDna(active.id, dna, false);
      store.saveOnboarding(active.id, { completed: true, userName: answers.userName, answers, completedAt: new Date().toISOString() });
      store.addHistoryItem({ type: 'onboarding_dna', title: `شروع مشاوره‌ای ${answers.brandName}`, content: { answers, dna } });
      this.startAnswers = {};
      this.startStep = 0;
      this.renderActiveBrand();
      this.toast(`عالیه ${answers.userName}؛ هویت برند بر اساس پاسخ‌ها ساخته شد.`, 'success');
      this.switchView('brand-dna');
    } catch (err) {
      this.toast(err.message || 'تحلیل پاسخ‌ها انجام نشد.', 'error');
    } finally {
      this.startAnalyzing = false;
      if (btn) {
        btn.disabled = false;
        btn.innerText = original || 'تحلیل پاسخ‌ها و ساخت هویت برند';
      }
    }
  }

  toPersianNumber(value) {
    return String(value).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
  }

  bindBrandSelector() {
    const select = document.getElementById('activeBrandSelect');
    if (!select) return;

    select.addEventListener('change', (e) => {
      store.setActiveBrand(e.target.value);
      this.renderActiveBrand();
      this.toast(`برند فعال تغییر کرد: ${store.getActiveBrand().name}`, 'info');
    });

    document.getElementById('btnNewBrand')?.addEventListener('click', () => {
      const name = prompt('نام برند جدید را وارد کنید:');
      if (name && name.trim()) {
        const b = store.createBrand(name.trim());
        this.renderActiveBrand();
        this.toast(`برند «${b.name}» ساخته شد`, 'success');
      }
    });

    document.getElementById('btnDeleteBrand')?.addEventListener('click', () => {
      const active = store.getActiveBrand();
      this.showConfirmModal(
        'حذف برند؟',
        `اطلاعات برند «${active.name}» به طور کامل حذف خواهد شد و قابل بازگردانی نیست.`,
        () => {
          try {
            store.deleteActiveBrand();
            this.renderActiveBrand();
            this.toast('برند حذف شد', 'info');
          } catch (err) {
            this.toast(err.message, 'error');
          }
        }
      );
    });
  }

  renderActiveBrand() {
    const select = document.getElementById('activeBrandSelect');
    if (!select) return;
    select.innerHTML = '';
    store.state.brands.forEach(b => {
      const opt = document.createElement('option');
      opt.value = b.id;
      opt.innerText = b.name;
      opt.selected = b.id === store.state.activeBrandId;
      select.appendChild(opt);
    });

    const active = store.getActiveBrand();
    this.populateBrandDnaFields(active);
    const badge = document.getElementById('activeBrandBadge');
    if (badge) badge.textContent = active?.name || 'انتخاب نشده';
    this.renderDashboard();
  }

  renderDashboard() {
    const active = store.getActiveBrand();
    if (!active) return;

    const health = store.calculateBrandHealth(active);
    const hbName = document.getElementById('healthBrandName');
    if (hbName) hbName.innerText = active.name;

    const hfCount = document.getElementById('healthFieldCount');
    if (hfCount) hfCount.innerText = `${health.count} از ${health.total} فیلد تکمیل شده`;

    const hpPercent = document.getElementById('healthPercent');
    if (hpPercent) hpPercent.innerText = `${health.percent}٪`;
    const focusHealth = document.getElementById('dashboardFocusHealth');
    if (focusHealth) focusHealth.innerText = `${health.percent}٪ تکمیل`;

    const dashBarVal = document.getElementById('dashBarHealthPercent');
    if (dashBarVal) {
      dashBarVal.textContent = '';
      dashBarVal.style.width = `${health.percent}%`;
      dashBarVal.setAttribute('aria-valuenow', String(health.percent));
      dashBarVal.setAttribute('aria-valuemin', '0');
      dashBarVal.setAttribute('aria-valuemax', '100');
    }

    const archPill = document.getElementById('dashArchetypePill');
    if (archPill) archPill.innerText = active.archetype || 'The Creator';

    const historyItems = store.getBrandHistory(active.id);
    const kpiHist = document.getElementById('kpiHistoryCount');
    if (kpiHist) kpiHist.innerText = historyItems.length.toString();

    const versions = store.getBrandVersions(active.id);
    const kpiVer = document.getElementById('kpiVersionsCount');
    if (kpiVer) kpiVer.innerText = versions.length.toString();

    const modelVal = store.state.selectedModel || 'GPT-4o';
    const gaugeText = document.getElementById('gaugeCenterValue');
    if (gaugeText) gaugeText.innerText = `${health.percent}٪`;
    const gaugeCircle = document.querySelector('.gauge-circle');
    if (gaugeCircle) gaugeCircle.style.setProperty('--gauge', `${health.percent}%`);

    const recentWrap = document.getElementById('dashboardRecentGrid');
    if (!recentWrap) return;
    const items = historyItems.slice(0, 3);
    recentWrap.innerHTML = '';

    if (items.length === 0) {
      recentWrap.innerHTML = `<div style="grid-column: 1 / -1; padding: 24px; text-align: center; color: var(--text-muted);">هنوز خروجی در حافظه محلی ذخیره نشده است.</div>`;
      return;
    }

    items.forEach(it => {
      const card = document.createElement('div');
      card.className = 'output-card-box';
      const snippet = typeof it.content === 'string' ? it.content : JSON.stringify(it.content);
      card.innerHTML = `
        <span class="seg-item seg-yellow" style="font-size: 10px; display: inline-block; margin-bottom: 8px;">${this.escapeHTML(this.formatTypeLabel(it.type))}</span>
        <div style="font-weight: 800; font-size: 14px; margin-bottom: 6px;">${this.escapeHTML(it.title || 'بدون عنوان')}</div>
        <div style="font-size: 12px; color: var(--text-muted); line-height: 1.5; height: 38px; overflow: hidden;">${this.escapeHTML(snippet)}</div>
        <button class="btn btn-secondary btn-sm btn-full" style="margin-top: 12px;">کپی متن</button>
      `;
      card.querySelector('button').addEventListener('click', () => {
        this.copyToClipboard(snippet);
        this.toast('متن محتوا کپی شد', 'success');
      });
      recentWrap.appendChild(card);
    });
  }

  formatTypeLabel(type) {
    const map = {
      'instagram': 'Instagram Caption',
      'youtube': 'YouTube Description',
      'story': 'Story Architecture',
      'dna_ai': 'Brand DNA Blueprint'
    };
    return map[type] || 'Unknown';
  }

  bindBrandDnaForm() {
    const form = document.getElementById('brandDnaForm');
    if (!form) return;
    const inputs = form.querySelectorAll('input, textarea');

    inputs.forEach(input => {
      input.addEventListener('input', () => {
        this.setSaveBadgeState('saving');
        clearTimeout(this.autosaveTimer);
        this.autosaveTimer = setTimeout(() => {
          this.saveBrandDnaFromUI(false);
        }, 900);
      });
    });

    document.getElementById('btnVersionHistory')?.addEventListener('click', () => {
      this.openVersionsModal();
    });

    document.getElementById('btnAiGenerateBrandDna')?.addEventListener('click', () => {
      this.handleGenerateFullBrandDna();
    });

    document.querySelectorAll('.btn-field-ai').forEach(btn => {
      btn.setAttribute('aria-label', 'پیشنهاد با هوش مصنوعی');
      btn.title = 'پیشنهاد با هوش مصنوعی';
      btn.addEventListener('click', () => {
        const fieldId = btn.dataset.field;
        this.handleQuickFieldAi(fieldId);
      });
    });
  }

  bindBrandDnaNavigation() {
    const form = document.getElementById('brandDnaForm');
    if (!form || form.dataset.enhanced === '1') return;
    form.dataset.enhanced = '1';
    const sections = [...form.querySelectorAll(':scope > .form-section')];
    if (!sections.length) return;

    const wrap = document.createElement('div');
    wrap.className = 'dna-workspace';
    const nav = document.createElement('aside');
    nav.className = 'dna-nav';
    nav.setAttribute('aria-label', 'بخش‌های هویت برند');
    nav.innerHTML = '<div class="dna-nav-title">ساختار Brand DNA<div class="dna-progress-line"><i></i></div></div>';
    const stage = document.createElement('div');
    stage.className = 'dna-stage';
    const labels = ['هسته برند', 'مخاطب هدف', 'Voice و Tone', 'منشور هویت', 'معماری محتوا'];
    sections.forEach((section, i) => {
      section.classList.add('dna-step-panel');
      section.dataset.dnaStep = String(i);
      const btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'dna-nav-btn'; btn.dataset.dnaStep = String(i);
      btn.innerHTML = `<span>${String(i+1).padStart(2,'0')}</span><b>${labels[i] || `بخش ${i+1}`}</b>`;
      btn.addEventListener('click', () => this.showDnaStep(i));
      nav.appendChild(btn);
      stage.appendChild(section);
    });
    const footer = document.createElement('div');
    footer.className = 'dna-step-footer';
    footer.innerHTML = '<button type="button" class="btn btn-light" data-dna-prev>بخش قبل</button><span class="muted-step-label"></span><button type="button" class="btn btn-dark" data-dna-next>بخش بعد</button>';
    stage.appendChild(footer);
    wrap.appendChild(nav); wrap.appendChild(stage);
    form.replaceWith(wrap);
    this.brandDnaWorkspace = wrap;
    footer.querySelector('[data-dna-prev]')?.addEventListener('click', () => this.showDnaStep(Math.max(0, (this.activeDnaStep || 0)-1)));
    footer.querySelector('[data-dna-next]')?.addEventListener('click', () => this.showDnaStep(Math.min(sections.length-1, (this.activeDnaStep || 0)+1)));
    this.showDnaStep(0);
  }

  showDnaStep(index) {
    const workspace = this.brandDnaWorkspace;
    if (!workspace) return;
    const sections = [...workspace.querySelectorAll('.dna-step-panel')];
    if (!sections.length) return;
    const i = Math.max(0, Math.min(index, sections.length - 1));
    this.activeDnaStep = i;
    sections.forEach((section, n) => section.classList.toggle('active', n === i));
    workspace.querySelectorAll('.dna-nav-btn').forEach((btn, n) => btn.classList.toggle('active', n === i));
    const progress = workspace.querySelector('.dna-progress-line i');
    if (progress) progress.style.width = `${((i+1)/sections.length)*100}%`;
    const label = workspace.querySelector('.muted-step-label');
    if (label) label.textContent = `مرحله ${i+1} از ${sections.length}`;
    const prev = workspace.querySelector('[data-dna-prev]');
    const next = workspace.querySelector('[data-dna-next]');
    if (prev) prev.disabled = i === 0;
    if (next) next.textContent = i === sections.length - 1 ? 'پایان' : 'بخش بعد';
    sections[i]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  bindMobileMore() {
    const btn = document.getElementById('btnMobileMore');
    const nav = document.querySelector('.topnav');
    btn?.addEventListener('click', () => {
      nav?.classList.toggle('mobile-visible');
    });
  }

  bindCommandPalette() {
    if (document.getElementById('commandPalette')) return;
    const palette = document.createElement('div');
    palette.id = 'commandPalette';
    palette.className = 'modal-backdrop';
    palette.hidden = true;
    palette.innerHTML = `<div class="modal command-palette" role="dialog" aria-modal="true" aria-labelledby="commandPaletteTitle"><div class="modal-head"><div><span class="eyebrow">COMMAND CENTER</span><h3 id="commandPaletteTitle">رفتن به…</h3></div><button class="icon-btn" type="button" data-cmd-close aria-label="بستن">×</button></div><input id="commandPaletteInput" type="search" placeholder="صفحه یا ابزار را جستجو کن…" autocomplete="off"><div id="commandPaletteList" class="command-list"></div></div>`;
    document.body.appendChild(palette);
    const items = [
      ['dashboard','داشبورد','نمای کلی و ادامه کار'], ['start','شروع','مشاور برند'], ['brand-dna','هویت برند','ویرایش Brand DNA'], ['instagram','اینستاگرام','تولید پست'], ['youtube','یوتیوب','تولید توضیحات'], ['stories','استوری','معماری استوری'], ['media','بازبینی','کنترل کیفیت'], ['history','تاریخچه','خروجی‌های قبلی'], ['ai-gateway','تنظیمات AI','اتصال و مدل‌ها']
    ];
    const list = palette.querySelector('#commandPaletteList');
    const input = palette.querySelector('#commandPaletteInput');
    const render = (q='') => {
      const rows = items.filter(x => `${x[1]} ${x[2]}`.includes(q.trim())).map(x => `<button type="button" class="command-row" data-cmd-view="${x[0]}"><b>${x[1]}</b><span>${x[2]}</span><kbd>Enter</kbd></button>`).join('');
      list.innerHTML = rows || '<div class="command-empty">نتیجه‌ای پیدا نشد.</div>';
      list.querySelectorAll('[data-cmd-view]').forEach(el => el.addEventListener('click', () => { palette.hidden=true; this.switchView(el.dataset.cmdView); }));
    };
    render();
    input.addEventListener('input', () => render(input.value));
    const close = () => { palette.hidden = true; };
    palette.querySelector('[data-cmd-close]').addEventListener('click', close);
    palette.addEventListener('click', e => { if (e.target === palette) close(); });
    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); palette.hidden=false; render(''); input.value=''; setTimeout(()=>input.focus(),0); }
      if (e.key === 'Escape' && !palette.hidden) close();
    });
  }

  populateBrandDnaFields(brand) {
    if (!brand) return;
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val || '';
    };

    setVal('dna_name', brand.name);
    setVal('dna_archetype', brand.archetype);
    setVal('dna_mission', brand.mission);
    setVal('dna_vision', brand.vision);
    setVal('dna_values', brand.values);
    setVal('dna_promise', brand.promise);
    setVal('dna_positioning', brand.positioning);
    setVal('dna_usp', brand.usp);
    setVal('dna_banned_words', brand.bannedWords);

    setVal('dna_aud_desc', brand.audience?.description);
    setVal('dna_aud_pain', brand.audience?.painPoints);
    setVal('dna_aud_desires', brand.audience?.desires);

    setVal('dna_tone', brand.voice?.tone);
    setVal('dna_formality', brand.voice?.formality);
    setVal('dna_voice_traits', brand.voice?.traits);
    setVal('dna_pref_words', brand.voice?.preferredWords);

    setVal('dna_kap_physique', brand.kapferer?.physique);
    setVal('dna_kap_personality', brand.kapferer?.personality);
    setVal('dna_kap_culture', brand.kapferer?.culture);
    setVal('dna_kap_relationship', brand.kapferer?.relationship);
    setVal('dna_kap_reflection', brand.kapferer?.reflection);
    setVal('dna_kap_self_image', brand.kapferer?.selfImage);

    setVal('dna_pillars', brand.content?.pillars);
    setVal('dna_goals', brand.content?.goals);

    this.setSaveBadgeState('saved');
  }

  saveBrandDnaFromUI(createSnapshot = false) {
    const active = store.getActiveBrand();
    if (!active) return;

    const getVal = (id) => (document.getElementById(id)?.value || '').trim();

    const updated = {
      name: getVal('dna_name') || active.name,
      archetype: getVal('dna_archetype'),
      mission: getVal('dna_mission'),
      vision: getVal('dna_vision'),
      values: getVal('dna_values'),
      promise: getVal('dna_promise'),
      positioning: getVal('dna_positioning'),
      usp: getVal('dna_usp'),
      bannedWords: getVal('dna_banned_words'),
      audience: {
        description: getVal('dna_aud_desc'),
        painPoints: getVal('dna_aud_pain'),
        desires: getVal('dna_aud_desires')
      },
      voice: {
        tone: getVal('dna_tone'),
        traits: getVal('dna_voice_traits'),
        preferredWords: getVal('dna_pref_words'),
        formality: getVal('dna_formality')
      },
      kapferer: {
        physique: getVal('dna_kap_physique'),
        personality: getVal('dna_kap_personality'),
        culture: getVal('dna_kap_culture'),
        relationship: getVal('dna_kap_relationship'),
        reflection: getVal('dna_kap_reflection'),
        selfImage: getVal('dna_kap_self_image')
      },
      content: {
        pillars: getVal('dna_pillars'),
        goals: getVal('dna_goals')
      }
    };

    store.updateBrandDna(active.id, updated, createSnapshot);
    this.setSaveBadgeState('saved');
    this.renderDashboard();
  }

  setSaveBadgeState(state) {
    const dnaBadge = document.getElementById('dnaSaveBadge');
    const dashBadge = document.getElementById('dashSaveState');
    if (state === 'saving') {
      if (dnaBadge) dnaBadge.innerText = 'در حال ذخیره…';
      if (dashBadge) dashBadge.innerText = 'در حال ذخیره…';
    } else {
      if (dnaBadge) dnaBadge.innerText = '✓ ذخیره شده';
      if (dashBadge) dashBadge.innerText = '✓ ذخیره شده';
    }
  }

  async handleGenerateFullBrandDna() {
    const active = store.getActiveBrand();
    const btn = document.getElementById('btnAiGenerateBrandDna');
    if (!btn) return;
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span> در حال تولید هویت…`;

    try {
      const systemPrompt = apiGateway.buildBrandSystemPrompt(active) + this.brandIntegrityInstruction(active);
      const userPrompt = `بر اساس داده‌های موجود برند «${active.name}»، یک Brand DNA کامل، عمیق و منسجم پیشنهاد کن.
داده‌های معتبر موجود را حفظ کن و برای فیلدهای خالی پیشنهادات استراتژیک ارائه بده.
خروجی باید صرفاً به فرمت JSON ساختاریافته به شکل زیر باشد:
{
  "archetype": "...",
  "mission": "...",
  "vision": "...",
  "values": "...",
  "promise": "...",
  "positioning": "...",
  "usp": "...",
  "audience": {
    "description": "...",
    "painPoints": "...",
    "desires": "..."
  },
  "voice": {
    "tone": "...",
    "traits": "...",
    "preferredWords": "...",
    "formality": "..."
  },
  "kapferer": {
    "physique": "...",
    "personality": "...",
    "culture": "...",
    "relationship": "...",
    "reflection": "...",
    "selfImage": "..."
  },
  "content": {
    "pillars": "...",
    "goals": "..."
  }
}`;

      const res = await apiGateway.generateJSON({ systemPrompt, userPrompt, type: 'dna_gen' });
      store._saveBrandSnapshot(active);
      store.updateBrandDna(active.id, res, false);
      this.populateBrandDnaFields(store.getActiveBrand());
      this.toast('هویت برند با موفقیت توسط هوش مصنوعی تکمیل شد', 'success');

      store.addHistoryItem({
        type: 'dna_ai',
        title: `تکمیل هویت برند ${active.name}`,
        content: res
      });
    } catch (err) {
      this.toast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerText = 'تولید کامل با AI';
    }
  }

  async handleQuickFieldAi(fieldId) {
    const fieldEl = document.getElementById(fieldId);
    if (!fieldEl) return;

    this.pendingFieldTarget = fieldEl;
    const label = fieldEl.previousElementSibling?.innerText || fieldId;
    const modal = document.getElementById('fieldAiModal');
    const resultBox = document.getElementById('fieldAiResultText');
    const applyBtn = document.getElementById('btnApplyFieldAi');

    resultBox.innerHTML = '<span class="spinner"></span> در حال نگارش پیشنهاد تخصصی حداکثر ۱۲۰ کلمه‌ای...';
    modal.classList.add('open');
    applyBtn.disabled = true;

    try {
      const active = store.getActiveBrand();
      const systemPrompt = apiGateway.buildBrandSystemPrompt(active) + this.brandIntegrityInstruction(active);
      const userPrompt = `برای فیلد «${label}» در برند «${active.name}» یک متن حرفه‌ای، متقن، دقیق و حداکثر ۱۲۰ کلمه‌ای پیشنهاد کن. بدون هیچ مقدمه یا موخره، فقط متن پیشنهادی را بنویس.`;

      const text = await apiGateway.generateCompletion({
        systemPrompt,
        userPrompt,
        temperature: 0.6,
        type: 'field_ai'
      });

      resultBox.innerText = text;
      applyBtn.disabled = false;
      this.pendingFieldAiText = text;
    } catch (err) {
      resultBox.innerText = 'خطا در دریافت پیشنهاد: ' + err.message;
    }
  }


  getBrandIntegrityAudit(data, brand) {
    const raw = JSON.stringify(data || '');
    const banned = String(brand?.bannedWords || '').split(/[،,\n]+/).map(v => v.trim()).filter(Boolean);
    const hits = banned.filter(word => word && raw.includes(word));
    const preferred = String(brand?.voice?.preferredWords || '').split(/[،,\n]+/).map(v => v.trim()).filter(Boolean);
    const preferredHits = preferred.filter(word => word && raw.includes(word));
    return {
      passed: hits.length === 0,
      bannedHits: hits,
      preferredHits,
      brandNamePresent: Boolean(brand?.name && raw.includes(brand.name)),
      checkedAt: new Date().toISOString()
    };
  }

  brandIntegrityInstruction(brand) {
    return `\n\nکنترل یکپارچگی هویت برند — اجباری:\n- نام برند: ${brand?.name || '-'}\n- Voice: ${brand?.voice?.traits || '-'}\n- Tone: ${brand?.voice?.tone || '-'}\n- میزان رسمیت: ${brand?.voice?.formality || '-'}\n- ارزش‌ها: ${brand?.values || '-'}\n- وعده: ${brand?.promise || '-'}\n- جایگاه: ${brand?.positioning || '-'}\n- ستون‌های محتوا: ${brand?.content?.pillars || '-'}\n- واژگان ترجیحی: ${brand?.voice?.preferredWords || '-'}\n- واژگان ممنوعه: ${brand?.bannedWords || '-'}\n\nقبل از تحویل خروجی، متن را با این Brand DNA تطبیق بده. اگر بین خواسته کاربر و هویت برند تعارض بود، خواسته کاربر را اجرا کن اما تعارض را در یک فیلد brandAlignmentNote توضیح بده. از واژگان ممنوعه استفاده نکن.`;
  }

  addBrandIntegrityToOutput(containerId, audit) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const box = document.createElement('div');
    box.className = 'brand-integrity-box';
    box.innerHTML = `<div class="brand-integrity-head"><strong>یکپارچگی با هویت برند</strong><span class="brand-integrity-badge ${audit.passed ? 'ok' : 'warn'}">${audit.passed ? '✓ هماهنگ' : '⚠ نیاز به بازبینی'}</span></div><small>${audit.passed ? 'خروجی با قواعد واژگانی Brand DNA بررسی شد.' : `واژگان ممنوع پیدا شد: ${this.escapeHTML(audit.bannedHits.join('، '))}`}${audit.preferredHits.length ? ` · ${audit.preferredHits.length} واژه ترجیحی نیز استفاده شده است.` : ''}</small>`;
    container.prepend(box);
  }



  bindInstagramGuides() {
    const maps = {
      ig_formula: {
        'AIDA': 'AIDA: توجه → علاقه → تمایل → اقدام. مناسب وقتی می‌خواهی مسیر تصمیم‌گیری مخاطب واضح و CTA‌محور باشد.',
        'PAS': 'PAS: مشکل → تشدید مسئله → راه‌حل. مناسب برای محتوای مسئله‌محور و نشان دادن ارزش راه‌حل.',
        'Storytelling': 'Storytelling: محتوا را به شکل روایت، تجربه یا مسیر تغییر می‌سازد؛ برای ارتباط احساسی و به‌یادماندنی مناسب است.',
        'Educational': 'Educational: اولویت با آموزش روشن و کاربردی است؛ مناسب ساخت اعتبار تخصصی و ارزش ذخیره‌کردنی.'
      },
      ig_goal: {
        'آگاهی از برند': 'هدف: شناخته‌شدن و تثبیت جایگاه برند؛ CTA بهتر است سبک و کم‌فشار باشد.',
        'تعامل': 'هدف: افزایش کامنت، ذخیره، اشتراک‌گذاری یا پاسخ؛ محتوا باید یک دلیل روشن برای مشارکت بدهد.',
        'لید': 'هدف: تبدیل مخاطب به سرنخ؛ CTA باید مسیر مشخصی مثل DM، فرم یا دریافت راهنما ایجاد کند.',
        'فروش': 'هدف: کمک به تصمیم خرید؛ مزیت، تناسب محصول و CTA باید روشن باشد و از ادعاهای غیرقابل‌اثبات پرهیز شود.'
      },
      ig_hook_style: {
        'چالشی': 'هوک چالشی با یک باور یا عادت رایج شروع می‌کند و مخاطب را وادار می‌کند مکث و فکر کند.',
        'کنجکاوی‌برانگیز': 'هوک کنجکاوی یک شکاف اطلاعاتی ایجاد می‌کند؛ نباید وعده‌ای بدهد که متن توان اثبات آن را ندارد.',
        'آموزشی': 'هوک آموزشی سریعاً می‌گوید مخاطب چه چیزی یاد می‌گیرد یا چه مشکلی را بهتر حل می‌کند.',
        'آماری': 'هوک آماری با عدد یا واقعیت قابل‌بررسی شروع می‌شود؛ عدد ساختگی تولید نکن و اگر منبع نداری از ادعای عددی قطعی پرهیز کن.'
      }
    };
    Object.entries(maps).forEach(([id, values]) => {
      const select = document.getElementById(id);
      const helpId = id === 'ig_formula' ? 'igFormulaHelp' : id === 'ig_goal' ? 'igGoalHelp' : 'igHookHelp';
      const help = document.getElementById(helpId);
      if (!select || !help) return;
      const update = () => { help.textContent = values[select.value] || ''; };
      select.addEventListener('change', update);
      update();
    });
  }

  bindGenerators() {
    // 1. INSTAGRAM
    const btnIg = document.getElementById('btnGenerateInstagram');
    btnIg?.addEventListener('click', async () => {
      const topic = document.getElementById('ig_topic').value.trim();
      if (!topic) {
        this.toast('موضوع پست اینستاگرام الزامی است', 'error');
        return;
      }

      const formula = document.getElementById('ig_formula').value;
      const goal = document.getElementById('ig_goal').value;
      const hookStyle = document.getElementById('ig_hook_style').value;
      const dmKeyword = document.getElementById('ig_dm_keyword').value.trim();
      const keywords = document.getElementById('ig_keywords').value.trim();

      btnIg.disabled = true;
      btnIg.innerHTML = '<span class="spinner"></span> در حال تولید محتوا…';

      try {
        const active = store.getActiveBrand();
        const systemPrompt = apiGateway.buildBrandSystemPrompt(active) + this.brandIntegrityInstruction(active);
        const userPrompt = `برای اینستاگرام محتوایی بر اساس مشخصات زیر تولید کن:
موضوع: ${topic}
فرمول کپشن: ${formula}
هدف پست: ${goal}
سبک هوک: ${hookStyle}
کلمه کلیدی دایرکت (DM): ${dmKeyword || 'تعیین نشده'}
کلمات کلیدی الزامی: ${keywords || 'ندارد'}

خروجی باید یک JSON معتبر باشد با ساختار دقیق:
{
  "hooks": ["هوک ۱", "هوک ۲", "هوک ۳"],
  "caption": "متن کامل کپشن با رعایت فاصله‌گذاری مناسب و لحن برند",
  "cta": "دعوت به اقدام پایانی",
  "dmMessage": "پیام خودکار پاسخی که پس از ارسال کلمه کلیدی در دایرکت به مخاطب فرستاده می‌شود"
}`;

        const data = await apiGateway.generateJSON({ systemPrompt, userPrompt, type: 'instagram' });
        this.renderInstagramOutput(data);
        this.addBrandIntegrityToOutput('igOutputContainer', this.getBrandIntegrityAudit(data, active));

        store.addHistoryItem({
          type: 'instagram',
          title: `پست اینستاگرام: ${topic}`,
          content: data
        });
        this.toast('محتوای اینستاگرام با موفقیت تولید شد', 'success');
      } catch (err) {
        this.toast(err.message, 'error');
      } finally {
        btnIg.disabled = false;
        btnIg.innerText = 'تولید محتوای اینستاگرام';
      }
    });

    // 2. YOUTUBE
    const btnYt = document.getElementById('btnGenerateYoutube');
    btnYt?.addEventListener('click', async () => {
      const title = document.getElementById('yt_title').value.trim();
      if (!title) {
        this.toast('عنوان اصلی ویدیوی یوتیوب الزامی است', 'error');
        return;
      }

      const summary = document.getElementById('yt_summary').value.trim();
      const timestamps = document.getElementById('yt_timestamps').value.trim();
      const keywords = document.getElementById('yt_keywords').value.trim();
      const hashtags = document.getElementById('yt_hashtags').value.trim();

      btnYt.disabled = true;
      btnYt.innerHTML = '<span class="spinner"></span> تولید سئو و توضیحات…';

      try {
        const active = store.getActiveBrand();
        const systemPrompt = apiGateway.buildBrandSystemPrompt(active) + this.brandIntegrityInstruction(active);
        const userPrompt = `برای ویدیوی یوتیوب یک دیسکریپشن حرفه‌ای و سئو شده تولید کن.
عنوان: ${title}
خلاصه محتوا: ${summary || 'مشخص نشده'}
تایم‌استمپ‌های واقعی کاربر:
${timestamps || 'کاربر تایم‌استمپی نداده است (تایم‌استمپ جعلی نساز)'}
کلمات کلیدی: ${keywords || '-'}
هشتگ‌ها: ${hashtags || '-'}

قانون مهم: اگر کاربر تایم‌استمپ نداده، آرایه timestamps را خالی بگذار. هرگز تایم‌استمپ خیالی تولید نکن.
خروجی باید یک JSON معتبر باشد با ساختار دقیق:
{
  "intro": "سه خط اول توضیحات که قبل از دکمه Show More نمایش داده می‌شود و مخاطب را جذب می‌کند",
  "timestamps": [
    { "time": "00:00", "title": "عنوان بخش" }
  ],
  "description": "متن کامل، مشروح و ساختاریافته توضیحات",
  "hashtags": ["#هشتگ۱", "#هشتگ۲"]
}`;

        const data = await apiGateway.generateJSON({ systemPrompt, userPrompt, type: 'youtube' });
        this.renderYoutubeOutput(data);
        this.addBrandIntegrityToOutput('ytOutputContainer', this.getBrandIntegrityAudit(data, active));

        store.addHistoryItem({
          type: 'youtube',
          title: `ویدیوی یوتیوب: ${title}`,
          content: data
        });
        this.toast('توضیحات یوتیوب تولید و آماده گردید', 'success');
      } catch (err) {
        this.toast(err.message, 'error');
      } finally {
        btnYt.disabled = false;
        btnYt.innerText = 'تولید توضیحات یوتیوب';
      }
    });

    // 3. STORY ARCHITECTURE
    const btnStory = document.getElementById('btnGenerateStory');
    btnStory?.addEventListener('click', async () => {
      const topic = document.getElementById('story_topic').value.trim();
      if (!topic) {
        this.toast('موضوع استوری الزامی است', 'error');
        return;
      }
      const slidesCount = document.getElementById('story_slides').value;
      const goal = document.getElementById('story_goal').value;

      btnStory.disabled = true;
      btnStory.innerHTML = '<span class="spinner"></span> طراحی زنجیره اسلایدها…';

      try {
        const active = store.getActiveBrand();
        const systemPrompt = apiGateway.buildBrandSystemPrompt(active) + this.brandIntegrityInstruction(active);
        const userPrompt = `معماری یک زنجیره استوری منسجم برای اینستاگرام طراحی کن.
موضوع: ${topic}
تعداد دقیق اسلایدها: ${slidesCount} اسلاید
هدف کمپین: ${goal}

قوانین حیاتی معماری استوری:
۱. اسلاید اول باید قطعا Pattern Interrupt (شکست الگو) باشد.
۲. اسلاید آخر باید قطعا یک CTA مستقیم و هماهنگ با هدف باشد.
۳. تعداد اسلایدها در خروجی باید دقیقا برابر با ${slidesCount} باشد.
۴. هر اسلاید باید هدف مشخص، متن دقیق، پیشنهاد المان بصری و ایده تعامل استیکری داشته باشد.

خروجی باید یک JSON معتبر باشد:
{
  "slides": [
    {
      "role": "نقش اسلاید (مثال: Pattern Interrupt / Problem / Proof / CTA)",
      "objective": "هدف رفتاری این اسلاید در ذهن مخاطب",
      "text": "متن نمایشی روی صفحه استوری",
      "visual": "توصیه بصری برای طراح یا تدوین‌گر",
      "interaction": "پیشنهاد استیکر یا اقدام تعاملی (Poll, Quiz, DM Slider...)"
    }
  ]
}`;

        const data = await apiGateway.generateJSON({ systemPrompt, userPrompt, type: 'story' });
        this.renderStoryOutput(data);
        this.addBrandIntegrityToOutput('storyOutputContainer', this.getBrandIntegrityAudit(data, active));

        store.addHistoryItem({
          type: 'story',
          title: `استوری: ${topic}`,
          content: data
        });
        this.toast('معماری استوری با موفقیت تدوین شد', 'success');
      } catch (err) {
        this.toast(err.message, 'error');
      } finally {
        btnStory.disabled = false;
        btnStory.innerText = 'تولید معماری استوری';
      }
    });
  }

  renderInstagramOutput(data) {
    const container = document.getElementById('igOutputContainer');
    const actions = document.getElementById('igOutputActions');
    if (!container) return;
    container.classList.remove('output-empty');
    container.classList.add('output-populated');
    if (actions) actions.style.display = 'flex';

    let hooksHtml = (data.hooks || []).map((h, i) => `
      <div class="hook-row">
        <span class="hook-num">#${i + 1}</span>
        <span>${this.escapeHTML(h)}</span>
      </div>
    `).join('');

    container.innerHTML = `
      <div class="output-card-box">
        <div class="output-label">HOOK ALTERNATIVES</div>
        ${hooksHtml}
      </div>
      <div class="output-card-box">
        <div class="output-label">CAPTION</div>
        <p style="white-space: pre-line;">${this.escapeHTML(data.caption || '')}</p>
      </div>
      <div class="output-card-box">
        <div class="output-label">CALL TO ACTION (CTA)</div>
        <p><strong>${this.escapeHTML(data.cta || '')}</strong></p>
      </div>
      <div class="output-card-box">
        <div class="output-label">DM AUTOMATION MESSAGE</div>
        <p style="direction: rtl; font-weight: 700; color: #8c6a08;">${this.escapeHTML(data.dmMessage || '')}</p>
      </div>
    `;

    const fullText = `=== HOOKS ===\n${(data.hooks || []).join('\n')}\n\n=== CAPTION ===\n${data.caption}\n\n=== CTA ===\n${data.cta}\n\n=== DM MESSAGE ===\n${data.dmMessage}`;

    document.getElementById('btnCopyIg').onclick = () => {
      this.copyToClipboard(fullText);
      this.toast('کل متن اینستاگرام در کلیپ‌بورد کپی شد', 'success');
    };

    document.getElementById('btnDownloadIg').onclick = () => {
      this.downloadTextFile(fullText, `instagram-${Date.now()}.txt`);
    };
  }

  renderYoutubeOutput(data) {
    const container = document.getElementById('ytOutputContainer');
    const actions = document.getElementById('ytOutputActions');
    if (!container) return;
    container.classList.remove('output-empty');
    container.classList.add('output-populated');
    if (actions) actions.style.display = 'flex';

    let timestampsHtml = (data.timestamps || []).map(t => `
      <div class="hook-row">
        <span style="font-weight: 800; color: #8c6a08;">${this.escapeHTML(t.time)}</span>
        <span style="direction: rtl;">${this.escapeHTML(t.title)}</span>
      </div>
    `).join('');

    container.innerHTML = `
      <div class="output-card-box">
        <div class="output-label">TOP 3 LINES (ABOVE THE FOLD)</div>
        <p style="white-space: pre-line;"><strong>${this.escapeHTML(data.intro || '')}</strong></p>
      </div>
      ${timestampsHtml ? `
        <div class="output-card-box">
          <div class="output-label">TIMESTAMPS</div>
          ${timestampsHtml}
        </div>
      ` : ''}
      <div class="output-card-box">
        <div class="output-label">FULL DESCRIPTION</div>
        <p style="white-space: pre-line;">${this.escapeHTML(data.description || '')}</p>
      </div>
      <div class="output-card-box">
        <div class="output-label">HASHTAGS</div>
        <p style="font-weight: 700; color: #8c6a08;">${(data.hashtags || []).map(h => this.escapeHTML(h)).join(' ')}</p>
      </div>
    `;

    const tsText = (data.timestamps || []).map(t => `${t.time} ${t.title}`).join('\n');
    const fullText = `${data.intro}\n\n${tsText ? tsText + '\n\n' : ''}${data.description}\n\n${(data.hashtags || []).join(' ')}`;

    document.getElementById('btnCopyYt').onclick = () => {
      this.copyToClipboard(fullText);
      this.toast('توضیحات کامل یوتیوب کپی شد', 'success');
    };

    document.getElementById('btnDownloadYt').onclick = () => {
      this.downloadTextFile(fullText, `youtube-desc-${Date.now()}.txt`);
    };
  }

  renderStoryOutput(data) {
    const container = document.getElementById('storyOutputContainer');
    const actions = document.getElementById('storyOutputActions');
    if (!container) return;
    container.classList.remove('output-empty');
    container.classList.add('output-populated');
    if (actions) actions.style.display = 'flex';

    const slides = data.slides || [];
    container.innerHTML = slides.map((s, idx) => `
      <div class="output-card-box">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <strong>اسلاید ${idx + 1}: ${this.escapeHTML(s.role || '')}</strong>
          <span class="seg-item seg-yellow" style="font-size: 11px;">${this.escapeHTML(s.objective || '')}</span>
        </div>
        <p style="font-size: 14px; font-weight: 700; margin-bottom: 8px;">${this.escapeHTML(s.text || '')}</p>
        <div class="form-grid-2">
          <small style="color: var(--text-muted);"><strong>پیشنهاد بصری:</strong> ${this.escapeHTML(s.visual || '')}</small>
          <small style="color: var(--text-muted);"><strong>المان تعاملی:</strong> ${this.escapeHTML(s.interaction || '')}</small>
        </div>
      </div>
    `).join('');

    const fullText = slides.map((s, i) => `[اسلاید ${i + 1} - ${s.role}]\nهدف: ${s.objective}\nمتن: ${s.text}\nطراحی: ${s.visual}\nتعامل: ${s.interaction}\n-------------------`).join('\n\n');

    document.getElementById('btnCopyStory').onclick = () => {
      this.copyToClipboard(fullText);
      this.toast('زنجیره اسلایدها در کلیپ‌بورد کپی شد', 'success');
    };

    document.getElementById('btnDownloadStory').onclick = () => {
      this.downloadTextFile(fullText, `story-arc-${Date.now()}.txt`);
    };
  }

  bindMediaChecklist() {
    const boxes = document.querySelectorAll('.ui-checkbox');
    boxes.forEach(box => {
      box.addEventListener('change', () => {
        const checkedCount = document.querySelectorAll('.ui-checkbox:checked').length;
        const total = boxes.length;
        const progressEl = document.getElementById('checklistProgressBadge');
        if (progressEl) progressEl.innerText = `${checkedCount}/${total}`;

        if (checkedCount === total) {
          this.toast('تمامی تاییدیه‌های بازبینی انسانی تکمیل شد. محتوا آماده انتشار است.', 'success');
        }
      });
    });
  }

  renderHistoryList() {
    const container = document.getElementById('historyListContainer');
    const active = store.getActiveBrand();
    if (!active || !container) return;

    const items = store.getBrandHistory(active.id);
    container.innerHTML = '';

    if (items.length === 0) {
      container.innerHTML = `<div class="bento-card" style="text-align: center; padding: 48px; color: var(--text-muted);">تاریخچه‌ای برای برند «${this.escapeHTML(active.name)}» ثبت نشده است.</div>`;
      return;
    }

    items.forEach(it => {
      const card = document.createElement('div');
      card.className = 'bento-card';
      card.style.marginBottom = '16px';
      const contentStr = typeof it.content === 'string' ? it.content : JSON.stringify(it.content, null, 2);
      const dateStr = new Date(it.createdAt).toLocaleString('fa-IR');

      card.innerHTML = `
        <div class="card-title-row">
          <div>
            <span class="seg-item seg-yellow" style="font-size: 11px; display: inline-block; margin-bottom: 6px;">${this.escapeHTML(this.formatTypeLabel(it.type))}</span>
            <strong style="margin-right: 8px; font-size: 14px;">${this.escapeHTML(it.title || 'خروجی بدون عنوان')}</strong>
          </div>
          <span style="font-size: 12px; color: var(--text-muted);">${dateStr}</span>
        </div>
        <pre style="background: var(--surface-warm); padding: 14px; border-radius: var(--radius-md); max-height: 180px; overflow-y: auto; font-size: 12px; font-family: var(--font-mono); direction: ltr; white-space: pre-wrap;">${this.escapeHTML(contentStr)}</pre>
        <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 14px;">
          <button class="btn btn-secondary btn-sm btn-copy-hist">کپی محتوا</button>
          <button class="btn btn-secondary btn-sm btn-down-hist">دانلود</button>
        </div>
      `;

      card.querySelector('.btn-copy-hist').addEventListener('click', () => {
        this.copyToClipboard(contentStr);
        this.toast('محتوا کپی شد', 'success');
      });

      card.querySelector('.btn-down-hist').addEventListener('click', () => {
        this.downloadTextFile(contentStr, `${it.type}-${it.id}.txt`);
      });

      container.appendChild(card);
    });

    document.getElementById('btnClearHistory').onclick = () => {
      this.showConfirmModal(
        'پاک‌سازی تاریخچه برند؟',
        `تمام خروجی‌های آرشیو شده برند «${active.name}» پاک خواهد شد.`,
        () => {
          store.clearBrandHistory(active.id);
          this.renderHistoryList();
          this.renderDashboard();
          this.toast('تاریخچه برند پاک‌سازی شد', 'info');
        }
      );
    };
  }


  bindSectionGuide() {
    const modal = document.getElementById('sectionGuideModal');
    const title = document.getElementById('sectionGuideTitle');
    const text = document.getElementById('sectionGuideText');
    const open = () => {
      const active = document.querySelector('.view-panel.active');
      const key = active?.id?.replace('view-', '') || 'dashboard';
      const guides = {
        dashboard: ['داشبورد', 'داشبورد نمای مدیریتی We Studio است؛ اینجا می‌توانی وضعیت هویت برند، سلامت Brand DNA، تعداد خروجی‌ها و نسخه‌های ذخیره‌شده را یک‌جا ببینی و از میانبرهای شروع سریع مستقیماً وارد موتور تولید محتوا یا بازبینی شوی. داشبورد برای مشاهده و تصمیم‌گیری سریع طراحی شده و تغییرات اصلی هویت برند را باید در بخش‌های تخصصی همان قابلیت انجام دهی.'],
        start: ['شروع', 'در این بخش مثل یک مشاور قدم‌به‌قدم با چند سؤال ساده درباره نام خودت، برند، کسب‌وکار، مخاطب، مشکل، تفاوت، احساس و هدف برند جلو می‌روی؛ پاسخ‌های پیشنهادی برای سرعت بیشتر هستند و همیشه می‌توانی پاسخ شخصی خودت را تایپ و ویرایش کنی. بعد از تکمیل همه پاسخ‌ها، هوش مصنوعی آنها را تحلیل می‌کند و نتیجه را به هویت برند منتقل می‌کند تا بتوانی آن را بررسی و اصلاح کنی.'],
        'brand-dna': ['هویت برند', 'این بخش مرکز اصلی Brand DNA است و اطلاعاتی مثل مأموریت، چشم‌انداز، ارزش‌ها، وعده، جایگاه، مزیت متمایز، مخاطب، Voice، Tone، واژگان ترجیحی و ممنوعه و مدل هویت کاپفرر را نگهداری می‌کند. موتورهای تولید محتوا از همین اطلاعات به‌عنوان مرجع اصلی برند استفاده می‌کنند؛ بنابراین هر تغییری که اینجا انجام می‌دهی مستقیماً روی خروجی‌های بعدی اثر می‌گذارد.'],
        instagram: ['Instagram Engine', 'در این بخش موضوع و مشخصات محتوای اینستاگرام را تعیین می‌کنی و موتور تولید، هوک، کپشن، CTA و در صورت نیاز پیام DM را بر اساس Brand DNA می‌سازد. فرمول‌هایی مثل AIDA و PAS فقط ساختار تولید را مشخص می‌کنند و شخصیت، لحن، ارزش‌ها و واژگان برند از هویت برند فعال گرفته می‌شوند؛ قبل از انتشار خروجی را از نظر صحت، خوانایی و هماهنگی با برند بازبینی کن.'],
        youtube: ['YouTube Engine', 'این بخش برای ساخت توضیحات ویدیوی یوتیوب است؛ عنوان، خلاصه، تایم‌استمپ‌های واقعی، کلمات کلیدی و هشتگ‌ها را وارد می‌کنی و خروجی با ساختار قابل انتشار و هماهنگ با Brand DNA ساخته می‌شود. اگر تایم‌استمپ واقعی نداری، آن را خالی بگذار تا زمان جعلی تولید نشود و قبل از انتشار ادعاها و اطلاعات را بررسی کن.'],
        stories: ['Story Architecture', 'در این بخش یک زنجیره استوری هدفمند می‌سازی؛ موضوع، تعداد اسلاید و هدف کمپین را تعیین می‌کنی و AI برای هر اسلاید نقش، هدف، متن، پیشنهاد بصری و تعامل را طراحی می‌کند. ساختار استوری باید با هدف انتخاب‌شده و هویت برند هماهنگ باشد و اسلاید پایانی CTA داشته باشد؛ خروجی را قبل از انتشار با چک‌لیست بازبینی کنترل کن.'],
        media: ['بازبینی قبل از انتشار', 'این بخش جایگزین قضاوت انسانی نیست و برای کنترل کیفیت خروجی‌های AI ساخته شده است؛ هماهنگی با Brand DNA، صحت ادعاها، لحن و واژگان، CTA، خوانایی موبایل، تصویر و مدیا، لینک‌ها و تأیید نهایی را بررسی کن و فقط وقتی همه موارد لازم کنترل شدند محتوا را منتشر کن.'],
        history: ['تاریخچه', 'تاریخچه خروجی‌های تولیدشده و نسخه‌های قابل پیگیری برند را نشان می‌دهد تا بتوانی خروجی‌های قبلی را مرور، مقایسه یا پاک‌سازی کنی. نگهداری تاریخچه به حافظه محلی افزونه وابسته است، بنابراین برای انتقال یا پشتیبان‌گیری بین محیط‌ها از خروجی پشتیبان در تنظیمات AI استفاده کن.'],
        'ai-gateway': ['تنظیمات AI Gateway', 'در این بخش اتصال سرویس هوش مصنوعی را تنظیم می‌کنی؛ Base URL، کلید API و مدل‌های مورد استفاده را مشخص می‌کنی و در صورت پشتیبانی Gateway می‌توانی فهرست مدل‌ها را دریافت و مدل تولید محتوا و مدل مشاوره شروع را جداگانه انتخاب کنی. بعد از ذخیره، اتصال را تست کن و مطمئن شو مدل انتخابی توسط سرویس واقعاً پشتیبانی می‌شود. کلید API را فقط در محیط مورد اعتماد نگهداری کن و برای انتقال تنظیمات از پشتیبان‌گیری استفاده کن.']
      };
      const guide = guides[key] || guides.dashboard;
      if (title) title.textContent = guide[0];
      if (text) text.textContent = guide[1];
      if (modal) { modal.hidden = false; modal.setAttribute('aria-hidden','false'); document.getElementById('btnCloseSectionGuide')?.focus(); }
    };
    document.getElementById('btnSectionGuide')?.addEventListener('click', open);
    const close = () => { if (modal) { modal.hidden = true; modal.setAttribute('aria-hidden','true'); } };
    document.getElementById('btnCloseSectionGuide')?.addEventListener('click', close);
    modal?.querySelectorAll('[data-guide-close]').forEach(el => el.addEventListener('click', close));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && modal && !modal.hidden) close(); });
  }

  bindAiGateway() {
    const gwMode = document.getElementById('gw_mode');
    const gwUrl = document.getElementById('gw_base_url');
    const gwKey = document.getElementById('gw_api_key');
    const gwModel = document.getElementById('gw_model');

    if (!gwMode || !gwUrl || !gwKey || !gwModel) return;

    gwMode.value = store.state.gatewayMode || 'direct';
    gwUrl.value = store.state.apiBaseUrl || 'https://api.gapgpt.app/v1';
    gwKey.value = store.getApiKey();
    gwModel.value = store.state.selectedModel || 'gpt-4o';

    document.getElementById('btnToggleApiKey')?.addEventListener('click', () => {
      gwKey.type = gwKey.type === 'password' ? 'text' : 'password';
    });

    document.getElementById('btnSaveGateway')?.addEventListener('click', async () => {
      try {
        const safeUrl = store.validateApiBaseUrl(gwUrl.value.trim());
        if (gwMode.value !== 'direct') throw new Error('حالت اتصال انتخاب‌شده پشتیبانی نمی‌شود.');
        store.state.gatewayMode = 'direct';
        store.state.apiBaseUrl = safeUrl;
        const modelSelect = document.getElementById('gw_model_select');
        const onboardingSelect = document.getElementById('gw_onboarding_model');
        store.state.selectedModel = (modelSelect?.value || gwModel.value || '').trim() || 'gpt-5.6-luna';
        store.state.onboardingModel = (onboardingSelect?.value || store.state.onboardingModel || 'gpt-5.6-luna').trim();
        if (gwModel) gwModel.value = store.state.selectedModel;
        await store.setApiKey(gwKey.value);
        this.toast('تنظیمات Gateway با موفقیت ذخیره شد', 'success');
        this.checkApiStatusSilent();
      } catch (err) {
        this.toast(err.message || 'تنظیمات Gateway معتبر نیست.', 'error');
      }
    });

    document.getElementById('btnTestConnection')?.addEventListener('click', async () => {
      const btn = document.getElementById('btnTestConnection');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> بررسی…';

      try {
        await apiGateway.testConnection();
        this.setApiStatusPill('connected', 'متصل به مدل');
        this.toast('ارتباط با سرویس هوش مصنوعی برقرار است', 'success');
      } catch (err) {
        this.setApiStatusPill('error', 'خطای اتصال');
        this.toast(err.message, 'error');
      } finally {
        btn.disabled = false;
        btn.innerText = 'تست ارتباط API';
      }
    });

    document.getElementById('btnExportData')?.addEventListener('click', () => {
      const json = store.exportBackup();
      this.downloadTextFile(json, 'we-studio-backup.json');
      this.toast('فایل we-studio-backup.json با موفقیت دانلود شد', 'success');
    });

    document.getElementById('importFileInput')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          store.importBackup(ev.target.result);
          this.renderActiveBrand();
          this.toast('داده‌های پشتیبان با موفقیت بازیابی شدند', 'success');
        } catch (err) {
          this.toast(err.message, 'error');
        }
      };
      reader.readAsText(file);
    });
  }


  bindModelCatalog() {
    const refresh = document.getElementById('btnRefreshModels');
    const main = document.getElementById('gw_model_select');
    const onboarding = document.getElementById('gw_onboarding_model');
    const manual = document.getElementById('gw_model');
    const setOptions = (models) => {
      store.state.availableModels = models;
      const desired = [store.state.selectedModel, store.state.onboardingModel];
      [main, onboarding].forEach((select, index) => {
        if (!select) return;
        select.innerHTML = models.map(id => `<option value="${this.escapeHTML(id)}">${this.escapeHTML(id)}</option>`).join('');
        const wanted = desired[index];
        if (wanted && models.includes(wanted)) select.value = wanted;
      });
      if (manual) manual.value = store.state.selectedModel || manual.value;
      this.updateModelCatalogStatus(`${models.length} مدل از سرویس دریافت شد`);
    };
    refresh?.addEventListener('click', async () => {
      refresh.disabled = true; refresh.innerHTML = '<span class="spinner"></span> دریافت…';
      try {
        const models = await apiGateway.listModels();
        if (!models.length) throw new Error('سرویس فهرست مدل قابل انتخابی برنگرداند.');
        setOptions(models);
        this.toast('فهرست مدل‌ها به‌روزرسانی شد', 'success');
      } catch (err) {
        this.updateModelCatalogStatus(err.message || 'دریافت مدل‌ها ناموفق بود');
        this.toast(err.message, 'error');
      } finally {
        refresh.disabled = false; refresh.innerText = 'دریافت فهرست مدل‌ها';
      }
    });
    main?.addEventListener('change', () => {
      store.state.selectedModel = main.value;
      if (manual) manual.value = main.value;
    });
    onboarding?.addEventListener('change', () => { store.state.onboardingModel = onboarding.value; });
    const initial = store.state.availableModels || [];
    if (initial.length) setOptions(initial);
    else if (main) {
      const defaults = [store.state.selectedModel || 'gpt-5.6-luna', store.state.onboardingModel || 'gpt-5.6-luna'];
      setOptions([...new Set(defaults)]);
    }
  }

  updateModelCatalogStatus(text) {
    const el = document.getElementById('modelCatalogStatus');
    if (el) el.innerText = text;
  }


  async checkApiStatusSilent() {
    if (!store.hasApiKey()) {
      this.setApiStatusPill('error', 'کلید API ثبت نشده');
      return;
    }
    try {
      await apiGateway.testConnection();
      this.setApiStatusPill('connected', store.state.selectedModel || 'GPT-4o');
    } catch (e) {
      this.setApiStatusPill('error', 'عدم اتصال API');
    }
  }

  setApiStatusPill(status, text) {
    const pill = document.getElementById('apiStatusBadge');
    if (pill) pill.className = `api-pill ${status}`;
    const label = document.getElementById('apiStatusText');
    if (label) label.innerText = text;
  }

  bindModals() {
    const confirmModal = document.getElementById('confirmModal');
    document.getElementById('confirmModalCancel').onclick = () => {
      confirmModal.classList.remove('open');
    };

    document.getElementById('btnCloseVersionsModal').onclick = () => {
      document.getElementById('versionsModal').classList.remove('open');
    };

    document.getElementById('btnCloseShortcutsModal').onclick = () => {
      document.getElementById('shortcutsModal').classList.remove('open');
    };

    document.getElementById('btnCloseFieldAiModal').onclick = () => {
      document.getElementById('fieldAiModal').classList.remove('open');
    };
    document.getElementById('btnCancelFieldAi').onclick = () => {
      document.getElementById('fieldAiModal').classList.remove('open');
    };
    document.getElementById('btnApplyFieldAi').onclick = () => {
      if (this.pendingFieldTarget && this.pendingFieldAiText) {
        this.pendingFieldTarget.value = this.pendingFieldAiText;
        this.pendingFieldTarget.dispatchEvent(new Event('input'));
        this.toast('پیشنهاد هوش مصنوعی در فیلد اعمال شد', 'success');
      }
      document.getElementById('fieldAiModal').classList.remove('open');
    };
  }

  showConfirmModal(title, text, onConfirm) {
    const modal = document.getElementById('confirmModal');
    document.getElementById('confirmModalTitle').innerText = title;
    document.getElementById('confirmModalText').innerText = text;
    modal.classList.add('open');

    const okBtn = document.getElementById('confirmModalOk');
    okBtn.onclick = () => {
      modal.classList.remove('open');
      if (onConfirm) onConfirm();
    };
  }

  openVersionsModal() {
    const active = store.getActiveBrand();
    const versions = store.getBrandVersions(active.id);
    const wrap = document.getElementById('versionsList');
    wrap.innerHTML = '';

    if (versions.length === 0) {
      wrap.innerHTML = '<p style="color: var(--text-muted); padding: 16px 0;">هنوز نسخه‌ای ذخیره نشده است.</p>';
    } else {
      versions.forEach((ver, index) => {
        const item = document.createElement('div');
        item.className = 'bento-card';
        item.style.marginBottom = '10px';
        const date = new Date(ver.createdAt).toLocaleString('fa-IR');
        item.innerHTML = `
          <div class="card-title-row" style="margin-bottom: 8px;">
            <div>
              <strong>نسخه ${versions.length - index}</strong>
              <small style="color: var(--text-muted); margin-right: 8px;">${date}</small>
            </div>
            <button class="btn btn-secondary btn-sm btn-restore">بازگردانی</button>
          </div>
          <small style="color: var(--text-muted);">ماموریت: ${this.escapeHTML((ver.data.mission || '').substring(0, 70))}...</small>
        `;
        item.querySelector('.btn-restore').onclick = () => {
          this.showConfirmModal(
            'بازگردانی نسخه؟',
            `هویت برند به وضعیت تاریخ ${date} بازگردانده می‌شود.`,
            () => {
              store.restoreBrandVersion(active.id, ver.id);
              this.populateBrandDnaFields(store.getActiveBrand());
              document.getElementById('versionsModal').classList.remove('open');
              this.toast('نسخه با موفقیت بازیابی شد', 'success');
            }
          );
        };
        wrap.appendChild(item);
      });
    }

    document.getElementById('versionsModal').classList.add('open');
  }


  bindKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-backdrop.open').forEach(m => m.classList.remove('open'));
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        this.saveBrandDnaFromUI(true);
        this.toast('Brand DNA ذخیره و Snapshot جدید ثبت شد', 'success');
      }

      if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        document.getElementById('shortcutsModal').classList.add('open');
      }
    });
  }

  copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
  }

  downloadTextFile(content, filename) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  escapeHTML(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[&<>'"]/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  }
}

const app = new AppController();
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});