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

// Force every `tslib` import to its CommonJS build. Apollo Client v4's compiled
// code does `tslib.default.__extends`, which is undefined when tslib resolves to
// its ESM build under Metro web — this override fixes the crash.
const tslibCjs = require.resolve('tslib/tslib.js');
const upstreamResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'tslib') {
    return { type: 'sourceFile', filePath: tslibCjs };
  }
  return (upstreamResolveRequest ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './app/global.css' })
