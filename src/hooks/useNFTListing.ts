import { useState, useCallback, useEffect } from 'react';
import { useAccount, useContractReads, useContractRead } from 'wagmi';
import { Address } from 'viem';
import type { LifeCycleStatus } from '@coinbase/onchainkit/transaction';
import { BasePaintBrushAbi } from '../abi/BasePaintBrushAbi';
import { marketplaceAbi } from '../abi/marketplace.abi';

const MARKETPLACE_ADDRESS = '0x960f887ddf97d872878e6fa7c25d7a059f8fb6d7' as Address;

// Definimos el tipo de retorno esperado para fetchMarketItem
interface MarketItem {
  marketItemId: bigint;
  nftContractAddress: Address;
  tokenId: bigint;
  seller: Address;
  owner: Address;
  price: bigint;
  sold: boolean;
  canceled: boolean;
}

export const useNFTListing = (nftAddress: Address, tokenId: string) => {
  const { address } = useAccount();
  const [isApproved, setIsApproved] = useState(false);
  const [isListed, setIsListed] = useState(false);
  const [approvalTxHash, setApprovalTxHash] = useState<string | null>(null);
  const [listingTxHash, setListingTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: approvalData } = useContractReads({
    contracts: [
      {
        address: nftAddress,
        abi: BasePaintBrushAbi,
        functionName: 'getApproved',
        args: [BigInt(tokenId)],
      },
      {
        address: nftAddress,
        abi: BasePaintBrushAbi,
        functionName: 'isApprovedForAll',
        args: [address as Address, MARKETPLACE_ADDRESS],
      },
    ],
  });

  const { data: marketItemData } = useContractRead({
    address: MARKETPLACE_ADDRESS,
    abi: marketplaceAbi,
    functionName: 'fetchMarketItem',
    args: [nftAddress, BigInt(tokenId)],
  }) as { data: MarketItem | undefined };

  useEffect(() => {
    if (approvalData && address && nftAddress && tokenId) {
      const [getApprovedResult, isApprovedForAllResult] = approvalData;
      setIsApproved(
        (getApprovedResult.result as Address) === MARKETPLACE_ADDRESS ||
        (isApprovedForAllResult.result as boolean)
      );
    }
  }, [approvalData, address, nftAddress, tokenId]);

  useEffect(() => {
    if (marketItemData) {
      setIsListed(
        marketItemData.seller !== '0x0000000000000000000000000000000000000000' &&
        !marketItemData.sold &&
        !marketItemData.canceled
      );
    }
  }, [marketItemData]);

  const handleApprovalStatus = useCallback((status: LifeCycleStatus) => {
    console.log('Estado de la aprobación:', status);
    if (status.statusName === 'success') {
      console.log('Aprobación exitosa:', status.statusData);
      setApprovalTxHash(status.statusData.transactionReceipts[0].transactionHash);
      setIsApproved(true);
    } else if (status.statusName === 'error') {
      console.error('Error en la aprobación:', status.statusData);
      setError(`Error in approval: ${status.statusData.message || 'Unknown'}`);
    }
  }, []);

  const handleListingStatus = useCallback((status: LifeCycleStatus) => {
    console.log('Estado del listado:', status);
    if (status.statusName === 'success') {
      console.log('Listado exitoso:', status.statusData);
      setListingTxHash(status.statusData.transactionReceipts[0].transactionHash);
    } else if (status.statusName === 'error') {
      console.error('Error en el listado:', status.statusData);
      setError(`Error in listing: ${status.statusData.message || 'Unknown'}`);
    }
  }, []);

  const handleCancelListing = useCallback(async () => {
    try {
      // Aquí iría la lógica para cancelar el listado
      // Por ejemplo, llamar a la función cancelMarketItem del contrato
      console.log('Cancelando listado para:', nftAddress, tokenId);
      // Simular una llamada exitosa
      setIsListed(false);
    } catch (error) {
      console.error('Error al cancelar el listado:', error);
      setError(`Error al cancelar el listado: ${(error as Error).message || 'Desconocido'}`);
    }
  }, [nftAddress, tokenId]);

  const getApprovalContract = useCallback(() => [
    {
      address: nftAddress,
      abi: BasePaintBrushAbi,
      functionName: 'setApprovalForAll',
      args: [MARKETPLACE_ADDRESS, true],
    },
  ], [nftAddress]);

  const getListingContract = useCallback((price: string) => [
    {
      address: MARKETPLACE_ADDRESS,
      abi: [
        {
          inputs: [
            { internalType: 'address', name: 'nftContract', type: 'address' },
            { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
            { internalType: 'uint256', name: 'price', type: 'uint256' },
          ],
          name: 'createMarketItem',
          outputs: [],
          stateMutability: 'nonpayable',
          type: 'function',
        },
      ] as const,
      functionName: 'createMarketItem',
      args: [nftAddress, BigInt(tokenId), BigInt(price)],
    },
  ], [nftAddress, tokenId]);

  const getCancelListingContract = useCallback(() => [
    {
      address: MARKETPLACE_ADDRESS,
      abi: marketplaceAbi,
      functionName: 'cancelMarketItem',
      args: [nftAddress, BigInt(tokenId)],
    },
  ], [nftAddress, tokenId]);

  return {
    isApproved,
    isListed,
    approvalTxHash,
    listingTxHash,
    error,
    handleApprovalStatus,
    handleListingStatus,
    handleCancelListing,
    getApprovalContract,
    getListingContract,
    getCancelListingContract,
  };
};