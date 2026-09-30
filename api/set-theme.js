// POST /api/set-theme — change le thème actif (écrit theme.json dans GitHub)
module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { adminPassword, theme } = req.body || {};

    const expectedPassword = process.env.ADMIN_PASSWORD || (process.env.NODE_ENV === 'production' ? '' : 'admin');
    if (!expectedPassword) {
        return res.status(500).json({ error: 'ADMIN_PASSWORD non configuré' });
    }
    if (String(adminPassword || '') !== expectedPassword) {
        return res.status(401).json({ error: 'Mot de passe admin incorrect' });
    }

    const VALID_THEMES = ['default', 'halloween', 'noel'];
    if (!VALID_THEMES.includes(theme)) {
        return res.status(400).json({ error: `Thème invalide. Valeurs acceptées : ${VALID_THEMES.join(', ')}` });
    }

    const token  = process.env.GITHUB_TOKEN;
    const repo   = process.env.GITHUB_REPO;
    const branch = process.env.GITHUB_BRANCH || 'main';

    if (!token || !repo) {
        return res.status(500).json({ error: 'GITHUB_TOKEN ou GITHUB_REPO non configuré sur Vercel' });
    }

    const [owner, repoName] = repo.split('/');
    if (!owner || !repoName) {
        return res.status(500).json({ error: 'GITHUB_REPO doit être au format owner/repo' });
    }

    const themeData = { theme };

    try {
        const apiBase = `https://api.github.com/repos/${owner}/${repoName}/contents`;
        const headers = {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
        };

        // Récupérer le SHA actuel si le fichier existe déjà
        let sha = null;
        const getRes = await fetch(`${apiBase}/theme.json`, { headers });
        if (getRes.ok) {
            const file = await getRes.json();
            sha = file.sha;
        } else if (getRes.status !== 404) {
            const err = await getRes.text();
            throw new Error(`GitHub GET: ${getRes.status} ${err}`);
        }

        const content = Buffer.from(JSON.stringify(themeData, null, 4) + '\n').toString('base64');

        const putBody = {
            message: `Set theme: ${theme}`,
            content,
            branch
        };
        if (sha) putBody.sha = sha;

        const putRes = await fetch(`${apiBase}/theme.json`, {
            method: 'PUT',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify(putBody)
        });

        if (!putRes.ok) {
            const errText = await putRes.text();
            throw new Error(`GitHub PUT: ${putRes.status} ${errText}`);
        }

        return res.status(200).json({ success: true, theme });
    } catch (e) {
        console.error('api/set-theme:', e.message);
        return res.status(500).json({ error: 'Erreur serveur: ' + e.message });
    }
};
