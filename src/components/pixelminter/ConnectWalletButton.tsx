/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useCallback } from 'react';
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownLink,
  WalletDropdownDisconnect,
} from '@coinbase/onchainkit/wallet';
import {
  Address,
  Avatar,
  Name,
  Identity,
  EthBalance,
  Badge,
} from '@coinbase/onchainkit/identity';
import { useAccount, useContractReads, usePublicClient } from 'wagmi';
import { BasePaintBrushAbi } from '../../abi/BasePaintBrushAbi';
import { getContract, ContractFunctionExecutionError } from 'viem';
import { BrushData } from '../../types/types';
import { useBrushData } from '../../hooks/useBrushData';

const DefaultAvatar = () => (
  <div className="h-6 w-6 bg-gray-300 rounded-full flex items-center justify-center">
    <span className="text-xs text-gray-600">?</span>
  </div>
);

const LoadingAvatar = () => (
  <div className="h-6 w-6 bg-gray-200 rounded-full animate-pulse"></div>
);

const ConnectWalletButton: React.FC<{ updateBrushData: (data: BrushData | null) => void }> = ({ updateBrushData }) => {
  const { userTokenIds, brushData, isLoading, balance } = useBrushData();

  useEffect(() => {
    if (brushData) {
      updateBrushData(brushData);
    }
  }, [brushData, updateBrushData]);

  return (
    <div className="flex justify-end">
      <Wallet>
        <ConnectWallet
          className="font-bold py-2 px-3 rounded-full transition-colors duration-200 bg-[var(--bg-ock-primary)] hover:bg-[var(--bg-ock-primary-hover)] active:bg-[var(--bg-ock-primary-active)] text-[var(--text-ock-inverse)]"
          withWalletAggregator
          text="Connect Wallet"
        >
          <Avatar
            className="h-6 w-6 mr-2"
            defaultComponent={<DefaultAvatar />}
            loadingComponent={<LoadingAvatar />}
          />
          <Name className="text-[var(--text-ock-inverse)]" />
        </ConnectWallet>
        <WalletDropdown>
          <Identity
            className="px-4 pt-3 pb-2 hover:bg-[var(--bg-ock-default-hover)]"
            hasCopyAddressOnClick
            schemaId="0xf8b05c79f090979bf4a80270aba232dff11a10d9ca55c4f88de95317970f0de9"
          >
            <Avatar
              className="h-10 w-10"
              defaultComponent={<DefaultAvatar />}
              loadingComponent={<LoadingAvatar />}
            >
              <Badge />
            </Avatar>
            <Name />
            <Address className="text-[var(--text-ock-foreground-muted)]" />
            <EthBalance />
            {!isLoading && balance && (
              <div className="text-[var(--text-ock-foreground-muted)]">
                Balance: {balance.toString()}
              </div>
            )}
            {!isLoading && userTokenIds.length > 0 && (
              <div className="text-[var(--text-ock-foreground-muted)]">
                Token IDs: {userTokenIds.join(', ')}
              </div>
            )}
            {brushData && (
              <div className="text-[var(--text-ock-foreground-muted)]">
                Token ID: {brushData.tokenId}, Pixels per day: {brushData.pixelsPerDay}
              </div>
            )}
          </Identity>
          <WalletDropdownLink
            className="hover:bg-[var(--bg-ock-default-hover)] px-4 py-2 flex items-center text-[var(--text-ock-foreground)]"
            icon="wallet"
            href="https://wallet.coinbase.com"
          >
            Wallet
          </WalletDropdownLink>
          <WalletDropdownDisconnect className="hover:bg-[var(--bg-ock-default-hover)] px-4 py-2 text-[var(--text-ock-error)]" />
        </WalletDropdown>
      </Wallet>
    </div>
  );
};

export default ConnectWalletButton;