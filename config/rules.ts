import { NewUseRule } from 'webpack';
import * as ExtractTextPlugin from 'extract-text-webpack-plugin';

export const babel: NewUseRule = {
  test: /\.js$/,
  exclude: /node_modules/,
  use: 'babel-loader',
};

export const jsSourceMap: NewUseRule = {
  enforce: 'pre',
  test: /\.js$/,
  use: 'source-map-loader',
  exclude: /node_modules/,
};

export const typescript: NewUseRule = {
  test: /\.tsx?$/,
  use: 'awesome-typescript-loader',
  exclude: /node_modules/,
};

export const tslint: NewUseRule = {
  enforce: 'pre',
  test: /\.tsx?$/,
  use: {
    loader: 'tslint-loader',
    options: {
      emitErrors: true,
      failOnHint: true,
    },
  },
  exclude: /node_modules/,
};

/*
 * https://github.com/webpack-contrib/url-loader
 * If image size is under byte limit 10000, it just gets inlined directly into the html document.
 */
export const url: NewUseRule = {
  test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
  use: {
    loader: 'url-loader',
    options: {
      limit: 10000,
      // outputPath: './img/', // Where webpack will save image in dist folder
      // publicPath: './img/', // https://github.com/webpack-contrib/html-loader
      name: 'img-[hash:6].[name].[ext]',
    },
  },
};

/* 
 * https://github.com/webpack-contrib/html-loader
 * Works with HtmlWebpackPlugin to inject stuff into the html file like scripts etc.
 */
export const html: NewUseRule = {
  test: /\.html$/,
  use: 'html-loader',
  exclude: /node_modules/,
};

/**
 * Mainly for use with semantic ui react.
 * include node_modules is the secret sauce
 * https://github.com/Semantic-Org/Semantic-UI-CSS/issues/28#issuecomment-328734671
 * 
 */
export const css: NewUseRule = {
  test: /\.css$/,
  include: /node_modules/,
  use: ExtractTextPlugin.extract({
    fallback: 'style-loader',
    use: [
      {
        loader: 'css-loader',
        options: {
          sourceMap: true,
          importLoaders: 1,
          modules: false,
          localIdentName: '[path]___[name]__[local]___[hash:base64:5]',
          minimize: false,
          camelCase: true,
        },
      },
      {
        loader: 'postcss-loader',
        options: {
          sourceMap: true,
        },
      },
    ],
  }),
};

/*
 * ExtractTextPlugin moves all the required *.css modules in entry chunks into a separate
 * CSS file. So your styles are no longer inlined within the html head section, they are put inti
 * a separate CSS file (styles.css). The fallback is style-loader which does the html head styles.
 *
 * However, inlining them into the html head section saves on 1 http request
 * and eliminates the flash of unstyled content issue.
 *
 * Note how ExtractTextPlugin.extract is used, but within webpack config the
 * ExtractTextPlugin does the work of extracting all chunks and putting them
 * into 1 file called [filename].
 *
 * All sourceMaps need to be set to true to ensure each loader processing phase keeps the sourceMap on
 * https://github.com/postcss/postcss-loader
 */
export const sass: NewUseRule = {
  test: /\.scss$/,
  exclude: /node_modules/,
  use: ExtractTextPlugin.extract({
    fallback: 'style-loader',
    use: [
      {
        loader: 'css-loader',
        options: {
          sourceMap: true,
          importLoaders: 2,
          modules: false,
          localIdentName: '[path]___[name]__[local]___[hash:base64:5]',
          minimize: false,
          camelCase: true,
        },
      },
      {
        loader: 'postcss-loader',
        options: {
          sourceMap: true,
        },
      },
      {
        loader: 'sass-loader',
        options: {
          sourceMap: true,
        },
      },
    ],
  }),
};
