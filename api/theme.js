// /api/theme — GET lit le thème, POST le change
const path = require('path');
const fs   = require('fs');

module.exports = function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

    // ── GET ──────────────────────────────────────────
    if (req.method === 'GET') {
        try {
            const raw  = fs.readFileSync(path.join(process.cwd(), 'theme.json'), 'utf-8');
            const data = JSON.parse(raw);
            return res.status(200).json({ theme: data.theme || 'default' });
        } catch {
            return res.status(200).json({ theme: 'default' });
        }
    }

    // ── POST ─────────────────────────────────────────
    if (req.method === 'POST') {
        const { adminPassword, theme } = req.body || {};

        const expected = process.env.ADMIN_PASSWORD || (process.env.NODE_ENV === 'production' ? '' : 'admin');
        if (!expected)                                    return res.status(500).json({ error: 'ADMIN_PASSWORD non configuré' });
        if (String(adminPassword || '') !== expected)     return res.status(401).json({ error: 'Mot de passe admin incorrect' });

        const VALID = ['default', 'halloween', 'noel'];
        if (!VALID.includes(theme))                       return res.status(400).json({ error: `Thème invalide. Valeurs : ${VALID.join(', ')}` });

        try {
            fs.writeFileSync(path.join(process.cwd(), 'theme.json'), JSON.stringify({ theme }, null, 4) + '\n', 'utf-8');
            return res.status(200).json({ success: true, theme });
        } catch (e) {
            return res.status(500).json({ error: 'Impossible d\'écrire theme.json : ' + e.message });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
};
