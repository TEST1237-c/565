// POST /api/update-cheat-status — modifie le statut d'un cheat (écrit dans GitHub via l'API)
module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { adminPassword, cheatId, status } = req.body || {};
    if (!adminPassword || !cheatId || !status) {
        return res.status(400).json({ error: 'Données manquantes (adminPassword, cheatId, status)' });
    }

    const expectedPassword = process.env.ADMIN_PASSWORD;
    if (!expectedPassword || adminPassword !== expectedPassword) {
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

    try {
        const apiBase = `https://api.github.com/repos/${owner}/${repoName}/contents`;
        const headers = {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
        };

        // Lire le fichier cheat-status.json actuel
        let current = {};
        let sha = null;

        const getRes = await fetch(`${apiBase}/cheat-status.json`, { headers });
        if (getRes.ok) {
            const file = await getRes.json();
            sha = file.sha;
            const decoded = Buffer.from(file.content, 'base64').toString('utf-8');
            try {
                current = JSON.parse(decoded);
            } catch (parseErr) {
                throw new Error('cheat-status.json invalide: ' + parseErr.message);
            }
        } else if (getRes.status !== 404) {
            const err = await getRes.text();
            throw new Error(`GitHub GET: ${getRes.status} ${err}`);
        }

        if (!current[cheatId]) {
            return res.status(404).json({ error: 'Cheat introuvable' });
        }

        // Mettre à jour le statut
        current[cheatId].status = status;
        const content = Buffer.from(JSON.stringify(current, null, 4)).toString('base64');

        const putBody = {
            message: `Update cheat status: ${cheatId} -> ${status}`,
            content,
            branch
        };
        if (sha) putBody.sha = sha;

        const putRes = await fetch(`${apiBase}/cheat-status.json`, {
            method: 'PUT',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify(putBody)
        });

        if (!putRes.ok) {
            const errText = await putRes.text();
            throw new Error(`GitHub PUT: ${putRes.status} ${errText}`);
        }

        return res.status(200).json({ success: true, message: 'Statut modifié.' });
    } catch (e) {
        console.error('api/update-cheat-status:', e.message);
        return res.status(500).json({ error: 'Erreur serveur: ' + e.message });
    }
};
