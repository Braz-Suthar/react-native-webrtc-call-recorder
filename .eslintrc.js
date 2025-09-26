module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
  ],
  plugins: ['@typescript-eslint'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  rules: {
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': 'error',
    'no-explicit-any': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    'prefer-const': 'error',
  },
  env: {
    node: true,
    es6: true,
  },
};
