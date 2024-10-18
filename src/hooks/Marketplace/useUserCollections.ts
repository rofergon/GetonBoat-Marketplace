import { useAccount, useReadContracts } from 'wagmi';
import { useState, useEffect, useMemo } from 'react';
import { erc721ABI } from '@wagmi/core';
import { erc1155ABI } from '../../abis/erc1155ABI';

interface Collection {
  name: string;
  items: number;
  contractAddress: string;
  standard: '721' | '1155' | 'unknown';
  thumbnail: string;
}

export function useUserCollections(userNFTs: any[]) {
  const { address } = useAccount();
  const [collections, setCollections] = useState<Collection[]>([]);

  const uniqueContractAddresses = useMemo(() => 
    Array.from(new Set(userNFTs.map(nft => nft.contractAddress))),
    [userNFTs]
  );

  const contractReads = useMemo(() => uniqueContractAddresses.flatMap(contractAddress => [
    {
      address: contractAddress as `0x${string}`,
      abi: erc721ABI,
      functionName: 'balanceOf',
      args: [address],
    },
    {
      address: contractAddress as `0x${string}`,
      abi: erc1155ABI,
      functionName: 'balanceOf',
      args: [address, 0],
    },
    {
      address: contractAddress as `0x${string}`,
      abi: [...erc721ABI, ...erc1155ABI],
      functionName: 'name',
    },
  ]), [uniqueContractAddresses, address]);

  const { data: results, isSuccess } = useReadContracts({
    contracts: contractReads,
  });

  useEffect(() => {
    if (isSuccess && results && address) {
      const newCollections = uniqueContractAddresses.map((contractAddress, index) => {
        const balance721 = results[index * 3]?.result;
        const balance1155 = results[index * 3 + 1]?.result;
        const nameResult = results[index * 3 + 2]?.result as string;

        let standard: '721' | '1155' | 'unknown' = 'unknown';
        if (balance721 && Number(balance721) > 0) standard = '721';
        else if (balance1155 && Number(balance1155) > 0) standard = '1155';

        const nftsInCollection = userNFTs.filter(nft => nft.contractAddress.toLowerCase() === contractAddress.toLowerCase());
        
        let items = 0;
        if (standard === '721' || standard === 'unknown') {
          items = nftsInCollection.length;
        } else if (standard === '1155') {
          items = nftsInCollection.reduce((acc, nft) => acc + (parseInt(nft.amount) || 1), 0);
        }

        // Obtener la primera imagen de la colección como miniatura
        const thumbnail = nftsInCollection[0]?.image || '/placeholder.svg';

        return {
          name: nameResult ?? 'Unknown',
          items,
          contractAddress,
          standard,
          thumbnail,
        };
      });

      setCollections(newCollections);
    }
  }, [results, isSuccess, uniqueContractAddresses, userNFTs, address]);

  return collections;
}
