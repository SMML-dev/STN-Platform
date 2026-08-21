const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const db = new Database(path.join(__dirname, 'stn.db'));

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    designation TEXT NOT NULL,
    quantite INTEGER DEFAULT 0,
    cout_prev_unitaire REAL DEFAULT 0,
    cout_reel_unitaire REAL DEFAULT 0,
    acompte REAL DEFAULT 0,
    delai_livraison TEXT,
    etat TEXT DEFAULT 'en attente',
    observation TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS families (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contact TEXT,
    category_id INTEGER,
    commentaires TEXT,
    FOREIGN KEY (category_id) REFERENCES categories(id)
  );

  CREATE TABLE IF NOT EXISTS stocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    matiere TEXT NOT NULL,
    quantite INTEGER DEFAULT 0,
    prix REAL DEFAULT 0,
    disponibilite TEXT DEFAULT 'indisponible',
    observation TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS charges_fixes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    department TEXT NOT NULL,
    charge_name TEXT NOT NULL,
    quantite INTEGER DEFAULT 0,
    prix_previsionnel REAL DEFAULT 0,
    fournisseur TEXT,
    delai_livraison TEXT,
    etat TEXT DEFAULT 'en attente',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS commandes_prevoir (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    department TEXT NOT NULL,
    article TEXT NOT NULL,
    quantite INTEGER DEFAULT 0,
    prix REAL DEFAULT 0,
    delai_livraison TEXT,
    etat TEXT DEFAULT 'en attente',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS travaux_reparations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    department TEXT NOT NULL,
    domaine TEXT NOT NULL,
    fournisseur TEXT,
    etat TEXT DEFAULT 'en attente',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS price_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    designation TEXT NOT NULL,
    supplier_name TEXT NOT NULL,
    scope TEXT DEFAULT 'national',
    price REAL DEFAULT 0,
    currency TEXT DEFAULT 'FCFA',
    market_url TEXT,
    product_url TEXT,
    recorded_date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number TEXT NOT NULL UNIQUE,
    client_name TEXT NOT NULL,
    client_address TEXT,
    invoice_date DATE NOT NULL,
    due_date DATE,
    status TEXT DEFAULT 'en attente',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS invoice_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER NOT NULL,
    designation TEXT NOT NULL,
    quantite INTEGER DEFAULT 1,
    prix_unitaire REAL DEFAULT 0,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS quotes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quote_number TEXT NOT NULL UNIQUE,
    client_name TEXT NOT NULL,
    client_address TEXT,
    quote_date DATE NOT NULL,
    valid_until DATE,
    status TEXT DEFAULT 'en attente',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS quote_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quote_id INTEGER NOT NULL,
    designation TEXT NOT NULL,
    quantite INTEGER DEFAULT 1,
    prix_unitaire REAL DEFAULT 0,
    FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS activity_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL,
    entity_id INTEGER,
    action TEXT NOT NULL,
    description TEXT,
    status TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS stock_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stock_id INTEGER NOT NULL,
    threshold INTEGER DEFAULT 5,
    triggered INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (stock_id) REFERENCES stocks(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS purchase_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT NOT NULL UNIQUE,
    order_date DATE NOT NULL,
    supplier TEXT NOT NULL,
    section TEXT,
    tva_applicable INTEGER DEFAULT 0,
    notes TEXT,
    premier_acompte REAL DEFAULT 0,
    acompte_restant REAL DEFAULT 0,
    acompte_final REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS purchase_order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    designation TEXT NOT NULL,
    quantite INTEGER DEFAULT 1,
    unite TEXT,
    prix_unitaire REAL DEFAULT 0,
    FOREIGN KEY (order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS sections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  INSERT OR IGNORE INTO sections (name) VALUES
    ('DIRECTION'),
    ('STN GENTLE'),
    ('STN GALLANT'),
    ('STN GENTLE-STN GALLANT');

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    display_name TEXT,
    role TEXT DEFAULT 'manager',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER NOT NULL,
    montant REAL NOT NULL,
    mode TEXT DEFAULT 'espèces',
    payment_date DATE NOT NULL,
    reference TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
  );

  INSERT OR IGNORE INTO users (username, password, display_name, role) VALUES ('admin', '__DEFAULT_HASH__', 'Gestionnaire STN', 'manager');

  INSERT OR IGNORE INTO settings (key, value) VALUES ('default_stock_threshold', '5');
`);

const defaultHash = bcrypt.hashSync('stn2026', 10);
db.prepare("UPDATE users SET password = ? WHERE username = 'admin' AND password = '__DEFAULT_HASH__'").run(defaultHash);

const existingUser = db.prepare('SELECT password FROM users WHERE username = ?').get('admin');
if (existingUser && existingUser.password === 'stn2026') {
  const hashed = bcrypt.hashSync('stn2026', 10);
  db.prepare('UPDATE users SET password = ? WHERE username = ?').run(hashed, 'admin');
}

// Migration: fusion de purchases.commentaires dans purchases.observation
const purchasesCols = db.prepare("PRAGMA table_info(purchases)").all().map(c => c.name);
if (purchasesCols.includes('commentaires')) {
  db.exec(`
    UPDATE purchases SET observation = CASE
      WHEN (observation IS NULL OR observation = '') THEN COALESCE(commentaires, '')
      WHEN (commentaires IS NULL OR commentaires = '') THEN observation
      ELSE observation || ' — ' || commentaires
    END;
    ALTER TABLE purchases DROP COLUMN commentaires;
  `);
  console.log('Migration: commentaires fusionnes dans observation (achats).');
}

// Migration: ancienne table payments (amount/method/note) vers nouveau schema (montant/mode/reference/notes)
const paymentsCols = db.prepare("PRAGMA table_info(payments)").all().map(c => c.name);
if (paymentsCols.length > 0 && !paymentsCols.includes('montant')) {
  db.exec(`
    CREATE TABLE payments_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      montant REAL NOT NULL,
      mode TEXT DEFAULT 'espèces',
      payment_date DATE NOT NULL,
      reference TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
    );
    INSERT INTO payments_new (id, invoice_id, montant, mode, payment_date, notes, created_at)
      SELECT id, invoice_id, amount, method, payment_date, note, created_at FROM payments;
    DROP TABLE payments;
    ALTER TABLE payments_new RENAME TO payments;
  `);
  console.log('Migration de la table payments effectuee.');
}

// Migration: ajout de family_id à la table purchases
const purchasesCols2 = db.prepare("PRAGMA table_info(purchases)").all().map(c => c.name);
if (!purchasesCols2.includes('family_id')) {
  db.exec(`
    ALTER TABLE purchases ADD COLUMN family_id INTEGER;
  `);
  console.log('Migration: colonne family_id ajoutee a la table purchases.');
}

const purchaseOrderCols = db.prepare("PRAGMA table_info(purchase_orders)").all().map(c => c.name);
if (!purchaseOrderCols.includes('premier_acompte')) {
  db.exec(`
    ALTER TABLE purchase_orders ADD COLUMN premier_acompte REAL DEFAULT 0;
    ALTER TABLE purchase_orders ADD COLUMN acompte_restant REAL DEFAULT 0;
    ALTER TABLE purchase_orders ADD COLUMN acompte_final REAL DEFAULT 0;
  `);
  console.log('Migration: colonnes acomptes ajoutees a purchase_orders.');
}

// Migration: ajout de family_id à la table stocks
const stocksCols = db.prepare("PRAGMA table_info(stocks)").all().map(c => c.name);
if (!stocksCols.includes('family_id')) {
  db.exec(`
    ALTER TABLE stocks ADD COLUMN family_id INTEGER;
  `);
  console.log('Migration: colonne family_id ajoutee a la table stocks.');
}

// Migration: ajout de signature a la table purchase_orders
const purchaseOrderCols2 = db.prepare("PRAGMA table_info(purchase_orders)").all().map(c => c.name);
if (!purchaseOrderCols2.includes('signature')) {
  db.exec(`
    ALTER TABLE purchase_orders ADD COLUMN signature TEXT DEFAULT '';
  `);
  console.log('Migration: colonne signature ajoutee a purchase_orders.');
}

// Migration: creation de la table reception_orders
const receptionOrderCols = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='reception_orders'").all();
if (receptionOrderCols.length === 0) {
  db.exec(`
    CREATE TABLE reception_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT NOT NULL UNIQUE,
      order_date DATE NOT NULL,
      supplier TEXT NOT NULL,
      section TEXT,
      notes TEXT,
      signature TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE reception_order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      designation TEXT NOT NULL,
      quantite INTEGER DEFAULT 1,
      unite TEXT,
      FOREIGN KEY (order_id) REFERENCES reception_orders(id) ON DELETE CASCADE
    );
  `);
  console.log('Migration: tables reception_orders et reception_order_items creees.');
}

// Migration: ajout de tva_applicable a la table reception_orders
const receptionOrderCols2 = db.prepare("PRAGMA table_info(reception_orders)").all().map(c => c.name);
if (!receptionOrderCols2.includes('tva_applicable')) {
  db.exec(`
    ALTER TABLE reception_orders ADD COLUMN tva_applicable INTEGER DEFAULT 0;
  `);
  console.log('Migration: colonne tva_applicable ajoutee a reception_orders.');
}

module.exports = db;
