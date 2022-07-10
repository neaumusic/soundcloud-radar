const path = require('path');

const packageJson = require('./package.json');
const CleanWebpackPlugin = require('clean-webpack-plugin').CleanWebpackPlugin;
const CopyWebpackPlugin = require('copy-webpack-plugin');
const RemoveFilesWebpackPlugin = require('remove-files-webpack-plugin');

const DIST = `dist`;
const CHROME_MANIFEST_ENTRY = `./src/manifest.json`;

const manifest = ({ entry }) => ({
  entry: entry,
  output: {
    path: path.resolve(__dirname, DIST),
    filename: 'DELETED.js',
  },
  plugins: [
    new CleanWebpackPlugin(),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: entry,
          transform: function(manifestBuffer, path) {
            const manifestString = manifestBuffer.toString()
              .replace(/\$\{PACKAGE_VERSION\}/g, packageJson.version)
              .replace(/\$\{PACKAGE_DESCRIPTION\}/g, packageJson.description)
            return Buffer.from(manifestString);
          },
        },
      ],
    }),
    new RemoveFilesWebpackPlugin({
      after: {
        log: false,
        include: [
          `${DIST}/DELETED.js`,
        ],
      },
    }),
  ],
  stats: true,
  mode: 'none',
});

const main = () => ({
  entry: './src/main.js',
  output: {
    path: path.resolve(__dirname, DIST),
    filename: 'main.js',
  },
  module: {
    rules: [
      {
        test: /\.js$/i,
        use: [
          {loader: 'babel-loader'},
        ],
      },
    ],
  },
  stats: true,
  mode: 'none',
});

module.exports = [
  manifest({ entry: CHROME_MANIFEST_ENTRY }),
  main(),
];
