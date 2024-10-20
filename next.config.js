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
        'www.base.org', 
        'nft-cdn.alchemy.com',
        'ipfs.dweb.link',  
        'gateway.pinata.cloud',  
        'img.dot.fan',
        'arweave.net', 
        'data.debox.pro', 
        'locksmith.unlock-protocol.com', 
        'storage.unlock-protocol.com',
        'storage.withfabric.xyz', 
        'beebase.xyz', 
        'sia.tech', 
        'www.lighthouse.storage', 
        'filecoin.io', 
        'storj.io', 
        'crust.network', 
        'www.0chain.net', 
        'centrifuge.io', 
        'infura.io', 
        'niftygateway.com', 
        'cloudflare-ipfs.com', 
        'aws.amazon.com', 
        'www.immutable.com',
        'rarible.com',
        'nft.storage',
        'zora.co',
        'superrare.com',
        'ipfs.fleek.co',
        'gateway.lighthouse.storage', // Agregamos este nuevo dominio
        'assets-chibi-go.s3.amazonaws.com', // Agregamos este nuevo dominio
        'assets.bueno.art', // Agregamos este nuevo dominio
        'g2-minter.vercel.app', // Agregamos este nuevo dominio
        'files.iyk.app', // Agregamos este nuevo dominio
        'property.checkin.gg', // Agregamos este nuevo dominio
        'highlight-creator-assets.highlight.xyz', // Agregamos este nuevo dominio
        'www.arcade.fun', // Agregamos este nuevo dominio
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
        {
          source: '/ipfs-image/:cid',
          destination: '/api/ipfs-proxy?cid=:cid',
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
