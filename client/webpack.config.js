const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const dotenv = require('dotenv');

// Liste blanche : seules ces variables sont injectées dans le code du navigateur.
const PUBLIC_VARS = [
  'APP_API_URL',
  'APP_SUPABASE_URL',
  'APP_SUPABASE_ANON_KEY',
  'APP_FIREBASE_API_KEY',
  'APP_FIREBASE_AUTH_DOMAIN',
  'APP_FIREBASE_PROJECT_ID',
  'APP_FIREBASE_STORAGE_BUCKET',
  'APP_FIREBASE_MESSAGING_SENDER_ID',
  'APP_FIREBASE_APP_ID',
  'APP_FIREBASE_VAPID_KEY',
];

module.exports = (env, argv) => {
  const mode = argv.mode || 'development';

  // .env.production (ou .env.development) d'abord, puis .env (dotenv n'écrase pas)
  dotenv.config({ path: path.resolve(__dirname, `.env.${mode}`), quiet: true });
  dotenv.config({ path: path.resolve(__dirname, '.env'), quiet: true });

  const definitions = Object.fromEntries(
    PUBLIC_VARS.map((name) => [
      `process.env.${name}`,
      JSON.stringify(process.env[name] || ''),
    ])
  );

  return {
    entry: './src/Main.jsx',

    output: {
      path: path.resolve(__dirname, './dist'),
      filename: 'bundle.[contenthash].js',
      clean: true,
      publicPath: '/',
    },

    plugins: [
      new HtmlWebpackPlugin({ template: './src/index.html' }),
      new webpack.DefinePlugin(definitions),
      // public/ (firebase-messaging-sw.js, favicon...) doit finir à la racine du site
      new CopyPlugin({ patterns: [{ from: 'public', to: '.', noErrorOnMissing: true }] }),
    ],

    resolve: { extensions: ['.jsx', '.js'] },

    module: {
      rules: [
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: { presets: ['@babel/preset-env', '@babel/preset-react'] },
          },
        },
        { test: /\.css$/, use: ['style-loader', 'css-loader'] },
        {
          test: /\.(jpe?g|png|gif|svg)$/i,
          type: 'asset/resource',
          generator: { filename: 'assets/[name][hash][ext]' },
        },
        {
          test: /\.(woff2?|ttf|eot)$/i,
          type: 'asset/resource',
          generator: { filename: 'fonts/[name][hash][ext]' },
        },
      ],
    },

    performance: { hints: mode === 'production' ? 'warning' : false },

    devServer: {
      static: { directory: path.join(__dirname, 'public') },
      historyApiFallback: true,
      compress: true,
      port: 9000,
      host: '127.0.0.1',
    },
  };
};
