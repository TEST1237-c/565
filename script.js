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
// HALLOWEEN EFFECT — spiderwebs + fog only
// ============================================
(function initHalloween() {
    let canvas, ctx, animId = null;

    const rand = (a, b) => a + Math.random() * (b - a);

    /* ── Spider web ── */
    function drawSpiderWeb(cx, cy, radius, flip) {
        ctx.save();
        ctx.translate(cx, cy);
        if (flip) ctx.scale(-1, 1);

        const spokes = 7, rings = 6;

        ctx.globalAlpha = 0.28;
        ctx.strokeStyle = '#d4b8e0';
        ctx.lineWidth   = 0.8;
        ctx.shadowColor = '#a855f7';
        ctx.shadowBlur  = 8;

        // Spokes
        for (let i = 0; i < spokes; i++) {
            const angle = (Math.PI / 2) * (i / (spokes - 1));
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
            ctx.stroke();
        }

        // Rings
        for (let r = 1; r <= rings; r++) {
            const rr = (r / rings) * radius;
            ctx.beginPath();
            for (let i = 0; i < spokes; i++) {
                const a1  = (Math.PI / 2) * (i / (spokes - 1));
                const a2  = (Math.PI / 2) * ((i + 1) / (spokes - 1));
                const p1x = Math.cos(a1) * rr, p1y = Math.sin(a1) * rr;
                const p2x = Math.cos(a2) * rr, p2y = Math.sin(a2) * rr;
                const cpx = Math.cos((a1 + a2) / 2) * rr * 1.08;
                const cpy = Math.sin((a1 + a2) / 2) * rr * 1.08;
                if (i === 0) ctx.moveTo(p1x, p1y);
                ctx.quadraticCurveTo(cpx, cpy, p2x, p2y);
            }
            ctx.stroke();
        }

        // Spider
        const sa = (Math.PI / 2) * 0.52;
        const sr = radius * 0.36;
        const sx = Math.cos(sa) * sr, sy = Math.sin(sa) * sr;
        ctx.shadowBlur  = 0;
        ctx.globalAlpha = 0.65;
        ctx.fillStyle   = '#2d0a3a';
        ctx.beginPath(); ctx.arc(sx, sy,     5,   0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(sx, sy + 7, 3.5, 0, Math.PI * 2); ctx.fill();

        // Spider legs (4 each side)
        ctx.strokeStyle = '#4a1060';
        ctx.lineWidth   = 0.9;
        ctx.globalAlpha = 0.5;
        [[-1], [1]].forEach(([side]) => {
            for (let l = 0; l < 4; l++) {
                const baseAngle = (l / 3) * Math.PI * 0.6 - Math.PI * 0.3;
                const lx1 = sx + side * 5;
                const ly1 = sy + l * 2 - 3;
                const lx2 = lx1 + side * Math.cos(baseAngle) * 12;
                const ly2 = ly1 + Math.sin(baseAngle) * 8;
                const lx3 = lx2 + side * 6;
                const ly3 = ly2 + 5;
                ctx.beginPath();
                ctx.moveTo(lx1, ly1);
                ctx.quadraticCurveTo(lx2, ly2, lx3, ly3);
                ctx.stroke();
            }
        });

        ctx.restore();
    }

    /* ── Main loop ── */
    function draw() {
        const W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);

        // Spider webs top corners
        const webSize = Math.min(W, H) * 0.24;
        drawSpiderWeb(0, 0, webSize, false);
        drawSpiderWeb(W, 0, webSize, true);

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
        draw();
    }

    function stopHalloween() {
        if (animId) { cancelAnimationFrame(animId); animId = null; }
        if (canvas) { canvas.remove(); canvas = null; ctx = null; }
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
