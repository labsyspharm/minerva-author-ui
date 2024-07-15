const path = require('path')
const webpack = require('webpack')

function resolve (dir) {
  return path.join(__dirname, '.', dir)
}

module.exports = {
  entry: './src/core.js',
  output: {
    path: resolve('./dist'),
    publicPath: 'dist/',
    filename: 'foobar-ipsum.js',
    libraryTarget: 'umd',
    library: 'foobarIpsum',
    umdNamedDefine: true
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            babelrc: false,
            presets: ['env'],
            plugins: ['add-module-exports']
          }
        }
      }
    ]
  }
}

if (process.env.NODE_ENV === 'production') {
  module.exports.output.filename = 'foobar-ipsum.min.js'
  module.exports.plugins = (module.exports.plugins || []).concat([
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"production"'
      }
    }),
    new webpack.optimize.UglifyJsPlugin({
      sourceMap: true,
      compress: {
        warnings: false
      }
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true
    })
  ])
}
