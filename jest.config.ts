export default {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    testMatch: ['**/test/**/*.test.ts'],
    collectCoverageFrom: ['<rootDir>/src/**/*.ts', '!<rootDir>/src/types/**/*.ts'],
    collectCoverage: true,
    coverageReporters: ['text', 'lcov', 'json-summary'],
    setupFilesAfterEnv: ['./test/jest.setup.ts'],
    moduleNameMapper: {
        '^src/(.*)': '<rootDir>/src/$1',
        '^test/(.*)': '<rootDir>/test/$1',
    },
    globals: {
        'ts-jest': {
            diagnostics: false,
            isolatedModules: true,
        },
    },
};
