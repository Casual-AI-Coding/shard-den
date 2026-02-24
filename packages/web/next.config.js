/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@tauri-apps/api'],
  async rewrites() {
    return [
      {
        source: '/wasm/:path*',
        destination: '/wasm/:path*',
      },
    ];
  },
  webpack: (config, { isServer }) => {
    // Support WASM
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    return config;
  },
};

module.exports = nextConfig;
