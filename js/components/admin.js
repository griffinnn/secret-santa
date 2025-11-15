/**
 * Admin Dashboard Component
 * Handles admin operations: exchange creation, management, participant control, and assignment generation
 */

import Exchange from '../models/Exchange.js';
import User from '../models/User.js';
import Assignment from '../models/Assignment.js';
import validationService from '../services/validation.js';

export default class AdminComponent {
    constructor(app) {
        this.app = app;
        this.currentExchange = null;
        this.adminExchanges = [];
    }

    /**
     * Render admin dashboard
     */
    async render() {
        try {
            const content = document.getElementById('main-content');
            if (!content) return;

            // Verify admin access
            if (!this.app.currentUser || this.app.currentUser.role !== 'admin') {
                this.app.showMessage('Admin access required', 'error');
                window.location.hash = '#/';
                return;
            }

            this.app.showLoading('Loading admin dashboard...');

            // Load admin's exchanges
            this.adminExchanges = await Exchange.findByUser(this.app.currentUser.id);

            const greeting = this.app.christmasGreetings[Math.floor(Math.random() * this.app.christmasGreetings.length)];

            content.innerHTML = `
                <div class="admin-dashboard">
                    <div class="dashboard-greeting">
                        <h2>${greeting}</h2>
                        <p>Welcome back, ${this.app.currentUser.name}! 🎅</p>
                        <p class="subtitle">Manage your Secret Santa exchanges with festive flair</p>
                    </div>

                    <div class="admin-tabs">
                        <button class="tab-button active" onclick="adminComponent.showCreateTab()">
                            🎄 Create Exchange
                        </button>
                        <button class="tab-button" onclick="adminComponent.showManageTab()">
                            📋 My Exchanges (${this.adminExchanges.length})
                        </button>
                    </div>

                    <div id="admin-content" class="admin-content">
                        <!-- Tab content rendered here -->
                    </div>
                </div>
            `;

            // Set up admin component globally
            window.adminComponent = this;

            // Show create tab by default
            await this.showCreateTab();

            this.app.hideLoading();

        } catch (error) {
            console.error('❌ Admin dashboard render failed:', error);
            this.app.hideLoading();
            this.app.showMessage('Failed to load admin dashboard', 'error');
        }
    }

    /**
     * Show create exchange tab
     */
    async showCreateTab() {
        const contentArea = document.getElementById('admin-content');
        if (!contentArea) return;

        contentArea.innerHTML = `
            <div class="create-exchange-section">
                <h3>🎁 Create New Secret Santa Exchange</h3>
                <p class="section-description">Set up a festive gift exchange for your group</p>

                <form id="exchange-form" class="exchange-form">
                    <div class="form-group">
                        <label for="exchange-name">Exchange Name *</label>
                        <input 
                            type="text" 
                            id="exchange-name" 
                            name="exchangeName"
                            placeholder="e.g., Office Holiday Exchange 2024"
                            required
                        >
                        <small>Make it festive and memorable!</small>
                    </div>

                    <div class="form-group">
                        <label for="gift-budget">Gift Budget (USD) *</label>
                        <input 
                            type="number" 
                            id="gift-budget" 
                            name="giftBudget"
                            placeholder="25.00"
                            step="0.01"
                            min="1"
                            max="10000"
                            required
                        >
                        <small>Budget per person (e.g., 25 for $25 gifts)</small>
                    </div>

                    <div class="form-group">
                        <label for="exchange-description">Description (Optional)</label>
                        <textarea 
                            id="exchange-description" 
                            name="description"
                            placeholder="Add details about your exchange, theme, dates, etc."
                            rows="4"
                        ></textarea>
                    </div>

                    <div class="form-actions">
                        <button type="submit" class="btn-primary">
                            🎄 Create Exchange
                        </button>
                        <button type="reset" class="btn-secondary">
                            Clear Form
                        </button>
                    </div>
                </form>

                <div class="exchange-tips">
                    <h4>💡 Tips for a Successful Exchange:</h4>
                    <ul>
                        <li>Choose a realistic budget that works for your group</li>
                        <li>Give participants 1-2 weeks to complete their wishes</li>
                        <li>Aim for at least 3-4 participants for better variety</li>
                        <li>Consider themes to make it more fun (e.g., "Under $25", "Handmade Only")</li>
                    </ul>
                </div>
            </div>
        `;

        // Attach form handler
        const form = document.getElementById('exchange-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleCreateExchange(e));
        }
    }

    /**
     * Handle exchange creation
     */
    async handleCreateExchange(e) {
        e.preventDefault();

        try {
            this.app.showLoading('Creating your festive exchange...');

            // Get form data
            const formData = {
                name: document.getElementById('exchange-name').value.trim(),
                giftBudget: parseFloat(document.getElementById('gift-budget').value),
                description: document.getElementById('exchange-description').value.trim()
            };

            // Validate
            const validation = validationService.validateExchangeCreation(formData);
            if (!validation.isValid) {
                throw new Error(Object.values(validation.errors).flat().join(', '));
            }

            // Create exchange
            const exchange = await Exchange.create(formData, this.app.currentUser.id);

            this.app.hideLoading();
            this.app.showMessage(
                `✅ Exchange "${exchange.name}" created successfully! Share the ID with participants.`,
                'success'
            );

            // Reset form
            document.getElementById('exchange-form').reset();

            // Reload exchanges
            this.adminExchanges = await Exchange.findByUser(this.app.currentUser.id);

            // Show manage tab with new exchange
            setTimeout(() => {
                this.showManageTab();
            }, 500);

        } catch (error) {
            console.error('❌ Exchange creation failed:', error);
            this.app.hideLoading();
            this.app.showMessage(error.message || 'Failed to create exchange', 'error');
        }
    }

    /**
     * Show manage exchanges tab
     */
    async showManageTab() {
        const contentArea = document.getElementById('admin-content');
        if (!contentArea) return;

        this.app.showLoading('Loading your exchanges...');

        try {
            // Reload exchanges to get latest data
            this.adminExchanges = await Exchange.findByUser(this.app.currentUser.id);

            if (this.adminExchanges.length === 0) {
                contentArea.innerHTML = `
                    <div class="empty-state">
                        <h3>🎄 No Exchanges Yet</h3>
                        <p>You haven't created any Secret Santa exchanges yet.</p>
                        <button onclick="adminComponent.showCreateTab()" class="btn-primary">
                            Create Your First Exchange
                        </button>
                    </div>
                `;
                this.app.hideLoading();
                return;
            }

            // Build exchanges list
            let html = `
                <div class="manage-exchanges-section">
                    <h3>📋 Your Secret Santa Exchanges</h3>
                    <div class="exchanges-grid">
            `;

            for (const exchange of this.adminExchanges) {
                const stats = await exchange.getStats();
                const statusDisplay = exchange.getStatusDisplay();

                html += `
                    <div class="exchange-card">
                        <div class="exchange-header">
                            <h4>${exchange.name}</h4>
                            <span class="status ${statusDisplay.class}">${statusDisplay.icon} ${statusDisplay.text}</span>
                        </div>

                        <div class="exchange-details">
                            <p><strong>Budget:</strong> ${stats.budget}</p>
                            <p><strong>Participants:</strong> ${stats.participantCount}</p>
                            <p><strong>Status:</strong> ${stats.assignmentsGenerated ? '✅ Assignments Generated' : '⏳ Waiting for Assignments'}</p>
                        </div>

                        <div class="exchange-actions">
                            <button onclick="adminComponent.showExchangeDetail('${exchange.id}')" class="btn-small">
                                View Details
                            </button>
                            ${exchange.canAddParticipants() ? `
                                <button onclick="adminComponent.showAddParticipant('${exchange.id}')" class="btn-small secondary">
                                    Add Participant
                                </button>
                            ` : ''}
                            ${exchange.canGenerateAssignments() ? `
                                <button onclick="adminComponent.confirmGenerateAssignments('${exchange.id}')" class="btn-small success">
                                    Generate Assignments
                                </button>
                            ` : ''}
                            <button onclick="adminComponent.deleteExchange('${exchange.id}')" class="btn-small danger">
                                Delete
                            </button>
                        </div>
                    </div>
                `;
            }

            html += `
                    </div>
                </div>
            `;

            contentArea.innerHTML = html;
            this.app.hideLoading();

        } catch (error) {
            console.error('❌ Manage tab render failed:', error);
            this.app.hideLoading();
            this.app.showMessage('Failed to load exchanges', 'error');
        }
    }

    /**
     * Show exchange detail view
     */
    async showExchangeDetail(exchangeId) {
        try {
            this.app.showLoading('Loading exchange details...');

            const exchange = await Exchange.findById(exchangeId);
            if (!exchange) throw new Error('Exchange not found');

            const participants = await exchange.getParticipants();
            const requesterId = this.app.currentUser?.id;
            const assignments = requesterId ? await exchange.getAssignments(requesterId) : [];
            const stats = await exchange.getStats();

            const contentArea = document.getElementById('admin-content');
            contentArea.innerHTML = `
                <div class="exchange-detail">
                    <div class="detail-header">
                        <button onclick="adminComponent.showManageTab()" class="btn-back">← Back to Exchanges</button>
                        <h3>${exchange.name}</h3>
                    </div>

                    <div class="detail-grid">
                        <div class="detail-section">
                            <h4>📊 Exchange Info</h4>
                            <ul>
                                <li><strong>Budget:</strong> ${stats.budget}</li>
                                <li><strong>Status:</strong> ${exchange.getStatusDisplay().text}</li>
                                <li><strong>Created:</strong> ${stats.createdDate}</li>
                                <li><strong>Participants:</strong> ${stats.participantCount}</li>
                                <li><strong>Assignments:</strong> ${assignments.length}</li>
                            </ul>
                        </div>

                        <div class="detail-section">
                            <h4>👥 Participants (${participants.length})</h4>
                            <ul class="participants-list">
                                ${participants.length === 0 ? '<li><em>No participants yet</em></li>' : ''}
                                ${participants.map(p => `
                                    <li>
                                        <span>${p.name}</span>
                                        <small>${p.email}</small>
                                        ${exchange.canAddParticipants() ? `
                                            <button onclick="adminComponent.removeParticipant('${exchangeId}', '${p.id}')" class="btn-mini">Remove</button>
                                        ` : ''}
                                    </li>
                                `).join('')}
                            </ul>
                        </div>

                        ${assignments.length > 0 ? `
                            <div class="detail-section">
                                <h4>🎁 Assignments (${assignments.length})</h4>
                                <ul class="assignments-list">
                                    ${assignments.map(a => `
                                        <li>
                                            <span>${a.giverId ? '✅' : '❓'}</span>
                                            Assignment created
                                        </li>
                                    `).join('')}
                                </ul>
                            </div>
                        ` : ''}
                    </div>

                    <div class="detail-actions">
                        ${exchange.canAddParticipants() ? `
                            <button onclick="adminComponent.showAddParticipant('${exchangeId}')" class="btn-primary">
                                ➕ Add Participant
                            </button>
                        ` : ''}
                        ${exchange.canGenerateAssignments() ? `
                            <button onclick="adminComponent.confirmGenerateAssignments('${exchangeId}')" class="btn-success">
                                🎯 Generate Assignments
                            </button>
                        ` : ''}
                        <button onclick="adminComponent.deleteExchange('${exchangeId}')" class="btn-danger">
                            🗑️ Delete Exchange
                        </button>
                    </div>
                </div>
            `;

            this.app.hideLoading();

        } catch (error) {
            console.error('❌ Detail view failed:', error);
            this.app.hideLoading();
            this.app.showMessage('Failed to load exchange details', 'error');
        }
    }

    /**
     * Show add participant dialog
     */
    async showAddParticipant(exchangeId) {
        try {
            const exchange = await Exchange.findById(exchangeId);
            if (!exchange) throw new Error('Exchange not found');

            // Get all users not already in exchange
            const allUsers = await User.findAll();
            const availableUsers = allUsers.filter(user =>
                user.role !== 'admin' &&
                !exchange.participants.includes(user.id) &&
                user.id !== exchange.createdBy
            );

            if (availableUsers.length === 0) {
                this.app.showMessage('No available users to add', 'info');
                return;
            }

            const contentArea = document.getElementById('admin-content');
            contentArea.innerHTML = `
                <div class="add-participant-section">
                    <div class="section-header">
                        <button onclick="adminComponent.showExchangeDetail('${exchangeId}')" class="btn-back">← Back</button>
                        <h3>Add Participant to ${exchange.name}</h3>
                    </div>

                    <form id="add-participant-form" class="add-participant-form">
                        <div class="form-group">
                            <label for="user-select">Select User *</label>
                            <select id="user-select" name="userId" required>
                                <option value="">-- Choose a user --</option>
                                ${availableUsers.map(user => `
                                    <option value="${user.id}">
                                        ${user.name} (${user.email})
                                    </option>
                                `).join('')}
                            </select>
                        </div>

                        <div class="form-actions">
                            <button type="submit" class="btn-primary">Add Participant</button>
                            <button type="button" onclick="adminComponent.showExchangeDetail('${exchangeId}')" class="btn-secondary">Cancel</button>
                        </div>
                    </form>
                </div>
            `;

            document.getElementById('add-participant-form').addEventListener('submit', (e) => {
                this.handleAddParticipant(e, exchangeId);
            });

        } catch (error) {
            console.error('❌ Add participant dialog failed:', error);
            this.app.showMessage('Failed to show add participant dialog', 'error');
        }
    }

    /**
     * Handle adding participant
     */
    async handleAddParticipant(e, exchangeId) {
        e.preventDefault();

        try {
            this.app.showLoading('Adding participant...');

            const userId = document.getElementById('user-select').value;
            const exchange = await Exchange.findById(exchangeId);
            const user = await User.findById(userId);

            if (!exchange || !user) throw new Error('Exchange or user not found');

            await exchange.addParticipant(userId);

            this.app.hideLoading();
            this.app.showMessage(`✅ ${user.name} added to the exchange!`, 'success');

            // Refresh detail view
            setTimeout(() => {
                this.showExchangeDetail(exchangeId);
            }, 500);

        } catch (error) {
            console.error('❌ Add participant failed:', error);
            this.app.hideLoading();
            this.app.showMessage(error.message || 'Failed to add participant', 'error');
        }
    }

    /**
     * Remove participant from exchange
     */
    async removeParticipant(exchangeId, userId) {
        try {
            const confirmed = await this.app.showConfirmation(
                'Remove this participant from the exchange?',
                'Confirm Removal'
            );

            if (!confirmed) return;

            this.app.showLoading('Removing participant...');

            const exchange = await Exchange.findById(exchangeId);
            const user = await User.findById(userId);

            if (!exchange || !user) throw new Error('Exchange or user not found');

            await exchange.removeParticipant(userId);

            this.app.hideLoading();
            this.app.showMessage(`✅ ${user.name} removed from the exchange`, 'success');

            // Refresh detail view
            setTimeout(() => {
                this.showExchangeDetail(exchangeId);
            }, 500);

        } catch (error) {
            console.error('❌ Remove participant failed:', error);
            this.app.hideLoading();
            this.app.showMessage(error.message || 'Failed to remove participant', 'error');
        }
    }

    /**
     * Confirm assignment generation
     */
    async confirmGenerateAssignments(exchangeId) {
        try {
            const exchange = await Exchange.findById(exchangeId);
            if (!exchange) throw new Error('Exchange not found');

            const message = `Generate assignments for "${exchange.name}" with ${exchange.participants.length} participants?\n\nThis cannot be undone!`;
            const confirmed = await this.app.showConfirmation(message, 'Generate Assignments');

            if (!confirmed) return;

            await this.generateAssignments(exchangeId);

        } catch (error) {
            console.error('❌ Assignment confirmation failed:', error);
            this.app.showMessage('Failed to confirm assignment', 'error');
        }
    }

    /**
     * Generate assignments
     */
    async generateAssignments(exchangeId) {
        try {
            this.app.showLoading('Generating festive assignments... 🎁');

            const exchange = await Exchange.findById(exchangeId);
            if (!exchange) throw new Error('Exchange not found');

            const assignments = await exchange.generateAssignments();

            this.app.hideLoading();
            this.app.showMessage(
                `✅ Success! Generated ${assignments.length} gift assignments. Participants are now ready! 🎄`,
                'success'
            );

            // Refresh view
            setTimeout(() => {
                this.showManageTab();
            }, 500);

        } catch (error) {
            console.error('❌ Assignment generation failed:', error);
            this.app.hideLoading();
            this.app.showMessage(error.message || 'Failed to generate assignments', 'error');
        }
    }

    /**
     * Delete exchange
     */
    async deleteExchange(exchangeId) {
        try {
            const exchange = await Exchange.findById(exchangeId);
            if (!exchange) throw new Error('Exchange not found');

            const message = `Delete "${exchange.name}"? This will remove all participants and assignments. This cannot be undone!`;
            const confirmed = await this.app.showConfirmation(message, 'Delete Exchange');

            if (!confirmed) return;

            this.app.showLoading('Deleting exchange...');

            await exchange.delete();

            this.app.hideLoading();
            this.app.showMessage(`✅ Exchange "${exchange.name}" has been deleted`, 'success');

            // Refresh list
            setTimeout(() => {
                this.showManageTab();
            }, 500);

        } catch (error) {
            console.error('❌ Exchange deletion failed:', error);
            this.app.hideLoading();
            this.app.showMessage(error.message || 'Failed to delete exchange', 'error');
        }
    }
}
