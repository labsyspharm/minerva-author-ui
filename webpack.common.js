require('@babel/register');
const webpack = require("webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin')

const webpackConfig = {
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-react", "@babel/preset-env"]
          }
        }
      }, {
        test: /\.css$/,
        use: ["style-loader", "css-loader"]
      }
    ]
  },
  resolve: {
    extensions: [".css", ".js", ".jsx"],
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [{
        from: "static/image",
        to: "./image"
      }]
    }),
    new HtmlWebpackPlugin({
      template: './static/index.html',
      publicPath: '/'
    })
  ]
};

module.exports = webpackConfig
