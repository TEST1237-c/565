(function () {
    'use strict';

    // Pages qui ne doivent PAS être redirigées même en maintenance
    var EXEMPT_PAGES = [
        'maintenance.html',
        'admin.html'
    ];

    var currentPage = window.location.pathname.split('/').pop() || 'index.html';

    // Si on est déjà sur une page exemptée, on ne fait rien
    for (var i = 0; i < EXEMPT_PAGES.length; i++) {
        if (currentPage === EXEMPT_PAGES[i] || window.location.pathname.indexOf(EXEMPT_PAGES[i]) !== -1) {
            return;
        }
    }

    // Si on est sur maintenance.html, vérifier si la maintenance est terminée
    // pour rediriger vers l'accueil automatiquement
    var onMaintenancePage = currentPage === 'maintenance.html' || window.location.pathname.endsWith('/maintenance');

    fetch('/api/maintenance-status', { cache: 'no-store' })
        .then(function (res) {
            if (!res.ok) throw new Error('fetch failed');
            return res.json();
        })
        .then(function (data) {
            if (data.enabled && !onMaintenancePage) {
                // Maintenance active → rediriger vers la page de maintenance
                window.location.replace('/maintenance.html');
            } else if (!data.enabled && onMaintenancePage) {
                // Maintenance terminée et on est sur la page maintenance → retour à l'accueil
                window.location.replace('/');
            }
        })
        .catch(function () {
            // En cas d'erreur réseau, on ne bloque pas le site
        });
})();
