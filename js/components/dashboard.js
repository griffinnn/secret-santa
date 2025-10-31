/**
 * User Dashboard Component
 * Shows user's exchanges, assignments, and participation status
 */

import User from '../models/User.js';
import Exchange from '../models/Exchange.js';
import Assignment from '../models/Assignment.js';

export default class DashboardComponent {
    constructor(app) {
        this.app = app;
        this.userExchanges = [];
        this.userAssignments = [];
    }

    /**
     * Render user dashboard
     */
    async render() {
        try {
            const content = document.getElementById('main-content');
            if (!content) return;

            if (!this.app.currentUser) {
                this.app.showMessage('Please log in first', 'info');
                window.location.hash = '#/login';
                return;
            }

            this.app.showLoading('Loading your dashboard...');

            // Load user data
            const user = await User.findById(this.app.currentUser.id);
            if (!user) throw new Error('User not found');

            this.userExchanges = await user.getExchanges();
            
            // Also include exchanges where user has pending request
            const allExchanges = await Exchange.findAll();
            const pendingExchanges = allExchanges.filter(e => 
                e.pendingParticipants.some(p => p.userId === user.id) &&
                !this.userExchanges.some(ue => ue.id === e.id)
            );
            this.userExchanges = [...this.userExchanges, ...pendingExchanges];
            
            const createdExchanges = this.userExchanges.filter(e => e.createdBy === user.id);
            const participatingExchanges = this.userExchanges.filter(e => 
                e.participants.includes(user.id) && e.createdBy !== user.id
            );

            const greeting = this.app.christmasGreetings[Math.floor(Math.random() * this.app.christmasGreetings.length)];

            content.innerHTML = `
                <div class="user-dashboard">
                    <div class="dashboard-greeting">
                        <h2>${greeting}</h2>
                        <p>Welcome back, ${user.getDisplayName()}! 🎄</p>
                        <p class="subtitle">Your Secret Santa Experience</p>
                    </div>

                    <div class="dashboard-tabs">
                        <button class="tab-button active" onclick="window.dashboardComponent.showAssignmentsTab()">
                            🎁 My Assignments (${this.userAssignments.length})
                        </button>
                        <button class="tab-button" onclick="window.dashboardComponent.showExchangesTab()">
                            🎅 My Exchanges (${this.userExchanges.length})
                        </button>
                        <button class="tab-button" onclick="window.dashboardComponent.showBrowseTab()">
                            🔍 Browse Exchanges
                        </button>
                        <button class="tab-button" onclick="window.dashboardComponent.showCreateTab()">
                            ➕ Create Exchange
                        </button>
                        <button class="tab-button" onclick="window.dashboardComponent.showProfileTab()">
                            👤 My Profile
                        </button>
                    </div>

                    <div id="dashboard-content" class="dashboard-content">
                        <!-- Tab content rendered here -->
                    </div>
                </div>
            `;

            // Set up component globally
            window.dashboardComponent = this;

            // Load assignments
            for (const exchange of this.userExchanges) {
                const assignment = await Assignment.findByGiver(user.id, exchange.id);
                if (assignment) {
                    this.userAssignments.push(assignment);
                }
            }

            // Show assignments tab by default
            await this.showAssignmentsTab();

            this.app.hideLoading();

        } catch (error) {
            console.error('❌ Dashboard render failed:', error);
            this.app.hideLoading();
            this.app.showMessage('Failed to load dashboard', 'error');
        }
    }

    /**
     * Show assignments tab
     */
    async showAssignmentsTab() {
        const contentArea = document.getElementById('dashboard-content');
        if (!contentArea) return;

        this.app.showLoading('Loading your assignments...');

        try {
            if (this.userAssignments.length === 0) {
                contentArea.innerHTML = `
                    <div class="empty-state">
                        <h3>🎁 No Assignments Yet</h3>
                        <p>You haven't been assigned a Secret Santa recipient yet.</p>
                        <p>Join exchanges and wait for the admin to generate assignments!</p>
                        <button onclick="window.location.hash='#/register'" class="btn-primary">
                            Join an Exchange
                        </button>
                    </div>
                `;
                this.app.hideLoading();
                return;
            }

            let html = `
                <div class="assignments-section">
                    <h3>🎁 Your Secret Santa Assignments</h3>
                    <p class="section-description">Here's who you're giving a gift to!</p>
                    <div class="assignments-grid">
            `;

            for (const assignment of this.userAssignments) {
                const displayInfo = await assignment.getDisplayInfo();

                html += `
                    <div class="assignment-card">
                        <div class="assignment-header">
                            <h4>${displayInfo.exchangeName}</h4>
                            <span class="budget">${displayInfo.exchangeBudget}</span>
                        </div>

                        <div class="recipient-section">
                            <h5>🎅 Your Secret Santa Recipient:</h5>
                            <div class="recipient-card">
                                <p class="recipient-name">${displayInfo.recipientName}</p>
                                ${displayInfo.recipientWishList ? `
                                    <p class="wish-list-title">💭 Their Wish List:</p>
                                    <pre class="wish-list">${displayInfo.recipientWishList}</pre>
                                ` : ''}
                                ${displayInfo.recipientHints ? `
                                    <p class="wish-list-title">🎨 Gift Themes & Hints:</p>
                                    <pre class="wish-list">${displayInfo.recipientHints}</pre>
                                ` : ''}
                            </div>
                        </div>

                        ${displayInfo.giftSuggestions.length > 0 ? `
                            <div class="suggestions-section">
                                <p class="suggestions-title">💡 Gift Ideas:</p>
                                <ul class="suggestions-list">
                                    ${displayInfo.giftSuggestions.map(s => `<li>${s}</li>`).join('')}
                                </ul>
                            </div>
                        ` : ''}

                        <div class="assignment-footer">
                            <span class="status ${displayInfo.status.class}">
                                ${displayInfo.status.icon} ${displayInfo.status.text}
                            </span>
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
            console.error('❌ Assignments tab render failed:', error);
            this.app.hideLoading();
            this.app.showMessage('Failed to load assignments', 'error');
        }
    }

    /**
     * Show exchanges tab
     */
    async showExchangesTab() {
        const contentArea = document.getElementById('dashboard-content');
        if (!contentArea) return;

        this.app.showLoading('Loading your exchanges...');

        try {
            // Reload user exchanges to pick up any changes
            const user = await User.findById(this.app.currentUser.id);
            if (user) {
                this.userExchanges = await user.getExchanges();
                
                // Also include exchanges where user has pending request
                const allExchanges = await Exchange.findAll();
                const pendingExchanges = allExchanges.filter(e => 
                    e.pendingParticipants.some(p => p.userId === user.id) &&
                    !this.userExchanges.some(ue => ue.id === e.id)
                );
                this.userExchanges = [...this.userExchanges, ...pendingExchanges];
            }
            
            if (this.userExchanges.length === 0) {
                contentArea.innerHTML = `
                    <div class="empty-state">
                        <h3>🎄 No Exchanges Yet</h3>
                        <p>You haven't joined any exchanges yet.</p>
                        <button onclick="window.location.hash='#/register'" class="btn-primary">
                            Browse Exchanges
                        </button>
                    </div>
                `;
                this.app.hideLoading();
                return;
            }

            let html = `
                <div class="exchanges-section">
                    <h3>🎅 Your Secret Santa Exchanges</h3>
                    <p class="section-description">Your active and past exchanges</p>
                    <div class="exchanges-list">
            `;

            for (const exchange of this.userExchanges) {
                const participants = await exchange.getParticipants();
                const stats = await exchange.getStats();
                const statusDisplay = exchange.getStatusDisplay();
                const isCreator = exchange.createdBy === this.app.currentUser.id;
                const pendingParticipants = isCreator ? await exchange.getPendingParticipants() : [];

                html += `
                    <div class="exchange-list-item">
                        <div class="exchange-list-header">
                            <h4>${exchange.name}</h4>
                            <span class="status ${statusDisplay.class}">
                                ${statusDisplay.icon} ${statusDisplay.text}
                            </span>
                        </div>

                        <div class="exchange-list-details">
                            <div class="detail-col">
                                <p><strong>Budget:</strong> ${stats.budget}</p>
                                <p><strong>Participants:</strong> ${stats.participantCount}</p>
                            </div>
                            <div class="detail-col">
                                <p><strong>Status:</strong> ${exchange.assignmentsGenerated ? '✅ Assigned' : '⏳ Pending'}</p>
                                <p><strong>Created:</strong> ${stats.createdDate}</p>
                            </div>
                        </div>

                        <div class="exchange-list-participants">
                            <p class="participants-label">👥 Participants (${participants.length})</p>
                            <div class="participants-avatars">
                                ${participants.slice(0, 6).map(p => `
                                    <div class="avatar-small" title="${p.name}">
                                        ${p.getInitials()}
                                    </div>
                                `).join('')}
                                ${participants.length > 6 ? `
                                    <div class="avatar-small">+${participants.length - 6}</div>
                                ` : ''}
                            </div>
                        </div>

                        ${isCreator && pendingParticipants.length > 0 ? `
                            <div class="pending-approvals">
                                <p class="pending-label">⏳ Pending Approvals (${pendingParticipants.length})</p>
                                <div class="pending-list">
                                    ${pendingParticipants.map(p => `
                                        <div class="pending-item">
                                            <span>${p.user.name}</span>
                                            <div class="approval-buttons">
                                                <button onclick="dashboardComponent.approveParticipant('${exchange.id}', '${p.user.id}')" class="btn-small btn-approve">✅ Approve</button>
                                                <button onclick="dashboardComponent.declineParticipant('${exchange.id}', '${p.user.id}')" class="btn-small btn-decline">❌ Decline</button>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}

                        ${isCreator ? `
                            <div class="exchange-actions">
                                <button onclick="window.location.hash='#/exchange/${exchange.id}'" class="btn-primary">
                                    ⚙️ Manage Exchange
                                </button>
                            </div>
                        ` : ''}
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
            console.error('❌ Exchanges tab render failed:', error);
            this.app.hideLoading();
            this.app.showMessage('Failed to load exchanges', 'error');
        }
    }

    /**
     * Show browse available exchanges tab
     */
    async showBrowseTab() {
        const contentArea = document.getElementById('dashboard-content');
        if (!contentArea) return;

        this.app.showLoading('Loading available exchanges...');

        try {
            // Get all exchanges that user hasn't joined
            const allExchanges = await Exchange.findAll();
            const availableExchanges = allExchanges.filter(e => {
                return e.createdBy !== this.app.currentUser.id && 
                       !e.participants.includes(this.app.currentUser.id) &&
                       !e.pendingParticipants.some(p => p.userId === this.app.currentUser.id);
            });

            if (availableExchanges.length === 0) {
                contentArea.innerHTML = `
                    <div class="empty-state">
                        <h3>🔍 No Exchanges Available</h3>
                        <p>All available exchanges have been joined or there are none to browse.</p>
                        <button onclick="dashboardComponent.showCreateTab()" class="btn-primary">
                            Create Your Own Exchange
                        </button>
                    </div>
                `;
                this.app.hideLoading();
                return;
            }

            let html = `
                <div class="browse-exchanges-section">
                    <h3>🔍 Browse Available Exchanges</h3>
                    <p class="section-description">Join exchanges created by other users</p>
                    <div class="exchanges-browse-grid">
            `;

            for (const exchange of availableExchanges) {
                const creator = await exchange.getCreator();
                const participants = await exchange.getParticipants();
                const stats = await exchange.getStats();
                const statusDisplay = exchange.getStatusDisplay();

                html += `
                    <div class="exchange-browse-card">
                        <div class="exchange-browse-header">
                            <h4>${exchange.name}</h4>
                            <span class="status ${statusDisplay.class}">
                                ${statusDisplay.icon} ${statusDisplay.text}
                            </span>
                        </div>
                        
                        <div class="exchange-browse-details">
                            <p><strong>Creator:</strong> ${creator ? creator.name : 'Unknown'}</p>
                            <p><strong>Budget:</strong> ${stats.budget}</p>
                            <p><strong>Participants:</strong> ${participants.length}</p>
                            <p><strong>Created:</strong> ${stats.createdDate}</p>
                        </div>

                        <button onclick="dashboardComponent.requestToJoinExchange('${exchange.id}')" class="btn-primary btn-join">
                            Request to Join
                        </button>
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
            console.error('❌ Browse tab render failed:', error);
            this.app.hideLoading();
            this.app.showMessage('Failed to load exchanges', 'error');
        }
    }

    /**
     * Request to join an exchange
     */
    async requestToJoinExchange(exchangeId) {
        try {
            const exchange = await Exchange.findById(exchangeId);
            if (!exchange) {
                throw new Error('Exchange not found');
            }

            await exchange.requestToJoin(this.app.currentUser.id);
            this.app.showMessage(`✅ Requested to join "${exchange.name}"!`, 'success');
            
            setTimeout(() => {
                this.showBrowseTab();
            }, 1000);

        } catch (error) {
            console.error('❌ Join request failed:', error);
            this.app.showMessage(error.message || 'Failed to request join', 'error');
        }
    }

    /**
     * Approve a participant request
     */
    async approveParticipant(exchangeId, userId) {
        try {
            const exchange = await Exchange.findById(exchangeId);
            if (!exchange) {
                throw new Error('Exchange not found');
            }

            await exchange.approveParticipant(userId);
            
            const user = await User.findById(userId);
            this.app.showMessage(`✅ Approved ${user.name} to join!`, 'success');
            
            setTimeout(() => {
                this.showExchangesTab();
            }, 1000);

        } catch (error) {
            console.error('❌ Approval failed:', error);
            this.app.showMessage(error.message || 'Failed to approve participant', 'error');
        }
    }

    /**
     * Decline a participant request
     */
    async declineParticipant(exchangeId, userId) {
        try {
            const exchange = await Exchange.findById(exchangeId);
            if (!exchange) {
                throw new Error('Exchange not found');
            }

            await exchange.declineParticipant(userId);
            
            const user = await User.findById(userId);
            this.app.showMessage(`❌ Declined ${user.name}'s request`, 'success');
            
            setTimeout(() => {
                this.showExchangesTab();
            }, 1000);

        } catch (error) {
            console.error('❌ Decline failed:', error);
            this.app.showMessage(error.message || 'Failed to decline participant', 'error');
        }
    }

    /**
     * Show profile tab
     */
    /**
     * Show create exchange tab
     */
    async showCreateTab() {
        const contentArea = document.getElementById('dashboard-content');
        if (!contentArea) return;

        try {
            const user = await User.findById(this.app.currentUser.id);

            contentArea.innerHTML = `
                <div class="create-exchange-section">
                    <h3>➕ Create a New Secret Santa Exchange</h3>
                    <p class="section-description">Start your own exchange and invite friends to join!</p>

                    <form id="create-exchange-form" class="exchange-form">
                        <div class="form-group">
                            <label for="exchange-name">Exchange Name *</label>
                            <input 
                                type="text" 
                                id="exchange-name" 
                                name="name" 
                                placeholder="e.g., Office Secret Santa 2025"
                                required
                            >
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="exchange-budget">Budget (USD) *</label>
                                <input 
                                    type="number" 
                                    id="exchange-budget" 
                                    name="budget" 
                                    placeholder="e.g., 25"
                                    min="1"
                                    step="0.01"
                                    required
                                >
                            </div>

                            <div class="form-group">
                                <label for="exchange-start">Start Date *</label>
                                <input 
                                    type="date" 
                                    id="exchange-start" 
                                    name="startDate"
                                    required
                                >
                            </div>

                            <div class="form-group">
                                <label for="exchange-end">End Date *</label>
                                <input 
                                    type="date" 
                                    id="exchange-end" 
                                    name="endDate"
                                    required
                                >
                            </div>
                        </div>

                        <div class="form-actions">
                            <button type="submit" class="btn-primary">🎄 Create Exchange</button>
                        </div>
                    </form>
                </div>
            `;

            document.getElementById('create-exchange-form').addEventListener('submit', (e) => this.handleCreateExchange(e));

        } catch (error) {
            console.error('❌ Create exchange tab failed:', error);
            this.app.showMessage('Failed to load create exchange form', 'error');
        }
    }

    /**
     * Handle exchange creation
     */
    async handleCreateExchange(e) {
        e.preventDefault();
        this.app.showLoading('Creating exchange...');

        try {
            const formData = new FormData(e.target);
            const name = formData.get('name');
            const budget = parseFloat(formData.get('budget'));
            const startDate = formData.get('startDate');
            const endDate = formData.get('endDate');

            // Validate
            if (!name || !budget || !startDate || !endDate) {
                throw new Error('Please fill in all required fields');
            }

            if (new Date(endDate) <= new Date(startDate)) {
                throw new Error('End date must be after start date');
            }

            if (budget <= 0) {
                throw new Error('Budget must be greater than 0');
            }

            // Create exchange
            const exchange = await Exchange.create({
                name,
                giftBudget: budget,
                startDate,
                endDate
            }, this.app.currentUser.id);

            this.app.hideLoading();
            this.app.showMessage(`✅ Exchange "${name}" created successfully!`, 'success');

            // Refresh dashboard
            setTimeout(() => {
                this.render();
            }, 1000);

        } catch (error) {
            console.error('❌ Exchange creation failed:', error);
            this.app.hideLoading();
            this.app.showMessage(error.message || 'Failed to create exchange', 'error');
        }
    }

    async showProfileTab() {
        const contentArea = document.getElementById('dashboard-content');
        if (!contentArea) return;

        this.app.showLoading('Loading your profile...');

        try {
            const user = await User.findById(this.app.currentUser.id);
            if (!user) throw new Error('User not found');

            const stats = await user.getStats();

            contentArea.innerHTML = `
                <div class="profile-section">
                    <h3>👤 Your Profile</h3>

                    <div class="profile-grid">
                        <div class="profile-info">
                            <h4>Personal Information</h4>
                            <ul class="profile-list">
                                <li>
                                    <span>👤 Name:</span>
                                    <strong>${user.name}</strong>
                                </li>
                                <li>
                                    <span>📧 Email:</span>
                                    <strong>${user.email}</strong>
                                </li>
                                <li>
                                    <span>📅 Member Since:</span>
                                    <strong>${user.getJoinDate()}</strong>
                                </li>
                                <li>
                                    <span>👑 Role:</span>
                                    <strong>${user.isAdmin() ? '👑 Administrator' : '👤 Regular User'}</strong>
                                </li>
                            </ul>
                        </div>

                        <div class="profile-stats">
                            <h4>Your Statistics</h4>
                            <div class="stats-grid">
                                <div class="stat-box">
                                    <div class="stat-number">${stats.totalExchanges}</div>
                                    <div class="stat-label">Total Exchanges</div>
                                </div>
                                <div class="stat-box">
                                    <div class="stat-number">${stats.assignments}</div>
                                    <div class="stat-label">Assignments</div>
                                </div>
                                <div class="stat-box">
                                    <div class="stat-number">${stats.createdExchanges}</div>
                                    <div class="stat-label">Created</div>
                                </div>
                                <div class="stat-box">
                                    <div class="stat-number">${stats.participatingExchanges}</div>
                                    <div class="stat-label">Participating</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="wishlist-section">
                        <h4>💝 Your Gift Preferences</h4>
                        ${user.wishList ? `
                            <div class="wishlist-display">
                                <pre>${user.getFormattedWishList()}</pre>
                            </div>
                            <button onclick="dashboardComponent.editWishList()" class="btn-secondary">
                                ✏️ Edit Wish List
                            </button>
                        ` : `
                            <p class="no-wishlist">You haven't set up your wish list yet.</p>
                            <button onclick="dashboardComponent.editWishList()" class="btn-primary">
                                ➕ Add Your Wish List
                            </button>
                        `}
                    </div>

                    <div class="hints-section">
                        <h4>🎨 Gift Themes & Hints</h4>
                        <p class="section-description">Share themes or hints about gifts you'd like (e.g., hobbies, colors, categories)</p>
                        ${user.giftHints ? `
                            <div class="hints-display">
                                <pre>${user.giftHints}</pre>
                            </div>
                            <button onclick="dashboardComponent.editGiftHints()" class="btn-secondary">
                                ✏️ Edit Hints
                            </button>
                        ` : `
                            <p class="no-hints">You haven't added any gift hints yet.</p>
                            <button onclick="dashboardComponent.editGiftHints()" class="btn-primary">
                                ➕ Add Gift Hints
                            </button>
                        `}
                    </div>

                    <div class="profile-actions">
                        <button onclick="dashboardComponent.editProfile()" class="btn-secondary">
                            ✏️ Edit Profile
                        </button>
                        <button onclick="dashboardComponent.logout()" class="btn-danger">
                            🚪 Logout
                        </button>
                    </div>
                </div>
            `;

            this.app.hideLoading();

        } catch (error) {
            console.error('❌ Profile tab render failed:', error);
            this.app.hideLoading();
            this.app.showMessage('Failed to load profile', 'error');
        }
    }

    /**
     * Edit wish list
     */
    async editWishList() {
        const user = await User.findById(this.app.currentUser.id);
        if (!user) return;

        const newWishList = prompt(
            'Enter your gift preferences (one item per line):',
            user.wishList || ''
        );

        if (newWishList === null) return; // User cancelled

        try {
            this.app.showLoading('Updating your wish list...');

            user.updateWishList(newWishList);
            await user.save();

            this.app.hideLoading();
            this.app.showMessage('✅ Wish list updated!', 'success');

            // Refresh profile tab
            setTimeout(() => {
                this.showProfileTab();
            }, 500);

        } catch (error) {
            console.error('❌ Wish list update failed:', error);
            this.app.hideLoading();
            this.app.showMessage('Failed to update wish list', 'error');
        }
    }

    /**
     * Edit gift hints/themes
     */
    async editGiftHints() {
        const user = await User.findById(this.app.currentUser.id);
        if (!user) return;

        const newHints = prompt(
            'Share gift themes & hints (e.g., hobbies, colors, categories, interests):\nOne hint per line',
            user.giftHints || ''
        );

        if (newHints === null) return; // User cancelled

        try {
            this.app.showLoading('Updating your gift hints...');

            user.giftHints = newHints;
            await user.save();

            this.app.hideLoading();
            this.app.showMessage('✅ Gift hints updated!', 'success');

            // Refresh profile tab
            setTimeout(() => {
                this.showProfileTab();
            }, 500);

        } catch (error) {
            console.error('❌ Gift hints update failed:', error);
            this.app.hideLoading();
            this.app.showMessage('Failed to update gift hints', 'error');
        }
    }

    /**
     * Edit profile
     */
    async editProfile() {
        const user = await User.findById(this.app.currentUser.id);
        if (!user) return;

        const newName = prompt('Enter your new name:', user.name);
        if (newName === null) return;

        try {
            this.app.showLoading('Updating your profile...');

            user.updateProfile({ name: newName });
            await user.save();

            // Update app state
            this.app.currentUser = user.toPlainObject();

            this.app.hideLoading();
            this.app.showMessage('✅ Profile updated!', 'success');

            // Refresh dashboard
            setTimeout(() => {
                this.showProfileTab();
            }, 500);

        } catch (error) {
            console.error('❌ Profile update failed:', error);
            this.app.hideLoading();
            this.app.showMessage('Failed to update profile', 'error');
        }
    }

    /**
     * Logout
     */
    async logout() {
        await this.app.logout();
    }
}
