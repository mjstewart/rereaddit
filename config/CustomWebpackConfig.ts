import * as webpack from 'webpack';

export interface CustomWebpackConfig extends webpack.Configuration {
  resolve: webpack.NewResolve;
  module: {
    rules: webpack.NewUseRule[];
  };
}
