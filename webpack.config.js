const path = require("path");
const webpack = require("webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin')


var webpackConfig = {
  entry: [
    "babel-polyfill",
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
          presets: ["react", "env", "stage-0"]
        }
      }, {
        test: /\.css$/,
        loader: "style-loader!css-loader"
      },
			{
				test: /\.(ttf|svg|eot|woff)/,
				loader: 'file-loader'
      },
      {
        test: /\.s[a|c]ss$/,
        loader: 'sass-loader!style-loader!css-loader'
     },
     {
        test: /\.(jpg|png|gif|jpeg|woff|woff2|eot|ttf|svg)$/,
       loader: 'url-loader?limit=100000'
      }
    ]
  },
  resolve: {
    extensions: [".css", ".js", ".jsx"],
     //alias: {
       // Fake jquery needed for slider
    //   "jquery": path.join(__dirname, "./src/jquery-stub.js")
    // }
  },
  output: {
    path: path.join(__dirname, "/docs"),
    publicPath: "/",
    filename: "bundle.[hash].js"
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.EnvironmentPlugin({
      'MINERVA_AUTHOR_ENV': 'local'
    }),
    new CopyWebpackPlugin([{
        from: "static",
        to: "."
    }]),
    new HtmlWebpackPlugin({
      template: './static/index.html',
      publicPath: '/',
    })
  ],
  devServer: {
    contentBase: "./docs",
    hot: true,
    proxy: {
      "/dev/**": {
        "target": "https://nldzj7hd69.execute-api.us-east-1.amazonaws.com",
        "changeOrigin": true
      }
    }
  }
};

module.exports = (env, argv) => {
  if (argv.mode === 'production') {
    console.log('Production mode');
    delete webpackConfig.devServer;
    webpackConfig.entry = ['./src/demo.jsx'];
  }

  return webpackConfig;
};
