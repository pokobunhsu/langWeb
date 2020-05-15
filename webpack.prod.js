const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const webpack = require('webpack');

module.exports = merge(common, {
  mode: 'production',
  plugins: [
    new webpack.DefinePlugin({
        'CROS_SERVER': JSON.stringify("https://corrner-node.herokuapp.com/"),
    })
  ]
});