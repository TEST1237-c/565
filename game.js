// ============================================
// GAMES — chargement depuis /api/games (Vercel + GitHub)
// ============================================
const GAMES_PER_PAGE = 40;
let currentPage = 1;
let allGames = [];
let filteredGames = [];
let currentFilter = 'all';

// Génère les éléments de jeu
function generateGameElements(games) {
    const gamesGrid = document.getElementById('gamesGrid');
    if (!gamesGrid) return;

    gamesGrid.innerHTML = '';

    const startIndex = (currentPage - 1) * GAMES_PER_PAGE;
    const endIndex = startIndex + GAMES_PER_PAGE;
    const paginatedGames = games.slice(startIndex, endIndex);

    if (paginatedGames.length === 0) {
        gamesGrid.innerHTML = '<p class="coming-soon-message">Aucun jeu trouvé.</p>';
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
        gameLink.style.animationDelay = (0.05 + index * 0.025) + 's';

        gameLink.addEventListener('animationend', function () {
            gameLink.classList.remove('animating');
            gameLink.style.animationDelay = '';
        }, { once: true });

        // Image
        const img = document.createElement('img');
        img.className = 'jeu-thumb-img';
        img.src = game.image;
        img.alt = game.title;
        img.width = 616;
        img.height = 353;
        img.loading = 'lazy';

        // Badge mode (top-left)
        const badgeWrapper = document.createElement('div');
        badgeWrapper.className = 'badge-mode-wrapper';
        const badge = document.createElement('span');
        const modeLabel = game.mode === 'solo' ? 'Solo' : 'Multi';
        badge.className = 'badge-mode-tag ' + (game.mode === 'solo' ? 'solo' : 'multiplayer');
        badge.textContent = modeLabel;
        badgeWrapper.appendChild(badge);

        // Hover overlay
        const titleHover = document.createElement('div');
        titleHover.className = 'jeu-title-hover';

        const titleText = document.createElement('span');
        titleText.className = 'jeu-title-text';
        titleText.textContent = game.title;

        const titleSub = document.createElement('div');
        titleSub.className = 'jeu-title-sub';

        const downloadHint = document.createElement('span');
        downloadHint.className = 'jeu-download-hint';
        downloadHint.innerHTML = `
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Télécharger
        `;

        titleSub.appendChild(downloadHint);
        titleHover.appendChild(titleText);
        titleHover.appendChild(titleSub);

        gameLink.appendChild(img);
        gameLink.appendChild(badgeWrapper);
        gameLink.appendChild(titleHover);

        if (game.hasModal) {
            gameLink.id = game.modalId + '-link';
            gameLink.href = '#';
            gameLink.addEventListener('click', function (e) {
                e.preventDefault();
                const modalBg = document.getElementById(game.modalId + '-modal-bg');
                if (modalBg) {
                    modalBg.style.display = 'flex';
                    modalBg.offsetHeight; // Force reflow
                    modalBg.classList.add('show');
                    document.body.style.overflow = 'hidden';
                }
            });
        }

        gamesGrid.appendChild(gameLink);
    });
}

// Génère les modales
function generateModals(games) {
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
            modalBg.classList.remove('show');
            setTimeout(() => {
                modalBg.style.display = 'none';
                document.body.style.overflow = '';
            }, 500);
        };

        closeBtn.addEventListener('click', closeModalFn);
        modalBg.addEventListener('click', function (e) {
            if (e.target === modalBg) closeModalFn();
        });
        document.addEventListener('keydown', function (e) {
            if (modalBg.classList.contains('show') && (e.key === 'Escape' || e.keyCode === 27)) {
                closeModalFn();
            }
        });
    });
}

// Pagination UI
function renderPagination(totalItems) {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    container.innerHTML = '';
    const totalPages = Math.ceil(totalItems / GAMES_PER_PAGE);
    if (totalPages <= 1) return;

    const goToPage = (page) => {
        currentPage = page;
        window.scrollTo({ top: 0, behavior: 'smooth' });
        updateDisplay();
    };

    // Prev button
    if (currentPage > 1) {
        const prev = document.createElement('button');
        prev.className = 'pagination-btn';
        prev.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`;
        prev.addEventListener('click', () => goToPage(currentPage - 1));
        container.appendChild(prev);
    }

    // Page numbers (smart ellipsis)
    const maxVisible = 7;
    let pages = [];
    if (totalPages <= maxVisible) {
        pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    } else {
        pages = [1];
        if (currentPage > 3) pages.push('…');
        for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
            pages.push(i);
        }
        if (currentPage < totalPages - 2) pages.push('…');
        pages.push(totalPages);
    }

    pages.forEach(p => {
        if (p === '…') {
            const sep = document.createElement('span');
            sep.className = 'pagination-sep';
            sep.textContent = '…';
            container.appendChild(sep);
        } else {
            const btn = document.createElement('button');
            btn.className = 'pagination-btn' + (p === currentPage ? ' active' : '');
            btn.textContent = p;
            btn.addEventListener('click', () => goToPage(p));
            container.appendChild(btn);
        }
    });

    // Next button
    if (currentPage < totalPages) {
        const next = document.createElement('button');
        next.className = 'pagination-btn';
        next.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`;
        next.addEventListener('click', () => goToPage(currentPage + 1));
        container.appendChild(next);
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

    currentPage = 1;
    updateDisplay();
}

async function initGamePage() {
    const gamesGrid = document.getElementById('gamesGrid');
    if (!gamesGrid) return;

    gamesGrid.innerHTML = '<p class="games-loading">Chargement des jeux...</p>';

    const tryFetch = async (path) => {
        try {
            const res = await fetch(path, { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                const games = Array.isArray(data) ? data : (data.games || data.items || []);
                if (games.length > 0) return games;
            }
        } catch (e) {
            console.warn(`Échec de ${path}:`, e.message);
        }
        return null;
    };

    allGames = await tryFetch('games.json') ||
        await tryFetch('/games.json') ||
        await tryFetch('/api/games') ||
        [];

    if (allGames.length === 0) {
        gamesGrid.innerHTML = `
            <div class="coming-soon-message">
                <p>Oups ! Aucun jeu n'a été trouvé.</p>
                <p style="font-size:0.85rem;margin-top:10px;color:var(--text-muted);">
                    Vérifie que le fichier games.json est présent et accessible.
                </p>
            </div>
        `;
    }

    // Dispatch event for header count
    window.dispatchEvent(new CustomEvent('novaplay:gamesLoaded', {
        detail: { count: allGames.length }
    }));

    filteredGames = [...allGames];
    applyFilters();

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

// Init
if (document.body.classList.contains('page-jeux')) {
    initGamePage();
}
