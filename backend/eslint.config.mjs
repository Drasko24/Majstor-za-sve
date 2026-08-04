import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist'] },

  // Config fajlovi - obican JS, bez type-aware provjere.
  {
    extends: [js.configs.recommended],
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node,
    },
  },

  // Aplikativni kod + seed skripta. Node okruzenje, bez DOM globala.
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
    ],
    files: ['**/*.ts'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node,
      parserOptions: {
        // Zaseban tsconfig jer prisma/seed.ts nije u tsconfig.json
        // (rootDir je ./src, pa ga tamo ne mozemo dodati).
        project: ['./tsconfig.eslint.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Fastify hook-ovi (preHandler i sl.) primaju async funkcije i sami ih
      // await-uju, ali im tip u uniji ima i varijantu koja vraca void, pa pravilo
      // lazno prijavljuje svaki `preHandler: requireAuth(...)`. Gasimo samo provjeru
      // nad propertijima - ostale provjere (argumenti, povratne vrijednosti) ostaju.
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { properties: false } },
      ],
      // U Fastify-u je `async` dio ugovora plugina i handlera (avvio ceka Promise),
      // pa async funkcija bez await-a nije mrtav kod nego namjeran potpis.
      '@typescript-eslint/require-await': 'off',
    },
  },

  // Testovi tvrde nad JSON odgovorima, a res.json() je po prirodi `any`.
  // Tipiziranje svakog odgovora bi bilo duplo odrzavanje bez dobitka -
  // same tvrdnje su provjera. Ostala type-aware pravila i dalje vaze.
  {
    files: ['tests/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
    },
  },
)
