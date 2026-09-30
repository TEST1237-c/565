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
// HALLOWEEN EFFECT — bats, fog, moon flash
// Active only on halloween theme
// ============================================
(function initHalloween() {
    let canvas, ctx, animId = null;
    let bats = [], fogParticles = [], lightning = null;
    let frameCount = 0;

    // ── Bat ──────────────────────────────────
    function createBat(w, h, fromEdge = false) {
        const side = Math.random() < 0.5 ? 'left' : 'right';
        return {
            x:        fromEdge ? (side === 'left' ? -40 : w + 40) : Math.random() * w,
            y:        20 + Math.random() * (h * 0.55),
            size:     10 + Math.random() * 18,
            speedX:   (side === 'left' ? 1 : -1) * (0.6 + Math.random() * 1.4),
            speedY:   (Math.random() - 0.5) * 0.5,
            flapAngle: Math.random() * Math.PI * 2,
            flapSpeed: 0.12 + Math.random() * 0.1,
            wobble:   Math.random() * Math.PI * 2,
            wobbleAmp: 0.3 + Math.random() * 0.5,
            opacity:  0.55 + Math.random() * 0.4,
        };
    }

    function drawBat(b) {
        const s = b.size;
        const flap = Math.sin(b.flapAngle) * 0.9; // -0.9 to 0.9

        ctx.save();
        ctx.globalAlpha = b.opacity;
        ctx.fillStyle   = '#1a0825';
        ctx.shadowColor = '#f97316';
        ctx.shadowBlur  = 8;
        ctx.translate(b.x, b.y);

        // Body
        ctx.beginPath();
        ctx.ellipse(0, 0, s * 0.28, s * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();

        // Left wing (2 bezier curves)
        ctx.beginPath();
        ctx.moveTo(-s * 0.28, 0);
        ctx.bezierCurveTo(
            -s * 0.7,  flap * s * 0.6,
            -s * 1.1,  flap * s * 0.9,
            -s * 0.9,  flap * s * 0.5
        );
        ctx.bezierCurveTo(
            -s * 0.6,  flap * s * 0.2,
            -s * 0.35, flap * s * 0.1,
            -s * 0.28, 0
        );
        ctx.fill();

        // Right wing
        ctx.beginPath();
        ctx.moveTo(s * 0.28, 0);
        ctx.bezierCurveTo(
            s * 0.7,  flap * s * 0.6,
            s * 1.1,  flap * s * 0.9,
            s * 0.9,  flap * s * 0.5
        );
        ctx.bezierCurveTo(
            s * 0.6,  flap * s * 0.2,
            s * 0.35, flap * s * 0.1,
            s * 0.28, 0
        );
        ctx.fill();

        // Ears
        ctx.beginPath();
        ctx.moveTo(-s * 0.12, -s * 0.15);
        ctx.lineTo(-s * 0.05, -s * 0.38);
        ctx.lineTo( s * 0.02, -s * 0.15);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo( s * 0.12, -s * 0.15);
        ctx.lineTo( s * 0.05, -s * 0.38);
        ctx.lineTo(-s * 0.02, -s * 0.15);
        ctx.fill();

        // Eyes (tiny orange dots)
        ctx.fillStyle   = '#f97316';
        ctx.shadowColor = '#f97316';
        ctx.shadowBlur  = 4;
        ctx.beginPath(); ctx.arc(-s * 0.09, -s * 0.04, s * 0.04, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc( s * 0.09, -s * 0.04, s * 0.04, 0, Math.PI * 2); ctx.fill();

        ctx.restore();
    }

    // ── Fog ──────────────────────────────────
    function createFog(w, h) {
        return {
            x:      Math.random() * w,
            y:      h * 0.65 + Math.random() * (h * 0.4),
            r:      80 + Math.random() * 180,
            speedX: (Math.random() - 0.5) * 0.25,
            opacity: 0.02 + Math.random() * 0.055,
            phase:  Math.random() * Math.PI * 2,
        };
    }

    // ── Moon ─────────────────────────────────
    function drawMoon(w) {
        const mx = w * 0.82, my = 70, mr = 38;
        // Outer glow
        const grd = ctx.createRadialGradient(mx, my, mr * 0.4, mx, my, mr * 2.2);
        grd.addColorStop(0,   'rgba(255,220,120,0.18)');
        grd.addColorStop(0.5, 'rgba(255,190,60,0.07)');
        grd.addColorStop(1,   'rgba(255,150,30,0)');
        ctx.beginPath();
        ctx.arc(mx, my, mr * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        // Moon body
        ctx.beginPath();
        ctx.arc(mx, my, mr, 0, Math.PI * 2);
        const moon = ctx.createRadialGradient(mx - 8, my - 8, 4, mx, my, mr);
        moon.addColorStop(0,   '#fff8dc');
        moon.addColorStop(0.5, '#ffd060');
        moon.addColorStop(1,   '#e8910a');
        ctx.fillStyle = moon;
        ctx.shadowColor = '#ffb830';
        ctx.shadowBlur  = 30;
        ctx.fill();
        ctx.shadowBlur  = 0;

        // Craters
        [[mx-10, my+8,  7], [mx+12, my-12, 5], [mx+4, my+14, 4]].forEach(([cx,cy,cr]) => {
            ctx.beginPath();
            ctx.arc(cx, cy, cr, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(180,100,0,0.18)';
            ctx.fill();
        });
    }

    // ── Lightning flash ───────────────────────
    function triggerLightning() {
        if (lightning) return;
        lightning = { alpha: 0.22, decay: 0.018 };
    }

    // ── Main draw loop ───────────────────────
    function draw() {
        const w = canvas.width, h = canvas.height;
        ctx.clearRect(0, 0, w, h);
        frameCount++;

        // Moon (always)
        drawMoon(w);

        // Lightning flash overlay
        if (lightning) {
            ctx.fillStyle = `rgba(255,200,80,${lightning.alpha})`;
            ctx.fillRect(0, 0, w, h);
            lightning.alpha -= lightning.decay;
            if (lightning.alpha <= 0) lightning = null;
        }

        // Fog particles
        const t = frameCount * 0.008;
        for (const f of fogParticles) {
            f.x += f.speedX;
            if (f.x > w + f.r) f.x = -f.r;
            if (f.x < -f.r)    f.x = w + f.r;
            const pulse = 1 + 0.15 * Math.sin(t + f.phase);
            const grd = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * pulse);
            grd.addColorStop(0,   `rgba(80,20,90,${f.opacity})`);
            grd.addColorStop(0.5, `rgba(40,10,50,${f.opacity * 0.5})`);
            grd.addColorStop(1,   'rgba(0,0,0,0)');
            ctx.beginPath();
            ctx.arc(f.x, f.y, f.r * pulse, 0, Math.PI * 2);
            ctx.fillStyle = grd;
            ctx.fill();
        }

        // Bats
        for (const b of bats) {
            b.flapAngle += b.flapSpeed;
            b.wobble    += 0.018;
            b.x += b.speedX;
            b.y += b.speedY + Math.sin(b.wobble) * b.wobbleAmp;

            // Bounce vertically
            if (b.y < 10)      { b.y = 10;      b.speedY = Math.abs(b.speedY); }
            if (b.y > h * 0.6) { b.y = h * 0.6; b.speedY = -Math.abs(b.speedY); }

            // Reset off-screen
            if (b.x < -60 || b.x > w + 60) {
                Object.assign(b, createBat(w, h, true));
            }
            drawBat(b);
        }

        // Random lightning (~every 8s on average)
        if (frameCount % 480 === 0 && Math.random() < 0.4) triggerLightning();

        animId = requestAnimationFrame(draw);
    }

    function startHalloween() {
        if (canvas) return;
        canvas = document.createElement('canvas');
        canvas.id = 'halloweenCanvas';
        canvas.style.cssText = [
            'position:fixed', 'inset:0', 'width:100%', 'height:100%',
            'pointer-events:none', 'z-index:9997'
        ].join(';');
        document.body.appendChild(canvas);
        ctx = canvas.getContext('2d');

        function resize() {
            canvas.width  = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resize();
        window.addEventListener('resize', resize);

        const w = canvas.width, h = canvas.height;
        bats         = Array.from({ length: 14 }, () => createBat(w, h));
        fogParticles = Array.from({ length: 22 }, () => createFog(w, h));
        draw();
    }

    function stopHalloween() {
        if (animId) { cancelAnimationFrame(animId); animId = null; }
        if (canvas) { canvas.remove(); canvas = null; ctx = null; }
        bats = []; fogParticles = []; lightning = null; frameCount = 0;
    }

    function syncHalloween() {
        const theme = document.documentElement.getAttribute('data-theme');
        if (theme === 'halloween') startHalloween();
        else stopHalloween();
    }

    const observer = new MutationObserver(syncHalloween);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', syncHalloween);
    } else {
        syncHalloween();
    }
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
