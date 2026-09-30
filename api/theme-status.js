// GET /api/theme-status — lit le thème actif depuis theme.json (fichier local)
const path = require('path');
const fs   = require('fs');

module.exports = function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const filePath = path.join(process.cwd(), 'theme.json');
        const raw  = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(raw);
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        return res.status(200).json({ theme: data.theme || 'default' });
    } catch (e) {
        // Fichier absent ou invalide → thème par défaut
        return res.status(200).json({ theme: 'default' });
    }
};
