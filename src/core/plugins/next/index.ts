export function withThon(nextConfig) {
  const userWebpack = nextConfig.webpack || ((x) => x);

  return {
    ...nextConfig,
    webpack: (config, options) => {
      config.module.rules.push({
        test: /\.md$/i,
        use: [
          {
            loader: 'raw-loader',
            options: {
              esModule: false,
            },
          },
        ],
      });

      return userWebpack(config, options);
    },
  };
}
