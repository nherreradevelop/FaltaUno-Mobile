// Configuración de ESLint del repositorio mobile.
// Se ejecuta desde la raíz: npm run lint
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  // Carpetas que no se revisan
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/coverage/**', '.expo/**', 'android/**', 'ios/**'],
  },

  // Reglas base para todo el código JavaScript y TypeScript
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },

  // App móvil (React Native con Expo)
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: { globals: { ...globals.browser, __DEV__: 'readonly' } },
    plugins: { 'react-hooks': reactHooks },
    rules: { ...reactHooks.configs.recommended.rules },
  },

  // Archivos de configuración que corren en Node.js (babel.config.js, metro.config.js, etc.)
  {
    files: ['**/*.config.{js,cjs,mjs,ts}', '**/*.cjs'],
    languageOptions: { globals: { ...globals.node } },
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
);
