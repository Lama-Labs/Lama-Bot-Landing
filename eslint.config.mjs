import path from 'node:path'
import { fileURLToPath } from 'node:url'

import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'
import prettier from 'eslint-config-prettier'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default [
    {
        name: 'project/ignores',
        ignores: [
            'dist/**',
            'build/**',
            'node_modules/**',
            '.next/**',
            '**/*.log',
            '**/*.tsbuildinfo',
            '.vscode/**',
            '.idea/**',
            '**/.DS_Store',
            '**/*.suo',
            '**/*.ntvs*',
            '**/*.njsproj',
            '**/*.sln',
            '**/*.sw?',
            'coverage/**',
        ],
    },
    // Next.js recommended rules (flat config in Next 16+)
    ...nextCoreWebVitals,
    ...nextTypescript,
    prettier,
    {
        name: 'project/rules',
        rules: {
            // Keep linting close to the previous setup (pre-ESLint v9 migration).
            '@typescript-eslint/ban-ts-comment': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            'react-hooks/set-state-in-effect': 'off',
            'import/no-anonymous-default-export': 'off',
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    varsIgnorePattern: '^_',
                    argsIgnorePattern: '^_',
                    caughtErrors: 'all',
                    caughtErrorsIgnorePattern: '^_',
                },
            ],
            'import/order': [
                'error',
                {
                    groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
                    'newlines-between': 'always',
                    alphabetize: {
                        order: 'asc',
                        caseInsensitive: true,
                    },
                },
            ],
            'sort-imports': [
                'error',
                {
                    ignoreDeclarationSort: true,
                    ignoreCase: false,
                },
            ],
        },
    },
]


