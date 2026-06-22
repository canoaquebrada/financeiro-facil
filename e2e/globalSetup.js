import { execSync } from 'child_process';
import { existsSync, unlinkSync } from 'fs';
import { resolve } from 'path';

export default async function globalSetup() {
  const testDbPath = resolve(process.cwd(), 'prisma/test.db');

  if (existsSync(testDbPath)) {
    unlinkSync(testDbPath);
  }

  execSync('npx prisma db push --skip-generate --accept-data-loss', {
    env: { ...process.env, DATABASE_URL: 'file:./test.db' },
    cwd: process.cwd(),
    stdio: 'inherit',
  });
}
