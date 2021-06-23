const { createConfig } = require('@codecademy/webpack-config');
const {
  jsdir,
  dir,
  DEV,
  WEBPACK_CACHE_VERSION,
  PUBLIC_PATH,
} = require('./helpers');

/**
 * Base Webpack Build Config
 *
 * Absolute minimum config for our webpack builds
 *
 * This is the config that all others are based on
 */

const getBaseConfig = (commonOptions) =>
  createConfig()
    .common({
      context: dir(),
      ...commonOptions,
    })
    .babel()
    .merge({
      output: {
        publicPath: PUBLIC_PATH,
        path: dir('/public/webpack'),
        crossOriginLoading: 'anonymous',
        filename: DEV ? 'static/[name].js' : 'static/[name].[contenthash:8].js',
        path: dir('/public/webpack'),
        publicPath: '/webpack/',
        chunkFilename: DEV
          ? 'static/[name].chunk.js'
          : 'static/[name].[contenthash:8].chunk.js',
        assetModuleFilename: DEV
          ? 'static/[name].[hash][ext][query]'
          : 'static/[hash][ext][query]',
      },
      stats: {
        all: false,
        errors: true,
        warnings: true,
        errorDetails: true,
        warningsFilter: /mini-css-extract-plugin[^]*Conflicting order between:/,
      },
      cache: {
        version: WEBPACK_CACHE_VERSION,
      },
      module: {
        noParse: [/braintree-web/, /htmlhint/, /dist\/xterm/],
      },
      resolve: {
        modules: [jsdir()],
        alias: {
          '~': jsdir(),
        },
      },
      performance: {
        hints: false,
      },
    })
    .if(DEV, (config) =>
      config.merge({
        resolve: {
          symlinks: false,
        },
      })
    )
    .toConfig();

module.exports = getBaseConfig;
