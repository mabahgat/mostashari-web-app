const convertToHindiNumerals = (str) => {
  const hindiDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(str).replace(/\d/g, (digit) => hindiDigits[digit]);
};

const convertNumbers = (str, language) => {
  if (language === 'ar') {
    return convertToHindiNumerals(str);
  }
  return str;
};

const translations = {
  en: {
    appTitle: 'Mostashari.ai',
    regulationsSearch: 'Regulations Search',
    casesSearch: 'Cases Search',
    search: 'Search',
    title: 'Search',
    placeholder: 'Ask me anything...',
    button: 'Send',
    searchingMessage: 'Searching...',
    errorMessage: 'Error searching. Please try again.',
    noResults: 'No results found',
    foundResults: (count) => `Found ${count} result${count !== 1 ? 's' : ''}`,
    searchHit: 'Search Hit',
    generate: 'Generate',
    generateTitle: 'Generate Content',
    prompt: 'Enter your prompt',
    promptPlaceholder: 'Enter text here...',
    result: 'Result',
    clear: 'Clear',
  },
  ar: {
    appTitle: 'مستشاري',
    regulationsSearch: 'بحث الأنظمة',
    casesSearch: 'بحث السوابق',
    search: 'بحث',
    title: 'بحث',
    placeholder: 'اسأل عن أي شيء...',
    button: 'بحث',
    searchingMessage: 'جاري البحث...',
    errorMessage: 'خطأ في البحث. الرجاء المحاولة مرة أخرى.',
    noResults: 'لا توجد نتائج',
    foundResults: (count) => `تم العثور على ${convertToHindiNumerals(count)} نتيجة`,
    searchHit: 'إصابة البحث',
    generate: 'كتابة',
    generateTitle: 'كتابة محتوى',
    prompt: 'أدخل طلبك',
    promptPlaceholder: 'أدخل النص هنا...',
    result: 'النتيجة',
    clear: 'مسح',
  },
};

export { convertNumbers, convertToHindiNumerals };
export default translations;