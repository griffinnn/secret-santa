import pg from 'pg';
import Database3 from 'better-sqlite3';
const { Pool } = pg;

/**
 * Database wrapper that provides PostgreSQL-compatible interface for both SQLite and PostgreSQL
 */
class SQLiteDatabase {
  constructor() {
    this.usePostgres = !!process.env.DATABASE_URL;
    
    if (this.usePostgres) {
      this.pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });
    } else {
      this.db = new Database3('secret-santa.db');
      this.db.pragma('foreign_keys = ON');
    }
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    if (this.usePostgres) {
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          role TEXT DEFAULT 'user',
          wish_list TEXT DEFAULT '',
          gift_hints TEXT DEFAULT '',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS exchanges (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          gift_budget TEXT NOT NULL,
          created_by TEXT NOT NULL REFERENCES users(id),
          start_date TEXT,
          end_date TEXT,
          status TEXT DEFAULT 'active',
          assignments_generated BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS participants (
          id TEXT PRIMARY KEY,
          exchange_id TEXT NOT NULL REFERENCES exchanges(id) ON DELETE CASCADE,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(exchange_id, user_id)
        );

        CREATE TABLE IF NOT EXISTS pending_participants (
          id TEXT PRIMARY KEY,
          exchange_id TEXT NOT NULL REFERENCES exchanges(id) ON DELETE CASCADE,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(exchange_id, user_id)
        );

        CREATE TABLE IF NOT EXISTS assignments (
          id TEXT PRIMARY KEY,
          exchange_id TEXT NOT NULL REFERENCES exchanges(id) ON DELETE CASCADE,
          giver_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          recipient_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(exchange_id, giver_id)
        );
      `);
      console.log('📚 PostgreSQL database initialized');
    } else {
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          role TEXT DEFAULT 'user',
          wish_list TEXT DEFAULT '',
          gift_hints TEXT DEFAULT '',
          created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS exchanges (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          gift_budget TEXT NOT NULL,
          created_by TEXT NOT NULL REFERENCES users(id),
          start_date TEXT,
          end_date TEXT,
          status TEXT DEFAULT 'active',
          assignments_generated INTEGER DEFAULT 0,
          created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS participants (
          id TEXT PRIMARY KEY,
          exchange_id TEXT NOT NULL REFERENCES exchanges(id) ON DELETE CASCADE,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          joined_at TEXT DEFAULT (datetime('now')),
          UNIQUE(exchange_id, user_id)
        );

        CREATE TABLE IF NOT EXISTS pending_participants (
          id TEXT PRIMARY KEY,
          exchange_id TEXT NOT NULL REFERENCES exchanges(id) ON DELETE CASCADE,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          requested_at TEXT DEFAULT (datetime('now')),
          UNIQUE(exchange_id, user_id)
        );

        CREATE TABLE IF NOT EXISTS assignments (
          id TEXT PRIMARY KEY,
          exchange_id TEXT NOT NULL REFERENCES exchanges(id) ON DELETE CASCADE,
          giver_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          recipient_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          created_at TEXT DEFAULT (datetime('now')),
          UNIQUE(exchange_id, giver_id)
        );
      `);
      console.log('📚 SQLite database initialized');
    }
    
    this.initialized = true;
  }

  // PostgreSQL-compatible query interface
  async query(sql, params = []) {
    if (this.usePostgres) {
      return await this.pool.query(sql, params);
    }
    
    // SQLite: Convert $1, $2 placeholders to ?
    const sqliteSQL = sql.replace(/\$(\d+)/g, '?');
    
    try {
      const normalized = sql.trim().toUpperCase();
      const finalParams = params.map(value => value === undefined ? null : value);
      if (normalized.startsWith('SELECT')) {
        const stmt = this.db.prepare(sqliteSQL);
        const rows = finalParams.length > 0 ? stmt.all(...finalParams) : stmt.all();
        return { rows };
      } else if (/RETURNING\s+\*/i.test(sql)) {
        const cleanSQL = sqliteSQL.replace(/RETURNING\s+\*/i, '').trim();
        const stmt = this.db.prepare(cleanSQL);
        const runResult = finalParams.length > 0 ? stmt.run(...finalParams) : stmt.run();
        const tableName = this.getTableName(sql);
        const idIndex = this.getReturningIdIndex(sql, params);
        if (!tableName || idIndex === -1) {
          throw new Error(`Unable to resolve RETURNING handler for SQL: ${sql}`);
        }

        const idValue = params[idIndex];
        if (idValue === undefined) {
          console.warn('RETURNING query missing id parameter', { sql, params });
        }

        const selectStmt = this.db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`);
        const row = idValue !== undefined ? selectStmt.get(idValue) : null;
        return { rows: row ? [row] : [], rowCount: runResult.changes ?? (row ? 1 : 0) };
      } else {
        const stmt = this.db.prepare(sqliteSQL);
        const result = finalParams.length > 0 ? stmt.run(...finalParams) : stmt.run();
        return { rows: [], rowCount: result.changes };
      }
    } catch (error) {
      console.error('SQLite query error:', error, '\nSQL:', sqliteSQL, '\nParams:', params);
      throw error;
    }
  }

  getTableName(sql) {
    const match = sql.match(/INTO\s+(\w+)/i) || sql.match(/UPDATE\s+(\w+)/i);
    return match ? match[1] : null;
  }

  getReturningIdIndex(sql, params) {
    if (/UPDATE\s+/i.test(sql)) {
      return params.length - 1;
    }

    if (/INSERT\s+/i.test(sql)) {
      return 0;
    }

    return -1;
  }

  async close() {
    if (this.usePostgres) {
      if (this.pool) {
        await this.pool.end();
      }
      return;
    }

    if (this.db) {
      this.db.close();
    }
  }
}

export default SQLiteDatabase;
