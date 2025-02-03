const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const exclusionList = require('metro-config/src/defaults/exclusionList');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  resolver: {
    blacklistRE: exclusionList([
      /node_modules\/.*\/node_modules\/react-native\/.*/, // Excluir dependencias duplicadas
    ]),
  },
  watchFolders: [
    './', // Incluye la carpeta raíz
  ],
  server: {
    enhanceMiddleware: (middleware, server) => {
      const watcher = server._watcher;
      if (watcher) {
        watcher.options.usePolling = false; // Desactiva el polling intensivo
        watcher.options.interval = 1000;   // Incrementa el intervalo de monitoreo
      }
      return middleware;
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
