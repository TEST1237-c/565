(function () {
    'use strict';

    // ============================================
    // 1. BLOCK RIGHT-CLICK CONTEXT MENU
    // ============================================
    document.addEventListener('contextmenu', function (e) {
        e.preventDefault();
        return false;
    });

    // ============================================
    // 2. BLOCK KEYBOARD SHORTCUTS (DevTools, source, save, etc.)
    // ============================================
    document.addEventListener('keydown', function (e) {
        // F12 — DevTools
        if (e.key === 'F12' || e.keyCode === 123) {
            e.preventDefault(); e.stopPropagation(); return false;
        }

        // Ctrl+Shift+I — Inspect
        if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.keyCode === 73)) {
            e.preventDefault(); e.stopPropagation(); return false;
        }

        // Ctrl+Shift+J — Console
        if (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j' || e.keyCode === 74)) {
            e.preventDefault(); e.stopPropagation(); return false;
        }

        // Ctrl+Shift+C — Element picker
        if (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c' || e.keyCode === 67)) {
            e.preventDefault(); e.stopPropagation(); return false;
        }

        // Ctrl+Shift+K — Firefox console
        if (e.ctrlKey && e.shiftKey && (e.key === 'K' || e.key === 'k' || e.keyCode === 75)) {
            e.preventDefault(); e.stopPropagation(); return false;
        }

        // Ctrl+Shift+M — Responsive design mode
        if (e.ctrlKey && e.shiftKey && (e.key === 'M' || e.key === 'm' || e.keyCode === 77)) {
            e.preventDefault(); e.stopPropagation(); return false;
        }

        // Ctrl+Shift+S — Save as
        if (e.ctrlKey && e.shiftKey && (e.key === 'S' || e.key === 's' || e.keyCode === 83)) {
            e.preventDefault(); e.stopPropagation(); return false;
        }

        // Ctrl+U — View source
        if (e.ctrlKey && (e.key === 'u' || e.key === 'U' || e.keyCode === 85)) {
            e.preventDefault(); e.stopPropagation(); return false;
        }

        // Ctrl+S — Save page
        if (e.ctrlKey && !e.shiftKey && (e.key === 's' || e.keyCode === 83)) {
            e.preventDefault(); e.stopPropagation(); return false;
        }

        // Ctrl+A — Select all (except in inputs)
        if (e.ctrlKey && (e.key === 'a' || e.key === 'A' || e.keyCode === 65)) {
            if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault(); e.stopPropagation(); return false;
            }
        }

        // Ctrl+C — Copy (except in inputs)
        if (e.ctrlKey && !e.shiftKey && (e.key === 'c' || e.keyCode === 67)) {
            if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault(); e.stopPropagation(); return false;
            }
        }

        // Ctrl+P — Print
        if (e.ctrlKey && (e.key === 'p' || e.key === 'P' || e.keyCode === 80)) {
            e.preventDefault(); e.stopPropagation(); return false;
        }

        // Ctrl+H — History (can reveal visited pages)
        if (e.ctrlKey && (e.key === 'h' || e.key === 'H' || e.keyCode === 72)) {
            e.preventDefault(); e.stopPropagation(); return false;
        }

        // Ctrl+J — Downloads
        if (e.ctrlKey && !e.shiftKey && (e.key === 'j' || e.keyCode === 74)) {
            e.preventDefault(); e.stopPropagation(); return false;
        }

        // Ctrl+G / Ctrl+F — Find (optional, can reveal content)
        // F5 / Ctrl+F5 allowed (refresh is fine)
    }, true); // use capture phase for maximum priority

    // ============================================
    // 3. BLOCK TEXT SELECTION & DRAG
    // ============================================
    document.addEventListener('selectstart', function (e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        e.preventDefault();
    });

    document.addEventListener('dragstart', function (e) {
        e.preventDefault();
    });

    // Block copy event on document (except inputs)
    document.addEventListener('copy', function (e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        e.preventDefault();
    });

    // Block cut event
    document.addEventListener('cut', function (e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        e.preventDefault();
    });

    // ============================================
    // 4. DEVTOOLS DETECTION — Window size method
    // ============================================
    let devToolsOpen = false;
    const threshold = 160;

    function checkDevToolsSize() {
        const widthThreshold = window.outerWidth - window.innerWidth > threshold;
        const heightThreshold = window.outerHeight - window.innerHeight > threshold;

        if (widthThreshold || heightThreshold) {
            if (!devToolsOpen) {
                devToolsOpen = true;
                showDevToolsOverlay();
            }
        } else {
            if (devToolsOpen) {
                devToolsOpen = false;
                hideDevToolsOverlay();
            }
        }
    }

    setInterval(checkDevToolsSize, 800);

    // ============================================
    // 5. DEVTOOLS DETECTION — Console log trick
    //    (When DevTools are open, toString is called on logged objects)
    // ============================================
    function checkDevToolsConsole() {
        const el = new Image();
        let isOpen = false;
        Object.defineProperty(el, 'id', {
            get: function () {
                isOpen = true;
                if (!devToolsOpen) {
                    devToolsOpen = true;
                    showDevToolsOverlay();
                }
            }
        });

        // Use %c to make the log invisible even if console is briefly shown
        console.log('%c', el);
        if (!isOpen && devToolsOpen) {
            // Recheck with size method before hiding
            checkDevToolsSize();
        }
    }

    setInterval(checkDevToolsConsole, 1500);

    // ============================================
    // 6. ANTI-DEBUGGER
    // ============================================
    (function antiDebug() {
        const start = performance.now();
        debugger;
        const end = performance.now();
        if (end - start > 100) {
            devToolsOpen = true;
            showDevToolsOverlay();
        }
        setTimeout(antiDebug, 4000);
    })();

    // ============================================
    // 7. CONSOLE METHODS OVERRIDE
    // ============================================
    const noop = function () { };
    const consoleMethods = [
        'log', 'warn', 'info', 'debug', 'dir', 'table',
        'trace', 'assert', 'count', 'countReset',
        'group', 'groupCollapsed', 'groupEnd',
        'time', 'timeLog', 'timeEnd', 'timeStamp',
        'profile', 'profileEnd', 'clear'
    ];

    try {
        consoleMethods.forEach(function (method) {
            if (console[method]) {
                console[method] = noop;
            }
        });
    } catch (_) { }

    // ============================================
    // 8. PREVENT IFRAME EMBEDDING (clickjacking protection)
    // ============================================
    try {
        if (window.top !== window.self) {
            window.top.location = window.self.location;
        }
    } catch (_) {
        // If cross-origin, show blank
        document.body.innerHTML = '';
        document.body.style.display = 'none';
    }

    // ============================================
    // 9. PREVENT PRINTING
    // ============================================
    const printStyle = document.createElement('style');
    printStyle.textContent = `
        @media print {
            body { display: none !important; }
            html::after {
                content: 'Impression non autorisée.';
                display: block;
                font-size: 2rem;
                text-align: center;
                padding: 4rem;
                color: #888;
            }
        }
    `;
    document.head.appendChild(printStyle);

    // Also intercept window.print
    window.print = function () { };

    // Block beforeprint event
    window.addEventListener('beforeprint', function (e) {
        e.preventDefault();
        document.body.style.display = 'none';
    });

    window.addEventListener('afterprint', function () {
        document.body.style.display = '';
    });

    // ============================================
    // 10. DEVTOOLS OVERLAY UI
    // ============================================
    function showDevToolsOverlay() {
        if (document.getElementById('np-devtools-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'np-devtools-overlay';
        overlay.innerHTML = `
            <div style="
                position: fixed;
                inset: 0;
                z-index: 999999;
                background: rgba(5, 5, 8, 0.98);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                text-align: center;
                font-family: 'Inter', system-ui, sans-serif;
                padding: 2rem;
                backdrop-filter: blur(20px);
            ">
                <div style="
                    position: absolute;
                    inset: 0;
                    background:
                        radial-gradient(ellipse 60% 40% at 30% 20%, rgba(239, 68, 68, 0.08) 0%, transparent 60%),
                        radial-gradient(ellipse 40% 50% at 70% 80%, rgba(239, 68, 68, 0.06) 0%, transparent 60%);
                    pointer-events: none;
                "></div>
                <div style="font-size: 4rem; margin-bottom: 1.5rem; animation: npShield 2s ease-in-out infinite; position: relative; z-index: 1;">🛡️</div>
                <h2 style="
                    font-size: 2rem;
                    font-weight: 800;
                    background: linear-gradient(135deg, #f87171, #ef4444, #dc2626);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    margin: 0 0 1rem;
                    position: relative;
                    z-index: 1;
                ">Accès Bloqué</h2>
                <p style="
                    color: rgba(200, 200, 230, 0.65);
                    font-size: 1.05rem;
                    max-width: 460px;
                    line-height: 1.7;
                    margin: 0 0 2rem;
                    position: relative;
                    z-index: 1;
                ">
                    Les outils de développement ont été détectés.<br>
                    Veuillez les fermer pour continuer à utiliser NovaPlay.
                </p>
                <div style="
                    padding: 12px 28px;
                    background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(185, 28, 28, 0.15));
                    border: 1px solid rgba(239, 68, 68, 0.4);
                    border-radius: 12px;
                    color: #fca5a5;
                    font-size: 0.85rem;
                    font-weight: 600;
                    position: relative;
                    z-index: 1;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                ">
                    <span style="font-size: 1.1rem;">⚠️</span>
                    Fermez les DevTools (F12) pour accéder au site
                </div>
                <p style="
                    color: rgba(200, 200, 230, 0.25);
                    font-size: 0.75rem;
                    margin-top: 2rem;
                    position: relative;
                    z-index: 1;
                ">NovaPlay Protection System v2.0</p>
            </div>
        `;

        const style = document.createElement('style');
        style.id = 'np-devtools-style';
        style.textContent = `
            @keyframes npShield {
                0%, 100% { transform: scale(1) rotate(0deg); }
                25% { transform: scale(1.1) rotate(-5deg); }
                75% { transform: scale(1.1) rotate(5deg); }
                50% { transform: scale(1.2) rotate(0deg); }
            }
            #np-devtools-overlay * {
                user-select: none !important;
                -webkit-user-select: none !important;
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(overlay);
    }

    function hideDevToolsOverlay() {
        const overlay = document.getElementById('np-devtools-overlay');
        const style = document.getElementById('np-devtools-style');
        if (overlay) overlay.remove();
        if (style) style.remove();
    }

    // ============================================
    // 11. CSS PROTECTION (no-select, no-pointer-events on images)
    // ============================================
    const protectStyle = document.createElement('style');
    protectStyle.textContent = `
        body {
            -webkit-user-select: none !important;
            -moz-user-select: none !important;
            -ms-user-select: none !important;
            user-select: none !important;
        }
        input, textarea, [contenteditable="true"] {
            -webkit-user-select: text !important;
            -moz-user-select: text !important;
            -ms-user-select: text !important;
            user-select: text !important;
        }
        img {
            pointer-events: none;
            -webkit-user-drag: none;
            user-drag: none;
        }
    `;
    document.head.appendChild(protectStyle);

    // ============================================
    // 12. PREVENT SOURCE VIEWING via view-source:
    //     (redirect if accessed via view-source protocol)
    // ============================================
    if (window.location.protocol === 'view-source:') {
        window.location.href = 'about:blank';
    }

    // ============================================
    // 13. MUTATION OBSERVER — Protect overlay from being removed
    // ============================================
    const observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            mutation.removedNodes.forEach(function (node) {
                if (node.id === 'np-devtools-overlay' && devToolsOpen) {
                    // Someone tried to remove our overlay via DevTools — re-add it
                    showDevToolsOverlay();
                }
            });
        });
    });

    observer.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true
    });

})();
