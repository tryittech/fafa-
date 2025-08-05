module.exports = {
  env: {
    node: true,
    es2022: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:node/recommended',
    'plugin:security/recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: [
    'node',
    'security'
  ],
  rules: {
    'no-console': 'off',
    'node/no-missing-import': 'off',
    'node/no-unsupported-features/es-syntax': 'off',
    'security/detect-object-injection': 'warn',
    'security/detect-non-literal-fs-filename': 'warn',
    'security/detect-unsafe-regex': 'error',
    'security/detect-buffer-noassert': 'error',
    'security/detect-child-process': 'warn',
    'security/detect-disable-mustache-escape': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-no-csrf-before-method-override': 'error',
    'security/detect-non-literal-regexp': 'error',
    'security/detect-non-literal-require': 'warn',
    'security/detect-possible-timing-attacks': 'warn',
    'security/detect-pseudoRandomBytes': 'error'
  },
  settings: {
    node: {
      allowModules: ['express', 'sqlite3', 'cors', 'helmet', 'morgan', 'multer', 'dayjs', 'bcryptjs', 'jsonwebtoken', 'express-rate-limit', 'express-validator', 'node-fetch']
    }
  }
}