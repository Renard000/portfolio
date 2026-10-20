import js from '@eslint/js';
import globals from 'globals';

const apiLibs = [
  'express',
  'react',
  'react-dom',
  'react-redux',
  'redux',
  '@reduxjs/toolkit',
];

export default [
  { ignores: ['node_modules/**', 'coverage/**'] },
  js.configs.recommended,
  {
    languageOptions: { ecmaVersion: 2023, sourceType: 'module', globals: globals.node },
    rules: { 'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }] },
  },
  // DOMAIN : aucune librairie, aucune autre couche (imports relatifs seulement)
  {
    files: ['src/domain/**/*.js'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { regex: '^[^./]', message: 'Domain : aucune librairie externe.' },
            {
              group: ['**/dal/**', '**/bll/**', '**/web/**'],
              message: 'Domain : aucune dépendance vers une autre couche.',
            },
          ],
        },
      ],
    },
  },
  // BLL : ni Express, ni React/Redux, ni accès direct aux clients de la DAL
  {
    files: ['src/bll/**/*.js'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: apiLibs.map((name) => ({
            name,
            message: 'BLL : aucune dépendance UI/HTTP.',
          })),
          patterns: [
            {
              group: ['**/dal/clients/**', '**/web/**'],
              message: 'BLL : passez par les repositories injectés.',
            },
          ],
        },
      ],
    },
  },
  // WEB : n'appelle pas la DAL (sauf la composition root qui assemble tout)
  {
    files: ['src/web/**/*.js'],
    ignores: ['src/web/compositionRoot.js'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [{ group: ['**/dal/**'], message: 'Web : passez par la BLL.' }],
        },
      ],
    },
  },
];
