# Secret Santa Backend

Express.js API for Secret Santa gift exchange platform.

## Deployment

See [DEPLOYMENT.md](../DEPLOYMENT.md) for Railway deployment instructions.

## Local Development

```bash
npm install
npm start
```

Server runs on http://localhost:3001

## API Endpoints

### Auth
- `POST /api/auth/login` - Login with email
- `POST /api/auth/logout` - Logout

### Users
- `POST /api/users` - Create user
- `GET /api/users/:id` - Get user by ID
- `GET /api/users/email/:email` - Get user by email
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Exchanges
- `POST /api/exchanges` - Create exchange
- `GET /api/exchanges/:id` - Get exchange
- `GET /api/exchanges` - Get all exchanges
- `GET /api/exchanges/user/:userId` - Get user's exchanges
- `PATCH /api/exchanges/:id` - Update exchange
- `POST /api/exchanges/:id/request-join` - Request to join
- `POST /api/exchanges/:id/approve-participant` - Approve participant
- `POST /api/exchanges/:id/decline-participant` - Decline participant
- `DELETE /api/exchanges/:id` - Delete exchange

### Assignments
- `POST /api/assignments` - Create assignments (batch)
- `GET /api/assignments/exchange/:exchangeId` - Get all assignments for exchange
- `GET /api/assignments/giver/:giverId/exchange/:exchangeId` - Get assignment for giver
- `DELETE /api/assignments/:id` - Delete assignment

## Environment Variables

- `PORT` - Server port (default: 3001)
- `CORS_ORIGIN` - Allowed CORS origin (default: *)
- `NODE_ENV` - Environment (development/production)
