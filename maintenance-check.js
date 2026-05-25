(function () {
    'use strict';

    var EXEMPT_PAGES = ['maintenance.html', 'admin.html'];
    var path = window.location.pathname;
    var currentPage = path.split('/').pop() || 'index.html';

    for (var i = 0; i < EXEMPT_PAGES.length; i++) {
        if (path.indexOf(EXEMPT_PAGES[i]) !== -1) return;
    }

    fetch('/api/maintenance-status', { cache: 'no-store' })
        .then(function (res) { return res.json(); })
        .then(function (data) {
            if (data.enabled) {
                window.location.href = '/maintenance.html';
            }
        })
        .catch(function () {});
})();
