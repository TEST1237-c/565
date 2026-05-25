// POST /api/set-maintenance — active/désactive la maintenance (écrit dans GitHub via l'API)
module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { adminPassword, enabled, message } = req.body || {};

    const expectedPassword = process.env.ADMIN_PASSWORD || (process.env.NODE_ENV === 'production' ? '' : 'admin');
    if (!expectedPassword) {
        return res.status(500).json({ error: 'ADMIN_PASSWORD non configuré' });
    }
    if (String(adminPassword || '') !== expectedPassword) {
        return res.status(401).json({ error: 'Mot de passe admin incorrect' });
    }

    const token = process.env.GITHUB_TOKEN;
    const repo = process.env.GITHUB_REPO;
    const branch = process.env.GITHUB_BRANCH || 'main';

    if (!token || !repo) {
        return res.status(500).json({ error: 'GITHUB_TOKEN ou GITHUB_REPO non configuré sur Vercel' });
    }

    const [owner, repoName] = repo.split('/');
    if (!owner || !repoName) {
        return res.status(500).json({ error: 'GITHUB_REPO doit être au format owner/repo' });
    }

    const maintenance = {
        enabled: enabled === true || String(enabled).toLowerCase() === 'true',
        message: String(message || '').trim()
    };

    try {
        const apiBase = `https://api.github.com/repos/${owner}/${repoName}/contents`;
        const headers = {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
        };

        // Récupérer le SHA actuel du fichier (nécessaire pour le PUT)
        let sha = null;
        const getRes = await fetch(`${apiBase}/maintenance.json`, { headers });
        if (getRes.ok) {
            const file = await getRes.json();
            sha = file.sha;
        } else if (getRes.status !== 404) {
            const err = await getRes.text();
            throw new Error(`GitHub GET: ${getRes.status} ${err}`);
        }

        const content = Buffer.from(JSON.stringify(maintenance, null, 4) + '\n').toString('base64');

        const putBody = {
            message: `Set maintenance: ${maintenance.enabled ? 'ON' : 'OFF'}`,
            content,
            branch
        };
        if (sha) putBody.sha = sha;

        const putRes = await fetch(`${apiBase}/maintenance.json`, {
            method: 'PUT',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify(putBody)
        });

        if (!putRes.ok) {
            const errText = await putRes.text();
            throw new Error(`GitHub PUT: ${putRes.status} ${errText}`);
        }

        return res.status(200).json({ success: true, maintenance });
    } catch (e) {
        console.error('api/set-maintenance:', e.message);
        return res.status(500).json({ error: 'Erreur serveur: ' + e.message });
    }
};
