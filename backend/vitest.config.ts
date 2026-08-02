import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Testovi dijele jednu bazu, pa fajlovi moraju ici serijski.
    fileParallelism: false,
    hookTimeout: 30_000,
    testTimeout: 30_000,
    env: {
      NODE_ENV: 'test',
      // CI postavlja svoj DATABASE_URL; ovo je lokalni fallback.
      DATABASE_URL:
        process.env.DATABASE_URL ??
        'postgresql://majstor:majstor@localhost:5432/majstor_test',
      JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET ?? 'test-access-secret',
    },
  },
})
