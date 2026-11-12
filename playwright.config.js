import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  outputDir: 'test-results',
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4173/10-mile-tracker/',
    browserName: 'chromium',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    colorScheme: 'dark',
    // The service worker is exercised only by tests/e2e/offline.spec.js.
    serviceWorkers: 'block',
  },
  webServer: {
    command: 'node scripts/serve.mjs',
    url: 'http://localhost:4173/10-mile-tracker/',
    reuseExistingServer: true,
  },
});
