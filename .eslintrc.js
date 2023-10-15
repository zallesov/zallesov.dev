/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ["./tsconfig.json"],
  },
  plugins: [
    "unused-imports",
    "simple-import-sort",
    "@typescript-eslint",
    "unicorn",
    "jest",
    "testing-library",
    "react",
    "react-hooks",
    "jsx-a11y",
  ],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:jest/recommended",
    "plugin:testing-library/react",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
    "plugin:react-hooks/recommended",
    "plugin:jsx-a11y/recommended",
    "plugin:next/core-web-vitals",
    "plugin:prettier/recommended", // must be the last entry
  ],
  env: {
    jest: true, // Jest global variables like `it` etc.
    node: true, // Defines things like process.env when generating through node
  },
  settings: {
    react: {
      version: "detect",
    },
  },
  rules: {
    "@next/next/no-img-element": 0,
    "@next/next/no-html-link-for-pages": ["error"],
    "@typescript-eslint/ban-types": 0,
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      },
    ],
    "@typescript-eslint/no-misused-promises": [
      "error",
      {
        checksVoidReturn: false,
      },
    ],
    // `act` is actually necessary after all
    "testing-library/no-unnecessary-act": 0,
    "jsx-a11y/no-autofocus": 0,
    "no-throw-literal": 2,
    "no-unused-expressions": 2,
    "simple-import-sort/imports": [
      "warn",
      {
        groups: [["^", "^\\."]], // this matches VSCode "organize imports"
      },
    ],
    "testing-library/no-debugging-utils": 0,
    "unused-imports/no-unused-imports": 2,
    "unicorn/filename-case": [
      "warn",
      {
        cases: {
          camelCase: true,
          pascalCase: true,
        },
        ignore: [
          "^[A-Z0-9_]+.[a-z]+$", // CONSTANT_CASE
          "^(?!.*backend/src/__mocks__).+$", // ignore backend mocks
        ],
      },
    ],
    "unicorn/new-for-builtins": 2,
  },
  overrides: [
    {
      files: ["*.test.*"],
      rules: {
        "@typescript-eslint/no-explicit-any": 0,
        "@typescript-eslint/no-unsafe-argument": 0,
        "@typescript-eslint/no-unsafe-assignment": 0,
        "@typescript-eslint/no-unsafe-member-access": 0,
        "@typescript-eslint/unbound-method": 0,
        "testing-library/no-debugging-utils": 2,
        "jest/no-mocks-import": 0, // we need to import firestore mocks
      },
    },
    {
      files: ["**/__mocks__/**/*", "*.d.ts", "*.js"],
      rules: {
        "@typescript-eslint/no-explicit-any": 0,
        "@typescript-eslint/no-unsafe-argument": 0,
        "@typescript-eslint/no-unsafe-assignment": 0,
        "@typescript-eslint/no-unsafe-member-access": 0,
        "@typescript-eslint/no-unsafe-return": 0,
        "@typescript-eslint/unbound-method": 0,
      },
    },
    {
      files: ["*.stories.*"],
      rules: {
        "react/prop-types": 0,
      },
    },
  ],
};
