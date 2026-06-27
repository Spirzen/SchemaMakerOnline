(function initPortalTheme() {
  var STORAGE_KEY = 'itu-portal-theme';
  var root = document.documentElement;
  var pm = {themeRequest: 'itu-theme-request', themeChange: 'itu-theme-change', source: 'itu-portal'};

  try {
    var el = document.getElementById('itu-ecosystem-config');
    if (el && el.textContent) {
      var cfg = JSON.parse(el.textContent);
      if (cfg.postMessage) {
        pm = cfg.postMessage;
      }
    }
  } catch (e) {}

  function systemPrefersDark() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function resolveTheme(stored) {
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
    return systemPrefersDark() ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
  }

  function persist(mode) {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch (e) {}
  }

  function readStored() {
    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }
      var legacy = localStorage.getItem('theme');
      if (legacy === 'light' || legacy === 'dark') {
        localStorage.setItem(STORAGE_KEY, legacy);
        return legacy;
      }
    } catch (e) {}
    return null;
  }

  function readUrlTheme() {
    try {
      var params = new URLSearchParams(window.location.search);
      var theme = params.get('theme');
      if (theme === 'light' || theme === 'dark') {
        return theme;
      }
    } catch (e) {}
    return null;
  }

  function broadcast(theme) {
    if (!window.parent || window.parent === window) {
      return;
    }
    try {
      window.parent.postMessage({type: pm.themeChange, theme: theme, source: pm.source}, '*');
    } catch (e) {}
  }

  function setTheme(mode, options) {
    var broadcastChange = !options || options.broadcastChange !== false;
    persist(mode);
    applyTheme(resolveTheme(mode));
    if (broadcastChange) {
      broadcast(resolveTheme(mode));
    }
    window.dispatchEvent(new CustomEvent('itu-theme-set', {detail: {mode: mode}}));
  }

  function cycleTheme() {
    var resolved = resolveTheme(readStored());
    setTheme(resolved === 'dark' ? 'light' : 'dark');
  }

  applyTheme(resolveTheme(readUrlTheme() || readStored()));

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
    if (!readStored() && !readUrlTheme()) {
      applyTheme(resolveTheme(null));
    }
  });

  window.addEventListener('message', function (event) {
    var data = event.data;
    if (!data || typeof data !== 'object') {
      return;
    }
    if (data.type === pm.themeChange && (data.theme === 'light' || data.theme === 'dark')) {
      setTheme(data.theme, {broadcastChange: false});
    }
    if (data.type === pm.themeRequest) {
      broadcast(resolveTheme(readStored()));
    }
  });

  document.addEventListener('click', function (event) {
    var target = event.target;
    if (!target || !target.closest) {
      return;
    }
    if (target.closest('[data-itu-theme-toggle]')) {
      cycleTheme();
    }
  });

  window.ITUPortalTheme = {setTheme: setTheme, cycleTheme: cycleTheme, readStored: readStored, resolveTheme: resolveTheme};
})();
