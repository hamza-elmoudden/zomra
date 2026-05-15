import type { Config } from 'jest';
import base from './jest.config';

const config: Config = {
  ...base,
  testMatch: ['<rootDir>/test/integration/**/*.spec.ts'],
  testPathIgnorePatterns: ['.e2e-spec.ts$'],
};

export default config;
