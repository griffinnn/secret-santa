# Secret Santa Gift Exchange 🎄

A web-based Secret Santa gift exchange platform with multi-user support.

## Features

- User registration and authentication
- Create and manage gift exchanges
- Join existing exchanges (approval-based)
- Browse available exchanges
- Automatic Secret Santa assignment generation
- Wish lists and gift hints
- Budget tracking

## Architecture

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Backend**: Node.js + Express REST API
- **Database**: JSON file storage (upgradeable to PostgreSQL)
- **Deployment**: GitHub Pages (frontend) + Railway (backend)

## Local Development

### Backend

```bash
cd backend
npm install
npm start
```

Server runs on http://localhost:3001

### Frontend

Open `index.html` in a browser or use Live Server extension.

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for Railway deployment instructions.

## Testing

```bash
npm test
```

Runs Playwright E2E tests covering:
- User registration and login
- Exchange creation
- Join request and approval workflow

## Project Structure

```
secret-santa/
├── backend/              # Node.js API server
│   ├── routes/          # API route handlers
│   ├── database.js      # Database layer
│   └── server.js        # Express app
├── js/
│   ├── models/          # Data models
│   ├── services/        # Business logic
│   └── components/      # UI components
├── css/                 # Stylesheets
├── tests/               # E2E tests
└── index.html           # Entry point
```

## API Documentation

See [backend/README.md](backend/README.md) for complete API reference.

## License

MIT
