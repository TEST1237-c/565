(function () {
    'use strict';

    document.addEventListener('contextmenu', function (e) {
        e.preventDefault();
        showWarning();
    });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'F12') {
            e.preventDefault();
            showWarning();
            return;
        }

        if (e.ctrlKey && e.shiftKey && e.key === 'I') {
            e.preventDefault();
            showWarning();
            return;
        }

        if (e.ctrlKey && e.shiftKey && e.key === 'J') {
            e.preventDefault();
            showWarning();
            return;
        }

        if (e.ctrlKey && e.shiftKey && e.key === 'C') {
            e.preventDefault();
            showWarning();
            return;
        }

        if (e.ctrlKey && e.key === 'u') {
            e.preventDefault();
            showWarning();
            return;
        }

        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            showWarning();
            return;
        }

        if (e.ctrlKey && e.shiftKey && e.key === 'S') {
            e.preventDefault();
            showWarning();
            return;
        }

        if (e.ctrlKey && e.key === 'a') {
            e.preventDefault();
            return;
        }
        if (e.ctrlKey && e.key === 'c') {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            e.preventDefault();
            return;
        }
    });

    document.addEventListener('selectstart', function (e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        e.preventDefault();
    });

    document.addEventListener('dragstart', function (e) {
        e.preventDefault();
    });
    let devToolsOpen = false;
    const threshold = 160;

    function checkDevTools() {
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

    setInterval(checkDevTools, 1000);

    (function antiDebug() {
        const start = performance.now();
        debugger;
        const end = performance.now();
        if (end - start > 100) {
            showDevToolsOverlay();
        }
        setTimeout(antiDebug, 3000);
    })();

    const noop = function () { };
    try {
        console.log = noop;
        console.warn = noop;
        console.info = noop;
        console.debug = noop;
        console.dir = noop;
        console.table = noop;
    } catch (_) { }

    function showWarning() {
        if (document.getElementById('np-protect-toast')) return;

        const toast = document.createElement('div');
        toast.id = 'np-protect-toast';
        toast.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 999999;
                background: linear-gradient(135deg, rgba(239, 68, 68, 0.95), rgba(185, 28, 28, 0.95));
                color: white;
                padding: 16px 24px;
                border-radius: 12px;
                font-family: 'Inter', system-ui, sans-serif;
                font-size: 14px;
                font-weight: 600;
                box-shadow: 0 8px 32px rgba(239, 68, 68, 0.4);
                backdrop-filter: blur(12px);
                display: flex;
                align-items: center;
                gap: 10px;
                animation: npToastIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                max-width: 380px;
            ">
                <span style="font-size: 20px;">🛡️</span>
                <span>Action bloquée — Le code source est protégé.</span>
            </div>
        `;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes npToastIn {
                from { opacity: 0; transform: translateX(60px) scale(0.9); }
                to   { opacity: 1; transform: translateX(0) scale(1); }
            }
            @keyframes npToastOut {
                from { opacity: 1; transform: translateX(0) scale(1); }
                to   { opacity: 0; transform: translateX(60px) scale(0.9); }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(toast);

        setTimeout(() => {
            const el = toast.querySelector('div');
            if (el) el.style.animation = 'npToastOut 0.3s ease forwards';
            setTimeout(() => {
                toast.remove();
                style.remove();
            }, 300);
        }, 3000);
    }

    function showDevToolsOverlay() {
        if (document.getElementById('np-devtools-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'np-devtools-overlay';
        overlay.innerHTML = `
            <div style="
                position: fixed;
                inset: 0;
                z-index: 999999;
                background: rgba(5, 5, 8, 0.97);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                text-align: center;
                font-family: 'Inter', system-ui, sans-serif;
                padding: 2rem;
            ">
                <div style="font-size: 4rem; margin-bottom: 1.5rem; animation: npShield 2s ease-in-out infinite;">🛡️</div>
                <h2 style="
                    font-size: 2rem;
                    font-weight: 800;
                    background: linear-gradient(135deg, #f87171, #ef4444, #dc2626);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    margin: 0 0 1rem;
                ">DevTools Détectés</h2>
                <p style="
                    color: rgba(200, 200, 230, 0.65);
                    font-size: 1.05rem;
                    max-width: 460px;
                    line-height: 1.7;
                    margin: 0 0 2rem;
                ">
                    Les outils de développement sont ouverts.<br>
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
                ">Fermez les DevTools (F12) pour accéder au site</div>
            </div>
        `;

        const style = document.createElement('style');
        style.id = 'np-devtools-style';
        style.textContent = `
            @keyframes npShield {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.15); }
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

    const protectStyle = document.createElement('style');
    protectStyle.textContent = `
        body {
            -webkit-user-select: none !important;
            -moz-user-select: none !important;
            -ms-user-select: none !important;
            user-select: none !important;
        }
        input, textarea {
            -webkit-user-select: text !important;
            -moz-user-select: text !important;
            -ms-user-select: text !important;
            user-select: text !important;
        }
    `;
    document.head.appendChild(protectStyle);

})();
