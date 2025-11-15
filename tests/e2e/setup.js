import { test as base } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Clean database before each test
export const test = base.extend({
  page: async ({ page }, use) => {
    // Clear JSON database file before each test
    const dbPath = path.join(__dirname, '../../backend/database.json');
    
    try {
      if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
      }
    } catch (error) {
      console.warn('Failed to clean database:', error.message);
    }

    await use(page);
  },
});

export { expect } from '@playwright/test';
