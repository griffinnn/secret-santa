/**
 * Test Data for Secret Santa Exchange Platform
 * Sample data for development and manual testing
 */

// Import models and services for testing
import User from '../js/models/User.js';
import Exchange from '../js/models/Exchange.js';
import Assignment from '../js/models/Assignment.js';
import storageService from '../js/services/storage.js';
import authService from '../js/services/auth.js';

/**
 * Sample Users for Testing
 */
export const testUsers = [
    {
        name: 'Santa Claus',
        email: 'santa@northpole.com',
        role: 'admin',
        wishList: `• Nice warm mittens for the North Pole
• Hot cocoa mix for those long December nights
• A new sleigh bell (mine is getting rusty!)
• Peace on Earth and goodwill toward all`
    },
    {
        name: 'Mrs. Claus',
        email: 'mrs.claus@northpole.com',
        role: 'admin',
        wishList: `• A cozy new apron for cookie baking
• Yarn for knitting elf sweaters
• A good book to read by the fireplace
• More time with Santa (he's so busy!)`
    },
    {
        name: 'Elf Buddy',
        email: 'buddy@northpole.com',
        role: 'user',
        wishList: `• Syrup for spaghetti (my favorite!)
• A new yellow hat and tights
• Anything sparkly and festive
• Smiles from everyone!`
    },
    {
        name: 'Rudolph Reindeer',
        email: 'rudolph@northpole.com',
        role: 'user',
        wishList: `• Carrots (the crunchier the better!)
• A nose-warming muff for foggy nights
• Flying lessons for the other reindeer
• Recognition for my navigation skills`
    },
    {
        name: 'Hermey the Elf',
        email: 'hermey@northpole.com',
        role: 'user',
        wishList: `• Dental tools (I want to be a dentist!)
• A professional white coat
• Books about dentistry
• Acceptance from my fellow elves`
    },
    {
        name: 'Jack Frost',
        email: 'jack.frost@winter.com',
        role: 'user',
        wishList: `• Ice sculpting tools
• A warmer coat (ironic, I know)
• Window painting supplies
• Friends who don't mind the cold`
    },
    {
        name: 'The Grinch',
        email: 'grinch@whoville.com',
        role: 'user',
        wishList: `• A heart two sizes larger
• Green hair products
• Noise-canceling headphones
• Maybe just one Who to be my friend`
    },
    {
        name: 'Frosty Snowman',
        email: 'frosty@snowfield.com',
        role: 'user',
        wishList: `• A magical new hat (backup)
• Coal for button replacement
• A scarf that won't unravel
• Climate change solutions`
    }
];

/**
 * Sample Exchanges for Testing
 */
export const testExchanges = [
    {
        name: 'North Pole Holiday Exchange 2024',
        giftBudget: 25.00,
        description: 'Annual Secret Santa for all North Pole residents!'
    },
    {
        name: 'Workshop Team Secret Santa',
        giftBudget: 15.00,
        description: 'Holiday fun for the hardworking elves'
    },
    {
        name: 'Reindeer Games Gift Swap',
        giftBudget: 30.00,
        description: 'Flying high with holiday cheer'
    },
    {
        name: 'Winter Wonderland Exchange',
        giftBudget: 50.00,
        description: 'Premium gift exchange for winter magical beings'
    }
];

/**
 * Christmas-themed gift suggestions for testing
 */
export const giftSuggestions = {
    budget_10: [
        'Hot chocolate mix', 'Christmas socks', 'Holiday candle',
        'Candy canes', 'Christmas ornament', 'Festive mug',
        'Holiday cookies', 'Christmas card', 'Small plant'
    ],
    budget_25: [
        'Cozy blanket', 'Book', 'Coffee gift card', 'Nice candle set',
        'Christmas sweater', 'Board game', 'Tea sampler',
        'Holiday movie', 'Scarf and mittens', 'Desk accessories'
    ],
    budget_50: [
        'Premium gift card', 'Nice bottle of wine', 'Skincare set',
        'Bluetooth speaker', 'Quality blanket', 'Gourmet food basket',
        'Professional coffee', 'Nice jewelry', 'Home decor',
        'Experience gift certificate'
    ]
};

/**
 * Test Data Manager Class
 */
class TestDataManager {
    constructor() {
        this.isLoaded = false;
        this.createdUsers = [];
        this.createdExchanges = [];
        this.createdAssignments = [];
    }

    /**
     * Load all test data into the application
     */
    async loadAllTestData() {
        try {
            console.log('🎄 Loading Secret Santa test data...');
            
            // Clear existing data first
            await this.clearAllData();
            
            // Load users
            await this.loadTestUsers();
            
            // Load exchanges
            await this.loadTestExchanges();
            
            // Create some sample assignments
            await this.createSampleAssignments();
            
            this.isLoaded = true;
            console.log('✅ Test data loaded successfully!');
            
            return {
                users: this.createdUsers.length,
                exchanges: this.createdExchanges.length,
                assignments: this.createdAssignments.length
            };
            
        } catch (error) {
            console.error('❌ Failed to load test data:', error);
            throw error;
        }
    }

    /**
     * Load test users
     */
    async loadTestUsers() {
        console.log('👥 Creating test users...');
        
        for (const userData of testUsers) {
            try {
                const user = await User.create(userData);
                this.createdUsers.push(user);
                console.log(`✅ Created user: ${user.name} (${user.role})`);
            } catch (error) {
                console.error(`❌ Failed to create user ${userData.name}:`, error);
            }
        }
        
        console.log(`✅ Created ${this.createdUsers.length} test users`);
    }

    /**
     * Load test exchanges
     */
    async loadTestExchanges() {
        console.log('🎁 Creating test exchanges...');
        
        // Use Santa as the creator for all test exchanges
        const santa = this.createdUsers.find(user => user.email === 'santa@northpole.com');
        if (!santa) {
            throw new Error('Santa not found! Cannot create exchanges.');
        }
        
        for (const exchangeData of testExchanges) {
            try {
                const exchange = await Exchange.create(exchangeData, santa.id);
                this.createdExchanges.push(exchange);
                console.log(`✅ Created exchange: ${exchange.name}`);
                
                // Add some participants to the first exchange
                if (exchange.name === 'North Pole Holiday Exchange 2024') {
                    await this.addParticipantsToExchange(exchange);
                }
                
            } catch (error) {
                console.error(`❌ Failed to create exchange ${exchangeData.name}:`, error);
            }
        }
        
        console.log(`✅ Created ${this.createdExchanges.length} test exchanges`);
    }

    /**
     * Add participants to an exchange
     */
    async addParticipantsToExchange(exchange) {
        const participants = this.createdUsers.filter(user => 
            user.role === 'user' && 
            ['buddy@northpole.com', 'rudolph@northpole.com', 'hermey@northpole.com', 'jack.frost@winter.com']
            .includes(user.email)
        );
        
        for (const participant of participants) {
            try {
                await exchange.addParticipant(participant.id);
                console.log(`  ➕ Added ${participant.name} to ${exchange.name}`);
            } catch (error) {
                console.error(`❌ Failed to add ${participant.name} to exchange:`, error);
            }
        }
    }

    /**
     * Create sample assignments for testing
     */
    async createSampleAssignments() {
        console.log('🎯 Creating sample assignments...');
        
        const mainExchange = this.createdExchanges.find(e => 
            e.name === 'North Pole Holiday Exchange 2024'
        );
        
        if (mainExchange && mainExchange.participants.length >= 3) {
            try {
                const assignments = await mainExchange.generateAssignments();
                this.createdAssignments = assignments;
                console.log(`✅ Generated ${assignments.length} assignments for ${mainExchange.name}`);
                
                // Log assignments for debugging (in real app, this would be hidden!)
                for (const assignment of assignments) {
                    const giver = await User.findById(assignment.giverId);
                    const recipient = await User.findById(assignment.recipientId);
                    console.log(`  🎁 ${giver?.name} → ${recipient?.name}`);
                }
                
            } catch (error) {
                console.error('❌ Failed to generate assignments:', error);
            }
        }
    }

    /**
     * Clear all existing data
     */
    async clearAllData() {
        console.log('🧹 Clearing existing data...');
        
        try {
            storageService.clear();
            console.log('✅ All data cleared');
        } catch (error) {
            console.error('❌ Failed to clear data:', error);
        }
    }

    /**
     * Login as a test user
     */
    async loginAsTestUser(email) {
        try {
            const user = await authService.login(email);
            console.log(`✅ Logged in as: ${user.name}`);
            return user;
        } catch (error) {
            console.error(`❌ Failed to login as ${email}:`, error);
            throw error;
        }
    }

    /**
     * Get test data summary
     */
    getTestDataSummary() {
        if (!this.isLoaded) {
            return 'Test data not loaded. Call loadAllTestData() first.';
        }
        
        return {
            users: this.createdUsers.map(u => ({
                name: u.name,
                email: u.email,
                role: u.role
            })),
            exchanges: this.createdExchanges.map(e => ({
                name: e.name,
                budget: e.getFormattedBudget(),
                participants: e.participants.length
            })),
            assignments: this.createdAssignments.length
        };
    }

    /**
     * Quick demo scenarios
     */
    async runDemoScenario(scenario = 'basic') {
        console.log(`🎬 Running demo scenario: ${scenario}`);
        
        switch (scenario) {
            case 'admin':
                await this.loadAllTestData();
                await this.loginAsTestUser('santa@northpole.com');
                console.log('🎅 Admin demo ready! You can now create exchanges.');
                break;
                
            case 'user':
                await this.loadAllTestData();
                await this.loginAsTestUser('buddy@northpole.com');
                console.log('🧝 User demo ready! You can now join exchanges.');
                break;
                
            case 'participant':
                await this.loadAllTestData();
                await this.loginAsTestUser('rudolph@northpole.com');
                console.log('🦌 Participant demo ready! You have assignments to view.');
                break;
                
            default:
                await this.loadAllTestData();
                console.log('🎄 Basic demo ready! Choose your login.');
        }
    }
}

// Create singleton instance
const testDataManager = new TestDataManager();

// Make available globally for manual testing
window.testDataManager = testDataManager;
window.testUsers = testUsers;
window.testExchanges = testExchanges;
window.giftSuggestions = giftSuggestions;

export default testDataManager;

/**
 * Helper functions for manual testing in browser console
 */

// Load all test data
window.loadTestData = () => testDataManager.loadAllTestData();

// Quick login helpers
window.loginAsSanta = () => testDataManager.loginAsTestUser('santa@northpole.com');
window.loginAsBuddy = () => testDataManager.loginAsTestUser('buddy@northpole.com');
window.loginAsRudolph = () => testDataManager.loginAsTestUser('rudolph@northpole.com');

// Demo scenarios
window.runAdminDemo = () => testDataManager.runDemoScenario('admin');
window.runUserDemo = () => testDataManager.runDemoScenario('user');
window.runParticipantDemo = () => testDataManager.runDemoScenario('participant');

// Clear data
window.clearAllData = () => testDataManager.clearAllData();

// Get summary
window.getTestSummary = () => {
    console.table(testDataManager.getTestDataSummary());
    return testDataManager.getTestDataSummary();
};

console.log('🎄 Test data module loaded! Available commands:');
console.log('  • loadTestData() - Load all sample data');
console.log('  • loginAsSanta() - Login as admin user');
console.log('  • loginAsBuddy() - Login as regular user');
console.log('  • runAdminDemo() - Full admin scenario');
console.log('  • runUserDemo() - Full user scenario');
console.log('  • getTestSummary() - See loaded data');
console.log('  • clearAllData() - Start fresh');