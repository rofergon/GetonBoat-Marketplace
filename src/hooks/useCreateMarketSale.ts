import { useState, useCallback } from 'react';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { marketplaceAbi } from '../abi/marketplace.abi';
import { parseEther, Address } from 'viem';

export const useCreateMarketSale = () => {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const [error, setError] = useState<string | null>(null);
  const [isBuying, setIsBuying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleCreateMarketSale = useCallback(async (
    marketItemId: bigint,
    nftContractAddress: `0x${string}`,
    tokenId: bigint,
    priceInWei: bigint
  ) => {
    console.log('Argumentos recibidos en handleCreateMarketSale:');
    console.log('marketItemId:', marketItemId);
    console.log('nftContractAddress:', nftContractAddress);
    console.log('tokenId:', tokenId);
    console.log('priceInWei:', priceInWei);

    if (!address || !walletClient || !publicClient) {
      setError('Billetera no conectada o cliente no disponible');
      return;
    }

    setIsBuying(true);
    setError(null);
    setIsSuccess(false);

    try {
      // Verificar si el marketItemId es válido
      const marketItem = await publicClient.readContract({
        address: process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS as `0x${string}`,
        abi: marketplaceAbi,
        functionName: 'fetchMarketItem',
        args: [marketItemId],
      });

      console.log('Market item obtenido:', marketItem);

      if (!marketItem || marketItem.sold || marketItem.canceled || BigInt(marketItem.expirationTime) < BigInt(Math.floor(Date.now() / 1000))) {
        throw new Error('El artículo del mercado no está disponible para la venta');
      }

      // Verificar si el token existe en el contrato NFT
      const nftContract = {
        address: nftContractAddress,
        abi: [{ 
          name: 'ownerOf', 
          type: 'function', 
          inputs: [{ name: 'tokenId', type: 'uint256' }],
          outputs: [{ name: '', type: 'address' }]
        }] as const,
      };

      try {
        const ownerOf = await publicClient.readContract({
          ...nftContract,
          functionName: 'ownerOf',
          args: [tokenId],
        });
        console.log('Propietario actual del token:', ownerOf);
      } catch (error) {
        console.error('Error al verificar el propietario del token:', error);
        throw new Error('El token no existe o no se puede verificar su propiedad');
      }

      // Estimar el gas necesario
      const gasEstimate = await publicClient.estimateContractGas({
        address: process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS as Address,
        abi: marketplaceAbi,
        functionName: 'createMarketSale',
        args: [marketItemId, nftContractAddress, tokenId],
        account: address,
        value: priceInWei,
      });

      console.log('Estimación de gas:', gasEstimate);

      // Aumentar la estimación de gas en un 20% para asegurar que sea suficiente
      const gasLimit = BigInt(Math.floor(Number(gasEstimate) * 1.2));

      const hash = await walletClient.writeContract({
        address: process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS as Address,
        abi: marketplaceAbi,
        functionName: 'createMarketSale',
        args: [marketItemId, nftContractAddress, tokenId],
        value: priceInWei,
        gas: gasLimit,
      });

      console.log('Transacción enviada, hash:', hash);

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      console.log('Recibo de la transacción:', receipt);

      if (receipt.status === 'success') {
        setIsSuccess(true);
      } else {
        setError('La transacción falló');
      }
    } catch (err) {
      console.error('Error al comprar el NFT:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error desconocido al comprar el NFT');
      }
    } finally {
      setIsBuying(false);
    }
  }, [address, walletClient, publicClient]);

  return {
    handleCreateMarketSale,
    isBuying,
    isSuccess,
    error
  };
};
