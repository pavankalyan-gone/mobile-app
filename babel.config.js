module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    env: {
      production: {
        // Strip all console.* calls from release bundles
        plugins: ['transform-remove-console'],
      },
    },
  };
};
