
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const dotenv = require('dotenv');

// Liste blanche des variables accessibles dans le navigateur.
// Ne jamais y ajouter de clé secrète côté serveur.
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
  const isProduction = mode === 'production';

  // Charger d'abord le fichier correspondant au mode,
  // puis .env sans écraser les variables déjà définies.
  dotenv.config({
    path: path.resolve(__dirname, `.env.${mode}`),
    quiet: true,
  });

  dotenv.config({
    path: path.resolve(__dirname, '.env'),
    quiet: true,
  });

  const definitions = Object.fromEntries(
    PUBLIC_VARS.map((name) => [
      `process.env.${name}`,
      JSON.stringify(process.env[name] || ''),
    ])
  );

  const plugins = [
    new HtmlWebpackPlugin({
      template: './src/index.html',
    }),

    new webpack.DefinePlugin(definitions),

    // Copie firebase-messaging-sw.js et les autres fichiers publics.
    new CopyPlugin({
      patterns: [
        {
          from: 'public',
          to: '.',
          noErrorOnMissing: true,
        },
      ],
    }),
  ];

  // Extraire le CSS en production plutôt que de l'injecter
  // dans la page avec style-loader.
  if (isProduction) {
    plugins.push(
      new MiniCssExtractPlugin({
        filename: 'styles.[contenthash].css',
        chunkFilename: 'chunks/styles.[contenthash].css',
      })
    );
  }

  return {
    mode,
    entry: './src/Main.jsx',

    output: {
      path: path.resolve(__dirname, './dist'),
      filename: 'bundle.[contenthash].js',
      chunkFilename: 'chunks/[name].[contenthash].js',
      clean: true,
      publicPath: '/',
    },

    plugins,

    resolve: {
      extensions: ['.jsx', '.js'],
    },

    module: {
      rules: [
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                '@babel/preset-env',
                '@babel/preset-react',
              ],
            },
          },
        },

        {
          test: /\.css$/i,
          use: [
            isProduction
              ? MiniCssExtractPlugin.loader
              : 'style-loader',
            'css-loader',
          ],
        },

        {
          test: /\.(jpe?g|png|gif|svg)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'assets/[name].[contenthash][ext]',
          },
        },

        {
          test: /\.(woff2?|ttf|eot)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'fonts/[name].[contenthash][ext]',
          },
        },
      ],
    },

    optimization: {
      // Sépare le runtime de Webpack pour favoriser le cache.
      runtimeChunk: 'single',

      // Partage les dépendances entre les bundles.
      splitChunks: {
        chunks: 'all',
      },
    },

    performance: {
      hints: isProduction ? 'warning' : false,
    },

    devServer: {
      static: {
        directory: path.join(__dirname, 'public'),
      },
      historyApiFallback: true,
      compress: true,
      port: 9000,
      host: '127.0.0.1',
    },
  };
};
