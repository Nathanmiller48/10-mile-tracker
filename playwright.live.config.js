// Runs the same end-to-end tests against the deployed site: npm run test:live
import { defineConfig } from '@playwright/test';
import base from './playwright.config.js';

export default defineConfig({
  ...base,
  webServer: undefined,
  use: {
    ...base.use,
    baseURL: 'https://nathanmiller48.github.io/10-mile-tracker/',
  },
});
