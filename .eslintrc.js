/**
 * @type {import("eslint").Linter.Config}
 */
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  plugins: ['prettier'],
  extends: ['airbnb-typescript', 'prettier', 'plugin:prettier/recommended'],
  rules: {
    'prettier/prettier': [
      1,
      {
        singleQuote: true,
        tabWidth: 2,
        trailingComma: 'all',
        endOfLine: 'auto',
      },
    ],
    '@typescript-eslint/indent': 0,
    '@typescript-eslint/quotes': [
      2,
      'single',
      { avoidEscape: true, allowTemplateLiterals: true },
    ],
    'no-console': 2,
  },
};
