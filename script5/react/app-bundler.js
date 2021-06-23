const Webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const webpackConfig = require('../webpack/app.config');
const PORT = 3808;

const compiler = Webpack({
  ...webpackConfig,
});
const server = new WebpackDevServer(compiler, webpackConfig.devServer);

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Starting webpack-dev-server on http://localhost:${PORT}`);
});
