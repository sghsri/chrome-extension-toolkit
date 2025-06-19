export default {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    testMatch: ['**/test/**/*.test.ts', '**/test/**/*.test.tsx'],
    collectCoverageFrom: ['<rootDir>/src/**/*.ts', '<rootDir>/src/**/*.tsx', '!<rootDir>/src/types/**/*.ts'],
    collectCoverage: true,
    coverageReporters: ['text', 'lcov', 'json-summary'],
    setupFilesAfterEnv: ['./test/jest.setup.ts'],
    moduleNameMapper: {
        '^src/(.*)': '<rootDir>/src/$1',
        '^test/(.*)': '<rootDir>/test/$1',
    },
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest',
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
    globals: {
        'ts-jest': {
            tsconfig: {
                jsx: 'react-jsx',
            },
        },
    },
};
