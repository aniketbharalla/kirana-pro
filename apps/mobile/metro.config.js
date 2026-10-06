const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && (moduleName === 'firebase/auth' || moduleName === '@firebase/auth')) {
    return {
      filePath: path.resolve(__dirname, '../../node_modules/@firebase/auth/dist/esm/index.js'),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
