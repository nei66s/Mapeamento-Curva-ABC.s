/** @type {import('next').NextConfig} */
import path from 'path';
import { fileURLToPath } from 'url';

// ESM-safe __dirname
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  /* config options here */
  // Prevent Next from inferring the workspace root from unrelated lockfiles
  // (see Next.js docs: outputFileTracingRoot). Set to this project's directory.
  outputFileTracingRoot: __dirname,
  typescript: {
    ignoreBuildErrors: false,
  },
  // NOTE: the `eslint` config key in next.config.mjs was removed in newer
  // Next.js versions. Configure ESLint using an `.eslintrc` file and run
  // linting via the `next lint` script. See:
  // https://nextjs.org/docs/app/api-reference/cli/next#next-lint-options
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
      {
        protocol: 'https',
        hostname: 'api.qrserver.com',
        port: '',
        pathname: '/**',
      },
      
    ],
  },
  // serverExternalPackages is not supported in Next.js 14; remove it to avoid invalid config
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
      // Suppress warnings from packages that use dynamic require() which are only
      // relevant during server-side runtime (opentelemetry / require-in-the-middle).
      config.ignoreWarnings = config.ignoreWarnings || [];
      config.ignoreWarnings.push({
        module: /require-in-the-middle/,
        message: /Critical dependency: require function is used in a way in which dependencies cannot be statically extracted/,
      });
      config.ignoreWarnings.push({
        module: /@opentelemetry/,
      });
    }
    // Externalize pg for server-side
    if (isServer) {
      config.externals = [...(config.externals || []), 'pg', 'pg-hstore', 'pg-native'];
    }
    return config;
  },
};

export default nextConfig;
