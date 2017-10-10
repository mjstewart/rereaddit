import { CustomWebpackConfig } from './CustomWebpackConfig';

import * as HtmlWebpackPlugin from 'html-webpack-plugin';
import * as ExtractTextPlugin from 'extract-text-webpack-plugin';
import * as CleanWebpackPlugin from 'clean-webpack-plugin';
import * as CopyWebpackPlugin from 'copy-webpack-plugin';
import * as webpack from 'webpack';
import * as path from 'path';
import * as paths from './paths';
import * as rules from './rules';

const config: CustomWebpackConfig = {
  context: paths.SRC,
  // devtool: 'cheap-module-eval-source-map',
  devtool: 'source-map',
  entry: {
    options: path.join(paths.JS, 'options.ts'),
    popup: path.join(paths.VIEWS, 'popup/index.tsx'),
    background: path.join(paths.JS, 'background.ts'),
    comments: path.join(paths.JS, 'content-scripts', 'comments.ts'),
    subreddit: path.join(paths.JS, 'content-scripts', 'subreddit.ts'),
  },
  output: {
    filename: '[name].js',
    path: paths.DIST,
    publicPath: '/',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json', '.scss', '.css'],
    alias: {
      '@src': paths.SRC,
      '@js': paths.JS,
      '@views': paths.VIEWS,
      styles: paths.STYLES, // @ is missing as it messes with sass import syntax.
    },
  },
  module: {
    rules: [
      rules.typescript,
      // rules.tslint,
      rules.jsSourceMap,
      rules.html,
      rules.url,
      rules.sass,
      rules.css,
    ],
  },
  plugins: [
    new CleanWebpackPlugin([paths.DIST], {
      root: paths.PROJECT_ROOT,
      verbose: true,
    }),
    new CopyWebpackPlugin([
      { from: path.join(paths.SRC, 'manifest.json'), to: paths.DIST },
    ]),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('development'),
      },
      LOGGING: JSON.stringify(true),
    }),
    new HtmlWebpackPlugin({
      template: path.join(paths.VIEWS, 'options.html'),
      filename: 'options.html',
      chunks: ['options'], // This says to only include the options.js script tag in options.html.
    }),
    new HtmlWebpackPlugin({
      template: path.join(paths.VIEWS, 'popup/popup.html'),
      filename: 'popup.html',
      chunks: ['popup'],
    }),
    new ExtractTextPlugin({
      filename: '[name].css',
      allChunks: true,
    }),
  ],
  devServer: {
    contentBase: paths.DIST,
    historyApiFallback: true,
    compress: true,
    port: 9000,
  },
};

export default config;

