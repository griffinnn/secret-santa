# Secret Santa - Playwright E2E Test Suite

## Overview

A comprehensive automated test suite using **Playwright** - the modern, industry-leading browser automation tool. Faster and more reliable than Selenium with better DX.

## Why Playwright?

✨ **Key Advantages:**
- **Speed**: 3-4x faster than Selenium
- **Multiple Browsers**: Chrome, Firefox, Safari in parallel
- **Better Waits**: Automatic waiting for elements
- **Debug Mode**: Time-travel debugging with video playback
- **Modern API**: Async/await native support
- **Cross-platform**: Windows, macOS, Linux
- **Active Development**: Constantly improved by Microsoft/Playwright team

## Test Architecture

```
tests/
└── e2e/
    ├── 01-auth.spec.js              # Authentication & Registration
    ├── 02-exchange-creation.spec.js # Exchange CRUD operations
    ├── 03-gift-preferences.spec.js  # Gift hints & wish lists
    ├── 04-dashboard.spec.js         # Dashboard & Navigation
    ├── 05-end-to-end.spec.js        # Full user journeys
    └── README.md                     # Testing guide
```

## Test Coverage

### Authentication (01-auth.spec.js)
```javascript
✅ Home page loads successfully
✅ User registration with validation
✅ User login flow
✅ Duplicate email prevention
```

**What's tested:**
- Page rendering
- Form submission
- Data validation
- Error messaging

### Exchange Creation (02-exchange-creation.spec.js)
```javascript
✅ Create new exchange
✅ Form validation (empty fields)
✅ Invalid date range handling
```

**What's tested:**
- Form filling and submission
- Date validation logic
- Error states
- Success feedback

### Gift Preferences (03-gift-preferences.spec.js)
```javascript
✅ Add gift hints/themes
✅ Add wish lists
✅ Edit existing preferences
```

**What's tested:**
- Prompt dialog handling
- Data persistence
- Update operations
- User feedback

### Dashboard (04-dashboard.spec.js)
```javascript
✅ Dashboard access after login
✅ Protected route enforcement
✅ Empty state handling
✅ Exchange display
✅ User profile information
✅ Logout functionality
```

**What's tested:**
- Authentication protection
- Component rendering
- Data display
- Navigation flow

### End-to-End (05-end-to-end.spec.js)
```javascript
✅ Complete Secret Santa flow
  - User registration
  - Exchange creation
  - Gift preferences setup
  - Multi-user participation
✅ Multiple exchanges management
```

**What's tested:**
- Full user journeys
- Multi-user interactions
- Data consistency
- Complex workflows

## Setup Instructions

### 1. Prerequisites
```bash
# Node.js 14+ required
node --version
npm --version
```

### 2. Install Dependencies
```bash
npm install
```

This installs `@playwright/test` and other test dependencies.

### 3. Quick Start
```bash
# Run all tests
npm test

# Or use the setup script
bash setup-tests.sh
```

## Running Tests

### Basic Commands
```bash
# All tests
npm test

# Specific test file
npx playwright test tests/e2e/01-auth.spec.js

# Headed mode (see browser)
npm run test:headed

# Debug mode (with time-travel debugger)
npm run test:debug

# UI mode (interactive runner)
npm run test:ui

# Watch mode (re-run on file changes)
npx playwright test --watch
```

### Advanced Options
```bash
# Run single test
npx playwright test -g "should register a new user"

# Run with specific browser
npx playwright test --project=chromium

# Generate coverage
npx playwright test --coverage

# Show report
npx playwright show-report
```

## Test Configuration

**playwright.config.js:**
- Base URL: `http://localhost:8000`
- Browser: Chromium (configurable)
- Automatic server start
- Screenshots on failure
- Trace recording on first retry
- HTML report generation

## Key Test Patterns

### Login Helper Pattern
```javascript
await page.goto('/#/login');
await page.fill('input[type="email"]', email);
await page.click('button:has-text("Login")');
```

### Form Submission
```javascript
await page.fill('input[name="name"]', 'Test Exchange');
await page.fill('input[name="budget"]', '50');
await page.click('button:has-text("Create Exchange")');
```

### Dialog Handling
```javascript
page.once('dialog', dialog => {
  dialog.accept('user input here');
});
await page.click('button:has-text("Edit Hints")');
```

### Visibility Waits
```javascript
await expect(page.locator('h2:has-text("Welcome")')).toBeVisible({ timeout: 5000 });
```

## Test Data

Tests use dynamic test data with timestamps to:
- Avoid conflicts
- Allow parallel test runs
- Prevent duplicate email errors
- Enable CI/CD integration

```javascript
const timestamp = Date.now();
const email = `user${timestamp}@test.com`;
const exchangeName = `Exchange ${timestamp}`;
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Debugging

### View Test Report
```bash
npx playwright show-report
```

### Debug Single Test
```bash
npm run test:debug -- tests/e2e/01-auth.spec.js
```

### Interactive Inspector
```bash
npx playwright test --debug
# Step through code, inspect elements, modify and rerun
```

### Generate Trace
```bash
npx playwright test --trace on
```

Then view with:
```bash
npx playwright show-trace trace.zip
```

## Performance

- **Execution Time**: ~30-40 seconds for full suite
- **Parallel**: Tests run sequentially for data consistency
- **Headless**: No browser UI overhead
- **Fast Waits**: Automatic retry logic (~100ms intervals)

## Common Issues & Solutions

### Issue: Tests timeout
**Solution:**
```javascript
// Increase timeout for specific test
test('slow test', async ({ page }) => {
  // ...
}, { timeout: 60000 }); // 60 seconds

// Or globally in playwright.config.js
use: {
  timeout: 30000,
}
```

### Issue: "Browser not found"
**Solution:**
```bash
npx playwright install chromium
```

### Issue: Port 8000 already in use
**Solution:**
```javascript
// In playwright.config.js, change port:
webServer: {
  command: 'python3 -m http.server 9000',
  port: 9000,
}
```

### Issue: Tests fail intermittently
**Solution:**
- Use explicit waits: `await page.waitForLoadState('networkidle')`
- Increase default timeouts
- Use `--headed` to debug

## Best Practices

1. **Use selectors wisely**
   ```javascript
   // Good - explicit
   page.locator('button:has-text("Login")')
   
   // Avoid - fragile
   page.locator('button:nth-child(2)')
   ```

2. **Wait for conditions**
   ```javascript
   // Good
   await expect(element).toBeVisible()
   
   // Avoid
   await page.waitForTimeout(3000)
   ```

3. **Test user flows, not implementation**
   ```javascript
   // Good - tests user journey
   await page.click('button')
   await expect(success_message).toBeVisible()
   
   // Avoid - tests internals
   expect(component.state).toBe('active')
   ```

4. **Use descriptive test names**
   ```javascript
   // Good
   test('should prevent duplicate email registration', async () => {})
   
   // Avoid
   test('test email', async () => {})
   ```

## Maintenance

### Regular Tasks
- Review test failures in CI/CD
- Update selectors if UI changes
- Add tests for new features
- Keep Playwright updated: `npm update @playwright/test`

### Adding New Tests
1. Create new `.spec.js` file in `tests/e2e/`
2. Follow existing test patterns
3. Use descriptive test names
4. Add to appropriate test suite
5. Run and verify locally

## Resources

- **Playwright Docs**: https://playwright.dev
- **Test Examples**: https://github.com/microsoft/playwright/tree/main/tests
- **Best Practices**: https://playwright.dev/docs/best-practices
- **Community**: Discord, GitHub Issues, Stack Overflow

## Next Steps

1. ✅ Run tests: `npm test`
2. ✅ View report: `npx playwright show-report`
3. ✅ Debug failed tests: `npm run test:debug`
4. ✅ Add new tests as features are added
5. ✅ Integrate with CI/CD pipeline

---

**Happy Testing! 🎭✨**
