# Secret Santa - Automated Testing Guide

## Test Suite Overview

This project uses **Playwright** for modern, fast, and reliable end-to-end testing. Playwright is the industry-leading choice for UI automation with excellent DX.

## Setup

### Install Dependencies
```bash
npm install
```

This installs Playwright and its dependencies.

### Browser Installation
Playwright will automatically download browsers when first run. To manually install:
```bash
npx playwright install
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in headed mode (see browser)
```bash
npm run test:headed
```

### Run tests in debug mode (interactive)
```bash
npm run test:debug
```

### Run tests in UI mode (new Playwright feature)
```bash
npm run test:ui
```

### Run specific test file
```bash
npx playwright test tests/e2e/01-auth.spec.js
```

### Run tests with specific browser
```bash
npx playwright test --project=chromium
```

## Test Files

### 01-auth.spec.js
- Home page loads correctly
- User registration flow
- User login flow
- Duplicate email prevention

### 02-exchange-creation.spec.js
- Create new exchange
- Form validation
- Invalid date range handling

### 03-gift-preferences.spec.js
- Add gift hints/themes
- Add wish lists
- Edit existing preferences

### 04-dashboard.spec.js
- Dashboard access and authentication
- Protected route access
- Empty states
- Exchange listing
- User profile display
- Logout functionality

### 05-end-to-end.spec.js
- Complete Secret Santa flow (creation → sharing → preferences)
- Multiple exchange management
- Full user journey verification

## Test Results

After running tests, view detailed reports:
```bash
npx playwright show-report
```

This opens an HTML report with:
- Test status and timing
- Screenshots on failure
- Video recordings (when enabled)
- Trace files for debugging

## CI/CD Integration

To run tests in CI environments:
```bash
CI=true npm test
```

This disables server reuse and enables retries.

## Key Features

✅ **Modern**: Built on Playwright's latest APIs
✅ **Fast**: Parallel test execution
✅ **Reliable**: Automatic waits and retry logic
✅ **DX**: Debug mode with time travel
✅ **Visual**: Screenshots and videos on failure
✅ **Traceable**: Full trace recording for debugging

## Troubleshooting

### Tests timeout
- Check if server is running: `npm start` (in another terminal)
- Increase timeout: `await page.waitForTimeout(5000)`

### Browser not found
- Run: `npx playwright install`

### Tests fail locally but pass in CI
- Check timezone and date formats
- Verify local vs CI environment differences

## Development Workflow

1. Start server: `npm start`
2. In another terminal, run: `npm run test:ui`
3. This opens the Playwright UI where you can:
   - See tests run in real-time
   - Step through tests
   - Edit and rerun
   - View traces and videos

Enjoy automated testing! 🎭✨
