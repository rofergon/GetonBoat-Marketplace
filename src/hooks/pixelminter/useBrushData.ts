import { useState, useEffect, useCallback } from 'react';
import { useAccount, useReadContracts, usePublicClient } from 'wagmi';
import { getContract } from 'viem';
import { BasePaintBrushAbi } from '../../abi/BasePaintBrushAbi';
import { BrushData } from '../../types/types';

const contractAddress = '0xD68fe5b53e7E1AbeB5A4d0A6660667791f39263a';

export const useBrushData = () => {
  const { address } = useAccount();
  const [userTokenIds, setUserTokenIds] = useState<number[]>([]);
  const [brushData, setBrushData] = useState<BrushData | null>(() => {
    const storedData = localStorage.getItem('brushData');
    return storedData ? JSON.parse(storedData) : null;
  });
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
    if (!data || !data[0].result || !data[1].result || !publicClient || !address) return;

    const balance = Number(data[0].result);
    if (balance === 0) return;

    const totalSupply = Number(data[1].result);
    const contract = getContract({
      address: contractAddress,
      abi: BasePaintBrushAbi,
      client: publicClient,
    });

    const batchSize = 100;
    for (let i = 1; i <= totalSupply && userTokenIds.length < balance; i += batchSize) {
      const batch = Array.from({ length: Math.min(batchSize, totalSupply - i + 1) }, (_, index) => i + index);
      
      const owners = await Promise.all(
        batch.map(tokenId => 
          contract.read.ownerOf([BigInt(tokenId)])
            .catch(() => null)
        )
      );

      const newTokenIds = batch.filter((_, index) => 
        owners[index]?.toLowerCase() === address.toLowerCase()
      );

      if (newTokenIds.length > 0) {
        setUserTokenIds(prev => [...prev, ...newTokenIds]);
        return; // Salimos de la función una vez que encontramos al menos un token
      }
    }
  }, [data, address, publicClient, userTokenIds.length]);

  const fetchBrushData = useCallback(async () => {
    if (userTokenIds.length === 0 || brushData) return;

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
      localStorage.setItem('brushData', JSON.stringify(newBrushData));
    } catch (error) {
      console.error('Error fetching brush data:', error);
    }
  }, [userTokenIds, brushData]);

  useEffect(() => {
    if (address && !userTokenIds.length && !brushData) {
      fetchUserTokenIds();
    }
  }, [address, fetchUserTokenIds, userTokenIds.length, brushData]);

  useEffect(() => {
    if (userTokenIds.length > 0 && !brushData) {
      fetchBrushData();
    }
  }, [userTokenIds, brushData, fetchBrushData]);

  return {
    userTokenIds,
    brushData,
    isLoading,
    balance: data?.[0]?.result,
  };
};
