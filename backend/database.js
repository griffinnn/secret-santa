import pg from 'pg';
import JSONDatabase from './database-json.js';
import SQLiteDatabase from './database-sqlite.js';
const { Pool } = pg;

class Database {
  constructor() {
    const clientPreference = (process.env.DATABASE_CLIENT || '').toLowerCase();
    const usePostgres = !!process.env.DATABASE_URL && clientPreference !== 'json';
    const useSQLite = !usePostgres && clientPreference === 'sqlite';

    if (usePostgres) {
      console.log('🔍 Database mode: PostgreSQL (production)');
      this.db = {
        pool: new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        })
      };
      this.pool = this.db.pool;
      this.initialized = false;
    } else if (useSQLite) {
      console.log('🔍 Database mode: SQLite (local)');
      this.sqlite = new SQLiteDatabase();
      this.pool = {
        query: (sql, params) => this.sqlite.query(sql, params)
      };
      this.initialized = false;
    } else {
      console.log('🔍 Database mode: JSON file (local)');
      this.db = new JSONDatabase();
      // Redirect all calls to JSON database
      return this.db;
    }
  }

  async initialize() {
    if (this.initialized) return;

    if (this.sqlite) {
      await this.sqlite.initialize();
      this.initialized = true;
      return;
    }

    if (this.pool) {
      // PostgreSQL initialization
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
    }

    this.initialized = true;
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Users
  async createUser(userData) {
    await this.initialize();
    const id = this.generateId();
    const result = await this.pool.query(
      `INSERT INTO users (id, name, email, role, wish_list, gift_hints) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [id, userData.name, userData.email, userData.role || 'user', userData.wishList || '', userData.giftHints || '']
    );
    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      wishList: row.wish_list,
      giftHints: row.gift_hints,
      createdAt: row.created_at
    };
  }

  async getUserById(id) {
    await this.initialize();
    const result = await this.pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      wishList: row.wish_list,
      giftHints: row.gift_hints,
      createdAt: row.created_at
    };
  }

  async getUserByEmail(email) {
    await this.initialize();
    const result = await this.pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      wishList: row.wish_list,
      giftHints: row.gift_hints,
      createdAt: row.created_at
    };
  }

  async getAllUsers() {
    await this.initialize();
    const result = await this.pool.query('SELECT * FROM users');
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      wishList: row.wish_list,
      giftHints: row.gift_hints,
      createdAt: row.created_at
    }));
  }

  async updateUser(id, updates) {
    await this.initialize();
    const sets = [];
    const values = [];
    let paramCount = 1;

    if (updates.name !== undefined) {
      sets.push(`name = $${paramCount++}`);
      values.push(updates.name);
    }
    if (updates.email !== undefined) {
      sets.push(`email = $${paramCount++}`);
      values.push(updates.email);
    }
    if (updates.wishList !== undefined) {
      sets.push(`wish_list = $${paramCount++}`);
      values.push(updates.wishList);
    }
    if (updates.giftHints !== undefined) {
      sets.push(`gift_hints = $${paramCount++}`);
      values.push(updates.giftHints);
    }

    if (sets.length === 0) return this.getUserById(id);

    values.push(id);
    const result = await this.pool.query(
      `UPDATE users SET ${sets.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      wishList: row.wish_list,
      giftHints: row.gift_hints,
      createdAt: row.created_at
    };
  }

  async deleteUser(id) {
    await this.initialize();
    const result = await this.pool.query('DELETE FROM users WHERE id = $1', [id]);
    return result.rowCount > 0;
  }

  // Exchanges
  async createExchange(exchangeData) {
    await this.initialize();
    const id = this.generateId();
    const result = await this.pool.query(
      `INSERT INTO exchanges (id, name, gift_budget, created_by, start_date, end_date, status, assignments_generated)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [id, exchangeData.name, exchangeData.giftBudget, exchangeData.createdBy, 
       exchangeData.startDate, exchangeData.endDate, exchangeData.status || 'active', 
       exchangeData.assignmentsGenerated || false]
    );
    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      giftBudget: row.gift_budget,
      createdBy: row.created_by,
      startDate: row.start_date,
      endDate: row.end_date,
      status: row.status,
      assignmentsGenerated: row.assignments_generated,
      createdAt: row.created_at
    };
  }

  async getExchangeById(id) {
    await this.initialize();
    const result = await this.pool.query('SELECT * FROM exchanges WHERE id = $1', [id]);
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      giftBudget: row.gift_budget,
      createdBy: row.created_by,
      startDate: row.start_date,
      endDate: row.end_date,
      status: row.status,
      assignmentsGenerated: row.assignments_generated,
      createdAt: row.created_at
    };
  }

  async getAllExchanges() {
    await this.initialize();
    const result = await this.pool.query('SELECT * FROM exchanges');
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      giftBudget: row.gift_budget,
      createdBy: row.created_by,
      startDate: row.start_date,
      endDate: row.end_date,
      status: row.status,
      assignmentsGenerated: row.assignments_generated,
      createdAt: row.created_at
    }));
  }

  async getExchangesByUserId(userId) {
    await this.initialize();
    const result = await this.pool.query(`
      SELECT DISTINCT e.* FROM exchanges e
      LEFT JOIN participants p ON e.id = p.exchange_id
      WHERE e.created_by = $1 OR p.user_id = $1
    `, [userId]);
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      giftBudget: row.gift_budget,
      createdBy: row.created_by,
      startDate: row.start_date,
      endDate: row.end_date,
      status: row.status,
      assignmentsGenerated: row.assignments_generated,
      createdAt: row.created_at
    }));
  }

  async updateExchange(id, updates) {
    await this.initialize();
    const sets = [];
    const values = [];
    let paramCount = 1;

    if (updates.name !== undefined) {
      sets.push(`name = $${paramCount++}`);
      values.push(updates.name);
    }
    if (updates.giftBudget !== undefined) {
      sets.push(`gift_budget = $${paramCount++}`);
      values.push(updates.giftBudget);
    }
    if (updates.startDate !== undefined) {
      sets.push(`start_date = $${paramCount++}`);
      values.push(updates.startDate);
    }
    if (updates.endDate !== undefined) {
      sets.push(`end_date = $${paramCount++}`);
      values.push(updates.endDate);
    }
    if (updates.status !== undefined) {
      sets.push(`status = $${paramCount++}`);
      values.push(updates.status);
    }
    if (updates.assignmentsGenerated !== undefined) {
      sets.push(`assignments_generated = $${paramCount++}`);
      values.push(updates.assignmentsGenerated);
    }

    if (sets.length === 0) return this.getExchangeById(id);

    values.push(id);
    const result = await this.pool.query(
      `UPDATE exchanges SET ${sets.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      giftBudget: row.gift_budget,
      createdBy: row.created_by,
      startDate: row.start_date,
      endDate: row.end_date,
      status: row.status,
      assignmentsGenerated: row.assignments_generated,
      createdAt: row.created_at
    };
  }

  async deleteExchange(id) {
    await this.initialize();
    const result = await this.pool.query('DELETE FROM exchanges WHERE id = $1', [id]);
    return result.rowCount > 0;
  }

  // Participants
  async addParticipant(participantData) {
    await this.initialize();
    const id = this.generateId();
    const result = await this.pool.query(
      `INSERT INTO participants (id, exchange_id, user_id) VALUES ($1, $2, $3) RETURNING *`,
      [id, participantData.exchangeId, participantData.userId]
    );
    const row = result.rows[0];
    return {
      id: row.id,
      exchangeId: row.exchange_id,
      userId: row.user_id,
      joinedAt: row.joined_at
    };
  }

  async getParticipantsByExchangeId(exchangeId) {
    await this.initialize();
    const result = await this.pool.query(
      'SELECT * FROM participants WHERE exchange_id = $1',
      [exchangeId]
    );
    return result.rows.map(row => ({
      id: row.id,
      exchangeId: row.exchange_id,
      userId: row.user_id,
      joinedAt: row.joined_at
    }));
  }

  async getParticipant(exchangeId, userId) {
    await this.initialize();
    const result = await this.pool.query(
      'SELECT * FROM participants WHERE exchange_id = $1 AND user_id = $2',
      [exchangeId, userId]
    );
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      id: row.id,
      exchangeId: row.exchange_id,
      userId: row.user_id,
      joinedAt: row.joined_at
    };
  }

  async removeParticipant(exchangeId, userId) {
    await this.initialize();
    const result = await this.pool.query(
      'DELETE FROM participants WHERE exchange_id = $1 AND user_id = $2',
      [exchangeId, userId]
    );
    return result.rowCount > 0;
  }

  // Pending Participants
  async addPendingParticipant(pendingData) {
    await this.initialize();
    const id = this.generateId();
    const result = await this.pool.query(
      `INSERT INTO pending_participants (id, exchange_id, user_id) VALUES ($1, $2, $3) RETURNING *`,
      [id, pendingData.exchangeId, pendingData.userId]
    );
    const row = result.rows[0];
    return {
      id: row.id,
      exchangeId: row.exchange_id,
      userId: row.user_id,
      requestedAt: row.requested_at
    };
  }

  async getPendingParticipantsByExchangeId(exchangeId) {
    await this.initialize();
    const result = await this.pool.query(
      'SELECT * FROM pending_participants WHERE exchange_id = $1',
      [exchangeId]
    );
    return result.rows.map(row => ({
      id: row.id,
      exchangeId: row.exchange_id,
      userId: row.user_id,
      requestedAt: row.requested_at
    }));
  }

  async getPendingParticipant(exchangeId, userId) {
    await this.initialize();
    const result = await this.pool.query(
      'SELECT * FROM pending_participants WHERE exchange_id = $1 AND user_id = $2',
      [exchangeId, userId]
    );
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      id: row.id,
      exchangeId: row.exchange_id,
      userId: row.user_id,
      requestedAt: row.requested_at
    };
  }

  async removePendingParticipant(exchangeId, userId) {
    await this.initialize();
    const result = await this.pool.query(
      'DELETE FROM pending_participants WHERE exchange_id = $1 AND user_id = $2',
      [exchangeId, userId]
    );
    return result.rowCount > 0;
  }

  // Assignments
  async createAssignment(assignmentData) {
    await this.initialize();
    const id = this.generateId();
    const result = await this.pool.query(
      `INSERT INTO assignments (id, exchange_id, giver_id, recipient_id) VALUES ($1, $2, $3, $4) RETURNING *`,
      [id, assignmentData.exchangeId, assignmentData.giverId, assignmentData.recipientId]
    );
    const row = result.rows[0];
    return {
      id: row.id,
      exchangeId: row.exchange_id,
      giverId: row.giver_id,
      recipientId: row.recipient_id,
      createdAt: row.created_at
    };
  }

  async getAssignmentsByExchangeId(exchangeId) {
    await this.initialize();
    const result = await this.pool.query(
      'SELECT * FROM assignments WHERE exchange_id = $1',
      [exchangeId]
    );
    return result.rows.map(row => ({
      id: row.id,
      exchangeId: row.exchange_id,
      giverId: row.giver_id,
      recipientId: row.recipient_id,
      createdAt: row.created_at
    }));
  }

  async getAssignmentForGiver(exchangeId, giverId) {
    await this.initialize();
    const result = await this.pool.query(
      'SELECT * FROM assignments WHERE exchange_id = $1 AND giver_id = $2',
      [exchangeId, giverId]
    );
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      id: row.id,
      exchangeId: row.exchange_id,
      giverId: row.giver_id,
      recipientId: row.recipient_id,
      createdAt: row.created_at
    };
  }

  async getAssignmentsForRecipient(exchangeId, recipientId) {
    await this.initialize();
    const result = await this.pool.query(
      'SELECT * FROM assignments WHERE exchange_id = $1 AND recipient_id = $2',
      [exchangeId, recipientId]
    );
    return result.rows.map(row => ({
      id: row.id,
      exchangeId: row.exchange_id,
      giverId: row.giver_id,
      recipientId: row.recipient_id,
      createdAt: row.created_at
    }));
  }

  async deleteAssignment(id) {
    await this.initialize();
    const result = await this.pool.query('DELETE FROM assignments WHERE id = $1', [id]);
    return result.rowCount > 0;
  }
}

export const db = new Database();
