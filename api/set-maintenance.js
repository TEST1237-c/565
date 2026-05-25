require('dotenv').config();
const fs = require('fs/promises');
const path = require('path');

const MAINTENANCE_FILE = path.join(__dirname, '..', 'maintenance.json');

async function getRequestBody(req) {
  if (req.body && Object.keys(req.body).length) return req.body;
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

async function writeMaintenance(state) {
  const payload = {
    enabled: Boolean(state.enabled),
    message: String(state.message || '').trim()
  };
  const data = JSON.stringify(payload, null, 4) + '\n';
  await fs.writeFile(MAINTENANCE_FILE, data, 'utf8');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const expected = process.env.ADMIN_PASSWORD || (process.env.NODE_ENV === 'production' ? '' : 'admin');
  if (!expected) {
    return res.status(500).json({ error: 'ADMIN_PASSWORD non configuré' });
  }

  const { adminPassword, enabled, message } = await getRequestBody(req) || {};
  if (String(adminPassword || '') !== expected) {
    return res.status(401).json({ error: 'Mot de passe admin incorrect' });
  }

  const maintenance = {
    enabled: enabled === true || String(enabled).toLowerCase() === 'true',
    message: String(message || '').trim()
  };

  try {
    await writeMaintenance(maintenance);
    return res.status(200).json({ success: true, maintenance });
  } catch (err) {
    console.error('api/set-maintenance:', err);
    return res.status(500).json({ error: 'Impossible de mettre à jour le statut de maintenance' });
  }
};
