const { createConfig } = require('@codecademy/webpack-config');
const LoadablePlugin = require('@loadable/webpack-plugin');
const { jsdir, dir, DEV } = require('./helpers');

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
        crossOriginLoading: 'anonymous',
        filename: DEV ? '[name].js' : '[name].[contenthash].js',
        path: dir('/public/webpack'),
        publicPath: '/webpack/',
        chunkFilename: DEV
          ? '[name].chunk.js'
          : '[name].[contenthash].chunk.js',
      },
      stats: {
        all: false,
        errors: true,
        warnings: true,
        errorDetails: true,
        warningsFilter: /mini-css-extract-plugin[^]*Conflicting order between:/,
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
      plugins: [
        new LoadablePlugin({
          filename: 'loadable-stats.json',
        }),
      ],
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
