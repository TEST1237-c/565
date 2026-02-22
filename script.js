// ============================================
// EFFET QUI SUIT LA SOURIS (commun à toutes les pages)
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
// NOTIFICATION DISCORD SUPPORT (uniquement sur la page d'accueil)
// ============================================
function initDiscordNotification() {
    // Ne s'afficher que sur la page d'accueil
    if (!document.body.classList.contains('page-accueil')) {
        return;
    }

    const notification = document.getElementById('discordNotification');
    const closeBtn = document.getElementById('discordNotificationClose');

    if (!notification) return;

    // Vérifier si l'utilisateur a déjà fermé la notification dans cette session
    const notificationClosed = sessionStorage.getItem('discordNotificationClosed');

    if (!notificationClosed) {
        // Afficher la notification après un court délai
        setTimeout(() => {
            notification.classList.add('show');
        }, 500);
    }

    // Fermer la notification
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            notification.classList.remove('show');
            sessionStorage.setItem('discordNotificationClosed', 'true');
        });
    }
}

// ============================================
// EFFET TYPEWRITER POUR LE TITRE (page d'accueil)
// ============================================
function initTypewriterEffect() {
    // Ne s'afficher que sur la page d'accueil
    if (!document.body.classList.contains('page-accueil')) {
        return;
    }

    const titleElement = document.getElementById('animatedTitle');
    if (!titleElement) return;

    const text = 'NovaPlay';
    let currentIndex = 0;
    let isDeleting = false;
    let displayText = '';

    function typeWriter() {
        if (!isDeleting && currentIndex < text.length) {
            // Écriture
            displayText = text.substring(0, currentIndex + 1);
            titleElement.textContent = displayText;
            currentIndex++;
            setTimeout(typeWriter, 150);
        } else if (isDeleting && currentIndex > 0) {
            // Effacement
            displayText = text.substring(0, currentIndex - 1);
            titleElement.textContent = displayText;
            currentIndex--;
            setTimeout(typeWriter, 100);
        } else if (!isDeleting && currentIndex === text.length) {
            // Pause avant d'effacer
            isDeleting = true;
            setTimeout(typeWriter, 2000);
        } else if (isDeleting && currentIndex === 0) {
            // Pause avant de réécrire
            isDeleting = false;
            setTimeout(typeWriter, 500);
        }
    }

    // Démarrer l'animation
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
// INITIALISATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initMouseFollower();
    initDiscordNotification();
    initTypewriterEffect();
    initBackToTop();
});

