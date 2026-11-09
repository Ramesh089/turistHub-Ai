/**
 * Translation Service — Multi-language support for AI assistant
 * Supports: Hindi, Kannada, Tamil, Telugu, Bengali, Marathi, English
 * Uses Google Cloud Translation API or falls back to built-in phrase maps
 */

const SUPPORTED_LANGUAGES = {
  en: { name: 'English', nativeName: 'English', code: 'en' },
  hi: { name: 'Hindi', nativeName: 'हिन्दी', code: 'hi' },
  kn: { name: 'Kannada', nativeName: 'ಕನ್ನಡ', code: 'kn' },
  ta: { name: 'Tamil', nativeName: 'தமிழ்', code: 'ta' },
  te: { name: 'Telugu', nativeName: 'తెలుగు', code: 'te' },
  bn: { name: 'Bengali', nativeName: 'বাংলা', code: 'bn' },
  mr: { name: 'Marathi', nativeName: 'मराठी', code: 'mr' },
  ml: { name: 'Malayalam', nativeName: 'മലയാളം', code: 'ml' },
  gu: { name: 'Gujarati', nativeName: 'ગુજરાતી', code: 'gu' }
};

// ─── Common Travel Phrases (Built-in Fallback) ──────────────────────────────
const PHRASE_MAP = {
  hi: {
    'Welcome': 'स्वागत है',
    'Plan your trip': 'अपनी यात्रा की योजना बनाएं',
    'Book now': 'अभी बुक करें',
    'Search destinations': 'गंतव्य खोजें',
    'Where would you like to go?': 'आप कहाँ जाना चाहेंगे?',
    'How can I help you?': 'मैं आपकी कैसे मदद कर सकता हूं?',
    'Your trip is confirmed': 'आपकी यात्रा की पुष्टि हो गई है',
    'Total amount': 'कुल राशि',
    'Check weather': 'मौसम देखें',
    'Explore nearby': 'आस-पास देखें',
    'Hotel': 'होटल',
    'Guide': 'गाइड',
    'Transport': 'परिवहन',
    'Restaurant': 'रेस्तरां',
    'Booking confirmed': 'बुकिंग की पुष्टि हो गई',
    'Cancel booking': 'बुकिंग रद्द करें',
    'Payment successful': 'भुगतान सफल',
    'Thank you for using Tourist Hub': 'टूरिस्ट हब का उपयोग करने के लिए धन्यवाद',
    'Enter your destination': 'अपना गंतव्य दर्ज करें',
    'Select travel dates': 'यात्रा की तारीखें चुनें',
    'Number of travelers': 'यात्रियों की संख्या',
    'Best time to visit': 'यात्रा का सबसे अच्छा समय'
  },
  kn: {
    'Welcome': 'ಸ್ವಾಗತ',
    'Plan your trip': 'ನಿಮ್ಮ ಪ್ರವಾಸವನ್ನು ಯೋಜಿಸಿ',
    'Book now': 'ಈಗ ಬುಕ್ ಮಾಡಿ',
    'Search destinations': 'ಗಮ್ಯಸ್ಥಾನಗಳನ್ನು ಹುಡುಕಿ',
    'Where would you like to go?': 'ನೀವು ಎಲ್ಲಿಗೆ ಹೋಗಲು ಬಯಸುತ್ತೀರಿ?',
    'How can I help you?': 'ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?',
    'Your trip is confirmed': 'ನಿಮ್ಮ ಪ್ರವಾಸ ದೃಢೀಕರಿಸಲಾಗಿದೆ',
    'Total amount': 'ಒಟ್ಟು ಮೊತ್ತ',
    'Check weather': 'ಹವಾಮಾನ ನೋಡಿ',
    'Hotel': 'ಹೋಟೆಲ್',
    'Guide': 'ಗೈಡ್',
    'Transport': 'ಸಾರಿಗೆ',
    'Booking confirmed': 'ಬುಕಿಂಗ್ ದೃಢೀಕರಿಸಲಾಗಿದೆ',
    'Payment successful': 'ಪಾವತಿ ಯಶಸ್ವಿ',
    'Thank you for using Tourist Hub': 'ಟೂರಿಸ್ಟ್ ಹಬ್ ಬಳಸಿದ್ದಕ್ಕೆ ಧನ್ಯವಾದಗಳು'
  },
  ta: {
    'Welcome': 'வரவேற்கிறோம்',
    'Plan your trip': 'உங்கள் பயணத்தைத் திட்டமிடுங்கள்',
    'Book now': 'இப்போது முன்பதிவு செய்யுங்கள்',
    'Where would you like to go?': 'நீங்கள் எங்கே செல்ல விரும்புகிறீர்கள்?',
    'How can I help you?': 'நான் உங்களுக்கு எப்படி உதவ முடியும்?',
    'Hotel': 'ஹோட்டல்',
    'Guide': 'வழிகாட்டி',
    'Transport': 'போக்குவரத்து',
    'Booking confirmed': 'முன்பதிவு உறுதிப்படுத்தப்பட்டது',
    'Payment successful': 'கட்டணம் வெற்றிகரமாக செலுத்தப்பட்டது'
  },
  te: {
    'Welcome': 'స్వాగతం',
    'Plan your trip': 'మీ ప్రయాణాన్ని ప్లాన్ చేయండి',
    'Book now': 'ఇప్పుడు బుక్ చేయండి',
    'Where would you like to go?': 'మీరు ఎక్కడికి వెళ్లాలనుకుంటున్నారు?',
    'How can I help you?': 'నేను మీకు ఎలా సహాయం చేయగలను?',
    'Hotel': 'హోటల్',
    'Guide': 'గైడ్',
    'Booking confirmed': 'బుకింగ్ నిర్ధారించబడింది',
    'Payment successful': 'చెల్లింపు విజయవంతం'
  },
  bn: {
    'Welcome': 'স্বাগতম',
    'Plan your trip': 'আপনার ভ্রমণ পরিকল্পনা করুন',
    'Book now': 'এখনই বুক করুন',
    'Hotel': 'হোটেল',
    'Guide': 'গাইড',
    'Booking confirmed': 'বুকিং নিশ্চিত হয়েছে',
    'Payment successful': 'পেমেন্ট সফল'
  },
  mr: {
    'Welcome': 'स्वागत आहे',
    'Plan your trip': 'तुमच्या सहलीचे नियोजन करा',
    'Book now': 'आता बुक करा',
    'Hotel': 'हॉटेल',
    'Guide': 'मार्गदर्शक',
    'Booking confirmed': 'बुकिंगची पुष्टी झाली',
    'Payment successful': 'पेमेंट यशस्वी'
  }
};

// ─── Language Detection (Simple Heuristic) ───────────────────────────────────

const LANG_SCRIPTS = [
  { lang: 'hi', regex: /[\u0900-\u097F]/ },
  { lang: 'kn', regex: /[\u0C80-\u0CFF]/ },
  { lang: 'ta', regex: /[\u0B80-\u0BFF]/ },
  { lang: 'te', regex: /[\u0C00-\u0C7F]/ },
  { lang: 'bn', regex: /[\u0980-\u09FF]/ },
  { lang: 'mr', regex: /[\u0900-\u097F]/ },  // Same script as Hindi; context-dependent
  { lang: 'ml', regex: /[\u0D00-\u0D7F]/ },
  { lang: 'gu', regex: /[\u0A80-\u0AFF]/ }
];

class TranslationService {
  constructor() {
    this.googleApiKey = process.env.GOOGLE_TRANSLATE_API_KEY || '';
    this.useGoogleAPI = Boolean(this.googleApiKey);
  }

  /**
   * Detect language of input text
   * @param {string} text
   * @returns {string} language code
   */
  detectLanguage(text) {
    if (!text) return 'en';
    for (const { lang, regex } of LANG_SCRIPTS) {
      if (regex.test(text)) return lang;
    }
    return 'en';
  }

  /**
   * Translate text from one language to another
   * @param {string} text
   * @param {string} targetLang - target language code (e.g., 'hi', 'kn')
   * @param {string} sourceLang - source language code (auto-detect if omitted)
   * @returns {Promise<{translated: string, detectedLang: string, targetLang: string}>}
   */
  async translate(text, targetLang = 'en', sourceLang) {
    if (!text || !text.trim()) return { translated: '', detectedLang: 'en', targetLang };

    const detected = sourceLang || this.detectLanguage(text);

    // Same language — no translation needed
    if (detected === targetLang) {
      return { translated: text, detectedLang: detected, targetLang };
    }

    // Try Google Translate API
    if (this.useGoogleAPI) {
      try {
        const url = `https://translation.googleapis.com/language/translate/v2?key=${this.googleApiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ q: text, source: detected, target: targetLang, format: 'text' })
        });
        const data = await response.json();
        if (data?.data?.translations?.[0]?.translatedText) {
          return {
            translated: data.data.translations[0].translatedText,
            detectedLang: detected,
            targetLang
          };
        }
      } catch (err) {
        console.warn('Google Translate API error:', err.message);
      }
    }

    // Fallback: use built-in phrase map (best-effort)
    return {
      translated: this._fallbackTranslate(text, targetLang, detected),
      detectedLang: detected,
      targetLang
    };
  }

  /**
   * Get all supported languages
   */
  getSupportedLanguages() {
    return Object.values(SUPPORTED_LANGUAGES);
  }

  /**
   * Get UI translations for a given language
   * @param {string} langCode
   * @returns {object}
   */
  getUITranslations(langCode) {
    return PHRASE_MAP[langCode] || {};
  }

  // ─── Internal ────────────────────────────────────────────────────────────

  _fallbackTranslate(text, targetLang, sourceLang) {
    // If translating FROM a regional language TO English, we return original text
    // (cannot reverse-translate without API)
    if (targetLang === 'en') return text;

    // If translating FROM English TO a regional language, look up phrases
    const phraseMap = PHRASE_MAP[targetLang];
    if (!phraseMap) return text;

    // Try exact match first
    if (phraseMap[text]) return phraseMap[text];

    // Try partial substitution
    let result = text;
    Object.entries(phraseMap).forEach(([english, translated]) => {
      result = result.replace(new RegExp(english, 'gi'), translated);
    });

    return result;
  }
}

module.exports = new TranslationService();
