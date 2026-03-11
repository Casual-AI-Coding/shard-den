const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'out',
  // Mark external packages
  serverExternalPackages: ['@tauri-apps/api'],
  // Optimize imports for tree-shaking
  modularizeImports: {
    // Tree-shake lucide-react icons - only import what's used
    'lucide-react': {
      transform: 'lucide-react/dist/esm/{{member}}',
      skipDefaultConversion: true,
    },
    // Tree-shake @radix-ui components
    '@radix-ui/react-select': {
      transform: '@radix-ui/react-select/dist/{{member}}',
      skipDefaultConversion: true,
    },
    '@radix-ui/react-tabs': {
      transform: '@radix-ui/react-tabs/dist/{{member}}',
      skipDefaultConversion: true,
    },
  },
  webpack: (config, { isServer }) => {
    // Support WASM
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    // Tree shaking for WASM on client side
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        usedExports: true,
      };
    }

    return config;
  },
};

module.exports = withBundleAnalyzer(nextConfig);
