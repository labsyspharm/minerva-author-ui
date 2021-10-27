const { merge } = require('webpack-merge');
const webpackConfig = require('./webpack.common.js');

const PORT = 2021

module.exports = merge(webpackConfig, {
  mode: 'development',
  devServer: {
    static: "./build",
    port: PORT,
    hot: true
  },
  entry: [
    "babel-polyfill",
    "./src/demo.jsx",
    "react-hot-loader/patch",
    "webpack/hot/only-dev-server",
    `webpack-dev-server/client?http://localhost:${PORT}`
  ]
});
