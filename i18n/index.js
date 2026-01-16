// 切换语言并加载对应 JSON
function setLanguage(lang) {
    console.log('---------',lang)
  $.getJSON(`/i18n/locales/${lang}.json`)
    .done(function (data) {
      currentLang = lang;
      currentTranslations = data;
      applyTranslations();
    })
    .fail(function () {
      console.error(`Failed to load language file: ${lang}.json`);
      // 可选：回退到英文
      if (lang !== 'en') {
        setLanguage('en');
      }
    });
}

// 应用翻译到页面
function applyTranslations() {
  $('[data-i18n]').each(function () {
    const key = $(this).attr('data-i18n');
    const text = currentTranslations[key] || `[${key}]`;

    if (this.tagName === 'INPUT' || this.tagName === 'BUTTON') {
      $(this).val(text);
    } else {
      $(this).text(text);
    }
  });
}