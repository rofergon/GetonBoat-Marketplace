import { useState, useEffect } from 'react';
import { NFT } from '../../types/types'; // Cambiamos la importación a '../types/types'

export function useNFTs(address: string | undefined) {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) {
      setIsLoading(false);
      return;
    }

    async function fetchNFTs() {
      try {
        const response = await fetch(`/api/collected-nfts?userAddress=${address}`);
        if (!response.ok) throw new Error('Error fetching NFTs');
        const data = await response.json();
        setNfts(data.nfts);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }

    fetchNFTs();
  }, [address]);

  return { nfts, isLoading, error };
}