// GET /api/maintenance-status — lit le statut de maintenance depuis GitHub
module.exports = async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const token = process.env.GITHUB_TOKEN;
    const repo = process.env.GITHUB_REPO;
    const branch = process.env.GITHUB_BRANCH || 'main';

    if (!token || !repo) {
        return res.status(500).json({ error: 'GITHUB_TOKEN ou GITHUB_REPO non configuré' });
    }

    const [owner, repoName] = repo.split('/');

    try {
        const apiUrl = `https://api.github.com/repos/${owner}/${repoName}/contents/maintenance.json?ref=${branch}`;
        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Cache-Control': 'no-store'
            }
        });

        if (!response.ok) {
            if (response.status === 404) return res.status(200).json({ enabled: false, message: '' });
            throw new Error(`GitHub API ${response.status}`);
        }

        const file = await response.json();
        const decoded = Buffer.from(file.content, 'base64').toString('utf-8');
        const data = JSON.parse(decoded);

        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        return res.status(200).json({
            enabled: Boolean(data.enabled),
            message: String(data.message || '').trim()
        });
    } catch (e) {
        console.error('api/maintenance-status:', e.message);
        return res.status(500).json({ error: 'Impossible de charger le statut de maintenance' });
    }
};
