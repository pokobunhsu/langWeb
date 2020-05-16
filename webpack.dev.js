const merge = require('webpack-merge');
const {config, define } = require('./webpack.common.js');
const webpack = require('webpack');

module.exports = merge(config, {
  mode: 'development',
  devtool: 'inline-source-map',
  plugins: [
    new webpack.DefinePlugin({
        ...define,
        'CROS_SERVER': JSON.stringify("http://localhost:5555/"),
    })
  ]
});