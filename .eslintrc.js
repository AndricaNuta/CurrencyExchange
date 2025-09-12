module.exports = {
  root: true,
  extends: ['@react-native', 'prettier'],
  rules: {
    "no-mixed-spaces-and-tabs": "error",
    "indent": ["error", 2, {
      "SwitchCase": 1
    }],
    'object-curly-newline': [
      'error',
      {
        ObjectExpression: {
          multiline: true,
          minProperties: 1,
        },
        ObjectPattern: {
          multiline: true,
          minProperties: 1,
        },
        ImportDeclaration: 'never',
        ExportDeclaration: 'never',
      },
    ],
    'object-property-newline': [
      'error',
      {
        allowAllPropertiesOnSameLine: false,
      },
    ],

    'max-len': [
      'error',
      {
        code: 80,
        ignoreUrls: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
      },
    ],
  },
};
