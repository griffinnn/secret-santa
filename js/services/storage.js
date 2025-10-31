/**
 * API Storage Service
 * Replaces localStorage with API calls to backend
 */

class StorageService {
    constructor() {
        this.API_BASE = window.ENV?.API_URL || 'http://localhost:3001/api';
        
        // Keep current user in localStorage for session persistence
        this.STORAGE_KEYS = {
            CURRENT_USER: 'secretsanta_currentUser',
            APP_SETTINGS: 'secretsanta_settings'
        };
        
        this.initializeStorage();
    }

    /**
     * Initialize localStorage for session data only
     */
    initializeStorage() {
        try {
            if (!this.getLocalItem(this.STORAGE_KEYS.APP_SETTINGS)) {
                this.setLocalItem(this.STORAGE_KEYS.APP_SETTINGS, {
                    snowEnabled: true,
                    christmasTheme: true,
                    initialized: new Date().toISOString()
                });
            }
        } catch (error) {
            console.error('❌ Storage initialization failed:', error);
        }
    }

    /**
     * Local storage helpers (for session data only)
     */
    setLocalItem(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`❌ Failed to save ${key}:`, error);
            return false;
        }
    }

    getLocalItem(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error(`❌ Failed to load ${key}:`, error);
            return null;
        }
    }

    removeLocalItem(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`❌ Failed to remove ${key}:`, error);
            return false;
        }
    }

    /**
     * API request helper
     */
    async apiRequest(endpoint, options = {}) {
        try {
            const url = `${this.API_BASE}${endpoint}`;
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || `HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`❌ API request failed: ${endpoint}`, error);
            throw error;
        }
    }

    /**
     * User operations
     */
    
    async createUser(userData) {
        try {
            const user = await this.apiRequest('/users', {
                method: 'POST',
                body: JSON.stringify(userData)
            });
            
            console.log('✅ User created:', user.name);
            return user;
        } catch (error) {
            console.error('❌ Create user failed:', error);
            throw error;
        }
    }

    async getUserById(userId) {
        try {
            return await this.apiRequest(`/users/${userId}`);
        } catch (error) {
            if (error.message.includes('404')) {
                return null;
            }
            throw error;
        }
    }

    async getUserByEmail(email) {
        try {
            return await this.apiRequest(`/users/email/${encodeURIComponent(email)}`);
        } catch (error) {
            if (error.message.includes('404')) {
                return null;
            }
            throw error;
        }
    }

    async getAllUsers() {
        try {
            return await this.apiRequest('/users');
        } catch (error) {
            console.error('❌ Get all users failed:', error);
            return [];
        }
    }

    async updateUser(userId, updates) {
        try {
            const user = await this.apiRequest(`/users/${userId}`, {
                method: 'PATCH',
                body: JSON.stringify(updates)
            });
            
            console.log('✅ User updated:', user.name);
            return user;
        } catch (error) {
            console.error('❌ Update user failed:', error);
            throw error;
        }
    }

    async deleteUser(userId) {
        try {
            await this.apiRequest(`/users/${userId}`, {
                method: 'DELETE'
            });
            return true;
        } catch (error) {
            console.error('❌ Delete user failed:', error);
            throw error;
        }
    }

    /**
     * Exchange operations
     */
    
    async createExchange(exchangeData) {
        try {
            const exchange = await this.apiRequest('/exchanges', {
                method: 'POST',
                body: JSON.stringify(exchangeData)
            });
            
            console.log('✅ Exchange created:', exchange.name);
            return exchange;
        } catch (error) {
            console.error('❌ Create exchange failed:', error);
            throw error;
        }
    }

    async getExchangeById(exchangeId) {
        try {
            return await this.apiRequest(`/exchanges/${exchangeId}`);
        } catch (error) {
            if (error.message.includes('404')) {
                return null;
            }
            throw error;
        }
    }

    async getAllExchanges() {
        try {
            return await this.apiRequest('/exchanges');
        } catch (error) {
            console.error('❌ Get all exchanges failed:', error);
            return [];
        }
    }

    async getExchangesByUser(userId) {
        try {
            return await this.apiRequest(`/exchanges/user/${userId}`);
        } catch (error) {
            console.error('❌ Get exchanges by user failed:', error);
            return [];
        }
    }

    async updateExchange(exchangeId, updates) {
        try {
            const exchange = await this.apiRequest(`/exchanges/${exchangeId}`, {
                method: 'PATCH',
                body: JSON.stringify(updates)
            });
            
            console.log('✅ Exchange updated:', exchange.name);
            return exchange;
        } catch (error) {
            console.error('❌ Update exchange failed:', error);
            throw error;
        }
    }

    async requestToJoinExchange(exchangeId, userId) {
        try {
            const exchange = await this.apiRequest(`/exchanges/${exchangeId}/request-join`, {
                method: 'POST',
                body: JSON.stringify({ userId })
            });
            
            console.log('✅ Join request sent');
            return exchange;
        } catch (error) {
            console.error('❌ Request to join failed:', error);
            throw error;
        }
    }

    async approveParticipant(exchangeId, userId) {
        try {
            const exchange = await this.apiRequest(`/exchanges/${exchangeId}/approve-participant`, {
                method: 'POST',
                body: JSON.stringify({ userId })
            });
            
            console.log('✅ Participant approved');
            return exchange;
        } catch (error) {
            console.error('❌ Approve participant failed:', error);
            throw error;
        }
    }

    async declineParticipant(exchangeId, userId) {
        try {
            const exchange = await this.apiRequest(`/exchanges/${exchangeId}/decline-participant`, {
                method: 'POST',
                body: JSON.stringify({ userId })
            });
            
            console.log('✅ Participant declined');
            return exchange;
        } catch (error) {
            console.error('❌ Decline participant failed:', error);
            throw error;
        }
    }

    async deleteExchange(exchangeId) {
        try {
            await this.apiRequest(`/exchanges/${exchangeId}`, {
                method: 'DELETE'
            });
            return true;
        } catch (error) {
            console.error('❌ Delete exchange failed:', error);
            throw error;
        }
    }

    /**
     * Assignment operations
     */
    
    async createAssignment(assignmentData) {
        try {
            return await this.apiRequest('/assignments', {
                method: 'POST',
                body: JSON.stringify(assignmentData)
            });
        } catch (error) {
            console.error('❌ Create assignment failed:', error);
            throw error;
        }
    }

    async getAssignmentsByExchange(exchangeId) {
        try {
            return await this.apiRequest(`/assignments/exchange/${exchangeId}`);
        } catch (error) {
            console.error('❌ Get assignments by exchange failed:', error);
            return [];
        }
    }

    async getAssignmentByGiver(giverId, exchangeId) {
        try {
            return await this.apiRequest(`/assignments/giver/${giverId}/exchange/${exchangeId}`);
        } catch (error) {
            if (error.message.includes('404')) {
                return null;
            }
            throw error;
        }
    }

    async getAssignmentByRecipient(recipientId, exchangeId) {
        try {
            return await this.apiRequest(`/assignments/recipient/${recipientId}/exchange/${exchangeId}`);
        } catch (error) {
            console.error('❌ Get assignment by recipient failed:', error);
            return [];
        }
    }

    /**
     * Session operations (still use localStorage)
     */
    
    async login(email) {
        try {
            const user = await this.apiRequest('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email })
            });
            
            this.setLocalItem(this.STORAGE_KEYS.CURRENT_USER, {
                currentUserId: user.id,
                loginAt: new Date().toISOString()
            });
            
            console.log('✅ User logged in:', user.name);
            return user;
        } catch (error) {
            console.error('❌ Login failed:', error);
            throw error;
        }
    }

    async logout() {
        try {
            await this.apiRequest('/auth/logout', {
                method: 'POST'
            });
            
            this.removeLocalItem(this.STORAGE_KEYS.CURRENT_USER);
            console.log('✅ User logged out');
        } catch (error) {
            console.error('❌ Logout failed:', error);
            throw error;
        }
    }

    async getCurrentUser() {
        try {
            const session = this.getLocalItem(this.STORAGE_KEYS.CURRENT_USER);
            if (!session) return null;
            
            return await this.getUserById(session.currentUserId);
        } catch (error) {
            console.error('❌ Get current user failed:', error);
            return null;
        }
    }

    async isAuthenticated() {
        try {
            const user = await this.getCurrentUser();
            return !!user;
        } catch (error) {
            console.error('❌ Auth check failed:', error);
            return false;
        }
    }

    /**
     * Utility functions
     */
    
    generateId() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    clear() {
        try {
            Object.values(this.STORAGE_KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
            this.initializeStorage();
            return true;
        } catch (error) {
            console.error('❌ Failed to clear storage:', error);
            return false;
        }
    }

    getStorageInfo() {
        try {
            const used = JSON.stringify(localStorage).length;
            const quota = 5 * 1024 * 1024;
            
            return {
                used: used,
                quota: quota,
                percentage: Math.round((used / quota) * 100),
                remaining: quota - used
            };
        } catch (error) {
            console.error('❌ Storage info failed:', error);
            return null;
        }
    }

    exportData() {
        // Not applicable for API-based storage
        console.warn('Export not available for API storage');
        return null;
    }

    async importData(jsonData) {
        // Not applicable for API-based storage
        console.warn('Import not available for API storage');
        return false;
    }
}

// Create and export singleton instance
const storageService = new StorageService();
export default storageService;

// Also make available globally for debugging
window.storageService = storageService;
