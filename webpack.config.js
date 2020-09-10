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
        basic: path.resolve(__dirname, 'src/basic.ts'),
        videojs: path.resolve(__dirname, 'src/videojs-tech.ts'),
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    output: {
        path: __dirname +  '/dist',
        filename: '[name].js'
    },
    devServer: {
        disableHostCheck: true,
        compress: false,
        contentBase: [
            path.resolve(__dirname, 'dist')
        ],
        index: 'index.html',
    },
    plugins: [
        // Copy our HTML pages to dist/. This project is compiled to expect assets in the same directory.
        new CopyPlugin({
            patterns: [
                { from: 'pages', to: '' },
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
                        ['@babel/preset-env', {
                            loose: true,
                            modules: 'auto',
                        }],
                        [
                            '@babel/preset-typescript',
                        ],
                    ],
                    plugins: [
                        "@babel/plugin-proposal-class-properties",
                    ]
                }
            },
            {
                /**
                 * Developers packaging the IVS player into an app are required to resolve and import the following assets via URL:
                 *
                 * 'amazon-ivs-player/dist/assets/amazon-ivs-wasmworker.min.wasm'
                 * 'amazon-ivs-player/dist/assets/amazon-ivs-wasmworker.min.js';
                 * 'amazon-ivs-player/dist/assets/amazon-ivs-worker.min.js';
                 *
                 * These assets must not be re-compiled during packaging.
                 * The webpack file-loader (https://webpack.js.org/loaders/file-loader/) accomplishes this.
                 * Rollup's plugin-url (https://github.com/rollup/plugins/tree/master/packages/url) also seems to do this, but has not been tested.
                 */
                test: /[\/\\]amazon-ivs-player[\/\\].*dist[\/\\]assets[\/\\]/,
                loader: 'file-loader',
                type: 'javascript/auto',
                options: {
                    name: '[name].[ext]'
                }
            },
        ]
    },
};

