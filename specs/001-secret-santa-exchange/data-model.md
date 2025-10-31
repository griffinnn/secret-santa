# Data Model: Secret Santa Exchange Platform

**Feature**: Secret Santa Exchange Platform  
**Created**: 2025-10-30  
**Storage**: Client-side localStorage

## Core Entities

### User Entity
**Purpose**: Represents both admin and regular users in the system

```javascript
{
  id: "uuid-string",           // Unique identifier
  name: "string",              // User's display name
  email: "string",             // Email address (must be unique)
  role: "admin" | "user",      // User role designation
  createdAt: "ISO-8601",       // Account creation timestamp
  wishList: "string"           // Optional gift preferences
}
```

**Validation Rules**:
- `name`: Required, 1-100 characters, no special characters except spaces
- `email`: Required, valid email format, unique across all users
- `role`: Defaults to "user", only admins can create exchanges
- `wishList`: Optional, max 500 characters

**Storage Key**: `secretsanta_users`

### Exchange Entity  
**Purpose**: Represents a Secret Santa gift exchange event

```javascript
{
  id: "uuid-string",           // Unique identifier
  name: "string",              // Exchange display name
  giftBudget: "string",        // Budget guidance (e.g., "$25", "Under $50")
  createdBy: "user-id",        // Admin user who created exchange
  createdAt: "ISO-8601",       // Creation timestamp
  status: "open" | "assigned" | "completed", // Exchange lifecycle
  participants: ["user-id"],   // Array of participant user IDs
  assignmentsGenerated: boolean // Whether gift assignments have been created
}
```

**Validation Rules**:
- `name`: Required, 3-100 characters, Christmas theme encouraged
- `giftBudget`: Required, 1-50 characters, free-form text
- `createdBy`: Must reference existing admin user
- `status`: Defaults to "open", transitions: open → assigned → completed
- `participants`: Array of valid user IDs, minimum 3 for assignment generation

**Storage Key**: `secretsanta_exchanges`

### Assignment Entity
**Purpose**: Links gift givers to recipients within an exchange

```javascript
{
  id: "uuid-string",           // Unique identifier
  exchangeId: "exchange-id",   // Parent exchange reference
  giverId: "user-id",          // User giving the gift
  recipientId: "user-id",      // User receiving the gift
  createdAt: "ISO-8601",       // Assignment timestamp
  status: "active" | "completed" // Assignment status
}
```

**Validation Rules**:
- `exchangeId`: Must reference existing exchange
- `giverId`: Must reference valid participant in the exchange
- `recipientId`: Must reference valid participant in the exchange
- `giverId !== recipientId`: No self-assignments allowed
- Unique constraint: One assignment per giver per exchange

**Storage Key**: `secretsanta_assignments`

### Session Entity
**Purpose**: Manages current user session state

```javascript
{
  currentUserId: "user-id",    // Currently logged in user
  loginAt: "ISO-8601"          // Session start time
}
```

**Storage Key**: `secretsanta_currentUser`

## Entity Relationships

### User → Exchange (One-to-Many)
- One admin user can create multiple exchanges
- Users can participate in multiple exchanges
- Relationship tracked via `participants` array in Exchange

### Exchange → Assignment (One-to-Many)  
- One exchange generates multiple assignments (one per participant)
- Assignments reference parent exchange via `exchangeId`

### User → Assignment (Many-to-Many)
- Users can be givers in multiple assignments (across different exchanges)
- Users can be recipients in multiple assignments (across different exchanges)
- Within one exchange: one user = one giver assignment + one recipient assignment

## State Transitions

### Exchange Status Flow
1. **"open"**: Accepting participants, no assignments yet
2. **"assigned"**: Assignments generated, participants can view their matches
3. **"completed"**: Gift exchange finished (optional status for archival)

### Assignment Status Flow
1. **"active"**: Assignment is current and valid
2. **"completed"**: Gift has been given (optional tracking)

## Data Validation & Constraints

### Business Rules
- Minimum 3 participants required before generating assignments
- Maximum 100 participants per exchange (localStorage size consideration)
- Each participant must be both giver and recipient exactly once per exchange
- No self-assignments allowed in gift matching
- Email addresses must be unique across all users
- Only admin users can create exchanges

### Storage Constraints
- Total localStorage limit: ~5-10MB across all browsers
- Estimated storage per entity:
  - User: ~200 bytes
  - Exchange: ~300 bytes  
  - Assignment: ~150 bytes
- Maximum recommended: 1000 users, 100 exchanges, 1000 assignments

## Algorithm: Gift Assignment Generation

**Purpose**: Create fair gift assignments ensuring each participant gives and receives exactly once

**Steps**:
1. Validate exchange has ≥3 participants
2. Create array of all participant IDs
3. Shuffle recipient array using Fisher-Yates algorithm
4. Check for self-assignments (giver === recipient)
5. If self-assignments exist, retry shuffle (max 10 attempts)
6. Create Assignment entities for each giver-recipient pair
7. Update exchange status to "assigned"
8. Return success/failure result

**Edge Cases**:
- Odd number of participants: Works normally (circular assignment)
- 2 participants: Not allowed (minimum 3 required)
- Failed shuffle attempts: Return error, suggest manual intervention