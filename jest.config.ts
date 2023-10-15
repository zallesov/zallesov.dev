import { JestConfigWithTsJest } from "ts-jest/dist/types";

const config: JestConfigWithTsJest = {
  projects: [
    "<rootDir>/types",
    "<rootDir>/backend",
    "<rootDir>/messenger",
    "<rootDir>/talent",
  ],
  collectCoverageFrom: [
    "**/*.ts",
    "!**/**/*.d.ts",
    "!**/*.test.ts",
    "!**/node_modules/**",
    "!**/jest.*.ts",
    "!**/sentry.*.ts",
    "!**/test/**",
    "!**/tests/**",
    "!**/__mocks__/**",
    "!**/scripts/**",
    "**/setupTests.ts",
  ],
};

export default config;
