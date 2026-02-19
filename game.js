// ============================================
// GAMES — chargement depuis /api/games (Vercel + GitHub)
// ============================================
const GAMES_PER_PAGE = 40;
let currentPage = 1;
let allGames = [];
let filteredGames = [];
let currentFilter = 'all';

const GAMES_FALLBACK = [
    { title: "Forza Horizon 4", image: "https://gaming-cdn.com/images/products/2682/orig/forza-horizon-4-pc-xbox-one-xbox-series-x-s-microsoft-store-cover.jpg?v=1752055441", link: "https://www.clictune.com/mnbG", mode: "multiplayer" },
    { title: "Crime Scene Cleaner", image: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1040200/f4aec86ea2e78eadc845af2416321792fc1e18a4/capsule_616x353_alt_assets_1.jpg", link: "https://www.clictune.com/mnbH", mode: "solo" },
    { title: "PowerWash Simulator 2", image: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2968420/374fc7a0419c7361cda3ae7fa6fe4e383f206e5d/capsule_616x353.jpg", link: "https://www.clictune.com/mnbI", mode: "multiplayer" },
    { title: "Watch Dogs", image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/243470/capsule_616x353.jpg", link: "https://www.clictune.com/mnbJ", mode: "solo" },
    { title: "Watch Dogs 2", image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/447040/capsule_616x353.jpg", link: "#", mode: "solo", hasModal: true, modalId: "watchdogs2", modalTitle: "How to install Watch Dogs 2?", modalContent: "<ul><li>If you have issues with <strong>Easy Anti-Cheat</strong>, follow these steps:</li></ul><ol><li>Create a shortcut for Watch Dogs 2.</li><li>Right-click the shortcut and go to <strong>Properties</strong>.</li><li>In the <strong>Target</strong> field, add <code>-eac_launcher</code> (without quotes) at the end.</li></ol><div class=\"modal-btns\"><a href=\"https://www.clictune.com/mnbK\" class=\"download-btn\" target=\"_blank\" rel=\"noopener\">Download your game</a></div>" },
    { title: "Dying Light", image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/239140/75644e31be5e0e57ac44a3e13468555fb21eb4ea/capsule_616x353.jpg", link: "https://www.clictune.com/mnbL", mode: "multiplayer" },
    { title: "Dying Light 2 Stay Human", image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/534380/bb99b9529e0585181f0c09fa6b9eff324dba0675/capsule_616x353.jpg", link: "https://www.clictune.com/mnbM", mode: "multiplayer" },
    { title: "Dying Light The Beast", image: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3008130/56babf2f7988a87d73e86dd434bf2a2ee2b8c624/capsule_616x353_alt_assets_0.jpg", link: "#", mode: "multiplayer", hasModal: true, modalId: "dyinglightthebeast", modalTitle: "How to install Dying Light The Beast?", modalContent: "<ul><li>Launch your game via the exe in ph_ft\\work\\bin\\x64\\</li></ul><div class=\"modal-btns\"><a href=\"https://www.clictune.com/mnbN\" class=\"download-btn\" target=\"_blank\" rel=\"noopener\">Download your game</a></div>" },
    { title: "Among Us", image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/945360/capsule_616x353.jpg", link: "https://www.clictune.com/mnbO", mode: "multiplayer" },
    { title: "Crime Simulator", image: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2737070/b127c3a7a40ba1f9b4e82caa875b5185a3ee32e8/capsule_616x353.jpg", link: "https://www.clictune.com/mncu", mode: "multiplayer" },
    { title: "Detroit Become Human", image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1222140/capsule_616x353.jpg", link: "https://www.clictune.com/mncv", mode: "solo" },
    { title: "Power Wash Simulator", image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1290000/0184e192ea58230dd82aa8aed8134be3ed8fc4c2/capsule_616x353.jpg", link: "https://www.clictune.com/mncw", mode: "multiplayer" },
    { title: "Road 96", image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1466640/capsule_616x353.jpg", link: "https://www.clictune.com/mncx", mode: "solo" },
    { title: "Cities Skylines", image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/255710/c950fea5ca1836a8727dabf7da3393c1941f1bc3/capsule_616x353.jpg", link: "https://www.clictune.com/mnj5", mode: "solo" },
    { title: "Mini Metro", image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/287980/capsule_616x353.jpg", link: "https://www.clictune.com/mnj6", mode: "solo" },
    { title: "Subnautica", image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/264710/capsule_616x353.jpg", link: "https://www.clictune.com/mnj7", mode: "solo" },
    { title: "American Truck Simulator", image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/270880/d9b2ee173096a4dabcc574835de06f603d5c9797/capsule_616x353_alt_assets_7.jpg", link: "https://www.clictune.com/mnj8", mode: "multiplayer" },
    { title: "Portal Knights", image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/374040/capsule_616x353.jpg", link: "https://www.clictune.com/mnj9", mode: "solo" },
    { title: "Drive Beyond Horizons", image: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2625420/capsule_616x353.jpg", link: "https://www.clictune.com/mnja", mode: "multiplayer" },
    { title: "60 Seconds!", image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/368360/capsule_616x353.jpg", link: "https://www.clictune.com/mnjb", mode: "solo" },
    { title: "BoneLab", image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2165980/capsule_616x353.jpg", link: "https://www.clictune.com/mnjc", mode: "solo" },
    { title: "Garry's mod", image: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/4000/ecae0f862ac2f087f1581122999dd1e6281ce3b5/capsule_616x353.jpg", link: "https://www.clictune.com/mnjd", mode: "solo" }
];

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
        const res = await fetch('/api/games', { cache: 'no-store' });
        if (res.ok) {
            const data = await res.json();
            allGames = Array.isArray(data) ? data : (data.games || data.items || []);
        }
    } catch (e) {
        console.warn('API load failed, using fallback:', e.message);
        allGames = GAMES_FALLBACK;
    }

    if (!allGames.length) allGames = GAMES_FALLBACK;

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
