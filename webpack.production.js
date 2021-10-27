const path = require("path");
const { merge } = require('webpack-merge');
const webpackConfig = require('./webpack.common.js');

module.exports = merge(webpackConfig, {
  mode: 'production',
  entry: [
    "./src/demo.jsx",
  ],
  output: {
    path: path.join(__dirname, "/build"),
    filename: "bundle.[contenthash].js",
    publicPath: "/"
  }
});
