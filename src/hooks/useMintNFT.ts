import { useState, useCallback } from 'react';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { parseEther, Address } from 'viem';
import { GetonBoatBftsABI } from '../abi/GetonBoatBfts.abi';
import { useLighthouseUpload } from './useLighthouseUpload';
import { toast } from 'react-hot-toast';

export const useMintNFT = () => {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { uploadToLighthouse, uploading: isUploading } = useLighthouseUpload();
  const [isMinting, setIsMinting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mintNFT = useCallback(async (
    name: string,
    description: string,
    imageFile: File
  ) => {
    if (!address || !walletClient || !publicClient) {
      setError('Billetera no conectada o cliente no disponible');
      return;
    }

    setIsMinting(true);
    setError(null);

    try {
      // Subir la imagen a IPFS usando Lighthouse
      const imageUploadResponse = await uploadToLighthouse(imageFile);
      const imageUrl = `https://gateway.lighthouse.storage/ipfs/${imageUploadResponse.data.Hash}`;

      // Crear los metadatos del NFT
      const metadata = {
        name,
        description,
        image: imageUrl
      };

      // Subir los metadatos a IPFS
      const metadataBlob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
      const metadataUploadResponse = await uploadToLighthouse(metadataBlob);
      const tokenURI = `https://gateway.lighthouse.storage/ipfs/${metadataUploadResponse.data.Hash}`;

      // Obtener el precio de minteo del contrato
      const mintPrice = await publicClient.readContract({
        address: process.env.NEXT_PUBLIC_GETONBOAT_MINT_ADDRESS as Address,
        abi: GetonBoatBftsABI,
        functionName: 'mintPrice',
      });

      // Estimar el gas necesario
      const gasEstimate = await publicClient.estimateContractGas({
        address: process.env.NEXT_PUBLIC_GETONBOAT_MINT_ADDRESS as Address,
        abi: GetonBoatBftsABI,
        functionName: 'mintNFT',
        args: [tokenURI],
        account: address,
        value: mintPrice,
      });

      // Aumentar la estimación de gas en un 20% para asegurar que sea suficiente
      const gasLimit = BigInt(Math.floor(Number(gasEstimate) * 1.2));

      // Ejecutar la transacción de minteo
      const hash = await walletClient.writeContract({
        address: process.env.NEXT_PUBLIC_GETONBOAT_MINT_ADDRESS as Address,
        abi: GetonBoatBftsABI,
        functionName: 'mintNFT',
        args: [tokenURI],
        value: mintPrice,
        gas: gasLimit,
      });

      console.log('Transacción de minteo enviada, hash:', hash);

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      console.log('Recibo de la transacción de minteo:', receipt);

      if (receipt.status === 'success') {
        toast.success('NFT minteado con éxito');
      } else {
        throw new Error('La transacción de minteo falló');
      }

      return receipt;
    } catch (err) {
      console.error('Error al mintear el NFT:', err);
      if (err instanceof Error) {
        setError(err.message);
        toast.error(err.message);
      } else {
        setError('Error desconocido al mintear el NFT');
        toast.error('Error desconocido al mintear el NFT');
      }
    } finally {
      setIsMinting(false);
    }
  }, [address, walletClient, publicClient, uploadToLighthouse]);

  return {
    mintNFT,
    isMinting,
    isUploading,
    error
  };
};