/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@orbistech/database',
    '@orbistech/auth',
    '@orbistech/pnw-api',
    '@orbistech/ui',
    '@orbistech/encryption'
  ],
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client']
  },
  images: {
    domains: [
      'cdn.discordapp.com',
      'politicsandwar.com'
    ]
  },
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/dashboard'
      }
    ];
  }
};

module.exports = nextConfig;