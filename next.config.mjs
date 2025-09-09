/** @type {import('next').NextConfig} */

const API_BASE = 'https://bcomment.onrender.com';

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // 이미지 최적화 옵션
  images: {
    domains: ['bcomment.onrender.com'],
  },

  // API 프록시 설정
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_BASE}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
