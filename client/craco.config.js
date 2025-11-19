module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Optimize chunk splitting for better caching
      webpackConfig.optimization = {
        ...webpackConfig.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // Vendor bundle for node_modules
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: 10,
              reuseExistingChunk: true,
            },
            // React and related libraries
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom|react-router-dom)[\\/]/,
              name: 'react-vendor',
              priority: 20,
              reuseExistingChunk: true,
            },
            // Redux and related libraries
            redux: {
              test: /[\\/]node_modules[\\/](@reduxjs|react-redux)[\\/]/,
              name: 'redux-vendor',
              priority: 20,
              reuseExistingChunk: true,
            },
            // Stripe libraries
            stripe: {
              test: /[\\/]node_modules[\\/](@stripe)[\\/]/,
              name: 'stripe-vendor',
              priority: 20,
              reuseExistingChunk: true,
            },
            // Socket.io
            socket: {
              test: /[\\/]node_modules[\\/](socket\.io-client)[\\/]/,
              name: 'socket-vendor',
              priority: 20,
              reuseExistingChunk: true,
            },
            // Common code shared between chunks
            common: {
              minChunks: 2,
              priority: 5,
              reuseExistingChunk: true,
              name: 'common',
            },
          },
        },
        runtimeChunk: {
          name: 'runtime',
        },
      };

      return webpackConfig;
    },
  },
};
