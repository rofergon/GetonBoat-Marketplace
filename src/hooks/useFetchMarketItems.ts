import { useReadContract } from 'wagmi';
import { marketplaceAbi } from '../abi/marketplace.abi';
import { useState, useEffect } from 'react';
import { NFTDatabaseManager } from '../../pages/api/nftDatabaseManager';

const MARKETPLACE_ADDRESS = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS as `0x${string}`;
const ITEMS_PER_PAGE = 50;

export interface MarketItem {
  marketItemId: bigint;
  nftContractAddress: `0x${string}`;
  tokenId: bigint;
  seller: `0x${string}`;
  buyer: `0x${string}`;
  price: bigint;
  sold: boolean;
  canceled: boolean;
  expirationTime: bigint;
}

export const useFetchMarketItems = (page: number = 0) => {
  console.log('Hook useFetchMarketItems llamado con página:', page);
  const [marketItems, setMarketItems] = useState<MarketItem[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);

  const { data: totalItemsData } = useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: marketplaceAbi,
    functionName: 'getTotalAvailableMarketItems',
  });

  const { data: fetchedItems, isLoading, error } = useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: marketplaceAbi,
    functionName: 'fetchAvailableMarketItems',
    args: [BigInt(page * ITEMS_PER_PAGE), BigInt(ITEMS_PER_PAGE)],
  });

  useEffect(() => {
    if (totalItemsData) {
      const total = Number(totalItemsData);
      console.log('Actualizando total de items:', total);
      setTotalItems(total);
    }
  }, [totalItemsData]);

  useEffect(() => {
    if (fetchedItems && Array.isArray(fetchedItems)) {
      console.log('Actualizando marketItems con:', fetchedItems);
      setMarketItems(fetchedItems as MarketItem[]);
      updateNFTListingStatus(fetchedItems as MarketItem[]);
    }
  }, [fetchedItems]);

  const updateNFTListingStatus = async (items: MarketItem[]) => {
    
    const dbManager = new NFTDatabaseManager();
    try {
      await dbManager.resetListingStatus();
      await dbManager.updateNFTListingStatus(items);
     
    } catch (error) {
      console.error('Error al actualizar el estado de listado de los NFTs:', error);
    } finally {
      await dbManager.close();
    }
  };

  const hasMore = totalItems > (page + 1) * ITEMS_PER_PAGE;
 

  return {
    marketItems,
    totalItems,
    isLoading,
    error,
    hasMore,
  };
};
