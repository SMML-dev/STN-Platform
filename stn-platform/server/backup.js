const fs = require('fs');
const path = require('path');
const db = require('./db');

const BACKUP_DIR = path.join(__dirname, 'backups');
const MAX_BACKUPS = 30;
const BACKUP_INTERVAL_MS = 6 * 60 * 60 * 1000; // toutes les 6 heures

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

function createBackup() {
  try {
    ensureBackupDir();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupPath = path.join(BACKUP_DIR, `stn_backup_${timestamp}.db`);
    db.backup(backupPath)
      .then(() => {
        console.log(`Sauvegarde creee: ${backupPath}`);
        cleanOldBackups();
      })
      .catch(err => console.error('Erreur de sauvegarde:', err.message));
  } catch (err) {
    console.error('Erreur de sauvegarde:', err.message);
  }
}

function cleanOldBackups() {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('stn_backup_') && f.endsWith('.db'))
      .map(f => ({ name: f, time: fs.statSync(path.join(BACKUP_DIR, f)).mtimeMs }))
      .sort((a, b) => b.time - a.time);
    for (const file of files.slice(MAX_BACKUPS)) {
      fs.unlinkSync(path.join(BACKUP_DIR, file.name));
    }
  } catch (err) {
    console.error('Erreur de nettoyage des sauvegardes:', err.message);
  }
}

function startBackupScheduler() {
  createBackup(); // sauvegarde au demarrage
  setInterval(createBackup, BACKUP_INTERVAL_MS);
  console.log('Sauvegarde automatique activee (toutes les 6 heures, 30 sauvegardes max).');
}

module.exports = { startBackupScheduler, createBackup };
