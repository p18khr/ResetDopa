const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// 1. Ensure .ttf and .otf are recognized as assets
config.resolver.assetExts.push('ttf', 'otf');

// 2. Fix for Firebase Auth (Keep your existing fixes)
config.resolver.sourceExts.push('cjs');
config.resolver.unstable_enablePackageExports = false;

module.exports = config;