const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Register .ptl as a bundleable asset so Metro can include the PyTorch
// Mobile model file in the app bundle.
config.resolver.assetExts.push('ptl');

module.exports = config;
