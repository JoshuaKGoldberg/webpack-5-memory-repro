const { createConfig } = require('@codecademy/webpack-config');
const LoadablePlugin = require('@loadable/webpack-plugin');
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
  PUBLIC_PATH,
  STATS,
  USE_INLINE_STYLES,
} = require('./helpers');
const getBaseConfig = require('./base.config');

const PROD = !DEV;

/**
 * App Webpack Build Config
 *
 * Config for the main client application for codecademy
 *
 *
 *
 * This is the config that the production and dev builds are based on
 */

const bundleFiles = glob.sync(jsdir('bundles/app/*.ts'));
const appVendor = jsdir('bundles/app-vendor.ts');

const bundles = {};
bundleFiles.forEach((bndl) => {
  const basename = path.basename(bndl, '.ts');
  bundles[basename] = [appVendor, bndl];
  if (DEV_SERVER_ENABLED) {
    bundles[basename].push('webpack/hot/only-dev-server');
  }
});

const appConfig = createConfig(getBaseConfig())
  .merge({
    name: 'app',
    entry: bundles,
    optimization: {
      runtimeChunk: 'single',
      splitChunks: {
        chunks: 'all',
        maxInitialRequests: Infinity,
        maxAsyncRequests: Infinity,
        minSize: 0,
      },
      removeAvailableModules: false,
    },
    cache: {
      type: 'filesystem',
      name: 'AppBuildCache',
      buildDependencies: {
        // This makes all dependencies of this file - build dependencies
        config: [__filename],
      },
    },
    resolve: {
      alias: {
        path: 'path-browserify',
        buffer: 'buffer',
      },
    },
    plugins: [
      new LoadablePlugin({
        outputAsset: false,
      }),
      new webpack.ProvidePlugin({ Buffer: ['buffer', 'Buffer'] }),
      new MonacoWebpackPlugin({
        filename: DEV
          ? 'static/[name].worker.js'
          : 'static/[name].[contenthash:8].worker.js',
      }),
      new webpack.DefinePlugin({
        __SSR__: false,
      }),
      new StatsWriterPlugin({
        /**
         * manifest.json is a generic webpack stats file
         * it is expensive to generate, so we should only make one if possible
         * loadable requires a lot more data than we need in our webpack/rails integration,
         * so we're using their config for both. If we ever get rid of loadable,
         * the data we need for webpack/rails is easy to find in lib/webpack/rails/manifest.rb
         * limiting it to that data would speed up builds
         */
        filename: 'manifest.json',
        stats: {
          assets: true,
          assetsByChunkName: true,
          chunkGroups: true,
          chunks: true,
          entrypoints: true,
          errorDetails: false,
          hash: true,
          modules: false,
          publicPath: true,
          source: false,
          timings: false,
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
      filename: PROD
        ? 'static/[name].[contenthash:8].css'
        : 'static/[name].css',
      chunkFilename: PROD
        ? 'static/[id].[contenthash:8].chunk.css'
        : 'static/[id].chunk.css',
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
          new webpack.HotModuleReplacementPlugin(),
          new ReactRefreshWebpackPlugin({
            overlay: false,
          }),
        ],
      })
      .devServer({
        port: DEV_SERVER_PORT,
        publicPath: PUBLIC_PATH,
        host: process.env.WEBPACK_ADDRESS || 'localhost',
        transportMode: 'ws',
        writeToDisk: (filePath) => {
          return /manifest\.json$/.test(filePath);
        },
        clientLogLevel: 'none',
        compress: true,
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
