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
        'nft-cdn.alchemy.com'  // Añadimos el nuevo dominio aquí
      ], 
      dangerouslyAllowSVG: true,
      contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
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
  }
  
  module.exports = nextConfig