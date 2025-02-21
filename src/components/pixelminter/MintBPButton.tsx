import React, { useCallback, useState, useEffect } from 'react';
import {
  Transaction,
  TransactionButton,
  TransactionStatus,
  TransactionStatusLabel,
  TransactionStatusAction,
} from '@coinbase/onchainkit/transaction';
import type { LifeCycleStatus } from '@coinbase/onchainkit/transaction';
import { useAccount } from 'wagmi';
import { BasePaintAbi } from '../../abi/BasePaintAbi';
import { State } from '../../types/types';
import { calculateDay } from '../../utils/dateUtils';

interface MintBPButtonProps {
  state: State;
  encodedData: string;
  onEncode: () => void;
  resetEncodedState: () => void;
}

const MintBPButton: React.FC<MintBPButtonProps> = ({
  state,
  encodedData,
  onEncode,
  resetEncodedState,
}) => {
  const { address } = useAccount();
  const [currentDay, setCurrentDay] = useState<number | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [transactionStatus, setTransactionStatus] = useState<string>('');
  const [isTransactionComplete, setIsTransactionComplete] = useState(false);
  const [key, setKey] = useState<number>(0);

  useEffect(() => {
    calculateDay().then(setCurrentDay).catch(console.error);
  }, []);

  const handleOnStatus = useCallback((status: LifeCycleStatus) => {
    setTransactionStatus(status.statusName);
    if (status.statusName === 'success') {
      setTxHash(status.statusData.transactionReceipts[0].transactionHash);
      setIsTransactionComplete(true);

      setTimeout(() => {
        setIsTransactionComplete(false);
        setTransactionStatus('');
        setTxHash(null);
        setKey(prevKey => prevKey + 1);
        resetEncodedState(); // Resetear el estado codificado
      }, 5000);
    }
  }, [resetEncodedState]);

  const contracts = currentDay && encodedData ? [
    {
      address: '0xBa5e05cb26b78eDa3A2f8e3b3814726305dcAc83' as `0x${string}`,
      abi: BasePaintAbi,
      functionName: 'paint',
      args: [
        BigInt(currentDay).toString(),
        BigInt(state.brushData?.tokenId || 0).toString(),
        `0x${encodedData}` as `0x${string}`
      ],
    },
  ] : [];

  if (!address || !currentDay) return null;

  return (
    <div className="flex flex-col items-center gap-2">
      {!encodedData ? (
        <button
          onClick={onEncode}
          className="h-8 w-full bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-300 flex items-center justify-center p-2 rounded-md shadow-sm text-sm"
        >
          Encode BP
        </button>
      ) : !isTransactionComplete ? (
        <Transaction
          key={key}
          chainId={8453}
          contracts={contracts}
          onStatus={handleOnStatus}
        >
          <TransactionButton text="Mint BP" />
          <TransactionStatus>
            <TransactionStatusLabel />
            {transactionStatus !== 'success' && <TransactionStatusAction />}
          </TransactionStatus>
        </Transaction>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm text-gray-600">
            Transaction successful. You can encode and mint another BP in 5 seconds.
          </p>
          {txHash && (
            <p className="text-sm text-gray-600">
              Transaction Hash: {txHash}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default MintBPButton;