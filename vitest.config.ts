import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        workspace: [
            'tests/*',
            {
                extends: true,
                test: {
                    include: ['tests/unit/**/*.test.ts'],
                    name: 'unit',
                    environment: "node",
                }
            },
            {
                test: {
                    include: ['tests/integration/**/*.test.ts'],
                    name: 'integration',
                    environment: 'node',
                }
            }
        ]
    }
});