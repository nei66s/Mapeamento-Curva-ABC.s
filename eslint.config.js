module.exports = {
  // Apply to all JS/TS files in the project
  files: ['**/*.{js,jsx,ts,tsx}'],
  extends: [
    'next/core-web-vitals',
    'next/typescript'
  ],
  settings: {
    react: {
      version: 'detect'
    }
  },
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      parserOptions: {
        project: './tsconfig.json'
      }
    }
  ]
};
