import { existsSync, unlinkSync } from 'fs';
import { resolve } from 'path';

export default async function globalTeardown() {
  const testDbPath = resolve(process.cwd(), 'prisma/test.db');
  const testDbJournalPath = resolve(process.cwd(), 'prisma/test.db-journal');

  try {
    if (existsSync(testDbPath)) unlinkSync(testDbPath);
    if (existsSync(testDbJournalPath)) unlinkSync(testDbJournalPath);
  } catch {
  }
}
