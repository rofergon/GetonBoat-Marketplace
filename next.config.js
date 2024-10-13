/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,

    images: {
      domains: [
        'basepaint.xyz', 
        'pixelminter.xyz', 
        'localhost', 
        'res.cloudinary.com', 
        'ipfs.io', 
        'base.org',
        'nft-cdn.alchemy.com',
        'ipfs.dweb.link',  // Gateway IPFS alternativo
        'gateway.pinata.cloud',  // Otro gateway IPFS alternativo
        'img.dot.fan',
        'arweave.net', // Añadimos el nuevo dominio aquí
      ], 
      dangerouslyAllowSVG: true,
      contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
      minimumCacheTTL: 1500,  // Aumenta el tiempo de caché mínimo
      deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
      imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    },
    async headers() {
      return [
        {
          source: '/api/:path*',
          headers: [
            { key: 'Access-Control-Allow-Credentials', value: 'true' },
            { key: 'Access-Control-Allow-Origin', value: '*' },
            { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
            { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
          ],
        },
      ];
    },
    async rewrites() {
      return [
        {
          source: '/api/proxy-image',
          destination: '/api/proxy-image',
        },
      ];
    },

    publicRuntimeConfig: {
      staticFolder: '/public',
    },
    env: {
      TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL,
      TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN,
    },
  }
  
  module.exports = nextConfig
