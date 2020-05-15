const merge = require('webpack-merge');
const {config, define } = require('./webpack.common.js');
const webpack = require('webpack');

module.exports = merge(config, {
  mode: 'production',
  plugins: [
    new webpack.DefinePlugin({
        ...define,
        'CROS_SERVER': JSON.stringify("https://corrner-node.herokuapp.com/"),
    })
  ]
});