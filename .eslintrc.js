module.exports = {
  'env': {
    'browser': true,
    'es2021': true,
    'node': true,
  },
  'extends': [
    'google',
  ],
  'parser': '@typescript-eslint/parser',
  'parserOptions': {
    'ecmaVersion': 12,
    'sourceType': 'module',
  },
  'plugins': [
    '@typescript-eslint',
  ],
  'rules': {
    'valid-jsdoc': [1, {
      'requireReturnType': false,
      'requireParamType': false,
    }],
    'max-len': [1, 120, 2],
    'object-curly-spacing': [
      'error',
      'always',
    ],
  },
};
