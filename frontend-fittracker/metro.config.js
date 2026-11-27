const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Tambahkan gif ke daftar ekstensi aset yang di-bundle
config.resolver.assetExts.push('gif');

module.exports = config;
