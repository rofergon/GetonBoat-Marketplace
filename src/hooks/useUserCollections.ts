import { useAccount, useReadContracts } from 'wagmi';
import { useState, useEffect, useMemo } from 'react';
import { erc721ABI } from '@wagmi/core';

interface Collection {
  name: string;
  items: number;
  floorPrice: string;
  contractAddress: string;
}

export function useUserCollections(userNFTs: any[]) {
  const { address } = useAccount();
  const [collections, setCollections] = useState<Collection[]>([]);

  // Obtener direcciones únicas de contratos usando useMemo
  const uniqueContractAddresses = useMemo(() => 
    Array.from(new Set(userNFTs.map(nft => nft.contractAddress))),
    [userNFTs]
  );

  const contractReads = useMemo(() => uniqueContractAddresses.flatMap(contractAddress => [
    {
      address: contractAddress as `0x${string}`,
      abi: erc721ABI,
      functionName: 'name',
    },
    {
      address: contractAddress as `0x${string}`,
      abi: erc721ABI,
      functionName: 'balanceOf',
      args: [address],
    },
  ]), [uniqueContractAddresses, address]);

  const { data: results, isSuccess } = useReadContracts({
    contracts: contractReads,
  });

  useEffect(() => {
    if (isSuccess && results) {
      const newCollections = uniqueContractAddresses.map((contractAddress, index) => {
        const nameResult = results[index * 2]?.result as string;
        const balanceResult = results[index * 2 + 1]?.result as bigint;
        
        return {
          name: nameResult ?? 'Unknown',
          items: Number(balanceResult ?? BigInt(0)),
          floorPrice: "N/A",
          contractAddress,
        };
      });

      setCollections(newCollections);
    }
  }, [results, isSuccess, uniqueContractAddresses]);

  return collections;
}
