(function () {
  try {
    var k = 'itu-portal-theme';
    var s = localStorage.getItem(k);
    if (s !== 'light' && s !== 'dark') {
      var legacy = localStorage.getItem('theme');
      if (legacy === 'light' || legacy === 'dark') {
        s = legacy;
        localStorage.setItem(k, legacy);
      }
    }
    var t = s === 'light' || s === 'dark'
      ? s
      : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', t);
    document.documentElement.classList.toggle('dark', t === 'dark');
  } catch (e) {}
})();
