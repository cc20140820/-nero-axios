import commonjs from '@rollup/plugin-commonjs'
import typescript from '@rollup/plugin-typescript'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import { babel } from '@rollup/plugin-babel'
import postcss from 'rollup-plugin-postcss'

export default async () => {
  return [
    {
      input: './src/index.ts',
      output: {
        file: './lib/index.js',
        format: 'cjs',
        exports: 'named'
      },
      plugins: [
        postcss(),
        commonjs({
          ignoreDynamicRequires: true
        }),
        typescript({ tsconfig: './tsconfig.json' }),
        babel({
          extensions: ['.ts'],
          babelHelpers: 'runtime',
          presets: ['@babel/preset-env', '@babel/preset-typescript'],
          plugins: ['@babel/plugin-transform-runtime']
        }),
        nodeResolve({ preferBuiltins: true, extensions: ['.ts'] })
      ],
      external: ['axios', 'qs', 'notyf']
    }
  ]
}
