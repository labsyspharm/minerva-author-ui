const path = require("path");
const webpack = require("webpack");
const Dotenv = require('dotenv-webpack');
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: [
    "./src/demo.jsx",
    "react-hot-loader/patch",
    "webpack/hot/only-dev-server",
    "webpack-dev-server/client?http://0.0.0.0:8487"
  ],
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: "babel-loader",
        query: {
          presets: ["react", "env"]
        }
      }, {
        test: /\.css$/,
        loader: "style-loader!css-loader"
      },
			{
				test: /\.(ttf|svg|eot|woff)/,
				loader: 'file-loader'
			},
    ]
  },
  resolve: {
    extensions: [".css", ".js", ".jsx"],
    alias: {
      // Fake jquery needed for slider
      "jquery": path.join(__dirname, "./src/jquery-stub.js")
    }
  },
  output: {
    path: path.join(__dirname, "/docs"),
    publicPath: "/",
    filename: "bundle.js"
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new CopyWebpackPlugin([{
        from: "static",
        to: "."
    }]),
  	new Dotenv()
  ],
  devServer: {
    contentBase: "./docs",
    hot: true
  }
};
