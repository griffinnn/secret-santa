/**
 * User Registration Component
 * Handles user registration, exchange browsing, joining, and profile management
 */

import User from '../models/User.js';
import Exchange from '../models/Exchange.js';
import validationService from '../services/validation.js';

export default class RegistrationComponent {
    constructor(app) {
        this.app = app;
        this.availableExchanges = [];
        this.userExchanges = [];
    }

    /**
     * Render registration page
     */
    async render() {
        try {
            const content = document.getElementById('main-content');
            if (!content) return;

            this.app.showLoading('Loading registration...');

            const greeting = this.app.christmasGreetings[Math.floor(Math.random() * this.app.christmasGreetings.length)];

            content.innerHTML = `
                <div class="registration-page">
                    <div class="registration-greeting">
                        <h2>${greeting}</h2>
                        <p>Join the Secret Santa Fun! 🎁</p>
                    </div>

                    <div class="registration-tabs">
                        <button class="tab-button active" onclick="registrationComponent.showRegisterTab()">
                            ✍️ Create Account
                        </button>
                        <button class="tab-button" onclick="registrationComponent.showBrowseTab()">
                            🎄 Browse Exchanges
                        </button>
                    </div>

                    <div id="registration-content" class="registration-content">
                        <!-- Tab content rendered here -->
                    </div>
                </div>
            `;

            // Set up component globally
            window.registrationComponent = this;

            // Show register tab by default
            await this.showRegisterTab();

            this.app.hideLoading();

        } catch (error) {
            console.error('❌ Registration page render failed:', error);
            this.app.hideLoading();
            this.app.showMessage('Failed to load registration', 'error');
        }
    }

    /**
     * Show registration tab
     */
    async showRegisterTab() {
        const contentArea = document.getElementById('registration-content');
        if (!contentArea) return;

        contentArea.innerHTML = `
            <div class="register-section">
                <h3>🎅 Create Your Secret Santa Account</h3>
                <p class="section-description">Join the festive fun and participate in gift exchanges!</p>

                <form id="registration-form" class="registration-form">
                    <div class="form-group">
                        <label for="reg-name">Full Name *</label>
                        <input 
                            type="text" 
                            id="reg-name" 
                            name="name"
                            placeholder="e.g., Elf Buddy"
                            required
                        >
                        <small>How should other participants know you?</small>
                    </div>

                    <div class="form-group">
                        <label for="reg-email">Email Address *</label>
                        <input 
                            type="email" 
                            id="reg-email" 
                            name="email"
                            placeholder="your@email.com"
                            required
                        >
                        <small>We'll use this to create your account</small>
                    </div>

                    <div class="form-group">
                        <label for="reg-wishlist">Your Gift Preferences (Optional)</label>
                        <textarea 
                            id="reg-wishlist" 
                            name="wishList"
                            placeholder="Tell Secret Santas what you love! E.g.:&#10;• Books&#10;• Coffee&#10;• Cozy socks"
                            rows="6"
                        ></textarea>
                        <small>You can update this anytime. One item per line.</small>
                    </div>

                    <div class="form-actions">
                        <button type="submit" class="btn-primary">
                            🎄 Create Account
                        </button>
                        <button type="reset" class="btn-secondary">
                            Clear Form
                        </button>
                    </div>
                </form>

                <div class="registration-benefits">
                    <h4>✨ What You Get:</h4>
                    <ul>
                        <li>🎁 Access to festive gift exchanges</li>
                        <li>🎅 Your Secret Santa assignment</li>
                        <li>📋 View recipient's gift preferences</li>
                        <li>🎄 Join multiple exchanges</li>
                        <li>💝 Spread holiday cheer!</li>
                    </ul>
                </div>

                <div class="existing-user-notice">
                    <p>Already have an account? <a href="#/login">Login here</a></p>
                </div>
            </div>
        `;

        // Attach form handler
        const form = document.getElementById('registration-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleRegistration(e));
        }
    }

    /**
     * Handle user registration
     */
    async handleRegistration(e) {
        e.preventDefault();

        try {
            this.app.showLoading('Creating your account...');

            // Get form data
            const formData = {
                name: document.getElementById('reg-name').value.trim(),
                email: document.getElementById('reg-email').value.trim(),
                wishList: document.getElementById('reg-wishlist').value.trim()
            };

            // Validate
            const validation = validationService.validateUserRegistration(formData);
            if (!validation.isValid) {
                throw new Error(Object.values(validation.errors).flat().join(', '));
            }

            // Create user
            const user = await User.create(formData);

            this.app.hideLoading();
            this.app.showMessage(
                `✅ Welcome, ${user.name}! Account created successfully. 🎉`,
                'success'
            );

            // Reset form
            document.getElementById('registration-form').reset();

            // Login the new user
            setTimeout(async () => {
                await this.app.auth.login(user.email);
                window.location.hash = '#/dashboard';
            }, 1000);

        } catch (error) {
            console.error('❌ Registration failed:', error);
            this.app.hideLoading();
            this.app.showMessage(error.message || 'Registration failed', 'error');
        }
    }

    /**
     * Show browse exchanges tab
     */
    async showBrowseTab() {
        const contentArea = document.getElementById('registration-content');
        if (!contentArea) return;

        this.app.showLoading('Loading available exchanges...');

        try {
            // Get all open exchanges
            const allExchanges = await Exchange.findAll();
            const openExchanges = allExchanges.filter(e => e.status === 'open');

            if (openExchanges.length === 0) {
                contentArea.innerHTML = `
                    <div class="empty-state">
                        <h3>🎄 No Open Exchanges</h3>
                        <p>There are no exchanges open for joining right now.</p>
                        <p>Ask an admin to create one, or check back soon!</p>
                    </div>
                `;
                this.app.hideLoading();
                return;
            }

            // Build exchanges list
            let html = `
                <div class="browse-exchanges-section">
                    <h3>🎁 Available Secret Santa Exchanges</h3>
                    <p class="section-description">Join any of these exchanges to participate in the holiday fun!</p>
                    <div class="exchanges-browse-grid">
            `;

            for (const exchange of openExchanges) {
                const creator = await exchange.getCreator();
                const stats = await exchange.getStats();

                html += `
                    <div class="exchange-browse-card">
                        <div class="exchange-header-browse">
                            <h4>${exchange.name}</h4>
                            <span class="budget-badge">${stats.budget}</span>
                        </div>

                        <div class="exchange-info-browse">
                            <p><strong>Created by:</strong> ${creator?.name || 'Admin'}</p>
                            <p><strong>Participants:</strong> ${stats.participantCount}</p>
                            <p><strong>Your Status:</strong> <span class="status-available">Available to Join</span></p>
                        </div>

                        <div class="exchange-actions-browse">
                            <button onclick="registrationComponent.joinExchange('${exchange.id}')" class="btn-join">
                                ✅ Join Exchange
                            </button>
                            <button onclick="registrationComponent.showExchangeDetails('${exchange.id}')" class="btn-details">
                                👀 View Details
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
            console.error('❌ Browse tab render failed:', error);
            this.app.hideLoading();
            this.app.showMessage('Failed to load exchanges', 'error');
        }
    }

    /**
     * Show exchange details
     */
    async showExchangeDetails(exchangeId) {
        try {
            this.app.showLoading('Loading exchange details...');

            const exchange = await Exchange.findById(exchangeId);
            if (!exchange) throw new Error('Exchange not found');

            const participants = await exchange.getParticipants();
            const stats = await exchange.getStats();
            const creator = await exchange.getCreator();

            const contentArea = document.getElementById('registration-content');
            contentArea.innerHTML = `
                <div class="exchange-details-browse">
                    <div class="details-header">
                        <button onclick="registrationComponent.showBrowseTab()" class="btn-back">← Back to Exchanges</button>
                        <h3>${exchange.name}</h3>
                    </div>

                    <div class="details-grid-browse">
                        <div class="details-box">
                            <h4>📊 Exchange Details</h4>
                            <ul class="details-list">
                                <li>
                                    <span>💰 Budget:</span>
                                    <strong>${stats.budget}</strong>
                                </li>
                                <li>
                                    <span>👤 Created By:</span>
                                    <strong>${creator?.name || 'Admin'}</strong>
                                </li>
                                <li>
                                    <span>📅 Created Date:</span>
                                    <strong>${stats.createdDate}</strong>
                                </li>
                                <li>
                                    <span>👥 Participants:</span>
                                    <strong>${stats.participantCount}</strong>
                                </li>
                                <li>
                                    <span>🎯 Status:</span>
                                    <strong>Open for Joining</strong>
                                </li>
                            </ul>
                        </div>

                        <div class="details-box">
                            <h4>🎁 Gift Guide</h4>
                            <p class="gift-guide-text">
                                Each participant will give a gift with a budget of <strong>${stats.budget}</strong>.
                                Your recipient's wish list will be revealed after assignments are generated.
                            </p>
                        </div>
                    </div>

                    <div class="participants-preview">
                        <h4>👥 Participants (${participants.length})</h4>
                        <div class="participants-list-browse">
                            ${participants.length === 0 ? 
                                '<p><em>No participants yet - be the first!</em></p>' 
                                : 
                                participants.map(p => `
                                    <div class="participant-item">
                                        <div class="participant-avatar">${p.getInitials()}</div>
                                        <div class="participant-info">
                                            <p class="participant-name">${p.name}</p>
                                        </div>
                                    </div>
                                `).join('')
                            }
                        </div>
                    </div>

                    <div class="details-actions">
                        <button onclick="registrationComponent.joinExchange('${exchangeId}')" class="btn-primary">
                            ✅ Join This Exchange
                        </button>
                        <button onclick="registrationComponent.showBrowseTab()" class="btn-secondary">
                            ← Back
                        </button>
                    </div>
                </div>
            `;

            this.app.hideLoading();

        } catch (error) {
            console.error('❌ Details view failed:', error);
            this.app.hideLoading();
            this.app.showMessage('Failed to load exchange details', 'error');
        }
    }

    /**
     * Join an exchange
     */
    async joinExchange(exchangeId) {
        try {
            if (!this.app.currentUser) {
                this.app.showMessage('Please create an account first', 'info');
                window.location.hash = '#/register';
                return;
            }

            this.app.showLoading('Joining exchange...');

            const exchange = await Exchange.findById(exchangeId);
            if (!exchange) throw new Error('Exchange not found');

            // Check if user can join
            if (!exchange.canUserJoin(this.app.currentUser.id)) {
                throw new Error('Cannot join this exchange');
            }

            // Add participant
            await exchange.addParticipant(this.app.currentUser.id);

            this.app.hideLoading();
            this.app.showMessage(
                `✅ Success! You've joined "${exchange.name}"! 🎄 Happy holidays!`,
                'success'
            );

            // Redirect to dashboard
            setTimeout(() => {
                window.location.hash = '#/dashboard';
            }, 1500);

        } catch (error) {
            console.error('❌ Join failed:', error);
            this.app.hideLoading();
            this.app.showMessage(error.message || 'Failed to join exchange', 'error');
        }
    }
}
