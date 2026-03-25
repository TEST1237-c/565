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

    const text = 'NovaPlay';
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
