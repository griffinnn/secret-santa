/**
 * Secret Santa Exchange Platform - Main Application
 * Enhanced with full service integration and business logic
 */

import authService from './services/auth.js';
import storageService from './services/storage.js';
import validationService from './services/validation.js';
import User from './models/User.js';
import Exchange from './models/Exchange.js';
import Assignment from './models/Assignment.js';
import RegistrationComponent from './components/registration.js';
import DashboardComponent from './components/dashboard.js';

// Application state and configuration
class SecretSantaApp {
    constructor() {
        this.currentUser = null;
        this.currentRoute = '/';
        this.routes = new Map();
        this.isInitialized = false;
        this.isLoading = false;
        
        // Service references
        this.auth = authService;
        this.storage = storageService;
        this.validation = validationService;
        this.User = User;
        this.Exchange = Exchange;
        this.Assignment = Assignment;
        
        // Protected routes that require authentication
        this.protectedRoutes = new Set([
            '/dashboard', '/admin'
        ]);
        
        // Bind methods to preserve context
        this.init = this.init.bind(this);
        this.handleRouteChange = this.handleRouteChange.bind(this);
        this.handleAuthClick = this.handleAuthClick.bind(this);
        this.showMessage = this.showMessage.bind(this);
        this.hideMessage = this.hideMessage.bind(this);
        this.showLoading = this.showLoading.bind(this);
        this.hideLoading = this.hideLoading.bind(this);
        
        // Christmas greetings for dynamic content
        this.christmasGreetings = [
            "Ho ho ho! 🎅",
            "Merry Christmas! 🎄", 
            "Happy Holidays! ❄️",
            "Season's Greetings! 🎁",
            "Joy to the World! ⭐"
        ];
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            console.log('🎄 Initializing Enhanced Secret Santa App...');
            this.showLoading('Starting up your festive experience...');
            
            // Initialize services first
            await this.initializeServices();
            
            // Initialize routes
            this.setupRoutes();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Initialize Christmas effects
            this.initChristmasEffects();
            
            // Initialize authentication listeners
            this.initializeAuthListeners();
            
            // Check for existing user session
            await this.checkAuthStatus();
            
            // Handle initial route
            this.handleRouteChange();
            
            this.isInitialized = true;
            this.hideLoading();
            console.log('✨ Enhanced Secret Santa App initialized successfully!');
            
        } catch (error) {
            console.error('❌ Failed to initialize app:', error);
            this.hideLoading();
            this.showMessage('Failed to load the application. Please refresh the page.', 'error');
        }
    }

    /**
     * Initialize all services and verify they're working
     */
    async initializeServices() {
        try {
            // Services are singletons, just verify they're accessible
            console.log('🔧 Initializing services...');
            
            // Test storage service
            const storageInfo = this.storage.getStorageInfo();
            if (storageInfo) {
                console.log(`📦 Storage: ${storageInfo.percentage}% used`);
            }
            
            // Test authentication state
            const isAuthenticated = this.auth.isAuthenticated();
            if (isAuthenticated) {
                this.currentUser = this.auth.getCurrentUser();
                console.log(`🔐 User session found: ${this.currentUser?.name}`);
            }
            
            console.log('✅ Services initialized successfully');
            
        } catch (error) {
            console.error('❌ Service initialization failed:', error);
            throw error;
        }
    }

    /**
     * Initialize authentication event listeners
     */
    initializeAuthListeners() {
        this.auth.addAuthListener((isAuthenticated, user) => {
            console.log(`🔐 Auth state changed: ${isAuthenticated ? 'logged in' : 'logged out'}`);
            
            this.currentUser = user;
            this.updateAuthUI();
            
            // Redirect if user loses authentication on protected route
            if (!isAuthenticated && this.protectedRoutes.has(this.currentRoute)) {
                this.showMessage('Please log in to continue', 'info');
                window.location.hash = '#/login';
            }
        });
    }

    /**
     * Set up client-side routing
     */
    setupRoutes() {
        // Define route handlers
        this.routes.set('/', this.renderHome.bind(this));
        this.routes.set('/login', this.renderLogin.bind(this));
        this.routes.set('/register', this.renderRegister.bind(this));
        this.routes.set('/dashboard', this.renderDashboard.bind(this));
        this.routes.set('/exchange', this.renderExchangeDetail.bind(this));
        
        console.log('🎯 Routes configured:', Array.from(this.routes.keys()));
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Hash change for routing
        window.addEventListener('hashchange', this.handleRouteChange);
        
        // Auth button click
        const authButton = document.getElementById('auth-button');
        if (authButton) {
            authButton.addEventListener('click', this.handleAuthClick);
        }
        
        // Message close button
        const messageClose = document.getElementById('message-close');
        if (messageClose) {
            messageClose.addEventListener('click', this.hideMessage);
        }
        
        // Navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                const href = e.target.getAttribute('href');
                if (href && href.startsWith('#')) {
                    this.currentRoute = href.substring(1) || '/';
                    this.handleRouteChange();
                }
            });
        });
        
        console.log('👂 Event listeners set up');
    }

    /**
     * Initialize Christmas effects and animations
     */
    initChristmasEffects() {
        this.createSnowEffect();
        this.addRandomGreeting();
        console.log('❄️ Christmas effects initialized');
    }

    /**
     * Create falling snow effect
     */
    createSnowEffect() {
        const snowContainer = document.getElementById('snow-container');
        if (!snowContainer) return;

        // Create snowflakes periodically
        const createSnowflake = () => {
            const snowflake = document.createElement('div');
            snowflake.className = 'snowflake';
            snowflake.innerHTML = '❄';
            
            // Random position and animation duration
            snowflake.style.left = Math.random() * 100 + '%';
            snowflake.style.animationDuration = (Math.random() * 3 + 2) + 's';
            snowflake.style.opacity = Math.random();
            
            snowContainer.appendChild(snowflake);
            
            // Remove snowflake after animation
            setTimeout(() => {
                if (snowflake.parentNode) {
                    snowflake.parentNode.removeChild(snowflake);
                }
            }, 5000);
        };

        // Create snowflakes at intervals
        if (window.innerWidth > 768) { // Only on larger screens for performance
            setInterval(createSnowflake, 300);
        }
    }

    /**
     * Add random Christmas greeting to page
     */
    addRandomGreeting() {
        const greeting = this.christmasGreetings[
            Math.floor(Math.random() * this.christmasGreetings.length)
        ];
        
        // You can use this greeting in various places
        console.log('🎄 Today\'s greeting:', greeting);
        return greeting;
    }

    /**
     * Handle route changes with authentication protection
     */
    async handleRouteChange() {
        const hash = window.location.hash.substring(1) || '/';
        this.currentRoute = hash.split('?')[0]; // Remove query parameters
        
        console.log('🧭 Navigating to:', this.currentRoute);
        
        // Extract base route for pattern matching (e.g., /exchange/123 -> /exchange)
        const baseRoute = '/' + this.currentRoute.split('/').filter(p => p).slice(0, 1).join('/');
        const checkRoute = this.currentRoute === '/' ? '/' : baseRoute;
        
        // Check authentication for protected routes
        if (this.protectedRoutes.has(checkRoute)) {
            if (!this.auth.isAuthenticated()) {
                this.showMessage('Please log in to access this page', 'info');
                window.location.hash = '#/login';
                return;
            }
        }
        
        // Find and execute route handler - try exact match first, then base route
        let handler = this.routes.get(this.currentRoute);
        if (!handler && this.currentRoute !== baseRoute) {
            handler = this.routes.get(baseRoute);
        }
        
        if (handler) {
            try {
                await handler();
            } catch (error) {
                console.error('❌ Route handler error:', error);
                this.showMessage('Failed to load page. Please try again.', 'error');
            }
        } else {
            console.warn('⚠️ Unknown route:', this.currentRoute);
            this.render404();
        }
        
        // Update active nav link
        this.updateActiveNavLink();
    }

    /**
     * Update active navigation link styling
     */
    updateActiveNavLink() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (href === '#' + this.currentRoute || (href === '#/' && this.currentRoute === '/')) {
                link.classList.add('active');
            }
        });
    }

    /**
     * Handle authentication button click
     */
    async handleAuthClick() {
        if (this.currentUser) {
            // Logout
            await this.logout();
        } else {
            // Navigate to login
            window.location.hash = '#/login';
        }
    }

    /**
     * Check current authentication status using auth service
     */
    async checkAuthStatus() {
        try {
            console.log('🔐 Checking enhanced auth status...');
            
            const isAuthenticated = this.auth.isAuthenticated();
            if (isAuthenticated) {
                this.currentUser = this.auth.getCurrentUser();
                this.updateAuthUI();
                console.log(`✅ User authenticated: ${this.currentUser?.name}`);
            } else {
                this.currentUser = null;
                this.updateAuthUI();
                console.log('👤 No user session found');
            }
        } catch (error) {
            console.error('❌ Auth check failed:', error);
            this.currentUser = null;
            this.updateAuthUI();
        }
    }

    /**
     * Update authentication UI elements
     */
    updateAuthUI() {
        const authButton = document.getElementById('auth-button');
        const body = document.body;
        
        if (this.currentUser) {
            if (authButton) {
                authButton.textContent = `Logout (${this.currentUser.name})`;
            }
            
            // Add user role classes
            body.classList.remove('guest');
            body.classList.add('authenticated');
            
            if (this.currentUser.role === 'admin') {
                body.classList.add('admin');
            } else {
                body.classList.remove('admin');
            }
        } else {
            if (authButton) {
                authButton.textContent = 'Login';
            }
            
            body.classList.remove('authenticated', 'admin');
            body.classList.add('guest');
        }
        
        // Update navigation visibility
        this.updateNavigationVisibility();
    }

    /**
     * Update navigation based on auth state
     */
    updateNavigationVisibility() {
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            const route = href?.substring(1) || '/';
            
            // Show/hide based on authentication and role
            if (this.protectedRoutes.has(route)) {
                if (this.currentUser) {
                    // Check admin routes
                    if (route === '/admin' && this.currentUser.role !== 'admin') {
                        link.style.display = 'none';
                    } else {
                        link.style.display = 'inline-block';
                    }
                } else {
                    link.style.display = 'none';
                }
            } else {
                // Public routes always visible
                link.style.display = 'inline-block';
            }
        });
    }

    /**
     * Enhanced logout with auth service
     */
    async logout() {
        try {
            const userName = this.currentUser?.name || 'User';
            
            await this.auth.logout();
            this.currentUser = null;
            this.updateAuthUI();
            
            this.showMessage(`Successfully logged out! Happy holidays, ${userName}! 🎄`, 'success');
            
            // Redirect to home
            window.location.hash = '#/';
            
        } catch (error) {
            console.error('❌ Logout failed:', error);
            this.showMessage('Logout failed. Please try again.', 'error');
        }
    }

    /**
     * Show loading indicator
     */
    showLoading(message = 'Loading...') {
        this.isLoading = true;
        const loadingContainer = document.getElementById('loading-container');
        const loadingText = document.getElementById('loading-text');
        
        if (loadingContainer) {
            if (loadingText) {
                loadingText.textContent = message;
            }
            loadingContainer.classList.remove('hidden');
        }
    }

    /**
     * Hide loading indicator
     */
    hideLoading() {
        this.isLoading = false;
        const loadingContainer = document.getElementById('loading-container');
        if (loadingContainer) {
            loadingContainer.classList.add('hidden');
        }
    }

    /**
     * Show message to user with enhanced styling
     */
    showMessage(text, type = 'info') {
        const messageContainer = document.getElementById('message-container');
        const messageContent = document.getElementById('message-content');
        const messageText = document.getElementById('message-text');
        
        if (messageContainer && messageContent && messageText) {
            messageText.textContent = text;
            messageContent.className = `message-content ${type}`;
            messageContainer.classList.remove('hidden');
            
            // Auto-hide after 5 seconds (unless it's an error)
            const autoHideDelay = type === 'error' ? 8000 : 5000;
            setTimeout(() => {
                this.hideMessage();
            }, autoHideDelay);
            
            console.log(`📢 Message (${type}): ${text}`);
        }
    }

    /**
     * Hide message
     */
    hideMessage() {
        const messageContainer = document.getElementById('message-container');
        if (messageContainer) {
            messageContainer.classList.add('hidden');
        }
    }

    /**
     * Show confirmation dialog
     */
    async showConfirmation(message, title = 'Confirm Action') {
        return new Promise((resolve) => {
            const confirmed = confirm(`${title}\n\n${message}`);
            resolve(confirmed);
        });
    }

    /**
     * Route handlers (placeholders for now)
     */
    
    renderHome() {
        const content = document.getElementById('main-content');
        const greeting = this.addRandomGreeting();
        
        content.innerHTML = `
            <div class="christmas-message">
                <h2>${greeting}</h2>
                <p>Welcome to Secret Santa Exchange Platform!</p>
            </div>
            
            <div class="text-center">
                <h1>🎄 Secret Santa Exchange</h1>
                <p class="mb-3">Organize your holiday gift exchanges with festive cheer!</p>
                
                ${!this.currentUser ? `
                    <div class="mb-3">
                        <button onclick="window.location.hash='#/register'">Get Started</button>
                        <button onclick="window.location.hash='#/login'" class="secondary">Login</button>
                    </div>
                ` : `
                    <div class="mb-3">
                        <button onclick="window.location.hash='#/dashboard'">Go to Dashboard</button>
                    </div>
                `}
                
                <div class="card">
                    <h3>How it works:</h3>
                    <ol style="text-align: left; max-width: 500px; margin: 0 auto;">
                        <li>🎅 Create your own Secret Santa exchange</li>
                        <li>👥 Invite friends to join your exchange</li>
                        <li>🎁 System automatically assigns gift recipients</li>
                        <li>🎉 Everyone gives and receives one gift!</li>
                    </ol>
                </div>
            </div>
        `;
    }
    
    renderLogin() {
        const content = document.getElementById('main-content');
        content.innerHTML = `
            <div class="form-container">
                <h2 class="text-center mb-3">🎅 Login to Secret Santa</h2>
                <form id="login-form">
                    <div class="form-group">
                        <label for="email">Email Address</label>
                        <input type="email" id="email" name="email" required>
                    </div>
                    <button type="submit">Login</button>
                    <p class="text-center mt-2">
                        Don't have an account? 
                        <a href="#/register">Register here</a>
                    </p>
                </form>
            </div>
        `;
        
        // Attach login form handler
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            
            this.showLoading('Logging in...');
            
            try {
                const user = await this.auth.login(email);
                if (user) {
                    this.currentUser = user;
                    this.showMessage(`Welcome back, ${user.name}!`, 'success');
                    window.location.hash = '#/dashboard';
                } else {
                    this.showMessage('User not found. Please register first.', 'error');
                }
            } catch (error) {
                console.error('Login failed:', error);
                this.showMessage('Login failed. Please try again.', 'error');
            } finally {
                this.hideLoading();
            }
        });
    }
    
    async renderRegister() {
        // Use RegistrationComponent to render the registration page
        const registrationComponent = new RegistrationComponent(this);
        await registrationComponent.render();
    }
    
    async renderDashboard() {
        if (!this.currentUser) {
            window.location.hash = '#/login';
            return;
        }
        
        // Use DashboardComponent to render the user dashboard
        const dashboardComponent = new DashboardComponent(this);
        await dashboardComponent.render();
    }
    
    
    async renderExchangeDetail() {
        const content = document.getElementById('main-content');
        
        // Get exchange ID from URL hash (#/exchange/123)
        const exchangeId = window.location.hash.split('/')[2];
        
        if (!exchangeId) {
            this.showMessage('Exchange ID not found', 'error');
            window.location.hash = '#/dashboard';
            return;
        }

        if (!this.currentUser) {
            this.showMessage('Please log in first', 'error');
            window.location.hash = '#/login';
            return;
        }

        this.showLoading('Loading exchange...');

        try {
            const Exchange = (await import('./models/Exchange.js')).default;
            const User = (await import('./models/User.js')).default;
            
            const exchange = await Exchange.findById(exchangeId);
            
            if (!exchange) {
                throw new Error('Exchange not found');
            }

            // Check if user is the creator
            if (exchange.createdBy !== this.currentUser.id) {
                this.showMessage('Only the exchange creator can manage this exchange', 'error');
                window.location.hash = '#/dashboard';
                return;
            }

            const participants = await exchange.getParticipants();
            const pendingParticipants = await exchange.getPendingParticipants();
            const stats = await exchange.getStats();

            content.innerHTML = `
                <div class="exchange-management">
                    <div class="exchange-header">
                        <button onclick="window.location.hash='#/dashboard'" class="btn-back">← Back to Dashboard</button>
                        <h2>🎁 Manage Exchange</h2>
                    </div>

                    <div class="card">
                        <h3>${exchange.name}</h3>
                        <div class="exchange-stats">
                            <p><strong>Budget:</strong> ${stats.budget}</p>
                            <p><strong>Participants:</strong> ${stats.participantCount}</p>
                            <p><strong>Status:</strong> ${exchange.assignmentsGenerated ? '✅ Assigned' : '⏳ Pending'}</p>
                            <p><strong>Created:</strong> ${stats.createdDate}</p>
                        </div>
                    </div>

                    ${pendingParticipants.length > 0 ? `
                        <div class="card">
                            <h3>⏳ Pending Join Requests (${pendingParticipants.length})</h3>
                            <div class="pending-list">
                                ${pendingParticipants.map(p => `
                                    <div class="pending-item">
                                        <div class="pending-user">
                                            <div class="avatar">${p.user.getInitials()}</div>
                                            <div>
                                                <strong>${p.user.name}</strong>
                                                <p>${p.user.email}</p>
                                            </div>
                                        </div>
                                        <div class="pending-actions">
                                            <button onclick="window.secretSantaApp.approveParticipant('${exchange.id}', '${p.user.id}')" 
                                                    class="btn-small btn-success">✅ Approve</button>
                                            <button onclick="window.secretSantaApp.declineParticipant('${exchange.id}', '${p.user.id}')" 
                                                    class="btn-small btn-danger">❌ Decline</button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    <div class="card">
                        <h3>👥 Participants (${participants.length})</h3>
                        <div class="participants-grid">
                            ${participants.map(p => `
                                <div class="participant-card">
                                    <div class="avatar">${p.getInitials()}</div>
                                    <strong>${p.name}</strong>
                                    <p>${p.email}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    ${exchange.canGenerateAssignments() && !exchange.assignmentsGenerated ? `
                        <div class="card">
                            <h3>🎯 Generate Assignments</h3>
                            <p>You have enough participants to generate Secret Santa assignments!</p>
                            <button onclick="window.secretSantaApp.confirmGenerateAssignments('${exchange.id}')" 
                                    class="btn-primary btn-large">
                                🎁 Generate Assignments
                            </button>
                        </div>
                    ` : exchange.assignmentsGenerated ? `
                        <div class="card success">
                            <h3>✅ Assignments Generated</h3>
                            <p>Secret Santa assignments have been created! Participants can now view their assignments.</p>
                        </div>
                    ` : `
                        <div class="card info">
                            <h3>ℹ️ Need More Participants</h3>
                            <p>You need at least 3 participants to generate assignments.</p>
                        </div>
                    `}
                </div>
            `;

            this.hideLoading();

        } catch (error) {
            console.error('Error loading exchange:', error);
            this.showMessage('Failed to load exchange: ' + error.message, 'error');
            this.hideLoading();
            window.location.hash = '#/dashboard';
        }
    }

    async approveParticipant(exchangeId, userId) {
        try {
            this.showLoading('Approving participant...');
            const Exchange = (await import('./models/Exchange.js')).default;
            const exchange = await Exchange.findById(exchangeId);
            await exchange.approveParticipant(userId);
            this.showMessage('Participant approved!', 'success');
            this.renderExchangeDetail(); // Reload
        } catch (error) {
            console.error('Error approving participant:', error);
            this.showMessage('Failed to approve participant', 'error');
            this.hideLoading();
        }
    }

    async declineParticipant(exchangeId, userId) {
        try {
            this.showLoading('Declining participant...');
            const Exchange = (await import('./models/Exchange.js')).default;
            const exchange = await Exchange.findById(exchangeId);
            await exchange.declineParticipant(userId);
            this.showMessage('Participant declined', 'info');
            this.renderExchangeDetail(); // Reload
        } catch (error) {
            console.error('Error declining participant:', error);
            this.showMessage('Failed to decline participant', 'error');
            this.hideLoading();
        }
    }

    async confirmGenerateAssignments(exchangeId) {
        if (!confirm('Are you sure you want to generate Secret Santa assignments? This cannot be undone!')) {
            return;
        }

        try {
            this.showLoading('Generating assignments...');
            const Exchange = (await import('./models/Exchange.js')).default;
            const exchange = await Exchange.findById(exchangeId);
            await exchange.generateAssignments();
            this.showMessage('Assignments generated successfully! 🎉', 'success');
            this.renderExchangeDetail(); // Reload
        } catch (error) {
            console.error('Error generating assignments:', error);
            this.showMessage('Failed to generate assignments: ' + error.message, 'error');
            this.hideLoading();
        }
    }
    
    render404() {
        const content = document.getElementById('main-content');
        content.innerHTML = `
            <div class="text-center">
                <h2>🎄 Oops! Page Not Found</h2>
                <p>Looks like this page got lost in the snow!</p>
                <button onclick="window.location.hash='#/'">Go Home</button>
            </div>
        `;
    }
}

// Error handling
window.addEventListener('error', (event) => {
    console.error('❌ Application error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ Unhandled promise rejection:', event.reason);
});

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new SecretSantaApp();
    window.secretSantaApp = app; // Make available globally for debugging
    app.init();
});

// Also initialize if DOM is already loaded
if (document.readyState === 'loading') {
    // Already set up listener above
} else {
    const app = new SecretSantaApp();
    window.secretSantaApp = app;
    app.init();
}