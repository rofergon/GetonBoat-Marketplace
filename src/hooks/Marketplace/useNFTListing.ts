import { useState, useCallback, useEffect } from 'react';
import { useAccount, useContractReads, useContractRead, useWalletClient, usePublicClient } from 'wagmi';
import { Address, encodeFunctionData } from 'viem';
import { BasePaintBrushAbi } from '../../abi/BasePaintBrushAbi';
import { marketplaceAbi } from '../../abi/marketplace.abi';

const MARKETPLACE_ADDRESS = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS as Address;

interface MarketItem {
  marketItemId: bigint;
  nftContractAddress: Address;
  tokenId: bigint;
  seller: Address;
  buyer: Address;
  price: bigint;
  sold: boolean;
  canceled: boolean;
  expirationTime: bigint;
}

type LifeCycleStatus = {
  statusName: 'success' | 'error';
  statusData: any;
};

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
    functionName: 'fetchAvailableMarketItems',
    args: [BigInt(0), BigInt(1)],
  }) as { data: MarketItem[] | undefined };

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
    if (marketItemData && marketItemData.length > 0) {
      const item = marketItemData[0];
      setIsListed(
        item.nftContractAddress === nftAddress &&
        item.tokenId === BigInt(tokenId) &&
        item.seller !== '0x0000000000000000000000000000000000000000' &&
        !item.sold &&
        !item.canceled &&
        item.expirationTime > BigInt(Math.floor(Date.now() / 1000))
      );
    } else {
      setIsListed(false);
    }
  }, [marketItemData, nftAddress, tokenId]);

  const handleApprovalStatus = useCallback((status: LifeCycleStatus) => {
    console.log('Estado de la aprobación:', status);
    if (status.statusName === 'success') {
      console.log('Aprobación exitosa:', status.statusData);
      setApprovalTxHash(status.statusData.transactionReceipts[0].transactionHash);
      setIsApproved(true);
    } else if (status.statusName === 'error') {
      console.error('Error en la aprobación:', status.statusData);
      setError(`Error en la aprobación: ${status.statusData.message || 'Desconocido'}`);
    }
  }, []);

  const handleListingStatus = useCallback((status: LifeCycleStatus) => {
    console.log('Estado del listado:', status);
    if (status.statusName === 'success') {
      console.log('Listado exitoso:', status.statusData);
      setListingTxHash(status.statusData.transactionReceipts[0].transactionHash);
      setIsListed(true);
    } else if (status.statusName === 'error') {
      console.error('Error en el listado:', status.statusData);
      setError(`Error en el listado: ${status.statusData.message || 'Desconocido'}`);
    }
  }, []);

  const handleCancelListing = useCallback(async () => {
    try {
      console.log('Cancelando listado para:', nftAddress, tokenId);
     
      setIsListed(false);
    } catch (error) {
      console.error('Error al cancelar el listado:', error);
      setError(`Error al cancelar el listado: ${(error as Error).message || 'Desconocido'}`);
    }
  }, [nftAddress, tokenId]);

  const getApprovalContract = useCallback(() => {
    return [
      {
        address: nftAddress,
        abi: BasePaintBrushAbi,
        functionName: 'setApprovalForAll',
        args: [MARKETPLACE_ADDRESS, true],
      },
    ];
  }, [nftAddress]);

  const getListingContract = useCallback((price: string, durationInDays: number) => {
    const safeBigInt = (value: string | number): string => {
      return BigInt(value.toString()).toString();
    };

    // Eliminar la comprobación del precio mínimo
    const safePrice = safeBigInt(price);

    // Calcula la duración en segundos
    const listingDurationInSeconds = BigInt(durationInDays * 24 * 60 * 60).toString();

    // Verifica que la duración esté dentro de los límites permitidos
    const MIN_DURATION = 6 * 24 * 60 * 60; // 6 días en segundos
    const MAX_DURATION = 180 * 24 * 60 * 60; // 6 meses en segundos
    if (BigInt(listingDurationInSeconds) < BigInt(MIN_DURATION) || BigInt(listingDurationInSeconds) > BigInt(MAX_DURATION)) {
      throw new Error("La duración del listado debe estar entre 6 días y 6 meses");
    }

    return [{
      address: MARKETPLACE_ADDRESS,
      abi: marketplaceAbi,
      functionName: 'createMarketItem',
      args: [
        nftAddress,
        safeBigInt(tokenId),
        safePrice,
        listingDurationInSeconds 
      ],
    }];
  }, [nftAddress, tokenId]);

  const getCancelListingContract = useCallback(() => [
    {
      address: MARKETPLACE_ADDRESS,
      abi: marketplaceAbi,
      functionName: 'cancelMarketItem',
      args: [nftAddress, BigInt(tokenId).toString()],
    },
  ], [nftAddress, tokenId]);

  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const checkApproval = useCallback(async () => {
    if (!publicClient || !address) {
      console.error('Public client or address not available');
      return false;
    }

    try {
      const isApproved = await publicClient.readContract({
        address: nftAddress,
        abi: BasePaintBrushAbi,
        functionName: 'isApprovedForAll',
        args: [address as `0x${string}`, MARKETPLACE_ADDRESS],
      });

      return isApproved;
    } catch (error) {
      console.error('Error checking approval:', error);
      setError(`Error checking approval: ${(error as Error).message || 'Unknown error'}`);
      return false;
    }
  }, [nftAddress, address, publicClient]);

  const approveNFT = useCallback(async () => {
    if (!walletClient || !address) {
      console.error('Wallet client or address not available');
      setError('Wallet client not available. Please check your wallet connection.');
      return;
    }

    try {
      const data = encodeFunctionData({
        abi: BasePaintBrushAbi,
        functionName: 'setApprovalForAll',
        args: [MARKETPLACE_ADDRESS, true],
      });

      const transaction = {
        to: nftAddress,
        data,
        chain: walletClient.chain,
      };

      const hash = await walletClient.sendTransaction(transaction);

      console.log('Aprobando NFT:', nftAddress, tokenId);
      console.log('Transaction hash:', hash);

      setApprovalTxHash(hash);
      
      // Esperar a que la transacción se confirme
      if (publicClient) {
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        
        if (receipt.status === 'success') {
          setIsApproved(true);
          console.log('Aprobación exitosa');
        } else {
          throw new Error('La transacción falló');
        }
      } else {
        console.error('Public client no está disponible');
        // Manejar el caso cuando publicClient no está disponible
      }
    } catch (error) {
      console.error('Error al aprobar el NFT:', error);
      setError(`Error al aprobar el NFT: ${(error as Error).message || 'Desconocido'}`);
    }
  }, [nftAddress, tokenId, address, walletClient, publicClient]);

  const listNFT = useCallback(async (price: string, durationInDays: number) => {
    try {
      if (!isApproved) {
        throw new Error('El NFT no está aprobado para listar');
      }
      if (!walletClient || !publicClient || !address) {
        throw new Error('Wallet client, public client o dirección no disponible');
      }

      const listingContract = getListingContract(price, durationInDays);
      console.log('Contrato de listado:', listingContract);
      
      const [nftAddress, tokenId, listingPrice, duration] = listingContract[0].args as [`0x${string}`, bigint, bigint, bigint];

      // Obtener el gas estimado y el precio del gas actual
      const gasEstimate = await publicClient.estimateContractGas({
        address: MARKETPLACE_ADDRESS,
        abi: marketplaceAbi,
        functionName: 'createMarketItem',
        args: [nftAddress, tokenId, listingPrice, duration],
        account: address,
      });

      const gasPrice = await publicClient.getGasPrice();

      // Calcular el gas fee total
      const gasFee = gasEstimate * gasPrice;

      // Agregar un 10% extra al gas fee para asegurar que la transacción se procese
      const adjustedGasFee = gasFee * BigInt(110) / BigInt(100);

      console.log('Listando NFT:', nftAddress, tokenId, price, durationInDays);
      console.log('Gas estimado:', gasEstimate.toString());
      console.log('Precio del gas:', gasPrice.toString());
      console.log('Gas fee ajustado:', adjustedGasFee.toString());

      const hash = await walletClient.writeContract({
        address: MARKETPLACE_ADDRESS,
        abi: marketplaceAbi,
        functionName: 'createMarketItem',
        args: [nftAddress, tokenId, listingPrice, duration],
        gas: gasEstimate,
        maxFeePerGas: adjustedGasFee / gasEstimate,
      });

      setListingTxHash(hash);
      
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      if (receipt.status === 'success') {
        setIsListed(true);
        console.log('Listado exitoso');
      } else {
        throw new Error('La transacción de listado falló');
      }
    } catch (error) {
      console.error('Error al listar el NFT:', error);
      setError(`Error al listar el NFT: ${(error as Error).message || 'Desconocido'}`);
    }
  }, [isApproved, getListingContract, walletClient, publicClient, address]);

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
    approveNFT,
    listNFT,
    checkApproval,
  };
};
