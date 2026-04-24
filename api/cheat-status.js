// GET /api/cheat-status — renvoie les statuts des cheats (depuis GitHub raw)
module.exports = async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const repo = process.env.GITHUB_REPO;
    if (!repo) {
        return res.status(500).json({ error: 'GITHUB_REPO non configuré' });
    }

    const branch = process.env.GITHUB_BRANCH || 'main';
    const url = `https://raw.githubusercontent.com/${repo}/${branch}/cheat-status.json`;

    try {
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) {
            if (response.status === 404) return res.status(200).json({});
            throw new Error(`GitHub ${response.status}`);
        }
        const data = await response.json();
        res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate');
        return res.status(200).json(data);
    } catch (e) {
        console.error('api/cheat-status:', e.message);
        return res.status(500).json({ error: 'Impossible de charger les statuts' });
    }
};