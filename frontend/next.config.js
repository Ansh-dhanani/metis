/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Connect to Flask backend
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
