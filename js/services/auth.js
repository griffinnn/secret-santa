/**
 * Authentication Service
 * Handles user authentication, session management, and route protection
 */

import storageService from './storage.js';

class AuthService {
    constructor() {
        this.currentUser = null;
        this.authListeners = [];
        this.initializeAuth();
    }

    /**
     * Initialize authentication state on app startup
     */
    async initializeAuth() {
        try {
            this.currentUser = await storageService.getCurrentUser();
            if (this.currentUser) {
                console.log('✅ User session restored:', this.currentUser.name);
                this.notifyAuthListeners(true);
            }
        } catch (error) {
            console.error('❌ Auth initialization failed:', error);
            this.currentUser = null;
        }
    }

    /**
     * User Registration
     * Creates new user account with validation
     */
    async register(userData) {
        try {
            // Validate required fields
            if (!userData.name || !userData.email) {
                throw new Error('Name and email are required');
            }

            // Basic email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(userData.email)) {
                throw new Error('Please enter a valid email address');
            }

            // Check for existing user
            const existingUser = await storageService.getUserByEmail(userData.email);
            if (existingUser) {
                throw new Error('An account with this email already exists');
            }

            // Create user
            const newUser = await storageService.createUser({
                name: userData.name.trim(),
                email: userData.email.toLowerCase().trim(),
                wishList: userData.wishList ? userData.wishList.trim() : '',
                role: 'user'
            });

            console.log('✅ User registered successfully:', newUser.name);
            return newUser;

        } catch (error) {
            console.error('❌ Registration failed:', error);
            throw error;
        }
    }

    /**
     * User Login
     * Authenticates user and creates session
     */
    async login(email, autoRegister = false) {
        try {
            if (!email) {
                throw new Error('Email is required');
            }

            const cleanEmail = email.toLowerCase().trim();
            
            // Try to find existing user
            let user = await storageService.getUserByEmail(cleanEmail);
            
            // Auto-register if enabled and user doesn't exist
            if (!user && autoRegister) {
                // Extract name from email for auto-registration
                const nameFromEmail = cleanEmail.split('@')[0]
                    .replace(/[^a-zA-Z0-9]/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();
                
                user = await this.register({
                    name: nameFromEmail,
                    email: cleanEmail,
                    wishList: ''
                });
                
                console.log('✅ Auto-registered new user:', user.name);
            }
            
            if (!user) {
                throw new Error('No account found with this email address. Please check your email or register first.');
            }

            // Create session
            await storageService.login(cleanEmail);
            this.currentUser = user;
            
            console.log('✅ Login successful:', user.name);
            this.notifyAuthListeners(true);
            
            return user;

        } catch (error) {
            console.error('❌ Login failed:', error);
            throw error;
        }
    }

    /**
     * User Logout
     * Clears session and redirects
     */
    async logout() {
        try {
            const userName = this.currentUser?.name || 'User';
            
            await storageService.logout();
            this.currentUser = null;
            
            console.log('✅ Logout successful:', userName);
            this.notifyAuthListeners(false);
            
            // Redirect to home page
            if (window.location.hash !== '#home') {
                window.location.hash = '#home';
            }

        } catch (error) {
            console.error('❌ Logout failed:', error);
            // Force logout even on error
            this.currentUser = null;
            this.notifyAuthListeners(false);
        }
    }

    /**
     * Get Current User
     * Returns currently authenticated user or null
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Check Authentication State
     * Returns true if user is logged in
     */
    isAuthenticated() {
        return !!this.currentUser;
    }

    /**
     * Check Admin Access
     * Returns true if current user has admin privileges
     */
    isAdmin() {
        return this.currentUser?.role === 'admin';
    }

    /**
     * Check User Access to Exchange
     * Returns true if user can access the exchange
     */
    async canAccessExchange(exchangeId) {
        if (!this.isAuthenticated()) {
            return false;
        }

        try {
            const exchange = await storageService.getExchangeById(exchangeId);
            if (!exchange) {
                return false;
            }

            // Creator can always access
            if (exchange.createdBy === this.currentUser.id) {
                return true;
            }

            // Participants can access
            if (exchange.participants.includes(this.currentUser.id)) {
                return true;
            }

            // Admins can access all
            if (this.isAdmin()) {
                return true;
            }

            return false;

        } catch (error) {
            console.error('❌ Exchange access check failed:', error);
            return false;
        }
    }

    /**
     * Route Protection
     * Middleware for protecting routes that require authentication
     */
    requireAuth(callback) {
        if (!this.isAuthenticated()) {
            console.log('🔒 Authentication required, redirecting to login');
            window.location.hash = '#login';
            return false;
        }
        
        if (callback) {
            callback();
        }
        return true;
    }

    /**
     * Admin Route Protection
     * Middleware for protecting admin-only routes
     */
    requireAdmin(callback) {
        if (!this.requireAuth()) {
            return false;
        }
        
        if (!this.isAdmin()) {
            console.log('🔒 Admin access required');
            // Show error message
            if (window.app && window.app.showMessage) {
                window.app.showMessage('Admin access required', 'error');
            }
            window.location.hash = '#home';
            return false;
        }
        
        if (callback) {
            callback();
        }
        return true;
    }

    /**
     * Update User Profile
     * Updates current user's profile information
     */
    async updateProfile(updates) {
        try {
            if (!this.isAuthenticated()) {
                throw new Error('Must be logged in to update profile');
            }

            // Validate updates
            if (updates.email && updates.email !== this.currentUser.email) {
                const existingUser = await storageService.getUserByEmail(updates.email);
                if (existingUser && existingUser.id !== this.currentUser.id) {
                    throw new Error('Email address is already in use');
                }
            }

            // Update user
            const updatedUser = await storageService.updateUser(this.currentUser.id, updates);
            this.currentUser = updatedUser;
            
            console.log('✅ Profile updated:', updatedUser.name);
            this.notifyAuthListeners(true);
            
            return updatedUser;

        } catch (error) {
            console.error('❌ Profile update failed:', error);
            throw error;
        }
    }

    /**
     * Delete Account
     * Removes user account and all associated data
     */
    async deleteAccount() {
        try {
            if (!this.isAuthenticated()) {
                throw new Error('Must be logged in to delete account');
            }

            const userId = this.currentUser.id;
            const userName = this.currentUser.name;

            // Remove user from all exchanges they created or participated in
            const exchanges = await storageService.getExchangesByUser(userId);
            for (const exchange of exchanges) {
                if (exchange.createdBy === userId) {
                    // Delete entire exchange if they created it
                    await storageService.deleteExchange(exchange.id);
                } else {
                    // Remove from participants
                    const updatedParticipants = exchange.participants.filter(id => id !== userId);
                    await storageService.updateExchange(exchange.id, {
                        participants: updatedParticipants
                    });
                }
            }

            // Delete user account
            await storageService.deleteUser(userId);
            
            // Logout
            await this.logout();
            
            console.log('✅ Account deleted:', userName);
            
            return true;

        } catch (error) {
            console.error('❌ Account deletion failed:', error);
            throw error;
        }
    }

    /**
     * Authentication Event Listeners
     * For components that need to react to auth state changes
     */
    addAuthListener(callback) {
        if (typeof callback === 'function') {
            this.authListeners.push(callback);
        }
    }

    removeAuthListener(callback) {
        this.authListeners = this.authListeners.filter(listener => listener !== callback);
    }

    notifyAuthListeners(isAuthenticated) {
        this.authListeners.forEach(callback => {
            try {
                callback(isAuthenticated, this.currentUser);
            } catch (error) {
                console.error('❌ Auth listener error:', error);
            }
        });
    }

    /**
     * Session Management
     * Handle session timeout and refresh
     */
    async refreshSession() {
        try {
            if (!this.currentUser) {
                return false;
            }

            // Verify user still exists
            const user = await storageService.getUserById(this.currentUser.id);
            if (!user) {
                console.log('🔒 User no longer exists, logging out');
                await this.logout();
                return false;
            }

            // Update current user data
            this.currentUser = user;
            return true;

        } catch (error) {
            console.error('❌ Session refresh failed:', error);
            await this.logout();
            return false;
        }
    }

    /**
     * Password-less Authentication Helpers
     * For future email-based authentication
     */
    generateAuthToken() {
        return Math.random().toString(36).substr(2) + Date.now().toString(36);
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    sanitizeUserInput(input) {
        if (typeof input !== 'string') {
            return '';
        }
        
        return input
            .trim()
            .replace(/[<>]/g, '') // Remove potential HTML tags
            .substring(0, 255); // Limit length
    }

    /**
     * Debug and Admin Utilities
     */
    getAuthInfo() {
        return {
            isAuthenticated: this.isAuthenticated(),
            isAdmin: this.isAdmin(),
            currentUser: this.currentUser,
            listenerCount: this.authListeners.length
        };
    }

    async getAllUsers() {
        if (!this.isAdmin()) {
            throw new Error('Admin access required');
        }
        
        return await storageService.getAllUsers();
    }

    async promoteUserToAdmin(userId) {
        if (!this.isAdmin()) {
            throw new Error('Admin access required');
        }

        return await storageService.updateUser(userId, { role: 'admin' });
    }
}

// Create and export singleton instance
const authService = new AuthService();
export default authService;

// Make available globally for debugging
window.authService = authService;