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
    title: 'Search',
    placeholder: 'Ask me anything...',
    button: 'Send',
    searchingMessage: 'Searching...',
    errorMessage: 'Error searching. Please try again.',
    noResults: 'No results found',
    resultsPerPage: 'Results per page:',
    foundResults: (count, page, totalPages) => `Found ${count} result${count !== 1 ? 's' : ''} (Page ${page} of ${totalPages})`,
    searchHit: 'Search Hit',
  },
  ar: {
    appTitle: 'مستاشري',
    title: 'بحث',
    placeholder: 'اسأل عن أي شيء...',
    button: 'إرسال',
    searchingMessage: 'جاري البحث...',
    errorMessage: 'خطأ في البحث. الرجاء المحاولة مرة أخرى.',
    noResults: 'لا توجد نتائج',
    resultsPerPage: 'النتائج لكل صفحة:',
    foundResults: (count, page, totalPages) => `تم العثور على ${convertToHindiNumerals(count)} نتيجة (الصفحة ${convertToHindiNumerals(page)} من ${convertToHindiNumerals(totalPages)})`,
    searchHit: 'اصابة البحث',
  },
};

export { convertNumbers, convertToHindiNumerals };
export default translations;