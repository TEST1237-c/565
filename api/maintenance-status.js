const fs = require('fs/promises');
const path = require('path');

const MAINTENANCE_FILE = path.join(__dirname, '..', 'maintenance.json');

async function readMaintenance() {
  try {
    const raw = await fs.readFile(MAINTENANCE_FILE, 'utf8');
    const data = JSON.parse(raw);
    return {
      enabled: Boolean(data.enabled),
      message: String(data.message || '').trim()
    };
  } catch (err) {
    if (err && (err.code === 'ENOENT' || err.code === 'ENOTDIR')) {
      return { enabled: false, message: '' };
    }
    throw err;
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const maintenance = await readMaintenance();
    return res.status(200).json(maintenance);
  } catch (err) {
    console.error('api/maintenance-status:', err);
    return res.status(500).json({ error: 'Impossible de charger le statut de maintenance' });
  }
};
