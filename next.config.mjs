/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'directus-394340675569.us-central1.run.app',
        pathname: '/assets/**',
      },
    ],
  },
};

export default nextConfig;