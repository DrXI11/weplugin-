chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['brands', 'activeBrandId'], (result) => {
    if (!result.brands || result.brands.length === 0) {
      const defaultBrand = {
        id: 'brand_' + Date.now(),
        name: 'برند نمونه سازمانی',
        archetype: 'The Creator (آفرینش‌گر)',
        mission: 'توانمندسازی کسب‌وکارها در مقیاس‌پذیری دیجیتال و استراتژی محتوای اصیل',
        vision: 'پیشرو در نوآوری داده‌محور و استانداردهای رسانه‌ای تا سال ۲۰۳۰',
        values: 'شفافیت، اصالت، دقت مهندسی، تمرکز بر اثربخشی پایدار',
        promise: 'کیفیت پایدار و استراتژی بدون حاشیه در تمام کانال‌ها',
        positioning: 'رهبر فناوری‌های محتوامحور سازمانی و B2B',
        usp: 'سیستم‌عامل هوشمند یکپارچه با درک ژرف کانتکست و هویت بنیادین برند',
        bannedWords: 'شاید، ارزان، رایگان، معجزه، بدون زحمت، تخفیف فضایی',
        audience: {
          description: 'مدیران رشد، بازاریاب‌های داده‌محور و استراتژیست‌های محتوا',
          painPoints: 'کمبود زمان، خروجی‌های جنریک هوش مصنوعی، ناهمگونی لحن در شبکه‌های اجتماعی',
          desires: 'تولید محتوای عمیق با هویت برند پایدار در تمامی کانال‌ها و حفظ جایگاه حرفه‌ای'
        },
        voice: {
          tone: 'حرفه‌ای، قاطع و داده‌محور',
          traits: 'متخصص، آینده‌نگر، ساختاریافته، بدون تعارفات اضافه',
          preferredWords: 'زیرساخت، استراتژی، بازدهی، بهینه‌سازی، هویت پایدار، اثربخشی',
          formality: 'رسمی و فاخر'
        },
        kapferer: {
          physique: 'ظاهری تمیز، ماسه و کرم گرم با کانتراست بالا و لهجه زرد آفتابی',
          personality: 'معمار، آینده‌پژوه، دقیق و متین',
          culture: 'مهندسی نوآورانه با احترام به داده‌ها و دقت تحلیلی',
          relationship: 'مشاور استراتژیک ارشد در تمام تصمیمات محتوایی',
          reflection: 'پیشگامان صنعت که تصمیمات داده‌محور می‌گیرند',
          selfImage: 'احساس تسلط کامل بر معماری محتوای برند'
        },
        content: {
          pillars: 'مهندسی برند، راهکارهای مقیاس‌پذیری، هوش مصنوعی مولد سازمانی',
          goals: 'جایگاه‌سازی به عنوان مرجع فکری و جذب لید باکیفیت B2B'
        }
      };

      chrome.storage.local.set({
        brands: [defaultBrand],
        activeBrandId: defaultBrand.id,
        selectedModel: 'gpt-4o',
        apiBaseUrl: 'https://api.gapgpt.app/v1',
        gatewayMode: 'direct',
        history: [],
        brandVersions: {}
      });
    }
  });
});

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
});