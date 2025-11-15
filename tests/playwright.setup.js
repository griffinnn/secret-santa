import { rmSync, existsSync } from 'fs';
import path from 'path';

const dbPath = path.resolve('backend', 'database.json');

export default async function globalSetup() {
  if (existsSync(dbPath)) {
    rmSync(dbPath);
  }
}
