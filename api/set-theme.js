// POST /api/set-theme — écrit le thème choisi dans theme.json (fichier local)
const path = require('path');
const fs   = require('fs');

module.exports = function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { adminPassword, theme } = req.body || {};

    const expected = process.env.ADMIN_PASSWORD || (process.env.NODE_ENV === 'production' ? '' : 'admin');
    if (!expected) {
        return res.status(500).json({ error: 'ADMIN_PASSWORD non configuré' });
    }
    if (String(adminPassword || '') !== expected) {
        return res.status(401).json({ error: 'Mot de passe admin incorrect' });
    }

    const VALID = ['default', 'halloween', 'noel'];
    if (!VALID.includes(theme)) {
        return res.status(400).json({ error: `Thème invalide. Valeurs : ${VALID.join(', ')}` });
    }

    try {
        const filePath = path.join(process.cwd(), 'theme.json');
        fs.writeFileSync(filePath, JSON.stringify({ theme }, null, 4) + '\n', 'utf-8');
        return res.status(200).json({ success: true, theme });
    } catch (e) {
        console.error('api/set-theme:', e.message);
        return res.status(500).json({ error: 'Impossible d\'écrire theme.json : ' + e.message });
    }
};
