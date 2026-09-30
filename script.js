// ============================================
// THEME LOADER — reads theme.json and applies
// data-theme on <html> for every page
// ============================================
(function applyTheme() {
    // 1. Apply cached value instantly to avoid flash
    const cached = localStorage.getItem('siteTheme');
    if (cached && cached !== 'default') {
        document.documentElement.setAttribute('data-theme', cached);
    }

    // 2. Fetch live theme from unified API
    fetch('/api/theme', { cache: 'no-store' })
        .then(r => r.ok ? r.json() : { theme: 'default' })
        .then(data => {
            const theme = data.theme || 'default';
            localStorage.setItem('siteTheme', theme);
            if (theme === 'default') {
                document.documentElement.removeAttribute('data-theme');
            } else {
                document.documentElement.setAttribute('data-theme', theme);
            }
        })
        .catch(() => { /* keep cached value on network error */ });
})();

// ============================================
// HALLOWEEN EFFECT — bats, pumpkins, embers,
// spiderwebs, fog. No lightning.
// ============================================
(function initHalloween() {
    let canvas, ctx, animId = null;
    let bats = [], embers = [], fogLayers = [];
    let frameCount = 0;

    /* ── helpers ── */
    const rand  = (a, b) => a + Math.random() * (b - a);
    const randI = (a, b) => Math.floor(rand(a, b));

    /* ══════════════════════════════════════
       BATS
    ══════════════════════════════════════ */
    function createBat(w, h, fromEdge = false) {
        const goRight = Math.random() < 0.5;
        return {
            x:        fromEdge ? (goRight ? -60 : w + 60) : rand(0, w),
            y:        rand(30, h * 0.52),
            size:     rand(12, 26),
            speedX:   (goRight ? 1 : -1) * rand(0.7, 1.8),
            speedY:   rand(-0.3, 0.3),
            flap:     rand(0, Math.PI * 2),
            flapSpd:  rand(0.10, 0.16),
            wobble:   rand(0, Math.PI * 2),
            wobAmp:   rand(0.25, 0.7),
            opacity:  rand(0.6, 0.95),
        };
    }

    function drawBat(b) {
        const s = b.size;
        const wing = Math.sin(b.flap);          // -1 … 1

        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.globalAlpha = b.opacity;

        // Wing shadow / depth
        ctx.shadowColor = 'rgba(249,115,22,0.55)';
        ctx.shadowBlur  = 12;

        // ── left wing ──
        ctx.beginPath();
        ctx.moveTo(-s * 0.22, 0);
        ctx.bezierCurveTo(-s * 0.65,  wing * s * 0.55, -s * 1.15,  wing * s * 0.85, -s * 0.95,  wing * s * 0.4);
        ctx.bezierCurveTo(-s * 0.65,  wing * s * 0.15, -s * 0.32,  wing * s * 0.05, -s * 0.22, 0);
        // wing membrane notch
        ctx.moveTo(-s * 0.6, wing * s * 0.45);
        ctx.bezierCurveTo(-s * 0.72, wing * s * 0.62, -s * 0.82, wing * s * 0.7, -s * 0.72, wing * s * 0.5);
        ctx.fillStyle = '#1a0520';
        ctx.fill();

        // ── right wing ──
        ctx.beginPath();
        ctx.moveTo(s * 0.22, 0);
        ctx.bezierCurveTo(s * 0.65,  wing * s * 0.55, s * 1.15,  wing * s * 0.85, s * 0.95,  wing * s * 0.4);
        ctx.bezierCurveTo(s * 0.65,  wing * s * 0.15, s * 0.32,  wing * s * 0.05, s * 0.22, 0);
        ctx.moveTo(s * 0.6, wing * s * 0.45);
        ctx.bezierCurveTo(s * 0.72, wing * s * 0.62, s * 0.82, wing * s * 0.7, s * 0.72, wing * s * 0.5);
        ctx.fillStyle = '#1a0520';
        ctx.fill();

        // ── body ──
        ctx.beginPath();
        ctx.ellipse(0, 0, s * 0.22, s * 0.32, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#160318';
        ctx.fill();

        // ── ears ──
        [[−1, 1]].concat([[1, 1]]).forEach(([side]) => {
            ctx.beginPath();
            ctx.moveTo(side * s * 0.08, -s * 0.28);
            ctx.lineTo(side * s * 0.16, -s * 0.52);
            ctx.lineTo(side * s * 0.22, -s * 0.28);
            ctx.closePath();
            ctx.fillStyle = '#2a0530';
            ctx.fill();
        });

        // ── glowing eyes ──
        [[-0.08, 0.02], [0.08, 0.02]].forEach(([ex, ey]) => {
            const g = ctx.createRadialGradient(ex*s, ey*s, 0, ex*s, ey*s, s*0.07);
            g.addColorStop(0,   '#ff9500');
            g.addColorStop(0.5, '#f97316');
            g.addColorStop(1,   'rgba(249,115,22,0)');
            ctx.beginPath();
            ctx.arc(ex * s, ey * s, s * 0.07, 0, Math.PI * 2);
            ctx.fillStyle = g;
            ctx.shadowColor = '#f97316';
            ctx.shadowBlur  = 10;
            ctx.fill();
        });

        ctx.restore();
    }

    /* ══════════════════════════════════════
       EMBERS / SPARKS
    ══════════════════════════════════════ */
    function createEmber(w, h) {
        return {
            x:      rand(0, w),
            y:      h + rand(0, 30),
            size:   rand(1.5, 4.5),
            speedY: -rand(0.6, 1.8),
            speedX: rand(-0.4, 0.4),
            life:   1.0,
            decay:  rand(0.003, 0.009),
            hue:    randI(15, 45),       // orange–yellow
        };
    }

    function drawEmber(e) {
        ctx.save();
        ctx.globalAlpha = e.life * 0.85;
        ctx.shadowColor = `hsl(${e.hue},100%,60%)`;
        ctx.shadowBlur  = 8;
        const g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.size);
        g.addColorStop(0,   `hsl(${e.hue+20},100%,92%)`);
        g.addColorStop(0.4, `hsl(${e.hue},100%,65%)`);
        g.addColorStop(1,   `hsla(${e.hue-10},100%,40%,0)`);
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
        ctx.restore();
    }

    /* ══════════════════════════════════════
       PUMPKINS  (drawn on canvas, float near bottom)
    ══════════════════════════════════════ */
    function createPumpkin(w, h) {
        return {
            x:     rand(0, w),
            y:     h - rand(60, 180),
            size:  rand(22, 48),
            phase: rand(0, Math.PI * 2),
            speed: rand(0.008, 0.018),
        };
    }

    function drawPumpkin(p) {
        const s = p.size;
        const bob = Math.sin(p.phase) * 4;

        ctx.save();
        ctx.translate(p.x, p.y + bob);
        ctx.globalAlpha = 0.82;

        // Glow
        ctx.shadowColor = '#f97316';
        ctx.shadowBlur  = 20;

        // Body lobes (5 ellipses)
        const lobeW = s * 0.38, lobeH = s * 0.52;
        const offsets = [-s*0.56, -s*0.28, 0, s*0.28, s*0.56];
        offsets.forEach((ox, i) => {
            const w2 = i === 0 || i === 4 ? lobeW * 0.7 : lobeW;
            ctx.beginPath();
            ctx.ellipse(ox, 0, w2, lobeH * (i === 0||i===4 ? 0.85 : 1), 0, 0, Math.PI * 2);
            const g = ctx.createRadialGradient(ox - s*0.08, -s*0.1, s*0.05, ox, 0, w2 * 1.4);
            g.addColorStop(0,   '#ffa500');
            g.addColorStop(0.5, '#e85d04');
            g.addColorStop(1,   '#7c2d12');
            ctx.fillStyle = g;
            ctx.fill();
        });

        // Stem
        ctx.beginPath();
        ctx.moveTo(-s*0.06, -lobeH);
        ctx.bezierCurveTo(-s*0.06, -lobeH - s*0.28, s*0.18, -lobeH - s*0.32, s*0.14, -lobeH - s*0.18);
        ctx.lineWidth   = s * 0.1;
        ctx.strokeStyle = '#3d1a00';
        ctx.lineCap     = 'round';
        ctx.shadowBlur  = 0;
        ctx.stroke();

        // Face — glowing triangle eyes + mouth
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur  = 14;
        ctx.fillStyle   = '#fbbf24';

        // Left eye
        ctx.beginPath();
        ctx.moveTo(-s*0.3, -s*0.12);
        ctx.lineTo(-s*0.18, -s*0.28);
        ctx.lineTo(-s*0.06, -s*0.12);
        ctx.closePath(); ctx.fill();

        // Right eye
        ctx.beginPath();
        ctx.moveTo(s*0.06, -s*0.12);
        ctx.lineTo(s*0.18, -s*0.28);
        ctx.lineTo(s*0.3,  -s*0.12);
        ctx.closePath(); ctx.fill();

        // Jagged mouth
        ctx.beginPath();
        ctx.moveTo(-s*0.34, s*0.1);
        ctx.lineTo(-s*0.22, s*0.22);
        ctx.lineTo(-s*0.12, s*0.1);
        ctx.lineTo(-s*0.02, s*0.24);
        ctx.lineTo( s*0.08, s*0.1);
        ctx.lineTo( s*0.18, s*0.24);
        ctx.lineTo( s*0.28, s*0.1);
        ctx.lineTo( s*0.34, s*0.22);
        ctx.lineWidth   = s * 0.08;
        ctx.strokeStyle = '#fbbf24';
        ctx.lineJoin    = 'round';
        ctx.stroke();

        ctx.restore();
    }

    /* ══════════════════════════════════════
       SPIDER WEBS  (canvas corners)
    ══════════════════════════════════════ */
    function drawSpiderWeb(cx, cy, radius, flip) {
        ctx.save();
        ctx.translate(cx, cy);
        if (flip) ctx.scale(-1, 1);
        ctx.globalAlpha = 0.22;
        ctx.strokeStyle = '#d4b8e0';
        ctx.lineWidth   = 0.7;
        ctx.shadowColor = '#a855f7';
        ctx.shadowBlur  = 6;

        const spokes = 7;
        const rings  = 6;

        // Radial spokes
        for (let i = 0; i < spokes; i++) {
            const angle = (Math.PI / 2) * (i / (spokes - 1));
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
            ctx.stroke();
        }

        // Concentric arc rings
        for (let r = 1; r <= rings; r++) {
            const rr = (r / rings) * radius;
            ctx.beginPath();
            for (let i = 0; i < spokes; i++) {
                const a1 = (Math.PI / 2) * (i / (spokes - 1));
                const a2 = (Math.PI / 2) * ((i + 1) / (spokes - 1));
                const p1x = Math.cos(a1) * rr, p1y = Math.sin(a1) * rr;
                const p2x = Math.cos(a2) * rr, p2y = Math.sin(a2) * rr;
                const cpx = Math.cos((a1+a2)/2) * rr * 1.08;
                const cpy = Math.sin((a1+a2)/2) * rr * 1.08;
                if (i === 0) ctx.moveTo(p1x, p1y);
                ctx.quadraticCurveTo(cpx, cpy, p2x, p2y);
            }
            ctx.stroke();
        }

        // Spider body
        ctx.globalAlpha = 0.55;
        ctx.fillStyle   = '#2d0a3a';
        const spiderR   = radius * 0.38;
        const spiderA   = (Math.PI / 2) * 0.55;
        const sx = Math.cos(spiderA) * spiderR;
        const sy = Math.sin(spiderA) * spiderR;
        ctx.beginPath(); ctx.arc(sx, sy, 5, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(sx, sy + 7, 3.5, 0, Math.PI*2); ctx.fill();

        ctx.restore();
    }

    /* ══════════════════════════════════════
       FOG LAYERS
    ══════════════════════════════════════ */
    function createFogLayer(w, h, i) {
        return {
            x:      rand(-w * 0.5, w * 0.5),
            y:      h * (0.6 + i * 0.12),
            w:      rand(w * 0.6, w * 1.2),
            h:      rand(60, 130),
            speedX: rand(0.08, 0.25) * (Math.random()<0.5?1:-1),
            opacity: rand(0.04, 0.10),
            phase:  rand(0, Math.PI*2),
        };
    }

    function drawFog(f, t, canvasW) {
        f.x += f.speedX;
        if (f.x > canvasW + f.w) f.x = -f.w;
        if (f.x < -f.w)          f.x = canvasW + f.w;

        const pulse = 1 + 0.12 * Math.sin(t + f.phase);
        const g = ctx.createRadialGradient(
            f.x + f.w/2, f.y, 0,
            f.x + f.w/2, f.y, (f.w/2) * pulse
        );
        g.addColorStop(0,   `rgba(90,10,100,${f.opacity * 1.4})`);
        g.addColorStop(0.5, `rgba(50,5,60, ${f.opacity * 0.6})`);
        g.addColorStop(1,   'rgba(0,0,0,0)');
        ctx.beginPath();
        ctx.ellipse(f.x + f.w/2, f.y, (f.w/2)*pulse, f.h*pulse*0.5, 0, 0, Math.PI*2);
        ctx.fillStyle = g;
        ctx.fill();
    }

    /* ══════════════════════════════════════
       MOON
    ══════════════════════════════════════ */
    function drawMoon(w) {
        const mx = w * 0.83, my = 80, mr = 42;

        // Outer atmospheric halo
        [3.5, 2.5, 1.8].forEach((mult, i) => {
            const g = ctx.createRadialGradient(mx, my, mr, mx, my, mr*mult);
            g.addColorStop(0,   `rgba(255,180,40,${0.07 - i*0.02})`);
            g.addColorStop(1,   'rgba(0,0,0,0)');
            ctx.beginPath();
            ctx.arc(mx, my, mr*mult, 0, Math.PI*2);
            ctx.fillStyle = g;
            ctx.fill();
        });

        // Moon disk
        ctx.beginPath();
        ctx.arc(mx, my, mr, 0, Math.PI*2);
        const moon = ctx.createRadialGradient(mx-10, my-10, 4, mx, my, mr);
        moon.addColorStop(0,   '#fffbe6');
        moon.addColorStop(0.4, '#ffd060');
        moon.addColorStop(0.8, '#d4800a');
        moon.addColorStop(1,   '#7a3a00');
        ctx.fillStyle   = moon;
        ctx.shadowColor = '#ffb020';
        ctx.shadowBlur  = 40;
        ctx.fill();
        ctx.shadowBlur  = 0;

        // Craters
        [[mx-12,my+9,8],[mx+14,my-13,5.5],[mx+5,my+16,4.5],[mx-4,my-16,3]].forEach(([cx,cy,cr])=>{
            ctx.beginPath();
            ctx.arc(cx,cy,cr,0,Math.PI*2);
            ctx.fillStyle = 'rgba(150,70,0,0.18)';
            ctx.fill();
        });

        // Silhouette flying bat across moon (decorative, static)
        ctx.save();
        ctx.translate(mx - 5, my - 8);
        ctx.fillStyle = '#0c0a0e';
        ctx.globalAlpha = 0.7;
        // tiny bat silhouette
        ctx.beginPath();
        ctx.ellipse(0, 0, 4, 5, 0, 0, Math.PI*2); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-4,0); ctx.bezierCurveTo(-12,-8,-18,-3,-12,3);
        ctx.bezierCurveTo(-9,5,-5,2,-4,0); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(4,0); ctx.bezierCurveTo(12,-8,18,-3,12,3);
        ctx.bezierCurveTo(9,5,5,2,4,0); ctx.fill();
        ctx.restore();
    }

    /* ══════════════════════════════════════
       MAIN LOOP
    ══════════════════════════════════════ */
    let pumpkins = [];

    function draw() {
        const w = canvas.width, h = canvas.height;
        ctx.clearRect(0, 0, w, h);
        frameCount++;
        const t = frameCount * 0.01;

        // Moon
        drawMoon(w);

        // Spider webs — top-left and top-right corners
        drawSpiderWeb(0, 0, Math.min(w, h) * 0.22, false);
        drawSpiderWeb(w, 0, Math.min(w, h) * 0.22, true);

        // Fog
        for (const f of fogLayers) drawFog(f, t, w);

        // Pumpkins
        for (const p of pumpkins) {
            p.phase += p.speed;
            drawPumpkin(p);
        }

        // Embers — spawn ~2/frame
        if (Math.random() < 0.6) embers.push(createEmber(w, h));
        if (Math.random() < 0.4) embers.push(createEmber(w, h));
        for (let i = embers.length - 1; i >= 0; i--) {
            const e = embers[i];
            e.x    += e.speedX + Math.sin(t * 3 + i) * 0.3;
            e.y    += e.speedY;
            e.life -= e.decay;
            if (e.life <= 0 || e.y < -10) { embers.splice(i, 1); continue; }
            drawEmber(e);
        }

        // Bats
        for (const b of bats) {
            b.flap   += b.flapSpd;
            b.wobble += 0.016;
            b.x      += b.speedX;
            b.y      += b.speedY + Math.sin(b.wobble) * b.wobAmp;
            if (b.y < 15)      { b.y = 15;      b.speedY = Math.abs(b.speedY); }
            if (b.y > h * 0.6) { b.y = h * 0.6; b.speedY = -Math.abs(b.speedY); }
            if (b.x < -80 || b.x > w + 80) Object.assign(b, createBat(w, h, true));
            drawBat(b);
        }

        animId = requestAnimationFrame(draw);
    }

    function startHalloween() {
        if (canvas) return;
        canvas = document.createElement('canvas');
        canvas.id = 'halloweenCanvas';
        canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9997';
        document.body.appendChild(canvas);
        ctx = canvas.getContext('2d');

        const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
        resize();
        window.addEventListener('resize', resize);

        const w = canvas.width, h = canvas.height;
        bats      = Array.from({ length: 16 }, () => createBat(w, h));
        fogLayers = Array.from({ length: 5 },  (_, i) => createFogLayer(w, h, i));
        pumpkins  = Array.from({ length: 7 },  () => createPumpkin(w, h));
        embers    = [];
        draw();
    }

    function stopHalloween() {
        if (animId) { cancelAnimationFrame(animId); animId = null; }
        if (canvas) { canvas.remove(); canvas = null; ctx = null; }
        bats = []; fogLayers = []; pumpkins = []; embers = []; frameCount = 0;
    }

    function syncHalloween() {
        const theme = document.documentElement.getAttribute('data-theme');
        if (theme === 'halloween') startHalloween(); else stopHalloween();
    }

    const observer = new MutationObserver(syncHalloween);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', syncHalloween);
    else syncHalloween();
})();

// ============================================
// SNOW EFFECT — active only on noel theme
// ============================================
(function initSnow() {
    let canvas, ctx, flakes = [], animId = null;

    const FLAKE_COUNT = 120;
    const CHARS = ['❄', '❅', '❆', '✦', '·', '*'];

    function createFlake(w, h, fromTop = false) {
        return {
            x:     Math.random() * w,
            y:     fromTop ? -20 : Math.random() * h,
            r:     6 + Math.random() * 14,        // font size
            speed: 0.4 + Math.random() * 1.2,
            drift: (Math.random() - 0.5) * 0.4,
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: 0.005 + Math.random() * 0.01,
            opacity: 0.15 + Math.random() * 0.65,
            char:  CHARS[Math.floor(Math.random() * CHARS.length)],
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.02,
        };
    }

    function startSnow() {
        if (canvas) return; // already running
        canvas = document.createElement('canvas');
        canvas.id = 'snowCanvas';
        canvas.style.cssText = [
            'position:fixed', 'inset:0', 'width:100%', 'height:100%',
            'pointer-events:none', 'z-index:9998', 'overflow:hidden'
        ].join(';');
        document.body.appendChild(canvas);
        ctx = canvas.getContext('2d');

        function resize() {
            canvas.width  = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resize();
        window.addEventListener('resize', resize);

        const w = () => canvas.width, h = () => canvas.height;
        flakes = Array.from({ length: FLAKE_COUNT }, () => createFlake(w(), h()));

        function draw() {
            ctx.clearRect(0, 0, w(), h());
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            for (const f of flakes) {
                f.wobble   += f.wobbleSpeed;
                f.rotation += f.rotSpeed;
                f.x += f.drift + Math.sin(f.wobble) * 0.5;
                f.y += f.speed;

                // Reset when off screen
                if (f.y > h() + 20) {
                    Object.assign(f, createFlake(w(), h(), true));
                }
                if (f.x < -20) f.x = w() + 10;
                if (f.x > w() + 20) f.x = -10;

                ctx.save();
                ctx.globalAlpha = f.opacity;
                ctx.font = `${f.r}px serif`;
                ctx.translate(f.x, f.y);
                ctx.rotate(f.rotation);
                // Soft glow
                ctx.shadowColor = '#bbf7d0';
                ctx.shadowBlur  = 6;
                ctx.fillStyle   = '#ffffff';
                ctx.fillText(f.char, 0, 0);
                ctx.restore();
            }
            animId = requestAnimationFrame(draw);
        }
        draw();
    }

    function stopSnow() {
        if (animId) { cancelAnimationFrame(animId); animId = null; }
        if (canvas) { canvas.remove(); canvas = null; ctx = null; }
        flakes = [];
    }

    function syncSnow() {
        const theme = document.documentElement.getAttribute('data-theme');
        if (theme === 'noel') {
            startSnow();
        } else {
            stopSnow();
        }
    }

    // Watch for theme changes on <html>
    const observer = new MutationObserver(syncSnow);
    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme']
    });

    // Also check once DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', syncSnow);
    } else {
        syncSnow();
    }
})();

// ============================================
// MOUSE FOLLOWER EFFECT (common to all pages)
// ============================================
function initMouseFollower() {
    const mouseFollower = document.querySelector('.mouse-follower');
    if (!mouseFollower) return;

    let mouseX = 0;
    let mouseY = 0;
    let followerX = 0;
    let followerY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    function animateFollower() {
        followerX += (mouseX - followerX) * 0.1;
        followerY += (mouseY - followerY) * 0.1;

        mouseFollower.style.left = followerX + 'px';
        mouseFollower.style.top = followerY + 'px';

        requestAnimationFrame(animateFollower);
    }

    animateFollower();
}

// ============================================
// DISCORD NOTIFICATION (home page only)
// ============================================
function initDiscordNotification() {
    // Only show on the home page
    if (!document.body.classList.contains('page-accueil')) {
        return;
    }

    const notification = document.getElementById('discordNotification');
    const closeBtn = document.getElementById('discordNotificationClose');

    if (!notification) return;

    // Check if user already closed the notification this session
    const notificationClosed = sessionStorage.getItem('discordNotificationClosed');

    if (!notificationClosed) {
        // Show notification after a short delay
        setTimeout(() => {
            notification.classList.add('show');
        }, 500);
    }

    // Close the notification
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            notification.classList.remove('show');
            sessionStorage.setItem('discordNotificationClosed', 'true');
        });
    }
}

// ============================================
// TYPEWRITER EFFECT FOR TITLE (home page)
// ============================================
function initTypewriterEffect() {
    // Only show on the home page
    if (!document.body.classList.contains('page-accueil')) {
        return;
    }

    const titleElement = document.getElementById('animatedTitle');
    if (!titleElement) return;

    const text = 'Y8X';
    let currentIndex = 0;
    let isDeleting = false;
    let displayText = '';

    function typeWriter() {
        if (!isDeleting && currentIndex < text.length) {
            // Typing
            displayText = text.substring(0, currentIndex + 1);
            titleElement.textContent = displayText;
            currentIndex++;
            setTimeout(typeWriter, 150);
        } else if (isDeleting && currentIndex > 0) {
            // Deleting
            displayText = text.substring(0, currentIndex - 1);
            titleElement.textContent = displayText;
            currentIndex--;
            setTimeout(typeWriter, 100);
        } else if (!isDeleting && currentIndex === text.length) {
            // Pause before deleting
            isDeleting = true;
            setTimeout(typeWriter, 2000);
        } else if (isDeleting && currentIndex === 0) {
            // Pause before retyping
            isDeleting = false;
            setTimeout(typeWriter, 500);
        }
    }

    // Start the animation
    typeWriter();
}

// ============================================
// BACK TO TOP BUTTON
// ============================================
function initBackToTop() {
    const backToTopBtn = document.getElementById('backToTop');
    if (!backToTopBtn) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 500) {
            backToTopBtn.classList.add('show');
        } else {
            backToTopBtn.classList.remove('show');
        }
    });

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initMouseFollower();
    initDiscordNotification();
    initBackToTop();
});
