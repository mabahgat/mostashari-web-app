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
    foundResults: (count, page, totalPages) => `تم العثور على ${count} نتيجة (الصفحة ${page} من ${totalPages})`,
    searchHit: 'اصابة البحث',
  },
};

export default translations;