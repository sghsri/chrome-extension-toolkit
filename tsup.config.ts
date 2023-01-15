import type { Options } from 'tsup';

const config: Options = {
    clean: true,
    entry: ['src/index.ts'],
    dts: true,
};

export default config;
