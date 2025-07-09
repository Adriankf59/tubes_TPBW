/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'adrianfirmansyah-website.my.id',
        pathname: '/trailview/assets/**',
      },
    ],
  },
};

export default nextConfig;
