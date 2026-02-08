const path = require('path');

// ─── Credenziali MySQL Hostinger (hardcoded come fallback) ───
const MYSQL_DEFAULTS = {
  host: '127.0.0.1',
  user: 'u825008747_tronco',
  password: 'Tronco2007@',
  database: 'u825008747_wagservices',
};

const dbConfig = {
  host: process.env.DB_HOST || MYSQL_DEFAULTS.host,
  user: process.env.DB_USER || MYSQL_DEFAULTS.user,
  password: process.env.DB_PASSWORD || MYSQL_DEFAULTS.password,
  database: process.env.DB_NAME || MYSQL_DEFAULTS.database,
};

// Inizia con MySQL abilitato, ma può ricadere su SQLite se fallisce
let useMySQL = true;
let mysqlReady = false;

let sqliteDb;
let mysqlPool;

if (useMySQL) {
  const mysql = require('mysql2/promise');
  let dbHost = dbConfig.host || '127.0.0.1';
  if (dbHost === 'localhost') dbHost = '127.0.0.1';

  mysqlPool = mysql.createPool({
    host: dbHost,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4',
    connectTimeout: 5000,
  });
}

/** Ricade su SQLite se MySQL non funziona */
function switchToSqlite() {
  console.log('  ⚠️  Ricaduta su SQLite (MySQL non disponibile)');
  useMySQL = false;
  mysqlReady = false;
}

function getSqliteDb() {
  if (!sqliteDb) {
    const Database = require('better-sqlite3');
    const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', '..', 'data', 'database.sqlite');
    sqliteDb = new Database(DB_PATH);
    sqliteDb.pragma('journal_mode = WAL');
    sqliteDb.pragma('foreign_keys = ON');
  }
  return sqliteDb;
}

/** Restituisce l’espressione SQL per “adesso” (SQLite vs MySQL) */
function getSqlNow() {
  return useMySQL ? 'NOW()' : "datetime('now')";
}

/**
 * Adapter unico: get, all, run restituiscono sempre Promise.
 * Le route usano await; in locale (SQLite) funziona uguale.
 */
function getDb() {
  if (useMySQL) {
    return {
      get: async (sql, params = []) => {
        const [rows] = await mysqlPool.execute(sql, Array.isArray(params) ? params : [params]);
        return rows[0] || null;
      },
      all: async (sql, params = []) => {
        const [rows] = await mysqlPool.execute(sql, Array.isArray(params) ? params : [params]);
        return rows;
      },
      run: async (sql, params = []) => {
        const [result] = await mysqlPool.execute(sql, Array.isArray(params) ? params : [params]);
        return { insertId: result.insertId, changes: result.affectedRows };
      },
    };
  }

  const db = getSqliteDb();
  return {
    get: (sql, params = []) => Promise.resolve(db.prepare(sql).get(...(Array.isArray(params) ? params : [params]))),
    all: (sql, params = []) => Promise.resolve(db.prepare(sql).all(...(Array.isArray(params) ? params : [params]))),
    run: (sql, params = []) => Promise.resolve(db.prepare(sql).run(...(Array.isArray(params) ? params : [params]))),
  };
}

/**
 * Testa la connessione MySQL. Prova 127.0.0.1 e poi localhost.
 */
async function testMySQLConnection() {
  if (!mysqlPool) return { ok: false, error: 'MySQL non configurato' };
  
  async function tryPool(pool, label) {
    return Promise.race([
      (async () => {
        const conn = await pool.getConnection();
        await conn.ping();
        conn.release();
        return { ok: true };
      })(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout 5s')), 5000)),
    ]);
  }
  
  // Primo tentativo con host configurato
  try {
    await tryPool(mysqlPool, dbConfig.host);
    mysqlReady = true;
    return { ok: true };
  } catch (err) {
    console.log(`  ⚠️  MySQL (${dbConfig.host}) fallito: ${err.code || err.message}`);
  }

  // Secondo tentativo: prova host alternativo
  try {
    const mysql = require('mysql2/promise');
    const altHost = dbConfig.host === '127.0.0.1' ? 'localhost' : '127.0.0.1';
    console.log(`  🔄 Riprovo con host: ${altHost}...`);
    
    const altPool = mysql.createPool({
      host: altHost,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: 'utf8mb4',
      connectTimeout: 5000,
    });
    
    await tryPool(altPool, altHost);
    
    // Funziona con host alternativo: aggiorna il pool
    mysqlPool = altPool;
    dbConfig.host = altHost;
    mysqlReady = true;
    return { ok: true, host: altHost };
  } catch (err2) {
    return { ok: false, error: err2.message, code: err2.code };
  }
}

module.exports = {
  getDb, getSqlNow, mysqlPool, testMySQLConnection, dbConfig, switchToSqlite,
  get useMySQL() { return useMySQL; },
};
