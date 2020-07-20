import resolve from '@rollup/plugin-node-resolve'

import pkg from './package.json'

export default {
  input: 'module.js',
  output: [
    {
      file: pkg.main,
      format: 'cjs',
      sourcemap: true
    },
    {
      file: pkg.module,
      format: 'es',
      sourcemap: true
    }
  ],
  plugins: [resolve()]
}
