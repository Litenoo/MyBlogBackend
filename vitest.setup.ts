// vitest.setup.ts
import { config } from 'dotenv';
import { execSync } from 'child_process';

config({ path: '.env.integration' });

if (process.env.TEST_SCOPE === 'integration') {
    execSync('npx prisma db push --force-reset', {
        stdio: 'inherit',
        env: {
            ...process.env,
            DATABASE_URL: process.env.DATABASE_URL,
        },
    });
}
//This code runs every single test file but couldn't