(function () {
    'use strict';

    var path = window.location.pathname;
    var search = window.location.search;

    // Exempter maintenance et admin
    if (path.indexOf('maintenance') !== -1 || path.indexOf('admin') !== -1) return;

    // Bypass secret
    if (search.indexOf('bypass=y8x_admin') !== -1) return;

    fetch('/api/maintenance-status', { cache: 'no-store' })
        .then(function (res) { return res.json(); })
        .then(function (data) {
            if (data.enabled) {
                window.location.href = '/maintenance';
            }
        })
        .catch(function () {});
})();
