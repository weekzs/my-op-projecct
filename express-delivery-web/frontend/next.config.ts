import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 允许通过 frp/宝塔等反向代理访问开发环境资源
  experimental: {
    allowedDevOrigins: [
      'http://115.190.245.37:3001',
      'http://115.190.245.37',
      // 如果你有域名走到这个 dev 服务，可以在这里继续加
      // 例如: 'http://weekzs.icu:3001',
    ],
  },

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3000/api/:path*',
      },
    ];
  },
  // 开发环境下允许跨域
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type,Authorization' },
        ],
      },
    ];
  },
};

export default nextConfig;
