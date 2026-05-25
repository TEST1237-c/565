// ============================================
// MAINTENANCE CHECK (all pages except admin)
// ============================================

// 🔑 Change this secret to whatever you want
const BYPASS_SECRET = 'novaplay-owner-2026';

async function checkMaintenance() {
    const isAdmin = window.location.pathname.includes('admin');
    if (isAdmin) return;

    // Check URL param: ?bypass=novaplay-owner-2026
    const params = new URLSearchParams(window.location.search);
    if (params.get('bypass') === BYPASS_SECRET) {
        sessionStorage.setItem('maintenance-bypass', BYPASS_SECRET);
        // Clean the URL without reloading
        const cleanUrl = window.location.pathname + window.location.hash;
        window.history.replaceState(null, '', cleanUrl);
    }

    // If bypass is stored in session, skip maintenance
    if (sessionStorage.getItem('maintenance-bypass') === BYPASS_SECRET) return;

    try {
        const res = await fetch('/api/maintenance-status', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();

        if (data.enabled) {
            showMaintenanceScreen(data.message || '');
        }
    } catch (e) {
        // Si l'API est down, on ne bloque pas le site
    }
}

function showMaintenanceScreen(message) {
    // Cacher tout le contenu
    document.body.style.overflow = 'hidden';

    const overlay = document.createElement('div');
    overlay.id = 'maintenance-overlay';
    overlay.innerHTML = `
        <style>
            #maintenance-overlay {
                position: fixed;
                inset: 0;
                z-index: 2147483647;
                background: #05050c;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: Inter, system-ui, sans-serif;
                padding: 2rem;
            }
            #maintenance-overlay .maint-card {
                max-width: 520px;
                width: 100%;
                text-align: center;
                background: rgba(15, 23, 42, 0.95);
                border: 1px solid rgba(148, 163, 184, 0.12);
                border-radius: 24px;
                padding: 3rem 2.5rem;
                box-shadow: 0 40px 120px rgba(0, 0, 0, 0.6);
                animation: maint-fadein 0.5s ease;
            }
            @keyframes maint-fadein {
                from { opacity: 0; transform: translateY(20px); }
                to   { opacity: 1; transform: translateY(0); }
            }
            #maintenance-overlay .maint-icon {
                font-size: 3.5rem;
                margin-bottom: 1.5rem;
                display: block;
                animation: maint-float 3s ease-in-out infinite;
            }
            @keyframes maint-float {
                0%, 100% { transform: translateY(0); }
                50%       { transform: translateY(-8px); }
            }
            #maintenance-overlay h1 {
                margin: 0 0 1rem;
                font-size: 1.9rem;
                font-weight: 800;
                background: linear-gradient(135deg, #a78bfa, #818cf8);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
            #maintenance-overlay p {
                color: rgba(226, 232, 240, 0.65);
                font-size: 1rem;
                line-height: 1.7;
                margin: 0 0 1.5rem;
            }
            #maintenance-overlay .maint-badge {
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.55rem 1.25rem;
                background: rgba(167, 139, 250, 0.1);
                border: 1px solid rgba(167, 139, 250, 0.3);
                border-radius: 999px;
                color: #c4b5fd;
                font-size: 0.82rem;
                font-weight: 600;
                letter-spacing: 0.03em;
            }
            #maintenance-overlay .maint-dot {
                width: 7px;
                height: 7px;
                border-radius: 50%;
                background: #a78bfa;
                animation: maint-pulse 1.5s ease-in-out infinite;
            }
            @keyframes maint-pulse {
                0%, 100% { opacity: 1; transform: scale(1); }
                50%       { opacity: 0.4; transform: scale(0.8); }
            }
            #maintenance-overlay .maint-custom-msg {
                margin-top: 1.25rem;
                padding: 0.75rem 1.25rem;
                background: rgba(255,255,255,0.04);
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: 12px;
                color: rgba(226, 232, 240, 0.5);
                font-size: 0.88rem;
                line-height: 1.6;
            }
            #maintenance-overlay .maint-footer {
                margin-top: 2rem;
                color: rgba(148, 163, 184, 0.25);
                font-size: 0.7rem;
            }
        </style>
        <div class="maint-card">
            <span class="maint-icon">🔧</span>
            <h1>Under Maintenance</h1>
            <p>We're currently working on some improvements.<br>We'll be back shortly — thank you for your patience!</p>
            <div class="maint-badge">
                <span class="maint-dot"></span>
                Back soon
            </div>
            ${message ? `<div class="maint-custom-msg">${message}</div>` : ''}
            <p class="maint-footer">© ${new Date().getFullYear()} NovaPlay</p>
        </div>
    `;

    document.body.appendChild(overlay);
}

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
    if (!document.body.classList.contains('page-accueil')) return;

    const notification = document.getElementById('discordNotification');
    const closeBtn = document.getElementById('discordNotificationClose');

    if (!notification) return;

    const notificationClosed = sessionStorage.getItem('discordNotificationClosed');
    if (!notificationClosed) {
        setTimeout(() => {
            notification.classList.add('show');
        }, 500);
    }

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
    if (!document.body.classList.contains('page-accueil')) return;

    const titleElement = document.getElementById('animatedTitle');
    if (!titleElement) return;

    const text = 'NovaPlay';
    let currentIndex = 0;
    let isDeleting = false;
    let displayText = '';

    function typeWriter() {
        if (!isDeleting && currentIndex < text.length) {
            displayText = text.substring(0, currentIndex + 1);
            titleElement.textContent = displayText;
            currentIndex++;
            setTimeout(typeWriter, 150);
        } else if (isDeleting && currentIndex > 0) {
            displayText = text.substring(0, currentIndex - 1);
            titleElement.textContent = displayText;
            currentIndex--;
            setTimeout(typeWriter, 100);
        } else if (!isDeleting && currentIndex === text.length) {
            isDeleting = true;
            setTimeout(typeWriter, 2000);
        } else if (isDeleting && currentIndex === 0) {
            isDeleting = false;
            setTimeout(typeWriter, 500);
        }
    }

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
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    checkMaintenance();
    initMouseFollower();
    initDiscordNotification();
    initBackToTop();
});
