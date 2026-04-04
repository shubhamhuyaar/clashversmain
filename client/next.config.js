/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      {
        source: '/profile',
        destination: '/career',
        permanent: true,
      },
      {
        source: '/ranks',
        destination: '/leaderboard',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
