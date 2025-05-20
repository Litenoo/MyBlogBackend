// tests/integration/vitest.config.ts
import { defineConfig } from 'vitest/config'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.test' })

export default defineConfig({
    root: '.',  // Important! Root is this folder
    test: {
        include: ['**/*.test.ts'],  // relative to root
        exclude: ['vitest.config.ts'],
        environment: 'node',
    },
});
