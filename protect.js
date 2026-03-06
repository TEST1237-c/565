/**
 * NovaPlay Protection System v3.0
 * Multi-layered client-side protection
 */
(function (_np) {
    'use strict';

    // ============================================
    // INTERNAL STATE (obfuscated names)
    // ============================================
    var _s = {
        _d: false,       // devtools detected
        _t: [],          // timer IDs
        _c: 0,           // check counter
        _h: Date.now(),  // heartbeat
        _k: 'np_' + Math.random().toString(36).slice(2, 8), // unique session key
        _f: false,       // frozen state
        _isM: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    };

    // Freeze state object to prevent tampering
    if (Object.freeze) Object.freeze(_s);

    // ============================================
    // 1. BLOCK CONTEXT MENU
    // ============================================
    var _bCM = function (e) { e.preventDefault(); return false; };
    document.addEventListener('contextmenu', _bCM, true);
    window.addEventListener('contextmenu', _bCM, true);

    // ============================================
    // 2. ADVANCED KEYBOARD SHORTCUT BLOCKING
    // ============================================
    var _blockedKeys = {
        123: true,   // F12
    };
    var _blockedCtrl = {
        85: true,  // U (view source)
        83: true,  // S (save)
        80: true,  // P (print)
        72: true,  // H (history)
        74: true,  // J (downloads)
        71: true,  // G (find)
    };
    var _blockedCtrlShift = {
        73: true,  // I (inspect)
        74: true,  // J (console)
        67: true,  // C (element picker)
        75: true,  // K (firefox console)
        77: true,  // M (responsive)
        83: true,  // S (save as)
        69: true,  // E (network, Edge)
        81: true,  // Q (firefox devtools)
    };

    function _blockKeys(e) {
        var kc = e.keyCode || e.which;

        // F-keys
        if (_blockedKeys[kc]) {
            e.preventDefault(); e.stopImmediatePropagation(); return false;
        }
        // Ctrl+Key
        if (e.ctrlKey && !e.shiftKey && _blockedCtrl[kc]) {
            if (kc === 67 && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
            e.preventDefault(); e.stopImmediatePropagation(); return false;
        }
        // Ctrl+Shift+Key
        if (e.ctrlKey && e.shiftKey && _blockedCtrlShift[kc]) {
            e.preventDefault(); e.stopImmediatePropagation(); return false;
        }
        // Ctrl+A (select all, except inputs)
        if (e.ctrlKey && kc === 65) {
            if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault(); e.stopImmediatePropagation(); return false;
            }
        }
    }

    document.addEventListener('keydown', _blockKeys, true);
    window.addEventListener('keydown', _blockKeys, true);

    // ============================================
    // 3. BLOCK SELECTION, DRAG, COPY, CUT
    // ============================================
    function _isInput(t) { return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable); }

    document.addEventListener('selectstart', function (e) { if (!_isInput(e.target)) e.preventDefault(); }, true);
    document.addEventListener('dragstart', function (e) { e.preventDefault(); }, true);
    document.addEventListener('copy', function (e) { if (!_isInput(e.target)) e.preventDefault(); }, true);
    document.addEventListener('cut', function (e) { if (!_isInput(e.target)) e.preventDefault(); }, true);

    // ============================================
    // 4. DEVTOOLS DETECTION — METHOD 1: Window size delta
    // ============================================
    var _thresh = 160;

    function _checkSize() {
        if (_s._isM) return; // Skip size check on mobile (unreliable due to browser toolbars)
        var w = window.outerWidth - window.innerWidth > _thresh;
        var h = window.outerHeight - window.innerHeight > _thresh;
        if (w || h) _onDetect('size');
        else _onClear('size');
    }

    // ============================================
    // 5. DEVTOOLS DETECTION — METHOD 2: Console getter trap
    // ============================================
    function _checkConsoleGetter() {
        var _img = new Image();
        var _triggered = false;
        Object.defineProperty(_img, 'id', {
            get: function () {
                _triggered = true;
                _onDetect('getter');
            }
        });
        try { console.log('%c', _img); } catch (_) { }
        if (!_triggered) _onClear('getter');
    }

    // ============================================
    // 6. DEVTOOLS DETECTION — METHOD 3: toString / regex trap
    // ============================================
    function _checkToString() {
        var _r = /./;
        var _count = 0;
        _r.toString = function () {
            _count++;
            if (_count > 1) _onDetect('toString');
            return '';
        };
        try { console.log(_r); } catch (_) { }
        if (_count <= 1) _onClear('toString');
    }

    // ============================================
    // 7. DEVTOOLS DETECTION — METHOD 4: Performance timing
    // ============================================
    function _checkTiming() {
        if (_s._isM) return; // Skip timing check on mobile (can be slow or trigger debugger falsely)
        var t0 = performance.now();
        for (var i = 0; i < 100; i++) {
            // Force layout/reflow detection — significantly slower with DevTools open
            (function () { return i; })();
        }
        debugger;
        var t1 = performance.now();
        if (t1 - t0 > 100) _onDetect('timing');
        else _onClear('timing');
    }

    // ============================================
    // 8. DEVTOOLS DETECTION — METHOD 5: Date.toLocaleString hack
    // ============================================
    function _checkDateTrap() {
        var _date = new Date();
        var _detected = false;
        _date.toString = function () {
            _detected = true;
            _onDetect('dateTrap');
            return '';
        };
        try { console.log(_date); } catch (_) { }
        if (!_detected) _onClear('dateTrap');
    }

    // ============================================
    // DETECTION MANAGER (requires 1+ methods to trigger)
    // ============================================
    var _detections = {};

    function _onDetect(method) {
        if (_s._isM) return; // Never trigger detection on mobile
        _detections[method] = true;
        if (!_s._d) {
            _s = { _d: true, _t: _s._t, _c: _s._c + 1, _h: Date.now(), _k: _s._k, _f: _s._f, _isM: _s._isM };
            _showOverlay();
        }
    }

    function _onClear(method) {
        delete _detections[method];
        // Only clear if ALL methods report clean
        if (Object.keys(_detections).length === 0 && _s._d) {
            _s = { _d: false, _t: _s._t, _c: _s._c, _h: Date.now(), _k: _s._k, _f: _s._f, _isM: _s._isM };
            _hideOverlay();
        }
    }

    // Run all detection methods on staggered intervals
    _s._t.push(setInterval(_checkSize, 700));
    _s._t.push(setInterval(_checkConsoleGetter, 1200));
    _s._t.push(setInterval(_checkToString, 1800));
    _s._t.push(setInterval(_checkTiming, 5000));
    _s._t.push(setInterval(_checkDateTrap, 2500));

    // ============================================
    // 9. CONSOLE OVERRIDE (hardened)
    // ============================================
    var _noop = function () { return undefined; };
    var _methods = [
        'log', 'warn', 'info', 'debug', 'error', 'dir', 'table',
        'trace', 'assert', 'count', 'countReset',
        'group', 'groupCollapsed', 'groupEnd',
        'time', 'timeLog', 'timeEnd', 'timeStamp',
        'profile', 'profileEnd', 'clear'
    ];

    function _killConsole() {
        try {
            _methods.forEach(function (m) {
                try {
                    Object.defineProperty(console, m, {
                        get: function () { return _noop; },
                        set: function () { },
                        configurable: false
                    });
                } catch (_) {
                    try { console[m] = _noop; } catch (__) { }
                }
            });
        } catch (_) { }
    }
    _killConsole();
    // Re-kill periodically in case someone restores it
    _s._t.push(setInterval(_killConsole, 2000));

    // ============================================
    // 10. ANTI-IFRAME (clickjacking)
    // ============================================
    try {
        if (window.top !== window.self) {
            window.top.location = window.self.location;
        }
    } catch (_) {
        try {
            document.documentElement.innerHTML = '';
        } catch (__) { }
    }

    // ============================================
    // 11. PREVENT PRINTING
    // ============================================
    var _printCSS = document.createElement('style');
    _printCSS.id = 'np-print-block';
    _printCSS.textContent = '@media print{body{display:none!important}html::after{content:"Impression non autorisée - NovaPlay";display:block;font-size:2rem;text-align:center;padding:4rem;color:#888}}';
    document.head.appendChild(_printCSS);

    try {
        Object.defineProperty(window, 'print', {
            get: function () { return function () { }; },
            set: function () { },
            configurable: false
        });
    } catch (_) {
        window.print = function () { };
    }

    window.addEventListener('beforeprint', function () {
        document.body.style.display = 'none';
    });
    window.addEventListener('afterprint', function () {
        document.body.style.display = '';
    });

    // ============================================
    // 12. PROTECTION CSS
    // ============================================
    var _protCSS = document.createElement('style');
    _protCSS.id = 'np-protect-css';
    _protCSS.textContent = [
        'body{-webkit-user-select:none!important;-moz-user-select:none!important;user-select:none!important}',
        'input,textarea,[contenteditable="true"]{-webkit-user-select:text!important;-moz-user-select:text!important;user-select:text!important}',
        'img,video,canvas{pointer-events:none;-webkit-user-drag:none;user-drag:none}',
        'a img{pointer-events:auto}'
    ].join('');
    document.head.appendChild(_protCSS);

    // ============================================
    // 13. OVERLAY UI
    // ============================================
    function _showOverlay() {
        if (document.getElementById('np-dt-ov')) return;

        var ov = document.createElement('div');
        ov.id = 'np-dt-ov';
        ov.setAttribute('style', 'position:fixed;inset:0;z-index:2147483647;pointer-events:all;');
        ov.innerHTML = '<div style="position:fixed;inset:0;z-index:2147483647;background:rgba(5,5,8,0.98);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;font-family:Inter,system-ui,sans-serif;padding:2rem;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px)">'
            + '<div style="position:absolute;inset:0;background:radial-gradient(ellipse 60% 40% at 30% 20%,rgba(239,68,68,0.08) 0%,transparent 60%),radial-gradient(ellipse 40% 50% at 70% 80%,rgba(239,68,68,0.06) 0%,transparent 60%);pointer-events:none"></div>'
            + '<div style="font-size:4rem;margin-bottom:1.5rem;animation:npSh 2s ease-in-out infinite;position:relative;z-index:1">🛡️</div>'
            + '<h2 style="font-size:2rem;font-weight:800;background:linear-gradient(135deg,#f87171,#ef4444,#dc2626);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin:0 0 1rem;position:relative;z-index:1">Accès Bloqué</h2>'
            + '<p style="color:rgba(200,200,230,0.65);font-size:1.05rem;max-width:460px;line-height:1.7;margin:0 0 2rem;position:relative;z-index:1">Les outils de développement ont été détectés.<br>Veuillez les fermer pour continuer à utiliser NovaPlay.</p>'
            + '<div style="padding:12px 28px;background:linear-gradient(135deg,rgba(239,68,68,0.2),rgba(185,28,28,0.15));border:1px solid rgba(239,68,68,0.4);border-radius:12px;color:#fca5a5;font-size:0.85rem;font-weight:600;position:relative;z-index:1;display:flex;align-items:center;gap:0.5rem"><span style="font-size:1.1rem">⚠️</span>Fermez les DevTools (F12) pour accéder au site</div>'
            + '<p style="color:rgba(200,200,230,0.25);font-size:0.72rem;margin-top:2rem;position:relative;z-index:1">NovaPlay Protection System v3.0</p>'
            + '</div>';

        var st = document.createElement('style');
        st.id = 'np-dt-st';
        st.textContent = '@keyframes npSh{0%,100%{transform:scale(1) rotate(0deg)}25%{transform:scale(1.1) rotate(-5deg)}50%{transform:scale(1.2) rotate(0deg)}75%{transform:scale(1.1) rotate(5deg)}}#np-dt-ov,#np-dt-ov *{user-select:none!important;-webkit-user-select:none!important;pointer-events:auto!important}';
        document.head.appendChild(st);
        document.body.appendChild(ov);
    }

    function _hideOverlay() {
        var ov = document.getElementById('np-dt-ov');
        var st = document.getElementById('np-dt-st');
        if (ov) ov.remove();
        if (st) st.remove();
    }

    // ============================================
    // 14. MUTATION OBSERVER — Self-healing protection
    //     Prevents removal of overlay AND protection styles
    // ============================================
    function _initObserver() {
        var _obs = new MutationObserver(function (mutations) {
            for (var i = 0; i < mutations.length; i++) {
                var m = mutations[i];
                // Check removed nodes
                for (var j = 0; j < m.removedNodes.length; j++) {
                    var node = m.removedNodes[j];
                    if (!node || !node.id) continue;
                    // Re-add overlay if removed while devtools detected
                    if (node.id === 'np-dt-ov' && _s._d) {
                        setTimeout(_showOverlay, 50);
                    }
                    // Re-add protection CSS if removed
                    if (node.id === 'np-protect-css') {
                        setTimeout(function () {
                            if (!document.getElementById('np-protect-css')) {
                                document.head.appendChild(_protCSS.cloneNode(true));
                            }
                        }, 50);
                    }
                    // Re-add print block if removed
                    if (node.id === 'np-print-block') {
                        setTimeout(function () {
                            if (!document.getElementById('np-print-block')) {
                                document.head.appendChild(_printCSS.cloneNode(true));
                            }
                        }, 50);
                    }
                }
                // Check modified attributes on overlay
                if (m.type === 'attributes' && m.target.id === 'np-dt-ov') {
                    m.target.setAttribute('style', 'position:fixed;inset:0;z-index:2147483647;pointer-events:all;');
                }
            }
        });

        _obs.observe(document.documentElement, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class', 'hidden']
        });
    }

    if (document.body) {
        _initObserver();
    } else {
        document.addEventListener('DOMContentLoaded', _initObserver);
    }

    // ============================================
    // 15. SELF-CHECK HEARTBEAT
    //     Verifies protection is still running
    // ============================================
    _s._t.push(setInterval(function () {
        // Re-attach key listeners if removed
        document.removeEventListener('keydown', _blockKeys, true);
        document.addEventListener('keydown', _blockKeys, true);

        document.removeEventListener('contextmenu', _bCM, true);
        document.addEventListener('contextmenu', _bCM, true);

        // Ensure CSS protection exists
        if (!document.getElementById('np-protect-css')) {
            var c = _protCSS.cloneNode(true);
            document.head.appendChild(c);
        }
    }, 3000));

    // ============================================
    // 16. BLOCK EXTERNAL SCRIPT INJECTION
    //     Detect if someone tries to inject scripts via console
    // ============================================
    var _origCreate = document.createElement;
    document.createElement = function () {
        var el = _origCreate.apply(document, arguments);
        if (arguments[0] && arguments[0].toLowerCase() === 'script') {
            // Wrap script elements to detect suspicious injections
            var _origSrc = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src');
            if (_origSrc && _origSrc.set) {
                var _realSet = _origSrc.set;
                Object.defineProperty(el, 'src', {
                    set: function (val) {
                        // Allow same-origin scripts, block others from console injection
                        if (typeof val === 'string' && val.indexOf('chrome-extension') === 0) {
                            return; // block extension injection
                        }
                        _realSet.call(el, val);
                    },
                    get: function () {
                        return _origSrc.get ? _origSrc.get.call(el) : '';
                    }
                });
            }
        }
        return el;
    };

    // ============================================
    // 17. PROTECT AGAINST eval() AND Function() ABUSE
    // ============================================
    try {
        var _origEval = window.eval;
        window.eval = function (code) {
            if (typeof code === 'string') {
                // Block attempts to disable protection
                var _lower = code.toLowerCase();
                if (_lower.indexOf('np-dt-ov') !== -1 ||
                    _lower.indexOf('np-protect') !== -1 ||
                    _lower.indexOf('removeEventListener') !== -1 ||
                    _lower.indexOf('devtools') !== -1 ||
                    _lower.indexOf('debugger') !== -1) {
                    return undefined;
                }
            }
            return _origEval.call(window, code);
        };
    } catch (_) { }

    // ============================================
    // 18. VIEW-SOURCE PROTECTION
    // ============================================
    if (window.location.protocol === 'view-source:') {
        window.location.href = 'about:blank';
    }

})(window);
