// next.config.mjs - FIXED VERSION
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
  // Remove 'api' configuration - this is not valid in next.config.mjs
  // API configuration should be done in individual API files
  
  // Remove experimental optimizeCss as it's causing the critters error
  // experimental: {
  //   optimizeCss: true,
  // },
};

export default nextConfig;