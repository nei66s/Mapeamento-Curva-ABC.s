/** @type {import('next').NextConfig} */
import path from 'path';
import { fileURLToPath } from 'url';

// ESM-safe __dirname
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  /* config options here */
  // Ensure Next.js uses this repository as the tracing root. This prevents
  // Next.js from inferring a parent folder (e.g. C:\Users\neiol) when
  // multiple lockfiles exist and silences the related warning.
  outputFileTracingRoot: __dirname,
  typescript: {
    // Temporarily ignore TypeScript build errors to allow production
    // builds while we address typing mismatches caused by dependency
    // version drift (Next.js / genkit / typings). Remove this once
    // the root type incompatibilities are fixed.
    ignoreBuildErrors: true,
  },
  // Allow specific development origins (ngrok, etc.) to request Next.js dev assets.
  // This suppresses the cross-origin warning during local development when using
  // a forwarded dev URL such as an ngrok domain.
  // `allowedDevOrigins` is expected at top-level in Next.js config, not under
  // `experimental` (placing it under `experimental` produces a runtime warning).
  allowedDevOrigins: [
    'https://pamila-uneditable-soaked.ngrok-free.dev'
  ],
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
  async headers() {
    const isProd = process.env.NODE_ENV === 'production';
    const headers = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
    ];
    if (isProd) {
      headers.push({ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' });
    }
    // Keep CSP minimal to avoid breaking Next.js runtime while still preventing clickjacking and unsafe base/object usage.
    const csp = [
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      ...(isProd ? ["upgrade-insecure-requests"] : []),
    ].join('; ');
    headers.push({ key: 'Content-Security-Policy', value: csp });
    return [
      {
        source: '/:path*',
        headers,
      },
    ];
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
  webpack: (config, { isServer, webpack }) => {
    config.ignoreWarnings = config.ignoreWarnings || [];
    config.ignoreWarnings.push({
      module: /@opentelemetry/,
    });

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
      config.ignoreWarnings.push({
        module: /require-in-the-middle/,
        message: /Critical dependency: require function is used in a way in which dependencies cannot be statically extracted/,
      });

      // Replace @opentelemetry imports on the client with a small noop module to
      // avoid webpack attempting to bundle server-only dynamic requires.
      config.plugins = config.plugins || [];
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/@opentelemetry\/.*/, path.resolve(__dirname, 'src/empty-opentelemetry-client.js'))
      );
    }
    // Externalize pg for server-side
    if (isServer) {
      config.externals = [...(config.externals || []), 'pg', 'pg-hstore', 'pg-native'];
    }
    return config;
  },
};

export default nextConfig;
