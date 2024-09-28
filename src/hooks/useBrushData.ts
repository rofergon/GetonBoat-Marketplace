import { useState, useEffect, useCallback } from 'react';
import { useAccount, useReadContracts, usePublicClient } from 'wagmi';
import { getContract } from 'viem';
import { BasePaintBrushAbi } from '../abi/BasePaintBrushAbi';
import { BrushData } from '../types/types';

const contractAddress = '0xD68fe5b53e7E1AbeB5A4d0A6660667791f39263a';

export const useBrushData = () => {
  const { address } = useAccount();
  const [userTokenIds, setUserTokenIds] = useState<number[]>([]);
  const [brushData, setBrushData] = useState<BrushData | null>(null);
  const publicClient = usePublicClient();

  const { data, isLoading } = useReadContracts({
    contracts: [
      {
        address: contractAddress,
        abi: BasePaintBrushAbi,
        functionName: 'balanceOf',
        args: [address ?? '0x0000000000000000000000000000000000000000'],
      },
      {
        address: contractAddress,
        abi: BasePaintBrushAbi,
        functionName: 'totalSupply',
      },
    ],
    query: {
      enabled: !!address,
    },
  });

  const fetchUserTokenIds = useCallback(async () => {
    if (data && data[0].result && data[1].result && publicClient) {
      const balance = Number(data[0].result);
      const totalSupply = Number(data[1].result);
      const tokenIds: number[] = [];

      const contract = getContract({
        address: contractAddress,
        abi: BasePaintBrushAbi,
        client: publicClient,
      });

      const batchSize = 500;
      for (let i = 1; i <= totalSupply && tokenIds.length < balance; i += batchSize) {
        const batch = Array.from({ length: Math.min(batchSize, totalSupply - i + 1) }, (_, index) => i + index);
        
        const ownerPromises = batch.map(tokenId => 
          contract.read.ownerOf([BigInt(tokenId)])
            .catch(() => {
              return null;
            })
        );

        const owners = await Promise.all(ownerPromises);

        owners.forEach((owner, index) => {
          if (owner) {
            const tokenId = batch[index];
            if (owner.toLowerCase() === address?.toLowerCase()) {
              tokenIds.push(tokenId);
            }
          }
        });
      }

      setUserTokenIds(tokenIds);
    }
  }, [data, address, publicClient]);

  const fetchBrushData = useCallback(async () => {
    if (userTokenIds.length > 0) {
      try {
        const response = await fetch(`/api/brush/${userTokenIds[0]}`);
        if (!response.ok) throw new Error('Error al obtener datos del pincel');
        const data = await response.json();
        
        const pixelsPerDay = data.attributes.find((attr: { trait_type: string; value: any }) => 
          attr.trait_type === 'Pixels per day'
        )?.value;

        const newBrushData = {
          tokenId: data.tokenId,
          pixelsPerDay: pixelsPerDay ? Number(pixelsPerDay) : 0
        };

        setBrushData(newBrushData);
        return newBrushData;
      } catch (error) {
        console.error('Error fetching brush data:', error);
        return null;
      }
    }
    return null;
  }, [userTokenIds]);

  useEffect(() => {
    if (address) {
      fetchUserTokenIds();
    }
  }, [address, fetchUserTokenIds]);

  useEffect(() => {
    fetchBrushData();
  }, [fetchBrushData]);

  return {
    userTokenIds,
    brushData,
    isLoading,
    balance: data?.[0]?.result,
  };
};