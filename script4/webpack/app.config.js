const { createConfig } = require('@codecademy/webpack-config');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const glob = require('glob');
const path = require('path');
const webpack = require('webpack');
const { StatsWriterPlugin } = require('webpack-stats-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const { DuplicatesPlugin } = require('inspectpack/plugin');

const {
  jsdir,
  dir,
  DEV,
  DEV_SERVER_ENABLED,
  DEV_SERVER_PORT,
  USE_INLINE_STYLES,
} = require('./helpers');
const getBaseConfig = require('./base.config');

const PROD = !DEV;
const STATS = Boolean(process.env.WEBPACK_STATS);

/**
 * App Webpack Build Config
 *
 * Config for the main client application for codecademy
 *
 *
 *
 * This is the config that the production and dev builds are based on
 */

const bundleFiles = glob.sync('bundles/app/*.ts');
const appVendor = 'bundles/app-vendor.ts';

const bundles = {};
bundleFiles.forEach((bndl) => {
  const basename = path.basename(bndl, '.ts');
  bundles[basename] = [appVendor, bndl];
});

const appConfig = createConfig(
  getBaseConfig({
    fileLoaderOptions: {
      name: DEV ? '[path][name].[ext]' : '[contenthash].[ext]',
    },
  })
)
  .merge({
    entry: bundles,
    optimization: {
      runtimeChunk: true,
      splitChunks: {
        chunks: 'all',
        maxAsyncRequests: Infinity,
        maxInitialRequests: Infinity,
        minSize: 0,
        // disable chunk naming on production
        name: DEV || STATS,
      },
    },
    plugins: [
      new MonacoWebpackPlugin(),
      new webpack.DefinePlugin({
        __SSR__: false,
      }),
      new StatsWriterPlugin({
        filename: 'manifest.json',
        stats: {
          all: false,
          hash: true,
          publicPath: true,
          chunkGroups: true,
          entrypoints: true,
          assetsByChunkName: true,
        },
      }),
    ],
  })
  // Store module records alongside files to preserve ids across builds
  .if(PROD, (config) =>
    config.merge({
      recordsPath: dir('public/webpack/records.json'),
    })
  )
  /**
   * -- START INLINE/EXTRACT STYLES CONFIG
   * Running `yarn start --inlineStyles` will switch from extracted stylesheets to inline-injected styles via style-loader
   * this produces much faster and more consistent hot-reloading results for styles, but is less accurate compared to production
   */
  .if(!USE_INLINE_STYLES, (config) =>
    config.cssExtracted({
      filename: PROD ? '[name].[contenthash].css' : '[name].css',
      chunkFilename: PROD ? '[id].[contenthash].chunk.css' : '[id].chunk.css',
    })
  )
  .if(USE_INLINE_STYLES, (config) => config.css())
  /**
   * -- END INLINE/EXTRACT STYLES CONFIG
   */
  .if(STATS, (config) =>
    // Output all stats when analyzing bundles
    config.merge({
      stats: {
        all: true,
      },
      plugins: [
        // Leaving this behind the stats flag for now b/c it throws a lot of warnings due to our CSS setup
        // If this doesn't work with webpack 5 it can be removed
        // https://github.com/FormidableLabs/inspectpack/issues/147
        new DuplicatesPlugin({
          emitErrors: false,
          verbose: true,
        }),
      ],
    })
  )
  .if(DEV_SERVER_ENABLED, (config) =>
    config
      .merge({
        plugins: [
          new ReactRefreshWebpackPlugin({
            overlay: false,
          }),
        ],
      })
      .devServer({
        port: DEV_SERVER_PORT,
        publicPath: `http://${
          process.env.WEBPACK_ADDRESS || 'localhost'
        }:${DEV_SERVER_PORT}/webpack/`,
        host: process.env.WEBPACK_ADDRESS || 'localhost',
        writeToDisk: (filePath) => {
          return /(loadable-stats|manifest)\.json$/.test(filePath);
        },
        stats: {
          all: false,
          errors: true,
          warnings: true,
          colors: true,
        },
        overlay: {
          warnings: true,
          errors: true,
        },
        disableHostCheck: true,
        watchOptions: {
          aggregateTimeout: 300,
          poll: 1000,
        },
      })
  );

module.exports = appConfig.toConfig();
