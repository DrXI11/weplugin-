const STORAGE_KEY_DEFAULT = {
  brands: [],
  activeBrandId: null,
  selectedModel: 'gpt-4o',
  onboardingModel: 'gpt-4o-mini',
  availableModels: [],
  apiBaseUrl: 'https://api.gapgpt.app/v1',
  gatewayMode: 'direct',
  history: [],
  brandVersions: {}
};

const PERSISTED_KEYS = [
  'brands', 'activeBrandId', 'selectedModel', 'onboardingModel',
  'availableModels', 'apiBaseUrl', 'gatewayMode', 'history', 'brandVersions'
];
const API_SECRET_KEY = 'gapGptApiKey';
const TRUSTED_API_HOSTS = new Set(['api.gapgpt.app']);
const MAX_BACKUP_BYTES = 2 * 1024 * 1024;
const MAX_BRANDS = 100;
const MAX_HISTORY = 100;
const MAX_VERSIONS_PER_BRAND = 20;
const FORBIDDEN_OBJECT_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

const BRAND_FIELDS = {
  id: 'string', name: 'string', archetype: 'string', mission: 'string', vision: 'string',
  values: 'string', promise: 'string', positioning: 'string', usp: 'string', bannedWords: 'string',
  audience: 'object', voice: 'object', kapferer: 'object', content: 'object', onboarding: 'object'
};
const NESTED_STRING_FIELDS = {
  audience: ['description', 'painPoints', 'desires'],
  voice: ['tone', 'traits', 'preferredWords', 'formality'],
  kapferer: ['physique', 'personality', 'culture', 'relationship', 'reflection', 'selfImage'],
  content: ['pillars', 'goals']
};

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function boundedString(value, max = 20000, field = 'field') {
  if (typeof value !== 'string') throw new Error(`فیلد ${field} باید متنی باشد.`);
  if (value.length > max) throw new Error(`فیلد ${field} بیش از حد طولانی است.`);
  return value;
}

function sanitizeJson(value, depth = 0) {
  if (depth > 8) throw new Error('ساختار داده بیش از حد عمیق است.');
  if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) {
    if (value.length > 1000) throw new Error('آرایه داده بیش از حد بزرگ است.');
    return value.map(item => sanitizeJson(item, depth + 1));
  }
  if (isPlainObject(value)) {
    const keys = Object.keys(value);
    if (keys.length > 100) throw new Error('شیء داده بیش از حد بزرگ است.');
    const out = {};
    for (const key of keys) {
      if (FORBIDDEN_OBJECT_KEYS.has(key)) throw new Error('کلید شیء غیرمجاز است.');
      if (key.length > 100) throw new Error('نام فیلد بیش از حد طولانی است.');
      out[key] = sanitizeJson(value[key], depth + 1);
    }
    return out;
  }
  throw new Error('نوع داده پشتیبانی نمی‌شود.');
}

function sanitizeNestedObject(value, fields, section) {
  if (!isPlainObject(value)) throw new Error(`بخش ${section} باید یک شیء معتبر باشد.`);
  const out = {};
  for (const field of fields) {
    const v = value[field];
    if (v !== undefined) out[field] = boundedString(v, 20000, `${section}.${field}`);
    else out[field] = '';
  }
  return out;
}

function sanitizeBrand(raw) {
  if (!isPlainObject(raw)) throw new Error('هر برند باید یک شیء معتبر باشد.');
  for (const key of Object.keys(raw)) {
    if (!(key in BRAND_FIELDS)) throw new Error(`فیلد غیرمجاز در برند: ${key}`);
  }
  const brand = {};
  for (const [key, type] of Object.entries(BRAND_FIELDS)) {
    const value = raw[key];
    if (value === undefined) {
      if (type === 'string') brand[key] = '';
      else if (key === 'audience') brand[key] = sanitizeNestedObject({}, NESTED_STRING_FIELDS.audience, key);
      else if (key === 'voice') brand[key] = sanitizeNestedObject({}, NESTED_STRING_FIELDS.voice, key);
      else if (key === 'kapferer') brand[key] = sanitizeNestedObject({}, NESTED_STRING_FIELDS.kapferer, key);
      else if (key === 'content') brand[key] = sanitizeNestedObject({}, NESTED_STRING_FIELDS.content, key);
      else brand[key] = { completed: false, userName: '', answers: {}, completedAt: null };
      continue;
    }
    if (type === 'string') brand[key] = boundedString(value, 20000, `brand.${key}`);
  }
  brand.audience = sanitizeNestedObject(raw.audience || {}, NESTED_STRING_FIELDS.audience, 'audience');
  brand.voice = sanitizeNestedObject(raw.voice || {}, NESTED_STRING_FIELDS.voice, 'voice');
  brand.kapferer = sanitizeNestedObject(raw.kapferer || {}, NESTED_STRING_FIELDS.kapferer, 'kapferer');
  brand.content = sanitizeNestedObject(raw.content || {}, NESTED_STRING_FIELDS.content, 'content');
  if (!isPlainObject(raw.onboarding || {})) throw new Error('فیلد brand.onboarding باید شیء باشد.');
  const ob = raw.onboarding || {};
  brand.onboarding = {
    completed: Boolean(ob.completed),
    userName: typeof ob.userName === 'string' ? boundedString(ob.userName, 500, 'onboarding.userName') : '',
    answers: sanitizeJson(ob.answers || {}, 0),
    completedAt: ob.completedAt == null ? null : boundedString(ob.completedAt, 100, 'onboarding.completedAt')
  };
  return brand;
}

function sanitizeHistory(raw) {
  if (!Array.isArray(raw)) throw new Error('history باید آرایه باشد.');
  if (raw.length > MAX_HISTORY) throw new Error('تاریخچه بیش از سقف مجاز است.');
  return raw.map((item) => {
    if (!isPlainObject(item)) throw new Error('آیتم تاریخچه نامعتبر است.');
    const out = {};
    for (const key of ['id','brandId','brandName','createdAt','type','title']) {
      if (item[key] !== undefined) out[key] = boundedString(item[key], 10000, `history.${key}`);
    }
    out.content = sanitizeJson(item.content ?? '', 0);
    return out;
  });
}

function sanitizeVersions(raw) {
  if (!isPlainObject(raw)) throw new Error('brandVersions باید شیء باشد.');
  const out = {};
  for (const [brandId, versions] of Object.entries(raw)) {
    if (FORBIDDEN_OBJECT_KEYS.has(brandId)) throw new Error('شناسه برند غیرمجاز است.');
    if (!Array.isArray(versions)) throw new Error('نسخه‌های برند باید آرایه باشند.');
    if (versions.length > MAX_VERSIONS_PER_BRAND) throw new Error('تعداد نسخه‌های یک برند بیش از سقف مجاز است.');
    out[brandId] = versions.map((version) => {
      if (!isPlainObject(version)) throw new Error('نسخه برند نامعتبر است.');
      return {
        id: boundedString(version.id || '', 200, 'version.id'),
        createdAt: boundedString(version.createdAt || '', 100, 'version.createdAt'),
        data: sanitizeBrand(version.data || {})
      };
    });
  }
  return out;
}

function sanitizeState(raw) {
  if (!isPlainObject(raw)) throw new Error('ساختار State معتبر نیست.');
  const brands = Array.isArray(raw.brands) ? raw.brands : [];
  if (brands.length > MAX_BRANDS) throw new Error('تعداد برندها بیش از سقف مجاز است.');
  const safe = { ...STORAGE_KEY_DEFAULT };
  safe.brands = brands.map(sanitizeBrand);
  safe.activeBrandId = raw.activeBrandId == null ? null : boundedString(raw.activeBrandId, 200, 'activeBrandId');
  safe.selectedModel = boundedString(raw.selectedModel ?? STORAGE_KEY_DEFAULT.selectedModel, 500, 'selectedModel');
  safe.onboardingModel = boundedString(raw.onboardingModel ?? STORAGE_KEY_DEFAULT.onboardingModel, 500, 'onboardingModel');
  if (!Array.isArray(raw.availableModels)) throw new Error('availableModels باید آرایه باشد.');
  if (raw.availableModels.length > 200) throw new Error('availableModels بیش از حد بزرگ است.');
  safe.availableModels = raw.availableModels.map((m) => boundedString(m, 500, 'availableModels.item'));
  safe.apiBaseUrl = validateApiBaseUrl(raw.apiBaseUrl ?? STORAGE_KEY_DEFAULT.apiBaseUrl);
  safe.gatewayMode = 'direct';
  safe.history = sanitizeHistory(raw.history || []);
  safe.brandVersions = sanitizeVersions(raw.brandVersions || {});
  return safe;
}

function validateApiBaseUrl(value) {
  if (typeof value !== 'string' || !value.trim()) throw new Error('Base URL الزامی است.');
  let parsed;
  try { parsed = new URL(value.trim()); } catch (_) { throw new Error('Base URL معتبر نیست.'); }
  if (parsed.protocol !== 'https:') throw new Error('Base URL فقط باید HTTPS باشد.');
  if (parsed.username || parsed.password) throw new Error('Base URL نباید شامل نام کاربری یا رمز عبور باشد.');
  if (parsed.port && parsed.port !== '443') throw new Error('پورت سفارشی در Base URL مجاز نیست.');
  if (!TRUSTED_API_HOSTS.has(parsed.hostname.toLowerCase())) {
    throw new Error('این Gateway در فهرست مقصدهای مورد اعتماد افزونه نیست.');
  }
  if (parsed.search || parsed.hash) throw new Error('Base URL نباید Query یا Fragment داشته باشد.');
  return parsed.toString().replace(/\/+$/, '');
}

class Store {
  constructor() {
    this.state = { ...STORAGE_KEY_DEFAULT };
    this.apiKey = '';
  }

  async init() {
    if (typeof chrome !== 'undefined' && chrome.storage?.session?.setAccessLevel) {
      try {
        await new Promise((resolve) => chrome.storage.session.setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' }, resolve));
      } catch (_) {}
    }
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      return new Promise((resolve) => {
        chrome.storage.local.get(null, async (data) => {
          const legacySecret = typeof data[API_SECRET_KEY] === 'string' ? data[API_SECRET_KEY].trim() : '';
          try {
            const safeInput = { ...data };
            delete safeInput[API_SECRET_KEY];
            this.state = sanitizeState({ ...STORAGE_KEY_DEFAULT, ...safeInput });
          } catch (_) {
            this.state = { ...STORAGE_KEY_DEFAULT };
          }
          this.apiKey = legacySecret;
          try {
            if (legacySecret && chrome.storage.session) {
              await new Promise(r => chrome.storage.session.set({ [API_SECRET_KEY]: legacySecret }, r));
            }
          } finally {
            // Remove legacy persisted secrets even when the imported state was malformed.
            await new Promise(r => chrome.storage.local.remove(API_SECRET_KEY, r));
          }
          if (!this.state.brands || this.state.brands.length === 0) this._seedInitialBrand();
          if (chrome.storage?.session) {
            chrome.storage.session.get([API_SECRET_KEY], (secret) => {
              this.apiKey = typeof secret?.[API_SECRET_KEY] === 'string' ? secret[API_SECRET_KEY].trim() : this.apiKey;
              resolve(this.state);
            });
          } else {
            resolve(this.state);
          }
        });
      });
    }

    try {
      const local = localStorage.getItem('we_studio_data');
      const parsed = local ? JSON.parse(local) : {};
      this.state = sanitizeState({ ...STORAGE_KEY_DEFAULT, ...parsed });
    } catch (_) {
      this.state = { ...STORAGE_KEY_DEFAULT };
    }
    if (!this.state.brands || this.state.brands.length === 0) this._seedInitialBrand();
    return this.state;
  }

  _seedInitialBrand() {
    const seed = {
      id: 'brand_' + Date.now(),
      name: 'برند نمونه سازمانی',
      archetype: 'The Creator',
      mission: 'ارائه چارچوب‌های نوآورانه محتوا برای رشد پایدار برندهای مدرن',
      vision: 'رهبری اکوسیستم تولید محتوای سازمان‌یافته با بالاترین استانداردهای استراتژیک',
      values: 'اصالت، شفافیت فنی، کمال‌گرایی در تحویل ارزش',
      promise: 'کیفیت پایدار و ثبات صدا در تمامی کانال‌ها',
      positioning: 'نقطه اتکای مدیران رشد در بازاریابی محتوا',
      usp: 'سیستم‌عامل هوشمند Brand-Native که محتوا را دقیقا در مختصات هویت برند می‌سازد',
      bannedWords: 'ارزان، بدون زحمت، تضمین ۱۰۰ درصدی، معجزه',
      audience: {
        description: 'استراتژیست‌های برند، معماران محصول و بنیان‌گذاران فناوری',
        painPoints: 'لحن‌های رباتیک و تکراری، اتلاف وقت در بازنویسی پرامپت‌ها',
        desires: 'سیستم‌سازی فرآیند انتشار محتوا با حفظ صدای اصیل'
      },
      voice: {
        tone: 'صریح، فاخر و بینش‌بخش',
        traits: 'معمارانه، تحلیلی، ساختاریافته',
        preferredWords: 'چارچوب، مقیاس‌پذیری، هویت پایدار، اثربخشی',
        formality: 'رسمی و متخصص'
      },
      kapferer: {
        physique: 'ظاهری تمیز، ماسه و کرم گرم با کانتراست بالا و لهجه زرد آفتابی',
        personality: 'معمار ارشد سیستم، متین و دقیق',
        culture: 'مهندسی عمیق با تمرکز بر داده و حقیقت برند',
        relationship: 'مشاور استراتژیک دائمی در هر کمپین',
        reflection: 'پیشگامان صنعت که به جزئیات اهمیت می‌دهند',
        selfImage: 'تسلط بی‌نقص بر معماری برند خود'
      },
      content: {
        pillars: 'هویت پایدار برند، بهینه‌سازی کانال‌ها، معماری هوش مصنوعی سازمانی',
        goals: 'تبدیل برند به مرجع بلامنازع صنعت و جذب ارتباطات کلیدی B2B'
      },
      onboarding: { completed: false, userName: '', answers: {}, completedAt: null }
    };
    this.state.brands = [seed];
    this.state.activeBrandId = seed.id;
    this.persist();
  }

  async persist() {
    const persistedState = {};
    for (const key of PERSISTED_KEYS) persistedState[key] = this.state[key];
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      await new Promise((resolve) => chrome.storage.local.set(persistedState, resolve));
      return true;
    }
    try { localStorage.setItem('we_studio_data', JSON.stringify(persistedState)); } catch (_) {}
    return true;
  }

  getApiKey() {
    return typeof this.apiKey === 'string' ? this.apiKey : '';
  }

  hasApiKey() {
    return Boolean(this.getApiKey().trim());
  }

  validateApiBaseUrl(value) {
    return validateApiBaseUrl(value);
  }

  async setApiKey(value) {
    const key = typeof value === 'string' ? value.trim() : '';
    if (key.length > 10000) throw new Error('کلید API بیش از حد طولانی است.');
    this.apiKey = key;
    if (typeof chrome !== 'undefined' && chrome.storage?.session) {
      if (key) await new Promise((resolve) => chrome.storage.session.set({ [API_SECRET_KEY]: key }, resolve));
      else await new Promise((resolve) => chrome.storage.session.remove(API_SECRET_KEY, resolve));
    }
    await this.persist();
  }

  getActiveBrand() {
    if (!this.state.brands || this.state.brands.length === 0) return null;
    return this.state.brands.find(b => b.id === this.state.activeBrandId) || this.state.brands[0];
  }

  setActiveBrand(brandId) {
    this.state.activeBrandId = brandId;
    this.persist();
  }

  createBrand(name = 'برند جدید') {
    const safeName = boundedString(String(name), 500, 'brand.name').trim() || 'برند جدید';
    const newBrand = {
      id: 'brand_' + Date.now(),
      name: safeName, archetype: '', mission: '', vision: '', values: '', promise: '', positioning: '', usp: '', bannedWords: '',
      audience: { description: '', painPoints: '', desires: '' },
      voice: { tone: '', traits: '', preferredWords: '', formality: '' },
      kapferer: { physique: '', personality: '', culture: '', relationship: '', reflection: '', selfImage: '' },
      content: { pillars: '', goals: '' },
      onboarding: { completed: false, userName: '', answers: {}, completedAt: null }
    };
    if (this.state.brands.length >= MAX_BRANDS) throw new Error('تعداد برندها به سقف مجاز رسیده است.');
    this.state.brands.push(newBrand);
    this.state.activeBrandId = newBrand.id;
    this.persist();
    return newBrand;
  }

  saveOnboarding(brandId, onboardingData) {
    const brand = this.state.brands.find(b => b.id === brandId);
    if (!brand) return null;
    brand.onboarding = {
      completed: Boolean(onboardingData?.completed),
      userName: typeof onboardingData?.userName === 'string' ? boundedString(onboardingData.userName, 500, 'onboarding.userName') : '',
      answers: sanitizeJson(onboardingData?.answers || {}, 0),
      completedAt: onboardingData?.completedAt || null
    };
    this.persist();
    return brand.onboarding;
  }

  deleteActiveBrand() {
    if (this.state.brands.length <= 1) throw new Error('حداقل یک برند باید در سیستم‌عامل باقی بماند.');
    const currentId = this.state.activeBrandId;
    this.state.brands = this.state.brands.filter(b => b.id !== currentId);
    this.state.activeBrandId = this.state.brands[0].id;
    this.state.history = (this.state.history || []).filter(h => h.brandId !== currentId);
    if (this.state.brandVersions) delete this.state.brandVersions[currentId];
    this.persist();
    return this.getActiveBrand();
  }

  updateBrandDna(brandId, updatedFields, createSnapshot = false) {
    const brand = this.state.brands.find(b => b.id === brandId);
    if (!brand || !isPlainObject(updatedFields)) return;
    if (createSnapshot) this._saveBrandSnapshot(brand);
    const payload = { ...updatedFields };
    for (const section of Object.keys(NESTED_STRING_FIELDS)) {
      if (payload[section]) {
        const safeSection = sanitizeNestedObject(payload[section], NESTED_STRING_FIELDS[section], section);
        brand[section] = { ...brand[section], ...safeSection };
        delete payload[section];
      }
    }
    for (const key of Object.keys(payload)) {
      if (key in BRAND_FIELDS && BRAND_FIELDS[key] === 'string') brand[key] = boundedString(String(payload[key] ?? ''), 20000, `brand.${key}`);
    }
    this.persist();
  }

  _saveBrandSnapshot(brand) {
    if (!this.state.brandVersions) this.state.brandVersions = {};
    if (!this.state.brandVersions[brand.id]) this.state.brandVersions[brand.id] = [];
    const versions = this.state.brandVersions[brand.id];
    const snapshot = { id: 'ver_' + Date.now(), createdAt: new Date().toISOString(), data: JSON.parse(JSON.stringify(sanitizeBrand(brand))) };
    versions.unshift(snapshot);
    if (versions.length > MAX_VERSIONS_PER_BRAND) versions.pop();
    this.persist();
  }

  getBrandVersions(brandId) { return this.state.brandVersions?.[brandId] || []; }

  restoreBrandVersion(brandId, versionId) {
    const versions = this.getBrandVersions(brandId);
    const ver = versions.find(v => v.id === versionId);
    if (!ver) throw new Error('نسخه مدنظر یافت نشد.');
    const index = this.state.brands.findIndex(b => b.id === brandId);
    if (index !== -1) {
      this._saveBrandSnapshot(this.state.brands[index]);
      this.state.brands[index] = sanitizeBrand(ver.data);
      this.persist();
      return this.state.brands[index];
    }
    return null;
  }

  calculateBrandHealth(brand) {
    if (!brand) return { count: 0, total: 24, percent: 0 };
    const fields = [brand.name, brand.archetype, brand.mission, brand.vision, brand.values, brand.promise, brand.positioning, brand.usp, brand.bannedWords, brand.audience?.description, brand.audience?.painPoints, brand.audience?.desires, brand.voice?.tone, brand.voice?.traits, brand.voice?.preferredWords, brand.voice?.formality, brand.kapferer?.physique, brand.kapferer?.personality, brand.kapferer?.culture, brand.kapferer?.relationship, brand.kapferer?.reflection, brand.kapferer?.selfImage, brand.content?.pillars, brand.content?.goals];
    const completed = fields.filter(val => typeof val === 'string' && val.trim().length > 0).length;
    const total = fields.length;
    return { count: completed, total, percent: Math.round((completed / total) * 100) };
  }

  addHistoryItem(item) {
    const active = this.getActiveBrand();
    if (!isPlainObject(item)) throw new Error('آیتم تاریخچه نامعتبر است.');
    const entry = { id: 'hist_' + Date.now(), brandId: active ? active.id : 'unknown', brandName: active ? active.name : 'Unknown Brand', createdAt: new Date().toISOString(), ...item };
    const safeEntry = {
      id: boundedString(entry.id, 200, 'history.id'),
      brandId: boundedString(entry.brandId, 200, 'history.brandId'),
      brandName: boundedString(entry.brandName, 500, 'history.brandName'),
      createdAt: boundedString(entry.createdAt, 100, 'history.createdAt'),
      type: boundedString(entry.type || 'general', 100, 'history.type'),
      title: boundedString(entry.title || '', 1000, 'history.title'),
      content: sanitizeJson(entry.content ?? '', 0)
    };
    if (!this.state.history) this.state.history = [];
    this.state.history.unshift(safeEntry);
    if (this.state.history.length > MAX_HISTORY) this.state.history.pop();
    this.persist();
    return safeEntry;
  }

  getBrandHistory(brandId) { return (this.state.history || []).filter(h => h.brandId === brandId); }
  clearBrandHistory(brandId) { if (!this.state.history) return; this.state.history = this.state.history.filter(h => h.brandId !== brandId); this.persist(); }

  exportBackup() {
    const exportState = {};
    for (const key of PERSISTED_KEYS) exportState[key] = this.state[key];
    const json = JSON.stringify(exportState, null, 2);
    if (new Blob([json]).size > MAX_BACKUP_BYTES) throw new Error('حجم فایل پشتیبان بیش از حد مجاز است.');
    return json;
  }

  importBackup(jsonString) {
    try {
      if (typeof jsonString !== 'string') throw new Error('محتوای پشتیبان متنی نیست.');
      if (new Blob([jsonString]).size > MAX_BACKUP_BYTES) throw new Error('حجم فایل پشتیبان بیش از حد مجاز است.');
      const parsed = JSON.parse(jsonString);
      if (!parsed.brands || !Array.isArray(parsed.brands) || parsed.brands.length === 0) throw new Error('فایل پشتیبان فاقد آرایه معتبر برندها است.');
      const safe = sanitizeState(parsed);
      // Never import or persist secrets. A legacy gapGptApiKey field is deliberately ignored.
      this.state = { ...STORAGE_KEY_DEFAULT, ...safe };
      this.persist();
      return true;
    } catch (e) {
      throw new Error('فایل برند معتبر نیست: ' + e.message);
    }
  }
}

export const store = new Store();
