const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const exclusiones = config.resolver.blockList;
// El build nativo genera miles de objetos temporales; no son fuentes de Metro.
config.resolver.blockList = [
  ...(Array.isArray(exclusiones) ? exclusiones : exclusiones ? [exclusiones] : []),
  /[\\/](?:\.cxx|\.gradle|\.vs)(?:[\\/]|$)/,
];

module.exports = config;
