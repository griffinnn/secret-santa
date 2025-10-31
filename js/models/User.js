/**
 * User Model
 * Represents a user in the Secret Santa application
 */

import storageService from '../services/storage.js';
import validationService from '../services/validation.js';

export default class User {
    constructor(data = {}) {
        this.id = data.id || null;
        this.name = data.name || '';
        this.email = data.email || '';
        this.role = data.role || 'user';
        this.wishList = data.wishList || '';
        this.giftHints = data.giftHints || '';
        this.createdAt = data.createdAt || new Date().toISOString();
    }

    /**
     * Static factory methods
     */
    static async create(userData) {
        try {
            // Validate user data
            const validation = validationService.validateUserRegistration(userData);
            if (!validation.isValid) {
                throw new Error(`Validation failed: ${Object.values(validation.errors).flat().join(', ')}`);
            }

            // Create user in storage
            const user = await storageService.createUser({
                name: validationService.sanitizeName(userData.name),
                email: validationService.sanitizeEmail(userData.email),
                wishList: validationService.sanitizeWishList(userData.wishList || ''),
                role: userData.role || 'user'
            });

            return new User(user);

        } catch (error) {
            console.error('❌ User creation failed:', error);
            throw error;
        }
    }

    static async findById(userId) {
        try {
            const userData = await storageService.getUserById(userId);
            return userData ? new User(userData) : null;
        } catch (error) {
            console.error('❌ Find user by ID failed:', error);
            return null;
        }
    }

    static async findByEmail(email) {
        try {
            const userData = await storageService.getUserByEmail(email);
            return userData ? new User(userData) : null;
        } catch (error) {
            console.error('❌ Find user by email failed:', error);
            return null;
        }
    }

    static async findAll() {
        try {
            const usersData = await storageService.getAllUsers();
            return usersData.map(userData => new User(userData));
        } catch (error) {
            console.error('❌ Find all users failed:', error);
            return [];
        }
    }

    /**
     * Instance methods
     */
    async save() {
        try {
            if (this.id) {
                // Update existing user
                const validation = validationService.validateProfileUpdate(this.toPlainObject());
                if (!validation.isValid) {
                    throw new Error(`Validation failed: ${Object.values(validation.errors).flat().join(', ')}`);
                }

                const updatedData = await storageService.updateUser(this.id, {
                    name: validationService.sanitizeName(this.name),
                    email: validationService.sanitizeEmail(this.email),
                    wishList: validationService.sanitizeWishList(this.wishList),
                    role: this.role
                });

                // Update instance with saved data
                Object.assign(this, updatedData);
                
            } else {
                // Create new user
                const newUser = await User.create(this.toPlainObject());
                Object.assign(this, newUser.toPlainObject());
            }

            return this;

        } catch (error) {
            console.error('❌ User save failed:', error);
            throw error;
        }
    }

    async delete() {
        try {
            if (!this.id) {
                throw new Error('Cannot delete user without ID');
            }

            // Remove user from all exchanges
            const exchanges = await this.getExchanges();
            for (const exchange of exchanges) {
                await exchange.removeParticipant(this.id);
            }

            // Delete user from storage
            await storageService.deleteUser(this.id);
            
            // Clear instance data
            this.id = null;
            
            return true;

        } catch (error) {
            console.error('❌ User deletion failed:', error);
            throw error;
        }
    }

    /**
     * Business logic methods
     */
    async getExchanges() {
        try {
            if (!this.id) return [];
            
            const exchangesData = await storageService.getExchangesByUser(this.id);
            
            // Import Exchange class dynamically to avoid circular dependency
            const { default: Exchange } = await import('./Exchange.js');
            
            return exchangesData.map(data => new Exchange(data));

        } catch (error) {
            console.error('❌ Get user exchanges failed:', error);
            return [];
        }
    }

    async getCreatedExchanges() {
        try {
            const exchanges = await this.getExchanges();
            return exchanges.filter(exchange => exchange.createdBy === this.id);
        } catch (error) {
            console.error('❌ Get created exchanges failed:', error);
            return [];
        }
    }

    async getParticipatingExchanges() {
        try {
            const exchanges = await this.getExchanges();
            return exchanges.filter(exchange => 
                exchange.participants.includes(this.id) && exchange.createdBy !== this.id
            );
        } catch (error) {
            console.error('❌ Get participating exchanges failed:', error);
            return [];
        }
    }

    async getAssignments() {
        try {
            if (!this.id) return [];
            
            const exchanges = await this.getExchanges();
            const assignments = [];
            
            // Import Assignment class dynamically
            const { default: Assignment } = await import('./Assignment.js');
            
            for (const exchange of exchanges) {
                const assignment = await storageService.getAssignmentByGiver(this.id, exchange.id);
                if (assignment) {
                    assignments.push(new Assignment(assignment));
                }
            }
            
            return assignments;

        } catch (error) {
            console.error('❌ Get user assignments failed:', error);
            return [];
        }
    }

    async canJoinExchange(exchangeId) {
        try {
            const validation = await validationService.validateExchangeParticipation(exchangeId, this.id);
            return validation.isValid;
        } catch (error) {
            console.error('❌ Exchange join validation failed:', error);
            return false;
        }
    }

    /**
     * Profile management
     */
    updateProfile(updates) {
        // Update properties (will be validated on save)
        if (updates.name !== undefined) this.name = updates.name;
        if (updates.email !== undefined) this.email = updates.email;
        if (updates.wishList !== undefined) this.wishList = updates.wishList;
        if (updates.role !== undefined) this.role = updates.role;
        
        return this;
    }

    updateWishList(wishList) {
        this.wishList = wishList;
        return this;
    }

    /**
     * Authorization helpers
     */
    isAdmin() {
        return this.role === 'admin';
    }

    canManageExchange(exchange) {
        return this.isAdmin() || exchange.createdBy === this.id;
    }

    canViewExchange(exchange) {
        return this.canManageExchange(exchange) || exchange.participants.includes(this.id);
    }

    /**
     * Data formatting
     */
    toPlainObject() {
        return {
            id: this.id,
            name: this.name,
            email: this.email,
            role: this.role,
            wishList: this.wishList,
            createdAt: this.createdAt
        };
    }

    toPublicObject() {
        return {
            id: this.id,
            name: this.name,
            wishList: this.wishList,
            createdAt: this.createdAt
        };
    }

    toJSON() {
        return this.toPlainObject();
    }

    /**
     * Display formatting
     */
    getDisplayName() {
        return this.name || 'Anonymous User';
    }

    getInitials() {
        return this.name
            .split(' ')
            .map(word => word.charAt(0).toUpperCase())
            .join('')
            .substring(0, 2) || 'AU';
    }

    getFormattedWishList() {
        if (!this.wishList) return 'No wishes yet! 🎁';
        
        // Split by lines and format as list
        const items = this.wishList.split('\n').filter(item => item.trim());
        if (items.length === 1) {
            return items[0];
        }
        
        return items.map(item => `• ${item.trim()}`).join('\n');
    }

    getJoinDate() {
        try {
            const date = new Date(this.createdAt);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return 'Unknown';
        }
    }

    /**
     * Validation methods
     */
    validate() {
        return validationService.validateUserRegistration(this.toPlainObject());
    }

    validateUpdate() {
        return validationService.validateProfileUpdate(this.toPlainObject(), this);
    }

    /**
     * Static utility methods
     */
    static validateEmail(email) {
        return validationService.isValidEmail(email);
    }

    static validateName(name) {
        return validationService.isValidName(name);
    }

    static sanitizeInput(input, type = 'general') {
        switch (type) {
            case 'name':
                return validationService.sanitizeName(input);
            case 'email':
                return validationService.sanitizeEmail(input);
            case 'wishList':
                return validationService.sanitizeWishList(input);
            default:
                return validationService.sanitizeInput(input);
        }
    }

    /**
     * Search and filtering
     */
    static async search(query) {
        try {
            const allUsers = await User.findAll();
            const lowerQuery = query.toLowerCase();
            
            return allUsers.filter(user => 
                user.name.toLowerCase().includes(lowerQuery) ||
                user.email.toLowerCase().includes(lowerQuery)
            );
            
        } catch (error) {
            console.error('❌ User search failed:', error);
            return [];
        }
    }

    static async findByRole(role) {
        try {
            const allUsers = await User.findAll();
            return allUsers.filter(user => user.role === role);
        } catch (error) {
            console.error('❌ Find users by role failed:', error);
            return [];
        }
    }

    /**
     * Statistics and analytics
     */
    async getStats() {
        try {
            const exchanges = await this.getExchanges();
            const createdExchanges = await this.getCreatedExchanges();
            const participatingExchanges = await this.getParticipatingExchanges();
            const assignments = await this.getAssignments();

            return {
                totalExchanges: exchanges.length,
                createdExchanges: createdExchanges.length,
                participatingExchanges: participatingExchanges.length,
                assignments: assignments.length,
                hasWishList: !!this.wishList,
                joinDate: this.getJoinDate(),
                isAdmin: this.isAdmin()
            };

        } catch (error) {
            console.error('❌ Get user stats failed:', error);
            return {
                totalExchanges: 0,
                createdExchanges: 0,
                participatingExchanges: 0,
                assignments: 0,
                hasWishList: false,
                joinDate: 'Unknown',
                isAdmin: false
            };
        }
    }

    static async getSystemStats() {
        try {
            const allUsers = await User.findAll();
            const admins = allUsers.filter(user => user.isAdmin());
            const usersWithWishLists = allUsers.filter(user => user.wishList);

            return {
                totalUsers: allUsers.length,
                admins: admins.length,
                regularUsers: allUsers.length - admins.length,
                usersWithWishLists: usersWithWishLists.length,
                recentUsers: allUsers
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, 5)
            };

        } catch (error) {
            console.error('❌ Get system stats failed:', error);
            return {
                totalUsers: 0,
                admins: 0,
                regularUsers: 0,
                usersWithWishLists: 0,
                recentUsers: []
            };
        }
    }
}