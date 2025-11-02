// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Fix for InternalBytecode.js error - handle missing source map files gracefully
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Handle InternalBytecode.js symbolication requests
      if (req.url && req.url.includes('InternalBytecode.js')) {
        // Return empty response instead of trying to read the file
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({}));
        return;
      }
      // Also handle symbolication requests that might reference InternalBytecode.js
      if (req.url && (req.url.includes('/symbolicate') || req.url.includes('symbolication'))) {
        // Return empty stack trace to prevent errors
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ stack: [] }));
        return;
      }
      return middleware(req, res, next);
    };
  },
};

// Disable source map symbolication for InternalBytecode.js
config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

module.exports = config;

