import { store } from './store.js';

class ApiGateway {
  constructor() {
    this.lastRequestTimes = {};
    this.MIN_COOLDOWN_MS = 6000;
  }

  _checkRateLimit(type = 'general') {
    const now = Date.now();
    const lastTime = this.lastRequestTimes[type] || 0;
    const diff = now - lastTime;
    if (diff < this.MIN_COOLDOWN_MS) {
      const waitSec = Math.ceil((this.MIN_COOLDOWN_MS - diff) / 1000);
      throw new Error(`برای جلوگیری از درخواست‌های پشت‌سرهم، ${waitSec} ثانیه صبر کن.`);
    }
    this.lastRequestTimes[type] = now;
  }

  buildBrandSystemPrompt(brand) {
    if (!brand) return 'تو موتور هوش مصنوعی We Studio Enterprise هستی.';

    return `تو موتور محتوای حرفه‌ای We Studio Enterprise هستی.
خروجی فارسی حرفه‌ای، مهندسی‌شده، دقیق و کاملا اجرایی باشد.
قوانین تغییرناپذیر سیستم:
۱. Voice شخصیت ثابت برند و Tone لحن موقعیتی است؛ این دو را به هیچ عنوان ادغام نکن.
۲. داده‌های ناموجود را حدس قطعی نزن. اگر لازم است پیشنهادی بدهی، آن را با عبارت «پیشنهاد:» مشخص کن.
۳. تحت هیچ شرایطی از این واژگان ممنوعه استفاده نکن: [${brand.bannedWords || 'بدون واژه ممنوعه'}]
۴. Brand DNA منبع اصلی حقیقت برند است و باید تمام خروجی‌ها در مختصات آن خلق شوند.

=== کانتکست رسمی هویت برند (BRAND DNA) ===
• نام برند: ${brand.name || '-'}
• کهن‌الگو (Archetype): ${brand.archetype || '-'}
• ماموریت (Mission): ${brand.mission || '-'}
• چشم‌انداز (Vision): ${brand.vision || '-'}
• ارزش‌های محوری: ${brand.values || '-'}
• وعده برند: ${brand.promise || '-'}
• جایگاه‌یابی: ${brand.positioning || '-'}
• مزیت رقابتی / USP: ${brand.usp || '-'}

• مخاطب هدف: ${brand.audience?.description || '-'}
• دردهای مخاطب: ${brand.audience?.painPoints || '-'}
• خواسته‌های مخاطب: ${brand.audience?.desires || '-'}

• Voice (شخصیت ثابت): ${brand.voice?.traits || '-'}
• Tone (لحن موقعیتی): ${brand.voice?.tone || '-'}
• میزان رسمیت: ${brand.voice?.formality || '-'}
• واژگان ترجیحی: ${brand.voice?.preferredWords || '-'}

• منشور هویت کاپفرر:
  - کالبد (Physique): ${brand.kapferer?.physique || '-'}
  - شخصیت (Personality): ${brand.kapferer?.personality || '-'}
  - فرهنگ (Culture): ${brand.kapferer?.culture || '-'}
  - رابطه (Relationship): ${brand.kapferer?.relationship || '-'}
  - بازتاب (Reflection): ${brand.kapferer?.reflection || '-'}
  - تصویر ذهنی (Self-Image): ${brand.kapferer?.selfImage || '-'}

• ستون‌های محتوایی: ${brand.content?.pillars || '-'}
• اهداف محتوا: ${brand.content?.goals || '-'}`;
  }

  isConfigured() {
    const { gatewayMode } = store.state;
    return gatewayMode !== 'direct' || store.hasApiKey();
  }

  async listModels() {
    const { apiBaseUrl, gatewayMode } = store.state;
    const gapGptApiKey = store.getApiKey();
    if (gatewayMode === 'direct' && (!gapGptApiKey || !gapGptApiKey.trim())) {
      throw new Error('کلید API تنظیم نشده است. ابتدا API را وصل کن.');
    }
    const endpoint = `${store.validateApiBaseUrl(apiBaseUrl)}/models`;
    const headers = {};
    if (gapGptApiKey && gapGptApiKey.trim() !== '') headers['Authorization'] = `Bearer ${gapGptApiKey.trim()}`;
    let res;
    try {
      res = await fetch(endpoint, { method: 'GET', headers });
    } catch (networkError) {
      throw new Error('دریافت فهرست مدل‌ها ممکن نشد. Base URL و دسترسی سرویس را بررسی کن.');
    }
    if (!res.ok) this._handleHttpError(res.status);
    const data = await res.json();
    const models = Array.isArray(data?.data) ? data.data : (Array.isArray(data?.models) ? data.models : []);
    return models
      .map(m => typeof m === 'string' ? m : m?.id)
      .filter(Boolean)
      .filter((v, i, arr) => arr.indexOf(v) === i)
      .sort((a, b) => a.localeCompare(b));
  }

  async testConnection() {
    const { apiBaseUrl, selectedModel, gatewayMode } = store.state;
    const gapGptApiKey = store.getApiKey();
    if (gatewayMode === 'direct' && (!gapGptApiKey || gapGptApiKey.trim() === '')) {
      throw new Error('کلید API وارد نشده است. ابتدا در AI Gateway کلید را ثبت کنید.');
    }

    const endpoint = `${store.validateApiBaseUrl(apiBaseUrl)}/chat/completions`;
    const headers = { 'Content-Type': 'application/json' };
    if (gapGptApiKey && gapGptApiKey.trim() !== '') {
      headers['Authorization'] = `Bearer ${gapGptApiKey.trim()}`;
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        model: selectedModel || 'gpt-4o',
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 5
      })
    });

    if (!res.ok) {
      this._handleHttpError(res.status);
    }
    return true;
  }

  async generateCompletion({ systemPrompt, userPrompt, temperature = 0.7, type = 'general', model = null }) {
    this._checkRateLimit(type);

    const { apiBaseUrl, selectedModel, gatewayMode } = store.state;
    const gapGptApiKey = store.getApiKey();
    if (gatewayMode === 'direct' && (!gapGptApiKey || gapGptApiKey.trim() === '')) {
      throw new Error('کلید API تنظیم نشده است. به بخش AI Gateway بروید.');
    }

    const endpoint = `${store.validateApiBaseUrl(apiBaseUrl)}/chat/completions`;
    const headers = { 'Content-Type': 'application/json' };
    if (gapGptApiKey && gapGptApiKey.trim() !== '') {
      headers['Authorization'] = `Bearer ${gapGptApiKey.trim()}`;
    }

    let res;
    try {
      res = await fetch(endpoint, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          model: model || selectedModel || 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: temperature
        })
      });
    } catch (networkError) {
      throw new Error('خطای عدم برقراری اتصال شبکه با سرویس AI. آدرس Base URL یا دسترسی اینترنت را بررسی فرمایید.');
    }

    if (!res.ok) {
      this._handleHttpError(res.status);
    }

    const data = await res.json();
    if (!data.choices || data.choices.length === 0) {
      throw new Error('پاسخی از سرور مدل هوش مصنوعی دریافت نشد.');
    }
    return data.choices[0].message.content.trim();
  }

  async generateJSON({ systemPrompt, userPrompt, type = 'json_gen', model = null }) {
    const strictSystemPrompt = `${systemPrompt}

قانون خروجی: خروجی شما باید منحصراً یک JSON معتبر باشد. بدون توضیحات، بدون کدهای Markdown و بدون \`\`\`json.`;

    const raw = await this.generateCompletion({
      systemPrompt: strictSystemPrompt,
      userPrompt,
      temperature: 0.4,
      type,
      model
    });

    return this.cleanAndParseJSON(raw);
  }

  cleanAndParseJSON(rawText) {
    let clean = rawText.trim();
    clean = clean.replace(/^\`\`\`json/i, '').replace(/^\`\`\`/, '').replace(/\`\`\`$/, '').trim();

    try {
      return JSON.parse(clean);
    } catch (err) {
      const firstBrace = clean.indexOf('{');
      const lastBrace = clean.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        const sliced = clean.substring(firstBrace, lastBrace + 1);
        return JSON.parse(sliced);
      }
      throw new Error('پاسخ دریافتی ساختار معتبر JSON نداشت. لطفا مجددا تلاش کنید.');
    }
  }

  _handleHttpError(status) {
    if (status === 401) {
      throw new Error('احراز هویت ناموفق است؛ API Key را بررسی کن.');
    } else if (status === 429) {
      throw new Error('محدودیت درخواست فعال است؛ چند لحظه بعد دوباره تلاش کن.');
    } else if (status >= 500) {
      throw new Error('سرور هوش مصنوعی در دسترس نیست یا با خطای داخلی روبرو شد.');
    } else {
      throw new Error(`درخواست با خطای HTTP ${status} مواجه گردید.`);
    }
  }
}

export const apiGateway = new ApiGateway();