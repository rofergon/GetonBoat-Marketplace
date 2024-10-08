import { useContractRead } from 'wagmi';
import { marketplaceAbi } from '../abi/marketplace.abi';
import { useState, useEffect } from 'react';
import { NFTDatabaseManager } from '../../pages/api/nftDatabaseManager';

const MARKETPLACE_ADDRESS = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS as `0x${string}`;
const ITEMS_PER_PAGE = 10;

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
  const [marketItems, setMarketItems] = useState<MarketItem[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);

  console.log('useFetchMarketItems llamado con página:', page);

  const { data: totalItemsData, isLoading: isTotalItemsLoading, error: totalItemsError } = useContractRead({
    address: MARKETPLACE_ADDRESS,
    abi: marketplaceAbi,
    functionName: 'getTotalAvailableMarketItems',
  });

  console.log('Total de items disponibles:', totalItemsData);
  console.log('Cargando total de items:', isTotalItemsLoading);
  console.log('Error al cargar total de items:', totalItemsError);

  const { data: fetchedItems, isLoading, error } = useContractRead({
    address: MARKETPLACE_ADDRESS,
    abi: marketplaceAbi,
    functionName: 'fetchAvailableMarketItems',
    args: [BigInt(page * ITEMS_PER_PAGE), BigInt(ITEMS_PER_PAGE)],
  });

  console.log('Items obtenidos:', fetchedItems);
  console.log('Cargando items:', isLoading);
  console.log('Error al cargar items:', error);

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
    console.log('Actualizando estado de listado para', items.length, 'items');
    const dbManager = new NFTDatabaseManager();
    try {
      await dbManager.resetListingStatus();
      await dbManager.updateNFTListingStatus(items);
      console.log('Estado de listado actualizado exitosamente');
    } catch (error) {
      console.error('Error al actualizar el estado de listado de los NFTs:', error);
    } finally {
      await dbManager.close();
    }
  };

  const hasMore = totalItems > (page + 1) * ITEMS_PER_PAGE;
  console.log('¿Hay más items?', hasMore);

  return {
    marketItems,
    totalItems,
    isLoading,
    error,
    hasMore,
  };
};
