// Learn more https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Enable package exports resolution so Metro can resolve subpath imports
// like "firebase/auth", "firebase/firestore", etc.
config.resolver.unstable_enablePackageExports = false;

// Tell Metro to prefer "browser" and "react-native" conditions when resolving
// package exports. Without this, it may pick the "node" entry point for
// packages like firebase, which causes runtime errors in React Native.
config.resolver.unstable_conditionNames = [
  'react-native',
  'browser',
  'require',
  'import',
  'default',
];

module.exports = config;
