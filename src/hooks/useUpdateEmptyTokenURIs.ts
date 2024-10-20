import { useState, useCallback } from 'react';
import { usePublicClient } from 'wagmi';
import { erc721ABI } from '@wagmi/core';
import { NFTDatabaseManager } from '../../pages/api/nftDatabaseManager';

export function useUpdateEmptyTokenURIs() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [progress, setProgress] = useState(0);
  const publicClient = usePublicClient();

  const updateEmptyTokenURIs = useCallback(async () => {
    if (!publicClient) {
      console.error('Cliente público no disponible');
      return;
    }

    setIsUpdating(true);
    setProgress(0);

    const dbManager = new NFTDatabaseManager();

    try {
      const emptyNFTs = await dbManager.getNFTsWithEmptyNameOrDescription();
      console.log('NFTs con nombre o descripción vacíos:', emptyNFTs);
      const totalNFTs = emptyNFTs.length;

      for (let i = 0; i < totalNFTs; i++) {
        const nft = emptyNFTs[i];
        console.log(`Procesando NFT ${i + 1}/${totalNFTs}:`, nft);
        
        try {
          const tokenURI = await publicClient.readContract({
            address: nft.contractAddress as `0x${string}`,
            abi: erc721ABI,
            functionName: 'tokenURI',
            args: [BigInt(nft.tokenId)],
          });

          console.log(`TokenURI obtenido para NFT ${nft.tokenId}:`, tokenURI);

          if (tokenURI) {
            const response = await fetch(tokenURI);
            const metadata = await response.json();
            console.log(`Metadata obtenido para NFT ${nft.tokenId}:`, metadata);

            const name = metadata.name || `NFT #${nft.tokenId}`;
            const image = metadata.image || '';
            const imageurl = metadata.image || '';
            const description = metadata.description || '';

            await dbManager.updateNFTMetadata(
              nft.contractAddress,
              nft.tokenId,
              name,
              image,
              imageurl,
              description,
              tokenURI
            );
          } else {
            console.log(`No se pudo obtener tokenURI para NFT ${nft.tokenId}`);
          }
        } catch (error) {
          console.error(`Error al procesar NFT ${nft.tokenId}:`, error);
        }

        setProgress(((i + 1) / totalNFTs) * 100);
      }
    } catch (error) {
      console.error('Error al actualizar metadata de NFTs:', error);
    } finally {
      setIsUpdating(false);
      await dbManager.close();
    }
  }, [publicClient]);

  return { updateEmptyTokenURIs, isUpdating, progress };
}
