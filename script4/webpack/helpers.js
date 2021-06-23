const { partial } = require('lodash');
const path = require('path');
const fs = require('fs');

const rootPath = path.resolve(__dirname, '../../');
const dir = partial(path.join, rootPath);
const jsdir = partial(path.join, dir('.'));
const modulesdir = partial(path.join, fs.realpathSync(dir('node_modules')));

const DEV_SERVER_ENABLED = process.env.DEV_SERVER;
const DEV_SERVER_PORT = 3808;
const DEV = process.env.NODE_ENV !== 'production';
const ENV = DEV ? 'development' : 'production';

/**
 * USE_INLINE_STYLES: modifies config to better support CSS hot reloading in development
 */
const USE_INLINE_STYLES = DEV_SERVER_ENABLED && process.env.USE_INLINE_STYLES;

module.exports = {
  rootPath,
  dir,
  jsdir,
  modulesdir,
  DEV_SERVER_PORT,
  DEV_SERVER_ENABLED,
  USE_INLINE_STYLES,
  DEV,
  ENV,
};
