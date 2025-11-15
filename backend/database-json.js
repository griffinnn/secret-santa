import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, 'database.json');

class Database {
  constructor() {
    this.data = {
      users: [],
      exchanges: [],
      participants: [],
      pendingParticipants: [],
      assignments: []
    };
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      const fileContent = await fs.readFile(DB_FILE, 'utf-8');
      this.data = JSON.parse(fileContent);
      console.log('📚 Database loaded from file');
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, create it
        await this.save();
        console.log('📚 Database file created');
      } else {
        console.error('Error reading database:', error);
        throw error;
      }
    }
    
    this.initialized = true;
  }

  async save() {
    await fs.writeFile(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
  }

  // Users
  async createUser(userData) {
    await this.initialize();
    const user = {
      id: this.generateId(),
      ...userData,
      createdAt: new Date().toISOString()
    };
    this.data.users.push(user);
    await this.save();
    return user;
  }

  async getUserById(id) {
    await this.initialize();
    return this.data.users.find(u => u.id === id) || null;
  }

  async getUserByEmail(email) {
    await this.initialize();
    return this.data.users.find(u => u.email === email) || null;
  }

  async getAllUsers() {
    await this.initialize();
    return this.data.users;
  }

  async updateUser(id, updates) {
    await this.initialize();
    const index = this.data.users.findIndex(u => u.id === id);
    if (index === -1) return null;
    
    this.data.users[index] = { ...this.data.users[index], ...updates };
    await this.save();
    return this.data.users[index];
  }

  async deleteUser(id) {
    await this.initialize();
    const index = this.data.users.findIndex(u => u.id === id);
    if (index === -1) return false;
    
    this.data.users.splice(index, 1);
    await this.save();
    return true;
  }

  // Exchanges
  async createExchange(exchangeData) {
    await this.initialize();
    const exchange = {
      id: this.generateId(),
      ...exchangeData,
      createdAt: new Date().toISOString()
    };
    this.data.exchanges.push(exchange);
    await this.save();
    return exchange;
  }

  async getExchangeById(id) {
    await this.initialize();
    return this.data.exchanges.find(e => e.id === id) || null;
  }

  async getAllExchanges() {
    await this.initialize();
    return this.data.exchanges;
  }

  async getExchangesByUserId(userId) {
    await this.initialize();
    const participantExchangeIds = this.data.participants
      .filter(p => p.userId === userId)
      .map(p => p.exchangeId);
    
    return this.data.exchanges.filter(e => 
      e.creatorId === userId || participantExchangeIds.includes(e.id)
    );
  }

  async updateExchange(id, updates) {
    await this.initialize();
    const index = this.data.exchanges.findIndex(e => e.id === id);
    if (index === -1) return null;
    
    this.data.exchanges[index] = { ...this.data.exchanges[index], ...updates };
    await this.save();
    return this.data.exchanges[index];
  }

  async deleteExchange(id) {
    await this.initialize();
    const index = this.data.exchanges.findIndex(e => e.id === id);
    if (index === -1) return false;
    
    // Delete related data
    this.data.participants = this.data.participants.filter(p => p.exchangeId !== id);
    this.data.pendingParticipants = this.data.pendingParticipants.filter(p => p.exchangeId !== id);
    this.data.assignments = this.data.assignments.filter(a => a.exchangeId !== id);
    this.data.exchanges.splice(index, 1);
    
    await this.save();
    return true;
  }

  // Participants
  async addParticipant(participantData) {
    await this.initialize();
    const participant = {
      id: this.generateId(),
      ...participantData,
      joinedAt: new Date().toISOString()
    };
    this.data.participants.push(participant);
    await this.save();
    return participant;
  }

  async getParticipantsByExchangeId(exchangeId) {
    await this.initialize();
    return this.data.participants.filter(p => p.exchangeId === exchangeId);
  }

  async getParticipant(exchangeId, userId) {
    await this.initialize();
    return this.data.participants.find(
      p => p.exchangeId === exchangeId && p.userId === userId
    ) || null;
  }

  async removeParticipant(exchangeId, userId) {
    await this.initialize();
    const index = this.data.participants.findIndex(
      p => p.exchangeId === exchangeId && p.userId === userId
    );
    if (index === -1) return false;
    
    this.data.participants.splice(index, 1);
    await this.save();
    return true;
  }

  // Pending Participants
  async addPendingParticipant(pendingData) {
    await this.initialize();
    const pending = {
      id: this.generateId(),
      ...pendingData,
      requestedAt: new Date().toISOString()
    };
    this.data.pendingParticipants.push(pending);
    await this.save();
    return pending;
  }

  async getPendingParticipantsByExchangeId(exchangeId) {
    await this.initialize();
    return this.data.pendingParticipants.filter(p => p.exchangeId === exchangeId);
  }

  async getPendingParticipant(exchangeId, userId) {
    await this.initialize();
    return this.data.pendingParticipants.find(
      p => p.exchangeId === exchangeId && p.userId === userId
    ) || null;
  }

  async removePendingParticipant(exchangeId, userId) {
    await this.initialize();
    const index = this.data.pendingParticipants.findIndex(
      p => p.exchangeId === exchangeId && p.userId === userId
    );
    if (index === -1) return false;
    
    this.data.pendingParticipants.splice(index, 1);
    await this.save();
    return true;
  }

  // Assignments
  async createAssignment(assignmentData) {
    await this.initialize();
    const assignment = {
      id: this.generateId(),
      ...assignmentData,
      createdAt: new Date().toISOString()
    };
    this.data.assignments.push(assignment);
    await this.save();
    return assignment;
  }

  async getAssignmentsByExchangeId(exchangeId) {
    await this.initialize();
    return this.data.assignments.filter(a => a.exchangeId === exchangeId);
  }

  async getAssignmentForGiver(exchangeId, giverId) {
    await this.initialize();
    return this.data.assignments.find(
      a => a.exchangeId === exchangeId && a.giverId === giverId
    ) || null;
  }

  async getAssignmentsForRecipient(exchangeId, recipientId) {
    await this.initialize();
    return this.data.assignments.filter(
      a => a.exchangeId === exchangeId && a.recipientId === recipientId
    );
  }

  async deleteAssignment(id) {
    await this.initialize();
    const index = this.data.assignments.findIndex(a => a.id === id);
    if (index === -1) return false;
    
    this.data.assignments.splice(index, 1);
    await this.save();
    return true;
  }

  // Utility
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

export default Database;
