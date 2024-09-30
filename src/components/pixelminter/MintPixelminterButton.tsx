import React, { useCallback, useState, useEffect } from 'react';
import { 
  Transaction, 
  TransactionButton, 
  TransactionStatus, 
  TransactionStatusLabel,
  TransactionStatusAction,
} from '@coinbase/onchainkit/transaction';
import type { LifeCycleStatus } from '@coinbase/onchainkit/transaction';
import { useAccount, useContractRead } from 'wagmi';
import { pixelminterAbi } from '../../abi/pixelminterAbi';
import { State } from '../../types/types';
import { useExportGif } from '../../hooks/useExportGif';
import { useLighthouseUpload } from '../../hooks/useLighthouseUpload';
import { Button } from '../ui/button';

interface MintPixelminterButtonProps {
  state: State;
  fps: number;
}

const MintPixelminterButton: React.FC<MintPixelminterButtonProps> = ({ state, fps }) => {
  const { address } = useAccount();
  const [txHash, setTxHash] = useState<string | null>(null);
  const [transactionStatus, setTransactionStatus] = useState<string>('');
  const [isTransactionComplete, setIsTransactionComplete] = useState(false);
  const [key, setKey] = useState<number>(0);
  const [ipfsHash, setIpfsHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mintFee, setMintFee] = useState<bigint>(BigInt(0));

  const { exportGif, isExporting } = useExportGif(state, fps);
  const { uploadToLighthouse, uploading } = useLighthouseUpload();

  // Leer el fee de minteo del contrato
  const { data: mintFeeData } = useContractRead({
    address: '0x70790c3c3d8879b4d838235bc889c162ecf50ad2',
    abi: pixelminterAbi,
    functionName: 'getMintFeeWei',
  });

  useEffect(() => {
    if (mintFeeData) {
      setMintFee(BigInt(mintFeeData.toString()));
    }
  }, [mintFeeData]);

  const handleOnStatus = useCallback((status: LifeCycleStatus) => {
    console.log('Estado de la transacción:', status);
    setTransactionStatus(status.statusName);
    if (status.statusName === 'success') {
      console.log('Transacción exitosa:', status.statusData);
      setTxHash(status.statusData.transactionReceipts[0].transactionHash);
      setIsTransactionComplete(true);

      setTimeout(() => {
        setIsTransactionComplete(false);
        setTransactionStatus('');
        setTxHash(null);
        setKey(prevKey => prevKey + 1);
        setIpfsHash(null);
      }, 5000);
    } else if (status.statusName === 'error') {
      console.error('Error en la transacción:', status.statusData);
      setError(`Error in transaction: ${status.statusData.message || 'Unknown'}`);
    }
  }, []);

  const prepareAndMint = async () => {
    if (isExporting || uploading) return;
    setError(null);

    try {
      console.log('Starting preparation and minting process');
      const gifBlob = await exportGif();
      console.log("GIF Exported:", gifBlob);

      const gifUploadResponse = await uploadToLighthouse(gifBlob);
      console.log("Respuesta de Lighthouse para GIF:", gifUploadResponse);

      if (gifUploadResponse && gifUploadResponse.data && gifUploadResponse.data.Hash) {
        const gifCID = gifUploadResponse.data.Hash;
        console.log("GIF CID obtained:", gifCID);
        setIpfsHash(gifCID);

        // Crear metadatos JSON
        const metadata = {
          name: "PixelminterWIP",
          description: "Animation Wip BasePaint",
          image: `ipfs://${gifCID}`,
          attributes: [
            {
              trait_type: "Type",
              value: "Gif"
            }
          ]
        };

        const metadataBlob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
        console.log("Metadatos JSON creados:", metadata);

        const metadataUploadResponse = await uploadToLighthouse(metadataBlob);
        console.log("Respuesta de Lighthouse para Metadatos:", metadataUploadResponse);

        if (metadataUploadResponse && metadataUploadResponse.data && metadataUploadResponse.data.Hash) {
          const metadataCID = metadataUploadResponse.data.Hash;
          console.log("CID de los Metadatos obtenido:", metadataCID);
          setIpfsHash(metadataCID);
        } else {
          throw new Error('No se pudo obtener el CID de los metadatos de Lighthouse');
        }
      } else {
        throw new Error('No se pudo obtener el CID del GIF de Lighthouse');
      }
    } catch (error) {
      console.error('Error al preparar para el minteo:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
    }
  };

  const contracts = ipfsHash ? [
    {
      address: '0x70790c3c3d8879b4d838235bc889c162ecf50ad2' as `0x${string}`,
      abi: pixelminterAbi,
      functionName: 'mintNFT',
      args: [
        address as `0x${string}`,
        ipfsHash // CID de los metadatos JSON
      ],
      value: mintFee,
    },
  ] : [];

  if (!address) return null;

  return (
    <div className="flex flex-col items-center gap-2">
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {!ipfsHash ? (
        <Button
          onClick={prepareAndMint}
          className="bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 transition-colors"
          disabled={isExporting || uploading}
        >
          {isExporting ? 'Exporting GIF...' : uploading ? 'Loading...' : 'Mint animation WIP'}
        </Button>
      ) : !isTransactionComplete ? (
        <Transaction
          key={key}
          chainId={8453}
          contracts={contracts}
          onStatus={handleOnStatus}
        >
          <TransactionButton text="Mint animation WIP" className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors" />
          <TransactionStatus>
            <TransactionStatusLabel className="text-gray-300" />
            {transactionStatus !== 'success' && <TransactionStatusAction className="text-blue-500" />}
          </TransactionStatus>
        </Transaction>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm text-gray-600">
            Transaction successful. You can mint another NFT in 5 seconds.
          </p>
          {txHash && (
            <p className="text-sm text-gray-600">
              Transaction hash: {txHash}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default MintPixelminterButton;