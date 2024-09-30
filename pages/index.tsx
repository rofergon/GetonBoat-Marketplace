import dynamic from 'next/dynamic';

const NFTMarketplace = dynamic(() => import('../src/components/Marketplace/marketplace'), {
  ssr: false,
  loading: () => <div>Cargando NFT Marketplace...</div>
});

export default function Home() {
  return <NFTMarketplace />;
}