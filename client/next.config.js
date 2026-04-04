/** @type {import('next').NextConfig} */
const nextConfig = {
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
