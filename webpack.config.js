const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

/**
 * We use webpack in this project to demonstrate how to build the SDK.
 * Other packagers should work too, but have not been tested.
 * This config also transpiles our demo code TypeScript code to ES5.
 */
module.exports = {
  mode: 'development',
  devtool: 'cheap-source-map',
  entry: {
    'npm-sdk': path.resolve(__dirname, 'samples/npm-sdk/npm-sdk.ts'),
    'cloud-player': path.resolve(
      __dirname,
      'samples/cloud-player/cloud-player.ts'
    ),
    videojs: path.resolve(__dirname, 'samples/videojs/videojs.ts'),
    'service-worker': path.resolve(
      __dirname,
      'samples/service-worker/service-worker.ts'
    ),
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    path: __dirname + '/dist',
    filename: '[name].js',
  },
  devServer: {
    compress: false,
    static: [path.resolve(__dirname, 'dist')],
    host: '0.0.0.0',
    allowedHosts: ['.repl.it', '.repl.co', '.repl.run'],
    devMiddleware: {
      index: 'index.html',
    },
  },
  plugins: [
    // Copy our HTML pages to dist/. This project is compiled to expect assets in the same directory.
    new CopyPlugin({
      patterns: [
        { from: 'samples/**/*.html', to: '', flatten: true },
        { from: 'samples/service-worker/amazon-ivs-service-worker-loader.js', to: '', flatten: true }
      ],
    }),
  ],
  module: {
    rules: [
      {
        // This loader compiles the local demo files and not the IVS assets themselves.
        test: /\.ts$/,
        loader: 'babel-loader',
        options: {
          presets: [
            [
              '@babel/preset-env',
              {
                modules: 'auto',
              },
            ],
            ['@babel/preset-typescript'],
          ],
          plugins: ['@babel/plugin-proposal-class-properties'],
        },
      },
      {
        /**
         * Developers packaging the IVS player into an app are required to resolve and import the following assets via URL:
         *
         * 'amazon-ivs-player/dist/assets/amazon-ivs-wasmworker.min.wasm'
         * 'amazon-ivs-player/dist/assets/amazon-ivs-wasmworker.min.js';
         *
         * These assets must not be re-compiled during packaging. Your build tool must import these files as-is, untranspiled.
         * The webpack file-loader (https://webpack.js.org/loaders/file-loader/) accomplishes this.
         * Rollup's plugin-url (https://github.com/rollup/plugins/tree/master/packages/url) also seems to do this, but has not been tested.
         */
        test: /[\/\\]amazon-ivs-player[\/\\].*dist[\/\\]assets[\/\\]/,
        loader: 'file-loader',
        type: 'javascript/auto',
        options: {
          name: '[name].[ext]',
        },
      },
    ],
  },
};
