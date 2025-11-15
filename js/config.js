/**
 * Frontend Configuration
 * Can be overridden by window.ENV in production
 */

window.ENV = window.ENV || {
  // Use localhost for local development, Railway for production
  API_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3001/api'
    : 'https://secret-santa-production-a76a.up.railway.app/api'
};
