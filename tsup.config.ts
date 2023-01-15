import type { Options } from 'tsup';

const config: Options = {
    clean: true,
    entry: ['src/index.ts'],
    dts: true,
    format: ['esm'],
    outExtension({ format }) {
        return {
            js: `.${format}.js`,
        };
    },
};

export default config;
