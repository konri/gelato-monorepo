// metro.config.js
const { getDefaultConfig } = require('@expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

/** @type {import('@expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add support for SVGs
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
};

config.resolver = {
  ...config.resolver,
  assetExts: config.resolver.assetExts.filter((ext) => ext !== 'svg'),
  sourceExts: [...config.resolver.sourceExts, 'svg', 'mjs'],
  alias: {
    '@repo/api-client': './shared/api-client',
    '@repo/types': './shared/types',
  },
};

module.exports = withNativeWind(config, { input: './app/global.css' })
