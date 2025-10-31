# Client-Side API Contracts

**Note**: This is a static web application using localStorage. These "contracts" define the JavaScript API interfaces for consistency across components.

## Storage Service API

### StorageService Interface

```javascript
class StorageService {
  // User operations
  static createUser(userData) → Promise<User>
  static getUserById(userId) → Promise<User|null>
  static getUserByEmail(email) → Promise<User|null>
  static getAllUsers() → Promise<User[]>
  static updateUser(userId, updates) → Promise<User>
  static deleteUser(userId) → Promise<boolean>
  
  // Exchange operations  
  static createExchange(exchangeData) → Promise<Exchange>
  static getExchangeById(exchangeId) → Promise<Exchange|null>
  static getAllExchanges() → Promise<Exchange[]>
  static getExchangesByUser(userId) → Promise<Exchange[]>
  static updateExchange(exchangeId, updates) → Promise<Exchange>
  static deleteExchange(exchangeId) → Promise<boolean>
  
  // Assignment operations
  static createAssignment(assignmentData) → Promise<Assignment>
  static getAssignmentsByExchange(exchangeId) → Promise<Assignment[]>
  static getAssignmentByGiver(giverId, exchangeId) → Promise<Assignment|null>
  static getAssignmentByRecipient(recipientId, exchangeId) → Promise<Assignment[]>
  static generateAssignments(exchangeId) → Promise<Assignment[]>
  
  // Session operations
  static login(email) → Promise<User|null>
  static logout() → Promise<void>
  static getCurrentUser() → Promise<User|null>
  static isAuthenticated() → Promise<boolean>
}
```

## Component Event API

### Application Events

```javascript
// Event names (constants)
const EVENTS = {
  USER_LOGGED_IN: 'user:loggedIn',
  USER_LOGGED_OUT: 'user:loggedOut', 
  EXCHANGE_CREATED: 'exchange:created',
  EXCHANGE_JOINED: 'exchange:joined',
  ASSIGNMENTS_GENERATED: 'assignments:generated',
  ROUTE_CHANGED: 'route:changed'
};

// Event data structures
UserLoggedInEvent: { user: User }
ExchangeCreatedEvent: { exchange: Exchange }
ExchangeJoinedEvent: { exchange: Exchange, user: User }
AssignmentsGeneratedEvent: { exchange: Exchange, assignments: Assignment[] }
RouteChangedEvent: { route: string, params: object }
```

## Form Validation API

### Validation Rules

```javascript
class ValidationService {
  // User validation
  static validateUserRegistration(formData) → ValidationResult
  static validateUserUpdate(userId, formData) → ValidationResult
  
  // Exchange validation  
  static validateExchangeCreation(formData) → ValidationResult
  static validateExchangeUpdate(exchangeId, formData) → ValidationResult
  
  // Assignment validation
  static validateAssignmentGeneration(exchangeId) → ValidationResult
}

// ValidationResult structure
ValidationResult: {
  isValid: boolean,
  errors: {
    [fieldName]: string[]
  },
  warnings: string[]
}
```

## Router API

### Client-Side Routing

```javascript
class Router {
  static navigate(route, params = {}) → void
  static getCurrentRoute() → { route: string, params: object }
  static addRoute(pattern, handler) → void
  static start() → void
}

// Route patterns
Routes: {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register', 
  DASHBOARD: '/dashboard',
  ADMIN: '/admin',
  EXCHANGE_DETAIL: '/exchange/:id',
  ASSIGNMENT_VIEW: '/assignment/:exchangeId'
}
```

## Error Handling API

### Error Types

```javascript
class AppError extends Error {
  constructor(message, code, details = {})
}

// Error codes
ERROR_CODES: {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  EXCHANGE_NOT_FOUND: 'EXCHANGE_NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  ASSIGNMENT_FAILED: 'ASSIGNMENT_FAILED',
  STORAGE_FULL: 'STORAGE_FULL',
  DUPLICATE_EMAIL: 'DUPLICATE_EMAIL'
}
```

## Christmas Theme API

### Theme Service

```javascript
class ThemeService {
  static applyChristmasTheme() → void
  static toggleSnowEffect(enabled) → void
  static getRandomChristmasGreeting() → string
  static getChristmasColors() → { primary: string, secondary: string, accent: string }
}

// Christmas greetings pool
CHRISTMAS_GREETINGS: [
  "Ho ho ho! 🎅",
  "Merry Christmas! 🎄", 
  "Happy Holidays! ❄️",
  "Season's Greetings! 🎁",
  "Joy to the World! ⭐"
]
```

## Response Data Formats

### Success Response
```javascript
SuccessResponse: {
  success: true,
  data: any,
  message?: string
}
```

### Error Response  
```javascript
ErrorResponse: {
  success: false,
  error: {
    code: string,
    message: string,
    details?: object
  }
}
```

## Local Storage Schema

### Storage Keys
```javascript
STORAGE_KEYS: {
  USERS: 'secretsanta_users',
  EXCHANGES: 'secretsanta_exchanges', 
  ASSIGNMENTS: 'secretsanta_assignments',
  CURRENT_USER: 'secretsanta_currentUser',
  APP_SETTINGS: 'secretsanta_settings'
}
```

These contracts ensure consistent interfaces across all JavaScript components while maintaining the static site architecture.