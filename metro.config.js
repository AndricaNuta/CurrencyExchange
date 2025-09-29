// metro.config.js
const path = require('path');
const {
  getDefaultConfig, mergeConfig
} = require('@react-native/metro-config');

module.exports = (async () => {
  const defaultConfig = await getDefaultConfig(__dirname);
  const {
    assetExts, sourceExts
  } = defaultConfig.resolver;

  return mergeConfig(defaultConfig, {
    transformer: {
      // make SVGs work
      babelTransformerPath: require.resolve('react-native-svg-transformer'),
      // <-- this line fixes "missing-asset-registry-path"
      assetRegistryPath: require.resolve('react-native/Libraries/Image/AssetRegistry'),
    },
    resolver: {
      // keep all the default asset types, just remove svg from the asset list
      assetExts: assetExts.filter(ext => ext !== 'svg'),
      sourceExts: [...sourceExts, 'svg'],

      // If you chose to SHIM FlashList instead of installing it, keep this.
      // Otherwise delete extraNodeModules entirely.
      // extraNodeModules: {
      //   '@shopify/flash-list': path.resolve(__dirname, 'shims/flash-list.ts'),
      // },
    },
  });
})();
