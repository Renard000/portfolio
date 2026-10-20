import js from '@eslint/js';
import globals from 'globals';

const hookImports = [
  'useState',
  'useEffect',
  'useContext',
  'useRef',
  'useMemo',
  'useCallback',
  'useReducer',
  'useLayoutEffect',
];
const hookPaths = [
  {
    name: 'react',
    importNames: hookImports,
    message: 'Hooks interdits : utilisez des classes.',
  },
  {
    name: 'react-redux',
    importNames: ['useSelector', 'useDispatch', 'useStore'],
    message: 'Utilisez connect.',
  },
  {
    name: 'react-router-dom',
    importNames: ['useHistory', 'useParams', 'useLocation', 'useRouteMatch'],
    message: 'Utilisez withRouter.',
  },
];

export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      'public/**',
      'webpack.config.js',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, process: 'readonly' },
    },
    rules: {
      // Sans eslint-plugin-react (incompatible ESLint 10) : on ignore les composants en MAJUSCULE utilisés dans le JSX
      'no-unused-vars': [
        'warn',
        { varsIgnorePattern: '^[A-Z]', argsIgnorePattern: '^_' },
      ],
      'no-restricted-imports': ['error', { paths: hookPaths }],
      // Aucun hook, même personnalisé : useXxx(...) et React.useXxx(...)
      'no-restricted-syntax': [
        'error',
        {
          selector: 'CallExpression[callee.name=/^use[A-Z]/]',
          message: 'Hooks interdits : utilisez des classes.',
        },
        {
          selector: 'CallExpression[callee.property.name=/^use[A-Z]/]',
          message: 'Hooks interdits : utilisez des classes.',
        },
      ],
    },
  },
  {
    files: ['**/*.test.{js,jsx}', 'src/setupTests.js'],
    languageOptions: { globals: { ...globals.browser, ...globals.vitest } },
  },
  // DOMAIN : aucune librairie, aucune autre couche
  {
    files: ['src/domain/**/*.{js,jsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: hookPaths,
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
  // BLL : ni React, ni Redux, ni DAL directe
  {
    files: ['src/bll/**/*.{js,jsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            ...hookPaths,
            ...[
              'react',
              'react-dom',
              'react-redux',
              'redux',
              '@reduxjs/toolkit',
              'react-router-dom',
            ].map((name) => ({ name, message: 'BLL : aucune dépendance UI.' })),
          ],
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
  // WEB : jamais d'accès direct à la DAL (sauf la composition root)
  {
    files: ['src/web/**/*.{js,jsx}'],
    ignores: ['src/web/compositionRoot.js'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: hookPaths,
          patterns: [{ group: ['**/dal/**'], message: 'Web : passez par la BLL.' }],
        },
      ],
    },
  },
  // VUES : ni DAL, ni BLL, ni connect (une vue ne reçoit que des props)
  {
    files: ['src/web/views/**/*.{js,jsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            ...hookPaths,
            {
              name: 'react-redux',
              message: 'Vue : pas de connect, uniquement des props.',
            },
          ],
          patterns: [
            {
              group: ['**/dal/**', '**/bll/**', '**/store/**'],
              message: 'Vue : uniquement des props.',
            },
          ],
        },
      ],
    },
  },
];
