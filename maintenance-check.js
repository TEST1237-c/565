(function () {
    'use strict';

    var path = window.location.pathname;

    // Exempter maintenance et admin (avec ou sans .html)
    if (path.indexOf('maintenance') !== -1 || path.indexOf('admin') !== -1) return;

    fetch('/api/maintenance-status', { cache: 'no-store' })
        .then(function (res) { return res.json(); })
        .then(function (data) {
            if (data.enabled) {
                window.location.href = '/maintenance';
            }
        })
        .catch(function () {});
})();
