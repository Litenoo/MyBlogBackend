import { config } from 'dotenv';
import { execSync } from 'child_process';

config({ path: '.env.test' });

if (process.env.TEST_SCOPE === 'integration') {
    execSync('npx prisma db push --force-reset', {
        stdio: 'inherit',
        env: {
            ...process.env,
            DATABASE_URL: process.env.DATABASE_URL,
        },
    });
}
