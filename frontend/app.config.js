module.exports = ({ config }) => {
  if (process.env.EXPO_BASE_URL) {
    config.experiments = {
      ...config.experiments,
      baseUrl: process.env.EXPO_BASE_URL,
    };
  }
  return config;
};
