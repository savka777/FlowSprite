/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Mark ffmpeg-static and fluent-ffmpeg as external to prevent bundling
      config.externals = config.externals || [];
      config.externals.push({
        'ffmpeg-static': 'commonjs ffmpeg-static',
        'fluent-ffmpeg': 'commonjs fluent-ffmpeg',
      });
    }
    return config;
  },
};

module.exports = nextConfig;

