const path = require('path');

const dbConfig = {
  host: process.env.DB_HOST || process.env.MYSQL_HOST || process.env.DATABASE_HOST,
  user: process.env.DB_USER || process.env.MYSQL_USER || process.env.DATABASE_USER,
  password: process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || process.env.DATABASE_PASSWORD,
  database: process.env.DB_NAME || process.env.MYSQL_DATABASE || process.env.DATABASE_NAME,
};

const useMySQL = !!(dbConfig.host || dbConfig.database || dbConfig.user);

let sqliteDb;
let mysqlPool;

if (useMySQL) {
  const mysql = require('mysql2/promise');
  // 'localhost' su Hostinger risolve a IPv6 ::1 → forza 127.0.0.1
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
  });
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
 * Testa la connessione MySQL. Restituisce { ok, error? }.
 */
async function testMySQLConnection() {
  if (!useMySQL || !mysqlPool) return { ok: false, error: 'MySQL non configurato' };
  try {
    const conn = await mysqlPool.getConnection();
    await conn.ping();
    conn.release();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message, code: err.code };
  }
}

module.exports = { getDb, getSqlNow, useMySQL, mysqlPool, testMySQLConnection, dbConfig };
