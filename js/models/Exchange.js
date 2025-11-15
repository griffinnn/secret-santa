/**
 * Exchange Model
 * Represents a Secret Santa exchange/group
 */

import storageService from '../services/storage.js';
import validationService from '../services/validation.js';

export default class Exchange {
    constructor(data = {}) {
        this.id = data.id || null;
        this.name = data.name || '';
        this.giftBudget = data.giftBudget || 0;
        this.createdBy = data.createdBy || null;
        this.createdAt = data.createdAt || new Date().toISOString();
        this.status = data.status || 'open'; // open, closed, completed
        this.participants = data.participants || [];
        this.pendingParticipants = data.pendingParticipants || []; // Array of { userId, requestedAt, requestedBy }
        this.assignmentsGenerated = data.assignmentsGenerated || false;
    }

    /**
     * Static factory methods
     */
    static async create(exchangeData, creatorId) {
        try {
            // Validate exchange data
            const validation = validationService.validateExchangeCreation(exchangeData);
            if (!validation.isValid) {
                throw new Error(`Validation failed: ${Object.values(validation.errors).flat().join(', ')}`);
            }

            if (!creatorId) {
                throw new Error('Creator ID is required');
            }

            // Create exchange in storage
            const exchange = await storageService.createExchange({
                name: validationService.sanitizeExchangeName(exchangeData.name),
                giftBudget: parseFloat(exchangeData.giftBudget),
                createdBy: creatorId
            });

            return new Exchange(exchange);

        } catch (error) {
            console.error('❌ Exchange creation failed:', error);
            throw error;
        }
    }

    static async findById(exchangeId) {
        try {
            const exchangeData = await storageService.getExchangeById(exchangeId);
            return exchangeData ? new Exchange(exchangeData) : null;
        } catch (error) {
            console.error('❌ Find exchange by ID failed:', error);
            return null;
        }
    }

    static async findAll() {
        try {
            const exchangesData = await storageService.getAllExchanges();
            return exchangesData.map(data => new Exchange(data));
        } catch (error) {
            console.error('❌ Find all exchanges failed:', error);
            return [];
        }
    }

    static async findByUser(userId) {
        try {
            const exchangesData = await storageService.getExchangesByUser(userId);
            return exchangesData.map(data => new Exchange(data));
        } catch (error) {
            console.error('❌ Find exchanges by user failed:', error);
            return [];
        }
    }

    /**
     * Instance methods
     */
    async save() {
        try {
            if (this.id) {
                // Update existing exchange
                const validation = validationService.validateExchangeCreation(this.toPlainObject());
                if (!validation.isValid) {
                    throw new Error(`Validation failed: ${Object.values(validation.errors).flat().join(', ')}`);
                }

                const updatedData = await storageService.updateExchange(this.id, {
                    name: validationService.sanitizeExchangeName(this.name),
                    giftBudget: parseFloat(this.giftBudget),
                    status: this.status,
                    participants: this.participants,
                    pendingParticipants: this.pendingParticipants,
                    assignmentsGenerated: this.assignmentsGenerated
                });

                Object.assign(this, updatedData);
                
            } else {
                throw new Error('Cannot save exchange without creating it first');
            }

            return this;

        } catch (error) {
            console.error('❌ Exchange save failed:', error);
            throw error;
        }
    }

    async delete() {
        try {
            if (!this.id) {
                throw new Error('Cannot delete exchange without ID');
            }

            await storageService.deleteExchange(this.id);
            this.id = null;
            
            return true;

        } catch (error) {
            console.error('❌ Exchange deletion failed:', error);
            throw error;
        }
    }

    /**
     * Participant management
     */
    async addParticipant(userId) {
        try {
            if (!userId) {
                throw new Error('User ID is required');
            }

            // Validate participation
            const validation = await validationService.validateExchangeParticipation(this.id, userId);
            if (!validation.isValid) {
                throw new Error(validation.error);
            }

            // Import User class dynamically
            const { default: User } = await import('./User.js');
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Add to participants
            this.participants.push(userId);
            await this.save();

            console.log(`✅ Added ${user.name} to ${this.name}`);
            return this;

        } catch (error) {
            console.error('❌ Add participant failed:', error);
            throw error;
        }
    }

    async removeParticipant(userId) {
        try {
            if (!this.participants.includes(userId)) {
                throw new Error('User is not a participant');
            }

            if (this.assignmentsGenerated) {
                throw new Error('Cannot remove participants after assignments are generated');
            }

            this.participants = this.participants.filter(id => id !== userId);
            await this.save();

            return this;

        } catch (error) {
            console.error('❌ Remove participant failed:', error);
            throw error;
        }
    }

    async requestToJoin(userId) {
        try {
            if (!userId) {
                throw new Error('User ID is required');
            }

            // Check if already participant or already pending
            if (this.participants.includes(userId)) {
                throw new Error('Already a participant');
            }

            const alreadyPending = this.pendingParticipants.some(p => p.userId === userId);
            if (alreadyPending) {
                throw new Error('Join request already pending');
            }

            // Call API to request join
            const updatedExchange = await storageService.requestToJoinExchange(this.id, userId);
            
            // Update this instance with new data
            this.pendingParticipants = updatedExchange.pendingParticipants || [];
            this.participants = updatedExchange.participants || [];
            
            return this;

        } catch (error) {
            console.error('❌ Request to join failed:', error);
            throw error;
        }
    }

    async approveParticipant(userId) {
        try {
            const pending = this.pendingParticipants.find(p => p.userId === userId);
            if (!pending) {
                throw new Error('No pending request from this user');
            }

            // Call API to approve participant
            const updatedExchange = await storageService.approveParticipant(this.id, userId);
            
            // Update this instance with new data
            this.pendingParticipants = updatedExchange.pendingParticipants || [];
            this.participants = updatedExchange.participants || [];

            return this;

        } catch (error) {
            console.error('❌ Approve participant failed:', error);
            throw error;
        }
    }

    async declineParticipant(userId) {
        try {
            const pending = this.pendingParticipants.find(p => p.userId === userId);
            if (!pending) {
                throw new Error('No pending request from this user');
            }

            // Call API to decline participant
            const updatedExchange = await storageService.declineParticipant(this.id, userId);
            
            // Update this instance with new data
            this.pendingParticipants = updatedExchange.pendingParticipants || [];
            this.participants = updatedExchange.participants || [];

            return this;

        } catch (error) {
            console.error('❌ Decline participant failed:', error);
            throw error;
        }
    }

    async getPendingParticipants() {
        try {
            if (this.pendingParticipants.length === 0) return [];

            const { default: User } = await import('./User.js');
            
            const pending = [];
            for (const pendingItem of this.pendingParticipants) {
                const user = await User.findById(pendingItem.userId);
                if (user) {
                    pending.push({
                        user,
                        requestedAt: pendingItem.requestedAt
                    });
                }
            }

            return pending;

        } catch (error) {
            console.error('❌ Get pending participants failed:', error);
            return [];
        }
    }

    async getParticipants() {
        try {
            if (this.participants.length === 0) return [];

            // Import User class dynamically
            const { default: User } = await import('./User.js');
            
            const participants = [];
            for (const userId of this.participants) {
                const user = await User.findById(userId);
                if (user) {
                    participants.push(user);
                }
            }

            return participants;

        } catch (error) {
            console.error('❌ Get participants failed:', error);
            return [];
        }
    }

    async getCreator() {
        try {
            if (!this.createdBy) return null;

            const { default: User } = await import('./User.js');
            return await User.findById(this.createdBy);

        } catch (error) {
            console.error('❌ Get creator failed:', error);
            return null;
        }
    }

    /**
     * Assignment management
     */
    async generateAssignments() {
        try {
            // Call backend generation endpoint for consistency across storage backends
            const result = await storageService.apiRequest(`/exchanges/${this.id}/generate-assignments`, {
                method: 'POST'
            });
            this.assignmentsGenerated = true;
            // Update participants/pending from returned exchange snapshot if present
            if (result.exchange) {
                this.participants = result.exchange.participants || this.participants;
                this.pendingParticipants = result.exchange.pendingParticipants || this.pendingParticipants;
            }
            await this.save();
            console.log(`✅ Generated ${result.assignments?.length || 0} assignments for ${this.name}`);
            return result.assignments || [];
        } catch (error) {
            console.error('❌ Assignment generation failed:', error);
            throw error;
        }
    }

    async getAssignments(requesterId) {
        try {
            if (!requesterId) {
                throw new Error('Requester ID is required to load assignments');
            }

            const assignmentsData = await storageService.getAssignmentsByExchange(this.id, requesterId);
            
            // Import Assignment class dynamically
            const { default: Assignment } = await import('./Assignment.js');
            
            return assignmentsData.map(data => new Assignment(data));

        } catch (error) {
            console.error('❌ Get assignments failed:', error);
            return [];
        }
    }

    async getAssignmentForUser(userId) {
        try {
            const assignmentData = await storageService.getAssignmentByGiver(userId, this.id);
            if (!assignmentData) return null;

            const { default: Assignment } = await import('./Assignment.js');
            return new Assignment(assignmentData);

        } catch (error) {
            console.error('❌ Get user assignment failed:', error);
            return null;
        }
    }

    /**
     * Status management
     */
    async close() {
        try {
            if (this.status === 'closed') return this;

            if (!this.assignmentsGenerated) {
                throw new Error('Cannot close exchange without generating assignments first');
            }

            this.status = 'closed';
            await this.save();

            return this;

        } catch (error) {
            console.error('❌ Close exchange failed:', error);
            throw error;
        }
    }

    async reopen() {
        try {
            if (this.assignmentsGenerated) {
                throw new Error('Cannot reopen exchange after assignments are generated');
            }

            this.status = 'open';
            await this.save();

            return this;

        } catch (error) {
            console.error('❌ Reopen exchange failed:', error);
            throw error;
        }
    }

    async complete() {
        try {
            this.status = 'completed';
            await this.save();

            return this;

        } catch (error) {
            console.error('❌ Complete exchange failed:', error);
            throw error;
        }
    }

    /**
     * Business logic helpers
     */
    canAddParticipants() {
        return this.status === 'open' && !this.assignmentsGenerated;
    }

    canGenerateAssignments() {
        return this.status === 'open' && 
               !this.assignmentsGenerated && 
               this.participants.length >= 3;
    }

    canModify() {
        return this.status === 'open' && !this.assignmentsGenerated;
    }

    isUserParticipant(userId) {
        return this.participants.includes(userId);
    }

    isUserCreator(userId) {
        return this.createdBy === userId;
    }

    /**
     * Data formatting
     */
    toPlainObject() {
        return {
            id: this.id,
            name: this.name,
            giftBudget: this.giftBudget,
            createdBy: this.createdBy,
            createdAt: this.createdAt,
            status: this.status,
            participants: this.participants,
            pendingParticipants: this.pendingParticipants,
            assignmentsGenerated: this.assignmentsGenerated
        };
    }

    toPublicObject() {
        return {
            id: this.id,
            name: this.name,
            giftBudget: this.giftBudget,
            createdAt: this.createdAt,
            status: this.status,
            participantCount: this.participants.length,
            assignmentsGenerated: this.assignmentsGenerated
        };
    }

    toJSON() {
        return this.toPlainObject();
    }

    /**
     * Display formatting
     */
    getDisplayName() {
        return this.name || 'Unnamed Exchange';
    }

    getFormattedBudget() {
        return validationService.formatCurrency(this.giftBudget);
    }

    getStatusDisplay() {
        const statusMap = {
            'open': { text: 'Open for Registration', class: 'status-open', icon: '🎄' },
            'closed': { text: 'Registration Closed', class: 'status-closed', icon: '🔒' },
            'completed': { text: 'Exchange Complete', class: 'status-completed', icon: '🎁' }
        };

        return statusMap[this.status] || statusMap['open'];
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

    getParticipantCountDisplay() {
        const count = this.participants.length;
        if (count === 0) return 'No participants yet';
        if (count === 1) return '1 participant';
        return `${count} participants`;
    }

    /**
     * Validation methods
     */
    validate() {
        return validationService.validateExchangeCreation(this.toPlainObject());
    }

    canUserJoin(userId) {
        return this.canAddParticipants() && 
               !this.isUserParticipant(userId) && 
               !this.isUserCreator(userId);
    }

    /**
     * Search and filtering
     */
    static async search(query) {
        try {
            const allExchanges = await Exchange.findAll();
            const lowerQuery = query.toLowerCase();
            
            return allExchanges.filter(exchange => 
                exchange.name.toLowerCase().includes(lowerQuery)
            );
            
        } catch (error) {
            console.error('❌ Exchange search failed:', error);
            return [];
        }
    }

    static async findByStatus(status) {
        try {
            const allExchanges = await Exchange.findAll();
            return allExchanges.filter(exchange => exchange.status === status);
        } catch (error) {
            console.error('❌ Find exchanges by status failed:', error);
            return [];
        }
    }

    static async findOpen() {
        return await Exchange.findByStatus('open');
    }

    static async findClosed() {
        return await Exchange.findByStatus('closed');
    }

    static async findCompleted() {
        return await Exchange.findByStatus('completed');
    }

    /**
     * Statistics and analytics
     */
    async getStats() {
        try {
            const participants = await this.getParticipants();
            const assignmentCount = this.assignmentsGenerated ? participants.length : 0;

            return {
                id: this.id,
                name: this.name,
                status: this.status,
                budget: this.getFormattedBudget(),
                participantCount: participants.length,
                assignmentCount,
                canAddParticipants: this.canAddParticipants(),
                canGenerateAssignments: this.canGenerateAssignments(),
                assignmentsGenerated: this.assignmentsGenerated,
                createdDate: this.getCreatedDate()
            };

        } catch (error) {
            console.error('❌ Get exchange stats failed:', error);
            return {
                id: this.id,
                name: this.name,
                status: this.status,
                budget: '$0.00',
                participantCount: 0,
                assignmentCount: 0,
                canAddParticipants: false,
                canGenerateAssignments: false,
                assignmentsGenerated: false,
                createdDate: 'Unknown'
            };
        }
    }

    static async getSystemStats() {
        try {
            const allExchanges = await Exchange.findAll();
            const openExchanges = allExchanges.filter(e => e.status === 'open');
            const closedExchanges = allExchanges.filter(e => e.status === 'closed');
            const completedExchanges = allExchanges.filter(e => e.status === 'completed');

            const totalParticipants = allExchanges.reduce((sum, exchange) => 
                sum + exchange.participants.length, 0
            );

            const averageBudget = allExchanges.length > 0 
                ? allExchanges.reduce((sum, exchange) => sum + exchange.giftBudget, 0) / allExchanges.length
                : 0;

            return {
                totalExchanges: allExchanges.length,
                openExchanges: openExchanges.length,
                closedExchanges: closedExchanges.length,
                completedExchanges: completedExchanges.length,
                totalParticipants: totalParticipants,
                averageBudget: validationService.formatCurrency(averageBudget),
                recentExchanges: allExchanges
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, 5)
            };

        } catch (error) {
            console.error('❌ Get system stats failed:', error);
            return {
                totalExchanges: 0,
                openExchanges: 0,
                closedExchanges: 0,
                completedExchanges: 0,
                totalParticipants: 0,
                averageBudget: '$0.00',
                recentExchanges: []
            };
        }
    }
}