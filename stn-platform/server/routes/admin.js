const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAdmin } = require('../authMiddleware');
const { logAudit } = require('../auditLogger');
const { createBackup } = require('../backup');

// Toutes les routes admin nécessitent d'être administrateur
router.use(requireAdmin);

/**
 * Réinitialisation sécurisée de la plateforme par l'administrateur
 * Crée une sauvegarde automatique SQLite avant de vider les données opérationnelles
 */
router.post('/reset', (req, res) => {
  try {
    // 1. Sauvegarde automatique de sécurité
    createBackup();

    // 2. Réinitialisation des tables opérationnelles dans une transaction SQLite
    const resetTransaction = db.transaction(() => {
      // Commandes et réceptions
      db.prepare('DELETE FROM purchase_order_items').run();
      db.prepare('DELETE FROM purchase_orders').run();
      db.prepare('DELETE FROM reception_order_items').run();
      db.prepare('DELETE FROM reception_orders').run();

      // Achats et stocks
      db.prepare('DELETE FROM purchases').run();
      db.prepare('DELETE FROM stock_alerts').run();
      db.prepare('DELETE FROM stocks').run();

      // Factures, devis et paiements
      db.prepare('DELETE FROM invoice_items').run();
      db.prepare('DELETE FROM invoices').run();
      db.prepare('DELETE FROM quote_items').run();
      db.prepare('DELETE FROM quotes').run();
      db.prepare('DELETE FROM payments').run();

      // Gestion départementale (Charges, commandes à prévoir, travaux)
      db.prepare('DELETE FROM charges_fixes').run();
      db.prepare('DELETE FROM commandes_prevoir').run();
      db.prepare('DELETE FROM travaux_reparations').run();

      // Historique des prix marché
      db.prepare('DELETE FROM price_history').run();

      // Fournisseurs et familles
      db.prepare('DELETE FROM suppliers').run();
      db.prepare('DELETE FROM categories').run();
      db.prepare('DELETE FROM families').run();

      // Sections par défaut
      db.prepare('DELETE FROM sections').run();
      const insertSection = db.prepare('INSERT INTO sections (name) VALUES (?)');
      insertSection.run('DIRECTION');
      insertSection.run('STN GENTLE');
      insertSection.run('STN GALLANT');
      insertSection.run('STN GENTLE-STN GALLANT');

      // Remise à zéro des compteurs auto-incrémentés pour les tables vidées
      const tablesToResetSeq = [
        'purchases', 'purchase_orders', 'purchase_order_items',
        'reception_orders', 'reception_order_items', 'stocks', 'stock_alerts',
        'charges_fixes', 'commandes_prevoir', 'travaux_reparations',
        'price_history', 'invoices', 'invoice_items', 'quotes', 'quote_items',
        'payments', 'suppliers', 'categories', 'families', 'sections'
      ];

      for (const tbl of tablesToResetSeq) {
        db.prepare('DELETE FROM sqlite_sequence WHERE name = ?').run(tbl);
      }
    });

    resetTransaction();

    // 3. Enregistrement de l'événement dans le journal d'audit
    logAudit(req, {
      action: 'RÉINITIALISATION',
      entity_type: 'Plateforme',
      entity_id: 'GLOBAL',
      description: `Réinitialisation complète des données de la plateforme effectuée par l'administrateur ${req.user?.display_name || req.user?.username}. Une sauvegarde de sécurité a été archivée.`
    });

    res.json({
      success: true,
      message: 'La plateforme a été réinitialisée avec succès. Une sauvegarde de sécurité automatique a été créée.'
    });
  } catch (err) {
    console.error('Erreur lors de la réinitialisation de la plateforme:', err);
    res.status(500).json({ error: `Erreur lors de la réinitialisation: ${err.message}` });
  }
});

module.exports = router;
