const { withNxMetro } = require('@nx/react-native');
const { getDefaultConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

module.exports = withNxMetro(defaultConfig, {
  // Change this to true to see debugging info.
  // Useful if you have issues resolving modules
  debug: false,
  // All file extensions used for imports other than the Metro defaults.
  extensions: [],
  // Specify folders to watch, in addition to Nx defaults (workspace libraries and node_modules)
  watchFolders: [],
});
