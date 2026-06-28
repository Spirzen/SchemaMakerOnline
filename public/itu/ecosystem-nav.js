(function () {
  var mount = document.getElementById('itu-ecosystem-nav');
  if (!mount) {
    return;
  }

  var portalId = mount.dataset.portalId || 'html';
  var brandLabel = mount.dataset.brandLabel || 'IT Universe';

  /** @type {{ domains?: Record<string, string>, routes?: Record<string, string>, nav?: { ecosystem?: Array<{ id: string, label: string, hrefKey: string, routeKey?: string, suffix?: string }> } } | null} */
  var config = null;

  try {
    var el = document.getElementById('itu-ecosystem-config');
    if (el && el.textContent) {
      config = JSON.parse(el.textContent);
    }
  } catch (e) {
    console.warn('[itu-ecosystem-nav] invalid config', e);
  }

  if (!config || !config.nav || !config.domains) {
    return;
  }

  function resolveHref(item) {
    var domain = (config.domains[item.hrefKey] || '#').replace(/\/$/, '');
    if (!item.routeKey) {
      return domain;
    }
    var route = config.routes && config.routes[item.routeKey] ? config.routes[item.routeKey] : '';
    var suffix = item.suffix || '';
    return domain + route + suffix;
  }

  var brandHref = (config.domains[portalId] || '/').replace(/\/$/, '');
  var mascotSrc = mount.dataset.mascotSrc || '/img/docusaurus.png';
  var navItems = config.nav.ecosystem || [];

  var linksHtml = navItems
    .map(function (item) {
      var href = resolveHref(item);
      var active = item.id === portalId;
      return (
        '<a class="ecosystem-nav__link' +
        (active ? ' is-active' : '') +
        '" href="' +
        href +
        '"' +
        (active ? ' aria-current="page"' : '') +
        '>' +
        item.label +
        '</a>'
      );
    })
    .join('');

  mount.outerHTML =
    '<header class="ecosystem-nav">' +
    '<a class="ecosystem-nav__brand" href="' +
    brandHref +
    '">' +
    '<img class="ecosystem-nav__brand-mark" src="' +
    mascotSrc +
    '" alt="" width="28" height="28" decoding="async" />' +
    '<span>' +
    brandLabel +
    '</span></a>' +
    '<nav class="ecosystem-nav__links" aria-label="Экосистема Вселенная IT">' +
    linksHtml +
    '</nav>' +
    '<div class="ecosystem-nav__actions">' +
    '<button type="button" class="theme-toggle" data-itu-theme-toggle aria-label="Переключить тему">' +
    '<span class="theme-toggle__icon theme-toggle__icon--light" aria-hidden="true">☀</span>' +
    '<span class="theme-toggle__icon theme-toggle__icon--dark" aria-hidden="true">☽</span>' +
    '</button></div></header>';
})();
