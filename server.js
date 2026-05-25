const path = require("path");
const fs = require("fs/promises");
const crypto = require("crypto");

require("dotenv").config();

const express = require("express");
const helmet = require("helmet");

const app = express();

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || (process.env.NODE_ENV === 'production' ? "" : "admin");
const DATA_FILE = path.join(__dirname, "games.json");
const CHEAT_DATA_FILE = path.join(__dirname, "cheat-status.json");
const MAINTENANCE_FILE = path.join(__dirname, "maintenance.json");

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(express.json({ limit: "256kb" }));
app.use(express.urlencoded({ extended: false }));

async function readMaintenance() {
  try {
    const raw = await fs.readFile(MAINTENANCE_FILE, "utf8");
    const data = JSON.parse(raw);
    return {
      enabled: Boolean(data.enabled),
      message: String(data.message || "").trim()
    };
  } catch (err) {
    if (err && (err.code === "ENOENT" || err.code === "ENOTDIR")) {
      return { enabled: false, message: "" };
    }
    throw err;
  }
}

async function writeMaintenance(state) {
  const payload = {
    enabled: Boolean(state.enabled),
    message: String(state.message || "").trim()
  };
  const data = JSON.stringify(payload, null, 4) + "\n";
  await fs.writeFile(MAINTENANCE_FILE, data, "utf8");
}

function okJson(res, status, payload) {
  res.status(status);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  return res.send(JSON.stringify(payload));
}

function timingSafeEqualString(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  // timingSafeEqual exige des buffers de même taille
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

async function readGames() {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    if (err && (err.code === "ENOENT" || err.code === "ENOTDIR")) return [];
    throw err;
  }
}

async function writeGames(games) {
  const data = JSON.stringify(games, null, 4) + "\n";
  await fs.writeFile(DATA_FILE, data, "utf8");
}

async function readCheatStatus() {
  try {
    const raw = await fs.readFile(CHEAT_DATA_FILE, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    if (err && (err.code === "ENOENT" || err.code === "ENOTDIR")) return {};
    throw err;
  }
}

async function writeCheatStatus(statusObj) {
  const data = JSON.stringify(statusObj, null, 4) + "\n";
  await fs.writeFile(CHEAT_DATA_FILE, data, "utf8");
}

function requireAdminPasswordSet(res) {
  if (!ADMIN_PASSWORD) {
    okJson(res, 500, { error: "ADMIN_PASSWORD non configuré (crée un fichier .env)" });
    return false;
  }
  return true;
}

function checkAdmin(req, res) {
  if (!requireAdminPasswordSet(res)) return false;
  const { adminPassword } = req.body || {};
  if (!timingSafeEqualString(String(adminPassword || ""), ADMIN_PASSWORD)) {
    okJson(res, 401, { error: "Mot de passe admin incorrect" });
    return false;
  }
  return true;
}

function sanitizeGame(game) {
  const g = game || {};
  const clean = {
    title: String(g.title || "").trim(),
    image: String(g.image || "").trim(),
    link: String(g.link || "").trim(),
    mode: g.mode === "multiplayer" ? "multiplayer" : "solo"
  };

  if (g.hasModal) {
    clean.hasModal = true;
    clean.modalId = String(g.modalId || clean.title.toLowerCase().replace(/\s+/g, "-"))
      .trim()
      .replace(/\s+/g, "-");
    clean.modalTitle = String(g.modalTitle || "Installation").trim();
    clean.modalContent = String(g.modalContent || "").trim();
    // les modales utilisent href="#"
    clean.link = clean.link || "#";
  }

  if (!clean.title || !clean.image || !clean.link || !clean.mode) return null;
  return clean;
}

// ==========================
// API
// ==========================
app.get("/api/games", async (req, res) => {
  try {
    const games = await readGames();
    return okJson(res, 200, games);
  } catch (err) {
    console.error("GET /api/games:", err);
    return okJson(res, 500, { error: "Impossible de charger les jeux" });
  }
});

app.get("/api/cheat-status", async (req, res) => {
  try {
    const status = await readCheatStatus();
    return okJson(res, 200, status);
  } catch (err) {
    console.error("GET /api/cheat-status:", err);
    return okJson(res, 500, { error: "Impossible de charger les statuts" });
  }
});

app.get('/api/maintenance-status', async (req, res) => {
  try {
    const maintenance = await readMaintenance();
    return okJson(res, 200, maintenance);
  } catch (err) {
    console.error('GET /api/maintenance-status:', err);
    return okJson(res, 500, { error: 'Impossible de lire le statut de maintenance' });
  }
});

app.post('/api/set-maintenance', async (req, res) => {
  if (!checkAdmin(req, res)) return;
  const { enabled, message } = req.body || {};
  const maintenance = {
    enabled: enabled === true || String(enabled).toLowerCase() === 'true',
    message: String(message || '').trim()
  };

  try {
    await writeMaintenance(maintenance);
    return okJson(res, 200, { success: true, maintenance });
  } catch (err) {
    console.error('POST /api/set-maintenance:', err);
    return okJson(res, 500, { error: 'Impossible de mettre à jour le statut de maintenance' });
  }
});

app.post("/api/check-admin", (req, res) => {
  if (!requireAdminPasswordSet(res)) return;
  const { password } = req.body || {};
  if (timingSafeEqualString(String(password || ""), ADMIN_PASSWORD)) {
    return okJson(res, 200, { ok: true });
  }
  return okJson(res, 401, { error: "Mot de passe incorrect" });
});

app.post("/api/add-game", async (req, res) => {
  if (!checkAdmin(req, res)) return;
  const { game } = req.body || {};
  const clean = sanitizeGame(game);
  if (!clean) return okJson(res, 400, { error: "Jeu invalide (title, image, link, mode requis)" });

  try {
    const games = await readGames();
    // Vérifier si le titre existe déjà
    const exists = games.some(g => g.title.toLowerCase() === clean.title.toLowerCase());
    if (exists) return okJson(res, 400, { error: "Ce jeu est déjà présent dans la liste" });

    games.push(clean);
    await writeGames(games);
    return okJson(res, 200, { success: true, message: "Jeu ajouté." });
  } catch (err) {
    console.error("POST /api/add-game:", err);
    return okJson(res, 500, { error: "Erreur serveur" });
  }
});

app.post("/api/update-game", async (req, res) => {
  if (!checkAdmin(req, res)) return;
  const { index, game } = req.body || {};
  const i = Number.parseInt(index, 10);
  if (!Number.isFinite(i) || i < 0) return okJson(res, 400, { error: "Index invalide" });

  const clean = sanitizeGame(game);
  if (!clean) return okJson(res, 400, { error: "Jeu invalide (title, image, link, mode requis)" });

  try {
    const games = await readGames();
    if (i >= games.length) return okJson(res, 400, { error: "Index hors limite" });

    // Vérifier si le nouveau titre existe déjà ailleurs
    const exists = games.some((g, idx) => idx !== i && g.title.toLowerCase() === clean.title.toLowerCase());
    if (exists) return okJson(res, 400, { error: "Un autre jeu porte déjà ce nom" });

    games[i] = clean;
    await writeGames(games);
    return okJson(res, 200, { success: true, message: "Jeu modifié." });
  } catch (err) {
    console.error("POST /api/update-game:", err);
    return okJson(res, 500, { error: "Erreur serveur" });
  }
});

app.post("/api/delete-game", async (req, res) => {
  if (!checkAdmin(req, res)) return;
  const { index } = req.body || {};
  const i = Number.parseInt(index, 10);
  if (!Number.isFinite(i) || i < 0) return okJson(res, 400, { error: "Index invalide" });

  try {
    const games = await readGames();
    if (i >= games.length) return okJson(res, 400, { error: "Index hors limite" });
    games.splice(i, 1);
    await writeGames(games);
    return okJson(res, 200, { success: true, message: "Jeu supprimé." });
  } catch (err) {
    console.error("POST /api/delete-game:", err);
    return okJson(res, 500, { error: "Erreur serveur" });
  }
});

app.post("/api/update-cheat-status", async (req, res) => {
  if (!checkAdmin(req, res)) return;
  const { cheatId, status } = req.body || {};
  if (!cheatId || !status) return okJson(res, 400, { error: "cheatId et status requis" });

  try {
    const statuses = await readCheatStatus();
    if (!statuses[cheatId]) return okJson(res, 404, { error: "Cheat introuvable" });
    statuses[cheatId].status = status;
    await writeCheatStatus(statuses);
    return okJson(res, 200, { success: true, message: "Statut modifié." });
  } catch (err) {
    console.error("POST /api/update-cheat-status:", err);
    return okJson(res, 500, { error: "Erreur serveur" });
  }
});

app.post("/api/update-cheat", async (req, res) => {
  if (!checkAdmin(req, res)) return;
  const { cheatId, cheat } = req.body || {};
  if (!cheatId || !cheat) return okJson(res, 400, { error: "cheatId et cheat requis" });

  try {
    const statuses = await readCheatStatus();
    if (!statuses[cheatId]) return okJson(res, 404, { error: "Cheat introuvable" });
    statuses[cheatId] = { ...statuses[cheatId], ...cheat };
    await writeCheatStatus(statuses);
    return okJson(res, 200, { success: true, message: "Cheat modifié." });
  } catch (err) {
    console.error("POST /api/update-cheat:", err);
    return okJson(res, 500, { error: "Erreur serveur" });
  }
});

app.post("/api/delete-cheat", async (req, res) => {
  if (!checkAdmin(req, res)) return;
  const { cheatId } = req.body || {};
  if (!cheatId) return okJson(res, 400, { error: "cheatId requis" });

  try {
    const statuses = await readCheatStatus();
    if (!statuses[cheatId]) return okJson(res, 404, { error: "Cheat introuvable" });
    delete statuses[cheatId];
    await writeCheatStatus(statuses);
    return okJson(res, 200, { success: true, message: "Cheat supprimé." });
  } catch (err) {
    console.error("POST /api/delete-cheat:", err);
    return okJson(res, 500, { error: "Erreur serveur" });
  }
});

app.get('/api/maintenance-status', async (req, res) => {
  try {
    const maintenance = await readMaintenance();
    return okJson(res, 200, maintenance);
  } catch (err) {
    console.error('GET /api/maintenance-status:', err);
    return okJson(res, 500, { error: 'Impossible de lire le statut de maintenance' });
  }
});

app.post('/api/set-maintenance', async (req, res) => {
  if (!checkAdmin(req, res)) return;
  const { enabled, message } = req.body || {};
  const maintenance = {
    enabled: enabled === true || String(enabled).toLowerCase() === 'true',
    message: String(message || '').trim()
  };

  try {
    await writeMaintenance(maintenance);
    return okJson(res, 200, { success: true, maintenance });
  } catch (err) {
    console.error('POST /api/set-maintenance:', err);
    return okJson(res, 500, { error: 'Impossible de mettre à jour le statut de maintenance' });
  }
});

app.use(async (req, res, next) => {
  const requestPath = req.path || req.url || '';
  const assetExt = /\.(css|js|png|jpg|jpeg|svg|ico|json|woff2?|ttf|map)$/i;
  if (
    requestPath.startsWith('/api') ||
    requestPath === '/admin.html' ||
    requestPath === '/maintenance.html' ||
    assetExt.test(requestPath)
  ) {
    return next();
  }

  try {
    const maintenance = await readMaintenance();
    if (maintenance.enabled) {
      if (req.method === 'GET' && req.accepts('html')) {
        return res.status(503).sendFile(path.join(__dirname, 'maintenance.html'));
      }
      return okJson(res, 503, { error: 'Maintenance en cours' });
    }
  } catch (err) {
    console.error('maintenance middleware:', err);
  }

  next();
});

// ==========================
// Site statique (doit être après /api)
// ==========================
app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`Y8X: http://localhost:${PORT}`);
  console.log(`API:      http://localhost:${PORT}/api/games`);
});
