import { useState, useCallback, useEffect } from 'react';
import { useAccount, useContractReads } from 'wagmi';
import { Address } from 'viem';
import type { LifeCycleStatus } from '@coinbase/onchainkit/transaction';
import { BasePaintBrushAbi } from '../abi/BasePaintBrushAbi';

const MARKETPLACE_ADDRESS = '0x960f887ddf97d872878e6fa7c25d7a059f8fb6d7' as Address;

export const useNFTListing = (nftAddress: Address, tokenId: string) => {
  const { address } = useAccount();
  const [isApproved, setIsApproved] = useState(false);
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

  useEffect(() => {
    if (approvalData && address && nftAddress && tokenId) {
      const [getApprovedResult, isApprovedForAllResult] = approvalData;
      setIsApproved(
        (getApprovedResult.result as Address) === MARKETPLACE_ADDRESS ||
        (isApprovedForAllResult.result as boolean)
      );
    }
  }, [approvalData, address, nftAddress, tokenId]);

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

  return {
    isApproved,
    approvalTxHash,
    listingTxHash,
    error,
    handleApprovalStatus,
    handleListingStatus,
    getApprovalContract,
    getListingContract,
  };
};