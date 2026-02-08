const mysql = require('mysql2/promise');

// Credenziali MySQL Hostinger (hardcoded come fallback)
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

// Pool MySQL
let dbHost = dbConfig.host || '127.0.0.1';
if (dbHost === 'localhost') dbHost = '127.0.0.1';

let mysqlPool = mysql.createPool({
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

function getSqlNow() {
  return 'NOW()';
}

function getDb() {
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

async function testMySQLConnection() {
  async function tryPool(pool) {
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
    await tryPool(mysqlPool);
    return { ok: true };
  } catch (err) {
    console.log('  MySQL (' + dbConfig.host + ') fallito: ' + (err.code || err.message));
  }

  // Secondo tentativo: prova host alternativo
  try {
    const altHost = dbConfig.host === '127.0.0.1' ? 'localhost' : '127.0.0.1';
    console.log('  Riprovo con host: ' + altHost + '...');
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
    await tryPool(altPool);
    mysqlPool = altPool;
    dbConfig.host = altHost;
    return { ok: true, host: altHost };
  } catch (err2) {
    return { ok: false, error: err2.message, code: err2.code };
  }
}

module.exports = { getDb, getSqlNow, mysqlPool, testMySQLConnection, dbConfig };
