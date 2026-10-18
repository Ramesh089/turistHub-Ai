import React, { createContext, useContext, useState, useEffect } from 'react';

const I18nContext = createContext(null);

export const TRANSLATIONS = {
  en: {
    appName: 'Tourist AI Hub',
    appGuideTitle: 'Tourist AI Digital Guide',
    appGuideTagline: 'Your AI companion for travel — spot narration, route planning and instant answers',
    icpBadge: 'Digital Tourism · Record No. 2026107095-3',

    // Login
    welcomeBack: 'Welcome back',
    loginSubtext: 'Please enter your account and password to login',
    roleAdmin: 'Admin',
    roleUser: 'User',
    accountPlaceholder: 'admin / email / username',
    passwordPlaceholder: 'Enter your password',
    slidePrompt: 'Please slide to verify',
    slideVerified: 'Verification passed',
    rememberPassword: 'Remember password',
    forgotPassword: 'Forgot password',
    loginButton: 'Login',
    noAccount: 'No account yet?',
    registerLink: 'Register',

    // Register
    createAccount: 'Create your account',
    registerSubtext: 'Please fill in your details to register',
    fullName: 'Full Name',
    fullNamePlaceholder: 'Enter your full name',
    username: 'Username',
    usernamePlaceholder: 'Choose a unique username',
    email: 'Email Address',
    emailPlaceholder: 'you@example.com',
    phone: 'Phone Number',
    phonePlaceholder: 'Enter 10-digit number',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    confirmPasswordPlaceholder: 'Re-enter your password',
    roleLabel: 'Account Role',
    roleUserDefault: 'User (Standard Tourist Account)',
    roleAdminDisabledNote: 'Admin permissions can only be assigned by an existing Administrator',
    agreeTerms: 'I agree to the Terms of Service & Privacy Policy',
    registerButton: 'Register',
    haveAccount: 'Already have an account?',
    loginLink: 'Login',

    // Password strength
    strengthWeak: 'Weak',
    strengthMedium: 'Medium',
    strengthStrong: 'Strong',

    // Forgot Password Modal
    resetPasswordTitle: 'Reset Password',
    resetPasswordSubtext: 'Enter your account email or username to receive a 6-digit verification code',
    sendCodeButton: 'Get Verification Code',
    verificationCode: '6-Digit Code',
    codePlaceholder: 'e.g. 543440',
    newPassword: 'New Password',
    resetButton: 'Reset Password',
    backToLogin: 'Back to Login',
    cancel: 'Cancel',

    // Toolbar tooltips
    toggleTheme: 'Switch Dark / Light mode',
    switchLanguage: 'Switch Language',
    changeColor: 'Accent Color'
  },
  kn: {
    appName: 'ಪ್ರವಾಸಿ ಎಐ ಹಬ್ (Tourist AI Hub)',
    appGuideTitle: 'ಪ್ರವಾಸಿ ಎಐ ಡಿಜಿಟಲ್ ಮಾರ್ಗದರ್ಶಿ',
    appGuideTagline: 'ನಿಮ್ಮ ಭಾರತ ಪ್ರವಾಸದ ಎಐ ಸಂಗಾತಿ — ತಾಣ ವಿವರಣೆ, ಪ್ರವಾಸ ಯೋಜನೆ ಮತ್ತು ತ್ವರಿತ ಮಾರ್ಗದರ್ಶನ',
    icpBadge: 'ಡಿಜಿಟಲ್ ಪ್ರವಾಸೋದ್ಯಮ · ನೋಂದಣಿ ಸಂ. 2026107095-3',

    // Login
    welcomeBack: 'ಮರಳಿ ಸುಸ್ವಾಗತ',
    loginSubtext: 'ದಯವಿಟ್ಟು ಲಾಗಿನ್ ಮಾಡಲು ನಿಮ್ಮ ಖಾತೆ ಮತ್ತು ಪಾಸ್ವರ್ಡ್ ನಮೂದಿಸಿ',
    roleAdmin: 'ನಿರ್ವಾಹಕರು (Admin)',
    roleUser: 'ಬಳಕೆದಾರರು (User)',
    accountPlaceholder: 'admin / ಇಮೇಲ್ / ಬಳಕೆದಾರಹೆಸರು',
    passwordPlaceholder: 'ನಿಮ್ಮ ಪಾಸ್ವರ್ಡ್ ನಮೂದಿಸಿ',
    slidePrompt: 'ಪರಿಶೀಲಿಸಲು ದಯವಿಟ್ಟು ಸ್ಲೈಡ್ ಮಾಡಿ',
    slideVerified: 'ಪರಿಶೀಲನೆ ಯಶಸ್ವಿಯಾಗಿದೆ',
    rememberPassword: 'ಪಾಸ್ವರ್ಡ್ ನೆನಪಿಡಿ',
    forgotPassword: 'ಪಾಸ್ವರ್ಡ್ ಮರೆತಿರಾ?',
    loginButton: 'ಲಾಗಿನ್',
    noAccount: 'ಖಾತೆ ಇಲ್ಲವೇ?',
    registerLink: 'ನೋಂದಣಿ ಮಾಡಿ',

    // Register
    createAccount: 'ನಿಮ್ಮ ಖಾತೆಯನ್ನು ರಚಿಸಿ',
    registerSubtext: 'ನೋಂದಾಯಿಸಲು ದಯವಿಟ್ಟು ನಿಮ್ಮ ವಿವರಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ',
    fullName: 'ಪೂರ್ಣ ಹೆಸರು',
    fullNamePlaceholder: 'ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರನ್ನು ನಮೂದಿಸಿ',
    username: 'ಬಳಕೆದಾರಹೆಸರು (Username)',
    usernamePlaceholder: 'ವಿಶಿಷ್ಟ ಬಳಕೆದಾರಹೆಸರನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    email: 'ಇಮೇಲ್ ವಿಳಾಸ',
    emailPlaceholder: 'you@example.com',
    phone: 'ದೂರವಾಣಿ ಸಂಖ್ಯೆ',
    phonePlaceholder: '10-ಅಂಕಿಯ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ',
    password: 'ಪಾಸ್ವರ್ಡ್',
    confirmPassword: 'ಪಾಸ್ವರ್ಡ್ ದೃಢೀಕರಿಸಿ',
    confirmPasswordPlaceholder: 'ಪಾಸ್ವರ್ಡ್ ಅನ್ನು ಪುನಃ ನಮೂದಿಸಿ',
    roleLabel: 'ಖಾತೆ ಪಾತ್ರ',
    roleUserDefault: 'ಸಾಮಾನ್ಯ ಬಳಕೆದಾರರು (User)',
    roleAdminDisabledNote: 'ನಿರ್ವಾಹಕರ (Admin) ಹಕ್ಕುಗಳನ್ನು ಅಸ್ತಿತ್ವದಲ್ಲಿರುವ ನಿರ್ವಾಹಕರು ಮಾತ್ರ ನಿಯೋಜಿಸಬಹುದು',
    agreeTerms: 'ನಾನು ಸೇವಾ ನಿಯಮಗಳು ಮತ್ತು ಗೌಪ್ಯತಾ ನೀತಿಯನ್ನು ಒಪ್ಪುತ್ತೇನೆ',
    registerButton: 'ನೋಂದಣಿ ಮಾಡಿ',
    haveAccount: 'ಈಗಾಗಲೇ ಖಾತೆ ಹೊಂದಿದ್ದೀರಾ?',
    loginLink: 'ಲಾಗಿನ್ ಮಾಡಿ',

    // Password strength
    strengthWeak: 'ದುರ್ಬಲ (Weak)',
    strengthMedium: 'ಮಧ್ಯಮ (Medium)',
    strengthStrong: 'ಬಲವಾದ (Strong)',

    // Forgot Password
    resetPasswordTitle: 'ಪಾಸ್ವರ್ಡ್ ಮರುಹೊಂದಿಸಿ',
    resetPasswordSubtext: '6-ಅಂಕಿಯ ಪರಿಶೀಲನಾ ಕೋಡ್ ಪಡೆಯಲು ನಿಮ್ಮ ಖಾತೆಯ ಇಮೇಲ್ ಅಥವಾ ಬಳಕೆದಾರಹೆಸರನ್ನು ನಮೂದಿಸಿ',
    sendCodeButton: 'ಪರಿಶೀಲನಾ ಕೋಡ್ ಪಡೆಯಿರಿ',
    verificationCode: '6-ಅಂಕಿಯ ಕೋಡ್',
    codePlaceholder: 'ಉದಾ. 543440',
    newPassword: 'ಹೊಸ ಪಾಸ್ವರ್ಡ್',
    resetButton: 'ಪಾಸ್ವರ್ಡ್ ಮರುಹೊಂದಿಸಿ',
    backToLogin: 'ಲಾಗಿನ್‌ಗೆ ಹಿಂತಿರುಗಿ',
    cancel: 'ರದ್ದುಮಾಡಿ',

    // Toolbar
    toggleTheme: 'ಬೆಳಕು / ಕತ್ತಲೆ ಮೋಡ್ ಬದಲಾಯಿಸಿ',
    switchLanguage: 'ಭಾಷೆ ಬದಲಾಯಿಸಿ (ಕನ್ನಡ)',
    changeColor: 'ಥೀಮ್ ಬಣ್ಣ'
  },
  hi: {
    appName: 'टूरिस्ट एआई हब (Tourist AI Hub)',
    appGuideTitle: 'टूरिस्ट एआई डिजिटल गाइड',
    appGuideTagline: 'भारत भ्रमण के लिए आपका एआई साथी — स्थान विवरण, यात्रा योजना एवं त्वरित उत्तर',
    icpBadge: 'डिजिटल पर्यटन · रिकॉर्ड सं. 2026107095-3',

    // Login
    welcomeBack: 'वापसी पर स्वागत है',
    loginSubtext: 'कृपया लॉगिन करने के लिए अपना खाता और पासवर्ड दर्ज करें',
    roleAdmin: 'एडमिन (Admin)',
    roleUser: 'उपयोगकर्ता (User)',
    accountPlaceholder: 'admin / यूज़रनेम / ईमेल',
    passwordPlaceholder: 'पासवर्ड दर्ज करें',
    slidePrompt: 'सत्यापन के लिए स्लाइड करें',
    slideVerified: 'सत्यापन सफल',
    rememberPassword: 'पासवर्ड याद रखें',
    forgotPassword: 'पासवर्ड भूल गए?',
    loginButton: 'लॉगिन करें',
    noAccount: 'खाता नहीं है?',
    registerLink: 'पंजीकरण करें',

    // Register
    createAccount: 'अपना खाता बनाएं',
    registerSubtext: 'कृपया पंजीकरण के लिए अपना विवरण भरें',
    fullName: 'पूरा नाम',
    fullNamePlaceholder: 'अपना पूरा नाम दर्ज करें',
    username: 'यूज़रनेम',
    usernamePlaceholder: 'यूनीक यूज़रनेम चुनें',
    email: 'ईमेल पता',
    emailPlaceholder: 'you@example.com',
    phone: 'फ़ोन नंबर',
    phonePlaceholder: '10-अंकीय नंबर दर्ज करें',
    password: 'पासवर्ड',
    confirmPassword: 'पासवर्ड की पुष्टि करें',
    confirmPasswordPlaceholder: 'पासवर्ड दोबारा दर्ज करें',
    roleLabel: 'खाता प्रकार',
    roleUserDefault: 'उपयोगकर्ता (User)',
    roleAdminDisabledNote: 'एडमिन अधिकार केवल मौजूदा एडमिन द्वारा दिए जा सकते हैं',
    agreeTerms: 'मैं सेवा की शर्तों और गोपनीयता नीति से सहमत हूँ',
    registerButton: 'रजिस्टर करें',
    haveAccount: 'पहले से खाता है?',
    loginLink: 'लॉगिन करें',

    // Strength
    strengthWeak: 'कमजोर (Weak)',
    strengthMedium: 'मध्यम (Medium)',
    strengthStrong: 'मजबूत (Strong)',

    // Forgot Password
    resetPasswordTitle: 'पासवर्ड रीसेट करें',
    resetPasswordSubtext: '6-अंकीय सत्यापन कोड प्राप्त करने के लिए अपना ईमेल या यूज़रनेम दर्ज करें',
    sendCodeButton: 'कोड प्राप्त करें',
    verificationCode: '6-अंकीय कोड',
    codePlaceholder: 'जैसे 543440',
    newPassword: 'नया पासवर्ड',
    resetButton: 'पासवर्ड रीसेट करें',
    backToLogin: 'लॉगिन पर लौटें',
    cancel: 'रद्द करें',

    // Toolbar
    toggleTheme: 'लाइट / डार्क मोड',
    switchLanguage: 'भाषा बदलें (हिन्दी)',
    changeColor: 'थीम रंग'
  }
};

export function I18nProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('touristhub_lang');
    // If user previously had 'zh', automatically migrate to 'kn'
    if (saved === 'zh') return 'kn';
    return saved || 'en';
  });

  useEffect(() => {
    localStorage.setItem('touristhub_lang', language);
  }, [language]);

  const t = (key) => {
    const langDict = TRANSLATIONS[language] || TRANSLATIONS.en;
    return langDict[key] || TRANSLATIONS.en[key] || key;
  };

  const cycleLanguage = () => {
    const order = ['en', 'kn', 'hi'];
    const nextIdx = (order.indexOf(language) + 1) % order.length;
    setLanguage(order[nextIdx]);
  };

  return (
    <I18nContext.Provider
      value={{
        language,
        setLanguage,
        cycleLanguage,
        t
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}
