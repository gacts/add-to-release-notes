// See: https://rollupjs.org/introduction/

import commonjs from '@rollup/plugin-commonjs'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import terser from '@rollup/plugin-terser'

const config = {
  input: 'src/main.js',
  output: {
    esModule: true,
    file: 'dist/index.js',
    format: 'es',
    sourcemap: false,
    compact: true,
    minifyInternalExports: true,
  },
  plugins: [commonjs(), nodeResolve({ preferBuiltins: true }), terser()],
}

export default config
