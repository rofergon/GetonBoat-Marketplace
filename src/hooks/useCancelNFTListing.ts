import { useState, useCallback } from 'react';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { marketplaceAbi } from '../abi/marketplace.abi';

export const useCancelNFTListing = () => {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleCancelListing = useCallback(async (marketItemId: bigint) => {
    if (!address || !walletClient || !publicClient) {
      setError('Wallet no conectada o cliente no disponible');
      return;
    }

    setIsCancelling(true);
    setError(null);
    setIsSuccess(false);

    try {
      const { request } = await publicClient.simulateContract({
        account: address,
        address: process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS as `0x${string}`,
        abi: marketplaceAbi,
        functionName: 'cancelMarketItem',
        args: [marketItemId],
      });

      const hash = await walletClient.writeContract(request);

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      if (receipt.status === 'success') {
        setIsSuccess(true);
      } else {
        setError('La transacción falló');
      }
    } catch (err) {
      console.error('Error al cancelar el listado:', err);
      setError('Error al cancelar el listado');
    } finally {
      setIsCancelling(false);
    }
  }, [address, walletClient, publicClient]);

  return {
    handleCancelListing,
    isCancelling,
    isSuccess,
    error
  };
};