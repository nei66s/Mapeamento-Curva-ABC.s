/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      
    ],
  },
  // serverExternalPackages is not supported in Next.js 14; remove it to avoid invalid config
  experimental: {
    
  },
  async rewrites() {
    return [
      {
        source: '/uploads/avatars/:path*',
        destination: '/uploads/categories/:path*',
      },
    ];
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't bundle pg and Node.js built-ins on the client side
      config.resolve.alias = {
        ...config.resolve.alias,
        'pg': false,
        'pg-hstore': false,
        'pg-native': false,
      };
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        crypto: false,
        stream: false,
        util: false,
        buffer: false,
      };
    }
    // Externalize pg for server-side
    if (isServer) {
      config.externals = [...(config.externals || []), 'pg', 'pg-hstore', 'pg-native'];
    }
    return config;
  },
};

export default nextConfig;
