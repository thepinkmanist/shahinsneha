// ============================================================
// Wedding Gallery — translations (English / Malayalam / Tamil)
// Default language is English. Choice is saved in localStorage
// so it persists across the home page and each event gallery.
// ============================================================

const LANG_KEY = "wedding-lang";
const DEFAULT_LANG = "en";

const translations = {
  en: {
    siteTitle: "Shahin & Sneha",
    eyebrow: "Our Wedding",
    tagline: "A private gallery for our family and friends.",
    watchHighlights: "Watch our highlights",
    playVideo: "Play video",
    eventsHeading: "The Celebrations",
    viewGallery: "View gallery",
    photoCount: "{n} photos",
    registrationTitle: "Registration",
    registrationDate: "7 May 2026",
    receptionOneTitle: "Reception — Groom's Side",
    receptionOneDate: "9 May 2026",
    receptionTwoTitle: "Reception — Bride's Side",
    receptionTwoDate: "17 May 2026",
    followUs: "Follow us",
    footerNote: "Made with love for our families and friends.",
    backHome: "Back to home",
    backRaw: "Back to RAW Photos",
    loading: "Loading photos…",
    emptyState: "No photos here yet.",
    close: "Close",
    download: "Download this photo",
    next: "Next photo",
    previous: "Previous photo",
    photoOf: "Photo {current} of {total}",
    zoomHint: "Tap to zoom",
    star: "Star this photo",
    unstar: "Remove star",
    share: "Share this photo",
    shareFallback: "Photo opened in a new tab — save it, then share from WhatsApp or Instagram.",
    myPhotos: "My photos",
    favoritesTitle: "Starred photos",
    starredNav: "Starred",
    downloadAll: "Download all",
    downloadAllEvents: "Download every photo (all events)",
    downloadSelected: "Download my starred photos",
    preparingZip: "Preparing your download… {done} of {total}",
    zipReady: "Done! Your download should begin shortly.",
    zipCancelled: "Download cancelled.",
    favoritesEmptyTitle: "No starred photos yet",
    favoritesEmptyBody: "Browse the galleries and tap the star on any photo you love. It'll be saved here — even if you close the browser and come back later.",
    clearSelections: "Clear all",
    findFaces: "Find someone in the photos",
    findFacesBody: "Upload one or more clear, front-facing selfies, or take one with your camera. Everything runs on this device — nothing is uploaded anywhere. Matches are found across every event.",
    addAnotherSelfie: "Add a selfie",
    takePhoto: "Take a photo",
    searchFaces: "Search photos",
    searchingFaces: "Searching…",
    facesFound: "Found {n} matching photo(s).",
    facesNotFound: "No confident matches. Try a clearer, front-facing selfie.",
    downloadMatches: "Download all matches",
    selectAll: "Select all",
    selectNone: "Deselect all",
    downloadSelectedMatches: "Download selected",
    loadingFaceIndex: "Loading face search (first time only)…",
    faceIndexUnavailable: "Face search isn't available for this gallery yet.",
    slideshow: "Slideshow",
    slideshowCtaSub: "Sit back and watch every photo",
    preweddingTitle: "Pre-Wedding Photoshoot",
    preweddingDate: "1 May 2026",
    shareGallery: "Share this gallery",
    shareGalleryText: "Take a look at our wedding photos!",
    gateTitle: "Welcome!",
    gateBody: "Just so we know who's stopping by, please leave your name and phone number. You won't be asked again on this device.",
    gateNamePlaceholder: "Your name",
    gatePhonePlaceholder: "Phone number",
    gateSubmit: "Continue",
    gateError: "Please fill in both your name and phone number.",
    passwordTitle: "State the secret words 🧙",
    passwordBody: "This vault is protected by an extremely serious security system. Enter the magic word to proceed (hint: it's a date, and nobody needs the year).",
    passwordPlaceholder: "Secret word…",
    passwordSubmit: "Unlock",
    passwordSuccessTitle: "You're in!",
    passwordSuccessBody: "The guard llama stands down. Welcome, honored guest.",
    viewRawPhotos: "View all RAW photos",
    rawPhotosTitle: "RAW Photos",
    rawPasswordTitle: "Enter the password to continue",
    rawPasswordBody: "This section is separately locked, even if you already got past the main gate.",
    rawPasswordError: "That's not it — try again.",
    rawComingSoon: "The full RAW photo collection isn't uploaded yet — check back here later, this page will list them once they're ready.",
    rawHint: "Hint: two letters — think initials.",
    forgotPassword: "Forgot password?",
    forgotPasswordBody: "Enter the phone number you shared with us and we'll show it to you.",
    forgotPhoneError: "That number isn't recognized.",
    forgotPhoneReveal: "Your password is: {password}",
    checkPhone: "Check",
  },
  ml: {
    siteTitle: "ഷാഹിൻ & സ്നേഹ",
    eyebrow: "ഞങ്ങളുടെ വിവാഹം",
    tagline: "ഞങ്ങളുടെ കുടുംബത്തിനും സുഹൃത്തുക്കൾക്കും വേണ്ടിയുള്ള സ്വകാര്യ ഗാലറി.",
    watchHighlights: "ഹൈലൈറ്റ്സ് കാണുക",
    playVideo: "വീഡിയോ പ്ലേ ചെയ്യുക",
    eventsHeading: "ആഘോഷങ്ങൾ",
    viewGallery: "ഗാലറി കാണുക",
    photoCount: "{n} ഫോട്ടോകൾ",
    registrationTitle: "രജിസ്ട്രേഷൻ",
    registrationDate: "7 മെയ് 2026",
    receptionOneTitle: "സ്വീകരണം — വരന്റെ വീട്",
    receptionOneDate: "9 മെയ് 2026",
    receptionTwoTitle: "സ്വീകരണം — വധുവിന്റെ വീട്",
    receptionTwoDate: "17 മെയ് 2026",
    followUs: "ഞങ്ങളെ പിന്തുടരുക",
    footerNote: "ഞങ്ങളുടെ കുടുംബത്തിനും സുഹൃത്തുക്കൾക്കും സ്നേഹത്തോടെ.",
    backHome: "ഹോമിലേക്ക് മടങ്ങുക",
    loading: "ഫോട്ടോകൾ ലോഡ് ചെയ്യുന്നു…",
    emptyState: "ഇവിടെ ഇതുവരെ ഫോട്ടോകൾ ഇല്ല.",
    close: "അടയ്ക്കുക",
    download: "ഈ ഫോട്ടോ ഡൗൺലോഡ് ചെയ്യുക",
    next: "അടുത്ത ഫോട്ടോ",
    previous: "മുൻപത്തെ ഫോട്ടോ",
    photoOf: "ഫോട്ടോ {current} / {total}",
    zoomHint: "വലുതാക്കാൻ ടാപ്പ് ചെയ്യുക",
    star: "ഈ ഫോട്ടോ സ്റ്റാർ ചെയ്യുക",
    unstar: "സ്റ്റാർ നീക്കം ചെയ്യുക",
    share: "ഈ ഫോട്ടോ ഷെയർ ചെയ്യുക",
    shareFallback: "ഫോട്ടോ പുതിയ ടാബിൽ തുറന്നു — അത് സേവ് ചെയ്ത ശേഷം WhatsApp/Instagram-ൽ ഷെയർ ചെയ്യുക.",
    myPhotos: "എന്റെ ഫോട്ടോകൾ",
    downloadAll: "എല്ലാം ഡൗൺലോഡ് ചെയ്യുക",
    downloadAllEvents: "എല്ലാ ഫോട്ടോകളും ഡൗൺലോഡ് ചെയ്യുക (എല്ലാ ചടങ്ങുകളും)",
    downloadSelected: "സ്റ്റാർ ചെയ്ത ഫോട്ടോകൾ ഡൗൺലോഡ് ചെയ്യുക",
    preparingZip: "ഡൗൺലോഡ് തയ്യാറാക്കുന്നു… {done} / {total}",
    zipReady: "പൂർത്തിയായി! ഡൗൺലോഡ് ഉടൻ ആരംഭിക്കും.",
    zipCancelled: "ഡൗൺലോഡ് റദ്ദാക്കി.",
    favoritesEmptyTitle: "ഇതുവരെ സ്റ്റാർ ചെയ്ത ഫോട്ടോകൾ ഇല്ല",
    favoritesEmptyBody: "ഗാലറികളിൽ ബ്രൗസ് ചെയ്ത് നിങ്ങൾക്ക് ഇഷ്ടപ്പെട്ട ഫോട്ടോകളിൽ സ്റ്റാർ ടാപ്പ് ചെയ്യുക. ബ്രൗസർ അടച്ച ശേഷവും ഇവിടെ സേവ് ചെയ്യപ്പെടും.",
    clearSelections: "എല്ലാം മായ്ക്കുക",
    findFaces: "ഫോട്ടോകളിൽ ആരെയെങ്കിലും കണ്ടെത്തുക",
    findFacesBody: "വ്യക്തമായ, മുൻവശം കാണിക്കുന്ന ഒന്നോ അതിലധികമോ സെൽഫികൾ അപ്‌ലോഡ് ചെയ്യുക. എല്ലാം ഈ ഡിവൈസിൽ തന്നെ നടക്കുന്നു — ഒന്നും അപ്‌ലോഡ് ചെയ്യപ്പെടുന്നില്ല.",
    addAnotherSelfie: "മറ്റൊരു സെൽഫി ചേർക്കുക",
    searchFaces: "ഫോട്ടോകൾ തിരയുക",
    searchingFaces: "തിരയുന്നു…",
    facesFound: "{n} ഫോട്ടോ(കൾ) കണ്ടെത്തി.",
    facesNotFound: "ഉറപ്പുള്ള പൊരുത്തങ്ങൾ ഇല്ല. കൂടുതൽ വ്യക്തമായ സെൽഫി ശ്രമിക്കുക.",
    downloadMatches: "എല്ലാ പൊരുത്തങ്ങളും ഡൗൺലോഡ് ചെയ്യുക",
    loadingFaceIndex: "ഫേസ് സെർച്ച് ലോഡ് ചെയ്യുന്നു (ആദ്യമായി മാത്രം)…",
    faceIndexUnavailable: "ഈ ഗാലറിക്ക് ഇപ്പോൾ ഫേസ് സെർച്ച് ലഭ്യമല്ല.",
    slideshow: "സ്ലൈഡ്ഷോ",
    shareGallery: "ഈ ഗാലറി ഷെയർ ചെയ്യുക",
    shareGalleryText: "ഞങ്ങളുടെ വിവാഹ ഫോട്ടോകൾ കാണൂ!",
  },
  ta: {
    siteTitle: "ஷாஹின் & ஸ்நேஹா",
    eyebrow: "எங்கள் திருமணம்",
    tagline: "எங்கள் குடும்பத்தினருக்கும் நண்பர்களுக்கும் மட்டுமான தனிப்பட்ட தொகுப்பு.",
    watchHighlights: "ஹைலைட்ஸ் காணுங்கள்",
    playVideo: "வீடியோவை இயக்கு",
    eventsHeading: "கொண்டாட்டங்கள்",
    viewGallery: "கேலரியைக் காண்க",
    photoCount: "{n} புகைப்படங்கள்",
    registrationTitle: "பதிவு",
    registrationDate: "7 மே 2026",
    receptionOneTitle: "வரவேற்பு — மாப்பிள்ளை வீடு",
    receptionOneDate: "9 மே 2026",
    receptionTwoTitle: "வரவேற்பு — மணப்பெண் வீடு",
    receptionTwoDate: "17 மே 2026",
    followUs: "எங்களை பின்தொடருங்கள்",
    footerNote: "எங்கள் குடும்பத்தினருக்கும் நண்பர்களுக்கும் அன்புடன்.",
    backHome: "முகப்புக்குத் திரும்பு",
    loading: "புகைப்படங்கள் ஏற்றப்படுகின்றன…",
    emptyState: "இதுவரை புகைப்படங்கள் இல்லை.",
    close: "மூடு",
    download: "இந்த புகைப்படத்தைப் பதிவிறக்கு",
    next: "அடுத்த புகைப்படம்",
    previous: "முந்தைய புகைப்படம்",
    photoOf: "புகைப்படம் {current} / {total}",
    zoomHint: "பெரிதாக்க தட்டவும்",
    star: "இந்த புகைப்படத்தை நட்சத்திரமிடு",
    unstar: "நட்சத்திரத்தை நீக்கு",
    share: "இந்த புகைப்படத்தைப் பகிர்",
    shareFallback: "புகைப்படம் புதிய தாவலில் திறக்கப்பட்டது — சேமித்த பிறகு WhatsApp/Instagram-இல் பகிரவும்.",
    myPhotos: "எனது புகைப்படங்கள்",
    downloadAll: "அனைத்தையும் பதிவிறக்கு",
    downloadAllEvents: "எல்லா புகைப்படங்களையும் பதிவிறக்கு (எல்லா நிகழ்வுகளும்)",
    downloadSelected: "நட்சத்திரமிட்ட புகைப்படங்களைப் பதிவிறக்கு",
    preparingZip: "பதிவிறக்கம் தயாராகிறது… {done} / {total}",
    zipReady: "முடிந்தது! பதிவிறக்கம் விரைவில் தொடங்கும்.",
    zipCancelled: "பதிவிறக்கம் ரத்து செய்யப்பட்டது.",
    favoritesEmptyTitle: "இதுவரை நட்சத்திரமிட்ட புகைப்படங்கள் இல்லை",
    favoritesEmptyBody: "கேலரிகளை உலாவி, நீங்கள் விரும்பும் புகைப்படங்களில் நட்சத்திரத்தை தட்டவும். உலாவியை மூடி மீண்டும் வந்தாலும் இது இங்கே சேமிக்கப்படும்.",
    clearSelections: "அனைத்தையும் அழி",
    findFaces: "புகைப்படங்களில் ஒருவரைக் கண்டறியவும்",
    findFacesBody: "தெளிவான, முன்நோக்கிய ஒன்று அல்லது அதற்கு மேற்பட்ட செல்ஃபிகளைப் பதிவேற்றவும். எல்லாம் இந்த சாதனத்தில் மட்டுமே நடக்கும் — எதுவும் பதிவேற்றப்படாது.",
    addAnotherSelfie: "மற்றொரு செல்ஃபியைச் சேர்",
    searchFaces: "புகைப்படங்களைத் தேடு",
    searchingFaces: "தேடுகிறது…",
    facesFound: "{n} புகைப்படங்கள் கிடைத்தன.",
    facesNotFound: "உறுதியான பொருத்தங்கள் இல்லை. தெளிவான செல்ஃபியை முயற்சிக்கவும்.",
    downloadMatches: "எல்லா பொருத்தங்களையும் பதிவிறக்கு",
    loadingFaceIndex: "முக தேடலை ஏற்றுகிறது (முதல் முறை மட்டும்)…",
    faceIndexUnavailable: "இந்த கேலரிக்கு முக தேடல் இன்னும் கிடைக்கவில்லை.",
    slideshow: "ஸ்லைடுஷோ",
    shareGallery: "இந்த கேலரியைப் பகிர்",
    shareGalleryText: "எங்கள் திருமண புகைப்படங்களைப் பாருங்கள்!",
  },
};

function getLang() {
  return localStorage.getItem(LANG_KEY) || DEFAULT_LANG;
}

function setLang(lang) {
  localStorage.setItem(LANG_KEY, lang);
  applyTranslations();
  document.dispatchEvent(new CustomEvent("langchange", { detail: { lang } }));
}

function t(key, vars) {
  const lang = getLang();
  let str = (translations[lang] && translations[lang][key]) || translations.en[key] || key;
  if (vars) {
    Object.keys(vars).forEach((k) => {
      str = str.replace(`{${k}}`, vars[k]);
    });
  }
  return str;
}

function applyTranslations() {
  const lang = getLang();
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(node.getAttribute("data-i18n"));
  });
  document.querySelectorAll("[data-i18n-attr]").forEach((node) => {
    const [attr, key] = node.getAttribute("data-i18n-attr").split(":");
    node.setAttribute(attr, t(key));
  });
  document.querySelectorAll(".lang-switch button").forEach((btn) => {
    btn.setAttribute("aria-pressed", btn.dataset.lang === lang ? "true" : "false");
  });
}

function initLangSwitch() {
  document.querySelectorAll(".lang-switch button").forEach((btn) => {
    btn.addEventListener("click", () => setLang(btn.dataset.lang));
  });
  applyTranslations();
}

document.addEventListener("DOMContentLoaded", initLangSwitch);
