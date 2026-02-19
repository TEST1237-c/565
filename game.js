// ============================================
// GAMES — chargement depuis /api/games (Vercel + GitHub)
// ============================================
const GAMES_PER_PAGE = 40;
let currentPage = 1;
let allGames = [];
let filteredGames = [];
let currentFilter = 'all';

// Fonction pour générer les éléments de jeu (uniquement pour la page actuelle)
function generateGameElements(games) {
    const gamesGrid = document.getElementById('gamesGrid');
    if (!gamesGrid) return;

    gamesGrid.innerHTML = '';

    const startIndex = (currentPage - 1) * GAMES_PER_PAGE;
    const endIndex = startIndex + GAMES_PER_PAGE;
    const paginatedGames = games.slice(startIndex, endIndex);

    if (paginatedGames.length === 0) {
        gamesGrid.innerHTML = '<p class="coming-soon-message">No games found.</p>';
        return;
    }

    paginatedGames.forEach((game, index) => {
        const gameLink = document.createElement('a');
        gameLink.className = 'jeu-thumb-link animating';
        gameLink.href = game.link;
        gameLink.target = '_blank';
        gameLink.rel = 'noopener';
        gameLink.setAttribute('data-title', game.title);
        gameLink.setAttribute('data-mode', game.mode);
        gameLink.style.animationDelay = (0.1 + index * 0.03) + 's';

        gameLink.addEventListener('animationend', function () {
            gameLink.classList.remove('animating');
            gameLink.style.animationDelay = '';
        }, { once: true });

        const img = document.createElement('img');
        img.className = 'jeu-thumb-img';
        img.src = game.image;
        img.alt = game.title;
        img.width = 616;
        img.height = 353;
        img.loading = 'lazy';

        const titleSpan = document.createElement('span');
        titleSpan.className = 'jeu-title-hover';
        titleSpan.textContent = game.title;

        const badgeWrapper = document.createElement('div');
        badgeWrapper.className = 'badge-mode-wrapper';
        const badge = document.createElement('img');
        badge.className = 'badge-mode' + (game.mode === 'solo' ? ' solo' : '');
        badge.src = game.mode === 'solo' ? 'https://i.imgur.com/AVgyUuC.png' : 'https://i.imgur.com/Yrz60le.png';
        badge.alt = game.mode;
        badge.loading = 'lazy';
        badgeWrapper.appendChild(badge);

        gameLink.appendChild(img);
        gameLink.appendChild(titleSpan);
        gameLink.appendChild(badgeWrapper);

        if (game.hasModal) {
            gameLink.id = game.modalId + '-link';
            gameLink.href = '#';
            gameLink.addEventListener('click', function (e) {
                e.preventDefault();
                const modalBg = document.getElementById(game.modalId + '-modal-bg');
                if (modalBg) {
                    modalBg.style.display = 'flex';
                    document.body.style.overflow = 'hidden';
                }
            });
        }

        gamesGrid.appendChild(gameLink);
    });
}

// Fonction pour générer les modales
function generateModals(games) {
    // Supprimer les anciennes modales générées (pour éviter les doublons lors du changement de page)
    document.querySelectorAll('.modal-bg').forEach(m => m.remove());

    games.forEach(game => {
        if (!game.hasModal) return;

        const modalBg = document.createElement('div');
        modalBg.id = game.modalId + '-modal-bg';
        modalBg.className = 'modal-bg';
        modalBg.style.display = 'none';

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.role = 'dialog';
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', game.modalId + '-title');

        const closeBtn = document.createElement('button');
        closeBtn.className = 'close-btn';
        closeBtn.id = 'modalCloseBtn-' + game.modalId;
        closeBtn.setAttribute('aria-label', 'Close');
        closeBtn.textContent = '×';

        const title = document.createElement('h2');
        title.id = game.modalId + '-title';
        title.textContent = game.modalTitle;

        const content = document.createElement('div');
        content.innerHTML = game.modalContent || '';

        modal.appendChild(closeBtn);
        modal.appendChild(title);
        modal.appendChild(content);
        modalBg.appendChild(modal);
        document.body.appendChild(modalBg);

        const closeModalFn = () => {
            modalBg.style.display = 'none';
            document.body.style.overflow = '';
        };

        closeBtn.addEventListener('click', closeModalFn);
        modalBg.addEventListener('click', function (e) {
            if (e.target === modalBg) closeModalFn();
        });
        document.addEventListener('keydown', function (e) {
            if (modalBg.style.display === 'flex' && (e.key === 'Escape' || e.keyCode === 27)) {
                closeModalFn();
            }
        });
    });
}

// Fonction pour gérer la pagination UI
function renderPagination(totalItems) {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    container.innerHTML = '';
    const totalPages = Math.ceil(totalItems / GAMES_PER_PAGE);

    if (totalPages <= 1) return;

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.className = 'pagination-btn' + (i === currentPage ? ' active' : '');
        btn.textContent = i;
        btn.addEventListener('click', () => {
            currentPage = i;
            window.scrollTo({ top: 0, behavior: 'smooth' });
            updateDisplay();
        });
        container.appendChild(btn);
    }
}

function updateDisplay() {
    generateGameElements(filteredGames);
    generateModals(filteredGames);
    renderPagination(filteredGames.length);
}

// Filtres et recherche
function applyFilters() {
    const query = (document.getElementById('gameSearch')?.value || '').trim().toLowerCase();

    filteredGames = allGames.filter(game => {
        const title = (game.title || '').toLowerCase();
        const mode = game.mode || '';
        const matchesSearch = title.includes(query);
        const matchesFilter = currentFilter === 'all' || mode === currentFilter;
        return matchesSearch && matchesFilter;
    });

    currentPage = 1; // Reset to first page when filtering
    updateDisplay();
}

async function initGamePage() {
    const gamesGrid = document.getElementById('gamesGrid');
    if (!gamesGrid) return;

    gamesGrid.innerHTML = '<p class="games-loading">Loading games...</p>';

    try {
        const res = await fetch('games.json', { cache: 'no-store' });
        if (res.ok) {
            const data = await res.json();
            allGames = Array.isArray(data) ? data : (data.games || data.items || []);
        } else {
            console.error('Failed to load games.json:', res.statusText);
        }
    } catch (e) {
        console.error('Error loading games.json:', e.message);
    }

    filteredGames = [...allGames];
    applyFilters(); // Initial display

    const gameSearch = document.getElementById('gameSearch');
    if (gameSearch) {
        gameSearch.addEventListener('input', applyFilters);
    }

    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.getAttribute('data-filter');
            applyFilters();
        });
    });
}

// Initialisation de la page jeux
if (document.body.classList.contains('page-jeux')) {
    initGamePage();
}
