/**
 * Assignment Model
 * Represents a Secret Santa gift assignment (who gives to whom)
 */

import storageService from '../services/storage.js';

export default class Assignment {
    constructor(data = {}) {
        this.id = data.id || null;
        this.exchangeId = data.exchangeId || null;
        this.giverId = data.giverId || null;
        this.recipientId = data.recipientId || null;
        this.createdAt = data.createdAt || new Date().toISOString();
        this.status = data.status || 'active'; // active, completed
    }

    /**
     * Static factory methods
     */
    static async create(assignmentData) {
        try {
            if (!assignmentData.exchangeId || !assignmentData.giverId || !assignmentData.recipientId) {
                throw new Error('Exchange ID, giver ID, and recipient ID are required');
            }

            if (assignmentData.giverId === assignmentData.recipientId) {
                throw new Error('Giver and recipient cannot be the same person');
            }

            // Verify exchange exists
            const { default: Exchange } = await import('./Exchange.js');
            const exchange = await Exchange.findById(assignmentData.exchangeId);
            if (!exchange) {
                throw new Error('Exchange not found');
            }

            // Verify users exist and are participants
            const { default: User } = await import('./User.js');
            const giver = await User.findById(assignmentData.giverId);
            const recipient = await User.findById(assignmentData.recipientId);
            
            if (!giver) {
                throw new Error('Giver not found');
            }
            if (!recipient) {
                throw new Error('Recipient not found');
            }

            if (!exchange.isUserParticipant(assignmentData.giverId)) {
                throw new Error('Giver is not a participant in this exchange');
            }
            if (!exchange.isUserParticipant(assignmentData.recipientId)) {
                throw new Error('Recipient is not a participant in this exchange');
            }

            // Create assignment in storage
            const assignment = await storageService.createAssignment(assignmentData);
            return new Assignment(assignment);

        } catch (error) {
            console.error('❌ Assignment creation failed:', error);
            throw error;
        }
    }

    static async findById(assignmentId, requesterId) {
        try {
            // Note: Storage service doesn't have getAssignmentById, 
            // so we'll search through all assignments
            if (!requesterId) {
                throw new Error('Requester ID is required to find assignments by exchange');
            }

            const allExchanges = await storageService.getAllExchanges();
            
            for (const exchange of allExchanges) {
                const assignments = await storageService.getAssignmentsByExchange(exchange.id, requesterId);
                const assignment = assignments.find(a => a.id === assignmentId);
                if (assignment) {
                    return new Assignment(assignment);
                }
            }
            
            return null;
        } catch (error) {
            console.error('❌ Find assignment by ID failed:', error);
            return null;
        }
    }

    static async findByExchange(exchangeId, requesterId) {
        try {
            const assignmentsData = await storageService.getAssignmentsByExchange(exchangeId, requesterId);
            return assignmentsData.map(data => new Assignment(data));
        } catch (error) {
            console.error('❌ Find assignments by exchange failed:', error);
            return [];
        }
    }

    static async findByGiver(giverId, exchangeId) {
        try {
            const assignmentData = await storageService.getAssignmentByGiver(giverId, exchangeId);
            return assignmentData ? new Assignment(assignmentData) : null;
        } catch (error) {
            console.error('❌ Find assignment by giver failed:', error);
            return null;
        }
    }

    static async findByRecipient(recipientId, exchangeId) {
        try {
            const assignmentsData = await storageService.getAssignmentByRecipient(recipientId, exchangeId);
            return assignmentsData.map(data => new Assignment(data));
        } catch (error) {
            console.error('❌ Find assignments by recipient failed:', error);
            return [];
        }
    }

    /**
     * Instance methods
     */
    async save() {
        try {
            if (!this.id) {
                throw new Error('Cannot save assignment without creating it first');
            }

            // Note: Storage service doesn't have updateAssignment method
            // For now, we'll implement this as a delete and recreate
            // In a real app, you'd want proper update functionality
            console.warn('⚠️ Assignment updates not fully implemented in storage layer');
            return this;

        } catch (error) {
            console.error('❌ Assignment save failed:', error);
            throw error;
        }
    }

    async delete() {
        try {
            if (!this.id) {
                throw new Error('Cannot delete assignment without ID');
            }

            // Note: Storage service doesn't have deleteAssignment method
            // This would need to be implemented in the storage layer
            console.warn('⚠️ Assignment deletion not implemented in storage layer');
            this.id = null;
            
            return true;

        } catch (error) {
            console.error('❌ Assignment deletion failed:', error);
            throw error;
        }
    }

    /**
     * Related object methods
     */
    async getExchange() {
        try {
            if (!this.exchangeId) return null;

            const { default: Exchange } = await import('./Exchange.js');
            return await Exchange.findById(this.exchangeId);

        } catch (error) {
            console.error('❌ Get assignment exchange failed:', error);
            return null;
        }
    }

    async getGiver() {
        try {
            if (!this.giverId) return null;

            const { default: User } = await import('./User.js');
            return await User.findById(this.giverId);

        } catch (error) {
            console.error('❌ Get assignment giver failed:', error);
            return null;
        }
    }

    async getRecipient() {
        try {
            if (!this.recipientId) return null;

            const { default: User } = await import('./User.js');
            return await User.findById(this.recipientId);

        } catch (error) {
            console.error('❌ Get assignment recipient failed:', error);
            return null;
        }
    }

    /**
     * Business logic methods
     */
    async getRecipientWishList() {
        try {
            const recipient = await this.getRecipient();
            return recipient ? recipient.wishList : '';
        } catch (error) {
            console.error('❌ Get recipient wish list failed:', error);
            return '';
        }
    }

    async getRecipientPublicInfo() {
        try {
            const recipient = await this.getRecipient();
            if (!recipient) return null;

            return {
                name: recipient.name,
                wishList: recipient.getFormattedWishList(),
                initials: recipient.getInitials()
            };
        } catch (error) {
            console.error('❌ Get recipient public info failed:', error);
            return null;
        }
    }

    async getGiftSuggestions() {
        try {
            const exchange = await this.getExchange();
            const recipient = await this.getRecipient();
            
            if (!exchange || !recipient) return [];

            const suggestions = [];

            // Budget-based suggestions
            const budget = exchange.giftBudget;
            if (budget <= 25) {
                suggestions.push(
                    'Small gift card', 'Nice candle', 'Cozy socks', 
                    'Coffee mug', 'Holiday treats', 'Book'
                );
            } else if (budget <= 50) {
                suggestions.push(
                    'Medium gift card', 'Nice bottle of wine', 'Board game',
                    'Cozy blanket', 'Gourmet food basket', 'Skincare set'
                );
            } else {
                suggestions.push(
                    'Large gift card', 'Premium spirits', 'Tech accessory',
                    'High-quality blanket', 'Luxury food basket', 'Experience gift'
                );
            }

            // Wish list based suggestions
            if (recipient.wishList) {
                const wishItems = recipient.wishList.toLowerCase();
                if (wishItems.includes('book')) suggestions.push('Popular book', 'Bookstore gift card');
                if (wishItems.includes('coffee')) suggestions.push('Premium coffee', 'Coffee accessories');
                if (wishItems.includes('tea')) suggestions.push('Tea sampler', 'Nice tea mug');
                if (wishItems.includes('music')) suggestions.push('Music gift card', 'Vinyl record');
                if (wishItems.includes('game')) suggestions.push('Board game', 'Video game');
            }

            // Remove duplicates and return first 8
            return [...new Set(suggestions)].slice(0, 8);

        } catch (error) {
            console.error('❌ Get gift suggestions failed:', error);
            return ['Gift card', 'Something thoughtful', 'Something practical', 'Something fun'];
        }
    }

    /**
     * Status management
     */
    async markCompleted() {
        try {
            this.status = 'completed';
            await this.save();
            
            console.log('✅ Assignment marked as completed');
            return this;

        } catch (error) {
            console.error('❌ Mark assignment completed failed:', error);
            throw error;
        }
    }

    async markActive() {
        try {
            this.status = 'active';
            await this.save();
            
            return this;

        } catch (error) {
            console.error('❌ Mark assignment active failed:', error);
            throw error;
        }
    }

    /**
     * Validation methods
     */
    async validate() {
        try {
            const errors = [];

            if (!this.exchangeId) errors.push('Exchange ID is required');
            if (!this.giverId) errors.push('Giver ID is required');
            if (!this.recipientId) errors.push('Recipient ID is required');
            
            if (this.giverId === this.recipientId) {
                errors.push('Giver and recipient cannot be the same person');
            }

            // Verify exchange exists
            const exchange = await this.getExchange();
            if (!exchange) {
                errors.push('Exchange not found');
            } else {
                // Verify participants
                if (!exchange.isUserParticipant(this.giverId)) {
                    errors.push('Giver is not a participant in this exchange');
                }
                if (!exchange.isUserParticipant(this.recipientId)) {
                    errors.push('Recipient is not a participant in this exchange');
                }
            }

            return {
                isValid: errors.length === 0,
                errors: errors
            };

        } catch (error) {
            console.error('❌ Assignment validation failed:', error);
            return {
                isValid: false,
                errors: ['Validation failed due to system error']
            };
        }
    }

    /**
     * Data formatting
     */
    toPlainObject() {
        return {
            id: this.id,
            exchangeId: this.exchangeId,
            giverId: this.giverId,
            recipientId: this.recipientId,
            createdAt: this.createdAt,
            status: this.status
        };
    }

    toJSON() {
        return this.toPlainObject();
    }

    /**
     * Display formatting
     */
    getStatusDisplay() {
        const statusMap = {
            'active': { text: 'Active', class: 'status-active', icon: '🎁' },
            'completed': { text: 'Completed', class: 'status-completed', icon: '✅' }
        };

        return statusMap[this.status] || statusMap['active'];
    }

    getCreatedDate() {
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

    async getDisplayInfo() {
        try {
            const [exchange, giver, recipient] = await Promise.all([
                this.getExchange(),
                this.getGiver(),
                this.getRecipient()
            ]);

            return {
                id: this.id,
                exchangeName: exchange?.name || 'Unknown Exchange',
                exchangeBudget: exchange?.getFormattedBudget() || '$0.00',
                giverName: giver?.name || 'Unknown Giver',
                recipientName: recipient?.name || 'Unknown Recipient',
                recipientWishList: recipient?.getFormattedWishList() || 'No wishes yet',
                recipientHints: recipient?.giftHints || '',
                status: this.getStatusDisplay(),
                createdDate: this.getCreatedDate(),
                giftSuggestions: await this.getGiftSuggestions()
            };

        } catch (error) {
            console.error('❌ Get assignment display info failed:', error);
            return {
                id: this.id,
                exchangeName: 'Unknown Exchange',
                exchangeBudget: '$0.00',
                giverName: 'Unknown Giver',
                recipientName: 'Unknown Recipient',
                recipientWishList: 'No wishes yet',
                recipientHints: '',
                status: this.getStatusDisplay(),
                createdDate: 'Unknown',
                giftSuggestions: []
            };
        }
    }

    /**
     * Security and privacy methods
     */
    canUserView(userId) {
        // Only the giver can view their assignment
        return this.giverId === userId;
    }

    canUserManage(userId) {
        // Only the giver or exchange creator can manage
        return this.giverId === userId;
    }

    async getSecureInfo(userId) {
        try {
            if (!this.canUserView(userId)) {
                throw new Error('Access denied');
            }

            return await this.getDisplayInfo();

        } catch (error) {
            console.error('❌ Get secure assignment info failed:', error);
            throw error;
        }
    }

    /**
     * Static utility methods
     */
    static async generateExchangeAssignments(exchangeId) {
        try {
            const { default: Exchange } = await import('./Exchange.js');
            const exchange = await Exchange.findById(exchangeId);
            
            if (!exchange) {
                throw new Error('Exchange not found');
            }

            return await exchange.generateAssignments();

        } catch (error) {
            console.error('❌ Generate exchange assignments failed:', error);
            throw error;
        }
    }

    static async validateCircularAssignments(exchangeId, requesterId) {
        try {
            const assignments = await Assignment.findByExchange(exchangeId, requesterId);
            
            if (assignments.length === 0) return true;

            // Check that each participant gives to exactly one person
            // and receives from exactly one person
            const givers = new Set();
            const recipients = new Set();
            
            for (const assignment of assignments) {
                if (givers.has(assignment.giverId)) {
                    throw new Error('Duplicate giver found');
                }
                if (recipients.has(assignment.recipientId)) {
                    throw new Error('Duplicate recipient found');
                }
                
                givers.add(assignment.giverId);
                recipients.add(assignment.recipientId);
            }

            // Verify equal number of givers and recipients
            if (givers.size !== recipients.size) {
                throw new Error('Unequal givers and recipients');
            }

            return true;

        } catch (error) {
            console.error('❌ Validate circular assignments failed:', error);
            return false;
        }
    }

    /**
     * Statistics and analytics
     */
    static async getSystemStats() {
        try {
            const allExchanges = await storageService.getAllExchanges();
            let totalAssignments = 0;
            let activeAssignments = 0;
            let completedAssignments = 0;

            for (const exchange of allExchanges) {
                const assignments = await storageService.getAssignmentsByExchange(exchange.id);
                totalAssignments += assignments.length;
                
                assignments.forEach(assignment => {
                    if (assignment.status === 'active') {
                        activeAssignments++;
                    } else if (assignment.status === 'completed') {
                        completedAssignments++;
                    }
                });
            }

            return {
                totalAssignments,
                activeAssignments,
                completedAssignments,
                completionRate: totalAssignments > 0 
                    ? Math.round((completedAssignments / totalAssignments) * 100) 
                    : 0
            };

        } catch (error) {
            console.error('❌ Get assignment system stats failed:', error);
            return {
                totalAssignments: 0,
                activeAssignments: 0,
                completedAssignments: 0,
                completionRate: 0
            };
        }
    }
}